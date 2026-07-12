---
read_when:
    - 疑難排解中心引導你到這裡進行更深入的診斷
    - 你需要依症狀分類且穩定的操作手冊章節，並附上確切命令
sidebarTitle: Troubleshooting
summary: 閘道、頻道、自動化、節點與瀏覽器的深入疑難排解操作手冊
title: 疑難排解
x-i18n:
    generated_at: "2026-07-12T14:32:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

這是深入操作手冊。請先從 [/help/troubleshooting](/zh-TW/help/troubleshooting) 開始，依照快速分流流程處理。

## 命令執行順序

依下列順序執行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康狀態的訊號：

- `openclaw gateway status` 顯示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 未回報會阻礙運作的設定或服務問題。
- `openclaw channels status --probe` 顯示每個帳號的即時傳輸狀態，並在支援時顯示 `works` 或 `audit ok`。

## 更新後

更新完成，但閘道未運作、頻道為空，或模型呼叫因 401 而失敗時使用。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

檢查：

- `openclaw status`／`openclaw status --all` 中的 `Update restart`。待處理或失敗的交接會包含接下來要執行的命令。
- Channels 下方出現 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`：頻道設定仍然存在，但外掛註冊在頻道載入前失敗。
- 重新驗證後出現供應商 401：`openclaw doctor --fix` 會檢查是否存在過時的個別代理程式 OAuth 驗證陰影副本，並移除舊副本，讓所有代理程式都能解析目前的共用設定檔。

## 安裝分歧與較新設定防護

更新後閘道服務意外停止，或日誌顯示某個 `openclaw` 二進位檔比最後寫入 `openclaw.json` 的版本舊時使用。

OpenClaw 會使用 `meta.lastTouchedVersion` 標記設定寫入版本。唯讀命令可以檢查由較新版 OpenClaw 寫入的設定，但使用較舊二進位檔執行時，程序與服務異動會被拒絕。遭封鎖的動作包括：啟動／停止／重新啟動／解除安裝閘道服務、強制重新安裝服務、以服務模式啟動閘道，以及使用 `gateway --force` 清理連接埠。

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
  <Step title="重新安裝閘道服務">
    從較新的安裝版本重新安裝預期的閘道服務：

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
僅限刻意降級或緊急復原時，才針對單一命令設定 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。正常運作時請勿設定。
</Warning>

## 復原後的通訊協定不相符

降級或復原後，日誌持續顯示 `protocol mismatch` 時使用。較舊的閘道仍在執行，但較新的本機用戶端程序仍持續使用舊閘道無法處理的通訊協定範圍重新連線。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

檢查：

- 閘道日誌中的 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` 中的 `Established clients:`，或 `openclaw doctor --deep` 中的 `Gateway clients`：連線至閘道連接埠的作用中 TCP 用戶端；作業系統允許時，還會包含 PID 與命令列。
- 命令列指向你已復原之較新版 OpenClaw 安裝或包裝程式的用戶端程序。

修正方式：

1. 停止或重新啟動 `gateway status --deep` 顯示的過時 OpenClaw 用戶端程序。
2. 重新啟動內嵌 OpenClaw 的應用程式或包裝程式：本機儀表板、編輯器、應用程式伺服器輔助程式，或長時間執行 `openclaw logs --follow` 的 shell。
3. 重新執行 `openclaw gateway status --deep` 或 `openclaw doctor --deep`，並確認過時的用戶端 PID 已消失。

不要讓較舊的閘道接受較新且不相容的通訊協定。通訊協定版本提升用於保護線路合約；復原作業應處理程序與版本清理問題。

## Skills 符號連結因路徑逸出而遭略過

日誌包含以下內容時使用：

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

每個 Skills 根目錄都是一個包含範圍邊界。當 `~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或 `~/.openclaw/skills` 下的符號連結，其實際目標解析至該根目錄之外時，除非明確信任該目標，否則會略過此連結。

檢查連結：

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

如果該目標是刻意設定的，請同時設定直接的 Skills 根目錄與允許的符號連結目標：

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

接著啟動新工作階段，或等待 Skills 監看程式重新整理。如果執行中的程序早於這次設定變更，請重新啟動閘道。

請勿使用 `~`、`/` 或整個同步專案資料夾等過於寬泛的目標。將 `allowSymlinkTargets` 限定於包含受信任 `SKILL.md` 目錄的實際 Skills 根目錄。

如果 Skills 工作坊套用功能也應透過這些受信任的符號連結工作區 Skills 路徑寫入，請啟用 `skills.workshop.allowSymlinkTargetWrites`。若為唯讀的共用 Skills 根目錄，請保持停用。

相關內容：

- [Skills 設定](/zh-TW/tools/skills-config#symlinked-skill-roots)
- [設定範例](/zh-TW/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429：長上下文需要額外用量

日誌／錯誤包含以下內容時使用：`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

檢查：

- 選取的 Anthropic 模型是支援正式版 1M 上下文的 Claude 4.x 模型（Opus 4.6/4.7/4.8、Sonnet 4.6），或模型設定仍包含舊版 `params.context1m: true`。
- 目前的 Anthropic 認證資訊不具備使用長上下文的資格。
- 請求僅在需要使用 1M 上下文路徑的長工作階段／模型執行中失敗。

修正選項：

<Steps>
  <Step title="使用標準上下文視窗">
    改用標準視窗模型，或從不支援正式版 1M 上下文的舊版
    模型設定中移除舊版 `context1m`。
  </Step>
  <Step title="使用具備資格的認證資訊">
    使用具備長上下文請求資格的 Anthropic 認證資訊，或改用 Anthropic API 金鑰。
  </Step>
  <Step title="設定備援模型">
    設定備援模型，讓 Anthropic 長上下文請求遭拒時仍能繼續執行。
  </Step>
</Steps>

相關內容：

- [Anthropic](/zh-TW/providers/anthropic)
- [權杖用量與成本](/zh-TW/reference/token-use)
- [為什麼我會收到 Anthropic 的 HTTP 429？](/zh-TW/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 上游 403 封鎖回應

上游 LLM 供應商傳回一般 `403`（例如 `Your request was blocked`）時使用。

不要假設這一定是 OpenClaw 設定問題。此回應可能來自 OpenAI 相容端點前方的上游安全層，例如 CDN、WAF、機器人管理規則或反向代理。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

檢查：

- 同一供應商下的多個模型以相同方式失敗。
- 傳回 HTML 或一般安全性文字，而非正常的供應商 API 錯誤。
- 同一請求時間的供應商端安全性事件。
- 極小型直接 `curl` 探測成功，但一般 SDK 格式的請求失敗。

當證據指向 WAF／CDN 封鎖時，請先修正供應商端的篩選。優先針對 OpenClaw 使用的 API 路徑設定範圍明確的允許或略過規則，並避免停用整個網站的防護。

<Warning>
最小型 `curl` 成功，不代表實際的 SDK 形式請求一定能通過相同的上游安全層。
</Warning>

相關內容：

- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)
- [供應商設定](/zh-TW/providers)
- [日誌](/zh-TW/logging)

## 本機 OpenAI 相容後端通過直接探測，但代理程式執行失敗

適用情況：

- `curl ... /v1/models` 可正常運作。
- 極小型直接 `/v1/chat/completions` 呼叫可正常運作。
- OpenClaw 模型執行僅在一般代理程式回合失敗。

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

檢查：

- 極小型直接呼叫成功，但 OpenClaw 僅在較大的提示詞上執行失敗。
- 即使直接 `/v1/chat/completions` 使用相同的裸模型 ID 可正常運作，仍出現 `model_not_found` 或 404 錯誤。
- 後端錯誤指出 `messages[].content` 預期為字串。
- 使用 OpenAI 相容本機後端時，間歇出現 `incomplete turn detected ... stopReason=stop payloads=0` 警告。
- 僅在提示詞權杖數較大或使用完整代理程式執行階段提示詞時出現的後端當機。

<AccordionGroup>
  <Accordion title="常見特徵">
    - 本機 MLX／vLLM 類型伺服器出現 `model_not_found`：確認 `baseUrl` 包含 `/v1`、對於 `/v1/chat/completions` 後端，`api` 為 `"openai-completions"`，且 `models.providers.<provider>.models[].id` 是供應商本機的裸 ID。選取時只加一次供應商前綴，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目錄項目則維持為 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string`：後端拒絕結構化的 Chat Completions 內容部分。修正方式：設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或允許的訊息索引鍵（例如 `["role","content"]`）：後端拒絕 Chat Completions 訊息中的 OpenAI 形式重播中繼資料。修正方式：設定 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0`：後端已完成 Chat Completions 請求，但該回合未傳回使用者可見的助理文字。OpenClaw 會將可安全重播的空白 OpenAI 相容回合重試一次；持續失敗通常表示後端正在輸出空白／非文字內容，或抑制最終回答文字。
    - 極小型直接請求成功，但 OpenClaw 代理程式執行因後端／模型當機而失敗（例如某些 `inferrs` 組建中的 Gemma）：OpenClaw 傳輸很可能已經正確；是後端無法處理較大的代理程式執行階段提示詞格式。
    - 停用工具後失敗情況減少但未消失：工具結構描述是造成負載的一部分，但其餘問題仍是上游模型／伺服器容量不足或後端錯誤。

  </Accordion>
  <Accordion title="修正選項">
    1. 對僅支援字串的 Chat Completions 後端設定 `compat.requiresStringContent: true`。
    2. 對每則訊息僅接受 `role` 與 `content` 的嚴格 Chat Completions 後端設定 `compat.strictMessageKeys: true`。
    3. 對無法可靠處理 OpenClaw 工具結構描述介面的模型／後端設定 `compat.supportsTools: false`。
    4. 在可行範圍內降低提示詞負載：縮小工作區啟動內容、縮短工作階段歷史記錄、改用較輕量的本機模型，或使用長上下文支援更強的後端。
    5. 如果極小型直接請求持續成功，但 OpenClaw 代理程式回合仍會造成後端內部當機，請將其視為上游伺服器／模型限制，並使用已接受的承載資料格式向該上游提交重現案例。
  </Accordion>
</AccordionGroup>

相關內容：

- [設定](/zh-TW/gateway/configuration)
- [本機模型](/zh-TW/gateway/local-models)
- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)

## 沒有回覆

如果頻道已啟動但沒有任何回覆，請先檢查路由與政策，再重新連線任何項目。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

檢查：

- 私訊傳送者是否有待處理的配對。
- 群組提及閘門控制（`requireMention`、`mentionPatterns`）。
- 頻道／群組允許清單不相符。

常見特徵：

- `drop guild message (mention required` → 群組訊息會被忽略，直到提及為止。
- `pairing request` → 傳送者需要核准。
- `blocked` / `allowlist` → 傳送者／頻道已被政策篩除。

相關內容：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [群組](/zh-TW/channels/groups)
- [配對](/zh-TW/channels/pairing)

## 儀表板控制介面連線能力

當儀表板／控制介面無法連線時，請驗證 URL、驗證模式及安全內容環境的假設。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

檢查：

- 探測 URL 與儀表板 URL 是否正確。
- 用戶端與閘道之間的驗證模式／權杖是否不相符。
- 在需要裝置身分時使用了 HTTP。

如果更新後本機瀏覽器無法連線至 `127.0.0.1:18789`，請先復原本機閘道服務，並確認其正在提供儀表板：

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

如果 `curl` 傳回 OpenClaw HTML，表示閘道運作正常，其餘問題可能是瀏覽器快取、舊的深層連結或過期的分頁狀態。請直接開啟 `http://127.0.0.1:18789`，再從儀表板進行導覽。如果重新啟動後服務未持續執行，請執行 `openclaw gateway start`，然後重新檢查 `openclaw gateway status`。

<AccordionGroup>
  <Accordion title="連線／驗證特徵">
    - `device identity required` → 非安全內容環境或缺少裝置驗證。
    - `origin not allowed` → 瀏覽器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或你正從非回送的瀏覽器來源連線，但未設定明確的允許清單）。
    - `device nonce required` / `device nonce mismatch` → 用戶端未完成基於挑戰的裝置驗證流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 用戶端針對目前的交握簽署了錯誤的承載資料（或使用了過期的時間戳記）。
    - `AUTH_TOKEN_MISMATCH` 搭配 `canRetryWithDeviceToken=true` → 用戶端可使用快取的裝置權杖進行一次受信任的重試。
    - 該快取權杖重試會重複使用與已配對裝置權杖一同儲存的快取範圍集合。明確指定 `deviceToken` / 明確指定 `scopes` 的呼叫端則會保留其要求的範圍集合。
    - `AUTH_SCOPE_MISMATCH` → 裝置權杖已被識別，但其核准的範圍未涵蓋此連線要求；請重新配對或核准要求的範圍合約，而非輪替共用閘道權杖。
    - 在該重試路徑以外，連線驗證的優先順序依次為：明確指定的共用權杖／密碼、明確指定的 `deviceToken`、已儲存的裝置權杖，最後是啟動權杖。
    - 在非同步 Tailscale Serve 控制介面路徑上，限制器記錄失敗前，會先將相同 `{scope, ip}` 的失敗嘗試序列化。因此，來自同一用戶端的兩次錯誤並行重試，第二次嘗試可能會顯示 `retry later`，而非兩次都只顯示不相符。
    - 來自瀏覽器來源回送用戶端的 `too many failed authentication attempts (retry later)` → 來自相同正規化 `Origin` 的重複失敗會遭到暫時鎖定；另一個 localhost 來源會使用不同的儲存區。
    - 該次重試後仍重複出現 `unauthorized` → 共用權杖／裝置權杖發生偏移；請重新整理權杖設定，並視需要重新核准／輪替裝置權杖。
    - `gateway connect failed:` → 主機／連接埠／URL 目標錯誤。

  </Accordion>
</AccordionGroup>

### 驗證詳細代碼速查表

使用失敗 `connect` 回應中的 `error.details.code` 來選擇下一個動作：

| 詳細代碼                     | 意義                                                                                                                                                                                             | 建議動作                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 用戶端未傳送必要的共用權杖。                                                                                                                                                                     | 在用戶端貼上／設定權杖後重試。針對儀表板路徑：執行 `openclaw config get gateway.auth.token`，再將其貼入控制介面設定。                                                                                                                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | 共用權杖與閘道驗證權杖不相符。                                                                                                                                                                   | 如果 `canRetryWithDeviceToken=true`，允許一次受信任的重試。快取權杖重試會重複使用已儲存且核准的範圍；明確指定 `deviceToken` / `scopes` 的呼叫端會保留要求的範圍。如果仍然失敗，請執行[權杖偏移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。                           |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 快取的個別裝置權杖已過期或遭撤銷。                                                                                                                                                               | 使用[裝置命令列介面](/zh-TW/cli/devices)輪替／重新核准裝置權杖，然後重新連線。                                                                                                                                                                                                                                                                  |
| `AUTH_SCOPE_MISMATCH`        | 裝置權杖有效，但其核准的角色／範圍未涵蓋此連線要求。                                                                                                                                             | 重新配對裝置或核准要求的範圍合約；請勿將此情況視為共用權杖偏移。                                                                                                                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | 裝置身分需要核准。檢查 `error.details.reason` 是否為 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，並在存在時使用 `requestId` / `remediationHint`。 | 核准待處理的要求：先執行 `openclaw devices list`，再執行 `openclaw devices approve <requestId>`。檢閱要求的存取權後，範圍／角色升級也使用相同流程。                                                                                                                           |

<Note>
使用共用閘道權杖／密碼進行驗證的直接回送後端 RPC，不應依賴命令列介面的已配對裝置範圍基準。如果子代理程式或其他內部呼叫仍因 `scope-upgrade` 而失敗，請驗證呼叫端使用的是 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且未強制指定明確的 `deviceIdentity` 或裝置權杖。
</Note>

裝置驗證 v2 移轉檢查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果記錄顯示 nonce／簽章錯誤，請更新連線中的用戶端並進行驗證：

<Steps>
  <Step title="等待 connect.challenge">
    用戶端等待閘道發出的 `connect.challenge`。
  </Step>
  <Step title="簽署承載資料">
    用戶端簽署與挑戰繫結的承載資料。
  </Step>
  <Step title="傳送裝置 nonce">
    用戶端使用相同的挑戰 nonce 傳送 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外遭到拒絕：

- 已配對裝置的權杖工作階段只能管理**自己的**裝置，除非呼叫端也擁有 `operator.admin`。
- `openclaw devices rotate --scope ...` 只能要求呼叫端工作階段已擁有的操作者範圍。

相關內容：

- [設定](/zh-TW/gateway/configuration)（閘道驗證模式）
- [控制介面](/zh-TW/web/control-ui)
- [裝置](/zh-TW/cli/devices)
- [遠端存取](/zh-TW/gateway/remote)
- [受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)

## 閘道服務未執行

適用於服務已安裝，但處理程序無法持續執行的情況。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 同時掃描系統層級服務
```

檢查：

- `Runtime: stopped` 及結束提示。
- 服務設定不相符（`Config (cli)` 與 `Config (service)`）。
- 連接埠／監聽器衝突。
- 使用 `--deep` 時發現額外安裝的 launchd/systemd/schtasks。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本機閘道模式未啟用，或設定檔遭覆寫而遺失 `gateway.mode`。修正方式：在你的設定中設定 `gateway.mode="local"`，或重新執行 `openclaw onboard --mode local` / `openclaw setup`，以重新寫入預期的本機模式設定。如果你透過 Podman 執行 OpenClaw，預設設定路徑為 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 非回送繫結沒有有效的閘道驗證路徑（權杖／密碼，或已設定的受信任 Proxy）。
    - `another gateway instance is already listening` / `EADDRINUSE` → 連接埠衝突。
    - `Other gateway-like services detected (best effort)` → 存在過期或並行的 launchd/systemd/schtasks 單元。大多數設定應讓每台機器只保留一個閘道；如果確實需要多個，請隔離連接埠、設定／狀態／工作區。請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
    - doctor 顯示 `System-level OpenClaw gateway service detected` → 存在 systemd 系統單元，但缺少使用者層級服務。在允許 doctor 安裝使用者服務前，請移除或停用重複項目；如果該系統單元是預期的監督程式，則設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安裝的監督程式仍固定使用舊的 `--port`。請執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然後重新啟動閘道服務。

  </Accordion>
</AccordionGroup>

相關內容：

- [背景執行與處理程序工具](/zh-TW/gateway/background-process)
- [設定](/zh-TW/gateway/configuration)
- [Doctor](/zh-TW/gateway/doctor)

## macOS 閘道無聲地停止回應，觸碰儀表板後又恢復

適用於 macOS 主機上的頻道（Telegram、WhatsApp 等）一次沉寂數分鐘至數小時，而當你開啟控制介面、透過 SSH 登入或以其他方式與主機互動時，閘道似乎立刻恢復的情況。`openclaw status` 通常不會顯示明顯症狀，因為等你查看時，閘道已再次恢復運作。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

檢查：

- `~/.openclaw/logs/stability/` 中有一個或多個 `*-uncaught_exception.json` 組合包，其中 `error.code` 設為暫時性網路錯誤碼，例如 `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH` 或 `ECONNREFUSED`。
- `pmset -g log` 中出現類似 `Entering Sleep state due to 'Maintenance Sleep'` 或 `en0 driver is slow (msg: WillChangeState to 0)` 的行，且時間與當機時間戳記一致。Power Nap／維護睡眠會短暫讓 Wi-Fi 驅動程式進入狀態 0；任何剛好在該時段發出的對外 `connect()` 都可能因 `ENETDOWN` 而失敗，即使主機在其他時間具有完整的網路連線能力。
- `launchctl print` 輸出顯示 `state = not running`，並有多次近期的 `runs` 與結束代碼，尤其是當機與下次啟動之間的間隔約為一小時，而非數秒時。macOS launchd 在短時間內多次當機後，會套用未公開的重新衍生保護機制；這可能導致它停止遵循 `KeepAlive=true`，直到互動式登入、控制面板連線或 `launchctl kickstart` 等外部觸發重新啟用該機制。

常見特徵：

- 穩定性組合包中的 `error.code` 為 `ENETDOWN` 或同類錯誤碼，且呼叫堆疊指向 Node `net` 的 `lookupAndConnect`／`Socket.connect`。OpenClaw `2026.5.26` 及更新版本會將這些錯誤分類為無害的暫時性網路錯誤，因此不再傳播至頂層未捕捉處理常式；如果你使用較舊的版本，請先升級。
- 長時間沒有活動，卻在你連線至控制介面或透過 SSH 登入主機時立即恢復：重新啟用 launchd 重新衍生機制的是使用者可見的活動，而不是控制面板對閘道執行了任何操作。
- `runs` 計數在一天內持續增加，但 `~/Library/Logs/openclaw/gateway.log` 中沒有對應的 `received SIG*; shutting down` 行：正常關閉會記錄訊號；暫時性當機則不會。

處理方式：

1. 如果你執行的是 `2026.5.26` 之前的版本，請**升級閘道**。升級後，未來的 `ENETDOWN` 錯誤會記錄為警告，而不會終止程序。
2. 對於用作全天候伺服器的 Mac mini／桌上型主機，請**減少維護睡眠活動**：

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   這會顯著減少、但無法完全消除底層驅動程式的狀態波動。無論這些旗標如何設定，系統仍可能為了 TCP keepalive 與 mDNS 維護而執行部分維護睡眠。

3. **新增存活監看程式**，以便未來短時間內多次當機並被 launchd 暫停重新啟動時，能夠迅速偵測：

   ```bash
   # 適用於每 5 分鐘執行一次的排程或 LaunchAgent，並可感知 launchd 的存活檢查範例
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   重點是透過外部操作重新啟用重新衍生機制；macOS 在短時間內多次當機後，僅設定 `KeepAlive=true` 並不足夠。

相關內容：

- [macOS 平台注意事項](/zh-TW/platforms/macos)
- [記錄](/zh-TW/logging)
- [Doctor](/zh-TW/gateway/doctor)

## 存在重複閘道／節點 LaunchAgent 時的 macOS launchd 監督程式迴圈

當 macOS 安裝項目每隔幾秒便持續重新啟動、`openclaw`
健康檢查在正常與無法使用之間反覆變動，且即使服務看似正在執行，
頻道分派仍然停滯時，請使用此方法。

此問題曾出現在較舊的安裝中，當時 `ai.openclaw.gateway` 與
`ai.openclaw.node` LaunchAgent 同時啟用，且兩者都注入了
`OPENCLAW_LAUNCHD_LABEL`。在此狀態下，OpenClaw 可能偵測到 launchd
監督、嘗試將重新啟動交還給 launchd，結果不是維持單一穩定的閘道程序，
而是陷入快速的 `EADDRINUSE`／重新衍生迴圈。

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

請檢查：

- 在 30 秒取樣期間出現多個閘道 PID，而非一個穩定的
  程序。
- `gateway.log` 中出現 `EADDRINUSE`、`another gateway instance is already listening`，或重複的
  重新啟動／交接行。
- 在應該只執行一個受管理閘道服務的主機上，
  `~/Library/LaunchAgents/ai.openclaw.gateway.plist` 與
  `~/Library/LaunchAgents/ai.openclaw.node.plist` 同時載入。

處理方式：

1. 如果此主機應該只執行閘道服務，請透過 OpenClaw 移除受管理的節點
   服務。如果你目前依賴節點服務提供遠端節點功能，請**略過此步驟**；
   解除安裝會停止此主機上的那些功能：

   ```bash
   openclaw node uninstall
   ```

2. 安裝持續生效的閘道包裝程式，在啟動 OpenClaw 前清除繼承的 launchd
   標記。請使用支援的 `--wrapper` 選項；不要編輯
   `~/.openclaw/service-env/` 下產生的檔案，因為重新安裝服務、
   更新及 Doctor 修復都會重新產生該檔案：

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

   `gateway install` 會在強制重新安裝、更新及 Doctor 修復後，仍保留包裝程式路徑。

3. 驗證閘道保持穩定且確實提供 RPC，而不只是監聽連線：

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   PID 取樣應顯示一個穩定的程序，而非持續輪替的一組
   PID，且傳入頻道分派應恢復運作。

4. 升級到已修正底層雙 LaunchAgent 迴圈的版本後，
   請移除因應措施，並重新安裝一般的受管理服務：

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

相關內容：

- [macOS 平台注意事項](/zh-TW/platforms/mac/bundled-gateway)
- [Doctor](/zh-TW/gateway/doctor)
- [閘道命令列介面](/zh-TW/cli/gateway)

## 閘道在高記憶體用量期間結束

當閘道在負載下消失、監督程式回報類似 OOM 的重新啟動，或記錄中提到 `critical memory pressure bundle written` 時使用。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

請檢查：

- 最新穩定性組合包中的 `Reason: diagnostic.memory.pressure.critical`。
- 包含 `critical/rss_threshold`、`critical/heap_threshold` 或 `critical/rss_growth` 的 `Memory pressure:`。
- 接近堆積限制的 `V8 heap:` 值。
- `Largest session files:` 項目，例如 `agents/<agent>/sessions/<session>.jsonl` 或 `sessions/<session>.jsonl`。
- 當閘道在容器或記憶體受限的服務內執行時，檢查 Linux cgroup 記憶體計數器。

常見特徵：

- `critical memory pressure bundle written` 在重新啟動前不久出現 → OpenClaw 已擷取 OOM 前的穩定性組合包。請使用 `openclaw gateway stability --bundle latest` 檢查。
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` 出現在閘道記錄中 → OpenClaw 偵測到嚴重記憶體壓力，但 OOM 前穩定性快照已關閉。
- `Largest session files:` 指向非常大的已遮蔽逐字稿路徑 → 請減少保留的工作階段歷程、檢查工作階段成長情況，或在重新啟動前將舊逐字稿移出作用中儲存區。
- `V8 heap:` 已用位元組數接近堆積限制 → 請降低提示／工作階段壓力、減少並行工作，或僅在確認該工作負載符合預期後才提高 Node 堆積限制。
- `Memory pressure: critical/rss_growth` → 記憶體在單一取樣時段內快速增加。請檢查最新記錄中是否有大型匯入、失控的工具輸出、重複重試，或一批排入佇列的代理程式工作。
- 記錄中出現嚴重記憶體壓力，但不存在組合包 → 這是預設行為。請設定 `diagnostics.memoryPressureSnapshot: true`，以便未來發生嚴重記憶體壓力事件時擷取 OOM 前穩定性組合包。

穩定性組合包不含承載內容。它包含運作相關的記憶體證據與已遮蔽的相對檔案路徑，但不含訊息文字、網路鉤子本文、認證資訊、權杖、Cookie 或原始工作階段 ID。提交錯誤報告時，請附加診斷匯出，而不要複製原始記錄。

相關內容：

- [閘道健康狀態](/zh-TW/gateway/health)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [工作階段](/zh-TW/cli/sessions)

## 閘道拒絕無效設定

當閘道啟動因 `Invalid config` 而失敗，或熱重新載入記錄顯示已略過無效編輯時使用。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

請檢查：

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- 作用中設定旁帶有時間戳記的 `openclaw.json.rejected.*` 檔案。
- 如果 `doctor --fix` 修復了損壞的直接編輯，則會有帶時間戳記的 `openclaw.json.clobbered.*` 檔案。
- OpenClaw 會為每個設定路徑保留最新的 32 個 `.clobbered.*` 檔案，並輪替較舊的檔案。

<AccordionGroup>
  <Accordion title="發生了什麼事">
    - 設定在啟動、熱重新載入或由 OpenClaw 寫入時未通過驗證。
    - 閘道啟動會採取失敗關閉，而不是重寫 `openclaw.json`。
    - 熱重新載入會略過無效的外部編輯，並保持目前的執行階段設定生效。
    - 由 OpenClaw 執行的寫入會在提交前拒絕無效／破壞性承載內容，並儲存 `.rejected.*`。
    - 修復由 `openclaw doctor --fix` 負責。它可以移除非 JSON 前綴，或還原最後已知良好的副本，同時將遭拒的承載內容保留為 `.clobbered.*`。
    - 當同一個設定路徑發生多次修復時，OpenClaw 會輪替較舊的 `.clobbered.*` 檔案，以確保最新修復的承載內容仍可使用。

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
    - `.clobbered.*` 存在 → Doctor 在修復作用中設定時，保留了損壞的外部編輯。
    - `.rejected.*` 存在 → 由 OpenClaw 執行的設定寫入在提交前未通過結構描述或覆寫檢查。
    - `Config write rejected:` → 寫入嘗試移除必要結構、使檔案大小大幅縮減，或保存無效設定。
    - `config reload skipped (invalid config):` → 直接編輯未通過驗證，且被執行中的閘道忽略。
    - `Invalid config at ...` → 在閘道服務啟動前，啟動程序即告失敗。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → 由 OpenClaw 執行的寫入遭到拒絕，因為相較於最後已知良好的備份，它遺失了欄位或檔案大小有所減少。
    - `Config last-known-good promotion skipped` → 候選內容包含已遮蔽的秘密資訊預留位置，例如 `***`。

  </Accordion>
  <Accordion title="修復選項">
    1. 執行 `openclaw doctor --fix`，讓 Doctor 修復帶有前綴／遭覆寫的設定，或還原最後已知良好的版本。
    2. 僅複製 `.clobbered.*` 或 `.rejected.*` 中預期要使用的鍵，然後使用 `openclaw config set` 或 `config.patch` 套用。
    3. 重新啟動前執行 `openclaw config validate`。
    4. 如果你手動編輯，請保留完整的 JSON5 設定，而不是只保留你想變更的部分物件。
  </Accordion>
</AccordionGroup>

相關內容：

- [設定](/zh-TW/cli/config)
- [設定：熱重新載入](/zh-TW/gateway/configuration#config-hot-reload)
- [設定：嚴格驗證](/zh-TW/gateway/configuration#strict-validation)
- [Doctor](/zh-TW/gateway/doctor)

## 閘道探測警告

當 `openclaw gateway probe` 能連線到某個目標，但仍印出警告區塊時使用。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

檢查：

- JSON 輸出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否與 SSH 備援、多個閘道、缺少範圍或無法解析的驗證參照有關。

常見特徵：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 設定失敗，但命令仍嘗試直接探測已設定的目標／迴路目標。
- `multiple reachable gateway identities detected` → 有不同的閘道回應，或 OpenClaw 無法證明可連線的目標是同一個閘道。即使傳輸連接埠不同，連至同一閘道的 SSH 通道、Proxy URL 或已設定的遠端 URL 仍視為具有多種傳輸方式的單一閘道。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 連線成功，但詳細 RPC 受範圍限制；請配對裝置身分，或使用具有 `operator.read` 的認證資訊。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 連線成功，但完整的診斷 RPC 集合逾時或失敗。請將此情況視為可連線但診斷功能降級的閘道；比較 `--json` 輸出中的 `connect.ok` 和 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → 閘道已回應，但此用戶端仍需完成配對／核准，才能取得一般操作員存取權。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文字 → 此命令路徑無法取得失敗目標所需的驗證資料。

相關內容：

- [閘道](/zh-TW/cli/gateway)
- [同一主機上的多個閘道](/zh-TW/gateway#multiple-gateways-same-host)
- [遠端存取](/zh-TW/gateway/remote)

## 頻道已連線，但訊息未流通

如果頻道狀態顯示已連線，但訊息完全無法流通，請著重檢查政策、權限及頻道特定的傳遞規則。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

檢查：

- 私訊政策（`pairing`、`allowlist`、`open`、`disabled`）。
- 群組允許清單與提及要求。
- 缺少的頻道 API 權限／範圍。

常見特徵：

- `mention required` → 訊息因群組提及政策而被忽略。
- `pairing`／等待核准的追蹤記錄 → 傳送者尚未獲得核准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 頻道驗證／權限問題。

相關內容：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [Discord](/zh-TW/channels/discord)
- [Telegram](/zh-TW/channels/telegram)
- [WhatsApp](/zh-TW/channels/whatsapp)

## 排程與心跳偵測傳遞

如果排程或心跳偵測未執行或未傳遞，請先確認排程器狀態，再檢查傳遞目標。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

檢查：

- 排程已啟用，且存在下一次喚醒時間。
- 工作執行歷史狀態（`ok`、`skipped`、`error`）。
- 心跳偵測略過原因（`quiet-hours`、`requests-in-flight`、`cron-in-progress`、`lanes-busy`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `cron: scheduler disabled; jobs will not run automatically` → 排程已停用。
    - `cron: timer tick failed` → 排程器計時週期失敗；請檢查檔案／記錄／執行階段錯誤。
    - `heartbeat skipped` 且 `reason=quiet-hours` → 目前不在作用時段範圍內。
    - `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空白、註解、標題、程式碼圍欄或空白檢查清單框架，因此 OpenClaw 會略過模型呼叫。
    - `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 區塊，但此計時週期沒有任何到期工作。
    - `heartbeat: unknown accountId` → 心跳偵測傳遞目標的帳號 ID 無效。
    - `heartbeat skipped` 且 `reason=dm-blocked` → 心跳偵測目標解析為私訊型目的地，而 `agents.defaults.heartbeat.directPolicy`（或個別代理程式覆寫）設為 `block`。

  </Accordion>
</AccordionGroup>

相關內容：

- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
- [排程工作：疑難排解](/zh-TW/automation/cron-jobs#troubleshooting)

## 節點已配對，但工具失敗

如果節點已配對但工具失敗，請分別確認前景狀態、權限及核准狀態。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

檢查：

- 節點已上線，且具有預期功能。
- 相機／麥克風／位置／螢幕的作業系統權限授予狀態。
- 執行核准與允許清單狀態。

常見特徵：

- `NODE_BACKGROUND_UNAVAILABLE` → 節點應用程式必須位於前景。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少作業系統權限。
- `SYSTEM_RUN_DENIED: approval required` → 執行核准等待中。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令遭允許清單封鎖。

相關內容：

- [執行核准](/zh-TW/tools/exec-approvals)
- [節點疑難排解](/zh-TW/nodes/troubleshooting)
- [節點](/zh-TW/nodes/index)

## 瀏覽器工具失敗

當瀏覽器工具動作失敗，但閘道本身運作正常時使用。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

檢查：

- 是否已設定 `plugins.allow` 且包含 `browser`。
- 瀏覽器執行檔路徑是否有效。
- CDP 設定檔是否可連線。
- `existing-session` / `user` 設定檔是否可使用本機 Chrome。

<AccordionGroup>
  <Accordion title="外掛／執行檔特徵">
    - `unknown command "browser"` 或 `unknown command 'browser'` → `plugins.allow` 排除了內建瀏覽器外掛。
    - 當 `browser.enabled=true` 時瀏覽器工具仍遺失／無法使用 → `plugins.allow` 排除了 `browser`，因此外掛從未載入。
    - `Failed to start Chrome CDP on port` → 瀏覽器程序啟動失敗。
    - `browser.executablePath not found` → 設定的路徑無效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定的 CDP URL 使用不支援的配置，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 設定的 CDP URL 連接埠不正確或超出範圍。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 目前的閘道安裝缺少核心瀏覽器執行階段相依套件；請重新安裝或更新 OpenClaw，然後重新啟動閘道。ARIA 快照與基本頁面螢幕擷取畫面仍可運作，但導覽、AI 快照、使用 CSS 選取器的元素螢幕擷取畫面，以及 PDF 匯出仍無法使用。

  </Accordion>
  <Accordion title="Chrome MCP／現有工作階段特徵">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP 現有工作階段目前無法附加至所選的瀏覽器資料目錄。請開啟瀏覽器檢查頁面、啟用遠端偵錯、保持瀏覽器開啟、核准首次附加提示，然後重試。如果不需要已登入狀態，建議使用受管理的 `openclaw` 設定檔。
    - `No browser tabs found for profile="user"` → Chrome MCP 附加設定檔沒有已開啟的本機 Chrome 分頁。
    - `Remote CDP for profile "<name>" is not reachable` → 無法從閘道主機連線至設定的遠端 CDP 端點。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 僅附加設定檔沒有可連線的目標，或 HTTP 端點有回應，但仍無法開啟 CDP WebSocket。

  </Accordion>
  <Accordion title="元素／螢幕擷取畫面／上傳特徵">
    - `fullPage is not supported for element screenshots` → 螢幕擷取畫面要求將 `--full-page` 與 `--ref` 或 `--element` 混合使用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 螢幕擷取畫面呼叫必須使用頁面擷取或快照的 `--ref`，而不能使用 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上傳鉤子需要快照參照，而非 CSS 選取器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 設定檔上，每次呼叫只能傳送一個上傳檔案。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 設定檔上的對話方塊鉤子不支援逾時覆寫。
    - `existing-session type does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP 現有工作階段設定檔上的 `act:type` 省略 `timeoutMs`；若需要自訂逾時，請使用受管理／CDP 瀏覽器設定檔。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要受管理的瀏覽器或原始 CDP 設定檔。
    - 僅附加或遠端 CDP 設定檔上殘留的檢視區域／深色模式／地區設定／離線覆寫 → 執行 `openclaw browser stop --browser-profile <name>`，關閉作用中的控制工作階段並釋放 Playwright/CDP 模擬狀態，而不必重新啟動整個閘道。

  </Accordion>
</AccordionGroup>

相關內容：

- [瀏覽器（由 OpenClaw 管理）](/zh-TW/tools/browser)
- [瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)

## 如果升級後某項功能突然損壞

大多數升級後的損壞，都是設定漂移或目前開始強制執行更嚴格的預設值所造成。

<AccordionGroup>
  <Accordion title="1. 驗證與 URL 覆寫行為已變更">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    檢查事項：

    - 如果 `gateway.mode=remote`，命令列介面呼叫可能以遠端為目標，而你的本機服務其實正常。
    - 明確使用 `--url` 的呼叫不會備援至已儲存的認證資訊。

    常見特徵：

    - `gateway connect failed:` → URL 目標錯誤。
    - `unauthorized` → 可連線至端點，但驗證錯誤。

  </Accordion>
  <Accordion title="2. 繫結與驗證防護措施更嚴格">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    檢查事項：

    - 非迴路繫結（`lan`、`tailnet`、`custom`）需要有效的閘道驗證路徑：共用權杖／密碼驗證，或正確設定的非迴路 `trusted-proxy` 部署。
    - `gateway.token` 等舊鍵無法取代 `gateway.auth.token`。

    常見特徵：

    - `refusing to bind gateway ... without auth` → 非迴路繫結沒有有效的閘道驗證路徑。
    - 執行階段運作中，但顯示 `Connectivity probe: failed` → 閘道仍在運作，但目前的驗證／URL 無法存取。

  </Accordion>
  <Accordion title="3. 配對與裝置身分狀態已變更">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    檢查事項：

    - 儀表板／節點是否有等待中的裝置核准。
    - 政策或身分變更後，是否有等待中的私訊配對核准。

    常見特徵：

    - `device identity required` → 不符合裝置驗證要求。
    - `pairing required` → 傳送者／裝置必須獲得核准。

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

- [診斷工具](/zh-TW/gateway/doctor)
- [常見問題](/zh-TW/help/faq)
- [閘道操作手冊](/zh-TW/gateway)
