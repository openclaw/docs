---
read_when:
    - 你在不帶任何命令的情況下執行 openclaw，並想了解 Crestodian
    - 你需要一種無需設定也能安全檢查或修復 OpenClaw 的方式
    - 您正在設計或啟用訊息通道救援模式
summary: Crestodian 的 CLI 參考與安全模型，Crestodian 是可安全無設定執行的設定與修復輔助工具
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T20:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本機設定、修復和設定檔協助工具。它的設計目標是在一般 agent 路徑損壞時仍可使用。

不帶命令執行 `openclaw` 會在互動式終端機中啟動 Crestodian。
執行 `openclaw crestodian` 會明確啟動同一個協助工具。

## Crestodian 顯示的內容

啟動時，互動式 Crestodian 會開啟與 `openclaw tui` 相同的 TUI shell，並使用 Crestodian 聊天後端。聊天記錄會以一段簡短問候開始：

- 何時啟動 Crestodian
- Crestodian 實際使用的模型或確定性規劃器路徑
- 設定檔有效性和預設 agent
- 來自第一次啟動探測的 Gateway 可達性
- Crestodian 可以採取的下一個除錯動作

它不會傾印祕密，也不會只為了啟動而載入 Plugin CLI 命令。TUI 仍會提供一般的標頭、聊天記錄、狀態列、頁尾、自動完成和編輯器控制項。

使用 `status` 可取得包含設定檔路徑、文件/來源路徑、本機 CLI 探測、API 金鑰存在狀態、agents、模型和 Gateway 詳細資料的詳細清單。

Crestodian 使用與一般 agents 相同的 OpenClaw 參考探索。在 Git checkout 中，它會指向本機 `docs/` 和本機來源樹。在 npm 套件安裝中，它會使用隨附的套件文件，並連結到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同時明確建議在文件不足時檢閱原始碼。

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

在 Crestodian TUI 內：

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

Crestodian 的啟動路徑刻意保持精簡。它可以在以下情況執行：

- `openclaw.json` 缺失
- `openclaw.json` 無效
- Gateway 已停用
- Plugin 命令註冊無法使用
- 尚未設定任何 agent

`openclaw --help` 和 `openclaw --version` 仍會使用一般快速路徑。
非互動式 `openclaw` 會以簡短訊息結束，而不是列印根說明，因為無命令產品就是 Crestodian。

## 操作與核准

Crestodian 使用具型別的操作，而不是臨時編輯設定檔。

唯讀操作可以立即執行：

- 顯示概覽
- 列出 agents
- 列出已安裝的 Plugins
- 搜尋 ClawHub Plugins
- 顯示模型/後端狀態
- 執行狀態或健康檢查
- 檢查 Gateway 可達性
- 執行 doctor，但不執行互動式修復
- 驗證設定檔
- 顯示稽核記錄路徑

在互動模式中，持久性操作需要對話式核准，除非你為直接命令傳入 `--yes`：

- 寫入設定檔
- 執行 `config set`
- 透過 `config set-ref` 設定支援的 SecretRef 值
- 執行 setup/onboarding bootstrap
- 變更預設模型
- 啟動、停止或重新啟動 Gateway
- 建立 agents
- 從 ClawHub 或 npm 安裝 Plugins
- 解除安裝 Plugins
- 執行會重寫設定檔或狀態的 doctor 修復

已套用的寫入會記錄在：

```text
~/.openclaw/audit/crestodian.jsonl
```

探索不會被稽核。只會記錄已套用的操作和寫入。

`openclaw onboard --modern` 會以現代 onboarding 預覽啟動 Crestodian。
單純的 `openclaw onboard` 仍會執行傳統 onboarding。

## 設定 bootstrap

`setup` 是以聊天為優先的 onboarding bootstrap。它只會透過具型別的設定操作寫入，並會先要求核准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

未設定模型時，setup 會依以下順序選擇第一個可用後端，並告訴你它選擇了什麼：

- 既有明確模型，如果已設定
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

如果都不可用，setup 仍會寫入預設工作區，並讓模型維持未設定。安裝或登入 Codex/Claude Code，或公開 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然後再次執行 setup。

## 模型輔助規劃器

Crestodian 一律以確定性模式啟動。對於確定性剖析器無法理解的模糊命令，本機 Crestodian 可以透過 OpenClaw 的一般執行階段路徑進行一次有界的規劃器回合。它會先使用已設定的 OpenClaw 模型。如果尚無可用的已設定模型，它可以退回到機器上已存在的本機執行階段：

- Claude Code CLI：`claude-cli/claude-opus-4-7`
- Codex app-server harness：`openai/gpt-5.5` 搭配 `agentRuntime.id: "codex"`
- Codex CLI：`codex-cli/gpt-5.5`

模型輔助規劃器不能直接變更設定檔。它必須將請求轉譯為 Crestodian 的其中一個具型別命令，之後一般核准和稽核規則就會套用。Crestodian 會在執行任何動作前列印它使用的模型和解讀後的命令。無設定檔的退回規劃器回合是暫時性的，在執行階段支援時會停用工具，並使用暫時工作區/session。

訊息通道救援模式不使用模型輔助規劃器。遠端救援保持確定性，因此損壞或遭入侵的一般 agent 路徑不能被用作設定檔編輯器。

## 切換到 agent

使用自然語言選擇器離開 Crestodian 並開啟一般 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 仍會直接開啟一般 agent TUI。它們不會啟動 Crestodian。

切換到一般 TUI 之後，使用 `/crestodian` 返回 Crestodian。
你可以包含後續請求：

```text
/crestodian
/crestodian restart gateway
```

TUI 內的 agent 切換會留下提示，表示 `/crestodian` 可用。

## 訊息救援模式

訊息救援模式是 Crestodian 的訊息通道進入點。它適用於你的正常 agent 已停止運作，但 WhatsApp 等可信通道仍可接收命令的情況。

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

也可以從本機提示或救援模式排入 agent 建立作業：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

遠端救援模式是管理員介面。它必須被視為遠端設定檔修復，而不是一般聊天。

遠端救援的安全合約：

- 沙箱啟用時停用。如果 agent/session 已被沙箱化，Crestodian 必須拒絕遠端救援，並說明需要本機 CLI 修復。
- 預設有效狀態是 `auto`：只在可信 YOLO 操作中允許遠端救援，此時執行階段已具備未沙箱化的本機權限。
- 需要明確的擁有者身分。救援不得接受萬用字元寄件者規則、開放群組政策、未驗證的 webhooks 或匿名通道。
- 預設僅允許擁有者 DM。群組/通道救援需要明確選擇加入。
- Plugin 搜尋和清單是唯讀的。Plugin 安裝預設僅限本機，因為它會下載可執行程式碼。當救援政策允許持久性寫入時，可以允許 Plugin 解除安裝作為已核准的修復操作。
- 遠端救援不能開啟本機 TUI，也不能切換到互動式 agent session。使用本機 `openclaw` 進行 agent 交接。
- 即使在救援模式中，持久性寫入仍需要核准。
- 稽核每個已套用的救援操作。訊息通道救援會記錄通道、帳戶、寄件者和來源位址中繼資料。變更設定檔的操作也會記錄變更前後的設定檔雜湊。
- 絕不回顯祕密。SecretRef 檢查應回報可用性，而不是值。
- 如果 Gateway 存活，優先使用 Gateway 具型別操作。如果 Gateway 已停止，則只使用不依賴一般 agent 迴圈的最小本機修復介面。

設定檔形狀：

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

- `"auto"`：預設。僅在有效執行階段為 YOLO 且沙箱關閉時允許。
- `false`：永不允許訊息通道救援。
- `true`：在擁有者/通道檢查通過時明確允許救援。這仍不得繞過沙箱拒絕。

預設 `"auto"` YOLO 姿態是：

- 沙箱模式解析為 `off`
- `tools.exec.security` 解析為 `full`
- `tools.exec.ask` 解析為 `off`

遠端救援由 Docker 路線涵蓋：

```bash
pnpm test:docker:crestodian-rescue
```

無設定檔本機規劃器退回由以下項目涵蓋：

```bash
pnpm test:docker:crestodian-planner
```

選擇加入的即時通道命令介面煙霧測試會檢查 `/crestodian status`，以及透過救援處理器進行的持久性核准來回：

```bash
pnpm test:live:crestodian-rescue-channel
```

透過 Crestodian 的全新無設定檔 setup 由以下項目涵蓋：

```bash
pnpm test:docker:crestodian-first-run
```

該路線會從空的狀態目錄開始，將裸 `openclaw` 路由到 Crestodian，設定預設模型，建立額外 agent，透過 Plugin 啟用加上 token SecretRef 設定 Discord，驗證設定檔，並檢查稽核記錄。QA Lab 也有一個由 repo 支援、用於相同 Ring 0 流程的情境：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Doctor](/zh-TW/cli/doctor)
- [TUI](/zh-TW/cli/tui)
- [沙箱](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
