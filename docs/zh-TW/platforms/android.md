---
read_when:
    - 配對或重新連線 Android 節點
    - 偵錯 Android 閘道探索或驗證問題
    - 從遠端 Mac 鏡像顯示或控制 Android 裝置
    - 驗證各用戶端間的聊天記錄一致性
summary: Android 應用程式（節點）：連線操作手冊 + 連線/聊天/語音/畫布命令介面
title: Android 應用程式
x-i18n:
    generated_at: "2026-07-16T11:45:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
官方 Android 應用程式可從 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 取得，支援的 [GitHub Releases](https://github.com/openclaw/openclaw/releases) 也提供已簽署的獨立 APK。它是配套節點，需要執行中的 OpenClaw 閘道。原始碼：[apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[建置說明](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## 支援概覽

- 角色：配套節點應用程式（Android 不承載閘道）。
- 需要閘道：是（請透過 WSL2 在 macOS、Linux 或 Windows 上執行）。
- 安裝：[Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 或從支援的 [GitHub Release](https://github.com/openclaw/openclaw/releases) 取得 `OpenClaw-Android.apk`；閘道請參閱[開始使用](/zh-TW/start/getting-started)，接著參閱[配對](/zh-TW/channels/pairing)。
- 閘道：[操作手冊](/zh-TW/gateway) + [設定](/zh-TW/gateway/configuration)。
  - 通訊協定：[閘道通訊協定](/zh-TW/gateway/protocol)（節點 + 控制平面）。

系統控制（launchd/systemd）位於閘道主機上——請參閱[閘道](/zh-TW/gateway)。

## 從 Google Play 以外安裝

一般正式版與修正版 GitHub Releases 包含通用的 `OpenClaw-Android.apk` 和 `OpenClaw-Android-SHA256SUMS.txt`。APK 由發行標籤建置、以 OpenClaw Android 發行金鑰簽署，並附有 GitHub Actions 來源證明。

選擇同時列出這兩項資產的[發行版本](https://github.com/openclaw/openclaw/releases)，接著在側載前下載並驗證該確切標籤：

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Google Play 與獨立 APK 安裝使用不同的更新管道，且可能具有不同的簽署身分。切換管道前，Android 可能會要求解除安裝現有應用程式，這會移除其本機應用程式資料。一般更新請持續使用同一個管道。
</Warning>

## 從遠端 Mac 鏡像並控制 Android

[scrcpy](https://github.com/Genymobile/scrcpy) 會在 macOS 視窗中鏡像 Android 畫面，並透過 Android Debug Bridge（ADB）轉送鍵盤與指標輸入。這是操作端的工作流程，與 OpenClaw 節點連線分開。當 Android 裝置和 Mac 位於不同地點，但共用私有 Tailscale 網路時，此功能很實用。

### 開始之前

- 在 Android 裝置和 Mac 上安裝 Tailscale，並將兩者連線至同一個 tailnet。
- 在 Android 上啟用 **Developer options** 和 **USB debugging**。Android 16 將 **Wireless
  debugging** 放在 **Settings > System > Developer options** 下。請參閱 [Android 開發人員
  選項](https://developer.android.com/studio/debug/dev-options)。
- 在 Mac 上安裝 scrcpy 和 ADB：

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- 第一次連線時，請讓 Android 裝置保持可供操作。每台 Mac 必須先由 Android 核准其 ADB
  金鑰，該 Mac 才能控制裝置。

### 啟用透過 TCP 的 ADB

初始設定時，請透過 USB 將 Android 裝置連接至受信任的電腦，並核准其偵錯提示。接著執行：

```bash
adb devices
adb tcpip 5555
```

現在可以中斷 USB 連線。如果裝置重新啟動或重設偵錯後，連接埠 5555 停止監聽，請重複此本機設定步驟。Android 11 及更新版本也可透過 **Wireless debugging > Pair device with pairing code** 和 `adb pair` 建立初始信任。

### 僅允許控制端 Mac

使用限制性授權規則的 tailnet，必須明確允許控制端 Mac 連線至 Android 裝置的 TCP 連接埠 5555。請在 tailnet 原則中新增範圍精確的規則，並將範例位址替換為兩台裝置的穩定 Tailscale IP：

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

如需主機別名及其他選擇器，請參閱 [Tailscale 授權規則](https://tailscale.com/docs/reference/syntax/grants)。請勿將此連接埠開放至公用網際網路，也不要使用 Funnel 公開它：獲授權的 ADB 用戶端可廣泛控制該裝置。

### 連線並開始鏡像

在遠端 Mac 上：

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

從此 Mac 第一次執行 `adb connect` 時，Android 上會顯示授權對話框。解鎖裝置、確認金鑰指紋，且僅在信任該 Mac 時選取 **Always allow from this computer**。成功的 `adb devices` 項目會以 `device` 結尾；`unauthorized` 表示尚未核准裝置上的提示。

scrcpy 視窗開啟後，可直接使用，或透過 [Peekaboo](https://peekaboo.sh/) 等 macOS 螢幕自動化工具鎖定該視窗。scrcpy 負責傳送畫面與輸入；Tailscale 僅提供私有網路路徑。

### 疑難排解

- `Connection timed out`：驗證 TCP 5555 的 tailnet 授權規則。`tailscale ping` 成功僅證明
  對等裝置之間可連線，不代表原則允許此 TCP 連接埠。請從 Mac 使用
  `nc -vz <android-tailnet-ip> 5555` 測試。
- `unauthorized`：解鎖 Android 並核准遠端 Mac 的 ADB 金鑰，或在 **Wireless debugging > Paired devices** 下移除失效的工作站，然後重新配對。
- `Connection refused`：在本機重新連線，並再次執行 `adb tcpip 5555`。
- 列出多台裝置：保留明確的 `--serial <android-tailnet-ip>:5555` 引數。

完成後，關閉 scrcpy 並中斷 ADB 連線：

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 連線操作手冊

Android 節點應用程式 ⇄（mDNS/NSD + WebSocket）⇄ **閘道**

Android 會直接連線至閘道 WebSocket，並使用裝置配對（`role: node`）。

針對 Tailscale 或公用主機，Android 需要安全端點：

- 建議：使用 `https://<magicdns>` / `wss://<magicdns>` 的 Tailscale Serve / Funnel
- 也支援：具有真實 TLS 端點的任何其他 `wss://` 閘道 URL
- 明文 `ws://` 仍支援私有區域網路位址 / `.local` 主機，以及 `localhost`、`127.0.0.1` 和 Android 模擬器橋接器（`10.0.2.2`）；非回送設定會自動使用受限的操作員存取權

### 先決條件

- 閘道正在另一台機器上執行（或可透過 SSH 連線）。
- Android 裝置／模擬器可以連線至閘道 WebSocket：
  - 位於相同區域網路並使用 mDNS/NSD，**或**
  - 位於相同 Tailscale tailnet 並使用廣域 Bonjour / 單播 DNS-SD（請見下文），**或**
  - 手動指定閘道主機／連接埠（備援方式）
- Tailnet／公用行動裝置配對**不會**使用原始 tailnet IP `ws://` 端點。請改用 Tailscale Serve 或其他 `wss://` URL。
- 閘道機器上（或透過 SSH）可使用 `openclaw` 命令列介面，以核准配對要求。

### 1. 啟動閘道

```bash
openclaw gateway --port 18789 --verbose
```

確認記錄中顯示類似以下內容：

- `listening on ws://0.0.0.0:18789`

若要透過 Tailscale 遠端存取 Android，建議使用 Serve/Funnel，而不要直接繫結原始 tailnet：

```bash
openclaw gateway --tailscale serve
```

這會為 Android 提供安全的 `wss://` / `https://` 端點。除非另行終止 TLS，否則單純的 `gateway.bind: "tailnet"` 設定不足以進行首次遠端 Android 配對。

### 2. 驗證探索（選用）

在閘道機器上：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多偵錯說明：[Bonjour](/zh-TW/gateway/bonjour)。

如果也設定了廣域探索網域，請與以下結果比較：

```bash
openclaw gateway discover --json
```

這會一次顯示 `local.` 與已設定的廣域網域，並使用解析後的服務端點，而非僅使用 TXT 提示。

#### 透過單播 DNS-SD 進行跨網路探索

Android NSD/mDNS 探索無法跨越網路。如果 Android 節點與閘道位於不同網路，但透過 Tailscale 連線，請改用廣域 Bonjour / 單播 DNS-SD。僅有探索不足以進行 tailnet／公用 Android 配對——探索到的路由仍需要安全端點（`wss://` 或 Tailscale Serve）：

1. 在閘道主機上設定 DNS-SD 區域（例如 `openclaw.internal.`），並發布 `_openclaw-gw._tcp` 記錄。
2. 為選定的網域設定 Tailscale 分割 DNS，使其指向該 DNS 伺服器。

詳細資訊與 CoreDNS 設定範例：[Bonjour](/zh-TW/gateway/bonjour)。

### 3. 從 Android 連線

在 Android 應用程式中：

- 應用程式透過**前景服務**（常駐通知）維持閘道連線。
- 開啟 **Connect** 分頁。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果探索遭到封鎖，請在 **Advanced controls** 中手動指定主機／連接埠。對於私有區域網路主機，`ws://` 仍可使用。對於 Tailscale／公用主機，請開啟 TLS，並使用 `wss://` / Tailscale Serve 端點。

第一次成功配對後，Android 啟動時會自動重新連線至目前啟用的已配對閘道（對探索到的閘道採取盡力而為方式，且該閘道必須在網路上可見）。

官方設定碼會將 Android 作為節點連線，並預設透過 `wss://` 授予完整的閘道操作員存取權。明文非回送 `ws://` 設定會自動使用受限存取權，以確保持有者權杖安全。**Settings → Gateway** 會顯示 **Full** 或 **Limited** 存取權。若為受限連線，請設定 `wss://` 或 Tailscale Serve，在 Control UI 或使用 `openclaw qr` 產生新的完整存取設定碼，接著在該頁面掃描或貼上，然後重新連線。希望使用縮減權限設定的操作員，可以在 Control UI 中選取 **Limited access**，或執行 `openclaw qr --limited`。

### 多個閘道

應用程式會保留所有已配對閘道的登錄，因此可以在它們之間切換，而不必重新配對：

- **Settings -> Gateways** 會列出已配對的閘道，並標示目前啟用的閘道。點選項目即可切換；應用程式會關閉目前的工作階段，並重新連線至所選閘道。
- 配對多個閘道時，**Connect** 分頁會顯示快速切換器。
- 認證資訊、裝置權杖、TLS 信任、聊天記錄及排入佇列的離線訊息會依閘道分別儲存。切換時絕不會混合不同閘道的狀態，離線時排入佇列的訊息也只會傳送至寫入該訊息時所屬的閘道。
- **Forget** 會移除閘道的登錄項目，以及其認證資訊、裝置權杖、TLS 固定資訊和快取聊天。

### 在線狀態存活信標

通過驗證的節點工作階段連線後，以及當應用程式移至背景但前景服務仍保持連線時，Android 會使用 `event: "node.presence.alive"` 呼叫 `node.event`。只有在已知通過驗證的節點裝置身分後，閘道才會在已配對節點／裝置中繼資料上將此記錄為 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，應用程式才會將信標計為已成功記錄。較舊的閘道可能會使用 `{ "ok": true }` 確認 `node.event`；此回應相容，但不會計為持久的最後上線時間更新。

### 4. 核准配對（命令列介面）

在閘道機器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配對詳細資訊：[配對](/zh-TW/channels/pairing)。

選用：如果 Android 節點一律從受到嚴格管控的子網路連線，你可以透過明確指定 CIDR 或確切 IP，選擇啟用首次節點自動核准：

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

此功能預設停用。它僅適用於未要求任何範圍的新 `role: node` 配對。操作員／瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍需手動核准。

### 5. 驗證節點已連線

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. 聊天與歷史記錄

Android 的「聊天」分頁支援選取工作階段（預設為 `main`，也可選擇其他現有工作階段）：

- 歷史記錄：`chat.history`（顯示時會正規化——移除行內指令標籤、純文字工具呼叫 XML 承載資料（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>` 及其截斷變體），以及外洩的 ASCII／全形模型控制權杖；省略僅含靜默權杖的助理資料列，例如完全相符的 `NO_REPLY`／`no_reply`；過大的資料列可能會以預留位置取代）
- 傳送：`chat.send`
- 持久傳送：每次傳送（文字、挑選的圖片與語音留言）都會在嘗試任何網路連線前，記錄到各閘道專屬的裝置端寄件匣，因此即使應用程式終止，也不會遺失已提交的輸入。離線時排入佇列的傳送項目，會在重新連線後使用穩定的冪等性金鑰依序送達；只有當該輪對話顯示在標準 `chat.history` 中後，才會移除傳送項目——僅有確認回覆不會被視為送達證明。結果不明確時（確認回覆遺失、應用程式在傳送途中遭終止、閘道在寫入對話記錄前重新啟動），會顯示包含明確 **重試**／**刪除** 選項的資料列，而不會自動重新傳送。斜線命令絕不會在重新連線後自動重播；它們會暫停，等待明確重試。佇列設有上限（每個閘道 50 則訊息及 48 MB 的附件資料量），未傳送的資料列會在 48 小時後到期。從未提交的編寫器草稿不會跨程序持久保留。
- 推播更新（盡力而為）：`chat.subscribe` -> `event:"chat"`
- 聆聽：長按助理訊息並選擇 **聆聽** 即可播放；音訊會透過閘道 `tts.speak`，使用已設定的 TTS 提供者鏈進行轉譯；當閘道無法轉譯音訊時，則使用裝置端系統 TTS。切換工作階段、開始新聊天、應用程式進入背景或關閉聊天時，播放會停止。

### 7. Canvas 與相機

#### 閘道 Canvas 主機（建議用於網頁內容）

若要讓節點顯示代理程式可在磁碟上編輯的真實 HTML/CSS/JS，請將節點指向閘道 Canvas 主機。

<Note>
節點會從閘道 HTTP 伺服器載入 Canvas（與 `gateway.port` 使用相同連接埠，預設為 `18789`）。
</Note>

1. 在閘道主機上建立 `~/.openclaw/workspace/canvas/index.html`。
2. 將節點導向該位置（區域網路）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（選用）：如果兩部裝置都位於 Tailscale 上，請使用 MagicDNS 名稱或 tailnet IP 取代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此伺服器會將即時重新載入用戶端注入 HTML，並在檔案變更時重新載入。閘道也會提供 `/__openclaw__/a2ui/`，但 Android 應用程式會將遠端 A2UI 頁面視為僅供轉譯。可執行動作的 A2UI 命令會使用隨附且由應用程式擁有的 A2UI 頁面。

Canvas 命令（僅限前景）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回預設框架）。`canvas.snapshot` 會傳回 `{ format, base64 }`（預設為 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 舊版別名）。這些命令會使用隨附且由應用程式擁有的 A2UI 頁面，進行可執行動作的轉譯。

相機命令（僅限前景；受權限管制）：`camera.snap`（jpg）、`camera.clip`（mp4）。參數與命令列介面輔助工具請參閱[相機節點](/zh-TW/nodes/camera)。

### 8. 語音與擴充的 Android 命令介面

- 語音分頁：Android 有兩種明確的擷取模式。**麥克風**是手動的語音分頁工作階段，會將每次停頓作為一輪聊天傳送；當應用程式離開前景或使用者離開語音分頁時即停止。**對話**是持續運作的對話模式，會持續聆聽，直到將其關閉或節點中斷連線為止。
- 對話模式會在開始擷取前，將現有前景服務從 `connectedDevice` 提升為 `connectedDevice|microphone`，並在對話模式停止時將其降級。節點服務使用 `CHANGE_NETWORK_STATE` 宣告 `FOREGROUND_SERVICE_CONNECTED_DEVICE`；Android 14+ 還需要 `FOREGROUND_SERVICE_MICROPHONE` 宣告、`RECORD_AUDIO` 執行階段授權，以及執行階段的麥克風服務類型。
- Android 對話預設使用原生語音辨識、閘道聊天，以及透過已設定閘道對話提供者運作的 `talk.speak`。僅在 `talk.speak` 無法使用時，才會使用本機系統 TTS。
- 只有當 `talk.realtime.mode` 為 `realtime`，且 `talk.realtime.transport` 為 `gateway-relay` 時，Android 對話才會使用即時閘道中繼。
- Android 不會宣告 `voiceWake` 功能。請使用 **麥克風**或**對話**進行語音輸入。
- 其他 Android 命令系列（可用性取決於裝置、權限與使用者設定）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - 僅在啟用 **Settings > Phone Capabilities > Installed Apps** 時提供 `device.apps`；預設會列出啟動器中可見的應用程式（傳入 `includeNonLaunchable` 可取得完整清單）。
  - `notifications.list`、`notifications.actions`（請參閱下方的[通知轉送](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

### 9. 工作區檔案（唯讀）

首頁概覽包含 **檔案**卡片，可透過唯讀的 `agents.workspace.list`／`agents.workspace.get` 閘道 RPC 瀏覽使用中的代理程式工作區：逐層瀏覽目錄、預覽文字與圖片，以及透過 Android 分享面板匯出。不提供任何寫入操作，且閘道會限制預覽大小。

## 檢閱命令核准

具備 `operator.admin` 的操作員連線，或由閘道明確指定且已配對的
`operator.approvals` 連線，可以在 **Settings -> Approvals** 下檢閱
待處理的執行要求。應用程式會先載入
閘道已清理的核准記錄，再啟用按鈕；它會顯示所有
安全性警告及該要求提供的確切決策，並將
核准 ID 與擁有者種類提交回閘道。

核准狀態會與控制介面及受支援的聊天介面共用。
第一個完成提交的回覆生效；即使其他介面先行回覆，Android 仍會顯示該標準結果。如果解析回應遺失或閘道
中斷連線，應用程式會維持操作鎖定，並重新讀取核准資訊，
之後才會再次提供決策選項。

早於統一核准方法的閘道會回退至已發布的
執行專用方法。待處理項目的檢閱仍可運作，但保留的終端狀態
及更完整的跨介面結果需要更新版閘道。

## 助理進入點

Android 支援從系統助理觸發程序（Google Assistant）啟動 OpenClaw。按住主畫面按鈕（或其他 `ACTION_ASSIST` 觸發程序）會開啟應用程式；說出 "Hey Google, ask OpenClaw `<prompt>`" 會符合應用程式宣告的 App Actions 查詢模式，並將提示詞放入聊天編寫器，但不會自動傳送。

此功能使用 Android 的 **App Actions**（`shortcuts.xml` 功能），並在應用程式資訊清單中宣告。無需進行閘道端設定——助理意圖完全由 Android 應用程式處理。

<Note>
App Actions 的可用性取決於裝置、Google Play Services 版本，以及使用者是否已將 OpenClaw 設為預設助理應用程式。
</Note>

## 通知轉送

Android 可以將裝置通知以 `node.event` 項目的形式轉送至閘道。此功能需在應用程式的設定面板中，**於裝置上**設定，而非在閘道／`openclaw.json` 設定中進行。

| 設定                        | 說明                                                                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | 主開關。預設關閉；必須先授予 Notification Listener Access。                                                                                                                                 |
| Package Filter              | **Allowlist**（僅轉送列出的套件 ID）或 **Blocklist**（預設：除列出 ID 外的所有套件）。在 Blocklist 模式下，一律排除 OpenClaw 自己的套件，以避免轉送迴圈。                                    |
| Quiet Hours                 | 抑制轉送的本機 HH:mm 起訖時間範圍。預設停用；啟用後預設為 `22:00`-`07:00`。                                                                                          |
| Max Events / Minute         | 每部裝置的通知轉送速率限制。預設為 20。                                                                                                                                                       |
| Route Session Key           | 選用。將轉送的通知事件固定傳入特定工作階段，而非裝置的預設通知路由。                                                                                                                          |

<Note>
通知轉送需要 Android Notification Listener 權限。應用程式會在設定期間提示授予此權限。
</Note>

一律排除 WhatsApp、WhatsApp Business、Telegram、Telegram X、Discord 及 Signal 的通知。它們的訊息已由原生 OpenClaw 頻道工作階段擁有；若將 Android 通知作為獨立節點事件轉送，可能會使回覆經由錯誤的對話路由。

## 相關內容

- [iOS 應用程式](/zh-TW/platforms/ios)
- [節點](/zh-TW/nodes)
- [Android 節點疑難排解](/zh-TW/nodes/troubleshooting)
