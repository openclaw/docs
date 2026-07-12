---
read_when:
    - 您想要建立推論功能，然後使用 Crestodian 完成設定
summary: '`openclaw onboard` 的命令列介面參考（互動式初始設定）'
title: 引導設定
x-i18n:
    generated_at: "2026-07-11T21:14:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

以推論為優先的引導式設定：它會偵測現有的 AI 存取方式、要求即時完成一次回應、僅儲存可運作的路徑，接著啟動 Crestodian 來設定其餘項目。`openclaw setup` 是相同的進入點；`openclaw setup --baseline` 只會寫入基準設定與工作區。

<CardGroup cols={2}>
  <Card title="命令列介面上手設定中心" href="/zh-TW/start/wizard" icon="rocket">
    互動式命令列介面流程的逐步說明。
  </Card>
  <Card title="上手設定概覽" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 上手設定各部分如何協同運作。
  </Card>
  <Card title="命令列介面設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制及各步驟行為。
  </Card>
  <Card title="命令列介面自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與指令碼設定。
  </Card>
  <Card title="macOS 應用程式上手設定" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列應用程式的上手設定流程。
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

- `--classic`：開啟完整的逐步精靈。它不能與 `--non-interactive` 合併使用；自動化設定請省略 `--classic`。
- `--flow quickstart`：以最少提示開啟傳統精靈，並自動產生閘道權杖。
- `--flow manual`（別名 `advanced`）：開啟傳統精靈，並完整提示連接埠、繫結及驗證設定。
- `--flow import`：執行偵測到的遷移提供者（例如透過 `--import-from hermes` 使用 Hermes）、預覽計畫，然後在確認後套用。匯入只能針對全新的 OpenClaw 設定執行；若已有任何設定，請先重設組態、憑證、工作階段及工作區狀態。若要使用試執行計畫、覆寫模式、報告及精確對應，請使用 [`openclaw migrate`](/zh-TW/cli/migrate)。
- `--modern` 是 Crestodian 對話式設定助理的相容性別名。它使用與 `openclaw crestodian` 相同的即時推論閘門，且僅接受 `--workspace`、`--accept-risk`、`--non-interactive` 及 `--json`。其他設定旗標會遭拒絕，而不是被默默忽略。

## 引導式流程

直接執行 `openclaw onboard` 會啟動引導式流程。它會顯示安全性通知，偵測已可透過已設定模型、API 金鑰環境變數及支援的本機命令列介面使用的 AI 存取方式，然後以實際完成一次回應來測試建議的候選項目。若該候選項目失敗，上手設定會顯示原因，並自動嘗試下一個可用的候選項目。

若自動偵測已嘗試完畢，請選擇另一個偵測到的候選項目，或在遮罩提示中輸入提供者 API 金鑰。手動輸入的金鑰會透過相同的即時完成回應路徑進行測試。在候選項目通過之前，引導式上手設定不會提供 Crestodian，也不會提供略過 AI 的退出方式。測試成功後，OpenClaw 只會儲存已驗證的模型路徑及其憑證；失敗的候選項目不會取代已設定的模型，也不會儲存嘗試使用的憑證。工作區與閘道設定在 Crestodian 啟動前會維持不變。

在引導模式中，`--workspace <dir>` 會提供 Crestodian 建議的工作區及隔離的推論環境。除非你核准 Crestodian 的設定提案，否則不會將其儲存。傳統與非互動式上手設定會透過其一般設定流程儲存工作區。

推論通過後，引導式上手設定會立即使用已驗證的模型啟動 Crestodian。接著，Crestodian 可以設定工作區、閘道、頻道、代理程式、外掛及其他選用功能。在 Crestodian 中，使用 `open channel wizard for <channel>` 將頻道憑證收集工作交給遮罩式終端精靈。若要變更模型提供者或其驗證方式，請結束 Crestodian 並執行 `openclaw onboard`；Crestodian 不會開啟引導式或傳統提供者流程。

在已設定的安裝環境中，再次執行 `openclaw onboard` 會先驗證目前的預設模型，因此同一流程也可用於驗證及修復。若該檢查失敗，絕不會自動取代已設定的模型，而是會停止上手設定並詢問如何繼續。此檢查會在工作區之外執行，因此由工作區外掛提供的模型可能會在此處失敗，即使它仍可在代理程式中運作。
若要進行特定提供者的驗證、頻道、Skills、遠端閘道設定、匯入或完整閘道控制，請使用 `openclaw onboard --classic`。若要進行對話式的非推論設定與修復，請執行 `openclaw crestodian`；`openclaw onboard --modern` 是通過相同推論閘門的相容性別名。傳統精靈可選擇透過即時完成回應驗證預設模型，但在 Crestodian 自身的即時推論檢查通過之前，Crestodian 不會啟動。

在互動式終端中，直接執行 `openclaw`（不含子命令）時，會依組態狀態導向：

- 若作用中的組態檔案不存在，或沒有任何使用者撰寫的設定（空白或僅含中繼資料），則會啟動引導式上手設定。
- 若組態檔案存在但未通過驗證，則會啟動傳統上手設定路徑，並提供 `openclaw doctor` 指引。Crestodian 需要可運作的推論能力，不會用於修復此推論前狀態。
- 若組態檔案有效，則會開啟一般代理程式終端介面。若已設定的閘道可連線，且具備代理程式與模型，就會直接進入該介面，不經過上手設定或 Crestodian。在已設定的安裝環境中，可在終端介面內使用 `/crestodian` 或執行 `openclaw crestodian` 進入 Crestodian。

明文 `ws://` 可用於 local loopback、私有 IP 常值、`.local` 及 Tailnet `*.ts.net` 閘道 URL。對於其他受信任的私有 DNS 名稱，請在上手設定程序的環境中設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重設

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 會在執行設定前清除狀態。`--reset-scope` 控制清除範圍：`config`（僅組態）、`config+creds+sessions`（傳入 `--reset` 但未指定範圍時的預設值），或 `full`（也會重設工作區）。只有使用 `--reset-scope full` 時才會重設工作區。

## 語系

互動式上手設定會使用命令列介面精靈的語系來顯示固定設定文字。解析順序如下：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 回退至英文

支援的精靈語系為 `en`、`zh-CN` 及 `zh-TW`。語系值可使用底線或 POSIX 後綴形式，例如 `zh_CN.UTF-8`。產品名稱、命令名稱、組態鍵、URL、提供者 ID、模型 ID，以及外掛／頻道標籤均維持原文。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非互動式設定

`--non-interactive` 需要搭配 `--accept-risk`（確認代理程式功能強大，且完整系統存取具有風險）。`--mode` 預設為 `local`。

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

`--custom-api-key` 為選用；若省略，上手設定會檢查環境中的 `CUSTOM_API_KEY`。OpenClaw 會自動將常見的視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及類似模型）標記為具備影像處理能力。對於未知的自訂視覺模型 ID，請傳入 `--custom-image-input`；若要強制使用純文字中繼資料，請傳入 `--custom-text-input`。對於支援 `/v1/responses` 但不支援 `/v1/chat/completions` 的 OpenAI 相容端點，請使用 `--custom-compatibility openai-responses`；有效值為 `openai`（預設）、`openai-responses`、`anthropic`。

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 為選用；若省略，上手設定會使用 Ollama 建議的預設值。`kimi-k2.5:cloud` 等雲端模型 ID 也可在此使用。

將提供者金鑰儲存為參照，而非明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，上手設定會寫入由環境變數支援的參照，而非明文金鑰值：對於以驗證設定檔為基礎的提供者，會寫入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；對於自訂提供者，則會以相同方式寫入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契約：請在上手設定程序的環境中設定提供者環境變數（例如 `OPENAI_API_KEY`），且除非該環境變數已設定，否則不要同時傳入內嵌金鑰旗標；若只有旗標值而沒有相符的環境變數，程序會立即失敗並提供指引。

### 閘道驗證（非互動式）

- `--gateway-auth token --gateway-token <token>` 會儲存明文權杖。`token` 是預設驗證模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境變數 SecretRef。上手設定程序環境中必須存在該名稱且非空的環境變數。
- `--gateway-token` 與 `--gateway-token-ref-env` 互斥。
- 搭配 `--install-daemon` 時：由 SecretRef 管理的 `gateway.auth.token` 會經過驗證，但不會以解析後的明文形式儲存在監督程式服務的環境中繼資料內；若無法解析該參照，安裝會採取封閉式失敗並提供修復指引。若同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，但未設定 `gateway.auth.mode`，安裝會遭封鎖，直到明確設定模式為止。
- 本機上手設定會將 `gateway.mode="local"` 寫入組態。若後續組態檔案缺少 `gateway.mode`，表示組態受損或手動編輯未完成，而不是有效的本機模式捷徑。
- 本機上手設定會安裝所選設定路徑需要的可下載外掛（例如這些驗證選項所需的 Codex 或 Copilot 執行階段外掛）。遠端上手設定只會寫入遠端閘道的連線資訊，絕不會安裝本機外掛套件。
- `--allow-unconfigured` 是獨立的 `openclaw gateway run` 應急選項；它不允許上手設定略過 `gateway.mode`。

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

- 除非傳入 `--skip-health`，否則上手設定會等待本機閘道可連線後才成功結束。
- `--install-daemon` 會先啟動受管理的閘道安裝路徑。若未使用此旗標，本機閘道必須已在執行中（例如 `openclaw gateway run`）。
- 若你只想在自動化中寫入組態、工作區及啟動程序內容，`--skip-health` 可略過等待。
- `--skip-bootstrap` 會設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 及 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試使用排程工作；若建立工作遭拒，則回退至每位使用者啟動資料夾中的登入項目。

### 互動式參照模式

- 出現提示時，選擇 **使用密鑰參照**，接著選擇 **環境變數** 或已設定的密鑰提供者（`file` 或 `exec`）。
- 上手設定會在儲存參照前執行快速預檢驗證，若失敗則可重試。

### Z.AI 端點選項

<Note>
`--auth-choice zai-api-key` 會針對您的金鑰自動偵測最佳的 Z.AI 端點與模型：Coding Plan 端點優先使用 `zai/glm-5.2`（若無法使用則改用 `glm-5.1`）；一般 API 端點預設使用 `zai/glm-5.1`。若要強制使用 Coding Plan 端點，請直接選擇 `zai-coding-global` 或 `zai-coding-cn`。
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

權杖式模型驗證（與 `--auth-choice token` 搭配使用）：

| 旗標                            | 說明                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | 簽發權杖的權杖提供者識別碼                                                                                         |
| `--token <token>`               | 用於模型驗證的權杖值                                                                                        |
| `--token-profile-id <id>`       | 驗證設定檔識別碼（預設為 `<provider>:manual`；某些由提供者擁有的流程會使用自己的預設值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 選用的權杖有效期限（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

常駐程式安裝控制：`--no-install-daemon` / `--skip-daemon`（別名；略過閘道服務安裝）、`--daemon-runtime <node|bun>`。

Skills：`--node-manager <npm|pnpm|bun>`（預設為 `npm`）、`--skip-skills`。

使用者介面與鉤子設定：`--skip-ui`（略過 Control UI／終端介面提示）、`--skip-hooks`（略過網路鉤子／鉤子設定）、`--skip-channels`、`--skip-search`。

輸出：`--suppress-gateway-token-output` 會隱藏包含權杖的閘道／使用者介面輸出（權杖提示、內嵌權杖的自動登入 URL，以及自動啟動 Control UI），適合用於共用終端機和 CI。

<Note>
在引導式或傳統的初始設定中，`--json` 並不代表非互動模式。
使用 `--modern` 時，JSON 會輸出一次性的 Crestodian 概覽，並在取得該次
結果後結束。其他指令碼請使用 `--non-interactive`。
</Note>

## 提供者預先篩選

當驗證選項暗示偏好的提供者時，初始設定會預先篩選預設模型及允許清單選擇器，只顯示該提供者的模型。此篩選器也會比對同一外掛所擁有的其他提供者，涵蓋 `volcengine`／`volcengine-plan` 和 `byteplus`／`byteplus-plan` 等 Coding Plan 變體。如果偏好提供者篩選後沒有任何已載入的模型，初始設定會改用未篩選的目錄，而不會讓選擇器保持空白。

## 網頁搜尋後續設定

某些網頁搜尋提供者會在初始設定期間觸發提供者專屬的後續提示：

- **Grok** 可以選擇使用相同的 xAI 驗證來設定 `x_search`，並選擇一個 `x_search` 模型。
- **Kimi** 可能會要求選擇 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

## 其他行為

- 本機初始設定的私訊範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
- 最快開始首次聊天的方式：`openclaw dashboard`（Control UI，無須設定頻道）。
- 自訂提供者：連線至任何與 OpenAI 或 Anthropic 相容的端點，包括未列出的託管提供者。使用 **未知** 相容性可透過即時探測自動偵測。
- 如果偵測到 Hermes 狀態，初始設定會提供遷移流程（請參閱上方的 `--flow import`）。

## 常用後續命令

之後若要進行不涉及推論的特定變更，請使用 `openclaw configure`；若只要設定頻道，請使用 `openclaw
channels add`。若要變更模型提供者或驗證路由，
請改為執行 `openclaw onboard`。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
