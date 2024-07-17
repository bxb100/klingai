import { Action, ActionPanel, Detail, getPreferenceValues, Grid, open } from "@raycast/api";
import { userWorksPersonalV2 } from "./api/history";
import { showFailureToast } from "@raycast/utils";
import { workSchema } from "./types";
import { z } from "zod";
import { homedir } from "node:os";
import fetch from "node-fetch";
import * as fs from "node:fs";
import HistoryDetail from "./component/HistoryDetail";

export default function Command() {
  const { cookie } = getPreferenceValues<Preferences>();
  const { isLoading, data: history, pagination, error } = userWorksPersonalV2(cookie);

  if (error) {
    showFailureToast("Failed to fetch data", error);
    return <Grid.EmptyView />;
  }

  return (
    <Grid isLoading={isLoading} pagination={pagination}>
      {history &&
        history.map((item) => (
          <Grid.Section title={item.task.taskInfo.arguments[0].value} key={item.task.id}>
            {item.works.map((work) => (
              <Grid.Item
                actions={
                  <ActionPanel>
                    <Action.Push title={"Detail"} target={<HistoryDetail work={work} />} />
                  </ActionPanel>
                }
                content={work.resource.resource + "?x-oss-process=image/resize%2Cw_376%2Ch_376%2Cm_mfit"}
                key={work.workItemId}
              />
            ))}
          </Grid.Section>
        ))}
    </Grid>
  );
}
