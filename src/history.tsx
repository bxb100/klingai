import { Action, ActionPanel, getPreferenceValues, Grid, Icon, Keyboard } from "@raycast/api";
import { userWorksPersonalV2 } from "./api/history";
import { showFailureToast } from "@raycast/utils";
import HistoryDetail from "./component/HistoryDetail";
import { deleteWorks } from "./api/task";
import { useEffect, useState } from "react";
import { imageURLPreviewArguments } from "./util";
import { point } from "./api/point";
import Shortcut = Keyboard.Shortcut;

export default function Command() {
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search");
  const [contentType, setContentType] = useState("");
  const [favored, setFavored] = useState("false");

  const { cookie } = getPreferenceValues<Preferences>();
  const { isLoading, data: history, pagination, error, mutate } = userWorksPersonalV2(cookie, contentType, favored);

  useEffect(() => {
    point(cookie).then((res) => {
      setSearchPlaceholder("剩余灵感值: " + (res.data.total / 100).toFixed(2));
    });
  }, []);

  if (error) {
    showFailureToast("Failed to fetch data", error);
    return <Grid.EmptyView />;
  }

  function deleteTask(taskId: number, workId: number) {
    deleteWorks(
      {
        workInfos: [
          {
            taskId: taskId,
            workId: workId,
          },
        ],
      },
      cookie,
    )
      .then(() => {
        mutate();
      })
      .catch((err) => showFailureToast(err, { title: "Failed to delete work" }));
  }

  return (
    <Grid
      isLoading={isLoading}
      pagination={pagination}
      searchBarPlaceholder={searchPlaceholder}
      searchBarAccessory={
        <Grid.Dropdown
          tooltip={"Select Content Type"}
          storeValue={true}
          defaultValue={contentType}
          onChange={setContentType}
        >
          <Grid.Dropdown.Item title={"全部"} value={""} />
          <Grid.Dropdown.Item title={"图片"} value={"image"} />
          <Grid.Dropdown.Item title={"视频"} value={"video"} />
        </Grid.Dropdown>
      }
    >
      {history &&
        history.map((item) => (
          <Grid.Section title={item.task.taskInfo.arguments[0].value} key={item.task.id}>
            {item.works.map((work) => {
              return (
                <Grid.Item
                  actions={
                    <ActionPanel>
                      <Action.Push title={"Detail"} target={<HistoryDetail work={work} />} icon={Icon.Bird} />
                      <Action
                        title={"我收藏的"}
                        icon={favored == "true" ? Icon.Star : Icon.StarDisabled}
                        onAction={() => {
                          setFavored(favored == "true" ? "false" : "true");
                          mutate();
                        }}
                      />
                      <Action
                        icon={Icon.Trash}
                        style={Action.Style.Destructive}
                        title={"Delete"}
                        onAction={() => deleteTask(work.taskId, work.workId)}
                        shortcut={Shortcut.Common.Remove}
                      />
                    </ActionPanel>
                  }
                  content={{
                    source:
                      (work.contentType === "video" ? work.cover.resource : work.resource.resource) +
                      imageURLPreviewArguments,
                    fallback: "fail.png",
                  }}
                  key={work.workId}
                />
              );
            })}
          </Grid.Section>
        ))}
    </Grid>
  );
}
