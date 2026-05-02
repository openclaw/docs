---
read_when:
    - Vous voulez servir des modèles depuis votre propre machine avec GPU
    - Vous configurez LM Studio ou un proxy compatible avec OpenAI
    - Vous avez besoin des recommandations les plus sûres pour les modèles locaux
summary: Exécuter OpenClaw sur des LLM locaux (LM Studio, vLLM, LiteLLM, points de terminaison OpenAI personnalisés)
title: Modèles locaux
x-i18n:
    generated_at: "2026-05-02T22:18:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

Les modèles locaux sont utilisables. Ils exigent aussi davantage du matériel, de la taille de contexte et de la défense contre les injections de prompt : les cartes petites ou fortement quantifiées tronquent le contexte et affaiblissent la sécurité. Cette page est le guide assumé pour les piles locales haut de gamme et les serveurs locaux personnalisés compatibles OpenAI. Pour une intégration avec le moins de friction possible, commencez par [LM Studio](/fr/providers/lmstudio) ou [Ollama](/fr/providers/ollama) et `openclaw onboard`.

## Configuration matérielle minimale

Visez haut : **≥2 Mac Studios au maximum de leur configuration ou une machine GPU équivalente (~30 000 $+)** pour une boucle agent confortable. Un seul GPU de **24 Go** ne convient qu’aux prompts plus légers, avec une latence plus élevée. Exécutez toujours la **variante la plus grande / complète que vous puissiez héberger** ; les checkpoints petits ou fortement quantifiés augmentent le risque d’injection de prompt (voir [Sécurité](/fr/gateway/security)).

## Choisir un backend

| Backend                                              | À utiliser quand                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| [LM Studio](/fr/providers/lmstudio)                     | Première configuration locale, chargeur avec GUI, API Responses native     |
| [Ollama](/fr/providers/ollama)                          | Flux de travail CLI, bibliothèque de modèles, service systemd autonome     |
| MLX / vLLM / SGLang                                  | Service auto-hébergé à haut débit avec endpoint HTTP compatible OpenAI     |
| LiteLLM / OAI-proxy / proxy personnalisé compatible OpenAI | Vous exposez une autre API de modèle et avez besoin qu’OpenClaw la traite comme OpenAI |

Utilisez l’API Responses (`api: "openai-responses"`) quand le backend la prend en charge (c’est le cas de LM Studio). Sinon, restez sur Chat Completions (`api: "openai-completions"`).

<Warning>
**Utilisateurs WSL2 + Ollama + NVIDIA/CUDA :** l’installeur Linux officiel d’Ollama active un service systemd avec `Restart=always`. Sur les configurations GPU WSL2, le démarrage automatique peut recharger le dernier modèle au démarrage et monopoliser la mémoire de l’hôte. Si votre VM WSL2 redémarre en boucle après l’activation d’Ollama, consultez [boucle de crash WSL2](/fr/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Recommandé : LM Studio + grand modèle local (API Responses)

Meilleure pile locale actuelle. Chargez un grand modèle dans LM Studio (par exemple une version complète de Qwen, DeepSeek ou Llama), activez le serveur local (`http://127.0.0.1:1234` par défaut) et utilisez l’API Responses pour garder le raisonnement séparé du texte final.

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

**Checklist de configuration**

- Installez LM Studio : [https://lmstudio.ai](https://lmstudio.ai)
- Dans LM Studio, téléchargez la **plus grande version de modèle disponible** (évitez les variantes « small »/fortement quantifiées), démarrez le serveur, puis confirmez que `http://127.0.0.1:1234/v1/models` l’affiche.
- Remplacez `my-local-model` par l’ID de modèle réel affiché dans LM Studio.
- Gardez le modèle chargé ; un chargement à froid ajoute de la latence au démarrage.
- Ajustez `contextWindow`/`maxTokens` si votre version de LM Studio diffère.
- Pour WhatsApp, restez sur l’API Responses afin que seul le texte final soit envoyé.

Conservez les modèles hébergés configurés même lorsque vous exécutez en local ; utilisez `models.mode: "merge"` pour que les solutions de repli restent disponibles.

### Configuration hybride : modèle hébergé principal, repli local

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

Inversez l’ordre du modèle principal et des modèles de repli ; conservez le même bloc de fournisseurs et `models.mode: "merge"` afin de pouvoir revenir à Sonnet ou Opus quand la machine locale est indisponible.

### Hébergement régional / routage des données

- Des variantes MiniMax/Kimi/GLM hébergées existent aussi sur OpenRouter avec des endpoints associés à une région (par exemple hébergés aux États-Unis). Choisissez-y la variante régionale pour garder le trafic dans la juridiction choisie tout en utilisant `models.mode: "merge"` pour les replis Anthropic/OpenAI.
- Le local uniquement reste la meilleure voie pour la confidentialité ; le routage régional hébergé est le compromis quand vous avez besoin des fonctionnalités d’un fournisseur tout en voulant contrôler le flux des données.

## Autres proxys locaux compatibles OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy ou des gateways personnalisés
fonctionnent s’ils exposent un endpoint `/v1/chat/completions` au style OpenAI.
Utilisez l’adaptateur Chat Completions sauf si le backend documente explicitement
la prise en charge de `/v1/responses`. Remplacez le bloc de fournisseur ci-dessus
par votre endpoint et votre ID de modèle :

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

Si `api` est omis sur un fournisseur personnalisé avec un `baseUrl`, OpenClaw utilise
`openai-completions` par défaut. Les endpoints de loopback comme `127.0.0.1` sont approuvés
automatiquement ; les endpoints LAN, tailnet et DNS privés nécessitent tout de même
`request.allowPrivateNetwork: true`.

La valeur `models.providers.<id>.models[].id` est locale au fournisseur. N’incluez pas
le préfixe du fournisseur à cet endroit. Par exemple, un serveur MLX démarré avec
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` doit utiliser cet
ID de catalogue et cette référence de modèle :

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Définissez `input: ["text", "image"]` sur les modèles vision locaux ou proxifiés afin que les
pièces jointes d’image soient injectées dans les tours de l’agent. L’intégration interactive
des fournisseurs personnalisés déduit les ID de modèles vision courants et ne demande que les noms inconnus.
L’intégration non interactive utilise la même déduction ; utilisez `--custom-image-input`
pour les ID vision inconnus ou `--custom-text-input` quand un modèle qui semble connu est
texte uniquement derrière votre endpoint.

Conservez `models.mode: "merge"` afin que les modèles hébergés restent disponibles comme replis.
Utilisez `models.providers.<id>.timeoutSeconds` pour les serveurs de modèles locaux ou distants
lents avant d’augmenter `agents.defaults.timeoutSeconds`. Le délai d’attente du fournisseur
s’applique uniquement aux requêtes HTTP de modèle, y compris la connexion, les en-têtes, le streaming du corps
et l’abandon total du fetch protégé.

<Note>
Pour les fournisseurs personnalisés compatibles OpenAI, la persistance d’un marqueur local non secret comme `apiKey: "ollama-local"` est acceptée quand `baseUrl` se résout vers le loopback, un LAN privé, `.local` ou un nom d’hôte nu. OpenClaw le traite comme un identifiant local valide au lieu de signaler une clé manquante. Utilisez une vraie valeur pour tout fournisseur qui accepte un nom d’hôte public.
</Note>

Note de comportement pour les backends `/v1` locaux/proxifiés :

- OpenClaw les traite comme des routes compatibles OpenAI de type proxy, et non comme des
  endpoints OpenAI natifs
- la mise en forme des requêtes propre à OpenAI natif ne s’applique pas ici : pas de
  `service_tier`, pas de `store` Responses, pas de mise en forme de payload
  compatible avec le raisonnement OpenAI et pas d’indices de cache de prompt
- les en-têtes d’attribution OpenClaw cachés (`originator`, `version`, `User-Agent`)
  ne sont pas injectés sur ces URL de proxy personnalisées

Notes de compatibilité pour les backends compatibles OpenAI plus stricts :

- Certains serveurs acceptent uniquement `messages[].content` sous forme de chaîne sur Chat Completions, et non
  des tableaux structurés de parties de contenu. Définissez
  `models.providers.<provider>.models[].compat.requiresStringContent: true` pour
  ces endpoints.
- Certains modèles locaux émettent des requêtes d’outil autonomes entre crochets sous forme de texte, comme
  `[tool_name]` suivi de JSON et de `[END_TOOL_REQUEST]`. OpenClaw les promeut
  en véritables appels d’outils uniquement quand le nom correspond exactement à un outil enregistré
  pour le tour ; sinon, le bloc est traité comme du texte non pris en charge et est
  masqué des réponses visibles par l’utilisateur.
- Si un modèle émet du JSON, du XML ou du texte de style ReAct qui ressemble à un appel d’outil
  mais que le fournisseur n’a pas émis d’invocation structurée, OpenClaw le laisse comme
  texte et journalise un avertissement avec l’ID d’exécution, le fournisseur/modèle, le motif détecté et
  le nom de l’outil lorsqu’il est disponible. Traitez cela comme une incompatibilité d’appel d’outil
  du fournisseur/modèle, et non comme une exécution d’outil terminée.
- Si les outils apparaissent comme du texte assistant au lieu de s’exécuter, par exemple du JSON brut,
  du XML, une syntaxe ReAct ou un tableau `tool_calls` vide dans la réponse du fournisseur,
  vérifiez d’abord que le serveur utilise un modèle/parser de chat capable d’appels d’outils. Pour
  les backends Chat Completions compatibles OpenAI dont le parser ne fonctionne que lorsque l’utilisation
  d’outils est forcée, définissez une surcharge de requête par modèle au lieu de vous reposer sur le
  parsing de texte :

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

  Utilisez cela uniquement pour les modèles/sessions où chaque tour normal doit appeler un outil.
  Cela remplace la valeur proxy par défaut d’OpenClaw, `tool_choice: "auto"`.
  Remplacez `local/my-local-model` par la référence fournisseur/modèle exacte affichée par
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Si un modèle personnalisé compatible OpenAI accepte des niveaux d’effort de raisonnement OpenAI au-delà
  du profil intégré, déclarez-les sur le bloc de compatibilité du modèle. Ajouter `"xhigh"`
  ici permet à `/think xhigh`, aux sélecteurs de session, à la validation du Gateway et à la validation `llm-task`
  d’exposer ce niveau pour la référence fournisseur/modèle configurée :

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

Si le modèle se charge correctement mais que les tours complets de l’agent se comportent mal, procédez de haut en bas : confirmez d’abord le transport, puis réduisez la surface.

1. **Confirmez que le modèle local lui-même répond.** Aucun outil, aucun contexte d’agent :

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Confirmez le routage du Gateway.** Envoie uniquement le prompt fourni — ignore la transcription, l’amorçage AGENTS, l’assemblage du moteur de contexte, les outils et les serveurs MCP intégrés, mais exerce tout de même le routage du Gateway, l’authentification et la sélection du fournisseur :

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Essayez le mode allégé.** Si les deux sondes réussissent mais que les vrais tours d’agent échouent avec des appels d’outils mal formés ou des prompts surdimensionnés, activez `agents.defaults.experimental.localModelLean: true`. Cela retire les trois outils par défaut les plus lourds (`browser`, `cron`, `message`) afin que la forme du prompt soit plus petite et moins fragile. Consultez [Fonctionnalités expérimentales → Mode allégé pour modèle local](/fr/concepts/experimental-features#local-model-lean-mode) pour l’explication complète, savoir quand l’utiliser et comment confirmer qu’il est activé.

4. **Désactivez entièrement les outils en dernier recours.** Si le mode allégé ne suffit pas, définissez `models.providers.<provider>.models[].compat.supportsTools: false` pour cette entrée de modèle. L’agent fonctionnera alors sans appels d’outils sur ce modèle.

5. **Au-delà, le goulot d’étranglement est en amont.** Si le backend échoue encore uniquement sur des exécutions OpenClaw plus volumineuses après le mode allégé et `supportsTools: false`, le problème restant vient généralement du modèle ou de la capacité du serveur en amont — fenêtre de contexte, mémoire GPU, éviction du kv-cache ou bug du backend. À ce stade, il ne s’agit pas de la couche de transport d’OpenClaw.

## Dépannage

- Le Gateway peut-il atteindre le proxy ? `curl http://127.0.0.1:1234/v1/models`.
- Modèle LM Studio déchargé ? Rechargez-le ; le démarrage à froid est une cause fréquente de « blocage ».
- Le serveur local indique `terminated`, `ECONNRESET` ou ferme le flux au milieu du tour ?
  OpenClaw enregistre dans les diagnostics un `model.call.error.failureKind` à faible cardinalité ainsi que l’instantané RSS/tas du processus OpenClaw. En cas de pression mémoire avec LM Studio/Ollama, comparez cet horodatage au journal du serveur ou au journal de crash / jetsam macOS pour confirmer si le serveur de modèle a été tué.
- OpenClaw déduit les seuils de précontrôle de la fenêtre de contexte à partir de la fenêtre de modèle détectée, ou de la fenêtre de modèle non plafonnée lorsque `agents.defaults.contextTokens` abaisse la fenêtre effective. Il avertit sous 20 % avec un plancher de **8k**. Les blocages stricts utilisent le seuil de 10 % avec un plancher de **4k**, plafonné à la fenêtre de contexte effective afin que des métadonnées de modèle surdimensionnées ne puissent pas rejeter un plafond utilisateur par ailleurs valide. Si vous atteignez ce précontrôle, augmentez la limite de contexte du serveur/modèle ou choisissez un modèle plus grand.
- Erreurs de contexte ? Réduisez `contextWindow` ou augmentez votre limite serveur.
- Un serveur compatible OpenAI renvoie `messages[].content ... expected a string` ?
  Ajoutez `compat.requiresStringContent: true` à cette entrée de modèle.
- Les appels directs minuscules à `/v1/chat/completions` fonctionnent, mais `openclaw infer model run --local`
  échoue sur Gemma ou un autre modèle local ? Vérifiez d’abord l’URL du fournisseur, la référence du modèle, le marqueur d’authentification et les journaux du serveur ; `model run` local n’inclut pas les outils d’agent. Si `model run` local réussit mais que des tours d’agent plus volumineux échouent, réduisez la surface d’outils de l’agent avec `localModelLean` ou `compat.supportsTools: false`.
- Les appels d’outils apparaissent sous forme de texte JSON/XML/ReAct brut, ou le fournisseur renvoie un tableau `tool_calls` vide ? N’ajoutez pas de proxy qui convertit aveuglément le texte de l’assistant en exécution d’outil. Corrigez d’abord le modèle de chat/parser du serveur. Si le modèle fonctionne uniquement quand l’utilisation d’outils est forcée, ajoutez la surcharge par modèle `params.extra_body.tool_choice: "required"` ci-dessus et utilisez cette entrée de modèle uniquement pour les sessions où un appel d’outil est attendu à chaque tour.
- Sécurité : les modèles locaux ignorent les filtres côté fournisseur ; gardez les agents ciblés et la Compaction activée afin de limiter le rayon d’impact des injections de prompt.

## Associés

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Basculement de modèle](/fr/concepts/model-failover)
