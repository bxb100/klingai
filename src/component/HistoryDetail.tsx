import { z } from "zod";
import { workSchema } from "../types";
import { homedir } from "node:os";
import { Action, ActionPanel, Color, Detail, Icon, Keyboard, open, showToast, Toast } from "@raycast/api";
import fs from "node:fs";
import fetch from "node-fetch";
import { useEffect, useState } from "react";
import { isTaskStatusFailed, lN } from "../util";
import Style = Toast.Style;
import Shortcut = Keyboard.Shortcut;

export default function HistoryDetail({ works, index }: { works: z.infer<typeof workSchema>[]; index: number }) {
  const [i, setI] = useState(index);

  const work = works ? works[i] : undefined;

  const DOWNLOADS_DIR = `${homedir()}/Downloads`;
  const [imageMd, setImageMd] = useState("");
  const isVideo = work?.type.indexOf("2video") !== -1;

  useEffect(() => {
    if (work) {
      if (isTaskStatusFailed(work.status)) {
        setImageMd(`![temp](fail.png?raycast-height=350)`);
      } else {
        const url = work.contentType === "video" ? work.cover.resource : work?.resource.resource;
        setImageMd(`![temp](${url}?raycast-height=350)`);
      }
    }
  }, [work]);

  return (
    <Detail
      navigationTitle={`${i + 1}/${works.length}`}
      markdown={imageMd}
      actions={
        <ActionPanel>
          <Action
            icon={Icon.Download}
            title={"Download"}
            onAction={async () => {
              if (!work) {
                return;
              }
              const toast = await showToast(Style.Animated, "Downloading...", "Please wait");
              const ext = work?.contentType === "video" ? "mp4" : "png";
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
          <Action.Open
            title={"Open in Browser"}
            target={work?.resource.resource || ""}
            icon={Icon.Compass}
            shortcut={Shortcut.Common.Open}
          />
          <Action
            key={"u" + i}
            icon={Icon.ArrowUpCircle}
            title={"Previous"}
            onAction={() => {
              setI((i) => (i - 1 + works.length) % works.length);
            }}
            shortcut={Shortcut.Common.MoveUp}
          />
          <Action
            key={"d" + i}
            icon={Icon.ArrowDownCircle}
            title={"Next"}
            onAction={() => {
              setI((i) => (i + 1) % works.length);
            }}
            shortcut={Shortcut.Common.MoveDown}
          />
        </ActionPanel>
      }
      metadata={
        work && (
          <Detail.Metadata>
            {isTaskStatusFailed(work.status) && (
              <Detail.Metadata.Label
                title={"任务状态"}
                text={Object.keys(lN)[Object.values(lN).indexOf(work.status)] ?? "未知"}
                icon={{ source: Icon.Warning, tintColor: Color.Red }}
              />
            )}

            {isVideo && <Detail.Metadata.Link title={"播放"} text={"在浏览器中打开"} target={work.resource.resource} />}

            {work.taskInfo.arguments.map((argument) => {
              if (!argument.value) {
                return null;
              }
              let title = "";
              switch (argument.name) {
                case "prompt":
                  title = "创意描述";
                  break;
                case "aspect_ratio":
                  title = isVideo ? "视频比例" : "图片比例";
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
        )
      }
    />
  );
}
