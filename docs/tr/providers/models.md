---
read_when:
    - Bir model sağlayıcısı seçmek istiyorsunuz
    - LLM kimlik doğrulaması ve model seçimi için hızlı kurulum örnekleri istiyorsunuz
summary: OpenClaw tarafından desteklenen model sağlayıcıları (LLM'ler)
title: Model sağlayıcısı hızlı başlangıç kılavuzu
x-i18n:
    generated_at: "2026-07-12T12:09:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Bir sağlayıcı seçin, kimlik doğrulaması yapın ve ardından varsayılan modeli `provider/model` biçiminde ayarlayın.

## Hızlı başlangıç (iki adım)

1. Sağlayıcıda kimlik doğrulaması yapın (genellikle `openclaw onboard` aracılığıyla).
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
- [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
- [Cohere](/tr/providers/cohere)
- [ComfyUI](/tr/providers/comfy)
- [DeepInfra](/tr/providers/deepinfra)
- [fal](/tr/providers/fal)
- [Fireworks](/tr/providers/fireworks)
- [MiniMax](/tr/providers/minimax)
- [Mistral](/tr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
- [NovitaAI](/tr/providers/novita)
- [OpenAI (API + Codex)](/tr/providers/openai)
- [OpenCode (Zen + Go)](/tr/providers/opencode)
- [OpenRouter](/tr/providers/openrouter)
- [Qianfan](/tr/providers/qianfan)
- [Qwen](/tr/providers/qwen)
- [Runway](/tr/providers/runway)
- [StepFun](/tr/providers/stepfun)
- [Synthetic](/tr/providers/synthetic)
- [Venice (Venice AI)](/tr/providers/venice)
- [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
- [xAI](/tr/providers/xai)
- [Z.AI (GLM)](/tr/providers/zai)

Sağlayıcıların tam kataloğu ve gelişmiş yapılandırma için
[Sağlayıcı dizini](/tr/providers/index) ve [Model sağlayıcıları](/tr/concepts/model-providers) sayfalarına bakın.

## Ek sağlayıcı çeşitleri

- `anthropic-vertex` - Vertex kimlik bilgileri mevcut olduğunda Google Vertex üzerinde örtük Anthropic desteği için `@openclaw/anthropic-vertex-provider` paketini yükleyin; ayrı bir ilk kurulum kimlik doğrulama seçeneği yoktur
- `copilot-proxy` - yerel VS Code Copilot Proxy köprüsü; `openclaw onboard --auth-choice copilot-proxy` komutunu kullanın
- `google-gemini-cli` - resmî olmayan Gemini CLI OAuth akışı; yerel bir `gemini` kurulumu gerektirir (`brew install gemini-cli` veya `npm install -g @google/gemini-cli`); varsayılan model `google-gemini-cli/gemini-3-flash-preview`; `openclaw onboard --auth-choice google-gemini-cli` veya `openclaw models auth login --provider google-gemini-cli --set-default` komutunu kullanın

## İlgili konular

- [Sağlayıcı dizini](/tr/providers/index)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretmesi](/tr/concepts/model-failover)
- [Modeller CLI'si](/tr/cli/models)
