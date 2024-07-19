import { historyItemSchema, limitationSchema, worksResSchema } from "../types";
import { z } from "zod";
import { useFetch } from "@raycast/utils";

const api = "https://klingai.kuaishou.com/api/user/works/personal/v2";

export function userWorksPersonalV2(cookie: string, setLimitations?: (s: z.infer<typeof limitationSchema>[]) => void) {
  const pageSize = 30;

  const params = (page: number) => {
    const req = new URLSearchParams();
    req.append("pageNum", String(page));
    req.append("pageSize", String(pageSize));
    req.append("contentType", "");
    req.append("statusType", "success");
    req.append("favored", "false");
    return req;
  };

  return useFetch<z.infer<typeof worksResSchema>, [], z.infer<typeof historyItemSchema>[]>(
    (options) => `${api}?` + params(options.page + 1).toString(),
    {
      headers: {
        Cookie: cookie,
      },
      initialData: [],
      keepPreviousData: true,
      mapResult: (data) => {
        if (setLimitations) {
          setLimitations(data.data.limitations);
        }
        return { data: data.data.history, hasMore: data.data.history.length >= pageSize };
      },
    },
  );
}
