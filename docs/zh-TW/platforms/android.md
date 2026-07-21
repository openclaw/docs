---
read_when:
    - 配對或重新連線 Android 節點
    - 偵錯 Android 閘道探索或驗證問題
    - 從遠端 Mac 鏡像顯示或控制 Android 裝置
    - 驗證各用戶端的聊天記錄一致性
summary: Android 應用程式（節點）：連線操作手冊 + Connect/Chat/Voice/Canvas 命令介面
title: Android 應用程式
x-i18n:
    generated_at: "2026-07-21T09:00:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: caa98f2e5834f9974b0df319ea0844acf589fe3735045efe80c97f3f14e2ee45
    source_path: platforms/android.md
    workflow: 16
---

<Note>
官方 Android 應用程式可從 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 取得，支援的 [GitHub Releases](https://github.com/openclaw/openclaw/releases) 也提供已簽署的獨立 APK。它是配套節點，需要執行中的 OpenClaw 閘道。原始碼：[apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[建置說明](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## 支援概況

- 角色：配套節點應用程式（Android 不託管閘道）。
- 需要閘道：是（請透過 WSL2 在 macOS、Linux 或 Windows 上執行）。
- 安裝：[Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)，或從支援的 [GitHub Release](https://github.com/openclaw/openclaw/releases) 取得 `OpenClaw-Android.apk`；接著參閱閘道的[入門指南](/zh-TW/start/getting-started)，然後進行[配對](/zh-TW/channels/pairing)。
- 閘道：[操作手冊](/zh-TW/gateway) + [設定](/zh-TW/gateway/configuration)。
  - 通訊協定：[閘道通訊協定](/zh-TW/gateway/protocol)（節點 + 控制平面）。

系統控制（launchd/systemd）位於閘道主機上——請參閱[閘道](/zh-TW/gateway)。

## 同時使用多個閘道工作階段

每個閘道只需配對一次，然後開啟 **Settings → Gateway**。勾選記號會標示目前聚焦的閘道，而每個開關則控制非聚焦閘道的操作員工作階段是否保持連線。啟用的閘道會在應用程式位於前景時各自重新連線，因此切換焦點不會中斷其他連線。只有聚焦的閘道會擁有 Android 節點工作階段與裝置功能；這可防止多個閘道同時向同一支手機發出相機、位置、螢幕或通知命令。應用程式離開前景後，Android 可能會暫停次要連線。

## Wear OS 配套應用程式

Wear OS 配套應用程式使用已配對 Android 手機經過驗證的閘道連線；手錶絕不會接收或儲存閘道認證資訊。它可以選取代理程式與工作階段、讀取有限範圍的對話記錄、傳送文字或語音聽寫回覆、中止進行中的執行、在所選工作階段內啟動即時 Talk，以及連線或中斷已配對手機的閘道。它也提供本機回覆通知、深色或淺色外觀，以及可選的回覆自動語音播放。代理程式與閘道控制會協商功能，以支援手機與手錶交錯更新。即時 Talk 會透過暫時性的 Wear OS Data Layer 通道串流麥克風與播放音訊，並在所選手機、閘道連線或音訊通道中斷時停止。

## 從 Google Play 以外的來源安裝

一般正式版與修正版 GitHub Releases 包含通用的 `OpenClaw-Android.apk` 和 `OpenClaw-Android-SHA256SUMS.txt`。APK 由發布標籤建置、使用 OpenClaw Android 發布金鑰簽署，並附帶 GitHub Actions 來源證明。

選擇同時列出這兩項資產的[發布版本](https://github.com/openclaw/openclaw/releases)，然後在側載前下載並驗證該確切標籤：

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
Google Play 與獨立 APK 安裝使用不同的更新通道，且可能具有不同的簽署身分。切換通道前，Android 可能會要求解除安裝現有應用程式，這將移除其本機應用程式資料。一般更新請固定使用同一個通道。
</Warning>

## 從遠端 Mac 鏡像並控制 Android

[scrcpy](https://github.com/Genymobile/scrcpy) 會在 macOS 視窗中鏡像 Android 螢幕，並透過 Android Debug Bridge（ADB）轉送鍵盤與指標輸入。這是操作員端的工作流程，與 OpenClaw 節點連線分開。當 Android 裝置與 Mac 位於不同地點，但共用私人 Tailscale 網路時，這項功能很有用。

### 開始之前

- 在 Android 裝置與 Mac 上安裝 Tailscale，並將兩者連線至同一個 tailnet。
- 在 Android 上啟用 **Developer options** 和 **USB debugging**。Android 16 將 **Wireless debugging** 放在 **Settings > System > Developer options** 下。請參閱 [Android 開發人員選項](https://developer.android.com/studio/debug/dev-options)。
- 在 Mac 上安裝 scrcpy 與 ADB：

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- 第一次連線時，請讓 Android 裝置保持可操作。Android 必須核准每台 Mac 的 ADB 金鑰，該 Mac 才能控制裝置。

### 啟用透過 TCP 的 ADB

初始設定時，使用 USB 將 Android 裝置連線至受信任的電腦，並核准其偵錯提示。然後執行：

```bash
adb devices
adb tcpip 5555
```

現在可以拔除 USB。如果裝置重新啟動或重設偵錯後，連接埠 5555 停止監聽，請重複此本機設定步驟。Android 11 及更新版本也可以使用 **Wireless debugging > Pair device with pairing code** 和 `adb pair` 建立初始信任。

### 僅允許控制端 Mac

採用限制性授權的 tailnet 必須明確允許控制端 Mac 存取 Android 裝置上的 TCP 連接埠 5555。請在 tailnet 原則中新增範圍嚴格的規則，並以兩台裝置的穩定 Tailscale IP 取代範例位址：

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

如需主機別名與其他選取器，請參閱 [Tailscale 授權](https://tailscale.com/docs/reference/syntax/grants)。請勿向公開網際網路開放此連接埠，也不要使用 Funnel 公開此連接埠：經授權的 ADB 用戶端可廣泛控制裝置。

### 連線並開始鏡像

在遠端 Mac 上：

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

從這台 Mac 第一次執行 `adb connect` 時，Android 上會顯示授權對話方塊。解鎖裝置、確認金鑰指紋，並且僅在信任該 Mac 時選取 **Always allow from this computer**。成功的 `adb devices` 項目會以 `device` 結尾；`unauthorized` 表示尚未核准裝置上的提示。

scrcpy 視窗開啟後，可以直接使用，或使用 [Peekaboo](https://peekaboo.sh/) 等 macOS 螢幕自動化工具指定該視窗。scrcpy 負責傳送畫面與輸入；Tailscale 僅提供私人網路路徑。

### 疑難排解

- `Connection timed out`：確認 tailnet 已授權 TCP 5555。成功的 `tailscale ping` 只能證明對等節點可連線，無法證明原則允許此 TCP 連接埠。請從 Mac 使用 `nc -vz <android-tailnet-ip> 5555` 測試。
- `unauthorized`：解鎖 Android 並核准遠端 Mac 的 ADB 金鑰，或在 **Wireless debugging > Paired devices** 下移除過時的工作站，然後重新配對。
- `Connection refused`：重新進行本機連線，並再次執行 `adb tcpip 5555`。
- 列出多個裝置：保留明確的 `--serial <android-tailnet-ip>:5555` 引數。

完成後，關閉 scrcpy 並中斷 ADB 連線：

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 連線操作手冊

Android 節點應用程式 ⇄（mDNS/NSD + WebSocket）⇄ **閘道**

Android 直接連線至閘道 WebSocket，並使用裝置配對（`role: node`）。

對於 Tailscale 或公開主機，Android 需要安全端點：

- 建議：搭配 `https://<magicdns>` / `wss://<magicdns>` 使用 Tailscale Serve / Funnel
- 也支援：任何其他具有真正 TLS 端點的 `wss://` 閘道 URL
- 未加密的 `ws://` 仍支援私人 LAN 位址 / `.local` 主機，以及 `localhost`、`127.0.0.1` 和 Android 模擬器橋接器（`10.0.2.2`）；非回送設定會自動使用受限的操作員存取權

### 先決條件

- 閘道在另一台機器上執行（或可透過 SSH 存取）。
- Android 裝置／模擬器可以連線至閘道 WebSocket：
  - 位於使用 mDNS/NSD 的相同 LAN，**或**
  - 位於使用廣域 Bonjour／單播 DNS-SD 的相同 Tailscale tailnet（見下文），**或**
  - 手動指定閘道主機／連接埠（備援）
- Tailnet／公開行動裝置配對**不會**使用原始 tailnet IP `ws://` 端點。請改用 Tailscale Serve 或其他 `wss://` URL。
- 閘道機器上（或可透過 SSH）具有 `openclaw` 命令列介面，可用來核准配對要求。

### 1. 啟動閘道

```bash
openclaw gateway --port 18789 --verbose
```

確認記錄中顯示類似以下內容：

- `listening on ws://0.0.0.0:18789`

若要透過 Tailscale 從遠端存取 Android，建議使用 Serve/Funnel，而非直接繫結至原始 tailnet：

```bash
openclaw gateway --tailscale serve
```

這會為 Android 提供安全的 `wss://` / `https://` 端點。除非另外終止 TLS，否則僅設定 `gateway.bind: "tailnet"` 不足以支援 Android 首次遠端配對。

### 2. 驗證探索（選用）

從閘道機器執行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多偵錯說明：[Bonjour](/zh-TW/gateway/bonjour)。

如果也設定了廣域探索網域，請與以下結果比較：

```bash
openclaw gateway discover --json
```

這會一次顯示 `local.` 與已設定的廣域網域，並使用已解析的服務端點，而非僅使用 TXT 提示。

#### 透過單播 DNS-SD 進行跨網路探索

Android NSD/mDNS 探索無法跨越網路。如果 Android 節點與閘道位於不同網路，但透過 Tailscale 連線，請改用廣域 Bonjour／單播 DNS-SD。對於 tailnet／公開 Android 配對，只有探索仍不足夠——探索到的路由仍需要安全端點（`wss://` 或 Tailscale Serve）：

1. 在閘道主機上設定 DNS-SD 區域（例如 `openclaw.internal.`），並發布 `_openclaw-gw._tcp` 記錄。
2. 為所選網域設定 Tailscale 分割 DNS，並將其指向該 DNS 伺服器。

詳細資訊與 CoreDNS 設定範例：[Bonjour](/zh-TW/gateway/bonjour)。

### 3. 從 Android 連線

在 Android 應用程式中：

- 應用程式透過**前景服務**（常駐通知）維持閘道連線。
- 開啟 **Connect** 分頁。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果探索遭到封鎖，請在 **Advanced controls** 中手動指定主機／連接埠。對於私人 LAN 主機，`ws://` 仍可運作。對於 Tailscale／公開主機，請開啟 TLS，並使用 `wss://` / Tailscale Serve 端點。

首次成功配對後，Android 啟動時會自動重新連線至作用中的已配對閘道（對探索到的閘道採盡力而為方式，且該閘道必須可在網路上被發現）。

官方設定碼預設會透過 `wss://` 將 Android 以節點身分連線，並授予完整的閘道操作員存取權。未加密的非回送 `ws://` 設定會自動使用受限存取權，以確保持有人權杖安全。**Settings → Gateway** 會顯示 **Full** 或 **Limited** 存取權。對於受限連線，請設定 `wss://` 或 Tailscale Serve，在 Control UI 中或使用 `openclaw qr` 產生新的完整存取權代碼，然後在該頁面掃描或貼上代碼並重新連線。想要使用精簡權限設定檔的操作員，可以在 Control UI 中選取 **Limited access**，或執行 `openclaw qr --limited`。

### 管理已配對的閘道

應用程式會保留所有已配對閘道的登錄，因此可以讓操作員工作階段保持連線，並在不必重新配對的情況下切換焦點：

- **設定 → 閘道**會列出已配對的閘道，並標示目前聚焦的閘道。輕觸項目即可聚焦；其他已啟用的操作者工作階段仍會保持連線。
- 每個開關控制 App 位於前景時，對應的非聚焦閘道是否保持連線。聚焦的閘道會維持啟用，並掌控手機的節點連線與裝置功能。
- 配對多個閘道時，**連線**分頁會顯示快速切換器。
- 認證資訊、裝置權杖、TLS 信任、聊天記錄及排入佇列的離線訊息會依各閘道分別儲存。變更焦點絕不會混用不同閘道的狀態，離線時排入佇列的訊息也只會傳送至其原本寫入的閘道。
- **忘記**會移除閘道的登錄項目及其認證資訊、裝置權杖、TLS 釘選和快取聊天。

### 存活狀態信標

經過驗證的節點工作階段連線後，以及 App 移至背景但前景服務仍保持連線時，Android 會使用 `event: "node.presence.alive"` 呼叫 `node.event`。只有在已知通過驗證的節點裝置身分後，閘道才會將此資訊記錄為已配對節點／裝置中繼資料上的 `lastSeenAtMs`/`lastSeenReason`。

只有當閘道回應包含 `handled: true` 時，App 才會將信標視為已成功記錄。較舊的閘道可能會使用 `{ "ok": true }` 確認 `node.event`；此回應相容，但不會被視為持久的上次出現時間更新。

### 4. 核准配對（命令列介面）

在閘道機器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配對詳細資訊：[配對](/zh-TW/channels/pairing)。

選用：如果 Android 節點一律從嚴格控管的子網路連線，你可以透過明確的 CIDR 或確切 IP，選擇啟用首次節點自動核准：

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

此功能預設停用，僅適用於未要求任何範圍的全新 `role: node` 配對。操作者／瀏覽器配對，以及任何角色、範圍、中繼資料或公開金鑰變更，仍須手動核准。

### 5. 驗證節點已連線

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. 聊天與記錄

Android 的聊天分頁支援選取工作階段（預設為 `main`，也可選取其他現有工作階段）：

- 記錄：`chat.history`（經顯示正規化處理——會移除行內指令標籤、純文字工具呼叫 XML 承載資料（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>` 及其截斷變體），以及洩漏的 ASCII／全形模型控制權杖；會略過僅含靜默權杖的助理資料列，例如完全相符的 `NO_REPLY` / `no_reply`；過大的資料列可能會以預留位置取代）
- 傳送：`chat.send`
- 持久傳送：每次傳送（文字、選取的圖片及語音留言）都會在嘗試任何網路操作前，記錄至各閘道各自的裝置端寄件匣，因此 App 終止不會遺失已提交的輸入。離線時排入佇列的傳送項目，會在重新連線後依序送出並使用穩定的等冪鍵；只有在標準 `chat.history` 中可見該輪對話後，才會移除該傳送項目——單純的確認不會被視為已送達的證明。結果不明確時（確認遺失、App 在傳送途中遭終止、閘道在寫入對話記錄前重新啟動），會顯示可見的資料列及明確的**重試**／**刪除**選項，而不會自動重新傳送。斜線命令絕不會在重新連線後自動重播；它們會暫停並等待明確重試。佇列設有上限（每個閘道 50 則訊息及 48 MB 附件位元組），未傳送的資料列會在 48 小時後到期。從未提交的編輯器草稿不會跨處理程序持久保存。
- 推送更新（盡力而為）：`chat.subscribe` -> `event:"chat"`
- 聆聽：長按助理訊息並選擇**聆聽**即可播放；音訊會透過閘道 `tts.speak`，使用已設定的 TTS 提供者鏈進行轉譯；若閘道無法轉譯音訊，則使用裝置端系統 TTS。切換工作階段、建立新聊天、App 進入背景或關閉聊天時，播放都會停止。

### 7. 畫布與相機

#### 閘道畫布主機（建議用於網頁內容）

若要讓節點顯示代理程式可在磁碟上編輯的實際 HTML/CSS/JS，請將節點指向閘道畫布主機。

<Note>
節點會從閘道 HTTP 伺服器載入畫布（與 `gateway.port` 使用相同連接埠，預設為 `18789`）。
</Note>

1. 在閘道主機上建立 `~/.openclaw/workspace/canvas/index.html`。
2. 將節點導覽至該位置（區域網路）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（選用）：如果兩部裝置都位於 Tailscale 上，請使用 MagicDNS 名稱或 tailnet IP 取代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此伺服器會將即時重新載入用戶端注入 HTML，並在檔案變更時重新載入。閘道也會提供 `/__openclaw__/a2ui/`，但 Android App 會將遠端 A2UI 頁面視為僅供轉譯。具備動作功能的 A2UI 命令會使用 App 隨附且由 App 擁有的 A2UI 頁面。

畫布命令（僅限前景）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回預設框架）。`canvas.snapshot` 會傳回 `{ format, base64 }`（預設為 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 舊版別名）。這些命令會使用 App 隨附且由 App 擁有的 A2UI 頁面，進行具備動作功能的轉譯。

相機命令（僅限前景；受權限限制）：`camera.snap`（jpg）、`camera.clip`（mp4）。參數與命令列介面輔助工具請參閱[相機節點](/zh-TW/nodes/camera)。

### 8. 語音與擴充的 Android 命令介面

- Android 的殼層導覽為**首頁**、**聊天**及**設定**。語音輸入
  位於聊天編輯器中；沒有獨立的語音分頁。
- 輕觸編輯器的麥克風，即可使用裝置端語音辨識並將
  逐字稿插入草稿。長按麥克風可錄製語音留言
  附件。介面會回報辨識功能不可用、缺少權限、
  忙碌／網路失敗及未偵測到語音等結果，而不會默默捨棄
  該次嘗試。
- 從聊天波形啟動持續**對話**。聽寫、語音留言
  錄製及對話是互斥的麥克風路徑。
- 對話模式會在擷取開始前，將現有前景服務從 `connectedDevice` 提升為 `connectedDevice|microphone`，並在對話模式停止時將其降級。節點服務會使用 `CHANGE_NETWORK_STATE` 宣告 `FOREGROUND_SERVICE_CONNECTED_DEVICE`；Android 14+ 還要求 `FOREGROUND_SERVICE_MICROPHONE` 宣告、`RECORD_AUDIO` 執行階段授權，以及執行階段的麥克風服務類型。
- Android 對話預設使用原生語音辨識、閘道聊天，以及透過已設定閘道對話提供者使用的 `talk.speak`。只有在 `talk.speak` 無法使用時，才會使用本機系統 TTS。
- 只有當 `talk.realtime.mode` 為 `realtime` 且 `talk.realtime.transport` 為 `gateway-relay` 時，Android 對話才會使用即時閘道轉送。
- Android 不會宣告 `voiceWake` 功能。語音輸入請使用聊天聽寫、
  語音留言或對話。
- 其他 Android 命令系列（可用性取決於裝置、權限及使用者設定）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - 僅在啟用**設定 > 手機功能 > 已安裝的 App** 時提供 `device.apps`；預設會列出啟動器中可見的 App（傳入 `includeNonLaunchable` 可取得完整清單）。
  - `notifications.list`、`notifications.actions`（請參閱下方的[通知轉送](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

### 9. 工作區檔案（唯讀）

首頁概覽包含一張**檔案**卡片，可透過唯讀的 `agents.workspace.list` / `agents.workspace.get` 閘道 RPC 瀏覽作用中代理程式的工作區：逐層瀏覽目錄、預覽文字與圖片，以及透過 Android 分享面板匯出。不提供任何寫入操作，且閘道會限制預覽大小。

## 審查命令核准

具有 `operator.admin` 的操作者連線，或閘道明確指定且已配對的
`operator.approvals` 連線，可以在**設定 -> 核准**下審查
待處理的執行要求。App 會先載入閘道已清理的核准記錄，再啟用按鈕；
顯示所有安全性警告及該要求提供的確切決策，並將
核准 ID 與擁有者類型提交回閘道。

核准狀態會與控制介面及支援的聊天介面共用。
第一個提交的答案生效；即使由其他介面先行回答，Android 仍會顯示該標準結果。
如果解析回應遺失或閘道中斷連線，App 會維持動作鎖定，並在
再次提供決策前重新讀取核准資料。

早於統一核准方法的閘道會退回使用已發布的
執行專用方法。待處理的審查仍可運作，但保留的終端狀態
與更豐富的跨介面結果需要更新後的閘道。

## 回答代理程式問題

對於具有 `operator.questions`（或 `operator.admin`）的操作者連線，
聊天會將待處理的閘道問題顯示為原生卡片。卡片支援單選與
多選選項、選項說明、自由文字的**其他**答案，以及
到期倒數計時。重新連線後會從閘道重新載入待處理的問題。當此裝置已回答、
其他介面先行回答，或問題已到期或取消時，卡片會鎖定。

## 助理進入點

Android 支援從系統助理觸發程序（Google Assistant）啟動 OpenClaw。按住首頁按鈕（或其他 `ACTION_ASSIST` 觸發程序）會開啟 App；說出「Hey Google, ask OpenClaw `<prompt>`」會符合 App 所宣告的 App Actions 查詢模式，並將提示詞送入聊天編輯器，但不會自動傳送。

此功能使用 App 資訊清單中宣告的 Android **App Actions**（`shortcuts.xml` 功能）。不需要任何閘道端設定——助理意圖完全由 Android App 處理。

<Note>
App Actions 的可用性取決於裝置、Google Play Services 版本，以及使用者是否已將 OpenClaw 設為預設助理 App。
</Note>

## 通知轉送

Android 可將裝置通知以 `node.event` 項目的形式轉送至閘道。此功能是在 App 的設定面板中**於裝置上**設定，而不是在閘道／`openclaw.json` 設定中設定。

| 設定                        | 說明                                                                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | 主開關。預設關閉；必須先授予 Notification Listener Access。                                                                                                                                  |
| Package Filter              | **Allowlist**（僅轉送列出的套件 ID）或 **Blocklist**（預設：除列出的 ID 外，所有套件皆會轉送）。在 Blocklist 模式下，一律排除 OpenClaw 自身的套件，以防止轉送迴圈。 |
| Quiet Hours                 | 用於抑制轉送的本機 HH:mm 開始／結束時段。預設停用；啟用後預設為 `22:00`-`07:00`。                                                                                |
| Max Events / Minute         | 每部裝置的通知轉送速率上限。預設為 20。                                                                                                                                                       |
| Route Session Key           | 選用。將轉送的通知事件固定至特定工作階段，而非裝置的預設通知路由。                                                                                                                            |

<Note>
通知轉送需要 Android Notification Listener 權限。應用程式會在設定期間提示授予此權限。
</Note>

一律排除 WhatsApp、WhatsApp Business、Telegram、Telegram X、Discord 和 Signal 的通知。其訊息已由原生 OpenClaw 頻道工作階段負責處理；若將 Android 通知當成獨立的節點事件轉送，可能會導致回覆經由錯誤的對話傳送。

## 相關內容

- [iOS 應用程式](/zh-TW/platforms/ios)
- [節點](/zh-TW/nodes)
- [Android 節點疑難排解](/zh-TW/nodes/troubleshooting)
