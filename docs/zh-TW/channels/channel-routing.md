---
read_when:
    - 變更頻道路由或收件匣行為
summary: 每個通道（WhatsApp、Telegram、Discord、Slack）的路由規則和共用上下文
title: 通道路由
x-i18n:
    generated_at: "2026-04-30T02:46:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# 頻道與路由

OpenClaw 會將回覆路由**回訊息來源的頻道**。模型不會選擇頻道；路由是確定性的，並由主機設定控制。

## 關鍵術語

- **頻道**：`telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`，以及 Plugin 頻道。`webchat` 是內部 WebChat UI 頻道，不是可設定的對外頻道。
- **AccountId**：每個頻道的帳號實例（支援時）。
- 選用的頻道預設帳號：`channels.<channel>.defaultAccount` 會選擇
  當對外路徑未指定 `accountId` 時使用哪個帳號。
  - 在多帳號設定中，當設定了兩個以上帳號時，請設定明確的預設值（`defaultAccount` 或 `accounts.default`）。若未設定，後援路由可能會選擇第一個正規化的帳號 ID。
- **AgentId**：隔離的工作區 + 工作階段儲存區（「大腦」）。
- **SessionKey**：用於儲存脈絡並控制並行性的桶鍵。

## 工作階段鍵形狀（範例）

直接訊息預設會折疊到代理的 **main** 工作階段：

- `agent:<agentId>:<mainKey>`（預設：`agent:main:main`）

即使直接訊息對話歷史與 main 共用，沙盒與工具政策仍會針對外部 DM 使用衍生的每帳號直接聊天執行階段鍵，
因此來自頻道的訊息不會被視為本機 main 工作階段執行。

群組與頻道會依頻道維持隔離：

- 群組：`agent:<agentId>:<channel>:group:<id>`
- 頻道/聊天室：`agent:<agentId>:<channel>:channel:<id>`

執行緒：

- Slack/Discord 執行緒會將 `:thread:<threadId>` 附加到基礎鍵。
- Telegram 論壇主題會在群組鍵中嵌入 `:topic:<topicId>`。

範例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Main DM 路由釘選

當 `session.dmScope` 為 `main` 時，直接訊息可能會共用一個 main 工作階段。
為了防止工作階段的 `lastRoute` 被非擁有者 DM 覆寫，
當下列條件全部成立時，OpenClaw 會從 `allowFrom` 推斷釘選擁有者：

- `allowFrom` 恰好有一個非萬用字元項目。
- 該項目可正規化為該頻道的具體寄件者 ID。
- 傳入的 DM 寄件者不符合該釘選擁有者。

在這種不相符的情況下，OpenClaw 仍會記錄傳入工作階段中繼資料，但會
略過更新 main 工作階段的 `lastRoute`。

## 受保護的傳入記錄

當受保護路徑不得建立新的 OpenClaw 工作階段時，頻道 Plugin 可將傳入工作階段記錄標示為 `createIfMissing: false`。
在此模式下，OpenClaw 可能會更新既有工作階段的中繼資料與 `lastRoute`，但不會
只因為觀察到訊息就建立僅含路由的工作階段項目。

## 路由規則（如何選擇代理）

路由會為每則傳入訊息選擇**一個代理**：

1. **精確對等方符合**（含 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父對等方符合**（執行緒繼承）。
3. **Guild + 角色符合**（Discord），透過 `guildId` + `roles`。
4. **Guild 符合**（Discord），透過 `guildId`。
5. **團隊符合**（Slack），透過 `teamId`。
6. **帳號符合**（頻道上的 `accountId`）。
7. **頻道符合**（該頻道上的任何帳號，`accountId: "*"`）。
8. **預設代理**（`agents.list[].default`，否則第一個清單項目，後援為 `main`）。

當綁定包含多個符合欄位（`peer`、`guildId`、`teamId`、`roles`）時，**所有提供的欄位都必須符合**，該綁定才會套用。

符合的代理會決定要使用哪個工作區與工作階段儲存區。

## 廣播群組（執行多個代理）

廣播群組可讓你針對同一個對等方**執行多個代理**，條件是 **OpenClaw 通常會回覆**（例如：在 WhatsApp 群組中，通過提及/啟用閘門之後）。

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

工作階段儲存區位於狀態目錄下（預設為 `~/.openclaw`）：

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 逐字稿會與儲存區並列存放

你可以透過 `session.store` 與 `{agentId}` 模板化覆寫儲存區路徑。

Gateway 與 ACP 工作階段探索也會掃描預設 `agents/` 根目錄下，以及模板化 `session.store` 根目錄下的磁碟支援代理儲存區。探索到的
儲存區必須維持在該解析後的代理根目錄內，並使用一般的
`sessions.json` 檔案。符號連結與根目錄外路徑會被忽略。

## WebChat 行為

WebChat 會附加到**選取的代理**，並預設使用該代理的 main
工作階段。因此，WebChat 可讓你在同一處查看該代理的跨頻道脈絡。

## 回覆脈絡

傳入回覆會包含：

- 可用時包含 `ReplyToId`、`ReplyToBody` 與 `ReplyToSender`。
- 引用脈絡會作為 `[Replying to ...]` 區塊附加到 `Body`。

這在各頻道之間保持一致。

## 相關

- [群組](/zh-TW/channels/groups)
- [廣播群組](/zh-TW/channels/broadcast-groups)
- [配對](/zh-TW/channels/pairing)
