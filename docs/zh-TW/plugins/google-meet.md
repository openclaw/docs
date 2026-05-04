---
read_when:
    - 你想讓 OpenClaw 代理加入 Google Meet 通話
    - 你想讓 OpenClaw 代理建立新的 Google Meet 通話
    - 你正在將 Chrome、Chrome 節點或 Twilio 設定為 Google Meet 傳輸通道
summary: Google Meet Plugin：透過 Chrome 或 Twilio 加入明確指定的 Meet URL，並使用代理程式回話預設值
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-04T02:45:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79d04eb50b157863cce9b03f1195ae01628f21966267485df1e489c843e55826
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet 參與者支援對 OpenClaw 而言是刻意明確設計的 Plugin：

- 它只會加入明確的 `https://meet.google.com/...` URL。
- 它可以透過 Google Meet API 建立新的 Meet 空間，然後加入傳回的
  URL。
- `agent` 是預設的回話模式：即時轉錄會聆聽，已設定的 OpenClaw agent 會回答，而一般 OpenClaw TTS 會在 Meet 中發聲。
- `bidi` 仍可作為備援的直接即時語音模型模式。
- Agents 會用 `mode` 選擇加入行為：使用 `agent` 進行即時
  聆聽/回話，使用 `bidi` 作為直接即時語音備援，或使用 `transcribe`
  加入/控制瀏覽器而不啟用回話橋接。
- 驗證一開始支援個人 Google OAuth，或已登入的 Chrome profile。
- 沒有自動同意宣告。
- 預設 Chrome 音訊後端是 `BlackHole 2ch`。
- Chrome 可以在本機執行，或在已配對的 node host 上執行。
- Twilio 接受撥入號碼，以及選用的 PIN 或 DTMF 序列；它
  無法直接撥打 Meet URL。
- CLI 命令是 `googlemeet`；`meet` 保留給更廣泛的 agent
  電話會議工作流程。

## 快速開始

安裝本機音訊相依項目，並設定即時轉錄
provider 加上一般 OpenClaw TTS。OpenAI 是預設轉錄
provider；Google Gemini Live 也可搭配 `realtime.provider: "google"` 用於
`bidi` 模式：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 會安裝 `BlackHole 2ch` 虛擬音訊裝置。Homebrew 的
安裝程式需要重新開機，macOS 才會公開該裝置：

```bash
sudo reboot
```

重新開機後，驗證兩個部分：

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

設定輸出設計為 agent 可讀且會感知模式。它會回報 Chrome
profile、node 固定，以及針對即時 Chrome 加入，回報 BlackHole/SoX 音訊
橋接與延遲即時開場檢查。若為僅觀察加入，請使用 `--mode transcribe` 檢查相同的
傳輸；該模式會略過即時音訊前置需求，因為它不會透過橋接
聆聽或發聲：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

設定 Twilio 委派時，設定也會回報
`voice-call` Plugin、Twilio 憑證，以及公開 Webhook 暴露是否就緒。
在要求 agent 加入前，請將任何 `ok: false` 檢查視為所檢查傳輸與模式的
阻擋項目。使用 `openclaw googlemeet setup --json` 取得
scripts 或機器可讀輸出。使用 `--transport chrome`、
`--transport chrome-node`，或 `--transport twilio`，在 agent 嘗試前預檢特定
傳輸。

對 Twilio 而言，當預設傳輸是 Chrome 時，請一律明確預檢該傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

這會在 agent 嘗試撥打會議前，捕捉缺少的 `voice-call` 接線、Twilio 憑證，或無法連線的
Webhook 暴露。

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
  "mode": "agent"
}
```

面向 agent 的 `google_meet` 工具在非 macOS host 上仍可用於
artifact、calendar、setup、transcribe、Twilio 和 `chrome-node` 流程。本機
Chrome 回話動作在那些 host 上會被阻擋，因為內建的 Chrome 音訊路徑
目前依賴 macOS `BlackHole 2ch`。在 Linux 上，請使用 `mode: "transcribe"`、
Twilio 撥入，或 macOS `chrome-node` host 進行 Chrome 回話
參與。

建立新會議並加入：

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

對 API 建立的房間，若你希望房間的免敲門政策是明確指定，而不是繼承自 Google
帳戶預設值，請使用 Google Meet `SpaceConfig.accessType`：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` 允許任何持有 Meet URL 的人免敲門加入。`TRUSTED` 允許
host 組織的受信任使用者、受邀的外部使用者，以及撥入使用者
免敲門加入。`RESTRICTED` 將免敲門進入限制為受邀者。這些
設定只適用於官方 Google Meet API 建立路徑，因此必須已設定 OAuth
憑證。

如果你在此選項可用前已驗證 Google Meet，請在將
`meetings.space.settings` scope 加入你的 Google OAuth 同意畫面後，重新執行
`openclaw googlemeet auth login --json`。

只建立 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有兩條路徑：

- API create：在已設定 Google Meet OAuth 憑證時使用。這是
  最具決定性的路徑，且不依賴瀏覽器 UI 狀態。
- Browser fallback：在缺少 OAuth 憑證時使用。OpenClaw 使用
  固定的 Chrome node，開啟 `https://meet.google.com/new`，等待 Google
  重新導向至真正的會議代碼 URL，然後傳回該 URL。此路徑要求
  node 上的 OpenClaw Chrome profile 已登入 Google。
  瀏覽器自動化會處理 Meet 自身的首次執行麥克風提示；該提示
  不會被視為 Google 登入失敗。
  加入與建立流程也會在開啟新分頁前嘗試重用既有 Meet 分頁。
  比對會忽略無害的 URL 查詢字串，例如 `authuser`，因此 agent 重試
  應聚焦已開啟的會議，而不是建立第二個
  Chrome 分頁。

命令/工具輸出包含 `source` 欄位（`api` 或 `browser`），讓 agents
可以說明使用了哪條路徑。`create` 預設會加入新會議，並
傳回 `joined: true` 加上加入 session。若只要產生 URL，請在
CLI 使用 `create --no-join`，或向工具傳入 `"join": false`。

或告訴 agent：「建立一個 Google Meet，用 agent 回話模式加入，
然後把連結傳給我。」agent 應使用
`action: "create"` 呼叫 `google_meet`，然後分享傳回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

若要僅觀察/瀏覽器控制的加入，請設定 `"mode": "transcribe"`。這不會
啟動雙工即時語音橋接，不需要 BlackHole 或 SoX，
也不會在會議中回話。此模式中的 Chrome 加入也會避免
OpenClaw 的麥克風/相機權限授與，並避免 Meet **使用
麥克風** 路徑。若 Meet 顯示音訊選擇插頁，自動化會嘗試
無麥克風路徑，否則回報需要手動操作，而不是開啟
本機麥克風。在 transcribe 模式中，受管理的 Chrome 傳輸也會安裝
盡力而為的 Meet 字幕觀察器。`googlemeet status --json` 和
`googlemeet doctor` 會顯示 `captioning`、`captionsEnabledAttempted`、
`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`
以及簡短的 `recentTranscript` 尾端，讓操作員能判斷瀏覽器
是否已加入通話，以及 Meet 字幕是否正在產生文字。
需要是/否探測時，請使用 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`：
它會以 transcribe 模式加入，等待新的字幕或
轉錄變化，並傳回 `listenVerified`、`listenTimedOut`、手動
操作欄位，以及最新的字幕健康狀態。

在即時 session 期間，`google_meet` status 包含瀏覽器與音訊橋接
健康狀態，例如 `inCall`、`manualActionRequired`、`providerConnected`、
`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後輸入/輸出
時間戳、位元組計數，以及橋接關閉狀態。若出現安全的 Meet 頁面提示，
瀏覽器自動化會在可行時處理。登入、host 准入，以及
瀏覽器/作業系統權限提示會被回報為手動操作，並附上原因與
訊息供 agent 轉述。受管理的 Chrome sessions 只有在瀏覽器健康狀態回報
`inCall: true` 後才會發出開場或測試詞句；否則 status 會回報
`speechReady: false`，且語音嘗試會被阻擋，而不是假裝
agent 已在會議中發聲。

本機 Chrome 透過已登入的 OpenClaw 瀏覽器 profile 加入。即時模式
需要 `BlackHole 2ch` 供 OpenClaw 使用的麥克風/喇叭路徑。為了
乾淨的雙工音訊，請使用分離的虛擬裝置或 Loopback 風格圖形；單一 BlackHole
裝置足以進行第一次煙霧測試，但可能產生回音。

### 本機 Gateway + Parallels Chrome

只為了讓 VM 擁有 Chrome，你**不**需要在 macOS VM 內放完整的 OpenClaw Gateway 或模型 API key。
在本機執行 Gateway 和 agent，然後在 VM 中執行
node host。在 VM 上啟用一次內建 Plugin，讓 node
宣告 Chrome 命令：

各自執行的位置：

- Gateway host：OpenClaw Gateway、agent 工作區、模型/API keys、即時
  provider，以及 Google Meet Plugin 設定。
- Parallels macOS VM：OpenClaw CLI/node host、Google Chrome、SoX、BlackHole 2ch，
  以及已登入 Google 的 Chrome profile。
- VM 中不需要：Gateway service、agent config、OpenAI/GPT key，或模型
  provider 設定。

安裝 VM 相依項目：

```bash
brew install blackhole-2ch sox
```

安裝 BlackHole 後重新啟動 VM，讓 macOS 公開 `BlackHole 2ch`：

```bash
sudo reboot
```

重新開機後，驗證 VM 能看到音訊裝置與 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中安裝或更新 OpenClaw，然後在該處啟用內建 Plugin：

```bash
openclaw plugins enable google-meet
```

在 VM 中啟動 node host：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是 LAN IP，而且你沒有使用 TLS，node 會拒絕
明文 WebSocket，除非你為該受信任的私人網路明確選擇加入：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

安裝 node 作為 LaunchAgent 時，使用相同的環境變數：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是程序環境，而不是
`openclaw.json` 設定。當它出現在安裝命令上時，`openclaw node install`
會把它儲存在 LaunchAgent 環境中。

從 Gateway host 核准 node：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

確認 Gateway 看得到 node，且它宣告了 `googlemeet.chrome`
與瀏覽器 capability/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway host 上透過該 node 路由 Meet：

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

現在從 Gateway host 正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或要求 agent 使用 `google_meet` 工具並指定 `transport: "chrome-node"`。

若要執行單一命令煙霧測試來建立或重用 session、說出已知
詞句，並列印 session 健康狀態：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在 realtime 加入期間，OpenClaw 瀏覽器自動化會填入訪客名稱、點選 Join/Ask to join，並在該提示出現時接受 Meet 首次執行的「Use microphone」選項。在僅觀察加入或僅瀏覽器建立會議期間，當相同提示提供不使用麥克風的選項時，它會繼續通過該提示。如果瀏覽器設定檔尚未登入、Meet 正在等待主持人准入、Chrome 需要 realtime 加入的麥克風/攝影機權限，或 Meet 卡在自動化無法解決的提示上，join/test-speech 結果會回報 `manualActionRequired: true`，並帶有 `manualActionReason` 和 `manualActionMessage`。Agents 應停止重試加入，回報該確切訊息以及目前的 `browserUrl`/`browserTitle`，並且只在手動瀏覽器動作完成後才重試。

如果省略 `chromeNode.node`，OpenClaw 只會在恰好有一個已連線 Node 同時宣告 `googlemeet.chrome` 和瀏覽器控制時自動選取。如果有多個可用 Node 已連線，請將 `chromeNode.node` 設為 Node ID、顯示名稱或遠端 IP。

常見失敗檢查：

- `Configured Google Meet node ... is not usable: offline`：釘選的 Node 已知存在於 Gateway，但目前不可用。Agents 應將該 Node 視為診斷狀態，而不是可用的 Chrome 主機，並回報設定阻礙，而非退回到其他傳輸，除非使用者要求如此。
- `No connected Google Meet-capable node`：在 VM 中啟動 `openclaw node run`，核准配對，並確認已在 VM 中執行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。也請確認 Gateway 主機透過 `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` 允許兩個 Node 命令。
- `BlackHole 2ch audio device not found`：在正在檢查的主機上安裝 `blackhole-2ch`，並在使用本機 Chrome 音訊前重新開機。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安裝 `blackhole-2ch`，並重新啟動 VM。
- Chrome 開啟但無法加入：登入 VM 內的瀏覽器設定檔，或保持設定 `chrome.guestName` 以供訪客加入。訪客自動加入會透過 Node 瀏覽器代理使用 OpenClaw 瀏覽器自動化；請確認 Node 瀏覽器設定指向你想使用的設定檔，例如 `browser.defaultProfile: "user"` 或具名的既有工作階段設定檔。
- 重複的 Meet 分頁：保持啟用 `chrome.reuseExistingTab: true`。OpenClaw 會在開啟新分頁前啟用同一 Meet URL 的既有分頁，而瀏覽器會議建立也會在開啟另一個分頁前重用進行中的 `https://meet.google.com/new` 或 Google 帳戶提示分頁。
- 沒有音訊：在 Meet 中，將麥克風/喇叭路由到 OpenClaw 使用的虛擬音訊裝置路徑；若要乾淨的雙工音訊，請使用分離的虛擬裝置或 Loopback 風格的路由。

## 安裝注意事項

Chrome talk-back 預設使用兩個外部工具：

- `sox`：命令列音訊工具。Plugin 會針對預設的 24 kHz PCM16 音訊橋接使用明確的 CoreAudio 裝置命令。
- `blackhole-2ch`：macOS 虛擬音訊驅動程式。它會建立 `BlackHole 2ch` 音訊裝置，讓 Chrome/Meet 可透過該裝置路由。

OpenClaw 不會綁定或重新散佈任一套件。文件會要求使用者透過 Homebrew 將它們安裝為主機相依項。SoX 採用 `LGPL-2.0-only AND GPL-2.0-only` 授權；BlackHole 採用 GPL-3.0。如果你建置會將 BlackHole 與 OpenClaw 綁定的安裝程式或設備，請檢閱 BlackHole 的上游授權條款，或向 Existential Audio 取得個別授權。

## 傳輸

### Chrome

Chrome 傳輸會透過 OpenClaw 瀏覽器控制開啟 Meet URL，並以已登入的 OpenClaw 瀏覽器設定檔加入。在 macOS 上，Plugin 會在啟動前檢查 `BlackHole 2ch`。如果已設定，它也會在開啟 Chrome 前執行音訊橋接健康狀態命令和啟動命令。當 Chrome/音訊位於 Gateway 主機上時使用 `chrome`；當 Chrome/音訊位於已配對 Node，例如 Parallels macOS VM 上時，使用 `chrome-node`。對於本機 Chrome，使用 `browser.defaultProfile` 選擇設定檔；`chrome.browserProfile` 會傳遞給 `chrome-node` 主機。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

將 Chrome 麥克風和喇叭音訊透過本機 OpenClaw 音訊橋接路由。如果未安裝 `BlackHole 2ch`，加入會以設定錯誤失敗，而不是在沒有音訊路徑的情況下靜默加入。

### Twilio

Twilio 傳輸是委派給 Voice Call Plugin 的嚴格撥號計畫。它不會剖析 Meet 頁面以取得電話號碼。

當 Chrome 參與不可用，或你想要電話撥入備援時使用這個方式。Google Meet 必須為會議公開電話撥入號碼和 PIN；OpenClaw 不會從 Meet 頁面探索這些資訊。

在 Gateway 主機上啟用 Voice Call Plugin，而不是在 Chrome Node 上：

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

透過環境或設定提供 Twilio 憑證。環境變數可讓秘密不進入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

啟用 `voice-call` 後，重新啟動或重新載入 Gateway；Plugin 設定變更在重新載入前，不會出現在已經執行中的 Gateway 程序。

接著驗證：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

當 Twilio 委派已接線時，`googlemeet setup` 會包含成功的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 檢查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

當會議需要自訂序列時，使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和預檢

OAuth 對於建立 Meet 連結是選用的，因為 `googlemeet create` 可退回到瀏覽器自動化。當你想使用官方 API 建立、空間解析或 Meet Media API 預檢時，請設定 OAuth。

Google Meet API 存取使用使用者 OAuth：建立 Google Cloud OAuth 用戶端、要求必要範圍、授權 Google 帳戶，然後將產生的重新整理權杖儲存在 Google Meet Plugin 設定中，或提供 `OPENCLAW_GOOGLE_MEET_*` 環境變數。

OAuth 不會取代 Chrome 加入路徑。當你使用瀏覽器參與時，Chrome 和 Chrome-node 傳輸仍會透過已登入的 Chrome 設定檔、BlackHole/SoX，以及已連線的 Node 加入。OAuth 僅用於官方 Google Meet API 路徑：建立會議空間、解析空間，以及執行 Meet Media API 預檢。

### 建立 Google 憑證

在 Google Cloud Console 中：

1. 建立或選取 Google Cloud 專案。
2. 為該專案啟用 **Google Meet REST API**。
3. 設定 OAuth 同意畫面。
   - **內部** 對 Google Workspace 組織最簡單。
   - **外部** 適用於個人/測試設定；當應用程式處於測試中時，將每個要授權此應用程式的 Google 帳戶新增為測試使用者。
4. 新增 OpenClaw 要求的範圍：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 建立 OAuth 用戶端 ID。
   - 應用程式類型：**網頁應用程式**。
   - 已授權的重新導向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 複製用戶端 ID 和用戶端密鑰。

Google Meet `spaces.create` 需要 `meetings.space.created`。
`meetings.space.readonly` 讓 OpenClaw 將 Meet URL/代碼解析為空間。
`meetings.space.settings` 讓 OpenClaw 在 API 房間建立期間傳遞 `SpaceConfig` 設定，例如 `accessType`。
`meetings.conference.media.readonly` 用於 Meet Media API 預檢和媒體工作；Google 可能會要求加入 Developer Preview，才能實際使用 Media API。
如果你只需要以瀏覽器為基礎的 Chrome 加入，可以完全略過 OAuth。

### 鑄造重新整理權杖

設定 `oauth.clientId`，並可選擇設定 `oauth.clientSecret`，或將它們作為環境變數傳入，然後執行：

```bash
openclaw googlemeet auth login --json
```

該命令會列印含有重新整理權杖的 `oauth` 設定區塊。它使用 PKCE、位於 `http://localhost:8085/oauth2callback` 的 localhost 回呼，以及搭配 `--manual` 的手動複製/貼上流程。

範例：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

當瀏覽器無法到達本機回呼時，使用手動模式：

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

將 `oauth` 物件儲存在 Google Meet Plugin 設定底下：

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

當你不想將重新整理權杖放在設定中時，偏好使用環境變數。如果同時存在設定和環境值，Plugin 會先解析設定，然後才退回環境。

OAuth 同意包含 Meet 空間建立、Meet 空間讀取存取，以及 Meet 會議媒體讀取存取。如果你在會議建立支援存在之前已完成驗證，請重新執行 `openclaw googlemeet auth login --json`，讓重新整理權杖具備 `meetings.space.created` 範圍。

### 使用 doctor 驗證 OAuth

當你想要快速、非秘密的健康檢查時，執行 OAuth doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

這不會載入 Chrome runtime，也不需要已連線的 Chrome Node。它會檢查 OAuth 設定是否存在，以及重新整理權杖是否能鑄造存取權杖。JSON 報告只包含狀態欄位，例如 `ok`、`configured`、`tokenSource`、`expiresAt` 和檢查訊息；它不會列印存取權杖、重新整理權杖或用戶端密鑰。

常見結果：

| 檢查                 | 含義                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加上 `oauth.refreshToken`，或快取的存取權杖。                    |
| `oauth-token`        | 快取的存取權杖仍有效，或重新整理權杖已鑄造新的存取權杖。                               |
| `meet-spaces-get`    | 選用的 `--meeting` 檢查已解析既有 Meet 空間。                                          |
| `meet-spaces-create` | 選用的 `--create-space` 檢查已建立新的 Meet 空間。                                     |

若也要證明 Google Meet API 啟用和 `spaces.create` 範圍，請執行會產生副作用的建立檢查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 會建立一個拋棄式 Meet URL。當你需要確認 Google Cloud 專案已啟用 Meet API，且已授權帳戶具有 `meetings.space.created` 範圍時使用它。

若要證明對現有會議空間的讀取存取權：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 會證明已授權 Google 帳戶可存取的現有空間讀取權限。這些檢查回傳 `403` 通常表示 Google Meet REST API 已停用、已同意的重新整理權杖缺少必要範圍，或 Google 帳戶無法存取該 Meet 空間。重新整理權杖錯誤表示請重新執行 `openclaw googlemeet auth login
--json`，並儲存新的 `oauth` 區塊。

瀏覽器後援不需要 OAuth 憑證。在該模式中，Google 驗證來自所選 Node 上已登入的 Chrome 設定檔，而不是來自 OpenClaw 設定。

接受這些環境變數作為後援：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` or `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` or `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` or
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` or `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` or `GOOGLE_MEET_PREVIEW_ACK`

透過 `spaces.get` 解析 Meet URL、代碼或 `spaces/{id}`：

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

在媒體工作前執行預檢：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

在 Meet 建立會議紀錄後，列出會議產物和出席紀錄：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 時，`artifacts` 和 `attendance` 預設使用最新的會議紀錄。當你想要該會議的每筆保留紀錄時，傳入 `--all-conference-records`。

Calendar 查詢可以在讀取 Meet 產物前，從 Google Calendar 解析會議 URL：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 會搜尋今天的 `primary` 行事曆中含有 Google Meet 連結的 Calendar 事件。使用 `--event <query>` 搜尋相符的事件文字，並用 `--calendar <id>` 指定非主要行事曆。Calendar 查詢需要包含 Calendar events readonly 範圍的新 OAuth 登入。`calendar-events` 會預覽相符的 Meet 事件，並標示 `latest`、`artifacts`、`attendance` 或 `export` 將選擇的事件。

如果你已經知道會議紀錄 ID，請直接指定：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

當你想在通話後關閉房間時，結束 API 建立空間的使用中會議：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

這會呼叫 Google Meet `spaces.endActiveConference`，並且對於已授權帳戶可管理的空間，需要具有 `meetings.space.created` 範圍的 OAuth。OpenClaw 接受 Meet URL、會議代碼或 `spaces/{id}` 輸入，並在結束使用中會議前將其解析為 API 空間資源。它與 `googlemeet leave` 分開：`leave` 會停止 OpenClaw 的本機/工作階段參與，而 `end-active-conference` 會要求 Google Meet 結束該空間的使用中會議。

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

當 Google 為該會議公開時，`artifacts` 會回傳會議紀錄中繼資料，以及參與者、錄影、逐字稿、結構化逐字稿項目和智慧筆記資源中繼資料。大型會議可使用 `--no-transcript-entries` 跳過項目查詢。`attendance` 會將參與者展開為 participant-session 列，包含首次/最後出現時間、總工作階段持續時間、遲到/提早離開旗標，並依已登入使用者或顯示名稱合併重複的參與者資源。傳入 `--no-merge-duplicates` 可讓原始參與者資源保持分開，傳入 `--late-after-minutes` 可調整遲到偵測，傳入 `--early-before-minutes` 可調整提早離開偵測。

`export` 會寫入包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json` 的資料夾。`manifest.json` 會記錄所選輸入、匯出選項、會議紀錄、輸出檔案、計數、權杖來源、使用過的 Calendar 事件，以及任何部分擷取警告。傳入 `--zip` 也會在資料夾旁寫入可攜封存檔。傳入 `--include-doc-bodies` 可透過 Google Drive `files.export` 匯出連結逐字稿和智慧筆記 Google Docs 文字；這需要包含 Drive Meet readonly 範圍的新 OAuth 登入。若沒有 `--include-doc-bodies`，匯出只會包含 Meet 中繼資料和結構化逐字稿項目。如果 Google 回傳部分產物失敗，例如智慧筆記清單、逐字稿項目或 Drive 文件本文錯誤，摘要和 manifest 會保留警告，而不是讓整個匯出失敗。使用 `--dry-run` 可擷取相同的產物/出席資料並列印 manifest JSON，而不建立資料夾或 ZIP。這在寫入大型匯出前，或 agent 只需要計數、所選紀錄和警告時很有用。

Agent 也可以透過 `google_meet` 工具建立相同套件：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

設定 `"dryRun": true` 可只回傳匯出 manifest 並跳過檔案寫入。

Agent 也可以使用明確的存取政策建立 API 支援的房間：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

並且可以結束已知房間的使用中會議：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

對於先聽後驗證，agent 應先使用 `test_listen`，再宣稱會議有用：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

針對真實保留會議執行受保護的即時冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

針對有人會說話且 Meet 字幕可用的會議，執行即時先聽瀏覽器探測：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

即時冒煙測試環境：

- `OPENCLAW_LIVE_TEST=1` 會啟用受保護的即時測試。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代碼或
  `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID` 提供 OAuth
  用戶端 ID。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN` 提供
  重新整理權杖。
- 選用：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用不含 `OPENCLAW_` 前綴的相同後援名稱。

基礎產物/出席紀錄即時冒煙測試需要
`https://www.googleapis.com/auth/meetings.space.readonly` 和
`https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar 查詢需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive 文件本文匯出需要
`https://www.googleapis.com/auth/drive.meet.readonly`。

建立新的 Meet 空間：

```bash
openclaw googlemeet create
```

此命令會列印新的 `meeting uri`、來源和加入工作階段。有 OAuth 憑證時，它會使用官方 Google Meet API。沒有 OAuth 憑證時，它會使用釘選 Chrome Node 的已登入瀏覽器設定檔作為後援。Agent 可以使用 `google_meet` 工具搭配 `action: "create"`，一步建立並加入。若只要建立 URL，請傳入 `"join": false`。

瀏覽器後援的 JSON 輸出範例：

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

如果瀏覽器後援在建立 URL 前遇到 Google 登入或 Meet 權限阻擋，Gateway 方法會回傳失敗回應，而 `google_meet` 工具會回傳結構化詳細資料，而不是純字串：

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

當 agent 看到 `manualActionRequired: true` 時，應回報 `manualActionMessage` 加上瀏覽器 Node/分頁內容，並停止開啟新的 Meet 分頁，直到操作員完成瀏覽器步驟。

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

建立 Meet 預設會加入。Chrome 或 Chrome-node 傳輸仍需要已登入的 Google Chrome 設定檔，才能透過瀏覽器加入。如果設定檔已登出，OpenClaw 會回報 `manualActionRequired: true` 或瀏覽器後援錯誤，並要求操作員完成 Google 登入後再重試。

只有在確認你的 Cloud 專案、OAuth 主體和會議參與者都已加入 Google Workspace Developer Preview Program for Meet media APIs 後，才設定 `preview.enrollmentAcknowledged: true`。

## 設定

常見的 Chrome agent 路徑只需要啟用 Plugin、BlackHole、SoX、即時轉錄提供者金鑰，以及已設定的 OpenClaw TTS 提供者。OpenAI 是預設轉錄提供者；設定 `realtime.provider: "google"` 可在 `bidi` 模式中使用 Google Gemini Live：

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
- `defaultMode: "agent"`（`"realtime"` 只會作為 `"agent"` 的舊版相容別名接受；新的工具呼叫應使用 `"agent"`）
- `chromeNode.node`：`chrome-node` 的選用 node ID／名稱／IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：已登出 Meet 訪客畫面使用的名稱
- `chrome.autoJoin: true`：透過 `chrome-node` 上的 OpenClaw 瀏覽器自動化，盡力填入訪客名稱並點擊立即加入
- `chrome.reuseExistingTab: true`：啟用現有 Meet 分頁，而不是開啟重複分頁
- `chrome.waitForInCallMs: 20000`：等待 Meet 分頁回報已在通話中，然後才觸發回話介紹
- `chrome.audioFormat: "pcm16-24khz"`：命令配對音訊格式。只有仍會發出電話音訊的舊版／自訂命令配對才使用 `"g711-ulaw-8khz"`。
- `chrome.audioBufferBytes: 4096`：產生的 Chrome 命令配對音訊命令所用的 SoX 處理緩衝區。這是 SoX 預設 8192 位元組緩衝區的一半，可降低預設管線延遲，同時保留在繁忙主機上提高該值的空間。低於 SoX 最小值的值會被限制為 17 位元組。
- `chrome.audioInputCommand`：從 CoreAudio `BlackHole 2ch` 讀取並以 `chrome.audioFormat` 寫入音訊的 SoX 命令
- `chrome.audioOutputCommand`：以 `chrome.audioFormat` 讀取音訊並寫入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：選用的本機麥克風命令，在助理播放作用中時寫入有號 16 位元小端序單聲道 PCM，用於偵測人為插話。這目前適用於 Gateway 託管的 `chrome` 命令配對橋接器。
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand` 上計為人為打斷的 RMS 音量
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand` 上計為人為打斷的峰值音量
- `chrome.bargeInCooldownMs: 900`：重複清除人為打斷之間的最短延遲
- `mode: "agent"`：預設回話模式。參與者語音會由設定的即時轉錄提供者轉錄，傳送到每場會議子代理程式工作階段中的已設定 OpenClaw 代理程式，並透過一般 OpenClaw TTS 執行階段回放語音。
- `mode: "bidi"`：備援直接雙向即時模型模式。即時語音提供者會直接回答參與者語音，並且可呼叫 `openclaw_agent_consult` 取得更深入／由工具支援的答案。
- `mode: "transcribe"`：沒有回話橋接器的僅觀察模式。
- `realtime.provider: "openai"`：`agent` 模式用於即時轉錄、`bidi` 模式用於即時語音的提供者 ID。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：簡短語音回覆，並使用 `openclaw_agent_consult` 取得更深入的答案
- `realtime.introMessage`：即時橋接器連線時的簡短語音就緒檢查；將它設為 `""` 可安靜加入
- `realtime.agentId`：`openclaw_agent_consult` 的選用 OpenClaw 代理程式 ID；預設為 `main`

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
  defaultMode: "agent",
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

`voiceCall.enabled` 預設為 `true`；使用 Twilio 傳輸時，它會將實際 PSTN 通話、DTMF 和介紹問候委派給 Voice Call Plugin。Voice Call 會在開啟即時媒體串流前播放 DTMF 序列，然後使用已儲存的介紹文字作為初始即時問候。如果未啟用 `voice-call`，Google Meet 仍可驗證並記錄撥號計畫，但無法撥出 Twilio 通話。

## 工具

代理程式可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

當 Chrome 在 Gateway 主機上執行時，使用 `transport: "chrome"`。當 Chrome 在已配對 node（例如 Parallels VM）上執行時，使用 `transport: "chrome-node"`。在兩種情況下，模型提供者和 `openclaw_agent_consult` 都會在 Gateway 主機上執行，因此模型憑證會留在那裡。使用預設 `mode: "agent"` 時，即時轉錄提供者會負責聆聽，已設定的 OpenClaw 代理程式會產生答案，而一般 OpenClaw TTS 會將其朗讀到 Meet 中。當你想讓即時語音模型直接回答時，使用 `mode: "bidi"`。
原始 `mode: "realtime"` 仍會作為 `mode: "agent"` 的舊版相容別名接受，但不再於代理程式工具結構描述中宣傳。

使用 `action: "status"` 可列出作用中的工作階段或檢查工作階段 ID。使用帶有 `sessionId` 和 `message` 的 `action: "speak"` 可讓即時代理程式立即說話。使用 `action: "test_speech"` 可建立或重用工作階段、觸發已知片語，並在 Chrome 主機可回報時傳回 `inCall` 健康狀態。`test_speech` 一律強制使用 `mode: "agent"`，如果要求它在 `mode: "transcribe"` 中執行則會失敗，因為僅觀察工作階段刻意不能發出語音。其 `speechOutputVerified` 結果會根據此測試呼叫期間即時音訊輸出位元組是否增加，因此含有較舊音訊的重用工作階段不會計為新的成功語音檢查。使用 `action: "leave"` 可將工作階段標記為已結束。

可用時，`status` 會包含 Chrome 健康狀態：

- `inCall`：Chrome 似乎位於 Meet 通話中
- `micMuted`：盡力取得的 Meet 麥克風狀態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：瀏覽器設定檔需要手動登入、Meet 主持人允許加入、權限，或瀏覽器控制修復，語音才能運作
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：受管理的 Chrome 語音現在是否允許。`speechReady: false` 表示 OpenClaw 未將介紹／測試片語送入音訊橋接器。
- `providerConnected` / `realtimeReady`：即時語音橋接器狀態
- `lastInputAt` / `lastOutputAt`：橋接器最後看到或傳送的音訊
- `audioOutputRouted` / `audioOutputDeviceLabel`：Meet 分頁的媒體輸出是否已主動路由到橋接器使用的 BlackHole 裝置
- `lastSuppressedInputAt` / `suppressedInputBytes`：助理播放作用中時被忽略的回送輸入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 代理程式與 Bidi 模式

Chrome `agent` 模式針對「我的代理程式在會議中」的行為最佳化。即時轉錄提供者會聽取會議音訊，最終參與者逐字稿會路由到已設定的 OpenClaw 代理程式，而答案會透過一般 OpenClaw TTS 執行階段朗讀。當你想讓即時語音模型直接回答時，設定 `mode: "bidi"`。
鄰近的最終逐字稿片段會在諮詢前合併，讓一個語音回合不會產生數個過時的部分答案。排入佇列的助理音訊仍在播放時，也會抑制即時輸入，而且在代理程式諮詢前會忽略最近類似助理的逐字稿回音，避免 BlackHole 回送讓代理程式回答自己的語音。

| 模式    | 誰決定答案        | 語音輸出路徑                     | 使用時機                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 已設定的 OpenClaw 代理程式 | 一般 OpenClaw TTS 執行階段            | 你想要「我的代理程式在會議中」的行為        |
| `bidi`  | 即時語音模型      | 即時語音提供者音訊回應 | 你想要最低延遲的對話式語音迴圈 |

在 `bidi` 模式中，當即時模型需要更深入推理、目前資訊，或一般 OpenClaw 工具時，它可以呼叫 `openclaw_agent_consult`。

諮詢工具會在幕後使用最近的會議逐字稿內容脈絡執行一般 OpenClaw 代理程式，並傳回簡潔的語音答案。在 `agent` 模式中，OpenClaw 會將該答案直接傳送到 TTS 執行階段；在 `bidi` 模式中，即時語音模型可以將諮詢結果說回會議中。它使用與 Voice Call 相同的共用諮詢機制。

預設情況下，諮詢會針對 `main` 代理程式執行。當 Meet 通道應諮詢專用的 OpenClaw 代理程式工作區、模型預設值、工具政策、記憶體和工作階段歷史時，設定 `realtime.agentId`。

代理程式模式諮詢會使用每場會議的 `agent:<id>:subagent:google-meet:<session>` 工作階段金鑰，讓後續問題保留會議脈絡，同時繼承已設定代理程式的一般代理程式政策。

`realtime.toolPolicy` 控制諮詢執行：

- `safe-read-only`：公開諮詢工具，並將一般代理程式限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：公開諮詢工具，並讓一般代理程式使用一般代理程式工具政策。
- `none`：不要向即時語音模型公開諮詢工具。

諮詢工作階段金鑰會依 Meet 工作階段限定範圍，因此後續諮詢呼叫可在同一場會議期間重用先前的諮詢脈絡。

若要在 Chrome 完全加入通話後強制執行語音就緒檢查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整加入並說話的煙霧測試：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 即時測試檢查清單

將會議交給無人值守代理程式前，使用此序列：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

預期的 Chrome-node 狀態：

- `googlemeet setup` 全部為綠色。
- 當 Chrome-node 是預設傳輸或已釘選 node 時，`googlemeet setup` 會包含 `chrome-node-connected`。
- `nodes status` 顯示選取的 node 已連線。
- 選取的 node 會宣告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 分頁加入通話，且 `test-speech` 傳回含有 `inCall: true` 的 Chrome 健康狀態。

對於遠端 Chrome 主機（例如 Parallels macOS VM），這是在更新 Gateway 或 VM 後最短的安全檢查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

這會在代理程式開啟真正的會議分頁前，證明 Gateway Plugin 已載入、VM node 已使用目前權杖連線，且 Meet 音訊橋接器可用。

若要進行 Twilio 煙霧測試，請使用會公開電話撥入詳細資料的會議：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

預期的 Twilio 狀態：

- `googlemeet setup` 包含綠色的 `twilio-voice-call-plugin`、
  `twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 檢查。
- Gateway 重新載入後，`voicecall` 可在 CLI 中使用。
- 傳回的工作階段有 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 顯示 DTMF TwiML 先於即時 TwiML 提供，接著是
  已排入初始問候語的即時橋接。
- `googlemeet leave <sessionId>` 會掛斷委派的語音通話。

## 疑難排解

### Agent 看不到 Google Meet 工具

確認 Plugin 已在 Gateway 設定中啟用，並重新載入 Gateway：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你剛編輯了 `plugins.entries.google-meet`，請重新啟動或重新載入 Gateway。
執行中的 agent 只會看到目前 Gateway 行程註冊的 Plugin 工具。

在非 macOS Gateway 主機上，面向 agent 的 `google_meet` 工具仍會保持可見，
但本機 Chrome 回話動作會在抵達音訊橋接前被封鎖。本機 Chrome 回話音訊目前依賴
macOS `BlackHole 2ch`，因此 Linux agent 應使用 `mode: "transcribe"`、Twilio 撥入，
或 macOS `chrome-node` 主機，而不是預設的本機 Chrome agent 路徑。

### 沒有已連線且支援 Google Meet 的 Node

在 Node 主機上執行：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 主機上，核准 Node 並驗證命令：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node 必須已連線，並列出 `googlemeet.chrome` 加上 `browser.proxy`。
Gateway 設定必須允許這些 Node 命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 的 `chrome-node-connected` 失敗，或 Gateway 記錄回報
`gateway token mismatch`，請使用目前的 Gateway token 重新安裝或重新啟動 Node。
對 LAN Gateway 而言，這通常表示：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

然後重新載入 Node 服務並重新執行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 瀏覽器開啟但 agent 無法加入

對僅觀察加入執行 `googlemeet test-listen`，或對即時加入執行 `googlemeet test-speech`，
然後檢查傳回的 Chrome 健康狀態。如果任一探測回報 `manualActionRequired: true`，
請向操作員顯示 `manualActionMessage`，並停止重試直到瀏覽器動作完成。

常見手動動作：

- 登入 Chrome 設定檔。
- 從 Meet 主持帳戶准許訪客加入。
- 當 Chrome 原生權限提示出現時，授予 Chrome 麥克風/攝影機權限。
- 關閉或修復卡住的 Meet 權限對話框。

不要只因為 Meet 顯示「你想讓會議中的人聽到你的聲音嗎？」就回報「未登入」。
那是 Meet 的音訊選擇中介頁；OpenClaw 會在可用時透過瀏覽器自動化點選
**使用麥克風**，並持續等待真正的會議狀態。對於僅建立的瀏覽器備援，
OpenClaw 可能會點選 **不使用麥克風繼續**，因為建立 URL 不需要即時音訊路徑。

### 會議建立失敗

`googlemeet create` 會在已設定 OAuth 認證時，先使用 Google Meet API
`spaces.create` 端點。沒有 OAuth 認證時，會退回使用釘選的 Chrome Node 瀏覽器。
請確認：

- 對 API 建立：已設定 `oauth.clientId` 和 `oauth.refreshToken`，
  或存在相符的 `OPENCLAW_GOOGLE_MEET_*` 環境變數。
- 對 API 建立：重新整理 token 是在新增建立支援後產生的。較舊的 token 可能缺少
  `meetings.space.created` scope；請重新執行 `openclaw googlemeet auth login --json`
  並更新 Plugin 設定。
- 對瀏覽器備援：`defaultTransport: "chrome-node"`，且
  `chromeNode.node` 指向已連線並具有 `browser.proxy` 和
  `googlemeet.chrome` 的 Node。
- 對瀏覽器備援：該 Node 上的 OpenClaw Chrome 設定檔已登入 Google，
  並可開啟 `https://meet.google.com/new`。
- 對瀏覽器備援：重試會先重用既有的 `https://meet.google.com/new`
  或 Google 帳戶提示分頁，再開啟新分頁。如果 agent 逾時，請重試工具呼叫，
  而不是手動開啟另一個 Meet 分頁。
- 對瀏覽器備援：如果工具傳回 `manualActionRequired: true`，請使用傳回的
  `browser.nodeId`、`browser.targetId`、`browserUrl` 和
  `manualActionMessage` 來引導操作員。在該動作完成前，不要迴圈重試。
- 對瀏覽器備援：如果 Meet 顯示「你想讓會議中的人聽到你的聲音嗎？」，請保持分頁開啟。
  OpenClaw 應透過瀏覽器自動化點選 **使用麥克風**，或在僅建立備援時點選
  **不使用麥克風繼續**，並持續等待產生的 Meet URL。如果無法做到，
  錯誤應提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### Agent 加入但不說話

檢查即時路徑：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "agent"` 作為一般 STT -> OpenClaw agent -> TTS 回話路徑，
或使用 `mode: "bidi"` 作為直接即時語音備援。`mode: "transcribe"`
刻意不啟動回話橋接。對僅觀察除錯，請在參與者發言後執行
`openclaw googlemeet status --json <session-id>`，並檢查 `captioning`、
`transcriptLines` 和 `lastCaptionText`。如果 `inCall` 為 true，但
`transcriptLines` 維持 `0`，可能是 Meet 字幕已停用、觀察者安裝後沒有人發言、
Meet UI 已變更，或該會議語言/帳戶無法使用即時字幕。

`googlemeet test-speech` 一律檢查即時路徑，並回報該次叫用是否觀察到橋接輸出位元組。
如果 `speechOutputVerified` 為 false 且 `speechOutputTimedOut` 為 true，
即時提供者可能已接受語句，但 OpenClaw 沒有看到新的輸出位元組抵達 Chrome 音訊橋接。

也請驗證：

- Gateway 主機上有可用的即時提供者金鑰，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- `BlackHole 2ch` 在 Chrome 主機上可見。
- `sox` 存在於 Chrome 主機上。
- Meet 麥克風與喇叭已透過 OpenClaw 使用的虛擬音訊路徑路由。
  對本機 Chrome 即時加入，`doctor` 應顯示 `meet output routed: yes`。

`googlemeet doctor [session-id]` 會列印工作階段、Node、通話中狀態、
手動動作原因、即時提供者連線、`realtimeReady`、音訊輸入/輸出活動、
最後音訊時間戳記、位元組計數器，以及瀏覽器 URL。需要原始 JSON 時，
請使用 `googlemeet status [session-id] --json`。需要在不暴露 token 的情況下
驗證 Google Meet OAuth 重新整理時，請使用 `googlemeet doctor --oauth`；
若也需要 Google Meet API 證明，請加上 `--meeting` 或 `--create-space`。

如果 agent 逾時，而你可以看到已開啟的 Meet 分頁，請檢查該分頁，不要再開另一個：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具動作是 `recover_current_tab`。它會聚焦並檢查所選傳輸的既有 Meet 分頁。
使用 `chrome` 時，它會透過 Gateway 使用本機瀏覽器控制；使用 `chrome-node` 時，
它會使用已設定的 Chrome Node。它不會開啟新分頁或建立新工作階段；它會回報目前阻礙，
例如登入、准入、權限或音訊選擇狀態。CLI 命令會與已設定的 Gateway 通訊，
因此 Gateway 必須正在執行；`chrome-node` 也需要 Chrome Node 已連線。

### Twilio 設定檢查失敗

當 `voice-call` 未被允許或未啟用時，`twilio-voice-call-plugin` 會失敗。
將它加入 `plugins.allow`、啟用 `plugins.entries.voice-call`，並重新載入 Gateway。

當 Twilio 後端缺少帳戶 SID、auth token 或來電號碼時，
`twilio-voice-call-credentials` 會失敗。請在 Gateway 主機上設定這些項目：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

當 `voice-call` 沒有公開 Webhook 暴露，或 `publicUrl` 指向 loopback 或私有網路空間時，
`twilio-voice-call-webhook` 會失敗。請將
`plugins.entries.voice-call.config.publicUrl` 設為公開提供者 URL，
或設定 `voice-call` tunnel/Tailscale 暴露。

Loopback 和私有 URL 不能用於電信業者 callback。不要使用 `localhost`、`127.0.0.1`、
`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、
`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

對穩定的公開 URL：

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

對本機開發，請使用 tunnel 或 Tailscale 暴露，而不是私有主機 URL：

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

然後重新啟動或重新載入 Gateway 並執行：

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 預設只檢查就緒狀態。若要對特定號碼做 dry-run：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你刻意想撥出即時外撥通知通話時，才加上 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話開始但從未進入會議

確認 Meet 事件公開電話撥入詳細資料。傳入精確的撥入號碼與 PIN，或自訂 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供者需要在輸入 PIN 前暫停，請在 `--dtmf-sequence` 中使用前置 `w` 或逗號。

如果電話通話已建立，但 Meet 名單從未顯示撥入參與者：

- 執行 `openclaw googlemeet doctor <session-id>` 以確認委派的 Twilio
  通話 ID、DTMF 是否已排入佇列，以及是否已要求開場問候。
- 執行 `openclaw voicecall status --call-id <id>` 並確認通話仍然
  啟用中。
- 執行 `openclaw voicecall tail` 並檢查 Twilio Webhook 是否正抵達
  Gateway。
- 執行 `openclaw logs --follow` 並尋找 Twilio Meet 序列：Google
  Meet 委派加入、Voice Call 啟動電話端、Google Meet 等待
  `voiceCall.dtmfDelayMs`、使用 `voicecall.dtmf` 傳送 DTMF、等待
  `voiceCall.postDtmfSpeechDelayMs`，然後使用
  `voicecall.speak` 要求開場語音。
- 重新執行 `openclaw googlemeet setup --transport twilio`；必須有綠色的設定檢查，
  但這不證明會議 PIN 序列正確。
- 確認撥入號碼屬於與 PIN 相同的 Meet 邀請和區域。
- 如果 Meet 回應緩慢，或通話轉錄在 DTMF 已傳送後仍顯示要求輸入 PIN 的提示，
  請增加 `voiceCall.dtmfDelayMs`。
- 如果參與者加入但你沒有聽到問候，請檢查
  `openclaw logs --follow` 中 DTMF 後的 `voicecall.speak` 要求，以及
  媒體串流 TTS 播放或 Twilio `<Say>` 備援。如果通話轉錄仍包含
  "enter the meeting PIN"，表示電話端尚未加入 Meet 房間，因此會議參與者不會聽到語音。

如果 Webhook 沒有抵達，請先偵錯 Voice Call Plugin：提供者必須能夠
連到 `plugins.entries.voice-call.config.publicUrl` 或已設定的通道。
請參閱[語音通話疑難排解](/zh-TW/plugins/voice-call#troubleshooting)。

## 備註

Google Meet 的官方媒體 API 以接收為主，因此要在 Meet
通話中說話仍需要參與者路徑。此 Plugin 會讓該邊界保持可見：
Chrome 處理瀏覽器參與和本機音訊路由；Twilio 處理電話撥入參與。

Chrome 回話模式需要 `BlackHole 2ch` 加上以下其中一項：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 擁有
  橋接，並在這些命令與所選提供者之間以 `chrome.audioFormat` 傳送音訊。
  Agent 模式使用即時轉錄加上一般 TTS；
  bidi 模式使用即時語音提供者。預設 Chrome 路徑是 24 kHz
  PCM16，並使用 `chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 仍可供
  舊版命令配對使用。
- `chrome.audioBridgeCommand`：外部橋接命令擁有整個本機
  音訊路徑，且必須在啟動或驗證其常駐程式後結束。這只對
  `bidi` 有效，因為 `agent` 模式需要直接的命令配對存取權來使用 TTS。

若要取得乾淨的雙工音訊，請將 Meet 輸出和 Meet 麥克風路由到不同的
虛擬裝置，或使用 Loopback 風格的虛擬裝置圖。單一共用的
BlackHole 裝置可能會把其他參與者的聲音回音回通話中。

使用命令配對 Chrome 橋接時，`chrome.bargeInInputCommand` 可以監聽
另一個本機麥克風，並在人類開始說話時清除助理播放。
即使共用的 BlackHole loopback 輸入在助理播放期間暫時受到抑制，
這仍可讓人類語音優先於助理輸出。
和 `chrome.audioInputCommand` 與 `chrome.audioOutputCommand` 一樣，它是
操作員設定的本機命令。請使用明確且受信任的命令路徑或
引數清單，且不要將它指向不受信任位置的指令碼。

`googlemeet speak` 會觸發 Chrome
工作階段的啟用中回話音訊橋接。`googlemeet leave` 會停止該橋接。對於透過
Voice Call Plugin 委派的 Twilio 工作階段，`leave` 也會掛斷底層語音通話。
當你也想關閉 API 管理空間中啟用中的
Google Meet 會議時，請使用 `googlemeet end-active-conference`。

## 相關

- [Voice Call Plugin](/zh-TW/plugins/voice-call)
- [Talk 模式](/zh-TW/nodes/talk)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
