---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送／接收
summary: 透過 imsg（經由標準輸入輸出的 JSON-RPC）提供原生 iMessage 支援，並透過私有 API 執行回覆、點按回應、效果、投票、附件與群組管理等操作。若主機需求符合，建議新的 OpenClaw iMessage 設定優先使用此方式。
title: iMessage
x-i18n:
    generated_at: "2026-07-16T11:21:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於一般的 OpenClaw iMessage 部署，請在同一台已登入 macOS「訊息」的主機上執行閘道和 `imsg`。如果你的閘道在其他位置執行，請將 `channels.imessage.cliPath` 指向透明的 SSH 包裝指令碼，由它在 Mac 上執行 `imsg`。

**輸入訊息復原會自動進行。** 橋接器或閘道重新啟動後，iMessage 會重播停機期間遺漏的訊息，並抑制 Apple 在推播復原後可能大量送出的過時「待處理訊息炸彈」，同時進行去重，確保不會重複分派任何訊息。無須透過設定啟用——請參閱[橋接器或閘道重新啟動後的輸入訊息復原](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支援已移除。請將 `channels.bluebubbles` 設定遷移至 `channels.imessage`；OpenClaw 僅透過 `imsg` 支援 iMessage。若要閱讀簡短公告，請先參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)；若要查看完整遷移表，請參閱[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。
</Warning>

狀態：原生外部命令列介面整合。閘道會啟動 `imsg rpc`，並透過標準輸入輸出使用 JSON-RPC 通訊——不需要獨立的常駐程式或連接埠。強烈建議使用私有 API 模式，以取得完整的 iMessage 頻道功能；回覆、點按回應、效果、投票、附件回覆和群組操作都需要 `imsg launch`，且私有 API 探測必須成功。

對於常見的本機設定，OpenClaw 設定程序可在已登入「訊息」的 Mac 上，經使用者確認後透過 Homebrew 安裝或更新 `imsg`。手動設定和 SSH 包裝指令碼拓撲仍由操作人員管理：請在將執行閘道或包裝指令碼的同一使用者環境中安裝或更新 `imsg`。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#private-api-actions">
    回覆、點按回應、效果、投票、附件和群組管理。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    iMessage 私訊預設使用配對模式。
  </Card>
  <Card title="遠端 Mac" icon="terminal" href="#remote-mac-over-ssh">
    當閘道未在「訊息」Mac 上執行時，請使用 SSH 包裝指令碼。
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
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        當本機設定精靈偵測到預設的 `imsg` 命令不存在時，可提示透過 Homebrew 安裝 `steipete/tap/imsg`。如果偵測到由 Homebrew 管理的 `imsg`，則可提示重新安裝或更新。系統不會修改自訂的 `cliPath` 包裝指令碼。

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

      <Step title="核准首次私訊配對（預設 dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配對要求會在 1 小時後到期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="透過 SSH 使用遠端 Mac">
    大多數設定不需要 SSH。只有在閘道無法於已登入「訊息」的 Mac 上執行時，才使用此拓撲。OpenClaw 只需要與標準輸入輸出相容的 `cliPath`，因此你可以將 `cliPath` 指向一個包裝指令碼，由其透過 SSH 連線至遠端 Mac 並執行 `imsg`。
    請在該遠端 Mac 上安裝和更新 `imsg`，而不是在閘道主機上：

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    啟用附件時的建議設定：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // 用於透過 SCP 擷取附件
      includeAttachments: true,
      // 選用：額外允許的附件根目錄（會與預設的
      // /Users/*/Library/Messages/Attachments 合併）。
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    如果未設定 `remoteHost`，OpenClaw 會嘗試剖析 SSH 包裝指令碼來自動偵測。
    `remoteHost` 必須是 `host` 或 `user@host`（不得包含空格或 SSH 選項）；不安全的值會被忽略。
    OpenClaw 對 SCP 使用嚴格的主機金鑰檢查，因此中繼主機金鑰必須已存在於 `~/.ssh/known_hosts` 中。
    附件路徑會依照允許的根目錄（`attachmentRoots` / `remoteAttachmentRoots`）進行驗證。

<Warning>
你放在 `imsg` 前方的任何 `cliPath` 包裝指令碼或 SSH Proxy，都「必須」作為長時間執行 JSON-RPC 的透明標準輸入輸出管線。頻道存續期間，OpenClaw 會透過包裝指令碼的 stdin/stdout 交換以換行符號分框的小型 JSON-RPC 訊息：

- 每當有位元組可用時，**立即**轉送每個 stdin 資料區塊／行——不要等待 EOF。
- 迅速朝反方向轉送每個 stdout 資料區塊／行。
- 保留換行符號。
- 避免使用固定大小的阻塞讀取（`read(4096)`、`cat | buffer`、Shell 預設的 `read`），以免小型資料框無法獲得處理。
- 將 stderr 與 JSON-RPC stdout 串流分開。

若包裝指令碼將 stdin 緩衝到大型區塊填滿後才轉送，會產生看似 iMessage 中斷的症狀——`imsg rpc timeout (chats.list)` 或頻道反覆重新啟動——即使 `imsg rpc` 本身運作正常。上方的 `ssh -T host imsg "$@"` 是安全的，因為它會轉送 OpenClaw 的 `cliPath` 引數，例如 `rpc` 和 `--db`。`ssh host imsg | grep -v '^DEBUG'` 之類的管線則「不安全」——採用行緩衝的工具仍可能保留資料框；若必須篩選，請在每個階段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 需求與權限（macOS）

- 執行 `imsg` 的 Mac 必須已登入「訊息」。
- 執行 OpenClaw／`imsg` 的程序環境需要「完整磁碟存取權」（用於存取「訊息」資料庫）。
- 透過 Messages.app 傳送訊息需要「自動化」權限。
- 進階操作（回應／編輯／收回傳送／討論串回覆／效果／投票／群組操作）需要停用「系統完整性保護」——請參閱[啟用 imsg 私有 API](#enabling-the-imsg-private-api)。即使未停用，也可使用基本文字和媒體收發功能。

<Tip>
權限會依程序環境個別授予。如果閘道以無頭模式執行（LaunchAgent／SSH），請在同一環境中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "測試"
```

</Tip>

<Accordion title="SSH 包裝指令碼傳送失敗並出現 AppleEvents -1743">
  遠端 SSH 設定可能可以讀取聊天、通過 `channels status --probe` 並處理輸入訊息，但傳出訊息仍因 AppleEvents 授權錯誤而失敗：

```text
未獲授權將 Apple Event 傳送至「訊息」。(-1743)
```

請檢查已登入 Mac 使用者的 TCC 資料庫，或「System Settings > Privacy & Security > Automation」。如果「自動化」項目記錄的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本機 Shell 程序，macOS 可能不會為該 SSH 伺服器端用戶端提供可用的「訊息」開關：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在此狀態下，重複執行 `tccutil reset AppleEvents`，或透過同一個 SSH 包裝指令碼重新執行 `imsg send`，可能仍會失敗，因為需要「訊息」自動化權限的程序環境是 SSH 包裝指令碼，而不是可由介面授予權限的應用程式。

請改用下列任一受支援的 `imsg` 程序環境：

- 在已登入「訊息」使用者的本機工作階段中執行閘道，或至少執行 `imsg` 橋接器。
- 從同一工作階段授予「完整磁碟存取權」和「自動化」權限後，使用該使用者的 LaunchAgent 啟動閘道。
- 如果保留雙使用者 SSH 拓撲，請在啟用頻道前，驗證實際的傳出 `imsg send` 能透過完全相同的包裝指令碼成功執行。如果無法授予「自動化」權限，請改為設定單一使用者的 `imsg`，而不要依賴 SSH 包裝指令碼傳送訊息。

</Accordion>

## 啟用 imsg 私有 API

`imsg` 提供兩種運作模式。對 OpenClaw 而言，建議設定為私有 API 模式，因為它能為頻道提供使用者所期望的原生 iMessage 操作。基本模式仍適用於低風險安裝、初始驗證，或無法停用 SIP 的主機。

- **基本模式**（預設，不需要變更 SIP）：透過 `send` 傳送文字和媒體、監看／歷程記錄輸入訊息，以及列出聊天。全新安裝 `brew install steipete/tap/imsg` 並授予上述標準 macOS 權限後，即可直接使用這些功能。
- **私有 API 模式**：`imsg` 會將輔助 dylib 注入 `Messages.app`，以呼叫內部 `IMCore` 函式。這會解鎖 `react`、`edit`、`unsend`、`reply`（討論串）、`sendWithEffect`、`poll` 和 `poll-vote`（「訊息」原生投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及輸入狀態指示器和已讀回條。

本頁建議的操作介面需要私有 API 模式。`imsg` README 明確說明了此項要求：

> `read`、`typing`、`launch`、橋接器支援的豐富傳送功能、訊息修改和聊天管理等進階功能皆為選用。這些功能需要停用 SIP，並將輔助 dylib 注入 `Messages.app`。啟用 SIP 時，`imsg launch` 會拒絕注入。

此輔助注入技術會使用 `imsg` 自身的 dylib 存取「訊息」私有 API。OpenClaw iMessage 路徑中沒有第三方伺服器或 BlueBubbles 執行階段。

<Warning>
**停用 SIP 確實會帶來安全性取捨。** SIP 是 macOS 防止執行經修改系統程式碼的核心保護機制之一；在整個系統中將其關閉會增加額外的攻擊面和副作用。尤其值得注意的是，**在 Apple Silicon Mac 上停用 SIP，也會讓你無法在 Mac 上安裝和執行 iOS App**。

請將此視為審慎決定的維運選擇，尤其是在主要的個人 Mac 上。若要達到正式環境品質的 OpenClaw iMessage，建議使用專用 Mac 或機器人 macOS 使用者，並確保你願意為其啟用橋接器。如果你的威脅模型無法容許任何位置停用 SIP，內建的 iMessage 就只能使用基本模式——僅限文字和媒體收發，不支援回應／編輯／收回傳送／效果／群組操作。
</Warning>

### 設定

1. 在執行 Messages.app 的 Mac 上**安裝（或升級）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 輸出會回報 `bridge_version`、`rpc_methods` 和各方法的 `selectors`，讓你在開始前查看目前版本支援的功能。

2. **停用系統完整性保護，並且（在現代 macOS 上）停用程式庫驗證。** 將非 Apple 的輔助 dylib 注入由 Apple 簽署的 `Messages.app`，需要關閉 SIP **並**放寬程式庫驗證。復原模式中的 SIP 步驟會因 macOS 版本而異：
   - **macOS 10.13-10.15（Sierra-Catalina）：**透過終端機停用程式庫驗證，重新啟動進入復原模式，執行 `csrutil disable`，再重新啟動。
   - **macOS 11+（Big Sur 及更新版本），Intel：**進入復原模式（或網際網路復原），執行 `csrutil disable`，再重新啟動。
   - **macOS 11+，Apple Silicon：**使用電源按鈕啟動流程進入復原模式；在近期的 macOS 版本上，按一下 Continue 時按住 **Left Shift** 鍵，然後執行 `csrutil disable`。虛擬機器設定採用不同流程，因此請先建立 VM 快照。

   **在 macOS 11 及更新版本上，單獨使用 `csrutil disable` 通常並不足夠。** Apple 仍會將 `Messages.app` 視為平台二進位檔並對其強制執行程式庫驗證，因此即使關閉 SIP，臨時簽署的輔助程式仍會遭到拒絕（`Library Validation failed: ... platform binary, but mapped file is not`）。停用 SIP 後，還要停用程式庫驗證並重新啟動：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已在 26.5.1 上驗證：**關閉 SIP **加上**上述 `DisableLibraryValidation` 命令，即足以在 26.0 至 26.5.x 上注入輔助程式。**不需要任何 boot-args。** 此 plist 是決定性因素，也是 Tahoe 上注入失敗時最常遺漏的步驟：
   - **有 plist 時：**`imsg launch` 會成功注入，且 `imsg status` 會回報 `advanced_features: true`。
   - **沒有 plist 時（即使已關閉 SIP）：**`imsg launch` 會失敗並顯示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 會在載入時拒絕臨時簽署的輔助程式，因此橋接器永遠無法就緒，啟動作業最終會逾時。此逾時是多數人在 Tahoe 上遇到的症狀；修正方式是使用上述 plist，而不是採取更激烈的措施。

   如果 macOS 升級後，`imsg launch` 注入或特定 `selectors` 開始回傳 false，通常就是這道關卡所致。在認定 SIP 步驟本身失敗前，請先檢查 SIP 與程式庫驗證狀態。如果這些設定正確，但橋接器仍無法注入，請收集 `imsg status --json` 以及 `imsg launch` 的輸出，並回報給 `imsg` 專案，而不要進一步削弱其他系統層級的安全控制。

3. **注入輔助程式。** 在 SIP 已停用且 Messages.app 已登入的情況下：

   ```bash
   imsg launch
   ```

   SIP 仍啟用時，`imsg launch` 會拒絕注入，因此這也可同時確認步驟 2 已生效。

4. **從 OpenClaw 驗證橋接器：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 項目應回報 `works`，而 `imsg status --json | jq '{rpc_methods, selectors}'` 應顯示你的 macOS 組建所提供的功能。建立投票需要 `selectors.pollPayloadMessage`；投票則同時需要 `selectors.pollVoteMessage` 與 `poll.vote` RPC 方法。OpenClaw 外掛只會公告快取探測結果所支援的動作；若快取為空，則會保持樂觀判定，並在首次分派時進行探測。

如果 `openclaw channels status --probe` 將頻道回報為 `works`，但特定動作在分派時擲出 “iMessage `<action>` requires the imsg private API bridge”，請再次執行 `imsg launch`——輔助程式可能會脫離（Messages.app 重新啟動、作業系統更新等），而快取的 `available: true` 狀態會繼續公告這些動作，直到下一次探測重新整理為止。

### SIP 保持啟用時

如果你的威脅模型無法接受停用 SIP：

- `imsg` 會退回基本模式——僅支援文字、媒體與接收。
- OpenClaw 外掛仍會公告文字／媒體傳送與傳入訊息監控；它會從動作介面隱藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 及群組操作（依各方法的功能關卡而定）。
- 你可以使用另一台已關閉 SIP 的非 Apple Silicon Mac（或專用機器人 Mac）處理 iMessage 工作負載，同時在主要裝置上保持 SIP 啟用。請參閱下方的[專用機器人 macOS 使用者（獨立的 iMessage 身分）](#deployment-patterns)。

## 存取控制與路由

<Tabs>
  <Tab title="私訊政策">
    `channels.imessage.dmPolicy` 控制私訊：

    - `pairing`（預設）
    - `allowlist`（需要至少一個 `allowFrom` 項目）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    允許清單欄位：`channels.imessage.allowFrom`。

    允許清單項目必須識別傳送者：控制代碼或靜態傳送者存取群組（`accessGroup:<name>`）。對 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目標使用 `channels.imessage.groupAllowFrom`；對數字型 `chat_id` 登錄鍵使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群組政策與提及">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（預設）
    - `open`
    - `disabled`

    群組傳送者允許清單：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 項目也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。

    執行階段備援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會使用 `allowFrom`；當私訊與群組的准入規則應有所不同時，請設定 `groupAllowFrom`。明確設為空值的 `groupAllowFrom: []` 不會備援——在 `allowlist` 下，它會封鎖所有群組傳送者。
    執行階段注意事項：如果完全缺少 `channels.imessage`，執行階段會退回使用 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    <Warning>
    `groupPolicy: "allowlist"` 下的群組路由會連續執行**兩道**關卡：

    1. **傳送者允許清單**（`channels.imessage.groupAllowFrom`）——控制代碼、`accessGroup:<name>`、`chat_guid`、`chat_identifier` 或 `chat_id`。有效清單為空（沒有 `groupAllowFrom`，也沒有 `allowFrom` 備援）時，會封鎖每一位群組傳送者。
    2. **群組登錄**（`channels.imessage.groups`）——對應表有項目後便會強制執行：聊天必須符合明確的個別 `chat_id` 項目或 `groups: { "*": { ... } }` 萬用字元。當 `groups` 為空或缺少時，只由傳送者允許清單決定是否准入。

    如果未設定有效的群組傳送者允許清單，所有群組訊息都會在進入登錄關卡前遭到捨棄。每道關卡在預設記錄層級下都有各自的 `warn` 層級訊號，並各自指出不同的修正方式：

    - 每個帳號在啟動時一次，當有效的群組傳送者允許清單為空：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`——請設定 `channels.imessage.groupAllowFrom`（或 `allowFrom`）來修正；只新增 `groups` 項目仍會讓關卡 1 封鎖每一位傳送者。
    - 執行階段中每個 `chat_id` 一次，當傳送者已通過關卡 1，但聊天不在已有內容的 `groups` 登錄中：`imessage: dropping group message from chat_id=<id> ...`——請在 `channels.imessage.groups` 下新增該 `chat_id`（或 `"*"`）來修正。

    私訊不受影響——它們採用不同的程式碼路徑。

    `groupPolicy: "allowlist"` 下群組流程的建議設定：

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

    單獨設定 `groupAllowFrom` 就會允許這些傳送者進入任何群組；新增 `groups` 區塊可限制允許哪些聊天（並設定 `requireMention` 等個別聊天選項）。
    </Warning>

    群組的提及關卡：

    - iMessage 沒有原生提及中繼資料
    - 提及偵測使用規則運算式模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 若未設定任何模式，就無法強制執行提及關卡
    - 來自已授權傳送者的控制命令會略過提及關卡

    個別群組 `systemPrompt`：

    `channels.imessage.groups.*` 下的每個項目都接受選用的 `systemPrompt` 字串；每次處理該群組中的訊息時，此字串都會注入代理程式的系統提示詞。解析方式與 `channels.whatsapp.groups` 相同：

    1. **群組專用系統提示詞**（`groups["<chat_id>"].systemPrompt`）：當對應表中存在特定群組項目，**且**已定義其 `systemPrompt` 鍵時使用。如果 `systemPrompt` 是空字串（`""`），便會抑制萬用字元，不對該群組套用任何系統提示詞。
    2. **群組萬用字元系統提示詞**（`groups["*"].systemPrompt`）：當對應表中完全沒有特定群組項目，或該項目存在但未定義 `systemPrompt` 鍵時使用。

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "使用英式拼字。" },
            "8421": {
              requireMention: true,
              systemPrompt: "這是待命輪值聊天。回覆請控制在 3 句以內。",
            },
            "9907": {
              // 明確抑制：萬用字元 "使用英式拼字。" 不會套用於此處
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    個別群組提示詞只會套用於群組訊息——私訊不受影響。

  </Tab>

  <Tab title="工作階段與確定性回覆">
    - 私訊使用直接路由；群組使用群組路由。
    - 使用預設的 `session.dmScope=main` 時，iMessage 私訊會合併至代理程式的主要工作階段。
    - 群組工作階段彼此隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用來源頻道／目標中繼資料路由回 iMessage。

    類群組討論串行為：

    某些有多位參與者的 iMessage 討論串可能會帶有 `is_group=false`。
    如果該 `chat_id` 已明確設定於 `channels.imessage.groups` 下，OpenClaw 會將其視為群組流量（群組關卡 + 群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

iMessage 聊天可以繫結至 ACP 工作階段。

快速操作流程：

- 在私訊或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 該 iMessage 對話中的後續訊息會路由至新建立的 ACP 工作階段。
- `/new` 與 `/reset` 會在原處重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

已設定的持續性繫結使用頂層 `bindings[]` 項目，搭配 `type: "acp"` 與 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 標準化的私訊控制代碼，例如 `+15555550123` 或 `user@example.com`
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

如需瞭解共用的 ACP 繫結行為，請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 部署模式

<AccordionGroup>
  <Accordion title="專用機器人 macOS 使用者（獨立的 iMessage 身分）">
    使用專用 Apple ID 與 macOS 使用者，將機器人流量與你的個人 Messages 設定檔隔離。

    一般流程：

    1. 建立／登入專用的 macOS 使用者。
    2. 在該使用者中，使用機器人的 Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH 包裝程式，讓 OpenClaw 能在該使用者情境中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向該使用者設定檔。

    第一次執行時，可能需要在該機器人使用者工作階段中透過 GUI 核准權限（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="透過 Tailscale 使用遠端 Mac（範例）">
    常見拓撲：

    - 閘道在 Linux／VM 上執行
    - iMessage + `imsg` 在 tailnet 中的 Mac 上執行
    - `cliPath` 包裝程式使用 SSH 執行 `imsg`
    - `remoteHost` 啟用透過 SCP 擷取附件

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

    使用 SSH 金鑰，讓 SSH 和 SCP 都能以非互動方式執行。
    請先確保主機金鑰受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填入 `known_hosts`。

  </Accordion>

  <Accordion title="多帳號模式">
    iMessage 支援在 `channels.imessage.accounts` 下設定各帳號。

    每個帳號都可覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史記錄設定及附件根目錄允許清單等欄位。

  </Accordion>

  <Accordion title="私人訊息歷史記錄">
    設定 `channels.imessage.dmHistoryLimit`，即可使用該對話中近期已解碼的 `imsg` 歷史記錄，為新的私人訊息工作階段提供初始內容。使用 `channels.imessage.dms["<sender>"].historyLimit` 設定各傳送者的覆寫值，包括使用 `0` 停用特定傳送者的歷史記錄。

    iMessage 私人訊息歷史記錄會視需要從 `imsg` 擷取。若未設定 `dmHistoryLimit`，會停用全域私人訊息歷史記錄的初始填入；但若某傳送者的 `channels.imessage.dms["<sender>"].historyLimit` 為正值，仍會啟用該傳送者的初始填入。

  </Accordion>
</AccordionGroup>

## 媒體、分段與傳送目標

<AccordionGroup>
  <Accordion title="附件與媒體">
    - 預設**停用**輸入附件擷取——設定 `channels.imessage.includeAttachments: true`，即可將照片、語音備忘錄、影片及其他附件轉送給代理程式。停用時，只有附件的 iMessage 會在送達代理程式前被捨棄，而且可能完全不會產生 `Inbound message` 記錄行。
    - 設定 `remoteHost` 時，可透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 已設定的根目錄會擴充預設根目錄模式 `/Users/*/Library/Messages/Attachments`（合併，而非取代）
    - SCP 使用嚴格主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 輸出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="輸出文字與分段">
    - 文字分段限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分段模式：`channels.imessage.streaming.chunkMode`
      - `length`（預設）
      - `newline`（優先依段落分割）
    - 輸出的 Markdown 粗體／斜體／底線／刪除線會轉換成原生樣式文字（macOS 15+ 的接收者會看到樣式；較舊版本的接收者則會看到不含標記的純文字）；Markdown 表格會依頻道的 Markdown 表格模式轉換
    - `channels.imessage.sendTransport`（`auto` 為預設值，另有 `bridge`、`applescript`）選擇 `imsg` 傳送訊息的方式

  </Accordion>

  <Accordion title="定址格式">
    建議的明確目標：

    - `chat_id:123`（建議用於穩定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支援代號目標：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 私有 API 動作

當 `imsg launch` 正在執行，且 `openclaw channels status --probe` 回報 `privateApi.available: true` 時，訊息工具除了傳送一般文字外，也能使用 iMessage 原生動作。

預設會啟用所有動作；使用 `channels.imessage.actions` 可個別停用動作：

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
  <Accordion title="可用動作">
    - **react**：新增／移除 iMessage 點按回應（`messageId`、`emoji`、`remove`）。支援的點按回應對應為愛心、讚、倒讚、大笑、強調和疑問。移除時若未指定表情符號，會清除目前設定的任何點按回應。
    - **reply**：對現有訊息傳送串接回覆（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。附帶附件的回覆還需要 `imsg` 組建，且其 `send-rich` 須支援 `--file`。
    - **sendWithEffect**：使用 iMessage 特效傳送文字（`text` 或 `message`，以及 `effect` 或 `effectId`）。短名稱：slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **edit**：在支援的 macOS／私有 API 版本上編輯已傳送的訊息（`messageId`、`text` 或 `newText`）。只能編輯閘道本身傳送的訊息。
    - **unsend**：在支援的 macOS／私有 API 版本上收回已傳送的訊息（`messageId`）。只能收回閘道本身傳送的訊息。
    - **upload-file**：傳送媒體／檔案（`buffer` 可使用 base64，或使用已填入內容的 `media`/`path`/`filePath`、`filename`，以及選用的 `asVoice`）。舊版別名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：目前目標為群組對話時，可管理群組聊天。這些動作會修改主機的 Messages 身分，因此需要擁有者傳送者或 `operator.admin` 閘道用戶端。
    - **poll**：建立原生 Apple Messages 投票（`pollQuestion`、重複 2 至 12 次的 `pollOption`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。使用 iOS/iPadOS/macOS 26+ 的接收者能以原生方式查看並投票；較舊的作業系統版本會收到 “Sent a poll” 純文字備援訊息。需要 `selectors.pollPayloadMessage`。
    - **poll-vote**：對現有投票進行投票（`pollId` 或 `messageId`，以及 `pollOptionIndex`、`pollOptionId` 或 `pollOptionText` 其中正好一項）。需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。

    已接受的輸入投票會向代理程式呈現問題、編號的選項標籤、票數，以及 `poll-vote` 所需的投票訊息 ID。

  </Accordion>

  <Accordion title="訊息 ID">
    輸入的 iMessage 情境會同時包含簡短的 `MessageSid` 值，以及可用時的完整訊息 GUID（`MessageSidFull`）。簡短 ID 的有效範圍僅限於近期由 SQLite 支援的回覆快取，使用前也會根據目前聊天進行檢查。若簡短 ID 已過期，請在目標設為提供該 ID 的對話時，改用其 `MessageSidFull` 重試。完整 ID 不會略過對話或帳號繫結，因此若 ID 來自其他聊天，請改用目前目標中的 ID。當無法取得目前對話的證據時，遠端委派呼叫可能會拒絕過時的完整 ID。

  </Accordion>

  <Accordion title="功能偵測">
    OpenClaw 只會在快取的探測狀態顯示橋接器無法使用時，隱藏私有 API 動作。如果狀態未知，動作仍會保持可見，並在分派時延遲執行探測，讓 `imsg launch` 之後的第一個動作可直接成功，無須另行手動重新整理狀態。

  </Accordion>

  <Accordion title="已讀回條與輸入狀態">
    私有 API 橋接器啟動時，已接受的輸入聊天會標示為已讀；回合一經接受，私人聊天就會顯示輸入中泡泡，而代理程式會同時準備情境並產生內容。若要停用標示已讀，請使用：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    在個別方法功能清單之前的舊版 `imsg` 組建會無提示地關閉輸入狀態／已讀功能；OpenClaw 每次重新啟動只會記錄一次警告，以便追查未產生回條的原因。

  </Accordion>

  <Accordion title="輸入點按回應">
    OpenClaw 會訂閱 iMessage 點按回應，並將已接受的回應作為系統事件路由，而非一般訊息文字，因此使用者的點按回應不會觸發一般回覆迴圈。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（預設）：僅在使用者回應機器人撰寫的訊息時通知。
    - `"all"`：通知來自已授權傳送者的所有輸入點按回應。
    - `"off"`：忽略輸入點按回應。

    各帳號的覆寫值使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="核准回應（👍 / 👎）">
    當 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 為 true，且請求路由至 iMessage 時，閘道會以原生方式傳送核准提示，並接受點按回應以完成核准：

    - `👍`（讚點按回應）→ `allow-once`
    - `👎`（倒讚點按回應）→ `deny`
    - `allow-always` 仍作為手動備援：將 `/approve <id> allow-always` 作為一般回覆傳送。

    回應處理要求執行回應之使用者的代號必須列為明確的核准者。核准者清單會從 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）讀取；請加入使用者採 E.164 格式的電話號碼或其 Apple ID 電子郵件地址（`chat_id:*` 等聊天目標不是有效的核准者項目）。支援萬用字元項目 `"*"`，但這會允許任何傳送者核准；核准者清單為空時，會完全停用回應捷徑。此回應捷徑會刻意略過 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因為對於核准解析，唯一需要考量的閘門是明確核准者允許清單。

    `/approve` 文字命令授權遵循相同的清單：當 `channels.imessage.allowFrom` 非空時，`/approve <id> <decision>` 會依該核准者清單授權（而不是較廣泛的私人訊息允許清單），而私人訊息允許清單所允許、但未列於 `allowFrom` 的傳送者會收到明確的拒絕訊息。當 `allowFrom` 為空時，仍會使用相同聊天備援，且 `/approve` 會授權私人訊息允許清單所允許的任何人。請將所有應能透過 `/approve` 或回應進行核准的操作員加入 `allowFrom`。

    操作員注意事項：
    - 反應繫結同時儲存在記憶體與閘道的持久化鍵值儲存區中（TTL 與核准到期時間一致），閘道也會輪詢待處理提示中的點按回應，因此，即使點按回應是在閘道重新啟動後不久送達，仍可完成核准。
    - 當該控制代碼是明確指定的核准者時，操作員自己的 `is_from_me=true` 點按回應（例如來自已配對的 Apple 裝置）可完成核准。
    - 只有在已設定明確核准者時，核准提示才會路由至群組對話；否則任何群組成員都能核准。
    - 舊版文字樣式的點按回應（來自非常舊的 Apple 用戶端的 `Liked "…"` 純文字）無法完成核准，因為其中不含訊息 GUID；反應解析需要目前 macOS / iOS 用戶端所發出的結構化點按回應中繼資料。

  </Accordion>
</AccordionGroup>

## 設定寫入

iMessage 預設允許由頻道發起的設定寫入（適用於 `/config set|unset`，當 `commands.config: true` 時）。

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

## 合併分拆傳送的私訊（在同一次編寫中包含命令 + URL）

當使用者同時輸入命令與 URL（例如 `Dump https://example.com/article`）時，Apple 的「訊息」App 會將傳送內容拆成**兩個獨立的 `chat.db` 資料列**：

1. 一則文字訊息（`"Dump"`）。
2. 一個 URL 預覽泡泡（`"https://..."`），並將 OG 預覽圖片作為附件。

在多數設定中，這兩個資料列抵達 OpenClaw 的時間相隔約 0.8-2.0 秒。若未合併，代理程式在第 1 回合只會收到命令（且常會回覆「請將 URL 傳給我」），之後 URL 才會在第 2 回合抵達。這是 Apple 的傳送管線所致，並非 OpenClaw 或 `imsg` 所引入。

`channels.imessage.coalesceSameSenderDms` 可讓私訊選擇啟用連續相同傳送者資料列的緩衝。當 `imsg` 在其中一個來源資料列上提供結構化 URL 預覽標記 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 時，OpenClaw 只會合併該次實際的分拆傳送，並將其他已緩衝資料列保留為不同回合。在完全不發出泡泡中繼資料的舊版 `imsg` 組建中，OpenClaw 無法區分分拆傳送與分開傳送，因此會改為合併該批次。這會保留中繼資料推出前的行為，而不會讓 `Dump <url>` 分拆傳送退化為兩個回合。群組聊天仍會依個別訊息分派，以保留多使用者的回合結構。

<Tabs>
  <Tab title="何時啟用">
    在下列情況啟用：

    - 你提供預期在一則訊息中收到 `command + payload` 的 Skills（傾印、貼上、儲存、排入佇列等）。
    - 你的使用者會將 URL 與命令一起貼上。
    - 你可以接受增加的私訊回合延遲（請參閱下文）。

    在下列情況保持停用：

    - 單字私訊觸發器需要最低的命令延遲。
    - 你的所有流程都是沒有後續承載內容的一次性命令。

  </Tab>
  <Tab title="啟用方式">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 選擇啟用（預設：false）
        },
      },
    }
    ```

    啟用此旗標，且未明確設定 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs` 時，防彈跳時間窗會擴大為 **7000 ms**（舊版預設為 0 ms，即不進行防彈跳）。之所以需要較寬的時間窗，是因為 Apple 的 URL 預覽分拆傳送節奏可能延長至數秒，期間 Messages.app 會發出預覽資料列。

    若要自行調整時間窗：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms 可涵蓋觀察到的 Messages.app URL 預覽延遲。
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="權衡取捨">
    - **精確合併需要目前的 `imsg` 承載內容中繼資料。** 若存在 `balloon_bundle_id`，只會合併實際的分拆傳送；上述缺少中繼資料時的備援合併屬於暫時性的向後相容機制，待 `imsg` 在上游合併分拆傳送後即會移除。
    - **私訊訊息會增加延遲。** 啟用此旗標後，每則私訊（包括獨立控制命令和單一文字後續訊息）在分派前最多會等待防彈跳時間窗，以確認是否會有 URL 預覽資料列送達。群組聊天訊息仍會立即分派。
    - **合併輸出有明確上限。** 合併文字上限為 4000 個字元，並附加明確的 `…[truncated]` 標記；附件上限為 20 個；來源項目上限為 10 個（超過時保留第一個和最新項目）。每個來源 GUID 都會在 `coalescedMessageGuids` 中追蹤，以供下游遙測使用。
    - **僅限私訊。** 群組聊天會改由逐則訊息分派，讓多人同時輸入時，機器人仍能保持回應。
    - **選擇啟用，且依頻道設定。** 其他頻道（Discord、Slack、Telegram、WhatsApp 等）不受影響。設定 `channels.bluebubbles.coalesceSameSenderDms` 的舊版 BlueBubbles 設定應將該值遷移至 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 情境與代理程式所看到的內容

「啟用旗標」欄顯示會發出 `balloon_bundle_id` 的 `imsg` 組建之行為。在完全不發出泡泡中繼資料的舊版 `imsg` 組建中，下方標示為「兩個回合」/「N 個回合」的資料列會改用舊版合併（一個回合）：OpenClaw 無法從結構上區分分拆傳送與分開傳送，因此會保留中繼資料推出前的合併行為。組建開始發出泡泡中繼資料後，才會啟用精確分離。

| 使用者編寫內容                                                      | `chat.db` 產生的結果                  | 關閉旗標（預設）                      | 啟用旗標 + 時間窗（imsg 發出泡泡中繼資料）                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                              | 2 個資料列，相隔約 1 秒                   | 代理程式分成兩個回合：先只有「Dump」，之後才是 URL | 一個回合：合併文字 `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption`（附件 + 文字）                | 2 個不含 URL 泡泡中繼資料的資料列 | 兩個回合                               | 觀察到中繼資料後為兩個回合；在舊版/鎖定前且缺少中繼資料的工作階段中，為一個合併回合       |
| `/status`（獨立命令）                                     | 1 個資料列                               | 立即分派                        | **最多等待至時間窗結束，然後分派**                                                                |
| 僅貼上 URL                                                   | 1 個資料列                               | 立即分派                        | 最多等待至時間窗結束，然後分派                                                                    |
| 文字 + URL 刻意分成兩則訊息傳送，間隔數分鐘 | 2 個位於時間窗外的資料列               | 兩個回合                               | 兩個回合（時間窗在兩者之間到期）                                                             |
| 快速大量傳送（時間窗內超過 10 則小型私訊）                          | N 個不含 URL 泡泡中繼資料的資料列 | N 個回合                                 | 觀察到中繼資料後為 N 個回合；在舊版/鎖定前且缺少中繼資料的工作階段中，為一個有界合併回合 |
| 兩人在群組聊天中輸入                                  | 來自 M 個傳送者的 N 個資料列               | M+ 個回合（每個傳送者批次各一個）        | M+ 個回合 — 群組聊天不會合併                                                            |

## 橋接器或閘道重新啟動後的傳入復原

iMessage 會復原閘道停機期間錯過的訊息，同時抑制 Apple 在 Push 復原後可能大量送出的過時「待處理訊息炸彈」。此預設行為一律啟用，並以傳入去重為基礎。

- **重播去重。** 每則已分派的傳入訊息都會依其 Apple GUID 記錄在持久化外掛狀態（`imessage.inbound-dedupe`）中，於擷取時宣告，並在處理後提交（發生暫時性失敗時則釋放，以便重試）。任何已處理的內容都會遭到捨棄，而不會再次分派。這使復原作業能積極重播，無須逐則訊息記帳。
- **停機復原。** 啟動時，監控器會記住最後分派的 `chat.db` rowid（持久化的個別帳號游標），並將其作為 `since_rowid` 傳遞給 `imsg watch.subscribe`，讓 imsg 重播閘道停機期間送達的資料列，之後再追蹤即時資料。重播範圍限制為最近 500 個資料列，且訊息時間不得早於約 2 小時前；去重機制會捨棄任何已處理的內容。
- **過期待處理訊息年齡界線。** 啟動邊界以上的資料列是真正的即時資料；若其傳送日期比抵達時間早逾約 15 分鐘，便屬於 Push 集中送出的待處理訊息，將受到抑制。重播資料列（位於邊界或邊界以下）則使用較寬的復原時間窗，因此最近錯過的訊息會送達，而久遠的歷史訊息不會送達。

復原適用於本機與遠端 `cliPath` 設定，因為 `since_rowid` 重播會透過相同的 `imsg` RPC 連線執行。差異在於時間窗：當閘道可讀取 `chat.db`（本機）時，它會錨定啟動 rowid 邊界、限制重播範圍，並傳遞最多約數小時前錯過的訊息。透過遠端 SSH `cliPath` 時，它無法讀取資料庫，因此重播不設上限，且每個資料列都使用即時年齡界線；它仍會復原最近錯過的訊息並抑制舊的待處理訊息，只是即時時間窗較窄。請在執行「訊息」的 Mac 上執行閘道，以獲得較寬的復原時間窗。

### 操作員可見的訊號

受抑制的待處理訊息會以預設層級記錄，絕不會無聲捨棄（`recovery` 旗標會顯示套用的是哪個時間窗）：

```text
imessage: 已抑制過時的傳入待處理訊息 account=<id> sent=<iso> recovery=<bool>（啟動後已抑制 <N> 則）
```

### 遷移

`channels.imessage.catchup.*` 已淘汰 — 停機復原為自動執行，新設定無須任何設定。含有 `catchup.enabled: true` 的現有設定仍會作為復原重播時間窗的相容性設定檔而受到支援。已停用的追補區塊（`enabled: false` 或沒有 `enabled: true`）已淘汰；`openclaw doctor --fix` 會將其移除。

## 疑難排解

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支援 RPC">
    驗證二進位檔與 RPC 支援：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探測回報不支援 RPC，請更新 `imsg`。如果無法使用私有 API 動作，請在已登入的 macOS 使用者工作階段中執行 `imsg launch`，然後再次探測。如果閘道未在 macOS 上執行，請使用上方的透過 SSH 連線遠端 Mac 設定，而非預設的本機 `imsg` 路徑。

  </Accordion>

  <Accordion title="可以傳送訊息，但未收到傳入的 iMessage">
    首先確認訊息是否已抵達本機 Mac。如果 `chat.db` 沒有變更，即使 `imsg status --json` 回報橋接器狀態良好，OpenClaw 仍無法接收該訊息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果從手機傳送的訊息未建立新資料列，請先修復 macOS「訊息」與 Apple Push 層，再變更 OpenClaw 設定。通常只需執行一次服務重新整理即可：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    從手機傳送一則新的 iMessage，並確認出現新的 `chat.db` 資料列或 `imsg watch` 事件，再開始偵錯 OpenClaw 工作階段。請勿將此操作設為定期重新啟動橋接器的迴圈；進行中的工作若反覆執行 `imsg launch` 並重新啟動閘道，可能會中斷訊息傳遞，並使傳輸中的頻道執行停滯。

  </Accordion>

  <Accordion title="閘道未在 macOS 上執行">
    預設的 `cliPath: "imsg"` 必須在已登入 Messages 的 Mac 上執行。在 Linux 或 Windows 上，請將 `channels.imessage.cliPath` 設為包裝函式指令碼，透過 SSH 連線至該 Mac 並執行 `imsg "$@"`。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    然後執行：

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="私人訊息遭到忽略">
    請檢查：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 配對核准（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="群組訊息遭到忽略">
    請檢查：

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 允許清單行為
    - 提及模式設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="遠端附件傳送失敗">
    請檢查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 從閘道主機進行 SSH/SCP 金鑰驗證
    - 閘道主機上的 `~/.ssh/known_hosts` 中是否存在主機金鑰
    - 執行 Messages 的 Mac 是否可讀取遠端路徑

  </Accordion>

  <Accordion title="錯過了 macOS 權限提示">
    請在相同使用者／工作階段環境中的互動式 GUI 終端機內重新執行，並核准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    確認執行 OpenClaw/`imsg` 的程序環境已取得 Full Disk Access + Automation 權限。

  </Accordion>
</AccordionGroup>

## 設定參考連結

- [設定參考資料－iMessage](/zh-TW/gateway/config-channels#imessage)
- [閘道設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [移除 BlueBubbles 與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 公告與遷移摘要
- [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles) — 設定轉換表與逐步切換流程
- [配對](/zh-TW/channels/pairing) — 私人訊息驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及管控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與安全強化
