---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送/接收
summary: 透過 imsg（經由 stdio 的 JSON-RPC）原生支援 iMessage，並提供用於回覆、tapbacks、效果、投票、附件與群組管理的私有 API 動作。當主機需求符合時，這是新 OpenClaw iMessage 設定的首選。
title: iMessage
x-i18n:
    generated_at: "2026-07-01T10:56:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於 OpenClaw iMessage 部署，請在已登入的 macOS Messages 主機上使用 `imsg`。如果你的閘道在 Linux 或 Windows 上執行，請將 `channels.imessage.cliPath` 指向一個 SSH 包裝器，讓它在 Mac 上執行 `imsg`。

**傳入復原是自動的。** 在橋接器或閘道重新啟動後，iMessage 會重播停機期間錯過的訊息，並抑制 Apple 在 Push 復原後可能刷出的過時「積壓炸彈」，同時去重以確保沒有任何內容被派送兩次。不需要設定即可啟用 — 請參閱[橋接器或閘道重新啟動後的傳入復原](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支援已移除。請將 `channels.bluebubbles` 設定遷移至 `channels.imessage`；OpenClaw 僅透過 `imsg` 支援 iMessage。簡短公告請先閱讀 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整遷移表則請參閱[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。
</Warning>

狀態：原生外部命令列介面整合。閘道會產生 `imsg rpc`，並透過 stdio 上的 JSON-RPC 通訊（沒有獨立的常駐程式/連接埠）。進階動作需要 `imsg launch` 以及成功的私有 API 探測。

<CardGroup cols={3}>
  <Card title="私有 API 動作" icon="wand-sparkles" href="#private-api-actions">
    回覆、tapbacks、效果、投票、附件與群組管理。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    iMessage 私訊預設為配對模式。
  </Card>
  <Card title="遠端 Mac" icon="terminal" href="#remote-mac-over-ssh">
    當閘道不是在 Messages Mac 上執行時，請使用 SSH 包裝器。
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

      <Step title="啟動閘道">

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

  <Tab title="透過 SSH 使用遠端 Mac">
    OpenClaw 只需要相容 stdio 的 `cliPath`，因此你可以將 `cliPath` 指向一個包裝器指令碼，讓它透過 SSH 連到遠端 Mac 並執行 `imsg`。

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

    如果未設定 `remoteHost`，OpenClaw 會嘗試透過解析 SSH 包裝器指令碼自動偵測。
    `remoteHost` 必須是 `host` 或 `user@host`（不得包含空格或 SSH 選項）。
    OpenClaw 對 SCP 使用嚴格主機金鑰檢查，因此中繼主機金鑰必須已存在於 `~/.ssh/known_hosts`。
    附件路徑會根據允許的根目錄（`attachmentRoots` / `remoteAttachmentRoots`）進行驗證。

<Warning>
任何放在 `imsg` 前面的 `cliPath` 包裝器或 SSH 代理，皆必須像透明的 stdio 管線一樣處理長時間執行的 JSON-RPC。OpenClaw 會在該頻道的整個生命週期內，透過包裝器的 stdin/stdout 交換小型、以換行分隔的 JSON-RPC 訊息：

- **只要有位元組可用**，就立即轉送每個 stdin 區塊/行 — 不要等到 EOF。
- 迅速以反方向轉送每個 stdout 區塊/行。
- 保留換行。
- 避免固定大小的阻塞讀取（`read(4096)`、`cat | buffer`、預設 shell `read`），這些可能讓小型框架飢餓。
- 將 stderr 與 JSON-RPC stdout 串流分開。

如果包裝器會緩衝 stdin，直到大型區塊填滿，會產生看似 iMessage 中斷的症狀 — `imsg rpc timeout (chats.list)` 或反覆的頻道重新啟動 — 即使 `imsg rpc` 本身是健康的。上方的 `ssh -T host imsg "$@"` 是安全的，因為它會轉送 OpenClaw 的 `cliPath` 引數，例如 `rpc` 和 `--db`。像 `ssh host imsg | grep -v '^DEBUG'` 這樣的管線則不安全 — 行緩衝工具仍可能保留框架；若必須過濾，請在每個階段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 需求與權限（macOS）

- Messages 必須在執行 `imsg` 的 Mac 上登入。
- 執行 OpenClaw/`imsg` 的程序內容需要完整磁碟存取權（Messages DB 存取）。
- 需要自動化權限，才能透過 Messages.app 傳送訊息。
- 進階動作（react / edit / unsend / threaded reply / effects / polls / group ops）需要停用系統完整性保護 — 請參閱下方[啟用 imsg 私有 API](#enabling-the-imsg-private-api)。基本文字與媒體收發不需要停用。

<Tip>
權限會依程序內容授予。如果閘道以無頭方式執行（LaunchAgent/SSH），請在同一內容中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH 包裝器傳送失敗並出現 AppleEvents -1743">
  遠端 SSH 設定可能可以讀取聊天、通過 `channels status --probe`，並處理傳入訊息，但傳出傳送仍會因 AppleEvents 授權錯誤而失敗：

```text
Not authorized to send Apple events to Messages. (-1743)
```

檢查已登入 Mac 使用者的 TCC 資料庫，或「系統設定」>「隱私權與安全性」>「自動化」。如果自動化項目記錄的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本機 shell 程序，macOS 可能不會針對該 SSH 伺服器端用戶端顯示可用的 Messages 切換開關：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在這種狀態下，重複執行 `tccutil reset AppleEvents` 或透過同一個 SSH 包裝器重新執行 `imsg send` 可能仍會失敗，因為需要 Messages 自動化權限的程序內容是 SSH 包裝器，而不是使用者介面可授權的 app。

請改用其中一種受支援的 `imsg` 程序內容：

- 在已登入 Messages 使用者的本機工作階段中執行閘道，或至少執行 `imsg` 橋接器。
- 從同一工作階段授予完整磁碟存取權與自動化權限後，使用該使用者的 LaunchAgent 啟動閘道。
- 如果你保留雙使用者 SSH 拓撲，請在啟用頻道前，確認真實的傳出 `imsg send` 能透過完全相同的包裝器成功。如果無法授予自動化權限，請改為重新設定成單一使用者 `imsg` 設定，而不是依賴 SSH 包裝器傳送。

</Accordion>

## 啟用 imsg 私有 API

`imsg` 提供兩種運作模式：

- **基本模式**（預設，不需要變更 SIP）：透過 `send` 傳出文字與媒體、傳入監看/歷史、聊天清單。這是全新 `brew install steipete/tap/imsg` 加上上述標準 macOS 權限後，開箱即可取得的模式。
- **私有 API 模式**：`imsg` 會將輔助 dylib 注入 `Messages.app`，以呼叫內部 `IMCore` 函式。這會解鎖 `react`、`edit`、`unsend`、`reply`（串接回覆）、`sendWithEffect`、`poll` 和 `poll-vote`（原生 Messages 投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及輸入指示器和已讀回條。

若要使用此頻道頁面文件化的進階動作介面，你需要私有 API 模式。`imsg` README 對此需求說明得很明確：

> `read`、`typing`、`launch`、橋接器支援的豐富傳送、訊息變更與聊天管理等進階功能是選用的。它們需要停用 SIP，並將輔助 dylib 注入 `Messages.app`。啟用 SIP 時，`imsg launch` 會拒絕注入。

輔助注入技術使用 `imsg` 自己的 dylib 來存取 Messages 私有 API。在 OpenClaw iMessage 路徑中，沒有第三方伺服器或 BlueBubbles 執行階段。

<Warning>
**停用 SIP 是實際的安全性取捨。** SIP 是 macOS 防止執行修改過系統程式碼的核心保護之一；將其在整個系統關閉，會增加額外攻擊面與副作用。特別是，**在 Apple Silicon Mac 上停用 SIP，也會停用在 Mac 上安裝與執行 iOS app 的能力**。

請將此視為明確的營運選擇，而不是預設值。如果你的威脅模型無法容忍 SIP 關閉，內建 iMessage 將僅限於基本模式 — 只能收發文字和媒體，沒有反應 / 編輯 / 收回傳送 / 效果 / 群組操作。
</Warning>

### 設定

1. **在執行 Messages.app 的 Mac 上安裝（或升級）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 輸出會回報 `bridge_version`、`rpc_methods`，以及每個方法的 `selectors`，讓你在開始前查看目前建置版本支援哪些功能。

2. **停用系統完整性保護，並且（在現代 macOS 上）停用程式庫驗證。** 將非 Apple 輔助 dylib 注入 Apple 簽署的 `Messages.app`，需要關閉 SIP **且** 放寬程式庫驗證。復原模式 SIP 步驟會依 macOS 版本而異：
   - **macOS 10.13-10.15（Sierra-Catalina）：** 透過終端機停用程式庫驗證，重新開機進入復原模式，執行 `csrutil disable`，再重新啟動。
   - **macOS 11+（Big Sur 與更新版本），Intel：** 復原模式（或網路復原），執行 `csrutil disable`，再重新啟動。
   - **macOS 11+，Apple Silicon：** 使用電源按鈕啟動流程進入復原；在近期 macOS 版本中，點擊「繼續」時按住 **Left Shift** 鍵，然後執行 `csrutil disable`。虛擬機器設定有不同流程，因此請先建立 VM 快照。

   **在 macOS 11 與更新版本上，單獨執行 `csrutil disable` 通常不夠。** Apple 仍會將 `Messages.app` 視為平台二進位檔來強制執行程式庫驗證，因此即使 SIP 已關閉，臨時簽署的輔助程式也會被拒絕（`Library Validation failed: ... platform binary, but mapped file is not`）。停用 SIP 後，也請停用程式庫驗證並重新開機：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已在 26.5.1 驗證：** 關閉 SIP **加上** 上方的 `DisableLibraryValidation` 命令，足以在 26.0 到 26.5.x 注入輔助程式。**不需要 boot-args。** 該 plist 是決定性因素，也是 Tahoe 上注入失敗時最常遺漏的步驟：
   - **有 plist：** `imsg launch` 會注入，且 `imsg status` 會回報 `advanced_features: true`。
   - **沒有 plist（即使 SIP 已關閉）：** `imsg launch` 會失敗並顯示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 在載入時拒絕臨時輔助程式，因此橋接器永遠不會就緒，啟動也會逾時。這個逾時是大多數人在 Tahoe 上遇到的症狀，而修正方式是上方的 plist，不是更激烈的做法。

   這已在 macOS 26.5.1（Apple Silicon）上透過受控的前後對照確認：有 plist 時，dylib 會映射進 `Messages.app`，橋接器會啟動；移除 plist 並重新開機後，`imsg launch` 會產生上述逾時失敗，且 dylib 不會被映射。

   如果 macOS 升級後，`imsg launch` 注入或特定 `selectors` 開始回傳 false，通常就是這個門檻造成的。在假設 SIP 步驟本身失敗前，請先檢查你的 SIP 和程式庫驗證狀態。如果這些設定正確，但橋接仍無法注入，請收集 `imsg status --json` 加上 `imsg launch` 輸出，並回報給 `imsg` 專案，而不是削弱更多全系統安全控制。

   請依照 Apple 針對你的 Mac 提供的復原模式流程，在執行 `imsg launch` 前停用 SIP。

3. **注入輔助程式。** 在 SIP 已停用且 Messages.app 已登入的狀態下：

   ```bash
   imsg launch
   ```

   當 SIP 仍啟用時，`imsg launch` 會拒絕注入，因此這也可作為步驟 2 已生效的確認。

4. **從 OpenClaw 驗證橋接：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 項目應回報 `works`，而 `imsg status --json | jq '{rpc_methods, selectors}'` 應顯示你的 macOS 建置版本所公開的能力。建立投票需要 `selectors.pollPayloadMessage`；投票需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法兩者。OpenClaw 外掛只會公布快取探測支援的動作，而空快取會保持樂觀，並在第一次派送時探測。

如果 `openclaw channels status --probe` 回報頻道為 `works`，但特定動作在派送時拋出「iMessage `<action>` requires the imsg private API bridge」，請再次執行 `imsg launch`，輔助程式可能會失效（Messages.app 重新啟動、作業系統更新等），而快取的 `available: true` 狀態會持續公布動作，直到下一次探測刷新為止。

### 無法停用 SIP 時

如果停用 SIP 不符合你的威脅模型：

- `imsg` 會退回基本模式，也就是僅支援文字、媒體和接收。
- OpenClaw 外掛仍會公布文字/媒體傳送與入站監控；它只會從動作介面隱藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群組操作（依照逐方法能力門檻）。
- 你可以使用另一台停用 SIP 的非 Apple Silicon Mac（或專用 bot Mac）處理 iMessage 工作負載，同時讓主要裝置保持啟用 SIP。請參閱下方的[專用 bot macOS 使用者（獨立 iMessage 身分）](#deployment-patterns)。

## 存取控制與路由

<Tabs>
  <Tab title="DM 政策">
    `channels.imessage.dmPolicy` 控制直接訊息：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    允許清單欄位：`channels.imessage.allowFrom`。

    允許清單項目必須識別傳送者：handle 或靜態傳送者存取群組（`accessGroup:<name>`）。針對 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目標，請使用 `channels.imessage.groupAllowFrom`；針對數值 `chat_id` 登錄鍵，請使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群組政策 + 提及">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（設定時的預設）
    - `open`
    - `disabled`

    群組傳送者允許清單：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 項目也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。

    執行階段備援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會使用 `allowFrom`；當 DM 和群組准入應不同時，請設定 `groupAllowFrom`。
    執行階段注意事項：如果完全缺少 `channels.imessage`，執行階段會退回 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    <Warning>
    群組路由有**兩個**連續執行的允許清單門檻，而且兩者都必須通過：

    1. **傳送者 / 聊天目標允許清單**（`channels.imessage.groupAllowFrom`）：handle、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群組登錄**（`channels.imessage.groups`）：使用 `groupPolicy: "allowlist"` 時，這個門檻需要 `groups: { "*": { ... } }` 萬用字元項目（設定 `allowAll = true`），或 `groups` 底下明確的逐 `chat_id` 項目。

    如果門檻 2 沒有任何內容，每則群組訊息都會被丟棄。外掛會在預設記錄層級發出兩個 `warn` 層級訊號：

    - 啟動時每個帳號一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 執行階段每個 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    DM 會繼續運作，因為它們採用不同的程式碼路徑。

    在 `groupPolicy: "allowlist"` 下維持群組流通的最小設定：

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

    如果這些 `warn` 行出現在閘道記錄中，表示門檻 2 正在丟棄訊息，請加入 `groups` 區塊。
    </Warning>

    群組的提及門檻：

    - iMessage 沒有原生提及中繼資料
    - 提及偵測使用 regex 模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 未設定模式時，無法強制執行提及門檻

    來自已授權傳送者的控制命令可以在群組中略過提及門檻。

    逐群組 `systemPrompt`：

    `channels.imessage.groups.*` 底下的每個項目都接受選用的 `systemPrompt` 字串。此值會在每次處理該群組訊息的回合中注入代理的系統提示。解析方式與 `channels.whatsapp.groups` 使用的逐群組提示解析相同：

    1. **群組專屬系統提示**（`groups["<chat_id>"].systemPrompt`）：當對應的群組項目存在於 map 中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會對該群組套用系統提示。
    2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於 map 中，或存在但未定義 `systemPrompt` 鍵時使用。

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

    逐群組提示只會套用到群組訊息，這個頻道中的直接訊息不受影響。

  </Tab>

  <Tab title="工作階段與確定性回覆">
    - DM 使用直接路由；群組使用群組路由。
    - 使用預設 `session.dmScope=main` 時，iMessage DM 會合併到代理主工作階段。
    - 群組工作階段會隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用來源頻道/目標中繼資料路由回 iMessage。

    類群組對話串行為：

    某些多參與者 iMessage 對話串可能會以 `is_group=false` 抵達。
    如果該 `chat_id` 已在 `channels.imessage.groups` 底下明確設定，OpenClaw 會將其視為群組流量（群組門檻 + 群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

舊版 iMessage 聊天也可以繫結到 ACP 工作階段。

快速操作員流程：

- 在 DM 或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 同一個 iMessage 對話中的後續訊息會路由到產生的 ACP 工作階段。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

已設定的持久繫結透過頂層 `bindings[]` 項目支援，並使用 `type: "acp"` 和 `match.channel: "imessage"`。

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

請參閱 [ACP 代理](/zh-TW/tools/acp-agents) 了解共用 ACP 繫結行為。

## 部署模式

<AccordionGroup>
  <Accordion title="專用 bot macOS 使用者（獨立 iMessage 身分）">
    使用專用 Apple ID 和 macOS 使用者，讓 bot 流量與你的個人 Messages 設定檔隔離。

    典型流程：

    1. 建立/登入專用 macOS 使用者。
    2. 在該使用者中使用 bot Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH 包裝器，讓 OpenClaw 能在該使用者內容中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向該使用者設定檔。

    第一次執行可能需要在該 bot 使用者工作階段中核准 GUI 權限（自動化 + 完整磁碟存取）。

  </Accordion>

  <Accordion title="透過 Tailscale 的遠端 Mac（範例）">
    常見拓撲：

    - 閘道在 Linux/VM 上執行
    - iMessage + `imsg` 在你的 tailnet 中的 Mac 上執行
    - `cliPath` 包裝器使用 SSH 執行 `imsg`
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
    請先確認主機金鑰受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），讓 `known_hosts` 已填入。

  </Accordion>

  <Accordion title="多帳號模式">
    iMessage 支援 `channels.imessage.accounts` 底下的逐帳號設定。

    每個帳號都可以覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史設定和附件根目錄允許清單等欄位。

  </Accordion>

  <Accordion title="直接訊息歷史">
    設定 `channels.imessage.dmHistoryLimit`，用該對話最近解碼的 `imsg` 歷史來初始化新的直接訊息工作階段。使用 `channels.imessage.dms["<sender>"].historyLimit` 進行逐傳送者覆寫，包括設為 `0` 以停用某個傳送者的歷史。

    iMessage DM 歷史會依需求從 `imsg` 擷取。未設定 `dmHistoryLimit` 會停用全域 DM 歷史初始化，但正值的逐傳送者 `channels.imessage.dms["<sender>"].historyLimit` 仍會為該傳送者啟用初始化。

  </Accordion>
</AccordionGroup>

## 媒體、分塊與傳送目標

<AccordionGroup>
  <Accordion title="Attachments and media">
    - 傳入附件擷取預設為**關閉** — 設定 `channels.imessage.includeAttachments: true`，即可將照片、語音備忘錄、影片與其他附件轉送給代理。停用時，只有附件的 iMessage 會在到達代理前被捨棄，而且可能完全不產生 `Inbound message` 記錄行。
    - 設定 `remoteHost` 時，可透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 預設根目錄模式：`/Users/*/Library/Messages/Attachments`
    - SCP 使用嚴格主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 傳出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="Outbound chunking">
    - 文字分塊限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分塊模式：`channels.imessage.chunkMode`
      - `length`（預設）
      - `newline`（優先依段落分割）

  </Accordion>

  <Accordion title="Addressing formats">
    建議使用明確目標：

    - `chat_id:123`（建議用於穩定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支援控制代碼目標：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 私有 API 動作

當 `imsg launch` 正在執行，且 `openclaw channels status --probe` 回報 `privateApi.available: true` 時，訊息工具除了正常傳送文字外，也可以使用 iMessage 原生動作。

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**：新增/移除 iMessage 點按回應（`messageId`、`emoji`、`remove`）。支援的點按回應會對應到愛心、讚、倒讚、笑、強調與問號。
    - **reply**：傳送對既有訊息的串接回覆（`messageId`、`text` 或 `message`，加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：使用 iMessage 效果傳送文字（`text` 或 `message`、`effect` 或 `effectId`）。
    - **edit**：在支援的 macOS/私有 API 版本上編輯已傳送的訊息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在支援的 macOS/私有 API 版本上收回已傳送的訊息（`messageId`）。
    - **upload-file**：傳送媒體/檔案（base64 格式的 `buffer`，或已補齊的 `media`/`path`/`filePath`、`filename`，選用 `asVoice`）。舊版別名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：當目前目標是群組對話時管理群組聊天。
    - **poll**：建立原生 Apple Messages 投票（`pollQuestion`、重複 2 到 12 次的 `pollOption`，加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。iOS/iPadOS/macOS 26+ 的收件者會以原生方式查看並投票；較舊的作業系統版本會收到「Sent a poll」文字後備。需要 `selectors.pollPayloadMessage`。
    - **poll-vote**：對既有投票投票（`pollId` 或 `messageId`，加上 `pollOptionIndex`、`pollOptionId` 或 `pollOptionText` 其中且僅其中一個）。需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。

    已接受的傳入投票會呈現給代理，包含問題、編號選項標籤、票數，以及 `poll-vote` 所需的投票訊息 ID。

  </Accordion>

  <Accordion title="Message IDs">
    傳入 iMessage 脈絡會在可用時同時包含短 `MessageSid` 值與完整訊息 GUID。短 ID 的範圍限定於近期、由 SQLite 支援的回覆快取，且使用前會依目前聊天檢查。如果短 ID 已過期或屬於另一個聊天，請改用完整的 `MessageSidFull` 重試。

  </Accordion>

  <Accordion title="Capability detection">
    只有在快取的探測狀態表示橋接器不可用時，OpenClaw 才會隱藏私有 API 動作。如果狀態未知，動作仍會保持可見，並在派送時延遲探測，讓第一個動作可在 `imsg launch` 後成功執行，而不需要另外手動重新整理狀態。

  </Accordion>

  <Accordion title="Read receipts and typing">
    私有 API 橋接器啟動時，已接受的傳入聊天會被標記為已讀；直接聊天則會在回合被接受、代理準備脈絡並生成時立即顯示輸入氣泡。可用以下設定停用已讀標記：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    較舊、早於逐方法能力清單的 `imsg` 建置會靜默停用輸入/已讀；OpenClaw 會在每次重新啟動時記錄一次性警告，讓缺少回條的原因可被追溯。

  </Accordion>

  <Accordion title="Inbound tapbacks">
    OpenClaw 會訂閱 iMessage 點按回應，並將已接受的反應路由為系統事件，而非一般訊息文字，因此使用者的點按回應不會觸發普通回覆迴圈。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（預設）：只有當使用者對機器人撰寫的訊息做出反應時才通知。
    - `"all"`：通知來自已授權寄件者的所有傳入點按回應。
    - `"off"`：忽略傳入點按回應。

    每帳號覆寫使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="Approval reactions (👍 / 👎)">
    當 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 為 true，且請求路由到 iMessage 時，閘道會以原生方式送出核准提示，並接受點按回應來完成解析：

    - `👍`（Like 點按回應）→ `allow-once`
    - `👎`（Dislike 點按回應）→ `deny`
    - `allow-always` 仍是手動後備：以一般回覆傳送 `/approve <id> allow-always`。

    反應處理需要做出反應的使用者控制代碼是明確核准者。核准者清單讀取自 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）；請加入使用者的 E.164 格式電話號碼或其 Apple ID 電子郵件。萬用字元項目 `"*"` 會被採用，但會允許任何寄件者核准。反應捷徑會刻意略過 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因為明確核准者允許清單是核准解析唯一相關的門檻。

    **此版本的行為變更：**當 `channels.imessage.allowFrom` 非空時，`/approve <id> <decision>` 文字命令現在會依該核准者清單授權（而非較廣的私訊允許清單）。私訊允許清單允許、但不在 `allowFrom` 內的寄件者，會收到明確拒絕。請將每一位應能透過 `/approve`（以及透過反應）核准的操作員加入 `allowFrom`，以保留先前行為。當 `allowFrom` 為空時，舊版「同聊天後備」仍會生效，且 `/approve` 會繼續授權私訊允許清單允許的任何人。

    操作員注意事項：
    - 反應綁定會同時儲存在記憶體中（TTL 與核准到期時間相符）以及閘道的持久化鍵值儲存中，因此在閘道重新啟動後不久抵達的點按回應仍可解析核准。
    - 跨裝置 `is_from_me=true` 點按回應（操作員自己在配對 Apple 裝置上的反應）會被刻意忽略，因此機器人無法自行核准。
    - 舊版文字樣式點按回應（非常舊的 Apple 用戶端傳來的 `Liked "…"` 純文字）無法解析核准，因為它們不帶訊息 GUID；反應解析需要目前 macOS / iOS 用戶端送出的結構化點按回應中繼資料。

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

## 合併分割傳送的私訊（命令 + URL 在同一次撰寫中）

當使用者一起輸入命令和 URL，例如 `Dump https://example.com/article`，Apple 的 Messages app 會將傳送分割成**兩筆獨立的 `chat.db` 列**：

1. 一則文字訊息（`"Dump"`）。
2. 一個 URL 預覽氣泡（`"https://..."`），並將 OG 預覽圖片作為附件。

在大多數設定中，這兩列會相隔約 0.8-2.0 秒到達 OpenClaw。沒有合併時，代理會在第 1 回合只收到命令並回覆（通常是「把 URL 傳給我」），接著才在第 2 回合看到 URL，此時命令脈絡已經遺失。這是 Apple 的傳送管線所致，不是 OpenClaw 或 `imsg` 引入的行為。

`channels.imessage.coalesceSameSenderDms` 會讓私訊選擇緩衝連續的同寄件者列。當 `imsg` 在其中一筆來源列上公開結構化 URL 預覽標記 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 時，OpenClaw 只會合併該真實分割傳送，並將其他已緩衝列保留為獨立回合。在完全不送出氣泡中繼資料的較舊 `imsg` 建置上，OpenClaw 無法分辨分割傳送與分開傳送，因此會後備為合併整個桶。這會保留中繼資料出現前的行為，而不是讓 `Dump <url>` 分割傳送退化成兩個回合。群組聊天會繼續逐訊息派送，以保留多使用者回合結構。

<Tabs>
  <Tab title="When to enable">
    在以下情況啟用：

    - 你發布的 skills 預期 `command + payload` 位於同一則訊息中（傾印、貼上、儲存、排入佇列等）。
    - 你的使用者會將 URL 與命令一起貼上。
    - 你可以接受增加的私訊回合延遲（見下方）。

    在以下情況保持停用：

    - 你需要單字私訊觸發器的最低命令延遲。
    - 你的所有流程都是沒有後續承載的單次命令。

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    啟用此旗標且未明確設定 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs` 時，防抖視窗會擴大到 **7000 ms**（舊版預設為 0 ms，亦即不防抖）。需要較寬的視窗，是因為 Apple 的 URL 預覽分割傳送節奏可能在 Messages.app 送出預覽列時延長到數秒。

    若要自行調整視窗：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="權衡取捨">
    - **精準合併需要目前的 `imsg` 酬載中繼資料。** 當 URL 列包含 `balloon_bundle_id` 時，只有該次真實的拆分傳送會合併，其他已緩衝列會保持分開。在較舊、未暴露氣球中繼資料的 `imsg` 建置上，OpenClaw 會退回合併已緩衝的儲存桶，避免 `Dump <url>` 拆分傳送退化成兩個回合（暫時的向後相容，等 `imsg` 在上游合併拆分傳送後移除）。
    - **私人訊息會增加延遲。** 啟用旗標時，每則私人訊息（包含獨立控制命令和單一文字後續訊息）在派送前都會等待最多防抖動視窗時間，以防 URL 預覽列即將到來。群組聊天訊息會維持即時派送。
    - **合併輸出有界限。** 合併文字上限為 4000 個字元，並帶有明確的 `…[truncated]` 標記；附件上限為 20 個；來源項目上限為 10 個（超過後保留第一個加上最新項目）。每個來源 GUID 都會記錄在 `coalescedMessageGuids`，供下游遙測使用。
    - **僅限私人訊息。** 群組聊天會落回逐訊息派送，讓機器人在多人同時輸入時仍保持回應性。
    - **選擇啟用，按通道設定。** 其他通道（Telegram、WhatsApp、Slack、…）不受影響。設定 `channels.bluebubbles.coalesceSameSenderDms` 的舊版 BlueBubbles 設定應將該值遷移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 情境與代理看到的內容

「啟用旗標」欄顯示在會發出 `balloon_bundle_id` 的 `imsg` 建置上的行為。在完全不發出氣球中繼資料的較舊 `imsg` 建置上，下方標示為「兩個回合」/「N 個回合」的列會改為退回舊版合併（一個回合）：OpenClaw 無法從結構上分辨拆分傳送與分開傳送，因此會保留中繼資料出現前的合併行為。一旦建置開始發出氣球中繼資料，就會啟用精準分離。

| 使用者撰寫內容                                                     | `chat.db` 產生內容                    | 關閉旗標（預設）                         | 啟用旗標 + 視窗（imsg 發出氣球中繼資料）                                                           |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                              | 約間隔 1 秒的 2 列                   | 兩個代理回合：「Dump」單獨一回，接著是 URL | 一個回合：合併文字 `Dump https://example.com`                                                       |
| `Save this 📎image.jpg caption`（附件 + 文字）                | 2 列，沒有 URL 氣球中繼資料 | 兩個回合                               | 觀察到中繼資料後為兩個回合；在舊版/鎖定前且無中繼資料的工作階段中為一個合併回合       |
| `/status`（獨立命令）                                     | 1 列                               | 即時派送                        | **最多等待視窗時間，然後派送**                                                                |
| 單獨貼上 URL                                                   | 1 列                               | 即時派送                        | 最多等待視窗時間，然後派送                                                                    |
| 文字 + URL 以兩則刻意分開的訊息傳送，間隔數分鐘 | 視窗外的 2 列               | 兩個回合                               | 兩個回合（兩者之間視窗已過期）                                                             |
| 快速大量傳送（視窗內超過 10 則小型私人訊息）                          | N 列，沒有 URL 氣球中繼資料 | N 個回合                                 | 觀察到中繼資料後為 N 個回合；在舊版/鎖定前且無中繼資料的工作階段中為一個有界合併回合 |
| 兩個人在群組聊天中輸入                                  | 來自 M 位傳送者的 N 列               | M+ 個回合（每個傳送者儲存桶一個）        | M+ 個回合 — 群組聊天不會合併                                                            |

## 橋接或閘道重新啟動後的入站復原

iMessage 會復原閘道停機期間遺漏的訊息，同時抑制 Apple 在 Push 復原後可能清出的過時「待處理洪流」。預設行為一律啟用，並建構在入站去重複之上。

- **重播去重複。** 每則已派送的入站訊息都會以其 Apple GUID 記錄在持久性外掛狀態（`imessage.inbound-dedupe`）中，在擷取時宣告，並在處理後提交（若發生暫時性失敗則釋放，讓它可以重試）。任何已處理項目都會被丟棄，而不是派送兩次。這讓復原能積極重播，而不需要逐訊息記帳。
- **停機復原。** 啟動時，監控器會記住最後派送的 `chat.db` rowid（一個持久化的每帳號游標），並將其作為 `since_rowid` 傳給 `imsg watch.subscribe`，因此 imsg 會重播閘道停機時落入的列，然後追蹤即時內容。重播範圍限制在最近列和約 2 小時內的訊息，去重複則會丟棄任何已處理項目。
- **過時待處理年齡柵欄。** 啟動邊界以上的列是真正的即時內容；若某列的傳送日期比其到達時間早超過約 15 分鐘，就是 Push 清出的待處理內容，會被抑制。重播列（位於或低於邊界）則使用較寬的復原視窗，因此最近遺漏的訊息會被送達，而久遠歷史不會。

復原可同時用於本機和遠端 `cliPath` 設定，因為 `since_rowid` 重播會透過相同的 `imsg` RPC 連線執行。差異在視窗：當閘道可以讀取 `chat.db`（本機）時，它會錨定啟動 rowid 邊界、限制重播跨度，並送達最多約數小時前的遺漏訊息。透過遠端 SSH `cliPath` 時，它無法讀取資料庫，因此重播不設上限，而且每列都使用即時年齡柵欄 — 它仍會復原最近遺漏的訊息，也仍會抑制舊待處理內容，只是使用較窄的即時視窗。請在 Messages Mac 上執行閘道以取得較寬的復原視窗。

### 操作者可見訊號

被抑制的待處理內容會以預設層級記錄，絕不會靜默丟棄（`recovery` 旗標顯示套用哪個視窗）：

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 遷移

`channels.imessage.catchup.*` 已棄用 — 停機復原現在會自動執行，且新設定不需要任何設定。既有設定若含有 `catchup.enabled: true`，仍會作為復原重播視窗的相容性設定檔受到支援。已停用的 catchup 區塊（`enabled: false` 或沒有 `enabled: true`）已退役；`openclaw doctor --fix` 會移除這些項目。

## 疑難排解

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支援 RPC">
    驗證二進位檔與 RPC 支援：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探測回報不支援 RPC，請更新 `imsg`。如果私有 API 動作無法使用，請在已登入的 macOS 使用者工作階段中執行 `imsg launch`，然後再次探測。如果閘道未在 macOS 上執行，請改用上方的透過 SSH 使用遠端 Mac 設定，而不是預設的本機 `imsg` 路徑。

  </Accordion>

  <Accordion title="訊息可以傳送，但入站 iMessage 沒有抵達">
    先證明訊息是否到達本機 Mac。如果 `chat.db` 沒有變更，即使 `imsg status --json` 回報橋接健康，OpenClaw 也無法接收該訊息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果手機傳送的訊息沒有建立新列，請先修復 macOS Messages 和 Apple Push 層，再變更 OpenClaw 設定。一次性服務重新整理通常就足夠：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    從手機傳送新的 iMessage，並在偵錯 OpenClaw 工作階段前確認有新的 `chat.db` 列或 `imsg watch` 事件。不要將此作為週期性的橋接重新啟動迴圈；在進行中的工作期間重複執行 `imsg launch` 加上閘道重新啟動，可能中斷送達並讓進行中的通道執行停滯。

  </Accordion>

  <Accordion title="閘道未在 macOS 上執行">
    預設 `cliPath: "imsg"` 必須在已登入 Messages 的 Mac 上執行。在 Linux 或 Windows 上，請將 `channels.imessage.cliPath` 設為一個包裝腳本，透過 SSH 連到該 Mac 並執行 `imsg "$@"`。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    然後執行：

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="私人訊息被忽略">
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
    - 從閘道主機進行的 SSH/SCP 金鑰驗證
    - 閘道主機上的 `~/.ssh/known_hosts` 中存在主機金鑰
    - 執行 Messages 的 Mac 上遠端路徑的可讀性

  </Accordion>

  <Accordion title="錯過 macOS 權限提示">
    在相同使用者/工作階段內容中的互動式 GUI 終端機重新執行，並核准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    確認已針對執行 OpenClaw/`imsg` 的程序內容授予完整磁碟存取權 + 自動化權限。

  </Accordion>
</AccordionGroup>

## 設定參考指引

- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
- [閘道設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)

## 相關

- [通道概觀](/zh-TW/channels) — 所有支援的通道
- [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 公告與遷移摘要
- [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles) — 設定轉譯表與逐步切換
- [配對](/zh-TW/channels/pairing) — 私人訊息驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘門
- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
