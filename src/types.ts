import { z, ZodTypeAny } from "zod";

const type = z.enum(["mmu_txt2img_aiweb", "m2v_txt2video_hq", "m2v_img2video_hq"]);
const argumentType = z.enum(["prompt", "style", "aspect_ratio", "imageCount", "fidelity", "biz"]);
const contentType = z.enum(["image", "video"]);

export const limitationSchema = z.object({
  type,
  remaining: z.number(),
  limit: z.number(),
});

export const resourceSchema = z.object({
  resource: z.string(),
  height: z.number(),
  width: z.number(),
  duration: z.number(),
});

export const argumentSchema = z.object({
  name: argumentType,
  value: z.string(),
});

export const taskInputSchema = z.object({
  inputType: z.enum(["URL"]).default("URL"),
  url: z.string(),
  name: z.enum(["input"]).default("input"),
});

export const taskInfoSchema = z.object({
  type,
  inputs: taskInputSchema.array(),
  arguments: argumentSchema.array(),
});

export const workSchema = z.object({
  workId: z.number(),
  workItemId: z.number(),
  taskId: z.number(),
  type: type,
  status: z.number(),
  contentType,
  resource: resourceSchema,
  cover: resourceSchema,
  starNum: z.number(),
  reportNum: z.number(),
  createTime: z.number(),
  taskInfo: taskInfoSchema,
  selfAttitude: z.string(),
  selfComment: z.string(),
  favored: z.boolean().default(false),
  starred: z.boolean().default(false),
  publishStatus: z.enum(["published", "unpublished"]),
  deleted: z.boolean().default(false),
});

export const taskSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type,
  status: z.number({ description: "" }),
  taskInfo: taskInfoSchema,
  favored: z.boolean().default(false),
  starred: z.boolean().default(false),
  createTime: z.number(),
  updateTime: z.number(),
});

export const historyItemSchema = z.object({
  works: workSchema.array(),
  task: taskSchema,
});

const _resDataSchema = <T extends ZodTypeAny>(data: T) =>
  z.object({
    status: z.number(),
    message: z.string(),
    data: data,
  });

export const worksResSchema = _resDataSchema(
  z.object({
    limitations: limitationSchema.array(),
    history: historyItemSchema.array(),
  }),
);

export const taskSubmitSchema = z.object({
  arguments: argumentSchema.array(),
  type,
  inputs: taskInputSchema.array(),
});

export const taskSubmitResSchema = _resDataSchema(
  z.object({
    task: taskSchema,
    works: workSchema.array(),
    status: z.number(),
    message: z.string(),
    limitation: limitationSchema,
  }),
);

export const taskStatusResSchema = _resDataSchema(
  z.object({
    status: z.number(),
    etaTime: z.number(),
    message: z.string(),
    task: taskSchema,
    works: workSchema.array(),
  }),
);

export const uploadIssueTokenResSchema = _resDataSchema(
  z.object({
    token: z.string(),
    httpEndpoints: z.string().array(),
  }),
);

export const uploadResumeResSchema = z.object({
  result: z.number(),
});

export const uploadFragmentResSchema = z.object({
  result: z.number(),
  checksum: z.string(),
  size: z.number(),
});

export const uploadCompleteResSchema = z.object({
  result: z.number(),
});

export const uploadVerifyResSchema = _resDataSchema(
  z.object({
    status: z.number(),
    url: z.string(),
    message: z.string(),
  }),
);
