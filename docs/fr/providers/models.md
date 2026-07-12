---
read_when:
    - Vous souhaitez choisir un fournisseur de modèles
    - Vous souhaitez des exemples de configuration rapide pour l’authentification au LLM et la sélection du modèle
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Démarrage rapide avec un fournisseur de modèles
x-i18n:
    generated_at: "2026-07-12T03:00:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Choisissez un fournisseur, authentifiez-vous, puis définissez le modèle par défaut sous la forme `provider/model`.

## Démarrage rapide (deux étapes)

1. Authentifiez-vous auprès du fournisseur (généralement avec `openclaw onboard`).
2. Définissez le modèle par défaut :

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Fournisseurs pris en charge (sélection de départ)

- [Alibaba Model Studio](/fr/providers/alibaba)
- [Amazon Bedrock](/fr/providers/bedrock)
- [Anthropic (API + CLI Claude)](/fr/providers/anthropic)
- [BytePlus (international)](/fr/concepts/model-providers#byteplus-international)
- [Chutes](/fr/providers/chutes)
- [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
- [Cohere](/fr/providers/cohere)
- [ComfyUI](/fr/providers/comfy)
- [DeepInfra](/fr/providers/deepinfra)
- [fal](/fr/providers/fal)
- [Fireworks](/fr/providers/fireworks)
- [MiniMax](/fr/providers/minimax)
- [Mistral](/fr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
- [NovitaAI](/fr/providers/novita)
- [OpenAI (API + Codex)](/fr/providers/openai)
- [OpenCode (Zen + Go)](/fr/providers/opencode)
- [OpenRouter](/fr/providers/openrouter)
- [Qianfan](/fr/providers/qianfan)
- [Qwen](/fr/providers/qwen)
- [Runway](/fr/providers/runway)
- [StepFun](/fr/providers/stepfun)
- [Synthetic](/fr/providers/synthetic)
- [Venice (Venice AI)](/fr/providers/venice)
- [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
- [xAI](/fr/providers/xai)
- [Z.AI (GLM)](/fr/providers/zai)

Pour consulter le catalogue complet des fournisseurs et la configuration avancée, voir
[Répertoire des fournisseurs](/fr/providers/index) et [Fournisseurs de modèles](/fr/concepts/model-providers).

## Variantes de fournisseurs supplémentaires

- `anthropic-vertex` - installez `@openclaw/anthropic-vertex-provider` pour prendre implicitement en charge Anthropic sur Google Vertex lorsque les identifiants Vertex sont disponibles ; aucun choix d’authentification distinct lors de l’intégration
- `copilot-proxy` - passerelle locale vers VS Code Copilot Proxy ; utilisez `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flux OAuth non officiel de la CLI Gemini ; nécessite une installation locale de `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`) ; modèle par défaut `google-gemini-cli/gemini-3-flash-preview` ; utilisez `openclaw onboard --auth-choice google-gemini-cli` ou `openclaw models auth login --provider google-gemini-cli --set-default`

## Voir aussi

- [Répertoire des fournisseurs](/fr/providers/index)
- [Sélection du modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
- [CLI des modèles](/fr/cli/models)
