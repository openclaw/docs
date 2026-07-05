---
read_when:
    - 執行或偵錯閘道程序
summary: 閘道服務、生命週期與維運操作手冊
title: 閘道操作手冊
x-i18n:
    generated_at: "2026-07-05T11:19:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a14b9b6e00a1ec68703d2c6587d0a42cd14acd70f44c72423f33f94035b802e
    source_path: gateway/index.md
    workflow: 16
---

使用此頁面處理 Gateway 服務的第 1 天啟動與第 2 天維運。

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/zh-TW/gateway/troubleshooting">
    以症狀為先的診斷，包含精確的命令階梯與日誌特徵。
  </Card>
  <Card title="Configuration" icon="sliders" href="/zh-TW/gateway/configuration">
    工作導向的設定指南 + 完整設定參考。
  </Card>
  <Card title="Secrets management" icon="key-round" href="/zh-TW/gateway/secrets">
    SecretRef 合約、執行階段快照行為，以及遷移/重新載入操作。
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/zh-TW/gateway/secrets-plan-contract">
    精確的 `secrets apply` 目標/路徑規則，以及僅參照的 auth-profile 行為。
  </Card>
</CardGroup>

## 5 分鐘本機啟動

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健康基準：`Runtime: running`、`Connectivity probe: ok`，以及符合你預期的 `Capability` 行。使用 `openclaw gateway status --require-rpc` 取得讀取範圍 RPC 證明，而不只是可連線性。

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

在可連線的閘道下，這會對每個帳號執行即時通道探測與選用稽核。如果無法連上閘道，命令列介面會退回只根據設定產生通道摘要。

  </Step>
</Steps>

<Note>
Gateway 設定重新載入會監看作用中的設定檔路徑（從設定檔/狀態預設值解析，或在設定時使用 `OPENCLAW_CONFIG_PATH`）。預設模式是 `gateway.reload.mode="hybrid"`。第一次成功載入後，執行中的程序會提供作用中的記憶體內設定快照；成功重新載入會以原子方式替換該快照。
</Note>

## 執行階段模型

- 一個永遠開啟的程序，用於路由、控制平面與通道連線。
- 單一多工連接埠用於：
  - WebSocket 控制/RPC
  - HTTP API（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 外掛 HTTP 路由，例如選用的 `/api/v1/admin/rpc`
  - 控制 UI 與鉤子
- 預設繫結模式：`loopback`。在偵測到的容器環境內，有效預設值為 `auto`（解析為 `0.0.0.0` 以支援連接埠轉送），除非 Tailscale serve/funnel 作用中，這會一律強制使用 `loopback`。
- 預設需要驗證。共享密鑰設定使用 `gateway.auth.token` / `gateway.auth.password`（或 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），非 loopback 反向代理設定則可使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 相容端點

OpenClaw 最高槓桿的相容性介面：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

這組端點為何重要：

- 多數 Open WebUI、LobeChat 與 LibreChat 整合會先探測 `/v1/models`。
- 許多 RAG 與記憶管線預期有 `/v1/embeddings`。
- Agent 原生用戶端越來越偏好 `/v1/responses`。

`/v1/models` 以 agent 為先：它會針對每個已設定的 agent 傳回 `openclaw`、`openclaw/default` 與 `openclaw/<agentId>`。`openclaw/default` 是穩定別名，永遠對應到已設定的預設 agent。當你想覆寫後端提供者/模型時，請傳送 `x-openclaw-model`；否則會維持所選 agent 的一般模型與嵌入設定。

所有這些端點都在主要 Gateway 連接埠上執行，並使用與 Gateway HTTP API 其餘部分相同的受信任操作員驗證邊界。

管理員 HTTP RPC（`POST /api/v1/admin/rpc`）是獨立、預設關閉的外掛路由，供無法使用 WebSocket RPC 的主機工具使用。請參閱 [Admin HTTP RPC](/zh-TW/plugins/admin-http-rpc)。

### 連接埠與繫結優先順序

| 設定      | 解析順序                                                     |
| ------------ | -------------------------------------------------------------------- |
| Gateway 連接埠 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| 繫結模式    | 命令列介面/覆寫 → `gateway.bind` → `loopback`（或容器中的 `auto`） |

已安裝的閘道服務會在監督程式中繼資料記錄解析後的 `--port`。變更 `gateway.port` 後，請執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，讓 launchd/systemd/schtasks 在新連接埠啟動程序。

Gateway 啟動時，在為非 loopback 繫結植入本機控制 UI 來源時，會使用相同的有效連接埠與繫結。例如，`--bind lan --port 3000` 會在執行階段驗證前植入 `http://localhost:3000` 與 `http://127.0.0.1:3000`。請將任何遠端瀏覽器來源，例如 HTTPS 代理 URL，明確加入 `gateway.controlUi.allowedOrigins`。

### 熱重新載入模式

| `gateway.reload.mode` | 行為                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | 不重新載入設定                           |
| `hot`                 | 只套用熱安全變更                |
| `restart`             | 遇到需要重新啟動的變更時重新啟動         |
| `hybrid`（預設）    | 安全時熱套用，需要時重新啟動 |

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

`gateway status --deep` 用於額外的服務探索（LaunchDaemons/systemd 系統單元/schtasks），不是更深入的 RPC 健康探測。

## 多個閘道（同一主機）

多數安裝應該每台機器執行一個閘道。單一閘道可以承載多個 agent 與通道。只有在你刻意需要隔離或救援機器人時，才需要多個閘道。

實用檢查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

預期結果：

- `gateway status --deep` 可以回報 `Other gateway-like services detected (best effort)`，並在仍有過時的 launchd/systemd/schtasks 安裝時列印清理提示。
- 當不同閘道回應，或 OpenClaw 無法證明可連線目標是同一個閘道時，`gateway probe` 可能會警告 `multiple reachable gateway identities`。指向同一閘道的 SSH 通道、代理 URL 或已設定的遠端 URL 都是同一個閘道的多種傳輸，即使傳輸連接埠不同也是如此。
- 如果這是刻意的，請為每個閘道隔離連接埠、設定/狀態與工作區根目錄。

每個實例的檢查清單：

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
備援：SSH 通道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

接著讓用戶端在本機連線至 `ws://127.0.0.1:18789`。

<Warning>
SSH 通道不會繞過閘道驗證。對於共享密鑰驗證，用戶端即使透過通道仍
必須傳送 `token`/`password`。對於帶有身分的模式，
請求仍必須滿足該驗證路徑。
</Warning>

請參閱：[Remote Gateway](/zh-TW/gateway/remote)、[Authentication](/zh-TW/gateway/authentication)、[Tailscale](/zh-TW/gateway/tailscale)。

## 監督與服務生命週期

使用受監督的執行可取得類似生產環境的可靠性。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

使用 `openclaw gateway restart` 進行重新啟動。不要將 `openclaw gateway stop` 和 `openclaw gateway start` 串接作為重新啟動的替代方式。

在 macOS 上，`gateway stop` 預設使用 `launchctl bootout`。這會從目前開機工作階段移除 LaunchAgent，而不會持久化停用，因此 KeepAlive 自動復原在非預期當機後仍可運作，且 `gateway start` 會乾淨地重新啟用。若要在重新開機後持久抑制自動重生，請傳入 `--disable`：`openclaw gateway stop --disable`。

LaunchAgent 標籤為 `ai.openclaw.gateway`（預設）或 `ai.openclaw.<profile>`（具名設定檔）。`openclaw doctor` 會稽核並修復服務設定漂移。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

若要在登出後保持持久性，請啟用 lingering：

```bash
sudo loginctl enable-linger $(whoami)
```

在沒有桌面工作階段的無頭伺服器上，重試 `systemctl --user` 命令前，也請確保已設定 `XDG_RUNTIME_DIR`（`export XDG_RUNTIME_DIR=/run/user/$(id -u)`）。

需要自訂安裝路徑時的手動使用者單元範例：

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
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
（或具名設定檔的 `OpenClaw Gateway (<profile>)`）的排程工作。如果排程工作
建立遭拒，OpenClaw 會退回每位使用者的啟動資料夾啟動器，
指向狀態目錄內的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux (system service)">

對多使用者/永遠開啟的主機使用系統單元。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用與使用者單元相同的服務主體，但將它安裝在
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，並在你的 `openclaw` 二進位檔位於其他位置時調整
`ExecStart=`。

不要也讓 `openclaw doctor --fix` 為相同設定檔/連接埠安裝使用者層級的閘道服務。當 Doctor 找到系統層級 OpenClaw 閘道服務時，會拒絕該自動安裝；當系統單元擁有生命週期時，請使用 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Tab>
</Tabs>

## 開發設定檔快速路徑

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

預設包含隔離的狀態/設定與基礎閘道連接埠 `19001`。

## 協定快速參考（操作員視角）

- 第一個用戶端 frame 必須是 `connect`。
- Gateway 會傳回包含 `snapshot`（`presence`、`health`、`stateVersion`、`uptimeMs`）加上 `policy` 限制（`maxPayload`、`maxBufferedBytes`、`tickIntervalMs`）的 `hello-ok` frame。
- `hello-ok.features.methods` / `events` 是保守的探索清單，不是
  每個可呼叫輔助路由的產生式傾印。
- 請求：`req(method, params)` → `res(ok/payload|error)`。
- 常見事件包含 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.operation`、`session.tool`、`sessions.changed`、
  `presence`、`tick`、`health`、`heartbeat`、配對/核准生命週期事件，
  以及 `shutdown`。

Agent 執行分為兩階段：

1. 立即接受確認（`status:"accepted"`）
2. 最終完成回應（`status:"ok"|"error"`），中間串流傳送 `agent` 事件。

請參閱完整協定文件：[Gateway Protocol](/zh-TW/gateway/protocol)。

## 維運檢查

### 存活性

- 開啟 WS 並傳送 `connect`。
- 預期收到含快照的 `hello-ok` 回應。

### 就緒性

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 間隙復原

事件不會重播。遇到序列間隙時，請先重新整理狀態（`health`、`system-presence`），再繼續。

## 常見失敗特徵

| 特徵                                                           | 可能問題                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 沒有有效閘道驗證路徑的非 loopback 綁定                                        |
| `another gateway instance is already listening` / `EADDRINUSE` | 連接埠衝突                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | 設定設為遠端模式，或受損設定中缺少 `gateway.mode`                             |
| 連線期間出現 `unauthorized`                                   | 用戶端與閘道之間的驗證不相符                                                  |

如需完整診斷階梯，請使用[閘道疑難排解](/zh-TW/gateway/troubleshooting)。

## 安全保證

- 閘道通訊協定用戶端會在閘道無法使用時快速失敗（沒有隱含的直接頻道後援）。
- 無效或非連線的第一個 frame 會被拒絕並關閉。
- 優雅關閉會在 socket 關閉前發出 `shutdown` 事件。

## 相關

- [設定](/zh-TW/gateway/configuration)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
- [背景程序](/zh-TW/gateway/background-process)
- [健康狀態](/zh-TW/gateway/health)
- [診斷](/zh-TW/gateway/doctor)
- [驗證](/zh-TW/gateway/authentication)
- [遠端存取](/zh-TW/gateway/remote)
- [機密管理](/zh-TW/gateway/secrets)
