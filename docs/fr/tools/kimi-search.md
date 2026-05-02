---
read_when:
    - Vous souhaitez utiliser Kimi pour web_search
    - Vous devez disposer d’une KIMI_API_KEY ou d’une MOONSHOT_API_KEY
summary: Recherche web Kimi via la recherche web de Moonshot
title: Recherche Kimi
x-i18n:
    generated_at: "2026-05-02T07:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw prend en charge Kimi comme fournisseur `web_search`, en utilisant la recherche web Moonshot
pour produire des réponses synthétisées par IA avec citations.

## Obtenir une clé API

<Steps>
  <Step title="Créer une clé">
    Obtenez une clé API auprès de [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Stocker la clé">
    Définissez `KIMI_API_KEY` ou `MOONSHOT_API_KEY` dans l’environnement du Gateway, ou
    configurez-la via :

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Lorsque vous choisissez **Kimi** pendant `openclaw onboard` ou
`openclaw configure --section web`, OpenClaw peut aussi demander :

- la région de l’API Moonshot :
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- le modèle de recherche web Kimi par défaut (par défaut, `kimi-k2.6`)

## Configuration

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

Si vous utilisez l’hôte de l’API chinoise pour le chat (`models.providers.moonshot.baseUrl` :
`https://api.moonshot.cn/v1`), OpenClaw réutilise ce même hôte pour `web_search` Kimi
lorsque `tools.web.search.kimi.baseUrl` est omis, afin que les clés de
[platform.moonshot.cn](https://platform.moonshot.cn/) n’atteignent pas
l’endpoint international par erreur (ce qui renvoie souvent HTTP 401). Remplacez-le
avec `tools.web.search.kimi.baseUrl` lorsque vous avez besoin d’une URL de base de recherche différente.

**Alternative par environnement :** définissez `KIMI_API_KEY` ou `MOONSHOT_API_KEY` dans
l’environnement du Gateway. Pour une installation Gateway, placez-la dans `~/.openclaw/.env`.

Si vous omettez `baseUrl`, OpenClaw utilise par défaut `https://api.moonshot.ai/v1`.
Si vous omettez `model`, OpenClaw utilise par défaut `kimi-k2.6`.

## Fonctionnement

Kimi utilise la recherche web Moonshot pour synthétiser des réponses avec des citations en ligne,
de manière similaire à l’approche de réponse ancrée de Gemini et Grok.

OpenClaw considère `web_search` Kimi comme réussi uniquement après que Moonshot a renvoyé
des éléments d’ancrage de recherche web natifs, comme une charge utile d’outil `$web_search`
rejouable, `search_results` ou des URL de citation. Si Kimi s’arrête immédiatement avec une
simple réponse de chat comme « Je ne peux pas naviguer sur Internet » et sans élément d’ancrage,
OpenClaw renvoie une erreur structurée `kimi_web_search_ungrounded` au lieu
d’envelopper ce texte comme résultat de recherche. Réessayez la requête, passez à un fournisseur structuré
comme Brave, ou utilisez `web_fetch` / l’outil de navigateur lorsque vous avez déjà
une URL cible.

## Paramètres pris en charge

La recherche Kimi prend en charge `query`.

`count` est accepté pour la compatibilité `web_search` partagée, mais Kimi renvoie tout de même
une seule réponse synthétisée avec citations plutôt qu’une liste de N résultats.

Les filtres propres au fournisseur ne sont pas pris en charge actuellement.

## Connexe

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Moonshot AI](/fr/providers/moonshot) -- documentation du fournisseur de modèle Moonshot + Kimi Coding
- [Recherche Gemini](/fr/tools/gemini-search) -- réponses synthétisées par IA via l’ancrage Google
- [Recherche Grok](/fr/tools/grok-search) -- réponses synthétisées par IA via l’ancrage xAI
