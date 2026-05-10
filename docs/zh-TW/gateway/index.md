---
read_when:
    - 執行或偵錯 Gateway 程序
summary: Gateway 服務、生命週期與維運作業手冊
title: Gateway 作業手冊
x-i18n:
    generated_at: "2026-05-10T19:35:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

使用此頁面進行 Gateway 服務的第 1 天啟動與第 2 天維運。

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/zh-TW/gateway/troubleshooting">
    以症狀優先的診斷，提供精確的命令階梯與日誌特徵。
  </Card>
  <Card title="Configuration" icon="sliders" href="/zh-TW/gateway/configuration">
    任務導向的設定指南 + 完整設定參考。
  </Card>
  <Card title="Secrets management" icon="key-round" href="/zh-TW/gateway/secrets">
    SecretRef 合約、執行階段快照行為，以及遷移/重新載入操作。
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/zh-TW/gateway/secrets-plan-contract">
    精確的 `secrets apply` 目標/路徑規則，以及僅 ref 的 auth-profile 行為。
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

健康基準：`Runtime: running`、`Connectivity probe: ok`，以及符合你預期的 `Capability: ...`。當你需要讀取範圍的 RPC 證明，而不只是可連線性時，請使用 `openclaw gateway status --require-rpc`。

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

在可連線的 gateway 下，這會針對每個帳號執行即時頻道探測與選用稽核。
如果 gateway 無法連線，CLI 會退回到僅設定的頻道摘要，而不是即時探測輸出。

  </Step>
</Steps>

<Note>
Gateway 設定重新載入會監看作用中的設定檔路徑（從設定檔/狀態預設值解析，或在設定時使用 `OPENCLAW_CONFIG_PATH`）。
預設模式是 `gateway.reload.mode="hybrid"`。
第一次成功載入後，執行中的程序會提供作用中的記憶體內設定快照；成功重新載入會以原子方式替換該快照。
</Note>

## 執行階段模型

- 一個常駐程序，用於路由、控制平面與頻道連線。
- 單一多工連接埠用於：
  - WebSocket 控制/RPC
  - HTTP API，相容 OpenAI（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 控制 UI 與 hook
- 預設繫結模式：`loopback`。
- 預設需要驗證。共享密鑰設定使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），非 loopback
  的反向代理設定可以使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 相容端點

OpenClaw 目前最高槓桿的相容性表面是：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

為什麼這組端點重要：

- 多數 Open WebUI、LobeChat 與 LibreChat 整合會先探測 `/v1/models`。
- 許多 RAG 與記憶體管線預期有 `/v1/embeddings`。
- Agent 原生用戶端越來越偏好 `/v1/responses`。

規劃備註：

- `/v1/models` 以 agent 優先：它會回傳 `openclaw`、`openclaw/default` 與 `openclaw/<agentId>`。
- `openclaw/default` 是穩定別名，永遠對應到已設定的預設 agent。
- 當你想要後端 provider/model 覆寫時，請使用 `x-openclaw-model`；否則所選 agent 的一般模型與 embedding 設定會保持控制權。

所有這些都在主要 Gateway 連接埠上執行，並使用與其餘 Gateway HTTP API 相同的受信任 operator 驗證邊界。

### 連接埠與繫結優先順序

| 設定         | 解析順序                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway 連接埠 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 繫結模式     | CLI/override → `gateway.bind` → `loopback`                    |

已安裝的 gateway 服務會在 supervisor 中繼資料記錄已解析的 `--port`。變更 `gateway.port` 後，請執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，讓 launchd/systemd/schtasks 在新連接埠啟動程序。

Gateway 啟動會在為非 loopback 繫結播種本機
控制 UI origin 時，使用相同的有效連接埠與繫結。例如，`--bind lan --port 3000`
會在執行階段驗證執行前，播種 `http://localhost:3000` 與 `http://127.0.0.1:3000`。
請將任何遠端瀏覽器 origin，例如 HTTPS proxy URL，明確加入
`gateway.controlUi.allowedOrigins`。

### 熱重新載入模式

| `gateway.reload.mode` | 行為                                       |
| --------------------- | ------------------------------------------ |
| `off`                 | 不重新載入設定                             |
| `hot`                 | 只套用熱安全變更                           |
| `restart`             | 在需要重新啟動的變更上重新啟動             |
| `hybrid`（預設）      | 安全時熱套用，需要時重新啟動               |

## Operator 命令集

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

`gateway status --deep` 用於額外的服務探索（LaunchDaemons/systemd 系統
unit/schtasks），不是更深入的 RPC 健康探測。

## 多個 gateway（同一主機）

多數安裝應該在每台機器執行一個 gateway。單一 gateway 可以承載多個
agent 與頻道。

只有在你刻意需要隔離或救援 bot 時，才需要多個 gateway。

有用的檢查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

預期結果：

- `gateway status --deep` 可以回報 `Other gateway-like services detected (best effort)`
  並在過期的 launchd/systemd/schtasks 安裝仍存在時列印清理提示。
- 當超過一個目標回應時，`gateway probe` 可以警告 `multiple reachable gateways`。
- 如果這是刻意的，請為每個 gateway 隔離連接埠、設定/狀態與 workspace root。

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

首選：Tailscale/VPN。
備援：SSH tunnel。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

接著在本機將用戶端連線到 `ws://127.0.0.1:18789`。

<Warning>
SSH tunnel 不會繞過 gateway 驗證。對於共享密鑰驗證，用戶端即使透過 tunnel
仍必須傳送 `token`/`password`。對於帶有身分的模式，
請求仍必須滿足該驗證路徑。
</Warning>

請參閱：[遠端 Gateway](/zh-TW/gateway/remote)、[驗證](/zh-TW/gateway/authentication)、[Tailscale](/zh-TW/gateway/tailscale)。

## 監督與服務生命週期

對類生產可靠性使用受監督的執行方式。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

使用 `openclaw gateway restart` 進行重新啟動。不要把 `openclaw gateway stop` 和 `openclaw gateway start` 串接起來作為重新啟動替代方案。

在 macOS 上，`gateway stop` 預設使用 `launchctl bootout` — 這會從目前開機工作階段移除 LaunchAgent，而不會永久停用，因此 KeepAlive 自動復原在非預期當機後仍可運作，且 `gateway start` 會乾淨地重新啟用。若要在重新開機之間持續抑制自動重生，請傳入 `--disable`：`openclaw gateway stop --disable`。

LaunchAgent 標籤為 `ai.openclaw.gateway`（預設）或 `ai.openclaw.<profile>`（具名設定檔）。`openclaw doctor` 會稽核並修復服務設定漂移。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

若要在登出後持續執行，請啟用 lingering：

```bash
sudo loginctl enable-linger <user>
```

當你需要自訂安裝路徑時的手動 user-unit 範例：

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

原生 Windows 受管理啟動使用名為 `OpenClaw Gateway`
（或具名設定檔的 `OpenClaw Gateway (<profile>)`）的 Scheduled Task。如果 Scheduled Task
建立遭拒，OpenClaw 會退回到每位使用者的 Startup 資料夾 launcher，
指向狀態目錄內的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux (system service)">

對多使用者/常駐主機使用 system unit。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用與 user unit 相同的服務主體，但將它安裝在
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，並在你的 `openclaw` binary 位於其他位置時調整
`ExecStart=`。

不要也讓 `openclaw doctor --fix` 為相同設定檔/連接埠安裝使用者層級 gateway 服務。當 Doctor 找到系統層級 OpenClaw gateway 服務時，會拒絕該自動安裝；當 system unit 擁有生命週期時，請使用 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Tab>
</Tabs>

## Dev 設定檔快速路徑

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

預設包含隔離的狀態/設定與基礎 gateway 連接埠 `19001`。

## 通訊協定快速參考（operator 視角）

- 第一個用戶端 frame 必須是 `connect`。
- Gateway 會回傳 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、限制/政策）。
- `hello-ok.features.methods` / `events` 是保守的探索清單，不是
  每個可呼叫 helper route 的生成式傾印。
- 請求：`req(method, params)` → `res(ok/payload|error)`。
- 常見事件包含 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、配對/核准生命週期事件，以及 `shutdown`。

Agent 執行分為兩個階段：

1. 立即接受 ack（`status:"accepted"`）
2. 最終完成回應（`status:"ok"|"error"`），中間會串流 `agent` 事件。

請參閱完整通訊協定文件：[Gateway 通訊協定](/zh-TW/gateway/protocol)。

## 操作檢查

### 存活性

- 開啟 WS 並傳送 `connect`。
- 預期收到帶有快照的 `hello-ok` 回應。

### 就緒性

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 缺口復原

事件不會重播。發生序列缺口時，先重新整理狀態（`health`、`system-presence`）再繼續。

## 常見失敗特徵

| 特徵                                                           | 可能問題                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 非 loopback 綁定且沒有有效的 Gateway 驗證路徑                                   |
| `another gateway instance is already listening` / `EADDRINUSE` | 連接埠衝突                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 設定被設為遠端模式，或本機模式標記從損壞的設定中遺失                            |
| `unauthorized` during connect                                  | 用戶端與 Gateway 之間的驗證不相符                                               |

如需完整的診斷階梯，請使用 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)。

## 安全保證

- Gateway 協定用戶端會在 Gateway 無法使用時快速失敗（不會隱含回退到直接通道）。
- 無效或非連線的第一個 frame 會被拒絕並關閉。
- 正常關閉會在 socket 關閉前發出 `shutdown` 事件。

---

相關內容：

- [疑難排解](/zh-TW/gateway/troubleshooting)
- [背景程序](/zh-TW/gateway/background-process)
- [設定](/zh-TW/gateway/configuration)
- [健康狀態](/zh-TW/gateway/health)
- [診斷](/zh-TW/gateway/doctor)
- [驗證](/zh-TW/gateway/authentication)

## 相關內容

- [設定](/zh-TW/gateway/configuration)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
- [遠端存取](/zh-TW/gateway/remote)
- [機密資訊管理](/zh-TW/gateway/secrets)
