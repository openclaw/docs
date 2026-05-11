---
read_when:
    - Vous voulez utiliser MiniMax pour web_search
    - Vous avez besoin d’une clé MiniMax Token Plan ou d’un jeton OAuth
    - Vous voulez des consignes sur l’hôte de recherche CN/global de MiniMax
summary: MiniMax Search via l’API de recherche Token Plan
title: Recherche MiniMax
x-i18n:
    generated_at: "2026-05-11T20:59:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw prend en charge MiniMax comme fournisseur `web_search` via l’API de recherche MiniMax Token Plan. Elle renvoie des résultats de recherche structurés avec des titres, des URL, des extraits et des requêtes associées.

## Obtenir un identifiant Token Plan

<Steps>
  <Step title="Créer une clé">
    Créez ou copiez une clé MiniMax Token Plan depuis
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Les configurations OAuth peuvent réutiliser `MINIMAX_OAUTH_TOKEN` à la place.
  </Step>
  <Step title="Stocker la clé">
    Définissez `MINIMAX_CODE_PLAN_KEY` dans l’environnement du Gateway, ou configurez-la via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepte également `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` et
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

**Alternative par environnement :** définissez `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` dans l’environnement du Gateway.
Pour une installation de Gateway, placez-le dans `~/.openclaw/.env`.

## Sélection de la région

MiniMax Search utilise ces points de terminaison :

- Global : `https://api.minimax.io/v1/coding_plan/search`
- CN : `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` n’est pas défini, OpenClaw résout
la région dans cet ordre :

1. `tools.web.search.minimax.region` / `webSearch.region` détenu par le Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Cela signifie que l’onboarding CN ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
maintient aussi automatiquement MiniMax Search sur l’hôte CN.

Même lorsque vous avez authentifié MiniMax via le chemin OAuth `minimax-portal`,
la recherche web s’enregistre toujours avec l’identifiant de fournisseur `minimax` ; l’URL de base du fournisseur OAuth
est utilisée comme indication de région pour la sélection de l’hôte CN/global, et `MINIMAX_OAUTH_TOKEN`
peut satisfaire l’identifiant bearer de MiniMax Search.

## Paramètres pris en charge

| Paramètre | Type    | Contraintes | Description                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | obligatoire | Chaîne de requête de recherche.                                             |
| `count`   | integer | 1-10        | Nombre de résultats à renvoyer. OpenClaw réduit la liste renvoyée à cette taille. |

Les filtres propres au fournisseur ne sont pas pris en charge actuellement.

## Connexe

- [Vue d’ensemble de Web Search](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [MiniMax](/fr/providers/minimax) -- configuration du modèle, de l’image, de la parole et de l’authentification
