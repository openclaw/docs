---
read_when:
    - 從 CLI 執行 Gateway（開發或伺服器）
    - 偵錯 Gateway 身分驗證、繫結模式與連線能力
    - 透過 Bonjour 探索 Gateway（本機 + 廣域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — 執行、查詢並探索 Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-04T18:23:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 310867c59148577f2e8ce6f708da6bce936e09243ce7fbe5daeb453c6b3b370d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway 是 OpenClaw 的 WebSocket 伺服器（通道、節點、工作階段、hook）。本頁中的子命令位於 `openclaw gateway …` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour 探索" href="/zh-TW/gateway/bonjour">
    本機 mDNS + 廣域 DNS-SD 設定。
  </Card>
  <Card title="探索概覽" href="/zh-TW/gateway/discovery">
    OpenClaw 如何公布並尋找 Gateway。
  </Card>
  <Card title="組態" href="/zh-TW/gateway/configuration">
    頂層 Gateway 組態鍵。
  </Card>
</CardGroup>

## 執行 Gateway

執行本機 Gateway 程序：

```bash
openclaw gateway
```

前景別名：

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="啟動行為">
    - 依預設，除非 `~/.openclaw/openclaw.json` 中設定了 `gateway.mode=local`，否則 Gateway 會拒絕啟動。針對臨時/開發執行，請使用 `--allow-unconfigured`。
    - `openclaw onboard --mode local` 和 `openclaw setup` 預期會寫入 `gateway.mode=local`。如果檔案存在但缺少 `gateway.mode`，請將其視為損壞或被覆寫的組態並修復，而不是隱含假設為本機模式。
    - 如果檔案存在且缺少 `gateway.mode`，Gateway 會將其視為可疑的組態損壞，並拒絕替你「猜測為本機」。
    - 未經驗證就綁定到 loopback 以外的位置會被封鎖（安全護欄）。
    - `SIGUSR1` 會在獲授權時觸發程序內重新啟動（`commands.restart` 預設啟用；設定 `commands.restart: false` 可封鎖手動重新啟動，同時仍允許 Gateway 工具/組態套用/更新）。
    - `SIGINT`/`SIGTERM` 處理常式會停止 Gateway 程序，但不會還原任何自訂終端狀態。如果你用 TUI 或原始模式輸入包裝 CLI，請在結束前還原終端。

  </Accordion>
</AccordionGroup>

### 選項

<ParamField path="--port <port>" type="number">
  WebSocket 連接埠（預設來自組態/環境；通常是 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  監聽器綁定模式。
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
  從檔案讀取 Gateway 密碼。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  透過 Tailscale 暴露 Gateway。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  關閉時重設 Tailscale serve/funnel 組態。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允許在組態中沒有 `gateway.mode=local` 時啟動 Gateway。僅針對臨時/開發啟動程序繞過啟動護欄；不會寫入或修復組態檔。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺少，建立開發組態 + 工作區（略過 BOOTSTRAP.md）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重設開發組態 + 認證 + 工作階段 + 工作區（需要 `--dev`）。
</ParamField>
<ParamField path="--force" type="boolean">
  啟動前終止所選連接埠上的任何既有監聽器。
</ParamField>
<ParamField path="--verbose" type="boolean">
  詳細記錄。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  僅在主控台顯示 CLI 後端記錄（並啟用 stdout/stderr）。
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

## 重新啟動 Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` 會要求執行中的 Gateway 在重新啟動前預檢作用中的 OpenClaw 工作。如果佇列作業、回覆遞送、嵌入式執行或任務執行仍在作用中，Gateway 會回報阻礙項目，合併重複的安全重新啟動請求，並在作用中工作清空後重新啟動。純 `restart` 會保留既有的服務管理員行為以維持相容性。只有在你明確想要立即覆寫路徑時才使用 `--force`。

<Warning>
行內 `--password` 可能會暴露在本機程序清單中。請優先使用 `--password-file`、環境變數，或由 SecretRef 支援的 `gateway.auth.password`。
</Warning>

### 啟動效能剖析

- 設定 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`，可在 Gateway 啟動期間記錄各階段耗時，包括每階段的 `eventLoopMax` 延遲，以及已安裝索引、manifest 登錄、啟動規劃和 owner-map 工作的 Plugin 查找表耗時。
- 設定 `OPENCLAW_DIAGNOSTICS=timeline` 搭配 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`，可為外部 QA 測試架構寫入盡力而為的 JSONL 啟動診斷時間軸。你也可以在組態中使用 `diagnostics.flags: ["timeline"]` 啟用此旗標；路徑仍由環境提供。加入 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件迴圈樣本。
- 執行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 來基準測試 Gateway 啟動。此基準測試會記錄第一個程序輸出、`/healthz`、`/readyz`、啟動追蹤耗時、事件迴圈延遲，以及 Plugin 查找表耗時細節。

## 查詢執行中的 Gateway

所有查詢命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="輸出模式">
    - 預設：人類可讀（TTY 中會有色彩）。
    - `--json`：機器可讀 JSON（無樣式/旋轉指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：停用 ANSI，同時保留人類可讀版面。

  </Tab>
  <Tab title="共用選項">
    - `--url <url>`：Gateway WebSocket URL。
    - `--token <token>`：Gateway token。
    - `--password <password>`：Gateway 密碼。
    - `--timeout <ms>`：逾時/預算（依命令而異）。
    - `--expect-final`：等待「final」回應（agent 呼叫）。

  </Tab>
</Tabs>

<Note>
當你設定 `--url` 時，CLI 不會回退使用組態或環境認證。請明確傳入 `--token` 或 `--password`。缺少明確認證是一項錯誤。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端點是存活探針：伺服器能回應 HTTP 時就會回傳。HTTP `/readyz` 端點更嚴格，會在啟動中的 Plugin sidecar、通道或已設定 hook 仍在穩定時維持紅燈。本機或已驗證的詳細就緒回應包含 `eventLoop` 診斷區塊，其中有事件迴圈延遲、事件迴圈使用率、CPU 核心比例，以及 `degraded` 旗標。

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

從執行中的 Gateway 擷取最近的診斷穩定性記錄器。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要包含的近期事件數上限（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  依診斷事件類型篩選，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  僅包含診斷序號之後的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  讀取持久化的穩定性套件，而不是呼叫執行中的 Gateway。針對狀態目錄下最新的套件，請使用 `--bundle latest`（或只用 `--bundle`），或直接傳入套件 JSON 路徑。
</ParamField>
<ParamField path="--export" type="boolean">
  寫入可分享的支援診斷 zip，而不是列印穩定性細節。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的輸出路徑。
</ParamField>

<AccordionGroup>
  <Accordion title="隱私與套件行為">
    - 記錄會保留操作中繼資料：事件名稱、計數、位元組大小、記憶體讀數、佇列/工作階段狀態、通道/Plugin 名稱，以及已遮蔽的工作階段摘要。它們不會保留聊天文字、webhook 主體、工具輸出、原始請求或回應主體、token、cookie、秘密值、主機名稱，或原始工作階段 ID。設定 `diagnostics.enabled: false` 可完全停用記錄器。
    - 在 Gateway 致命結束、關閉逾時和重新啟動啟動失敗時，若記錄器有事件，OpenClaw 會將相同的診斷快照寫入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。用 `openclaw gateway stability --bundle latest` 檢查最新套件；`--limit`、`--type` 和 `--since-seq` 也適用於套件輸出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

寫入本機診斷 zip，設計用於附加到錯誤回報。關於隱私模型與套件內容，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

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
  用於健康快照的 Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  用於健康快照的 Gateway token。
</ParamField>
<ParamField path="--password <password>" type="string">
  用於健康快照的 Gateway 密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  狀態/健康快照逾時。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  略過持久化穩定性套件查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 列印寫入的路徑、大小和 manifest。
</ParamField>

匯出內容包含 manifest、Markdown 摘要、組態形狀、已清理的組態細節、已清理的記錄摘要、已清理的 Gateway 狀態/健康快照，以及最新的穩定性套件（若存在）。

這是用來分享的。它會保留有助於偵錯的操作細節，例如安全的 OpenClaw 記錄欄位、子系統名稱、狀態碼、持續時間、已設定模式、連接埠、Plugin ID、provider ID、非秘密功能設定，以及已遮蔽的操作記錄訊息。它會省略或遮蔽聊天文字、webhook 主體、工具輸出、認證、cookie、帳號/訊息識別碼、提示/指示文字、主機名稱和秘密值。當 LogTape 風格訊息看起來像使用者/聊天/工具 payload 文字時，匯出只會保留該訊息已被省略，以及其位元組數。

### `gateway status`

`gateway status` 會顯示 Gateway 服務（launchd/systemd/schtasks），並加上選用的連線能力/驗證能力探測。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  新增明確的探測目標。已設定的遠端與 localhost 仍會被探測。
</ParamField>
<ParamField path="--token <token>" type="string">
  探測使用的 Token 驗證。
</ParamField>
<ParamField path="--password <password>" type="string">
  探測使用的密碼驗證。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探測逾時。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  跳過連線能力探測（僅服務檢視）。
</ParamField>
<ParamField path="--deep" type="boolean">
  也掃描系統層級服務。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  將預設連線能力探測升級為讀取探測，並在該讀取探測失敗時以非零狀態結束。不可與 `--no-probe` 搭配使用。
</ParamField>

<AccordionGroup>
  <Accordion title="狀態語意">
    - 即使本機 CLI 設定缺失或無效，`gateway status` 仍可用於診斷。
    - 預設的 `gateway status` 會證明服務狀態、WebSocket 連線，以及握手時可見的驗證能力。它不會證明讀取／寫入／管理操作。
    - 診斷探測對首次裝置驗證不會造成變更：若既有快取裝置 Token 存在，會重複使用它，但不會只為了檢查狀態而建立新的 CLI 裝置身分或唯讀裝置配對記錄。
    - `gateway status` 會在可能時解析已設定的驗證 SecretRefs，以供探測驗證使用。
    - 如果此命令路徑中必要的驗證 SecretRef 未解析，當探測連線能力／驗證失敗時，`gateway status --json` 會回報 `rpc.authWarning`；請明確傳入 `--token`/`--password`，或先解析祕密來源。
    - 如果探測成功，未解析驗證參照警告會被抑制，以避免誤報。
    - 當僅有監聽中的服務仍不足夠，且你還需要讀取範圍 RPC 呼叫也保持健康時，請在指令碼與自動化中使用 `--require-rpc`。
    - `--deep` 會加入對額外 launchd/systemd/schtasks 安裝的盡力掃描。偵測到多個類 Gateway 服務時，人類可讀輸出會列印清理提示，並警告大多數設定應該每台機器只執行一個 Gateway。
    - 人類可讀輸出包含已解析的檔案日誌路徑，以及 CLI 與服務設定路徑／有效性快照，以協助診斷設定檔或狀態目錄偏移。

  </Accordion>
  <Accordion title="Linux systemd 驗證偏移檢查">
    - 在 Linux systemd 安裝中，服務驗證偏移檢查會從 unit 讀取 `Environment=` 與 `EnvironmentFile=` 值（包括 `%h`、加引號的路徑、多個檔案，以及選用的 `-` 檔案）。
    - 偏移檢查會使用合併後的執行階段環境解析 `gateway.auth.token` SecretRefs（先使用服務命令環境，再回退到處理程序環境）。
    - 如果 Token 驗證實際上未啟用（明確的 `gateway.auth.mode` 為 `password`/`none`/`trusted-proxy`，或模式未設定且密碼可能優先、且沒有 Token 候選可優先），Token 偏移檢查會跳過設定 Token 解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是「偵錯一切」命令。它一律會探測：

- 你已設定的遠端 Gateway（如果已設定），以及
- localhost（loopback），**即使已設定遠端**。

如果你傳入 `--url`，該明確目標會被加入兩者之前。人類可讀輸出會將目標標示為：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果可連線到多個 Gateway，它會全部列印出來。當你使用隔離的設定檔／連接埠時（例如救援 bot），支援多個 Gateway，但大多數安裝仍只執行單一 Gateway。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解讀">
    - `Reachable: yes` 表示至少一個目標接受了 WebSocket 連線。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 會回報探測能夠證明的驗證能力。這與可達性是分開的。
    - `Read probe: ok` 表示讀取範圍詳細 RPC 呼叫（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示連線成功，但讀取範圍 RPC 受限。這會回報為**降級**可達性，而不是完全失敗。
    - `Read probe: failed` 在 `Connect: ok` 之後出現，表示 Gateway 接受了 WebSocket 連線，但後續讀取診斷逾時或失敗。這同樣是**降級**可達性，不是無法到達 Gateway。
    - 與 `gateway status` 一樣，探測會重複使用既有快取裝置驗證，但不會建立首次裝置身分或配對狀態。
    - 只有在沒有任何被探測的目標可達時，結束碼才會是非零。

  </Accordion>
  <Accordion title="JSON 輸出">
    頂層：

    - `ok`：至少一個目標可達。
    - `degraded`：至少一個目標接受了連線，但未完成完整的詳細 RPC 診斷。
    - `capability`：在可達目標中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：依此順序視為作用中勝出者的最佳目標：明確 URL、SSH tunnel、已設定的遠端，然後是 local loopback。
    - `warnings[]`：盡力提供的警告記錄，含 `code`、`message`，以及選用的 `targetIds`。
    - `network`：從目前設定與主機網路衍生出的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` 與 `discovery.count`：此探測回合實際使用的探索預算／結果數。

    每個目標（`targets[].connect`）：

    - `ok`：連線加上降級分類後的可達性。
    - `rpcOk`：完整詳細 RPC 成功。
    - `scopeLimited`：詳細 RPC 因缺少 operator 範圍而失敗。

    每個目標（`targets[].auth`）：

    - `role`：可用時，在 `hello-ok` 中回報的驗證角色。
    - `scopes`：可用時，在 `hello-ok` 中回報的已授予範圍。
    - `capability`：該目標顯示的驗證能力分類。

  </Accordion>
  <Accordion title="常見警告代碼">
    - `ssh_tunnel_failed`：SSH tunnel 設定失敗；命令已回退到直接探測。
    - `multiple_gateways`：有多個目標可達；除非你有意執行隔離設定檔，例如救援 bot，否則這並不常見。
    - `auth_secretref_unresolved`：已設定的驗證 SecretRef 無法為失敗目標解析。
    - `probe_scope_limited`：WebSocket 連線成功，但讀取探測因缺少 `operator.read` 而受限。

  </Accordion>
</AccordionGroup>

#### 透過 SSH 遠端連線（Mac app parity）

macOS app 的「Remote over SSH」模式使用本機連接埠轉送，因此遠端 Gateway（可能只繫結到 loopback）可在 `ws://127.0.0.1:<port>` 連線。

CLI 等效命令：

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
  從已解析的探索端點（`local.` 加上已設定的廣域網域，如有）選擇第一個探索到的 Gateway 主機作為 SSH 目標。純 TXT 提示會被忽略。
</ParamField>

設定（選用，用作預設值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低階 RPC 輔助工具。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  參數用的 JSON 物件字串。
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway Token。
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway 密碼。
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  逾時預算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用於 agent 樣式的 RPC，這類 RPC 會在最終 payload 前串流中繼事件。
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

當受管理服務必須透過另一個可執行檔啟動時，請使用 `--wrapper`，例如
secrets manager shim 或 run-as helper。wrapper 會接收一般 Gateway 引數，並
負責最終以這些引數 exec `openclaw` 或 Node。

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
可執行檔，將 wrapper 寫入服務 `ProgramArguments`，並在服務環境中保存
`OPENCLAW_WRAPPER`，供日後強制重新安裝、更新與 doctor
修復使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

若要移除已保存的 wrapper，請在重新安裝時清除 `OPENCLAW_WRAPPER`：

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="命令選項">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node|bun>`、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`：`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start|stop`：`--json`

  </Accordion>
  <Accordion title="生命週期行為">
    - 使用 `gateway restart` 重新啟動受管理服務。不要將 `gateway stop` 與 `gateway start` 串接作為重新啟動的替代方式；在 macOS 上，`gateway stop` 會在停止 LaunchAgent 前刻意停用它。
    - `gateway restart --wait 30s` 會覆寫此次重新啟動設定的重啟排空預算。裸數字為毫秒；接受 `s`、`m`、`h` 等單位。`--wait 0` 會無限期等待。
    - `gateway restart --force` 會跳過作用中工作排空並立即重新啟動。當操作員已檢查列出的任務阻擋項，且希望 Gateway 立即恢復時使用。
    - 生命週期命令接受 `--json` 以供指令碼使用。

  </Accordion>
  <Accordion title="安裝時的驗證與 SecretRefs">
    - 當 Token 驗證需要 Token，且 `gateway.auth.token` 由 SecretRef 管理時，`gateway install` 會驗證 SecretRef 可解析，但不會將已解析 Token 保存到服務環境中繼資料。
    - 如果 Token 驗證需要 Token，且已設定的 Token SecretRef 未解析，安裝會以失敗關閉，而不是保存回退純文字。
    - 對 `gateway run` 的密碼驗證，優先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`，或由 SecretRef 支援的 `gateway.auth.password`，而不是內嵌 `--password`。
    - 在推斷驗證模式中，僅 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不會放寬安裝 Token 要求；安裝受管理服務時，請使用持久設定（`gateway.auth.password` 或設定 `env`）。
    - 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，安裝會被封鎖，直到明確設定模式。

  </Accordion>
</AccordionGroup>

## 探索 Gateway（Bonjour）

`gateway discover` 會掃描 Gateway beacon（`_openclaw-gw._tcp`）。

- 多點傳播 DNS-SD：`local.`
- 單點傳播 DNS-SD（Wide-Area Bonjour）：選擇一個網域（例如：`openclaw.internal.`）並設定分割 DNS + DNS 伺服器；請參閱 [Bonjour](/zh-TW/gateway/bonjour)。

只有啟用 Bonjour 探索功能的 Gateway（預設）會公告信標。

廣域探索記錄包含（TXT）：

- `role`（Gateway 角色提示）
- `transport`（傳輸提示，例如 `gateway`）
- `gatewayPort`（WebSocket 連接埠，通常是 `18789`）
- `sshPort`（選用；不存在時用戶端預設 SSH 目標為 `22`）
- `tailnetDns`（MagicDNS 主機名稱，可用時）
- `gatewayTls` / `gatewayTlsSha256`（已啟用 TLS + 憑證指紋）
- `cliPath`（寫入廣域區域的遠端安裝提示）

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
- 啟用廣域網域時，CLI 會掃描 `local.` 加上已設定的廣域網域。
- JSON 輸出中的 `wsUrl` 是從已解析的服務端點衍生而來，而不是來自僅限 TXT 的提示，例如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 上，只有當 `discovery.mdns.mode` 為 `full` 時，才會廣播 `sshPort` 和 `cliPath`。廣域 DNS-SD 仍會寫入 `cliPath`；`sshPort` 在那裡也維持選用。

</Note>

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway 執行手冊](/zh-TW/gateway)
