---
read_when:
    - 設定安全二進位檔或自訂安全二進位檔設定檔
    - 將核准請求轉送至 Slack、Discord、Telegram 或其他聊天頻道
    - 為頻道實作原生核准用戶端
summary: 進階 exec 核准：安全二進位檔、直譯器綁定、核准轉送、原生傳遞
title: 執行核准 — 進階
x-i18n:
    generated_at: "2026-07-22T10:52:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac90d41f867a8ae4f14b6c9c13f3732d102a65707f456623932b858145a9bf46
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

進階執行核准主題：`safeBins` 快速路徑、直譯器／執行階段
繫結，以及將核准轉送至聊天頻道（包括原生傳遞）。
如需核心政策與核准流程，請參閱[執行核准](/zh-TW/tools/exec-approvals)。

## 安全二進位檔（僅限 stdin）

`tools.exec.safeBins` 指定**僅限 stdin** 的二進位檔（例如 `cut`），這些二進位檔
可在允許清單模式下執行，**不需要**明確的允許清單項目。安全二進位檔會拒絕
位置式檔案引數及類似路徑的權杖，因此只能處理
傳入的串流。請將此機制視為串流篩選器的狹義快速路徑，而非
通用信任清單。

<Warning>
請**勿**將直譯器或執行階段二進位檔（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）新增至 `safeBins`。如果命令依設計即可評估程式碼、
執行子命令或讀取檔案，請優先使用明確的允許清單項目，
並保持啟用核准提示。自訂安全二進位檔必須在
`tools.exec.safeBinProfiles.<bin>` 中定義明確的設定檔。
</Warning>

預設安全二進位檔：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在預設清單中。如果你選擇加入，請為其非 stdin
工作流程保留明確的允許清單項目。在安全二進位檔模式下使用 `grep` 時，
請透過 `-e`/`--regexp` 提供模式；系統會拒絕位置式模式形式，
以免檔案運算元偽裝成語意不明的位置式引數。

### Argv 驗證與拒絕的旗標

驗證僅根據 argv 形態以確定性方式進行（不檢查主機檔案系統中是否存在
相關檔案），這可防止允許／拒絕差異洩漏檔案是否存在的資訊。
預設安全二進位檔會拒絕檔案導向的選項；長選項採用故障關閉驗證（拒絕未知旗標
及語意不明的縮寫）。預設二進位檔可辨識的唯讀布林旗標（例如
`wc -l`、`tr -d`、`uniq -c`）可被接受，而無法辨識的短旗標則維持
故障關閉，並轉交手動核准。

依安全二進位檔設定檔列出的拒絕旗標：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `tail`：`--follow`、`--retry`、`-F`、`-f`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

對於僅限 stdin 的區段，安全二進位檔也會強制要求在執行時將 argv 權杖視為**常值文字**
（不進行 glob 展開，也不展開 `$VARS`），因此
無法使用 `*` 或 `$HOME/...` 等模式夾帶檔案讀取。`awk`、
`sed` 和 `jq` 一律不得作為安全二進位檔，因為無法驗證其語意
僅限 stdin：`jq` 可以讀取環境資料，並從
模組或啟動檔案載入 jq 程式碼。請改為對這些工具使用明確的允許清單項目或核准提示，
而不要使用 `safeBins`。

### 受信任的二進位檔目錄

安全二進位檔必須從受信任的二進位檔目錄解析（系統預設值加上
選用的 `tools.exec.safeBinTrustedDirs`）。`PATH` 中的項目絕不會自動受信任。
預設受信任目錄刻意維持在最少範圍：`/bin`、`/usr/bin`。如果
你的安全二進位執行檔位於套件管理工具／使用者路徑（例如
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），請將它們
明確新增至 `tools.exec.safeBinTrustedDirs`。

### Shell 鏈結、包裝器與多工器

只要每個頂層區段都符合允許清單（包括安全二進位檔或 Skills 自動允許），
即可使用 Shell 鏈結（`&&`、`||`、`;`）。
允許清單模式仍不支援重新導向。允許清單剖析期間會拒絕命令替換
（`$()`／反引號），包括雙引號內的命令替換；若需要常值
`$()` 文字，請使用單引號。

在 macOS 輔助 App 核准中，若原始 Shell 文字包含 Shell 控制或
展開語法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`），
除非 Shell 二進位檔本身已列入允許清單，否則會視為未符合允許清單。

對於 Shell 包裝器（`bash|sh|zsh ... -c/-lc`），要求範圍內的環境覆寫會
縮減為一份小型明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、
`NO_COLOR`、`FORCE_COLOR`）。

針對允許清單模式下的 `allow-always` 決策，透明分派包裝器
（例如 `env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存
內部執行檔路徑，而不是包裝器路徑。Shell 多工器
（`busybox`、`toybox`）也會以相同方式針對 Shell 小程式（`sh`、`ash` 等）解除包裝。
如果無法安全地解除包裝某個包裝器或多工器，則不會自動保存
允許清單項目。

如果你將 `python3` 或 `node` 等直譯器列入允許清單，請優先使用
`tools.exec.strictInlineEval=true`，如此一來，行內評估仍需明確
核准。在嚴格模式下，`allow-always` 仍可保存無害的
直譯器／指令碼叫用，但不會自動保存行內評估載體。

### 安全二進位檔與允許清單的比較

| 主題             | `tools.exec.safeBins`                                  | 允許清單（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目標             | 自動允許範圍狹窄的 stdin 篩選器                       | 明確信任特定執行檔                                                                 |
| 比對類型         | 執行檔名稱 + 安全二進位檔 argv 政策                    | 已解析執行檔路徑 glob，或透過 PATH 叫用之命令的裸命令名稱 glob                    |
| 引數範圍         | 受安全二進位檔設定檔及常值權杖規則限制                 | 預設依路徑比對；選用的 `argPattern` 可限制剖析後的 argv                     |
| 典型範例         | `head`、`tail`、`tr`、`wc`                             | `jq`、`python3`、`node`、`ffmpeg`、自訂命令列介面 |
| 最佳用途         | 流水線中的低風險文字轉換                               | 任何具有較廣泛行為或副作用的工具                                                   |

設定位置：

- `safeBins` 來自設定（`tools.exec.safeBins` 或每個代理程式的 `agents.entries.*.tools.exec.safeBins`）。
- `safeBinTrustedDirs` 來自設定（`tools.exec.safeBinTrustedDirs` 或每個代理程式的 `agents.entries.*.tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 來自設定（`tools.exec.safeBinProfiles` 或每個代理程式的 `agents.entries.*.tools.exec.safeBinProfiles`）。每個代理程式的設定檔索引鍵會覆寫全域索引鍵。
- 允許清單項目位於 `agents.<id>.allowlist` 下的主機本機核准檔案中（或透過控制介面／`openclaw approvals allowlist ...`）。
- 當直譯器／執行階段二進位檔出現在 `safeBins` 中但沒有明確設定檔時，`openclaw security audit` 會透過 `tools.exec.safe_bins_interpreter_unprofiled` 發出警告。
- `openclaw doctor --fix` 可將缺少的自訂 `safeBinProfiles.<bin>` 項目建構為 `{}`（之後請檢閱並收緊限制）。直譯器／執行階段二進位檔不會自動建構。

自訂設定檔範例：

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## 直譯器／執行階段命令

由核准支援的直譯器／執行階段執行刻意採取保守策略：

- 一律繫結確切的 argv/cwd/env 上下文。
- 直接 Shell 指令碼和直接執行階段檔案形式會盡可能繫結至單一具體的本機
  檔案快照。
- 仍可解析至單一直接本機檔案的常見套件管理工具包裝器形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）會在繫結前解除包裝。
- 如果 OpenClaw 無法為直譯器／執行階段命令精確識別出一個具體的本機檔案
  （例如套件指令碼、評估形式、執行階段特有的載入器鏈或語意不明的多檔案
  形式），則會拒絕由核准支援的執行，而不會宣稱具有實際上並未涵蓋的語意
  範圍。
- 對於這些工作流程，請優先使用沙箱、獨立的主機邊界，或明確受信任的
  允許清單／完整工作流程，由操作者接受範圍更廣的執行階段語意。

需要核准時，執行工具會立即傳回核准 ID。使用該 ID
關聯後續獲准執行的系統事件（`Exec finished`，以及設定後的 `Exec running`）。
如果逾時前未收到決策，該要求會視為核准逾時，
並以終止性的主機命令拒絕回報。對於具有來源工作階段的主代理程式非同步核准，
OpenClaw 也會透過內部後續處理恢復該工作階段，讓代理程式得知
命令並未執行，而不是稍後嘗試修補缺少的結果。待處理的執行核准預設會在
30 分鐘後到期。

### 後續傳遞行為

獲准的非同步執行完成後，OpenClaw 會將後續 `agent` 回合傳送至相同工作階段。
遭拒絕的非同步核准也會透過相同的主工作階段後續處理路徑傳遞拒絕狀態，但不會
註冊提升權限的執行階段交接，也不會執行命令。若拒絕沒有可恢復的
主工作階段，則會加以抑制，或在存在安全直接路徑時透過該路徑回報。

- 如果存在有效的外部傳遞目標（可傳遞的頻道加上目標 `to`），後續傳遞會使用該頻道。
- 在只有網頁聊天或沒有外部目標的內部工作階段流程中，後續傳遞僅保留於工作階段內（`deliver: false`）。
- 如果呼叫端明確要求嚴格的外部傳遞，但無法解析外部頻道，要求會以 `INVALID_REQUEST` 失敗。
- 如果已啟用 `bestEffortDeliver` 且無法解析外部頻道，傳遞會降級為僅限工作階段，而不是失敗。

## 第三方用戶端的最小範圍

閘道核准解析受到專用 `operator.approvals` 範圍保護。這同時適用於擁有者專屬的 `exec.approval.resolve` 方法和不區分類型的 `approval.resolve` 方法；`operator.write` 並不涵蓋該範圍。儀表板和整合應只要求其所用方法需要的範圍。請將核准解析存取權視為等同遠端執行等級的權限，並審慎授予 `operator.approvals`，即使用戶端只呈現小型核准介面亦然。

## 將核准轉送至聊天頻道

你可以將 exec 核准提示轉送至任何聊天頻道（包括外掛頻道），並使用 `/approve` 核准這些提示。此功能使用一般的對外傳送流水線。

設定：

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

在聊天中回覆：

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

`/approve` 命令同時處理 exec 核准和外掛核准。如果 ID 不符合任何待處理的 exec 核准，它會改為自動檢查外掛核准。此後援僅限於「找不到核准」失敗；真正的 exec 核准拒絕／錯誤不會無提示地以外掛核准重試。

### 外掛核准轉送

外掛核准轉送使用與 exec 核准相同的傳送流水線，但在 `approvals.plugin` 下有自己的獨立設定。啟用或停用其中一種不會影響另一種。關於外掛撰寫行為、請求欄位和決策語意，請參閱[外掛權限請求](/plugins/plugin-permission-requests)。

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

設定結構與 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的運作方式相同。

支援共用互動式回覆的頻道會為 exec 和外掛核准呈現相同的核准按鈕。沒有共用互動式 UI 的頻道會改用純文字及 `/approve` 指示。外掛核准請求可能會限制可用決策：核准介面會使用請求宣告的決策集合，而閘道會拒絕提交未提供之決策的嘗試。

### 任何頻道中的同一聊天核准

當 exec 或外掛核准請求源自可傳送訊息的聊天介面時，依預設，同一個聊天可使用 `/approve` 核准該請求。除了既有的 Web UI 和終端 UI 流程外，這也適用於 Slack、Matrix、Microsoft Teams 及類似的可傳送訊息聊天，並使用該對話的一般頻道驗證模型。如果來源聊天已能傳送命令並接收回覆，核准請求就不再需要僅為了維持待處理狀態而使用獨立的原生傳送轉接器。

Discord、Telegram 和 QQ Bot 也支援同一聊天中的 `/approve`，但即使原生核准傳送已停用，這些頻道仍會使用其解析出的核准者清單進行授權。

### 原生核准傳送

部分頻道也可充當原生核准用戶端：Discord、Slack、Telegram、Matrix 和 QQ Bot。除了共用的同一聊天 `/approve` 流程之外，原生用戶端還會加入核准者私訊、來源聊天扇出，以及頻道特定的互動式核准使用者體驗。

當原生核准卡片／按鈕可用時，該原生 UI 是面向代理程式的主要途徑。除非工具結果指出聊天核准不可用，或手動核准是唯一剩餘途徑，否則代理程式不應再於一般聊天中重複顯示 `/approve` 命令。

如果已設定原生核准用戶端，但來源頻道沒有作用中的原生執行階段，OpenClaw 會讓本機確定性的 `/approve` 提示保持可見。如果原生執行階段處於作用中並嘗試傳送，但沒有任何目標收到卡片，OpenClaw 會在同一聊天中傳送後援通知，並附上確切的 `/approve <id> <decision>` 命令，讓請求仍可獲得處理。

一般模型：

- 主機 exec 政策仍決定是否需要 exec 核准
- `approvals.exec` 控制是否將核准提示轉送至其他聊天目的地
- `channels.<channel>.execApprovals` 控制是否啟用 Discord、Slack、Telegram、QQ Bot 及類似的頻道特定原生用戶端
- 當請求來自 Slack 且可解析出 Slack 外掛核准者時，Slack 外掛核准可使用 Slack 的原生核准用戶端；即使 Slack exec 核准已停用，`approvals.plugin` 也可將外掛核准路由至 Slack 工作階段或目標
- 當可從 `dm.allowFrom` 或 `defaultTo` 解析出穩定的 `users/<id>` 核准者時，Google Chat 原生核准卡片會處理源自 Google Chat 聊天室或討論串的 exec 和外掛核准；它們不使用表情回應事件做出決策
- WhatsApp 和 Signal 的表情回應核准傳送由 `approvals.exec` 和 `approvals.plugin` 控制；它們沒有 `channels.<channel>.execApprovals` 區塊

當下列條件全部成立時，原生核准用戶端會自動啟用以私訊優先的傳送：

- 頻道支援原生核准傳送
- 可從明確的 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 等擁有者身分解析出核准者
- `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`

將 `enabled: false` 設為停用，可明確停用原生核准用戶端。當可解析出核准者時，將 `enabled: true` 設為強制啟用。公開的來源聊天傳送仍需透過 `channels.<channel>.execApprovals.target` 明確設定。當原生 `target` 啟用來源聊天傳送時，核准提示會包含命令文字。

常見問題：[為什麼聊天核准有兩個 exec 核准設定？](/help/faq-first-run)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`
- QQ Bot：`channels.qqbot.execApprovals.*`
- Google Chat：使用 `channels.googlechat.dm.allowFrom` 或 `channels.googlechat.defaultTo` 設定穩定的核准者；不需要 `execApprovals` 區塊
- WhatsApp：使用 `approvals.exec` 和 `approvals.plugin` 將核准提示路由至 WhatsApp
- Signal：使用 `approvals.exec` 和 `approvals.plugin` 將核准提示路由至 Signal

原生用戶端特定路由：

- Telegram 預設使用核准者私訊（`target: "dm"`）。切換至 `channel` 或 `both`，也可在來源 Telegram 聊天／主題中顯示核准提示。對於 Telegram 論壇主題，OpenClaw 會為核准提示和核准後續訊息保留該主題。
- Discord 和 Telegram 核准者可以明確設定（`execApprovals.approvers`），也可從 `commands.ownerAllowFrom` 推斷；只有解析出的核准者才能核准或拒絕。
- Slack 核准者可以明確設定（`execApprovals.approvers`），也可從 `commands.ownerAllowFrom` 推斷。Slack 外掛核准私訊使用來自 `allowFrom` 的 Slack 外掛核准者和帳號預設路由，而非 Slack exec 核准者。Slack 原生按鈕會保留核准 ID 種類，因此 `plugin:` ID 無須第二個 Slack 本機後援層即可處理外掛核准。
- Google Chat 原生卡片會在訊息文字中保留手動 `/approve` 後援，但卡片按鈕回呼只攜帶不透明的動作權杖；核准 ID 和決策會從伺服器端的待處理狀態復原。
- 當相符的頂層轉送系列路由至 WhatsApp 時，WhatsApp 表情符號核准會同時處理 exec 和外掛提示。原生來源提示會直接繫結；共用目標模式傳送則會將相同的具型別核准中繼資料繫結至已接受的 WhatsApp 訊息收件記錄。
- 只有在相符的頂層轉送系列已啟用並路由至 Signal 時，Signal 表情回應核准才會同時處理 exec 和外掛提示。直接的同一聊天 Signal exec 核准可在沒有明確核准者的情況下隱藏本機 `/approve` 後援；Signal 表情回應處理仍需要來自 `channels.signal.allowFrom` 或 `defaultTo` 的明確 Signal 核准者。
- Matrix 原生私訊／頻道路由和表情回應捷徑會同時處理 exec 和外掛核准；外掛授權仍來自 `channels.matrix.dm.allowFrom`。Matrix 原生提示會在第一個提示事件中包含 `com.openclaw.approval` 自訂事件內容，讓支援 OpenClaw 的 Matrix 用戶端可讀取結構化核准狀態，而一般用戶端則保留純文字 `/approve` 後援。
- 原生 Discord 和 Telegram 核准按鈕會在傳輸私有的回呼資料中攜帶明確的 exec 或外掛擁有者種類，且只處理該擁有者。缺少種類的舊版 `/approve` 控制項仍作為有限的相容性途徑：它們只會嘗試執行者可能有權核准的擁有者種類，僅在收到找不到核准的結果後才繼續，且絕不從核准 ID 推斷擁有權。
- 請求者不必是核准者。
- 如果沒有操作員 UI 或已設定的核准用戶端可接受請求，提示會後援至 `askFallback`。

`/diagnostics` 和 `/export-trajectory` 等敏感的僅限擁有者群組命令，會對核准提示和最終結果使用私密擁有者路由。OpenClaw 會先嘗試在擁有者執行命令的同一介面上使用私密路由。如果該介面沒有私密擁有者路由，則會改用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，因此當 Telegram 是設定的主要私密介面時，Discord 群組命令仍可將核准和結果傳送至擁有者的 Telegram 私訊。群組聊天只會收到簡短的確認訊息。

另請參閱：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ Bot](/channels/qqbot)

### 官方行動操作員應用程式

使用 `operator.admin` 連線時，或請求明確指定其配對的 `operator.approvals` 裝置時，官方 iOS 和 Android 應用程式也可審查由閘道擁有的待處理 exec 核准。它們會讀取 Control UI 所使用的同一筆已淨化持久記錄、提交可辨識種類的決策，並顯示閘道的標準首次回覆結果。Apple Watch 會透過配對的 iPhone 鏡像顯示這些核准提示，並提供允許一次和拒絕動作。直接 Watch 閘道模式不會審查核准。

遺失處理確認並不會讓已提交的選擇成為權威結果：應用程式會停用控制項並再次讀取記錄。如果另一個介面先完成處理，應用程式會顯示該筆已記錄的決策。待處理提示仍會繫結至發出提示的閘道，因此切換作用中的閘道無法重新導向舊的核准 ID。

### macOS IPC 流程

```
閘道 -> 節點服務 (WS)
                 |  IPC (UDS + 權杖 + HMAC + TTL)
                 v
             Mac 應用程式 (UI + 核准 + system.run)
```

安全性注意事項：

- Unix 通訊端模式 `0600`，權杖儲存於 `exec-approvals.json`。
- 相同 UID 對等端檢查。
- 挑戰／回應（nonce + HMAC 權杖 + 請求雜湊）+ 短 TTL。

## 常見問題

### 在核准目標上何時會使用 `accountId` 和 `threadId`？

當頻道設定了多個身分，且核准提示必須透過特定帳號送出時，請使用 `accountId`。當目的地支援主題或討論串，且提示應留在該討論串而非頂層聊天中時，請使用 `threadId`。

一個具體的 Telegram 案例是：具有論壇主題和兩個 Telegram Bot 帳號的維運超級群組。`to` 值指定該超級群組，`accountId` 選取 Bot 帳號，而 `threadId` 選取論壇主題：

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operations bot",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

使用此設定時，轉送的執行核准會由 `ops-bot` Telegram 帳號發布到聊天 `-1001234567890` 的主題
`77`。未指定 `accountId` 的目標會使用該頻道的預設帳號，而未指定
`threadId` 的目標則會發布到最上層目的地。

### 將核准傳送到工作階段時，該工作階段中的任何人都能核准嗎？

不能。工作階段傳送僅控制提示顯示的位置，本身並不會授權該聊天中的所有
參與者進行核准。

對於一般的同一聊天 `/approve`，傳送者必須已獲授權，才能在該
頻道工作階段中使用命令。如果頻道提供明確的核准者，這些核准者即使未獲授權在該工作階段中使用命令，
仍可授權 `/approve` 動作。

有些頻道的限制更嚴格。Discord、Telegram、Matrix、Slack 原生核准私訊，以及類似的
原生核准用戶端，會使用其解析出的核准者清單進行核准授權。例如，
Telegram 論壇主題中的核准提示可能對主題內所有人可見，但只有從 `channels.telegram.execApprovals.approvers` 或
`commands.ownerAllowFrom` 解析出的數字 Telegram 使用者 ID 才能核准或拒絕。

## 相關內容

- [執行核准](/zh-TW/tools/exec-approvals) — 核心政策與核准流程
- [執行工具](/zh-TW/tools/exec)
- [提升模式](/zh-TW/tools/elevated)
- [Skills](/zh-TW/tools/skills) — 由技能支援的自動允許行為
