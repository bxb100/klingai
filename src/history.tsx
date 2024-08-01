import { Action, ActionPanel, Grid, Icon, Keyboard } from "@raycast/api";
import { userWorksPersonalV2 } from "./api/history";
import { showFailureToast } from "@raycast/utils";
import HistoryDetail from "./component/HistoryDetail";
import { deleteWorks } from "./api/task";
import { useEffect, useState } from "react";
import { imageURLPreviewArguments, isCookieExpired, isTaskStatusProcessing } from "./util";
import { dailyReward, point } from "./api/point";
import { CookieExpiredPage } from "./component/CookieExpiredPage";
import Shortcut = Keyboard.Shortcut;

export default function Command() {
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search");
  const [contentType, setContentType] = useState("");
  const [favored, setFavored] = useState("false");
  const [cookieExpired, setCookieExpired] = useState(false);

  const { isLoading, data: history, pagination, error, mutate } = userWorksPersonalV2(contentType, favored);

  useEffect(() => {
    dailyReward()
      .then(isCookieExpired)
      .then(setCookieExpired)
      .then(() => point())
      .then((res) => {
        setSearchPlaceholder("剩余灵感值: " + (res.data.total / 100).toFixed(2));
      });
  }, []);

  function deleteTask(taskId: number, workId: number) {
    deleteWorks({
      workInfos: [
        {
          taskId: taskId,
          workId: workId,
        },
      ],
    })
      .then(() => {
        mutate();
      })
      .catch((err) => showFailureToast(err, { title: "Failed to delete work" }));
  }

  if (error || cookieExpired) {
    return <CookieExpiredPage />;
  } else
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
          history.map((item) => {
            const isVideo = item.task.type.indexOf("2video") != -1;
            return (
              <Grid.Section subtitle={item.task.type} title={item.task.taskInfo.arguments[0].value} key={item.task.id}>
                {item.works.map((work) => (
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
                      source: (isVideo ? work.cover.resource : work.resource.resource) + imageURLPreviewArguments,
                      fallback: isTaskStatusProcessing(work.status) && isVideo ? "video-loading.png" : "fail.png",
                    }}
                    key={work.workId}
                  />
                ))}
              </Grid.Section>
            );
          })}
      </Grid>
    );
}
