---
read_when:
    - 執行或偵錯 Gateway 程序
summary: Gateway 服務、生命週期與維運操作的操作手冊
title: Gateway 作業手冊
x-i18n:
    generated_at: "2026-05-06T02:48:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e62275a9619209a2f630d2911961441243d62a9141052f49a04f77201d70a8c
    source_path: gateway/index.md
    workflow: 16
---

將此頁面用於 Gateway 服務的第 1 天啟動與第 2 天維運。

<CardGroup cols={2}>
  <Card title="深入疑難排解" icon="siren" href="/zh-TW/gateway/troubleshooting">
    以症狀為優先的診斷，包含精確的命令階梯與日誌特徵。
  </Card>
  <Card title="組態" icon="sliders" href="/zh-TW/gateway/configuration">
    任務導向的設定指南 + 完整組態參考。
  </Card>
  <Card title="密鑰管理" icon="key-round" href="/zh-TW/gateway/secrets">
    SecretRef 合約、執行階段快照行為，以及遷移/重新載入操作。
  </Card>
  <Card title="密鑰計畫合約" icon="shield-check" href="/zh-TW/gateway/secrets-plan-contract">
    精確的 `secrets apply` 目標/路徑規則，以及僅參照的 auth-profile 行為。
  </Card>
</CardGroup>

## 5 分鐘本機啟動

<Steps>
  <Step title="啟動 Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="驗證服務健康狀態">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健康基準：`Runtime: running`、`Connectivity probe: ok`，以及符合你預期的 `Capability: ...`。當你需要讀取範圍的 RPC 證明，而不只是可連線性時，請使用 `openclaw gateway status --require-rpc`。

  </Step>

  <Step title="驗證通道就緒狀態">

```bash
openclaw channels status --probe
```

有可連線的 Gateway 時，這會對每個帳戶執行即時通道探測與選用稽核。
如果無法連線至 Gateway，CLI 會改為回退到僅依組態產生的通道摘要，
而不是即時探測輸出。

  </Step>
</Steps>

<Note>
Gateway 組態重新載入會監看作用中組態檔路徑（從 profile/state 預設值解析，或設定時使用 `OPENCLAW_CONFIG_PATH`）。
預設模式為 `gateway.reload.mode="hybrid"`。
第一次成功載入後，執行中的程序會提供作用中的記憶體內組態快照；成功重新載入會以原子方式交換該快照。
</Note>

## 執行階段模型

- 一個始終開啟的程序，用於路由、控制平面與通道連線。
- 單一多工連接埠用於：
  - WebSocket 控制/RPC
  - HTTP API，與 OpenAI 相容（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 控制 UI 與 hook
- 預設繫結模式：`loopback`。
- 預設需要驗證。共享密鑰設定使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），而非 loopback
  反向 Proxy 設定可使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 相容端點

OpenClaw 目前最高槓桿的相容性介面是：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

為什麼這組端點重要：

- 大多數 Open WebUI、LobeChat 與 LibreChat 整合會先探測 `/v1/models`。
- 許多 RAG 與記憶體管線預期有 `/v1/embeddings`。
- Agent 原生用戶端越來越偏好 `/v1/responses`。

規劃注意事項：

- `/v1/models` 以 Agent 為優先：它會回傳 `openclaw`、`openclaw/default` 與 `openclaw/<agentId>`。
- `openclaw/default` 是穩定別名，一律對應到已設定的預設 Agent。
- 當你想覆寫後端提供者/模型時，請使用 `x-openclaw-model`；否則所選 Agent 的一般模型與嵌入設定會維持控制權。

所有這些都在主要 Gateway 連接埠上執行，並使用與其他 Gateway HTTP API 相同的受信任操作員驗證邊界。

### 連接埠與繫結優先順序

| 設定         | 解析順序                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway 連接埠 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 繫結模式     | CLI/override → `gateway.bind` → `loopback`                    |

已安裝的 gateway 服務會在 supervisor 中繼資料記錄解析後的 `--port`。變更 `gateway.port` 後，請執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，讓 launchd/systemd/schtasks 在新連接埠上啟動程序。

Gateway 啟動時會使用相同的有效連接埠與繫結，為非 loopback 繫結植入本機
控制 UI 來源。例如，`--bind lan --port 3000`
會在執行階段驗證執行前，植入 `http://localhost:3000` 與 `http://127.0.0.1:3000`。
請將任何遠端瀏覽器來源，例如 HTTPS Proxy URL，明確加入
`gateway.controlUi.allowedOrigins`。

### 熱重新載入模式

| `gateway.reload.mode` | 行為                                   |
| --------------------- | -------------------------------------- |
| `off`                 | 不重新載入組態                         |
| `hot`                 | 只套用熱安全變更                       |
| `restart`             | 遇到需要重新啟動的變更時重新啟動       |
| `hybrid`（預設）      | 安全時熱套用，需要時重新啟動           |

## 操作員命令集

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` 用於額外服務探索（LaunchDaemons/systemd system
units/schtasks），而不是更深入的 RPC 健康狀態探測。

## 多個 gateway（同一主機）

大多數安裝應該每台機器執行一個 gateway。單一 gateway 可以承載多個
Agent 與通道。

只有在你刻意需要隔離或救援 bot 時，才需要多個 gateway。

實用檢查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

預期結果：

- `gateway status --deep` 可能會回報 `Other gateway-like services detected (best effort)`，
  並在仍存在過期 launchd/systemd/schtasks 安裝時列印清理提示。
- 當超過一個目標回應時，`gateway probe` 可能會警告 `multiple reachable gateways`。
- 如果這是刻意的，請為每個 gateway 隔離連接埠、config/state 與 workspace 根目錄。

每個執行個體的檢查清單：

- 唯一的 `gateway.port`
- 唯一的 `OPENCLAW_CONFIG_PATH`
- 唯一的 `OPENCLAW_STATE_DIR`
- 唯一的 `agents.defaults.workspace`

範例：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

詳細設定：[/gateway/multiple-gateways](/zh-TW/gateway/multiple-gateways)。

## 遠端存取

偏好：Tailscale/VPN。
後備：SSH 通道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

接著將用戶端在本機連線到 `ws://127.0.0.1:18789`。

<Warning>
SSH 通道不會繞過 gateway 驗證。對於共享密鑰驗證，用戶端即使透過通道仍然
必須傳送 `token`/`password`。對於帶有身分的模式，
請求仍然必須符合該驗證路徑。
</Warning>

另請參閱：[遠端 Gateway](/zh-TW/gateway/remote)、[驗證](/zh-TW/gateway/authentication)、[Tailscale](/zh-TW/gateway/tailscale)。

## 監督與服務生命週期

在類似生產環境的可靠性需求下，請使用受監督的執行方式。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

使用 `openclaw gateway restart` 重新啟動。不要串接 `openclaw gateway stop` 和 `openclaw gateway start`；在 macOS 上，`gateway stop` 會刻意先停用 LaunchAgent 再停止它。

LaunchAgent 標籤為 `ai.openclaw.gateway`（預設）或 `ai.openclaw.<profile>`（具名 profile）。`openclaw doctor` 會稽核並修復服務組態漂移。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

若要在登出後保持常駐，請啟用 lingering：

```bash
sudo loginctl enable-linger <user>
```

當你需要自訂安裝路徑時的手動使用者 unit 範例：

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

原生 Windows 受管理啟動會使用名為 `OpenClaw Gateway`
（或具名 profile 的 `OpenClaw Gateway (<profile>)`）的排程工作。如果建立排程工作
遭拒，OpenClaw 會回退到每位使用者的 Startup 資料夾啟動器，
該啟動器指向狀態目錄內的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux (system service)">

對多使用者/始終開啟的主機使用 system unit。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用與使用者 unit 相同的服務本文，但將它安裝在
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，並在你的 `openclaw` 二進位檔位於其他位置時調整
`ExecStart=`。

不要也讓 `openclaw doctor --fix` 為相同的 profile/port 安裝使用者層級 gateway 服務。當 Doctor 找到系統層級 OpenClaw gateway 服務時，會拒絕該自動安裝；當 system unit 擁有生命週期時，請使用 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Tab>
</Tabs>

## 開發 profile 快速路徑

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

預設值包含隔離的 state/config 與基礎 gateway 連接埠 `19001`。

## 協定快速參考（操作員視角）

- 第一個用戶端 frame 必須是 `connect`。
- Gateway 會回傳 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）。
- `hello-ok.features.methods` / `events` 是保守的探索清單，而不是
  每個可呼叫 helper route 的產生式傾印。
- 請求：`req(method, params)` → `res(ok/payload|error)`。
- 常見事件包含 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、配對/核准生命週期事件，以及 `shutdown`。

Agent 執行分為兩階段：

1. 立即接受 ack（`status:"accepted"`）
2. 最終完成回應（`status:"ok"|"error"`），中間會串流 `agent` 事件。

請參閱完整協定文件：[Gateway Protocol](/zh-TW/gateway/protocol)。

## 操作檢查

### 存活性

- 開啟 WS 並傳送 `connect`。
- 預期收到包含快照的 `hello-ok` 回應。

### 就緒性

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 缺口復原

事件不會重播。遇到序列缺口時，請先重新整理狀態（`health`、`system-presence`），再繼續。

## 常見失敗特徵

| 特徵                                                           | 可能問題                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 非 loopback 繫結沒有有效的 gateway 驗證路徑                                    |
| `another gateway instance is already listening` / `EADDRINUSE` | 連接埠衝突                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 組態設定為遠端模式，或本機模式戳記從受損組態中遺失                              |
| `unauthorized` during connect                                  | 用戶端與 gateway 之間的驗證不相符                                                |

如需完整診斷階梯，請使用 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)。

## 安全保證

- Gateway 通訊協定用戶端會在 Gateway 無法使用時快速失敗（沒有隱含的直接通道後援）。
- 無效或非連線的第一個訊框會遭拒絕並關閉連線。
- 正常關閉會在通訊端關閉前發出 `shutdown` 事件。

---

相關：

- [疑難排解](/zh-TW/gateway/troubleshooting)
- [背景程序](/zh-TW/gateway/background-process)
- [設定](/zh-TW/gateway/configuration)
- [健康狀態](/zh-TW/gateway/health)
- [診斷](/zh-TW/gateway/doctor)
- [身分驗證](/zh-TW/gateway/authentication)

## 相關

- [設定](/zh-TW/gateway/configuration)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
- [遠端存取](/zh-TW/gateway/remote)
- [祕密管理](/zh-TW/gateway/secrets)
