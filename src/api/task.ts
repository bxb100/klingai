import { deleteWorksSchema, nullResSchema, taskStatusResSchema, taskSubmitResSchema, taskSubmitSchema } from "../types";
import { z } from "zod";
import { defer, delay, map, retry, tap, timer } from "rxjs";
import fetch from "node-fetch";
import { isTaskStatusProcessing } from "../util";

const submitAPI = "https://klingai.kuaishou.com/api/task/submit";
const statusAPI = "https://klingai.kuaishou.com/api/task/status";

export async function submit(task: z.infer<typeof taskSubmitSchema>, cookie: string) {
  const res = await fetch(submitAPI, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(task),
  });

  return (await res.json()) as z.infer<typeof taskSubmitResSchema>;
}

export async function status(taskId: string, cookie: string) {
  const res = await fetch(statusAPI + `?taskId=${taskId}`, {
    headers: {
      Cookie: cookie,
    },
  });

  return (await res.json()) as z.infer<typeof taskStatusResSchema>;
}

export function checkStatusUntilDone(
  taskId: string,
  cookie: string,
  callback: (v: z.infer<typeof taskStatusResSchema>) => void,
) {
  return defer(() => status(taskId, cookie)).pipe(
    tap((res) => callback(res)),
    map((res) => {
      if (isTaskStatusProcessing(res.data.status)) {
        throw new Error(`Task<${taskId}> is still processing`);
      }
      return res;
    }),
    delay(500),
    retry({
      count: 10,
      delay: (_e, b) => timer((2 ^ b) * 300),
    }),
  );
}

export async function deleteTasks(taskIds: number[], cookie: string) {
  const res = await fetch("https://klingai.kuaishou.com/api/task/del", {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskIds }),
  });
  return (await res.json()) as z.infer<typeof nullResSchema>;
}

export async function deleteWorks(payload: z.infer<typeof deleteWorksSchema>, cookie: string) {
  const res = await fetch("https://klingai.kuaishou.com/api/works/del", {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await res.json()) as z.infer<typeof nullResSchema>;
}
