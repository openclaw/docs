---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送/接收
summary: 透過 imsg（經由 stdio 的 JSON-RPC）提供原生 iMessage 支援，並支援用於回覆、Tapback 回應、效果、附件與群組管理的私有 API 動作。當主機需求符合時，建議新的 OpenClaw iMessage 設定使用此方式。
title: iMessage
x-i18n:
    generated_at: "2026-05-13T02:51:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8125beab13c067e287f4cc041b65632989b8aaadce9b3719cc5e7312a0927aeb
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於 OpenClaw iMessage 部署，請在已登入的 macOS Messages 主機上使用 `imsg`。如果你的 Gateway 在 Linux 或 Windows 上執行，請將 `channels.imessage.cliPath` 指向會在 Mac 上執行 `imsg` 的 SSH 包裝器。

**Gateway 停機補接為選擇啟用。** 啟用後（`channels.imessage.catchup.enabled: true`），gateway 會在下次啟動時重播它離線期間（當機、重新啟動、Mac 睡眠）落入 `chat.db` 的傳入訊息。預設為停用 — 請參閱[在 gateway 停機後補接](#catching-up-after-gateway-downtime)。關閉 [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649)。
</Note>

<Warning>
BlueBubbles 支援已移除。請將 `channels.bluebubbles` 設定遷移到 `channels.imessage`；OpenClaw 只透過 `imsg` 支援 iMessage。短公告請先閱讀 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整遷移表請閱讀[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。
</Warning>

狀態：原生外部 CLI 整合。Gateway 會產生 `imsg rpc`，並透過 stdio 上的 JSON-RPC 通訊（沒有獨立 daemon/port）。進階動作需要 `imsg launch` 和成功的私有 API 探測。

<CardGroup cols={3}>
  <Card title="私有 API 動作" icon="wand-sparkles" href="#private-api-actions">
    回覆、tapback、效果、附件與群組管理。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    iMessage 私訊預設使用配對模式。
  </Card>
  <Card title="遠端 Mac" icon="terminal" href="#remote-mac-over-ssh">
    當 Gateway 不是在 Messages Mac 上執行時，請使用 SSH 包裝器。
  </Card>
  <Card title="設定參考" icon="settings" href="/zh-TW/gateway/config-channels#imessage">
    完整 iMessage 欄位參考。
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

        配對請求會在 1 小時後到期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="透過 SSH 使用遠端 Mac">
    OpenClaw 只需要與 stdio 相容的 `cliPath`，因此你可以將 `cliPath` 指向會透過 SSH 連到遠端 Mac 並執行 `imsg` 的包裝器指令碼。

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

    如果未設定 `remoteHost`，OpenClaw 會嘗試透過解析 SSH 包裝器指令碼自動偵測它。
    `remoteHost` 必須是 `host` 或 `user@host`（不可有空格或 SSH 選項）。
    OpenClaw 對 SCP 使用嚴格主機金鑰檢查，因此轉送主機金鑰必須已存在於 `~/.ssh/known_hosts`。
    附件路徑會依允許的根目錄（`attachmentRoots` / `remoteAttachmentRoots`）進行驗證。

  </Tab>
</Tabs>

## 需求與權限（macOS）

- Messages 必須已在執行 `imsg` 的 Mac 上登入。
- 執行 OpenClaw/`imsg` 的處理程序內容需要完整磁碟存取權（Messages 資料庫存取）。
- 需要自動化權限才能透過 Messages.app 傳送訊息。
- 對於進階動作（react / edit / unsend / 串接回覆 / 效果 / 群組操作），必須停用 System Integrity Protection — 請參閱下方[啟用 imsg 私有 API](#enabling-the-imsg-private-api)。基本文字與媒體傳送/接收不需要停用。

<Tip>
權限會依處理程序內容授予。如果 gateway 以無頭方式執行（LaunchAgent/SSH），請在相同內容中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## 啟用 imsg 私有 API

`imsg` 以兩種操作模式提供：

- **基本模式**（預設，不需要變更 SIP）：透過 `send` 傳出文字與媒體、傳入監看/歷史記錄、聊天清單。這是全新 `brew install steipete/tap/imsg` 加上上述標準 macOS 權限後開箱即可取得的功能。
- **私有 API 模式**：`imsg` 會將輔助 dylib 注入 `Messages.app`，以呼叫內部 `IMCore` 函式。這會解鎖 `react`、`edit`、`unsend`、`reply`（串接）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及輸入指示器和已讀回執。

若要使用此頻道頁面記錄的進階動作介面，你需要私有 API 模式。`imsg` README 對需求說得很明確：

> `read`、`typing`、`launch`、橋接支援的豐富傳送、訊息變更與聊天管理等進階功能為選擇啟用。它們需要停用 SIP，並將輔助 dylib 注入 `Messages.app`。啟用 SIP 時，`imsg launch` 會拒絕注入。

輔助注入技術使用 `imsg` 自己的 dylib 來存取 Messages 私有 API。OpenClaw iMessage 路徑中沒有第三方伺服器或 BlueBubbles 執行階段。

<Warning>
**停用 SIP 是真實的安全取捨。** SIP 是 macOS 防止執行修改過的系統程式碼的核心保護之一；在整個系統關閉它會開放額外攻擊面與副作用。特別是，**在 Apple Silicon Mac 上停用 SIP 也會停用在 Mac 上安裝與執行 iOS 應用程式的能力**。

請將此視為有意識的操作選擇，而不是預設值。如果你的威脅模型無法容忍 SIP 關閉，內建 iMessage 僅限於基本模式 — 只能傳送/接收文字與媒體，沒有 reactions / edit / unsend / effects / 群組操作。
</Warning>

### 設定

1. 在執行 Messages.app 的 Mac 上**安裝（或升級）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 輸出會報告 `bridge_version`、`rpc_methods` 和每個方法的 `selectors`，因此你可以在開始前查看目前建置支援哪些項目。

2. **停用 System Integrity Protection。** 這會因 macOS 版本而異，因為底層 Apple 需求取決於作業系統與硬體：
   - **macOS 10.13–10.15（Sierra–Catalina）：** 透過 Terminal 停用 Library Validation、重新啟動到 Recovery Mode、執行 `csrutil disable`、重新啟動。
   - **macOS 11+（Big Sur 及更新版本），Intel：** Recovery Mode（或 Internet Recovery）、`csrutil disable`、重新啟動。
   - **macOS 11+，Apple Silicon：** 使用電源按鈕啟動序列進入 Recovery；在近期 macOS 版本中，點選 Continue 時按住 **Left Shift** 鍵，然後執行 `csrutil disable`。虛擬機器設定有另一套流程 — 請先建立 VM 快照。
   - **macOS 26 / Tahoe：** library-validation 政策與 `imagent` 私有權利檢查已進一步收緊；`imsg` 可能需要更新的建置才能跟上。如果 macOS 主要版本升級後，`imsg launch` 注入或特定 `selectors` 開始回傳 false，請先查看 `imsg` 的發行說明，再假設 SIP 步驟已成功。

   執行 `imsg launch` 前，請依照 Apple 的 Recovery-mode 流程為你的 Mac 停用 SIP。

3. **注入輔助程式。** 在 SIP 已停用且 Messages.app 已登入時：

   ```bash
   imsg launch
   ```

   當 SIP 仍啟用時，`imsg launch` 會拒絕注入，因此這也可作為步驟 2 生效的確認。

4. **從 OpenClaw 驗證橋接：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 項目應報告 `works`，且 `imsg status --json | jq '.selectors'` 應顯示 `retractMessagePart: true`，以及你的 macOS 建置公開的任何 edit / typing / read selector。`actions.ts` 中的 OpenClaw Plugin 每方法閘控只會宣告底層 selector 為 `true` 的動作，因此你在代理工具清單中看到的動作介面，會反映此主機上的橋接實際能做什麼。

如果 `openclaw channels status --probe` 報告頻道為 `works`，但特定動作在派送時拋出「iMessage `<action>` requires the imsg private API bridge」，請再次執行 `imsg launch` — 輔助程式可能會脫離（Messages.app 重新啟動、OS 更新等），而快取的 `available: true` 狀態會持續宣告動作，直到下一次探測刷新。

### 當你無法停用 SIP 時

如果你的威脅模型無法接受停用 SIP：

- `imsg` 會退回基本模式 — 僅文字 + 媒體 + 接收。
- OpenClaw Plugin 仍會宣告文字/媒體傳送與傳入監控；它只是會從動作介面隱藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群組操作（依每方法能力閘控）。
- 你可以為 iMessage 工作負載執行一台獨立的非 Apple-Silicon Mac（或專用 bot Mac）並關閉 SIP，同時在主要裝置上保持 SIP 啟用。請參閱下方[專用 bot macOS 使用者（獨立 iMessage 身分）](#deployment-patterns)。

## 存取控制與路由

<Tabs>
  <Tab title="私訊政策">
    `channels.imessage.dmPolicy` 控制直接訊息：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    允許清單欄位：`channels.imessage.allowFrom`。

    允許清單項目必須識別傳送者：handle 或靜態傳送者存取群組（`accessGroup:<name>`）。聊天目標（例如 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*`）請使用 `channels.imessage.groupAllowFrom`；數字 `chat_id` 登錄鍵請使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群組政策 + 提及">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（設定時的預設）
    - `open`
    - `disabled`

    群組傳送者允許清單：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 項目也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。

    執行階段備援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會使用 `allowFrom`；當私訊與群組准入應不同時，請設定 `groupAllowFrom`。
    執行階段注意事項：如果完全缺少 `channels.imessage`，執行階段會退回 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    <Warning>
    群組路由有**兩個**允許清單閘門會連續執行，且兩者都必須通過：

    1. **傳送者 / 聊天目標允許清單**（`channels.imessage.groupAllowFrom`）— handle、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群組登錄**（`channels.imessage.groups`）— 使用 `groupPolicy: "allowlist"` 時，此閘門需要 `groups: { "*": { ... } }` 萬用項目（設定 `allowAll = true`），或 `groups` 底下明確的每個 `chat_id` 項目。

    如果閘門 2 裡沒有任何內容，每則群組訊息都會被丟棄。Plugin 會在預設記錄層級發出兩個 `warn` 層級訊號：

    - 啟動時每個帳號一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 執行階段每個 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    私訊會繼續運作，因為它們走不同的程式碼路徑。

    在 `groupPolicy: "allowlist"` 下保持群組流通的最低設定：

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

    如果這些 `warn` 行出現在 Gateway 日誌中，代表第 2 道閘門正在丟棄訊息——請加入 `groups` 區塊。
    </Warning>

    群組的提及閘控：

    - iMessage 沒有原生提及中繼資料
    - 提及偵測使用正則表達式模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 若未設定任何模式，提及閘控就無法強制執行

    來自已授權寄件者的控制命令可以在群組中略過提及閘控。

    每個群組的 `systemPrompt`：

    `channels.imessage.groups.*` 下的每個項目都接受選用的 `systemPrompt` 字串。此值會在處理該群組訊息的每一輪中注入 agent 的系統提示。解析方式與 `channels.whatsapp.groups` 使用的每群組提示解析方式一致：

    1. **群組專屬系統提示**（`groups["<chat_id>"].systemPrompt`）：當 map 中存在特定群組項目，**且**其 `systemPrompt` key 已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會對該群組套用任何系統提示。
    2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於 map 中，或其存在但未定義 `systemPrompt` key 時使用。

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

    每群組提示只會套用到群組訊息——此 channel 中的直接訊息不受影響。

  </Tab>

  <Tab title="工作階段與確定性回覆">
    - DM 使用直接路由；群組使用群組路由。
    - 使用預設 `session.dmScope=main` 時，iMessage DM 會收斂到 agent 主工作階段。
    - 群組工作階段彼此隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用原始 channel/target 中繼資料路由回 iMessage。

    類群組討論串行為：

    某些多參與者 iMessage 討論串可能會以 `is_group=false` 抵達。
    如果該 `chat_id` 已在 `channels.imessage.groups` 下明確設定，OpenClaw 會將其視為群組流量（群組閘控 + 群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

舊版 iMessage 聊天也可以繫結到 ACP 工作階段。

快速操作流程：

- 在 DM 或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 同一個 iMessage 對話中的後續訊息會路由到產生的 ACP 工作階段。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

可透過頂層 `bindings[]` 項目支援已設定的持久繫結，其中包含 `type: "acp"` 和 `match.channel: "imessage"`。

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

請參閱 [ACP Agents](/zh-TW/tools/acp-agents) 了解共用 ACP 繫結行為。

## 部署模式

<AccordionGroup>
  <Accordion title="專用 bot macOS 使用者（獨立的 iMessage 身分）">
    使用專用 Apple ID 和 macOS 使用者，讓 bot 流量與你的個人 Messages 設定檔隔離。

    典型流程：

    1. 建立/登入專用 macOS 使用者。
    2. 在該使用者中以 bot Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH wrapper，讓 OpenClaw 可以在該使用者情境中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向該使用者設定檔。

    第一次執行可能需要在該 bot 使用者工作階段中核准 GUI 權限（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="透過 Tailscale 連線的遠端 Mac（範例）">
    常見拓撲：

    - Gateway 在 Linux/VM 上執行
    - iMessage + `imsg` 在 tailnet 中的 Mac 上執行
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

    使用 SSH 金鑰，讓 SSH 和 SCP 都可非互動式執行。
    請先確認主機金鑰已受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），讓 `known_hosts` 已填入。

  </Accordion>

  <Accordion title="多帳戶模式">
    iMessage 支援 `channels.imessage.accounts` 下的每帳戶設定。

    每個帳戶都可以覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史記錄設定，以及附件根目錄 allowlist 等欄位。

  </Accordion>
</AccordionGroup>

## 媒體、分塊與傳送目標

<AccordionGroup>
  <Accordion title="附件與媒體">
    - 傳入附件擷取**預設關閉**——設定 `channels.imessage.includeAttachments: true`，即可將照片、語音備忘錄、影片和其他附件轉送給 agent。停用時，只有附件的 iMessage 會在抵達 agent 前被丟棄，而且可能完全不產生 `Inbound message` 日誌行。
    - 設定 `remoteHost` 時，可以透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 預設根目錄模式：`/Users/*/Library/Messages/Attachments`
    - SCP 使用嚴格主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 傳出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="傳出分塊">
    - 文字分塊限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分塊模式：`channels.imessage.chunkMode`
      - `length`（預設）
      - `newline`（優先按段落切分）

  </Accordion>

  <Accordion title="位址格式">
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

當 `imsg launch` 正在執行，且 `openclaw channels status --probe` 回報 `privateApi.available: true` 時，message tool 除了一般文字傳送外，也可以使用 iMessage 原生動作。

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
  <Accordion title="可用動作">
    - **react**：新增/移除 iMessage tapback（`messageId`、`emoji`、`remove`）。支援的 tapback 對應到 love、like、dislike、laugh、emphasize 和 question。
    - **reply**：向既有訊息傳送討論串回覆（`messageId`、`text` 或 `message`，加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：使用 iMessage 效果傳送文字（`text` 或 `message`、`effect` 或 `effectId`）。
    - **edit**：在支援的 macOS/私有 API 版本上編輯已傳送訊息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在支援的 macOS/私有 API 版本上收回已傳送訊息（`messageId`）。
    - **upload-file**：傳送媒體/檔案（base64 格式的 `buffer`，或已水合的 `media`/`path`/`filePath`、`filename`，選用 `asVoice`）。舊版別名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：在目前目標是群組對話時管理群組聊天。

  </Accordion>

  <Accordion title="訊息 ID">
    傳入 iMessage 情境會在可用時同時包含短 `MessageSid` 值與完整訊息 GUID。短 ID 只限於近期的記憶體內回覆快取範圍，並且使用前會檢查是否屬於目前聊天。如果短 ID 已過期或屬於另一個聊天，請以完整 `MessageSidFull` 重試。

  </Accordion>

  <Accordion title="能力偵測">
    OpenClaw 只有在快取的探測狀態表示橋接器不可用時，才會隱藏私有 API 動作。如果狀態未知，動作會維持可見並延遲觸發 dispatch probe，讓第一個動作可以在 `imsg launch` 後成功，而不需要另外手動重新整理狀態。

  </Accordion>

  <Accordion title="已讀回條與輸入中狀態">
    私有 API 橋接器啟動時，接受的傳入聊天會在 dispatch 前標記為已讀，並在 agent 產生內容時向寄件者顯示輸入中泡泡。使用以下設定停用已讀標記：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早於每方法能力清單的舊版 `imsg` 建置會靜默關閉輸入中/已讀閘控；OpenClaw 會在每次重新啟動時記錄一次性警告，讓缺少回條的原因可追溯。

  </Accordion>

  <Accordion title="傳入 tapback">
    OpenClaw 會訂閱 iMessage tapback，並將接受的反應路由為系統事件，而不是一般訊息文字，因此使用者的 tapback 不會觸發普通回覆迴圈。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（預設）：只有在使用者對 bot 撰寫的訊息做出反應時通知。
    - `"all"`：針對來自已授權寄件者的所有傳入 tapback 發出通知。
    - `"off"`：忽略傳入 tapback。

    每帳戶覆寫使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>
</AccordionGroup>

## 設定寫入

iMessage 預設允許由 channel 發起的設定寫入（當 `commands.config: true` 時供 `/config set|unset` 使用）。

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

## 合併分割傳送的 DM（同一次撰寫中的命令 + URL）

當使用者同時輸入命令與 URL，例如 `Dump https://example.com/article`，Apple 的 Messages app 會將傳送拆成**兩筆獨立的 `chat.db` 列**：

1. 文字訊息（`"Dump"`）。
2. 帶有 OG 預覽圖片作為附件的 URL 預覽泡泡（`"https://..."`）。

在多數設定中，這兩列會相隔約 0.8-2.0 秒抵達 OpenClaw。若沒有合併，代理會在第 1 回合只收到命令並回覆（通常是「傳 URL 給我」），直到第 2 回合才看到 URL，而此時命令情境已經遺失。這是 Apple 的傳送管線造成的，不是 OpenClaw 或 `imsg` 引入的行為。

`channels.imessage.coalesceSameSenderDms` 會讓 DM 選擇加入，把連續的同一寄件者列合併成單一代理回合。群組聊天會繼續逐訊息分派，以保留多使用者回合結構。

<Tabs>
  <Tab title="何時啟用">
    在下列情況啟用：

    - 你提供的 Skills 預期 `command + payload` 會在同一則訊息中（dump、paste、save、queue 等）。
    - 你的使用者會把 URL、圖片或長內容與命令一起貼上。
    - 你可以接受增加的 DM 回合延遲（見下方）。

    在下列情況保持停用：

    - 你需要單字 DM 觸發器的最低命令延遲。
    - 你的所有流程都是沒有承載後續內容的一次性命令。

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

    啟用此旗標且未明確設定 `messages.inbound.byChannel.imessage` 時，防抖視窗會擴大到 **2500 ms**（舊版預設值為 0 ms，也就是不防抖）。需要較寬的視窗，是因為 Apple 的分割傳送節奏為 0.8-2.0 秒，不適合更緊的預設值。

    若要自行調整視窗：

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
    - **DM 訊息會增加延遲。** 啟用此旗標時，每則 DM（包含獨立控制命令與單一文字後續訊息）都會等待最多一個防抖視窗再分派，以防承載列即將到來。群組聊天訊息會維持即時分派。
    - **合併輸出有界限。** 合併文字上限為 4000 個字元，並帶有明確的 `…[truncated]` 標記；附件上限為 20；來源項目上限為 10（超過後保留第一筆加最新幾筆）。每個來源 GUID 都會在 `coalescedMessageGuids` 中追蹤，以供下游遙測使用。
    - **僅限 DM。** 群組聊天會落入逐訊息分派，因此多人正在輸入時，機器人仍能保持回應。
    - **選擇加入、每個 channel 獨立設定。** 其他 channel（Telegram、WhatsApp、Slack、…）不受影響。設定了 `channels.bluebubbles.coalesceSameSenderDms` 的舊版 BlueBubbles 設定，應將該值遷移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 情境與代理看到的內容

| 使用者撰寫內容                                                     | `chat.db` 產生的結果  | 關閉旗標（預設）                        | 開啟旗標 + 2500 ms 視窗                                                |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                             | 2 列，相隔約 1 秒     | 兩個代理回合：「Dump」單獨一則，接著是 URL | 一個回合：合併文字 `Dump https://example.com`                          |
| `Save this 📎image.jpg caption`（附件 + 文字）                     | 2 列                  | 兩個回合（附件在合併時被丟棄）          | 一個回合：保留文字 + 圖片                                              |
| `/status`（獨立命令）                                              | 1 列                  | 即時分派                                | **最多等待一個視窗，然後分派**                                         |
| 單獨貼上的 URL                                                     | 1 列                  | 即時分派                                | 即時分派（bucket 中只有一個項目）                                      |
| 文字 + URL 分成兩則刻意獨立的訊息傳送，相隔數分鐘                 | 2 列，超出視窗        | 兩個回合                                | 兩個回合（視窗在其間到期）                                             |
| 快速大量傳送（視窗內 >10 則小型 DM）                              | N 列                  | N 個回合                                | 一個回合，有界限的輸出（第一筆 + 最新幾筆，套用文字/附件上限）        |
| 兩個人在群組聊天中輸入                                             | 來自 M 位寄件者的 N 列 | M+ 個回合（每個寄件者 bucket 一個）     | M+ 個回合 — 群組聊天不會被合併                                        |

## Gateway 停機後補抓

當 Gateway 離線（當機、重新啟動、Mac 睡眠、機器關機）時，`imsg watch` 會在 Gateway 恢復後，從目前的 `chat.db` 狀態繼續；預設情況下，間隔期間抵達的任何內容都不會被看見。補抓會在下次啟動時重播這些訊息，讓代理不會默默錯過傳入流量。

補抓預設為**停用**。請依 channel 啟用：

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

每次 `monitorIMessageProvider` 啟動時執行一次，順序為 `imsg launch` 就緒 → `watch.subscribe` → `performIMessageCatchup` → 即時分派迴圈。補抓本身會透過 `imsg watch` 使用的同一個 JSON-RPC 用戶端，對 `chats.list` + 每個聊天的 `messages.history` 執行操作。補抓過程中抵達的任何內容都會照常經由即時分派流程；既有的傳入去重複快取會吸收與重播列的任何重疊。

每個重播列都會送入即時分派路徑（`evaluateIMessageInbound` + `dispatchInboundMessage`），因此 allowlist、群組政策、防抖器、echo 快取與讀取回條，在重播與即時訊息上的行為完全相同。

### 游標與重試語意

補抓會在 `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` 保留每個帳號的游標（OpenClaw 狀態目錄預設為 `~/.openclaw`，可用 `OPENCLAW_STATE_DIR` 覆寫）：

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- 游標會在每次成功分派時前進；當某列的分派拋出錯誤時會保持不動，下一次啟動會從保留的游標重試同一列。
- 對同一個 `guid` 連續拋出 `maxFailureRetries` 次後，補抓會記錄 `warn`，並強制把游標前進到卡住的訊息之後，讓後續啟動能繼續進行。
- 已放棄的 guid 在後續執行時一看到就會跳過（不嘗試分派），並在執行摘要中計入 `skippedGivenUp`。

### 操作者可見訊號

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行代表單次啟動沒有清空完整積壓。如果你的中斷經常超過預設的 50 列處理量，請提高 `perRunLimit`（最高 500）。

### 何時保持關閉

- Gateway 持續執行，並有 watchdog 自動重新啟動，且間隔永遠小於幾秒；維持預設關閉即可。
- DM 流量很低，而且漏掉訊息不會改變代理行為；第一次啟用時，`firstRunLookbackMinutes` 初始視窗可能會分派令人意外的舊情境。

當你開啟補抓時，沒有游標的第一次啟動只會回看 `firstRunLookbackMinutes`（預設 30 分鐘），而不是完整的 `maxAgeMinutes` 視窗；這可避免重播一長串啟用前的訊息歷史。

## 疑難排解

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支援 RPC">
    驗證二進位檔與 RPC 支援：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果 probe 回報不支援 RPC，請更新 `imsg`。如果私有 API 動作不可用，請在已登入的 macOS 使用者工作階段中執行 `imsg launch`，然後再次 probe。如果 Gateway 不是在 macOS 上執行，請使用上方的透過 SSH 使用遠端 Mac 設定，而不是預設的本機 `imsg` 路徑。

  </Accordion>

  <Accordion title="Gateway 未在 macOS 上執行">
    預設的 `cliPath: "imsg"` 必須在登入 Messages 的 Mac 上執行。在 Linux 或 Windows 上，請將 `channels.imessage.cliPath` 設為包裝指令碼，讓它 SSH 到該 Mac 並執行 `imsg "$@"`。

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
    - `channels.imessage.groups` allowlist 行為
    - 提及模式設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="遠端附件失敗">
    檢查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 來自 Gateway 主機的 SSH/SCP 金鑰驗證
    - Gateway 主機上的 `~/.ssh/known_hosts` 中存在主機金鑰
    - 執行 Messages 的 Mac 上遠端路徑可讀取

  </Accordion>

  <Accordion title="錯過 macOS 權限提示">
    在相同使用者/工作階段情境中的互動式 GUI 終端機重新執行並核准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    確認執行 OpenClaw/`imsg` 的程序情境已授予完整磁碟存取權 + 自動化權限。

  </Accordion>
</AccordionGroup>

## 設定參考指標

- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
- [Gateway 設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)

## 相關

- [Channels 概觀](/zh-TW/channels) — 所有支援的 channel
- [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 公告與遷移摘要
- [從 BlueBubbles 轉移](/zh-TW/channels/imessage-from-bluebubbles) — 設定轉換表與逐步切換
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [Channel Routing](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
