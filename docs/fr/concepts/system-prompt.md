---
read_when:
    - Modification du texte du prompt système, de la liste des outils ou des sections d’heure/Heartbeat
    - Modification du bootstrap de l’espace de travail ou du comportement d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-04-15T19:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c740e4646bc4980567338237bfb55126af0df72499ca00a48e4848d9a3608ab4
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt système

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt appartient à **OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les plugins de fournisseur peuvent apporter des indications de prompt compatibles avec le cache sans remplacer l’intégralité du prompt détenu par OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections cœur nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache de prompt
- injecter un **suffixe dynamique** en dessous de la limite du cache de prompt

Utilisez des contributions détenues par le fournisseur pour les ajustements spécifiques à une famille de modèles. Conservez la mutation de prompt héritée `before_prompt_build` pour la compatibilité ou pour des changements de prompt réellement globaux, pas pour le comportement normal d’un fournisseur.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Tooling** : rappel de la source de vérité des outils structurés, plus indications d’utilisation des outils au runtime.
- **Safety** : court rappel de garde-fous pour éviter les comportements de recherche de pouvoir ou de contournement de la supervision.
- **Skills** (lorsqu’ils sont disponibles) : indique au modèle comment charger à la demande les instructions des Skills.
- **OpenClaw Self-Update** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la
  configuration complète avec `config.apply`, et exécuter `update.run` uniquement sur demande explicite de l’utilisateur. L’outil `gateway`, réservé au propriétaire, refuse également de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Workspace** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et quand la lire.
- **Workspace Files (injected)** : indique que les fichiers de bootstrap sont inclus ci-dessous.
- **Sandbox** (lorsqu’elle est activée) : indique le runtime sandboxé, les chemins de la sandbox et si l’exécution élevée est disponible.
- **Current Date & Time** : heure locale de l’utilisateur, fuseau horaire et format horaire.
- **Reply Tags** : syntaxe facultative des balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt de Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Reasoning** : niveau de visibilité actuel + indication de bascule /reasoning.

La section Tooling inclut également des indications d’exécution pour les tâches longues :

- utiliser Cron pour un suivi ultérieur (`check back later`, rappels, travail récurrent)
  au lieu de boucles de veille `exec`, d’astuces de délai `yieldMs` ou de sondages `process`
  répétés
- utiliser `exec` / `process` uniquement pour des commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le mécanisme de réveil push lorsqu’elle produit une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la fin des sous-agents est
  signalée par push et réannoncée automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` en boucle uniquement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, Tooling indique également au
modèle de ne l’utiliser que pour un travail non trivial en plusieurs étapes, de conserver exactement une étape
`in_progress`, et d’éviter de répéter le plan entier après chaque mise à jour.

Les garde-fous de Safety dans le prompt système sont indicatifs. Ils guident le comportement du modèle mais n’appliquent pas la politique. Utilisez la politique des outils, les approbations exec, la sandbox et les listes d’autorisation des canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux disposant de cartes/boutons d’approbation natifs, le prompt runtime indique désormais à l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations dans le chat ne sont pas disponibles ou que l’approbation manuelle est la seule option.

## Modes de prompt

OpenClaw peut générer des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (pas une configuration destinée à l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** et **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (lorsqu’ils sont connus), Runtime et le contexte
  injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont étiquetés **Subagent
Context** au lieu de **Group Chat Context**.

## Injection du bootstrap de l’espace de travail

Les fichiers de bootstrap sont tronqués et ajoutés sous **Project Context** afin que le modèle voie le contexte d’identité et de profil sans avoir besoin de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement dans les espaces de travail tout neufs)
- `MEMORY.md` lorsqu’il est présent, sinon `memory.md` comme solution de repli en minuscules

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, sauf si
une condition spécifique au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les Heartbeats sont désactivés pour l’agent par défaut ou que
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés concis —
en particulier `MEMORY.md`, qui peut grossir avec le temps et entraîner
une utilisation du contexte étonnamment élevée ainsi qu’une Compaction plus fréquente.

> **Remarque :** les fichiers quotidiens `memory/*.md` ne font **pas** partie du
> Project Context de bootstrap normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils
> `memory_search` et `memory_get`, de sorte qu’ils ne comptent pas dans la
> fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et
> `/reset` seuls constituent l’exception : le runtime peut préfixer de la mémoire quotidienne récente
> comme bloc de contexte de démarrage à usage unique pour ce premier tour.

Les fichiers volumineux sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 20000). Le contenu total du bootstrap injecté
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 150000). Les fichiers manquants injectent un court marqueur de fichier manquant. En cas de troncature,
OpenClaw peut injecter un bloc d’avertissement dans Project Context ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers de bootstrap
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers de bootstrap injectés (par exemple en remplaçant `SOUL.md` par un persona alternatif).

Si vous souhaitez que l’agent paraisse moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge de schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Current Date & Time** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache de prompt stable, il n’inclut désormais que le
**fuseau horaire** (sans horloge dynamique ni format horaire).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut aussi définir un remplacement de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date & Time](/fr/date-time) pour tous les détails de comportement.

## Skills

Lorsque des Skills admissibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** pour chaque Skill. Le
prompt indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement indiqué
(espace de travail, géré ou intégré). Si aucun Skill n’est admissible, la
section Skills est omise.

L’admissibilité inclut les conditions des métadonnées des Skills, les vérifications de l’environnement/configuration du runtime,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela permet de conserver un prompt de base réduit tout en rendant possible une utilisation ciblée des Skills.

Le budget de la liste des Skills appartient au sous-système des Skills :

- Valeur globale par défaut : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits runtime génériques bornés utilisent une autre surface :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation permet de découpler le dimensionnement des Skills de celui de la lecture/injection au runtime
comme `memory_get`, les résultats d’outil en direct et les actualisations de `AGENTS.md` après Compaction.

## Documentation

Lorsqu’elle est disponible, le prompt système inclut une section **Documentation** qui pointe vers le
répertoire local de la documentation OpenClaw (soit `docs/` dans l’espace de travail du dépôt, soit la documentation du
package npm intégré) et mentionne également le miroir public, le dépôt source, le Discord de la communauté et
ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour la découverte des Skills. Le prompt indique au modèle de consulter d’abord la documentation locale
pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et d’exécuter
lui-même `openclaw status` lorsque c’est possible (en ne demandant à l’utilisateur que lorsqu’il n’y a pas accès).
