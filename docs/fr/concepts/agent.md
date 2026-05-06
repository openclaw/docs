---
read_when:
    - Modification de l’environnement d’exécution de l’agent, de l’amorçage de l’espace de travail ou du comportement de session
summary: Environnement d’exécution des agents, contrat d’espace de travail et initialisation de session
title: Environnement d’exécution de l’agent
x-i18n:
    generated_at: "2026-05-06T07:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw exécute un **runtime d’agent intégré unique** - un processus d’agent par
Gateway, avec son propre espace de travail, ses fichiers d’amorçage et son stockage de sessions. Cette page
couvre ce contrat de runtime : ce que l’espace de travail doit contenir, quels fichiers sont
injectés et comment les sessions s’amorcent avec celui-ci.

## Espace de travail (obligatoire)

OpenClaw utilise un seul répertoire d’espace de travail d’agent (`agents.defaults.workspace`) comme **seul** répertoire de travail (`cwd`) de l’agent pour les outils et le contexte.

Recommandé : utilisez `openclaw setup` pour créer `~/.openclaw/openclaw.json` s’il manque et initialiser les fichiers de l’espace de travail.

Disposition complète de l’espace de travail + guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent remplacer cela avec
des espaces de travail par session sous `agents.defaults.sandbox.workspaceRoot` (voir
[Configuration du Gateway](/fr/gateway/configuration)).

## Fichiers d’amorçage (injectés)

Dans `agents.defaults.workspace`, OpenClaw attend ces fichiers modifiables par l’utilisateur :

- `AGENTS.md` - instructions opérationnelles + « mémoire »
- `SOUL.md` - persona, limites, ton
- `TOOLS.md` - notes d’outils maintenues par l’utilisateur (par ex. `imsg`, `sag`, conventions)
- `BOOTSTRAP.md` - rituel de première exécution unique (supprimé après achèvement)
- `IDENTITY.md` - nom/ambiance/emoji de l’agent
- `USER.md` - profil utilisateur + formule d’adresse préférée

Au premier tour d’une nouvelle session, OpenClaw injecte le contenu de ces fichiers dans le Contexte du projet du prompt système.

Les fichiers vides sont ignorés. Les fichiers volumineux sont condensés et tronqués avec un marqueur afin que les prompts restent légers (lisez le fichier pour le contenu complet).

Si un fichier manque, OpenClaw injecte une seule ligne de marqueur « fichier manquant » (et `openclaw setup` créera un modèle par défaut sûr).

`BOOTSTRAP.md` est créé uniquement pour un **tout nouvel espace de travail** (aucun autre fichier d’amorçage présent). Tant qu’il est en attente, OpenClaw le conserve dans le Contexte du projet et ajoute des consignes d’amorçage au prompt système pour le rituel initial au lieu de le copier dans le message utilisateur. Si vous le supprimez après avoir terminé le rituel, il ne devrait pas être recréé lors des redémarrages ultérieurs.

Pour désactiver entièrement la création de fichiers d’amorçage (pour les espaces de travail préremplis), définissez :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Outils intégrés

Les outils principaux (read/exec/edit/write et outils système associés) sont toujours disponibles,
sous réserve de la politique d’outils. `apply_patch` est facultatif et contrôlé par
`tools.exec.applyPatch`. `TOOLS.md` ne contrôle **pas** quels outils existent ; c’est
une orientation sur la façon dont _vous_ voulez qu’ils soient utilisés.

## Skills

OpenClaw charge les Skills depuis ces emplacements (priorité la plus élevée en premier) :

- Espace de travail : `<workspace>/skills`
- Skills d’agent du projet : `<workspace>/.agents/skills`
- Skills d’agent personnels : `~/.agents/skills`
- Gérés/locaux : `~/.openclaw/skills`
- Intégrés (livrés avec l’installation)
- Dossiers de Skills supplémentaires : `skills.load.extraDirs`

Les Skills peuvent être contrôlés par la configuration/l’environnement (voir `skills` dans [Configuration du Gateway](/fr/gateway/configuration)).

## Limites du runtime

Le runtime d’agent intégré repose sur le cœur d’agent Pi (modèles, outils et
pipeline de prompts). La gestion des sessions, la découverte, le câblage des outils et la
livraison aux canaux sont des couches appartenant à OpenClaw au-dessus de ce cœur.

## Sessions

Les transcriptions de session sont stockées en JSONL à l’emplacement :

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L’ID de session est stable et choisi par OpenClaw.
Les anciens dossiers de session d’autres outils ne sont pas lus.

## Pilotage pendant le streaming

Lorsque le mode de file d’attente est `steer`, les messages entrants sont injectés dans l’exécution courante.
Le pilotage mis en file est livré **après que le tour d’assistant actuel a terminé
d’exécuter ses appels d’outils**, avant le prochain appel au LLM. Pi vide ensemble tous les messages de
pilotage en attente pour `steer` ; l’ancien mode `queue` vide un message par
frontière de modèle. Le pilotage ne saute plus les appels d’outils restants du message
d’assistant courant.

Lorsque le mode de file d’attente est `followup` ou `collect`, les messages entrants sont conservés jusqu’à la
fin du tour courant, puis un nouveau tour d’agent commence avec les charges utiles en file. Voir
[File d’attente](/fr/concepts/queue) et [File de pilotage](/fr/concepts/queue-steering) pour le comportement des modes
et des frontières.

Le streaming par blocs envoie les blocs d’assistant terminés dès qu’ils se terminent ; il est
**désactivé par défaut** (`agents.defaults.blockStreamingDefault: "off"`).
Ajustez la frontière via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end` ; valeur par défaut : text_end).
Contrôlez le découpage souple des blocs avec `agents.defaults.blockStreamingChunk` (valeur par défaut :
800-1200 caractères ; privilégie les ruptures de paragraphe, puis les nouvelles lignes ; les phrases en dernier).
Fusionnez les morceaux diffusés avec `agents.defaults.blockStreamingCoalesce` pour réduire
le spam sur une seule ligne (fusion basée sur l’inactivité avant l’envoi). Les canaux non Telegram nécessitent
un `*.blockStreaming: true` explicite pour activer les réponses par blocs.
Les résumés détaillés d’outils sont émis au démarrage de l’outil (sans temporisation) ; l’interface Control UI
diffuse la sortie des outils via les événements d’agent lorsqu’ils sont disponibles.
Plus de détails : [Streaming + découpage](/fr/concepts/streaming).

## Références de modèle

Les références de modèle dans la configuration (par exemple `agents.defaults.model` et `agents.defaults.models`) sont analysées en découpant sur le **premier** `/`.

- Utilisez `provider/model` lors de la configuration des modèles.
- Si l’ID de modèle lui-même contient `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique
  de fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite se rabat
  sur le fournisseur par défaut configuré. Si ce fournisseur n’expose plus le
  modèle par défaut configuré, OpenClaw se rabat sur le premier
  fournisseur/modèle configuré au lieu d’exposer une valeur par défaut obsolète de fournisseur supprimé.

## Configuration (minimale)

Au minimum, définissez :

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortement recommandé)

---

_Suivant : [Discussions de groupe](/fr/channels/group-messages)_ 🦞

## Connexe

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Gestion des sessions](/fr/concepts/session)
