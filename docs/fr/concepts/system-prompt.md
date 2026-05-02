---
read_when:
    - Modification du texte de l’invite système, de la liste des outils ou des sections heure/Heartbeat
    - Modifier le comportement d’amorçage de l’espace de travail ou d’injection des Skills
summary: Ce que contient l’invite système d’OpenClaw et comment elle est assemblée
title: Prompt système
x-i18n:
    generated_at: "2026-05-02T20:45:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit une invite système personnalisée pour chaque exécution d’agent. L’invite est **détenue par OpenClaw** et n’utilise pas l’invite par défaut de pi-coding-agent.

L’invite est assemblée par OpenClaw et injectée dans chaque exécution d’agent.

Les plugins fournisseurs peuvent contribuer des consignes d’invite compatibles avec le cache sans remplacer
l’invite complète détenue par OpenClaw. Le runtime fournisseur peut :

- remplacer un petit ensemble de sections centrales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache d’invite
- injecter un **suffixe dynamique** sous la limite du cache d’invite

Utilisez les contributions détenues par le fournisseur pour l’ajustement propre à une famille de modèles. Conservez l’ancienne
mutation d’invite `before_prompt_build` pour la compatibilité ou les changements d’invite réellement globaux,
pas pour le comportement fournisseur normal.

La superposition de la famille OpenAI GPT-5 garde la règle d’exécution centrale concise et ajoute
des consignes propres au modèle pour l’ancrage de persona, la concision de sortie, la discipline d’outil,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

L’invite est volontairement compacte et utilise des sections fixes :

- **Outils** : rappel de la source de vérité des outils structurés, plus consignes d’utilisation des outils au runtime.
- **Biais d’exécution** : consignes compactes de suivi : agir dans le tour sur
  les demandes actionnables, continuer jusqu’à l’achèvement ou au blocage, récupérer après des résultats d’outil faibles,
  vérifier l’état mutable en direct et vérifier avant de finaliser.
- **Sécurité** : bref rappel de garde-fou pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsque disponibles) : indique au modèle comment charger les instructions de Skills à la demande.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration complète
  avec `config.apply` et exécuter `update.run` uniquement sur demande explicite de l’utilisateur.
  L’outil réservé au propriétaire `gateway` refuse également de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les anciens alias `tools.bash.*`
  qui se normalisent vers ces chemins d’exécution protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et quand la lire.
- **Fichiers d’espace de travail (injectés)** : indique que les fichiers de démarrage sont inclus ci-dessous.
- **Sandbox** (lorsqu’activé) : indique le runtime sandboxé, les chemins de sandbox et si l’exécution avec élévation est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format horaire.
- **Balises de réponse** : syntaxe facultative des balises de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : invite Heartbeat et comportement d’acquittement, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication de bascule /reasoning.

OpenClaw conserve le contenu stable volumineux, y compris le **contexte du projet**, au-dessus de la
limite interne du cache d’invite. Les sections volatiles de canal/session telles que
les consignes d’intégration de Control UI, **Messagerie**, **Voix**, **Contexte de discussion de groupe**,
**Réactions**, **Heartbeats** et **Runtime** sont ajoutées sous cette limite
afin que les backends locaux avec caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent également éviter d’intégrer les noms de canal actuels
lorsque le schéma accepté porte déjà ce détail de runtime.

La section Outils inclut également des consignes de runtime pour les travaux de longue durée :

- utiliser Cron pour le suivi futur (`check back later`, rappels, travail récurrent)
  plutôt que des boucles de sommeil `exec`, des astuces de délai `yieldMs` ou des interrogations répétées de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil fondé sur le push lorsqu’il émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus vaste, préférer `sessions_spawn` ; la fin du sous-agent est
  fondée sur le push et s’annonce automatiquement au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle simplement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, Outils indique également au
modèle de l’utiliser uniquement pour les travaux multiétapes non triviaux, de conserver exactement une étape
`in_progress` et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans l’invite système sont consultatifs. Ils guident le comportement du modèle, mais n’appliquent aucune politique. Utilisez la politique des outils, les approbations d’exécution, le sandboxing et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux dotés de cartes/boutons d’approbation natifs, l’invite de runtime indique maintenant à
l’agent de s’appuyer d’abord sur cette UI d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations par discussion sont indisponibles ou que
l’approbation manuelle est le seul chemin.

## Modes d’invite

OpenClaw peut produire des invites système plus petites pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration visible par l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Auto-mise à jour OpenClaw
  Self-Update**, **Alias de modèles**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Les outils, **Sécurité**,
  l’espace de travail, la Sandbox, la date et l’heure actuelles (lorsqu’elles sont connues), le Runtime et le contexte
  injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les invites injectées supplémentaires sont étiquetées **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique de canal, OpenClaw peut omettre la section générique **Réponses silencieuses**
lorsque le contexte de discussion directe/de groupe inclut déjà le comportement `NO_REPLY`
propre à la conversation résolue. Cela évite de répéter les mécanismes de jetons
à la fois dans l’invite système globale et dans le contexte de canal.

## Instantanés d’invite

OpenClaw conserve des instantanés d’invite du chemin nominal validés pour le runtime Codex/outil de messagerie
sous `test/fixtures/agents/prompt-snapshots/happy-path/`. Ils restituent
les instructions développeur du serveur d’application Codex détenues par OpenClaw, les paramètres de
début/reprise de fil sélectionnés, l’entrée utilisateur du tour et les spécifications d’outils dynamiques pour les tours directs Telegram,
les groupes Discord et les Heartbeats. L’invite système de base Codex cachée et
les instructions de mode de collaboration Codex limitées au tour appartiennent au runtime Codex
et ne sont pas restituées par OpenClaw.

Régénérez-les avec `pnpm prompt:snapshots:gen` et vérifiez la dérive avec
`pnpm prompt:snapshots:check`.

## Injection de démarrage de l’espace de travail

Les fichiers de démarrage sont élagués et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans lectures explicites :

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
concis — en particulier `MEMORY.md`, qui peut croître avec le temps et entraîner
une utilisation de contexte étonnamment élevée et une Compaction plus fréquente.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du contexte du projet de démarrage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, de sorte qu’ils ne comptent pas dans la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et `/reset` nus sont l’exception : le runtime peut préfixer la mémoire quotidienne récente sous forme de bloc de contexte de démarrage ponctuel pour ce premier tour.
</Note>

Les grands fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu de démarrage injecté total
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsque la troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans le contexte du projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers de démarrage
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers de démarrage injectés (par exemple en remplaçant `SOUL.md` par une persona alternative).

Si vous voulez rendre l’agent moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brute vs injectée, troncature, plus surcoût du schéma d’outil), utilisez `/context list` ou `/context detail`. Consultez [Contexte](/fr/concepts/context).

## Gestion du temps

L’invite système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder l’invite stable vis-à-vis du cache, elle n’inclut maintenant que
le **fuseau horaire** (sans horloge dynamique ni format horaire).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut facultativement définir un remplacement de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consultez [Date et heure](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills admissibles existent, OpenClaw injecte une **liste des Skills disponibles** compacte
(`formatSkillsForPrompt`) qui inclut le **chemin du fichier** pour chaque Skill. L’invite
demande au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement indiqué
(espace de travail, géré ou groupé). Si aucun Skill n’est admissible, la section
Skills est omise.

L’admissibilité inclut les portes de métadonnées de Skill, les vérifications d’environnement/configuration du runtime,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills groupés avec un Plugin ne sont admissibles que lorsque leur Plugin propriétaire est activé.
Cela permet aux plugins d’outils d’exposer des guides d’exploitation plus approfondis sans intégrer tout
ce guidage directement dans chaque description d’outil.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela garde l’invite de base petite tout en permettant une utilisation ciblée des Skills.

Le budget de la liste des Skills appartient au sous-système Skills :

- Valeur par défaut globale : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits de runtime génériques bornés utilisent une surface différente :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation garde le dimensionnement des Skills séparé du dimensionnement des lectures/injections de runtime comme
`memory_get`, les résultats d’outils en direct et les rafraîchissements AGENTS.md après Compaction.

## Documentation

L’invite système inclut une section **Documentation**. Lorsque la documentation locale est disponible, elle
pointe vers le répertoire de documentation OpenClaw local (`docs/` dans une extraction Git ou les docs du package npm
groupé). Si la documentation locale est indisponible, elle se rabat sur
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut également l’emplacement de la source OpenClaw. Les extractions Git exposent la racine
source locale afin que l’agent puisse inspecter le code directement. Les installations de package incluent l’URL
source GitHub et indiquent à l’agent d’y examiner la source lorsque la documentation est incomplète ou
obsolète. L’invite mentionne également le miroir public de la documentation, le Discord communautaire et ClawHub
([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Elle indique au modèle de
consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture OpenClaw, et
d’exécuter `openclaw status` lui-même lorsque c’est possible (en ne demandant à l’utilisateur que lorsqu’il n’a pas accès).
Pour la configuration en particulier, elle oriente les agents vers l’action de l’outil `gateway`
`config.schema.lookup` pour les docs et contraintes exactes au niveau des champs, puis vers
`docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md`
pour des consignes plus larges.

## Associé

- [Environnement d’exécution de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
