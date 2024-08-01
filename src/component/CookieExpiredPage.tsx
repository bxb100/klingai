import { Action, ActionPanel, Detail, openExtensionPreferences } from "@raycast/api";

export function CookieExpiredPage() {
  const markdown =
    "**Cookie Expired. Update cookie and try again.**\n" +
    "## How To\n" +
    "- Login https://klingai.kuaishou.com/ or https://klingai.com/ .\n" +
    "- Use Chrome or other browsers to inspect the network requests (F12 -> XHR).\n" +
    "- Copy the whole cookie.\n" +
    "- Open Raycast and paste the cookie in the extension preferences.\n" +
    "- Exit and re-enter the extension.\n";

  return (
    <Detail
      navigationTitle={"Cookie Expired"}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    />
  );
}
