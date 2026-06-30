---
read_when:
    - 你想要針對閘道、工作區、驗證、頻道和 Skills 進行引導式設定
summary: '`openclaw onboard`（互動式初始設定）的命令列介面參考'
title: 入門設定
x-i18n:
    generated_at: "2026-06-30T22:05:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

本機或遠端閘道設定的完整引導式初始設定。當你想讓 OpenClaw 在單一流程中逐步完成模型驗證、工作區、閘道、通道、Skills 與健康狀態時使用。

## 相關指南

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/zh-TW/start/wizard" icon="rocket">
    互動式命令列介面流程逐步解說。
  </Card>
  <Card title="Onboarding overview" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 初始設定如何彼此配合。
  </Card>
  <Card title="CLI setup reference" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制與每個步驟的行為。
  </Card>
  <Card title="CLI automation" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與指令碼化設定。
  </Card>
  <Card title="macOS app onboarding" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列應用程式的初始設定流程。
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

`--flow import` 會使用由外掛擁有的遷移提供者，例如 Hermes。它只會針對全新的 OpenClaw 設定執行；如果已存在設定、憑證、工作階段或工作區記憶/身分檔案，請先重設或選擇全新設定再匯入。

`--modern` 會啟動 Crestodian 對話式初始設定預覽。未使用
`--modern` 時，`openclaw onboard` 會保留傳統初始設定流程。

在全新安裝中，如果作用中的設定檔遺失，或沒有作者設定
（空白或僅含中繼資料），單獨執行 `openclaw` 也會啟動傳統
初始設定流程。設定檔一旦有作者設定，單獨執行 `openclaw`
就會改為開啟 Crestodian。

純文字 `ws://` 可用於 loopback、私有 IP 字面值、`.local`，以及
Tailnet `*.ts.net` 閘道 URL。對於其他受信任的私有 DNS 名稱，請在初始設定程序環境中設定
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

## 語系

互動式初始設定會使用命令列介面精靈語系來顯示固定設定文字。解析
順序為：

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英文後援

支援的精靈語系為 `en`、`zh-CN` 和 `zh-TW`。語系值可使用
底線或 POSIX 後綴格式，例如 `zh_CN.UTF-8`。產品名稱、命令
名稱、設定鍵、URL、提供者 ID、模型 ID，以及外掛/通道標籤
會保持原樣。

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

在非互動式模式中，`--custom-api-key` 是選用的。若省略，初始設定會檢查 `CUSTOM_API_KEY`。
OpenClaw 會自動將常見視覺模型 ID 標記為支援影像。對未知的自訂視覺 ID 傳入 `--custom-image-input`，或傳入 `--custom-text-input` 以強制使用純文字中繼資料。
對支援 `/v1/responses` 但不支援 `/v1/chat/completions` 的 OpenAI 相容端點，請使用 `--custom-compatibility openai-responses`。

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 是選用的；若省略，初始設定會使用 Ollama 建議的預設值。像 `kimi-k2.5:cloud` 這類雲端模型 ID 也可在此使用。

將提供者金鑰儲存為參照，而非純文字：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，初始設定會寫入由環境支援的參照，而不是純文字金鑰值。
對於由驗證設定檔支援的提供者，這會寫入 `keyRef` 項目；對於自訂提供者，這會將 `models.providers.<id>.apiKey` 寫為環境參照（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非互動式 `ref` 模式合約：

- 在初始設定程序環境中設定提供者環境變數（例如 `OPENAI_API_KEY`）。
- 除非該環境變數也已設定，否則不要傳入行內金鑰旗標（例如 `--openai-api-key`）。
- 如果傳入行內金鑰旗標但缺少必要環境變數，初始設定會快速失敗並提供指引。

非互動式模式中的閘道權杖選項：

- `--gateway-auth token --gateway-token <token>` 會儲存純文字權杖。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境 SecretRef。
- `--gateway-token` 與 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 需要初始設定程序環境中有非空白的環境變數。
- 使用 `--install-daemon` 時，若權杖驗證需要權杖，SecretRef 管理的閘道權杖會被驗證，但不會以已解析的純文字形式保存到監督器服務環境中繼資料中。
- 使用 `--install-daemon` 時，若權杖模式需要權杖且已設定的權杖 SecretRef 無法解析，初始設定會關閉失敗並提供修復指引。
- 使用 `--install-daemon` 時，若同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，初始設定會阻擋安裝，直到明確設定模式。
- 本機初始設定會將 `gateway.mode="local"` 寫入設定。如果之後的設定檔缺少 `gateway.mode`，請將其視為設定損毀或未完成的手動編輯，而不是有效的本機模式捷徑。
- 當所選設定路徑需要時，本機初始設定會安裝選取的可下載外掛。
- 遠端初始設定只會寫入遠端閘道的連線資訊，不會安裝本機外掛套件。
- `--allow-unconfigured` 是獨立的閘道執行階段逃生口。它不表示初始設定可以省略 `gateway.mode`。

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

- 除非你傳入 `--skip-health`，否則初始設定會等待可連線的本機閘道，然後才成功結束。
- `--install-daemon` 會先啟動受管理的閘道安裝路徑。若未使用它，你必須已經有本機閘道在執行，例如 `openclaw gateway run`。
- 如果你在自動化中只需要寫入設定/工作區/bootstrap，請使用 `--skip-health`。
- 如果你自行管理工作區檔案，請傳入 `--skip-bootstrap` 以設定 `agents.defaults.skipBootstrap: true`，並跳過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試工作排程器，若建立工作遭拒，則退回為每位使用者的啟動資料夾登入項目。

參照模式下的互動式初始設定行為：

- 出現提示時，選擇 **Use secret reference**。
- 接著選擇其一：
  - 環境變數
  - 已設定的秘密提供者（`file` 或 `exec`）
- 初始設定會在儲存參照前執行快速預檢驗證。
  - 如果驗證失敗，初始設定會顯示錯誤並讓你重試。

### 非互動式 Z.AI 端點選擇

<Note>
`--auth-choice zai-api-key` 會自動偵測最適合你的金鑰的 Z.AI 端點與模型。Coding Plan 端點偏好 `zai/glm-5.2`；一般 API 端點使用 `zai/glm-5.1`。若要強制使用 Coding Plan 端點，請選擇 `zai-coding-global` 或
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

## 流程備註

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`：最少提示，自動產生閘道權杖。
    - `manual`：針對連接埠、繫結與驗證的完整提示（`advanced` 的別名）。
    - `import`：執行偵測到的遷移提供者、預覽計畫，然後在確認後套用。

  </Accordion>
  <Accordion title="Provider prefiltering">
    當驗證選擇暗示偏好的提供者時，初始設定會將預設模型與允許清單選擇器預先篩選到該提供者。對 Volcengine 和 BytePlus 而言，這也會符合 coding-plan 變體（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果偏好提供者篩選尚未產生任何已載入模型，初始設定會改為退回未篩選的目錄，而不是讓選擇器保持空白。

  </Accordion>
  <Accordion title="Web-search follow-ups">
    某些網頁搜尋提供者會觸發提供者專屬的後續提示：

    - **Grok** 可以使用相同的 xAI OAuth 設定檔或 API 金鑰，以及 `x_search` 模型選擇，提供選用的 `x_search` 設定。
    - **Kimi** 可以要求 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設 Kimi 網頁搜尋模型。

  </Accordion>
  <Accordion title="Other behaviors">
    - 本機初始設定 DM 範圍行為：[命令列介面設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
    - 最快的首次聊天：`openclaw dashboard`（Control UI，無需通道設定）。
    - 自訂提供者：連線任何 OpenAI 或 Anthropic 相容端點，包括未列出的託管提供者。使用 Unknown 來自動偵測。
    - 如果偵測到 Hermes 狀態，初始設定會提供遷移流程。使用 [Migrate](/zh-TW/cli/migrate) 取得 dry-run 計畫、覆寫模式、報告與精確對應。

  </Accordion>
</AccordionGroup>

## 常見後續命令

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

使用 `openclaw setup` 作為相同的引導式初始設定進入點。當你只需要基準設定/工作區時使用 `openclaw setup --baseline`，稍後使用 `openclaw configure` 進行目標式變更，並使用 `openclaw channels add` 進行僅通道設定。

<Note>
`--json` 不代表非互動式模式。指令碼請使用 `--non-interactive`。
</Note>
