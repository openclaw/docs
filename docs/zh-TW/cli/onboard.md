---
read_when:
    - 您想要針對閘道、工作區、身分驗證、通道和 Skills 進行引導式設定
summary: '`openclaw onboard` 的命令列介面參考（互動式入門設定）'
title: 上線引導
x-i18n:
    generated_at: "2026-07-05T11:12:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45cd22d23b9e3121a75c7695568cc6a03381daa6e56a64b36f407605bb4d1732
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

模型驗證、工作區、閘道、頻道、Skills 和健康狀態的一站式引導設定流程。`openclaw setup` 是相同的進入點；`openclaw setup --baseline` 只會寫入基準設定/工作區。

<CardGroup cols={2}>
  <Card title="命令列介面入門導覽中心" href="/zh-TW/start/wizard" icon="rocket">
    互動式命令列介面流程的逐步導覽。
  </Card>
  <Card title="入門導覽概覽" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 入門導覽如何串接在一起。
  </Card>
  <Card title="命令列介面設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制，以及各步驟行為。
  </Card>
  <Card title="命令列介面自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與腳本化設定。
  </Card>
  <Card title="macOS app 入門導覽" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列 app 的入門導覽流程。
  </Card>
</CardGroup>

## 範例

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--flow quickstart`：最少提示，並自動產生閘道權杖。
- `--flow manual`（別名 `advanced`）：提供連接埠、繫結與驗證的完整提示。
- `--flow import`：執行偵測到的遷移 provider（例如透過 `--import-from hermes` 使用 Hermes）、預覽計畫，然後在確認後套用。匯入只會針對全新的 OpenClaw 設定執行 - 如果已存在任何設定、憑證、工作階段和工作區狀態，請先重設。若需要 dry-run 計畫、覆寫模式、報告和精確對應，請使用 [`openclaw migrate`](/zh-TW/cli/migrate)。
- `--modern` 會啟動 Crestodian 對話式設定/修復助理，而不是經典流程。

在互動式終端機中，單純執行 `openclaw`（不加子命令）會依設定
狀態進行路由：

- 如果作用中的設定檔遺失，或沒有使用者撰寫的設定（空白或
  僅含中繼資料），就會啟動此經典入門導覽流程。
- 如果設定檔存在但驗證失敗，就會啟動
  [Crestodian](/zh-TW/cli/crestodian) 進行修復。
- 如果設定檔有效，就會開啟一般 agent 終端介面，可在本機執行，
  或連線到可連上的已設定閘道。在已設定的安裝中，
  可在終端介面內使用 `/crestodian` 或 `openclaw crestodian` 進入 Crestodian。

純文字 `ws://` 可用於 loopback、私有 IP 字面值、`.local`，以及 Tailnet `*.ts.net` 閘道 URL。若是其他受信任的 private-DNS 名稱，請在入門導覽程序環境中設定 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 重設

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` 會在執行設定前清除狀態。`--reset-scope` 控制清除範圍：`config`（僅設定）、`config+creds+sessions`（傳入 `--reset` 但未指定範圍時的預設值），或 `full`（也會重設工作區）。工作區重設只會在 `--reset-scope full` 時發生。

## 語系

互動式入門導覽會使用命令列介面精靈語系顯示固定的設定文案。解析順序：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文後備

支援的精靈語系為 `en`、`zh-CN` 和 `zh-TW`。語系值可使用底線或 POSIX 後綴形式，例如 `zh_CN.UTF-8`。產品名稱、命令名稱、設定鍵、URL、provider ID、模型 ID，以及外掛/頻道標籤會保持字面值。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非互動式設定

`--non-interactive` 需要 `--accept-risk`（表示你了解 agent 功能強大，且完整系統存取具有風險）。`--mode` 預設為 `local`。

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

`--custom-api-key` 是選用；若省略，入門導覽會檢查環境中的 `CUSTOM_API_KEY`。OpenClaw 會自動將常見視覺模型 ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral 等類似模型）標記為支援影像。對未知的自訂視覺 ID 傳入 `--custom-image-input`，或使用 `--custom-text-input` 強制僅文字中繼資料。對於支援 `/v1/responses` 但不支援 `/v1/chat/completions` 的 OpenAI 相容端點，使用 `--custom-compatibility openai-responses`；有效值為 `openai`（預設）、`openai-responses`、`anthropic`。

LM Studio 也有 provider 專用的 key 旗標：

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 是選用；若省略，入門導覽會使用 Ollama 建議的預設值。像 `kimi-k2.5:cloud` 這類雲端模型 ID 也可在此使用。

將 provider key 儲存為 ref，而不是純文字：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，入門導覽會寫入環境變數支援的 ref，而不是純文字 key 值：對以 auth-profile 為基礎的 provider，這會寫入 `keyRef: { source: "env", provider: "default", id: <envVar> }`；對自訂 provider，會以相同方式寫入 `models.providers.<id>.apiKey`（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。合約：在入門導覽程序環境中設定 provider 環境變數（例如 `OPENAI_API_KEY`），且除非該環境變數已設定，否則不要同時傳入 inline key 旗標 - 若旗標值沒有對應的環境變數，會快速失敗並提供指引。

### 閘道驗證（非互動式）

- `--gateway-auth token --gateway-token <token>` 會儲存純文字權杖。`token` 是預設驗證模式。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為 env SecretRef。需要入門導覽程序環境中存在同名且非空的環境變數。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- 搭配 `--install-daemon`：由 SecretRef 管理的 `gateway.auth.token` 會被驗證，但不會以已解析純文字形式持久化到 supervisor service 環境中繼資料；若 ref 無法解析，安裝會 fail closed 並提供修復指引。如果同時設定 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，安裝會封鎖直到明確設定 mode。
- 本機入門導覽會將 `gateway.mode="local"` 寫入設定。後續設定檔若缺少 `gateway.mode`，表示設定受損或手動編輯未完成，而不是有效的 local-mode 捷徑。
- 本機入門導覽會安裝所選設定路徑需要的可下載外掛（例如用於這些驗證選項的 Codex 或 Copilot runtime 外掛）。遠端入門導覽只會寫入遠端閘道的連線資訊 - 絕不會安裝本機外掛套件。
- `--allow-unconfigured` 是另一個獨立的 `openclaw gateway run` 逃生艙；它不允許入門導覽略過 `gateway.mode`。

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### 本機閘道健康狀態

- 除非傳入 `--skip-health`，否則入門導覽會等待本機閘道可連線後才成功結束。
- `--install-daemon` 會先啟動受管理的閘道安裝路徑。若未使用，本機閘道必須已在執行（例如 `openclaw gateway run`）。
- `--skip-health` 會略過等待，適用於只想在自動化中寫入設定/工作區/bootstrap 的情境。
- `--skip-bootstrap` 會設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試 Scheduled Tasks，若工作建立遭拒，則後備為每使用者 Startup-folder login item。

### 互動式 ref 模式

- 在提示時選擇 **使用祕密參照**，然後選擇 **環境變數** 或已設定的 secret provider（`file` 或 `exec`）。
- 入門導覽會在儲存 ref 前執行快速 preflight 驗證，並允許你在失敗時重試。

### Z.AI 端點選項

<Note>
`--auth-choice zai-api-key` 會為你的 key 自動偵測最佳 Z.AI 端點和模型：Coding Plan 端點偏好 `zai/glm-5.2`（若不可用則後備到 `glm-5.1`）；一般 API 端點預設為 `zai/glm-5.1`。若要強制使用 Coding Plan 端點，請直接選擇 `zai-coding-global` 或 `zai-coding-cn`。
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices: zai-coding-cn, zai-global, zai-cn
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
| `--token-provider <id>`         | 簽發權杖的權杖 provider id                                                                                         |
| `--token <token>`               | 用於模型驗證的權杖值                                                                                        |
| `--token-profile-id <id>`       | 驗證 profile id（預設 `<provider>:manual`；部分由 provider 擁有的流程會使用自己的預設值，例如 `anthropic:default`） |
| `--token-expires-in <duration>` | 選用的權杖到期期間（例如 `365d`、`12h`）                                                                         |

Cloudflare AI Gateway：`--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

Daemon 安裝控制：`--no-install-daemon` / `--skip-daemon`（別名；略過閘道服務安裝）、`--daemon-runtime <node|bun>`。

Skills：`--node-manager <npm|pnpm|bun>`（預設 `npm`）、`--skip-skills`。

UI 和 hook 設定：`--skip-ui`（略過 Control UI/終端介面提示）、`--skip-hooks`（略過 webhook/hook 設定）、`--skip-channels`、`--skip-search`。

輸出：`--suppress-gateway-token-output` 會抑制帶有權杖的閘道/UI 輸出（權杖提示、內嵌權杖的自動登入 URL，以及自動啟動 Control UI）- 適用於共用終端機和 CI。

<Note>
`--json` 不代表非互動式模式。腳本請使用 `--non-interactive`。
</Note>

## Provider 預先篩選

當驗證選項暗示偏好的 provider 時，入門導覽會將 default-model 和 allowlist 選擇器預先篩選為該 provider 的模型。此篩選也會比對同一外掛擁有的其他 provider，涵蓋如 `volcengine`/`volcengine-plan` 和 `byteplus`/`byteplus-plan` 這類 coding-plan 變體。若 preferred-provider 篩選沒有產生任何已載入模型，入門導覽會後備到未篩選的 catalog，而不是讓選擇器空白。

## Web-search 後續提示

部分 web-search provider 會在入門導覽期間觸發 provider 專用的後續提示：

- **Grok** 可使用相同的 xAI 驗證和 `x_search` 模型選項，提供選用的 `x_search` 設定。
- **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設 Kimi web-search 模型。

## 其他行為

- 本機入門 DM 範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
- 最快開始第一次聊天：`openclaw dashboard`（Control UI，無需頻道設定）。
- 自訂提供者：連接任何與 OpenAI 或 Anthropic 相容的端點，包括未列出的託管提供者。使用 **Unknown** 相容性，透過即時探測自動偵測。
- 如果偵測到 Hermes 狀態，入門流程會提供遷移流程（請參閱上方的 `--flow import`）。

## 常用後續命令

稍後可使用 `openclaw configure` 進行目標式變更，並使用 `openclaw channels add` 進行僅限頻道的設定。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
