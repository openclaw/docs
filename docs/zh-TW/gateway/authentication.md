---
read_when:
    - 偵錯模型驗證或 OAuth 到期問題
    - 記錄驗證或憑證儲存方式
summary: 模型身分驗證：OAuth、API 金鑰、Claude CLI 重用，以及 Anthropic setup-token
title: 身分驗證
x-i18n:
    generated_at: "2026-05-07T13:16:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
本頁是**模型提供者**驗證參考（API 金鑰、OAuth、Claude CLI 重用，以及 Anthropic setup-token）。如需 **Gateway 連線**驗證（權杖、密碼、受信任代理），請參閱[設定](/zh-TW/gateway/configuration)與[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支援模型提供者使用 OAuth 與 API 金鑰。對於常駐 Gateway
主機，API 金鑰通常是最可預期的選項。當訂閱/OAuth
流程符合你的提供者帳號模型時，也支援這些流程。

請參閱 [/concepts/oauth](/zh-TW/concepts/oauth) 了解完整 OAuth 流程與儲存
配置。
如需 SecretRef 型驗證（`env`/`file`/`exec` 提供者），請參閱[密鑰管理](/zh-TW/gateway/secrets)。
如需 `models status --probe` 使用的憑證資格/原因碼規則，請參閱
[驗證憑證語意](/zh-TW/auth-credential-semantics)。

## 建議設定（API 金鑰，任何提供者）

如果你正在執行長時間存活的 Gateway，請先為你選擇的提供者設定 API 金鑰。
特別是 Anthropic，API 金鑰驗證仍是最可預期的伺服器
設定，但 OpenClaw 也支援重用本機 Claude CLI 登入。

1. 在你的提供者主控台建立 API 金鑰。
2. 將它放在 **Gateway 主機**（執行 `openclaw gateway` 的機器）上。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 在 systemd/launchd 下執行，建議將金鑰放在
   `~/.openclaw/.env`，讓守護程式可以讀取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

接著重新啟動守護程式（或重新啟動你的 Gateway 程序）並重新檢查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自行管理環境變數，onboarding 可以儲存
API 金鑰供守護程式使用：`openclaw onboard`。

如需環境繼承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）的詳細資料，請參閱[說明](/zh-TW/help)。

## Anthropic：Claude CLI 與權杖相容性

Anthropic setup-token 驗證仍在 OpenClaw 中作為受支援的權杖
路徑提供。Anthropic 員工後來告知我們，OpenClaw 風格的 Claude CLI 使用方式
已再次允許，因此除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用與 `claude -p` 使用
視為此整合的核准方式。當主機上可使用 Claude CLI 重用時，這現在是偏好的路徑。

對於長時間存活的 Gateway 主機，Anthropic API 金鑰仍是最可預期的
設定。如果你想在同一台主機上重用既有 Claude 登入，請在 onboarding/configure 中使用
Anthropic Claude CLI 路徑。

Claude CLI 重用的建議主機設定：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

這是兩步驟設定：

1. 讓 Claude Code 本身在 Gateway 主機上登入 Anthropic。
2. 告訴 OpenClaw 將 Anthropic 模型選擇切換到本機 `claude-cli`
   後端，並儲存相符的 OpenClaw 驗證設定檔。

如果 `claude` 不在 `PATH` 上，請先安裝 Claude Code，或將
`agents.defaults.cliBackends.claude-cli.command` 設為實際的二進位檔路徑。

手動輸入權杖（任何提供者；寫入 `auth-profiles.json` + 更新設定）：

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` 只儲存憑證。標準形狀為：

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

OpenClaw 在執行階段預期使用標準的 `version` + `profiles` 形狀。如果較舊的安裝仍有像 `{ "openrouter": { "apiKey": "..." } }` 這樣的扁平檔案，請執行 `openclaw doctor --fix`，將它重寫為 `openrouter:default` API 金鑰設定檔；doctor 會在原始檔旁保留 `.legacy-flat.*.bak` 副本。`baseUrl`、`api`、模型 ID、標頭與逾時等端點詳細資料，應放在 `openclaw.json` 或 `models.json` 的 `models.providers.<id>` 下，而不是放在 `auth-profiles.json` 中。

像 Bedrock `auth: "aws-sdk"` 這類外部驗證路由也不是憑證。如果你想要具名的 Bedrock 路由，請在 `openclaw.json` 中放入 `auth.profiles.<id>.mode: "aws-sdk"`；不要將 `type: "aws-sdk"` 寫入 `auth-profiles.json`。`openclaw doctor --fix` 會將舊版 AWS SDK 標記從憑證儲存移到設定中繼資料。

靜態憑證也支援驗證設定檔參照：

- `api_key` 憑證可以使用 `keyRef: { source, provider, id }`
- `token` 憑證可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式設定檔不支援 SecretRef 憑證；如果 `auth.profiles.<id>.mode` 設為 `"oauth"`，該設定檔的 SecretRef 支援 `keyRef`/`tokenRef` 輸入會被拒絕。

適合自動化的檢查（過期/遺失時結束碼 `1`，即將過期時為 `2`）：

```bash
openclaw models status --check
```

即時驗證探測：

```bash
openclaw models status --probe
```

注意：

- 探測列可以來自驗證設定檔、環境憑證或 `models.json`。
- 如果明確的 `auth.order.<provider>` 省略已儲存的設定檔，探測會針對該設定檔回報
  `excluded_by_auth_order`，而不是嘗試使用它。
- 如果驗證存在，但 OpenClaw 無法為該提供者解析可探測的模型候選項，
  探測會回報 `status: no_model`。
- 速率限制冷卻可以限定於模型。某個設定檔因一個
  模型而冷卻時，仍可用於同一提供者上的同層模型。

可選的維運腳本（systemd/Termux）記錄在此：
[驗證監控腳本](/zh-TW/help/scripts#auth-monitoring-scripts)

## Anthropic 注意事項

Anthropic `claude-cli` 後端已再次受支援。

- Anthropic 員工告訴我們，此 OpenClaw 整合路徑已再次允許。
- 因此，除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用與 `claude -p` 使用
  視為 Anthropic 支援執行的核准方式。
- Anthropic API 金鑰仍是長時間存活 Gateway
  主機與明確伺服器端計費控制的最可預期選擇。

## 檢查模型驗證狀態

```bash
openclaw models status
openclaw doctor
```

## API 金鑰輪替行為（Gateway）

某些提供者在 API 呼叫遭遇提供者速率限制時，支援使用替代金鑰重試請求。

- 優先順序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一覆寫）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供者也包含 `GOOGLE_API_KEY` 作為額外備援。
- 相同金鑰清單會在使用前去重。
- OpenClaw 只會在速率限制錯誤時用下一個金鑰重試（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached` 或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制錯誤不會使用替代金鑰重試。
- 如果所有金鑰都失敗，會傳回最後一次嘗試的最終錯誤。

## 控制使用哪個憑證

### 每個工作階段（聊天指令）

使用 `/model <alias-or-id>@<profileId>` 為目前工作階段固定特定提供者憑證（設定檔 ID 範例：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）取得精簡選擇器；使用 `/model status` 取得完整檢視（候選項 + 下一個驗證設定檔，以及已設定時的提供者端點詳細資料）。

### 每個代理（CLI 覆寫）

為代理設定明確的驗證設定檔順序覆寫（儲存在該代理的 `auth-state.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定代理；省略則使用已設定的預設代理。
當你偵錯順序問題時，`openclaw models status --probe` 會將被省略的
已儲存設定檔顯示為 `excluded_by_auth_order`，而不是默默跳過。
當你偵錯冷卻問題時，請記得速率限制冷卻可能綁定到
某一個模型 ID，而不是整個提供者設定檔。

## 疑難排解

###「找不到憑證」

如果 Anthropic 設定檔遺失，請在
**Gateway 主機**上設定 Anthropic API 金鑰，或設定 Anthropic setup-token 路徑，然後重新檢查：

```bash
openclaw models status
```

### 權杖即將過期/已過期

執行 `openclaw models status` 以確認哪個設定檔即將過期。如果
Anthropic 權杖設定檔遺失或已過期，請透過
setup-token 重新整理該設定，或遷移到 Anthropic API 金鑰。

## 相關

- [密鑰管理](/zh-TW/gateway/secrets)
- [遠端存取](/zh-TW/gateway/remote)
- [驗證儲存](/zh-TW/concepts/oauth)
