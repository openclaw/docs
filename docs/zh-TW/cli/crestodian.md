---
read_when:
    - 您未帶任何命令執行 openclaw，並想了解 Crestodian
    - 你需要一種在無設定檔情況下仍安全的方式來檢查或修復 OpenClaw
    - 你正在設計或啟用訊息通道救援模式
summary: Crestodian 的 CLI 參考與安全模型，這是一個無需設定也安全的設置與修復輔助工具
title: Crestodian
x-i18n:
    generated_at: "2026-05-10T19:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本機設定、修復與設定檔輔助工具。它設計成在一般代理路徑故障時仍可存取。

不帶命令執行 `openclaw` 會在互動式終端機中啟動 Crestodian。執行 `openclaw crestodian` 則會明確啟動同一個輔助工具。

## Crestodian 顯示的內容

啟動時，互動式 Crestodian 會開啟與 `openclaw tui` 相同的 TUI shell，並使用 Crestodian 聊天後端。聊天記錄會以簡短問候開頭：

- 何時啟動 Crestodian
- Crestodian 實際使用的模型或確定性規劃器路徑
- 設定有效性與預設代理
- 第一次啟動探測取得的 Gateway 可達性
- Crestodian 可以執行的下一個除錯動作

它不會傾印秘密，也不會為了啟動而載入 Plugin CLI 命令。TUI 仍提供一般的標頭、聊天記錄、狀態列、頁尾、自動完成與編輯器控制項。

使用 `status` 取得詳細清單，其中包含設定路徑、文件/原始碼路徑、本機 CLI 探測、API 金鑰存在狀態、代理、模型與 Gateway 詳細資訊。

Crestodian 使用與一般代理相同的 OpenClaw 參考資料探索。在 Git checkout 中，它會指向本機 `docs/` 與本機原始碼樹。在 npm 套件安裝中，它會使用隨附的套件文件，並連結到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，且明確建議在文件不足時檢視原始碼。

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

在 Crestodian TUI 中：

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

## 安全啟動

Crestodian 的啟動路徑刻意保持精簡。它可以在下列情況執行：

- 缺少 `openclaw.json`
- `openclaw.json` 無效
- Gateway 已關閉
- Plugin 命令註冊無法使用
- 尚未設定任何代理

`openclaw --help` 與 `openclaw --version` 仍使用一般快速路徑。非互動式 `openclaw` 會以簡短訊息結束，而不是列印根說明，因為無命令產品就是 Crestodian。

## 操作與核准

Crestodian 使用具型別的操作，而不是臨時編輯設定檔。

唯讀操作可以立即執行：

- 顯示概覽
- 列出代理
- 列出已安裝的 Plugin
- 搜尋 ClawHub Plugin
- 顯示模型/後端狀態
- 執行狀態或健康檢查
- 檢查 Gateway 可達性
- 執行 doctor，但不進行互動式修復
- 驗證設定
- 顯示稽核記錄路徑

除非你為直接命令傳入 `--yes`，否則持久化操作在互動模式中需要對話式核准：

- 寫入設定
- 執行 `config set`
- 透過 `config set-ref` 設定支援的 SecretRef 值
- 執行設定/上手 bootstrap
- 變更預設模型
- 啟動、停止或重新啟動 Gateway
- 建立代理
- 從 ClawHub 或 npm 安裝 Plugin
- 解除安裝 Plugin
- 執行會重寫設定或狀態的 doctor 修復

套用的寫入會記錄在：

```text
~/.openclaw/audit/crestodian.jsonl
```

探索不會被稽核。只會記錄已套用的操作與寫入。

`openclaw onboard --modern` 會以現代上手預覽模式啟動 Crestodian。單純的 `openclaw onboard` 仍會執行傳統上手流程。

## 設定 bootstrap

`setup` 是以聊天為優先的上手 bootstrap。它只會透過具型別的設定操作寫入，並會先要求核准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

未設定模型時，setup 會依此順序選取第一個可用後端，並告訴你它選了什麼：

- 既有的明確模型，如果已設定
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

如果都不可用，setup 仍會寫入預設工作區，並讓模型保持未設定。安裝或登入 Codex/Claude Code，或公開 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然後再次執行 setup。

## 模型輔助規劃器

Crestodian 一律以確定性模式啟動。對於確定性剖析器無法理解的模糊命令，本機 Crestodian 可以透過 OpenClaw 的一般執行階段路徑進行一次受限的規劃器回合。它會先使用已設定的 OpenClaw 模型。如果尚無可用的已設定模型，它可以退回使用機器上已存在的本機執行階段：

- Claude Code CLI：`claude-cli/claude-opus-4-7`
- Codex app-server harness：`openai/gpt-5.5`
- Codex CLI：`codex-cli/gpt-5.5`

模型輔助規劃器不能直接變更設定。它必須把請求翻譯成 Crestodian 的其中一個具型別命令，然後套用一般核准與稽核規則。Crestodian 會在執行任何操作前列印它使用的模型與解譯後的命令。無設定檔的退回規劃器回合是暫時的、在執行階段支援時會停用工具，並使用暫時工作區/工作階段。

訊息通道救援模式不使用模型輔助規劃器。遠端救援保持確定性，讓故障或遭入侵的一般代理路徑無法被當成設定編輯器使用。

## 切換到代理

使用自然語言選擇器離開 Crestodian 並開啟一般 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 與 `openclaw terminal` 仍會直接開啟一般代理 TUI。它們不會啟動 Crestodian。

切換到一般 TUI 後，使用 `/crestodian` 返回 Crestodian。你可以包含後續請求：

```text
/crestodian
/crestodian restart gateway
```

TUI 內的代理切換會留下提示，指出 `/crestodian` 可用。

## 訊息救援模式

訊息救援模式是 Crestodian 的訊息通道進入點。它用於一般代理已失效，但 WhatsApp 等可信通道仍能接收命令的情況。

支援的文字命令：

- `/crestodian <request>`

操作員流程：

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

也可以從本機提示或救援模式將代理建立排入佇列：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

遠端救援模式是管理介面。它必須被視為遠端設定修復，而不是一般聊天。

遠端救援的安全合約：

- 沙盒啟用時停用。如果代理/工作階段已沙盒化，Crestodian 必須拒絕遠端救援，並說明需要本機 CLI 修復。
- 預設有效狀態為 `auto`：僅在可信 YOLO 操作中允許遠端救援，此時執行階段已具備未沙盒化的本機權限。
- 要求明確的擁有者身分。救援不得接受萬用字元寄件者規則、開放群組政策、未驗證的 Webhook 或匿名通道。
- 預設僅限擁有者私訊。群組/通道救援需要明確選擇加入。
- Plugin 搜尋與列出為唯讀。Plugin 安裝預設僅限本機，因為它會下載可執行程式碼。當救援政策允許持久化寫入時，Plugin 解除安裝可作為經核准的修復操作允許執行。
- 遠端救援不能開啟本機 TUI 或切換到互動式代理工作階段。使用本機 `openclaw` 進行代理交接。
- 即使在救援模式中，持久化寫入仍需要核准。
- 稽核每個已套用的救援操作。訊息通道救援會記錄通道、帳號、寄件者與來源位址中繼資料。會變更設定的操作也會記錄變更前後的設定雜湊。
- 絕不回顯秘密。SecretRef 檢查應回報可用性，而不是值。
- 如果 Gateway 存活，偏好使用 Gateway 具型別操作。如果 Gateway 已失效，只使用不依賴一般代理迴圈的最小本機修復介面。

設定形狀：

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` 應接受：

- `"auto"`：預設。僅在有效執行階段為 YOLO 且沙盒關閉時允許。
- `false`：絕不允許訊息通道救援。
- `true`：當擁有者/通道檢查通過時明確允許救援。這仍不得繞過沙盒拒絕。

預設 `"auto"` YOLO 態勢為：

- sandbox mode 解析為 `off`
- `tools.exec.security` 解析為 `full`
- `tools.exec.ask` 解析為 `off`

遠端救援由 Docker lane 涵蓋：

```bash
pnpm test:docker:crestodian-rescue
```

無設定檔的本機規劃器退回由下列測試涵蓋：

```bash
pnpm test:docker:crestodian-planner
```

選擇加入的即時通道命令介面 smoke 會檢查 `/crestodian status`，並透過救援處理常式檢查一次持久化核准往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

透過 Crestodian 進行全新無設定檔 setup 由下列測試涵蓋：

```bash
pnpm test:docker:crestodian-first-run
```

該 lane 會以空狀態目錄開始，將裸 `openclaw` 路由到 Crestodian，設定預設模型，建立額外代理，透過 Plugin 啟用加上 token SecretRef 設定 Discord，驗證設定，並檢查稽核記錄。QA Lab 也有同一個 Ring 0 流程的 repo-backed 情境：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Doctor](/zh-TW/cli/doctor)
- [TUI](/zh-TW/cli/tui)
- [沙盒](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
