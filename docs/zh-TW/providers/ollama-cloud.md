---
read_when:
    - 你想在沒有本機 Ollama 伺服器的情況下使用託管的 Ollama 模型
    - 你需要 ollama-cloud 提供者 ID、金鑰或端點
summary: 直接搭配 OpenClaw 使用 Ollama Cloud
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T19:56:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud 是 Ollama 的託管模型 API。它讓 OpenClaw 可以直接呼叫由 Ollama 託管的模型，而不需要安裝本機 Ollama 伺服器，也不需要將本機 Ollama app 登入雲端模式。請使用提供者 ID `ollama-cloud`，以及像 `ollama-cloud/kimi-k2.6` 這樣的模型參照。

本頁適用於僅雲端的直接路由。此提供者使用 Ollama 原生的 `/api/chat` 風格，而不是 OpenAI 相容的 `/v1` 路由。OpenClaw 會將它註冊為獨立的提供者 ID，讓僅雲端憑證、即時目錄探索和模型選擇不會與本機 `ollama` 主機混在一起。

當你想要僅雲端路由時，請使用本頁。若要使用本機 Ollama、雲端加本機的混合路由、嵌入，以及自訂主機詳細資訊，請參閱 [Ollama](/zh-TW/providers/ollama)。

## 設定

在 [ollama.com/settings/keys](https://ollama.com/settings/keys) 建立 Ollama Cloud API 金鑰，然後執行：

```bash
openclaw onboard --auth-choice ollama-cloud
```

或設定：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## 預設值

- 提供者：`ollama-cloud`
- 基底 URL：`https://ollama.com`
- 環境變數：`OLLAMA_API_KEY`
- API 風格：Ollama 原生 `/api/chat`
- 範例模型：`ollama-cloud/kimi-k2.6`

## 何時選擇 Ollama Cloud

- 你想要使用託管的 Ollama 模型，而不在本機執行 `ollama serve`。
- 你想要 OpenClaw 用於本機 Ollama 的相同原生 Ollama 聊天 API 形狀，但指向 `https://ollama.com`。
- 你想要針對已在 Ollama 託管目錄中的模型使用簡單的雲端路徑。
- 你不需要本機模型拉取、本機 GPU 控制，或僅限 LAN 的推論。

當你想透過已登入的 Ollama 主機使用僅本機或雲端加本機路由時，請改用 [Ollama](/zh-TW/providers/ollama)。當你需要 `/v1/chat/completions` 語意或提供者特定的 OpenAI 風格功能時，請改用 OpenAI 相容提供者。

## 模型

OpenClaw 會從即時託管目錄探索 Ollama Cloud 模型。常見可用的託管 ID 包含：

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

請使用目前託管目錄中的模型 ID：

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

模型 ID 是雲端目錄 ID，不是本機拉取名稱。如果某個模型名稱可在本機 Ollama 主機運作，但不存在於託管目錄中，請改用搭配該本機主機的 `ollama` 提供者。

## 即時測試

若要執行 Ollama Cloud API 金鑰煙霧測試，請將 Ollama 即時測試指向託管端點，並從目前目錄選擇模型：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

雲端煙霧測試會執行文字、原生串流和網頁搜尋。對於 `https://ollama.com`，它預設會跳過嵌入，因為 Ollama Cloud API 金鑰可能未授權 `/api/embed`。

## 疑難排解

- `Set OLLAMA_API_KEY` 錯誤：請提供真正的雲端 API 金鑰。本機 `ollama-local` 標記僅適用於本機或私有 Ollama 主機。
- 未知模型錯誤：執行 `openclaw models list --provider ollama-cloud`，並完整複製託管模型 ID。
- 自訂 Ollama 主機上的工具呼叫或原始 JSON 問題：請檢查你是否不小心使用了 OpenAI 相容的 `/v1` URL。Ollama 路由應使用原生基底 URL，且不加 `/v1` 後綴。

## 相關

- [Ollama](/zh-TW/providers/ollama)
- [模型提供者](/zh-TW/concepts/model-providers)
- [所有提供者](/zh-TW/providers/index)
