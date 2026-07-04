---
read_when:
    - 你想選擇模型提供者
    - 你需要快速概覽支援的 LLM 後端
summary: OpenClaw 支援的模型供應商（LLM）
title: 提供者目錄
x-i18n:
    generated_at: "2026-07-04T03:36:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3386b41b340048f7ace61077e724a70af36dda83c65d211dde5081b378b1b448
    source_path: providers/index.md
    workflow: 16
---

OpenClaw 可以使用許多 LLM 供應商。選擇供應商、完成驗證，然後將
預設模型設定為 `provider/model`。

在找聊天頻道文件（WhatsApp/Telegram/Discord/Slack/Mattermost（外掛）/等等）嗎？請參閱[頻道](/zh-TW/channels)。

## 快速開始

1. 使用供應商完成驗證（通常透過 `openclaw onboard`）。
2. 設定預設模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 供應商文件

- [Alibaba Model Studio](/zh-TW/providers/alibaba)
- [Amazon Bedrock](/zh-TW/providers/bedrock)
- [Amazon Bedrock Mantle](/zh-TW/providers/bedrock-mantle)
- [Anthropic（API + Claude CLI）](/zh-TW/providers/anthropic)
- [Arcee AI（Trinity 模型）](/zh-TW/providers/arcee)
- [Azure Speech](/zh-TW/providers/azure-speech)
- [BytePlus（國際版）](/zh-TW/concepts/model-providers#byteplus-international)
- [Cerebras](/zh-TW/providers/cerebras)
- [Chutes](/zh-TW/providers/chutes)
- [ClawRouter（受管理的多供應商路由）](/providers/clawrouter)
- [Cohere](/zh-TW/providers/cohere)
- [Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
- [ComfyUI](/zh-TW/providers/comfy)
- [DeepSeek](/zh-TW/providers/deepseek)
- [ds4（本機 DeepSeek V4）](/zh-TW/providers/ds4)
- [ElevenLabs](/zh-TW/providers/elevenlabs)
- [fal](/zh-TW/providers/fal)
- [Fireworks](/zh-TW/providers/fireworks)
- [GitHub Copilot](/zh-TW/providers/github-copilot)
- [GMI Cloud](/zh-TW/providers/gmi)
- [Google（Gemini）](/zh-TW/providers/google)
- [Gradium](/zh-TW/providers/gradium)
- [Groq（LPU 推論）](/zh-TW/providers/groq)
- [Hugging Face（推論）](/zh-TW/providers/huggingface)
- [inferrs（本機模型）](/zh-TW/providers/inferrs)
- [Kilocode](/zh-TW/providers/kilocode)
- [LiteLLM（統一閘道）](/zh-TW/providers/litellm)
- [LM Studio（本機模型）](/zh-TW/providers/lmstudio)
- [MiniMax](/zh-TW/providers/minimax)
- [Mistral](/zh-TW/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/zh-TW/providers/moonshot)
- [NVIDIA](/zh-TW/providers/nvidia)
- [NovitaAI](/zh-TW/providers/novita)
- [Ollama（雲端 + 本機模型）](/zh-TW/providers/ollama)
- [Ollama Cloud](/zh-TW/providers/ollama-cloud)
- [OpenAI（API + Codex）](/zh-TW/providers/openai)
- [OpenCode](/zh-TW/providers/opencode)
- [OpenCode Go](/zh-TW/providers/opencode-go)
- [OpenRouter](/zh-TW/providers/openrouter)
- [Perplexity（網頁搜尋）](/zh-TW/providers/perplexity-provider)
- [Qianfan](/zh-TW/providers/qianfan)
- [Qwen Cloud](/zh-TW/providers/qwen)
- [Qwen OAuth / 入口網站](/zh-TW/providers/qwen-oauth)
- [Runway](/zh-TW/providers/runway)
- [SenseAudio](/zh-TW/providers/senseaudio)
- [SGLang（本機模型）](/zh-TW/providers/sglang)
- [StepFun](/zh-TW/providers/stepfun)
- [Synthetic](/zh-TW/providers/synthetic)
- [Tencent Cloud（TokenHub）](/zh-TW/providers/tencent)
- [Together AI](/zh-TW/providers/together)
- [Venice（Venice AI，注重隱私）](/zh-TW/providers/venice)
- [Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
- [vLLM（本機模型）](/zh-TW/providers/vllm)
- [Volcengine（Doubao）](/zh-TW/providers/volcengine)
- [Vydra](/zh-TW/providers/vydra)
- [xAI](/zh-TW/providers/xai)
- [Xiaomi](/zh-TW/providers/xiaomi)
- [Z.AI（GLM）](/zh-TW/providers/zai)

## 共用概覽頁面

- [其他隨附變體](/zh-TW/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy 和 Gemini CLI OAuth
- [圖片生成](/zh-TW/tools/image-generation) - 共用的 `image_generate` 工具、供應商選擇與容錯移轉
- [音樂生成](/zh-TW/tools/music-generation) - 共用的 `music_generate` 工具、供應商選擇與容錯移轉
- [影片生成](/zh-TW/tools/video-generation) - 共用的 `video_generate` 工具、供應商選擇與容錯移轉

## 轉錄供應商

- [Deepgram（音訊轉錄）](/zh-TW/providers/deepgram)
- [ElevenLabs](/zh-TW/providers/elevenlabs#speech-to-text)
- [Mistral](/zh-TW/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/zh-TW/providers/openai#speech-to-text)
- [SenseAudio](/zh-TW/providers/senseaudio)
- [xAI](/zh-TW/providers/xai#speech-to-text)

## 社群工具

- [Claude Max API Proxy](/zh-TW/providers/claude-max-api-proxy) - 用於 Claude 訂閱憑證的社群代理（使用前請確認 Anthropic 政策/條款）

如需完整供應商目錄（xAI、Groq、Mistral 等）與進階設定，
請參閱[模型供應商](/zh-TW/concepts/model-providers)。
