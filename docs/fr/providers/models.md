---
read_when:
    - Vous souhaitez choisir un fournisseur de modèles
    - Vous voulez des exemples de configuration rapide pour l’authentification LLM + la sélection du modèle
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Démarrage rapide du fournisseur de modèles
x-i18n:
    generated_at: "2026-04-30T07:44:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 16
---

# Fournisseurs de modèles

OpenClaw peut utiliser de nombreux fournisseurs de LLM. Choisissez-en un, authentifiez-vous, puis définissez le modèle par défaut au format `provider/model`.

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
- [BytePlus (International)](/fr/concepts/model-providers#byteplus-international)
- [Chutes](/fr/providers/chutes)
- [ComfyUI](/fr/providers/comfy)
- [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
- [DeepInfra](/fr/providers/deepinfra)
- [fal](/fr/providers/fal)
- [Fireworks](/fr/providers/fireworks)
- [modèles GLM](/fr/providers/glm)
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
- [Z.AI](/fr/providers/zai)

## Variantes de fournisseurs intégrées supplémentaires

- `anthropic-vertex` - prise en charge implicite d’Anthropic sur Google Vertex lorsque des identifiants Vertex sont disponibles ; aucun choix d’authentification d’onboarding distinct
- `copilot-proxy` - pont local VS Code Copilot Proxy ; utilisez `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flux OAuth non officiel de Gemini CLI ; nécessite une installation locale de `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`) ; modèle par défaut `google-gemini-cli/gemini-3-flash-preview` ; utilisez `openclaw onboard --auth-choice google-gemini-cli` ou `openclaw models auth login --provider google-gemini-cli --set-default`

Pour le catalogue complet des fournisseurs (xAI, Groq, Mistral, etc.) et la configuration avancée, consultez [Fournisseurs de modèles](/fr/concepts/model-providers).

## Associés

- [Sélection du modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
- [CLI des modèles](/fr/cli/models)
