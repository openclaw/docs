---
read_when:
    - 你想用單一 API 金鑰存取頂尖的開源大型語言模型
    - 你想在 OpenClaw 中透過 DeepInfra 的 API 執行模型
summary: 使用 DeepInfra 的統一 API，在 OpenClaw 中存取最熱門的開源與前沿模型
title: DeepInfra
x-i18n:
    generated_at: "2026-07-11T21:44:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra 透過單一 OpenAI 相容端點和 API 金鑰，將請求路由至熱門的開放原始碼與前沿模型。大多數 OpenAI SDK 只要切換基礎 URL 即可搭配使用。

## 安裝外掛

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## 取得 API 金鑰

1. 在 [deepinfra.com](https://deepinfra.com/) 登入
2. 前往 Dashboard / Keys 並產生金鑰，或使用自動建立的金鑰

## 命令列介面設定

```bash
openclaw onboard --deepinfra-api-key <key>
```

或者設定環境變數：

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

## 支援的功能介面

設定 `DEEPINFRA_API_KEY` 後，聊天、影像生成與影片生成會從 `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` 即時重新整理其模型目錄。其他功能介面在遷移至相同的即時目錄之前，會使用下列靜態預設值。

| 功能介面                 | 預設模型                                                                                              | OpenClaw 設定／工具                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 聊天／模型供應商         | 即時目錄中第一個標記為聊天的項目（靜態備援為 `deepseek-ai/DeepSeek-V4-Flash`）                         | `agents.defaults.model`                                  |
| 影像生成／編輯           | 即時目錄中第一個標記為 `image-gen` 的項目（靜態備援為 `black-forest-labs/FLUX-1-schnell`）            | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒體理解                 | 影像使用 `moonshotai/Kimi-K2.5`                                                                       | 傳入影像理解                                             |
| 語音轉文字               | `openai/whisper-large-v3-turbo`                                                                       | 傳入音訊轉錄                                             |
| 文字轉語音               | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| 影片生成                 | 靜態備援為 `Pixverse/Pixverse-T2V`（DeepInfra 目前沒有即時的影片生成項目）                             | `video_generate`, `agents.defaults.videoGenerationModel` |
| 記憶嵌入                 | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 也提供重新排序、分類、物件偵測及其他原生模型類型。OpenClaw 尚未為這些類別提供供應商合約，因此此外掛不會註冊它們。

## 可用模型

設定金鑰後，OpenClaw 會動態探索 DeepInfra 模型。使用 `/models deepinfra` 或 `openclaw models list --provider deepinfra` 查看目前的清單。

[deepinfra.com](https://deepinfra.com/) 上的任何模型都可搭配 `deepinfra/` 前綴使用：

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...以及更多模型
```

## 注意事項

- 模型參照格式為 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 預設聊天模型：`deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- 基礎 URL：`https://api.deepinfra.com/v1/openai`
- 原生影片生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

## 相關內容

- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)
