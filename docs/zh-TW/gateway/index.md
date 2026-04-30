---
read_when:
    - 執行或偵錯 Gateway 行程
summary: Gateway 服務、生命週期與維運的作業手冊
title: Gateway 執行手冊
x-i18n:
    generated_at: "2026-04-30T03:06:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Use this page for day-1 startup and day-2 operations of the Gateway service.

<CardGroup cols={2}>
  <Card title="深入疑難排解" icon="siren" href="/zh-TW/gateway/troubleshooting">
    以症狀為先的診斷，包含精確的命令階梯與日誌特徵。
  </Card>
  <Card title="設定" icon="sliders" href="/zh-TW/gateway/configuration">
    以任務為導向的設定指南 + 完整設定參考。
  </Card>
  <Card title="機密管理" icon="key-round" href="/zh-TW/gateway/secrets">
    SecretRef 合約、執行階段快照行為，以及 migrate/reload 操作。
  </Card>
  <Card title="機密計畫合約" icon="shield-check" href="/zh-TW/gateway/secrets-plan-contract">
    精確的 `secrets apply` 目標/路徑規則，以及僅使用 ref 的 auth-profile 行為。
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

健康基準：`Runtime: running`、`Connectivity probe: ok`，以及符合你預期的 `Capability: ...`。當你需要讀取範圍 RPC 證明，而不只是可連線性時，請使用 `openclaw gateway status --require-rpc`。

  </Step>

  <Step title="驗證頻道就緒狀態">

```bash
openclaw channels status --probe
```

在可連線的 Gateway 上，這會執行每個帳戶的即時頻道探測與選用稽核。
如果 Gateway 無法連線，CLI 會改為回退到僅基於設定的頻道摘要，
而不是即時探測輸出。

  </Step>
</Steps>

<Note>
Gateway 設定重新載入會監看作用中的設定檔路徑（從 profile/state 預設值解析，或在設定時使用 `OPENCLAW_CONFIG_PATH`）。
預設模式是 `gateway.reload.mode="hybrid"`。
第一次成功載入後，執行中的程序會提供作用中的記憶體內設定快照；成功重新載入會以原子方式替換該快照。
</Note>

## 執行階段模型

- 一個永遠在線的程序，用於路由、控制平面與頻道連線。
- 單一多工連接埠用於：
  - WebSocket 控制/RPC
  - HTTP API，與 OpenAI 相容（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 控制 UI 與 hook
- 預設繫結模式：`loopback`。
- 預設需要驗證。共享密鑰設定使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），非 loopback
  反向 Proxy 設定可使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 相容端點

OpenClaw 目前最高效益的相容性介面是：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

為什麼這組端點很重要：

- 多數 Open WebUI、LobeChat 與 LibreChat 整合會先探測 `/v1/models`。
- 許多 RAG 與記憶體管線預期會有 `/v1/embeddings`。
- Agent 原生用戶端越來越偏好 `/v1/responses`。

規劃注意事項：

- `/v1/models` 以 agent 為優先：它會回傳 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>`。
- `openclaw/default` 是穩定別名，永遠對應到設定的預設 agent。
- 當你想要後端 provider/model 覆寫時，請使用 `x-openclaw-model`；否則所選 agent 的一般模型與嵌入設定會保持控制權。

所有這些端點都在主要 Gateway 連接埠上執行，並使用與其餘 Gateway HTTP API 相同的受信任操作者驗證邊界。

### 連接埠與繫結優先順序

| 設定      | 解析順序                                              |
| ------------ | ------------------------------------------------------------- |
| Gateway 連接埠 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 繫結模式    | CLI/覆寫 → `gateway.bind` → `loopback`                    |

已安裝的 Gateway 服務會在 supervisor 中繼資料記錄解析後的 `--port`。變更 `gateway.port` 後，請執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，讓 launchd/systemd/schtasks 在新連接埠上啟動程序。

Gateway 啟動時會使用相同的有效連接埠與繫結，為非 loopback 繫結植入本機
控制 UI origins。例如，`--bind lan --port 3000`
會在執行階段驗證執行前，植入 `http://localhost:3000` 和 `http://127.0.0.1:3000`。
請將任何遠端瀏覽器 origins，例如 HTTPS Proxy URL，明確加入
`gateway.controlUi.allowedOrigins`。

### 熱重新載入模式

| `gateway.reload.mode` | 行為                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | 不重新載入設定                           |
| `hot`                 | 僅套用可熱更新的變更                |
| `restart`             | 遇到需要重新啟動的變更時重新啟動         |
| `hybrid`（預設）    | 安全時熱套用，需要時重新啟動 |

## 操作者命令集

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
units/schtasks），不是更深入的 RPC 健康探測。

## 多個 Gateway（同一主機）

多數安裝應該每台機器執行一個 Gateway。單一 Gateway 可以承載多個
agent 與頻道。

只有在你刻意需要隔離或救援機器人時，才需要多個 Gateway。

實用檢查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

預期結果：

- `gateway status --deep` 可能會回報 `Other gateway-like services detected (best effort)`，
  並在仍有過期的 launchd/systemd/schtasks 安裝時印出清理提示。
- 當多個目標回應時，`gateway probe` 可能會警告 `multiple reachable gateways`。
- 如果這是刻意的，請為每個 Gateway 隔離連接埠、設定/狀態與 workspace 根目錄。

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

## VoiceClaw 即時 brain 端點

OpenClaw 在 `/voiceclaw/realtime` 暴露與 VoiceClaw 相容的即時 WebSocket 端點。
當 VoiceClaw 桌面用戶端應該直接與即時 OpenClaw brain 對話，
而不是透過獨立 relay 程序時，請使用它。

此端點使用 Gemini Live 進行即時音訊，並透過將 OpenClaw 工具直接暴露給
Gemini Live，呼叫 OpenClaw 作為 brain。工具呼叫會立即回傳 `working`
結果以保持語音回合回應迅速，接著 OpenClaw 會非同步執行實際工具，
並將結果注入回即時工作階段。請在 Gateway 程序環境中設定 `GEMINI_API_KEY`。
如果啟用 Gateway 驗證，桌面用戶端會在第一則 `session.config` 訊息中傳送
Gateway token 或 password。

即時 brain 存取會執行擁有者授權的 OpenClaw agent 命令。請將
`gateway.auth.mode: "none"` 限制在僅 loopback 的測試執行個體。非本機
即時 brain 連線需要 Gateway 驗證。

若要使用隔離的測試 Gateway，請以自己的連接埠、設定與狀態執行獨立執行個體：

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

然後設定 VoiceClaw 使用：

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## 遠端存取

首選：Tailscale/VPN。
備援：SSH tunnel。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

接著將用戶端在本機連線到 `ws://127.0.0.1:18789`。

<Warning>
SSH tunnels 不會繞過 Gateway 驗證。對於共享密鑰驗證，用戶端即使透過 tunnel
仍然必須傳送 `token`/`password`。對於帶有身分的模式，
請求仍必須滿足該驗證路徑。
</Warning>

參見：[遠端 Gateway](/zh-TW/gateway/remote)、[驗證](/zh-TW/gateway/authentication)、[Tailscale](/zh-TW/gateway/tailscale)。

## 監督與服務生命週期

對於類似生產環境的可靠性，請使用受監督的執行。

<Tabs>
  <Tab title="macOS（launchd）">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

使用 `openclaw gateway restart` 重新啟動。不要串接 `openclaw gateway stop` 和 `openclaw gateway start`；在 macOS 上，`gateway stop` 會在停止 LaunchAgent 前刻意停用它。

LaunchAgent 標籤是 `ai.openclaw.gateway`（預設）或 `ai.openclaw.<profile>`（命名 profile）。`openclaw doctor` 會稽核並修復服務設定漂移。

  </Tab>

  <Tab title="Linux（systemd 使用者）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

若要登出後仍持續執行，請啟用 lingering：

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

  <Tab title="Windows（原生）">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

原生 Windows 受管理啟動使用名為 `OpenClaw Gateway` 的 Scheduled Task
（或命名 profile 使用 `OpenClaw Gateway (<profile>)`）。如果 Scheduled Task
建立遭拒，OpenClaw 會回退到每位使用者的 Startup 資料夾 launcher，
該 launcher 指向狀態目錄內的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux（系統服務）">

對多使用者/永遠在線的主機使用系統 unit。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用與使用者 unit 相同的服務本體，但將它安裝到
`/etc/systemd/system/openclaw-gateway[-<profile>].service`，並在你的 `openclaw`
binary 位於其他位置時調整 `ExecStart=`。

不要也讓 `openclaw doctor --fix` 為同一個 profile/連接埠安裝使用者層級 Gateway 服務。當 Doctor 發現系統層級 OpenClaw Gateway 服務時，會拒絕該自動安裝；當系統 unit 擁有生命週期時，請使用 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Tab>
</Tabs>

## Dev profile 快速路徑

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

預設包含隔離的狀態/設定與基礎 Gateway 連接埠 `19001`。

## 通訊協定快速參考（操作者視角）

- 第一個用戶端 frame 必須是 `connect`。
- Gateway 會回傳 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）。
- `hello-ok.features.methods` / `events` 是保守的探索清單，不是
  每個可呼叫 helper route 的產生式傾印。
- 請求：`req(method, params)` → `res(ok/payload|error)`。
- 常見事件包含 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、配對/核准生命週期事件，以及 `shutdown`。

Agent 執行分成兩階段：

1. 立即接受 ack（`status:"accepted"`）
2. 最終完成回應（`status:"ok"|"error"`），中間會串流 `agent` 事件。

參見完整通訊協定文件：[Gateway 通訊協定](/zh-TW/gateway/protocol)。

## 操作檢查

### 存活性

- 開啟 WS 並傳送 `connect`。
- 預期收到包含快照的 `hello-ok` 回應。

### 就緒狀態

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 缺口復原

事件不會重播。遇到序列缺口時，請在繼續前重新整理狀態（`health`、`system-presence`）。

## 常見失敗特徵

| 特徵                                                           | 可能問題                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 非 local loopback 綁定，且沒有有效的 Gateway 驗證路徑           |
| `another gateway instance is already listening` / `EADDRINUSE` | 連接埠衝突                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 設定設為遠端模式，或本機模式戳記從損壞的設定中遺失              |
| `unauthorized` during connect                                  | 用戶端與 Gateway 之間的驗證不符                                 |

如需完整診斷階梯，請使用 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)。

## 安全保證

- Gateway 通訊協定用戶端會在 Gateway 無法使用時快速失敗（不會隱含直接通道後援）。
- 無效或第一個影格不是連線影格時，會遭到拒絕並關閉。
- 正常關閉會在 socket 關閉前發出 `shutdown` 事件。

---

相關：

- [疑難排解](/zh-TW/gateway/troubleshooting)
- [背景程序](/zh-TW/gateway/background-process)
- [設定](/zh-TW/gateway/configuration)
- [健康狀態](/zh-TW/gateway/health)
- [Doctor](/zh-TW/gateway/doctor)
- [驗證](/zh-TW/gateway/authentication)

## 相關

- [設定](/zh-TW/gateway/configuration)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
- [遠端存取](/zh-TW/gateway/remote)
- [密鑰管理](/zh-TW/gateway/secrets)
