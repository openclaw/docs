---
read_when:
    - 你想變更預設模型或查看提供者驗證狀態
    - 你想掃描可用的模型/供應商並偵錯驗證設定檔
summary: '`openclaw models` 的命令列介面參考（status/list/set/scan、別名、後援、驗證）'
title: 模型
x-i18n:
    generated_at: "2026-07-05T11:12:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58fdd11c745bc823f7dac5be9aa75f7dbbe622b66ffb9d9fd3505f0453371f88
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

模型探索、掃描與設定（預設模型、後援、驗證設定檔）。

相關：

- 供應商 + 模型：[模型](/zh-TW/providers/models)
- 模型選擇概念 + `/models` 斜線命令：[模型概念](/zh-TW/concepts/models)
- 供應商驗證設定：[開始使用](/zh-TW/start/getting-started)

## 常用命令

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

`status` 和 `auth` 子命令接受 `--agent <id>` 以指定已設定的代理；`list`、`scan`、`aliases` 和 `fallbacks`/`image-fallbacks` 一律使用已設定的預設代理，而 `set`/`set-image` 會直接拒絕 `--agent`。省略時，支援 `--agent` 的命令會使用 `OPENCLAW_AGENT_DIR`（如果已設定），否則使用已設定的預設代理。

### 狀態

`openclaw models status` 會顯示解析後的預設值/後援，加上驗證概覽。當供應商用量快照可用時，OAuth/API 金鑰狀態區段會包含供應商用量時段與配額快照。目前支援用量時段的供應商：Anthropic、GitHub Copilot、Gemini 命令列介面、OpenAI、MiniMax、Xiaomi 和 z.ai。用量驗證會在可用時來自供應商專屬鉤子；否則 OpenClaw 會退回使用驗證設定檔、環境變數或設定中相符的 OAuth/API 金鑰憑證。

在 `--json` 輸出中，`auth.providers` 是感知環境變數/設定/儲存區的供應商概覽，而 `auth.oauth` 僅是驗證儲存區設定檔健康狀態。

選項：

| 旗標                      | 效果                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON 輸出；驗證設定檔、供應商與啟動診斷會輸出到 stderr，讓 stdout 保持可用管線傳入 `jq`。                 |
| `--plain`                 | 純文字輸出。                                                                                                |
| `--check`                 | 如果驗證即將到期/已到期，則以非零結束：`1` = 已到期/缺少，`2` = 即將到期。                                |
| `--probe`                 | 對已設定的驗證設定檔進行即時探測。真實請求；可能消耗權杖並觸發速率限制。                                  |
| `--probe-provider <name>` | 只探測一個供應商。                                                                                          |
| `--probe-profile <id>`    | 探測特定驗證設定檔 ID（可重複或以逗號分隔）。                                                              |
| `--probe-timeout <ms>`    | 每次探測逾時。                                                                                              |
| `--probe-concurrency <n>` | 並行探測數。                                                                                                |
| `--probe-max-tokens <n>`  | 探測最大權杖數（盡力而為）。                                                                                |
| `--agent <id>`            | 已設定的代理 ID；覆寫 `OPENCLAW_AGENT_DIR`。                                                                |

探測列可來自驗證設定檔、環境變數憑證或 `models.json`。探測狀態分類：`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`。

當探測尚未到達模型呼叫時，預期可見的探測詳細資訊/原因代碼：

- `excluded_by_auth_order`：已存在已儲存的設定檔，但明確的 `auth.order.<provider>` 省略了它，因此探測會回報排除原因，而不是嘗試它。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`：設定檔存在，但不符合資格或無法解析。
- `ineligible_profile`：設定檔因其他原因與供應商設定不相容。
- `no_model`：供應商驗證存在，但 OpenClaw 無法為該供應商解析可探測的模型候選項。

針對 OpenAI ChatGPT/Codex OAuth 疑難排解，`openclaw models status`、`openclaw models auth list --provider openai` 和 `openclaw config get agents.defaults.model --json` 是確認代理是否具備可透過原生 Codex 執行階段用於 `openai/*` 的可用 `openai` OAuth 設定檔的最快方式。請參閱 [OpenAI 供應商設定](/zh-TW/providers/openai#check-and-recover-codex-oauth-routing)。

### 列出

`openclaw models list` 是唯讀：它會讀取設定、驗證設定檔、現有目錄狀態與供應商擁有的目錄列，但絕不重寫 `models.json`。

選項：`--all`（完整目錄）、`--local`（篩選為本機模型）、`--provider <id>`、`--json`、`--plain`。

注意事項：

- `Auth` 欄位是供應商層級且唯讀。它會依據本機驗證設定檔中繼資料、環境變數標記、已設定的供應商金鑰、本機供應商標記、AWS Bedrock 環境變數/設定檔標記，以及外掛合成驗證中繼資料計算；它不會載入供應商執行階段、讀取鑰匙圈秘密、呼叫供應商 API，或證明每個模型的精確執行就緒狀態。
- `models list --all --provider <id>` 可包含來自外掛資訊清單或內建供應商目錄中繼資料的供應商擁有靜態目錄列，即使你尚未向該供應商驗證。這些列仍會顯示為不可用，直到設定相符的驗證為止。
- `models list` 會在供應商目錄探索緩慢時保持控制平面回應。預設與已設定檢視會在短暫等待後退回使用已設定或合成的模型列，並讓探索在背景完成。當你需要精確完整的已探索目錄且願意等待供應商探索時，請使用 `--all`。
- 廣泛的 `models list --all` 會將資訊清單目錄列合併到登錄列之上，但不載入供應商執行階段補充鉤子。供應商篩選的資訊清單快速路徑僅使用標記為 `static` 的供應商；標記為 `refreshable` 的供應商會維持以登錄/快取為基礎並附加資訊清單列作為補充，而標記為 `runtime` 的供應商則維持使用登錄/執行階段探索。
- `models list` 會區分原生模型中繼資料與執行階段上限。在表格輸出中，當有效執行階段上限與原生內容視窗不同時，`Ctx` 會顯示 `contextTokens/contextWindow`；當供應商公開該上限時，JSON 列會包含 `contextTokens`。
- `models list --provider <id>` 會依供應商 ID 篩選，例如 `moonshot` 或 `openai`。它不接受互動式供應商選擇器中的顯示標籤，例如 `Moonshot AI`。
- 模型參照會依**第一個** `/` 分割來剖析。如果模型 ID 包含 `/`（OpenRouter 風格），請包含供應商前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略供應商，OpenClaw 會先將輸入解析為別名，再解析為該確切模型 ID 的唯一已設定供應商相符項，最後才退回到已設定的預設供應商並顯示棄用警告。如果該供應商不再公開已設定的預設模型，OpenClaw 會退回到第一個已設定的供應商/模型，而不是顯示過時的已移除供應商預設值。
- `models status` 可能會在驗證輸出中顯示 `marker(<value>)` 作為非秘密佔位符（例如 `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`），而不是將它們遮罩為秘密。

### 設定預設 / 圖像模型

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` 會寫入 `agents.defaults.model.primary`；`set-image` 會寫入 `agents.defaults.imageModel.primary`。兩者都接受 `provider/model` 或已設定別名。當新選取的模型需要時，`set` 也會修復 Codex/Copilot 執行階段外掛安裝；`set-image` 不會。兩個命令都不接受 `--agent`；它們一律寫入代理預設值。

### 掃描

`models scan` 會讀取 OpenRouter 的公開 `:free` 目錄，並為後援用途排序候選項。目錄本身是公開的，因此僅中繼資料掃描不需要 OpenRouter 金鑰。

預設情況下，OpenClaw 會嘗試以即時模型呼叫探測工具與圖像支援。如果未設定 OpenRouter 金鑰，命令會退回到僅中繼資料輸出，並說明 `:free` 模型仍需要 `OPENROUTER_API_KEY` 才能探測和推論。

選項：

- `--no-probe`（僅中繼資料；不查詢設定/秘密）
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

`--set-default` 和 `--set-image` 需要即時探測；僅中繼資料的掃描結果僅供參考，不會套用到設定。

## 別名

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

別名會以 `agents.defaults.models.<key>.alias` 儲存在每個模型項目中。`add` 會先將 `<model-or-alias>` 解析為標準供應商/模型鍵，因此為別名設定別名會重新指向它，而不是形成鏈結。

## 後援

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

管理 `agents.defaults.model.fallbacks`。`openclaw models image-fallbacks list|add|remove|clear` 會以相同的子命令形狀管理平行的 `agents.defaults.imageModel.fallbacks` 清單。

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

`models auth add` 是互動式驗證輔助工具。它可以啟動供應商驗證流程（OAuth/API 金鑰），或依據你選擇的供應商，引導你手動貼上權杖。

`models auth list` 會列出所選代理已儲存的驗證設定檔，且不列印權杖、API 金鑰或 OAuth 秘密資料。使用 `--provider <id>` 可篩選為單一供應商，例如 `openai`；使用 `--json` 可用於指令碼。

`models auth login` 會執行供應商外掛的驗證流程（OAuth/API 金鑰）。使用 `openclaw plugins list` 查看已安裝的供應商。`login` 對於支援登入期間具名設定檔的供應商，接受 `--profile-id <id>`（用此將同一供應商的多個登入分開保留）、`--method <id>` 以選擇特定驗證方法、`--device-code` 作為 `--method device-code` 的捷徑、`--set-default` 以套用供應商建議的預設模型，以及 `--force` 以先移除該供應商的現有設定檔（當快取的 OAuth 設定檔卡住，或你想切換帳號時使用）。

`models auth login-github-copilot` 是 `models auth login --provider github-copilot --method device`（GitHub 裝置流程）的捷徑；它接受 `--yes` 以不提示就覆寫現有設定檔。

使用 `openclaw models auth --agent <id> <subcommand>` 可將驗證結果寫入特定已設定的代理儲存區。父層 `--agent` 旗標會被 `add`、`list`、`login`、`paste-api-key`、`setup-token`、`paste-token`、`login-github-copilot` 和 `order get`/`set`/`clear` 遵循。

對於 OpenAI 模型，`--provider openai` 預設為 ChatGPT/Codex 帳號登入。只有在想新增 OpenAI API 金鑰設定檔時才使用 `--method api-key`，通常是作為 Codex 訂閱限制的備援。執行 `openclaw doctor --fix` 可將較舊的舊版 OpenAI Codex 前綴驗證/設定檔狀態遷移到 `openai`。

範例：

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

注意事項：

- `paste-api-key` 接受在其他地方產生的 API 金鑰，會提示輸入金鑰值，並將其寫入預設設定檔 ID `<provider>:manual`，除非你傳入 `--profile-id`。在自動化中，請透過 stdin 管線傳入金鑰，例如 `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`。
- `setup-token` 和 `paste-token` 仍是供公開權杖驗證方法的提供者使用的通用權杖命令。
- `setup-token` 需要互動式 TTY，並執行提供者的權杖驗證方法（當該提供者公開 `setup-token` 方法時，預設使用該提供者的 `setup-token` 方法）。
- `paste-token` 需要 `--provider`，預設會提示輸入權杖值，並將其寫入預設設定檔 ID `<provider>:manual`，除非你傳入 `--profile-id`。在自動化中，請改用 stdin 管線傳入權杖，而不是將其作為引數傳入，這樣提供者憑證就不會出現在 shell 歷史記錄或程序清單中。
- `paste-token --expires-in <duration>` 會根據相對持續時間（例如 `365d` 或 `12h`）儲存絕對權杖到期時間。
- 對於 `openai`，OpenAI API 金鑰和 ChatGPT/OAuth 權杖材料是不同的驗證形態。請對 `sk-...` OpenAI API 金鑰使用 `paste-api-key`，只有權杖驗證材料才使用 `paste-token`。
- Anthropic：`setup-token`/`paste-token` 是 OpenClaw 支援的 `anthropic` 驗證路徑，但 OpenClaw 偏好在主機上可用時重用 Claude 命令列介面（`claude -p`）。
- `auth order get/set/clear` 會管理一個提供者的每代理驗證設定檔順序覆寫，儲存在 `auth-state.json` 中（與 `auth.order.<provider>` 設定鍵分開）。`set` 會依優先順序接受一個或多個設定檔 ID；`clear` 會退回使用設定/輪詢排序。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [模型選擇](/zh-TW/concepts/model-providers)
- [模型容錯移轉](/zh-TW/concepts/model-failover)
