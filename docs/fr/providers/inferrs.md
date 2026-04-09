---
read_when:
    - Vous voulez exécuter OpenClaw avec un serveur inferrs local
    - Vous servez Gemma ou un autre modèle via inferrs
    - Vous avez besoin des indicateurs de compatibilité OpenClaw exacts pour inferrs
summary: Exécuter OpenClaw via inferrs (serveur local compatible OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-09T01:29:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03b9d5a9935c75fd369068bacb7807a5308cd0bd74303b664227fb664c3a2098
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) peut servir des modèles locaux derrière une
API `/v1` compatible OpenAI. OpenClaw fonctionne avec `inferrs` via le chemin générique
`openai-completions`.

Il est actuellement préférable de traiter `inferrs` comme un backend OpenAI-compatible
personnalisé et auto-hébergé, et non comme un plugin fournisseur OpenClaw dédié.

## Démarrage rapide

1. Démarrez `inferrs` avec un modèle.

Exemple :

```bash
inferrs serve google/gemma-4-E2B-it \
  --host 127.0.0.1 \
  --port 8080 \
  --device metal
```

2. Vérifiez que le serveur est accessible.

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/models
```

3. Ajoutez une entrée de fournisseur OpenClaw explicite et pointez votre modèle par défaut vers celle-ci.

## Exemple complet de configuration

Cet exemple utilise Gemma 4 sur un serveur `inferrs` local.

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

## Pourquoi `requiresStringContent` est important

Certaines routes Chat Completions de `inferrs` acceptent uniquement un
`messages[].content` de type chaîne, et non des tableaux structurés de parties de contenu.

Si les exécutions OpenClaw échouent avec une erreur comme :

```text
messages[1].content: invalid type: sequence, expected a string
```

définissez :

```json5
compat: {
  requiresStringContent: true
}
```

OpenClaw aplatissera les parties de contenu purement textuelles en chaînes simples avant d’envoyer
la requête.

## Mise en garde sur Gemma et le schéma d’outils

Certaines combinaisons actuelles `inferrs` + Gemma acceptent de petites requêtes directes
`/v1/chat/completions`, mais échouent toujours sur des tours complets d’exécution d’agent OpenClaw.

Si cela se produit, essayez d’abord ceci :

```json5
compat: {
  requiresStringContent: true,
  supportsTools: false
}
```

Cela désactive la surface de schéma d’outils d’OpenClaw pour le modèle et peut réduire la
pression sur le prompt sur des backends locaux plus stricts.

Si les petites requêtes directes continuent de fonctionner mais que les tours d’agent OpenClaw normaux
continuent de planter dans `inferrs`, le problème restant provient généralement du comportement
amont du modèle/serveur plutôt que de la couche de transport d’OpenClaw.

## Test smoke manuel

Une fois configuré, testez les deux couches :

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'

openclaw infer model run \
  --model inferrs/google/gemma-4-E2B-it \
  --prompt "What is 2 + 2? Reply with one short sentence." \
  --json
```

Si la première commande fonctionne mais que la seconde échoue, utilisez les notes de dépannage
ci-dessous.

## Dépannage

- `curl /v1/models` échoue : `inferrs` n’est pas en cours d’exécution, n’est pas accessible ou n’est
  pas lié à l’hôte/port attendu.
- `messages[].content ... expected a string` : définissez
  `compat.requiresStringContent: true`.
- Les petits appels directs à `/v1/chat/completions` passent, mais `openclaw infer model run`
  échoue : essayez `compat.supportsTools: false`.
- OpenClaw n’obtient plus d’erreurs de schéma, mais `inferrs` plante toujours sur des tours
  d’agent plus volumineux : considérez cela comme une limitation amont de `inferrs` ou du modèle et réduisez
  la pression sur le prompt ou changez de backend/modèle local.

## Comportement de type proxy

`inferrs` est traité comme un backend `/v1` compatible OpenAI de type proxy, et non comme un
point de terminaison OpenAI natif.

- la mise en forme des requêtes réservée à OpenAI natif ne s’applique pas ici
- pas de `service_tier`, pas de `store` Responses, pas d’indices de cache de prompt, et pas
  de mise en forme de payload de compatibilité de raisonnement OpenAI
- les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`)
  ne sont pas injectés sur les `baseUrl` `inferrs` personnalisées

## Voir aussi

- [Local models](/fr/gateway/local-models)
- [Gateway troubleshooting](/fr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)
- [Model providers](/fr/concepts/model-providers)
