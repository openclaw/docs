---
read_when:
    - Modification du texte de l’invite système, de la liste des outils ou des sections relatives à l’heure et au Heartbeat
    - Modification du comportement d’amorçage de l’espace de travail ou d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Invite système
x-i18n:
    generated_at: "2026-07-12T02:36:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit sa propre invite système pour chaque exécution d’agent ; il n’existe aucune invite d’exécution par défaut.

L’assemblage comporte trois couches :

- `buildAgentSystemPrompt` génère l’invite à partir d’entrées explicites. Il reste un moteur de rendu pur et ne lit pas directement la configuration globale.
- `resolveAgentSystemPromptConfig` résout, pour un agent donné, les paramètres d’invite issus de la configuration (affichage du propriétaire, indications TTS, alias de modèles, mode de citation de la mémoire, mode de délégation aux sous-agents).
- Les adaptateurs d’exécution (intégré, CLI, aperçus de commande/export, compaction) recueillent les informations en temps réel (outils, état du bac à sable, capacités du canal, fichiers de contexte, contributions du fournisseur à l’invite) et appellent la façade d’invite configurée.

Cela maintient les surfaces d’invite exportées et de débogage alignées sur les exécutions réelles, sans transformer chaque détail d’exécution en un générateur monolithique unique.

Les Plugins de fournisseur peuvent fournir des consignes tenant compte du cache sans remplacer l’invite appartenant à OpenClaw. Une exécution de fournisseur peut :

- remplacer l’une des trois sections principales nommées : `interaction_style`, `tool_call_style`, `execution_bias`
- injecter un **préfixe stable** au-dessus de la limite du cache d’invite
- injecter un **suffixe dynamique** sous la limite du cache d’invite

Utilisez les contributions appartenant au fournisseur pour les ajustements propres à une famille de modèles. Réservez l’ancien hook `before_prompt_build` à la compatibilité ou aux modifications véritablement globales de l’invite.

La surcouche OpenAI/Codex intégrée pour la famille GPT-5 (`resolveGpt5SystemPromptContribution`) utilise ce mécanisme : un contrat de comportement `stablePrefix` (politique d’exécution, discipline d’utilisation des outils, contrat de sortie, contrat d’achèvement), ainsi qu’un remplacement facultatif de `interaction_style` pour adopter un ton plus convivial. Elle s’applique à tout identifiant de modèle `gpt-5*` acheminé par les Plugins OpenAI ou Codex et est contrôlée par `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` ou `"off"`).

## Structure

L’invite est compacte et comporte des sections fixes :

- **Outils** : rappel indiquant que les outils structurés constituent la source de vérité, accompagné de consignes d’utilisation des outils à l’exécution. Lorsque l’outil expérimental `update_plan` est activé (`tools.experimental.planTool`), sa propre description ajoute les consignes suivantes : ne l’utiliser que pour les tâches non triviales en plusieurs étapes, ne conserver au maximum qu’une seule étape `in_progress` et l’omettre pour les tâches simples en une seule étape.
- **Priorité à l’exécution** : agir pendant le tour sur les demandes exploitables, poursuivre jusqu’à l’achèvement ou jusqu’à un blocage, se rétablir après des résultats d’outils insuffisants, vérifier en temps réel les états susceptibles de changer et effectuer une vérification avant de finaliser.
- **Sécurité** : bref rappel des garde-fous contre les comportements visant à accroître le pouvoir ou à contourner la supervision.
- **Skills** (lorsqu’elles sont disponibles) : indique au modèle comment charger à la demande les instructions des Skills.
- **Contrôle d’OpenClaw** : privilégier l’outil `gateway` pour les opérations de configuration et de redémarrage ; ne pas inventer de commandes CLI.
- **Mise à jour automatique d’OpenClaw** : examiner la configuration en toute sécurité avec `config.schema.lookup`, la modifier avec `config.patch`, remplacer la configuration complète avec `config.apply` et exécuter `update.run` uniquement à la demande explicite de l’utilisateur. L’outil `gateway` exposé à l’agent refuse de réécrire `tools.exec.ask` / `tools.exec.security`, y compris les anciens alias `tools.bash.*` qui sont normalisés vers ces chemins protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local des documents/sources et circonstances dans lesquelles les consulter.
- **Fichiers de l’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus plus bas.
- **Bac à sable** (lorsqu’il est activé) : environnement d’exécution isolé, chemins du bac à sable et disponibilité de l’exécution avec élévation de privilèges.
- **Date et heure actuelles** : fuseau horaire uniquement (stable pour le cache ; l’horloge en temps réel provient de `session_status`).
- **Directives de sortie de l’assistant** : syntaxe compacte des pièces jointes, des notes vocales et des balises de réponse.
- **Heartbeats** : invite de Heartbeat et comportement d’accusé de réception lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Exécution** : hôte, système d’exploitation, Node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel accompagné d’une indication sur le commutateur `/reasoning`.

Le contenu stable volumineux (y compris le **contexte du projet**) reste au-dessus de la limite interne du cache d’invite. Les sections volatiles propres à chaque tour (consignes d’intégration de l’interface de contrôle, **messagerie**, **voix**, **contexte de discussion de groupe**, **réactions**, **Heartbeats**, **exécution**) sont ajoutées sous cette limite afin que les moteurs locaux dotés de caches de préfixes puissent réutiliser le préfixe stable de l’espace de travail entre les tours des canaux. Les descriptions d’outils doivent éviter d’intégrer les noms de canaux actuels lorsque le schéma accepté contient déjà ce détail d’exécution.

La section des outils contient également des consignes relatives aux tâches de longue durée :

- utiliser Cron pour les suivis futurs (`check back later`, rappels, tâches récurrentes) plutôt que des boucles de veille avec `exec`, des astuces de temporisation avec `yieldMs` ou des interrogations répétées avec `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent immédiatement et se poursuivent en arrière-plan
- lorsque le réveil automatique à l’achèvement est activé, démarrer la commande une seule fois et s’appuyer sur le mécanisme de réveil par notification
- utiliser `process` pour les journaux, l’état, les entrées ou les interventions sur une commande en cours d’exécution
- pour les tâches plus importantes, privilégier `sessions_spawn` ; l’achèvement des sous-agents repose sur des notifications et est automatiquement annoncé au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle dans le seul but d’attendre l’achèvement

`agents.defaults.subagents.delegationMode` (valeur par défaut : `"suggest"`) peut renforcer ce comportement. `"prefer"` ajoute une section dédiée **Délégation aux sous-agents**, qui demande à l’agent principal d’agir comme un coordinateur réactif et de transmettre via `sessions_spawn` tout ce qui dépasse une réponse directe. Cela ne concerne que l’invite ; la politique des outils continue de déterminer si `sessions_spawn` est disponible.

Les garde-fous de sécurité de l’invite système sont consultatifs et non contraignants. Pour une application stricte, utilisez la politique des outils, les approbations d’exécution, l’isolation et les listes d’autorisation des canaux ; les opérateurs peuvent désactiver intentionnellement les garde-fous de l’invite.

Sur les canaux dotés de cartes ou de boutons d’approbation natifs, l’invite demande à l’agent de s’appuyer en priorité sur cette interface et de n’inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique que les approbations par discussion sont indisponibles ou que l’approbation manuelle constitue la seule possibilité.

## Modes d’invite

OpenClaw génère des invites système plus petites pour les sous-agents. L’environnement d’exécution définit un `promptMode` par exécution (il ne s’agit pas d’une configuration exposée à l’utilisateur) :

- `full` (valeur par défaut) : toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet la section d’invite de mémoire (intégrée sous le nom **Rappel de la mémoire**), **Mise à jour automatique d’OpenClaw**, **Alias de modèles**, **Identité de l’utilisateur**, **Directives de sortie de l’assistant**, **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Les outils, la **sécurité**, les **Skills** (lorsqu’elles sont fournies), l’espace de travail, le bac à sable, la date et l’heure actuelles (lorsqu’elles sont connues), l’exécution et le contexte injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Avec `promptMode=minimal`, les invites injectées supplémentaires portent l’intitulé **Contexte du sous-agent** au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique des canaux, OpenClaw omet la section générique **Réponses silencieuses** lorsque le contexte direct, de groupe ou limité à l’outil de messagerie définit déjà le contrat de réponse visible. Seul l’ancien mode automatique de groupe/canal affiche `NO_REPLY` ; les discussions directes et les réponses limitées à l’outil de messagerie omettent les consignes relatives au jeton silencieux.

## Instantanés d’invite

OpenClaw conserve des instantanés d’invite validés pour le parcours nominal de l’environnement d’exécution Codex sous `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ils génèrent certains paramètres de fil/tour du serveur d’application ainsi qu’une pile reconstruite des couches d’invite transmises au modèle pour les tours de discussion directe Telegram, de groupe Discord et de Heartbeat : un instantané d’invite de modèle Codex `gpt-5.5` épinglé, le texte développeur d’autorisation du parcours nominal Codex, les instructions développeur d’OpenClaw, les instructions de mode de collaboration limitées au tour lorsqu’OpenClaw les fournit, l’entrée utilisateur du tour et les références aux spécifications dynamiques des outils.

Actualisez l’instantané épinglé de l’invite du modèle Codex avec `pnpm prompt:snapshots:sync-codex-model`. Par défaut, cette commande recherche `$CODEX_HOME/models_cache.json`, puis `~/.codex/models_cache.json`, puis le chemin conventionnel de l’extraction des responsables `~/code/codex/codex-rs/models-manager/models.json` ; si aucun de ces fichiers n’existe, elle se termine sans modifier l’instantané validé. Transmettez `--catalog <path>` pour effectuer l’actualisation à partir d’un fichier `models_cache.json` ou `models.json` précis.

Ces instantanés ne constituent pas une capture brute, octet par octet, d’une requête OpenAI. Codex peut ajouter du contexte d’espace de travail appartenant à l’environnement d’exécution (`AGENTS.md`, contexte d’environnement, mémoires, instructions d’application/de Plugin, instructions intégrées du mode de collaboration par défaut) après qu’OpenClaw a envoyé les paramètres du fil et du tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` ; vérifiez les écarts avec `pnpm prompt:snapshots:check`. L’intégration continue exécute la vérification des écarts avec les partitions supplémentaires de limites, afin que les modifications d’invite et les mises à jour des instantanés soient intégrées dans la même PR.

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

Dans le banc d’exécution natif Codex, OpenClaw évite de répéter les fichiers stables de l’espace de travail à chaque tour utilisateur. Codex charge `AGENTS.md` à l’aide de son propre mécanisme de découverte de la documentation du projet. `TOOLS.md` est transmis sous forme d’instructions développeur Codex héritées. `SOUL.md`, `IDENTITY.md` et `USER.md` sont transmis sous forme d’instructions développeur de collaboration limitées au tour afin que les sous-agents Codex natifs ne les héritent pas. Le contenu de `HEARTBEAT.md` n’est pas injecté directement ; les tours de Heartbeat reçoivent une note de mode de collaboration pointant vers le fichier lorsqu’il existe et n’est pas vide. Le contenu de `MEMORY.md` n’est pas non plus inséré dans chaque tour Codex natif : lorsque des outils de mémoire sont disponibles pour l’espace de travail, les tours Codex reçoivent une courte note sur la mémoire de l’espace de travail qui oriente le modèle vers `memory_search` ou `memory_get`. Si les outils sont désactivés, si la recherche en mémoire est indisponible ou si l’espace de travail actif diffère de l’espace de travail de mémoire de l’agent, `MEMORY.md` revient au chemin normal de contexte de tour limité. `BOOTSTRAP.md` conserve son rôle normal de contexte de tour.

Sur les bancs d’exécution autres que Codex, les fichiers d’amorçage sont intégrés à l’invite OpenClaw conformément à leurs conditions existantes. `HEARTBEAT.md` est omis lors des exécutions normales lorsque les Heartbeats sont désactivés pour l’agent par défaut ou que `agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés concis, en particulier le fichier `MEMORY.md` hors Codex : il doit rester un résumé à long terme soigneusement sélectionné, les notes quotidiennes détaillées étant stockées dans `memory/*.md` et récupérables à la demande via `memory_search` / `memory_get`. Les fichiers `MEMORY.md` hors Codex trop volumineux augmentent l’utilisation de l’invite et peuvent être partiellement injectés selon les limites des fichiers d’amorçage ci-dessous.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du contexte normal d’amorçage du projet. Lors des tours ordinaires, ils sont consultés à la demande via `memory_search` / `memory_get` ; ils ne sont donc pas comptabilisés dans la fenêtre de contexte, sauf si le modèle les lit explicitement. Les tours contenant uniquement `/new` ou `/reset` constituent l’exception : l’environnement d’exécution peut faire précéder ce premier tour de souvenirs quotidiens récents sous la forme d’un bloc ponctuel de contexte de démarrage.
</Note>

Les fichiers volumineux sont tronqués avec un marqueur :

| Limite                                       | Clé de configuration                               | Valeur par défaut |
| -------------------------------------------- | -------------------------------------------------- | ----------------- |
| Nombre maximal de caractères par fichier     | `agents.defaults.bootstrapMaxChars`                | 20000             |
| Total pour l’ensemble des fichiers           | `agents.defaults.bootstrapTotalMaxChars`           | 60000             |
| Avertissement de troncature (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always`          |

Les fichiers manquants injectent un court marqueur signalant leur absence. Les nombres détaillés de caractères bruts et injectés restent disponibles dans les diagnostics tels que `/context`, `/status`, doctor et les journaux.

Pour les fichiers de mémoire, la troncature n’entraîne aucune perte de données : le fichier reste intact sur le disque. Dans Codex natif, `MEMORY.md` est lu à la demande au moyen des outils de mémoire lorsqu’ils sont disponibles, avec un repli vers une invite limitée dans le cas contraire. Sur les autres bancs d’exécution, le modèle ne voit que la copie injectée raccourcie jusqu’à ce qu’il lise la mémoire ou y effectue directement une recherche. Si `MEMORY.md` est tronqué de manière répétée, condensez-le en un résumé durable plus court, déplacez l’historique détaillé vers `memory/*.md` ou augmentez intentionnellement les limites d’amorçage.

Les sessions de sous-agents injectent uniquement `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage sont filtrés afin de limiter le contexte des sous-agents).

Des hooks internes peuvent intercepter cette étape via l’événement `agent:bootstrap` afin de modifier ou remplacer les fichiers d’amorçage injectés (par exemple, en remplaçant `SOUL.md` par une autre personnalité).

Pour adopter un ton moins générique, commencez par le [guide de personnalité SOUL.md](/fr/concepts/soul).

Pour examiner la contribution de chaque fichier injecté (contenu brut ou injecté, troncature, surcharge du schéma des outils), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

La section **Date et heure actuelles** apparaît uniquement lorsque le fuseau horaire de l’utilisateur est connu et n’inclut que le **fuseau horaire** (sans horloge dynamique ni format d’heure), afin de préserver la stabilité du cache de l’invite.

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; sa fiche d’état comprend une ligne d’horodatage. Le même outil permet éventuellement de définir un modèle différent pour chaque session (`model=default` le réinitialise).

Configuration :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Fuseaux horaires](/fr/concepts/timezone) et [Date et heure](/fr/date-time) pour obtenir tous les détails sur le comportement.

## Skills

Lorsque des Skills admissibles existent, OpenClaw injecte une liste compacte `<available_skills>` (`formatSkillsForPrompt`) comprenant le **chemin du fichier** et, pour chaque Skill, un marqueur `<version>sha256:...</version>` dérivé de son contenu. L’invite demande au modèle d’utiliser `read` pour charger le fichier SKILL.md à l’emplacement indiqué (espace de travail, emplacement géré ou intégré) et de relire un Skill lorsque sa `<version>` diffère de celle du tour précédent. Si aucun Skill n’est admissible, la section Skills est omise.

Les tours Codex natifs reçoivent cette liste sous forme d’instructions de développement collaboratif limitées au tour, plutôt que comme une entrée utilisateur à chaque tour, à l’exception des tours Cron légers qui préservent exactement l’invite planifiée. Les autres environnements d’exécution conservent la section normale de l’invite.

L’emplacement peut désigner un Skill imbriqué, tel que `skills/personal/foo/SKILL.md`. L’imbrication est uniquement organisationnelle ; l’invite utilise le nom de Skill non hiérarchique défini dans le frontmatter de `SKILL.md`.

L’admissibilité tient compte des critères des métadonnées du Skill, des vérifications de l’environnement d’exécution et de la configuration, ainsi que de la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou `agents.list[].skills` est configuré. Les Skills intégrés à un Plugin ne sont admissibles que lorsque le Plugin qui les possède est activé, ce qui permet aux Plugins d’outils de proposer des guides d’utilisation plus détaillés sans intégrer toutes ces instructions dans chaque description d’outil.

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

Cela permet de conserver une invite de base concise tout en autorisant une utilisation ciblée des Skills. Le dimensionnement relève du sous-système des Skills, indépendamment du dimensionnement générique de la lecture et de l’injection lors de l’exécution :

| Portée       | Budget de l’invite des Skills                     | Budget des extraits d’exécution    |
| ------------ | ------------------------------------------------- | ---------------------------------- |
| Globale      | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*`  |
| Par agent    | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`    |

Le budget des extraits d’exécution couvre `memory_get`, les résultats d’outils en direct et les actualisations de `AGENTS.md` après la Compaction.

## Documentation

La section **Documentation** renvoie vers la documentation locale lorsqu’elle est disponible (`docs/` dans une extraction Git ou la documentation intégrée au paquet npm), avec un repli sur [https://docs.openclaw.ai](https://docs.openclaw.ai) dans le cas contraire. Elle indique également l’emplacement du code source d’OpenClaw : les extractions Git exposent la racine locale du code source, tandis que les installations de paquets fournissent l’URL du code source sur GitHub avec des instructions invitant à l’y consulter lorsque la documentation est incomplète ou obsolète.

L’invite présente la documentation comme la référence pour les connaissances d’OpenClaw sur lui-même avant que le modèle ne comprenne son fonctionnement (mémoire et notes quotidiennes, sessions, outils, Gateway, configuration, commandes, contexte du projet). Elle indique au modèle de considérer `AGENTS.md`, le contexte du projet, les notes de l’espace de travail, du profil et de la mémoire, ainsi que `memory_search`, comme un contexte d’instructions ou une mémoire utilisateur plutôt que comme des connaissances sur la conception ou l’implémentation d’OpenClaw. Si la documentation est muette ou obsolète, le modèle doit le signaler et examiner le code source. Elle lui demande également d’exécuter lui-même `openclaw status` lorsque cela est possible et de ne solliciter l’utilisateur que s’il n’y a pas accès.

Pour la configuration en particulier, elle oriente les agents vers l’action `config.schema.lookup` de l’outil `gateway` afin d’obtenir la documentation et les contraintes exactes de chaque champ, puis vers `docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md` pour des conseils plus généraux.

## Pages connexes

- [Environnement d’exécution de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
