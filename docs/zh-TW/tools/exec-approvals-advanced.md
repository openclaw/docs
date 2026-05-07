---
read_when:
    - 設定安全執行檔或自訂安全執行檔設定檔
    - 將核准轉送至 Slack/Discord/Telegram 或其他聊天頻道
    - 為通道實作原生核准用戶端
summary: 進階執行核准：安全執行檔、直譯器繫結、核准轉送、原生傳遞
title: 執行核准 — 進階
x-i18n:
    generated_at: "2026-05-07T01:54:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

進階 exec 核准主題：`safeBins` 快速路徑、直譯器/runtime 綁定，以及將核准轉送到聊天頻道（包含原生傳遞）。核心政策與核准流程請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 安全 bin（僅限 stdin）

`tools.exec.safeBins` 定義一小份**僅限 stdin** 的二進位檔清單（例如 `cut`），可在 allowlist 模式中**不需要**明確 allowlist 項目即可執行。安全 bin 會拒絕位置式檔案引數和類似路徑的 token，因此只能處理傳入串流。請將它視為串流篩選器的狹窄快速路徑，而不是一般信任清單。

<Warning>
請**不要**將直譯器或 runtime 二進位檔（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）加入 `safeBins`。如果命令依設計可以評估程式碼、執行子命令或讀取檔案，請優先使用明確 allowlist 項目，並保持核准提示啟用。自訂安全 bin 必須在 `tools.exec.safeBinProfiles.<bin>` 中定義明確 profile。
</Warning>

預設安全 bin：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在預設清單中。如果你選擇加入，請為它們的非 stdin 工作流程保留明確 allowlist 項目。對於安全 bin 模式中的 `grep`，請使用 `-e`/`--regexp` 提供 pattern；位置式 pattern 形式會被拒絕，避免檔案運算元被偽裝成模稜兩可的位置引數。

### Argv 驗證與拒絕的旗標

驗證只由 argv 形狀決定（不檢查主機檔案系統是否存在），這能避免因 allow/deny 差異產生檔案存在性 oracle 行為。預設安全 bin 會拒絕以檔案為導向的選項；長選項採 fail-closed 驗證（未知旗標與模稜兩可的縮寫會被拒絕）。

依安全 bin profile 拒絕的旗標：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全 bin 也會在執行時強制將 argv token 視為**字面文字**（僅限 stdin 的片段不做 glob 展開，也不做 `$VARS` 展開），因此像 `*` 或 `$HOME/...` 這類 pattern 不能用來偷渡檔案讀取。

### 受信任的二進位檔目錄

安全 bin 必須從受信任的二進位檔目錄解析（系統預設值加上選用的 `tools.exec.safeBinTrustedDirs`）。`PATH` 項目絕不會自動受信任。預設受信任目錄刻意維持最小：`/bin`、`/usr/bin`。如果你的安全 bin 可執行檔位於套件管理器/使用者路徑（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），請將它們明確加入 `tools.exec.safeBinTrustedDirs`。

### Shell 串接、包裝器與多工器

當每個頂層片段都符合 allowlist（包含安全 bin 或 Skill 自動允許）時，允許 shell 串接（`&&`、`||`、`;`）。allowlist 模式仍不支援重新導向。命令替換（`$()` / 反引號）會在 allowlist 解析期間被拒絕，包含在雙引號內；如果需要字面 `$()` 文字，請使用單引號。

在 macOS companion-app 核准中，包含 shell 控制或展開語法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文字會被視為 allowlist 未命中，除非 shell 二進位檔本身已列入 allowlist。

對於 shell 包裝器（`bash|sh|zsh ... -c/-lc`），request-scoped env 覆寫會縮減為一小份明確 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

在 allowlist 模式中的 `allow-always` 決策，已知的 dispatch 包裝器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存內部可執行檔路徑，而不是包裝器路徑。Shell 多工器（`busybox`、`toybox`）也會以相同方式針對 shell applet（`sh`、`ash` 等）解除包裝。如果無法安全解除包裝器或多工器，系統不會自動保存 allowlist 項目。

如果你將 `python3` 或 `node` 等直譯器列入 allowlist，建議使用 `tools.exec.strictInlineEval=true`，讓 inline eval 仍需明確核准。在 strict 模式中，`allow-always` 仍可保存良性的直譯器/腳本叫用，但 inline-eval 載體不會自動保存。

### 安全 bin 與 allowlist 的比較

| 主題 | `tools.exec.safeBins` | Allowlist（`exec-approvals.json`） |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目標 | 自動允許狹窄的 stdin 篩選器 | 明確信任特定可執行檔 |
| 比對類型 | 可執行檔名稱 + 安全 bin argv 政策 | 已解析的可執行檔路徑 glob，或透過 PATH 叫用命令的裸命令名稱 glob |
| 引數範圍 | 受安全 bin profile 和字面 token 規則限制 | 預設依路徑比對；選用的 `argPattern` 可限制已解析的 argv |
| 典型範例 | `head`、`tail`、`tr`、`wc` | `jq`、`python3`、`node`、`ffmpeg`、自訂 CLI |
| 最佳用途 | 管線中的低風險文字轉換 | 任何具有較廣行為或副作用的工具 |

設定位置：

- `safeBins` 來自設定（`tools.exec.safeBins` 或每個 agent 的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 來自設定（`tools.exec.safeBinTrustedDirs` 或每個 agent 的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 來自設定（`tools.exec.safeBinProfiles` 或每個 agent 的 `agents.list[].tools.exec.safeBinProfiles`）。每個 agent 的 profile key 會覆寫全域 key。
- allowlist 項目位於主機本機的 `~/.openclaw/exec-approvals.json` 中 `agents.<id>.allowlist` 之下（或透過 Control UI / `openclaw approvals allowlist ...`）。
- 當直譯器/runtime bin 出現在 `safeBins` 中但沒有明確 profile 時，`openclaw security audit` 會以 `tools.exec.safe_bins_interpreter_unprofiled` 發出警告。
- `openclaw doctor --fix` 可以將缺少的自訂 `safeBinProfiles.<bin>` 項目 scaffold 為 `{}`（之後請檢閱並收緊）。直譯器/runtime bin 不會自動 scaffold。

自訂 profile 範例：
__OC_I18N_900000__
如果你明確選擇將 `jq` 加入 `safeBins`，OpenClaw 在安全 bin 模式中仍會拒絕 `env` builtin，因此 `jq -n env` 無法在沒有明確 allowlist 路徑或核准提示的情況下傾印主機處理程序環境。

## 直譯器/runtime 命令

以核准支援的直譯器/runtime 執行刻意採保守設計：

- 一律綁定精確的 argv/cwd/env context。
- 直接 shell script 與直接 runtime 檔案形式會盡力綁定到一個具體本機檔案 snapshot。
- 仍可解析到一個直接本機檔案的常見套件管理器包裝器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）會在綁定前解除包裝。
- 如果 OpenClaw 無法為直譯器/runtime 命令精確識別一個具體本機檔案（例如套件腳本、eval 形式、runtime 專屬 loader 鏈，或模稜兩可的多檔案形式），以核准支援的執行會被拒絕，而不是宣稱具備其實沒有的語意涵蓋範圍。
- 對於這些工作流程，請優先使用 sandboxing、獨立主機邊界，或明確受信任的 allowlist/完整工作流程，讓操作員接受較廣泛的 runtime 語意。

需要核准時，exec 工具會立即回傳核准 id。請使用該 id 關聯後續系統事件（`Exec finished` / `Exec denied`）。如果在 timeout 前沒有收到決策，request 會被視為核准逾時，並以拒絕理由呈現。

### 後續傳遞行為

核准的 async exec 完成後，OpenClaw 會將後續 `agent` turn 傳送到同一個 session。

- 如果存在有效的外部傳遞目標（可傳遞頻道加上目標 `to`），後續傳遞會使用該頻道。
- 在只有 webchat 或沒有外部目標的內部 session 流程中，後續傳遞維持只在 session 內（`deliver: false`）。
- 如果呼叫端明確要求 strict 外部傳遞，但沒有可解析的外部頻道，request 會以 `INVALID_REQUEST` 失敗。
- 如果已啟用 `bestEffortDeliver` 且無法解析外部頻道，傳遞會降級為只在 session 內，而不是失敗。

## 將核准轉送到聊天頻道

你可以將 exec 核准提示轉送到任何聊天頻道（包含 Plugin 頻道），並使用 `/approve` 核准。這會使用一般的 outbound delivery pipeline。

設定：
__OC_I18N_900001__
在聊天中回覆：
__OC_I18N_900002__
`/approve` 命令會同時處理 exec 核准和 Plugin 核准。如果 ID 不符合待處理的 exec 核准，它會自動改為檢查 Plugin 核准。

### Plugin 核准轉送

Plugin 核准轉送使用與 exec 核准相同的 delivery pipeline，但在 `approvals.plugin` 之下有自己的獨立設定。啟用或停用其中一個不會影響另一個。
__OC_I18N_900003__
設定形狀與 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的運作方式相同。

支援共享互動式回覆的頻道，會為 exec 與 Plugin 核准呈現相同的核准按鈕。沒有共享互動式 UI 的頻道，會退回純文字與 `/approve` 指示。
Plugin 核准 request 可能會限制可用決策。核准介面會使用 request 宣告的決策集，而 Gateway 會拒絕提交未提供的決策嘗試。

### 任何頻道中的同一聊天核准

當 exec 或 Plugin 核准 request 來自可傳遞的聊天介面時，預設現在同一個聊天可以用 `/approve` 核准。這除了現有的 Web UI 與終端機 UI 流程外，也適用於 Slack、Matrix 和 Microsoft Teams 等頻道。

這個共享文字命令路徑會使用該對話的一般頻道 auth 模型。如果原始聊天已可傳送命令並接收回覆，核准 request 就不再需要為了保持待處理狀態而使用獨立原生傳遞 adapter。

Discord 和 Telegram 也支援同一聊天中的 `/approve`，但即使停用原生核准傳遞，這些頻道仍會使用其已解析的核准者清單進行授權。

對於 Telegram 和其他直接呼叫 Gateway 的原生核准 client，這個 fallback 會刻意限制在「找不到核准」失敗。真正的 exec 核准拒絕/錯誤不會靜默重試為 Plugin 核准。

### 原生核准傳遞

某些頻道也可以作為原生核准用戶端。原生用戶端會在共享的同聊天室 `/approve` 流程之上，加入核准者私訊、來源聊天室
分送，以及頻道專屬的互動式核准 UX。

當原生核准卡片/按鈕可用時，該原生 UI 是主要的
面向代理程式路徑。代理程式不應同時回顯重複的純聊天
`/approve` 命令，除非工具結果表示聊天核准不可用，或
手動核准是唯一剩餘路徑。

如果已設定原生核准用戶端，但來源頻道沒有作用中的原生執行階段，
OpenClaw 會保持本機確定性的 `/approve`
提示可見。如果原生執行階段作用中並嘗試投遞，但沒有任何
目標收到卡片，OpenClaw 會傳送同聊天室後援通知，其中包含
確切的 `/approve <id> <decision>` 命令，讓請求仍可被解決。

通用模型：

- 主機 exec 政策仍決定是否需要 exec 核准
- `approvals.exec` 控制將核准提示轉送到其他聊天目的地
- `channels.<channel>.execApprovals` 控制該頻道是否作為原生核准用戶端

當下列條件全部為真時，原生核准用戶端會自動啟用以私訊優先的投遞：

- 該頻道支援原生核准投遞
- 可從明確的 `execApprovals.approvers` 或擁有者
  身分（例如 `commands.ownerAllowFrom`）解析出核准者
- `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`

設定 `enabled: false` 可明確停用原生核准用戶端。設定 `enabled: true` 可在
核准者可解析時強制啟用。公開來源聊天室投遞仍透過
`channels.<channel>.execApprovals.target` 明確設定。

常見問題：[為什麼聊天核准有兩個 exec 核准設定？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

這些原生核准用戶端會在共享的同聊天室 `/approve` 流程和共享核准按鈕之上，
加入私訊路由和可選的頻道分送。

共享行為：

- Slack、Matrix、Microsoft Teams，以及類似的可投遞聊天，會使用一般頻道驗證模型
  進行同聊天室 `/approve`
- 當原生核准用戶端自動啟用時，預設原生投遞目標是核准者私訊
- 對於 Discord 和 Telegram，只有已解析的核准者可以核准或拒絕
- Discord 核准者可以是明確設定的 (`execApprovals.approvers`)，或從 `commands.ownerAllowFrom` 推斷
- Telegram 核准者可以是明確設定的 (`execApprovals.approvers`)，或從 `commands.ownerAllowFrom` 推斷
- Slack 核准者可以是明確設定的 (`execApprovals.approvers`)，或從 `commands.ownerAllowFrom` 推斷
- Slack 原生按鈕會保留核准 ID 種類，因此 `plugin:` ID 可以解析 Plugin 核准，
  不需要第二層 Slack 本機後援層
- Matrix 原生私訊/頻道路由和反應快捷方式會同時處理 exec 與 Plugin 核准；
  Plugin 授權仍來自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示會在第一個提示事件中包含 `com.openclaw.approval` 自訂事件內容，
  讓支援 OpenClaw 的 Matrix 用戶端可讀取結構化核准狀態，而標準用戶端
  保留純文字 `/approve` 後援
- 請求者不需要是核准者
- 當來源聊天室已支援命令和回覆時，可以直接使用 `/approve` 核准
- 原生 Discord 核准按鈕會依核准 ID 種類路由：`plugin:` ID 會
  直接送往 Plugin 核准，其他所有 ID 則送往 exec 核准
- 原生 Telegram 核准按鈕會遵循與 `/approve` 相同的有界 exec 到 Plugin 後援
- 當原生 `target` 啟用來源聊天室投遞時，核准提示會包含命令文字
- 待處理的 exec 核准預設會在 30 分鐘後過期
- 如果沒有操作員 UI 或已設定的核准用戶端可以接受請求，提示會後援至 `askFallback`

敏感的僅限擁有者群組命令（例如 `/diagnostics` 和 `/export-trajectory`）會使用私有
擁有者路由傳送核准提示和最終結果。OpenClaw 會先在擁有者執行命令的
同一表面嘗試私有路由。如果該表面沒有私有擁有者路由，則會
後援至 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，因此 Discord 群組命令
仍可在 Telegram 是已設定的主要私有介面時，將核准和結果傳送到擁有者的 Telegram 私訊。
群組聊天室只會收到簡短確認。

Telegram 預設使用核准者私訊 (`target: "dm"`)。當你
也想讓核准提示出現在來源 Telegram 聊天/主題中時，可以切換為 `channel` 或 `both`。對於 Telegram 論壇
主題，OpenClaw 會為核准提示和核准後的後續訊息保留該主題。

請參閱：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全性注意事項：

- Unix socket 模式 `0600`，權杖儲存在 `exec-approvals.json`。
- 同 UID 對等端檢查。
- 詢問/回應（nonce + HMAC token + request hash）+ 短 TTL。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals) — 核心政策和核准流程
- [Exec 工具](/zh-TW/tools/exec)
- [提升模式](/zh-TW/tools/elevated)
- [Skills](/zh-TW/tools/skills) — 由 Skills 支援的自動允許行為
