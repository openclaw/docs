---
doc-schema-version: 1
read_when:
    - Vous souhaitez comprendre quels outils OpenClaw fournit
    - Vous choisissez entre les outils intégrés, les Skills et les plugins
    - Vous avez besoin du bon point d’entrée dans la documentation pour la politique des outils, l’automatisation ou la coordination des agents
summary: 'Présentation des outils, Skills et plugins d’OpenClaw : ce que les agents peuvent appeler et comment les étendre'
title: Vue d’ensemble
x-i18n:
    generated_at: "2026-07-12T16:03:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Utilisez cette page pour choisir la surface de fonctionnalités appropriée. Les **outils** sont des
actions appelables, les **Skills** apprennent aux agents comment travailler et les **plugins** ajoutent
des fonctionnalités d’exécution telles que des outils, des fournisseurs, des canaux, des hooks et des
Skills intégrés.

Cette page fournit une vue d’ensemble et des orientations. Pour consulter la politique exhaustive des outils, les valeurs par défaut,
l’appartenance aux groupes, les restrictions des fournisseurs et les champs de configuration, reportez-vous à
[Outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Commencer ici

Pour la plupart des agents, commencez par les catégories d’outils intégrées, puis ajustez la politique
uniquement lorsque l’agent doit voir moins d’outils ou nécessite un accès explicite à l’hôte.

| Si vous devez...                                         | Utilisez d’abord ceci                                      | Consultez ensuite                                                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Permettre à un agent d’agir avec les fonctionnalités existantes | [Outils intégrés](#built-in-tool-categories)               | [Catégories d’outils](#built-in-tool-categories)                                                                                 |
| Contrôler ce qu’un agent peut appeler                    | [Politique des outils](#configure-access-and-approvals)    | [Outils et fournisseurs personnalisés](/fr/gateway/config-tools)                                                                   |
| Enseigner un workflow à un agent                         | [Skills](#choose-tools-skills-or-plugins)                  | [Skills](/fr/tools/skills), [Création de Skills](/fr/tools/creating-skills) et [Atelier Skills](/fr/tools/skill-workshop)                 |
| Ajouter une nouvelle intégration ou surface d’exécution  | [Plugins](#extend-capabilities)                            | [Plugins](/fr/tools/plugin) et [Créer des plugins](/fr/plugins/building-plugins)                                                       |
| Exécuter une tâche ultérieurement ou en arrière-plan     | [Automatisation](/fr/automation)                              | [Vue d’ensemble de l’automatisation](/fr/automation)                                                                                |
| Coordonner plusieurs agents ou harnais                   | [Sous-agents](/fr/tools/subagents)                            | [Agents ACP](/fr/tools/acp-agents) et [Envoi par un agent](/fr/tools/agent-send)                                                       |
| Rechercher dans un vaste catalogue d’outils OpenClaw     | [Recherche d’outils](/fr/tools/tool-search)                   | [Recherche d’outils](/fr/tools/tool-search)                                                                                         |

## Choisir entre outils, Skills et plugins

<Steps>
  <Step title="Utiliser un outil lorsque l’agent doit agir">
    Un outil est une fonction typée que l’agent peut appeler, telle que `exec`, `browser`,
    `web_search`, `message` ou `image_generate`. Utilisez des outils lorsque l’agent
    doit lire des données, modifier des fichiers, envoyer des messages, appeler un fournisseur ou
    piloter un autre système. Les outils visibles sont envoyés au modèle sous forme de définitions
    de fonctions structurées.

    Le modèle ne voit que les outils qui restent disponibles après l’application du profil actif, de la politique
    d’autorisation/refus, des restrictions des fournisseurs, de l’état du bac à sable, des autorisations des canaux et
    de la disponibilité des plugins.

  </Step>

  <Step title="Utiliser un Skill lorsque l’agent a besoin d’instructions">
    Un Skill est un ensemble d’instructions `SKILL.md` chargé dans le prompt de l’agent. Utilisez
    un Skill lorsque l’agent dispose déjà des outils nécessaires, mais a besoin d’un
    workflow reproductible, d’une grille d’évaluation, d’une séquence de commandes ou d’une contrainte
    opérationnelle.

    Les Skills peuvent résider dans un espace de travail, un répertoire de Skills partagé, une racine de
    Skills gérée par OpenClaw ou un paquet de plugin.

    [Skills](/fr/tools/skills) | [Atelier Skills](/fr/tools/skill-workshop) | [Création de Skills](/fr/tools/creating-skills) | [Configuration des Skills](/fr/tools/skills-config)

  </Step>

  <Step title="Utiliser un plugin lorsqu’OpenClaw a besoin d’une nouvelle fonctionnalité">
    Un plugin peut ajouter des outils, des Skills, des canaux, des fournisseurs de modèles, la synthèse vocale,
    la voix en temps réel, la génération de médias, la recherche web, la récupération de contenu web, des hooks et d’autres
    fonctionnalités d’exécution. Utilisez un plugin lorsque la fonctionnalité comporte du code,
    des identifiants, des hooks de cycle de vie, des métadonnées de manifeste ou un
    paquet installable. Les plugins existants peuvent être installés depuis ClawHub, npm, git,
    des répertoires locaux ou des archives.

    [Installer et configurer des plugins](/fr/tools/plugin) | [Créer des plugins](/fr/plugins/building-plugins) | [SDK de Plugin](/fr/plugins/sdk-overview)

  </Step>
</Steps>

## Catégories d’outils intégrées

Le tableau répertorie des outils représentatifs afin de vous aider à reconnaître la surface. Il ne constitue
pas la référence complète de la politique. Pour connaître précisément les groupes, les valeurs par défaut et la sémantique
d’autorisation/refus, reportez-vous à [Outils et fournisseurs personnalisés](/fr/gateway/config-tools).

| Catégorie                      | À utiliser lorsque l’agent doit...                                                   | Outils représentatifs                                                                                  | À consulter ensuite                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Exécution                      | Exécuter des commandes, gérer des processus ou utiliser une analyse Python fournie par un fournisseur | `exec`, `process`, `code_execution`                                                       | [Exec](/fr/tools/exec), [Exécution de code](/fr/tools/code-execution)                                        |
| Fichiers                       | Lire et modifier les fichiers de l’espace de travail                                 | `read`, `write`, `edit`, `apply_patch`                                                                 | [Appliquer un patch](/fr/tools/apply-patch)                                                               |
| Web                            | Rechercher sur le web, rechercher des publications X ou récupérer le contenu lisible d’une page | `web_search`, `x_search`, `web_fetch`                                                     | [Outils web](/fr/tools/web), [Récupération web](/fr/tools/web-fetch)                                         |
| Navigateur                     | Piloter une session de navigateur                                                    | `browser`                                                                                              | [Navigateur](/fr/tools/browser)                                                                           |
| Messagerie et canaux           | Envoyer des réponses ou effectuer des actions sur les canaux                         | `message`                                                                                              | [Envoi par un agent](/fr/tools/agent-send)                                                                |
| Sessions et agents             | Inspecter des sessions, déléguer une tâche, orienter une autre exécution ou signaler un état | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Objectif](/fr/tools/goal), [Sous-agents](/fr/tools/subagents), [Outil de session](/fr/concepts/session-tool) |
| Automatisation                 | Planifier une tâche ou répondre à des événements en arrière-plan                    | `cron`, `heartbeat_respond`                                                                            | [Automatisation](/fr/automation)                                                                          |
| Gateway et Nodes               | Inspecter l’état du Gateway ou des appareils cibles appairés                         | `gateway`, `nodes`                                                                                     | [Configuration du Gateway](/fr/gateway/configuration), [Nodes](/fr/nodes)                                    |
| Médias                         | Analyser, générer ou vocaliser des médias                                            | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                   | [Vue d’ensemble des médias](/fr/tools/media-overview)                                                      |
| Grands catalogues OpenClaw     | Rechercher et appeler de nombreux outils admissibles sans envoyer chaque schéma au modèle | `tool_search_code`, `tool_search`, `tool_describe`                                       | [Recherche d’outils](/fr/tools/tool-search)                                                               |

<Note>
La recherche d’outils est une surface expérimentale pour les agents OpenClaw. Les exécutions dans le harnais Codex utilisent
le mode code natif de Codex, la recherche d’outils native, les outils dynamiques différés et
les appels d’outils imbriqués au lieu de `tools.toolSearch`.
</Note>

## Outils fournis par des plugins

Les plugins peuvent enregistrer des outils supplémentaires. Les auteurs de plugins connectent les outils via
`api.registerTool(...)` et `contracts.tools` dans le manifeste ; consultez le
[SDK de Plugin](/fr/plugins/sdk-overview) et le [manifeste de plugin](/fr/plugins/manifest)
pour plus de détails sur les contrats.

Parmi les outils couramment fournis par des plugins figurent :

- [Différences](/fr/tools/diffs) pour afficher les différences de fichiers et de Markdown
- [Afficher le widget](/tools/show-widget) pour intégrer du SVG et du HTML autonomes dans le chat web
- [Tâche LLM](/fr/tools/llm-task) pour les étapes de workflow produisant uniquement du JSON
- [Lobster](/fr/tools/lobster) pour les workflows typés avec des approbations pouvant être reprises
- [Tokenjuice](/fr/tools/tokenjuice) pour compacter les sorties bruyantes des outils `exec` et `bash`
- [Recherche d’outils](/fr/tools/tool-search) pour découvrir et appeler de vastes catalogues d’outils
  sans placer chaque schéma dans le prompt
- [Canvas](/fr/plugins/reference/canvas) pour contrôler le Canvas d’un Node et effectuer le rendu
  A2UI

## Configurer l’accès et les approbations

La politique des outils est appliquée avant l’appel au modèle. Si la politique supprime un outil, le
modèle ne reçoit pas le schéma de cet outil pour l’interaction. Une exécution peut perdre des outils
en raison de la configuration globale, de la configuration propre à l’agent, de la politique du canal, des restrictions
du fournisseur, des règles du bac à sable, de la politique du canal ou de l’environnement d’exécution, ou de la disponibilité des plugins.

- [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) décrit les profils d’outils,
  les listes d’autorisation/refus, les restrictions propres aux fournisseurs, la détection des boucles et
  les paramètres des outils fournis par les fournisseurs.
- [Approbations d’exécution](/fr/tools/exec-approvals) décrit la politique d’approbation des commandes
  sur l’hôte.
- [Exécution avec privilèges élevés](/fr/tools/elevated) décrit l’exécution contrôlée en dehors du
  bac à sable.
- [Bac à sable, politique des outils et privilèges élevés](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
  explique quelle couche contrôle l’accès aux fichiers et aux processus.
- [Restrictions du bac à sable et des outils par agent](/fr/tools/multi-agent-sandbox-tools)
  décrit les restrictions propres aux agents pour les exécutions déléguées.

## Étendre les fonctionnalités

Choisissez la méthode d’extension en fonction de la tâche qu’OpenClaw doit accomplir :

- Installez ou gérez un plugin existant avec [Plugins](/fr/tools/plugin).
- Créez une nouvelle intégration, un fournisseur, un canal, un outil ou un hook avec
  [Créer des plugins](/fr/plugins/building-plugins).
- Ajoutez ou ajustez des instructions d’agent réutilisables avec [Skills](/fr/tools/skills) et
  [Création de Skills](/fr/tools/creating-skills).
- Utilisez le [SDK de Plugin](/fr/plugins/sdk-overview) et le
  [manifeste de plugin](/fr/plugins/manifest) lorsque vous avez besoin de contrats
  d’implémentation.

## Résoudre les problèmes d’outils manquants

Si le modèle ne peut pas voir ou appeler un outil, commencez par examiner la politique effective pour
l’interaction en cours :

1. Vérifiez le profil actif, `tools.allow` et `tools.deny` dans
   [Outils et fournisseurs personnalisés](/fr/gateway/config-tools).
2. Vérifiez les restrictions propres au fournisseur dans
   [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) et confirmez que le
   [fournisseur de modèles](/fr/concepts/model-providers) sélectionné prend en charge la forme de
   l’outil.
3. Vérifiez les autorisations du canal, l’état du bac à sable et l’accès avec privilèges élevés dans
   [Bac à sable, politique des outils et privilèges élevés](/fr/gateway/sandbox-vs-tool-policy-vs-elevated)
   et [Exécution avec privilèges élevés](/fr/tools/elevated).
4. Vérifiez que le plugin propriétaire est installé et activé dans
   [Plugins](/fr/tools/plugin).
5. Pour les exécutions déléguées, vérifiez les restrictions propres à l’agent dans
   [Restrictions du bac à sable et des outils par agent](/fr/tools/multi-agent-sandbox-tools).
6. Pour les grands catalogues OpenClaw, vérifiez si l’exécution utilise l’exposition directe des outils
   ou la [Recherche d’outils](/fr/tools/tool-search).

## Pages connexes

- [Automatisation](/fr/automation) pour Cron, les tâches, Heartbeat, les engagements, les hooks,
  les ordres permanents et TaskFlow
- [Agents](/fr/concepts/agent) pour le modèle d’agent, les sessions, la mémoire et
  la coordination multi-agents
- [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) pour la référence canonique
  de la politique des outils
- [Plugins](/fr/tools/plugin) pour l’installation et la gestion des Plugins
- [SDK de Plugin](/fr/plugins/sdk-overview) comme référence pour les auteurs de Plugins
- [Skills](/fr/tools/skills) pour l’ordre de chargement, le contrôle d’accès et la configuration des Skills
- [Atelier de Skills](/fr/tools/skill-workshop) pour la création de Skills générés et
  révisés
- [Recherche d’outils](/fr/tools/tool-search) pour la découverte compacte du catalogue
  d’outils OpenClaw
