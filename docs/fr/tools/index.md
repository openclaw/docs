---
doc-schema-version: 1
read_when:
    - Vous souhaitez comprendre quels outils OpenClaw fournit
    - Vous choisissez entre les outils intégrés, les Skills et les plugins
    - Vous avez besoin du bon point d’entrée dans la documentation pour la politique des outils, l’automatisation ou la coordination des agents
summary: 'Vue d’ensemble des outils, Skills et plugins OpenClaw : ce que les agents peuvent appeler et comment les étendre'
title: Vue d’ensemble
x-i18n:
    generated_at: "2026-05-12T00:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

Utilisez cette page pour choisir la bonne surface de fonctionnalités. Les **outils** sont des
actions appelables, les **Skills** apprennent aux agents comment travailler, et les **plugins** ajoutent des
fonctionnalités d’exécution telles que des outils, des fournisseurs, des canaux, des hooks et des Skills empaquetées.

Il s’agit d’une page de vue d’ensemble et d’orientation. Pour la politique exhaustive des outils, les valeurs par défaut,
l’appartenance aux groupes, les restrictions des fournisseurs et les champs de configuration, consultez
[Outils et fournisseurs personnalisés](/fr/gateway/config-tools).

## Commencez ici

Pour la plupart des agents, commencez par les catégories d’outils intégrées, puis ajustez la politique
uniquement lorsque l’agent doit voir moins d’outils ou a besoin d’un accès hôte explicite.

| Si vous devez...                              | Utilisez d’abord ceci                         | Puis lisez                                                             |
| --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Permettre à un agent d’agir avec des fonctionnalités existantes | [Outils intégrés](#built-in-tool-categories) | [Catégories d’outils](#built-in-tool-categories)                       |
| Contrôler ce qu’un agent peut appeler         | [Politique des outils](#configure-access-and-approvals) | [Outils et fournisseurs personnalisés](/fr/gateway/config-tools)          |
| Enseigner un workflow à un agent              | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/fr/tools/skills) et [Création de Skills](/fr/tools/creating-skills) |
| Ajouter une nouvelle intégration ou surface d’exécution | [Plugins](#extend-capabilities)       | [Plugins](/fr/tools/plugin) et [Créer des plugins](/fr/plugins/building-plugins) |
| Exécuter du travail plus tard ou en arrière-plan | [Automatisation](/fr/automation)               | [Vue d’ensemble de l’automatisation](/fr/automation)                      |
| Coordonner plusieurs agents ou harnais        | [Sous-agents](/fr/tools/subagents)                | [Agents ACP](/fr/tools/acp-agents) et [Envoi à un agent](/fr/tools/agent-send) |
| Rechercher dans un grand catalogue d’outils PI | [Recherche d’outils](/fr/tools/tool-search)      | [Recherche d’outils](/fr/tools/tool-search)                               |

## Choisir des outils, des Skills ou des plugins

<Steps>
  <Step title="Utilisez un outil lorsque l’agent doit agir">
    Un outil est une fonction typée que l’agent peut appeler, comme `exec`, `browser`,
    `web_search`, `message` ou `image_generate`. Utilisez des outils lorsque l’agent
    doit lire des données, modifier des fichiers, envoyer des messages, appeler un fournisseur ou opérer
    un autre système. Les outils visibles sont envoyés au modèle sous forme de définitions de fonctions
    structurées.

    Le modèle ne voit que les outils qui survivent au profil actif, à la politique d’autorisation/refus,
    aux restrictions du fournisseur, à l’état du sandbox, aux autorisations du canal et à la disponibilité
    du plugin.

  </Step>

  <Step title="Utilisez une Skill lorsque l’agent a besoin d’instructions">
    Une Skill est un pack d’instructions `SKILL.md` chargé dans le prompt de l’agent. Utilisez une
    Skill lorsque l’agent dispose déjà des outils dont il a besoin, mais nécessite un workflow
    reproductible, une grille de revue, une séquence de commandes ou une contrainte opérationnelle.

    Les Skills peuvent résider dans un espace de travail, un répertoire de Skills partagé, une racine de
    Skills OpenClaw gérée ou un paquet de plugin.

    [Skills](/fr/tools/skills) | [Création de Skills](/fr/tools/creating-skills) | [Configuration des Skills](/fr/tools/skills-config)

  </Step>

  <Step title="Utilisez un plugin lorsqu’OpenClaw a besoin d’une nouvelle fonctionnalité">
    Un plugin peut ajouter des outils, des Skills, des canaux, des fournisseurs de modèles, de la synthèse vocale, de la voix
    en temps réel, de la génération de médias, de la recherche web, de la récupération web, des hooks et d’autres
    fonctionnalités d’exécution. Utilisez un plugin lorsque la fonctionnalité comporte du code, des identifiants,
    des hooks de cycle de vie, des métadonnées de manifeste ou un empaquetage installable. Les plugins existants
    peuvent être installés depuis ClawHub, npm, git, des répertoires locaux ou des archives.

    [Installer et configurer des plugins](/fr/tools/plugin) | [Créer des plugins](/fr/plugins/building-plugins) | [SDK de plugin](/fr/plugins/sdk-overview)

  </Step>
</Steps>

## Catégories d’outils intégrées

Le tableau répertorie des outils représentatifs afin que vous puissiez reconnaître la surface. Ce n’est
pas la référence complète de la politique. Pour les groupes exacts, les valeurs par défaut et la sémantique
d’autorisation/refus, consultez [Outils et fournisseurs personnalisés](/fr/gateway/config-tools).

| Catégorie              | À utiliser lorsque l’agent doit...                                             | Outils représentatifs                                                | Lire ensuite                                                            |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Exécution              | Exécuter des commandes, gérer des processus ou utiliser une analyse Python adossée à un fournisseur | `exec`, `process`, `code_execution`                                  | [Exec](/fr/tools/exec), [Exécution de code](/fr/tools/code-execution)          |
| Fichiers               | Lire et modifier les fichiers de l’espace de travail                          | `read`, `write`, `edit`, `apply_patch`                               | [Appliquer un patch](/fr/tools/apply-patch)                                |
| Web                    | Rechercher sur le web, rechercher des publications X ou récupérer le contenu lisible d’une page | `web_search`, `x_search`, `web_fetch`                                | [Outils web](/fr/tools/web), [Récupération web](/fr/tools/web-fetch)           |
| Navigateur             | Opérer une session de navigateur                                              | `browser`                                                            | [Navigateur](/fr/tools/browser)                                            |
| Messagerie et canaux   | Envoyer des réponses ou des actions de canal                                  | `message`                                                            | [Envoi à un agent](/fr/tools/agent-send)                                   |
| Sessions et agents     | Inspecter des sessions, déléguer du travail, orienter une autre exécution ou signaler l’état | `sessions_*`, `subagents`, `agents_list`, `session_status`           | [Sous-agents](/fr/tools/subagents), [Outil de session](/fr/concepts/session-tool) |
| Automatisation         | Planifier du travail ou répondre à des événements d’arrière-plan              | `cron`, `heartbeat_respond`                                          | [Automatisation](/fr/automation)                                           |
| Gateway et nœuds       | Inspecter l’état du Gateway ou les appareils cibles appairés                  | `gateway`, `nodes`                                                   | [Configuration du Gateway](/fr/gateway/configuration), [Nœuds](/fr/nodes)     |
| Médias                 | Analyser, générer ou parler des médias                                        | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Vue d’ensemble des médias](/fr/tools/media-overview)                      |
| Grands catalogues PI   | Rechercher et appeler de nombreux outils éligibles sans envoyer chaque schéma au modèle | `tool_search_code`, `tool_search`, `tool_describe`                   | [Recherche d’outils](/fr/tools/tool-search)                                |

<Note>
La recherche d’outils est une surface expérimentale pour agents PI. Les exécutions du harnais Codex utilisent
le mode code natif de Codex, la recherche d’outils native, les outils dynamiques différés et les appels
d’outils imbriqués au lieu de `tools.toolSearch`.
</Note>

## Outils fournis par des plugins

Les plugins peuvent enregistrer des outils supplémentaires. Les auteurs de plugins câblent les outils via
`api.registerTool(...)` et `contracts.tools` du manifeste ; consultez le
[SDK de plugin](/fr/plugins/sdk-overview) et le [manifeste de plugin](/fr/plugins/manifest)
pour les détails du contrat.

Les outils courants fournis par des plugins incluent :

- [Diffs](/fr/tools/diffs) pour afficher des diffs de fichiers et de markdown
- [Tâche LLM](/fr/tools/llm-task) pour les étapes de workflow JSON uniquement
- [Lobster](/fr/tools/lobster) pour les workflows typés avec approbations reprenables
- [Tokenjuice](/fr/tools/tokenjuice) pour compacter la sortie bruyante des outils `exec` et `bash`
- [Recherche d’outils](/fr/tools/tool-search) pour découvrir et appeler de grands catalogues d’outils
  sans placer chaque schéma dans le prompt
- [Canvas](/fr/plugins/reference/canvas) pour le contrôle de Canvas de nœud et le rendu A2UI

## Configurer l’accès et les approbations

La politique des outils est appliquée avant l’appel au modèle. Si la politique retire un outil, le
modèle ne reçoit pas le schéma de cet outil pour le tour. Une exécution peut perdre des outils
à cause de la configuration globale, de la configuration par agent, de la politique de canal, des
restrictions du fournisseur, des règles de sandbox, d’un filtrage réservé au propriétaire ou de la disponibilité du plugin.

- [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) documente les profils d’outils,
  les listes d’autorisation/refus, les restrictions propres aux fournisseurs, la détection de boucles et
  les paramètres d’outils adossés à un fournisseur.
- [Approbations exec](/fr/tools/exec-approvals) documente la politique d’approbation des commandes hôte.
- [Exec élevé](/fr/tools/elevated) documente l’exécution contrôlée en dehors du
  sandbox.
- [Sandbox contre politique des outils contre élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) explique quelle couche contrôle l’accès aux fichiers et aux processus.
- [Restrictions de sandbox et d’outils par agent](/fr/tools/multi-agent-sandbox-tools)
  documente les restrictions propres aux agents pour les exécutions déléguées.

## Étendre les fonctionnalités

Choisissez le chemin d’extension en fonction de la tâche que vous devez faire accomplir à OpenClaw :

- Installez ou gérez un plugin existant avec [Plugins](/fr/tools/plugin).
- Créez une nouvelle intégration, un fournisseur, un canal, un outil ou un hook avec
  [Créer des plugins](/fr/plugins/building-plugins).
- Ajoutez ou ajustez des instructions d’agent réutilisables avec [Skills](/fr/tools/skills) et
  [Création de Skills](/fr/tools/creating-skills).
- Empaquetez du matériel de workflow réutilisable avec
  [Atelier de Skills](/fr/plugins/skill-workshop) lorsque le workflow appartient à un
  bundle de Skills distribué par plugin.
- Utilisez le [SDK de plugin](/fr/plugins/sdk-overview) et le [manifeste de plugin](/fr/plugins/manifest) lorsque vous avez besoin de contrats d’implémentation.

## Dépanner les outils manquants

Si le modèle ne peut pas voir ou appeler un outil, commencez par la politique effective pour le
tour actuel :

1. Vérifiez le profil actif, `tools.allow` et `tools.deny` dans
   [Outils et fournisseurs personnalisés](/fr/gateway/config-tools).
2. Vérifiez les restrictions propres au fournisseur dans
   [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) et confirmez que le
   [fournisseur de modèle](/fr/concepts/model-providers) sélectionné prend en charge la forme de l’outil.
3. Vérifiez les autorisations de canal, l’état du sandbox et l’accès élevé avec
   [Sandbox contre politique des outils contre élévation](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) et [Exec élevé](/fr/tools/elevated).
4. Vérifiez si le plugin propriétaire est installé et activé dans
   [Plugins](/fr/tools/plugin).
5. Pour les exécutions déléguées, vérifiez les restrictions par agent dans
   [Restrictions de sandbox et d’outils par agent](/fr/tools/multi-agent-sandbox-tools).
6. Pour les grands catalogues PI, confirmez si l’exécution utilise l’exposition directe des outils ou
   [Recherche d’outils](/fr/tools/tool-search).

## Associé

- [Automatisation](/fr/automation) pour cron, les tâches, heartbeat, les engagements, les hooks, les ordres permanents et Task Flow
- [Agents](/fr/concepts/agent) pour le modèle d’agent, les sessions, la mémoire et la coordination multi-agent
- [Outils et fournisseurs personnalisés](/fr/gateway/config-tools) pour la référence canonique de la politique des outils
- [Plugins](/fr/tools/plugin) pour l’installation et la gestion des plugins
- [SDK de plugin](/fr/plugins/sdk-overview) pour la référence des auteurs de plugins
- [Skills](/fr/tools/skills) pour l’ordre de chargement, le filtrage et la configuration des Skills
- [Recherche d’outils](/fr/tools/tool-search) pour la découverte compacte de catalogues d’outils PI
