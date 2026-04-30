---
read_when:
    - 您想讓 OpenClaw 代理加入 Google Meet 通話
    - 您想讓 OpenClaw 代理建立新的 Google Meet 通話
    - 你正在將 Chrome、Chrome 節點或 Twilio 設定為 Google Meet 傳輸方式
summary: Google Meet Plugin：透過 Chrome 或 Twilio 加入明確的 Meet URL，並使用即時語音預設值
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-30T03:23:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw 的 Google Meet 參與者支援，是刻意設計為明確操作的 Plugin：

- 它只會加入明確的 `https://meet.google.com/...` URL。
- 它可以透過 Google Meet API 建立新的 Meet 空間，然後加入所
  傳回的 URL。
- `realtime` 語音是預設模式。
- 當需要更深入的推理或工具時，即時語音可以回呼完整的 OpenClaw 代理。
- 代理會使用 `mode` 選擇加入行為：使用 `realtime` 進行即時
  聆聽/回話，或使用 `transcribe` 加入/控制瀏覽器，而不使用
  即時語音橋接。
- 驗證一開始是個人 Google OAuth 或已登入的 Chrome 設定檔。
- 沒有自動同意公告。
- 預設 Chrome 音訊後端是 `BlackHole 2ch`。
- Chrome 可以在本機執行，也可以在配對的節點主機上執行。
- Twilio 接受撥入號碼，以及選用的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留給更廣泛的代理
  遠距會議工作流程。

## 快速開始

安裝本機音訊相依項目，並設定後端即時語音提供者。
OpenAI 是預設值；Google Gemini Live 也可搭配
`realtime.provider: "google"` 使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 會安裝 `BlackHole 2ch` 虛擬音訊裝置。Homebrew 的
安裝程式需要重新開機，macOS 才會公開此裝置：

```bash
sudo reboot
```

重新開機後，確認兩個項目：

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

設定輸出旨在可供代理讀取，並且會感知模式。它會回報 Chrome
設定檔、節點固定，以及針對即時 Chrome 加入的 BlackHole/SoX 音訊
橋接和延遲即時介紹檢查。若是僅觀察加入，請使用 `--mode transcribe`
檢查相同傳輸；該模式會略過即時音訊先決條件，因為它不會透過橋接
聆聽或發話：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

當已設定 Twilio 委派時，設定也會回報 `voice-call` Plugin 與 Twilio
認證是否就緒。在要求代理加入之前，請將任何 `ok: false` 檢查視為
所檢查傳輸與模式的阻斷因素。腳本或機器可讀輸出請使用
`openclaw googlemeet setup --json`。在代理嘗試之前，使用
`--transport chrome`、`--transport chrome-node` 或 `--transport twilio`
預先檢查特定傳輸。

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

- API 建立：在已設定 Google Meet OAuth 認證時使用。這是最具確定性的
  路徑，且不依賴瀏覽器 UI 狀態。
- 瀏覽器備援：在沒有 OAuth 認證時使用。OpenClaw 會使用固定的 Chrome
  節點、開啟 `https://meet.google.com/new`、等待 Google 重新導向到
  真正的會議代碼 URL，然後傳回該 URL。此路徑要求節點上的 OpenClaw
  Chrome 設定檔已登入 Google。瀏覽器自動化會處理 Meet 自己的首次執行
  麥克風提示；該提示不會被視為 Google 登入失敗。
  加入與建立流程也會嘗試在開啟新分頁前重用現有 Meet 分頁。比對會忽略
  `authuser` 等無害的 URL 查詢字串，因此代理重試時應聚焦已開啟的會議，
  而不是建立第二個 Chrome 分頁。

命令/工具輸出包含 `source` 欄位（`api` 或 `browser`），讓代理可以
說明使用了哪條路徑。`create` 預設會加入新會議，並傳回 `joined: true`
加上加入工作階段。若只要產生 URL，請在 CLI 使用 `create --no-join`，
或向工具傳遞 `"join": false`。

或者告訴代理：「建立一個 Google Meet，用即時語音加入，並把連結傳給我。」
代理應呼叫 `google_meet`，使用 `action: "create"`，然後分享傳回的
`meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

若要僅觀察/瀏覽器控制加入，請設定 `"mode": "transcribe"`。這不會啟動
雙工即時模型橋接，不需要 BlackHole 或 SoX，也不會在會議中回話。
此模式下的 Chrome 加入也會避開 OpenClaw 的麥克風/相機權限授予，
並避開 Meet **使用麥克風** 路徑。如果 Meet 顯示音訊選擇中介頁，
自動化會嘗試無麥克風路徑；否則會回報需要手動動作，而不是開啟
本機麥克風。

在即時工作階段期間，`google_meet` 狀態會包含瀏覽器與音訊橋接健康狀態，
例如 `inCall`、`manualActionRequired`、`providerConnected`、
`realtimeReady`、`audioInputActive`、`audioOutputActive`、最後輸入/輸出
時間戳記、位元組計數器，以及橋接關閉狀態。如果出現安全的 Meet 頁面
提示，瀏覽器自動化會在可行時處理它。登入、主持人准入，以及瀏覽器/OS
權限提示會被回報為需要手動動作，並附上原因和訊息供代理轉述。
受管理的 Chrome 工作階段只會在瀏覽器健康狀態回報 `inCall: true` 後
發出介紹或測試片語；否則狀態會回報 `speechReady: false`，並阻擋發話
嘗試，而不是假裝代理已在會議中說話。

本機 Chrome 會透過已登入的 OpenClaw 瀏覽器設定檔加入。即時模式需要
`BlackHole 2ch` 作為 OpenClaw 使用的麥克風/喇叭路徑。若要乾淨的雙工
音訊，請使用分離的虛擬裝置或 Loopback 風格的圖形；單一 BlackHole
裝置足以進行第一次冒煙測試，但可能會產生回音。

### 本機 Gateway + Parallels Chrome

如果只是要讓 VM 擁有 Chrome，你**不**需要在 macOS VM 內執行完整的
OpenClaw Gateway 或模型 API 金鑰。請在本機執行 Gateway 與代理，
然後在 VM 中執行節點主機。在 VM 上啟用一次隨附的 Plugin，讓節點
宣告 Chrome 命令：

各處執行的內容：

- Gateway 主機：OpenClaw Gateway、代理工作區、模型/API 金鑰、即時
  提供者，以及 Google Meet Plugin 設定。
- Parallels macOS VM：OpenClaw CLI/節點主機、Google Chrome、SoX、
  BlackHole 2ch，以及已登入 Google 的 Chrome 設定檔。
- VM 中不需要：Gateway 服務、代理設定、OpenAI/GPT 金鑰，或模型
  提供者設定。

安裝 VM 相依項目：

```bash
brew install blackhole-2ch sox
```

安裝 BlackHole 後重新啟動 VM，讓 macOS 公開 `BlackHole 2ch`：

```bash
sudo reboot
```

重新開機後，確認 VM 可以看到音訊裝置與 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中安裝或更新 OpenClaw，然後在其中啟用隨附的 Plugin：

```bash
openclaw plugins enable google-meet
```

在 VM 中啟動節點主機：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是 LAN IP，且你未使用 TLS，除非你為該受信任
私人網路選擇加入，否則節點會拒絕純文字 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

將節點安裝為 LaunchAgent 時，使用相同的環境變數：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是程序環境，而不是
`openclaw.json` 設定。當它出現在安裝命令上時，`openclaw node install`
會將它儲存在 LaunchAgent 環境中。

從 Gateway 主機核准節點：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

確認 Gateway 看得到節點，且該節點宣告 `googlemeet.chrome` 和瀏覽器
能力/`browser.proxy`：

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

或要求代理使用 `google_meet` 工具，並設定 `transport: "chrome-node"`。

若要進行一個命令的冒煙測試，以建立或重用工作階段、說出已知片語，
並列印工作階段健康狀態：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在即時加入期間，OpenClaw 瀏覽器自動化會填入訪客名稱、按一下
加入/要求加入，並在 Meet 首次執行的「使用麥克風」選項出現時接受它。
在僅觀察加入或僅瀏覽器建立會議期間，當無麥克風選項可用時，它會
在相同提示中選擇不使用麥克風並繼續。如果瀏覽器設定檔未登入、Meet
正在等待主持人准入、Chrome 需要即時加入的麥克風/相機權限，或 Meet
卡在自動化無法解決的提示上，加入/test-speech 結果會回報
`manualActionRequired: true`，並附上 `manualActionReason` 和
`manualActionMessage`。代理應停止重試加入、回報該確切訊息以及目前的
`browserUrl`/`browserTitle`，並只在手動瀏覽器動作完成後重試。

如果省略 `chromeNode.node`，OpenClaw 只會在恰好有一個已連線節點同時
宣告 `googlemeet.chrome` 和瀏覽器控制時自動選取。如果連線了多個具備
能力的節點，請將 `chromeNode.node` 設為節點 ID、顯示名稱或遠端 IP。

常見失敗檢查：

- `Configured Google Meet node ... is not usable: offline`：釘選的 Node
  已為 Gateway 所知，但目前無法使用。Agent 應將該 Node 視為診斷狀態，
  而不是可用的 Chrome 主機；除非使用者要求，否則應回報設定阻礙，
  而不是退回使用其他傳輸方式。
- `No connected Google Meet-capable node`：在 VM 中啟動 `openclaw node run`，
  核准配對，並確定已在 VM 中執行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。也請確認 Gateway 主機允許這兩個 Node 命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在接受檢查的主機上安裝 `blackhole-2ch`，
  並在使用本機 Chrome 音訊前重新開機。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安裝 `blackhole-2ch`，
  並重新啟動 VM。
- Chrome 已開啟但無法加入：登入 VM 內的瀏覽器設定檔，或保留
  `chrome.guestName` 設定以便以訪客身分加入。訪客自動加入會透過 Node
  瀏覽器代理使用 OpenClaw 瀏覽器自動化；請確定 Node 瀏覽器設定指向你想使用的
  設定檔，例如 `browser.defaultProfile: "user"` 或具名的既有工作階段設定檔。
- Meet 分頁重複：保持啟用 `chrome.reuseExistingTab: true`。OpenClaw
  會在開啟新分頁前，先啟用同一 Meet URL 的既有分頁；瀏覽器會議建立也會在開啟另一個分頁前，
  重用進行中的 `https://meet.google.com/new` 或 Google 帳戶提示分頁。
- 沒有音訊：在 Meet 中，將麥克風/喇叭透過 OpenClaw 使用的虛擬音訊裝置路徑路由；
  若要乾淨的雙向音訊，請使用分開的虛擬裝置或 Loopback 風格的路由。

## 安裝注意事項

Chrome 即時預設值會使用兩個外部工具：

- `sox`：命令列音訊工具。Plugin 會針對預設的 24 kHz PCM16 音訊橋接使用明確的
  CoreAudio 裝置命令。
- `blackhole-2ch`：macOS 虛擬音訊驅動程式。它會建立 `BlackHole 2ch`
  音訊裝置，供 Chrome/Meet 路由使用。

OpenClaw 不會內建或重新散布這兩個套件。文件會要求使用者透過 Homebrew
將它們安裝為主機相依項。SoX 的授權為 `LGPL-2.0-only AND GPL-2.0-only`；
BlackHole 為 GPL-3.0。如果你建置的安裝程式或設備會將 BlackHole 與 OpenClaw
一起封裝，請檢閱 BlackHole 的上游授權條款，或向 Existential Audio 取得個別授權。

## 傳輸方式

### Chrome

Chrome 傳輸方式會透過 OpenClaw 瀏覽器控制開啟 Meet URL，並以已登入的 OpenClaw
瀏覽器設定檔加入。在 macOS 上，Plugin 會在啟動前檢查 `BlackHole 2ch`。
若已設定，它也會在開啟 Chrome 前執行音訊橋接健康狀態命令與啟動命令。
當 Chrome/音訊位於 Gateway 主機上時使用 `chrome`；當 Chrome/音訊位於已配對的
Node（例如 Parallels macOS VM）上時使用 `chrome-node`。對於本機 Chrome，
使用 `browser.defaultProfile` 選擇設定檔；`chrome.browserProfile` 會傳遞給
`chrome-node` 主機。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

將 Chrome 麥克風與喇叭音訊透過本機 OpenClaw 音訊橋接路由。如果未安裝
`BlackHole 2ch`，加入會以設定錯誤失敗，而不是在沒有音訊路徑的情況下靜默加入。

### Twilio

Twilio 傳輸方式是委派給語音通話 Plugin 的嚴格撥號計畫。它不會解析 Meet
頁面來尋找電話號碼。

當 Chrome 參與不可用，或你想要電話撥入後備方案時，請使用這個方式。Google Meet
必須為會議公開電話撥入號碼與 PIN；OpenClaw 不會從 Meet 頁面探索這些資訊。

在 Gateway 主機上啟用語音通話 Plugin，而不是在 Chrome Node 上啟用：

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

透過環境或設定提供 Twilio 憑證。環境變數可避免機密進入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

啟用 `voice-call` 後重新啟動或重新載入 Gateway；Plugin 設定變更在重新載入前，
不會出現在已執行中的 Gateway 程序中。

接著驗證：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

當 Twilio 委派已接好時，`googlemeet setup` 會包含成功的
`twilio-voice-call-plugin` 與 `twilio-voice-call-credentials` 檢查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

當會議需要自訂序列時，請使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 與預檢

建立 Meet 連結時 OAuth 是選用的，因為 `googlemeet create` 可以退回使用瀏覽器自動化。
當你需要官方 API 建立、空間解析，或 Meet Media API 預檢時，請設定 OAuth。

Google Meet API 存取使用使用者 OAuth：建立 Google Cloud OAuth 用戶端、
請求必要的範圍、授權 Google 帳戶，然後將產生的重新整理權杖儲存在 Google Meet
Plugin 設定中，或提供 `OPENCLAW_GOOGLE_MEET_*` 環境變數。

OAuth 不會取代 Chrome 加入路徑。當你使用瀏覽器參與時，Chrome 與 Chrome-node
傳輸方式仍會透過已登入的 Chrome 設定檔、BlackHole/SoX，以及已連線的 Node 加入。
OAuth 只用於官方 Google Meet API 路徑：建立會議空間、解析空間，以及執行
Meet Media API 預檢。

### 建立 Google 憑證

在 Google Cloud Console 中：

1. 建立或選取 Google Cloud 專案。
2. 為該專案啟用 **Google Meet REST API**。
3. 設定 OAuth 同意畫面。
   - **Internal** 對 Google Workspace 組織最簡單。
   - **External** 適用於個人/測試設定；當應用程式處於 Testing 時，
     將每個會授權此應用程式的 Google 帳戶新增為測試使用者。
4. 新增 OpenClaw 要求的範圍：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 建立 OAuth 用戶端 ID。
   - 應用程式類型：**Web application**。
   - 授權重新導向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 複製用戶端 ID 與用戶端密鑰。

`meetings.space.created` 是 Google Meet `spaces.create` 所必需。
`meetings.space.readonly` 讓 OpenClaw 能將 Meet URL/代碼解析為空間。
`meetings.conference.media.readonly` 用於 Meet Media API 預檢與媒體工作；
Google 可能要求加入 Developer Preview 才能實際使用 Media API。
如果你只需要以瀏覽器為基礎的 Chrome 加入，請完全略過 OAuth。

### 產生重新整理權杖

設定 `oauth.clientId`，並可選擇設定 `oauth.clientSecret`，或以環境變數傳入，
然後執行：

```bash
openclaw googlemeet auth login --json
```

該命令會列印含有重新整理權杖的 `oauth` 設定區塊。它使用 PKCE、
`http://localhost:8085/oauth2callback` 上的 localhost 回呼，以及搭配
`--manual` 的手動複製/貼上流程。

範例：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

當瀏覽器無法連到本機回呼時，請使用手動模式：

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

如果你不希望重新整理權杖進入設定，請優先使用環境變數。若同時存在設定值與環境值，
Plugin 會先解析設定，再以環境作為後備。

OAuth 同意包含 Meet 空間建立、Meet 空間讀取存取權，以及 Meet 會議媒體讀取存取權。
如果你在會議建立支援存在前已完成驗證，請重新執行
`openclaw googlemeet auth login --json`，讓重新整理權杖具有
`meetings.space.created` 範圍。

### 使用 doctor 驗證 OAuth

當你需要快速、非機密的健康狀態檢查時，請執行 OAuth doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

這不會載入 Chrome 執行階段，也不需要已連線的 Chrome Node。它會檢查 OAuth
設定是否存在，以及重新整理權杖是否可產生存取權杖。JSON 報告只包含狀態欄位，
例如 `ok`、`configured`、`tokenSource`、`expiresAt` 和檢查訊息；
它不會列印存取權杖、重新整理權杖或用戶端密鑰。

常見結果：

| 檢查                 | 意義                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加上 `oauth.refreshToken`，或已快取的存取權杖。                  |
| `oauth-token`        | 已快取的存取權杖仍有效，或重新整理權杖已產生新的存取權杖。                            |
| `meet-spaces-get`    | 選用的 `--meeting` 檢查已解析既有 Meet 空間。                                          |
| `meet-spaces-create` | 選用的 `--create-space` 檢查已建立新的 Meet 空間。                                    |

若也要證明 Google Meet API 已啟用且具有 `spaces.create` 範圍，請執行具有副作用的建立檢查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 會建立拋棄式 Meet URL。當你需要確認 Google Cloud 專案已啟用
Meet API，且已授權帳戶具有 `meetings.space.created` 範圍時，請使用它。

若要證明既有會議空間的讀取存取權：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 與 `resolve-space` 會證明已授權 Google 帳戶可存取的
既有空間具有讀取存取權。這些檢查出現 `403` 通常表示 Google Meet REST API
已停用、已同意的重新整理權杖缺少必要範圍，或 Google 帳戶無法存取該 Meet 空間。
重新整理權杖錯誤表示需要重新執行 `openclaw googlemeet auth login --json`，
並儲存新的 `oauth` 區塊。

瀏覽器後備方案不需要 OAuth 憑證。在該模式中，Google 驗證來自所選 Node 上已登入的
Chrome 設定檔，而不是 OpenClaw 設定。

以下環境變數可作為後備接受：

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

在 Meet 建立會議記錄後，列出會議成品與出席紀錄：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 時，`artifacts` 和 `attendance` 預設會使用最新的會議記錄。若你想取得該會議保留的所有記錄，請傳入 `--all-conference-records`。

Calendar 查詢可以先從 Google Calendar 解析會議 URL，再讀取 Meet 成品：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 會在今天的 `primary` 行事曆中搜尋含有 Google Meet 連結的 Calendar 事件。使用 `--event <query>` 搜尋相符的事件文字，並使用 `--calendar <id>` 指定非主要行事曆。Calendar 查詢需要包含 Calendar events readonly 範圍的新 OAuth 登入。`calendar-events` 會預覽相符的 Meet 事件，並標記 `latest`、`artifacts`、`attendance` 或 `export` 會選擇的事件。

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

當 Google 為會議公開相關資料時，`artifacts` 會傳回會議記錄中繼資料，以及參與者、錄製內容、逐字稿、結構化逐字稿項目和智慧筆記資源中繼資料。大型會議可使用 `--no-transcript-entries` 略過項目查詢。`attendance` 會將參與者展開為參與者工作階段列，包含首次/最後出現時間、總工作階段時長、遲到/提早離開標記，並依已登入使用者或顯示名稱合併重複的參與者資源。傳入 `--no-merge-duplicates` 可讓原始參與者資源保持分開，傳入 `--late-after-minutes` 可調整遲到偵測，傳入 `--early-before-minutes` 可調整提早離開偵測。

`export` 會寫入一個資料夾，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 會記錄選定的輸入、匯出選項、會議記錄、輸出檔案、計數、權杖來源、使用過的 Calendar 事件，以及任何部分擷取警告。傳入 `--zip` 也會在資料夾旁寫入可攜式封存檔。傳入 `--include-doc-bodies` 可透過 Google Drive `files.export` 匯出連結的逐字稿和智慧筆記 Google Docs 文字；這需要包含 Drive Meet readonly 範圍的新 OAuth 登入。未使用 `--include-doc-bodies` 時，匯出只包含 Meet 中繼資料和結構化逐字稿項目。如果 Google 傳回部分成品失敗，例如智慧筆記清單、逐字稿項目或 Drive 文件本文錯誤，摘要和資訊清單會保留警告，而不是讓整個匯出失敗。使用 `--dry-run` 可擷取相同的成品/出席資料並列印資訊清單 JSON，而不建立資料夾或 ZIP。這在寫入大型匯出前很有用，或當 agent 只需要計數、選定記錄和警告時也很有用。

Agents 也可以透過 `google_meet` 工具建立相同的套件：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

設定 `"dryRun": true` 只傳回匯出資訊清單並略過檔案寫入。

針對真實保留的會議執行受防護的即時冒煙測試：

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

即時冒煙測試環境：

- `OPENCLAW_LIVE_TEST=1` 啟用受防護的即時測試。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代碼或 `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth 用戶端 ID。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供重新整理權杖。
- 選用：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和 `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用不含 `OPENCLAW_` 前綴的相同備用名稱。

基本成品/出席即時冒煙測試需要 `https://www.googleapis.com/auth/meetings.space.readonly` 和 `https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar 查詢需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive 文件本文匯出需要 `https://www.googleapis.com/auth/drive.meet.readonly`。

建立新的 Meet 空間：

```bash
openclaw googlemeet create
```

此命令會列印新的 `meeting uri`、來源和加入工作階段。使用 OAuth 憑證時，它會使用官方 Google Meet API。沒有 OAuth 憑證時，它會使用固定 Chrome 節點已登入的瀏覽器設定檔作為備用。Agents 可以使用 `google_meet` 工具搭配 `action: "create"`，在單一步驟中建立並加入。若只要建立 URL，請傳入 `"join": false`。

瀏覽器備用方案的 JSON 輸出範例：

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

如果瀏覽器備用方案在建立 URL 前遇到 Google 登入或 Meet 權限阻擋，Gateway 方法會傳回失敗回應，而 `google_meet` 工具會傳回結構化詳細資料，而不是純字串：

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

當 agent 看到 `manualActionRequired: true` 時，應回報 `manualActionMessage` 加上瀏覽器節點/分頁情境，並停止開啟新的 Meet 分頁，直到操作者完成瀏覽器步驟。

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

建立 Meet 預設會加入。Chrome 或 Chrome-node 傳輸仍需要已登入的 Google Chrome 設定檔，才能透過瀏覽器加入。如果設定檔已登出，OpenClaw 會回報 `manualActionRequired: true` 或瀏覽器備用方案錯誤，並要求操作者完成 Google 登入後再重試。

只有在確認你的 Cloud 專案、OAuth 主體和會議參與者已加入適用於 Meet 媒體 API 的 Google Workspace Developer Preview Program 後，才設定 `preview.enrollmentAcknowledged: true`。

## 設定

通用 Chrome 即時路徑只需要啟用 Plugin、BlackHole、SoX，以及後端即時語音供應商金鑰。OpenAI 是預設值；設定 `realtime.provider: "google"` 可使用 Google Gemini Live：

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
- `chromeNode.node`: `chrome-node` 的選用節點 ID/名稱/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：用於已登出的 Meet 訪客畫面的名稱
- `chrome.autoJoin: true`：透過 `chrome-node` 上的 OpenClaw 瀏覽器自動化，盡力填入訪客名稱並點按立即加入
- `chrome.reuseExistingTab: true`：啟用現有 Meet 分頁，而不是開啟重複分頁
- `chrome.waitForInCallMs: 20000`：在觸發即時介紹前，等待 Meet 分頁回報通話中
- `chrome.audioFormat: "pcm16-24khz"`：命令組音訊格式。只對仍輸出電話音訊的舊版/自訂命令組使用 `"g711-ulaw-8khz"`。
- `chrome.audioInputCommand`：從 CoreAudio `BlackHole 2ch` 讀取並以 `chrome.audioFormat` 寫入音訊的 SoX 命令
- `chrome.audioOutputCommand`：以 `chrome.audioFormat` 讀取音訊並寫入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：簡短語音回覆，較深入的答案使用 `openclaw_agent_consult`
- `realtime.introMessage`：即時橋接連線時的簡短語音就緒檢查；將其設為 `""` 可靜默加入
- `realtime.agentId`：`openclaw_agent_consult` 的選用 OpenClaw agent ID；預設為 `main`

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

`voiceCall.enabled` 預設為 `true`；使用 Twilio 傳輸時，它會將實際 PSTN 通話和 DTMF 委派給 Voice Call Plugin。如果未啟用 `voice-call`，Google Meet 仍可驗證並記錄撥號計畫，但無法撥出 Twilio 通話。

## 工具

Agents 可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

當 Chrome 在 Gateway 主機上執行時，使用 `transport: "chrome"`。當 Chrome 在配對節點上執行時，例如 Parallels VM，使用
`transport: "chrome-node"`。在這兩種情況下，即時模型與 `openclaw_agent_consult` 都會在
Gateway 主機上執行，因此模型憑證會保留在那裡。

使用 `action: "status"` 列出作用中的工作階段，或檢查工作階段 ID。使用
`action: "speak"` 搭配 `sessionId` 和 `message`，讓即時代理立即
說話。使用 `action: "test_speech"` 建立或重用工作階段、
觸發已知短語，並在 Chrome 主機可以回報時傳回 `inCall` 健全狀態。`test_speech` 一律強制使用 `mode: "realtime"`，如果被要求以
`mode: "transcribe"` 執行則會失敗，因為僅觀察工作階段刻意不能
發出語音。其 `speechOutputVerified` 結果是根據此測試呼叫期間即時音訊輸出
位元組數增加而定，因此重用的工作階段中較舊的音訊
不會算作新的成功語音檢查。使用 `action: "leave"` 將
工作階段標記為已結束。

`status` 會在可用時包含 Chrome 健全狀態：

- `inCall`：Chrome 看起來位於 Meet 通話中
- `micMuted`：盡力判斷的 Meet 麥克風狀態
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：
  瀏覽器設定檔需要手動登入、Meet 主持人准入、權限，或
  瀏覽器控制修復，語音才能運作
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：目前是否
  允許受管理的 Chrome 語音。`speechReady: false` 表示 OpenClaw 沒有
  將開場白/測試短語送入音訊橋接器。
- `providerConnected` / `realtimeReady`：即時語音橋接器狀態
- `lastInputAt` / `lastOutputAt`：最後一次從橋接器看到或傳送到橋接器的音訊

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 即時代理諮詢

Chrome 即時模式針對即時語音迴圈最佳化。即時語音
提供者會聽取會議音訊，並透過已設定的音訊橋接器說話。
當即時模型需要更深入的推理、目前資訊，或一般
OpenClaw 工具時，它可以呼叫 `openclaw_agent_consult`。

諮詢工具會在幕後使用最近的
會議逐字稿脈絡執行一般 OpenClaw 代理，並向即時
語音工作階段傳回精簡的口語回答。語音模型接著可以將該回答說回會議中。
它使用與 Voice Call 相同的共用即時諮詢工具。

預設情況下，諮詢會針對 `main` 代理執行。當
Meet 通道應諮詢專用的 OpenClaw 代理工作區、模型預設值、
工具政策、記憶體和工作階段歷史時，設定 `realtime.agentId`。

`realtime.toolPolicy` 控制諮詢執行：

- `safe-read-only`：公開諮詢工具，並將一般代理限制為
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
  `memory_get`。
- `owner`：公開諮詢工具，並讓一般代理使用正常的
  代理工具政策。
- `none`：不要向即時語音模型公開諮詢工具。

諮詢工作階段金鑰會依每個 Meet 工作階段限定範圍，因此後續諮詢呼叫
可在同一場會議期間重用先前的諮詢脈絡。

若要在 Chrome 完全加入通話後強制執行口語就緒檢查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整的加入並說話 smoke：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 即時測試檢查清單

在將會議交給無人值守代理之前，使用此序列：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

預期的 Chrome-node 狀態：

- `googlemeet setup` 全部為綠色。
- 當 Chrome-node 是預設傳輸或已釘選節點時，`googlemeet setup` 會包含 `chrome-node-connected`。
- `nodes status` 顯示所選節點已連線。
- 所選節點同時宣告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 分頁會加入通話，且 `test-speech` 傳回的 Chrome 健全狀態含有
  `inCall: true`。

對於遠端 Chrome 主機，例如 Parallels macOS VM，這是在更新 Gateway 或 VM 後最短的
安全檢查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

這會證明 Gateway Plugin 已載入、VM 節點已使用
目前權杖連線，且 Meet 音訊橋接器可用，然後代理才會開啟
真正的會議分頁。

對於 Twilio smoke，請使用公開電話撥入詳細資料的會議：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

預期的 Twilio 狀態：

- `googlemeet setup` 包含綠色的 `twilio-voice-call-plugin` 和
  `twilio-voice-call-credentials` 檢查。
- Gateway 重新載入後，CLI 中可使用 `voicecall`。
- 傳回的工作階段具有 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `googlemeet leave <sessionId>` 會掛斷委派的語音通話。

## 疑難排解

### 代理看不到 Google Meet 工具

確認 Gateway 設定中已啟用 Plugin，並重新載入 Gateway：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你剛剛編輯了 `plugins.entries.google-meet`，請重新啟動或重新載入 Gateway。
執行中的代理只會看到目前 Gateway
處理程序所註冊的 Plugin 工具。

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

節點必須已連線，並列出 `googlemeet.chrome` 加上 `browser.proxy`。
Gateway 設定必須允許那些節點命令：

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
`gateway token mismatch`，請使用目前的 Gateway
權杖重新安裝或重新啟動節點。對於 LAN Gateway，這通常表示：

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

### 瀏覽器開啟但代理無法加入

執行 `googlemeet test-speech` 並檢查傳回的 Chrome 健全狀態。如果它
回報 `manualActionRequired: true`，請向操作員顯示 `manualActionMessage`，
並停止重試，直到瀏覽器動作完成。

常見的手動動作：

- 登入 Chrome 設定檔。
- 從 Meet 主持人帳戶准入來賓。
- 當 Chrome 的原生權限提示出現時，授予 Chrome 麥克風/攝影機權限。
- 關閉或修復卡住的 Meet 權限對話框。

不要只因為 Meet 顯示「Do you want people to
hear you in the meeting?」就回報「未登入」。那是 Meet 的音訊選擇中介畫面；OpenClaw
會在可用時透過瀏覽器自動化點擊 **Use microphone**，並持續
等待真正的會議狀態。對於僅建立的瀏覽器備援，OpenClaw
可能會點擊 **Continue without microphone**，因為建立 URL 不需要
即時音訊路徑。

### 會議建立失敗

當已設定 OAuth 憑證時，`googlemeet create` 會先使用 Google Meet API `spaces.create` 端點。
沒有 OAuth 憑證時，它會退回到釘選的 Chrome 節點瀏覽器。請確認：

- 對於 API 建立：已設定 `oauth.clientId` 和 `oauth.refreshToken`，
  或存在相符的 `OPENCLAW_GOOGLE_MEET_*` 環境變數。
- 對於 API 建立：重新整理權杖是在加入建立支援之後
  產生。較舊的權杖可能缺少 `meetings.space.created` 範圍；請重新執行
  `openclaw googlemeet auth login --json` 並更新 Plugin 設定。
- 對於瀏覽器備援：`defaultTransport: "chrome-node"` 且
  `chromeNode.node` 指向已連線並具有 `browser.proxy` 和
  `googlemeet.chrome` 的節點。
- 對於瀏覽器備援：該節點上的 OpenClaw Chrome 設定檔已登入
  Google，並可開啟 `https://meet.google.com/new`。
- 對於瀏覽器備援：重試會在開啟新分頁之前，重用現有的 `https://meet.google.com/new`
  或 Google 帳戶提示分頁。如果代理逾時，
  請重試工具呼叫，而不是手動開啟另一個 Meet 分頁。
- 對於瀏覽器備援：如果工具傳回 `manualActionRequired: true`，請使用
  傳回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和
  `manualActionMessage` 來引導操作員。不要在該
  動作完成前循環重試。
- 對於瀏覽器備援：如果 Meet 顯示「Do you want people to hear you in the
  meeting?」，請保持分頁開啟。OpenClaw 應透過瀏覽器
  自動化點擊 **Use microphone**，或對於
  僅建立的備援點擊 **Continue without microphone**，並繼續等待產生的 Meet URL。如果它無法做到，
  錯誤應提到 `meet-audio-choice-required`，而不是 `google-login-required`。

### 代理加入但不說話

檢查即時路徑：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "realtime"` 進行聆聽/回話。`mode: "transcribe"` 刻意
不啟動雙工即時語音橋接器。`googlemeet test-speech`
一律檢查即時路徑，並回報是否觀察到該次呼叫的橋接器輸出位元組。
如果 `speechOutputVerified` 為 false 且
`speechOutputTimedOut` 為 true，則即時提供者可能已接受
發話內容，但 OpenClaw 沒有看到新的輸出位元組到達 Chrome 音訊
橋接器。

也請驗證：

- Gateway 主機上有可用的即時提供者金鑰，例如
  `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主機上可見 `BlackHole 2ch`。
- Chrome 主機上存在 `sox`。
- Meet 麥克風與喇叭已透過
  OpenClaw 使用的虛擬音訊路徑路由。

`googlemeet doctor [session-id]` 會列印工作階段、節點、通話中狀態、
手動動作原因、即時提供者連線、`realtimeReady`、音訊
輸入/輸出活動、最後音訊時間戳記、位元組計數器和瀏覽器 URL。
需要原始 JSON 時，使用 `googlemeet status [session-id]`。當你需要驗證 Google Meet OAuth 重新整理
且不暴露權杖時，使用
`googlemeet doctor --oauth`；當你也需要 Google Meet API 證明時，加入 `--meeting` 或 `--create-space`。

如果代理逾時，而你可以看到 Meet 分頁已經開啟，請檢查該分頁
而不要再開啟另一個：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具動作是 `recover_current_tab`。它會為所選傳輸聚焦並檢查
現有的 Meet 分頁。使用 `chrome` 時，它會透過 Gateway 使用本機
瀏覽器控制；使用 `chrome-node` 時，它會使用已設定的
Chrome 節點。它不會開啟新分頁或建立新工作階段；它會回報
目前的阻礙，例如登入、准入、權限，或音訊選擇狀態。
CLI 命令會與已設定的 Gateway 通訊，因此 Gateway 必須正在執行；
`chrome-node` 也需要 Chrome 節點已連線。

### Twilio 設定檢查失敗

`twilio-voice-call-plugin` 會在 `voice-call` 未被允許或未啟用時失敗。
將它加入 `plugins.allow`、啟用 `plugins.entries.voice-call`，然後重新載入
Gateway。

`twilio-voice-call-credentials` 會在 Twilio 後端缺少帳戶
SID、驗證權杖或來電顯示號碼時失敗。在 Gateway 主機上設定這些項目：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

接著重新啟動或重新載入 Gateway，並執行：

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 預設僅檢查就緒狀態。若要對特定號碼進行試跑：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你明確想要撥出即時的對外通知通話時，才加入 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通話開始但從未進入會議

確認 Meet 事件公開了電話撥入詳細資訊。傳入確切的撥入
號碼與 PIN，或自訂 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供者需要在輸入 PIN 前暫停，請在 `--dtmf-sequence` 中使用前置的 `w` 或逗號。

## 備註

Google Meet 的官方媒體 API 偏向接收，因此要在 Meet
通話中說話仍需要參與者路徑。此 Plugin 讓這個邊界保持清楚：
Chrome 處理瀏覽器參與和本機音訊路由；Twilio 處理
電話撥入參與。

Chrome 即時模式需要 `BlackHole 2ch`，並加上以下其中一項：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 擁有
  即時模型橋接，並以 `chrome.audioFormat` 在這些
  命令與選定的即時語音提供者之間傳送音訊。預設 Chrome 路徑是
  24 kHz PCM16；8 kHz G.711 mu-law 仍可用於舊版命令配對。
- `chrome.audioBridgeCommand`：外部橋接命令擁有整個本機
  音訊路徑，且必須在啟動或驗證其常駐程式後結束。

若要取得乾淨的雙工音訊，請將 Meet 輸出和 Meet 麥克風路由到不同的
虛擬裝置，或使用 Loopback 風格的虛擬裝置圖。單一共用的
BlackHole 裝置可能會將其他參與者的聲音回送進通話。

`googlemeet speak` 會觸發 Chrome
工作階段的作用中即時音訊橋接。`googlemeet leave` 會停止該橋接。對於透過 Voice Call Plugin 委派的 Twilio 工作階段，`leave` 也會掛斷底層語音通話。

## 相關

- [語音通話 Plugin](/zh-TW/plugins/voice-call)
- [交談模式](/zh-TW/nodes/talk)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
