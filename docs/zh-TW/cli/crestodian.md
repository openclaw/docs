---
read_when:
    - 您在完成設定後執行 openclaw 且未帶任何命令，並想了解 Crestodian
    - 你需要一種不依賴設定且安全的方式來檢查或修復 OpenClaw
    - 你正在設計或啟用訊息頻道救援模式
summary: Crestodian 的命令列介面參考與安全模型，這是無需設定也安全的設定與修復輔助工具
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T19:04:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本機設定、修復與組態輔助工具。它設計成在一般代理程式路徑故障時仍可存取。

當作用中的組態檔遺失，或沒有作者撰寫的設定（空白或僅含中繼資料）時，執行不帶命令的 `openclaw` 會先啟動傳統上手流程。組態檔有作者撰寫的設定後，執行不帶命令的 `openclaw` 會在互動式終端機中啟動 Crestodian。執行 `openclaw crestodian` 則會明確啟動同一個輔助工具。

## Crestodian 顯示的內容

啟動時，互動式 Crestodian 會開啟與 `openclaw tui` 相同的終端介面 shell，並使用 Crestodian 聊天後端。聊天記錄會以簡短問候開始：

- 何時啟動 Crestodian
- Crestodian 實際使用的模型或確定性規劃器路徑
- 組態有效性與預設代理程式
- 第一次啟動探測中的閘道可達性
- Crestodian 可採取的下一個除錯動作

它不會傾印祕密，也不會僅為了啟動而載入外掛命令列介面命令。終端介面仍會提供一般的標頭、聊天記錄、狀態列、頁尾、自動完成與編輯器控制項。

使用 `status` 可取得詳細清單，其中包含組態路徑、文件/原始碼路徑、本機命令列介面探測、API 金鑰存在狀態、代理程式、模型與閘道詳細資訊。

Crestodian 使用與一般代理程式相同的 OpenClaw 參考資料探索。在 Git checkout 中，它會指向本機 `docs/` 與本機原始碼樹。在 npm 套件安裝中，它會使用隨附的套件文件，並連結到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，且明確指引在文件不足時檢視原始碼。

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

## 安全啟動

Crestodian 的啟動路徑刻意保持精簡。它可在下列情況下執行：

- `openclaw.json` 遺失
- `openclaw.json` 無效
- 閘道已停止
- 外掛命令註冊無法使用
- 尚未設定任何代理程式

`openclaw --help` 與 `openclaw --version` 仍使用一般快速路徑。非互動式的裸 `openclaw` 會以簡短訊息結束，而不是列印根說明。在全新安裝時，訊息會指向非互動式上手流程；設定後，則會指向一次性 Crestodian 命令。

## 操作與核准

Crestodian 使用型別化操作，而不是臨時編輯組態。

唯讀操作可立即執行：

- 顯示概覽
- 列出代理程式
- 列出已安裝的外掛
- 搜尋 ClawHub 外掛
- 顯示模型/後端狀態
- 執行狀態或健康檢查
- 檢查閘道可達性
- 執行 doctor 但不進行互動式修復
- 驗證組態
- 顯示稽核記錄路徑

持久性操作在互動模式中需要對話式核准，除非你對直接命令傳入 `--yes`：

- 寫入組態
- 執行 `config set`
- 透過 `config set-ref` 設定支援的 SecretRef 值
- 執行設定/上手啟動程序
- 變更預設模型
- 啟動、停止或重新啟動閘道
- 建立代理程式
- 從 ClawHub 或 npm 安裝外掛
- 解除安裝外掛
- 執行會重寫組態或狀態的 doctor 修復

已套用的寫入會記錄於：

```text
~/.openclaw/audit/crestodian.jsonl
```

探索不會被稽核。只會記錄已套用的操作與寫入。

`openclaw onboard --modern` 會以現代上手流程預覽的形式啟動 Crestodian。純 `openclaw onboard` 仍會執行傳統上手流程。

## 設定啟動程序

`setup` 是以聊天為優先的上手啟動程序。它只會透過型別化組態操作寫入，並且會先要求核准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

未設定模型時，設定會依下列順序選取第一個可用後端，並告知你所選內容：

- 現有明確模型（若已設定）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> 透過 Codex app-server harness 使用 `openai/gpt-5.5`

如果沒有任何可用項目，設定仍會寫入預設工作區，並讓模型保持未設定。安裝或登入 Codex/Claude Code，或公開 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然後再次執行設定。

## 模型輔助規劃器

Crestodian 一律以確定性模式啟動。對於確定性剖析器無法理解的模糊命令，本機 Crestodian 可以透過 OpenClaw 的一般執行階段路徑進行一次有界規劃器回合。它會先使用已設定的 OpenClaw 模型。如果尚無可用的已設定模型，它可以退回到機器上已存在的本機執行階段：

- Claude Code CLI：`claude-cli/claude-opus-4-8`
- Codex app-server harness：`openai/gpt-5.5`

模型輔助規劃器無法直接變更組態。它必須將請求轉譯為 Crestodian 的其中一個型別化命令，然後套用一般核准與稽核規則。Crestodian 會在執行任何項目前列印它使用的模型與解讀後的命令。無組態退回規劃器回合是暫時性的，會在執行階段支援時停用工具，並使用暫時工作區/工作階段。

訊息通道救援模式不使用模型輔助規劃器。遠端救援保持確定性，因此故障或受入侵的一般代理程式路徑無法被用作組態編輯器。

## 切換到代理程式

使用自然語言選擇器離開 Crestodian 並開啟一般終端介面：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 與 `openclaw terminal` 仍會直接開啟一般代理程式終端介面。它們不會啟動 Crestodian。

切換到一般終端介面後，使用 `/crestodian` 返回 Crestodian。你可以包含後續請求：

```text
/crestodian
/crestodian restart gateway
```

終端介面內的代理程式切換會留下提示，表示 `/crestodian` 可用。

## 訊息救援模式

訊息救援模式是 Crestodian 的訊息通道進入點。它適用於一般代理程式已失效，但 WhatsApp 等受信任通道仍可接收命令的情況。

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

也可以從本機提示或救援模式佇列代理程式建立：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

遠端救援模式是管理員介面。它必須被視為遠端組態修復，而不是一般聊天。

遠端救援的安全合約：

- 啟用沙箱時停用。如果代理程式/工作階段已沙箱化，Crestodian 必須拒絕遠端救援，並說明需要本機命令列介面修復。
- 預設有效狀態為 `auto`：僅在受信任的 YOLO 操作中允許遠端救援，也就是執行階段已具備未沙箱化的本機權限時。
- 需要明確的擁有者身分。救援不得接受萬用字元寄件者規則、開放群組政策、未驗證的網路鉤子或匿名通道。
- 預設僅限擁有者私訊。群組/通道救援需要明確選擇加入。
- 外掛搜尋與清單為唯讀。外掛安裝預設僅限本機，因為它會下載可執行程式碼。當救援政策允許持久性寫入時，可以允許外掛解除安裝作為已核准的修復操作。
- 遠端救援無法開啟本機終端介面或切換到互動式代理程式工作階段。請使用本機 `openclaw` 進行代理程式交接。
- 即使在救援模式中，持久性寫入仍需要核准。
- 稽核每個已套用的救援操作。訊息通道救援會記錄通道、帳戶、寄件者與來源位址中繼資料。變更組態的操作也會記錄前後組態雜湊。
- 絕不回顯祕密。SecretRef 檢查應回報可用性，而不是值。
- 如果閘道仍運作，優先使用閘道型別化操作。如果閘道已停止，只使用不依賴一般代理程式迴圈的最小本機修復介面。

組態形狀：

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
- `true`：當擁有者/通道檢查通過時明確允許救援。這仍不得繞過沙箱拒絕。

預設 `"auto"` YOLO 姿態為：

- 沙箱模式解析為 `off`
- `tools.exec.security` 解析為 `full`
- `tools.exec.ask` 解析為 `off`

遠端救援由 Docker lane 涵蓋：

```bash
pnpm test:docker:crestodian-rescue
```

無組態本機規劃器退回由下列項目涵蓋：

```bash
pnpm test:docker:crestodian-planner
```

選擇加入的即時通道命令介面煙霧測試會檢查 `/crestodian status`，以及透過救援處理器進行的持久性核准往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

透過明確 Crestodian 命令進行的無組態設定由下列項目涵蓋：

```bash
pnpm test:docker:crestodian-first-run
```

該 lane 會從空狀態目錄開始，驗證現代 onboard Crestodian 進入點、設定預設模型、建立額外代理程式、透過外掛啟用加上權杖 SecretRef 設定 Discord、驗證組態，並檢查稽核記錄。QA Lab 也有一個以 repo 為基礎的情境，涵蓋相同的 Ring 0 流程：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Doctor](/zh-TW/cli/doctor)
- [終端介面](/zh-TW/cli/tui)
- [沙箱](/zh-TW/cli/sandbox)
- [安全性](/zh-TW/cli/security)
