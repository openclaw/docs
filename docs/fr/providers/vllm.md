---
read_when:
    - Vous souhaitez exécuter OpenClaw avec un serveur vLLM local
    - Vous souhaitez des points de terminaison /v1 compatibles avec OpenAI pour vos propres modèles
summary: Exécuter OpenClaw avec vLLM (serveur local compatible avec OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T07:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM peut servir des modèles open source (et certains modèles personnalisés) via une API HTTP **compatible OpenAI**. OpenClaw se connecte à vLLM avec l’API `openai-completions`.

OpenClaw peut aussi **découvrir automatiquement** les modèles disponibles depuis vLLM lorsque vous l’activez avec `VLLM_API_KEY` (n’importe quelle valeur fonctionne si votre serveur n’impose pas l’authentification) et que vous ne définissez pas d’entrée explicite `models.providers.vllm`.

OpenClaw traite `vllm` comme un fournisseur local compatible OpenAI qui prend en charge la comptabilisation de l’utilisation en streaming, afin que les décomptes de jetons d’état/contexte puissent être mis à jour à partir des réponses `stream_options.include_usage`.

| Propriété          | Valeur                                      |
| ------------------ | ------------------------------------------- |
| ID du fournisseur  | `vllm`                                      |
| API                | `openai-completions` (compatible OpenAI)    |
| Authentification   | variable d’environnement `VLLM_API_KEY`     |
| URL de base par défaut | `http://127.0.0.1:8000/v1`              |

## Bien démarrer

<Steps>
  <Step title="Démarrer vLLM avec un serveur compatible OpenAI">
    Votre URL de base doit exposer des points de terminaison `/v1` (par exemple `/v1/models`, `/v1/chat/completions`). vLLM s’exécute couramment sur :

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
Si vous définissez explicitement `models.providers.vllm`, la découverte automatique est ignorée et vous devez définir les modèles manuellement.
</Note>

## Configuration explicite (modèles manuels)

Utilisez une configuration explicite lorsque :

- vLLM s’exécute sur un autre hôte ou port
- Vous voulez fixer les valeurs `contextWindow` ou `maxTokens`
- Votre serveur exige une vraie clé API (ou vous voulez contrôler les en-têtes)
- Vous vous connectez à un point de terminaison vLLM de local loopback, de LAN ou de Tailscale fiable

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement de type proxy">
    vLLM est traité comme un backend `/v1` compatible OpenAI de type proxy, et non comme un point de terminaison OpenAI natif. Cela signifie :

    | Comportement | Appliqué ? |
    |----------|----------|
    | Mise en forme des requêtes OpenAI natives | Non |
    | `service_tier` | Non envoyé |
    | `store` des réponses | Non envoyé |
    | Indices de cache de prompt | Non envoyés |
    | Mise en forme de payload compatible avec le raisonnement OpenAI | Non appliquée |
    | En-têtes d’attribution OpenClaw masqués | Non injectés sur les URL de base personnalisées |

  </Accordion>

  <Accordion title="Contrôles de réflexion Qwen">
    Pour les modèles Qwen servis via vLLM, définissez `params.qwenThinkingFormat: "chat-template"` sur l’entrée du modèle lorsque le serveur attend des kwargs de modèle de discussion Qwen. OpenClaw mappe `/think off` vers :

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Les niveaux de réflexion autres que `off` envoient `enable_thinking: true`. Si votre point de terminaison attend plutôt des indicateurs de niveau supérieur de style DashScope, utilisez `params.qwenThinkingFormat: "top-level"` pour envoyer `enable_thinking` à la racine de la requête. La forme snake-case `params.qwen_thinking_format` est également acceptée.

  </Accordion>

  <Accordion title="Contrôles de réflexion Nemotron 3">
    vLLM/Nemotron 3 peut utiliser des kwargs de modèle de discussion pour contrôler si le raisonnement est renvoyé comme raisonnement masqué ou comme texte de réponse visible. Lorsqu’une session OpenClaw utilise `vllm/nemotron-3-*` avec la réflexion désactivée, le Plugin vLLM fourni envoie :

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Pour personnaliser ces valeurs, définissez `chat_template_kwargs` sous les paramètres du modèle. Si vous définissez également `params.extra_body.chat_template_kwargs`, cette valeur a la priorité finale car `extra_body` est la dernière surcharge du corps de requête.

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
    Assurez-vous d’abord que vLLM a été démarré avec le bon analyseur d’appels d’outils et le bon modèle de discussion pour le modèle. Par exemple, vLLM documente `hermes` pour les modèles Qwen2.5 et `qwen3_xml` pour les modèles Qwen3-Coder.

    Symptômes :

    - les Skills ou outils ne s’exécutent jamais
    - l’assistant affiche du JSON/XML brut comme `{"name":"read","arguments":...}`
    - vLLM renvoie un tableau `tool_calls` vide lorsque OpenClaw envoie `tool_choice: "auto"`

    Certaines combinaisons Qwen/vLLM renvoient des appels d’outils structurés uniquement lorsque la requête utilise `tool_choice: "required"`. Pour ces entrées de modèle, forcez le champ de requête compatible OpenAI avec `params.extra_body` :

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

    Vous pouvez appliquer la même surcharge depuis la CLI :

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Il s’agit d’une solution de compatibilité à activer explicitement. Elle impose un appel d’outil à chaque tour de modèle avec des outils ; utilisez-la donc uniquement pour une entrée de modèle local dédiée où ce comportement est acceptable. Ne l’utilisez pas comme valeur par défaut globale pour tous les modèles vLLM, et n’utilisez pas de proxy qui convertit aveuglément du texte d’assistant arbitraire en appels d’outils exécutables.

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
  <Accordion title="Première réponse lente ou expiration du délai du serveur distant">
    Pour les grands modèles locaux, les hôtes LAN distants ou les liens tailnet, définissez un délai de requête limité au fournisseur :

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

    `timeoutSeconds` s’applique uniquement aux requêtes HTTP de modèles vLLM, y compris l’établissement de la connexion, les en-têtes de réponse, le streaming du corps et l’abandon total de guarded-fetch. Préférez cette option avant d’augmenter `agents.defaults.timeoutSeconds`, qui contrôle toute l’exécution de l’agent.

  </Accordion>

  <Accordion title="Serveur inaccessible">
    Vérifiez que le serveur vLLM est en cours d’exécution et accessible :

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si vous voyez une erreur de connexion, vérifiez l’hôte, le port, et que vLLM a démarré avec le mode serveur compatible OpenAI.
    Pour les points de terminaison explicites de local loopback, LAN ou Tailscale, définissez aussi `models.providers.vllm.request.allowPrivateNetwork: true` ; les requêtes de fournisseur bloquent les URL de réseau privé par défaut, sauf si le fournisseur est explicitement approuvé.

  </Accordion>

  <Accordion title="Erreurs d’authentification sur les requêtes">
    Si les requêtes échouent avec des erreurs d’authentification, définissez une vraie `VLLM_API_KEY` correspondant à la configuration de votre serveur, ou configurez explicitement le fournisseur sous `models.providers.vllm`.

    <Tip>
    Si votre serveur vLLM n’impose pas l’authentification, n’importe quelle valeur non vide pour `VLLM_API_KEY` fonctionne comme signal d’activation explicite pour OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Aucun modèle découvert">
    La découverte automatique exige que `VLLM_API_KEY` soit défini **et** qu’aucune entrée de configuration explicite `models.providers.vllm` n’existe. Si vous avez défini le fournisseur manuellement, OpenClaw ignore la découverte et utilise uniquement vos modèles déclarés.
  </Accordion>

  <Accordion title="Les outils s’affichent comme du texte brut">
    Si un modèle Qwen affiche une syntaxe d’outil JSON/XML au lieu d’exécuter une skill, consultez les recommandations Qwen dans la configuration avancée ci-dessus. La correction habituelle consiste à :

    - démarrer vLLM avec le bon analyseur/modèle pour ce modèle
    - confirmer l’ID exact du modèle avec `openclaw models list --provider vllm`
    - ajouter une surcharge dédiée par modèle `params.extra_body.tool_choice: "required"` uniquement si `tool_choice: "auto"` renvoie toujours des appels d’outils vides ou uniquement textuels

  </Accordion>
</AccordionGroup>

<Warning>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
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
