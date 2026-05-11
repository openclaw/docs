---
read_when:
    - Vous souhaitez servir des modèles depuis votre propre machine GPU
    - Vous configurez LM Studio ou un proxy compatible avec OpenAI
    - Il vous faut les recommandations les plus sûres pour les modèles locaux
summary: Exécuter OpenClaw sur des LLM locaux (LM Studio, vLLM, LiteLLM, points de terminaison OpenAI personnalisés)
title: Modèles locaux
x-i18n:
    generated_at: "2026-05-11T20:37:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

Les modèles locaux sont possibles. Ils exigent aussi davantage du matériel, de la taille de contexte et de la défense contre l’injection de prompts — les cartes petites ou quantifiées agressivement tronquent le contexte et affaiblissent la sécurité. Cette page est le guide prescriptif pour les stacks locales haut de gamme et les serveurs locaux personnalisés compatibles OpenAI. Pour une intégration avec le moins de friction possible, commencez par [LM Studio](/fr/providers/lmstudio) ou [Ollama](/fr/providers/ollama) et `openclaw onboard`.

Pour les serveurs locaux qui ne doivent démarrer que lorsqu’un modèle sélectionné en a besoin, consultez
[Services de modèles locaux](/fr/gateway/local-model-services).

## Socle matériel

Visez haut : **≥2 Mac Studios au maximum de leur configuration ou une machine GPU équivalente (~30 k$+)** pour une boucle d’agent confortable. Un seul GPU de **24 Go** ne convient qu’aux prompts plus légers, avec une latence plus élevée. Exécutez toujours la **variante la plus grande / complète que vous pouvez héberger** ; les checkpoints petits ou fortement quantifiés augmentent le risque d’injection de prompts (voir [Sécurité](/fr/gateway/security)).

## Choisir un backend

| Backend                                              | À utiliser lorsque                                                         |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/fr/providers/lmstudio)                     | Première configuration locale, chargeur GUI, API Responses native           |
| [Ollama](/fr/providers/ollama)                          | Flux de travail CLI, bibliothèque de modèles, service systemd sans intervention |
| MLX / vLLM / SGLang                                  | Service auto-hébergé à haut débit avec un point de terminaison HTTP compatible OpenAI |
| LiteLLM / OAI-proxy / proxy personnalisé compatible OpenAI | Vous placez une autre API de modèle en façade et voulez qu’OpenClaw la traite comme OpenAI |

Utilisez l’API Responses (`api: "openai-responses"`) lorsque le backend la prend en charge (c’est le cas de LM Studio). Sinon, restez sur Chat Completions (`api: "openai-completions"`).

<Warning>
**Utilisateurs WSL2 + Ollama + NVIDIA/CUDA :** l’installateur Linux officiel d’Ollama active un service systemd avec `Restart=always`. Sur les configurations GPU WSL2, le démarrage automatique peut recharger le dernier modèle au démarrage et monopoliser la mémoire de l’hôte. Si votre VM WSL2 redémarre en boucle après l’activation d’Ollama, consultez [boucle de plantage WSL2](/fr/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Recommandé : LM Studio + grand modèle local (API Responses)

Meilleure stack locale actuelle. Chargez un grand modèle dans LM Studio (par exemple une build Qwen, DeepSeek ou Llama complète), activez le serveur local (`http://127.0.0.1:1234` par défaut) et utilisez l’API Responses pour séparer le raisonnement du texte final.

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

**Liste de vérification de configuration**

- Installez LM Studio : [https://lmstudio.ai](https://lmstudio.ai)
- Dans LM Studio, téléchargez la **plus grande build de modèle disponible** (évitez les variantes « small »/fortement quantifiées), démarrez le serveur, confirmez que `http://127.0.0.1:1234/v1/models` le liste.
- Remplacez `my-local-model` par l’ID de modèle réel affiché dans LM Studio.
- Gardez le modèle chargé ; le chargement à froid ajoute de la latence au démarrage.
- Ajustez `contextWindow`/`maxTokens` si votre build LM Studio diffère.
- Pour WhatsApp, restez sur l’API Responses afin que seul le texte final soit envoyé.

Gardez les modèles hébergés configurés même lorsque vous exécutez localement ; utilisez `models.mode: "merge"` afin que les fallbacks restent disponibles.

### Configuration hybride : primaire hébergé, fallback local

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

### Local d’abord avec filet de sécurité hébergé

Inversez l’ordre du primaire et des fallbacks ; gardez le même bloc providers et `models.mode: "merge"` afin de pouvoir revenir à Sonnet ou Opus lorsque la machine locale est indisponible.

### Hébergement régional / routage des données

- Des variantes MiniMax/Kimi/GLM hébergées existent aussi sur OpenRouter avec des points de terminaison ancrés par région (par exemple hébergés aux États-Unis). Choisissez la variante régionale à cet endroit pour conserver le trafic dans la juridiction de votre choix tout en utilisant `models.mode: "merge"` pour les fallbacks Anthropic/OpenAI.
- Le local uniquement reste la voie la plus forte pour la confidentialité ; le routage régional hébergé est le compromis lorsque vous avez besoin de fonctionnalités de fournisseur tout en voulant contrôler le flux des données.

## Autres proxys locaux compatibles OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy ou des Gateway personnalisés fonctionnent s’ils exposent un point de terminaison de style OpenAI `/v1/chat/completions`. Utilisez l’adaptateur Chat Completions sauf si le backend documente explicitement la prise en charge de `/v1/responses`. Remplacez le bloc provider ci-dessus par votre point de terminaison et votre ID de modèle :

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

Si `api` est omis sur un provider personnalisé avec un `baseUrl`, OpenClaw utilise par défaut `openai-completions`. Les points de terminaison de bouclage tels que `127.0.0.1` sont automatiquement approuvés ; les points de terminaison LAN, tailnet et DNS privé nécessitent toujours `request.allowPrivateNetwork: true`.

La valeur `models.providers.<id>.models[].id` est locale au provider. N’y incluez pas le préfixe du provider. Par exemple, un serveur MLX démarré avec `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` doit utiliser cet ID de catalogue et cette référence de modèle :

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Définissez `input: ["text", "image"]` sur les modèles de vision locaux ou proxifiés afin que les pièces jointes image soient injectées dans les tours d’agent. L’onboarding interactif des providers personnalisés déduit les ID de modèles de vision courants et ne pose des questions que pour les noms inconnus. L’onboarding non interactif utilise la même inférence ; utilisez `--custom-image-input` pour les ID de vision inconnus ou `--custom-text-input` lorsqu’un modèle qui ressemble à un modèle connu est texte uniquement derrière votre point de terminaison.

Gardez `models.mode: "merge"` afin que les modèles hébergés restent disponibles comme fallbacks. Utilisez `models.providers.<id>.timeoutSeconds` pour les serveurs de modèles locaux ou distants lents avant d’augmenter `agents.defaults.timeoutSeconds`. Le délai d’expiration du provider ne s’applique qu’aux requêtes HTTP de modèle, y compris la connexion, les en-têtes, le streaming du corps et l’abandon total guarded-fetch.

<Note>
Pour les providers personnalisés compatibles OpenAI, la persistance d’un marqueur local non secret tel que `apiKey: "ollama-local"` est acceptée lorsque `baseUrl` se résout vers une adresse de bouclage, un LAN privé, `.local` ou un nom d’hôte nu. OpenClaw le traite comme un identifiant local valide au lieu de signaler une clé manquante. Utilisez une vraie valeur pour tout provider qui accepte un nom d’hôte public.
</Note>

Note de comportement pour les backends `/v1` locaux/proxifiés :

- OpenClaw les traite comme des routes compatibles OpenAI de type proxy, et non comme des points de terminaison OpenAI natifs
- la mise en forme des requêtes réservée à OpenAI natif ne s’applique pas ici : pas de `service_tier`, pas de `store` Responses, pas de mise en forme de payload compatible raisonnement OpenAI, et pas d’indices de cache de prompt
- les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) ne sont pas injectés sur ces URL de proxy personnalisées

Notes de compatibilité pour les backends compatibles OpenAI plus stricts :

- Certains serveurs n’acceptent que des `messages[].content` sous forme de chaîne sur Chat Completions, et non des tableaux structurés de parties de contenu. Définissez `models.providers.<provider>.models[].compat.requiresStringContent: true` pour ces points de terminaison.
- Certains modèles locaux émettent des demandes d’outil autonomes entre crochets sous forme de texte, telles que `[tool_name]` suivies de JSON et de `[END_TOOL_REQUEST]`. OpenClaw les promeut en appels d’outil réels uniquement lorsque le nom correspond exactement à un outil enregistré pour le tour ; sinon, le bloc est traité comme du texte non pris en charge et masqué dans les réponses visibles par l’utilisateur.
- Si un modèle émet du texte JSON, XML ou de style ReAct qui ressemble à un appel d’outil mais que le provider n’a pas émis d’invocation structurée, OpenClaw le laisse comme texte et journalise un avertissement avec l’ID d’exécution, le provider/modèle, le motif détecté et le nom de l’outil lorsqu’il est disponible. Traitez cela comme une incompatibilité d’appel d’outil provider/modèle, pas comme une exécution d’outil terminée.
- Si des outils apparaissent comme du texte assistant au lieu de s’exécuter, par exemple du JSON brut, du XML, une syntaxe ReAct ou un tableau `tool_calls` vide dans la réponse du provider, vérifiez d’abord que le serveur utilise un modèle/parser de chat capable d’appels d’outil. Pour les backends Chat Completions compatibles OpenAI dont le parser fonctionne uniquement lorsque l’utilisation d’outils est forcée, définissez un override de requête par modèle au lieu de vous appuyer sur l’analyse de texte :

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

  Utilisez ceci uniquement pour les modèles/sessions où chaque tour normal doit appeler un outil.
  Cela remplace la valeur proxy par défaut d’OpenClaw, `tool_choice: "auto"`.
  Remplacez `local/my-local-model` par la référence provider/modèle exacte affichée par
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Si un modèle personnalisé compatible OpenAI accepte des efforts de raisonnement OpenAI au-delà du profil intégré, déclarez-les dans le bloc compat du modèle. Ajouter `"xhigh"` ici fait que `/think xhigh`, les sélecteurs de session, la validation Gateway et la validation `llm-task` exposent le niveau pour cette référence provider/modèle configurée :

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

Si le modèle se charge correctement mais que les tours complets de l’agent se comportent mal, procédez de haut en bas — confirmez d’abord le transport, puis réduisez la surface.

1. **Confirmez que le modèle local lui-même répond.** Aucun outil, aucun contexte d’agent :

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Confirmez le routage du Gateway.** Envoie uniquement le prompt fourni — ignore la transcription, l’amorçage AGENTS, l’assemblage du moteur de contexte, les outils et les serveurs MCP groupés, mais exerce tout de même le routage du Gateway, l’authentification et la sélection du fournisseur :

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Essayez le mode allégé.** Si les deux sondes réussissent mais que les vrais tours d’agent échouent avec des appels d’outil mal formés ou des prompts surdimensionnés, activez `agents.defaults.experimental.localModelLean: true`. Il supprime les trois outils par défaut les plus lourds (`browser`, `cron`, `message`) afin que la forme du prompt soit plus petite et moins fragile. Consultez [Fonctionnalités expérimentales → Mode allégé pour modèle local](/fr/concepts/experimental-features#local-model-lean-mode) pour l’explication complète, les cas d’utilisation et la manière de confirmer qu’il est activé.

4. **Désactivez entièrement les outils en dernier recours.** Si le mode allégé ne suffit pas, définissez `models.providers.<provider>.models[].compat.supportsTools: false` pour cette entrée de modèle. L’agent fonctionnera alors sans appels d’outil sur ce modèle.

5. **Au-delà, le goulot d’étranglement est en amont.** Si le backend échoue encore uniquement sur des exécutions OpenClaw plus importantes après le mode allégé et `supportsTools: false`, le problème restant concerne généralement le modèle ou la capacité du serveur en amont — fenêtre de contexte, mémoire GPU, éviction du kv-cache ou bug du backend. À ce stade, ce n’est pas la couche de transport d’OpenClaw.

## Dépannage

- Le Gateway peut-il atteindre le proxy ? `curl http://127.0.0.1:1234/v1/models`.
- Modèle LM Studio déchargé ? Rechargez-le ; le démarrage à froid est une cause fréquente de « blocage ».
- Le serveur local indique `terminated`, `ECONNRESET`, ou ferme le flux en plein tour ?
  OpenClaw enregistre un `model.call.error.failureKind` à faible cardinalité ainsi que l’instantané RSS/tas du processus
  OpenClaw dans les diagnostics. En cas de pression mémoire avec LM Studio/Ollama,
  faites correspondre cet horodatage avec le journal du serveur ou le journal de plantage /
  jetsam de macOS pour confirmer si le serveur de modèle a été tué.
- OpenClaw dérive les seuils de prévalidation de la fenêtre de contexte à partir de la fenêtre du modèle détectée, ou de la fenêtre de modèle non plafonnée lorsque `agents.defaults.contextTokens` abaisse la fenêtre effective. Il avertit sous 20 % avec un plancher de **8k**. Les blocages stricts utilisent le seuil de 10 % avec un plancher de **4k**, plafonné à la fenêtre de contexte effective afin que des métadonnées de modèle surdimensionnées ne puissent pas rejeter une limite utilisateur pourtant valide. Si vous atteignez cette prévalidation, augmentez la limite de contexte du serveur/modèle ou choisissez un modèle plus grand.
- Erreurs de contexte ? Réduisez `contextWindow` ou augmentez votre limite serveur.
- Un serveur compatible OpenAI renvoie `messages[].content ... expected a string` ?
  Ajoutez `compat.requiresStringContent: true` à cette entrée de modèle.
- Un serveur compatible OpenAI renvoie `validation.keys` ou indique que les entrées de message n’autorisent que `role` et `content` ?
  Ajoutez `compat.strictMessageKeys: true` à cette entrée de modèle.
- Les petits appels directs à `/v1/chat/completions` fonctionnent, mais `openclaw infer model run --local`
  échoue sur Gemma ou un autre modèle local ? Vérifiez d’abord l’URL du fournisseur, la référence du modèle, le marqueur d’authentification et les journaux du serveur ; le `model run` local n’inclut pas les outils d’agent.
  Si le `model run` local réussit mais que les tours d’agent plus importants échouent, réduisez la surface d’outils de l’agent
  avec `localModelLean` ou `compat.supportsTools: false`.
- Les appels d’outil apparaissent comme du texte JSON/XML/ReAct brut, ou le fournisseur renvoie un
  tableau `tool_calls` vide ? N’ajoutez pas de proxy qui convertit aveuglément le texte de l’assistant
  en exécution d’outil. Corrigez d’abord le modèle de chat/parser du serveur. Si le
  modèle ne fonctionne que lorsque l’utilisation d’outils est forcée, ajoutez le remplacement par modèle
  `params.extra_body.tool_choice: "required"` ci-dessus et utilisez cette entrée de modèle
  uniquement pour les sessions où un appel d’outil est attendu à chaque tour.
- Sécurité : les modèles locaux ignorent les filtres côté fournisseur ; gardez des agents ciblés et la Compaction activée pour limiter le rayon d’action de l’injection de prompt.

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Basculement de modèle](/fr/concepts/model-failover)
