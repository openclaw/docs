---
read_when:
    - Vous souhaitez utiliser Grok pour web_search
    - Vous avez besoin d’une XAI_API_KEY pour la recherche web
summary: Recherche web Grok via des réponses xAI fondées sur le Web
title: Recherche Grok
x-i18n:
    generated_at: "2026-05-11T20:58:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw prend en charge Grok comme fournisseur `web_search`, en utilisant les
réponses xAI ancrées dans le web pour produire des réponses synthétisées par IA
appuyées par des résultats de recherche en direct avec citations.

La même clé d’API xAI peut également alimenter l’outil intégré `x_search` pour
la recherche de publications X (anciennement Twitter) et l’outil
`code_execution`. Si vous stockez la clé sous
`plugins.entries.xai.config.webSearch.apiKey`, OpenClaw la réutilise désormais
aussi comme solution de repli pour le fournisseur de modèles xAI intégré.

Pour les métriques X au niveau d’une publication, comme les reposts, les
réponses, les signets ou les vues, privilégiez `x_search` avec l’URL exacte de
la publication ou l’ID de statut plutôt qu’une requête de recherche large.

## Intégration et configuration

Si vous choisissez **Grok** pendant :

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw peut afficher une étape de suivi distincte pour activer `x_search`
avec le même `XAI_API_KEY`. Cette étape de suivi :

- n’apparaît qu’après avoir choisi Grok pour `web_search`
- n’est pas un choix de fournisseur de recherche web de premier niveau distinct
- peut éventuellement définir le modèle `x_search` pendant le même flux

Si vous l’ignorez, vous pourrez activer ou modifier `x_search` plus tard dans
la configuration.

## Obtenir une clé d’API

<Steps>
  <Step title="Créer une clé">
    Obtenez une clé d’API auprès de [xAI](https://console.x.ai/).
  </Step>
  <Step title="Stocker la clé">
    Définissez `XAI_API_KEY` dans l’environnement du Gateway, ou configurez-la via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuration

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Autre option d’environnement :** définissez `XAI_API_KEY` dans l’environnement du Gateway.
Pour une installation du gateway, placez-la dans `~/.openclaw/.env`.

## Fonctionnement

Grok utilise les réponses xAI ancrées dans le web pour synthétiser des réponses
avec des citations inline, de manière similaire à l’approche d’ancrage Google
Search de Gemini.

## Paramètres pris en charge

La recherche Grok prend en charge `query`.

`count` est accepté pour la compatibilité avec `web_search` partagé, mais Grok
renvoie toujours une réponse synthétisée avec citations plutôt qu’une liste de
N résultats.

Les filtres propres au fournisseur ne sont pas pris en charge actuellement.

Grok utilise un délai d’expiration par défaut de 60 secondes propre au
fournisseur, car les recherches xAI Responses ancrées dans le web peuvent durer
plus longtemps que la valeur par défaut partagée de `web_search`. Définissez
`tools.web.search.timeoutSeconds` pour le remplacer.

## Remplacements de l’URL de base

Définissez `plugins.entries.xai.config.webSearch.baseUrl` lorsque la recherche
web Grok doit passer par un proxy opérateur ou un point de terminaison Responses
compatible xAI. OpenClaw publie vers `<baseUrl>/responses` après avoir supprimé
les barres obliques finales. `x_search` utilise la même solution de repli
`webSearch.baseUrl` sauf si `plugins.entries.xai.config.xSearch.baseUrl` est
défini.

## Connexe

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [x_search dans Web Search](/fr/tools/web#x_search) -- recherche X de premier ordre via xAI
- [Gemini Search](/fr/tools/gemini-search) -- réponses synthétisées par IA via l’ancrage Google
