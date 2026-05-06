---
read_when:
    - 您想要變更預設模型，或檢視提供者驗證狀態
    - 您想掃描可用的模型/提供者並偵錯身分驗證設定檔
summary: '`openclaw models` 的 CLI 參考（status/list/set/scan、別名、備援、身分驗證）'
title: 模型
x-i18n:
    generated_at: "2026-05-06T19:35:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型探索、掃描與設定（預設模型、備援、驗證設定檔）。

相關：

- 供應商 + 模型：[模型](/zh-TW/providers/models)
- 模型選擇概念 + `/models` 斜線命令：[模型概念](/zh-TW/concepts/models)
- 供應商驗證設定：[入門](/zh-TW/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 會顯示已解析的預設值/備援，以及驗證概覽。
當供應商使用量快照可用時，OAuth/API-key 狀態區段會包含
供應商使用量視窗與配額快照。
目前的使用量視窗供應商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。使用量驗證會在可用時來自供應商專屬 hook；
否則 OpenClaw 會退回使用來自驗證設定檔、env 或 config 中相符的 OAuth/API-key
credentials。
在 `--json` 輸出中，`auth.providers` 是具備 env/config/store 感知的供應商
概覽，而 `auth.oauth` 僅是 auth-store 設定檔健康狀態。
加入 `--probe` 可對每個已設定的供應商設定檔執行即時驗證探測。
探測是真實請求（可能會消耗 token 並觸發速率限制）。
使用 `--agent <id>` 檢查已設定代理的模型/驗證狀態。省略時，
命令會在已設定時使用 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`，否則使用
已設定的預設代理。
探測列可以來自驗證設定檔、env credentials 或 `models.json`。
若要排解 Codex OAuth 問題，`openclaw models status`、
`openclaw models auth list --provider openai-codex` 和
`openclaw config get agents.defaults.model --json` 是確認代理是否透過 PI 使用
`openai-codex/*`，或透過原生 Codex runtime 使用 `openai/*` 的最快方式。
請參閱 [OpenAI 供應商設定](/zh-TW/providers/openai#check-and-recover-codex-oauth-routing)。

注意事項：

- `models set <model-or-alias>` 接受 `provider/model` 或別名。
- `models list` 是唯讀的：它會讀取 config、驗證設定檔、既有目錄
  狀態，以及供應商擁有的目錄列，但不會重寫
  `models.json`。
- `Auth` 欄位是供應商層級且唯讀。它是從本機
  驗證設定檔中繼資料、env markers、已設定的供應商金鑰、local-provider
  markers、AWS Bedrock env/profile markers，以及 plugin synthetic-auth 中繼資料計算而來；
  它不會載入供應商 runtime、讀取 keychain secrets、呼叫供應商
  APIs，或證明精確的逐模型執行就緒狀態。
- `models list --all --provider <id>` 可以包含來自 Plugin manifest
  或內建供應商目錄中繼資料、由供應商擁有的靜態目錄列，即使你
  尚未向該供應商驗證也一樣。這些列仍會顯示為
  不可用，直到設定相符的驗證。
- `models list` 會在供應商目錄探索緩慢時保持控制平面回應順暢。
  預設與已設定檢視會在短暫等待後退回使用已設定或
  合成的模型列，並讓探索在背景完成。當你需要精確完整的已探索目錄且
  願意等待供應商探索時，請使用 `--all`。
- 廣泛的 `models list --all` 會將 manifest 目錄列合併覆蓋於 registry 列之上，
  而不載入供應商 runtime supplement hooks。供應商篩選的 manifest
  快速路徑只使用標記為 `static` 的供應商；標記為 `refreshable` 的供應商
  會維持以 registry/cache 為後端，並附加 manifest 列作為補充，而
  標記為 `runtime` 的供應商則維持在 registry/runtime 探索上。
- `models list` 會區分原生模型中繼資料與 runtime caps。在表格
  輸出中，當有效 runtime cap 不同於原生 context window 時，`Ctx` 會顯示
  `contextTokens/contextWindow`；當供應商公開該 cap 時，JSON 列會包含 `contextTokens`。
- `models list --provider <id>` 會依供應商 id 篩選，例如 `moonshot` 或
  `openai-codex`。它不接受互動式供應商
  選擇器中的顯示標籤，例如 `Moonshot AI`。
- 模型 refs 會以**第一個** `/` 分割來解析。如果模型 ID 包含 `/`（OpenRouter 風格），請包含供應商前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略供應商，OpenClaw 會先將輸入解析為別名，接著
  解析為該精確模型 id 在已設定供應商中的唯一相符項目，最後才
  退回至已設定的預設供應商並顯示棄用警告。
  如果該供應商不再公開已設定的預設模型，OpenClaw
  會改為退回至第一個已設定的供應商/模型，而不是浮現
  過時的已移除供應商預設值。
- `models status` 可能會在驗證輸出中對非秘密預留位置顯示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是將它們遮蔽為秘密。

### 模型掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` 目錄，並為
備援用途排序候選模型。目錄本身是公開的，因此僅中繼資料掃描不需要
OpenRouter 金鑰。

預設情況下，OpenClaw 會嘗試使用即時模型呼叫探測工具與圖片支援。
如果未設定 OpenRouter 金鑰，命令會退回至僅中繼資料
輸出，並說明 `:free` 模型仍需要 `OPENROUTER_API_KEY` 才能進行
探測與推論。

選項：

- `--no-probe`（僅中繼資料；不查詢 config/secrets）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目錄請求與每次探測的逾時）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 和 `--set-image` 需要即時探測；僅中繼資料掃描
結果僅供參考，且不會套用至 config。

### 模型狀態

選項：

- `--json`
- `--plain`
- `--check`（exit 1=已過期/缺失，2=即將過期）
- `--probe`（對已設定的驗證設定檔進行即時探測）
- `--probe-provider <name>`（探測一個供應商）
- `--probe-profile <id>`（重複或以逗號分隔的設定檔 ids）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已設定的代理 id；覆寫 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 會保留 stdout 只輸出 JSON payload。驗證設定檔、供應商
與啟動診斷會導向 stderr，因此 scripts 可以將 stdout 直接 pipe
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

可預期的探測詳細資訊/原因代碼案例：

- `excluded_by_auth_order`：已存在儲存的設定檔，但明確的
  `auth.order.<provider>` 省略了它，因此探測會回報排除，而不是
  嘗試它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  設定檔存在，但不符合資格/無法解析。
- `no_model`：供應商驗證存在，但 OpenClaw 無法為該供應商解析出可探測的
  模型候選。

## 別名 + 備援

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 驗證設定檔

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是互動式驗證 helper。它可以啟動供應商驗證
流程（OAuth/API key），或根據你選擇的
供應商引導你手動貼上 token。

`models auth list` 會列出所選代理已儲存的驗證設定檔，而不
列印 token、API-key 或 OAuth secret material。使用 `--provider <id>` 可
篩選至單一供應商，例如 `openai-codex`；使用 `--json` 可供 scripting。

`models auth login` 會執行供應商 Plugin 的驗證流程（OAuth/API key）。使用
`openclaw plugins list` 查看已安裝的供應商。
使用 `openclaw models auth --agent <id> <subcommand>` 可將驗證結果寫入
特定已設定代理 store。父層 `--agent` flag 會被
`add`、`list`、`login`、`setup-token`、`paste-token` 和
`login-github-copilot` 遵守。

範例：

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

注意事項：

- `setup-token` 和 `paste-token` 仍是供公開 token auth 方法之供應商使用的通用 token 命令。
- `setup-token` 需要互動式 TTY，並執行供應商的 token-auth
  方法（當該供應商公開
  一個方法時，預設為該供應商的 `setup-token` 方法）。
- `paste-token` 接受在其他地方或由自動化產生的 token 字串。
- `paste-token` 需要 `--provider`，會提示輸入 token 值，並將
  它寫入預設設定檔 id `<provider>:manual`，除非你傳入
  `--profile-id`。
- `paste-token --expires-in <duration>` 會從像 `365d` 或 `12h` 這類
  相對 duration 儲存絕對 token 到期時間。
- Anthropic 注意事項：Anthropic staff 告知我們 OpenClaw 風格的 Claude CLI 使用已再次允許，因此除非 Anthropic 發布新政策，否則 OpenClaw 會將 Claude CLI 重用和 `claude -p` 使用視為此整合的已核准方式。
- Anthropic `setup-token` / `paste-token` 仍可作為受支援的 OpenClaw token 路徑使用，但 OpenClaw 現在會優先使用可用的 Claude CLI 重用與 `claude -p`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
