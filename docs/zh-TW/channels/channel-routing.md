---
read_when:
    - 變更頻道路由或收件匣行為
summary: 各頻道（WhatsApp、Telegram、Discord、Slack）的路由規則與共用內容脈絡
title: 頻道路由
x-i18n:
    generated_at: "2026-07-12T14:17:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# 頻道與路由

OpenClaw 會將回覆**傳回訊息來源的頻道**。模型不會選擇頻道；路由是確定性的，並由主機設定控制。

## 關鍵術語

- **頻道**：隨附的頻道外掛，例如 `discord`、`googlechat`、`imessage`、`irc`、`line`、`signal`、`slack`、`telegram` 或 `whatsapp`，以及已安裝外掛提供的頻道。`webchat` 是內部 WebChat UI 頻道，不能設定為對外傳送頻道。
- **AccountId**：各頻道的帳號執行個體（若支援）。
- 選用的頻道預設帳號：`channels.<channel>.defaultAccount` 選擇對外傳送路徑未指定 `accountId` 時所使用的帳號。
  - 在多帳號設定中，如果設定了兩個以上的帳號，請明確設定預設帳號（`defaultAccount` 或名為 `default` 的帳號）。若未設定，備援路由可能會選擇第一個正規化後的帳號 ID。
- **AgentId**：隔離的工作區與工作階段儲存區（「大腦」）。
- **SessionKey**：用於儲存上下文及控制並行處理的分組鍵。

## 對外傳送目標前綴

明確的對外傳送目標可包含供應商前綴，例如 `telegram:123` 或 `tg:123`。只有在選定頻道為 `last` 或仍未解析，且載入的外掛宣告支援該前綴時，核心才會將此前綴視為頻道選擇提示。如果呼叫端已明確選定頻道，供應商前綴必須與該頻道相符；像是透過 WhatsApp 傳送至 `telegram:123` 這類跨頻道組合，會在外掛專屬的目標正規化之前失敗。

`channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>` 和 `sms:<number>` 等目標類型及服務前綴，仍屬於選定頻道的語法。它們本身不會選擇供應商。

## 工作階段鍵格式（範例）

私訊預設會合併至代理程式的**主要**工作階段：

- `agent:<agentId>:<mainKey>`（預設：`agent:main:main`）

`session.dmScope` 控制私訊合併方式：`main`（預設）共用一個主要工作階段，而 `per-peer`、`per-channel-peer` 和 `per-account-channel-peer` 則將私訊保留在不同的工作階段中。路由繫結可以透過 `bindings[].session.dmScope` 覆寫其相符對象的範圍。

即使私訊對話記錄與主要工作階段共用，對於外部私訊，沙箱與工具原則仍會使用依帳號衍生的私聊執行階段鍵，避免將源自頻道的訊息視為本機主要工作階段的執行。

群組與頻道仍依頻道個別隔離：

- 群組：`agent:<agentId>:<channel>:group:<id>`
- 頻道／聊天室：`agent:<agentId>:<channel>:channel:<id>`

討論串：

- Slack／Discord 討論串會在基礎鍵後附加 `:thread:<threadId>`。
- Telegram 論壇主題會在群組鍵中嵌入 `:topic:<topicId>`。

範例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 主要私訊路由固定

當 `session.dmScope` 為 `main` 時，私訊可能會共用一個主要工作階段。為避免工作階段的 `lastRoute` 被非擁有者的私訊覆寫，當下列條件全部成立時，OpenClaw 會從 `allowFrom` 推斷固定的擁有者：

- `allowFrom` 恰好有一個非萬用字元項目。
- 該項目可正規化為該頻道的具體傳送者 ID。
- 傳入私訊的傳送者與該固定擁有者不符。

發生不相符的情況時，OpenClaw 仍會記錄傳入的工作階段中繼資料，但會略過更新主要工作階段的 `lastRoute`。

## 受保護的傳入記錄

當受保護的路徑不得建立新的 OpenClaw 工作階段時，頻道外掛可將傳入工作階段記錄標示為 `createIfMissing: false`。在此模式下，OpenClaw 可以更新現有工作階段的中繼資料與 `lastRoute`，但不會僅因觀察到訊息，就建立只有路由資訊的工作階段項目。

## 路由規則（如何選擇代理程式）

路由會為每則傳入訊息選擇**一個代理程式**：

1. **完全對象比對**（具有 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父層對象比對**（討論串繼承）。
3. **對象萬用字元比對**（某種對象類型的 `peer.id: "*"`）。
4. **伺服器 + 角色比對**（Discord），透過 `guildId` + `roles`。
5. **伺服器比對**（Discord），透過 `guildId`。
6. **團隊比對**（Slack），透過 `teamId`。
7. **帳號比對**（頻道上的 `accountId`）。
8. **頻道比對**（該頻道上的任何帳號，`accountId: "*"`）。
9. **預設代理程式**（`agents.list[].default`；否則使用清單第一個項目；再否則備援至 `main`）。

當繫結包含多個比對欄位（`peer`、`guildId`、`teamId`、`roles`）時，**所有提供的欄位都必須相符**，該繫結才會套用。

相符的代理程式會決定要使用哪個工作區和工作階段儲存區。

## 廣播群組（執行多個代理程式）

廣播群組可讓你在 OpenClaw **通常會回覆時**（例如：WhatsApp 群組通過提及／啟用門檻後），為同一對象執行**多個代理程式**。

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

- `agents.list`：具名代理程式定義（工作區、模型等）。
- `bindings`：將傳入頻道／帳號／對象對應至代理程式。

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

執行階段的工作階段資料列位於狀態目錄下各代理程式的 SQLite 資料庫中（預設為 `~/.openclaw`）：

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

較舊的安裝版本可能在 `~/.openclaw/agents/<agentId>/sessions/` 下留有舊版對話記錄 JSONL 檔案及作為資料列儲存區的 `sessions.json`。閘道啟動及 `openclaw doctor --fix` 會自動將使用中的舊版資料列／記錄匯入 SQLite。需要明確的移轉證據時，請使用 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` 及 [Doctor](/zh-TW/cli/doctor#session-sqlite-migration) 驗證流程。
在移轉和離線維護工作流程中，你仍可透過 `session.store` 與 `{agentId}` 範本選擇舊版儲存區路徑。

閘道與 ACP 工作階段探索也會掃描預設 `agents/` 根目錄及範本化 `session.store` 根目錄下以磁碟為基礎的代理程式儲存區。探索到的儲存區必須位於解析後的代理程式根目錄內，並使用一般的舊版 `sessions.json` 檔案。符號連結與根目錄外的路徑會被忽略。

## WebChat 行為

WebChat 會連接至**選定的代理程式**，並預設使用該代理程式的主要工作階段。因此，你可以透過 WebChat 在單一位置查看該代理程式的跨頻道上下文。

## 回覆上下文

傳入回覆會包含：

- 可取得時包含 `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用的上下文會以 `[Replying to ...]` 區塊附加至 `Body`。

所有頻道的行為皆一致。

## 相關內容

- [群組](/zh-TW/channels/groups)
- [廣播群組](/zh-TW/channels/broadcast-groups)
- [配對](/zh-TW/channels/pairing)
