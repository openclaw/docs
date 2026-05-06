---
read_when:
    - 您想連接元寶機器人
    - 您正在設定 Yuanbao 頻道
summary: Yuanbao 機器人概覽、功能與設定
title: 元寶
x-i18n:
    generated_at: "2026-05-06T09:03:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao 是騰訊的 AI 助理平台。OpenClaw channel plugin
透過 WebSocket 將 Yuanbao 機器人連接到 OpenClaw，讓它們可以透過
直接訊息與群組聊天與使用者互動。

**狀態：** 可用於生產環境的機器人 DM + 群組聊天。WebSocket 是唯一支援的連線模式。

---

## 快速開始

> **需要 OpenClaw 2026.4.10 或以上版本。** 執行 `openclaw --version` 檢查版本。使用 `openclaw update` 升級。

<Steps>
  <Step title="使用你的憑證新增 Yuanbao channel">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 值使用以冒號分隔的 `appKey:appSecret` 格式。你可以在 Yuanbao 應用程式中，透過在應用程式設定建立機器人來取得這些值。
  </Step>

  <Step title="設定完成後，重新啟動 gateway 以套用變更">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 互動式設定（替代方式）

你也可以使用互動式精靈：

```bash
openclaw channels login --channel yuanbao
```

依照提示輸入你的 App ID 和 App Secret。

---

## 存取控制

### 直接訊息

設定 `dmPolicy` 以控制誰可以向機器人傳送 DM：

- `"pairing"` - 未知使用者會收到配對代碼；透過 CLI 核准
- `"allowlist"` - 只有列在 `allowFrom` 中的使用者可以聊天
- `"open"` - 允許所有使用者（預設）
- `"disabled"` - 停用所有 DM

**核准配對請求：**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 群組聊天

**提及要求**（`channels.yuanbao.requireMention`）：

- `true` - 需要 @mention（預設）
- `false` - 無需 @mention 也會回應

在群組聊天中回覆機器人的訊息，會被視為隱含提及。

---

## 設定範例

### 使用開放 DM 政策的基本設定

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

### 將 DM 限制為特定使用者

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

### 停用群組中的 @mention 要求

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### 最佳化傳出訊息傳遞

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### 調整合併文字策略

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

---

## 常用指令

| 指令       | 說明                   |
| ---------- | ---------------------- |
| `/help`    | 顯示可用指令           |
| `/status`  | 顯示機器人狀態         |
| `/new`     | 啟動新工作階段         |
| `/stop`    | 停止目前執行           |
| `/restart` | 重新啟動 OpenClaw      |
| `/compact` | 壓縮工作階段上下文     |

> Yuanbao 支援原生斜線指令選單。指令會在 gateway 啟動時自動同步到平台。

---

## 疑難排解

### 機器人在群組聊天中沒有回應

1. 確認機器人已加入群組
2. 確認你已 @mention 機器人（預設為必要）
3. 檢查記錄：`openclaw logs --follow`

### 機器人未收到訊息

1. 確認機器人已在 Yuanbao 應用程式中建立並核准
2. 確認 `appKey` 和 `appSecret` 已正確設定
3. 確認 gateway 正在執行：`openclaw gateway status`
4. 檢查記錄：`openclaw logs --follow`

### 機器人傳送空白或後備回覆

1. 檢查 AI 模型是否回傳有效內容
2. 預設後備回覆是："暂时无法解答，你可以换个问题问问我哦"
3. 透過 `channels.yuanbao.fallbackReply` 自訂

### App Secret 外洩

1. 在 YuanBao APP 中重設 App Secret
2. 更新你設定中的值
3. 重新啟動 gateway：`openclaw gateway restart`

---

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

`defaultAccount` 控制傳出 API 未指定 `accountId` 時要使用哪個帳號。

### 訊息限制

- `maxChars` - 單則訊息的最大字元數（預設：`3000` 個字元）
- `mediaMaxMb` - 媒體上傳/下載限制（預設：`20` MB）
- `overflowPolicy` - 訊息超過限制時的行為：`"split"`（預設）或 `"stop"`

### 串流

Yuanbao 支援區塊層級的串流輸出。啟用時，機器人會在生成文字時分塊傳送。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

設定 `disableBlockStreaming: true` 以在一則訊息中傳送完整回覆。

### 群組聊天歷史上下文

控制在群組聊天中納入 AI 上下文的歷史訊息數量：

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### 回覆引用模式

控制機器人在群組聊天回覆時如何引用訊息：

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| 值        | 行為                                   |
| --------- | -------------------------------------- |
| `"off"`   | 不引用回覆                             |
| `"first"` | 每則傳入訊息只引用第一則回覆（預設）   |
| `"all"`   | 引用每一則回覆                         |

### Markdown 提示注入

預設情況下，機器人會在系統提示中注入指示，以防止 AI 模型將整個回覆包在 markdown 程式碼區塊中。

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

為特定機器人 ID 啟用未清理的記錄輸出：

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### 多代理路由

使用 `bindings` 將 Yuanbao DM 或群組路由到不同代理。

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

路由欄位：

- `match.channel`：`"yuanbao"`
- `match.peer.kind`：`"direct"`（DM）或 `"group"`（群組聊天）
- `match.peer.id`：使用者 ID 或群組代碼

---

## 設定參考

完整設定：[Gateway 設定](/zh-TW/gateway/configuration)

| 設定                                       | 說明                                               | 預設                                   |
| ------------------------------------------ | -------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 啟用/停用 channel                                  | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 傳出路由的預設帳號                                 | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（用於簽署和票證產生）                      | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（用於簽署）                             | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | 預先簽署的權杖（略過自動票證簽署）                 | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | 帳號顯示名稱                                       | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 啟用/停用特定帳號                                  | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM 政策                                            | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM 允許清單（使用者 ID 清單）                      | -                                      |
| `channels.yuanbao.requireMention`          | 群組中需要 @mention                                | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 長訊息處理（`split` 或 `stop`）                    | `split`                                |
| `channels.yuanbao.replyToMode`             | 群組 reply-to 策略（`off`、`first`、`all`）        | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 傳出策略（`merge-text` 或 `immediate`）            | `merge-text`                           |
| `channels.yuanbao.minChars`                | 合併文字：觸發傳送的最小字元數                     | `2800`                                 |
| `channels.yuanbao.maxChars`                | 合併文字：每則訊息的最大字元數                     | `3000`                                 |
| `channels.yuanbao.idleMs`                  | 合併文字：自動清空前的閒置逾時（毫秒）             | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 媒體大小限制（MB）                                 | `20`                                   |
| `channels.yuanbao.historyLimit`            | 群組聊天歷史上下文項目                             | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 停用區塊層級串流輸出                               | `false`                                |
| `channels.yuanbao.fallbackReply`           | AI 未回傳內容時的後備回覆                          | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | 注入 markdown 防包裹指示                           | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 偵錯允許清單機器人 ID（未清理記錄）                | `[]`                                   |

---

## 支援的訊息類型

### 接收

- ✅ 文字
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊 / 語音
- ✅ 影片
- ✅ 貼圖 / 自訂表情符號
- ✅ 自訂元素（連結卡片等）

### 傳送

- ✅ 文字（支援 markdown）
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片
- ✅ 貼圖

### 執行緒與回覆

- ✅ 引用回覆（可透過 `replyToMode` 設定）
- ❌ 執行緒回覆（平台不支援）

---

## 相關

- [Channels Overview](/zh-TW/channels) - 所有支援的 channel
- [Pairing](/zh-TW/channels/pairing) - DM 驗證與配對流程
- [Groups](/zh-TW/channels/groups) - 群組聊天行為與提及控管
- [Channel Routing](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [Security](/zh-TW/gateway/security) - 存取模型與強化措施
