---
read_when:
    - 你在設定後未加任何命令執行 openclaw，並想了解 Crestodian
    - 你需要一種在無設定檔情況下也安全的方式來檢查或修復 OpenClaw
    - 你正在設計或啟用訊息通道救援模式
summary: Crestodian 的命令列介面參考與安全模型，這是無需設定檔也安全的設定與修復輔助工具
title: Crestodian
x-i18n:
    generated_at: "2026-07-05T11:09:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: abe91886e3faeebc20203639cd811a515509e252e29b11fb7d710e9924cb556f
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本機設定、修復與組態輔助工具。當一般代理程式路徑故障時，它仍然可用：即使 `openclaw.json` 遺失或無效、閘道停擺、外掛命令註冊不可用，或尚未設定任何代理程式，它也能執行。

## 啟動時機

執行沒有子命令的 `openclaw` 會根據組態狀態進行路由：

- 組態遺失，或存在但沒有使用者撰寫的設定（空白，或只有 `$schema`/`meta` 鍵）：啟動傳統入門設定。
- 組態存在但驗證失敗：啟動 Crestodian。
- 組態存在且有效：開啟一般代理程式終端介面（連到可連線且已設定的閘道，若沒有可連線的閘道則在本機執行）。在終端介面中使用 `/crestodian`，或直接執行 `openclaw crestodian`，即可進入 Crestodian。

執行 `openclaw crestodian` 一律會明確啟動 Crestodian，不受組態狀態影響。`openclaw --help` 和 `openclaw --version` 保持其一般快速路徑。

非互動式的裸 `openclaw`（沒有 TTY）會以簡短訊息結束，而不是列印根說明：全新安裝時會指向非互動式入門設定；組態無效時會指向 `openclaw crestodian --message "status"`；組態有效時會指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 會以現代入門設定預覽啟動 Crestodian。一般的 `openclaw onboard` 會保留傳統入門設定。

## Crestodian 顯示內容

互動式 Crestodian 會開啟與 `openclaw tui` 相同的終端介面 shell，並使用 Crestodian 聊天後端。啟動問候會涵蓋：

- 組態有效性與預設代理程式
- Crestodian 正在使用的模型或確定性規劃器路徑
- 第一次啟動探測取得的閘道可達性
- 下一個建議的除錯動作

它不會傾印祕密，也不會只為了啟動而載入外掛命令列介面命令。

使用 `status` 取得詳細清單：組態路徑、文件/原始碼路徑、本機命令列介面探測、API 金鑰存在狀態、代理程式、模型，以及閘道詳細資訊。

Crestodian 使用與一般代理程式相同的參考資料探索：在 Git checkout 中，它會指向本機 `docs/` 和原始碼樹；在 npm 安裝中，它會使用隨附文件並連結到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，並在文件不足時提示檢查原始碼。

## 範例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

在 Crestodian 終端介面中：

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 操作與核准

Crestodian 使用具型別的操作，而不是臨時編輯組態。

唯讀、立即執行：顯示概觀、列出代理程式、列出已安裝外掛、搜尋 ClawHub 外掛、顯示模型/後端狀態、執行狀態/健康檢查、檢查閘道可達性、執行不含互動式修復的 doctor、驗證組態、顯示稽核記錄路徑。

持久性操作，需要對話式核准（或對直接命令使用 `--yes`）：寫入組態、`config set`、`config set-ref`、設定/入門 bootstrap、變更預設模型、啟動/停止/重新啟動閘道、建立代理程式、安裝或解除安裝外掛、執行會重寫組態或狀態的 doctor 修復。

已套用的寫入會記錄在 `~/.openclaw/audit/crestodian.jsonl`。探索不會被稽核；只有已套用的操作與寫入會被稽核。

當主機支援遮罩輸入時，頻道設定可以作為託管對話執行。本機 Crestodian 終端介面不接受敏感的精靈回答；它會改為引導你使用 `openclaw channels add --channel <channel>`，其互動提示會遮罩憑證。

## 設定 bootstrap

`setup` 是以聊天優先的入門設定 bootstrap。它只透過具型別的組態操作寫入，並會先要求核准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

當未設定模型時，setup 會依下列順序選擇第一個可用後端，並告訴你它選擇了什麼：

1. 現有的明確模型，如果已設定。
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code 命令列介面 -> `claude-cli/claude-opus-4-8`
5. Codex -> 透過 Codex app-server harness 使用 `openai/gpt-5.5`

如果都不可用，setup 仍會寫入預設工作區，並讓模型保持未設定。安裝或登入 Codex/Claude Code，或公開 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然後再次執行 setup。

## 模型輔助規劃器

互動式 Crestodian 以 AI 優先。精確輸入的命令會立即且確定性地執行。其他每則訊息都會透過與一般 OpenClaw 代理程式相同的嵌入式代理程式迴圈執行，但限制為一個 ring-zero `crestodian` 工具，用來包裝具型別操作：讀取動作可自由執行，變更需要你針對該精確操作以對話方式回覆 yes，而且每次已套用的寫入都會被稽核並重新驗證。代理程式工作階段會持續存在，因此 custodian 具備真正的多輪記憶。它會先使用已設定的 OpenClaw 模型；若沒有可用模型，則退回到機器上已存在的本機執行階段：

- Claude Code 命令列介面：`claude-cli/claude-opus-4-8`（代理程式迴圈；ring-zero 工具透過 MCP 提供，請見下方信任模型）
- Codex app-server harness：`openai/gpt-5.5`（具有強制單工具允許清單的代理程式迴圈）

當代理程式迴圈不可用時，Crestodian 會降級為有界單輪規劃器；若沒有任何模型，則降級為確定性的具型別命令。規劃器不能直接變更組態；它必須將要求轉換成 Crestodian 的其中一個具型別命令，且一般核准/稽核規則仍然適用。Crestodian 會先列印它使用的模型與解讀出的命令，再執行任何操作。後備規劃器輪次是暫時的，在執行階段支援時會停用工具，並使用暫時工作區/工作階段。

訊息頻道救援模式絕不使用模型輔助規劃器。遠端救援保持確定性，因此故障或遭入侵的一般代理程式路徑不能被用作組態編輯器。

### 命令列介面 harness 信任模型

嵌入式執行階段與 Codex app-server harness 會直接強制執行 ring-zero 限制：執行會攜帶只包含 `crestodian` 工具的工具允許清單。命令列介面 harness（Claude Code、Gemini CLI）無法強制套用 OpenClaw 工具允許清單，因為命令列介面擁有其原生工具與自身權限政策，所以若被要求限制某一個工具，OpenClaw 會以關閉方式失敗。對於命令列介面 harness 模型，Crestodian 會改為：

- 注入一個專用 MCP 伺服器，只提供 `crestodian` 工具，並在該次執行中取代 OpenClaw 一般的 MCP 工具表面（對 Claude Code 而言，產生的組態會以 `--strict-mcp-config` 套用，因此不會載入其他 MCP 伺服器），
- 將每一次組態變更都保留在該工具的核准與稽核合約內：讀取可自由執行，寫入需要你的對話式 yes，且每次已套用的寫入都會被稽核並重新驗證，
- 將原生工具（檔案讀取、shell）交給 harness。它們遵循與這台機器上一般 OpenClaw 代理程式執行相同的權限姿態：使用 OpenClaw 預設 exec 設定時，Claude Code 會以繞過權限的方式執行；受限制的 `tools.exec` 組態則會退回到命令列介面自己的權限政策。

只有 Crestodian 工作階段會取得 crestodian MCP 伺服器；一般代理程式執行永遠看不到此工具。將命令列介面 harness 模型上的 Crestodian 工作階段視為同一主機上的一般本機代理程式執行：ring-zero 工具新增一條受稽核、受核准閘控的組態修復路徑，但它不會阻止 harness 的原生工具直接碰觸檔案。Codex app-server 後備與 API 金鑰模型會強制執行嚴格的單工具迴圈；當你需要硬性限制時，請優先使用它們。

## 切換到代理程式

使用自然語言選擇器離開 Crestodian 並開啟一般終端介面：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 會直接開啟一般代理程式終端介面；它們不會啟動 Crestodian。切換到一般終端介面後，`/crestodian` 會返回 Crestodian，也可以選擇附帶後續要求：

```text
/crestodian
/crestodian restart gateway
```

## 訊息救援模式

訊息救援模式是 Crestodian 的訊息頻道進入點：當你的一般代理程式已失效，但可信頻道（例如 WhatsApp）仍可接收命令時使用。

支援的命令：`/crestodian <request>`。

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

代理程式建立也可以在本機或透過救援排入佇列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

遠端救援是管理員表面，必須被視為遠端組態修復，而不是一般聊天。

遠端救援的安全合約：

- 當代理程式/工作階段啟用沙盒時停用；Crestodian 會拒絕遠端救援並指向本機命令列介面修復。
- 預設有效狀態為 `auto`：僅在可信 YOLO 操作中允許遠端救援，也就是執行階段已具備未沙盒化的本機權限（`tools.exec.security` 解析為 `full`，且 `tools.exec.ask` 解析為 `off`，沙盒模式為 `off`）。
- 需要明確的擁有者身分；不允許萬用字元寄件者規則、開放群組政策、未驗證的網路鉤子，或匿名頻道。
- 預設僅限擁有者 DM；群組/頻道救援需要明確選擇啟用。
- 外掛搜尋與清單是唯讀。外掛安裝一律僅限本機（在救援中封鎖，即使其他情況下已啟用），因為它會下載可執行程式碼。外掛解除安裝可作為持久性救援操作核准。
- 遠端救援無法開啟本機終端介面，也無法切換到互動式代理程式工作階段；請使用本機 `openclaw` 進行代理程式交接。
- 即使在救援模式中，持久性寫入仍需要核准。
- 每個已套用的救援操作都會被稽核。訊息頻道救援會記錄頻道、帳號、寄件者與來源位址中繼資料；會變更組態的操作也會記錄變更前後的組態雜湊。
- 絕不回顯祕密。SecretRef 檢查會回報可用性，而不是值。
- 如果閘道存活，救援會優先使用閘道具型別操作；如果閘道已死，救援只使用不依賴一般代理程式迴圈的最小本機修復表面。

組態形狀：

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

- `enabled`：`"auto"`（預設）僅在有效執行階段為 YOLO 且沙盒關閉時允許救援；`false` 絕不允許訊息頻道救援；`true` 會在擁有者/頻道檢查通過時明確允許救援（仍受沙盒拒絕限制）。
- `ownerDmOnly`：將救援限制為擁有者直接訊息。預設 `true`。
- `pendingTtlMinutes`：待處理救援寫入在到期前可等待 `/crestodian yes` 核准的時間長度。預設 `15`。

遠端救援由 Docker lane 涵蓋：

```bash
pnpm test:docker:crestodian-rescue
```

無組態本機規劃器後備由以下項目涵蓋：

```bash
pnpm test:docker:crestodian-planner
```

可選啟用的即時頻道命令介面冒煙檢查會檢查 `/crestodian status`，並透過救援處理常式進行持久核准來回流程：

```bash
pnpm test:live:crestodian-rescue-channel
```

透過明確 Crestodian 命令進行的無設定檔設定涵蓋於：

```bash
pnpm test:docker:crestodian-first-run
```

該測試路徑會從空的狀態目錄開始，驗證現代 onboard Crestodian 進入點、設定預設模型、建立額外代理程式、透過外掛啟用與權杖 SecretRef 設定 Discord、驗證設定，並檢查稽核記錄。QA Lab 針對相同的 Ring 0 流程提供了由儲存庫支援的情境：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Doctor](/zh-TW/cli/doctor)
- [終端介面](/zh-TW/cli/tui)
- [沙盒](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
