---
read_when:
    - 你想要針對 Gateway、工作區、認證、頻道和 Skills 進行引導式設定
summary: '`openclaw onboard` 的 CLI 參考（互動式入門設定）'
title: 入門設定
x-i18n:
    generated_at: "2026-05-10T19:28:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

本機或遠端 Gateway 設定的完整引導式導覽。當你想讓 OpenClaw 在單一流程中逐步完成模型驗證、工作區、Gateway、頻道、Skills 與健康狀態時使用。

## 相關指南

<CardGroup cols={2}>
  <Card title="CLI 導覽中樞" href="/zh-TW/start/wizard" icon="rocket">
    互動式 CLI 流程逐步說明。
  </Card>
  <Card title="導覽概覽" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 導覽如何整合運作。
  </Card>
  <Card title="CLI 設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制與各步驟行為。
  </Card>
  <Card title="CLI 自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與指令碼化設定。
  </Card>
  <Card title="macOS App 導覽" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列 App 的導覽流程。
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

`--flow import` 會使用 Plugin 擁有的遷移提供者，例如 Hermes。它只會針對全新的 OpenClaw 設定執行；如果已有設定、憑證、工作階段或工作區記憶/身分檔案，請先重設或選擇全新設定再匯入。

`--modern` 會啟動 Crestodian 對話式導覽預覽。不使用
`--modern` 時，`openclaw onboard` 會保留傳統導覽流程。

對於純文字私有網路 `ws://` 目標（僅限受信任網路），請在導覽程序環境中設定
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。
此用戶端傳輸的緊急例外沒有對應的 `openclaw.json`
設定。

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

`--custom-api-key` 在非互動式模式中是選用的。如果省略，導覽會檢查 `CUSTOM_API_KEY`。
OpenClaw 會自動將常見的視覺模型 ID 標記為支援影像。對於未知的自訂視覺 ID，請傳入 `--custom-image-input`；或傳入 `--custom-text-input` 以強制只使用文字中繼資料。

LM Studio 在非互動式模式中也支援提供者專用金鑰旗標：

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 是選用的；如果省略，導覽會使用 Ollama 建議的預設值。像 `kimi-k2.5:cloud` 這類雲端模型 ID 也可在此使用。

將提供者金鑰儲存為參照，而非純文字：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，導覽會寫入環境變數支援的參照，而不是純文字金鑰值。
對於由驗證設定檔支援的提供者，這會寫入 `keyRef` 項目；對於自訂提供者，這會將 `models.providers.<id>.apiKey` 寫入為環境變數參照（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非互動式 `ref` 模式合約：

- 在導覽程序環境中設定提供者環境變數（例如 `OPENAI_API_KEY`）。
- 不要傳入行內金鑰旗標（例如 `--openai-api-key`），除非該環境變數也已設定。
- 如果傳入行內金鑰旗標但缺少必要的環境變數，導覽會快速失敗並提供指引。

非互動式模式中的 Gateway 權杖選項：

- `--gateway-auth token --gateway-token <token>` 會儲存純文字權杖。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境變數 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 需要導覽程序環境中存在非空的環境變數。
- 搭配 `--install-daemon` 時，當權杖驗證需要權杖，SecretRef 管理的 Gateway 權杖會被驗證，但不會以已解析純文字形式保存在監督程式服務環境中繼資料中。
- 搭配 `--install-daemon` 時，如果權杖模式需要權杖且設定的權杖 SecretRef 無法解析，導覽會封閉失敗並提供修復指引。
- 搭配 `--install-daemon` 時，如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，且未設定 `gateway.auth.mode`，導覽會阻止安裝直到明確設定模式。
- 本機導覽會將 `gateway.mode="local"` 寫入設定。如果之後的設定檔缺少 `gateway.mode`，請將其視為設定損毀或未完成的手動編輯，而不是有效的本機模式捷徑。
- 當所選設定路徑需要時，本機導覽會安裝選定的可下載 Plugin。
- 遠端導覽只會寫入遠端 Gateway 的連線資訊，不會安裝本機 Plugin 套件。
- `--allow-unconfigured` 是獨立的 Gateway 執行階段逃生開關。它不代表導覽可以省略 `gateway.mode`。

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

非互動式本機 Gateway 健康狀態：

- 除非你傳入 `--skip-health`，否則導覽會等待可連線的本機 Gateway，然後才會成功結束。
- `--install-daemon` 會先啟動受管理的 Gateway 安裝路徑。若未使用它，你必須已經有本機 Gateway 正在執行，例如 `openclaw gateway run`。
- 如果你只想在自動化中寫入設定/工作區/啟動檔，請使用 `--skip-health`。
- 如果你自行管理工作區檔案，請傳入 `--skip-bootstrap` 以設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試排程工作；如果工作建立遭拒，則退回為每位使用者 Startup 資料夾登入項目。

使用參照模式時的互動式導覽行為：

- 提示時選擇 **使用秘密參照**。
- 接著選擇下列其中一項：
  - 環境變數
  - 已設定的秘密提供者（`file` 或 `exec`）
- 導覽會在儲存參照前執行快速預檢驗證。
  - 如果驗證失敗，導覽會顯示錯誤並讓你重試。

### 非互動式 Z.AI 端點選擇

<Note>
`--auth-choice zai-api-key` 會自動偵測最適合你的金鑰的 Z.AI 端點（偏好使用一般 API 搭配 `zai/glm-5.1`）。如果你特別想使用 GLM Coding Plan 端點，請選擇 `zai-coding-global` 或 `zai-coding-cn`。
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

## 流程說明

<AccordionGroup>
  <Accordion title="流程類型">
    - `quickstart`：最少提示，自動產生 Gateway 權杖。
    - `manual`：針對連接埠、繫結與驗證提供完整提示（`advanced` 的別名）。
    - `import`：執行偵測到的遷移提供者，預覽計畫，然後在確認後套用。

  </Accordion>
  <Accordion title="提供者預先篩選">
    當驗證選擇暗示偏好的提供者時，導覽會將預設模型與允許清單選擇器預先篩選到該提供者。對於 Volcengine 和 BytePlus，這也會比對 coding-plan 變體（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果偏好提供者篩選尚未產生任何已載入模型，導覽會退回未篩選的目錄，而不是讓選擇器留空。

  </Accordion>
  <Accordion title="網頁搜尋後續提示">
    某些網頁搜尋提供者會觸發提供者專用的後續提示：

    - **Grok** 可使用相同的 `XAI_API_KEY` 與 `x_search` 模型選擇，提供選用的 `x_search` 設定。
    - **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）與預設 Kimi 網頁搜尋模型。

  </Accordion>
  <Accordion title="其他行為">
    - 本機導覽 DM 範圍行為：[CLI 設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
    - 最快的首次聊天：`openclaw dashboard`（Control UI，無需頻道設定）。
    - 自訂提供者：連接任何 OpenAI 或 Anthropic 相容端點，包括未列出的代管提供者。使用 Unknown 來自動偵測。
    - 如果偵測到 Hermes 狀態，導覽會提供遷移流程。使用 [遷移](/zh-TW/cli/migrate) 取得 dry-run 計畫、覆寫模式、報告與精確對應。

  </Accordion>
</AccordionGroup>

## 常用後續命令

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

當你只需要基準設定/工作區時，請改用 `openclaw setup`。之後可使用 `openclaw configure` 進行目標式變更，並使用 `openclaw channels add` 進行僅頻道設定。

<Note>
`--json` 不代表非互動式模式。指令碼請使用 `--non-interactive`。
</Note>
