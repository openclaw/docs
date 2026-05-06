---
read_when:
    - 你想要變更預設模型或查看提供者驗證狀態
    - 你想要掃描可用的模型/提供者，並偵錯身分驗證設定檔
summary: '`openclaw models` 的 CLI 參考（status/list/set/scan、別名、備援、身分驗證）'
title: 模型
x-i18n:
    generated_at: "2026-05-06T09:05:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型探索、掃描與設定（預設模型、後備模型、認證設定檔）。

相關：

- 提供者 + 模型：[模型](/zh-TW/providers/models)
- 模型選擇概念 + `/models` 斜線命令：[模型概念](/zh-TW/concepts/models)
- 提供者認證設定：[開始使用](/zh-TW/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 會顯示已解析的預設/後備模型，以及認證概覽。
當提供者用量快照可用時，OAuth/API 金鑰狀態區段會包含
提供者用量視窗和配額快照。
目前的用量視窗提供者：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 和 z.ai。用量認證會在可用時來自提供者特定的鉤子；
否則 OpenClaw 會退回使用來自認證設定檔、環境或設定中相符的 OAuth/API 金鑰
憑證。
在 `--json` 輸出中，`auth.providers` 是感知環境/設定/儲存的提供者
概覽，而 `auth.oauth` 僅是認證儲存區設定檔健康狀態。
加入 `--probe` 可對每個已設定的提供者設定檔執行即時認證探測。
探測是真實請求（可能會消耗權杖並觸發速率限制）。
使用 `--agent <id>` 來檢查已設定代理的模型/認證狀態。省略時，
此命令會使用已設定的預設代理，除非已設定 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`。
探測列可來自認證設定檔、環境憑證或 `models.json`。

注意事項：

- `models set <model-or-alias>` 接受 `provider/model` 或別名。
- `models list` 是唯讀的：它會讀取設定、認證設定檔、現有目錄
  狀態，以及提供者擁有的目錄列，但不會重寫
  `models.json`。
- `Auth` 欄位是提供者層級且唯讀。它會根據本機
  認證設定檔中繼資料、環境標記、已設定的提供者金鑰、本機提供者
  標記、AWS Bedrock 環境/設定檔標記，以及 Plugin 合成認證中繼資料計算；
  它不會載入提供者執行階段、讀取鑰匙圈祕密、呼叫提供者
  API，或證明每個模型的精確執行就緒狀態。
- `models list --all --provider <id>` 可以包含來自 Plugin 資訊清單或
  內建提供者目錄中繼資料的提供者擁有靜態目錄列，即使你
  尚未向該提供者認證。這些列在設定相符認證前仍會顯示為
  不可用。
- `models list` 會在提供者目錄探索速度緩慢時保持控制平面回應。
  預設與已設定檢視會在短暫等待後退回到已設定或
  合成模型列，並讓探索在背景完成。需要精確完整的已探索目錄且
  願意等待提供者探索時，請使用 `--all`。
- 廣泛的 `models list --all` 會將資訊清單目錄列合併覆蓋登錄列，
  且不載入提供者執行階段補充鉤子。依提供者篩選的資訊清單
  快速路徑只使用標記為 `static` 的提供者；標記為 `refreshable` 的提供者
  會維持由登錄/快取支援，並將資訊清單列附加為補充，而
  標記為 `runtime` 的提供者則維持在登錄/執行階段探索上。
- `models list` 會區分原生模型中繼資料與執行階段上限。在表格
  輸出中，當有效執行階段上限不同於原生內容視窗時，
  `Ctx` 會顯示 `contextTokens/contextWindow`；當提供者公開該上限時，
  JSON 列會包含 `contextTokens`。
- `models list --provider <id>` 會依提供者 id 篩選，例如 `moonshot` 或
  `openai-codex`。它不接受互動式提供者選擇器中的顯示標籤，
  例如 `Moonshot AI`。
- 模型參照會透過第一個 `/` 分割來解析。如果模型 ID 包含 `/`（OpenRouter 風格），請包含提供者前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供者，OpenClaw 會先將輸入解析為別名，接著
  解析為該精確模型 id 的唯一已設定提供者相符項，最後才
  退回到已設定的預設提供者並顯示棄用警告。
  如果該提供者不再公開已設定的預設模型，OpenClaw
  會退回到第一個已設定的提供者/模型，而不是顯示
  過時且已移除提供者的預設值。
- `models status` 可能會在非祕密預留位置的認證輸出中顯示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是將它們遮罩為祕密。

### 模型掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` 目錄，並為
後備使用排序候選模型。目錄本身是公開的，因此僅中繼資料掃描不需要
OpenRouter 金鑰。

預設情況下，OpenClaw 會嘗試透過即時模型呼叫探測工具與圖片支援。
如果未設定 OpenRouter 金鑰，此命令會退回到僅中繼資料
輸出，並說明 `:free` 模型仍需要 `OPENROUTER_API_KEY` 才能進行
探測和推論。

選項：

- `--no-probe`（僅中繼資料；不查找設定/祕密）
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
結果僅供參考，且不會套用到設定。

### 模型狀態

選項：

- `--json`
- `--plain`
- `--check`（結束碼 1=已過期/遺失，2=即將過期）
- `--probe`（即時探測已設定的認證設定檔）
- `--probe-provider <name>`（探測一個提供者）
- `--probe-profile <id>`（重複或以逗號分隔的設定檔 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已設定的代理 id；覆寫 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 會保留 stdout 給 JSON 承載。認證設定檔、提供者
與啟動診斷會路由至 stderr，讓指令碼可以將 stdout 直接管線輸入
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

預期的探測詳細資訊/原因碼情況：

- `excluded_by_auth_order`：已存在儲存的設定檔，但明確的
  `auth.order.<provider>` 省略了它，因此探測會回報排除原因，而不是
  嘗試使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  設定檔存在，但不符合資格/無法解析。
- `no_model`：提供者認證存在，但 OpenClaw 無法為該提供者解析出
  可探測的模型候選項。

## 別名 + 後備模型

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 認證設定檔

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是互動式認證輔助工具。它可以啟動提供者認證
流程（OAuth/API 金鑰），或根據你選擇的提供者引導你手動貼上權杖。

`models auth list` 會列出所選代理儲存的認證設定檔，而不
列印權杖、API 金鑰或 OAuth 祕密材料。使用 `--provider <id>` 可
篩選為單一提供者，例如 `openai-codex`，並使用 `--json` 供指令碼使用。

`models auth login` 會執行提供者 Plugin 的認證流程（OAuth/API 金鑰）。使用
`openclaw plugins list` 查看已安裝的提供者。
使用 `openclaw models auth --agent <id> <subcommand>` 將認證結果寫入
特定已設定代理儲存區。父層 `--agent` 旗標會由
`add`、`list`、`login`、`setup-token`、`paste-token` 和
`login-github-copilot` 遵循。

範例：

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

注意事項：

- `setup-token` 和 `paste-token` 仍是提供者的通用權杖命令，
  適用於公開權杖認證方法的提供者。
- `setup-token` 需要互動式 TTY，並執行提供者的權杖認證
  方法（當該提供者公開 `setup-token` 方法時，預設使用該方法）。
- `paste-token` 接受在其他地方產生或來自自動化的權杖字串。
- `paste-token` 需要 `--provider`，會提示輸入權杖值，並將其寫入
  預設設定檔 id `<provider>:manual`，除非你傳入
  `--profile-id`。
- `paste-token --expires-in <duration>` 會根據相對持續時間（例如 `365d` 或 `12h`）
  儲存絕對權杖到期時間。
- Anthropic 注意事項：Anthropic 工作人員告訴我們，OpenClaw 風格的 Claude CLI 使用方式已再次被允許，因此 OpenClaw 會將 Claude CLI 重用和 `claude -p` 使用視為此整合已批准的方式，除非 Anthropic 發布新政策。
- Anthropic `setup-token` / `paste-token` 仍可作為受支援的 OpenClaw 權杖路徑使用，但 OpenClaw 現在會在可用時優先使用 Claude CLI 重用和 `claude -p`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
