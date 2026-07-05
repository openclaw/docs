---
read_when:
    - 你想將 OpenClaw 連接到 IRC 頻道或私訊
    - 你正在設定 IRC 允許清單、群組政策或提及管控
summary: IRC 外掛設定、存取控制與疑難排解
title: IRC
x-i18n:
    generated_at: "2026-07-05T11:02:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

當你想在傳統頻道（`#room`）和直接訊息中使用 OpenClaw 時，請使用 IRC。
安裝官方 IRC 外掛，然後在 `channels.irc` 下設定。

## 快速開始

1. 安裝外掛：

```bash
openclaw plugins install @openclaw/irc
```

2. 在 `~/.openclaw/openclaw.json` 中至少設定 host、nick，以及要加入的頻道：

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

3. 啟動/重新啟動閘道：

```bash
openclaw gateway run
```

建議使用私人 IRC 伺服器進行機器人協調。如果你有意使用公開 IRC 網路，常見選擇包括 Libera.Chat、OFTC 和 Snoonet。避免將可預測的公開頻道用於機器人或群集後端通道流量。

## 連線設定

| 鍵                            | 預設值                        | 備註                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | 無（必填）                    | IRC 伺服器主機名稱                                         |
| `port`                        | 使用 TLS 時為 `6697`，明文為 `6667` | 1-65535                                                     |
| `tls`                         | `true`                        | 僅在有意使用明文時設為 `false`                             |
| `nick`                        | 無（必填）                    | 機器人暱稱                                                 |
| `username`                    | nick，否則為 `openclaw`       | IRC 使用者名稱                                             |
| `realname`                    | `OpenClaw`                    | Realname/GECOS 欄位                                        |
| `password` / `passwordFile`   | 無                            | 伺服器密碼；檔案必須是一般檔案                             |
| `channels`                    | 無                            | 要加入的頻道（`["#openclaw"]`）                            |
| `accounts` / `defaultAccount` | 無                            | 多帳號設定；環境變數只會填入預設帳號                       |

## 安全性預設值

- IRC 會使用 OpenClaw 操作者管理的轉送代理路由之外的原始 TCP/TLS socket。在要求所有輸出流量都必須通過該轉送代理的部署中，除非已明確核准直接 IRC 輸出，否則請設定 `channels.irc.enabled=false`。
- `channels.irc.dmPolicy` 預設為 `"pairing"`：未知的 DM 傳送者會收到一組配對碼，你可使用 `openclaw pairing approve irc <code>` 核准。
- `channels.irc.groupPolicy` 預設為 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 時，請設定 `channels.irc.groups` 來定義允許的頻道。
- 除非你有意接受明文傳輸，否則請使用 TLS（`channels.irc.tls=true`）。

## 存取控制

IRC 頻道有兩個獨立的「關卡」：

1. **頻道存取**（`groupPolicy` + `groups`）：機器人是否接受某個頻道的訊息。
2. **傳送者存取**（`groupAllowFrom` / 每頻道 `groups["#channel"].allowFrom`）：誰可以在該頻道內觸發機器人。

設定鍵：

- DM 允許清單（DM 傳送者存取）：`channels.irc.allowFrom`
- 群組傳送者允許清單（頻道傳送者存取）：`channels.irc.groupAllowFrom`
- 每頻道控制（頻道 + 傳送者 + 提及規則）：`channels.irc.groups["#channel"]`，搭配 `requireMention`、`allowFrom`、`enabled`、`tools`、`toolsBySender`、`skills` 和 `systemPrompt`
- `channels.irc.groupPolicy="open"` 允許未設定的頻道（**預設仍受提及門檻限制**）

允許清單項目應使用穩定的傳送者身分（`nick!user@host`）。
裸 nick 比對是可變的，且只有在 `channels.irc.dangerouslyAllowNameMatching: true` 時才會啟用。

### 常見陷阱：`allowFrom` 用於 DM，不是頻道

如果你看到類似下列的日誌：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...這表示該傳送者未被允許傳送**群組/頻道**訊息。可用以下任一方式修正：

- 設定 `channels.irc.groupAllowFrom`（全域套用至所有頻道），或
- 設定每頻道傳送者允許清單：`channels.irc.groups["#channel"].allowFrom`

範例（允許 `#openclaw` 中的任何人與機器人對話）：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 回覆觸發（提及）

即使某個頻道已被允許（透過 `groupPolicy` + `groups`），且傳送者也被允許，OpenClaw 在群組情境中預設仍會使用**提及門檻**。當訊息包含已連線機器人的 nick，或符合你設定的提及模式時，機器人才會視為被提及。

這表示除非訊息包含符合機器人的提及模式，否則你可能會看到像 `drop channel … (missing-mention)` 的日誌。

若要讓機器人在 IRC 頻道中**不需要提及也能回覆**，請停用該頻道的提及門檻：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

或者允許**所有** IRC 頻道（不使用每頻道允許清單），且仍不需提及即可回覆：

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
若要降低風險，請限制該頻道的工具。

### 頻道中所有人使用相同工具

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
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

### 每位傳送者使用不同工具（擁有者取得更多權限）

使用 `toolsBySender` 對 `"*"` 套用較嚴格的政策，並對你的 nick 套用較寬鬆的政策：

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

備註：

- `toolsBySender` 鍵應使用明確前綴（`channel:`、`id:`、`e164:`、`username:`、`name:`）。IRC 請使用 `id:` 搭配傳送者身分值：`id:alice`，或使用 `id:alice!~alice@203.0.113.7` 進行更強的比對。
- 舊版未加前綴的鍵仍會被接受，只會以 `id:` 比對，並會發出棄用警告。
- 第一個符合的傳送者政策會生效；`"*"` 是萬用字元後援。

如需了解群組存取與提及門檻（以及兩者如何互動）的更多資訊，請參閱：[/channels/groups](/zh-TW/channels/groups)。

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

只要設定了密碼，NickServ 識別預設就會執行（只有要退出時才需要將 `enabled` 設為 `false`）。`service` 預設為 `NickServ`；`passwordFile` 是內嵌 `password` 的替代方式。

連線時可選擇進行一次性註冊（`register: true` 需要 `registerEmail`）：

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

nick 註冊完成後，請停用 `register`，以避免重複嘗試 REGISTER。

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

- 如果機器人已連線但從未在頻道中回覆，請確認 `channels.irc.groups` **以及**提及門檻是否正在丟棄訊息（`missing-mention`）。如果你希望它不需被 ping 也能回覆，請為該頻道設定 `requireMention:false`。
- 如果登入失敗，請確認 nick 可用性與伺服器密碼。
- 如果自訂網路上的 TLS 失敗，請確認主機/連接埠與憑證設定。

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
