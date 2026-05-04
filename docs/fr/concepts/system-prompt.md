---
read_when:
    - Modification du texte de l’invite système, de la liste des outils ou des sections d’heure/Heartbeat
    - Modification du comportement d’initialisation de l’espace de travail ou d’injection de Skills
summary: Ce que contient l’invite système d’OpenClaw et comment elle est assemblée
title: Prompt système
x-i18n:
    generated_at: "2026-05-04T02:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit une invite système personnalisée pour chaque exécution d’agent. L’invite est **propriété d’OpenClaw** et n’utilise pas l’invite par défaut de pi-coding-agent.

L’invite est assemblée par OpenClaw et injectée dans chaque exécution d’agent.

Les plugins de fournisseur peuvent contribuer des consignes d’invite compatibles avec le cache sans remplacer
l’intégralité de l’invite propriété d’OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections centrales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache d’invite
- injecter un **suffixe dynamique** sous la limite du cache d’invite

Utilisez les contributions propres au fournisseur pour l’ajustement spécifique à une famille de modèles. Conservez la mutation d’invite héritée
`before_prompt_build` pour la compatibilité ou les changements d’invite réellement globaux,
pas pour le comportement normal d’un fournisseur.

La surcouche de la famille OpenAI GPT-5 garde la règle d’exécution centrale concise et ajoute
des consignes spécifiques au modèle pour l’ancrage de persona, la concision des sorties, la discipline des outils,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène de l’outil terminal.

## Structure

L’invite est volontairement compacte et utilise des sections fixes :

- **Outils** : rappel de la source de vérité des outils structurés, plus consignes d’utilisation des outils au runtime.
- **Biais d’exécution** : consignes compactes de suivi : agir pendant le tour sur
  les demandes actionnables, continuer jusqu’à la fin ou jusqu’au blocage, se rétablir après des résultats d’outil faibles,
  vérifier en direct l’état mutable, et vérifier avant de finaliser.
- **Sécurité** : bref rappel de garde-fous pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’ils sont disponibles) : indique au modèle comment charger les instructions de Skills à la demande.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer toute la
  configuration avec `config.apply`, et exécuter `update.run` uniquement sur demande explicite de l’utilisateur. L’outil `gateway`, réservé au propriétaire, refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers les docs OpenClaw (dépôt ou package npm) et quand les lire.
- **Fichiers de l’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus ci-dessous.
- **Bac à sable** (lorsqu’il est activé) : indique le runtime en bac à sable, les chemins de bac à sable et si l’exécution élevée est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format d’heure.
- **Balises de réponse** : syntaxe facultative de balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : invite Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, Node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication du basculement /reasoning.

OpenClaw conserve le grand contenu stable, y compris le **Contexte du projet**, au-dessus de la
limite interne du cache d’invite. Les sections volatiles de canal/session telles que
les consignes d’intégration de la Control UI, **Messagerie**, **Voix**, **Contexte de discussion de groupe**,
**Réactions**, **Heartbeats** et **Runtime** sont ajoutées sous cette limite
afin que les backends locaux dotés de caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent de même éviter d’intégrer les noms de canaux actuels
lorsque le schéma accepté transporte déjà ce détail de runtime.

La section Outils inclut aussi des consignes de runtime pour les travaux de longue durée :

- utiliser Cron pour les suivis futurs (`check back later`, rappels, travaux récurrents)
  au lieu de boucles de sommeil `exec`, d’astuces de délai `yieldMs` ou d’interrogations répétées de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil push lorsqu’il émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus grande, préférer `sessions_spawn` ; la fin d’un sous-agent est
  basée sur le push et s’annonce automatiquement au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle seulement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, Outils indique aussi au
modèle de ne l’utiliser que pour un travail multi-étapes non trivial, de garder exactement une
étape `in_progress`, et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans l’invite système sont consultatifs. Ils guident le comportement du modèle mais n’appliquent pas de politique. Utilisez les politiques d’outils, les approbations exec, le sandboxing et les listes d’autorisation de canaux pour l’application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec des cartes/boutons d’approbation natifs, l’invite de runtime indique maintenant à
l’agent de s’appuyer d’abord sur cette UI d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat d’outil indique que les approbations par chat ne sont pas disponibles ou que
l’approbation manuelle est le seul chemin.

## Modes d’invite

OpenClaw peut rendre des invites système plus petites pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration exposée à l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Auto-mise à jour OpenClaw**, **Alias de modèles**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outils, **Sécurité**,
  Espace de travail, Bac à sable, Date et heure actuelles (lorsqu’elles sont connues), Runtime et le contexte
  injecté restent disponibles.
- `none` : retourne uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les invites injectées supplémentaires sont étiquetées **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique de canal, OpenClaw peut omettre la section générique **Réponses silencieuses**
lorsque le contexte de discussion directe/de groupe inclut déjà le comportement `NO_REPLY`
spécifique à la conversation résolue. Cela évite de répéter la mécanique de jetons
à la fois dans l’invite système globale et dans le contexte de canal.

## Instantanés d’invite

OpenClaw conserve des instantanés d’invite validés pour le chemin nominal du runtime Codex sous
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ils rendent
certains paramètres de thread/tour du serveur d’application, plus une pile reconstruite de couches d’invite liées au modèle
pour les tours Telegram directs, les groupes Discord et les Heartbeats. Cette pile
inclut une fixture d’invite de modèle Codex `gpt-5.5` épinglée, générée à partir de la
forme du catalogue/cache de modèles de Codex, le texte développeur de permission du chemin nominal Codex,
les instructions développeur OpenClaw, les instructions de mode de collaboration limitées au tour
lorsque OpenClaw les fournit, l’entrée du tour utilisateur et les références aux spécifications dynamiques des outils.

Actualisez la fixture épinglée d’invite de modèle Codex avec
`pnpm prompt:snapshots:sync-codex-model`. Par défaut, le script cherche
le cache de runtime de Codex dans `$CODEX_HOME/models_cache.json`, puis
`~/.codex/models_cache.json`, et ne se replie qu’ensuite sur la convention du checkout Codex mainteneur
à `~/code/codex/codex-rs/models-manager/models.json`. Si
aucune de ces sources n’existe, la commande quitte sans modifier la fixture validée.
Passez `--catalog <path>` pour actualiser depuis un fichier `models_cache.json`
ou `models.json` spécifique.

Ces instantanés ne sont toujours pas une capture brute octet pour octet d’une requête OpenAI. Codex
peut ajouter dans le runtime Codex du contexte d’espace de travail propre au runtime, tel que `AGENTS.md`, le contexte
d’environnement, les mémoires, les instructions d’application/plugin et les instructions intégrées Default
du mode de collaboration après qu’OpenClaw a envoyé les paramètres de thread et de tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` et vérifiez les écarts avec
`pnpm prompt:snapshots:check`. La CI exécute la vérification d’écart dans le shard de frontière additionnel
afin que les changements d’invite et les mises à jour d’instantanés restent rattachés à la même
PR.

## Injection d’amorçage de l’espace de travail

Les fichiers d’amorçage sont tronqués et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans nécessiter de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, sauf si
un garde propre au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les Heartbeats sont désactivés pour l’agent par défaut ou lorsque
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés
concis — en particulier `MEMORY.md`, qui peut croître avec le temps et entraîner
une utilisation de contexte étonnamment élevée et des Compactions plus fréquentes.

Lorsqu’une session s’exécute sur le harnais Codex natif, Codex charge `AGENTS.md`
via sa propre découverte de docs de projet. OpenClaw résout tout de même les autres
fichiers d’amorçage et les transmet comme instructions de configuration Codex, de sorte que `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et
`MEMORY.md` conservent le même rôle de contexte d’espace de travail sans dupliquer
`AGENTS.md`.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du Contexte du projet d’amorçage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, donc ils ne comptent pas dans la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et `/reset` nus sont l’exception : le runtime peut préfixer la mémoire quotidienne récente sous forme de bloc de contexte de démarrage ponctuel pour ce premier tour.
</Note>

Les gros fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu d’amorçage injecté total
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un avis d’avertissement concis dans l’invite système ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`). Les décomptes détaillés bruts/injectés restent dans les diagnostics tels que
`/context`, `/status`, doctor et les journaux.

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage
sont filtrés pour garder le contexte du sous-agent petit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers d’amorçage injectés (par exemple en remplaçant `SOUL.md` par une persona alternative).

Si vous voulez que l’agent paraisse moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut contre injecté, troncature, plus surcharge du schéma d’outils), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

L’invite système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder l’invite stable pour le cache, elle n’inclut désormais que
le **fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut facultativement définir un remplacement de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Date et heure](/fr/date-time) pour le détail complet du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte des skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin du fichier** pour chaque skill. L’invite
demande au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement listé
(espace de travail, géré ou groupé). Si aucun skill n’est éligible, la section
Skills est omise.

L’éligibilité inclut les garde-fous de métadonnées des skills, les vérifications de runtime environnement/configuration,
et la liste d’autorisation effective des skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les skills fournis par un plugin ne sont éligibles que lorsque leur plugin propriétaire est activé.
Cela permet aux plugins d’outils d’exposer des guides d’exploitation plus approfondis sans intégrer toute
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

Cela garde l’invite de base petite tout en permettant une utilisation ciblée des skills.

Le budget de liste des skills appartient au sous-système des skills :

- Valeur par défaut globale : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits d’exécution génériques bornés utilisent une surface différente :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ce découpage garde le dimensionnement des Skills séparé du dimensionnement de lecture/injection à l’exécution, comme pour `memory_get`, les résultats d’outils en direct et les actualisations AGENTS.md après Compaction.

## Documentation

L’invite système inclut une section **Documentation**. Lorsque la documentation locale est disponible, elle pointe vers le répertoire local de documentation OpenClaw (`docs/` dans une extraction Git ou la documentation incluse dans le paquet npm). Si la documentation locale n’est pas disponible, elle se rabat sur [https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut également l’emplacement du code source OpenClaw. Les extractions Git exposent la racine source locale afin que l’agent puisse inspecter directement le code. Les installations de paquet incluent l’URL source GitHub et indiquent à l’agent d’y consulter le code source chaque fois que la documentation est incomplète ou obsolète. L’invite mentionne également le miroir public de la documentation, le Discord communautaire et ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Elle indique au modèle de consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et d’exécuter lui-même `openclaw status` lorsque c’est possible (en ne demandant à l’utilisateur que lorsqu’il n’a pas accès). Pour la configuration en particulier, elle dirige les agents vers l’action d’outil `gateway` `config.schema.lookup` pour obtenir la documentation et les contraintes exactes au niveau des champs, puis vers `docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md` pour des indications plus larges.

## Connexe

- [Environnement d’exécution de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
