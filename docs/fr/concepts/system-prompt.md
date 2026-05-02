---
read_when:
    - Modification du texte de l’invite système, de la liste des outils ou des sections relatives à l’heure/Heartbeat
    - Modifier le comportement d’amorçage de l’espace de travail ou d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Invite système
x-i18n:
    generated_at: "2026-05-02T22:18:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt est **propriété d’OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les plugins fournisseurs peuvent contribuer des consignes de prompt compatibles avec le cache sans remplacer
le prompt complet propriété d’OpenClaw. Le runtime fournisseur peut :

- remplacer un petit ensemble de sections cœur nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache de prompt
- injecter un **suffixe dynamique** sous la limite du cache de prompt

Utilisez les contributions propres au fournisseur pour l’ajustement spécifique aux familles de modèles. Conservez la mutation de prompt héritée
`before_prompt_build` pour la compatibilité ou les changements de prompt réellement globaux,
pas pour le comportement fournisseur normal.

La surcouche de la famille OpenAI GPT-5 garde la règle d’exécution cœur réduite et ajoute
des consignes spécifiques au modèle pour l’ancrage de persona, la concision de la sortie, la discipline d’outil,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Outillage** : rappel de la source de vérité des outils structurés, plus consignes d’utilisation des outils au runtime.
- **Biais d’exécution** : consignes compactes de suivi : agir pendant le tour sur
  les demandes actionnables, continuer jusqu’à la fin ou jusqu’au blocage, récupérer après de faibles résultats d’outil,
  vérifier l’état mutable en direct et vérifier avant de finaliser.
- **Sécurité** : court rappel des garde-fous pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’elles sont disponibles) : indique au modèle comment charger les instructions de Skills à la demande.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration complète
  avec `config.apply` et exécuter `update.run` uniquement sur demande explicite de l’utilisateur.
  L’outil réservé au propriétaire `gateway` refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou paquet npm) et quand la lire.
- **Fichiers de l’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus ci-dessous.
- **Sandbox** (lorsqu’il est activé) : indique le runtime sandboxé, les chemins sandbox et si l’exécution élevée est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format de l’heure.
- **Balises de réponse** : syntaxe optionnelle des balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt de Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, SE, Node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication du commutateur /reasoning.

OpenClaw conserve le contenu stable volumineux, y compris le **Contexte du projet**, au-dessus de la
limite interne du cache de prompt. Les sections volatiles de canal/session telles que
les consignes intégrées de l’interface de contrôle, **Messagerie**, **Voix**, **Contexte de discussion de groupe**,
**Réactions**, **Heartbeats** et **Runtime** sont ajoutées sous cette limite
afin que les backends locaux avec caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent de même éviter d’intégrer les noms de canal actuels
lorsque le schéma accepté porte déjà ce détail de runtime.

La section Outillage inclut aussi des consignes de runtime pour les travaux de longue durée :

- utiliser cron pour les suivis futurs (`check back later`, rappels, travaux récurrents)
  au lieu de boucles de sommeil `exec`, d’astuces de délai `yieldMs` ou d’interrogations répétées de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la complétion est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil basé sur push lorsqu’il émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la complétion des sous-agents est
  basée sur push et se réannonce automatiquement au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle uniquement pour attendre
  la complétion

Lorsque l’outil expérimental `update_plan` est activé, Outillage indique aussi au
modèle de l’utiliser uniquement pour les travaux non triviaux en plusieurs étapes, de garder exactement une étape
`in_progress` et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans le prompt système sont consultatifs. Ils guident le comportement du modèle mais n’appliquent pas de politique. Utilisez la politique d’outil, les approbations exec, le sandboxing et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt de runtime indique désormais à
l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations par chat sont indisponibles ou que
l’approbation manuelle est le seul chemin.

## Modes de prompt

OpenClaw peut rendre des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration exposée à l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Auto-mise à jour
  OpenClaw**, **Alias de modèles**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outillage, **Sécurité**,
  Espace de travail, Sandbox, Date et heure actuelles (lorsqu’elles sont connues), Runtime et contexte
  injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont libellés **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique sur canal, OpenClaw peut omettre la section générique **Réponses silencieuses**
lorsque le contexte de chat direct/groupe inclut déjà le comportement `NO_REPLY`
résolu et propre à la conversation. Cela évite de répéter la mécanique des jetons
à la fois dans le prompt système global et dans le contexte du canal.

## Instantanés de prompt

OpenClaw conserve des instantanés de prompt de parcours nominal validés pour le runtime
Codex/outil de message sous `test/fixtures/agents/prompt-snapshots/happy-path/`. Ils rendent
certains paramètres thread/tour du serveur applicatif, plus une pile reconstruite de couches de prompt liées au modèle
pour les tours Telegram directs, Discord de groupe et Heartbeat. Cette pile
inclut une fixture de prompt de modèle Codex `gpt-5.5` épinglée générée à partir de la forme du catalogue/cache
de modèles de Codex, le texte développeur de permissions du parcours nominal Codex,
les instructions développeur OpenClaw, l’entrée du tour utilisateur et les références aux spécifications d’outils
dynamiques.

Actualisez la fixture de prompt de modèle Codex épinglée avec
`pnpm prompt:snapshots:sync-codex-model`. Par défaut, le script cherche
le cache de runtime de Codex dans `$CODEX_HOME/models_cache.json`, puis
`~/.codex/models_cache.json`, et ne se rabat qu’ensuite sur la convention du checkout Codex
mainteneur à `~/code/codex/codex-rs/models-manager/models.json`. Si
aucune de ces sources n’existe, la commande se termine sans modifier la fixture
validée. Passez `--catalog <path>` pour actualiser depuis un fichier `models_cache.json`
ou `models.json` spécifique.

Ces instantanés ne sont toujours pas une capture brute octet pour octet de la requête OpenAI. Codex
peut ajouter du contexte d’espace de travail propre au runtime, comme `AGENTS.md`, le contexte
d’environnement, les mémoires, les instructions d’application/plugin et de futures instructions de mode de collaboration
dans le runtime Codex après qu’OpenClaw envoie les paramètres de thread et de tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` et vérifiez la dérive avec
`pnpm prompt:snapshots:check`. La CI exécute la vérification de dérive dans le shard de frontière
supplémentaire afin que les changements de prompt et les mises à jour d’instantanés restent attachés à la même
PR.

## Injection d’amorçage de l’espace de travail

Les fichiers d’amorçage sont tronqués et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans devoir effectuer des lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, sauf si
une porte propre au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les Heartbeats sont désactivés pour l’agent par défaut ou lorsque
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés
concis — surtout `MEMORY.md`, qui peut croître avec le temps et entraîner
une utilisation de contexte étonnamment élevée et une Compaction plus fréquente.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du Contexte du projet d’amorçage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, ils ne comptent donc pas dans la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et `/reset` nus font exception : le runtime peut préfixer de la mémoire quotidienne récente sous forme de bloc de contexte de démarrage ponctuel pour ce premier tour.
</Note>

Les grands fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu total d’amorçage injecté
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans le Contexte du projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage
sont filtrés pour garder le contexte de sous-agent réduit).

Des hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour muter ou remplacer
les fichiers d’amorçage injectés (par exemple en échangeant `SOUL.md` contre une persona différente).

Si vous voulez que l’agent paraisse moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge du schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache de prompt stable, elle n’inclut désormais que
le **fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut facultativement définir une surcharge de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date et heure](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills admissibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin du fichier** pour chaque Skill. Le
prompt indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement
indiqué (espace de travail, géré ou intégré). Si aucune Skill n’est admissible, la
section Skills est omise.

L’admissibilité inclut les portes de métadonnées de Skill, les vérifications d’environnement/configuration de runtime,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills intégrées dans des plugins ne sont admissibles que lorsque leur plugin propriétaire est activé.
Cela permet aux plugins d’outils d’exposer des guides opératoires plus approfondis sans intégrer toute
cette guidance directement dans chaque description d’outil.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela garde le prompt de base petit tout en permettant une utilisation ciblée des Skills.

Le budget de la liste des Skills appartient au sous-système Skills :

- Valeur globale par défaut : `skills.limits.maxSkillsPromptChars`
- Surcharge par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits de runtime bornés génériques utilisent une autre surface :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation maintient le dimensionnement des Skills distinct du dimensionnement des lectures/injections de runtime, comme
`memory_get`, les résultats d’outils en direct et les actualisations post-Compaction de AGENTS.md.

## Documentation

L’invite système inclut une section **Documentation**. Lorsque la documentation locale est disponible, elle
pointe vers le répertoire de documentation OpenClaw local (`docs/` dans un clone Git ou la documentation du package npm
intégré). Si la documentation locale n’est pas disponible, elle se rabat sur
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut également l’emplacement des sources d’OpenClaw. Les clones Git exposent la racine
locale des sources afin que l’agent puisse inspecter directement le code. Les installations de package incluent l’URL des
sources GitHub et indiquent à l’agent d’y consulter les sources lorsque la documentation est incomplète ou
obsolète. L’invite mentionne également le miroir public de la documentation, le Discord communautaire et ClawHub
([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Elle indique au modèle de
consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et
d’exécuter lui-même `openclaw status` lorsque c’est possible (en ne sollicitant l’utilisateur que lorsqu’il n’a pas accès).
Pour la configuration en particulier, elle oriente les agents vers l’action d’outil `gateway`
`config.schema.lookup` pour obtenir la documentation et les contraintes exactes au niveau des champs, puis vers
`docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md`
pour des conseils plus généraux.

## Voir aussi

- [Environnement d’exécution de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
