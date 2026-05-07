---
read_when:
    - 您想變更預設模型或檢視提供者身分驗證狀態
    - 你想要掃描可用的模型/提供者並偵錯身分驗證設定檔
summary: '`openclaw models` 的 CLI 參考（status/list/set/scan、別名、備援、身分驗證）'
title: 模型
x-i18n:
    generated_at: "2026-05-07T13:14:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型探索、掃描與設定（預設模型、備援模型、身分驗證設定檔）。

相關：

- 提供者 + 模型：[模型](/zh-TW/providers/models)
- 模型選擇概念 + `/models` 斜線命令：[模型概念](/zh-TW/concepts/models)
- 提供者身分驗證設定：[快速開始](/zh-TW/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 會顯示解析後的預設模型/備援模型，以及身分驗證概覽。
當提供者用量快照可用時，OAuth/API 金鑰狀態區段會包含
提供者用量視窗與配額快照。
目前的用量視窗提供者：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。用量身分驗證在可用時來自提供者特定鉤子；
否則 OpenClaw 會回退到身分驗證設定檔、env 或 config 中相符的 OAuth/API 金鑰
憑證。
在 `--json` 輸出中，`auth.providers` 是感知 env/config/store 的提供者
概覽，而 `auth.oauth` 只包含身分驗證儲存區設定檔健康狀態。
加入 `--probe` 可對每個已設定的提供者設定檔執行即時身分驗證探測。
探測是真實請求（可能會消耗 token 並觸發速率限制）。
使用 `--agent <id>` 可檢查已設定 agent 的模型/身分驗證狀態。省略時，
命令會使用已設定的預設 agent；若已設定 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`，
則會改用它們。
探測列可來自身分驗證設定檔、env 憑證或 `models.json`。
若要疑難排解 Codex OAuth，`openclaw models status`、
`openclaw models auth list --provider openai-codex` 和
`openclaw config get agents.defaults.model --json` 是最快確認
agent 是否具備可用的 `openai-codex` 身分驗證設定檔，以透過原生 Codex 執行階段使用
`openai/*` 的方式。請參閱 [OpenAI 提供者設定](/zh-TW/providers/openai#check-and-recover-codex-oauth-routing)。

注意事項：

- `models set <model-or-alias>` 接受 `provider/model` 或別名。
- `models list` 是唯讀的：它會讀取 config、身分驗證設定檔、現有 catalog
  狀態，以及提供者擁有的 catalog 列，但不會重寫
  `models.json`。
- `Auth` 欄是提供者層級且唯讀。它根據本機
  身分驗證設定檔中繼資料、env 標記、已設定的提供者金鑰、本機提供者
  標記、AWS Bedrock env/profile 標記，以及 Plugin 合成身分驗證中繼資料計算；
  它不會載入提供者執行階段、讀取鑰匙圈密鑰、呼叫提供者
  API，或證明精確的逐模型執行就緒狀態。
- `models list --all --provider <id>` 可包含來自 Plugin manifest 或隨附提供者 catalog 中繼資料中
  由提供者擁有的靜態 catalog 列，即使你尚未向該提供者完成身分驗證。
  在設定相符的身分驗證之前，這些列仍會顯示為
  不可用。
- `models list` 會在提供者 catalog
  探索緩慢時保持控制平面回應迅速。預設與已設定檢視會在短暫等待後回退到已設定或
  合成模型列，並讓探索在
  背景完成。當你需要精確完整的已探索 catalog，且願意等待提供者探索時，
  請使用 `--all`。
- 廣泛的 `models list --all` 會將 manifest catalog 列合併覆蓋到 registry 列之上，
  而不載入提供者執行階段補充鉤子。依提供者篩選的 manifest
  快速路徑只使用標記為 `static` 的提供者；標記為 `refreshable` 的提供者
  會維持由 registry/cache 支援，並附加 manifest 列作為補充；而
  標記為 `runtime` 的提供者則維持使用 registry/runtime 探索。
- `models list` 會區分原生模型中繼資料與執行階段上限。在表格
  輸出中，當有效執行階段
  上限不同於原生 context window 時，`Ctx` 會顯示 `contextTokens/contextWindow`；當提供者公開該上限時，JSON 列會包含 `contextTokens`。
- `models list --provider <id>` 會依提供者 id 篩選，例如 `moonshot` 或
  `openai-codex`。它不接受互動式提供者
  選擇器中的顯示標籤，例如 `Moonshot AI`。
- 模型參照會依**第一個** `/` 分割解析。如果模型 ID 包含 `/`（OpenRouter 風格），請包含提供者前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供者，OpenClaw 會先將輸入解析為別名，接著
  解析為該精確模型 id 在已設定提供者中的唯一相符項，最後才
  回退到已設定的預設提供者並顯示棄用警告。
  如果該提供者不再公開已設定的預設模型，OpenClaw
  會回退到第一個已設定的提供者/模型，而不是呈現
  過時的已移除提供者預設值。
- `models status` 可能會在身分驗證輸出中，對非密鑰佔位符顯示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是將它們遮罩成密鑰。

### 模型掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` catalog，並為
備援用途排序候選項。catalog 本身是公開的，因此僅中繼資料掃描不需要
OpenRouter 金鑰。

預設情況下，OpenClaw 會嘗試以即時模型呼叫探測工具與圖片支援。
如果未設定 OpenRouter 金鑰，命令會回退到僅中繼資料
輸出，並說明 `:free` 模型仍需要 `OPENROUTER_API_KEY` 才能進行
探測與推論。

選項：

- `--no-probe`（僅中繼資料；不查找 config/密鑰）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（catalog 請求與逐探測逾時）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要即時探測；僅中繼資料掃描
結果僅供參考，不會套用到 config。

### 模型狀態

選項：

- `--json`
- `--plain`
- `--check`（結束 1=已過期/遺失，2=即將過期）
- `--probe`（即時探測已設定的身分驗證設定檔）
- `--probe-provider <name>`（探測一個提供者）
- `--probe-profile <id>`（重複或以逗號分隔的設定檔 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已設定 agent id；覆寫 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 會保留 stdout 給 JSON payload。身分驗證設定檔、提供者
與啟動診斷會導向 stderr，因此腳本可以將 stdout 直接管線傳入
`jq` 等工具。

探測狀態分類：

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

可預期的探測詳細資料/原因代碼案例：

- `excluded_by_auth_order`：存在已儲存設定檔，但明確的
  `auth.order.<provider>` 省略了它，因此探測會回報排除狀態，而不是
  嘗試它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  設定檔存在，但不符合資格/無法解析。
- `no_model`：提供者身分驗證存在，但 OpenClaw 無法為該提供者解析出可探測的
  模型候選項。

## 別名 + 備援模型

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 身分驗證設定檔

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是互動式身分驗證輔助工具。它可以啟動提供者身分驗證
流程（OAuth/API 金鑰），或根據你選擇的
提供者引導你手動貼上 token。

`models auth list` 會列出所選 agent 的已儲存身分驗證設定檔，而不
列印 token、API 金鑰或 OAuth 密鑰內容。使用 `--provider <id>` 可
篩選到單一提供者，例如 `openai-codex`；使用 `--json` 可供腳本使用。

`models auth login` 會執行提供者 Plugin 的身分驗證流程（OAuth/API 金鑰）。使用
`openclaw plugins list` 查看已安裝的提供者。
使用 `openclaw models auth --agent <id> <subcommand>` 可將身分驗證結果寫入
特定已設定 agent 儲存區。父層 `--agent` 旗標會由
`add`、`list`、`login`、`setup-token`、`paste-token` 和
`login-github-copilot` 採用。

範例：

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

注意事項：

- `setup-token` 和 `paste-token` 仍是為公開 token 身分驗證方法的提供者提供的通用 token 命令。
- `setup-token` 需要互動式 TTY，並執行提供者的 token 身分驗證
  方法（當該提供者公開
  `setup-token` 方法時，預設使用該方法）。
- `paste-token` 接受在其他地方或由自動化產生的 token 字串。
- `paste-token` 需要 `--provider`，會提示輸入 token 值，並將它寫入
  預設設定檔 id `<provider>:manual`，除非你傳入
  `--profile-id`。
- `paste-token --expires-in <duration>` 會根據相對持續時間儲存絕對 token 到期時間，例如 `365d` 或 `12h`。
- Anthropic 注意事項：Anthropic 員工告訴我們，OpenClaw 風格的 Claude CLI 使用方式已再次允許，因此除非 Anthropic 發布新政策，否則 OpenClaw 會將 Claude CLI 重用與 `claude -p` 使用視為此整合已獲批准的方式。
- Anthropic `setup-token` / `paste-token` 仍作為受支援的 OpenClaw token 路徑可用，但 OpenClaw 現在會在可用時優先使用 Claude CLI 重用與 `claude -p`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
