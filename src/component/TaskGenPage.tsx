import React, { useEffect, useState } from "react";
import { checkStatusUntilDone } from "../api/task";
import { taskStatusResSchema } from "../types";
import { z } from "zod";
import { Action, ActionPanel, Grid } from "@raycast/api";
import HistoryDetail from "./HistoryDetail";
import { showFailureToast } from "@raycast/utils";
import { imageURLPreviewArguments, isTaskStatusFailed } from "../util";

export default function TaskGenPage({ id, retryDelay }: { id: number; retryDelay?: number }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<z.infer<typeof taskStatusResSchema>>();

  useEffect(() => {
    const subscription = checkStatusUntilDone(String(id), setData, retryDelay).subscribe({
      next: (v) => {
        if (v.status != 200) {
          showFailureToast(new Error(v.message), { title: "Failed to fetch data" });
          return;
        }
        if (isTaskStatusFailed(v.data.status)) {
          showFailureToast(new Error(v.message + v.data.status), { title: "Can't generate image" });
          return;
        }
        setData(v);
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
  }, [id]);

  return (
    <Grid isLoading={loading}>
      {data?.data && (
        <Grid.Section title={data.data.task.taskInfo.arguments[0].value}>
          {data.data.works.map((work, index) => (
            <Grid.Item
              actions={
                <ActionPanel>
                  <Action.Push title={"Detail"} target={<HistoryDetail works={data.data.works} index={index} />} />
                </ActionPanel>
              }
              content={{
                source: isTaskStatusFailed(work.status)
                  ? "fail.png"
                  : (work.contentType === "video" ? work.cover.resource : work.resource.resource) +
                    imageURLPreviewArguments,
                fallback: work.type.indexOf("2video") != -1 ? "video-loading.png" : undefined,
              }}
              key={work.workItemId}
            />
          ))}
        </Grid.Section>
      )}
    </Grid>
  );
}
