---
read_when:
    - 從命令列介面執行閘道（開發或伺服器）
    - 偵錯閘道驗證、繫結模式與連線能力
    - 透過 Bonjour 探索閘道（本機 + 廣域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw 閘道命令列介面 (`openclaw gateway`) — 執行、查詢及探索閘道
title: 閘道
x-i18n:
    generated_at: "2026-06-27T19:05:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

閘道是 OpenClaw 的 WebSocket 伺服器（頻道、節點、工作階段、鉤子）。本頁的子命令位於 `openclaw gateway …` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour 探索" href="/zh-TW/gateway/bonjour">
    本機 mDNS + 廣域 DNS-SD 設定。
  </Card>
  <Card title="探索總覽" href="/zh-TW/gateway/discovery">
    OpenClaw 如何宣告與尋找閘道。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration">
    頂層閘道設定鍵。
  </Card>
</CardGroup>

## 執行閘道

執行本機閘道程序：

```bash
openclaw gateway
```

前景別名：

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="啟動行為">
    - 預設情況下，除非 `~/.openclaw/openclaw.json` 中設定了 `gateway.mode=local`，否則閘道會拒絕啟動。臨時/開發執行請使用 `--allow-unconfigured`。
    - `openclaw onboard --mode local` 和 `openclaw setup` 預期會寫入 `gateway.mode=local`。如果檔案存在但缺少 `gateway.mode`，請將其視為損壞或被覆寫的設定並修復，而不是隱含假設為本機模式。
    - 如果檔案存在且缺少 `gateway.mode`，閘道會將其視為可疑的設定損壞，並拒絕替你「猜測本機」。
    - 未啟用驗證時，禁止繫結到 loopback 以外的範圍（安全防護欄）。
    - `lan`、`tailnet` 和 `custom` 目前會透過僅限 IPv4 的 BYOH 路徑解析。
    - 這條路徑目前不原生支援僅 IPv6 的 BYOH。如果主機本身僅支援 IPv6，請使用 IPv4 sidecar 或代理。
    - `SIGUSR1` 會在授權時觸發程序內重新啟動（`commands.restart` 預設啟用；設定 `commands.restart: false` 可阻止手動重新啟動，同時仍允許套用/更新閘道工具/設定）。
    - `SIGINT`/`SIGTERM` 處理常式會停止閘道程序，但不會還原任何自訂終端狀態。如果你用終端介面或 raw-mode 輸入包裝命令列介面，請在結束前還原終端。

  </Accordion>
</AccordionGroup>

### 選項

<ParamField path="--port <port>" type="number">
  WebSocket 連接埠（預設值來自設定/環境；通常是 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  監聽器繫結模式。`lan`、`tailnet` 和 `custom` 目前會透過僅限 IPv4 的路徑解析。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  驗證模式覆寫。
</ParamField>
<ParamField path="--token <token>" type="string">
  Token 覆寫（也會為程序設定 `OPENCLAW_GATEWAY_TOKEN`）。
</ParamField>
<ParamField path="--password <password>" type="string">
  密碼覆寫。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  從檔案讀取閘道密碼。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  透過 Tailscale 暴露閘道。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  關閉時重設 Tailscale serve/funnel 設定。
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  目前預期使用 IPv4 位址。對於僅 IPv6 的 BYOH，請在閘道前放置 IPv4 sidecar 或代理，並將 OpenClaw 指向該 IPv4 端點。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允許在設定中沒有 `gateway.mode=local` 的情況下啟動閘道。僅為臨時/開發啟動繞過啟動防護；不會寫入或修復設定檔。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺少開發設定 + 工作區，則建立它們（略過 BOOTSTRAP.md）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重設開發設定 + 認證 + 工作階段 + 工作區（需要 `--dev`）。
</ParamField>
<ParamField path="--force" type="boolean">
  啟動前終止所選連接埠上的任何既有監聽器。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細日誌。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  只在主控台顯示命令列介面後端日誌（並啟用 stdout/stderr）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket 日誌樣式。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` 的別名。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  將原始模型串流事件記錄到 jsonl。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  原始串流 jsonl 路徑。
</ParamField>

## 重新啟動閘道

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` 會要求執行中的閘道在重新啟動前預檢作用中的 OpenClaw 工作。如果佇列操作、回覆傳遞、嵌入式執行或任務執行仍在作用中，閘道會回報阻擋項目、合併重複的安全重新啟動要求，並在作用中工作清空後重新啟動。一般 `restart` 會保留既有服務管理器行為以維持相容性。只有在你明確想要立即覆寫路徑時才使用 `--force`。

`openclaw gateway restart --safe --skip-deferral` 會執行與 `--safe` 相同的 OpenClaw 感知協調式重新啟動，但會繞過作用中工作延後閘門，因此即使回報了阻擋項目，閘道也會立即發出重新啟動。當延後因卡住的任務執行而被釘住，且單獨使用 `--safe` 會無限期等待時，請將它用作操作員逃生口。`--skip-deferral` 需要 `--safe`。

<Warning>
內嵌 `--password` 可能會在本機程序清單中暴露。請優先使用 `--password-file`、環境變數，或由 SecretRef 支援的 `gateway.auth.password`。
</Warning>

### 閘道效能分析

- 設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 可在閘道啟動期間記錄各階段計時，包括每階段的 `eventLoopMax` 延遲，以及 installed-index、manifest registry、啟動規劃與 owner-map 工作的外掛查詢表計時。
- 設定 `OPENCLAW_GATEWAY_RESTART_TRACE=1` 可記錄重新啟動範圍的 `restart trace:` 行，涵蓋重新啟動訊號處理、作用中工作清空、關閉階段、下一次啟動、就緒計時與記憶體指標。
- 搭配 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` 設定 `OPENCLAW_DIAGNOSTICS=timeline`，可為外部 QA harness 寫入盡力而為的 JSONL 啟動診斷時間軸。你也可以在設定中使用 `diagnostics.flags: ["timeline"]` 啟用此旗標；路徑仍由環境提供。加入 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件迴圈樣本。
- 先執行 `pnpm build`，再執行 `pnpm test:startup:gateway -- --runs 5 --warmup 1`，以針對建置後的命令列介面進入點進行閘道啟動基準測試。此基準會記錄第一個程序輸出、`/healthz`、`/readyz`、啟動追蹤計時、事件迴圈延遲，以及外掛查詢表計時詳細資料。
- 先執行 `pnpm build`，再執行 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`，以在 macOS 或 Linux 上針對建置後的命令列介面進入點進行程序內閘道重新啟動基準測試。重新啟動基準會使用 SIGUSR1，在子程序中啟用啟動與重新啟動追蹤，並記錄下一個 `/healthz`、下一個 `/readyz`、停機時間、就緒計時、CPU、RSS 與重新啟動追蹤指標。
- 將 `/healthz` 視為存活性，將 `/readyz` 視為可用就緒性。追蹤行與基準輸出用於歸因給擁有者；不要將單一追蹤區段或單一樣本視為完整的效能結論。

## 查詢執行中的閘道

所有查詢命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="輸出模式">
    - 預設：人類可讀（在 TTY 中著色）。
    - `--json`：機器可讀 JSON（無樣式/旋轉指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：停用 ANSI，同時保留人類版面。

  </Tab>
  <Tab title="共用選項">
    - `--url <url>`：閘道 WebSocket URL。
    - `--token <token>`：閘道 token。
    - `--password <password>`：閘道密碼。
    - `--timeout <ms>`：逾時/預算（依命令而異）。
    - `--expect-final`：等待「final」回應（代理呼叫）。

  </Tab>
</Tabs>

<Note>
設定 `--url` 時，命令列介面不會回退到設定或環境認證。請明確傳入 `--token` 或 `--password`。缺少明確認證會造成錯誤。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP `/healthz` 端點是存活性探針：伺服器能回應 HTTP 後就會回傳。HTTP `/readyz` 端點更嚴格，會在啟動外掛 sidecar、頻道或已設定鉤子仍在穩定期間維持紅色。本機或已驗證的詳細就緒回應會包含 `eventLoop` 診斷區塊，其中有事件迴圈延遲、事件迴圈利用率、CPU 核心比例，以及 `degraded` 旗標。

<ParamField path="--port <port>" type="number">
  以此連接埠上的 local loopback 閘道為目標。這會覆寫健康檢查呼叫的 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
</ParamField>

### `gateway usage-cost`

從工作階段日誌擷取使用成本摘要。

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
  將成本摘要限定到一個已設定的代理 id。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  彙總所有已設定代理的成本摘要。不能與 `--agent` 合併使用。
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
  要包含的近期事件最大數量（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  依診斷事件類型篩選，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  僅包含診斷序號之後的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  讀取持久化的穩定性套件，而不是呼叫執行中的閘道。使用 `--bundle latest`（或只用 `--bundle`）讀取狀態目錄下最新的套件，或直接傳入套件 JSON 路徑。
</ParamField>
<ParamField path="--export" type="boolean">
  寫入可分享的支援診斷 zip，而不是列印穩定性詳細資料。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的輸出路徑。
</ParamField>

<AccordionGroup>
  <Accordion title="隱私與套件行為">
    - 記錄會保留操作中繼資料：事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、頻道/外掛名稱，以及已遮蔽的工作階段摘要。它們不會保留聊天文字、網路鉤子內容、工具輸出、原始要求或回應內容、token、cookie、秘密值、主機名稱，或原始工作階段 id。設定 `diagnostics.enabled: false` 可完全停用記錄器。
    - 在致命閘道退出、關閉逾時與重新啟動啟動失敗時，如果記錄器有事件，OpenClaw 會將相同的診斷快照寫入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 檢查最新套件；`--limit`、`--type` 和 `--since-seq` 也適用於套件輸出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

寫入本機診斷 zip，設計用於附加到錯誤回報。關於隱私模型與套件內容，請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  輸出 zip 路徑。預設為狀態目錄下的支援匯出。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的已清理記錄行數上限。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要檢查的記錄位元組數上限。
</ParamField>
<ParamField path="--url <url>" type="string">
  健康快照的閘道 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  健康快照的閘道權杖。
</ParamField>
<ParamField path="--password <password>" type="string">
  健康快照的閘道密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  狀態/健康快照逾時。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  略過已保存的穩定性套件查詢。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 印出寫入路徑、大小與資訊清單。
</ParamField>

匯出內容包含資訊清單、Markdown 摘要、設定形狀、已清理的設定詳細資料、已清理的記錄摘要、已清理的閘道狀態/健康快照，以及存在時最新的穩定性套件。

它的用途是供分享。它會保留有助於除錯的操作細節，例如安全的 OpenClaw 記錄欄位、子系統名稱、狀態碼、持續時間、已設定模式、連接埠、外掛 ID、提供者 ID、非機密功能設定，以及已遮蔽的操作記錄訊息。它會省略或遮蔽聊天文字、網路鉤子本文、工具輸出、憑證、Cookie、帳號/訊息識別碼、提示/指令文字、主機名稱與密鑰值。當 LogTape 風格訊息看起來像使用者/聊天/工具承載文字時，匯出只會保留該訊息已被省略以及其位元組數。

### `gateway status`

`gateway status` 會顯示閘道服務（launchd/systemd/schtasks），並可選擇探測連線能力/驗證能力。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  新增明確的探測目標。仍會探測已設定的遠端與 localhost。
</ParamField>
<ParamField path="--token <token>" type="string">
  探測的權杖驗證。
</ParamField>
<ParamField path="--password <password>" type="string">
  探測的密碼驗證。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探測逾時。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  略過連線探測（僅服務檢視）。
</ParamField>
<ParamField path="--deep" type="boolean">
  同時掃描系統層級服務。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  將預設連線探測升級為讀取探測，並在該讀取探測失敗時以非零狀態結束。不能與 `--no-probe` 合併使用。
</ParamField>

<AccordionGroup>
  <Accordion title="狀態語義">
    - 即使本機命令列介面設定遺失或無效，`gateway status` 仍可用於診斷。
    - 預設的 `gateway status` 會證明服務狀態、WebSocket 連線，以及握手時可見的驗證能力。它不會證明讀取/寫入/管理操作。
    - 診斷探測對首次裝置驗證不會造成變更：存在既有快取裝置權杖時會重用，但不會為了檢查狀態而建立新的命令列介面裝置身分或唯讀裝置配對記錄。
    - `gateway status` 會在可能時解析已設定的驗證 SecretRefs 以用於探測驗證。
    - 如果此命令路徑中必要的驗證 SecretRef 未解析，當探測連線/驗證失敗時，`gateway status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析密鑰來源。
    - 如果探測成功，未解析驗證參照警告會被抑制，以避免誤報。
    - 啟用探測時，如果執行中的閘道有回報版本，JSON 輸出會包含 `gateway.version`；如果後續握手探測無法提供版本中繼資料，`--require-rpc` 可以退回使用 `status.runtimeVersion` RPC 承載。
    - 當監聽服務還不夠，而且你也需要讀取範圍 RPC 呼叫保持健康時，請在指令碼與自動化中使用 `--require-rpc`。
    - `--deep` 會盡力額外掃描 launchd/systemd/schtasks 安裝。偵測到多個類似閘道的服務時，人類可讀輸出會列印清理提示，並警告多數設定應該每台機器只執行一個閘道。
    - 當服務程序為外部監督程式重啟而乾淨結束時，`--deep` 也會回報最近一次閘道監督程式重啟交接。
    - `--deep` 會以外掛感知模式（`pluginValidation: "full"`）執行設定驗證，並顯示已設定外掛的資訊清單警告（例如缺少頻道設定中繼資料），讓安裝與更新冒煙檢查能捕捉這些問題。預設的 `gateway status` 會保留快速唯讀路徑，略過外掛驗證。
    - 人類可讀輸出包含解析後的檔案記錄路徑，以及命令列介面與服務設定路徑/有效性快照，以協助診斷設定檔或狀態目錄漂移。

  </Accordion>
  <Accordion title="Linux systemd 驗證漂移檢查">
    - 在 Linux systemd 安裝中，服務驗證漂移檢查會從單元讀取 `Environment=` 與 `EnvironmentFile=` 值（包含 `%h`、加引號的路徑、多個檔案，以及可選的 `-` 檔案）。
    - 漂移檢查會使用合併後的執行階段環境解析 `gateway.auth.token` SecretRefs（先使用服務命令環境，再退回程序環境）。
    - 如果權杖驗證實際上未啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或模式未設定且密碼可勝出、沒有權杖候選可勝出），權杖漂移檢查會略過設定權杖解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是「除錯所有項目」命令。它一律探測：

- 你已設定的遠端閘道（若已設定），以及
- localhost（local loopback）**即使已設定遠端**。

如果傳入 `--url`，該明確目標會加在兩者前面。人類可讀輸出會將目標標示為：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果多個探測目標可連線，它會全部印出。SSH 通道、TLS/代理 URL，以及已設定的遠端 URL 即使傳輸連接埠不同，也可能都指向同一個閘道；`multiple_gateways` 保留給不同或身分模糊的可連線閘道。當你使用隔離設定檔（例如救援機器人）時支援多個閘道，但多數安裝仍只執行單一閘道。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  將此連接埠用於 local loopback 探測目標與 SSH 通道遠端連接埠。沒有 `--url` 時，這會選取 local loopback 目標，而不是已設定的閘道環境 URL、環境連接埠或遠端目標。
</ParamField>

<AccordionGroup>
  <Accordion title="解讀">
    - `Reachable: yes` 表示至少一個目標接受了 WebSocket 連線。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 回報探測能證明的驗證能力。它與可連線性是分開的。
    - `Read probe: ok` 表示讀取範圍詳細 RPC 呼叫（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示連線成功，但讀取範圍 RPC 受限。這會回報為**降級**可連線性，而不是完整失敗。
    - `Read probe: failed` 出現在 `Connect: ok` 之後，表示閘道接受了 WebSocket 連線，但後續讀取診斷逾時或失敗。這也是**降級**可連線性，而不是無法連線的閘道。
    - 和 `gateway status` 一樣，探測會重用既有快取裝置驗證，但不會建立首次裝置身分或配對狀態。
    - 只有在沒有任何被探測目標可連線時，結束碼才會是非零。

  </Accordion>
  <Accordion title="JSON 輸出">
    頂層：

    - `ok`：至少一個目標可連線。
    - `degraded`：至少一個目標接受了連線，但未完成完整詳細 RPC 診斷。
    - `capability`：在可連線目標中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：依下列順序視為作用中勝出者的最佳目標：明確 URL、SSH 通道、已設定遠端，然後 local loopback。
    - `warnings[]`：盡力提供的警告記錄，包含 `code`、`message` 與可選的 `targetIds`。
    - `network`：從目前設定與主機網路衍生的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` 與 `discovery.count`：此探測回合使用的實際探索預算/結果數。

    每個目標（`targets[].connect`）：

    - `ok`：連線後的可連線性 + 降級分類。
    - `rpcOk`：完整詳細 RPC 成功。
    - `scopeLimited`：詳細 RPC 因缺少操作員範圍而失敗。

    每個目標（`targets[].auth`）：

    - `role`：可用時，`hello-ok` 中回報的驗證角色。
    - `scopes`：可用時，`hello-ok` 中回報的已授予範圍。
    - `capability`：該目標顯示的驗證能力分類。

  </Accordion>
  <Accordion title="常見警告碼">
    - `ssh_tunnel_failed`：SSH 通道設定失敗；命令退回直接探測。
    - `multiple_gateways`：不同的閘道身分可連線，或 OpenClaw 無法證明可連線目標是同一個閘道。指向同一個閘道的 SSH 通道、代理 URL 或已設定遠端 URL 不會觸發此警告。
    - `auth_secretref_unresolved`：無法為失敗目標解析已設定的驗證 SecretRef。
    - `probe_scope_limited`：WebSocket 連線成功，但讀取探測因缺少 `operator.read` 而受限。

  </Accordion>
</AccordionGroup>

#### 透過 SSH 遠端（Mac app 同等功能）

macOS app「透過 SSH 遠端」模式使用本機連接埠轉發，讓遠端閘道（可能只繫結到 loopback）可在 `ws://127.0.0.1:<port>` 連線。

命令列介面同等命令：

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
  從已解析的探索端點（`local.` 加上已設定的廣域網域，若有）選取第一個探索到的閘道主機作為 SSH 目標。僅 TXT 的提示會被忽略。
</ParamField>

設定（可選，用作預設值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低階 RPC 輔助工具。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params 的 JSON 物件字串。
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
<ParamField path="--timeout <ms>" type="number">
  逾時預算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用於會在最終承載前串流中間事件的代理程式風格 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀 JSON 輸出。
</ParamField>

<Note>
`--params` 必須是有效的 JSON。
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

當受管理服務必須透過另一個可執行檔啟動時，請使用 `--wrapper`，例如
機密管理器墊片或 run-as 輔助程式。包裝器會接收一般閘道參數，並
負責最後以這些參數 exec `openclaw` 或節點。

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

你也可以透過環境設定包裝器。`gateway install` 會驗證路徑是
可執行檔，將包裝器寫入服務 `ProgramArguments`，並在服務環境中保留
`OPENCLAW_WRAPPER`，供後續強制重新安裝、更新和 doctor
修復使用。

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
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="生命週期行為">
    - 使用 `gateway restart` 重新啟動受管理服務。不要串接 `gateway stop` 和 `gateway start` 來替代重新啟動。
    - 在 macOS 上，`gateway stop` 預設使用 `launchctl bootout`，這會從目前開機工作階段移除 LaunchAgent，而不會保留停用狀態 — KeepAlive 自動復原在未來當機時仍會保持作用，且 `gateway start` 可乾淨地重新啟用，不需要手動執行 `launchctl enable`。傳入 `--disable` 可持久抑制 KeepAlive 和 RunAtLoad，讓閘道在下一次明確執行 `gateway start` 前不會重新衍生；當手動停止需要在重新開機或系統重新啟動後仍然有效時，請使用此選項。
    - `gateway restart --safe` 會要求正在執行的閘道預先檢查作用中的 OpenClaw 工作，並延後重新啟動，直到回覆傳遞、嵌入式執行和任務執行都排空。`--safe` 不能與 `--force` 或 `--wait` 一起使用。
    - `gateway restart --wait 30s` 會覆寫該次重新啟動的已設定重新啟動排空預算。單純數字表示毫秒；也接受 `s`、`m` 和 `h` 等單位。`--wait 0` 會無限期等待。
    - `gateway restart --safe --skip-deferral` 會執行具 OpenClaw 感知能力的安全重新啟動，但略過延後閘門，因此即使回報了阻擋項目，閘道也會立即發出重新啟動。這是卡住任務執行延後時的操作員逃生閥；需要 `--safe`。
    - `gateway restart --force` 會略過作用中工作排空並立即重新啟動。當操作員已檢查列出的任務阻擋項目，並希望閘道立即恢復時使用。
    - 生命週期命令接受 `--json` 以供指令碼使用。

  </Accordion>
  <Accordion title="安裝時的驗證與 SecretRefs">
    - 當權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理時，`gateway install` 會驗證 SecretRef 可解析，但不會將解析後的權杖保留到服務環境中繼資料。
    - 如果權杖驗證需要權杖，而設定的權杖 SecretRef 無法解析，安裝會以失敗關閉方式中止，而不是保留後援明文。
    - 在 `gateway run` 上使用密碼驗證時，優先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`，或以 SecretRef 支援的 `gateway.auth.password`，而不是行內 `--password`。
    - 在推斷驗證模式中，僅限 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不會放寬安裝權杖需求；安裝受管理服務時，請使用持久設定（`gateway.auth.password` 或設定 `env`）。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，安裝會被阻擋，直到明確設定模式為止。

  </Accordion>
</AccordionGroup>

## 探索閘道（Bonjour）

`gateway discover` 會掃描閘道信標（`_openclaw-gw._tcp`）。

- 多播 DNS-SD：`local.`
- 單播 DNS-SD（廣域 Bonjour）：選擇一個網域（例如：`openclaw.internal.`），並設定分割 DNS + DNS 伺服器；請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

只有啟用 Bonjour 探索（預設）的閘道會宣告信標。

廣域探索記錄可包含這些 TXT 提示：

- `role`（閘道角色提示）
- `transport`（傳輸提示，例如 `gateway`）
- `gatewayPort`（WebSocket 連接埠，通常為 `18789`）
- `sshPort`（僅限完整探索模式；當它不存在時，用戶端預設 SSH 目標為 `22`）
- `tailnetDns`（MagicDNS 主機名稱，可用時）
- `gatewayTls` / `gatewayTlsSha256`（已啟用 TLS + 憑證指紋）
- `cliPath`（僅限完整探索模式）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每個命令的逾時時間（瀏覽/解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀輸出（也會停用樣式/旋轉指示器）。
</ParamField>

範例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- 命令列介面會掃描 `local.`，以及啟用時已設定的廣域網域。
- JSON 輸出中的 `wsUrl` 是從解析後的服務端點衍生，而不是從僅限 TXT 的提示（例如 `lanHost` 或 `tailnetDns`）衍生。
- 在 `local.` mDNS 和廣域 DNS-SD 上，只有當 `discovery.mdns.mode` 為 `full` 時，才會發布 `sshPort` 和 `cliPath`。

</Note>

## 相關

- [命令列介面參考](/zh-TW/cli)
- [閘道操作手冊](/zh-TW/gateway)
