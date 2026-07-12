---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送／接收問題
summary: 透過 imsg（基於 stdio 的 JSON-RPC）提供原生 iMessage 支援，並使用私有 API 執行回覆、表情回應、效果、投票、附件及群組管理操作。若主機需求符合，建議新的 OpenClaw iMessage 設定優先採用此方式。
title: iMessage
x-i18n:
    generated_at: "2026-07-12T14:18:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 81819aad1a9199791c3c02eb0c9cc72059c663710140b33ba31f79b4bc59d8e2
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於一般的 OpenClaw iMessage 部署，請在同一台已登入「訊息」的 macOS 主機上執行閘道與 `imsg`。如果你的閘道在其他位置執行，請將 `channels.imessage.cliPath` 指向透明的 SSH 包裝指令碼，由它在 Mac 上執行 `imsg`。

**輸入訊息復原會自動進行。** 橋接器或閘道重新啟動後，iMessage 會重播停機期間遺漏的訊息，並抑制 Apple 在推播復原後可能一次湧入的陳舊「待處理訊息轟炸」，同時進行去重，確保不會重複分派任何訊息。無需透過設定啟用 — 請參閱[橋接器或閘道重新啟動後的輸入訊息復原](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
已移除 BlueBubbles 支援。請將 `channels.bluebubbles` 設定遷移至 `channels.imessage`；OpenClaw 僅透過 `imsg` 支援 iMessage。簡短公告請先閱讀 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整遷移表則請參閱[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。
</Warning>

狀態：原生外部命令列介面整合。閘道會啟動 `imsg rpc`，並透過標準輸入輸出使用 JSON-RPC 通訊 — 不需要獨立的常駐程式或連接埠。強烈建議使用私有 API 模式，以獲得功能完整的 iMessage 頻道；回覆、點按回應、特效、投票、附件回覆及群組操作都需要執行 `imsg launch`，並成功通過私有 API 探測。

在常見的本機設定中，OpenClaw 設定流程可以在已登入「訊息」的 Mac 上，提供經使用者確認的 Homebrew `imsg` 安裝或更新。手動設定與 SSH 包裝指令碼拓撲仍由操作者管理：請在將執行閘道或包裝指令碼的同一使用者環境中安裝或更新 `imsg`。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#private-api-actions">
    回覆、點按回應、特效、投票、附件及群組管理。
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

        當本機設定精靈偵測到預設的 `imsg` 命令不存在時，可以提示透過 Homebrew 安裝 `steipete/tap/imsg`。如果偵測到由 Homebrew 管理的 `imsg`，則可以提示重新安裝或更新。自訂的 `cliPath` 包裝指令碼不會被修改。

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

        配對要求會在 1 小時後失效。
      </Step>
    </Steps>

  </Tab>

  <Tab title="透過 SSH 使用遠端 Mac">
    大多數設定不需要 SSH。只有在閘道無法於已登入「訊息」的 Mac 上執行時，才使用此拓撲。OpenClaw 只需要與標準輸入輸出相容的 `cliPath`，因此你可以將 `cliPath` 指向一個包裝指令碼，由它透過 SSH 連線至遠端 Mac 並執行 `imsg`。
    請在該遠端 Mac 上安裝及更新 `imsg`，而不是在閘道主機上：

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

    如果未設定 `remoteHost`，OpenClaw 會嘗試剖析 SSH 包裝指令碼以自動偵測。
    `remoteHost` 必須是 `host` 或 `user@host`（不得包含空格或 SSH 選項）；不安全的值會被忽略。
    OpenClaw 對 SCP 使用嚴格的主機金鑰檢查，因此中繼主機金鑰必須已存在於 `~/.ssh/known_hosts`。
    附件路徑會依允許的根目錄（`attachmentRoots` / `remoteAttachmentRoots`）進行驗證。

<Warning>
你放在 `imsg` 前方的任何 `cliPath` 包裝指令碼或 SSH Proxy，都**必須**像透明的標準輸入輸出管線一樣處理長時間執行的 JSON-RPC。OpenClaw 會在頻道的整個生命週期中，透過包裝指令碼的 stdin/stdout 交換以換行框定的小型 JSON-RPC 訊息：

- 每當有位元組可用時，**立即**轉送每個 stdin 區塊／行 — 不要等待 EOF。
- 朝反方向即時轉送每個 stdout 區塊／行。
- 保留換行字元。
- 避免可能使小型訊框無法獲得處理的固定大小阻塞讀取（`read(4096)`、`cat | buffer`、Shell 預設的 `read`）。
- 將 stderr 與 JSON-RPC 的 stdout 串流分開。

如果包裝指令碼會緩衝 stdin，直到填滿大型區塊，便會產生看似 iMessage 中斷的症狀 — `imsg rpc timeout (chats.list)` 或頻道反覆重新啟動 — 即使 `imsg rpc` 本身運作正常。上述的 `ssh -T host imsg "$@"` 是安全的，因為它會轉送 OpenClaw 的 `cliPath` 引數，例如 `rpc` 與 `--db`。`ssh host imsg | grep -v '^DEBUG'` 這類管線則**不安全** — 行緩衝工具仍可能扣留訊框；如果你必須進行篩選，請在每個階段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 需求與權限（macOS）

- 執行 `imsg` 的 Mac 必須已登入「訊息」。
- 執行 OpenClaw／`imsg` 的處理程序環境需要「完全取用磁碟」權限（用於存取「訊息」資料庫）。
- 透過 Messages.app 傳送訊息需要「自動化」權限。
- 若要使用進階操作（回應／編輯／收回／討論串回覆／特效／投票／群組操作），必須停用「系統完整性保護」— 請參閱[啟用 imsg 私有 API](#enabling-the-imsg-private-api)。不停用也能進行基本的文字與媒體傳送／接收。

<Tip>
權限是依處理程序環境授予的。如果閘道以無頭模式執行（LaunchAgent／SSH），請在同一環境中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "測試"
```

</Tip>

<Accordion title="SSH 包裝指令碼傳送失敗，並出現 AppleEvents -1743">
  遠端 SSH 設定可能可以讀取聊天、通過 `channels status --probe`，並處理輸入訊息，但傳出訊息仍會因 AppleEvents 授權錯誤而失敗：

```text
未獲授權將 Apple 事件傳送至「訊息」。（-1743）
```

檢查已登入 Mac 使用者的 TCC 資料庫或 System Settings > Privacy & Security > Automation。如果「自動化」項目記錄的是 `/usr/libexec/sshd-keygen-wrapper`，而非 `imsg` 或本機 Shell 處理程序，macOS 可能不會為該 SSH 伺服器端用戶端顯示可用的「訊息」切換開關：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在此狀態下，重複執行 `tccutil reset AppleEvents`，或透過相同的 SSH 包裝指令碼重新執行 `imsg send`，可能仍會失敗，因為需要「訊息」自動化權限的處理程序環境是 SSH 包裝指令碼，而不是 UI 可以授予權限的 App。

請改用其中一種受支援的 `imsg` 處理程序環境：

- 在已登入「訊息」的使用者本機工作階段中執行閘道，或至少執行 `imsg` 橋接器。
- 從同一工作階段授予「完全取用磁碟」與「自動化」權限後，使用該使用者的 LaunchAgent 啟動閘道。
- 如果你保留雙使用者 SSH 拓撲，請在啟用頻道前，確認實際的傳出 `imsg send` 能透過指定的包裝指令碼成功執行。如果無法授予「自動化」權限，請重新設定為單一使用者的 `imsg` 設定，而不要依賴 SSH 包裝指令碼進行傳送。

</Accordion>

## 啟用 imsg 私有 API

`imsg` 提供兩種運作模式。對 OpenClaw 而言，建議使用私有 API 模式，因為它能為頻道提供使用者期望的原生 iMessage 操作。基本模式仍適用於低風險安裝、初始驗證，或無法停用 SIP 的主機。

- **基本模式**（預設，不需要變更 SIP）：透過 `send` 傳出文字與媒體、監看／歷史記錄輸入訊息，以及聊天清單。全新執行 `brew install steipete/tap/imsg`，並授予上述標準 macOS 權限後，即可使用這些功能。
- **私有 API 模式**：`imsg` 會將輔助 dylib 注入 `Messages.app`，以呼叫內部 `IMCore` 函式。這會解鎖 `react`、`edit`、`unsend`、`reply`（討論串）、`sendWithEffect`、`poll` 與 `poll-vote`（「訊息」原生投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及輸入狀態指示器和已讀回條。

本頁建議的操作功能需要私有 API 模式。`imsg` README 明確說明此需求：

> `read`、`typing`、`launch`、橋接器支援的豐富傳送、訊息變更及聊天管理等進階功能皆為選用。這些功能需要停用 SIP，並將輔助 dylib 注入 `Messages.app`。啟用 SIP 時，`imsg launch` 會拒絕注入。

輔助注入技術會使用 `imsg` 自己的 dylib 存取「訊息」私有 API。OpenClaw iMessage 路徑中沒有第三方伺服器或 BlueBubbles 執行階段。

<Warning>
**停用 SIP 確實會帶來安全性取捨。** SIP 是 macOS 防止執行經修改系統程式碼的核心保護機制之一；在整個系統中將其關閉會增加額外的攻擊面與副作用。特別要注意，**在 Apple Silicon Mac 上停用 SIP，也會同時停用在 Mac 上安裝及執行 iOS App 的能力**。

請將此視為審慎的操作決策，尤其是在主要個人 Mac 上。若要達到正式環境品質的 OpenClaw iMessage，建議使用專用 Mac 或機器人 macOS 使用者，並確保你能接受啟用該橋接器。如果你的威脅模型無法容許任何位置停用 SIP，隨附的 iMessage 功能將僅限於基本模式 — 只能傳送／接收文字和媒體，不支援回應／編輯／收回／特效／群組操作。
</Warning>

### 設定

1. 在執行 Messages.app 的 Mac 上**安裝（或升級）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 輸出會回報 `bridge_version`、`rpc_methods` 及各方法的 `selectors`，讓你能在開始前查看目前組建支援哪些功能。

2. **停用「系統完整性保護」，並且（在較新的 macOS 上）停用「程式庫驗證」。** 若要將非 Apple 的輔助 dylib 注入由 Apple 簽署的 `Messages.app`，必須停用 SIP，**並且**放寬程式庫驗證。復原模式中的 SIP 操作步驟會因 macOS 版本而異：
   - **macOS 10.13-10.15（Sierra-Catalina）：**透過終端機停用「程式庫驗證」、重新啟動至復原模式、執行 `csrutil disable`，然後重新啟動。
   - **macOS 11+（Big Sur 及更新版本），Intel：**進入復原模式（或網際網路復原）、執行 `csrutil disable`，然後重新啟動。
   - **macOS 11+，Apple Silicon：**使用電源按鈕啟動程序進入復原模式；在近期的 macOS 版本上，按一下 Continue 時請按住 **Left Shift** 鍵，然後執行 `csrutil disable`。虛擬機器設定使用不同的流程，因此請先建立 VM 快照。

   **在 macOS 11 及更新版本上，僅執行 `csrutil disable` 通常還不夠。** Apple 仍會將 `Messages.app` 視為平台二進位檔並對其強制執行程式庫驗證，因此即使已關閉 SIP，臨時簽署的輔助程式仍會遭到拒絕（`Library Validation failed: ... platform binary, but mapped file is not`）。停用 SIP 後，也請停用程式庫驗證並重新啟動：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe)，已在 26.5.1 驗證：** 關閉 SIP **並**執行上述 `DisableLibraryValidation` 命令，就足以在 26.0 至 26.5.x 中注入輔助程式。**不需要任何 boot-args。** 該 plist 是決定性因素，也是 Tahoe 上注入失敗時最常遺漏的步驟：
   - **有 plist：** `imsg launch` 會完成注入，而 `imsg status` 會回報 `advanced_features: true`。
   - **沒有 plist（即使已關閉 SIP）：** `imsg launch` 會失敗並顯示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 會在載入時拒絕臨時簽署的輔助程式，因此橋接器永遠無法就緒，啟動作業最終會逾時。這個逾時是大多數人在 Tahoe 上遇到的症狀；修正方式是使用上述 plist，而不是採取更激烈的措施。

   如果 macOS 升級後，`imsg launch` 注入或特定 `selectors` 開始傳回 false，通常就是這項限制所致。在認定 SIP 步驟本身失敗之前，請先檢查 SIP 與程式庫驗證狀態。如果這些設定正確，但橋接器仍無法注入，請收集 `imsg status --json` 與 `imsg launch` 的輸出，並向 `imsg` 專案回報，而不要進一步削弱其他全系統安全控制。

3. **注入輔助程式。** 停用 SIP 並登入 Messages.app 後：

   ```bash
   imsg launch
   ```

   SIP 仍啟用時，`imsg launch` 會拒絕注入，因此這也可用來確認步驟 2 已生效。

4. **從 OpenClaw 驗證橋接器：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 項目應回報 `works`，而 `imsg status --json | jq '{rpc_methods, selectors}'` 應顯示你的 macOS 組建所公開的功能。建立投票需要 `selectors.pollPayloadMessage`；投票則同時需要 `selectors.pollVoteMessage` 與 `poll.vote` RPC 方法。OpenClaw 外掛只會公布快取探測結果支援的動作；快取為空時則會維持樂觀判定，並在首次分派時探測。

如果 `openclaw channels status --probe` 將頻道回報為 `works`，但特定動作在分派時擲回 "iMessage `<action>` requires the imsg private API bridge"，請再次執行 `imsg launch`——輔助程式可能會中斷（Messages.app 重新啟動、作業系統更新等），而快取的 `available: true` 狀態會持續公布這些動作，直到下一次探測更新為止。

### SIP 維持啟用時

如果你的威脅模型不允許停用 SIP：

- `imsg` 會退回基本模式——僅支援文字、媒體與接收。
- OpenClaw 外掛仍會公布文字／媒體傳送與傳入訊息監控功能；它會依各方法的功能限制，從動作介面隱藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 與群組操作。
- 你可以使用另一台非 Apple Silicon Mac（或專用機器人 Mac），關閉其 SIP 以處理 iMessage 工作負載，同時讓主要裝置維持啟用 SIP。請參閱下方的[專用機器人 macOS 使用者（獨立的 iMessage 身分）](#deployment-patterns)。

## 存取控制與路由

<Tabs>
  <Tab title="私訊政策">
    `channels.imessage.dmPolicy` 控制直接訊息：

    - `pairing`（預設）
    - `allowlist`（至少需要一個 `allowFrom` 項目）
    - `open`（需要讓 `allowFrom` 包含 `"*"`）
    - `disabled`

    允許清單欄位：`channels.imessage.allowFrom`。

    允許清單項目必須識別傳送者：控制代碼或靜態傳送者存取群組（`accessGroup:<name>`）。針對 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目標，請使用 `channels.imessage.groupAllowFrom`；針對數字 `chat_id` 登錄鍵，請使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群組政策與提及">
    `channels.imessage.groupPolicy` 控制群組處理方式：

    - `allowlist`（預設）
    - `open`
    - `disabled`

    群組傳送者允許清單：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 項目也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。

    執行階段退回行為：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會使用 `allowFrom`；當私訊與群組的准入條件應不同時，請設定 `groupAllowFrom`。明確設為空的 `groupAllowFrom: []` 不會退回使用其他設定——在 `allowlist` 下，它會封鎖所有群組傳送者。
    執行階段注意事項：如果完全缺少 `channels.imessage`，執行階段會退回使用 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    <Warning>
    在 `groupPolicy: "allowlist"` 下，群組路由會連續執行**兩道**限制：

    1. **傳送者允許清單**（`channels.imessage.groupAllowFrom`）——控制代碼、`accessGroup:<name>`、`chat_guid`、`chat_identifier` 或 `chat_id`。有效清單為空（沒有 `groupAllowFrom`，也沒有可退回使用的 `allowFrom`）時，會封鎖所有群組傳送者。
    2. **群組登錄**（`channels.imessage.groups`）——對應表包含項目後即會強制執行：聊天必須符合明確的個別 `chat_id` 項目或 `groups: { "*": { ... } }` 萬用字元。`groups` 為空或不存在時，只由傳送者允許清單決定是否准入。

    如果沒有設定有效的群組傳送者允許清單，所有群組訊息都會在進入登錄限制前遭到捨棄。每道限制在預設記錄層級下都有自己的 `warn` 層級訊號，且各自指出不同的修正方式：

    - 啟動時每個帳號僅出現一次，當有效的群組傳送者允許清單為空時：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`——請設定 `channels.imessage.groupAllowFrom`（或 `allowFrom`）來修正；僅新增 `groups` 項目仍會讓限制 1 封鎖所有傳送者。
    - 執行階段每個 `chat_id` 僅出現一次，當傳送者通過限制 1，但聊天不存在於已有內容的 `groups` 登錄中時：`imessage: dropping group message from chat_id=<id> ...`——請在 `channels.imessage.groups` 下新增該 `chat_id`（或 `"*"`）來修正。

    私訊不受影響——它們會採用不同的程式碼路徑。

    在 `groupPolicy: "allowlist"` 下，群組流程的建議設定：

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

    僅設定 `groupAllowFrom` 就會允許這些傳送者進入任何群組；加入 `groups` 區塊可限制允許哪些聊天（並設定 `requireMention` 等個別聊天選項）。
    </Warning>

    群組提及限制：

    - iMessage 沒有原生提及中繼資料
    - 提及偵測使用規則運算式模式（`agents.list[].groupChat.mentionPatterns`，退回使用 `messages.groupChat.mentionPatterns`）
    - 未設定任何模式時，無法強制執行提及限制
    - 已授權傳送者的控制命令會略過提及限制

    個別群組的 `systemPrompt`：

    `channels.imessage.groups.*` 下的每個項目都接受選用的 `systemPrompt` 字串；每次處理該群組中的訊息時，這個字串都會注入代理程式的系統提示詞。解析方式與 `channels.whatsapp.groups` 相同：

    1. **群組專屬系統提示詞**（`groups["<chat_id>"].systemPrompt`）：當對應表中存在特定群組項目，**且**已定義其 `systemPrompt` 鍵時使用。如果 `systemPrompt` 是空字串（`""`），則會抑制萬用字元，不對該群組套用任何系統提示詞。
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
              systemPrompt: "這是值班輪調聊天。回覆請控制在 3 句以內。",
            },
            "9907": {
              // 明確抑制：此處不套用萬用字元的「使用英式拼字。」
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    個別群組提示詞只會套用至群組訊息——直接訊息不受影響。

  </Tab>

  <Tab title="工作階段與確定性回覆">
    - 私訊使用直接路由；群組使用群組路由。
    - 使用預設的 `session.dmScope=main` 時，iMessage 私訊會合併至代理程式的主要工作階段。
    - 群組工作階段彼此隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用來源頻道／目標中繼資料路由回 iMessage。

    類群組討論串行為：

    某些包含多位參與者的 iMessage 討論串可能會以 `is_group=false` 傳入。
    如果該 `chat_id` 已在 `channels.imessage.groups` 下明確設定，OpenClaw 會將其視為群組流量（群組限制與群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

iMessage 聊天可以繫結至 ACP 工作階段。

操作員快速流程：

- 在私訊或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 同一個 iMessage 對話中的後續訊息會路由至新建立的 ACP 工作階段。
- `/new` 與 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

設定的持續性繫結使用頂層 `bindings[]` 項目，其中包含 `type: "acp"` 與 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 正規化的私訊控制代碼，例如 `+15555550123` 或 `user@example.com`
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

共用 ACP 繫結行為請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 部署模式

<AccordionGroup>
  <Accordion title="專用機器人 macOS 使用者（獨立的 iMessage 身分）">
    使用專用 Apple ID 與 macOS 使用者，將機器人流量與你的個人 Messages 設定檔隔離。

    一般流程：

    1. 建立／登入專用的 macOS 使用者。
    2. 在該使用者中使用機器人 Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH 包裝函式，讓 OpenClaw 能在該使用者環境中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 與 `.dbPath` 指向該使用者設定檔。

    首次執行時，可能需要在該機器人使用者工作階段的圖形介面中核准權限（Automation + Full Disk Access）。

  </Accordion>

  <Accordion title="透過 Tailscale 使用遠端 Mac（範例）">
    常見拓撲：

    - 閘道在 Linux／VM 上執行
    - iMessage 與 `imsg` 在你 tailnet 中的 Mac 上執行
    - `cliPath` 包裝函式使用 SSH 執行 `imsg`
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

    使用 SSH 金鑰，讓 SSH 和 SCP 都能以非互動方式執行。
    請先確認主機金鑰已受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填入 `known_hosts`。

  </Accordion>

  <Accordion title="多帳號模式">
    iMessage 支援在 `channels.imessage.accounts` 下設定各帳號的組態。

    每個帳號都可覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史記錄設定，以及附件根目錄允許清單等欄位。

  </Accordion>

  <Accordion title="私訊歷史記錄">
    設定 `channels.imessage.dmHistoryLimit`，即可使用該對話近期經過解碼的 `imsg` 歷史記錄，為新的私訊工作階段提供初始內容。使用 `channels.imessage.dms["<sender>"].historyLimit` 可針對個別傳送者覆寫此設定，包括設為 `0` 以停用該傳送者的歷史記錄。

    iMessage 私訊歷史記錄會視需要從 `imsg` 擷取。若未設定 `dmHistoryLimit`，將停用全域私訊歷史記錄的初始內容填入功能，但若個別傳送者的 `channels.imessage.dms["<sender>"].historyLimit` 為正數，仍會為該傳送者啟用此功能。

  </Accordion>
</AccordionGroup>

## 媒體、分段與傳遞目標

<AccordionGroup>
  <Accordion title="附件與媒體">
    - 預設**不會**擷取傳入附件——設定 `channels.imessage.includeAttachments: true`，即可將照片、語音備忘錄、影片及其他附件轉送給代理程式。停用時，僅含附件的 iMessage 會在到達代理程式前遭到捨棄，甚至可能完全不會產生 `Inbound message` 記錄行。
    - 設定 `remoteHost` 後，可透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 設定的根目錄會擴充預設根目錄模式 `/Users/*/Library/Messages/Attachments`（合併，而非取代）
    - SCP 會使用嚴格的主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 傳出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="傳出文字與分段">
    - 文字分段限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分段模式：`channels.imessage.streaming.chunkMode`
      - `length`（預設）
      - `newline`（優先依段落分割）
    - 傳出的 Markdown 粗體／斜體／底線／刪除線會轉換為原生樣式文字（macOS 15+ 的收件者會看到樣式；較舊版本的收件者則會看到不含標記的純文字）；Markdown 表格會依頻道的 Markdown 表格模式轉換
    - `channels.imessage.sendTransport`（預設為 `auto`，另有 `bridge`、`applescript`）會選擇 `imsg` 傳送訊息的方式

  </Accordion>

  <Accordion title="定址格式">
    建議使用明確的目標：

    - `chat_id:123`（建議用於穩定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支援帳號識別目標：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 私有 API 動作

當 `imsg launch` 正在執行，且 `openclaw channels status --probe` 回報 `privateApi.available: true` 時，訊息工具除了傳送一般文字外，還可使用 iMessage 原生動作。

所有動作預設皆為啟用；使用 `channels.imessage.actions` 可個別關閉動作：

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
    - **react**：新增／移除 iMessage 點按回應（`messageId`、`emoji`、`remove`）。支援的點按回應會對應至愛心、喜歡、不喜歡、大笑、強調及疑問。不指定表情符號直接移除時，會清除已設定的任何點按回應。
    - **reply**：對現有訊息傳送討論串回覆（`messageId`、`text` 或 `message`，再加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。若要回覆並附加附件，還需要使用其 `send-rich` 支援 `--file` 的 `imsg` 組建版本。
    - **sendWithEffect**：使用 iMessage 特效傳送文字（`text` 或 `message`、`effect` 或 `effectId`）。簡短名稱：slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **edit**：在受支援的 macOS／私有 API 版本上編輯已傳送的訊息（`messageId`、`text` 或 `newText`）。只能編輯由閘道本身傳送的訊息。
    - **unsend**：在受支援的 macOS／私有 API 版本上收回已傳送的訊息（`messageId`）。只能收回由閘道本身傳送的訊息。
    - **upload-file**：傳送媒體／檔案（以 base64 表示的 `buffer`，或已具體化的 `media`／`path`／`filePath`、`filename`，以及選用的 `asVoice`）。舊版別名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：目前目標為群組對話時，用於管理群組聊天。這些動作會變更主機的「訊息」身分，因此必須由擁有者傳送者或 `operator.admin` 閘道用戶端執行。
    - **poll**：建立原生 Apple「訊息」投票（`pollQuestion`、重複 2 至 12 次的 `pollOption`，再加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。使用 iOS／iPadOS／macOS 26+ 的收件者能以原生方式檢視及投票；較舊的作業系統版本會收到 “Sent a poll” 文字備援訊息。需要 `selectors.pollPayloadMessage`。
    - **poll-vote**：對現有投票進行投票（`pollId` 或 `messageId`，再從 `pollOptionIndex`、`pollOptionId` 或 `pollOptionText` 中恰好指定一項）。需要 `selectors.pollVoteMessage` 與 `poll.vote` RPC 方法。

    已接受的傳入投票會為代理程式呈現問題、編號的選項標籤、票數，以及 `poll-vote` 所需的投票訊息 ID。

  </Accordion>

  <Accordion title="訊息 ID">
    傳入的 iMessage 情境在可用時會同時包含簡短的 `MessageSid` 值與完整訊息 GUID（`MessageSidFull`）。簡短 ID 僅適用於近期由 SQLite 支援的回覆快取，使用前會檢查其是否屬於目前聊天。如果簡短 ID 已過期或屬於其他聊天，請改用完整的 `MessageSidFull` 重試。

  </Accordion>

  <Accordion title="功能偵測">
    只有在快取的探查狀態顯示橋接器不可用時，OpenClaw 才會隱藏私有 API 動作。如果狀態未知，動作仍會顯示，並在分派時延遲探查，因此執行 `imsg launch` 後，第一個動作即可成功，而不需要另外手動重新整理狀態。

  </Accordion>

  <Accordion title="讀取回條與輸入狀態">
    私有 API 橋接器啟動後，已接受的傳入聊天會標記為已讀，而私訊聊天會在回合獲接受後立即顯示輸入泡泡，此時代理程式會準備情境並產生內容。使用以下設定停用標記為已讀：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早於逐方法功能清單的舊版 `imsg` 組建會靜默關閉輸入狀態／讀取回條；OpenClaw 每次重新啟動時會記錄一次警告，以便確認缺少回條的原因。

  </Accordion>

  <Accordion title="傳入點按回應">
    OpenClaw 會訂閱 iMessage 點按回應，並將已接受的回應路由為系統事件，而非一般訊息文字，因此使用者的點按回應不會觸發一般回覆循環。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（預設）：僅在使用者對機器人撰寫的訊息做出回應時通知。
    - `"all"`：針對來自已授權傳送者的所有傳入點按回應發出通知。
    - `"off"`：忽略傳入點按回應。

    每個帳號的覆寫設定使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="核准回應（👍 / 👎）">
    當 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 為 true，且要求路由至 iMessage 時，閘道會以原生方式傳遞核准提示，並接受點按回應來解決要求：

    - `👍`（喜歡點按回應）→ `allow-once`
    - `👎`（不喜歡點按回應）→ `deny`
    - `allow-always` 仍為手動備援方式：以一般回覆傳送 `/approve <id> allow-always`。

    回應處理要求做出回應之使用者的帳號識別必須是明確的核准者。核准者清單讀取自 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）；請加入使用者採 E.164 格式的電話號碼或其 Apple ID 電子郵件地址（`chat_id:*` 等聊天目標不是有效的核准者項目）。萬用字元項目 `"*"` 會生效，但會允許任何傳送者核准；空白的核准者清單會完全停用回應捷徑。回應捷徑會刻意略過 `reactionNotifications`、`dmPolicy` 與 `groupAllowFrom`，因為明確核准者允許清單是解決核准要求時唯一重要的關卡。

    `/approve` 文字命令授權遵循相同清單：當 `channels.imessage.allowFrom` 非空白時，會依該核准者清單（而非較廣泛的私訊允許清單）授權 `/approve <id> <decision>`；獲私訊允許清單允許但不在 `allowFrom` 中的傳送者，會收到明確的拒絕。當 `allowFrom` 為空白時，同一聊天的備援機制仍會生效，且 `/approve` 會授權私訊允許清單所允許的任何人。請將所有應能透過 `/approve` 或回應進行核准的操作員加入 `allowFrom`。

    操作員注意事項：
    - 回應繫結會同時儲存在記憶體與閘道的持久化鍵值儲存區中（TTL 與核准到期時間一致），而閘道也會輪詢待處理提示中的點按回應，因此即使點按回應在閘道重新啟動後不久才送達，仍可解決核准要求。
    - 當操作員的帳號識別是明確核准者時，其本人的 `is_from_me=true` 點按回應（例如來自已配對的 Apple 裝置）會解決核准要求。
    - 只有在設定明確核准者時，核准提示才會路由至群組對話；否則任何群組成員都可能核准。
    - 舊版文字樣式的點按回應（非常舊的 Apple 用戶端傳送的 `Liked "…"` 純文字）無法解決核准要求，因為其中不含訊息 GUID；回應解決功能需要目前 macOS／iOS 用戶端所發出的結構化點按回應中繼資料。

  </Accordion>
</AccordionGroup>

## 組態寫入

iMessage 預設允許由頻道發起組態寫入（當 `commands.config: true` 時，用於 `/config set|unset`）。

停用方式：

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

## 合併分次傳送的私訊（在一次撰寫中包含命令與 URL）

當使用者同時輸入命令和 URL（例如 `Dump https://example.com/article`）時，Apple 的「訊息」App 會將傳送內容拆分為 **兩個獨立的 `chat.db` 資料列**：

1. 一則文字訊息（`"Dump"`）。
2. 一個 URL 預覽泡泡（`"https://..."`），並以附件形式包含 OG 預覽圖片。

在大多數設定中，這兩個資料列抵達 OpenClaw 的時間會相隔約 0.8-2.0 秒。若未進行合併，代理程式會在第 1 回合只收到命令（並且常會回覆 “send me the URL”），之後 URL 才於第 2 回合抵達。這是 Apple 的傳送管線所造成，並非 OpenClaw 或 `imsg` 引入的行為。

`channels.imessage.coalesceSameSenderDms` 會讓私訊選擇將連續且來自相同傳送者的資料列納入緩衝。當 `imsg` 在其中一個來源資料列上提供結構化 URL 預覽標記 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 時，OpenClaw 只會合併這個真正的分次傳送，並將其他已緩衝的資料列保留為個別輪次。在完全不會發出氣泡中繼資料的舊版 `imsg` 組建中，OpenClaw 無法區分分次傳送與個別傳送，因此會退回合併該批次。這會保留引入中繼資料前的行為，而不會讓 `Dump <url>` 分次傳送退化為兩個輪次。群組聊天仍會逐則訊息分派，以保留多使用者的輪次結構。

<Tabs>
  <Tab title="何時啟用">
    適合在下列情況啟用：

    - 你提供的 skills 預期在一則訊息中收到 `command + payload`（傾印、貼上、儲存、排入佇列等）。
    - 你的使用者會將 URL 與命令一起貼上。
    - 你可以接受增加的私訊輪次延遲（請見下文）。

    適合在下列情況保持停用：

    - 對於單字私訊觸發條件，你需要最低的命令延遲。
    - 你的所有流程都是沒有後續承載內容的一次性命令。

  </Tab>
  <Tab title="啟用">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 選擇啟用（預設值：false）
        },
      },
    }
    ```

    啟用此旗標且未明確設定 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs` 時，防彈跳時間窗會擴大為 **7000 ms**（舊版預設值為 0 ms，亦即不進行防彈跳）。之所以需要較寬的時間窗，是因為 Apple 的 URL 預覽分次傳送節奏可能持續數秒，期間 Messages.app 會發出預覽資料列。

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
  <Tab title="取捨">
    - **精準合併需要目前的 `imsg` 承載內容中繼資料。** 若存在 `balloon_bundle_id`，則只會合併真正的分次傳送；上述無中繼資料時的退回合併是暫時性的向後相容措施，等 `imsg` 在上游合併分次傳送後即會移除。
    - **私訊訊息會增加延遲。** 啟用此旗標後，每則私訊（包括獨立的控制命令及單一文字後續訊息）都會在分派前等待最多一個防彈跳時間窗，以確認是否即將收到 URL 預覽資料列。群組聊天訊息仍會立即分派。
    - **合併輸出有上限。** 合併後的文字上限為 4000 個字元，並會加上明確的 `…[truncated]` 標記；附件上限為 20 個；來源項目上限為 10 個（超過時保留第一個及最新項目）。每個來源 GUID 都會記錄在 `coalescedMessageGuids` 中，供下游遙測使用。
    - **僅限私訊。** 群組聊天會改為逐則訊息分派，讓多人輸入時機器人仍能迅速回應。
    - **選擇啟用，且依頻道設定。** 其他頻道（Discord、Slack、Telegram、WhatsApp 等）不受影響。設定了 `channels.bluebubbles.coalesceSameSenderDms` 的舊版 BlueBubbles 設定，應將該值遷移至 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 情境及代理程式看到的內容

“啟用旗標”欄顯示會發出 `balloon_bundle_id` 的 `imsg` 組建之行為。在完全不會發出氣泡中繼資料的舊版 `imsg` 組建中，下表標示為“兩個輪次”／“N 個輪次”的資料列會改為退回舊版合併（一個輪次）：OpenClaw 無法從結構上區分分次傳送與個別傳送，因此會保留引入中繼資料前的合併行為。組建開始發出氣泡中繼資料後，就會啟用精準分離。

| 使用者撰寫                                                         | `chat.db` 產生的內容                  | 停用旗標（預設）                           | 啟用旗標 + 時間窗（imsg 發出氣泡中繼資料）                                                        |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                              | 2 個資料列，相隔約 1 s               | 兩個代理程式輪次：先只有“Dump”，接著是 URL | 一個輪次：合併文字 `Dump https://example.com`                                                      |
| `Save this 📎image.jpg caption`（附件 + 文字）                      | 2 個沒有 URL 氣泡中繼資料的資料列     | 兩個輪次                                  | 觀察到中繼資料後為兩個輪次；舊版／鎖定前的無中繼資料工作階段則為一個合併輪次                         |
| `/status`（獨立命令）                                              | 1 個資料列                            | 立即分派                                  | **等待最多一個時間窗，然後分派**                                                                    |
| 單獨貼上 URL                                                       | 1 個資料列                            | 立即分派                                  | 等待最多一個時間窗，然後分派                                                                        |
| 文字 + URL 刻意分成兩則訊息傳送，相隔數分鐘                         | 時間窗外的 2 個資料列                  | 兩個輪次                                  | 兩個輪次（兩者之間時間窗已到期）                                                                    |
| 快速大量傳送（時間窗內超過 10 則小型私訊）                          | N 個沒有 URL 氣泡中繼資料的資料列      | N 個輪次                                  | 觀察到中繼資料後為 N 個輪次；舊版／鎖定前的無中繼資料工作階段則為一個有上限的合併輪次                 |
| 兩人在群組聊天中輸入                                               | 來自 M 位傳送者的 N 個資料列           | M+ 個輪次（每個傳送者批次一個）            | M+ 個輪次——群組聊天不會合併                                                                         |

## 橋接器或閘道重新啟動後的傳入訊息復原

iMessage 會復原閘道停機期間遺漏的訊息，同時抑制 Apple 在 Push 復原後可能大量送出的陳舊“積壓炸彈”。預設行為一律啟用，並以傳入訊息去重複機制為基礎。

- **重播去重複。** 每則已分派的傳入訊息都會依其 Apple GUID 記錄於持久化外掛狀態（`imessage.inbound-dedupe`）中，在擷取時宣告處理權，並於處理後提交（若暫時失敗則釋放，讓其可以重試）。任何已處理的項目都會遭捨棄，而不會重複分派。正因如此，復原可以積極重播，而不需要逐則訊息記帳。
- **停機復原。** 啟動時，監控器會記住最後一個已分派的 `chat.db` rowid（每個帳號各有一個持久化游標），並將其以 `since_rowid` 傳給 `imsg watch.subscribe`，讓 imsg 重播閘道停機期間寫入的資料列，然後持續追蹤即時資料。重播範圍以最近 500 個資料列及最久約 2 小時的訊息為限，而去重複機制會捨棄任何已處理的項目。
- **陳舊積壓的訊息年齡界線。** 啟動邊界之上的資料列確實是即時資料；若某個資料列的傳送日期比其抵達時間早超過約 15 分鐘，即屬於 Push 大量送出的積壓資料，因此會遭抑制。重播的資料列（位於邊界或邊界以下）則使用較寬的復原時間窗，因此最近遺漏的訊息會被傳遞，而久遠的歷史訊息則不會。

本機及遠端 `cliPath` 設定都支援復原，因為 `since_rowid` 重播會透過相同的 `imsg` RPC 連線執行。兩者的差異在於時間窗：當閘道可以讀取 `chat.db`（本機）時，它會固定啟動 rowid 邊界、限制重播跨度，並傳遞最久約數小時前遺漏的訊息。透過遠端 SSH `cliPath` 時，它無法讀取資料庫，因此重播沒有數量上限，而且每個資料列都使用即時訊息年齡界線——它仍可復原最近遺漏的訊息，也仍會抑制舊的積壓資料，只是採用較窄的即時時間窗。若要使用較寬的復原時間窗，請在執行 Messages 的 Mac 上執行閘道。

### 操作者可見的訊號

遭抑制的積壓資料會以預設層級記錄，絕不會無聲捨棄（`recovery` 旗標會顯示套用哪個時間窗）：

```text
imessage: 已抑制陳舊的傳入積壓資料 account=<id> sent=<iso> recovery=<bool>（自啟動後已抑制 <N> 個）
```

### 遷移

`channels.imessage.catchup.*` 已淘汰——停機復原會自動進行，新設定不需要任何組態。既有設定中的 `catchup.enabled: true` 仍會作為復原重播時間窗的相容性設定檔受到支援。已停用的補追區塊（`enabled: false` 或沒有 `enabled: true`）已退役；`openclaw doctor --fix` 會移除這些區塊。

## 疑難排解

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支援 RPC">
    驗證二進位檔及 RPC 支援：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    若探測回報不支援 RPC，請更新 `imsg`。若無法使用私有 API 動作，請在已登入的 macOS 使用者工作階段中執行 `imsg launch`，然後再次探測。如果閘道不是在 macOS 上執行，請改用上述透過 SSH 連線遠端 Mac 的設定，而非預設的本機 `imsg` 路徑。

  </Accordion>

  <Accordion title="可以傳送 Messages，但收不到傳入的 iMessage">
    首先確認訊息是否已抵達本機 Mac。若 `chat.db` 沒有變更，即使 `imsg status --json` 回報橋接器運作正常，OpenClaw 也無法接收訊息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果從手機傳送的訊息沒有建立新資料列，請先修復 macOS Messages 與 Apple Push 層，再變更 OpenClaw 組態。通常執行一次服務重新整理即可：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    從手機傳送一則新的 iMessage，並先確認有新的 `chat.db` 資料列或 `imsg watch` 事件，再對 OpenClaw 工作階段進行偵錯。請勿將此操作設為週期性橋接器重新啟動迴圈；工作進行期間重複執行 `imsg launch` 並重新啟動閘道，可能中斷傳遞並使進行中的頻道執行停滯。

  </Accordion>

  <Accordion title="閘道未在 macOS 上執行">
    預設的 `cliPath: "imsg"` 必須在已登入 Messages 的 Mac 上執行。在 Linux 或 Windows 上，請將 `channels.imessage.cliPath` 設為透過 SSH 連線至該 Mac 並執行 `imsg "$@"` 的包裝函式指令碼。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    接著執行：

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="私訊遭忽略">
    檢查：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 配對核准（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="群組訊息遭忽略">
    檢查：

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 允許清單行為
    - 提及模式組態（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="遠端附件失敗">
    檢查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 從閘道主機使用 SSH/SCP 金鑰驗證
    - 閘道主機的 `~/.ssh/known_hosts` 中存在主機金鑰
    - 在執行 Messages 的 Mac 上可讀取遠端路徑

  </Accordion>

  <Accordion title="錯過 macOS 權限提示">
    請在相同使用者／工作階段環境中的互動式圖形介面終端機重新執行，並核准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    確認執行 OpenClaw／`imsg` 的程序環境已獲授 Full Disk Access + Automation。

  </Accordion>
</AccordionGroup>

## 設定參考指南

- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
- [閘道設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [移除 BlueBubbles 與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 公告與遷移摘要
- [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles) — 設定轉換表與逐步切換流程
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與安全強化
