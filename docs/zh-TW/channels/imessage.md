---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送/接收
summary: 透過 imsg（stdio 上的 JSON-RPC）提供原生 iMessage 支援。當主機需求符合時，這是新的 OpenClaw iMessage 設定的首選。
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於新的 OpenClaw iMessage 部署，若你可以在已登入的 macOS Messages 主機上執行 `imsg`，請從這裡開始。BlueBubbles 仍可作為舊版備援，用於依賴其 HTTP 伺服器、webhooks 或更豐富私有 API 動作的現有設定。
</Note>

狀態：原生外部 CLI 整合。Gateway 會啟動 `imsg rpc`，並透過 stdio 上的 JSON-RPC 通訊（不需要獨立的 daemon/port）。

<CardGroup cols={3}>
  <Card title="BlueBubbles（舊版備援）" icon="message-circle" href="/zh-TW/channels/bluebubbles">
    現有以 BlueBubbles 支援的路由可繼續使用；若 imsg 適用，新的設定請避免使用它。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    iMessage DM 預設為配對模式。
  </Card>
  <Card title="設定參考" icon="settings" href="/zh-TW/gateway/config-channels#imessage">
    完整的 iMessage 欄位參考。
  </Card>
</CardGroup>

## 快速設定

<Tabs>
  <Tab title="本機 Mac（快速路徑）">
    <Steps>
      <Step title="安裝並驗證 imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="設定 OpenClaw">

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

      <Step title="啟動 gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="核准第一個 DM 配對（預設 dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配對請求會在 1 小時後過期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="透過 SSH 使用遠端 Mac">
    OpenClaw 只需要與 stdio 相容的 `cliPath`，因此你可以將 `cliPath` 指向一個 wrapper script，透過 SSH 連到遠端 Mac 並執行 `imsg`。

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

    如果未設定 `remoteHost`，OpenClaw 會嘗試透過解析 SSH wrapper script 自動偵測它。
    `remoteHost` 必須是 `host` 或 `user@host`（不可有空格或 SSH 選項）。
    OpenClaw 對 SCP 使用嚴格的 host-key 檢查，因此中繼主機金鑰必須已存在於 `~/.ssh/known_hosts`。
    附件路徑會根據允許的根路徑（`attachmentRoots` / `remoteAttachmentRoots`）進行驗證。

  </Tab>
</Tabs>

## 需求與權限（macOS）

- 執行 `imsg` 的 Mac 必須已登入 Messages。
- 執行 OpenClaw/`imsg` 的 process context 需要 Full Disk Access（Messages DB 存取）。
- 需要 Automation 權限，才能透過 Messages.app 傳送訊息。

<Tip>
權限是按 process context 授予的。如果 gateway 以 headless 方式執行（LaunchAgent/SSH），請在相同 context 中執行一次互動式命令來觸發提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 存取控制與路由

<Tabs>
  <Tab title="DM 政策">
    `channels.imessage.dmPolicy` 控制 direct messages：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    Allowlist 欄位：`channels.imessage.allowFrom`。

    Allowlist 項目可以是 handles 或聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。

  </Tab>

  <Tab title="群組政策 + 提及">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（已設定時的預設值）
    - `open`
    - `disabled`

    群組傳送者 allowlist：`channels.imessage.groupAllowFrom`。

    Runtime 備援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會在可用時退回使用 `allowFrom`。
    Runtime 注意事項：如果完全缺少 `channels.imessage`，runtime 會退回到 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    群組的提及 gating：

    - iMessage 沒有原生的提及 metadata
    - 提及偵測使用 regex patterns（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 若沒有設定 patterns，便無法強制執行提及 gating

    來自授權傳送者的控制命令可以在群組中繞過提及 gating。

  </Tab>

  <Tab title="工作階段與確定性回覆">
    - DM 使用直接路由；群組使用群組路由。
    - 使用預設 `session.dmScope=main` 時，iMessage DM 會合併到 agent main session。
    - 群組工作階段會被隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用原始 channel/target metadata 路由回 iMessage。

    類群組 thread 行為：

    某些多參與者 iMessage threads 可能會以 `is_group=false` 抵達。
    如果該 `chat_id` 已在 `channels.imessage.groups` 下明確設定，OpenClaw 會將其視為群組流量（群組 gating + 群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

舊版 iMessage chats 也可以繫結到 ACP sessions。

快速操作流程：

- 在 DM 或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 同一個 iMessage 對話中的後續訊息會路由到已啟動的 ACP session。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP session。
- `/acp close` 會關閉 ACP session 並移除繫結。

可透過頂層 `bindings[]` 項目支援已設定的持久繫結，並使用 `type: "acp"` 和 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 正規化的 DM handle，例如 `+15555550123` 或 `user@example.com`
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
  <Accordion title="專用 bot macOS 使用者（獨立 iMessage 身分）">
    使用專用 Apple ID 與 macOS 使用者，讓 bot 流量與你的個人 Messages profile 隔離。

    典型流程：

    1. 建立/登入專用 macOS 使用者。
    2. 在該使用者中用 bot Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH wrapper，讓 OpenClaw 可在該使用者 context 中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向該使用者 profile。

    第一次執行可能需要在該 bot 使用者 session 中進行 GUI 核准（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="透過 Tailscale 使用遠端 Mac（範例）">
    常見拓撲：

    - gateway 在 Linux/VM 上執行
    - iMessage + `imsg` 在你 tailnet 中的 Mac 上執行
    - `cliPath` wrapper 使用 SSH 來執行 `imsg`
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

    使用 SSH 金鑰，讓 SSH 和 SCP 都不需要互動。
    請先確保主機金鑰已受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），使 `known_hosts` 已填入。

  </Accordion>

  <Accordion title="多帳號模式">
    iMessage 支援在 `channels.imessage.accounts` 下進行個別帳號設定。

    每個帳號都可以覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史記錄設定，以及附件根路徑 allowlists 等欄位。

  </Accordion>
</AccordionGroup>

## 媒體、分段與傳遞目標

<AccordionGroup>
  <Accordion title="附件與媒體">
    - inbound 附件擷取是選用的：`channels.imessage.includeAttachments`
    - 設定 `remoteHost` 時，可以透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根路徑：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 預設根路徑 pattern：`/Users/*/Library/Messages/Attachments`
    - SCP 使用嚴格 host-key 檢查（`StrictHostKeyChecking=yes`）
    - outbound 媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="Outbound 分段">
    - 文字分段限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分段模式：`channels.imessage.chunkMode`
      - `length`（預設）
      - `newline`（段落優先切分）

  </Accordion>

  <Accordion title="定址格式">
    建議使用明確目標：

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

iMessage 預設允許 channel 啟動的設定寫入（當 `commands.config: true` 時用於 `/config set|unset`）。

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
  <Accordion title="找不到 imsg 或不支援 RPC">
    驗證 binary 和 RPC 支援：

```bash
imsg rpc --help
openclaw channels status --probe
```

    如果 probe 回報不支援 RPC，請更新 `imsg`。

  </Accordion>

  <Accordion title="DM 被忽略">
    檢查：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 配對核准（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="群組訊息被忽略">
    檢查：

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` allowlist 行為
    - 提及 pattern 設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="遠端附件失敗">
    檢查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 來自 gateway 主機的 SSH/SCP 金鑰驗證
    - host key 存在於 gateway 主機上的 `~/.ssh/known_hosts`
    - 執行 Messages 的 Mac 上遠端路徑的可讀性

  </Accordion>

  <Accordion title="錯過了 macOS 權限提示">
    在相同使用者/session context 的互動式 GUI terminal 中重新執行，並核准提示：

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    確認執行 OpenClaw/`imsg` 的 process context 已授予 Full Disk Access + Automation。

  </Accordion>
</AccordionGroup>

## 設定參考指標

- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
- [Gateway 設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)
- [BlueBubbles](/zh-TW/channels/bluebubbles)

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
