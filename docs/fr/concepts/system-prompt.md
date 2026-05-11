---
read_when:
    - Modification du prompt système, de la liste des outils ou des sections heure/Heartbeat
    - Modification du comportement d’amorçage de l’espace de travail ou d’injection de Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Invite système
x-i18n:
    generated_at: "2026-05-11T20:34:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit une invite système personnalisée pour chaque exécution d’agent. L’invite est **détenue par OpenClaw** et n’utilise pas l’invite par défaut de pi-coding-agent.

L’invite est assemblée par OpenClaw et injectée dans chaque exécution d’agent.

L’assemblage de l’invite comporte trois couches :

- `buildAgentSystemPrompt` rend l’invite à partir d’entrées explicites. Il doit
  rester un moteur de rendu pur et ne doit pas lire directement la configuration globale.
- `resolveAgentSystemPromptConfig` résout les réglages d’invite adossés à la
  configuration, comme l’affichage du propriétaire, les indications TTS, les alias de modèles,
  le mode de citation de la mémoire et le mode de délégation à des sous-agents
  pour un agent spécifique.
- Les adaptateurs d’exécution (embarqués, CLI, aperçus de commande/export,
  Compaction) collectent les faits vivants comme les outils, l’état du sandbox,
  les capacités du canal, les fichiers de contexte et les contributions d’invite du fournisseur,
  puis appellent la façade d’invite configurée.

Cela maintient les surfaces d’invite exportées/de débogage alignées avec les exécutions réelles sans
transformer chaque détail propre à l’exécution en un générateur monolithique.

Les Plugins fournisseurs peuvent contribuer des consignes d’invite compatibles avec le cache sans remplacer
l’invite complète détenue par OpenClaw. L’exécution du fournisseur peut :

- remplacer un petit ensemble de sections cœur nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache d’invite
- injecter un **suffixe dynamique** sous la limite du cache d’invite

Utilisez les contributions détenues par le fournisseur pour les ajustements propres à une famille de modèles. Conservez la mutation d’invite héritée
`before_prompt_build` pour la compatibilité ou les changements d’invite réellement globaux,
pas pour le comportement normal d’un fournisseur.

La surcouche de la famille OpenAI GPT-5 garde la règle d’exécution cœur réduite et ajoute
des consignes propres au modèle pour l’ancrage de persona, la concision de la sortie, la discipline d’outils,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

L’invite est volontairement compacte et utilise des sections fixes :

- **Outils** : rappel de la source de vérité des outils structurés plus consignes d’utilisation des outils à l’exécution.
- **Biais d’exécution** : consignes compactes de suivi jusqu’au bout : agir pendant le tour sur
  les demandes actionnables, continuer jusqu’à la fin ou le blocage, récupérer après de faibles
  résultats d’outils, vérifier l’état mutable en direct et vérifier avant de finaliser.
- **Sécurité** : court rappel de garde-fous pour éviter les comportements de recherche de pouvoir ou de contournement de la supervision.
- **Skills** (quand disponibles) : indique au modèle comment charger les instructions de Skills à la demande.
- **Contrôle OpenClaw** : indique au modèle de préférer l’outil `gateway` pour
  les travaux de configuration/redémarrage et d’éviter d’inventer des commandes CLI.
- **Mise à jour automatique d’OpenClaw** : comment inspecter la configuration en sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration
  complète avec `config.apply`, et exécuter `update.run` uniquement à la demande explicite de l’utilisateur.
  L’outil `gateway` réservé au propriétaire refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers les docs/source OpenClaw et quand les lire.
- **Fichiers de l’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus ci-dessous.
- **Sandbox** (quand activé) : indique l’exécution en sandbox, les chemins de sandbox et si l’exec élevé est disponible.
- **Date et heure actuelles** : fuseau horaire uniquement (stable pour le cache ; l’horloge réelle vient de `session_status`).
- **Directives de sortie de l’assistant** : syntaxe compacte des pièces jointes, notes vocales et balises de réponse.
- **Heartbeats** : invite de Heartbeat et comportement d’accusé de réception, quand les Heartbeats sont activés pour l’agent par défaut.
- **Exécution** : hôte, système d’exploitation, Node, modèle, racine du dépôt (quand détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication de bascule /reasoning.

OpenClaw conserve le contenu stable volumineux, y compris **Contexte du projet**, au-dessus de la
limite interne du cache d’invite. Les sections volatiles de canal/session comme
les consignes d’intégration de l’interface de contrôle, **Messagerie**, **Voix**, **Contexte de discussion de groupe**,
**Réactions**, **Heartbeats** et **Exécution** sont ajoutées sous cette limite
afin que les backends locaux avec caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent de même éviter d’intégrer les noms de canal actuels
quand le schéma accepté transporte déjà ce détail d’exécution.

La section Outils inclut aussi des consignes d’exécution pour les travaux de longue durée :

- utiliser Cron pour les suivis futurs (`check back later`, rappels, travaux récurrents)
  au lieu de boucles de sommeil `exec`, d’astuces de délai `yieldMs` ou d’interrogations répétées de
  `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent de s’exécuter
  en arrière-plan
- quand le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil poussé quand elle émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention quand vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la fin d’un sous-agent est
  poussée et annoncée automatiquement au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle juste pour attendre
  la fin

`agents.defaults.subagents.delegationMode` peut renforcer ces consignes. Le
mode par défaut `suggest` conserve l’incitation de base. `prefer` ajoute une section
**Délégation à des sous-agents** dédiée qui indique à l’agent principal d’agir comme un
coordinateur réactif et de pousser tout ce qui est plus impliqué qu’une réponse directe via
`sessions_spawn`. Cela relève uniquement de l’invite ; la politique d’outils contrôle toujours si
`sessions_spawn` est disponible.

Quand l’outil expérimental `update_plan` est activé, Outils indique aussi au
modèle de l’utiliser uniquement pour les travaux multi-étapes non triviaux, de garder exactement une étape
`in_progress` et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans l’invite système sont consultatifs. Ils guident le comportement du modèle mais n’appliquent pas la politique. Utilisez la politique d’outils, les approbations exec, le sandboxing et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver volontairement.

Sur les canaux avec cartes/boutons d’approbation natifs, l’invite d’exécution indique désormais à
l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations par discussion sont indisponibles ou que
l’approbation manuelle est le seul chemin.

## Modes d’invite

OpenClaw peut rendre des invites système plus petites pour les sous-agents. L’exécution définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration exposée à l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Rappel de mémoire**, **Mise à jour automatique d’OpenClaw**,
  **Alias de modèles**, **Identité utilisateur**, **Directives de sortie de l’assistant**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outils, **Sécurité**,
  **Skills** quand fournis, Espace de travail, Sandbox, Date et heure actuelles (quand
  connues), Exécution et contexte injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Quand `promptMode=minimal`, les invites injectées supplémentaires sont étiquetées **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique de canal, OpenClaw peut omettre la section générique **Réponses silencieuses**
quand le contexte de discussion directe/de groupe inclut déjà le comportement
`NO_REPLY` propre à la conversation résolue. Cela évite de répéter les mécanismes de jetons
à la fois dans l’invite système globale et dans le contexte de canal.

## Instantanés d’invite

OpenClaw conserve des instantanés d’invite validés pour le chemin nominal de l’exécution Codex sous
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ils rendent
certains paramètres de fil/tour du serveur d’application plus une pile reconstruite de couches d’invite liées au modèle
pour les tours directs Telegram, de groupe Discord et de Heartbeat. Cette pile
inclut une fixture d’invite de modèle Codex `gpt-5.5` épinglée générée à partir de la
forme du catalogue/cache de modèles de Codex, le texte développeur des permissions du chemin nominal Codex,
les instructions développeur OpenClaw, les instructions de mode de collaboration limitées au tour
quand OpenClaw les fournit, l’entrée du tour utilisateur et les références aux spécifications d’outils dynamiques.

Actualisez la fixture d’invite de modèle Codex épinglée avec
`pnpm prompt:snapshots:sync-codex-model`. Par défaut, le script cherche le
cache d’exécution de Codex dans `$CODEX_HOME/models_cache.json`, puis
`~/.codex/models_cache.json`, puis seulement ensuite se rabat sur la convention de checkout Codex
du mainteneur à `~/code/codex/codex-rs/models-manager/models.json`. Si
aucune de ces sources n’existe, la commande se termine sans modifier la fixture
validée. Passez `--catalog <path>` pour actualiser depuis un fichier `models_cache.json`
ou `models.json` spécifique.

Ces instantanés ne sont toujours pas une capture brute octet pour octet de requête OpenAI. Codex
peut ajouter un contexte d’espace de travail détenu par l’exécution comme `AGENTS.md`, le contexte
d’environnement, les mémoires, les instructions d’application/Plugin et les instructions intégrées du mode de collaboration
par défaut à l’intérieur de l’exécution Codex après qu’OpenClaw envoie les paramètres de fil
et de tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` et vérifiez la dérive avec
`pnpm prompt:snapshots:check`. CI exécute la vérification de dérive dans le fragment de frontière
supplémentaire afin que les changements d’invite et les mises à jour d’instantanés restent rattachés à la même
PR.

## Injection d’amorçage de l’espace de travail

Les fichiers d’amorçage sont élagués et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans nécessiter de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` quand présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, sauf si
une barrière propre au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales quand
les Heartbeats sont désactivés pour l’agent par défaut ou quand
`agents.defaults.heartbeat.includeSystemPromptSection` vaut faux. Gardez les fichiers injectés
concis, en particulier `MEMORY.md`. `MEMORY.md` est destiné à rester un
résumé long terme organisé ; les notes quotidiennes détaillées appartiennent à `memory/*.md`, où
`memory_search` et `memory_get` peuvent les récupérer à la demande. Les fichiers
`MEMORY.md` surdimensionnés augmentent l’utilisation de l’invite et peuvent être partiellement injectés à cause
des limites de fichiers d’amorçage ci-dessous.

Quand une session s’exécute sur le harnais Codex natif, Codex charge `AGENTS.md`
via sa propre découverte de documents de projet. OpenClaw résout toujours les autres
fichiers d’amorçage et les transmet comme instructions de configuration Codex, donc `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et
`MEMORY.md` conservent le même rôle de contexte d’espace de travail sans dupliquer
`AGENTS.md`.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du Contexte du projet d’amorçage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, ils ne comptent donc pas contre la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et `/reset` nus sont l’exception : l’exécution peut préfixer la mémoire quotidienne récente sous forme de bloc ponctuel de contexte de démarrage pour ce premier tour.
</Note>

Les gros fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu d’amorçage total injecté
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Quand une troncature
se produit, OpenClaw peut injecter un avis d’avertissement concis dans l’invite système ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`). Les comptes bruts/injectés détaillés restent dans les diagnostics comme
`/context`, `/status`, doctor et les journaux.

Pour les fichiers de mémoire, la troncature n’est pas une perte de données : le fichier reste intact sur le disque,
mais le modèle ne voit que la copie injectée raccourcie jusqu’à ce qu’il lise ou recherche
directement dans la mémoire. Si `MEMORY.md` est tronqué de manière répétée, distillez-le en un
résumé durable plus court et déplacez l’historique détaillé dans `memory/*.md`, ou
augmentez intentionnellement les limites d’amorçage.

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour muter ou remplacer
les fichiers d’amorçage injectés (par exemple, remplacer `SOUL.md` par une autre persona).

Si vous souhaitez que l’agent paraisse moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour examiner la contribution de chaque fichier injecté (brut ou injecté, troncature, plus la surcharge du schéma d’outil), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

L’invite système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour conserver la stabilité du cache
d’invite, elle n’inclut désormais que le **fuseau horaire** (aucune horloge dynamique
ni aucun format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte
d’état inclut une ligne d’horodatage. Le même outil peut éventuellement définir une
surcharge de modèle par session (`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Date et heure](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste des Skills disponibles**
compacte (`formatSkillsForPrompt`) qui inclut le **chemin du fichier** pour chaque Skill. L’
invite indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement
indiqué (espace de travail, géré ou fourni). Si aucun Skill n’est éligible, la
section Skills est omise.

L’éligibilité inclut les règles de métadonnées des Skills, les vérifications
d’environnement/configuration d’exécution, ainsi que la liste d’autorisation effective
des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills fournis par un Plugin ne sont éligibles que lorsque le Plugin qui les possède est activé.
Cela permet aux Plugins d’outils d’exposer des guides d’utilisation plus approfondis sans intégrer toute
cette documentation directement dans chaque description d’outil.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela garde l’invite de base réduite tout en permettant une utilisation ciblée des Skills.

Le budget de la liste des Skills appartient au sous-système des Skills :

- Valeur par défaut globale : `skills.limits.maxSkillsPromptChars`
- Surcharge par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits d’exécution bornés génériques utilisent une surface différente :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation maintient le dimensionnement des Skills distinct du dimensionnement
des lectures/injections d’exécution, comme `memory_get`, les résultats d’outils en direct
et les actualisations AGENTS.md après Compaction.

## Documentation

L’invite système inclut une section **Documentation**. Lorsque la documentation locale est disponible, elle
pointe vers le répertoire local de documentation OpenClaw (`docs/` dans un checkout Git ou la documentation
du package npm fourni). Si la documentation locale est indisponible, elle se rabat sur
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut également l’emplacement du code source OpenClaw. Les checkouts Git exposent la racine
locale du code source afin que l’agent puisse inspecter directement le code. Les installations de package incluent l’URL
du code source GitHub et indiquent à l’agent d’y consulter le code source lorsque la documentation est incomplète ou
obsolète. L’invite mentionne également le miroir public de la documentation, le Discord communautaire et ClawHub
([https://clawhub.ai](https://clawhub.ai)) pour la découverte des Skills. Elle indique au modèle de
consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et
d’exécuter lui-même `openclaw status` lorsque c’est possible (en ne demandant à l’utilisateur que lorsqu’il n’a pas accès).
Pour la configuration en particulier, elle oriente les agents vers l’action d’outil `gateway`
`config.schema.lookup` pour obtenir la documentation et les contraintes exactes au niveau des champs, puis vers
`docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md`
pour des conseils plus larges.

## Connexe

- [Exécution de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
