---
read_when:
    - 設定 OpenClaw 的 Twitch 聊天整合
sidebarTitle: Twitch
summary: Twitch 聊天機器人組態與設定
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

Twitch 透過 IRC 連線支援聊天。OpenClaw 會以 Twitch 使用者（機器人帳號）身分連線，以便在頻道中接收與傳送訊息。

## 內建 Plugin

<Note>
Twitch 在目前的 OpenClaw 版本中作為內建 Plugin 隨附，因此一般封裝建置不需要另外安裝。
</Note>

如果你使用較舊的建置，或是排除 Twitch 的自訂安裝，請直接安裝 npm 套件：

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="本機 checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

使用裸套件以跟隨目前的官方發行標籤。只有在需要可重現安裝時，才釘選精確版本。

詳情：[Plugins](/zh-TW/tools/plugin)

## 快速設定（初學者）

<Steps>
  <Step title="確認 Plugin 可用">
    目前封裝的 OpenClaw 版本已經內建它。較舊或自訂安裝可使用上述命令手動加入。
  </Step>
  <Step title="建立 Twitch 機器人帳號">
    為機器人建立專用 Twitch 帳號（或使用現有帳號）。
  </Step>
  <Step title="產生憑證">
    使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

    - 選取 **Bot Token**
    - 確認已選取範圍 `chat:read` 和 `chat:write`
    - 複製 **Client ID** 和 **Access Token**

  </Step>
  <Step title="尋找你的 Twitch 使用者 ID">
    使用 [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) 將使用者名稱轉換為 Twitch 使用者 ID。
  </Step>
  <Step title="設定權杖">
    - 環境變數：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（僅限預設帳號）
    - 或設定：`channels.twitch.accessToken`

    如果兩者皆已設定，設定檔優先（環境變數備援僅適用於預設帳號）。

  </Step>
  <Step title="啟動 Gateway">
    使用已設定的頻道啟動 Gateway。
  </Step>
</Steps>

<Warning>
加入存取控制（`allowFrom` 或 `allowedRoles`），避免未授權使用者觸發機器人。`requireMention` 預設為 `true`。
</Warning>

最小設定：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## 它是什麼

- 由 Gateway 擁有的 Twitch 頻道。
- 確定性路由：回覆一律回到 Twitch。
- 每個帳號會對應到隔離的工作階段金鑰 `agent:<agentId>:twitch:<accountName>`。
- `username` 是機器人的帳號（用於驗證），`channel` 是要加入的聊天室。

## 設定（詳細）

### 產生憑證

使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

- 選取 **Bot Token**
- 確認已選取範圍 `chat:read` 和 `chat:write`
- 複製 **Client ID** 和 **Access Token**

<Note>
不需要手動註冊應用程式。權杖會在數小時後過期。
</Note>

### 設定機器人

<Tabs>
  <Tab title="環境變數（僅限預設帳號）">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="設定">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

如果環境變數和設定皆已設定，設定檔優先。

### 存取控制（建議）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

偏好使用 `allowFrom` 作為硬性允許清單。如果你想要以角色為基礎的存取，請改用 `allowedRoles`。

**可用角色：** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

<Note>
**為什麼使用使用者 ID？** 使用者名稱可能變更，造成冒用風險。使用者 ID 是永久的。

尋找你的 Twitch 使用者 ID：[https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（將你的 Twitch 使用者名稱轉換為 ID）
</Note>

## 權杖重新整理（選用）

來自 [Twitch Token Generator](https://twitchtokengenerator.com/) 的權杖無法自動重新整理，過期時請重新產生。

若要自動重新整理權杖，請在 [Twitch Developer Console](https://dev.twitch.tv/console) 建立你自己的 Twitch 應用程式，並加入設定：

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

機器人會在過期前自動重新整理權杖，並記錄重新整理事件。

## 多帳號支援

使用 `channels.twitch.accounts` 搭配各帳號專屬權杖。共享模式請參閱[設定](/zh-TW/gateway/configuration)。

範例（一個機器人帳號在兩個頻道中）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
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
每個帳號都需要自己的權杖（每個頻道一個權杖）。
</Note>

## 存取控制

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
  <Tab title="以角色為基礎">
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

    `allowFrom` 是硬性允許清單。設定後，只允許這些使用者 ID。如果你想要以角色為基礎的存取，請不要設定 `allowFrom`，改為設定 `allowedRoles`。

  </Tab>
  <Tab title="停用 @mention 要求">
    預設情況下，`requireMention` 為 `true`。若要停用並回應所有訊息：

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

## 疑難排解

首先，執行診斷命令：

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="機器人未回應訊息">
    - **檢查存取控制：** 確認你的使用者 ID 位於 `allowFrom` 中，或暫時移除 `allowFrom` 並設定 `allowedRoles: ["all"]` 來測試。
    - **檢查機器人是否在頻道中：** 機器人必須加入 `channel` 中指定的頻道。

  </Accordion>
  <Accordion title="權杖問題">
    「連線失敗」或驗證錯誤：

    - 確認 `accessToken` 是 OAuth 存取權杖值（通常以 `oauth:` 前綴開頭）
    - 檢查權杖是否具有 `chat:read` 和 `chat:write` 範圍
    - 如果使用權杖重新整理，請確認已設定 `clientSecret` 和 `refreshToken`

  </Accordion>
  <Accordion title="權杖重新整理無法運作">
    檢查記錄中的重新整理事件：

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    如果你看到「token refresh disabled (no refresh token)」：

    - 確認已提供 `clientSecret`
    - 確認已提供 `refreshToken`

  </Accordion>
</AccordionGroup>

## 設定

### 帳號設定

<ParamField path="username" type="string">
  機器人使用者名稱。
</ParamField>
<ParamField path="accessToken" type="string">
  具有 `chat:read` 和 `chat:write` 的 OAuth 存取權杖。
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID（來自 Token Generator 或你的應用程式）。
</ParamField>
<ParamField path="channel" type="string" required>
  要加入的頻道。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  啟用此帳號。
</ParamField>
<ParamField path="clientSecret" type="string">
  選用：用於自動權杖重新整理。
</ParamField>
<ParamField path="refreshToken" type="string">
  選用：用於自動權杖重新整理。
</ParamField>
<ParamField path="expiresIn" type="number">
  權杖有效期限，以秒為單位。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  權杖取得時間戳記。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  使用者 ID 允許清單。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  以角色為基礎的存取控制。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  要求 @mention。
</ParamField>

### 提供者選項

- `channels.twitch.enabled` - 啟用/停用頻道啟動
- `channels.twitch.username` - 機器人使用者名稱（簡化的單帳號設定）
- `channels.twitch.accessToken` - OAuth 存取權杖（簡化的單帳號設定）
- `channels.twitch.clientId` - Twitch Client ID（簡化的單帳號設定）
- `channels.twitch.channel` - 要加入的頻道（簡化的單帳號設定）
- `channels.twitch.accounts.<accountName>` - 多帳號設定（上述所有帳號欄位）

完整範例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## 工具動作

代理可以使用下列動作呼叫 `twitch`：

- `send` - 將訊息傳送到頻道

範例：

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 安全與維運

- **將權杖視為密碼** — 絕不要將權杖提交到 git。
- **使用自動權杖重新整理** 供長時間執行的機器人使用。
- **使用使用者 ID 允許清單**，而非使用者名稱，來進行存取控制。
- **監控記錄** 以查看權杖重新整理事件與連線狀態。
- **最小化權杖範圍** — 只要求 `chat:read` 和 `chat:write`。
- **如果卡住**：確認沒有其他處理程序擁有該工作階段後，重新啟動 Gateway。

## 限制

- 每則訊息 **500 個字元**（會在字詞邊界自動分段）。
- Markdown 會在分段前移除。
- 無速率限制（使用 Twitch 內建的速率限制）。

## 相關

- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [頻道概觀](/zh-TW/channels) — 所有支援的頻道
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
