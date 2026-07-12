---
read_when:
    - 你想要變更預設模型或查看提供者驗證狀態
    - 你想要掃描可用的模型／供應商，並偵錯驗證設定檔
summary: '`openclaw models` 的命令列介面參考（狀態/列出/設定/掃描、別名、備援、驗證）'
title: 模型
x-i18n:
    generated_at: "2026-07-12T14:23:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型探索、掃描與設定（預設模型、備援模型、驗證設定檔）。

相關內容：

- 供應商與模型：[模型](/zh-TW/providers/models)
- 模型選擇概念與 `/models` 斜線命令：[模型概念](/zh-TW/concepts/models)
- 供應商驗證設定：[開始使用](/zh-TW/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

`status` 與 `auth` 子命令接受 `--agent <id>`，以指定已設定的代理程式；`list`、`scan`、`aliases` 與 `fallbacks`/`image-fallbacks` 一律使用已設定的預設代理程式，而 `set`/`set-image` 則完全不接受 `--agent`。省略時，支援 `--agent` 的命令會在已設定 `OPENCLAW_AGENT_DIR` 時使用它，否則使用已設定的預設代理程式。

### 狀態

`openclaw models status` 會顯示解析後的預設模型／備援模型，以及驗證概況。當供應商用量快照可用時，OAuth/API 金鑰狀態區段會包含供應商用量時段與配額快照。目前支援用量時段的供應商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI、MiniMax、Xiaomi 與 z.ai。用量驗證會在可用時來自供應商專屬的鉤子；否則 OpenClaw 會改用驗證設定檔、環境變數或設定中相符的 OAuth/API 金鑰認證資訊。

在 `--json` 輸出中，`auth.providers` 是可感知環境變數／設定／儲存區的供應商概況，而 `auth.oauth` 僅表示驗證儲存區中的設定檔健康狀態。

選項：

| 旗標                      | 效果                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON 輸出；驗證設定檔、供應商與啟動診斷會傳送至 stderr，讓 stdout 仍可透過管線傳給 `jq`。 |
| `--plain`                 | 純文字輸出。                                                                                            |
| `--check`                 | 若驗證即將到期／已到期，則以非零狀態結束：`1` = 已到期／缺少，`2` = 即將到期。                             |
| `--probe`                 | 對已設定的驗證設定檔進行即時探測。會發出實際請求；可能消耗權杖並觸發速率限制。            |
| `--probe-provider <name>` | 僅探測一個供應商。                                                                                      |
| `--probe-profile <id>`    | 探測指定的驗證設定檔 ID（可重複指定或以逗號分隔）。                                                  |
| `--probe-timeout <ms>`    | 每次探測的逾時時間。                                                                                            |
| `--probe-concurrency <n>` | 並行探測數。                                                                                            |
| `--probe-max-tokens <n>`  | 探測權杖上限（盡力而為）。                                                                               |
| `--agent <id>`            | 已設定的代理程式 ID；覆寫 `OPENCLAW_AGENT_DIR`。                                                          |

探測列可來自驗證設定檔、環境變數認證資訊或 `models.json`。探測狀態分類：`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`。

當探測從未進入模型呼叫時，可能出現的探測詳細資訊／原因代碼：

- `excluded_by_auth_order`：已儲存設定檔存在，但明確設定的 `auth.order.<provider>` 省略了它，因此探測會回報排除原因，而不會嘗試使用它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：設定檔存在，但不符合使用資格或無法解析。
- `ineligible_profile`：設定檔因其他原因與供應商設定不相容。
- `no_model`：供應商驗證存在，但 OpenClaw 無法為該供應商解析出可探測的模型候選項目。

若要針對 OpenAI ChatGPT/Codex OAuth 進行疑難排解，`openclaw models status`、`openclaw models auth list --provider openai` 與 `openclaw config get agents.defaults.model --json` 是確認代理程式是否具有可供原生 Codex 執行階段透過 `openai/*` 使用的 `openai` OAuth 設定檔的最快方式。請參閱 [OpenAI 供應商設定](/zh-TW/providers/openai#check-and-recover-codex-oauth-routing)。

### 列出

`openclaw models list` 是唯讀命令：它會讀取設定、驗證設定檔、現有目錄狀態與供應商擁有的目錄資料列，但絕不會重寫 `models.json`。

選項：`--all`（完整目錄）、`--local`（篩選本機模型）、`--provider <id>`、`--json`、`--plain`。

注意事項：

- `Auth` 欄為唯讀。對於 OpenAI 等供應商擁有的模型路由，它會依有效的 `auth.order`、環境變數／設定認證資訊，以及已解析的命令範圍 SecretRefs，將每個資料列的 API／基礎 URL 路由與符合資格的設定檔配對。當具體 OpenAI 資料列的路由政策不可用時，其狀態會維持未知，而不會借用供應商層級的驗證；僅限供應商的舊版檢查與其他供應商則保留供應商層級的行為。外掛合成驗證中繼資料僅是執行階段能力提示，不是原生帳號驗證的證明，因此依賴帳號的路由在沒有正面登錄資料證據時會維持未知。此命令不會載入供應商執行階段、讀取鑰匙圈機密、呼叫供應商 API，或證明確切的執行就緒狀態。
- 即使你尚未向該供應商完成驗證，`models list --all --provider <id>` 仍可包含來自外掛資訊清單或內建供應商目錄中繼資料、由供應商擁有的靜態目錄資料列。在設定相符的驗證前，這些資料列仍會顯示為不可用。
- 當供應商目錄探索速度緩慢時，`models list` 仍會維持控制平面的回應能力。預設與已設定的檢視會在短暫等待後，改用已設定或合成的模型資料列，並讓探索在背景完成。當你需要確切、完整的探索目錄，且願意等待供應商探索時，請使用 `--all`。
- 廣泛的 `models list --all` 會將資訊清單目錄資料列合併並覆蓋登錄資料列，而不載入供應商執行階段補充鉤子。依供應商篩選的資訊清單快速路徑僅使用標示為 `static` 的供應商；標示為 `refreshable` 的供應商仍以登錄／快取為基礎，並附加資訊清單資料列作為補充，而標示為 `runtime` 的供應商則繼續使用登錄／執行階段探索。
- `models list` 會將原生模型中繼資料與執行階段上限分開處理。在表格輸出中，若有效執行階段上限與原生上下文視窗不同，`Ctx` 會顯示 `contextTokens/contextWindow`；當供應商公開該上限時，JSON 資料列會包含 `contextTokens`。
- 對於供應商擁有的路由，`models list` 會將一個邏輯供應商／模型資料列投影至所選路由。`Input` 與 `Ctx` 僅來自完全相符的實體路由目錄資料列，並在最後套用明確設定的邏輯覆寫；無法解析的路由選擇會顯示未知能力欄位，而不會借用同層路由的中繼資料。
- `models list --provider <id>` 會依供應商 ID 篩選，例如 `moonshot` 或 `openai`。它不接受互動式供應商選擇器中的顯示標籤，例如 `Moonshot AI`。
- 模型參照會在**第一個** `/` 處分割。若模型 ID 包含 `/`（OpenRouter 樣式），請包含供應商前綴（例如：`openrouter/moonshotai/kimi-k2`）。
- 若省略供應商，OpenClaw 會先將輸入解析為別名，再嘗試比對已設定供應商中唯一且模型 ID 完全相符的項目，最後才會退回已設定的預設供應商，並顯示棄用警告。若該供應商已不再提供已設定的預設模型，OpenClaw 會改用第一個已設定的供應商／模型，而不是顯示已移除供應商的過時預設值。
- 對於非機密預留位置（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），`models status` 可能會在驗證輸出中顯示 `marker(<value>)`，而不是將其遮罩成機密。

### 設定預設／圖片模型

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` 會寫入 `agents.defaults.model.primary`；`set-image` 會寫入 `agents.defaults.imageModel.primary`。兩者都接受 `provider/model` 或已設定的別名。當新選取的模型需要時，`set` 也會修復 Codex/Copilot 執行階段外掛安裝；`set-image` 則不會。兩個命令都不接受 `--agent`；它們一律寫入代理程式預設值。

### 掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` 目錄，並為備援用途排列候選項目。目錄本身是公開的，因此僅中繼資料掃描不需要 OpenRouter 金鑰。

OpenClaw 預設會嘗試透過即時模型呼叫探測工具與圖片支援。若未設定 OpenRouter 金鑰，此命令會改用僅中繼資料輸出，並說明 `:free` 模型仍需要 `OPENROUTER_API_KEY` 才能進行探測與推論。

選項：

- `--no-probe`（僅中繼資料；不查詢設定／機密）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（目錄請求與每次探測的逾時時間）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 與 `--set-image` 需要即時探測；僅中繼資料的掃描結果只供參考，不會套用至設定。

## 別名

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

別名會依模型項目儲存為 `agents.defaults.models.<key>.alias`。`add` 會先將 `<model-or-alias>` 解析為標準供應商／模型鍵，因此為別名再設定別名時，會將其重新指向，而不是形成鏈結。

## 備援模型

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

管理 `agents.defaults.model.fallbacks`。`openclaw models image-fallbacks list|add|remove|clear` 會以相同的子命令形式管理對應的 `agents.defaults.imageModel.fallbacks` 清單。

## 驗證設定檔

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` 是互動式驗證輔助工具。視你選擇的供應商而定，它可以啟動供應商驗證流程（OAuth/API 金鑰），或引導你手動貼上權杖。

`models auth list` 會列出所選代理程式已儲存的驗證設定檔，但不會印出權杖、API 金鑰或 OAuth 機密內容。使用 `--provider <id>` 可篩選單一供應商，例如 `openai`；使用 `--json` 則適合指令碼處理。

`models auth login` 會執行供應商外掛的驗證流程（OAuth/API 金鑰）。使用 `openclaw plugins list` 查看已安裝的供應商。對於登入時支援具名設定檔的供應商，`login` 接受 `--profile-id <id>`（可用它將同一供應商的多個登入分開保存）、`--method <id>` 可選擇特定驗證方式、`--device-code` 是 `--method device-code` 的快捷方式、`--set-default` 可套用供應商建議的預設模型，而 `--force` 會先移除該供應商的現有設定檔（當快取的 OAuth 設定檔卡住，或你想切換帳號時使用）。

`models auth login-github-copilot` 是 `models auth login --provider github-copilot --method device`（GitHub 裝置流程）的快捷方式；它接受 `--yes`，可在不提示的情況下覆寫現有設定檔。

使用 `openclaw models auth --agent <id> <subcommand>`，將驗證結果寫入特定的已設定代理程式儲存區。父層 `--agent` 旗標適用於 `add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token`、`login-github-copilot`，以及 `order get`/`set`/`clear`。

對於 OpenAI 模型，`--provider openai` 預設使用 ChatGPT/Codex 帳戶登入。只有在你想新增 OpenAI API 金鑰設定檔時，才使用 `--method api-key`；這通常是作為 Codex 訂閱限制的備援。執行 `openclaw doctor --fix`，將較舊的傳統 OpenAI Codex 前綴驗證／設定檔狀態遷移至 `openai`。

範例：

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

注意事項：

- `paste-api-key` 接受在其他地方產生的 API 金鑰，會提示你輸入金鑰值，並將其寫入預設設定檔 ID `<provider>:manual`，除非你傳入 `--profile-id`。進行自動化時，請透過標準輸入以管線傳入金鑰，例如 `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`。
- `setup-token` 和 `paste-token` 仍是通用權杖命令，供公開權杖驗證方法的供應商使用。
- `setup-token` 需要互動式 TTY，並執行供應商的權杖驗證方法（若該供應商有公開 `setup-token` 方法，預設使用該方法）。
- `paste-token` 需要 `--provider`，預設會提示你輸入權杖值，並將其寫入預設設定檔 ID `<provider>:manual`，除非你傳入 `--profile-id`。進行自動化時，請透過標準輸入以管線傳入權杖，而不是將其作為引數傳入，避免供應商認證資訊出現在 shell 歷程記錄或程序清單中。
- `paste-token --expires-in <duration>` 會根據 `365d` 或 `12h` 等相對期間，儲存權杖的絕對到期時間。
- 對於 `openai`，OpenAI API 金鑰與 ChatGPT/OAuth 權杖資料是不同的驗證形式。請使用 `paste-api-key` 處理 `sk-...` OpenAI API 金鑰，並僅將 `paste-token` 用於權杖驗證資料。
- Anthropic：`setup-token`/`paste-token` 是 OpenClaw 對 `anthropic` 支援的驗證路徑，但若主機上可使用 Claude 命令列介面 (`claude -p`)，OpenClaw 會優先重複使用它。
- `auth order get/set/clear` 管理單一供應商的個別代理程式驗證設定檔順序覆寫，並儲存在 `auth-state.json` 中（與 `auth.order.<provider>` 設定鍵分開）。`set` 依優先順序接受一或多個設定檔 ID；`clear` 則會回復使用設定／循環排序。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
