---
read_when:
    - Vous souhaitez utiliser Kimi pour `web_search`
    - Vous avez besoin d’une KIMI_API_KEY ou d’une MOONSHOT_API_KEY
summary: Recherche web Kimi via la recherche web Moonshot
title: Recherche Kimi
x-i18n:
    generated_at: "2026-07-12T15:58:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi est un fournisseur `web_search` reposant sur la recherche web native de Moonshot. Moonshot
synthétise une réponse unique avec des citations intégrées, à l’image des fournisseurs
de réponses étayées de Gemini et Grok, au lieu de renvoyer une liste de résultats classés.

## Configuration

<Steps>
  <Step title="Créer une clé">
    Obtenez une clé API auprès de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Stocker la clé">
    Définissez `KIMI_API_KEY` ou `MOONSHOT_API_KEY` dans l’environnement du Gateway (pour une
    installation de Gateway, ajoutez-la à `~/.openclaw/.env`), ou configurez-la via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Choisir **Kimi** pendant `openclaw onboard` ou `openclaw configure --section web`
demande également :

- la région de l’API Moonshot : `https://api.moonshot.ai/v1` ou `https://api.moonshot.cn/v1`
- le modèle de recherche web (valeur par défaut : `kimi-k2.6`)

## Configuration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // facultatif si KIMI_API_KEY ou MOONSHOT_API_KEY est défini
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

`tools.web.search.provider` est détecté automatiquement à partir des clés API disponibles lorsqu’il est omis ;
définissez-le explicitement sur `kimi` si plusieurs identifiants de recherche sont configurés.

La forme délimitée équivalente sous `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`)
fonctionne également ; les deux structures sont fusionnées dans la même configuration résolue.

Valeurs par défaut : `baseUrl` utilise `https://api.moonshot.ai/v1` lorsqu’il est omis, et `model`
utilise `kimi-k2.6`.

Si le trafic de discussion utilise l’hôte chinois (`models.providers.moonshot.baseUrl` :
`https://api.moonshot.cn/v1`), la recherche `web_search` de Kimi réutilise automatiquement cet hôte
lorsque sa propre valeur `baseUrl` n’est pas définie, afin que les clés `.cn` n’interrogent pas
accidentellement le point de terminaison international (qui renvoie HTTP 401 pour ces clés). Définissez
explicitement la valeur `baseUrl` de Kimi pour remplacer cet héritage.

## Exigence d’étayage

OpenClaw ne renvoie un résultat `web_search` de Kimi qu’après que la réponse de Moonshot
a inclus des éléments d’étayage issus de la recherche web native, tels que la reproduction d’un appel
à l’outil `$web_search`, des `search_results` ou des URL de citation. Si Kimi répond directement sans
étayage (par exemple « Je ne peux pas parcourir Internet »), OpenClaw renvoie une erreur
`kimi_web_search_ungrounded` au lieu de traiter ce texte comme un résultat de recherche.
Réessayez la requête, passez à un fournisseur structuré tel que Brave, ou utilisez
`web_fetch` / l’outil de navigation lorsque vous disposez déjà d’une URL cible.

## Paramètres de l’outil

| Paramètre                                                       | Pris en charge                                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | Oui                                                                                                                                        |
| `count`                                                         | Accepté pour assurer la compatibilité entre fournisseurs, mais ignoré : Kimi renvoie toujours une réponse synthétisée, pas une liste de N résultats |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Non                                                                                                                                        |

## Voir aussi

- [Présentation de la recherche web](/fr/tools/web) - tous les fournisseurs et la détection automatique
- [Moonshot AI](/fr/providers/moonshot) - documentation sur le modèle Moonshot et le fournisseur Kimi Coding
- [Recherche Gemini](/fr/tools/gemini-search) - réponses synthétisées par l’IA grâce à l’étayage de Google
- [Recherche Grok](/fr/tools/grok-search) - réponses synthétisées par l’IA grâce à l’étayage de xAI
