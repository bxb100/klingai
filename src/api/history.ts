import { historyItemSchema, worksResSchema } from "../types";
import { z } from "zod";
import { useFetch } from "@raycast/utils";
import { getPreferenceValues } from "@raycast/api";

const api = "https://klingai.kuaishou.com/api/user/works/personal/v2";

export function userWorksPersonalV2(contentType: string, favored: string) {
  const { cookie } = getPreferenceValues<Preferences>();

  const pageSize = 30;

  const params = (page: number) => {
    const req = new URLSearchParams();
    req.append("pageNum", String(page));
    req.append("pageSize", String(pageSize));
    req.append("contentType", contentType);
    req.append("statusType", "");
    req.append("favored", favored);
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
        return { data: data.data.history, hasMore: data.data.history.length >= pageSize };
      },
    },
  );
}
