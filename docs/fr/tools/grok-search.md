---
read_when:
    - Vous souhaitez utiliser Grok pour `web_search`
    - Vous souhaitez utiliser OAuth de xAI ou une XAI_API_KEY pour la recherche sur le Web
summary: Recherche web Grok via des réponses xAI fondées sur le Web
title: Recherche Grok
x-i18n:
    generated_at: "2026-07-12T03:12:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw prend en charge Grok en tant que fournisseur `web_search`, en utilisant les réponses de xAI fondées sur le Web pour produire des réponses synthétisées par l’IA, étayées par des résultats de recherche en direct et accompagnées de citations.

La recherche Web Grok privilégie une connexion OAuth xAI existante lorsqu’elle est disponible. Si aucun profil OAuth n’existe, la même clé d’API xAI alimente également l’outil intégré `x_search`, qui recherche des publications sur X (anciennement Twitter), ainsi que l’outil `code_execution`. Le stockage de la clé dans `plugins.entries.xai.config.webSearch.apiKey` permet également à OpenClaw de la réutiliser comme solution de repli pour le fournisseur de modèles xAI inclus.

Pour obtenir les métriques d’une publication X (republications, réponses, favoris, vues), utilisez [`x_search`](/fr/tools/web#x_search) avec l’URL exacte de la publication ou son identifiant de statut, plutôt qu’une requête de recherche générale.

## Intégration initiale et configuration

Choisir **Grok** pendant `openclaw onboard` ou `openclaw configure --section
web` permet à OpenClaw de réutiliser un profil OAuth xAI existant sans demander de clé distincte pour la recherche Web. Sans OAuth, OpenClaw revient à la configuration d’une clé d’API xAI.

OpenClaw propose ensuite une étape supplémentaire permettant d’activer `x_search` avec le même identifiant xAI. Cette étape :

- n’apparaît qu’après avoir choisi Grok pour `web_search`
- ne constitue pas un choix distinct de fournisseur principal de recherche Web
- peut éventuellement définir le modèle `x_search` dans le même processus

Ignorez-la pour activer ou modifier ultérieurement `x_search` dans la configuration.

## Se connecter ou obtenir une clé d’API

<Steps>
  <Step title="Utiliser OAuth xAI">
    Si vous vous êtes déjà connecté à xAI pendant l’intégration initiale ou l’authentification du modèle, choisissez Grok comme fournisseur `web_search`. Aucune clé d’API distincte n’est requise :

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Utiliser une clé d’API comme solution de repli">
    Obtenez une clé d’API auprès de [xAI](https://console.x.ai/) lorsque OAuth n’est pas disponible ou si vous souhaitez délibérément utiliser une configuration de recherche Web fondée sur une clé.
  </Step>
  <Step title="Stocker la clé">
    Définissez `XAI_API_KEY` dans l’environnement du Gateway, ou procédez à la configuration avec :

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
            baseUrl: "https://api.x.ai/v1", // remplacement facultatif du proxy ou de l’URL de base de l’API Responses
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

**Autres options d’identification :** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` dans l’environnement du Gateway, ou
`plugins.entries.xai.config.webSearch.apiKey`. Pour une installation du Gateway, placez les variables d’environnement dans `~/.openclaw/.env`.

## Fonctionnement

Grok utilise les réponses de xAI fondées sur le Web pour synthétiser des réponses accompagnées de citations intégrées, de manière similaire à l’approche de Gemini fondée sur la recherche Google.

## Paramètres pris en charge

La recherche Grok prend en charge `query`. `count` est accepté à des fins de compatibilité avec l’interface commune `web_search`, mais Grok renvoie toujours une seule réponse synthétisée avec des citations plutôt qu’une liste de N résultats. Les filtres propres au fournisseur ne sont pas pris en charge.

Grok utilise par défaut un délai d’expiration de 60 secondes, car les recherches de l’API Responses de xAI fondées sur le Web peuvent prendre plus de temps que le délai par défaut commun de `web_search`. Remplacez-le avec `tools.web.search.timeoutSeconds`.

## Remplacements de l’URL de base

Définissez `plugins.entries.xai.config.webSearch.baseUrl` pour acheminer la recherche Web Grok par l’intermédiaire d’un proxy d’opérateur ou d’un point de terminaison Responses compatible avec xAI. OpenClaw envoie les requêtes à `<baseUrl>/responses` après avoir supprimé les barres obliques finales. `x_search` utilise en solution de repli la même valeur `webSearch.baseUrl`, sauf si `plugins.entries.xai.config.xSearch.baseUrl` est défini.

## Voir aussi

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [x_search dans la recherche Web](/fr/tools/web#x_search) -- recherche X native via xAI
- [Recherche Gemini](/fr/tools/gemini-search) -- réponses synthétisées par l’IA grâce à l’ancrage Google
