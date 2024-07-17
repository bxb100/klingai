import React, { useEffect, useState } from "react";
import { checkStatusUntilDone } from "../api/task";
import { taskStatusResSchema } from "../types";
import { z } from "zod";
import { Action, ActionPanel, Grid } from "@raycast/api";
import HistoryDetail from "./HistoryDetail";
import { showFailureToast } from "@raycast/utils";

export default function TaskGenPage({ id, cookie }: { id: number; cookie: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<z.infer<typeof taskStatusResSchema>>();

  useEffect(() => {
    console.log("fetching data", id, cookie);
    checkStatusUntilDone(String(id), cookie)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((e) => {
        showFailureToast("Failed to fetch data", e);
      });
  }, [id, cookie]);

  return (
    <Grid isLoading={loading}>
      {data && (
        <Grid.Section title={data.data.task.taskInfo.arguments[0].value}>
          {data.data.works.map((work) => (
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
      )}
    </Grid>
  );
}
