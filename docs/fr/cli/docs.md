---
read_when:
    - Vous voulez rechercher dans la documentation OpenClaw en ligne depuis le terminal
    - Vous devez savoir quelle API de recherche hébergée le CLI de documentation appelle
summary: Référence CLI pour `openclaw docs` (rechercher dans l’index de documentation en direct)
title: Documentation
x-i18n:
    generated_at: "2026-06-27T17:18:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Recherchez dans l’index de documentation OpenClaw en direct depuis le terminal. La commande appelle l’API de recherche de documentation hébergée par Cloudflare d’OpenClaw et affiche les résultats dans votre terminal.

## Utilisation

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Arguments :

| Argument     | Description                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| `[query...]` | Requête de recherche libre. Les requêtes de plusieurs mots sont jointes par des espaces et envoyées comme une seule requête. |

## Exemples

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Sans requête, `openclaw docs` affiche l’URL du point d’entrée de la documentation ainsi qu’un exemple de commande de recherche au lieu d’exécuter une recherche.

## Fonctionnement

`openclaw docs` appelle `https://docs.openclaw.ai/api/search` et affiche les résultats JSON. L’appel de recherche utilise un délai d’expiration fixe de 30 secondes.

## Sortie

Dans un terminal enrichi (TTY), les résultats s’affichent sous forme d’un titre suivi d’une liste à puces. Chaque puce affiche le titre de la page, l’URL de documentation liée et un court extrait sur la ligne suivante. Les résultats vides affichent « No results. ».

Dans une sortie non enrichie (redirigée, `--no-color`, scripts), les mêmes données s’affichent en Markdown :

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Codes de sortie

| Code | Signification                                                     |
| ---- | ----------------------------------------------------------------- |
| `0`  | La recherche a réussi (y compris les réponses sans résultat).     |
| `1`  | L’appel à l’API de recherche de documentation hébergée a échoué ; stderr est affiché en ligne. |

## Connexe

- [Référence CLI](/fr/cli)
- [Documentation en direct](https://docs.openclaw.ai)
