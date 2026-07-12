---
read_when:
    - 設定安全二進位檔或自訂安全二進位檔設定檔
    - 將核准請求轉送至 Slack、Discord、Telegram 或其他聊天頻道
    - 為頻道實作原生核准用戶端
summary: 進階執行核准：安全二進位檔、直譯器繫結、核准轉送、原生傳遞
title: Exec 核准 — 進階
x-i18n:
    generated_at: "2026-07-12T14:53:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

進階執行核准主題：`safeBins` 快速路徑、直譯器／執行階段
繫結，以及將核准轉送至聊天頻道（包括原生遞送）。
如需核心政策與核准流程，請參閱[執行核准](/zh-TW/tools/exec-approvals)。

## 安全二進位檔（僅限 stdin）

`tools.exec.safeBins` 指定**僅限 stdin** 的二進位檔（例如 `cut`），這些二進位檔
可在允許清單模式下執行，**無須**明確的允許清單項目。安全二進位檔會拒絕
位置式檔案引數與類似路徑的權杖，因此只能處理
傳入的資料流。請將此功能視為資料流篩選器的狹窄快速路徑，而非
一般信任清單。

<Warning>
請**勿**將直譯器或執行階段二進位檔（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）加入 `safeBins`。如果某個命令依設計即可評估程式碼、
執行子命令或讀取檔案，請優先使用明確的允許清單項目，
並維持啟用核准提示。自訂安全二進位檔必須在
`tools.exec.safeBinProfiles.<bin>` 中定義明確的設定檔。
</Warning>

預設安全二進位檔：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在預設清單中。如果你選擇啟用，請為其非 stdin
工作流程保留明確的允許清單項目。在安全二進位檔模式下使用 `grep` 時，
請透過 `-e`／`--regexp` 提供模式；位置式模式形式會遭拒絕，
以免檔案運算元偽裝成語意不明的位置式引數。

### Argv 驗證與禁止的旗標

驗證完全依據 argv 的形態以確定性方式進行（不檢查主機檔案系統中是否存在檔案），
這可防止允許／拒絕差異形成檔案存在性預示機制。
預設安全二進位檔會禁止檔案導向的選項；長選項採取失敗關閉驗證
（未知旗標與語意不明的縮寫都會遭拒絕）。預設二進位檔中已辨識的唯讀布林旗標
（例如 `wc -l`、`tr -d`、`uniq -c`）可接受，而未辨識的短旗標仍會
失敗關閉，並轉交手動核准。

依安全二進位檔設定檔列出的禁止旗標：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `tail`：`--follow`、`--retry`、`-F`、`-f`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二進位檔也會強制在執行時將 argv 權杖視為**常值文字**
（僅限 stdin 的區段不會展開萬用字元，也不會展開 `$VARS`），因此
無法利用 `*` 或 `$HOME/...` 等模式夾帶檔案讀取。`awk`、
`sed` 和 `jq` 一律不得作為安全二進位檔，因為無法驗證其語意僅限
stdin：`jq` 可以讀取環境資料，並從模組或啟動檔案載入 jq 程式碼。
請為這些工具使用明確的允許清單項目或核准提示，而非 `safeBins`。

### 受信任的二進位檔目錄

安全二進位檔必須解析自受信任的二進位檔目錄（系統預設值加上
選用的 `tools.exec.safeBinTrustedDirs`）。`PATH` 項目絕不會自動受信任。
預設受信任目錄刻意維持最低限度：`/bin`、`/usr/bin`。如果
你的安全二進位執行檔位於套件管理員／使用者路徑中（例如
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），請將其
明確加入 `tools.exec.safeBinTrustedDirs`。

### Shell 串接、包裝器與多工器

當每個頂層區段都符合允許清單（包括安全二進位檔或 skill 自動允許）時，
可使用 Shell 串接（`&&`、`||`、`;`）。允許清單模式仍不支援重新導向。
允許清單剖析期間會拒絕命令替換（`$()`／反引號），
包括出現在雙引號內的情況；如需 `$()` 常值文字，請使用單引號。

在 macOS 隨附應用程式的核准機制中，若原始 Shell 文字包含 Shell 控制或
展開語法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`），
除非 Shell 二進位檔本身已列入允許清單，否則會視為不符合允許清單。

對於 Shell 包裝器（`bash|sh|zsh ... -c/-lc`），請求範圍的環境變數覆寫會
縮減為一份明確的小型允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、
`NO_COLOR`、`FORCE_COLOR`）。

對於允許清單模式中的 `allow-always` 決策，透明分派包裝器
（例如 `env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存
內部執行檔路徑，而非包裝器路徑。Shell 多工器
（`busybox`、`toybox`）會以相同方式針對 Shell 小程式（`sh`、`ash` 等）
解除包裝。如果無法安全地解除包裝某個包裝器或多工器，
則不會自動保存允許清單項目。

如果你將 `python3` 或 `node` 等直譯器加入允許清單，建議使用
`tools.exec.strictInlineEval=true`，讓行內評估仍需明確核准。
在嚴格模式下，`allow-always` 仍可保存無害的
直譯器／指令碼叫用，但不會自動保存行內評估載體。

### 安全二進位檔與允許清單的比較

| 主題             | `tools.exec.safeBins`                                  | 允許清單（`exec-approvals.json`）                                                   |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目標             | 自動允許範圍狹窄的 stdin 篩選器                       | 明確信任特定執行檔                                                               |
| 比對類型         | 執行檔名稱 + 安全二進位檔 argv 政策                   | 已解析執行檔路徑 glob，或針對透過 PATH 叫用之命令的純命令名稱 glob               |
| 引數範圍         | 受安全二進位檔設定檔與常值權杖規則限制               | 預設依路徑比對；選用的 `argPattern` 可限制剖析後的 argv                           |
| 常見範例         | `head`、`tail`、`tr`、`wc`                             | `jq`、`python3`、`node`、`ffmpeg`、自訂命令列介面                                 |
| 最佳用途         | 管線中的低風險文字轉換                               | 任何具有更廣泛行為或副作用的工具                                                   |

設定位置：

- `safeBins` 來自設定（`tools.exec.safeBins` 或個別代理程式的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 來自設定（`tools.exec.safeBinTrustedDirs` 或個別代理程式的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 來自設定（`tools.exec.safeBinProfiles` 或個別代理程式的 `agents.list[].tools.exec.safeBinProfiles`）。個別代理程式的設定檔索引鍵會覆寫全域索引鍵。
- 允許清單項目位於主機本機的核准檔案中，即 `agents.<id>.allowlist`（或透過 Control UI／`openclaw approvals allowlist ...`）。
- 當直譯器／執行階段二進位檔出現在 `safeBins` 中卻沒有明確設定檔時，`openclaw security audit` 會發出 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可以將缺少的自訂 `safeBinProfiles.<bin>` 項目建立為 `{}`（之後請檢閱並收緊設定）。直譯器／執行階段二進位檔不會自動建立。

自訂設定檔範例：
__OC_I18N_900000__
## 直譯器／執行階段命令

以核准為基礎的直譯器／執行階段執行刻意採取保守策略：

- 一律繫結精確的 argv／cwd／env 上下文。
- 直接 Shell 指令碼與直接執行階段檔案形式會盡可能繫結至一個具體的本機
  檔案快照。
- 仍可解析至單一直接本機檔案的常見套件管理員包裝器形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）會在繫結前解除包裝。
- 如果 OpenClaw 無法為直譯器／執行階段命令識別出恰好一個具體本機檔案
  （例如套件指令碼、評估形式、執行階段特定的載入器鏈，或語意不明的多檔案
  形式），則會拒絕以核准為基礎的執行，而不會宣稱具備實際上不存在的語意
  涵蓋範圍。
- 對於這些工作流程，請優先使用沙箱、獨立的主機邊界，或明確受信任的
  允許清單／完整工作流程，並由操作者接受更廣泛的執行階段語意。

需要核准時，exec 工具會立即傳回核准 ID。請使用該 ID
關聯後續已核准執行的系統事件（`Exec finished`，以及設定時的 `Exec running`）。
如果逾時前未收到決策，該請求會視為核准逾時，
並以終止性的主機命令拒絕呈現。對於具有來源工作階段的主代理程式非同步核准，
OpenClaw 也會透過內部後續訊息恢復該工作階段，讓代理程式得知
命令並未執行，而非稍後嘗試修復缺少的結果。待處理的 exec 核准
預設會在 30 分鐘後到期。

### 後續訊息遞送行為

核准的非同步 exec 完成後，OpenClaw 會將後續 `agent` 輪次傳送至相同工作階段。
遭拒的非同步核准會針對拒絕狀態使用相同的主要工作階段後續路徑，但不會
註冊提升權限的執行階段移交，也不會執行命令。若拒絕沒有可恢復的
主要工作階段，則會予以抑制，或在存在安全直接路徑時透過該路徑回報。

- 如果存在有效的外部遞送目標（可遞送的頻道加上目標 `to`），後續訊息遞送會使用該頻道。
- 在僅限網頁聊天或沒有外部目標的內部工作階段流程中，後續訊息遞送會維持僅限工作階段（`deliver: false`）。
- 如果呼叫者明確要求嚴格外部遞送，但沒有可解析的外部頻道，請求會以 `INVALID_REQUEST` 失敗。
- 如果啟用 `bestEffortDeliver` 且無法解析任何外部頻道，遞送會降級為僅限工作階段，而非失敗。

## 將核准轉送至聊天頻道

你可以將 exec 核准提示轉送至任何聊天頻道（包括外掛頻道），並透過
`/approve` 核准。此功能使用一般的輸出遞送管線。

設定：
__OC_I18N_900001__
在聊天中回覆：
__OC_I18N_900002__
`/approve` 命令可同時處理 exec 核准與外掛核准。如果 ID 不符合待處理的 exec 核准，
它會自動改為檢查外掛核准。此備援僅限於「找不到核准」失敗；真正的 exec 核准拒絕／錯誤
不會無聲地重試為外掛核准。

### 外掛核准轉送

外掛核准轉送使用與 exec 核准相同的遞送管線，但在 `approvals.plugin` 下有自己的
獨立設定。啟用或停用其中一項不會影響另一項。
如需外掛編寫行為、請求欄位與決策語意，請參閱
[外掛權限請求](/plugins/plugin-permission-requests)。
__OC_I18N_900003__
設定形態與 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的運作方式皆相同。

支援共用互動式回覆的頻道，會針對執行與外掛核准呈現相同的核准按鈕。沒有共用互動式使用者介面的頻道，則會回退為純文字及 `/approve`
操作指示。外掛核准請求可能會限制可用的決定：核准介面會使用請求宣告的決定集合，而閘道會拒絕提交未提供之決定的嘗試。

### 任何頻道中的同一聊天核准

當執行或外掛核准請求源自可傳遞訊息的聊天介面時，依預設可在同一聊天中使用 `/approve`
核准。除了現有的 Web UI 與終端使用者介面流程外，這也適用於 Slack、Matrix、Microsoft Teams
及類似的可傳遞訊息聊天，並使用該對話的一般頻道驗證模型。如果來源聊天已可傳送命令
並接收回覆，核准請求不再需要僅為了保持待處理狀態而使用個別的原生傳遞配接器。

Discord、Telegram 與 QQ Bot 也支援同一聊天中的 `/approve`，但即使原生核准傳遞已停用，這些頻道仍會使用其
解析出的核准者清單進行授權。

### 原生核准傳遞

某些頻道也可作為原生核准用戶端：Discord、Slack、Telegram、Matrix 與 QQ Bot。
原生用戶端會在共用的同一聊天 `/approve` 流程之上，新增核准者私訊、來源聊天分送，以及頻道專屬的互動式核准使用者體驗。

當原生核准卡片／按鈕可用時，該原生使用者介面是面向代理程式的主要路徑。
除非工具結果指出無法使用聊天核准，或手動核准是唯一剩餘的路徑，否則代理程式不應再重複輸出純聊天 `/approve` 命令。

如果已設定原生核准用戶端，但來源頻道沒有啟用中的原生執行階段，
OpenClaw 會讓本機確定性的 `/approve` 提示保持可見。如果原生執行階段已啟用並嘗試傳遞，但沒有任何目標收到卡片，OpenClaw 會在同一聊天中傳送回退
通知，其中包含確切的 `/approve <id> <decision>` 命令，讓請求仍可獲得處理。

通用模型：

- 主機執行原則仍會決定是否需要執行核准
- `approvals.exec` 控制是否將核准提示轉送至其他聊天目的地
- `channels.<channel>.execApprovals` 控制是否啟用 Discord、Slack、Telegram、QQ Bot 及類似
  頻道專屬的原生用戶端
- 當請求來自 Slack，且可解析出 Slack 外掛核准者時，Slack 外掛核准可使用 Slack 的原生核准用戶端；
  即使 Slack 執行核准已停用，`approvals.plugin` 仍可將外掛核准路由至 Slack
  工作階段或目標
- 當可從 `dm.allowFrom` 或 `defaultTo` 解析出穩定的 `users/<id>` 核准者時，Google Chat 原生核准卡片會處理源自 Google
  Chat 空間或討論串的執行與外掛核准；這些卡片不會使用反應事件來做決定
- WhatsApp 與 Signal 的反應核准傳遞受 `approvals.exec` 與
  `approvals.plugin` 控制；它們沒有 `channels.<channel>.execApprovals` 區塊

當下列條件全都成立時，原生核准用戶端會自動啟用以私訊優先的傳遞：

- 頻道支援原生核准傳遞
- 可從明確的 `execApprovals.approvers` 或擁有者
  身分（例如 `commands.ownerAllowFrom`）解析出核准者
- `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`

設定 `enabled: false` 可明確停用原生核准用戶端。設定 `enabled: true` 可在核准者解析成功時強制
啟用。公開的來源聊天傳遞仍需透過
`channels.<channel>.execApprovals.target` 明確設定。當原生 `target` 啟用來源聊天傳遞時，
核准提示會包含命令文字。

常見問題：[為什麼聊天核准有兩項執行核准設定？](/help/faq-first-run)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`
- QQ Bot：`channels.qqbot.execApprovals.*`
- Google Chat：使用 `channels.googlechat.dm.allowFrom` 或
  `channels.googlechat.defaultTo` 設定穩定的核准者；不需要 `execApprovals` 區塊
- WhatsApp：使用 `approvals.exec` 與 `approvals.plugin` 將核准提示路由至 WhatsApp
- Signal：使用 `approvals.exec` 與 `approvals.plugin` 將核准提示路由至 Signal

原生用戶端專屬路由：

- Telegram 預設傳送至核准者私訊（`target: "dm"`）。切換為 `channel` 或 `both`，也可在來源 Telegram 聊天／主題中顯示
  核准提示。對於 Telegram 論壇主題，OpenClaw
  會保留核准提示及核准後後續訊息所屬的主題。
- Discord 與 Telegram 核准者可明確指定（`execApprovals.approvers`），或從
  `commands.ownerAllowFrom` 推斷；只有解析出的核准者才能核准或拒絕。
- Slack 核准者可明確指定（`execApprovals.approvers`），或從
  `commands.ownerAllowFrom` 推斷。Slack 外掛核准私訊會使用來自 `allowFrom`
  與帳號預設路由的 Slack 外掛核准者，而非 Slack 執行核准者。Slack 原生按鈕會保留核准 ID
  種類，因此 `plugin:` ID 可解析外掛核准，而不需要第二層 Slack 本機回退。
- Google Chat 原生卡片會在訊息文字中保留手動 `/approve` 回退，但卡片按鈕
  回呼只攜帶不透明的動作權杖；核准 ID 與決定會從
  伺服器端待處理狀態中復原。
- 當相符的頂層轉送系列路由至 WhatsApp 時，WhatsApp 表情符號核准會處理執行與外掛提示。原生來源提示會直接繫結；共用目標模式
  傳遞則會將相同的具型別核准中繼資料繫結至已接受的 WhatsApp 訊息收件記錄。
- 只有在相符的頂層
  轉送系列已啟用並路由至 Signal 時，Signal 反應核准才會處理執行與外掛提示。直接在同一聊天進行的 Signal 執行核准可在沒有明確核准者的情況下
  隱藏本機 `/approve` 回退；Signal 反應解析仍需要來自 `channels.signal.allowFrom` 或 `defaultTo` 的明確 Signal 核准者。
- Matrix 原生私訊／頻道路由與反應捷徑會處理執行與外掛核准；
  外掛授權仍來自 `channels.matrix.dm.allowFrom`。Matrix 原生提示
  會在第一個提示事件中包含 `com.openclaw.approval` 自訂事件內容，讓支援 OpenClaw 的
  Matrix 用戶端可讀取結構化核准狀態，同時讓標準用戶端保留純文字
  `/approve` 回退。
- 原生 Discord 與 Telegram 核准按鈕會在傳輸私有的回呼資料中攜帶明確的執行或外掛擁有者種類，且只解析該擁有者。缺少種類的舊版 `/approve` 控制項仍是受限的相容性路徑：它們只會嘗試操作執行者可核准的擁有者種類，
  僅在收到找不到核准的結果後才繼續，而且絕不會從核准 ID 推斷擁有權。
- 請求者不需要是核准者。
- 如果沒有操作員使用者介面或已設定的核准用戶端可接受請求，提示會回退至
  `askFallback`。

只有擁有者才能使用的敏感群組命令（例如 `/diagnostics` 與 `/export-trajectory`）會針對核准提示與最終結果使用私密
擁有者路由。OpenClaw 會先嘗試在擁有者執行命令的
同一介面上使用私密路由。如果該介面沒有私密擁有者路由，則會回退至 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，因此當 Telegram 是已設定的
主要私密介面時，Discord 群組命令仍可將核准與結果傳送至擁有者的 Telegram 私訊。群組聊天只會收到簡短的確認訊息。

另請參閱：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ Bot](/channels/qqbot)

### 官方行動版操作員應用程式

官方 iOS 與 Android 應用程式也可在使用 `operator.admin` 連線時，或其配對的
`operator.approvals` 裝置已由請求明確指定時，審查由閘道擁有的待處理執行
核准。它們會讀取與
控制使用者介面相同的已清理持久記錄、提交可辨識種類的決定，並顯示閘道的標準
第一個回覆結果。Apple Watch 會透過
配對的 iPhone 鏡像這些核准提示，並提供允許一次與拒絕動作。直接 Watch 閘道模式
不會審查核准。

遺失解析確認並不會讓已提交的選擇成為權威結果：
應用程式會停用控制項，並再次讀取記錄。如果另一個介面先完成處理，
應用程式會顯示該筆已記錄的決定。待處理提示會持續繫結至發出它們的
閘道，因此切換使用中的閘道無法重新導向舊的
核准 ID。

### macOS IPC 流程
__OC_I18N_900004__
安全性注意事項：

- Unix 通訊端模式 `0600`，權杖儲存在 `exec-approvals.json`。
- 相同 UID 的對等端檢查。
- 挑戰／回應（隨機數 + HMAC 權杖 + 請求雜湊）+ 短 TTL。

## 常見問題

### 核准目標何時會使用 `accountId` 與 `threadId`？

當頻道設定了多個身分，且核准提示必須透過特定帳號送出時，請使用 `accountId`。當目的地支援主題或
討論串，且提示應保留在該討論串中，而非最上層聊天時，請使用 `threadId`。

一個具體的 Telegram 情境，是具有論壇主題與兩個 Telegram 機器人
帳號的營運超級群組。`to` 值指定超級群組，`accountId` 選取機器人帳號，而 `threadId`
選取論壇主題：
__OC_I18N_900005__
使用此設定時，轉送的執行核准會由 `ops-bot` Telegram 帳號發布至聊天 `-1001234567890` 的主題
`77`。沒有 `accountId` 的目標會使用頻道的預設帳號，而
沒有 `threadId` 的目標會發布至最上層目的地。

### 將核准傳送至工作階段時，該工作階段中的任何人都可以核准嗎？

不可以。工作階段傳遞只控制提示顯示的位置。它本身不會授權該聊天中的每位
參與者進行核准。

對於通用的同一聊天 `/approve`，傳送者必須已獲授權，可在該
頻道工作階段中使用命令。如果頻道公開了明確的核准者，這些核准者即使未在該工作階段中獲得其他命令授權，仍可授權
`/approve` 動作。

某些頻道更為嚴格。Discord、Telegram、Matrix、Slack 原生核准私訊及類似的
原生核准用戶端，會使用其解析出的核准者清單進行核准授權。例如，
Telegram 論壇主題核准提示可對主題中的所有人顯示，但只有從 `channels.telegram.execApprovals.approvers` 或
`commands.ownerAllowFrom` 解析出的數字 Telegram 使用者 ID 才能核准或拒絕。

## 相關內容

- [執行核准](/zh-TW/tools/exec-approvals) — 核心原則與核准流程
- [執行工具](/zh-TW/tools/exec)
- [提升權限模式](/zh-TW/tools/elevated)
- [Skills](/zh-TW/tools/skills) — 由技能支援的自動允許行為
