---
read_when:
    - 你想連接一個騰訊元寶機器人
    - 你正在設定騰訊元寶頻道
summary: 騰訊元寶機器人概觀、功能與設定
title: 騰訊元寶
x-i18n:
    generated_at: "2026-07-05T11:08:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

騰訊元寶是騰訊的 AI 助理平台。由社群維護的 `openclaw-plugin-yuanbao` 外掛會透過 WebSocket 將騰訊元寶機器人連接到 OpenClaw，以支援私訊與群組聊天。

**狀態：** 已可在生產環境用於機器人私訊與群組聊天。WebSocket 是唯一支援的連線模式。此 外掛 由騰訊元寶團隊以外部目錄項目的形式維護，而非由 OpenClaw 核心維護；以下設定/行為細節（安裝與通用命令列介面介面之外）來自該 外掛 自身的文件，並未對照 OpenClaw 核心原始碼驗證。

## 快速開始

需要 OpenClaw 2026.4.10 或以上版本。使用 `openclaw --version` 檢查；使用 `openclaw update` 升級。

<Steps>
  <Step title="使用你的憑證新增騰訊元寶頻道">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 使用以冒號分隔的 `appKey:appSecret`。請在你的應用程式設定中建立機器人，並從騰訊元寶應用程式取得這些值。
  </Step>

  <Step title="重新啟動閘道以套用變更">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 互動式設定（替代方式）

```bash
openclaw channels login --channel yuanbao
```

依照提示輸入你的 App ID 與 App Secret。

## 存取控制

### 私訊

`channels.yuanbao.dm.policy`：

| 值               | 行為                                                 |
| ---------------- | ---------------------------------------------------- |
| `open`（預設）   | 允許所有使用者                                       |
| `pairing`        | 未知使用者會取得配對碼；透過命令列介面核准          |
| `allowlist`      | 只有 `allowFrom` 中的使用者可以聊天                  |
| `disabled`       | 停用所有私訊                                         |

核准配對請求：

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 群組聊天

`channels.yuanbao.requireMention`（預設 `true`）：機器人在群組中回應前需要 @提及。回覆機器人自己的訊息會被視為隱含提及。

## 設定範例

基本設定，開放私訊政策：

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

將私訊限制為特定使用者：

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

停用群組中的 @提及需求：

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

調整傳出遞送：

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

設定 `outboundQueueStrategy: "immediate"` 可不經緩衝就傳送每個片段。

## 常用命令

| 命令       | 說明               |
| ---------- | ------------------ |
| `/help`    | 顯示可用命令       |
| `/status`  | 顯示機器人狀態     |
| `/new`     | 開始新工作階段     |
| `/stop`    | 停止目前執行       |
| `/restart` | 重新啟動 OpenClaw  |
| `/compact` | 壓縮工作階段內容   |

騰訊元寶支援原生斜線命令選單；閘道啟動時，命令會自動同步到平台。

## 疑難排解

**機器人在群組聊天中沒有回應：**

1. 確認機器人已加入群組
2. 確認你已 @提及機器人（預設需要）
3. 檢查記錄：`openclaw logs --follow`

**機器人沒有收到訊息：**

1. 確認機器人已在騰訊元寶應用程式中建立並核准
2. 確認 `appKey` 與 `appSecret` 已正確設定
3. 確認閘道正在執行：`openclaw gateway status`
4. 檢查記錄：`openclaw logs --follow`

**機器人傳送空白或後備回覆：**

1. 檢查 AI 模型是否正在傳回有效內容
2. 預設後備回覆：「暫時無法解答，你可以換個問題問問我哦」
3. 使用 `channels.yuanbao.fallbackReply` 自訂

**App Secret 洩漏：**

1. 在騰訊元寶應用程式中重設 App Secret
2. 更新你的設定中的值
3. 重新啟動閘道：`openclaw gateway restart`

## 進階設定

### 多個帳號

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` 控制在傳出 API 未指定 `accountId` 時要使用哪個帳號。

### 訊息限制

- `maxChars`：單則訊息的最大字元數（預設 `3000`）
- `mediaMaxMb`：媒體上傳/下載限制（預設 `20` MB）
- `overflowPolicy`：訊息超過限制時的行為，`"split"`（預設）或 `"stop"`

### 串流

騰訊元寶支援區塊層級串流輸出；機器人會在生成時分段傳送文字。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

設定 `disableBlockStreaming: true` 可用單則訊息傳送完整回覆。

### 群組聊天歷史內容脈絡

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

控制群組聊天中要包含多少則歷史訊息到 AI 內容脈絡中。

### 回覆目標模式

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| 值      | 行為                                           |
| ------- | ---------------------------------------------- |
| `off`   | 不引用回覆                                     |
| `first` | 每則傳入訊息只引用第一則回覆（預設）           |
| `all`   | 引用每一則回覆                                 |

### Markdown 提示注入

預設情況下，機器人會注入系統提示指令，避免模型將整個回覆包在 markdown 程式碼區塊中。

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### 偵錯模式

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

為列出的機器人 ID 啟用未清理的記錄輸出。

### 多代理路由

使用 `bindings` 將騰訊元寶私訊或群組路由到不同代理：

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`：`"yuanbao"`
- `match.peer.kind`：`"direct"`（私訊）或 `"group"`（群組聊天）
- `match.peer.id`：使用者 ID 或群組代碼

## 設定參考

完整設定：[閘道設定](/zh-TW/gateway/configuration)

| 設定                                       | 說明                                              | 預設                                   |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 啟用/停用頻道                                    | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 傳出路由的預設帳號                                | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（簽章 + 票證生成）                        | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（簽章）                                | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | 預先簽署的 token（略過自動票證簽章）              | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | 帳號顯示名稱                                      | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 啟用/停用特定帳號                                 | `true`                                 |
| `channels.yuanbao.dm.policy`               | 私訊政策                                          | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | 私訊允許清單（使用者 ID 清單）                    | -                                      |
| `channels.yuanbao.requireMention`          | 群組中需要 @提及                                  | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 長訊息處理（`split` 或 `stop`）                   | `split`                                |
| `channels.yuanbao.replyToMode`             | 群組回覆目標策略（`off`、`first`、`all`）         | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 傳出策略（`merge-text` 或 `immediate`）           | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text：觸發傳送的最小字元數                  | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text：每則訊息的最大字元數                  | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text：自動清空前的閒置逾時（毫秒）          | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 媒體大小限制（MB）                                | `20`                                   |
| `channels.yuanbao.historyLimit`            | 群組聊天歷史內容脈絡項目                          | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 停用區塊層級串流輸出                              | `false`                                |
| `channels.yuanbao.fallbackReply`           | 模型未傳回內容時的後備回覆                        | `暫時無法解答，你可以換個問題問問我哦` |
| `channels.yuanbao.markdownHintEnabled`     | 注入 markdown 防包裹指令                          | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 偵錯允許清單機器人 ID（未清理記錄）               | `[]`                                   |

## 支援的訊息類型

**接收：** 文字、圖片、檔案、音訊/語音、影片、貼圖/自訂表情符號、自訂元素（連結卡片）。

**傳送：** 文字（markdown）、圖片、檔案、音訊、影片、貼圖。

**對話串與回覆：** 引用回覆（可透過 `replyToMode` 設定）；平台不支援對話串回覆。

## 相關

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
