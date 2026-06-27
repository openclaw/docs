---
read_when:
    - 你想要一個適用於頂尖開源 LLM 的單一 API 金鑰
    - 你想要透過 DeepInfra 的 API 在 OpenClaw 中執行模型
summary: 使用 DeepInfra 的統一 API 在 OpenClaw 中存取最受歡迎的開源與前沿模型
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T19:53:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra 提供一個**統一 API**，可透過單一端點與 API 金鑰，將請求路由到最熱門的開放原始碼與前沿模型。它相容於 OpenAI，因此大多數 OpenAI SDK 只要切換基礎 URL 就能使用。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## 取得 API 金鑰

1. 前往 [https://deepinfra.com/](https://deepinfra.com/)
2. 登入或建立帳號
3. 前往 Dashboard / Keys，產生新的 API 金鑰，或使用自動建立的金鑰

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

## 支援的 OpenClaw 介面

此外掛會註冊所有符合目前 OpenClaw 供應商合約的 DeepInfra 介面。聊天、圖片生成與影片生成會在設定 `DEEPINFRA_API_KEY` 時，從 `/v1/openai/models?sort_by=openclaw&filter=with_meta` 即時重新整理其模型目錄；其他介面則使用下方精選的靜態預設值。

| 介面                     | 預設模型                                                                                              | OpenClaw 設定/工具                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 聊天 / 模型供應商        | 即時目錄中第一個標記為 chat 的項目（manifest 備援 `deepseek-ai/DeepSeek-V4-Flash`）                  | `agents.defaults.model`                                  |
| 圖片生成/編輯            | 即時目錄中第一個標記為 `image-gen` 的項目（靜態備援 `black-forest-labs/FLUX-1-schnell`）             | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒體理解                 | 用於圖片的 `moonshotai/Kimi-K2.5`                                                                     | 傳入圖片理解                                             |
| 語音轉文字               | `openai/whisper-large-v3-turbo`                                                                       | 傳入音訊轉錄                                             |
| 文字轉語音               | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| 影片生成                 | 即時目錄中第一個標記為 `video-gen` 的項目（靜態備援 `Pixverse/Pixverse-T2V`）                         | `video_generate`, `agents.defaults.videoGenerationModel` |
| 記憶嵌入                 | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 也提供重排序、分類、物件偵測與其他原生模型類型。OpenClaw 目前尚未為這些類別提供一級供應商合約，因此此外掛尚未註冊它們。

## 可用模型

OpenClaw 會在啟動時動態探索可用的 DeepInfra 模型。使用 `/models deepinfra` 查看完整可用模型清單。

任何 [DeepInfra.com](https://deepinfra.com/) 上可用的模型，都可以搭配 `deepinfra/` 前綴使用：

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...以及更多
```

## 備註

- 模型參照格式為 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 預設模型：`deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- 基礎 URL：`https://api.deepinfra.com/v1/openai`
- 原生影片生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

## 相關

- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)
