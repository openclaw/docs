---
read_when:
    - 偵錯模型驗證或 OAuth 到期
    - 記錄驗證或憑證儲存
summary: 模型驗證：OAuth、API 金鑰、Claude 命令列介面重用，以及 Anthropic setup-token
title: 驗證
x-i18n:
    generated_at: "2026-06-27T19:15:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
此頁是**模型供應商**驗證參考（API 金鑰、OAuth、Claude 命令列介面重用，以及 Anthropic setup-token）。如需**閘道連線**驗證（token、密碼、trusted-proxy），請參閱[設定](/zh-TW/gateway/configuration)與[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支援模型供應商使用 OAuth 與 API 金鑰。對於常駐的閘道
主機，API 金鑰通常是最可預期的選項。當訂閱/OAuth
流程符合你的供應商帳戶模型時，也支援這些流程。

完整的 OAuth 流程與儲存
版面配置請參閱 [/concepts/oauth](/zh-TW/concepts/oauth)。
如需 SecretRef 型驗證（`env`/`file`/`exec` 供應器），請參閱[密鑰管理](/zh-TW/gateway/secrets)。
如需 `models status --probe` 使用的憑證資格/原因碼規則，請參閱
[驗證憑證語義](/zh-TW/auth-credential-semantics)。

## 建議設定（API 金鑰，任何供應商）

如果你正在執行長時間運作的閘道，請先為所選
供應商設定 API 金鑰。
特別是 Anthropic，API 金鑰驗證仍是最可預期的伺服器
設定，但 OpenClaw 也支援重用本機 Claude 命令列介面登入。

1. 在供應商主控台建立 API 金鑰。
2. 將它放在**閘道主機**上（執行 `openclaw gateway` 的機器）。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果閘道在 systemd/launchd 下執行，建議將金鑰放在
   `~/.openclaw/.env`，讓 daemon 可以讀取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

然後重新啟動 daemon（或重新啟動你的閘道程序）並重新檢查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自行管理 env vars，onboarding 可以儲存
API 金鑰供 daemon 使用：`openclaw onboard`。

如需 env 繼承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）的詳細資訊，請參閱[說明](/zh-TW/help)。

## Anthropic：Claude 命令列介面與 token 相容性

Anthropic setup-token 驗證仍在 OpenClaw 中作為受支援的 token
路徑提供。Anthropic 工作人員後來告訴我們，OpenClaw 風格的 Claude 命令列介面用法
已再次被允許，因此 OpenClaw 會將 Claude 命令列介面重用與 `claude -p` 用法視為
此整合的核准用法，除非 Anthropic 發布新政策。當
Claude 命令列介面重用可在主機上使用時，這現在是偏好的路徑。

對於長時間運作的閘道主機，Anthropic API 金鑰仍是最可預期的
設定。如果你想在同一台主機上重用現有 Claude 登入，請在
onboarding/configure 中使用 Anthropic Claude 命令列介面路徑。

建議的 Claude 命令列介面重用主機設定：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

這是兩步驟設定：

1. 在閘道主機上讓 Claude Code 本身登入 Anthropic。
2. 告訴 OpenClaw 將 Anthropic 模型選擇切換到本機 `claude-cli`
   後端，並儲存對應的 OpenClaw 驗證設定檔。

如果 `claude` 不在 `PATH` 上，請先安裝 Claude Code，或將
`agents.defaults.cliBackends.claude-cli.command` 設為實際的二進位檔路徑。

手動 token 輸入（任何供應商；寫入每個代理的 SQLite 驗證儲存區並更新設定）：

```bash
openclaw models auth paste-token --provider openrouter
```

驗證設定檔儲存區只保留憑證。舊版 `auth-profiles.json` 檔案使用此標準形狀：

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw 現在會從每個代理的 `openclaw-agent.sqlite` 讀取驗證設定檔。如果舊安裝仍有 `auth-profiles.json`、`auth-state.json`，或像 `{ "openrouter": { "apiKey": "..." } }` 這樣的扁平驗證設定檔，請執行 `openclaw doctor --fix` 將其匯入 SQLite；doctor 會在原始 JSON 檔案旁保留加上時間戳記的備份。`baseUrl`、`api`、模型 id、headers 與 timeouts 等端點詳細資訊應放在 `openclaw.json` 或 `models.json` 的 `models.providers.<id>` 下，而不是放在驗證設定檔中。

Bedrock `auth: "aws-sdk"` 等外部驗證路由也不是憑證。如果你想要具名 Bedrock 路由，請在 `openclaw.json` 中放入 `auth.profiles.<id>.mode: "aws-sdk"`；不要將 `type: "aws-sdk"` 寫入驗證設定檔儲存區。`openclaw doctor --fix` 會將舊版 AWS SDK 標記從憑證儲存區移到設定中繼資料。

靜態憑證也支援驗證設定檔 refs：

- `api_key` 憑證可以使用 `keyRef: { source, provider, id }`
- `token` 憑證可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式設定檔不支援 SecretRef 憑證；如果 `auth.profiles.<id>.mode` 設為 `"oauth"`，則該設定檔的 SecretRef 支援 `keyRef`/`tokenRef` 輸入會遭拒絕。

適合自動化的檢查（過期/缺少時 exit `1`，即將過期時 `2`）：

```bash
openclaw models status --check
```

即時驗證探測：

```bash
openclaw models status --probe
```

注意：

- 探測列可以來自驗證設定檔、env 憑證或 `models.json`。
- 如果明確的 `auth.order.<provider>` 省略已儲存的設定檔，探測會對該設定檔回報
  `excluded_by_auth_order`，而不是嘗試它。
- 如果驗證存在，但 OpenClaw 無法為
  該供應商解析可探測的模型候選項，探測會回報 `status: no_model`。
- 速率限制冷卻可以限定於模型範圍。某個設定檔針對一個
  模型冷卻中時，仍可能可用於同一供應商上的同層模型。

選用的維運指令碼（systemd/Termux）記錄於此：
[驗證監控指令碼](/zh-TW/help/scripts#auth-monitoring-scripts)

## Anthropic 注意事項

Anthropic `claude-cli` 後端已再次受支援。

- Anthropic 工作人員告訴我們，此 OpenClaw 整合路徑已再次被允許。
- 因此，除非 Anthropic 發布新政策，OpenClaw 會將 Claude 命令列介面重用與 `claude -p` 用法視為
  Anthropic 支援執行的核准用法。
- 對於長時間運作的閘道
  主機與明確的伺服器端計費控制，Anthropic API 金鑰仍是最可預期的選擇。

## 檢查模型驗證狀態

```bash
openclaw models status
openclaw doctor
```

## API 金鑰輪替行為（閘道）

有些供應商支援在 API 呼叫
遇到供應商速率限制時，使用替代金鑰重試請求。

- 優先順序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一覆寫）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 供應商也包含 `GOOGLE_API_KEY` 作為額外 fallback。
- 相同金鑰清單在使用前會先去重。
- OpenClaw 只會在速率限制錯誤時使用下一個金鑰重試（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached` 或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制錯誤不會使用替代金鑰重試。
- 如果所有金鑰都失敗，會傳回最後一次嘗試的最終錯誤。

## 在閘道執行時移除供應商驗證

透過閘道控制平面移除供應商驗證時，OpenClaw 會刪除
該供應商已儲存的驗證設定檔，並中止所選模型供應商符合已移除供應商的作用中聊天或代理執行。
中止的執行會發出一般聊天取消與生命週期事件，並帶有
`stopReason: "auth-revoked"`，讓已連線的用戶端可以顯示該執行
因憑證被移除而停止。

移除已儲存驗證不會在供應商端撤銷金鑰。當你需要供應商端失效時，請在供應商 dashboard 中輪替或撤銷
金鑰。

## 控制要使用哪個憑證

### OpenAI 與舊版 `openai-codex` id

OpenAI API 金鑰設定檔與 ChatGPT/Codex OAuth 設定檔都使用標準
供應商 id `openai`。新設定應使用 `openai:*` 設定檔 id 與
`auth.order.openai`。

如果你在舊設定、驗證設定檔 id 或
`auth.order.openai-codex` 中看到 `openai-codex`，請將其視為舊版遷移輸入。不要建立新的
`openai-codex` 設定檔。執行：

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor 會將舊版 `openai-codex:*` 設定檔 id 與
`auth.order.openai-codex` 項目重寫為標準 `openai` 驗證路由。如需
OpenAI 專用模型/執行階段路由，請參閱 [OpenAI](/zh-TW/providers/openai)。

### 登入期間（命令列介面）

對於支援在登入期間使用具名驗證設定檔的
供應商，請使用 `openclaw models auth login --provider <id> --profile-id <profileId>`。

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

這是在同一個代理內，將同一供應商的多個 OAuth 登入
分開保存的最簡單方式。

當已儲存的供應商設定檔卡住、過期或綁定到
錯誤帳戶，而一般登入命令持續重用它時，請使用 `--force`。`--force` 會刪除
所選代理目錄中該供應商已儲存的驗證設定檔，然後
再次執行相同的供應商驗證流程。它不會在
供應商端撤銷憑證；當你需要
供應商端失效時，請在供應商 dashboard 中輪替或撤銷它們。

```bash
openclaw models auth login --provider anthropic --force
```

### 每個 session（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 為目前 session 固定特定供應商憑證（範例設定檔 id：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）取得精簡選擇器；使用 `/model status` 查看完整檢視（候選項 + 下一個驗證設定檔，以及已設定時的供應商端點詳細資訊）。

### 每個代理（命令列介面覆寫）

為代理設定明確的驗證設定檔順序覆寫（儲存在該代理的 SQLite 驗證狀態中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定代理；省略它則使用已設定的預設代理。
當你偵錯順序問題時，`openclaw models status --probe` 會將省略的
已儲存設定檔顯示為 `excluded_by_auth_order`，而不是默默略過它們。
當你偵錯冷卻問題時，請記住速率限制冷卻可能綁定
到單一模型 id，而不是整個供應商設定檔。

如果你為已在執行中的聊天變更驗證順序或設定檔釘選，
請在該聊天中傳送 `/new` 或 `/reset` 以啟動全新 session。既有
session 可以保留目前的模型/設定檔選擇，直到重設為止。

## 疑難排解

### 「找不到憑證」

如果 Anthropic 設定檔缺失，請在
**閘道主機**上設定 Anthropic API 金鑰，或設定 Anthropic setup-token 路徑，然後重新檢查：

```bash
openclaw models status
```

### Token 即將過期/已過期

執行 `openclaw models status` 以確認哪個設定檔即將過期。如果
Anthropic token 設定檔缺失或已過期，請透過
setup-token 重新整理該設定，或遷移到 Anthropic API 金鑰。

## 相關

- [密鑰管理](/zh-TW/gateway/secrets)
- [遠端存取](/zh-TW/gateway/remote)
- [驗證儲存](/zh-TW/concepts/oauth)
