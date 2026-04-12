---
read_when:
    - Modification du texte du prompt système, de la liste des outils ou des sections heure/pulsation
    - Modification du comportement d’amorçage de l’espace de travail ou d’injection des Skills
summary: Ce que contient le prompt système d’OpenClaw et comment il est assemblé
title: Prompt système
x-i18n:
    generated_at: "2026-04-12T06:49:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 057f01aac51f7737b5223f61f5d55e552d9011232aebb130426e269d8f6c257f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt système

OpenClaw construit un prompt système personnalisé pour chaque exécution d’agent. Le prompt est **géré par OpenClaw** et n’utilise pas le prompt par défaut de pi-coding-agent.

Le prompt est assemblé par OpenClaw et injecté dans chaque exécution d’agent.

Les plugins de fournisseur peuvent apporter des indications de prompt compatibles avec le cache sans remplacer l’intégralité du prompt géré par OpenClaw. Le runtime du fournisseur peut :

- remplacer un petit ensemble de sections principales nommées (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injecter un **préfixe stable** au-dessus de la limite de cache du prompt
- injecter un **suffixe dynamique** au-dessous de la limite de cache du prompt

Utilisez les contributions gérées par le fournisseur pour l’ajustement spécifique à une famille de modèles. Conservez la mutation de prompt héritée `before_prompt_build` pour la compatibilité ou pour de véritables modifications globales du prompt, pas pour le comportement normal d’un fournisseur.

## Structure

Le prompt est volontairement compact et utilise des sections fixes :

- **Outils** : rappel structuré de la source de vérité des outils, plus indications d’exécution pour l’utilisation des outils.
- **Sécurité** : court rappel des garde-fous pour éviter les comportements de recherche de pouvoir ou le contournement de la supervision.
- **Skills** (lorsqu’elles sont disponibles) : indique au modèle comment charger les instructions des Skills à la demande.
- **Auto-mise à jour d’OpenClaw** : explique comment inspecter la configuration en toute sécurité avec
  `config.schema.lookup`, corriger la configuration avec `config.patch`, remplacer l’intégralité de la
  configuration avec `config.apply`, et exécuter `update.run` uniquement sur demande explicite de l’utilisateur. L’outil `gateway`, réservé au propriétaire, refuse également de réécrire
  `tools.exec.ask` / `tools.exec.security`, y compris les alias hérités `tools.bash.*`
  qui se normalisent vers ces chemins exec protégés.
- **Espace de travail** : répertoire de travail (`agents.defaults.workspace`).
- **Documentation** : chemin local vers la documentation OpenClaw (dépôt ou package npm) et moment où la lire.
- **Fichiers de l’espace de travail (injectés)** : indique que les fichiers d’amorçage sont inclus ci-dessous.
- **Sandbox** (lorsqu’elle est activée) : indique l’environnement d’exécution isolé, les chemins de sandbox et si l’exécution élevée est disponible.
- **Date et heure actuelles** : heure locale de l’utilisateur, fuseau horaire et format d’heure.
- **Balises de réponse** : syntaxe facultative des balises de réponse pour les fournisseurs pris en charge.
- **Pulsations** : prompt de pulsation et comportement d’accusé de réception, lorsque les pulsations sont activées pour l’agent par défaut.
- **Runtime** : hôte, OS, node, racine du dépôt (lorsqu’elle est détectée), niveau de réflexion (une ligne).
- **Raisonnement** : niveau de visibilité actuel + indication de bascule `/reasoning`.

La section Outils comprend également des indications d’exécution pour les tâches de longue durée :

- utiliser cron pour un suivi ultérieur (`check back later`, rappels, travail récurrent)
  au lieu de boucles `exec` avec veille, d’astuces de délai `yieldMs` ou d’un sondage répété de `process`
- utiliser `exec` / `process` uniquement pour les commandes qui démarrent maintenant et continuent à s’exécuter
  en arrière-plan
- lorsque le réveil automatique à la fin est activé, démarrer la commande une seule fois et s’appuyer sur
  le chemin de réveil push lorsqu’elle émet une sortie ou échoue
- utiliser `process` pour les journaux, le statut, l’entrée ou l’intervention lorsque vous devez
  inspecter une commande en cours d’exécution
- si la tâche est plus importante, préférer `sessions_spawn` ; la fin d’un sous-agent est
  pilotée par push et réannoncée automatiquement au demandeur
- ne pas sonder `subagents list` / `sessions_list` en boucle uniquement pour attendre
  la fin

Lorsque l’outil expérimental `update_plan` est activé, la section Outils indique également au
modèle de l’utiliser uniquement pour les tâches non triviales en plusieurs étapes, de conserver exactement une étape
`in_progress`, et d’éviter de répéter l’intégralité du plan après chaque mise à jour.

Les garde-fous de sécurité dans le prompt système sont indicatifs. Ils guident le comportement du modèle mais n’appliquent pas la politique. Utilisez la politique des outils, les approbations exec, le sandboxing et les listes d’autorisation des canaux pour une application stricte ; les opérateurs peuvent les désactiver par conception.

Sur les canaux avec cartes ou boutons d’approbation natifs, le prompt d’exécution indique désormais à
l’agent de s’appuyer d’abord sur cette interface d’approbation native. Il ne doit inclure une commande manuelle
`/approve` que lorsque le résultat de l’outil indique que les approbations dans le chat ne sont pas disponibles ou
que l’approbation manuelle est la seule possibilité.

## Modes de prompt

OpenClaw peut produire des prompts système plus petits pour les sous-agents. Le runtime définit un
`promptMode` pour chaque exécution (ce n’est pas une configuration visible par l’utilisateur) :

- `full` (par défaut) : inclut toutes les sections ci-dessus.
- `minimal` : utilisé pour les sous-agents ; omet **Skills**, **Rappel mémoire**, **Auto-mise à jour d’OpenClaw**, **Alias de modèles**, **Identité de l’utilisateur**, **Balises de réponse**,
  **Messagerie**, **Réponses silencieuses** et **Pulsations**. Outils, **Sécurité**,
  Espace de travail, Sandbox, Date et heure actuelles (lorsqu’elles sont connues), Runtime et le contexte
  injecté restent disponibles.
- `none` : renvoie uniquement la ligne d’identité de base.

Lorsque `promptMode=minimal`, les prompts injectés supplémentaires sont libellés **Contexte du sous-agent**
au lieu de **Contexte du chat de groupe**.

## Injection de l’amorçage de l’espace de travail

Les fichiers d’amorçage sont tronqués et ajoutés sous **Contexte du projet** afin que le modèle voie le contexte d’identité et de profil sans nécessiter de lectures explicites :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement dans les tout nouveaux espaces de travail)
- `MEMORY.md` lorsqu’il est présent, sinon `memory.md` comme solution de repli en minuscules

Tous ces fichiers sont **injectés dans la fenêtre de contexte** à chaque tour, sauf si
un garde-fou spécifique au fichier s’applique. `HEARTBEAT.md` est omis lors des exécutions normales lorsque
les pulsations sont désactivées pour l’agent par défaut ou lorsque
`agents.defaults.heartbeat.includeSystemPromptSection` vaut false. Gardez les fichiers injectés concis —
en particulier `MEMORY.md`, qui peut grossir avec le temps et entraîner
une utilisation du contexte étonnamment élevée ainsi que des compactages plus fréquents.

> **Remarque :** les fichiers quotidiens `memory/*.md` ne font **pas** partie du
> **Contexte du projet** d’amorçage normal. Lors des tours ordinaires, on y accède à la demande via les outils
> `memory_search` et `memory_get`, de sorte qu’ils ne comptent pas dans la
> fenêtre de contexte à moins que le modèle ne les lise explicitement. Les tours simples `/new` et
> `/reset` constituent l’exception : le runtime peut préfixer la mémoire quotidienne récente
> sous la forme d’un bloc ponctuel de contexte de démarrage pour ce premier tour.

Les fichiers volumineux sont tronqués avec un marqueur. La taille maximale par fichier est contrôlée par
`agents.defaults.bootstrapMaxChars` (par défaut : 20000). Le contenu total d’amorçage injecté
sur l’ensemble des fichiers est plafonné par `agents.defaults.bootstrapTotalMaxChars`
(par défaut : 150000). Les fichiers manquants injectent un court marqueur de fichier manquant. Lorsqu’une troncature
se produit, OpenClaw peut injecter un bloc d’avertissement dans Contexte du projet ; contrôlez cela avec
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ;
par défaut : `once`).

Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md` (les autres fichiers d’amorçage
sont filtrés pour garder le contexte du sous-agent réduit).

Les hooks internes peuvent intercepter cette étape via `agent:bootstrap` pour modifier ou remplacer
les fichiers d’amorçage injectés (par exemple en remplaçant `SOUL.md` par une persona alternative).

Si vous souhaitez rendre l’agent moins générique, commencez par le
[Guide de personnalité SOUL.md](/fr/concepts/soul).

Pour inspecter la contribution de chaque fichier injecté (brut vs injecté, troncature, plus surcharge du schéma d’outil), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Gestion du temps

Le prompt système inclut une section dédiée **Date et heure actuelles** lorsque le
fuseau horaire de l’utilisateur est connu. Pour garder le cache du prompt stable, elle n’inclut désormais que le
**fuseau horaire** (pas d’horloge dynamique ni de format d’heure).

Utilisez `session_status` lorsque l’agent a besoin de l’heure actuelle ; la carte d’état
inclut une ligne d’horodatage. Le même outil peut aussi définir une substitution de modèle par session
(`model=default` la supprime).

Configurez avec :

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Voir [Date et heure](/fr/date-time) pour tous les détails du comportement.

## Skills

Lorsque des Skills éligibles existent, OpenClaw injecte une **liste compacte des Skills disponibles**
(`formatSkillsForPrompt`) qui inclut le **chemin du fichier** pour chaque Skill. Le
prompt indique au modèle d’utiliser `read` pour charger le SKILL.md à l’emplacement indiqué
(espace de travail, géré ou intégré). Si aucune Skill n’est éligible, la section
Skills est omise.

L’éligibilité comprend les garde-fous des métadonnées des Skills, les vérifications d’environnement/configuration d’exécution,
et la liste d’autorisation effective des Skills de l’agent lorsque `agents.defaults.skills` ou
`agents.list[].skills` est configuré.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Cela maintient un prompt de base réduit tout en permettant une utilisation ciblée des Skills.

## Documentation

Lorsque disponible, le prompt système inclut une section **Documentation** qui pointe vers le
répertoire local de documentation OpenClaw (soit `docs/` dans l’espace de travail du dépôt, soit la documentation du
package npm intégré) et mentionne également le miroir public, le dépôt source, le Discord de la communauté et
ClawHub ([https://clawhub.ai](https://clawhub.ai)) pour la découverte des Skills. Le prompt indique au modèle de consulter d’abord la documentation locale
pour le comportement, les commandes, la configuration ou l’architecture d’OpenClaw, et d’exécuter
`openclaw status` lui-même lorsque c’est possible (en demandant à l’utilisateur seulement lorsqu’il n’y a pas accès).
