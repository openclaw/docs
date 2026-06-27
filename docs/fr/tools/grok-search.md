---
read_when:
    - Vous voulez utiliser Grok pour web_search
    - Vous souhaitez utiliser xAI OAuth ou une XAI_API_KEY pour la recherche web
summary: Recherche Web Grok via les réponses fondées sur le Web de xAI
title: Recherche Grok
x-i18n:
    generated_at: "2026-06-27T18:19:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw prend en charge Grok comme fournisseur `web_search`, en utilisant les
réponses xAI ancrées dans le web pour produire des réponses synthétisées par IA
appuyées par des résultats de recherche en direct
avec citations.

La recherche web Grok privilégie votre connexion OAuth xAI existante lorsqu’elle est disponible.
Si aucun profil OAuth n’existe, la même clé d’API xAI peut aussi alimenter l’outil intégré
`x_search` pour la recherche de publications X (anciennement Twitter) et l’outil `code_execution`.
Si vous stockez la clé sous `plugins.entries.xai.config.webSearch.apiKey`,
OpenClaw la réutilise également comme solution de secours pour le fournisseur de modèles xAI groupé.

Pour les métriques X au niveau d’une publication, comme les republications, les réponses, les signets ou les vues, préférez
`x_search` avec l’URL exacte de la publication ou l’ID de statut plutôt qu’une requête de recherche
large.

## Intégration et configuration

Si vous choisissez **Grok** pendant :

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw peut utiliser un profil OAuth xAI existant sans demander de clé
de recherche web distincte. Si OAuth n’est pas disponible, il revient à la configuration par clé d’API xAI.
OpenClaw peut aussi afficher une étape de suivi distincte pour activer `x_search` avec le même identifiant xAI. Cette étape de suivi :

- apparaît uniquement après que vous avez choisi Grok pour `web_search`
- n’est pas un choix de fournisseur de recherche web de premier niveau distinct
- peut facultativement définir le modèle `x_search` pendant le même flux

Si vous l’ignorez, vous pouvez activer ou modifier `x_search` plus tard dans la configuration.

## Se connecter ou obtenir une clé d’API

<Steps>
  <Step title="Utiliser OAuth xAI">
    Si vous vous êtes déjà connecté avec xAI pendant l’intégration ou l’authentification du modèle, choisissez
    Grok comme fournisseur `web_search`. Aucune clé d’API distincte n’est requise :

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Utiliser une clé d’API de secours">
    Obtenez une clé d’API auprès de [xAI](https://console.x.ai/) lorsque OAuth n’est pas disponible
    ou que vous souhaitez intentionnellement une configuration de recherche web basée sur une clé.
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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**Autres options d’identification :** connectez-vous avec `openclaw models auth login
--provider xai --method oauth`, définissez `XAI_API_KEY` dans l’environnement Gateway,
ou stockez `plugins.entries.xai.config.webSearch.apiKey`. Pour une installation Gateway,
placez les variables d’environnement dans `~/.openclaw/.env`.

## Fonctionnement

Grok utilise les réponses xAI ancrées dans le web pour synthétiser des réponses avec citations
intégrées, de façon similaire à l’approche d’ancrage Google Search de Gemini.

## Paramètres pris en charge

La recherche Grok prend en charge `query`.

`count` est accepté pour la compatibilité partagée avec `web_search`, mais Grok renvoie toujours
une réponse synthétisée avec citations plutôt qu’une liste de N résultats.

Les filtres propres au fournisseur ne sont pas pris en charge actuellement.

Grok utilise un délai d’expiration par défaut de 60 secondes propre au fournisseur, car les recherches xAI Responses
ancrées dans le web peuvent prendre plus longtemps que la valeur par défaut partagée de `web_search`. Définissez
`tools.web.search.timeoutSeconds` pour le remplacer.

## Remplacements de l’URL de base

Définissez `plugins.entries.xai.config.webSearch.baseUrl` lorsque la recherche web Grok doit
transiter par un proxy opérateur ou un point de terminaison Responses compatible xAI. OpenClaw
publie vers `<baseUrl>/responses` après suppression des barres obliques finales. `x_search`
utilise la même solution de secours `webSearch.baseUrl` sauf si
`plugins.entries.xai.config.xSearch.baseUrl` est défini.

## Articles connexes

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [x_search dans Web Search](/fr/tools/web#x_search) -- recherche X de première classe via xAI
- [Gemini Search](/fr/tools/gemini-search) -- réponses synthétisées par IA via l’ancrage Google
