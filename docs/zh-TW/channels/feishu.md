---
read_when:
    - 你想要連接 Feishu/Lark 機器人
    - 你正在設定 Feishu 頻道
summary: Feishu 機器人概覽、功能與設定
title: Feishu
x-i18n:
    generated_at: "2026-06-30T13:45:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark 是一個整合式協作平台，團隊可以在其中聊天、共享文件、管理行事曆，並共同完成工作。

**狀態：** 機器人私訊 + 群組聊天已可用於正式環境。WebSocket 是預設模式；網路鉤子模式為選用。

---

## 快速開始

<Note>
需要 OpenClaw 2026.5.29 或以上版本。執行 `openclaw --version` 檢查版本。使用 `openclaw update` 升級。
</Note>

<Steps>
  <Step title="執行頻道設定精靈">
  ```bash
  openclaw channels login --channel feishu
  ```
  選擇手動設定以貼上 Feishu Open Platform 的 App ID 和 App Secret，或選擇 QR 設定以自動建立機器人。如果中國版 Feishu 行動 App 對 QR code 沒有反應，請重新執行設定並選擇手動設定。
  </Step>
  
  <Step title="設定完成後，重新啟動閘道以套用變更">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## 存取控制

### 直接訊息

設定 `dmPolicy` 以控制誰可以私訊機器人：

- `"pairing"` - 未知使用者會收到配對碼；透過命令列介面核准
- `"allowlist"` - 只有列在 `allowFrom` 中的使用者可以聊天
- `"open"` - 只有當 `allowFrom` 包含 `"*"` 時才允許公開私訊；若有嚴格的項目，只有符合的使用者可以聊天

**核准配對請求：**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 群組聊天

**群組政策** (`channels.feishu.groupPolicy`)：

| 值            | 行為                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | 回應群組中的所有訊息                                                                         |
| `"allowlist"` | 只回應 `groupAllowFrom` 中的群組，或在 `groups.<chat_id>` 下明確設定的群組                   |
| `"disabled"`  | 停用所有群組訊息；明確的 `groups.<chat_id>` 項目不會覆寫此設定                               |

預設值：`allowlist`

**提及需求** (`channels.feishu.requireMention`)：

- `true` - 需要 @提及（預設）
- `false` - 不需要 @提及即可回應
- 每個群組的覆寫：`channels.feishu.groups.<chat_id>.requireMention`
- 僅廣播用的 `@all` 和 `@_all` 不會視為機器人提及。同時提及 `@all` 和直接提及機器人的訊息，仍會計為機器人提及。

---

## 群組設定範例

### 允許所有群組，不需要 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### 允許所有群組，仍需要 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### 只允許特定群組

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

在 `allowlist` 模式中，你也可以加入明確的 `groups.<chat_id>` 項目來允許群組。明確項目不會覆寫 `groupPolicy: "disabled"`。`groups.*` 下的萬用字元預設值會設定符合的群組，但不會自行允許群組。

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### 限制群組內的傳送者

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## 取得群組/使用者 ID

### 群組 ID (`chat_id`，格式：`oc_xxx`)

在 Feishu/Lark 中開啟群組，按一下右上角的選單圖示，然後前往 **設定**。群組 ID (`chat_id`) 會列在設定頁面上。

![取得群組 ID](/images/feishu-get-group-id.png)

### 使用者 ID (`open_id`，格式：`ou_xxx`)

啟動閘道，傳送私訊給機器人，然後檢查日誌：

```bash
openclaw logs --follow
```

在日誌輸出中尋找 `open_id`。你也可以檢查待處理的配對請求：

```bash
openclaw pairing list feishu
```

---

## 常用命令

| 命令      | 說明                 |
| --------- | -------------------- |
| `/status` | 顯示機器人狀態       |
| `/reset`  | 重設目前工作階段     |
| `/model`  | 顯示或切換 AI 模型   |

<Note>
Feishu/Lark 不支援原生斜線命令選單，因此請以純文字訊息傳送這些命令。
</Note>

---

## 疑難排解

### 機器人在群組聊天中沒有回應

1. 確認機器人已加入群組
2. 確認你 @提及機器人（預設需要）
3. 確認 `groupPolicy` 不是 `"disabled"`
4. 檢查日誌：`openclaw logs --follow`

### 機器人沒有收到訊息

1. 確認機器人已在 Feishu Open Platform / Lark Developer 中發布並核准
2. 確認事件訂閱包含 `im.message.receive_v1`
3. 確認已選取 **持久連線** (WebSocket)
4. 確認已授予所有必要的權限範圍
5. 確認閘道正在執行：`openclaw gateway status`
6. 檢查日誌：`openclaw logs --follow`

### QR 設定在 Feishu 行動 App 中沒有反應

1. 重新執行設定：`openclaw channels login --channel feishu`
2. 選擇手動設定
3. 在 Feishu Open Platform 中建立自建 App，並複製其 App ID 和 App Secret
4. 將這些憑證貼到設定精靈中

### App Secret 外洩

1. 在 Feishu Open Platform / Lark Developer 中重設 App Secret
2. 更新設定中的值
3. 重新啟動閘道：`openclaw gateway restart`

---

## 進階設定

### 多個帳號

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` 控制當外送 API 未指定 `accountId` 時使用哪個帳號。
`accounts.<id>.tts` 使用與 `messages.tts` 相同的形狀，並深度合併到
全域 TTS 設定之上，因此多機器人的 Feishu 設定可以在全域保留共享的提供者
憑證，同時只針對每個帳號覆寫語音、模型、角色或自動模式。

### 訊息限制

- `textChunkLimit` - 外送文字區塊大小（預設：`2000` 字元）
- `mediaMaxMb` - 媒體上傳/下載限制（預設：`30` MB）

### 串流

Feishu/Lark 支援透過互動卡片串流回覆。啟用後，機器人會在產生文字時即時更新卡片。

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

設定 `streaming: false` 可在一則訊息中傳送完整回覆。`blockStreaming` 預設為關閉；只有在你想要於最終回覆前先送出已完成的助理區塊時才啟用。

### 配額最佳化

使用兩個選用旗標減少 Feishu/Lark API 呼叫次數：

- `typingIndicator`（預設 `true`）：設定為 `false` 可略過輸入中反應呼叫
- `resolveSenderNames`（預設 `true`）：設定為 `false` 可略過傳送者個人檔案查詢

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### ACP 工作階段

Feishu/Lark 支援私訊與群組串訊息的 ACP。Feishu/Lark ACP 由文字命令驅動 - 沒有原生斜線命令選單，因此請直接在對話中使用 `/acp ...` 訊息。

#### 持久 ACP 綁定

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### 從聊天產生 ACP

在 Feishu/Lark 私訊或串中：

```text
/acp spawn codex --thread here
```

`--thread here` 適用於私訊和 Feishu/Lark 串訊息。綁定對話中的後續訊息會直接路由到該 ACP 工作階段。

### 多代理程式路由

使用 `bindings` 將 Feishu/Lark 私訊或群組路由到不同代理程式。

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

路由欄位：

- `match.channel`：`"feishu"`
- `match.peer.kind`：`"direct"`（私訊）或 `"group"`（群組聊天）
- `match.peer.id`：使用者 Open ID (`ou_xxx`) 或群組 ID (`oc_xxx`)

請參閱[取得群組/使用者 ID](#get-groupuser-ids) 以取得查找提示。

---

## 每位使用者的代理程式隔離（動態代理程式建立）

啟用 `dynamicAgentCreation`，即可為每位私訊使用者自動建立**隔離的代理程式執行個體**。每位使用者都有自己的：

- 獨立工作區目錄
- 個別的 `USER.md` / `SOUL.md` / `MEMORY.md`
- 私有對話歷史
- 隔離的 Skills 與狀態

這對公開機器人很重要，適用於你希望每位使用者都有自己的私有 AI 助理體驗時。

<Note>
動態綁定包含正規化後的 Feishu `accountId`，因此預設帳號與具名帳號會將每位傳送者路由到正確的動態代理程式。

如果具名帳號在較舊版本上建立了未限定範圍的動態代理程式，該舊版代理程式仍會計入 `maxAgents`。移除它之前，請確認預設帳號未使用它，或暫時增加 `maxAgents`；OpenClaw 無法安全推斷模糊舊版狀態屬於哪個帳號。
</Note>

### 快速設定

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### 運作方式

當新使用者傳送第一則私訊時：

1. 頻道會產生唯一的 `agentId`：預設帳號使用 `feishu-{user_open_id}`，具名帳號則使用有界的帳號前綴身分摘要
2. 在 `workspaceTemplate` 路徑建立新工作區
3. 註冊代理程式，並為此使用者建立綁定
4. 工作區輔助工具會在首次存取時確保啟動檔案（`AGENTS.md`、`SOUL.md`、`USER.md` 等）存在
5. 將此使用者之後的所有訊息路由到其專用代理程式

### 設定選項

| 設定                                                     | 說明                                 | 預設值                               |
| -------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | 啟用自動按使用者建立代理             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動態代理工作區的路徑範本             | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 代理目錄名稱範本                     | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 要建立的動態代理數量上限             | 無限制                               |

範本變數：

- `{agentId}` - 產生的代理 ID（例如 `feishu-ou_xxxxxx` 或 `feishu-support-<identity_digest>`）
- `{userId}` - 傳送者的 Feishu open_id（例如 `ou_xxxxxx`）

### 工作階段範圍

`session.dmScope` 控制直接訊息如何對應到代理工作階段。這是會影響所有通道的**全域設定**。

| 值                           | 行為                                             | 最適合                                                           |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| `"main"`                     | 每位使用者的 DM 對應到其代理的主要工作階段       | 想要自動載入 `USER.md` / `SOUL.md` 的單一使用者 Bot              |
| `"per-channel-peer"`         | 每個（通道 + 使用者）組合都會取得獨立工作階段    | 需要更強隔離的公開多使用者 Bot                                  |
| `"per-account-channel-peer"` | 每個（帳號 + 通道 + 使用者）組合都會取得獨立工作階段 | 需要帳號層級工作階段隔離的多帳號 Bot                            |

**取捨**：使用 `"main"` 可啟用自動啟動檔案載入（`USER.md`、`SOUL.md`、`MEMORY.md`），但這表示所有通道中的所有 DM 都會共用相同的工作階段鍵模式。對於隔離比自動載入啟動檔更重要的公開多使用者 Bot，請考慮使用 `"per-channel-peer"` 並手動管理啟動檔。

<Note>
當具名 Feishu 帳號應針對同一傳送者保留獨立工作階段時，請使用 `"per-account-channel-peer"`。動態繫結會保留帳號範圍。
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### 典型多使用者部署

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### 驗證

檢查閘道記錄以確認動態建立正在運作：

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

列出所有已建立的工作區：

```bash
ls -la ~/.openclaw/workspace-*
```

### 備註

- **工作區隔離**：每位使用者都會取得自己的工作區目錄和代理實例。使用者無法在一般訊息流程中看到彼此的對話記錄或檔案。
- **安全邊界**：這是訊息情境隔離機制，不是針對敵意共租戶的安全邊界。代理程序和主機環境是共用的。
- **`bindings` 應為空**：動態代理會自動註冊自己的繫結
- **升級路徑**：現有手動繫結會與動態代理並行繼續運作
- **`session.dmScope` 是全域的**：這會影響所有通道，而不只是 Feishu

---

## 設定參考

完整設定：[閘道設定](/zh-TW/gateway/configuration)

| 設定                                                     | 說明                                                                                 | 預設值                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | 啟用/停用通道                                                                        | `true`                               |
| `channels.feishu.domain`                                 | API 網域（`feishu` 或 `lark`）                                                       | `feishu`                             |
| `channels.feishu.connectionMode`                         | 事件傳輸（`websocket` 或 `webhook`）                                                 | `websocket`                          |
| `channels.feishu.defaultAccount`                         | 外送路由的預設帳號                                                                   | `default`                            |
| `channels.feishu.verificationToken`                      | Webhook 模式所需                                                                     | -                                    |
| `channels.feishu.encryptKey`                             | Webhook 模式所需                                                                     | -                                    |
| `channels.feishu.webhookPath`                            | Webhook 路由路徑                                                                     | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook 綁定位址                                                                     | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook 綁定連接埠                                                                   | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App ID                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | 個別帳號網域覆寫                                                                     | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | 個別帳號 TTS 覆寫                                                                    | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM 政策                                                                              | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM 允許清單（open_id 清單）                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | 群組政策                                                                             | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | 群組允許清單                                                                         | -                                    |
| `channels.feishu.requireMention`                         | 在群組中要求 @提及                                                                   | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | 個別群組 @提及覆寫；明確 ID 在允許清單模式下也會允許該群組                          | 繼承                                 |
| `channels.feishu.groups.<chat_id>.enabled`               | 啟用/停用特定群組                                                                    | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | 啟用自動按使用者建立代理                                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動態代理工作區的路徑範本                                                             | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 代理目錄名稱範本                                                                     | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 要建立的動態代理數量上限                                                             | 無限制                               |
| `channels.feishu.textChunkLimit`                         | 訊息分塊大小                                                                         | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | 媒體大小限制                                                                         | `30`                                 |
| `channels.feishu.streaming`                              | 串流卡片輸出                                                                         | `true`                               |
| `channels.feishu.blockStreaming`                         | 已完成區塊回覆串流                                                                   | `false`                              |
| `channels.feishu.typingIndicator`                        | 傳送輸入中反應                                                                       | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 解析傳送者顯示名稱                                                                   | `true`                               |
| `channels.feishu.tools.bitable`                          | 啟用 Bitable/Base 工具                                                               | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` 的別名；兩者都設定時，以明確的 `bitable` 為準        | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | 個別帳號 Bitable/Base 工具閘門                                                       | 繼承                                 |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` 的個別帳號別名                                                       | 繼承                                 |

---

## 支援的訊息類型

### 接收

- ✅ 文字
- ✅ 富文字（post）
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片/媒體
- ✅ 貼圖

傳入的 Feishu/Lark 音訊訊息會正規化為媒體佔位符，而不是原始 `file_key` JSON。設定 `tools.media.audio` 時，OpenClaw 會下載語音記事資源，並在代理回合前執行共用音訊轉錄，因此代理會收到語音逐字稿。如果 Feishu 直接在音訊承載中包含逐字稿文字，則會使用該文字，而不會再呼叫 ASR。沒有音訊轉錄提供者時，代理仍會收到 `<media:audio>` 佔位符以及已儲存的附件，而不是原始 Feishu 資源承載。

### 傳送

- ✅ 文字
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片/媒體
- ✅ 互動式卡片（包含串流更新）
- ⚠️ 富文字（貼文式格式；不支援完整的 Feishu/Lark 編輯功能）

原生 Feishu/Lark 音訊氣泡使用 Feishu `audio` 訊息類型，且需要
Ogg/Opus 上傳媒體（`file_type: "opus"`）。現有的 `.opus` 和 `.ogg` 媒體
會直接以原生音訊傳送。MP3/WAV/M4A 和其他可能的音訊格式，只有在回覆要求語音
傳遞（`audioAsVoice` / 訊息工具 `asVoice`，包含 TTS 語音備註
回覆）時，才會使用 `ffmpeg` 轉碼為 48kHz Ogg/Opus。一般 MP3 附件仍會作為一般檔案。如果缺少 `ffmpeg` 或
轉換失敗，OpenClaw 會退回使用檔案附件並記錄原因。

### 對話串與回覆

- ✅ 行內回覆
- ✅ 對話串回覆
- ✅ 回覆對話串訊息時，媒體回覆會保留對話串感知

對於 `groupSessionScope: "group_topic"` 和 `"group_topic_sender"`，原生
Feishu/Lark 主題群組會使用事件 `thread_id`（`omt_*`）作為標準
主題工作階段金鑰。如果原生主題起始事件省略 `thread_id`，OpenClaw
會先從 Feishu 補齊，再路由該回合。OpenClaw 轉成對話串的一般群組回覆會
繼續使用回覆根訊息 ID（`om_*`），讓第一回合與後續回合保持在同一個工作階段。

---

## 相關

- [通道概覽](/zh-TW/channels) - 所有支援的通道
- [配對](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及門檻
- [通道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化措施
