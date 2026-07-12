---
read_when:
    - 設定 OpenClaw 的 Twitch 聊天整合
sidebarTitle: Twitch
summary: Twitch 聊天機器人：安裝、憑證、存取控制、權杖重新整理
title: Twitch
x-i18n:
    generated_at: "2026-07-11T21:10:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

透過 Twurple 用戶端，經由 Twitch 的聊天（IRC）介面支援 Twitch 聊天。OpenClaw 會以 Twitch 機器人帳號登入，為每個已設定的帳號加入一個頻道，並在該頻道中回覆。

## 安裝

Twitch 以官方外掛形式提供，不屬於核心安裝的一部分。

<Tabs>
  <Tab title="npm 登錄檔">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="本機簽出">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` 會註冊並啟用此外掛。在 `openclaw onboard` 或 `openclaw channels add` 期間選擇 Twitch，會依需求安裝它。使用不含版本的套件名稱即可跟隨目前版本；只有在需要可重現的安裝時，才鎖定確切版本。需要 OpenClaw 2026.4.10 或更新版本。

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

<Steps>
  <Step title="安裝外掛">
    請參閱上方的[安裝](#install)。
  </Step>
  <Step title="建立 Twitch 機器人帳號">
    為機器人建立專用的 Twitch 帳號（或使用現有帳號）。
  </Step>
  <Step title="產生認證資訊">
    使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

    - 選取 **Bot Token**
    - 確認已選取 `chat:read` 和 `chat:write` 範圍
    - 複製 **Client ID** 和 **Access Token**

  </Step>
  <Step title="尋找你的 Twitch 使用者 ID">
    使用 [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) 將使用者名稱轉換為 Twitch 使用者 ID。
  </Step>
  <Step title="設定權杖">
    - 環境變數：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（僅限預設帳號）
    - 或設定：`channels.twitch.accessToken`

    如果兩者皆已設定，會優先使用設定值（環境變數僅作為預設帳號的備援）。

  </Step>
  <Step title="啟動閘道">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
新增存取控制（`allowFrom` 或 `allowedRoles`），以防止未經授權的使用者觸發機器人。`requireMention` 預設為 `true`。
</Warning>

最小設定：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 機器人的 Twitch 帳號（用於驗證）
      accessToken: "oauth:abc123...", // OAuth 存取權杖（或使用 OPENCLAW_TWITCH_ACCESS_TOKEN 環境變數）
      clientId: "xyz789...", // 來自 Token Generator 的用戶端 ID
      channel: "yourchannel", // 要加入哪個 Twitch 頻道的聊天室（必填）
      allowFrom: ["123456789"], // （建議）僅允許你的 Twitch 使用者 ID
    },
  },
}
```

## 功能概述

- 由閘道擁有的 Twitch 頻道。
- 確定性路由：回覆一律傳回訊息來源的 Twitch 頻道。
- 每個已加入的頻道都會對應至隔離的群組工作階段金鑰 `agent:<agentId>:twitch:group:<channel>`。
- `username` 是機器人的帳號（用於驗證的帳號），`channel` 則是要加入的聊天室。每個帳號項目只會加入一個頻道。
- 權杖無論是否含有 `oauth:` 前綴都能使用；OpenClaw 會將兩種形式正規化（設定精靈預期使用 `oauth:` 形式）。

## 權杖重新整理（選用）

[Twitch Token Generator](https://twitchtokengenerator.com/) 產生的權杖無法由 OpenClaw 重新整理，請在到期後重新產生（有效期為數小時，無須註冊應用程式）。

若要自動重新整理，請在 [Twitch Developer Console](https://dev.twitch.tv/console) 建立自己的應用程式，並新增：

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

兩者皆有設定時，外掛會使用可重新整理的驗證提供者，在權杖到期前予以更新，並記錄每次重新整理。若缺少 `refreshToken`，則會記錄 `token refresh disabled (no refresh token)`；若缺少 `clientSecret`，則會退回使用靜態（不會重新整理的）權杖。

## 多帳號支援

使用 `channels.twitch.accounts` 設定各帳號的認證資訊。共用模式請參閱[設定](/zh-TW/gateway/configuration)。

範例（一個機器人帳號用於兩個頻道）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
每個帳號項目都需要自己的 `accessToken`（環境變數僅適用於預設帳號）。一個帳號只會加入一個頻道，因此加入兩個頻道表示需要兩個帳號。`channels.twitch.defaultAccount` 用於選擇哪個帳號為預設帳號。
</Note>

## 存取控制

`allowFrom` 是 Twitch 使用者 ID 的嚴格允許清單。設定此項時會忽略 `allowedRoles`；若要改用角色式存取，請勿設定 `allowFrom`。

**可用角色：**`"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

<Tabs>
  <Tab title="使用者 ID 允許清單（最安全）">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="角色式">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="停用 @提及要求">
    `requireMention` 預設為 `true`。若要回應所有允許的訊息：

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

<Note>
**為什麼使用使用者 ID？** 使用者名稱可以變更，因而可能遭到冒充。使用者 ID 則是永久不變的。

使用[使用者名稱轉 ID 工具](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)尋找你的 ID。
</Note>

## 疑難排解

首先執行診斷命令：

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="機器人未回應訊息">
    - **檢查存取控制：**確認你的使用者 ID 位於 `allowFrom` 中，或暫時移除 `allowFrom` 並設定 `allowedRoles: ["all"]` 以進行測試。
    - **檢查提及閘門：**當 `requireMention: true`（預設）時，訊息必須以 @ 提及機器人的使用者名稱。
    - **檢查機器人是否位於頻道中：**機器人只會加入 `channel` 中指定的頻道。

  </Accordion>
  <Accordion title="權杖問題">
    出現「連線失敗」或驗證錯誤時：

    - 確認 `accessToken` 是 OAuth 存取權杖值（`oauth:` 前綴為選用）
    - 檢查權杖是否具有 `chat:read` 和 `chat:write` 範圍
    - 若使用權杖重新整理，請確認已設定 `clientSecret` 和 `refreshToken`

  </Accordion>
  <Accordion title="權杖重新整理無法運作">
    檢查記錄中的重新整理事件：

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    若看到 `token refresh disabled (no refresh token)`：

    - 確認已提供 `clientSecret`
    - 確認已提供 `refreshToken`

  </Accordion>
</AccordionGroup>

## 設定

### 帳號設定

<ParamField path="username" type="string" required>
  機器人使用者名稱（用於驗證的帳號）。
</ParamField>
<ParamField path="accessToken" type="string" required>
  具有 `chat:read` 和 `chat:write` 的 OAuth 存取權杖（預設帳號可使用設定或環境變數）。
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch 用戶端 ID（來自 Token Generator 或你的應用程式）。在結構描述中為選用，但連線時為必填。
</ParamField>
<ParamField path="channel" type="string" required>
  要加入的頻道。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  啟用此帳號。
</ParamField>
<ParamField path="clientSecret" type="string">
  選用：用於自動重新整理權杖。
</ParamField>
<ParamField path="refreshToken" type="string">
  選用：用於自動重新整理權杖。
</ParamField>
<ParamField path="expiresIn" type="number">
  權杖到期秒數（重新整理追蹤）。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  取得權杖時的時間戳記（重新整理追蹤）。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  使用者 ID 允許清單。設定時會忽略角色。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  角色式存取控制。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  必須 @提及才會觸發機器人。
</ParamField>
<ParamField path="responsePrefix" type="string">
  覆寫此帳號的外送回覆前綴。
</ParamField>

### 提供者選項

- `channels.twitch.enabled` - 啟用或停用頻道啟動
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - 簡化的單一帳號設定（隱含 `default` 帳號；優先於 `accounts.default`）
- `channels.twitch.accounts.<accountName>` - 多帳號設定（包含上方所有帳號欄位）
- `channels.twitch.defaultAccount` - 哪個帳號名稱為預設帳號
- `channels.twitch.markdown.tables` - Markdown 表格呈現模式（`off` | `bullets` | `code` | `block`）

完整範例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## 工具動作

代理程式可以透過訊息工具的 `send` 動作傳送 Twitch 訊息：

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` 為選用，預設使用帳號已設定的 `channel`。

## 安全性與維運

- **將權杖視同密碼**——絕不將權杖提交至 git。
- **使用自動權杖重新整理**，適用於長時間執行的機器人。
- **使用使用者 ID 允許清單**而非使用者名稱進行存取控制。
- **監控記錄**中的權杖重新整理事件和連線狀態。
- **將權杖範圍降至最低**——僅要求 `chat:read` 和 `chat:write`。
- **若遇到問題**：確認沒有其他程序占用工作階段後，重新啟動閘道。

## 限制

- 每則訊息最多 **500 個字元**；較長的回覆會在單字邊界處分段。
- 傳送前會移除 Markdown（Twitch 聊天使用純文字；換行會轉為空格）。
- OpenClaw 本身不會新增速率限制；Twurple 聊天用戶端會處理 Twitch 的速率限制。

## 相關內容

- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘門
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
