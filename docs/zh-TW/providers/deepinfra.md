---
read_when:
    - 你想要一組可用於頂尖開源 LLM 的 API 金鑰
    - 你想在 OpenClaw 中透過 DeepInfra 的 API 執行模型
summary: 使用 DeepInfra 的統一 API，在 OpenClaw 中存取最熱門的開源與前沿模型
x-i18n:
    generated_at: "2026-04-30T03:30:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra 提供**統一 API**，可透過單一端點和 API 金鑰，將請求路由至最受歡迎的開源與前沿模型。它與 OpenAI 相容，因此大多數 OpenAI SDK 只要切換基礎 URL 即可運作。

## 取得 API 金鑰

1. 前往 [https://deepinfra.com/](https://deepinfra.com/)
2. 登入或建立帳號
3. 前往 Dashboard / Keys，生成新的 API 金鑰，或使用自動建立的金鑰

## CLI 設定

```bash
openclaw onboard --deepinfra-api-key <key>
```

或設定環境變數：

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## 設定片段

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## 支援的 OpenClaw 介面

隨附的 Plugin 會註冊所有符合目前 OpenClaw 供應商合約的 DeepInfra 介面：

| 介面                     | 預設模型                           | OpenClaw 設定／工具                                      |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| 聊天／模型供應商         | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| 影像生成／編輯           | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒體理解                 | `moonshotai/Kimi-K2.5` for images  | 傳入影像理解                                             |
| 語音轉文字               | `openai/whisper-large-v3-turbo`    | 傳入音訊轉錄                                             |
| 文字轉語音               | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| 影片生成                 | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| 記憶嵌入                 | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 也公開重新排序、分類、物件偵測與其他原生模型類型。OpenClaw 目前尚未為這些類別提供一級供應商合約，因此此 Plugin 尚未註冊它們。

## 可用模型

OpenClaw 會在啟動時動態探索可用的 DeepInfra 模型。使用 `/models deepinfra` 查看完整可用模型清單。

任何 [DeepInfra.com](https://deepinfra.com/) 上可用的模型，都可以搭配 `deepinfra/` 前綴使用：

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## 注意事項

- 模型參照為 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 預設模型：`deepinfra/deepseek-ai/DeepSeek-V3.2`
- 基礎 URL：`https://api.deepinfra.com/v1/openai`
- 原生影片生成使用 `https://api.deepinfra.com/v1/inference/<model>`。
