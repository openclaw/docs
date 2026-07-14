---
read_when:
    - 從命令列介面執行閘道（開發環境或伺服器）
    - 偵錯閘道驗證、繫結模式與連線能力
    - 透過 Bonjour 探索閘道（本機 + 廣域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw 閘道命令列介面 (`openclaw gateway`) — 執行、查詢及探索閘道
title: 閘道
x-i18n:
    generated_at: "2026-07-14T13:34:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: fbbd236611d20a703b64719c2f05a95554107b8e847fb1a4dca55025890f238d
    source_path: cli/gateway.md
    workflow: 16
---

OpenClaw 的閘道是其 WebSocket 伺服器（頻道、節點、工作階段、鉤子）。以下所有子命令均位於 `openclaw gateway ...` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour 探索" href="/zh-TW/gateway/bonjour">
    本機 mDNS 與廣域 DNS-SD 設定。
  </Card>
  <Card title="探索概觀" href="/zh-TW/gateway/discovery">
    OpenClaw 如何公告及尋找閘道。
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
    - 除非 `~/.openclaw/openclaw.json` 中已設定 `gateway.mode=local`，否則拒絕啟動。臨時／開發執行請使用 `--allow-unconfigured`；它會略過此防護，而不寫入或修復設定。
    - `openclaw onboard --mode local` 和 `openclaw setup` 會寫入 `gateway.mode=local`。如果設定檔存在，但缺少 `gateway.mode`，系統會將其視為損壞／遭覆寫的設定，而閘道會拒絕替你猜測 `local`；請重新執行初始設定、手動設定該鍵，或傳入 `--allow-unconfigured`。
    - 未經驗證時，禁止繫結至迴送介面以外的位址。
    - 目前，`--bind` 的值 `lan`、`tailnet` 和 `custom` 僅透過 IPv4 路徑解析；僅支援 IPv6 的自備主機設定，需要在閘道前方配置 IPv4 輔助服務或 Proxy。
    - 獲得授權時，`SIGUSR1` 會觸發行程內重新啟動。`commands.restart`（預設：啟用）會管控從外部傳送的 `SIGUSR1`；將其設為 `false`，可阻擋手動作業系統訊號重新啟動，同時仍允許透過 `gateway restart` 命令、閘道工具及套用／更新設定來重新啟動。
    - `SIGINT`/`SIGTERM` 會停止行程，但不會還原自訂終端機狀態；如果你將命令列介面包裝在終端介面或原始模式輸入中，請在結束前自行還原終端機。

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
  `connect.params.auth.token` 的共用權杖。設定 `OPENCLAW_GATEWAY_TOKEN` 時，預設使用其值。
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
  Tailscale 公開方式：`off`、`serve`、`funnel`。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  關閉時重設 Tailscale serve/funnel 設定。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  啟動時不強制要求 `gateway.mode=local`。僅供臨時／開發啟動使用；不會保存或修復設定。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺少開發設定與工作區，則予以建立（略過 `BOOTSTRAP.md`）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重設開發設定、認證資訊、工作階段和工作區。需要 `--dev`。
</ParamField>
<ParamField path="--force" type="boolean">
  啟動前終止目標連接埠上任何現有的監聽程式。
</ParamField>
<ParamField path="--verbose" type="boolean">
  將詳細記錄輸出至 stdout/stderr。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  主控台中僅顯示命令列介面後端記錄（也會啟用 stdout/stderr）。
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

`--claude-cli-logs` 是 `--cli-backend-logs` 的已淘汰別名。

針對 `--bind custom`，請將 `gateway.customBindHost` 設為 IPv4 位址。除 `127.0.0.1` 或 `0.0.0.0` 以外的任何位址，還要求同一主機的用戶端在相同連接埠上使用 `127.0.0.1`；如果任一監聽程式無法繫結，啟動便會失敗。萬用字元 `0.0.0.0` 不會新增另一個必要別名。僅支援 IPv6 的自備主機設定，需要在閘道前方配置 IPv4 輔助服務或 Proxy。

## 重新啟動閘道

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` 會要求執行中的閘道預先檢查進行中的工作，並排定在工作清空後執行一次合併的重新啟動。等待時間受 `gateway.reload.deferralTimeoutMs` 限制（預設：5 分鐘／`300000`）；時間額度耗盡時，將強制重新啟動。將 `deferralTimeoutMs: 0` 設為無限期等待（期間定期警告仍在等待），而非強制執行。`--safe` 無法與 `--force` 或 `--wait` 同時使用。

`--skip-deferral` 會在安全重新啟動時略過進行中工作的延遲防護，因此即使回報有阻礙項目，閘道也會立即重新啟動。它需要 `--safe`；當失控的工作導致延遲卡住時使用此選項。

`--wait <duration>` 會覆寫一般（非安全）重新啟動的清空時間額度。接受純毫秒值或單位後綴 `ms`、`s`、`m`、`h`、`d`（例如 `30s`、`5m`、`1h30m`）；`--wait 0` 會無限期等待。無法與 `--force` 或 `--safe` 同時使用。

`--force` 會略過進行中工作的清空程序並立即重新啟動。一般的 `restart`（不帶旗標）會維持現有的服務管理程式重新啟動行為。

<Warning>
行內 `--password` 可能會顯示在本機行程清單中。建議改用 `--password-file`、環境變數，或由 SecretRef 支援的 `gateway.auth.password`。
</Warning>

### 閘道效能分析

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 會記錄啟動期間各階段的時間，包括每個階段的 `eventLoopMax` 延遲，以及外掛查詢表的時間（已安裝索引、資訊清單登錄庫、啟動規劃、擁有者對應工作）。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` 會記錄限定於重新啟動範圍的 `restart trace:` 行：訊號處理、進行中工作清空、關閉階段、下次啟動、就緒時間和記憶體指標。
- 搭配 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` 使用 `OPENCLAW_DIAGNOSTICS=timeline`，會為外部 QA 測試框架寫入盡力而為的 JSONL 啟動診斷時間軸（等同於設定 `diagnostics.flags: ["timeline"]`；路徑仍只能透過環境變數設定）。加入 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件迴圈取樣。
- 先執行 `pnpm build`，再執行 `pnpm test:startup:gateway -- --runs 5 --warmup 1`，會以建置完成的命令列介面進入點為基準測試閘道啟動：第一個行程輸出、`/healthz`、`/readyz`、啟動追蹤時間、事件迴圈延遲和外掛查詢表時間。
- 先執行 `pnpm build`，再執行 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`，會在 macOS 或 Linux 上對行程內重新啟動進行基準測試（Windows 不支援；重新啟動需要 `SIGUSR1`）。它會使用 `SIGUSR1`、在子行程中啟用兩種追蹤，並記錄下一個 `/healthz`、下一個 `/readyz`、停機時間、就緒時間、CPU、RSS 和重新啟動追蹤指標。
- `/healthz` 代表存活狀態；`/readyz` 代表可用就緒狀態。應將追蹤行和基準測試輸出視為判斷責任歸屬的訊號，而非根據單一時間範圍或取樣得出的完整效能結論。

## 查詢執行中的閘道

所有查詢命令均使用 WebSocket RPC。

<Tabs>
  <Tab title="輸出模式">
    - 預設：人類可讀格式（在 TTY 中使用色彩）。
    - `--json`：機器可讀的 JSON（無樣式／進度指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：停用 ANSI，同時保留人類可讀版面。

  </Tab>
  <Tab title="共用選項">
    - `--url <url>`：閘道 WebSocket URL。
    - `--token <token>`：閘道權杖。
    - `--password <password>`：閘道密碼。
    - `--timeout <ms>`：逾時／時間額度（預設值依命令而異；請參閱下方各命令）。
    - `--expect-final`：等待「最終」回應（代理程式呼叫）。

  </Tab>
</Tabs>

<Note>
設定 `--url` 時，命令列介面不會退回使用設定或環境中的認證資訊。請明確傳入 `--token` 或 `--password`。未提供明確認證資訊將視為錯誤。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` 是存活探查：伺服器能回應 HTTP 後便立即傳回。`/readyz` 更為嚴格，在啟動中的外掛輔助服務、頻道或已設定鉤子仍在進入穩定狀態時，會持續顯示紅色。本機或經過驗證的詳細 `/readyz` 回應包含 `eventLoop` 診斷區塊（延遲、使用率、CPU 核心比率、`degraded` 旗標）。

<ParamField path="--port <port>" type="number">
  指定此連接埠上的本機迴送閘道。此呼叫會覆寫 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
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
  彙總所有已設定的代理程式。無法與 `--agent` 同時使用。
</ParamField>

### `gateway stability`

從執行中的閘道擷取近期的診斷穩定性記錄器資料。

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
  讀取已保存的穩定性套件，而不呼叫執行中的閘道。`--bundle latest`（或單獨的 `--bundle`）會選取狀態目錄下最新的套件；也可以直接傳入套件 JSON 路徑。
</ParamField>
<ParamField path="--export" type="boolean">
  寫入可分享的支援診斷 ZIP 檔，而非列印穩定性詳細資料。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的輸出路徑。
</ParamField>

<AccordionGroup>
  <Accordion title="隱私權與套件行為">
    - 記錄會保留操作中繼資料：事件名稱、計數、位元組大小、記憶體讀數、佇列／工作階段狀態、核准 ID、頻道／外掛名稱，以及已遮蔽的工作階段摘要。記錄不包含聊天文字、網路鉤子本文、工具輸出、原始要求／回應本文、權杖、Cookie、機密值、主機名稱和原始工作階段 ID。設定 `diagnostics.enabled: false` 可完全停用記錄器。
    - 當記錄器中有事件時，閘道的嚴重錯誤結束、關閉逾時和重新啟動時的啟動失敗，會將相同的診斷快照寫入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 檢查最新套件；`--limit`、`--type` 和 `--since-seq` 也適用於套件輸出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

寫入專為錯誤報告設計的本機診斷 zip 檔。若要瞭解隱私權模型和套件內容，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  輸出 zip 路徑。預設為狀態目錄下的支援匯出檔。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的已清理記錄行數上限。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要檢查的記錄位元組數上限。
</ParamField>
<ParamField path="--url <url>" type="string">
  用於健康情況快照的閘道 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  用於健康情況快照的閘道權杖。
</ParamField>
<ParamField path="--password <password>" type="string">
  用於健康情況快照的閘道密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  狀態／健康情況快照的逾時時間。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  略過已保存的穩定性套件查詢。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 輸出寫入的路徑、大小和資訊清單。
</ParamField>

匯出檔會封裝：`manifest.json`（檔案清單）、`summary.md`（Markdown 摘要）、`diagnostics.json`（頂層設定／記錄／探索／穩定性／狀態／健康情況摘要）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`，以及套件存在時的 `stability/latest.json`。

此匯出檔的設計用途是供分享。它會保留對偵錯有用的操作詳細資料，包括安全的記錄欄位、子系統名稱、狀態碼、持續時間、已設定模式、連接埠、外掛／提供者 ID、非機密功能設定，以及已遮蔽的操作記錄訊息；並省略或遮蔽聊天文字、網路鉤子本文、工具輸出、認證資訊、Cookie、帳號／訊息識別碼、提示／指示文字、主機名稱和機密值。當記錄訊息看起來像使用者／聊天／工具的承載內容文字（例如 "user said"、"chat text"、"tool output"、"webhook body"）時，匯出檔只會保留訊息已省略的事實及其位元組數。

### `gateway status`

顯示閘道服務（launchd/systemd/schtasks）及選用的連線能力／驗證探查。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  新增明確的探查目標。仍會探查已設定的遠端端點與 localhost。
</ParamField>
<ParamField path="--token <token>" type="string">
  探查所用的權杖驗證。
</ParamField>
<ParamField path="--password <password>" type="string">
  探查所用的密碼驗證。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探查逾時時間。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  略過連線能力探查（僅顯示服務）。
</ParamField>
<ParamField path="--deep" type="boolean">
  同時掃描系統層級服務。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  將連線能力探查升級為讀取探查，若失敗則以非零狀態結束。無法與 `--no-probe` 同時使用。
</ParamField>

<AccordionGroup>
  <Accordion title="狀態語意">
    - 即使本機命令列介面設定遺失或無效，仍可用於診斷。
    - 預設輸出可證明服務狀態、WebSocket 連線，以及交握時可見的驗證能力，但不能證明讀取／寫入／管理員操作。
    - 對首次裝置驗證而言，探查不會造成異動：若已有快取的裝置權杖，則會重複使用，但絕不會只為檢查狀態而建立新的命令列介面裝置身分或唯讀配對記錄。
    - 可能時，會解析已設定的驗證 SecretRef 以供探查驗證使用。如果必要的 SecretRef 無法解析，當探查的連線能力／驗證失敗時，`--json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或修正機密來源。探查成功後，無法解析驗證資訊的警告會受到抑制。
    - 執行中的閘道若有回報，JSON 輸出會包含 `gateway.version`；如果交握探查無法提供版本中繼資料，`--require-rpc` 可改用 `status.runtimeVersion` RPC 承載內容。
    - 在指令碼／自動化中，如果僅有監聽中的服務還不夠，且還需要讀取範圍 RPC 保持健康，請使用 `--require-rpc`。
    - `--deep` 會掃描額外的 launchd/systemd/schtasks 安裝；找到多個類似閘道的服務時，人類可讀輸出會顯示清理提示（通常每台機器執行一個閘道），並在相關時回報近期的監督程式重新啟動移交。
    - `--deep` 也會以外掛感知模式（`pluginValidation: "full"`）執行設定驗證，並顯示外掛資訊清單警告（例如缺少頻道設定中繼資料）。預設的 `gateway status` 會保留略過外掛驗證的快速唯讀路徑。
    - 人類可讀輸出會包含解析後的檔案記錄路徑，以及命令列介面與服務的設定路徑／有效性，協助診斷設定檔或狀態目錄的偏移。

  </Accordion>
  <Accordion title="Linux systemd 驗證偏移檢查">
    - 服務驗證偏移檢查會從單元讀取 `Environment=` 和 `EnvironmentFile=`（包括 `%h`、加上引號的路徑、多個檔案，以及選用的 `-` 檔案）。
    - 使用合併後的執行階段環境解析 `gateway.auth.token` SecretRef（優先使用服務命令環境，然後回退至程序環境）。
    - 當權杖驗證實際上未啟用時，權杖偏移檢查會略過設定權杖解析（`gateway.auth.mode` 明確設為 `password`/`none`/`trusted-proxy`；或者模式未設定、密碼可能優先，且沒有權杖候選項可能優先）。

  </Accordion>
</AccordionGroup>

### `gateway probe`

「偵錯所有項目」命令。它一律會探查：

- 你已設定的遠端閘道（若有設定），以及
- localhost（回送介面），**即使已設定遠端端點**。

傳入 `--url` 會將該明確目標加在兩者之前。人類可讀輸出會將目標標示為 `URL (explicit)`、`Remote (configured)` / `Remote (configured, inactive)` 和 `Local loopback`。

<Note>
如果有多個探查目標可連線，則會全部輸出。SSH 通道、TLS／Proxy URL 和已設定的遠端 URL 即使使用不同的傳輸連接埠，也可能指向同一個閘道；`multiple_gateways` 僅保留給不同或身分不明確的可連線閘道。支援為隔離的設定檔執行多個閘道（例如救援機器人），但大多數安裝只會執行單一閘道。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  將此連接埠用於本機回送探查目標和 SSH 通道的遠端連接埠。若未使用 `--url`，則只會選取本機回送目標，而不使用已設定的閘道環境 URL、環境連接埠或遠端目標。
</ParamField>

<AccordionGroup>
  <Accordion title="解讀方式">
    - `Reachable: yes` 表示至少有一個目標接受 WebSocket 連線。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 會回報探查可證明的驗證相關資訊，且與可連線性分開呈現。
    - `Read probe: ok` 表示讀取範圍的詳細 RPC 呼叫（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示連線成功，但讀取範圍 RPC 受到限制。這會回報為**降級**的可連線性，而非完全失敗。
    - `Connect: ok` 之後的 `Read probe: failed` 表示 WebSocket 已連線，但後續讀取診斷逾時或失敗；同樣屬於**降級**，而非無法連線。
    - 與 `gateway status` 相同，探查會重複使用現有快取的裝置驗證，但不會建立首次使用的裝置身分或配對狀態。
    - 只有在所有探查目標都無法連線時，結束代碼才會是非零。

  </Accordion>
  <Accordion title="JSON 輸出">
    頂層：

    - `ok`：至少有一個目標可連線。
    - `degraded`：至少有一個目標接受連線，但未完成完整的詳細 RPC 診斷。
    - `capability`：所有可連線目標中觀察到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：最適合視為目前作用中勝出者的目標，順序為：明確 URL、SSH 通道、已設定的遠端端點、本機回送介面。
    - `warnings[]`：盡力而為的警告記錄，包含 `code`、`message`，以及選用的 `targetIds`。
    - `network`：從目前設定與主機網路衍生出的本機回送／tailnet URL 提示。
    - `discovery.timeoutMs` / `discovery.count`：這次探查實際使用的探索預算／結果數量。

    每個目標（`targets[].connect`）：`ok`（可連線性與降級分類）、`rpcOk`（完整詳細 RPC 成功）、`scopeLimited`（因缺少操作員範圍而導致詳細 RPC 失敗）。

    每個目標（`targets[].auth`）：可用時，會在 `hello-ok` 中回報 `role` 和 `scopes`，以及顯示的 `capability` 分類。

  </Accordion>
  <Accordion title="常見警告代碼">
    - `ssh_tunnel_failed`：SSH 通道設定失敗；命令已回退至直接探查。
    - `multiple_gateways`：可連線到不同的閘道身分，或 OpenClaw 無法證明可連線目標是同一個閘道。指向同一閘道的 SSH 通道、Proxy URL 或已設定的遠端 URL 不會觸發此警告。
    - `auth_secretref_unresolved`：無法為失敗的目標解析已設定的驗證 SecretRef。
    - `probe_scope_limited`：WebSocket 連線成功，但讀取探查因缺少 `operator.read` 而受到限制。
    - `local_tls_runtime_unavailable`：已啟用本機閘道 TLS，但 OpenClaw 無法載入本機憑證指紋。

  </Accordion>
</AccordionGroup>

#### 透過 SSH 遠端連線（與 Mac 應用程式一致）

macOS 應用程式的 "Remote over SSH" 模式使用本機連接埠轉送，讓僅限回送介面的遠端閘道可透過 `ws://127.0.0.1:<port>` 連線。

對應的命令列介面命令：

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
  從解析後的探索端點中選取第一個探索到的閘道主機作為 SSH 目標（`local.`，以及已設定的廣域網路網域〔若有〕）。僅含 TXT 的提示會被忽略。
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
  逾時上限。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用於在最終承載資料之前串流中間事件的代理程式型 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的 JSON 輸出。
</ParamField>

<Note>
`--params` 必須是有效的 JSON，而且每個方法都會驗證自己的參數結構（多餘或名稱錯誤的欄位會遭拒絕）。
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

當受管理的服務必須透過另一個可執行檔啟動時，請使用 `--wrapper`，例如密鑰管理員轉接程式或以其他身分執行的輔助工具。包裝程式會接收一般的閘道引數，並負責最終以這些引數執行 `openclaw` 或 Node。

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

你也可以透過環境設定包裝程式。`gateway install` 會驗證該路徑是否為可執行檔、將包裝程式寫入服務 `ProgramArguments`，並在服務環境中保留 `OPENCLAW_WRAPPER`，供後續強制重新安裝、更新及 doctor 修復使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

若要移除已保留的包裝程式，請在重新安裝時清除 `OPENCLAW_WRAPPER`：

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
    - `gateway stop`：`--disable`、`--json`

  </Accordion>
  <Accordion title="生命週期行為">
    - 請使用 `gateway restart` 重新啟動受管理的服務。請勿串接 `gateway stop` 與 `gateway start` 來替代重新啟動。
    - 在 macOS 上，`gateway stop` 預設使用 `launchctl bootout`，這會從目前的開機工作階段移除 LaunchAgent，但不會持續停用它——KeepAlive 自動復原在未來發生當機時仍會保持啟用，且 `gateway start` 無須手動執行 `launchctl enable` 即可正常重新啟用。傳入 `--disable` 可持續抑制 KeepAlive 與 RunAtLoad，使閘道在下次明確執行 `gateway start` 前不會重新產生；若手動停止的狀態應在重新開機後繼續維持，請使用此選項。
    - 生命週期命令接受 `--json`，以供指令碼使用。

  </Accordion>
  <Accordion title="安裝時的驗證與 SecretRef">
    - 當權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理時，`gateway install` 會驗證 SecretRef 是否可解析，但不會將解析後的權杖保留於服務環境中繼資料。
    - 如果權杖驗證需要權杖，但設定的權杖 SecretRef 無法解析，安裝將採取封閉式失敗，而不會保留後備純文字。
    - 對 `gateway run` 上的密碼驗證，建議使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`，或由 SecretRef 支援的 `gateway.auth.password`，而非內嵌的 `--password`。
    - 在推斷驗證模式下，僅限 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不會放寬安裝權杖要求；安裝受管理的服務時，請使用持久設定（`gateway.auth.password` 或設定中的 `env`）。
    - 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，但未設定 `gateway.auth.mode`，安裝會遭到阻擋，直到明確設定模式為止。

  </Accordion>
</AccordionGroup>

## 探索閘道（Bonjour）

`gateway discover` 會掃描閘道信標（`_openclaw-gw._tcp`）。

- 多點傳播 DNS-SD：`local.`
- 單點傳播 DNS-SD（廣域 Bonjour）：選擇一個網域（例如：`openclaw.internal.`），並設定分割 DNS 與 DNS 伺服器；請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

只有啟用 Bonjour 探索（預設啟用）的閘道才會廣播信標。

每個信標上的 TXT 提示：`role`（閘道角色提示）、`transport`（傳輸方式提示，例如 `gateway`）、`gatewayPort`（WebSocket 連接埠，通常為 `18789`）、`tailnetDns`（MagicDNS 主機名稱，如可用）、`gatewayTls` / `gatewayTlsSha256`（已啟用 TLS + 憑證指紋）。`sshPort` 與 `cliPath` 僅會在完整探索模式下發布（`discovery.mdns.mode: "full"`；預設為 `"minimal"`，因此會省略這些資訊——此時用戶端會將 SSH 目標預設為連接埠 `22`）。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每個命令的逾時時間（瀏覽／解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的輸出（也會停用樣式與旋轉指示器）。
</ParamField>

範例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- 掃描 `local.`，以及啟用時所設定的廣域網域。
- JSON 輸出中的 `wsUrl` 衍生自解析後的服務端點，而不是 `lanHost` 或 `tailnetDns` 等僅限 TXT 的提示。
- `discovery.mdns.mode` 控制 `local.` mDNS 與廣域 DNS-SD 上的 `sshPort`/`cliPath` 發布（請參閱上文）。

</Note>

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [閘道操作手冊](/zh-TW/gateway)
