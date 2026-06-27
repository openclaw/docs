---
read_when:
    - Vous voulez choisir un fournisseur de modèle
    - Vous voulez des exemples de configuration rapide pour l’authentification LLM et la sélection de modèle
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Démarrage rapide du fournisseur de modèles
x-i18n:
    generated_at: "2026-06-27T18:05:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw peut utiliser de nombreux fournisseurs de LLM. Choisissez-en un, authentifiez-vous, puis définissez le modèle par défaut sous la forme `provider/model`.

## Démarrage rapide (deux étapes)

1. Authentifiez-vous auprès du fournisseur (généralement via `openclaw onboard`).
2. Définissez le modèle par défaut :

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Fournisseurs pris en charge (ensemble de départ)

- [Alibaba Model Studio](/fr/providers/alibaba)
- [Amazon Bedrock](/fr/providers/bedrock)
- [Anthropic (API + Claude CLI)](/fr/providers/anthropic)
- [BytePlus (international)](/fr/concepts/model-providers#byteplus-international)
- [Chutes](/fr/providers/chutes)
- [Cohere](/fr/providers/cohere)
- [ComfyUI](/fr/providers/comfy)
- [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
- [DeepInfra](/fr/providers/deepinfra)
- [fal](/fr/providers/fal)
- [Fireworks](/fr/providers/fireworks)
- [MiniMax](/fr/providers/minimax)
- [Mistral](/fr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
- [OpenAI (API + Codex)](/fr/providers/openai)
- [OpenCode (Zen + Go)](/fr/providers/opencode)
- [OpenRouter](/fr/providers/openrouter)
- [Qianfan](/fr/providers/qianfan)
- [Qwen](/fr/providers/qwen)
- [Runway](/fr/providers/runway)
- [StepFun](/fr/providers/stepfun)
- [Synthetic](/fr/providers/synthetic)
- [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/fr/providers/venice)
- [xAI](/fr/providers/xai)
- [Z.AI (GLM)](/fr/providers/zai)

## Variantes de fournisseurs supplémentaires

- `anthropic-vertex` - installez `@openclaw/anthropic-vertex-provider` pour la prise en charge implicite d’Anthropic sur Google Vertex lorsque les identifiants Vertex sont disponibles ; aucun choix d’authentification d’intégration séparé
- `copilot-proxy` - pont local VS Code Copilot Proxy ; utilisez `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flux OAuth non officiel de Gemini CLI ; nécessite une installation locale de `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`) ; modèle par défaut `google-gemini-cli/gemini-3-flash-preview` ; utilisez `openclaw onboard --auth-choice google-gemini-cli` ou `openclaw models auth login --provider google-gemini-cli --set-default`

Pour le catalogue complet des fournisseurs (xAI, Groq, Mistral, etc.) et la configuration avancée,
consultez [Fournisseurs de modèles](/fr/concepts/model-providers).

## Connexe

- [Sélection du modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
- [CLI des modèles](/fr/cli/models)
