---
read_when:
    - 您想要變更預設模型或檢視提供者驗證狀態
    - 你想掃描可用的模型/提供者並偵錯驗證設定檔
summary: CLI 參考：`openclaw models`（status/list/set/scan、別名、備援、身分驗證）
title: 模型
x-i18n:
    generated_at: "2026-05-04T18:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc7842f02e29aa0ac2ae88f3d42bba71f1890a58ab22d818dbee0585bc562fea
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

`openclaw models status` 會顯示解析後的預設/備援，加上驗證概覽。
當供應商使用量快照可用時，OAuth/API 金鑰狀態區段會包含
供應商使用視窗與配額快照。
目前的使用視窗供應商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 與 z.ai。可用時，使用量驗證會來自供應商特定掛鉤；
否則 OpenClaw 會退回使用來自驗證設定檔、環境或設定中相符的 OAuth/API 金鑰
憑證。
在 `--json` 輸出中，`auth.providers` 是會感知環境/設定/儲存區的供應商
概覽，而 `auth.oauth` 只代表驗證儲存區設定檔的健康狀態。
加入 `--probe` 可對每個已設定的供應商設定檔執行即時驗證探測。
探測是真實請求（可能會消耗權杖並觸發速率限制）。
使用 `--agent <id>` 可檢查已設定代理程式的模型/驗證狀態。省略時，
指令會使用已設定的預設代理程式，若已設定則改用
`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`。
探測列可能來自驗證設定檔、環境憑證或 `models.json`。

注意事項：

- `models set <model-or-alias>` 接受 `provider/model` 或別名。
- `models list` 是唯讀的：它會讀取設定、驗證設定檔、現有目錄
  狀態與供應商擁有的目錄列，但不會重寫
  `models.json`。
- `Auth` 欄位是供應商層級且唯讀。它會依據本機
  驗證設定檔中繼資料、環境標記、已設定的供應商金鑰、本機供應商
  標記、AWS Bedrock 環境/設定檔標記，以及 Plugin 合成驗證中繼資料計算；
  它不會載入供應商執行階段、讀取鑰匙圈祕密、呼叫供應商
  API，或證明精確的逐模型執行就緒狀態。
- `models list --all --provider <id>` 可以包含來自 Plugin 資訊清單或
  隨附供應商目錄中繼資料的供應商擁有靜態目錄列，即使你
  尚未向該供應商驗證也一樣。這些列仍會顯示為
  不可用，直到設定了相符的驗證。
- `models list` 會在供應商目錄探索緩慢時維持控制平面回應。
  預設與已設定視圖會在短暫等待後退回使用已設定或
  合成模型列，並讓探索在
  背景完成。當你需要精確完整的已探索目錄，且
  願意等待供應商探索時，請使用 `--all`。
- 廣泛的 `models list --all` 會將資訊清單目錄列合併到登錄列之上，
  而不載入供應商執行階段補充掛鉤。供應商篩選的資訊清單
  快速路徑只使用標記為 `static` 的供應商；標記為 `refreshable`
  的供應商維持由登錄/快取支援，並將資訊清單列附加為補充，
  而標記為 `runtime` 的供應商則維持使用登錄/執行階段探索。
- `models list` 會將原生模型中繼資料與執行階段上限分開處理。在表格
  輸出中，當有效執行階段上限與原生內容視窗不同時，`Ctx` 會顯示
  `contextTokens/contextWindow`；當供應商公開該上限時，JSON 列會包含
  `contextTokens`。
- `models list --provider <id>` 會依供應商 id 篩選，例如 `moonshot` 或
  `openai-codex`。它不接受互動式供應商
  選擇器中的顯示標籤，例如 `Moonshot AI`。
- 模型參照會透過 **第一個** `/` 分割來解析。如果模型 ID 包含 `/`（OpenRouter 風格），請包含供應商前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略供應商，OpenClaw 會先將輸入解析為別名，接著
  解析為該精確模型 id 在已設定供應商中的唯一相符項目，然後才
  退回使用已設定的預設供應商並顯示棄用警告。
  如果該供應商不再公開已設定的預設模型，OpenClaw
  會退回使用第一個已設定的供應商/模型，而不是顯示
  過時的已移除供應商預設值。
- `models status` 在驗證輸出中可能會對非祕密預留位置顯示 `marker(<value>)`（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是將它們遮蔽為祕密。

### 模型掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` 目錄，並為備援用途
排序候選項目。目錄本身是公開的，因此僅中繼資料掃描不需要
OpenRouter 金鑰。

預設情況下，OpenClaw 會嘗試透過即時模型呼叫探測工具與圖片支援。
如果沒有設定 OpenRouter 金鑰，指令會退回僅中繼資料
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

`--set-default` 與 `--set-image` 需要即時探測；僅中繼資料掃描
結果僅供參考，不會套用到設定。

### 模型狀態

選項：

- `--json`
- `--plain`
- `--check`（結束碼 1=已過期/缺少，2=即將過期）
- `--probe`（對已設定的驗證設定檔進行即時探測）
- `--probe-provider <name>`（探測一個供應商）
- `--probe-profile <id>`（重複或以逗號分隔的設定檔 id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已設定的代理程式 id；覆寫 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 會保留 stdout 只用於 JSON 承載。驗證設定檔、供應商
與啟動診斷會導向 stderr，讓指令稿可以將 stdout 直接管線輸入
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
  `auth.order.<provider>` 省略了它，因此探測會回報該排除，而不是
  嘗試使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  設定檔存在，但不符合資格/無法解析。
- `no_model`：供應商驗證存在，但 OpenClaw 無法為該供應商解析出可探測的
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
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` 是互動式驗證輔助工具。它可以啟動供應商驗證
流程（OAuth/API 金鑰），或依據你選擇的
供應商引導你手動貼上權杖。

`models auth list` 會列出所選代理程式已儲存的驗證設定檔，而不
列印權杖、API 金鑰或 OAuth 祕密資料。使用 `--provider <id>` 可
篩選至單一供應商，例如 `openai-codex`；使用 `--json` 可供指令稿處理。

`models auth login` 會執行供應商 Plugin 的驗證流程（OAuth/API 金鑰）。使用
`openclaw plugins list` 查看已安裝哪些供應商。
使用 `openclaw models auth --agent <id> <subcommand>` 可將驗證結果寫入
特定已設定的代理程式儲存區。父層 `--agent` 旗標會由
`add`、`list`、`login`、`setup-token`、`paste-token` 與
`login-github-copilot` 遵循。

範例：

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

注意事項：

- `setup-token` 與 `paste-token` 仍是供公開權杖驗證方法之供應商使用的通用權杖指令。
- `setup-token` 需要互動式 TTY，並會執行供應商的權杖驗證
  方法（當該供應商公開
  `setup-token` 方法時，預設使用該方法）。
- `paste-token` 接受在其他地方產生或來自自動化的權杖字串。
- `paste-token` 需要 `--provider`，會提示輸入權杖值，並寫入
  預設設定檔 id `<provider>:manual`，除非你傳入
  `--profile-id`。
- `paste-token --expires-in <duration>` 會從相對持續時間（例如 `365d` 或 `12h`）
  儲存絕對權杖到期時間。
- Anthropic 注意事項：Anthropic 員工告訴我們，OpenClaw 風格的 Claude CLI 使用方式再次被允許，因此除非 Anthropic 發布新政策，否則 OpenClaw 會將 Claude CLI 重用與 `claude -p` 使用方式視為此整合的受准方式。
- Anthropic `setup-token` / `paste-token` 仍可作為受支援的 OpenClaw 權杖路徑，但 OpenClaw 現在偏好可用時重用 Claude CLI 與 `claude -p`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
