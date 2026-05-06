---
read_when:
    - 偵錯模型身分驗證或 OAuth 到期問題
    - 記錄身分驗證或憑證儲存方式
summary: 模型身分驗證：OAuth、API 金鑰、Claude CLI 重用，以及 Anthropic setup-token
title: 身分驗證
x-i18n:
    generated_at: "2026-05-06T09:08:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
此頁是**模型供應商**認證參考（API 金鑰、OAuth、Claude CLI 重用，以及 Anthropic setup-token）。如需 **Gateway 連線**認證（token、密碼、trusted-proxy），請參閱[設定](/zh-TW/gateway/configuration)與[受信任 Proxy 認證](/zh-TW/gateway/trusted-proxy-auth)。
</Note>

OpenClaw 支援模型供應商使用 OAuth 和 API 金鑰。對於常駐的 Gateway
主機，API 金鑰通常是最可預期的選項。當訂閱/OAuth
流程符合你的供應商帳戶模型時，也支援這些流程。

完整的 OAuth 流程和儲存版面配置，請參閱 [/concepts/oauth](/zh-TW/concepts/oauth)。
如需基於 SecretRef 的認證（`env`/`file`/`exec` 供應商），請參閱[密鑰管理](/zh-TW/gateway/secrets)。
如需 `models status --probe` 使用的憑證資格/原因代碼規則，請參閱
[認證憑證語意](/zh-TW/auth-credential-semantics)。

## 建議設定（API 金鑰，任何供應商）

如果你正在執行長時間運作的 Gateway，請從所選供應商的 API 金鑰開始。
特別是 Anthropic，API 金鑰認證仍然是最可預期的伺服器設定，
但 OpenClaw 也支援重用本機 Claude CLI 登入。

1. 在你的供應商主控台建立 API 金鑰。
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

接著重新啟動 daemon（或重新啟動你的 Gateway 行程）並再次檢查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自行管理環境變數，onboarding 可以儲存
API 金鑰供 daemon 使用：`openclaw onboard`。

如需 env 繼承（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）的詳細資訊，請參閱[說明](/zh-TW/help)。

## Anthropic：Claude CLI 與 token 相容性

Anthropic setup-token 認證仍作為受支援的 token
路徑在 OpenClaw 中可用。Anthropic 人員後來告訴我們，OpenClaw 風格的 Claude CLI 使用方式
再次被允許，因此除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用和 `claude -p` 使用
視為此整合已核准的方式。當主機上可用 Claude CLI 重用時，現在這是偏好的路徑。

對於長時間運作的 Gateway 主機，Anthropic API 金鑰仍然是最可預期的
設定。如果你想在同一台主機上重用現有 Claude 登入，請在 onboarding/configure 中使用
Anthropic Claude CLI 路徑。

Claude CLI 重用的建議主機設定：

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

這是兩步驟設定：

1. 將 Claude Code 本身登入到 Gateway 主機上的 Anthropic。
2. 告訴 OpenClaw 將 Anthropic 模型選擇切換到本機 `claude-cli`
   後端，並儲存相符的 OpenClaw 認證設定檔。

如果 `claude` 不在 `PATH` 上，請先安裝 Claude Code，或將
`agents.defaults.cliBackends.claude-cli.command` 設為實際的二進位檔路徑。

手動輸入 token（任何供應商；寫入 `auth-profiles.json` + 更新設定）：

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

OpenClaw 在執行階段預期使用標準的 `version` + `profiles` 形狀。如果較舊的安裝仍有像 `{ "openrouter": { "apiKey": "..." } }` 這樣的扁平檔案，請執行 `openclaw doctor --fix`，將其改寫為 `openrouter:default` API 金鑰設定檔；doctor 會在原始檔旁保留一份 `.legacy-flat.*.bak` 副本。`baseUrl`、`api`、模型 id、標頭與逾時等端點詳細資訊，應放在 `openclaw.json` 或 `models.json` 的 `models.providers.<id>` 下，而不是放在 `auth-profiles.json` 中。

靜態憑證也支援認證設定檔 ref：

- `api_key` 憑證可以使用 `keyRef: { source, provider, id }`
- `token` 憑證可以使用 `tokenRef: { source, provider, id }`
- OAuth 模式設定檔不支援 SecretRef 憑證；如果 `auth.profiles.<id>.mode` 設為 `"oauth"`，該設定檔基於 SecretRef 的 `keyRef`/`tokenRef` 輸入會被拒絕。

適合自動化的檢查（過期/缺少時 exit `1`，即將過期時 exit `2`）：

```bash
openclaw models status --check
```

即時認證探測：

```bash
openclaw models status --probe
```

注意：

- 探測列可來自認證設定檔、env 憑證或 `models.json`。
- 如果明確的 `auth.order.<provider>` 省略已儲存的設定檔，探測會回報該設定檔為
  `excluded_by_auth_order`，而不是嘗試使用它。
- 如果存在認證，但 OpenClaw 無法為該供應商解析可探測的模型候選，
  探測會回報 `status: no_model`。
- 速率限制冷卻可以限定於模型範圍。某個設定檔對一個
  模型處於冷卻中，仍可能可用於同一供應商上的同層模型。

選用的維運 scripts（systemd/Termux）記錄於此：
[認證監控 scripts](/zh-TW/help/scripts#auth-monitoring-scripts)

## Anthropic 注意事項

Anthropic `claude-cli` 後端已再次受支援。

- Anthropic 人員告訴我們，此 OpenClaw 整合路徑再次被允許。
- 因此，除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用和 `claude -p` 使用視為
  Anthropic 支援執行已核准的方式。
- 對於長時間運作的 Gateway
  主機和明確的伺服器端計費控制，Anthropic API 金鑰仍是最可預期的選擇。

## 檢查模型認證狀態

```bash
openclaw models status
openclaw doctor
```

## API 金鑰輪替行為（Gateway）

有些供應商支援在 API 呼叫遇到供應商速率限制時，使用替代金鑰重試請求。

- 優先順序：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（單一覆寫）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google 供應商也會包含 `GOOGLE_API_KEY` 作為額外 fallback。
- 同一份金鑰清單會在使用前去重。
- OpenClaw 只會在速率限制錯誤時使用下一把金鑰重試（例如
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached` 或
  `workers_ai ... quota limit exceeded`）。
- 非速率限制錯誤不會使用替代金鑰重試。
- 如果所有金鑰都失敗，會傳回最後一次嘗試的最終錯誤。

## 控制使用哪個憑證

### 每個工作階段（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 為目前工作階段釘選特定供應商憑證（範例設定檔 id：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）開啟精簡選擇器；使用 `/model status` 查看完整檢視（候選 + 下一個認證設定檔，加上已設定時的供應商端點詳細資訊）。

### 每個代理程式（CLI 覆寫）

為代理程式設定明確的認證設定檔順序覆寫（儲存在該代理程式的 `auth-state.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定代理程式；省略它則使用已設定的預設代理程式。
當你除錯順序問題時，`openclaw models status --probe` 會將被省略的
已儲存設定檔顯示為 `excluded_by_auth_order`，而不是默默略過它們。
當你除錯冷卻問題時，請記得速率限制冷卻可能綁定到
單一模型 id，而不是整個供應商設定檔。

## 疑難排解

### 「找不到憑證」

如果 Anthropic 設定檔缺失，請在
**Gateway 主機**上設定 Anthropic API 金鑰，或設定 Anthropic setup-token 路徑，然後重新檢查：

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
- [認證儲存](/zh-TW/concepts/oauth)
