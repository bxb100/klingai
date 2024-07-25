import fetch, { RequestInit } from "node-fetch";
import { getPreferenceValues } from "@raycast/api";

export async function fetch0<T>(url: string, init?: RequestInit) {
  const { cookie } = getPreferenceValues<Preferences>();
  init = init || {};
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
  });
  return (await res.json()) as T;
}
