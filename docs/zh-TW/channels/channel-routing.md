---
read_when:
    - 變更通道路由或收件匣行為
summary: 依通道的路由規則（WhatsApp、Telegram、Discord、Slack）與共用上下文
title: 頻道路由
x-i18n:
    generated_at: "2026-05-02T20:41:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# 通道與路由

OpenClaw 會將回覆路由**回訊息來源的通道**。模型不會選擇通道；路由是確定性的，並由主機設定控制。

## 重要術語

- **通道**：`telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`，以及 Plugin 通道。`webchat` 是內部 WebChat UI 通道，並不是可設定的對外通道。
- **AccountId**：每個通道的帳號執行個體（支援時）。
- 選用的通道預設帳號：`channels.<channel>.defaultAccount` 會選擇
  當對外路徑未指定 `accountId` 時使用哪個帳號。
  - 在多帳號設定中，當設定了兩個或更多帳號時，請設定明確的預設值（`defaultAccount` 或 `accounts.default`）。若未設定，備援路由可能會選取第一個正規化帳號 ID。
- **AgentId**：隔離的工作區 + 工作階段儲存區（「大腦」）。
- **SessionKey**：用於儲存內容脈絡和控制並行的儲存桶鍵。

## 對外目標前綴

明確的對外目標可以包含提供者前綴，例如 `telegram:123` 或 `tg:123`。只有在所選通道為 `last` 或尚未解析，且已載入的 Plugin 宣告該前綴時，核心才會將該前綴視為通道選擇提示。如果呼叫端已選擇明確通道，提供者前綴必須符合該通道；例如將 WhatsApp 傳送到 `telegram:123` 這類跨通道組合，會在 Plugin 專屬目標正規化之前失敗。

目標種類和服務前綴，例如 `channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>` 和 `sms:<number>`，會留在所選通道的語法內。它們本身不會選擇提供者。

## 工作階段鍵形狀（範例）

預設情況下，直接訊息會收斂到代理的 **main** 工作階段：

- `agent:<agentId>:<mainKey>`（預設：`agent:main:main`）

即使直接訊息的對話記錄與 main 共用，沙盒和
工具政策仍會針對外部 DM 使用衍生的每帳號直接聊天執行期鍵，
因此通道來源的訊息不會被視為本機 main 工作階段執行。

群組和通道會依通道保持隔離：

- 群組：`agent:<agentId>:<channel>:group:<id>`
- 通道/聊天室：`agent:<agentId>:<channel>:channel:<id>`

討論串：

- Slack/Discord 討論串會在基礎鍵後附加 `:thread:<threadId>`。
- Telegram 論壇主題會在群組鍵中嵌入 `:topic:<topicId>`。

範例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Main DM 路由固定

當 `session.dmScope` 為 `main` 時，直接訊息可以共用同一個 main 工作階段。
為了避免工作階段的 `lastRoute` 被非擁有者 DM 覆寫，
OpenClaw 會在下列條件全部成立時，從 `allowFrom` 推斷固定擁有者：

- `allowFrom` 只有一個非萬用字元項目。
- 該項目可正規化為該通道的具體傳送者 ID。
- 傳入的 DM 傳送者不符合該固定擁有者。

在這種不符合的情況下，OpenClaw 仍會記錄傳入工作階段中繼資料，但會
略過更新 main 工作階段的 `lastRoute`。

## 受保護的傳入記錄

當受保護路徑不得建立新的 OpenClaw 工作階段時，通道 Plugin 可以將傳入工作階段記錄標示為 `createIfMissing: false`。在此模式下，
OpenClaw 可以更新既有工作階段的中繼資料和 `lastRoute`，但不會
只因為觀察到訊息，就建立僅供路由使用的工作階段項目。

## 路由規則（如何選擇代理）

路由會為每則傳入訊息挑選**一個代理**：

1. **精確對等端符合**（具有 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父層對等端符合**（討論串繼承）。
3. **伺服器 + 角色符合**（Discord）透過 `guildId` + `roles`。
4. **伺服器符合**（Discord）透過 `guildId`。
5. **團隊符合**（Slack）透過 `teamId`。
6. **帳號符合**（通道上的 `accountId`）。
7. **通道符合**（該通道上的任何帳號，`accountId: "*"`）。
8. **預設代理**（`agents.list[].default`，否則為清單第一個項目，備援為 `main`）。

當繫結包含多個符合欄位（`peer`、`guildId`、`teamId`、`roles`）時，該繫結要套用，**所有提供的欄位都必須符合**。

符合的代理會決定要使用哪個工作區和工作階段儲存區。

## 廣播群組（執行多個代理）

廣播群組讓你在 **OpenClaw 通常會回覆時**，為同一個對等端執行**多個代理**（例如：在 WhatsApp 群組中，通過提及/啟用閘門之後）。

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
- `bindings`：將傳入通道/帳號/對等端對應到代理。

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
- JSONL 逐字稿會與儲存區放在同一位置

你可以透過 `session.store` 和 `{agentId}` 範本覆寫儲存區路徑。

Gateway 和 ACP 工作階段探索也會掃描
預設 `agents/` 根目錄，以及範本化 `session.store` 根目錄下由磁碟支援的代理儲存區。探索到的
儲存區必須留在解析後的代理根目錄內，並使用一般的
`sessions.json` 檔案。符號連結和根目錄外路徑會被忽略。

## WebChat 行為

WebChat 會附加到**選取的代理**，並預設使用代理的 main
工作階段。因此，WebChat 讓你可以在同一處查看該代理的跨通道內容脈絡。

## 回覆內容脈絡

傳入回覆會在可用時包含：

- `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用內容脈絡會以 `[Replying to ...]` 區塊附加到 `Body`。

這在各通道之間保持一致。

## 相關

- [群組](/zh-TW/channels/groups)
- [廣播群組](/zh-TW/channels/broadcast-groups)
- [配對](/zh-TW/channels/pairing)
