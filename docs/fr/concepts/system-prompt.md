---
read_when:
    - Modification du texte de l’invite système, de la liste des outils ou des sections relatives à l’heure/Heartbeat
    - Modification de l’amorçage de l’espace de travail ou du comportement d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Invite système
x-i18n:
    generated_at: "2026-05-02T23:39:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt appartient à **OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les Plugins fournisseurs peuvent apporter des consignes de prompt compatibles avec le cache sans remplacer
l’intégralité du prompt appartenant à OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections principales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache de prompt
- injecter un **suffixe dynamique** sous la limite du cache de prompt

Utilisez les contributions appartenant au fournisseur pour l’ajustement propre à une famille de modèles. Conservez la mutation de prompt héritée
`before_prompt_build` pour la compatibilité ou les modifications de prompt réellement globales,
pas pour le comportement normal d’un fournisseur.

La surcouche de la famille OpenAI GPT-5 garde la règle d’exécution principale concise et ajoute
des consignes propres au modèle pour l’ancrage de persona, les sorties concises, la discipline des outils,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène de l’outil de terminal.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Outils** : rappel de source de vérité pour les outils structurés, plus consignes d’utilisation des outils au runtime.
- **Biais d’exécution** : consignes compactes de suivi : agir dans le tour pour les demandes
  actionnables, continuer jusqu’à la fin ou au blocage, récupérer après des résultats d’outils faibles,
  vérifier l’état mutable en direct et vérifier avant de finaliser.
- **Sécurité** : bref rappel de garde-fou pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’ils sont disponibles) : indique au modèle comment charger les instructions des Skills à la demande.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration complète
  avec `config.apply` et exécuter `update.run` uniquement à la demande explicite de l’utilisateur.
  L’outil `gateway`, réservé au propriétaire, refuse également de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et quand la lire.
- **Fichiers d’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus ci-dessous.
- **Sandbox** (lorsqu’activé) : indique le runtime sandboxé, les chemins de sandbox et si l’exécution avec élévation est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format d’heure.
- **Balises de réponse** : syntaxe facultative des balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt de Heartbeat et comportement d’acquittement, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, SE, Node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication de bascule /reasoning.

OpenClaw conserve les contenus volumineux et stables, y compris le **contexte de projet**, au-dessus de la
limite interne du cache de prompt. Les sections volatiles de canal/session, comme
les consignes intégrées de l’interface Control UI, la **messagerie**, la **voix**, le **contexte de discussion de groupe**,
les **réactions**, les **Heartbeats** et le **runtime** sont ajoutées sous cette limite
afin que les backends locaux avec caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent de même éviter d’intégrer les noms de canaux actuels
lorsque le schéma accepté transporte déjà ce détail de runtime.

La section Outils inclut également des consignes de runtime pour les travaux de longue durée :

- utiliser Cron pour les suivis futurs (`check back later`, rappels, travaux récurrents)
  au lieu de boucles de veille `exec`, d’astuces de délai `yieldMs` ou de sondages répétés de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil d’achèvement automatique est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil par poussée lorsqu’elle émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus vaste, préférer `sessions_spawn` ; l’achèvement des sous-agents est
  par poussée et s’annonce automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` en boucle uniquement pour attendre
  l’achèvement

Lorsque l’outil expérimental `update_plan` est activé, Outils indique également au
modèle de l’utiliser uniquement pour les travaux multi-étapes non triviaux, de garder exactement une étape
`in_progress` et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans le prompt système sont indicatifs. Ils guident le comportement du modèle mais n’appliquent pas de politique. Utilisez les politiques d’outils, les approbations exec, le sandboxing et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt de runtime indique désormais à
l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations par chat sont indisponibles ou que
l’approbation manuelle est la seule voie.

## Modes de prompt

OpenClaw peut rendre des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration destinée à l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Memory Recall**, **Auto-mise à jour
  OpenClaw**, **Alias de modèles**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outils, **Sécurité**,
  Espace de travail, Sandbox, Date et heure actuelles (lorsqu’elles sont connues), Runtime et contexte
  injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont étiquetés **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique de canal, OpenClaw peut omettre la section générique **Réponses silencieuses**
lorsque le contexte de discussion directe/de groupe inclut déjà le comportement `NO_REPLY`
résolu propre à la conversation. Cela évite de répéter les mécaniques de jetons
à la fois dans le prompt système global et dans le contexte de canal.

## Instantanés de prompt

OpenClaw conserve des instantanés de prompt validés pour le chemin heureux du runtime Codex sous
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ils rendent
certains paramètres de fil/tour du serveur d’applications ainsi qu’une pile de couches de prompt liée au modèle reconstruite
pour les tours directs Telegram, de groupe Discord et de Heartbeat. Cette pile
inclut un fixture de prompt de modèle Codex `gpt-5.5` épinglé généré depuis la forme
du catalogue/cache de modèles de Codex, le texte développeur de permissions du chemin heureux Codex,
les instructions développeur OpenClaw, l’entrée du tour utilisateur et les références aux spécifications
d’outils dynamiques.

Actualisez le fixture de prompt de modèle Codex épinglé avec
`pnpm prompt:snapshots:sync-codex-model`. Par défaut, le script cherche le cache de runtime
de Codex dans `$CODEX_HOME/models_cache.json`, puis
`~/.codex/models_cache.json`, et ne se rabat qu’ensuite sur la convention du checkout Codex
du mainteneur à `~/code/codex/codex-rs/models-manager/models.json`. Si
aucune de ces sources n’existe, la commande se termine sans modifier le
fixture validé. Passez `--catalog <path>` pour actualiser depuis un fichier `models_cache.json`
ou `models.json` spécifique.

Ces instantanés ne sont toujours pas une capture brute octet pour octet d’une requête OpenAI. Codex
peut ajouter du contexte d’espace de travail appartenant au runtime, comme `AGENTS.md`, le contexte
d’environnement, les mémoires, les instructions d’application/Plugin et les futures instructions
de mode de collaboration à l’intérieur du runtime Codex après qu’OpenClaw a envoyé les paramètres
de fil et de tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` et vérifiez les dérives avec
`pnpm prompt:snapshots:check`. La CI exécute la vérification de dérive dans le shard de limite
supplémentaire afin que les modifications de prompt et les mises à jour d’instantanés restent attachées à la même
PR.

## Injection d’amorçage de l’espace de travail

Les fichiers d’amorçage sont tronqués et ajoutés sous **Contexte de projet** afin que le modèle voie le contexte d’identité et de profil sans nécessiter de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, sauf si
une porte propre au fichier s’applique. `HEARTBEAT.md` est omis sur les exécutions normales lorsque
les Heartbeats sont désactivés pour l’agent par défaut ou lorsque
`agents.defaults.heartbeat.includeSystemPromptSection` vaut faux. Gardez les fichiers injectés
concis — en particulier `MEMORY.md`, qui peut croître au fil du temps et entraîner
une utilisation du contexte étonnamment élevée et une Compaction plus fréquente.

Lorsqu’une session s’exécute sur le harnais Codex natif, Codex charge `AGENTS.md`
via sa propre découverte de documentation de projet. OpenClaw résout tout de même les fichiers
d’amorçage restants et les transmet comme instructions de configuration Codex, de sorte que `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et
`MEMORY.md` conservent le même rôle de contexte d’espace de travail sans dupliquer
`AGENTS.md`.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du contexte de projet d’amorçage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, de sorte qu’ils ne comptent pas dans la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et `/reset` nus font exception : le runtime peut préfixer la mémoire quotidienne récente comme bloc de contexte de démarrage à usage unique pour ce premier tour.
</Note>

Les grands fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu d’amorçage injecté total
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans le Contexte de projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage
sont filtrés pour garder le contexte de sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers d’amorçage injectés (par exemple en remplaçant `SOUL.md` par une persona alternative).

Si vous voulez que l’agent ait un ton moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut contre injecté, troncature, plus surcharge de schéma d’outils), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache de prompt stable, il inclut désormais uniquement
le **fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut facultativement définir un remplacement de modèle
par session (`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Date et heure](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste de Skills disponibles** compacte
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** de chaque Skill. Le
prompt indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement listé
(espace de travail, géré ou groupé). Si aucun Skill n’est éligible, la
section Skills est omise.

L’éligibilité inclut les portes de métadonnées de Skill, les vérifications d’environnement/configuration de runtime,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills groupés avec un Plugin ne sont éligibles que lorsque leur Plugin propriétaire est activé.
Cela permet aux Plugins d’outils d’exposer des guides d’utilisation plus approfondis sans intégrer toutes
ces consignes directement dans chaque description d’outil.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela garde le prompt de base réduit tout en permettant une utilisation ciblée des Skills.

Le budget de la liste des Skills appartient au sous-système Skills :

- Par défaut global : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits de runtime bornés génériques utilisent une surface différente :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation maintient le dimensionnement des Skills distinct du dimensionnement de la lecture/injection à l’exécution, comme `memory_get`, les résultats d’outils en direct et les actualisations d’AGENTS.md après Compaction.

## Documentation

Le prompt système inclut une section **Documentation**. Lorsque la documentation locale est disponible, il pointe vers le répertoire local de documentation OpenClaw (`docs/` dans un checkout Git ou la documentation du paquet npm fourni). Si la documentation locale n’est pas disponible, il se rabat sur [https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut également l’emplacement de la source OpenClaw. Les checkouts Git exposent la racine source locale afin que l’agent puisse inspecter le code directement. Les installations de paquet incluent l’URL source GitHub et indiquent à l’agent d’y consulter la source chaque fois que la documentation est incomplète ou obsolète. Le prompt mentionne également le miroir public de la documentation, le Discord communautaire et ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour la découverte des Skills. Il indique au modèle de consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et d’exécuter lui-même `openclaw status` lorsque c’est possible (en ne demandant à l’utilisateur que lorsqu’il n’a pas accès). Pour la configuration en particulier, il oriente les agents vers l’action d’outil `gateway` `config.schema.lookup` pour obtenir la documentation et les contraintes exactes au niveau des champs, puis vers `docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md` pour des indications plus générales.

## Connexe

- [Runtime de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
