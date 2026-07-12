---
read_when:
    - 偵錯模型驗證或 OAuth 到期問題
    - 記錄驗證或憑證儲存方式
summary: 模型驗證：OAuth、API 金鑰、重複使用 Claude 命令列介面，以及 Anthropic 設定權杖
title: 驗證
x-i18n:
    generated_at: "2026-07-11T21:20:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
本頁說明**模型供應商**驗證（API 金鑰、OAuth、重用 Claude 命令列介面、Anthropic 設定權杖）。如需了解**閘道連線**驗證（權杖、密碼、受信任的 Proxy），請參閱[設定](/zh-TW/gateway/configuration)和[受信任的 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支援模型供應商使用 OAuth 和 API 金鑰。對於持續運作的閘道主機，API 金鑰是最可預期的選項；訂閱／OAuth 流程只要符合您的供應商帳戶模式，也同樣可用。

- 完整 OAuth 流程與儲存配置：[/concepts/oauth](/zh-TW/concepts/oauth)
- 以 SecretRef 為基礎的驗證（`env`/`file`/`exec` 供應商）：[密鑰管理](/zh-TW/gateway/secrets)
- `models status --probe` 使用的憑證適用性／原因代碼：[驗證憑證語意](/zh-TW/auth-credential-semantics)

## 建議設定：API 金鑰（任何供應商）

1. 在供應商控制台中建立 API 金鑰。
2. 將它放在**閘道主機**（執行 `openclaw gateway` 的機器）上：

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果閘道在 systemd/launchd 下執行，請將金鑰放入 `~/.openclaw/.env`，以便常駐程式讀取：

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

如果您不想自行管理環境變數，`openclaw onboard` 也可以儲存 API 金鑰供常駐程式使用。如需完整的環境變數載入優先順序（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd），請參閱[環境變數](/zh-TW/help/environment)。

## Anthropic：重用 Claude 命令列介面

Anthropic 設定權杖驗證仍是受支援的方式。此整合也允許重用 Claude 命令列介面（`claude -p` 類型的用法）；如果主機上已有可用的 Claude 命令列介面登入，這是本機／桌面使用情境的首選方式。對於長期運作的閘道主機，Anthropic API 金鑰仍是最可預期的選擇，並可明確控制伺服器端計費。

重用 Claude 命令列介面的主機設定：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

這包含兩個步驟：先在主機上讓 Claude Code 登入 Anthropic，再告知 OpenClaw 透過本機 `claude-cli` 後端路由 Anthropic 模型選擇，並儲存相符的 OpenClaw 驗證設定檔。

如果 `claude` 不在 `PATH` 中，請安裝 Claude Code，或將 `agents.defaults.cliBackends.claude-cli.command` 設為二進位檔路徑。

## 手動輸入權杖

適用於任何供應商；會寫入各代理程式的 SQLite 驗證儲存區並更新設定：

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw 會從各代理程式的 `openclaw-agent.sqlite` 讀取驗證設定檔。端點詳細資料（`baseUrl`、`api`、模型 ID、標頭、逾時）應置於 `openclaw.json` 或 `models.json` 的 `models.providers.<id>` 下，而非驗證設定檔中。

如果較舊的安裝仍有 `auth-profiles.json`、`auth-state.json`，或 `{ "openrouter": { "apiKey": "..." } }` 之類的扁平結構，請執行 `openclaw doctor --fix` 將其匯入 SQLite；doctor 會在原始 JSON 檔案旁保留加上時間戳記的備份。

Bedrock `auth: "aws-sdk"` 等外部驗證路由並非憑證。若要設定具名 Bedrock 路由，請在 `openclaw.json` 中設定 `auth.profiles.<id>.mode: "aws-sdk"`，不要將 `type: "aws-sdk"` 寫入驗證設定檔儲存區。`openclaw doctor --fix` 會將舊版 AWS SDK 標記從憑證儲存區遷移至設定中繼資料。

### 以 SecretRef 為基礎的憑證

- `api_key` 憑證可以使用 `keyRef: { source, provider, id }`
- `token` 憑證可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式設定檔會拒絕 SecretRef 憑證：如果 `auth.profiles.<id>.mode` 為 `"oauth"`，則會拒絕該設定檔以 SecretRef 為基礎的 `keyRef`/`tokenRef`。

## 檢查模型驗證狀態

```bash
openclaw models status
openclaw doctor
```

適合自動化的檢查：過期／缺少時以 `1` 結束，即將過期時以 `2` 結束：

```bash
openclaw models status --check
```

即時驗證探測（加入 `--probe-provider`、`--probe-profile`、`--probe-timeout`、`--probe-concurrency` 或 `--probe-max-tokens` 以縮小範圍）：

```bash
openclaw models status --probe
```

注意事項：

- 探測資料列可來自驗證設定檔、環境憑證或 `models.json`。
- 如果 `auth.order.<provider>` 省略已儲存的設定檔，探測會針對該設定檔回報 `excluded_by_auth_order`，而不會嘗試使用它。
- 如果已有驗證資料，但 OpenClaw 無法為該供應商解析出可探測的模型，探測會回報 `status: no_model`。
- 速率限制冷卻可限定於模型：某個設定檔針對一個模型處於冷卻狀態時，仍可服務相同供應商下的同層級模型。

選用的維運指令稿（systemd/Termux）：[驗證監控指令稿](/zh-TW/help/scripts#auth-monitoring-scripts)。

## API 金鑰輪替（閘道）

某些供應商在呼叫觸及供應商速率限制時，會使用另一個已設定的金鑰重試要求。

各供應商的金鑰優先順序：

1. `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一覆寫，鎖定一個金鑰）
2. `<PROVIDER>_API_KEYS`（以逗號／空格／分號分隔的清單）
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*`（任何具有此前綴的環境變數）

Google 供應商（`google`、`google-vertex`）還會額外回退至 `GOOGLE_API_KEY`。合併後的清單會在使用前去除重複項目。

只有當錯誤訊息符合下列內容時，OpenClaw 才會輪替至下一個金鑰：`rate_limit`、`rate limit`、`429`、`quota exceeded`/`quota_exceeded`、`resource exhausted`/`resource_exhausted` 或 `too many requests`。其他錯誤不會使用替代金鑰重試。如果所有金鑰皆失敗，則傳回最後一次嘗試的最終錯誤。

<Note>
`ThrottlingException`、`concurrency limit reached` 或 `workers_ai ... quota limit exceeded` 等供應商特定詞句會驅動**容錯移轉／重試分類**（在重複失敗時切換模型或供應商），這是與上述 API 金鑰輪替分開的機制。
</Note>

移除已儲存的驗證資料不會在供應商端撤銷金鑰；需要使其在供應商端失效時，請在供應商儀表板中輪替或撤銷該金鑰。

## 在閘道執行時移除供應商驗證資料

當您透過閘道控制平面移除供應商驗證資料時，OpenClaw 會刪除該供應商已儲存的驗證設定檔，並中止所選模型供應商與已移除供應商相符的進行中聊天／代理程式執行。已中止的執行會發出一般的取消／生命週期事件，並包含 `stopReason: "auth-revoked"`，讓已連線的用戶端可以顯示該執行因憑證遭移除而停止。

## 控制使用哪個憑證

### OpenAI 與舊版 `openai-codex` ID

OpenAI API 金鑰設定檔和 ChatGPT/Codex OAuth 設定檔都使用標準供應商 ID `openai`。新設定請使用 `openai:*` 設定檔 ID 和 `auth.order.openai`。

如果您在較舊的設定、驗證設定檔 ID 或 `auth.order.openai-codex` 中看到 `openai-codex`，請將它視為舊版遷移輸入，不要建立新的 `openai-codex` 設定檔。請執行：

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor 會將舊版 `openai-codex:*` 設定檔 ID 和 `auth.order.openai-codex` 項目改寫至標準 `openai` 路由。如需 OpenAI 特定的模型／執行階段路由資訊，請參閱 [OpenAI](/zh-TW/providers/openai)。

### 登入期間（命令列介面）

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` 會在同一個代理程式內，將相同供應商的多個 OAuth 登入分開保存。

`--force` 會刪除所選代理程式目錄中該供應商已儲存的驗證設定檔，然後重新執行相同的驗證流程。當已儲存的設定檔卡住、過期或綁定至錯誤帳戶時，請使用此選項。它不會在供應商端撤銷憑證。

```bash
openclaw models auth login --provider anthropic --force
```

### 各工作階段（聊天命令）

- `/model <alias-or-id>@<profileId>` 會將目前工作階段鎖定至特定供應商憑證（設定檔 ID 範例：`anthropic:default`、`anthropic:work`）。
- `/model`（或 `/model list`）會顯示精簡選擇器；`/model status` 會顯示完整檢視（候選項目與下一個驗證設定檔，以及設定後的供應商端點詳細資料）。

如果您變更已在執行之聊天的驗證順序或設定檔鎖定，請傳送 `/new` 或 `/reset` 以開始新的工作階段；現有工作階段在重設前會保留目前的模型／設定檔選擇。

### 各代理程式（命令列介面覆寫）

驗證順序覆寫會儲存在該代理程式的 SQLite 驗證狀態中：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定代理程式；省略時使用已設定的預設代理程式。`openclaw models status --probe` 會將省略的已儲存設定檔顯示為 `excluded_by_auth_order`，而不是默默略過。

## 疑難排解

### 「找不到憑證」

在**閘道主機**上設定 Anthropic API 金鑰，或設定 Anthropic 設定權杖路徑，然後再次檢查：

```bash
openclaw models status
```

### 權杖即將過期／已過期

執行 `openclaw models status` 以查看即將過期的設定檔。如果 Anthropic 權杖設定檔缺少或已過期，請透過設定權杖重新整理，或遷移至 Anthropic API 金鑰。

## 相關內容

- [密鑰管理](/zh-TW/gateway/secrets)
- [遠端存取](/zh-TW/gateway/remote)
- [驗證儲存](/zh-TW/concepts/oauth)
