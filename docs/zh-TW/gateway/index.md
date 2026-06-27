---
read_when:
    - 執行或偵錯閘道程序
summary: 閘道服務、生命週期與維運的執行手冊
title: 閘道操作手冊
x-i18n:
    generated_at: "2026-06-27T19:18:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

使用此頁進行閘道服務的第 1 天啟動與第 2 天營運。

<CardGroup cols={2}>
  <Card title="深入疑難排解" icon="siren" href="/zh-TW/gateway/troubleshooting">
    以症狀為先的診斷，包含精確的命令階梯與日誌特徵。
  </Card>
  <Card title="設定" icon="sliders" href="/zh-TW/gateway/configuration">
    以任務為導向的設定指南 + 完整設定參考。
  </Card>
  <Card title="祕密管理" icon="key-round" href="/zh-TW/gateway/secrets">
    SecretRef 合約、執行階段快照行為，以及遷移/重新載入操作。
  </Card>
  <Card title="祕密計畫合約" icon="shield-check" href="/zh-TW/gateway/secrets-plan-contract">
    精確的 `secrets apply` 目標/路徑規則與僅限 ref 的 auth-profile 行為。
  </Card>
</CardGroup>

## 5 分鐘本機啟動

<Steps>
  <Step title="啟動閘道">

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

有可連線閘道時，這會針對每個帳號執行即時頻道探測與選用稽核。
如果閘道無法連線，命令列介面會改用僅基於設定的頻道摘要，而不是
即時探測輸出。

  </Step>
</Steps>

<Note>
閘道設定重新載入會監看作用中的設定檔路徑（從設定檔/狀態預設值解析，或在設定 `OPENCLAW_CONFIG_PATH` 時使用它）。
預設模式是 `gateway.reload.mode="hybrid"`。
首次成功載入後，執行中的程序會提供作用中的記憶體內設定快照；成功重新載入會以原子方式替換該快照。
</Note>

## 執行階段模型

- 一個永遠執行的程序，用於路由、控制平面與頻道連線。
- 單一多工連接埠用於：
  - WebSocket 控制/RPC
  - HTTP API（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 外掛 HTTP 路由，例如選用的 `/api/v1/admin/rpc`
  - 控制 UI 與鉤子
- 預設繫結模式：`loopback`。
- 預設需要驗證。共享祕密設定使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），非 loopback
  反向代理設定可使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 相容端點

OpenClaw 目前最高槓桿的相容性表面是：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

這組端點重要的原因：

- 多數 Open WebUI、LobeChat 與 LibreChat 整合會先探測 `/v1/models`。
- 許多 RAG 與記憶體管線預期有 `/v1/embeddings`。
- 原生代理程式用戶端越來越偏好 `/v1/responses`。

規劃備註：

- `/v1/models` 以代理程式為先：它會回傳 `openclaw`、`openclaw/default` 與 `openclaw/<agentId>`。
- `openclaw/default` 是穩定別名，永遠對應到已設定的預設代理程式。
- 當你想要後端提供者/模型覆寫時，請使用 `x-openclaw-model`；否則會由所選代理程式的一般模型與嵌入設定維持控制。

所有這些都在主要閘道連接埠上執行，並使用與其餘閘道 HTTP API 相同的可信任操作者驗證邊界。

管理 HTTP RPC（`POST /api/v1/admin/rpc`）是另一個預設關閉的外掛路由，供無法使用 WebSocket RPC 的主機工具使用。請參閱 [管理 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。

### 連接埠與繫結優先順序

| 設定      | 解析順序                                              |
| ------------ | ------------------------------------------------------------- |
| 閘道連接埠 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 繫結模式    | CLI/覆寫 → `gateway.bind` → `loopback`                    |

已安裝的閘道服務會在監督程式中繼資料記錄解析後的 `--port`。變更 `gateway.port` 後，請執行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，讓 launchd/systemd/schtasks 在新連接埠啟動程序。

閘道啟動會在為非 loopback 繫結植入本機控制 UI 來源時，使用相同的有效連接埠與繫結。例如，`--bind lan --port 3000`
會在執行階段驗證執行前，先植入 `http://localhost:3000` 與 `http://127.0.0.1:3000`。
請將任何遠端瀏覽器來源，例如 HTTPS 代理 URL，明確加入
`gateway.controlUi.allowedOrigins`。

### 熱重新載入模式

| `gateway.reload.mode` | 行為                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | 不重新載入設定                           |
| `hot`                 | 只套用熱安全變更                |
| `restart`             | 在需要重新啟動的變更時重新啟動         |
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
單元/schtasks），不是更深入的 RPC 健康探測。

## 多個閘道（同一主機）

多數安裝應該每台機器執行一個閘道。單一閘道可以託管多個
代理程式與頻道。

只有在你刻意需要隔離或救援機器人時，才需要多個閘道。

實用檢查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

預期結果：

- `gateway status --deep` 可能會報告 `Other gateway-like services detected (best effort)`
  並在過時的 launchd/systemd/schtasks 安裝仍存在時印出清理提示。
- 當不同閘道回應，或 OpenClaw 無法證明可連線目標是同一個閘道時，
  `gateway probe` 可能會警告 `multiple reachable gateway identities`。
  指向同一閘道的 SSH 通道、代理 URL 或已設定的遠端 URL，
  即使傳輸連接埠不同，也是一個有多種傳輸方式的
  閘道。
- 如果這是刻意的，請為每個閘道隔離連接埠、設定/狀態與工作區根目錄。

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

建議：Tailscale/VPN。
備援：SSH 通道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

然後將用戶端在本機連線到 `ws://127.0.0.1:18789`。

<Warning>
SSH 通道不會繞過閘道驗證。對於共享祕密驗證，用戶端即使透過通道，
仍必須傳送 `token`/`password`。對於帶有身分的模式，
請求仍必須滿足該驗證路徑。
</Warning>

請參閱：[遠端閘道](/zh-TW/gateway/remote)、[驗證](/zh-TW/gateway/authentication)、[Tailscale](/zh-TW/gateway/tailscale)。

## 監督與服務生命週期

對類生產環境可靠性，請使用受監督執行。

<Tabs>
  <Tab title="macOS（launchd）">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

使用 `openclaw gateway restart` 進行重新啟動。不要將 `openclaw gateway stop` 和 `openclaw gateway start` 串接起來作為重新啟動替代方案。

在 macOS 上，`gateway stop` 預設使用 `launchctl bootout`，這會從目前開機工作階段移除 LaunchAgent，但不會持久停用，因此 KeepAlive 自動復原在非預期當機後仍會運作，且 `gateway start` 會乾淨地重新啟用。若要跨重新開機持久抑制自動重新產生，請傳入 `--disable`：`openclaw gateway stop --disable`。

LaunchAgent 標籤是 `ai.openclaw.gateway`（預設）或 `ai.openclaw.<profile>`（具名設定檔）。`openclaw doctor` 會稽核並修復服務設定漂移。

  </Tab>

  <Tab title="Linux（systemd 使用者）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

若要在登出後保持持久性，請啟用 lingering：

```bash
sudo loginctl enable-linger <user>
```

需要自訂安裝路徑時的手動使用者單元範例：

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
OOMPolicy=continue
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

原生 Windows 受管理啟動會使用名為 `OpenClaw Gateway`
（具名設定檔則為 `OpenClaw Gateway (<profile>)`）的排程工作。如果排程工作
建立遭拒，OpenClaw 會退回到每位使用者 Startup 資料夾啟動器，
指向狀態目錄內的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux（系統服務）">

對多使用者/永遠執行的主機，請使用系統單元。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用與使用者單元相同的服務本體，但將它安裝在
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，並在你的 `openclaw` 二進位檔位於其他位置時調整
`ExecStart=`。

不要也讓 `openclaw doctor --fix` 為相同設定檔/連接埠安裝使用者層級閘道服務。當 Doctor 找到系統層級 OpenClaw 閘道服務時，會拒絕該自動安裝；當系統單元擁有生命週期時，請使用 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Tab>
</Tabs>

## 開發設定檔快速路徑

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

預設包含隔離的狀態/設定與基礎閘道連接埠 `19001`。

## 協定快速參考（操作者視角）

- 第一個用戶端訊框必須是 `connect`。
- 閘道回傳 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、限制/政策）。
- `hello-ok.features.methods` / `events` 是保守的探索清單，不是
  每個可呼叫輔助路由的產生式傾印。
- 請求：`req(method, params)` → `res(ok/payload|error)`。
- 常見事件包含 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.operation`、`session.tool`、`sessions.changed`、
  `presence`、`tick`、`health`、`heartbeat`、配對/核准生命週期事件，
  以及 `shutdown`。

代理程式執行分為兩階段：

1. 立即接受確認（`status:"accepted"`）
2. 最終完成回應（`status:"ok"|"error"`），中間串流 `agent` 事件。

請參閱完整協定文件：[閘道協定](/zh-TW/gateway/protocol)。

## 操作檢查

### 存活狀態

- 開啟 WS 並傳送 `connect`。
- 預期收到含快照的 `hello-ok` 回應。

### 就緒狀態

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 間隙復原

事件不會重播。遇到序列間隙時，先重新整理狀態（`health`、`system-presence`）再繼續。

## 常見失敗特徵

| 簽章                                                           | 可能問題                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 沒有有效閘道驗證路徑的非迴路繫結                                                |
| `another gateway instance is already listening` / `EADDRINUSE` | 連接埠衝突                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 設定設為遠端模式，或受損設定缺少本機模式戳記                                    |
| `unauthorized` during connect                                  | 用戶端與閘道之間的驗證不符                                                      |

如需完整診斷階梯，請使用[閘道疑難排解](/zh-TW/gateway/troubleshooting)。

## 安全保證

- 閘道通訊協定用戶端會在閘道無法使用時快速失敗（不會隱含回退到直接通道）。
- 無效或非連線的第一個 frame 會被拒絕並關閉。
- 優雅關閉會在 socket 關閉前發出 `shutdown` 事件。

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
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
- [遠端存取](/zh-TW/gateway/remote)
- [密鑰管理](/zh-TW/gateway/secrets)
