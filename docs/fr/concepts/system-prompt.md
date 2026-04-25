---
read_when:
    - Modification du texte du prompt système, de la liste des outils ou des sections heure/Heartbeat
    - Modification du comportement de bootstrap de l’espace de travail ou d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-04-25T13:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt appartient **à OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les plugins de fournisseur peuvent ajouter des indications de prompt compatibles avec le cache sans remplacer
le prompt complet appartenant à OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections centrales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite de cache du prompt
- injecter un **suffixe dynamique** sous la limite de cache du prompt

Utilisez les contributions appartenant au fournisseur pour l’ajustement spécifique à une famille de modèles. Conservez la mutation de prompt héritée
`before_prompt_build` pour la compatibilité ou pour de véritables modifications globales du prompt, pas pour le comportement normal d’un fournisseur.

La surcouche de la famille OpenAI GPT-5 garde la règle d’exécution centrale réduite et ajoute
des indications spécifiques au modèle pour la fixation de persona, une sortie concise, la discipline des outils,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Tooling** : rappel de la source de vérité des outils structurés plus indications runtime sur l’utilisation des outils.
- **Execution Bias** : indications compactes de suivi d’exécution : agir dans le tour courant sur
  les demandes exploitables, continuer jusqu’à terminaison ou blocage, récupérer après des résultats d’outil
  faibles, vérifier l’état mutable en direct, et valider avant de finaliser.
- **Safety** : bref rappel de garde-fou pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (quand disponibles) : indique au modèle comment charger les instructions d’une skill à la demande.
- **OpenClaw Self-Update** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration
  complète avec `config.apply`, et exécuter `update.run` uniquement à la demande explicite de l’utilisateur. L’outil
  `gateway`, réservé au propriétaire, refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  normalisés vers ces chemins exec protégés.
- **Workspace** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (repo ou package npm) et quand la consulter.
- **Workspace Files (injected)** : indique que les fichiers bootstrap sont inclus ci-dessous.
- **Sandbox** (quand activé) : indique le runtime sandboxé, les chemins sandbox et si l’exécution élevée est disponible.
- **Current Date & Time** : heure locale de l’utilisateur, fuseau horaire et format horaire.
- **Reply Tags** : syntaxe facultative des balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, nœud, modèle, racine du repo (quand détectée), niveau de réflexion (une ligne).
- **Reasoning** : niveau actuel de visibilité + indication sur la bascule `/reasoning`.

La section Tooling inclut aussi des indications runtime pour les travaux de longue durée :

- utiliser cron pour les suivis futurs (`check back later`, rappels, travail récurrent)
  au lieu de boucles de veille `exec`, d’astuces de délai `yieldMs`, ou de sondages répétés de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- quand le réveil automatique à l’achèvement est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil push quand elle émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; l’achèvement des sous-agents est
  basé sur le push et est annoncé automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` en boucle juste pour attendre
  l’achèvement

Lorsque l’outil expérimental `update_plan` est activé, Tooling indique aussi au
modèle de ne l’utiliser que pour un travail multi-étapes non trivial, de conserver exactement une
étape `in_progress`, et d’éviter de répéter l’intégralité du plan après chaque mise à jour.

Les garde-fous de sécurité dans le prompt système sont indicatifs. Ils guident le comportement du modèle mais n’appliquent pas la politique. Utilisez la politique des outils, les approbations exec, le sandboxing et les listes d’autorisation des canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt runtime indique désormais à l’agent de
s’appuyer d’abord sur cette UI d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations par chat sont indisponibles ou
que l’approbation manuelle est la seule voie possible.

## Modes de prompt

OpenClaw peut rendre des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration visible par l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** et **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quand connue), Runtime et le
  contexte injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont libellés **Subagent
Context** au lieu de **Group Chat Context**.

## Injection du bootstrap workspace

Les fichiers bootstrap sont tronqués et ajoutés sous **Project Context** afin que le modèle voie le contexte d’identité et de profil sans nécessiter de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les workspaces tout neufs)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour sauf
si une règle spécifique au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les Heartbeats sont désactivés pour l’agent par défaut ou lorsque
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés concis —
en particulier `MEMORY.md`, qui peut grossir avec le temps et provoquer une utilisation de contexte
étonnamment élevée ainsi qu’une Compaction plus fréquente.

> **Remarque :** les fichiers quotidiens `memory/*.md` ne font **pas** partie du bootstrap normal
> Project Context. Lors des tours ordinaires, ils sont consultés à la demande via les outils
> `memory_search` et `memory_get`, et ne comptent donc pas dans la fenêtre de
> contexte sauf si le modèle les lit explicitement. Les tours `/new` et
> `/reset` seuls constituent l’exception : le runtime peut préfixer une memory quotidienne récente
> sous forme de bloc de contexte de démarrage ponctuel pour ce premier tour.

Les gros fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu bootstrap total injecté
sur l’ensemble des fichiers est limité par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans Project Context ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers bootstrap
sont filtrés afin de garder le contexte du sous-agent compact).

Les Hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour muter ou remplacer
les fichiers bootstrap injectés (par exemple en remplaçant `SOUL.md` par une persona alternative).

Si vous souhaitez rendre l’agent moins générique, commencez par le
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge du schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Context](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Current Date & Time** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache du prompt stable, elle n’inclut désormais que
le **fuseau horaire** (sans horloge dynamique ni format horaire).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte de statut
inclut une ligne d’horodatage. Le même outil peut aussi définir une substitution de modèle
par session (`model=default` l’efface).

Configuration via :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date & Time](/fr/date-time) pour le détail complet du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte de skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** pour chaque skill. Le
prompt indique au modèle d’utiliser `read` pour charger le fichier SKILL.md à l’emplacement
indiqué (workspace, managed ou bundled). Si aucune skill n’est éligible, la
section Skills est omise.

L’éligibilité inclut les règles de métadonnées de skill, les vérifications d’environnement/config runtime,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills bundled par un plugin ne sont éligibles que lorsque leur plugin propriétaire est activé.
Cela permet aux plugins d’outils d’exposer des guides d’exploitation plus approfondis sans intégrer toutes
ces indications directement dans chaque description d’outil.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela garde le prompt de base compact tout en permettant une utilisation ciblée des Skills.

Le budget de la liste de Skills appartient au sous-système Skills :

- Valeur globale par défaut : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits runtime génériques bornés utilisent une autre surface :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation permet de dimensionner séparément les Skills et le dimensionnement des lectures/injections runtime
comme `memory_get`, les résultats d’outil en direct et les actualisations post-Compaction de `AGENTS.md`.

## Documentation

Le prompt système inclut une section **Documentation**. Lorsque la documentation locale est disponible, elle
pointe vers le répertoire local de documentation OpenClaw (`docs/` dans un checkout Git ou la documentation
bundled du package npm). Si la documentation locale est indisponible, OpenClaw revient à
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut également l’emplacement du code source OpenClaw. Les checkouts Git exposent la racine locale
du code source afin que l’agent puisse inspecter directement le code. Les installations par package incluent l’URL
du code source GitHub et indiquent à l’agent de l’examiner lorsque la documentation est incomplète ou
obsolète. Le prompt mentionne également le miroir de documentation public, le Discord de la communauté et ClawHub
([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Il indique au modèle de
consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et
d’exécuter `openclaw status` lui-même lorsque c’est possible (ne demander à l’utilisateur que lorsqu’il n’a pas accès).

## Liens associés

- [Runtime d’agent](/fr/concepts/agent)
- [Workspace d’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
