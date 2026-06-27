---
read_when:
    - Modification du texte de l’invite système, de la liste des outils ou des sections heure/Heartbeat
    - Modification du comportement d’amorçage de l’espace de travail ou d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-06-27T17:27:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt est **propriété d’OpenClaw** et n’utilise pas de prompt par défaut au runtime.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

L’assemblage du prompt comporte trois couches :

- `buildAgentSystemPrompt` rend le prompt à partir d’entrées explicites. Il doit
  rester un moteur de rendu pur et ne doit pas lire directement la configuration globale.
- `resolveAgentSystemPromptConfig` résout les paramètres de prompt adossés à la
  configuration, comme l’affichage du propriétaire, les indications TTS, les alias de modèles, le mode de citation mémoire et le mode de délégation de sous-agents pour un agent donné.
- Les adaptateurs de runtime (intégrés, CLI, aperçus de commande/export, Compaction) collectent
  les informations en direct comme les outils, l’état du sandbox, les capacités de canal, les fichiers de contexte,
  et les contributions de prompt des fournisseurs, puis appellent la façade de prompt configurée.

Cela maintient les surfaces de prompt exportées/de débogage alignées sur les exécutions en direct sans
transformer chaque détail propre au runtime en un unique générateur monolithique.

Les Plugins fournisseurs peuvent contribuer des consignes de prompt compatibles avec le cache sans remplacer
l’intégralité du prompt propriété d’OpenClaw. Le runtime fournisseur peut :

- remplacer un petit ensemble de sections centrales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache de prompt
- injecter un **suffixe dynamique** sous la limite du cache de prompt

Utilisez les contributions propres au fournisseur pour l’ajustement spécifique aux familles de modèles. Conservez la
mutation de prompt héritée `before_prompt_build` pour la compatibilité ou les changements de prompt réellement globaux,
pas pour le comportement normal des fournisseurs.

La surcouche de la famille OpenAI GPT-5 garde la règle d’exécution centrale concise et ajoute
des consignes propres au modèle pour l’ancrage de persona, les sorties concises, la discipline d’outils,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène de l’outil de terminal.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Outils** : rappel de source de vérité des outils structurés plus consignes d’utilisation des outils au runtime.
- **Biais d’exécution** : consignes compactes de suivi : agir pendant le tour sur
  les demandes actionnables, continuer jusqu’à finalisation ou blocage, récupérer après des résultats d’outils faibles,
  vérifier l’état mutable en direct et vérifier avant de finaliser.
- **Sécurité** : court rappel de garde-fou pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (si disponibles) : indique au modèle comment charger les instructions de Skills à la demande.
- **Contrôle OpenClaw** : indique au modèle de privilégier l’outil `gateway` pour
  les travaux de configuration/redémarrage et d’éviter d’inventer des commandes CLI.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration complète
  avec `config.apply`, et exécuter `update.run` uniquement sur demande explicite de l’utilisateur.
  L’outil `gateway` exposé à l’agent refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers les docs/sources OpenClaw et quand les lire.
- **Fichiers de l’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus ci-dessous.
- **Sandbox** (si activé) : indique le runtime sandboxé, les chemins de sandbox et si l’exec avec élévation est disponible.
- **Date et heure actuelles** : fuseau horaire uniquement (stable pour le cache ; l’horloge en direct vient de `session_status`).
- **Directives de sortie de l’assistant** : syntaxe compacte des pièces jointes, notes vocales et balises de réponse.
- **Heartbeats** : prompt de Heartbeat et comportement d’accusé de réception, quand les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, système d’exploitation, Node, modèle, racine du dépôt (si détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication du basculement /reasoning.

OpenClaw conserve le contenu stable volumineux, y compris **Contexte du projet**, au-dessus de la
limite interne du cache de prompt. Les sections volatiles de canal/session comme
les consignes intégrées de l’UI de contrôle, **Messagerie**, **Voix**, **Contexte de discussion de groupe**,
**Réactions**, **Heartbeats** et **Runtime** sont ajoutées sous cette limite
afin que les backends locaux avec caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent de même éviter d’intégrer les noms de canaux actuels
lorsque le schéma accepté porte déjà ce détail de runtime.

La section Outils inclut aussi des consignes de runtime pour les travaux de longue durée :

- utiliser Cron pour les suivis futurs (`check back later`, rappels, travaux récurrents)
  au lieu de boucles de veille `exec`, d’astuces de délai `yieldMs` ou de sondages répétés de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil de fin automatique est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil par push lorsqu’elle émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, privilégier `sessions_spawn` ; la fin des sous-agents est
  pilotée par push et s’annonce automatiquement au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle uniquement pour attendre
  la fin

`agents.defaults.subagents.delegationMode` peut renforcer ces consignes. Le
mode par défaut `suggest` conserve l’incitation de base. `prefer` ajoute une section dédiée
**Délégation de sous-agents** indiquant à l’agent principal d’agir comme un
coordinateur réactif et de pousser tout ce qui est plus impliqué qu’une réponse directe via
`sessions_spawn`. Cela concerne uniquement le prompt ; la politique d’outils contrôle toujours si
`sessions_spawn` est disponible.

Lorsque l’outil expérimental `update_plan` est activé, Outils indique aussi au
modèle de l’utiliser uniquement pour les travaux non triviaux en plusieurs étapes, de conserver exactement une
étape `in_progress`, et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans le prompt système sont consultatifs. Ils guident le comportement du modèle mais n’appliquent pas de politique. Utilisez la politique d’outils, les approbations exec, le sandboxing et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt de runtime indique désormais à
l’agent de s’appuyer d’abord sur cette UI d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat d’outil indique que les approbations par chat sont indisponibles ou que
l’approbation manuelle est le seul chemin.

## Modes de prompt

OpenClaw peut rendre des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration visible par l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Rappel mémoire**, **Auto-mise à jour OpenClaw**,
  **Alias de modèles**, **Identité utilisateur**, **Directives de sortie de l’assistant**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outils, **Sécurité**,
  **Skills** lorsqu’ils sont fournis, Espace de travail, Sandbox, Date et heure actuelles (lorsqu’elles sont
  connues), Runtime et le contexte injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont libellés **Contexte du sous-agent**
au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique de canal, OpenClaw omet la section générique **Réponses silencieuses**
lorsque le contexte direct, de groupe ou uniquement par outil de message possède le contrat de réponse visible.
Seul l’ancien mode automatique groupe/canal doit afficher `NO_REPLY` ; les discussions directes
et les réponses uniquement par outil de message ne reçoivent pas de consignes de jeton silencieux.

## Instantanés de prompt

OpenClaw conserve des instantanés de prompt validés pour le chemin nominal du runtime Codex sous
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ils rendent
des paramètres de fil/tour de serveur d’application sélectionnés plus une pile reconstruite de couches de prompt liées au modèle
pour les tours directs Telegram, de groupe Discord et de Heartbeat. Cette pile
inclut une fixture de prompt de modèle Codex `gpt-5.5` épinglée, générée depuis la forme du catalogue/cache
de modèles de Codex, le texte développeur d’autorisations du chemin nominal Codex,
les instructions développeur OpenClaw, les instructions de mode de collaboration limitées au tour
quand OpenClaw les fournit, l’entrée du tour utilisateur et des références aux spécifications d’outils dynamiques.

Actualisez la fixture de prompt de modèle Codex épinglée avec
`pnpm prompt:snapshots:sync-codex-model`. Par défaut, le script cherche
le cache de runtime de Codex dans `$CODEX_HOME/models_cache.json`, puis
`~/.codex/models_cache.json`, et ne revient qu’ensuite à la convention de checkout Codex mainteneur
dans `~/code/codex/codex-rs/models-manager/models.json`. Si
aucune de ces sources n’existe, la commande se termine sans modifier la fixture
validée. Passez `--catalog <path>` pour actualiser depuis un fichier `models_cache.json`
ou `models.json` spécifique.

Ces instantanés ne sont toujours pas une capture brute octet pour octet de requête OpenAI. Codex
peut ajouter du contexte d’espace de travail possédé par le runtime, comme `AGENTS.md`, le contexte
d’environnement, les mémoires, les instructions d’app/Plugin et les instructions intégrées du mode de collaboration
par défaut à l’intérieur du runtime Codex après qu’OpenClaw a envoyé
les paramètres de fil et de tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` et vérifiez les dérives avec
`pnpm prompt:snapshots:check`. CI exécute la vérification de dérive dans le shard de frontière
supplémentaire afin que les changements de prompt et les mises à jour d’instantanés restent attachés à la même
PR.

## Injection d’amorçage de l’espace de travail

Les fichiers d’amorçage sont résolus depuis l’espace de travail actif, puis routés vers la
surface de prompt qui correspond à leur durée de vie :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent

Sur le harnais Codex natif, OpenClaw évite de répéter les fichiers stables de l’espace de travail
à chaque tour utilisateur. Codex charge `AGENTS.md` via sa propre découverte de docs projet.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` et `USER.md` sont transmis comme
instructions développeur Codex. La liste compacte des Skills OpenClaw est également transmise
comme instructions développeur de collaboration limitées au tour. Le contenu de `HEARTBEAT.md` n’est
pas injecté ; les tours Heartbeat reçoivent une note de mode de collaboration pointant vers le fichier
lorsqu’il existe et n’est pas vide. Le contenu de `MEMORY.md` depuis l’espace de travail d’agent configuré
n’est pas collé dans chaque tour Codex natif ; lorsque des outils mémoire sont
disponibles pour cet espace de travail, les tours Codex reçoivent une petite note de mémoire d’espace de travail dans
les instructions développeur de collaboration limitées au tour et doivent utiliser `memory_search`
ou `memory_get` lorsque la mémoire durable est pertinente. Si les outils sont désactivés, si la recherche
mémoire est indisponible, ou si l’espace de travail actif diffère de l’espace de travail mémoire de l’agent,
`MEMORY.md` revient au chemin normal de contexte de tour borné. Le contenu actif de
`BOOTSTRAP.md` conserve pour l’instant le rôle normal de contexte de tour.

Sur les harnais non-Codex, les fichiers d’amorçage continuent d’être composés dans le
prompt OpenClaw selon leurs garde-fous existants. `HEARTBEAT.md` est omis sur
les exécutions normales lorsque les Heartbeats sont désactivés pour l’agent par défaut ou lorsque
`agents.defaults.heartbeat.includeSystemPromptSection` vaut faux. Gardez les fichiers injectés
concis, en particulier `MEMORY.md` hors Codex. `MEMORY.md` est destiné à rester
un résumé de long terme organisé ; les notes quotidiennes détaillées appartiennent à `memory/*.md`, où
`memory_search` et `memory_get` peuvent les récupérer à la demande. Les fichiers
`MEMORY.md` hors Codex surdimensionnés augmentent l’utilisation du prompt et peuvent être partiellement injectés
à cause des limites des fichiers d’amorçage ci-dessous.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du Contexte du projet d’amorçage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, ils ne comptent donc pas dans la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et `/reset` nus sont l’exception : le runtime peut préfixer une mémoire quotidienne récente sous forme de bloc de contexte de démarrage ponctuel pour ce premier tour.
</Note>

Les fichiers volumineux sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 20000). Le contenu d’amorçage injecté total
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un avis d’avertissement concis dans le prompt système ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `always`). Les décomptes bruts/injectés détaillés restent dans les diagnostics tels que
`/context`, `/status`, doctor et les journaux.

Pour les fichiers de mémoire, la troncature n’est pas une perte de données : le fichier reste intact sur le disque.
Sur Codex natif, `MEMORY.md` est lu à la demande via les outils de mémoire lorsqu’ils sont
disponibles, avec un repli borné dans le prompt lorsque les outils ne peuvent pas s’exécuter. Sur les autres
harnesses, le modèle ne voit que la copie injectée raccourcie jusqu’à ce qu’il lise ou
recherche directement la mémoire. Si `MEMORY.md` y est tronqué de façon répétée, condensez-le
en un résumé durable plus court et déplacez l’historique détaillé dans `memory/*.md`,
ou augmentez intentionnellement les limites d’amorçage.

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers d’amorçage injectés (par exemple en remplaçant `SOUL.md` par une persona alternative).

Si vous voulez que l’agent paraisse moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge du schéma d’outil), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache de prompt stable, il n’inclut désormais que
le **fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut éventuellement définir un remplacement de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Date et heure](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** et le marqueur
`<version>` dérivé du contenu pour chaque Skill. Le prompt indique au modèle d’utiliser `read`
pour charger le SKILL.md à l’emplacement listé (workspace, géré ou groupé),
et de relire une Skill lorsque sa `<version>` diffère d’un tour précédent. Si aucune
Skill n’est éligible, la section Skills est omise.

Les tours Codex natifs reçoivent cette liste comme instructions développeur de collaboration limitées au tour
au lieu d’une saisie utilisateur par tour, sauf pour les tours cron légers qui
préservent le prompt planifié exact. Les autres harnesses conservent la section de prompt
normale.

L’emplacement peut pointer vers une Skill imbriquée, comme
`skills/personal/foo/SKILL.md`. L’imbrication est uniquement organisationnelle ; le prompt utilise toujours
le nom plat de la Skill depuis le frontmatter de `SKILL.md`.

L’éligibilité inclut les barrières de métadonnées des Skills, les vérifications d’environnement/configuration d’exécution,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills groupées par Plugin ne sont éligibles que lorsque leur Plugin propriétaire est activé.
Cela permet aux Plugins d’outils d’exposer des guides d’exploitation plus approfondis sans intégrer toute
cette guidance directement dans chaque description d’outil.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Cela garde le prompt de base réduit tout en permettant une utilisation ciblée des Skills.

Le budget de la liste des Skills appartient au sous-système des Skills :

- Valeur par défaut globale : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits d’exécution génériques bornés utilisent une surface différente :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation garde le dimensionnement des Skills distinct du dimensionnement de lecture/injection d’exécution, comme
`memory_get`, les résultats d’outils en direct et les actualisations de AGENTS.md après Compaction.

## Documentation

Le prompt système inclut une section **Documentation**. Lorsque la documentation locale est disponible, elle
pointe vers le répertoire local de documentation OpenClaw (`docs/` dans un checkout Git ou la documentation groupée du package npm).
Si la documentation locale est indisponible, elle se rabat sur
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut également l’emplacement source d’OpenClaw. Les checkouts Git exposent la racine
source locale afin que l’agent puisse inspecter directement le code. Les installations de package incluent l’URL source
GitHub et indiquent à l’agent de consulter la source à cet endroit lorsque la documentation est incomplète ou
obsolète. Le prompt mentionne également le miroir de documentation public, le Discord communautaire et ClawHub
([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Il présente la documentation comme
l’autorité pour la connaissance interne d’OpenClaw avant que le modèle comprenne le fonctionnement d’OpenClaw,
y compris la mémoire/les notes quotidiennes, les sessions, les outils, le Gateway, la configuration, les commandes ou le contexte
du projet. Le prompt indique au modèle d’utiliser d’abord la documentation locale (ou le miroir de documentation lorsque la documentation locale
est indisponible), et de traiter AGENTS.md, le contexte du projet, les notes de workspace/profil/mémoire
et `memory_search` comme contexte d’instructions ou mémoire utilisateur plutôt que comme connaissance de conception ou d’implémentation
d’OpenClaw. Si la documentation est silencieuse ou obsolète, le modèle doit le dire
et inspecter la source. Le prompt indique également au modèle d’exécuter lui-même `openclaw status` lorsque
c’est possible, et de demander à l’utilisateur uniquement lorsqu’il n’a pas l’accès nécessaire.
Pour la configuration en particulier, il oriente les agents vers l’action d’outil `gateway`
`config.schema.lookup` pour une documentation et des contraintes exactes au niveau des champs, puis vers
`docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md`
pour des conseils plus généraux.

## Connexe

- [Runtime de l’agent](/fr/concepts/agent)
- [Workspace de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
