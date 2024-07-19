import React, { useEffect, useState } from "react";
import { checkStatusUntilDone } from "../api/task";
import { taskStatusResSchema } from "../types";
import { z } from "zod";
import { Action, ActionPanel, Grid } from "@raycast/api";
import HistoryDetail from "./HistoryDetail";
import { showFailureToast } from "@raycast/utils";
import { imageURLPreviewArguments } from "../util";

export default function TaskGenPage({ id, cookie }: { id: number; cookie: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<z.infer<typeof taskStatusResSchema>>();

  useEffect(() => {
    console.log("fetching data", id, cookie);
    const subscription = checkStatusUntilDone(String(id), cookie, setData).subscribe({
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
                source: work.resource.resource + imageURLPreviewArguments,
                fallback: "fail.png",
              }}
              key={work.workItemId}
            />
          ))}
        </Grid.Section>
      )}
    </Grid>
  );
}
