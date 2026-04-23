---
read_when:
    - Você quer escolher um provider de modelo
    - Você precisa de uma visão geral rápida dos backends de LLM compatíveis
summary: Providers de modelo (LLMs) compatíveis com o OpenClaw
title: Diretório de providers
x-i18n:
    generated_at: "2026-04-23T14:05:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b038f095480fc2cd4f7eb75500d9d8eb7b03fa90614e122744939e0ddc6996d
    source_path: providers/index.md
    workflow: 15
---

# Providers de modelo

O OpenClaw pode usar muitos providers de LLM. Escolha um provider, autentique-se e depois defina o
modelo padrão como `provider/model`.

Está procurando documentação de canais de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.)? Veja [Canais](/pt-BR/channels).

## Início rápido

1. Autentique-se com o provider (geralmente via `openclaw onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentação dos providers

- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Amazon Bedrock](/pt-BR/providers/bedrock)
- [Amazon Bedrock Mantle](/pt-BR/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/pt-BR/providers/anthropic)
- [Arcee AI (modelos Trinity)](/pt-BR/providers/arcee)
- [BytePlus (internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Chutes](/pt-BR/providers/chutes)
- [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
- [ComfyUI](/pt-BR/providers/comfy)
- [DeepSeek](/pt-BR/providers/deepseek)
- [ElevenLabs](/pt-BR/providers/elevenlabs)
- [fal](/pt-BR/providers/fal)
- [Fireworks](/pt-BR/providers/fireworks)
- [GitHub Copilot](/pt-BR/providers/github-copilot)
- [Modelos GLM](/pt-BR/providers/glm)
- [Google (Gemini)](/pt-BR/providers/google)
- [Groq (inferência LPU)](/pt-BR/providers/groq)
- [Hugging Face (Inference)](/pt-BR/providers/huggingface)
- [inferrs (modelos locais)](/pt-BR/providers/inferrs)
- [Kilocode](/pt-BR/providers/kilocode)
- [LiteLLM (gateway unificado)](/pt-BR/providers/litellm)
- [LM Studio (modelos locais)](/pt-BR/providers/lmstudio)
- [MiniMax](/pt-BR/providers/minimax)
- [Mistral](/pt-BR/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
- [NVIDIA](/pt-BR/providers/nvidia)
- [Ollama (modelos em nuvem + locais)](/pt-BR/providers/ollama)
- [OpenAI (API + Codex)](/pt-BR/providers/openai)
- [OpenCode](/pt-BR/providers/opencode)
- [OpenCode Go](/pt-BR/providers/opencode-go)
- [OpenRouter](/pt-BR/providers/openrouter)
- [Perplexity (pesquisa na web)](/pt-BR/providers/perplexity-provider)
- [Qianfan](/pt-BR/providers/qianfan)
- [Qwen Cloud](/pt-BR/providers/qwen)
- [Runway](/pt-BR/providers/runway)
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

## Páginas de visão geral compartilhada

- [Variantes integradas adicionais](/pt-BR/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy e Gemini CLI OAuth
- [Geração de imagem](/pt-BR/tools/image-generation) - ferramenta compartilhada `image_generate`, seleção de provider e failover
- [Geração de música](/pt-BR/tools/music-generation) - ferramenta compartilhada `music_generate`, seleção de provider e failover
- [Geração de vídeo](/pt-BR/tools/video-generation) - ferramenta compartilhada `video_generate`, seleção de provider e failover

## Providers de transcrição

- [Deepgram (transcrição de áudio)](/pt-BR/providers/deepgram)
- [ElevenLabs](/pt-BR/providers/elevenlabs#speech-to-text)
- [Mistral](/pt-BR/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/pt-BR/providers/openai#speech-to-text)
- [xAI](/pt-BR/providers/xai#speech-to-text)

## Ferramentas da comunidade

- [Claude Max API Proxy](/pt-BR/providers/claude-max-api-proxy) - proxy da comunidade para credenciais de assinatura Claude (verifique a política/os termos da Anthropic antes de usar)

Para o catálogo completo de providers (xAI, Groq, Mistral etc.) e configuração avançada,
veja [Providers de modelo](/pt-BR/concepts/model-providers).
