---
read_when:
    - 您希望 OpenClaw 代理加入 Google Meet 通話
    - 您想讓 OpenClaw 代理程式建立新的 Google Meet 通話
    - 您正在將 Chrome、Chrome 節點或 Twilio 設定為 Google Meet 傳輸方式
summary: Google Meet Plugin：透過 Chrome 或 Twilio 加入明確指定的 Meet URL，並提供代理程式回話預設值
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-04T07:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw 的 Google Meet 參與者支援是刻意設計成明確操作的 Plugin：

- 它只會加入明確的 `https://meet.google.com/...` URL。
- 它可以透過 Google Meet API 建立新的 Meet 空間，然後加入傳回的 URL。
- `agent` 是預設的回話模式：即時轉錄會聆聽，已設定的 OpenClaw 代理會回答，且一般 OpenClaw TTS 會在 Meet 中發聲。
- `bidi` 仍可作為備用的直接即時語音模型模式。
- 代理透過 `mode` 選擇加入行為：使用 `agent` 進行即時聆聽/回話，使用 `bidi` 作為直接即時語音備援，或使用 `transcribe` 加入/控制瀏覽器而不啟用回話橋接。
- 驗證一開始使用個人 Google OAuth，或已登入的 Chrome 設定檔。
- 不會自動宣告同意聲明。
- 預設的 Chrome 音訊後端是 `BlackHole 2ch`。
- Chrome 可以在本機執行，或在已配對的 Node 主機上執行。
- Twilio 接受撥入號碼加上選用的 PIN 或 DTMF 序列；它無法直接撥打 Meet URL。
- CLI 命令是 `googlemeet`；`meet` 保留給更廣泛的代理電話會議工作流程。

## 快速開始

安裝本機音訊相依項，並設定即時轉錄提供者以及一般 OpenClaw TTS。OpenAI 是預設轉錄提供者；Google Gemini Live 也可作為獨立的 `bidi` 語音備援，並搭配 `realtime.voiceProvider: "google"` 使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` 會安裝 `BlackHole 2ch` 虛擬音訊裝置。Homebrew 的安裝程式需要重新開機，macOS 才會公開該裝置：

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

設定輸出設計為可供代理讀取，且會感知模式。它會回報 Chrome 設定檔、Node 固定狀態，以及針對即時 Chrome 加入流程的 BlackHole/SoX 音訊橋接與延遲即時開場檢查。若是僅觀察加入，請使用 `--mode transcribe` 檢查相同傳輸；該模式會略過即時音訊前置需求，因為它不會透過橋接聆聽或發聲：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

設定 Twilio 委派時，設定也會回報 `voice-call` Plugin、Twilio 認證，以及公開 Webhook 暴露是否已就緒。在要求代理加入前，請將任何 `ok: false` 檢查視為所檢查傳輸與模式的阻斷問題。若要供腳本或機器讀取輸出，請使用 `openclaw googlemeet setup --json`。若要在代理嘗試前預先檢查特定傳輸，請使用 `--transport chrome`、`--transport chrome-node` 或 `--transport twilio`。

對於 Twilio，當預設傳輸為 Chrome 時，一律明確預先檢查該傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

這會在代理嘗試撥入會議前，捕捉缺少的 `voice-call` 接線、Twilio 認證，或無法連線的 Webhook 暴露。

加入會議：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或讓代理透過 `google_meet` 工具加入：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

面向代理的 `google_meet` 工具在非 macOS 主機上仍可用於成品、行事曆、設定、轉錄、Twilio，以及 `chrome-node` 流程。本機 Chrome 回話動作在這些主機上會被阻擋，因為隨附的 Chrome 音訊路徑目前依賴 macOS `BlackHole 2ch`。在 Linux 上，請使用 `mode: "transcribe"`、Twilio 撥入，或使用 macOS `chrome-node` 主機進行 Chrome 回話參與。

建立新會議並加入：

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

針對 API 建立的房間，若想讓房間的免敲門政策明確設定，而不是繼承 Google 帳戶預設值，請使用 Google Meet `SpaceConfig.accessType`：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` 允許任何持有 Meet URL 的人免敲門加入。`TRUSTED` 允許主辦機構的受信任使用者、受邀外部使用者，以及撥入使用者免敲門加入。`RESTRICTED` 將免敲門進入限制為受邀者。這些設定只適用於官方 Google Meet API 建立路徑，因此必須設定 OAuth 認證。

如果你在此選項可用前已驗證 Google Meet，請在 Google OAuth 同意畫面加入 `meetings.space.settings` 範圍後，重新執行 `openclaw googlemeet auth login --json`。

只建立 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有兩條路徑：

- API 建立：在已設定 Google Meet OAuth 認證時使用。這是最具確定性的路徑，且不依賴瀏覽器 UI 狀態。
- 瀏覽器備援：在缺少 OAuth 認證時使用。OpenClaw 會使用固定的 Chrome Node，開啟 `https://meet.google.com/new`，等待 Google 重新導向至實際的會議代碼 URL，然後傳回該 URL。此路徑要求 Node 上的 OpenClaw Chrome 設定檔已登入 Google。瀏覽器自動化會處理 Meet 自己的首次執行麥克風提示；該提示不會被視為 Google 登入失敗。
  加入與建立流程也會先嘗試重用既有 Meet 分頁，再開啟新分頁。比對時會忽略無害的 URL 查詢字串，例如 `authuser`，因此代理重試時應該聚焦已開啟的會議，而不是建立第二個 Chrome 分頁。

命令/工具輸出包含 `source` 欄位（`api` 或 `browser`），因此代理可以說明使用了哪條路徑。`create` 預設會加入新會議，並傳回 `joined: true` 加上加入工作階段。若只要產生 URL，請在 CLI 使用 `create --no-join`，或向工具傳入 `"join": false`。

或告訴代理：「建立一個 Google Meet，用代理回話模式加入，並把連結傳給我。」代理應呼叫 `google_meet`，使用 `action: "create"`，然後分享傳回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

若要僅觀察/瀏覽器控制加入，請設定 `"mode": "transcribe"`。這不會啟動雙工即時語音橋接，不需要 BlackHole 或 SoX，也不會在會議中回話。此模式下的 Chrome 加入也會避免 OpenClaw 的麥克風/相機權限授予，並避免 Meet **使用麥克風** 路徑。如果 Meet 顯示音訊選擇插頁，自動化會嘗試無麥克風路徑，否則會回報手動動作，而不是開啟本機麥克風。在轉錄模式中，受管理的 Chrome 傳輸也會盡力安裝 Meet 字幕觀察器。`googlemeet status --json` 和 `googlemeet doctor` 會公開 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`，以及簡短的 `recentTranscript` 尾端，讓操作者能判斷瀏覽器是否已加入通話，以及 Meet 字幕是否正在產生文字。
當你需要是/否探測時，請使用 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`：它會以轉錄模式加入，等待新的字幕或轉錄活動，並傳回 `listenVerified`、`listenTimedOut`、手動動作欄位，以及最新字幕健康狀態。

在即時工作階段期間，`google_meet` 狀態包含瀏覽器與音訊橋接健康狀態，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後輸入/輸出時間戳記、位元組計數器，以及橋接關閉狀態。如果出現安全的 Meet 頁面提示，瀏覽器自動化會在可行時處理。登入、主辦人准入，以及瀏覽器/作業系統權限提示會以手動動作回報，並附上原因與訊息，供代理轉述。受管理的 Chrome 工作階段只會在瀏覽器健康狀態回報 `inCall: true` 後發出開場白或測試片語；否則狀態會回報 `speechReady: false`，且語音嘗試會被阻擋，而不是假裝代理已在會議中發聲。

本機 Chrome 會透過已登入的 OpenClaw 瀏覽器設定檔加入。即時模式需要 `BlackHole 2ch`，用於 OpenClaw 使用的麥克風/喇叭路徑。若要取得乾淨的雙工音訊，請使用分離的虛擬裝置或 Loopback 風格的圖形；單一 BlackHole 裝置足以進行第一次煙霧測試，但可能會產生回音。

### 本機 Gateway + Parallels Chrome

若只是要讓 VM 擁有 Chrome，你**不**需要在 macOS VM 內執行完整的 OpenClaw Gateway 或模型 API 金鑰。請在本機執行 Gateway 和代理，然後在 VM 中執行 Node 主機。在 VM 上啟用隨附的 Plugin 一次，讓 Node 宣告 Chrome 命令：

各處執行內容：

- Gateway 主機：OpenClaw Gateway、代理工作區、模型/API 金鑰、即時提供者，以及 Google Meet Plugin 設定。
- Parallels macOS VM：OpenClaw CLI/Node 主機、Google Chrome、SoX、BlackHole 2ch，以及已登入 Google 的 Chrome 設定檔。
- VM 中不需要：Gateway 服務、代理設定、OpenAI/GPT 金鑰，或模型提供者設定。

安裝 VM 相依項：

```bash
brew install blackhole-2ch sox
```

安裝 BlackHole 後重新啟動 VM，讓 macOS 公開 `BlackHole 2ch`：

```bash
sudo reboot
```

重新開機後，驗證 VM 能看見音訊裝置與 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中安裝或更新 OpenClaw，然後在其中啟用隨附的 Plugin：

```bash
openclaw plugins enable google-meet
```

在 VM 中啟動 Node 主機：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是 LAN IP，且你沒有使用 TLS，除非你針對該受信任私人網路選擇加入，否則 Node 會拒絕純文字 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

將 Node 安裝為 LaunchAgent 時，使用相同環境變數：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是程序環境，而不是 `openclaw.json` 設定。當它存在於安裝命令中時，`openclaw node install` 會將它儲存在 LaunchAgent 環境。

從 Gateway 主機核准該 Node：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

確認 Gateway 看得到該 Node，且它宣告了 `googlemeet.chrome` 與瀏覽器能力/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway 主機上將 Meet 路由到該 Node：

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

或要求代理使用 `google_meet` 工具並設定 `transport: "chrome-node"`。

若要進行單一命令煙霧測試來建立或重用工作階段、說出已知片語，並列印工作階段健康狀態：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在即時加入期間，OpenClaw 瀏覽器自動化會填入來賓名稱、點選
Join/Ask to join，並在出現提示時接受 Meet 初次執行的「Use microphone」選項。在僅觀察加入或僅瀏覽器建立會議期間，
當相同提示提供不使用麥克風的選項時，它會在不啟用麥克風的情況下繼續。
如果瀏覽器設定檔尚未登入、Meet 正在等待主持人核准、
Chrome 需要即時加入的麥克風/相機權限，或 Meet 卡在自動化無法處理的提示上，
加入/test-speech 結果會回報
`manualActionRequired: true`，並附上 `manualActionReason` 和
`manualActionMessage`。代理應停止重試加入，回報該確切訊息以及目前的
`browserUrl`/`browserTitle`，並且只在手動瀏覽器動作完成後才重試。

如果省略 `chromeNode.node`，OpenClaw 只會在剛好有一個已連線節點同時宣告
`googlemeet.chrome` 和瀏覽器控制時自動選取。如果有多個具備能力的節點已連線，
請將 `chromeNode.node` 設為節點 ID、顯示名稱或遠端 IP。

常見失敗檢查：

- `Configured Google Meet node ... is not usable: offline`：固定的節點已由
  Gateway 知道，但目前不可用。代理應將該節點視為診斷狀態，而不是可用的 Chrome 主機，
  並回報設定阻礙；除非使用者要求，否則不要改用其他傳輸方式。
- `No connected Google Meet-capable node`：在 VM 中啟動 `openclaw node run`，
  核准配對，並確認已在 VM 中執行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。也請確認 Gateway 主機允許這兩個節點命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被檢查的主機上安裝 `blackhole-2ch`，
  並在使用本機 Chrome 音訊前重新開機。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安裝 `blackhole-2ch`
  並重新啟動 VM。
- Chrome 開啟但無法加入：登入 VM 內的瀏覽器設定檔，或保持設定
  `chrome.guestName` 以便來賓加入。來賓自動加入會透過節點瀏覽器 Proxy 使用
  OpenClaw 瀏覽器自動化；請確認節點瀏覽器設定指向你想要的設定檔，例如
  `browser.defaultProfile: "user"` 或具名的既有工作階段設定檔。
- 重複的 Meet 分頁：保持啟用 `chrome.reuseExistingTab: true`。OpenClaw 會在開啟新分頁前，
  先啟用相同 Meet URL 的既有分頁；瀏覽器會議建立也會在開啟另一個分頁前，
  重用進行中的 `https://meet.google.com/new` 或 Google 帳戶提示分頁。
- 無音訊：在 Meet 中，將麥克風/喇叭音訊路由到 OpenClaw 使用的虛擬音訊裝置路徑；
  使用分離的虛擬裝置或 Loopback 風格路由，以取得乾淨的雙工音訊。

## 安裝注意事項

Chrome talk-back 預設使用兩個外部工具：

- `sox`：命令列音訊工具。Plugin 使用明確的 CoreAudio 裝置命令，作為預設 24 kHz PCM16 音訊橋接。
- `blackhole-2ch`：macOS 虛擬音訊驅動程式。它會建立 Chrome/Meet 可路由通過的
  `BlackHole 2ch` 音訊裝置。

OpenClaw 不內建或重新散布任一套件。文件要求使用者透過 Homebrew 將它們安裝為主機相依項。
SoX 採用 `LGPL-2.0-only AND GPL-2.0-only` 授權；BlackHole 採用 GPL-3.0。
如果你建置的安裝程式或裝置將 BlackHole 與 OpenClaw 一起打包，請檢閱 BlackHole 的上游授權條款，
或向 Existential Audio 取得個別授權。

## 傳輸

### Chrome

Chrome 傳輸會透過 OpenClaw 瀏覽器控制開啟 Meet URL，並以已登入的 OpenClaw 瀏覽器設定檔加入。
在 macOS 上，Plugin 會在啟動前檢查 `BlackHole 2ch`。如果已設定，它也會在開啟 Chrome 前執行音訊橋接健康狀態命令和啟動命令。
當 Chrome/音訊位於 Gateway 主機上時使用 `chrome`；當 Chrome/音訊位於已配對節點（例如 Parallels macOS VM）上時使用
`chrome-node`。對於本機 Chrome，使用 `browser.defaultProfile` 選擇設定檔；
`chrome.browserProfile` 會傳遞給 `chrome-node` 主機。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

將 Chrome 麥克風和喇叭音訊路由通過本機 OpenClaw 音訊橋接。
如果未安裝 `BlackHole 2ch`，加入會以設定錯誤失敗，而不是在沒有音訊路徑的情況下靜默加入。

### Twilio

Twilio 傳輸是委派給 Voice Call Plugin 的嚴格撥號計畫。
它不會解析 Meet 頁面以取得電話號碼。

當 Chrome 參與不可用，或你想要電話撥入後備方式時使用這個選項。
Google Meet 必須為該會議公開電話撥入號碼和 PIN；OpenClaw 不會從 Meet 頁面探索這些資訊。

在 Gateway 主機上啟用 Voice Call Plugin，而不是在 Chrome 節點上：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

透過環境或設定提供 Twilio 認證。環境變數可讓秘密不進入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

如果那是你的即時語音供應者，請改用 OpenAI provider Plugin 搭配
`OPENAI_API_KEY`，並設定 `realtime.provider: "openai"`。

啟用 `voice-call` 後重新啟動或重新載入 Gateway；Plugin 設定變更在 Gateway 程序重新載入之前，
不會出現在已執行中的 Gateway 程序內。

然後驗證：

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

當會議需要自訂序列時，使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和預檢

OAuth 對建立 Meet 連結是選用的，因為 `googlemeet create` 可以退回使用瀏覽器自動化。
當你想使用官方 API 建立、空間解析或 Meet Media API 預檢時，請設定 OAuth。

Google Meet API 存取使用使用者 OAuth：建立 Google Cloud OAuth 用戶端、要求必要範圍、授權 Google 帳戶，
然後將產生的重新整理權杖儲存在 Google Meet Plugin 設定中，或提供
`OPENCLAW_GOOGLE_MEET_*` 環境變數。

OAuth 不會取代 Chrome 加入路徑。當你使用瀏覽器參與時，Chrome 和 Chrome-node 傳輸仍會透過已登入的 Chrome 設定檔、
BlackHole/SoX，以及已連線節點加入。OAuth 只用於官方 Google Meet API 路徑：
建立會議空間、解析空間，以及執行 Meet Media API 預檢。

### 建立 Google 認證

在 Google Cloud Console 中：

1. 建立或選取 Google Cloud 專案。
2. 為該專案啟用 **Google Meet REST API**。
3. 設定 OAuth 同意畫面。
   - 對 Google Workspace 組織而言，**Internal** 最簡單。
   - **External** 適用於個人/測試設定；當應用程式處於 Testing 時，
     將每個會授權此應用程式的 Google 帳戶新增為測試使用者。
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
`meetings.space.readonly` 讓 OpenClaw 將 Meet URL/代碼解析為空間。
`meetings.space.settings` 讓 OpenClaw 在 API 房間建立期間傳遞 `SpaceConfig` 設定，例如
`accessType`。
`meetings.conference.media.readonly` 用於 Meet Media API 預檢和媒體工作；
Google 可能要求加入 Developer Preview 才能實際使用 Media API。
如果你只需要基於瀏覽器的 Chrome 加入，請完全略過 OAuth。

### 簽發重新整理權杖

設定 `oauth.clientId` 以及選用的 `oauth.clientSecret`，或將它們作為環境變數傳入，然後執行：

```bash
openclaw googlemeet auth login --json
```

此命令會列印包含重新整理權杖的 `oauth` 設定區塊。它使用 PKCE、
`http://localhost:8085/oauth2callback` 上的 localhost 回呼，以及透過 `--manual` 的手動複製/貼上流程。

範例：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

當瀏覽器無法連到本機回呼時，使用手動模式：

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

當你不想讓重新整理權杖進入設定時，偏好使用環境變數。
如果同時存在設定和環境值，Plugin 會先解析設定，然後才退回環境。

OAuth 同意包含 Meet 空間建立、Meet 空間讀取存取，以及 Meet 會議媒體讀取存取。
如果你在會議建立支援存在之前完成驗證，請重新執行 `openclaw googlemeet auth login --json`，
讓重新整理權杖具有 `meetings.space.created` 範圍。

### 使用 doctor 驗證 OAuth

當你想要快速、非秘密的健康狀態檢查時，執行 OAuth doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

這不會載入 Chrome 執行階段，也不需要已連線的 Chrome 節點。
它會檢查 OAuth 設定是否存在，以及重新整理權杖是否能簽發存取權杖。
JSON 報告只包含狀態欄位，例如 `ok`、`configured`、
`tokenSource`、`expiresAt` 和檢查訊息；它不會列印存取權杖、重新整理權杖或用戶端密鑰。

常見結果：

| 檢查                 | 意義                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加上 `oauth.refreshToken`，或快取的存取權杖。                     |
| `oauth-token`        | 快取的存取權杖仍然有效，或更新權杖已鑄發新的存取權杖。                                  |
| `meet-spaces-get`    | 選用的 `--meeting` 檢查已解析既有 Meet 空間。                                           |
| `meet-spaces-create` | 選用的 `--create-space` 檢查已建立新的 Meet 空間。                                      |

若也要證明 Google Meet API 已啟用以及 `spaces.create` 範圍，請執行會產生
副作用的建立檢查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 會建立一個拋棄式 Meet URL。當你需要確認
Google Cloud 專案已啟用 Meet API，且已授權帳戶具有
`meetings.space.created` 範圍時使用它。

若要證明既有會議空間的讀取存取權：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 會證明已授權 Google 帳戶可存取的
既有空間具備讀取存取權。這些檢查傳回 `403` 通常表示 Google Meet REST API 已停用、
同意授權的更新權杖缺少必要範圍，或該 Google 帳戶無法存取該 Meet
空間。更新權杖錯誤表示請重新執行 `openclaw googlemeet auth login
--json`，並儲存新的 `oauth` 區塊。

瀏覽器備援不需要 OAuth 憑證。在該模式中，Google
驗證來自所選 Node 上已登入的 Chrome 設定檔，而不是來自
OpenClaw 設定。

這些環境變數可作為備援：

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

在 Meet 建立會議記錄後列出會議成品和出席情況：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 時，`artifacts` 和 `attendance` 預設會使用最新的會議記錄。
若你想取得該會議保留的每一筆記錄，請傳入 `--all-conference-records`。

行事曆查詢可以先從 Google Calendar 解析會議 URL，再讀取
Meet 成品：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 會搜尋今天的 `primary` 行事曆中含有
Google Meet 連結的 Calendar 事件。使用 `--event <query>` 搜尋相符的事件文字，
並使用 `--calendar <id>` 指定非主要行事曆。行事曆查詢需要包含 Calendar events readonly 範圍的
全新 OAuth 登入。`calendar-events` 會預覽相符的 Meet 事件，並標示
`latest`、`artifacts`、`attendance` 或 `export` 將選擇的事件。

如果你已知道會議記錄 ID，請直接指定：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

當你想在通話後關閉房間時，可結束 API 建立空間的進行中會議：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

這會呼叫 Google Meet `spaces.endActiveConference`，且需要 OAuth，
並且對已授權帳戶可管理的空間具備 `meetings.space.created` 範圍。
OpenClaw 接受 Meet URL、會議代碼或 `spaces/{id}` 輸入，並在結束進行中會議前
將其解析為 API 空間資源。它與 `googlemeet leave` 分開：`leave` 會停止 OpenClaw 的本機/工作階段
參與，而 `end-active-conference` 會要求 Google Meet 結束該空間的
進行中會議。

寫出可讀報告：

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

`artifacts` 會在 Google 為該會議公開時，回傳會議記錄中繼資料，以及參與者、錄製、
逐字稿、結構化逐字稿項目和智慧筆記資源中繼資料。使用 `--no-transcript-entries` 可略過
大型會議的項目查詢。`attendance` 會將參與者展開為
參與者工作階段列，包含首次/最後看見時間、總工作階段時長、
遲到/提早離開旗標，以及依登入使用者或顯示名稱合併的重複參與者資源。
傳入 `--no-merge-duplicates` 可保留原始參與者資源分開，
傳入 `--late-after-minutes` 可調整遲到偵測，並傳入
`--early-before-minutes` 可調整提早離開偵測。

`export` 會寫入包含 `summary.md`、`attendance.csv`、
`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json` 的資料夾。
`manifest.json` 會記錄所選輸入、匯出選項、會議記錄、
輸出檔案、計數、權杖來源、使用過的 Calendar 事件，以及任何
部分擷取警告。傳入 `--zip` 也會在資料夾旁寫入可攜封存檔。
傳入 `--include-doc-bodies` 可透過 Google Drive `files.export` 匯出連結的逐字稿和
智慧筆記 Google Docs 文字；這需要包含 Drive Meet readonly 範圍的
全新 OAuth 登入。若未使用 `--include-doc-bodies`，匯出只會包含 Meet 中繼資料和結構化逐字稿
項目。如果 Google 傳回部分成品失敗，例如智慧筆記
清單、逐字稿項目或 Drive 文件內文錯誤，摘要和
資訊清單會保留警告，而不是讓整個匯出失敗。
使用 `--dry-run` 可擷取相同的成品/出席資料並列印
資訊清單 JSON，而不建立資料夾或 ZIP。這在寫入
大型匯出前，或代理只需要計數、所選記錄和
警告時很有用。

代理也可以透過 `google_meet` 工具建立相同套件：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

設定 `"dryRun": true` 只回傳匯出資訊清單並略過檔案寫入。

代理也可以使用明確存取政策建立 API 支援的房間：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

而且它們可以結束已知房間的進行中會議：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

對於先聽後驗證，代理應在宣稱會議有用前使用 `test_listen`：

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

- `OPENCLAW_LIVE_TEST=1` 啟用受保護的即時測試。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代碼或
  `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID` 提供 OAuth
  用戶端 ID。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN` 提供
  更新權杖。
- 選用：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用沒有 `OPENCLAW_` 前綴的相同備援名稱。

基礎成品/出席即時煙霧測試需要
`https://www.googleapis.com/auth/meetings.space.readonly` 和
`https://www.googleapis.com/auth/meetings.conference.media.readonly`。行事曆
查詢需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive
文件內文匯出需要
`https://www.googleapis.com/auth/drive.meet.readonly`。

建立全新的 Meet 空間：

```bash
openclaw googlemeet create
```

此命令會列印新的 `meeting uri`、來源和加入工作階段。使用 OAuth
憑證時，它會使用官方 Google Meet API。沒有 OAuth 憑證時，它會
使用釘選 Chrome Node 已登入的瀏覽器設定檔作為備援。代理可以
使用 `google_meet` 工具搭配 `action: "create"`，在一個步驟中建立並加入。
若只要建立 URL，請傳入 `"join": false`。

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

如果瀏覽器備援在建立 URL 前遇到 Google 登入或 Meet 權限阻擋，
Gateway 方法會回傳失敗回應，而 `google_meet` 工具會回傳結構化詳細資料，
而不是純字串：

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

當代理看到 `manualActionRequired: true` 時，應回報
`manualActionMessage` 加上瀏覽器 Node/分頁脈絡，並停止開啟新的
Meet 分頁，直到操作者完成瀏覽器步驟。

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

建立 Meet 預設會加入會議。Chrome 或 Chrome-node 傳輸仍然需要已登入的 Google Chrome 設定檔，才能透過瀏覽器加入。如果設定檔已登出，OpenClaw 會回報 `manualActionRequired: true` 或瀏覽器後援錯誤，並要求操作員完成 Google 登入後再重試。

只有在確認你的 Cloud 專案、OAuth 主體和會議參與者都已加入 Google Workspace Developer Preview Program for Meet media APIs 後，才設定 `preview.enrollmentAcknowledged: true`。

## 設定

常見的 Chrome 代理路徑只需要啟用 Plugin、BlackHole、SoX、即時轉錄提供者金鑰，以及已設定的 OpenClaw TTS 提供者。OpenAI 是預設轉錄提供者；將 `realtime.voiceProvider` 設為 `"google"` 並設定 `realtime.model`，即可在 `bidi` 模式中使用 Google Gemini Live，而不必變更預設代理模式的轉錄提供者：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

在 `plugins.entries.google-meet.config` 底下設定 Plugin 設定：

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
- `defaultMode: "agent"`（`"realtime"` 只作為 `"agent"` 的舊版相容別名接受；新的工具呼叫應使用 `"agent"`）
- `chromeNode.node`：選用的 `chrome-node` 節點 ID/名稱/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：已登出的 Meet 訪客畫面所使用的名稱
- `chrome.autoJoin: true`：透過 `chrome-node` 上的 OpenClaw 瀏覽器自動化，以盡力方式填入訪客名稱並點擊立即加入
- `chrome.reuseExistingTab: true`：啟用現有 Meet 分頁，而不是開啟重複分頁
- `chrome.waitForInCallMs: 20000`：在觸發回話介紹之前，等待 Meet 分頁回報已在通話中
- `chrome.audioFormat: "pcm16-24khz"`：命令對音訊格式。只有仍輸出電話音訊的舊版/自訂命令對才使用 `"g711-ulaw-8khz"`。
- `chrome.audioBufferBytes: 4096`：產生的 Chrome 命令對音訊命令所使用的 SoX 處理緩衝區。這是 SoX 預設 8192 位元組緩衝區的一半，可降低預設管線延遲，同時保留在繁忙主機上調高的空間。低於 SoX 最小值的值會限制為 17 位元組。
- `chrome.audioInputCommand`：從 CoreAudio `BlackHole 2ch` 讀取並以 `chrome.audioFormat` 寫入音訊的 SoX 命令
- `chrome.audioOutputCommand`：以 `chrome.audioFormat` 讀取音訊並寫入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：選用的本機麥克風命令，會在助理播放中時寫入有號 16 位元小端序單聲道 PCM，以偵測真人插話。這目前適用於 Gateway 託管的 `chrome` 命令對橋接。
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand` 上算作真人打斷的 RMS 音量
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand` 上算作真人打斷的峰值音量
- `chrome.bargeInCooldownMs: 900`：重複清除真人打斷之間的最短延遲
- `mode: "agent"`：預設回話模式。參與者語音會由已設定的即時轉錄提供者轉錄，傳送給每個會議子代理工作階段中的已設定 OpenClaw 代理，並透過一般 OpenClaw TTS 執行階段說出回應。
- `mode: "bidi"`：後援的直接雙向即時模型模式。即時語音提供者會直接回答參與者語音，並可呼叫 `openclaw_agent_consult` 取得更深入/工具支援的答案。
- `mode: "transcribe"`：沒有回話橋接的僅觀察模式。
- `realtime.provider: "openai"`：當下方範圍化提供者欄位未設定時使用的相容性後援。
- `realtime.transcriptionProvider: "openai"`：`agent` 模式用於即時轉錄的提供者 ID。
- `realtime.voiceProvider`：`bidi` 模式用於直接即時語音的提供者 ID。將此設為 `"google"` 可使用 Gemini Live，同時讓代理模式轉錄維持在 OpenAI。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：簡短口語回覆，並使用 `openclaw_agent_consult` 處理更深入的答案
- `realtime.introMessage`：即時橋接連線時的簡短口語就緒檢查；將其設為 `""` 可靜默加入
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
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs 用於代理模式的聆聽與說話：

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

持續使用的 Meet 語音來自 `messages.tts.providers.elevenlabs.voiceId`。啟用 TTS 模型覆寫時，代理回覆也可以使用每則回覆的 `[[tts:voiceId=... model=eleven_v3]]` 指令，但設定是會議的確定性預設值。加入時，日誌應顯示 `transcriptionProvider=elevenlabs`，且每則口語回覆應記錄 `provider=elevenlabs model=eleven_v3 voice=<voiceId>`。

僅 Twilio 設定：

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

`voiceCall.enabled` 預設為 `true`；使用 Twilio 傳輸時，它會將實際 PSTN 通話、DTMF 和介紹問候委派給 Voice Call Plugin。Voice Call 會先播放 DTMF 序列，再開啟即時媒體串流，然後使用儲存的介紹文字作為初始即時問候。如果未啟用 `voice-call`，Google Meet 仍可驗證並記錄撥號方案，但無法撥出 Twilio 通話。

## 工具

代理可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Chrome 在 Gateway 主機上執行時使用 `transport: "chrome"`。Chrome 在已配對節點（例如 Parallels VM）上執行時使用 `transport: "chrome-node"`。在兩種情況下，模型提供者與 `openclaw_agent_consult` 都會在 Gateway 主機上執行，因此模型憑證會留在那裡。使用預設 `mode: "agent"` 時，即時轉錄提供者負責聆聽，已設定的 OpenClaw 代理產生答案，一般 OpenClaw TTS 則將答案說進 Meet。當你想要即時語音模型直接回答時，使用 `mode: "bidi"`。原始 `mode: "realtime"` 仍作為 `mode: "agent"` 的舊版相容別名接受，但不再出現在代理工具結構描述中。代理模式日誌會在橋接啟動時包含解析後的轉錄提供者/模型，並在每次合成回覆後包含 TTS 提供者、模型、語音、輸出格式和取樣率。

使用 `action: "status"` 列出作用中的工作階段或檢查工作階段 ID。使用 `action: "speak"` 搭配 `sessionId` 和 `message`，讓即時代理立即說話。使用 `action: "test_speech"` 建立或重用工作階段、觸發已知片語，並在 Chrome 主機可回報時傳回 `inCall` 健康狀態。`test_speech` 一律強制使用 `mode: "agent"`，且若要求在 `mode: "transcribe"` 中執行會失敗，因為僅觀察工作階段刻意不能輸出語音。其 `speechOutputVerified` 結果是根據此次測試呼叫期間即時音訊輸出位元組增加而定，因此含有較舊音訊的重用工作階段不算作新的成功語音檢查。使用 `action: "leave"` 將工作階段標記為已結束。

可用時，`status` 會包含 Chrome 健康狀態：

- `inCall`：Chrome 看起來位於 Meet 通話中
- `micMuted`：盡力取得的 Meet 麥克風狀態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：瀏覽器設定檔需要手動登入、Meet 主持人准入、權限或瀏覽器控制修復，語音才能運作
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：受管理的 Chrome 語音目前是否允許。`speechReady: false` 表示 OpenClaw 未將介紹/測試片語送入音訊橋接。
- `providerConnected` / `realtimeReady`：即時語音橋接狀態
- `lastInputAt` / `lastOutputAt`：最後一次從橋接看到或傳送到橋接的音訊
- `audioOutputRouted` / `audioOutputDeviceLabel`：Meet 分頁的媒體輸出是否已主動路由到橋接所使用的 BlackHole 裝置
- `lastSuppressedInputAt` / `suppressedInputBytes`：助理播放中被忽略的 loopback 輸入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent 與 Bidi 模式

Chrome `agent` 模式針對「我的代理在會議中」行為最佳化。即時轉錄提供者會聽取會議音訊，最終參與者逐字稿會路由到已設定的 OpenClaw 代理，答案則透過一般 OpenClaw TTS 執行階段說出。當你想要即時語音模型直接回答時，設定 `mode: "bidi"`。鄰近的最終逐字稿片段會在諮詢前合併，避免一個口語回合產生數個過時的部分答案。當佇列中的助理音訊仍在播放時，也會抑制即時輸入；在代理諮詢之前，近期類似助理的逐字稿回聲也會被忽略，以免 BlackHole loopback 讓代理回答自己的語音。

| 模式    | 誰決定答案                    | 語音輸出路徑                         | 使用時機                                              |
| ------- | ----------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `agent` | 已設定的 OpenClaw 代理        | 一般 OpenClaw TTS 執行階段          | 你想要「我的代理在會議中」的行為                      |
| `bidi`  | 即時語音模型                  | 即時語音提供者音訊回應               | 你想要最低延遲的對話式語音迴圈                        |

在 `bidi` 模式中，當即時模型需要更深入的推理、目前資訊或一般 OpenClaw 工具時，可以呼叫 `openclaw_agent_consult`。

諮詢工具會在幕後使用近期的會議逐字稿脈絡執行一般 OpenClaw 代理，並傳回精簡的語音回答。在 `agent` 模式中，OpenClaw 會將該回答直接傳送至 TTS 執行階段；在 `bidi` 模式中，即時語音模型可以將諮詢結果說回會議中。它使用與語音通話相同的共用諮詢機制。

預設情況下，諮詢會針對 `main` 代理執行。當 Meet 通道應該諮詢專用的 OpenClaw 代理工作區、模型預設值、工具政策、記憶體和工作階段歷史時，請設定 `realtime.agentId`。

代理模式諮詢使用每場會議專屬的 `agent:<id>:subagent:google-meet:<session>` 工作階段金鑰，因此後續問題會保留會議脈絡，同時從已設定的代理繼承一般代理政策。

`realtime.toolPolicy` 會控制諮詢執行：

- `safe-read-only`：公開諮詢工具，並將一般代理限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：公開諮詢工具，並讓一般代理使用一般代理工具政策。
- `none`：不要將諮詢工具公開給即時語音模型。

諮詢工作階段金鑰會依 Meet 工作階段設定範圍，因此後續諮詢呼叫可以在同一場會議期間重用先前的諮詢脈絡。

若要在 Chrome 完全加入通話後強制進行語音就緒檢查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

若要執行完整的加入並說話煙霧測試：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 即時測試檢查清單

在將會議交給無人值守代理之前，請使用此順序：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

預期的 Chrome-node 狀態：

- `googlemeet setup` 全部為綠色。
- 當 Chrome-node 是預設傳輸方式或已釘選節點時，`googlemeet setup` 會包含 `chrome-node-connected`。
- `nodes status` 顯示所選節點已連線。
- 所選節點會公布 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 分頁會加入通話，且 `test-speech` 會傳回包含 `inCall: true` 的 Chrome 健康狀態。

對於遠端 Chrome 主機，例如 Parallels macOS VM，這是在更新 Gateway 或 VM 後最短的安全檢查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

這會證明 Gateway Plugin 已載入、VM 節點已使用目前權杖連線，且 Meet 音訊橋接可用，然後代理才會開啟真正的會議分頁。

若要執行 Twilio 煙霧測試，請使用公開電話撥入詳細資訊的會議：

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
- 傳回的工作階段具有 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 顯示 DTMF TwiML 會先於即時 TwiML 提供，接著是已排入初始問候語的即時橋接。
- `googlemeet leave <sessionId>` 會掛斷委派的語音通話。

## 疑難排解

### 代理看不到 Google Meet 工具

確認 Plugin 已在 Gateway 設定中啟用，並重新載入 Gateway：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你剛編輯了 `plugins.entries.google-meet`，請重新啟動或重新載入 Gateway。執行中的代理只會看到目前 Gateway 程序註冊的 Plugin 工具。

在非 macOS Gateway 主機上，面向代理的 `google_meet` 工具仍然可見，但本機 Chrome 回話動作會在觸及音訊橋接之前被封鎖。本機 Chrome 回話音訊目前依賴 macOS `BlackHole 2ch`，因此 Linux 代理應使用 `mode: "transcribe"`、Twilio 撥入，或 macOS `chrome-node` 主機，而不是預設的本機 Chrome 代理路徑。

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

如果 `googlemeet setup` 在 `chrome-node-connected` 失敗，或 Gateway 記錄報告 `gateway token mismatch`，請使用目前的 Gateway 權杖重新安裝或重新啟動節點。對 LAN Gateway 而言，這通常表示：

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

### 瀏覽器已開啟，但代理無法加入

對僅觀察加入執行 `googlemeet test-listen`，或對即時加入執行 `googlemeet test-speech`，然後檢查傳回的 Chrome 健康狀態。如果任一探查回報 `manualActionRequired: true`，請向操作員顯示 `manualActionMessage`，並停止重試直到瀏覽器動作完成。

常見手動動作：

- 登入 Chrome 設定檔。
- 從 Meet 主辦帳戶允許來賓加入。
- 當 Chrome 的原生權限提示出現時，授予 Chrome 麥克風/相機權限。
- 關閉或修復卡住的 Meet 權限對話方塊。

不要只因為 Meet 顯示「Do you want people to hear you in the meeting?」就回報「not signed in」。那是 Meet 的音訊選擇插頁；可用時，OpenClaw 會透過瀏覽器自動化點選 **Use microphone**，並繼續等待真正的會議狀態。對於僅建立的瀏覽器後援，OpenClaw 可能會點選 **Continue without microphone**，因為建立 URL 不需要即時音訊路徑。

### 會議建立失敗

設定 OAuth 憑證時，`googlemeet create` 會先使用 Google Meet API `spaces.create` 端點。沒有 OAuth 憑證時，會後援到已釘選的 Chrome 節點瀏覽器。確認：

- 對於 API 建立：已設定 `oauth.clientId` 和 `oauth.refreshToken`，或存在相符的 `OPENCLAW_GOOGLE_MEET_*` 環境變數。
- 對於 API 建立：重新整理權杖是在新增建立支援後產生的。較舊的權杖可能缺少 `meetings.space.created` 範圍；請重新執行 `openclaw googlemeet auth login --json` 並更新 Plugin 設定。
- 對於瀏覽器後援：`defaultTransport: "chrome-node"` 且 `chromeNode.node` 指向已連線、具有 `browser.proxy` 和 `googlemeet.chrome` 的節點。
- 對於瀏覽器後援：該節點上的 OpenClaw Chrome 設定檔已登入 Google，且可以開啟 `https://meet.google.com/new`。
- 對於瀏覽器後援：重試會在開啟新分頁之前，重用既有的 `https://meet.google.com/new` 或 Google 帳戶提示分頁。如果代理逾時，請重試工具呼叫，而不是手動開啟另一個 Meet 分頁。
- 對於瀏覽器後援：如果工具傳回 `manualActionRequired: true`，請使用傳回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 來引導操作員。在該動作完成之前，不要循環重試。
- 對於瀏覽器後援：如果 Meet 顯示「Do you want people to hear you in the meeting?」，請保持分頁開啟。OpenClaw 應透過瀏覽器自動化點選 **Use microphone**，或對於僅建立後援點選 **Continue without microphone**，並繼續等待產生的 Meet URL。如果無法做到，錯誤應提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### 代理已加入但不說話

檢查即時路徑：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "agent"` 走一般 STT -> OpenClaw 代理 -> TTS 回話路徑，或使用 `mode: "bidi"` 走直接即時語音後援。`mode: "transcribe"` 會刻意不啟動回話橋接。若要進行僅觀察除錯，請在參與者說話後執行 `openclaw googlemeet status --json <session-id>`，並檢查 `captioning`、`transcriptLines` 和 `lastCaptionText`。如果 `inCall` 為 true 但 `transcriptLines` 維持在 `0`，Meet 字幕可能已停用、觀察器安裝後沒有人說話、Meet UI 已變更，或該會議語言/帳戶無法使用即時字幕。

`googlemeet test-speech` 一律檢查即時路徑，並回報該次呼叫是否觀察到橋接輸出位元組。如果 `speechOutputVerified` 為 false 且 `speechOutputTimedOut` 為 true，即時提供者可能已接受該語句，但 OpenClaw 沒有看到新的輸出位元組抵達 Chrome 音訊橋接。

也請驗證：

- Gateway 主機上可使用即時提供者金鑰，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主機上可看到 `BlackHole 2ch`。
- Chrome 主機上存在 `sox`。
- Meet 麥克風和喇叭會透過 OpenClaw 使用的虛擬音訊路徑路由。對本機 Chrome 即時加入，`doctor` 應顯示 `meet output routed: yes`。

`googlemeet doctor [session-id]` 會列印工作階段、節點、通話中狀態、手動動作原因、即時提供者連線、`realtimeReady`、音訊輸入/輸出活動、最後音訊時間戳記、位元組計數器和瀏覽器 URL。需要原始 JSON 時，請使用 `googlemeet status [session-id] --json`。需要在不公開權杖的情況下驗證 Google Meet OAuth 重新整理時，請使用 `googlemeet doctor --oauth`；如果還需要 Google Meet API 證明，請加上 `--meeting` 或 `--create-space`。

如果代理逾時，而你可以看到 Meet 分頁已開啟，請檢查該分頁，不要再開啟另一個分頁：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具動作是 `recover_current_tab`。它會聚焦並檢查所選傳輸方式的既有 Meet 分頁。使用 `chrome` 時，它會透過 Gateway 使用本機瀏覽器控制；使用 `chrome-node` 時，它會使用已設定的 Chrome 節點。它不會開啟新分頁或建立新工作階段；它會回報目前的阻礙，例如登入、允許加入、權限或音訊選擇狀態。CLI 命令會與已設定的 Gateway 通訊，因此 Gateway 必須正在執行；`chrome-node` 也需要 Chrome 節點已連線。

### Twilio 設定檢查失敗

當不允許或未啟用 `voice-call` 時，`twilio-voice-call-plugin` 會失敗。請將其加入 `plugins.allow`、啟用 `plugins.entries.voice-call`，並重新載入 Gateway。

當 Twilio 後端缺少帳戶 SID、驗證權杖或來電號碼時，`twilio-voice-call-credentials` 會失敗。請在 Gateway 主機上設定這些項目：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

當 `voice-call` 沒有公開 Webhook 暴露，或 `publicUrl` 指向 loopback 或私有網路空間時，`twilio-voice-call-webhook` 會失敗。請將 `plugins.entries.voice-call.config.publicUrl` 設定為公開提供者 URL，或設定 `voice-call` tunnel/Tailscale 暴露。

Loopback 和私人 URL 不適用於電信業者回呼。請勿使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

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

本機開發時，請使用通道或 Tailscale 曝露，而不是私人主機 URL：

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

然後重新啟動或重新載入 Gateway，並執行：

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 預設只檢查就緒狀態。若要對特定號碼進行試跑：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你刻意要撥出即時外撥通知電話時，才加入 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話開始，但從未進入會議

確認 Meet 事件有公開電話撥入詳細資訊。傳入確切的撥入號碼與 PIN，或自訂 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供者在輸入 PIN 前需要暫停，請在 `--dtmf-sequence` 中使用前置 `w` 或逗號。

如果電話通話已建立，但 Meet 名冊從未顯示撥入參與者：

- 執行 `openclaw googlemeet doctor <session-id>`，確認委派的 Twilio 通話 ID、DTMF 是否已排入佇列，以及是否已要求開場問候。
- 執行 `openclaw voicecall status --call-id <id>`，並確認通話仍在進行中。
- 執行 `openclaw voicecall tail`，並檢查 Twilio Webhook 是否已抵達 Gateway。
- 執行 `openclaw logs --follow`，並尋找 Twilio Meet 序列：Google Meet 委派加入動作，Voice Call 啟動電話線路，Google Meet 等待 `voiceCall.dtmfDelayMs`，使用 `voicecall.dtmf` 傳送 DTMF，等待 `voiceCall.postDtmfSpeechDelayMs`，然後使用 `voicecall.speak` 要求開場語音。
- 重新執行 `openclaw googlemeet setup --transport twilio`；綠色的設定檢查是必要的，但不能證明會議 PIN 序列正確。
- 確認撥入號碼與 PIN 屬於同一個 Meet 邀請與區域。
- 如果 Meet 應答緩慢，或通話逐字稿在傳送 DTMF 後仍顯示要求輸入 PIN 的提示，請增加 `voiceCall.dtmfDelayMs`。
- 如果參與者已加入但你聽不到問候，請在 `openclaw logs --follow` 中檢查 DTMF 後的 `voicecall.speak` 要求，以及媒體串流 TTS 播放或 Twilio `<Say>` 後援。如果通話逐字稿仍包含「enter the meeting PIN」，表示電話線路尚未加入 Meet 會議室，因此會議參與者不會聽到語音。

如果 Webhook 沒有抵達，請先偵錯 Voice Call Plugin：提供者必須能連到 `plugins.entries.voice-call.config.publicUrl` 或設定的通道。請參閱 [Voice Call 疑難排解](/zh-TW/plugins/voice-call#troubleshooting)。

## 附註

Google Meet 的官方媒體 API 以接收為導向，因此要在 Meet 通話中說話仍需要參與者路徑。這個 Plugin 讓該邊界保持可見：Chrome 處理瀏覽器參與和本機音訊路由；Twilio 處理電話撥入參與。

Chrome 回話模式需要 `BlackHole 2ch`，並搭配下列其中之一：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 擁有橋接，並在這些命令與選取的提供者之間以 `chrome.audioFormat` 傳送音訊。代理模式使用即時轉錄加上一般 TTS；雙向模式使用即時語音提供者。預設 Chrome 路徑是 24 kHz PCM16，並使用 `chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 仍可供舊版命令配對使用。
- `chrome.audioBridgeCommand`：外部橋接命令擁有整個本機音訊路徑，且必須在啟動或驗證其守護程式後結束。這只對 `bidi` 有效，因為 `agent` 模式需要直接存取命令配對才能使用 TTS。

當代理在代理模式中呼叫 `google_meet` 工具時，會議顧問工作階段會先分叉呼叫者目前的逐字稿，再回應參與者語音。Meet 工作階段仍會保持獨立（`agent:<agentId>:subagent:google-meet:<sessionId>`），因此會議後續互動不會直接改變呼叫者逐字稿。

若要取得乾淨的雙工音訊，請將 Meet 輸出與 Meet 麥克風路由到不同的虛擬裝置，或路由到 Loopback 風格的虛擬裝置圖。單一共用的 BlackHole 裝置可能會把其他參與者的聲音回送到通話中。

使用命令配對 Chrome 橋接時，`chrome.bargeInInputCommand` 可以監聽獨立的本機麥克風，並在人類開始說話時清除助理播放。即使共用的 BlackHole 迴路輸入在助理播放期間暫時被抑制，這也能讓人類語音優先於助理輸出。與 `chrome.audioInputCommand` 和 `chrome.audioOutputCommand` 一樣，這是由操作員設定的本機命令。請使用明確且可信任的命令路徑或引數清單，且不要指向來自不受信任位置的腳本。

`googlemeet speak` 會為 Chrome 工作階段觸發作用中的回話音訊橋接。`googlemeet leave` 會停止該橋接。對於透過 Voice Call Plugin 委派的 Twilio 工作階段，`leave` 也會掛斷底層語音通話。當你也想關閉 API 管理空間中的作用中 Google Meet 會議時，請使用 `googlemeet end-active-conference`。

## 相關

- [Voice Call Plugin](/zh-TW/plugins/voice-call)
- [通話模式](/zh-TW/nodes/talk)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
