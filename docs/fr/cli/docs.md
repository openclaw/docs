---
read_when:
    - Vous souhaitez effectuer une recherche dans la documentation OpenClaw en ligne depuis le terminal
    - Vous devez savoir quelle API de recherche hébergée la CLI de documentation appelle
summary: Référence de la CLI pour `openclaw docs` (rechercher dans l’index de la documentation en ligne)
title: Documentation
x-i18n:
    generated_at: "2026-07-12T15:07:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Recherchez dans l’index de la documentation OpenClaw en ligne depuis le terminal.

## Utilisation

```bash
openclaw docs                       # afficher le point d’entrée de la documentation et un exemple de recherche
openclaw docs <query...>            # rechercher dans l’index de la documentation en ligne
```

| Argument     | Description                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `[query...]` | Requête de recherche libre. Les requêtes composées de plusieurs mots sont jointes par des espaces et envoyées en une fois. |

Sans requête, `openclaw docs` affiche l’URL du point d’entrée de la documentation et un exemple de commande de recherche au lieu d’effectuer une recherche.

## Exemples

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Fonctionnement

`openclaw docs` appelle `https://docs.openclaw.ai/api/search` et affiche les résultats JSON. La requête de recherche utilise un délai d’expiration fixe de 30 secondes.

## Sortie

Dans un terminal enrichi (TTY), les résultats s’affichent sous la forme d’un titre suivi d’une liste à puces : titre de la page, URL liée vers la documentation et court extrait sur la ligne suivante. En l’absence de résultats, « Aucun résultat. » s’affiche.

Dans une sortie non enrichie (redirigée, `--no-color`, scripts), les mêmes données s’affichent au format Markdown :

```markdown
# Recherche dans la documentation : <query>

- [Titre](https://docs.openclaw.ai/...) - extrait
- [Titre](https://docs.openclaw.ai/...) - extrait
```

## Codes de sortie

| Code | Signification                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------- |
| `0`  | La recherche a réussi, y compris lorsque la réponse ne contient aucun résultat.                   |
| `1`  | L’appel à l’API hébergée de recherche dans la documentation a échoué ; stderr affiche le message d’erreur. |

## Pages associées

- [Référence de la CLI](/fr/cli)
- [Documentation en ligne](https://docs.openclaw.ai)
