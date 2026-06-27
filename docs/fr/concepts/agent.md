---
read_when:
    - Modification de l’exécution des agents, de l’amorçage de l’espace de travail ou du comportement des sessions
summary: Runtime de l’agent, contrat de workspace et amorçage de session
title: Environnement d’exécution de l’agent
x-i18n:
    generated_at: "2026-06-27T17:23:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw exécute un **runtime d’agent intégré unique** - un processus d’agent par
Gateway, avec son propre espace de travail, ses fichiers d’amorçage et son magasin de sessions. Cette page
couvre ce contrat de runtime : ce que l’espace de travail doit contenir, quels fichiers sont
injectés et comment les sessions s’amorcent avec lui.

## Espace de travail (obligatoire)

OpenClaw utilise un seul répertoire d’espace de travail d’agent (`agents.defaults.workspace`) comme **unique** répertoire de travail (`cwd`) de l’agent pour les outils et le contexte.

Recommandé : utilisez `openclaw setup` pour créer `~/.openclaw/openclaw.json` s’il manque et initialiser les fichiers de l’espace de travail.

Disposition complète de l’espace de travail + guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent remplacer cela par
des espaces de travail par session sous `agents.defaults.sandbox.workspaceRoot` (voir
[Configuration du Gateway](/fr/gateway/configuration)).

## Fichiers d’amorçage (injectés)

Dans `agents.defaults.workspace`, OpenClaw attend ces fichiers modifiables par l’utilisateur :

- `AGENTS.md` - instructions de fonctionnement + « mémoire »
- `SOUL.md` - persona, limites, ton
- `TOOLS.md` - notes d’outils maintenues par l’utilisateur (par ex. `imsg`, `sag`, conventions)
- `BOOTSTRAP.md` - rituel unique de première exécution (supprimé après achèvement)
- `IDENTITY.md` - nom/ambiance/emoji de l’agent
- `USER.md` - profil utilisateur + formule d’adresse préférée

Au premier tour d’une nouvelle session, OpenClaw injecte le contenu de ces fichiers dans le Contexte du projet du prompt système.

Les fichiers vides sont ignorés. Les fichiers volumineux sont réduits et tronqués avec un marqueur afin que les prompts restent légers (lisez le fichier pour le contenu complet).

Si un fichier manque, OpenClaw injecte une seule ligne de marqueur « fichier manquant » (et `openclaw setup` créera un modèle par défaut sûr).

`BOOTSTRAP.md` n’est créé que pour un **tout nouvel espace de travail** (aucun autre fichier d’amorçage présent). Tant qu’il est en attente, OpenClaw le conserve dans le Contexte du projet et ajoute des consignes d’amorçage au prompt système pour le rituel initial au lieu de le copier dans le message utilisateur. Si vous le supprimez après avoir terminé le rituel, il ne doit pas être recréé lors de redémarrages ultérieurs.

Après qu’un espace de travail a été observé, OpenClaw conserve également un marqueur d’attestation du répertoire d’état pour le chemin de l’espace de travail. Si un espace de travail attesté récemment disparaît ou est effacé, le démarrage refuse de réamorcer silencieusement `BOOTSTRAP.md`; restaurez l’espace de travail ou utilisez une réinitialisation complète de l’onboarding afin que l’espace de travail et le marqueur soient effacés ensemble.

Pour désactiver entièrement la création des fichiers d’amorçage (pour les espaces de travail préremplis), définissez :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Outils intégrés

Les outils principaux (read/exec/edit/write et outils système associés) sont toujours disponibles,
sous réserve de la politique d’outils. `apply_patch` est facultatif et contrôlé par
`tools.exec.applyPatch`. `TOOLS.md` ne contrôle **pas** quels outils existent ; il s’agit de
consignes sur la façon dont _vous_ voulez qu’ils soient utilisés.

## Skills

OpenClaw charge les Skills depuis ces emplacements (priorité la plus élevée en premier) :

- Espace de travail : `<workspace>/skills`
- Skills d’agent du projet : `<workspace>/.agents/skills`
- Skills d’agent personnelles : `~/.agents/skills`
- Géré/local : `~/.openclaw/skills`
- Intégrées (livrées avec l’installation)
- Dossiers de Skills supplémentaires : `skills.load.extraDirs`

Les racines de Skills peuvent contenir des dossiers groupés comme
`<workspace>/skills/personal/foo/SKILL.md`; la Skill reste exposée par son
nom plat de frontmatter, par exemple `foo`.

Les Skills peuvent être contrôlées par la config/l’env (voir `skills` dans [Configuration du Gateway](/fr/gateway/configuration)).

## Limites du runtime

Le runtime d’agent intégré appartient à OpenClaw : la découverte de modèles, le câblage des outils,
l’assemblage des prompts, la gestion des sessions et la livraison aux canaux partagent une seule
surface de runtime intégrée.

## Sessions

Les transcriptions de session sont stockées en JSONL à :

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L’ID de session est stable et choisi par OpenClaw.
Les anciens dossiers de session provenant d’autres outils ne sont pas lus.

## Pilotage pendant la diffusion en continu

Les prompts entrants qui arrivent en milieu d’exécution sont dirigés par défaut vers l’exécution en cours.
Le pilotage est livré **après que le tour assistant en cours a fini d’exécuter ses
appels d’outils**, avant le prochain appel LLM, et ne saute plus les appels d’outils restants
du message assistant en cours.

`/queue steer` est le comportement par défaut pour une exécution active. `/queue followup` et
`/queue collect` font attendre les messages jusqu’à un tour ultérieur au lieu de les piloter.
`/queue interrupt` abandonne plutôt l’exécution active. Voir [File d’attente](/fr/concepts/queue)
et [File d’attente de pilotage](/fr/concepts/queue-steering) pour le comportement de file d’attente et de limite.

La diffusion par blocs envoie les blocs assistant terminés dès qu’ils se terminent ; elle est
**désactivée par défaut** (`agents.defaults.blockStreamingDefault: "off"`).
Réglez la limite via `agents.defaults.blockStreamingBreak` (`text_end` contre `message_end`; valeur par défaut : text_end).
Contrôlez le découpage souple des blocs avec `agents.defaults.blockStreamingChunk` (valeur par défaut :
800-1200 caractères ; privilégie les sauts de paragraphe, puis les nouvelles lignes ; les phrases en dernier).
Fusionnez les fragments diffusés avec `agents.defaults.blockStreamingCoalesce` pour réduire
le spam sur une seule ligne (fusion basée sur l’inactivité avant l’envoi). Les canaux non Telegram exigent
`*.blockStreaming: true` explicite pour activer les réponses par blocs.
Les résumés d’outils détaillés sont émis au démarrage de l’outil (sans debounce) ; Control UI
diffuse la sortie d’outil via les événements d’agent lorsqu’ils sont disponibles.
Plus de détails : [Diffusion en continu + découpage](/fr/concepts/streaming).

## Réfs de modèle

Les réfs de modèle dans la config (par exemple `agents.defaults.model` et `agents.defaults.models`) sont analysées en scindant sur le **premier** `/`.

- Utilisez `provider/model` lors de la configuration des modèles.
- Si l’ID de modèle lui-même contient `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique
  de fournisseur configuré pour cet ID de modèle exact, et ne revient qu’ensuite
  au fournisseur par défaut configuré. Si ce fournisseur n’expose plus le
  modèle par défaut configuré, OpenClaw revient au premier
  fournisseur/modèle configuré au lieu d’exposer une valeur par défaut obsolète d’un fournisseur supprimé.

## Configuration (minimale)

Au minimum, définissez :

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortement recommandé)

---

_Suivant : [Discussions de groupe](/fr/channels/group-messages)_ 🦞

## Liens connexes

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Gestion des sessions](/fr/concepts/session)
