---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送/接收
summary: 透過 imsg（經由 stdio 的 JSON-RPC）支援原生 iMessage，並提供用於回覆、tapback、效果、投票、附件與群組管理的私有 API 動作。當主機需求符合時，建議用於新的 OpenClaw iMessage 設定。
title: iMessage
x-i18n:
    generated_at: "2026-07-05T17:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f4932ab612ce9ef8542e030962f64b828a633167654a0dfe09561aff543cc96
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於 OpenClaw iMessage 部署，請在已登入的 macOS Messages 主機上使用 `imsg`。如果你的閘道在 Linux 或 Windows 上執行，請將 `channels.imessage.cliPath` 指向會在 Mac 上執行 `imsg` 的 SSH 包裝程式。

**傳入復原會自動進行。** 在橋接器或閘道重新啟動後，iMessage 會重播停機期間錯過的訊息，並抑制 Apple 在 Push 復原後可能刷出的過期「待處理訊息炸彈」，同時去重以確保不會重複派送任何內容。沒有需要啟用的設定 — 請參閱[橋接器或閘道重新啟動後的傳入復原](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支援已移除。請將 `channels.bluebubbles` 設定遷移到 `channels.imessage`；OpenClaw 僅透過 `imsg` 支援 iMessage。可先閱讀[BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)的簡短公告，或閱讀[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)的完整遷移表。
</Warning>

狀態：原生外部命令列介面整合。閘道會產生 `imsg rpc`，並透過 stdio 使用 JSON-RPC 通訊 — 不需要獨立 daemon 或連接埠。進階動作需要 `imsg launch` 與成功的私有 API 探測。

<CardGroup cols={3}>
  <Card title="私有 API 動作" icon="wand-sparkles" href="#private-api-actions">
    回覆、tapback、特效、投票、附件與群組管理。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    iMessage 私訊預設使用配對模式。
  </Card>
  <Card title="遠端 Mac" icon="terminal" href="#remote-mac-over-ssh">
    當閘道未在 Messages Mac 上執行時，請使用 SSH 包裝程式。
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
    OpenClaw 只需要與 stdio 相容的 `cliPath`，因此你可以將 `cliPath` 指向一個會透過 SSH 連到遠端 Mac 並執行 `imsg` 的包裝指令碼。

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
      // Optional: extra allowed attachment roots (merged with the default
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    如果未設定 `remoteHost`，OpenClaw 會嘗試透過解析 SSH 包裝指令碼自動偵測。
    `remoteHost` 必須是 `host` 或 `user@host`（不可包含空格或 SSH 選項）；不安全的值會被忽略。
    OpenClaw 對 SCP 使用嚴格的主機金鑰檢查，因此轉送主機金鑰必須已存在於 `~/.ssh/known_hosts`。
    附件路徑會依允許的根目錄（`attachmentRoots` / `remoteAttachmentRoots`）進行驗證。

<Warning>
你放在 `imsg` 前面的任何 `cliPath` 包裝程式或 SSH 代理，都必須像透明的 stdio 管線一樣支援長時間執行的 JSON-RPC。OpenClaw 會在通道生命週期內，透過包裝程式的 stdin/stdout 交換小型換行分隔 JSON-RPC 訊息：

- 在位元組可用後，**立即**轉送每個 stdin 區塊/行 — 不要等待 EOF。
- 反向立即轉送每個 stdout 區塊/行。
- 保留換行。
- 避免固定大小的阻塞讀取（`read(4096)`、`cat | buffer`、預設 shell `read`），這些可能讓小型 frame 飢餓。
- 將 stderr 與 JSON-RPC stdout 串流分開。

會緩衝 stdin 直到大型區塊填滿的包裝程式，會產生看起來像 iMessage 中斷的症狀 — `imsg rpc timeout (chats.list)` 或通道重複重新啟動 — 即使 `imsg rpc` 本身是正常的。`ssh -T host imsg "$@"`（如上）是安全的，因為它會轉送 OpenClaw 的 `cliPath` 引數，例如 `rpc` 與 `--db`。像 `ssh host imsg | grep -v '^DEBUG'` 這類管線則不安全 — 行緩衝工具仍可能保留 frame；如果必須過濾，請在每個階段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 需求與權限（macOS）

- Messages 必須在執行 `imsg` 的 Mac 上登入。
- 執行 OpenClaw/`imsg` 的處理程序情境需要 Full Disk Access（Messages DB 存取）。
- 透過 Messages.app 傳送訊息需要 Automation 權限。
- 對於進階動作（react / edit / unsend / threaded reply / effects / polls / group ops），必須停用 System Integrity Protection — 請參閱[啟用 imsg 私有 API](#enabling-the-imsg-private-api)。基本文字與媒體傳送/接收不需要停用。

<Tip>
權限會依處理程序情境授予。如果閘道以無頭模式執行（LaunchAgent/SSH），請在相同情境中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH 包裝程式傳送失敗並出現 AppleEvents -1743">
  遠端 SSH 設定可能可以讀取聊天、通過 `channels status --probe`，並處理傳入訊息，但傳出傳送仍因 AppleEvents 授權錯誤而失敗：

```text
Not authorized to send Apple events to Messages. (-1743)
```

檢查已登入 Mac 使用者的 TCC 資料庫，或 System Settings > Privacy & Security > Automation。如果 Automation 項目記錄的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本機 shell 處理程序，macOS 可能不會為該 SSH 伺服器端用戶端顯示可用的 Messages 切換選項：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在該狀態下，重複執行 `tccutil reset AppleEvents` 或透過同一個 SSH 包裝程式重新執行 `imsg send` 可能仍會失敗，因為需要 Messages Automation 的處理程序情境是 SSH 包裝程式，而不是 UI 可以授權的應用程式。

請改用其中一種支援的 `imsg` 處理程序情境：

- 在已登入的 Messages 使用者本機工作階段中執行閘道，或至少執行 `imsg` 橋接器。
- 在同一個工作階段授予 Full Disk Access 與 Automation 後，使用該使用者的 LaunchAgent 啟動閘道。
- 如果保留雙使用者 SSH 拓撲，請在啟用通道前，驗證真正的傳出 `imsg send` 能透過完全相同的包裝程式成功。如果無法授予 Automation，請改為重新設定為單一使用者 `imsg` 設定，而不是依賴 SSH 包裝程式進行傳送。

</Accordion>

## 啟用 imsg 私有 API

`imsg` 提供兩種操作模式：

- **基本模式**（預設，不需要變更 SIP）：透過 `send` 傳出文字與媒體、傳入 watch/history、聊天清單。這是全新 `brew install steipete/tap/imsg` 加上上述標準 macOS 權限後開箱即可取得的功能。
- **私有 API 模式**：`imsg` 會將輔助 dylib 注入 `Messages.app`，以呼叫內部 `IMCore` 函式。這會解鎖 `react`、`edit`、`unsend`、`reply`（threaded）、`sendWithEffect`、`poll` 與 `poll-vote`（原生 Messages 投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及輸入指示器與已讀回執。

本頁的進階動作介面需要私有 API 模式。`imsg` README 對需求說得很明確：

> `read`、`typing`、`launch`、橋接器支援的 rich send、訊息修改與聊天管理等進階功能是選用功能。它們需要停用 SIP，並將輔助 dylib 注入 `Messages.app`。啟用 SIP 時，`imsg launch` 會拒絕注入。

輔助注入技術會使用 `imsg` 自己的 dylib 來存取 Messages 私有 API。OpenClaw iMessage 路徑中沒有第三方伺服器或 BlueBubbles 執行環境。

<Warning>
**停用 SIP 是實際的安全取捨。** SIP 是 macOS 防止執行修改後系統程式碼的核心保護之一；將它在全系統關閉會增加額外攻擊面與副作用。特別是，**在 Apple Silicon Mac 上停用 SIP 也會停用在 Mac 上安裝與執行 iOS 應用程式的能力**。

請將此視為有意識的營運選擇，而不是預設值。如果你的威脅模型無法容忍 SIP 關閉，內建 iMessage 會限制在基本模式 — 僅限文字與媒體傳送/接收，沒有反應 / 編輯 / 取消傳送 / 特效 / 群組操作。
</Warning>

### 設定

1. 在執行 Messages.app 的 Mac 上**安裝（或升級）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 輸出會回報 `bridge_version`、`rpc_methods` 與每個方法的 `selectors`，讓你可以在開始前查看目前建置支援哪些功能。

2. **停用 System Integrity Protection，並且（在現代 macOS 上）停用 Library Validation。** 將非 Apple 輔助 dylib 注入 Apple 簽署的 `Messages.app` 需要關閉 SIP，**並且**放寬 library validation。Recovery 模式的 SIP 步驟依 macOS 版本而異：
   - **macOS 10.13-10.15（Sierra-Catalina）：**透過 Terminal 停用 Library Validation，重新啟動到 Recovery Mode，執行 `csrutil disable`，再重新啟動。
   - **macOS 11+（Big Sur 與更新版本），Intel：**Recovery Mode（或 Internet Recovery），`csrutil disable`，重新啟動。
   - **macOS 11+，Apple Silicon：**使用電源按鈕啟動序列進入 Recovery；在較新的 macOS 版本中，點選 Continue 時按住 **Left Shift** 鍵，然後執行 `csrutil disable`。虛擬機器設定有不同流程，因此請先建立 VM 快照。

   **在 macOS 11 與更新版本上，只有 `csrutil disable` 通常不夠。** Apple 仍會將 `Messages.app` 作為平台二進位檔強制套用 library validation，因此 adhoc 簽署的輔助程式會遭拒（`Library Validation failed: ... platform binary, but mapped file is not`），即使 SIP 已關閉也一樣。停用 SIP 後，也請停用 library validation 並重新啟動：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已在 26.5.1 驗證：**關閉 SIP **加上**上述 `DisableLibraryValidation` 命令，足以在 26.0 到 26.5.x 之間注入輔助程式。**不需要 boot-args。** plist 是決定性因素，也是 Tahoe 上注入失敗時最常漏掉的步驟：
   - **有 plist：**`imsg launch` 會注入，且 `imsg status` 會回報 `advanced_features: true`。
   - **沒有 plist（即使 SIP 已關閉）：**`imsg launch` 會失敗並顯示 `Failed to launch: Timeout waiting for Messages.app to initialize`。AMFI 會在載入時拒絕 adhoc 輔助程式，因此橋接器永遠不會就緒，launch 也會逾時。該逾時是大多數人在 Tahoe 上遇到的症狀；修正方式是上述 plist，而不是更激進的做法。

   如果在 macOS 升級後，`imsg launch` 注入或特定 `selectors` 開始回傳 false，這個 gate 通常就是原因。請先檢查你的 SIP 與 library-validation 狀態，再假設 SIP 步驟本身失敗。如果這些設定正確但橋接器仍無法注入，請收集 `imsg status --json` 加上 `imsg launch` 輸出，並回報給 `imsg` 專案，而不是削弱額外的全系統安全控制。

3. **注入輔助程式。** 在停用 SIP 且 Messages.app 已登入的情況下：

   ```bash
   imsg launch
   ```

   當 SIP 仍啟用時，`imsg launch` 會拒絕注入，因此這也同時可確認步驟 2 已生效。

4. **從 OpenClaw 驗證橋接器：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 項目應回報 `works`，而 `imsg status --json | jq '{rpc_methods, selectors}'` 應顯示你的 macOS 建置所公開的能力。建立投票需要 `selectors.pollPayloadMessage`；投票需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。OpenClaw 外掛只會宣告快取探測支援的動作，而空快取會保持樂觀，並在首次分派時探測。

如果 `openclaw channels status --probe` 回報該通道為 `works`，但特定動作在分派時拋出「iMessage `<action>` 需要 imsg 私有 API 橋接器」，請再次執行 `imsg launch` — 輔助程式可能會脫離（Messages.app 重新啟動、作業系統更新等），且快取的 `available: true` 狀態會持續宣告動作，直到下一次探測重新整理。

### 當 SIP 保持啟用時

如果停用 SIP 不符合你的威脅模型：

- `imsg` 會退回基本模式 — 僅支援文字 + 媒體 + 接收。
- OpenClaw 外掛仍會宣告文字/媒體傳送與傳入監控；它會從動作表面隱藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群組操作（依據逐方法能力閘門）。
- 你可以使用另一台非 Apple Silicon Mac（或專用機器人 Mac）並關閉 SIP 來處理 iMessage 工作負載，同時在主要裝置上保持 SIP 啟用。請參閱下方的[專用機器人 macOS 使用者（獨立 iMessage 身分）](#deployment-patterns)。

## 存取控制與路由

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` 控制直接訊息：

    - `pairing`（預設）
    - `allowlist`（至少需要一個 `allowFrom` 項目）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    允許清單欄位：`channels.imessage.allowFrom`。

    允許清單項目必須識別傳送者：控制代碼或靜態傳送者存取群組（`accessGroup:<name>`）。針對聊天目標（例如 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*`）請使用 `channels.imessage.groupAllowFrom`；針對數字 `chat_id` 登錄鍵請使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（預設）
    - `open`
    - `disabled`

    群組傳送者允許清單：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 項目也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。

    執行階段備援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會使用 `allowFrom`；當 DM 與群組准入應有所不同時，請設定 `groupAllowFrom`。明確為空的 `groupAllowFrom: []` 不會備援 — 它會在 `allowlist` 下封鎖所有群組傳送者。
    執行階段注意事項：如果完全缺少 `channels.imessage`，執行階段會退回 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    <Warning>
    `groupPolicy: "allowlist"` 下的群組路由會連續執行**兩個**閘門：

    1. **傳送者允許清單**（`channels.imessage.groupAllowFrom`）— 控制代碼、`accessGroup:<name>`、`chat_guid`、`chat_identifier` 或 `chat_id`。有效清單為空（沒有 `groupAllowFrom`，也沒有 `allowFrom` 備援）會封鎖每個群組傳送者。
    2. **群組登錄**（`channels.imessage.groups`）— 一旦映射有項目就會強制執行：聊天必須符合明確的逐 `chat_id` 項目，或 `groups: { "*": { ... } }` 萬用字元。當 `groups` 為空或缺少時，僅由傳送者允許清單決定准入。

    如果未設定有效的群組傳送者允許清單，每則群組訊息都會在登錄閘門前被丟棄。每個閘門在預設記錄層級都有自己的 `warn` 層級訊號，且各自指出不同修正方式：

    - 啟動時每個帳戶一次，當有效群組傳送者允許清單為空時：`imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — 透過設定 `channels.imessage.groupAllowFrom`（或 `allowFrom`）修正；僅新增 `groups` 項目仍會讓閘門 1 封鎖每個傳送者。
    - 執行階段每個 `chat_id` 一次，當傳送者通過閘門 1，但聊天未出現在已填入的 `groups` 登錄中時：`imessage: dropping group message from chat_id=<id> ...` — 透過在 `channels.imessage.groups` 下新增該 `chat_id`（或 `"*"`）修正。

    DM 不受影響 — 它們走不同的程式碼路徑。

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

    僅 `groupAllowFrom` 就會允許那些傳送者進入任何群組；新增 `groups` 區塊可限定允許哪些聊天（並設定逐聊天選項，例如 `requireMention`）。
    </Warning>

    群組的提及閘門：

    - iMessage 沒有原生提及中繼資料
    - 提及偵測使用 regex 模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 沒有已設定模式時，無法強制執行提及閘門
    - 來自授權傳送者的控制命令會略過提及閘門

    逐群組 `systemPrompt`：

    `channels.imessage.groups.*` 下的每個項目都接受選用的 `systemPrompt` 字串，會在每個處理該群組訊息的回合注入代理的系統提示。解析方式會鏡像 `channels.whatsapp.groups`：

    1. **群組特定系統提示**（`groups["<chat_id>"].systemPrompt`）：當映射中存在特定群組項目，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），則會抑制萬用字元，且不會將系統提示套用到該群組。
    2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於映射中，或存在但未定義 `systemPrompt` 鍵時使用。

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

    逐群組提示只會套用到群組訊息 — 直接訊息不受影響。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM 使用直接路由；群組使用群組路由。
    - 使用預設 `session.dmScope=main` 時，iMessage DM 會摺疊到代理主工作階段。
    - 群組工作階段彼此隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用來源通道/目標中繼資料路由回 iMessage。

    類群組執行緒行為：

    某些多參與者 iMessage 執行緒可能以 `is_group=false` 抵達。
    如果該 `chat_id` 已明確設定於 `channels.imessage.groups` 下，OpenClaw 會將其視為群組流量（群組閘門 + 群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話綁定

iMessage 聊天可以綁定至 ACP 工作階段。

快速操作員流程：

- 在 DM 或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 同一個 iMessage 對話中的未來訊息會路由到衍生的 ACP 工作階段。
- `/new` 和 `/reset` 會就地重設同一個已綁定的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除綁定。

已設定的持久綁定使用頂層 `bindings[]` 項目，並搭配 `type: "acp"` 和 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 正規化的 DM 控制代碼，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`（建議用於穩定的群組綁定）
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

請參閱 [ACP 代理](/zh-TW/tools/acp-agents)以了解共用 ACP 綁定行為。

## 部署模式

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    使用專用 Apple ID 和 macOS 使用者，讓機器人流量與你的個人 Messages 設定檔隔離。

    典型流程：

    1. 建立/登入專用 macOS 使用者。
    2. 在該使用者中使用機器人 Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH 包裝器，讓 OpenClaw 可以在該使用者內容中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向該使用者設定檔。

    第一次執行可能需要在該機器人使用者工作階段中核准 GUI 權限（自動化 + 完整磁碟存取）。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    常見拓撲：

    - 閘道在 Linux/VM 上執行
    - iMessage + `imsg` 在你 tailnet 中的 Mac 上執行
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

    使用 SSH 金鑰，讓 SSH 和 SCP 都能以非互動方式執行。
    請先確保主機金鑰已受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），讓 `known_hosts` 已填入。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage 支援在 `channels.imessage.accounts` 下進行逐帳戶設定。

    每個帳戶都可以覆寫欄位，例如 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史記錄設定，以及附件根目錄允許清單。

  </Accordion>

  <Accordion title="Direct-message history">
    設定 `channels.imessage.dmHistoryLimit`，用該對話最近解碼的 `imsg` 歷史記錄來初始化新的直接訊息工作階段。使用 `channels.imessage.dms["<sender>"].historyLimit` 進行逐傳送者覆寫，包括使用 `0` 停用某個傳送者的歷史記錄。

    iMessage DM 歷史記錄會按需從 `imsg` 擷取。未設定 `dmHistoryLimit` 會停用全域 DM 歷史記錄初始化，但正值的逐傳送者 `channels.imessage.dms["<sender>"].historyLimit` 仍會為該傳送者啟用初始化。

  </Accordion>
</AccordionGroup>

## 媒體、分塊與傳遞目標

<AccordionGroup>
  <Accordion title="附件與媒體">
    - 傳入附件擷取預設為**關閉** — 設定 `channels.imessage.includeAttachments: true` 可將照片、語音備忘錄、影片與其他附件轉送給代理程式。停用時，只有附件的 iMessage 會在到達代理程式前被丟棄，且可能完全不產生 `Inbound message` 記錄列。
    - 設定 `remoteHost` 時，可透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 設定的根目錄會擴充預設根目錄模式 `/Users/*/Library/Messages/Attachments`（合併，而非取代）
    - SCP 使用嚴格主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 傳出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="傳出文字與分塊">
    - 文字分塊限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分塊模式：`channels.imessage.chunkMode`
      - `length`（預設）
      - `newline`（段落優先分割）
    - 傳出 markdown 粗體/斜體/底線/刪除線會轉換為原生樣式文字（macOS 15+ 收件者會呈現樣式；較舊的收件者會看到沒有標記的純文字）；markdown 表格會依據通道 markdown 表格模式轉換
    - `channels.imessage.sendTransport`（預設 `auto`，`bridge`、`applescript`）會選擇 `imsg` 傳送訊息的方式

  </Accordion>

  <Accordion title="定址格式">
    建議的明確目標：

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

所有動作預設啟用；使用 `channels.imessage.actions` 可關閉個別動作：

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
    - **react**：新增/移除 iMessage tapback（`messageId`、`emoji`、`remove`）。支援的 tapback 會對應到愛心、喜歡、不喜歡、大笑、強調與疑問。不指定 emoji 移除時，會清除已設定的任何 tapback。
    - **reply**：傳送對既有訊息的串接回覆（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。附帶附件的回覆還需要 `send-rich` 支援 `--file` 的 `imsg` 建置。
    - **sendWithEffect**：使用 iMessage 效果傳送文字（`text` 或 `message`、`effect` 或 `effectId`）。短名稱：slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **edit**：在支援的 macOS/私有 API 版本上編輯已傳送的訊息（`messageId`、`text` 或 `newText`）。只有閘道本身傳送的訊息可以編輯。
    - **unsend**：在支援的 macOS/私有 API 版本上收回已傳送的訊息（`messageId`）。只有閘道本身傳送的訊息可以取消傳送。
    - **upload-file**：傳送媒體/檔案（base64 格式的 `buffer`，或已補水的 `media`/`path`/`filePath`、`filename`、選用的 `asVoice`）。舊版別名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：目前目標是群組對話時管理群組聊天。這些動作會變更主機的 Messages 身分，因此需要擁有者傳送者或 `operator.admin` 閘道用戶端。
    - **poll**：建立原生 Apple Messages 投票（`pollQuestion`、重複 2 到 12 次的 `pollOption`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。iOS/iPadOS/macOS 26+ 的收件者會以原生方式查看並投票；較舊的 OS 版本會收到「Sent a poll」文字備援。需要 `selectors.pollPayloadMessage`。
    - **poll-vote**：對既有投票投票（`pollId` 或 `messageId`，以及 `pollOptionIndex`、`pollOptionId` 或 `pollOptionText` 中剛好一個）。需要 `selectors.pollVoteMessage` 和 `poll.vote` RPC 方法。

    已接受的傳入投票會呈現給代理程式，包含問題、編號選項標籤、票數，以及 `poll-vote` 需要的投票訊息 ID。

  </Accordion>

  <Accordion title="訊息 ID">
    傳入 iMessage 情境在可用時同時包含簡短的 `MessageSid` 值與完整訊息 GUID（`MessageSidFull`）。簡短 ID 的範圍限於最近的 SQLite 支援回覆快取，且使用前會針對目前聊天檢查。如果簡短 ID 已過期或屬於另一個聊天，請改用完整的 `MessageSidFull` 重試。

  </Accordion>

  <Accordion title="能力偵測">
    只有當快取的探測狀態顯示 bridge 不可用時，OpenClaw 才會隱藏私有 API 動作。如果狀態未知，動作會保持可見，並在分派時延遲探測，讓第一個動作可在 `imsg launch` 後成功，而不需要另外手動重新整理狀態。

  </Accordion>

  <Accordion title="讀取回條與輸入中">
    私有 API bridge 啟動時，已接受的傳入聊天會標記為已讀，直接聊天則會在回合被接受後立即顯示輸入中泡泡，同時代理程式準備情境並產生內容。使用下列設定停用標記已讀：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早於逐方法能力清單的舊版 `imsg` 建置會靜默關閉輸入中/已讀；OpenClaw 會在每次重新啟動時記錄一次警告，讓缺少回條的原因可追蹤。

  </Accordion>

  <Accordion title="傳入 tapback">
    OpenClaw 會訂閱 iMessage tapback，並將已接受的反應路由為系統事件，而非一般訊息文字，因此使用者 tapback 不會觸發普通的回覆迴圈。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（預設）：只在使用者對 Bot 撰寫的訊息做出反應時通知。
    - `"all"`：通知授權傳送者的所有傳入 tapback。
    - `"off"`：忽略傳入 tapback。

    每帳號覆寫使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="核准反應（👍 / 👎）">
    當 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 為 true，且請求路由到 iMessage 時，閘道會以原生方式送出核准提示，並接受 tapback 來解決它：

    - `👍`（喜歡 tapback）→ `allow-once`
    - `👎`（不喜歡 tapback）→ `deny`
    - `allow-always` 仍是手動備援：以一般回覆傳送 `/approve <id> allow-always`。

    反應處理要求做出反應的使用者控制代碼必須是明確核准者。核准者清單讀自 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）；請加入使用者的 E.164 格式電話號碼或其 Apple ID 電子郵件（像 `chat_id:*` 這樣的聊天目標不是有效的核准者項目）。萬用字元項目 `"*"` 會被接受，但允許任何傳送者核准；空的核准者清單會完全停用反應捷徑。反應捷徑會刻意略過 `reactionNotifications`、`dmPolicy` 和 `groupAllowFrom`，因為明確核准者允許清單是核准解析唯一相關的關卡。

    `/approve` 文字命令授權遵循同一份清單：當 `channels.imessage.allowFrom` 非空時，`/approve <id> <decision>` 會針對該核准者清單授權（而非較廣泛的 DM 允許清單），允許出現在 DM 允許清單但不在 `allowFrom` 中的傳送者會收到明確拒絕。當 `allowFrom` 為空時，同聊天備援仍然生效，且 `/approve` 會授權 DM 允許清單允許的任何人。請將每位應可核准的操作員，無論透過 `/approve` 或反應，都加入 `allowFrom`。

    操作員注意事項：
    - 反應繫結同時儲存在記憶體與閘道的持久化鍵值儲存中（TTL 與核准過期時間相符），閘道也會輪詢待處理提示的 tapback，因此在閘道重新啟動後不久送達的 tapback 仍會解析核准。
    - 當該控制代碼是明確核准者時，操作員自己的 `is_from_me=true` tapback（例如來自已配對的 Apple 裝置）會解析核准。
    - 核准提示只有在設定明確核准者時才會路由到群組對話；否則任何群組成員都可能核准。
    - 舊版文字樣式 tapback（非常舊的 Apple 用戶端傳來的 `Liked "…"` 純文字）無法解析核准，因為它們不帶訊息 GUID；反應解析需要目前 macOS / iOS 用戶端發出的結構化 tapback 中繼資料。

  </Accordion>
</AccordionGroup>

## 設定寫入

iMessage 預設允許由通道發起的設定寫入（用於 `commands.config: true` 時的 `/config set|unset`）。

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

當使用者一起輸入命令與 URL，例如 `Dump https://example.com/article`，Apple 的 Messages App 會將傳送拆成**兩個獨立的 `chat.db` 列**：

1. 文字訊息（`"Dump"`）。
2. URL 預覽泡泡（`"https://..."`），並將 OG 預覽圖片作為附件。

在大多數設定中，這兩列會相隔約 0.8-2.0 秒到達 OpenClaw。沒有合併時，代理程式會在第 1 回合只收到命令（且經常回覆「請把 URL 傳給我」），然後 URL 才在第 2 回合到達。這是 Apple 的傳送管線，不是 OpenClaw 或 `imsg` 引入的行為。

`channels.imessage.coalesceSameSenderDms` 會讓 DM 選擇對連續的同傳送者列進行緩衝。當 `imsg` 在其中一個來源列上揭露結構化 URL 預覽標記 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 時，OpenClaw 只會合併那個真正的分割傳送，並將任何其他已緩衝的列保留為獨立回合。在完全不發出泡泡中繼資料的舊版 `imsg` 建置上，OpenClaw 無法分辨分割傳送與分開傳送，因此會退回到合併整個 bucket。這會保留中繼資料前的行為，而不是讓 `Dump <url>` 分割傳送退化成兩個回合。群組聊天會繼續按每則訊息分派，以保留多使用者回合結構。

<Tabs>
  <Tab title="何時啟用">
    以下情況請啟用：

    - 你發布預期在單一訊息中接收 `command + payload` 的 Skills（dump、paste、save、queue 等）。
    - 你的使用者會在命令旁貼上 URL。
    - 你可以接受增加的 DM 回合延遲（見下方）。

    以下情況請保持停用：

    - 你需要單字 DM 觸發器的最低命令延遲。
    - 你的所有流程都是沒有後續 payload 的一次性命令。

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

    開啟此旗標且沒有明確的 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs` 時，debounce 視窗會擴大到 **7000 ms**（舊版預設為 0 ms — 不做 debounce）。需要較寬的視窗，是因為 Apple 的 URL 預覽分割傳送節奏可能拉長到數秒，同時 Messages.app 會發出預覽列。

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
  <Tab title="Trade-offs">
    - **精準合併需要目前的 `imsg` 承載中繼資料。** 有 `balloon_bundle_id` 時，只會合併真正的分段傳送；上述沒有中繼資料的備援合併是暫時的回溯相容，會在 `imsg` 於上游合併分段傳送後移除。
    - **DM 訊息會增加延遲。** 旗標開啟時，每則 DM（包含獨立控制命令和單一文字後續訊息）都會在派送前最多等待去抖動視窗，以防 URL 預覽列即將出現。群組聊天訊息維持即時派送。
    - **合併輸出有上限。** 合併文字上限為 4000 個字元，並以明確的 `…[truncated]` 標記表示；附件上限為 20；來源項目上限為 10（超過時保留第一筆與最新項目）。每個來源 GUID 都會記錄在 `coalescedMessageGuids`，供下游遙測使用。
    - **僅限 DM。** 群組聊天會回到逐訊息派送，讓機器人在多人輸入時仍保持回應速度。
    - **選擇啟用，且按通道設定。** 其他通道（Discord、Slack、Telegram、WhatsApp、…）不受影響。設定了 `channels.bluebubbles.coalesceSameSenderDms` 的舊版 BlueBubbles 設定，應將該值遷移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 情境與代理程式會看到的內容

「旗標開啟」欄顯示在會發出 `balloon_bundle_id` 的 `imsg` 建置上的行為。在完全不發出氣泡中繼資料的舊版 `imsg` 建置上，下方標示為「兩次回合」/「N 次回合」的列會改為回退到舊版合併（一次回合）：OpenClaw 無法從結構上分辨分段傳送與分開傳送，因此會保留中繼資料出現前的合併行為。只要建置開始發出氣泡中繼資料，就會啟用精準分離。

| 使用者編寫內容                                                     | `chat.db` 產生內容                  | 旗標關閉（預設）                        | 旗標開啟 + 視窗（imsg 發出氣泡中繼資料）                                                       |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                             | 2 列，間隔約 1 秒                   | 兩次代理程式回合：「Dump」單獨一次，接著是 URL | 一次回合：合併文字 `Dump https://example.com`                                                     |
| `Save this 📎image.jpg caption`（附件 + 文字）                     | 2 列，沒有 URL 氣泡中繼資料         | 兩次回合                               | 觀察到中繼資料後為兩次回合；在舊版/鎖定前且無中繼資料的工作階段上為一次合併回合       |
| `/status`（獨立命令）                                              | 1 列                               | 即時派送                                | **最多等待到視窗結束，然後派送**                                                                |
| 單獨貼上的 URL                                                     | 1 列                               | 即時派送                                | 最多等待到視窗結束，然後派送                                                                    |
| 文字 + URL 以兩則刻意分開的訊息傳送，間隔數分鐘                   | 2 列，超出視窗                     | 兩次回合                               | 兩次回合（視窗在兩者之間過期）                                                             |
| 快速大量傳送（視窗內超過 10 則小型 DM）                           | N 列，沒有 URL 氣泡中繼資料         | N 次回合                               | 觀察到中繼資料後為 N 次回合；在舊版/鎖定前且無中繼資料的工作階段上為一次有界合併回合 |
| 兩個人在群組聊天中輸入                                             | 來自 M 位傳送者的 N 列              | M+ 次回合（每個傳送者分桶一次）        | M+ 次回合 — 群組聊天不會合併                                                            |

## 橋接或閘道重新啟動後的入站復原

iMessage 會復原閘道停機期間遺漏的訊息，同時抑制 Apple 在 Push 復原後可能大量送出的陳舊「積壓炸彈」。預設行為一律開啟，並建立在入站去重之上。

- **重播去重。** 每則已派送的入站訊息都會以其 Apple GUID 記錄在持久性外掛狀態（`imessage.inbound-dedupe`）中，在擷取時宣告，並在處理後提交（遇到暫時性失敗時釋放，以便重試）。任何已處理的項目都會被丟棄，而不是派送兩次。這讓復原可以積極重播，而不需要逐訊息記帳。
- **停機復原。** 啟動時，監控器會記住最後派送的 `chat.db` rowid（持久化的每帳號游標），並將它作為 `since_rowid` 傳給 `imsg watch.subscribe`，因此 imsg 會重播閘道停機期間落入的列，然後追蹤即時內容。重播上限為最近 500 列，且只包含約 2 小時內的訊息，去重會丟棄任何已處理的項目。
- **陳舊積壓年齡柵欄。** 啟動邊界以上的列是真正的即時內容；若某列的傳送日期比其抵達時間早超過約 15 分鐘，就是 Push 清出的積壓內容，會被抑制。重播列（位於邊界或以下）則改用較寬的復原視窗，因此最近遺漏的訊息會被送達，而久遠歷史不會。

復原可同時在本機與遠端 `cliPath` 設定上運作，因為 `since_rowid` 重播會透過相同的 `imsg` RPC 連線執行。差異在於視窗：當閘道可以讀取 `chat.db`（本機）時，它會錨定啟動 rowid 邊界、限制重播範圍，並送達最多數小時前遺漏的訊息。透過遠端 SSH `cliPath` 時，它無法讀取資料庫，因此重播不設上限，且每列都使用即時年齡柵欄 — 它仍會復原最近遺漏的訊息，也仍會抑制舊積壓，只是使用較窄的即時視窗。若要使用較寬的復原視窗，請在 Messages Mac 上執行閘道。

### 操作者可見訊號

被抑制的積壓內容會以預設層級記錄，絕不會靜默丟棄（`recovery` 旗標顯示套用哪個視窗）：

```text
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 遷移

`channels.imessage.catchup.*` 已棄用 — 停機復原是自動的，新設定不需要任何設定。既有設定若含有 `catchup.enabled: true`，仍會作為復原重播視窗的相容性設定檔受到支援。停用的 catchup 區塊（`enabled: false` 或沒有 `enabled: true`）已退役；`openclaw doctor --fix` 會移除這些區塊。

## 疑難排解

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    驗證二進位檔與 RPC 支援：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探測回報不支援 RPC，請更新 `imsg`。如果私有 API 動作無法使用，請在已登入的 macOS 使用者工作階段中執行 `imsg launch`，然後再次探測。如果閘道未在 macOS 上執行，請使用上方「透過 SSH 的遠端 Mac」設定，而不是預設的本機 `imsg` 路徑。

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    先證明訊息是否抵達本機 Mac。如果 `chat.db` 沒有變更，即使 `imsg status --json` 回報橋接健康，OpenClaw 也無法接收該訊息。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    如果手機傳送的訊息沒有建立新列，請先修復 macOS Messages 與 Apple Push 層，再變更 OpenClaw 設定。一次性服務重新整理通常就足夠：

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    從手機傳送一則新的 iMessage，並在偵錯 OpenClaw 工作階段前確認出現新的 `chat.db` 列或 `imsg watch` 事件。不要將此作為週期性的橋接重新啟動迴圈執行；在作用中工作期間反覆執行 `imsg launch` 加上閘道重新啟動，可能會中斷遞送並讓進行中的通道執行擱置。

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    預設的 `cliPath: "imsg"` 必須在已登入 Messages 的 Mac 上執行。在 Linux 或 Windows 上，將 `channels.imessage.cliPath` 設為包裝指令碼，讓它透過 SSH 連到該 Mac 並執行 `imsg "$@"`。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    然後執行：

```bash
openclaw channels status --probe --channel imessage
```

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
    - `channels.imessage.groups` 允許清單行為
    - 提及模式設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="Remote attachments fail">
    檢查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 來自閘道主機的 SSH/SCP 金鑰驗證
    - 主機金鑰存在於閘道主機上的 `~/.ssh/known_hosts`
    - 執行 Messages 的 Mac 上遠端路徑的可讀性

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    在相同使用者/工作階段脈絡中的互動式 GUI 終端機重新執行，並核准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    確認執行 OpenClaw/`imsg` 的程序脈絡已授予完整磁碟存取權 + 自動化。

  </Accordion>
</AccordionGroup>

## 設定參考指標

- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
- [閘道設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)

## 相關內容

- [通道概覽](/zh-TW/channels) — 所有支援的通道
- [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 公告與遷移摘要
- [從 BlueBubbles 轉換](/zh-TW/channels/imessage-from-bluebubbles) — 設定轉換表與逐步切換
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
