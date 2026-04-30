---
read_when:
    - 設定安全分組或自訂安全分組設定檔
    - 將核准轉送到 Slack/Discord/Telegram 或其他聊天頻道
    - 為通道實作原生核准用戶端
summary: 進階執行核准：安全二進位檔、解譯器繫結、核准轉送、原生傳遞
title: 執行核准 — 進階
x-i18n:
    generated_at: "2026-04-30T03:44:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

進階 exec 核准主題：`safeBins` 快速路徑、直譯器/執行階段
繫結，以及將核准轉送至聊天頻道（包括原生傳遞）。
如需核心政策與核准流程，請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 安全 bin（僅 stdin）

`tools.exec.safeBins` 定義一小組**僅 stdin** 的二進位檔（例如
`cut`），可在允許清單模式中執行，**不需要**明確的允許清單項目。
安全 bin 會拒絕位置檔案引數和類似路徑的 token，因此只能處理傳入的串流。
請將其視為串流篩選器的狹窄快速路徑，而不是一般信任清單。

<Warning>
**不要**將直譯器或執行階段二進位檔（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）加入 `safeBins`。如果某個命令本質上可以評估程式碼、
執行子命令或讀取檔案，請優先使用明確的允許清單項目，並保持啟用核准提示。
自訂安全 bin 必須在 `tools.exec.safeBinProfiles.<bin>` 中定義明確的
profile。
</Warning>

預設安全 bin：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在預設清單中。如果你選擇加入，請為它們的非 stdin
工作流程保留明確的允許清單項目。對於安全 bin 模式中的 `grep`，
請使用 `-e`/`--regexp` 提供 pattern；位置 pattern 形式會被拒絕，
因此檔案運算元無法偽裝成模稜兩可的位置引數。

### Argv 驗證與遭拒旗標

驗證僅由 argv 形狀決定（不檢查主機檔案系統是否存在），這可防止因 allow/deny
差異產生檔案存在性 oracle 行為。預設安全 bin 會拒絕以檔案為導向的選項；
長選項採 fail-closed 方式驗證（未知旗標與模稜兩可的縮寫會被拒絕）。

依安全 bin profile 區分的遭拒旗標：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全 bin 也會強制 argv token 在執行時被視為**字面文字**（沒有 globbing，
也沒有 `$VARS` 展開），用於僅 stdin 的片段，因此像 `*` 或 `$HOME/...`
這類 pattern 不能被用來夾帶檔案讀取。

### 受信任的二進位檔目錄

安全 bin 必須從受信任的二進位檔目錄解析（系統預設值加上可選的
`tools.exec.safeBinTrustedDirs`）。`PATH` 項目絕不會自動受信任。
預設受信任目錄刻意保持最小：`/bin`、`/usr/bin`。如果你的安全 bin
可執行檔位於套件管理器/使用者路徑（例如 `/opt/homebrew/bin`、`/usr/local/bin`、
`/opt/local/bin`、`/snap/bin`），請明確加入
`tools.exec.safeBinTrustedDirs`。

### Shell 串接、wrapper 與 multiplexer

當每個頂層片段都符合允許清單（包括安全 bin 或 skill 自動允許）時，
允許 Shell 串接（`&&`、`||`、`;`）。允許清單模式仍不支援重新導向。
命令替換（`$()` / 反引號）會在允許清單解析期間遭拒，包括在雙引號內；
如果你需要字面 `$()` 文字，請使用單引號。

在 macOS companion app 核准中，包含 shell 控制或展開語法（`&&`、`||`、
`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文字，
會被視為允許清單未命中，除非 shell 二進位檔本身已在允許清單中。

對於 shell wrapper（`bash|sh|zsh ... -c/-lc`），請求範圍的 env 覆寫會縮減為一小組明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、
`NO_COLOR`、`FORCE_COLOR`）。

在允許清單模式中的 `allow-always` 決策，已知的 dispatch wrapper（`env`、
`nice`、`nohup`、`stdbuf`、`timeout`）會持久化內部可執行檔路徑，
而不是 wrapper 路徑。Shell multiplexer（`busybox`、`toybox`）會以同樣方式針對
shell applet（`sh`、`ash` 等）展開。如果無法安全展開 wrapper 或 multiplexer，
就不會自動持久化任何允許清單項目。

如果你將 `python3` 或 `node` 這類直譯器加入允許清單，建議使用
`tools.exec.strictInlineEval=true`，讓 inline eval 仍需要明確核准。
在 strict 模式中，`allow-always` 仍可持久化良性的直譯器/腳本呼叫，
但 inline-eval 載體不會自動持久化。

### 安全 bin 與允許清單比較

| 主題             | `tools.exec.safeBins`                                  | 允許清單（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目標             | 自動允許狹窄的 stdin 篩選器                           | 明確信任特定可執行檔                                                               |
| 比對類型         | 可執行檔名稱 + 安全 bin argv 政策                     | 已解析的可執行檔路徑 glob，或 PATH 呼叫命令的裸命令名稱 glob                      |
| 引數範圍         | 受安全 bin profile 和字面 token 規則限制              | 僅比對路徑；其他引數由你負責                                                       |
| 典型範例         | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 自訂 CLI                                        |
| 最佳用途         | pipeline 中低風險的文字轉換                           | 任何行為或副作用較廣的工具                                                         |

設定位置：

- `safeBins` 來自 config（`tools.exec.safeBins` 或每個 agent 的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 來自 config（`tools.exec.safeBinTrustedDirs` 或每個 agent 的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 來自 config（`tools.exec.safeBinProfiles` 或每個 agent 的 `agents.list[].tools.exec.safeBinProfiles`）。每個 agent 的 profile key 會覆寫全域 key。
- 允許清單項目位於主機本機的 `~/.openclaw/exec-approvals.json`，在 `agents.<id>.allowlist` 底下（或透過 Control UI / `openclaw approvals allowlist ...`）。
- 當直譯器/執行階段 bin 出現在 `safeBins` 中但沒有明確 profile 時，`openclaw security audit` 會以 `tools.exec.safe_bins_interpreter_unprofiled` 發出警告。
- `openclaw doctor --fix` 可以將缺少的自訂 `safeBinProfiles.<bin>` 項目 scaffold 為 `{}`（之後請檢閱並收緊）。直譯器/執行階段 bin 不會自動 scaffold。

自訂 profile 範例：
__OC_I18N_900000__
如果你明確將 `jq` 加入 `safeBins`，OpenClaw 仍會在安全 bin
模式中拒絕 `env` builtin，因此 `jq -n env` 無法在沒有明確允許清單路徑
或核准提示的情況下傾印主機程序環境。

## 直譯器/執行階段命令

由核准支援的直譯器/執行階段執行刻意採取保守做法：

- 一律繫結精確的 argv/cwd/env 內容。
- 直接 shell 腳本和直接執行階段檔案形式會盡力繫結到一個具體的本機檔案快照。
- 常見套件管理器 wrapper 形式若仍會解析到一個直接本機檔案（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`），會在繫結前先展開。
- 如果 OpenClaw 無法為直譯器/執行階段命令精確識別一個具體本機檔案
  （例如 package script、eval 形式、執行階段特定 loader chain，或模稜兩可的多檔案
  形式），由核准支援的執行會被拒絕，而不是宣稱其擁有實際上沒有的語意涵蓋。
- 對於這些工作流程，請優先使用 sandboxing、獨立的主機邊界，或明確受信任的
  允許清單/完整工作流程，讓操作者接受更廣泛的執行階段語意。

需要核准時，exec 工具會立即回傳核准 id。使用該 id 對應後續系統事件
（`Exec finished` / `Exec denied`）。如果 timeout 前沒有收到決策，
該請求會被視為核准逾時，並以拒絕原因呈現。

### 後續傳遞行為

核准的 async exec 完成後，OpenClaw 會將後續 `agent` turn 傳送至同一個 session。

- 如果存在有效的外部傳遞目標（可傳遞頻道加上目標 `to`），後續傳遞會使用該頻道。
- 在沒有外部目標的純 webchat 或內部 session 流程中，後續傳遞會維持 session-only（`deliver: false`）。
- 如果呼叫者明確要求嚴格外部傳遞，但沒有可解析的外部頻道，該請求會以 `INVALID_REQUEST` 失敗。
- 如果啟用 `bestEffortDeliver` 且無法解析外部頻道，傳遞會降級為 session-only，而不是失敗。

## 將核准轉送至聊天頻道

你可以將 exec 核准提示轉送至任何聊天頻道（包括 Plugin 頻道），並用
`/approve` 核准。這會使用一般的 outbound delivery pipeline。

Config：
__OC_I18N_900001__
在聊天中回覆：
__OC_I18N_900002__
`/approve` 命令會處理 exec 核准與 Plugin 核准。如果 ID 不符合待處理的 exec 核准，它會自動改查 Plugin 核准。

### Plugin 核准轉送

Plugin 核准轉送使用與 exec 核准相同的傳遞 pipeline，但在
`approvals.plugin` 底下有自己的獨立 config。啟用或停用其中一個不會影響另一個。
__OC_I18N_900003__
config 形狀與 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 和 `targets` 的運作方式都相同。

支援共用互動式回覆的頻道會為 exec 和 Plugin 核准呈現相同的核准按鈕。
沒有共用互動式 UI 的頻道會退回到純文字與 `/approve` 指示。

### 任何頻道上的同聊天核准

當 exec 或 Plugin 核准請求源自可傳遞的聊天介面時，預設現在可在同一個聊天中使用
`/approve` 核准。除了既有的 Web UI 與終端機 UI 流程外，這也適用於 Slack、Matrix
和 Microsoft Teams 等頻道。

這條共用文字命令路徑會使用該對話的一般頻道驗證模型。如果原始聊天已可傳送命令並接收回覆，
核准請求就不再需要單獨的原生傳遞 adapter 只是為了維持 pending。

Discord 和 Telegram 也支援同聊天 `/approve`，但即使停用原生核准傳遞，
這些頻道仍會使用它們解析出的核准者清單進行授權。

對於會直接呼叫 Gateway 的 Telegram 和其他原生核准用戶端，
這個 fallback 被刻意限制在「找不到核准」失敗。真正的
exec 核准拒絕/錯誤不會靜默重試為 Plugin 核准。

### 原生核准傳遞

有些頻道也可以作為原生核准用戶端。原生用戶端會在共用的同聊天 `/approve`
流程之上，加入核准者 DM、原始聊天 fanout，以及頻道特定的互動式核准 UX。

當原生核准卡片/按鈕可用時，該原生 UI 是主要的面向代理程式路徑。除非工具結果表示聊天核准不可用，或手動核准是唯一剩餘路徑，否則代理程式不應同時回顯重複的純聊天 `/approve` 命令。

如果已設定原生核准用戶端，但來源頻道沒有作用中的原生執行階段，OpenClaw 會讓本機確定性的 `/approve` 提示保持可見。如果原生執行階段處於作用中並嘗試傳送，但沒有任何目標收到卡片，OpenClaw 會在同一聊天中傳送備援通知，並附上確切的 `/approve <id> <decision>` 命令，讓請求仍可被解決。

通用模型：

- 主機 exec 政策仍會決定是否需要 exec 核准
- `approvals.exec` 控制將核准提示轉送到其他聊天目的地
- `channels.<channel>.execApprovals` 控制該頻道是否作為原生核准用戶端

當以下條件全都成立時，原生核准用戶端會自動啟用 DM 優先傳送：

- 該頻道支援原生核准傳送
- 可從明確的 `execApprovals.approvers` 或擁有者身分（例如 `commands.ownerAllowFrom`）解析核准者
- `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`

設定 `enabled: false` 可明確停用原生核准用戶端。設定 `enabled: true` 可在核准者可解析時強制啟用。公開來源聊天傳送仍需透過 `channels.<channel>.execApprovals.target` 明確設定。

FAQ：[為什麼聊天核准有兩個 exec 核准設定？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

這些原生核准用戶端會在共用的同一聊天 `/approve` 流程與共用核准按鈕之上，加入 DM 路由與選用的頻道扇出傳送。

共用行為：

- Slack、Matrix、Microsoft Teams 與類似的可傳遞聊天使用一般頻道驗證模型
  進行同一聊天內的 `/approve`
- 當原生核准用戶端自動啟用時，預設原生傳送目標是核准者的私訊
- 對於 Discord 與 Telegram，只有已解析的核准者可以核准或拒絕
- Discord 核准者可以是明確設定的 (`execApprovals.approvers`)，或從 `commands.ownerAllowFrom` 推斷
- Telegram 核准者可以是明確設定的 (`execApprovals.approvers`)，或從 `commands.ownerAllowFrom` 推斷
- Slack 核准者可以是明確設定的 (`execApprovals.approvers`)，或從 `commands.ownerAllowFrom` 推斷
- Slack 原生按鈕會保留核准 ID 類型，因此 `plugin:` ID 可以解析 Plugin 核准，
  不需要第二層 Slack 本機備援層
- Matrix 原生私訊/頻道路由與反應捷徑同時處理 exec 與 Plugin 核准；
  Plugin 授權仍來自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示會在第一個提示事件中包含 `com.openclaw.approval` 自訂事件內容，
  讓支援 OpenClaw 的 Matrix 用戶端可以讀取結構化核准狀態，而一般用戶端
  仍保留純文字 `/approve` 備援
- 請求者不需要是核准者
- 當發起聊天已支援命令與回覆時，該聊天可以直接用 `/approve` 核准
- 原生 Discord 核准按鈕會依核准 ID 類型路由：`plugin:` ID 會
  直接前往 Plugin 核准，其他全部前往 exec 核准
- 原生 Telegram 核准按鈕遵循與 `/approve` 相同的受限 exec 到 Plugin 備援
- 當原生 `target` 啟用來源聊天傳送時，核准提示會包含命令文字
- 待處理的 exec 核准預設會在 30 分鐘後到期
- 如果沒有操作員 UI 或已設定的核准用戶端可以接受請求，提示會退回到 `askFallback`

敏感的僅限擁有者群組命令，例如 `/diagnostics` 與 `/export-trajectory`，會對核准提示與最終結果使用私密
擁有者路由。OpenClaw 會先嘗試在擁有者執行命令的同一介面上使用私密路由。如果該介面沒有私密擁有者路由，則會
退回到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，因此當 Telegram 是已設定的
主要私密介面時，Discord 群組命令仍可將核准與結果傳送到擁有者的 Telegram 私訊。群組聊天只會收到一則簡短確認。

Telegram 預設使用核准者私訊 (`target: "dm"`)。當你希望核准提示也出現在原始 Telegram 聊天/主題中時，可以切換為 `channel` 或 `both`。對於 Telegram 論壇
主題，OpenClaw 會為核准提示與核准後的後續回覆保留該主題。

請參閱：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全性注意事項：

- Unix socket 模式 `0600`，權杖儲存在 `exec-approvals.json`。
- 相同 UID 對等端檢查。
- 挑戰/回應 (nonce + HMAC 權杖 + 請求雜湊) + 短 TTL。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals) — 核心政策與核准流程
- [Exec 工具](/zh-TW/tools/exec)
- [提升權限模式](/zh-TW/tools/elevated)
- [Skills](/zh-TW/tools/skills) — 由技能支援的自動允許行為
