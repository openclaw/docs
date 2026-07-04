---
read_when:
    - 你想要閘道、工作區、驗證、頻道與 Skills 的引導式設定
summary: '`openclaw onboard` 的命令列介面參考（互動式上手設定）'
title: 上手指南
x-i18n:
    generated_at: "2026-07-04T20:24:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

本機或遠端閘道設定的完整引導式入門流程。當你希望 OpenClaw 在單一流程中帶你完成模型驗證、工作區、閘道、頻道、Skills 和健康狀態時，請使用此指令。

## 相關指南

<CardGroup cols={2}>
  <Card title="命令列介面入門中樞" href="/zh-TW/start/wizard" icon="rocket">
    互動式命令列介面流程逐步說明。
  </Card>
  <Card title="入門概覽" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 入門流程如何組合運作。
  </Card>
  <Card title="命令列介面設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制，以及各步驟行為。
  </Card>
  <Card title="命令列介面自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與指令碼化設定。
  </Card>
  <Card title="macOS 應用程式入門" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列應用程式的入門流程。
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

`--flow import` 使用由外掛擁有的遷移提供者，例如 Hermes。它只會針對全新的 OpenClaw 設定執行；如果已有設定、憑證、工作階段，或工作區記憶體/身分檔案，請先重設或選擇全新的設定再匯入。

`--modern` 會啟動 Crestodian 對話式入門預覽。未使用
`--modern` 時，`openclaw onboard` 會保留經典入門流程。

在互動式終端機中，單獨執行 `openclaw`（沒有子命令）會依設定
狀態路由：

- 如果作用中的設定檔遺失，或沒有已撰寫的設定（空白或
  僅含中繼資料），就會啟動這個經典入門流程。
- 如果設定檔存在但驗證失敗，就會啟動
  [Crestodian](/zh-TW/cli/crestodian) 進行修復。
- 如果設定檔有效，就會開啟一般代理程式終端介面，可在本機執行，
  或連線到可連線的已設定閘道。在已設定的安裝中，
  可在終端介面內使用 `/crestodian` 或 `openclaw crestodian` 進入 Crestodian。

明文 `ws://` 可用於回送、私有 IP 字面值、`.local`，以及
Tailnet `*.ts.net` 閘道 URL。對於其他受信任的私有 DNS 名稱，請在入門流程的處理程序環境中設定
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 地區設定

互動式入門流程會使用命令列介面精靈地區設定來顯示固定設定文案。解析
順序為：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文後備

支援的精靈地區設定為 `en`、`zh-CN` 和 `zh-TW`。地區設定值可使用
底線或 POSIX 後綴形式，例如 `zh_CN.UTF-8`。產品名稱、命令
名稱、設定鍵、URL、提供者 ID、模型 ID，以及外掛/頻道標籤
會保持字面值。

範例：

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

非互動式自訂提供者：

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

`--custom-api-key` 在非互動式模式中是選用的。如果省略，入門流程會檢查 `CUSTOM_API_KEY`。
OpenClaw 會自動將常見視覺模型 ID 標記為具備影像能力。對於未知的自訂視覺 ID，請傳入 `--custom-image-input`；或傳入 `--custom-text-input` 以強制使用純文字中繼資料。
對於支援 `/v1/responses` 但不支援 `/v1/chat/completions` 的 OpenAI 相容端點，請使用 `--custom-compatibility openai-responses`。

LM Studio 在非互動式模式中也支援提供者專屬金鑰旗標：

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 是選用的；如果省略，入門流程會使用 Ollama 建議的預設值。雲端模型 ID（例如 `kimi-k2.5:cloud`）也可在此使用。

將提供者金鑰儲存為參照，而不是明文：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，入門流程會寫入由環境支援的參照，而不是明文金鑰值。
對於由驗證設定檔支援的提供者，這會寫入 `keyRef` 項目；對於自訂提供者，這會將 `models.providers.<id>.apiKey` 寫入為環境參照（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非互動式 `ref` 模式契約：

- 在入門流程的處理程序環境中設定提供者環境變數（例如 `OPENAI_API_KEY`）。
- 不要傳入行內金鑰旗標（例如 `--openai-api-key`），除非該環境變數也已設定。
- 如果傳入行內金鑰旗標但未設定必要的環境變數，入門流程會快速失敗並提供指引。

非互動式模式中的閘道權杖選項：

- `--gateway-auth token --gateway-token <token>` 會儲存明文權杖。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 彼此互斥。
- `--gateway-token-ref-env` 需要在入門流程的處理程序環境中有非空的環境變數。
- 使用 `--install-daemon` 時，如果權杖驗證需要權杖，SecretRef 管理的閘道權杖會被驗證，但不會以已解析明文形式持久化到監督程式服務環境中繼資料。
- 使用 `--install-daemon` 時，如果權杖模式需要權杖且已設定的權杖 SecretRef 無法解析，入門流程會以封閉失敗方式中止並提供修復指引。
- 使用 `--install-daemon` 時，如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，入門流程會封鎖安裝，直到明確設定模式。
- 本機入門流程會將 `gateway.mode="local"` 寫入設定。如果之後的設定檔缺少 `gateway.mode`，請將其視為設定損毀或未完成的手動編輯，而不是有效的本機模式捷徑。
- 當所選設定路徑需要時，本機入門流程會安裝選取的可下載外掛。
- 遠端入門流程只會寫入遠端閘道的連線資訊，不會安裝本機外掛套件。
- `--allow-unconfigured` 是獨立的閘道執行階段逃生閥。它不表示入門流程可以省略 `gateway.mode`。

範例：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

非互動式本機閘道健康狀態：

- 除非傳入 `--skip-health`，否則入門流程會等待可連線的本機閘道，然後才成功結束。
- `--install-daemon` 會先啟動受管理的閘道安裝路徑。若未使用它，你必須已經有本機閘道正在執行，例如 `openclaw gateway run`。
- 如果你在自動化中只想寫入設定/工作區/啟動程序，請使用 `--skip-health`。
- 如果你自行管理工作區檔案，請傳入 `--skip-bootstrap` 以設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試排程工作，若工作建立遭拒，則後備為每使用者啟動資料夾登入項目。

使用參照模式的互動式入門行為：

- 提示時選擇 **使用秘密參照**。
- 接著選擇其中一項：
  - 環境變數
  - 已設定的秘密提供者（`file` 或 `exec`）
- 入門流程會在儲存參照前執行快速預檢驗證。
  - 如果驗證失敗，入門流程會顯示錯誤並讓你重試。

### 非互動式 Z.AI 端點選擇

<Note>
`--auth-choice zai-api-key` 會自動偵測最適合你金鑰的 Z.AI 端點與模型。Coding Plan 端點偏好 `zai/glm-5.2`；一般 API 端點使用
`zai/glm-5.1`。若要強制使用 Coding Plan 端點，請選擇 `zai-coding-global` 或
`zai-coding-cn`。
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非互動式 Mistral 範例：

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 其他非互動式旗標

以權杖為基礎的模型驗證（非互動式；搭配 `--auth-choice token` 使用）：

- `--token-provider <id>` — 權杖提供者 ID。識別哪個提供者發行權杖。
- `--token <token>` — 模型驗證的權杖值。
- `--token-profile-id <id>` — 驗證設定檔 ID。通用權杖儲存預設為 `<provider>:manual`；由提供者擁有的設定流程可能會使用自己的預設值，例如 `anthropic:default`。
- `--token-expires-in <duration>` — 選用的權杖到期時長（例如 `365d`、`12h`）。

Cloudflare AI Gateway（非互動式）：

- `--cloudflare-ai-gateway-account-id <id>` — 用於透過 Cloudflare AI Gateway 路由的 Cloudflare 帳戶 ID。
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID。

常駐程式安裝控制：

- `--no-install-daemon` — 明確略過閘道服務安裝。
- `--skip-daemon` — `--no-install-daemon` 的別名。

UI 與鉤子設定控制：

- `--skip-ui` — 入門流程期間略過 Control UI / 終端介面提示。
- `--skip-hooks` — 入門流程期間略過網路鉤子 / 鉤子設定提示。

輸出抑制：

- `--suppress-gateway-token-output` — 抑制含權杖的閘道/UI 輸出（權杖提示、內嵌權杖的自動登入 URL，以及自動啟動 Control UI）。適用於共用終端機與 CI 環境。

## 流程注意事項

<AccordionGroup>
  <Accordion title="流程類型">
    - `quickstart`：最少提示，自動產生閘道權杖。
    - `manual`：完整提示連接埠、繫結與驗證（`advanced` 的別名）。
    - `import`：執行偵測到的遷移提供者、預覽計畫，然後在確認後套用。

  </Accordion>
  <Accordion title="提供者預先篩選">
    當驗證選擇暗示偏好的提供者時，入門流程會將預設模型與允許清單選擇器預先篩選為該提供者。對於 Volcengine 和 BytePlus，這也會符合 coding-plan 變體（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果偏好提供者篩選尚未產生任何已載入模型，入門流程會改為後備到未篩選的目錄，而不是讓選擇器保持空白。

  </Accordion>
  <Accordion title="網頁搜尋後續項目">
    某些網頁搜尋提供者會觸發提供者專屬的後續提示：

    - **Grok** 可使用相同的 xAI OAuth 設定檔或 API 金鑰，提供選用的 `x_search` 設定與 `x_search` 模型選擇。
    - **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設 Kimi 網頁搜尋模型。

  </Accordion>
  <Accordion title="其他行為">
    - 本機入門 DM 範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
    - 最快開始第一次聊天：`openclaw dashboard`（Control UI，無頻道設定）。
    - 自訂提供者：連接任何 OpenAI 或 Anthropic 相容端點，包括未列出的託管提供者。使用 Unknown 可自動偵測。
    - 如果偵測到 Hermes 狀態，入門流程會提供遷移流程。使用 [遷移](/zh-TW/cli/migrate) 取得試執行計畫、覆寫模式、報告和精確對應。

  </Accordion>
</AccordionGroup>

## 常見後續命令

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

使用 `openclaw setup` 作為相同的引導式導覽入口點。當你只需要基準設定/工作區時，使用 `openclaw setup --baseline`；稍後若要進行針對性變更，使用 `openclaw configure`；若只要設定頻道，則使用 `openclaw channels add`。

<Note>
`--json` 不代表非互動模式。腳本請使用 `--non-interactive`。
</Note>
