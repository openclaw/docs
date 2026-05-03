---
read_when:
    - 你想要連接 Feishu/Lark 機器人
    - 您正在設定 Feishu 頻道
summary: Feishu 機器人概觀、功能與設定
title: 飛書
x-i18n:
    generated_at: "2026-05-03T21:27:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16d8156d215d47fa6e7d810e3a70eb8e84176a681669c27de8f58320be83a7a0
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark 是一個一站式協作平台，團隊可在其中聊天、分享文件、管理行事曆，並共同完成工作。

**狀態：** 已可用於生產環境的 bot 私訊與群組聊天。WebSocket 是預設模式；webhook 模式為選用。

---

## 快速開始

<Note>
需要 OpenClaw 2026.4.25 或以上版本。執行 `openclaw --version` 進行檢查。使用 `openclaw update` 升級。
</Note>

<Steps>
  <Step title="Run the channel setup wizard">
  ```bash
  openclaw channels login --channel feishu
  ```
  使用 Feishu/Lark 行動 App 掃描 QR code，即可自動建立 Feishu/Lark bot。
  </Step>
  
  <Step title="After setup completes, restart the gateway to apply the changes">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## 存取控制

### 私訊

設定 `dmPolicy` 以控制誰可以向 bot 傳送私訊：

- `"pairing"` — 未知使用者會收到配對碼；透過 CLI 核准
- `"allowlist"` — 只有列在 `allowFrom` 中的使用者可以聊天（預設：僅 bot 擁有者）
- `"open"` — 只有在 `allowFrom` 包含 `"*"` 時才允許公開私訊；若使用限制性項目，則只有符合條件的使用者可以聊天
- `"disabled"` — 停用所有私訊

**核准配對請求：**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 群組聊天

**群組政策**（`channels.feishu.groupPolicy`）：

| 值            | 行為                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | 回應群組中的所有訊息                                                                         |
| `"allowlist"` | 只回應 `groupAllowFrom` 中的群組，或在 `groups.<chat_id>` 下明確設定的群組                   |
| `"disabled"`  | 停用所有群組訊息；明確的 `groups.<chat_id>` 項目不會覆寫此設定                               |

預設值：`allowlist`

**提及需求**（`channels.feishu.requireMention`）：

- `true` — 需要 @mention（預設）
- `false` — 不需 @mention 即可回應
- 個別群組覆寫：`channels.feishu.groups.<chat_id>.requireMention`
- 僅廣播用途的 `@all` 與 `@_all` 不會被視為 bot 提及。同時提及 `@all` 和直接提及 bot 的訊息，仍會計為 bot 提及。

---

## 群組設定範例

### 允許所有群組，不需要 @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### 允許所有群組，仍需要 @mention

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

在 `allowlist` 模式中，你也可以透過新增明確的 `groups.<chat_id>` 項目來允許某個群組。明確項目不會覆寫 `groupPolicy: "disabled"`。`groups.*` 下的萬用字元預設值會設定相符的群組，但它們本身不會允許群組。

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

## 取得群組／使用者 ID

### 群組 ID（`chat_id`，格式：`oc_xxx`）

在 Feishu/Lark 中開啟群組，點擊右上角的選單圖示，然後前往 **設定**。群組 ID（`chat_id`）會列在設定頁面上。

![取得群組 ID](/images/feishu-get-group-id.png)

### 使用者 ID（`open_id`，格式：`ou_xxx`）

啟動 Gateway，向 bot 傳送私訊，然後查看日誌：

```bash
openclaw logs --follow
```

在日誌輸出中尋找 `open_id`。你也可以檢查待處理的配對請求：

```bash
openclaw pairing list feishu
```

---

## 常用命令

| 命令      | 說明                     |
| --------- | ------------------------ |
| `/status` | 顯示 bot 狀態            |
| `/reset`  | 重設目前工作階段         |
| `/model`  | 顯示或切換 AI 模型       |

<Note>
Feishu/Lark 不支援原生 slash-command 選單，因此請將這些命令作為純文字訊息傳送。
</Note>

---

## 疑難排解

### Bot 在群組聊天中沒有回應

1. 確認 bot 已加入群組
2. 確認你有 @mention bot（預設需要）
3. 驗證 `groupPolicy` 不是 `"disabled"`
4. 檢查日誌：`openclaw logs --follow`

### Bot 收不到訊息

1. 確認 bot 已在 Feishu Open Platform / Lark Developer 發布並核准
2. 確認事件訂閱包含 `im.message.receive_v1`
3. 確認已選取 **persistent connection**（WebSocket）
4. 確認已授予所有必要的權限範圍
5. 確認 Gateway 正在執行：`openclaw gateway status`
6. 檢查日誌：`openclaw logs --follow`

### App Secret 外洩

1. 在 Feishu Open Platform / Lark Developer 中重設 App Secret
2. 更新你的設定中的值
3. 重新啟動 Gateway：`openclaw gateway restart`

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

`defaultAccount` 控制當對外 API 未指定 `accountId` 時要使用哪個帳號。
`accounts.<id>.tts` 使用與 `messages.tts` 相同的形狀，並會深度合併到全域 TTS 設定之上，因此多 bot 的 Feishu 設定可以在全域保留共用的提供者憑證，同時只依帳號覆寫語音、模型、persona 或自動模式。

### 訊息限制

- `textChunkLimit` — 對外文字分段大小（預設：`2000` 個字元）
- `mediaMaxMb` — 媒體上傳／下載限制（預設：`30` MB）

### 串流

Feishu/Lark 支援透過互動式卡片串流回覆。啟用後，bot 會在產生文字時即時更新卡片。

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

設定 `streaming: false` 可在單一訊息中傳送完整回覆。`blockStreaming` 預設關閉；只有在你想要於最終回覆前先送出已完成的 assistant 區塊時才啟用。

### 配額最佳化

使用兩個選用旗標減少 Feishu/Lark API 呼叫次數：

- `typingIndicator`（預設 `true`）：設定為 `false` 可略過輸入中反應呼叫
- `resolveSenderNames`（預設 `true`）：設定為 `false` 可略過傳送者個人資料查詢

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

Feishu/Lark 支援私訊與群組 thread 訊息的 ACP。Feishu/Lark ACP 由文字命令驅動，沒有原生 slash-command 選單，因此請直接在對話中使用 `/acp ...` 訊息。

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

#### 從聊天啟動 ACP

在 Feishu/Lark 私訊或 thread 中：

```text
/acp spawn codex --thread here
```

`--thread here` 適用於私訊與 Feishu/Lark thread 訊息。綁定對話中的後續訊息會直接路由到該 ACP 工作階段。

### 多 Agent 路由

使用 `bindings` 將 Feishu/Lark 私訊或群組路由到不同 agent。

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

請參閱[取得群組／使用者 ID](#get-groupuser-ids) 以取得查詢提示。

---

## 設定參考

完整設定：[Gateway 設定](/zh-TW/gateway/configuration)

| 設定                                              | 說明                                                                             | 預設值           |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | 啟用/停用頻道                                                                    | `true`           |
| `channels.feishu.domain`                          | API 網域（`feishu` 或 `lark`）                                                   | `feishu`         |
| `channels.feishu.connectionMode`                  | 事件傳輸（`websocket` 或 `webhook`）                                             | `websocket`      |
| `channels.feishu.defaultAccount`                  | 外送路由的預設帳號                                                               | `default`        |
| `channels.feishu.verificationToken`               | Webhook 模式必填                                                                 | —                |
| `channels.feishu.encryptKey`                      | Webhook 模式必填                                                                 | —                |
| `channels.feishu.webhookPath`                     | Webhook 路由路徑                                                                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook 繫結主機                                                                 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook 繫結連接埠                                                               | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                                                           | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                                                       | —                |
| `channels.feishu.accounts.<id>.domain`            | 每個帳號的網域覆寫                                                               | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | 每個帳號的 TTS 覆寫                                                              | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM 政策                                                                          | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM 允許清單（open_id 清單）                                                      | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | 群組政策                                                                         | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | 群組允許清單                                                                     | —                |
| `channels.feishu.requireMention`                  | 群組中要求 @mention                                                              | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | 每個群組的 @mention 覆寫；明確 ID 也會在允許清單模式中允許該群組                | 繼承             |
| `channels.feishu.groups.<chat_id>.enabled`        | 啟用/停用特定群組                                                                | `true`           |
| `channels.feishu.textChunkLimit`                  | 訊息分段大小                                                                     | `2000`           |
| `channels.feishu.mediaMaxMb`                      | 媒體大小限制                                                                     | `30`             |
| `channels.feishu.streaming`                       | 串流卡片輸出                                                                     | `true`           |
| `channels.feishu.blockStreaming`                  | 已完成區塊回覆串流                                                               | `false`          |
| `channels.feishu.typingIndicator`                 | 傳送輸入中反應                                                                   | `true`           |
| `channels.feishu.resolveSenderNames`              | 解析傳送者顯示名稱                                                               | `true`           |

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

傳入的 Feishu/Lark 音訊訊息會正規化為媒體預留位置，而不是原始 `file_key`
JSON。設定 `tools.media.audio` 時，OpenClaw 會下載語音備註資源，並在代理程式回合前執行共用音訊轉錄，因此代理程式會收到語音逐字稿。如果 Feishu 直接在音訊酬載中包含逐字稿文字，會使用該文字，而不會再呼叫一次 ASR。若沒有音訊轉錄提供者，代理程式仍會收到 `<media:audio>` 預留位置加上已儲存的附件，而不是原始 Feishu 資源酬載。

### 傳送

- ✅ 文字
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片/媒體
- ✅ 互動式卡片（包含串流更新）
- ⚠️ 富文字（貼文樣式格式；不支援完整 Feishu/Lark 編寫功能）

原生 Feishu/Lark 音訊泡泡使用 Feishu `audio` 訊息類型，且需要 Ogg/Opus 上傳媒體（`file_type: "opus"`）。現有 `.opus` 和 `.ogg` 媒體會直接作為原生音訊傳送。MP3/WAV/M4A 和其他可能的音訊格式，只有在回覆要求語音遞送（`audioAsVoice` / 訊息工具 `asVoice`，包含 TTS 語音備註回覆）時，才會使用 `ffmpeg` 轉碼為 48kHz Ogg/Opus。一般 MP3 附件會維持為一般檔案。如果缺少 `ffmpeg` 或轉換失敗，OpenClaw 會退回使用檔案附件並記錄原因。

### 執行緒與回覆

- ✅ 行內回覆
- ✅ 執行緒回覆
- ✅ 回覆執行緒訊息時，媒體回覆會保持執行緒感知

對於 `groupSessionScope: "group_topic"` 和 `"group_topic_sender"`，原生 Feishu/Lark 主題群組會使用事件 `thread_id`（`omt_*`）作為正式主題工作階段鍵。OpenClaw 轉成執行緒的一般群組回覆會繼續使用回覆根訊息 ID（`om_*`），讓第一個回合與後續回合保持在同一個工作階段中。

---

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
