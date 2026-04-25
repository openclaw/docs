---
read_when:
    - Modification du runtime de l’agent, du bootstrap de l’espace de travail ou du comportement de session
summary: Runtime de l’agent, contrat d’espace de travail et bootstrap de session
title: Runtime de l’agent
x-i18n:
    generated_at: "2026-04-25T13:44:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw exécute un **unique runtime d’agent intégré** — un processus d’agent par
Gateway, avec son propre espace de travail, ses fichiers de bootstrap et son magasin de sessions. Cette page
couvre ce contrat de runtime : ce que l’espace de travail doit contenir, quels fichiers sont
injectés et comment les sessions effectuent leur bootstrap à partir de celui-ci.

## Espace de travail (obligatoire)

OpenClaw utilise un unique répertoire d’espace de travail d’agent (`agents.defaults.workspace`) comme **seul** répertoire de travail (`cwd`) de l’agent pour les outils et le contexte.

Recommandé : utilisez `openclaw setup` pour créer `~/.openclaw/openclaw.json` s’il est absent et initialiser les fichiers de l’espace de travail.

Disposition complète de l’espace de travail + guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent remplacer cela avec
des espaces de travail par session sous `agents.defaults.sandbox.workspaceRoot` (voir
[Configuration de la Gateway](/fr/gateway/configuration)).

## Fichiers de bootstrap (injectés)

Dans `agents.defaults.workspace`, OpenClaw attend ces fichiers modifiables par l’utilisateur :

- `AGENTS.md` — instructions de fonctionnement + « mémoire »
- `SOUL.md` — persona, limites, ton
- `TOOLS.md` — notes sur les outils maintenues par l’utilisateur (par ex. `imsg`, `sag`, conventions)
- `BOOTSTRAP.md` — rituel unique de première exécution (supprimé après achèvement)
- `IDENTITY.md` — nom/style/emoji de l’agent
- `USER.md` — profil utilisateur + mode d’adresse préféré

Au premier tour d’une nouvelle session, OpenClaw injecte directement le contenu de ces fichiers dans le contexte de l’agent.

Les fichiers vides sont ignorés. Les fichiers volumineux sont rognés et tronqués avec un marqueur afin que les prompts restent légers (lisez le fichier pour le contenu complet).

Si un fichier est absent, OpenClaw injecte une seule ligne marqueur « fichier manquant » (et `openclaw setup` créera un modèle par défaut sûr).

`BOOTSTRAP.md` n’est créé que pour un **tout nouvel espace de travail** (aucun autre fichier de bootstrap présent). Si vous le supprimez après avoir terminé le rituel, il ne doit pas être recréé lors des redémarrages ultérieurs.

Pour désactiver entièrement la création de fichiers de bootstrap (pour des espaces de travail préamorcés), définissez :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Outils intégrés

Les outils principaux (read/exec/edit/write et outils système associés) sont toujours disponibles,
sous réserve de la politique d’outils. `apply_patch` est facultatif et contrôlé par
`tools.exec.applyPatch`. `TOOLS.md` ne **contrôle pas** quels outils existent ; il sert de
guide sur la façon dont _vous_ souhaitez qu’ils soient utilisés.

## Skills

OpenClaw charge les Skills depuis ces emplacements (priorité la plus élevée en premier) :

- Espace de travail : `<workspace>/skills`
- Skills d’agent du projet : `<workspace>/.agents/skills`
- Skills d’agent personnels : `~/.agents/skills`
- Gérés/locaux : `~/.openclaw/skills`
- Inclus (livrés avec l’installation)
- Dossiers de Skills supplémentaires : `skills.load.extraDirs`

Les Skills peuvent être contrôlés par config/env (voir `skills` dans [Configuration de la Gateway](/fr/gateway/configuration)).

## Limites du runtime

Le runtime d’agent intégré repose sur le noyau d’agent Pi (modèles, outils et
pipeline de prompts). La gestion des sessions, la découverte, le câblage des outils et la
livraison par canal sont des couches détenues par OpenClaw au-dessus de ce noyau.

## Sessions

Les transcriptions de session sont stockées au format JSONL à l’emplacement :

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

L’ID de session est stable et choisi par OpenClaw.
Les anciens dossiers de session provenant d’autres outils ne sont pas lus.

## Pilotage pendant le streaming

Lorsque le mode de file d’attente est `steer`, les messages entrants sont injectés dans l’exécution en cours.
Le pilotage mis en file d’attente est livré **après que le tour actuel de l’assistant a fini
d’exécuter ses appels d’outils**, avant l’appel LLM suivant. Le pilotage ne saute plus les
appels d’outils restants du message actuel de l’assistant ; il injecte le message mis en file d’attente
à la prochaine frontière de modèle à la place.

Lorsque le mode de file d’attente est `followup` ou `collect`, les messages entrants sont conservés jusqu’à la
fin du tour en cours, puis un nouveau tour d’agent démarre avec les charges utiles mises en file d’attente. Voir
[File d’attente](/fr/concepts/queue) pour le comportement de mode + debounce/plafond.

Le streaming par blocs envoie les blocs complets de l’assistant dès qu’ils sont terminés ; il est
**désactivé par défaut** (`agents.defaults.blockStreamingDefault: "off"`).
Ajustez la frontière via `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end` ; valeur par défaut : text_end).
Contrôlez le découpage souple des blocs avec `agents.defaults.blockStreamingChunk` (par défaut
800–1200 caractères ; préfère les sauts de paragraphe, puis les retours à la ligne ; les phrases en dernier).
Fusionnez les morceaux streamés avec `agents.defaults.blockStreamingCoalesce` pour réduire le
spam en ligne unique (fusion basée sur l’inactivité avant envoi). Les canaux non Telegram exigent
un `*.blockStreaming: true` explicite pour activer les réponses par blocs.
Les résumés d’outils verbeux sont émis au démarrage de l’outil (sans debounce) ; le Control UI
stream la sortie d’outil via les événements d’agent lorsque disponible.
Plus de détails : [Streaming + découpage](/fr/concepts/streaming).

## Références de modèle

Les références de modèle dans la configuration (par exemple `agents.defaults.model` et `agents.defaults.models`) sont analysées en séparant sur le **premier** `/`.

- Utilisez `provider/model` lors de la configuration des modèles.
- Si l’ID de modèle lui-même contient `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une
  correspondance unique de fournisseur configuré pour cet ID de modèle exact, et ensuite seulement revient
  au fournisseur par défaut configuré. Si ce fournisseur n’expose plus le
  modèle par défaut configuré, OpenClaw revient au premier
  fournisseur/modèle configuré au lieu d’exposer une valeur par défaut obsolète d’un fournisseur supprimé.

## Configuration (minimale)

Au minimum, définissez :

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortement recommandé)

---

_Suivant : [Discussions de groupe](/fr/channels/group-messages)_ 🦞

## Associé

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Gestion des sessions](/fr/concepts/session)
