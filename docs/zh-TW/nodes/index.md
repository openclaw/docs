---
read_when:
    - 將 iOS/Android 節點配對到閘道
    - 使用節點畫布/相機作為代理程式上下文
    - 新增節點命令或命令列介面輔助工具
summary: 節點：畫布/相機/螢幕/裝置/通知/系統的配對、功能、權限與命令列介面輔助工具
title: 節點
x-i18n:
    generated_at: "2026-07-05T11:25:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8a781c60e80989d35dcf5bfefe8a3c706e1a1682377876e0d83da924bfcb908
    source_path: nodes/index.md
    workflow: 16
---

一個**節點**是連線至 Gateway **WebSocket**（與操作員相同的連接埠）並帶有 `role: "node"` 的伴隨裝置（macOS/iOS/Android/headless），且會透過 `node.invoke` 公開命令介面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。通訊協定詳細資料：[Gateway 通訊協定](/zh-TW/gateway/protocol)。

舊版傳輸：[Bridge 通訊協定](/zh-TW/gateway/bridge-protocol)（TCP JSONL；僅供目前節點的歷史用途）。

macOS 也可以在**節點模式**下執行：選單列應用程式會連線至 Gateway 的 WS 伺服器，並將其本機 canvas/camera 命令作為節點公開（因此 `openclaw nodes …` 可對這台 Mac 運作）。在遠端 gateway 模式中，瀏覽器自動化由命令列介面節點主機（`openclaw node run` 或已安裝的節點服務）處理，而不是由原生應用程式節點處理。

節點是**周邊裝置**，不是 gateway：它們不執行 gateway 服務，且通道訊息（Telegram、WhatsApp 等）會送達 gateway，而不是節點。

疑難排解手冊：[/nodes/troubleshooting](/zh-TW/nodes/troubleshooting)

## 配對 + 狀態

WS 節點使用**裝置配對**。節點會在 `connect` 期間呈現裝置身分；Gateway 會為 `role: node` 建立裝置配對請求。透過 devices 命令列介面（或 UI）核准。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

待處理的配對請求會在 5 分鐘後過期；完整的請求/核准/權杖生命週期請參閱 [Gateway 擁有的配對](/zh-TW/gateway/pairing)。如果節點以變更後的驗證詳細資料（角色/範圍/公開金鑰）重試，先前的待處理請求會被取代，並建立新的 `requestId` — 核准前請重新執行 `openclaw devices list`。

- 當節點的裝置配對角色包含 `node` 時，`nodes status` 會將節點標記為**已配對**。
- 裝置配對記錄是持久的已核准角色合約。權杖輪替會留在該合約內；它無法將已配對的節點升級成配對核准從未授予的角色。
- `node.pair.*`（命令列介面：`openclaw nodes pending/approve/reject/remove/rename`）是另一個由 gateway 擁有的節點配對存放區，用於跨重新連線追蹤節點已核准的命令/功能介面。它**不會**控管 WS `connect` 交握 — 裝置配對會控管該交握。
- `openclaw nodes remove --node <id|name|ip>` 會移除節點配對。對於由裝置支援的節點，它會撤銷 `devices/paired.json` 中該裝置的 `node` 角色，並中斷該裝置的節點角色工作階段：混合角色裝置會保留其資料列且只失去 `node` 角色，而只有節點的裝置資料列會被刪除。它也會從獨立的節點配對存放區清除任何相符項目。`operator.pairing` 可移除其他裝置上的非操作員節點資料列；裝置權杖呼叫端若要撤銷混合角色裝置上的自身節點角色，還需要 `operator.admin`。
- 核准範圍會遵循待處理請求宣告的命令：
  - 無命令請求：`operator.pairing`
  - 非 exec 節點命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 遠端節點主機 (system.run)

當你的 Gateway 在一台機器上執行，而你希望命令在另一台機器上執行時，請使用**節點主機**。模型仍會與 **gateway** 對話；選取 `host=node` 時，gateway 會將 `exec` 呼叫轉送至**節點主機**。

| 角色         | 責任                                                   |
| ------------ | ---------------------------------------------------------------- |
| Gateway 主機 | 接收訊息、執行模型、路由工具呼叫。            |
| 節點主機    | 在節點機器上執行 `system.run`/`system.which`。        |
| 核准    | 在節點主機上透過 `~/.openclaw/exec-approvals.json` 強制執行。 |

核准注意事項：

- 由核准支援的節點執行會繫結精確的請求內容。exec 路徑會在核准前準備標準的 `systemRunPlan`；一旦授權，gateway 會轉送該已儲存的計畫，而不是任何後續呼叫端編輯過的命令/cwd/session 欄位，並會在執行前重新驗證工作目錄。
- 對於直接 shell/runtime 檔案執行，OpenClaw 也會盡力繫結一個具體的本機檔案運算元，並在該檔案於執行前變更時拒絕執行。
- 如果 OpenClaw 無法為直譯器/runtime 命令精確識別一個具體的本機檔案，由核准支援的執行會被拒絕，而不是假裝具備完整 runtime 覆蓋範圍。若需要更廣泛的直譯器語意，請使用沙箱、獨立主機，或明確受信任的 allowlist/完整工作流程。

### 啟動節點主機（前景）

在節點機器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` 也接受 `--context-path`（Gateway WS context path）、`--tls`、`--tls-fingerprint <sha256>` 和 `--node-id`（覆寫它會清除配對權杖）。

### 透過 SSH 通道連線至遠端 gateway（loopback 繫結）

如果 Gateway 繫結至 loopback（`gateway.bind=loopback`，本機模式的預設值），遠端節點主機無法直接連線。請建立 SSH 通道，並將節點主機指向通道的本機端。

範例（節點主機 -> gateway 主機）：

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意事項：

- `openclaw node run` 支援權杖或密碼驗證。
- 建議使用環境變數：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 設定備援為 `gateway.auth.token` / `gateway.auth.password`。
- 在本機模式中，節點主機會刻意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在遠端模式中，`gateway.remote.token` / `gateway.remote.password` 會依遠端優先順序規則適用。
- 如果已設定有效的本機 `gateway.auth.*` SecretRefs 但尚未解析，節點主機驗證會以失敗關閉。
- 節點主機驗證解析只遵循 `OPENCLAW_GATEWAY_*` 環境變數。

### 啟動節點主機（服務）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` 也接受 `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`、`--runtime <node|bun>`（預設：node），以及用於重新安裝的 `--force`。`node status`、`node stop` 和 `node uninstall` 也可使用。

### 配對 + 命名

在 gateway 主機上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果節點以變更後的驗證詳細資料重試，請重新執行 `openclaw devices list` 並核准目前的 `requestId`。

命名選項：

- `openclaw node run` / `openclaw node install` 上的 `--display-name`（會持久保存在節點上的 `~/.openclaw/node.json`，與節點 id、權杖和 gateway 連線資訊並列）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（gateway 覆寫）。

### 將命令加入 allowlist

Exec 核准是**每個節點主機**各自套用。從 gateway 新增 allowlist 項目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

核准位於節點主機上的 `~/.openclaw/exec-approvals.json`。

### 將 exec 指向節點

設定預設值（gateway 設定）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或針對每個工作階段：

```text
/exec host=node security=allowlist node=<id-or-name>
```

設定後，任何帶有 `host=node` 的 `exec` 呼叫都會在節點主機上執行（受限於節點 allowlist/核准）。

`host=auto` 不會自行隱含選擇節點，但來自 `auto` 的明確逐呼叫 `host=node` 請求是允許的。如果你想讓節點 exec 成為工作階段的預設值，請明確設定 `tools.exec.host=node` 或 `/exec host=node ...`。

相關：

- [節點主機命令列介面](/zh-TW/cli/node)
- [Exec 工具](/zh-TW/tools/exec)
- [Exec 核准](/zh-TW/tools/exec-approvals)

### 本機模型推論

桌面或伺服器節點可以公開在該節點上執行的 Ollama 伺服器所提供、具備聊天功能的模型。代理會使用 Ollama 外掛的 `node_inference` 工具來探索已安裝的模型，並遠端執行有界限的提示；Gateway 不需要直接網路存取 Ollama。設定、模型篩選和直接驗證命令請參閱 [Ollama 節點本機推論](/zh-TW/providers/ollama#node-local-inference)。

## 呼叫命令

低階（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` 會封鎖 `system.run` 和 `system.run.prepare`；這些命令只會透過帶有 `host=node` 的 `exec` 工具執行（見上文）。常見的「給代理 MEDIA 附件」工作流程（canvas、camera、screen、location，見下方）已有較高階的輔助工具。

## 命令政策

節點命令必須通過兩道關卡才能被呼叫：

1. 節點必須在其 WebSocket `connect.commands` 清單中宣告該命令。
2. gateway 的平台與核准衍生 allowlist 必須包含宣告的命令。

依平台的預設 allowlist（在外掛預設值與 `allowCommands`/`denyCommands` 覆寫之前）：

| 平台 | 預設允許的命令                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（節點主機命令如 `system.run` 由核准控管，見下方）                                                                                                                                                                                                                                  |

`canvas.*` 命令（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）是 iOS、Android、macOS、Windows 和未知平台（非 Linux）上的外掛預設值；所有這些命令在 iOS 上都限制於前景。

`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once` 預設允許任何宣告 `talk` 能力或宣告 `talk.*` 命令的節點使用，不受平台標籤影響。

桌面主機命令（macOS/Windows 上的 `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`screen.snapshot`）不屬於上方的靜態平台預設表。它們會在操作者核准宣告這些命令的配對要求後可用，之後節點已核准的命令集會在重新連線時延續這些命令。

危險或高度涉及隱私的命令仍需要透過 `gateway.nodes.allowCommands` 明確選擇加入，即使節點已宣告它們也是如此：`camera.snap`、`camera.clip`、`screen.record`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` 一律優先於預設值和額外的允許清單項目。

外掛擁有的節點命令可以加入閘道節點呼叫政策。該政策會在允許清單檢查之後、轉送到節點之前執行，因此原始 `node.invoke`、命令列介面輔助工具和專用代理工具會共用相同的外掛權限邊界。危險的外掛節點命令仍需要明確透過 `gateway.nodes.allowCommands` 選擇加入。

節點變更其宣告的命令清單後，請拒絕舊裝置配對並核准新的要求，讓閘道儲存更新後的命令快照。

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

請使用精確的節點命令名稱。即使平台預設值或 `allowCommands` 項目原本會允許某個命令，`denyCommands` 也會移除該命令。請參閱[閘道設定參考](/zh-TW/gateway/configuration-reference#gateway)，了解閘道節點配對和命令政策欄位的詳細資訊。

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

### Canvas 控制項

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意事項：

- `canvas present` 接受 URL 或本機檔案路徑（`--target`），也可加上選用的 `--x/--y/--width/--height` 來定位。
- `canvas eval` 接受行內 JS（`--js`）或位置引數。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意事項：

- 行動節點會使用隨附的應用程式擁有 A2UI 頁面，以進行具備動作能力的算繪。
- 僅支援 A2UI v0.8 JSONL（v0.9/createSurface 會被拒絕）。
- iOS 和 Android 會算繪遠端閘道 Canvas 頁面，但 A2UI 按鈕動作只會從隨附的應用程式擁有 A2UI 頁面分派。在這些行動用戶端上，閘道託管的 HTTP/HTTPS A2UI 頁面僅供算繪。

## 照片 + 影片（節點相機）

照片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

影片片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意事項：

- 節點必須位於**前景**才能使用 `canvas.*` 和 `camera.*`（背景呼叫會回傳 `NODE_BACKGROUND_UNAVAILABLE`）。
- 節點會限制片段長度，讓 base64 承載大小保持可控（請參閱[相機擷取](/zh-TW/nodes/camera)了解各平台的精確限制）。`nodes` 代理工具在轉送呼叫前，還會將要求的 `durationMs` 上限設為 300000（5 分鐘）；節點本身會執行更嚴格的限制。
- Android 會在可能時提示 `CAMERA`/`RECORD_AUDIO` 權限；被拒絕的權限會以 `*_PERMISSION_REQUIRED` 失敗。

## 螢幕錄影（節點）

支援的節點會公開 `screen.record`（mp4）。範例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意事項：

- `screen.record` 可用性取決於節點平台。
- `nodes` 代理工具會將要求的 `durationMs` 上限設為 300000（5 分鐘）；節點可能會執行更嚴格的限制，以限制回傳承載大小。
- `--no-audio` 會在支援的平台上停用麥克風擷取。
- 有多個螢幕可用時，請使用 `--screen <index>` 選取顯示器（0 = 主要）。

## 位置（節點）

當設定中啟用位置時，節點會公開 `location.get`。

命令列介面輔助工具：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意事項：

- 位置預設為**關閉**。
- 「一律」需要系統權限；背景擷取會盡力執行。
- 回應包含 lat/lon、精確度（公尺）和時間戳記。
- 完整參數/回應形狀和錯誤碼：[位置命令](/zh-TW/nodes/location-command)。

## SMS（Android 節點）

當使用者授予 **SMS** 權限且裝置支援電話功能時，Android 節點可以公開 `sms.send` 和 `sms.search`。這兩個命令預設都是危險命令：閘道操作者也必須先將它們加入 `gateway.nodes.allowCommands`，才能呼叫它們（請參閱[命令政策](#command-policy)）。

低階呼叫：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意事項：

- 必須先在 Android 裝置上接受權限提示，才會宣告該能力。
- 沒有電話功能的 Wi-Fi-only 裝置不會宣告 `sms.send`。

## 裝置與個人資料命令

iOS、Android 和 macOS 節點預設會宣告多個唯讀資料命令（請參閱[命令政策](#command-policy)表）；Android 另外會公開較大的命令家族，並由其自身的應用程式內設定控管。

可用家族：

- `device.status`、`device.info` — iOS、Android、macOS、Windows。
- `device.permissions`、`device.health`、`device.apps` — 僅限 Android；`device.apps` 需要在 Android 設定中啟用已安裝應用程式分享，且預設會回傳啟動器可見的應用程式。
- `notifications.list`、`notifications.actions` — 僅限 Android。
- `photos.latest` — iOS、Android、macOS。
- `contacts.search` — iOS、Android、macOS（預設唯讀）；`contacts.add` 是危險命令，需要 `gateway.nodes.allowCommands`。
- `calendar.events` — iOS、Android、macOS（預設唯讀）；`calendar.add` 是危險命令，需要 `gateway.nodes.allowCommands`。
- `reminders.list` — iOS、Android、macOS（預設唯讀）；`reminders.add` 是危險命令，需要 `gateway.nodes.allowCommands`。
- `callLog.search` — 僅限 Android。
- `motion.activity`、`motion.pedometer` — iOS、Android、macOS；由可用感測器進行能力控管。

呼叫範例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## 系統命令（節點主機 / mac 節點）

macOS 節點會公開 `system.run`、`system.notify` 和 `system.execApprovals.get/set`。無頭節點主機會公開 `system.run`、`system.which` 和 `system.execApprovals.get/set`。

範例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注意事項：

- `system.run` 會在承載中回傳 stdout/stderr/exit code。
- Shell 執行現在會透過 `exec` 工具並使用 `host=node`；`nodes` 仍是明確節點命令的 direct-RPC 介面。
- `nodes invoke` 不會公開 `system.run` 或 `system.run.prepare`；它們只保留在 exec 路徑上。
- exec 路徑會在核准前準備標準 `systemRunPlan`。核准授予後，閘道會轉送該已儲存的計畫，而不是任何稍後由呼叫者編輯的 command/cwd/session 欄位。
- `system.notify` 會遵循 macOS 應用程式上的通知權限狀態；支援 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 無法辨識的節點 `platform` / `deviceFamily` 中繼資料會使用保守的預設允許清單，排除 `system.run` 和 `system.which`。如果你刻意需要未知平台使用這些命令，請透過 `gateway.nodes.allowCommands` 明確加入。
- `system.run` 支援 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 對於 shell 包裝器（`bash|sh|zsh ... -c/-lc`），要求範圍的 `--env` 值會縮減為明確允許清單（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允許清單模式下，對於一律允許的決策，已知分派包裝器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）會保留內部可執行檔路徑，而不是包裝器路徑。如果無法安全解除包裝，系統不會自動保留任何允許清單項目。
- 在允許清單模式下的 Windows 節點主機上，透過 `cmd.exe /c` 執行的 shell 包裝器需要核准（僅有允許清單項目不會自動允許包裝器形式）。
- 節點主機會忽略 `--env` 中的 `PATH` 覆寫，並在執行命令前移除大量維護中的直譯器/shell 啟動變數（例如 `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）。如果你需要額外的 PATH 項目，請設定節點主機服務環境（或將工具安裝在標準位置），而不是透過 `--env` 傳遞 `PATH`。
- 在 macOS 節點模式中，`system.run` 由 macOS 應用程式中的 exec 核准控管（設定 → Exec approvals）。Ask/allowlist/full 的行為與無頭節點主機相同；被拒絕的提示會回傳 `SYSTEM_RUN_DENIED`。
- 在無頭節點主機上，`system.run` 由 exec 核准控管（`~/.openclaw/exec-approvals.json`）；特別是在 macOS 上，請參閱下方[無頭節點主機](#headless-node-host-cross-platform)中的 exec-host 路由環境變數。

## Exec 節點繫結

當有多個節點可用時，你可以將 exec 繫結到特定節點。這會設定 `exec host=node` 的預設節點（也可針對每個代理覆寫）。

全域預設值：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

個別代理程式覆寫：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

取消設定以允許任何節點：

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 權限對應表

節點可在 `node.list` / `node.describe` 中包含 `permissions` 對應表，以權限名稱（例如 `screenRecording`、`accessibility`、`location`）作為鍵，並使用布林值（`true` = 已授權）。

## 無頭節點主機（跨平台）

OpenClaw 可以執行連線到閘道 WebSocket 並公開 `system.run` / `system.which` 的**無頭節點主機**（無 UI）。這在 Linux/Windows 上，或要在伺服器旁執行最小節點時很有用。

啟動方式：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意事項：

- 仍然需要配對（閘道會顯示裝置配對提示）。
- 節點主機會將其節點 ID、權杖、顯示名稱和閘道連線資訊儲存在 `~/.openclaw/node.json`。
- 執行核准會透過 `~/.openclaw/exec-approvals.json` 在本機強制執行（請參閱[執行核准](/zh-TW/tools/exec-approvals)）。
- 在 macOS 上，無頭節點主機預設會在本機執行 `system.run`。設定 `OPENCLAW_NODE_EXEC_HOST=app` 可將 `system.run` 透過配套應用程式執行主機路由；新增 `OPENCLAW_NODE_EXEC_FALLBACK=0` 可要求使用應用程式主機，並在其不可用時以失敗關閉。
- 當閘道 WS 使用 TLS 時，請新增 `--tls` / `--tls-fingerprint`。

## Mac 節點模式

- macOS 選單列應用程式會以節點身分連線到閘道 WS 伺服器（因此 `openclaw nodes …` 可針對這台 Mac 運作）。
- 在遠端模式中，應用程式會為閘道連接埠開啟 SSH 通道，並連線到 `localhost`。
