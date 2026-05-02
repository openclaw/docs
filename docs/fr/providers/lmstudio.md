---
read_when:
    - Vous souhaitez exécuter OpenClaw avec des modèles open source via LM Studio
    - Vous voulez installer et configurer LM Studio
summary: Exécuter OpenClaw avec LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T22:21:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 814117ecbdc52cf67e921d0f0d67c4219f8bdc15fb8cf34b983cda775cba9b9e
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio est une application conviviale mais puissante pour exécuter des modèles à poids ouverts sur votre propre matériel. Elle permet d’exécuter des modèles llama.cpp (GGUF) ou MLX (Apple Silicon). Elle est disponible sous forme d’application graphique ou de daemon sans interface (`llmster`). Pour la documentation produit et de configuration, consultez [lmstudio.ai](https://lmstudio.ai/).

## Démarrage rapide

1. Installez LM Studio (application de bureau) ou `llmster` (sans interface), puis démarrez le serveur local :

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Démarrez le serveur

Assurez-vous soit de démarrer l’application de bureau, soit d’exécuter le daemon avec la commande suivante :

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Si vous utilisez l’application, assurez-vous que JIT est activé pour une expérience fluide. Pour en savoir plus, consultez le [guide JIT et TTL de LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Si l’authentification LM Studio est activée, définissez `LM_API_TOKEN` :

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Si l’authentification LM Studio est désactivée, vous pouvez laisser la clé API vide pendant la configuration interactive d’OpenClaw.

Pour les détails de configuration de l’authentification LM Studio, consultez [Authentification LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Lancez l’onboarding et choisissez `LM Studio` :

```bash
openclaw onboard
```

5. Pendant l’onboarding, utilisez l’invite `Default model` pour choisir votre modèle LM Studio.

Vous pouvez aussi le définir ou le modifier plus tard :

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Les clés de modèle LM Studio suivent un format `author/model-name` (par exemple `qwen/qwen3.5-9b`). Les références de modèle OpenClaw ajoutent le nom du fournisseur en préfixe : `lmstudio/qwen/qwen3.5-9b`. Vous pouvez trouver la clé exacte d’un modèle en exécutant `curl http://localhost:1234/api/v1/models` et en consultant le champ `key`.

## Onboarding non interactif

Utilisez l’onboarding non interactif lorsque vous voulez automatiser la configuration (CI, provisioning, amorçage distant) :

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Ou spécifiez l’URL de base, le modèle et la clé API facultative :

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` prend la clé de modèle renvoyée par LM Studio (par exemple `qwen/qwen3.5-9b`), sans le préfixe de fournisseur `lmstudio/`.

Pour les serveurs LM Studio authentifiés, passez `--lmstudio-api-key` ou définissez `LM_API_TOKEN`.
Pour les serveurs LM Studio non authentifiés, omettez la clé ; OpenClaw stocke un marqueur local non secret.

`--custom-api-key` reste pris en charge pour compatibilité, mais `--lmstudio-api-key` est préférable pour LM Studio.

Cela écrit `models.providers.lmstudio` et définit le modèle par défaut sur `lmstudio/<custom-model-id>`. Lorsque vous fournissez une clé API, la configuration écrit aussi le profil d’authentification `lmstudio:default`.

La configuration interactive peut demander une longueur de contexte de chargement préférée facultative et l’applique aux modèles LM Studio découverts qu’elle enregistre dans la configuration.
La configuration du Plugin LM Studio fait confiance au point de terminaison LM Studio configuré pour les requêtes de modèles, y compris les hôtes loopback, LAN et tailnet. Vous pouvez désactiver ce comportement en définissant `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Configuration

### Compatibilité de l’utilisation en streaming

LM Studio est compatible avec l’utilisation en streaming. Lorsqu’il n’émet pas d’objet `usage` au format OpenAI, OpenClaw récupère les nombres de tokens depuis les métadonnées de style llama.cpp `timings.prompt_n` / `timings.predicted_n`.

Le même comportement d’utilisation en streaming s’applique à ces backends locaux compatibles OpenAI :

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Compatibilité de la réflexion

Lorsque la découverte `/api/v1/models` de LM Studio signale des options de raisonnement propres au modèle, OpenClaw expose les valeurs `reasoning_effort` compatibles OpenAI correspondantes dans les métadonnées de compatibilité du modèle. Les versions actuelles de LM Studio peuvent annoncer des options d’interface binaires comme `allowed_options: ["off", "on"]` tout en rejetant ces valeurs sur `/v1/chat/completions` ; OpenClaw normalise cette forme de découverte binaire en `none`, `minimal`, `low`, `medium`, `high` et `xhigh` avant d’envoyer les requêtes. Les anciennes configurations LM Studio enregistrées qui contiennent des cartes de raisonnement `off`/`on` sont normalisées de la même manière lorsque le catalogue est chargé.

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

Assurez-vous que LM Studio est en cours d’exécution. Si l’authentification est activée, définissez aussi `LM_API_TOKEN` :

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Vérifiez que l’API est accessible :

```bash
curl http://localhost:1234/api/v1/models
```

### Erreurs d’authentification (HTTP 401)

Si la configuration signale HTTP 401, vérifiez votre clé API :

- Vérifiez que `LM_API_TOKEN` correspond à la clé configurée dans LM Studio.
- Pour les détails de configuration de l’authentification LM Studio, consultez [Authentification LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si votre serveur ne requiert pas d’authentification, laissez la clé vide pendant la configuration.

### Chargement de modèle juste-à-temps

LM Studio prend en charge le chargement de modèle juste-à-temps (JIT), où les modèles sont chargés à la première requête. OpenClaw précharge les modèles via le point de terminaison de chargement natif de LM Studio par défaut, ce qui aide lorsque JIT est désactivé. Pour laisser le JIT de LM Studio, le TTL d’inactivité et le comportement d’éviction automatique gérer le cycle de vie des modèles, désactivez l’étape de préchargement d’OpenClaw :

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### Hôte LM Studio sur LAN ou tailnet

Utilisez l’adresse accessible de l’hôte LM Studio, conservez `/v1` et assurez-vous que LM Studio est lié au-delà de loopback sur cette machine :

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

Contrairement aux fournisseurs génériques compatibles OpenAI, `lmstudio` fait automatiquement confiance à son point de terminaison local/privé configuré pour les requêtes de modèles protégées. Les ID de fournisseurs loopback personnalisés tels que `localhost` ou `127.0.0.1` sont également approuvés automatiquement ; pour les ID de fournisseurs personnalisés LAN, tailnet ou DNS privé, définissez explicitement `models.providers.<id>.request.allowPrivateNetwork: true`.

## Associé

- [Sélection du modèle](/fr/concepts/model-providers)
- [Ollama](/fr/providers/ollama)
- [Modèles locaux](/fr/gateway/local-models)
