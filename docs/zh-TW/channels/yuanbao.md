---
read_when:
    - 你想要連接 Yuanbao 機器人
    - 您正在設定 Yuanbao 頻道
summary: Yuanbao 機器人概覽、功能與設定
title: 元寶
x-i18n:
    generated_at: "2026-04-30T02:50:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao 是 Tencent 的 AI 助理平台。OpenClaw 頻道 Plugin
透過 WebSocket 將 Yuanbao 機器人連接到 OpenClaw，讓它們可以透過私訊和群組聊天
與使用者互動。

**狀態：** 可用於生產環境，支援機器人私訊與群組聊天。WebSocket 是唯一支援的連線模式。

---

## 快速開始

> **需要 OpenClaw 2026.4.10 或以上版本。** 執行 `openclaw --version` 檢查。使用 `openclaw update` 升級。

<Steps>
  <Step title="使用你的憑證新增 Yuanbao 頻道">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 值使用以冒號分隔的 `appKey:appSecret` 格式。你可以在 Yuanbao 應用程式的應用設定中建立機器人來取得這些資訊。
  </Step>

  <Step title="設定完成後，重新啟動 Gateway 以套用變更">
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

### 私訊

設定 `dmPolicy` 以控制誰可以私訊機器人：

- `"pairing"` — 未知使用者會收到配對碼；透過 CLI 核准
- `"allowlist"` — 只有列於 `allowFrom` 的使用者可以聊天
- `"open"` — 允許所有使用者（預設）
- `"disabled"` — 停用所有私訊

**核准配對請求：**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 群組聊天

**提及要求** (`channels.yuanbao.requireMention`)：

- `true` — 需要 @提及（預設）
- `false` — 不需要 @提及即可回應

在群組聊天中回覆機器人的訊息會被視為隱含提及。

---

## 設定範例

### 使用開放私訊政策的基本設定

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

### 將私訊限制為特定使用者

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

### 停用群組中的 @提及要求

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### 最佳化外送訊息傳遞

```json5
{
  channels: {
    yuanbao: {
      // 立即傳送每個片段，不進行緩衝
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
      minChars: 2800, // 緩衝直到達到此字元數
      maxChars: 3000, // 超過此限制時強制分割
      idleMs: 5000, // 閒置逾時後自動清空緩衝（毫秒）
    },
  },
}
```

---

## 常用命令

| 命令       | 說明             |
| ---------- | ---------------- |
| `/help`    | 顯示可用命令     |
| `/status`  | 顯示機器人狀態   |
| `/new`     | 開始新工作階段   |
| `/stop`    | 停止目前執行     |
| `/restart` | 重新啟動 OpenClaw |
| `/compact` | 壓縮工作階段內容 |

> Yuanbao 支援原生斜線命令選單。命令會在 Gateway 啟動時自動同步到平台。

---

## 疑難排解

### 機器人在群組聊天中沒有回應

1. 確認機器人已加入群組
2. 確認你有 @提及機器人（預設為必要）
3. 檢查記錄：`openclaw logs --follow`

### 機器人沒有接收訊息

1. 確認機器人已在 Yuanbao 應用程式中建立並核准
2. 確認 `appKey` 和 `appSecret` 已正確設定
3. 確認 Gateway 正在執行：`openclaw gateway status`
4. 檢查記錄：`openclaw logs --follow`

### 機器人傳送空白或備援回覆

1. 檢查 AI 模型是否回傳有效內容
2. 預設備援回覆是："暫時無法解答，你可以換個問題問問我哦"
3. 透過 `channels.yuanbao.fallbackReply` 自訂

### App Secret 洩漏

1. 在 YuanBao APP 中重設 App Secret
2. 更新你的設定中的值
3. 重新啟動 Gateway：`openclaw gateway restart`

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

`defaultAccount` 控制當外送 API 未指定 `accountId` 時使用哪個帳號。

### 訊息限制

- `maxChars` — 單則訊息最大字元數（預設：`3000` 個字元）
- `mediaMaxMb` — 媒體上傳／下載限制（預設：`20` MB）
- `overflowPolicy` — 訊息超過限制時的行為：`"split"`（預設）或 `"stop"`

### 串流

Yuanbao 支援區塊層級串流輸出。啟用後，機器人會在產生文字時分段傳送。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // 已啟用區塊串流（預設）
    },
  },
}
```

設定 `disableBlockStreaming: true` 以在單則訊息中傳送完整回覆。

### 群組聊天歷史內容

控制在群組聊天的 AI 內容中包含多少則歷史訊息：

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // 預設：100，設為 0 可停用
    },
  },
}
```

### 回覆目標模式

控制機器人在群組聊天中回覆時如何引用訊息：

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all"（預設："first"）
    },
  },
}
```

| 值        | 行為                               |
| --------- | ---------------------------------- |
| `"off"`   | 不引用回覆                         |
| `"first"` | 每則傳入訊息只引用第一個回覆（預設） |
| `"all"`   | 引用每個回覆                       |

### Markdown 提示注入

預設情況下，機器人會在系統提示中注入指示，防止 AI 模型將整個回覆包在 markdown 程式碼區塊中。

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

針對特定機器人 ID 啟用未清理的記錄輸出：

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

使用 `bindings` 將 Yuanbao 私訊或群組路由到不同代理。

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

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"`（私訊）或 `"group"`（群組聊天）
- `match.peer.id`: 使用者 ID 或群組代碼

---

## 設定參考

完整設定：[Gateway 設定](/zh-TW/gateway/configuration)

| 設定                                       | 說明                                      | 預設                                   |
| ------------------------------------------ | ----------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 啟用／停用頻道                            | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 外送路由的預設帳號                        | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（用於簽署和產生票證）             | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（用於簽署）                    | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | 預先簽署的權杖（略過自動票證簽署）        | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | 帳號顯示名稱                              | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 啟用／停用特定帳號                        | `true`                                 |
| `channels.yuanbao.dm.policy`               | 私訊政策                                  | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | 私訊允許清單（使用者 ID 清單）            | —                                      |
| `channels.yuanbao.requireMention`          | 在群組中要求 @提及                        | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 長訊息處理（`split` 或 `stop`）           | `split`                                |
| `channels.yuanbao.replyToMode`             | 群組回覆目標策略（`off`、`first`、`all`） | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 外送策略（`merge-text` 或 `immediate`）   | `merge-text`                           |
| `channels.yuanbao.minChars`                | 合併文字：觸發傳送的最小字元數            | `2800`                                 |
| `channels.yuanbao.maxChars`                | 合併文字：每則訊息的最大字元數            | `3000`                                 |
| `channels.yuanbao.idleMs`                  | 合併文字：自動清空緩衝前的閒置逾時（毫秒） | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 媒體大小限制（MB）                        | `20`                                   |
| `channels.yuanbao.historyLimit`            | 群組聊天歷史內容項目                      | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 停用區塊層級串流輸出                      | `false`                                |
| `channels.yuanbao.fallbackReply`           | AI 未回傳內容時的備援回覆                 | `暫時無法解答，你可以換個問題問問我哦` |
| `channels.yuanbao.markdownHintEnabled`     | 注入 markdown 防包覆指示                  | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 偵錯允許清單機器人 ID（未清理記錄）       | `[]`                                   |

---

## 支援的訊息類型

### 接收

- ✅ 文字
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊／語音
- ✅ 影片
- ✅ 貼圖／自訂表情符號
- ✅ 自訂元素（連結卡片等）

### 傳送

- ✅ 文字（支援 markdown）
- ✅ 圖片
- ✅ 檔案
- ✅ 音訊
- ✅ 影片
- ✅ 貼圖

### 對話串與回覆

- ✅ 引用回覆（可透過 `replyToMode` 設定）
- ❌ 對話串回覆（平台不支援）

---

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證和配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為和提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型和強化
