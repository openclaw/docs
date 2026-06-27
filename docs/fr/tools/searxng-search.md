---
read_when:
    - Vous voulez un fournisseur de recherche web auto-hébergé
    - Vous voulez utiliser SearXNG pour web_search
    - Vous avez besoin d’une option de recherche axée sur la confidentialité ou isolée physiquement
summary: Recherche web SearXNG -- fournisseur de métarecherche auto-hébergé, sans clé
title: Recherche SearXNG
x-i18n:
    generated_at: "2026-06-27T18:20:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw prend en charge [SearXNG](https://docs.searxng.org/) comme fournisseur `web_search` **auto-hébergé
et sans clé**. SearXNG est un métamoteur de recherche open source
qui agrège les résultats de Google, Bing, DuckDuckGo et d’autres sources.

Avantages :

- **Gratuit et illimité** -- aucune clé d’API ni aucun abonnement commercial requis
- **Confidentialité / réseau isolé** -- les requêtes ne quittent jamais votre réseau
- **Fonctionne partout** -- aucune restriction régionale sur les API de recherche commerciales

## Configuration

<Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Exécuter une instance SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou utilisez n’importe quel déploiement SearXNG existant auquel vous avez accès. Consultez la
    [documentation SearXNG](https://docs.searxng.org/) pour la configuration en production.

  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Ou définissez la variable d’environnement et laissez l’auto-détection la trouver :

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Paramètres au niveau du Plugin pour l’instance SearXNG :

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Le champ `baseUrl` accepte également les objets SecretRef.

Règles de transport :

- `https://` fonctionne pour les hôtes SearXNG publics ou privés
- `http://` n’est accepté que pour les hôtes de réseau privé ou de bouclage de confiance
- les hôtes SearXNG publics doivent utiliser `https://`
- les hôtes privés/internes utilisent la garde réseau auto-hébergée ; les hôtes publics en `https://`
  restent sur la garde stricte de recherche Web et ne peuvent pas rediriger vers des adresses
  privées

## Variable d’environnement

Définissez `SEARXNG_BASE_URL` comme alternative à la configuration :

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Lorsque `SEARXNG_BASE_URL` est défini et qu’aucun fournisseur explicite n’est configuré, l’auto-détection
sélectionne automatiquement SearXNG (à la priorité la plus basse -- tout fournisseur adossé à une API avec une
clé l’emporte d’abord).

## Référence de configuration du Plugin

| Champ        | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL de base de votre instance SearXNG (obligatoire)                |
| `categories` | Catégories séparées par des virgules, comme `general`, `news` ou `science` |
| `language`   | Code de langue des résultats, comme `en`, `de` ou `fr`             |

## Notes

- **API JSON** -- utilise le point de terminaison natif `format=json` de SearXNG, pas de scraping HTML
- **URL des résultats d’image** -- les résultats de catégorie image incluent `img_src` lorsque SearXNG
  renvoie une URL d’image directe
- **Aucune clé d’API** -- fonctionne directement avec n’importe quelle instance SearXNG
- **Validation de l’URL de base** -- `baseUrl` doit être une URL `http://` ou `https://`
  valide ; les hôtes publics doivent utiliser `https://`
- **Garde réseau** -- les points de terminaison SearXNG privés/internes optent pour
  l’accès au réseau privé ; les points de terminaison SearXNG publics en `https://` conservent une protection SSRF
  stricte
- **Ordre d’auto-détection** -- SearXNG est vérifié après les fournisseurs adossés à une API
  avec des clés configurées (ordre 200). Les fournisseurs sans clé comme DuckDuckGo ou
  Ollama Web Search ne sont pas sélectionnés automatiquement sans choix explicite du fournisseur
- **Auto-hébergé** -- vous contrôlez l’instance, les requêtes et les moteurs de recherche en amont
- **Catégories** utilise `general` par défaut lorsqu’elles ne sont pas configurées
- **Repli de catégorie** -- si une requête de catégorie non `general` réussit mais
  renvoie zéro résultat, OpenClaw réessaie une fois la même requête avec `general`
  avant de renvoyer un ensemble de résultats vide

<Tip>
  Pour que l’API JSON de SearXNG fonctionne, assurez-vous que le format `json`
  est activé dans le fichier `settings.yml` de votre instance SearXNG, sous `search.formats`.
</Tip>

## Connexe

- [Vue d’ensemble de la recherche Web](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Recherche DuckDuckGo](/fr/tools/duckduckgo-search) -- un autre fournisseur sans clé
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec offre gratuite
