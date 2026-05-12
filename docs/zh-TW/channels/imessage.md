---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送/接收
summary: 透過 imsg（經由 stdio 的 JSON-RPC）提供原生 iMessage 支援，具備用於回覆、點按回應、效果、附件和群組管理的私有 API 動作。當符合主機需求時，這是新 OpenClaw iMessage 設定的首選方式。
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於 OpenClaw iMessage 部署，請在已登入的 macOS Messages 主機上使用 `imsg`。如果你的 Gateway 在 Linux 或 Windows 上執行，請將 `channels.imessage.cliPath` 指向會在 Mac 上執行 `imsg` 的 SSH 包裝器。

**Gateway 停機追補為選擇啟用。** 啟用後（`channels.imessage.catchup.enabled: true`），gateway 會在下次啟動時重播其離線期間（當機、重新啟動、Mac 睡眠）落入 `chat.db` 的傳入訊息。預設停用 — 請參閱[在 gateway 停機後追補](#catching-up-after-gateway-downtime)。關閉 [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)。
</Note>

<Warning>
BlueBubbles 支援已移除。請將 `channels.bluebubbles` 設定遷移到 `channels.imessage`；OpenClaw 僅透過 `imsg` 支援 iMessage。簡短公告請先閱讀 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整遷移表請閱讀[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。
</Warning>

狀態：原生外部 CLI 整合。Gateway 會生成 `imsg rpc`，並透過 stdio 上的 JSON-RPC 通訊（沒有獨立 daemon/port）。進階動作需要 `imsg launch` 以及成功的私有 API 探測。

<CardGroup cols={3}>
  <Card title="私有 API 動作" icon="wand-sparkles" href="#private-api-actions">
    回覆、tapback、效果、附件，以及群組管理。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    iMessage 私訊預設為配對模式。
  </Card>
  <Card title="遠端 Mac" icon="terminal" href="#remote-mac-over-ssh">
    當 Gateway 未在 Messages Mac 上執行時，請使用 SSH 包裝器。
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
imsg launch
openclaw channels status --probe
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

      <Step title="核准第一個私訊配對（預設 dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配對請求會在 1 小時後過期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="透過 SSH 連線到遠端 Mac">
    OpenClaw 只需要 stdio 相容的 `cliPath`，因此你可以將 `cliPath` 指向會透過 SSH 連到遠端 Mac 並執行 `imsg` 的包裝器指令碼。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    啟用附件時建議使用的設定：

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

    如果未設定 `remoteHost`，OpenClaw 會嘗試透過解析 SSH 包裝器指令碼自動偵測。
    `remoteHost` 必須是 `host` 或 `user@host`（不能有空格或 SSH 選項）。
    OpenClaw 對 SCP 使用嚴格的主機金鑰檢查，因此轉送主機金鑰必須已存在於 `~/.ssh/known_hosts`。
    附件路徑會根據允許的根目錄（`attachmentRoots` / `remoteAttachmentRoots`）驗證。

  </Tab>
</Tabs>

## 需求與權限（macOS）

- Messages 必須在執行 `imsg` 的 Mac 上登入。
- 執行 OpenClaw/`imsg` 的程序脈絡需要完整磁碟存取權（Messages DB 存取）。
- 透過 Messages.app 傳送訊息需要自動化權限。
- 對於進階動作（回應 / 編輯 / 取消傳送 / 串接回覆 / 效果 / 群組操作），必須停用系統完整性保護 — 請參閱下方[啟用 imsg 私有 API](#enabling-the-imsg-private-api)。基本文字與媒體的傳送/接收不需要停用。

<Tip>
權限會按程序脈絡授予。如果 gateway 以無頭方式執行（LaunchAgent/SSH），請在相同脈絡中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 啟用 imsg 私有 API

`imsg` 提供兩種操作模式：

- **基本模式**（預設，不需要變更 SIP）：透過 `send` 傳出文字與媒體、傳入監看/歷史紀錄、聊天清單。這是全新 `brew install steipete/tap/imsg` 加上上方標準 macOS 權限後開箱即可取得的模式。
- **私有 API 模式**：`imsg` 會將輔助 dylib 注入 `Messages.app`，以呼叫內部 `IMCore` 函式。這會解鎖 `react`、`edit`、`unsend`、`reply`（串接）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及輸入指示器和已讀回條。

若要使用本頻道頁面記載的進階動作介面，你需要私有 API 模式。`imsg` README 對此需求說明得很明確：

> `read`、`typing`、`launch`、橋接支援的豐富傳送、訊息變更與聊天管理等進階功能為選擇啟用。它們需要停用 SIP，並將輔助 dylib 注入 `Messages.app`。啟用 SIP 時，`imsg launch` 會拒絕注入。

此輔助注入技術使用 `imsg` 自身的 dylib 來觸及 Messages 私有 API。OpenClaw iMessage 路徑中沒有第三方伺服器或 BlueBubbles runtime。

<Warning>
**停用 SIP 是實際的安全取捨。** SIP 是 macOS 防止執行已修改系統程式碼的核心保護之一；在全系統關閉它會增加額外攻擊面和副作用。特別是，**在 Apple Silicon Mac 上停用 SIP 也會停用在 Mac 上安裝與執行 iOS app 的能力**。

請將這視為有意識的營運選擇，而不是預設值。如果你的威脅模型無法容許 SIP 關閉，內建 iMessage 會受限於基本模式 — 僅可傳送/接收文字與媒體，沒有回應 / 編輯 / 取消傳送 / 效果 / 群組操作。
</Warning>

### 設定

1. 在執行 Messages.app 的 Mac 上**安裝（或升級）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 輸出會回報 `bridge_version`、`rpc_methods`，以及各方法的 `selectors`，讓你在開始前查看目前建置支援哪些功能。

2. **停用系統完整性保護。** 這取決於 macOS 版本，因為底層 Apple 需求會依作業系統與硬體而異：
   - **macOS 10.13–10.15（Sierra–Catalina）：** 透過 Terminal 停用 Library Validation、重新啟動進入 Recovery Mode、執行 `csrutil disable`，然後重新啟動。
   - **macOS 11+（Big Sur 及更新版本），Intel：** Recovery Mode（或 Internet Recovery）、`csrutil disable`、重新啟動。
   - **macOS 11+，Apple Silicon：** 使用電源按鈕開機流程進入 Recovery；在近期 macOS 版本中，點擊 Continue 時按住 **Left Shift** 鍵，然後執行 `csrutil disable`。虛擬機設定使用獨立流程 — 請先建立 VM snapshot。
   - **macOS 26 / Tahoe：** library-validation 政策與 `imagent` 私有權利檢查進一步收緊；`imsg` 可能需要更新建置才能跟上。如果在 macOS 主要版本升級後，`imsg launch` 注入或特定 `selectors` 開始回傳 false，請先檢查 `imsg` 的 release notes，再判定 SIP 步驟是否成功。

   在執行 `imsg launch` 前，請依照 Apple 為你的 Mac 提供的 Recovery-mode 流程停用 SIP。

3. **注入輔助程式。** 在 SIP 已停用且 Messages.app 已登入的情況下：

   ```bash
   imsg launch
   ```

   當 SIP 仍啟用時，`imsg launch` 會拒絕注入，因此這也可作為步驟 2 已生效的確認。

4. **從 OpenClaw 驗證橋接：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 項目應回報 `works`，而 `imsg status --json | jq '.selectors'` 應顯示 `retractMessagePart: true`，以及你的 macOS 建置公開的任何編輯 / 輸入 / 已讀 selector。OpenClaw Plugin 在 `actions.ts` 中的各方法門控只會公布底層 selector 為 `true` 的動作，因此你在 agent 工具清單中看到的動作介面會反映此主機上的橋接實際可執行內容。

如果 `openclaw channels status --probe` 回報頻道為 `works`，但特定動作在分派時拋出「iMessage `<action>` requires the imsg private API bridge」，請再次執行 `imsg launch` — 輔助程式可能會脫落（Messages.app 重新啟動、OS 更新等），而快取的 `available: true` 狀態會持續公布動作，直到下一次探測刷新。

### 當你無法停用 SIP

如果你的威脅模型無法接受停用 SIP：

- `imsg` 會退回基本模式 — 僅文字 + 媒體 + 接收。
- OpenClaw Plugin 仍會公布文字/媒體傳送與傳入監控；它只會從動作介面隱藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 與群組操作（依據各方法能力門控）。
- 你可以使用一台獨立的非 Apple Silicon Mac（或專用 bot Mac）並為 iMessage 工作負載關閉 SIP，同時在主要裝置上保持 SIP 啟用。請參閱下方[專用 bot macOS 使用者（獨立 iMessage 身分）](#deployment-patterns)。

## 存取控制與路由

<Tabs>
  <Tab title="私訊政策">
    `channels.imessage.dmPolicy` 控制直接訊息：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    Allowlist 欄位：`channels.imessage.allowFrom`。

    Allowlist 項目可以是 handle、靜態傳送者存取群組（`accessGroup:<name>`），或聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。

  </Tab>

  <Tab title="群組政策 + 提及">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（設定時的預設值）
    - `open`
    - `disabled`

    群組傳送者 allowlist：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 項目也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。

    Runtime 後援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會在可用時退回使用 `allowFrom`。
    Runtime 注意事項：如果完全缺少 `channels.imessage`，runtime 會退回 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    <Warning>
    群組路由有**兩個** allowlist 關卡連續執行，且兩者都必須通過：

    1. **傳送者 / 聊天目標 allowlist**（`channels.imessage.groupAllowFrom`）— handle、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群組註冊表**（`channels.imessage.groups`）— 當 `groupPolicy: "allowlist"` 時，此關卡需要 `groups: { "*": { ... } }` 萬用字元項目（設定 `allowAll = true`），或 `groups` 底下明確的每個 `chat_id` 項目。

    如果關卡 2 裡沒有任何內容，每則群組訊息都會被丟棄。Plugin 會在預設記錄層級發出兩個 `warn` 層級訊號：

    - 啟動時每個帳號一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 執行時每個 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    私訊會繼續運作，因為它們走不同的程式碼路徑。

    在 `groupPolicy: "allowlist"` 下讓群組保持流通的最低設定：

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    如果那些 `warn` 行出現在 Gateway 記錄檔中，表示 gate 2 正在丟棄 — 請新增 `groups` 區塊。
    </Warning>

    說明群組的提及閘控：

    - iMessage 沒有原生提及中繼資料
    - 提及偵測使用 regex 模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 若未設定任何模式，就無法強制執行提及閘控

    來自授權傳送者的控制命令可以在群組中繞過提及閘控。

    每群組 `systemPrompt`：

    `channels.imessage.groups.*` 底下的每個項目都接受選用的 `systemPrompt` 字串。該值會在處理該群組訊息的每一輪中注入代理的 system prompt。解析方式與 `channels.whatsapp.groups` 使用的每群組 prompt 解析相同：

    1. **群組專屬 system prompt**（`groups["<chat_id>"].systemPrompt`）：當該特定群組項目存在於映射中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會對該群組套用 system prompt。
    2. **群組萬用字元 system prompt**（`groups["*"].systemPrompt`）：當該特定群組項目完全不存在於映射中，或它存在但未定義 `systemPrompt` 鍵時使用。

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    每群組 prompt 只會套用到群組訊息 — 此通道中的直接訊息不受影響。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - 私訊使用直接路由；群組使用群組路由。
    - 在預設的 `session.dmScope=main` 下，iMessage 私訊會收斂到代理的主要工作階段。
    - 群組工作階段彼此隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用來源通道/目標中繼資料路由回 iMessage。

    類群組執行緒行為：

    某些多參與者 iMessage 執行緒可能會以 `is_group=false` 抵達。
    如果該 `chat_id` 已明確設定在 `channels.imessage.groups` 底下，OpenClaw 會將它視為群組流量（群組閘控 + 群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

舊版 iMessage 聊天也可以繫結到 ACP 工作階段。

快速操作流程：

- 在私訊或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 同一個 iMessage 對話中的後續訊息會路由到已產生的 ACP 工作階段。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

可透過頂層 `bindings[]` 項目支援已設定的持久繫結，並搭配 `type: "acp"` 與 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 正規化的私訊 handle，例如 `+15555550123` 或 `user@example.com`
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

請參閱 [ACP 代理](/zh-TW/tools/acp-agents)，了解共用 ACP 繫結行為。

## 部署模式

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    使用專用 Apple ID 和 macOS 使用者，讓機器人流量與你的個人 Messages 個人檔案隔離。

    典型流程：

    1. 建立/登入專用 macOS 使用者。
    2. 在該使用者中使用機器人 Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH wrapper，讓 OpenClaw 能在該使用者情境中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向該使用者個人檔案。

    首次執行可能需要在該機器人使用者工作階段中核准 GUI 權限（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    常見拓撲：

    - Gateway 在 Linux/VM 上執行
    - iMessage + `imsg` 在你的 tailnet 中的 Mac 上執行
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

    使用 SSH 金鑰，讓 SSH 和 SCP 都可非互動執行。
    請先確保主機金鑰受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），使 `known_hosts` 已填入。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage 支援 `channels.imessage.accounts` 底下的每帳號設定。

    每個帳號都可覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史記錄設定，以及附件根目錄 allowlist 等欄位。

  </Accordion>
</AccordionGroup>

## 媒體、分塊與傳送目標

<AccordionGroup>
  <Accordion title="Attachments and media">
    - 輸入附件擷取**預設為關閉** — 設定 `channels.imessage.includeAttachments: true`，即可將照片、語音備忘錄、影片和其他附件轉送給代理。停用時，僅含附件的 iMessage 會在到達代理前被丟棄，且可能完全不產生 `Inbound message` 記錄行。
    - 設定 `remoteHost` 時，可透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 預設根目錄模式：`/Users/*/Library/Messages/Attachments`
    - SCP 使用嚴格主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 輸出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="Outbound chunking">
    - 文字分塊限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分塊模式：`channels.imessage.chunkMode`
      - `length`（預設）
      - `newline`（優先依段落分割）

  </Accordion>

  <Accordion title="Addressing formats">
    偏好的明確目標：

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

## 私有 API 動作

當 `imsg launch` 正在執行，且 `openclaw channels status --probe` 回報 `privateApi.available: true` 時，訊息工具除了正常文字傳送外，也可以使用 iMessage 原生動作。

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**：新增/移除 iMessage tapback（`messageId`、`emoji`、`remove`）。支援的 tapback 會映射到 love、like、dislike、laugh、emphasize 和 question。
    - **reply**：傳送對既有訊息的串接回覆（`messageId`、`text` 或 `message`，加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：傳送帶有 iMessage 效果的文字（`text` 或 `message`、`effect` 或 `effectId`）。
    - **edit**：在支援的 macOS/私有 API 版本上編輯已傳送訊息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在支援的 macOS/私有 API 版本上收回已傳送訊息（`messageId`）。
    - **upload-file**：傳送媒體/檔案（`buffer` 作為 base64，或 hydrated 的 `media`/`path`/`filePath`、`filename`，選用 `asVoice`）。舊版別名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：當目前目標是群組對話時管理群組聊天。

  </Accordion>

  <Accordion title="Message IDs">
    輸入 iMessage 情境會在可用時同時包含短 `MessageSid` 值與完整訊息 GUID。短 ID 的範圍限於近期的記憶體中回覆快取，且使用前會先對目前聊天進行檢查。如果短 ID 已過期或屬於另一個聊天，請使用完整 `MessageSidFull` 重試。

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw 只有在快取的探測狀態表示橋接器不可用時，才會隱藏私有 API 動作。如果狀態未知，動作會保持可見，並在分派時延遲探測，讓第一個動作能在 `imsg launch` 之後成功，而不需要額外手動重新整理狀態。

  </Accordion>

  <Accordion title="Read receipts and typing">
    私有 API 橋接器啟用時，已接受的輸入聊天會在分派前標示為已讀，且代理產生回覆期間會向傳送者顯示輸入中氣泡。使用以下設定停用已讀標示：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早於每方法 capability 清單的舊版 `imsg` 組建會靜默關閉 typing/read；OpenClaw 會在每次重新啟動時記錄一次警告，讓缺少回條的原因可被歸因。

  </Accordion>

  <Accordion title="Inbound tapbacks">
    OpenClaw 訂閱 iMessage tapback，並將已接受的 reaction 路由為系統事件，而非一般訊息文字，因此使用者 tapback 不會觸發普通回覆迴圈。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（預設）：只在使用者對機器人撰寫的訊息作出 reaction 時通知。
    - `"all"`：針對授權傳送者的所有輸入 tapback 通知。
    - `"off"`：忽略輸入 tapback。

    每帳號覆寫使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>
</AccordionGroup>

## 設定寫入

iMessage 預設允許通道發起的設定寫入（用於 `commands.config: true` 時的 `/config set|unset`）。

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

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合併分割傳送的私訊（單次撰寫中的命令 + URL）

當使用者一起輸入命令和 URL — 例如 `Dump https://example.com/article` — Apple 的 Messages app 會將傳送拆成**兩筆不同的 `chat.db` 列**：

1. 文字訊息（`"Dump"`）。
2. 帶有 OG 預覽圖片作為附件的 URL 預覽氣泡（`"https://..."`）。

在大多數設定中，這兩列會相隔約 0.8-2.0 秒抵達 OpenClaw。若沒有合併處理，代理會在第 1 輪只收到命令並回覆（通常是「請傳 URL 給我」），然後在第 2 輪才看到 URL — 此時命令情境已經遺失。這是 Apple 的傳送管線行為，不是 OpenClaw 或 `imsg` 引入的任何東西。

`channels.imessage.coalesceSameSenderDms` 會讓 DM 選擇將連續的同一寄件者列合併為單一代理程式回合。群組聊天仍會逐訊息派送，以保留多使用者回合結構。

<Tabs>
  <Tab title="何時啟用">
    在以下情況啟用：

    - 你提供的技能預期在單一訊息中收到 `command + payload`（dump、paste、save、queue 等）。
    - 你的使用者會在命令旁貼上 URL、圖片或長內容。
    - 你可以接受增加的 DM 回合延遲（見下方）。

    在以下情況保持停用：

    - 你需要單字 DM 觸發器的最低命令延遲。
    - 你的所有流程都是沒有後續 payload 的一次性命令。

  </Tab>
  <Tab title="啟用">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    啟用此旗標且沒有明確設定 `messages.inbound.byChannel.imessage` 時，防抖時間窗會加寬到 **2500 ms**（舊版預設為 0 ms — 不做防抖）。需要較寬的時間窗，是因為 Apple 的分段傳送節奏為 0.8-2.0 s，不適合較緊的預設值。

    若要自行調整時間窗：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="取捨">
    - **DM 訊息會增加延遲。** 啟用此旗標後，每個 DM（包含獨立控制命令與單一文字後續訊息）都會在派送前等待最多防抖時間窗，以防 payload 列即將到來。群組聊天訊息仍會立即派送。
    - **合併後的輸出有界限。** 合併文字上限為 4000 個字元，並帶有明確的 `…[truncated]` 標記；附件上限為 20；來源項目上限為 10（超過後保留第一筆加最新筆）。每個來源 GUID 都會記錄在 `coalescedMessageGuids` 中，以供下游遙測使用。
    - **僅限 DM。** 群組聊天會走逐訊息派送，因此多人同時輸入時 bot 仍能保持回應。
    - **選擇啟用，依通道設定。** 其他通道（Telegram、WhatsApp、Slack、…）不受影響。已設定 `channels.bluebubbles.coalesceSameSenderDms` 的舊版 BlueBubbles 設定，應將該值遷移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 情境與代理程式看到的內容

| 使用者撰寫內容                                                     | `chat.db` 產生       | 旗標關閉（預設）                       | 旗標開啟 + 2500 ms 時間窗                                               |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                              | 約相隔 1 s 的 2 列    | 兩個代理程式回合：「Dump」單獨一則，然後是 URL | 一個回合：合併文字 `Dump https://example.com`                           |
| `Save this 📎image.jpg caption`（附件 + 文字）                      | 2 列                  | 兩個回合（附件在合併時被丟棄）          | 一個回合：保留文字 + 圖片                                               |
| `/status`（獨立命令）                                               | 1 列                  | 立即派送                                | **等待最多時間窗，然後派送**                                            |
| 單獨貼上的 URL                                                      | 1 列                  | 立即派送                                | 立即派送（bucket 中只有一個項目）                                       |
| 文字 + URL 作為兩則刻意分開的訊息傳送，間隔數分鐘                  | 時間窗外的 2 列       | 兩個回合                                | 兩個回合（時間窗在兩者之間到期）                                        |
| 快速大量傳送（時間窗內 >10 則小型 DM）                              | N 列                  | N 個回合                                | 一個回合，有界限輸出（保留第一筆 + 最新筆，套用文字/附件上限）          |
| 兩個人在群組聊天中輸入                                             | 來自 M 位寄件者的 N 列 | M+ 個回合（每個寄件者 bucket 一個）     | M+ 個回合 — 群組聊天不會合併                                            |

## Gateway 停機後追趕進度

當 Gateway 離線（當機、重新啟動、Mac 睡眠、機器關機）時，`imsg watch` 會在 Gateway 恢復後，從目前的 `chat.db` 狀態繼續 — 預設情況下，間隔期間抵達的任何內容都不會被看見。追趕會在下一次啟動時重播這些訊息，讓代理程式不會靜默漏掉傳入流量。

追趕功能**預設停用**。依通道啟用：

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### 執行方式

每次 `monitorIMessageProvider` 啟動執行一個 pass，順序為 `imsg launch` 就緒 → `watch.subscribe` → `performIMessageCatchup` → 即時派送迴圈。追趕本身會使用 `chats.list` + 每個聊天的 `messages.history`，並透過與 `imsg watch` 相同的 JSON-RPC 用戶端。追趕 pass 期間抵達的任何內容都會照常流經即時派送；既有的傳入去重複快取會吸收與重播列的任何重疊。

每個重播列都會送入即時派送路徑（`evaluateIMessageInbound` + `dispatchInboundMessage`），因此允許清單、群組政策、防抖器、回聲快取與已讀回條，在重播與即時訊息上的行為完全一致。

### 游標與重試語意

追趕會在 `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` 保留每個帳戶的游標（OpenClaw 狀態目錄預設為 `~/.openclaw`，可用 `OPENCLAW_STATE_DIR` 覆寫）：

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- 每次成功派送時游標都會前進；若列的派送擲出錯誤，游標會保持不變 — 下一次啟動會從保留的游標重試同一列。
- 對同一個 `guid` 連續擲出 `maxFailureRetries` 次後，追趕會記錄 `warn`，並強制將游標推進到卡住訊息之後，讓後續啟動能繼續前進。
- 已放棄的 guid 在後續執行中一看到就會跳過（不嘗試派送），並在執行摘要中計入 `skippedGivenUp`。

### 操作者可見的訊號

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行表示單次啟動未能清空完整積壓。如果你的間隔經常超過預設的 50 列 pass，請提高 `perRunLimit`（最高 500）。

### 何時保持關閉

- Gateway 以 watchdog 自動重新啟動持續執行，且間隔一律 < 幾秒 — 預設關閉即可。
- DM 流量很低，漏掉訊息不會改變代理程式行為 — 首次啟用時，`firstRunLookbackMinutes` 初始時間窗可能會派送令人意外的舊上下文。

當你開啟追趕時，沒有游標的第一次啟動只會回看 `firstRunLookbackMinutes`（預設 30 分鐘），而不是完整的 `maxAgeMinutes` 時間窗 — 這可避免重播啟用前的大量歷史訊息。

## 疑難排解

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支援 RPC">
    驗證二進位檔與 RPC 支援：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果 probe 回報不支援 RPC，請更新 `imsg`。如果無法使用私有 API 動作，請在已登入的 macOS 使用者工作階段中執行 `imsg launch`，然後再次 probe。如果 Gateway 不是在 macOS 上執行，請改用上方的透過 SSH 使用遠端 Mac 設定，而不是預設的本機 `imsg` 路徑。

  </Accordion>

  <Accordion title="Gateway 未在 macOS 上執行">
    預設的 `cliPath: "imsg"` 必須在已登入「訊息」的 Mac 上執行。在 Linux 或 Windows 上，請將 `channels.imessage.cliPath` 設為一個包裝腳本，透過 SSH 連到該 Mac 並執行 `imsg "$@"`。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    然後執行：

```bash
openclaw channels status --probe --channel imessage
```

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
    - `channels.imessage.groups` 允許清單行為
    - 提及模式設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="遠端附件失敗">
    檢查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 來自 Gateway 主機的 SSH/SCP 金鑰驗證
    - Gateway 主機上的 `~/.ssh/known_hosts` 中存在主機金鑰
    - 執行「訊息」的 Mac 上遠端路徑可讀

  </Accordion>

  <Accordion title="錯過 macOS 權限提示">
    在相同使用者/工作階段內容的互動式 GUI 終端機中重新執行，並核准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    確認已授予執行 OpenClaw/`imsg` 的程序內容「完整磁碟存取權」+「自動化」權限。

  </Accordion>
</AccordionGroup>

## 設定參考指標

- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
- [Gateway 設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)

## 相關

- [通道概觀](/zh-TW/channels) — 所有支援的通道
- [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 公告與遷移摘要
- [從 BlueBubbles 轉移](/zh-TW/channels/imessage-from-bluebubbles) — 設定轉換表與逐步切換
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
