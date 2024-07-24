import { deleteWorksSchema, nullResSchema, taskStatusResSchema, taskSubmitResSchema, taskSubmitSchema } from "../types";
import { z } from "zod";
import { defer, map, retry, tap } from "rxjs";
import fetch from "node-fetch";
import { isTaskStatusProcessing, lN } from "../util";

const submitAPI = "https://klingai.kuaishou.com/api/task/submit";
const statusAPI = "https://klingai.kuaishou.com/api/task/status";

export async function submit(task: z.infer<typeof taskSubmitSchema>, cookie: string) {
  console.debug("submit", JSON.stringify(task));
  const res = await fetch(submitAPI, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(task),
  });

  const json = (await res.json()) as z.infer<typeof taskSubmitResSchema>;
  if (json.data.status === lN.SENSITIVE_TEXT || json.data.status === lN.SENSITIVE_IMAGE) {
    throw new Error("敏感内容: " + Object.entries(lN).filter(([k, v]) => v === json.data.status)[0][0]);
  }
  return json;
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
  retryDelay?: number,
) {
  return defer(() => status(taskId, cookie)).pipe(
    tap(console.debug),
    tap((res) => callback(res)),
    map((res) => {
      if (isTaskStatusProcessing(res.data.status)) {
        throw new Error(`Task<${taskId}> is still processing`);
      }
      return res;
    }),
    retry({
      count: 300,
      delay: retryDelay ?? 1000,
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
