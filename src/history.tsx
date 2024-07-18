import { Action, ActionPanel, getPreferenceValues, Grid, Icon } from "@raycast/api";
import { userWorksPersonalV2 } from "./api/history";
import { showFailureToast } from "@raycast/utils";
import HistoryDetail from "./component/HistoryDetail";
import { deleteWorks } from "./api/task";

export default function Command() {
  const { cookie } = getPreferenceValues<Preferences>();
  const { isLoading, data: history, pagination, error, mutate } = userWorksPersonalV2(cookie);

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
    <Grid isLoading={isLoading} pagination={pagination}>
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
                    source: work.resource.resource + "?x-oss-process=image/resize%2Cw_376%2Ch_376%2Cm_mfit",
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
