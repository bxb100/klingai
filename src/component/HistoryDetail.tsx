import { z } from "zod";
import { workSchema } from "../types";
import { homedir } from "node:os";
import { Action, ActionPanel, Color, Detail, Icon, open, showToast, Toast } from "@raycast/api";
import fs from "node:fs";
import fetch from "node-fetch";
import { useEffect, useState } from "react";
import { isTaskStatusFailed, lN } from "../util";
import Style = Toast.Style;

export default function HistoryDetail({ work }: { work: z.infer<typeof workSchema> }) {
  const DOWNLOADS_DIR = `${homedir()}/Downloads`;
  const [imageMd, setImageMd] = useState("");

  useEffect(() => {
    if (isTaskStatusFailed(work.status)) {
      setImageMd(`![temp](fail.png?raycast-height=350)`);
    } else {
      const url = work.contentType === "video" ? work.cover.resource : work.resource.resource;
      setImageMd(`![temp](${url}?raycast-height=350)`);
    }
  }, [work]);

  return (
    <Detail
      markdown={imageMd}
      actions={
        <ActionPanel>
          <Action
            icon={Icon.Download}
            title={"Download"}
            onAction={async () => {
              const toast = await showToast(Style.Animated, "Downloading...", "Please wait");
              const ext = work.contentType === "video" ? "mp4" : "png";
              const dest = `${DOWNLOADS_DIR}/${work.workId}.${ext}`;
              if (!fs.existsSync(dest)) {
                await fetch(work.resource.resource).then(async (res) => {
                  const fileStream = fs.createWriteStream(dest);
                  return await new Promise((resolve, reject) => {
                    res.body!.pipe(fileStream);
                    res.body!.on("error", reject);
                    fileStream.on("finish", resolve);
                  });
                });
              }
              toast.style = Style.Success;
              toast.title = "Downloaded";
              toast.message = "The file has been downloaded";
              await open(DOWNLOADS_DIR);
            }}
          />
          <Action.Open title={"Open in Browser"} target={work.resource.resource} icon={Icon.Compass} />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          {isTaskStatusFailed(work.status) && (
            <Detail.Metadata.Label
              title={"任务状态"}
              text={Object.keys(lN)[Object.values(lN).indexOf(work.status)] ?? "未知"}
              icon={{ source: Icon.Warning, tintColor: Color.Red }}
            />
          )}

          {work.taskInfo.arguments.map((argument) => {
            let title = "";
            switch (argument.name) {
              case "prompt":
                title = "创意描述";
                break;
              case "aspect_ratio":
                title = "图片比例";
                break;
              case "imageCount":
                title = "图片数量";
                break;
              case "style":
                title = "风格";
                break;
              case "fidelity":
                title = "参考强度";
                break;
              case "negative_prompt":
                title = "不希望呈现的内容";
                break;
              case "cfg":
                title = "创意强度";
                break;
              case "duration":
                title = "视频时长(s)";
                break;
              default:
                return null;
            }
            return <Detail.Metadata.Label title={title} text={argument.value} key={argument.name} />;
          })}

          {work.taskInfo.inputs
            .filter((i) => i.inputType === "URL")
            .map((input) => (
              <Detail.Metadata.TagList title={"参考图/垫图"} key={input.url}>
                <Detail.Metadata.TagList.Item
                  icon={input.url + "?x-oss-process=image/resize%2Cw_36%2Ch_36%2Cm_mfit"}
                  onAction={() => open(input.url)}
                />
              </Detail.Metadata.TagList>
            ))}
        </Detail.Metadata>
      }
    />
  );
}
