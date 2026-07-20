---
read_when:
    - 你想要建立推論服務，然後使用 OpenClaw 完成設定
summary: '`openclaw onboard` 的命令列介面參考（互動式初始設定）'
title: 新手設定
x-i18n:
    generated_at: "2026-07-20T11:43:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eccc133f136c119b832cdf3c492983b1581d1f008b94b3419bcd7ef025043cd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

以推論為優先的引導式設定：它會偵測現有的 AI 存取方式、
要求完成一次即時回應、只儲存可用的路由，接著啟動
OpenClaw 以設定其餘項目。`openclaw setup` 會在全新
系統或提供任何初始設定選項時進入此流程；已設定的系統使用
不帶參數的 `openclaw setup` 進行系統代理程式聊天。`openclaw setup --baseline` 只會
寫入基準設定／工作區。

<CardGroup cols={2}>
  <Card title="命令列介面初始設定中心" href="/zh-TW/start/wizard" icon="rocket">
    互動式命令列介面流程的逐步說明。
  </Card>
  <Card title="初始設定概覽" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 初始設定各部分如何協同運作。
  </Card>
  <Card title="命令列介面設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制及各步驟的行為。
  </Card>
  <Card title="命令列介面自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標及指令碼設定。
  </Card>
  <Card title="macOS 應用程式初始設定" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列應用程式的初始設定流程。
  </Card>
</CardGroup>

## 範例

```bash
openclaw onboard
openclaw onboard --tui
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard recommendations --json
openclaw onboard recommendations acknowledge
openclaw onboard recommendations acknowledge --retry "<failed-id>"
openclaw onboard recommendations refresh
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`openclaw onboard recommendations` 會讀取初始設定期間儲存的待處理應用程式推薦配對。
加入 `--json`，即可取得首次執行啟動程序所用的機器可讀清單。
此命令不會重新掃描已安裝的應用程式，也不會呼叫模型。其輸出僅包含
經驗證的安裝 ID、來源與層級；它會刻意省略不受信任的市集說明文字、
模型理由及本機應用程式標籤。回應推薦提示後，此命令會傳回空白清單，
而日後的初始設定執行會完全略過此步驟。
`openclaw onboard recommendations refresh` 會清除已儲存的提示，讓下一次初始設定執行重新掃描
已安裝的應用程式並建立新的提示。

全新工作區會將推薦選擇延後到啟動程序對話。
該對話處理使用者的選擇後，
`openclaw onboard recommendations acknowledge` 會將已儲存的提示標記為已回應。
確認操作具冪等性。若選定的安裝失敗，請透過 `--retry <id...>`
傳入每個失敗的不透明 ID；成功及遭拒的配對會被消耗，而失敗的配對會保留
為待處理狀態，供日後的初始設定執行使用。未知 ID 會導致失敗，且不會變更
已儲存的提示。ClawHub skill 安裝中斷後，現有目標只有在
`openclaw skills verify "@owner/slug"` 對相同的發布者限定推薦 ID 執行成功，
且其 JSON 輸出回報 `openclaw.resolution.source: "installed"` 時，才算安裝成功。
只完成登錄檔驗證並不能證明已在本機安裝。否則，請使用
`--retry` 將該 ID 保留為待處理狀態，且不要覆寫現有的 skill。

- `--classic`：開啟完整的逐步精靈。無法與
  `--non-interactive` 搭配使用；自動化設定請省略 `--classic`。
- `--flow quickstart`：以最少提示開啟傳統精靈，並
  自動產生閘道權杖。
- `--flow manual`（別名 `advanced`）：開啟傳統精靈，並完整提示
  連接埠、繫結及驗證設定。
- `--flow import`：執行偵測到的遷移提供者（例如透過 `--import-from hermes` 使用 Hermes）、預覽計畫，接著在確認後套用。匯入只能針對全新的 OpenClaw 設定執行——若已有任何設定、認證資訊、工作階段或工作區狀態，請先重設。乾跑計畫、覆寫模式、報告及精確對應請參閱 [`openclaw migrate`](/zh-TW/cli/migrate)。
- `--remote-url` 和 `--remote-token`：預先填入傳統遠端閘道步驟，並在本次執行中覆寫已儲存的遠端值。變更 URL 不會重複使用已儲存的認證資訊，除非你也傳入權杖。權杖在提示中會維持遮蔽，並遵循精靈現有的純文字或 SecretRef 儲存選擇。
- `--tailscale-reset-on-exit` 和 `--no-tailscale-reset-on-exit`：明確控制閘道結束時，是否重設 Tailscale Serve 或 Funnel 設定。兩者皆省略時，非互動式重新執行期間會保留目前設定。
- `--modern` 是 OpenClaw 對話式設定
  助理的相容性別名。它使用與 `openclaw setup` 相同的即時推論關卡，且
  僅接受 `--workspace`、`--accept-risk`、
  `--non-interactive` 和 `--json`。其他設定旗標會遭到拒絕，而不會
  被無聲忽略。

## 引導式流程

不帶參數的 `openclaw onboard` 會啟動引導式流程。它會顯示安全性通知，
接著先詢問一個問題：**完整存取權**（建議——設定程序會自動尋找
AI 應用程式、金鑰及本機執行環境）或**先詢問**（設定程序會在
查看系統前詢問一次，或讓你手動設定）。此選擇會儲存為
`wizard.accessMode`。允許探索時，初始設定會偵測已透過設定的模型、
API 金鑰環境變數及支援的本機命令列介面提供的 AI 存取方式，接著以
一次實際回應測試建議的候選項目。若候選項目失敗，初始設定會靜默嘗試
下一個可用項目，並以單行摘要列出所有沒有回應的項目；系統會公布可用的
路由，並提供按一下按鍵即可改為查看所有其他項目的選項。

若自動偵測已用盡所有選項，提供者選擇器會先顯示 OpenAI、
Anthropic、xAI（Grok）、Google 及 OpenRouter。選擇**更多…**即可查看
其他所有支援的提供者，並按提供者分組；接著會在第二個選單中顯示地區、
方案及驗證方法。支援的瀏覽器或裝置登入方式，以及遮蔽的 API 金鑰或
權杖方法，都會使用相同的即時回應路徑。只有在測試成功後，OpenClaw
才會儲存已驗證的模型路由及其認證資訊；失敗的候選項目不會取代已設定的
模型，也不會儲存嘗試使用的認證資訊。選擇**暫時略過**可退出且不啟動
OpenClaw，準備好後再重新執行 `openclaw onboard`。在 OpenClaw 啟動前，
工作區和閘道設定會維持不變。

在引導式模式中，`--workspace <dir>` 會提供 OpenClaw 建議的工作區
及隔離的推論環境。在你核准 OpenClaw 設定提案前，不會儲存這些項目。
傳統及非互動式初始設定會透過其一般設定流程儲存工作區。

推論通過後，初始設定會檢查支援的本機 AI 工具中是否有記憶：
Claude Code 自動記憶、Codex 整合記憶及 Hermes 記憶檔案。
找到任何記憶時，單一頁面會提供將其複製到代理程式工作區
`memory/imports/` 下方的選項，以便建立索引並供日後回想。未經確認
不會匯入任何內容，先前匯入的檔案會略過，而且你隨時可以稍後從 Control UI
的[記憶匯入頁面](/zh-TW/web/control-ui)匯入；該頁面提供相同的僅限記憶範圍。
（完整執行 [`openclaw migrate`](/zh-TW/cli/migrate) 的範圍更廣：它也可以匯入
設定、skill 及認證資訊。）傳統精靈會在準備工作區後顯示相同頁面。

推論通過（且顯示記憶匯入提示）後，引導式初始設定會自動
套用標準設定——工作區、閘道及工作階段，也就是對話式
`openclaw setup` 聊天在回覆「是」時會套用的相同計畫——
接著根據已安裝的應用程式提供外掛及 skill 推薦；應用程式名稱會透過
你設定的模型及 ClawHub 搜尋進行比對，而此步驟可使用
[`wizard.appRecommendations`](/zh-TW/gateway/configuration-reference#wizard)停用。
在 macOS、Linux 或 Windows 桌面工作階段中，接著會開啟已驗證的
Control UI 儀表板，並等待最多 60 秒讓瀏覽器用戶端連線。
在無頭 Linux 或透過 SSH 執行時，它會顯示醒目、可複製貼上的儀表板
URL；若閘道使用回送介面，還會包含 SSH 連接埠轉送命令，並等待最多
五分鐘。連線成功後會在瀏覽器中繼續；無法連線的閘道或逾時會退回與先前
相同的終端替代路徑。傳入 `--tui` 可略過瀏覽器移交，並強制
使用該終端替代路徑。若套用設定失敗，初始設定會退回對話式 OpenClaw
聊天，以互動方式完成設定。頻道、代理程式、
外掛及其他選用功能仍由 OpenClaw 聊天處理：執行
`openclaw`，並使用 `open channel wizard for <channel>` 將頻道
認證資訊收集工作交給遮蔽輸入的終端精靈。若要變更模型
提供者或其驗證方式，請退出 OpenClaw 並執行 `openclaw onboard`；
OpenClaw 不會開啟引導式或傳統提供者流程。

在已設定的安裝環境中，再次執行 `openclaw onboard` 會先驗證目前的
預設模型，因此相同流程可作為驗證及修復程序——
它不會重新套用設定、重新安裝或重新啟動閘道服務。
若該檢查失敗，系統絕不會自動取代已設定的模型——
初始設定會停止並詢問要如何繼續。此檢查在工作區外執行，
因此由工作區外掛提供的模型可能會在此處失敗，但仍可在代理程式中運作。
若要進行提供者特定驗證、設定頻道、skill、
遠端閘道設定、匯入或完整閘道控制，請使用 `openclaw onboard --classic`。
若要進行非推論的對話式設定及修復，請執行 `openclaw setup`；
`openclaw onboard
--modern` 是通過相同推論關卡的相容性別名。傳統
精靈可選擇使用即時回應驗證預設模型，但只有在 OpenClaw 自己的
即時推論檢查通過後，才會啟動 OpenClaw。

在互動式終端中，不帶子命令的 `openclaw` 會依設定
狀態決定路由：

- 若使用中的設定檔遺失或沒有使用者編寫的設定（空白或
  僅含中繼資料），它會啟動引導式初始設定。
- 若設定檔存在但未通過驗證，它會啟動傳統
  初始設定路徑並提供 `openclaw doctor` 指引。OpenClaw 需要可用的
  推論功能，因此不會用於修復此推論前狀態。
- 若設定檔有效，它會開啟一般的代理程式終端介面。若可連線的
  已設定閘道具備代理程式及模型，便會直接進入該介面，不會執行
  初始設定或 OpenClaw。在已設定的安裝環境中，可在終端介面內使用
  `/openclaw` 或使用 `openclaw setup` 進入 OpenClaw。

純文字 `ws://` 可用於回送介面、私有 IP 常值、
`.local` 及 Tailnet `*.ts.net` 閘道 URL。
若使用其他受信任的私有 DNS 名稱，請在初始設定程序的環境中設定
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重設

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 會在執行設定前清除狀態。`--reset-scope` 控制
清除範圍：`config`（僅設定）、`config+creds+sessions`
（傳入 `--reset` 但未指定範圍時的預設值），或
`full`（也會重設工作區）。只有使用
`--reset-scope full` 時才會重設工作區。

## 語言環境

互動式初始設定會使用命令列介面精靈的語言環境來顯示固定設定文字。
它會依以下順序使用第一個非空白值：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英語備用語言

支援的精靈語言環境為 `en`、`zh-CN`
及 `zh-TW`。語言環境值可使用底線或 POSIX 後綴格式，
例如 `zh_CN.UTF-8`。產品名稱、命令名稱、設定鍵、URL、
提供者 ID、模型 ID，以及外掛／頻道標籤會維持原樣。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # 明確覆寫為英語
```

## 非互動式設定

`--non-interactive` 需要 `--accept-risk`（確認代理程式功能強大，且完整系統存取權限具有風險）。`--mode` 預設為 `local`。

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` 是選用項目；若省略，初始設定會檢查環境中的 `CUSTOM_API_KEY`。OpenClaw 會自動將常見的視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及類似模型）標記為支援影像。若是未知的自訂視覺模型 ID，請傳入 `--custom-image-input`；若要強制使用純文字中繼資料，請傳入 `--custom-text-input`。若 OpenAI 相容端點支援 `/v1/responses`，但不支援 `/v1/chat/completions`，請使用 `--custom-compatibility openai-responses`；有效值為 `openai`（預設）、`openai-responses`、`anthropic`。

LM Studio 另有供應商專用的金鑰旗標：

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非互動式 Ollama：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 是選用項目；若省略，初始設定會使用 Ollama 建議的預設值。`kimi-k2.5:cloud` 等雲端模型 ID 也可在此使用。

將供應商金鑰儲存為參照，而非純文字：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，初始設定會寫入由環境變數支援的參照，而非純文字金鑰值：對於由驗證設定檔支援的供應商，這會寫入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；對於自訂供應商，則會以相同方式寫入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。約定：請在初始設定程序的環境中設定供應商環境變數（例如 `OPENAI_API_KEY`），且除非已設定該環境變數，否則不要同時傳入內嵌金鑰旗標；若提供旗標值卻未設定對應的環境變數，程序會立即失敗並提供指引。

### 閘道驗證（非互動式）

- `--gateway-auth token --gateway-token <token>` 會儲存純文字權杖。`token` 是預設驗證模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境變數 SecretRef。初始設定程序的環境中必須有同名且非空的環境變數。
- `--gateway-token` 與 `--gateway-token-ref-env` 互斥。
- 使用 `--install-daemon` 時：由 SecretRef 管理的 `gateway.auth.token` 會經過驗證，但解析後的純文字不會持久化至監督程式服務的環境中繼資料；若無法解析參照，安裝會以封閉方式失敗並提供修正指引。若已同時設定 `gateway.auth.token` 與 `gateway.auth.password`，且未設定 `gateway.auth.mode`，安裝會遭到封鎖，直到明確設定模式為止。
- 本機初始設定會將 `gateway.mode="local"` 寫入設定。若之後的設定檔缺少 `gateway.mode`，表示設定已損毀或手動編輯不完整，而不是有效的本機模式捷徑。
- 本機初始設定會安裝所選設定路徑需要的可下載外掛（例如這些驗證選項所需的 Codex 或 Copilot 執行階段外掛）。遠端初始設定只會寫入遠端閘道的連線資訊，絕不會安裝本機外掛套件。
- `--allow-unconfigured` 是獨立的 `openclaw gateway run` 緊急避險機制；它不允許初始設定略過 `gateway.mode`。

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### 本機閘道健康狀態

- 除非傳入 `--skip-health`，否則初始設定會等待本機閘道可連線後才成功結束。
- `--install-daemon` 會先啟動受管理的閘道安裝路徑。若未使用此旗標，本機閘道必須已在執行（例如 `openclaw gateway run`）。
- 若自動化流程只需要寫入設定、工作區與啟動內容，`--skip-health` 可略過等待。
- `--skip-bootstrap` 會設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 與 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試使用排定的工作；若建立工作遭拒，則退回使用每位使用者的「啟動」資料夾登入項目。

### 互動式參照模式

- 出現提示時選擇 **Use secret reference**，接著選擇 **Environment variable** 或已設定的密鑰供應商（`file` 或 `exec`）。
- 初始設定會在儲存參照前執行快速的前置驗證，若失敗則可重試。

### Z.AI 端點選項

<Note>
`--auth-choice zai-api-key` 會自動偵測最適合你金鑰的 Z.AI 端點與模型：Coding Plan 端點會優先使用 `zai/glm-5.2`（若無法使用，則退回 `glm-5.1`）；一般 API 端點預設使用 `zai/glm-5.1`。若要強制使用 Coding Plan 端點，請直接選擇 `zai-coding-global` 或 `zai-coding-cn`。
</Note>

```bash
# 無提示選擇端點
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 其他 Z.AI 端點選項：zai-coding-cn、zai-global、zai-cn
```

Mistral：

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 其他非互動式旗標

權杖式模型驗證（搭配 `--auth-choice token` 使用）：

| 旗標                            | 說明                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | 簽發權杖的權杖供應商 ID                                                                                         |
| `--token <token>`               | 用於模型驗證的權杖值                                                                                        |
| `--token-profile-id <id>`       | 驗證設定檔 ID（預設為 `<provider>:manual`；部分由供應商擁有的流程會使用自己的預設值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 選用的權杖到期期間（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

常駐程式安裝控制：`--no-install-daemon` / `--skip-daemon`（別名；略過安裝閘道服務）、`--daemon-runtime <node>`。

Skills：`--node-manager <npm|pnpm|bun>`（預設為 `npm`）、`--skip-skills`。

UI 與掛鉤設定：`--skip-ui`（略過 Control UI／終端介面提示）、`--skip-hooks`（略過網路鉤子／掛鉤設定）、`--skip-channels`、`--skip-search`。

輸出：`--suppress-gateway-token-output` 會隱藏包含權杖的閘道／UI 輸出（權杖提示、內嵌權杖的自動登入 URL，以及自動啟動 Control UI），適合在共用終端機與 CI 中使用。

<Note>
在引導式或傳統初始設定中，`--json` 並不代表非互動式模式。
使用 `--modern` 時，JSON 是一次性的 OpenClaw 概覽，並會在取得該筆
單一結果後結束。其他指令碼請使用 `--non-interactive`。
</Note>

## 供應商預先篩選

當驗證選項隱含偏好的供應商時，初始設定會將預設模型與允許清單選擇器預先篩選為該供應商的模型。此篩選器也會比對由同一外掛擁有的其他供應商，因此涵蓋 `volcengine`/`volcengine-plan` 與 `byteplus`/`byteplus-plan` 等程式設計方案變體。若偏好供應商篩選器未產生任何已載入的模型，初始設定會退回未篩選的目錄，而不是讓選擇器留空。

## 網頁搜尋後續設定

部分網頁搜尋供應商會在初始設定期間觸發供應商專用的後續提示：

- **Grok** 可提供選用的 `x_search` 設定，使用相同的 xAI 驗證，並可選擇 `x_search` 模型。
- **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）及預設的 Kimi 網頁搜尋模型。

## 其他行為

- 本機初始設定的私訊範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
- 最快開始第一次聊天：`openclaw dashboard`（Control UI，無需設定頻道）。
- 自訂供應商：連接任何 OpenAI 或 Anthropic 相容端點，包括未列出的託管供應商。使用 **Unknown** 相容性選項，即可透過即時探測自動偵測。
- 若偵測到 Hermes 狀態，初始設定會提供移轉流程（請參閱上方的 `--flow import`）。

## 常用後續命令

之後若要進行不涉及推論的特定變更，請使用 `openclaw configure`；若只要設定頻道，請使用 `openclaw
channels add`。若要變更模型供應商或驗證路徑，
請改為執行 `openclaw onboard`。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
