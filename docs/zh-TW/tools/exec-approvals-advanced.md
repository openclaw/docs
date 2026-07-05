---
read_when:
    - 設定安全 bin 或自訂安全 bin 設定檔
    - 將核准請求轉發至 Slack/Discord/Telegram 或其他聊天頻道
    - 為通道實作原生核准用戶端
summary: 進階 exec 核准：安全執行檔、直譯器繫結、核准轉送、原生傳遞
title: 執行核准 — 進階
x-i18n:
    generated_at: "2026-07-05T11:45:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c3a4934b87c7b20f27439239bd1e02e7bcbd137b72624720da6aeb25dadc952
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

進階 exec 核准主題：`safeBins` 快速路徑、直譯器/執行階段
繫結，以及將核准轉送到聊天頻道（包括原生傳遞）。
核心政策與核准流程請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 安全二進位檔（僅限 stdin）

`tools.exec.safeBins` 會命名**僅限 stdin** 的二進位檔（例如 `cut`），這些二進位檔
可在允許清單模式下執行，而**不需要**明確的允許清單項目。安全二進位檔會拒絕
位置式檔案引數與類似路徑的權杖，因此只能處理傳入串流。請將它視為串流過濾器的
狹窄快速路徑，而不是一般信任清單。

<Warning>
**不要**將直譯器或執行階段二進位檔（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）加入 `safeBins`。如果命令在設計上可以評估程式碼、
執行子命令或讀取檔案，請優先使用明確的允許清單項目，並保持核准提示啟用。
自訂安全二進位檔必須在 `tools.exec.safeBinProfiles.<bin>` 中定義明確的設定檔。
</Warning>

預設安全二進位檔：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在預設清單中。如果你選擇啟用，請為它們的非 stdin 工作流程
保留明確的允許清單項目。對於安全二進位檔模式下的 `grep`，請使用 `-e`/`--regexp`
提供模式；位置式模式形式會被拒絕，因此檔案運算元無法作為模稜兩可的位置式引數被夾帶。

### Argv 驗證與遭拒旗標

驗證只從 argv 形狀確定性地進行（不檢查主機檔案系統是否存在），這可防止允許/拒絕
差異造成檔案存在性探測行為。預設安全二進位檔會拒絕以檔案為導向的選項；長選項
採用失敗關閉方式驗證（未知旗標與模稜兩可的縮寫會被拒絕）。

依安全二進位檔設定檔列出的遭拒旗標：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二進位檔也會強制 argv 權杖在執行時被視為**常值文字**（不進行 glob 展開，也不展開
`$VARS`）以用於僅限 stdin 的片段，因此像 `*` 或 `$HOME/...` 這類模式不能用來夾帶
檔案讀取。`awk` 和 `sed` 一律被拒絕作為安全二進位檔（其語意無法驗證為僅限 stdin）；
`jq` 可以選擇啟用，但 OpenClaw 仍會在安全二進位檔模式下拒絕 `env` 風格的過濾器
（例如 `jq env` 或 `jq -n env`），因此 `jq` 不能在沒有明確允許清單路徑或核准提示的情況下
傾印主機程序環境。

### 受信任的二進位檔目錄

安全二進位檔必須從受信任的二進位檔目錄解析（系統預設值加上選用的
`tools.exec.safeBinTrustedDirs`）。`PATH` 項目永遠不會自動被信任。
預設受信任目錄刻意保持最小：`/bin`、`/usr/bin`。如果你的安全二進位檔可執行檔位於
套件管理器/使用者路徑（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、
`/snap/bin`），請將它們明確加入 `tools.exec.safeBinTrustedDirs`。

### Shell 串接、包裝器與多工器

當每個頂層片段都符合允許清單（包括安全二進位檔或 skill 自動允許）時，允許使用
Shell 串接（`&&`、`||`、`;`）。允許清單模式仍不支援重新導向。命令替換
（`$()` / 反引號）會在允許清單解析期間被拒絕，包括在雙引號內；如果需要常值
`$()` 文字，請使用單引號。

在 macOS 伴隨應用程式核准中，包含 Shell 控制或展開語法（`&&`、`||`、`;`、`|`、
`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 Shell 文字會被視為允許清單未命中，
除非 Shell 二進位檔本身已在允許清單中。

對於 Shell 包裝器（`bash|sh|zsh ... -c/-lc`），要求範圍的 env 覆寫會縮減為一小組
明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

在允許清單模式下的 `allow-always` 決策中，透明分派包裝器
（例如 `env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保留內部可執行檔路徑，
而不是包裝器路徑。Shell 多工器（`busybox`、`toybox`）會以相同方式為 Shell 小程式
（`sh`、`ash` 等）解除包裝。如果包裝器或多工器無法安全解除包裝，則不會自動保留
任何允許清單項目。

如果你將 `python3` 或 `node` 等直譯器加入允許清單，請優先使用
`tools.exec.strictInlineEval=true`，如此行內 eval 仍需要明確核准。在嚴格模式下，
`allow-always` 仍可保留良性的直譯器/指令碼叫用，但行內 eval 載體不會自動保留。

### 安全二進位檔與允許清單比較

| 主題            | `tools.exec.safeBins`                                  | 允許清單（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目標             | 自動允許狹窄的 stdin 過濾器                        | 明確信任特定可執行檔                                              |
| 比對類型       | 可執行檔名稱 + 安全二進位檔 argv 政策                 | 已解析可執行檔路徑 glob，或 PATH 叫用命令的裸命令名稱 glob |
| 引數範圍   | 受安全二進位檔設定檔與常值權杖規則限制 | 預設依路徑比對；選用的 `argPattern` 可限制已解析 argv              |
| 典型範例 | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 自訂命令列介面                                     |
| 最佳用途         | 管線中的低風險文字轉換                  | 任何具備更廣泛行為或副作用的工具                                     |

設定位置：

- `safeBins` 來自設定（`tools.exec.safeBins` 或每代理的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 來自設定（`tools.exec.safeBinTrustedDirs` 或每代理的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 來自設定（`tools.exec.safeBinProfiles` 或每代理的 `agents.list[].tools.exec.safeBinProfiles`）。每代理的設定檔鍵會覆寫全域鍵。
- 允許清單項目位於主機本機核准檔案的 `agents.<id>.allowlist` 之下（或透過 Control UI / `openclaw approvals allowlist ...`）。
- 當直譯器/執行階段二進位檔出現在 `safeBins` 中但沒有明確設定檔時，`openclaw security audit` 會以 `tools.exec.safe_bins_interpreter_unprofiled` 發出警告。
- `openclaw doctor --fix` 可以將缺少的自訂 `safeBinProfiles.<bin>` 項目搭建為 `{}`（之後請檢閱並收緊）。直譯器/執行階段二進位檔不會自動搭建。

自訂設定檔範例：
__OC_I18N_900000__
## 直譯器/執行階段命令

由核准支援的直譯器/執行階段執行刻意保守：

- 精確的 argv/cwd/env 內容一律會被繫結。
- 直接 Shell 指令碼與直接執行階段檔案形式會盡力繫結到一個具體本機檔案快照。
- 仍解析到一個直接本機檔案的常見套件管理器包裝器形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`）會在繫結前解除包裝。
- 如果 OpenClaw 無法為直譯器/執行階段命令精確識別一個具體本機檔案
  （例如套件指令碼、eval 形式、執行階段特定載入器鏈，或模稜兩可的多檔案
  形式），由核准支援的執行會被拒絕，而不是宣稱它沒有的語意覆蓋。
- 對於這些工作流程，請優先使用沙箱、獨立主機邊界，或明確受信任的
  允許清單/完整工作流程，讓操作員接受更廣泛的執行階段語意。

需要核准時，exec 工具會立即回傳核准 ID。使用該 ID 對應稍後已核准執行的系統事件
（`Exec finished`，以及設定時的 `Exec running`）。如果逾時前沒有收到決策，該要求會被視為
核准逾時，並呈現為終端主機命令拒絕。對於具有來源工作階段的主代理非同步核准，
OpenClaw 也會用內部後續訊息恢復該工作階段，讓代理觀察到命令未執行，而不是稍後修復
缺少的結果。待處理 exec 核准預設會在 30 分鐘後過期。

### 後續傳遞行為

已核准的非同步 exec 完成後，OpenClaw 會向同一工作階段傳送後續 `agent` 回合。
遭拒的非同步核准會對拒絕狀態使用相同的主工作階段後續路徑，但不會註冊提升後的執行階段
交接，也不會執行命令。沒有可恢復主工作階段的拒絕，會被抑制，或在存在安全直接路由時
透過該路由回報。

- 如果存在有效的外部傳遞目標（可傳遞頻道加上目標 `to`），後續傳遞會使用該頻道。
- 在沒有外部目標的純網頁聊天或內部工作階段流程中，後續傳遞會保持僅限工作階段（`deliver: false`）。
- 如果呼叫端明確要求嚴格外部傳遞，但沒有可解析的外部頻道，要求會以 `INVALID_REQUEST` 失敗。
- 如果啟用 `bestEffortDeliver` 且無法解析外部頻道，傳遞會降級為僅限工作階段，而不是失敗。

## 將核准轉送到聊天頻道

你可以將 exec 核准提示轉送到任何聊天頻道（包括外掛頻道），並使用 `/approve`
核准。這會使用一般外送傳遞管線。

設定：
__OC_I18N_900001__
在聊天中回覆：
__OC_I18N_900002__
`/approve` 命令會同時處理 exec 核准與外掛核准。如果 ID 不符合待處理的 exec 核准，
它會自動改查外掛核准。此後援僅限於「找不到核准」失敗；真正的 exec 核准拒絕/錯誤
不會靜默重試為外掛核准。

### 外掛核准轉送

外掛核准轉送使用與 exec 核准相同的傳遞管線，但在 `approvals.plugin` 之下有自己的
獨立設定。啟用或停用其中一項不會影響另一項。外掛撰寫行為、要求欄位與決策語意請參閱
[外掛權限要求](/plugins/plugin-permission-requests)。
__OC_I18N_900003__
設定形狀與 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的運作方式相同。

支援共用互動式回覆的頻道，會為 exec 和外掛核准呈現相同的核准按鈕。沒有共用互動式 UI 的
頻道會後援為含有 `/approve` 指示的純文字。外掛核准要求可以限制可用決策：核准介面會使用
要求宣告的決策集，而閘道會拒絕提交未提供的決策。

### 任何頻道上的同一聊天核准

當 exec 或外掛核准請求來自可交付的聊天介面時，預設可由同一個聊天使用 `/approve` 進行核准。這適用於 Slack、Matrix、Microsoft Teams，以及類似的可交付聊天，並且除了既有的 Web UI 與終端 UI 流程之外，也會使用該對話的正常頻道驗證模型。如果來源聊天已經可以傳送命令並接收回覆，核准請求就不再需要另外的原生傳送配接器，只為了維持待處理狀態。

Discord、Telegram 和 QQ Bot 也支援同一聊天的 `/approve`，但即使停用原生核准傳送，這些頻道仍會使用其解析出的核准者清單進行授權。

### 原生核准傳送

某些頻道也可以作為原生核准用戶端：Discord、Slack、Telegram、Matrix 和 QQ Bot。原生用戶端會在共用的同一聊天 `/approve` 流程之上，新增核准者 DM、來源聊天扇出，以及特定頻道的互動式核准使用者體驗。

當原生核准卡片／按鈕可用時，該原生 UI 是主要的代理面向路徑。除非工具結果表示聊天核准不可用，或手動核准是唯一剩餘路徑，否則代理不應再重複回顯一個純聊天 `/approve` 命令。

如果已設定原生核准用戶端，但來源頻道沒有作用中的原生執行階段，OpenClaw 會保留可見的本機確定性 `/approve` 提示。如果原生執行階段處於作用中並嘗試傳送，但沒有任何目標收到卡片，OpenClaw 會傳送同一聊天備援通知，其中包含精確的 `/approve <id> <decision>` 命令，讓請求仍可被解決。

通用模型：

- 主機 exec 政策仍會決定是否需要 exec 核准
- `approvals.exec` 控制將核准提示轉送到其他聊天目的地
- `channels.<channel>.execApprovals` 控制是否啟用 Discord、Slack、Telegram、QQ Bot，以及類似的特定頻道原生用戶端
- 當請求來自 Slack 且 Slack 外掛核准者可解析時，Slack 外掛核准可以使用 Slack 的原生核准用戶端；即使 Slack exec 核准已停用，`approvals.plugin` 也可以將外掛核准路由到 Slack 工作階段或目標
- Google Chat 原生核准卡片會處理來自 Google Chat 空間或執行緒的 exec 與外掛核准，只要可從 `dm.allowFrom` 或 `defaultTo` 解析出穩定的 `users/<id>` 核准者；它們不使用反應事件來做出決策
- WhatsApp 和 Signal 反應核准傳送由 `approvals.exec` 和 `approvals.plugin` 控制；它們沒有 `channels.<channel>.execApprovals` 區塊

當以下條件全部為真時，原生核准用戶端會自動啟用 DM 優先傳送：

- 頻道支援原生核准傳送
- 可從明確的 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 等擁有者身分解析核准者
- `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`

設定 `enabled: false` 可明確停用原生核准用戶端。設定 `enabled: true` 可在核准者可解析時強制啟用。公開來源聊天傳送仍透過 `channels.<channel>.execApprovals.target` 明確設定。當原生 `target` 啟用來源聊天傳送時，核准提示會包含命令文字。

常見問題：[為什麼聊天核准有兩個 exec 核准設定？](/help/faq-first-run)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`
- QQ Bot：`channels.qqbot.execApprovals.*`
- Google Chat：使用 `channels.googlechat.dm.allowFrom` 或 `channels.googlechat.defaultTo` 設定穩定核准者；不需要 `execApprovals` 區塊
- WhatsApp：使用 `approvals.exec` 和 `approvals.plugin` 將核准提示路由到 WhatsApp
- Signal：使用 `approvals.exec` 和 `approvals.plugin` 將核准提示路由到 Signal

原生用戶端特定路由：

- Telegram 預設為核准者 DM（`target: "dm"`）。切換為 `channel` 或 `both`，也可在來源 Telegram 聊天／主題中顯示核准提示。對於 Telegram 論壇主題，OpenClaw 會保留核准提示與核准後後續訊息的主題。
- Discord 和 Telegram 核准者可以明確設定（`execApprovals.approvers`），也可以從 `commands.ownerAllowFrom` 推斷；只有已解析的核准者可以核准或拒絕。
- Slack 核准者可以明確設定（`execApprovals.approvers`），也可以從 `commands.ownerAllowFrom` 推斷。Slack 外掛核准 DM 使用來自 `allowFrom` 和帳號預設路由的 Slack 外掛核准者，而不是 Slack exec 核准者。Slack 原生按鈕會保留核准 ID 類型，因此 `plugin:` ID 可以解析外掛核准，而不需要第二層 Slack 本機備援。
- Google Chat 原生卡片會在訊息文字中保留手動 `/approve` 備援，但卡片按鈕回呼只攜帶不透明的動作權杖；核准 ID 與決策會從伺服器端待處理狀態復原。
- WhatsApp 表情符號核准只有在相符的頂層轉送家族已啟用並路由到 WhatsApp 時，才會同時處理 exec 和外掛提示；僅目標的 WhatsApp 轉送會保留在共用轉送路徑上，除非它符合相同的原生來源目標。
- Signal 反應核准只有在相符的頂層轉送家族已啟用並路由到 Signal 時，才會同時處理 exec 和外掛提示。直接同一聊天 Signal exec 核准可以在沒有明確核准者時抑制本機 `/approve` 備援；Signal 反應解析仍需要來自 `channels.signal.allowFrom` 或 `defaultTo` 的明確 Signal 核准者。
- Matrix 原生 DM／頻道路由和反應捷徑會同時處理 exec 與外掛核准；外掛授權仍來自 `channels.matrix.dm.allowFrom`。Matrix 原生提示會在第一個提示事件上包含 `com.openclaw.approval` 自訂事件內容，讓支援 OpenClaw 的 Matrix 用戶端可以讀取結構化核准狀態，同時一般用戶端仍保留純文字 `/approve` 備援。
- 原生 Discord 核准按鈕會依核准 ID 類型路由：`plugin:` ID 直接進入外掛核准，其他全部進入 exec 核准。原生 Telegram 核准按鈕遵循與 `/approve` 相同的受限 exec 到外掛備援。
- 請求者不需要是核准者。
- 如果沒有任何操作員 UI 或已設定的核准用戶端可接受請求，提示會備援到 `askFallback`。

敏感的僅擁有者群組命令，例如 `/diagnostics` 和 `/export-trajectory`，會對核准提示與最終結果使用私人擁有者路由。OpenClaw 會先嘗試在擁有者執行命令的相同介面上使用私人路由。如果該介面沒有私人擁有者路由，則會備援到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，因此當 Telegram 是設定的主要私人介面時，Discord 群組命令仍可將核准與結果傳送到擁有者的 Telegram DM。群組聊天只會收到簡短確認。

另請參閱：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ Bot](/channels/qqbot)

### macOS IPC 流程
__OC_I18N_900004__
安全注意事項：

- Unix socket 模式 `0600`，權杖儲存在 `exec-approvals.json`。
- 相同 UID 對等檢查。
- Challenge/response（nonce + HMAC token + request hash）+ 短 TTL。

## 常見問題

### 何時會在核准目標上使用 `accountId` 和 `threadId`？

當頻道有多個已設定身分，且核准提示必須透過特定帳號送出時，使用 `accountId`。當目的地支援主題或執行緒，且提示應保留在該執行緒內而不是頂層聊天時，使用 `threadId`。

一個具體的 Telegram 案例是具有論壇主題和兩個 Telegram Bot 帳號的營運超級群組。`to` 值命名超級群組，`accountId` 選取 Bot 帳號，`threadId` 選取論壇主題：
__OC_I18N_900005__
在該設定下，轉送的 exec 核准會由 `ops-bot` Telegram 帳號發布到聊天 `-1001234567890` 的主題 `77`。沒有 `accountId` 的目標會使用頻道的預設帳號，而沒有 `threadId` 的目標會發布到頂層目的地。

### 當核准傳送到工作階段時，該工作階段中的任何人都可以核准嗎？

不可以。工作階段傳送只控制提示出現的位置。它本身不會授權該聊天中的每位參與者進行核准。

對於通用同一聊天 `/approve`，傳送者必須已在該頻道工作階段中被授權使用命令。如果頻道公開明確的核准者，這些核准者即使在該工作階段中未被授權使用命令，也可以授權 `/approve` 動作。

有些頻道更嚴格。Discord、Telegram、Matrix、Slack 原生核准 DM，以及類似的原生核准用戶端，會使用其解析出的核准者清單進行核准授權。例如，Telegram 論壇主題核准提示可以讓主題中的所有人看見，但只有從 `channels.telegram.execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出的數字 Telegram 使用者 ID 可以核准或拒絕它。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals) — 核心政策與核准流程
- [Exec 工具](/zh-TW/tools/exec)
- [提升模式](/zh-TW/tools/elevated)
- [Skills](/zh-TW/tools/skills) — Skills 支援的自動允許行為
