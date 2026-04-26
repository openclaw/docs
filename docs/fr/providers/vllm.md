---
read_when:
    - Vous souhaitez exécuter OpenClaw sur un serveur vLLM local
    - Vous souhaitez utiliser des endpoints `/v1` compatibles OpenAI avec vos propres modèles
summary: Exécuter OpenClaw avec vLLM (serveur local compatible OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:37:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM peut servir des modèles open source (et certains modèles personnalisés) via une API HTTP **compatible OpenAI**. OpenClaw se connecte à vLLM à l’aide de l’API `openai-completions`.

OpenClaw peut aussi **détecter automatiquement** les modèles disponibles depuis vLLM lorsque vous activez cette option avec `VLLM_API_KEY` (n’importe quelle valeur fonctionne si votre serveur n’impose pas d’authentification) et que vous ne définissez pas d’entrée explicite `models.providers.vllm`.

OpenClaw traite `vllm` comme un fournisseur local compatible OpenAI qui prend en charge
la comptabilisation d’usage en streaming, afin que les comptes de jetons d’état/contexte puissent être mis à jour à partir des
réponses `stream_options.include_usage`.

| Propriété        | Valeur                                   |
| ---------------- | ---------------------------------------- |
| ID du fournisseur | `vllm`                                  |
| API              | `openai-completions` (compatible OpenAI) |
| Authentification | Variable d’environnement `VLLM_API_KEY`  |
| URL de base par défaut | `http://127.0.0.1:8000/v1`          |

## Prise en main

<Steps>
  <Step title="Démarrer vLLM avec un serveur compatible OpenAI">
    Votre URL de base doit exposer des endpoints `/v1` (par ex. `/v1/models`, `/v1/chat/completions`). vLLM s’exécute généralement sur :

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Définir la variable d’environnement de clé API">
    N’importe quelle valeur fonctionne si votre serveur n’impose pas d’authentification :

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

## Détection des modèles (fournisseur implicite)

Lorsque `VLLM_API_KEY` est défini (ou qu’un profil d’authentification existe) et que vous **ne** définissez **pas** `models.providers.vllm`, OpenClaw interroge :

```
GET http://127.0.0.1:8000/v1/models
```

et convertit les ID renvoyés en entrées de modèle.

<Note>
Si vous définissez explicitement `models.providers.vllm`, la détection automatique est ignorée et vous devez définir les modèles manuellement.
</Note>

## Configuration explicite (modèles manuels)

Utilisez une configuration explicite lorsque :

- vLLM s’exécute sur un autre hôte ou port
- Vous souhaitez épingler les valeurs `contextWindow` ou `maxTokens`
- Votre serveur nécessite une vraie clé API (ou vous souhaitez contrôler les en-têtes)
- Vous vous connectez à un endpoint vLLM de confiance en local loopback, sur le LAN ou via Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
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
    vLLM est traité comme un backend `/v1` compatible OpenAI de type proxy, et non comme un endpoint
    OpenAI natif. Cela signifie :

    | Comportement | Appliqué ? |
    |----------|----------|
    | Mise en forme native des requêtes OpenAI | Non |
    | `service_tier` | Non envoyé |
    | Réponses `store` | Non envoyé |
    | Indications de cache de prompt | Non envoyées |
    | Mise en forme de payload de compatibilité du raisonnement OpenAI | Non appliquée |
    | En-têtes d’attribution cachés OpenClaw | Non injectés sur les URL de base personnalisées |

  </Accordion>

  <Accordion title="Contrôles de réflexion Nemotron 3">
    vLLM/Nemotron 3 peut utiliser les kwargs de modèle de chat pour contrôler si le raisonnement est
    renvoyé comme raisonnement masqué ou comme texte de réponse visible. Lorsqu’une session OpenClaw
    utilise `vllm/nemotron-3-*` avec la réflexion désactivée, OpenClaw envoie :

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
    la priorité finale, car `extra_body` est la dernière surcharge du corps de requête.

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
  <Accordion title="Serveur inaccessible">
    Vérifiez que le serveur vLLM est en cours d’exécution et accessible :

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si vous voyez une erreur de connexion, vérifiez l’hôte, le port et que vLLM a démarré en mode serveur compatible OpenAI.
    Pour les endpoints explicites en local loopback, sur le LAN ou via Tailscale, définissez aussi
    `models.providers.vllm.request.allowPrivateNetwork: true` ; les requêtes du fournisseur
    bloquent par défaut les URL de réseau privé, sauf si le fournisseur est
    explicitement approuvé.

  </Accordion>

  <Accordion title="Erreurs d’authentification sur les requêtes">
    Si les requêtes échouent avec des erreurs d’authentification, définissez une vraie `VLLM_API_KEY` correspondant à la configuration de votre serveur, ou configurez explicitement le fournisseur sous `models.providers.vllm`.

    <Tip>
    Si votre serveur vLLM n’impose pas d’authentification, toute valeur non vide pour `VLLM_API_KEY` fonctionne comme signal d’activation pour OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Aucun modèle détecté">
    La détection automatique exige que `VLLM_API_KEY` soit défini **et** qu’aucune entrée de configuration explicite `models.providers.vllm` ne soit présente. Si vous avez défini le fournisseur manuellement, OpenClaw ignore la détection et utilise uniquement les modèles que vous avez déclarés.
  </Accordion>
</AccordionGroup>

<Warning>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Warning>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèles et comportement de basculement.
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
