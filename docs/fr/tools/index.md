---
doc-schema-version: 1
read_when:
    - Vous souhaitez comprendre quels outils OpenClaw propose
    - Vous hésitez entre les outils intégrés, les Skills et les plugins
    - Vous avez besoin du bon point d’entrée dans la documentation pour la politique des outils, l’automatisation ou la coordination des agents
summary: 'Présentation des outils, Skills et plugins d’OpenClaw : ce que les agents peuvent appeler et comment les étendre'
title: Vue d’ensemble
x-i18n:
    generated_at: "2026-07-12T03:09:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Utilisez cette page pour choisir la surface de fonctionnalités appropriée. Les **outils** sont des actions
appelables, les **Skills** apprennent aux agents comment travailler, et les **plugins** ajoutent
des fonctionnalités d’exécution telles que des outils, des fournisseurs, des canaux, des hooks et des
Skills empaquetées.

Cette page fournit une vue d’ensemble et des indications d’orientation. Pour consulter l’ensemble des règles relatives aux outils, les valeurs par défaut,
l’appartenance aux groupes, les restrictions des fournisseurs et les champs de configuration, utilisez
[Outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Commencer ici

Pour la plupart des agents, commencez par les catégories d’outils intégrées, puis ajustez les règles
uniquement lorsque l’agent doit voir moins d’outils ou nécessite un accès explicite à l’hôte.

| Si vous devez...                                                        | Utilisez d’abord                                      | Consultez ensuite                                                                                                                 |
| ----------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Permettre à un agent d’agir avec les fonctionnalités existantes         | [Outils intégrés](#built-in-tool-categories)          | [Catégories d’outils](#built-in-tool-categories)                                                                                  |
| Contrôler ce qu’un agent peut appeler                                   | [Règles des outils](#configure-access-and-approvals)  | [Outils et fournisseurs personnalisés](/fr/gateway/config-tools)                                                                     |
| Enseigner un workflow à un agent                                        | [Skills](#choose-tools-skills-or-plugins)             | [Skills](/fr/tools/skills), [Création de Skills](/fr/tools/creating-skills) et [Atelier Skills](/fr/tools/skill-workshop)                  |
| Ajouter une nouvelle intégration ou surface d’exécution                 | [Plugins](#extend-capabilities)                       | [Plugins](/fr/tools/plugin) et [Créer des plugins](/fr/plugins/building-plugins)                                                        |
| Exécuter une tâche ultérieurement ou en arrière-plan                    | [Automatisation](/fr/automation)                         | [Vue d’ensemble de l’automatisation](/fr/automation)                                                                                 |
| Coordonner plusieurs agents ou environnements d’exécution               | [Sous-agents](/fr/tools/subagents)                       | [Agents ACP](/fr/tools/acp-agents) et [Envoi par un agent](/fr/tools/agent-send)                                                        |
| Rechercher dans un vaste catalogue d’outils OpenClaw                    | [Recherche d’outils](/fr/tools/tool-search)              | [Recherche d’outils](/fr/tools/tool-search)                                                                                          |

## Choisir des outils, des Skills ou des plugins

<Steps>
  <Step title="Utiliser un outil lorsque l’agent doit agir">
    Un outil est une fonction typée que l’agent peut appeler, telle que `exec`, `browser`,
    `web_search`, `message` ou `image_generate`. Utilisez des outils lorsque l’agent
    doit lire des données, modifier des fichiers, envoyer des messages, appeler un fournisseur ou
    piloter un autre système. Les outils visibles sont envoyés au modèle sous forme de définitions
    de fonctions structurées.

    Le modèle ne voit que les outils qui sont conservés après l’application du profil actif, des règles d’autorisation et de refus,
    des restrictions du fournisseur, de l’état du bac à sable, des autorisations du canal et
    de la disponibilité des plugins.

  </Step>

  <Step title="Utiliser une Skill lorsque l’agent a besoin d’instructions">
    Une Skill est un ensemble d’instructions `SKILL.md` chargé dans le prompt de l’agent. Utilisez
    une Skill lorsque l’agent dispose déjà des outils nécessaires, mais a besoin d’un
    workflow reproductible, d’une grille d’évaluation, d’une séquence de commandes ou d’une contrainte
    opérationnelle.

    Les Skills peuvent se trouver dans un espace de travail, un répertoire partagé de Skills, la racine gérée des
    Skills OpenClaw ou le paquet d’un plugin.

    [Skills](/fr/tools/skills) | [Atelier Skills](/fr/tools/skill-workshop) | [Création de Skills](/fr/tools/creating-skills) | [Configuration des Skills](/fr/tools/skills-config)

  </Step>

  <Step title="Utiliser un plugin lorsqu’OpenClaw a besoin d’une nouvelle fonctionnalité">
    Un plugin peut ajouter des outils, des Skills, des canaux, des fournisseurs de modèles, de la synthèse vocale,
    de la voix en temps réel, de la génération multimédia, de la recherche web, de la récupération web, des hooks et d’autres
    fonctionnalités d’exécution. Utilisez un plugin lorsque la fonctionnalité comporte du code,
    des identifiants, des hooks de cycle de vie, des métadonnées de manifeste ou un
    paquet installable. Les plugins existants peuvent être installés depuis ClawHub, npm, git,
    des répertoires locaux ou des archives.

    [Installer et configurer des plugins](/fr/tools/plugin) | [Créer des plugins](/fr/plugins/building-plugins) | [SDK de Plugin](/fr/plugins/sdk-overview)

  </Step>
</Steps>

## Catégories d’outils intégrées

Le tableau répertorie des outils représentatifs afin de vous permettre d’identifier la surface concernée. Il ne constitue
pas la référence complète des règles. Pour connaître précisément les groupes, les valeurs par défaut et la
sémantique des autorisations et refus, utilisez [Outils et fournisseurs personnalisés](/fr/gateway/config-tools).

| Catégorie                         | À utiliser lorsque l’agent doit...                                                              | Outils représentatifs                                                                                  | À consulter ensuite                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Exécution                         | Exécuter des commandes, gérer des processus ou utiliser une analyse Python fournie par un fournisseur | `exec`, `process`, `code_execution`                                                                  | [Exec](/fr/tools/exec), [Exécution de code](/fr/tools/code-execution)                                             |
| Fichiers                          | Lire et modifier les fichiers de l’espace de travail                                             | `read`, `write`, `edit`, `apply_patch`                                                               | [Appliquer un correctif](/fr/tools/apply-patch)                                                                |
| Web                               | Rechercher sur le web, rechercher des publications X ou récupérer le contenu lisible d’une page | `web_search`, `x_search`, `web_fetch`                                                                | [Outils web](/fr/tools/web), [Récupération web](/fr/tools/web-fetch)                                              |
| Navigateur                        | Piloter une session de navigateur                                                               | `browser`                                                                                             | [Navigateur](/fr/tools/browser)                                                                                |
| Messagerie et canaux              | Envoyer des réponses ou effectuer des actions sur les canaux                                     | `message`                                                                                             | [Envoi par un agent](/fr/tools/agent-send)                                                                     |
| Sessions et agents               | Inspecter les sessions, déléguer du travail, piloter une autre exécution ou signaler un état     | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Objectif](/fr/tools/goal), [Sous-agents](/fr/tools/subagents), [Outil de session](/fr/concepts/session-tool)        |
| Automatisation                    | Planifier du travail ou répondre à des événements en arrière-plan                                | `cron`, `heartbeat_respond`                                                                           | [Automatisation](/fr/automation)                                                                                |
| Gateway et nœuds                  | Inspecter l’état du Gateway ou les appareils cibles appairés                                     | `gateway`, `nodes`                                                                                    | [Configuration du Gateway](/fr/gateway/configuration), [Nœuds](/fr/nodes)                                        |
| Multimédia                        | Analyser, générer ou vocaliser des contenus multimédias                                          | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                 | [Vue d’ensemble du multimédia](/fr/tools/media-overview)                                                       |
| Grands catalogues OpenClaw        | Rechercher et appeler de nombreux outils admissibles sans envoyer chaque schéma au modèle        | `tool_search_code`, `tool_search`, `tool_describe`                                                   | [Recherche d’outils](/fr/tools/tool-search)                                                                    |

<Note>
La recherche d’outils est une surface expérimentale pour les agents OpenClaw. Les exécutions dans l’environnement Codex utilisent
le mode code natif de Codex, la recherche d’outils native, les outils dynamiques différés et
les appels d’outils imbriqués à la place de `tools.toolSearch`.
</Note>

## Outils fournis par des plugins

Les plugins peuvent enregistrer des outils supplémentaires. Les auteurs de plugins connectent les outils au moyen de
`api.registerTool(...)` et de `contracts.tools` dans le manifeste ; consultez le
[SDK de Plugin](/fr/plugins/sdk-overview) et le [manifeste de Plugin](/fr/plugins/manifest)
pour en savoir plus sur les contrats.

Les outils couramment fournis par des plugins comprennent :

- [Différences](/fr/tools/diffs) pour afficher les différences de fichiers et de Markdown
- [Afficher un widget](/tools/show-widget) pour intégrer du SVG et du HTML autonomes dans le chat web
- [Tâche LLM](/fr/tools/llm-task) pour les étapes de workflow produisant uniquement du JSON
- [Lobster](/fr/tools/lobster) pour les workflows typés avec des approbations pouvant être reprises
- [Tokenjuice](/fr/tools/tokenjuice) pour compacter les sorties bruyantes des outils `exec` et `bash`
- [Recherche d’outils](/fr/tools/tool-search) pour découvrir et appeler de vastes catalogues d’outils
  sans inclure chaque schéma dans le prompt
- [Canvas](/fr/plugins/reference/canvas) pour le contrôle de Canvas sur les nœuds et le
  rendu A2UI

## Configurer les accès et les approbations

Les règles des outils sont appliquées avant l’appel au modèle. Si les règles suppriment un outil, le
modèle ne reçoit pas le schéma de cet outil pour ce tour. Une exécution peut perdre des outils
en raison de la configuration globale, de la configuration propre à l’agent, des règles du canal, des restrictions
du fournisseur, des règles du bac à sable, des règles du canal ou de l’environnement d’exécution, ou de la disponibilité des plugins.

- [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) décrit les profils d’outils,
  les listes d’autorisation et de refus, les restrictions propres aux fournisseurs, la détection des boucles et
  les paramètres des outils fournis par les fournisseurs.
- [Approbations Exec](/fr/tools/exec-approvals) décrit les règles d’approbation des commandes
  de l’hôte.
- [Exec avec privilèges élevés](/fr/tools/elevated) décrit l’exécution contrôlée en dehors du
  bac à sable.
- [Bac à sable, règles des outils et privilèges élevés](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
  explique quelle couche contrôle l’accès aux fichiers et aux processus.
- [Bac à sable et restrictions d’outils propres à chaque agent](/fr/tools/multi-agent-sandbox-tools)
  décrit les restrictions propres aux agents pour les exécutions déléguées.

## Étendre les fonctionnalités

Choisissez la voie d’extension selon la tâche que vous devez confier à OpenClaw :

- Installez ou gérez un plugin existant avec [Plugins](/fr/tools/plugin).
- Créez une nouvelle intégration, un fournisseur, un canal, un outil ou un hook avec
  [Créer des plugins](/fr/plugins/building-plugins).
- Ajoutez ou ajustez des instructions réutilisables pour les agents avec [Skills](/fr/tools/skills) et
  [Création de Skills](/fr/tools/creating-skills).
- Utilisez le [SDK de Plugin](/fr/plugins/sdk-overview) et le
  [manifeste de Plugin](/fr/plugins/manifest) lorsque vous avez besoin de contrats
  d’implémentation.

## Résoudre les problèmes d’outils manquants

Si le modèle ne peut pas voir ou appeler un outil, commencez par vérifier les règles effectives pour
le tour actuel :

1. Vérifiez le profil actif, `tools.allow` et `tools.deny` dans
   [Outils et fournisseurs personnalisés](/fr/gateway/config-tools).
2. Vérifiez les restrictions propres au fournisseur dans
   [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) et confirmez que le
   [fournisseur de modèles](/fr/concepts/model-providers) sélectionné prend en charge la structure de l’outil.
3. Vérifiez les autorisations du canal, l’état du bac à sable et l’accès avec privilèges élevés à l’aide de
   [Bac à sable, règles des outils et privilèges élevés](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
   et [Exec avec privilèges élevés](/fr/tools/elevated).
4. Vérifiez si le plugin propriétaire est installé et activé dans
   [Plugins](/fr/tools/plugin).
5. Pour les exécutions déléguées, vérifiez les restrictions propres à chaque agent dans
   [Bac à sable et restrictions d’outils propres à chaque agent](/fr/tools/multi-agent-sandbox-tools).
6. Pour les grands catalogues OpenClaw, vérifiez si l’exécution utilise l’exposition directe des outils
   ou la [Recherche d’outils](/fr/tools/tool-search).

## Pages connexes

- [Automatisation](/fr/automation) pour Cron, les tâches, Heartbeat, les engagements, les hooks,
  les ordres permanents et TaskFlow
- [Agents](/fr/concepts/agent) pour le modèle d’agent, les sessions, la mémoire et
  la coordination multi-agents
- [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) pour la référence canonique
  des politiques d’outils
- [Plugins](/fr/tools/plugin) pour l’installation et la gestion des Plugins
- [SDK des Plugins](/fr/plugins/sdk-overview) comme référence pour les auteurs de Plugins
- [Skills](/fr/tools/skills) pour l’ordre de chargement, le contrôle d’accès et la configuration des Skills
- [Atelier de Skills](/fr/tools/skill-workshop) pour créer des Skills générés
  et révisés
- [Recherche d’outils](/fr/tools/tool-search) pour parcourir de manière compacte le catalogue
  d’outils OpenClaw
