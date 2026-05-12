---
read_when:
    - 你想變更預設模型，或檢視供應商身分驗證狀態
    - 你想掃描可用的模型/提供者，並偵錯身分驗證設定檔
summary: '`openclaw models` 的 CLI 參考（status/list/set/scan、別名、備援、身分驗證）'
title: 模型
x-i18n:
    generated_at: "2026-05-12T00:58:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型探索、掃描與設定（預設模型、後援、驗證設定檔）。

相關：

- 提供者 + 模型：[模型](/zh-TW/providers/models)
- 模型選擇概念 + `/models` 斜線指令：[模型概念](/zh-TW/concepts/models)
- 提供者驗證設定：[開始使用](/zh-TW/start/getting-started)

## 常用指令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` 會顯示解析後的預設/後援，以及驗證概覽。
當提供者使用量快照可用時，OAuth/API 金鑰狀態區段會包含
提供者使用期間與配額快照。
目前的使用期間提供者：Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi 與 z.ai。可用時，使用量驗證會來自提供者專屬掛鉤；
否則 OpenClaw 會退回到從驗證設定檔、env 或設定中比對 OAuth/API 金鑰
憑證。
在 `--json` 輸出中，`auth.providers` 是感知 env/設定/儲存區的提供者
概覽，而 `auth.oauth` 僅是驗證儲存區設定檔健康狀態。
加入 `--probe` 可對每個已設定的提供者設定檔執行即時驗證探測。
探測是真實請求（可能會消耗 token 並觸發速率限制）。
使用 `--agent <id>` 可檢查已設定 agent 的模型/驗證狀態。省略時，
此指令會使用已設定的 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`，否則使用
已設定的預設 agent。
探測列可來自驗證設定檔、env 憑證或 `models.json`。
若要排查 Codex OAuth 問題，`openclaw models status`、
`openclaw models auth list --provider openai-codex` 與
`openclaw config get agents.defaults.model --json` 是最快確認 agent 是否有可用
`openai-codex` 驗證設定檔，並能透過原生 Codex 執行階段使用
`openai/*` 的方式。請參閱 [OpenAI 提供者設定](/zh-TW/providers/openai#check-and-recover-codex-oauth-routing)。

注意事項：

- `models set <model-or-alias>` 接受 `provider/model` 或別名。
- `models list` 是唯讀：它會讀取設定、驗證設定檔、既有目錄狀態，
  以及提供者擁有的目錄列，但不會重寫 `models.json`。
- `Auth` 欄位是提供者層級且唯讀。它由本機驗證設定檔中繼資料、
  env 標記、已設定的提供者金鑰、本機提供者標記、AWS Bedrock env/設定檔標記，
  以及 Plugin 合成驗證中繼資料計算而來；它不會載入提供者執行階段、
  讀取 keychain 祕密、呼叫提供者 API，或證明精確的個別模型執行就緒狀態。
- `models list --all --provider <id>` 可以包含來自 Plugin manifest 或綁定提供者目錄中繼資料的
  提供者擁有靜態目錄列，即使你尚未向該提供者驗證。那些列仍會顯示為
  不可用，直到設定了相符的驗證。
- 當提供者目錄探索速度緩慢時，`models list` 會讓控制平面保持回應。
  預設與已設定檢視會在短暫等待後退回到已設定或合成模型列，
  並讓探索在背景完成。當你需要精確且完整的已探索目錄，
  且願意等待提供者探索時，請使用 `--all`。
- 廣泛的 `models list --all` 會將 manifest 目錄列合併覆蓋到登錄列之上，
  而不載入提供者執行階段補充掛鉤。依提供者篩選的 manifest 快速路徑
  只使用標記為 `static` 的提供者；標記為 `refreshable` 的提供者會維持由登錄/快取支援，
  並附加 manifest 列作為補充，而標記為 `runtime` 的提供者會維持登錄/執行階段探索。
- `models list` 會保持原生模型中繼資料與執行階段上限彼此區分。在表格
  輸出中，當有效執行階段上限不同於原生情境視窗時，`Ctx` 會顯示
  `contextTokens/contextWindow`；當提供者公開該上限時，JSON 列會包含 `contextTokens`。
- `models list --provider <id>` 會依提供者 ID 篩選，例如 `moonshot` 或
  `openai-codex`。它不接受來自互動式提供者選擇器的顯示標籤，
  例如 `Moonshot AI`。
- 模型參照會透過在**第一個** `/` 分割來解析。如果模型 ID 包含 `/`（OpenRouter 風格），請包含提供者前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供者，OpenClaw 會先將輸入解析為別名，接著解析為該精確模型 ID 的唯一已設定提供者相符項，
  然後才會退回到已設定的預設提供者並顯示淘汰警告。
  如果該提供者不再公開已設定的預設模型，OpenClaw
  會退回到第一個已設定的提供者/模型，而不是顯示過時的已移除提供者預設值。
- `models status` 可能會在驗證輸出中顯示 `marker(<value>)`，用於非祕密預留位置（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是將它們遮罩為祕密。

### 模型掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` 目錄，並為
後援用途排名候選項。目錄本身是公開的，因此僅中繼資料掃描不需要
OpenRouter 金鑰。

預設情況下，OpenClaw 會嘗試使用即時模型呼叫探測工具與圖片支援。
如果未設定 OpenRouter 金鑰，該指令會退回到僅中繼資料
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
結果僅供參考，且不會套用到設定。

### 模型狀態

選項：

- `--json`
- `--plain`
- `--check`（結束碼 1=已過期/缺少，2=即將過期）
- `--probe`（對已設定驗證設定檔的即時探測）
- `--probe-provider <name>`（探測一個提供者）
- `--probe-profile <id>`（重複或以逗號分隔的設定檔 ID）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（已設定的 agent ID；覆寫 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`）

`--json` 會保留 stdout 給 JSON 酬載。驗證設定檔、提供者
與啟動診斷會路由到 stderr，因此腳本可以將 stdout 直接管線傳入
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

預期的探測詳細資料/原因代碼案例：

- `excluded_by_auth_order`：已儲存設定檔存在，但明確的
  `auth.order.<provider>` 省略了它，因此探測會回報排除狀態，而不是
  嘗試它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：
  設定檔存在，但不符合資格/無法解析。
- `no_model`：提供者驗證存在，但 OpenClaw 無法為該提供者解析出可探測的
  模型候選項。

## 別名 + 後援

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

`models auth add` 是互動式驗證輔助工具。它可以啟動提供者驗證
流程（OAuth/API 金鑰），或根據你選擇的提供者，引導你進行手動 token 貼上。

`models auth list` 會列出所選 agent 的已儲存驗證設定檔，而不
列印 token、API 金鑰或 OAuth 祕密材料。使用 `--provider <id>` 可
篩選到單一提供者，例如 `openai-codex`；使用 `--json` 可供腳本處理。

`models auth login` 會執行提供者 Plugin 的驗證流程（OAuth/API 金鑰）。使用
`openclaw plugins list` 查看已安裝哪些提供者。
使用 `openclaw models auth --agent <id> <subcommand>` 可將驗證結果寫入
特定已設定的 agent 儲存區。父層 `--agent` 旗標會由
`add`、`list`、`login`、`setup-token`、`paste-token` 與
`login-github-copilot` 遵循。

對於 OpenAI 模型，`--provider openai` 預設為 ChatGPT/Codex 帳戶登入。
僅在你想新增 OpenAI API 金鑰設定檔時，通常作為 Codex 訂閱限制的備援，
才使用 `--method api-key`。舊版
`--provider openai-codex` 拼法仍可用於既有腳本。

範例：

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

注意事項：

- `setup-token` 與 `paste-token` 仍是供公開 token 驗證方法的提供者使用的通用 token 指令。
- `setup-token` 需要互動式 TTY，並執行提供者的 token 驗證
  方法（當該提供者公開 `setup-token` 方法時，預設使用該方法）。
- `paste-token` 接受在其他地方產生或來自自動化的 token 字串。
- `paste-token` 需要 `--provider`，會提示輸入 token 值，並將
  它寫入預設設定檔 ID `<provider>:manual`，除非你傳入
  `--profile-id`。
- `paste-token --expires-in <duration>` 會從相對期間（例如 `365d` 或 `12h`）儲存絕對 token 到期時間。
- Anthropic 注意事項：Anthropic 員工告訴我們 OpenClaw 風格的 Claude CLI 使用已再次獲准，因此除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用與 `claude -p` 使用視為此整合受許可的方式。
- Anthropic `setup-token` / `paste-token` 仍作為受支援的 OpenClaw token 路徑可用，但 OpenClaw 現在會在可用時優先使用 Claude CLI 重用與 `claude -p`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
