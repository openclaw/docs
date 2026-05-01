---
read_when:
    - 疑難排解中心已將你引導至此，以進行更深入的診斷
    - 你需要穩定且以症狀為基礎的操作手冊章節，並附上精確指令
sidebarTitle: Troubleshooting
summary: Gateway、通道、自動化、節點與瀏覽器的深入疑難排解執行手冊
title: 疑難排解
x-i18n:
    generated_at: "2026-05-01T02:44:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

這個頁面是深入執行手冊。如果想先使用快速分診流程，請從 [/help/troubleshooting](/zh-TW/help/troubleshooting) 開始。

## 命令階梯

請先依照以下順序執行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

預期的健康訊號：

- `openclaw gateway status` 會顯示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 不會回報阻斷性的設定/服務問題。
- `openclaw channels status --probe` 會顯示每個帳號的即時傳輸狀態，且在支援的情況下，會顯示探測/稽核結果，例如 `works` 或 `audit ok`。

## 分裂腦安裝與較新設定防護

當 Gateway 服務在更新後意外停止，或記錄顯示某個 `openclaw` 二進位檔比最後寫入 `openclaw.json` 的版本還舊時，請使用這一節。

OpenClaw 會使用 `meta.lastTouchedVersion` 標記設定寫入。唯讀命令仍可檢查由較新 OpenClaw 寫入的設定，但程序與服務變更會拒絕從較舊的二進位檔繼續。被阻擋的動作包括 Gateway 服務啟動、停止、重新啟動、解除安裝、強制服務重新安裝、服務模式 Gateway 啟動，以及 `gateway --force` 連接埠清理。

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
  <Step title="移除過時的包裝器">
    移除仍指向舊 `openclaw` 二進位檔的過時系統套件或舊包裝器項目。
  </Step>
</Steps>

<Warning>
僅限有意降版或緊急復原時，才為單一命令設定 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常操作時請保持未設定。
</Warning>

## Anthropic 429 長上下文需要額外用量

當記錄/錯誤包含以下內容時，請使用這一節：`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

請檢查：

- 選取的 Anthropic Opus/Sonnet 模型具有 `params.context1m: true`。
- 目前的 Anthropic 憑證不符合長上下文用量資格。
- 請求只會在需要 1M beta 路徑的長工作階段/模型執行中失敗。

修正選項：

<Steps>
  <Step title="停用 context1m">
    停用該模型的 `context1m`，以退回正常上下文視窗。
  </Step>
  <Step title="使用符合資格的憑證">
    使用符合長上下文請求資格的 Anthropic 憑證，或切換到 Anthropic API 金鑰。
  </Step>
  <Step title="設定備援模型">
    設定備援模型，讓 Anthropic 長上下文請求被拒絕時，執行仍能繼續。
  </Step>
</Steps>

相關：

- [Anthropic](/zh-TW/providers/anthropic)
- [Token 使用量與成本](/zh-TW/reference/token-use)
- [為什麼我會看到 Anthropic 的 HTTP 429？](/zh-TW/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本機 OpenAI 相容後端通過直接探測，但代理執行失敗

適用情況：

- `curl ... /v1/models` 可運作
- 極小的直接 `/v1/chat/completions` 呼叫可運作
- OpenClaw 模型執行只在一般代理輪次失敗

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

請檢查：

- 直接的小型呼叫成功，但 OpenClaw 執行只在較大的提示上失敗
- 即使直接 `/v1/chat/completions` 使用相同的裸模型 ID 可運作，仍出現 `model_not_found` 或 404 錯誤
- 後端錯誤指出 `messages[].content` 預期為字串
- 使用 OpenAI 相容本機後端時，間歇出現 `incomplete turn detected ... stopReason=stop payloads=0` 警告
- 只在較大的提示 Token 數或完整代理執行階段提示中出現的後端當機

<AccordionGroup>
  <Accordion title="常見特徵">
    - 本機 MLX/vLLM 風格伺服器出現 `model_not_found` → 確認 `baseUrl` 包含 `/v1`，對於 `/v1/chat/completions` 後端，`api` 是 `"openai-completions"`，且 `models.providers.<provider>.models[].id` 是裸的供應商本機 ID。選取時加一次供應商前綴，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目錄項目保持為 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string` → 後端拒絕結構化 Chat Completions 內容片段。修正方式：設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0` → 後端完成了 Chat Completions 請求，但該輪次沒有回傳使用者可見的助理文字。OpenClaw 會對可安全重播的空 OpenAI 相容輪次重試一次；持續失敗通常表示後端正在輸出空/非文字內容，或抑制最終答案文字。
    - 直接的小型請求成功，但 OpenClaw 代理執行因後端/模型當機而失敗（例如某些 `inferrs` 建置上的 Gemma）→ OpenClaw 傳輸很可能已經正確；是後端在較大的代理執行階段提示形狀上失敗。
    - 停用工具後失敗範圍縮小但未消失 → 工具結構描述是壓力的一部分，但剩餘問題仍是上游模型/伺服器容量或後端錯誤。

  </Accordion>
  <Accordion title="修正選項">
    1. 針對僅支援字串的 Chat Completions 後端，設定 `compat.requiresStringContent: true`。
    2. 針對無法可靠處理 OpenClaw 工具結構描述表面的模型/後端，設定 `compat.supportsTools: false`。
    3. 在可行時降低提示壓力：較小的工作區啟動資料、較短的工作階段歷史、較輕量的本機模型，或具備更強長上下文支援的後端。
    4. 如果直接的小型請求持續通過，但 OpenClaw 代理輪次仍在後端內部當機，請將其視為上游伺服器/模型限制，並使用已接受的酬載形狀向上游提交重現案例。
  </Accordion>
</AccordionGroup>

相關：

- [設定](/zh-TW/gateway/configuration)
- [本機模型](/zh-TW/gateway/local-models)
- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)

## 沒有回覆

如果通道已啟用但沒有任何回應，請先檢查路由與政策，再重新連線任何項目。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

請檢查：

- 私訊寄件者的配對待處理。
- 群組提及閘控（`requireMention`、`mentionPatterns`）。
- 通道/群組允許清單不相符。

常見特徵：

- `drop guild message (mention required` → 群組訊息會被忽略，直到被提及。
- `pairing request` → 寄件者需要核准。
- `blocked` / `allowlist` → 寄件者/通道被政策篩選掉。

相關：

- [通道疑難排解](/zh-TW/channels/troubleshooting)
- [群組](/zh-TW/channels/groups)
- [配對](/zh-TW/channels/pairing)

## 儀表板控制 UI 連線能力

當儀表板/控制 UI 無法連線時，請驗證 URL、驗證模式與安全上下文假設。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

請檢查：

- 正確的探測 URL 與儀表板 URL。
- 用戶端與 Gateway 之間的驗證模式/Token 不相符。
- 在需要裝置身分時使用 HTTP。

<AccordionGroup>
  <Accordion title="連線/驗證特徵">
    - `device identity required` → 非安全上下文或缺少裝置驗證。
    - `origin not allowed` → 瀏覽器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或你正從非 loopback 瀏覽器來源連線，且未明確設定允許清單）。
    - `device nonce required` / `device nonce mismatch` → 用戶端未完成以挑戰為基礎的裝置驗證流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 用戶端為目前交握簽署了錯誤酬載（或過期時間戳）。
    - `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 用戶端可使用快取的裝置 Token 進行一次受信任重試。
    - 該快取 Token 重試會重用與已配對裝置 Token 一起儲存的快取範圍集合。明確的 `deviceToken` / 明確的 `scopes` 呼叫者則保留其要求的範圍集合。
    - 在該重試路徑之外，連線驗證優先順序依序為明確的共享 Token/密碼、明確的 `deviceToken`、已儲存的裝置 Token，然後是啟動 Token。
    - 在非同步 Tailscale Serve Control UI 路徑上，針對相同 `{scope, ip}` 的失敗嘗試會在限制器記錄失敗前被序列化。因此，來自同一用戶端的兩次錯誤並行重試，第二次嘗試可能顯示 `retry later`，而不是兩次普通的不相符。
    - 瀏覽器來源 loopback 用戶端出現 `too many failed authentication attempts (retry later)` → 來自同一個正規化 `Origin` 的重複失敗會被暫時鎖定；另一個 localhost 來源會使用獨立的儲存桶。
    - 該重試後仍重複出現 `unauthorized` → 共享 Token/裝置 Token 漂移；重新整理 Token 設定，並視需要重新核准/輪替裝置 Token。
    - `gateway connect failed:` → 主機/連接埠/URL 目標錯誤。

  </Accordion>
</AccordionGroup>

### 驗證詳細代碼快速對照表

使用失敗 `connect` 回應中的 `error.details.code` 來選擇下一步動作：

| Detail code                  | 意義                                                                                                                                                                                      | 建議動作                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 用戶端未傳送必要的共用權杖。                                                                                                                                                 | 在用戶端貼上/設定權杖，然後重試。對於儀表板路徑：`openclaw config get gateway.auth.token`，然後貼到控制 UI 設定中。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共用權杖與 Gateway 驗證權杖不相符。                                                                                                                                               | 如果 `canRetryWithDeviceToken=true`，允許一次受信任的重試。快取權杖重試會重用已儲存且核准的範圍；明確的 `deviceToken` / `scopes` 呼叫者會保留要求的範圍。如果仍然失敗，請執行[權杖漂移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 快取的每裝置權杖已過期或遭撤銷。                                                                                                                                                 | 使用[裝置 CLI](/zh-TW/cli/devices) 輪替/重新核准裝置權杖，然後重新連線。                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | 裝置身分需要核准。檢查 `error.details.reason` 是否為 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，並在存在時使用 `requestId` / `remediationHint`。 | 核准待處理的要求：`openclaw devices list`，然後 `openclaw devices approve <requestId>`。範圍/角色升級會在你審查要求的存取權後使用相同流程。                                                                                                               |

<Note>
使用共用 Gateway 權杖/密碼驗證的直接 loopback 後端 RPC 不應依賴 CLI 的已配對裝置範圍基準。如果子代理程式或其他內部呼叫仍因 `scope-upgrade` 失敗，請確認呼叫者使用 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且沒有強制使用明確的 `deviceIdentity` 或裝置權杖。
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
    用戶端簽署繫結 challenge 的承載。
  </Step>
  <Step title="Send the device nonce">
    用戶端傳送 `connect.params.device.nonce`，並使用相同的 challenge nonce。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外遭拒：

- 已配對裝置權杖工作階段只能管理**自己的**裝置，除非呼叫者也具有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能要求呼叫者工作階段已持有的操作員範圍

相關：

- [設定](/zh-TW/gateway/configuration)（Gateway 驗證模式）
- [控制 UI](/zh-TW/web/control-ui)
- [裝置](/zh-TW/cli/devices)
- [遠端存取](/zh-TW/gateway/remote)
- [受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)

## Gateway 服務未執行

服務已安裝但程序無法保持執行時，請使用此項。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

尋找：

- `Runtime: stopped` 及結束提示。
- 服務設定不相符（`Config (cli)` 與 `Config (service)`）。
- 連接埠/監聽器衝突。
- 使用 `--deep` 時出現額外的 launchd/systemd/schtasks 安裝。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → local Gateway 模式未啟用，或設定檔遭覆寫並遺失 `gateway.mode`。修正：在你的設定中設定 `gateway.mode="local"`，或重新執行 `openclaw onboard --mode local` / `openclaw setup` 以重新蓋上預期的 local 模式設定。如果你透過 Podman 執行 OpenClaw，預設設定路徑是 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 沒有有效 Gateway 驗證路徑（權杖/密碼，或已設定的受信任 Proxy）時進行非 loopback 繫結。
    - `another gateway instance is already listening` / `EADDRINUSE` → 連接埠衝突。
    - `Other gateway-like services detected (best effort)` → 存在過期或平行的 launchd/systemd/schtasks 單元。大多數設定應在每台機器保留一個 Gateway；如果你確實需要多個，請隔離連接埠 + 設定/狀態/工作區。請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
    - Doctor 顯示 `System-level OpenClaw gateway service detected` → 使用者層級服務缺失時，存在 systemd 系統單元。請先移除或停用重複項，再允許 Doctor 安裝使用者服務；如果系統單元是預期的監督器，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安裝的監督器仍固定舊的 `--port`。執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然後重新啟動 Gateway 服務。

  </Accordion>
</AccordionGroup>

相關：

- [背景執行與程序工具](/zh-TW/gateway/background-process)
- [設定](/zh-TW/gateway/configuration)
- [Doctor](/zh-TW/gateway/doctor)

## Gateway 已還原最後已知良好設定

Gateway 啟動，但記錄顯示它已還原 `openclaw.json` 時，請使用此項。

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
- 作用中設定旁邊的帶時間戳 `openclaw.json.clobbered.*` 檔案
- 以 `Config recovery warning` 開頭的主代理程式系統事件

<AccordionGroup>
  <Accordion title="What happened">
    - 遭拒的設定在啟動或熱重新載入期間未通過驗證。
    - OpenClaw 已將遭拒的承載保留為 `.clobbered.*`。
    - 作用中設定已從最後驗證的最後已知良好副本還原。
    - 下一次主代理程式回合會收到警告，不要盲目重寫遭拒的設定。
    - 如果所有驗證問題都位於 `plugins.entries.<id>...` 之下，OpenClaw 不會還原整個檔案。Plugin 本機失敗會保持明顯，同時不相關的使用者設定會保留在作用中設定中。

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
    - `.rejected.*` 存在 → OpenClaw 擁有的設定寫入在提交前未通過結構描述或覆寫檢查。
    - `Config write rejected:` → 該寫入嘗試移除必要結構、大幅縮小檔案，或保留無效設定。
    - `Rejected validation details:` → 復原記錄或主代理程式通知包含導致還原的結構描述路徑，例如 `agents.defaults.execution` 或 `gateway.auth.password.source`。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → 啟動將目前檔案視為遭覆寫，因為它相較於最後已知良好備份遺失欄位或大小減少。
    - `Config last-known-good promotion skipped` → 候選項包含已遮蔽的密鑰預留位置，例如 `***`。

  </Accordion>
  <Accordion title="Fix options">
    1. 如果還原的作用中設定正確，請保留它。
    2. 只從 `.clobbered.*` 或 `.rejected.*` 複製預期的金鑰，然後使用 `openclaw config set` 或 `config.patch` 套用。
    3. 重新啟動前執行 `openclaw config validate`。
    4. 如果你手動編輯，請保留完整 JSON5 設定，而不是只保留你想變更的部分物件。
  </Accordion>
</AccordionGroup>

相關：

- [Config](/zh-TW/cli/config)
- [設定：熱重新載入](/zh-TW/gateway/configuration#config-hot-reload)
- [設定：嚴格驗證](/zh-TW/gateway/configuration#strict-validation)
- [Doctor](/zh-TW/gateway/doctor)

## Gateway 探測警告

當 `openclaw gateway probe` 觸及某個目標，但仍列印警告區塊時，請使用此項。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

尋找：

- JSON 輸出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是關於 SSH 後援、多個 Gateway、缺少範圍，還是未解析的驗證參照。

常見特徵：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 設定失敗，但命令仍嘗試直接設定/loopback 目標。
- `multiple reachable gateways detected` → 超過一個目標回應。這通常表示刻意的多 Gateway 設定，或過期/重複的監聽器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 連線成功，但詳細 RPC 受到範圍限制；配對裝置身分或使用具有 `operator.read` 的認證。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 連線成功，但完整診斷 RPC 集合逾時或失敗。將此視為可連線但診斷降級的 Gateway；比較 `--json` 輸出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 已回應，但此用戶端仍需要配對/核准後才能進行一般操作員存取。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文字 → 此命令路徑中無法取得失敗目標的驗證材料。

相關：

- [Gateway](/zh-TW/cli/gateway)
- [同一主機上的多個 Gateway](/zh-TW/gateway#multiple-gateways-same-host)
- [遠端存取](/zh-TW/gateway/remote)

## 頻道已連線，但訊息未流動

如果頻道狀態為已連線，但訊息流已停滯，請聚焦於政策、權限和頻道特定的傳遞規則。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

尋找：

- DM 政策（`pairing`、`allowlist`、`open`、`disabled`）。
- 群組允許清單與提及需求。
- 缺少頻道 API 權限/範圍。

常見特徵：

- `mention required` → 訊息因群組提及政策而被忽略。
- `pairing` / 待核准追蹤 → 寄件者尚未核准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 頻道驗證/權限問題。

相關：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [Discord](/zh-TW/channels/discord)
- [Telegram](/zh-TW/channels/telegram)
- [WhatsApp](/zh-TW/channels/whatsapp)

## Cron 與 Heartbeat 傳遞

如果 Cron 或 Heartbeat 未執行或未傳遞，請先確認排程器狀態，再確認傳遞目標。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

尋找：

- Cron 已啟用且下一次喚醒存在。
- 作業執行歷程狀態（`ok`、`skipped`、`error`）。
- Heartbeat 跳過原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron 已停用。
    - `cron: timer tick failed` → 排程器 tick 失敗；檢查檔案/日誌/執行階段錯誤。
    - `heartbeat skipped` 搭配 `reason=quiet-hours` → 位於作用中時段之外。
    - `heartbeat skipped` 搭配 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空白行 / markdown 標題，因此 OpenClaw 會略過模型呼叫。
    - `heartbeat skipped` 搭配 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 區塊，但這次 tick 沒有任何到期任務。
    - `heartbeat: unknown accountId` → Heartbeat 傳遞目標的帳戶 ID 無效。
    - `heartbeat skipped` 搭配 `reason=dm-blocked` → Heartbeat 目標解析為 DM 樣式目的地，但 `agents.defaults.heartbeat.directPolicy`（或個別代理覆寫）設為 `block`。

  </Accordion>
</AccordionGroup>

相關：

- [Heartbeat](/zh-TW/gateway/heartbeat)
- [排程任務](/zh-TW/automation/cron-jobs)
- [排程任務：疑難排解](/zh-TW/automation/cron-jobs#troubleshooting)

## Node 已配對，工具失敗

如果 Node 已配對但工具失敗，請隔離前景、權限與核准狀態。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

尋找：

- Node 在線上且具備預期能力。
- 相機/麥克風/位置/螢幕的作業系統權限授權。
- Exec 核准與允許清單狀態。

常見特徵：

- `NODE_BACKGROUND_UNAVAILABLE` → Node 應用程式必須位於前景。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少作業系統權限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 核准待處理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允許清單封鎖。

相關：

- [Exec 核准](/zh-TW/tools/exec-approvals)
- [Node 疑難排解](/zh-TW/nodes/troubleshooting)
- [Nodes](/zh-TW/nodes/index)

## 瀏覽器工具失敗

當瀏覽器工具動作失敗，但 Gateway 本身健康時，請使用此項。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

尋找：

- `plugins.allow` 是否已設定並包含 `browser`。
- 有效的瀏覽器可執行檔路徑。
- CDP 設定檔可連線性。
- `existing-session` / `user` 設定檔的本機 Chrome 可用性。

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 內建的 browser Plugin 被 `plugins.allow` 排除。
    - 瀏覽器工具遺失 / 不可用，但 `browser.enabled=true` → `plugins.allow` 排除 `browser`，因此 Plugin 從未載入。
    - `Failed to start Chrome CDP on port` → 瀏覽器程序啟動失敗。
    - `browser.executablePath not found` → 設定的路徑無效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定的 CDP URL 使用不支援的 scheme，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 設定的 CDP URL 具有錯誤或超出範圍的連接埠。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 目前的 Gateway 安裝缺少內建 browser Plugin 的 `playwright-core` 執行階段相依項；請執行 `openclaw doctor --fix`，然後重新啟動 Gateway。ARIA 快照和基本頁面截圖仍可運作，但導覽、AI 快照、CSS 選擇器元素截圖和 PDF 匯出仍不可用。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚無法附加至所選的瀏覽器資料目錄。開啟瀏覽器檢查頁面、啟用遠端偵錯、保持瀏覽器開啟、核准第一次附加提示，然後重試。如果不需要登入狀態，建議使用受管理的 `openclaw` 設定檔。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加設定檔沒有開啟中的本機 Chrome 分頁。
    - `Remote CDP for profile "<name>" is not reachable` → 設定的遠端 CDP 端點無法從 Gateway 主機連線。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 僅附加設定檔沒有可連線的目標，或 HTTP 端點有回應，但仍無法開啟 CDP WebSocket。

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → 截圖要求將 `--full-page` 與 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截圖呼叫必須使用頁面擷取或快照 `--ref`，而不是 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上傳 hook 需要快照 ref，而不是 CSS 選擇器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 設定檔上，每次呼叫只傳送一個上傳。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 設定檔上的對話方塊 hook 不支援逾時覆寫。
    - `existing-session type does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP existing-session 設定檔的 `act:type` 省略 `timeoutMs`，或在需要自訂逾時時使用受管理/CDP 瀏覽器設定檔。
    - `existing-session evaluate does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP existing-session 設定檔的 `act:evaluate` 省略 `timeoutMs`，或在需要自訂逾時時使用受管理/CDP 瀏覽器設定檔。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要受管理瀏覽器或原始 CDP 設定檔。
    - 附加-only 或遠端 CDP 設定檔上的過期 viewport / 深色模式 / locale / 離線覆寫 → 執行 `openclaw browser stop --browser-profile <name>` 關閉作用中控制工作階段，並釋放 Playwright/CDP 模擬狀態，而不必重新啟動整個 Gateway。

  </Accordion>
</AccordionGroup>

相關：

- [瀏覽器（OpenClaw 管理）](/zh-TW/tools/browser)
- [瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)

## 如果你升級後某些東西突然故障

大多數升級後故障是設定漂移，或現在開始強制執行更嚴格的預設值。

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    要檢查的項目：

    - 如果 `gateway.mode=remote`，CLI 呼叫可能會指向遠端，而你的本機服務是正常的。
    - 明確的 `--url` 呼叫不會退回使用儲存的認證。

    常見特徵：

    - `gateway connect failed:` → URL 目標錯誤。
    - `unauthorized` → 端點可連線，但驗證錯誤。

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    要檢查的項目：

    - 非 loopback 綁定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 驗證路徑：共享權杖/密碼驗證，或正確設定的非 loopback `trusted-proxy` 部署。
    - 舊鍵例如 `gateway.token` 不會取代 `gateway.auth.token`。

    常見特徵：

    - `refusing to bind gateway ... without auth` → 非 loopback 綁定缺少有效的 Gateway 驗證路徑。
    - `Connectivity probe: failed`，但執行階段正在執行 → Gateway 存活，但使用目前驗證/url 無法存取。

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    要檢查的項目：

    - 儀表板/Node 的待處理裝置核准。
    - 政策或身分變更後的待處理 DM 配對核准。

    常見特徵：

    - `device identity required` → 未滿足裝置驗證。
    - `pairing required` → 寄件者/裝置必須核准。

  </Accordion>
</AccordionGroup>

如果檢查後服務設定與執行階段仍不一致，請從相同的設定檔/狀態目錄重新安裝服務中繼資料：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相關：

- [驗證](/zh-TW/gateway/authentication)
- [背景 exec 與程序工具](/zh-TW/gateway/background-process)
- [Gateway 擁有的配對](/zh-TW/gateway/pairing)

## 相關

- [Doctor](/zh-TW/gateway/doctor)
- [FAQ](/zh-TW/help/faq)
- [Gateway runbook](/zh-TW/gateway)
