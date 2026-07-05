---
read_when:
    - 你想讓 OpenClaw 代理程式加入 Google Meet 通話
    - 你想要 OpenClaw 代理建立新的 Google Meet 通話
    - 您正在將 Chrome、Chrome 節點或 Twilio 設定為 Google Meet 傳輸方式
summary: Google Meet 外掛：透過 Chrome 或 Twilio 加入明確的 Meet URL，並使用代理程式回話預設值
title: Google Meet 外掛
x-i18n:
    generated_at: "2026-07-05T11:30:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60b47f2a7bfb2e96a1f75daef4f130851e5190e3f600dd48c0675ec6a5cdc12a
    source_path: plugins/google-meet.md
    workflow: 16
---

`google-meet` 外掛會代表 OpenClaw 代理加入明確的 Meet URL。它刻意保持範圍狹窄：

- 它只加入 `https://meet.google.com/...` URL；絕不會從自行探索到的電話號碼撥入會議。
- `googlemeet create` 可以透過 Google Meet API（或瀏覽器後援）建立新的 Meet URL，並預設加入該會議。
- Chrome 參與會使用已登入的 Chrome 設定檔，也可選擇在配對的節點上執行。Twilio 參與會透過 [語音通話外掛](/zh-TW/plugins/voice-call) 撥打電話號碼加上 PIN/DTMF；它無法直接撥打 Meet URL。
- `mode: "agent"`（預設）會使用即時提供者轉錄參與者語音，將其路由到已設定的 OpenClaw 代理，並用一般 OpenClaw TTS 說出回答。`mode: "bidi"` 讓即時語音模型直接回答。`mode: "transcribe"` 以僅觀察方式加入，不回話。
- 外掛加入通話時，不會自動宣告同意聲明。
- 命令列介面命令是 `googlemeet`；`meet` 保留給更廣泛的代理電話會議工作流程。

## 快速開始

安裝本機音訊相依項，然後設定即時提供者金鑰。OpenAI 是 `agent` 模式的預設轉錄提供者；Google Gemini Live 可作為 `bidi` 模式的語音提供者：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` 會安裝 Chrome 路由使用的 `BlackHole 2ch` 虛擬音訊裝置。Homebrew 的安裝程式需要重新開機，macOS 才會公開該裝置：

```bash
sudo reboot
```

重新開機後，驗證兩個元件：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

啟用外掛：

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

檢查設定，然後加入：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

`setup` 輸出可由代理讀取，並且會感知模式/傳輸：它會回報 Chrome 設定檔、節點釘選，以及即時 Chrome 加入所需的 BlackHole/SoX 音訊橋接和延遲簡介檢查。僅觀察加入會略過即時前置需求：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

設定 Twilio 委派時，`setup` 也會回報 `voice-call`、Twilio 憑證和公開網路鉤子暴露是否就緒。在代理加入前，請將該傳輸/模式的任何 `ok: false` 檢查視為阻擋項。使用 `--json` 取得機器可讀輸出，並使用 `--transport chrome|chrome-node|twilio` 預先檢查特定傳輸：

```bash
openclaw googlemeet setup --transport twilio
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

在非 macOS 閘道主機上，`google_meet` 仍會顯示於成品、行事曆、設定、轉錄、Twilio 和 `chrome-node` 動作，但本機 Chrome 回話（`transport: "chrome"` 搭配 `mode: "agent"` 或 `"bidi"`）會在抵達音訊橋接前被封鎖，因為該路徑目前依賴 macOS `BlackHole 2ch`。請改用 `mode: "transcribe"`、Twilio 撥入，或 macOS `chrome-node` 主機。

### 建立會議

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` 有兩條路徑，會在結果的 `source` 欄位中回報：

- **`api`**：設定 Google Meet OAuth 憑證時使用。具決定性；不依賴瀏覽器 UI 狀態。
- **`browser`**：沒有 OAuth 憑證時使用。OpenClaw 會在已釘選的 Chrome 節點上開啟 `https://meet.google.com/new`，並等待 Google 重新導向到真正的會議代碼 URL；該節點上的 OpenClaw Chrome 設定檔必須已登入 Google。加入和建立都會先重用現有 Meet 分頁（或進行中的 `.../new` / Google 帳戶提示分頁），再開啟新分頁；分頁比對會忽略 `authuser` 這類無害的查詢字串。

`create` 預設會加入，並回傳 `joined: true` 加入工作階段。傳入 `--no-join`（命令列介面）或 `"join": false`（工具）只建立 URL。

對於透過 API 建立的會議室，請設定明確的存取政策，而不是繼承 Google 帳戶預設值：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | 誰可以不用敲門加入                                                  |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | 擁有 Meet URL 的任何人                                              |
| `TRUSTED`       | 主辦機構的受信任使用者、受邀外部使用者，以及撥入使用者              |
| `RESTRICTED`    | 僅受邀者                                                            |

這只適用於透過 API 建立的會議室，因此必須設定 OAuth。如果你是在此選項存在前完成驗證，請在 OAuth 同意畫面加入 `meetings.space.settings` 範圍後，重新執行 `openclaw googlemeet auth login --json`。

如果瀏覽器後援遇到 Google 登入或 Meet 權限阻擋，工具會回傳 `manualActionRequired: true`，並包含 `manualActionReason`、`manualActionMessage` 和 `browser.nodeId`/`browser.targetId`/`browserUrl`。回報該訊息，並停止開啟新的 Meet 分頁，直到操作員完成瀏覽器步驟。

### 僅觀察加入

設定 `"mode": "transcribe"` 以略過雙工即時橋接（不需要 BlackHole/SoX，也不回話）。轉錄模式的 Chrome 加入也會略過 OpenClaw 的麥克風/攝影機權限授予，以及 Meet **使用麥克風** 路徑；如果 Meet 顯示音訊選擇插頁，自動化會先嘗試 **不使用麥克風繼續**。此模式中的受管 Chrome 傳輸會盡力安裝 Meet 字幕觀察器。`googlemeet status --json` 和 `googlemeet doctor` 會回報 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`，以及 `recentTranscript` 尾端內容。

如需是/否聆聽探測：

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

它會以轉錄模式加入，等待新的字幕/轉錄活動，並回傳 `listenVerified`、`listenTimedOut`、手動動作欄位，以及目前的字幕健康狀態。

### 即時工作階段健康狀態

在回話工作階段期間，`google_meet` 狀態會回報 Chrome/音訊橋接健康狀態：`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後輸入/輸出時間戳記、位元組計數器，以及橋接已關閉狀態。受管 Chrome 工作階段只會在健康狀態回報 `inCall: true` 後說出簡介/測試短語；否則 `speechReady: false`，且語音嘗試會被封鎖，而不是靜默無動作。

本機 Chrome 會透過已登入的 OpenClaw 瀏覽器設定檔加入，且麥克風/喇叭路徑需要 `BlackHole 2ch`。單一 BlackHole 裝置足以做第一次煙霧測試，但可能產生回音；若要乾淨的雙工音訊，請使用分開的虛擬裝置或 Loopback 風格的圖形配置。

## 本機閘道 + Parallels Chrome

若只是要在 macOS VM 中提供 Chrome，不需要完整閘道或模型 API 金鑰。在本機執行閘道和代理；在 VM 中執行節點主機。

| 執行位置             | 內容                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| 閘道主機             | OpenClaw 閘道、代理工作區、模型/API 金鑰、即時提供者、Google Meet 外掛設定                     |
| Parallels macOS VM   | OpenClaw 命令列介面/節點主機、Chrome、SoX、BlackHole 2ch、已登入 Google 的 Chrome 設定檔        |
| VM 中不需要          | 閘道服務、代理設定、模型提供者設定                                                              |

安裝 VM 相依項、重新開機並驗證：

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中啟用外掛並啟動節點主機：

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是沒有 TLS 的 LAN IP，請為該受信任私人網路選擇加入：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

安裝為 LaunchAgent 時使用相同旗標（它是程序環境，若安裝命令中存在，會儲存在 LaunchAgent 環境中，而不是 `openclaw.json` 設定）：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

從閘道主機核准節點，然後確認它公告 `googlemeet.chrome` 和瀏覽器能力/`browser.proxy`：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

將 Meet 路由到該節點：

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

現在從閘道主機正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

如需單一命令煙霧測試來建立或重用工作階段、說出已知短語，並列印工作階段健康狀態：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在即時加入期間，瀏覽器自動化會填入訪客名稱、點擊加入/要求加入，並在 Meet 首次執行「使用麥克風」提示出現時接受它（或在僅觀察加入與僅瀏覽器建立會議期間選擇「不使用麥克風繼續」）。如果設定檔已登出、Meet 正在等待主持人准入、Chrome 需要麥克風/攝影機權限，或 Meet 卡在未解決提示上，結果會回報 `manualActionRequired: true`，並包含 `manualActionReason` 和 `manualActionMessage`。停止重試，回報該訊息以及 `browserUrl`/`browserTitle`，並只在手動動作完成後重試。

如果省略 `chromeNode.node`，OpenClaw 只會在剛好有一個已連線節點同時公告 `googlemeet.chrome` 和瀏覽器控制時自動選取；當有多個具備能力的節點連線時，請釘選 `chromeNode.node`（節點 id、顯示名稱或遠端 IP）。

### 常見失敗檢查

| 症狀                                                     | 修正                                                                                                                                                                                                                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | 固定的節點已知但無法使用。回報設定阻礙；除非被要求，否則不要靜默退回到另一種傳輸方式。                                                                                                                |
| `No connected Google Meet-capable node`                  | 在虛擬機器中執行 `openclaw node run`，核准配對，並在那裡執行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。確認 `gateway.nodes.allowCommands` 包含 `googlemeet.chrome` 和 `browser.proxy`。 |
| `BlackHole 2ch audio device not found`                   | 在被檢查的主機上安裝 `blackhole-2ch`，然後重新開機。                                                                                                                                                  |
| `BlackHole 2ch audio device not found on the node`       | 在虛擬機器中安裝 `blackhole-2ch`，然後重新啟動虛擬機器。                                                                                                                                              |
| Chrome 開啟但無法加入                                   | 登入虛擬機器中的瀏覽器設定檔，或保留 `chrome.guestName` 設定。訪客自動加入會透過節點瀏覽器代理使用 OpenClaw 瀏覽器自動化；將節點的 `browser.defaultProfile`（或具名既有工作階段設定檔）指向你想使用的設定檔。 |
| 重複的 Meet 分頁                                        | 保留 `chrome.reuseExistingTab: true`。OpenClaw 會先啟用相同 URL 的既有分頁，並且在開啟另一個分頁前，建立動作會重用進行中的 `.../new` 或 Google 帳戶提示分頁。                                        |
| 沒有音訊                                                 | 透過 OpenClaw 使用的虛擬音訊路徑路由 Meet 麥克風/喇叭；使用分離的虛擬裝置或 Loopback 風格路由，以取得乾淨的雙工音訊。                                                                                |

## 安裝注意事項

Chrome talk-back 預設使用兩個 OpenClaw 不隨附或重新散布的外部工具；請透過 Homebrew 將它們安裝為主機相依項：

- `sox`：命令列音訊工具。外掛會針對預設的 24 kHz PCM16 音訊橋接發出明確的 CoreAudio 裝置命令。
- `blackhole-2ch`：macOS 虛擬音訊驅動程式，提供 Chrome/Meet 路由通過的 `BlackHole 2ch` 裝置。

SoX 採用 `LGPL-2.0-only AND GPL-2.0-only` 授權；BlackHole 採用 GPL-3.0。若你建置的安裝程式或應用裝置將 BlackHole 與 OpenClaw 一起打包，請檢閱 BlackHole 的上游授權，或向 Existential Audio 取得個別授權。

## 傳輸方式

| 傳輸方式      | 使用時機                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/音訊位於閘道主機上                                                                    |
| `chrome-node` | Chrome/音訊位於已配對節點上（例如 Parallels macOS 虛擬機器）                                 |
| `twilio`      | 當無法透過 Chrome 參與時，透過 Voice Call 外掛使用電話撥入備援                               |

### Chrome

透過 OpenClaw 瀏覽器控制開啟 Meet URL，並以已登入的 OpenClaw 瀏覽器設定檔加入。在 macOS 上，外掛會在啟動前檢查 `BlackHole 2ch`，並在已設定時，於開啟 Chrome 前執行音訊橋接健康狀態/啟動命令。對本機 Chrome，使用 `browser.defaultProfile` 選擇設定檔；`chrome.browserProfile` 則會傳給 `chrome-node` 主機。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 麥克風/喇叭音訊會透過本機 OpenClaw 音訊橋接路由。如果未安裝 `BlackHole 2ch`，加入會因設定錯誤而失敗，而不是在沒有音訊路徑的情況下加入。

### Twilio

委派給 [Voice call 外掛](/zh-TW/plugins/voice-call)的嚴格撥號計畫。它不會解析 Meet 頁面中的電話號碼；Google Meet 必須為該會議公開電話撥入號碼和 PIN。

在閘道主機上啟用 Voice Call，而不是 Chrome 節點：

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

透過環境提供 Twilio 憑證，讓密鑰不進入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

如果 OpenAI 是即時語音提供者，請改用 `realtime.provider: "openai"` 搭配 `OPENAI_API_KEY`。

啟用 `voice-call` 後，重新啟動或重新載入閘道；外掛設定變更要到重新載入後才會生效。驗證：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

當 Twilio 委派已接好時，`googlemeet setup` 會包含 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 檢查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

使用 `--dtmf-sequence` 自訂序列，並以前置 `w` 或逗號在 PIN 前加入暫停：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和預檢

OAuth 對建立 Meet 連結而言是選用的，因為 `googlemeet create` 可以退回到瀏覽器自動化。為官方 API 建立、空間解析或 Meet Media API 預檢設定 OAuth。Chrome/Chrome-node 加入永遠不依賴 OAuth；無論如何，它們都使用已登入的 Chrome 設定檔、BlackHole/SoX，以及（對 `chrome-node`）已連線的節點。

### 建立 Google 憑證

在 Google Cloud Console 中：

<Steps>
<Step title="建立或選取專案">
</Step>
<Step title="啟用 Google Meet REST API">
</Step>
<Step title="設定 OAuth 同意畫面">
對 Google Workspace 組織而言，Internal 最簡單。External 適用於個人/測試設定；當應用程式處於 Testing 時，請將每個會授權它的 Google 帳戶加入為測試使用者。
</Step>
<Step title="加入要求的範圍">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`（Calendar 查詢）
- `https://www.googleapis.com/auth/drive.meet.readonly`（轉錄稿/智慧筆記文件本文匯出）

</Step>
<Step title="建立 OAuth 用戶端 ID">
應用程式類型 **Web application**。已授權的重新導向 URI：

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="複製用戶端 ID 和用戶端密鑰">
</Step>
</Steps>

`meetings.space.created` 是 `spaces.create` 所需。`meetings.space.readonly` 會將 Meet URL/代碼解析為空間。`meetings.space.settings` 讓 OpenClaw 能在透過 API 建立會議室時傳遞 `SpaceConfig` 設定，例如 `accessType`。`meetings.conference.media.readonly` 用於 Meet Media API 預檢和媒體工作；Google 可能會要求實際使用 Media API 時加入 Developer Preview。`calendar.events.readonly` 只在 `--today`/`--event` 行事曆查詢時需要。`drive.meet.readonly` 只在 `--include-doc-bodies` 匯出時需要。如果你只需要以瀏覽器為基礎的 Chrome 加入，請完全略過 OAuth。

### 產生重新整理權杖

設定 `oauth.clientId`，並視需要設定 `oauth.clientSecret`（或將它們作為環境變數傳入），然後執行：

```bash
openclaw googlemeet auth login --json
```

這會使用 `http://localhost:8085/oauth2callback` 上的 localhost 回呼執行 PKCE 流程，並列印含有重新整理權杖的 `oauth` 設定區塊。當瀏覽器無法連到本機回呼時，加入 `--manual` 使用複製/貼上流程：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 輸出：

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

將 `oauth` 物件儲存在外掛設定下：

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

當你不想把重新整理權杖放在設定中時，偏好使用環境變數；會先解析設定，然後才以環境作為備援。如果你在會議建立、行事曆查詢或文件本文匯出支援存在前就已驗證，請重新執行 `openclaw googlemeet auth login --json`，讓重新整理權杖涵蓋目前的範圍集合。

### 使用 doctor 驗證 OAuth

```bash
openclaw googlemeet doctor --oauth --json
```

這會檢查 OAuth 設定是否存在，以及重新整理權杖是否能產生存取權杖，而不載入 Chrome 執行階段或要求已連線節點。報告只包含狀態欄位（`ok`、`configured`、`tokenSource`、`expiresAt`、檢查訊息），絕不列印存取權杖、重新整理權杖或用戶端密鑰。

| 檢查                 | 意義                                                                             |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加上 `oauth.refreshToken`，或存在快取的存取權杖            |
| `oauth-token`        | 快取的存取權杖仍有效，或重新整理權杖已產生新的存取權杖                           |
| `meet-spaces-get`    | 選用的 `--meeting` 檢查已解析既有 Meet 空間                                      |
| `meet-spaces-create` | 選用的 `--create-space` 檢查已建立新的 Meet 空間                                 |

透過會產生副作用的建立檢查，證明 Meet API 已啟用且具備 `spaces.create` 範圍：

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

證明可讀取現有空間：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

這些檢查傳回 `403` 通常表示 Meet REST API 已停用、重新整理權杖缺少必要範圍，或 Google 帳戶無法存取該空間。重新整理權杖錯誤表示需要重新執行 `openclaw googlemeet auth login --json`，並儲存新的 `oauth` 區塊。

瀏覽器後援不需要 OAuth；該處的 Google 驗證來自所選節點上已登入的 Chrome 個人資料，而不是 OpenClaw 設定。

這些環境變數可作為後援接受：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 或 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 或 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 或 `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 或 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 或 `GOOGLE_MEET_PREVIEW_ACK`

### 解析、預檢與讀取成品

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet 建立會議記錄後：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 時，`artifacts` 和 `attendance` 預設會使用最新的會議記錄；傳入 `--all-conference-records` 可取得每個保留的記錄。

行事曆查詢會先從 Google Calendar 解析會議 URL，再讀取成品（需要包含 Calendar events readonly 範圍的重新整理權杖）：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 會在今天的 `primary` 行事曆中搜尋含有 Meet 連結的活動；`--event <query>` 會搜尋相符的活動文字；`--calendar <id>` 會指定非主要行事曆。`calendar-events` 會預覽相符活動，並標記 `latest`/`artifacts`/`attendance`/`export` 將選擇哪一個。

如果你已知道會議記錄 ID，可直接指定：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

關閉由 API 建立的空間房間：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

呼叫 `spaces.endActiveConference`，並且需要 OAuth，範圍為 `meetings.space.created`，且該空間需為已授權帳戶可管理。接受 Meet URL、會議代碼或 `spaces/{id}`，並先將其解析為 API 空間資源。這與 `googlemeet leave` 分開：`leave` 會停止 OpenClaw 的本機/工作階段參與；`end-active-conference` 會要求 Google Meet 結束該空間的進行中會議。

撰寫可讀報告：

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` 會在 Google 公開時，傳回會議記錄中繼資料，以及參與者、錄影、逐字稿、結構化逐字稿項目與智慧筆記資源中繼資料。`--no-transcript-entries` 會略過大型會議的項目查詢。`attendance` 會將參與者展開為參與者工作階段列，包含首次/最後出現時間、總工作階段時長、遲到/提早離開旗標，並依已登入使用者或顯示名稱合併重複的參與者資源；`--no-merge-duplicates` 會保留原始資源分開，`--late-after-minutes`/`--early-before-minutes` 可調整門檻。

`export` 會寫入包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json` 的資料夾。`manifest.json` 會記錄選擇的輸入、匯出選項、會議記錄、輸出檔案、計數、權杖來源、使用的任何 Calendar 活動，以及部分擷取警告。`--zip` 也會在資料夾旁寫入可攜式封存檔。`--include-doc-bodies` 會透過 Drive `files.export` 匯出連結的逐字稿/智慧筆記 Google Docs 文字（需要 Drive Meet readonly 範圍）；若未使用，匯出只會包含 Meet 中繼資料與結構化逐字稿項目。部分成品失敗（智慧筆記清單、逐字稿項目或文件本文錯誤）會將警告保留在摘要/資訊清單中，而不是讓整個匯出失敗。`--dry-run` 會擷取相同資料並列印資訊清單 JSON，不建立資料夾或 ZIP。

代理會透過 `google_meet` 工具使用相同動作（`export`、帶有 `accessType` 的 `create`、`end_active_conference`、`test_listen`）；請參閱[工具](#tool)。

### 即時煙霧測試

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| 變數                                                                                                                      | 用途                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | 啟用受保護的即時測試                                                   |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | 保留的 Meet URL、代碼或 `spaces/{id}`                                  |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | OAuth 用戶端 ID                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | 重新整理權杖                                                           |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | 選用；不含 `OPENCLAW_` 前綴的相同後援名稱也可使用                     |

基礎成品/出席煙霧測試需要 `meetings.space.readonly` 和 `meetings.conference.media.readonly`。行事曆查詢需要 `calendar.events.readonly`。Drive 文件本文匯出需要 `drive.meet.readonly`。

### 建立範例

```bash
openclaw googlemeet create
```

列印新的會議 URI、來源與加入工作階段。使用 OAuth 時會使用 Meet API；未使用時，會使用釘選 Chrome 節點的已登入個人資料。瀏覽器後援 JSON：

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

如果瀏覽器後援先遇到 Google 登入或 Meet 權限阻擋，`google_meet` 會傳回結構化詳細資料，而不是純字串：

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

API 建立 JSON：

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

建立預設會加入，但 Chrome/Chrome-node 仍需要已登入的 Google 個人資料，才能透過瀏覽器加入；如果已登出，OpenClaw 會回報 `manualActionRequired: true` 或瀏覽器後援錯誤，並要求操作員完成 Google 登入後再重試。

只有在確認你的 Cloud 專案、OAuth 主體與會議參與者皆已加入 Google Workspace Developer Preview Program for Meet media APIs 後，才設定 `preview.enrollmentAcknowledged: true`。

## 設定

常見的 Chrome 代理路徑只需要啟用外掛、BlackHole、SoX、即時提供者金鑰，以及已設定的 OpenClaw TTS 提供者：

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

### 預設值

| 鍵                                | 預設值                                   | 備註                                                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                       |
| `defaultMode`                     | `"agent"`                                | `"realtime"` 會被接受為 `"agent"` 的舊版別名；新的呼叫端應使用 `"agent"`                                                                                                                                              |
| `chromeNode.node`                 | 未設定                                   | `chrome-node` 的節點 id/名稱/IP；當可能連接多個具備能力的節點時為必要項目                                                                                                                                            |
| `chrome.launch`                   | `true`                                   | 為加入流程啟動 Chrome；只有在重用已開啟工作階段時才設為 `false`                                                                                                                                                       |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                       |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | 顯示在已登出狀態的 Meet 訪客畫面上                                                                                                                                                                                    |
| `chrome.autoJoin`                 | `true`                                   | 在 `chrome-node` 上盡力填入訪客名稱並點擊「立即加入」                                                                                                                                                                 |
| `chrome.reuseExistingTab`         | `true`                                   | 啟用既有 Meet 分頁，而不是開啟重複分頁                                                                                                                                                                                 |
| `chrome.waitForInCallMs`          | `20000`                                  | 等待 Meet 分頁回報已在通話中後，再觸發回話介紹                                                                                                                                                                        |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | 命令配對音訊格式；`"g711-ulaw-8khz"` 僅適用於會輸出電話音訊的舊版/自訂命令配對                                                                          |
| `chrome.audioBufferBytes`         | `4096`                                   | 產生的命令配對音訊命令所用的 SoX 處理緩衝區（SoX 預設 8192 位元組緩衝區的一半，可降低管線延遲）；值會限制為至少 17 位元組                                |
| `chrome.audioInputCommand`        | 產生的 SoX 命令                          | 從 CoreAudio `BlackHole 2ch` 讀取，並以 `chrome.audioFormat` 寫入音訊                                                                                                                                                  |
| `chrome.audioOutputCommand`       | 產生的 SoX 命令                          | 以 `chrome.audioFormat` 讀取音訊，並寫入 CoreAudio `BlackHole 2ch`                                                                                                                                                     |
| `chrome.bargeInInputCommand`      | 未設定                                   | 選用的本機麥克風命令，會寫入 signed 16-bit little-endian mono PCM，用於在助理播放期間偵測人工插話；適用於由閘道託管的命令配對橋接                       |
| `chrome.bargeInRmsThreshold`      | `650`                                    | 視為人工打斷的 RMS 音量                                                                                                                                                                                               |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | 視為人工打斷的峰值音量                                                                                                                                                                                                |
| `chrome.bargeInCooldownMs`        | `900`                                    | 重複清除打斷狀態之間的最短延遲                                                                                                                                                                                        |
| `mode`（每次請求）                | `"agent"`                                | 回話模式；請參閱[代理與雙向模式](#agent-and-bidi-modes)表格                                                                                                                                                          |
| `realtime.provider`               | `"openai"`                               | 當下方範圍限定欄位未設定時使用的相容性後備                                                                                                                                                                            |
| `realtime.transcriptionProvider`  | `"openai"`                               | `agent` 模式用於即時轉錄的提供者 id                                                                                                                                                                                   |
| `realtime.voiceProvider`          | 未設定                                   | `bidi` 模式用於直接即時語音的提供者 id；設為 `"google"` 可使用 Gemini Live，同時讓代理模式轉錄維持在 OpenAI。搭配 `realtime.model` 以選擇特定 Gemini Live 模型。 |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | 請參閱[代理與雙向模式](#agent-and-bidi-modes)                                                                                                                                                                        |
| `realtime.instructions`           | 簡短口語回覆指示                         | 指示模型簡短發話，並使用 `openclaw_agent_consult` 取得更深入的答案                                                                                                                                                    |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | 即時橋接連線時說一次；設為 `""` 可靜默加入                                                                                                                                                                           |
| `realtime.agentId`                | `"main"`                                 | `openclaw_agent_consult` 使用的 OpenClaw 代理 id                                                                                                                                                                      |
| `voiceCall.enabled`               | `true`                                   | 將 Twilio PSTN 通話、DTMF 與介紹問候委派給 Voice Call 外掛                                                                                                                                                            |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | 透過 Twilio 播放 PIN 衍生的 DTMF 序列前的前置等待時間                                                                                                                                                                 |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Voice Call 啟動 Twilio 通話段後，請求即時介紹問候前的延遲                                                                                                                                                             |

`chrome.audioBridgeCommand` 和 `chrome.audioBridgeHealthCommand` 讓外部橋接接管整個本機音訊路徑，而不是使用 `chrome.audioInputCommand`/`chrome.audioOutputCommand`；請參閱[備註](#notes)，了解哪些模式可以使用它們的限制。

舊版 `realtime.provider: "google"` 形狀已有 `openclaw doctor --fix` 遷移：當這些欄位尚未設定時，它會將該意圖移至 `realtime.voiceProvider: "google"` 加上 `realtime.transcriptionProvider: "openai"`。

### 選用覆寫

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
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs 同時用於代理模式的聆聽與發話：

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

持久的 Meet 語音來自 `messages.tts.providers.elevenlabs.speakerVoiceId`。啟用 TTS 模型覆寫時，代理回覆也可以使用每則回覆的 `[[tts:speakerVoiceId=... model=eleven_v3]]` 指令，但設定是會議的確定性預設值。加入時，記錄會顯示 `transcriptionProvider=elevenlabs`，且每則口語回覆都會記錄 `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`。

僅 Twilio 的設定：

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

使用 `voiceCall.enabled: true`（預設值）與 Twilio 傳輸時，Voice Call 會先放置 DTMF 序列，再開啟即時媒體串流，然後使用已儲存的介紹文字作為初始即時問候。如果未啟用 `voice-call`，Google Meet 仍可驗證並記錄撥號計畫，但無法放置 Twilio 通話。

## 工具

代理使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | 用途                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | 加入明確的 Meet URL                                                                               |
| `create`                | 建立空間（並預設加入）；支援 `accessType`/`entryPointAccess`                                      |
| `status`                | 列出作用中的工作階段，或依 `sessionId` 檢查其中一個                                               |
| `setup_status`          | 執行與 `googlemeet setup` 相同的檢查                                                              |
| `resolve_space`         | 透過 `spaces.get` 解析 URL/code/`spaces/{id}`                                                     |
| `preflight`             | 驗證 OAuth + 會議解析前置條件                                                                     |
| `latest`                | 尋找某場會議的最新會議記錄                                                                        |
| `calendar_events`       | 預覽含 Meet 連結的 Calendar 事件                                                                  |
| `artifacts`             | 列出會議記錄與參與者/錄影/逐字稿/智慧筆記中繼資料                                                |
| `attendance`            | 列出參與者與參與者工作階段                                                                        |
| `export`                | 寫入成品/出席/逐字稿/manifest 套件；設定 `"dryRun": true` 則只產生 manifest                       |
| `recover_current_tab`   | 聚焦/檢查現有 Meet 分頁，而不開啟新分頁                                                          |
| `leave`                 | 結束工作階段（對委派工作階段會掛斷底層 Twilio 通話）                                             |
| `end_active_conference` | 結束 API 管理空間中作用中的 Google Meet 會議                                                     |
| `speak`                 | 依指定的 `sessionId` 和 `message` 讓即時代理立即說話                                             |
| `test_speech`           | 建立/重用工作階段、觸發已知片語、回傳 Chrome 健康狀態                                            |
| `test_listen`           | 建立/重用僅觀察工作階段，等待字幕/逐字稿變動                                                     |

`test_speech` 一律強制使用 `mode: "agent"` 或 `"bidi"`，若要求以 `mode: "transcribe"` 執行則會失敗，因為僅觀察工作階段無法發出語音。其 `speechOutputVerified` 結果是根據該呼叫期間即時音訊輸出位元組增加來判定，因此重用含有舊音訊的工作階段不會算作新的檢查。

當 Chrome 在閘道主機上執行時使用 `transport: "chrome"`；當它在配對節點上執行時使用 `transport: "chrome-node"`。兩種情況下，模型提供者和 `openclaw_agent_consult` 都在閘道主機上執行，因此模型憑證會留在該處。`agent` 模式記錄會在橋接啟動時包含解析後的轉錄提供者/模型，並在每次合成回覆後包含 TTS 提供者/模型/語音/輸出格式/取樣率。原始 `mode: "realtime"` 仍作為 `mode: "agent"` 的舊版相容別名被接受，但不再於工具的 `mode` enum 中宣傳。

使用 API 後端房間和明確存取政策的 `create`：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

結束已知房間的作用中會議：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

在聲稱會議有用前先進行聆聽驗證：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

按需說話：

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

`status` 會在可用時包含 Chrome 健康狀態：

| 欄位                                                                  | 意義                                                                                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome 看起來位於 Meet 通話中                                                                                         |
| `micMuted`                                                            | 盡力判定的 Meet 麥克風狀態                                                                                            |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | 瀏覽器設定檔需要手動登入、Meet 主持人准入、權限，或在語音可運作前修復瀏覽器控制                                       |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | 受管 Chrome 語音現在是否允許；`speechReady: false` 表示 OpenClaw 未送出介紹/測試片語                                  |
| `providerConnected` / `realtimeReady`                                 | 即時語音橋接狀態                                                                                                      |
| `lastInputAt` / `lastOutputAt`                                        | 橋接最後看到/送出的音訊                                                                                               |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Meet 分頁的媒體輸出是否已主動路由到橋接的 BlackHole 裝置                                                              |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | 助理播放作用中時忽略的迴路輸入                                                                                        |

## 代理與 bidi 模式

| 模式    | 由誰決定答案                  | 語音輸出路徑                           | 使用時機                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 已設定的 OpenClaw 代理        | 一般 OpenClaw TTS 執行階段             | 你想要「我的代理在會議中」的行為                      |
| `bidi`  | 即時語音模型                  | 即時語音提供者音訊回應                 | 你想要最低延遲的對話式語音迴圈                        |

`agent` 模式：即時轉錄提供者會聽取會議音訊，最終參與者逐字稿會路由到已設定的 OpenClaw 代理，答案會透過一般 OpenClaw TTS 說出。鄰近的最終逐字稿片段會在諮詢前合併，因此一個口語回合不會產生多個過時的部分答案；在佇列中的助理音訊仍在播放時會抑制即時輸入，且最近類似助理的逐字稿回音會在諮詢前被忽略，避免 BlackHole 迴路讓代理回應自己的語音。

`bidi` 模式：即時語音模型會直接回答，並可呼叫 `openclaw_agent_consult` 以進行更深入推理、取得目前資訊，或使用一般 OpenClaw 工具。諮詢工具會在幕後執行一般 OpenClaw 代理，帶入最近的會議逐字稿脈絡，並回傳精簡的口語答案；在 `agent` 模式中，OpenClaw 會將該答案直接送到 TTS；在 `bidi` 模式中，即時語音模型可以把它說出來。它使用與 Voice Call 相同的共享諮詢機制。

預設情況下，諮詢會針對 `main` 代理執行；設定 `realtime.agentId` 可將 Meet 路徑指向專用代理工作區、模型預設值、工具政策、記憶體和工作階段歷史。代理模式諮詢會使用每場會議的 `agent:<id>:subagent:google-meet:<session>` 工作階段金鑰，因此後續問題會保留會議脈絡，同時繼承一般代理政策。當代理在代理模式中呼叫 `google_meet` 時，顧問工作階段會在回答參與者語音前分叉呼叫者目前的逐字稿；Meet 工作階段會保持分離，因此會議後續問題不會直接修改呼叫者逐字稿。

`realtime.toolPolicy` 控制諮詢執行：

| 政策             | 行為                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露諮詢工具；將一般代理限制為 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get`                     |
| `owner`          | 暴露諮詢工具；讓一般代理使用其正常工具政策                                                                                      |
| `none`           | 不向即時語音模型暴露諮詢工具                                                                                                    |

諮詢工作階段金鑰以每個 Meet 工作階段為範圍，因此後續諮詢呼叫會在同一場會議中重用先前的諮詢脈絡。

在 Chrome 完全加入後強制進行口語就緒檢查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整加入並說話煙霧測試：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 即時測試檢查清單

在將會議交給無人看管的代理前：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

預期的 Chrome-node 狀態：

- `googlemeet setup` 全部為綠色，且當 Chrome-node 是預設傳輸或已釘選節點時，會包含 `chrome-node-connected`。
- `nodes status` 顯示所選節點已連線，並宣告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 分頁加入，且 `test-speech` 回傳包含 `inCall: true` 的 Chrome 健康狀態。

對於 Parallels macOS VM 之類的遠端 Chrome 主機，更新閘道或 VM 後最短的安全檢查為：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

這會在代理開啟真實會議分頁前，證明閘道外掛已載入、VM 節點已用目前權杖連線，且 Meet 音訊橋接可用。

若要進行 Twilio 煙霧測試，請使用提供電話撥入詳細資料的會議：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

預期的 Twilio 狀態：

- `googlemeet setup` 包含綠色的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 檢查。
- 閘道重新載入後，命令列介面中可使用 `voicecall`。
- 回傳的工作階段具有 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 顯示在即時 TwiML 前提供 DTMF TwiML，接著是已排入初始問候語的即時橋接。
- `googlemeet leave <sessionId>` 會掛斷委派的語音通話。

## 疑難排解

### 代理看不到 Google Meet 工具

確認外掛已啟用並重新載入閘道；執行中的代理只會看到目前閘道程序註冊的外掛工具：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

在非 macOS 的 Gateway 主機上，`google_meet` 會保持可見，但本機 Chrome 回話動作會在抵達音訊橋接前被封鎖。請使用 `mode: "transcribe"`、Twilio 撥入，或 macOS `chrome-node` 主機，而不是預設的本機 Chrome 代理路徑。

### 沒有已連線且支援 Google Meet 的節點

在節點主機上：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 主機上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

節點必須已連線，並列出 `googlemeet.chrome` 與 `browser.proxy`；Gateway 設定也必須允許兩者：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 在 `chrome-node-connected` 失敗，或 Gateway 記錄回報 `gateway token mismatch`，請使用目前的 Gateway 權杖重新安裝或重新啟動節點：

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

### 瀏覽器已開啟，但代理無法加入

對僅觀察加入執行 `googlemeet test-listen`，或對即時加入執行 `googlemeet test-speech`，然後檢查傳回的 Chrome 健康狀態。如果任一者回報 `manualActionRequired: true`，請向操作者顯示 `manualActionMessage`，並停止重試直到瀏覽器動作完成。

常見手動動作：登入 Chrome 個人資料；從 Meet 主持帳號允許訪客加入；當原生提示出現時授予 Chrome 麥克風/攝影機權限；關閉或修復卡住的 Meet 權限對話框。

不要只因為 Meet 詢問「Do you want people to hear you in the meeting?」就回報「未登入」；那是 Meet 的音訊選擇過渡畫面。可用時，OpenClaw 會透過瀏覽器自動化點擊 **Use microphone**，並持續等待真正的會議狀態；對於僅建立的瀏覽器備援，它可能改為點擊 **Continue without microphone**，因為產生 URL 不需要即時音訊路徑。

### 會議建立失敗

設定 OAuth 時，`googlemeet create` 會使用 Meet API `spaces.create`，否則使用已固定的 Chrome 節點瀏覽器。確認：

- **API 建立**：`oauth.clientId` 和 `oauth.refreshToken`（或相符的 `OPENCLAW_GOOGLE_MEET_*` 環境變數）存在，且重新整理權杖是在加入建立支援後核發；較舊的權杖可能缺少 `meetings.space.created`，因此請重新執行 `openclaw googlemeet auth login --json`。
- **瀏覽器備援**：`defaultTransport: "chrome-node"` 與 `chromeNode.node` 指向具備 `browser.proxy` 和 `googlemeet.chrome` 的已連線節點；該節點上的 OpenClaw Chrome 個人資料已登入，且可以開啟 `https://meet.google.com/new`。
- **瀏覽器備援重試**：在開啟新分頁前，重用既有的 `.../new` 或 Google 帳號提示分頁；請重試工具呼叫，而不是手動再開一個分頁。
- **手動動作**：如果工具傳回 `manualActionRequired: true`，請使用 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 引導操作者；不要在迴圈中重試。
- **音訊選擇過渡畫面**：如果 Meet 顯示「Do you want people to hear you in the meeting?」，請保持分頁開啟。OpenClaw 應點擊 **Use microphone** 或（僅建立時）**Continue without microphone**，並持續等待產生的 URL；如果無法做到，錯誤應提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### 代理加入但不說話

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

對 STT -> OpenClaw 代理 -> TTS 路徑使用 `mode: "agent"`，對直接即時語音備援使用 `mode: "bidi"`。`mode: "transcribe"` 會刻意不啟動回話橋接。若要僅觀察除錯，請在參與者說話後執行 `openclaw googlemeet status --json <session-id>`，並檢查 `captioning`、`transcriptLines`、`lastCaptionText`。如果 `inCall` 為 true 但 `transcriptLines` 維持 `0`，可能是 Meet 字幕已停用、觀察器安裝後沒有人說話、Meet UI 已變更，或該會議語言/帳號不支援即時字幕。

`googlemeet test-speech` 一律檢查即時路徑，並回報該次叫用是否觀察到橋接輸出位元組。如果 `speechOutputVerified` 為 false 且 `speechOutputTimedOut` 為 true，即時提供者可能已接受該語句，但 OpenClaw 未看到新的輸出位元組抵達 Chrome 音訊橋接。

另請確認：Gateway 主機上有可用的即時提供者金鑰（`OPENAI_API_KEY` 或 `GEMINI_API_KEY`）；Chrome 主機上可見 `BlackHole 2ch`；該處存在 `sox`；Meet 麥克風/喇叭透過虛擬音訊路徑路由（對本機 Chrome 即時加入，`doctor` 應顯示 `meet output routed: yes`）。

`googlemeet doctor [session-id]` 會印出工作階段、節點、通話中狀態、手動動作原因、即時提供者連線、`realtimeReady`、音訊輸入/輸出活動、最後音訊時間戳記、位元組計數器，以及瀏覽器 URL。使用 `googlemeet status [session-id] --json` 取得原始 JSON，並使用 `googlemeet doctor --oauth`（加入 `--meeting` 或 `--create-space`）驗證 OAuth 重新整理且不暴露權杖。

如果代理逾時且 Meet 分頁已開啟，請檢查它，不要再開另一個分頁：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具動作是 `recover_current_tab`：它會針對選取的傳輸（`chrome` 使用本機瀏覽器控制，`chrome-node` 使用已設定的節點）聚焦並檢查既有 Meet 分頁，而不開啟新分頁或工作階段，並回報目前的阻礙（登入、允許加入、權限、音訊選擇狀態）。命令列介面命令會與已設定且必須正在執行的 Gateway 通訊；`chrome-node` 也需要節點已連線。

### Twilio 設定檢查失敗

當 `voice-call` 不被允許或未啟用時，`twilio-voice-call-plugin` 會失敗：將它加入 `plugins.allow`、啟用 `plugins.entries.voice-call`，然後重新載入 Gateway。

當 Twilio 後端缺少帳號 SID、驗證權杖或來電號碼時，`twilio-voice-call-credentials` 會失敗：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

當 `voice-call` 沒有公開網路鉤子暴露，或 `publicUrl` 指向 loopback/私人網路空間時，`twilio-voice-call-webhook` 會失敗。不要將 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 作為 `publicUrl`；電信業者回呼無法到達這些位置。請將 `plugins.entries.voice-call.config.publicUrl` 設為公開 URL，或設定通道/Tailscale 暴露：

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

重新啟動或重新載入 Gateway，然後：

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 預設僅檢查就緒狀態。對特定號碼做試執行：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在刻意撥出即時外撥電話時才加入 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話開始但從未進入會議

確認 Meet 事件公開電話撥入詳細資訊，並傳入精確的撥入號碼加 PIN，或自訂 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

在 `--dtmf-sequence` 中使用前置 `w` 或逗號，以便在 PIN 前暫停。

如果已建立通話，但 Meet 名單從未顯示撥入參與者：

- `openclaw googlemeet doctor <session-id>`：確認委派的 Twilio 通話 ID、DTMF 是否已排入佇列，以及是否要求播放開場問候。
- `openclaw voicecall status --call-id <id>`：確認通話仍在作用中。
- `openclaw voicecall tail`：確認 Twilio 網路鉤子正在抵達 Gateway。
- `openclaw logs --follow`：尋找 Twilio Meet 序列：Google Meet 委派加入、Voice Call 儲存並提供連線前 DTMF TwiML、Voice Call 為 Twilio 通話提供即時 TwiML，然後 Google Meet 透過 `voicecall.speak` 要求開場語音。
- 重新執行 `openclaw googlemeet setup --transport twilio`；綠色設定檢查是必要條件，但無法證明會議 PIN 序列正確。
- 確認撥入號碼屬於與 PIN 相同的 Meet 邀請與區域。
- 如果 Meet 接聽很慢，或通話轉錄仍在傳送連線前 DTMF 後顯示 PIN 提示，請從 12 秒預設值增加 `voiceCall.dtmfDelayMs`。
- 如果參與者已加入但聽不到問候，請檢查 `openclaw logs --follow` 中的 DTMF 後 `voicecall.speak` 要求，以及媒體串流 TTS 播放或 Twilio `<Say>` 備援。如果轉錄仍顯示「enter the meeting PIN」，電話端尚未加入 Meet 房間，因此參與者不會聽到語音。

如果網路鉤子未抵達，請先除錯 Voice Call 外掛：提供者必須能到達 `plugins.entries.voice-call.config.publicUrl` 或已設定的通道。請參閱[語音通話疑難排解](/zh-TW/plugins/voice-call#troubleshooting)。

## 注意事項

Google Meet 的官方媒體 API 偏向接收，因此在通話中說話仍需要參與者路徑。此 Plugin 會讓該邊界保持可見：Chrome 處理瀏覽器參與與本機音訊路由；Twilio 處理電話撥入參與。

Chrome 回話模式需要 `BlackHole 2ch`，外加以下其中一項：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 擁有橋接，並在這些命令與所選提供者之間以 `chrome.audioFormat` 管線傳送音訊。`agent` 模式使用即時轉錄加一般 TTS；`bidi` 模式使用即時語音提供者。預設路徑是 24 kHz PCM16，搭配 `chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 仍可供舊版命令配對使用。
- `chrome.audioBridgeCommand`：外部橋接命令擁有整個本機音訊路徑，且必須在啟動或驗證其常駐程式後結束。僅對 `bidi` 有效，因為 `agent` 模式需要直接命令配對存取以供 TTS 使用。

使用命令配對 Chrome 橋接時，`chrome.bargeInInputCommand` 可以監聽獨立的本機麥克風，並在人類開始說話時清除助理播放，即使共享的 BlackHole loopback 輸入在助理播放期間暫時受到抑制，也能讓人類語音優先於助理輸出。與 `chrome.audioInputCommand`/`chrome.audioOutputCommand` 一樣，它是操作者設定的本機命令：請使用明確受信任的命令路徑或引數清單，絕不要使用來自不受信任位置的指令碼。

若要取得乾淨的雙工音訊，請將 Meet 輸出與 Meet 麥克風路由到不同的虛擬裝置，或路由到 Loopback 風格的虛擬裝置圖；單一共享的 BlackHole 裝置可能會將其他參與者的聲音回音到通話中。

`googlemeet speak` 會觸發 Chrome 工作階段的主動回話音訊橋接；`googlemeet leave` 會停止它（並且對於透過 Voice Call 委派的 Twilio 工作階段，會掛斷底層通話）。使用 `googlemeet end-active-conference` 也可關閉 API 管理空間的作用中 Google Meet 會議。

## 相關

- [Voice call 外掛](/zh-TW/plugins/voice-call)
- [交談模式](/zh-TW/nodes/talk)
- [建置外掛](/zh-TW/plugins/building-plugins)
