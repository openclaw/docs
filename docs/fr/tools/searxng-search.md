---
read_when:
    - Vous voulez un fournisseur de recherche web auto-hébergé
    - Vous souhaitez utiliser SearXNG pour web_search
    - Vous avez besoin d’une option de recherche axée sur la confidentialité ou déconnectée du réseau
summary: Recherche web SearXNG -- fournisseur de métarecherche auto-hébergé, sans clé
title: Recherche SearXNG
x-i18n:
    generated_at: "2026-05-02T21:03:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw prend en charge [SearXNG](https://docs.searxng.org/) comme fournisseur `web_search` **auto-hébergé,
sans clé**. SearXNG est un méta-moteur de recherche open source
qui agrège les résultats de Google, Bing, DuckDuckGo et d'autres sources.

Avantages :

- **Gratuit et illimité** -- aucune clé API ni aucun abonnement commercial requis
- **Confidentialité / isolation réseau** -- les requêtes ne quittent jamais votre réseau
- **Fonctionne partout** -- aucune restriction régionale sur les API de recherche commerciales

## Configuration

<Steps>
  <Step title="Exécuter une instance SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ou utilisez tout déploiement SearXNG existant auquel vous avez accès. Consultez la
    [documentation SearXNG](https://docs.searxng.org/) pour la configuration en production.

  </Step>
  <Step title="Configurer">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Ou définissez la variable d'environnement et laissez la détection automatique la trouver :

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

Paramètres au niveau Plugin pour l'instance SearXNG :

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
- `http://` n'est accepté que pour les hôtes de réseau privé de confiance ou de local loopback
- les hôtes SearXNG publics doivent utiliser `https://`
- les hôtes privés/internes utilisent la protection réseau auto-hébergée ; les hôtes publics `https://`
  restent sur la protection stricte de recherche web et ne peuvent pas rediriger vers des adresses
  privées

## Variable d'environnement

Définissez `SEARXNG_BASE_URL` comme alternative à la configuration :

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Lorsque `SEARXNG_BASE_URL` est définie et qu'aucun fournisseur explicite n'est configuré, la détection automatique
sélectionne SearXNG automatiquement (avec la priorité la plus basse -- tout fournisseur adossé à une API avec une
clé l'emporte d'abord).

## Référence de configuration du Plugin

| Champ        | Description                                                               |
| ------------ | ------------------------------------------------------------------------- |
| `baseUrl`    | URL de base de votre instance SearXNG (obligatoire)                       |
| `categories` | Catégories séparées par des virgules, comme `general`, `news` ou `science` |
| `language`   | Code de langue pour les résultats, comme `en`, `de` ou `fr`               |

## Notes

- **API JSON** -- utilise le point de terminaison natif `format=json` de SearXNG, pas le scraping HTML
- **URL de résultats d'images** -- les résultats de catégorie image incluent `img_src` lorsque SearXNG
  renvoie une URL d'image directe
- **Aucune clé API** -- fonctionne immédiatement avec toute instance SearXNG
- **Validation de l'URL de base** -- `baseUrl` doit être une URL `http://` ou `https://`
  valide ; les hôtes publics doivent utiliser `https://`
- **Protection réseau** -- les points de terminaison SearXNG privés/internes optent pour
  l'accès au réseau privé ; les points de terminaison SearXNG publics `https://` conservent une protection SSRF
  stricte
- **Ordre de détection automatique** -- SearXNG est vérifié en dernier (ordre 200) dans la
  détection automatique. Les fournisseurs adossés à une API avec des clés configurées s'exécutent d'abord, puis
  DuckDuckGo (ordre 100), puis Ollama Web Search (ordre 110)
- **Auto-hébergé** -- vous contrôlez l'instance, les requêtes et les moteurs de recherche en amont
- **Catégories** vaut `general` par défaut lorsqu'elle n'est pas configurée
- **Repli de catégorie** -- si une requête de catégorie autre que `general` réussit mais
  renvoie zéro résultat, OpenClaw réessaie la même requête une fois avec `general`
  avant de renvoyer un ensemble de résultats vide

<Tip>
  Pour que l'API JSON SearXNG fonctionne, assurez-vous que le format `json`
  est activé dans le fichier `settings.yml` de votre instance SearXNG sous `search.formats`.
</Tip>

## Connexe

- [Vue d'ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Recherche DuckDuckGo](/fr/tools/duckduckgo-search) -- autre solution de repli sans clé
- [Brave Search](/fr/tools/brave-search) -- résultats structurés avec niveau gratuit
