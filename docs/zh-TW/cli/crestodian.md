---
read_when:
    - 您已完成推論設定，並希望 Crestodian 設定其餘部分
    - 你需要使用本機設定代理程式檢查或修復 OpenClaw
    - 你正在設計或啟用訊息通道救援模式
summary: 推論支援的 Crestodian 設定與修復輔助工具之命令列介面參考與安全模型
title: Crestodian
x-i18n:
    generated_at: "2026-07-11T21:12:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

對話式 Crestodian 是 OpenClaw 的本機設定、修復與配置代理。它只會在實際生效的預設模型完成一次真實互動後啟動。全新安裝會先建立推論能力；格式錯誤的配置則仍沿用傳統 doctor 流程。

## 啟動時機

執行不含子命令的 `openclaw` 時，會依配置狀態決定流程：

- 配置不存在，或配置存在但沒有使用者設定（空白，或只有 `$schema`/`meta` 鍵）：啟動包含即時 AI 驗證的引導式初始設定。
- 配置存在但驗證失敗：啟動傳統初始設定，回報問題並引導你使用 `openclaw doctor`。
- 配置存在且有效：開啟一般代理終端介面。若已配置且可連線的閘道，其預設代理已有模型，則會直接進入該介面，不經過初始設定或 Crestodian。之後可在終端介面中使用 `/crestodian`，或直接執行 `openclaw crestodian`，以進入 Crestodian。

執行 `openclaw crestodian` 時，會先對已配置的預設模型進行即時測試。若互動通過，就會啟動 Crestodian。互動模式下若失敗，則會開啟引導式推論設定，並在候選項通過後移交給 Crestodian。當推論不可用時，單次、JSON 及其他非互動式要求會失敗，並提示執行 `openclaw onboard`。`openclaw --help` 與 `openclaw --version` 維持原有的快速路徑。

非互動式執行不帶參數的 `openclaw`（無 TTY）時，會以簡短訊息結束，而非輸出根命令說明：若為全新或無效的安裝，會指向非互動式初始設定；若配置有效，則會指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 仍是 Crestodian 的相容性別名，但採用相同的推論閘門：推論正常時開啟對話；互動模式失敗時啟動引導式推論設定；非互動模式失敗時結束並提供初始設定指引。`openclaw onboard --classic` 會開啟完整的逐步精靈。

## Crestodian 顯示的內容

互動式 Crestodian 會開啟與 `openclaw tui` 相同的終端介面外殼，並使用 Crestodian 對話後端。啟動問候涵蓋：

- 配置有效性與預設代理
- Crestodian 正在使用的已驗證模型
- 首次啟動探測所得的閘道可連線狀態
- 下一個建議的偵錯操作

它不會傾印密鑰，也不會僅為了啟動而載入外掛命令列介面命令。

使用 `status` 查看詳細清單：配置路徑、文件／原始碼路徑、本機命令列介面探測、金鑰／權杖是否存在、代理、模型及閘道詳細資料。

Crestodian 使用與一般代理相同的參考資料探索機制：在 Git 簽出中，它會指向本機 `docs/` 與原始碼樹；在 npm 安裝中，它會使用隨附文件並連結至 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，且在文件不足時建議查閱原始碼。

## 範例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

在 Crestodian 終端介面中：

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 操作與核准

Crestodian 使用具型別的操作，而非臨時直接編輯配置。

唯讀操作會立即執行：顯示概覽、列出代理、列出已安裝的外掛、搜尋 ClawHub 外掛、顯示模型／後端狀態、執行狀態／健康檢查、檢查閘道可連線性、執行不含互動式修復的 doctor、驗證配置，以及顯示稽核日誌路徑。

啟動引導式頻道設定（`connect telegram`）也會立即執行。其精靈會收集明確回答，並負責由此產生的寫入。

持久性操作需要透過對話核准（直接命令則可使用 `--yes`）：寫入配置、`config set`、`config set-ref`、設定／初始設定的啟動程序、變更預設模型、啟動／停止／重新啟動閘道、建立代理，以及安裝外掛。

Crestodian 內無法使用 doctor 修復，因為這些修復可能改寫支撐目前工作階段的供應商、驗證或預設代理推論路徑。請結束 Crestodian，並在終端機中執行 `openclaw doctor --fix`。唯讀的 `doctor` 仍可在 Crestodian 內使用。

新代理會繼承經即時驗證的預設推論路徑。代理 ID `crestodian` 保留給具特權的虛擬管理員，無法建立為一般代理。

`config set` 與 `config set-ref` 無法變更推論路徑狀態，包括推論供應商憑證、頂層 `auth.*`、模型目錄、命令列介面後端、預設／各代理模型路徑、代理參數／工具，或根層級 `tools.*`。也會拒絕直接寫入 `env.*`、`secrets.*`、`plugins.*` 與 `$include`，因為這些寫入可能取代憑證解析或供應商啟用狀態。閘道與頻道驗證仍屬一般配置介面。請使用具型別的外掛／頻道工作流程；若路徑已配置，則使用 `set default model <provider/model>`，它會在儲存前即時測試該路徑。若要配置或修復供應商／驗證存取，請結束 Crestodian 並執行 `openclaw onboard`。

Crestodian 內拒絕解除安裝外掛，因為移除供應商外掛可能停用支撐目前工作階段的推論路徑。請結束 Crestodian，並從終端機執行 `openclaw plugins uninstall <id>`。

你可以用自己的話核准：明確無歧義的回覆（「是」、「當然」、「繼續」、「現在不要」）會依封閉且確定性的清單進行解析。當已配置的路徑支援獨立的補全呼叫時，其他回覆只能根據你的訊息與待處理提案進行分類，絕不會由對話模型自行分類，因為模型不能自行核准。無法分類或有歧義的回覆會使提案維持待處理狀態，對話也會再次詢問。

已套用的寫入會記錄於 `~/.openclaw/audit/crestodian.jsonl`。探索操作不會被稽核；只有已套用的操作與寫入會被記錄。

頻道設定可作為託管式對話執行，直到需要輸入密鑰為止。本機 Crestodian 終端介面不接受敏感的精靈回答，因為終端機對話輸入是可見的。它會立即提供 `open channel wizard`，將所選頻道帶入具遮罩的終端機精靈；你也可以稍後執行 `openclaw channels add --channel <channel>`。

### 切換至遮罩式頻道設定

本機對話可將控制權移交給具遮罩的頻道精靈：

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` 會在對話終端介面關閉後開啟遮罩式頻道設定。請先使用 `channel info <channel>` 查看頻道標籤、設定狀態、先決條件摘要及文件連結。

Crestodian 絕不會在自身工作階段中變更供應商／驗證存取，因為該工作階段本身已依賴該推論路徑。對於模型供應商設定或修復，`configure model provider` 只會回傳結束／初始設定指引，不會啟動精靈或寫入配置。請結束 Crestodian 並執行 `openclaw onboard`；初始設定會暫存憑證，且只儲存能完成一次真實即時互動的路徑。初始設定成功後，再次啟動 Crestodian。

## 設定啟動程序

引導式初始設定已建立推論能力後，`setup` 會配置其餘工作區與閘道狀態。它只透過具型別的配置操作寫入，並會先要求核准。

```text
setup
setup workspace ~/Projects/work
```

`setup` 會保留已驗證且實際生效的模型。它不會配置或取代推論。

若缺少推論能力或即時檢查失敗，請離開 Crestodian 並執行 `openclaw onboard`。引導式初始設定會偵測已配置的模型、API 金鑰及已驗證的本機命令列介面，要求每個候選項提供一次真實回覆，且只保存通過的路徑。越過此邊界後 Crestodian 會立即啟動，接著便可配置工作區、閘道、頻道、代理、外掛及其他選用功能。

當 macOS 應用程式連線到已配置的閘道，且其預設代理已有已配置的模型時，會完全略過此階梯，直接開啟一般代理介面。
若為全新或不完整的閘道，應用程式會透過 `crestodian.setup.detect` 與 `crestodian.setup.activate` 閘道方法驅動推論階梯：detect 會列出找到的每個候選後端；activate 會即時測試一個候選項（執行一次真實的「回覆 OK」補全），並只在測試通過後保存該路徑所需的模型、憑證及供應商／執行階段狀態。工作區與閘道預設值仍交由 Crestodian 處理。失敗的候選項絕不會變更配置；應用程式會自動沿階梯往下嘗試，最後提供手動金鑰／權杖步驟，其中會填入閘道目前啟用的文字推論供應商外掛。所選供應商擁有其入門模型與配置，而憑證會在儲存前以相同方式驗證。

Codex 監督及其他選用外掛功能不在此推論啟用交易內。請只在推論正常運作且 Crestodian 已啟動後配置這些功能；推論設定期間不會變更現有外掛原則與明確的監督退出設定。

## AI 對話

互動式 Crestodian 的自由形式對話會透過與一般 OpenClaw 代理相同的代理迴圈執行，但僅限使用一個零環 OpenClaw 權限工具 `crestodian`，該工具封裝具型別的操作。讀取操作可自由執行；變更操作則需要你針對該項確切操作進行對話式核准（請參閱「操作與核准」）；每次套用寫入都會被稽核並重新驗證。代理工作階段會持續存在，因此 Crestodian 具備真正的多輪記憶。若已驗證的推論路徑之後停止運作，請返回 `openclaw onboard` 修復後再繼續。

主機不會將自然語言要求解析成操作。自由形式訊息（包括看似命令的文字，以及「為什麼我的閘道停止了？」之類的問題）會傳送給 AI，而 AI 可透過 `crestodian` 工具將要求對應至具型別的操作。

當有待處理的變更時，只有封閉清單中的明確核准或拒絕語句會在不使用推論的情況下解析。有歧義的同意會交由獨立配置的補全呼叫處理，否則採取封閉式失敗。結構化精靈欄位與精確的主機導覽屬於介面控制項，而非自然語言操作解析。有一項密鑰衛生例外尤其重要：對敏感路徑（權杖、金鑰、密碼）執行完全相符的 `config set` 時，內容絕不會傳送給模型。主機會建立已遮蔽的提案，且該值在 AI 可見的歷程中也會被遮罩。對於密鑰，請優先使用 `config set-ref <path> env <ENV_VAR>`。

訊息頻道救援模式絕不使用模型輔助規劃器。遠端救援會維持確定性，因此已損壞或遭入侵的一般代理路徑無法被用作配置編輯器。

### 命令列介面執行框架的信任模型

嵌入式執行階段與 Codex 應用程式伺服器執行框架會直接強制零環限制：該次執行攜帶的 OpenClaw 工具允許清單中只有 `crestodian` 工具。對於 Codex，OpenClaw 還會停用該次執行的環境、原生執行、多代理、目標、應用程式／外掛、技能／MCP、網路搜尋及 `request_user_input` 介面。Codex 仍會注入其無作用的原生 `update_plan` 公用工具；它可以更新模型的暫存核對清單，但無法寫入檔案或 OpenClaw 配置。命令列介面執行框架不會使用 OpenClaw 的允許清單，因此 Crestodian 只接受其自身工具選擇合約能證明相同限制的後端：

- 可選擇的後端（包括 Claude Code）啟動時會使用空白的原生工具選擇，以及一個 MCP 工具 `crestodian`。Claude 產生的 MCP 設定會透過 `--strict-mcp-config` 套用，因此不會載入其他 MCP 伺服器。
- 宣告沒有原生工具的後端會收到相同的專用 Crestodian MCP 伺服器。
- 永遠啟用或原生工具狀態未知的後端會在推論前採取封閉式失敗；它們無法託管 Crestodian 工作階段。

只有 Crestodian 工作階段會取得 crestodian MCP 伺服器；一般代理程式執行永遠不會看到此工具。因此，可選擇／無原生工具的命令列介面後端與 API 金鑰模型會強制執行嚴格的單一工具迴圈。Codex 應用程式伺服器模型會強制僅使用一個 OpenClaw 權限工具，外加不會產生作用的原生規劃公用程式。在這三種情況下，設定寫入仍僅限於 Crestodian 經稽核的核准合約。

Gemini 命令列介面仍可供一般代理程式使用，但它無法強制執行推論閘門所需的無工具探測，因此無法託管 Crestodian。

## 切換至代理程式

使用自然語言選擇指令離開 Crestodian，並開啟一般終端介面：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 與 `openclaw terminal` 會直接開啟一般代理程式終端介面；它們不會啟動 Crestodian。切換至一般終端介面後，使用 `/crestodian` 可返回 Crestodian，並可選擇附帶後續請求：

```text
/crestodian
/crestodian restart gateway
```

## 訊息救援模式

訊息救援模式是 Crestodian 的訊息頻道進入點：當一般代理程式已停止運作，但受信任的頻道（例如 WhatsApp）仍可接收命令時，請使用此模式。

這是確定性的緊急命令處理常式，而非對話式 Crestodian 代理程式。它不會啟動全新的設定流程，也不會放寬 Crestodian 聊天的推論閘門。

支援的命令：`/crestodian <request>`。救援功能只接受精確輸入的命令文法——自然語言會遭拒絕並顯示提示，絕不會被猜測並轉換為操作，也絕不會詢問任何模型。

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

也可以在本機或透過救援功能將代理程式建立工作排入佇列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

建立代理程式時，只能指定目前經即時驗證的預設模型。省略模型即可繼承該路由。

遠端救援屬於管理介面，必須視同遠端設定修復，而非一般聊天。

遠端救援的安全性合約：

- 當代理程式／工作階段啟用沙箱時停用；Crestodian 會拒絕遠端救援，並指示使用本機命令列介面進行修復。
- 預設有效狀態為 `auto`：僅在受信任的 YOLO 操作中允許遠端救援，此時執行階段已具有不受沙箱限制的本機權限（`tools.exec.security` 解析為 `full`、`tools.exec.ask` 解析為 `off`，且沙箱模式為 `off`）。
- 必須有明確的擁有者身分；不允許萬用字元傳送者規則、開放群組政策、未驗證的網路鉤子或匿名頻道。
- 預設僅允許擁有者私訊；群組／頻道救援需要明確選擇啟用。
- 外掛搜尋與清單為唯讀。外掛安裝一律只能在本機執行（即使原本已啟用，在救援模式中仍會封鎖），因為它會下載可執行程式碼。本機 Crestodian 與救援模式都會拒絕解除安裝外掛；請從終端執行 `openclaw plugins uninstall <id>`。
- 遠端救援無法開啟本機終端介面或切換至互動式代理程式工作階段；請使用本機 `openclaw` 進行代理程式交接。
- 即使在救援模式中，持久性寫入仍需核准。
- 每項已套用的救援操作都會接受稽核。訊息頻道救援會記錄頻道、帳戶、傳送者與來源位址中繼資料；修改設定的操作還會記錄修改前後的設定雜湊。
- 絕不回顯祕密。SecretRef 檢查只會回報是否可用，不會回報值。
- 若閘道仍在運作，救援功能會優先使用閘道的具型別操作；若閘道已停止運作，救援功能只會使用不依賴一般代理程式迴圈的最小本機修復介面。

設定結構：

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`：`"auto"`（預設）僅在有效執行階段為 YOLO 且沙箱關閉時允許救援；`false` 永不允許訊息頻道救援；`true` 會在擁有者／頻道檢查通過時明確允許救援（仍受沙箱拒絕規則約束）。
- `ownerDmOnly`：將救援限制於擁有者的直接訊息。預設為 `true`。
- `pendingTtlMinutes`：待處理的救援寫入在到期前，會保持等待 `/crestodian yes` 核准的分鐘數。預設為 `15`。

遠端救援由以下 Docker 測試路徑涵蓋：

```bash
pnpm test:docker:crestodian-rescue
```

選擇啟用的即時頻道命令介面煙霧測試會檢查 `/crestodian status`，以及透過救援處理常式完成一次持久性核准往返流程：

```bash
pnpm test:live:crestodian-rescue-channel
```

受推論閘門保護的封裝式單次設定由以下測試涵蓋：

```bash
pnpm test:docker:crestodian-first-run
```

此封裝命令列介面測試路徑會從空白狀態目錄開始，並證明 Crestodian 在無法進行推論時會採取封閉式失敗。接著，它會透過封裝的啟用模組測試並啟用模擬 Claude。只有在此之後，模糊請求才會送達規劃器並解析為具型別的設定操作，後續再執行單次命令，以建立額外代理程式、透過啟用外掛加上權杖 SecretRef 來設定 Discord、驗證設定，並檢查稽核記錄。此測試路徑提供閘門／操作的佐證；它不會測試互動式上線引導，或 Crestodian 的代理程式／工具／核准對話。下方的 QA Lab 情境會重新導向相同的 Docker 測試路徑：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [診斷工具](/zh-TW/cli/doctor)
- [終端介面](/zh-TW/cli/tui)
- [沙箱](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
