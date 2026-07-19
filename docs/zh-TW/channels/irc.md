---
read_when:
    - 你想要將 OpenClaw 連接至 IRC 頻道或私訊
    - 你正在設定 IRC 允許清單、群組政策或提及閘控
summary: IRC 外掛設定、存取控制與疑難排解
title: IRC
x-i18n:
    generated_at: "2026-07-19T13:34:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85c3da80b45d6611872ddbd10b3be4a5742b46e355e8bb554353a478f2a1702f
    source_path: channels/irc.md
    workflow: 16
---

當你想要在傳統頻道（`#room`）和私人訊息中使用 OpenClaw 時，請使用 IRC。
安裝官方 IRC 外掛，然後在 `channels.irc` 下進行設定。

## 快速開始

1. 安裝外掛：

```bash
openclaw plugins install @openclaw/irc
```

2. 至少在 `~/.openclaw/openclaw.json` 中設定主機、暱稱和要加入的頻道：

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

建議使用私人 IRC 伺服器進行機器人協調。如果你刻意使用公用 IRC 網路，常見選擇包括 Libera.Chat、OFTC 和 Snoonet。請避免使用容易預測的公用頻道傳送機器人或叢集的後台通訊流量。

## 傳入訊息的持久性

OpenClaw 會在進行一般原則檢查和代理程式分派之前，將每個已接受的 IRC `PRIVMSG` 寫入其持久化傳入佇列。待處理或可重試的訊息可在閘道重新啟動後保留，並且每個頻道或私人訊息對象的訊息仍會依序處理。

IRC 不提供可重播的傳遞 ID，也不會重新傳送用戶端中斷連線期間遺漏的訊息。因此，OpenClaw 會指派僅在目前 TCP 連線內保持穩定的本機 ID。此佇列可保護從本機接受到分派之間的時間區段；它無法復原從未送達 OpenClaw 的訊息，也無法跨連線對伺服器重新傳送的訊息進行去重。

## 連線設定

| 鍵                            | 預設值                        | 備註                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | 無（必填）                    | IRC 伺服器主機名稱                                          |
| `port`                        | 使用 TLS 時為 `6697`，明文時為 `6667` | 1-65535                                                     |
| `tls`                         | `true`                        | 僅在刻意使用明文連線時設定 `false`               |
| `nick`                        | 無（必填）                    | 機器人暱稱                                                  |
| `username`                    | 暱稱，否則為 `openclaw`         | IRC 使用者名稱                                              |
| `realname`                    | `OpenClaw`                    | 真實名稱／GECOS 欄位                                        |
| `password` / `passwordFile`   | 無                            | 伺服器密碼；檔案必須是一般檔案                              |
| `channels`                    | 無                            | 要加入的頻道（`["#openclaw"]`）                          |
| `accounts` / `defaultAccount` | 無                            | 多帳號設定；環境變數只會填入預設帳號                        |

## 安全性預設值

- IRC 使用 OpenClaw 操作者管理的正向 Proxy 路由之外的原始 TCP/TLS 通訊端。若部署環境要求所有對外流量都必須經由該正向 Proxy，除非已明確核准 IRC 直接對外連線，否則請設定 `channels.irc.enabled=false`。
- `channels.irc.dmPolicy` 預設為 `"pairing"`：未知的私人訊息傳送者會收到配對碼，你可使用 `openclaw pairing approve irc <code>` 核准。
- `channels.irc.groupPolicy` 預設為 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 時，請設定 `channels.irc.groups` 以定義允許的頻道。
- 除非你刻意接受明文傳輸，否則請使用 TLS（`channels.irc.tls=true`）。

## 存取控制

IRC 頻道有兩個獨立的「關卡」：

1. **頻道存取權**（`groupPolicy` + `groups`）：機器人是否接受來自該頻道的任何訊息。
2. **傳送者存取權**（`groupAllowFrom`／各頻道的 `groups["#channel"].allowFrom`）：允許哪些人在該頻道中觸發機器人。

設定鍵：

- 私人訊息允許清單（私人訊息傳送者存取權）：`channels.irc.allowFrom`
- 群組傳送者允許清單（頻道傳送者存取權）：`channels.irc.groupAllowFrom`
- 各頻道控制項（頻道、傳送者與提及規則）：`channels.irc.groups["#channel"]`，以及 `requireMention`、`allowFrom`、`enabled`、`tools`、`toolsBySender`、`skills` 和 `systemPrompt`
- `channels.irc.groupPolicy="open"` 允許未設定的頻道（**預設仍受提及關卡限制**）

允許清單項目應使用穩定的傳送者身分（`nick!user@host`）。
直接比對暱稱的結果可能變動，且僅在 `channels.irc.dangerouslyAllowNameMatching: true` 時啟用。

### 常見陷阱：`allowFrom` 適用於私人訊息，而非頻道

如果你看到如下記錄：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……這表示該傳送者沒有傳送**群組／頻道**訊息的權限。可透過以下任一方式修正：

- 設定 `channels.irc.groupAllowFrom`（全域套用至所有頻道），或
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

## 回覆觸發條件（提及）

即使已允許某個頻道（透過 `groupPolicy` + `groups`）且已允許傳送者，OpenClaw 在群組情境中預設仍會啟用**提及關卡**。當訊息包含目前連線的機器人暱稱，或符合你設定的提及模式時，即視為已提及機器人。

這表示除非訊息包含符合機器人的提及模式，否則你可能會看到類似 `drop channel … (missing-mention)` 的記錄。

若要讓機器人在 IRC 頻道中**無須提及即可回覆**，請停用該頻道的提及關卡：

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

或者，若要允許**所有** IRC 頻道（不使用各頻道允許清單）且仍能在未提及時回覆：

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

## 安全性注意事項（建議用於公用頻道）

如果你在公用頻道中允許 `allowFrom: ["*"]`，任何人都能向機器人下達提示。
若要降低風險，請限制該頻道可使用的工具。

### 頻道中的所有人使用相同工具

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

### 每個傳送者使用不同工具（擁有者獲得更多權限）

使用 `toolsBySender`，對 `"*"` 套用較嚴格的原則，並對你的暱稱套用較寬鬆的原則：

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

- `toolsBySender` 鍵應使用明確的前綴（`channel:`、`id:`、`e164:`、`username:`、`name:`）。對 IRC 而言，請使用 `id:` 搭配傳送者身分值：`id:alice`，或使用 `id:alice!~alice@203.0.113.7` 進行更嚴格的比對。
- 仍接受舊版無前綴鍵，但只會將其視為 `id:` 進行比對，並發出淘汰警告。
- 第一個符合的傳送者原則會生效；`"*"` 是萬用字元備援。

如需進一步瞭解群組存取權與提及關卡（以及兩者如何互動），請參閱：[/channels/groups](/zh-TW/channels/groups)。

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

只要設定密碼，NickServ 識別程序預設就會執行（僅需將 `enabled` 設為 `false` 即可停用）。`service` 預設為 `NickServ`；`passwordFile` 可替代行內的 `password`。

連線時選擇性執行一次註冊（`register: true` 需要 `registerEmail`）：

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
- `IRC_CHANNELS`（以逗號分隔）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

無法從工作區 `.env` 設定 `IRC_HOST`；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。

## 疑難排解

- 如果機器人已連線但從未在頻道中回覆，請確認 `channels.irc.groups`，**並且**確認提及關卡是否正在捨棄訊息（`missing-mention`）。如果你希望機器人無須被提及即可回覆，請為該頻道設定 `requireMention:false`。
- 如果登入失敗，請確認暱稱是否可用以及伺服器密碼是否正確。
- 如果自訂網路上的 TLS 失敗，請確認主機／連接埠與憑證設定。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私人訊息驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及關卡
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
