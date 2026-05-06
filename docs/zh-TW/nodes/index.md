---
read_when:
    - 將 iOS/Android 節點與 Gateway 配對
    - 使用 Node 畫布/相機作為代理程式脈絡
    - 新增 Node 命令或 CLI 輔助工具
summary: Node：配對、能力、權限，以及 canvas/camera/screen/device/notifications/system 的 CLI 輔助工具
title: Node
x-i18n:
    generated_at: "2026-05-06T09:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

**Node** 是連接到 Gateway **WebSocket**（與操作者相同連接埠）的配套裝置（macOS/iOS/Android/headless），其 `role: "node"`，並透過 `node.invoke` 暴露命令介面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。通訊協定細節：[Gateway 通訊協定](/zh-TW/gateway/protocol)。

舊版傳輸：[Bridge 通訊協定](/zh-TW/gateway/bridge-protocol)（TCP JSONL；
對目前 Node 僅作歷史用途）。

macOS 也可以在 **Node 模式**中執行：選單列 app 會連接到 Gateway 的
WS 伺服器，並將其本機 canvas/camera 命令作為 Node 暴露（因此
`openclaw nodes …` 可對這台 Mac 運作）。在遠端 gateway 模式中，瀏覽器
自動化由 CLI Node 主機（`openclaw node run` 或已安裝的
Node 服務）處理，而不是由原生 app Node 處理。

注意事項：

- Node 是**周邊裝置**，不是 Gateway。它們不會執行 gateway 服務。
- Telegram/WhatsApp 等訊息會送達 **gateway**，而不是 Node。
- 疑難排解 runbook：[/nodes/troubleshooting](/zh-TW/nodes/troubleshooting)

## 配對 + 狀態

**WS Node 使用裝置配對。** Node 會在 `connect` 期間呈現裝置身分；Gateway
會為 `role: node` 建立裝置配對請求。請透過 devices CLI（或 UI）核准。

快速 CLI：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

如果 Node 以變更後的驗證詳細資料（role/scopes/public key）重試，先前的
待處理請求會被取代，並建立新的 `requestId`。核准前請重新執行
`openclaw devices list`。

注意事項：

- 當裝置配對 role 包含 `node` 時，`nodes status` 會將 Node 標記為**已配對**。
- 裝置配對記錄是持久的已核准 role 合約。Token
  輪替會保留在該合約內；它不能將已配對的 Node 升級為
  配對核准從未授予的不同 role。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject/remove/rename`）是另一個由 gateway 擁有的
  Node 配對儲存區；它**不會**管制 WS `connect` 握手。
- `openclaw nodes remove --node <id|name|ip>` 會從該
  另一個由 gateway 擁有的 Node 配對儲存區刪除過期項目。
- 核准範圍會依照待處理請求宣告的命令：
  - 無命令請求：`operator.pairing`
  - 非 exec Node 命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 遠端 Node 主機（system.run）

當你的 Gateway 在一台機器上執行，而你想在另一台機器上執行命令時，請使用 **Node 主機**。模型仍會與 **gateway** 通訊；當選取 `host=node` 時，gateway
會將 `exec` 呼叫轉送到 **Node 主機**。

### 哪些項目在哪裡執行

- **Gateway 主機**：接收訊息、執行模型、路由工具呼叫。
- **Node 主機**：在 Node 機器上執行 `system.run`/`system.which`。
- **核准**：透過 `~/.openclaw/exec-approvals.json` 在 Node 主機上強制執行。

核准注意事項：

- 以核准為基礎的 Node 執行會綁定精確的請求脈絡。
- 對於直接的 shell/runtime 檔案執行，OpenClaw 也會盡力綁定一個具體的本機
  檔案運算元，並在該檔案於執行前變更時拒絕執行。
- 如果 OpenClaw 無法為 interpreter/runtime 命令精確識別一個具體的本機檔案，
  以核准為基礎的執行會遭拒，而不是假裝具備完整 runtime 涵蓋範圍。請使用沙盒、
  獨立主機，或明確信任的 allowlist/完整工作流程，以支援更廣泛的 interpreter 語意。

### 啟動 Node 主機（前景）

在 Node 機器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### 透過 SSH tunnel 使用遠端 gateway（loopback 綁定）

如果 Gateway 綁定到 loopback（`gateway.bind=loopback`，本機模式預設），
遠端 Node 主機無法直接連線。請建立 SSH tunnel，並將
Node 主機指向 tunnel 的本機端。

範例（Node 主機 -> gateway 主機）：

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意事項：

- `openclaw node run` 支援 token 或密碼驗證。
- 建議使用環境變數：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 設定 fallback 為 `gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，Node 主機會刻意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在遠端模式中，`gateway.remote.token` / `gateway.remote.password` 會依遠端優先順序規則納入候選。
- 如果設定了作用中的本機 `gateway.auth.*` SecretRefs 但無法解析，Node 主機驗證會預設失敗關閉。
- Node 主機驗證解析只接受 `OPENCLAW_GATEWAY_*` 環境變數。

### 啟動 Node 主機（服務）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### 配對 + 命名

在 gateway 主機上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果 Node 以變更後的驗證詳細資料重試，請重新執行 `openclaw devices list`
並核准目前的 `requestId`。

命名選項：

- 在 `openclaw node run` / `openclaw node install` 上使用 `--display-name`（會保存在 Node 上的 `~/.openclaw/node.json`）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（gateway 覆寫）。

### 將命令加入 allowlist

Exec 核准是**依 Node 主機**設定的。從 gateway 新增 allowlist 項目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

核准位於 Node 主機上的 `~/.openclaw/exec-approvals.json`。

### 將 exec 指向 Node

設定預設值（gateway 設定）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或依工作階段設定：

```
/exec host=node security=allowlist node=<id-or-name>
```

設定後，任何帶有 `host=node` 的 `exec` 呼叫都會在 Node 主機上執行（受
Node allowlist/核准約束）。

`host=auto` 不會自行隱式選擇 Node，但允許從 `auto` 發出明確的逐次呼叫 `host=node` 請求。如果你想讓 Node exec 成為該工作階段的預設值，請明確設定 `tools.exec.host=node` 或 `/exec host=node ...`。

相關：

- [Node 主機 CLI](/zh-TW/cli/node)
- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)

## 叫用命令

低階（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

針對常見的「提供 MEDIA 附件給 agent」工作流程，也有較高階的 helper。

## 命令政策

Node 命令必須通過兩道關卡後才能被叫用：

1. Node 必須在其 WebSocket `connect.commands` 清單中宣告該命令。
2. gateway 的平台政策必須允許宣告的命令。

Windows 和 macOS 配套 Node 預設允許安全的已宣告命令，例如
`canvas.*`、`camera.list`、`location.get` 和 `screen.snapshot`。
宣告 `talk` capability 或宣告 `talk.*` 命令的受信任 Node
也預設允許已宣告的 push-to-talk 命令（`talk.ptt.start`、`talk.ptt.stop`、
`talk.ptt.cancel`、`talk.ptt.once`），不受平台標籤影響。
危險或涉及高度隱私的命令，例如 `camera.snap`、`camera.clip` 和
`screen.record`，仍需要透過
`gateway.nodes.allowCommands` 明確 opt-in。`gateway.nodes.denyCommands` 永遠優先於
預設值和額外 allowlist 項目。

Plugin 擁有的 Node 命令可以新增 Gateway node-invoke 政策。該政策
會在 allowlist 檢查後、轉送到 Node 前執行，因此原始
`node.invoke`、CLI helper 和專用 agent 工具都共用相同的 Plugin
權限邊界。危險的 Plugin Node 命令仍需要明確的
`gateway.nodes.allowCommands` opt-in。

Node 變更其宣告的命令清單後，請拒絕舊的裝置配對
並核准新請求，使 gateway 儲存更新後的命令快照。

## 螢幕截圖（canvas snapshots）

如果 Node 正在顯示 Canvas（WebView），`canvas.snapshot` 會回傳 `{ format, base64 }`。

CLI helper（寫入暫存檔並列印 `MEDIA:<path>`）：

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 控制

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意事項：

- `canvas present` 接受 URL 或本機檔案路徑（`--target`），並可另外使用 `--x/--y/--width/--height` 進行定位。
- `canvas eval` 接受 inline JS（`--js`）或位置引數。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意事項：

- 僅支援 A2UI v0.8 JSONL（v0.9/createSurface 會被拒絕）。

## 照片 + 影片（Node 相機）

照片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

影片片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意事項：

- Node 必須在**前景**，才能使用 `canvas.*` 和 `camera.*`（背景呼叫會回傳 `NODE_BACKGROUND_UNAVAILABLE`）。
- 片段長度會被限制（目前為 `<= 60s`），以避免 base64 payload 過大。
- Android 會在可行時提示 `CAMERA`/`RECORD_AUDIO` 權限；遭拒的權限會以 `*_PERMISSION_REQUIRED` 失敗。

## 螢幕錄影（Node）

支援的 Node 會暴露 `screen.record`（mp4）。範例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意事項：

- `screen.record` 可用性取決於 Node 平台。
- 螢幕錄影會被限制為 `<= 60s`。
- `--no-audio` 會在支援的平台上停用麥克風擷取。
- 當有多個螢幕可用時，使用 `--screen <index>` 選取顯示器。

## 位置（Node）

當設定中啟用 Location 時，Node 會暴露 `location.get`。

CLI helper：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意事項：

- Location **預設為關閉**。
- 「一律」需要系統權限；背景擷取是 best-effort。
- 回應包含 lat/lon、accuracy（公尺）和 timestamp。

## SMS（Android Node）

當使用者授予 **SMS** 權限且裝置支援電話功能時，Android Node 可以暴露 `sms.send`。

低階叫用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意事項：

- 權限提示必須先在 Android 裝置上接受，capability 才會被宣告。
- 沒有電話功能的 Wi-Fi-only 裝置不會宣告 `sms.send`。

## Android 裝置 + 個人資料命令

當對應 capability 啟用時，Android Node 可以宣告額外的命令系列。

可用系列：

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

呼叫範例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注意事項：

- Motion 命令會依可用感測器進行功能閘控。

## 系統命令（節點主機 / Mac 節點）

macOS 節點會公開 `system.run`、`system.notify` 和 `system.execApprovals.get/set`。
無頭節點主機會公開 `system.run`、`system.which` 和 `system.execApprovals.get/set`。

範例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注意事項：

- `system.run` 會在承載內容中傳回 stdout/stderr/結束碼。
- Shell 執行現在會透過 `exec` 工具並使用 `host=node`；`nodes` 仍是明確節點命令的直接 RPC 介面。
- `nodes invoke` 不會公開 `system.run` 或 `system.run.prepare`；這些只保留在 exec 路徑上。
- exec 路徑會在核准前準備標準的 `systemRunPlan`。核准一旦授予，Gateway 會轉送該已儲存的計畫，而不是任何後續由呼叫端編輯的 command/cwd/session 欄位。
- `system.notify` 會遵循 macOS 應用程式上的通知權限狀態。
- 未辨識的節點 `platform` / `deviceFamily` 中繼資料會使用保守的預設允許清單，其中排除 `system.run` 和 `system.which`。如果你刻意需要未知平台使用這些命令，請透過 `gateway.nodes.allowCommands` 明確新增。
- `system.run` 支援 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 對於 Shell 包裝器（`bash|sh|zsh ... -c/-lc`），請求範圍的 `--env` 值會縮減為明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允許清單模式中，對於一律允許的決策，已知分派包裝器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）會保留內部可執行檔路徑，而非包裝器路徑。如果無法安全解除包裝，系統不會自動保留任何允許清單項目。
- 在允許清單模式中的 Windows 節點主機上，透過 `cmd.exe /c` 進行的 Shell 包裝器執行需要核准（僅有允許清單項目不會自動允許包裝器形式）。
- `system.notify` 支援 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 節點主機會忽略 `PATH` 覆寫，並移除危險的啟動/Shell 金鑰（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）。如果你需要額外的 PATH 項目，請設定節點主機服務環境（或將工具安裝在標準位置），而不是透過 `--env` 傳遞 `PATH`。
- 在 macOS 節點模式中，`system.run` 會由 macOS 應用程式中的 exec 核准閘控（Settings → Exec approvals）。
  ask/allowlist/full 的行為與無頭節點主機相同；遭拒絕的提示會傳回 `SYSTEM_RUN_DENIED`。
- 在無頭節點主機上，`system.run` 會由 exec 核准（`~/.openclaw/exec-approvals.json`）閘控。

## Exec 節點繫結

當有多個節點可用時，你可以將 exec 繫結到特定節點。
這會設定 `exec host=node` 的預設節點（也可依每個代理覆寫）。

全域預設：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

每個代理的覆寫：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

取消設定以允許任何節點：

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 權限對應表

節點可在 `node.list` / `node.describe` 中包含 `permissions` 對應表，以權限名稱作為鍵（例如 `screenRecording`、`accessibility`），並使用布林值（`true` = 已授予）。

## 無頭節點主機（跨平台）

OpenClaw 可以執行連線到 Gateway WebSocket 並公開 `system.run` / `system.which` 的**無頭節點主機**（無 UI）。這適用於 Linux/Windows，或是在伺服器旁執行最小化節點。

啟動方式：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事項：

- 仍然需要配對（Gateway 會顯示裝置配對提示）。
- 節點主機會將其節點 ID、權杖、顯示名稱和 Gateway 連線資訊儲存在 `~/.openclaw/node.json`。
- Exec 核准會透過 `~/.openclaw/exec-approvals.json` 在本機強制執行
  （請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)）。
- 在 macOS 上，無頭節點主機預設會在本機執行 `system.run`。設定
  `OPENCLAW_NODE_EXEC_HOST=app` 可將 `system.run` 路由到配套應用程式的 exec 主機；新增
  `OPENCLAW_NODE_EXEC_FALLBACK=0` 可要求使用應用程式主機，並在其無法使用時封閉失敗。
- 當 Gateway WS 使用 TLS 時，請新增 `--tls` / `--tls-fingerprint`。

## Mac 節點模式

- macOS 選單列應用程式會以節點身分連線到 Gateway WS 伺服器（因此 `openclaw nodes …` 可對此 Mac 運作）。
- 在遠端模式中，應用程式會為 Gateway 連接埠開啟 SSH 通道並連線到 `localhost`。
