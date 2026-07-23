---
read_when:
    - 你想先建立推論服務，再使用 OpenClaw 完成設定
summary: '`openclaw onboard`（互動式初始設定）的命令列介面參考資料'
title: 設定引導
x-i18n:
    generated_at: "2026-07-22T20:05:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 84aaad6da541328dc766e8498df052def111fd7c718d8fd65fe321c98bc9d3e0
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

以推論為優先的引導式設定：偵測現有的 AI 存取方式、
要求完成一次即時回應、只保存可用的路由，接著啟動
OpenClaw 以設定其餘項目。全新系統或存在上線引導選項時，
`openclaw setup` 會進入此流程；已設定的系統則使用不帶參數的
`openclaw setup` 進行系統代理程式聊天。`openclaw setup --baseline` 只會
寫入基準設定與工作區。

<CardGroup cols={2}>
  <Card title="命令列介面上線引導中心" href="/zh-TW/start/wizard" icon="rocket">
    互動式命令列介面流程的逐步說明。
  </Card>
  <Card title="上線引導概觀" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 上線引導各部分如何協同運作。
  </Card>
  <Card title="命令列介面設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制及各步驟的行為。
  </Card>
  <Card title="命令列介面自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與指令碼化設定。
  </Card>
  <Card title="macOS 應用程式上線引導" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列應用程式的上線引導流程。
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

`openclaw onboard recommendations` 會讀取上線引導期間儲存且待處理的應用程式推薦比對結果。
加上 `--json` 可取得首次執行啟動程序所使用的機器可讀清單。
此命令不會重新掃描已安裝的應用程式，也不會呼叫模型。其輸出只包含
已驗證的安裝 ID、來源及層級；並刻意省略不受信任的市集文字、模型理由
及本機應用程式標籤。回覆推薦提議後，此命令會傳回空清單，且往後的
上線引導執行會完全略過此步驟。
`openclaw onboard recommendations refresh` 會清除已儲存的提議，讓下一次
上線引導執行重新掃描已安裝的應用程式並建立新提議。

全新工作區會將推薦選擇延後至啟動對話。
該對話處理完使用者的選擇後，
`openclaw onboard recommendations acknowledge` 會將已儲存的提議標記為已回覆。
確認操作具冪等性。若選定的安裝失敗，請透過 `--retry <id...>`
傳入每個失敗的不透明 ID；成功及拒絕的比對項目會被消耗，
失敗的比對項目則維持待處理狀態，供之後的上線引導執行使用。未知 ID
會導致失敗，但不會變更已儲存的提議。ClawHub skill
安裝中斷後，只有在 `openclaw skills verify "@owner/slug"` 對相同的
含發佈者限定推薦 ID 執行成功，且其 JSON 輸出回報
`openclaw.resolution.source: "installed"` 時，現有目標才算安裝成功。
僅完成登錄檔驗證並不能證明本機已安裝。否則，請使用
`--retry` 讓該 ID 維持待處理狀態，且不要覆寫現有的 skill。

- `--classic`：開啟完整的逐步精靈。無法與
  `--non-interactive` 搭配使用；自動化設定時請省略 `--classic`。
- `--flow quickstart`：以最少提示開啟傳統精靈，預設使用
  權杖驗證，且在沒有適用的已儲存或明確認證資訊時產生權杖。
  明確指定的本機閘道旗標（例如 `--gateway-port`、
  `--gateway-bind`、`--gateway-auth` 及 `--tailscale`）
  會覆寫相應的已儲存或預設快速入門值；省略的選項則保留目前值。
- `--flow manual`（別名 `advanced`）：開啟傳統精靈，並完整提示
  連接埠、繫結及驗證設定。
- `--flow import`：執行偵測到的遷移提供者（例如透過 `--import-from hermes` 使用 Hermes）、預覽計畫，並在確認後套用。若互動式匯入提供預設模型，上線引導會要求該路由通過即時回應測試，才會略過提供者設定；若匯入的路由失敗，則會返回提供者設定。匯入只能針對全新的 OpenClaw 設定執行——若已存在任何設定、認證資訊、工作階段或工作區狀態，請先重設。若要使用模擬執行計畫、覆寫模式、報告及精確對應，請參閱 [`openclaw migrate`](/zh-TW/cli/migrate)。
- `--remote-url` 和 `--remote-token`：預先填入傳統遠端閘道步驟，並在此次執行中覆寫已儲存的遠端值。變更 URL 不會重複使用已儲存的認證資訊，除非你同時傳入權杖。權杖在提示中會保持遮蔽，並沿用精靈現有的明文或 SecretRef 儲存選擇。
- `--tailscale-reset-on-exit` 和 `--no-tailscale-reset-on-exit`：明確控制閘道結束時是否重設 Tailscale Serve 或 Funnel 設定。若兩者都省略，非互動式重新執行期間會保留目前設定。
- `--modern` 是 OpenClaw 對話式設定
  助理的相容性別名。它使用與 `openclaw setup` 相同的即時推論閘門，
  且只接受 `--workspace`、`--accept-risk`、
  `--non-interactive` 及 `--json`。其他設定旗標會遭到拒絕，
  而非被默默忽略。

## 引導式流程

不帶其他參數的 `openclaw onboard` 會啟動引導式流程。它會顯示安全性通知，
接著一開始只詢問一個問題：**完整存取**（建議——設定程序會自動尋找
AI 應用程式、金鑰及本機執行環境）或**先詢問**（設定程序會在搜尋前
詢問一次，或讓你手動設定）。此選擇會保存為
`wizard.accessMode`。若允許探索，上線引導會偵測已可透過已設定模型、
API 金鑰環境變數及支援的本機命令列介面取得的 AI 存取方式，接著以
實際回應測試建議的候選項目。若某個候選項目失敗，上線引導會安靜地
嘗試下一個可用項目，並以一行摘要列出未回應的項目；可用的路由會明確
顯示，並提供按一次鍵即可改為查看所有其他選項的功能。

若自動偵測已用盡所有選項，提供者選擇器會先顯示 OpenAI、
Anthropic、xAI（Grok）、Google 及 OpenRouter。選擇 **More…** 可查看
所有其他支援的提供者，並依提供者分組；接著會在第二個選單顯示地區、
方案及驗證方式。支援的瀏覽器或裝置登入方式，以及遮蔽顯示的 API
金鑰或權杖方式，都會使用相同的即時回應流程。OpenClaw 只會在測試成功後
保存已驗證的模型路由及其認證資訊；失敗的候選項目不會取代已設定的模型，
也不會儲存嘗試使用的認證資訊。選擇 **Skip for now** 可在不啟動
OpenClaw 的情況下結束，並在準備好時重新執行 `openclaw onboard`。
在 OpenClaw 啟動前，工作區及閘道設定均保持不變。

在引導模式中，`--workspace <dir>` 會提供 OpenClaw 建議的工作區
及隔離的推論內容。直到你核准 OpenClaw 設定提案前，此內容都不會保存。
傳統及非互動式上線引導則會透過各自的一般設定流程保存其工作區。
若重新執行時已有代理程式名冊，上線引導會保留已設定的代理程式群工作區：
傳統精靈會顯示兩個路徑，且在移動前要求明確確認；非互動式設定則會顯示
警告並保留目前值。

推論通過後，上線引導會檢查支援的本機 AI 工具中是否存在記憶：
Claude Code 自動記憶、Codex 整合記憶及 Hermes 記憶檔案。
若找到任何記憶，單一頁面會提供將其複製至代理程式工作區中
`memory/imports/` 下的選項，以供建立索引後回想。未經確認不會匯入
任何內容，先前已匯入的檔案會被略過，而且你隨時可以稍後從 Control UI
的[記憶匯入頁面](/zh-TW/web/control-ui)匯入；該頁面提供相同的僅限記憶範圍。
（完整執行 [`openclaw migrate`](/zh-TW/cli/migrate) 的範圍更廣：
它也能匯入設定、skills 及認證資訊。）傳統精靈會在準備好工作區後
顯示相同頁面。

推論通過（並完成記憶匯入提議）後，引導式上線引導會自動
套用標準設定——包括工作區、閘道及工作階段，也就是對話式
`openclaw setup` 聊天在收到 “yes” 時會套用的相同計畫——
接著根據已安裝的應用程式提供外掛及 skill 建議；應用程式名稱會透過
你設定的模型及 ClawHub 搜尋進行比對，且可使用
[`wizard.appRecommendations`](/zh-TW/gateway/configuration-reference#wizard) 停用此步驟。
若位於 macOS、Linux 或 Windows 桌面工作階段，接著會開啟已驗證的
Control UI 儀表板，並等待瀏覽器用戶端連線，最長 60 秒。
在無頭 Linux 或透過 SSH 執行時，它會顯著印出可複製貼上的儀表板 URL；
若閘道繫結至回送介面，其中會包含 SSH 連接埠轉送命令，並等待最長
五分鐘。連線成功後會在瀏覽器中繼續；若無法連上閘道或逾時，則會回到
與先前相同的終端機退路。傳入 `--tui` 可略過瀏覽器交接，
並強制使用該終端機退路。若套用設定失敗，上線引導會回到對話式
OpenClaw 聊天，以互動方式完成設定。頻道、代理程式、
外掛及其他選用功能仍由 OpenClaw 聊天處理：執行
`openclaw`，並使用 `open channel wizard for <channel>` 將頻道
認證資訊收集工作交由遮蔽輸入的終端機精靈處理。若要變更模型
提供者或其驗證方式，請結束 OpenClaw 並執行 `openclaw onboard`；
OpenClaw 不會開啟引導式或傳統提供者流程。

在已設定的安裝環境中，再次執行 `openclaw onboard` 會先驗證目前的
預設模型，因此同一流程也可作為驗證及修復程序——它不會重新套用設定、
重新安裝或重新啟動閘道服務。若該檢查失敗，絕不會自動取代已設定的模型——
上線引導會停止並詢問要如何繼續。此檢查會在你的工作區之外執行，
因此由工作區外掛提供的模型可能會在此處失敗，但仍可在代理程式中運作。
若要進行特定提供者的驗證、頻道、skills、遠端閘道設定、匯入或完整
閘道控制，請使用 `openclaw onboard --classic`。若要進行非推論的對話式設定
及修復，請執行 `openclaw setup`；`openclaw onboard
--modern` 是經由相同
推論閘門的相容性別名。傳統精靈可選擇以即時回應驗證預設模型，
但在 OpenClaw 本身的即時推論檢查通過前，OpenClaw 不會啟動。

在互動式終端機中，不帶子命令的 `openclaw` 會依設定
狀態進行路由：

- 若使用中的設定檔不存在，或沒有使用者撰寫的設定（空白或
  僅含中繼資料），則會啟動引導式上線引導。
- 若設定檔存在但驗證失敗，則會使用 `openclaw doctor`
  指引啟動傳統上線引導路徑。OpenClaw 需要可用的推論能力，
  且不會用來修復此推論前狀態。
- 若設定檔有效，則會開啟一般代理程式終端介面。
  若已設定的閘道可連線且具有代理程式與模型，便會直接進入該介面，
  不會執行上線引導或 OpenClaw。在已設定的安裝環境中，可在終端介面內
  使用 `/openclaw` 或執行 `openclaw setup` 來進入 OpenClaw。

明文 `ws://` 可用於回送介面、私有 IP 常值、`.local`
及 Tailnet `*.ts.net` 閘道 URL。若使用其他受信任的私有 DNS 名稱，
請在上線引導程序的環境中設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重設

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 會在執行設定前清除狀態。`--reset-scope` 控制清除範圍：
`config`（僅設定）、`config+creds+sessions`（傳入 `--reset`
但未指定範圍時的預設值），或 `full`（也會重設工作區）。
只有使用 `--reset-scope full` 時才會重設工作區。

## 語系

互動式新手引導會針對固定的設定文字使用命令列介面精靈語系。它會依下列順序採用第一個非空白值：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文後備語系

支援的精靈語系為 `en`、`zh-CN` 和 `zh-TW`。語系值可使用底線或 POSIX 後綴格式，例如 `zh_CN.UTF-8`。產品名稱、命令名稱、設定鍵、URL、供應商 ID、模型 ID，以及外掛／頻道標籤皆維持原文。

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

`--custom-api-key` 為選用；若省略，新手引導會檢查環境中的 `CUSTOM_API_KEY`。OpenClaw 會自動將常見的視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及類似模型）標示為具備影像能力。對於未知的自訂視覺 ID，請傳入 `--custom-image-input`；若要強制使用僅文字中繼資料，請傳入 `--custom-text-input`。對於支援 `/v1/responses` 但不支援 `/v1/chat/completions` 的 OpenAI 相容端點，請使用 `--custom-compatibility openai-responses`；有效值為 `openai`（預設）、`openai-responses`、`anthropic`。

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 為選用；若省略，新手引導會使用 Ollama 建議的預設值。此處也可使用 `kimi-k2.5:cloud` 等雲端模型 ID。

將供應商金鑰儲存為參照，而非純文字：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，新手引導會寫入由環境變數支援的參照，而非純文字金鑰值：對於由驗證設定檔支援的供應商，這會寫入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；對於自訂供應商，則會以相同方式寫入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契約：請在新手引導程序的環境中設定供應商環境變數（例如 `OPENAI_API_KEY`），除非已設定該環境變數，否則不要同時傳入內嵌金鑰旗標；若提供旗標值卻未設定相符的環境變數，程序會立即失敗並提供指引。

### 閘道驗證（非互動式）

- `--gateway-auth token --gateway-token <token>` 會儲存純文字權杖。`token` 是預設驗證模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境變數 SecretRef。新手引導程序環境中必須存在該名稱且非空白的環境變數。
- `--gateway-token` 與 `--gateway-token-ref-env` 互斥。
- 使用 `--install-daemon` 時：由 SecretRef 管理的 `gateway.auth.token` 會經過驗證，但不會以解析後的純文字形式持久儲存於監督程式服務的環境中繼資料；若參照無法解析，安裝會採取封閉式失敗，並提供修正指引。若同時設定 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，安裝會阻擋，直到明確設定模式為止。
- 本機新手引導會將 `gateway.mode="local"` 寫入設定。若之後的設定檔缺少 `gateway.mode`，表示設定損毀或手動編輯未完成，而不是有效的本機模式捷徑。
- 本機新手引導會安裝所選設定路徑需要的可下載外掛（例如這些驗證選項所需的 Codex 或 Copilot 執行階段外掛）。遠端新手引導只會寫入遠端閘道的連線資訊，絕不會安裝本機外掛套件。
- `--allow-unconfigured` 是獨立的 `openclaw gateway run` 緊急逃生選項；它不允許新手引導略過 `gateway.mode`。

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

- 除非傳入 `--skip-health`，否則新手引導會等待本機閘道可連線後才成功結束。
- `--install-daemon` 會先啟動受管理的閘道安裝路徑。若未使用此選項，本機閘道必須已在執行（例如 `openclaw gateway run`）。
- 若自動化流程只需要寫入設定／工作區／啟動程序內容，`--skip-health` 會略過等待。
- `--skip-bootstrap` 會設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試使用排定的工作；若建立工作遭拒，則後備使用每位使用者的啟動資料夾登入項目。

### 互動式參照模式

- 出現提示時選擇 **使用祕密參照**，接著選擇 **環境變數** 或已設定的祕密供應商（`file` 或 `exec`）。
- 新手引導會在儲存參照前執行快速預檢驗證，若失敗則可重試。

### Z.AI 端點選項

<Note>
`--auth-choice zai-api-key` 會自動偵測最適合你金鑰的 Z.AI 端點與模型：Coding Plan 端點偏好 `zai/glm-5.2`（若無法使用則後備至 `glm-5.1`）；一般 API 端點預設為 `zai/glm-5.1`。若要強制使用 Coding Plan 端點，請直接選擇 `zai-coding-global` 或 `zai-coding-cn`。
</Note>

```bash
# 無提示端點選擇
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
| `--token-provider <id>`         | 發行權杖的權杖供應商 ID                                                                                         |
| `--token <token>`               | 用於模型驗證的權杖值                                                                                        |
| `--token-profile-id <id>`       | 驗證設定檔 ID（預設為 `<provider>:manual`；部分由供應商擁有的流程使用自己的預設值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 選用的權杖到期時間長度（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

常駐程式安裝控制：`--no-install-daemon` / `--skip-daemon`（別名；略過安裝閘道服務）、`--daemon-runtime <node>`。

Skills：`--node-manager <npm|pnpm|bun>`（預設為 `npm`）、`--skip-skills`。

UI 與掛鉤設定：`--skip-ui`（略過 Control UI／終端介面提示）、`--skip-hooks`（略過網路鉤子／掛鉤設定）、`--skip-channels`、`--skip-search`。

輸出：`--suppress-gateway-token-output` 會隱藏包含權杖的閘道／UI 輸出（權杖提示、內嵌權杖的自動登入 URL，以及自動啟動 Control UI），適合用於共用終端機與 CI。

<Note>
`--json` 在引導式或傳統新手引導中不代表非互動模式。
使用 `--modern` 時，JSON 是一次性的 OpenClaw 概覽，並會在取得該
單一結果後結束。其他指令碼請使用 `--non-interactive`。
</Note>

## 供應商預先篩選

當驗證選項隱含偏好的供應商時，新手引導會預先篩選預設模型與允許清單選擇器，使其只顯示該供應商的模型。此篩選器也會比對由同一外掛擁有的其他供應商，因此涵蓋 `volcengine`/`volcengine-plan` 和 `byteplus`/`byteplus-plan` 等 Coding Plan 變體。若偏好供應商篩選器未產生任何已載入的模型，新手引導會改用未篩選的目錄，而不會讓選擇器保持空白。

## 網頁搜尋後續提示

部分網頁搜尋供應商會在新手引導期間觸發供應商專用的後續提示：

- **Grok** 可提供選用的 `x_search` 設定，沿用相同的 xAI 驗證及 `x_search` 模型選項。
- **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

## 其他行為

- 本機新手引導的私訊範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
- 最快開始第一次聊天的方式：`openclaw dashboard`（Control UI，無需設定頻道）。
- 自訂供應商：連接任何 OpenAI 或 Anthropic 相容端點，包括未列出的託管供應商。使用 **未知** 相容性，透過即時探測自動偵測。
- 若偵測到 Hermes 狀態，新手引導會提供移轉流程（請參閱上方的 `--flow import`）。

## 常用後續命令

之後若要進行不涉及推論的特定變更，請使用 `openclaw configure`；若只要設定頻道，請使用 `openclaw
channels add`。若要變更模型供應商或驗證路由，
請改為執行 `openclaw onboard`。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
