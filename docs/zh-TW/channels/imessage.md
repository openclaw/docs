---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送／接收問題
summary: 透過 imsg（經由 stdio 的 JSON-RPC）提供原生 iMessage 支援，並具備用於回覆、點按回應、特效、投票、附件及群組管理的私有 API 操作。若符合主機需求，建議新的 OpenClaw iMessage 設定優先採用此方式。
title: iMessage
x-i18n:
    generated_at: "2026-07-19T13:34:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 215364b4a0424db3fccb27e29815f2a94c55ebe66d1eec21ed85e4b7947ea1ab
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於一般的 OpenClaw iMessage 部署，請在同一部已登入「訊息」的 macOS 主機上執行閘道與 `imsg`。如果閘道在其他位置執行，請將 `channels.imessage.cliPath` 指向透明的 SSH 包裝指令碼，由它在 Mac 上執行 `imsg`。

**輸入訊息復原會自動進行。** 橋接器或閘道重新啟動後，iMessage 會重播停機期間錯過的訊息，並抑制 Apple 在推播復原後可能大量送出的過時「積壓訊息炸彈」，同時進行去重，確保不會重複分派任何內容。無須設定即可啟用——請參閱[橋接器或閘道重新啟動後的輸入訊息復原](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支援已移除。請將 `channels.bluebubbles` 設定遷移至 `channels.imessage`；OpenClaw 僅透過 `imsg` 支援 iMessage。簡短公告請先參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整遷移表則請參閱[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。
</Warning>

狀態：原生外部命令列介面整合。閘道會啟動 `imsg rpc`，並透過標準輸入輸出使用 JSON-RPC 通訊——不需要獨立的常駐程式或連接埠。強烈建議使用私有 API 模式，以獲得完整的 iMessage 頻道功能；回覆、點按回應、特效、投票、附件回覆及群組操作都需要 `imsg launch`，且私有 API 探測必須成功。

對於常見的本機設定，OpenClaw 設定流程可在已登入「訊息」的 Mac 上，經使用者確認後透過 Homebrew 安裝或更新 `imsg`。手動設定與 SSH 包裝指令碼拓撲仍由操作人員管理：請在將執行閘道或包裝指令碼的同一使用者環境中安裝或更新 `imsg`。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#private-api-actions">
    回覆、點按回應、特效、投票、附件及群組管理。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    iMessage 私訊預設使用配對模式。
  </Card>
  <Card title="遠端 Mac" icon="terminal" href="#remote-mac-over-ssh">
    當閘道並非在「訊息」Mac 上執行時，請使用 SSH 包裝指令碼。
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

        當本機設定精靈偵測到缺少預設的 `imsg` 命令時，可以提示透過 Homebrew 安裝 `steipete/tap/imsg`。如果偵測到由 Homebrew 管理的 `imsg`，則可提示重新安裝或更新。自訂的 `cliPath` 包裝指令碼不會遭到修改。

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

      <Step title="核准第一次私訊配對（預設 dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配對要求會在 1 小時後失效。
      </Step>
    </Steps>

  </Tab>

  <Tab title="透過 SSH 使用遠端 Mac">
    大多數設定都不需要 SSH。僅當閘道無法在已登入「訊息」的 Mac 上執行時，才使用此拓撲。OpenClaw 僅需要與標準輸入輸出相容的 `cliPath`，因此可將 `cliPath` 指向一個透過 SSH 連線至遠端 Mac 並執行 `imsg` 的包裝指令碼。
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
      // 選用：額外允許的附件根目錄（與預設的
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
任何放在 `imsg` 前方的 `cliPath` 包裝指令碼或 SSH Proxy，都「必須」像透明的標準輸入輸出管道一樣處理長時間運作的 JSON-RPC。頻道運作期間，OpenClaw 會透過包裝指令碼的標準輸入／輸出交換以換行分框的小型 JSON-RPC 訊息：

- 一有位元組可用，就**立即**轉送每個標準輸入區塊／行——不要等待 EOF。
- 以相反方向迅速轉送每個標準輸出區塊／行。
- 保留換行字元。
- 避免使用固定大小的阻塞讀取（`read(4096)`、`cat | buffer`、Shell 預設的 `read`），以免小型框架無法獲得處理。
- 將標準錯誤與 JSON-RPC 標準輸出串流分開。

如果包裝指令碼會緩衝標準輸入，直到填滿大型區塊才轉送，就會產生看似 iMessage 中斷的症狀——`imsg rpc timeout (chats.list)` 或頻道反覆重新啟動——即使 `imsg rpc` 本身運作正常。上方的 `ssh -T host imsg "$@"` 是安全的，因為它會轉送 OpenClaw 的 `cliPath` 引數，例如 `rpc` 和 `--db`。`ssh host imsg | grep -v '^DEBUG'` 這類管線則「不安全」——採用行緩衝的工具仍可能扣留框架；若必須篩選，請在每個階段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 需求與權限（macOS）

- 執行 `imsg` 的 Mac 必須已登入「訊息」。
- 執行 OpenClaw／`imsg` 的程序環境需要「完整磁碟存取權」（用於存取「訊息」資料庫）。
- 透過 Messages.app 傳送訊息需要「自動化」權限。
- 若要使用進階操作（回應／編輯／收回／討論串回覆／特效／投票／群組操作），必須停用「系統完整性保護」——請參閱[啟用 imsg 私有 API](#enabling-the-imsg-private-api)。基本文字與媒體的傳送及接收不需要停用。

<Tip>
權限是依程序環境授予的。如果閘道以無頭模式執行（LaunchAgent／SSH），請在同一環境中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "測試"
```

</Tip>

<Accordion title="SSH 包裝指令碼傳送失敗並出現 AppleEvents -1743">
  遠端 SSH 設定可能可以讀取聊天、通過 `channels status --probe` 並處理輸入訊息，但傳出訊息仍會因 AppleEvents 授權錯誤而失敗：

```text
未獲授權將 Apple 事件傳送至「訊息」。（-1743）
```

請檢查已登入 Mac 使用者的 TCC 資料庫，或「系統設定 > 隱私權與安全性 > 自動化」。如果「自動化」項目記錄的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本機 Shell 程序，macOS 可能不會為該 SSH 伺服器端用戶端提供可用的「訊息」開關：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在此狀態下，重複執行 `tccutil reset AppleEvents`，或透過同一個 SSH 包裝指令碼重新執行 `imsg send`，可能仍會持續失敗，因為需要「訊息」自動化權限的程序環境是 SSH 包裝指令碼，而不是介面可以授予權限的應用程式。

請改用以下其中一種受支援的 `imsg` 程序環境：

- 在已登入「訊息」的使用者本機工作階段中執行閘道，或至少執行 `imsg` 橋接器。
- 從同一工作階段授予「完整磁碟存取權」與「自動化」權限後，使用該使用者的 LaunchAgent 啟動閘道。
- 如果保留雙使用者 SSH 拓撲，請在啟用頻道前，確認透過該確切包裝指令碼執行真正的傳出 `imsg send` 能夠成功。如果無法授予「自動化」權限，請改為設定單一使用者的 `imsg`，不要依賴 SSH 包裝指令碼傳送訊息。

</Accordion>

## 啟用 imsg 私有 API

`imsg` 提供兩種運作模式。對於 OpenClaw，建議使用私有 API 模式，因為它能為頻道提供使用者所期待的原生 iMessage 操作。基本模式仍適合低風險安裝、初步驗證，或無法停用 SIP 的主機。

- **基本模式**（預設，無須變更 SIP）：透過 `send` 傳送文字與媒體、監看／記錄輸入訊息，以及聊天列表。全新安裝 `brew install steipete/tap/imsg` 並授予上述標準 macOS 權限後，即可直接使用這些功能。
- **私有 API 模式**：`imsg` 會將輔助 dylib 注入 `Messages.app`，以呼叫內部 `IMCore` 函式。這會解鎖 `react`、`edit`、`unsend`、`reply`（討論串）、`sendWithEffect`、`poll` 與 `poll-vote`（「訊息」原生投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及輸入狀態指示器和已讀回條。

此頁面建議的操作功能需要私有 API 模式。`imsg` README 明確說明此需求：

> `read`、`typing`、`launch`、橋接器支援的豐富傳送、訊息修改及聊天管理等進階功能需要選擇啟用。這些功能要求停用 SIP，並將輔助 dylib 注入 `Messages.app`。啟用 SIP 時，`imsg launch` 會拒絕注入。

輔助程式注入技術會使用 `imsg` 自己的 dylib 來存取「訊息」的私有 API。OpenClaw iMessage 路徑中沒有第三方伺服器或 BlueBubbles 執行階段。

<Warning>
**停用 SIP 確實會帶來安全性的取捨。** SIP 是 macOS 防止執行遭修改系統程式碼的核心保護機制之一；在整個系統停用 SIP 會增加攻擊面並帶來其他副作用。尤其要注意，**在 Apple Silicon Mac 上停用 SIP，也會讓你無法在 Mac 上安裝及執行 iOS App**。

請將此視為審慎且有意識的維運選擇，尤其是在主要的個人 Mac 上。若要達到生產品質的 OpenClaw iMessage，建議使用專用 Mac 或專用的機器人 macOS 使用者，並確認你可以接受啟用該橋接器。如果你的威脅模型無法容忍任何位置停用 SIP，內建 iMessage 功能將受限於基本模式——僅能傳送及接收文字和媒體，不支援回應／編輯／收回／特效／群組操作。
</Warning>

### 設定

1. 在執行 Messages.app 的 Mac 上**安裝（或升級）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 輸出會回報 `bridge_version`、`rpc_methods`，以及各方法的 `selectors`，讓你在開始前瞭解目前的版本支援哪些功能。

2. **停用系統完整性保護，並且（在現代 macOS 上）停用程式庫驗證。** 若要將非 Apple 的輔助 dylib 注入由 Apple 簽署的 `Messages.app`，必須關閉 SIP **並**放寬程式庫驗證。復原模式中的 SIP 步驟因 macOS 版本而異：
   - **macOS 10.13-10.15（Sierra-Catalina）：**透過終端機停用程式庫驗證，重新啟動進入復原模式，執行 `csrutil disable`，再重新啟動。
   - **macOS 11+（Big Sur 及更新版本），Intel：**進入復原模式（或網際網路復原），執行 `csrutil disable`，再重新啟動。
   - **macOS 11+，Apple Silicon：**使用電源按鈕啟動流程進入復原模式；在近期的 macOS 版本中，按一下 Continue 時按住 **Left Shift** 鍵，然後執行 `csrutil disable`。虛擬機器設定採用不同流程，因此請先建立 VM 快照。

   **在 macOS 11 及更新版本上，僅執行 `csrutil disable` 通常不足。** Apple 仍會將 `Messages.app` 視為平台二進位檔並對其強制執行程式庫驗證，因此即使已關閉 SIP，臨時簽署的輔助程式仍會遭到拒絕（`Library Validation failed: ... platform binary, but mapped file is not`）。停用 SIP 後，也請停用程式庫驗證並重新啟動：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已在 26.5.1 驗證：**關閉 SIP **加上**執行上述 `DisableLibraryValidation` 命令，足以在 26.0 至 26.5.x 上注入輔助程式。**不需要任何 boot-args。** 此 plist 是決定性因素，也是 Tahoe 上注入失敗時最常遺漏的步驟：
   - **有 plist：**`imsg launch` 會成功注入，且 `imsg status` 會回報 `advanced_features: true`。
   - **沒有 plist（即使已關閉 SIP）：**`imsg launch` 會失敗並顯示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 會在載入時拒絕臨時簽署的輔助程式，因此橋接器永遠不會就緒，啟動最終會逾時。大多數人在 Tahoe 上遇到的症狀就是此逾時；修正方式是使用上述 plist，而不是採取更激進的措施。

   如果 macOS 升級後，`imsg launch` 注入或特定 `selectors` 開始傳回 false，通常是此閘門所致。在認定 SIP 步驟本身失敗前，請先檢查 SIP 與程式庫驗證狀態。如果這些設定正確，但橋接器仍無法注入，請收集 `imsg status --json` 以及 `imsg launch` 的輸出，並向 `imsg` 專案回報，而不要進一步削弱其他系統層級的安全性控制。

3. **注入輔助程式。** 在 SIP 已停用且 Messages.app 已登入的情況下：

   ```bash
   imsg launch
   ```

   當 SIP 仍啟用時，`imsg launch` 會拒絕注入，因此這也可同時確認步驟 2 已生效。

4. **從 OpenClaw 驗證橋接器：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 項目應回報 `works`，而 `imsg status --json | jq '{rpc_methods, selectors}'` 應顯示你的 macOS 組建所公開的功能。建立投票需要 `selectors.pollPayloadMessage`；投票則同時需要 `selectors.pollVoteMessage` 與 `poll.vote` RPC 方法。OpenClaw 外掛只會公布快取探測所支援的動作；快取為空時則維持樂觀判定，並在第一次分派時進行探測。

如果 `openclaw channels status --probe` 將頻道回報為 `works`，但特定動作在分派時擲出「iMessage `<action>` requires the imsg private API bridge」，請再次執行 `imsg launch`——輔助程式可能會脫離（Messages.app 重新啟動、作業系統更新等），而快取的 `available: true` 狀態會持續公布動作，直到下一次探測重新整理為止。

### SIP 保持啟用時

如果你的威脅模型無法接受停用 SIP：

- `imsg` 會回復為基本模式——僅支援文字、媒體與接收。
- OpenClaw 外掛仍會公布文字／媒體傳送與傳入訊息監控；它會從動作介面隱藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 及群組操作（依各方法的功能閘門而定）。
- 你可以使用另一台非 Apple Silicon Mac（或專用機器人 Mac），關閉其 SIP 以處理 iMessage 工作負載，同時讓主要裝置保持啟用 SIP。請參閱下方的[專用機器人 macOS 使用者（獨立的 iMessage 身分）](#deployment-patterns)。

## 存取控制與路由

<Tabs>
  <Tab title="私訊政策">
    `channels.imessage.dmPolicy` 控制直接訊息：

    - `pairing`（預設）
    - `allowlist`（需要至少一個 `allowFrom` 項目）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    允許清單欄位：`channels.imessage.allowFrom`。

    允許清單項目必須識別傳送者：控制代碼或靜態傳送者存取群組（`accessGroup:<name>`）。對 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 等聊天目標使用 `channels.imessage.groupAllowFrom`；對數字 `chat_id` 登錄機碼使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="群組政策與提及">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（預設）
    - `open`
    - `disabled`

    群組傳送者允許清單：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 項目也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。

    執行階段後援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會使用 `allowFrom`；當私訊與群組的准入條件應有所不同時，請設定 `groupAllowFrom`。明確設為空的 `groupAllowFrom: []` 不會後援——它會在 `allowlist` 下封鎖所有群組傳送者。
    執行階段注意事項：如果完全缺少 `channels.imessage`，執行階段會後援至 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    <Warning>
    `groupPolicy: "allowlist"` 下的群組路由會連續執行**兩個**閘門：

    1. **傳送者允許清單**（`channels.imessage.groupAllowFrom`）——控制代碼、`accessGroup:<name>`、`chat_guid`、`chat_identifier` 或 `chat_id`。有效清單為空（沒有 `groupAllowFrom`，也沒有 `allowFrom` 後援）時，會封鎖所有群組傳送者。
    2. **群組登錄**（`channels.imessage.groups`）——對應表有項目後即會強制執行：聊天必須符合明確的各 `chat_id` 項目或 `groups: { "*": { ... } }` 萬用字元。當 `groups` 為空或缺少時，只由傳送者允許清單決定是否准入。

    如果未設定有效的群組傳送者允許清單，每則群組訊息都會在登錄閘門前遭到捨棄。每個閘門在預設記錄層級都有自己的 `warn` 層級訊號，且各自指出不同的修正方式：

    - 每個帳號在啟動時僅一次，當有效的群組傳送者允許清單為空：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`——透過設定 `channels.imessage.groupAllowFrom`（或 `allowFrom`）修正；僅新增 `groups` 項目仍會讓閘門 1 封鎖所有傳送者。
    - 執行階段中每個 `chat_id` 僅一次，當傳送者通過閘門 1，但聊天不存在於已有內容的 `groups` 登錄中：`imessage: dropping group message from chat_id=<id> ...`——透過在 `channels.imessage.groups` 下新增該 `chat_id`（或 `"*"`）來修正。

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

    僅設定 `groupAllowFrom` 即可允許這些傳送者進入任何群組；新增 `groups` 區塊可限定允許哪些聊天（並設定 `requireMention` 等各聊天選項）。
    </Warning>

    群組的提及閘門：

    - iMessage 沒有原生提及中繼資料
    - 提及偵測使用規則運算式模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 若未設定任何模式，便無法強制執行提及閘門
    - 來自已授權傳送者的控制命令會略過提及閘門

    各群組 `systemPrompt`：

    `channels.imessage.groups.*` 下的每個項目都接受選用的 `systemPrompt` 字串；每次處理該群組中的訊息時，此字串都會注入代理程式的系統提示詞。解析方式與 `channels.whatsapp.groups` 相同：

    1. **群組專屬系統提示詞**（`groups["<chat_id>"].systemPrompt`）：特定群組項目存在於對應表中，**且**其 `systemPrompt` 鍵已有定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會遭到抑制，且不會對該群組套用任何系統提示詞。
    2. **群組萬用字元系統提示詞**（`groups["*"].systemPrompt`）：特定群組項目完全不存在於對應表中，或該項目存在但未定義 `systemPrompt` 鍵時使用。

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
              systemPrompt: "這是值班輪值聊天。回覆請少於 3 句。",
            },
            "9907": {
              // 明確抑制：萬用字元「使用英式拼字。」不適用於此處
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    各群組提示詞僅適用於群組訊息——直接訊息不受影響。

  </Tab>

  <Tab title="工作階段與確定性回覆">
    - 私訊使用直接路由；群組使用群組路由。
    - 使用預設的 `session.dmScope=main` 時，iMessage 私訊會合併至代理程式的主要工作階段。
    - 群組工作階段彼此隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用來源頻道／目標中繼資料路由回 iMessage。

    類群組對話串行為：

    某些有多名參與者的 iMessage 對話串可能會隨 `is_group=false` 傳入。
    如果該 `chat_id` 已在 `channels.imessage.groups` 下明確設定，OpenClaw 會將其視為群組流量（群組閘門與群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

iMessage 聊天可以繫結至 ACP 工作階段。

快速操作流程：

- 在私訊或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 相同 iMessage 對話中的後續訊息會路由至衍生的 ACP 工作階段。
- `/new` 和 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

設定的持續性繫結使用頂層 `bindings[]` 項目，其中包含 `type: "acp"` 和 `match.channel: "imessage"`。

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

請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)，以瞭解共用的 ACP 繫結行為。

## 部署模式

<AccordionGroup>
  <Accordion title="專用機器人 macOS 使用者（獨立的 iMessage 身分）">
    使用專用的 Apple ID 與 macOS 使用者，讓機器人流量與你的個人 Messages 個人檔案隔離。

    一般流程：

    1. 建立／登入專用的 macOS 使用者。
    2. 在該使用者中，使用機器人的 Apple ID 登入「訊息」。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH 包裝指令碼，讓 OpenClaw 能在該使用者的環境中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向該使用者設定檔。

    第一次執行時，可能需要在該機器人使用者的工作階段中透過 GUI 核准權限（自動化 + 完整磁碟存取權）。

  </Accordion>

  <Accordion title="透過 Tailscale 使用遠端 Mac（範例）">
    常見拓撲：

    - 閘道在 Linux／VM 上執行
    - iMessage + `imsg` 在 tailnet 中的 Mac 上執行
    - `cliPath` 包裝指令碼使用 SSH 執行 `imsg`
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
    請先確認主機金鑰受到信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填入 `known_hosts`。

  </Accordion>

  <Accordion title="多帳號模式">
    iMessage 支援在 `channels.imessage.accounts` 下設定各帳號。

    每個帳號都能覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史記錄設定及附件根目錄允許清單等欄位。

  </Accordion>

  <Accordion title="私人訊息歷史記錄">
    設定 `channels.imessage.dmHistoryLimit`，以使用該對話近期已解碼的 `imsg` 歷史記錄，為新的私人訊息工作階段提供初始內容。使用 `channels.imessage.dms["<sender>"].historyLimit` 設定各傳送者的覆寫值，包括以 `0` 停用特定傳送者的歷史記錄。

    iMessage 私人訊息歷史記錄會視需要從 `imsg` 擷取。未設定 `dmHistoryLimit` 會停用全域私人訊息歷史記錄的初始填入，但特定傳送者的 `channels.imessage.dms["<sender>"].historyLimit` 若為正值，仍會為該傳送者啟用初始填入。

  </Accordion>
</AccordionGroup>

## 媒體、分段與傳遞目標

<AccordionGroup>
  <Accordion title="附件與媒體">
    - 輸入附件擷取功能**預設關閉**——設定 `channels.imessage.includeAttachments: true`，即可將照片、語音備忘錄、影片及其他附件轉送給代理程式。停用時，僅含附件的 iMessage 會在送達代理程式前遭捨棄，甚至可能完全不會產生 `Inbound message` 記錄行。
    - 設定 `remoteHost` 後，可透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 設定的根目錄會擴充預設根目錄模式 `/Users/*/Library/Messages/Attachments`（合併，而非取代）
    - SCP 使用嚴格的主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 輸出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="輸出文字與分段">
    - 文字分段限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分段模式：`channels.imessage.streaming.chunkMode`
      - `length`（預設）
      - `newline`（優先依段落分割）
    - 輸出的 Markdown 粗體／斜體／底線／刪除線會轉換為原生樣式文字（macOS 15+ 的收件者會看到樣式；使用較舊版本的收件者則會看到不含標記的純文字）；Markdown 表格會依頻道的 Markdown 表格模式轉換
    - `channels.imessage.sendTransport`（`auto` 為預設值，另有 `bridge`、`applescript`）選擇 `imsg` 傳送訊息的方式

  </Accordion>

  <Accordion title="定址格式">
    建議使用明確目標：

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

所有動作預設為啟用；使用 `channels.imessage.actions` 可個別關閉動作：

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
    - **回應**：新增／移除 iMessage 點按回應（`messageId`、`emoji`、`remove`）。支援的點按回應對應愛心、喜歡、不喜歡、大笑、強調及疑問。移除時若未指定表情符號，會清除目前設定的任何點按回應。
    - **回覆**：對現有訊息傳送討論串回覆（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。以附件回覆時，還需要 `imsg` 組建版本，且其 `send-rich` 必須支援 `--file`。
    - **使用特效傳送**：使用 iMessage 特效傳送文字（`text` 或 `message`，以及 `effect` 或 `effectId`）。簡稱：slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **編輯**：在支援的 macOS／私有 API 版本上編輯已傳送的訊息（`messageId`、`text` 或 `newText`）。只有閘道本身傳送的訊息可供編輯。
    - **收回**：在支援的 macOS／私有 API 版本上收回已傳送的訊息（`messageId`）。只有閘道本身傳送的訊息可供收回。
    - **上傳檔案**：傳送媒體／檔案（以 base64 表示的 `buffer`，或已取得內容的 `media`/`path`/`filePath`、`filename`，以及選用的 `asVoice`）。舊版別名：`sendAttachment`。
    - **重新命名群組**、**設定群組圖示**、**新增參與者**、**移除參與者**、**離開群組**：目前目標為群組對話時，用於管理群組聊天。這些動作會修改主機的「訊息」身分，因此需要擁有者傳送者或 `operator.admin` 閘道用戶端。
    - **投票**：建立原生 Apple「訊息」投票（`pollQuestion`、重複 2 到 12 次的 `pollOption`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。使用 iOS／iPadOS／macOS 26+ 的收件者能以原生方式查看並投票；較舊的作業系統版本則會收到「已傳送投票」的文字後援內容。需要 `selectors.pollPayloadMessage`。
    - **投票表決**：對現有投票進行表決（`pollId` 或 `messageId`，並且只能從 `pollOptionIndex`、`pollOptionId` 或 `pollOptionText` 中選擇一項）。需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。

    已接受的輸入投票會呈現給代理程式，內容包括問題、編號選項標籤、票數，以及 `poll-vote` 所需的投票訊息 ID。

  </Accordion>

  <Accordion title="訊息 ID">
    輸入的 iMessage 情境會同時包含簡短的 `MessageSid` 值，以及可用時的完整訊息 GUID（`MessageSidFull`）。簡短 ID 的有效範圍限於近期以 SQLite 為基礎的回覆快取，使用前會檢查其是否屬於目前聊天。若簡短 ID 已過期，請在將目標設為提供該 ID 的對話時，改用其 `MessageSidFull` 重試。完整 ID 無法略過對話或帳號繫結，因此若 ID 來自其他聊天，請將其替換為目前目標中的 ID。當缺少目前對話的證據時，遠端委派呼叫可能會拒絕過期的完整 ID。

  </Accordion>

  <Accordion title="功能偵測">
    OpenClaw 只有在快取的探測狀態顯示橋接器無法使用時，才會隱藏私有 API 動作。如果狀態未知，動作仍會顯示，並在分派時延遲探測，讓 `imsg launch` 後的第一個動作無須另行手動重新整理狀態即可成功。

  </Accordion>

  <Accordion title="已讀回條與輸入狀態">
    私有 API 橋接器啟動後，已接受的輸入聊天會標記為已讀；私人聊天則會在該輪對話獲接受後立即顯示輸入泡泡，並持續到代理程式準備情境及產生回覆時。若要停用已讀標記：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    在個別方法功能清單機制之前的舊版 `imsg` 組建版本，會以靜默方式關閉輸入狀態／已讀功能；OpenClaw 每次重新啟動只會記錄一次警告，以便將缺少回條的情況歸因於此。

  </Accordion>

  <Accordion title="輸入點按回應">
    OpenClaw 會訂閱 iMessage 點按回應，並將已接受的回應路由為系統事件，而非一般訊息文字，因此使用者的點按回應不會觸發一般回覆迴圈。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（預設）：只有當使用者回應機器人撰寫的訊息時才通知。
    - `"all"`：針對已授權傳送者的所有輸入點按回應發出通知。
    - `"off"`：忽略輸入點按回應。

    各帳號的覆寫值使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="核准回應（👍 / 👎）">
    當 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 為 true，且要求路由至 iMessage 時，閘道會以原生方式傳遞核准提示，並接受點按回應以解決該要求：

    - `👍`（喜歡點按回應）→ `allow-once`
    - `👎`（不喜歡點按回應）→ `deny`
    - `allow-always` 仍是手動後援方式：以一般回覆傳送 `/approve <id> allow-always`。

    回應處理要求做出回應的使用者代號必須明確列為核准者。核准者清單讀取自 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）；請加入使用者採 E.164 格式的電話號碼或其 Apple ID 電子郵件地址（`chat_id:*` 等聊天目標不是有效的核准者項目）。系統會接受萬用字元項目 `"*"`，但這會允許任何傳送者進行核准；空白的核准者清單則會完全停用回應捷徑。回應捷徑會刻意略過 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因為明確的核准者允許清單是解決核准要求時唯一重要的關卡。

    `/approve` 文字命令授權使用相同清單：當 `channels.imessage.allowFrom` 非空時，會依該核准者清單（而非範圍較廣的私人訊息允許清單）授權 `/approve <id> <decision>`；獲私人訊息允許清單准許但未列於 `allowFrom` 的傳送者，會收到明確的拒絕訊息。當 `allowFrom` 為空時，同一聊天的後援行為會繼續生效，而 `/approve` 會授權私人訊息允許清單准許的任何人。請將所有應能透過 `/approve` 或回應進行核准的操作人員加入 `allowFrom`。

    操作員注意事項：
    - 回應繫結會同時儲存在記憶體與閘道的持久化鍵值儲存區中（TTL 與核准到期時間一致），而且閘道也會輪詢待處理提示中的點按回應，因此即使點按回應在閘道重新啟動後不久才送達，仍可完成核准。
    - 當操作員自己的 `is_from_me=true` 點按回應（例如來自已配對的 Apple 裝置）所屬識別代號是明確核准者時，該回應會完成核准。
    - 只有設定明確核准者時，核准提示才會路由至群組對話；否則任何群組成員都可能核准。
    - 舊版文字樣式的點按回應（來自非常舊的 Apple 用戶端的 `Liked "…"` 純文字）無法完成核准，因為其中不含訊息 GUID；回應解析需要目前 macOS / iOS 用戶端所發出的結構化點按回應中繼資料。

  </Accordion>

  <Accordion title="問題回應（1️⃣ / 2️⃣ / 3️⃣ / 4️⃣）">
    對於包含一個非機密、單選問題及一至四個選項的 `ask_user` 提示，OpenClaw 會加入編號表情符號選項。以相符的數字回應已送達的提示即可作答。該回應必須包含由機器人撰寫之訊息的穩定 GUID；接著 OpenClaw 會透過閘道將數字對應至標準選項。過期或重複的點按會被忽略。

    多問題、多選及自由文字提示仍只能透過文字回覆。問題回應遵循一般 iMessage 私訊／群組准入規則。即使一般 `reactionNotifications` 為 `"off"`，仍會辨識這些回應，且不會將無關的回應轉換成代理程式事件。

  </Accordion>
</AccordionGroup>

## 設定寫入

iMessage 預設允許由頻道發起設定寫入（適用於 `commands.config: true` 時的 `/config set|unset`）。

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

## 合併分拆傳送的私訊（在同一次撰寫中包含命令與 URL）

當使用者一起輸入命令與 URL（例如 `Dump https://example.com/article`）時，Apple 的「訊息」App 會將傳送內容拆成**兩個獨立的 `chat.db` 資料列**：

1. 一則文字訊息（`"Dump"`）。
2. 一個 URL 預覽對話框（`"https://..."`），並將 OG 預覽圖片作為附件。

在大多數設定中，這兩個資料列抵達 OpenClaw 的時間相隔約 0.8-2.0 秒。如果不進行合併，代理程式在第 1 回合只會收到命令（而且通常會回覆「請將 URL 傳給我」），接著 URL 才會在第 2 回合抵達。這是 Apple 的傳送流水線，並非 OpenClaw 或 `imsg` 所造成。

`channels.imessage.coalesceSameSenderDms` 可讓私訊選擇緩衝同一傳送者的連續資料列。當 `imsg` 在其中一個來源資料列上公開結構化 URL 預覽標記 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 時，OpenClaw 只會合併該次真正的分拆傳送，並將其他已緩衝資料列保留為個別回合。在完全不發出對話框中繼資料的舊版 `imsg` 組建中，OpenClaw 無法區分分拆傳送與個別傳送，因此會改為合併整個區段。這會保留引入中繼資料前的行為，避免 `Dump <url>` 分拆傳送退化為兩個回合。群組聊天仍會逐則訊息分派，以保留多使用者的回合結構。

<Tabs>
  <Tab title="何時啟用">
    在下列情況啟用：

    - 你提供的 Skills 預期在單一訊息中收到 `command + payload`（傾印、貼上、儲存、排入佇列等）。
    - 你的使用者會將 URL 與命令一起貼上。
    - 你可以接受增加的私訊回合延遲（請見下文）。

    在下列情況保持停用：

    - 你需要讓單字私訊觸發命令維持最低延遲。
    - 你的所有流程都是不含後續承載資料的一次性命令。

  </Tab>
  <Tab title="啟用">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 選擇啟用（預設：false）
        },
      },
    }
    ```

    啟用此旗標，且未明確設定 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs` 時，防彈跳時間窗會擴大至 **7000 ms**（舊版預設值為 0 ms，亦即不進行防彈跳）。之所以需要更寬的時間窗，是因為當 Messages.app 發出預覽資料列時，Apple URL 預覽分拆傳送的間隔可能延伸至數秒。

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
    - **精確合併需要目前的 `imsg` 承載資料中繼資料。**當存在 `balloon_bundle_id` 時，只會合併真正的分拆傳送；上述缺少中繼資料時的備援合併是暫時的向後相容措施，待 `imsg` 在上游合併分拆傳送後即會移除。
    - **私訊訊息的額外延遲。**啟用此旗標後，每則私訊（包括獨立控制命令和單一文字後續訊息）在分派前最多會等待一個防彈跳時間窗，以確認是否會有 URL 預覽資料列抵達。群組聊天訊息仍會立即分派。
    - **合併後的輸出有界限。**合併文字上限為 4000 個字元，並帶有明確的 `…[truncated]` 標記；附件上限為 20 個；來源項目上限為 10 個（超過時保留第一個與最新項目）。每個來源 GUID 都會記錄在 `coalescedMessageGuids` 中，供下游遙測使用。
    - **僅限私訊。**群組聊天會改為逐則訊息分派，讓多人同時輸入時機器人仍能迅速回應。
    - **選擇啟用，且依頻道設定。**其他頻道（Discord、Slack、Telegram、WhatsApp 等）不受影響。設定了 `channels.bluebubbles.coalesceSameSenderDms` 的舊版 BlueBubbles 設定應將該值遷移至 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 情境與代理程式看到的內容

「已啟用旗標」欄顯示會發出 `balloon_bundle_id` 的 `imsg` 組建之行為。在完全不發出對話框中繼資料的舊版 `imsg` 組建中，下方標示為「兩個回合」／「N 個回合」的資料列會改為使用舊版合併（一個回合）：OpenClaw 無法從結構上區分分拆傳送與個別傳送，因此會保留引入中繼資料前的合併行為。組建開始發出對話框中繼資料後，就會啟用精確分離。

| 使用者撰寫內容                                                     | `chat.db` 產生的結果        | 未啟用旗標（預設）                     | 已啟用旗標 + 時間窗（imsg 發出對話框中繼資料）                                            |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                              | 相隔約 1 秒的 2 個資料列                   | 代理程式兩個回合：「Dump」單獨出現，然後才是 URL | 一個回合：合併文字 `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption`（附件 + 文字）                | 2 個不含 URL 對話框中繼資料的資料列 | 兩個回合                               | 觀察到中繼資料後為兩個回合；舊版／鎖定前無中繼資料的工作階段則為一個合併回合       |
| `/status`（獨立命令）                                     | 1 個資料列                               | 立即分派                        | **最多等待一個時間窗，然後分派**                                                                |
| 僅貼上 URL                                                   | 1 個資料列                               | 立即分派                        | 最多等待一個時間窗，然後分派                                                                    |
| 將文字 + URL 刻意分成兩則訊息傳送，間隔數分鐘 | 時間窗外的 2 個資料列               | 兩個回合                               | 兩個回合（兩者之間時間窗已到期）                                                             |
| 快速大量傳送（時間窗內超過 10 則短私訊）                          | N 個不含 URL 對話框中繼資料的資料列 | N 個回合                                 | 觀察到中繼資料後為 N 個回合；舊版／鎖定前無中繼資料的工作階段則為一個有界合併回合 |
| 群組聊天中有兩人正在輸入                                  | 來自 M 位傳送者的 N 個資料列               | M+ 個回合（每個傳送者區段各一個）        | M+ 個回合——群組聊天不會合併                                                            |

## 橋接器或閘道重新啟動後的傳入復原

iMessage 會復原閘道停機期間遺漏的訊息，同時抑制 Apple 在 Push 復原後可能一次送出的過期「待處理訊息轟炸」。預設行為一律啟用，並建立在持久化傳入機制與訊息年齡界線之上。

- **持久化重播防護。**在推進復原游標前，OpenClaw 會將每個原始資料列寫入共用 SQLite 傳入佇列，並以其 Apple GUID 作為事件 ID。已完成的資料列會保留約 4 小時的墓碑記錄，上限為 10,000 筆，因此即使重新啟動後，具有相同 GUID 的重播也會被捨棄。待處理資料列會維持可復原狀態，直到分派採用它為止。
- **停機復原。**啟動時，監視器會記住最後一個持久化准入的 `chat.db` 資料列 rowid（每個帳號各自持久化的游標），並以 `since_rowid` 將其傳遞給 `imsg watch.subscribe`，讓 imsg 重播尚未寫入日誌的資料列，接著持續追蹤即時資料。當機前已寫入日誌的資料列會從 SQLite 繼續處理。重播範圍僅限最近 500 個資料列及約 2 小時內的訊息，而 GUID 墓碑記錄會捨棄任何已處理項目。
- **過期待處理訊息年齡界線。**啟動邊界以上的資料列確實是即時資料；若其中某個資料列的傳送日期比抵達時間早超過約 15 分鐘，就屬於 Push 一次送出的待處理訊息，並會被抑制。重播的資料列（位於邊界或邊界以下）則使用較寬的復原時間窗，因此最近遺漏的訊息會送達，而久遠的歷史訊息不會。

本機與遠端 `cliPath` 設定都能使用復原功能，因為 `since_rowid` 重播會透過相同的 `imsg` RPC 連線執行。兩者差異在於時間窗：當閘道可以讀取 `chat.db`（本機）時，它會錨定啟動 rowid 邊界、限制重播範圍，並送達最近數小時內遺漏的訊息。透過遠端 SSH `cliPath` 時，閘道無法讀取資料庫，因此重播不設上限，且每個資料列都會使用即時年齡界線——它仍會復原最近遺漏的訊息並抑制舊待處理訊息，只是使用較窄的即時時間窗。若要使用較寬的復原時間窗，請在執行「訊息」App 的 Mac 上執行閘道。

### 操作員可見的訊號

遭抑制的待處理訊息會以預設層級記錄，絕不會在沒有記錄的情況下捨棄（`recovery` 旗標會顯示套用的時間窗）：

```text
imessage: 已抑制過期的傳入待處理訊息 account=<id> sent=<iso> recovery=<bool>（啟動後已抑制 <N> 則）
```

### 遷移

`channels.imessage.catchup.*` 已淘汰——停機復原會自動執行，且新設定不需要任何設定。包含 `catchup.enabled: true` 的現有設定仍會作為復原重播時間窗的相容性設定檔受到支援。已停用的追補區塊（`enabled: false` 或沒有 `enabled: true`）已淘汰；`openclaw doctor --fix` 會將其移除。

## 疑難排解

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支援 RPC">
    驗證二進位檔與 RPC 支援：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探測回報不支援 RPC，請更新 `imsg`。如果無法使用私有 API 動作，請在已登入的 macOS 使用者工作階段中執行 `imsg launch`，然後再次探測。如果閘道未在 macOS 上執行，請使用上述透過 SSH 連線遠端 Mac 的設定，而非預設的本機 `imsg` 路徑。

  </Accordion>

  <Accordion title="訊息可傳送，但收不到傳入的 iMessage">
    請先確認訊息是否已送達本機 Mac。如果 `chat.db` 沒有變化，即使 `imsg status --json` 回報橋接器狀態正常，OpenClaw 也無法接收訊息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果從手機傳送的訊息未建立任何新資料列，請先修復 macOS 訊息與 Apple Push 層，再變更 OpenClaw 設定。通常只要執行一次服務重新整理即可：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    從手機傳送一則新的 iMessage，並在偵錯 OpenClaw 工作階段之前，確認出現新的 `chat.db` 資料列或 `imsg watch` 事件。請勿將此操作當作週期性的橋接器重新啟動迴圈；在作業進行期間重複執行 `imsg launch` 並重新啟動閘道，可能會中斷訊息遞送，並使處理中的頻道執行停滯。

  </Accordion>

  <Accordion title="閘道未在 macOS 上執行">
    預設的 `cliPath: "imsg"` 必須在已登入「訊息」的 Mac 上執行。在 Linux 或 Windows 上，請將 `channels.imessage.cliPath` 設為包裝函式指令碼，透過 SSH 連線至該 Mac 並執行 `imsg "$@"`。

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
    - `channels.imessage.groups`允許清單行為
    - 提及模式設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="遠端附件失敗">
    請檢查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 從閘道主機進行 SSH/SCP 金鑰驗證
    - 閘道主機上的 `~/.ssh/known_hosts` 中存在主機金鑰
    - 執行「訊息」的 Mac 可讀取遠端路徑

  </Accordion>

  <Accordion title="錯過了 macOS 權限提示">
    請在相同的使用者／工作階段環境中，透過互動式 GUI 終端機重新執行，並核准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    確認執行 OpenClaw／`imsg` 的程序環境已獲授予「完整磁碟存取權限」與「自動化」權限。

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
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及限制
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與安全強化
