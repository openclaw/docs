---
read_when:
    - 偵錯模型驗證或 OAuth 到期
    - 記錄驗證或憑證儲存
summary: 模型驗證：OAuth、API 金鑰、Claude 命令列介面重用，以及 Anthropic setup-token
title: 身分驗證
x-i18n:
    generated_at: "2026-07-05T11:18:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
本頁說明**模型供應商**驗證（API 金鑰、OAuth、Claude CLI 重用、Anthropic setup-token）。如需**閘道連線**驗證（權杖、密碼、trusted-proxy），請參閱[設定](/zh-TW/gateway/configuration)與 [Trusted Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支援模型供應商使用 OAuth 和 API 金鑰。對於常駐的閘道主機，API 金鑰是最可預測的選項；訂閱/OAuth 流程在符合你的供應商帳號模式時也可使用。

- 完整 OAuth 流程與儲存布局：[/concepts/oauth](/zh-TW/concepts/oauth)
- 基於 SecretRef 的驗證（`env`/`file`/`exec` 供應商）：[密鑰管理](/zh-TW/gateway/secrets)
- `models status --probe` 使用的憑證資格/原因代碼：[驗證憑證語意](/zh-TW/auth-credential-semantics)

## 建議設定：API 金鑰（任何供應商）

1. 在你的供應商控制台建立 API 金鑰。
2. 將它放在**閘道主機**（執行 `openclaw gateway` 的機器）上：

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果閘道在 systemd/launchd 下執行，請將金鑰放在 `~/.openclaw/.env`，讓常駐程式可以讀取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. 重新啟動閘道程序（或常駐程式），然後再次檢查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自行管理環境變數，`openclaw onboard` 也可以儲存 API 金鑰供常駐程式使用。完整的環境載入優先順序（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）請參閱[環境變數](/zh-TW/help/environment)。

## Anthropic：Claude CLI 重用

Anthropic setup-token 驗證仍是受支援的路徑。此整合也允許 Claude CLI 重用（`claude -p` 風格用法）；當主機上已有 Claude CLI 登入時，這是本機/桌面使用的首選路徑。對於長期執行的閘道主機，Anthropic API 金鑰仍是最可預測的選擇，並能明確控制伺服器端計費。

Claude CLI 重用的主機設定：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

這是兩個步驟：先在主機上將 Claude Code 登入 Anthropic，然後告訴 OpenClaw 透過本機 `claude-cli` 後端路由 Anthropic 模型選擇，並儲存相符的 OpenClaw 驗證設定檔。

如果 `claude` 不在 `PATH` 上，請安裝 Claude Code，或將 `agents.defaults.cliBackends.claude-cli.command` 設為二進位檔路徑。

## 手動輸入權杖

適用於任何供應商；會寫入每個 agent 的 SQLite 驗證儲存，並更新設定：

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw 會從每個 agent 的 `openclaw-agent.sqlite` 讀取驗證設定檔。端點詳細資料（`baseUrl`、`api`、模型 ID、標頭、逾時）應放在 `openclaw.json` 或 `models.json` 的 `models.providers.<id>` 底下，而不是驗證設定檔中。

如果較舊的安裝仍有 `auth-profiles.json`、`auth-state.json`，或像 `{ "openrouter": { "apiKey": "..." } }` 這樣的扁平形狀，請執行 `openclaw doctor --fix` 將其匯入 SQLite；doctor 會在原始 JSON 檔案旁保留附時間戳記的備份。

Bedrock `auth: "aws-sdk"` 這類外部驗證路由不是憑證。對於具名 Bedrock 路由，請在 `openclaw.json` 中設定 `auth.profiles.<id>.mode: "aws-sdk"`，不要將 `type: "aws-sdk"` 寫入驗證設定檔儲存。`openclaw doctor --fix` 會將舊版 AWS SDK 標記從憑證儲存遷移到設定中繼資料。

### SecretRef 支援的憑證

- `api_key` 憑證可以使用 `keyRef: { source, provider, id }`
- `token` 憑證可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式設定檔會拒絕 SecretRef 憑證：如果 `auth.profiles.<id>.mode` 是 `"oauth"`，該設定檔的 SecretRef 支援 `keyRef`/`tokenRef` 會被拒絕。

## 檢查模型驗證狀態

```bash
openclaw models status
openclaw doctor
```

適合自動化的檢查；過期/缺少時結束代碼為 `1`，即將過期時為 `2`：

```bash
openclaw models status --check
```

即時驗證探測（加入 `--probe-provider`、`--probe-profile`、`--probe-timeout`、`--probe-concurrency` 或 `--probe-max-tokens` 以縮小範圍）：

```bash
openclaw models status --probe
```

注意：

- 探測列可能來自驗證設定檔、環境憑證或 `models.json`。
- 如果 `auth.order.<provider>` 省略了已儲存的設定檔，探測會對該設定檔回報 `excluded_by_auth_order`，而不是嘗試使用它。
- 如果驗證存在，但 OpenClaw 無法為該供應商解析可探測的模型，探測會回報 `status: no_model`。
- 速率限制冷卻可以限定到模型範圍：某個設定檔因一個模型而冷卻時，仍可服務同一供應商上的相鄰模型。

選用的維運指令碼（systemd/Termux）：[驗證監控指令碼](/zh-TW/help/scripts#auth-monitoring-scripts)。

## API 金鑰輪替（閘道）

某些供應商在呼叫遇到供應商速率限制時，會使用另一個已設定金鑰重試請求。

每個供應商的金鑰優先順序：

1. `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一覆寫，固定使用一把金鑰）
2. `<PROVIDER>_API_KEYS`（以逗號/空格/分號分隔的清單）
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*`（任何具有此前綴的環境變數）

Google 供應商（`google`、`google-vertex`）另外會回退到 `GOOGLE_API_KEY`。合併後的清單在使用前會去重。

OpenClaw 只會在錯誤訊息符合以下內容時輪替到下一把金鑰：`rate_limit`、`rate limit`、`429`、`quota exceeded`/`quota_exceeded`、`resource exhausted`/`resource_exhausted`，或 `too many requests`。其他錯誤不會使用替代金鑰重試。如果所有金鑰都失敗，會傳回最後一次嘗試的最終錯誤。

<Note>
像 `ThrottlingException`、`concurrency limit reached` 或 `workers_ai ... quota limit exceeded` 這類供應商特定片語會驅動**容錯移轉/重試分類**（在重複失敗時切換模型或供應商），這與上述 API 金鑰輪替是不同的機制。
</Note>

移除已儲存的驗證不會撤銷供應商端的金鑰；需要供應商端失效時，請在供應商儀表板中輪替或撤銷它。

## 在閘道執行時移除供應商驗證

當你透過閘道控制平面移除供應商驗證時，OpenClaw 會刪除該供應商已儲存的驗證設定檔，並中止已選模型供應商符合被移除供應商的作用中聊天/agent 執行。被中止的執行會發出正常的取消/生命週期事件，並帶有 `stopReason: "auth-revoked"`，因此已連線的用戶端可以顯示執行因憑證被移除而停止。

## 控制要使用哪個憑證

### OpenAI 與舊版 `openai-codex` ID

OpenAI API 金鑰設定檔與 ChatGPT/Codex OAuth 設定檔都使用標準供應商 ID `openai`。新設定請使用 `openai:*` 設定檔 ID 與 `auth.order.openai`。

如果你在較舊設定、驗證設定檔 ID 或 `auth.order.openai-codex` 中看到 `openai-codex`，請將它視為舊版遷移輸入，不要建立新的 `openai-codex` 設定檔。執行：

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor 會將舊版 `openai-codex:*` 設定檔 ID 和 `auth.order.openai-codex` 項目改寫為標準 `openai` 路由。OpenAI 專屬的模型/執行階段路由請參閱 [OpenAI](/zh-TW/providers/openai)。

### 登入期間（命令列介面）

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` 會讓同一供應商的多個 OAuth 登入在同一個 agent 內保持分離。

`--force` 會刪除所選 agent 目錄中該供應商已儲存的驗證設定檔，然後重新執行相同的驗證流程。當已儲存的設定檔卡住、過期或綁定到錯誤帳號時使用它。它不會撤銷供應商端的憑證。

```bash
openclaw models auth login --provider anthropic --force
```

### 每個工作階段（聊天命令）

- `/model <alias-or-id>@<profileId>` 會為目前工作階段固定使用特定供應商憑證（設定檔 ID 範例：`anthropic:default`、`anthropic:work`）。
- `/model`（或 `/model list`）會顯示精簡選擇器；`/model status` 會顯示完整檢視（候選項 + 下一個驗證設定檔，以及已設定時的供應商端點詳細資料）。

如果你變更已在執行聊天的驗證順序或設定檔固定，請傳送 `/new` 或 `/reset` 以開始新的工作階段；現有工作階段會保留目前的模型/設定檔選擇，直到重設為止。

### 每個 agent（命令列介面覆寫）

驗證順序覆寫會儲存在該 agent 的 SQLite 驗證狀態中：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定 agent；省略它則使用已設定的預設 agent。`openclaw models status --probe` 會將被省略的已儲存設定檔顯示為 `excluded_by_auth_order`，而不是靜默略過。

## 疑難排解

### 「找不到憑證」

在**閘道主機**上設定 Anthropic API 金鑰，或設定 Anthropic setup-token 路徑，然後再次檢查：

```bash
openclaw models status
```

### 權杖即將過期/已過期

執行 `openclaw models status` 查看哪個設定檔即將過期。如果 Anthropic 權杖設定檔缺少或已過期，請透過 setup-token 重新整理，或遷移到 Anthropic API 金鑰。

## 相關

- [密鑰管理](/zh-TW/gateway/secrets)
- [遠端存取](/zh-TW/gateway/remote)
- [驗證儲存](/zh-TW/concepts/oauth)
