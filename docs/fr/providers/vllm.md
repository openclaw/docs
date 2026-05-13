---
read_when:
    - Vous voulez exécuter OpenClaw avec un serveur vLLM local
    - Vous souhaitez des points de terminaison /v1 compatibles avec OpenAI pour vos propres modèles
summary: Exécuter OpenClaw avec vLLM (serveur local compatible OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:33:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM peut servir des modèles open source (et certains modèles personnalisés) via une API HTTP **compatible OpenAI**. OpenClaw se connecte à vLLM avec l’API `openai-completions`.

OpenClaw peut aussi **détecter automatiquement** les modèles disponibles depuis vLLM lorsque vous l’activez avec `VLLM_API_KEY` (n’importe quelle valeur fonctionne si votre serveur n’impose pas l’authentification). Utilisez `vllm/*` dans `agents.defaults.models` pour conserver une découverte dynamique lorsque vous configurez aussi une URL de base vLLM personnalisée.

OpenClaw traite `vllm` comme un fournisseur local compatible OpenAI qui prend en charge
la comptabilisation de l’utilisation en streaming, afin que les nombres de tokens de statut/contexte puissent être mis à jour à partir des réponses
`stream_options.include_usage`.

| Propriété        | Valeur                                   |
| ---------------- | ---------------------------------------- |
| ID du fournisseur | `vllm`                                  |
| API              | `openai-completions` (compatible OpenAI) |
| Auth             | variable d’environnement `VLLM_API_KEY`  |
| URL de base par défaut | `http://127.0.0.1:8000/v1`        |

## Premiers pas

<Steps>
  <Step title="Démarrer vLLM avec un serveur compatible OpenAI">
    Votre URL de base doit exposer des points de terminaison `/v1` (par exemple `/v1/models`, `/v1/chat/completions`). vLLM s’exécute généralement sur :

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Définir la variable d’environnement de clé API">
    N’importe quelle valeur fonctionne si votre serveur n’impose pas l’authentification :

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Sélectionner un modèle">
    Remplacez par l’un de vos ID de modèle vLLM :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Découverte de modèles (fournisseur implicite)

Lorsque `VLLM_API_KEY` est défini (ou qu’un profil d’authentification existe) et que vous **ne** définissez pas `models.providers.vllm`, OpenClaw interroge :

```
GET http://127.0.0.1:8000/v1/models
```

et convertit les ID renvoyés en entrées de modèle.

<Note>
Si vous définissez explicitement `models.providers.vllm`, OpenClaw utilise vos modèles déclarés par défaut. Ajoutez `"vllm/*": {}` à `agents.defaults.models` lorsque vous voulez qu’OpenClaw interroge le point de terminaison `/models` de ce fournisseur configuré et inclue tous les modèles vLLM annoncés.
</Note>

## Configuration explicite (modèles manuels)

Utilisez une configuration explicite lorsque :

- vLLM s’exécute sur un hôte ou un port différent
- Vous voulez fixer les valeurs `contextWindow` ou `maxTokens`
- Votre serveur exige une vraie clé API (ou vous voulez contrôler les en-têtes)
- Vous vous connectez à un point de terminaison vLLM de confiance en loopback, LAN ou Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Facultatif : étendre le délai d’expiration de connexion/en-têtes/corps/requête pour les modèles locaux lents
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

Pour conserver ce fournisseur dynamique sans lister manuellement chaque modèle, ajoutez un
joker de fournisseur au catalogue de modèles visible :

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement de type proxy">
    vLLM est traité comme un backend `/v1` compatible OpenAI de type proxy, et non comme un point de terminaison
    OpenAI natif. Cela signifie :

    | Comportement | Appliqué ? |
    |----------|----------|
    | Mise en forme des requêtes OpenAI natives | Non |
    | `service_tier` | Non envoyé |
    | `store` Responses | Non envoyé |
    | Indications de cache de prompt | Non envoyées |
    | Mise en forme de payload compatible avec le raisonnement OpenAI | Non appliquée |
    | En-têtes d’attribution OpenClaw masqués | Non injectés sur les URL de base personnalisées |

  </Accordion>

  <Accordion title="Contrôles de réflexion Qwen">
    Pour les modèles Qwen servis via vLLM, définissez
    `params.qwenThinkingFormat: "chat-template"` sur l’entrée de modèle lorsque le
    serveur attend des kwargs de gabarit de chat Qwen. OpenClaw mappe `/think off` vers :

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Les niveaux de réflexion autres que `off` envoient `enable_thinking: true`. Si votre point de terminaison
    attend plutôt des indicateurs de premier niveau de style DashScope, utilisez
    `params.qwenThinkingFormat: "top-level"` pour envoyer `enable_thinking` à la
    racine de la requête. La forme snake case `params.qwen_thinking_format` est aussi acceptée.

  </Accordion>

  <Accordion title="Contrôles de réflexion Nemotron 3">
    vLLM/Nemotron 3 peut utiliser des kwargs de gabarit de chat pour contrôler si le raisonnement est
    renvoyé comme raisonnement masqué ou comme texte de réponse visible. Lorsqu’une session OpenClaw
    utilise `vllm/nemotron-3-*` avec la réflexion désactivée, le Plugin vLLM intégré envoie :

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Pour personnaliser ces valeurs, définissez `chat_template_kwargs` sous les paramètres du modèle.
    Si vous définissez aussi `params.extra_body.chat_template_kwargs`, cette valeur a
    la priorité finale, car `extra_body` est le dernier remplacement du corps de requête.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Les appels d’outils Qwen apparaissent comme du texte">
    Assurez-vous d’abord que vLLM a été démarré avec le bon analyseur d’appels d’outils et le bon gabarit de chat
    pour le modèle. Par exemple, vLLM documente `hermes` pour les modèles Qwen2.5
    et `qwen3_xml` pour les modèles Qwen3-Coder.

    Symptômes :

    - les Skills ou outils ne s’exécutent jamais
    - l’assistant imprime du JSON/XML brut comme `{"name":"read","arguments":...}`
    - vLLM renvoie un tableau `tool_calls` vide lorsque OpenClaw envoie
      `tool_choice: "auto"`

    Certaines combinaisons Qwen/vLLM renvoient des appels d’outils structurés uniquement lorsque la
    requête utilise `tool_choice: "required"`. Pour ces entrées de modèle, forcez le
    champ de requête compatible OpenAI avec `params.extra_body` :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
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

    Remplacez `Qwen-Qwen2.5-Coder-32B-Instruct` par l’ID exact renvoyé par :

    ```bash
    openclaw models list --provider vllm
    ```

    Vous pouvez appliquer le même remplacement depuis la CLI :

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Il s’agit d’un contournement de compatibilité opt-in. Il impose à chaque tour de modèle avec
    des outils d’exiger un appel d’outil ; utilisez-le donc uniquement pour une entrée de modèle local dédiée
    où ce comportement est acceptable. Ne l’utilisez pas comme valeur par défaut globale pour tous les
    modèles vLLM, et n’utilisez pas un proxy qui convertit aveuglément du texte
    arbitraire de l’assistant en appels d’outils exécutables.

  </Accordion>

  <Accordion title="URL de base personnalisée">
    Si votre serveur vLLM s’exécute sur un hôte ou un port non par défaut, définissez `baseUrl` dans la configuration explicite du fournisseur :

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Première réponse lente ou délai d’expiration du serveur distant">
    Pour les grands modèles locaux, les hôtes LAN distants ou les liens tailnet, définissez un
    délai d’expiration des requêtes limité au fournisseur :

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` s’applique uniquement aux requêtes HTTP de modèles vLLM, y compris
    l’établissement de la connexion, les en-têtes de réponse, le streaming du corps et l’abandon
    guarded-fetch total. Préférez cela avant d’augmenter
    `agents.defaults.timeoutSeconds`, qui contrôle toute l’exécution de l’agent.

  </Accordion>

  <Accordion title="Serveur inaccessible">
    Vérifiez que le serveur vLLM est en cours d’exécution et accessible :

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si vous voyez une erreur de connexion, vérifiez l’hôte, le port et que vLLM a démarré en mode serveur compatible OpenAI.
    Pour les points de terminaison explicites en loopback, LAN ou Tailscale, définissez aussi
    `models.providers.vllm.request.allowPrivateNetwork: true` ; les requêtes de fournisseur
    bloquent les URL de réseau privé par défaut, sauf si le fournisseur est
    explicitement approuvé.

  </Accordion>

  <Accordion title="Erreurs d’authentification sur les requêtes">
    Si les requêtes échouent avec des erreurs d’authentification, définissez une vraie `VLLM_API_KEY` qui correspond à la configuration de votre serveur, ou configurez explicitement le fournisseur sous `models.providers.vllm`.

    <Tip>
    Si votre serveur vLLM n’impose pas l’authentification, toute valeur non vide pour `VLLM_API_KEY` fonctionne comme signal opt-in pour OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Aucun modèle découvert">
    La découverte automatique exige que `VLLM_API_KEY` soit définie. Si vous avez défini `models.providers.vllm`, OpenClaw utilise uniquement vos modèles déclarés, sauf si `agents.defaults.models` inclut `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Les outils s’affichent comme du texte brut">
    Si un modèle Qwen imprime une syntaxe d’outil JSON/XML au lieu d’exécuter une skill,
    consultez les recommandations Qwen dans la configuration avancée ci-dessus. La correction habituelle consiste à :

    - démarrer vLLM avec l’analyseur/le gabarit correct pour ce modèle
    - confirmer l’ID exact du modèle avec `openclaw models list --provider vllm`
    - ajouter un remplacement `params.extra_body.tool_choice: "required"` dédié par modèle
      uniquement si `tool_choice: "auto"` renvoie toujours des appels d’outils vides ou uniquement textuels

  </Accordion>
</AccordionGroup>

<Warning>
Plus d’aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Warning>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="OpenAI" href="/fr/providers/openai" icon="bolt">
    Fournisseur OpenAI natif et comportement des routes compatibles OpenAI.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et comment les résoudre.
  </Card>
</CardGroup>
