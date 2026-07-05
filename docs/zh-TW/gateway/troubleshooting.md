---
read_when:
    - 疑難排解中心將你導向此處以進行更深入的診斷
    - 你需要穩定、以症狀為基礎且包含精確命令的操作手冊章節
sidebarTitle: Troubleshooting
summary: Gateway、通道、自動化、節點與瀏覽器的深度疑難排解運行手冊
title: 疑難排解
x-i18n:
    generated_at: "2026-07-05T11:25:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1975522afa7eada6b79e7ea4b117e645b0273b506ecf2e071542d820555adff0
    source_path: gateway/troubleshooting.md
    workflow: 16
---

這是深度執行手冊。請先從 [/help/troubleshooting](/zh-TW/help/troubleshooting) 開始，使用快速分診流程。

## 命令階梯

依序執行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康訊號：

- `openclaw gateway status` 顯示 `Runtime: running`、`Connectivity probe: ok`，以及一行 `Capability: ...`。
- `openclaw doctor` 未回報阻塞性的設定/服務問題。
- `openclaw channels status --probe` 顯示每個帳號的即時傳輸狀態，並在支援處顯示 `works` 或 `audit ok`。

## 更新後

用於更新完成但閘道已停用、頻道為空，或模型呼叫失敗並出現 401 時。

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

查看：

- `openclaw status` / `openclaw status --all` 中的 `Update restart`。待處理或失敗的交接會包含下一個要執行的命令。
- Channels 底下的 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`：頻道設定仍存在，但外掛註冊在頻道載入前已失敗。
- 重新驗證後的提供者 401：`openclaw doctor --fix` 會檢查過期的每代理 OAuth 驗證影本並移除舊副本，讓所有代理都解析目前的共用設定檔。

## 分裂腦安裝與較新設定防護

用於閘道服務在更新後意外停止，或記錄顯示某個 `openclaw` 二進位檔比最後寫入 `openclaw.json` 的版本更舊時。

OpenClaw 會使用 `meta.lastTouchedVersion` 標記設定寫入。唯讀命令可以檢查由較新版 OpenClaw 寫入的設定，但處理程序與服務變更會拒絕由較舊二進位檔執行。被阻擋的動作：閘道服務啟動/停止/重新啟動/解除安裝、強制服務重新安裝、服務模式閘道啟動，以及 `gateway --force` 連接埠清理。

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
  <Step title="重新安裝閘道服務">
    從較新的安裝重新安裝預期的閘道服務：

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
僅供刻意降級或緊急復原時使用，為單一命令設定 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。一般操作請保持未設定。
</Warning>

## 回復後的通訊協定不相符

用於降級或回復後，記錄持續列印 `protocol mismatch` 時。較舊的閘道正在執行，但較新的本機用戶端處理程序仍以較舊閘道無法溝通的通訊協定範圍重新連線。

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

查看：

- 閘道記錄中的 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`。
- `openclaw gateway status --deep` 中的 `Established clients:`，或 `openclaw doctor --deep` 中的 `Gateway clients`：連線到閘道連接埠的作用中 TCP 用戶端，在作業系統允許時會附上 PID 與命令列。
- 命令列指向你回復前較新 OpenClaw 安裝或包裝器的用戶端處理程序。

修正：

1. 停止或重新啟動 `gateway status --deep` 顯示的過時 OpenClaw 用戶端處理程序。
2. 重新啟動嵌入 OpenClaw 的應用程式或包裝器：本機儀表板、編輯器、應用程式伺服器輔助工具，或長時間執行的 `openclaw logs --follow` shell。
3. 重新執行 `openclaw gateway status --deep` 或 `openclaw doctor --deep`，確認過時的用戶端 PID 已消失。

不要讓較舊的閘道接受較新的不相容通訊協定。通訊協定升級會保護線上合約；回復復原是處理程序/版本清理問題。

## 技能符號連結因路徑跳脫而略過

用於記錄包含以下內容時：

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

每個技能根目錄都是一個封閉邊界。當 `~/.agents/skills`、`<workspace>/.agents/skills`、`<workspace>/skills` 或 `~/.openclaw/skills` 底下的符號連結實際目標解析到該根目錄外部時，除非目標被明確信任，否則會被略過。

檢查連結：

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

如果目標是刻意設定，請同時設定直接技能根目錄與允許的符號連結目標：

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

接著啟動新工作階段，或等待 skills 監看器重新整理。如果執行中的處理程序早於設定變更，請重新啟動閘道。

不要使用像 `~`、`/` 或整個同步專案資料夾這類寬泛目標。將 `allowSymlinkTargets` 限定在包含受信任 `SKILL.md` 目錄的真實技能根目錄。

如果 Skill Workshop 套用也應寫入這些受信任的符號連結工作區技能路徑，請啟用 `skills.workshop.allowSymlinkTargetWrites`。對唯讀共用技能根目錄保持停用。

相關：

- [Skills 設定](/zh-TW/tools/skills-config#symlinked-skill-roots)
- [設定範例](/zh-TW/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 長上下文需要額外用量

用於記錄/錯誤包含：`HTTP 429: rate_limit_error: Extra usage is required for long context requests` 時。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

查看：

- 選取的 Anthropic 模型是支援 GA 的 1M Claude 4.x 模型（Opus 4.6/4.7/4.8、Sonnet 4.6），或模型設定仍帶有舊版 `params.context1m: true`。
- 目前的 Anthropic 認證不符合長上下文使用資格。
- 請求只在需要 1M 上下文路徑的長工作階段/模型執行中失敗。

修正選項：

<Steps>
  <Step title="使用標準上下文視窗">
    切換到標準視窗模型，或從不支援 1M 上下文 GA 的舊版
    模型設定中移除舊版 `context1m`。
  </Step>
  <Step title="使用符合資格的認證">
    使用符合長上下文請求資格的 Anthropic 認證，或切換到 Anthropic API 金鑰。
  </Step>
  <Step title="設定後援模型">
    設定後援模型，讓 Anthropic 長上下文請求遭拒時執行仍能繼續。
  </Step>
</Steps>

相關：

- [Anthropic](/zh-TW/providers/anthropic)
- [權杖使用與成本](/zh-TW/reference/token-use)
- [為什麼我會看到來自 Anthropic 的 HTTP 429？](/zh-TW/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 上游 403 已封鎖回應

用於上游 LLM 提供者傳回泛用 `403`，例如 `Your request was blocked` 時。

不要假設這一定是 OpenClaw 設定問題。回應可能來自上游安全層，例如 CDN、WAF、機器人管理規則，或位於 OpenAI 相容端點前方的反向 Proxy。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

查看：

- 同一提供者底下多個模型以相同方式失敗。
- HTML 或泛用安全文字，而不是一般提供者 API 錯誤。
- 同一請求時間的提供者端安全事件。
- 極小型直接 `curl` 探測成功，但一般 SDK 形狀的請求失敗。

當證據指向 WAF/CDN 封鎖時，請先修正提供者端篩選。偏好針對 OpenClaw 使用的 API 路徑設定窄範圍允許或略過規則，並避免停用整個站台的保護。

<Warning>
成功的最小 `curl` 不保證真正的 SDK 風格請求會通過相同的上游安全層。
</Warning>

相關：

- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)
- [提供者設定](/zh-TW/providers)
- [記錄](/zh-TW/logging)

## 本機 OpenAI 相容後端通過直接探測，但代理執行失敗

用於：

- `curl ... /v1/models` 可運作。
- 極小型直接 `/v1/chat/completions` 呼叫可運作。
- OpenClaw 模型執行只在一般代理輪次中失敗。

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

查看：

- 直接極小型呼叫成功，但 OpenClaw 執行只在較大提示中失敗。
- 即使直接 `/v1/chat/completions` 使用相同裸模型 ID 可運作，仍出現 `model_not_found` 或 404 錯誤。
- 關於 `messages[].content` 預期為字串的後端錯誤。
- 使用 OpenAI 相容本機後端時，間歇性出現 `incomplete turn detected ... stopReason=stop payloads=0` 警告。
- 只在較大提示權杖數或完整代理執行階段提示中出現的後端當機。

<AccordionGroup>
  <Accordion title="常見特徵">
    - 使用本機 MLX/vLLM 風格伺服器時出現 `model_not_found`：確認 `baseUrl` 包含 `/v1`，`api` 對 `/v1/chat/completions` 後端為 `"openai-completions"`，且 `models.providers.<provider>.models[].id` 是裸提供者本機 ID。選取時加上一次提供者前綴，例如 `mlx/mlx-community/Qwen3-30B-A3B-6bit`；目錄項目保持為 `mlx-community/Qwen3-30B-A3B-6bit`。
    - `messages[...].content: invalid type: sequence, expected a string`：後端拒絕結構化 Chat Completions 內容部分。修正：設定 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
    - `validation.keys` 或允許的訊息鍵如 `["role","content"]`：後端拒絕 Chat Completions 訊息上的 OpenAI 風格重播中繼資料。修正：設定 `models.providers.<provider>.models[].compat.strictMessageKeys: true`。
    - `incomplete turn detected ... stopReason=stop payloads=0`：後端完成了 Chat Completions 請求，但該輪次未傳回使用者可見的助理文字。OpenClaw 會對重播安全的空 OpenAI 相容輪次重試一次；持續失敗通常表示後端正在輸出空白/非文字內容，或抑制最終答案文字。
    - 直接極小型請求成功，但 OpenClaw 代理執行因後端/模型當機而失敗（例如某些 `inferrs` 建置上的 Gemma）：OpenClaw 傳輸可能已正確；後端在較大的代理執行階段提示形狀上失敗。
    - 停用工具後失敗縮小但未消失：工具結構描述是壓力來源之一，但剩餘問題仍是上游模型/伺服器容量或後端錯誤。

  </Accordion>
  <Accordion title="修正選項">
    1. 對僅支援字串的 Chat Completions 後端設定 `compat.requiresStringContent: true`。
    2. 對只接受每則訊息上 `role` 與 `content` 的嚴格 Chat Completions 後端設定 `compat.strictMessageKeys: true`。
    3. 對無法可靠處理 OpenClaw 工具結構描述表面的模型/後端設定 `compat.supportsTools: false`。
    4. 在可行時降低提示壓力：較小的工作區啟動內容、較短的工作階段歷史、較輕量的本機模型，或具備更強長上下文支援的後端。
    5. 如果極小型直接請求持續通過，而 OpenClaw 代理輪次仍在後端內當機，請將其視為上游伺服器/模型限制，並在該處以被接受的酬載形狀提交重現案例。
  </Accordion>
</AccordionGroup>

相關：

- [設定](/zh-TW/gateway/configuration)
- [本機模型](/zh-TW/gateway/local-models)
- [OpenAI 相容端點](/zh-TW/gateway/configuration-reference#openai-compatible-endpoints)

## 無回覆

如果頻道已啟用但沒有任何回應，請先檢查路由與政策，再重新連線任何項目。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

查看：

- DM 傳送者的配對待處理。
- 群組提及門控（`requireMention`、`mentionPatterns`）。
- 頻道/群組允許清單不相符。

常見特徵：

- `drop guild message (mention required` → 群組訊息會被忽略，直到提及為止。
- `pairing request` → 傳送者需要核准。
- `blocked` / `allowlist` → 傳送者/頻道已被政策篩選。

相關：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
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

查看：

- 正確的探測 URL 與儀表板 URL。
- 用戶端與閘道之間的驗證模式/權杖不相符。
- 在需要裝置身分時使用 HTTP。

如果更新後本機瀏覽器無法連線至 `127.0.0.1:18789`，請先復原本機閘道服務，並確認它正在提供儀表板：

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

如果 `curl` 傳回 OpenClaw HTML，表示閘道正在運作，剩下的問題很可能是瀏覽器快取、舊的深層連結或過期的分頁狀態。直接開啟 `http://127.0.0.1:18789`，並從儀表板瀏覽。如果重新啟動後服務沒有保持執行，請執行 `openclaw gateway start`，再重新檢查 `openclaw gateway status`。

<AccordionGroup>
  <Accordion title="連線 / 驗證特徵">
    - `device identity required` → 非安全情境或缺少裝置驗證。
    - `origin not allowed` → 瀏覽器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或你是從非 loopback 瀏覽器來源連線，且沒有明確的允許清單）。
    - `device nonce required` / `device nonce mismatch` → 用戶端未完成基於挑戰的裝置驗證流程（`connect.challenge` + `device.nonce`）。
    - `device signature invalid` / `device signature expired` → 用戶端針對目前握手簽署了錯誤的承載（或過期的時間戳）。
    - `AUTH_TOKEN_MISMATCH` 搭配 `canRetryWithDeviceToken=true` → 用戶端可以使用快取的裝置權杖進行一次受信任的重試。
    - 該快取權杖重試會重用與已配對裝置權杖一併儲存的快取範圍集。明確的 `deviceToken` / 明確的 `scopes` 呼叫者則會保留其要求的範圍集。
    - `AUTH_SCOPE_MISMATCH` → 裝置權杖已被辨識，但其已核准範圍未涵蓋此連線要求；請重新配對或核准要求的範圍合約，而不是輪替共用閘道權杖。
    - 在該重試路徑之外，連線驗證優先順序為：先明確共用權杖/密碼，接著明確 `deviceToken`，再接著已儲存的裝置權杖，最後是 bootstrap 權杖。
    - 在非同步 Tailscale Serve 控制 UI 路徑上，同一個 `{scope, ip}` 的失敗嘗試會在限制器記錄失敗之前被序列化。因此，來自同一用戶端的兩次並行錯誤重試，第二次嘗試可能會顯示 `retry later`，而不是兩次單純不相符。
    - 瀏覽器來源 loopback 用戶端出現 `too many failed authentication attempts (retry later)` → 來自同一個正規化 `Origin` 的重複失敗會暫時鎖定；另一個 localhost 來源會使用獨立的儲存區。
    - 該重試後仍重複出現 `unauthorized` → 共用權杖/裝置權杖漂移；重新整理權杖設定，並視需要重新核准/輪替裝置權杖。
    - `gateway connect failed:` → host/port/url 目標錯誤。

  </Accordion>
</AccordionGroup>

### 驗證詳細代碼快速對照

使用失敗 `connect` 回應中的 `error.details.code` 來選擇下一步動作：

| 詳細代碼                  | 意義                                                                                                                                                                                      | 建議動作                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 用戶端未傳送必要的共用權杖。                                                                                                                                                 | 在用戶端貼上/設定權杖後重試。對於儀表板路徑：`openclaw config get gateway.auth.token`，然後貼到控制 UI 設定中。                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 共用權杖與閘道驗證權杖不相符。                                                                                                                                               | 如果 `canRetryWithDeviceToken=true`，允許一次受信任的重試。快取權杖重試會重用已儲存的已核准範圍；明確的 `deviceToken` / `scopes` 呼叫者保留要求的範圍。若仍失敗，請執行[權杖漂移復原檢查清單](/zh-TW/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 快取的每裝置權杖已過期或已撤銷。                                                                                                                                                 | 使用[裝置命令列介面](/zh-TW/cli/devices)輪替/重新核准裝置權杖，然後重新連線。                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | 裝置權杖有效，但其已核准角色/範圍未涵蓋此連線要求。                                                                                                       | 重新配對裝置或核准要求的範圍合約；不要將此視為共用權杖漂移。                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | 裝置身分需要核准。檢查 `error.details.reason` 是否為 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，並在存在時使用 `requestId` / `remediationHint`。 | 核准待處理要求：`openclaw devices list`，然後 `openclaw devices approve <requestId>`。範圍/角色升級會在你審查要求的存取權後使用相同流程。                                                                                                               |

<Note>
使用共用閘道權杖/密碼驗證的直接 loopback 後端 RPC，不應依賴命令列介面的已配對裝置範圍基準。如果子代理或其他內部呼叫仍以 `scope-upgrade` 失敗，請確認呼叫者正在使用 `client.id: "gateway-client"` 和 `client.mode: "backend"`，且沒有強制明確的 `deviceIdentity` 或裝置權杖。
</Note>

裝置驗證 v2 遷移檢查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果記錄顯示 nonce/簽章錯誤，請更新連線用戶端並驗證它：

<Steps>
  <Step title="等待 connect.challenge">
    用戶端等待閘道發出的 `connect.challenge`。
  </Step>
  <Step title="簽署承載">
    用戶端簽署綁定挑戰的承載。
  </Step>
  <Step title="傳送裝置 nonce">
    用戶端使用相同挑戰 nonce 傳送 `connect.params.device.nonce`。
  </Step>
</Steps>

如果 `openclaw devices rotate` / `revoke` / `remove` 意外遭拒：

- 已配對裝置權杖工作階段只能管理**自己的**裝置，除非呼叫者也具有 `operator.admin`。
- `openclaw devices rotate --scope ...` 只能要求呼叫者工作階段已持有的操作員範圍。

相關：

- [設定](/zh-TW/gateway/configuration)（閘道驗證模式）
- [控制 UI](/zh-TW/web/control-ui)
- [裝置](/zh-TW/cli/devices)
- [遠端存取](/zh-TW/gateway/remote)
- [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)

## 閘道服務未執行

在服務已安裝但程序無法保持執行時使用。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 也掃描系統層級服務
```

查看：

- `Runtime: stopped` 搭配結束提示。
- 服務設定不相符（`Config (cli)` vs `Config (service)`）。
- 連接埠/監聽器衝突。
- 使用 `--deep` 時的額外 launchd/systemd/schtasks 安裝。
- `Other gateway-like services detected (best effort)` 清理提示。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 本機閘道模式未啟用，或設定檔遭覆寫並遺失 `gateway.mode`。修正：在你的設定中設定 `gateway.mode="local"`，或重新執行 `openclaw onboard --mode local` / `openclaw setup` 以重新標記預期的本機模式設定。如果你透過 Podman 執行 OpenClaw，預設設定路徑為 `~/.openclaw/openclaw.json`。
    - `refusing to bind gateway ... without auth` → 沒有有效閘道驗證路徑（權杖/密碼，或已設定的受信任代理）時，嘗試繫結非 loopback。
    - `another gateway instance is already listening` / `EADDRINUSE` → 連接埠衝突。
    - `Other gateway-like services detected (best effort)` → 存在過期或並行的 launchd/systemd/schtasks 單元。大多數設定應讓每台機器只保留一個閘道；如果你確實需要多個，請隔離連接埠 + 設定/狀態/工作區。請參閱 [/gateway#multiple-gateways-same-host](/zh-TW/gateway#multiple-gateways-same-host)。
    - doctor 顯示 `System-level OpenClaw gateway service detected` → 使用者層級服務缺失時，存在 systemd 系統單元。在允許 doctor 安裝使用者服務前，請移除或停用重複項；如果系統單元是預期的監督器，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。
    - `Gateway service port does not match current gateway config` → 已安裝的監督器仍固定舊的 `--port`。執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，然後重新啟動閘道服務。

  </Accordion>
</AccordionGroup>

相關：

- [背景執行與程序工具](/zh-TW/gateway/background-process)
- [設定](/zh-TW/gateway/configuration)
- [Doctor](/zh-TW/gateway/doctor)

## macOS 閘道靜默停止回應，然後在你碰觸儀表板時恢復

當 macOS 主機上的頻道（Telegram、WhatsApp 等）一次安靜數分鐘到數小時，而你一開啟控制 UI、透過 SSH 連入或以其他方式與主機互動時，閘道似乎立刻恢復，就使用此項。`openclaw status` 通常不會有明顯症狀，因為等你查看時閘道已經再次存活。

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

查看：

- `~/.openclaw/logs/stability/` 中一個或多個 `*-uncaught_exception.json` 套件，且 `error.code` 設為暫時性網路代碼，例如 `ENETDOWN`、`ENETUNREACH`、`EHOSTUNREACH` 或 `ECONNREFUSED`。
- `pmset -g log` 行，例如 `Entering Sleep state due to 'Maintenance Sleep'` 或 `en0 driver is slow (msg: WillChangeState to 0)`，且與當機時間戳記對齊。Power Nap / Maintenance Sleep 會短暫將 Wi-Fi 驅動程式置於狀態 0；任何剛好落在該時間窗內的對外 `connect()`，即使主機其他時候具備完整網路連線能力，也可能因 `ENETDOWN` 失敗。
- `launchctl print` 輸出顯示 `state = not running`，且近期有多次 `runs` 與結束代碼，尤其是當機與下一次啟動之間的間隔約為一小時而非幾秒時。macOS launchd 會在一波當機後套用未公開文件記載的重生保護閘門，可能停止遵守 `KeepAlive=true`，直到互動式登入、儀表板連線或 `launchctl kickstart` 等外部觸發重新啟用它。

常見特徵：

- 穩定性套件的 `error.code` 為 `ENETDOWN` 或同類代碼，呼叫堆疊指向 節點 `net` `lookupAndConnect` / `Socket.connect`。OpenClaw `2026.5.26` 與更新版本會將這些歸類為良性的暫時性網路錯誤，因此不再傳播到最上層未捕捉處理器；如果你使用的是較舊版本，請先升級。
- 長時間安靜期在你連線到 Control UI 或透過 SSH 進入主機的瞬間結束：重新啟用 launchd 重生閘門的是使用者可見活動，而不是儀表板對閘道做了什麼。
- `runs` 計數在一天中持續增加，但 `~/Library/Logs/openclaw/gateway.log` 中沒有對應的 `received SIG*; shutting down` 行：乾淨關機會記錄訊號；暫時性當機則不會。

處理方式：

1. 如果你執行的是 `2026.5.26` 以前的版本，請**升級閘道**。升級後，未來的 `ENETDOWN` 錯誤會記錄為警告，而不是終止程序。
2. 在預期作為常開伺服器執行的 Mac mini / 桌上型主機上，**減少維護睡眠活動**：

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   這會大幅減少但無法完全消除底層驅動程式抖動。無論這些旗標如何設定，系統仍可能為 TCP keepalive 與 mDNS 維護執行部分維護睡眠。

3. **新增存活看門狗**，讓未來被 launchd 停放的一波當機能快速被捕捉：

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   重點是從外部重新啟用重生閘門；在 macOS 上，一波當機後僅靠 `KeepAlive=true` 並不足夠。

相關：

- [macOS 平台備註](/zh-TW/platforms/macos)
- [記錄](/zh-TW/logging)
- [Doctor](/zh-TW/gateway/doctor)

## 閘道在高記憶體使用期間結束

當閘道在負載下消失、監督程式回報 OOM 風格重新啟動，或記錄提到 `critical memory pressure bundle written` 時使用。

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

尋找：

- 最新穩定性套件中的 `Reason: diagnostic.memory.pressure.critical`。
- `Memory pressure:` 搭配 `critical/rss_threshold`、`critical/heap_threshold` 或 `critical/rss_growth`。
- 接近堆積限制的 `V8 heap:` 值。
- `Largest session files:` 項目，例如 `agents/<agent>/sessions/<session>.jsonl` 或 `sessions/<session>.jsonl`。
- 當閘道在容器或記憶體受限服務內執行時的 Linux cgroup 記憶體計數器。

常見特徵：

- `critical memory pressure bundle written` 在重新啟動前不久出現 → OpenClaw 擷取了 OOM 前穩定性套件。使用 `openclaw gateway stability --bundle latest` 檢查它。
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` 出現在閘道記錄中 → OpenClaw 偵測到臨界記憶體壓力，但 OOM 前穩定性快照已關閉。
- `Largest session files:` 指向非常大的已遮蔽逐字稿路徑 → 減少保留的工作階段歷程、檢查工作階段成長，或在重新啟動前將舊逐字稿移出作用中儲存區。
- `V8 heap:` 已使用位元組接近堆積限制 → 降低提示/工作階段壓力、減少並行工作，或僅在確認工作負載符合預期後提高 節點 堆積限制。
- `Memory pressure: critical/rss_growth` → 記憶體在單一取樣時間窗內快速成長。檢查最新記錄是否有大型匯入、失控工具輸出、重複重試，或一批排入佇列的代理工作。
- 記錄中出現臨界記憶體壓力但沒有套件存在 → 這是預設值。設定 `diagnostics.memoryPressureSnapshot: true`，以便在未來臨界記憶體壓力事件中擷取 OOM 前穩定性套件。

穩定性套件不含承載內容。它包含操作記憶體證據與已遮蔽的相對檔案路徑，不包含訊息文字、網路鉤子本文、憑證、權杖、Cookie 或原始工作階段 ID。請將診斷匯出附加到錯誤報告，而不是複製原始記錄。

相關：

- [閘道健康狀態](/zh-TW/gateway/health)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [工作階段](/zh-TW/cli/sessions)

## 閘道拒絕無效設定

當閘道啟動失敗並顯示 `Invalid config`，或熱重新載入記錄顯示它略過無效編輯時使用。

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
- 作用中設定旁帶時間戳記的 `openclaw.json.rejected.*` 檔案。
- 如果 `doctor --fix` 修復了損壞的直接編輯，則會有帶時間戳記的 `openclaw.json.clobbered.*` 檔案。
- OpenClaw 會為每個設定路徑保留最新 32 個 `.clobbered.*` 檔案，並輪替較舊檔案。

<AccordionGroup>
  <Accordion title="發生了什麼">
    - 設定在啟動、熱重新載入或 OpenClaw 擁有的寫入期間未通過驗證。
    - 閘道啟動會關閉失敗，而不是重寫 `openclaw.json`。
    - 熱重新載入會略過無效的外部編輯，並保持目前的執行階段設定作用中。
    - OpenClaw 擁有的寫入會在提交前拒絕無效/破壞性承載，並儲存 `.rejected.*`。
    - `openclaw doctor --fix` 擁有修復。它可以移除非 JSON 前綴，或還原最後已知良好副本，同時將被拒絕的承載保留為 `.clobbered.*`。
    - 當同一設定路徑發生多次修復時，OpenClaw 會輪替較舊的 `.clobbered.*` 檔案，讓最新修復的承載仍可取得。

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
    - `.clobbered.*` 存在 → doctor 在修復作用中設定時保留了損壞的外部編輯。
    - `.rejected.*` 存在 → OpenClaw 擁有的設定寫入在提交前未通過結構描述或覆寫檢查。
    - `Config write rejected:` → 寫入嘗試丟棄必要形狀、大幅縮小檔案，或持久化無效設定。
    - `config reload skipped (invalid config):` → 直接編輯未通過驗證，且被執行中的閘道忽略。
    - `Invalid config at ...` → 啟動在閘道服務開機前失敗。
    - `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → OpenClaw 擁有的寫入因相較於最後已知良好備份遺失欄位或大小而被拒絕。
    - `Config last-known-good promotion skipped` → 候選項包含已遮蔽的秘密預留位置，例如 `***`。

  </Accordion>
  <Accordion title="修復選項">
    1. 執行 `openclaw doctor --fix`，讓 doctor 修復帶前綴/被覆寫的設定，或還原最後已知良好版本。
    2. 只從 `.clobbered.*` 或 `.rejected.*` 複製預期的鍵，然後用 `openclaw config set` 或 `config.patch` 套用。
    3. 重新啟動前執行 `openclaw config validate`。
    4. 如果你手動編輯，請保留完整 JSON5 設定，而不是只保留你想變更的部分物件。
  </Accordion>
</AccordionGroup>

相關：

- [設定](/zh-TW/cli/config)
- [設定：熱重新載入](/zh-TW/gateway/configuration#config-hot-reload)
- [設定：嚴格驗證](/zh-TW/gateway/configuration#strict-validation)
- [Doctor](/zh-TW/gateway/doctor)

## 閘道探測警告

當 `openclaw gateway probe` 連到某個項目，但仍列印警告區塊時使用。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

尋找：

- JSON 輸出中的 `warnings[].code` 與 `primaryTargetId`。
- 警告是關於 SSH 備援、多個閘道、缺少範圍，還是未解析的 auth refs。

常見特徵：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 設定失敗，但命令仍嘗試直接設定/loopback 目標。
- `multiple reachable gateway identities detected` → 不同閘道回應，或 OpenClaw 無法證明可到達目標是同一個閘道。指向同一閘道的 SSH 通道、代理 URL 或已設定遠端 URL，會被視為一個具有多種傳輸的閘道，即使傳輸連接埠不同。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 連線成功，但詳細 RPC 受範圍限制；配對裝置身分，或使用具有 `operator.read` 的憑證。
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 連線成功，但完整診斷 RPC 集逾時或失敗。將此視為可到達但診斷降級的閘道；比較 `--json` 輸出中的 `connect.ok` 與 `connect.rpcOk`。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → 閘道已回應，但此用戶端在正常操作員存取前仍需要配對/核准。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文字 → 此命令路徑中，失敗目標的驗證材料無法取得。

相關：

- [閘道](/zh-TW/cli/gateway)
- [同一主機上的多個閘道](/zh-TW/gateway#multiple-gateways-same-host)
- [遠端存取](/zh-TW/gateway/remote)

## 頻道已連線，但訊息未流動

如果頻道狀態為已連線但訊息流已停擺，請聚焦於政策、權限與頻道特定的傳遞規則。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

尋找：

- 私訊政策（`pairing`、`allowlist`、`open`、`disabled`）。
- 群組允許清單與提及要求。
- 缺少頻道 API 權限/範圍。

常見特徵：

- `mention required` → 訊息被群組提及政策忽略。
- `pairing` / 待核准追蹤 → 寄件者未核准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 頻道驗證/權限問題。

相關：

- [頻道疑難排解](/zh-TW/channels/troubleshooting)
- [Discord](/zh-TW/channels/discord)
- [Telegram](/zh-TW/channels/telegram)
- [WhatsApp](/zh-TW/channels/whatsapp)

## 排程與心跳偵測傳遞

如果排程或心跳偵測未執行或未傳遞，請先驗證排程器狀態，再驗證傳遞目標。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

尋找：

- 排程已啟用且下一次喚醒存在。
- 工作執行歷程狀態 (`ok`, `skipped`, `error`)。
- 心跳偵測略過原因 (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)。

<AccordionGroup>
  <Accordion title="常見特徵">
    - `cron: scheduler disabled; jobs will not run automatically` → 排程已停用。
    - `cron: timer tick failed` → 排程器 tick 失敗；檢查檔案、日誌或執行階段錯誤。
    - `heartbeat skipped` 搭配 `reason=quiet-hours` → 位於有效時段範圍之外。
    - `heartbeat skipped` 搭配 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空白、註解、標頭、圍欄或空檢查清單架構，因此 OpenClaw 會略過模型呼叫。
    - `heartbeat skipped` 搭配 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 區塊，但此 tick 沒有任何工作到期。
    - `heartbeat: unknown accountId` → 心跳偵測傳送目標的帳戶 ID 無效。
    - `heartbeat skipped` 搭配 `reason=dm-blocked` → 心跳偵測目標解析為 DM 樣式目的地，而 `agents.defaults.heartbeat.directPolicy`（或各代理程式覆寫）設定為 `block`。

  </Accordion>
</AccordionGroup>

相關：

- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
- [排程工作：疑難排解](/zh-TW/automation/cron-jobs#troubleshooting)

## 節點已配對，工具失敗

如果節點已配對但工具失敗，請隔離前景、權限和核准狀態。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

尋找：

- 節點在線上且具備預期功能。
- 相機、麥克風、位置和螢幕的作業系統權限授予。
- Exec 核准與 allowlist 狀態。

常見特徵：

- `NODE_BACKGROUND_UNAVAILABLE` → 節點應用程式必須位於前景。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少作業系統權限。
- `SYSTEM_RUN_DENIED: approval required` → Exec 核准待處理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被 allowlist 封鎖。

相關：

- [Exec 核准](/zh-TW/tools/exec-approvals)
- [節點疑難排解](/zh-TW/nodes/troubleshooting)
- [節點](/zh-TW/nodes/index)

## 瀏覽器工具失敗

當瀏覽器工具動作失敗，但閘道本身正常時使用。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

尋找：

- `plugins.allow` 是否已設定且包含 `browser`。
- 有效的瀏覽器可執行檔路徑。
- CDP 設定檔可連通性。
- `existing-session` / `user` 設定檔的本機 Chrome 可用性。

<AccordionGroup>
  <Accordion title="外掛 / 可執行檔特徵">
    - `unknown command "browser"` 或 `unknown command 'browser'` → 內建瀏覽器外掛被 `plugins.allow` 排除。
    - 瀏覽器工具缺少 / 無法使用且 `browser.enabled=true` → `plugins.allow` 排除 `browser`，因此外掛從未載入。
    - `Failed to start Chrome CDP on port` → 瀏覽器程序啟動失敗。
    - `browser.executablePath not found` → 設定的路徑無效。
    - `browser.cdpUrl must be http(s) or ws(s)` → 設定的 CDP URL 使用不支援的配置，例如 `file:` 或 `ftp:`。
    - `browser.cdpUrl has invalid port` → 設定的 CDP URL 具有錯誤或超出範圍的連接埠。
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 目前的閘道安裝缺少核心瀏覽器執行階段相依性；重新安裝或更新 OpenClaw，然後重新啟動閘道。ARIA 快照和基本頁面螢幕截圖仍可運作，但導覽、AI 快照、CSS 選擇器元素螢幕截圖和 PDF 匯出仍無法使用。

  </Accordion>
  <Accordion title="Chrome MCP / existing-session 特徵">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 尚無法附加至所選的瀏覽器資料目錄。開啟瀏覽器檢查頁面、啟用遠端除錯、保持瀏覽器開啟、核准第一次附加提示，然後重試。如果不需要登入狀態，請優先使用受管理的 `openclaw` 設定檔。
    - `No browser tabs found for profile="user"` → Chrome MCP 附加設定檔沒有開啟的本機 Chrome 分頁。
    - `Remote CDP for profile "<name>" is not reachable` → 設定的遠端 CDP 端點無法從閘道主機連通。
    - `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 僅附加設定檔沒有可連通的目標，或 HTTP 端點有回應，但 CDP WebSocket 仍無法開啟。

  </Accordion>
  <Accordion title="元素 / 螢幕截圖 / 上傳特徵">
    - `fullPage is not supported for element screenshots` → 螢幕截圖要求將 `--full-page` 與 `--ref` 或 `--element` 混用。
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 螢幕截圖呼叫必須使用頁面擷取或快照 `--ref`，而非 CSS `--element`。
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上傳鉤子需要快照 ref，而非 CSS 選擇器。
    - `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 設定檔上每次呼叫傳送一個上傳。
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 設定檔上的對話方塊鉤子不支援逾時覆寫。
    - `existing-session type does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP existing-session 設定檔上的 `act:type` 省略 `timeoutMs`，或在需要自訂逾時時使用受管理/CDP 瀏覽器設定檔。
    - `existing-session evaluate does not support timeoutMs overrides.` → 對 `profile="user"` / Chrome MCP existing-session 設定檔上的 `act:evaluate` 省略 `timeoutMs`，或在需要自訂逾時時使用受管理/CDP 瀏覽器設定檔。
    - `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要受管理瀏覽器或原始 CDP 設定檔。
    - 僅附加或遠端 CDP 設定檔上的過期 viewport / dark-mode / locale / offline 覆寫 → 執行 `openclaw browser stop --browser-profile <name>` 以關閉作用中的控制工作階段並釋放 Playwright/CDP 模擬狀態，而不必重新啟動整個閘道。

  </Accordion>
</AccordionGroup>

相關：

- [瀏覽器（OpenClaw 管理）](/zh-TW/tools/browser)
- [瀏覽器疑難排解](/zh-TW/tools/browser-linux-troubleshooting)

## 如果你升級後某些東西突然壞掉

大多數升級後故障都是設定漂移，或現在開始強制執行更嚴格的預設值。

<AccordionGroup>
  <Accordion title="1. 驗證與 URL 覆寫行為已變更">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    要檢查的項目：

    - 如果 `gateway.mode=remote`，命令列介面呼叫可能會指向遠端，而你的本機服務正常。
    - 明確的 `--url` 呼叫不會退回使用已儲存的認證。

    常見特徵：

    - `gateway connect failed:` → URL 目標錯誤。
    - `unauthorized` → 端點可連通，但驗證錯誤。

  </Accordion>
  <Accordion title="2. 綁定與驗證防護規則更嚴格">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    要檢查的項目：

    - 非 loopback 綁定（`lan`、`tailnet`、`custom`）需要有效的閘道驗證路徑：共享權杖/密碼驗證，或正確設定的非 loopback `trusted-proxy` 部署。
    - 舊金鑰如 `gateway.token` 不會取代 `gateway.auth.token`。

    常見特徵：

    - `refusing to bind gateway ... without auth` → 非 loopback 綁定沒有有效的閘道驗證路徑。
    - `Connectivity probe: failed` 且執行階段正在執行 → 閘道仍存活，但使用目前的驗證/URL 無法存取。

  </Accordion>
  <Accordion title="3. 配對與裝置身分狀態已變更">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    要檢查的項目：

    - 儀表板/節點的待處理裝置核准。
    - 政策或身分變更後的待處理 DM 配對核准。

    常見特徵：

    - `device identity required` → 裝置驗證未滿足。
    - `pairing required` → 傳送者/裝置必須核准。

  </Accordion>
</AccordionGroup>

如果檢查後服務設定與執行階段仍不一致，請從相同的設定檔/狀態目錄重新安裝服務中繼資料：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相關：

- [驗證](/zh-TW/gateway/authentication)
- [背景 Exec 與程序工具](/zh-TW/gateway/background-process)
- [閘道擁有的配對](/zh-TW/gateway/pairing)

## 相關

- [Doctor](/zh-TW/gateway/doctor)
- [FAQ](/zh-TW/help/faq)
- [閘道 Runbook](/zh-TW/gateway)
