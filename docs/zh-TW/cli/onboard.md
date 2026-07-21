---
read_when:
    - 你想先建立推論服務，然後使用 OpenClaw 完成設定
summary: '`openclaw onboard`（互動式導覽）的命令列介面參考資料'
title: 新手設定
x-i18n:
    generated_at: "2026-07-21T08:57:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 778fc7bc688ec5fd1304f2107306a92188cfdbb61f6e83e3935d03dd40224119
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

以推論為優先的引導式設定：它會偵測現有的 AI 存取方式、
要求即時完成一次回應、僅保存可運作的路由，然後啟動
OpenClaw 以設定其餘項目。全新系統或存在新手引導選項時，
`openclaw setup` 會進入此流程；已設定的系統則使用
不帶參數的 `openclaw setup` 進行系統代理程式聊天。`openclaw setup --baseline` 僅
寫入基準設定／工作區。

<CardGroup cols={2}>
  <Card title="命令列介面新手引導中心" href="/zh-TW/start/wizard" icon="rocket">
    互動式命令列介面流程的逐步說明。
  </Card>
  <Card title="新手引導概覽" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 新手引導各部分如何協同運作。
  </Card>
  <Card title="命令列介面設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制與各步驟的行為。
  </Card>
  <Card title="命令列介面自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與指令碼化設定。
  </Card>
  <Card title="macOS 應用程式新手引導" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列應用程式的新手引導流程。
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

`openclaw onboard recommendations` 會讀取新手引導期間儲存的待處理應用程式建議配對。
加入 `--json` 可取得首次執行啟動程序使用的機器可讀清單。
此命令不會重新掃描已安裝的應用程式，也不會呼叫模型。其輸出僅包含
已驗證的安裝 ID、來源與層級；它會刻意省略不受信任的市集文字、
模型理由及本機應用程式標籤。回答建議提議後，此命令會傳回空清單，
且未來的新手引導執行會完全略過此步驟。
`openclaw onboard recommendations refresh` 會清除已儲存的提議，讓下一次
新手引導執行重新掃描已安裝的應用程式並建立新提議。

全新的工作區會將建議選擇延後至啟動對話。
該對話處理使用者的選擇後，
`openclaw onboard recommendations acknowledge` 會將已儲存的提議標記為已回答。
確認操作具等冪性。如果選定的安裝失敗，請使用
`--retry <id...>` 傳入每個失敗的不透明 ID；成功與拒絕的配對會被消耗，
失敗的配對則維持待處理，供稍後的新手引導執行使用。未知 ID
會導致失敗，且不會變更已儲存的提議。ClawHub skill
安裝中斷後，只有在 `openclaw skills verify "@owner/slug"` 對相同的
發行者限定建議 ID 執行成功，且其 JSON 輸出回報
`openclaw.resolution.source: "installed"` 時，現有目標才算安裝成功。僅驗證登錄檔
並不能證明已在本機安裝。否則，請使用 `--retry` 將該 ID 保持為待處理，
且不要覆寫現有 skill。

- `--classic`：開啟完整的逐步精靈。它不能與
  `--non-interactive` 一起使用；自動化設定請省略 `--classic`。
- `--flow quickstart`：開啟只提供最少提示的傳統精靈，並
  自動產生閘道權杖。
- `--flow manual`（別名 `advanced`）：開啟傳統精靈，完整提示
  連接埠、繫結與驗證設定。
- `--flow import`：執行偵測到的遷移提供者（例如透過 `--import-from hermes` 使用 Hermes）、預覽計畫，然後在確認後套用。當互動式匯入提供預設模型時，新手引導會要求該路由通過即時完成測試，才會略過提供者設定；匯入的路由失敗時，會返回提供者設定。匯入只能針對全新的 OpenClaw 設定執行——若已有任何設定、認證資訊、工作階段或工作區狀態，請先將其重設。若要使用試執行計畫、覆寫模式、報告與精確對應，請參閱 [`openclaw migrate`](/zh-TW/cli/migrate)。
- `--remote-url` 與 `--remote-token`：預先填入傳統遠端閘道步驟，並在本次執行中覆寫已儲存的遠端值。變更 URL 不會重複使用已儲存的認證資訊，除非你也傳入權杖。權杖在提示中會保持遮蔽，並沿用精靈現有的純文字或 SecretRef 儲存選擇。
- `--tailscale-reset-on-exit` 與 `--no-tailscale-reset-on-exit`：明確控制閘道結束時，是否重設 Tailscale Serve 或 Funnel 設定。兩者皆省略時，非互動式重新執行期間會保留目前設定。
- `--modern` 是 OpenClaw 對話式設定
  助理的相容性別名。它使用與 `openclaw setup` 相同的即時推論閘門，且
  僅接受 `--workspace`、`--accept-risk`、
  `--non-interactive` 與 `--json`。其他設定旗標會被拒絕，而非
  遭到無聲忽略。

## 引導式流程

不帶參數的 `openclaw onboard` 會啟動引導式流程。它會顯示安全性通知，
接著先詢問一個問題：**完整存取權**（建議——設定程序會自動尋找
AI 應用程式、金鑰與本機執行環境）或 **先詢問**（設定程序在查看環境前
會先詢問一次，或讓你手動設定）。此
選擇會保存為 `wizard.accessMode`。允許探索時，新手引導會
偵測已透過已設定模型、API 金鑰環境變數及支援的本機命令列介面
提供的 AI 存取方式，然後使用真實的完成回應測試建議候選項目。
如果候選項目失敗，新手引導會安靜地嘗試下一個可用項目，並以
一行摘要說明所有未回應的項目；可運作的路由會顯示出來，並提供
單鍵操作選項以查看所有其他項目。

如果自動偵測用盡所有候選項目，提供者選擇器會先顯示 OpenAI、
Anthropic、xAI (Grok)、Google 與 OpenRouter。選擇 **More…** 可查看
其他所有支援的提供者，並依提供者分組；區域、方案與驗證方式
接著會顯示在第二個選單中。支援的瀏覽器或裝置登入，以及遮蔽的
API 金鑰或權杖方式，都使用相同的即時完成流程。OpenClaw 只會在
測試成功後保存已驗證的模型路由及其認證資訊；失敗的候選項目
不會取代已設定的模型，也不會儲存嘗試使用的認證資訊。選擇
**Skip for now** 可在不啟動 OpenClaw 的情況下退出，並在準備好時
重新執行 `openclaw onboard`。在 OpenClaw 啟動之前，工作區與閘道設定
都不會變更。

在引導模式中，`--workspace <dir>` 會提供 OpenClaw 建議的工作區
與隔離的推論內容。直到你核准 OpenClaw 設定提案前，它都不會被保存。
傳統和非互動式新手引導會透過其正常設定流程保存工作區。如果重新執行時
已有代理程式名冊，新手引導會保留已設定的機群工作區：傳統
精靈會顯示兩個路徑，並要求明確確認後才會移動工作區；
非互動式設定則會發出警告並保留目前值。

推論通過後，新手引導會檢查支援的本機 AI
工具是否含有記憶：Claude Code 自動記憶、Codex 彙整記憶及 Hermes 記憶
檔案。找到任何記憶時，單一頁面會提供將它們複製到代理程式工作區
下的 `memory/imports/`，供建立索引後回想。未經確認不會匯入
任何內容，先前已匯入的檔案會被略過，而且你隨時可以稍後從 Control UI
的[記憶匯入頁面](/zh-TW/web/control-ui)匯入；該頁面提供相同的僅限記憶範圍。
（完整執行 [`openclaw migrate`](/zh-TW/cli/migrate) 的範圍
更廣：它也可以匯入設定、skill 與認證資訊。）傳統
精靈會在準備好工作區後顯示相同頁面。

推論通過後（以及提供記憶匯入選項後），引導式新手引導會
自動套用標準設定——工作區、閘道與工作階段，也就是對話式
`openclaw setup` 聊天在收到 “yes” 時會套用的相同計畫——
接著根據已安裝的應用程式提供外掛和 skill 建議；應用程式名稱
會透過你設定的模型與 ClawHub 搜尋進行配對，且可使用
[`wizard.appRecommendations`](/zh-TW/gateway/configuration-reference#wizard) 停用此步驟。
在 macOS、Linux 或 Windows 桌面工作階段中，它接著會開啟已驗證的
Control UI 儀表板，並等待瀏覽器用戶端連線，最多 60 秒。
在無頭 Linux 或透過 SSH 時，它會顯示醒目且可複製貼上的
儀表板 URL；若為迴路閘道，還會包含 SSH 連接埠轉送命令，
並等待最多五分鐘。成功連線後會在瀏覽器中繼續；
無法連線的閘道或逾時，則會退回與先前相同的終端替代入口。
傳入 `--tui` 可略過瀏覽器移交，並強制使用該終端替代入口。
如果套用設定失敗，新手引導會退回對話式 OpenClaw
聊天，以互動方式完成設定。頻道、代理程式、
外掛及其他選用功能仍由 OpenClaw 聊天處理：執行
`openclaw`，並使用 `open channel wizard for <channel>` 將頻道
認證資訊收集交由遮蔽式終端精靈處理。若要變更模型
提供者或其驗證方式，請結束 OpenClaw 並執行 `openclaw onboard`；
OpenClaw 不會開啟引導式或傳統提供者流程。

在已設定的安裝中，再次執行 `openclaw onboard` 會先驗證目前的
預設模型，因此同一流程可作為驗證與修復流程——
它不會重新套用設定、重新安裝或重新啟動閘道服務。
如果該檢查失敗，已設定的模型絕不會自動被取代——
新手引導會停止並詢問如何繼續。此檢查會在你的
工作區外執行，因此由工作區外掛提供的模型可能會在此失敗，
但仍可在代理程式中正常運作。
使用 `openclaw onboard --classic` 可設定特定提供者的驗證、頻道、skill、
遠端閘道設定、匯入或完整閘道控制。若要進行對話式
非推論設定與修復，請執行 `openclaw setup`；`openclaw onboard
--modern` 是經由相同推論閘門的相容性別名。傳統
精靈可以選擇透過即時完成回應驗證預設模型，但
OpenClaw 在自身的即時推論檢查通過前不會啟動。

在互動式終端中，不帶子命令的 `openclaw` 會依設定
狀態決定路由：

- 如果作用中的設定檔不存在或沒有任何自行設定的項目（空白或
  僅有中繼資料），它會啟動引導式新手引導。
- 如果設定檔存在但驗證失敗，它會在 `openclaw doctor` 引導下
  啟動傳統新手引導路徑。OpenClaw 需要可運作的
  推論能力，且不會用來修復此推論前狀態。
- 如果設定檔有效，它會開啟一般的代理程式終端介面。若已設定的
  閘道可連線，且有代理程式和模型，便會直接進入該介面，不會執行
  新手引導或 OpenClaw。在已設定的安裝中，可在終端介面內使用
  `/openclaw` 或執行 `openclaw setup` 進入 OpenClaw。

純文字 `ws://` 可用於迴路、私人 IP 常值、`.local` 與 Tailnet `*.ts.net` 閘道 URL。對於其他受信任的私人 DNS 名稱，請在新手引導處理程序環境中設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重設

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 會在執行設定前清除狀態。`--reset-scope` 控制清除範圍：`config`（僅設定）、`config+creds+sessions`（傳入 `--reset` 但未指定範圍時的預設值）或 `full`（也會重設工作區）。只有使用 `--reset-scope full` 時才會重設工作區。

## 語言環境

互動式新手引導會針對固定的設定文字使用命令列介面精靈的語言環境。它會依下列順序採用第一個非空白值：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文備援

支援的精靈語系為 `en`、`zh-CN` 和 `zh-TW`。語系值可使用底線或 POSIX 後綴格式，例如 `zh_CN.UTF-8`。產品名稱、命令名稱、設定鍵、URL、供應商 ID、模型 ID，以及外掛／頻道標籤維持原文。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # 明確覆寫為英文
```

## 非互動式設定

`--non-interactive` 需要 `--accept-risk`（確認代理程式功能強大，且完整系統存取具有風險）。`--mode` 預設為 `local`。

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

`--custom-api-key` 為選用；若省略，初始設定會檢查環境中的 `CUSTOM_API_KEY`。OpenClaw 會自動將常見的視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及類似模型）標記為支援影像。對於未知的自訂視覺模型 ID，請傳入 `--custom-image-input`；若要強制使用僅文字中繼資料，請傳入 `--custom-text-input`。對於支援 `/v1/responses` 但不支援 `/v1/chat/completions` 的 OpenAI 相容端點，請使用 `--custom-compatibility openai-responses`；有效值為 `openai`（預設）、`openai-responses`、`anthropic`。

LM Studio 也有供應商專用的金鑰旗標：

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 為選用；若省略，初始設定會使用 Ollama 建議的預設值。`kimi-k2.5:cloud` 等雲端模型 ID 也可在此使用。

將供應商金鑰儲存為參照，而非純文字：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，初始設定會寫入以環境變數為基礎的參照，而非純文字金鑰值：對於以驗證設定檔為基礎的供應商，這會寫入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；對於自訂供應商，則會以相同方式寫入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契約：請在初始設定程序的環境中設定供應商環境變數（例如 `OPENAI_API_KEY`），且除非已設定該環境變數，否則不要同時傳入行內金鑰旗標；若提供旗標值但未設定相符的環境變數，程序會立即失敗並提供指引。

### 閘道驗證（非互動式）

- `--gateway-auth token --gateway-token <token>` 會儲存純文字權杖。`token` 是預設驗證模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境變數 SecretRef。初始設定程序的環境中必須有同名且非空的環境變數。
- `--gateway-token` 與 `--gateway-token-ref-env` 互斥。
- 使用 `--install-daemon` 時：由 SecretRef 管理的 `gateway.auth.token` 會經過驗證，但解析後的純文字不會持久儲存於監督程式服務的環境中繼資料中；若參照無法解析，安裝會採取封閉式失敗並提供修復指引。若 `gateway.auth.token` 與 `gateway.auth.password` 均已設定，而 `gateway.auth.mode` 未設定，安裝會封鎖，直到明確設定模式為止。
- 本機初始設定會將 `gateway.mode="local"` 寫入設定。若之後的設定檔缺少 `gateway.mode`，表示設定損壞或手動編輯不完整，而不是有效的本機模式捷徑。
- 本機初始設定會安裝所選設定路徑需要的可下載外掛（例如這些驗證選項所需的 Codex 或 Copilot 執行階段外掛）。遠端初始設定只會寫入遠端閘道的連線資訊，絕不會安裝本機外掛套件。
- `--allow-unconfigured` 是獨立的 `openclaw gateway run` 緊急略過機制；它不會讓初始設定略過 `gateway.mode`。

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

- 除非傳入 `--skip-health`，否則初始設定會等待本機閘道可連線後，才成功結束。
- `--install-daemon` 會先啟動受管理的閘道安裝路徑。若未使用此旗標，本機閘道必須已在執行（例如 `openclaw gateway run`）。
- 若在自動化作業中只需要寫入設定／工作區／啟動程序，`--skip-health` 可略過等待。
- `--skip-bootstrap` 會設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試使用排程工作；若建立工作遭拒，則退回使用每位使用者的「啟動」資料夾登入項目。

### 互動式參照模式

- 出現提示時選擇 **使用密鑰參照**，接著選擇 **環境變數** 或已設定的密鑰供應商（`file` 或 `exec`）。
- 初始設定會在儲存參照前快速執行預檢驗證，並在失敗時讓你重試。

### Z.AI 端點選項

<Note>
`--auth-choice zai-api-key` 會自動偵測最適合你金鑰的 Z.AI 端點與模型：Coding Plan 端點會優先使用 `zai/glm-5.2`（若無法使用則退回 `glm-5.1`）；一般 API 端點預設使用 `zai/glm-5.1`。若要強制使用 Coding Plan 端點，請直接選擇 `zai-coding-global` 或 `zai-coding-cn`。
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

以權杖為基礎的模型驗證（搭配 `--auth-choice token` 使用）：

| 旗標                            | 說明                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | 核發權杖的權杖供應商 ID                                                                                         |
| `--token <token>`               | 用於模型驗證的權杖值                                                                                        |
| `--token-profile-id <id>`       | 驗證設定檔 ID（預設為 `<provider>:manual`；部分由供應商擁有的流程會使用自己的預設值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 選用的權杖到期期間（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

常駐程式安裝控制：`--no-install-daemon`／`--skip-daemon`（別名；略過閘道服務安裝）、`--daemon-runtime <node>`。

Skills：`--node-manager <npm|pnpm|bun>`（預設為 `npm`）、`--skip-skills`。

UI 與鉤子設定：`--skip-ui`（略過 Control UI／終端介面提示）、`--skip-hooks`（略過網路鉤子／鉤子設定）、`--skip-channels`、`--skip-search`。

輸出：`--suppress-gateway-token-output` 會隱藏含有權杖的閘道／UI 輸出（權杖提示、嵌入權杖的自動登入 URL，以及自動啟動 Control UI），適合用於共用終端機和 CI。

<Note>
`--json` 在引導式或傳統初始設定中並不代表非互動模式。
搭配 `--modern` 時，JSON 是一次性的 OpenClaw 概覽，並會在產生該筆
結果後結束。其他指令碼請使用 `--non-interactive`。
</Note>

## 供應商預先篩選

當驗證選項表示偏好的供應商時，初始設定會預先篩選預設模型與允許清單選擇器，只顯示該供應商的模型。篩選器也會比對同一外掛擁有的其他供應商，因此涵蓋 `volcengine`/`volcengine-plan` 和 `byteplus`/`byteplus-plan` 等 Coding Plan 變體。如果偏好供應商篩選器未產生任何已載入的模型，初始設定會退回未篩選的目錄，而不會讓選擇器保持空白。

## 網頁搜尋後續設定

部分網頁搜尋供應商會在初始設定期間觸發供應商專用的後續提示：

- **Grok** 可提供選用的 `x_search` 設定，使用相同的 xAI 驗證和 `x_search` 模型選項。
- **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）及預設的 Kimi 網頁搜尋模型。

## 其他行為

- 本機初始設定的私訊範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
- 最快開始第一次聊天：`openclaw dashboard`（Control UI，不設定頻道）。
- 自訂供應商：連線至任何 OpenAI 或 Anthropic 相容端點，包括未列出的代管供應商。使用 **未知** 相容性，透過即時探測自動偵測。
- 若偵測到 Hermes 狀態，初始設定會提供移轉流程（請參閱上方的 `--flow import`）。

## 常用後續命令

之後若要進行指定且不涉及推斷的變更，請使用 `openclaw configure`；若只要設定頻道，請使用 `openclaw
channels add`。若要變更模型供應商或驗證路由，
請改為執行 `openclaw onboard`。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
