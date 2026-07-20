---
read_when:
    - 從命令列介面執行閘道（開發或伺服器環境）
    - 偵錯閘道驗證、繫結模式與連線能力
    - 透過 Bonjour 探索閘道（本機 + 廣域 DNS-SD）
    - 整合外部閘道程序監督器
sidebarTitle: Gateway
summary: OpenClaw 閘道命令列介面 (`openclaw gateway`) — 執行、查詢及探索閘道
title: 閘道
x-i18n:
    generated_at: "2026-07-20T00:45:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4de443c749806ccb7fe3e7919a319ff125130192e8814708a79b2b3a93162e7d
    source_path: cli/gateway.md
    workflow: 16
---

OpenClaw 的閘道是 WebSocket 伺服器（頻道、節點、工作階段、鉤子）。以下所有子命令都位於 `openclaw gateway ...` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour 探索" href="/zh-TW/gateway/bonjour">
    本機 mDNS + 廣域 DNS-SD 設定。
  </Card>
  <Card title="探索概覽" href="/zh-TW/gateway/discovery">
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
    - 除非已在 `~/.openclaw/openclaw.json` 中設定 `gateway.mode=local`，否則會拒絕啟動。臨時／開發執行請使用 `--allow-unconfigured`；它會略過此防護，而不寫入或修復設定。
    - 若啟動時發現可修復的無效設定，互動式終端會詢問是否執行 `openclaw doctor --fix`，並在你同意後重試啟動一次。非互動式執行絕不會自動修復，而會改為印出該命令。若修復後的設定仍然無效，啟動仍會停止。
    - `openclaw onboard --mode local` 和 `openclaw setup` 會寫入 `gateway.mode=local`。如果設定檔存在，但缺少 `gateway.mode`，系統會將其視為損壞／遭覆寫的設定，且閘道會拒絕替你猜測 `local`——請重新執行初始設定、手動設定該鍵，或傳入 `--allow-unconfigured`。
    - 未經驗證時，禁止繫結至迴路介面以外的位址。
    - 目前，`--bind` 的值 `lan`、`tailnet` 和 `custom` 僅透過 IPv4 路徑解析；僅限 IPv6 的自備主機設定需要在閘道前方放置 IPv4 輔助服務或 Proxy。
    - 獲得授權後，`SIGUSR1` 會觸發程序內重新啟動。`commands.restart`（預設：啟用）會控管外部傳送的 `SIGUSR1`；將其設為 `false` 可封鎖手動作業系統訊號重新啟動。面向代理程式的 `gateway` 工具是唯讀的；代理程式須透過經人工核准的 `openclaw` 委派工具要求重新啟動。
    - `SIGINT`/`SIGTERM` 會停止程序，但不會還原自訂終端狀態——若你將命令列介面包裝在終端介面或原始模式輸入中，請在結束前自行還原終端。

  </Accordion>
</AccordionGroup>

### 選項

<ParamField path="--port <port>" type="number">
  WebSocket 連接埠（預設取自設定／環境；通常為 `18789`）。
</ParamField>
<ParamField path="--bind <mode>" type="string">
  繫結模式：`loopback`（預設）、`lan`、`tailnet`、`auto`、`custom`。
</ParamField>
<ParamField path="--token <token>" type="string">
  用於 `connect.params.auth.token` 的共用權杖。設定 `OPENCLAW_GATEWAY_TOKEN` 時，預設使用該值。
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
  啟動時不強制要求 `gateway.mode=local`。僅供臨時／開發啟動使用；不會保存或修復設定。
</ParamField>
<ParamField path="--dev" type="boolean">
  若缺少開發設定與工作區，則建立它們（略過 `BOOTSTRAP.md`）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重設開發設定、認證資訊、工作階段及工作區。需要 `--dev`。
</ParamField>
<ParamField path="--force" type="boolean">
  啟動前終止目標連接埠上的任何現有監聽程式。在非互動式 Shell 中，此選項會拒絕終止已驗證的閘道監聽程式；請改用 `--dev`，或使用具有可用連接埠的隔離 `--profile`。
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

`--claude-cli-logs` 是 `--cli-backend-logs` 已棄用的別名。

使用 `--bind custom` 時，請將 `gateway.customBindHost` 設為 IPv4 位址。除 `127.0.0.1` 或 `0.0.0.0` 之外的任何位址，也需要在相同連接埠上使用 `127.0.0.1`，供同一主機上的用戶端使用；若任一監聽程式無法繫結，啟動便會失敗。萬用字元 `0.0.0.0` 不會新增另一個必要的別名。僅限 IPv6 的自備主機設定需要在閘道前方放置 IPv4 輔助服務或 Proxy。

## 重新啟動閘道

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` 會要求正在執行的閘道預先檢查進行中的工作，並排程一次合併的重新啟動，在該工作排空後執行。等待上限為 5 分鐘；超過時間額度後將強制重新啟動。`--safe` 無法與 `--force` 或 `--wait` 搭配使用。

`--skip-deferral` 會略過安全重新啟動的進行中工作延後閘門，因此即使回報有阻擋項目，閘道仍會立即重新啟動。它需要 `--safe`——請在延後作業卡在失控工作時使用。

`--wait <duration>` 會覆寫一般（非安全）重新啟動的排空時間額度。可接受不含單位的毫秒值，或單位後綴 `ms`、`s`、`m`、`h`、`d`（例如 `30s`、`5m`、`1h30m`）；`--wait 0` 會無限期等待。無法與 `--force` 或 `--safe` 搭配使用。

`--force` 會略過進行中工作的排空，並立即重新啟動。一般的 `restart`（不帶旗標）會保留現有的服務管理員重新啟動行為。

<Warning>
行內 `--password` 可能會顯示在本機程序清單中。建議使用 `--password-file`、環境變數，或由 SecretRef 支援的 `gateway.auth.password`。
</Warning>

### 外部監督程式

只有在其他程序管理員負責閘道生命週期時，才設定 `OPENCLAW_SUPERVISOR_MODE=external`。在此模式下：

- `openclaw gateway restart` 會保留現有的安全、強制及有界等待行為，但目標改為已驗證、正在執行的閘道，而不是 launchd、systemd 或 Task Scheduler。
- 原生服務的安裝、啟動、停止及解除安裝操作會遭拒絕，並提示改用外部監督程式。
- OpenClaw 自我更新會遭拒絕，讓監督程式能停止閘道、取代並完成執行階段，然後安全地重新啟動。
- 全新程序重新啟動會在正常結束前寫入有界的 SQLite 交接資料。若保存失敗，閘道會改用程序內重新啟動，而不會在沒有可用交接資料的情況下結束。

`OPENCLAW_SERVICE_REPAIR_POLICY=external` 仍是獨立的 Doctor 修復原則。它不宣告執行階段的所有權；同時需要這兩種行為的監督程式應設定這兩個變數。

外部監督程式可透過以下隱藏的機器合約協商及取用重新啟動交接資料：

```bash
openclaw gateway restart-handoff capabilities --json
openclaw gateway restart-handoff consume --expected-pid <pid> --json
```

通訊協定版本 `1` 支援 `consume` 操作。取用會在單一立即 SQLite 交易中驗證預期 PID 及有界的交接欄位。接受的交接資料會在傳回成功前刪除，因此並行或重播的取用端無法同時接受它。PID 不相符時，資料會保留給相符的擁有者；缺少、過期及無效的資料列不會授權重新啟動。

有效的機器請求會傳回 JSON，結束代碼為 `0`，包括不重新啟動的結果。無效引數會傳回 `reason: "invalid-expected-pid"`，結束代碼為 `2`；狀態儲存區失敗會傳回 `reason: "store-unavailable"`，結束代碼為 `1`。監督程式應在實際要使用的執行階段或啟動程式上探測 `capabilities`，而不是根據 OpenClaw 版本字串推斷支援情況，或直接讀取私有 SQLite 結構描述。

### 閘道效能分析

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 會記錄啟動期間各階段的時間，包括各階段的 `eventLoopMax` 延遲，以及外掛查詢表時間（已安裝索引、資訊清單登錄、啟動規劃、擁有者對應工作）。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` 會記錄重新啟動範圍內的 `restart trace:` 行：訊號處理、進行中工作排空、關閉階段、下一次啟動、就緒時間及記憶體指標。
- `OPENCLAW_DIAGNOSTICS=timeline` 搭配 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`，會為外部 QA 測試工具寫入盡力而為的 JSONL 啟動診斷時間軸（等同於設定 `diagnostics.flags: ["timeline"]`；路徑仍只能透過環境變數設定）。加入 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件迴圈樣本。
- 先執行 `pnpm build`，再執行 `pnpm test:startup:gateway -- --runs 5 --warmup 1`，可針對建置後的命令列介面進入點進行閘道啟動效能評測：首次程序輸出、`/healthz`、`/readyz`、啟動追蹤時間、事件迴圈延遲及外掛查詢表時間。
- 先執行 `pnpm build`，再執行 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`，可在 macOS 或 Linux 上進行程序內重新啟動效能評測（Windows 不支援；重新啟動需要 `SIGUSR1`）。它會使用 `SIGUSR1`、在子程序中啟用兩種追蹤，並記錄下一個 `/healthz`、下一個 `/readyz`、停機時間、就緒時間、CPU、RSS 及重新啟動追蹤指標。
- `/healthz` 表示存活狀態；`/readyz` 表示可用的就緒狀態。請將追蹤行與效能評測輸出視為擁有者歸因訊號，而不是根據單一時間範圍或樣本得出的完整效能結論。

## 查詢正在執行的閘道

所有查詢命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="輸出模式">
    - 預設：人類可讀格式（在 TTY 中顯示色彩）。
    - `--json`：機器可讀的 JSON（無樣式／進度指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：停用 ANSI，同時保留人類可讀的版面配置。

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
設定 `--url` 時，命令列介面不會退回使用設定或環境中的認證資訊。請明確傳入 `--token` 或 `--password`。缺少明確認證資訊會產生錯誤。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` 是存活探測：只要伺服器能回應 HTTP，就會立即傳回。`/readyz` 的要求更嚴格，在啟動中的外掛 sidecar、頻道或已設定的鉤子仍在就緒過程中時，會持續顯示紅色。本機或經過驗證的詳細 `/readyz` 回應包含 `eventLoop` 診斷區塊（延遲、使用率、CPU 核心比率、`degraded` 旗標）。

<ParamField path="--port <port>" type="number">
  以此連接埠上的本機回送閘道為目標。針對此呼叫覆寫 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
</ParamField>

### `gateway usage-cost`

從工作階段記錄擷取用量成本摘要。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  要包含的天數。
</ParamField>
<ParamField path="--agent <id>" type="string">
  將摘要範圍限定為一個已設定的代理程式 ID。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  彙總所有已設定的代理程式。無法與 `--agent` 合併使用。
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
  要包含的近期事件數上限（最大值為 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  依診斷事件類型篩選，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  僅包含診斷序號之後的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  讀取持久儲存的穩定性套件，而非呼叫執行中的閘道。`--bundle latest`（或單獨的 `--bundle`）會選取狀態目錄下最新的套件；你也可以直接傳入套件 JSON 路徑。
</ParamField>
<ParamField path="--export" type="boolean">
  寫入可分享的支援診斷 ZIP，而非列印穩定性詳細資料。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的輸出路徑。
</ParamField>

<AccordionGroup>
  <Accordion title="隱私權與套件行為">
    - 記錄會保留操作中繼資料：事件名稱、計數、位元組大小、記憶體讀數、佇列／工作階段狀態、核准 ID、頻道／外掛名稱，以及經過遮蔽的工作階段摘要。其中不包含聊天文字、網路鉤子本文、工具輸出、原始要求／回應本文、權杖、Cookie、機密值、主機名稱及原始工作階段 ID。設定 `diagnostics.enabled: false` 可完全停用記錄器。
    - 當記錄器中有事件時，閘道的致命結束、關機逾時和重新啟動時的啟動失敗，會將相同的診斷快照寫入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 檢查最新套件；`--limit`、`--type` 和 `--since-seq` 也適用於套件輸出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

寫入專為錯誤報告設計的本機診斷 ZIP。關於隱私權模型與套件內容，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  輸出 ZIP 路徑。預設為狀態目錄下的支援匯出檔案。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的已清理記錄行數上限。
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
  狀態／健康狀態快照逾時。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  略過持久儲存的穩定性套件查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印寫入的路徑、大小和資訊清單。
</ParamField>

匯出套件包含：`manifest.json`（檔案清單）、`summary.md`（Markdown 摘要）、`diagnostics.json`（頂層設定／記錄／探索／穩定性／狀態／健康狀態摘要）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`，以及在套件存在時的 `stability/latest.json`。

此匯出套件專為分享而設計。它會保留對偵錯有用的操作詳細資料，包括安全的記錄欄位、子系統名稱、狀態碼、持續時間、已設定的模式、連接埠、外掛／提供者 ID、非機密功能設定，以及經過遮蔽的操作記錄訊息；並省略或遮蔽聊天文字、網路鉤子本文、工具輸出、認證資訊、Cookie、帳戶／訊息識別碼、提示詞／指示文字、主機名稱及機密值。當記錄訊息看起來像使用者／聊天／工具的承載資料文字（例如「使用者說了」、「聊天文字」、「工具輸出」、「網路鉤子本文」）時，匯出套件只會保留訊息已被省略的事實及其位元組數。

### `gateway status`

顯示閘道服務（launchd/systemd/schtasks），以及選用的連線能力／驗證探測。

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
  探測逾時。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  略過連線能力探測（僅顯示服務的檢視）。
</ParamField>
<ParamField path="--deep" type="boolean">
  也掃描系統層級服務。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  將連線能力探測升級為讀取探測，若失敗則以非零狀態結束。無法與 `--no-probe` 合併使用。
</ParamField>

<AccordionGroup>
  <Accordion title="狀態語意">
    - 即使本機命令列介面設定遺失或無效，仍可用於診斷。
    - 預設輸出可證明服務狀態、WebSocket 連線，以及交握時可見的驗證能力，但不代表讀取／寫入／管理員操作可用。
    - 對首次裝置驗證而言，探測不會造成變更：若已有快取的裝置權杖，便會加以重用，但絕不會只為檢查狀態而建立新的命令列介面裝置身分或唯讀配對記錄。
    - 可能時，會解析已設定的驗證 SecretRef 以供探測驗證使用。如果必要的 SecretRef 未解析，當探測連線能力／驗證失敗時，`--json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或修正機密來源。探測成功後，未解析驗證的警告將不再顯示。
    - 執行中的閘道回報 `gateway.version` 時，JSON 輸出會包含它；如果交握探測無法提供版本中繼資料，`--require-rpc` 可以改用 `status.runtimeVersion` RPC 承載資料。
    - 當僅有正在監聽的服務還不夠，且也需要讀取範圍的 RPC 保持健康時，請在指令碼／自動化中使用 `--require-rpc`。
    - `--deep` 會掃描額外的 launchd/systemd/schtasks 安裝項目；發現多個類似閘道的服務時，供人閱讀的輸出會列印清理提示（通常每台機器執行一個閘道），並在相關時回報近期的監督程式重新啟動移交。
    - `--deep` 也會以支援外掛的模式（`pluginValidation: "full"`）執行設定驗證，並顯示外掛資訊清單警告（例如缺少頻道設定中繼資料）。預設的 `gateway status` 會保留略過外掛驗證的快速唯讀路徑。
    - 供人閱讀的輸出包含解析後的檔案記錄路徑，以及命令列介面與服務各自的設定路徑／有效性，協助診斷設定檔或狀態目錄偏移。
    - 供人閱讀的輸出包含 `Gateway heap:`，其中會列出套用的限制及其調適性推導方式。JSON 輸出會以 `service.gatewayHeap` 提供相同的報告。

  </Accordion>
  <Accordion title="Linux systemd 驗證偏移檢查">
    - 服務驗證偏移檢查會從單元中讀取 `Environment=` 和 `EnvironmentFile=`（包括 `%h`、加上引號的路徑、多個檔案，以及選用的 `-` 檔案）。
    - 使用合併後的執行階段環境解析 `gateway.auth.token` SecretRef（服務命令環境優先，其次以程序環境作為備援）。
    - 當權杖驗證實際上未啟用時，權杖偏移檢查會略過設定權杖解析（`gateway.auth.mode` 明確為 `password`/`none`/`trusted-proxy`，或模式未設定、密碼可能優先且沒有權杖候選項可能勝出時）。

  </Accordion>
</AccordionGroup>

### `gateway probe`

「偵錯所有項目」命令。它一律會探測：

- 你已設定的遠端閘道（若有），以及
- localhost（回送），**即使已設定遠端目標**。

傳入 `--url` 會在這兩者之前新增該明確目標。供人閱讀的輸出會將目標標示為 `URL (explicit)`、`Remote (configured)` / `Remote (configured, inactive)` 和 `Local loopback`。

<Note>
如果可連線的探測目標不只一個，會全部列印出來。即使傳輸連接埠不同，SSH 通道、TLS／Proxy URL 和已設定的遠端 URL 仍可能指向同一個閘道；`multiple_gateways` 僅保留給彼此不同或身分不明確的可連線閘道。系統支援為隔離的設定檔執行多個閘道（例如救援機器人），但大多數安裝只會執行單一閘道。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  將此連接埠用於本機回送探測目標和 SSH 通道遠端連接埠。在未使用 `--url` 時，這只會選取本機回送目標，而不使用已設定的閘道環境 URL、環境連接埠或遠端目標。
</ParamField>

<AccordionGroup>
  <Accordion title="判讀方式">
    - `Reachable: yes` 表示至少有一個目標接受 WebSocket 連線。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 會回報探測可證實的驗證情況，與可連線性分開呈現。
    - `Read probe: ok` 表示讀取範圍的詳細 RPC 呼叫（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示連線成功，但讀取範圍的 RPC 受限。這會回報為**降級**的可連線性，而非完全失敗。
    - `Read probe: failed` 出現在 `Connect: ok` 之後，表示 WebSocket 已連線，但後續讀取診斷逾時或失敗；這同樣是**降級**狀態，而非無法連線。
    - 與 `gateway status` 相同，探測會重用既有的快取裝置驗證，但不會建立首次使用的裝置身分或配對狀態。
    - 只有在所有探測目標都無法連線時，結束代碼才會是非零值。

  </Accordion>
  <Accordion title="JSON 輸出">
    頂層：

    - `ok`：至少有一個目標可連線。
    - `degraded`：至少有一個目標接受了連線，但未完成完整詳細資料 RPC 診斷。
    - `capability`：在可連線目標中觀察到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：視為作用中優先目標的最佳目標，依序為：明確 URL、SSH 通道、已設定的遠端、localhost 回送。
    - `warnings[]`：包含 `code`、`message` 及選用 `targetIds` 的盡力而為警告記錄。
    - `network`：從目前設定和主機網路推導出的本機回送／tailnet URL 提示。
    - `discovery.timeoutMs` / `discovery.count`：此探測回合實際使用的探索預算／結果數量。

    每個目標（`targets[].connect`）：`ok`（可連線性與降級分類）、`rpcOk`（完整詳細資料 RPC 成功）、`scopeLimited`（因缺少操作員範圍而導致詳細資料 RPC 失敗）。

    每個目標（`targets[].auth`）：可用時，在 `hello-ok` 中回報 `role` 和 `scopes`，以及顯示的 `capability` 分類。

  </Accordion>
  <Accordion title="常見警告代碼">
    - `ssh_tunnel_failed`：SSH 通道設定失敗；命令已改用直接探測。
    - `multiple_gateways`：可連線至不同的閘道身分，或 OpenClaw 無法證明可連線的目標是同一個閘道。連至同一閘道的 SSH 通道、Proxy URL 或已設定的遠端 URL 不會觸發此警告。
    - `auth_secretref_unresolved`：無法解析失敗目標已設定的驗證 SecretRef。
    - `probe_scope_limited`：WebSocket 連線成功，但讀取探測因缺少 `operator.read` 而受限。
    - `local_tls_runtime_unavailable`：本機閘道已啟用 TLS，但 OpenClaw 無法載入本機憑證指紋。

  </Accordion>
</AccordionGroup>

#### 透過 SSH 遠端連線（與 Mac 應用程式一致）

macOS 應用程式的 "Remote over SSH" 模式使用本機連接埠轉送，讓僅限回送連線的遠端閘道可在 `ws://127.0.0.1:<port>` 連線。

等效的命令列介面命令：

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 或 `user@host:port`（連接埠預設為 `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  身分識別檔案。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  從已解析的探索端點中，選取第一個探索到的閘道主機作為 SSH 目標（`local.` 加上已設定的廣域網路網域，如有）。忽略僅限 TXT 的提示。
</ParamField>

設定預設值（選用）：`gateway.remote.sshTarget`、`gateway.remote.sshIdentity`。

### `gateway call <method>`

低階 RPC 輔助工具。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  用於參數的 JSON 物件字串。
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
  主要用於在最終承載資料前串流中間事件的代理程式型 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的 JSON 輸出。
</ParamField>

<Note>
`--params` 必須是有效的 JSON，且每個方法都會驗證自己的參數結構（多餘或名稱錯誤的欄位會遭拒絕）。
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

當受管理的服務必須透過其他可執行檔啟動時，請使用 `--wrapper`，例如密鑰管理程式 Shim 或切換執行身分的輔助工具。包裝程式會接收一般的閘道引數，並負責最終使用這些引數執行 `openclaw` 或 Node。

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

也可以透過環境設定包裝程式。`gateway install` 會驗證該路徑是否為可執行檔、將包裝程式寫入服務的 `ProgramArguments`，並在服務環境中保存 `OPENCLAW_WRAPPER`，供後續強制重新安裝、更新及 doctor 修復使用。

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
    - `gateway start` 具冪等性：受管理的服務已在執行時，會回報執行中的程序並保持不變。已載入但停止的服務則會如先前一樣啟動。
    - 請使用 `gateway restart` 重新啟動受管理的服務。請勿串接 `gateway stop` 和 `gateway start` 來取代重新啟動。
    - 在非互動式 Shell 中，`gateway stop` 需要 `--force`。互動式終端機會保留既有的無提示行為。對於自動化和測試，建議使用 `gateway run --dev`，或使用具有可用連接埠且隔離的 `--profile`。
    - 在 macOS 上，`gateway stop` 預設使用 `launchctl bootout`，這會從目前的開機工作階段移除 LaunchAgent，但不會永久停用；KeepAlive 自動復原對未來的當機仍保持啟用，且 `gateway start` 可乾淨地重新啟用，無須手動執行 `launchctl enable`。傳入 `--disable` 可永久抑制 KeepAlive 和 RunAtLoad，使閘道在下一次明確執行 `gateway start` 前不會重新產生；當手動停止需在重新開機後仍生效時，請使用此選項。
    - 閘道生命週期變更會將盡力而為的鍵值稽核記錄附加至 `<state-dir>/logs/gateway-restart.log`，包括命令列介面的啟動、停止和重新啟動操作、安全重新啟動要求、監督程式重新啟動，以及分離式交接。
    - 生命週期命令接受 `--json`，以供指令碼使用。

  </Accordion>
  <Accordion title="受管理閘道的 Heap 大小設定">
    - `gateway install` 會為受管理的閘道服務寫入僅限 Heap 的 `NODE_OPTIONS` 值。當 Node 回報容器或服務限制時，目標為受限記憶體的 50%；否則為實體記憶體的 50%。
    - 標稱目標範圍為 2048–8192 MiB，另有 75% 原生預留空間上限。在小型主機上，此預留空間上限可能使套用的限制低於標稱的 2048 MiB 下限。
    - 安裝的服務中已儲存的有效明確 `--max-old-space-size`，會在強制重新安裝和 doctor 修復時保留。其他 `NODE_OPTIONS` 旗標不會帶入受管理的服務。
    - Shell 環境中的 `NODE_OPTIONS` 不會覆寫此政策。請使用 `gateway status` 或 `doctor` 檢查已安裝的值；執行 `openclaw gateway install --force` 可重新產生沒有受管理 Heap 設定的舊版服務中繼資料。
    - 此政策僅適用於受管理的閘道服務。前景執行的 `gateway run`、Node 服務和手動編寫的監督程式單元會保留各自的執行階段設定。

  </Accordion>
  <Accordion title="安裝時的驗證與 SecretRef">
    - 當權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理時，`gateway install` 會驗證 SecretRef 是否可解析，但不會將解析出的權杖保存至服務環境中繼資料。
    - 如果權杖驗證需要權杖，但已設定的權杖 SecretRef 無法解析，安裝會採取封閉失敗，而不是保存備用純文字。
    - 對於 `gateway run` 上的密碼驗證，建議使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或以 SecretRef 為後端的 `gateway.auth.password`，而非內嵌的 `--password`。
    - 在推斷驗證模式下，僅存在於 Shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不會放寬安裝權杖要求；安裝受管理的服務時，請使用持久性設定（`gateway.auth.password` 或設定中的 `env`）。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，但未設定 `gateway.auth.mode`，安裝會遭封鎖，直到明確設定模式為止。

  </Accordion>
</AccordionGroup>

## 探索閘道（Bonjour）

`gateway discover` 會掃描閘道信標（`_openclaw-gw._tcp`）。

- 多點傳播 DNS-SD：`local.`
- 單點傳播 DNS-SD（廣域 Bonjour）：選擇一個網域（例如：`openclaw.internal.`），並設定分割 DNS 和 DNS 伺服器；請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

只有啟用 Bonjour 探索功能（預設值）的閘道會廣播信標。

每個信標上的 TXT 提示：`role`（閘道角色提示）、`transport`（傳輸提示，例如 `gateway`）、`gatewayPort`（WebSocket 連接埠，通常為 `18789`）、`tailnetDns`（MagicDNS 主機名稱，如有）、`gatewayTls` / `gatewayTlsSha256`（已啟用 TLS 與憑證指紋）。`sshPort` 和 `cliPath` 僅在完整探索模式下發布（`discovery.mdns.mode: "full"`；預設為 `"minimal"`，會省略這些項目，因此用戶端會將 SSH 目標連接埠預設為 `22`）。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每個命令的逾時時間（瀏覽／解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的輸出（同時停用樣式／進度指示器）。
</ParamField>

範例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- 掃描 `local.`，以及啟用時已設定的廣域網路網域。
- JSON 輸出中的 `wsUrl` 是從已解析的服務端點推導而來，而非來自 `lanHost` 或 `tailnetDns` 等僅限 TXT 的提示。
- `discovery.mdns.mode` 控制 `local.` mDNS 和廣域 DNS-SD 上的 `sshPort`/`cliPath` 發布（請參閱上文）。

</Note>

## 相關資訊

- [命令列介面參考](/zh-TW/cli)
- [閘道操作手冊](/zh-TW/gateway)
