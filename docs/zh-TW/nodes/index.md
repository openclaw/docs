---
read_when:
    - 將 iOS/Android 節點配對到閘道
    - 使用節點畫布/相機作為代理程式上下文
    - 新增節點命令或命令列介面輔助工具
summary: 節點：配對、功能、權限，以及用於畫布/相機/螢幕/裝置/通知/系統的命令列介面輔助工具
title: 節點
x-i18n:
    generated_at: "2026-07-03T09:22:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

**節點**是連線到閘道 **WebSocket**（與操作者相同的連接埠）的伴隨裝置（macOS/iOS/Android/無頭），使用 `role: "node"`，並透過 `node.invoke` 公開命令介面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。通訊協定細節：[閘道通訊協定](/zh-TW/gateway/protocol)。

傳統傳輸：[Bridge 通訊協定](/zh-TW/gateway/bridge-protocol)（TCP JSONL；
僅供目前節點的歷史用途）。

macOS 也可以在**節點模式**執行：選單列 app 會連線到閘道的
WS 伺服器，並以節點身分公開其本機 canvas/camera 命令（因此
`openclaw nodes …` 可對這台 Mac 運作）。在遠端閘道模式中，瀏覽器
自動化由命令列介面節點主機（`openclaw node run` 或已安裝的
節點服務）處理，而不是由原生 app 節點處理。

注意：

- 節點是**周邊裝置**，不是閘道。它們不會執行閘道服務。
- Telegram/WhatsApp/等等訊息會落在**閘道**上，而不是節點上。
- 疑難排解手冊：[/nodes/troubleshooting](/zh-TW/nodes/troubleshooting)

## 配對 + 狀態

**WS 節點使用裝置配對。** 節點會在 `connect` 期間提供裝置身分；閘道
會為 `role: node` 建立裝置配對請求。透過 devices 命令列介面（或 UI）核准。

快速命令列介面：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

如果節點以變更過的驗證詳細資料（角色/範圍/公開金鑰）重試，先前的
待處理請求會被取代，並建立新的 `requestId`。核准前請重新執行
`openclaw devices list`。

注意：

- 當節點的裝置配對角色包含 `node` 時，`nodes status` 會將節點標示為**已配對**。
- 裝置配對記錄是持久的已核准角色合約。權杖
  輪替會留在該合約內；它不能將已配對的節點升級成
  配對核准從未授予的不同角色。
- `node.pair.*`（命令列介面：`openclaw nodes pending/approve/reject/remove/rename`）是另一個由閘道擁有的
  節點配對儲存區；它**不會**管制 WS `connect` 交握。
- `openclaw nodes remove --node <id|name|ip>` 會移除節點配對。對於
  裝置支援的節點，它會撤銷 `devices/paired.json` 中該裝置的 `node` 角色
  並中斷該裝置的節點角色工作階段；混合角色裝置會保留
  其列且只失去 `node` 角色，而僅節點裝置列則會
  刪除。它也會從另一個由閘道擁有的節點
  配對儲存區清除任何相符項目。`operator.pairing` 可以移除非操作者節點列；在混合角色裝置上撤銷自身節點角色的
  裝置權杖呼叫者
  還需要 `operator.admin`。
- 核准範圍會遵循待處理請求宣告的命令：
  - 無命令請求：`operator.pairing`
  - 非 exec 節點命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 遠端節點主機（system.run）

當你的閘道在一台機器上執行，而你希望命令在另一台機器上
執行時，請使用**節點主機**。模型仍會與**閘道**通訊；當選取 `host=node` 時，閘道
會將 `exec` 呼叫轉送到**節點主機**。

### 哪些東西在哪裡執行

- **閘道主機**：接收訊息、執行模型、路由工具呼叫。
- **節點主機**：在節點機器上執行 `system.run`/`system.which`。
- **核准**：透過 `~/.openclaw/exec-approvals.json` 在節點主機上強制執行。

核准注意事項：

- 以核准為基礎的節點執行會繫結確切的請求內容。
- 對於直接 shell/runtime 檔案執行，OpenClaw 也會盡力繫結一個具體的本機
  檔案運算元，並在該檔案於執行前變更時拒絕執行。
- 如果 OpenClaw 無法為直譯器/runtime 命令精確識別一個具體的本機檔案，
  以核准為基礎的執行會被拒絕，而不是假裝具備完整 runtime 覆蓋範圍。請使用沙箱、
  獨立主機，或明確受信任的允許清單/完整工作流程，以處理更廣泛的直譯器語意。

### 啟動節點主機（前景）

在節點機器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### 透過 SSH 通道連到遠端閘道（loopback 繫結）

如果閘道繫結到 loopback（`gateway.bind=loopback`，本機模式的預設值），
遠端節點主機無法直接連線。請建立 SSH 通道，並將
節點主機指向通道的本機端。

範例（節點主機 -> 閘道主機）：

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意：

- `openclaw node run` 支援權杖或密碼驗證。
- 建議使用環境變數：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 設定後援是 `gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，節點主機會刻意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在遠端模式中，`gateway.remote.token` / `gateway.remote.password` 可依遠端優先順序規則使用。
- 如果已設定作用中的本機 `gateway.auth.*` SecretRefs 但未解析，節點主機驗證會以失敗關閉。
- 節點主機驗證解析只接受 `OPENCLAW_GATEWAY_*` 環境變數。

### 啟動節點主機（服務）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### 配對 + 命名

在閘道主機上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果節點以變更過的驗證詳細資料重試，請重新執行 `openclaw devices list`
並核准目前的 `requestId`。

命名選項：

- `openclaw node run` / `openclaw node install` 上的 `--display-name`（會持久化到節點上的 `~/.openclaw/node.json`）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（閘道覆寫）。

### 允許清單命令

Exec 核准是**每個節點主機**各自獨立的。從閘道新增允許清單項目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

核准位於節點主機的 `~/.openclaw/exec-approvals.json`。

### 將 exec 指向節點

設定預設值（閘道設定）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或每個工作階段：

```
/exec host=node security=allowlist node=<id-or-name>
```

設定後，任何帶有 `host=node` 的 `exec` 呼叫都會在節點主機上執行（受
節點允許清單/核准限制）。

`host=auto` 不會自行隱含選擇節點，但允許來自 `auto` 的明確每次呼叫 `host=node` 請求。如果你希望節點 exec 成為工作階段預設值，請明確設定 `tools.exec.host=node` 或 `/exec host=node ...`。

相關：

- [節點主機命令列介面](/zh-TW/cli/node)
- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)

### 本機模型推論

桌面或伺服器節點可以公開在該節點上執行的 Ollama 伺服器所提供、具備聊天能力的模型。
代理會使用 Ollama 外掛的 `node_inference` 工具來
探索已安裝模型並遠端執行有界提示；閘道不需要
直接網路存取 Ollama。請參閱 [Ollama 節點本機推論](/zh-TW/providers/ollama#node-local-inference)
以了解設定、模型篩選，以及直接驗證命令。

## 叫用命令

低階（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

較高階的輔助工具可用於常見的「提供代理 MEDIA 附件」工作流程。

## 命令政策

節點命令必須通過兩道關卡，才能被叫用：

1. 節點必須在其 WebSocket `connect.commands` 清單中宣告該命令。
2. 閘道的平台政策必須允許宣告的命令。

Windows 和 macOS 伴隨節點預設允許安全的宣告命令，例如
`canvas.*`、`camera.list`、`location.get` 和 `screen.snapshot`。
宣告 `talk` capability 或宣告 `talk.*` 命令的受信任節點
也預設允許宣告的按鍵通話命令（`talk.ptt.start`、`talk.ptt.stop`、
`talk.ptt.cancel`、`talk.ptt.once`），不受平台標籤影響。
危險或高度涉及隱私的命令，例如 `camera.snap`、`camera.clip` 和
`screen.record`，仍需要透過
`gateway.nodes.allowCommands` 明確選擇啟用。`gateway.nodes.denyCommands` 一律優先於
預設值和額外允許清單項目。

外掛擁有的節點命令可以新增閘道 node-invoke 政策。該政策
會在允許清單檢查之後、轉送到節點之前執行，因此原始
`node.invoke`、命令列介面輔助工具和專用代理工具會共用相同的外掛
權限邊界。危險的外掛節點命令仍需要明確
透過 `gateway.nodes.allowCommands` 選擇啟用。

節點變更其宣告的命令清單後，請拒絕舊的裝置配對
並核准新的請求，讓閘道儲存更新後的命令快照。

## 設定（`openclaw.json`）

節點相關設定位於 `gateway.nodes` 和 `tools.exec` 底下：

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

請使用精確的節點命令名稱。即使平台預設或 `allowCommands` 項目
原本會允許某命令，`denyCommands` 也會移除該命令。請參閱
[閘道設定參考](/zh-TW/gateway/configuration-reference#gateway-field-details)
以了解閘道節點配對和命令政策欄位細節。

每個代理的 exec 節點覆寫：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## 螢幕截圖（canvas 快照）

如果節點正在顯示 Canvas（WebView），`canvas.snapshot` 會回傳 `{ format, base64 }`。

命令列介面輔助工具（寫入暫存檔並列印儲存路徑）：

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

注意：

- `canvas present` 接受 URL 或本機檔案路徑（`--target`），另可使用選用的 `--x/--y/--width/--height` 進行定位。
- `canvas eval` 接受內嵌 JS（`--js`）或位置引數。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意：

- 行動節點使用隨附、由應用程式擁有的 A2UI 頁面，以支援具備動作能力的算繪。
- 僅支援 A2UI v0.8 JSONL（v0.9/createSurface 會被拒絕）。
- iOS 和 Android 會算繪遠端閘道 Canvas 頁面，但 A2UI 按鈕動作只會從隨附、由應用程式擁有的 A2UI 頁面派送。這些行動用戶端上的閘道託管 HTTP/HTTPS A2UI 頁面僅供算繪。

## 相片 + 影片（節點攝影機）

相片 (`jpg`)：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

影片片段 (`mp4`)：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意事項：

- 節點必須位於**前景**，才能使用 `canvas.*` 和 `camera.*`（背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 片段長度會被限制（目前 `<= 60s`），以避免過大的 base64 酬載。
- Android 會在可行時提示 `CAMERA`/`RECORD_AUDIO` 權限；權限遭拒會以 `*_PERMISSION_REQUIRED` 失敗。

## 螢幕錄影（節點）

支援的節點會公開 `screen.record` (mp4)。範例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意事項：

- `screen.record` 可用性取決於節點平台。
- 螢幕錄影會被限制為 `<= 60s`。
- `--no-audio` 會在支援的平台停用麥克風擷取。
- 當有多個螢幕可用時，使用 `--screen <index>` 選取顯示器。

## 位置（節點）

當設定中啟用位置時，節點會公開 `location.get`。

命令列介面輔助程式：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意事項：

- 位置**預設為關閉**。
- 「永遠」需要系統權限；背景擷取是盡力而為。
- 回應包含緯度/經度、準確度（公尺）和時間戳記。

## SMS（Android 節點）

當使用者授予 **SMS** 權限且裝置支援電話功能時，Android 節點可以公開 `sms.send`。

低階叫用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意事項：

- 必須先在 Android 裝置上接受權限提示，才會公告該能力。
- 沒有電話功能的僅 Wi-Fi 裝置不會公告 `sms.send`。

## Android 裝置 + 個人資料命令

當對應能力啟用時，Android 節點可以公告額外的命令系列。

可用系列：

- `device.status`, `device.info`, `device.permissions`, `device.health`
- 啟用 Android 設定中的已安裝應用程式分享時，提供 `device.apps`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

叫用範例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注意事項：

- `device.apps` 是選擇性加入，且預設傳回啟動器可見的應用程式。
- 動作命令會依可用感測器進行能力控管。

## 系統命令（節點主機 / Mac 節點）

macOS 節點會公開 `system.run`、`system.notify` 和 `system.execApprovals.get/set`。
無頭節點主機會公開 `system.run`、`system.which` 和 `system.execApprovals.get/set`。

範例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注意事項：

- `system.run` 會在酬載中傳回 stdout/stderr/退出碼。
- Shell 執行現在會透過 `exec` 工具並搭配 `host=node`；`nodes` 仍是明確節點命令的直接 RPC 介面。
- `nodes invoke` 不會公開 `system.run` 或 `system.run.prepare`；這些只保留在 exec 路徑上。
- exec 路徑會在核准前準備標準的 `systemRunPlan`。一旦授予
  核准，閘道會轉送該已儲存的計畫，而不是任何後續
  呼叫者編輯過的 command/cwd/session 欄位。
- `system.notify` 會遵循 macOS 應用程式上的通知權限狀態。
- 無法辨識的節點 `platform` / `deviceFamily` 中繼資料會使用保守的預設允許清單，排除 `system.run` 和 `system.which`。如果你刻意需要在未知平台使用這些命令，請透過 `gateway.nodes.allowCommands` 明確加入。
- `system.run` 支援 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 對於 Shell 包裝器（`bash|sh|zsh ... -c/-lc`），請求範圍的 `--env` 值會縮減為明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允許清單模式下，對於永遠允許決策，已知派送包裝器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保留內部可執行檔路徑，而不是包裝器路徑。如果無法安全解除包裝，將不會自動保留允許清單項目。
- 在允許清單模式下的 Windows 節點主機上，透過 `cmd.exe /c` 執行 Shell 包裝器需要核准（僅有允許清單項目不會自動允許包裝器形式）。
- `system.notify` 支援 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 節點主機會忽略 `PATH` 覆寫，並移除危險的啟動/ Shell 金鑰（`DYLD_*`、`LD_*`、`BASHOPTS`、`FPATH`、`KSH_ENV`、`NODE_OPTIONS`、`NODE_REDIRECT_WARNINGS`、`NODE_REPL_EXTERNAL_MODULE`、`NODE_REPL_HISTORY`、`NODE_V8_COVERAGE`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`、`TCLLIBPATH`）。如果需要額外的 PATH 項目，請設定節點主機服務環境（或將工具安裝在標準位置），而不是透過 `--env` 傳遞 `PATH`。
- 在 macOS 節點模式下，`system.run` 由 macOS 應用程式中的 exec 核准控管（Settings → Exec approvals）。
  詢問/允許清單/完整的行為與無頭節點主機相同；遭拒的提示會傳回 `SYSTEM_RUN_DENIED`。
- 在無頭節點主機上，`system.run` 由 exec 核准控管（`~/.openclaw/exec-approvals.json`）。

## Exec 節點繫結

當有多個節點可用時，你可以將 exec 繫結到特定節點。
這會設定 `exec host=node` 的預設節點（也可按代理覆寫）。

全域預設：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

按代理覆寫：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

取消設定以允許任何節點：

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 權限對應

節點可能會在 `node.list` / `node.describe` 中包含 `permissions` 對應，以權限名稱為鍵（例如 `screenRecording`、`accessibility`），並使用布林值（`true` = 已授予）。

## 無頭節點主機（跨平台）

OpenClaw 可以執行連線至閘道
WebSocket 並公開 `system.run` / `system.which` 的**無頭節點主機**（無 UI）。這在 Linux/Windows
上，或在伺服器旁執行最小節點時很有用。

啟動它：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事項：

- 仍然需要配對（閘道會顯示裝置配對提示）。
- 節點主機會將其節點 ID、權杖、顯示名稱和閘道連線資訊儲存在 `~/.openclaw/node.json`。
- Exec 核准會透過 `~/.openclaw/exec-approvals.json` 在本機強制執行
  （請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)）。
- 在 macOS 上，無頭節點主機預設會在本機執行 `system.run`。設定
  `OPENCLAW_NODE_EXEC_HOST=app` 可將 `system.run` 透過隨附應用程式 exec 主機路由；加入
  `OPENCLAW_NODE_EXEC_FALLBACK=0` 可要求使用應用程式主機，並在其不可用時以關閉方式失敗。
- 當閘道 WS 使用 TLS 時，加入 `--tls` / `--tls-fingerprint`。

## Mac 節點模式

- macOS 選單列應用程式會以節點身分連線至閘道 WS 伺服器（因此 `openclaw nodes …` 可對此 Mac 運作）。
- 在遠端模式中，應用程式會為閘道連接埠開啟 SSH 通道，並連線至 `localhost`。
