---
read_when:
    - 你想要一組可用於頂尖開源大型語言模型的單一 API 金鑰
    - 您想要在 OpenClaw 中透過 DeepInfra 的 API 執行模型
summary: 使用 DeepInfra 的統一 API，在 OpenClaw 中存取最受歡迎的開源與前沿模型
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T09:16:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra 提供一個**統一 API**，可將請求路由到最受歡迎的開源與前沿模型，並透過單一端點和 API 金鑰使用。它與 OpenAI 相容，因此多數 OpenAI SDK 只要切換基底 URL 即可運作。

## 取得 API 金鑰

1. 前往 [https://deepinfra.com/](https://deepinfra.com/)
2. 登入或建立帳號
3. 導覽至 Dashboard / Keys，產生新的 API 金鑰，或使用自動建立的金鑰

## CLI 設定

```bash
openclaw onboard --deepinfra-api-key <key>
```

或設定環境變數：

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Config 片段

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

| 介面                     | 預設模型                           | OpenClaw 設定/工具                                      |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| 聊天 / 模型供應商        | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| 圖片生成/編輯            | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒體理解                 | `moonshotai/Kimi-K2.5` for images  | 傳入圖片理解                                             |
| 語音轉文字               | `openai/whisper-large-v3-turbo`    | 傳入音訊轉錄                                             |
| 文字轉語音               | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| 影片生成                 | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| 記憶嵌入                 | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 也公開重排序、分類、物件偵測，以及其他原生模型類型。OpenClaw 目前尚未為這些類別提供一級供應商合約，因此此 Plugin 尚未註冊它們。

## 可用模型

OpenClaw 會在啟動時動態探索可用的 DeepInfra 模型。使用 `/models deepinfra` 查看完整的可用模型清單。

[DeepInfra.com](https://deepinfra.com/) 上任何可用模型都可以搭配 `deepinfra/` 前綴使用：

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
- 基底 URL：`https://api.deepinfra.com/v1/openai`
- 原生影片生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

## 相關

- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)
