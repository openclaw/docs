---
read_when:
    - Vous souhaitez utiliser Grok pour web_search
    - Vous avez besoin d’une XAI_API_KEY pour la recherche web
summary: Recherche web Grok via les réponses fondées sur le web de xAI
title: Recherche Grok
x-i18n:
    generated_at: "2026-05-02T07:21:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw prend en charge Grok comme fournisseur `web_search`, en utilisant les réponses xAI ancrées dans le Web pour produire des réponses synthétisées par l’IA, étayées par des résultats de recherche en direct avec citations.

La même `XAI_API_KEY` peut également alimenter l’outil intégré `x_search` pour la recherche de publications X (anciennement Twitter). Si vous stockez la clé sous `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw la réutilise désormais aussi comme solution de repli pour le fournisseur de modèles xAI intégré.

Pour les métriques X au niveau d’une publication, comme les republications, les réponses, les signets ou les vues, préférez `x_search` avec l’URL exacte de la publication ou l’ID de statut plutôt qu’une requête de recherche large.

## Intégration et configuration

Si vous choisissez **Grok** pendant :

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw peut afficher une étape de suivi distincte pour activer `x_search` avec la même `XAI_API_KEY`. Cette étape de suivi :

- apparaît uniquement après avoir choisi Grok pour `web_search`
- n’est pas un choix distinct de fournisseur de recherche Web de premier niveau
- peut éventuellement définir le modèle `x_search` pendant le même flux

Si vous l’ignorez, vous pouvez activer ou modifier `x_search` plus tard dans la configuration.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Obtenez une clé API auprès de [xAI](https://console.x.ai/).
  </Step>
  <Step title="Stocker la clé">
    Définissez `XAI_API_KEY` dans l’environnement Gateway, ou configurez-la via :

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

**Alternative par variable d’environnement :** définissez `XAI_API_KEY` dans l’environnement Gateway.
Pour une installation de gateway, placez-la dans `~/.openclaw/.env`.

## Fonctionnement

Grok utilise les réponses xAI ancrées dans le Web pour synthétiser des réponses avec citations intégrées, d’une manière similaire à l’approche d’ancrage de Google Search utilisée par Gemini.

## Paramètres pris en charge

La recherche Grok prend en charge `query`.

`count` est accepté pour la compatibilité avec le `web_search` partagé, mais Grok renvoie toujours une réponse synthétisée avec citations plutôt qu’une liste de N résultats.

Les filtres propres au fournisseur ne sont pas pris en charge actuellement.

Grok utilise un délai d’expiration par défaut propre au fournisseur de 60 secondes, car les recherches ancrées dans le Web via xAI Responses peuvent prendre plus de temps que la valeur par défaut partagée de `web_search`. Définissez `tools.web.search.timeoutSeconds` pour le remplacer.

## Remplacements de l’URL de base

Définissez `plugins.entries.xai.config.webSearch.baseUrl` lorsque la recherche Web Grok doit passer par un proxy d’opérateur ou un point de terminaison Responses compatible avec xAI. OpenClaw publie vers `<baseUrl>/responses` après avoir supprimé les barres obliques finales. `x_search` utilise la même solution de repli `webSearch.baseUrl`, sauf si `plugins.entries.xai.config.xSearch.baseUrl` est défini.

## Connexe

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [x_search dans la recherche Web](/fr/tools/web#x_search) -- recherche X de premier niveau via xAI
- [Recherche Gemini](/fr/tools/gemini-search) -- réponses synthétisées par l’IA via l’ancrage Google
