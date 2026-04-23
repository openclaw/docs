---
read_when:
    - Vous souhaitez exécuter OpenClaw avec des modèles open source via LM Studio
    - Vous souhaitez configurer et paramétrer LM Studio
summary: Exécuter OpenClaw avec LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T07:09:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 733527e95041da04562c0ee5d9486750d8355a255624a6d5735954de34429a5c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio est une application conviviale mais puissante pour exécuter des modèles open-weight sur votre propre matériel. Elle permet d’exécuter des modèles llama.cpp (GGUF) ou MLX (Apple Silicon). Elle existe en package GUI ou en daemon sans interface (`llmster`). Pour la documentation produit et de configuration, voir [lmstudio.ai](https://lmstudio.ai/).

## Démarrage rapide

1. Installez LM Studio (desktop) ou `llmster` (sans interface), puis démarrez le serveur local :

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Démarrez le serveur

Assurez-vous de démarrer soit l’application desktop, soit le daemon avec la commande suivante :

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Si vous utilisez l’application, assurez-vous d’avoir activé le JIT pour une expérience fluide. En savoir plus dans le [guide LM Studio JIT and TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw requiert une valeur de jeton LM Studio. Définissez `LM_API_TOKEN` :

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Si l’authentification LM Studio est désactivée, utilisez n’importe quelle valeur de jeton non vide :

```bash
export LM_API_TOKEN="placeholder-key"
```

Pour les détails de configuration de l’authentification LM Studio, voir [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Exécutez l’onboarding et choisissez `LM Studio` :

```bash
openclaw onboard
```

5. Dans l’onboarding, utilisez l’invite `Default model` pour choisir votre modèle LM Studio.

Vous pouvez aussi le définir ou le modifier plus tard :

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Les clés de modèle LM Studio suivent un format `author/model-name` (par ex. `qwen/qwen3.5-9b`). Les références de modèle OpenClaw
préfixent le nom du fournisseur : `lmstudio/qwen/qwen3.5-9b`. Vous pouvez trouver la clé exacte d’un
modèle en exécutant `curl http://localhost:1234/api/v1/models` et en regardant le champ `key`.

## Onboarding non interactif

Utilisez l’onboarding non interactif lorsque vous souhaitez automatiser la configuration (CI, provisioning, amorçage à distance) :

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Ou spécifiez l’URL de base ou le modèle avec une clé API :

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` prend la clé de modèle telle que renvoyée par LM Studio (par ex. `qwen/qwen3.5-9b`), sans
le préfixe de fournisseur `lmstudio/`.

L’onboarding non interactif requiert `--lmstudio-api-key` (ou `LM_API_TOKEN` dans l’environnement).
Pour les serveurs LM Studio non authentifiés, n’importe quelle valeur de jeton non vide fonctionne.

`--custom-api-key` reste pris en charge pour compatibilité, mais `--lmstudio-api-key` est préféré pour LM Studio.

Cela écrit `models.providers.lmstudio`, définit le modèle par défaut sur
`lmstudio/<custom-model-id>`, et écrit le profil d’authentification `lmstudio:default`.

La configuration interactive peut demander une longueur de contexte de chargement préférée facultative et l’appliquer aux modèles LM Studio découverts qu’elle enregistre dans la configuration.

## Configuration

### Compatibilité d’usage en streaming

OpenClaw marque LM Studio comme compatible avec l’usage en streaming, de sorte que la comptabilité des jetons ne se dégrade plus vers des totaux inconnus ou obsolètes sur les complétions diffusées en streaming. OpenClaw récupère aussi les comptes de jetons à partir des métadonnées de style llama.cpp `timings.prompt_n` / `timings.predicted_n` lorsque LM Studio n’émet pas d’objet `usage` au format OpenAI.

Autres backends locaux compatibles OpenAI couverts par le même comportement :

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Configuration explicite

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Dépannage

### LM Studio non détecté

Assurez-vous que LM Studio est en cours d’exécution et que vous avez défini `LM_API_TOKEN` (pour les serveurs non authentifiés, n’importe quelle valeur de jeton non vide fonctionne) :

```bash
# Démarrer via l’application desktop, ou en mode sans interface :
lms server start --port 1234
```

Vérifiez que l’API est accessible :

```bash
curl http://localhost:1234/api/v1/models
```

### Erreurs d’authentification (HTTP 401)

Si la configuration signale HTTP 401, vérifiez votre clé API :

- Vérifiez que `LM_API_TOKEN` correspond à la clé configurée dans LM Studio.
- Pour les détails de configuration de l’authentification LM Studio, voir [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Si votre serveur n’exige pas d’authentification, utilisez n’importe quelle valeur de jeton non vide pour `LM_API_TOKEN`.

### Chargement de modèle juste-à-temps

LM Studio prend en charge le chargement de modèle juste-à-temps (JIT), où les modèles sont chargés à la première requête. Assurez-vous que cette option est activée pour éviter les erreurs « Model not loaded ».
