---
read_when:
    - 你想要在沒有本機 Ollama 伺服器的情況下使用託管的 Ollama 模型
    - 你需要 ollama-cloud 提供者 ID、金鑰或端點
summary: 直接搭配 OpenClaw 使用 Ollama Cloud
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-05T11:37:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud 是 Ollama 的託管模型 API。`ollama-cloud` 供應商會透過 Ollama 原生的 `/api/chat` API，直接在 `https://ollama.com` 呼叫它，不需要本機 Ollama 伺服器，也不需要登入雲端模式的本機 Ollama 應用程式。請使用像 `ollama-cloud/kimi-k2.6` 這樣的模型參照。

OpenClaw 會將 `ollama-cloud` 註冊為獨立的供應商 ID，讓僅限雲端的憑證、即時目錄探索與模型選擇不會和本機 `ollama` 主機混在一起。若要使用本機 Ollama、雲端加本機的混合路由、嵌入，以及自訂主機詳細資料，請參閱 [Ollama](/zh-TW/providers/ollama)。

## 設定

在 [ollama.com/settings/keys](https://ollama.com/settings/keys) 建立 Ollama Cloud API 金鑰，然後執行：

```bash
openclaw onboard --auth-choice ollama-cloud
```

或設定：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

非互動式入門設定可直接接受金鑰：

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

入門設定會將預設模型設為 `ollama-cloud/kimi-k2.5:cloud`。

## 預設值

- 供應商：`ollama-cloud`
- 基礎 URL：`https://ollama.com`
- 環境變數：`OLLAMA_API_KEY`
- API 樣式：Ollama 原生 `/api/chat`
- 入門設定預設模型：`ollama-cloud/kimi-k2.5:cloud`

## 何時選擇 Ollama Cloud

- 你想使用託管的 Ollama 模型，而不想在本機執行 `ollama serve`。
- 你想使用 OpenClaw 用於本機 Ollama 的相同原生 Ollama 聊天 API 形狀，但指向 `https://ollama.com`。
- 你想為已在 Ollama 託管目錄中的模型使用簡單的雲端路徑。
- 你不需要本機模型拉取、本機 GPU 控制，或僅限 LAN 的推論。

當你想透過已登入的 Ollama 主機使用僅限本機或雲端加本機路由時，請改用 [Ollama](/zh-TW/providers/ollama)。當你需要 `/v1/chat/completions` 語意或供應商專屬的 OpenAI 風格功能時，請改用 OpenAI 相容供應商。

## 模型

此供應商需要 API 金鑰；沒有金鑰時會保持停用。提供金鑰後，OpenClaw 會從託管目錄即時探索 Ollama Cloud 模型：

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

即時目錄中的託管 ID 包含 `deepseek-v4-flash`、`glm-5`、`gpt-oss:20b`、`kimi-k2.6` 和 `minimax-m2.7`。當即時探索沒有回傳任何內容時，OpenClaw 會退回使用內建列 `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud` 和 `glm-5.2:cloud`。

模型 ID 是雲端目錄 ID，不是本機拉取名稱。如果某個模型名稱可在本機 Ollama 主機中使用，但不存在於託管目錄，請改用連到該本機主機的 `ollama` 供應商。

## 即時測試

若要進行 Ollama Cloud API 金鑰煙霧測試，請將 Ollama 即時測試指向託管端點，並從目前目錄中選擇模型：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

雲端煙霧測試會執行文字、原生串流和網頁搜尋；設定 `OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` 可略過網頁搜尋。對於 `https://ollama.com`，它預設會略過嵌入，因為 Ollama Cloud API 金鑰可能未授權 `/api/embed`；可用 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` 強制啟用。

## 疑難排解

- `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` 錯誤：提供真正的雲端 API 金鑰。本機 `ollama-local` 標記僅適用於本機或私人 Ollama 主機。
- 未知模型錯誤：執行 `openclaw models list --provider ollama-cloud`，並完整複製託管模型 ID。
- 自訂 Ollama 主機上的工具呼叫或原始 JSON 問題：檢查你是否不小心使用了 OpenAI 相容的 `/v1` URL。Ollama 路由應使用沒有 `/v1` 後綴的原生基礎 URL。

## 相關

- [Ollama](/zh-TW/providers/ollama)
- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)
