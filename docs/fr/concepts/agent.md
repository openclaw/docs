---
read_when:
    - Modification de l’environnement d’exécution de l’agent, de l’amorçage de l’espace de travail ou du comportement des sessions
summary: Environnement d’exécution de l’agent, contrat de l’espace de travail et initialisation de la session
title: Environnement d’exécution de l’agent
x-i18n:
    generated_at: "2026-07-12T15:18:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e7b07f6db62c001d43e223eee28911b0515e1528e4b15c6c3748e88eaf405cfc
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw fournit un **environnement d’exécution d’agent intégré** : une boucle d’agent, un raccordement des outils et un assemblage des prompts intégrés, distincts de la délégation des tours à un processus d’orchestration externe. Chaque agent configuré (consultez [Routage multi-agent](/fr/concepts/multi-agent) pour en exécuter plusieurs) dispose de son propre espace de travail, de ses fichiers d’amorçage et de son stockage de sessions. Cette page décrit le contrat de cet environnement d’exécution : ce que l’espace de travail doit contenir, les fichiers qui sont injectés et la manière dont les sessions s’amorcent à partir de celui-ci.

## Espace de travail (obligatoire)

Chaque agent utilise un seul répertoire d’espace de travail (`agents.defaults.workspace`, ou `agents.list[].workspace` pour chaque agent) comme **unique** répertoire de travail (`cwd`) pour les outils et le contexte.

Recommandation : utilisez `openclaw setup` pour créer `~/.openclaw/openclaw.json` s’il est absent et initialiser les fichiers de l’espace de travail.

Structure complète de l’espace de travail et guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

Si `agents.defaults.sandbox` est activé, les sessions autres que la session principale peuvent remplacer ce répertoire par des espaces de travail propres à chaque session sous `agents.defaults.sandbox.workspaceRoot` (consultez [Configuration du Gateway](/fr/gateway/configuration)).

## Fichiers d’amorçage (injectés)

Dans l’espace de travail, OpenClaw attend les fichiers modifiables par l’utilisateur suivants :

| Fichier        | Fonction                                                        |
| -------------- | --------------------------------------------------------------- |
| `AGENTS.md`    | Instructions de fonctionnement et « mémoire »                    |
| `SOUL.md`      | Personnalité, limites, ton                                       |
| `TOOLS.md`     | Notes et conventions sur les outils, gérées par l’utilisateur    |
| `IDENTITY.md`  | Nom/ambiance/emoji de l’agent                                    |
| `USER.md`      | Profil utilisateur et forme d’adresse préférée                   |
| `HEARTBEAT.md` | Instructions propres au Heartbeat                                |
| `BOOTSTRAP.md` | Rituel unique de première exécution (supprimé après achèvement)  |
| `MEMORY.md`    | Fichier racine de mémoire à long terme, s’il est présent         |

Lors du premier tour d’une nouvelle session, OpenClaw injecte le contenu de ces fichiers dans le contexte de projet du prompt système. `MEMORY.md` n’est injecté que s’il existe à la racine de l’espace de travail.

Les fichiers vides sont ignorés. Les fichiers volumineux sont raccourcis et tronqués avec un marqueur afin de conserver des prompts légers (lisez le fichier pour obtenir son contenu intégral). Un fichier manquant (autre que `MEMORY.md`) injecte à la place une seule ligne de marqueur « fichier manquant » ; `openclaw setup` crée pour ce fichier un modèle par défaut sûr.

`BOOTSTRAP.md` n’est créé que pour un **tout nouvel espace de travail** (aucun autre fichier d’amorçage présent). Tant qu’il est en attente, OpenClaw le conserve dans le contexte de projet et ajoute au prompt système des instructions d’amorçage pour le rituel initial, au lieu de le copier dans le message utilisateur. Si vous le supprimez après avoir terminé le rituel, il n’est pas recréé lors des redémarrages ultérieurs.

Après qu’un espace de travail a été observé, OpenClaw conserve également dans le répertoire d’état un marqueur d’attestation associé au chemin de cet espace. Si un espace de travail récemment attesté disparaît ou est effacé, le démarrage refuse de recréer silencieusement `BOOTSTRAP.md` ; restaurez l’espace de travail ou effectuez une réinitialisation complète de l’intégration afin que l’espace de travail et le marqueur soient effacés ensemble.

Pour désactiver entièrement la création des fichiers d’amorçage (pour les espaces de travail préinitialisés), définissez :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Outils intégrés

Les outils principaux (lecture/exécution/modification/écriture et outils système associés) sont toujours disponibles, sous réserve de la politique des outils. `apply_patch` est activé par défaut pour les modèles OpenAI et contrôlé par `tools.exec.applyPatch` (`enabled`, `workspaceOnly`, `allowModels`). `TOOLS.md` ne détermine **pas** quels outils existent ; il fournit des consignes sur la manière dont _vous_ souhaitez qu’ils soient utilisés.

## Skills

OpenClaw charge les Skills depuis les emplacements suivants (par ordre de priorité décroissant) :

- Espace de travail : `<workspace>/skills`
- Skills d’agent du projet : `<workspace>/.agents/skills`
- Skills d’agent personnels : `~/.agents/skills`
- Gérés/locaux : `~/.openclaw/skills`
- Intégrés (fournis avec l’installation)
- Répertoires de Skills supplémentaires : `skills.load.extraDirs`

Les racines de Skills peuvent contenir des répertoires regroupés tels que `<workspace>/skills/personal/foo/SKILL.md` ; le Skill reste exposé sous le nom à plat défini dans son frontmatter, par exemple `foo`.

Les Skills peuvent être conditionnés par la configuration ou l’environnement (consultez `skills` dans [Configuration du Gateway](/fr/gateway/configuration)).

## Limites de l’environnement d’exécution

L’environnement d’exécution d’agent intégré appartient à OpenClaw : la découverte des modèles, le raccordement des outils, l’assemblage des prompts, la gestion des sessions et la livraison aux canaux partagent une même surface d’exécution intégrée.

## Sessions

Les lignes de session sont stockées dans la base de données SQLite propre à chaque agent :

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Les fichiers de transcription JSONL peuvent encore se trouver sous `~/.openclaw/agents/<agentId>/sessions/` comme entrées de migration héritées, archives supprimées ou réinitialisées, importations, exportations et artefacts d’assistance. L’historique actif de l’agent est stocké dans SQLite avec les lignes de session. L’identifiant de session est stable et choisi par OpenClaw. OpenClaw ne lit pas les répertoires de sessions provenant d’autres outils.

## Pilotage pendant la diffusion

Les prompts entrants qui arrivent pendant une exécution sont orientés par défaut vers l’exécution en cours. Le pilotage est transmis **après que le tour actuel de l’assistant a terminé d’exécuter ses appels d’outils**, avant l’appel suivant au LLM, et n’ignore plus les appels d’outils restants du message actuel de l’assistant.

`/queue steer` est le comportement par défaut pendant une exécution active. `/queue followup` et `/queue collect` font attendre les messages jusqu’à un tour ultérieur au lieu de les orienter. `/queue interrupt` interrompt l’exécution active. Consultez [File d’attente](/fr/concepts/queue) et [File d’attente de pilotage](/fr/concepts/queue-steering) pour connaître le comportement de la file d’attente et des limites.

La diffusion par blocs envoie les blocs terminés de l’assistant dès qu’ils sont prêts ; elle est **désactivée par défaut** (`agents.defaults.blockStreamingDefault: "off"`). Réglez la limite avec `agents.defaults.blockStreamingBreak` (`text_end` ou `message_end` ; valeur par défaut : `text_end`). Contrôlez le découpage souple des blocs avec `agents.defaults.blockStreamingChunk` (valeur par défaut : 800-1200 caractères ; privilégie les séparations de paragraphes, puis les sauts de ligne et, en dernier lieu, les phrases). Regroupez les fragments diffusés avec `agents.defaults.blockStreamingCoalesce` pour réduire la prolifération de lignes isolées (fusion fondée sur l’inactivité avant l’envoi). Les canaux autres que Telegram nécessitent l’activation explicite de `*.blockStreaming: true` pour permettre les réponses par blocs.
Les résumés détaillés des outils sont émis au démarrage de l’outil (sans anti-rebond) ; l’interface de contrôle diffuse la sortie des outils au moyen d’événements d’agent lorsqu’ils sont disponibles.
Plus de détails : [Diffusion et découpage](/fr/concepts/streaming).

## Références de modèles

Les références de modèles dans la configuration (par exemple `agents.defaults.model` et `agents.defaults.models`) sont analysées en les scindant au **premier** `/`.

- Utilisez `provider/model` lors de la configuration des modèles.
- Si l’identifiant du modèle contient lui-même `/` (à la manière d’OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique parmi les fournisseurs configurés pour cet identifiant exact de modèle, et ne revient qu’ensuite au fournisseur par défaut configuré. Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw utilise à la place le premier couple fournisseur/modèle configuré plutôt que de signaler une valeur par défaut obsolète provenant d’un fournisseur supprimé.

## Configuration (minimale)

Au minimum, définissez :

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortement recommandé)

## Voir aussi

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Gestion des sessions](/fr/concepts/session)
- [Discussions de groupe](/fr/channels/group-messages)
