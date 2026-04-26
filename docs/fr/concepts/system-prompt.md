---
read_when:
    - Modifier le texte du prompt système, la liste des outils ou les sections heure/Heartbeat
    - Modifier le bootstrap de l’espace de travail ou le comportement d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-04-26T11:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt est **détenu par OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les Plugins de fournisseur peuvent apporter des indications de prompt sensibles au cache sans remplacer
le prompt complet détenu par OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections centrales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite de cache du prompt
- injecter un **suffixe dynamique** au-dessous de la limite de cache du prompt

Utilisez les contributions détenues par le fournisseur pour un réglage spécifique à une famille de modèles. Conservez la mutation de prompt héritée
`before_prompt_build` pour la compatibilité ou pour des modifications de prompt véritablement globales, et non pour le comportement normal du fournisseur.

La surcouche de la famille OpenAI GPT-5 garde la règle centrale d’exécution légère et ajoute
des indications spécifiques au modèle pour l’ancrage de persona, la sortie concise, la discipline d’outil,
la recherche parallèle, la couverture des livrables, la vérification, le contexte manquant et
l’hygiène des outils de terminal.

## Structure

Le prompt est intentionnellement compact et utilise des sections fixes :

- **Outils** : rappel de la source de vérité des outils structurés, plus indications d’exécution sur l’utilisation des outils.
- **Biais d’exécution** : indications compactes de suivi : agir dans le tour sur
  les demandes exploitables, continuer jusqu’à ce que ce soit terminé ou bloqué, récupérer après des résultats d’outil faibles,
  vérifier en direct l’état mutable et vérifier avant de finaliser.
- **Sécurité** : court rappel de garde-fou pour éviter un comportement de recherche de pouvoir ou de contournement de la supervision.
- **Skills** (lorsqu’ils sont disponibles) : indique au modèle comment charger à la demande les instructions de skill.
- **Mise à jour d’OpenClaw lui-même** : comment inspecter la config en toute sécurité avec
  `config.schema.lookup`, corriger la config avec `config.patch`, remplacer la config
  complète avec `config.apply`, et exécuter `update.run` uniquement sur demande
  explicite de l’utilisateur. L’outil `gateway`, réservé au propriétaire, refuse aussi de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et quand la lire.
- **Fichiers d’espace de travail (injectés)** : indique que les fichiers de bootstrap sont inclus ci-dessous.
- **Sandbox** (lorsqu’il est activé) : indique le runtime sandboxé, les chemins sandbox et si l’exécution elevated est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format d’heure.
- **Balises de réponse** : syntaxe facultative de balise de réponse pour les fournisseurs pris en charge.
- **Heartbeats** : prompt Heartbeat et comportement d’accusé de réception, lorsque les heartbeats sont activés pour l’agent par défaut.
- **Runtime** : hôte, OS, Node, modèle, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau actuel de visibilité + indication de bascule `/reasoning`.

La section Outils inclut également des indications d’exécution pour le travail de longue durée :

- utiliser cron pour le suivi ultérieur (`check back later`, rappels, travail récurrent)
  au lieu de boucles de veille `exec`, d’astuces de délai `yieldMs` ou de sondages répétés avec `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à l’achèvement est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil push lorsqu’elle émet une sortie ou échoue
- utiliser `process` pour les logs, l’état, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; l’achèvement du sous-agent est
  basé sur le push et s’annonce automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` en boucle juste pour attendre
  l’achèvement

Lorsque l’outil expérimental `update_plan` est activé, la section Outils indique aussi au
modèle de ne l’utiliser que pour un travail non trivial en plusieurs étapes, de conserver exactement une
étape `in_progress` et d’éviter de répéter l’intégralité du plan après chaque mise à jour.

Les garde-fous de sécurité dans le prompt système sont indicatifs. Ils guident le comportement du modèle mais n’appliquent pas la politique. Utilisez la stratégie d’outil, les approbations exec, le sandboxing et les listes d’autorisation de canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes/boutons d’approbation natifs, le prompt du runtime indique désormais à
l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations dans le chat ne sont pas disponibles ou
que l’approbation manuelle est le seul chemin possible.

## Modes de prompt

OpenClaw peut générer des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une config visible par l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Mise à jour d’OpenClaw
  lui-même**, **Alias de modèles**, **Identité utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Heartbeats**. Outils, **Sécurité**,
  Espace de travail, Sandbox, Date et heure actuelles (lorsqu’elles sont connues), Runtime et
  contexte injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont libellés **Contexte de sous-agent**
au lieu de **Contexte de discussion de groupe**.

## Injection du bootstrap de l’espace de travail

Les fichiers de bootstrap sont rognés et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans avoir besoin de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement dans les espaces de travail tout neufs)
- `MEMORY.md` lorsqu’il est présent

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour sauf
si une restriction spécifique au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les heartbeats sont désactivés pour l’agent par défaut ou lorsque
`agents.defaults.heartbeat.includeSystemPromptSection` est false. Gardez les fichiers injectés concis —
en particulier `MEMORY.md`, qui peut grossir avec le temps et entraîner une utilisation du contexte
étonnamment élevée ainsi qu’une Compaction plus fréquente.

> **Remarque :** les fichiers quotidiens `memory/*.md` ne font **pas** partie du bootstrap
> normal du Contexte du projet. Lors des tours ordinaires, ils sont consultés à la demande via les
> outils `memory_search` et `memory_get`, de sorte qu’ils ne comptent pas dans la
> fenêtre de contexte sauf si le modèle les lit explicitement. Les tours `/new` et
> `/reset` seuls sont l’exception : le runtime peut préfixer la mémoire quotidienne récente
> comme bloc de contexte de démarrage à usage unique pour ce premier tour.

Les gros fichiers sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 12000). Le contenu total de bootstrap injecté
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 60000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsque la troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans le Contexte du projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers de bootstrap
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers de bootstrap injectés (par exemple remplacer `SOUL.md` par une persona alternative).

Si vous voulez rendre l’agent moins générique dans sa manière de parler, commencez par
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge du schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Gestion de l’heure

Le prompt système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache du prompt stable, il n’inclut désormais que
le **fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut éventuellement définir une substitution de modèle
par session (`model=default` l’efface).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date et heure](/fr/date-time) pour les détails complets du comportement.

## Skills

Lorsque des Skills admissibles existent, OpenClaw injecte une **liste compacte des skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin de fichier** pour chaque skill. Le
prompt indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement
indiqué (espace de travail, géré ou inclus). S’il n’existe aucun skill admissible, la
section Skills est omise.

L’admissibilité inclut les restrictions de métadonnées de skill, les vérifications d’environnement/config du runtime
et la liste d’autorisation effective des skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

Les Skills inclus par un Plugin ne sont admissibles que lorsque leur Plugin propriétaire est activé.
Cela permet aux Plugins d’outils d’exposer des guides de fonctionnement plus approfondis sans intégrer
toutes ces indications directement dans chaque description d’outil.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela permet de garder le prompt de base réduit tout en rendant possible une utilisation ciblée des Skills.

Le budget de la liste des skills appartient au sous-système des skills :

- Valeur par défaut globale : `skills.limits.maxSkillsPromptChars`
- Substitution par agent : `agents.list[].skillsLimits.maxSkillsPromptChars`

Les extraits bornés génériques du runtime utilisent une autre surface :

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Cette séparation garde le dimensionnement des skills distinct du dimensionnement de lecture/injection du runtime tel que
`memory_get`, les résultats d’outils live et les actualisations de `AGENTS.md` après Compaction.

## Documentation

Le prompt système inclut une section **Documentation**. Lorsque la documentation locale est disponible, elle
pointe vers le répertoire local de documentation OpenClaw (`docs/` dans un checkout Git ou la documentation du
package npm incluse). Si la documentation locale n’est pas disponible, elle revient à
[https://docs.openclaw.ai](https://docs.openclaw.ai).

La même section inclut aussi l’emplacement du code source OpenClaw. Les checkouts Git exposent la racine
de source locale afin que l’agent puisse inspecter directement le code. Les installations par package incluent l’URL GitHub
de la source et indiquent à l’agent d’y consulter la source chaque fois que la documentation est incomplète ou
obsolète. Le prompt mentionne aussi le miroir public de la documentation, le Discord de la communauté et ClawHub
([https://clawhub.ai](https://clawhub.ai)) pour la découverte de Skills. Il indique au modèle de
consulter d’abord la documentation pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et de
lancer lui-même `openclaw status` lorsque c’est possible (en demandant à l’utilisateur uniquement lorsqu’il n’a pas accès).
Pour la configuration spécifiquement, il oriente les agents vers l’action d’outil `gateway`
`config.schema.lookup` pour obtenir la documentation exacte au niveau des champs et les contraintes, puis vers
`docs/gateway/configuration.md` et `docs/gateway/configuration-reference.md`
pour des indications plus larges.

## Lié

- [Runtime de l’agent](/fr/concepts/agent)
- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Moteur de contexte](/fr/concepts/context-engine)
