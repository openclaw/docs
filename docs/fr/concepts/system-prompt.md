---
read_when:
    - Modification du texte du prompt système, de la liste des outils ou des sections relatives à l’heure/au Heartbeat
    - Modification du comportement d’amorçage de l’espace de travail ou d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Invite système
x-i18n:
    generated_at: "2026-07-12T15:23:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit sa propre invite système pour chaque exécution d’agent ; il n’existe aucune invite par défaut à l’exécution.

L’assemblage comporte trois couches :

- `buildAgentSystemPrompt` génère l’invite à partir d’entrées explicites. Il reste un moteur de rendu pur et ne lit pas directement la configuration globale.
- `resolveAgentSystemPromptConfig` résout, pour un agent donné, les paramètres d’invite issus de la configuration (affichage du propriétaire, indications TTS, alias de modèles, mode de citation de la mémoire, mode de délégation aux sous-agents).
- Les adaptateurs d’exécution (intégré, CLI, aperçus de commande/export, compaction) collectent les informations en direct (outils, état du bac à sable, capacités du canal, fichiers de contexte, contributions du fournisseur à l’invite) et appellent la façade d’invite configurée.

Cela maintient les surfaces d’invite exportées/de débogage alignées sur les exécutions réelles sans transformer tous les détails d’exécution en un unique générateur monolithique.

Les plugins de fournisseur peuvent apporter des instructions tenant compte du cache sans remplacer l’invite appartenant à OpenClaw. Un environnement d’exécution de fournisseur peut :

- remplacer l’une des trois sections principales nommées : `interaction_style`, `tool_call_style`, `execution_bias`
- injecter un **préfixe stable** au-dessus de la limite du cache d’invite
- injecter un **suffixe dynamique** sous la limite du cache d’invite

Utilisez les contributions appartenant au fournisseur pour les ajustements propres à une famille de modèles. Réservez le hook historique `before_prompt_build` à la compatibilité ou aux modifications véritablement globales de l’invite.

La surcouche OpenAI/Codex fournie pour la famille GPT-5 (`resolveGpt5SystemPromptContribution`) utilise ce mécanisme : un contrat de comportement `stablePrefix` (politique d’exécution, discipline d’utilisation des outils, contrat de sortie, contrat d’achèvement), accompagné d’un remplacement facultatif de `interaction_style` pour adopter un ton plus convivial. Elle s’applique à tout identifiant de modèle `gpt-5*` acheminé par les plugins OpenAI ou Codex et est contrôlée par `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` ou `"off"`).

## Structure

L’invite est compacte et comporte des sections fixes :

- **Outils** : rappel indiquant que les outils structurés constituent la source de vérité, accompagné d’instructions d’utilisation des outils à l’exécution. Lorsque l’outil expérimental `update_plan` est activé (`tools.experimental.planTool`), sa propre description ajoute : ne l’utiliser que pour les travaux non triviaux en plusieurs étapes, ne conserver au maximum qu’une étape `in_progress` et l’ignorer pour les travaux simples en une seule étape.
- **Priorité d’exécution** : agir dans le tour en cours sur les demandes réalisables, continuer jusqu’à l’achèvement ou au blocage, récupérer après des résultats d’outil insuffisants, vérifier en direct les états susceptibles de changer et effectuer une vérification avant de finaliser.
- **Sécurité** : bref rappel des garde-fous contre les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’ils sont disponibles) : indique au modèle comment charger à la demande les instructions des Skills.
- **Contrôle d’OpenClaw** : privilégier l’outil `gateway` pour les opérations de configuration/redémarrage ; ne pas inventer de commandes CLI.
- **Mise à jour automatique d’OpenClaw** : inspecter la configuration en toute sécurité avec `config.schema.lookup`, la modifier avec `config.patch`, remplacer l’intégralité de la configuration avec `config.apply` et exécuter `update.run` uniquement sur demande explicite de l’utilisateur. L’outil `gateway` destiné à l’agent refuse de réécrire `tools.exec.ask` / `tools.exec.security`, y compris les anciens alias `tools.bash.*` qui sont normalisés vers ces chemins protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local des documents/sources et circonstances dans lesquelles les consulter.
- **Fichiers de l’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus ci-dessous.
- **Bac à sable** (lorsqu’il est activé) : environnement d’exécution isolé, chemins du bac à sable, disponibilité de l’exécution avec élévation de privilèges.
- **Date et heure actuelles** : fuseau horaire uniquement (stable pour le cache ; l’horloge en direct provient de `session_status`).
- **Directives de sortie de l’assistant** : syntaxe compacte pour les pièces jointes, notes vocales et balises de réponse.
- **Heartbeats** : invite de Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Environnement d’exécution** : hôte, système d’exploitation, Node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel et indication du commutateur `/reasoning`.

Le contenu stable volumineux (y compris le **Contexte du projet**) reste au-dessus de la limite interne du cache d’invite. Les sections volatiles propres à chaque tour (instructions d’intégration de l’interface de contrôle, **Messagerie**, **Voix**, **Contexte de discussion de groupe**, **Réactions**, **Heartbeats**, **Environnement d’exécution**) sont ajoutées sous cette limite afin que les moteurs locaux dotés de caches de préfixes puissent réutiliser le préfixe stable de l’espace de travail entre les tours de différents canaux. Les descriptions d’outils doivent éviter d’intégrer les noms actuels des canaux lorsque le schéma accepté contient déjà ce détail d’exécution.

La section Outils comporte également des instructions pour les travaux de longue durée :

- utiliser cron pour le suivi futur (`check back later`, rappels, travaux récurrents) plutôt que des boucles d’attente `exec`, des astuces de temporisation `yieldMs` ou des interrogations répétées de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent immédiatement et continuent en arrière-plan
- lorsque le réveil automatique à l’achèvement est activé, lancer la commande une seule fois et s’appuyer sur le mécanisme de réveil par envoi
- utiliser `process` pour les journaux, l’état, les entrées ou les interventions sur une commande en cours d’exécution
- pour les tâches plus importantes, privilégier `sessions_spawn` ; l’achèvement d’un sous-agent est transmis automatiquement et annoncé au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle dans le seul but d’attendre l’achèvement

`agents.defaults.subagents.delegationMode` (valeur par défaut : `"suggest"`) peut renforcer ce comportement. `"prefer"` ajoute une section dédiée **Délégation aux sous-agents** indiquant à l’agent principal d’agir comme un coordinateur réactif et de confier via `sessions_spawn` tout travail plus élaboré qu’une réponse directe. Cela ne concerne que l’invite ; la politique des outils continue de déterminer si `sessions_spawn` est disponible.

Les garde-fous de sécurité de l’invite système sont consultatifs et ne constituent pas un mécanisme d’application. Utilisez la politique des outils, les approbations d’exécution, le bac à sable et les listes d’autorisation des canaux pour une application stricte ; les opérateurs peuvent désactiver intentionnellement les garde-fous de l’invite.

Sur les canaux dotés de cartes/boutons d’approbation natifs, l’invite indique à l’agent de s’appuyer en priorité sur cette interface et de n’inclure une commande manuelle `/approve` que lorsque le résultat de l’outil précise que les approbations dans la discussion sont indisponibles ou que l’approbation manuelle est la seule option.

## Modes d’invite

OpenClaw génère des invites système plus petites pour les sous-agents. L’environnement d’exécution définit un `promptMode` pour chaque exécution (il ne s’agit pas d’une configuration destinée à l’utilisateur) :

- `full` (valeur par défaut) : toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet la section d’invite de mémoire (intégrée sous le nom **Rappel de mémoire**), **Mise à jour automatique d’OpenClaw**, **Alias de modèles**, **Identité de l’utilisateur**, **Directives de sortie de l’assistant**, **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Les Outils, la **Sécurité**, les **Skills** (lorsqu’ils sont fournis), l’Espace de travail, le Bac à sable, la Date et l’heure actuelles (lorsqu’elles sont connues), l’Environnement d’exécution et le contexte injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Avec `promptMode=minimal`, les invites injectées supplémentaires portent le libellé **Contexte du sous-agent** au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique sur les canaux, OpenClaw omet la section générique **Réponses silencieuses** lorsque le contexte direct, de groupe ou limité à l’outil de messagerie définit déjà le contrat de réponse visible. Seul l’ancien mode automatique de groupe/canal affiche `NO_REPLY` ; les discussions directes et les réponses limitées à l’outil de messagerie omettent les instructions relatives au jeton silencieux.

## Instantanés d’invite

OpenClaw conserve des instantanés d’invite versionnés pour le chemin nominal de l’environnement d’exécution Codex sous `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ils génèrent certains paramètres de fil/tour du serveur d’application ainsi qu’une pile reconstituée de couches d’invite liées au modèle pour les tours de discussion directe Telegram, de groupe Discord et de Heartbeat : un fichier d’invite de modèle Codex `gpt-5.5` épinglé, le texte développeur des autorisations du chemin nominal Codex, les instructions développeur d’OpenClaw, les instructions de mode de collaboration limitées au tour lorsqu’OpenClaw les fournit, l’entrée utilisateur du tour et les références aux spécifications dynamiques des outils.

Actualisez le fichier d’invite de modèle Codex épinglé avec `pnpm prompt:snapshots:sync-codex-model`. Par défaut, la commande recherche `$CODEX_HOME/models_cache.json`, puis `~/.codex/models_cache.json`, puis le chemin conventionnel du dépôt de maintenance `~/code/codex/codex-rs/models-manager/models.json` ; si aucun de ces fichiers n’existe, elle se termine sans modifier le fichier versionné. Transmettez `--catalog <path>` pour effectuer l’actualisation depuis un fichier `models_cache.json` ou `models.json` précis.

Ces instantanés ne constituent pas une capture brute octet par octet d’une requête OpenAI. Codex peut ajouter un contexte d’espace de travail géré par l’environnement d’exécution (`AGENTS.md`, contexte d’environnement, souvenirs, instructions d’application/plugin, instructions intégrées du mode de collaboration Default) après l’envoi par OpenClaw des paramètres de fil et de tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` ; vérifiez les écarts avec `pnpm prompt:snapshots:check`. La CI exécute la vérification des écarts avec les partitions de limites supplémentaires, afin que les modifications d’invite et les mises à jour des instantanés soient intégrées dans la même PR.

## Injection de l’amorçage de l’espace de travail

Les fichiers d’amorçage sont résolus depuis l’espace de travail actif et acheminés vers la surface d’invite correspondant à leur durée de vie :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement dans les espaces de travail entièrement nouveaux)
- `MEMORY.md` lorsqu’il est présent

Dans le harnais Codex natif, OpenClaw évite de répéter les fichiers stables de l’espace de travail à chaque tour utilisateur. Codex charge `AGENTS.md` au moyen de son propre mécanisme de découverte des documents du projet. `TOOLS.md` est transmis comme instructions développeur Codex héritées. `SOUL.md`, `IDENTITY.md` et `USER.md` sont transmis comme instructions développeur de collaboration limitées au tour afin que les sous-agents Codex natifs ne les héritent pas. Le contenu de `HEARTBEAT.md` n’est pas injecté directement ; les tours de Heartbeat reçoivent une note de mode de collaboration qui renvoie vers le fichier lorsqu’il existe et n’est pas vide. Le contenu de `MEMORY.md` n’est pas non plus collé dans chaque tour Codex natif : lorsque les outils de mémoire sont disponibles dans l’espace de travail, les tours Codex reçoivent une brève note sur la mémoire de l’espace de travail indiquant au modèle d’utiliser `memory_search` ou `memory_get`. Si les outils sont désactivés, si la recherche en mémoire est indisponible ou si l’espace de travail actif diffère de celui de la mémoire de l’agent, `MEMORY.md` revient au chemin normal de contexte de tour limité. `BOOTSTRAP.md` conserve son rôle normal de contexte de tour.

Dans les harnais autres que Codex, les fichiers d’amorçage sont intégrés à l’invite OpenClaw conformément à leurs conditions existantes. `HEARTBEAT.md` est omis lors des exécutions normales lorsque les Heartbeats sont désactivés pour l’agent par défaut ou que `agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Conservez des fichiers injectés concis, en particulier le fichier `MEMORY.md` hors Codex : il doit rester un résumé à long terme soigneusement sélectionné, tandis que les notes quotidiennes détaillées doivent se trouver dans `memory/*.md` et pouvoir être récupérées à la demande via `memory_search` / `memory_get`. Les fichiers `MEMORY.md` hors Codex trop volumineux augmentent l’utilisation de l’invite et peuvent n’être que partiellement injectés en raison des limites des fichiers d’amorçage ci-dessous.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du Contexte du projet d’amorçage normal. Lors des tours ordinaires, ils sont consultés à la demande via `memory_search` / `memory_get` et ne sont donc pas comptabilisés dans la fenêtre de contexte, sauf si le modèle les lit explicitement. Les tours `/new` et `/reset` seuls constituent l’exception : l’environnement d’exécution peut ajouter au début les souvenirs quotidiens récents sous la forme d’un bloc ponctuel de contexte de démarrage pour ce premier tour.
</Note>

Les fichiers volumineux sont tronqués avec un marqueur :

| Limite                                       | Clé de configuration                               | Valeur par défaut |
| -------------------------------------------- | -------------------------------------------------- | ----------------- |
| Nombre maximal de caractères par fichier     | `agents.defaults.bootstrapMaxChars`                | 20000             |
| Total pour l’ensemble des fichiers           | `agents.defaults.bootstrapTotalMaxChars`           | 60000             |
| Avertissement de troncature (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always`          |

Les fichiers manquants injectent un court marqueur signalant leur absence. Les décomptes bruts/injectés détaillés restent disponibles dans les diagnostics tels que `/context`, `/status`, doctor et les journaux.

Pour les fichiers de mémoire, la troncature n’entraîne aucune perte de données : le fichier reste intact sur le disque. Dans Codex natif, `MEMORY.md` est lu à la demande au moyen des outils de mémoire lorsqu’ils sont disponibles, avec un repli limité dans l’invite dans le cas contraire. Dans les autres harnais, le modèle ne voit que la copie injectée raccourcie jusqu’à ce qu’il lise ou recherche directement la mémoire. Si `MEMORY.md` est tronqué de manière répétée, condensez-le en un résumé durable plus court, déplacez l’historique détaillé vers `memory/*.md` ou augmentez intentionnellement les limites d’amorçage.

Les sessions de sous-agents n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage sont filtrés afin de limiter le contexte des sous-agents).

Les hooks internes peuvent intercepter cette étape au moyen de l’événement `agent:bootstrap` afin de modifier ou de remplacer les fichiers d’amorçage injectés (par exemple, en remplaçant `SOUL.md` par une autre personnalité).

Pour adopter un ton moins générique, commencez par le [guide de personnalité SOUL.md](/fr/concepts/soul).

Pour examiner la contribution de chaque fichier injecté (contenu brut ou injecté, troncature, surcharge du schéma des outils), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

La section **Date et heure actuelles** apparaît uniquement lorsque le fuseau horaire de l’utilisateur est connu et ne contient que le **fuseau horaire** (sans horloge dynamique ni format d’heure), afin de préserver la stabilité du cache des prompts.

Utilisez `session_status` lorsque l’agent a besoin de connaître l’heure actuelle ; sa carte d’état contient une ligne d’horodatage. Le même outil peut éventuellement définir un remplacement du modèle propre à la session (`model=default` le supprime).

Configurez cette fonctionnalité avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Fuseaux horaires](/fr/concepts/timezone) et [Date et heure](/fr/date-time) pour connaître tous les détails du comportement.

## Skills

Lorsque des Skills admissibles existent, OpenClaw injecte une liste compacte `<available_skills>` (`formatSkillsForPrompt`) comprenant le **chemin du fichier** et, pour chaque Skill, un marqueur `<version>sha256:...</version>` dérivé de son contenu. Le prompt demande au modèle d’utiliser `read` pour charger le fichier SKILL.md à l’emplacement indiqué (espace de travail, géré ou intégré) et de relire un Skill lorsque sa valeur `<version>` diffère de celle du tour précédent. Si aucun Skill n’est admissible, la section Skills est omise.

Les tours Codex natifs reçoivent cette liste sous forme d’instructions de développement collaboratif limitées au tour, plutôt que comme entrée utilisateur à chaque tour, à l’exception des tours Cron légers, qui conservent exactement le prompt planifié. Les autres environnements d’exécution conservent la section habituelle du prompt.

L’emplacement peut désigner un Skill imbriqué, tel que `skills/personal/foo/SKILL.md`. L’imbrication sert uniquement à l’organisation ; le prompt utilise le nom à plat du Skill provenant du frontmatter de `SKILL.md`.

L’admissibilité tient compte des conditions définies par les métadonnées du Skill, des vérifications de l’environnement d’exécution et de la configuration, ainsi que de la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou `agents.list[].skills` est configuré. Les Skills intégrés à un Plugin ne sont admissibles que lorsque le Plugin propriétaire est activé, ce qui permet aux Plugins d’outils de fournir des guides d’utilisation plus détaillés sans intégrer l’ensemble de ces instructions dans chaque description d’outil.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Cela permet de conserver un prompt de base compact tout en autorisant l’utilisation ciblée des Skills. Le dimensionnement relève du sous-système des Skills, indépendamment du dimensionnement générique de la lecture et de l’injection lors de l’exécution :

| Portée     | Budget du prompt des Skills                       | Budget des extraits d’exécution   |
| ---------- | ------------------------------------------------- | --------------------------------- |
| Globale    | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*` |
| Par agent  | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`   |

Le budget des extraits d’exécution couvre `memory_get`, les résultats d’outils en direct et les actualisations de `AGENTS.md` après la Compaction.

## Documentation

La section **Documentation** renvoie vers la documentation locale lorsqu’elle est disponible (`docs/` dans un checkout Git ou dans la documentation intégrée au paquet npm), sinon elle utilise [https://docs.openclaw.ai](https://docs.openclaw.ai). Elle indique également l’emplacement du code source d’OpenClaw : les checkouts Git exposent la racine locale du code source, tandis que les installations de paquets fournissent l’URL du code source sur GitHub avec des instructions pour l’y consulter lorsque la documentation est incomplète ou obsolète.

Le prompt présente la documentation comme la référence faisant autorité pour les connaissances d’OpenClaw sur lui-même avant que le modèle ne comprenne son fonctionnement (mémoire/notes quotidiennes, sessions, outils, Gateway, configuration, commandes et contexte du projet). Il indique au modèle de considérer `AGENTS.md`, le contexte du projet, les notes de l’espace de travail, du profil et de la mémoire, ainsi que `memory_search`, comme un contexte d’instructions ou une mémoire utilisateur, et non comme des connaissances sur la conception ou l’implémentation d’OpenClaw. Si la documentation est muette ou obsolète, le modèle doit le signaler et examiner le code source. Il lui demande également d’exécuter lui-même `openclaw status` lorsque cela est possible, et de ne solliciter l’utilisateur que s’il n’y a pas accès.

Pour la configuration en particulier, il oriente les agents vers l’action `config.schema.lookup` de l’outil `gateway` pour obtenir la documentation et les contraintes exactes au niveau des champs, puis vers `docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md` pour des conseils plus généraux.

## Pages connexes

- [Environnement d’exécution de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
