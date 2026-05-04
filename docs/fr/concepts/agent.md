---
read_when:
    - Modification de l’environnement d’exécution de l’agent, de l’amorçage de l’espace de travail ou du comportement de session
summary: Environnement d’exécution de l’agent, contrat d’espace de travail et amorçage de session
title: Environnement d’exécution de l’agent
x-i18n:
    generated_at: "2026-05-04T02:22:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw exécute un **runtime d’agent intégré unique** — un processus d’agent par
Gateway, avec son propre espace de travail, ses fichiers d’amorçage et son magasin de sessions. Cette page
couvre ce contrat de runtime : ce que l’espace de travail doit contenir, quels fichiers sont
injectés et comment les sessions s’amorcent avec lui.

## Espace de travail (obligatoire)

OpenClaw utilise un seul répertoire d’espace de travail d’agent (`agents.defaults.workspace`) comme **seul** répertoire de travail (`cwd`) de l’agent pour les outils et le contexte.

Recommandé : utilisez `openclaw setup` pour créer `~/.openclaw/openclaw.json` s’il est absent et initialiser les fichiers de l’espace de travail.

Disposition complète de l’espace de travail + guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent remplacer cela par
des espaces de travail par session sous `agents.defaults.sandbox.workspaceRoot` (voir
[Configuration du Gateway](/fr/gateway/configuration)).

## Fichiers d’amorçage (injectés)

Dans `agents.defaults.workspace`, OpenClaw attend ces fichiers modifiables par l’utilisateur :

- `AGENTS.md` — instructions opérationnelles + « mémoire »
- `SOUL.md` — persona, limites, ton
- `TOOLS.md` — notes d’outils maintenues par l’utilisateur (par ex. `imsg`, `sag`, conventions)
- `BOOTSTRAP.md` — rituel unique de première exécution (supprimé après exécution)
- `IDENTITY.md` — nom/ambiance/emoji de l’agent
- `USER.md` — profil utilisateur + forme d’adresse préférée

Au premier tour d’une nouvelle session, OpenClaw injecte le contenu de ces fichiers dans le contexte de projet du prompt système.

Les fichiers vides sont ignorés. Les fichiers volumineux sont raccourcis et tronqués avec un marqueur afin que les prompts restent légers (lisez le fichier pour obtenir le contenu complet).

Si un fichier est absent, OpenClaw injecte une seule ligne de marqueur « fichier manquant » (et `openclaw setup` créera un modèle par défaut sûr).

`BOOTSTRAP.md` n’est créé que pour un **tout nouvel espace de travail** (aucun autre fichier d’amorçage présent). Tant qu’il est en attente, OpenClaw le conserve dans le contexte de projet et ajoute des consignes d’amorçage au prompt système pour le rituel initial, au lieu de le copier dans le message utilisateur. Si vous le supprimez après avoir terminé le rituel, il ne devrait pas être recréé lors des redémarrages ultérieurs.

Pour désactiver entièrement la création des fichiers d’amorçage (pour les espaces de travail préremplis), définissez :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Outils intégrés

Les outils principaux (read/exec/edit/write et outils système associés) sont toujours disponibles,
sous réserve de la politique d’outils. `apply_patch` est facultatif et contrôlé par
`tools.exec.applyPatch`. `TOOLS.md` ne contrôle **pas** quels outils existent ; il
sert de consigne sur la manière dont _vous_ voulez qu’ils soient utilisés.

## Skills

OpenClaw charge les Skills depuis ces emplacements (priorité la plus élevée en premier) :

- Espace de travail : `<workspace>/skills`
- Skills d’agent de projet : `<workspace>/.agents/skills`
- Skills d’agent personnels : `~/.agents/skills`
- Gérés/locaux : `~/.openclaw/skills`
- Intégrés (livrés avec l’installation)
- Dossiers de Skills supplémentaires : `skills.load.extraDirs`

Les Skills peuvent être contrôlées par configuration/env (voir `skills` dans [Configuration du Gateway](/fr/gateway/configuration)).

## Limites du runtime

Le runtime d’agent intégré repose sur le cœur d’agent Pi (modèles, outils et
pipeline de prompt). La gestion des sessions, la découverte, le câblage des outils et la
livraison aux canaux sont des couches possédées par OpenClaw au-dessus de ce cœur.

## Sessions

Les transcriptions de session sont stockées en JSONL à :

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L’ID de session est stable et choisi par OpenClaw.
Les anciens dossiers de sessions provenant d’autres outils ne sont pas lus.

## Pilotage pendant le streaming

Lorsque le mode de file d’attente est `steer`, les messages entrants sont injectés dans l’exécution en cours.
Le pilotage mis en file est livré **après que le tour actuel de l’assistant a fini
d’exécuter ses appels d’outils**, avant le prochain appel LLM. Pi draine tous les messages de
pilotage en attente ensemble pour `steer` ; l’ancien mode `queue` draine un message par
frontière de modèle. Le pilotage ne saute plus les appels d’outils restants du message
actuel de l’assistant.

Lorsque le mode de file d’attente est `followup` ou `collect`, les messages entrants sont conservés jusqu’à la
fin du tour actuel, puis un nouveau tour d’agent commence avec les charges utiles en file. Voir
[File d’attente](/fr/concepts/queue) et [File de pilotage](/fr/concepts/queue-steering) pour le comportement des modes
et des frontières.

Le streaming par blocs envoie les blocs d’assistant terminés dès qu’ils se terminent ; il est
**désactivé par défaut** (`agents.defaults.blockStreamingDefault: "off"`).
Ajustez la frontière via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end` ; valeur par défaut : text_end).
Contrôlez la segmentation souple des blocs avec `agents.defaults.blockStreamingChunk` (par défaut
800 à 1200 caractères ; préfère les sauts de paragraphe, puis les retours à la ligne ; les phrases en dernier).
Regroupez les fragments streamés avec `agents.defaults.blockStreamingCoalesce` pour réduire
le spam de lignes uniques (fusion fondée sur l’inactivité avant envoi). Les canaux non-Telegram nécessitent
un `*.blockStreaming: true` explicite pour activer les réponses par blocs.
Les résumés détaillés d’outils sont émis au démarrage de l’outil (sans debounce) ; Control UI
streame la sortie des outils via les événements d’agent lorsqu’ils sont disponibles.
Plus de détails : [Streaming + segmentation](/fr/concepts/streaming).

## Références de modèles

Les références de modèles dans la configuration (par exemple `agents.defaults.model` et `agents.defaults.models`) sont analysées en séparant sur le **premier** `/`.

- Utilisez `provider/model` lors de la configuration des modèles.
- Si l’ID du modèle lui-même contient `/` (style OpenRouter), incluez le préfixe de fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique
  avec un fournisseur configuré pour cet ID de modèle exact, et seulement ensuite se rabat
  sur le fournisseur par défaut configuré. Si ce fournisseur n’expose plus le
  modèle par défaut configuré, OpenClaw se rabat sur le premier
  fournisseur/modèle configuré au lieu de faire apparaître un défaut obsolète de fournisseur supprimé.

## Configuration (minimale)

Au minimum, définissez :

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortement recommandé)

---

_Suivant : [Discussions de groupe](/fr/channels/group-messages)_ 🦞

## Associés

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Gestion des sessions](/fr/concepts/session)
