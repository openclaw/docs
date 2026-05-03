---
read_when:
    - Modification du texte de l’invite système, de la liste des outils ou des sections heure/Heartbeat
    - Modification du comportement d’amorçage de l’espace de travail ou d’injection de Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Invite système
x-i18n:
    generated_at: "2026-05-03T21:30:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt est **détenu par OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les plugins de fournisseur peuvent contribuer des consignes de prompt compatibles avec le cache sans remplacer
le prompt complet détenu par OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections cœur nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite du cache de prompt
- injecter un **suffixe dynamique** sous la limite du cache de prompt

Utilisez les contributions détenues par le fournisseur pour l’ajustement spécifique aux familles de modèles. Conservez la mutation de prompt héritée
`before_prompt_build` pour la compatibilité ou les changements de prompt vraiment globaux,
pas pour le comportement normal d’un fournisseur.

La surcouche de la famille OpenAI GPT-5 garde la règle d’exécution principale réduite et ajoute
des consignes propres au modèle pour l’ancrage de persona, les sorties concises, la discipline des outils,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Outils** : rappel de la source de vérité des outils structurés, plus consignes d’utilisation des outils au runtime.
- **Biais d’exécution** : consignes compactes de suivi : agir dans le tour sur
  les demandes actionnables, continuer jusqu’à la fin ou jusqu’au blocage, se reprendre après des résultats d’outil faibles,
  vérifier l’état mutable en direct, et vérifier avant de finaliser.
- **Sécurité** : bref rappel de garde-fous pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’ils sont disponibles) : indique au modèle comment charger les instructions de skill à la demande.
- **Auto-mise à jour OpenClaw** : comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer la configuration complète
  avec `config.apply`, et exécuter `update.run` uniquement à la demande explicite de l’utilisateur.
  L’outil réservé au propriétaire `gateway` refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et quand la lire.
- **Fichiers d’espace de travail (injectés)** : indique que les fichiers de démarrage sont inclus ci-dessous.
- **Sandbox** (lorsqu’il est activé) : indique le runtime sandboxé, les chemins de sandbox, et si l’exec élevé est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format d’heure.
- **Balises de réponse** : syntaxe optionnelle de balise de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt de Heartbeat et comportement d’accusé de réception, lorsque les Heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, Node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication du basculement /reasoning.

OpenClaw garde le contenu stable volumineux, y compris le **contexte du projet**, au-dessus de la
limite interne du cache de prompt. Les sections volatiles de canal/session telles que
les consignes intégrées de l’interface de contrôle, la **messagerie**, la **voix**, le **contexte de discussion de groupe**,
les **réactions**, les **Heartbeats** et le **runtime** sont ajoutées sous cette limite
afin que les backends locaux avec caches de préfixe puissent réutiliser le préfixe stable de l’espace de travail
entre les tours de canal. Les descriptions d’outils doivent également éviter d’intégrer les noms de canaux actuels
lorsque le schéma accepté transporte déjà ce détail de runtime.

La section Outils inclut aussi des consignes de runtime pour les travaux de longue durée :

- utiliser Cron pour les suivis futurs (`check back later`, rappels, travaux récurrents)
  au lieu de boucles de sommeil `exec`, d’astuces de délai `yieldMs` ou d’interrogations répétées de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil basé sur push lorsqu’elle émet une sortie ou échoue
- utiliser `process` pour les journaux, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la fin du sous-agent est
  basée sur push et s’annonce automatiquement au demandeur
- ne pas interroger `subagents list` / `sessions_list` en boucle simplement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, Outils indique aussi au
modèle de l’utiliser uniquement pour les travaux multiétapes non triviaux, de garder exactement une
étape `in_progress`, et d’éviter de répéter tout le plan après chaque mise à jour.

Les garde-fous de sécurité dans le prompt système sont consultatifs. Ils guident le comportement du modèle mais n’appliquent pas la politique. Utilisez la politique des outils, les approbations exec, le sandboxing et les listes d’autorisation de canal pour l’application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt runtime indique désormais à
l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations par chat sont indisponibles ou que
l’approbation manuelle est le seul chemin.

## Modes de prompt

OpenClaw peut rendre des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (pas une configuration exposée à l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel de mémoire**, **Auto-mise à jour OpenClaw**,
  **Alias de modèles**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outils, **Sécurité**,
  Espace de travail, Sandbox, Date et heure actuelles (lorsqu’elles sont connues), Runtime et le contexte
  injecté restent disponibles.
- `none` : retourne uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont étiquetés **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

Pour les exécutions de réponse automatique de canal, OpenClaw peut omettre la section générique **Réponses silencieuses**
lorsque le contexte de discussion directe/de groupe inclut déjà le comportement `NO_REPLY`
résolu et spécifique à la conversation. Cela évite de répéter la mécanique des tokens
dans le prompt système global et le contexte de canal.

## Instantanés de prompt

OpenClaw conserve des instantanés de prompt validés pour le chemin heureux du runtime Codex sous
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Ils rendent
des paramètres sélectionnés de thread/tour du serveur d’application, plus une pile de couches de prompt
liées au modèle et reconstruite pour les tours directs Telegram, de groupe Discord et de Heartbeat. Cette pile
inclut une fixture de prompt de modèle Codex `gpt-5.5` épinglée générée à partir de la forme du
catalogue/cache de modèles de Codex, le texte développeur de permissions du chemin heureux Codex,
les instructions développeur OpenClaw, les instructions de mode de collaboration limitées au tour
lorsqu’OpenClaw les fournit, l’entrée du tour utilisateur et les références aux spécifications d’outils dynamiques.

Actualisez la fixture de prompt de modèle Codex épinglée avec
`pnpm prompt:snapshots:sync-codex-model`. Par défaut, le script cherche
le cache runtime de Codex dans `$CODEX_HOME/models_cache.json`, puis
`~/.codex/models_cache.json`, et seulement ensuite se rabat sur la convention de checkout Codex
mainteneur à `~/code/codex/codex-rs/models-manager/models.json`. Si
aucune de ces sources n’existe, la commande se termine sans modifier la fixture
validée. Passez `--catalog <path>` pour actualiser depuis un fichier `models_cache.json`
ou `models.json` spécifique.

Ces instantanés ne sont toujours pas une capture brute octet pour octet d’une requête OpenAI. Codex
peut ajouter du contexte d’espace de travail détenu par le runtime, comme `AGENTS.md`, le contexte
d’environnement, les mémoires, les instructions d’application/plugin et les instructions intégrées Default
du mode de collaboration dans le runtime Codex après qu’OpenClaw a envoyé
les paramètres de thread et de tour.

Régénérez-les avec `pnpm prompt:snapshots:gen` et vérifiez la dérive avec
`pnpm prompt:snapshots:check`. La CI exécute la vérification de dérive dans le shard de frontière
supplémentaire afin que les changements de prompt et les mises à jour d’instantanés restent attachés à la même
PR.

## Injection de démarrage de l’espace de travail

Les fichiers de démarrage sont tronqués et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans avoir besoin de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement sur les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, sauf si
une garde propre au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les Heartbeats sont désactivés pour l’agent par défaut ou lorsque
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés
concis — en particulier `MEMORY.md`, qui peut grandir avec le temps et entraîner
une utilisation du contexte étonnamment élevée ainsi qu’une Compaction plus fréquente.

Lorsqu’une session s’exécute sur le harnais Codex natif, Codex charge `AGENTS.md`
via sa propre découverte de documents de projet. OpenClaw résout tout de même les autres
fichiers de démarrage et les transmet comme instructions de configuration Codex, afin que `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et
`MEMORY.md` conservent le même rôle de contexte d’espace de travail sans dupliquer
`AGENTS.md`.

<Note>
Les fichiers quotidiens `memory/*.md` ne font **pas** partie du Contexte du projet de démarrage normal. Lors des tours ordinaires, ils sont consultés à la demande via les outils `memory_search` et `memory_get`, de sorte qu’ils ne comptent pas dans la fenêtre de contexte sauf si le modèle les lit explicitement. Les tours nus `/new` et `/reset` constituent l’exception : le runtime peut préfixer la mémoire quotidienne récente comme bloc de contexte de démarrage ponctuel pour ce premier tour.
</Note>

Les fichiers volumineux sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu de démarrage injecté total
sur tous les fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans Contexte du projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent injectent uniquement `AGENTS.md` et `TOOLS.md` (les autres fichiers de démarrage
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers de démarrage injectés (par exemple remplacer `SOUL.md` par une persona alternative).

Si vous voulez rendre le ton de l’agent moins générique, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge de schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache de prompt stable, il inclut désormais uniquement
le **fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut facultativement définir un remplacement de modèle par session
(`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date et heure](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** de chaque skill. Le
prompt demande au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement indiqué
(espace de travail, géré ou groupé). Si aucun skill n’est éligible, la section
Skills est omise.

L’éligibilité inclut les gardes de métadonnées de skill, les vérifications d’environnement/configuration runtime,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills groupés avec un plugin ne sont éligibles que lorsque leur plugin propriétaire est activé.
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

Cela garde le prompt de base réduit tout en permettant une utilisation ciblée des Skills.

Le budget de la liste des Skills est détenu par le sous-système des Skills :

- Valeur globale par défaut : `skills.limits.maxSkillsPromptChars`
- Remplacement par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits d’exécution bornés génériques utilisent une surface différente :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation garde le dimensionnement des Skills distinct du dimensionnement de lecture/injection à l’exécution, tel que `memory_get`, les résultats d’outils en direct et les actualisations d’AGENTS.md après Compaction.

## Documentation

L’invite système comprend une section **Documentation**. Lorsque la documentation locale est disponible, elle pointe vers le répertoire local de documentation d’OpenClaw (`docs/` dans une extraction Git ou la documentation du package npm intégré). Si la documentation locale n’est pas disponible, elle se rabat sur [https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut également l’emplacement du code source d’OpenClaw. Les extractions Git exposent la racine locale du code source afin que l’agent puisse inspecter le code directement. Les installations de package incluent l’URL du code source GitHub et demandent à l’agent d’y consulter le code source chaque fois que la documentation est incomplète ou obsolète. L’invite mentionne également le miroir de documentation public, le Discord de la communauté et ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour la découverte des Skills. Elle indique au modèle de consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et d’exécuter lui-même `openclaw status` lorsque c’est possible (en ne demandant à l’utilisateur que lorsqu’il n’a pas accès). Pour la configuration en particulier, elle oriente les agents vers l’action d’outil `gateway` `config.schema.lookup` pour obtenir la documentation et les contraintes exactes au niveau des champs, puis vers `docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md` pour des conseils plus larges.

## Associé

- [Exécution de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
