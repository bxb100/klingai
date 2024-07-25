import { deleteWorksSchema, nullResSchema, taskStatusResSchema, taskSubmitResSchema, taskSubmitSchema } from "../types";
import { z } from "zod";
import { defer, map, retry, tap } from "rxjs";
import { isTaskStatusProcessing, lN } from "../util";
import { fetch0 } from "./fetch";

const submitAPI = "https://klingai.kuaishou.com/api/task/submit";
const statusAPI = "https://klingai.kuaishou.com/api/task/status";
const taskDelAPI = "https://klingai.kuaishou.com/api/task/del";
const worksDelAPI = "https://klingai.kuaishou.com/api/works/del";

export async function submit(task: z.infer<typeof taskSubmitSchema>) {
  console.debug("submit", task);

  const json = await fetch0<z.infer<typeof taskSubmitResSchema>>(submitAPI, {
    method: "POST",
    body: JSON.stringify(task),
  });

  console.log(json);

  if (json.data.status === lN.SENSITIVE_TEXT || json.data.status === lN.SENSITIVE_IMAGE) {
    throw new Error(
      "敏感内容: " +
        Object.entries(lN)
          .filter(([, v]) => v === json.data.status)
          .map(([k]) => k)
          .join(", "),
    );
  }
  return json;
}

export async function status(taskId: string) {
  return await fetch0<z.infer<typeof taskStatusResSchema>>(statusAPI + `?taskId=${taskId}`);
}

export function checkStatusUntilDone(
  taskId: string,
  callback: (v: z.infer<typeof taskStatusResSchema>) => void,
  retryDelay?: number,
) {
  return defer(() => status(taskId)).pipe(
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

export async function deleteTasks(taskIds: number[]) {
  return await fetch0<z.infer<typeof nullResSchema>>(taskDelAPI, {
    method: "POST",
    body: JSON.stringify({ taskIds }),
  });
}

export async function deleteWorks(payload: z.infer<typeof deleteWorksSchema>) {
  return await fetch0<z.infer<typeof nullResSchema>>(worksDelAPI, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
