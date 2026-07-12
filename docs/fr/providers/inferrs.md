---
read_when:
    - Vous souhaitez exécuter OpenClaw avec un serveur inferrs local
    - Vous fournissez Gemma ou un autre modèle via inferrs
    - Vous avez besoin des indicateurs de compatibilité OpenClaw exacts pour inferrs
summary: Exécuter OpenClaw via inferrs (serveur local compatible avec OpenAI)
title: Déduit
x-i18n:
    generated_at: "2026-07-12T03:00:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) expose des modèles locaux derrière une API `/v1` compatible avec OpenAI. OpenClaw communique avec lui au moyen de l’adaptateur générique `openai-completions`.

| Propriété          | Valeur                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| ID du fournisseur  | `inferrs` (personnalisé ; à configurer sous `models.providers.inferrs`)                         |
| Plugin             | aucun — ce n’est pas un Plugin de fournisseur OpenClaw intégré                                 |
| Variable d’environnement d’authentification | aucune requise ; toute valeur convient si votre serveur inferrs n’utilise pas d’authentification |
| API                | compatible avec OpenAI (`openai-completions`)                                                   |
| URL de base suggérée | `http://127.0.0.1:8080/v1` (ou l’adresse à laquelle votre serveur inferrs écoute)              |

<Note>
  `inferrs` est un backend personnalisé auto-hébergé compatible avec OpenAI, et non un Plugin de fournisseur OpenClaw dédié : vous le configurez sous `models.providers.inferrs` au lieu de sélectionner une option d’authentification lors de la configuration initiale. Pour un Plugin intégré avec détection automatique, consultez [SGLang](/fr/providers/sglang) ou [vLLM](/fr/providers/vllm).
</Note>

## Prise en main

<Steps>
  <Step title="Démarrer inferrs avec un modèle">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Vérifier que le serveur est accessible">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Ajouter une entrée de fournisseur OpenClaw">
    Ajoutez une entrée de fournisseur explicite et faites pointer votre modèle par défaut vers celle-ci. Consultez l’exemple de configuration ci-dessous.
  </Step>
</Steps>

## Exemple de configuration complète

Gemma 4 sur un serveur `inferrs` local :

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Démarrage à la demande

OpenClaw peut démarrer `inferrs` lui-même uniquement lorsqu’un modèle `inferrs/...` est sélectionné. Ajoutez `localService` à la même entrée de fournisseur :

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` doit être un chemin absolu. Exécutez `which inferrs` sur l’hôte du Gateway et utilisez le chemin obtenu. Référence complète des champs : [Services de modèles locaux](/fr/gateway/local-model-services).

## Configuration avancée

<AccordionGroup>
  <Accordion title="Pourquoi requiresStringContent est important">
    Certaines routes Chat Completions d’`inferrs` acceptent uniquement une chaîne dans `messages[].content`, et non des tableaux structurés de parties de contenu.

    <Warning>
    Si les exécutions OpenClaw échouent avec :

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    définissez `compat.requiresStringContent: true` dans l’entrée du modèle. OpenClaw convertit alors les parties de contenu composées uniquement de texte en chaînes simples avant d’envoyer la requête.
    </Warning>

  </Accordion>

  <Accordion title="Mise en garde concernant Gemma et le schéma des outils">
    Certaines combinaisons d’`inferrs` et de Gemma acceptent de petites requêtes directes vers `/v1/chat/completions`, mais échouent lors de tours complets de l’environnement d’exécution d’agent OpenClaw. Essayez d’abord de désactiver l’exposition du schéma des outils :

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Cela réduit la pression exercée par le prompt sur les backends locaux plus stricts. Si les petites requêtes directes continuent de fonctionner, mais que les tours normaux de l’agent OpenClaw provoquent toujours un plantage dans `inferrs`, considérez qu’il s’agit d’une limitation du modèle ou du serveur en amont plutôt que d’un problème de transport OpenClaw.

  </Accordion>

  <Accordion title="Test de fonctionnement manuel">
    Testez les deux couches une fois la configuration terminée :

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Si la première commande fonctionne, mais que la seconde échoue, consultez la section Dépannage ci-dessous.

  </Accordion>

  <Accordion title="Comportement de type proxy">
    Comme `inferrs` utilise l’adaptateur générique `openai-completions` (et non `openai-responses`), la mise en forme des requêtes propre à OpenAI natif ne s’applique jamais : aucun `service_tier`, aucun `store` de Responses, aucune indication de cache de prompt et aucune mise en forme de charge utile pour la compatibilité du raisonnement OpenAI ne sont envoyés.
  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Échec de curl /v1/models">
    `inferrs` n’est pas en cours d’exécution, n’est pas accessible ou n’est pas lié à l’hôte ou au port que vous avez configuré. Vérifiez que le serveur est démarré et écoute à cette adresse.
  </Accordion>

  <Accordion title="messages[].content attendait une chaîne">
    Définissez `compat.requiresStringContent: true` dans l’entrée du modèle (voir ci-dessus).
  </Accordion>

  <Accordion title="Les appels directs à /v1/chat/completions réussissent, mais openclaw infer model run échoue">
    Définissez `compat.supportsTools: false` pour désactiver l’exposition du schéma des outils (voir la mise en garde concernant Gemma ci-dessus).
  </Accordion>

  <Accordion title="inferrs plante toujours lors de tours d’agent plus volumineux">
    Si les erreurs de schéma ont disparu, mais qu’`inferrs` plante toujours lors de tours d’agent plus volumineux, considérez qu’il s’agit d’une limitation d’`inferrs` ou du modèle en amont. Réduisez la pression exercée par le prompt ou changez de backend ou de modèle.
  </Accordion>
</AccordionGroup>

<Tip>
Pour obtenir une aide générale, consultez [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Tip>

## Ressources connexes

<CardGroup cols={2}>
  <Card title="Modèles locaux" href="/fr/gateway/local-models" icon="server">
    Exécution d’OpenClaw avec des serveurs de modèles locaux.
  </Card>
  <Card title="Services de modèles locaux" href="/fr/gateway/local-model-services" icon="play">
    Démarrage à la demande de serveurs de modèles locaux pour les fournisseurs configurés.
  </Card>
  <Card title="Dépannage du Gateway" href="/fr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Dépannage des backends locaux compatibles avec OpenAI qui réussissent les tests directs, mais échouent lors des exécutions d’agent.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Présentation de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
</CardGroup>
