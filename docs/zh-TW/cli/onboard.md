---
read_when:
    - 你想先建立推論功能，然後使用 Crestodian 完成設定
summary: '`openclaw onboard`（互動式初始設定）的命令列介面參考資料'
title: 新手設定
x-i18n:
    generated_at: "2026-07-12T14:23:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

引導式設定會先建立推論能力：它會偵測現有的 AI 存取方式、
要求即時完成一次推論、僅保存可正常運作的路由，然後啟動
Crestodian 以設定其餘項目。`openclaw setup` 是相同的進入點；
`openclaw setup --baseline` 則只會寫入基準設定／工作區。

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
    非互動式旗標與指令碼設定。
  </Card>
  <Card title="macOS 應用程式新手引導" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列應用程式的新手引導流程。
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

- `--classic`：開啟完整的逐步精靈。它不能與
  `--non-interactive` 搭配使用；自動化設定請省略 `--classic`。
- `--flow quickstart`：以最少的提示開啟傳統精靈，並
  自動產生閘道權杖。
- `--flow manual`（別名 `advanced`）：開啟傳統精靈，完整提示
  連接埠、繫結與驗證設定。
- `--flow import`：執行偵測到的遷移提供者（例如透過 `--import-from hermes` 使用 Hermes）、預覽計畫，然後在確認後套用。匯入只能針對全新的 OpenClaw 設定執行；若已存在任何設定，請先重設設定、認證資訊、工作階段與工作區狀態。如需試執行計畫、覆寫模式、報告及確切對應關係，請使用 [`openclaw migrate`](/zh-TW/cli/migrate)。
- `--modern` 是 Crestodian 對話式設定助理的相容性別名。
  它使用與 `openclaw crestodian` 相同的即時推論檢查關卡，且
  僅接受 `--workspace`、`--accept-risk`、
  `--non-interactive` 與 `--json`。其他設定旗標會遭到拒絕，而不會
  被默默忽略。

## 引導式流程

直接執行 `openclaw onboard` 會啟動引導式流程。它會顯示安全性通知、
偵測已可透過已設定的模型、API 金鑰
環境變數及支援的本機命令列介面使用的 AI 存取方式，然後使用真實的完成請求測試建議的
候選項目。如果該候選項目失敗，新手引導會顯示
原因，並自動嘗試下一個可用的候選項目。

如果自動偵測已無可嘗試的項目，請選擇另一個偵測到的候選項目，或在
遮罩提示中輸入提供者 API 金鑰。手動輸入的金鑰會透過相同的
即時完成請求路徑進行測試。引導式新手引導
在候選項目通過前，不會提供 Crestodian 或略過 AI 的離開選項。測試
成功後，OpenClaw 只會保存已驗證的模型路由及其認證資訊；
失敗的候選項目不會取代已設定的模型，也不會儲存
嘗試使用的認證資訊。在 Crestodian 啟動前，工作區與閘道設定維持
不變。

在引導模式中，`--workspace <dir>` 會提供 Crestodian 建議的工作區
及隔離的推論環境。直到你核准
Crestodian 的設定提案後，才會保存該工作區。傳統與非互動式新手引導則會透過
其一般設定流程保存工作區。

推論通過後，引導式新手引導會立即使用
已驗證的模型啟動 Crestodian。接著，Crestodian 可以設定工作區、閘道、
頻道、代理程式、外掛及其他選用功能。在 Crestodian 中，使用
`open channel wizard for <channel>` 將頻道認證資訊的收集交由
遮罩式終端精靈處理。若要變更模型提供者或其驗證方式，
請離開 Crestodian 並執行 `openclaw onboard`；Crestodian 不會開啟引導式
或傳統提供者流程。

在已設定的安裝環境中，再次執行 `openclaw onboard` 會先驗證目前的
預設模型，因此同一流程也可作為驗證與修復程序。
如果該檢查失敗，絕不會自動取代已設定的模型——
新手引導會停止並詢問要如何繼續。此檢查會在你的
工作區外執行，因此由工作區外掛提供的模型可能會在此處失敗，但在代理程式中仍可
正常運作。
若需特定提供者的驗證、頻道、Skills、
遠端閘道設定、匯入或完整閘道控制，請使用 `openclaw onboard --classic`。若需對話式
非推論設定與修復，請執行 `openclaw crestodian`；`openclaw onboard
--modern` 是通過相同推論檢查關卡的相容性別名。傳統
精靈可選擇透過即時完成請求驗證預設模型，但在
Crestodian 自身的即時推論檢查通過前，它不會啟動。

在互動式終端中，直接執行 `openclaw`（不含子命令）會根據設定
狀態決定路徑：

- 如果有效的設定檔遺失，或沒有使用者撰寫的設定（空白或
  僅含中繼資料），它會啟動引導式新手引導。
- 如果設定檔存在但未通過驗證，它會啟動傳統
  新手引導路徑，並提供 `openclaw doctor` 指引。Crestodian 需要可正常運作的
  推論能力，因此不會用於修復此推論前狀態。
- 如果設定檔有效，它會開啟一般的代理程式終端介面。若已設定的
  閘道可連線且具備代理程式與模型，系統會直接進入該介面，不會執行
  新手引導或 Crestodian。在已設定的安裝環境中，可於
  終端介面內使用 `/crestodian`，或執行 `openclaw crestodian` 進入 Crestodian。

閘道 URL 若為迴路位址、私有 IP 常值、`.local` 及 Tailnet `*.ts.net`，則可接受純文字 `ws://`。對於其他受信任的私有 DNS 名稱，請在新手引導程序的環境中設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重設

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 會在執行設定前清除狀態。`--reset-scope` 控制清除範圍：`config`（僅設定）、`config+creds+sessions`（傳入 `--reset` 但未指定範圍時的預設值），或 `full`（也會重設工作區）。只有使用 `--reset-scope full` 時才會重設工作區。

## 語系

互動式新手引導會針對固定設定文案使用命令列介面精靈的語系。解析順序如下：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文後備語系

支援的精靈語系為 `en`、`zh-CN` 和 `zh-TW`。語系值可使用底線或 POSIX 後綴格式，例如 `zh_CN.UTF-8`。產品名稱、命令名稱、設定鍵、URL、供應商 ID、模型 ID，以及外掛／頻道標籤均保留原文。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非互動式設定

`--non-interactive` 需要搭配 `--accept-risk`（確認代理程式功能強大，且擁有完整系統存取權會帶來風險）。`--mode` 預設為 `local`。

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

`--custom-api-key` 為選用；若省略，初始設定會檢查環境中的 `CUSTOM_API_KEY`。OpenClaw 會自動將常見的視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 及類似模型）標記為具備影像處理能力。對於未知的自訂視覺模型 ID，請傳入 `--custom-image-input`；若要強制使用僅文字的中繼資料，請使用 `--custom-text-input`。若 OpenAI 相容端點支援 `/v1/responses`、但不支援 `/v1/chat/completions`，請使用 `--custom-compatibility openai-responses`；有效值為 `openai`（預設）、`openai-responses`、`anthropic`。

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 為選用；若省略，初始設定會使用 Ollama 建議的預設值。此處也支援 `kimi-k2.5:cloud` 等雲端模型 ID。

將供應商金鑰儲存為參照，而非明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，初始設定會寫入由環境變數支援的參照，而非明文金鑰值：對於由驗證設定檔支援的供應商，會寫入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；對於自訂供應商，則會以相同方式寫入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契約：請在初始設定程序的環境中設定供應商環境變數（例如 `OPENAI_API_KEY`），除非已設定該環境變數，否則不要同時傳入行內金鑰旗標；若只有旗標值而沒有相符的環境變數，程序會立即失敗並提供指引。

### 閘道驗證（非互動式）

- `--gateway-auth token --gateway-token <token>` 會儲存明文權杖。`token` 是預設驗證模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境變數 SecretRef。初始設定程序的環境中必須存在該名稱且非空的環境變數。
- `--gateway-token` 與 `--gateway-token-ref-env` 互斥。
- 搭配 `--install-daemon` 時：由 SecretRef 管理的 `gateway.auth.token` 會經過驗證，但解析後的明文不會持久化至監督程式服務的環境中繼資料；若參照無法解析，安裝會採取失敗關閉，並提供修正指引。若同時設定 `gateway.auth.token` 和 `gateway.auth.password`，但未設定 `gateway.auth.mode`，安裝會封鎖，直到明確設定模式為止。
- 本機初始設定會將 `gateway.mode="local"` 寫入設定。後續設定檔若缺少 `gateway.mode`，表示設定已損毀或手動編輯未完成，而不是有效的本機模式捷徑。
- 本機初始設定會安裝所選設定路徑所需的可下載外掛（例如，這些驗證選項所需的 Codex 或 Copilot 執行階段外掛）。遠端初始設定只會寫入遠端閘道的連線資訊，絕不安裝本機外掛套件。
- `--allow-unconfigured` 是獨立的 `openclaw gateway run` 緊急繞過選項；它不允許初始設定略過 `gateway.mode`。

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
- 如果你只想在自動化流程中寫入設定、工作區和啟動程序資料，`--skip-health` 可略過等待。
- `--skip-bootstrap` 會設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試使用排程工作；若建立工作遭拒，則改用個別使用者的啟動資料夾登入項目。

### 互動式參照模式

- 出現提示時，選擇 **使用祕密參照**，接著選擇 **環境變數** 或已設定的祕密供應商（`file` 或 `exec`）。
- 初始設定會在儲存參照前執行快速的預檢驗證，若失敗則可讓你重試。

### Z.AI 端點選項

<Note>
`--auth-choice zai-api-key` 會自動偵測最適合你的金鑰的 Z.AI 端點與模型：Coding Plan 端點優先使用 `zai/glm-5.2`（若無法使用則退回 `glm-5.1`）；一般 API 端點預設使用 `zai/glm-5.1`。若要強制使用 Coding Plan 端點，請直接選擇 `zai-coding-global` 或 `zai-coding-cn`。
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
| `--token-provider <id>`         | 核發權杖的權杖提供者 ID                                                                                         |
| `--token <token>`               | 用於模型驗證的權杖值                                                                                        |
| `--token-profile-id <id>`       | 驗證設定檔 ID（預設為 `<provider>:manual`；部分由提供者擁有的流程會使用自己的預設值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 選用的權杖到期時間長度（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

常駐程式安裝控制：`--no-install-daemon` / `--skip-daemon`（別名；略過閘道服務安裝）、`--daemon-runtime <node|bun>`。

Skills：`--node-manager <npm|pnpm|bun>`（預設為 `npm`）、`--skip-skills`。

UI 與鉤子設定：`--skip-ui`（略過 Control UI／終端介面提示）、`--skip-hooks`（略過網路鉤子／鉤子設定）、`--skip-channels`、`--skip-search`。

輸出：`--suppress-gateway-token-output` 會隱藏含權杖的閘道／UI 輸出（權杖提示、內嵌權杖的自動登入 URL，以及自動啟動 Control UI），適合用於共用終端機和 CI。

<Note>
在引導式或傳統新手設定中，`--json` 不代表非互動模式。
使用 `--modern` 時，JSON 是一次性的 Crestodian 概覽，並會在輸出該
單一結果後結束。其他指令碼請使用 `--non-interactive`。
</Note>

## 提供者預先篩選

當驗證選項隱含偏好的提供者時，新手設定會預先將預設模型與允許清單選擇器篩選為該提供者的模型。此篩選條件也會比對由同一外掛擁有的其他提供者，涵蓋 `volcengine`／`volcengine-plan` 和 `byteplus`／`byteplus-plan` 等 Coding Plan 變體。若偏好提供者篩選後沒有任何已載入的模型，新手設定會退回未篩選的目錄，而不會讓選擇器保持空白。

## 網頁搜尋後續步驟

部分網頁搜尋提供者會在新手設定期間觸發提供者專屬的後續提示：

- **Grok** 可提供選用的 `x_search` 設定，使用相同的 xAI 驗證資訊與一個 `x_search` 模型選項。
- **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

## 其他行為

- 本機新手設定的 DM 範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
- 最快開始第一次聊天的方式：`openclaw dashboard`（Control UI，無須設定頻道）。
- 自訂提供者：連線至任何相容 OpenAI 或 Anthropic 的端點，包括未列出的託管提供者。使用 **Unknown** 相容性，透過即時探測自動偵測。
- 若偵測到 Hermes 狀態，新手設定會提供移轉流程（請參閱上方的 `--flow import`）。

## 常用後續命令

之後若要進行不涉及推論的特定變更，請使用 `openclaw configure`；若只要設定頻道，請使用 `openclaw
channels add`。若要變更模型提供者或驗證路由，
請改為執行 `openclaw onboard`。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
