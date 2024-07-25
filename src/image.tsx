import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { FormValidation, showFailureToast, useForm } from "@raycast/utils";
import { submit } from "./api/task";
import { useEffect } from "react";
import { z } from "zod";
import path from "node:path";
import { argumentSchema, taskInputSchema, Type } from "./types";
import TaskGenPage from "./component/TaskGenPage";
import { styles } from "./util";
import { dailyReward } from "./api/point";
import { FormInput, FormInputTypeContext, submitUpload } from "./component/FormInput";

type FormValues = {
  prompt: string;
  style: string;
  aspect_ratio: string;
  imageCount: string;
  fidelity?: string;
  biz: string;
  filePath?: string[];
  fromWork?: string;
};

export default function Command() {
  const { push } = useNavigation();

  const { handleSubmit, itemProps, setValue } = useForm<FormValues>({
    onSubmit: async (values) => {
      const { url, fromWorkId } = await submitUpload(values);
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
        args.push({ name: "fidelity", value: values.fidelity!.trim() });
        inputs.push({ name: "input", inputType: "URL", url: url, fromWorkId });
      }
      const toast = await showToast(Toast.Style.Animated, "正在生成图片", "请稍等片刻");

      try {
        const res = await submit({
          arguments: args,
          type,
          inputs,
        });
        console.debug(res);
        toast.style = Toast.Style.Success;
        toast.title = "生成任务已提交";
        toast.message = `任务ID: ${res.data.task.id}`;
        push(<TaskGenPage id={res.data.task.id} />);
      } catch (e) {
        await showFailureToast(e, { title: "Task submission failed" });
      }
    },
    initialValues: {
      prompt: "",
      aspect_ratio: "1:1",
      imageCount: "4",
      fidelity: "0.25",
      style: "默认",
      filePath: undefined,
      fromWork: undefined,
    },
    validation: {
      prompt: (value) => {
        if (!value) {
          return "Required";
        }
        if (value.length > 500) {
          return "The item must be less than 500 characters";
        }
      },
      aspect_ratio: FormValidation.Required,
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
          if (ext !== ".jpg" && ext !== ".png") {
            return "The file must be a jpg or png";
          }
        }
      },
    },
  });

  useEffect(() => {
    // get daily free point
    dailyReward();
  }, []);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="立即生成" onSubmit={handleSubmit} icon={Icon.Image} />
        </ActionPanel>
      }
      searchBarAccessory={<Form.LinkAccessory target="https://klingai.kuaishou.com/text-to-image/new" text="AI 图片" />}
    >
      <Form.TextArea title={"创意描述"} {...itemProps.prompt} />

      <FormInputTypeContext.Provider value={"image"}>
        <FormInput itemProps={itemProps} setValue={setValue} />
      </FormInputTypeContext.Provider>

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
      <Form.Dropdown title={"生成数量"} {...itemProps.imageCount}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
          <Form.Dropdown.Item title={value.toString()} value={value.toString()} key={value} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
