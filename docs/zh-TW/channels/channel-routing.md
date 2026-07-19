---
read_when:
    - 變更頻道路由或收件匣行為
summary: 各頻道（WhatsApp、Telegram、Discord、Slack）的路由規則與共用上下文
title: 頻道路由
x-i18n:
    generated_at: "2026-07-19T13:34:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 23912c0efb5794d4b45e84192fcf8e61e4dab491eee332101088ad9d6cd89c14
    source_path: channels/channel-routing.md
    workflow: 16
---

# 頻道與路由

OpenClaw 會將回覆**傳回訊息來源的頻道**。模型不會選擇頻道；路由是確定性的，並由主機設定控制。在預設的私訊範圍下，來自每個頻道的直接訊息都會匯入代理程式的[主要工作階段](/zh-TW/concepts/main-session)。

## 關鍵術語

- **頻道**：隨附的頻道外掛，例如 `discord`、`googlechat`、`imessage`、`irc`、`line`、`signal`、`slack`、`telegram` 或 `whatsapp`，以及已安裝的外掛頻道。`webchat` 是內部 WebChat 使用者介面頻道，不能設定為輸出頻道。
- **AccountId**：各頻道的帳號執行個體（若支援）。
- 選用的頻道預設帳號：`channels.<channel>.defaultAccount` 會選擇
  當輸出路徑未指定 `accountId` 時要使用的帳號。
  - 在多帳號設定中，若設定了兩個以上的帳號，請設定明確的預設值（`defaultAccount` 或名為 `default` 的帳號）。若未設定，備援路由可能會選取第一個正規化的帳號 ID。
- **AgentId**：隔離的工作區 + 工作階段儲存區（「大腦」）。
- **SessionKey**：用於儲存上下文及控制並行處理的儲存區鍵值。

## 輸出目標前綴

明確的輸出目標可能包含提供者前綴，例如 `telegram:123` 或 `tg:123`。只有在選定頻道為 `last` 或尚未解析，且載入的外掛宣告支援該前綴時，核心才會將此前綴視為頻道選擇提示。若呼叫端已明確選定頻道，提供者前綴必須與該頻道相符；例如將 WhatsApp 傳送至 `telegram:123` 的跨頻道組合，會在外掛專屬的目標正規化之前失敗。

目標種類及服務前綴（例如 `channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>` 和 `sms:<number>`）會保留在選定頻道的語法中。它們本身不會選擇提供者。

## 工作階段鍵值格式（範例）

直接訊息預設會合併至代理程式的**主要**工作階段：

- `agent:<agentId>:<mainKey>`（預設：`agent:main:main`）

`session.dmScope` 控制私訊合併：`main`（預設）共用一個主要
工作階段，而 `per-peer`、`per-channel-peer` 和 `per-account-channel-peer`
則將私訊保留在不同的工作階段中。路由繫結可透過 `bindings[].session.dmScope`
覆寫其相符對等端的範圍。

即使直接訊息的對話記錄與主要工作階段共用，沙箱和
工具原則仍會為外部私訊使用衍生的各帳號直接聊天執行階段鍵值，
因此不會將源自頻道的訊息視為本機主要工作階段的執行。

群組和頻道會依頻道維持隔離：

- 群組：`agent:<agentId>:<channel>:group:<id>`
- 頻道／聊天室：`agent:<agentId>:<channel>:channel:<id>`

討論串：

- Slack／Discord 討論串會將 `:thread:<threadId>` 附加至基礎鍵值。
- Telegram 論壇主題會將 `:topic:<topicId>` 嵌入群組鍵值。

範例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 主要私訊路由固定

當 `session.dmScope` 為 `main` 時，直接訊息可能會共用一個主要工作階段。
為防止工作階段的 `lastRoute` 被非擁有者的私訊覆寫，
當以下條件全部成立時，OpenClaw 會從 `allowFrom` 推斷固定的擁有者：

- `allowFrom` 恰好有一個非萬用字元項目。
- 該項目可正規化為該頻道的具體傳送者 ID。
- 傳入私訊的傳送者與該固定擁有者不相符。

在此不相符的情況下，OpenClaw 仍會記錄傳入工作階段的中繼資料，但會
略過更新主要工作階段的 `lastRoute`。

## 受保護的傳入記錄

當受保護的路徑不得建立新的 OpenClaw 工作階段時，頻道外掛可將傳入工作階段記錄標示為 `createIfMissing: false`。
在此模式下，OpenClaw 可更新現有工作階段的中繼資料與 `lastRoute`，但不會
僅因觀察到訊息就建立只含路由的工作階段項目。

## 路由規則（如何選擇代理程式）

路由會為每則傳入訊息選擇**一個代理程式**：

1. **完全相符的對等端**（`bindings` 搭配 `peer.kind` + `peer.id`）。
2. **父對等端相符**（討論串繼承）。
3. **對等端萬用字元相符**（對等端種類使用 `peer.id: "*"`）。
4. **伺服器 + 角色相符**（Discord），透過 `guildId` + `roles`。
5. **伺服器相符**（Discord），透過 `guildId`。
6. **團隊相符**（Slack），透過 `teamId`。
7. **帳號相符**（頻道上的 `accountId`）。
8. **頻道相符**（該頻道上的任何帳號，`accountId: "*"`）。
9. **預設代理程式**（`agents.list[].default`，否則為清單中的第一個項目，並以 `main` 作為備援）。

當繫結包含多個比對欄位（`peer`、`guildId`、`teamId`、`roles`）時，**所有提供的欄位都必須相符**，該繫結才會套用。

相符的代理程式會決定要使用的工作區及工作階段儲存區。

## 廣播群組（執行多個代理程式）

廣播群組可讓你針對同一個對等端執行**多個代理程式**，但僅限於 **OpenClaw 通常會回覆時**（例如：在 WhatsApp 群組中，通過提及／啟用閘門之後）。

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

- `agents.list`：具名代理程式定義（工作區、模型等）。
- `bindings`：將傳入頻道／帳號／對等端對應至代理程式。

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

執行階段工作階段資料列位於狀態目錄下各代理程式的 SQLite 資料庫中
（預設為 `~/.openclaw`）：

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

較舊的安裝可能在 `~/.openclaw/agents/<agentId>/sessions/` 下保有舊版對話記錄 JSONL 檔案和
`sessions.json` 資料列儲存區。閘道啟動和
`openclaw doctor --fix` 會自動將作用中的舊版資料列／記錄匯入 SQLite。
需要明確的遷移證據時，請使用 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` 和
[Doctor](/zh-TW/cli/doctor#session-sqlite-migration) 驗證程序。
你仍可透過 `session.store` 和 `{agentId}` 範本
選擇舊版儲存區路徑，以供遷移和離線維護工作流程使用。

閘道和 ACP 工作階段探索也會掃描預設 `agents/` 根目錄及
範本化 `session.store` 根目錄下以磁碟為基礎的代理程式儲存區。探索到的
儲存區必須位於已解析的代理程式根目錄內，並使用一般的舊版
`sessions.json` 檔案。符號連結和根目錄外的路徑會被忽略。

## WebChat 行為

WebChat 會連接至**選定的代理程式**，並預設使用該代理程式的主要
工作階段。因此，WebChat 可讓你在同一處查看該
代理程式的跨頻道上下文。

## 回覆上下文

傳入回覆在可用時會包含：

- `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用的上下文會以 `[Replying to ...]` 區塊附加至 `Body`。

所有頻道的行為皆一致。

## 相關內容

- [群組](/zh-TW/channels/groups)
- [廣播群組](/zh-TW/channels/broadcast-groups)
- [配對](/zh-TW/channels/pairing)
