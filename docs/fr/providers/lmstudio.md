---
read_when:
    - Vous souhaitez exécuter OpenClaw avec des modèles open source via LM Studio
    - Vous souhaitez installer et configurer LM Studio
summary: Exécuter OpenClaw avec LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T03:02:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio exécute localement des modèles llama.cpp (GGUF) ou MLX, sous forme d’application graphique ou de démon sans interface `llmster`.
Pour la documentation d’installation et du produit, consultez [lmstudio.ai](https://lmstudio.ai/).

## Démarrage rapide

<Steps>
  <Step title="Installer et démarrer le serveur">
    Installez LM Studio (bureau) ou `llmster` (sans interface), puis démarrez le serveur :

    ```bash
    lms server start --port 1234
    ```

    Vous pouvez également exécuter le démon sans interface :

    ```bash
    lms daemon up
    ```

    Si vous utilisez l’application de bureau, activez le JIT pour assurer un chargement fluide des modèles ; consultez le
    [guide du JIT et du TTL de LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Définir une clé d’API si l’authentification est activée">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Si l’authentification de LM Studio est désactivée, laissez la clé d’API vide pendant la configuration. Consultez
    [l’authentification de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Lancer la configuration initiale">
    ```bash
    openclaw onboard
    ```

    Choisissez `LM Studio`, puis sélectionnez un modèle à l’invite `Default model`.

  </Step>
</Steps>

Pour modifier ultérieurement le modèle par défaut :

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Les clés de modèle LM Studio utilisent le format `author/model-name` (par exemple `qwen/qwen3.5-9b`) ; les références de modèle OpenClaw
ajoutent le fournisseur en préfixe : `lmstudio/qwen/qwen3.5-9b`. Pour trouver la clé exacte d’un modèle, exécutez la
commande ci-dessous et consultez le champ `key` :

```bash
curl http://localhost:1234/api/v1/models
```

## Configuration initiale non interactive

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Vous pouvez également indiquer explicitement l’URL de base, le modèle et la clé d’API :

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` accepte la clé de modèle renvoyée par LM Studio (par exemple `qwen/qwen3.5-9b`), sans
le préfixe de fournisseur `lmstudio/`. Transmettez `--lmstudio-api-key` (ou définissez `LM_API_TOKEN`) pour les serveurs
authentifiés ; omettez-la pour les serveurs sans authentification, et OpenClaw enregistre à la place un marqueur local non secret.
`--custom-api-key` reste accepté à des fins de compatibilité, mais `--lmstudio-api-key` est recommandé.

Cette commande écrit `models.providers.lmstudio` et définit le modèle par défaut sur `lmstudio/<custom-model-id>`.
La fourniture d’une clé d’API écrit également le profil d’authentification `lmstudio:default`.

La configuration interactive peut également demander une longueur de contexte de chargement préférée et l’applique à tous
les modèles découverts qu’elle enregistre dans la configuration.

## Configuration

### Compatibilité de l’utilisation en streaming

LM Studio n’émet pas toujours un objet `usage` au format OpenAI dans les réponses en streaming. OpenClaw
récupère à la place le nombre de jetons à partir des métadonnées `timings.prompt_n` / `timings.predicted_n` de style llama.cpp.
Tout point de terminaison compatible avec OpenAI résolu comme point de terminaison local (hôte local loopback) bénéficie de la même
solution de repli, ce qui couvre d’autres moteurs locaux tels que vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
et text-generation-webui.

### Compatibilité du raisonnement

Lorsque la découverte via `/api/v1/models` de LM Studio indique des options de raisonnement propres au modèle, OpenClaw
expose les valeurs `reasoning_effort` correspondantes (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) dans
les métadonnées de compatibilité du modèle. Certaines versions de LM Studio annoncent une option d’interface binaire (`allowed_options: ["off",
"on"]`) tout en rejetant ces valeurs littérales sur `/v1/chat/completions` ; OpenClaw normalise cette
forme binaire vers l’échelle à six niveaux avant d’envoyer les requêtes, y compris pour les anciennes configurations enregistrées qui
contiennent encore des mappages de raisonnement `off`/`on`.

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

### Désactivation du préchargement

LM Studio prend en charge le chargement de modèles juste-à-temps (JIT), qui charge les modèles lors de la première requête. OpenClaw
précharge par défaut les modèles au moyen du point de terminaison de chargement natif de LM Studio, ce qui est utile lorsque le JIT est
désactivé. Pour laisser plutôt le JIT, le TTL d’inactivité et le comportement d’éviction automatique de LM Studio gérer le cycle de vie des modèles,
désactivez l’étape de préchargement d’OpenClaw :

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

### Hôte du réseau local ou du tailnet

Utilisez l’adresse accessible de l’hôte LM Studio, conservez `/v1` et assurez-vous que LM Studio écoute sur une interface autre que
local loopback sur cette machine :

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

`lmstudio` approuve automatiquement son point de terminaison configuré pour les requêtes de modèles, notamment les hôtes local loopback,
du réseau local et du tailnet (à l’exception des origines de métadonnées et locales au lien). Toute entrée de fournisseur compatible avec OpenAI
personnalisée ou locale bénéficie de la même approbation limitée à l’origine exacte. Les requêtes vers un autre hôte ou port privé nécessitent toujours
`models.providers.<id>.request.allowPrivateNetwork: true` ; définissez cette valeur sur `false` pour désactiver
l’approbation par défaut.

## Résolution des problèmes

### LM Studio n’est pas détecté

Assurez-vous que LM Studio est en cours d’exécution :

```bash
lms server start --port 1234
```

Si l’authentification est activée, définissez également `LM_API_TOKEN`. Vérifiez que l’API est accessible :

```bash
curl http://localhost:1234/api/v1/models
```

### Erreurs d’authentification (HTTP 401)

- Vérifiez que `LM_API_TOKEN` correspond à la clé configurée dans LM Studio.
- Consultez [l’authentification de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si le serveur ne nécessite pas d’authentification, laissez la clé vide pendant la configuration.

## Pages connexes

- [Sélection du modèle](/fr/concepts/model-providers)
- [Ollama](/fr/providers/ollama)
- [Modèles locaux](/fr/gateway/local-models)
