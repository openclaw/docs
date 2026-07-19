---
read_when:
    - 你已完成推論設定，並希望 OpenClaw 設定其餘項目
    - 你需要使用本機設定代理程式檢查或修復 OpenClaw
    - 你正在設計或啟用訊息頻道救援模式
summary: 推論支援的 OpenClaw 設定與修復輔助工具之命令列介面參考與安全模型
title: OpenClaw 設定代理程式
x-i18n:
    generated_at: "2026-07-19T13:38:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 32643eb24cd010c1018908f78d901ebdcac9ef13f7c639e48a5ba7be5913a1d5
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw 內建一個系統代理程式（它以「OpenClaw」的身分發言），用於本機設定、修復與配置（舊稱 Crestodian）。只有在實際生效的預設模型完成一次真實對話回合後，它才會啟動。
全新安裝會先建立推論功能；格式錯誤的配置仍會採用傳統 doctor 流程。

## 啟動時機

執行不含子命令的 `openclaw` 時，會根據配置狀態決定流程：

- 配置不存在，或雖存在但沒有使用者編寫的設定（空白，或僅含 `$schema`/`meta` 鍵）：啟動含即時 AI 驗證的引導式上線設定。
- 配置存在但未通過驗證：啟動傳統上線設定，回報問題並引導你使用 `openclaw doctor`。
- 配置存在且有效：開啟一般代理程式終端介面。若已配置且可連線的閘道，其預設代理程式具有模型，則會直接進入該介面，
  不經過上線設定或 OpenClaw。若之後要進入 OpenClaw，請在終端介面內使用 `/openclaw`，或直接執行
  `openclaw setup`。

執行 `openclaw setup` 時，會先即時測試已配置的預設模型。若對話回合通過，便會啟動 OpenClaw。互動模式下若失敗，會開啟引導式推論設定，並在候選項通過後轉交給 OpenClaw。若推論無法使用，單次、JSON 與其他非互動式請求會失敗，並指示執行 `openclaw onboard`。`openclaw --help` 與 `openclaw --version` 仍採用原有的快速路徑。

非互動式執行不含其他參數的 `openclaw`（無 TTY）時，會以簡短訊息結束，而非印出根命令說明：若是全新或無效的安裝，訊息會引導至非互動式上線設定；若配置有效，則會引導至 `openclaw agent --local ...`。

`openclaw onboard --modern` 仍是 OpenClaw 的相容性別名，但會使用相同的推論閘門：推論正常時開啟聊天；互動模式失敗時啟動引導式推論設定；非互動模式失敗時則結束並提供上線設定指引。`openclaw onboard --classic` 會開啟完整的逐步精靈。

## OpenClaw 顯示的內容

互動式 OpenClaw 會開啟與 `openclaw tui` 相同的終端介面殼層，並使用 OpenClaw 聊天後端。啟動問候訊息包含：

- 配置有效性與預設代理程式
- OpenClaw 正在使用且已通過驗證的模型
- 第一次啟動探測所確認的閘道可連線性
- 下一個建議的偵錯動作

它不會傾印機密，也不會為了啟動而載入外掛命令列介面命令。

使用 `status` 可查看詳細清單：配置路徑、文件／原始碼路徑、本機命令列介面探測、金鑰／權杖是否存在、代理程式、模型與閘道詳細資訊。

OpenClaw 使用與一般代理程式相同的參考資料探索機制：在 Git checkout 中，它會指向本機 `docs/` 與原始碼樹；在 npm 安裝中，它會使用隨附文件並連結至 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同時建議在文件不足時查閱原始碼。

## 範例

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "模型"
openclaw setup --message "驗證配置"
openclaw setup --message "設定工作區 ~/Projects/work" --yes
openclaw setup --message "將預設模型設為 openai/gpt-5.6" --yes
openclaw onboard --modern
```

在 OpenClaw 終端介面內：

```text
狀態
健康狀態
doctor
驗證配置
設定
設定工作區 ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
閘道狀態
重新啟動閘道
代理程式
建立代理程式 work 工作區 ~/Projects/work
模型
配置模型供應商
將預設模型設為 openai/gpt-5.6
頻道
頻道資訊 slack
連線 slack
開啟 slack 的頻道精靈
外掛清單
搜尋 slack 外掛
plugin install clawhub:openclaw-codex-app-server
與 work 代理程式交談
與 ~/Projects/work 的代理程式交談
稽核
結束
```

## 操作與核准

OpenClaw 使用具型別的操作，而非臨時直接編輯配置。

唯讀操作會立即執行：顯示概覽、列出代理程式、列出已安裝的外掛、搜尋 ClawHub 外掛、顯示模型／後端狀態、執行狀態／健康狀態檢查、檢查閘道可連線性、執行不含互動式修正的 doctor、驗證配置，以及顯示稽核日誌路徑。

啟動引導式頻道設定（`connect telegram`）也會立即執行。其精靈會收集明確答案，並負責由此產生的寫入。

持久性操作需要透過對話核准（直接命令則可使用 `--yes`）：寫入配置、`config set`、`config set-ref`、設定／上線設定的啟始程序、變更預設模型、啟動／停止／重新啟動閘道、建立代理程式，以及安裝外掛。

OpenClaw 內無法使用 doctor 修復，因為它們可能會改寫支撐目前工作階段的供應商、驗證或預設代理程式推論路由。請結束 OpenClaw，並在終端機中執行 `openclaw doctor --fix`。唯讀的 `doctor` 在 OpenClaw 內仍可使用。

新代理程式會繼承已通過即時驗證的預設推論路由。代理程式 ID `openclaw` 與 `crestodian` 保留供系統代理程式使用，無法建立為一般代理程式。已停用的 ID 仍會被封鎖，以免舊配置占用它。

`config set` 與 `config set-ref` 可以變更使用者可變更的任何設定，
但有一份簡短且僅供人員使用的拒絕清單：`$include`、`auth.*`、`env.*`、`models.*`
與 `secrets.*` 仍會被拒絕，因為它們包含認證資訊材料、
替代配置引入項目，或供推論路由使用的供應商／目錄定義。
推論路由本身也受到保護：預設模型路由
（`agents.defaults` 的模型／參數／執行階段欄位）及支援目前有效預設路由之代理程式的路由欄位
會被拒絕；代理程式身分／拓撲欄位（`id`、`agentDir`、`default`）亦同。其他代理程式的路由欄位
仍可在核准後寫入。閘道與頻道驗證仍屬於一般配置介面。
若要使用已配置的路由，請使用 `set default model <provider/model>`；
它會在儲存前即時測試該路由。若要配置或修復供應商／驗證存取權，請結束 OpenClaw 並執行
`openclaw onboard`。

`plugins.entries.<id>.*` 寫入（啟用／停用／配置已安裝的外掛）
皆受允許，除非該外掛支援目前有效的推論路由。外掛安裝來源與載入政策
會在具型別的外掛安裝工作流程中維持其信任邊界。
基於相同原因，系統也會拒絕解除安裝支援該路由的外掛；請結束 OpenClaw，並從終端機執行
`openclaw plugins uninstall <id>`。

你可以用自己的話給予核准：語意明確的回覆（「是」、「當然」、「繼續」、「現在不要」）會依封閉且具確定性的清單進行判定。當配置的路由支援獨立的完成呼叫時，其他回覆可以僅根據你的訊息與待處理的提案分類，而絕不交由對話模型本身判定，因為模型不能自行核准。無法分類或語意模糊的回覆會讓提案維持待處理狀態，對話也會再次詢問。

### 變更記錄

「詢問 OpenClaw」頁面可以顯示最近套用的系統代理程式操作、Doctor
遷移、設定與命令列介面配置寫入，以及對
`openclaw.json` 的手動編輯。當閘道正在監看、OpenClaw 正在執行其擁有的寫入，
或離線編輯後的下次啟動時，配置日誌會偵測外部編輯。

記錄儲存在共用
`~/.openclaw/state/openclaw.sqlite` 資料庫的 `diagnostic_events` 資料表中，位於 `system-agent-audit`
與 `config-audit` 範圍之下。每個範圍會保留最新的 50,000 筆記錄。
探索與唯讀操作不包含在內。機密絕不會出現在變更記錄中；
配置日誌記錄的是變更路徑，而非配置值，且值的比較會使用受保護的指紋。

頻道設定可以透過託管對話執行，直到需要輸入機密為止。本機 OpenClaw 終端介面
不接受敏感的精靈答案，因為終端機聊天輸入內容可見。它會立即提供 `open channel wizard`，
將所選頻道帶入具有遮罩的終端機精靈；你也可以稍後執行
`openclaw channels add --channel <channel>`。

### 切換至遮罩式頻道設定

本機聊天可以將控制權交給遮罩式頻道精靈：

```text
開啟 slack 的頻道精靈
頻道資訊 slack
```

`open channel wizard for <channel>` 會在聊天終端介面關閉後開啟遮罩式頻道設定。
請先使用 `channel info <channel>` 查看頻道標籤、設定狀態、必要條件摘要與文件連結。

OpenClaw 絕不會從自己的工作階段內變更供應商／驗證存取權，因為該工作階段已依賴該推論路由。對於模型供應商設定或修復，`configure model provider` 只會傳回結束／上線設定指引，不會啟動精靈或寫入配置。請結束 OpenClaw 並執行 `openclaw
onboard`；上線設定會暫存認證資訊，且僅儲存能完成一次真實即時對話回合的路由。上線設定成功後，請再次啟動 OpenClaw。

## 設定啟始程序

在引導式上線設定已建立推論功能後，`setup` 會配置其餘的工作區與閘道狀態。它僅透過具型別的配置操作寫入，並會先要求核准。

```text
設定
設定工作區 ~/Projects/work
```

`setup` 會保留已驗證且實際生效的模型。它不會配置或
取代推論功能。

若缺少推論功能或即時檢查失敗，請離開 OpenClaw 並執行 `openclaw onboard`。引導式上線設定會偵測已配置的模型、API 金鑰與已驗證的本機命令列介面，要求每個候選項產生真實回覆，並且僅保存通過的路由。跨越此界線後，OpenClaw 會立即啟動，接著便可配置工作區、閘道、頻道、代理程式、外掛與其他選用功能。

當 macOS 應用程式連線至已配置的閘道，且其預設代理程式已有配置完成的模型時，會完全略過這一系列步驟，直接開啟一般代理程式介面。
若閘道是全新或尚未完整配置，應用程式會透過
`openclaw.setup.detect` 與 `openclaw.setup.activate` 閘道方法執行推論設定流程：
detect 會列出找到的每個候選後端；activate 會即時測試一個候選項
（真實執行一次「回覆 OK」的完成要求），且只有在測試通過後，才會保存該路由所需的模型、
認證資訊與供應商／執行階段狀態。工作區與閘道預設值仍交由 OpenClaw 處理。失敗的候選項
絕不會變更配置；應用程式會自動依序嘗試其他候選項，最後提供手動金鑰／權杖步驟，
其內容會根據閘道目前啟用的文字推論供應商外掛填入。所選供應商負責提供其起始模型
與配置，而認證資訊也會以相同方式驗證後才儲存。

Codex 監督及其他選用外掛功能不包含在這項推論啟用交易中。請僅在推論正常運作且 OpenClaw 已啟動後配置它們；現有外掛政策與明確的監督退出設定在推論設定期間不會受到變更。

## AI 對話

互動式 OpenClaw 的自由形式對話會透過與一般 OpenClaw 代理程式相同的代理程式迴圈執行，且僅限使用一個零環 OpenClaw 權限工具 `openclaw`，由它包裝具型別的操作。讀取動作可自由執行；異動則需要你針對該項確切操作透過對話核准（請參閱「操作與核准」）；每次套用的寫入都會接受稽核與重新驗證。代理程式工作階段會持續保留，因此 OpenClaw 具有真正的多輪記憶。若已驗證的推論路由之後停止運作，請回到 `openclaw onboard` 修復後再繼續。

主機不會將自然語言請求剖析為操作。自由形式訊息（包括看似命令的文字，以及「我的閘道為什麼停止了？」之類的問題）會傳送至 AI，再由 AI 透過 `openclaw` 工具將請求對應至具型別的操作。

當變更操作待處理時，只有封閉清單中語意明確的核准或拒絕詞句，才會在不推論的情況下解析。語意不明確的同意會交由另一個已設定的補全呼叫處理，否則採取封閉式失敗。結構化精靈欄位與精確的主機導覽屬於 UI 控制項，而不是自然語言操作解析。其中有一項機密衛生例外尤其重要：敏感路徑（權杖、金鑰、密碼）上的精確 `config set` 絕不會送達模型。主機會建立已遮蔽的提案，且該值會在 AI 可見的歷史記錄中遮罩。機密請優先使用 `config set-ref <path> env <ENV_VAR>`。

訊息頻道救援模式絕不使用模型輔助規劃器。遠端救援維持確定性，因此已損壞或遭入侵的一般代理路徑無法被用作設定編輯器。

### 命令列介面工具框架信任模型

嵌入式執行階段與 Codex app-server 工具框架會直接強制執行零環限制：執行時會攜帶 OpenClaw 工具允許清單，其中只有 `openclaw` 工具。對 Codex 而言，OpenClaw 也會停用該次執行的環境、原生執行、多代理、目標、應用程式／外掛、skill／MCP、網路搜尋及 `request_user_input` 介面。Codex 仍會注入其無作用的原生 `update_plan` 公用工具；它可以更新模型的暫時檢查清單，但無法寫入檔案或 OpenClaw 設定。命令列介面工具框架不會使用 OpenClaw 的允許清單，因此 OpenClaw 只允許自身工具選擇合約能證明相同限制的後端：

- 可選後端（包括 Claude Code）啟動時會使用空的原生工具選擇，以及一個 MCP 工具 `openclaw`。Claude 產生的 MCP 設定會透過 `--strict-mcp-config` 套用，因此不會載入其他 MCP 伺服器。
- 宣告沒有原生工具的後端會收到相同的專用 OpenClaw MCP 伺服器。
- 一律啟用或原生工具狀態未知的後端會在推論前採取封閉式失敗；它們無法承載 OpenClaw 工作階段。

只有 OpenClaw 工作階段會取得 openclaw MCP 伺服器；一般代理執行永遠看不到此工具。因此，可選／無原生工具的命令列介面後端與 API 金鑰模型會強制執行字面上的單工具迴圈。Codex app-server 模型會強制限定為單一 OpenClaw 權限工具，加上無作用的原生規劃公用工具。在這三種情況下，設定寫入都會限制在 OpenClaw 經稽核的核准合約內。

Gemini CLI 仍可供一般代理使用，但它無法強制執行推論閘門所需的無工具探測，因此無法承載 OpenClaw。

## 切換至代理

使用自然語言選擇器離開 OpenClaw 並開啟一般終端介面：

```text
與代理交談
與工作代理交談
切換至主要代理
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 會直接開啟一般代理終端介面；它們不會啟動 OpenClaw。切換至一般終端介面後，`/openclaw` 會返回 OpenClaw，並可選擇附帶後續要求：

```text
/openclaw
/openclaw 重新啟動閘道
```

## 訊息救援模式

訊息救援模式是 OpenClaw 的訊息頻道進入點：當一般代理已停止運作，但受信任的頻道（例如 WhatsApp）仍可接收命令時使用。

這是確定性的緊急命令處理常式，而不是對話式 OpenClaw 代理。它不會啟動全新的設定，也不會放寬 OpenClaw 聊天的推論閘門。

支援的命令：`/openclaw <request>`。救援只接受精確輸入的命令文法——自然語言會遭拒絕並附帶提示，絕不會被猜測成操作，也絕不會諮詢模型。

```text
你，在受信任的擁有者私訊中：/openclaw status
OpenClaw：OpenClaw 救援模式。閘道可連線：否。設定有效：否。
你：/openclaw restart gateway
OpenClaw：計畫：重新啟動閘道。回覆 /openclaw yes 以套用。
你：/openclaw yes
OpenClaw：已套用。已寫入稽核項目。
```

也可以在本機或透過救援將代理建立作業排入佇列：

```text
建立代理 work 工作區 ~/Projects/work 模型 openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

建立代理時只能指定目前已即時驗證的預設模型。省略模型即可繼承該路由。

遠端救援是管理介面，必須視同遠端設定修復，而不是一般聊天。

遠端救援的安全性合約：

- 當代理／工作階段啟用沙箱時停用；OpenClaw 會拒絕遠端救援，並指向本機命令列介面修復。
- 預設有效狀態為 `auto`：只有在受信任的 YOLO 操作中才允許遠端救援，此時執行階段已具備不受沙箱限制的本機權限（`tools.exec.security` 解析為 `full`，且 `tools.exec.ask` 解析為 `off`，沙箱模式為 `off`）。
- 需要明確的擁有者身分；不允許萬用字元傳送者規則、開放群組原則、未經驗證的網路鉤子或匿名頻道。
- 預設僅限擁有者私訊；群組／頻道救援需要明確選擇啟用。
- 外掛搜尋與列出功能皆為唯讀。外掛安裝一律只能在本機進行（即使原本已啟用，救援模式仍會封鎖），因為它會下載可執行程式碼。本機 OpenClaw 與救援模式都會拒絕解除安裝外掛；請從終端機執行 `openclaw plugins uninstall <id>`。
- 遠端救援無法開啟本機終端介面，也無法切換至互動式代理工作階段；代理交接請使用本機 `openclaw`。
- 即使在救援模式下，持久性寫入仍需核准。
- 待處理的核准僅能使用一次。相同帳號、頻道及傳送者的任何較新救援命令都會撤銷較舊的計畫；執行失敗也會耗用核准，因此若要重試，請重新傳送命令。
- 每項已套用的救援操作都會接受稽核。訊息頻道救援會記錄頻道、帳號、傳送者及來源位址中繼資料；會變更設定的操作也會記錄變更前後的設定雜湊。
- 絕不回顯機密。SecretRef 檢查只會回報可用性，不會回報值。
- 如果閘道仍在運作，救援會優先使用閘道的型別化操作；如果閘道已停止運作，救援只會使用不依賴一般代理迴圈的最小本機修復介面。

設定結構：

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`：`"auto"`（預設）僅在有效執行階段為 YOLO 且沙箱關閉時允許救援；`false` 絕不允許訊息頻道救援；`true` 會在擁有者／頻道檢查通過時明確允許救援（仍受沙箱拒絕條件限制）。
- `ownerDmOnly`：將救援限制於擁有者直接訊息。預設為 `true`。
- `pendingTtlMinutes`：待處理的救援寫入在到期前，保持開放以等待 `/openclaw yes` 核准的時間。預設為 `15`。

`openclaw doctor --fix` 會將舊版 `crestodian` 設定區塊遷移至
`systemAgent`。執行階段只會讀取標準區塊。

遠端救援由 Docker 測試通道涵蓋：

```bash
pnpm test:docker:system-agent-rescue
```

選擇啟用的即時頻道命令介面煙霧測試會檢查 `/openclaw status`，以及透過救援處理常式完成一次持久性核准來回流程：

```bash
pnpm test:live:system-agent-rescue-channel
```

受推論閘門控管的封裝式單次設定由以下項目涵蓋：

```bash
pnpm test:docker:system-agent-first-run
```

該封裝命令列介面測試通道會從空白狀態目錄開始，並證明 OpenClaw 在無法推論時會採取封閉式失敗。接著，它會透過封裝的啟用模組測試並啟用假的 Claude。只有在此之後，模糊要求才會送達規劃器並解析為型別化設定，隨後執行單次命令以建立額外代理、透過啟用外掛加上權杖 SecretRef 來設定 Discord、驗證設定，並檢查稽核記錄。此測試通道提供閘門／操作佐證；它不會測試互動式上線引導，或 OpenClaw 代理／工具／核准對話。下方的 QA Lab 情境會重新導向至相同的 Docker 測試通道：

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [Doctor](/zh-TW/cli/doctor)
- [終端介面](/zh-TW/cli/tui)
- [沙箱](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
