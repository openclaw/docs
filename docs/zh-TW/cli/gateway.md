---
read_when:
    - 從命令列介面執行閘道（開發環境或伺服器）
    - 偵錯閘道驗證、繫結模式與連線能力
    - 透過 Bonjour 探索閘道（區域網路 + 廣域 DNS-SD）
    - 整合外部閘道程序監督器
sidebarTitle: Gateway
summary: OpenClaw 閘道命令列介面（`openclaw gateway`）— 執行、查詢及探索閘道
title: 閘道
x-i18n:
    generated_at: "2026-07-21T08:58:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0188d7c79571ebf8f350295775625533a83cb2eb909bcc8763e8ce81806d2214
    source_path: cli/gateway.md
    workflow: 16
---

閘道是 OpenClaw 的 WebSocket 伺服器（頻道、節點、工作階段、鉤子）。以下所有子命令都位於 `openclaw gateway ...` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour 探索" href="/zh-TW/gateway/bonjour">
    本機 mDNS + 廣域 DNS-SD 設定。
  </Card>
  <Card title="探索概覽" href="/zh-TW/gateway/discovery">
    OpenClaw 如何宣告並尋找閘道。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration">
    頂層閘道設定鍵。
  </Card>
</CardGroup>

## 執行閘道

```bash
openclaw gateway
openclaw gateway run   # 等效的明確形式
```

<AccordionGroup>
  <Accordion title="啟動行為">
    - 除非已在 `~/.openclaw/openclaw.json` 中設定 `gateway.mode=local`，否則拒絕啟動。臨時／開發執行請使用 `--allow-unconfigured`；它會略過此防護，而不寫入或修復設定。
    - 啟動時若發現可修復的無效設定，互動式終端會提議執行 `openclaw doctor --fix`，並在取得同意後重試啟動一次。非互動式執行絕不會自動修復；而是印出該命令。若修復後的設定仍然無效，啟動會維持停止狀態。
    - `openclaw onboard --mode local` 和 `openclaw setup` 會寫入 `gateway.mode=local`。若設定檔存在但缺少 `gateway.mode`，會將其視為已損壞／遭覆寫的設定，且閘道會拒絕替你猜測 `local`——請重新執行新手引導、手動設定該鍵，或傳入 `--allow-unconfigured`。
    - 系統會阻止在沒有驗證的情況下繫結至迴路介面以外的位置。
    - `--bind` 的值 `lan`、`tailnet` 和 `custom` 目前會透過僅限 IPv4 的路徑解析；僅限 IPv6 的自備主機設定需要在閘道前方配置 IPv4 邊車或代理。
    - `SIGUSR1` 在獲得授權時會觸發程序內重新啟動。`commands.restart`（預設：啟用）會管控外部傳送的 `SIGUSR1`；將其設為 `false` 可阻止手動作業系統訊號重新啟動。代理程式使用的 `gateway` 工具是唯讀的；代理程式會透過經人員核准的 `openclaw` 委派工具要求重新啟動。
    - `SIGINT`/`SIGTERM` 會停止程序，但不會還原自訂終端狀態——若你使用終端介面或原始模式輸入包裝命令列介面，請在結束前自行還原終端。

  </Accordion>
</AccordionGroup>

### 選項

<ParamField path="--port <port>" type="number">
  WebSocket 連接埠（預設值來自設定／環境；通常為 `18789`）。
</ParamField>
<ParamField path="--bind <mode>" type="string">
  繫結模式：`loopback`（預設）、`lan`、`tailnet`、`auto`、`custom`。
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` 的共用權杖。若已設定，預設為 `OPENCLAW_GATEWAY_TOKEN`。
</ParamField>
<ParamField path="--auth <mode>" type="string">
  驗證模式：`none`、`token`、`password`、`trusted-proxy`。
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` 的密碼。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  從檔案讀取閘道密碼。
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale 公開模式：`off`、`serve`、`funnel`。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  關閉時重設 Tailscale serve/funnel 設定。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  啟動時不強制要求 `gateway.mode=local`。僅供臨時／開發啟動；不會保存或修復設定。
</ParamField>
<ParamField path="--dev" type="boolean">
  若缺少開發設定與工作區，則建立它們（略過 `BOOTSTRAP.md`）。
</ParamField>
<ParamField path="--dev-ambient-channels" type="boolean">
  允許開發用閘道從環境中的環境變數自動設定頻道。需要 `--dev`。
</ParamField>
<ParamField path="--reset" type="boolean">
  重設開發設定、認證資訊、工作階段和工作區。需要 `--dev`。
</ParamField>
<ParamField path="--force" type="boolean">
  啟動前終止目標連接埠上任何現有的監聽器。在非互動式殼層中，此選項會拒絕終止已驗證的閘道監聽器；請改用 `--dev`，或使用具備可用連接埠的隔離 `--profile`。
</ParamField>
<ParamField path="--verbose" type="boolean">
  將詳細記錄輸出至 stdout/stderr。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  僅在主控台顯示命令列介面後端記錄（也會啟用 stdout/stderr）。
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket 記錄樣式：`auto`、`full`、`compact`。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` 的別名。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  將原始模型串流事件記錄至 JSONL。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  原始串流 JSONL 路徑。
</ParamField>

`--claude-cli-logs` 是 `--cli-backend-logs` 的已棄用別名。

對於 `--bind custom`，請將 `gateway.customBindHost` 設為 IPv4 位址。除了 `127.0.0.1` 或 `0.0.0.0` 以外的任何位址，也要求同一主機的用戶端在相同連接埠上使用 `127.0.0.1`；若任一監聽器無法繫結，啟動就會失敗。萬用字元 `0.0.0.0` 不會新增另一個必要別名。僅限 IPv6 的自備主機設定需要在閘道前方配置 IPv4 邊車或代理。

## 重新啟動閘道

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` 會要求執行中的閘道預先檢查進行中的工作，並排程在工作清空後執行一次合併的重新啟動。等待上限為 5 分鐘；超過時間配額時會強制重新啟動。`--safe` 無法與 `--force` 或 `--wait` 搭配使用。

`--skip-deferral` 會在安全重新啟動時略過進行中工作的延後關卡，因此即使回報有阻擋因素，閘道仍會立即重新啟動。此選項需要 `--safe`——當延後流程卡在失控的工作時使用。

`--wait <duration>` 會覆寫一般（非安全）重新啟動的清空時間配額。可接受純毫秒值或單位後綴 `ms`、`s`、`m`、`h`、`d`（例如 `30s`、`5m`、`1h30m`）；`--wait 0` 會無限期等待。不可與 `--force` 或 `--safe` 搭配使用。

`--force` 會略過進行中工作的清空程序並立即重新啟動。一般的 `restart`（不含旗標）會保留現有服務管理員的重新啟動行為。

<Warning>
行內 `--password` 可能會顯示在本機程序清單中。請優先使用 `--password-file`、環境變數，或由 SecretRef 支援的 `gateway.auth.password`。
</Warning>

### 外部監督程式

僅當另一個程序管理員負責閘道生命週期時，才設定 `OPENCLAW_SUPERVISOR_MODE=external`。在此模式下：

- `openclaw gateway restart` 會保留現有的安全、強制及限定等待行為，同時以已驗證且正在執行的閘道為目標，而非 launchd、systemd 或 Task Scheduler。
- 系統會拒絕原生服務的安裝、啟動、停止及解除安裝作業，並指引使用外部監督程式。
- 系統會拒絕 OpenClaw 自我更新，讓監督程式可以停止閘道、替換並完成執行階段，然後安全地重新啟動。
- 全新程序重新啟動會在乾淨結束前寫入有界限的 SQLite 交接資料。若保存失敗，閘道會退回程序內重新啟動，而不是在沒有可供取用的交接資料時結束。

`OPENCLAW_SERVICE_REPAIR_POLICY=external` 仍是獨立的 Doctor 修復原則。它不會宣告執行階段的所有權；需要這兩種行為的監督程式應同時設定這兩個變數。

外部監督程式可透過以下隱藏的機器合約協商並取用重新啟動交接資料：

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

協定版本 `1` 支援 `consume` 作業。取用程序會在單一立即 SQLite 交易中驗證預期 PID 與有界限的交接欄位。已接受的交接資料會在傳回成功結果前刪除，因此並行或重播的取用者無法同時接受它。PID 不相符的資料會保留給相符的擁有者；缺少、過期及無效的資料列不會授權重新啟動。

有效的機器要求會傳回 JSON，結束碼為 `0`，包括不會重新啟動的結果。無效引數會傳回 `reason: "invalid-expected-pid"`，結束碼為 `2`；狀態儲存區失敗會傳回 `reason: "store-unavailable"`，結束碼為 `1`。監督程式應在其確切會使用的執行階段或啟動器上探查 `capabilities`，而不是根據 OpenClaw 版本字串推斷支援情況，或直接讀取私有 SQLite 結構描述。

### 閘道效能分析

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 會記錄啟動期間各階段的計時，包括每個階段的 `eventLoopMax` 延遲，以及外掛查找表的計時（已安裝索引、資訊清單登錄、啟動規劃、擁有者對應工作）。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` 會記錄重新啟動範圍的 `restart trace:` 行：訊號處理、進行中工作清空、關閉階段、下次啟動、就緒計時及記憶體指標。
- `OPENCLAW_DIAGNOSTICS=timeline` 搭配 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` 會為外部 QA 測試框架寫入盡力而為的 JSONL 啟動診斷時間軸（等同於設定 `diagnostics.flags: ["timeline"]`；路徑仍只能透過環境變數設定）。加入 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件迴圈取樣。
- 先執行 `pnpm build`，再執行 `pnpm test:startup:gateway -- --runs 5 --warmup 1`，可針對已建置的命令列介面進入點評測閘道啟動效能：第一個程序輸出、`/healthz`、`/readyz`、啟動追蹤計時、事件迴圈延遲，以及外掛查找表計時。
- 先執行 `pnpm build`，再執行 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`，可在 macOS 或 Linux 上評測程序內重新啟動效能（Windows 不支援；重新啟動需要 `SIGUSR1`）。它會使用 `SIGUSR1`、在子程序中啟用兩種追蹤，並記錄下一個 `/healthz`、下一個 `/readyz`、停機時間、就緒計時、CPU、RSS，以及重新啟動追蹤指標。
- `/healthz` 代表存活狀態；`/readyz` 代表可用就緒狀態。請將追蹤行與效能評測輸出視為擁有者歸因訊號，而不要僅根據一個時間範圍或樣本得出完整的效能結論。

## 查詢執行中的閘道

所有查詢命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="輸出模式">
    - 預設：人類可讀（在終端中顯示色彩）。
    - `--json`：機器可讀的 JSON（無樣式／進度指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：停用 ANSI，同時保留人類可讀的版面配置。

  </Tab>
  <Tab title="共用選項">
    - `--url <url>`：閘道 WebSocket URL。
    - `--token <token>`：閘道權杖。
    - `--password <password>`：閘道密碼。
    - `--timeout <ms>`：逾時／時間配額（預設值依命令而異；請參閱下方各命令）。
    - `--expect-final`：等待「最終」回應（代理程式呼叫）。

  </Tab>
</Tabs>

<Note>
設定 `--url` 時，命令列介面不會退回使用設定或環境中的認證資訊。請明確傳入 `--token` 或 `--password`。缺少明確認證資訊會產生錯誤。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` 是存活探測：只要伺服器能回應 HTTP，就會立即傳回。`/readyz` 較為嚴格；當啟動中的外掛 sidecar、頻道或已設定的鉤子仍在就緒過程中時，會持續顯示紅色。本機或經過驗證的詳細 `/readyz` 回應包含 `eventLoop` 診斷區塊（延遲、使用率、CPU 核心比率、`degraded` 旗標）。

<ParamField path="--port <port>" type="number">
  將此連接埠上的本機回送閘道設為目標。此呼叫會覆寫 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
</ParamField>

### `gateway usage-cost`

從工作階段記錄擷取使用成本摘要。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  要納入的天數。
</ParamField>
<ParamField path="--agent <id>" type="string">
  將摘要範圍限定於一個已設定的代理程式 ID。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  彙總所有已設定的代理程式。無法與 `--agent` 合併使用。
</ParamField>

### `gateway stability`

從執行中的閘道擷取近期診斷穩定性記錄器。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要納入的近期事件數量上限（最大值為 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  依診斷事件類型篩選，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  僅納入診斷序號之後的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  讀取持久保存的穩定性套件，而非呼叫執行中的閘道。`--bundle latest`（或單獨的 `--bundle`）會選取狀態目錄下最新的套件；你也可以直接傳入套件 JSON 路徑。
</ParamField>
<ParamField path="--export" type="boolean">
  寫入可供分享的支援診斷 ZIP 檔，而非輸出穩定性詳細資料。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的輸出路徑。
</ParamField>

<AccordionGroup>
  <Accordion title="隱私權與套件行為">
    - 記錄會保留操作中繼資料：事件名稱、計數、位元組大小、記憶體讀數、佇列／工作階段狀態、核准 ID、頻道／外掛名稱，以及經遮蔽的工作階段摘要。記錄不包含聊天文字、網路鉤子本文、工具輸出、原始要求／回應本文、權杖、Cookie、祕密值、主機名稱及原始工作階段 ID。將 `diagnostics.enabled: false` 設為停用，即可完全停用記錄器。
    - 當記錄器內含事件時，閘道的致命結束、關閉逾時及重新啟動失敗，會將相同的診斷快照寫入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 檢查最新套件；`--limit`、`--type` 和 `--since-seq` 也適用於套件輸出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

寫入專為錯誤報告設計的本機診斷 ZIP 檔。關於隱私權模型與套件內容，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  輸出 ZIP 路徑。預設為狀態目錄下的支援匯出檔。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要納入的已清理記錄行數上限。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要檢查的記錄位元組數上限。
</ParamField>
<ParamField path="--url <url>" type="string">
  用於健康狀態快照的閘道 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  用於健康狀態快照的閘道權杖。
</ParamField>
<ParamField path="--password <password>" type="string">
  用於健康狀態快照的閘道密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  狀態／健康狀態快照的逾時時間。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  略過持久保存的穩定性套件查詢。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 輸出已寫入的路徑、大小和資訊清單。
</ParamField>

匯出內容包含：`manifest.json`（檔案清單）、`summary.md`（Markdown 摘要）、`diagnostics.json`（頂層設定／記錄／探索／穩定性／狀態／健康狀態摘要）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`，以及套件存在時的 `stability/latest.json`。

此匯出內容適合分享。它會保留有助於偵錯的操作詳細資料，包括安全的記錄欄位、子系統名稱、狀態碼、持續時間、已設定的模式、連接埠、外掛／供應商 ID、非祕密的功能設定，以及經遮蔽的操作記錄訊息；並省略或遮蔽聊天文字、網路鉤子本文、工具輸出、認證資訊、Cookie、帳號／訊息識別碼、提示詞／指示文字、主機名稱及祕密值。當記錄訊息看起來像使用者／聊天／工具承載資料文字（例如 “user said”、 “chat text”、 “tool output”、 “webhook body”）時，匯出內容只會保留訊息已遭省略這項事實及其位元組數。

### `gateway status`

顯示閘道服務（launchd/systemd/schtasks），並可選擇執行連線能力／驗證探測。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  新增明確的探測目標。仍會探測已設定的遠端目標和 localhost。
</ParamField>
<ParamField path="--token <token>" type="string">
  探測使用的權杖驗證。
</ParamField>
<ParamField path="--password <password>" type="string">
  探測使用的密碼驗證。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探測逾時時間。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  略過連線能力探測（僅檢視服務）。
</ParamField>
<ParamField path="--deep" type="boolean">
  同時掃描系統層級的服務。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  將連線能力探測升級為讀取探測，若失敗則以非零代碼結束。無法與 `--no-probe` 合併使用。
</ParamField>

<AccordionGroup>
  <Accordion title="狀態語意">
    - 即使本機命令列介面設定遺失或無效，仍可用於診斷。
    - 預設輸出會證明服務狀態、WebSocket 連線，以及交握時可見的驗證能力，而非讀取／寫入／管理員操作。
    - 對於首次裝置驗證，探測不會變更任何狀態：若現有快取裝置權杖存在，便會重複使用；但絕不會只為了檢查狀態而建立新的命令列介面裝置身分或唯讀配對記錄。
    - 可能時，會解析已設定的驗證 SecretRef 以供探測驗證使用。如果必要的 SecretRef 尚未解析，當探測連線能力／驗證失敗時，`--json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或修正祕密來源。探測成功後，未解析的驗證警告便不再顯示。
    - 執行中的閘道回報 `gateway.version` 時，JSON 輸出會包含該值；如果交握探測無法提供版本中繼資料，`--require-rpc` 可以改用 `status.runtimeVersion` RPC 承載資料。
    - 當服務僅處於監聽狀態仍不足夠，且你還需要讀取範圍的 RPC 保持健康時，請在指令碼／自動化中使用 `--require-rpc`。
    - `--deep` 會掃描額外安裝的 launchd/systemd/schtasks；找到多個類似閘道的服務時，人類可讀輸出會顯示清理提示（通常每台機器執行一個閘道），並在適用時回報近期的監督程式重新啟動交接。
    - `--deep` 還會以外掛感知模式（`pluginValidation: "full"`）執行設定驗證，並顯示外掛資訊清單警告（例如缺少頻道設定中繼資料）。預設的 `gateway status` 會維持略過外掛驗證的快速唯讀路徑。
    - 人類可讀輸出包含解析後的檔案記錄路徑，以及命令列介面與服務的設定路徑／有效性，以協助診斷設定檔或狀態目錄偏移。
    - 人類可讀輸出包含 `Gateway heap:`，以及套用的限制和其自適應推導方式。JSON 輸出會以 `service.gatewayHeap` 提供相同報告。

  </Accordion>
  <Accordion title="Linux systemd 驗證偏移檢查">
    - 服務驗證偏移檢查會從單元讀取 `Environment=` 和 `EnvironmentFile=`（包括 `%h`、加上引號的路徑、多個檔案，以及選用的 `-` 檔案）。
    - 使用合併後的執行階段環境解析 `gateway.auth.token` SecretRef（先使用服務命令環境，再以程序環境作為備援）。
    - 權杖偏移檢查會在權杖驗證實際上未啟用時略過設定權杖解析（`gateway.auth.mode` 明確為 `password`/`none`/`trusted-proxy`，或模式未設定、密碼可能優先且沒有權杖候選項可能優先時）。

  </Accordion>
</AccordionGroup>

### `gateway probe`

“對所有項目進行偵錯”命令。它一律會探測：

- 你已設定的遠端閘道（若有），以及
- localhost（回送），**即使已設定遠端目標亦然**。

傳入 `--url` 會將該明確目標加到這兩者之前。人類可讀輸出會將目標標示為 `URL (explicit)`、`Remote (configured)` / `Remote (configured, inactive)` 和 `Local loopback`。

<Note>
如果有多個探測目標可連線，則會全部輸出。即使傳輸連接埠不同，SSH 通道、TLS／Proxy URL 和已設定的遠端 URL 仍可能指向同一個閘道；`multiple_gateways` 保留供不同或身分不明確的可連線閘道使用。隔離的設定檔支援執行多個閘道（例如救援機器人），但大多數安裝只會執行單一閘道。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  將此連接埠用於本機回送探測目標和 SSH 通道的遠端連接埠。若沒有 `--url`，此選項只會選取本機回送目標，而不使用已設定的閘道環境 URL、環境連接埠或遠端目標。
</ParamField>

<AccordionGroup>
  <Accordion title="判讀">
    - `Reachable: yes` 表示至少有一個目標接受 WebSocket 連線。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 會回報探測能夠證明的驗證資訊，並與可連線性分開呈現。
    - `Read probe: ok` 表示讀取範圍的詳細 RPC 呼叫（`health`/`status`/`system-presence`/`config.get`）也已成功。
    - `Read probe: limited - missing scope: operator.read` 表示連線成功，但讀取範圍的 RPC 受到限制。這會回報為**降級**的可連線性，而非完全失敗。
    - `Connect: ok` 之後出現 `Read probe: failed`，表示 WebSocket 已連線，但後續的讀取診斷逾時或失敗；這同樣是**降級**，而非無法連線。
    - 如同 `gateway status`，探測會重複使用現有的快取裝置驗證，但不會建立首次裝置身分或配對狀態。
    - 只有在所有探測目標皆無法連線時，結束代碼才會是非零。

  </Accordion>
  <Accordion title="JSON 輸出">
    頂層：

    - `ok`：至少有一個目標可連線。
    - `degraded`：至少有一個目標接受了連線，但未完成完整的詳細 RPC 診斷。
    - `capability`：在可連線目標中觀察到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：視為目前作用中勝出者的最佳目標，優先順序為：明確指定的 URL、SSH 通道、已設定的遠端、本機回送。
    - `warnings[]`：包含 `code`、`message` 及選用 `targetIds` 的盡力而為警告記錄。
    - `network`：從目前設定與主機網路推導出的本機回送／tailnet URL 提示。
    - `discovery.timeoutMs` / `discovery.count`：這次探測實際使用的探索預算／結果數量。

    每個目標（`targets[].connect`）：`ok`（可連線性與降級分類）、`rpcOk`（完整詳細資料 RPC 成功）、`scopeLimited`（因缺少操作員範圍而導致詳細資料 RPC 失敗）。

    每個目標（`targets[].auth`）：可取得時，會在 `hello-ok` 中回報 `role` 與 `scopes`，以及顯示的 `capability` 分類。

  </Accordion>
  <Accordion title="常見警告代碼">
    - `ssh_tunnel_failed`：SSH 通道設定失敗；命令已改用直接探測。
    - `multiple_gateways`：可連線到不同的閘道身分，或 OpenClaw 無法證明可連線的目標是同一個閘道。指向同一閘道的 SSH 通道、Proxy URL 或已設定的遠端 URL 不會觸發此警告。
    - `auth_secretref_unresolved`：無法解析失敗目標已設定的驗證 SecretRef。
    - `probe_scope_limited`：WebSocket 連線成功，但讀取探測因缺少 `operator.read` 而受限。
    - `local_tls_runtime_unavailable`：本機閘道已啟用 TLS，但 OpenClaw 無法載入本機憑證指紋。

  </Accordion>
</AccordionGroup>

#### 透過 SSH 遠端連線（與 Mac 應用程式一致）

macOS 應用程式的 "Remote over SSH" 模式使用本機連接埠轉送，讓僅限回送介面的遠端閘道可在 `ws://127.0.0.1:<port>` 連線。

命令列介面等效命令：

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 或 `user@host:port`（連接埠預設為 `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  身分檔案。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  從解析後的探索端點（`local.`，以及已設定的廣域網路網域（若有））中選取第一個探索到的閘道主機作為 SSH 目標。會忽略僅來自 TXT 的提示。
</ParamField>

設定預設值（選用）：`gateway.remote.sshTarget`、`gateway.remote.sshIdentity`。

### `gateway call <method>`

低階 RPC 輔助工具。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  參數的 JSON 物件字串。
</ParamField>
<ParamField path="--url <url>" type="string">
  閘道 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  閘道權杖。
</ParamField>
<ParamField path="--password <password>" type="string">
  閘道密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  逾時預算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用於在最終承載資料之前串流中間事件的代理程式型 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的 JSON 輸出。
</ParamField>

<Note>
`--params` 必須是有效的 JSON，且每個方法都會驗證自己的參數形狀（額外或名稱錯誤的欄位會遭拒絕）。
</Note>

## 管理閘道服務

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### 使用包裝程式安裝

當受管理的服務必須透過其他可執行檔啟動時，請使用 `--wrapper`，例如密鑰管理程式的轉接層或切換執行身分的輔助工具。包裝程式會接收一般的閘道引數，並負責最終使用這些引數執行 `openclaw` 或 Node。

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

也可以透過環境設定包裝程式。`gateway install` 會驗證路徑是否為可執行檔，將包裝程式寫入服務的 `ProgramArguments`，並在服務環境中保存 `OPENCLAW_WRAPPER`，以供後續強制重新安裝、更新及 doctor 修復使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

若要移除已保存的包裝程式，請在重新安裝時清除 `OPENCLAW_WRAPPER`：

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="命令選項">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node>`（預設值：`node`）、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start`：`--json`
    - `gateway stop`：`--disable`、`--force`、`--json`

  </Accordion>
  <Accordion title="生命週期行為">
    - `gateway start` 具備冪等性：當受管理的服務已在執行時，它會回報執行中的程序並保持原狀。已載入但停止的服務則會照常啟動。
    - 請使用 `gateway restart` 重新啟動受管理的服務。請勿串接 `gateway stop` 與 `gateway start` 來代替重新啟動。
    - 在非互動式殼層中，`gateway stop` 需要 `--force`。互動式終端機會維持現有的無提示行為。對於自動化與測試，建議使用 `gateway run --dev`，或使用具有可用連接埠的隔離 `--profile`。
    - 在 macOS 上，`gateway stop` 預設使用 `launchctl bootout`，這會從目前的開機工作階段移除 LaunchAgent，但不會永久停用；KeepAlive 的自動復原在日後當機時仍會保持啟用，而 `gateway start` 無須手動執行 `launchctl enable` 即可順利重新啟用。傳入 `--disable` 可持續抑制 KeepAlive 與 RunAtLoad，使閘道在下次明確執行 `gateway start` 之前不會重新產生；若手動停止的狀態應在重新開機後繼續保留，請使用此選項。
    - 閘道生命週期異動會將盡力而為的鍵值稽核記錄附加至 `<state-dir>/logs/gateway-restart.log`，包括命令列介面的啟動、停止與重新啟動操作、安全重新啟動要求、監督程式重新啟動及卸離交接。
    - 生命週期命令接受 `--json` 以供指令碼使用。

  </Accordion>
  <Accordion title="受管理閘道的堆積大小">
    - `gateway install` 會為受管理的閘道服務寫入僅限堆積的 `NODE_OPTIONS` 值。當 Node 回報容器或服務限制時，目標值為受限記憶體的 50%；否則為實體記憶體的 50%。
    - 名義目標範圍為 2048–8192 MiB，並額外設有 75% 的原生執行空間上限。在小型主機上，此執行空間上限可能使套用的限制低於名義上的 2048 MiB 下限。
    - 已安裝服務中儲存的有效明確 `--max-old-space-size`，會在強制重新安裝與 doctor 修復期間保留。其他 `NODE_OPTIONS` 旗標不會帶入受管理的服務。
    - 殼層環境中的 `NODE_OPTIONS` 不會覆寫此政策。使用 `gateway status` 或 `doctor` 檢查已安裝的值；執行 `openclaw gateway install --force`，可重新產生沒有受管理堆積設定的舊版服務中繼資料。
    - 此政策僅適用於受管理的閘道服務。前景執行的 `gateway run`、節點服務及手動編寫的監督程式單元會保留各自的執行階段設定。

  </Accordion>
  <Accordion title="安裝時的驗證與 SecretRef">
    - 當權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理時，`gateway install` 會驗證該 SecretRef 是否可解析，但不會將解析出的權杖保存至服務環境中繼資料。
    - 如果權杖驗證需要權杖，但已設定的權杖 SecretRef 無法解析，安裝會採取封閉式失敗，而不會保存作為備援的純文字。
    - 對於 `gateway run` 上的密碼驗證，建議使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支援的 `gateway.auth.password`，而非行內的 `--password`。
    - 在推斷驗證模式中，僅存在於殼層的 `OPENCLAW_GATEWAY_PASSWORD` 不會放寬安裝權杖要求；安裝受管理的服務時，請使用持久設定（`gateway.auth.password` 或設定 `env`）。
    - 如果已同時設定 `gateway.auth.token` 與 `gateway.auth.password`，但未設定 `gateway.auth.mode`，則在明確設定模式之前會阻止安裝。

  </Accordion>
</AccordionGroup>

## 探索閘道（Bonjour）

`gateway discover` 會掃描閘道信標（`_openclaw-gw._tcp`）。

- 多點傳送 DNS-SD：`local.`
- 單點傳送 DNS-SD（廣域 Bonjour）：選擇一個網域（例如：`openclaw.internal.`），並設定分割 DNS 與 DNS 伺服器；請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

只有啟用 Bonjour 探索（預設）的閘道會公告信標。

每個信標上的 TXT 提示：`role`（閘道角色提示）、`transport`（傳輸提示，例如 `gateway`）、`gatewayPort`（WebSocket 連接埠，通常為 `18789`）、`tailnetDns`（可用時為 MagicDNS 主機名稱）、`gatewayTls` / `gatewayTlsSha256`（已啟用 TLS 與憑證指紋）。`sshPort` 與 `cliPath` 僅在完整探索模式（`discovery.mdns.mode: "full"`）中發布；預設值為 `"minimal"`，會省略這些資訊，此時用戶端會將 SSH 目標的連接埠預設為 `22`。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每個命令的逾時時間（瀏覽／解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的輸出（也會停用樣式／載入動畫）。
</ParamField>

範例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- 會掃描 `local.`，以及已啟用的已設定廣域網路網域。
- JSON 輸出中的 `wsUrl` 是從解析後的服務端點推導而來，而不是來自 `lanHost` 或 `tailnetDns` 等僅限 TXT 的提示。
- `discovery.mdns.mode` 控制在 `local.` mDNS 與廣域 DNS-SD 上發布 `sshPort`/`cliPath`（請參閱上文）。

</Note>

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [閘道操作手冊](/zh-TW/gateway)
