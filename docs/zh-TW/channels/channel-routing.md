---
read_when:
    - 變更頻道路由或收件匣行為
summary: 各通道（WhatsApp、Telegram、Discord、Slack）的路由規則與共享上下文
title: 頻道路由
x-i18n:
    generated_at: "2026-05-06T09:02:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
---

# 頻道與路由

OpenClaw 會將回覆路由**送回訊息來源的頻道**。模型不會選擇頻道；路由是決定性的，並由主機設定控制。

## 關鍵術語

- **頻道**：`telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`，以及 Plugin 頻道。`webchat` 是內部 WebChat UI 頻道，不是可設定的外送頻道。
- **AccountId**：每個頻道的帳號實例（支援時）。
- 選用的頻道預設帳號：`channels.<channel>.defaultAccount` 會選擇
  當外送路徑未指定 `accountId` 時要使用的帳號。
  - 在多帳號設定中，當設定了兩個或更多帳號時，請設定明確的預設值（`defaultAccount` 或 `accounts.default`）。若未設定，備援路由可能會選取第一個正規化後的帳號 ID。
- **AgentId**：隔離的工作區 + 工作階段儲存區（「大腦」）。
- **SessionKey**：用來儲存內容脈絡並控制並行性的桶鍵。

## 外送目標前綴

明確的外送目標可以包含提供者前綴，例如 `telegram:123` 或 `tg:123`。Core 只有在所選頻道是 `last` 或尚未解析，且已載入的 Plugin 宣告該前綴時，才會將該前綴視為頻道選擇提示。如果呼叫端已經選擇明確頻道，提供者前綴就必須符合該頻道；像是把 WhatsApp 傳送到 `telegram:123` 這類跨頻道組合，會在 Plugin 專屬目標正規化之前失敗。

目標種類與服務前綴，例如 `channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>` 和 `sms:<number>`，會留在所選頻道的語法中。它們本身不會選擇提供者。

## 工作階段鍵形狀（範例）

預設情況下，直接訊息會收斂到代理的 **main** 工作階段：

- `agent:<agentId>:<mainKey>`（預設：`agent:main:main`）

即使直接訊息的對話記錄與 main 共用，沙箱與
工具政策仍會為外部 DM 使用衍生的每帳號直接聊天執行階段鍵，
因此頻道來源訊息不會被視為 local main-session 執行。

群組與頻道會依頻道保持隔離：

- 群組：`agent:<agentId>:<channel>:group:<id>`
- 頻道/聊天室：`agent:<agentId>:<channel>:channel:<id>`

討論串：

- Slack/Discord 討論串會在基礎鍵後附加 `:thread:<threadId>`。
- Telegram 論壇主題會在群組鍵中嵌入 `:topic:<topicId>`。

範例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Main DM 路由釘選

當 `session.dmScope` 是 `main` 時，直接訊息可以共用同一個 main 工作階段。
為了防止工作階段的 `lastRoute` 被非擁有者 DM 覆寫，
當下列條件全部為真時，OpenClaw 會從 `allowFrom` 推斷釘選擁有者：

- `allowFrom` 正好有一個非萬用字元項目。
- 該項目可正規化為該頻道的具體傳送者 ID。
- 傳入 DM 的傳送者不符合該釘選擁有者。

在這種不符合的情況下，OpenClaw 仍會記錄傳入工作階段中繼資料，但會
略過更新 main 工作階段的 `lastRoute`。

## 受保護的傳入記錄

當受保護路徑不得建立新的 OpenClaw 工作階段時，頻道 Plugin 可以將傳入工作階段記錄標記為 `createIfMissing: false`。在該模式中，
OpenClaw 可以更新既有工作階段的中繼資料與 `lastRoute`，但不會
只因為觀察到一則訊息就建立僅供路由使用的工作階段項目。

## 路由規則（如何選擇代理）

路由會為每則傳入訊息選擇**一個代理**：

1. **精確對等項目符合**（含 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父對等項目符合**（討論串繼承）。
3. **伺服器 + 角色符合**（Discord），透過 `guildId` + `roles`。
4. **伺服器符合**（Discord），透過 `guildId`。
5. **團隊符合**（Slack），透過 `teamId`。
6. **帳號符合**（頻道上的 `accountId`）。
7. **頻道符合**（該頻道上的任何帳號，`accountId: "*"`）。
8. **預設代理**（`agents.list[].default`，否則第一個清單項目，備援為 `main`）。

當繫結包含多個比對欄位（`peer`、`guildId`、`teamId`、`roles`）時，該繫結必須**所有提供的欄位都符合**才會套用。

符合的代理會決定使用哪個工作區和工作階段儲存區。

## 廣播群組（執行多個代理）

廣播群組讓你可以針對同一個對等項目**執行多個代理**，前提是 **OpenClaw 通常會回覆**（例如：在 WhatsApp 群組中，通過提及/啟用閘門之後）。

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

## 設定概觀

- `agents.list`：具名代理定義（工作區、模型等）。
- `bindings`：將傳入頻道/帳號/對等項目對應到代理。

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
- JSONL 轉錄會與儲存區放在一起

你可以透過 `session.store` 和 `{agentId}` 樣板覆寫儲存區路徑。

Gateway 和 ACP 工作階段探索也會掃描預設 `agents/` 根目錄下，以及樣板化 `session.store` 根目錄下，以磁碟為後端的代理儲存區。探索到的儲存區必須保留在該已解析代理根目錄內，並使用一般的 `sessions.json` 檔案。符號連結和超出根目錄的路徑會被忽略。

## WebChat 行為

WebChat 會附加到**所選代理**，並預設使用該代理的 main
工作階段。因此，WebChat 可讓你在同一處查看該代理的跨頻道內容脈絡。

## 回覆內容脈絡

傳入回覆會包含：

- 可用時的 `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用內容脈絡會以 `[Replying to ...]` 區塊附加到 `Body`。

這在各個頻道之間保持一致。

## 相關

- [群組](/zh-TW/channels/groups)
- [廣播群組](/zh-TW/channels/broadcast-groups)
- [配對](/zh-TW/channels/pairing)
