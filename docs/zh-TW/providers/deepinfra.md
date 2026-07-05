---
read_when:
    - 你想要用單一 API 金鑰存取頂尖開源 LLMs
    - 您想要透過 DeepInfra 的 API 在 OpenClaw 中執行模型
summary: 在 OpenClaw 中使用 DeepInfra 的統一 API 存取最受歡迎的開放原始碼與前沿模型
title: DeepInfra
x-i18n:
    generated_at: "2026-07-05T11:36:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra 透過單一 OpenAI 相容端點和 API 金鑰，將請求路由到熱門開源模型與前沿模型。大多數 OpenAI SDK 只要切換基底 URL，就能搭配使用。

## 安裝外掛

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## 取得 API 金鑰

1. 登入 [deepinfra.com](https://deepinfra.com/)
2. 前往 Dashboard / Keys 並產生金鑰，或使用自動建立的金鑰

## 命令列介面設定

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## 支援的介面

一旦設定 `DEEPINFRA_API_KEY`，聊天、影像生成和影片生成會即時從 `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` 重新整理其模型目錄。其他介面會使用下方的靜態預設值，直到它們移至相同的即時目錄。

| 介面                     | 預設模型                                                                                              | OpenClaw 設定/工具                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 聊天 / 模型提供者        | 即時目錄中第一個標記為聊天的項目（靜態備援 `deepseek-ai/DeepSeek-V4-Flash`）                         | `agents.defaults.model`                                  |
| 影像生成/編輯            | 即時目錄中第一個標記為 `image-gen` 的項目（靜態備援 `black-forest-labs/FLUX-1-schnell`）             | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒體理解                 | 影像使用 `moonshotai/Kimi-K2.5`                                                                       | 傳入影像理解                                             |
| 語音轉文字               | `openai/whisper-large-v3-turbo`                                                                       | 傳入音訊轉錄                                             |
| 文字轉語音               | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| 影片生成                 | 靜態備援 `Pixverse/Pixverse-T2V`（DeepInfra 目前沒有即時 video-gen 列）                               | `video_generate`, `agents.defaults.videoGenerationModel` |
| 記憶嵌入                 | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 也公開重新排序、分類、物件偵測和其他原生模型類型。OpenClaw 目前尚未為這些類別提供提供者合約，因此此外掛不會註冊它們。

## 可用模型

設定金鑰後，OpenClaw 會動態探索 DeepInfra 模型。使用 `/models deepinfra` 或 `openclaw models list --provider deepinfra` 查看目前清單。

[deepinfra.com](https://deepinfra.com/) 上的任何模型都可搭配 `deepinfra/` 前綴使用：

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## 注意事項

- 模型參照為 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 預設聊天模型：`deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- 基底 URL：`https://api.deepinfra.com/v1/openai`
- 原生影片生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

## 相關

- [模型提供者](/zh-TW/concepts/model-providers)
- [所有提供者](/zh-TW/providers/index)
