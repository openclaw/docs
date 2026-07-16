---
read_when:
    - 你已完成推論設定，並希望 OpenClaw 設定其餘項目
    - 你需要使用本機設定代理程式檢查或修復 OpenClaw
    - 你正在設計或啟用訊息頻道救援模式
summary: 推論式 OpenClaw 設定與修復輔助工具的命令列介面參考與安全模型
title: OpenClaw 設定代理程式
x-i18n:
    generated_at: "2026-07-16T11:34:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw 隨附內建的系統代理程式（以「OpenClaw」身分發言），用於本機設定、修復與組態（先前稱為 Crestodian）。它只會在實際的預設模型完成一次真實對話回合後啟動。
全新安裝會先建立推論；格式錯誤的組態則仍使用傳統的 doctor 流程。

## 啟動時機

執行不含子命令的 `openclaw` 時，會根據組態狀態決定流程：

- 組態不存在，或雖存在但不含使用者設定（為空，或僅含 `$schema`/`meta` 鍵）：啟動包含即時 AI 驗證的引導式初始設定。
- 組態存在但驗證失敗：啟動傳統初始設定，回報問題並引導你使用 `openclaw doctor`。
- 組態存在且有效：開啟一般代理程式終端介面。若已設定且可連線的閘道，其預設代理程式已有模型，則會直接進入該介面，不經過初始設定或 OpenClaw。若稍後要進入 OpenClaw，請在終端介面內使用 `/openclaw`，或直接執行
  `openclaw setup`。

執行 `openclaw setup` 會先即時測試已設定的預設模型。若對話回合通過，便啟動 OpenClaw。互動模式下若失敗，會開啟引導式推論設定，並在候選項通過後轉交給 OpenClaw。若推論無法使用，單次、JSON 及其他非互動式請求會失敗，並提示執行 `openclaw onboard`。`openclaw --help` 與 `openclaw --version` 仍使用其一般快速路徑。

非互動式直接執行 `openclaw`（無 TTY）時，會以簡短訊息結束，而非顯示根命令說明：在全新或無效的安裝中，訊息會指向非互動式初始設定；若組態有效，則會指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 仍是 OpenClaw 的相容性別名，但使用相同的推論閘門：推論正常時開啟聊天；互動模式下失敗時啟動引導式推論設定；非互動模式下失敗時，則結束並提供初始設定指引。`openclaw onboard --classic` 會開啟完整的逐步精靈。

## OpenClaw 顯示的內容

互動式 OpenClaw 會開啟與 `openclaw tui` 相同的終端介面外殼，並使用 OpenClaw 聊天後端。啟動問候語涵蓋：

- 組態有效性與預設代理程式
- OpenClaw 正在使用的已驗證模型
- 首次啟動探測所得的閘道連線狀態
- 下一個建議的偵錯動作

它不會傾印密鑰，也不會為了啟動而載入外掛命令列介面命令。

使用 `status` 可查看詳細清單：組態路徑、文件／原始碼路徑、本機命令列介面探測、金鑰／權杖是否存在、代理程式、模型及閘道詳細資訊。

OpenClaw 使用與一般代理程式相同的參考資料探索機制：在 Git 簽出目錄中，它會指向本機 `docs/` 與原始碼樹；在 npm 安裝中，它會使用隨附文件並連結至 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同時在文件不足時建議查看原始碼。

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

在 OpenClaw 終端介面內：

```text
狀態
健康狀況
doctor
驗證組態
設定
設定工作區 ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
閘道狀態
重新啟動閘道
代理程式
建立代理程式 work 工作區 ~/Projects/work
模型
設定模型供應商
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

OpenClaw 使用具型別的操作，而非臨時編輯組態。

唯讀操作會立即執行：顯示概覽、列出代理程式、列出已安裝的外掛、搜尋 ClawHub 外掛、顯示模型／後端狀態、執行狀態／健康狀況檢查、檢查閘道連線能力、執行不含互動式修復的 doctor、驗證組態，以及顯示稽核記錄路徑。

啟動引導式頻道設定（`connect telegram`）也會立即執行。其精靈會收集明確答案，並負責執行由此產生的寫入。

持久性操作需要在對話中核准（直接執行命令時則使用 `--yes`）：寫入組態、`config set`、`config set-ref`、設定／初始設定啟動程序、變更預設模型、啟動／停止／重新啟動閘道、建立代理程式，以及安裝外掛。

OpenClaw 內無法使用 doctor 修復，因為修復可能重寫支撐目前工作階段的供應商、驗證或預設代理程式推論路徑。請結束 OpenClaw，並在終端機執行 `openclaw doctor --fix`。唯讀的 `doctor` 在 OpenClaw 內仍可使用。

新代理程式會繼承經即時驗證的預設推論路徑。代理程式 ID `openclaw` 與 `crestodian` 保留給系統代理程式，無法建立為一般代理程式。已停用的 ID 仍會遭到封鎖，以免舊組態占用它。

`config set` 與 `config set-ref` 無法變更推論路徑狀態，
包括推論供應商的認證資訊、頂層 `auth.*`、模型目錄、
命令列介面後端、預設／個別代理程式模型路徑、代理程式參數／工具，或根層級
`tools.*`。也會拒絕直接寫入 `env.*`、`secrets.*`、`plugins.*` 與 `$include`，
因為這些寫入可能取代認證資訊解析或供應商啟用機制。閘道與頻道驗證仍是一般組態介面。請使用具型別的外掛／頻道工作流程；若路徑已完成設定，則使用
`set default model <provider/model>`；它會在儲存前即時測試該路徑。若要設定或
修復供應商／驗證存取權，請結束 OpenClaw 並執行 `openclaw onboard`。

OpenClaw 內會拒絕解除安裝外掛，因為移除供應商外掛可能停用支撐目前工作階段的推論路徑。請結束 OpenClaw，並從終端機執行 `openclaw plugins uninstall <id>`。

核准可用你自己的話表達：含義明確的回覆（「是」、「當然」、「繼續」、「暫時不要」）會依封閉且具確定性的清單判定。當已設定的路徑支援獨立的完成呼叫時，其他回覆只能根據你的訊息與待處理提案進行分類，絕不會由對話模型本身分類，因為它不能自行核准。無法分類或含義模糊的回覆會讓提案維持待處理狀態，並由對話再次詢問。

已套用的寫入會記錄於 `~/.openclaw/audit/system-agent.jsonl`。探索操作不會稽核；只有已套用的操作與寫入會受到稽核。

頻道設定可透過託管對話進行，直到需要輸入機密為止。本機 OpenClaw 終端介面不接受精靈中的敏感答案，因為終端機聊天輸入可被看見。它會立即提供 `open channel wizard`，將所選頻道帶入具遮罩的終端機精靈；你也可以稍後執行
`openclaw channels add --channel <channel>`。

### 切換至具遮罩的頻道設定

本機聊天可將控制權交給具遮罩的頻道精靈：

```text
開啟 slack 的頻道精靈
頻道資訊 slack
```

`open channel wizard for <channel>` 會在聊天終端介面關閉後，開啟具遮罩的頻道設定。請先使用 `channel info <channel>` 查看頻道標籤、設定狀態、必要條件摘要及文件連結。

OpenClaw 絕不會在自身工作階段內變更供應商／驗證存取權：該工作階段已依賴此推論路徑。對於模型供應商設定或修復，`configure model provider` 會傳回結束／初始設定指引，而不啟動精靈或寫入組態。請結束 OpenClaw 並執行 `openclaw
onboard`；初始設定會暫存認證資訊，而且僅儲存能完成真實即時對話回合的路徑。初始設定成功後，再次啟動 OpenClaw。

## 設定啟動程序

在引導式初始設定已建立推論後，`setup` 會設定其餘的工作區與閘道狀態。它只會透過具型別的組態操作寫入，並事先要求核准。

```text
設定
設定工作區 ~/Projects/work
```

`setup` 會保留經驗證的有效模型。它不會設定或
取代推論。

如果缺少推論或即時檢查失敗，請離開 OpenClaw 並執行 `openclaw onboard`。引導式初始設定會偵測已設定的模型、API 金鑰及已驗證的本機命令列介面，要求每個候選項提供真實回覆，且僅保存通過的路徑。越過此界線後，OpenClaw 會立即啟動，接著便能設定工作區、閘道、頻道、代理程式、外掛及其他選用功能。

當 macOS 應用程式連線至已設定的閘道，且其預設代理程式已有已設定的模型時，會完全略過此階梯流程，直接開啟一般代理程式介面。
對於全新或未完成設定的閘道，應用程式會透過
`openclaw.setup.detect` 與 `openclaw.setup.activate` 閘道方法驅動推論階梯流程：
detect 會列出找到的所有候選後端；activate 會即時測試一個
候選項（進行真實的「reply with OK」完成呼叫），而且只有在測試通過後，才會保存該路徑所需的模型、
認證資訊及供應商／執行階段狀態。工作區與閘道預設值仍交由 OpenClaw 處理。失敗的候選項絕不會變更組態；應用程式會自動逐級嘗試，最後提供手動金鑰／權杖步驟，其中會填入來自閘道作用中
文字推論供應商外掛的資訊。所選供應商負責其起始模型
與組態，而認證資訊會以相同方式驗證後才儲存。

Codex 監督與其他選用外掛功能不屬於此
推論啟用交易。請只在推論正常運作且 OpenClaw 已啟動後進行設定；推論設定期間，現有的外掛原則與明確的
監督退出設定均不會變更。

## AI 對話

互動式 OpenClaw 的自由形式對話會經由與一般 OpenClaw 代理程式相同的代理程式迴圈執行，且僅限使用一個 ring-zero OpenClaw 權限工具 `openclaw`，用以封裝具型別的操作。讀取動作可自由執行；變更則需針對該項確切操作取得你的對話式核准（請參閱「操作與核准」）；每次套用的寫入都會受到稽核並重新驗證。代理程式工作階段會持續存在，因此 OpenClaw 具備真正的多輪記憶。如果經驗證的推論路徑之後停止運作，請返回 `openclaw onboard` 修復後再繼續。

主機不會將自然語言請求剖析為操作。自由形式
訊息（包括看似命令的文字，以及「why did my
gateway stop?」之類的問題）會傳給 AI，後者可透過
`openclaw` 工具將請求對應至具型別的操作。

當有變更待處理時，只有封閉清單中含義明確的核准或拒絕語句，才可在無推論的情況下判定。含義模糊的同意會交由
另一個已設定的完成呼叫處理，否則以拒絕為預設。結構化
精靈欄位與精確的主機導覽屬於使用者介面控制項，而非自然語言
操作剖析。其中一項機密衛生例外尤其重要：對敏感路徑（權杖、金鑰、密碼）執行精確的 `config set` 絕不會傳到
模型。主機會建立已遮蔽的提案，且該值會在
AI 可見的歷程中受到遮罩。機密請優先使用 `config set-ref <path> env <ENV_VAR>`。

訊息頻道救援模式絕不使用模型輔助的規劃器。遠端救援維持確定性，因此損壞或遭入侵的一般代理程式路徑無法被用作組態編輯器。

### 命令列介面測試框架信任模型

嵌入式執行階段與 Codex app-server 控制框架會直接強制執行 ring-zero
限制：該次執行會攜帶 OpenClaw 工具允許清單，其中僅包含
`openclaw` 工具。對 Codex 而言，OpenClaw 也會在該次執行中停用環境、原生
執行、多代理程式、目標、應用程式／外掛、skill/MCP、網頁搜尋，以及
`request_user_input` 介面。Codex 仍會注入其無作用的原生 `update_plan`
公用工具；它可以更新模型的暫存檢查清單，但無法寫入檔案
或 OpenClaw 設定。命令列介面控制框架不會使用 OpenClaw 的允許清單，
因此 OpenClaw 僅允許其自身工具選擇合約能證明
相同限制的後端：

- 可選取的後端（包括 Claude Code）會以空白的原生工具
  選擇和一個 MCP 工具 `openclaw` 啟動。Claude 產生的 MCP 設定會
  透過 `--strict-mcp-config` 套用，因此不會載入其他 MCP 伺服器。
- 宣告沒有原生工具的後端會收到相同的專用 OpenClaw
  MCP 伺服器。
- 原生工具永遠啟用或狀態未知的後端，會在推論前採取封閉式失敗；它們
  無法承載 OpenClaw 工作階段。

只有 OpenClaw 工作階段會取得 openclaw MCP 伺服器；一般代理程式執行
永遠不會看到此工具。因此，可選取／無原生工具的命令列介面後端與 API 金鑰模型
會強制執行字面上的單一工具迴圈。Codex app-server 模型會強制使用
一個 OpenClaw 授權工具，加上無作用的原生規劃公用工具。在這
三種情況下，設定寫入仍僅限於 OpenClaw 經稽核的核准
合約。

Gemini CLI 仍可供一般代理程式使用，但它無法強制執行
推論閘門所需的無工具探測，因此無法承載 OpenClaw。

## 切換至代理程式

使用自然語言選擇器離開 OpenClaw，並開啟一般終端介面：

```text
與代理程式交談
與 work 代理程式交談
切換至 main 代理程式
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 會直接開啟一般代理程式終端介面；它們不會啟動 OpenClaw。切換至一般終端介面後，`/openclaw` 會返回 OpenClaw，並可選擇附帶後續要求：

```text
/openclaw
/openclaw restart gateway
```

## 訊息救援模式

訊息救援模式是 OpenClaw 的訊息通道進入點：當一般代理程式無法運作，但受信任的通道（例如 WhatsApp）仍能接收命令時，請使用此模式。

這是確定性的緊急命令處理常式，而非對話式
OpenClaw 代理程式。它不會啟動全新的設定流程，也不會放寬 OpenClaw
聊天的推論閘門。

支援的命令：`/openclaw <request>`。救援功能僅接受完全符合規則的輸入命令語法——自然語言會遭拒絕並顯示提示，絕不會被猜測為某項操作，也絕不會查詢任何模型。

```text
你，在受信任的擁有者私訊中：/openclaw status
OpenClaw：OpenClaw 救援模式。閘道可連線：否。設定有效：否。
你：/openclaw restart gateway
OpenClaw：計畫：重新啟動閘道。回覆 /openclaw yes 以套用。
你：/openclaw yes
OpenClaw：已套用。已寫入稽核項目。
```

也可在本機或透過救援功能將代理程式建立作業排入佇列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

建立代理程式時，只能指定目前經即時驗證的預設模型。省略
模型即可繼承該路由。

遠端救援是管理介面，必須將其視為遠端設定修復，而非一般聊天。

遠端救援的安全性合約：

- 當代理程式／工作階段的沙箱處理啟用時停用；OpenClaw 會拒絕遠端救援，並引導使用本機命令列介面修復。
- 預設有效狀態為 `auto`：僅允許在受信任的 YOLO 操作中進行遠端救援，此時執行階段已具有不受沙箱限制的本機權限（`tools.exec.security` 解析為 `full`，且 `tools.exec.ask` 解析為 `off`，沙箱模式則為 `off`）。
- 需要明確的擁有者身分；不允許萬用字元傳送者規則、開放群組政策、未經驗證的網路鉤子或匿名通道。
- 預設僅限擁有者私訊；群組／通道救援需要明確選擇啟用。
- 外掛搜尋與清單僅供讀取。外掛安裝一律只能在本機執行（即使原本已啟用，仍會在救援模式中遭封鎖），因為它會下載可執行程式碼。本機 OpenClaw 與救援模式都會拒絕解除安裝外掛；請從終端機執行 `openclaw plugins uninstall <id>`。
- 遠端救援無法開啟本機終端介面，也無法切換至互動式代理程式工作階段；請使用本機 `openclaw` 進行代理程式交接。
- 即使在救援模式下，持久性寫入仍需要核准。
- 待處理的核准僅能使用一次。同一帳號、通道及傳送者發出的任何較新救援命令，都會撤銷較舊的計畫；執行失敗也會耗用核准，因此若要重試，請重新傳送命令。
- 每項已套用的救援操作都會受到稽核。訊息通道救援會記錄通道、帳號、傳送者及來源位址中繼資料；修改設定的操作也會記錄變更前後的設定雜湊。
- 絕不回顯密鑰。SecretRef 檢查會回報可用性，而非其值。
- 若閘道仍在運作，救援功能會優先使用閘道的型別化操作；若閘道已停止運作，救援功能只會使用不依賴一般代理程式迴圈的最小本機修復介面。

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

- `enabled`：`"auto"`（預設值）僅在有效執行階段為 YOLO 且沙箱處理關閉時允許救援；`false` 絕不允許訊息通道救援；`true` 會在擁有者／通道檢查通過時明確允許救援（仍受沙箱處理拒絕規則約束）。
- `ownerDmOnly`：將救援限制為擁有者直接訊息。預設值為 `true`。
- `pendingTtlMinutes`：待處理的救援寫入在到期前，可保持開放以等待 `/openclaw yes` 核准的時間長度。預設值為 `15`。

`openclaw doctor --fix` 會將舊版 `crestodian` 設定區塊遷移至
`systemAgent`。執行階段只會讀取標準區塊。

遠端救援由下列 Docker 測試通道涵蓋：

```bash
pnpm test:docker:system-agent-rescue
```

選擇啟用的即時通道命令介面煙霧測試會檢查 `/openclaw status`，並透過救援處理常式執行一次持久性核准往返流程：

```bash
pnpm test:live:system-agent-rescue-channel
```

受推論閘門控管的封裝版一次性設定由下列項目涵蓋：

```bash
pnpm test:docker:system-agent-first-run
```

該封裝版命令列介面測試通道會從空白狀態目錄開始，並證明 OpenClaw
在沒有推論時會採取封閉式失敗。接著，它會透過
封裝版啟用模組測試並啟用假的 Claude。只有在此之後，模糊要求才會傳送至
規劃器並解析為型別化設定，接著執行一次性命令，以建立
額外的代理程式、透過啟用外掛及權杖
SecretRef 設定 Discord、驗證設定，並檢查稽核記錄。此測試通道提供
閘門／操作的佐證；它不會測試互動式上線引導或
OpenClaw 代理程式／工具／核准對話。下方的 QA Lab 情境會重新導向
相同的 Docker 測試通道：

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## 相關內容

- [命令列介面參考資料](/zh-TW/cli)
- [Doctor](/zh-TW/cli/doctor)
- [終端介面](/zh-TW/cli/tui)
- [沙箱](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
