---
read_when:
    - 你想要選擇模型提供者
    - 你需要支援的 LLM 後端快速概覽
summary: OpenClaw 支援的模型提供者（LLM）
title: 提供者目錄
x-i18n:
    generated_at: "2026-07-06T10:51:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2075285660dafedc0218da57d731099068eb8c16b043e8074bcda3e30f4bf7a4
    source_path: providers/index.md
    workflow: 16
---

OpenClaw 可使用許多 LLM 供應商。選擇供應商、完成驗證，然後將
預設模型設定為 `provider/model`。

在找聊天頻道文件（WhatsApp/Telegram/Discord/Slack/Mattermost（外掛）/等等）？請參閱[頻道](/zh-TW/channels)。

## 快速開始

1. 向供應商驗證（通常透過 `openclaw onboard`）。
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
- [Anthropic（API + Claude 命令列介面）](/zh-TW/providers/anthropic)
- [Arcee AI（Trinity 模型）](/zh-TW/providers/arcee)
- [Azure Speech](/zh-TW/providers/azure-speech)
- [BytePlus（國際版）](/zh-TW/concepts/model-providers#byteplus-international)
- [Cerebras](/zh-TW/providers/cerebras)
- [Chutes](/zh-TW/providers/chutes)
- [ClawRouter（託管式多供應商路由）](/zh-TW/providers/clawrouter)
- [Cloudflare AI Gateway](/zh-TW/providers/cloudflare-ai-gateway)
- [Cohere](/zh-TW/providers/cohere)
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
- [NovitaAI](/zh-TW/providers/novita)
- [NVIDIA](/zh-TW/providers/nvidia)
- [Ollama（雲端 + 本機模型）](/zh-TW/providers/ollama)
- [Ollama Cloud](/zh-TW/providers/ollama-cloud)
- [OpenAI（API + Codex）](/zh-TW/providers/openai)
- [OpenCode](/zh-TW/providers/opencode)
- [OpenCode Go](/zh-TW/providers/opencode-go)
- [OpenRouter](/zh-TW/providers/openrouter)
- [Perplexity（網路搜尋）](/zh-TW/providers/perplexity-provider)
- [Qianfan](/zh-TW/providers/qianfan)
- [Qwen Cloud](/zh-TW/providers/qwen)
- [Qwen OAuth / Portal](/zh-TW/providers/qwen-oauth)
- [Runway](/zh-TW/providers/runway)
- [SenseAudio](/zh-TW/providers/senseaudio)
- [SGLang（本機模型）](/zh-TW/providers/sglang)
- [StepFun](/zh-TW/providers/stepfun)
- [Synthetic](/zh-TW/providers/synthetic)
- [Tencent Cloud（TokenHub / TokenPlan）](/zh-TW/providers/tencent)
- [Together AI](/zh-TW/providers/together)
- [Venice（Venice AI，重視隱私）](/zh-TW/providers/venice)
- [Vercel AI Gateway](/zh-TW/providers/vercel-ai-gateway)
- [vLLM（本機模型）](/zh-TW/providers/vllm)
- [Volcengine（Doubao）](/zh-TW/providers/volcengine)
- [Vydra](/zh-TW/providers/vydra)
- [xAI](/zh-TW/providers/xai)
- [Xiaomi](/zh-TW/providers/xiaomi)
- [Z.AI（GLM）](/zh-TW/providers/zai)

## 共用概覽頁面

- [其他供應商變體](/zh-TW/providers/models#additional-provider-variants) - Anthropic Vertex、Copilot Proxy 與 Gemini 命令列介面 OAuth
- [影像生成](/zh-TW/tools/image-generation) - 共用 `image_generate` 工具、供應商選擇與容錯移轉
- [音樂生成](/zh-TW/tools/music-generation) - 共用 `music_generate` 工具、供應商選擇與容錯移轉
- [影片生成](/zh-TW/tools/video-generation) - 共用 `video_generate` 工具、供應商選擇與容錯移轉

## 轉錄供應商

- [Deepgram（音訊轉錄）](/zh-TW/providers/deepgram)
- [ElevenLabs](/zh-TW/providers/elevenlabs#speech-to-text)
- [Mistral](/zh-TW/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/zh-TW/providers/openai)
- [SenseAudio](/zh-TW/providers/senseaudio)
- [xAI](/zh-TW/providers/xai)

## 社群工具

- [Claude Max API Proxy](/zh-TW/providers/claude-max-api-proxy) - Claude 訂閱憑證的社群代理（使用前請確認 Anthropic 政策/條款）

如需完整供應商目錄（xAI、Groq、Mistral 等）與進階設定，
請參閱[模型供應商](/zh-TW/concepts/model-providers)。
