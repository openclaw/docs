---
read_when:
    - 從命令列介面執行閘道（開發或伺服器）
    - 偵錯閘道驗證、繫結模式與連線能力
    - 透過 Bonjour 探索閘道（本機 + 廣域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw 閘道命令列介面 (`openclaw gateway`) — 執行、查詢並探索閘道
title: 閘道
x-i18n:
    generated_at: "2026-07-05T11:08:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb1eb4aaba7681699f6048fc9a91b4117e90f20f24c9a696f688f0ac3b39a49e
    source_path: cli/gateway.md
    workflow: 16
---

閘道是 OpenClaw 的 WebSocket 伺服器（通道、節點、工作階段、掛鉤）。以下所有子命令都位於 `openclaw gateway ...` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/zh-TW/gateway/bonjour">
    本機 mDNS + 廣域 DNS-SD 設定。
  </Card>
  <Card title="Discovery overview" href="/zh-TW/gateway/discovery">
    OpenClaw 如何宣告並尋找閘道。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration">
    頂層閘道設定鍵。
  </Card>
</CardGroup>

## 執行閘道

```bash
openclaw gateway
openclaw gateway run   # equivalent, explicit form
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - 除非 `~/.openclaw/openclaw.json` 中已設定 `gateway.mode=local`，否則會拒絕啟動。針對臨時/開發執行可使用 `--allow-unconfigured`；它會略過防護，但不會寫入或修復設定。
    - `openclaw onboard --mode local` 和 `openclaw setup` 會寫入 `gateway.mode=local`。如果設定檔存在但缺少 `gateway.mode`，會被視為損壞/遭覆寫的設定，閘道不會替你猜測 `local`；請重新執行上線設定、手動設定該鍵，或傳入 `--allow-unconfigured`。
    - 未使用驗證時，會阻擋超出 loopback 的綁定。
    - `--bind` 值 `lan`、`tailnet` 和 `custom` 目前會透過僅 IPv4 路徑解析；僅 IPv6 的自帶主機設定需要在閘道前方放置 IPv4 sidecar 或 proxy。
    - 授權時，`SIGUSR1` 會觸發程序內重新啟動。`commands.restart`（預設：啟用）會控管外部送出的 `SIGUSR1`；將它設為 `false` 可阻擋手動 OS 訊號重新啟動，同時仍允許透過 `gateway restart` 命令、閘道工具，以及設定套用/更新來重新啟動。
    - `SIGINT`/`SIGTERM` 會停止程序，但不會還原自訂終端機狀態；如果你將命令列介面包在終端介面或 raw-mode 輸入中，請在結束前自行還原終端機。

  </Accordion>
</AccordionGroup>

### 選項

<ParamField path="--port <port>" type="number">
  WebSocket 連接埠（預設來自設定/env；通常是 `18789`）。
</ParamField>
<ParamField path="--bind <mode>" type="string">
  綁定模式：`loopback`（預設）、`lan`、`tailnet`、`auto`、`custom`。
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` 的共享權杖。設定時預設為 `OPENCLAW_GATEWAY_TOKEN`。
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
  Tailscale 暴露方式：`off`、`serve`、`funnel`。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  關閉時重設 Tailscale serve/funnel 設定。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  不強制 `gateway.mode=local` 即啟動。僅供臨時/開發 bootstrap 使用；不會持久化或修復設定。
</ParamField>
<ParamField path="--dev" type="boolean">
  若缺少開發設定 + 工作區，則建立它們（略過 `BOOTSTRAP.md`）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重設開發設定、憑證、工作階段和工作區。需要 `--dev`。
</ParamField>
<ParamField path="--force" type="boolean">
  啟動前先終止目標連接埠上任何既有 listener。
</ParamField>
<ParamField path="--verbose" type="boolean">
  將詳細記錄輸出到 stdout/stderr。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  只在主控台顯示命令列介面後端記錄（也會啟用 stdout/stderr）。
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket 記錄樣式：`auto`、`full`、`compact`。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` 的別名。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  將原始模型串流事件記錄到 JSONL。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  原始串流 JSONL 路徑。
</ParamField>

`--claude-cli-logs` 是 `--cli-backend-logs` 的已棄用別名。

對於 `--bind custom`，請將 `gateway.customBindHost` 設為 IPv4 位址；如果該位址不可用，閘道會退回到 `0.0.0.0`。僅 IPv6 的自帶主機設定需要在閘道前方放置 IPv4 sidecar 或 proxy。

## 重新啟動閘道

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` 會要求執行中的閘道預先檢查作用中的工作，並在該工作排空後排程一次合併的重新啟動。等待時間受 `gateway.reload.deferralTimeoutMs` 限制（預設：5 分鐘 / `300000`）；當預算用盡時會強制重新啟動。將 `deferralTimeoutMs: 0` 設為無限期等待（並定期發出仍在等待的警告），而不是強制執行。`--safe` 不能與 `--force` 或 `--wait` 搭配使用。

`--skip-deferral` 會在安全重新啟動時略過作用中工作延遲門檻，因此即使回報了 blocker，閘道也會立即重新啟動。它需要 `--safe`；當延遲卡在失控工作上時使用。

`--wait <duration>` 會覆寫一般（非 safe）重新啟動的排空預算。接受裸毫秒或單位後綴 `ms`、`s`、`m`、`h`、`d`（例如 `30s`、`5m`、`1h30m`）；`--wait 0` 會無限期等待。與 `--force` 或 `--safe` 不相容。

`--force` 會略過作用中工作排空並立即重新啟動。一般 `restart`（沒有旗標）會保留既有 service-manager 重新啟動行為。

<Warning>
行內 `--password` 可能會暴露在本機程序清單中。請優先使用 `--password-file`、env，或由 SecretRef 支援的 `gateway.auth.password`。
</Warning>

### 閘道 profiling

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 會在啟動期間記錄階段計時，包括每個階段的 `eventLoopMax` 延遲與外掛 lookup-table 計時（installed-index、manifest registry、startup planning、owner-map work）。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` 會記錄重新啟動範圍的 `restart trace:` 行：訊號處理、作用中工作排空、關閉階段、下一次啟動、就緒計時，以及記憶體指標。
- `OPENCLAW_DIAGNOSTICS=timeline` 搭配 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`，會為外部 QA harness 寫入 best-effort JSONL 啟動診斷 timeline（等同於設定 `diagnostics.flags: ["timeline"]`；路徑仍僅能透過 env 設定）。加入 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含 event-loop samples。
- `pnpm build` 然後 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 會以已建置的命令列介面進入點 benchmark 閘道啟動：第一個程序輸出、`/healthz`、`/readyz`、啟動 trace 計時、event-loop 延遲，以及外掛 lookup-table 計時。
- `pnpm build` 然後 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` 會在 macOS 或 Linux 上 benchmark 程序內重新啟動（Windows 不支援；重新啟動需要 `SIGUSR1`）。使用 `SIGUSR1`、在子程序中啟用兩種 trace，並記錄下一個 `/healthz`、下一個 `/readyz`、停機時間、就緒計時、CPU、RSS，以及重新啟動 trace 指標。
- `/healthz` 是 liveness；`/readyz` 是可用 readiness。請將 trace 行和 benchmark 輸出視為 owner-attribution 訊號，而不是來自單一 span 或 sample 的完整效能結論。

## 查詢執行中的閘道

所有查詢命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="Output modes">
    - 預設：人類可讀（TTY 中有色彩）。
    - `--json`：機器可讀 JSON（無樣式/spinner）。
    - `--no-color`（或 `NO_COLOR=1`）：停用 ANSI，同時保留人類版面配置。

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`：閘道 WebSocket URL。
    - `--token <token>`：閘道權杖。
    - `--password <password>`：閘道密碼。
    - `--timeout <ms>`：逾時/預算（預設因命令而異；請見下方各命令）。
    - `--expect-final`：等待 "final" 回應（agent calls）。

  </Tab>
</Tabs>

<Note>
當你設定 `--url` 時，命令列介面不會退回使用設定或環境憑證。請明確傳入 `--token` 或 `--password`。缺少明確憑證會導致錯誤。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` 是 liveness probe：只要伺服器能回應 HTTP 就會傳回。`/readyz` 更嚴格，當啟動外掛 sidecar、通道或已設定掛鉤仍在穩定時會維持紅燈。本機或已驗證的詳細 `/readyz` 回應會包含 `eventLoop` 診斷區塊（延遲、使用率、CPU-core ratio、`degraded` 旗標）。

<ParamField path="--port <port>" type="number">
  以此連接埠上的 local loopback 閘道為目標。針對此呼叫覆寫 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
</ParamField>

### `gateway usage-cost`

從工作階段記錄擷取 usage-cost 摘要。

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
  將摘要範圍限定為一個已設定的 agent id。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  彙總所有已設定的 agent。不能與 `--agent` 搭配使用。
</ParamField>

### `gateway stability`

從執行中的閘道擷取最近的診斷穩定性 recorder。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要納入的最近事件上限（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  依診斷事件類型篩選，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  只納入診斷序號之後的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  讀取已持久化的穩定性 bundle，而不是呼叫執行中的閘道。`--bundle latest`（或裸 `--bundle`）會選擇狀態目錄下最新的 bundle；你也可以直接傳入 bundle JSON 路徑。
</ParamField>
<ParamField path="--export" type="boolean">
  寫入可共享的支援診斷 zip，而不是列印穩定性詳細資料。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的輸出路徑。
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - 記錄會保留操作中繼資料：事件名稱、計數、位元組大小、記憶體讀數、queue/session 狀態、approval id、通道/外掛名稱，以及已遮蔽的工作階段摘要。它們會排除聊天文字、webhook bodies、工具輸出、原始 request/response bodies、權杖、cookies、secret values、主機名稱，以及原始 session id。設定 `diagnostics.enabled: false` 可完全停用 recorder。
    - 致命閘道結束、關閉逾時與重新啟動啟動失敗，會在 recorder 有事件時將相同診斷快照寫入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 檢查最新 bundle；`--limit`、`--type` 和 `--since-seq` 也會套用於 bundle 輸出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

寫入為 bug report 設計的本機診斷 zip。如需隱私模型與 bundle 內容，請見 [診斷匯出](/zh-TW/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  輸出 zip 路徑。預設為狀態目錄下的支援匯出。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的已清理敏感資訊記錄行數上限。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要檢查的記錄位元組數上限。
</ParamField>
<ParamField path="--url <url>" type="string">
  健康快照的閘道 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  健康快照的閘道 token。
</ParamField>
<ParamField path="--password <password>" type="string">
  健康快照的閘道密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  狀態/健康快照逾時。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  略過已持久化的穩定性套件組合查詢。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印已寫入路徑、大小與資訊清單。
</ParamField>

匯出套件組合包含：`manifest.json`（檔案清單）、`summary.md`（Markdown 摘要）、`diagnostics.json`（頂層設定/記錄/探索/穩定性/狀態/健康摘要）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`，以及存在套件組合時的 `stability/latest.json`。

它設計為可分享。它保留對除錯有用的操作細節，包括安全的記錄欄位、子系統名稱、狀態碼、持續時間、已設定模式、連接埠、外掛/提供者 ID、非機密功能設定，以及已遮蔽的操作記錄訊息，並省略或遮蔽聊天文字、網路鉤子本文、工具輸出、認證資料、Cookie、帳號/訊息識別碼、提示/指令文字、主機名稱與秘密值。當記錄訊息看起來像使用者/聊天/工具酬載文字（例如「user said」、「chat text」、「tool output」、「webhook body」）時，匯出只保留訊息已省略這件事及其位元組數。

### `gateway status`

顯示閘道服務（launchd/systemd/schtasks）以及選用的連線能力/驗證探測。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  加入明確的探測目標。已設定的遠端 + localhost 仍會被探測。
</ParamField>
<ParamField path="--token <token>" type="string">
  探測的 token 驗證。
</ParamField>
<ParamField path="--password <password>" type="string">
  探測的密碼驗證。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探測逾時。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  略過連線能力探測（僅服務檢視）。
</ParamField>
<ParamField path="--deep" type="boolean">
  也掃描系統層級服務。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  將連線能力探測升級為讀取探測，若失敗則以非零狀態碼結束。不能與 `--no-probe` 合併使用。
</ParamField>

<AccordionGroup>
  <Accordion title="狀態語意">
    - 即使本機命令列介面設定遺失或無效，仍可用於診斷。
    - 預設輸出會證明服務狀態、WebSocket 連線，以及握手時可見的驗證能力，而不是讀取/寫入/管理員操作。
    - 探測對首次裝置驗證不會變更狀態：當既有快取裝置 token 存在時會重用它，但絕不會只為了檢查狀態而建立新的命令列介面裝置身分或唯讀配對記錄。
    - 可能時，會解析已設定的驗證 SecretRefs 作為探測驗證。如果必要的 SecretRef 無法解析，當探測連線能力/驗證失敗時，`--json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或修正秘密來源。一旦探測成功，未解析驗證警告會被抑制。
    - 當執行中的閘道回報版本時，JSON 輸出會包含 `gateway.version`；如果握手探測無法提供版本中繼資料，`--require-rpc` 可退回使用 `status.runtimeVersion` RPC 酬載。
    - 在腳本/自動化中，如果只有服務正在監聽還不夠，且也需要讀取範圍 RPC 健康，請使用 `--require-rpc`。
    - `--deep` 會掃描額外的 launchd/systemd/schtasks 安裝；當找到多個類似閘道的服務時，人類可讀輸出會列印清理提示（通常每台機器執行一個閘道），並在相關時回報最近的監督程式重新啟動交接。
    - `--deep` 也會以外掛感知模式（`pluginValidation: "full"`）執行設定驗證，並顯示外掛資訊清單警告（例如缺少通道設定中繼資料）。預設 `gateway status` 會保留快速唯讀路徑，略過外掛驗證。
    - 人類可讀輸出會包含已解析的檔案記錄路徑，以及命令列介面與服務設定路徑/有效性，以協助診斷設定檔或狀態目錄漂移。

  </Accordion>
  <Accordion title="Linux systemd 驗證漂移檢查">
    - 服務驗證漂移檢查會從 unit 讀取 `Environment=` 與 `EnvironmentFile=`（包括 `%h`、加上引號的路徑、多個檔案，以及選用的 `-` 檔案）。
    - 使用合併後的執行時環境（先服務命令環境，然後程序環境後援）解析 `gateway.auth.token` SecretRefs。
    - 當 token 驗證實際上未啟用時（`gateway.auth.mode` 明確為 `password`/`none`/`trusted-proxy`，或模式未設定且密碼可勝出且沒有 token 候選可勝出），token 漂移檢查會略過設定 token 解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

「除錯所有項目」命令。它一律探測：

- 你已設定的遠端閘道（如果已設定），以及
- localhost（loopback），**即使已設定遠端**。

傳入 `--url` 會把該明確目標加在兩者之前。人類可讀輸出會將目標標示為 `URL (explicit)`、`Remote (configured)` / `Remote (configured, inactive)`，以及 `Local loopback`。

<Note>
如果多個探測目標可連線，全部都會列印。SSH tunnel、TLS/proxy URL 與已設定的遠端 URL 可以指向同一個閘道，即使使用不同傳輸連接埠；`multiple_gateways` 保留給不同或身分模糊的可連線閘道。支援為隔離設定檔執行多個閘道（例如救援 bot），但大多數安裝會執行單一閘道。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  將此連接埠用於 local loopback 探測目標與 SSH tunnel 遠端連接埠。沒有 `--url` 時，這只會選取 local loopback 目標，而不是已設定的閘道環境 URL、環境連接埠或遠端目標。
</ParamField>

<AccordionGroup>
  <Accordion title="解讀">
    - `Reachable: yes` 表示至少一個目標接受了 WebSocket 連線。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 回報探測可證明的驗證能力，與可連線性分開。
    - `Read probe: ok` 表示讀取範圍詳細 RPC 呼叫（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示連線成功，但讀取範圍 RPC 受限。回報為**降級**可連線性，而不是完整失敗。
    - `Read probe: failed` 在 `Connect: ok` 之後表示 WebSocket 已連線，但後續讀取診斷逾時或失敗，同樣是**降級**，不是無法連線。
    - 和 `gateway status` 一樣，探測會重用既有快取裝置驗證，但不會建立首次裝置身分或配對狀態。
    - 只有在沒有任何已探測目標可連線時，結束碼才會是非零。

  </Accordion>
  <Accordion title="JSON 輸出">
    頂層：

    - `ok`：至少一個目標可連線。
    - `degraded`：至少一個目標接受連線，但未完成完整詳細 RPC 診斷。
    - `capability`：在可連線目標中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：應視為作用中勝出者的最佳目標，順序為：明確 URL、SSH tunnel、已設定遠端、local loopback。
    - `warnings[]`：盡力而為的警告記錄，包含 `code`、`message`、選用的 `targetIds`。
    - `network`：從目前設定與主機網路衍生的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` / `discovery.count`：此探測通過實際使用的探索預算/結果數。

    每個目標（`targets[].connect`）：`ok`（可連線性 + 降級分類）、`rpcOk`（完整詳細 RPC 成功）、`scopeLimited`（詳細 RPC 因缺少 operator 範圍而失敗）。

    每個目標（`targets[].auth`）：可用時在 `hello-ok` 中回報的 `role` 與 `scopes`，以及顯示的 `capability` 分類。

  </Accordion>
  <Accordion title="常見警告代碼">
    - `ssh_tunnel_failed`：SSH tunnel 設定失敗；命令已退回直接探測。
    - `multiple_gateways`：不同閘道身分可連線，或 OpenClaw 無法證明可連線目標是同一個閘道。指向同一個閘道的 SSH tunnel、proxy URL 或已設定遠端 URL 不會觸發此代碼。
    - `auth_secretref_unresolved`：無法為失敗目標解析已設定的驗證 SecretRef。
    - `probe_scope_limited`：WebSocket 連線成功，但讀取探測受限於缺少 `operator.read`。
    - `local_tls_runtime_unavailable`：本機閘道 TLS 已啟用，但 OpenClaw 無法載入本機憑證指紋。

  </Accordion>
</AccordionGroup>

#### 透過 SSH 遠端（Mac 應用程式等效性）

macOS 應用程式的「Remote over SSH」模式使用本機連接埠轉送，讓僅限 loopback 的遠端閘道可在 `ws://127.0.0.1:<port>` 連線。

命令列介面等效：

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
  從已解析的探索端點（`local.` 加上已設定的廣域網域，如果有）選取第一個探索到的閘道主機作為 SSH 目標。僅 TXT 的提示會被忽略。
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
  閘道 token。
</ParamField>
<ParamField path="--password <password>" type="string">
  閘道密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  逾時預算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用於會在最終酬載之前串流中介事件的 agent 風格 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的 JSON 輸出。
</ParamField>

<Note>
`--params` 必須是有效 JSON，且每個方法會驗證自己的參數形狀（額外/命名錯誤的欄位會被拒絕）。
</Note>

## 管理閘道服務

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### 使用包裝器安裝

當受管理的服務必須透過另一個可執行檔啟動時，請使用 `--wrapper`，例如秘密管理器 shim 或 run-as 輔助工具。包裝器會接收一般閘道參數，並負責最終以這些參數 exec `openclaw` 或節點。

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

你也可以透過環境設定包裝器。`gateway install` 會驗證該路徑是可執行檔，將包裝器寫入服務的 `ProgramArguments`，並在服務環境中保留 `OPENCLAW_WRAPPER`，供後續強制重新安裝、更新與 doctor 修復使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

若要移除已保留的包裝器，請在重新安裝時清空 `OPENCLAW_WRAPPER`：

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="命令選項">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`（預設：`node`）、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="生命週期行為">
    - 使用 `gateway restart` 重新啟動受管理服務。不要串接 `gateway stop` 和 `gateway start` 作為重新啟動的替代方式。
    - 在 macOS 上，`gateway stop` 預設使用 `launchctl bootout`，這會從目前開機工作階段移除 LaunchAgent，而不會保留停用狀態；KeepAlive 自動復原會在未來當機時維持作用，且 `gateway start` 會乾淨地重新啟用，不需要手動執行 `launchctl enable`。傳入 `--disable` 可持續抑制 KeepAlive 和 RunAtLoad，讓閘道在下一次明確執行 `gateway start` 前不會重新產生；當手動停止需要在重新開機後仍然有效時，請使用此選項。
    - 生命週期命令接受 `--json` 以便撰寫指令碼。

  </Accordion>
  <Accordion title="安裝時的驗證與 SecretRefs">
    - 當權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理時，`gateway install` 會驗證 SecretRef 可解析，但不會將解析後的權杖保留到服務環境中繼資料。
    - 如果權杖驗證需要權杖，而已設定的權杖 SecretRef 無法解析，安裝會失敗關閉，而不是保留備援明文。
    - 對於 `gateway run` 上的密碼驗證，優先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`，或由 SecretRef 支援的 `gateway.auth.password`，而不是行內 `--password`。
    - 在推斷驗證模式中，僅存在於 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不會放寬安裝權杖需求；安裝受管理服務時，請使用持久設定（`gateway.auth.password` 或設定 `env`）。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，安裝會被阻擋，直到明確設定模式為止。

  </Accordion>
</AccordionGroup>

## 探索閘道（Bonjour）

`gateway discover` 會掃描閘道信標（`_openclaw-gw._tcp`）。

- 多播 DNS-SD：`local.`
- 單播 DNS-SD（廣域 Bonjour）：選擇一個網域（範例：`openclaw.internal.`）並設定 split DNS + DNS 伺服器；請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

只有啟用 Bonjour 探索（預設）的閘道會公告信標。

每個信標上的 TXT 提示：`role`（閘道角色提示）、`transport`（傳輸提示，例如 `gateway`）、`gatewayPort`（WebSocket 連接埠，通常是 `18789`）、`tailnetDns`（MagicDNS 主機名稱，可用時）、`gatewayTls` / `gatewayTlsSha256`（TLS 已啟用 + 憑證指紋）。`sshPort` 和 `cliPath` 只會在完整探索模式中發布（`discovery.mdns.mode: "full"`；預設是 `"minimal"`，會省略它們；用戶端接著會將預設 SSH 目標設為連接埠 `22`）。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每個命令的逾時時間（瀏覽/解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀輸出（也會停用樣式/旋轉器）。
</ParamField>

範例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- 會掃描 `local.`，以及啟用時已設定的廣域網域。
- JSON 輸出中的 `wsUrl` 來自解析後的服務端點，而不是僅存在於 TXT 的提示，例如 `lanHost` 或 `tailnetDns`。
- `discovery.mdns.mode` 控制 `local.` mDNS 和廣域 DNS-SD 上的 `sshPort`/`cliPath` 發布（見上文）。

</Note>

## 相關

- [命令列介面參考](/zh-TW/cli)
- [閘道操作手冊](/zh-TW/gateway)
