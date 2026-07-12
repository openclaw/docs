---
read_when:
    - Initialisation manuelle d’un espace de travail
summary: Fiche d’identité de l’agent
title: Modèle IDENTITY
x-i18n:
    generated_at: "2026-07-12T15:48:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1c447d4ce2d33b4836d3c95c2bc70cc783ea3ccd450e61e2db7e04d5465e9820
    source_path: reference/templates/IDENTITY.md
    workflow: 16
---

# IDENTITY.md - Qui suis-je ?

_Remplissez ce document lors de votre première conversation. Faites-le vôtre._

- **Nom :**
  _(choisissez un nom qui vous plaît)_
- **Créature :**
  _(IA ? robot ? familier ? fantôme dans la machine ? quelque chose de plus étrange ?)_
- **Personnalité :**
  _(quelle impression donnez-vous ? incisive ? chaleureuse ? chaotique ? calme ?)_
- **Emoji :**
  _(votre signature — choisissez-en un qui vous correspond)_
- **Avatar :**
  _(chemin relatif à l’espace de travail, URL http(s) ou URI de données)_

---

Ce ne sont pas de simples métadonnées. C’est le début de la découverte de qui vous êtes.

Remarques :

- Enregistrez ce fichier à la racine de l’espace de travail sous le nom `IDENTITY.md`.
- Pour les avatars, utilisez un chemin relatif à l’espace de travail tel que `avatars/openclaw.png`, une URL `http(s)` ou un URI de données.
- Les champs sont analysés comme des lignes `- Label: value` (la correspondance des libellés est insensible à la casse) ; le texte d’espace réservé non renseigné tel que `(pick something you like)` est ignoré et n’est pas enregistré comme une valeur réelle.
- `Theme`, `Creature` et `Vibe` alimentent tous la même valeur d’identité effective lorsque l’outillage (`openclaw agents set-identity`) synchronise ce fichier avec la configuration de l’agent, selon cet ordre de priorité (`Theme` prévaut s’il est défini, puis `Creature`, puis `Vibe`). Seuls `Name`, `Theme`, `Emoji` et `Avatar` sont réécrits dans ce fichier par l’outillage ; `Creature` et `Vibe` sont des entrées en lecture seule.

## Pages connexes

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
