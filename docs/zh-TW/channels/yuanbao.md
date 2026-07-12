---
read_when:
    - 您想要連接騰訊元寶機器人
    - 您正在設定騰訊元寶頻道
summary: 騰訊元寶機器人概覽、功能與設定
title: 騰訊元寶
x-i18n:
    generated_at: "2026-07-11T21:11:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

騰訊元寶是騰訊的 AI 助理平台。由社群維護的 `openclaw-plugin-yuanbao` 外掛透過 WebSocket 將騰訊元寶機器人連接至 OpenClaw，以支援私人訊息與群組聊天。

**狀態：** 已可投入正式環境，用於機器人私人訊息與群組聊天。WebSocket 是唯一支援的連線模式。此為外部目錄項目，由騰訊元寶團隊維護，而非 OpenClaw 核心團隊；下方的設定與行為詳細資訊（安裝與通用命令列介面操作介面除外）來自此外掛本身的文件，尚未依據 OpenClaw 核心原始碼進行驗證。

## 快速開始

需要 OpenClaw 2026.4.10 或以上版本。使用 `openclaw --version` 檢查版本；使用 `openclaw update` 升級。

<Steps>
  <Step title="使用您的憑證新增騰訊元寶頻道">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 使用以冒號分隔的 `appKey:appSecret`。請在騰訊元寶應用程式的應用設定中建立機器人，以取得這些值。
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

依照提示輸入您的 App ID 與 App Secret。

## 存取控制

### 私人訊息

`channels.yuanbao.dm.policy`：

| 值               | 行為                                               |
| ---------------- | -------------------------------------------------- |
| `open`（預設）   | 允許所有使用者                                     |
| `pairing`        | 未知使用者會取得配對碼；透過命令列介面核准         |
| `allowlist`      | 僅 `allowFrom` 中的使用者可聊天                    |
| `disabled`       | 停用所有私人訊息                                   |

核准配對請求：

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 群組聊天

`channels.yuanbao.requireMention`（預設為 `true`）：機器人在群組中回應前，必須先被 @提及。回覆機器人本身的訊息會視為隱含提及。

## 設定範例

基本設定，開放私人訊息政策：

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

將私人訊息限制為特定使用者：

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

停用群組中的 @提及要求：

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

調整外送傳遞：

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // 緩衝至達到此字元數
      maxChars: 3000, // 超過此上限時強制分割
      idleMs: 5000, // 閒置逾時後自動送出（毫秒）
    },
  },
}
```

設定 `outboundQueueStrategy: "immediate"`，即可不經緩衝而逐一傳送每個區塊。

## 常用命令

| 命令       | 說明                 |
| ---------- | -------------------- |
| `/help`    | 顯示可用命令         |
| `/status`  | 顯示機器人狀態       |
| `/new`     | 開始新的工作階段     |
| `/stop`    | 停止目前的執行       |
| `/restart` | 重新啟動 OpenClaw    |
| `/compact` | 壓縮工作階段脈絡     |

騰訊元寶支援原生斜線命令選單；閘道啟動時，命令會自動同步至平台。

## 疑難排解

**機器人在群組聊天中沒有回應：**

1. 確認機器人已加入群組
2. 確認您有 @提及機器人（預設為必要）
3. 檢查日誌：`openclaw logs --follow`

**機器人沒有收到訊息：**

1. 確認機器人已在騰訊元寶應用程式中建立並獲得核准
2. 確認已正確設定 `appKey` 與 `appSecret`
3. 確認閘道正在執行：`openclaw gateway status`
4. 檢查日誌：`openclaw logs --follow`

**機器人傳送空白或備援回覆：**

1. 檢查 AI 模型是否傳回有效內容
2. 預設備援回覆：「暫時無法解答，你可以換個問題問問我哦」
3. 使用 `channels.yuanbao.fallbackReply` 自訂

**App Secret 外洩：**

1. 在騰訊元寶應用程式中重設 App Secret
2. 更新設定中的值
3. 重新啟動閘道：`openclaw gateway restart`

## 進階設定

### 多個帳戶

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

當外送 API 未指定 `accountId` 時，`defaultAccount` 控制所使用的帳戶。

### 訊息限制

- `maxChars`：單則訊息的最大字元數（預設為 `3000`）
- `mediaMaxMb`：媒體上傳／下載限制（預設為 `20` MB）
- `overflowPolicy`：訊息超過限制時的行為，可設為 `"split"`（預設）或 `"stop"`

### 串流

騰訊元寶支援區塊層級的串流輸出；機器人會在產生文字時分塊傳送。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // 啟用區塊串流（預設）
    },
  },
}
```

設定 `disableBlockStreaming: true`，即可在單則訊息中傳送完整回覆。

### 群組聊天歷史脈絡

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // 預設：100，設為 0 可停用
    },
  },
}
```

控制群組聊天的 AI 脈絡中包含多少則歷史訊息。

### 引用回覆模式

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all"（預設："first"）
    },
  },
}
```

| 值      | 行為                                           |
| ------- | ---------------------------------------------- |
| `off`   | 不使用引用回覆                                 |
| `first` | 每則收到的訊息僅引用第一次回覆（預設）         |
| `all`   | 引用每次回覆                                   |

### Markdown 提示注入

機器人預設會注入一項系統提示詞指示，避免模型將整份回覆包在 Markdown 程式碼區塊中。

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // 預設：true
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

為列出的機器人 ID 啟用未經淨化處理的日誌輸出。

### 多代理程式路由

使用 `bindings` 將騰訊元寶私人訊息或群組路由至不同的代理程式：

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
- `match.peer.kind`：`"direct"`（私人訊息）或 `"group"`（群組聊天）
- `match.peer.id`：使用者 ID 或群組代碼

## 設定參考

完整設定：[閘道設定](/zh-TW/gateway/configuration)

| 設定                                       | 說明                                              | 預設值                                 |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 啟用／停用頻道                                    | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 外送路由的預設帳戶                                | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（簽署與票證產生）                         | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（簽署）                                | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | 預先簽署的權杖（略過自動票證簽署）                | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | 帳戶顯示名稱                                      | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 啟用／停用特定帳戶                                | `true`                                 |
| `channels.yuanbao.dm.policy`               | 私人訊息政策                                      | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | 私人訊息允許清單（使用者 ID 清單）                | -                                      |
| `channels.yuanbao.requireMention`          | 在群組中要求 @提及                                | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 長訊息處理方式（`split` 或 `stop`）               | `split`                                |
| `channels.yuanbao.replyToMode`             | 群組引用回覆策略（`off`、`first`、`all`）         | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 外送策略（`merge-text` 或 `immediate`）           | `merge-text`                           |
| `channels.yuanbao.minChars`                | 合併文字：觸發傳送的最小字元數                    | `2800`                                 |
| `channels.yuanbao.maxChars`                | 合併文字：每則訊息的最大字元數                    | `3000`                                 |
| `channels.yuanbao.idleMs`                  | 合併文字：自動送出前的閒置逾時（毫秒）            | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 媒體大小限制（MB）                                | `20`                                   |
| `channels.yuanbao.historyLimit`            | 群組聊天歷史脈絡項目數                            | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 停用區塊層級串流輸出                              | `false`                                |
| `channels.yuanbao.fallbackReply`           | 模型未傳回內容時的備援回覆                        | `暫時無法解答，你可以換個問題問問我哦` |
| `channels.yuanbao.markdownHintEnabled`     | 注入防止 Markdown 整體包裹的指示                  | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 偵錯允許清單中的機器人 ID（未淨化日誌）           | `[]`                                   |

## 支援的訊息類型

**接收：** 文字、圖片、檔案、音訊／語音、影片、貼圖／自訂表情符號、自訂元素（連結卡片）。

**傳送：** 文字（Markdown）、圖片、檔案、音訊、影片、貼圖。

**討論串與回覆：** 引用回覆（可透過 `replyToMode` 設定）；平台不支援討論串回覆。

## 相關內容

- [頻道總覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私人訊息驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及限制
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與安全強化
