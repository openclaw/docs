---
read_when:
    - 您想讓 OpenClaw 代理程式加入 Google Meet 通話
    - 你想讓 OpenClaw 代理程式建立新的 Google Meet 通話
    - 你正在將 Chrome、Chrome 節點或 Twilio 設定為 Google Meet 傳輸方式
summary: Google Meet Plugin：透過 Chrome 或 Twilio 加入明確指定的 Meet URL，並套用即時語音預設值
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-02T20:52:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw 的 Google Meet 參與者支援是刻意設計為明確操作的 Plugin：

- 它只會加入明確的 `https://meet.google.com/...` URL。
- 它可以透過 Google Meet API 建立新的 Meet 空間，然後加入傳回的 URL。
- `realtime` 語音是預設模式。
- 當需要更深入的推理或工具時，即時語音可以回呼完整的 OpenClaw agent。
- Agents 透過 `mode` 選擇加入行為：使用 `realtime` 進行即時聆聽/回話，或使用 `transcribe` 加入/控制瀏覽器而不啟用即時語音橋接。
- 驗證一開始可使用個人 Google OAuth 或已登入的 Chrome 設定檔。
- 沒有自動同意公告。
- 預設的 Chrome 音訊後端是 `BlackHole 2ch`。
- Chrome 可以在本機執行，也可以在配對的 Node 主機上執行。
- Twilio 接受撥入號碼以及可選的 PIN 或 DTMF 序列；它無法直接撥打 Meet URL。
- CLI 指令是 `googlemeet`；`meet` 保留給更廣泛的 agent 電話會議工作流程。

## 快速開始

安裝本機音訊相依項，並設定後端即時語音提供者。OpenAI 是預設值；Google Gemini Live 也可搭配 `realtime.provider: "google"` 使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 會安裝 `BlackHole 2ch` 虛擬音訊裝置。Homebrew 的安裝程式需要重新開機，macOS 才會公開該裝置：

```bash
sudo reboot
```

重新開機後，驗證兩個項目：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

啟用 Plugin：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

檢查設定：

```bash
openclaw googlemeet setup
```

設定輸出的用途是讓 agent 可讀取，並且會感知模式。它會回報 Chrome 設定檔、Node 固定，以及針對即時 Chrome 加入，回報 BlackHole/SoX 音訊橋接和延遲即時介紹檢查。若是僅觀察加入，請使用 `--mode transcribe` 檢查相同傳輸；該模式會略過即時音訊先決條件，因為它不會透過橋接聆聽或說話：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

設定 Twilio 委派時，setup 也會回報 `voice-call` Plugin、Twilio 憑證和公開 Webhook 暴露是否就緒。請在要求 agent 加入之前，將任何 `ok: false` 檢查視為所檢查傳輸和模式的阻斷項。腳本或機器可讀輸出請使用 `openclaw googlemeet setup --json`。在 agent 嘗試前，使用 `--transport chrome`、`--transport chrome-node` 或 `--transport twilio` 預檢特定傳輸。

對 Twilio 而言，當預設傳輸是 Chrome 時，請一律明確預檢傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

這會在 agent 嘗試撥打會議前，捕捉缺少的 `voice-call` 接線、Twilio 憑證或無法連線的 Webhook 暴露。

加入會議：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或讓 agent 透過 `google_meet` 工具加入：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

面向 agent 的 `google_meet` 工具在非 macOS 主機上仍可用於成品、行事曆、設定、轉錄、Twilio 和 `chrome-node` 流程。本機 Chrome 即時動作會在該處被阻擋，因為內建的即時 Chrome 音訊路徑目前依賴 macOS `BlackHole 2ch`。在 Linux 上，請使用 `mode: "transcribe"`、Twilio 撥入，或 macOS `chrome-node` 主機進行即時 Chrome 參與。

建立新會議並加入：

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

對 API 建立的會議室，當你希望會議室的免敲門政策明確設定，而不是繼承自 Google 帳戶預設值時，請使用 Google Meet `SpaceConfig.accessType`：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` 允許任何持有 Meet URL 的人不需敲門即可加入。`TRUSTED` 允許主辦者組織中的受信任使用者、受邀外部使用者和撥入使用者不需敲門即可加入。`RESTRICTED` 將免敲門進入限制為受邀者。這些設定只適用於官方 Google Meet API 建立路徑，因此必須設定 OAuth 憑證。

如果你在此選項可用之前已驗證 Google Meet，請在將 `meetings.space.settings` 範圍新增到你的 Google OAuth 同意畫面後，重新執行 `openclaw googlemeet auth login --json`。

只建立 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有兩條路徑：

- API 建立：在已設定 Google Meet OAuth 憑證時使用。這是最具決定性的路徑，且不依賴瀏覽器 UI 狀態。
- 瀏覽器後援：在缺少 OAuth 憑證時使用。OpenClaw 使用固定的 Chrome Node，開啟 `https://meet.google.com/new`，等待 Google 重新導向到真實的會議代碼 URL，然後傳回該 URL。此路徑要求 Node 上的 OpenClaw Chrome 設定檔已登入 Google。瀏覽器自動化會處理 Meet 自己的首次執行麥克風提示；該提示不會被視為 Google 登入失敗。
  加入和建立流程也會先嘗試重用現有的 Meet 分頁，再開啟新分頁。比對時會忽略無害的 URL 查詢字串，例如 `authuser`，因此 agent 重試時應聚焦已開啟的會議，而不是建立第二個 Chrome 分頁。

指令/工具輸出包含 `source` 欄位（`api` 或 `browser`），讓 agents 可以說明使用了哪條路徑。`create` 預設會加入新會議，並傳回 `joined: true` 加上加入工作階段。若只要產生 URL，請在 CLI 使用 `create --no-join`，或將 `"join": false` 傳給工具。

或告訴 agent：「建立一個 Google Meet，用即時語音加入，並把連結傳給我。」agent 應以 `action: "create"` 呼叫 `google_meet`，然後分享傳回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

若要僅觀察/瀏覽器控制加入，請設定 `"mode": "transcribe"`。這不會啟動雙工即時模型橋接，不需要 BlackHole 或 SoX，也不會在會議中回話。此模式下的 Chrome 加入也會避免 OpenClaw 的麥克風/攝影機權限授與，並避免 Meet **使用麥克風** 路徑。如果 Meet 顯示音訊選擇插頁，自動化會嘗試無麥克風路徑，否則會回報需要手動操作，而不是開啟本機麥克風。在轉錄模式中，受管理的 Chrome 傳輸也會安裝盡力而為的 Meet 字幕觀察器。`googlemeet status --json` 和 `googlemeet doctor` 會顯示 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`，以及一段簡短的 `recentTranscript` 尾端，讓操作者判斷瀏覽器是否已加入通話，以及 Meet 字幕是否正在產生文字。
當你需要是/否探測時，請使用 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`：它會以轉錄模式加入，等待新的字幕或轉錄變動，並傳回 `listenVerified`、`listenTimedOut`、手動操作欄位，以及最新的字幕健康狀態。

即時工作階段期間，`google_meet` 狀態包含瀏覽器和音訊橋接健康狀態，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、上次輸入/輸出時間戳、位元組計數器，以及橋接關閉狀態。如果出現安全的 Meet 頁面提示，瀏覽器自動化會在可行時處理它。登入、主辦者准入和瀏覽器/作業系統權限提示會回報為需要手動操作，並附上原因和訊息供 agent 轉述。受管理的 Chrome 工作階段只會在瀏覽器健康狀態回報 `inCall: true` 後發出介紹或測試短語；否則狀態會回報 `speechReady: false`，並阻擋語音嘗試，而不是假裝 agent 已在會議中說話。

本機 Chrome 會透過已登入的 OpenClaw 瀏覽器設定檔加入。即時模式需要 `BlackHole 2ch`，用於 OpenClaw 使用的麥克風/喇叭路徑。若要乾淨的雙工音訊，請使用分離的虛擬裝置或 Loopback 風格的圖；單一 BlackHole 裝置足以進行第一次煙霧測試，但可能會產生回音。

### 本機 Gateway + Parallels Chrome

若只是要讓 VM 擁有 Chrome，你**不**需要在 macOS VM 內放置完整 OpenClaw Gateway 或模型 API key。請在本機執行 Gateway 和 agent，然後在 VM 內執行 Node 主機。在 VM 上啟用一次內建 Plugin，讓 Node 公告 Chrome 指令：

各處執行內容：

- Gateway 主機：OpenClaw Gateway、agent 工作區、模型/API keys、即時提供者，以及 Google Meet Plugin 設定。
- Parallels macOS VM：OpenClaw CLI/Node 主機、Google Chrome、SoX、BlackHole 2ch，以及已登入 Google 的 Chrome 設定檔。
- VM 中不需要：Gateway 服務、agent 設定、OpenAI/GPT key，或模型提供者設定。

安裝 VM 相依項：

```bash
brew install blackhole-2ch sox
```

安裝 BlackHole 後重新啟動 VM，讓 macOS 公開 `BlackHole 2ch`：

```bash
sudo reboot
```

重新開機後，驗證 VM 能看到音訊裝置和 SoX 指令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中安裝或更新 OpenClaw，然後在該處啟用內建 Plugin：

```bash
openclaw plugins enable google-meet
```

在 VM 中啟動 Node 主機：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是 LAN IP 且你未使用 TLS，除非你針對該受信任的私人網路選擇加入，否則 Node 會拒絕純文字 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

將 Node 安裝為 LaunchAgent 時，請使用相同環境變數：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是程序環境，不是 `openclaw.json` 設定。當它出現在安裝指令上時，`openclaw node install` 會將它儲存在 LaunchAgent 環境中。

從 Gateway 主機核准 Node：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

確認 Gateway 看得到 Node，並且它公告 `googlemeet.chrome` 和瀏覽器 capability/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway 主機上透過該 Node 路由 Meet：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

現在從 Gateway 主機正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或要求 agent 使用帶有 `transport: "chrome-node"` 的 `google_meet` 工具。

若要進行單一指令煙霧測試，建立或重用工作階段、說出已知短語，並列印工作階段健康狀態：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在即時加入期間，OpenClaw 瀏覽器自動化會填入訪客名稱、點擊
Join/Ask to join，並在 Meet 首次執行的「Use microphone」選項提示出現時接受該選項。於僅觀察加入或僅使用瀏覽器建立會議期間，若同一提示提供不使用麥克風的選項，它會繼續越過該提示。
如果瀏覽器設定檔尚未登入、Meet 正在等待主持人准入、Chrome 需要即時加入的麥克風/攝影機權限，或 Meet 卡在自動化無法解決的提示上，join/test-speech 結果會回報
`manualActionRequired: true`，並附上 `manualActionReason` 和
`manualActionMessage`。Agent 應停止重試加入，回報該確切訊息以及目前的
`browserUrl`/`browserTitle`，並且只在手動瀏覽器動作完成後才重試。

如果省略 `chromeNode.node`，OpenClaw 只會在剛好有一個已連線節點同時宣告
`googlemeet.chrome` 和瀏覽器控制時自動選取。如果有多個具備能力的節點已連線，請將
`chromeNode.node` 設為節點 ID、顯示名稱或遠端 IP。

常見失敗檢查：

- `Configured Google Meet node ... is not usable: offline`：已釘選的節點為
  Gateway 所知，但目前不可用。Agent 應將該節點視為診斷狀態，而不是可用的 Chrome 主機，並回報設定阻礙，而非退回到另一個傳輸方式，除非使用者要求如此。
- `No connected Google Meet-capable node`：在 VM 中啟動 `openclaw node run`，
  核准配對，並確認已在 VM 中執行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。也請確認 Gateway 主機允許這兩個節點命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被檢查的主機上安裝 `blackhole-2ch`，
  並在使用本機 Chrome 音訊前重新開機。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安裝 `blackhole-2ch`，
  並重新啟動 VM。
- Chrome 會開啟但無法加入：在 VM 內的瀏覽器設定檔登入，或保持設定
  `chrome.guestName` 以進行訪客加入。訪客自動加入會透過節點瀏覽器代理使用 OpenClaw
  瀏覽器自動化；請確認節點瀏覽器設定指向你想要的設定檔，例如
  `browser.defaultProfile: "user"` 或具名的現有工作階段設定檔。
- 重複的 Meet 分頁：保持啟用 `chrome.reuseExistingTab: true`。OpenClaw 會在開啟新分頁前啟用相同 Meet URL 的現有分頁，而瀏覽器會議建立會在開啟另一個分頁前重用進行中的
  `https://meet.google.com/new` 或 Google 帳戶提示分頁。
- 沒有音訊：在 Meet 中，將麥克風/喇叭路由到 OpenClaw 使用的虛擬音訊裝置路徑；使用個別的虛擬裝置或 Loopback 風格的路由，以取得乾淨的雙向音訊。

## 安裝注意事項

Chrome 即時預設值使用兩個外部工具：

- `sox`：命令列音訊工具。Plugin 會針對預設的 24 kHz PCM16 音訊橋接使用明確的 CoreAudio 裝置命令。
- `blackhole-2ch`：macOS 虛擬音訊驅動程式。它會建立 Chrome/Meet 可透過其路由的
  `BlackHole 2ch` 音訊裝置。

OpenClaw 不會內建或重新散布任一套件。文件會要求使用者透過 Homebrew 將它們安裝為主機相依項。SoX 授權為
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 為 GPL-3.0。如果你建置的安裝程式或 appliance 會將 BlackHole 與 OpenClaw 綑綁，請檢閱 BlackHole 的上游授權條款，或向 Existential Audio 取得個別授權。

## 傳輸方式

### Chrome

Chrome 傳輸會透過 OpenClaw 瀏覽器控制開啟 Meet URL，並以已登入的 OpenClaw 瀏覽器設定檔加入。在 macOS 上，Plugin 會在啟動前檢查
`BlackHole 2ch`。如果已設定，它也會在開啟 Chrome 前執行音訊橋接健康狀態命令和啟動命令。當 Chrome/音訊位於 Gateway 主機時使用 `chrome`；當 Chrome/音訊位於已配對節點（例如 Parallels macOS VM）時使用 `chrome-node`。對於本機 Chrome，請使用
`browser.defaultProfile` 選擇設定檔；`chrome.browserProfile` 會傳遞給
`chrome-node` 主機。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

將 Chrome 麥克風和喇叭音訊路由到本機 OpenClaw 音訊橋接。如果未安裝
`BlackHole 2ch`，加入會因設定錯誤而失敗，而不是在沒有音訊路徑的情況下悄悄加入。

### Twilio

Twilio 傳輸是委派給 Voice Call Plugin 的嚴格撥號計畫。它不會剖析 Meet 頁面來取得電話號碼。

當無法使用 Chrome 參與，或你想要電話撥入備援時使用此選項。Google Meet 必須為該會議公開電話撥入號碼和 PIN；OpenClaw 不會從 Meet 頁面探索這些資訊。

在 Gateway 主機上啟用 Voice Call Plugin，而不是在 Chrome 節點上：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

透過環境或設定提供 Twilio 認證。環境變數可讓機密不進入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

啟用 `voice-call` 後重新啟動或重新載入 Gateway；Plugin 設定變更在 Gateway 程序重新載入前，不會出現在已在執行的 Gateway 程序中。

接著驗證：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

當 Twilio 委派已接好時，`googlemeet setup` 會包含成功的
`twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和
`twilio-voice-call-webhook` 檢查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

當會議需要自訂序列時使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和預檢

OAuth 對於建立 Meet 連結是選用的，因為 `googlemeet create` 可以退回使用瀏覽器自動化。當你需要官方 API 建立、空間解析，或 Meet Media API 預檢時，請設定 OAuth。

Google Meet API 存取使用使用者 OAuth：建立 Google Cloud OAuth 用戶端、要求必要範圍、授權 Google 帳戶，然後將產生的 refresh token 儲存在 Google Meet Plugin 設定中，或提供
`OPENCLAW_GOOGLE_MEET_*` 環境變數。

OAuth 不會取代 Chrome 加入路徑。Chrome 和 Chrome-node 傳輸在你使用瀏覽器參與時，仍會透過已登入的 Chrome 設定檔、BlackHole/SoX，以及已連線的節點加入。OAuth 僅用於官方 Google Meet API 路徑：建立會議空間、解析空間，以及執行 Meet Media API 預檢。

### 建立 Google 認證

在 Google Cloud Console 中：

1. 建立或選取 Google Cloud 專案。
2. 為該專案啟用 **Google Meet REST API**。
3. 設定 OAuth 同意畫面。
   - **Internal** 對 Google Workspace 組織最簡單。
   - **External** 適用於個人/測試設定；當應用程式處於 Testing 時，將每個會授權該應用程式的 Google 帳戶新增為測試使用者。
4. 新增 OpenClaw 要求的範圍：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 建立 OAuth 用戶端 ID。
   - 應用程式類型：**Web application**。
   - 已授權重新導向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 複製用戶端 ID 和用戶端密鑰。

Google Meet `spaces.create` 需要 `meetings.space.created`。
`meetings.space.readonly` 讓 OpenClaw 能將 Meet URL/代碼解析為空間。
`meetings.space.settings` 讓 OpenClaw 在透過 API 建立房間時傳遞
`SpaceConfig` 設定，例如 `accessType`。
`meetings.conference.media.readonly` 用於 Meet Media API 預檢和媒體工作；Google 可能會要求加入 Developer Preview 才能實際使用 Media API。
如果你只需要以瀏覽器為基礎的 Chrome 加入，請完全略過 OAuth。

### Mint refresh token

設定 `oauth.clientId` 以及選擇性設定 `oauth.clientSecret`，或將它們作為環境變數傳入，然後執行：

```bash
openclaw googlemeet auth login --json
```

該命令會列印包含 refresh token 的 `oauth` 設定區塊。它使用 PKCE、位於
`http://localhost:8085/oauth2callback` 的 localhost callback，以及使用
`--manual` 的手動複製/貼上流程。

範例：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

當瀏覽器無法連到本機 callback 時使用手動模式：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 輸出包含：

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

將 `oauth` 物件儲存在 Google Meet Plugin 設定下：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

當你不想讓 refresh token 進入設定時，優先使用環境變數。如果同時存在設定和環境值，Plugin 會先解析設定，然後才退回到環境。

OAuth 同意包含 Meet 空間建立、Meet 空間讀取存取，以及 Meet 會議媒體讀取存取。如果你在會議建立支援存在前已驗證，請重新執行
`openclaw googlemeet auth login --json`，讓 refresh token 具有
`meetings.space.created` 範圍。

### 使用 doctor 驗證 OAuth

當你需要快速、不含機密的健康狀態檢查時，執行 OAuth doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

這不會載入 Chrome runtime，也不需要已連線的 Chrome 節點。它會檢查 OAuth 設定是否存在，以及 refresh token 是否能 mint access token。JSON 報告只包含
`ok`、`configured`、`tokenSource`、`expiresAt` 和檢查訊息等狀態欄位；它不會列印 access token、refresh token 或用戶端密鑰。

常見結果：

| 檢查                 | 意義                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加上 `oauth.refreshToken`，或存在已快取的 access token。          |
| `oauth-token`        | 已快取的 access token 仍有效，或 refresh token 已 mint 新的 access token。              |
| `meet-spaces-get`    | 選用的 `--meeting` 檢查已解析現有 Meet 空間。                                           |
| `meet-spaces-create` | 選用的 `--create-space` 檢查已建立新的 Meet 空間。                                     |

若要同時證明 Google Meet API 啟用狀態和 `spaces.create` 範圍，請執行具副作用的建立檢查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 會建立一個拋棄式 Meet URL。當你需要確認
Google Cloud 專案已啟用 Meet API，且已授權帳戶具有 `meetings.space.created` 範圍時使用它。

若要證明對現有會議空間的讀取存取權：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 與 `resolve-space` 可證明對已授權 Google 帳戶可存取的現有
space 具有讀取存取權。這些檢查傳回 `403` 通常表示 Google Meet REST API 已停用、已同意的重新整理權杖缺少必要範圍，或該 Google 帳戶無法存取該 Meet
space。重新整理權杖錯誤表示需重新執行 `openclaw googlemeet auth login
--json`，並儲存新的 `oauth` 區塊。

瀏覽器備援不需要 OAuth 認證。在該模式中，Google
驗證來自所選節點上已登入的 Chrome 設定檔，而不是來自
OpenClaw 設定。

下列環境變數可作為備援接受：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 或 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 或 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 或
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 或 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 或 `GOOGLE_MEET_PREVIEW_ACK`

透過 `spaces.get` 解析 Meet URL、代碼或 `spaces/{id}`：

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

在媒體工作前執行預檢：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

在 Meet 建立會議記錄後列出會議成品與出席狀況：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

搭配 `--meeting` 時，`artifacts` 與 `attendance` 預設會使用最新的會議記錄。當你想取得該會議所有保留的記錄時，請傳入 `--all-conference-records`。

Calendar 查詢可先從 Google Calendar 解析會議 URL，再讀取
Meet 成品：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 會在今天的 `primary` 日曆中搜尋含有
Google Meet 連結的 Calendar 事件。使用 `--event <query>` 搜尋相符的事件文字，並使用
`--calendar <id>` 指定非主要日曆。Calendar 查詢需要包含 Calendar events readonly 範圍的全新
OAuth 登入。`calendar-events` 會預覽相符的 Meet 事件，並標記
`latest`、`artifacts`、`attendance` 或 `export` 將選擇的事件。

如果你已知道會議記錄 ID，可直接指定它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

當你想在通話後關閉房間時，可結束 API 建立空間中的作用中會議：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

這會呼叫 Google Meet `spaces.endActiveConference`，並需要 OAuth 對已授權帳戶可管理的空間具有
`meetings.space.created` 範圍。OpenClaw 接受 Meet URL、會議代碼或 `spaces/{id}` 輸入，並在結束作用中會議前將其解析為 API 空間資源。
它與 `googlemeet leave` 不同：`leave` 會停止 OpenClaw 的本機/工作階段參與，而 `end-active-conference` 會要求 Google Meet 結束該空間的作用中會議。

寫入可讀報告：

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

當 Google 為該會議公開資料時，`artifacts` 會傳回會議記錄中繼資料，以及參與者、錄影、逐字稿、結構化逐字稿項目和智慧筆記資源中繼資料。大型會議可使用 `--no-transcript-entries` 跳過項目查詢。`attendance` 會將參與者展開為
participant-session 列，其中包含首次/最後看到時間、總工作階段持續時間、遲到/提早離開旗標，並依已登入使用者或顯示名稱合併重複的參與者資源。傳入 `--no-merge-duplicates` 可保留原始參與者資源彼此分開，`--late-after-minutes` 可調整遲到偵測，`--early-before-minutes` 可調整提早離開偵測。

`export` 會寫入一個資料夾，其中包含 `summary.md`、`attendance.csv`、
`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。
`manifest.json` 會記錄所選輸入、匯出選項、會議記錄、輸出檔案、計數、權杖來源、使用過的 Calendar 事件，以及任何部分擷取警告。傳入 `--zip` 也會在資料夾旁寫入可攜式封存檔。傳入 `--include-doc-bodies` 可透過 Google Drive `files.export` 匯出連結的逐字稿和智慧筆記 Google Docs 文字；這需要包含 Drive Meet readonly 範圍的全新 OAuth 登入。若未使用
`--include-doc-bodies`，匯出只會包含 Meet 中繼資料和結構化逐字稿項目。如果 Google 傳回部分成品失敗，例如智慧筆記清單、逐字稿項目或 Drive 文件本文錯誤，摘要與
manifest 會保留警告，而不是讓整個匯出失敗。
使用 `--dry-run` 可擷取相同的成品/出席資料，並列印
manifest JSON，而不建立資料夾或 ZIP。這在寫入大型匯出前，或代理程式只需要計數、所選記錄和警告時很有用。

代理程式也可以透過 `google_meet` 工具建立相同套件：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

設定 `"dryRun": true` 只傳回匯出 manifest 並略過檔案寫入。

代理程式也可以建立具有明確存取政策的 API 支援房間：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

它們也可以結束已知房間的作用中會議：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

若要進行先聽後驗證，代理程式應在宣稱會議有用前使用 `test_listen`：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

針對真實保留會議執行受保護的即時煙霧測試：

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

針對有人會發言且 Meet 字幕可用的會議，執行即時先聽瀏覽器探測：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

即時煙霧測試環境：

- `OPENCLAW_LIVE_TEST=1` 會啟用受保護的即時測試。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代碼或
  `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth
  用戶端 ID。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供
  重新整理權杖。
- 選用：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用不含 `OPENCLAW_` 前綴的相同備援名稱。

基礎成品/出席即時煙霧測試需要
`https://www.googleapis.com/auth/meetings.space.readonly` 和
`https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar
查詢需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive
文件本文匯出需要
`https://www.googleapis.com/auth/drive.meet.readonly`。

建立全新的 Meet 空間：

```bash
openclaw googlemeet create
```

該命令會列印新的 `meeting uri`、來源與加入工作階段。若有 OAuth
認證，它會使用官方 Google Meet API。若沒有 OAuth 認證，它會使用釘選 Chrome 節點的已登入瀏覽器設定檔作為備援。代理程式可以使用 `google_meet` 工具搭配 `action: "create"` 一步建立並加入。若只要建立 URL，請傳入 `"join": false`。

瀏覽器備援的 JSON 輸出範例：

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

如果瀏覽器備援在可建立 URL 前遇到 Google 登入或 Meet 權限封鎖，Gateway 方法會傳回失敗回應，且
`google_meet` 工具會傳回結構化詳細資料，而不是純字串：

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

當代理程式看到 `manualActionRequired: true` 時，應回報
`manualActionMessage` 加上瀏覽器節點/分頁情境，並停止開啟新的
Meet 分頁，直到操作員完成瀏覽器步驟。

API 建立的 JSON 輸出範例：

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

建立 Meet 預設會加入。Chrome 或 Chrome-node 傳輸仍需要已登入的 Google Chrome 設定檔，才能透過瀏覽器加入。如果設定檔已登出，OpenClaw 會回報 `manualActionRequired: true` 或瀏覽器備援錯誤，並要求操作員先完成 Google 登入再重試。

只有在確認你的 Cloud 專案、OAuth 主體與會議參與者已加入 Google
Workspace Developer Preview Program for Meet media APIs 後，才設定 `preview.enrollmentAcknowledged: true`。

## 設定

常見的 Chrome 即時路徑只需要啟用 Plugin、BlackHole、SoX，以及後端即時語音提供者金鑰。OpenAI 是預設值；設定
`realtime.provider: "google"` 可使用 Google Gemini Live：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

在 `plugins.entries.google-meet.config` 下設定 Plugin 設定：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

預設值：

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`：選用的 `chrome-node` 節點 ID/名稱/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：用於未登入 Meet 訪客畫面的名稱
- `chrome.autoJoin: true`：透過 `chrome-node` 上的 OpenClaw 瀏覽器自動化，盡力填入訪客名稱並點擊立即加入
- `chrome.reuseExistingTab: true`：啟用現有 Meet 分頁，而不是開啟重複分頁
- `chrome.waitForInCallMs: 20000`：等待 Meet 分頁回報已在通話中，再觸發即時簡介
- `chrome.audioFormat: "pcm16-24khz"`：命令配對音訊格式。只有仍會發出電話音訊的舊版/自訂命令配對才使用 `"g711-ulaw-8khz"`。
- `chrome.audioInputCommand`：從 CoreAudio `BlackHole 2ch` 讀取並以 `chrome.audioFormat` 寫入音訊的 SoX 命令
- `chrome.audioOutputCommand`：以 `chrome.audioFormat` 讀取音訊並寫入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：選用的本機麥克風命令，會寫入有號 16 位元小端序單聲道 PCM，用於在助理播放期間偵測人工插話。這目前適用於 Gateway 託管的 `chrome` 命令配對橋接。
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand` 上視為人工中斷的 RMS 等級
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand` 上視為人工中斷的峰值等級
- `chrome.bargeInCooldownMs: 900`：重複清除人工中斷之間的最小延遲
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：簡短口語回覆，使用 `openclaw_agent_consult` 取得更深入的答案
- `realtime.introMessage`：即時橋接連線時的簡短口語就緒檢查；設為 `""` 可靜默加入
- `realtime.agentId`：`openclaw_agent_consult` 的選用 OpenClaw 代理 ID；預設為 `main`

選用覆寫：

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

僅限 Twilio 的設定：

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` 預設為 `true`；使用 Twilio 傳輸時，它會將實際的 PSTN 通話、DTMF 和開場問候委派給 Voice Call Plugin。Voice Call 會先播放 DTMF 序列，再開啟即時媒體串流，然後使用儲存的簡介文字作為初始即時問候。如果未啟用 `voice-call`，Google Meet 仍可驗證並記錄撥號方案，但無法撥打 Twilio 通話。

## 工具

代理可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

當 Chrome 在 Gateway 主機上執行時，使用 `transport: "chrome"`。當 Chrome 在已配對節點（例如 Parallels VM）上執行時，使用 `transport: "chrome-node"`。在兩種情況下，即時模型和 `openclaw_agent_consult` 都在 Gateway 主機上執行，因此模型憑證會留在那裡。

使用 `action: "status"` 列出作用中工作階段或檢查工作階段 ID。使用帶有 `sessionId` 和 `message` 的 `action: "speak"`，可讓即時代理立即說話。使用 `action: "test_speech"` 可建立或重用工作階段、觸發已知片語，並在 Chrome 主機可回報時回傳 `inCall` 健康狀態。`test_speech` 一律強制 `mode: "realtime"`，且如果要求以 `mode: "transcribe"` 執行會失敗，因為僅觀察工作階段刻意不能發出語音。其 `speechOutputVerified` 結果是根據這次測試呼叫期間即時音訊輸出位元組是否增加，因此含有舊音訊的重用工作階段不會算作新的成功語音檢查。使用 `action: "leave"` 將工作階段標記為已結束。

`status` 會在可用時包含 Chrome 健康狀態：

- `inCall`：Chrome 似乎位於 Meet 通話內
- `micMuted`：盡力取得的 Meet 麥克風狀態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：瀏覽器設定檔需要手動登入、Meet 主持人准入、權限，或先修復瀏覽器控制，語音才能運作
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：目前是否允許受管理的 Chrome 語音。`speechReady: false` 表示 OpenClaw 未將簡介/測試片語送入音訊橋接。
- `providerConnected` / `realtimeReady`：即時語音橋接狀態
- `lastInputAt` / `lastOutputAt`：最近一次從橋接看到或送往橋接的音訊
- `lastSuppressedInputAt` / `suppressedInputBytes`：助理播放期間被忽略的回送輸入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 即時代理諮詢

Chrome 即時模式針對即時語音循環最佳化。即時語音供應商會聽取會議音訊，並透過設定的音訊橋接發聲。當即時模型需要更深入推理、目前資訊或一般 OpenClaw 工具時，可以呼叫 `openclaw_agent_consult`。

諮詢工具會在幕後使用近期會議逐字稿脈絡執行一般 OpenClaw 代理，並將精簡的口語答案回傳給即時語音工作階段。語音模型接著可以將該答案說回會議中。它使用與 Voice Call 相同的共用即時諮詢工具。

預設情況下，諮詢會針對 `main` 代理執行。當某個 Meet 通道應諮詢專用 OpenClaw 代理工作區、模型預設值、工具政策、記憶體和工作階段歷史時，請設定 `realtime.agentId`。

`realtime.toolPolicy` 控制諮詢執行：

- `safe-read-only`：公開諮詢工具，並將一般代理限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：公開諮詢工具，並讓一般代理使用正常的代理工具政策。
- `none`：不向即時語音模型公開諮詢工具。

諮詢工作階段金鑰會依 Meet 工作階段設定範圍，因此後續諮詢呼叫可在同一場會議中重用先前的諮詢脈絡。

若要在 Chrome 完全加入通話後強制執行口語就緒檢查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整的加入並說話煙霧測試：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 即時測試檢查清單

在將會議交給無人值守代理之前，請使用此序列：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

預期的 Chrome-node 狀態：

- `googlemeet setup` 全部為綠色。
- 當 Chrome-node 是預設傳輸或已固定節點時，`googlemeet setup` 包含 `chrome-node-connected`。
- `nodes status` 顯示所選節點已連線。
- 所選節點會宣告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 分頁加入通話，且 `test-speech` 回傳帶有 `inCall: true` 的 Chrome 健康狀態。

對於遠端 Chrome 主機（例如 Parallels macOS VM），這是在更新 Gateway 或 VM 後最短的安全檢查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

這會證明 Gateway Plugin 已載入、VM 節點已使用目前權杖連線，且 Meet 音訊橋接可用，然後代理才會開啟真實會議分頁。

若要進行 Twilio 煙霧測試，請使用會公開電話撥入詳細資訊的會議：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

預期的 Twilio 狀態：

- `googlemeet setup` 包含綠色的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 檢查。
- Gateway 重新載入後，CLI 中可使用 `voicecall`。
- 回傳的工作階段具有 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 顯示先提供 DTMF TwiML，再提供即時 TwiML，接著是已佇列初始問候的即時橋接。
- `googlemeet leave <sessionId>` 會掛斷委派的語音通話。

## 疑難排解

### 代理看不到 Google Meet 工具

確認 Plugin 已在 Gateway 設定中啟用，並重新載入 Gateway：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你剛編輯過 `plugins.entries.google-meet`，請重新啟動或重新載入 Gateway。執行中的代理只會看到目前 Gateway 程序註冊的 Plugin 工具。

在非 macOS Gateway 主機上，面向代理的 `google_meet` 工具仍會顯示，但本機 Chrome 即時動作會在到達音訊橋接之前被封鎖。本機 Chrome 即時音訊目前依賴 macOS `BlackHole 2ch`，因此 Linux 代理應使用 `mode: "transcribe"`、Twilio 撥入，或 macOS `chrome-node` 主機，而不是預設的本機 Chrome 即時路徑。

### 沒有已連線且支援 Google Meet 的節點

在節點主機上執行：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 主機上，核准節點並驗證命令：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

節點必須已連線，並列出 `googlemeet.chrome` 加上 `browser.proxy`。Gateway 設定必須允許這些節點命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 的 `chrome-node-connected` 失敗，或 Gateway 記錄回報 `gateway token mismatch`，請使用目前的 Gateway 權杖重新安裝或重新啟動節點。對於 LAN Gateway，這通常表示：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

然後重新載入節點服務並重新執行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 瀏覽器已開啟但代理無法加入

對僅觀察加入執行 `googlemeet test-listen`，或對即時加入執行 `googlemeet test-speech`，然後檢查回傳的 Chrome 健康狀態。如果任一探測回報 `manualActionRequired: true`，請向操作員顯示 `manualActionMessage`，並在瀏覽器動作完成前停止重試。

常見的手動動作：

- 登入 Chrome 設定檔。
- 從 Meet 主持人帳戶准入訪客。
- 當 Chrome 原生權限提示出現時，授予 Chrome 麥克風/相機權限。
- 關閉或修復卡住的 Meet 權限對話框。

不要只因為 Meet 顯示「你要讓會議中的其他人聽到你的聲音嗎？」就回報「未登入」。那是 Meet 的音訊選擇中介畫面；OpenClaw 會在可用時透過瀏覽器自動化點擊 **使用麥克風**，並持續等待真正的會議狀態。對於僅建立會議的瀏覽器備援，OpenClaw 可能會點擊 **不使用麥克風繼續**，因為建立 URL 不需要即時音訊路徑。

### 會議建立失敗

`googlemeet create` 會先在已設定 OAuth 認證時使用 Google Meet API 的 `spaces.create` 端點。沒有 OAuth 認證時，會退回使用固定的 Chrome node 瀏覽器。請確認：

- 針對 API 建立：已設定 `oauth.clientId` 和 `oauth.refreshToken`，或存在相符的 `OPENCLAW_GOOGLE_MEET_*` 環境變數。
- 針對 API 建立：refresh token 是在新增建立支援後產生的。較舊的 token 可能缺少 `meetings.space.created` scope；重新執行 `openclaw googlemeet auth login --json` 並更新 Plugin 設定。
- 針對瀏覽器備援：`defaultTransport: "chrome-node"`，且 `chromeNode.node` 指向已連線、具備 `browser.proxy` 和 `googlemeet.chrome` 的 node。
- 針對瀏覽器備援：該 node 上的 OpenClaw Chrome 設定檔已登入 Google，並且可以開啟 `https://meet.google.com/new`。
- 針對瀏覽器備援：重試時會先重用現有的 `https://meet.google.com/new` 或 Google 帳戶提示分頁，再開啟新分頁。如果 agent 逾時，請重試工具呼叫，而不是手動開啟另一個 Meet 分頁。
- 針對瀏覽器備援：如果工具回傳 `manualActionRequired: true`，請使用回傳的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 來引導操作員。在該動作完成前，不要迴圈重試。
- 針對瀏覽器備援：如果 Meet 顯示「你要讓會議中的其他人聽到你的聲音嗎？」，請保持分頁開啟。OpenClaw 應透過瀏覽器自動化點擊 **使用麥克風**，或在僅建立會議的備援情境中點擊 **不使用麥克風繼續**，並繼續等待產生的 Meet URL。如果無法做到，錯誤應提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### Agent 加入但不說話

檢查即時路徑：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "realtime"` 進行聆聽／回話。`mode: "transcribe"` 會刻意不啟動雙工即時語音橋接。若要進行僅觀察的除錯，請在參與者發言後執行 `openclaw googlemeet status --json <session-id>`，並檢查 `captioning`、`transcriptLines` 和 `lastCaptionText`。如果 `inCall` 為 true 但 `transcriptLines` 維持在 `0`，可能是 Meet 字幕已停用、觀察器安裝後沒有人發言、Meet UI 已變更，或該會議語言／帳戶無法使用即時字幕。

`googlemeet test-speech` 一律檢查即時路徑，並回報該次呼叫是否觀察到橋接輸出位元組。如果 `speechOutputVerified` 為 false 且 `speechOutputTimedOut` 為 true，即時提供者可能已接受該語句，但 OpenClaw 沒有看到新的輸出位元組抵達 Chrome 音訊橋接。

也請確認：

- Gateway 主機上可用即時提供者金鑰，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主機上可看到 `BlackHole 2ch`。
- Chrome 主機上存在 `sox`。
- Meet 麥克風和喇叭已透過 OpenClaw 使用的虛擬音訊路徑路由。

`googlemeet doctor [session-id]` 會列印 session、node、通話中狀態、手動動作原因、即時提供者連線、`realtimeReady`、音訊輸入／輸出活動、最後音訊時間戳、位元組計數器，以及瀏覽器 URL。需要原始 JSON 時，使用 `googlemeet status [session-id] --json`。需要在不暴露 token 的情況下驗證 Google Meet OAuth refresh 時，使用 `googlemeet doctor --oauth`；如果也需要 Google Meet API 證明，請加上 `--meeting` 或 `--create-space`。

如果 agent 逾時，而你可以看到 Meet 分頁已經開啟，請檢查該分頁，不要再開啟另一個：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具動作是 `recover_current_tab`。它會聚焦並檢查所選傳輸方式的現有 Meet 分頁。使用 `chrome` 時，它透過 Gateway 使用本機瀏覽器控制；使用 `chrome-node` 時，它使用已設定的 Chrome node。它不會開啟新分頁或建立新 session；它會回報目前的阻擋因素，例如登入、准入、權限或音訊選擇狀態。CLI 命令會與已設定的 Gateway 通訊，因此 Gateway 必須正在執行；`chrome-node` 也需要 Chrome node 已連線。

### Twilio 設定檢查失敗

`twilio-voice-call-plugin` 會在 `voice-call` 未被允許或未啟用時失敗。將它加入 `plugins.allow`，啟用 `plugins.entries.voice-call`，然後重新載入 Gateway。

`twilio-voice-call-credentials` 會在 Twilio 後端缺少帳戶 SID、auth token 或來電號碼時失敗。在 Gateway 主機上設定這些項目：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` 會在 `voice-call` 沒有公開 Webhook 暴露，或 `publicUrl` 指向 loopback 或私人網路空間時失敗。將 `plugins.entries.voice-call.config.publicUrl` 設為公開提供者 URL，或設定 `voice-call` 通道／Tailscale 暴露。

Loopback 和私人 URL 不適合用於電信業者回呼。請不要使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

若要使用穩定的公開 URL：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

本機開發時，請使用通道或 Tailscale 暴露，而不是私人主機 URL：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

接著重新啟動或重新載入 Gateway，並執行：

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 預設僅檢查就緒狀態。若要對特定號碼進行 dry-run：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你有意要撥出即時外撥通知電話時，才加入 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話開始但從未進入會議

確認 Meet 事件公開了電話撥入詳細資訊。傳入精確的撥入號碼和 PIN，或自訂 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供者在輸入 PIN 前需要暫停，請在 `--dtmf-sequence` 中使用前置 `w` 或逗號。

如果電話通話已建立，但 Meet 名單中從未顯示撥入參與者：

- 執行 `openclaw googlemeet doctor <session-id>`，確認委派的 Twilio 通話 ID、DTMF 是否已排入佇列，以及是否已要求開場問候。
- 執行 `openclaw voicecall status --call-id <id>`，並確認通話仍在進行。
- 執行 `openclaw voicecall tail`，並檢查 Twilio Webhook 是否抵達 Gateway。
- 執行 `openclaw logs --follow`，並尋找 Twilio Meet 序列：Google Meet 委派加入、Voice Call 啟動電話端、Google Meet 等待 `voiceCall.dtmfDelayMs`、使用 `voicecall.dtmf` 傳送 DTMF、等待 `voiceCall.postDtmfSpeechDelayMs`，然後使用 `voicecall.speak` 要求開場語音。
- 重新執行 `openclaw googlemeet setup --transport twilio`；綠色設定檢查是必要條件，但不證明會議 PIN 序列正確。
- 確認撥入號碼屬於與 PIN 相同的 Meet 邀請和區域。
- 如果 Meet 接聽較慢，或通話逐字稿在傳送 DTMF 後仍顯示要求輸入 PIN 的提示，請增加 `voiceCall.dtmfDelayMs`。
- 如果參與者已加入，但你聽不到問候語，請在 `openclaw logs --follow` 中檢查 DTMF 後的 `voicecall.speak` 要求，以及媒體串流 TTS 播放或 Twilio `<Say>` 備援。如果通話逐字稿仍包含「輸入會議 PIN」，表示電話端尚未加入 Meet 會議室，因此會議參與者不會聽到語音。

如果 Webhook 沒有抵達，請先除錯 Voice Call Plugin：提供者必須能連到 `plugins.entries.voice-call.config.publicUrl` 或已設定的通道。請參閱 [語音通話疑難排解](/zh-TW/plugins/voice-call#troubleshooting)。

## 備註

Google Meet 的官方媒體 API 偏向接收，因此要在 Meet 通話中說話仍需要參與者路徑。此 Plugin 會讓該邊界保持可見：Chrome 處理瀏覽器參與和本機音訊路由；Twilio 處理電話撥入參與。

Chrome 即時模式需要 `BlackHole 2ch`，以及下列其中一項：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 擁有即時模型橋接，並在這些命令與所選即時語音提供者之間，以 `chrome.audioFormat` 管線傳遞音訊。預設 Chrome 路徑是 24 kHz PCM16；8 kHz G.711 mu-law 仍可供舊版命令組合使用。
- `chrome.audioBridgeCommand`：外部橋接命令擁有整個本機音訊路徑，並且必須在啟動或驗證其 daemon 後結束。

若要取得乾淨的雙工音訊，請將 Meet 輸出和 Meet 麥克風透過不同的虛擬裝置，或 Loopback 風格的虛擬裝置圖路由。單一共用的 BlackHole 裝置可能會把其他參與者回音送回通話中。

使用命令組合 Chrome 橋接時，`chrome.bargeInInputCommand` 可以聆聽獨立的本機麥克風，並在人類開始說話時清除助理播放。即使共用 BlackHole loopback 輸入在助理播放期間暫時被抑制，這仍能讓人類語音優先於助理輸出。與 `chrome.audioInputCommand` 和 `chrome.audioOutputCommand` 一樣，它是由操作員設定的本機命令。請使用明確且受信任的命令路徑或引數列表，不要將它指向不受信任位置的腳本。

`googlemeet speak` 會觸發 Chrome session 的有效即時音訊橋接。`googlemeet leave` 會停止該橋接。對於透過 Voice Call Plugin 委派的 Twilio session，`leave` 也會掛斷底層語音通話。當你也想關閉 API 管理空間中的有效 Google Meet 會議時，請使用 `googlemeet end-active-conference`。

## 相關

- [Voice call Plugin](/zh-TW/plugins/voice-call)
- [通話模式](/zh-TW/nodes/talk)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
