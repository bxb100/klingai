import { z } from "zod";
import { workSchema } from "../types";
import { homedir } from "node:os";
import { Action, ActionPanel, Detail, open } from "@raycast/api";
import fs from "node:fs";
import fetch from "node-fetch";

export default function HistoryDetail({ work }: { work: z.infer<typeof workSchema> }) {
  const DOWNLOADS_DIR = `${homedir()}/Downloads`;

  return (
    <Detail
      markdown={`![temp](${work.resource.resource})`}
      actions={
        <ActionPanel>
          <Action.ShowInFinder
            title={"Download"}
            path={`${DOWNLOADS_DIR}/.DS_Store`}
            onShow={() => {
              const dest = `${DOWNLOADS_DIR}/${work.workId}.png`;
              if (fs.existsSync(dest)) {
                return;
              }
              fetch(work.resource.resource).then(async (res) => {
                const fileStream = fs.createWriteStream(dest);
                await new Promise((resolve, reject) => {
                  res.body!.pipe(fileStream);
                  res.body!.on("error", reject);
                  fileStream.on("finish", resolve);
                });
              });
            }}
          />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
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
              <Detail.Metadata.TagList title={"参考图"} key={input.url}>
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
