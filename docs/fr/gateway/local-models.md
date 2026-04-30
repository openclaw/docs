---
read_when:
    - Vous voulez servir des modèles depuis votre propre machine équipée d’un GPU
    - Vous configurez LM Studio ou un proxy compatible avec OpenAI
    - Vous avez besoin des recommandations les plus sûres pour les modèles locaux
summary: Exécuter OpenClaw sur des LLM locaux (LM Studio, vLLM, LiteLLM, points de terminaison OpenAI personnalisés)
title: Modèles locaux
x-i18n:
    generated_at: "2026-04-30T07:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ec1be4eac371328c1efe80b71450019f68fb1114df90db1532a4ff72bfa0ab1
    source_path: gateway/local-models.md
    workflow: 16
---

Local est faisable, mais OpenClaw attend un contexte large et de solides défenses contre l’injection de prompt. Les petites cartes tronquent le contexte et dégradent la sécurité. Visez haut : **≥2 Mac Studios au maximum de leur configuration, ou une machine GPU équivalente (~30 000 $+)**. Un seul GPU de **24 Go** ne convient qu’aux prompts plus légers avec une latence plus élevée. Utilisez la **plus grande variante de modèle / variante pleine taille que vous pouvez exécuter** ; les checkpoints fortement quantifiés ou « petits » augmentent le risque d’injection de prompt (voir [Sécurité](/fr/gateway/security)).

Si vous voulez la configuration locale la plus simple, commencez avec [LM Studio](/fr/providers/lmstudio) ou [Ollama](/fr/providers/ollama) et `openclaw onboard`. Cette page est le guide prescriptif pour les piles locales haut de gamme et les serveurs locaux personnalisés compatibles OpenAI.

<Warning>
**Utilisateurs WSL2 + Ollama + NVIDIA/CUDA :** L’installateur Linux officiel d’Ollama active un service systemd avec `Restart=always`. Sur les configurations GPU WSL2, le démarrage automatique peut recharger le dernier modèle au démarrage et immobiliser la mémoire de l’hôte. Si votre VM WSL2 redémarre en boucle après l’activation d’Ollama, consultez [boucle de crash WSL2](/fr/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Recommandé : LM Studio + grand modèle local (Responses API)

Meilleure pile locale actuelle. Chargez un grand modèle dans LM Studio (par exemple une build pleine taille de Qwen, DeepSeek ou Llama), activez le serveur local (`http://127.0.0.1:1234` par défaut), et utilisez Responses API pour garder le raisonnement séparé du texte final.

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

**Liste de configuration**

- Installez LM Studio : [https://lmstudio.ai](https://lmstudio.ai)
- Dans LM Studio, téléchargez la **plus grande build de modèle disponible** (évitez les variantes « small »/fortement quantifiées), démarrez le serveur, confirmez que `http://127.0.0.1:1234/v1/models` la liste.
- Remplacez `my-local-model` par l’ID de modèle réel affiché dans LM Studio.
- Gardez le modèle chargé ; le chargement à froid ajoute de la latence au démarrage.
- Ajustez `contextWindow`/`maxTokens` si votre build LM Studio diffère.
- Pour WhatsApp, restez sur Responses API afin que seul le texte final soit envoyé.

Gardez les modèles hébergés configurés même lorsque vous exécutez en local ; utilisez `models.mode: "merge"` pour que les solutions de repli restent disponibles.

### Configuration hybride : principal hébergé, repli local

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

### Priorité au local avec filet de sécurité hébergé

Inversez l’ordre du modèle principal et des replis ; gardez le même bloc providers et `models.mode: "merge"` afin de pouvoir basculer vers Sonnet ou Opus lorsque la machine locale est indisponible.

### Hébergement régional / routage des données

- Des variantes MiniMax/Kimi/GLM hébergées existent aussi sur OpenRouter avec des points de terminaison ancrés par région (par exemple hébergés aux États-Unis). Choisissez-y la variante régionale pour garder le trafic dans la juridiction de votre choix tout en utilisant `models.mode: "merge"` pour les replis Anthropic/OpenAI.
- Le local uniquement reste la voie de confidentialité la plus forte ; le routage régional hébergé est le compromis lorsque vous avez besoin des fonctionnalités d’un fournisseur tout en gardant le contrôle du flux de données.

## Autres proxys locaux compatibles OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy ou des Gateway personnalisés fonctionnent s’ils exposent un point de terminaison OpenAI de style `/v1/chat/completions`. Utilisez l’adaptateur Chat Completions sauf si le backend documente explicitement la prise en charge de `/v1/responses`. Remplacez le bloc provider ci-dessus par votre point de terminaison et votre ID de modèle :

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

Si `api` est omis sur un provider personnalisé avec une `baseUrl`, OpenClaw utilise par défaut `openai-completions`. Les points de terminaison loopback tels que `127.0.0.1` sont approuvés automatiquement ; les points de terminaison LAN, tailnet et DNS privé nécessitent toujours `request.allowPrivateNetwork: true`.

La valeur `models.providers.<id>.models[].id` est locale au provider. N’incluez pas le préfixe du provider à cet endroit. Par exemple, un serveur MLX démarré avec `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` doit utiliser cet ID de catalogue et cette référence de modèle :

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Définissez `input: ["text", "image"]` sur les modèles de vision locaux ou proxifiés afin que les pièces jointes image soient injectées dans les tours d’agent. L’onboarding interactif de provider personnalisé déduit les ID courants de modèles de vision et ne pose de questions que pour les noms inconnus. L’onboarding non interactif utilise la même inférence ; utilisez `--custom-image-input` pour les ID de vision inconnus ou `--custom-text-input` lorsqu’un modèle qui ressemble à un modèle connu est uniquement texte derrière votre point de terminaison.

Gardez `models.mode: "merge"` pour que les modèles hébergés restent disponibles comme replis. Utilisez `models.providers.<id>.timeoutSeconds` pour les serveurs de modèles locaux ou distants lents avant d’augmenter `agents.defaults.timeoutSeconds`. Le délai d’expiration du provider s’applique uniquement aux requêtes HTTP de modèle, y compris la connexion, les en-têtes, le streaming du corps et l’abandon total du fetch protégé.

<Note>
Pour les providers personnalisés compatibles OpenAI, la persistance d’un marqueur local non secret tel que `apiKey: "ollama-local"` est acceptée lorsque `baseUrl` se résout en loopback, LAN privé, `.local` ou nom d’hôte nu. OpenClaw le traite comme un identifiant local valide au lieu de signaler une clé manquante. Utilisez une vraie valeur pour tout provider qui accepte un nom d’hôte public.
</Note>

Note de comportement pour les backends `/v1` locaux/proxifiés :

- OpenClaw les traite comme des routes compatibles OpenAI de style proxy, pas comme des points de terminaison OpenAI natifs
- la mise en forme des requêtes propre à OpenAI natif ne s’applique pas ici : pas de `service_tier`, pas de `store` Responses, pas de mise en forme de payload compatible avec le raisonnement OpenAI, et pas d’indications de cache de prompt
- les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) ne sont pas injectés sur ces URL de proxy personnalisées

Notes de compatibilité pour les backends compatibles OpenAI plus stricts :

- Certains serveurs n’acceptent que des `messages[].content` sous forme de chaîne sur Chat Completions, et non des tableaux structurés de parties de contenu. Définissez `models.providers.<provider>.models[].compat.requiresStringContent: true` pour ces points de terminaison.
- Certains modèles locaux émettent des demandes d’outils autonomes entre crochets sous forme de texte, comme `[tool_name]` suivi de JSON et `[END_TOOL_REQUEST]`. OpenClaw les promeut en vrais appels d’outils uniquement lorsque le nom correspond exactement à un outil enregistré pour le tour ; sinon, le bloc est traité comme du texte non pris en charge et masqué des réponses visibles par l’utilisateur.
- Si un modèle émet du JSON, du XML ou du texte de style ReAct qui ressemble à un appel d’outil mais que le provider n’a pas émis d’invocation structurée, OpenClaw le laisse sous forme de texte et journalise un avertissement avec l’ID d’exécution, le provider/modèle, le motif détecté et le nom de l’outil lorsqu’il est disponible. Traitez cela comme une incompatibilité d’appel d’outil du provider/modèle, et non comme une exécution d’outil terminée.
- Si les outils apparaissent comme du texte assistant au lieu de s’exécuter, par exemple JSON brut, XML, syntaxe ReAct ou un tableau `tool_calls` vide dans la réponse du provider, vérifiez d’abord que le serveur utilise un modèle/parser de chat compatible avec les appels d’outils. Pour les backends Chat Completions compatibles OpenAI dont le parser ne fonctionne que lorsque l’utilisation d’outils est forcée, définissez un override de requête par modèle au lieu de vous fier à l’analyse du texte :

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

  Utilisez cela uniquement pour les modèles/sessions où chaque tour normal doit appeler un outil. Cela remplace la valeur proxy par défaut d’OpenClaw, `tool_choice: "auto"`. Remplacez `local/my-local-model` par la référence provider/modèle exacte affichée par `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Si un modèle personnalisé compatible OpenAI accepte des efforts de raisonnement OpenAI au-delà du profil intégré, déclarez-les dans le bloc compat du modèle. Ajouter `"xhigh"` ici rend le niveau disponible pour `/think xhigh`, les sélecteurs de session, la validation Gateway et la validation `llm-task` pour cette référence provider/modèle configurée :

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

- Certains backends locaux plus petits ou plus stricts sont instables avec la forme complète du prompt d’exécution d’agent d’OpenClaw, surtout lorsque les schémas d’outils sont inclus. Vérifiez d’abord le chemin provider avec la sonde locale légère :

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Pour vérifier la route Gateway sans la forme complète du prompt d’agent, utilisez plutôt la sonde de modèle Gateway :

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Les sondes de modèle locales et Gateway envoient uniquement le prompt fourni. La sonde Gateway valide tout de même le routage Gateway, l’authentification et la sélection du provider, mais elle ignore intentionnellement le transcript de session précédent, le contexte AGENTS/bootstrap, l’assemblage du moteur de contexte, les outils et les serveurs MCP intégrés.

  Si cela réussit mais que les tours d’agent OpenClaw normaux échouent, essayez d’abord
  `agents.defaults.experimental.localModelLean: true` pour retirer les outils par
  défaut lourds comme `browser`, `cron` et `message` ; il s’agit d’un indicateur
  expérimental, pas d’un paramètre stable de mode par défaut. Consultez
  [Fonctionnalités expérimentales](/fr/concepts/experimental-features). Si cela échoue encore, essayez
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Si le backend échoue encore uniquement lors d’exécutions OpenClaw plus volumineuses, le problème restant
  vient généralement de la capacité du modèle/serveur en amont ou d’un bug du backend, et non de la
  couche de transport d’OpenClaw.

## Dépannage

- Le Gateway peut-il atteindre le proxy ? `curl http://127.0.0.1:1234/v1/models`.
- Modèle LM Studio déchargé ? Rechargez-le ; le démarrage à froid est une cause fréquente de “blocage”.
- Le serveur local indique `terminated`, `ECONNRESET`, ou ferme-t-il le flux en plein tour ?
  OpenClaw enregistre un `model.call.error.failureKind` à faible cardinalité ainsi que l’instantané
  RSS/tas du processus OpenClaw dans les diagnostics. Pour la pression mémoire LM Studio/Ollama,
  faites correspondre cet horodatage avec le journal du serveur ou le journal de plantage /
  jetsam de macOS afin de confirmer si le serveur de modèle a été tué.
- OpenClaw avertit lorsque la fenêtre de contexte détectée est inférieure à **32k** et bloque en dessous de **16k**. Si vous rencontrez cette vérification préalable, augmentez la limite de contexte du serveur/modèle ou choisissez un modèle plus grand.
- Erreurs de contexte ? Réduisez `contextWindow` ou augmentez la limite de votre serveur.
- Le serveur compatible OpenAI renvoie `messages[].content ... expected a string` ?
  Ajoutez `compat.requiresStringContent: true` à cette entrée de modèle.
- Les petits appels directs à `/v1/chat/completions` fonctionnent, mais `openclaw infer model run --local`
  échoue sur Gemma ou un autre modèle local ? Vérifiez d’abord l’URL du fournisseur, la référence du modèle, le marqueur
  d’authentification et les journaux du serveur ; `model run` local n’inclut pas les outils d’agent.
  Si `model run` local réussit mais que les tours d’agent plus volumineux échouent, réduisez la surface
  d’outils de l’agent avec `localModelLean` ou `compat.supportsTools: false`.
- Les appels d’outils apparaissent sous forme de texte JSON/XML/ReAct brut, ou le fournisseur renvoie-t-il un
  tableau `tool_calls` vide ? N’ajoutez pas de proxy qui convertit aveuglément le texte de l’assistant
  en exécution d’outil. Corrigez d’abord le modèle/parser de chat du serveur. Si le
  modèle ne fonctionne que lorsque l’utilisation d’outils est forcée, ajoutez la surcharge par modèle
  `params.extra_body.tool_choice: "required"` ci-dessus et utilisez cette entrée de modèle
  uniquement pour les sessions où un appel d’outil est attendu à chaque tour.
- Sécurité : les modèles locaux contournent les filtres côté fournisseur ; gardez les agents ciblés et la Compaction activée pour limiter le rayon d’impact des injections de prompt.

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Basculement de modèle](/fr/concepts/model-failover)
