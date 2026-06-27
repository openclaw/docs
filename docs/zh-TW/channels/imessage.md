---
read_when:
    - 設定 iMessage 支援
    - 偵錯 iMessage 傳送/接收
summary: 透過 imsg（透過 stdio 的 JSON-RPC）提供原生 iMessage 支援，並以私有 API 動作支援回覆、tapback、效果、附件與群組管理。當主機需求符合時，建議新的 OpenClaw iMessage 設定優先使用。
title: iMessage
x-i18n:
    generated_at: "2026-06-27T18:55:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
對於 OpenClaw iMessage 部署，請在已登入的 macOS Messages 主機上使用 `imsg`。如果你的閘道在 Linux 或 Windows 上執行，請將 `channels.imessage.cliPath` 指向會在該 Mac 上執行 `imsg` 的 SSH 包裝器。

**入站復原會自動進行。** 橋接器或閘道重新啟動後，iMessage 會重播停機期間錯過的訊息，並抑制 Apple 在 Push 復原後可能清出的過時「積壓炸彈」，同時去重，確保不會重複分派任何內容。沒有需要啟用的設定 — 請參閱[橋接器或閘道重新啟動後的入站復原](#inbound-recovery-after-a-bridge-or-gateway-restart)。
</Note>

<Warning>
BlueBubbles 支援已移除。請將 `channels.bluebubbles` 設定遷移到 `channels.imessage`；OpenClaw 僅透過 `imsg` 支援 iMessage。簡短公告請從 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)開始，完整遷移表請參閱[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。
</Warning>

狀態：原生外部命令列介面整合。閘道會產生 `imsg rpc`，並透過 stdio 上的 JSON-RPC 通訊（沒有獨立的 daemon/port）。進階動作需要 `imsg launch` 以及成功的私有 API 探測。

<CardGroup cols={3}>
  <Card title="私有 API 動作" icon="wand-sparkles" href="#private-api-actions">
    回覆、tapbacks、效果、附件，以及群組管理。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    iMessage 私訊預設使用配對模式。
  </Card>
  <Card title="遠端 Mac" icon="terminal" href="#remote-mac-over-ssh">
    當閘道未在 Messages Mac 上執行時，請使用 SSH 包裝器。
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

  <Tab title="透過 SSH 連線遠端 Mac">
    OpenClaw 只需要與 stdio 相容的 `cliPath`，因此你可以將 `cliPath` 指向會 SSH 到遠端 Mac 並執行 `imsg` 的包裝器指令碼。

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

    如果未設定 `remoteHost`，OpenClaw 會嘗試透過剖析 SSH 包裝器指令碼自動偵測它。
    `remoteHost` 必須是 `host` 或 `user@host`（不可包含空格或 SSH 選項）。
    OpenClaw 對 SCP 使用嚴格的主機金鑰檢查，因此中繼主機金鑰必須已存在於 `~/.ssh/known_hosts`。
    附件路徑會根據允許的根目錄（`attachmentRoots` / `remoteAttachmentRoots`）進行驗證。

<Warning>
你放在 `imsg` 前面的任何 `cliPath` 包裝器或 SSH proxy，都必須表現得像長時間存活 JSON-RPC 的透明 stdio 管線。OpenClaw 會在該頻道的整個生命週期中，透過包裝器的 stdin/stdout 交換小型換行分隔 JSON-RPC 訊息：

- **一有位元組可用就**轉送每個 stdin 區塊/行 — 不要等待 EOF。
- 迅速將每個 stdout 區塊/行反向轉送。
- 保留換行。
- 避免固定大小的阻塞讀取（`read(4096)`、`cat | buffer`、預設 shell `read`），這些可能會讓小型 frame 飢餓。
- 將 stderr 與 JSON-RPC stdout 串流分開。

會緩衝 stdin 直到大型區塊填滿的包裝器，會產生看起來像 iMessage 中斷的症狀 — `imsg rpc timeout (chats.list)` 或頻道反覆重新啟動 — 即使 `imsg rpc` 本身是健康的。上方的 `ssh -T host imsg "$@"` 是安全的，因為它會轉送 OpenClaw 的 `cliPath` 引數，例如 `rpc` 和 `--db`。像 `ssh host imsg | grep -v '^DEBUG'` 這類管線則**不安全** — 行緩衝工具仍可能保留 frame；如果你必須篩選，請在每個階段使用 `stdbuf -oL -eL`。
</Warning>

  </Tab>
</Tabs>

## 需求與權限（macOS）

- 執行 `imsg` 的 Mac 必須已登入 Messages。
- 執行 OpenClaw/`imsg` 的程序環境需要完整磁碟存取權（Messages 資料庫存取）。
- 需要自動化權限才能透過 Messages.app 傳送訊息。
- 對於進階動作（react / edit / unsend / threaded reply / effects / group ops），必須停用系統完整性保護 — 請參閱下方[啟用 imsg 私有 API](#enabling-the-imsg-private-api)。基本文字與媒體傳送/接收不需要停用它。

<Tip>
權限是依程序環境授予的。如果閘道以 headless 方式執行（LaunchAgent/SSH），請在相同環境中執行一次互動式命令以觸發提示：

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH 包裝器傳送時因 AppleEvents -1743 失敗">
  遠端 SSH 設定可能可以讀取聊天、通過 `channels status --probe`，並處理入站訊息，但出站傳送仍因 AppleEvents 授權錯誤而失敗：

```text
Not authorized to send Apple events to Messages. (-1743)
```

檢查已登入 Mac 使用者的 TCC 資料庫，或系統設定 > 隱私權與安全性 > 自動化。如果自動化項目記錄的是 `/usr/libexec/sshd-keygen-wrapper`，而不是 `imsg` 或本機 shell 程序，macOS 可能不會為該 SSH 伺服器端用戶端顯示可用的 Messages 切換開關：

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

在這種狀態下，重複執行 `tccutil reset AppleEvents`，或透過相同 SSH 包裝器重新執行 `imsg send`，可能仍會持續失敗，因為需要 Messages 自動化權限的程序環境是 SSH 包裝器，而不是使用者介面可以授權的 app。

請改用其中一種受支援的 `imsg` 程序環境：

- 在已登入 Messages 使用者的本機工作階段中執行閘道，或至少執行 `imsg` 橋接器。
- 為該使用者使用 LaunchAgent 啟動閘道，並先從相同工作階段授予完整磁碟存取權與自動化權限。
- 如果你保留雙使用者 SSH 拓撲，請在啟用頻道前，驗證真正的出站 `imsg send` 可透過完全相同的包裝器成功。如果無法授予自動化權限，請改為重新設定成單一使用者 `imsg` 設定，不要依賴 SSH 包裝器進行傳送。

</Accordion>

## 啟用 imsg 私有 API

`imsg` 提供兩種操作模式：

- **基本模式**（預設，不需要 SIP 變更）：透過 `send` 傳送出站文字與媒體、入站 watch/history、聊天清單。這是全新執行 `brew install steipete/tap/imsg` 並搭配上方標準 macOS 權限後，開箱即用的結果。
- **私有 API 模式**：`imsg` 會將 helper dylib 注入 `Messages.app`，以呼叫內部 `IMCore` 函式。這會解鎖 `react`、`edit`、`unsend`、`reply`（threaded）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及輸入指示器和讀取回條。

若要使用此頻道頁面記載的進階動作介面，你需要私有 API 模式。`imsg` README 對這項需求說得很明確：

> `read`、`typing`、`launch`、橋接器支援的 rich send、訊息變更，以及聊天管理等進階功能為選擇性啟用。它們需要停用 SIP，並將 helper dylib 注入 `Messages.app`。啟用 SIP 時，`imsg launch` 會拒絕注入。

helper 注入技術使用 `imsg` 自己的 dylib 來存取 Messages 私有 API。在 OpenClaw iMessage 路徑中，沒有第三方伺服器或 BlueBubbles runtime。

<Warning>
**停用 SIP 是實際的安全取捨。** SIP 是 macOS 防止執行修改後系統程式碼的核心保護之一；在全系統關閉它會開啟額外攻擊面與副作用。值得注意的是，**在 Apple Silicon Mac 上停用 SIP 也會停用在 Mac 上安裝和執行 iOS app 的能力**。

請將此視為有意識的營運選擇，而不是預設值。如果你的威脅模型無法容忍 SIP 關閉，內建 iMessage 會限於基本模式 — 只能傳送/接收文字與媒體，沒有 reactions / edit / unsend / effects / group ops。
</Warning>

### 設定

1. **在執行 Messages.app 的 Mac 上安裝（或升級）`imsg`**：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 輸出會回報 `bridge_version`、`rpc_methods`，以及每個 method 的 `selectors`，讓你能在開始前看到目前 build 支援哪些內容。

2. **停用系統完整性保護，並且（在現代 macOS 上）停用程式庫驗證。** 將非 Apple helper dylib 注入 Apple 簽署的 `Messages.app`，需要關閉 SIP，**並且**放寬程式庫驗證。復原模式中的 SIP 步驟會因 macOS 版本而異：
   - **macOS 10.13-10.15（Sierra-Catalina）：** 透過 Terminal 停用程式庫驗證，重新啟動進入復原模式，執行 `csrutil disable`，再重新啟動。
   - **macOS 11+（Big Sur 及更新版本），Intel：** 復原模式（或 Internet 復原）、`csrutil disable`、重新啟動。
   - **macOS 11+，Apple Silicon：** 使用電源按鈕啟動序列進入復原；在較新的 macOS 版本中，點按繼續時按住 **Left Shift** 鍵，然後執行 `csrutil disable`。虛擬機器設定會遵循不同流程，因此請先建立 VM snapshot。

   **在 macOS 11 及更新版本上，單獨執行 `csrutil disable` 通常不足。** Apple 仍會把 `Messages.app` 作為 platform binary 強制執行程式庫驗證，因此 adhoc 簽署的 helper 會被拒絕（`Library Validation failed: ... platform binary, but mapped file is not`），即使 SIP 已關閉也是如此。停用 SIP 後，還要停用程式庫驗證並重新啟動：

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe），已於 26.5.1 驗證：** SIP 關閉**加上**上方的 `DisableLibraryValidation` 命令，足以在 26.0 到 26.5.x 之間注入 helper。**不需要 boot-args。** 該 plist 是決定性因素，也是 Tahoe 上注入失敗時最常缺少的步驟：
   - **有 plist：** `imsg launch` 會注入，且 `imsg status` 會回報 `advanced_features: true`。
   - **沒有 plist（即使 SIP 關閉）：** `imsg launch` 會以 `Failed to launch: Timeout waiting for Messages.app to initialize` 失敗。AMFI 在載入時拒絕 adhoc helper，因此橋接器永遠無法就緒，launch 最終逾時。該逾時是大多數人在 Tahoe 上遇到的症狀，修正方式是上方的 plist，而不是任何更激烈的做法。

   這已在 macOS 26.5.1（Apple Silicon）上以受控的前後對照確認：有 plist 時，dylib 會 map 進 `Messages.app` 且橋接器會啟動；移除 plist 並重新啟動後，`imsg launch` 會產生上方的逾時失敗，且 dylib 不會被 map。

   如果 `imsg launch` 注入或特定 `selectors` 在 macOS 升級後開始回傳 false，這個閘門通常就是原因。請先檢查你的 SIP 與程式庫驗證狀態，再判定 SIP 步驟本身失敗。如果這些設定正確，但橋接器仍無法注入，請收集 `imsg status --json` 以及 `imsg launch` 輸出，並回報給 `imsg` 專案，而不是削弱額外的全系統安全控制。

   在執行 `imsg launch` 前，依照 Apple 針對你的 Mac 提供的復原模式流程停用 SIP。

3. **注入輔助程式。** 在 SIP 已停用且 Messages.app 已登入的情況下：

   ```bash
   imsg launch
   ```

   當 SIP 仍啟用時，`imsg launch` 會拒絕注入，因此這也同時可確認步驟 2 已生效。

4. **從 OpenClaw 驗證橋接器：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 項目應回報 `works`，且 `imsg status --json | jq '.selectors'` 應顯示 `retractMessagePart: true`，以及你的 macOS 建置所公開的任何編輯 / 輸入中 / 已讀 selectors。OpenClaw 外掛在 `actions.ts` 中的逐方法閘門只會公開底層 selector 為 `true` 的動作，因此你在代理工具清單中看到的動作介面，反映的是橋接器在這台主機上實際能做的事。

如果 `openclaw channels status --probe` 回報頻道為 `works`，但特定動作在派送時拋出「iMessage `<action>` 需要 imsg 私有 API 橋接器」，請再次執行 `imsg launch` —— 輔助程式可能會脫離（Messages.app 重新啟動、作業系統更新等），而快取的 `available: true` 狀態會持續公開動作，直到下一次探測刷新為止。

### 無法停用 SIP 時

如果停用 SIP 不符合你的威脅模型：

- `imsg` 會退回基本模式——僅文字 + 媒體 + 接收。
- OpenClaw 外掛仍會公開文字/媒體傳送與傳入監控；它只是會從動作介面隱藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 與群組操作（依逐方法能力閘門）。
- 你可以讓另一台非 Apple-Silicon Mac（或專用機器人 Mac）在關閉 SIP 的情況下執行 iMessage 工作負載，同時讓主要裝置保持啟用 SIP。請參閱下方的 [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns)。

## 存取控制與路由

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` 控制直接訊息：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    允許清單欄位：`channels.imessage.allowFrom`。

    允許清單項目必須識別傳送者：帳號代號或靜態傳送者存取群組（`accessGroup:<name>`）。對於 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*` 這類聊天目標，請使用 `channels.imessage.groupAllowFrom`；對於數字 `chat_id` 註冊鍵，請使用 `channels.imessage.groups`。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` 控制群組處理：

    - `allowlist`（已設定時的預設值）
    - `open`
    - `disabled`

    群組傳送者允許清單：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 項目也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。

    執行階段備援：如果未設定 `groupAllowFrom`，iMessage 群組傳送者檢查會使用 `allowFrom`；當直接訊息與群組准入規則應不同時，請設定 `groupAllowFrom`。
    執行階段注意事項：如果完全缺少 `channels.imessage`，執行階段會退回 `groupPolicy="allowlist"` 並記錄警告（即使已設定 `channels.defaults.groupPolicy`）。

    <Warning>
    群組路由有**兩個**允許清單閘門會連續執行，而且兩者都必須通過：

    1. **傳送者 / 聊天目標允許清單**（`channels.imessage.groupAllowFrom`）——帳號代號、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群組註冊表**（`channels.imessage.groups`）——在 `groupPolicy: "allowlist"` 下，此閘門需要 `groups: { "*": { ... } }` 萬用字元項目（設定 `allowAll = true`），或 `groups` 下明確的逐 `chat_id` 項目。

    如果閘門 2 沒有任何內容，每則群組訊息都會被捨棄。外掛會在預設記錄層級發出兩個 `warn` 層級訊號：

    - 啟動時每個帳號一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 執行階段每個 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    直接訊息會繼續運作，因為它們採用不同的程式碼路徑。

    在 `groupPolicy: "allowlist"` 下讓群組持續流通的最小設定：

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

    如果這些 `warn` 行出現在閘道記錄中，表示閘門 2 正在捨棄訊息——請新增 `groups` 區塊。
    </Warning>

    群組的提及閘門：

    - iMessage 沒有原生提及中繼資料
    - 提及偵測使用 regex 模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 若未設定模式，就無法強制執行提及閘門

    來自已授權傳送者的控制命令可以在群組中略過提及閘門。

    逐群組 `systemPrompt`：

    `channels.imessage.groups.*` 下的每個項目都接受選用的 `systemPrompt` 字串。該值會在每次處理該群組訊息的回合中注入代理的系統提示。解析方式與 `channels.whatsapp.groups` 使用的逐群組提示解析一致：

    1. **群組專屬系統提示**（`groups["<chat_id>"].systemPrompt`）：當對應群組項目存在於對應表中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），則會抑制萬用字元，且不會將任何系統提示套用到該群組。
    2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於對應表中，或項目存在但未定義 `systemPrompt` 鍵時使用。

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

    逐群組提示只會套用到群組訊息——此頻道中的直接訊息不受影響。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - 直接訊息使用直接路由；群組使用群組路由。
    - 使用預設 `session.dmScope=main` 時，iMessage 直接訊息會合併到代理的主工作階段。
    - 群組工作階段會隔離（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回覆會使用來源頻道/目標中繼資料路由回 iMessage。

    類群組執行緒行為：

    某些多參與者 iMessage 執行緒可能會以 `is_group=false` 抵達。
    如果該 `chat_id` 已明確設定於 `channels.imessage.groups` 下，OpenClaw 會將其視為群組流量（群組閘門 + 群組工作階段隔離）。

  </Tab>
</Tabs>

## ACP 對話繫結

舊版 iMessage 聊天也可以繫結到 ACP 工作階段。

快速操作員流程：

- 在直接訊息或允許的群組聊天中執行 `/acp spawn codex --bind here`。
- 同一個 iMessage 對話中的後續訊息會路由到產生的 ACP 工作階段。
- `/new` 與 `/reset` 會就地重設同一個已繫結的 ACP 工作階段。
- `/acp close` 會關閉 ACP 工作階段並移除繫結。

支援透過頂層 `bindings[]` 項目設定持久繫結，並使用 `type: "acp"` 與 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 正規化的直接訊息帳號代號，例如 `+15555550123` 或 `user@example.com`
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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    使用專用 Apple ID 與 macOS 使用者，讓機器人流量與你的個人 Messages 個人檔案隔離。

    典型流程：

    1. 建立/登入專用 macOS 使用者。
    2. 在該使用者中使用機器人 Apple ID 登入 Messages。
    3. 在該使用者中安裝 `imsg`。
    4. 建立 SSH 包裝器，讓 OpenClaw 可以在該使用者情境中執行 `imsg`。
    5. 將 `channels.imessage.accounts.<id>.cliPath` 與 `.dbPath` 指向該使用者個人檔案。

    第一次執行可能需要在該機器人使用者工作階段中進行 GUI 核准（自動化 + 完整磁碟存取）。

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

    使用 SSH 金鑰，讓 SSH 與 SCP 都可非互動執行。
    請先確認主機金鑰已受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），使 `known_hosts` 已填入。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage 支援在 `channels.imessage.accounts` 下設定逐帳號組態。

    每個帳號都可以覆寫 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、歷史記錄設定，以及附件根目錄允許清單等欄位。

  </Accordion>

  <Accordion title="Direct-message history">
    設定 `channels.imessage.dmHistoryLimit`，可用該對話最近解碼的 `imsg` 歷史記錄初始化新的直接訊息工作階段。使用 `channels.imessage.dms["<sender>"].historyLimit` 可設定逐傳送者覆寫，包括設為 `0` 以停用某個傳送者的歷史記錄。

    iMessage 直接訊息歷史記錄會依需求從 `imsg` 擷取。未設定 `dmHistoryLimit` 會停用全域直接訊息歷史記錄初始化，但正數的逐傳送者 `channels.imessage.dms["<sender>"].historyLimit` 仍會為該傳送者啟用初始化。

  </Accordion>
</AccordionGroup>

## 媒體、分塊與傳遞目標

<AccordionGroup>
  <Accordion title="附件與媒體">
    - 傳入附件擷取預設為**關閉** — 設定 `channels.imessage.includeAttachments: true`，即可將照片、語音備忘錄、影片與其他附件轉送給代理。停用時，只有附件的 iMessages 會在抵達代理前被丟棄，而且可能完全不產生 `Inbound message` 記錄列。
    - 設定 `remoteHost` 時，可透過 SCP 擷取遠端附件路徑
    - 附件路徑必須符合允許的根目錄：
      - `channels.imessage.attachmentRoots`（本機）
      - `channels.imessage.remoteAttachmentRoots`（遠端 SCP 模式）
      - 預設根目錄模式：`/Users/*/Library/Messages/Attachments`
    - SCP 使用嚴格主機金鑰檢查（`StrictHostKeyChecking=yes`）
    - 傳出媒體大小使用 `channels.imessage.mediaMaxMb`（預設 16 MB）

  </Accordion>

  <Accordion title="傳出分段">
    - 文字分段限制：`channels.imessage.textChunkLimit`（預設 4000）
    - 分段模式：`channels.imessage.chunkMode`
      - `length`（預設）
      - `newline`（優先依段落分割）

  </Accordion>

  <Accordion title="定址格式">
    建議使用明確目標：

    - `chat_id:123`（建議用於穩定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支援 Handle 目標：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 私有 API 動作

當 `imsg launch` 正在執行，且 `openclaw channels status --probe` 回報 `privateApi.available: true` 時，訊息工具除了正常傳送文字外，也能使用 iMessage 原生動作。

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
    - **react**：新增/移除 iMessage 點按回應（`messageId`、`emoji`、`remove`）。支援的點按回應會對應到愛心、喜歡、不喜歡、大笑、強調與疑問。
    - **reply**：傳送對現有訊息的串接回覆（`messageId`、`text` 或 `message`，以及 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：傳送帶有 iMessage 效果的文字（`text` 或 `message`、`effect` 或 `effectId`）。
    - **edit**：在支援的 macOS/私有 API 版本上編輯已傳送訊息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在支援的 macOS/私有 API 版本上收回已傳送訊息（`messageId`）。
    - **upload-file**：傳送媒體/檔案（以 base64 表示的 `buffer`，或已補齊的 `media`/`path`/`filePath`、`filename`，可選 `asVoice`）。舊版別名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：在目前目標是群組對話時管理群組聊天室。

  </Accordion>

  <Accordion title="訊息 ID">
    傳入 iMessage 內容會在可用時同時包含短 `MessageSid` 值與完整訊息 GUID。短 ID 的範圍限於近期由 SQLite 支援的回覆快取，並且會在使用前與目前聊天室比對。如果短 ID 已過期或屬於另一個聊天室，請改用完整的 `MessageSidFull` 重試。

  </Accordion>

  <Accordion title="能力偵測">
    只有在快取的探測狀態表示橋接器不可用時，OpenClaw 才會隱藏私有 API 動作。如果狀態未知，動作仍會顯示，並在派送時延遲探測，讓第一個動作可以在 `imsg launch` 之後成功，而不需要另外手動重新整理狀態。

  </Accordion>

  <Accordion title="讀取回條與輸入中">
    私有 API 橋接器啟動時，已接受的傳入聊天室會被標記為已讀，直接聊天室也會在回合被接受後立即顯示輸入中氣泡，同時代理準備內容並產生回覆。可用以下方式停用標記已讀：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早於每方法能力清單的舊版 `imsg` 建置會靜默關閉輸入中/已讀功能；OpenClaw 會在每次重新啟動時記錄一次性警告，讓缺少回條的原因可追溯。

  </Accordion>

  <Accordion title="傳入點按回應">
    OpenClaw 會訂閱 iMessage 點按回應，並將已接受的反應路由為系統事件，而不是一般訊息文字，因此使用者的點按回應不會觸發普通的回覆迴圈。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（預設）：僅在使用者對機器人撰寫的訊息做出反應時通知。
    - `"all"`：對授權寄件者的所有傳入點按回應通知。
    - `"off"`：忽略傳入點按回應。

    個別帳號覆寫使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>

  <Accordion title="核准反應（👍 / 👎）">
    當 `approvals.exec.enabled` 或 `approvals.plugin.enabled` 為 true 且請求路由到 iMessage 時，閘道會以原生方式送出核准提示，並接受點按回應來解析：

    - `👍`（喜歡點按回應）→ `allow-once`
    - `👎`（不喜歡點按回應）→ `deny`
    - `allow-always` 仍是手動備用方式：以一般回覆傳送 `/approve <id> allow-always`。

    反應處理要求做出反應的使用者 Handle 必須是明確的核准者。核准者清單會從 `channels.imessage.allowFrom`（或 `channels.imessage.accounts.<id>.allowFrom`）讀取；請加入使用者的 E.164 格式電話號碼或其 Apple ID 電子郵件。萬用字元項目 `"*"` 會被接受，但允許任何寄件者核准。反應捷徑刻意略過 `reactionNotifications`、`dmPolicy` 與 `groupAllowFrom`，因為明確核准者允許清單是核准解析唯一重要的閘門。

    **此版本的行為變更：** 當 `channels.imessage.allowFrom` 非空時，`/approve <id> <decision>` 文字命令現在會依該核准者清單授權（而不是較廣泛的 DM 允許清單）。允許在 DM 允許清單中但不在 `allowFrom` 中的寄件者，會收到明確拒絕。請將每位應可透過 `/approve`（以及透過反應）核准的操作員加入 `allowFrom`，以保留先前行為。當 `allowFrom` 為空時，舊版「同聊天室備用」仍會生效，且 `/approve` 會繼續授權 DM 允許清單允許的任何人。

    操作員注意事項：
    - 反應綁定會同時儲存在記憶體中（TTL 與核准到期時間相符）以及閘道的持久化鍵值儲存中，因此在閘道重新啟動後不久送達的點按回應仍能解析核准。
    - 跨裝置 `is_from_me=true` 點按回應（操作員自己在已配對 Apple 裝置上的反應）會被刻意忽略，因此機器人無法自行核准。
    - 舊版文字樣式點按回應（非常舊的 Apple 用戶端傳來的 `Liked "…"` 純文字）無法解析核准，因為它們不帶訊息 GUID；反應解析需要目前 macOS / iOS 用戶端送出的結構化點按回應中繼資料。

  </Accordion>
</AccordionGroup>

## 設定寫入

iMessage 預設允許通道發起的設定寫入（當 `commands.config: true` 時用於 `/config set|unset`）。

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

## 合併分拆傳送的 DM（一個撰寫內容中包含命令 + URL）

當使用者同時輸入命令和 URL，例如 `Dump https://example.com/article`，Apple 的 Messages app 會將傳送內容拆成**兩個獨立的 `chat.db` 資料列**：

1. 文字訊息（`"Dump"`）。
2. URL 預覽氣泡（`"https://..."`），並附帶 OG 預覽圖片作為附件。

在多數設定中，這兩個資料列會相隔約 0.8-2.0 秒抵達 OpenClaw。若不合併，代理會在第 1 回合只收到命令並回覆（通常是「把 URL 傳給我」），然後在第 2 回合才看到 URL，而此時命令內容已經遺失。這是 Apple 的傳送管線，不是 OpenClaw 或 `imsg` 引入的行為。

`channels.imessage.coalesceSameSenderDms` 會讓 DM 選擇緩衝連續的同寄件者資料列。當 `imsg` 在其中一個來源資料列上公開結構化 URL 預覽標記 `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` 時，OpenClaw 只會合併該真正的分拆傳送，並將任何其他已緩衝資料列保留為獨立回合。在完全不輸出氣泡中繼資料的舊版 `imsg` 建置上，OpenClaw 無法分辨分拆傳送與分開傳送，因此會退回合併整個緩衝桶。這會保留中繼資料出現前的行為，而不是讓 `Dump <url>` 分拆傳送退化成兩個回合。群組聊天室會繼續逐訊息派送，因此能保留多使用者回合結構。

<Tabs>
  <Tab title="何時啟用">
    在以下情況啟用：

    - 你發布的 Skills 預期在同一則訊息中收到 `command + payload`（dump、paste、save、queue 等）。
    - 你的使用者會把 URL 與命令一起貼上。
    - 你可以接受增加的 DM 回合延遲（見下方）。

    在以下情況保持停用：

    - 你需要單字 DM 觸發器的最低命令延遲。
    - 你的所有流程都是沒有後續承載資料的一次性命令。

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

    開啟此旗標且未明確設定 `messages.inbound.byChannel.imessage` 或全域 `messages.inbound.debounceMs` 時，防彈跳視窗會加寬到 **7000 ms**（舊版預設為 0 ms — 無防彈跳）。需要更寬的視窗，是因為 Apple 的 URL 預覽分拆傳送節奏可能延伸到數秒，Messages.app 才會輸出預覽資料列。

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
  <Tab title="取捨">
    - **精確合併需要目前的 `imsg` 承載中繼資料。** 當 URL 資料列包含 `balloon_bundle_id` 時，只會合併該真正的分拆傳送，其他已緩衝資料列會保持分開。在未公開氣泡中繼資料的舊版 `imsg` 建置上，OpenClaw 會退回合併已緩衝的桶，因此 `Dump <url>` 分拆傳送不會退化成兩個回合（臨時向後相容，等 `imsg` 在上游合併分拆傳送後移除）。
    - **DM 訊息會增加延遲。** 開啟此旗標後，每個 DM（包含獨立控制命令和單一文字後續回覆）都會等待最多一個防彈跳視窗再派送，以防 URL 預覽資料列即將到來。群組聊天室訊息維持即時派送。
    - **合併輸出有界限。** 合併文字上限為 4000 個字元，並帶有明確的 `…[truncated]` 標記；附件上限為 20；來源項目上限為 10（超過後保留第一個加最新項目）。每個來源 GUID 都會記錄在 `coalescedMessageGuids` 中，供下游遙測使用。
    - **僅限 DM。** 群組聊天室會落入逐訊息派送，因此在多人輸入時機器人仍保持回應。
    - **選擇加入、依通道設定。** 其他通道（Telegram、WhatsApp、Slack、…）不受影響。設定 `channels.bluebubbles.coalesceSameSenderDms` 的舊版 BlueBubbles 設定，應將該值遷移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 情境與代理看到的內容

「Flag on」欄顯示在會發出 `balloon_bundle_id` 的 `imsg` 建置上的行為。在完全不發出氣泡中繼資料的較舊 `imsg` 建置上，下方標示為「兩個回合」/「N 個回合」的列會改為退回到舊版合併（一個回合）：OpenClaw 無法從結構上分辨拆分傳送與分開傳送，因此會保留中繼資料之前的合併行為。一旦建置開始發出氣泡中繼資料，就會啟用精確分離。

| 使用者撰寫                                                        | `chat.db` 產生                    | 旗標關閉（預設）                        | 旗標開啟 + 視窗（imsg 發出氣泡中繼資料）                                                            |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（一次傳送）                             | 約相隔 1 秒的 2 列                 | 兩個代理程式回合：「Dump」單獨一個，接著是 URL | 一個回合：合併文字 `Dump https://example.com`                                                       |
| `Save this 📎image.jpg caption`（附件 + 文字）                     | 沒有 URL 氣泡中繼資料的 2 列       | 兩個回合                               | 觀察到中繼資料後為兩個回合；在舊版/閂鎖前且沒有中繼資料的工作階段中為一個合併回合                  |
| `/status`（獨立命令）                                              | 1 列                               | 立即分派                                | **最多等待到視窗時間，然後分派**                                                                    |
| 單獨貼上的 URL                                                     | 1 列                               | 立即分派                                | 最多等待到視窗時間，然後分派                                                                        |
| 文字 + URL 以兩則刻意分開的訊息傳送，間隔數分鐘                   | 視窗外的 2 列                      | 兩個回合                               | 兩個回合（視窗在兩者之間過期）                                                                      |
| 快速大量傳送（視窗內超過 10 則小型 DM）                           | 沒有 URL 氣泡中繼資料的 N 列       | N 個回合                                | 觀察到中繼資料後為 N 個回合；在舊版/閂鎖前且沒有中繼資料的工作階段中為一個有界合併回合             |
| 群組聊天中有兩個人正在輸入                                         | 來自 M 個寄件者的 N 列             | M+ 個回合（每個寄件者儲存桶一個）       | M+ 個回合 — 群組聊天不會合併                                                                        |

## 橋接或閘道重新啟動後的傳入復原

iMessage 會復原閘道停機期間遺漏的訊息，同時抑制 Apple 在 Push 復原後可能傾出的過時「積壓炸彈」。預設行為一律啟用，並建立在傳入去重之上。

- **重播去重。** 每則已分派的傳入訊息都會依其 Apple GUID 記錄在持久化外掛狀態（`imessage.inbound-dedupe`）中，在擷取時宣告，並在處理後提交（暫時性失敗時釋放，讓它可以重試）。任何已處理的項目都會被捨棄，而不是分派兩次。這讓復原能夠積極重播，而不需要逐則訊息記帳。
- **停機復原。** 啟動時，監視器會記住最後分派的 `chat.db` rowid（持久化的每帳戶游標），並將其作為 `since_rowid` 傳給 `imsg watch.subscribe`，因此 imsg 會重播閘道停機期間落入的列，接著追蹤即時資料。重播會限制在最近的列，以及最多約 2 小時前的訊息，而去重會捨棄任何已處理的項目。
- **過時積壓年齡柵欄。** 啟動邊界以上的列是真正的即時訊息；若某列的傳送日期比抵達時間早超過約 15 分鐘，就是 Push 傾出的積壓訊息，會被抑制。重播的列（位於邊界或以下）則使用較寬的復原視窗，因此最近遺漏的訊息會送達，而久遠歷史不會。

復原可同時在本機與遠端 `cliPath` 設定上運作，因為 `since_rowid` 重播會透過相同的 `imsg` RPC 連線執行。差異在於視窗：當閘道可以讀取 `chat.db`（本機）時，它會錨定啟動 rowid 邊界、限制重播範圍，並送達最多數小時前遺漏的訊息。透過遠端 SSH `cliPath` 時，它無法讀取資料庫，因此重播不設上限，且每列都使用即時年齡柵欄 — 它仍會復原最近遺漏的訊息，也仍會抑制舊積壓，只是使用較窄的即時視窗。請在 Messages 的 Mac 上執行閘道，以取得較寬的復原視窗。

### 操作者可見訊號

被抑制的積壓會以預設層級記錄，絕不會靜默捨棄（`recovery` 旗標顯示套用哪個視窗）：

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 遷移

`channels.imessage.catchup.*` 已被取代 — 停機復原現在是自動的，新設定不需要任何設定。含有 `catchup.enabled: true` 的既有設定仍會作為復原重播視窗的相容性設定檔受到支援。停用的 catchup 區塊（`enabled: false` 或沒有 `enabled: true`）已退役；`openclaw doctor --fix` 會移除這些項目。

## 疑難排解

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支援 RPC">
    驗證二進位檔與 RPC 支援：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探測回報不支援 RPC，請更新 `imsg`。如果私有 API 動作無法使用，請在已登入的 macOS 使用者工作階段中執行 `imsg launch`，然後再次探測。如果閘道不是在 macOS 上執行，請改用上方的透過 SSH 使用遠端 Mac 設定，而不是預設的本機 `imsg` 路徑。

  </Accordion>

  <Accordion title="Messages 可以傳送，但傳入 iMessage 沒有抵達">
    先證明訊息是否到達本機 Mac。如果 `chat.db` 沒有變更，即使 `imsg status --json` 回報橋接正常，OpenClaw 也無法接收該訊息。

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

    從手機傳送一則新的 iMessage，並在除錯 OpenClaw 工作階段前確認有新的 `chat.db` 列或 `imsg watch` 事件。不要將這作為週期性的橋接重新啟動迴圈；在使用中重複 `imsg launch` 加上閘道重新啟動，可能會中斷傳遞並讓進行中的頻道執行擱置。

  </Accordion>

  <Accordion title="閘道未在 macOS 上執行">
    預設的 `cliPath: "imsg"` 必須在登入 Messages 的 Mac 上執行。在 Linux 或 Windows 上，請將 `channels.imessage.cliPath` 設為會 SSH 到該 Mac 並執行 `imsg "$@"` 的包裝指令碼。

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
    - 來自閘道主機的 SSH/SCP 金鑰驗證
    - 閘道主機上的 `~/.ssh/known_hosts` 中存在主機金鑰
    - 執行 Messages 的 Mac 上遠端路徑的可讀性

  </Accordion>

  <Accordion title="錯過 macOS 權限提示">
    在相同使用者/工作階段內容中的互動式 GUI 終端機重新執行並核准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    確認已為執行 OpenClaw/`imsg` 的程序內容授予完整磁碟存取權 + 自動化權限。

  </Accordion>
</AccordionGroup>

## 設定參考指標

- [設定參考 - iMessage](/zh-TW/gateway/config-channels#imessage)
- [閘道設定](/zh-TW/gateway/configuration)
- [配對](/zh-TW/channels/pairing)

## 相關

- [頻道概觀](/zh-TW/channels) — 所有支援的頻道
- [移除 BlueBubbles 與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage) — 公告與遷移摘要
- [從 BlueBubbles 轉移](/zh-TW/channels/imessage-from-bluebubbles) — 設定轉換表與逐步切換
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
