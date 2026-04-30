---
read_when:
    - 您想要變更預設模型或檢視提供者驗證狀態
    - 您想掃描可用的模型/供應商並除錯身分驗證設定檔
summary: '`openclaw models` 的 CLI 參考（status/list/set/scan、別名、備援機制、身分驗證）'
title: 模型
x-i18n:
    generated_at: "2026-04-30T02:54:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型探索、掃描與設定（預設模型、備援、驗證設定檔）。

相關：

- 供應商 + 模型：[模型](/zh-TW/providers/models)
- 模型選擇概念 + `/models` 斜線指令：[模型概念](/zh-TW/concepts/models)
- 供應商驗證設定：[開始使用](/zh-TW/start/getting-started)

## 常用指令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 會顯示解析後的預設值/備援，以及驗證概覽。
當供應商使用量快照可用時，OAuth/API 金鑰狀態區段會包含
供應商使用時段與配額快照。
目前的使用時段供應商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用量驗證在可用時會來自供應商專屬掛鉤；
否則 OpenClaw 會退回使用來自驗證設定檔、環境或設定中相符的 OAuth/API 金鑰
憑證。
在 `--json` 輸出中，`auth.providers` 是感知環境/設定/儲存區的供應商
概覽，而 `auth.oauth` 只代表驗證儲存區設定檔健康狀態。
加入 `--probe` 可對每個已設定的供應商設定檔執行即時驗證探測。
探測是真實請求（可能會消耗權杖並觸發速率限制）。
使用 `--agent <id>` 檢查已設定代理程式的模型/驗證狀態。省略時，
此指令會使用已設定的預設代理程式，除非已設定
`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`。
探測列可能來自驗證設定檔、環境憑證或 `models.json`。

備註：

- `models set <model-or-alias>` 接受 `provider/model` 或別名。
- `models list` 是唯讀的：它會讀取設定、驗證設定檔、現有目錄
  狀態，以及供應商擁有的目錄列，但不會重寫
  `models.json`。
- `Auth` 欄位是供應商層級且唯讀。它會根據本機
  驗證設定檔中繼資料、環境標記、已設定的供應商金鑰、本機供應商
  標記、AWS Bedrock 環境/設定檔標記，以及 Plugin 合成驗證中繼資料計算；
  它不會載入供應商執行階段、讀取鑰匙圈祕密、呼叫供應商
  API，或證明精確的逐模型執行就緒狀態。
- `models list --all --provider <id>` 可包含來自 Plugin 資訊清單或隨附供應商目錄中繼資料的供應商擁有靜態目錄
  列，即使你尚未向該供應商完成驗證。這些列在設定相符驗證之前仍會顯示為
  不可用。
- 廣泛的 `models list --all` 會將資訊清單目錄列合併到登錄列之上，
  而不載入供應商執行階段補充掛鉤。供應商篩選的資訊清單
  快速路徑只使用標記為 `static` 的供應商；標記為 `refreshable` 的供應商
  保持以登錄/快取為基礎，並附加資訊清單列作為補充，而
  標記為 `runtime` 的供應商則保持使用登錄/執行階段探索。
- `models list` 會將原生模型中繼資料與執行階段上限分開。在表格
  輸出中，當有效執行階段上限不同於原生內容視窗時，`Ctx` 會顯示
  `contextTokens/contextWindow`；當供應商公開該上限時，JSON 列會包含 `contextTokens`。
- `models list --provider <id>` 會依供應商 ID 篩選，例如 `moonshot` 或
  `openai-codex`。它不接受互動式供應商
  選擇器中的顯示標籤，例如 `Moonshot AI`。
- 模型參照會透過分割**第一個** `/` 來解析。如果模型 ID 包含 `/`（OpenRouter 風格），請包含供應商前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略供應商，OpenClaw 會先將輸入解析為別名，接著
  解析為該精確模型 ID 的唯一已設定供應商相符項，最後才
  退回至已設定的預設供應商並顯示淘汰警告。
  如果該供應商不再公開已設定的預設模型，OpenClaw
  會退回到第一個已設定的供應商/模型，而不是顯示
  過時的已移除供應商預設值。
- `models status` 可能會在驗證輸出中，針對非祕密佔位符顯示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是將其遮罩為祕密。

### 模型掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` 目錄，並為
備援用途排序候選項。目錄本身是公開的，因此僅中繼資料掃描不需要
OpenRouter 金鑰。

預設情況下，OpenClaw 會嘗試透過即時模型呼叫探測工具與圖片支援。
如果未設定 OpenRouter 金鑰，此指令會退回至僅中繼資料
輸出，並說明 `:free` 模型仍需要 `OPENROUTER_API_KEY` 才能進行
探測與推論。

選項：

- `--no-probe`（僅中繼資料；不查詢設定/祕密）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目錄請求與每次探測逾時）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要即時探測；僅中繼資料掃描
結果只供參考，不會套用至設定。

### 模型狀態

選項：

- `--json`
- `--plain`
- `--check`（結束碼 1=已過期/缺少，2=即將過期）
- `--probe`（即時探測已設定的驗證設定檔）
- `--probe-provider <name>`（探測單一供應商）
- `--probe-profile <id>`（重複或以逗號分隔的設定檔 ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已設定的代理程式 ID；覆寫 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 會保留 stdout 供 JSON 承載使用。驗證設定檔、供應商，
以及啟動診斷會路由到 stderr，讓指令碼可以將 stdout 直接管線傳送
到 `jq` 等工具。

探測狀態分類：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

可預期的探測詳細資料/原因碼案例：

- `excluded_by_auth_order`：已存在儲存的設定檔，但明確的
  `auth.order.<provider>` 省略了它，因此探測會回報此排除，而不是
  嘗試它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  設定檔存在，但不符合資格/無法解析。
- `no_model`：供應商驗證存在，但 OpenClaw 無法為該供應商解析可探測的
  模型候選項。

## 別名 + 備援

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 驗證設定檔

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是互動式驗證輔助工具。它可以啟動供應商驗證
流程（OAuth/API 金鑰），或根據你選擇的
供應商，引導你手動貼上權杖。

`models auth login` 會執行供應商 Plugin 的驗證流程（OAuth/API 金鑰）。使用
`openclaw plugins list` 查看已安裝哪些供應商。
使用 `openclaw models auth --agent <id> <subcommand>` 可將驗證結果寫入
特定已設定的代理程式儲存區。父層 `--agent` 旗標會由
`add`、`login`、`setup-token`、`paste-token` 和 `login-github-copilot` 遵循。

範例：

```bash
openclaw models auth login --provider openai-codex --set-default
```

備註：

- `setup-token` 和 `paste-token` 仍是供公開權杖驗證方法的供應商使用的通用權杖指令。
- `setup-token` 需要互動式 TTY，並會執行供應商的權杖驗證
  方法（當該供應商公開 `setup-token` 方法時，預設使用該方法）。
- `paste-token` 接受在其他地方產生或來自自動化的權杖字串。
- `paste-token` 需要 `--provider`，會提示輸入權杖值，並將
  它寫入預設設定檔 ID `<provider>:manual`，除非你傳入
  `--profile-id`。
- `paste-token --expires-in <duration>` 會根據相對持續時間（例如 `365d` 或 `12h`）儲存絕對權杖到期時間。
- Anthropic 備註：Anthropic 人員告訴我們，OpenClaw 風格的 Claude CLI 使用方式已再次被允許，因此除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用與 `claude -p` 使用視為此整合已核准的方式。
- Anthropic `setup-token` / `paste-token` 仍可作為受支援的 OpenClaw 權杖路徑使用，但 OpenClaw 現在會優先使用 Claude CLI 重用與可用時的 `claude -p`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型故障轉移](/zh-TW/concepts/model-failover)
