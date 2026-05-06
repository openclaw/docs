---
read_when:
    - 設定安全區或自訂安全區設定檔
    - 將核准請求轉發至 Slack/Discord/Telegram 或其他聊天頻道
    - 為頻道實作原生核准用戶端
summary: 進階 exec 核准：安全二進位檔、直譯器繫結、核准轉送、原生傳遞
title: 執行核准 — 進階
x-i18n:
    generated_at: "2026-05-06T02:59:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

進階 exec 核准主題：`safeBins` 快速路徑、直譯器/執行階段
繫結，以及將核准轉送至聊天頻道（包含原生投遞）。
核心政策與核准流程請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## 安全 bin（僅 stdin）

`tools.exec.safeBins` 定義一小份**僅限 stdin** 的二進位檔清單（例如 `cut`），可在允許清單模式下執行，且**不需要**明確的允許清單項目。安全 bin 會拒絕位置檔案參數與類似路徑的 Token，因此只能處理傳入的串流。請將此視為串流篩選器的狹窄快速路徑，而不是一般信任清單。

<Warning>
請**不要**將直譯器或執行階段二進位檔（例如 `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）加入 `safeBins`。如果某個命令在設計上可以評估程式碼、執行子命令或讀取檔案，請優先使用明確的允許清單項目，並保持核准提示啟用。自訂安全 bin 必須在 `tools.exec.safeBinProfiles.<bin>` 中定義明確的設定檔。
</Warning>

預設安全 bin：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 和 `sort` 不在預設清單中。如果你選擇加入，請為其非 stdin 工作流程保留明確的允許清單項目。對於安全 bin 模式中的 `grep`，請使用 `-e`/`--regexp` 提供樣式；位置樣式形式會被拒絕，因此檔案運算元無法偽裝成具歧義的位置參數。

### Argv 驗證與拒絕的旗標

驗證完全由 argv 形狀決定（不檢查主機檔案系統是否存在），這可避免允許/拒絕差異造成檔案存在性預言機行為。預設安全 bin 會拒絕以檔案為導向的選項；長選項採用失敗即關閉的方式驗證（未知旗標與具歧義的縮寫會被拒絕）。

依安全 bin 設定檔列出的拒絕旗標：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全 bin 也會強制 argv Token 在執行時被視為**文字常值**（不進行 glob 展開，也不展開 `$VARS`）於僅 stdin 的片段中，因此像 `*` 或 `$HOME/...` 這類樣式無法用來夾帶檔案讀取。

### 受信任的二進位檔目錄

安全 bin 必須從受信任的二進位檔目錄解析（系統預設值加上選用的 `tools.exec.safeBinTrustedDirs`）。`PATH` 項目永遠不會自動受信任。預設受信任目錄刻意保持最小：`/bin`、`/usr/bin`。如果你的安全 bin 可執行檔位於套件管理器/使用者路徑（例如 `/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），請將它們明確加入 `tools.exec.safeBinTrustedDirs`。

### Shell 串接、包裝器與多工器

當每個頂層片段都符合允許清單（包含安全 bin 或 Skill 自動允許）時，允許 shell 串接（`&&`、`||`、`;`）。重新導向在允許清單模式中仍不支援。命令替換（`$()` / 反引號）會在允許清單解析期間被拒絕，包含在雙引號內；如果需要文字常值 `$()` 文字，請使用單引號。

在 macOS companion-app 核准中，包含 shell 控制或展開語法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 文字會被視為允許清單未命中，除非 shell 二進位檔本身已在允許清單中。

對於 shell 包裝器（`bash|sh|zsh ... -c/-lc`），請求範圍的 env 覆寫會縮減為一小份明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。

對於允許清單模式中的 `allow-always` 決策，已知的派發包裝器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）會保留內部可執行檔路徑，而不是包裝器路徑。Shell 多工器（`busybox`、`toybox`）會以相同方式針對 shell 小程式（`sh`、`ash` 等）展開。如果無法安全展開某個包裝器或多工器，就不會自動保留允許清單項目。

如果你將 `python3` 或 `node` 這類直譯器加入允許清單，請優先使用 `tools.exec.strictInlineEval=true`，讓內嵌 eval 仍需要明確核准。在嚴格模式中，`allow-always` 仍可保留良性的直譯器/指令碼呼叫，但內嵌 eval 載體不會自動保留。

### 安全 bin 與允許清單

| 主題             | `tools.exec.safeBins`                                  | 允許清單（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目標             | 自動允許狹窄的 stdin 篩選器                           | 明確信任特定可執行檔                                                               |
| 比對類型         | 可執行檔名稱 + 安全 bin argv 政策                     | 已解析的可執行檔路徑 glob，或透過 PATH 呼叫命令的裸命令名稱 glob                  |
| 引數範圍         | 由安全 bin 設定檔與文字常值 Token 規則限制            | 預設依路徑比對；選用的 `argPattern` 可限制已剖析的 argv                           |
| 典型範例         | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, 自訂 CLI                                        |
| 最佳用途         | 管線中的低風險文字轉換                                 | 任何具備更廣泛行為或副作用的工具                                                   |

設定位置：

- `safeBins` 來自設定（`tools.exec.safeBins` 或各代理的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 來自設定（`tools.exec.safeBinTrustedDirs` 或各代理的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 來自設定（`tools.exec.safeBinProfiles` 或各代理的 `agents.list[].tools.exec.safeBinProfiles`）。各代理的設定檔鍵會覆寫全域鍵。
- 允許清單項目位於主機本機的 `~/.openclaw/exec-approvals.json`，在 `agents.<id>.allowlist` 底下（或透過 Control UI / `openclaw approvals allowlist ...`）。
- 當直譯器/執行階段 bin 出現在 `safeBins` 中但沒有明確設定檔時，`openclaw security audit` 會以 `tools.exec.safe_bins_interpreter_unprofiled` 警告。
- `openclaw doctor --fix` 可將缺少的自訂 `safeBinProfiles.<bin>` 項目建立為 `{}`（之後請審閱並收緊）。直譯器/執行階段 bin 不會自動建立。

自訂設定檔範例：
__OC_I18N_900000__
如果你明確將 `jq` 選入 `safeBins`，OpenClaw 仍會在安全 bin
模式中拒絕 `env` 內建項，因此 `jq -n env` 不能在沒有明確允許清單路徑
或核准提示的情況下傾印主機程序環境。

## 直譯器/執行階段命令

由核准支援的直譯器/執行階段執行刻意保持保守：

- 一律繫結精確的 argv/cwd/env 情境。
- 直接 shell 指令碼與直接執行階段檔案形式會盡力繫結至一個具體本機檔案快照。
- 仍會解析到一個直接本機檔案的常見套件管理器包裝器形式（例如 `pnpm exec`、`pnpm node`、`npm exec`、`npx`）會在繫結前展開。
- 如果 OpenClaw 無法為某個直譯器/執行階段命令識別剛好一個具體本機檔案（例如套件指令碼、eval 形式、執行階段特定載入器鏈，或具歧義的多檔案形式），由核准支援的執行會被拒絕，而不是宣稱其涵蓋了實際上未涵蓋的語意。
- 對於這些工作流程，請優先使用沙箱、獨立的主機邊界，或明確受信任的允許清單/完整工作流程，由操作者接受更廣泛的執行階段語意。

當需要核准時，exec 工具會立即傳回核准 ID。使用該 ID 對應稍後的系統事件（`Exec finished` / `Exec denied`）。如果在逾時前沒有收到決策，該請求會被視為核准逾時，並以拒絕原因呈現。

### 後續投遞行為

在已核准的非同步 exec 完成後，OpenClaw 會將後續 `agent` 回合傳送到同一個工作階段。

- 如果存在有效的外部投遞目標（可投遞頻道加上目標 `to`），後續投遞會使用該頻道。
- 在沒有外部目標的純 webchat 或內部工作階段流程中，後續投遞會維持僅工作階段（`deliver: false`）。
- 如果呼叫者明確要求嚴格外部投遞，但沒有可解析的外部頻道，該請求會以 `INVALID_REQUEST` 失敗。
- 如果啟用 `bestEffortDeliver` 且無法解析外部頻道，投遞會降級為僅工作階段，而不是失敗。

## 將核准轉送至聊天頻道

你可以將 exec 核准提示轉送至任何聊天頻道（包含 Plugin 頻道），並用 `/approve` 核准它們。這會使用一般的對外投遞管線。

設定：
__OC_I18N_900001__
在聊天中回覆：
__OC_I18N_900002__
`/approve` 命令同時處理 exec 核准與 Plugin 核准。如果 ID 不符合任何待處理的 exec 核准，它會自動改為檢查 Plugin 核准。

### Plugin 核准轉送

Plugin 核准轉送使用與 exec 核准相同的投遞管線，但在 `approvals.plugin` 底下有自己獨立的設定。啟用或停用其中一者不會影響另一者。
__OC_I18N_900003__
設定形狀與 `approvals.exec` 相同：`enabled`、`mode`、`agentFilter`、`sessionFilter` 和 `targets` 的運作方式相同。

支援共用互動式回覆的頻道，會針對 exec 和 Plugin 核准顯示相同的核准按鈕。沒有共用互動式 UI 的頻道會退回成純文字，並附上 `/approve` 指示。

### 任何頻道上的同聊天核准

當 exec 或 Plugin 核准請求來自可投遞聊天介面時，預設現在同一個聊天可以用 `/approve` 核准它。這除了既有 Web UI 與終端機 UI 流程外，也適用於 Slack、Matrix 和 Microsoft Teams 等頻道。

這個共用文字命令路徑會使用該對話的一般頻道驗證模型。如果來源聊天已經可以傳送命令並接收回覆，核准請求就不再需要另外的原生投遞配接器，只為了保持待處理狀態。

Discord 和 Telegram 也支援同聊天 `/approve`，但即使停用原生核准投遞，這些頻道仍會使用其已解析的核准者清單進行授權。

對於 Telegram 和其他直接呼叫 Gateway 的原生核准用戶端，
此退回路徑刻意限制於「找不到核准」失敗。真正的
exec 核准拒絕/錯誤不會默默重試為 Plugin 核准。

### 原生核准投遞

某些頻道也可以作為原生核准用戶端。原生用戶端會在共用的同聊天 `/approve`
流程之上，加入核准者私訊、來源聊天扇出，以及頻道特定的互動式核准 UX。

當原生核准卡片/按鈕可用時，該原生 UI 是主要的
代理程式面向路徑。除非工具結果表示聊天核准無法使用，或
手動核准是唯一剩餘路徑，否則代理程式不應同時回覆重複的純聊天
`/approve` 命令。

如果已設定原生核准用戶端，但起始頻道沒有啟用原生執行階段，
OpenClaw 會保持本機確定性的 `/approve` 提示可見。如果原生執行階段已啟用並嘗試傳送，
但沒有任何目標收到卡片，OpenClaw 會傳送同一聊天備援通知，附上
確切的 `/approve <id> <decision>` 命令，讓請求仍可完成處理。

通用模型：

- 主機執行政策仍決定是否需要執行核准
- `approvals.exec` 控制是否將核准提示轉送到其他聊天目的地
- `channels.<channel>.execApprovals` 控制該頻道是否作為原生核准用戶端

當以下條件全部成立時，原生核准用戶端會自動啟用 DM 優先傳送：

- 該頻道支援原生核准傳送
- 可從明確的 `execApprovals.approvers` 或擁有者身分解析核准者，
  例如 `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`

設定 `enabled: false` 可明確停用原生核准用戶端。設定 `enabled: true` 可在
核准者可解析時強制啟用。公開起始聊天傳送仍透過
`channels.<channel>.execApprovals.target` 明確設定。

常見問題：[為什麼聊天核准有兩個執行核准設定？](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`

這些原生核准用戶端會在共用的同一聊天 `/approve` 流程和共用核准按鈕之上，
加入 DM 路由與選用的頻道多路傳送。

共用行為：

- Slack、Matrix、Microsoft Teams 與類似的可傳送聊天會使用一般頻道驗證模型
  進行同一聊天 `/approve`
- 當原生核准用戶端自動啟用時，預設原生傳送目標是核准者 DM
- 對 Discord 與 Telegram 而言，只有已解析的核准者可以核准或拒絕
- Discord 核准者可以明確指定（`execApprovals.approvers`），或從 `commands.ownerAllowFrom` 推斷
- Telegram 核准者可以明確指定（`execApprovals.approvers`），或從 `commands.ownerAllowFrom` 推斷
- Slack 核准者可以明確指定（`execApprovals.approvers`），或從 `commands.ownerAllowFrom` 推斷
- Slack 原生按鈕會保留核准 ID 類型，因此 `plugin:` ID 可以解析 Plugin 核准，
  而不需要第二層 Slack 本機備援
- Matrix 原生 DM/頻道路由與反應捷徑會同時處理執行與 Plugin 核准；
  Plugin 授權仍來自 `channels.matrix.dm.allowFrom`
- Matrix 原生提示會在第一個提示事件中包含 `com.openclaw.approval` 自訂事件內容，
  讓了解 OpenClaw 的 Matrix 用戶端能讀取結構化核准狀態，而一般用戶端
  仍保留純文字 `/approve` 備援
- 請求者不需要是核准者
- 當起始聊天已支援命令和回覆時，可以直接用 `/approve` 核准
- 原生 Discord 核准按鈕會依核准 ID 類型路由：`plugin:` ID 會
  直接送往 Plugin 核准，其餘則送往執行核准
- 原生 Telegram 核准按鈕會遵循與 `/approve` 相同的有限執行到 Plugin 備援
- 當原生 `target` 啟用起始聊天傳送時，核准提示會包含命令文字
- 待處理的執行核准預設會在 30 分鐘後到期
- 如果沒有操作者 UI 或已設定的核准用戶端可接受請求，提示會退回到 `askFallback`

敏感的僅限擁有者群組命令，例如 `/diagnostics` 和 `/export-trajectory`，會使用私人
擁有者路由來傳送核准提示與最終結果。OpenClaw 會先嘗試在
擁有者執行命令的同一介面上使用私人路由。如果該介面沒有私人擁有者路由，則會
退回到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，因此 Discord 群組命令
仍可在 Telegram 是已設定的主要私人介面時，將核准與結果傳送到擁有者的 Telegram DM。
群組聊天只會收到簡短確認。

Telegram 預設使用核准者 DM（`target: "dm"`）。當你希望
核准提示也出現在起始 Telegram 聊天/主題中時，可以切換為 `channel` 或 `both`。
對於 Telegram 論壇主題，OpenClaw 會為核准提示與核准後的後續訊息保留該主題。

請參閱：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC 流程
__OC_I18N_900004__
安全性注意事項：

- Unix socket 模式 `0600`，token 儲存在 `exec-approvals.json`。
- 相同 UID 對等檢查。
- 挑戰/回應（nonce + HMAC token + request hash）+ 短 TTL。

## 相關

- [執行核准](/zh-TW/tools/exec-approvals) — 核心政策與核准流程
- [執行工具](/zh-TW/tools/exec)
- [提升模式](/zh-TW/tools/elevated)
- [Skills](/zh-TW/tools/skills) — 由技能支援的自動允許行為
