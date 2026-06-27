---
read_when:
    - 設定安全 bin 或自訂安全 bin 設定檔
    - 將核准轉發到 Slack/Discord/Telegram 或其他聊天頻道
    - 為通道實作原生核准用戶端
summary: 進階 exec 核准：安全二進位檔、直譯器繫結、核准轉送、原生傳遞
title: 執行核准 — 進階
x-i18n:
    generated_at: "2026-06-27T20:06:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

進階 exec 核准主題：`safeBins` 快速路徑、直譯器/執行階段
綁定，以及將核准轉送到聊天頻道（包括原生遞送）。
核心政策與核准流程請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 安全二進位檔（僅限 stdin）

`tools.exec.safeBins` 定義一小份**僅限 stdin** 的二進位檔清單（例如
`cut`），它們可在允許清單模式中執行，且**不需要**明確的允許清單
項目。安全二進位檔會拒絕位置檔案引數與類似路徑的權杖，因此
它們只能操作傳入的資料流。請將此視為資料流過濾器的狹窄快速路徑，
而不是一般信任清單。

<Warning>
**不要**將直譯器或執行階段二進位檔（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）加入 `safeBins`。如果某個命令在設計上
可以評估程式碼、執行子命令或讀取檔案，請優先使用明確的允許清單項目，
並保持核准提示啟用。自訂安全二進位檔必須在
`tools.exec.safeBinProfiles.<bin>` 中定義明確的設定檔。
</Warning>

預設安全二進位檔：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在預設清單中。如果你選擇加入，請保留它們非 stdin
工作流程的明確允許清單項目。對於安全二進位檔模式中的 `grep`，
請使用 `-e`/`--regexp` 提供模式；位置模式形式會被拒絕，
因此檔案運算元無法偽裝成有歧義的位置引數。

### Argv 驗證與拒絕的旗標

驗證只會根據 argv 形狀以確定性方式進行（不檢查主機檔案系統是否存在），
這可避免允許/拒絕差異造成檔案存在性預言機行為。預設安全二進位檔會拒絕
偏向檔案操作的選項；長選項會以預設拒絕方式驗證（未知旗標與有歧義的縮寫
都會被拒絕）。

依安全二進位檔設定檔列出的拒絕旗標：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全二進位檔也會強制 argv 權杖在執行時被視為**常值文字**
（不進行 glob 展開，也不展開 `$VARS`），但僅限 stdin 片段，因此
像 `*` 或 `$HOME/...` 這類模式無法用來偷渡檔案讀取。

### 受信任的二進位檔目錄

安全二進位檔必須從受信任的二進位檔目錄解析（系統預設值加上選用的
`tools.exec.safeBinTrustedDirs`）。`PATH` 項目絕不會自動受信任。
預設受信任目錄刻意維持最小範圍：`/bin`、`/usr/bin`。如果你的安全二進位檔
可執行檔位於套件管理器/使用者路徑中（例如 `/opt/homebrew/bin`、
`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），請將它們明確加入
`tools.exec.safeBinTrustedDirs`。

### Shell 串接、包裝器與多工器

當每個頂層片段都符合允許清單（包括安全二進位檔或技能自動允許）時，
允許使用 Shell 串接（`&&`、`||`、`;`）。允許清單模式仍不支援重新導向。
命令替換（`$()` / 反引號）會在允許清單解析期間被拒絕，包括出現在雙引號內時；
如果你需要常值 `$()` 文字，請使用單引號。

在 macOS 伴隨應用程式核准中，若原始 Shell 文字包含 Shell 控制或展開語法
（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`），除非 Shell
二進位檔本身已被加入允許清單，否則會被視為允許清單未命中。

對於 Shell 包裝器（`bash|sh|zsh ... -c/-lc`），請求範圍的環境覆寫會被縮減為
一小份明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、
`FORCE_COLOR`）。

對於允許清單模式中的 `allow-always` 決策，已知的分派包裝器（`env`、
`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存內部可執行檔路徑，
而不是包裝器路徑。Shell 多工器（`busybox`、`toybox`）會以相同方式針對
Shell 小程式（`sh`、`ash` 等）解除包裝。如果包裝器或多工器無法安全解除包裝，
就不會自動保存任何允許清單項目。

如果你將 `python3` 或 `node` 這類直譯器加入允許清單，建議使用
`tools.exec.strictInlineEval=true`，讓內嵌評估仍需要明確核准。在嚴格模式中，
`allow-always` 仍可保存良性的直譯器/指令碼呼叫，但內嵌評估載體不會自動保存。

### 安全二進位檔與允許清單比較

| 主題             | `tools.exec.safeBins`                                  | 允許清單 (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目標             | 自動允許狹窄的 stdin 過濾器                           | 明確信任特定可執行檔                                                              |
| 比對類型         | 可執行檔名稱 + 安全二進位檔 argv 政策                 | 已解析的可執行檔路徑 glob，或透過 PATH 呼叫命令的裸命令名稱 glob                 |
| 引數範圍         | 受安全二進位檔設定檔與常值權杖規則限制               | 預設依路徑比對；選用的 `argPattern` 可限制已解析的 argv                          |
| 典型範例         | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 自訂命令列介面                                 |
| 最佳用途         | 管線中的低風險文字轉換                                | 任何行為或副作用更廣泛的工具                                                      |

設定位置：

- `safeBins` 來自設定（`tools.exec.safeBins` 或每個代理的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 來自設定（`tools.exec.safeBinTrustedDirs` 或每個代理的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 來自設定（`tools.exec.safeBinProfiles` 或每個代理的 `agents.list[].tools.exec.safeBinProfiles`）。每個代理的設定檔鍵會覆寫全域鍵。
- 允許清單項目位於主機本機核准檔案的 `agents.<id>.allowlist` 下（或透過 Control UI / `openclaw approvals allowlist ...`）。
- 當直譯器/執行階段二進位檔出現在 `safeBins` 中但沒有明確設定檔時，`openclaw security audit` 會以 `tools.exec.safe_bins_interpreter_unprofiled` 發出警告。
- `openclaw doctor --fix` 可以將缺少的自訂 `safeBinProfiles.<bin>` 項目建立為 `{}`（之後請檢閱並收緊）。直譯器/執行階段二進位檔不會自動建立。

自訂設定檔範例：
__OC_I18N_900000__
如果你明確選擇將 `jq` 加入 `safeBins`，OpenClaw 在安全二進位檔模式中仍會拒絕 `env` 內建項目，
因此 `jq -n env` 無法在沒有明確允許清單路徑或核准提示的情況下傾印主機程序環境。

## 直譯器/執行階段命令

以核准支援的直譯器/執行階段執行會刻意保持保守：

- 一律綁定精確的 argv/cwd/env 情境。
- 直接 Shell 指令碼與直接執行階段檔案形式會盡力綁定到一個具體的本機檔案快照。
- 常見套件管理器包裝器形式只要仍能解析為一個直接本機檔案（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`），就會在綁定前解除包裝。
- 如果 OpenClaw 無法為直譯器/執行階段命令識別出剛好一個具體本機檔案（例如套件指令碼、eval 形式、執行階段特定載入器鏈，或有歧義的多檔案形式），以核准支援的執行會被拒絕，而不是聲稱具有其實沒有的語意涵蓋範圍。
- 對於這些工作流程，請優先使用沙箱、獨立主機邊界，或明確受信任的允許清單/完整工作流程，讓操作者接受更廣泛的執行階段語意。

當需要核准時，exec 工具會立即傳回一個核准 ID。使用該 ID 關聯後續已核准執行的系統事件（`Exec finished`，以及設定時的 `Exec running`）。
如果在逾時前沒有收到決策，請求會被視為核准逾時，並顯示為終端主機命令拒絕。對於具有原始工作階段的主要代理非同步核准，OpenClaw 也會以內部後續訊息恢復該工作階段，讓代理觀察到命令未執行，而不是之後修補缺少的結果。

### 後續遞送行為

已核准的非同步 exec 完成後，OpenClaw 會將後續 `agent` 回合傳送到同一個工作階段。
遭拒的非同步核准會對拒絕狀態使用相同的主要工作階段後續路徑，但它們不會註冊提升權限的執行階段交接，也不會執行命令。沒有可恢復主要工作階段的拒絕，會在可行時被抑制，或透過安全的直接路由回報。

- 如果存在有效的外部遞送目標（可遞送頻道加上目標 `to`），後續遞送會使用該頻道。
- 在僅網頁聊天或沒有外部目標的內部工作階段流程中，後續遞送會維持僅限工作階段（`deliver: false`）。
- 如果呼叫者明確要求嚴格外部遞送，但沒有可解析的外部頻道，請求會以 `INVALID_REQUEST` 失敗。
- 如果啟用 `bestEffortDeliver`，且無法解析任何外部頻道，遞送會降級為僅限工作階段，而不是失敗。

## 將核准轉送到聊天頻道

你可以將 exec 核准提示轉送到任何聊天頻道（包括外掛頻道），並使用
`/approve` 核准它們。這會使用一般的傳出遞送管線。

設定：
__OC_I18N_900001__
在聊天中回覆：
__OC_I18N_900002__
`/approve` 命令同時處理 exec 核准與外掛核准。如果 ID 不符合待處理的 exec 核准，它會自動改為檢查外掛核准。

### 外掛核准轉送

外掛核准轉送使用與 exec 核准相同的遞送管線，但在 `approvals.plugin` 下有自己的
獨立設定。啟用或停用其中一者不會影響另一者。關於外掛作者行為、請求欄位與決策語意，
請參閱 [外掛權限請求](/plugins/plugin-permission-requests)。
__OC_I18N_900003__
設定形狀與 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的運作方式都相同。

支援共用互動式回覆的頻道，會針對 exec 與外掛核准轉譯相同的核准按鈕。
沒有共用互動式 UI 的頻道，會退回含有 `/approve` 指示的純文字。
外掛核准請求可以限制可用決策。核准介面會使用請求宣告的決策集合，
而 Gateway 會拒絕提交未提供的決策。

### 任何頻道上的同聊天核准

當 exec 或外掛核准請求源自可遞送的聊天介面時，預設現在可在同一個聊天中
使用 `/approve` 核准。除了既有的 Web UI 與終端 UI 流程外，這也適用於
Slack、Matrix、Microsoft Teams 等頻道。

這個共用文字命令路徑會對該對話使用一般的頻道驗證模型。如果
原始聊天已經可以傳送命令並接收回覆，核准要求就不再需要
個別的原生傳送介面卡，只為了保持待處理狀態。

Discord 和 Telegram 也支援同一聊天中的 `/approve`，但即使原生核准傳送已停用，這些頻道仍會使用其
已解析的核准者清單進行授權。

對於會直接呼叫閘道的 Telegram 和其他原生核准用戶端，
這個備援刻意限制在「找不到核准」失敗。真正的
exec 核准拒絕/錯誤不會悄悄以外掛核准重試。

### 原生核准傳送

某些頻道也可以作為原生核准用戶端。原生用戶端會在共用的同一聊天 `/approve`
流程之上，加入核准者私訊、原始聊天扇出，以及頻道特定的互動式核准使用者體驗。

當原生核准卡片/按鈕可用時，該原生 UI 是主要的
代理程式面向路徑。代理程式不應同時回顯重複的純聊天
`/approve` 命令，除非工具結果表示聊天核准不可用，或
手動核准是唯一剩餘路徑。

如果已設定原生核准用戶端，但原始頻道沒有作用中的原生執行階段，
OpenClaw 會保持本機確定性的 `/approve`
提示可見。如果原生執行階段處於作用中並嘗試傳送，但沒有
目標收到卡片，OpenClaw 會傳送同一聊天備援通知，其中包含
精確的 `/approve <id> <decision>` 命令，讓要求仍可被解決。

通用模型：

- 主機 exec 政策仍決定是否需要 exec 核准
- `approvals.exec` 控制將核准提示轉送到其他聊天目的地
- `channels.<channel>.execApprovals` 控制是否啟用 Discord、Slack、Telegram 及類似的
  頻道特定原生用戶端
- 當要求來自 Slack 且 Slack 外掛核准者可解析時，Slack 外掛核准可以使用 Slack 的原生核准用戶端；
  `approvals.plugin` 也可以將外掛核准路由到 Slack
  工作階段或目標，即使 Slack exec 核准已停用
- 當 exec 和外掛核准源自 Google
  Chat 空間或討論串，且穩定的 `users/<id>` 核准者可從 `dm.allowFrom` 或
  `defaultTo` 解析時，Google Chat 原生核准卡片會處理這些核准；它們不使用反應事件來做決定
- WhatsApp 和 Signal 反應核准傳送受 `approvals.exec` 和
  `approvals.plugin` 控制；它們沒有 `channels.<channel>.execApprovals` 區塊

當以下條件全部成立時，原生核准用戶端會自動啟用私訊優先傳送：

- 頻道支援原生核准傳送
- 可從明確的 `execApprovals.approvers` 或擁有者
  身分（例如 `commands.ownerAllowFrom`）解析核准者
- `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`

設定 `enabled: false` 可明確停用原生核准用戶端。設定 `enabled: true` 可在
核准者可解析時強制啟用。公開原始聊天傳送仍透過
`channels.<channel>.execApprovals.target` 明確設定。

常見問題：[為什麼聊天核准有兩個 exec 核准設定？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`
- Google Chat：使用 `channels.googlechat.dm.allowFrom` 或
  `channels.googlechat.defaultTo` 設定穩定核准者；不需要 `execApprovals` 區塊
- WhatsApp：使用 `approvals.exec` 和 `approvals.plugin` 將核准提示路由到 WhatsApp
- Signal：使用 `approvals.exec` 和 `approvals.plugin` 將核准提示路由到 Signal

這些原生核准用戶端會在共用的同一聊天 `/approve` 流程和共用核准按鈕之上，
加入私訊路由和選用的頻道扇出。

共用行為：

- Slack、Matrix、Microsoft Teams 和類似可傳送的聊天會使用一般頻道驗證模型
  進行同一聊天 `/approve`
- 當原生核准用戶端自動啟用時，預設原生傳送目標是核准者私訊
- 對於 Discord 和 Telegram，只有已解析的核准者可以核准或拒絕
- Discord 核准者可以是明確設定的（`execApprovals.approvers`），或從 `commands.ownerAllowFrom` 推斷
- Telegram 核准者可以是明確設定的（`execApprovals.approvers`），或從 `commands.ownerAllowFrom` 推斷
- Slack 核准者可以是明確設定的（`execApprovals.approvers`），或從 `commands.ownerAllowFrom` 推斷
- Slack 外掛核准私訊使用來自 `allowFrom` 的 Slack 外掛核准者和帳號預設
  路由，而不是 Slack exec 核准者
- Slack 原生按鈕會保留核准 ID 種類，因此 `plugin:` ID 可解析外掛核准，
  不需要第二層 Slack 本機備援
- Google Chat 原生卡片會在訊息文字中保留手動 `/approve` 備援，但卡片按鈕
  回呼只攜帶不透明動作權杖；核准 ID 和決定會從伺服器端
  待處理狀態還原
- WhatsApp 表情符號核准只在相符的頂層
  轉送家族已啟用並路由到 WhatsApp 時，才會同時處理 exec 和外掛提示；僅目標的 WhatsApp 轉送會留在
  共用轉送路徑上，除非它符合相同的原生來源目標
- Signal 反應核准只在相符的頂層
  轉送家族已啟用並路由到 Signal 時，才會同時處理 exec 和外掛提示。直接的同一聊天 Signal exec 核准可以
  在沒有明確核准者的情況下抑制本機 `/approve` 備援；Signal 反應解析
  仍需要來自 `channels.signal.allowFrom` 或 `defaultTo` 的明確 Signal 核准者。
- Matrix 原生私訊/頻道路由和反應捷徑會同時處理 exec 和外掛核准；
  外掛授權仍來自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示會在第一個提示事件上包含 `com.openclaw.approval` 自訂事件內容，
  讓支援 OpenClaw 的 Matrix 用戶端可以讀取結構化核准狀態，而標準用戶端
  仍保留純文字 `/approve` 備援
- 要求者不需要是核准者
- 當原始聊天已支援命令和回覆時，可以直接使用 `/approve` 核准
- 原生 Discord 核准按鈕會依核准 ID 種類路由：`plugin:` ID 會
  直接進入外掛核准，其他所有內容都進入 exec 核准
- 原生 Telegram 核准按鈕會遵循與 `/approve` 相同的有界 exec 至外掛備援
- 當原生 `target` 啟用原始聊天傳送時，核准提示會包含命令文字
- 待處理的 exec 核准預設會在 30 分鐘後到期
- 如果沒有操作員 UI 或已設定的核准用戶端可以接受要求，提示會備援到 `askFallback`

敏感的僅限擁有者群組命令，例如 `/diagnostics` 和 `/export-trajectory`，會使用私人
擁有者路由來傳送核准提示和最終結果。OpenClaw 會先嘗試在
擁有者執行命令的同一介面上使用私人路由。如果該介面沒有私人擁有者路由，它會
備援到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，因此 Discord 群組命令
仍可在 Telegram 是已設定的主要私人介面時，將核准和結果傳送到擁有者的 Telegram 私訊。
群組聊天只會收到簡短的確認。

Telegram 預設使用核准者私訊（`target: "dm"`）。當你
希望核准提示也出現在原始 Telegram 聊天/主題中時，可以切換為 `channel` 或 `both`。對於 Telegram 論壇
主題，OpenClaw 會保留該主題，用於核准提示和核准後的後續訊息。

請參閱：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全注意事項：

- Unix socket 模式 `0600`，權杖儲存在 `exec-approvals.json`。
- 同 UID 對等端檢查。
- 挑戰/回應（nonce + HMAC 權杖 + 要求雜湊）+ 短 TTL。

## 常見問題

### 什麼時候會在核准目標上使用 `accountId` 和 `threadId`？

當頻道有多個已設定身分，且核准提示必須
透過某個特定帳號送出時，請使用 `accountId`。當目的地支援主題或
討論串，且提示應留在該討論串內而不是頂層聊天時，請使用 `threadId`。

一個具體的 Telegram 案例是具有論壇主題和兩個 Telegram Bot
帳號的營運超級群組。`to` 值命名超級群組，`accountId` 選取 Bot 帳號，而 `threadId`
選取論壇主題：
__OC_I18N_900005__
使用該設定時，轉送的 exec 核准會由 `ops-bot` Telegram 帳號張貼到聊天
`-1001234567890` 的主題 `77`。沒有 `accountId` 的目標會使用頻道的預設帳號，而
沒有 `threadId` 的目標會張貼到頂層目的地。

### 當核准被傳送到工作階段時，該工作階段中的任何人都能核准嗎？

不能。工作階段傳送只控制提示出現的位置。它本身不會授權該聊天中的每個
參與者進行核准。

對於通用的同一聊天 `/approve`，傳送者必須已經在該
頻道工作階段中獲得命令授權。如果頻道公開明確的核准者，這些核准者可以授權
`/approve` 動作，即使他們在該工作階段中原本沒有命令授權。

有些頻道更嚴格。Discord、Telegram、Matrix、Slack 原生核准私訊，以及類似
原生核准用戶端會使用其已解析的核准者清單進行核准授權。例如，
Telegram 論壇主題核准提示可以對主題中的每個人可見，但只有從
`channels.telegram.execApprovals.approvers` 或
`commands.ownerAllowFrom` 解析出的數字 Telegram 使用者 ID 可以核准或拒絕它。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals) — 核心政策與核准流程
- [Exec 工具](/zh-TW/tools/exec)
- [提升模式](/zh-TW/tools/elevated)
- [Skills](/zh-TW/tools/skills) — Skills 支援的自動允許行為
