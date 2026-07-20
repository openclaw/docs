---
read_when:
    - 疑難排解中心引導你來到這裡進行更深入的診斷
    - 你需要以穩定的症狀為依據編寫操作手冊章節，並提供確切的命令
sidebarTitle: Troubleshooting
summary: 閘道、頻道、自動化、節點與瀏覽器的深入疑難排解操作手冊
title: 疑難排解
x-i18n:
    generated_at: "2026-07-20T00:50:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a6e3da86a5f655582ea17e1ed3988fc32294c25a34cee04dbcc3e492c997c366
    source_path: gateway/troubleshooting.md
    workflow: 16
---

這是深入操作手冊。請先從 [/help/troubleshooting](/zh-TW/help/troubleshooting) 的快速分流流程開始。

## 命令執行順序

依此順序執行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常訊號：

- `openclaw gateway status` 顯示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 回報沒有造成阻斷的設定／服務問題。
- `openclaw channels status --probe` 顯示各帳號即時傳輸狀態，並在支援時顯示 `works` 或 `audit ok`。

## 更新後

更新完成，但閘道停止運作、頻道為空，或模型呼叫發生 401 錯誤時使用。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

檢查：

- `Update restart`（位於 `openclaw status`／`openclaw status --all`）。待處理或失敗的交接項目會包含下一個要執行的命令。
- Channels 下的 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`：頻道設定仍然存在，但外掛註冊在頻道載入前失敗。
- 重新驗證後仍發生供應商 401 錯誤：`openclaw doctor --fix` 會檢查各代理程式中過時的 OAuth 驗證陰影設定，並移除舊副本，讓所有代理程式都解析至目前共用的設定檔。

## 分裂安裝與新版設定防護

閘道服務在更新後意外停止，或日誌顯示某個 `openclaw` 二進位檔，比最後寫入 `openclaw.json` 的版本舊時使用。

OpenClaw 會以 `meta.lastTouchedVersion` 標記設定寫入。唯讀命令可以檢查由較新 OpenClaw 寫入的設定，但較舊的二進位檔會拒絕執行程序與服務變更。遭阻擋的操作包括：啟動／停止／重新啟動／解除安裝閘道服務、強制重新安裝服務、以服務模式啟動閘道，以及清理 `gateway --force` 連接埠。

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="修正 PATH">
    修正 `PATH`，讓 `openclaw` 解析至較新的安裝版本，然後重新執行該操作。
  </Step>
  <Step title="重新安裝閘道服務">
    從較新的安裝版本重新安裝預定使用的閘道服務：

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="移除過時的包裝程式">
    移除仍指向舊版 `openclaw` 二進位檔的過時系統套件或舊包裝程式項目。
  </Step>
</Steps>

<Warning>
僅限刻意降級或緊急復原時，為單一命令設定 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常運作時請維持未設定狀態。
</Warning>

## 復原版本後的通訊協定不相符

降級或復原版本後，日誌持續輸出 `protocol mismatch` 時使用。此時執行的是較舊的閘道，但較新的本機用戶端程序仍以舊版閘道不支援的通訊協定範圍重新連線。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

檢查：

- 閘道日誌中的 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` 中的 `Established clients:`，或 `openclaw doctor --deep` 中的 `Gateway clients`：連線至閘道連接埠的作用中 TCP 用戶端；作業系統允許時，也會顯示 PID 與命令列。
- 命令列指向較新 OpenClaw 安裝版本或復原前包裝程式的用戶端程序。

修正：

1. 停止或重新啟動 `gateway status --deep` 顯示的過時 OpenClaw 用戶端程序。
2. 重新啟動內嵌 OpenClaw 的應用程式或包裝程式：本機儀表板、編輯器、應用程式伺服器輔助程式，或長時間執行的 `openclaw logs --follow` shell。
3. 重新執行 `openclaw gateway status --deep` 或 `openclaw doctor --deep`，並確認過時用戶端的 PID 已消失。

不要讓較舊的閘道接受較新且不相容的通訊協定。通訊協定升級可保護傳輸協定；復原版本後的修復是程序／版本清理問題。

## Skill 符號連結因路徑跳脫而略過

日誌包含以下內容時使用：

```text
略過已跳脫設定根目錄的 Skill 路徑：... reason=symlink-escape
```

每個 Skill 根目錄都是一個包含邊界。位於 `~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或 `~/.openclaw/skills` 下的符號連結，如果其實際目標解析至該根目錄之外，便會遭到略過，除非該目標已明確設為受信任。

檢查連結：

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

如果此目標是刻意設定的，請同時設定直接 Skill 根目錄與允許的符號連結目標：

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

接著啟動新工作階段，或等待 Skills 監看程式重新整理。如果執行中的程序早於設定變更，請重新啟動閘道。

不要使用 `~`、`/` 或整個已同步專案資料夾等範圍過大的目標。請將 `allowSymlinkTargets` 限定於包含受信任 `SKILL.md` 目錄的實際 Skill 根目錄。

如果 Skill Workshop 的套用操作也應透過這些受信任的符號連結工作區 Skill 路徑寫入，請啟用 `skills.workshop.allowSymlinkTargetWrites`。對唯讀共用 Skill 根目錄，請維持停用。

相關內容：

- [Skills 設定](/zh-TW/tools/skills-config#symlinked-skill-roots)
- [設定範例](/zh-TW/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429：長上下文需要額外使用權限

日誌／錯誤包含 `HTTP 429: rate_limit_error: Extra usage is required for long context requests` 時使用。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

檢查：

- 所選 Anthropic 模型是支援 1M 且已正式推出的 Claude 4.x 模型（Opus 4.6/4.7/4.8、Sonnet 4.6），或模型設定仍包含舊版 `params.context1m: true`。
- 目前的 Anthropic 認證資訊不符合長上下文使用資格。
- 請求只在需要使用 1M 上下文路徑的長工作階段／模型執行中失敗。

修正選項：

<Steps>
  <Step title="使用標準上下文視窗">
    切換至標準視窗模型，或從不具備正式推出之 1M 上下文能力的舊版
    模型設定中移除舊版 `context1m`。
  </Step>
  <Step title="使用符合資格的認證資訊">
    使用符合長上下文請求資格的 Anthropic 認證資訊，或改用 Anthropic API 金鑰。
  </Step>
  <Step title="設定備援模型">
    設定備援模型，讓 Anthropic 長上下文請求遭拒時仍能繼續執行。
  </Step>
</Steps>

相關內容：

- [Anthropic](/zh-TW/providers/anthropic)
- [Token 使用量與成本](/zh-TW/reference/token-use)
- [為什麼我會看到 Anthropic 傳回 HTTP 429？](/zh-TW/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 上游 403 阻擋回應

上游 LLM 供應商傳回一般性 `403`（例如 `Your request was blocked`）時使用。

不要假設這一定是 OpenClaw 設定問題。此回應可能來自上游安全層，例如 OpenAI 相容端點前方的 CDN、WAF、機器人管理規則或反向代理伺服器。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

檢查：

- 同一供應商下的多個模型以相同方式失敗。
- 出現 HTML 或一般性安全性文字，而非正常的供應商 API 錯誤。
- 供應商端在相同請求時間發生安全性事件。
- 極小型直接 `curl` 探測成功，但一般 SDK 格式的請求失敗。

當證據指向 WAF／CDN 阻擋時，請先修正供應商端的篩選。建議針對 OpenClaw 使用的 API 路徑設定範圍精確的允許或略過規則，並避免停用整個網站的防護。

<Warning>
最小型 `curl` 成功，並不保證真正的 SDK 樣式請求也能通過相同的上游安全層。
</Warning>

相關內容：

- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)
- [供應商設定](/zh-TW/providers)
- [日誌](/zh-TW/logging)

## 本機 OpenAI 相容後端通過直接探測，但代理程式執行失敗

以下情況時使用：

- `curl ... /v1/models` 可正常運作。
- 極小型直接 `/v1/chat/completions` 呼叫可正常運作。
- OpenClaw 模型執行只在一般代理程式回合失敗。

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

檢查：

- 直接的小型呼叫成功，但 OpenClaw 執行只在較大提示詞時失敗。
- 發生 `model_not_found` 或 404 錯誤，即使直接 `/v1/chat/completions` 使用相同的純模型 ID 可正常運作。
- 後端錯誤指出 `messages[].content` 預期接收字串。
- 使用 OpenAI 相容本機後端時，間歇出現 `incomplete turn detected ... stopReason=stop payloads=0` 警告。
- 只在提示詞 Token 數較大或使用完整代理程式執行階段提示詞時發生後端當機。

<AccordionGroup>
  <Accordion title="常見徵兆">
    - 本機 MLX／vLLM 樣式伺服器發生 `model_not_found`：確認 `baseUrl` 包含 `/v1`、對於 `/v1/chat/completions` 後端，`api` 為 `"openai-completions"`，而且 `models.providers.<provider>.models[].id` 是供應商本機的純 ID。選取時僅加一次供應商前綴，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目錄項目則保持為 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string`：後端拒絕結構化的 Chat Completions 內容部分。修正方式：設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或 `["role","content"]` 等允許的訊息鍵：後端拒絕 Chat Completions 訊息中的 OpenAI 樣式重播中繼資料。修正方式：設定 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0`：後端已完成 Chat Completions 請求，但該回合未傳回使用者可見的助理文字。OpenClaw 會對可安全重播的空白 OpenAI 相容回合重試一次；持續失敗通常表示後端輸出空白／非文字內容，或抑制最終答案文字。
    - 直接的小型請求成功，但 OpenClaw 代理程式執行因後端／模型當機而失敗（例如某些 `inferrs` 組建上的 Gemma）：OpenClaw 傳輸很可能已正確運作；後端是因較大的代理程式執行階段提示詞格式而失敗。
    - 停用工具後失敗情況減少但未完全消失：工具結構描述是造成壓力的部分原因，但其餘問題仍是上游模型／伺服器容量不足或後端錯誤。

  </Accordion>
  <Accordion title="修正選項">
    1. 對僅接受字串的 Chat Completions 後端設定 `compat.requiresStringContent: true`。
    2. 對每則訊息只接受 `role` 與 `content` 的嚴格 Chat Completions 後端設定 `compat.strictMessageKeys: true`。
    3. 對無法可靠處理 OpenClaw 工具結構描述介面的模型／後端設定 `compat.supportsTools: false`。
    4. 盡可能降低提示詞壓力：縮小工作區啟動內容、縮短工作階段歷程、使用較輕量的本機模型，或改用長上下文支援較強的後端。
    5. 如果直接的小型請求持續成功，但 OpenClaw 代理程式回合仍在後端內部當機，請將其視為上游伺服器／模型限制，並使用可接受的承載資料格式向該上游提交重現案例。
  </Accordion>
</AccordionGroup>

相關內容：

- [設定](/zh-TW/gateway/configuration)
- [本機模型](/zh-TW/gateway/local-models)
- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)

## 沒有回覆

如果頻道已啟動但沒有任何回應，請先檢查路由與政策，再重新連線任何項目。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

請留意：

- 私訊傳送者的配對仍待處理。
- 群組提及限制條件（`requireMention`、`mentionPatterns`）。
- 頻道／群組允許清單不相符。

常見特徵：

- `drop guild message (mention required` → 群組訊息在被提及前會遭忽略。
- `pairing request` → 傳送者需要核准。
- `blocked` / `allowlist` → 傳送者／頻道已被政策篩除。

相關內容：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [群組](/zh-TW/channels/groups)
- [配對](/zh-TW/channels/pairing)

## 儀表板控制介面連線能力

當儀表板／控制介面無法連線時，請驗證 URL、驗證模式及安全情境的假設。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

請留意：

- 探測 URL 和儀表板 URL 是否正確。
- 用戶端與閘道之間的驗證模式／權杖不相符。
- 在需要裝置身分時使用了 HTTP。

如果更新後本機瀏覽器無法連線至 `127.0.0.1:18789`，請先復原本機閘道服務，並確認其正在提供儀表板：

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

如果 `curl` 傳回 OpenClaw HTML，表示閘道運作正常，其餘問題可能是瀏覽器快取、舊的深層連結或過時的分頁狀態。請直接開啟 `http://127.0.0.1:18789`，並從儀表板進行導覽。如果重新啟動後服務仍未持續執行，請執行 `openclaw gateway start`，並重新檢查 `openclaw gateway status`。

<AccordionGroup>
  <Accordion title="連線／驗證特徵">
    - `device identity required` → 非安全情境或缺少裝置驗證。
    - `origin not allowed` → 瀏覽器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正從非迴路瀏覽器來源連線，卻未設定明確的允許清單）。
    - `device nonce required` / `device nonce mismatch` → 用戶端未完成以挑戰為基礎的裝置驗證流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 用戶端針對目前的交握簽署了錯誤的承載資料（或使用過時的時間戳記）。
    - `AUTH_TOKEN_MISMATCH` 搭配 `canRetryWithDeviceToken=true` → 用戶端可使用快取的裝置權杖進行一次受信任的重試。
    - 該快取權杖重試會重複使用與已配對裝置權杖一併儲存的快取範圍集合。明確指定 `deviceToken`／`scopes` 的呼叫端則會保留其要求的範圍集合。
    - `AUTH_SCOPE_MISMATCH` → 裝置權杖已獲辨識，但其核准的範圍未涵蓋此連線要求；請重新配對或核准要求的範圍合約，而非輪替共用閘道權杖。
    - 在該重試路徑以外，連線驗證的優先順序為：先使用明確指定的共用權杖／密碼，再依序使用明確指定的 `deviceToken`、已儲存的裝置權杖，最後是啟動權杖。
    - 在非同步 Tailscale Serve 控制介面路徑上，同一個 `{scope, ip}` 的失敗嘗試會在限制器記錄失敗前依序處理。因此，來自同一用戶端的兩次並行錯誤重試，第二次嘗試可能會顯示 `retry later`，而非兩次都只顯示不相符。
    - 來自瀏覽器來源迴路用戶端的 `too many failed authentication attempts (retry later)` → 同一個正規化 `Origin` 的重複失敗會遭暫時鎖定；另一個 localhost 來源會使用不同的儲存區。
    - 重試後仍重複出現 `unauthorized` → 共用權杖／裝置權杖不同步；請重新整理權杖設定，並視需要重新核准／輪替裝置權杖。
    - `gateway connect failed:` → 主機／連接埠／URL 目標錯誤。

  </Accordion>
</AccordionGroup>

### 驗證詳細資訊代碼快速對照

使用失敗的 `connect` 回應中的 `error.details.code`，決定下一步操作：

| 詳細資訊代碼                  | 意義                                                                                                                                                                                      | 建議操作                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 用戶端未傳送必要的共用權杖。                                                                                                                                                 | 在用戶端貼上／設定權杖，然後重試。若為儀表板路徑：先執行 `openclaw config get gateway.auth.token`，再將其貼到控制介面設定中。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共用權杖與閘道驗證權杖不相符。                                                                                                                                               | 如果是 `canRetryWithDeviceToken=true`，允許一次受信任的重試。快取權杖重試會重複使用已儲存且核准的範圍；明確指定 `deviceToken`／`scopes` 的呼叫端則保留要求的範圍。如果仍然失敗，請執行[權杖不同步復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 每個裝置的快取權杖已過時或遭撤銷。                                                                                                                                                 | 使用[裝置命令列介面](/zh-TW/cli/devices)輪替／重新核准裝置權杖，然後重新連線。                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | 裝置權杖有效，但其核准的角色／範圍未涵蓋此連線要求。                                                                                                       | 重新配對裝置或核准要求的範圍合約；請勿將此情況視為共用權杖不同步。                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | 裝置身分需要核准。請檢查 `error.details.reason` 中的 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，並在有提供時使用 `requestId`／`remediationHint`。 | 核准待處理要求：先執行 `openclaw devices list`，再執行 `openclaw devices approve <requestId>`。在你檢閱要求的存取權後，範圍／角色升級也使用相同流程。                                                                                                               |

<Note>
使用共用閘道權杖／密碼驗證的直接迴路後端 RPC，不應依賴命令列介面的已配對裝置範圍基準。如果子代理程式或其他內部呼叫仍因 `scope-upgrade` 而失敗，請確認呼叫端使用 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且未強制指定明確的 `deviceIdentity` 或裝置權杖。
</Note>

裝置驗證 v2 遷移檢查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果記錄顯示隨機數／簽章錯誤，請更新進行連線的用戶端並加以驗證：

<Steps>
  <Step title="等待 connect.challenge">
    用戶端等待閘道發出的 `connect.challenge`。
  </Step>
  <Step title="簽署承載資料">
    用戶端簽署與挑戰繫結的承載資料。
  </Step>
  <Step title="傳送裝置隨機數">
    用戶端傳送 `connect.params.device.nonce`，並使用相同的挑戰隨機數。
  </Step>
</Steps>

如果 `openclaw devices rotate`／`revoke`／`remove` 意外遭拒：

- 已配對裝置權杖工作階段只能管理**自己的**裝置，除非呼叫端也具有 `operator.admin`。
- `openclaw devices rotate --scope ...` 只能要求呼叫端工作階段已具有的操作員範圍。

相關內容：

- [設定](/zh-TW/gateway/configuration)（閘道驗證模式）
- [控制介面](/zh-TW/web/control-ui)
- [裝置](/zh-TW/cli/devices)
- [遠端存取](/zh-TW/gateway/remote)
- [受信任的 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)

## 閘道服務未執行

當服務已安裝但程序無法持續執行時使用。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 也掃描系統層級服務
```

請留意：

- `Runtime: stopped` 及結束提示。
- 服務設定不相符（`Config (cli)` 與 `Config (service)`）。
- 連接埠／監聽器衝突。
- 使用 `--deep` 時存在額外的 launchd／systemd／schtasks 安裝項目。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 未啟用本機閘道模式，或設定檔遭覆寫並遺失 `gateway.mode`。修正方式：在設定中設置 `gateway.mode="local"`，或重新執行 `openclaw onboard --mode local`／`openclaw setup`，重新寫入預期的本機模式設定。如果你透過 Podman 執行 OpenClaw，預設設定路徑為 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 使用非迴路繫結，但沒有有效的閘道驗證路徑（權杖／密碼，或已設定的受信任 Proxy）。
    - `another gateway instance is already listening`／`EADDRINUSE` → 連接埠衝突。
    - `Other gateway-like services detected (best effort)` → 存在過時或並行的 launchd／systemd／schtasks 單元。大多數設定應讓每台機器僅保留一個閘道；如果確實需要多個，請隔離連接埠、設定／狀態／工作區。請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
    - doctor 傳回的 `System-level OpenClaw gateway service detected` → 系統中存在 systemd 系統單元，但缺少使用者層級服務。請先移除或停用重複項目，再允許 doctor 安裝使用者服務；如果系統單元是預期的監督程式，則設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安裝的監督程式仍鎖定舊的 `--port`。請執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然後重新啟動閘道服務。

  </Accordion>
</AccordionGroup>

相關內容：

- [背景執行與程序工具](/zh-TW/gateway/background-process)
- [設定](/zh-TW/gateway/configuration)
- [Doctor](/zh-TW/gateway/doctor)

## macOS 閘道悄無聲息地停止回應，但在你操作儀表板後又恢復回應

當 macOS 主機上的頻道（Telegram、WhatsApp 等）一次沉寂數分鐘至數小時，且你一開啟控制介面、透過 SSH 登入或以其他方式與主機互動，閘道似乎就立即恢復時，請使用此方法。通常在 `openclaw status` 中看不到明顯症狀，因為等你查看時，閘道已再次恢復運作。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

請尋找：

- `~/.openclaw/logs/stability/` 中的一個或多個 `*-uncaught_exception.json` 組合包，其 `error.code` 設為暫時性網路代碼，例如 `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH` 或 `ECONNREFUSED`。
- `pmset -g log` 中出現 `Entering Sleep state due to 'Maintenance Sleep'` 或 `en0 driver is slow (msg: WillChangeState to 0)` 之類的行，且時間與當機時間戳記吻合。Power Nap／維護睡眠會短暫讓 Wi-Fi 驅動程式進入狀態 0；在該時段內發生的任何對外 `connect()`，即使主機在其他時間具備完整的網路連線能力，也可能因 `ENETDOWN` 而失敗。
- `launchctl print` 輸出顯示 `state = not running`，並有多次近期 `runs` 及結束代碼；尤其是當當機到下次啟動之間的間隔約為一小時，而非數秒時。macOS launchd 會在密集當機後套用未記載於文件的重新產生保護閘門，使其停止遵循 `KeepAlive=true`，直到互動式登入、儀表板連線或 `launchctl kickstart` 等外部觸發重新啟用該閘門。

常見特徵：

- 穩定性組合包的 `error.code` 為 `ENETDOWN` 或同類代碼，且呼叫堆疊指向 Node `net` 的 `lookupAndConnect`／`Socket.connect`。OpenClaw `2026.5.26` 及更新版本會將這些錯誤分類為無害的暫時性網路錯誤，因此不再傳播至最上層的未攔截處理常式；若你使用較舊的版本，請先升級。
- 長時間沉寂，且在你連線至控制介面或透過 SSH 登入主機時立即結束：重新啟用 launchd 重新產生閘門的是使用者可見的活動，而不是儀表板對閘道執行的任何動作。
- `runs` 計數在一天內持續增加，但 `~/Library/Logs/openclaw/gateway.log` 中沒有相對應的 `received SIG*; shutting down` 行：正常關閉會記錄訊號；暫時性當機則不會。

處理方式：

1. 如果執行的版本早於 `2026.5.26`，請**升級閘道**。升級後，未來的 `ENETDOWN` 錯誤將記錄為警告，而不會終止處理程序。
2. 對於預計作為永遠在線伺服器運作的 Mac mini／桌上型主機，請**減少維護睡眠活動**：

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   這會大幅減少但不會完全消除底層驅動程式的短暫中斷。無論這些旗標如何設定，系統仍可能為了 TCP keepalive 和 mDNS 維護而執行部分維護睡眠。

3. 請**新增存活監控程式**，以便日後密集當機遭 launchd 擱置時能迅速偵測：

   ```bash
   # 適合用於每 5 分鐘執行一次的 Cron 或 LaunchAgent，且能感知 launchd 的存活檢查範例
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   重點是從外部重新啟用重新產生閘門；在 macOS 發生密集當機後，僅有 `KeepAlive=true` 並不足夠。

相關內容：

- [macOS 平台說明](/zh-TW/platforms/macos)
- [記錄](/zh-TW/logging)
- [Doctor](/zh-TW/gateway/doctor)

## macOS launchd 監督程式因重複的閘道／節點 LaunchAgent 而循環

當 macOS 安裝環境每隔幾秒便持續重新啟動、`openclaw`
健康狀態檢查在正常與無法使用之間反覆變動，且即使服務看似正在執行，
頻道分派仍停滯時，請使用此方法。

此問題曾出現在同時啟用 `ai.openclaw.gateway` 和
`ai.openclaw.node` LaunchAgent，且兩者都注入
`OPENCLAW_LAUNCHD_LABEL` 的舊版安裝環境中。在此狀態下，OpenClaw 可能偵測到 launchd
監督，嘗試將重新啟動交還給 launchd，結果陷入快速的
`EADDRINUSE`／重新產生循環，而非維持單一穩定的閘道處理程序。

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

請尋找：

- 在 30 秒取樣期間出現多個閘道 PID，而非單一穩定的
  處理程序。
- `gateway.log` 中出現 `EADDRINUSE`、`another gateway instance is already listening`，或重複的
  重新啟動／交接行。
- 在應該只執行一個受管理閘道服務的主機上，同時載入
  `~/Library/LaunchAgents/ai.openclaw.gateway.plist` 和
  `~/Library/LaunchAgents/ai.openclaw.node.plist`。

處理方式：

1. 如果此主機應只執行閘道服務，請透過 OpenClaw 移除受管理的節點
   服務。如果你積極依賴節點服務提供遠端節點功能，請**略過此步驟**；
   解除安裝會停止此主機上的這些功能：

   ```bash
   openclaw node uninstall
   ```

2. 安裝持久性的閘道包裝函式，在啟動 OpenClaw 前清除繼承自 launchd 的
   標記。請使用支援的 `--wrapper` 選項；請勿編輯
   `~/.openclaw/service-env/` 下產生的檔案，因為重新安裝服務、更新及 Doctor 修復都會重新產生該檔案：

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` 會在強制重新安裝、更新及 Doctor 修復時保留包裝函式路徑。

3. 確認閘道保持穩定且能提供 RPC，而非僅在監聽：

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   PID 取樣應顯示單一穩定的處理程序，而非一組不斷輪替的
   PID，且傳入頻道分派應恢復運作。

4. 升級至已修正底層雙 LaunchAgent 循環的版本後，
   請移除因應措施，並重新安裝正常的受管理服務：

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

相關內容：

- [macOS 平台說明](/zh-TW/platforms/mac/bundled-gateway)
- [Doctor](/zh-TW/gateway/doctor)
- [閘道命令列介面](/zh-TW/cli/gateway)

## 閘道在高記憶體使用量期間結束

當閘道在負載下消失、監督程式回報 OOM 類型的重新啟動，或記錄提及 `critical memory pressure bundle written` 時，請使用此方法。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

請尋找：

- 最新穩定性組合包中的 `Reason: diagnostic.memory.pressure.critical`。
- `Memory pressure:` 搭配 `critical/rss_threshold`、`critical/heap_threshold` 或 `critical/rss_growth`。
- 接近堆積限制的 `V8 heap:` 值。
- `Largest session files:` 項目，例如 `agents/<agent>/sessions/<session>.jsonl` 或 `sessions/<session>.jsonl`。
- 閘道在容器或記憶體受限服務內執行時的 Linux cgroup 記憶體計數器。

常見特徵：

- `critical memory pressure bundle written` 在重新啟動前不久出現 → OpenClaw 已擷取 OOM 前的穩定性組合包。請使用 `openclaw gateway stability --bundle latest` 檢查。
- `memory pressure: level=critical` 出現在閘道記錄中 → OpenClaw 偵測到嚴重記憶體壓力，並記錄了處理程序內可取得的記憶體資訊。
- `Largest session files:` 指向非常大的已遮蔽內容文字記錄路徑 → 請減少保留的工作階段歷程、檢查工作階段增長情形，或在重新啟動前將舊文字記錄移出使用中的儲存區。
- `V8 heap:` 已用位元組接近堆積限制 → 請先降低提示詞／工作階段壓力，或減少並行工作。對於受管理服務，請檢查 `openclaw gateway status` 中的 `Gateway heap:`；如果顯示 `not set`，請使用 `openclaw gateway install --force` 重新產生舊服務中繼資料。系統會刻意忽略環境 shell 的 `NODE_OPTIONS`。只有在確認持續性工作負載，並保留足夠的原生記憶體餘裕後，才應使用明確的監督程式層級堆積覆寫。
- `Memory pressure: critical/rss_growth` → 記憶體在單一取樣時段內快速增長。請檢查最新記錄，確認是否有大型匯入、失控的工具輸出、重複重試，或一批已排入佇列的代理程式工作。
- 記錄中出現嚴重記憶體壓力，但沒有組合包 → 請在事件發生後擷取 `openclaw gateway diagnostics export`，以取得可用的操作證據。

穩定性組合包不含承載資料。它包含操作用記憶體證據及已遮蔽內容的相對檔案路徑，不包含訊息文字、網路鉤子本文、認證資訊、權杖、Cookie 或原始工作階段 ID。回報錯誤時，請附上診斷匯出，而非複製原始記錄。

相關內容：

- [閘道健康狀態](/zh-TW/gateway/health)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [工作階段](/zh-TW/cli/sessions)

## 閘道拒絕無效設定

當閘道啟動因 `Invalid config` 而失敗，或熱重新載入記錄指出已略過無效編輯時，請使用此方法。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

請尋找：

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- 使用中設定旁具有時間戳記的 `openclaw.json.rejected.*` 檔案。
- 如果 `doctor --fix` 修復了損壞的直接編輯，則會有具時間戳記的 `openclaw.json.clobbered.*` 檔案。
- OpenClaw 會為每個設定路徑保留最新的 32 個 `.clobbered.*` 檔案，並輪替較舊的檔案。

<AccordionGroup>
  <Accordion title="發生了什麼事">
    - 設定在啟動、熱重新載入或 OpenClaw 擁有的寫入期間未通過驗證。
    - 閘道啟動會以封閉方式失敗，而不會重寫 `openclaw.json`。
    - 熱重新載入會略過無效的外部編輯，並讓目前的執行階段設定保持作用中。
    - OpenClaw 擁有的寫入會在提交前拒絕無效／破壞性承載資料，並儲存 `.rejected.*`。
    - `openclaw doctor --fix` 負責修復。它可以移除非 JSON 前置內容，或還原最後已知正常的副本，同時將遭拒絕的承載資料保留為 `.clobbered.*`。
    - 當單一設定路徑發生多次修復時，OpenClaw 會輪替較舊的 `.clobbered.*` 檔案，使最新修復的承載資料仍可使用。

  </Accordion>
  <Accordion title="檢查並修復">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="常見特徵">
    - `.clobbered.*` 存在 → doctor 在修復使用中設定時，保留了損壞的外部編輯。
    - `.rejected.*` 存在 → OpenClaw 所擁有的設定寫入在提交前未通過結構描述或覆寫檢查。
    - `Config write rejected:` → 該次寫入嘗試移除必要結構、大幅縮減檔案，或保存無效設定。
    - `config reload skipped (invalid config):` → 直接編輯未通過驗證，因此執行中的閘道忽略了該編輯。
    - `Invalid config at ...` → 在閘道服務啟動前，啟動程序便已失敗。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → OpenClaw 所擁有的寫入遭拒，因為相較於最後已知良好的備份，它遺失了欄位或縮減了大小。
    - `Config last-known-good promotion skipped` → 候選設定包含已遮蔽的機密資訊預留位置，例如 `***`。

  </Accordion>
  <Accordion title="修正選項">
    1. 執行 `openclaw doctor --fix`，讓 doctor 修復帶前綴／遭覆寫的設定，或還原最後已知良好的版本。
    2. 僅從 `.clobbered.*` 或 `.rejected.*` 複製預期的鍵，然後使用 `openclaw config set` 或 `config.patch` 套用。
    3. 重新啟動前，請執行 `openclaw config validate`。
    4. 若手動編輯，請保留完整的 JSON5 設定，而不只是你想變更的部分物件。
  </Accordion>
</AccordionGroup>

相關內容：

- [設定](/zh-TW/cli/config)
- [設定：熱重新載入](/zh-TW/gateway/configuration#config-hot-reload)
- [設定：嚴格驗證](/zh-TW/gateway/configuration#strict-validation)
- [Doctor](/zh-TW/gateway/doctor)

## 閘道探測警告

當 `openclaw gateway probe` 能連線到某個目標，但仍顯示警告區塊時使用。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

檢查：

- JSON 輸出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否與 SSH 備援、多個閘道、缺少範圍或無法解析的驗證參照有關。

常見特徵：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 設定失敗，但命令仍嘗試直接連線至已設定的目標／回送目標。
- `multiple reachable gateway identities detected` → 不同的閘道有所回應，或 OpenClaw 無法證明可連線的目標是同一個閘道。即使傳輸連接埠不同，連到同一閘道的 SSH 通道、Proxy URL 或已設定的遠端 URL，仍會視為一個具有多種傳輸方式的閘道。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 連線成功，但詳細資料 RPC 受範圍限制；請配對裝置身分，或使用具備 `operator.read` 的認證資訊。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 連線成功，但完整的診斷 RPC 集逾時或失敗。應將此視為可連線但診斷功能降級的閘道；請比較 `--json` 輸出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → 閘道已有回應，但此用戶端仍需完成配對／核准，才能取得一般操作員存取權。
- 未解析的 `gateway.auth.*`／`gateway.remote.*` SecretRef 警告文字 → 對於失敗的目標，此命令路徑無法取得驗證資料。

相關內容：

- [閘道](/zh-TW/cli/gateway)
- [同一主機上的多個閘道](/zh-TW/gateway#multiple-gateways-same-host)
- [遠端存取](/zh-TW/gateway/remote)

## 頻道已連線，但訊息未流通

如果頻道狀態顯示已連線，但訊息流已中斷，請著重檢查政策、權限及頻道特定的傳送規則。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

檢查：

- 私訊政策（`pairing`、`allowlist`、`open`、`disabled`）。
- 群組允許清單和提及要求。
- 缺少頻道 API 權限／範圍。

常見特徵：

- `mention required` → 訊息因群組提及政策而遭忽略。
- `pairing`／待核准追蹤記錄 → 傳送者尚未獲得核准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 頻道驗證／權限問題。

相關內容：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [Discord](/zh-TW/channels/discord)
- [Telegram](/zh-TW/channels/telegram)
- [WhatsApp](/zh-TW/channels/whatsapp)

## 排程和心跳偵測傳送

如果排程或心跳偵測未執行或未傳送，請先確認排程器狀態，再檢查傳送目標。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

檢查：

- 排程已啟用，且有下一次喚醒時間。
- 工作執行歷程狀態（`ok`、`skipped`、`error`）。
- 心跳偵測略過原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `cron: scheduler disabled; jobs will not run automatically` → 排程已停用。
    - `cron: timer tick failed` → 排程器週期失敗；請檢查檔案／記錄／執行階段錯誤。
    - `heartbeat skipped` 搭配 `reason=quiet-hours` → 不在有效時段範圍內。
    - `heartbeat skipped` 搭配 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但僅包含空白、註解、標頭、圍欄或空白檢查清單骨架，因此 OpenClaw 會略過模型呼叫。
    - `heartbeat skipped` 搭配 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 區塊，但本次週期沒有任何到期工作。
    - `heartbeat: unknown accountId` → 心跳偵測傳送目標的帳號 ID 無效。
    - `heartbeat skipped` 搭配 `reason=dm-blocked` → 心跳偵測目標解析為私訊類型的目的地，而 `agents.defaults.heartbeat.directPolicy`（或各代理程式的覆寫值）設為 `block`。

  </Accordion>
</AccordionGroup>

相關內容：

- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
- [排程工作：疑難排解](/zh-TW/automation/cron-jobs#troubleshooting)

## 節點已配對，但工具失敗

如果節點已配對但工具失敗，請分別檢查前景狀態、權限及核准狀態。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

檢查：

- 節點在線上，且具備預期功能。
- 相機／麥克風／位置／螢幕的作業系統權限授予狀態。
- 執行核准和允許清單狀態。

常見特徵：

- `NODE_BACKGROUND_UNAVAILABLE` → 節點應用程式必須位於前景。
- `*_PERMISSION_REQUIRED`／`LOCATION_PERMISSION_REQUIRED` → 缺少作業系統權限。
- `SYSTEM_RUN_DENIED: approval required` → 執行核准待處理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令遭允許清單阻擋。

相關內容：

- [執行核准](/zh-TW/tools/exec-approvals)
- [節點疑難排解](/zh-TW/nodes/troubleshooting)
- [節點](/zh-TW/nodes/index)

## 瀏覽器工具失敗

當閘道本身運作正常，但瀏覽器工具動作失敗時使用。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

檢查：

- `plugins.allow` 是否已設定並包含 `browser`。
- 有效的瀏覽器執行檔路徑。
- CDP 設定檔的可連線性。
- `existing-session`／`user` 設定檔是否可使用本機 Chrome。

<AccordionGroup>
  <Accordion title="外掛／執行檔特徵">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 內建瀏覽器外掛遭 `plugins.allow` 排除。
    - 瀏覽器工具缺少／無法使用，且 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，因此外掛從未載入。
    - `Failed to start Chrome CDP on port` → 瀏覽器程序啟動失敗。
    - `browser.executablePath not found` → 設定的路徑無效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定的 CDP URL 使用不支援的配置，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 設定的 CDP URL 連接埠無效或超出範圍。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 目前的閘道安裝缺少核心瀏覽器執行階段相依套件；請重新安裝或更新 OpenClaw，然後重新啟動閘道。ARIA 快照和基本頁面螢幕截圖仍可運作，但導覽、AI 快照、CSS 選取器元素螢幕截圖及 PDF 匯出仍無法使用。

  </Accordion>
  <Accordion title="Chrome MCP／現有工作階段特徵">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP 現有工作階段目前無法連結至所選的瀏覽器資料目錄。請開啟瀏覽器檢查頁面、啟用遠端偵錯、讓瀏覽器保持開啟、核准第一次連結提示，然後重試。如果不需要登入狀態，建議使用受管理的 `openclaw` 設定檔。
    - `No browser tabs found for profile="user"` → Chrome MCP 連結設定檔沒有開啟中的本機 Chrome 分頁。
    - `Remote CDP for profile "<name>" is not reachable` → 閘道主機無法連線至設定的遠端 CDP 端點。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 僅連結設定檔沒有可連線的目標，或 HTTP 端點已有回應，但仍無法開啟 CDP WebSocket。

  </Accordion>
  <Accordion title="元素／螢幕截圖／上傳特徵">
    - `fullPage is not supported for element screenshots` → 螢幕截圖要求將 `--full-page` 與 `--ref` 或 `--element` 混合使用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP／`existing-session` 螢幕截圖呼叫必須使用頁面擷取或快照 `--ref`，而非 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上傳掛鉤需要快照參照，而非 CSS 選取器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 設定檔上，每次呼叫只能傳送一個上傳項目。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 設定檔上的對話方塊掛鉤不支援逾時覆寫。
    - `existing-session type does not support timeoutMs overrides.` → 在 `profile="user"`／Chrome MCP 現有工作階段設定檔上使用 `act:type` 時，請省略 `timeoutMs`；若需要自訂逾時，請使用受管理／CDP 瀏覽器設定檔。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要受管理的瀏覽器或原始 CDP 設定檔。
    - 僅連結或遠端 CDP 設定檔上殘留的檢視區／深色模式／地區設定／離線覆寫值 → 執行 `openclaw browser stop --browser-profile <name>`，以關閉使用中的控制工作階段並釋放 Playwright／CDP 模擬狀態，而不必重新啟動整個閘道。

  </Accordion>
</AccordionGroup>

相關內容：

- [瀏覽器（由 OpenClaw 管理）](/zh-TW/tools/browser)
- [瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)

## 如果升級後某些功能突然損壞

大多數升級後的故障，都是設定偏移或目前開始強制執行更嚴格的預設值所致。

<AccordionGroup>
  <Accordion title="1. 驗證與 URL 覆寫行為已變更">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    檢查項目：

    - 如果 `gateway.mode=remote`，命令列介面呼叫可能會以遠端為目標，而你的本機服務並無異常。
    - 明確的 `--url` 呼叫不會回退使用已儲存的認證資訊。

    常見特徵：

    - `gateway connect failed:` → URL 目標錯誤。
    - `unauthorized` → 端點可連線，但驗證錯誤。

  </Accordion>
  <Accordion title="2. 繫結與驗證防護措施更加嚴格">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    檢查項目：

    - 非迴路繫結（`lan`、`tailnet`、`custom`）需要有效的閘道驗證路徑：共用權杖／密碼驗證，或正確設定的非迴路 `trusted-proxy` 部署。
    - 像 `gateway.token` 這類舊金鑰無法取代 `gateway.auth.token`。

    常見特徵：

    - `refusing to bind gateway ... without auth` → 非迴路繫結沒有有效的閘道驗證路徑。
    - 執行階段正在執行時出現 `Connectivity probe: failed` → 閘道仍在運作，但目前的驗證／URL 無法存取。

  </Accordion>
  <Accordion title="3. 配對與裝置身分狀態已變更">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    檢查項目：

    - 儀表板／節點是否有待處理的裝置核准。
    - 原則或身分變更後，是否有待處理的私訊配對核准。

    常見特徵：

    - `device identity required` → 不符合裝置驗證要求。
    - `pairing required` → 必須核准傳送者／裝置。

  </Accordion>
</AccordionGroup>

如果檢查後服務設定與執行階段仍不一致，請從相同的設定檔／狀態目錄重新安裝服務中繼資料：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相關內容：

- [驗證](/zh-TW/gateway/authentication)
- [背景執行與程序工具](/zh-TW/gateway/background-process)
- [節點配對](/zh-TW/gateway/pairing)

## 相關內容

- [Doctor](/zh-TW/gateway/doctor)
- [常見問題](/zh-TW/help/faq)
- [閘道操作手冊](/zh-TW/gateway)
