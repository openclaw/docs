---
read_when:
    - 疑難排解中心將你導向此處，以進行更深入的診斷
    - 你需要穩定、以症狀為基礎的執行手冊章節，並附上確切命令
sidebarTitle: Troubleshooting
summary: Gateway、通道、自動化、節點和瀏覽器的深度疑難排解作業手冊
title: 疑難排解
x-i18n:
    generated_at: "2026-05-11T20:30:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

此頁面是深入執行手冊。如果你想先使用快速分流流程，請從 [/help/troubleshooting](/zh-TW/help/troubleshooting) 開始。

## 命令階梯

請先依照此順序執行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

預期的健康訊號：

- `openclaw gateway status` 顯示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 回報沒有阻塞性的設定/服務問題。
- `openclaw channels status --probe` 顯示每個帳號的即時傳輸狀態，並在支援時顯示探測/稽核結果，例如 `works` 或 `audit ok`。

## 分裂安裝與較新設定防護

當 Gateway 服務在更新後意外停止，或日誌顯示某個 `openclaw` 二進位檔比最後寫入 `openclaw.json` 的版本更舊時，請使用此流程。

OpenClaw 會用 `meta.lastTouchedVersion` 標記設定寫入。唯讀命令仍可檢查由較新 OpenClaw 寫入的設定，但來自較舊二進位檔的程序與服務變更會拒絕繼續。被阻擋的動作包括 Gateway 服務啟動、停止、重新啟動、解除安裝、強制重新安裝服務、服務模式 Gateway 啟動，以及 `gateway --force` 連接埠清理。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="修正 PATH">
    修正 `PATH`，讓 `openclaw` 解析到較新的安裝，然後重新執行該動作。
  </Step>
  <Step title="重新安裝 Gateway 服務">
    從較新的安裝重新安裝預期的 Gateway 服務：

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
僅限有意降版或緊急復原時，為單一命令設定 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常操作時請保持未設定。
</Warning>

## Skill 符號連結因路徑逃逸而被略過

當日誌包含以下內容時，請使用此流程：

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw 會將每個 skill 根目錄視為包含邊界。位於
`~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或
`~/.openclaw/skills` 底下的符號連結，在其真實目標解析到該根目錄外時會被略過，
除非該目標已被明確信任。

檢查連結：

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

如果該目標是有意設定，請同時設定直接 skill 根目錄與
允許的符號連結目標：

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

然後啟動新的工作階段，或等待 skills 監看器重新整理。如果執行中的程序早於設定變更，請重新啟動
Gateway。

請勿使用範圍過廣的目標，例如 `~`、`/` 或整個同步專案資料夾。
請將 `allowSymlinkTargets` 限定在包含受信任
`SKILL.md` 目錄的真實 skill 根目錄。

相關：

- [Skills 設定](/zh-TW/tools/skills-config#symlinked-sibling-repos)
- [設定範例](/zh-TW/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 長上下文需要額外用量

當日誌/錯誤包含：`HTTP 429: rate_limit_error: Extra usage is required for long context requests` 時，請使用此流程。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

請檢查：

- 選取的 Anthropic Opus/Sonnet 模型具有 `params.context1m: true`。
- 目前的 Anthropic 認證沒有長上下文用量資格。
- 請求只在需要 1M beta 路徑的長工作階段/模型執行中失敗。

修正選項：

<Steps>
  <Step title="停用 context1m">
    為該模型停用 `context1m`，以退回一般上下文視窗。
  </Step>
  <Step title="使用符合資格的認證">
    使用符合長上下文請求資格的 Anthropic 認證，或切換到 Anthropic API 金鑰。
  </Step>
  <Step title="設定備援模型">
    設定備援模型，讓 Anthropic 長上下文請求被拒絕時執行仍可繼續。
  </Step>
</Steps>

相關：

- [Anthropic](/zh-TW/providers/anthropic)
- [Token 使用量與成本](/zh-TW/reference/token-use)
- [為什麼我看到來自 Anthropic 的 HTTP 429？](/zh-TW/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本機 OpenAI 相容後端通過直接探測，但 agent 執行失敗

在以下情況使用此流程：

- `curl ... /v1/models` 可運作
- 極小的直接 `/v1/chat/completions` 呼叫可運作
- OpenClaw 模型執行只在一般 agent 回合失敗

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

請檢查：

- 直接的極小呼叫成功，但 OpenClaw 執行只在較大的提示上失敗
- 即使直接 `/v1/chat/completions`
  使用相同的裸模型 ID 可運作，仍出現 `model_not_found` 或 404 錯誤
- 後端錯誤指出 `messages[].content` 預期為字串
- 搭配 OpenAI 相容本機後端時，間歇出現 `incomplete turn detected ... stopReason=stop payloads=0` 警告
- 只在較大的提示 Token 數或完整 agent 執行階段提示下才出現的後端崩潰

<AccordionGroup>
  <Accordion title="常見特徵">
    - 搭配本機 MLX/vLLM 風格伺服器時出現 `model_not_found` → 驗證 `baseUrl` 包含 `/v1`，`/v1/chat/completions` 後端的 `api` 是 `"openai-completions"`，且 `models.providers.<provider>.models[].id` 是裸的 provider 本機 ID。選取時使用一次 provider 前綴，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；保留 catalog 項目為 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string` → 後端拒絕結構化 Chat Completions 內容片段。修正：設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或允許的訊息鍵如 `["role","content"]` → 後端拒絕 Chat Completions 訊息上的 OpenAI 風格重播中繼資料。修正：設定 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0` → 後端完成了 Chat Completions 請求，但該回合沒有回傳使用者可見的 assistant 文字。OpenClaw 會對可安全重播的空 OpenAI 相容回合重試一次；持續失敗通常表示後端正在發出空白/非文字內容，或抑制最終答案文字。
    - 直接的極小請求成功，但 OpenClaw agent 執行因後端/模型崩潰而失敗（例如某些 `inferrs` 建置上的 Gemma）→ OpenClaw 傳輸很可能已經正確；後端在較大的 agent 執行階段提示形狀上失敗。
    - 停用工具後失敗減少但未消失 → 工具 schema 是壓力的一部分，但剩餘問題仍是上游模型/伺服器容量或後端錯誤。

  </Accordion>
  <Accordion title="修正選項">
    1. 對只支援字串的 Chat Completions 後端設定 `compat.requiresStringContent: true`。
    2. 對每則訊息只接受 `role` 和 `content` 的嚴格 Chat Completions 後端設定 `compat.strictMessageKeys: true`。
    3. 對無法可靠處理 OpenClaw 工具 schema 介面的模型/後端設定 `compat.supportsTools: false`。
    4. 在可行處降低提示壓力：較小的工作區啟動內容、較短的工作階段歷史、較輕量的本機模型，或長上下文支援更強的後端。
    5. 如果極小直接請求持續通過，但 OpenClaw agent 回合仍在後端內崩潰，請將其視為上游伺服器/模型限制，並以已接受的 payload 形狀在上游提交重現案例。
  </Accordion>
</AccordionGroup>

相關：

- [設定](/zh-TW/gateway/configuration)
- [本機模型](/zh-TW/gateway/local-models)
- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)

## 無回覆

如果 channels 已啟用但沒有任何回應，請先檢查路由與政策，再重新連接任何項目。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

請檢查：

- DM 傳送者的配對待處理。
- 群組提及控管（`requireMention`、`mentionPatterns`）。
- Channel/群組 allowlist 不相符。

常見特徵：

- `drop guild message (mention required` → 群組訊息會被忽略，直到提及為止。
- `pairing request` → 傳送者需要核准。
- `blocked` / `allowlist` → 傳送者/channel 被政策篩選。

相關：

- [Channel 疑難排解](/zh-TW/channels/troubleshooting)
- [群組](/zh-TW/channels/groups)
- [配對](/zh-TW/channels/pairing)

## 儀表板控制 UI 連線能力

當儀表板/控制 UI 無法連線時，請驗證 URL、驗證模式與安全情境假設。

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
    - `device identity required` → 非安全情境或缺少裝置驗證。
    - `origin not allowed` → 瀏覽器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或你正從沒有明確 allowlist 的非 loopback 瀏覽器來源連線）。
    - `device nonce required` / `device nonce mismatch` → 用戶端未完成以挑戰為基礎的裝置驗證流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 用戶端為目前交握簽署了錯誤 payload（或時間戳記過期）。
    - `AUTH_TOKEN_MISMATCH` 搭配 `canRetryWithDeviceToken=true` → 用戶端可以使用快取的裝置 Token 執行一次受信任重試。
    - 該快取 Token 重試會重用與已配對裝置 Token 一起儲存的快取 scope 集合。明確 `deviceToken` / 明確 `scopes` 呼叫者會保留其請求的 scope 集合。
    - `AUTH_SCOPE_MISMATCH` → 裝置 Token 已被辨識，但其已核准 scope 不涵蓋此連線請求；請重新配對或核准請求的 scope 合約，而不是輪替共用 Gateway Token。
    - 在該重試路徑之外，連線驗證優先順序是明確共用 Token/密碼優先，接著是明確 `deviceToken`，再來是已儲存的裝置 Token，最後是 bootstrap Token。
    - 在非同步 Tailscale Serve 控制 UI 路徑上，相同 `{scope, ip}` 的失敗嘗試會在限制器記錄失敗前被序列化。因此，來自同一用戶端的兩次不正確並行重試，第二次可能顯示 `retry later`，而不是兩個單純的不相符。
    - 瀏覽器來源 loopback 用戶端出現 `too many failed authentication attempts (retry later)` → 來自同一正規化 `Origin` 的重複失敗會被暫時鎖定；另一個 localhost 來源使用不同 bucket。
    - 該重試後重複出現 `unauthorized` → 共用 Token/裝置 Token 漂移；重新整理 Token 設定，並在需要時重新核准/輪替裝置 Token。
    - `gateway connect failed:` → 錯誤的主機/連接埠/URL 目標。

  </Accordion>
</AccordionGroup>

### 驗證詳細代碼快速對照

使用失敗 `connect` 回應中的 `error.details.code` 來選擇下一個動作：

| 詳細代碼                  | 含義                                                                                                                                                                                      | 建議操作                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 用戶端未傳送必要的共用權杖。                                                                                                                                                 | 在用戶端貼上/設定權杖後重試。對於儀表板路徑：`openclaw config get gateway.auth.token`，然後貼到控制 UI 設定中。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共用權杖與 gateway 驗證權杖不相符。                                                                                                                                               | 如果 `canRetryWithDeviceToken=true`，允許一次受信任的重試。快取權杖重試會重用已儲存的已核准範圍；明確的 `deviceToken` / `scopes` 呼叫者會保留要求的範圍。如果仍然失敗，請執行[權杖漂移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 快取的每裝置權杖已過期或已撤銷。                                                                                                                                                 | 使用[裝置 CLI](/zh-TW/cli/devices) 輪替/重新核准裝置權杖，然後重新連線。                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | 裝置權杖有效，但其已核准的角色/範圍未涵蓋此連線要求。                                                                                                       | 重新配對裝置或核准所要求的範圍合約；不要將此視為共用權杖漂移。                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | 裝置身分需要核准。檢查 `error.details.reason` 是否為 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，並在存在時使用 `requestId` / `remediationHint`。 | 核准待處理要求：`openclaw devices list`，然後 `openclaw devices approve <requestId>`。範圍/角色升級在你檢閱要求的存取權後使用相同流程。                                                                                                               |

<Note>
使用共用 gateway 權杖/密碼驗證的直接回送後端 RPC，不應依賴 CLI 的已配對裝置範圍基準。如果子代理或其他內部呼叫仍因 `scope-upgrade` 失敗，請確認呼叫者使用 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且未強制指定明確的 `deviceIdentity` 或裝置權杖。
</Note>

裝置驗證 v2 遷移檢查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果記錄顯示 nonce/signature 錯誤，請更新連線用戶端並驗證它：

<Steps>
  <Step title="等待 connect.challenge">
    用戶端等待 gateway 發出的 `connect.challenge`。
  </Step>
  <Step title="簽署承載資料">
    用戶端簽署綁定 challenge 的承載資料。
  </Step>
  <Step title="傳送裝置 nonce">
    用戶端傳送 `connect.params.device.nonce`，並使用相同的 challenge nonce。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外遭拒：

- 已配對裝置權杖工作階段只能管理**自己的**裝置，除非呼叫者也具有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能要求呼叫者工作階段已持有的 operator 範圍

相關：

- [設定](/zh-TW/gateway/configuration)（gateway 驗證模式）
- [控制 UI](/zh-TW/web/control-ui)
- [裝置](/zh-TW/cli/devices)
- [遠端存取](/zh-TW/gateway/remote)
- [受信任 proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)

## Gateway 服務未執行

當服務已安裝但程序無法維持執行時使用此項。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 也掃描系統層級服務
```

尋找：

- `Runtime: stopped` 與結束提示。
- 服務設定不相符（`Config (cli)` 與 `Config (service)`）。
- 連接埠/監聽器衝突。
- 使用 `--deep` 時的額外 launchd/systemd/schtasks 安裝。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本機 gateway 模式未啟用，或設定檔遭覆寫而遺失 `gateway.mode`。修正：在設定中設定 `gateway.mode="local"`，或重新執行 `openclaw onboard --mode local` / `openclaw setup` 以重新標記預期的本機模式設定。如果你透過 Podman 執行 OpenClaw，預設設定路徑為 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 非回送繫結缺少有效的 gateway 驗證路徑（權杖/密碼，或已設定時的 trusted-proxy）。
    - `another gateway instance is already listening` / `EADDRINUSE` → 連接埠衝突。
    - `Other gateway-like services detected (best effort)` → 存在過時或平行的 launchd/systemd/schtasks 單元。大多數設定應讓每台機器保留一個 gateway；如果你確實需要多個，請隔離連接埠 + 設定/狀態/工作區。請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
    - doctor 顯示 `System-level OpenClaw gateway service detected` → 當使用者層級服務缺失時，存在 systemd 系統單元。在允許 doctor 安裝使用者服務前，移除或停用重複項；如果該系統單元是預期的監督器，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安裝的監督器仍固定舊的 `--port`。執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然後重新啟動 gateway 服務。

  </Accordion>
</AccordionGroup>

相關：

- [背景執行與程序工具](/zh-TW/gateway/background-process)
- [設定](/zh-TW/gateway/configuration)
- [Doctor](/zh-TW/gateway/doctor)

## Gateway 拒絕無效設定

當 Gateway 啟動因 `Invalid config` 失敗，或熱重新載入記錄表示
已略過無效編輯時使用此項。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

尋找：

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- 作用中設定旁邊帶有時間戳記的 `openclaw.json.rejected.*` 檔案
- 如果 `doctor --fix` 修復了損壞的直接編輯，則會有帶有時間戳記的 `openclaw.json.clobbered.*` 檔案

<AccordionGroup>
  <Accordion title="發生了什麼">
    - 設定在啟動、熱重新載入或 OpenClaw 擁有的寫入期間未通過驗證。
    - Gateway 啟動會安全失敗，而不是重寫 `openclaw.json`。
    - 熱重新載入會略過無效的外部編輯，並保持目前的執行階段設定生效。
    - OpenClaw 擁有的寫入會在提交前拒絕無效/破壞性承載資料，並儲存 `.rejected.*`。
    - `openclaw doctor --fix` 擁有修復流程。它可以移除非 JSON 前綴，或還原最後已知良好的副本，同時將被拒絕的承載資料保留為 `.clobbered.*`。

  </Accordion>
  <Accordion title="檢查與修復">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="常見特徵">
    - `.clobbered.*` 存在 → doctor 在修復作用中設定時，保留了損壞的外部編輯。
    - `.rejected.*` 存在 → OpenClaw 擁有的設定寫入在提交前未通過 schema 或 clobber 檢查。
    - `Config write rejected:` → 寫入嘗試移除必要形狀、大幅縮小檔案，或持久化無效設定。
    - `config reload skipped (invalid config):` → 直接編輯未通過驗證，且被執行中的 Gateway 忽略。
    - `Invalid config at ...` → 啟動在 Gateway 服務啟動前失敗。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → OpenClaw 擁有的寫入因相較於最後已知良好的備份遺失欄位或大小而遭拒。
    - `Config last-known-good promotion skipped` → 候選項包含已遮蔽的秘密佔位符，例如 `***`。

  </Accordion>
  <Accordion title="修正選項">
    1. 執行 `openclaw doctor --fix`，讓 doctor 修復有前綴/遭覆寫的設定，或還原最後已知良好版本。
    2. 只從 `.clobbered.*` 或 `.rejected.*` 複製預期的鍵，然後使用 `openclaw config set` 或 `config.patch` 套用它們。
    3. 在重新啟動前執行 `openclaw config validate`。
    4. 如果你手動編輯，請保留完整 JSON5 設定，而不只是你想變更的部分物件。
  </Accordion>
</AccordionGroup>

相關：

- [Config](/zh-TW/cli/config)
- [設定：熱重新載入](/zh-TW/gateway/configuration#config-hot-reload)
- [設定：嚴格驗證](/zh-TW/gateway/configuration#strict-validation)
- [Doctor](/zh-TW/gateway/doctor)

## Gateway 探測警告

當 `openclaw gateway probe` 連到某個目標，但仍列印警告區塊時使用此項。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

尋找：

- JSON 輸出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否關於 SSH fallback、多個 gateway、缺少範圍，或未解析的驗證 refs。

常見特徵：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 設定失敗，但命令仍嘗試直接設定/回送目標。
- `multiple reachable gateways detected` → 超過一個目標回應。通常這表示有意的多 gateway 設定，或過時/重複的監聽器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 連線成功，但詳細 RPC 受範圍限制；配對裝置身分，或使用具備 `operator.read` 的憑證。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 連線成功，但完整診斷 RPC 集逾時或失敗。將此視為可到達但診斷降級的 Gateway；比較 `--json` 輸出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → gateway 已回應，但此用戶端在正常 operator 存取前仍需要配對/核准。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文字 → 此命令路徑中，失敗目標的驗證材料無法使用。

相關：

- [Gateway](/zh-TW/cli/gateway)
- [同一主機上的多個 Gateway](/zh-TW/gateway#multiple-gateways-same-host)
- [遠端存取](/zh-TW/gateway/remote)

## Channel 已連線，但訊息未流動

如果 channel 狀態為已連線，但訊息流已停滯，請聚焦於政策、權限，以及 channel 特定的遞送規則。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

查看：

- DM 政策（`pairing`、`allowlist`、`open`、`disabled`）。
- 群組允許清單與提及要求。
- 缺少 channel API 權限/範圍。

常見特徵：

- `mention required` → 訊息因群組提及政策而被忽略。
- `pairing` / pending approval traces → 傳送者未獲核准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → channel 驗證/權限問題。

相關：

- [Channel 疑難排解](/zh-TW/channels/troubleshooting)
- [Discord](/zh-TW/channels/discord)
- [Telegram](/zh-TW/channels/telegram)
- [WhatsApp](/zh-TW/channels/whatsapp)

## Cron 和 Heartbeat 遞送

如果 cron 或 heartbeat 未執行或未遞送，請先驗證排程器狀態，再驗證遞送目標。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

查看：

- Cron 已啟用，且有下一次喚醒。
- 作業執行歷史狀態（`ok`、`skipped`、`error`）。
- Heartbeat 略過原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `cron: scheduler disabled; jobs will not run automatically` → cron 已停用。
    - `cron: timer tick failed` → 排程器 tick 失敗；檢查檔案/日誌/執行階段錯誤。
    - `heartbeat skipped` with `reason=quiet-hours` → 不在有效時段視窗內。
    - `heartbeat skipped` with `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空白列 / markdown 標題，因此 OpenClaw 會略過模型呼叫。
    - `heartbeat skipped` with `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 區塊，但此 tick 沒有任何到期任務。
    - `heartbeat: unknown accountId` → heartbeat 遞送目標的帳號 ID 無效。
    - `heartbeat skipped` with `reason=dm-blocked` → heartbeat 目標解析為 DM 樣式目的地，而 `agents.defaults.heartbeat.directPolicy`（或個別 agent 覆寫）設定為 `block`。

  </Accordion>
</AccordionGroup>

相關：

- [Heartbeat](/zh-TW/gateway/heartbeat)
- [排程任務](/zh-TW/automation/cron-jobs)
- [排程任務：疑難排解](/zh-TW/automation/cron-jobs#troubleshooting)

## Node 已配對，工具失敗

如果 node 已配對但工具失敗，請隔離前景、權限與核准狀態。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

查看：

- Node 在線上且具備預期能力。
- 相機/麥克風/位置/螢幕的作業系統權限授權。
- Exec 核准與允許清單狀態。

常見特徵：

- `NODE_BACKGROUND_UNAVAILABLE` → node app 必須位於前景。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少作業系統權限。
- `SYSTEM_RUN_DENIED: approval required` → exec 核准待處理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令遭允許清單封鎖。

相關：

- [Exec 核准](/zh-TW/tools/exec-approvals)
- [Node 疑難排解](/zh-TW/nodes/troubleshooting)
- [Nodes](/zh-TW/nodes/index)

## 瀏覽器工具失敗

當瀏覽器工具動作失敗，但 gateway 本身健康時使用此段。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

查看：

- `plugins.allow` 是否已設定且包含 `browser`。
- 有效的瀏覽器可執行檔路徑。
- CDP profile 可達性。
- `existing-session` / `user` profiles 的本機 Chrome 可用性。

<AccordionGroup>
  <Accordion title="Plugin / 可執行檔特徵">
    - `unknown command "browser"` or `unknown command 'browser'` → 內建的瀏覽器 plugin 被 `plugins.allow` 排除。
    - browser tool missing / unavailable while `browser.enabled=true` → `plugins.allow` 排除 `browser`，因此 plugin 從未載入。
    - `Failed to start Chrome CDP on port` → 瀏覽器程序啟動失敗。
    - `browser.executablePath not found` → 設定的路徑無效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定的 CDP URL 使用不支援的 scheme，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 設定的 CDP URL 有錯誤或超出範圍的連接埠。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 目前的 gateway 安裝缺少核心瀏覽器執行階段相依項；重新安裝或更新 OpenClaw，然後重新啟動 gateway。ARIA 快照和基本頁面截圖仍可運作，但導覽、AI 快照、CSS 選擇器元素截圖和 PDF 匯出仍不可用。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session 特徵">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚無法附加到所選的瀏覽器資料目錄。開啟瀏覽器 inspect 頁面、啟用遠端偵錯、保持瀏覽器開啟、核准第一次附加提示，然後重試。如果不需要已登入狀態，請優先使用受管理的 `openclaw` profile。
    - `No Chrome tabs found for profile="user"` → Chrome MCP 附加 profile 沒有開啟中的本機 Chrome 分頁。
    - `Remote CDP for profile "<name>" is not reachable` → 設定的遠端 CDP 端點無法從 gateway 主機連線。
    - `Browser attachOnly is enabled ... not reachable` or `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 僅附加 profile 沒有可連線的目標，或 HTTP 端點有回應，但 CDP WebSocket 仍無法開啟。

  </Accordion>
  <Accordion title="元素 / 截圖 / 上傳特徵">
    - `fullPage is not supported for element screenshots` → 截圖請求將 `--full-page` 與 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截圖呼叫必須使用頁面擷取或快照 `--ref`，而不是 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上傳 hook 需要快照 ref，而不是 CSS 選擇器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP profiles 上每次呼叫傳送一個上傳。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profiles 上的對話框 hook 不支援 timeout 覆寫。
    - `existing-session type does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP existing-session profiles 的 `act:type` 省略 `timeoutMs`，或在需要自訂 timeout 時使用受管理/CDP 瀏覽器 profile。
    - `existing-session evaluate does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP existing-session profiles 的 `act:evaluate` 省略 `timeoutMs`，或在需要自訂 timeout 時使用受管理/CDP 瀏覽器 profile。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要受管理瀏覽器或原始 CDP profile。
    - stale viewport / dark-mode / locale / offline overrides on attach-only or remote CDP profiles → 執行 `openclaw browser stop --browser-profile <name>` 以關閉作用中的控制工作階段，並釋放 Playwright/CDP 模擬狀態，而不必重新啟動整個 gateway。

  </Accordion>
</AccordionGroup>

相關：

- [瀏覽器（OpenClaw 管理）](/zh-TW/tools/browser)
- [瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)

## 如果你升級後某些東西突然壞掉

大多數升級後的故障是設定漂移，或現在開始強制執行更嚴格的預設值。

<AccordionGroup>
  <Accordion title="1. 驗證與 URL 覆寫行為已變更">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    要檢查的項目：

    - 如果 `gateway.mode=remote`，CLI 呼叫可能會指向遠端，而你的本機服務其實正常。
    - 明確的 `--url` 呼叫不會回退到已儲存的憑證。

    常見特徵：

    - `gateway connect failed:` → URL 目標錯誤。
    - `unauthorized` → 端點可連線，但驗證錯誤。

  </Accordion>
  <Accordion title="2. 繫結與驗證防護欄更嚴格">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    要檢查的項目：

    - 非 loopback 繫結（`lan`、`tailnet`、`custom`）需要有效的 gateway 驗證路徑：共用權杖/密碼驗證，或正確設定的非 loopback `trusted-proxy` 部署。
    - 舊 key（例如 `gateway.token`）不會取代 `gateway.auth.token`。

    常見特徵：

    - `refusing to bind gateway ... without auth` → 非 loopback 繫結缺少有效的 gateway 驗證路徑。
    - `Connectivity probe: failed` while runtime is running → gateway 存活，但使用目前的 auth/url 無法存取。

  </Accordion>
  <Accordion title="3. 配對與裝置身分狀態已變更">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    要檢查的項目：

    - dashboard/nodes 的待處理裝置核准。
    - 政策或身分變更後的待處理 DM 配對核准。

    常見特徵：

    - `device identity required` → 裝置驗證未滿足。
    - `pairing required` → 傳送者/裝置必須獲得核准。

  </Accordion>
</AccordionGroup>

如果服務設定和執行階段在檢查後仍不一致，請從相同的 profile/state 目錄重新安裝服務中繼資料：

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
