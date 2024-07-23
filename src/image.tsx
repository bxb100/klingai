import { Action, ActionPanel, Form, getPreferenceValues, showToast, Toast, useNavigation } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { submit } from "./api/task";
import { useState } from "react";
import { userWorksPersonalV2 } from "./api/history";
import { z } from "zod";
import path from "node:path";
import { upload } from "./api/upload";
import { argumentSchema, taskInputSchema, Type } from "./types";
import TaskGenPage from "./component/TaskGenPage";
import { imageURLPreviewArguments, styles } from "./util";

type FormValues = {
  prompt: string;
  style: string;
  aspect_ratio: string;
  imageCount: string;
  fidelity?: string;
  biz: string;
  filePath?: string[];
  urlPath?: string;
};

export default function Command() {
  const { cookie } = getPreferenceValues<Preferences>();
  const { isLoading, data } = userWorksPersonalV2(cookie);

  const { push } = useNavigation();

  const { handleSubmit, itemProps, setValue } = useForm<FormValues>({
    onSubmit: async (values) => {
      let url = "";
      if (usingInput === 1 && values.filePath && values.filePath.length > 0) {
        const toast = await showToast({
          style: Toast.Style.Animated,
          title: "正在上传图片",
        });
        try {
          url = await upload(values.filePath[0], cookie, toast);
        } catch (e) {
          toast.style = Toast.Style.Failure;
          toast.title = "图片上传失败, 请重试";
          toast.message = e instanceof Error ? e.message : "未知错误";
          return;
        }
      } else if (usingInput === 2 && values.urlPath) {
        url = values.urlPath;
      }
      const args: z.infer<typeof argumentSchema>[] = [
        { name: "prompt", value: values.prompt },
        {
          name: "style",
          value: values.style,
        },
        { name: "aspect_ratio", value: values.aspect_ratio },
        {
          name: "imageCount",
          value: values.imageCount,
        },
        { name: "biz", value: "klingai" },
      ];
      const inputs: z.infer<typeof taskInputSchema>[] = [];
      let type: z.infer<typeof Type> = "mmu_txt2img_aiweb";
      if (url) {
        type = "mmu_img2img_aiweb";
        args.push({ name: "fidelity", value: values.fidelity! });
        inputs.push({ name: "input", inputType: "URL", url: url });
      }
      const toast = await showToast(Toast.Style.Animated, "正在生成图片", "请稍等片刻");

      const res = await submit(
        {
          arguments: args,
          type,
          inputs,
        },
        cookie,
      );

      toast.style = Toast.Style.Success;
      toast.title = "生成任务已提交";
      toast.message = `任务ID: ${res.data.task.id}`;
      console.log(res.data.task.id);
      push(<TaskGenPage id={res.data.task.id} cookie={cookie} />);
    },
    initialValues: {
      prompt: "",
      aspect_ratio: "1:1",
      imageCount: "4",
      fidelity: "0.25",
      style: "默认",
      filePath: undefined,
      urlPath: undefined,
    },
    validation: {
      prompt: FormValidation.Required,
      aspect_ratio: FormValidation.Required,
      imageCount: (value) => {
        if (!value) {
          return "The item is required";
        }
        if (isNaN(Number(value))) {
          return "The item must be a number";
        }
        if (Number(value) < 1 || Number(value) > 9) {
          return "The item must be between 1 and 9";
        }
      },
      fidelity: (value) => {
        if (value === undefined) {
          return undefined;
        }
        if (isNaN(Number(value))) {
          return "The item must be a number";
        }
        if (Number(value) < 0 || Number(value) > 1) {
          return "The item must be between 0 and 1";
        }
      },
      filePath: (value) => {
        if (value) {
          const ext = path.parse(value[0]).ext;
          if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
            return "The file must be a jpg, jpeg or png";
          }
        }
      },
    },
  });

  const [usingInput, setUsingInput] = useState(0);

  function toggleIn(v: number, b: boolean) {
    if (b) {
      setUsingInput(v);
    } else {
      setUsingInput(0);
      setValue("filePath", undefined);
      setValue("urlPath", undefined);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="立即生成" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      searchBarAccessory={<Form.LinkAccessory target="https://klingai.kuaishou.com/text-to-image/new" text="可灵 AI" />}
    >
      <Form.TextArea title={"创意描述"} {...itemProps.prompt} />
      <Form.Checkbox
        id="in0"
        value={usingInput === 1}
        onChange={(v) => toggleIn(1, v)}
        title={"参考图/垫图"}
        label={"本地上传"}
        info={"参考上传图像的风格主题, 生成符合文本描述的作品"}
      />
      <Form.Checkbox id="in1" label={"历史作品"} value={usingInput === 2} onChange={(v) => toggleIn(2, v)} />

      {usingInput === 1 && <Form.FilePicker title={""} allowMultipleSelection={false} {...itemProps.filePath} />}
      {usingInput === 2 && (
        <Form.Dropdown isLoading={isLoading} {...itemProps.urlPath}>
          {data.map((task) => {
            return (
              <Form.Dropdown.Section key={task.task.id}>
                {task.works
                  .filter((work) => work.resource.resource)
                  .map((work) => (
                    <Form.Dropdown.Item
                      key={work.workId}
                      value={work.resource.resource}
                      icon={work.resource.resource + imageURLPreviewArguments}
                      title={task.task.taskInfo.arguments[0].value}
                    />
                  ))}
              </Form.Dropdown.Section>
            );
          })}
        </Form.Dropdown>
      )}
      {usingInput > 0 && <Form.TextField title={"参考强度"} info={"数值越大参考强度越大"} {...itemProps.fidelity} />}

      <Form.Separator />
      <Form.Dropdown title={"风格"} {...itemProps.style}>
        {styles.map((value) => {
          const zh = value[1].caption.zh;
          return <Form.Dropdown.Item title={zh} value={zh} icon={value[1].image} key={value[0]} />;
        })}
      </Form.Dropdown>
      <Form.Dropdown title={"比例"} {...itemProps.aspect_ratio}>
        <Form.Dropdown.Item title={"1:1"} value={"1:1"} />
        <Form.Dropdown.Item title={"16:9"} value={"16:9"} />
        <Form.Dropdown.Item title={"4:3"} value={"4:3"} />
        <Form.Dropdown.Item title={"3:2"} value={"3:2"} />
        <Form.Dropdown.Item title={"2:3"} value={"2:3"} />
        <Form.Dropdown.Item title={"3:4"} value={"3:4"} />
        <Form.Dropdown.Item title={"9:16"} value={"9:16"} />
      </Form.Dropdown>
      <Form.TextField title={"生成数量"} {...itemProps.imageCount} />
    </Form>
  );
}
