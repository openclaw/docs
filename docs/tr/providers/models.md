---
read_when:
    - Bir model sağlayıcısı seçmek istiyorsunuz
    - LLM kimlik doğrulaması + model seçimi için hızlı kurulum örnekleri istiyorsunuz
summary: OpenClaw tarafından desteklenen model sağlayıcıları (LLM'ler)
title: Model sağlayıcısı hızlı başlangıcı
x-i18n:
    generated_at: "2026-04-30T09:41:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 16
---

# Model Sağlayıcıları

OpenClaw birçok LLM sağlayıcısını kullanabilir. Birini seçin, kimlik doğrulaması yapın, ardından varsayılan
modeli `provider/model` olarak ayarlayın.

## Hızlı başlangıç (iki adım)

1. Sağlayıcıyla kimlik doğrulaması yapın (genellikle `openclaw onboard` aracılığıyla).
2. Varsayılan modeli ayarlayın:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Desteklenen sağlayıcılar (başlangıç kümesi)

- [Alibaba Model Studio](/tr/providers/alibaba)
- [Amazon Bedrock](/tr/providers/bedrock)
- [Anthropic (API + Claude CLI)](/tr/providers/anthropic)
- [BytePlus (Uluslararası)](/tr/concepts/model-providers#byteplus-international)
- [Chutes](/tr/providers/chutes)
- [ComfyUI](/tr/providers/comfy)
- [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
- [DeepInfra](/tr/providers/deepinfra)
- [fal](/tr/providers/fal)
- [Fireworks](/tr/providers/fireworks)
- [GLM modelleri](/tr/providers/glm)
- [MiniMax](/tr/providers/minimax)
- [Mistral](/tr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
- [OpenAI (API + Codex)](/tr/providers/openai)
- [OpenCode (Zen + Go)](/tr/providers/opencode)
- [OpenRouter](/tr/providers/openrouter)
- [Qianfan](/tr/providers/qianfan)
- [Qwen](/tr/providers/qwen)
- [Runway](/tr/providers/runway)
- [StepFun](/tr/providers/stepfun)
- [Synthetic](/tr/providers/synthetic)
- [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/tr/providers/venice)
- [xAI](/tr/providers/xai)
- [Z.AI](/tr/providers/zai)

## Birlikte gelen ek sağlayıcı varyantları

- `anthropic-vertex` - Vertex kimlik bilgileri mevcut olduğunda Google Vertex üzerinde örtük Anthropic desteği; ayrı bir başlangıç kimlik doğrulama seçeneği yoktur
- `copilot-proxy` - yerel VS Code Copilot Proxy köprüsü; `openclaw onboard --auth-choice copilot-proxy` kullanın
- `google-gemini-cli` - resmi olmayan Gemini CLI OAuth akışı; yerel bir `gemini` kurulumu gerektirir (`brew install gemini-cli` veya `npm install -g @google/gemini-cli`); varsayılan model `google-gemini-cli/gemini-3-flash-preview`; `openclaw onboard --auth-choice google-gemini-cli` veya `openclaw models auth login --provider google-gemini-cli --set-default` kullanın

Tam sağlayıcı kataloğu (xAI, Groq, Mistral vb.) ve gelişmiş yapılandırma için
[Model sağlayıcıları](/tr/concepts/model-providers) sayfasına bakın.

## İlgili

- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretme](/tr/concepts/model-failover)
- [Modeller CLI](/tr/cli/models)
