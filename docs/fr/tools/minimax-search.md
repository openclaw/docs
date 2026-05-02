---
read_when:
    - Vous souhaitez utiliser MiniMax pour web_search
    - Vous avez besoin d’une clé MiniMax Token Plan ou d’un jeton OAuth
    - Vous voulez des indications sur l’hôte de recherche MiniMax CN/global
summary: MiniMax Search via l’API de recherche Token Plan
title: Recherche MiniMax
x-i18n:
    generated_at: "2026-05-02T07:21:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw prend en charge MiniMax comme fournisseur `web_search` via l’API de recherche MiniMax
Token Plan. Elle renvoie des résultats de recherche structurés avec des titres, des URL,
des extraits et des requêtes associées.

## Obtenir un identifiant Token Plan

<Steps>
  <Step title="Créer une clé">
    Créez ou copiez une clé MiniMax Token Plan depuis
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Les configurations OAuth peuvent réutiliser `MINIMAX_OAUTH_TOKEN` à la place.
  </Step>
  <Step title="Stocker la clé">
    Définissez `MINIMAX_CODE_PLAN_KEY` dans l’environnement du Gateway, ou configurez via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepte aussi `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` et
`MINIMAX_API_KEY` comme alias d’environnement. `MINIMAX_API_KEY` doit pointer vers un
identifiant Token Plan compatible avec la recherche ; les clés d’API de modèle MiniMax ordinaires peuvent ne pas
être acceptées par le point de terminaison de recherche Token Plan.

## Configuration

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Autre option avec l’environnement :** définissez `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` dans l’environnement du Gateway.
Pour une installation du Gateway, placez-le dans `~/.openclaw/.env`.

## Sélection de la région

MiniMax Search utilise ces points de terminaison :

- Mondial : `https://api.minimax.io/v1/coding_plan/search`
- Chine : `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` n’est pas défini, OpenClaw résout
la région dans cet ordre :

1. `tools.web.search.minimax.region` / `webSearch.region` détenu par le plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Cela signifie que l’onboarding pour la Chine ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
conserve aussi automatiquement MiniMax Search sur l’hôte Chine.

Même lorsque vous vous êtes authentifié auprès de MiniMax via le chemin OAuth `minimax-portal`,
la recherche web s’enregistre toujours avec l’identifiant de fournisseur `minimax` ; l’URL de base du fournisseur OAuth
est utilisée comme indice de région pour la sélection de l’hôte Chine/mondial, et `MINIMAX_OAUTH_TOKEN`
peut satisfaire l’identifiant bearer de MiniMax Search.

## Paramètres pris en charge

MiniMax Search prend en charge :

- `query`
- `count` (OpenClaw réduit la liste des résultats renvoyés au nombre demandé)

Les filtres propres au fournisseur ne sont actuellement pas pris en charge.

## Associés

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [MiniMax](/fr/providers/minimax) -- configuration du modèle, de l’image, de la voix et de l’authentification
