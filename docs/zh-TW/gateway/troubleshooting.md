---
read_when:
    - 疑難排解中心將你導向此處，以進行更深入的診斷
    - 你需要穩定、以症狀為依據的執行手冊章節，並包含精確指令
sidebarTitle: Troubleshooting
summary: 針對 Gateway、通道、自動化、節點和瀏覽器的深度疑難排解作業手冊
title: 疑難排解
x-i18n:
    generated_at: "2026-05-02T02:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

本頁是深入執行手冊。如果你想先使用快速分流流程，請從 [/help/troubleshooting](/zh-TW/help/troubleshooting) 開始。

## 命令階梯

先依序執行這些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

預期的健康訊號：

- `openclaw gateway status` 會顯示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 回報沒有阻塞性的設定/服務問題。
- `openclaw channels status --probe` 會顯示各帳號即時傳輸狀態，並在支援時顯示探測/稽核結果，例如 `works` 或 `audit ok`。

## 分裂安裝與較新設定防護

當 Gateway 服務在更新後非預期停止，或記錄顯示某個 `openclaw` 二進位檔比最後寫入 `openclaw.json` 的版本更舊時，使用此流程。

OpenClaw 會使用 `meta.lastTouchedVersion` 標記設定寫入。唯讀命令仍可檢查由較新 OpenClaw 寫入的設定，但行程與服務變更會拒絕從較舊的二進位檔繼續。被阻擋的動作包括 Gateway 服務啟動、停止、重新啟動、解除安裝、強制重新安裝服務、服務模式 Gateway 啟動，以及 `gateway --force` 連接埠清理。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="修正 PATH">
    修正 `PATH`，讓 `openclaw` 解析到較新的安裝版本，然後重新執行該動作。
  </Step>
  <Step title="重新安裝 Gateway 服務">
    從較新的安裝版本重新安裝預期的 Gateway 服務：

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="移除過時包裝器">
    移除仍指向舊 `openclaw` 二進位檔的過時系統套件或舊包裝器項目。
  </Step>
</Steps>

<Warning>
僅限有意降級或緊急復原時，為單一命令設定 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常操作時請保持未設定。
</Warning>

## Anthropic 429 長上下文需要額外用量

當記錄/錯誤包含以下內容時使用：`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

檢查：

- 選取的 Anthropic Opus/Sonnet 模型有 `params.context1m: true`。
- 目前的 Anthropic 憑證不符合長上下文用量資格。
- 請求只在需要 1M beta 路徑的長工作階段/模型執行時失敗。

修正選項：

<Steps>
  <Step title="停用 context1m">
    停用該模型的 `context1m`，以退回一般上下文視窗。
  </Step>
  <Step title="使用符合資格的憑證">
    使用符合長上下文請求資格的 Anthropic 憑證，或切換到 Anthropic API 金鑰。
  </Step>
  <Step title="設定備援模型">
    設定備援模型，讓 Anthropic 長上下文請求被拒絕時執行仍可繼續。
  </Step>
</Steps>

相關：

- [Anthropic](/zh-TW/providers/anthropic)
- [權杖使用與成本](/zh-TW/reference/token-use)
- [為什麼我會看到 Anthropic 的 HTTP 429？](/zh-TW/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本機 OpenAI 相容後端通過直接探測，但代理程式執行失敗

在以下情況使用：

- `curl ... /v1/models` 可運作
- 極小型直接 `/v1/chat/completions` 呼叫可運作
- OpenClaw 模型執行只在一般代理程式回合失敗

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

檢查：

- 直接極小型呼叫成功，但 OpenClaw 執行只在較大提示時失敗
- 即使直接 `/v1/chat/completions` 使用相同裸模型 ID 可運作，仍出現 `model_not_found` 或 404 錯誤
- 後端錯誤指出 `messages[].content` 預期為字串
- OpenAI 相容本機後端間歇出現 `incomplete turn detected ... stopReason=stop payloads=0` 警告
- 只在較大提示權杖數或完整代理程式執行階段提示時出現的後端當機

<AccordionGroup>
  <Accordion title="常見特徵">
    - 本機 MLX/vLLM 風格伺服器出現 `model_not_found` → 確認 `baseUrl` 包含 `/v1`，對 `/v1/chat/completions` 後端而言 `api` 是 `"openai-completions"`，且 `models.providers.<provider>.models[].id` 是裸的提供者本機 ID。選取時使用一次提供者前綴，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目錄項目保持為 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string` → 後端拒絕結構化 Chat Completions 內容部分。修正：設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0` → 後端完成了 Chat Completions 請求，但該回合沒有回傳使用者可見的助理文字。OpenClaw 會對可安全重放的空 OpenAI 相容回合重試一次；持續失敗通常表示後端正在輸出空白/非文字內容，或抑制最終答案文字。
    - 直接極小型請求成功，但 OpenClaw 代理程式執行因後端/模型當機而失敗（例如某些 `inferrs` 建置上的 Gemma）→ OpenClaw 傳輸很可能已經正確；後端在較大的代理程式執行階段提示形狀上失敗。
    - 停用工具後失敗減少但未消失 → 工具結構描述是壓力的一部分，但剩餘問題仍是上游模型/伺服器容量或後端錯誤。

  </Accordion>
  <Accordion title="修正選項">
    1. 對僅支援字串的 Chat Completions 後端設定 `compat.requiresStringContent: true`。
    2. 對無法可靠處理 OpenClaw 工具結構描述表面的模型/後端設定 `compat.supportsTools: false`。
    3. 盡可能降低提示壓力：較小的工作區啟動內容、較短的工作階段歷史、較輕量的本機模型，或具備更強長上下文支援的後端。
    4. 如果極小型直接請求持續通過，但 OpenClaw 代理程式回合仍在後端內部當機，請將其視為上游伺服器/模型限制，並使用已接受的承載形狀向上游提交重現案例。
  </Accordion>
</AccordionGroup>

相關：

- [設定](/zh-TW/gateway/configuration)
- [本機模型](/zh-TW/gateway/local-models)
- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)

## 沒有回覆

如果頻道已啟動但沒有任何回應，先檢查路由與政策，再重新連接任何項目。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

檢查：

- DM 傳送者的配對待處理。
- 群組提及閘控（`requireMention`、`mentionPatterns`）。
- 頻道/群組允許清單不相符。

常見特徵：

- `drop guild message (mention required` → 群組訊息在被提及前會被忽略。
- `pairing request` → 傳送者需要核准。
- `blocked` / `allowlist` → 傳送者/頻道被政策篩選。

相關：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [群組](/zh-TW/channels/groups)
- [配對](/zh-TW/channels/pairing)

## 儀表板控制 UI 連線能力

當儀表板/控制 UI 無法連線時，驗證 URL、驗證模式與安全內容假設。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

檢查：

- 正確的探測 URL 與儀表板 URL。
- 用戶端與 Gateway 之間的驗證模式/權杖不相符。
- 需要裝置身分時使用了 HTTP。

<AccordionGroup>
  <Accordion title="連線 / 驗證特徵">
    - `device identity required` → 非安全內容或缺少裝置驗證。
    - `origin not allowed` → 瀏覽器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或你從非 loopback 瀏覽器來源連線，且沒有明確允許清單）。
    - `device nonce required` / `device nonce mismatch` → 用戶端未完成基於挑戰的裝置驗證流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 用戶端為目前交握簽署了錯誤承載（或過期時間戳記）。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 用戶端可使用快取裝置權杖進行一次受信任重試。
    - 該快取權杖重試會重用與配對裝置權杖一同儲存的快取範圍集。明確 `deviceToken` / 明確 `scopes` 呼叫者則保留其請求的範圍集。
    - 在非該重試路徑時，連線驗證優先順序是明確共用權杖/密碼優先，接著是明確 `deviceToken`，再來是已儲存裝置權杖，最後是啟動權杖。
    - 在非同步 Tailscale Serve 控制 UI 路徑上，來自相同 `{scope, ip}` 的失敗嘗試會在限制器記錄失敗前被序列化。因此，同一用戶端的兩次錯誤並行重試，第二次可能顯示 `retry later`，而不是兩次單純不相符。
    - 瀏覽器來源 loopback 用戶端出現 `too many failed authentication attempts (retry later)` → 來自相同正規化 `Origin` 的重複失敗會暫時鎖定；另一個 localhost 來源會使用不同的桶。
    - 該重試後仍重複 `unauthorized` → 共用權杖/裝置權杖偏移；重新整理權杖設定，並視需要重新核准/輪替裝置權杖。
    - `gateway connect failed:` → 錯誤的主機/連接埠/url 目標。

  </Accordion>
</AccordionGroup>

### 驗證詳細代碼快速對照

使用失敗 `connect` 回應中的 `error.details.code` 來選擇下一步動作：

| 詳細代碼                  | 含義                                                                                                                                                                                      | 建議動作                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 用戶端未傳送必要的共用權杖。                                                                                                                                                 | 在用戶端貼上/設定權杖，然後重試。對於儀表板路徑：`openclaw config get gateway.auth.token`，然後貼到 Control UI 設定中。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共用權杖與 Gateway 驗證權杖不符。                                                                                                                                               | 如果 `canRetryWithDeviceToken=true`，允許一次受信任的重試。快取權杖重試會重複使用已儲存的核准範圍；明確的 `deviceToken` / `scopes` 呼叫端會保留要求的範圍。如果仍然失敗，請執行[權杖漂移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 快取的各裝置權杖已過期或遭撤銷。                                                                                                                                                 | 使用 [devices CLI](/zh-TW/cli/devices) 輪替/重新核准裝置權杖，然後重新連線。                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | 裝置身分需要核准。檢查 `error.details.reason` 是否為 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，並在有提供時使用 `requestId` / `remediationHint`。 | 核准待處理要求：`openclaw devices list`，然後 `openclaw devices approve <requestId>`。範圍/角色升級在你審查要求的存取權後，使用相同流程。                                                                                                               |

<Note>
使用共用 Gateway 權杖/密碼驗證的直接迴路後端 RPC，不應依賴 CLI 的已配對裝置範圍基準。如果子代理或其他內部呼叫仍因 `scope-upgrade` 失敗，請確認呼叫端使用 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且未強制指定明確的 `deviceIdentity` 或裝置權杖。
</Note>

裝置驗證 v2 遷移檢查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果記錄顯示 nonce/簽章錯誤，請更新連線用戶端並驗證：

<Steps>
  <Step title="Wait for connect.challenge">
    用戶端等待 Gateway 發出的 `connect.challenge`。
  </Step>
  <Step title="Sign the payload">
    用戶端簽署繫結挑戰的酬載。
  </Step>
  <Step title="Send the device nonce">
    用戶端使用相同的挑戰 nonce 傳送 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外遭拒：

- 已配對裝置權杖工作階段只能管理**自己的**裝置，除非呼叫端也擁有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能要求呼叫端工作階段已持有的操作者範圍

相關：

- [組態](/zh-TW/gateway/configuration)（Gateway 驗證模式）
- [Control UI](/zh-TW/web/control-ui)
- [裝置](/zh-TW/cli/devices)
- [遠端存取](/zh-TW/gateway/remote)
- [受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)

## Gateway 服務未執行

當服務已安裝但程序無法持續執行時使用此項。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

尋找：

- `Runtime: stopped` 搭配結束提示。
- 服務組態不符（`Config (cli)` 與 `Config (service)`）。
- 連接埠/監聽器衝突。
- 使用 `--deep` 時出現額外的 launchd/systemd/schtasks 安裝。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本機 Gateway 模式未啟用，或組態檔遭覆寫並遺失 `gateway.mode`。修正：在你的組態中設定 `gateway.mode="local"`，或重新執行 `openclaw onboard --mode local` / `openclaw setup`，以重新加蓋預期的本機模式組態。如果你透過 Podman 執行 OpenClaw，預設組態路徑為 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 非迴路繫結缺少有效的 Gateway 驗證路徑（權杖/密碼，或已設定的受信任 Proxy）。
    - `another gateway instance is already listening` / `EADDRINUSE` → 連接埠衝突。
    - `Other gateway-like services detected (best effort)` → 存在過期或並行的 launchd/systemd/schtasks 單元。大多數設定應讓每台機器只保留一個 Gateway；如果你確實需要多個，請隔離連接埠 + 組態/狀態/工作區。請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
    - doctor 顯示 `System-level OpenClaw gateway service detected` → 使用者層級服務缺失時，存在 systemd 系統單元。在允許 doctor 安裝使用者服務之前，移除或停用重複項；如果系統單元是預期的監督器，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安裝的監督器仍固定舊的 `--port`。執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然後重新啟動 Gateway 服務。

  </Accordion>
</AccordionGroup>

相關：

- [背景執行與程序工具](/zh-TW/gateway/background-process)
- [組態](/zh-TW/gateway/configuration)
- [Doctor](/zh-TW/gateway/doctor)

## Gateway 還原了最後已知良好的組態

當 Gateway 啟動，但記錄表示已還原 `openclaw.json` 時使用此項。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

尋找：

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 作用中組態旁帶時間戳記的 `openclaw.json.clobbered.*` 檔案
- 以 `Config recovery warning` 開頭的 main-agent 系統事件

<AccordionGroup>
  <Accordion title="What happened">
    - 遭拒絕的組態在啟動或熱重新載入期間未通過驗證。
    - OpenClaw 將遭拒絕的酬載保留為 `.clobbered.*`。
    - 作用中組態已從最後驗證的 last-known-good 副本還原。
    - 下一個 main-agent 回合會收到警告，不要盲目重寫遭拒絕的組態。
    - 如果所有驗證問題都位於 `plugins.entries.<id>...` 之下，OpenClaw 不會還原整個檔案。Plugin 本地失敗會保持醒目，而不相關的使用者設定仍會保留在作用中組態中。

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` 存在 → 外部直接編輯或啟動讀取已被還原。
    - `.rejected.*` 存在 → OpenClaw 擁有的組態寫入在提交前未通過結構描述或覆寫檢查。
    - `Config write rejected:` → 寫入嘗試移除必要形狀、讓檔案大幅縮小，或保存無效組態。
    - `Rejected validation details:` → 復原記錄或 main-agent 通知包含導致還原的結構描述路徑，例如 `agents.defaults.execution` 或 `gateway.auth.password.source`。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → 啟動將目前檔案視為遭覆寫，因為相較於 last-known-good 備份，它遺失欄位或大小變小。
    - `Config last-known-good promotion skipped` → 候選項包含已遮蔽的祕密佔位符，例如 `***`。

  </Accordion>
  <Accordion title="Fix options">
    1. 如果還原的作用中組態正確，請保留它。
    2. 只從 `.clobbered.*` 或 `.rejected.*` 複製預期的鍵，然後使用 `openclaw config set` 或 `config.patch` 套用。
    3. 重新啟動前執行 `openclaw config validate`。
    4. 如果你手動編輯，請保留完整的 JSON5 組態，而不只是你想變更的部分物件。
  </Accordion>
</AccordionGroup>

相關：

- [Config](/zh-TW/cli/config)
- [組態：熱重新載入](/zh-TW/gateway/configuration#config-hot-reload)
- [組態：嚴格驗證](/zh-TW/gateway/configuration#strict-validation)
- [Doctor](/zh-TW/gateway/doctor)

## Gateway 探測警告

當 `openclaw gateway probe` 連到某個項目，但仍印出警告區塊時使用此項。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

尋找：

- JSON 輸出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否與 SSH 後援、多個 Gateway、缺少範圍或未解析的驗證參照有關。

常見特徵：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 設定失敗，但命令仍嘗試直接探測已設定/迴路目標。
- `multiple reachable gateways detected` → 有多個目標回應。這通常表示有意的多 Gateway 設定，或過期/重複的監聽器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 連線成功，但詳細 RPC 受到範圍限制；請配對裝置身分，或使用具備 `operator.read` 的認證。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 連線成功，但完整診斷 RPC 集逾時或失敗。將此視為可連線但診斷降級的 Gateway；比較 `--json` 輸出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 已回應，但此用戶端在取得一般操作者存取權前仍需要配對/核准。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文字 → 在此命令路徑中，失敗目標無法取得驗證資料。

相關：

- [Gateway](/zh-TW/cli/gateway)
- [同一主機上的多個 Gateway](/zh-TW/gateway#multiple-gateways-same-host)
- [遠端存取](/zh-TW/gateway/remote)

## Channel 已連線，但訊息未流動

如果 Channel 狀態為已連線，但訊息流已中斷，請聚焦在原則、權限與 Channel 特定的傳遞規則。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

尋找：

- 私訊政策（`pairing`、`allowlist`、`open`、`disabled`）。
- 群組允許清單和提及要求。
- 缺少頻道 API 權限/範圍。

常見特徵：

- `mention required` → 訊息因群組提及政策而被忽略。
- `pairing` / 待核准追蹤 → 傳送者尚未核准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 頻道驗證/權限問題。

相關：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [Discord](/zh-TW/channels/discord)
- [Telegram](/zh-TW/channels/telegram)
- [WhatsApp](/zh-TW/channels/whatsapp)

## Cron 和 Heartbeat 傳遞

如果 Cron 或 Heartbeat 未執行或未傳遞，請先確認排程器狀態，然後確認傳遞目標。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

檢查：

- Cron 已啟用且存在下一次喚醒時間。
- 作業執行歷程狀態（`ok`、`skipped`、`error`）。
- Heartbeat 略過原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `cron: scheduler disabled; jobs will not run automatically` → cron 已停用。
    - `cron: timer tick failed` → 排程器 tick 失敗；檢查檔案/記錄/執行階段錯誤。
    - `heartbeat skipped` 且 `reason=quiet-hours` → 位於有效時段視窗之外。
    - `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在但只包含空白行 / markdown 標題，因此 OpenClaw 會略過模型呼叫。
    - `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 區塊，但此 tick 沒有任何到期任務。
    - `heartbeat: unknown accountId` → Heartbeat 傳遞目標的帳號 ID 無效。
    - `heartbeat skipped` 且 `reason=dm-blocked` → Heartbeat 目標解析為私訊式目的地，而 `agents.defaults.heartbeat.directPolicy`（或個別 agent 覆寫）設定為 `block`。

  </Accordion>
</AccordionGroup>

相關：

- [Heartbeat](/zh-TW/gateway/heartbeat)
- [排程任務](/zh-TW/automation/cron-jobs)
- [排程任務：疑難排解](/zh-TW/automation/cron-jobs#troubleshooting)

## Node 已配對，但工具失敗

如果 Node 已配對但工具失敗，請隔離前景、權限和核准狀態。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

檢查：

- Node 在線上且具備預期能力。
- 相機/麥克風/位置/螢幕的作業系統權限授予。
- Exec 核准與允許清單狀態。

常見特徵：

- `NODE_BACKGROUND_UNAVAILABLE` → node app 必須位於前景。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少作業系統權限。
- `SYSTEM_RUN_DENIED: approval required` → exec 核准待處理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允許清單封鎖。

相關：

- [Exec 核准](/zh-TW/tools/exec-approvals)
- [Node 疑難排解](/zh-TW/nodes/troubleshooting)
- [Nodes](/zh-TW/nodes/index)

## 瀏覽器工具失敗

當 Gateway 本身正常，但瀏覽器工具動作失敗時使用此項。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

檢查：

- `plugins.allow` 是否已設定且包含 `browser`。
- 有效的瀏覽器可執行檔路徑。
- CDP 設定檔可達性。
- `existing-session` / `user` 設定檔的本機 Chrome 可用性。

<AccordionGroup>
  <Accordion title="Plugin / 可執行檔特徵">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 內建瀏覽器 Plugin 被 `plugins.allow` 排除。
    - 瀏覽器工具缺少 / 無法使用，且 `browser.enabled=true` → `plugins.allow` 排除 `browser`，因此 Plugin 從未載入。
    - `Failed to start Chrome CDP on port` → 瀏覽器程序啟動失敗。
    - `browser.executablePath not found` → 設定的路徑無效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定的 CDP URL 使用了不支援的 scheme，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 設定的 CDP URL 連接埠錯誤或超出範圍。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 目前的 Gateway 安裝缺少核心瀏覽器執行階段依賴；重新安裝或更新 OpenClaw，然後重新啟動 Gateway。ARIA 快照和基本頁面螢幕截圖仍可運作，但導覽、AI 快照、CSS-selector 元素螢幕截圖和 PDF 匯出仍不可用。

  </Accordion>
  <Accordion title="Chrome MCP / 現有工作階段特徵">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP 現有工作階段尚無法附加到所選瀏覽器資料目錄。開啟瀏覽器檢查頁面、啟用遠端偵錯、保持瀏覽器開啟、核准第一次附加提示，然後重試。如果不需要登入狀態，建議使用受管理的 `openclaw` 設定檔。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加設定檔沒有開啟的本機 Chrome 分頁。
    - `Remote CDP for profile "<name>" is not reachable` → 設定的遠端 CDP 端點無法從 Gateway 主機連線。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 僅附加設定檔沒有可連線的目標，或 HTTP 端點已回應，但仍無法開啟 CDP WebSocket。

  </Accordion>
  <Accordion title="元素 / 螢幕截圖 / 上傳特徵">
    - `fullPage is not supported for element screenshots` → 螢幕截圖要求將 `--full-page` 與 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 螢幕截圖呼叫必須使用頁面擷取或快照 `--ref`，而不是 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上傳 hook 需要快照 refs，而不是 CSS selectors。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 設定檔上每次呼叫傳送一個上傳。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 設定檔上的對話框 hook 不支援逾時覆寫。
    - `existing-session type does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP 現有工作階段設定檔的 `act:type` 省略 `timeoutMs`，或在需要自訂逾時時使用受管理/CDP 瀏覽器設定檔。
    - `existing-session evaluate does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP 現有工作階段設定檔的 `act:evaluate` 省略 `timeoutMs`，或在需要自訂逾時時使用受管理/CDP 瀏覽器設定檔。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要受管理的瀏覽器或原始 CDP 設定檔。
    - 僅附加或遠端 CDP 設定檔上的過期 viewport / 深色模式 / locale / 離線覆寫 → 執行 `openclaw browser stop --browser-profile <name>` 以關閉作用中的控制工作階段，並釋放 Playwright/CDP 模擬狀態，而不重新啟動整個 Gateway。

  </Accordion>
</AccordionGroup>

相關：

- [瀏覽器（OpenClaw 管理）](/zh-TW/tools/browser)
- [瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)

## 如果你升級後突然有東西壞掉

多數升級後故障是設定漂移，或現在開始強制執行更嚴格的預設值。

<AccordionGroup>
  <Accordion title="1. 驗證和 URL 覆寫行為已變更">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    要檢查的項目：

    - 如果 `gateway.mode=remote`，CLI 呼叫可能會指向遠端，而你的本機服務其實正常。
    - 明確的 `--url` 呼叫不會回退到儲存的憑證。

    常見特徵：

    - `gateway connect failed:` → URL 目標錯誤。
    - `unauthorized` → 端點可連線，但驗證錯誤。

  </Accordion>
  <Accordion title="2. 綁定和驗證防護更嚴格">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    要檢查的項目：

    - 非 loopback 綁定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 驗證路徑：共享 token/password 驗證，或正確設定的非 loopback `trusted-proxy` 部署。
    - 舊金鑰如 `gateway.token` 不會取代 `gateway.auth.token`。

    常見特徵：

    - `refusing to bind gateway ... without auth` → 非 loopback 綁定沒有有效的 Gateway 驗證路徑。
    - `Connectivity probe: failed` 且執行階段正在執行 → Gateway 存活，但目前的 auth/url 無法存取。

  </Accordion>
  <Accordion title="3. 配對和裝置身分狀態已變更">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    要檢查的項目：

    - dashboard/nodes 的待處理裝置核准。
    - 政策或身分變更後的待處理私訊配對核准。

    常見特徵：

    - `device identity required` → 裝置驗證未滿足。
    - `pairing required` → 傳送者/裝置必須核准。

  </Accordion>
</AccordionGroup>

如果檢查後服務設定和執行階段仍不一致，請從相同的設定檔/狀態目錄重新安裝服務中繼資料：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相關：

- [驗證](/zh-TW/gateway/authentication)
- [背景 exec 和程序工具](/zh-TW/gateway/background-process)
- [Gateway 擁有的配對](/zh-TW/gateway/pairing)

## 相關

- [Doctor](/zh-TW/gateway/doctor)
- [常見問題](/zh-TW/help/faq)
- [Gateway runbook](/zh-TW/gateway)
