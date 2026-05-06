---
read_when:
    - Vous souhaitez exécuter OpenClaw avec un serveur inferrs local
    - Vous servez Gemma ou un autre modèle via inferrs
    - Vous avez besoin des indicateurs de compatibilité OpenClaw exacts pour inferrs
summary: Exécuter OpenClaw via inferrs (serveur local compatible avec OpenAI)
title: Déduit
x-i18n:
    generated_at: "2026-05-06T07:36:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) peut servir des modèles locaux derrière une API `/v1` compatible avec OpenAI. OpenClaw fonctionne avec `inferrs` via le chemin générique `openai-completions`.

| Propriété          | Valeur                                                             |
| ------------------ | ------------------------------------------------------------------ |
| ID du fournisseur  | `inferrs` (personnalisé ; configurer sous `models.providers.inferrs`) |
| Plugin             | aucun — `inferrs` n’est pas un plugin fournisseur OpenClaw groupé  |
| Variable d’env d’auth | Facultatif. N’importe quelle valeur fonctionne si votre serveur inferrs n’a pas d’auth |
| API                | Compatible avec OpenAI (`openai-completions`)                      |
| URL de base suggérée | `http://127.0.0.1:8080/v1` (ou là où se trouve votre serveur inferrs) |

<Note>
  `inferrs` doit actuellement être considéré comme un backend auto-hébergé personnalisé compatible avec OpenAI, et non comme un plugin fournisseur OpenClaw dédié. Vous le configurez via `models.providers.inferrs` plutôt qu’avec un indicateur de choix d’onboarding. Si vous avez besoin d’un vrai plugin groupé avec auto-découverte, consultez [SGLang](/fr/providers/sglang) ou [vLLM](/fr/providers/vllm).
</Note>

## Bien démarrer

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
    Ajoutez une entrée de fournisseur explicite et faites pointer votre modèle par défaut vers celle-ci. Consultez l’exemple de configuration complet ci-dessous.
  </Step>
</Steps>

## Exemple de configuration complet

Cet exemple utilise Gemma 4 sur un serveur local `inferrs`.

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

## Configuration avancée

<AccordionGroup>
  <Accordion title="Pourquoi requiresStringContent est important">
    Certaines routes Chat Completions de `inferrs` n’acceptent que des chaînes
    `messages[].content`, et non des tableaux structurés de parties de contenu.

    <Warning>
    Si les exécutions OpenClaw échouent avec une erreur comme :

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    définissez `compat.requiresStringContent: true` dans votre entrée de modèle.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw aplatira les parties de contenu en texte pur en chaînes simples avant d’envoyer
    la requête.

  </Accordion>

  <Accordion title="Mise en garde sur Gemma et le schéma d’outils">
    Certaines combinaisons actuelles `inferrs` + Gemma acceptent de petites requêtes directes
    `/v1/chat/completions`, mais échouent encore sur des tours complets de l’environnement d’exécution d’agent OpenClaw.

    Si cela se produit, essayez d’abord ceci :

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Cela désactive la surface de schéma d’outils d’OpenClaw pour le modèle et peut réduire la pression
    du prompt sur les backends locaux plus stricts.

    Si les très petites requêtes directes fonctionnent encore, mais que les tours d’agent OpenClaw normaux continuent de
    planter dans `inferrs`, le problème restant relève généralement du comportement du modèle/serveur
    en amont plutôt que de la couche de transport d’OpenClaw.

  </Accordion>

  <Accordion title="Test smoke manuel">
    Une fois configuré, testez les deux couches :

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

    Si la première commande fonctionne mais que la seconde échoue, consultez la section de dépannage ci-dessous.

  </Accordion>

  <Accordion title="Comportement de type proxy">
    `inferrs` est traité comme un backend `/v1` compatible avec OpenAI de type proxy, et non comme un
    endpoint OpenAI natif.

    - La mise en forme des requêtes propre à OpenAI natif ne s’applique pas ici
    - Pas de `service_tier`, pas de Responses `store`, pas d’indications de cache de prompt, et pas de
      mise en forme de payload de compatibilité de raisonnement OpenAI
    - Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`)
      ne sont pas injectés sur les URL de base `inferrs` personnalisées

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="curl /v1/models échoue">
    `inferrs` n’est pas en cours d’exécution, n’est pas accessible ou n’est pas lié à l’hôte/port
    attendu. Assurez-vous que le serveur est démarré et écoute à l’adresse que vous
    avez configurée.
  </Accordion>

  <Accordion title="messages[].content attendait une chaîne">
    Définissez `compat.requiresStringContent: true` dans l’entrée de modèle. Consultez la section
    `requiresStringContent` ci-dessus pour plus de détails.
  </Accordion>

  <Accordion title="Les appels directs /v1/chat/completions réussissent mais openclaw infer model run échoue">
    Essayez de définir `compat.supportsTools: false` pour désactiver la surface de schéma d’outils.
    Consultez la mise en garde sur le schéma d’outils Gemma ci-dessus.
  </Accordion>

  <Accordion title="inferrs plante encore sur les grands tours d’agent">
    Si OpenClaw ne reçoit plus d’erreurs de schéma mais que `inferrs` plante encore sur des tours
    d’agent plus grands, considérez cela comme une limitation en amont de `inferrs` ou du modèle. Réduisez
    la pression du prompt ou passez à un autre backend ou modèle local.
  </Accordion>
</AccordionGroup>

<Tip>
Pour obtenir de l’aide générale, consultez [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Tip>

## Connexe

<CardGroup cols={2}>
  <Card title="Modèles locaux" href="/fr/gateway/local-models" icon="server">
    Exécuter OpenClaw avec des serveurs de modèles locaux.
  </Card>
  <Card title="Dépannage du Gateway" href="/fr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Déboguer les backends locaux compatibles avec OpenAI qui réussissent les sondes mais échouent lors des exécutions d’agent.
  </Card>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
</CardGroup>
