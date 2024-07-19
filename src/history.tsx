import { Action, ActionPanel, getPreferenceValues, Grid, Icon } from "@raycast/api";
import { userWorksPersonalV2 } from "./api/history";
import { showFailureToast } from "@raycast/utils";
import HistoryDetail from "./component/HistoryDetail";
import { deleteWorks } from "./api/task";
import { useState } from "react";
import { imageURLPreviewArguments } from "./util";

export default function Command() {
  const [limitation, setLimitation] = useState("Search");
  const { cookie } = getPreferenceValues<Preferences>();
  const {
    isLoading,
    data: history,
    pagination,
    error,
    mutate,
  } = userWorksPersonalV2(cookie, (limitations) => {
    setLimitation(
      "Quota: " +
        limitations
          .map((i) => {
            switch (i.type) {
              case "mmu_txt2img_aiweb":
                return `Text to Image ${i.remaining}/${i.limit}`;
              case "m2v_img2video_hq":
                return `Image to Video ${i.remaining}/${i.limit}`;
              case "m2v_txt2video_hq":
                return `Text to Video ${i.remaining}/${i.limit}`;
            }
          })
          .filter(Boolean)
          .join(", "),
    );
  });

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
    <Grid isLoading={isLoading} pagination={pagination} searchBarPlaceholder={limitation}>
      {history &&
        history.map((item) => (
          <Grid.Section title={item.task.taskInfo.arguments[0].value} key={item.task.id}>
            {item.works.map((work) => {
              return (
                <Grid.Item
                  actions={
                    <ActionPanel>
                      <Action.Push title={"Detail"} target={<HistoryDetail work={work} />} />
                      <Action
                        icon={Icon.Trash}
                        style={Action.Style.Destructive}
                        title={"Delete"}
                        onAction={() => deleteTask(work.taskId, work.workId)}
                      />
                    </ActionPanel>
                  }
                  content={{
                    source: work.resource.resource + imageURLPreviewArguments,
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
