---
read_when:
    - 偵錯模型身分驗證或 OAuth 過期
    - 記錄身分驗證或憑證儲存
summary: 模型身份驗證：OAuth、API 金鑰、Claude CLI 重複使用，以及 Anthropic setup-token
title: 身分驗證
x-i18n:
    generated_at: "2026-04-30T03:03:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
本頁是**模型提供者**驗證參考（API 金鑰、OAuth、Claude CLI 重用，以及 Anthropic setup-token）。如需 **Gateway 連線**驗證（權杖、密碼、trusted-proxy），請參閱[設定](/zh-TW/gateway/configuration)和 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支援模型提供者使用 OAuth 和 API 金鑰。對於長期運行的 Gateway
主機，API 金鑰通常是最可預測的選項。當訂閱/OAuth
流程符合你的提供者帳戶模式時，也支援這些流程。

請參閱 [/concepts/oauth](/zh-TW/concepts/oauth) 以了解完整 OAuth 流程與儲存
配置。
如需 SecretRef 型驗證（`env`/`file`/`exec` 提供者），請參閱[密鑰管理](/zh-TW/gateway/secrets)。
如需 `models status --probe` 使用的憑證資格/原因碼規則，請參閱
[Auth Credential Semantics](/zh-TW/auth-credential-semantics)。

## 建議設定（API 金鑰，任何提供者）

如果你正在執行長期運行的 Gateway，請先為所選的
提供者使用 API 金鑰。
特別是 Anthropic，API 金鑰驗證仍然是最可預測的伺服器
設定，但 OpenClaw 也支援重用本機 Claude CLI 登入。

1. 在你的提供者主控台建立 API 金鑰。
2. 將它放在 **Gateway 主機**（執行 `openclaw gateway` 的機器）上。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. 如果 Gateway 在 systemd/launchd 下執行，建議將金鑰放在
   `~/.openclaw/.env`，讓 daemon 可以讀取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

然後重新啟動 daemon（或重新啟動你的 Gateway 程序）並再次檢查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自行管理環境變數，onboarding 可以儲存
daemon 使用的 API 金鑰：`openclaw onboard`。

請參閱[說明](/zh-TW/help)，了解環境繼承的詳細資訊（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）。

## Anthropic：Claude CLI 與權杖相容性

Anthropic setup-token 驗證仍可在 OpenClaw 中作為受支援的權杖
路徑使用。Anthropic 工作人員後來告知我們，OpenClaw 風格的 Claude CLI 使用
再次被允許，因此除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用和 `claude -p` 使用
視為此整合的核准方式。當主機上可使用
Claude CLI 重用時，這現在是偏好的路徑。

對於長期運行的 Gateway 主機，Anthropic API 金鑰仍是最可預測的
設定。如果你想在同一台主機上重用現有的 Claude 登入，請在 onboarding/configure 中使用
Anthropic Claude CLI 路徑。

建議的 Claude CLI 重用主機設定：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

這是兩步驟設定：

1. 在 Gateway 主機上將 Claude Code 本身登入 Anthropic。
2. 告訴 OpenClaw 將 Anthropic 模型選擇切換到本機 `claude-cli`
   後端，並儲存相符的 OpenClaw 驗證設定檔。

如果 `claude` 不在 `PATH` 中，請先安裝 Claude Code，或將
`agents.defaults.cliBackends.claude-cli.command` 設為實際的二進位檔路徑。

手動權杖輸入（任何提供者；寫入 `auth-profiles.json` 並更新設定）：

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` 只儲存憑證。標準形狀是：

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

OpenClaw 在執行階段預期使用標準的 `version` + `profiles` 形狀。如果較舊的安裝仍有扁平檔案，例如 `{ "openrouter": { "apiKey": "..." } }`，請執行 `openclaw doctor --fix`，將它重寫為 `openrouter:default` API-key 設定檔；doctor 會在原始檔旁保留一份 `.legacy-flat.*.bak` 副本。端點詳細資訊，例如 `baseUrl`、`api`、模型 ID、標頭和逾時，應放在 `openclaw.json` 或 `models.json` 的 `models.providers.<id>` 之下，而不是放在 `auth-profiles.json` 中。

靜態憑證也支援驗證設定檔參照：

- `api_key` 憑證可以使用 `keyRef: { source, provider, id }`
- `token` 憑證可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式設定檔不支援 SecretRef 憑證；如果 `auth.profiles.<id>.mode` 設為 `"oauth"`，該設定檔的 SecretRef 支援 `keyRef`/`tokenRef` 輸入會被拒絕。

適合自動化的檢查（過期/缺少時退出 `1`，即將過期時退出 `2`）：

```bash
openclaw models status --check
```

即時驗證探測：

```bash
openclaw models status --probe
```

注意事項：

- 探測列可以來自驗證設定檔、環境憑證或 `models.json`。
- 如果明確的 `auth.order.<provider>` 省略已儲存的設定檔，探測會回報
  該設定檔為 `excluded_by_auth_order`，而不是嘗試使用它。
- 如果驗證存在，但 OpenClaw 無法為
  該提供者解析可探測的模型候選項目，探測會回報 `status: no_model`。
- 速率限制冷卻可以限定在模型範圍內。某個設定檔因一個
  模型而冷卻時，仍可能可用於同一提供者上的同層模型。

選用的維運指令碼（systemd/Termux）記錄於此：
[驗證監控指令碼](/zh-TW/help/scripts#auth-monitoring-scripts)

## Anthropic 注意事項

Anthropic `claude-cli` 後端已再次受到支援。

- Anthropic 工作人員告知我們，此 OpenClaw 整合路徑已再次被允許。
- 因此，除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用和 `claude -p` 使用視為
  Anthropic 支援執行的核准方式。
- Anthropic API 金鑰仍是長期運行 Gateway
  主機和明確伺服器端計費控制最可預測的選擇。

## 檢查模型驗證狀態

```bash
openclaw models status
openclaw doctor
```

## API 金鑰輪替行為（Gateway）

部分提供者支援在 API 呼叫
遇到提供者速率限制時，使用替代金鑰重試請求。

- 優先順序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一覆寫）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 提供者也會包含 `GOOGLE_API_KEY` 作為額外備援。
- 同一份金鑰清單會在使用前去重。
- OpenClaw 只會針對速率限制錯誤使用下一個金鑰重試（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`，或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制錯誤不會使用替代金鑰重試。
- 如果所有金鑰都失敗，會回傳最後一次嘗試的最終錯誤。

## 控制使用哪個憑證

### 每個工作階段（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 釘選目前工作階段的特定提供者憑證（範例設定檔 ID：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）開啟精簡選擇器；使用 `/model status` 查看完整檢視（候選項目 + 下一個驗證設定檔，以及已設定時的提供者端點詳細資訊）。

### 每個代理程式（CLI 覆寫）

為代理程式設定明確的驗證設定檔順序覆寫（儲存在該代理程式的 `auth-state.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定代理程式；省略它則使用已設定的預設代理程式。
除錯順序問題時，`openclaw models status --probe` 會將省略的
已儲存設定檔顯示為 `excluded_by_auth_order`，而不是悄悄略過它們。
除錯冷卻問題時，請記得速率限制冷卻可以綁定到
單一模型 ID，而不是整個提供者設定檔。

## 疑難排解

### 「找不到憑證」

如果缺少 Anthropic 設定檔，請在
**Gateway 主機**上設定 Anthropic API 金鑰，或設定 Anthropic setup-token 路徑，然後再次檢查：

```bash
openclaw models status
```

### 權杖即將過期/已過期

執行 `openclaw models status` 確認哪個設定檔即將過期。如果
Anthropic 權杖設定檔缺少或已過期，請透過
setup-token 重新整理該設定，或遷移到 Anthropic API 金鑰。

## 相關

- [密鑰管理](/zh-TW/gateway/secrets)
- [遠端存取](/zh-TW/gateway/remote)
- [驗證儲存](/zh-TW/concepts/oauth)
