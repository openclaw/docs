---
read_when:
    - 你想讓 OpenClaw 代理加入 Google Meet 通話
    - 您想要讓 OpenClaw 代理程式建立新的 Google Meet 通話
    - 你正在將 Chrome、Chrome 節點或 Twilio 設定為 Google Meet 傳輸方式
summary: Google Meet Plugin：透過 Chrome 或 Twilio 加入明確的 Meet 網址，並套用即時語音預設值
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-02T02:55:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: af1f327249c45fe318410a15c598fa9aff52bd160961b6354f027cb728b7aa82
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw 的 Google Meet 參與者支援，Plugin 依設計明確指定：

- 它只會加入明確的 `https://meet.google.com/...` URL。
- 它可以透過 Google Meet API 建立新的 Meet 空間，然後加入傳回的
  URL。
- `realtime` 語音是預設模式。
- 當需要更深入的推理或工具時，即時語音可以回呼完整的 OpenClaw 代理。
- 代理使用 `mode` 選擇加入行為：使用 `realtime` 進行即時
  聆聽/回話，或使用 `transcribe` 加入/控制瀏覽器，但不使用
  即時語音橋接。
- 驗證一開始使用個人 Google OAuth，或已登入的 Chrome 設定檔。
- 沒有自動同意公告。
- 預設的 Chrome 音訊後端是 `BlackHole 2ch`。
- Chrome 可以在本機執行，或在已配對的節點主機上執行。
- Twilio 接受撥入號碼，並可選擇性提供 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留給更廣泛的代理
  電話會議工作流程。

## 快速開始

安裝本機音訊相依項，並設定後端即時語音
提供者。OpenAI 是預設值；Google Gemini Live 也可搭配
`realtime.provider: "google"` 使用：

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

重新開機後，驗證這兩個項目：

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

設定輸出設計成可由代理讀取，並且會感知模式。它會回報 Chrome
設定檔、節點釘選，以及針對即時 Chrome 加入時的 BlackHole/SoX 音訊
橋接與延遲即時簡介檢查。對於僅觀察加入，請使用 `--mode transcribe`
檢查相同傳輸；該模式會略過即時音訊先決條件，因為它不會透過橋接
聆聽或說話：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

設定 Twilio 委派時，設定也會回報
`voice-call` Plugin、Twilio 認證，以及公開 Webhook 暴露是否就緒。
在要求代理加入前，請將任何 `ok: false` 檢查視為受檢傳輸與模式的
阻斷問題。對於腳本或機器可讀輸出，請使用 `openclaw googlemeet setup --json`。
在代理嘗試前，請使用 `--transport chrome`、
`--transport chrome-node` 或 `--transport twilio` 預檢特定
傳輸。

對於 Twilio，當預設傳輸是 Chrome 時，請一律明確預檢該傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

這會在代理嘗試撥入會議前，抓出缺少的 `voice-call` 配線、Twilio
認證，或無法連線的 Webhook 暴露。

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
  "mode": "realtime"
}
```

建立新會議並加入：

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

只建立 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有兩條路徑：

- API 建立：在已設定 Google Meet OAuth 認證時使用。這是
  最具決定性的路徑，且不依賴瀏覽器 UI 狀態。
- 瀏覽器後援：在沒有 OAuth 認證時使用。OpenClaw 使用
  已釘選的 Chrome 節點，開啟 `https://meet.google.com/new`，等待 Google
  重新導向到真正的會議代碼 URL，然後傳回該 URL。此路徑要求
  節點上的 OpenClaw Chrome 設定檔已登入 Google。
  瀏覽器自動化會處理 Meet 自己的首次執行麥克風提示；該提示
  不會被視為 Google 登入失敗。
  加入與建立流程也會先嘗試重用現有 Meet 分頁，再開啟
  新分頁。比對會忽略無害的 URL 查詢字串，例如 `authuser`，因此
  代理重試時應聚焦已開啟的會議，而不是建立第二個
  Chrome 分頁。

命令/工具輸出包含 `source` 欄位（`api` 或 `browser`），讓代理
可以說明使用了哪條路徑。`create` 預設會加入新會議，並
傳回 `joined: true` 加上加入工作階段。若只要產生 URL，請在
CLI 使用 `create --no-join`，或傳遞 `"join": false` 給工具。

或告訴代理：「建立一個 Google Meet，用即時語音加入，並把
連結傳給我。」代理應呼叫 `google_meet`，使用 `action: "create"`，
然後分享傳回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

對於僅觀察/瀏覽器控制的加入，請設定 `"mode": "transcribe"`。這不會
啟動雙工即時模型橋接，不需要 BlackHole 或 SoX，
也不會回話到會議中。此模式下的 Chrome 加入也會避免
OpenClaw 的麥克風/相機權限授予，並避開 Meet **Use
microphone** 路徑。如果 Meet 顯示音訊選擇插頁，自動化會嘗試
無麥克風路徑，否則會回報需要手動動作，而不是開啟
本機麥克風。在轉錄模式中，受管理的 Chrome 傳輸也會安裝
盡力而為的 Meet 字幕觀察器。`googlemeet status --json` 和
`googlemeet doctor` 會呈現 `captioning`、`captionsEnabledAttempted`、
`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`
以及簡短的 `recentTranscript` 尾段，讓操作者判斷瀏覽器是否
已加入通話，以及 Meet 字幕是否正在產生文字。

在即時工作階段期間，`google_meet` 狀態包含瀏覽器與音訊橋接
健康資訊，例如 `inCall`、`manualActionRequired`、`providerConnected`、
`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後輸入/輸出
時間戳記、位元組計數器，以及橋接關閉狀態。如果安全的 Meet 頁面提示
出現，瀏覽器自動化會在可行時處理。登入、主持人准入，以及
瀏覽器/作業系統權限提示會以手動動作回報，並包含原因和
訊息供代理轉達。受管理的 Chrome 工作階段只有在瀏覽器健康狀態回報
`inCall: true` 後，才會發出簡介或測試片語；否則狀態會回報
`speechReady: false`，且語音嘗試會被阻擋，而不是假裝代理已對
會議說話。

本機 Chrome 會透過已登入的 OpenClaw 瀏覽器設定檔加入。即時模式
需要 `BlackHole 2ch` 作為 OpenClaw 使用的麥克風/喇叭路徑。若要
取得乾淨的雙工音訊，請使用分開的虛擬裝置或 Loopback 風格的圖形；
單一 BlackHole 裝置足以進行首次煙霧測試，但可能產生回音。

### 本機 Gateway + Parallels Chrome

你**不**需要在 macOS VM 內有完整的 OpenClaw Gateway 或模型 API 金鑰，
只為了讓 VM 擁有 Chrome。請在本機執行 Gateway 和代理，然後在
VM 中執行節點主機。在 VM 上啟用一次隨附的 Plugin，讓節點
公告 Chrome 命令：

各處執行內容：

- Gateway 主機：OpenClaw Gateway、代理工作區、模型/API 金鑰、即時
  提供者，以及 Google Meet Plugin 設定。
- Parallels macOS VM：OpenClaw CLI/節點主機、Google Chrome、SoX、BlackHole 2ch，
  以及已登入 Google 的 Chrome 設定檔。
- VM 中不需要：Gateway 服務、代理設定、OpenAI/GPT 金鑰，或模型
  提供者設定。

安裝 VM 相依項：

```bash
brew install blackhole-2ch sox
```

安裝 BlackHole 後重新啟動 VM，讓 macOS 公開 `BlackHole 2ch`：

```bash
sudo reboot
```

重新開機後，驗證 VM 可以看到音訊裝置與 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中安裝或更新 OpenClaw，然後在那裡啟用隨附的 Plugin：

```bash
openclaw plugins enable google-meet
```

在 VM 中啟動節點主機：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是 LAN IP 且你未使用 TLS，除非你為該可信任的
私人網路選擇加入，否則節點會拒絕明文 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

將節點安裝為 LaunchAgent 時，也使用相同的環境變數：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是程序環境，不是
`openclaw.json` 設定。`openclaw node install` 會在安裝命令中存在時，
將它儲存在 LaunchAgent 環境中。

從 Gateway 主機核准節點：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

確認 Gateway 看得到節點，且該節點公告了 `googlemeet.chrome`
以及瀏覽器能力/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway 主機上將 Meet 路由到該節點：

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

若要使用單一命令進行煙霧測試，建立或重用工作階段、說出已知
片語，並列印工作階段健康狀態：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

即時加入期間，OpenClaw 瀏覽器自動化會填入訪客名稱、點選
加入/要求加入，並在 Meet 首次執行「Use microphone」選擇出現時接受它。
在僅觀察加入或僅瀏覽器會議建立期間，當有可用選項時，它會在
不使用麥克風的情況下繼續通過相同提示。如果瀏覽器設定檔未登入、
Meet 正在等待主持人准入、Chrome 需要麥克風/相機權限才能即時加入，
或 Meet 卡在自動化無法解決的提示上，加入/test-speech 結果會回報
`manualActionRequired: true`，並附上 `manualActionReason` 和
`manualActionMessage`。代理應停止重試加入，回報該精確訊息以及目前的
`browserUrl`/`browserTitle`，並只在手動瀏覽器動作完成後重試。

如果省略 `chromeNode.node`，OpenClaw 只會在剛好有一個
已連線節點同時公告 `googlemeet.chrome` 和瀏覽器控制時自動選擇。
如果有多個具備能力的節點已連線，請將 `chromeNode.node` 設為節點 ID、
顯示名稱，或遠端 IP。

常見失敗檢查：

- `Configured Google Meet node ... is not usable: offline`：固定的節點已
  為 Gateway 所知，但目前不可用。代理應將該節點視為診斷狀態，而不是可用的 Chrome
  主機，並回報設定阻礙；除非使用者要求，否則不要退回到另一種傳輸方式。
- `No connected Google Meet-capable node`：在 VM 中啟動 `openclaw node run`，
  核准配對，並確認已在 VM 中執行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。也請確認 Gateway 主機允許這兩個節點命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被檢查的主機上安裝 `blackhole-2ch`，
  並在使用本機 Chrome 音訊前重新啟動。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安裝 `blackhole-2ch`，
  並重新啟動 VM。
- Chrome 已開啟但無法加入：在 VM 內的瀏覽器設定檔登入，或保留 `chrome.guestName`
  以便訪客加入。訪客自動加入會透過節點瀏覽器 Proxy 使用 OpenClaw
  瀏覽器自動化；請確認節點瀏覽器設定指向你想要的設定檔，例如
  `browser.defaultProfile: "user"` 或具名的現有工作階段設定檔。
- 重複的 Meet 分頁：保持啟用 `chrome.reuseExistingTab: true`。OpenClaw
  會在開啟新分頁前啟用同一個 Meet URL 的現有分頁，而瀏覽器建立會議時，會在開啟另一個分頁前重用進行中的 `https://meet.google.com/new`
  或 Google 帳戶提示分頁。
- 沒有音訊：在 Meet 中，將麥克風/喇叭路由到 OpenClaw 使用的虛擬音訊裝置路徑；
  使用分開的虛擬裝置或 Loopback 風格的路由，以取得乾淨的雙工音訊。

## 安裝注意事項

Chrome 即時預設值使用兩個外部工具：

- `sox`：命令列音訊工具。此 Plugin 會針對預設的 24 kHz PCM16 音訊橋接使用明確的 CoreAudio
  裝置命令。
- `blackhole-2ch`：macOS 虛擬音訊驅動程式。它會建立 Chrome/Meet 可路由通過的 `BlackHole 2ch`
  音訊裝置。

OpenClaw 不會內建或重新散布任一套件。文件要求使用者透過 Homebrew
將它們安裝為主機相依項。SoX 採用 `LGPL-2.0-only AND GPL-2.0-only` 授權；BlackHole 採用 GPL-3.0。若你建置的安裝程式或設備會將 BlackHole 與 OpenClaw 綁定，請檢閱 BlackHole
的上游授權條款，或向 Existential Audio 取得個別授權。

## 傳輸方式

### Chrome

Chrome 傳輸方式會透過 OpenClaw 瀏覽器控制開啟 Meet URL，並以已登入的 OpenClaw
瀏覽器設定檔加入。在 macOS 上，此 Plugin 會在啟動前檢查 `BlackHole 2ch`。若已設定，它也會在開啟 Chrome
前執行音訊橋接健康狀態命令和啟動命令。當 Chrome/音訊位於 Gateway 主機上時使用 `chrome`；當 Chrome/音訊位於已配對節點（例如 Parallels macOS VM）上時使用 `chrome-node`。對於本機 Chrome，使用 `browser.defaultProfile`
選擇設定檔；`chrome.browserProfile` 會傳遞給 `chrome-node` 主機。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

將 Chrome 麥克風和喇叭音訊路由通過本機 OpenClaw 音訊橋接。若未安裝 `BlackHole 2ch`，加入會議會因設定錯誤而失敗，而不是在沒有音訊路徑的情況下靜默加入。

### Twilio

Twilio 傳輸方式是委派給 Voice Call Plugin 的嚴格撥號方案。它不會剖析 Meet 頁面中的電話號碼。

當 Chrome 參與不可用，或你想要電話撥入備援時使用此方式。Google Meet
必須為會議公開電話撥入號碼和 PIN；OpenClaw 不會從 Meet 頁面探索這些資訊。

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

透過環境或設定提供 Twilio 認證。環境變數可讓秘密不進入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

啟用 `voice-call` 後重新啟動或重新載入 Gateway；Plugin 設定變更在 Gateway
程序重新載入之前，不會出現在已執行的 Gateway 程序中。

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

當會議需要自訂序列時，使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 與預檢

OAuth 對建立 Meet 連結而言是選用的，因為 `googlemeet create`
可以退回到瀏覽器自動化。當你需要官方 API 建立、空間解析，或 Meet Media API
預檢時，請設定 OAuth。

Google Meet API 存取使用使用者 OAuth：建立 Google Cloud OAuth 用戶端、要求必要範圍、授權 Google 帳戶，然後將產生的重新整理權杖儲存在 Google Meet Plugin 設定中，或提供
`OPENCLAW_GOOGLE_MEET_*` 環境變數。

OAuth 不會取代 Chrome 加入路徑。當你使用瀏覽器參與時，Chrome 和 Chrome-node
傳輸方式仍會透過已登入的 Chrome 設定檔、BlackHole/SoX，以及已連線的節點加入。OAuth
只用於官方 Google Meet API 路徑：建立會議空間、解析空間，以及執行 Meet Media API
預檢。

### 建立 Google 認證

在 Google Cloud Console 中：

1. 建立或選取 Google Cloud 專案。
2. 為該專案啟用 **Google Meet REST API**。
3. 設定 OAuth 同意畫面。
   - **內部** 對 Google Workspace 組織最簡單。
   - **外部** 適用於個人/測試設定；當應用程式處於測試中時，將每個會授權此應用程式的 Google 帳戶加入為測試使用者。
4. 加入 OpenClaw 要求的範圍：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 建立 OAuth 用戶端 ID。
   - 應用程式類型：**Web application**。
   - 已授權的重新導向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 複製用戶端 ID 和用戶端密鑰。

Google Meet `spaces.create` 需要 `meetings.space.created`。
`meetings.space.readonly` 讓 OpenClaw 將 Meet URL/代碼解析為空間。
`meetings.conference.media.readonly` 用於 Meet Media API 預檢和媒體工作；Google
可能會要求實際使用 Media API 時加入 Developer Preview。若你只需要以瀏覽器為基礎的 Chrome 加入，請完全略過 OAuth。

### 簽發重新整理權杖

設定 `oauth.clientId`，並可選擇性設定 `oauth.clientSecret`，或以環境變數傳入它們，然後執行：

```bash
openclaw googlemeet auth login --json
```

此命令會列印包含重新整理權杖的 `oauth` 設定區塊。它使用 PKCE、位於 `http://localhost:8085/oauth2callback`
的 localhost 回呼，以及搭配 `--manual` 的手動複製/貼上流程。

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

當你不希望重新整理權杖出現在設定中時，偏好使用環境變數。若同時存在設定和環境值，此 Plugin
會先解析設定，然後才使用環境備援。

OAuth 同意包含 Meet 空間建立、Meet 空間讀取存取，以及 Meet
會議媒體讀取存取。若你是在會議建立支援存在之前完成驗證，請重新執行 `openclaw googlemeet auth login --json`，讓重新整理權杖具備 `meetings.space.created` 範圍。

### 使用 doctor 驗證 OAuth

當你需要快速、不含秘密的健康狀態檢查時，執行 OAuth doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

這不會載入 Chrome 執行階段，也不需要已連線的 Chrome 節點。它會檢查 OAuth
設定是否存在，以及重新整理權杖是否能簽發存取權杖。JSON 報告只包含狀態欄位，例如 `ok`、`configured`、`tokenSource`、`expiresAt`
和檢查訊息；它不會列印存取權杖、重新整理權杖或用戶端密鑰。

常見結果：

| 檢查                 | 意義                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 已存在 `oauth.clientId` 加上 `oauth.refreshToken`，或快取的存取權杖。                   |
| `oauth-token`        | 快取的存取權杖仍有效，或重新整理權杖已簽發新的存取權杖。                               |
| `meet-spaces-get`    | 選用的 `--meeting` 檢查已解析現有 Meet 空間。                                           |
| `meet-spaces-create` | 選用的 `--create-space` 檢查已建立新的 Meet 空間。                                     |

若也要證明 Google Meet API 已啟用以及 `spaces.create` 範圍，請執行會產生副作用的建立檢查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 會建立一個拋棄式 Meet URL。當你需要確認 Google Cloud 專案已啟用 Meet API，且已授權帳戶具備 `meetings.space.created`
範圍時使用它。

若要證明對現有會議空間的讀取存取：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 會證明對授權 Google
帳戶可存取之現有空間的讀取存取。這些檢查傳回 `403` 通常表示 Google Meet REST API
已停用、已同意的重新整理權杖缺少必要範圍，或該 Google 帳戶無法存取該 Meet
空間。重新整理權杖錯誤表示請重新執行 `openclaw googlemeet auth login
--json`，並儲存新的 `oauth` 區塊。

瀏覽器備援不需要 OAuth 認證。在該模式中，Google 驗證來自所選節點上已登入的 Chrome
設定檔，而不是 OpenClaw 設定。

以下環境變數會作為備援接受：

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

在媒體作業前執行預檢：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

在 Meet 建立會議記錄後，列出會議成品和出席資料：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 時，`artifacts` 和 `attendance` 預設會使用最新的會議記錄。若你想取得該會議保留的每一筆記錄，請傳入 `--all-conference-records`。

Calendar 查詢可以在讀取 Meet 成品之前，先從 Google Calendar 解析會議 URL：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 會在今天的 `primary` 行事曆中搜尋含有 Google Meet 連結的 Calendar 事件。使用 `--event <query>` 搜尋相符的事件文字，並使用 `--calendar <id>` 指定非主要行事曆。Calendar 查詢需要包含 Calendar 事件唯讀範圍的新 OAuth 登入。`calendar-events` 會預覽相符的 Meet 事件，並標記 `latest`、`artifacts`、`attendance` 或 `export` 將選擇的事件。

如果你已經知道會議記錄 ID，可以直接指定：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

當 Google 為該會議公開資料時，`artifacts` 會傳回會議記錄中繼資料，以及參與者、錄影、逐字稿、結構化逐字稿項目和智慧筆記資源中繼資料。使用 `--no-transcript-entries` 可略過大型會議的項目查詢。`attendance` 會將參與者展開為參與者工作階段列，包含首次/最後出現時間、總工作階段持續時間、遲到/提前離開旗標，並依登入使用者或顯示名稱合併重複的參與者資源。傳入 `--no-merge-duplicates` 可將原始參與者資源分開保留，傳入 `--late-after-minutes` 可調整遲到偵測，傳入 `--early-before-minutes` 可調整提前離開偵測。

`export` 會寫入一個資料夾，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 會記錄所選輸入、匯出選項、會議記錄、輸出檔案、計數、權杖來源、曾使用的 Calendar 事件，以及任何部分擷取警告。傳入 `--zip` 也會在資料夾旁寫入可攜式封存檔。傳入 `--include-doc-bodies` 可透過 Google Drive `files.export` 匯出連結的逐字稿和智慧筆記 Google Docs 文字；這需要包含 Drive Meet 唯讀範圍的新 OAuth 登入。若未使用 `--include-doc-bodies`，匯出只會包含 Meet 中繼資料和結構化逐字稿項目。如果 Google 傳回部分成品失敗，例如智慧筆記清單、逐字稿項目或 Drive 文件本文錯誤，摘要和資訊清單會保留警告，而不是讓整個匯出失敗。使用 `--dry-run` 可擷取相同的成品/出席資料，並列印資訊清單 JSON，而不建立資料夾或 ZIP。這在寫入大型匯出前，或代理程式只需要計數、選取的記錄和警告時很有用。

代理程式也可以透過 `google_meet` 工具建立相同的套件：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

設定 `"dryRun": true` 可只傳回匯出資訊清單並略過檔案寫入。

針對實際保留的會議執行受保護的即時煙霧測試：

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

即時煙霧測試環境：

- `OPENCLAW_LIVE_TEST=1` 啟用受保護的即時測試。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代碼或
  `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth 用戶端 ID。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供重新整理權杖。
- 選用：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用相同但不含 `OPENCLAW_` 前綴的備援名稱。

基礎成品/出席即時煙霧測試需要 `https://www.googleapis.com/auth/meetings.space.readonly` 和 `https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar 查詢需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive 文件本文匯出需要 `https://www.googleapis.com/auth/drive.meet.readonly`。

建立新的 Meet 空間：

```bash
openclaw googlemeet create
```

此命令會列印新的 `meeting uri`、來源和加入工作階段。使用 OAuth 憑證時，它會使用官方 Google Meet API。若沒有 OAuth 憑證，則會使用釘選 Chrome Node 的已登入瀏覽器設定檔作為備援。代理程式可以使用 `google_meet` 工具搭配 `action: "create"`，在一個步驟中建立並加入。若只要建立 URL，請傳入 `"join": false`。

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

如果瀏覽器備援在建立 URL 之前遇到 Google 登入或 Meet 權限阻擋，Gateway 方法會傳回失敗回應，而 `google_meet` 工具會傳回結構化詳細資料，而不是純字串：

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

當代理程式看到 `manualActionRequired: true` 時，應回報 `manualActionMessage` 以及瀏覽器 Node/分頁脈絡，並停止開啟新的 Meet 分頁，直到操作員完成瀏覽器步驟。

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

建立 Meet 預設會加入。Chrome 或 Chrome Node 傳輸仍需要已登入的 Google Chrome 設定檔，才能透過瀏覽器加入。如果該設定檔已登出，OpenClaw 會回報 `manualActionRequired: true` 或瀏覽器備援錯誤，並要求操作員完成 Google 登入後再重試。

只有在確認你的 Cloud 專案、OAuth 主體和會議參與者都已加入 Google Workspace Developer Preview Program for Meet media APIs 之後，才設定 `preview.enrollmentAcknowledged: true`。

## 設定

通用 Chrome 即時路徑只需要啟用 Plugin、BlackHole、SoX，以及後端即時語音提供者金鑰。OpenAI 是預設值；設定 `realtime.provider: "google"` 以使用 Google Gemini Live：

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
- `chromeNode.node`：`chrome-node` 的選用 Node ID/名稱/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在已登出的 Meet 訪客畫面上使用的名稱
- `chrome.autoJoin: true`：透過 `chrome-node` 上的 OpenClaw 瀏覽器自動化，以最佳努力方式填入訪客名稱並點擊 Join Now
- `chrome.reuseExistingTab: true`：啟用現有 Meet 分頁，而不是開啟重複分頁
- `chrome.waitForInCallMs: 20000`：在觸發即時簡介之前，等待 Meet 分頁回報通話中
- `chrome.audioFormat: "pcm16-24khz"`：命令配對音訊格式。只有仍輸出電話音訊的舊版/自訂命令配對才使用 `"g711-ulaw-8khz"`。
- `chrome.audioInputCommand`：從 CoreAudio `BlackHole 2ch` 讀取並以 `chrome.audioFormat` 寫入音訊的 SoX 命令
- `chrome.audioOutputCommand`：讀取 `chrome.audioFormat` 音訊並寫入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：選用的本機麥克風命令，會在助理播放中時，寫入有號 16 位元小端序單聲道 PCM，用於偵測人類插話。這目前適用於 Gateway 託管的 `chrome` 命令配對橋接。
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand` 上視為人類插話的 RMS 音量
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand` 上視為人類插話的峰值音量
- `chrome.bargeInCooldownMs: 900`：重複清除人類插話之間的最短延遲
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：簡短口語回覆，使用 `openclaw_agent_consult` 取得更深入的回答
- `realtime.introMessage`：即時橋接連線時的簡短口語就緒檢查；將其設定為 `""` 可安靜加入
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

`voiceCall.enabled` 預設為 `true`；使用 Twilio 傳輸方式時，它會將實際的 PSTN 通話、DTMF 和開場問候委派給 Voice Call Plugin。Voice Call 會先播放 DTMF 序列，再開啟即時媒體串流，然後使用儲存的開場文字作為初始即時問候。如果 `voice-call` 未啟用，Google Meet 仍可驗證並記錄撥號計畫，但無法撥打 Twilio 通話。

## 工具

代理程式可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

當 Chrome 在 Gateway 主機上執行時，請使用 `transport: "chrome"`。當 Chrome 在配對節點（例如 Parallels VM）上執行時，請使用 `transport: "chrome-node"`。在這兩種情況下，即時模型和 `openclaw_agent_consult` 都會在 Gateway 主機上執行，因此模型憑證會保留在該處。

使用 `action: "status"` 可列出作用中的工作階段或檢查工作階段 ID。使用 `action: "speak"` 搭配 `sessionId` 和 `message`，可讓即時代理程式立即發話。使用 `action: "test_speech"` 可建立或重用工作階段、觸發已知片語，並在 Chrome 主機能回報時傳回 `inCall` 健康狀態。`test_speech` 一律強制使用 `mode: "realtime"`，如果要求它以 `mode: "transcribe"` 執行，則會失敗，因為僅觀察工作階段刻意無法發出語音。它的 `speechOutputVerified` 結果是根據此測試呼叫期間即時音訊輸出位元組數是否增加，因此含有舊音訊的重用工作階段不會算作新的成功語音檢查。使用 `action: "leave"` 可將工作階段標記為已結束。

`status` 會在可用時包含 Chrome 健康狀態：

- `inCall`：Chrome 看起來位於 Meet 通話中
- `micMuted`：盡力判斷的 Meet 麥克風狀態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：瀏覽器設定檔需要人工登入、Meet 主持人准入、權限，或瀏覽器控制修復後，語音才能運作
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：目前是否允許受管理的 Chrome 語音。`speechReady: false` 表示 OpenClaw 未將開場/測試片語送入音訊橋接。
- `providerConnected` / `realtimeReady`：即時語音橋接狀態
- `lastInputAt` / `lastOutputAt`：最近從橋接收到或傳送到橋接的音訊時間
- `lastSuppressedInputAt` / `suppressedInputBytes`：助理播放期間被忽略的 loopback 輸入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 即時代理程式諮詢

Chrome 即時模式已針對即時語音迴圈最佳化。即時語音供應商會聽取會議音訊，並透過設定的音訊橋接發話。當即時模型需要更深入的推理、目前資訊或一般 OpenClaw 工具時，它可以呼叫 `openclaw_agent_consult`。

諮詢工具會在背景以最近的會議逐字稿內容執行一般 OpenClaw 代理程式，並將簡潔的口語回答傳回即時語音工作階段。接著語音模型可以將該回答說回會議中。它使用與 Voice Call 相同的共用即時諮詢工具。

預設情況下，諮詢會針對 `main` 代理程式執行。當 Meet 路徑應諮詢專用的 OpenClaw 代理程式工作區、模型預設值、工具政策、記憶體和工作階段歷史時，請設定 `realtime.agentId`。

`realtime.toolPolicy` 控制諮詢執行：

- `safe-read-only`：公開諮詢工具，並將一般代理程式限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：公開諮詢工具，並讓一般代理程式使用一般代理程式工具政策。
- `none`：不要將諮詢工具公開給即時語音模型。

諮詢工作階段金鑰會依每個 Meet 工作階段設定範圍，因此後續諮詢呼叫可在同一場會議期間重用先前的諮詢內容。

若要在 Chrome 完全加入通話後強制進行口語就緒檢查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整加入並發話煙霧測試：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 即時測試檢查清單

在將會議交給無人值守的代理程式前，請使用此序列：

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
- 所選節點公告 `googlemeet.chrome` 和 `browser.proxy` 兩者。
- Meet 分頁加入通話，且 `test-speech` 傳回包含 `inCall: true` 的 Chrome 健康狀態。

對於遠端 Chrome 主機（例如 Parallels macOS VM），這是在更新 Gateway 或 VM 後最短的安全檢查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

這會在代理程式開啟真正的會議分頁前，證明 Gateway Plugin 已載入、VM 節點已使用目前權杖連線，且 Meet 音訊橋接可用。

若要進行 Twilio 煙霧測試，請使用公開電話撥入詳細資料的會議：

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
- `openclaw logs --follow` 顯示 DTMF TwiML 先於即時 TwiML 提供，接著是已排入初始問候的即時橋接。
- `googlemeet leave <sessionId>` 會掛斷委派的語音通話。

## 疑難排解

### 代理程式看不到 Google Meet 工具

確認 Plugin 已在 Gateway 設定中啟用，並重新載入 Gateway：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你剛編輯 `plugins.entries.google-meet`，請重新啟動或重新載入 Gateway。執行中的代理程式只會看到目前 Gateway 程序所註冊的 Plugin 工具。

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

節點必須已連線，且列出 `googlemeet.chrome` 加上 `browser.proxy`。Gateway 設定必須允許這些節點命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 的 `chrome-node-connected` 失敗，或 Gateway 記錄回報 `gateway token mismatch`，請使用目前的 Gateway 權杖重新安裝或重新啟動節點。對 LAN Gateway 而言，這通常表示：

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

### 瀏覽器開啟但代理程式無法加入

執行 `googlemeet test-speech` 並檢查傳回的 Chrome 健康狀態。如果它回報 `manualActionRequired: true`，請向操作員顯示 `manualActionMessage`，並停止重試直到瀏覽器操作完成。

常見的人工操作：

- 登入 Chrome 設定檔。
- 從 Meet 主持人帳戶准入訪客。
- 當 Chrome 的原生權限提示出現時，授予 Chrome 麥克風/攝影機權限。
- 關閉或修復卡住的 Meet 權限對話方塊。

不要只因 Meet 顯示「Do you want people to hear you in the meeting?」就回報「未登入」。那是 Meet 的音訊選擇插頁；OpenClaw 會在可用時透過瀏覽器自動化點擊 **Use microphone**，並持續等待真正的會議狀態。對於僅建立的瀏覽器備援，OpenClaw 可能會點擊 **Continue without microphone**，因為建立 URL 不需要即時音訊路徑。

### 會議建立失敗

設定 OAuth 憑證時，`googlemeet create` 會先使用 Google Meet API `spaces.create` 端點。沒有 OAuth 憑證時，則會退回使用釘選的 Chrome 節點瀏覽器。請確認：

- 對 API 建立而言：已設定 `oauth.clientId` 和 `oauth.refreshToken`，或存在相符的 `OPENCLAW_GOOGLE_MEET_*` 環境變數。
- 對 API 建立而言：重新整理權杖是在新增建立支援後鑄發。較舊的權杖可能缺少 `meetings.space.created` 範圍；請重新執行 `openclaw googlemeet auth login --json` 並更新 Plugin 設定。
- 對瀏覽器備援而言：`defaultTransport: "chrome-node"` 和 `chromeNode.node` 指向已連線且具有 `browser.proxy` 和 `googlemeet.chrome` 的節點。
- 對瀏覽器備援而言：該節點上的 OpenClaw Chrome 設定檔已登入 Google，且可開啟 `https://meet.google.com/new`。
- 對瀏覽器備援而言：重試會在開啟新分頁前，重用現有的 `https://meet.google.com/new` 或 Google 帳戶提示分頁。如果代理程式逾時，請重試工具呼叫，而不是手動開啟另一個 Meet 分頁。
- 對瀏覽器備援而言：如果工具傳回 `manualActionRequired: true`，請使用傳回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 引導操作員。在該操作完成前，不要循環重試。
- 對瀏覽器備援而言：如果 Meet 顯示「Do you want people to hear you in the meeting?」，請保持分頁開啟。OpenClaw 應透過瀏覽器自動化點擊 **Use microphone**，或在僅建立備援時點擊 **Continue without microphone**，並繼續等待產生的 Meet URL。如果無法做到，錯誤應提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### 代理程式加入但不說話

檢查即時路徑：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "realtime"` 進行聆聽/回話。`mode: "transcribe"` 有意不啟動雙工即時語音橋接。若要進行僅觀察偵錯，請在參與者說話後執行 `openclaw googlemeet status --json <session-id>`，並檢查 `captioning`、`transcriptLines` 和 `lastCaptionText`。如果 `inCall` 為 true 但 `transcriptLines` 維持在 `0`，Meet 字幕可能已停用、觀察器安裝後尚未有人發言、Meet UI 已變更，或該會議語言/帳號無法使用即時字幕。

`googlemeet test-speech` 一律檢查即時路徑，並回報該次叫用是否觀察到橋接輸出位元組。如果 `speechOutputVerified` 為 false 且 `speechOutputTimedOut` 為 true，即時提供者可能已接受語句，但 OpenClaw 沒有看到新的輸出位元組抵達 Chrome 音訊橋接。

也請確認：

- Gateway 主機上可使用即時提供者金鑰，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主機上可看到 `BlackHole 2ch`。
- Chrome 主機上存在 `sox`。
- Meet 麥克風和喇叭已透過 OpenClaw 使用的虛擬音訊路徑路由。

`googlemeet doctor [session-id]` 會列印工作階段、節點、通話中狀態、手動動作原因、即時提供者連線、`realtimeReady`、音訊輸入/輸出活動、最新音訊時間戳記、位元組計數器和瀏覽器 URL。需要原始 JSON 時，請使用 `googlemeet status [session-id] --json`。需要在不暴露權杖的情況下驗證 Google Meet OAuth 重新整理時，請使用 `googlemeet doctor --oauth`；若也需要 Google Meet API 證明，請加上 `--meeting` 或 `--create-space`。

如果代理逾時，而你可以看到 Meet 分頁已開啟，請檢查該分頁，不要再開另一個分頁：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具動作是 `recover_current_tab`。它會聚焦並檢查所選傳輸的現有 Meet 分頁。使用 `chrome` 時，它會透過 Gateway 使用本機瀏覽器控制；使用 `chrome-node` 時，它會使用已設定的 Chrome 節點。它不會開啟新分頁或建立新工作階段；它會回報目前的阻礙，例如登入、准入、權限或音訊選擇狀態。CLI 命令會與已設定的 Gateway 通訊，因此 Gateway 必須正在執行；`chrome-node` 也要求 Chrome 節點已連線。

### Twilio 設定檢查失敗

`twilio-voice-call-plugin` 會在 `voice-call` 不被允許或未啟用時失敗。請將它加入 `plugins.allow`、啟用 `plugins.entries.voice-call`，然後重新載入 Gateway。

`twilio-voice-call-credentials` 會在 Twilio 後端缺少帳戶 SID、驗證權杖或來電號碼時失敗。請在 Gateway 主機上設定這些項目：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` 會在 `voice-call` 沒有公開 Webhook 暴露，或 `publicUrl` 指向 loopback 或私人網路空間時失敗。請將 `plugins.entries.voice-call.config.publicUrl` 設為公開提供者 URL，或設定 `voice-call` 通道/Tailscale 暴露。

Loopback 和私人 URL 不適用於電信業者回呼。請勿使用 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

對於穩定的公開 URL：

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

然後重新啟動或重新載入 Gateway，並執行：

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

確認 Meet 事件暴露電話撥入詳細資料。傳入確切的撥入號碼和 PIN，或自訂 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供者需要在輸入 PIN 前暫停，請在 `--dtmf-sequence` 中使用前置 `w` 或逗號。

如果電話已建立，但 Meet 名冊從未顯示撥入參與者：

- 執行 `openclaw googlemeet doctor <session-id>`，確認委派的 Twilio 通話 ID、DTMF 是否已排入佇列，以及是否已要求開場問候。
- 執行 `openclaw voicecall status --call-id <id>`，並確認通話仍在進行中。
- 執行 `openclaw voicecall tail`，並確認 Twilio Webhook 正抵達 Gateway。
- 執行 `openclaw logs --follow`，並尋找 Twilio Meet 序列：Google Meet 委派加入、Voice Call 儲存連線前 DTMF TwiML、提供該初始 TwiML，然後提供即時 TwiML，並以 `initialGreeting=queued` 啟動即時橋接。
- 重新執行 `openclaw googlemeet setup --transport twilio`；綠色設定檢查是必要的，但無法證明會議 PIN 序列正確。
- 確認撥入號碼屬於與 PIN 相同的 Meet 邀請和區域。
- 如果 Meet 接聽緩慢，請增加 `--dtmf-sequence` 中的前置暫停，例如 `wwww123456#`。
- 如果參與者已加入但你聽不到問候，請檢查 `openclaw logs --follow` 中的即時 TwiML、即時橋接啟動和 `initialGreeting=queued`。問候會在即時橋接連線後，由初始 `voicecall.start` 訊息產生。

如果 Webhook 未抵達，請先偵錯 Voice Call Plugin：提供者必須能連到 `plugins.entries.voice-call.config.publicUrl` 或已設定的通道。請參閱[語音通話疑難排解](/zh-TW/plugins/voice-call#troubleshooting)。

## 備註

Google Meet 的官方媒體 API 偏向接收，因此要在 Meet 通話中說話仍需要參與者路徑。這個 Plugin 讓該邊界保持可見：Chrome 處理瀏覽器參與和本機音訊路由；Twilio 處理電話撥入參與。

Chrome 即時模式需要 `BlackHole 2ch`，並搭配以下其中一項：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 擁有即時模型橋接，並在這些命令與所選即時語音提供者之間，以 `chrome.audioFormat` 管線傳送音訊。預設 Chrome 路徑是 24 kHz PCM16；8 kHz G.711 mu-law 仍可供舊版命令組使用。
- `chrome.audioBridgeCommand`：外部橋接命令擁有整個本機音訊路徑，且必須在啟動或驗證其守護程式後結束。

為了取得乾淨的雙工音訊，請透過不同的虛擬裝置或 Loopback 風格的虛擬裝置圖來路由 Meet 輸出與 Meet 麥克風。單一共用 BlackHole 裝置可能會將其他參與者的聲音回音回通話中。

使用命令組 Chrome 橋接時，`chrome.bargeInInputCommand` 可以聆聽另一個本機麥克風，並在使用者開始說話時清除助理播放。即使共用 BlackHole loopback 輸入在助理播放期間暫時被抑制，這也能讓人類語音優先於助理輸出。與 `chrome.audioInputCommand` 和 `chrome.audioOutputCommand` 一樣，它是由操作者設定的本機命令。請使用明確可信任的命令路徑或引數清單，且不要將它指向不受信任位置的腳本。

`googlemeet speak` 會觸發 Chrome 工作階段的作用中即時音訊橋接。`googlemeet leave` 會停止該橋接。對於透過 Voice Call Plugin 委派的 Twilio 工作階段，`leave` 也會掛斷底層語音通話。

## 相關

- [Voice call Plugin](/zh-TW/plugins/voice-call)
- [通話模式](/zh-TW/nodes/talk)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
