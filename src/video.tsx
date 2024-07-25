import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { FormValidation, showFailureToast, useForm } from "@raycast/utils";
import { FormInput, FormInputTypeContext, submitUpload } from "./component/FormInput";
import { z } from "zod";
import { argumentSchema, taskInputSchema, Type } from "./types";
import { submit } from "./api/task";
import TaskGenPage from "./component/TaskGenPage";
import { dailyReward } from "./api/point";

type FormValues = {
  prompt: string;
  negative_prompt: string;
  cfg: string;
  duration: string;
  aspect_ratio?: string;
  biz: string;
  camera_json: string;
  filePath?: string[];
  fromWork?: string;
  fidelity?: string;
  genMode: string;
  tail_image_enabled: boolean;
};

export default function Command() {
  const [heroType, setHeroType] = useState<"txt2video" | "img2video" | string>("txt2video");

  const { push } = useNavigation();

  const { itemProps, setValue, handleSubmit } = useForm<FormValues>({
    onSubmit: async (values) => {
      const inputs: z.infer<typeof taskInputSchema>[] = [];
      let type: z.infer<typeof Type> = values.genMode === "0" ? "m2v_txt2video" : "m2v_txt2video_hq";
      const args: z.infer<typeof argumentSchema>[] = [
        {
          name: "prompt",
          value: values.prompt,
        },
        { name: "negative_prompt", value: values.negative_prompt },
        {
          name: "cfg",
          value: values.cfg,
        },
        {
          name: "duration",
          value: values.duration,
        },
        {
          name: "biz",
          value: "klingai",
        },
      ];

      if (heroType === "img2video") {
        args.push({
          name: "tail_image_enabled", // TODO
          value: String(values.tail_image_enabled),
        });
        type = values.genMode === "0" ? "m2v_img2video" : "m2v_img2video_hq";

        const { url, fromWorkId } = await submitUpload(values);
        if (url) {
          inputs.push({ name: "input", inputType: "URL", url: url, fromWorkId });
        } else {
          await showFailureToast(new Error("No image provided"));
          return;
        }
      }
      if (heroType === "txt2video") {
        // TODO
        args.push({
          name: "camera_json",
          value: JSON.stringify({
            type: "empty",
            horizontal: 0,
            vertical: 0,
            zoom: 0,
            tilt: 0,
            pan: 0,
            roll: 0,
          }),
        });
      }

      const toast = await showToast(Toast.Style.Animated, "正在生成视频", "请稍等片刻");

      try {
        const res = await submit({
          arguments: args,
          type,
          inputs,
        });
        console.log(res);
        toast.style = Toast.Style.Success;
        toast.title = "生成任务已提交";
        toast.message = `任务ID: ${res.data.task.id}`;

        push(<TaskGenPage id={res.data.task.id} retryDelay={30000} />);
      } catch (e) {
        await showFailureToast(e, { title: "Task submission failed" });
      }
    },
    initialValues: {
      prompt: "",
      negative_prompt: "",
      cfg: "0.5",
      duration: "5",
      genMode: "0",
      aspect_ratio: "16:9",
      tail_image_enabled: false,
      filePath: undefined,
      fromWork: undefined,
    },
    validation: {
      prompt: FormValidation.Required,
      cfg: (value) => {
        if (value) {
          const v = parseFloat(value);
          if (isNaN(v) || v < 0 || v > 1) {
            return "Invalid value";
          }
        }
      },
      negative_prompt: (value) => {
        if (value && value.length > 200) {
          return "Maximum length is 200 characters";
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
      searchBarAccessory={<Form.LinkAccessory target="https://klingai.kuaishou.com/text-to-video/new" text="AI 视频" />}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="立即生成" onSubmit={handleSubmit} icon={Icon.Video} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id={"heroType"} title={"类型"} defaultValue={heroType} onChange={setHeroType} storeValue={true}>
        <Form.Dropdown.Item title={"文生视频"} value={"txt2video"} />
        <Form.Dropdown.Item title={"图生视频"} value={"img2video"} />
      </Form.Dropdown>

      <FormInputTypeContext.Provider value={"video"}>
        {heroType != "txt2video" && <FormInput itemProps={itemProps} setValue={setValue} />}
      </FormInputTypeContext.Provider>

      <Form.TextArea title={heroType === "txt2video" ? "创意描述" : "图片创意描述(非必填)"} {...itemProps.prompt} />
      <Form.Separator />

      <Form.TextField title={"创意想象力"} {...itemProps.cfg} />
      <Form.Dropdown
        title={"生成模式"}
        {...itemProps.genMode}
        info={"高性能: 生成速度更快\n高表现: 画面质量更佳(会员)"}
      >
        <Form.Dropdown.Item title={"高性能"} value={"0"} />
        <Form.Dropdown.Item title={"高表现"} value={"1"} />
      </Form.Dropdown>
      <Form.Dropdown title={"生成时长"} {...itemProps.duration} info={"10s(会员)"}>
        <Form.Dropdown.Item title={"5s"} value={"5"} />
        <Form.Dropdown.Item title={"10s"} value={"10"} />
      </Form.Dropdown>
      {heroType === "txt2video" && (
        <Form.Dropdown title={"视频比例"} {...itemProps.aspect_ratio}>
          <Form.Dropdown.Item title={"16:9"} value={"16:9"} />
          <Form.Dropdown.Item title={"9:16"} value={"9:16"} />
          <Form.Dropdown.Item title={"1:1"} value={"1:1"} />
        </Form.Dropdown>
      )}

      <Form.Separator />

      <Form.TextArea
        title={"不希望呈现的内容"}
        placeholder={
          "写下你不希望在视频中呈现的内容。\n例如：动画、模糊、变形、毁容、低质量、拼贴、粒状、标志、抽象、插图、计算机生成、扭曲 …"
        }
        {...itemProps.negative_prompt}
      />
    </Form>
  );
}
