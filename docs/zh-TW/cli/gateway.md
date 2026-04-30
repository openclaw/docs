---
read_when:
    - 從 CLI 執行 Gateway（開發環境或伺服器）
    - 偵錯 Gateway 驗證、綁定模式與連線能力
    - 透過 Bonjour 探索 Gateway（本地 + 廣域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — 執行、查詢並探索 Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-30T02:53:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Gateway 是 OpenClaw 的 WebSocket 伺服器（通道、節點、工作階段、hook）。本頁中的子命令位於 `openclaw gateway …` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/zh-TW/gateway/bonjour">
    本機 mDNS + 廣域 DNS-SD 設定。
  </Card>
  <Card title="Discovery overview" href="/zh-TW/gateway/discovery">
    OpenClaw 如何宣告與尋找 Gateway。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration">
    頂層 Gateway 設定鍵。
  </Card>
</CardGroup>

## 執行 Gateway

執行本機 Gateway 處理程序：

```bash
openclaw gateway
```

前景別名：

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - 根據預設，除非 `~/.openclaw/openclaw.json` 中設定了 `gateway.mode=local`，否則 Gateway 會拒絕啟動。針對臨時/開發執行，請使用 `--allow-unconfigured`。
    - `openclaw onboard --mode local` 和 `openclaw setup` 預期會寫入 `gateway.mode=local`。如果檔案存在但缺少 `gateway.mode`，請將其視為損壞或遭覆寫的設定，並修復它，而不是隱含假設為本機模式。
    - 如果檔案存在且缺少 `gateway.mode`，Gateway 會將其視為可疑的設定損壞，並拒絕替你「猜測為本機」。
    - 未使用驗證卻繫結到 loopback 之外會被封鎖（安全護欄）。
    - `SIGUSR1` 會在授權時觸發處理程序內重啟（預設啟用 `commands.restart`；設定 `commands.restart: false` 可封鎖手動重啟，同時仍允許 Gateway 工具/設定套用/更新）。
    - `SIGINT`/`SIGTERM` 處理常式會停止 Gateway 處理程序，但不會還原任何自訂終端機狀態。如果你用 TUI 或 raw-mode 輸入包裝 CLI，請在結束前還原終端機。

  </Accordion>
</AccordionGroup>

### 選項

<ParamField path="--port <port>" type="number">
  WebSocket 連接埠（預設值來自設定/env；通常是 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  監聽器繫結模式。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  驗證模式覆寫。
</ParamField>
<ParamField path="--token <token>" type="string">
  Token 覆寫（也會為處理程序設定 `OPENCLAW_GATEWAY_TOKEN`）。
</ParamField>
<ParamField path="--password <password>" type="string">
  密碼覆寫。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  從檔案讀取 Gateway 密碼。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  透過 Tailscale 公開 Gateway。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  關閉時重設 Tailscale serve/funnel 設定。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允許在設定中沒有 `gateway.mode=local` 時啟動 Gateway。僅針對臨時/開發啟動流程繞過啟動防護；不會寫入或修復設定檔。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺少開發設定 + 工作區，則建立它們（略過 BOOTSTRAP.md）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重設開發設定 + 憑證 + 工作階段 + 工作區（需要 `--dev`）。
</ParamField>
<ParamField path="--force" type="boolean">
  啟動前終止所選連接埠上的任何現有監聽器。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細記錄。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  只在主控台中顯示 CLI 後端記錄（並啟用 stdout/stderr）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket 記錄樣式。
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

<Warning>
內嵌 `--password` 可能會暴露在本機處理程序清單中。請優先使用 `--password-file`、env，或由 SecretRef 支援的 `gateway.auth.password`。
</Warning>

### 啟動分析

- 設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`，以在 Gateway 啟動期間記錄各階段計時，包括每階段的 `eventLoopMax` 延遲，以及 installed-index、manifest registry、啟動規劃和 owner-map 工作的 Plugin 查找表計時。
- 設定 `OPENCLAW_DIAGNOSTICS=timeline` 搭配 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`，以為外部 QA 測試工具寫入盡力而為的 JSONL 啟動診斷時間軸。你也可以在設定中使用 `diagnostics.flags: ["timeline"]` 啟用該旗標；路徑仍由 env 提供。加入 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件迴圈樣本。
- 執行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 來對 Gateway 啟動進行基準測試。該基準測試會記錄第一個處理程序輸出、`/healthz`、`/readyz`、啟動追蹤計時、事件迴圈延遲，以及 Plugin 查找表計時詳細資料。

## 查詢執行中的 Gateway

所有查詢命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="Output modes">
    - 預設：人類可讀（在 TTY 中著色）。
    - `--json`：機器可讀 JSON（無樣式/spinner）。
    - `--no-color`（或 `NO_COLOR=1`）：停用 ANSI，同時保留人類版面。

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`：Gateway WebSocket URL。
    - `--token <token>`：Gateway token。
    - `--password <password>`：Gateway 密碼。
    - `--timeout <ms>`：逾時/預算（依命令而異）。
    - `--expect-final`：等待「final」回應（agent 呼叫）。

  </Tab>
</Tabs>

<Note>
設定 `--url` 時，CLI 不會退回使用設定或環境憑證。請明確傳入 `--token` 或 `--password`。缺少明確憑證會導致錯誤。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端點是存活探針：當伺服器能回應 HTTP 時即會返回。HTTP `/readyz` 端點更嚴格，會在啟動 sidecar、通道或已設定的 hook 仍在穩定中時維持紅燈。本機或已驗證的詳細就緒回應會包含 `eventLoop` 診斷區塊，其中有事件迴圈延遲、事件迴圈使用率、CPU 核心比率，以及 `degraded` 旗標。

### `gateway usage-cost`

從工作階段記錄擷取使用成本摘要。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  要包含的天數。
</ParamField>

### `gateway stability`

從執行中的 Gateway 擷取近期診斷穩定性記錄器。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要包含的近期事件數量上限（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  依診斷事件類型篩選，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  只包含診斷序號之後的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  讀取持久化的穩定性 bundle，而不是呼叫執行中的 Gateway。使用 `--bundle latest`（或只用 `--bundle`）可取得狀態目錄下最新的 bundle，或直接傳入 bundle JSON 路徑。
</ParamField>
<ParamField path="--export" type="boolean">
  寫入可分享的支援診斷 zip，而不是列印穩定性詳細資料。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的輸出路徑。
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - 記錄會保留作業中繼資料：事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、通道/Plugin 名稱，以及已遮蔽的工作階段摘要。它們不會保留聊天文字、webhook 內文、工具輸出、原始請求或回應內文、token、cookie、秘密值、主機名稱或原始工作階段 ID。設定 `diagnostics.enabled: false` 可完全停用記錄器。
    - 在 Gateway 發生致命結束、關閉逾時和重啟啟動失敗時，如果記錄器有事件，OpenClaw 會將相同的診斷快照寫入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 檢查最新 bundle；`--limit`、`--type` 和 `--since-seq` 也適用於 bundle 輸出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

寫入本機診斷 zip，設計用於附加到錯誤回報。隱私模型和 bundle 內容請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。

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
  用於健康狀態快照的 Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  用於健康狀態快照的 Gateway token。
</ParamField>
<ParamField path="--password <password>" type="string">
  用於健康狀態快照的 Gateway 密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  狀態/健康狀態快照逾時。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  略過持久化穩定性 bundle 查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印寫入的路徑、大小和 manifest。
</ParamField>

匯出內容包含 manifest、Markdown 摘要、設定形狀、已清理的設定詳細資料、已清理的記錄摘要、已清理的 Gateway 狀態/健康狀態快照，以及存在時的最新穩定性 bundle。

它的用途是分享。它會保留有助於偵錯的作業詳細資料，例如安全的 OpenClaw 記錄欄位、子系統名稱、狀態碼、持續時間、已設定模式、連接埠、Plugin ID、提供者 ID、非秘密功能設定，以及已遮蔽的作業記錄訊息。它會省略或遮蔽聊天文字、webhook 內文、工具輸出、憑證、cookie、帳號/訊息識別碼、提示/指令文字、主機名稱和秘密值。當 LogTape 風格的訊息看起來像使用者/聊天/工具 payload 文字時，匯出只會保留訊息已被省略及其位元組數。

### `gateway status`

`gateway status` 顯示 Gateway 服務（launchd/systemd/schtasks），並可選擇探測連線能力/驗證能力。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  加入明確的探測目標。仍會探測已設定的遠端 + localhost。
</ParamField>
<ParamField path="--token <token>" type="string">
  探測使用的 token 驗證。
</ParamField>
<ParamField path="--password <password>" type="string">
  探測使用的密碼驗證。
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
  將預設連線能力探測升級為讀取探測，並在該讀取探測失敗時以非零狀態結束。不能與 `--no-probe` 合併使用。
</ParamField>

<AccordionGroup>
  <Accordion title="狀態語意">
    - `gateway status` 即使在本機 CLI 設定缺失或無效時，仍可用於診斷。
    - 預設 `gateway status` 會證明服務狀態、WebSocket 連線，以及握手時可見的驗證能力。它不會證明讀取/寫入/管理操作。
    - 診斷探測對首次裝置驗證不會進行變更：若既有的快取裝置 token 存在，會重用該 token，但不會只為了檢查狀態而建立新的 CLI 裝置身分或唯讀裝置配對記錄。
    - `gateway status` 會在可能時解析已設定的驗證 SecretRefs，以供探測驗證使用。
    - 如果此命令路徑中必要的驗證 SecretRef 未解析，當探測連線/驗證失敗時，`gateway status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析祕密來源。
    - 如果探測成功，未解析的 auth-ref 警告會被抑制，以避免誤報。
    - 在指令碼和自動化中，當只要服務正在監聽還不夠，且也需要讀取範圍的 RPC 呼叫保持健康時，請使用 `--require-rpc`。
    - `--deep` 會加入盡力掃描，以尋找額外的 launchd/systemd/schtasks 安裝。偵測到多個類似 gateway 的服務時，人類可讀輸出會列印清理提示，並警告大多數設定應該在每台機器上只執行一個 gateway。
    - 人類可讀輸出包含解析後的檔案日誌路徑，以及 CLI 與服務設定路徑/有效性的快照，以協助診斷 profile 或 state-dir 漂移。

  </Accordion>
  <Accordion title="Linux systemd 驗證漂移檢查">
    - 在 Linux systemd 安裝中，服務驗證漂移檢查會從 unit 讀取 `Environment=` 和 `EnvironmentFile=` 值（包含 `%h`、加引號的路徑、多個檔案，以及選用的 `-` 檔案）。
    - 漂移檢查會使用合併後的執行階段 env 解析 `gateway.auth.token` SecretRefs（先用服務命令 env，再 fallback 到程序 env）。
    - 如果 token 驗證未實際啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或 mode 未設定且 password 可以勝出、沒有 token 候選可以勝出），token 漂移檢查會略過設定 token 解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是「除錯所有項目」命令。它一律會探測：

- 你設定的遠端 gateway（如果已設定），以及
- localhost (loopback)，**即使已設定遠端**。

如果你傳入 `--url`，該明確目標會加在兩者之前。人類可讀輸出會將目標標示為：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果多個 gateway 可連線，它會列印所有 gateway。當你使用隔離的 profiles/ports（例如救援 bot）時，支援多個 gateway，但大多數安裝仍只執行單一 gateway。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解讀">
    - `Reachable: yes` 表示至少有一個目標接受了 WebSocket 連線。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 會回報探測能證明的驗證能力。它與可連線性分開。
    - `Read probe: ok` 表示讀取範圍的詳細 RPC 呼叫（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示連線成功，但讀取範圍 RPC 受限。這會回報為**降級**可連線性，而不是完全失敗。
    - `Connect: ok` 之後的 `Read probe: failed` 表示 Gateway 接受了 WebSocket 連線，但後續讀取診斷逾時或失敗。這也屬於**降級**可連線性，而不是 Gateway 無法連線。
    - 與 `gateway status` 一樣，probe 會重用既有的快取裝置驗證，但不會建立首次裝置身分或配對狀態。
    - 只有在沒有任何已探測目標可連線時，退出碼才會是非零。

  </Accordion>
  <Accordion title="JSON 輸出">
    最上層：

    - `ok`：至少有一個目標可連線。
    - `degraded`：至少有一個目標接受連線，但未完成完整的詳細 RPC 診斷。
    - `capability`：在可連線目標中觀察到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：依此順序作為作用中勝出者的最佳目標：明確 URL、SSH tunnel、已設定遠端，然後是 local loopback。
    - `warnings[]`：盡力產生的警告記錄，包含 `code`、`message`，以及選用的 `targetIds`。
    - `network`：從目前設定與主機網路推導出的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：此探測回合使用的實際 discovery 預算/結果數量。

    每個目標（`targets[].connect`）：

    - `ok`：連線加上降級分類後的可連線性。
    - `rpcOk`：完整詳細 RPC 成功。
    - `scopeLimited`：詳細 RPC 因缺少 operator scope 而失敗。

    每個目標（`targets[].auth`）：

    - `role`：可用時，`hello-ok` 中回報的驗證角色。
    - `scopes`：可用時，`hello-ok` 中回報的已授權 scopes。
    - `capability`：該目標呈現出的驗證能力分類。

  </Accordion>
  <Accordion title="常見警告代碼">
    - `ssh_tunnel_failed`：SSH tunnel 設定失敗；命令 fallback 到直接探測。
    - `multiple_gateways`：有超過一個目標可連線；除非你刻意執行隔離的 profiles，例如救援 bot，否則這很不尋常。
    - `auth_secretref_unresolved`：無法為失敗目標解析已設定的驗證 SecretRef。
    - `probe_scope_limited`：WebSocket 連線成功，但讀取探測因缺少 `operator.read` 而受限。

  </Accordion>
</AccordionGroup>

#### 透過 SSH 遠端連線（Mac app parity）

macOS app 的「Remote over SSH」模式使用本機 port-forward，因此遠端 gateway（可能只綁定到 loopback）會在 `ws://127.0.0.1:<port>` 可連線。

CLI 等效命令：

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 或 `user@host:port`（port 預設為 `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  身分檔案。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  從解析後的 discovery endpoint（`local.` 加上已設定的 wide-area domain，如果有）選取第一個發現的 gateway host 作為 SSH 目標。只含 TXT 的提示會被忽略。
</ParamField>

設定（選用，作為預設值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低階 RPC 輔助命令。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params 的 JSON object 字串。
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway token。
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway password。
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  逾時預算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用於 agent-style RPC，這類 RPC 會在最終 payload 前串流中間事件。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀 JSON 輸出。
</ParamField>

<Note>
`--params` 必須是有效的 JSON。
</Note>

## 管理 Gateway 服務

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### 使用 wrapper 安裝

當受管理服務必須透過另一個執行檔啟動時，請使用 `--wrapper`，例如
secrets manager shim 或 run-as helper。wrapper 會收到一般 Gateway args，並
負責最終 exec `openclaw` 或帶有這些 args 的 Node。

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

你也可以透過環境設定 wrapper。`gateway install` 會驗證該路徑是
可執行檔，將 wrapper 寫入服務 `ProgramArguments`，並在服務環境中持久化
`OPENCLAW_WRAPPER`，供之後強制重新安裝、更新與 doctor
修復使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

若要移除持久化的 wrapper，請在重新安裝時清空 `OPENCLAW_WRAPPER`：

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="命令選項">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node|bun>`、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway uninstall|start|stop|restart`：`--json`

  </Accordion>
  <Accordion title="生命週期行為">
    - 使用 `gateway restart` 重新啟動受管理服務。不要串接 `gateway stop` 和 `gateway start` 來替代重新啟動；在 macOS 上，`gateway stop` 會刻意在停止前停用 LaunchAgent。
    - 生命週期命令接受 `--json` 以供指令碼使用。

  </Accordion>
  <Accordion title="安裝時的驗證與 SecretRefs">
    - 當 token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理時，`gateway install` 會驗證 SecretRef 可解析，但不會將解析後的 token 持久化到服務環境中繼資料。
    - 如果 token 驗證需要 token，且已設定的 token SecretRef 未解析，安裝會封閉失敗，而不是持久化 fallback plaintext。
    - 對於 `gateway run` 的 password 驗證，建議使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`，或以 SecretRef 支援的 `gateway.auth.password`，而不是 inline `--password`。
    - 在推斷驗證模式中，僅限 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不會放寬安裝 token 需求；安裝受管理服務時，請使用持久設定（`gateway.auth.password` 或 config `env`）。
    - 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，安裝會被阻擋，直到明確設定 mode。

  </Accordion>
</AccordionGroup>

## 探索 gateways（Bonjour）

`gateway discover` 會掃描 Gateway beacons（`_openclaw-gw._tcp`）。

- Multicast DNS-SD：`local.`
- Unicast DNS-SD（Wide-Area Bonjour）：選擇一個 domain（範例：`openclaw.internal.`）並設定 split DNS 與 DNS server；請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

只有啟用 Bonjour discovery（預設）的 gateways 會宣告 beacon。

Wide-Area discovery records 包含（TXT）：

- `role`（gateway role 提示）
- `transport`（transport 提示，例如 `gateway`）
- `gatewayPort`（WebSocket port，通常是 `18789`）
- `sshPort`（選用；缺少時 clients 預設 SSH 目標為 `22`）
- `tailnetDns`（MagicDNS hostname，可用時）
- `gatewayTls` / `gatewayTlsSha256`（TLS 已啟用 + cert fingerprint）
- `cliPath`（寫入 wide-area zone 的 remote-install 提示）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每個命令的逾時（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀輸出（也會停用樣式/spinner）。
</ParamField>

範例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI 會掃描 `local.`，並在啟用時掃描已設定的廣域網域。
- JSON 輸出中的 `wsUrl` 是從已解析的服務端點衍生而來，而不是來自僅 TXT 的提示，例如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 上，只有當 `discovery.mdns.mode` 為 `full` 時，才會廣播 `sshPort` 和 `cliPath`。廣域 DNS-SD 仍會寫入 `cliPath`；`sshPort` 在那裡也維持選用。

</Note>

## 相關內容

- [CLI 參考](/zh-TW/cli)
- [Gateway 運行手冊](/zh-TW/gateway)
