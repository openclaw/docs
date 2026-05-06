---
read_when:
    - Modification du texte du prompt système, de la liste des outils ou des sections heure/Heartbeat
    - Modifier le comportement d’amorçage de l’espace de travail ou d’injection de Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Invite système
x-i18n:
    generated_at: "2026-05-06T07:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit une invite système personnalisée pour chaque exécution d’agent. L’invite appartient **à OpenClaw** et n’utilise pas l’invite par défaut de pi-coding-agent.

L’invite est assemblée par OpenClaw et injectée dans chaque exécution d’agent.

Les plugins de fournisseur peuvent contribuer des consignes d’invite tenant compte du cache sans remplacer
l’intégralité de l’invite appartenant à OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections principales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache d’invite
- injecter un **suffixe dynamique** sous la limite du cache d’invite

Utilisez les contributions appartenant au fournisseur pour l’ajustement propre à une famille de modèles. Conservez la mutation d’invite héritée
`before_prompt_build` pour la compatibilité ou les changements d’invite véritablement globaux,
pas pour le comportement normal d’un fournisseur.

La superposition de la famille OpenAI GPT-5 garde la règle d’exécution principale concise et ajoute
des consignes propres au modèle pour l’ancrage de persona, une sortie concise, la discipline d’utilisation des outils,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

L’invite est intentionnellement compacte et utilise des sections fixes :

- **Outils** : rappel de la source de vérité des outils structurés, plus consignes d’utilisation des outils au runtime.
- **Biais d’exécution** : consignes compactes de suivi : agir dans le tour sur
  les demandes actionnables, continuer jusqu’à terminer ou être bloqué, récupérer après de faibles résultats d’outils,
  vérifier l’état mutable en direct et vérifier avant de finaliser.
- **Sécurité** : bref rappel de garde-fous pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’elles sont disponibles) : indique au modèle comment charger les instructions de skill à la demande.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration complète
  avec `config.apply`, et exécuter `update.run` uniquement sur demande explicite de l’utilisateur. L’outil réservé au propriétaire `gateway` refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et moment où la lire.
- **Fichiers d’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus ci-dessous.
- **Bac à sable** (lorsqu’il est activé) : indique le runtime bac à sable, les chemins du bac à sable et si l’exec avec privilèges élevés est disponible.
- **Date et heure actuelles** : fuseau horaire uniquement (stable pour le cache ; l’horloge en direct provient de `session_status`).
- **Balises de réponse** : syntaxe facultative des balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : invite Heartbeat et comportement d’accusé de réception, lorsque les heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, SE, node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indice de bascule /reasoning.

OpenClaw conserve le contenu stable volumineux, y compris le **Contexte du projet**, au-dessus de la
limite interne du cache d’invite. Les sections volatiles de canal/session telles que
les consignes intégrées de l’interface de contrôle, **Messagerie**, **Voix**, **Contexte de discussion de groupe**,
**Réactions**, **Heartbeats** et **Runtime** sont ajoutées sous cette limite
afin que les backends locaux avec caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent de même éviter d’intégrer les noms de canaux actuels
lorsque le schéma accepté porte déjà ce détail de runtime.

La section Outils inclut aussi des consignes de runtime pour les travaux de longue durée :

- utiliser Cron pour les suivis futurs (`check back later`, rappels, travail récurrent)
  au lieu de boucles de sommeil `exec`, d’astuces de délai `yieldMs` ou d’interrogations répétées de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil push lorsqu’elle émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsqu’il faut
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la fin d’un sous-agent est
  basée sur le push et s’annonce automatiquement au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle uniquement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, Outils indique aussi au
modèle de ne l’utiliser que pour un travail multi-étapes non trivial, de garder exactement une étape
`in_progress`, et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans l’invite système sont consultatifs. Ils guident le comportement du modèle mais n’appliquent pas de politique. Utilisez la politique des outils, les approbations exec, le bac à sable et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, l’invite de runtime indique désormais à
l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations par chat sont indisponibles ou que
l’approbation manuelle est le seul chemin.

## Modes d’invite

OpenClaw peut générer des invites système plus petites pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration visible par l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Auto-mise à jour OpenClaw
  **, **Alias de modèle**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outils, **Sécurité**,
  Espace de travail, Bac à sable, Date et heure actuelles (lorsqu’elles sont connues), Runtime et le contexte injecté
  restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les invites injectées supplémentaires sont étiquetées **Contexte de sous-agent
** au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique de canal, OpenClaw peut omettre la section générique **Réponses silencieuses**
lorsque le contexte de discussion directe/de groupe inclut déjà le comportement
`NO_REPLY` propre à la conversation résolue. Cela évite de répéter les mécaniques de jetons
à la fois dans l’invite système globale et dans le contexte de canal.

## Instantanés d’invite

OpenClaw conserve des instantanés d’invite validés pour le chemin nominal du runtime Codex sous
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ils rendent
certains paramètres de fil/tour app-server, plus une pile de couches d’invite reconstruite liée au modèle
pour les tours Telegram directs, les groupes Discord et les heartbeats. Cette pile
inclut un fixture d’invite de modèle Codex `gpt-5.5` épinglé, généré à partir de la forme du
catalogue/cache de modèles de Codex, le texte développeur de permission du chemin nominal Codex,
les instructions développeur OpenClaw, les instructions de mode de collaboration limitées au tour
quand OpenClaw les fournit, l’entrée du tour utilisateur et les références aux spécifications d’outils dynamiques.

Actualisez le fixture d’invite de modèle Codex épinglé avec
`pnpm prompt:snapshots:sync-codex-model`. Par défaut, le script recherche
le cache de runtime de Codex dans `$CODEX_HOME/models_cache.json`, puis
`~/.codex/models_cache.json`, puis seulement ensuite utilise par repli la convention du checkout Codex mainteneur
à `~/code/codex/codex-rs/models-manager/models.json`. Si
aucune de ces sources n’existe, la commande se termine sans modifier le fixture validé.
Passez `--catalog <path>` pour actualiser depuis un fichier `models_cache.json`
ou `models.json` précis.

Ces instantanés ne sont toujours pas une capture brute octet pour octet d’une requête OpenAI. Codex
peut ajouter du contexte d’espace de travail appartenant au runtime, comme `AGENTS.md`, le contexte
d’environnement, les mémoires, les instructions d’app/plugin et les instructions intégrées Default
de mode de collaboration dans le runtime Codex après qu’OpenClaw envoie
les paramètres de fil et de tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` et vérifiez les dérives avec
`pnpm prompt:snapshots:check`. La CI exécute le contrôle de dérive dans le shard de frontière supplémentaire
afin que les changements d’invite et les mises à jour d’instantanés restent attachés à la même
PR.

## Injection d’amorçage de l’espace de travail

Les fichiers d’amorçage sont raccourcis et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour sauf si
une barrière propre au fichier s’applique. `HEARTBEAT.md` est omis sur les exécutions normales lorsque
les heartbeats sont désactivés pour l’agent par défaut ou que
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés
concis — en particulier `MEMORY.md`, qui peut croître au fil du temps et entraîner
une utilisation du contexte étonnamment élevée et une compaction plus fréquente.

Lorsqu’une session s’exécute sur le harnais Codex natif, Codex charge `AGENTS.md`
via sa propre découverte de documents de projet. OpenClaw résout toujours les autres
fichiers d’amorçage et les transmet comme instructions de configuration Codex, de sorte que `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et
`MEMORY.md` conservent le même rôle de contexte d’espace de travail sans dupliquer
`AGENTS.md`.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du Contexte du projet d’amorçage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, de sorte qu’ils ne comptent pas dans la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours nus `/new` et `/reset` sont l’exception : le runtime peut préfixer la mémoire quotidienne récente sous forme de bloc ponctuel de contexte de démarrage pour ce premier tour.
</Note>

Les grands fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu total d’amorçage injecté
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un avis concis d’avertissement dans l’invite système ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`). Les décomptes détaillés bruts/injectés restent dans les diagnostics tels que
`/context`, `/status`, doctor et les journaux.

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour muter ou remplacer
les fichiers d’amorçage injectés (par exemple en remplaçant `SOUL.md` par une persona alternative).

Si vous voulez que l’agent ait une voix moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge du schéma d’outil), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

L’invite système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder l’invite stable pour le cache, elle inclut désormais uniquement
le **fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut éventuellement définir un remplacement de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Date et heure](/fr/date-time) pour tous les détails du comportement.

## Skills

Lorsque des skills éligibles existent, OpenClaw injecte une **liste des skills disponibles** compacte
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** de chaque skill. L’
invite indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement
indiqué (espace de travail, géré ou groupé). Si aucune skill n’est éligible, la
section Skills est omise.

L’éligibilité inclut les barrières de métadonnées de skill, les vérifications d’environnement/configuration de runtime
et la liste d’autorisation effective des skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les skills groupées avec un plugin ne sont éligibles que lorsque leur plugin propriétaire est activé.
Cela permet aux plugins d’outils d’exposer des guides d’exploitation plus approfondis sans intégrer toutes
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

Cela garde l’invite de base réduite tout en permettant une utilisation ciblée des skills.

Le budget de la liste des Skills appartient au sous-système Skills :

- Valeur par défaut globale : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits bornés génériques à l’exécution utilisent une surface différente :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation garde le dimensionnement des Skills distinct du dimensionnement de lecture/injection à l’exécution, comme
`memory_get`, les résultats d’outils en direct et les actualisations d’AGENTS.md après Compaction.

## Documentation

L’invite système inclut une section **Documentation**. Lorsque les docs locales sont disponibles, elle
pointe vers le répertoire local des docs OpenClaw (`docs/` dans un checkout Git ou les docs du paquet npm
fourni). Si les docs locales ne sont pas disponibles, elle se rabat sur
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut aussi l’emplacement de la source OpenClaw. Les checkouts Git exposent la racine
source locale afin que l’agent puisse inspecter le code directement. Les installations de paquet incluent l’URL
source GitHub et indiquent à l’agent d’y examiner la source lorsque les docs sont incomplètes ou
obsolètes. L’invite mentionne aussi le miroir public des docs, le Discord communautaire et ClawHub
([https://clawhub.ai](https://clawhub.ai)) pour la découverte des Skills. Elle indique au modèle de
consulter d’abord les docs pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et
d’exécuter lui-même `openclaw status` lorsque c’est possible (en ne demandant à l’utilisateur que lorsqu’il n’a pas accès).
Pour la configuration en particulier, elle oriente les agents vers l’action d’outil `gateway`
`config.schema.lookup` pour obtenir les docs et contraintes exactes au niveau des champs, puis vers
`docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md`
pour des indications plus générales.

## Articles connexes

- [Exécution de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
