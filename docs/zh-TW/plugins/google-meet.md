---
read_when:
    - 你想讓 OpenClaw 代理程式加入 Google Meet 通話
    - 你想讓 OpenClaw 代理程式建立新的 Google Meet 通話
    - 你正在將 Chrome、Chrome 節點或 Twilio 設定為 Google Meet 傳輸方式
summary: Google Meet Plugin：透過 Chrome 或 Twilio 加入明確的 Meet URL，並使用代理回話預設值
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-06T09:15:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c1de7528ddabe6411598eea362d4a21c6f95f374700046c18294b215a1333d3
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet 參與者支援對 OpenClaw 而言是刻意明確設計的 Plugin：

- 它只會加入明確的 `https://meet.google.com/...` URL。
- 它可以透過 Google Meet API 建立新的 Meet 空間，然後加入傳回的 URL。
- `agent` 是預設的回應模式：即時轉錄會聆聽，設定的 OpenClaw agent 會回答，而一般 OpenClaw TTS 會在 Meet 中發聲。
- `bidi` 仍可作為備用的直接即時語音模型模式。
- Agent 透過 `mode` 選擇加入行為：使用 `agent` 進行即時聆聽/回應，使用 `bidi` 作為直接即時語音備援，或使用 `transcribe` 來加入/控制瀏覽器而不啟用回應橋接。
- 驗證一開始使用個人 Google OAuth 或已登入的 Chrome 設定檔。
- 沒有自動同意公告。
- 預設 Chrome 音訊後端是 `BlackHole 2ch`。
- Chrome 可以在本機執行，或在已配對的 node 主機上執行。
- Twilio 接受撥入號碼加上可選的 PIN 或 DTMF 序列；它無法直接撥打 Meet URL。
- CLI 指令是 `googlemeet`；`meet` 保留給更廣泛的 agent 電信會議工作流程。

## 快速開始

安裝本機音訊相依項目，並設定即時轉錄提供者加上一般 OpenClaw TTS。OpenAI 是預設轉錄提供者；Google Gemini Live 也可作為獨立的 `bidi` 語音備援，搭配 `realtime.voiceProvider: "google"` 使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 只有在 bidi 模式的 realtime.voiceProvider 是 "google" 時才需要
export GEMINI_API_KEY=...
```

`blackhole-2ch` 會安裝 `BlackHole 2ch` 虛擬音訊裝置。Homebrew 的安裝程式需要重新啟動後，macOS 才會公開該裝置：

```bash
sudo reboot
```

重新啟動後，驗證兩個元件：

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

設定輸出設計為可供 agent 讀取，並且感知模式。它會回報 Chrome 設定檔、node 固定狀態，以及針對即時 Chrome 加入的 BlackHole/SoX 音訊橋接與延遲即時開場檢查。對於僅觀察加入，請用 `--mode transcribe` 檢查相同傳輸；該模式會略過即時音訊先決條件，因為它不會透過橋接聆聽或發聲：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

設定 Twilio 委派時，設定也會回報 `voice-call` Plugin、Twilio 憑證，以及公開 Webhook 曝露是否就緒。在要求 agent 加入前，請將任何 `ok: false` 檢查視為該傳輸與模式的阻擋項。使用 `openclaw googlemeet setup --json` 取得腳本或機器可讀輸出。在 agent 嘗試前，使用 `--transport chrome`、`--transport chrome-node` 或 `--transport twilio` 預檢特定傳輸。

對於 Twilio，當預設傳輸是 Chrome 時，一律明確預檢傳輸：

```bash
openclaw googlemeet setup --transport twilio
```

這會在 agent 嘗試撥入會議前，捕捉缺少的 `voice-call` 接線、Twilio 憑證，或無法連線的 Webhook 曝露。

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

面向 agent 的 `google_meet` 工具在非 macOS 主機上仍可用於成果物、日曆、設定、轉錄、Twilio 和 `chrome-node` 流程。本機 Chrome 回應動作在那裡會被阻擋，因為 bundled Chrome 音訊路徑目前依賴 macOS `BlackHole 2ch`。在 Linux 上，請使用 `mode: "transcribe"`、Twilio 撥入，或使用 macOS `chrome-node` 主機進行 Chrome 回應參與。

建立新會議並加入：

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

對於 API 建立的會議室，如果你希望明確指定會議室的免敲門政策，而不是繼承 Google 帳戶預設值，請使用 Google Meet `SpaceConfig.accessType`：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` 允許任何擁有 Meet URL 的人不敲門即可加入。`TRUSTED` 允許主辦機構的受信任使用者、受邀外部使用者，以及撥入使用者不敲門即可加入。`RESTRICTED` 將免敲門進入限制為受邀者。這些設定只適用於正式 Google Meet API 建立路徑，因此必須設定 OAuth 憑證。

如果你在此選項可用前已驗證 Google Meet，請在將 `meetings.space.settings` 範圍新增到 Google OAuth 同意畫面後，重新執行 `openclaw googlemeet auth login --json`。

只建立 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有兩條路徑：

- API 建立：在已設定 Google Meet OAuth 憑證時使用。這是最具確定性的路徑，且不依賴瀏覽器 UI 狀態。
- 瀏覽器備援：在沒有 OAuth 憑證時使用。OpenClaw 會使用固定的 Chrome node，開啟 `https://meet.google.com/new`，等待 Google 重新導向到真正的會議代碼 URL，然後傳回該 URL。此路徑需要 node 上的 OpenClaw Chrome 設定檔已登入 Google。瀏覽器自動化會處理 Meet 自己的首次執行麥克風提示；該提示不會被視為 Google 登入失敗。
  加入與建立流程也會在開啟新分頁前，嘗試重用既有 Meet 分頁。比對會忽略無害的 URL 查詢字串，例如 `authuser`，因此 agent 重試時應聚焦已開啟的會議，而不是建立第二個 Chrome 分頁。

指令/工具輸出包含 `source` 欄位（`api` 或 `browser`），讓 agent 能說明使用了哪條路徑。`create` 預設會加入新會議，並傳回 `joined: true` 加上加入工作階段。若只要產生 URL，請在 CLI 使用 `create --no-join`，或向工具傳入 `"join": false`。

或告訴 agent：「建立一個 Google Meet，用 agent 回應模式加入，並把連結傳給我。」Agent 應以 `action: "create"` 呼叫 `google_meet`，然後分享傳回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

若要僅觀察/瀏覽器控制加入，請設定 `"mode": "transcribe"`。這不會啟動雙工即時語音橋接，不需要 BlackHole 或 SoX，也不會在會議中回應。此模式的 Chrome 加入也會避免 OpenClaw 的麥克風/攝影機權限授予，並避開 Meet **Use microphone** 路徑。如果 Meet 顯示音訊選擇插頁，自動化會嘗試無麥克風路徑，否則會回報需要手動動作，而不是開啟本機麥克風。在 transcribe 模式中，受管理的 Chrome 傳輸也會安裝盡力而為的 Meet 字幕觀察器。`googlemeet status --json` 和 `googlemeet doctor` 會呈現 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`，以及簡短的 `recentTranscript` 尾端，讓操作員判斷瀏覽器是否已加入通話，以及 Meet 字幕是否正在產生文字。
當你需要是/否探針時，請使用 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`：它會以 transcribe 模式加入，等待新的字幕或轉錄動態，並傳回 `listenVerified`、`listenTimedOut`、手動動作欄位，以及最新字幕健康狀態。

在即時工作階段期間，`google_meet` 狀態包含瀏覽器與音訊橋接健康狀態，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後輸入/輸出時間戳記、位元組計數器，以及橋接關閉狀態。如果出現安全的 Meet 頁面提示，瀏覽器自動化會在可行時處理。登入、主辦人准入，以及瀏覽器/作業系統權限提示會以手動動作回報，並附上原因和訊息，供 agent 轉述。受管理的 Chrome 工作階段只會在瀏覽器健康狀態回報 `inCall: true` 後發出開場或測試片語；否則狀態會回報 `speechReady: false`，且發話嘗試會被阻擋，而不是假裝 agent 已在會議中發聲。

本機 Chrome 會透過已登入的 OpenClaw 瀏覽器設定檔加入。即時模式需要 `BlackHole 2ch`，用於 OpenClaw 使用的麥克風/喇叭路徑。若要乾淨的雙工音訊，請使用分開的虛擬裝置或 Loopback 風格的圖形；單一 BlackHole 裝置足以進行第一次冒煙測試，但可能會回音。

### 本機 Gateway + Parallels Chrome

只為了讓 VM 擁有 Chrome，你**不**需要在 macOS VM 裡執行完整 OpenClaw Gateway 或模型 API 金鑰。請在本機執行 Gateway 和 agent，然後在 VM 中執行 node 主機。在 VM 上啟用 bundled Plugin 一次，讓 node 宣告 Chrome 指令：

各自執行的位置：

- Gateway 主機：OpenClaw Gateway、agent 工作區、模型/API 金鑰、即時提供者，以及 Google Meet Plugin 設定。
- Parallels macOS VM：OpenClaw CLI/node 主機、Google Chrome、SoX、BlackHole 2ch，以及已登入 Google 的 Chrome 設定檔。
- VM 中不需要：Gateway 服務、agent 設定、OpenAI/GPT 金鑰，或模型提供者設定。

安裝 VM 相依項目：

```bash
brew install blackhole-2ch sox
```

安裝 BlackHole 後重新啟動 VM，讓 macOS 公開 `BlackHole 2ch`：

```bash
sudo reboot
```

重新啟動後，驗證 VM 能看到音訊裝置和 SoX 指令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中安裝或更新 OpenClaw，然後在那裡啟用 bundled Plugin：

```bash
openclaw plugins enable google-meet
```

在 VM 中啟動 node 主機：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是 LAN IP 且你未使用 TLS，除非你為該受信任私人網路選擇加入，否則 node 會拒絕明文 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

將 node 安裝為 LaunchAgent 時，也使用相同環境變數：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是程序環境，而不是 `openclaw.json` 設定。`openclaw node install` 會在安裝指令中存在該變數時，將它儲存在 LaunchAgent 環境中。

從 Gateway 主機核准 node：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

確認 Gateway 看得到 node，且它宣告了 `googlemeet.chrome` 與瀏覽器能力/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway 主機上透過該 node 路由 Meet：

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

或要求 agent 使用 `google_meet` 工具並設定 `transport: "chrome-node"`。

若要進行單一指令冒煙測試，建立或重用工作階段、說出已知片語，並列印工作階段健康狀態：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在即時加入期間，OpenClaw 瀏覽器自動化會填入訪客名稱、點擊加入/要求加入，並在 Meet 首次執行的「使用麥克風」選項提示出現時接受它。在僅觀察加入或僅瀏覽器建立會議期間，當相同提示提供無麥克風選項時，它會繼續通過該提示而不使用麥克風。如果瀏覽器設定檔未登入、Meet 正在等待主持人允許加入、Chrome 需要即時加入所需的麥克風/攝影機權限，或 Meet 卡在自動化無法處理的提示上，加入/test-speech 結果會回報 `manualActionRequired: true`，並帶有 `manualActionReason` 和 `manualActionMessage`。代理應停止重試加入，回報該精確訊息加上目前的 `browserUrl`/`browserTitle`，並且只在手動瀏覽器操作完成後重試。

如果省略 `chromeNode.node`，只有在剛好有一個已連線節點同時宣告 `googlemeet.chrome` 和瀏覽器控制時，OpenClaw 才會自動選取。如果有多個具備能力的節點已連線，請將 `chromeNode.node` 設為節點 ID、顯示名稱或遠端 IP。

常見失敗檢查：

- `Configured Google Meet node ... is not usable: offline`：固定的節點已被 Gateway 知道但無法使用。代理應將該節點視為診斷狀態，而不是可用的 Chrome 主機，並回報設定阻礙，而不是退回到其他傳輸，除非使用者要求這麼做。
- `No connected Google Meet-capable node`：在 VM 中啟動 `openclaw node run`，核准配對，並確認已在 VM 中執行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。也請確認 Gateway 主機允許這兩個節點命令，設定為 `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在正在檢查的主機上安裝 `blackhole-2ch`，並在使用本機 Chrome 音訊前重新啟動。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安裝 `blackhole-2ch`，並重新啟動 VM。
- Chrome 會開啟但無法加入：登入 VM 內的瀏覽器設定檔，或保留 `chrome.guestName` 設定以供訪客加入。訪客自動加入會透過節點瀏覽器代理使用 OpenClaw 瀏覽器自動化；請確認節點瀏覽器設定指向你想使用的設定檔，例如 `browser.defaultProfile: "user"` 或具名的既有工作階段設定檔。
- 重複的 Meet 分頁：保持啟用 `chrome.reuseExistingTab: true`。OpenClaw 會先啟用相同 Meet URL 的既有分頁，再開啟新分頁；瀏覽器建立會議時，也會在開啟另一個分頁前重用進行中的 `https://meet.google.com/new` 或 Google 帳戶提示分頁。
- 沒有音訊：在 Meet 中，將麥克風/喇叭透過 OpenClaw 使用的虛擬音訊裝置路徑路由；若要清楚的雙工音訊，請使用分開的虛擬裝置或 Loopback 風格的路由。

## 安裝注意事項

Chrome 回話預設使用兩個外部工具：

- `sox`：命令列音訊工具。Plugin 會使用明確的 CoreAudio 裝置命令，作為預設 24 kHz PCM16 音訊橋接。
- `blackhole-2ch`：macOS 虛擬音訊驅動程式。它會建立 `BlackHole 2ch` 音訊裝置，供 Chrome/Meet 透過它路由。

OpenClaw 不會捆綁或重新散布任一套件。文件會要求使用者透過 Homebrew 將它們安裝為主機相依項。SoX 授權為 `LGPL-2.0-only AND GPL-2.0-only`；BlackHole 是 GPL-3.0。如果你建置的安裝程式或設備將 BlackHole 與 OpenClaw 捆綁，請檢閱 BlackHole 的上游授權條款，或向 Existential Audio 取得個別授權。

## 傳輸

### Chrome

Chrome 傳輸會透過 OpenClaw 瀏覽器控制開啟 Meet URL，並以已登入的 OpenClaw 瀏覽器設定檔加入。在 macOS 上，Plugin 會在啟動前檢查 `BlackHole 2ch`。如果已設定，它也會在開啟 Chrome 前執行音訊橋接健康命令和啟動命令。當 Chrome/音訊位於 Gateway 主機時使用 `chrome`；當 Chrome/音訊位於已配對節點，例如 Parallels macOS VM 時，使用 `chrome-node`。對於本機 Chrome，使用 `browser.defaultProfile` 選擇設定檔；`chrome.browserProfile` 會傳遞給 `chrome-node` 主機。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

將 Chrome 麥克風和喇叭音訊透過本機 OpenClaw 音訊橋接路由。如果未安裝 `BlackHole 2ch`，加入會以設定錯誤失敗，而不是在沒有音訊路徑的情況下默默加入。

### Twilio

Twilio 傳輸是委派給 Voice Call Plugin 的嚴格撥號計畫。它不會剖析 Meet 頁面以取得電話號碼。

當無法使用 Chrome 參與，或你想要電話撥入備援時使用這個方式。Google Meet 必須為該會議公開電話撥入號碼和 PIN；OpenClaw 不會從 Meet 頁面探索這些資訊。

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

透過環境或設定提供 Twilio 憑證。環境可讓秘密不進入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

如果那是你的即時語音提供者，請改用 OpenAI provider Plugin 和 `OPENAI_API_KEY` 搭配 `realtime.provider: "openai"`。

啟用 `voice-call` 後，重新啟動或重新載入 Gateway；Plugin 設定變更在重新載入前不會出現在已執行中的 Gateway 程序。

接著驗證：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

當 Twilio 委派已接好時，`googlemeet setup` 會包含成功的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 檢查。

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

OAuth 對於建立 Meet 連結是選用的，因為 `googlemeet create` 可以退回到瀏覽器自動化。當你需要官方 API 建立、空間解析，或 Meet Media API 預檢時，請設定 OAuth。

Google Meet API 存取使用使用者 OAuth：建立 Google Cloud OAuth 用戶端、要求必要範圍、授權 Google 帳戶，然後將產生的更新權杖儲存在 Google Meet Plugin 設定中，或提供 `OPENCLAW_GOOGLE_MEET_*` 環境變數。

OAuth 不會取代 Chrome 加入路徑。當你使用瀏覽器參與時，Chrome 和 Chrome-node 傳輸仍會透過已登入的 Chrome 設定檔、BlackHole/SoX，以及已連線節點加入。OAuth 只用於官方 Google Meet API 路徑：建立會議空間、解析空間，以及執行 Meet Media API 預檢。

### 建立 Google 憑證

在 Google Cloud Console 中：

1. 建立或選取 Google Cloud 專案。
2. 為該專案啟用 **Google Meet REST API**。
3. 設定 OAuth 同意畫面。
   - **內部** 對 Google Workspace 組織最簡單。
   - **外部** 適用於個人/測試設定；當應用程式處於測試中時，將每個要授權應用程式的 Google 帳戶新增為測試使用者。
4. 新增 OpenClaw 要求的範圍：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 建立 OAuth 用戶端 ID。
   - 應用程式類型：**網頁應用程式**。
   - 已授權重新導向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 複製用戶端 ID 和用戶端密鑰。

Google Meet `spaces.create` 需要 `meetings.space.created`。
`meetings.space.readonly` 讓 OpenClaw 能將 Meet URL/代碼解析為空間。
`meetings.space.settings` 讓 OpenClaw 能在 API 房間建立期間傳遞 `SpaceConfig` 設定，例如 `accessType`。
`meetings.conference.media.readonly` 用於 Meet Media API 預檢和媒體工作；Google 可能會要求註冊 Developer Preview 才能實際使用 Media API。如果你只需要以瀏覽器為基礎的 Chrome 加入，請完全略過 OAuth。

### 簽發更新權杖

設定 `oauth.clientId`，以及選擇性設定 `oauth.clientSecret`，或將它們作為環境變數傳入，然後執行：

```bash
openclaw googlemeet auth login --json
```

該命令會列印含有更新權杖的 `oauth` 設定區塊。它使用 PKCE、`http://localhost:8085/oauth2callback` 上的 localhost 回呼，以及搭配 `--manual` 的手動複製/貼上流程。

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

當你不想把更新權杖放在設定中時，偏好使用環境變數。如果設定和環境值同時存在，Plugin 會先解析設定，然後才退回環境。

OAuth 同意包含 Meet 空間建立、Meet 空間讀取存取，以及 Meet 會議媒體讀取存取。如果你在會議建立支援存在之前已完成驗證，請重新執行 `openclaw googlemeet auth login --json`，讓更新權杖具有 `meetings.space.created` 範圍。

### 使用 doctor 驗證 OAuth

當你需要快速且不含秘密的健康檢查時，執行 OAuth doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

這不會載入 Chrome 執行階段，也不需要已連線的 Chrome 節點。它會檢查 OAuth 設定是否存在，以及更新權杖能否簽發存取權杖。JSON 報告只包含狀態欄位，例如 `ok`、`configured`、`tokenSource`、`expiresAt` 和檢查訊息；它不會列印存取權杖、更新權杖或用戶端密鑰。

常見結果：

| 檢查                 | 意義                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加上 `oauth.refreshToken`，或已快取的存取權杖。                   |
| `oauth-token`        | 已快取的存取權杖仍然有效，或重新整理權杖已鑄造新的存取權杖。                           |
| `meet-spaces-get`    | 選用的 `--meeting` 檢查已解析既有的 Meet 空間。                                         |
| `meet-spaces-create` | 選用的 `--create-space` 檢查已建立新的 Meet 空間。                                      |

若也要證明 Google Meet API 已啟用，以及 `spaces.create` 範圍可用，請執行會產生副作用的建立檢查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 會建立一個可拋棄的 Meet URL。當你需要確認 Google Cloud 專案已啟用 Meet API，且已授權帳戶具有 `meetings.space.created` 範圍時，請使用它。

若要證明可讀取既有會議空間：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 會證明可讀取已授權 Google 帳戶可存取的既有空間。這些檢查傳回 `403` 通常表示 Google Meet REST API 已停用、已同意授權的重新整理權杖缺少必要範圍，或該 Google 帳戶無法存取該 Meet 空間。重新整理權杖錯誤表示需要重新執行 `openclaw googlemeet auth login
--json`，並儲存新的 `oauth` 區塊。

瀏覽器後援不需要 OAuth 憑證。在該模式中，Google 驗證來自所選 Node 上已登入的 Chrome 設定檔，而不是來自 OpenClaw 設定。

這些環境變數可作為後援使用：

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

在 Meet 建立會議記錄後列出會議成品與出席資料：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 時，`artifacts` 和 `attendance` 預設會使用最新的會議記錄。若你想取得該會議保留的每一筆記錄，請傳入 `--all-conference-records`。

Calendar 查詢可先從 Google Calendar 解析會議 URL，再讀取 Meet 成品：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 會在今天的 `primary` 行事曆中搜尋含有 Google Meet 連結的 Calendar 事件。使用 `--event <query>` 搜尋相符的事件文字，並使用 `--calendar <id>` 指定非主要行事曆。Calendar 查詢需要包含 Calendar events readonly 範圍的新 OAuth 登入。
`calendar-events` 會預覽相符的 Meet 事件，並標記 `latest`、`artifacts`、`attendance` 或 `export` 將選擇的事件。

如果你已知道會議記錄 id，可以直接指定它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

當你想在通話後關閉房間時，可以結束 API 所建立空間的作用中會議：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

這會呼叫 Google Meet `spaces.endActiveConference`，並且需要 OAuth 具備 `meetings.space.created` 範圍，且該空間必須可由已授權帳戶管理。OpenClaw 接受 Meet URL、會議代碼或 `spaces/{id}` 輸入，並在結束作用中會議前將其解析為 API 空間資源。
它與 `googlemeet leave` 是分開的：`leave` 會停止 OpenClaw 的本機/工作階段參與，而 `end-active-conference` 會要求 Google Meet 結束該空間的作用中會議。

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

當 Google 為該會議公開資料時，`artifacts` 會傳回會議記錄中繼資料，以及參與者、錄影、逐字稿、結構化逐字稿項目和智慧筆記資源中繼資料。對於大型會議，使用 `--no-transcript-entries` 可略過項目查詢。`attendance` 會將參與者展開為參與者工作階段列，其中包含首次/最後看到時間、工作階段總時長、遲到/提早離開旗標，以及依登入使用者或顯示名稱合併的重複參與者資源。傳入 `--no-merge-duplicates` 可讓原始參與者資源保持分開，傳入 `--late-after-minutes` 可調整遲到偵測，並傳入 `--early-before-minutes` 可調整提早離開偵測。

`export` 會寫入一個資料夾，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。
`manifest.json` 會記錄所選輸入、匯出選項、會議記錄、輸出檔案、計數、權杖來源、曾使用的 Calendar 事件，以及任何部分擷取警告。傳入 `--zip` 也會在資料夾旁寫入可攜式封存檔。傳入 `--include-doc-bodies` 可透過 Google Drive `files.export` 匯出連結的逐字稿和智慧筆記 Google Docs 文字；這需要包含 Drive Meet readonly 範圍的新 OAuth 登入。不使用 `--include-doc-bodies` 時，匯出只會包含 Meet 中繼資料和結構化逐字稿項目。如果 Google 傳回部分成品失敗，例如智慧筆記列表、逐字稿項目或 Drive 文件本文錯誤，摘要和 manifest 會保留警告，而不是讓整個匯出失敗。
使用 `--dry-run` 可擷取相同的成品/出席資料並列印 manifest JSON，而不建立資料夾或 ZIP。這在寫入大型匯出前，或 agent 只需要計數、所選記錄和警告時很有用。

Agent 也可以透過 `google_meet` 工具建立相同的套件：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

設定 `"dryRun": true` 可只傳回匯出 manifest 並略過檔案寫入。

Agent 也可以使用明確的存取政策建立 API 支援的房間：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

對於先聽再驗證，agent 應先使用 `test_listen`，再宣稱會議有用：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

針對真正保留的會議執行受保護的即時煙霧測試：

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
  client id。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供
  refresh token。
- 選用：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用相同的後援名稱，但不含
  `OPENCLAW_` 前綴。

基礎成品/出席即時煙霧測試需要
`https://www.googleapis.com/auth/meetings.space.readonly` 和
`https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar
查詢需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive
文件本文匯出需要
`https://www.googleapis.com/auth/drive.meet.readonly`。

建立新的 Meet 空間：

```bash
openclaw googlemeet create
```

該命令會列印新的 `meeting uri`、來源和加入工作階段。有 OAuth 憑證時，它會使用官方 Google Meet API。沒有 OAuth 憑證時，它會使用釘選 Chrome Node 的已登入瀏覽器設定檔作為後援。Agent 可以使用 `google_meet` 工具搭配 `action: "create"`，在一個步驟中建立並加入。若只要建立 URL，請傳入 `"join": false`。

來自瀏覽器後援的 JSON 輸出範例：

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

如果瀏覽器後援在能建立 URL 前遇到 Google 登入或 Meet 權限阻擋，Gateway 方法會傳回失敗回應，而 `google_meet` 工具會傳回結構化詳細資訊，而不是純字串：

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

當 agent 看到 `manualActionRequired: true` 時，應回報 `manualActionMessage` 加上瀏覽器 Node/分頁情境，並停止開啟新的 Meet 分頁，直到操作員完成瀏覽器步驟。

來自 API create 的 JSON 輸出範例：

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

建立 Meet 預設會加入會議。Chrome 或 Chrome-node 傳輸仍需要已登入的 Google Chrome 設定檔，才能透過瀏覽器加入。如果設定檔已登出，OpenClaw 會回報 `manualActionRequired: true` 或瀏覽器備援錯誤，並要求操作員完成 Google 登入後再重試。

只有在確認你的 Cloud 專案、OAuth 主體和會議參與者都已加入 Meet 媒體 API 的 Google Workspace Developer Preview Program 後，才設定 `preview.enrollmentAcknowledged: true`。

## 設定

常見的 Chrome 代理程式路徑只需要啟用 Plugin、BlackHole、SoX、即時轉錄供應商金鑰，以及已設定的 OpenClaw TTS 供應商。OpenAI 是預設轉錄供應商；將 `realtime.voiceProvider` 設為 `"google"` 並設定 `realtime.model`，即可在 `bidi` 模式使用 Google Gemini Live，而不變更預設 agent 模式的轉錄供應商：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

在 `plugins.entries.google-meet.config` 下設定 Plugin：

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
- `chromeNode.node`：`chrome-node` 的選用 Node ID/名稱/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在已登出的 Meet 訪客畫面上使用的名稱
- `chrome.autoJoin: true`：透過 `chrome-node` 上的 OpenClaw 瀏覽器自動化，盡力填入訪客名稱並點擊立即加入
- `chrome.reuseExistingTab: true`：啟用現有 Meet 分頁，而不是開啟重複分頁
- `chrome.waitForInCallMs: 20000`：等待 Meet 分頁回報已在通話中，再觸發回話開場
- `chrome.audioFormat: "pcm16-24khz"`：命令配對音訊格式。只有仍輸出電話音訊的舊版/自訂命令配對才使用 `"g711-ulaw-8khz"`。
- `chrome.audioBufferBytes: 4096`：用於產生的 Chrome 命令配對音訊命令的 SoX 處理緩衝區。這是 SoX 預設 8192 位元組緩衝區的一半，可降低預設管線延遲，同時保留在繁忙主機上提高它的空間。低於 SoX 最小值的值會限制為 17 位元組。
- `chrome.audioInputCommand`：從 CoreAudio `BlackHole 2ch` 讀取並以 `chrome.audioFormat` 寫入音訊的 SoX 命令
- `chrome.audioOutputCommand`：以 `chrome.audioFormat` 讀取音訊並寫入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：選用的本機麥克風命令，會在助理播放期間，為真人插話偵測寫入有號 16 位元 little-endian 單聲道 PCM。這目前適用於 Gateway 託管的 `chrome` 命令配對橋接。
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand` 上視為真人打斷的 RMS 音量
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand` 上視為真人打斷的峰值音量
- `chrome.bargeInCooldownMs: 900`：重複清除真人打斷之間的最短延遲
- `mode: "agent"`：預設回話模式。參與者語音會由設定的即時轉錄供應商轉錄，傳送至每個會議子代理程式工作階段中設定的 OpenClaw 代理程式，並透過一般 OpenClaw TTS 執行階段說回去。
- `mode: "bidi"`：備援的直接雙向即時模型模式。即時語音供應商會直接回應參與者語音，並可呼叫 `openclaw_agent_consult` 以取得更深入/由工具支援的答案。
- `mode: "transcribe"`：不含回話橋接的僅觀察模式。
- `realtime.provider: "openai"`：當下方作用域供應商欄位未設定時使用的相容性備援。
- `realtime.transcriptionProvider: "openai"`：`agent` 模式用於即時轉錄的供應商 ID。
- `realtime.voiceProvider`：`bidi` 模式用於直接即時語音的供應商 ID。將此設為 `"google"` 可使用 Gemini Live，同時讓 agent 模式轉錄維持在 OpenAI。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：簡短口語回覆，並以 `openclaw_agent_consult` 提供更深入答案
- `realtime.introMessage`：即時橋接連線時的簡短口語就緒檢查；將它設為 `""` 可靜默加入
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

ElevenLabs 同時用於 agent 模式的聆聽與說話：

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

持續的 Meet 語音來自 `messages.tts.providers.elevenlabs.voiceId`。啟用 TTS 模型覆寫時，代理程式回覆也可以使用每則回覆的 `[[tts:voiceId=... model=eleven_v3]]` 指令，但設定是會議的確定性預設值。加入時，記錄應顯示 `transcriptionProvider=elevenlabs`，且每個口語回覆都應記錄 `provider=elevenlabs model=eleven_v3 voice=<voiceId>`。

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

`voiceCall.enabled` 預設為 `true`；使用 Twilio 傳輸時，它會將實際的 PSTN 通話、DTMF 和開場問候委派給 Voice Call Plugin。Voice Call 會先播放 DTMF 序列，再開啟即時媒體串流，然後使用儲存的開場文字作為初始即時問候。如果未啟用 `voice-call`，Google Meet 仍可驗證並記錄撥號方案，但無法撥打 Twilio 通話。

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

當 Chrome 在 Gateway 主機上執行時，使用 `transport: "chrome"`。當 Chrome 在配對的 Node（例如 Parallels VM）上執行時，使用 `transport: "chrome-node"`。在這兩種情況下，模型供應商和 `openclaw_agent_consult` 都在 Gateway 主機上執行，因此模型憑證會保留在那裡。使用預設 `mode: "agent"` 時，即時轉錄供應商負責聆聽，設定的 OpenClaw 代理程式產生答案，而一般 OpenClaw TTS 會將它說進 Meet。當你想讓即時語音模型直接回答時，使用 `mode: "bidi"`。原始 `mode: "realtime"` 仍作為 `mode: "agent"` 的舊版相容別名接受，但已不再於代理程式工具結構描述中宣傳。Agent 模式記錄會在橋接啟動時包含解析後的轉錄供應商/模型，並在每個合成回覆後包含 TTS 供應商、模型、語音、輸出格式和取樣率。

使用 `action: "status"` 可列出作用中工作階段或檢查工作階段 ID。使用帶有 `sessionId` 和 `message` 的 `action: "speak"` 可讓即時代理程式立即說話。使用 `action: "test_speech"` 可建立或重用工作階段、觸發已知短語，並在 Chrome 主機可以回報時傳回 `inCall` 健康狀態。`test_speech` 一律強制使用 `mode: "agent"`，且若要求在 `mode: "transcribe"` 中執行會失敗，因為僅觀察工作階段刻意不能發出語音。其 `speechOutputVerified` 結果是根據此測試呼叫期間即時音訊輸出位元組增加而定，因此含有較舊音訊的重用工作階段不會算作新的成功語音檢查。使用 `action: "leave"` 可將工作階段標記為已結束。

`status` 會在可用時包含 Chrome 健康狀態：

- `inCall`：Chrome 看起來位於 Meet 通話內
- `micMuted`：盡力取得的 Meet 麥克風狀態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：瀏覽器設定檔需要手動登入、Meet 主持人准入、權限，或瀏覽器控制修復，語音才能運作
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：目前是否允許受管理的 Chrome 語音。`speechReady: false` 表示 OpenClaw 未將開場/測試短語送入音訊橋接。
- `providerConnected` / `realtimeReady`：即時語音橋接狀態
- `lastInputAt` / `lastOutputAt`：橋接上次看見或傳送的音訊
- `audioOutputRouted` / `audioOutputDeviceLabel`：Meet 分頁的媒體輸出是否主動路由到橋接使用的 BlackHole 裝置
- `lastSuppressedInputAt` / `suppressedInputBytes`：助理播放期間忽略的 local loopback 輸入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent 與 Bidi 模式

Chrome `agent` 模式針對「我的代理程式在會議中」的行為最佳化。即時轉錄供應商會聽取會議音訊，最終參與者逐字稿會路由至設定的 OpenClaw 代理程式，答案則透過一般 OpenClaw TTS 執行階段說出。當你想讓即時語音模型直接回答時，設定 `mode: "bidi"`。相近的最終逐字稿片段會在諮詢前合併，避免一個口語回合產生多個過期的部分答案。即時輸入也會在佇列中的助理音訊仍在播放時受到抑制，並且在代理程式諮詢前會忽略最近類似助理的逐字稿回聲，避免 BlackHole local loopback 讓代理程式回應自己的語音。

| 模式    | 由誰決定答案        | 語音輸出路徑                     | 使用時機                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 設定的 OpenClaw 代理程式 | 一般 OpenClaw TTS 執行階段            | 你想要「我的代理程式在會議中」的行為        |
| `bidi`  | 即時語音模型      | 即時語音供應商音訊回應 | 你想要最低延遲的對話式語音迴圈 |

在 `bidi` 模式中，當即時模型需要更深入的推理、目前資訊或一般 OpenClaw 工具時，可以呼叫 `openclaw_agent_consult`。

consult 工具會在幕後執行一般的 OpenClaw agent，帶入近期
會議逐字稿脈絡，並回傳精簡的口語回答。在 `agent` 模式中，
OpenClaw 會將該回答直接傳送到 TTS 執行階段；在 `bidi` 模式中，
即時語音模型可以把 consult 結果說回會議中。它使用與 Voice Call
相同的共享 consult 機制。

consult 預設會針對 `main` agent 執行。當 Meet 通道應該 consult 專用的 OpenClaw agent 工作區、模型預設值、工具政策、記憶體與工作階段歷史時，請設定 `realtime.agentId`。

Agent 模式的 consult 會使用每場會議專屬的 `agent:<id>:subagent:google-meet:<session>`
工作階段金鑰，讓後續問題保留會議脈絡，同時從已設定的 agent 繼承一般
agent 政策。

`realtime.toolPolicy` 會控制 consult 執行：

- `safe-read-only`：公開 consult 工具，並將一般 agent 限制為
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 與
  `memory_get`。
- `owner`：公開 consult 工具，並讓一般 agent 使用一般的
  agent 工具政策。
- `none`：不要將 consult 工具公開給即時語音模型。

consult 工作階段金鑰的範圍限定於每個 Meet 工作階段，因此後續 consult 呼叫
可以在同一場會議期間重用先前的 consult 脈絡。

若要在 Chrome 完全加入通話後強制執行口語就緒檢查：

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

在將會議交給無人看管的 agent 之前，請使用此序列：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

預期的 Chrome-node 狀態：

- `googlemeet setup` 全部為綠色。
- 當 Chrome-node 是預設傳輸或已釘選節點時，`googlemeet setup` 包含
  `chrome-node-connected`。
- `nodes status` 顯示選取的節點已連線。
- 選取的節點同時公告 `googlemeet.chrome` 與 `browser.proxy`。
- Meet 分頁加入通話，且 `test-speech` 回傳 Chrome 健康狀態，其中
  `inCall: true`。

對於 Parallels macOS VM 這類遠端 Chrome 主機，這是在更新 Gateway 或 VM 後
最短且安全的檢查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

這會證明 Gateway Plugin 已載入、VM 節點已使用目前的權杖連線，並且 Meet 音訊橋接器可用，之後 agent 才會開啟真正的會議分頁。

若要執行 Twilio 煙霧測試，請使用提供電話撥入詳細資料的會議：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

預期的 Twilio 狀態：

- `googlemeet setup` 包含綠色的 `twilio-voice-call-plugin`、
  `twilio-voice-call-credentials` 與 `twilio-voice-call-webhook` 檢查。
- Gateway 重新載入後，CLI 中可使用 `voicecall`。
- 回傳的工作階段具有 `transport: "twilio"` 與 `twilio.voiceCallId`。
- `openclaw logs --follow` 顯示在即時 TwiML 之前提供 DTMF TwiML，接著是
  已佇列初始問候語的即時橋接。
- `googlemeet leave <sessionId>` 會掛斷委派的語音通話。

## 疑難排解

### Agent 看不到 Google Meet 工具

確認 Plugin 已在 Gateway 設定中啟用，並重新載入 Gateway：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你剛編輯了 `plugins.entries.google-meet`，請重新啟動或重新載入 Gateway。
執行中的 agent 只會看到目前 Gateway 程序註冊的 Plugin 工具。

在非 macOS Gateway 主機上，面向 agent 的 `google_meet` 工具仍會保持可見，
但本機 Chrome 的回話動作會在觸及音訊橋接器之前被封鎖。
本機 Chrome 回話音訊目前依賴 macOS `BlackHole 2ch`，因此
Linux agent 應改用 `mode: "transcribe"`、Twilio 撥入，或 macOS
`chrome-node` 主機，而不是預設的本機 Chrome agent 路徑。

### 沒有已連線且支援 Google Meet 的節點

在節點主機上執行：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 主機上核准節點並驗證命令：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

節點必須已連線，並列出 `googlemeet.chrome` 加上 `browser.proxy`。
Gateway 設定必須允許這些節點命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 在 `chrome-node-connected` 失敗，或 Gateway 記錄回報
`gateway token mismatch`，請使用目前 Gateway 權杖重新安裝或重新啟動節點。
對於 LAN Gateway，這通常表示：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

接著重新載入節點服務並重新執行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 瀏覽器已開啟但 agent 無法加入

針對僅觀察加入執行 `googlemeet test-listen`，或針對即時加入執行 `googlemeet test-speech`，
然後檢查回傳的 Chrome 健康狀態。如果任一探測回報
`manualActionRequired: true`，請將 `manualActionMessage` 顯示給操作員，
並停止重試，直到瀏覽器動作完成。

常見的手動動作：

- 登入 Chrome 設定檔。
- 由 Meet 主辦帳戶准許訪客加入。
- 當 Chrome 原生權限提示出現時，授予 Chrome 麥克風/攝影機權限。
- 關閉或修復卡住的 Meet 權限對話方塊。

不要只因為 Meet 顯示「Do you want people to hear you in the meeting?」就回報「未登入」。
那是 Meet 的音訊選擇插頁；可用時，OpenClaw 會透過瀏覽器自動化點擊
**Use microphone**，並繼續等待真正的會議狀態。對於僅建立的瀏覽器備援，
OpenClaw 可能會點擊 **Continue without microphone**，因為建立 URL 不需要
即時音訊路徑。

### 會議建立失敗

`googlemeet create` 會在已設定 OAuth 憑證時，先使用 Google Meet API `spaces.create` 端點。
沒有 OAuth 憑證時，會備援至釘選的 Chrome 節點瀏覽器。請確認：

- 對於 API 建立：已設定 `oauth.clientId` 與 `oauth.refreshToken`，
  或存在相符的 `OPENCLAW_GOOGLE_MEET_*` 環境變數。
- 對於 API 建立：重新整理權杖是在加入建立支援之後核發。較舊的權杖可能缺少
  `meetings.space.created` 範圍；請重新執行
  `openclaw googlemeet auth login --json` 並更新 Plugin 設定。
- 對於瀏覽器備援：`defaultTransport: "chrome-node"` 且
  `chromeNode.node` 指向已連線且具有 `browser.proxy` 與
  `googlemeet.chrome` 的節點。
- 對於瀏覽器備援：該節點上的 OpenClaw Chrome 設定檔已登入
  Google，並且可以開啟 `https://meet.google.com/new`。
- 對於瀏覽器備援：重試會在開啟新分頁之前，重用現有的 `https://meet.google.com/new`
  或 Google 帳戶提示分頁。如果 agent 逾時，請重試工具呼叫，而不是手動開啟另一個 Meet 分頁。
- 對於瀏覽器備援：如果工具回傳 `manualActionRequired: true`，請使用
  回傳的 `browser.nodeId`、`browser.targetId`、`browserUrl` 與
  `manualActionMessage` 引導操作員。不要在該動作完成前循環重試。
- 對於瀏覽器備援：如果 Meet 顯示「Do you want people to hear you in the
  meeting?」，請保持分頁開啟。OpenClaw 應該會透過瀏覽器自動化點擊 **Use microphone**，
  或針對僅建立備援點擊 **Continue without microphone**，並繼續等待產生的 Meet URL。
  如果無法做到，錯誤應提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### Agent 已加入但不說話

檢查即時路徑：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

一般 STT -> OpenClaw agent -> TTS 回話路徑請使用 `mode: "agent"`，
直接即時語音備援請使用 `mode: "bidi"`。`mode: "transcribe"`
刻意不啟動回話橋接器。若要進行僅觀察除錯，請在參與者說話後執行
`openclaw googlemeet status --json <session-id>`，並檢查 `captioning`、
`transcriptLines` 與 `lastCaptionText`。如果 `inCall` 為 true 但
`transcriptLines` 維持在 `0`，Meet 字幕可能已停用、自觀察者安裝後尚未有人說話、
Meet UI 已變更，或該會議語言/帳戶無法使用即時字幕。

`googlemeet test-speech` 一律檢查即時路徑，並回報該次呼叫是否觀察到
橋接器輸出位元組。如果 `speechOutputVerified` 為 false 且
`speechOutputTimedOut` 為 true，則即時提供者可能已接受話語，
但 OpenClaw 沒有看到新的輸出位元組到達 Chrome 音訊橋接器。

也請驗證：

- Gateway 主機上可使用即時提供者金鑰，例如
  `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主機上可看到 `BlackHole 2ch`。
- Chrome 主機上存在 `sox`。
- Meet 麥克風與喇叭透過 OpenClaw 使用的虛擬音訊路徑路由。
  對於本機 Chrome 即時加入，`doctor` 應顯示 `meet output routed: yes`。

`googlemeet doctor [session-id]` 會列印工作階段、節點、通話中狀態、
手動動作原因、即時提供者連線、`realtimeReady`、音訊輸入/輸出活動、
最後音訊時間戳、位元組計數器與瀏覽器 URL。需要原始 JSON 時，請使用
`googlemeet status [session-id] --json`。需要驗證 Google Meet OAuth 重新整理
且不暴露權杖時，請使用 `googlemeet doctor --oauth`；當你也需要
Google Meet API 證明時，請加上 `--meeting` 或 `--create-space`。

如果 agent 逾時，而你看得到已開啟的 Meet 分頁，請檢查該分頁，不要開啟另一個：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具動作是 `recover_current_tab`。它會聚焦並檢查所選傳輸的
現有 Meet 分頁。使用 `chrome` 時，它會透過 Gateway 使用本機
瀏覽器控制；使用 `chrome-node` 時，它會使用已設定的 Chrome 節點。
它不會開啟新分頁或建立新工作階段；它會回報目前的阻擋因素，例如登入、
准入、權限或音訊選擇狀態。CLI 命令會與已設定的 Gateway 通訊，
因此 Gateway 必須正在執行；`chrome-node` 也需要 Chrome 節點已連線。

### Twilio 設定檢查失敗

當 `voice-call` 不被允許或未啟用時，`twilio-voice-call-plugin` 會失敗。
請將它加入 `plugins.allow`、啟用 `plugins.entries.voice-call`，並重新載入
Gateway。

當 Twilio 後端缺少帳戶 SID、驗證權杖或來電號碼時，`twilio-voice-call-credentials`
會失敗。請在 Gateway 主機上設定這些項目：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

當 `voice-call` 沒有公開 Webhook 暴露，或 `publicUrl` 指向 loopback 或私有網路空間時，
`twilio-voice-call-webhook` 會失敗。請將
`plugins.entries.voice-call.config.publicUrl` 設為公開提供者 URL，
或設定 `voice-call` 通道/Tailscale 暴露。

Loopback 與私有 URL 對電信業者回呼無效。不要使用
`localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、
`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`。

若要取得穩定的公開 URL：

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

`voicecall smoke` 預設只檢查就緒狀態。若要對特定號碼執行試跑：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你有意要撥出即時外撥通知電話時，才加入 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話開始，但從未進入會議

確認 Meet 活動有公開電話撥入詳細資料。傳入精確的撥入號碼和 PIN，或自訂 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供者需要在輸入 PIN 前暫停，請在 `--dtmf-sequence` 中使用前置 `w` 或逗號。

如果電話通話已建立，但 Meet 名單從未顯示撥入參與者：

- 執行 `openclaw googlemeet doctor <session-id>`，確認委派的 Twilio 通話 ID、DTMF 是否已排入佇列，以及是否已要求開場問候。
- 執行 `openclaw voicecall status --call-id <id>`，並確認通話仍在進行中。
- 執行 `openclaw voicecall tail`，並檢查 Twilio Webhook 是否抵達 Gateway。
- 執行 `openclaw logs --follow`，並尋找 Twilio Meet 序列：Google Meet 委派加入，Voice Call 儲存並提供預連線 DTMF TwiML，Voice Call 為 Twilio 通話提供即時 TwiML，接著 Google Meet 使用 `voicecall.speak` 要求開場語音。
- 重新執行 `openclaw googlemeet setup --transport twilio`；綠色的設定檢查是必要條件，但不代表會議 PIN 序列正確。
- 確認撥入號碼與 PIN 屬於同一個 Meet 邀請和區域。
- 如果 Meet 回應緩慢，或通話逐字稿在送出預連線 DTMF 後仍顯示要求輸入 PIN 的提示，請從 12 秒預設值增加 `voiceCall.dtmfDelayMs`。
- 如果參與者已加入但你聽不到問候語，請在 `openclaw logs --follow` 中檢查 DTMF 後的 `voicecall.speak` 要求，以及媒體串流 TTS 播放或 Twilio `<Say>` 後備。如果通話逐字稿仍包含「enter the meeting PIN」，代表電話端尚未加入 Meet 會議室，因此會議參與者聽不到語音。

如果 Webhook 沒有抵達，請先偵錯 Voice Call Plugin：提供者必須能到達 `plugins.entries.voice-call.config.publicUrl` 或設定的通道。請參閱[語音通話疑難排解](/zh-TW/plugins/voice-call#troubleshooting)。

## 備註

Google Meet 的官方媒體 API 以接收為導向，因此若要在 Meet 通話中說話，仍需要一條參與者路徑。這個 Plugin 會讓該邊界保持可見：Chrome 處理瀏覽器參與和本機音訊路由；Twilio 處理電話撥入參與。

Chrome 回話模式需要 `BlackHole 2ch`，並加上下列其中一項：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 擁有橋接，並在這些命令與選定提供者之間以 `chrome.audioFormat` 傳送音訊。代理模式使用即時轉錄加一般 TTS；雙向模式使用即時語音提供者。預設 Chrome 路徑是 24 kHz PCM16，搭配 `chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 仍可供舊版命令配對使用。
- `chrome.audioBridgeCommand`：外部橋接命令擁有完整本機音訊路徑，且必須在啟動或驗證其常駐程式後結束。這只適用於 `bidi`，因為 `agent` 模式需要直接命令配對存取以進行 TTS。

當代理在代理模式中呼叫 `google_meet` 工具時，會議顧問工作階段會先分支呼叫者目前的逐字稿，再回答參與者語音。Meet 工作階段仍會保持獨立（`agent:<agentId>:subagent:google-meet:<sessionId>`），因此會議後續追問不會直接改變呼叫者逐字稿。

若要取得乾淨的雙工音訊，請透過不同的虛擬裝置或 Loopback 風格的虛擬裝置圖來路由 Meet 輸出和 Meet 麥克風。單一共享 BlackHole 裝置可能會把其他參與者的聲音回送到通話中。

使用命令配對 Chrome 橋接時，`chrome.bargeInInputCommand` 可以監聽獨立的本機麥克風，並在人類開始說話時清除助理播放。這可讓人類語音保持在助理輸出之前，即使共享的 BlackHole 迴送輸入在助理播放期間暫時被抑制也一樣。就像 `chrome.audioInputCommand` 和 `chrome.audioOutputCommand`，它是由操作員設定的本機命令。請使用明確受信任的命令路徑或引數清單，且不要將它指向來自不受信任位置的指令碼。

`googlemeet speak` 會觸發 Chrome 工作階段的作用中回話音訊橋接。`googlemeet leave` 會停止該橋接。對於透過 Voice Call Plugin 委派的 Twilio 工作階段，`leave` 也會掛斷底層語音通話。若你也想關閉 API 管理空間的作用中 Google Meet 會議，請使用 `googlemeet end-active-conference`。

## 相關

- [Voice call Plugin](/zh-TW/plugins/voice-call)
- [通話模式](/zh-TW/nodes/talk)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
