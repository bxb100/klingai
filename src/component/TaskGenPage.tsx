import React, { useEffect, useState } from "react";
import { checkStatusUntilDone } from "../api/task";
import { taskStatusResSchema } from "../types";
import { z } from "zod";
import { Action, ActionPanel, Grid } from "@raycast/api";
import HistoryDetail from "./HistoryDetail";
import { showFailureToast } from "@raycast/utils";
import { imageURLPreviewArguments, isTaskStatusFailed } from "../util";

export default function TaskGenPage({ id, cookie }: { id: number; cookie: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<z.infer<typeof taskStatusResSchema>>();

  useEffect(() => {
    const subscription = checkStatusUntilDone(String(id), cookie, setData).subscribe({
      next: (v) => {
        if (isTaskStatusFailed(v.data.status)) {
          showFailureToast(new Error(v.message + v.data.status), { title: "Can't generate image" });
        }
      },
      error: (err) => {
        showFailureToast(err, { title: "Failed to fetch data" });
      },
      complete: () => {
        setLoading(false);
      },
    });
    return () => {
      subscription.unsubscribe();
    };
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
              content={{
                source: isTaskStatusFailed(work.status)
                  ? "fail.png"
                  : work.resource.resource + imageURLPreviewArguments,
              }}
              key={work.workItemId}
            />
          ))}
        </Grid.Section>
      )}
    </Grid>
  );
}
