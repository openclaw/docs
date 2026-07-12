---
read_when:
    - Vous souhaitez un fournisseur de recherche web auto-hébergé
    - Vous souhaitez utiliser SearXNG pour web_search
    - Vous avez besoin d’une option de recherche axée sur la confidentialité ou isolée du réseau.
summary: Recherche web SearXNG -- fournisseur de métarecherche auto-hébergé, sans clé
title: Recherche SearXNG
x-i18n:
    generated_at: "2026-07-12T03:13:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw prend en charge [SearXNG](https://docs.searxng.org/) en tant que fournisseur `web_search` **auto-hébergé et sans clé**. SearXNG est un métamoteur de recherche open source qui agrège les résultats de Google, Bing, DuckDuckGo et d’autres sources.

Avantages :

- **Gratuit et illimité** -- aucune clé API ni aucun abonnement commercial requis
- **Confidentialité / isolation réseau** -- les requêtes ne quittent jamais votre réseau
- **Fonctionne partout** -- aucune restriction régionale imposée par les API de recherche commerciales

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

Paramètres du plugin pour l’instance SearXNG :

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

Définissez `SEARXNG_BASE_URL` comme alternative à la configuration :

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Ordre de résolution : la chaîne `baseUrl` configurée, puis une SecretRef d’environnement intégrée dans `baseUrl`, puis `SEARXNG_BASE_URL`. Lorsqu’aucun chemin de configuration n’est défini et que `SEARXNG_BASE_URL` est présent sans qu’un fournisseur ait été explicitement choisi, la détection automatique sélectionne SearXNG.

## Référence de configuration du plugin

| Champ        | Description                                                                  |
| ------------ | ---------------------------------------------------------------------------- |
| `baseUrl`    | URL de base de votre instance SearXNG (obligatoire)                          |
| `categories` | Catégories séparées par des virgules, telles que `general`, `news` ou `science` |
| `language`   | Code de langue des résultats, tel que `en`, `de` ou `fr`                     |

L’appel de l’outil `web_search` accepte également `count` (1 à 10 résultats), `categories` et `language` comme valeurs de remplacement propres à chaque appel.

## Remarques

- **API JSON** -- utilise le point de terminaison natif `format=json` de SearXNG, et non l’extraction de contenu HTML
- **URL des résultats d’images** -- les résultats de la catégorie des images incluent `img_src` lorsque SearXNG renvoie une URL d’image directe
- **Aucune clé API** -- fonctionne immédiatement avec n’importe quelle instance SearXNG
- **Validation de l’URL de base** -- `baseUrl` doit être une URL `http://` ou `https://` valide
- **Protection réseau** -- les URL de base `http://` doivent cibler un hôte privé ou local loopback de confiance (les hôtes publics doivent utiliser `https://`) ; les URL de base `https://` qui se résolvent vers une adresse privée/interne bénéficient de la même autorisation d’auto-hébergement, tandis que celles qui se résolvent publiquement conservent une protection SSRF stricte
- **Ordre de détection automatique** -- SearXNG nécessite une `baseUrl` configurée (priorité 200 parmi les fournisseurs disposant déjà de leurs identifiants requis). Les fournisseurs sans clé, tels que DuckDuckGo ou Ollama Web Search, ne sont jamais sélectionnés implicitement par la détection automatique ; ils ne s’activent que lorsque `provider` est explicitement choisi
- **Auto-hébergé** -- vous contrôlez l’instance, les requêtes et les moteurs de recherche en amont
- **Catégories** -- la valeur par défaut est `general` lorsqu’elles ne sont pas configurées
- **Repli de catégorie** -- si une requête pour une catégorie autre que `general` réussit mais ne renvoie aucun résultat, OpenClaw réessaie une fois la même requête avec `general` avant de renvoyer un ensemble de résultats vide
- **Mise en cache des résultats** -- les requêtes identiques (même requête, nombre, catégories, langue et URL de base) sont mises en cache dans le processus pendant une courte durée de vie
- **Version requise** -- le plugin déclare `minHostVersion: >=2026.6.9`

<Tip>
  Pour que l’API JSON de SearXNG fonctionne, assurez-vous que le format `json`
  est activé dans le fichier `settings.yml` de votre instance SearXNG, sous `search.formats`.
</Tip>

## Voir aussi

- [Présentation de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Recherche DuckDuckGo](/fr/tools/duckduckgo-search) -- un autre fournisseur sans clé
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec une offre gratuite
