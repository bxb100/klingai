import fetch from "node-fetch";
import { payRewardResSchema, pointResSchema } from "../types";
import { z } from "zod";

const pointAPI = "https://klingai.kuaishou.com/api/account/point";
const payRewardAPI = "https://klingai.kuaishou.com/api/pay/reward";

export async function point(cookie: string) {
  const res = await fetch(pointAPI, {
    headers: {
      Cookie: cookie,
    },
  });
  return (await res.json()) as z.infer<typeof pointResSchema>;
}

export async function dailyReward(cookie: string) {
  const res = await fetch(`${payRewardAPI}?activity=login_bonus_daily`, {
    headers: {
      Cookie: cookie,
    },
  });
  return (await res.json()) as z.infer<typeof payRewardResSchema>;
}
