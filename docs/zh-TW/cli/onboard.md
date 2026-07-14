---
read_when:
    - 你想先設定推論，然後使用 Crestodian 完成設定
summary: '`openclaw onboard` 的命令列介面參考（互動式引導設定）'
title: 新手引導
x-i18n:
    generated_at: "2026-07-14T13:36:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 4b305789c1ee53237acaabb94b243f54771bea5a476584dc3e71df8b053bbb24
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

引導式設定會先建立推論能力：偵測現有的 AI 存取方式、
要求完成一次即時回應、僅保存可用的路由，接著啟動
Crestodian 以設定其餘項目。`openclaw setup` 是相同的進入點；
`openclaw setup --baseline` 僅寫入基準設定／工作區。

<CardGroup cols={2}>
  <Card title="命令列介面新手設定中心" href="/zh-TW/start/wizard" icon="rocket">
    互動式命令列介面流程的逐步指南。
  </Card>
  <Card title="新手設定概覽" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 新手設定各部分如何協同運作。
  </Card>
  <Card title="命令列介面設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制及各步驟的行為。
  </Card>
  <Card title="命令列介面自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與指令碼設定。
  </Card>
  <Card title="macOS App 新手設定" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列 App 的新手設定流程。
  </Card>
</CardGroup>

## 範例

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`：開啟完整的逐步精靈。無法與
  `--non-interactive` 搭配使用；自動化設定請省略 `--classic`。
- `--flow quickstart`：以最少提示開啟傳統精靈，並
  自動產生閘道權杖。
- `--flow manual`（別名 `advanced`）：開啟傳統精靈，完整提示
  連接埠、繫結及驗證設定。
- `--flow import`：執行偵測到的移轉提供者（例如透過 `--import-from hermes` 使用 Hermes）、預覽計畫，並在確認後套用。匯入只能針對全新的 OpenClaw 設定執行；如果已有任何設定，請先重設設定、認證資訊、工作階段及工作區狀態。使用 [`openclaw migrate`](/zh-TW/cli/migrate) 取得試執行計畫、覆寫模式、報告及精確對應。
- `--modern` 是 Crestodian 對話式設定
  助理的相容性別名。它使用與 `openclaw crestodian` 相同的即時推論關卡，且
  僅接受 `--workspace`、`--accept-risk`、
  `--non-interactive` 及 `--json`。其他設定旗標會遭拒絕，而不會
  被無提示地忽略。

## 引導式流程

直接執行 `openclaw onboard` 會啟動引導式流程。它會顯示安全性通知、
偵測已可透過已設定的模型、API 金鑰
環境變數及支援的本機命令列介面取得的 AI 存取方式，接著以實際回應測試
建議的候選項目。如果該候選項目失敗，新手設定會顯示
原因，並自動嘗試下一個可用的候選項目。

如果自動偵測已用盡所有選項，提供者選擇器會優先顯示 OpenAI、
Anthropic、xAI (Grok)、Google 及 OpenRouter。選擇**更多…**可查看
其他所有支援的提供者，並按提供者分組；接著會在第二層選單中顯示區域、方案及驗證方式。
支援的瀏覽器或裝置登入，以及遮蔽顯示的
API 金鑰或權杖方式，都會使用相同的即時回應路徑。OpenClaw 只會在
測試成功後保存已驗證的模型路由及其認證資訊；失敗的候選項目
不會取代已設定的模型，也不會儲存嘗試使用的
認證資訊。選擇**暫時略過**即可退出而不啟動 Crestodian，並在
準備好後重新執行 `openclaw onboard`。工作區及閘道設定在
Crestodian 啟動前都不會變更。

在引導模式中，`--workspace <dir>` 會提供 Crestodian 建議的工作區
及隔離的推論情境。你核准
Crestodian 設定提案前，不會保存這些內容。傳統及非互動式新手設定會透過
各自的一般設定流程保存工作區。

推論通過後，引導式新手設定會立即使用
已驗證的模型啟動 Crestodian。接著，Crestodian 可以設定工作區、閘道、
頻道、代理程式、外掛及其他選用功能。在 Crestodian 中，使用
`open channel wizard for <channel>` 將頻道認證資訊的收集工作交給
遮蔽顯示的終端機精靈。若要變更模型提供者或其驗證方式，
請退出 Crestodian 並執行 `openclaw onboard`；Crestodian 不會開啟引導式
或傳統提供者流程。

在已設定的安裝環境中，再次執行 `openclaw onboard` 會先驗證目前的
預設模型，因此同一流程也能用於驗證及修復。
如果檢查失敗，絕不會自動取代已設定的模型——
新手設定會停止並詢問如何繼續。檢查會在你的
工作區之外執行，因此由工作區外掛提供的模型可能在此處失敗，但仍可
在代理程式中正常運作。
如需提供者專用驗證、頻道、Skills、
遠端閘道設定、匯入或完整閘道控制，請使用 `openclaw onboard --classic`。如需不涉及推論的對話式
設定及修復，請執行 `openclaw crestodian`；`openclaw onboard
--modern` 是透過相同推論關卡運作的相容性別名。傳統
精靈可以選擇透過即時回應驗證預設模型，但
Crestodian 必須通過自身的即時推論檢查後才會啟動。

在互動式終端機中，直接執行 `openclaw`（不含子命令）會根據設定
狀態決定路由：

- 如果缺少作用中的設定檔，或其中沒有使用者編寫的設定（空白或
  僅含中繼資料），便會啟動引導式新手設定。
- 如果設定檔存在但驗證失敗，便會啟動傳統
  新手設定路徑，並提供 `openclaw doctor` 指引。Crestodian 需要可用的
  推論能力，因此不會用來修復這種尚未具備推論能力的狀態。
- 如果設定檔有效，便會開啟一般代理程式終端介面。若已設定的
  閘道可連線，且具備代理程式及模型，則會直接進入該介面，不會執行
  新手設定或 Crestodian。在已設定的安裝環境中，可透過終端介面內的
  `/crestodian` 或 `openclaw crestodian` 進入 Crestodian。

純文字 `ws://` 可用於迴路介面、私有 IP 常值、`.local` 及 Tailnet `*.ts.net` 閘道 URL。若使用其他受信任的私有 DNS 名稱，請在新手設定程序環境中設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重設

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 會在執行設定前清除狀態。`--reset-scope` 控制清除範圍：`config`（僅設定）、`config+creds+sessions`（傳入 `--reset` 但未指定範圍時的預設值），或 `full`（也會重設工作區）。只有使用 `--reset-scope full` 時才會重設工作區。

## 語系

互動式新手設定會使用命令列介面精靈的語系顯示固定設定文字。解析順序：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文備援

支援的精靈語系為 `en`、`zh-CN` 及 `zh-TW`。語系值可使用底線或 POSIX 後綴格式，例如 `zh_CN.UTF-8`。產品名稱、命令名稱、設定鍵、URL、提供者 ID、模型 ID，以及外掛／頻道標籤都保持原樣。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非互動式設定

`--non-interactive` 需要 `--accept-risk`（表示你已知悉代理程式功能強大，而完整系統存取權具有風險）。`--mode` 預設為 `local`。

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

`--custom-api-key` 為選用；若省略，新手設定會檢查環境中的 `CUSTOM_API_KEY`。OpenClaw 會自動將常見的視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及類似模型）標記為支援影像。若是不明的自訂視覺模型 ID，請傳入 `--custom-image-input`；若要強制使用僅文字中繼資料，請傳入 `--custom-text-input`。對於支援 `/v1/responses` 但不支援 `/v1/chat/completions` 的 OpenAI 相容端點，請使用 `--custom-compatibility openai-responses`；有效值為 `openai`（預設）、`openai-responses`、`anthropic`。

LM Studio 也有提供者專用的金鑰旗標：

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 為選用；若省略，新手設定會使用 Ollama 的建議預設值。`kimi-k2.5:cloud` 等雲端模型 ID 也可在此使用。

將提供者金鑰儲存為參照，而非純文字：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，新手設定會寫入由環境變數支援的參照，而非純文字金鑰值：對於由驗證設定檔支援的提供者，會寫入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；對於自訂提供者，則會以相同方式寫入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契約：請在新手設定程序環境中設定提供者環境變數（例如 `OPENAI_API_KEY`），且除非已設定該環境變數，否則請勿同時傳入行內金鑰旗標——若只有旗標值而沒有相符的環境變數，程序會立即失敗並提供指引。

### 閘道驗證（非互動式）

- `--gateway-auth token --gateway-token <token>` 會儲存純文字權杖。`token` 是預設驗證模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境變數 SecretRef。新手設定程序環境中必須有該名稱且非空白的環境變數。
- `--gateway-token` 與 `--gateway-token-ref-env` 互斥。
- 搭配 `--install-daemon` 時：由 SecretRef 管理的 `gateway.auth.token` 會經過驗證，但解析後的純文字不會保存到監督程式服務的環境中繼資料中；若無法解析該參照，安裝會採取封閉式失敗並提供修復指引。如果同時設定 `gateway.auth.token` 與 `gateway.auth.password`，且未設定 `gateway.auth.mode`，安裝會遭到封鎖，直到明確設定模式為止。
- 本機新手設定會將 `gateway.mode="local"` 寫入設定。若後續設定檔缺少 `gateway.mode`，表示設定損壞或手動編輯未完成，而非有效的本機模式捷徑。
- 本機新手設定會安裝所選設定路徑所需的可下載外掛（例如這些驗證選項所需的 Codex 或 Copilot 執行階段外掛）。遠端新手設定只會寫入遠端閘道的連線資訊——絕不會安裝本機外掛套件。
- `--allow-unconfigured` 是獨立的 `openclaw gateway run` 緊急迴避機制；它不允許新手設定略過 `gateway.mode`。

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

- 除非你傳入 `--skip-health`，否則新手設定會等待本機閘道可連線後，才會成功結束。
- `--install-daemon` 會先啟動受管理的閘道安裝流程。若未使用此選項，本機閘道必須已在執行（例如 `openclaw gateway run`）。
- 如果你只想在自動化流程中寫入設定／工作區／啟動程序，`--skip-health` 會略過等待。
- `--skip-bootstrap` 會設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試使用排定的工作；如果建立工作遭拒，則改用每位使用者的「啟動」資料夾登入項目。

### 互動式參照模式

- 出現提示時選擇 **使用祕密參照**，接著選擇 **環境變數** 或已設定的祕密提供者（`file` 或 `exec`）。
- 新手設定會在儲存參照前執行快速的前置驗證，並可讓你在失敗後重試。

### Z.AI 端點選項

<Note>
`--auth-choice zai-api-key` 會針對你的金鑰，自動偵測最佳的 Z.AI 端點和模型：Coding Plan 端點會優先使用 `zai/glm-5.2`（若無法使用則改用 `glm-5.1`）；一般 API 端點預設使用 `zai/glm-5.1`。若要強制使用 Coding Plan 端點，請直接選擇 `zai-coding-global` 或 `zai-coding-cn`。
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
| `--token-provider <id>`         | 核發權杖的權杖提供者 ID                                                                                         |
| `--token <token>`               | 用於模型驗證的權杖值                                                                                        |
| `--token-profile-id <id>`       | 驗證設定檔 ID（預設為 `<provider>:manual`；部分由提供者擁有的流程會使用自己的預設值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 選用的權杖到期期間（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

常駐程式安裝控制：`--no-install-daemon`／`--skip-daemon`（別名；略過安裝閘道服務）、`--daemon-runtime <node>`。

Skills：`--node-manager <npm|pnpm|bun>`（預設為 `npm`）、`--skip-skills`。

使用者介面與掛鉤設定：`--skip-ui`（略過 Control UI／終端介面提示）、`--skip-hooks`（略過網路鉤子／掛鉤設定）、`--skip-channels`、`--skip-search`。

輸出：`--suppress-gateway-token-output` 會隱藏包含權杖的閘道／使用者介面輸出（權杖提示、內嵌權杖的自動登入 URL，以及自動啟動 Control UI），適合用於共用終端機和 CI。

<Note>
在引導式或傳統新手設定中，`--json` 並不表示非互動式模式。
搭配 `--modern` 時，JSON 是一次性的 Crestodian 概覽，並會在取得該
單一結果後結束。其他指令碼請使用 `--non-interactive`。
</Note>

## 提供者預先篩選

當驗證選項隱含偏好的提供者時，新手設定會預先將預設模型與允許清單選擇器篩選為該提供者的模型。篩選器也會比對由相同外掛擁有的其他提供者，涵蓋 `volcengine`/`volcengine-plan` 和 `byteplus`/`byteplus-plan` 等 Coding Plan 變體。如果偏好提供者篩選後沒有任何已載入的模型，新手設定會改用未篩選的目錄，而不會讓選擇器空白。

## 網頁搜尋後續提示

部分網頁搜尋提供者會在新手設定期間觸發提供者專屬的後續提示：

- **Grok** 可以提供選用的 `x_search` 設定，使用相同的 xAI 驗證及 `x_search` 模型選項。
- **Kimi** 可以詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

## 其他行為

- 本機新手設定的私人訊息範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
- 最快開始第一次聊天：`openclaw dashboard`（Control UI，不設定頻道）。
- 自訂提供者：連接任何與 OpenAI 或 Anthropic 相容的端點，包括未列出的託管提供者。使用 **未知** 相容性，即可透過即時探測自動偵測。
- 如果偵測到 Hermes 狀態，新手設定會提供移轉流程（請參閱上方的 `--flow import`）。

## 常用後續命令

稍後若要進行特定的非推論變更，請使用 `openclaw configure`；若只要設定頻道，請使用 `openclaw
channels add`。若要變更模型提供者或驗證路由，
請改為執行 `openclaw onboard`。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
