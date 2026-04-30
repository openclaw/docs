---
read_when:
    - 您想要 Gateway、工作區、身分驗證、通道和 Skills 的引導式設定
summary: '`openclaw onboard` 的 CLI 參考資料（互動式新手引導）'
title: 入門
x-i18n:
    generated_at: "2026-04-30T02:55:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

用於本機或遠端 Gateway 設定的互動式導覽。

## 相關指南

<CardGroup cols={2}>
  <Card title="CLI 導覽中心" href="/zh-TW/start/wizard" icon="rocket">
    互動式 CLI 流程逐步說明。
  </Card>
  <Card title="導覽概覽" href="/zh-TW/start/onboarding-overview" icon="map">
    OpenClaw 導覽如何銜接運作。
  </Card>
  <Card title="CLI 設定參考" href="/zh-TW/start/wizard-cli-reference" icon="book">
    輸出、內部機制，以及每個步驟的行為。
  </Card>
  <Card title="CLI 自動化" href="/zh-TW/start/wizard-cli-automation" icon="terminal">
    非互動式旗標與腳本化設定。
  </Card>
  <Card title="macOS app 導覽" href="/zh-TW/start/onboarding" icon="apple">
    macOS 選單列 app 的導覽流程。
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

`--flow import` 會使用 Hermes 等由 Plugin 擁有的遷移提供者。它只會針對全新的 OpenClaw 設定執行；如果已存在設定、憑證、工作階段，或工作區記憶/身分檔案，請先重設或選擇全新設定再匯入。

`--modern` 會啟動 Crestodian 對話式導覽預覽。若未使用
`--modern`，`openclaw onboard` 會保留傳統導覽流程。

對於純文字私有網路 `ws://` 目標（僅限受信任網路），請在導覽程序環境中設定
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。
此用戶端傳輸的緊急例外設定沒有對應的 `openclaw.json` 項目。

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

在非互動式模式中，`--custom-api-key` 是選用的。若省略，導覽會檢查 `CUSTOM_API_KEY`。
OpenClaw 會自動將常見的視覺模型 ID 標記為支援圖片。對於未知的自訂視覺 ID，請傳入 `--custom-image-input`；或傳入 `--custom-text-input` 以強制使用純文字中繼資料。

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

`--custom-base-url` 預設為 `http://127.0.0.1:11434`。`--custom-model-id` 是選用的；若省略，導覽會使用 Ollama 建議的預設值。像 `kimi-k2.5:cloud` 這類雲端模型 ID 也可在此使用。

將提供者金鑰儲存為參照，而非純文字：

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

使用 `--secret-input-mode ref` 時，導覽會寫入由環境支援的參照，而非純文字金鑰值。
對於由 auth-profile 支援的提供者，這會寫入 `keyRef` 項目；對於自訂提供者，這會將 `models.providers.<id>.apiKey` 寫成環境參照（例如 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非互動式 `ref` 模式合約：

- 在導覽程序環境中設定提供者環境變數（例如 `OPENAI_API_KEY`）。
- 除非也已設定該環境變數，否則不要傳入行內金鑰旗標（例如 `--openai-api-key`）。
- 如果傳入行內金鑰旗標但缺少必要的環境變數，導覽會快速失敗並提供指引。

非互動式模式中的 Gateway 權杖選項：

- `--gateway-auth token --gateway-token <token>` 會儲存純文字權杖。
- `--gateway-auth token --gateway-token-ref-env <name>` 會將 `gateway.auth.token` 儲存為環境 SecretRef。
- `--gateway-token` 和 `--gateway-token-ref-env` 互斥。
- `--gateway-token-ref-env` 要求導覽程序環境中存在非空的環境變數。
- 使用 `--install-daemon` 時，若權杖驗證需要權杖，由 SecretRef 管理的 Gateway 權杖會被驗證，但不會以解析後的純文字形式保存到 supervisor 服務環境中繼資料。
- 使用 `--install-daemon` 時，若權杖模式需要權杖，且已設定的權杖 SecretRef 無法解析，導覽會關閉式失敗並提供修復指引。
- 使用 `--install-daemon` 時，若同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，導覽會阻止安裝，直到明確設定模式。
- 本機導覽會將 `gateway.mode="local"` 寫入設定。如果後續設定檔缺少 `gateway.mode`，請將其視為設定損壞或未完成的手動編輯，而不是有效的本機模式捷徑。
- `--allow-unconfigured` 是獨立的 Gateway 執行階段逃生口。它不表示導覽可以省略 `gateway.mode`。

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

- 除非傳入 `--skip-health`，否則導覽會等待可連線的本機 Gateway，然後才成功結束。
- `--install-daemon` 會先啟動受管理的 Gateway 安裝路徑。若未使用它，則必須已有本機 Gateway 在執行，例如 `openclaw gateway run`。
- 如果在自動化中只想寫入設定/工作區/bootstrap，請使用 `--skip-health`。
- 如果自行管理工作區檔案，請傳入 `--skip-bootstrap` 以設定 `agents.defaults.skipBootstrap: true`，並略過建立 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 和 `BOOTSTRAP.md`。
- 在原生 Windows 上，`--install-daemon` 會先嘗試 Scheduled Tasks；如果建立工作遭拒，則退回為每位使用者的 Startup 資料夾登入項目。

使用參照模式時的互動式導覽行為：

- 出現提示時選擇 **使用秘密參照**。
- 然後選擇以下其中之一：
  - 環境變數
  - 已設定的秘密提供者（`file` 或 `exec`）
- 導覽會在儲存參照前執行快速預檢驗證。
  - 如果驗證失敗，導覽會顯示錯誤並讓你重試。

### 非互動式 Z.AI 端點選擇

<Note>
`--auth-choice zai-api-key` 會自動偵測最適合你金鑰的 Z.AI 端點（偏好使用搭配 `zai/glm-5.1` 的通用 API）。如果你明確想使用 GLM Coding Plan 端點，請選擇 `zai-coding-global` 或 `zai-coding-cn`。
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
  <Accordion title="流程類型">
    - `quickstart`：最少提示，自動產生 Gateway 權杖。
    - `manual`：完整提示連接埠、繫結與驗證（`advanced` 的別名）。
    - `import`：執行偵測到的遷移提供者，預覽計畫，然後在確認後套用。

  </Accordion>
  <Accordion title="提供者預先篩選">
    當驗證選項暗示偏好的提供者時，導覽會將預設模型與允許清單選擇器預先篩選到該提供者。對於 Volcengine 和 BytePlus，這也會符合 coding-plan 變體（`volcengine-plan/*`、`byteplus-plan/*`）。

    如果偏好提供者篩選尚未產生任何已載入模型，導覽會退回未篩選的目錄，而不是讓選擇器留空。

  </Accordion>
  <Accordion title="網頁搜尋後續提示">
    某些網頁搜尋提供者會觸發提供者專屬的後續提示：

    - **Grok** 可以使用相同的 `XAI_API_KEY` 和 `x_search` 模型選項，提供選用的 `x_search` 設定。
    - **Kimi** 可以詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設 Kimi 網頁搜尋模型。

  </Accordion>
  <Accordion title="其他行為">
    - 本機導覽 DM 範圍行為：[CLI 設定參考](/zh-TW/start/wizard-cli-reference#outputs-and-internals)。
    - 最快開始第一次聊天：`openclaw dashboard`（Control UI，無需設定頻道）。
    - 自訂提供者：連接任何與 OpenAI 或 Anthropic 相容的端點，包括未列出的託管提供者。使用 Unknown 可自動偵測。
    - 如果偵測到 Hermes 狀態，導覽會提供遷移流程。使用 [遷移](/zh-TW/cli/migrate) 取得 dry-run 計畫、覆寫模式、報告，以及精確對應。

  </Accordion>
</AccordionGroup>

## 常見後續命令

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` 不代表非互動式模式。腳本請使用 `--non-interactive`。
</Note>
