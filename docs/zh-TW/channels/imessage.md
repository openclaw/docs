---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送/接收
summary: 透過 imsg（stdio 上的 JSON-RPC）提供舊版 iMessage 支援。新的設定應使用 BlueBubbles。
title: iMessage
x-i18n:
    generated_at: "2026-04-30T02:46:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
若要進行新的 iMessage 部署，請使用 <a href="/zh-TW/channels/bluebubbles">BlueBubbles</a>。

`imsg` 整合屬於舊版功能，可能會在未來版本中移除。
</Warning>

狀態：舊版外部 CLI 整合。Gateway 會啟動 `imsg rpc`，並透過 stdio 上的 JSON-RPC 通訊（沒有獨立的守護程式/連接埠）。

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/zh-TW/channels/bluebubbles">
    新設定建議使用的 iMessage 路徑。
  </Card>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    iMessage 私訊預設使用配對模式。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/zh-TW/gateway/config-channels#imessage">
    完整的 iMessage 欄位參考。
  </Card>
</CardGroup>

## 快速設定

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配對請求會在 1 小時後過期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw 只需要與 stdio 相容的 `cliPath`，因此你可以將 `cliPath` 指向一個 wrapper script，由它透過 SSH 連到遠端 Mac 並執行 `imsg`。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    啟用附件時的建議設定：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    如果未設定 `remoteHost`，OpenClaw 會嘗試透過剖析 SSH wrapper script 自動偵測。
    `remoteHost` 必須是 `host` 或 `user@host`（不可有空格或 SSH 選項）。
    OpenClaw 對 SCP 使用嚴格的主機金鑰檢查，因此轉送主機金鑰必須已存在於 `~/.ssh/known_hosts`。
    附件路徑會根據允許的根目錄（`attachmentRoots` / `remoteAttachmentRoots`）進行驗證。

  </Tab>
</Tabs>

## 需求與權限（macOS）

- Messages 必須已在執行 `imsg` 的 Mac 上登入。
- 執行 OpenClaw/`imsg` 的程序環境需要完整磁碟存取權（Messages 資料庫存取）。
- 需要自動化權限，才能透過 Messages.app 傳送訊息。

<Tip>
權限是依程序環境授予。如果 gateway 以無頭模式執行（LaunchAgent/SSH），請在同一環境中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 存取控制與路由

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` 控制直接訊息：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    Allowlist 欄位：`channels.imessage.allowFrom`。

    Allowlist 項目可以是 handle 或聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（已設定時的預設值）
    - `open`
    - `disabled`

    群組傳送者 allowlist：`channels.imessage.groupAllowFrom`。

    執行階段後援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會在可用時退回使用 `allowFrom`。
    執行階段注意事項：如果完全缺少 `channels.imessage`，執行階段會退回到 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    群組的提及 gating：

    - iMessage 沒有原生提及 metadata
    - 提及偵測使用 regex patterns（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 未設定 patterns 時，無法強制執行提及 gating

    來自授權傳送者的控制命令可以在群組中略過提及 gating。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - 私訊使用直接路由；群組使用群組路由。
    - 使用預設 `session.dmScope=main` 時，iMessage 私訊會收斂到 agent main session。
    - 群組 session 會隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用來源 channel/target metadata 路由回 iMessage。

    類群組 thread 行為：

    某些多參與者 iMessage threads 可能會以 `is_group=false` 抵達。
    如果該 `chat_id` 明確設定於 `channels.imessage.groups` 下，OpenClaw 會將其視為群組流量（群組 gating + 群組 session 隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

舊版 iMessage 聊天也可以繫結到 ACP sessions。

快速操作流程：

- 在私訊或允許的群組聊天內執行 `/acp spawn codex --bind here`。
- 之後同一個 iMessage 對話中的訊息會路由到產生的 ACP session。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP session。
- `/acp close` 會關閉 ACP session 並移除繫結。

已設定的持久繫結可透過最上層 `bindings[]` 項目支援，其中 `type: "acp"` 且 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 標準化的私訊 handle，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`（建議用於穩定的群組繫結）
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

範例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

請參閱 [ACP Agents](/zh-TW/tools/acp-agents) 了解共用的 ACP 繫結行為。

## 部署模式

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    使用專用 Apple ID 和 macOS 使用者，讓 bot 流量與你的個人 Messages profile 隔離。

    典型流程：

    1. 建立/登入專用 macOS 使用者。
    2. 在該使用者中使用 bot Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH wrapper，讓 OpenClaw 可以在該使用者環境中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向該使用者 profile。

    第一次執行可能需要在該 bot 使用者 session 中進行 GUI 核准（自動化 + 完整磁碟存取）。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    常見拓撲：

    - gateway 在 Linux/VM 上執行
    - iMessage + `imsg` 在你 tailnet 中的一台 Mac 上執行
    - `cliPath` wrapper 使用 SSH 執行 `imsg`
    - `remoteHost` 啟用 SCP 附件擷取

    範例：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    使用 SSH 金鑰，讓 SSH 和 SCP 都能非互動執行。
    請先確保主機金鑰已受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），讓 `known_hosts` 已填入。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage 支援 `channels.imessage.accounts` 下的逐帳號設定。

    每個帳號都可以覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、history settings，以及附件根目錄 allowlists 等欄位。

  </Accordion>
</AccordionGroup>

## 媒體、分塊與遞送目標

<AccordionGroup>
  <Accordion title="Attachments and media">
    - 傳入附件擷取是選用的：`channels.imessage.includeAttachments`
    - 設定 `remoteHost` 時，可以透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 預設根目錄 pattern：`/Users/*/Library/Messages/Attachments`
    - SCP 使用嚴格的主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 傳出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="Outbound chunking">
    - 文字分塊限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分塊模式：`channels.imessage.chunkMode`
      - `length`（預設）
      - `newline`（段落優先切分）

  </Accordion>

  <Accordion title="Addressing formats">
    建議的明確目標：

    - `chat_id:123`（建議用於穩定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支援 handle 目標：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 設定寫入

iMessage 預設允許 channel 發起的設定寫入（適用於 `commands.config: true` 時的 `/config set|unset`）。

停用：

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## 疑難排解

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    驗證 binary 與 RPC 支援：

```bash
imsg rpc --help
openclaw channels status --probe
```

    如果 probe 回報 RPC 不受支援，請更新 `imsg`。

  </Accordion>

  <Accordion title="DMs are ignored">
    檢查：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 配對核准（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="Group messages are ignored">
    檢查：

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` allowlist 行為
    - 提及 pattern 設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="Remote attachments fail">
    檢查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 來自 gateway host 的 SSH/SCP 金鑰驗證
    - gateway host 上的 `~/.ssh/known_hosts` 中存在主機金鑰
    - 執行 Messages 的 Mac 上的遠端路徑可讀性

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    在同一使用者/session 環境中的互動式 GUI terminal 重新執行並核准提示：

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    確認完整磁碟存取 + 自動化已授予執行 OpenClaw/`imsg` 的程序環境。

  </Accordion>
</AccordionGroup>

## 設定參考指標

- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
- [Gateway 設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)
- [BlueBubbles](/zh-TW/channels/bluebubbles)

## 相關

- [Channels Overview](/zh-TW/channels) — 所有支援的 channels
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及 gating
- [Channel Routing](/zh-TW/channels/channel-routing) — 訊息的 session 路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
