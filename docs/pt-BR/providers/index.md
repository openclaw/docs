---
read_when:
    - Você quer escolher um provedor de modelos
    - Você precisa de uma visão geral rápida dos backends de LLM com suporte
summary: Provedores de modelos (LLMs) compatíveis com o OpenClaw
title: Diretório de provedores
x-i18n:
    generated_at: "2026-05-06T09:10:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc3a15880a5e1881c1a58c60c9ad7e5624350a8db848d03c7cef6ee18c14b81
    source_path: providers/index.md
    workflow: 16
---

OpenClaw pode usar muitos provedores de LLM. Escolha um provedor, autentique-se e defina o
modelo padrão como `provider/model`.

Procurando documentação de canais de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/etc.)? Consulte [Canais](/pt-BR/channels).

## Início rápido

1. Autentique-se com o provedor (geralmente via `openclaw onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentação de provedores

- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Amazon Bedrock](/pt-BR/providers/bedrock)
- [Amazon Bedrock Mantle](/pt-BR/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/pt-BR/providers/anthropic)
- [Arcee AI (modelos Trinity)](/pt-BR/providers/arcee)
- [Azure Speech](/pt-BR/providers/azure-speech)
- [BytePlus (Internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Cerebras](/pt-BR/providers/cerebras)
- [Chutes](/pt-BR/providers/chutes)
- [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
- [ComfyUI](/pt-BR/providers/comfy)
- [DeepSeek](/pt-BR/providers/deepseek)
- [ElevenLabs](/pt-BR/providers/elevenlabs)
- [fal](/pt-BR/providers/fal)
- [Fireworks](/pt-BR/providers/fireworks)
- [GitHub Copilot](/pt-BR/providers/github-copilot)
- [modelos GLM](/pt-BR/providers/glm)
- [Google (Gemini)](/pt-BR/providers/google)
- [Gradium](/pt-BR/providers/gradium)
- [Groq (inferência LPU)](/pt-BR/providers/groq)
- [Hugging Face (Inferência)](/pt-BR/providers/huggingface)
- [inferrs (modelos locais)](/pt-BR/providers/inferrs)
- [Kilocode](/pt-BR/providers/kilocode)
- [LiteLLM (gateway unificado)](/pt-BR/providers/litellm)
- [LM Studio (modelos locais)](/pt-BR/providers/lmstudio)
- [MiniMax](/pt-BR/providers/minimax)
- [Mistral](/pt-BR/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
- [NVIDIA](/pt-BR/providers/nvidia)
- [Ollama (nuvem + modelos locais)](/pt-BR/providers/ollama)
- [OpenAI (API + Codex)](/pt-BR/providers/openai)
- [OpenCode](/pt-BR/providers/opencode)
- [OpenCode Go](/pt-BR/providers/opencode-go)
- [OpenRouter](/pt-BR/providers/openrouter)
- [Perplexity (pesquisa na web)](/pt-BR/providers/perplexity-provider)
- [Qianfan](/pt-BR/providers/qianfan)
- [Qwen Cloud](/pt-BR/providers/qwen)
- [Runway](/pt-BR/providers/runway)
- [SenseAudio](/pt-BR/providers/senseaudio)
- [SGLang (modelos locais)](/pt-BR/providers/sglang)
- [StepFun](/pt-BR/providers/stepfun)
- [Synthetic](/pt-BR/providers/synthetic)
- [Tencent Cloud (TokenHub)](/pt-BR/providers/tencent)
- [Together AI](/pt-BR/providers/together)
- [Venice (Venice AI, com foco em privacidade)](/pt-BR/providers/venice)
- [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
- [vLLM (modelos locais)](/pt-BR/providers/vllm)
- [Volcengine (Doubao)](/pt-BR/providers/volcengine)
- [Vydra](/pt-BR/providers/vydra)
- [xAI](/pt-BR/providers/xai)
- [Xiaomi](/pt-BR/providers/xiaomi)
- [Z.AI](/pt-BR/providers/zai)

## Páginas de visão geral compartilhadas

- [Variantes adicionais incluídas](/pt-BR/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy e Gemini CLI OAuth
- [Geração de imagens](/pt-BR/tools/image-generation) - Ferramenta `image_generate` compartilhada, seleção de provedor e failover
- [Geração de música](/pt-BR/tools/music-generation) - Ferramenta `music_generate` compartilhada, seleção de provedor e failover
- [Geração de vídeo](/pt-BR/tools/video-generation) - Ferramenta `video_generate` compartilhada, seleção de provedor e failover

## Provedores de transcrição

- [Deepgram (transcrição de áudio)](/pt-BR/providers/deepgram)
- [ElevenLabs](/pt-BR/providers/elevenlabs#speech-to-text)
- [Mistral](/pt-BR/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/pt-BR/providers/openai#speech-to-text)
- [SenseAudio](/pt-BR/providers/senseaudio)
- [xAI](/pt-BR/providers/xai#speech-to-text)

## Ferramentas da comunidade

- [Claude Max API Proxy](/pt-BR/providers/claude-max-api-proxy) - Proxy da comunidade para credenciais de assinatura Claude (verifique a política/os termos da Anthropic antes de usar)

Para o catálogo completo de provedores (xAI, Groq, Mistral, etc.) e configuração avançada,
consulte [Provedores de modelos](/pt-BR/concepts/model-providers).
