---
read_when:
    - 你想連接 Feishu/Lark 機器人
    - 你正在設定 Feishu 頻道
summary: Feishu 機器人概觀、功能與設定
title: Feishu
x-i18n:
    generated_at: "2026-06-27T18:54:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark 是一體化協作平台，團隊可在其中聊天、共用文件、管理行事曆，並共同完成工作。

**狀態：** 已可正式用於機器人私訊與群組聊天。WebSocket 是預設模式；webhook 模式為選用。

---

## 快速開始

<Note>
需要 OpenClaw 2026.5.29 或以上版本。執行 `openclaw --version` 檢查。使用 `openclaw update` 升級。
</Note>

<Steps>
  <Step title="執行頻道設定精靈">
  ```bash
  openclaw channels login --channel feishu
  ```
  選擇手動設定以貼上來自 Feishu Open Platform 的 App ID 和 App Secret，或選擇 QR 設定以自動建立機器人。如果中國版 Feishu 行動應用程式對 QR code 沒有反應，請重新執行設定並選擇手動設定。
  </Step>
  
  <Step title="設定完成後，重新啟動閘道以套用變更">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## 存取控制

### 私訊

設定 `dmPolicy` 以控制誰可以私訊機器人：

- `"pairing"` - 未知使用者會收到配對碼；透過命令列介面核准
- `"allowlist"` - 只有列在 `allowFrom` 中的使用者可以聊天
- `"open"` - 只有在 `allowFrom` 包含 `"*"` 時才允許公開私訊；若有嚴格限制的項目，只有相符的使用者可以聊天
- `"disabled"` - 停用所有私訊

**核准配對請求：**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 群組聊天

**群組政策**（`channels.feishu.groupPolicy`）：

| 值            | 行為                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `"open"`      | 回應群組中的所有訊息                                                                              |
| `"allowlist"` | 只回應 `groupAllowFrom` 中的群組，或在 `groups.<chat_id>` 下明確設定的群組                         |
| `"disabled"`  | 停用所有群組訊息；明確的 `groups.<chat_id>` 項目不會覆寫此設定                                    |

預設：`allowlist`

**提及需求**（`channels.feishu.requireMention`）：

- `true` - 需要 @提及（預設）
- `false` - 不需 @提及即可回應
- 每個群組可覆寫：`channels.feishu.groups.<chat_id>.requireMention`
- 僅廣播用的 `@all` 和 `@_all` 不會視為機器人提及。同時提及 `@all` 和直接提及機器人的訊息，仍會計為機器人提及。

---

## 群組設定範例

### 允許所有群組，不需 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### 允許所有群組，仍需 @提及

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

### 僅允許特定群組

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

在 `allowlist` 模式中，你也可以透過新增明確的 `groups.<chat_id>` 項目來允許群組。明確項目不會覆寫 `groupPolicy: "disabled"`。`groups.*` 下的萬用字元預設會設定相符群組，但本身不會允許群組。

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

### 群組 ID（`chat_id`，格式：`oc_xxx`）

在 Feishu/Lark 中開啟群組，點選右上角的選單圖示，然後前往 **設定**。群組 ID（`chat_id`）會列在設定頁面上。

![取得群組 ID](/images/feishu-get-group-id.png)

### 使用者 ID（`open_id`，格式：`ou_xxx`）

啟動閘道，向機器人傳送私訊，然後檢查日誌：

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
Feishu/Lark 不支援原生命令斜線選單，因此請將這些作為純文字訊息傳送。
</Note>

---

## 疑難排解

### 機器人未在群組聊天中回應

1. 確認機器人已加入群組
2. 確認你有 @提及機器人（預設必要）
3. 驗證 `groupPolicy` 不是 `"disabled"`
4. 檢查日誌：`openclaw logs --follow`

### 機器人未收到訊息

1. 確認機器人已在 Feishu Open Platform / Lark Developer 發布並核准
2. 確認事件訂閱包含 `im.message.receive_v1`
3. 確認已選取**持久連線**（WebSocket）
4. 確認已授予所有必要權限範圍
5. 確認閘道正在執行：`openclaw gateway status`
6. 檢查日誌：`openclaw logs --follow`

### QR 設定在 Feishu 行動應用程式中沒有反應

1. 重新執行設定：`openclaw channels login --channel feishu`
2. 選擇手動設定
3. 在 Feishu Open Platform 中建立自建應用程式，並複製其 App ID 和 App Secret
4. 將這些憑證貼到設定精靈中

### App Secret 外洩

1. 在 Feishu Open Platform / Lark Developer 中重設 App Secret
2. 更新你設定中的值
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

`defaultAccount` 控制當輸出 API 未指定 `accountId` 時要使用哪個帳號。
`accounts.<id>.tts` 使用與 `messages.tts` 相同的形狀，並深度合併到
全域 TTS 設定之上，因此多機器人的 Feishu 設定可以在全域保留共用提供者
憑證，同時只按帳號覆寫語音、模型、persona 或自動模式。

### 訊息限制

- `textChunkLimit` - 輸出文字區塊大小（預設：`2000` 字元）
- `mediaMaxMb` - 媒體上傳/下載限制（預設：`30` MB）

### 串流

Feishu/Lark 支援透過互動卡片進行串流回覆。啟用時，機器人會在產生文字時即時更新卡片。

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

設定 `streaming: false` 以在單一訊息中傳送完整回覆。`blockStreaming` 預設為關閉；只有在你希望完成的助理區塊在最終回覆前先被送出時才啟用。

### 配額最佳化

使用兩個選用旗標減少 Feishu/Lark API 呼叫數：

- `typingIndicator`（預設 `true`）：設定為 `false` 以略過輸入中反應呼叫
- `resolveSenderNames`（預設 `true`）：設定為 `false` 以略過傳送者個人檔案查詢

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

Feishu/Lark 支援私訊和群組執行緒訊息的 ACP。Feishu/Lark ACP 由文字命令驅動 - 沒有原生命令斜線選單，因此請直接在對話中使用 `/acp ...` 訊息。

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

在 Feishu/Lark 私訊或執行緒中：

```text
/acp spawn codex --thread here
```

`--thread here` 適用於私訊和 Feishu/Lark 執行緒訊息。綁定對話中的後續訊息會直接路由到該 ACP 工作階段。

### 多代理路由

使用 `bindings` 將 Feishu/Lark 私訊或群組路由至不同代理。

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
- `match.peer.id`：使用者 Open ID（`ou_xxx`）或群組 ID（`oc_xxx`）

請參閱[取得群組/使用者 ID](#get-groupuser-ids)以取得查找提示。

---

## 每位使用者代理隔離（動態代理建立）

啟用 `dynamicAgentCreation` 以自動為每位私訊使用者建立**隔離的代理執行個體**。每位使用者都會取得自己的：

- 獨立工作區目錄
- 個別的 `USER.md` / `SOUL.md` / `MEMORY.md`
- 私人對話歷史
- 隔離的 Skills 和狀態

這對公開機器人至關重要，因為你會希望每位使用者都有自己的私人 AI 助理體驗。

<Note>
動態綁定包含正規化的 Feishu `accountId`，因此預設帳號和具名帳號會將每個傳送者路由到正確的動態代理。

如果具名帳號在較舊版本上建立了未限定範圍的動態代理，該舊版代理仍會計入 `maxAgents`。移除它之前，請確認預設帳號未使用它，或暫時增加 `maxAgents`；OpenClaw 無法安全推斷哪個帳號擁有含糊的舊版狀態。
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

1. 頻道會產生唯一的 `agentId`：預設帳號為 `feishu-{user_open_id}`，具名帳號則為有界帳號前綴身分摘要
2. 在 `workspaceTemplate` 路徑建立新的工作區
3. 註冊代理並為此使用者建立綁定
4. 工作區輔助程式會確保首次存取時建立啟動檔案（`AGENTS.md`、`SOUL.md`、`USER.md` 等）
5. 將此使用者未來的所有訊息都路由到其專屬代理

### 設定選項

| 設定                                                     | 說明                                   | 預設值                               |
| -------------------------------------------------------- | -------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | 啟用每位使用者自動建立代理程式         | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動態代理程式工作區的路徑範本           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 代理程式目錄名稱範本                   | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 可建立的動態代理程式數量上限           | 無限制                               |

範本變數：

- `{agentId}` - 產生的代理程式 ID（例如 `feishu-ou_xxxxxx` 或 `feishu-support-<identity_digest>`）
- `{userId}` - 傳送者的 Feishu open_id（例如 `ou_xxxxxx`）

### 工作階段範圍

`session.dmScope` 控制私訊如何對應到代理程式工作階段。這是一個會影響所有通道的**全域設定**。

| 值                           | 行為                                             | 最適合                                                           |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| `"main"`                     | 每位使用者的私訊會對應到其代理程式的主要工作階段 | 需要自動載入 `USER.md` / `SOUL.md` 的單一使用者機器人             |
| `"per-channel-peer"`         | 每個（通道 + 使用者）組合都會取得個別工作階段    | 需要更強隔離的公開多使用者機器人                                 |
| `"per-account-channel-peer"` | 每個（帳號 + 通道 + 使用者）組合都會取得個別工作階段 | 需要帳號層級工作階段隔離的多帳號機器人                           |

**權衡**：使用 `"main"` 會啟用自動載入啟動檔案（`USER.md`、`SOUL.md`、`MEMORY.md`），但也表示所有通道中的所有私訊都會共用相同的工作階段鍵模式。對於隔離比自動載入啟動檔更重要的公開多使用者機器人，請考慮使用 `"per-channel-peer"`，並手動管理啟動檔案。

<Note>
當具名 Feishu 帳號應該為同一位傳送者保留個別工作階段時，請使用 `"per-account-channel-peer"`。動態繫結會保留帳號範圍。
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

檢查閘道記錄，確認動態建立功能正在運作：

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

列出所有已建立的工作區：

```bash
ls -la ~/.openclaw/workspace-*
```

### 注意事項

- **工作區隔離**：每位使用者都會取得自己的工作區目錄與代理程式執行個體。在正常訊息流程中，使用者無法看到彼此的對話歷史或檔案。
- **安全邊界**：這是訊息情境隔離機制，不是針對敵意共租戶的安全邊界。代理程式程序與主機環境是共用的。
- **`bindings` 應為空**：動態代理程式會自動註冊自己的繫結
- **升級路徑**：現有手動繫結會繼續與動態代理程式並行運作
- **`session.dmScope` 是全域的**：這會影響所有通道，不只是 Feishu

---

## 設定參考

完整設定：[閘道設定](/zh-TW/gateway/configuration)

| 設定                                                     | 說明                                                                             | 預設值                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | 啟用/停用通道                                                                    | `true`                               |
| `channels.feishu.domain`                                 | API 網域（`feishu` 或 `lark`）                                                   | `feishu`                             |
| `channels.feishu.connectionMode`                         | 事件傳輸（`websocket` 或 `webhook`）                                             | `websocket`                          |
| `channels.feishu.defaultAccount`                         | 外送路由的預設帳號                                                               | `default`                            |
| `channels.feishu.verificationToken`                      | 網路鉤子模式所需                                                                 | -                                    |
| `channels.feishu.encryptKey`                             | 網路鉤子模式所需                                                                 | -                                    |
| `channels.feishu.webhookPath`                            | 網路鉤子路由路徑                                                                 | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | 網路鉤子繫結主機                                                                 | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | 網路鉤子繫結連接埠                                                               | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App ID                                                                           | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                       | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | 每帳號網域覆寫                                                                   | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | 每帳號 TTS 覆寫                                                                  | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | 私訊政策                                                                         | `pairing`                            |
| `channels.feishu.allowFrom`                              | 私訊允許清單（open_id 清單）                                                     | -                                    |
| `channels.feishu.groupPolicy`                            | 群組政策                                                                         | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | 群組允許清單                                                                     | -                                    |
| `channels.feishu.requireMention`                         | 群組中要求 @提及                                                                 | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | 每群組 @提及覆寫；明確 ID 也會在允許清單模式中准入該群組                         | 繼承                                 |
| `channels.feishu.groups.<chat_id>.enabled`               | 啟用/停用特定群組                                                                | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | 啟用每位使用者自動建立代理程式                                                   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 動態代理程式工作區的路徑範本                                                     | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 代理程式目錄名稱範本                                                             | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 可建立的動態代理程式數量上限                                                     | 無限制                               |
| `channels.feishu.textChunkLimit`                         | 訊息分塊大小                                                                     | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | 媒體大小限制                                                                     | `30`                                 |
| `channels.feishu.streaming`                              | 串流卡片輸出                                                                     | `true`                               |
| `channels.feishu.blockStreaming`                         | 已完成區塊回覆串流                                                               | `false`                              |
| `channels.feishu.typingIndicator`                        | 傳送輸入中反應                                                                   | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 解析傳送者顯示名稱                                                               | `true`                               |
| `channels.feishu.tools.bitable`                          | 啟用 Bitable/Base 工具                                                           | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` 的別名；兩者皆設定時，明確的 `bitable` 優先      | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | 每帳號 Bitable/Base 工具閘門                                                     | 繼承                                 |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` 的每帳號別名                                                     | 繼承                                 |

---

## 支援的訊息類型

### 接收

- ✅ 文字
- ✅ 富文字（貼文）
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片/媒體
- ✅ 貼圖

傳入的 Feishu/Lark 音訊訊息會被正規化為媒體預留位置，而不是原始 `file_key` JSON。設定 `tools.media.audio` 時，OpenClaw 會下載語音備忘資源，並在代理程式回合前執行共用音訊轉錄，讓代理程式收到語音逐字稿。如果 Feishu 直接在音訊承載中包含逐字稿文字，該文字會被使用，而不會再次呼叫 ASR。若沒有音訊轉錄提供者，代理程式仍會收到 `<media:audio>` 預留位置加上已儲存的附件，而不是原始 Feishu 資源承載。

### 傳送

- ✅ 文字
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片/媒體
- ✅ 互動卡片（包含串流更新）
- ⚠️ 富文字（貼文式格式；不支援完整的 Feishu/Lark 編輯能力）

原生 Feishu/Lark 音訊泡泡使用 Feishu `audio` 訊息類型，並需要
Ogg/Opus 上傳媒體（`file_type: "opus"`）。現有的 `.opus` 和 `.ogg` 媒體
會直接以原生音訊傳送。MP3/WAV/M4A 和其他可能的音訊格式，只有在回覆要求語音
傳遞（`audioAsVoice` / 訊息工具 `asVoice`，包含 TTS 語音備忘回覆）時，才會使用
`ffmpeg` 轉碼為 48kHz Ogg/Opus。一般 MP3 附件會維持為一般檔案。如果缺少 `ffmpeg` 或
轉換失敗，OpenClaw 會退回使用檔案附件，並記錄原因。

### 討論串與回覆

- ✅ 行內回覆
- ✅ 討論串回覆
- ✅ 回覆討論串訊息時，媒體回覆會保持討論串感知

對於 `groupSessionScope: "group_topic"` 和 `"group_topic_sender"`，原生
Feishu/Lark 主題群組會使用事件 `thread_id`（`omt_*`）作為標準
主題工作階段鍵。如果原生主題起始事件省略 `thread_id`，OpenClaw
會先從 Feishu 補齊它，再路由該回合。OpenClaw 轉成討論串的一般群組回覆
會繼續使用回覆根訊息 ID（`om_*`），讓第一個回合和後續回合維持在同一個工作階段。

---

## 相關

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化措施
