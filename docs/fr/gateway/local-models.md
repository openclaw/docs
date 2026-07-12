---
read_when:
    - Vous souhaitez servir des modèles depuis votre propre machine équipée d’un GPU
    - Vous configurez LM Studio ou un proxy compatible avec OpenAI
    - Vous avez besoin de recommandations sur le modèle local le plus sûr
summary: Exécuter OpenClaw sur des LLM locaux (LM Studio, vLLM, LiteLLM, points de terminaison OpenAI personnalisés)
title: Modèles locaux
x-i18n:
    generated_at: "2026-07-12T15:26:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Les modèles locaux fonctionnent, mais ils imposent des exigences plus élevées en matière de matériel, de taille de contexte et de protection contre l’injection de prompts : les modèles de petite taille ou fortement quantifiés tronquent le contexte et ne bénéficient pas des filtres de sécurité côté fournisseur. Cette page présente les piles locales haut de gamme et les serveurs personnalisés compatibles avec OpenAI. Pour la solution la plus simple, commencez par [LM Studio](/fr/providers/lmstudio) ou [Ollama](/fr/providers/ollama) et `openclaw onboard`.

Pour les serveurs locaux qui ne doivent démarrer que lorsqu’un modèle sélectionné en a besoin, consultez [Services de modèles locaux](/fr/gateway/local-model-services).

## Configuration matérielle minimale

Visez **au moins 2 Mac Studio dotés de la configuration maximale ou une installation GPU équivalente (~$30k+)** pour bénéficier d’une boucle d’agent confortable. Un seul GPU de **24 GB** ne prend en charge que des prompts plus légers, avec une latence plus élevée. Exécutez toujours la **variante la plus grande / complète que vous puissiez héberger** : les checkpoints de petite taille ou fortement quantifiés augmentent le risque d’injection de prompts (voir [Sécurité](/fr/gateway/security)).

## Choisir un backend

| Backend                                              | À utiliser lorsque                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [ds4](/fr/providers/ds4)                                | DeepSeek V4 Flash local sur macOS Metal avec appels d’outils compatibles avec OpenAI                                |
| [LM Studio](/fr/providers/lmstudio)                     | Première configuration locale, chargeur avec interface graphique, API Responses native                             |
| LiteLLM / OAI-proxy / proxy personnalisé compatible avec OpenAI | Vous placez un proxy devant une autre API de modèle et souhaitez qu’OpenClaw la traite comme OpenAI                  |
| MLX / vLLM / SGLang                                  | Service auto-hébergé à haut débit avec un point de terminaison HTTP compatible avec OpenAI                          |
| [Ollama](/fr/providers/ollama)                          | Flux de travail CLI, bibliothèque de modèles, service systemd autonome                                              |

Utilisez `api: "openai-responses"` lorsque le backend le prend en charge (c’est le cas de LM Studio). Sinon, utilisez `api: "openai-completions"`. Si `api` est omis pour un fournisseur personnalisé doté d’une `baseUrl`, OpenClaw utilise `openai-completions` par défaut.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA :** le programme d’installation Linux officiel d’Ollama active un service systemd avec `Restart=always`. Sur les configurations GPU WSL2, le démarrage automatique peut recharger le dernier modèle pendant le démarrage et monopoliser la mémoire de l’hôte, entraînant des redémarrages répétés de la machine virtuelle. Consultez [Boucle de plantage WSL2](/fr/providers/ollama#troubleshooting).
</Warning>

## LM Studio + grand modèle local (API Responses)

Il s’agit actuellement de la meilleure pile locale. Chargez un grand modèle dans LM Studio (une version complète de Qwen, DeepSeek ou Llama), activez le serveur local (`http://127.0.0.1:1234` par défaut) et utilisez l’API Responses afin de séparer le raisonnement du texte final.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Liste de vérification de la configuration :

- Installez LM Studio : [https://lmstudio.ai](https://lmstudio.ai)
- Téléchargez la **plus grande version de modèle disponible** (évitez les variantes « small » ou fortement quantifiées), démarrez le serveur et vérifiez que `http://127.0.0.1:1234/v1/models` la répertorie.
- Remplacez `my-local-model` par l’identifiant réel du modèle affiché dans LM Studio.
- Gardez le modèle chargé ; un chargement à froid augmente la latence au démarrage.
- Ajustez `contextWindow`/`maxTokens` si votre version de LM Studio utilise des valeurs différentes.
- Pour WhatsApp, utilisez l’API Responses afin que seul le texte final soit envoyé.
- Conservez `models.mode: "merge"` afin que les modèles hébergés restent disponibles comme solutions de repli.

### Configuration hybride : modèle hébergé principal, modèle local de repli

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Pour privilégier le modèle local tout en conservant un filet de sécurité hébergé, inversez l’ordre de `primary`/`fallbacks` et conservez le même bloc `providers` ainsi que `models.mode: "merge"`.

### Hébergement régional / routage des données

Des variantes hébergées de MiniMax/Kimi/GLM sont également disponibles sur OpenRouter avec des points de terminaison associés à une région précise (par exemple, hébergés aux États-Unis). Choisissez la variante régionale afin de conserver le trafic dans la juridiction choisie, tout en maintenant `models.mode: "merge"` pour les modèles de repli Anthropic/OpenAI. Une configuration entièrement locale reste la meilleure solution en matière de confidentialité ; le routage régional hébergé constitue un compromis lorsque vous avez besoin des fonctionnalités d’un fournisseur tout en souhaitant contrôler le flux des données.

## Autres proxys locaux compatibles avec OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy ou tout Gateway personnalisé fonctionne s’il expose un point de terminaison `/v1/chat/completions` conforme à OpenAI. Utilisez `openai-completions`, sauf si le backend documente explicitement la prise en charge de `/v1/responses`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Les entrées de fournisseurs personnalisés/locaux approuvent l’origine exacte de leur `baseUrl` configurée pour les requêtes de modèle protégées, notamment les hôtes de bouclage, du réseau local, du tailnet et du DNS privé. Les origines de métadonnées ou link-local sont toujours bloquées. Les requêtes vers d’autres origines privées nécessitent toujours `models.providers.<id>.request.allowPrivateNetwork: true` ; définissez l’indicateur de confiance sur `false` pour désactiver la confiance accordée à l’origine exacte.

`models.providers.<id>.models[].id` est local au fournisseur : n’incluez pas le préfixe du fournisseur. Pour un serveur MLX démarré avec `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` :

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Définissez `input: ["text", "image"]` pour les modèles de vision locaux ou accessibles par proxy afin que les pièces jointes d’image soient injectées dans les tours de l’agent. L’intégration interactive d’un fournisseur personnalisé déduit les identifiants courants des modèles de vision et ne pose de question que pour les noms inconnus ; l’intégration non interactive utilise la même déduction, avec `--custom-image-input` / `--custom-text-input` pour la remplacer.

Utilisez `models.providers.<id>.timeoutSeconds` pour les serveurs de modèles locaux/distants lents avant d’augmenter `agents.defaults.timeoutSeconds`. Le délai d’expiration du fournisseur couvre la connexion, les en-têtes, la diffusion du corps et l’abandon total de la récupération protégée pour les seules requêtes HTTP du modèle. Si le délai d’expiration de l’agent/de l’exécution est inférieur, augmentez-le également, car le délai d’expiration du fournisseur ne peut pas prolonger l’ensemble de l’exécution.

<Note>
Pour les fournisseurs personnalisés compatibles avec OpenAI, un marqueur local non secret tel que `apiKey: "ollama-local"` est accepté lorsque `baseUrl` correspond à une adresse de bouclage, un réseau local privé, `.local` ou un nom d’hôte sans domaine : OpenClaw le traite comme un identifiant local valide au lieu de signaler une clé manquante. Utilisez une valeur réelle pour tout fournisseur acceptant un nom d’hôte public.
</Note>

Remarques sur le comportement des backends `/v1` locaux/accessibles par proxy :

- OpenClaw les traite comme des routes de proxy compatibles avec OpenAI, et non comme des points de terminaison OpenAI natifs.
- La mise en forme des requêtes propre à OpenAI natif ne s’applique pas : pas de `service_tier`, pas de `store` pour Responses, pas de mise en forme de charge utile assurant la compatibilité du raisonnement OpenAI, ni d’indications de cache de prompts.
- Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) ne sont pas injectés dans les URL de proxy personnalisées.

Remplacements de compatibilité pour les backends compatibles avec OpenAI plus stricts :

- **Contenu sous forme de chaîne uniquement** : certains serveurs n’acceptent que des valeurs de type chaîne pour `messages[].content`, et non des tableaux structurés de parties de contenu. Définissez `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Clés de message strictes** : si le serveur rejette les entrées de message comportant d’autres clés que `role`/`content`, définissez `compat.strictMessageKeys: true`.
- **Texte d’outil entre crochets** : certains modèles locaux produisent des requêtes d’outil autonomes sous forme de texte entre crochets, comme `[tool_name]`, suivies de JSON et de `[END_TOOL_REQUEST]`. OpenClaw les convertit en véritables appels d’outils uniquement lorsque le nom correspond exactement à un outil enregistré pour le tour ; sinon, ce contenu reste du texte masqué et non pris en charge.
- **Texte non structuré ressemblant à un appel d’outil** : si un modèle produit du texte au format JSON/XML/ReAct qui ressemble à un appel d’outil sans être une invocation structurée, OpenClaw le conserve comme texte et journalise un avertissement comprenant l’identifiant d’exécution, le fournisseur/modèle, le motif détecté et le nom de l’outil lorsqu’il est disponible. Il s’agit d’une incompatibilité du fournisseur/modèle, et non d’une exécution d’outil terminée.
- **Imposer l’utilisation d’un outil** : si les outils apparaissent sous forme de texte de l’assistant (JSON/XML/ReAct brut ou tableau `tool_calls` vide), vérifiez d’abord que le modèle de discussion/l’analyseur du serveur prend en charge les appels d’outils. Si l’analyseur ne fonctionne que lorsque l’utilisation d’un outil est imposée, remplacez la valeur de proxy par défaut `tool_choice: "auto"` pour chaque modèle :

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Utilisez cette option uniquement lorsque chaque tour normal doit appeler un outil. Remplacez `local/my-local-model` par la référence exacte obtenue avec `openclaw models list`, ou définissez-la via la CLI :

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Niveaux de raisonnement supplémentaires** : si un modèle personnalisé compatible avec OpenAI accepte des niveaux de raisonnement OpenAI au-delà du profil intégré, déclarez-les dans le bloc de compatibilité du modèle. L’ajout de `"xhigh"` le rend disponible pour cette référence de modèle dans `/think xhigh`, les sélecteurs de session, la validation du Gateway et la validation de `llm-task` :

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## Backends plus petits ou plus stricts

Si le modèle se charge correctement, mais que les tours complets de l’agent se comportent mal, procédez du général au particulier : vérifiez d’abord le transport, puis réduisez la surface.

1. **Vérifiez que le modèle local répond** : sans outils ni contexte d’agent :

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Répondez exactement par : pong" --json
   ```

2. **Confirmez le routage du Gateway** - envoie uniquement le prompt, sans la transcription, l’amorçage AGENTS, l’assemblage du moteur de contexte, les outils ni les serveurs MCP intégrés, mais teste tout de même le routage du Gateway, l’authentification et la sélection du fournisseur :

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Répondez exactement par : pong" --json
   ```

3. **Essayez le mode allégé** si les deux sondes réussissent, mais que les véritables tours d’agent échouent avec des appels d’outils mal formés ou des prompts trop volumineux : définissez `agents.defaults.experimental.localModelLean: true`. Ce mode élimine les outils lourds de navigateur, de cron, de messagerie, de génération de médias, de voix et de PDF, sauf s’ils sont explicitement requis, et place par défaut les catalogues d’outils plus volumineux derrière des contrôles structurés de recherche d’outils, tout en maintenant `exec` directement visible. Consultez [Fonctionnalités expérimentales -> Mode allégé pour les modèles locaux](/fr/concepts/experimental-features#local-model-lean-mode) pour plus de détails et savoir comment vérifier qu’il est activé.

4. **Désactivez entièrement les outils en dernier recours** en définissant `models.providers.<provider>.models[].compat.supportsTools: false` pour ce modèle ; l’agent s’exécute alors sans appels d’outils.

5. **Au-delà, le goulot d’étranglement se situe en amont.** Si le backend continue d’échouer uniquement lors des exécutions OpenClaw plus volumineuses après l’activation du mode allégé et de `supportsTools: false`, le problème restant vient généralement du modèle ou du serveur lui-même — fenêtre de contexte, mémoire GPU, éviction du cache KV ou bogue du backend — et non de la couche de transport d’OpenClaw.

## Dépannage

- **Le Gateway ne parvient pas à joindre le proxy ?** `curl http://127.0.0.1:1234/v1/models`.
- **Le modèle LM Studio est déchargé ?** Rechargez-le ; un démarrage à froid est une cause fréquente de « blocage ».
- **Le serveur local indique `terminated`, `ECONNRESET` ou ferme le flux au milieu d’un tour ?** OpenClaw enregistre dans les diagnostics une valeur `model.call.error.failureKind` à faible cardinalité ainsi qu’un instantané de la mémoire RSS/du tas du processus OpenClaw. En cas de pression mémoire dans LM Studio/Ollama, faites correspondre cet horodatage avec le journal du serveur ou un journal de plantage/jetsam de macOS afin de vérifier si le serveur de modèles a été arrêté.
- **Des erreurs de contexte ?** OpenClaw déduit les seuils de contrôle préalable de la fenêtre de contexte à partir de la fenêtre détectée du modèle (ou de la fenêtre plafonnée lorsque `agents.defaults.contextTokens` la réduit), en émettant un avertissement sous 20 % avec un plancher de **8k** et en bloquant sous 10 % avec un plancher de **4k** (plafonné à la fenêtre de contexte effective afin que des métadonnées de modèle surdimensionnées ne puissent pas rejeter une limite utilisateur valide). Réduisez `contextWindow` ou augmentez la limite de contexte du serveur/modèle.
- **`messages[].content ... expected a string` ?** Ajoutez `compat.requiresStringContent: true` à l’entrée de ce modèle.
- **`validation.keys`, ou « message entries only allow `role` and `content` » ?** Ajoutez `compat.strictMessageKeys: true` à l’entrée de ce modèle.
- **Les appels directs à `/v1/chat/completions` fonctionnent, mais `openclaw infer model run --local` échoue avec Gemma ou un autre modèle local ?** Vérifiez d’abord l’URL du fournisseur, la référence du modèle, le marqueur d’authentification et les journaux du serveur ; `model run` ignore entièrement les outils de l’agent. Si `model run` réussit, mais que les tours d’agent plus volumineux échouent, réduisez la surface des outils avec `localModelLean` ou `compat.supportsTools: false`.
- **Les appels d’outils apparaissent sous forme de texte JSON/XML/ReAct brut, ou le fournisseur renvoie un tableau `tool_calls` vide ?** N’ajoutez pas de proxy qui convertit aveuglément le texte de l’assistant en exécution d’outils ; corrigez d’abord le modèle de discussion/l’analyseur du serveur. Si le modèle ne fonctionne que lorsque l’utilisation d’outils est forcée, ajoutez le remplacement `params.extra_body.tool_choice: "required"` ci-dessus et utilisez cette entrée de modèle uniquement pour les sessions dans lesquelles un appel d’outil est attendu à chaque tour.
- **Sécurité** : les modèles locaux ignorent les filtres côté fournisseur. Limitez étroitement le périmètre des agents et laissez la Compaction activée afin de réduire le rayon d’impact des injections de prompt.

## Pages connexes

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Basculement de modèle](/fr/concepts/model-failover)
