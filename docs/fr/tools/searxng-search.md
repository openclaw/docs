---
read_when:
    - Vous souhaitez un fournisseur de recherche web auto-hébergé
    - Vous souhaitez utiliser SearXNG pour web_search
    - Vous avez besoin d’une option de recherche axée sur la confidentialité ou isolée physiquement du réseau
summary: Recherche web SearXNG — métamoteur de recherche auto-hébergé, sans clé API
title: Recherche SearXNG
x-i18n:
    generated_at: "2026-07-12T15:59:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw prend en charge [SearXNG](https://docs.searxng.org/) comme fournisseur `web_search` **auto-hébergé,
sans clé**. SearXNG est un métamoteur de recherche open source
qui agrège les résultats de Google, Bing, DuckDuckGo et d’autres sources.

Avantages :

- **Gratuit et illimité** -- aucune clé d’API ni aucun abonnement commercial requis
- **Confidentialité / isolation réseau** -- les requêtes ne quittent jamais votre réseau
- **Fonctionne partout** -- aucune restriction régionale liée aux API de recherche commerciales

## Configuration

<Steps>
  <Step title="Installer le Plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Exécuter une instance SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Vous pouvez également utiliser tout déploiement SearXNG existant auquel vous avez accès. Consultez la
    [documentation de SearXNG](https://docs.searxng.org/) pour la configuration en production.

  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Sélectionnez "searxng" comme fournisseur
    ```

    Vous pouvez également définir la variable d’environnement et laisser la détection automatique la trouver :

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Configuration

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

Paramètres du Plugin pour l’instance SearXNG :

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // facultatif
            language: "en", // facultatif
          },
        },
      },
    },
  },
}
```

`baseUrl` accepte également un objet SecretRef (par exemple `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Variable d’environnement

Définissez `SEARXNG_BASE_URL` comme alternative à la configuration :

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Ordre de résolution : la chaîne `baseUrl` configurée, puis une SecretRef d’environnement intégrée dans
`baseUrl`, puis `SEARXNG_BASE_URL`. Lorsqu’aucun des chemins de configuration n’est défini et que
`SEARXNG_BASE_URL` est présent sans fournisseur explicitement choisi, la détection automatique
sélectionne SearXNG.

## Référence de configuration du Plugin

| Champ        | Description                                                                  |
| ------------ | ---------------------------------------------------------------------------- |
| `baseUrl`    | URL de base de votre instance SearXNG (obligatoire)                           |
| `categories` | Catégories séparées par des virgules, telles que `general`, `news` ou `science` |
| `language`   | Code de langue des résultats, tel que `en`, `de` ou `fr`                     |

L’appel de l’outil `web_search` accepte également `count` (1 à 10 résultats), `categories`
et `language` comme paramètres de remplacement pour chaque appel.

## Remarques

- **API JSON** -- utilise le point de terminaison natif `format=json` de SearXNG, et non l’extraction de données HTML
- **URL des résultats d’image** -- les résultats de la catégorie image incluent `img_src` lorsque SearXNG
  renvoie une URL d’image directe
- **Aucune clé d’API** -- fonctionne immédiatement avec n’importe quelle instance SearXNG
- **Validation de l’URL de base** -- `baseUrl` doit être une URL `http://` ou `https://`
  valide
- **Protection réseau** -- les URL de base `http://` doivent cibler un hôte privé de confiance ou
  de bouclage (les hôtes publics doivent utiliser `https://`) ; les URL de base `https://` qui
  se résolvent en une adresse privée/interne bénéficient de la même autorisation pour l’auto-hébergement,
  tandis que les URL de base `https://` qui se résolvent publiquement conservent une protection SSRF stricte
- **Ordre de détection automatique** -- SearXNG nécessite un `baseUrl` configuré (ordre
  200 parmi les fournisseurs qui disposent déjà des identifiants requis). Les fournisseurs
  sans clé, tels que DuckDuckGo ou Ollama Web Search, ne sont jamais sélectionnés implicitement
  par la détection automatique ; ils ne s’activent qu’avec un choix explicite de `provider`
- **Auto-hébergé** -- vous contrôlez l’instance, les requêtes et les moteurs de recherche en amont
- **Les catégories** utilisent par défaut `general` lorsqu’elles ne sont pas configurées
- **Repli de catégorie** -- si une requête de catégorie autre que `general` réussit mais
  ne renvoie aucun résultat, OpenClaw réessaie une fois la même requête avec `general`
  avant de renvoyer un ensemble de résultats vide
- **Mise en cache des résultats** -- les requêtes identiques (mêmes requête, nombre, catégories,
  langue et URL de base) sont mises en cache dans le processus pendant une courte durée de vie
- **Version requise** -- le plugin déclare `minHostVersion: >=2026.6.9`

<Tip>
  Pour que l’API JSON de SearXNG fonctionne, vérifiez que le format `json`
  est activé dans le fichier `settings.yml` de votre instance SearXNG, sous `search.formats`.
</Tip>

## Pages connexes

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Recherche DuckDuckGo](/fr/tools/duckduckgo-search) -- un autre fournisseur ne nécessitant aucune clé
- [Recherche Brave](/fr/tools/brave-search) -- résultats structurés avec une offre gratuite
