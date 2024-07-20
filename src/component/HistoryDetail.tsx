import { z } from "zod";
import { workSchema } from "../types";
import { homedir } from "node:os";
import { Action, ActionPanel, Color, Detail, Icon, open, showToast, Toast } from "@raycast/api";
import fs from "node:fs";
import fetch from "node-fetch";
import { useEffect, useState } from "react";
import { lN } from "../util";
import Style = Toast.Style;

export default function HistoryDetail({ work }: { work: z.infer<typeof workSchema> }) {
  const DOWNLOADS_DIR = `${homedir()}/Downloads`;
  const [imageMd, setImageMd] = useState("");

  useEffect(() => {
    if (work.status === lN.SENSITIVE_RESULT) {
      setImageMd(`![temp](fail.png?raycast-height=350)`);
    } else {
      setImageMd(`![temp](${work.resource.resource}?raycast-height=350)`);
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
              const dest = `${DOWNLOADS_DIR}/${work.workId}.png`;
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
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          {work.status != lN.COMPLETED && (
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
