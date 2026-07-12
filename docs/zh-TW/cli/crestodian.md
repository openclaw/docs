---
read_when:
    - 你已完成推論設定，並希望由 Crestodian 設定其餘部分
    - 你需要使用本機設定代理程式檢查或修復 OpenClaw
    - 你正在設計或啟用訊息頻道救援模式
summary: 推論支援的 Crestodian 設定與修復輔助工具之命令列介面參考與安全模型
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T14:24:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

對話式 Crestodian 是 OpenClaw 的本機設定、修復與配置代理程式。它只會在有效的預設模型完成一次實際互動後啟動。全新安裝會先建立推論能力；格式錯誤的配置仍會沿用傳統的 doctor 流程。

## 啟動時機

執行沒有子命令的 `openclaw` 時，會根據配置狀態決定流程：

- 配置不存在，或雖存在但沒有使用者設定（空白，或僅有 `$schema`/`meta` 鍵）：啟動包含即時 AI 驗證的引導式初始設定。
- 配置存在但驗證失敗：啟動傳統初始設定，回報問題並引導你執行 `openclaw doctor`。
- 配置存在且有效：開啟一般代理程式終端介面。若已配置的閘道可連線，且其預設代理程式有模型，則會直接進入該介面，不經過初始設定或 Crestodian。之後可在終端介面中使用 `/crestodian`，或直接執行 `openclaw crestodian` 來進入 Crestodian。

執行 `openclaw crestodian` 時，會先對已配置的預設模型進行即時測試。互動成功後便會啟動 Crestodian。若互動模式下測試失敗，系統會開啟引導式推論設定，並在候選模型通過後轉交給 Crestodian。若推論無法使用，單次、JSON 與其他非互動式要求會失敗，並提示你執行 `openclaw onboard`。`openclaw --help` 與 `openclaw --version` 仍會沿用原本的快速路徑。

在非互動環境中執行不帶子命令的 `openclaw`（沒有 TTY）時，程式會顯示簡短訊息後結束，而不會輸出根命令說明：若是全新安裝或安裝配置無效，訊息會指向非互動式初始設定；若配置有效，則會指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 仍是 Crestodian 的相容性別名，但會使用相同的推論檢查關卡：推論正常時開啟聊天；互動模式失敗時啟動引導式推論設定；非互動模式失敗時則顯示初始設定指引後結束。`openclaw onboard --classic` 會開啟完整的逐步精靈。

## Crestodian 顯示的內容

互動式 Crestodian 會開啟與 `openclaw tui` 相同的終端介面外殼，並使用 Crestodian 聊天後端。啟動問候會涵蓋：

- 配置是否有效及預設代理程式
- Crestodian 正在使用的已驗證模型
- 第一次啟動探測所得的閘道連線狀態
- 下一個建議的偵錯動作

它不會傾印密鑰，也不會僅為了啟動而載入外掛命令列介面命令。

使用 `status` 可查看詳細清單：配置路徑、文件／原始碼路徑、本機命令列介面探測、金鑰／權杖是否存在、代理程式、模型與閘道詳細資料。

Crestodian 使用與一般代理程式相同的參考資料探索機制：在 Git 工作目錄中，它會指向本機 `docs/` 與原始碼樹；在 npm 安裝環境中，它會使用內附文件並連結至 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同時建議你在文件資訊不足時查閱原始碼。

## 範例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "模型"
openclaw crestodian --message "驗證配置"
openclaw crestodian --message "設定工作區 ~/Projects/work" --yes
openclaw crestodian --message "將預設模型設為 openai/gpt-5.6" --yes
openclaw onboard --modern
```

在 Crestodian 終端介面中：

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
建立代理程式 work，工作區為 ~/Projects/work
模型
配置模型提供者
將預設模型設為 openai/gpt-5.6
頻道
頻道資訊 slack
連接 slack
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

Crestodian 使用具型別的操作，而不是臨時編輯配置。

唯讀操作會立即執行：顯示概覽、列出代理程式、列出已安裝的外掛、搜尋 ClawHub 外掛、顯示模型／後端狀態、執行狀態／健康狀態檢查、檢查閘道連線、執行不含互動式修復的 doctor、驗證配置，以及顯示稽核記錄路徑。

啟動引導式頻道設定（`connect telegram`）也會立即執行。其精靈會收集明確的回答，並負責執行由此產生的寫入操作。

永久性操作需要透過對話核准（直接命令也可使用 `--yes`）：寫入配置、`config set`、`config set-ref`、設定／初始設定啟動程序、變更預設模型、啟動／停止／重新啟動閘道、建立代理程式，以及安裝外掛。

Crestodian 內無法執行 doctor 修復，因為修復可能會重寫支援目前工作階段的提供者、驗證機制或預設代理程式推論路由。請結束 Crestodian，並在終端機中執行 `openclaw doctor --fix`。Crestodian 內仍可使用唯讀的 `doctor`。

新代理程式會繼承經即時驗證的預設推論路由。代理程式 ID `crestodian` 保留給具特殊權限的虛擬管理員，無法建立為一般代理程式。

`config set` 和 `config set-ref` 無法變更推論路由狀態，
包括推論提供者的認證資訊、頂層 `auth.*`、模型目錄、
命令列介面後端、預設／各代理程式模型路由、代理程式參數／工具，或根層級
`tools.*`。也會拒絕直接寫入 `env.*`、`secrets.*`、`plugins.*` 和 `$include`，
因為這些寫入可能取代認證資訊解析或提供者啟用設定。閘道和頻道驗證仍是一般設定介面。請使用具型別的外掛／頻道工作流程，以及
`set default model <provider/model>` 來設定已完成
配置的路由；它會在儲存前即時測試該路由。若要設定或
修復提供者／驗證存取，請退出 Crestodian 並執行 `openclaw onboard`。

Crestodian 內不允許解除安裝外掛，因為移除提供者
外掛可能會停用支援此工作階段的推論路由。請退出 Crestodian，
並從終端機執行 `openclaw plugins uninstall <id>`。

你可以用自己的話表示核准：明確無誤的回覆（“是”、“當然”、“繼續”、“現在不要”）會依封閉的確定性清單判定。當已設定的路由支援獨立的補全呼叫時，其他回覆可以僅根據你的訊息與待處理提案進行分類——絕不由對話模型本身判定，因為它不能自行核准。無法分類或語意模糊的回覆會讓提案保持待處理狀態，且對話會再次詢問。

已套用的寫入會記錄於 `~/.openclaw/audit/crestodian.jsonl`。探索操作不會被稽核；只有已套用的操作和寫入才會。

頻道設定可以透過託管對話進行，直到需要輸入祕密為止。
本機 Crestodian 終端介面不接受設定精靈中的敏感答案，因為終端機
聊天輸入是可見的。它會立即提供 `open channel wizard`，將
選取的頻道帶入會遮蔽輸入的終端機設定精靈；你也可以稍後執行
`openclaw channels add --channel <channel>`。

### 切換至遮蔽輸入的頻道設定

本機聊天可以將控制權交給會遮蔽輸入的頻道設定精靈：

```text
為 slack 開啟頻道設定精靈
頻道資訊 slack
```

`open channel wizard for <channel>` 會在聊天
終端介面關閉後開啟會遮蔽輸入的頻道設定。請先使用 `channel info <channel>` 查看頻道標籤、設定
狀態、先決條件摘要和文件連結。

Crestodian 絕不會從自身工作階段內變更提供者／驗證存取：該
工作階段本身已依賴此推論路由。若要設定或
修復模型提供者，`configure model provider` 會傳回退出／初始設定指引，而不會
啟動設定精靈或寫入設定。請退出 Crestodian 並執行 `openclaw
onboard`；初始設定會暫存認證資訊，且只儲存能
完成實際即時輪次的路由。初始設定成功後，再次啟動 Crestodian。

## 設定啟動程序

在引導式初始設定已建立推論之後，`setup` 會設定其餘工作區和閘道狀態。它只會透過具型別的設定操作寫入，並先要求核准。

```text
設定
設定工作區 ~/Projects/work
```

`setup` 會保留經驗證的有效模型。它不會設定或
取代推論。

如果缺少推論，或其即時檢查失敗，請離開 Crestodian 並執行 `openclaw onboard`。引導式初始設定會偵測已設定的模型、API 金鑰和已驗證的本機命令列介面，要求每個候選項目實際回覆，且只持久保存通過檢查的路由。跨越此邊界後，Crestodian 會立即啟動，接著便可設定工作區、閘道、頻道、代理程式、外掛及其他選用功能。

當 macOS 應用程式連線至已設定的閘道，
且其預設代理程式已有設定好的模型時，會完全略過此階梯並開啟一般代理程式
使用者介面。
若是全新或未完整設定的閘道，應用程式會透過
`crestodian.setup.detect` 和 `crestodian.setup.activate` 閘道方法執行推論階梯：
detect 會列出找到的每個候選後端；activate 會即時測試一個
候選項目（實際執行一次「回覆 OK」補全），而且只有在測試通過後，才會持久保存該路由所需的模型、
認證資訊和提供者／執行階段狀態。工作區和閘道預設值仍交由 Crestodian 處理。失敗的候選項目
絕不會變更設定；應用程式會自動沿階梯向下嘗試，最後
提供手動金鑰／權杖步驟，其中的選項取自閘道目前啟用的
文字推論提供者外掛。所選提供者擁有自己的起始模型
和設定，且認證資訊會以相同方式驗證後才儲存。

Codex 監督及其他選用外掛功能不包含在此
推論啟用交易中。請只在推論正常運作且 Crestodian
已啟動後設定這些功能；推論設定期間不會變更現有外掛政策和明確的
監督退出設定。

## AI 對話

互動式 Crestodian 的自由形式對話會透過與一般 OpenClaw 代理程式相同的代理程式迴圈執行，且限制為只能使用一個零環級 OpenClaw 權限工具 `crestodian`，由它封裝具型別的操作。讀取動作可自由執行；變更操作需要你在對話中針對該項確切操作予以核准（請參閱「操作與核准」），而每次已套用的寫入都會被稽核並重新驗證。代理程式工作階段會持續存在，因此 Crestodian 具有真正的多輪記憶。如果經驗證的推論路由之後停止運作，請返回 `openclaw onboard` 修復，再繼續操作。

主機不會將自然語言要求剖析成操作。自由形式
訊息——包括看起來像命令的文字，以及「為什麼我的
閘道停止運作？」之類的問題——都會交給 AI，由 AI 透過
`crestodian` 工具將要求對應至具型別的操作。

當有變更操作待處理時，只有封閉清單中的明確
核准或拒絕詞句，才會在不使用推論的情況下判定。語意模糊的同意會交由
獨立設定的補全呼叫處理，否則以拒絕方式安全關閉。結構化
設定精靈欄位和精確的主機導覽屬於使用者介面控制項，而非自然語言
操作剖析。有一項祕密衛生例外尤其重要：對敏感路徑（權杖、金鑰、密碼）執行的
精確 `config set` 絕不會傳給
模型。主機會建立已遮蔽的提案，且該值會在
AI 可見的歷程記錄中遮蔽。祕密應優先使用 `config set-ref <path> env <ENV_VAR>`。

訊息頻道救援模式絕不使用模型輔助規劃器。遠端救援會維持確定性，避免損壞或遭入侵的一般代理程式路徑被用作設定編輯器。

### 命令列介面控制框架信任模型

內嵌執行階段和 Codex 應用程式伺服器控制框架會直接強制執行零環級
限制：該次執行會攜帶 OpenClaw 工具允許清單，其中僅包含
`crestodian` 工具。對於 Codex，OpenClaw 也會在該次執行中停用環境、原生
執行、多代理程式、目標、應用程式／外掛、Skills／MCP、網頁搜尋和
`request_user_input` 介面。Codex 仍會注入其無作用的原生 `update_plan`
公用工具；它可以更新模型的暫時檢查清單，但無法寫入檔案
或 OpenClaw 設定。命令列介面控制框架不會使用 OpenClaw 的允許清單，
因此 Crestodian 只接受其自身工具選擇契約可證明具備
相同限制的後端：

- 可選擇的後端（包括 Claude Code）啟動時不選取任何原生工具，且僅使用一個 MCP 工具 `crestodian`。Claude 產生的 MCP 設定會搭配 `--strict-mcp-config` 套用，因此不會載入其他 MCP 伺服器。
- 宣告沒有原生工具的後端會取得同一個專用的 Crestodian MCP 伺服器。
- 永久啟用原生工具或原生工具狀態未知的後端，會在推論前採取封閉式失敗；它們無法承載 Crestodian 工作階段。

只有 Crestodian 工作階段會取得 crestodian MCP 伺服器；一般代理程式執行永遠不會看到此工具。因此，可選擇／無原生工具的命令列介面後端與 API 金鑰模型會強制執行字面上的單一工具迴圈。Codex app-server 模型則強制僅使用一個 OpenClaw 權限工具，外加不具實際作用的原生規劃公用工具。在這三種情況下，設定寫入都只限於 Crestodian 經稽核的核准合約。

Gemini 命令列介面仍可供一般代理程式使用，但它無法強制執行推論閘門要求的無工具探測，因此無法承載 Crestodian。

## 切換至代理程式

使用自然語言選擇指令離開 Crestodian，並開啟一般終端介面：

```text
與代理程式交談
與工作代理程式交談
切換至主要代理程式
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 會直接開啟一般代理程式終端介面；它們不會啟動 Crestodian。切換至一般終端介面後，`/crestodian` 會返回 Crestodian，也可選擇附上後續要求：

```text
/crestodian
/crestodian restart gateway
```

## 訊息救援模式

訊息救援模式是透過訊息頻道進入 Crestodian 的進入點：當一般代理程式已停止運作，但受信任的頻道（例如 WhatsApp）仍可接收命令時，請使用此模式。

這是確定性的緊急命令處理常式，而非對話式 Crestodian 代理程式。它不會啟動全新的設定流程，也不會放寬 Crestodian 聊天的推論閘門。

支援的命令：`/crestodian <request>`。救援功能只接受完全符合所輸入命令的文法——自然語言會遭拒絕並附上提示，絕不會猜測並轉換成操作，也絕不會查詢任何模型。

```text
你在受信任的擁有者私訊中：/crestodian status
OpenClaw：Crestodian 救援模式。閘道可連線：否。設定有效：否。
你：/crestodian restart gateway
OpenClaw：計畫：重新啟動閘道。回覆 /crestodian yes 以套用。
你：/crestodian yes
OpenClaw：已套用。已寫入稽核項目。
```

也可以在本機或透過救援將建立代理程式的操作加入佇列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

建立代理程式時，只能指定目前已即時驗證的預設模型。省略模型即可繼承該路由。

遠端救援屬於管理介面，必須比照遠端設定修復處理，而非視為一般聊天。

遠端救援的安全性合約：

- 當代理程式／工作階段啟用沙箱時停用；Crestodian 會拒絕遠端救援，並引導使用本機命令列介面修復。
- 預設有效狀態為 `auto`：僅在受信任的 YOLO 操作中允許遠端救援，此時執行階段已具備不受沙箱限制的本機權限（`tools.exec.security` 解析為 `full`，且 `tools.exec.ask` 解析為 `off`，沙箱模式為 `off`）。
- 需要明確的擁有者身分；不允許萬用字元傳送者規則、開放式群組政策、未驗證的網路鉤子或匿名頻道。
- 預設僅限擁有者私訊；群組／頻道救援需明確選擇啟用。
- 外掛搜尋與列出功能為唯讀。外掛安裝一律僅限本機（即使在其他情況下已啟用，救援模式中仍會阻擋），因為它會下載可執行程式碼。本機 Crestodian 與救援模式都會拒絕解除安裝外掛；請從終端機執行 `openclaw plugins uninstall <id>`。
- 遠端救援無法開啟本機終端介面，也無法切換至互動式代理程式工作階段；請使用本機 `openclaw` 進行代理程式交接。
- 即使在救援模式中，永久性寫入仍需核准。
- 每項已套用的救援操作都會接受稽核。訊息頻道救援會記錄頻道、帳戶、傳送者及來源位址中繼資料；會變更設定的操作也會記錄變更前後的設定雜湊。
- 絕不回顯密鑰。SecretRef 檢查只會報告是否可用，不會顯示值。
- 若閘道仍在運作，救援會優先使用閘道的型別化操作；若閘道已停止運作，救援只會使用不依賴一般代理程式迴圈的最小本機修復介面。

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

- `enabled`：`"auto"`（預設）僅在有效執行階段為 YOLO 且沙箱停用時允許救援；`false` 絕不允許訊息頻道救援；`true` 會在擁有者／頻道檢查通過時明確允許救援（仍受沙箱拒絕條件限制）。
- `ownerDmOnly`：將救援限制於擁有者的直接訊息。預設為 `true`。
- `pendingTtlMinutes`：待處理的救援寫入在到期前，可保持開放以等待 `/crestodian yes` 核准的時間。預設為 `15`。

遠端救援由以下 Docker 測試管線涵蓋：

```bash
pnpm test:docker:crestodian-rescue
```

選擇啟用的即時頻道命令介面冒煙測試會檢查 `/crestodian status`，以及透過救援處理常式完成一次永久性核准往返流程：

```bash
pnpm test:live:crestodian-rescue-channel
```

受推論閘門控管的封裝版單次設定由以下測試涵蓋：

```bash
pnpm test:docker:crestodian-first-run
```

此封裝版命令列介面測試管線從空白狀態目錄開始，並證明 Crestodian 在沒有推論能力時會採取封閉式失敗。接著，它會透過封裝版啟用模組測試並啟用假的 Claude。只有在此之後，模糊要求才會送達規劃器並解析為型別化設定，接著執行多個單次命令：建立額外的代理程式、透過啟用外掛並設定權杖 SecretRef 來設定 Discord、驗證設定，以及檢查稽核記錄。此測試管線提供閘門／操作的佐證；它不會測試互動式初始設定，也不會測試 Crestodian 的代理程式／工具／核准對話。下方的 QA Lab 情境會重新導向至同一個 Docker 測試管線：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [診斷工具](/zh-TW/cli/doctor)
- [終端介面](/zh-TW/cli/tui)
- [沙箱](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
