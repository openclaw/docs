---
read_when:
    - 變更頻道路由或收件匣行為
summary: 各通道（WhatsApp、Telegram、Discord、Slack）的路由規則與共用上下文
title: 頻道路由
x-i18n:
    generated_at: "2026-07-05T11:01:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ffd204de57a3ff991953a7907d86b1a93f8af14a71ee410e9dcc36336f49d3f
    source_path: channels/channel-routing.md
    workflow: 16
---

# 頻道與路由

OpenClaw 會將回覆路由**送回訊息來源的頻道**。模型不會選擇頻道；路由是確定性的，並由主機設定控制。

## 關鍵術語

- **頻道**：內建頻道外掛，例如 `discord`、`googlechat`、`imessage`、`irc`、`line`、`signal`、`slack`、`telegram` 或 `whatsapp`，以及已安裝的外掛頻道。`webchat` 是內部 WebChat UI 頻道，不是可設定的外送頻道。
- **AccountId**：每個頻道的帳號執行個體（支援時）。
- 選用的頻道預設帳號：`channels.<channel>.defaultAccount` 會選擇在外送路徑未指定 `accountId` 時要使用哪個帳號。
  - 在多帳號設定中，若已設定兩個以上帳號，請設定明確的預設值（`defaultAccount` 或名為 `default` 的帳號）。若未設定，後備路由可能會選擇第一個正規化帳號 ID。
- **AgentId**：隔離的工作區 + 工作階段儲存區（「大腦」）。
- **SessionKey**：用來儲存脈絡並控制並行性的儲存桶鍵。

## 外送目標前綴

明確的外送目標可包含提供者前綴，例如 `telegram:123` 或 `tg:123`。只有在所選頻道為 `last` 或尚未解析，且已載入外掛宣告該前綴時，核心才會把該前綴視為頻道選擇提示。如果呼叫端已選擇明確頻道，提供者前綴必須符合該頻道；像是將 WhatsApp 傳送到 `telegram:123` 這類跨頻道組合，會在外掛專屬目標正規化之前失敗。

目標類型與服務前綴，例如 `channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>` 和 `sms:<number>`，會留在所選頻道的語法內。它們本身不會選擇提供者。

## 工作階段鍵形狀（範例）

直接訊息預設會收斂到代理的 **main** 工作階段：

- `agent:<agentId>:<mainKey>`（預設：`agent:main:main`）

`session.dmScope` 控制 DM 收斂：`main`（預設）會共用一個主要工作階段，而 `per-peer`、`per-channel-peer` 和 `per-account-channel-peer` 會將 DM 保持在不同工作階段中。路由繫結可以透過 `bindings[].session.dmScope` 覆寫符合對等方的範圍。

即使直接訊息對話歷史與 main 共用，沙盒與工具政策也會為外部 DM 使用衍生的每帳號直接聊天執行階段鍵，因此頻道來源訊息不會被視為本機 main 工作階段執行。

群組和頻道會維持每個頻道各自隔離：

- 群組：`agent:<agentId>:<channel>:group:<id>`
- 頻道/聊天室：`agent:<agentId>:<channel>:channel:<id>`

討論串：

- Slack/Discord 討論串會在基底鍵後附加 `:thread:<threadId>`。
- Telegram 論壇主題會在群組鍵中嵌入 `:topic:<topicId>`。

範例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 主要 DM 路由釘選

當 `session.dmScope` 為 `main` 時，直接訊息可能會共用一個主要工作階段。為避免工作階段的 `lastRoute` 被非擁有者 DM 覆寫，OpenClaw 會在以下條件全都成立時，從 `allowFrom` 推斷釘選擁有者：

- `allowFrom` 正好有一個非萬用字元項目。
- 該項目可以正規化為該頻道的具體傳送者 ID。
- 傳入 DM 的傳送者不符合該釘選擁有者。

在這種不相符情況下，OpenClaw 仍會記錄傳入工作階段中繼資料，但會略過更新主要工作階段 `lastRoute`。

## 受保護的傳入記錄

當受保護路徑不得建立新的 OpenClaw 工作階段時，頻道外掛可以將傳入工作階段記錄標示為 `createIfMissing: false`。在此模式下，OpenClaw 可以更新既有工作階段的中繼資料和 `lastRoute`，但不會只因觀察到訊息就建立僅供路由使用的工作階段項目。

## 路由規則（如何選擇代理）

路由會為每則傳入訊息選擇**一個代理**：

1. **精確對等方符合**（`bindings` 搭配 `peer.kind` + `peer.id`）。
2. **父對等方符合**（討論串繼承）。
3. **對等方萬用字元符合**（某個對等方類型的 `peer.id: "*"`）。
4. **Guild + 角色符合**（Discord）透過 `guildId` + `roles`。
5. **Guild 符合**（Discord）透過 `guildId`。
6. **團隊符合**（Slack）透過 `teamId`。
7. **帳號符合**（頻道上的 `accountId`）。
8. **頻道符合**（該頻道上的任意帳號，`accountId: "*"`）。
9. **預設代理**（`agents.list[].default`，否則第一個清單項目，後備為 `main`）。

當繫結包含多個符合欄位（`peer`、`guildId`、`teamId`、`roles`）時，**所有提供的欄位都必須符合**，該繫結才會套用。

符合的代理會決定使用哪個工作區和工作階段儲存區。

## 廣播群組（執行多個代理）

廣播群組可讓你針對同一個對等方**執行多個代理**，條件是 **OpenClaw 通常會回覆時**（例如：在 WhatsApp 群組中，通過提及/啟用閘門之後）。

設定：

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

請參閱：[廣播群組](/zh-TW/channels/broadcast-groups)。

## 設定概覽

- `agents.list`：具名代理定義（工作區、模型等）。
- `bindings`：將傳入頻道/帳號/對等方對應到代理。

範例：

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## 工作階段儲存

工作階段儲存區位於狀態目錄下（預設 `~/.openclaw`）：

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 謄本會與儲存區放在一起

你可以透過 `session.store` 和 `{agentId}` 範本覆寫儲存區路徑。

閘道和 ACP 工作階段探索也會掃描預設 `agents/` 根目錄下，以及範本化 `session.store` 根目錄下的磁碟支援代理儲存區。探索到的儲存區必須留在已解析的代理根目錄內，並使用一般的 `sessions.json` 檔案。符號連結和根目錄外路徑會被忽略。

## WebChat 行為

WebChat 會附加到**所選代理**，並預設使用該代理的主要工作階段。因此，WebChat 可讓你在同一個地方查看該代理的跨頻道脈絡。

## 回覆脈絡

傳入回覆會在可用時包含：

- `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用脈絡會以 `[Replying to ...]` 區塊附加到 `Body`。

這在各頻道之間保持一致。

## 相關

- [群組](/zh-TW/channels/groups)
- [廣播群組](/zh-TW/channels/broadcast-groups)
- [配對](/zh-TW/channels/pairing)
