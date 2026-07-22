---
read_when:
    - 你已完成推論設定，並希望 OpenClaw 設定其餘項目
    - 你需要使用本機設定代理程式檢查或修復 OpenClaw
    - 你正在設計或啟用訊息通道救援模式
summary: 推論支援的 OpenClaw 設定與修復輔助工具之命令列介面參考與安全模型
title: OpenClaw 設定代理程式
x-i18n:
    generated_at: "2026-07-22T10:29:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9578d1493ff514ea6dd07dae995bf83443e9e17f2c2134bc801faa45254615bf
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw 內建一個系統代理程式——它以「OpenClaw」身分對話——用於本機設定、修復與配置（先前稱為 Crestodian）。它只會在實際生效的預設模型完成一次真實對話後啟動。
全新安裝會先建立推論能力；格式錯誤的設定仍沿用傳統的 doctor 流程。

## 啟動時機

執行不含子命令的 `openclaw` 時，會根據設定狀態決定流程：

- 設定不存在，或雖存在但沒有使用者編寫的設定（為空，或只有 `$schema`/`meta` 鍵）：啟動包含即時 AI 驗證的引導式初始設定。
- 設定存在但驗證失敗：啟動傳統初始設定，回報問題並引導你執行 `openclaw doctor`。
- 設定存在且有效：開啟一般代理程式終端介面。若已設定且可連線的閘道，其預設代理程式已有模型，便會直接進入該介面，
  不經過初始設定或 OpenClaw。之後若要進入 OpenClaw，請在終端介面內使用 `/openclaw`，或直接執行
  `openclaw setup`。

執行 `openclaw setup` 時，會先即時測試已設定的預設模型。對話測試通過後便啟動 OpenClaw。互動模式下若測試失敗，會開啟引導式推論設定，並在候選項通過測試後交由 OpenClaw 接手。若推論不可用，單次、JSON 及其他非互動式要求會失敗，並指示執行 `openclaw onboard`。`openclaw --help` 與 `openclaw --version` 維持原有的快速流程。

在非互動模式下直接執行 `openclaw`（無 TTY）時，會以簡短訊息結束，而非顯示根命令說明：若是全新或無效的安裝，訊息會指向非互動式初始設定；若設定有效，則指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 仍是 OpenClaw 的相容性別名，但使用相同的推論閘門：推論正常時開啟聊天；互動模式下失敗時啟動引導式推論設定；非互動模式下失敗時則結束並提供初始設定指引。`openclaw onboard --classic` 會開啟完整的逐步精靈。

## OpenClaw 顯示的內容

互動式 OpenClaw 會開啟與 `openclaw tui` 相同的終端介面外殼，並使用 OpenClaw 聊天後端。啟動問候訊息包含：

- 設定有效性與預設代理程式
- OpenClaw 正在使用的已驗證模型
- 首次啟動探測所取得的閘道可連線性
- 下一個建議的偵錯動作

它不會傾印密鑰，也不會只為啟動而載入外掛命令列介面命令。

使用 `status` 可查看詳細清單：設定路徑、文件／原始碼路徑、本機命令列介面探測、金鑰／權杖是否存在、代理程式、模型及閘道詳細資料。

OpenClaw 使用與一般代理程式相同的參考資料探索機制：在 Git 簽出目錄中，它會指向本機 `docs/` 與原始碼樹；在 npm 安裝環境中，則使用隨附文件並連結至 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同時建議在文件不足時查看原始碼。

## 範例

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "models"
openclaw setup --message "validate config"
openclaw setup --message "setup workspace ~/Projects/work" --yes
openclaw setup --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

在 OpenClaw 終端介面中：

```text
狀態
健康狀態
doctor
驗證設定
設定
設定工作區 ~/Projects/work
設定 gateway.port 為 19001
將 gateway.auth.token 的參照設定為環境變數 OPENCLAW_GATEWAY_TOKEN
閘道狀態
重新啟動閘道
代理程式
建立代理程式 work，工作區為 ~/Projects/work
模型
配置模型供應商
將預設模型設定為 openai/gpt-5.6
頻道
頻道資訊 slack
連接 slack
開啟 slack 的頻道精靈
外掛清單
搜尋 slack 外掛
安裝外掛 clawhub:openclaw-codex-app-server
與 work 代理程式對話
與 ~/Projects/work 的代理程式對話
稽核
離開
```

## 操作與核准

OpenClaw 使用具型別的操作，而非臨時直接編輯設定。

唯讀操作會立即執行：顯示概覽、列出代理程式、列出已安裝的外掛、搜尋 ClawHub 外掛、顯示模型／後端狀態、執行狀態／健康狀態檢查、檢查閘道可連線性、執行不含互動式修復的 doctor、驗證設定，以及顯示稽核記錄路徑。

啟動引導式頻道設定（`connect telegram`）也會立即執行。其精靈會收集明確答案，並負責產生的寫入操作。

持久性操作需要透過對話核准（直接命令則可使用 `--yes`）：寫入設定、`config set`、`config set-ref`、設定／初始設定啟動程序、變更預設模型、啟動／停止／重新啟動閘道、建立代理程式，以及安裝外掛。

OpenClaw 內無法使用 Doctor 修復，因為這些修復可能會改寫支撐目前工作階段的供應商、驗證或預設代理程式推論路徑。請離開 OpenClaw，並在終端機中執行 `openclaw doctor --fix`。OpenClaw 內仍可使用唯讀的 `doctor`。

新代理程式會繼承經即時驗證的預設推論路徑。代理程式 ID `openclaw` 與 `crestodian` 保留給系統代理程式，不能建立為一般代理程式。已停用的 ID 仍會被封鎖，以免舊設定占用它。

`config set` 與 `config set-ref` 可以變更使用者可變更的任何設定，
但有一份簡短且僅供人員使用的拒絕清單：`$include`、`auth.*`、`env.*`、`models.*`
及 `secrets.*` 仍會遭到拒絕，因為它們包含認證資訊素材、
替代設定的引入，或提供給推論路由使用的供應商／目錄定義。
推論路由本身也受到保護：預設模型路由
（`agents.defaults` 的模型／參數／執行階段欄位），以及支援目前有效預設路由之代理程式的路由欄位
都會遭到拒絕，代理程式身分／拓撲欄位（`id`、`agentDir`、`default`）亦同。其他代理程式的路由欄位
仍可在核准後寫入。閘道與頻道驗證仍屬一般設定介面。
對於已配置的路由，請使用 `set default model <provider/model>`；
它會在儲存前即時測試該路由。若要配置或修復供應商／驗證存取權，請離開 OpenClaw 並執行
`openclaw onboard`。

允許 `plugins.entries.<id>.*` 寫入（啟用／停用／配置已安裝的外掛），
除非該外掛支援目前有效的推論路由。外掛安裝來源與載入政策仍在具型別的
外掛安裝工作流程中維持其信任邊界。基於相同原因，也會拒絕解除安裝支援該路由的外掛；
請離開 OpenClaw，並從終端機執行
`openclaw plugins uninstall <id>`。

核准以你自己的話語提供：明確無歧義的回覆（「是」、「可以」、「繼續」、「現在不要」）會依照封閉且具確定性的清單判定。當已設定的路由支援獨立的補全呼叫時，其他回覆只能根據你的訊息和待核准的提案進行分類——絕不交由對話模型本身判斷，因為它不能自行核准。無法分類或語意模糊的回覆會讓提案維持待核准狀態，對話也會再次詢問。

### 變更記錄

Ask OpenClaw 頁面可顯示近期已套用的系統代理程式操作、Doctor
遷移、Settings 與命令列介面設定寫入，以及對
`openclaw.json` 的手動編輯。設定日誌會在閘道
監看期間、OpenClaw 執行寫入期間，或離線編輯後的下次啟動時偵測外部編輯。

歷程記錄儲存在共用
`~/.openclaw/state/openclaw.sqlite` 資料庫的 `diagnostic_events` 資料表中，位於 `system-agent-audit`
與 `config-audit` 範圍下。每個範圍會保留最新的 50,000 筆記錄。
探索與唯讀操作不包含在內。密鑰絕不會出現在變更記錄中；
設定日誌記錄包含的是變更路徑，而非設定值，
且值的比較會使用受保護的指紋。

頻道設定可透過託管對話進行，直到流程需要密鑰為止。
本機 OpenClaw 終端介面不接受敏感的精靈答案，因為終端機聊天輸入是可見的。
它會立即提供 `open channel wizard`，將所選頻道帶入遮罩式終端機精靈；
你也可以稍後執行
`openclaw channels add --channel <channel>`。

### 切換至遮罩式頻道設定

本機聊天可將控制權交給遮罩式頻道精靈：

```text
開啟 slack 的頻道精靈
頻道資訊 slack
```

`open channel wizard for <channel>` 會在聊天
終端介面關閉後開啟遮罩式頻道設定。請先使用 `channel info <channel>` 查看頻道標籤、設定
狀態、先決條件摘要及文件連結。

OpenClaw 絕不會從自身工作階段內變更供應商／驗證存取權：
該工作階段已依賴該推論路徑。對於模型供應商的設定或
修復，`configure model provider` 只會傳回離開／初始設定指引，
不會啟動精靈或寫入設定。請離開 OpenClaw 並執行 `openclaw
onboard`；初始設定會暫存認證資訊，且只儲存能完成一次真實即時對話的路由。初始設定成功後，再次啟動 OpenClaw。

## 設定啟動程序

在引導式初始設定已建立推論能力後，`setup` 會配置其餘的工作區與閘道狀態。它只透過具型別的設定操作進行寫入，並會先要求核准。

```text
設定
設定工作區 ~/Projects/work
```

`setup` 會保留經驗證的實際生效模型。它不會配置或
取代推論設定。

若缺少推論能力或即時檢查失敗，請離開 OpenClaw 並執行 `openclaw onboard`。引導式初始設定會依序嘗試已設定的模型、已驗證的訂閱命令列介面、API 金鑰及其餘支援的命令列介面；它會要求每個候選項提供真實回覆，且只會保存通過測試的路由。達到此邊界後，OpenClaw 會立即啟動，接著即可配置工作區、閘道、頻道、代理程式、外掛及其他選用功能。

當 macOS App 連線至已配置的閘道，且其預設代理程式已有已配置模型時，
會完全略過此階梯，直接開啟一般代理程式
介面。
對於全新或未完成設定的閘道，App 會透過
`openclaw.setup.detect` 與 `openclaw.setup.activate` 閘道方法驅動推論階梯：
detect 會列出所找到的每個候選後端，activate 則會即時測試一個
候選項（一次真正的「reply with OK」補全），且只有在測試通過後，
才保存該路由所需的模型、認證資訊及供應商／執行階段狀態。工作區與閘道的預設值仍交由 OpenClaw 處理。失敗的候選項
絕不會變更設定；App 會自動沿著階梯繼續嘗試，最後
提供手動金鑰／權杖步驟，其中會填入閘道目前有效的
文字推論供應商外掛。所選供應商負責其入門模型
與設定，認證資訊也會以相同方式驗證後才儲存。

Codex 監督及其他選用的外掛功能不屬於此
推論啟用交易。請只在推論正常運作且 OpenClaw
已啟動後配置這些功能；推論設定期間不會變更既有的外掛政策與明確的
監督停用設定。

## AI 對話

互動式 OpenClaw 的自由形式對話會經由與一般 OpenClaw 代理程式相同的代理程式迴圈執行，且僅限使用一個具最高權限的 OpenClaw 權限工具 `openclaw`，該工具封裝具型別的操作。讀取動作可自由執行；變更操作則需要你針對該項確切操作進行對話核准（請參閱「操作與核准」）；每次套用的寫入都會被稽核並重新驗證。代理程式工作階段會持續存在，因此 OpenClaw 具有真正的多輪記憶。如果經驗證的推論路徑之後停止運作，請返回 `openclaw onboard` 修復後再繼續。

主機不會將自然語言要求剖析為操作。自由形式
訊息——包括看起來像命令的文字，以及「為什麼我的
閘道停止運作？」之類的問題——都會傳送給 AI，由 AI 透過
`openclaw` 工具將要求對應至具型別的操作。

當變更操作處於待處理狀態時，只有封閉清單中語意明確的核准或拒絕短語，才會在不進行推論的情況下解析。語意模糊的同意會交由另一個已設定的 completion 呼叫處理，否則一律以拒絕方式安全失敗。結構化精靈欄位與精確的主機導覽屬於 UI 控制項，而不是自然語言操作剖析。有一項認證資訊衛生例外尤其重要：在敏感路徑（權杖、金鑰、密碼）上輸入完全相符的 `config set`，絕不會送達模型。主機會建立經遮蔽的提案，且該值會在 AI 可見的歷史記錄中遮罩。機密資料請優先使用 `config set-ref <path> env <ENV_VAR>`。

訊息頻道救援模式絕不使用模型輔助規劃器。遠端救援維持確定性，因此已損壞或遭入侵的一般代理程式路徑無法被用作設定編輯器。

### 命令列介面測試框架信任模型

內嵌執行階段與 Codex app-server 測試框架會直接強制執行最高權限限制：該次執行攜帶 OpenClaw 工具允許清單，其中只有 `openclaw` 工具。對於 Codex，OpenClaw 也會在該次執行中停用環境、原生執行、多代理程式、目標、應用程式／外掛、skill/MCP、網路搜尋，以及 `request_user_input` 介面。Codex 仍會注入其無作用的原生 `update_plan` 公用工具；它可以更新模型的暫時檢查清單，但無法寫入檔案或 OpenClaw 設定。命令列介面測試框架不會使用 OpenClaw 的允許清單，因此 OpenClaw 只接受其自身工具選擇合約能證明相同限制的後端：

- 可選擇的後端（包括 Claude Code）會以空白的原生工具選擇與一個 MCP 工具 `openclaw` 啟動。Claude 產生的 MCP 設定會透過 `--strict-mcp-config` 套用，因此不會載入其他 MCP 伺服器。
- 宣告沒有原生工具的後端會收到相同的專用 OpenClaw MCP 伺服器。
- 原生工具永遠開啟或狀態未知的後端，會在推論前以拒絕方式安全失敗；它們無法承載 OpenClaw 工作階段。

只有 OpenClaw 工作階段會取得 openclaw MCP 伺服器；一般代理程式執行永遠不會看到此工具。因此，可選擇／無原生工具的命令列介面後端與 API 金鑰模型會強制執行字面上的單一工具迴圈。Codex app-server 模型會強制使用單一 OpenClaw 權限工具，加上無作用的原生規劃公用工具。在這三種情況下，設定寫入都仍受限於 OpenClaw 經稽核的核准合約。

Gemini CLI 仍可供一般代理程式使用，但它無法強制執行推論閘門所要求的無工具探測，因此無法承載 OpenClaw。

## 切換至代理程式

使用自然語言選擇器離開 OpenClaw 並開啟一般終端介面：

```text
與代理程式交談
與工作代理程式交談
切換至主要代理程式
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 會直接開啟一般代理程式終端介面；它們不會啟動 OpenClaw。切換至一般終端介面後，`/openclaw` 會返回 OpenClaw，並可選擇附帶後續要求：

```text
/openclaw
/openclaw restart gateway
```

## 訊息救援模式

訊息救援模式是 OpenClaw 的訊息頻道進入點：當你的一般代理程式已停止運作，但受信任的頻道（例如 WhatsApp）仍能接收命令時，請使用此模式。

這是確定性的緊急命令處理常式，不是對話式 OpenClaw 代理程式。它不會啟動全新的設定流程，也不會放寬 OpenClaw 聊天的推論閘門。

支援的命令：`/openclaw <request>`。救援只接受完全相符的輸入命令文法——自然語言會遭拒並顯示提示，絕不會猜測成某項操作，也絕不會查詢模型。

```text
你，在受信任的擁有者私訊中：/openclaw status
OpenClaw：OpenClaw 救援模式。閘道可連線：否。設定有效：否。
你：/openclaw restart gateway
OpenClaw：計畫：重新啟動閘道。回覆 /openclaw yes 以套用。
你：/openclaw yes
OpenClaw：已套用。已寫入稽核項目。
```

也可以在本機或透過救援將代理程式建立作業加入佇列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

建立代理程式時，只能指定目前已即時驗證的預設模型。省略模型即可繼承該路由。

遠端救援是管理介面，必須將其視為遠端設定修復，而不是一般聊天。

遠端救援的安全性合約：

- 當代理程式／工作階段已啟用沙箱時停用；OpenClaw 會拒絕遠端救援，並指向本機命令列介面修復。
- 預設有效狀態為 `auto`：只允許在受信任的 YOLO 操作中進行遠端救援，此時執行階段已具備不受沙箱限制的本機權限（`tools.exec.security` 解析為 `full`，且 `tools.exec.ask` 解析為 `off`，沙箱模式為 `off`）。
- 需要明確的擁有者身分；不允許萬用字元傳送者規則、開放群組原則、未驗證的網路鉤子或匿名頻道。
- 救援僅限擁有者私訊。
- 外掛搜尋與列出均為唯讀。外掛安裝一律只能在本機進行（即使原本已啟用，在救援模式中仍會封鎖），因為它會下載可執行程式碼。本機 OpenClaw 與救援模式都會拒絕解除安裝外掛；請從終端機執行 `openclaw plugins uninstall <id>`。
- 遠端救援無法開啟本機終端介面或切換至互動式代理程式工作階段；代理程式交接請使用本機 `openclaw`。
- 即使在救援模式中，永久寫入仍需核准。
- 待處理的核准只能使用一次。同一帳號、頻道與傳送者的任何較新救援命令都會撤銷較舊的計畫；執行失敗也會消耗該核准，因此如要重試，請重新傳送命令。
- 每項已套用的救援操作都會接受稽核。訊息頻道救援會記錄頻道、帳號、傳送者與來源位址中繼資料；會變更設定的操作還會記錄變更前後的設定雜湊。
- 絕不回顯機密資料。SecretRef 檢查只會回報可用性，不會回報值。
- 如果閘道仍在運作，救援會優先使用閘道的具型別操作；如果閘道已停止運作，救援只會使用不依賴一般代理程式迴圈的最小本機修復介面。

救援原則為內建：只有在有效執行階段為 YOLO、沙箱已關閉，且要求來自擁有者私訊時，才可使用救援。待處理的寫入核准會在 15 分鐘後到期。`openclaw doctor --fix` 會移除已淘汰的 `systemAgent` 與 `crestodian` 設定區塊。

遠端救援由 Docker 測試路徑涵蓋：

```bash
pnpm test:docker:system-agent-rescue
```

選擇性啟用的即時頻道命令介面煙霧測試，會檢查 `/openclaw status`，以及透過救援處理常式完成的一次永久核准來回流程：

```bash
pnpm test:live:system-agent-rescue-channel
```

受推論閘門保護的封裝版單次設定由以下項目涵蓋：

```bash
pnpm test:docker:system-agent-first-run
```

該封裝版命令列介面測試路徑會從空白狀態目錄開始，並證明 OpenClaw 在沒有推論時會以拒絕方式安全失敗。接著，它會透過封裝版啟用模組測試並啟用假的 Claude。只有在此之後，模糊要求才會到達規劃器並解析為具型別設定，隨後執行單次命令來建立額外的代理程式、透過啟用外掛加上權杖 SecretRef 來設定 Discord、驗證設定，並檢查稽核記錄。此測試路徑提供閘門／操作佐證；它不會執行互動式初始設定，也不會執行 OpenClaw 的代理程式／工具／核准對話。下方的 QA Lab 情境會重新導向相同的 Docker 測試路徑：

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [診斷工具](/zh-TW/cli/doctor)
- [終端介面](/zh-TW/cli/tui)
- [沙箱](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
