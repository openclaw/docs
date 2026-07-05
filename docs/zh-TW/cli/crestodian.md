---
read_when:
    - 你在設定後不帶任何命令執行 openclaw，並想了解 Crestodian
    - 你需要一種不依賴設定且安全的方式來檢查或修復 OpenClaw
    - 你正在設計或啟用訊息頻道救援模式
summary: Crestodian 的命令列介面參考與安全模型，這是無需設定也安全的設定與修復輔助工具
title: Crestodian
x-i18n:
    generated_at: "2026-07-05T17:40:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: da05f022b0fbff985b89a96e29ef5e987e97e017a5e40d50dfe0daf7eb03bf4f
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本機設定、修復與組態輔助工具。當一般代理路徑損壞時，它仍可存取：在 `openclaw.json` 遺失或無效、閘道停用、外掛命令註冊不可用，或尚未設定任何代理時，它仍可執行。

## 啟動時機

執行沒有子命令的 `openclaw` 會依據設定狀態路由：

- 設定遺失，或存在但沒有使用者撰寫的設定（空白，或只有 `$schema`/`meta` 鍵）：啟動經典入門設定。
- 設定存在但驗證失敗：啟動 Crestodian。
- 設定存在且有效：開啟一般代理終端介面（連到可連線且已設定的閘道，若沒有可連線閘道則在本機開啟）。在終端介面內使用 `/crestodian`，或直接執行 `openclaw crestodian`，即可進入 Crestodian。

執行 `openclaw crestodian` 一律明確啟動 Crestodian，不受設定狀態影響。`openclaw --help` 和 `openclaw --version` 保持一般快速路徑。

非互動式的裸 `openclaw`（無 TTY）會以短訊息結束，而不是列印根說明：在全新安裝時指向非互動式入門設定；設定無效時指向 `openclaw crestodian --message "status"`；設定有效時指向 `openclaw agent --local ...`。

`openclaw onboard --modern` 會將 Crestodian 作為現代入門設定預覽啟動。純 `openclaw onboard` 保持經典入門設定。

## Crestodian 顯示內容

互動式 Crestodian 會開啟與 `openclaw tui` 相同的終端介面 shell，並使用 Crestodian 聊天後端。啟動問候會涵蓋：

- 設定有效性與預設代理
- Crestodian 正在使用的模型或確定性規劃器路徑
- 第一次啟動探測得到的閘道可連線性
- 下一個建議的除錯動作

它不會傾印機密，也不會為了啟動而載入外掛命令列介面命令。

使用 `status` 取得詳細清單：設定路徑、文件/原始碼路徑、本機命令列介面探測、API 金鑰存在狀態、代理、模型，以及閘道詳細資訊。

Crestodian 使用與一般代理相同的參考探索：在 Git checkout 中，它會指向本機 `docs/` 與原始碼樹；在 npm 安裝中，它會使用隨附文件並連結到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，並在文件不足時提示檢查原始碼。

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

在 Crestodian 終端介面內：

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

Crestodian 使用型別化操作，而不是臨時編輯設定。

唯讀，立即執行：顯示概覽、列出代理、列出已安裝外掛、搜尋 ClawHub 外掛、顯示模型/後端狀態、執行狀態/健康檢查、檢查閘道可連線性、執行不含互動式修復的 doctor、驗證設定、顯示稽核記錄路徑。

持久性，需要對話式核准（或對直接命令使用 `--yes`）：寫入設定、`config set`、`config set-ref`、設定/入門設定啟動、變更預設模型、啟動/停止/重新啟動閘道、建立代理、安裝或解除安裝外掛、執行會改寫設定或狀態的 doctor 修復。

已套用的寫入會記錄在 `~/.openclaw/audit/crestodian.jsonl`。探索不會稽核；只有已套用的操作與寫入會稽核。

通道設定可在主機支援遮罩輸入時以託管對話執行。本機 Crestodian 終端介面不接受敏感的精靈回答；相反地，它會引導你使用 `openclaw channels add --channel <channel>`，其互動式提示會遮罩憑證。

## 設定啟動

`setup` 是以聊天優先的入門設定啟動流程。它只透過型別化設定操作寫入，並且會先要求核准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

未設定模型時，setup 會依下列順序選擇第一個可用後端，並告訴你它選了什麼：

1. 現有明確模型（如果已設定）。
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code CLI -> `claude-cli/claude-opus-4-8`
5. Codex -> `openai/gpt-5.5`，透過 Codex app-server harness
6. Gemini CLI -> `google-gemini-cli/gemini-3.1-pro-preview`

如果都不可用，setup 仍會寫入預設工作區，並讓模型保持未設定。安裝或登入 Codex/Claude Code/Gemini CLI，或公開 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然後再次執行 setup。

macOS app 會透過 `crestodian.setup.detect` 與 `crestodian.setup.activate` 閘道方法驅動相同階梯：detect 會列出它找到的每個可重用後端，activate 會對一個候選項目做即時測試（一個真正的「以 OK 回覆」完成），且只會在測試通過後持久化模型、工作區與閘道預設值。失敗的候選項目永遠不會變更設定；app 會自動沿階梯向下嘗試，最後提供手動 API 金鑰步驟（Anthropic、OpenAI 或 Google），並以相同方式驗證後才儲存。

## 模型輔助規劃器

互動式 Crestodian 以 AI 優先。精確輸入的命令會立即且確定性地執行。其他每則訊息都會透過與一般 OpenClaw 代理相同的嵌入式代理迴圈執行，但限制為一個包裝型別化操作的零環 `crestodian` 工具：讀取動作可自由執行，變更需要你對該精確操作給出對話式 yes，且每個已套用寫入都會稽核並重新驗證。代理工作階段會持久保存，因此 custodian 具備真正的多輪記憶。它會先使用已設定的 OpenClaw 模型；若沒有可用模型，則回退到機器上已存在的本機執行階段：

- Claude Code CLI：`claude-cli/claude-opus-4-8`（代理迴圈；零環工具透過 MCP 提供，請參見下方信任模型）
- Codex app-server harness：`openai/gpt-5.5`（代理迴圈，強制單一工具允許清單）

代理迴圈不可用時，Crestodian 會降級為有界的單輪規劃器；沒有任何模型時，則降級為確定性型別化命令。規劃器不能直接變更設定；它必須將請求轉譯為 Crestodian 的其中一個型別化命令，並套用一般核准/稽核規則。Crestodian 會在執行任何動作前列印它使用的模型與解讀後的命令。回退規劃器回合是暫時的，在執行階段支援時會停用工具，並使用暫時工作區/工作階段。

訊息通道救援模式永遠不使用模型輔助規劃器。遠端救援保持確定性，避免損壞或遭入侵的一般代理路徑被用作設定編輯器。

### CLI harness 信任模型

嵌入式執行階段與 Codex app-server harness 會直接強制零環限制：執行時攜帶的工具允許清單只包含 `crestodian` 工具。CLI harness（Claude Code、Gemini CLI）無法強制 OpenClaw 工具允許清單 — CLI 擁有其原生工具與自身權限政策，因此若要求 OpenClaw 限制其中之一，OpenClaw 會以關閉狀態失敗。對於 CLI-harness 模型，Crestodian 改為：

- 注入專用 MCP 伺服器，該伺服器只提供 `crestodian` 工具，並在該次執行中取代 OpenClaw 的一般 MCP 工具表面（對 Claude Code 而言，產生的設定會以 `--strict-mcp-config` 套用，因此不會載入其他 MCP 伺服器），
- 將每個設定變更都保留在工具的核准與稽核合約內 — 讀取可自由執行，寫入需要你的對話式 yes，且每個已套用寫入都會稽核並重新驗證，
- 將原生工具（檔案讀取、shell）留給 harness。它們遵循與這台機器上一般 OpenClaw 代理執行相同的權限姿態：使用 OpenClaw 預設 exec 設定時，Claude Code 會以略過權限的方式執行，而受限制的 `tools.exec` 設定會回退到 CLI 自身的權限政策。

只有 Crestodian 工作階段會取得 crestodian MCP 伺服器；一般代理執行永遠看不到此工具。請將 CLI-harness 模型上的 Crestodian 工作階段視為同一主機上的一般本機代理執行：零環工具新增了一條經稽核、受核准門控的設定修復路徑，但不會阻止 harness 的原生工具直接觸碰檔案。Codex app-server 回退與 API-key 模型會強制嚴格的單一工具迴圈；當你需要硬性限制時，請優先使用它們。

## 切換到代理

使用自然語言選擇器離開 Crestodian 並開啟一般終端介面：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 會直接開啟一般代理終端介面；它們不會啟動 Crestodian。切換到一般終端介面後，`/crestodian` 會返回 Crestodian，可選擇附帶後續請求：

```text
/crestodian
/crestodian restart gateway
```

## 訊息救援模式

訊息救援模式是 Crestodian 的訊息通道進入點：當你的一般代理已失效，但可信任通道（例如 WhatsApp）仍能接收命令時使用。

支援的命令：`/crestodian <request>`。

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

代理建立也可以在本機或透過救援排入佇列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

遠端救援是管理介面，必須視為遠端設定修復，而非一般聊天。

遠端救援的安全合約：

- 代理/工作階段啟用沙箱時停用；Crestodian 會拒絕遠端救援，並指向本機命令列介面修復。
- 預設有效狀態為 `auto`：只在可信任 YOLO 操作中允許遠端救援，此時執行階段已具有未沙箱化的本機權限（`tools.exec.security` 解析為 `full`，且 `tools.exec.ask` 解析為 `off`，沙箱模式為 `off`）。
- 需要明確的擁有者身分；不允許萬用字元寄件者規則、開放群組政策、未驗證網路鉤子，或匿名通道。
- 預設僅限擁有者 DM；群組/通道救援需要明確選擇啟用。
- 外掛搜尋與列表為唯讀。外掛安裝一律僅限本機（在救援中封鎖，即使其他情況已啟用），因為它會下載可執行程式碼。外掛解除安裝可作為持久性救援操作核准。
- 遠端救援不能開啟本機終端介面，或切換到互動式代理工作階段；請使用本機 `openclaw` 進行代理交接。
- 持久性寫入即使在救援模式中仍需要核准。
- 每個已套用的救援操作都會稽核。訊息通道救援會記錄通道、帳號、寄件者與來源位址中繼資料；變更設定的操作也會記錄變更前後的設定雜湊。
- 機密永不回顯。SecretRef 檢查會回報可用性，而不是值。
- 若閘道存活，救援會優先使用閘道型別化操作；若閘道已死，救援只會使用不依賴一般代理迴圈的最小本機修復表面。

設定形狀：

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

- `enabled`：`"auto"`（預設）只會在有效執行階段為 YOLO 且沙盒已關閉時允許救援；`false` 永遠不允許訊息通道救援；`true` 會在擁有者/通道檢查通過時明確允許救援（仍受沙盒拒絕限制）。
- `ownerDmOnly`：將救援限制為擁有者直接訊息。預設為 `true`。
- `pendingTtlMinutes`：待處理救援寫入在到期前，保持開放以等待 `/crestodian yes` 核准的時間長度。預設為 `15`。

遠端救援由 Docker 路徑涵蓋：

```bash
pnpm test:docker:crestodian-rescue
```

無設定本機規劃器備援由以下涵蓋：

```bash
pnpm test:docker:crestodian-planner
```

一個選擇啟用的即時通道命令介面煙霧測試會檢查 `/crestodian status`，並透過救援處理器進行一次持久核准往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

透過明確 Crestodian 命令進行的無設定安裝由以下涵蓋：

```bash
pnpm test:docker:crestodian-first-run
```

該路徑會以空的狀態目錄開始，驗證現代 onboard Crestodian 進入點、設定預設模型、建立額外代理程式、透過外掛啟用加上權杖 SecretRef 設定 Discord、驗證設定，並檢查稽核日誌。QA Lab 針對相同的 Ring 0 流程有一個由 repo 支援的情境：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Doctor](/zh-TW/cli/doctor)
- [終端介面](/zh-TW/cli/tui)
- [沙盒](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
