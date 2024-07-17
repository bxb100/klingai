import fetch from "node-fetch";
import {
  uploadCompleteResSchema,
  uploadFragmentResSchema,
  uploadIssueTokenResSchema,
  uploadResumeResSchema,
  uploadVerifyResSchema,
} from "../types";
import { z } from "zod";
import path from "node:path";
import { concatMap, defer, delay, firstValueFrom, map, retry, tap } from "rxjs";
import * as fs from "node:fs";

const uploadIssueTokenAPI = "https://klingai.kuaishou.com/api/upload/issue/token";
const uploadVerifyAPI = "https://klingai.kuaishou.com/api/upload/verify/token";

async function uploadIssueToken(filename: string, cookie: string) {
  const res = await fetch(uploadIssueTokenAPI + "?filename=" + filename, {
    headers: {
      Cookie: cookie,
    },
  });

  return (await res.json()) as z.infer<typeof uploadIssueTokenResSchema>;
}

async function uploadResume(endpoint: string, token: string) {
  const res = await fetch(`https://${endpoint}/api/upload/resume?upload_token=${token}`);
  return (await res.json()) as z.infer<typeof uploadResumeResSchema>;
}

async function uploadFragment(endpoint: string, token: string, file: Buffer) {
  const res = await fetch(`https://${endpoint}/api/upload/fragment?upload_token=${token}&fragment_id=0`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(file.length),
    },
    body: file,
  });

  return (await res.json()) as z.infer<typeof uploadFragmentResSchema>;
}

async function uploadComplete(endpoint: string, token: string) {
  const res = await fetch(`https://${endpoint}/api/upload/complete?fragment_count=1&upload_token=${token}`, {
    method: "POST",
  });

  return (await res.json()) as z.infer<typeof uploadCompleteResSchema>;
}

async function uploadVerify(token: string, cookie: string) {
  const res = await fetch(`${uploadVerifyAPI}?token=${token}`, {
    headers: {
      Cookie: cookie,
    },
  });
  return (await res.json()) as z.infer<typeof uploadVerifyResSchema>;
}

type UploadState = {
  endpoint: string;
  token: string;
};

export function upload(filepath: string, cookie: string): Promise<string> {
  const filename = path.parse(filepath).base;

  const resume$ = (state: UploadState) =>
    defer(() => uploadResume(state.endpoint, state.token)).pipe(
      tap(console.debug),
      map((res) => {
        if (res.result === 1) {
          return state;
        } else {
          throw new Error("Failed to resume upload");
        }
      }),
    );

  const fragment$ = (state: UploadState) =>
    defer(() => uploadFragment(state.endpoint, state.token, fs.readFileSync(filepath))).pipe(
      tap(console.debug),
      map((res) => {
        if (res.result === 1) {
          return state;
        } else {
          throw new Error("Failed to upload fragment");
        }
      }),
    );

  const complete$ = (state: UploadState) =>
    defer(() => uploadComplete(state.endpoint, state.token)).pipe(
      tap(console.debug),
      map((res) => {
        if (res.result === 1) {
          return state;
        } else {
          throw new Error("Failed to complete upload");
        }
      }),
      delay(3000),
      retry(1),
    );

  const verify$ = (state: UploadState) =>
    defer(() => uploadVerify(state.token, cookie)).pipe(
      map((res) => {
        if (res.status === 200) {
          return res.data.url;
        } else {
          throw new Error(`Failed to verify upload: ${JSON.stringify(res)}`);
        }
      }),
      delay(1000),
      retry(1),
      tap({ error: (err) => console.error(`error: ${err}, input: ${JSON.stringify(state)}`) }),
    );

  return firstValueFrom(
    defer(() => uploadIssueToken(filename, cookie))
      .pipe(
        tap(console.log),
        concatMap((res) =>
          resume$({
            endpoint: res.data.httpEndpoints[0],
            token: res.data.token,
          }),
        ),
        concatMap(fragment$),
        concatMap(complete$),
        concatMap(verify$),
      )
      .pipe(tap((url) => console.debug("Uploaded to: " + url))),
  );
}
