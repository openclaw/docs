---
read_when:
    - 配對或重新連接 Android 節點
    - 偵錯 Android 閘道探索或驗證
    - 從遠端 Mac 鏡像或控制 Android 裝置
    - 驗證各客戶端之間的聊天記錄一致性
summary: Android 應用程式（節點）：連線執行手冊 + Connect/Chat/Voice/Canvas 命令介面
title: Android 應用程式
x-i18n:
    generated_at: "2026-07-05T20:18:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb86ad2c7e4966b110e7e760c537e681c9a71207b06f01ac4daa123b52cdded7
    source_path: platforms/android.md
    workflow: 16
---

<Note>
官方 Android 應用程式可在 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 取得。它是伴隨節點，需要執行中的 OpenClaw 閘道。來源：[apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[建置說明](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## 支援快照

- 角色：伴隨節點應用程式（Android 不代管閘道）。
- 需要閘道：是（透過 WSL2 在 macOS、Linux 或 Windows 上執行）。
- 安裝：應用程式請見 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)，閘道請見[開始使用](/zh-TW/start/getting-started)，接著見[配對](/zh-TW/channels/pairing)。
- 閘道：[執行手冊](/zh-TW/gateway) + [設定](/zh-TW/gateway/configuration)。
  - 協定：[閘道協定](/zh-TW/gateway/protocol)（節點 + 控制平面）。

系統控制（launchd/systemd）位於閘道主機上 — 請見[閘道](/zh-TW/gateway)。

## 從遠端 Mac 鏡像與控制 Android

[scrcpy](https://github.com/Genymobile/scrcpy) 會在 macOS 視窗中鏡像 Android 螢幕，並透過 Android Debug Bridge (ADB) 轉送鍵盤與指標輸入。這是操作端工作流程，與 OpenClaw 節點連線分開。當 Android 裝置與 Mac 位於不同地點，但共用私有 Tailscale 網路時很有用。

### 開始之前

- 在 Android 裝置與 Mac 上安裝 Tailscale，並將兩者連線到同一個 tailnet。
- 在 Android 上啟用**開發人員選項**與 **USB 偵錯**。Android 16 將**無線偵錯**放在**設定 > 系統 > 開發人員選項**底下。請見 [Android 開發人員選項](https://developer.android.com/studio/debug/dev-options)。
- 在 Mac 上安裝 scrcpy 與 ADB：

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- 第一次連線時，請讓 Android 裝置保持可用。Android 必須核准每台 Mac 的 ADB 金鑰，該 Mac 才能控制裝置。

### 透過 TCP 啟用 ADB

初始設定時，請透過 USB 將 Android 裝置連接到受信任的電腦，並核准其偵錯提示。接著執行：

```bash
adb devices
adb tcpip 5555
```

現在可以中斷 USB 連線。如果裝置重新啟動或重設偵錯後，連接埠 5555 停止監聽，請重複此本機設定步驟。Android 11 及更新版本也可以使用**無線偵錯 > 使用配對碼配對裝置**與 `adb pair` 建立初始信任。

### 只允許控制端 Mac

採用限制性授權的 tailnet 必須明確允許控制端 Mac 連線到 Android 裝置上的 TCP 連接埠 5555。請在 tailnet 政策中加入窄範圍規則，將範例位址替換成兩台裝置穩定的 Tailscale IP：

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

主機別名與其他選擇器請見 [Tailscale 授權](https://tailscale.com/docs/reference/syntax/grants)。不要將此連接埠授權給公開網際網路，也不要使用 Funnel 對外公開：已授權的 ADB 用戶端對裝置具有廣泛控制權。

### 連線並開始鏡像

在遠端 Mac 上：

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

此 Mac 第一次執行 `adb connect` 時，Android 上會顯示授權對話框。請解鎖裝置，確認金鑰指紋，且只有在信任該 Mac 時才選取**一律允許來自這部電腦**。成功的 `adb devices` 項目會以 `device` 結尾；`unauthorized` 表示尚未核准裝置上的提示。

scrcpy 視窗開啟後，可以直接使用，或用 macOS 螢幕自動化工具（例如 [Peekaboo](https://peekaboo.sh/)）指定該視窗。scrcpy 負責顯示與輸入；Tailscale 只提供私有網路路徑。

### 疑難排解

- `Connection timed out`：確認 TCP 5555 的 tailnet 授權。成功的 `tailscale ping` 只證明對等節點可連線，不代表政策允許此 TCP 連接埠。請從 Mac 使用 `nc -vz <android-tailnet-ip> 5555` 測試。
- `unauthorized`：解鎖 Android 並核准遠端 Mac 的 ADB 金鑰，或在**無線偵錯 > 已配對的裝置**底下移除過期的工作站，然後重新配對。
- `Connection refused`：在本機重新連線，並再次執行 `adb tcpip 5555`。
- 列出多台裝置：保留明確的 `--serial <android-tailnet-ip>:5555` 引數。

完成後，關閉 scrcpy 並中斷 ADB 連線：

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 連線執行手冊

Android 節點應用程式 ⇄ (mDNS/NSD + WebSocket) ⇄ **閘道**

Android 直接連線到閘道 WebSocket，並使用裝置配對（`role: node`）。

對於 Tailscale 或公開主機，Android 需要安全端點：

- 建議：使用 `https://<magicdns>` / `wss://<magicdns>` 的 Tailscale Serve / Funnel
- 也支援：任何其他具有真實 TLS 端點的 `wss://` 閘道 URL
- 明文 `ws://` 仍支援私有 LAN 位址 / `.local` 主機，以及 `localhost`、`127.0.0.1` 和 Android 模擬器橋接位址（`10.0.2.2`）

### 先決條件

- 閘道在另一台機器上執行（或可透過 SSH 連線）。
- Android 裝置/模擬器可以連線到 gateway WebSocket：
  - 使用 mDNS/NSD 的同一 LAN，**或**
  - 使用 Wide-Area Bonjour / 單點傳播 DNS-SD 的同一 Tailscale tailnet（見下方），**或**
  - 手動 gateway 主機/連接埠（備援）
- Tailnet/公開行動配對**不**使用原始 tailnet IP `ws://` 端點。請改用 Tailscale Serve 或其他 `wss://` URL。
- gateway 機器上可用的 `openclaw` 命令列介面（或透過 SSH），用於核准配對請求。

### 1. 啟動閘道

```bash
openclaw gateway --port 18789 --verbose
```

確認日誌中看到類似內容：

- `listening on ws://0.0.0.0:18789`

若要透過 Tailscale 讓遠端 Android 存取，建議使用 Serve/Funnel，而不是原始 tailnet 綁定：

```bash
openclaw gateway --tailscale serve
```

這會為 Android 提供安全的 `wss://` / `https://` 端點。單純的 `gateway.bind: "tailnet"` 設定不足以進行首次遠端 Android 配對，除非你也另外終止 TLS。

### 2. 驗證探索（選用）

從 gateway 機器：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多偵錯備註：[Bonjour](/zh-TW/gateway/bonjour)。

如果你也設定了廣域探索網域，請與下列結果比較：

```bash
openclaw gateway discover --json
```

這會在一次執行中顯示 `local.` 加上已設定的廣域網域，並使用已解析的服務端點，而不是只使用 TXT 提示。

#### 透過單點傳播 DNS-SD 進行跨網路探索

Android NSD/mDNS 探索不會跨越網路。如果 Android 節點與 gateway 位於不同網路但透過 Tailscale 連接，請改用 Wide-Area Bonjour / 單點傳播 DNS-SD。單靠探索不足以進行 tailnet/公開 Android 配對 — 探索到的路由仍需要安全端點（`wss://` 或 Tailscale Serve）：

1. 在 gateway 主機上設定 DNS-SD 區域（範例 `openclaw.internal.`），並發布 `_openclaw-gw._tcp` 記錄。
2. 為你選擇的網域設定 Tailscale split DNS，指向該 DNS 伺服器。

詳細資料與 CoreDNS 設定範例：[Bonjour](/zh-TW/gateway/bonjour)。

### 3. 從 Android 連線

在 Android 應用程式中：

- 應用程式透過**前景服務**（持續通知）維持其 gateway 連線。
- 開啟**連線**分頁。
- 使用**設定碼**或**手動**模式。
- 如果探索遭封鎖，請在**進階控制項**中使用手動主機/連接埠。對於私有 LAN 主機，`ws://` 仍可運作。對於 Tailscale/公開主機，請開啟 TLS 並使用 `wss://` / Tailscale Serve 端點。

第一次成功配對後，Android 會在啟動時自動重新連線：若啟用則使用手動端點，否則使用最後探索到的 gateway（盡力而為）。

### 存在狀態存活信標

驗證的節點工作階段連線後，以及當應用程式移至背景且前景服務仍連線時，Android 會以 `event: "node.presence.alive"` 呼叫 `node.event`。只有在已知驗證節點裝置身分之後，gateway 才會將此記錄為已配對節點/裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當 gateway 回應包含 `handled: true` 時，應用程式才會將信標計為已成功記錄。較舊的 gateway 可能會以 `{ "ok": true }` 確認 `node.event`；該回應相容，但不會計為持久的最後可見更新。

### 4. 核准配對（命令列介面）

在 gateway 機器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配對詳細資料：[配對](/zh-TW/channels/pairing)。

選用：如果 Android 節點一律從嚴格控管的子網路連線，你可以選擇使用明確 CIDR 或確切 IP 來啟用首次節點自動核准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

這預設為停用。它只適用於沒有請求範圍的新 `role: node` 配對。操作員/瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需要手動核准。

### 5. 驗證節點已連線

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. 聊天 + 歷史記錄

Android 聊天分頁支援工作階段選取（預設 `main`，以及其他既有工作階段）：

- 歷史記錄：`chat.history`（顯示已正規化 — 會移除內嵌指令標籤、純文字工具呼叫 XML 承載（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>` 與截斷變體），以及洩漏的 ASCII/全形模型控制權杖；會省略靜默權杖助理列，例如精確的 `NO_REPLY` / `no_reply`；過大的列可能會以佔位符取代）
- 傳送：`chat.send`
- 推送更新（盡力而為）：`chat.subscribe` -> `event:"chat"`

### 7. Canvas + 相機

#### 閘道 Canvas 主機（建議用於網頁內容）

若要讓節點顯示代理人可在磁碟上編輯的真實 HTML/CSS/JS，請將節點指向閘道 canvas 主機。

<Note>
節點會從閘道 HTTP 伺服器載入 canvas（與 `gateway.port` 相同的連接埠，預設為 `18789`）。
</Note>

1. 在 gateway 主機上建立 `~/.openclaw/workspace/canvas/index.html`。
2. 將節點導覽到該位置（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（選用）：如果兩台裝置都位於 Tailscale 上，請使用 MagicDNS 名稱或 tailnet IP 取代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此伺服器會將即時重新載入用戶端注入 HTML，並在檔案變更時重新載入。閘道也會提供 `/__openclaw__/a2ui/`，但 Android 應用程式會將遠端 A2UI 頁面視為僅供轉譯。可執行動作的 A2UI 命令會使用隨附的應用程式自有 A2UI 頁面。

Canvas 命令（僅限前景）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回預設 scaffold）。`canvas.snapshot` 會回傳 `{ format, base64 }`（預設 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 舊版別名）。這些命令使用隨附的應用程式自有 A2UI 頁面進行可執行動作的轉譯。

相機命令（僅限前景；受權限保護）：`camera.snap` (jpg)、`camera.clip` (mp4)。參數與命令列介面輔助工具請見[相機節點](/zh-TW/nodes/camera)。

### 8. 語音 + 擴充的 Android 命令介面

- 語音分頁：Android 有兩種明確的擷取模式。**麥克風**是手動的語音分頁工作階段，會將每次停頓作為聊天回合傳送，並在應用程式離開前景或使用者離開語音分頁時停止。**對話**是連續的對話模式，會持續聆聽直到關閉切換或節點中斷連線。
- 對話模式會在擷取開始前，將現有前景服務從 `connectedDevice` 提升為 `connectedDevice|microphone`，然後在對話模式停止時降級。節點服務會以 `CHANGE_NETWORK_STATE` 宣告 `FOREGROUND_SERVICE_CONNECTED_DEVICE`；Android 14+ 也需要 `FOREGROUND_SERVICE_MICROPHONE` 宣告、`RECORD_AUDIO` 執行階段授權，以及執行階段的麥克風服務類型。
- 預設情況下，Android 對話使用原生語音辨識、閘道聊天，以及透過已設定的閘道對話提供者使用 `talk.speak`。只有在 `talk.speak` 無法使用時，才會使用本機系統 TTS。
- Android 對話只有在 `talk.realtime.mode` 為 `realtime` 且 `talk.realtime.transport` 為 `gateway-relay` 時，才會使用即時閘道轉送。
- 語音喚醒已在原始碼中實作（`VoiceWakeMode`），但出貨應用程式執行階段在連線時一律強制設為 `off`，目前沒有面向使用者的切換控制。
- 其他 Android 指令系列（可用性取決於裝置、權限和使用者設定）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `device.apps` 只有在啟用 **設定 > 手機功能 > 已安裝應用程式** 時可用；預設列出啟動器可見的應用程式（傳入 `includeNonLaunchable` 可取得完整清單）。
  - `notifications.list`、`notifications.actions`（請參閱下方的[通知轉送](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## 助理進入點

Android 支援從系統助理觸發器（Google Assistant）啟動 OpenClaw。按住主畫面按鈕（或其他 `ACTION_ASSIST` 觸發器）會開啟應用程式；說出「Hey Google，詢問 OpenClaw `<prompt>`」會符合應用程式宣告的 App Actions 查詢模式，並將提示交給聊天撰寫器，而不會自動傳送。

這使用 Android **App Actions**（`shortcuts.xml` capability），並在應用程式資訊清單中宣告。不需要任何閘道端設定，助理意圖完全由 Android 應用程式處理。

<Note>
App Actions 的可用性取決於裝置、Google Play Services 版本，以及使用者是否已將 OpenClaw 設為預設助理應用程式。
</Note>

## 通知轉送

Android 可以將裝置通知作為 `node.event` 項目轉送至閘道。這是在**裝置上**，於應用程式的設定面板中設定，而不是在閘道/`openclaw.json` 設定中設定。

| 設定                     | 說明                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 轉送通知事件 | 主切換。預設關閉；必須先授予通知監聽器存取權。                                                                                                              |
| 套件篩選器              | **允許清單**（只轉送列出的套件 ID）或 **封鎖清單**（預設：除列出 ID 以外的所有套件）。在封鎖清單模式中，OpenClaw 自己的套件一律會被排除，以避免轉送迴圈。 |
| 安靜時段                 | 本機 HH:mm 開始/結束時間範圍，會抑制轉送。預設停用；啟用後預設為 `22:00`-`07:00`。                                                                                |
| 每分鐘事件上限         | 每部裝置的轉送通知速率限制。預設 20。                                                                                                                                          |
| 路由工作階段金鑰           | 選用。將轉送的通知事件固定到特定工作階段，而不是裝置的預設通知路由。                                                                               |

<Note>
通知轉送需要 Android 通知監聽器權限。應用程式會在設定期間提示授予此權限。
</Note>

## 相關

- [iOS 應用程式](/zh-TW/platforms/ios)
- [節點](/zh-TW/nodes)
- [Android 節點疑難排解](/zh-TW/nodes/troubleshooting)
