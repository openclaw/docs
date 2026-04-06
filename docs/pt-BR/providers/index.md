---
read_when:
    - Você quer escolher um provedor de modelo
    - Você precisa de uma visão geral rápida dos backends de LLM compatíveis
summary: Provedores de modelo (LLMs) compatíveis com o OpenClaw
title: Diretório de provedores
x-i18n:
    generated_at: "2026-04-06T03:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7271157a6ab5418672baff62bfd299572fd010f75aad529267095c6e55903882
    source_path: providers/index.md
    workflow: 15
---

# Provedores de modelo

O OpenClaw pode usar muitos provedores de LLM. Escolha um provedor, autentique-se e depois defina o
modelo padrão como `provider/model`.

Está procurando a documentação de canais de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.)? Consulte [Channels](/pt-BR/channels).

## Início rápido

1. Autentique-se com o provedor (geralmente via `openclaw onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentação dos provedores

- [Alibaba Model Studio](/providers/alibaba)
- [Amazon Bedrock](/pt-BR/providers/bedrock)
- [Anthropic (API + Claude CLI)](/pt-BR/providers/anthropic)
- [BytePlus (Internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Chutes](/pt-BR/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
- [DeepSeek](/pt-BR/providers/deepseek)
- [fal](/providers/fal)
- [Fireworks](/pt-BR/providers/fireworks)
- [GitHub Copilot](/pt-BR/providers/github-copilot)
- [Modelos GLM](/pt-BR/providers/glm)
- [Google (Gemini)](/pt-BR/providers/google)
- [Groq (inferência LPU)](/pt-BR/providers/groq)
- [Hugging Face (Inference)](/pt-BR/providers/huggingface)
- [Kilocode](/pt-BR/providers/kilocode)
- [LiteLLM (gateway unificado)](/pt-BR/providers/litellm)
- [MiniMax](/pt-BR/providers/minimax)
- [Mistral](/pt-BR/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
- [NVIDIA](/pt-BR/providers/nvidia)
- [Ollama (modelos em cloud + locais)](/pt-BR/providers/ollama)
- [OpenAI (API + Codex)](/pt-BR/providers/openai)
- [OpenCode](/pt-BR/providers/opencode)
- [OpenCode Go](/pt-BR/providers/opencode-go)
- [OpenRouter](/pt-BR/providers/openrouter)
- [Perplexity (busca na web)](/pt-BR/providers/perplexity-provider)
- [Qianfan](/pt-BR/providers/qianfan)
- [Qwen Cloud](/pt-BR/providers/qwen)
- [Runway](/providers/runway)
- [SGLang (modelos locais)](/pt-BR/providers/sglang)
- [StepFun](/pt-BR/providers/stepfun)
- [Synthetic](/pt-BR/providers/synthetic)
- [Together AI](/pt-BR/providers/together)
- [Venice (Venice AI, focado em privacidade)](/pt-BR/providers/venice)
- [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
- [Vydra](/providers/vydra)
- [vLLM (modelos locais)](/pt-BR/providers/vllm)
- [Volcengine (Doubao)](/pt-BR/providers/volcengine)
- [xAI](/pt-BR/providers/xai)
- [Xiaomi](/pt-BR/providers/xiaomi)
- [Z.AI](/pt-BR/providers/zai)

## Páginas gerais compartilhadas

- [Variantes empacotadas adicionais](/pt-BR/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy e Gemini CLI OAuth
- [Geração de imagem](/pt-BR/tools/image-generation) - Ferramenta compartilhada `image_generate`, seleção de provedor e failover
- [Geração de música](/tools/music-generation) - Ferramenta compartilhada `music_generate`, seleção de provedor e failover
- [Geração de vídeo](/tools/video-generation) - Ferramenta compartilhada `video_generate`, seleção de provedor e failover

## Provedores de transcrição

- [Deepgram (transcrição de áudio)](/pt-BR/providers/deepgram)

## Ferramentas da comunidade

- [Claude Max API Proxy](/pt-BR/providers/claude-max-api-proxy) - Proxy da comunidade para credenciais de assinatura Claude (verifique a política/termos da Anthropic antes de usar)

Para o catálogo completo de provedores (xAI, Groq, Mistral etc.) e configuração avançada,
consulte [Model providers](/pt-BR/concepts/model-providers).
