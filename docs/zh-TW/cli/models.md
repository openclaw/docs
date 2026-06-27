---
read_when:
    - 你想要變更預設模型或查看提供者驗證狀態
    - 你想要掃描可用的模型/供應商並偵錯驗證設定檔
summary: '`openclaw models` 的命令列介面參考（status/list/set/scan、別名、備援、驗證）'
title: 模型
x-i18n:
    generated_at: "2026-06-27T19:06:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型探索、掃描與設定（預設模型、備援、驗證設定檔）。

相關：

- 提供者 + 模型：[模型](/zh-TW/providers/models)
- 模型選擇概念 + `/models` 斜線命令：[模型概念](/zh-TW/concepts/models)
- 提供者驗證設定：[開始使用](/zh-TW/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 會顯示解析後的預設值/備援，以及驗證概覽。
當提供者使用量快照可用時，OAuth/API 金鑰狀態區段會包含
提供者使用時段與配額快照。
目前的使用時段提供者：Anthropic、GitHub Copilot、Gemini CLI、OpenAI、
MiniMax、Xiaomi 和 z.ai。可用時，使用量驗證會來自提供者特定鉤子；
否則 OpenClaw 會退回使用驗證設定檔、環境或設定中相符的 OAuth/API 金鑰
憑證。
在 `--json` 輸出中，`auth.providers` 是感知環境/設定/儲存區的提供者
概覽，而 `auth.oauth` 僅是驗證儲存區設定檔健康狀態。
加入 `--probe` 可對每個已設定的提供者設定檔執行即時驗證探測。
探測是真實請求（可能會消耗 token 並觸發速率限制）。
使用 `--agent <id>` 檢查已設定代理的模型/驗證狀態。省略時，
此命令會在已設定時使用 `OPENCLAW_AGENT_DIR`，否則使用
已設定的預設代理。
探測列可來自驗證設定檔、環境憑證或 `models.json`。
若要疑難排解 OpenAI ChatGPT/Codex OAuth，`openclaw models status`、
`openclaw models auth list --provider openai` 和
`openclaw config get agents.defaults.model --json` 是最快確認
代理是否有可透過原生 Codex 執行階段供 `openai/*` 使用的 `openai` OAuth 設定檔的方法。
請參閱 [OpenAI 提供者設定](/zh-TW/providers/openai#check-and-recover-codex-oauth-routing)。

注意事項：

- `models set <model-or-alias>` 接受 `provider/model` 或別名。
- `models list` 是唯讀的：它會讀取設定、驗證設定檔、現有目錄
  狀態，以及提供者擁有的目錄列，但不會重寫
  `models.json`。
- `Auth` 欄是提供者層級且唯讀。它會根據本機
  驗證設定檔中繼資料、環境標記、已設定的提供者金鑰、本機提供者
  標記、AWS Bedrock 環境/設定檔標記，以及外掛合成驗證中繼資料計算；
  它不會載入提供者執行階段、讀取鑰匙圈祕密、呼叫提供者
  API，或證明精確的逐模型執行就緒狀態。
- `models list --all --provider <id>` 可包含來自外掛清單或內建提供者目錄中繼資料的提供者擁有靜態目錄
  列，即使你尚未向該提供者驗證也一樣。這些列在設定相符驗證前仍會顯示為
  不可用。
- `models list` 會在提供者目錄
  探索緩慢時讓控制平面保持回應。預設與已設定檢視會在短暫等待後退回至已設定或
  合成模型列，並讓探索在背景完成。當你需要精確完整的已探索目錄，且
  願意等待提供者探索時，請使用 `--all`。
- 廣泛的 `models list --all` 會在不載入提供者執行階段補充鉤子的情況下，將清單目錄列合併覆蓋登錄列。
  依提供者篩選的清單快速路徑只使用標記為 `static` 的提供者；標記為 `refreshable`
  的提供者會維持由登錄/快取支援，並將清單列附加為補充，而
  標記為 `runtime` 的提供者會維持使用登錄/執行階段探索。
- `models list` 會區分原生模型中繼資料與執行階段上限。在表格
  輸出中，當有效執行階段上限與原生內容視窗不同時，`Ctx` 會顯示 `contextTokens/contextWindow`；
  JSON 列會在提供者公開該上限時包含 `contextTokens`。
- `models list --provider <id>` 會依提供者 id 篩選，例如 `moonshot` 或
  `openai`。它不接受互動式提供者
  選擇器中的顯示標籤，例如 `Moonshot AI`。
- 模型參照會以**第一個** `/` 分割來剖析。如果模型 ID 包含 `/`（OpenRouter 風格），請包含提供者前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供者，OpenClaw 會先將輸入解析為別名，接著
  解析為該精確模型 id 的唯一已設定提供者相符項目，然後才
  退回至已設定的預設提供者並顯示棄用警告。
  如果該提供者不再公開已設定的預設模型，OpenClaw
  會退回至第一個已設定的提供者/模型，而不是顯示
  過時的已移除提供者預設值。
- `models status` 可能會在驗證輸出中針對非祕密佔位符顯示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是將它們遮罩為祕密。

### 模型掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` 目錄，並為
備援用途排序候選項目。目錄本身是公開的，因此僅中繼資料掃描不需要
OpenRouter 金鑰。

預設情況下，OpenClaw 會嘗試透過即時模型呼叫探測工具與圖片支援。
如果未設定 OpenRouter 金鑰，此命令會退回至僅中繼資料
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
結果僅供參考，不會套用至設定。

### 模型狀態

選項：

- `--json`
- `--plain`
- `--check`（結束碼 1=已過期/缺失，2=即將過期）
- `--probe`（即時探測已設定的驗證設定檔）
- `--probe-provider <name>`（探測一個提供者）
- `--probe-profile <id>`（重複或以逗號分隔的設定檔 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已設定代理 id；覆寫 `OPENCLAW_AGENT_DIR`）

`--json` 會保留 stdout 給 JSON 酬載。驗證設定檔、提供者
與啟動診斷會路由至 stderr，讓指令碼可以直接將 stdout 管線傳入
例如 `jq` 的工具。

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

- `excluded_by_auth_order`：存在已儲存的設定檔，但明確的
  `auth.order.<provider>` 省略了它，因此探測會回報排除狀態，而不是
  嘗試使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  設定檔存在，但不符合資格/無法解析。
- `no_model`：提供者驗證存在，但 OpenClaw 無法為該提供者解析可探測的
  模型候選項目。

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
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是互動式驗證協助工具。它可啟動提供者驗證
流程（OAuth/API 金鑰），或依你選擇的
提供者引導你手動貼上 token。

`models auth list` 會列出所選代理已儲存的驗證設定檔，且不會
列印 token、API 金鑰或 OAuth 祕密素材。使用 `--provider <id>` 可
篩選至單一提供者，例如 `openai`，並使用 `--json` 供指令碼使用。

`models auth login` 會執行提供者外掛的驗證流程（OAuth/API 金鑰）。使用
`openclaw plugins list` 查看已安裝哪些提供者。
使用 `openclaw models auth --agent <id> <subcommand>` 可將驗證結果寫入
特定已設定的代理儲存區。父層 `--agent` 旗標會由
`add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token` 和
`login-github-copilot` 遵循。

對於 OpenAI 模型，`--provider openai` 預設為 ChatGPT/Codex 帳戶登入。
只有在你想加入 OpenAI API 金鑰設定檔時才使用 `--method api-key`，
通常作為 Codex 訂閱限制的備援。執行 `openclaw doctor --fix`
可將較舊的舊版 OpenAI Codex 前綴驗證/設定檔狀態遷移至 `openai`。

範例：

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

注意事項：

- `login` 會接受 `--profile-id <id>`，供登入期間支援具名
  設定檔的提供者使用。使用它可將同一
  提供者的多個登入分開保存。
- `paste-api-key` 接受在其他地方產生的 API 金鑰、提示輸入金鑰
  值，並將其寫入預設設定檔 id `<provider>:manual`，除非你
  傳入 `--profile-id`。在自動化中，請透過 stdin 管線傳入金鑰，例如
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`。
- `setup-token` 和 `paste-token` 仍是針對公開 token 驗證方法的提供者
  的通用 token 命令。
- `setup-token` 需要互動式 TTY，並會執行提供者的 token 驗證
  方法（當該提供者公開 `setup-token` 方法時，預設使用該方法）。
- `paste-token` 接受在其他地方或從自動化產生的 token 字串。
- `paste-token` 需要 `--provider`，預設會提示輸入 token 值，
  並將其寫入預設設定檔 id `<provider>:manual`，除非你傳入
  `--profile-id`。
- 在自動化中，請透過 stdin 管線傳入 token，而不是將它作為引數傳入，如此
  提供者憑證就不會出現在 shell 歷史記錄或行程清單中。
- `paste-token --expires-in <duration>` 會根據相對持續時間（例如
  `365d` 或 `12h`）儲存絕對 token 到期時間。
- 對於 `openai`，OpenAI API 金鑰與 ChatGPT/OAuth token 素材是
  不同的驗證形狀。針對 `sk-...` OpenAI API 金鑰使用 `paste-api-key`，
  且只針對 token 驗證素材使用 `paste-token`。
- Anthropic 注意事項：Anthropic 員工告訴我們 OpenClaw 風格的 Claude CLI 使用方式已再次允許，因此 OpenClaw 會將 Claude CLI 重用和 `claude -p` 使用視為此整合已獲准的方式，除非 Anthropic 發布新政策。
- Anthropic `setup-token` / `paste-token` 仍作為受支援的 OpenClaw token 路徑可用，但 OpenClaw 現在會優先使用 Claude CLI 重用，以及可用時的 `claude -p`。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
