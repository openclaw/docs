---
read_when:
    - 設定安全執行檔或自訂安全執行檔設定檔
    - 將核准請求轉送至 Slack、Discord、Telegram 或其他聊天頻道
    - 為頻道實作原生核准用戶端
summary: 進階 exec 核准：安全二進位檔、直譯器繫結、核准轉送、原生傳遞
title: 執行核准 — 進階
x-i18n:
    generated_at: "2026-07-19T14:09:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 628f695f2a005d537b11966bab7f6626aa87d473b1f1d5d72319a57aa7d9b24c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

進階執行核准主題：`safeBins` 快速路徑、直譯器／執行階段
繫結，以及將核准轉送至聊天頻道（包括原生傳遞）。
核心政策與核准流程請參閱[執行核准](/zh-TW/tools/exec-approvals)。

## 安全執行檔（僅限 stdin）

`tools.exec.safeBins` 指定**僅限 stdin** 的二進位執行檔（例如 `cut`），這些執行檔可在允許清單模式下執行，**無需**明確的允許清單項目。安全執行檔會拒絕
位置檔案引數與類似路徑的權杖，因此只能處理
傳入串流。請將其視為串流篩選器的狹義快速路徑，而非
一般信任清單。

<Warning>
請**勿**將直譯器或執行階段二進位執行檔（例如 `python3`、`node`、
`ruby`、`bash`、`sh`、`zsh`）新增至 `safeBins`。如果命令按設計即可評估程式碼、
執行子命令或讀取檔案，應優先使用明確的允許清單項目，
並保持啟用核准提示。自訂安全執行檔必須在
`tools.exec.safeBinProfiles.<bin>` 中定義明確的設定檔。
</Warning>

預設安全執行檔：

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`、`uniq`、`head`、`tail`、`tr`、`wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` 與 `sort` 不在預設清單中。如果選擇啟用，請為其非 stdin 工作流程保留明確的
允許清單項目。在安全執行檔模式下使用 `grep` 時，
請透過 `-e`/`--regexp` 提供模式；位置模式形式會遭拒絕，
因此無法將檔案運算元偽裝成語意不明的位置引數。

### Argv 驗證與禁止的旗標

驗證僅依 argv 的形式確定性執行（不檢查主機檔案系統中是否存在檔案），
可避免因允許／拒絕差異而形成檔案存在性預言機行為。
預設安全執行檔會禁止檔案導向選項；長選項採失敗關閉驗證（拒絕未知旗標與有歧義的縮寫）。
預設執行檔中已識別的唯讀布林旗標（例如
`wc -l`、`tr -d`、`uniq -c`）會被接受，而無法識別的短旗標仍會
失敗關閉，並轉交手動核准。

各安全執行檔設定檔禁止的旗標：

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`：`--dereference-recursive`、`--directories`、`--exclude-from`、`--file`、`--recursive`、`-R`、`-d`、`-f`、`-r`
- `jq`：`--argfile`、`--from-file`、`--library-path`、`--rawfile`、`--slurpfile`、`-L`、`-f`
- `sort`：`--compress-program`、`--files0-from`、`--output`、`--random-source`、`--temporary-directory`、`-T`、`-o`
- `tail`：`--follow`、`--retry`、`-F`、`-f`
- `wc`：`--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

安全執行檔也會強制在執行時將 argv 權杖視為**常值文字**
（對僅限 stdin 的區段不進行 glob 展開，也不進行 `$VARS` 展開），因此
無法使用 `*` 或 `$HOME/...` 等模式偽裝檔案讀取。`awk`、
`sed` 與 `jq` 一律不得作為安全執行檔，因為其語意無法
驗證為僅限 stdin：`jq` 可讀取環境資料，並從
模組或啟動檔案載入 jq 程式碼。請改為對這些工具使用明確的允許清單項目或核准提示，而不要使用
`safeBins`。

### 受信任的二進位執行檔目錄

安全執行檔必須從受信任的二進位執行檔目錄解析（系統預設目錄加上
選用的 `tools.exec.safeBinTrustedDirs`）。`PATH` 項目絕不會自動受信任。
為刻意縮小範圍，預設受信任目錄只有：`/bin`、`/usr/bin`。如果
你的安全執行檔位於套件管理員／使用者路徑中（例如
`/opt/homebrew/bin`、`/usr/local/bin`、`/opt/local/bin`、`/snap/bin`），請將其
明確新增至 `tools.exec.safeBinTrustedDirs`。

### Shell 鏈結、包裝器與多工器

如果每個頂層區段都符合允許清單（包括安全執行檔或 Skills 自動允許），
便允許 Shell 鏈結（`&&`、`||`、`;`）。
允許清單模式仍不支援重新導向。允許清單剖析期間會拒絕
命令替換（`$()`／反引號），包括雙引號內的命令替換；如果需要常值
`$()` 文字，請使用單引號。

在 macOS 輔助 App 核准中，包含 Shell 控制或
展開語法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 Shell 文字
會被視為未命中允許清單，除非 Shell 二進位執行檔本身已列入允許清單。

對於 Shell 包裝器（`bash|sh|zsh ... -c/-lc`），要求範圍內的環境覆寫
會縮減至一份小型明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、
`NO_COLOR`、`FORCE_COLOR`）。

在允許清單模式下做出 `allow-always` 決策時，透明分派包裝器
（例如 `env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保存
內部執行檔路徑，而非包裝器路徑。Shell 多工器
（`busybox`、`toybox`）會以相同方式為 Shell 小程式（`sh`、`ash` 等）
解除包裝。如果無法安全地解除包裝器或多工器，
就不會自動保存任何允許清單項目。

如果將 `python3` 或 `node` 等直譯器列入允許清單，建議使用
`tools.exec.strictInlineEval=true`，使行內求值仍須取得明確
核准。在嚴格模式下，`allow-always` 仍可保存無害的
直譯器／指令碼叫用，但不會自動保存行內求值載體。

### 安全執行檔與允許清單的比較

| 主題             | `tools.exec.safeBins`                                  | 允許清單（`exec-approvals.json`）                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 目標             | 自動允許範圍狹窄的 stdin 篩選器                       | 明確信任特定執行檔                                                                 |
| 比對類型         | 執行檔名稱 + 安全執行檔 argv 政策                     | 已解析的執行檔路徑 glob，或透過 PATH 叫用之命令的純命令名稱 glob                  |
| 引數範圍         | 受安全執行檔設定檔與常值權杖規則限制                  | 預設比對路徑；選用的 `argPattern` 可限制已剖析的 argv                       |
| 典型範例         | `head`、`tail`、`tr`、`wc`                             | `jq`、`python3`、`node`、`ffmpeg`、自訂命令列介面                                     |
| 最佳用途         | 流水線中的低風險文字轉換                              | 任何行為範圍更廣或具有副作用的工具                                                 |

設定位置：

- `safeBins` 來自設定（`tools.exec.safeBins` 或各代理程式的 `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` 來自設定（`tools.exec.safeBinTrustedDirs` 或各代理程式的 `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` 來自設定（`tools.exec.safeBinProfiles` 或各代理程式的 `agents.list[].tools.exec.safeBinProfiles`）。各代理程式設定檔索引鍵會覆寫全域索引鍵。
- 允許清單項目位於 `agents.<id>.allowlist` 下的主機本機核准檔案中（或透過控制介面／`openclaw approvals allowlist ...`）。
- 當直譯器／執行階段執行檔出現在 `safeBins` 中卻沒有明確設定檔時，`openclaw security audit` 會以 `tools.exec.safe_bins_interpreter_unprofiled` 發出警告。
- `openclaw doctor --fix` 可將缺少的自訂 `safeBinProfiles.<bin>` 項目建構為 `{}`（之後請審查並收緊設定）。直譯器／執行階段執行檔不會自動建構。

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

以核准為依據的直譯器／執行階段執行刻意採取保守策略：

- 一律繫結確切的 argv/cwd/env 情境。
- 直接 Shell 指令碼與直接執行階段檔案形式會盡力繫結至一個具體的本機
  檔案快照。
- 仍會解析至單一直接本機檔案的常見套件管理員包裝器形式（例如
  `pnpm exec`、`pnpm node`、`npm exec`、`npx`），會在繫結前解除包裝。
- 如果 OpenClaw 無法為直譯器／執行階段命令識別出唯一一個具體的本機檔案
  （例如套件指令碼、求值形式、執行階段特定的載入器鏈，或語意不明的多檔案
  形式），則會拒絕以核准為依據的執行，而不會宣稱涵蓋其實無法涵蓋的語意。
- 對於這些工作流程，應優先使用沙箱、獨立的主機邊界，或明確受信任的
  允許清單／完整工作流程，由操作者接受較廣泛的執行階段語意。

需要核准時，exec 工具會立即傳回核准 ID。請使用該 ID
關聯後續已核准執行的系統事件（`Exec finished`，以及設定後的 `Exec running`）。
如果逾時前未收到決策，要求會被視為核准逾時，
並顯示為終止性的主機命令拒絕。對於具有來源工作階段的主代理程式非同步核准，
OpenClaw 也會透過內部後續訊息恢復該工作階段，讓代理程式得知
命令並未執行，而不會之後才嘗試修復缺少的結果。待處理的 exec 核准
預設會在 30 分鐘後到期。

### 後續傳遞行為

已核准的非同步 exec 完成後，OpenClaw 會將後續 `agent` 輪次傳送至同一工作階段。
遭拒絕的非同步核准會對拒絕狀態使用相同的主工作階段後續路徑，但不會
登記提升權限的執行階段交接，也不會執行命令。若拒絕時沒有可恢復的
主工作階段，則會抑制通知，或在存在安全的直接路徑時透過該路徑回報。

- 如果存在有效的外部傳遞目標（可傳遞的頻道加上目標 `to`），後續傳遞會使用該頻道。
- 在僅限網頁聊天或沒有外部目標的內部工作階段流程中，後續傳遞僅保留於工作階段內（`deliver: false`）。
- 如果呼叫者明確要求嚴格外部傳遞，但無法解析外部頻道，要求會以 `INVALID_REQUEST` 失敗。
- 如果已啟用 `bestEffortDeliver` 且無法解析外部頻道，傳遞會降級為僅限工作階段，而非失敗。

## 第三方用戶端的最小權限範圍

閘道核准解析受專用的 `operator.approvals` 權限範圍保護。這同時適用於擁有者特定的 `exec.approval.resolve` 方法與不區分類型的 `approval.resolve` 方法；`operator.write` 並不涵蓋此權限。儀表板與整合應只要求其所用方法需要的權限範圍。請將核准解析存取權視為等同遠端執行等級的權限，並審慎授予 `operator.approvals`，即使用戶端只顯示小型核准介面亦然。

## 將核准轉送至聊天頻道

你可以將 exec 核准提示轉送至任何聊天頻道（包括外掛頻道），並使用 `/approve` 核准
這些提示。此功能使用一般的對外傳遞流水線。

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

`/approve` 命令可同時處理 exec 核准與外掛核准。如果 ID 與待處理的 exec 核准不符，系統會自動改為檢查外掛核准。此備援僅限於「找不到核准」失敗；真正的 exec 核准拒絕或錯誤不會在未提示的情況下重試為外掛核准。

### 外掛核准轉送

外掛核准轉送使用與 exec 核准相同的傳遞流水線，但在 `approvals.plugin` 下有自己
獨立的設定。啟用或停用其中一項不會影響另一項。
如需外掛開發行為、請求欄位與決策語意，請參閱
[外掛權限請求](/plugins/plugin-permission-requests)。

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

設定結構與 `approvals.exec` 完全相同：`enabled`、`mode`、`agentFilter`、
`sessionFilter` 與 `targets` 的運作方式皆相同。

支援共用互動式回覆的頻道會為 exec 與外掛核准呈現相同的核准按鈕。沒有共用互動式 UI 的頻道會退回純文字及 `/approve`
操作說明。外掛核准請求可能限制可用決策：核准介面會使用請求所宣告的決策集合，而閘道會拒絕提交未提供之決策的嘗試。

### 任何頻道中的同一聊天核准

當 exec 或外掛核准請求源自可傳遞訊息的聊天介面時，預設可在同一聊天中使用 `/approve` 核准。除了現有的 Web UI 與終端 UI 流程外，這也適用於 Slack、Matrix、Microsoft Teams 及
類似的可傳遞訊息聊天，並使用該對話的一般頻道驗證模型。如果來源聊天已能傳送命令
並接收回覆，核准請求便不再只為維持待處理狀態而需要獨立的原生傳遞介面卡。

Discord、Telegram 與 QQ Bot 也支援同一聊天中的 `/approve`，但即使停用原生核准傳遞，這些頻道仍會使用其
已解析的核准者清單進行授權。

### 原生核准傳遞

部分頻道也可作為原生核准用戶端：Discord、Slack、Telegram、Matrix 與 QQ Bot。
除了共用的同一聊天 `/approve` 流程外，原生用戶端還會加入核准者私訊、來源聊天多點傳送，以及頻道專屬的互動式核准使用者體驗。

當原生核准卡片或按鈕可用時，該原生 UI 是面向代理程式的主要路徑。
除非工具結果顯示無法使用聊天核准，或手動核准是唯一剩餘路徑，否則代理程式不應再重複顯示純聊天 `/approve` 命令。

若已設定原生核准用戶端，但來源頻道沒有作用中的原生執行階段，OpenClaw 會保持顯示本機確定性的 `/approve` 提示。若原生執行階段
處於作用中並嘗試傳遞，但沒有任何目標收到卡片，OpenClaw 會傳送同一聊天的備援
通知，其中包含完整的 `/approve <id> <decision>` 命令，讓請求仍可獲得處理。

通用模型：

- 主機 exec 原則仍決定是否需要 exec 核准
- `approvals.exec` 控制將核准提示轉送至其他聊天目的地
- `channels.<channel>.execApprovals` 控制是否啟用 Discord、Slack、Telegram、QQ Bot 及類似
  頻道專屬的原生用戶端
- 當請求來自 Slack 且可解析 Slack 外掛核准者時，Slack 外掛核准可使用 Slack 的原生核准用戶端；
  即使停用 Slack exec 核准，`approvals.plugin` 也可將外掛核准路由至 Slack
  工作階段或目標
- 當可從 `dm.allowFrom` 或
  `defaultTo` 解析出穩定的 `users/<id>` 核准者時，Google Chat 原生核准卡片會處理源自 Google
  Chat 空間或討論串的 exec 與外掛核准；它們不會使用表情回應事件進行決策
- WhatsApp 與 Signal 的表情回應核准傳遞受 `approvals.exec` 與
  `approvals.plugin` 控制；它們沒有 `channels.<channel>.execApprovals` 區塊

符合以下所有條件時，原生核准用戶端會自動啟用以私訊優先的傳遞：

- 頻道支援原生核准傳遞
- 可從明確的 `execApprovals.approvers` 或擁有者
  身分（例如 `commands.ownerAllowFrom`）解析核准者
- `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`

設定 `enabled: false` 可明確停用原生核准用戶端。設定 `enabled: true` 可在解析出核准者時強制
啟用。公開的來源聊天傳遞仍須透過
`channels.<channel>.execApprovals.target` 明確設定。當原生 `target` 啟用來源聊天傳遞時，
核准提示會包含命令文字。

常見問題：[為什麼聊天核准有兩個 exec 核准設定？](/help/faq-first-run)

- Discord：`channels.discord.execApprovals.*`
- Slack：`channels.slack.execApprovals.*`
- Telegram：`channels.telegram.execApprovals.*`
- QQ Bot：`channels.qqbot.execApprovals.*`
- Google Chat：使用 `channels.googlechat.dm.allowFrom` 或
  `channels.googlechat.defaultTo` 設定穩定的核准者；不需要 `execApprovals` 區塊
- WhatsApp：使用 `approvals.exec` 與 `approvals.plugin` 將核准提示路由至 WhatsApp
- Signal：使用 `approvals.exec` 與 `approvals.plugin` 將核准提示路由至 Signal

原生用戶端專屬路由：

- Telegram 預設傳送至核准者私訊（`target: "dm"`）。切換為 `channel` 或 `both`，即可同時在
  來源 Telegram 聊天或主題中顯示核准提示。對於 Telegram 論壇主題，OpenClaw
  會為核准提示及核准後的後續訊息保留該主題。
- Discord 與 Telegram 核准者可明確指定（`execApprovals.approvers`），或從
  `commands.ownerAllowFrom` 推斷；只有已解析的核准者可以核准或拒絕。
- Slack 核准者可明確指定（`execApprovals.approvers`），或從
  `commands.ownerAllowFrom` 推斷。Slack 外掛核准私訊使用 `allowFrom` 中的 Slack 外掛核准者
  與帳號預設路由，而非 Slack exec 核准者。Slack 原生按鈕會保留核准 ID
  種類，因此 `plugin:` ID 可處理外掛核准，無須第二層 Slack 本機備援。
- Google Chat 原生卡片會在訊息文字中保留手動 `/approve` 備援，但卡片按鈕
  回呼僅攜帶不透明的動作權杖；核准 ID 與決策會從
  伺服器端的待處理狀態復原。
- 當相符的頂層
  轉送系列路由至 WhatsApp 時，WhatsApp 表情符號核准可處理 exec 與外掛提示。原生來源提示會直接繫結；共用目標模式
  傳遞則會將相同的型別化核准中繼資料繫結至已接受的 WhatsApp 訊息收據。
- 只有當相符的頂層
  轉送系列已啟用並路由至 Signal 時，Signal 表情回應核准才會處理 exec 與外掛提示。直接的同一聊天 Signal exec 核准可在
  沒有明確核准者的情況下隱藏本機 `/approve` 備援；Signal 表情回應處理
  仍需要來自 `channels.signal.allowFrom` 或 `defaultTo` 的明確 Signal 核准者。
- Matrix 原生私訊／頻道路由與表情回應捷徑可處理 exec 與外掛核准；
  外掛授權仍來自 `channels.matrix.dm.allowFrom`。Matrix 原生提示
  會在第一個提示事件中包含 `com.openclaw.approval` 自訂事件內容，讓支援 OpenClaw 的
  Matrix 用戶端可讀取結構化核准狀態，而一般用戶端則保留純文字
  `/approve` 備援。
- 原生 Discord 與 Telegram 核准按鈕會在
  傳輸私有回呼資料中攜帶明確的 exec 或外掛擁有者種類，且僅處理該擁有者。缺少
  種類的舊版 `/approve` 控制項仍是受限的相容性路徑：它們只會嘗試執行者可核准的擁有者種類，
  僅在找不到核准結果後繼續，且絕不從核准 ID 推斷擁有權。
- 請求者不需要是核准者。
- 如果沒有任何操作員 UI 或已設定的核准用戶端可接受請求，提示會退回
  `askFallback`。

敏感且僅限擁有者的群組命令（例如 `/diagnostics` 與 `/export-trajectory`）會對核准提示與最終結果使用私人
擁有者路由。OpenClaw 會先在擁有者執行命令的同一介面上嘗試私人路由。如果該介面沒有私人擁有者路由，則會
退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，因此 Discord 群組命令
仍可在 Telegram 是已設定的主要私人介面時，將核准與結果傳送至擁有者的 Telegram 私訊。群組聊天只會收到簡短的確認訊息。

另請參閱：

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ Bot](/channels/qqbot)

### 官方行動版操作員應用程式

當使用 `operator.admin` 連線，或請求明確指定其配對的
`operator.approvals` 裝置時，官方 iOS 與 Android 應用程式也能審查由閘道擁有的待處理 exec
核准。它們會讀取
Control UI 所使用的同一筆經過清理且具持久性的記錄、提交可辨識種類的決策，並顯示閘道的標準
首個回覆結果。Apple Watch 會透過
配對的 iPhone 鏡像顯示這些核准提示，並提供單次允許與拒絕動作。直接 Watch 閘道模式
不會審查核准。

遺失處理確認不會使已提交的選擇成為權威結果：
應用程式會停用控制項並再次讀取記錄。如果另一個介面搶先完成，
應用程式會顯示該筆已記錄的決策。待處理提示仍與發出它們的
閘道繫結，因此切換作用中的閘道無法重新導向舊的
核准 ID。

### macOS IPC 流程

```
閘道 -> 節點服務（WS）
                 |  IPC（UDS + 權杖 + HMAC + TTL）
                 v
             Mac 應用程式（UI + 核准 + system.run）
```

安全性注意事項：

- Unix 通訊端模式 `0600`，權杖儲存於 `exec-approvals.json`。
- 相同 UID 對等端檢查。
- 挑戰／回應（nonce + HMAC 權杖 + 請求雜湊）+ 短 TTL。

## 常見問題

### 何時會在核准目標上使用 `accountId` 與 `threadId`？

當頻道設定了多個身分，且核准提示必須透過特定帳號送出時，請使用 `accountId`。當目的地支援主題或
討論串，且提示應保留在該討論串內而非頂層聊天中時，請使用 `threadId`。

具體的 Telegram 案例是具有論壇主題及兩個 Telegram 機器人
帳號的營運超級群組。`to` 值指定該超級群組，`accountId` 選取機器人帳號，而 `threadId`
選取論壇主題：

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

採用上述設定後，轉送的執行核准會由 `ops-bot` Telegram 帳號發佈至聊天 `-1001234567890` 的主題
`77`。未設定 `accountId` 的目標會使用該頻道的預設帳號，而未設定
`threadId` 的目標則會發佈至頂層目的地。

### 將核准傳送至工作階段時，該工作階段中的任何人都能核准嗎？

不能。工作階段傳遞只控制提示出現的位置，本身並不會授權該聊天中的每位
參與者進行核准。

對於一般的同聊天 `/approve`，傳送者必須已獲授權在該
頻道工作階段中執行命令。如果頻道提供明確的核准者，這些核准者即使在該工作階段中沒有其他命令授權，
仍可授權 `/approve` 動作。

某些頻道更為嚴格。Discord、Telegram、Matrix、Slack 原生核准私訊及類似的
原生核准用戶端會使用其解析出的核准者清單來授權核准。例如，
Telegram 論壇主題中的核准提示可能對主題內的所有人可見，但只有從 `channels.telegram.execApprovals.approvers` 或
`commands.ownerAllowFrom` 解析出的數字 Telegram 使用者 ID 才能核准或拒絕。

## 相關內容

- [執行核准](/zh-TW/tools/exec-approvals) — 核心政策與核准流程
- [執行工具](/zh-TW/tools/exec)
- [提升權限模式](/zh-TW/tools/elevated)
- [Skills](/zh-TW/tools/skills) — 由 Skill 支援的自動允許行為
