---
read_when:
    - Vous souhaitez exécuter OpenClaw avec des modèles open source via LM Studio
    - Vous souhaitez installer et configurer LM Studio
summary: Exécuter OpenClaw avec LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T13:45:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio exécute localement des modèles llama.cpp (GGUF) ou MLX, sous forme d’application avec interface graphique ou de daemon `llmster`
sans interface. Pour l’installation et la documentation du produit, consultez [lmstudio.ai](https://lmstudio.ai/).

## Démarrage rapide

<Steps>
  <Step title="Installer et démarrer le serveur">
    Installez LM Studio (application de bureau) ou `llmster` (sans interface), puis démarrez le serveur :

    ```bash
    lms server start --port 1234
    ```

    Vous pouvez également exécuter le daemon sans interface :

    ```bash
    lms daemon up
    ```

    Si vous utilisez l’application de bureau, activez le JIT pour assurer un chargement fluide des modèles ; consultez le
    [guide de LM Studio sur le JIT et le TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Définir une clé d’API si l’authentification est activée">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Si l’authentification de LM Studio est désactivée, laissez la clé d’API vide pendant la configuration. Consultez
    [Authentification de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Lancer la configuration initiale">
    ```bash
    openclaw onboard
    ```

    Choisissez `LM Studio`, puis sélectionnez un modèle à l’invite `Default model`.

    Lors d’une nouvelle configuration guidée, OpenClaw interroge d’abord `/api/v1/models` sur l’hôte
    LM Studio par défaut ou configuré. Un LLM existant est proposé par le biais du
    même parcours de configuration CLI/macOS et vérifié avec une véritable complétion avant
    l’enregistrement de sa configuration. La vérification automatique ne télécharge jamais de modèle et
    ignore les entrées du catalogue réservées aux embeddings.

  </Step>
</Steps>

Pour modifier ultérieurement le modèle par défaut :

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Les clés de modèle LM Studio utilisent un format `author/model-name` (par exemple `qwen/qwen3.5-9b`) ; les références de modèle OpenClaw
ajoutent le fournisseur en préfixe : `lmstudio/qwen/qwen3.5-9b`. Pour trouver la clé exacte d’un modèle, exécutez la
commande ci-dessous et consultez le champ `key` :

```bash
curl http://localhost:1234/api/v1/models
```

## Configuration initiale non interactive

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Vous pouvez également spécifier explicitement l’URL de base, le modèle et la clé d’API :

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` prend la clé de modèle renvoyée par LM Studio (par exemple `qwen/qwen3.5-9b`), sans
le préfixe de fournisseur `lmstudio/`. Transmettez `--lmstudio-api-key` (ou définissez `LM_API_TOKEN`) pour les serveurs
authentifiés ; omettez-la pour les serveurs sans authentification et OpenClaw stockera à la place un marqueur local non secret.
`--custom-api-key` reste accepté à des fins de compatibilité, mais `--lmstudio-api-key` est recommandé.

Cette opération écrit `models.providers.lmstudio` et définit le modèle par défaut sur `lmstudio/<custom-model-id>`.
La fourniture d’une clé d’API écrit également le profil d’authentification `lmstudio:default`.

La configuration interactive peut en outre demander une longueur de contexte de chargement préférée et l’appliquer à tous
les modèles découverts qu’elle enregistre dans la configuration.

## Configuration

### Compatibilité de l’utilisation en streaming

LM Studio n’émet pas toujours un objet `usage` au format OpenAI dans les réponses diffusées en streaming. OpenClaw
récupère plutôt le nombre de tokens à partir des métadonnées `timings.prompt_n` / `timings.predicted_n` au format llama.cpp.
Tout point de terminaison compatible avec OpenAI résolu comme point de terminaison local (hôte loopback) bénéficie de la même
solution de secours, ce qui couvre d’autres backends locaux tels que vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
et text-generation-webui.

### Compatibilité du raisonnement

Lorsque la découverte `/api/v1/models` de LM Studio signale des options de raisonnement propres au modèle, OpenClaw
expose les valeurs `reasoning_effort` correspondantes (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) dans
les métadonnées de compatibilité du modèle. Certaines versions de LM Studio annoncent une option binaire dans l’interface utilisateur (`allowed_options: ["off",
"on"]`) tout en rejetant ces valeurs littérales dans `/v1/chat/completions` ; OpenClaw normalise cette
forme binaire selon l’échelle à six niveaux avant d’envoyer les requêtes, y compris pour les anciennes configurations enregistrées qui
comportent encore des correspondances de raisonnement `off`/`on`.

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

LM Studio prend en charge le chargement juste-à-temps (JIT) des modèles, qui les charge à la première requête. Par défaut, OpenClaw
précharge les modèles à l’aide du point de terminaison de chargement natif de LM Studio, ce qui est utile lorsque le JIT est
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

### Hôte sur le LAN ou le tailnet

Utilisez l’adresse accessible de l’hôte LM Studio, conservez `/v1` et assurez-vous que LM Studio est lié à une adresse autre que
l’adresse loopback sur cette machine :

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

`lmstudio` approuve automatiquement son point de terminaison configuré pour les requêtes de modèle, notamment les hôtes loopback,
LAN et tailnet (à l’exception des origines de métadonnées/link-local). Toute entrée de fournisseur compatible avec OpenAI personnalisée/locale
bénéficie de la même approbation limitée à l’origine exacte. Les requêtes vers un autre hôte ou port privé nécessitent toujours
`models.providers.<id>.request.allowPrivateNetwork: true` ; définissez-le sur `false` pour désactiver
l’approbation par défaut.

## Dépannage

### LM Studio non détecté

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
- Consultez [Authentification de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si le serveur ne nécessite pas d’authentification, laissez la clé vide pendant la configuration.

## Pages connexes

- [Sélection du modèle](/fr/concepts/model-providers)
- [Ollama](/fr/providers/ollama)
- [Modèles locaux](/fr/gateway/local-models)
