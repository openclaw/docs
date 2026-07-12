---
read_when:
    - Vous souhaitez utiliser Grok pour web_search
    - Vous souhaitez utiliser OAuth de xAI ou une XAI_API_KEY pour la recherche Web
summary: Recherche web Grok via des réponses xAI fondées sur le Web
title: Recherche Grok
x-i18n:
    generated_at: "2026-07-12T15:58:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw prend en charge Grok comme fournisseur de `web_search`, en utilisant les réponses de xAI ancrées dans le Web pour produire des réponses synthétisées par l’IA, étayées par des résultats de recherche en direct avec des citations.

La recherche Web Grok privilégie une connexion OAuth xAI existante lorsqu’elle est disponible. Si aucun profil OAuth n’existe, la même clé API xAI alimente également l’outil intégré `x_search` pour rechercher des publications sur X (anciennement Twitter), ainsi que l’outil `code_execution`. Le stockage de la clé dans `plugins.entries.xai.config.webSearch.apiKey` permet également à OpenClaw de la réutiliser comme solution de repli pour le fournisseur de modèles xAI intégré.

Pour obtenir les métriques d’une publication X (republications, réponses, favoris, vues), utilisez [`x_search`](/fr/tools/web#x_search) avec l’URL exacte de la publication ou son ID de statut plutôt qu’une requête de recherche générale.

## Intégration initiale et configuration

Choisir **Grok** pendant `openclaw onboard` ou `openclaw configure --section
web` permet à OpenClaw de réutiliser un profil OAuth xAI existant sans demander de clé distincte pour la recherche Web. Sans OAuth, OpenClaw utilise à la place la configuration par clé API xAI.

OpenClaw propose ensuite une étape supplémentaire pour activer `x_search` avec les mêmes identifiants xAI. Cette étape supplémentaire :

- apparaît uniquement après avoir choisi Grok pour `web_search`
- ne constitue pas un choix distinct de fournisseur de recherche Web de premier niveau
- peut éventuellement définir le modèle `x_search` dans le même processus

Ignorez-la pour activer ou modifier ultérieurement `x_search` dans la configuration.

## Se connecter ou obtenir une clé API

<Steps>
  <Step title="Utiliser OAuth xAI">
    Si vous vous êtes déjà connecté à xAI pendant l’intégration initiale ou l’authentification du modèle, choisissez Grok comme fournisseur de `web_search`. Aucune clé API distincte n’est requise :

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Utiliser une clé API comme solution de repli">
    Obtenez une clé API auprès de [xAI](https://console.x.ai/) lorsqu’OAuth n’est pas disponible ou si vous souhaitez délibérément une configuration de recherche Web reposant sur une clé.
  </Step>
  <Step title="Stocker la clé">
    Définissez `XAI_API_KEY` dans l’environnement du Gateway ou effectuez la configuration avec :

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
            apiKey: "xai-...", // facultatif si OAuth xAI ou XAI_API_KEY est disponible
            baseUrl: "https://api.x.ai/v1", // remplacement facultatif de l’URL du proxy/de base de l’API Responses
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

**Autres options d’identifiants :** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` dans l’environnement du Gateway ou `plugins.entries.xai.config.webSearch.apiKey`. Pour une installation du Gateway, placez les variables d’environnement dans `~/.openclaw/.env`.

## Fonctionnement

Grok utilise les réponses de xAI ancrées dans le Web pour synthétiser des réponses avec des citations intégrées, selon une approche similaire à l’ancrage dans Google Search de Gemini.

## Paramètres pris en charge

La recherche Grok prend en charge `query`. `count` est accepté pour assurer la compatibilité avec l’interface commune `web_search`, mais Grok renvoie toujours une seule réponse synthétisée avec des citations plutôt qu’une liste de N résultats. Les filtres propres au fournisseur ne sont pas pris en charge.

Grok utilise par défaut un délai d’expiration de 60 secondes, car les recherches ancrées dans le Web avec l’API Responses de xAI peuvent prendre plus de temps que la valeur par défaut commune de `web_search`. Remplacez cette valeur avec `tools.web.search.timeoutSeconds`.

## Remplacement de l’URL de base

Définissez `plugins.entries.xai.config.webSearch.baseUrl` pour acheminer la recherche Web Grok par l’intermédiaire d’un proxy d’opérateur ou d’un point de terminaison Responses compatible avec xAI. OpenClaw envoie les requêtes à `<baseUrl>/responses` après avoir supprimé les barres obliques finales. `x_search` utilise la même valeur `webSearch.baseUrl` comme solution de repli, sauf si `plugins.entries.xai.config.xSearch.baseUrl` est défini.

## Liens connexes

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [x_search dans la recherche Web](/fr/tools/web#x_search) -- recherche X de premier ordre via xAI
- [Recherche Gemini](/fr/tools/gemini-search) -- réponses synthétisées par l’IA grâce à l’ancrage Google
