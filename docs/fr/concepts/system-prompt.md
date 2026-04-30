---
read_when:
    - Modification du texte de l’invite système, de la liste des outils ou des sections heure/Heartbeat
    - Modifier le comportement d’amorçage de l’espace de travail ou d’injection de Skills
summary: Ce que contient l’invite système OpenClaw et comment elle est assemblée
title: Prompt système
x-i18n:
    generated_at: "2026-04-30T07:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit une invite système personnalisée pour chaque exécution d’agent. L’invite est **détenue par OpenClaw** et n’utilise pas l’invite par défaut de pi-coding-agent.

L’invite est assemblée par OpenClaw et injectée dans chaque exécution d’agent.

Les plugins de fournisseur peuvent contribuer des consignes d’invite compatibles avec le cache sans remplacer
l’invite complète détenue par OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections cœur nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache d’invite
- injecter un **suffixe dynamique** sous la limite du cache d’invite

Utilisez les contributions détenues par le fournisseur pour les réglages propres à une famille de modèles. Conservez la mutation d’invite héritée
`before_prompt_build` pour la compatibilité ou les changements d’invite réellement globaux,
pas pour le comportement normal d’un fournisseur.

La surcouche de la famille OpenAI GPT-5 garde la règle d’exécution cœur concise et ajoute
des consignes propres au modèle pour l’ancrage de persona, les sorties concises, la discipline des outils,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

L’invite est volontairement compacte et utilise des sections fixes :

- **Outils** : rappel sur la source de vérité des outils structurés et consignes d’utilisation des outils au runtime.
- **Biais d’exécution** : consignes compactes de suivi : agir dans le tour sur
  les demandes exploitables, continuer jusqu’à la fin ou jusqu’au blocage, récupérer après des résultats d’outil faibles,
  vérifier en direct l’état mutable, et vérifier avant de finaliser.
- **Sécurité** : bref rappel de garde-fou pour éviter les comportements de recherche de pouvoir ou de contournement de la supervision.
- **Skills** (si disponibles) : indique au modèle comment charger les instructions de Skills à la demande.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration complète
  avec `config.apply`, et exécuter `update.run` uniquement sur demande explicite de l’utilisateur.
  L’outil réservé au propriétaire `gateway` refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou paquet npm) et quand la lire.
- **Fichiers de l’espace de travail (injectés)** : indique que les fichiers de démarrage sont inclus ci-dessous.
- **Sandbox** (si activé) : indique le runtime sandboxé, les chemins de sandbox et si l’exécution élevée est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format de l’heure.
- **Balises de réponse** : syntaxe facultative de balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : invite Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, node, modèle, racine du dépôt (si détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indice de bascule /reasoning.

OpenClaw conserve le contenu stable volumineux, y compris le **Contexte de projet**, au-dessus de la
limite interne du cache d’invite. Les sections volatiles de canal/session comme
les consignes d’intégration de l’interface de contrôle, **Messagerie**, **Voix**, **Contexte de discussion de groupe**,
**Réactions**, **Heartbeats** et **Runtime** sont ajoutées sous cette limite
afin que les backends locaux avec caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent de même éviter d’intégrer les noms de canaux actuels
lorsque le schéma accepté porte déjà ce détail de runtime.

La section Outils inclut aussi des consignes de runtime pour le travail de longue durée :

- utiliser cron pour le suivi futur (`check back later`, rappels, travail récurrent)
  au lieu de boucles de sommeil `exec`, d’astuces de délai `yieldMs` ou d’interrogations répétées de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent de s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil poussé lorsqu’il émet une sortie ou échoue
- utiliser `process` pour les journaux, le statut, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la fin du sous-agent est
  poussée et annoncée automatiquement au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle simplement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, Outils indique aussi au
modèle de ne l’utiliser que pour un travail non trivial en plusieurs étapes, de garder exactement une étape
`in_progress`, et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans l’invite système sont consultatifs. Ils guident le comportement du modèle mais n’appliquent pas de politique. Utilisez la politique des outils, les approbations exec, le sandboxing et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, l’invite de runtime indique désormais à
l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations par chat sont indisponibles ou que
l’approbation manuelle est la seule voie possible.

## Modes d’invite

OpenClaw peut rendre des invites système plus petites pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration exposée à l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Auto-mise à jour OpenClaw**,
  **Alias de modèles**, **Identité de l’utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outils, **Sécurité**,
  Espace de travail, Sandbox, Date et heure actuelles (si connues), Runtime et contexte
  injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les invites injectées supplémentaires sont étiquetées **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique de canal, OpenClaw peut omettre la section générique **Réponses silencieuses**
lorsque le contexte de discussion directe/de groupe inclut déjà le comportement
`NO_REPLY` résolu propre à la conversation. Cela évite de répéter la mécanique des jetons
dans l’invite système globale et dans le contexte de canal.

## Injection du démarrage de l’espace de travail

Les fichiers de démarrage sont raccourcis et ajoutés sous **Contexte de projet** afin que le modèle voie l’identité et le contexte de profil sans lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour sauf si
une barrière propre au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les Heartbeats sont désactivés pour l’agent par défaut ou que
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés
concis — en particulier `MEMORY.md`, qui peut croître au fil du temps et entraîner
une utilisation du contexte étonnamment élevée et une compaction plus fréquente.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du Contexte de projet de démarrage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, ils ne comptent donc pas dans la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours nus `/new` et `/reset` font exception : le runtime peut préfixer la mémoire quotidienne récente comme bloc ponctuel de contexte de démarrage pour ce premier tour.
</Note>

Les fichiers volumineux sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu de démarrage total injecté
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans le Contexte de projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent injectent uniquement `AGENTS.md` et `TOOLS.md` (les autres fichiers de démarrage
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour muter ou remplacer
les fichiers de démarrage injectés (par exemple remplacer `SOUL.md` par une autre persona).

Si vous voulez que l’agent paraisse moins générique, commencez par le
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge du schéma d’outils), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

L’invite système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache d’invite stable, elle n’inclut désormais que
le **fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte de statut
inclut une ligne d’horodatage. Le même outil peut éventuellement définir un remplacement de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Date et heure](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin du fichier** pour chaque Skill. L’invite
demande au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement indiqué
(espace de travail, géré ou groupé). Si aucun Skill n’est éligible, la
section Skills est omise.

L’éligibilité inclut les barrières de métadonnées de Skill, les vérifications d’environnement/configuration au runtime,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills inclus avec des plugins ne sont éligibles que lorsque leur Plugin propriétaire est activé.
Cela permet aux plugins d’outils d’exposer des guides d’exploitation plus approfondis sans intégrer toutes ces
consignes directement dans chaque description d’outil.

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

Le budget de la liste des Skills appartient au sous-système Skills :

- Valeur globale par défaut : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits de runtime génériques bornés utilisent une autre surface :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation garde le dimensionnement des Skills distinct du dimensionnement des lectures/injections de runtime comme
`memory_get`, les résultats d’outils en direct et les actualisations AGENTS.md post-compaction.

## Documentation

L’invite système inclut une section **Documentation**. Lorsque la documentation locale est disponible, elle
pointe vers le répertoire local de documentation OpenClaw (`docs/` dans un checkout Git ou la documentation groupée du paquet npm).
Si la documentation locale est indisponible, elle se rabat sur
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut aussi l’emplacement du code source OpenClaw. Les checkouts Git exposent la racine
source locale afin que l’agent puisse inspecter directement le code. Les installations de paquet incluent l’URL
source GitHub et indiquent à l’agent d’y consulter le code source lorsque la documentation est incomplète ou
obsolète. L’invite mentionne aussi le miroir public de la documentation, le Discord communautaire et ClawHub
([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Elle indique au modèle de
consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et
d’exécuter `openclaw status` lui-même lorsque c’est possible (en demandant à l’utilisateur seulement lorsqu’il n’a pas accès).
Pour la configuration en particulier, elle dirige les agents vers l’action de l’outil `gateway`
`config.schema.lookup` pour la documentation et les contraintes exactes au niveau des champs, puis vers
`docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md`
pour des consignes plus générales.

## Liens connexes

- [Runtime de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
