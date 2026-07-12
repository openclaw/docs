---
read_when:
    - Você quer escolher um provedor de modelos
    - Você precisa de uma visão geral rápida dos backends de LLM compatíveis
summary: Provedores de modelos (LLMs) compatíveis com o OpenClaw
title: Diretório de provedores
x-i18n:
    generated_at: "2026-07-12T00:17:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

O OpenClaw pode usar muitos provedores de LLM. Escolha um provedor, autentique-se e defina o
modelo padrão como `provider/model`.

Procurando a documentação dos canais de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.)? Consulte [Canais](/pt-BR/channels).

## Início rápido

1. Autentique-se no provedor (geralmente por meio de `openclaw onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentação dos provedores

- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Amazon Bedrock](/pt-BR/providers/bedrock)
- [Amazon Bedrock Mantle](/pt-BR/providers/bedrock-mantle)
- [Anthropic (API + CLI do Claude)](/pt-BR/providers/anthropic)
- [Arcee AI (modelos Trinity)](/pt-BR/providers/arcee)
- [Azure Speech](/pt-BR/providers/azure-speech)
- [BytePlus (internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Cerebras](/pt-BR/providers/cerebras)
- [Chutes](/pt-BR/providers/chutes)
- [ClawRouter (roteamento gerenciado entre vários provedores)](/pt-BR/providers/clawrouter)
- [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
- [Cohere](/pt-BR/providers/cohere)
- [ComfyUI](/pt-BR/providers/comfy)
- [DeepSeek](/pt-BR/providers/deepseek)
- [ds4 (DeepSeek V4 local)](/pt-BR/providers/ds4)
- [ElevenLabs](/pt-BR/providers/elevenlabs)
- [fal](/pt-BR/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/pt-BR/providers/fireworks)
- [GitHub Copilot](/pt-BR/providers/github-copilot)
- [GMI Cloud](/pt-BR/providers/gmi)
- [Google (Gemini)](/pt-BR/providers/google)
- [Gradium](/pt-BR/providers/gradium)
- [Groq (inferência com LPU)](/pt-BR/providers/groq)
- [Hugging Face (inferência)](/pt-BR/providers/huggingface)
- [inferrs (modelos locais)](/pt-BR/providers/inferrs)
- [Kilocode](/pt-BR/providers/kilocode)
- [LiteLLM (Gateway unificado)](/pt-BR/providers/litellm)
- [LM Studio (modelos locais)](/pt-BR/providers/lmstudio)
- [LongCat](/pt-BR/providers/longcat)
- [MiniMax](/pt-BR/providers/minimax)
- [Mistral](/pt-BR/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
- [NovitaAI](/pt-BR/providers/novita)
- [NVIDIA](/pt-BR/providers/nvidia)
- [Ollama (modelos na nuvem + locais)](/pt-BR/providers/ollama)
- [Ollama Cloud](/pt-BR/providers/ollama-cloud)
- [OpenAI (API + Codex)](/pt-BR/providers/openai)
- [OpenCode](/pt-BR/providers/opencode)
- [OpenCode Go](/pt-BR/providers/opencode-go)
- [OpenRouter](/pt-BR/providers/openrouter)
- [Perplexity (pesquisa na web)](/pt-BR/providers/perplexity-provider)
- [Qianfan](/pt-BR/providers/qianfan)
- [Qwen Cloud](/pt-BR/providers/qwen)
- [Qwen OAuth / Portal](/pt-BR/providers/qwen-oauth)
- [Runway](/pt-BR/providers/runway)
- [SenseAudio](/pt-BR/providers/senseaudio)
- [SGLang (modelos locais)](/pt-BR/providers/sglang)
- [StepFun](/pt-BR/providers/stepfun)
- [Synthetic](/pt-BR/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/pt-BR/providers/tencent)
- [Together AI](/pt-BR/providers/together)
- [Venice (Venice AI, com foco em privacidade)](/pt-BR/providers/venice)
- [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
- [vLLM (modelos locais)](/pt-BR/providers/vllm)
- [Volcengine (Doubao)](/pt-BR/providers/volcengine)
- [Vydra](/pt-BR/providers/vydra)
- [xAI](/pt-BR/providers/xai)
- [Xiaomi](/pt-BR/providers/xiaomi)
- [Z.AI (GLM)](/pt-BR/providers/zai)

## Páginas de visão geral compartilhadas

- [Variantes adicionais de provedores](/pt-BR/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy e OAuth da CLI do Gemini
- [Geração de imagens](/pt-BR/tools/image-generation) - Ferramenta compartilhada `image_generate`, seleção de provedor e failover
- [Geração de música](/pt-BR/tools/music-generation) - Ferramenta compartilhada `music_generate`, seleção de provedor e failover
- [Geração de vídeo](/pt-BR/tools/video-generation) - Ferramenta compartilhada `video_generate`, seleção de provedor e failover

## Provedores de transcrição

- [Deepgram (transcrição de áudio)](/pt-BR/providers/deepgram)
- [ElevenLabs](/pt-BR/providers/elevenlabs#speech-to-text)
- [Mistral](/pt-BR/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/pt-BR/providers/openai)
- [SenseAudio](/pt-BR/providers/senseaudio)
- [xAI](/pt-BR/providers/xai)

## Ferramentas da comunidade

- [Claude Max API Proxy](/pt-BR/providers/claude-max-api-proxy) - Proxy da comunidade para credenciais de assinatura do Claude (verifique as políticas e os termos da Anthropic antes de usar)

Para consultar o catálogo completo de provedores (xAI, Groq, Mistral etc.) e as configurações avançadas,
consulte [Provedores de modelos](/pt-BR/concepts/model-providers).
