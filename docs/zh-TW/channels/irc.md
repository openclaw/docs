---
read_when:
    - 您想要將 OpenClaw 連接到 IRC 頻道或私訊
    - 您正在設定 IRC 允許清單、群組政策或提及閘控
summary: IRC Plugin 設定、存取控制與疑難排解
title: IRC
x-i18n:
    generated_at: "2026-04-30T02:47:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 16
---

使用 IRC 可讓 OpenClaw 進入傳統頻道（`#room`）和私訊。
IRC 以隨附的 Plugin 提供，但設定位於主要設定檔的 `channels.irc` 下。

## 快速開始

1. 在 `~/.openclaw/openclaw.json` 啟用 IRC 設定。
2. 至少設定：

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

建議使用私人 IRC 伺服器進行機器人協調。如果你刻意使用公開 IRC 網路，常見選擇包括 Libera.Chat、OFTC 和 Snoonet。避免將可預測的公開頻道用於機器人或群集後端通道流量。

3. 啟動/重新啟動 Gateway：

```bash
openclaw gateway run
```

## 安全性預設值

- `channels.irc.dmPolicy` 預設為 `"pairing"`。
- `channels.irc.groupPolicy` 預設為 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 時，請設定 `channels.irc.groups` 來定義允許的頻道。
- 除非你刻意接受純文字傳輸，否則請使用 TLS（`channels.irc.tls=true`）。

## 存取控制

IRC 頻道有兩個獨立的「關卡」：

1. **頻道存取**（`groupPolicy` + `groups`）：機器人是否會接受來自某個頻道的訊息。
2. **傳送者存取**（`groupAllowFrom` / 每頻道 `groups["#channel"].allowFrom`）：誰可以在該頻道內觸發機器人。

設定鍵：

- 私訊允許清單（私訊傳送者存取）：`channels.irc.allowFrom`
- 群組傳送者允許清單（頻道傳送者存取）：`channels.irc.groupAllowFrom`
- 每頻道控制（頻道 + 傳送者 + 提及規則）：`channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` 允許未設定的頻道（**預設仍受提及限制**）

允許清單項目應使用穩定的傳送者身分（`nick!user@host`）。
裸暱稱比對是可變的，只有在 `channels.irc.dangerouslyAllowNameMatching: true` 時才會啟用。

### 常見陷阱：`allowFrom` 用於私訊，不是頻道

如果你看到如下記錄：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……這表示該傳送者未被允許傳送**群組/頻道**訊息。可用以下任一方式修正：

- 設定 `channels.irc.groupAllowFrom`（套用於所有頻道的全域設定），或
- 設定每頻道傳送者允許清單：`channels.irc.groups["#channel"].allowFrom`

範例（允許 `#tuirc-dev` 中任何人與機器人對話）：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 回覆觸發（提及）

即使頻道已被允許（透過 `groupPolicy` + `groups`）且傳送者已被允許，OpenClaw 在群組情境中預設仍會採用**提及限制**。

這表示你可能會看到類似 `drop channel … (missing-mention)` 的記錄，除非訊息包含符合機器人的提及模式。

若要讓機器人在 IRC 頻道中**不需要提及即可回覆**，請停用該頻道的提及限制：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

或者，若要允許**所有** IRC 頻道（不使用每頻道允許清單），且仍可不需提及就回覆：

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## 安全性注意事項（建議用於公開頻道）

如果你在公開頻道中允許 `allowFrom: ["*"]`，任何人都可以提示機器人。
若要降低風險，請限制該頻道可用的工具。

### 頻道內所有人使用相同工具

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### 依傳送者使用不同工具（擁有者取得更多權限）

使用 `toolsBySender`，對 `"*"` 套用較嚴格的政策，對你的暱稱套用較寬鬆的政策：

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

注意事項：

- `toolsBySender` 鍵應對 IRC 傳送者身分值使用 `id:`：
  `id:eigen`，或使用 `id:eigen!~eigen@174.127.248.171` 進行更強的比對。
- 舊版未加前綴的鍵仍會被接受，並且只會以 `id:` 進行比對。
- 第一個相符的傳送者政策會生效；`"*"` 是萬用字元後備項目。

若要深入了解群組存取與提及限制（以及它們如何互動），請參閱：[/channels/groups](/zh-TW/channels/groups)。

## NickServ

若要在連線後向 NickServ 識別身分：

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

連線時可選的一次性註冊：

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

暱稱註冊完成後，請停用 `register`，以避免重複嘗試 REGISTER。

## 環境變數

預設帳號支援：

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（逗號分隔）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` 不能從工作區 `.env` 設定；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。

## 疑難排解

- 如果機器人已連線但從不在頻道中回覆，請確認 `channels.irc.groups` **以及**提及限制是否正在丟棄訊息（`missing-mention`）。如果你希望它不需要 ping 就回覆，請為該頻道設定 `requireMention:false`。
- 如果登入失敗，請確認暱稱可用性和伺服器密碼。
- 如果自訂網路上的 TLS 失敗，請確認主機/連接埠和憑證設定。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及限制
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
