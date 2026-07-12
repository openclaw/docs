---
read_when:
    - Vous souhaitez utiliser MiniMax pour web_search
    - Vous avez besoin d’une clé MiniMax Token Plan ou d’un jeton OAuth
    - Vous souhaitez des indications sur l’hôte de recherche MiniMax pour la Chine et le reste du monde
summary: Recherche MiniMax via l’API de recherche de l’offre Token Plan
title: Recherche MiniMax
x-i18n:
    generated_at: "2026-07-12T03:10:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw prend en charge MiniMax comme fournisseur `web_search` via l’API de recherche
Token Plan de MiniMax. Celle-ci renvoie des résultats de recherche structurés comprenant des titres, des URL,
des extraits et des requêtes associées.

## Obtenir un identifiant Token Plan

<Steps>
  <Step title="Créer une clé">
    Créez ou copiez une clé MiniMax Token Plan depuis la
    [plateforme MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Les configurations OAuth peuvent utiliser `MINIMAX_OAUTH_TOKEN` à la place.
  </Step>
  <Step title="Stocker la clé">
    Définissez `MINIMAX_CODE_PLAN_KEY` dans l’environnement du Gateway, ou effectuez la configuration via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepte également `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` et
`MINIMAX_API_KEY` comme alias de variables d’environnement, vérifiés dans cet ordre après
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` doit désigner un identifiant
Token Plan autorisant la recherche ; les clés d’API de modèle MiniMax ordinaires peuvent ne pas être acceptées par
le point de terminaison de recherche Token Plan.

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

**Alternative avec des variables d’environnement :** définissez `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` dans l’environnement du Gateway.
Pour une installation du Gateway, placez-la dans `~/.openclaw/.env`.

## Sélection de la région

La recherche MiniMax utilise les points de terminaison suivants :

- Monde : `https://api.minimax.io/v1/coding_plan/search`
- Chine : `https://api.minimaxi.com/v1/coding_plan/search`

Si `plugins.entries.minimax.config.webSearch.region` n’est pas défini, OpenClaw détermine
la région dans l’ordre suivant :

1. `tools.web.search.minimax.region` / `webSearch.region` appartenant au Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Ainsi, une intégration pour la Chine ou `MINIMAX_API_HOST=https://api.minimaxi.com/...`
maintient également automatiquement la recherche MiniMax sur l’hôte chinois.

Même lorsque vous avez authentifié MiniMax via le parcours OAuth `minimax-portal`,
la recherche web reste enregistrée avec l’identifiant de fournisseur `minimax` ; l’URL de base du fournisseur OAuth
sert d’indication de région pour sélectionner l’hôte chinois ou mondial, et `MINIMAX_OAUTH_TOKEN`
peut fournir l’identifiant de porteur requis par la recherche MiniMax.

## Paramètres pris en charge

| Paramètre | Type    | Contraintes     | Description                                                                 |
| --------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `query`   | chaîne  | obligatoire     | Chaîne de requête de recherche.                                             |
| `count`   | entier  | 1-10, valeur par défaut : 5 | Nombre de résultats à renvoyer. OpenClaw réduit la liste renvoyée à cette taille. |

Les filtres propres au fournisseur ne sont pas pris en charge actuellement.

## Voir aussi

- [Présentation de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [MiniMax](/fr/providers/minimax) -- configuration des modèles, des images, de la parole et de l’authentification
