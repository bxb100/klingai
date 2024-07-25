import { payRewardResSchema, pointResSchema } from "../types";
import { z } from "zod";
import { fetch0 } from "./fetch";

const pointAPI = "https://klingai.kuaishou.com/api/account/point";
const payRewardAPI = "https://klingai.kuaishou.com/api/pay/reward";

export async function point() {
  return await fetch0<z.infer<typeof pointResSchema>>(pointAPI);
}

export async function dailyReward() {
  return await fetch0<z.infer<typeof payRewardResSchema>>(`${payRewardAPI}?activity=login_bonus_daily`);
}
