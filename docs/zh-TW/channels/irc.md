---
read_when:
    - 你想將 OpenClaw 連接至 IRC 頻道或私訊對話
    - 你正在設定 IRC 允許清單、群組政策或提及閘控
summary: IRC 外掛設定、存取控制與疑難排解
title: IRC
x-i18n:
    generated_at: "2026-07-11T21:06:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

當你想在傳統頻道（`#room`）和私人訊息中使用 OpenClaw 時，請使用 IRC。
安裝官方 IRC 外掛，然後在 `channels.irc` 下進行設定。

## 快速開始

1. 安裝外掛：

```bash
openclaw plugins install @openclaw/irc
```

2. 在 `~/.openclaw/openclaw.json` 中至少設定主機、暱稱及要加入的頻道：

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

3. 啟動／重新啟動閘道：

```bash
openclaw gateway run
```

建議使用私人 IRC 伺服器進行機器人協調。若你刻意使用公共 IRC 網路，常見選擇包括 Libera.Chat、OFTC 和 Snoonet。避免使用容易猜到的公共頻道傳輸機器人或叢集的後端通訊流量。

## 連線設定

| 鍵                            | 預設值                        | 備註                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | 無（必填）                    | IRC 伺服器主機名稱                                          |
| `port`                        | TLS 使用 `6697`，明文使用 `6667` | 1-65535                                                  |
| `tls`                         | `true`                        | 只有刻意使用明文時才設為 `false`                            |
| `nick`                        | 無（必填）                    | 機器人暱稱                                                  |
| `username`                    | 暱稱，否則為 `openclaw`       | IRC 使用者名稱                                              |
| `realname`                    | `OpenClaw`                    | Realname/GECOS 欄位                                         |
| `password` / `passwordFile`   | 無                            | 伺服器密碼；檔案必須是一般檔案                              |
| `channels`                    | 無                            | 要加入的頻道（`["#openclaw"]`）                             |
| `accounts` / `defaultAccount` | 無                            | 多帳號設定；環境變數只會填入預設帳號                        |

## 安全性預設值

- IRC 使用不經 OpenClaw 操作者管理之前向 Proxy 路由的原始 TCP/TLS 通訊端。在要求所有對外流量都經過該前向 Proxy 的部署中，除非已明確核准 IRC 直接對外連線，否則請設定 `channels.irc.enabled=false`。
- `channels.irc.dmPolicy` 預設為 `"pairing"`：未知的私人訊息傳送者會收到配對碼，你可使用 `openclaw pairing approve irc <code>` 核准。
- `channels.irc.groupPolicy` 預設為 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 時，請設定 `channels.irc.groups` 以定義允許的頻道。
- 除非你刻意接受明文傳輸，否則請使用 TLS（`channels.irc.tls=true`）。

## 存取控制

IRC 頻道有兩個獨立的「關卡」：

1. **頻道存取**（`groupPolicy` + `groups`）：機器人是否接受來自某頻道的任何訊息。
2. **傳送者存取**（`groupAllowFrom`／各頻道的 `groups["#channel"].allowFrom`）：允許誰在該頻道內觸發機器人。

設定鍵：

- 私人訊息允許清單（私人訊息傳送者存取）：`channels.irc.allowFrom`
- 群組傳送者允許清單（頻道傳送者存取）：`channels.irc.groupAllowFrom`
- 各頻道控制（頻道、傳送者及提及規則）：`channels.irc.groups["#channel"]`，包含 `requireMention`、`allowFrom`、`enabled`、`tools`、`toolsBySender`、`skills` 及 `systemPrompt`
- `channels.irc.groupPolicy="open"` 允許未設定的頻道（**預設仍須提及才能觸發**）

允許清單項目應使用穩定的傳送者身分（`nick!user@host`）。
僅比對暱稱容易發生變動，且只有在設定 `channels.irc.dangerouslyAllowNameMatching: true` 時才會啟用。

### 常見陷阱：`allowFrom` 用於私人訊息，不用於頻道

若你看到如下記錄：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……表示該傳送者未獲准傳送**群組／頻道**訊息。可使用下列任一方式修正：

- 設定 `channels.irc.groupAllowFrom`（套用至所有頻道的全域設定），或
- 設定各頻道的傳送者允許清單：`channels.irc.groups["#channel"].allowFrom`

範例（允許 `#openclaw` 中的任何人與機器人交談）：

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

即使已允許某個頻道（透過 `groupPolicy` + `groups`）且傳送者也獲准，OpenClaw 在群組情境下預設仍會**要求提及才能觸發**。當訊息包含目前連線機器人的暱稱，或符合你設定的提及模式時，就會視為已提及機器人。

這表示除非訊息包含符合機器人的提及模式，否則你可能會看到 `drop channel … (missing-mention)` 之類的記錄。

若要讓機器人在 IRC 頻道中**不需要提及即可回覆**，請停用該頻道的提及觸發限制：

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

或者，若要允許**所有** IRC 頻道（不使用各頻道允許清單），並且仍可在無提及時回覆：

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

## 安全性注意事項（公共頻道建議設定）

若你在公共頻道中允許 `allowFrom: ["*"]`，任何人都能向機器人下達提示。
若要降低風險，請限制該頻道可用的工具。

### 頻道內所有人使用相同工具

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

### 各傳送者使用不同工具（擁有者有較高權限）

使用 `toolsBySender`，對 `"*"` 套用較嚴格的政策，並對你的暱稱套用較寬鬆的政策：

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

- `toolsBySender` 的鍵應使用明確前綴（`channel:`、`id:`、`e164:`、`username:`、`name:`）。對於 IRC，請將 `id:` 與傳送者身分值搭配使用：`id:alice`，或使用 `id:alice!~alice@203.0.113.7` 進行更嚴格的比對。
- 仍接受沒有前綴的舊式鍵，但只會視為 `id:` 進行比對，並發出棄用警告。
- 第一個符合的傳送者政策優先；`"*"` 是萬用字元的後備設定。

如需進一步瞭解群組存取與提及觸發限制的差異（以及兩者如何互動），請參閱：[/channels/groups](/zh-TW/channels/groups)。

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

只要設定了密碼，預設就會執行 NickServ 身分識別（只有要停用時，才需要將 `enabled` 設為 `false`）。`service` 預設為 `NickServ`；可使用 `passwordFile` 取代行內 `password`。

連線時進行選用的一次性註冊（`register: true` 需要 `registerEmail`）：

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

暱稱註冊完成後，請停用 `register`，以免重複嘗試 REGISTER。

## 環境變數

預設帳號支援：

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（以逗號分隔）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

無法從工作區 `.env` 設定 `IRC_HOST`；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。

## 疑難排解

- 若機器人已連線，但從不在頻道中回覆，請確認 `channels.irc.groups`，**並**檢查訊息是否因提及觸發限制而遭捨棄（`missing-mention`）。若希望機器人不必被點名也能回覆，請將該頻道的 `requireMention` 設為 `false`。
- 若登入失敗，請確認暱稱是否可用及伺服器密碼是否正確。
- 若自訂網路上的 TLS 連線失敗，請確認主機、連接埠及憑證設定。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私人訊息驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及觸發限制
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
