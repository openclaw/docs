---
read_when:
    - Vous souhaitez utiliser le banc d’essai officiel du serveur d’application Codex
    - Vous avez besoin d’exemples de configuration du harnais Codex
    - Vous souhaitez que les déploiements exclusivement Codex échouent au lieu de se rabattre sur OpenClaw
summary: Exécutez les tours d’agent intégré OpenClaw via le banc d’essai officiel du serveur d’application Codex
title: Environnement Codex
x-i18n:
    generated_at: "2026-07-12T15:41:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5f6705dad9fa3bbe45c2f4eaf079ecb861b7911142bda1301c4d64a1f21a8ec5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le plugin officiel `codex` exécute les tours d’agent OpenAI intégrés via le serveur d’application Codex plutôt qu’avec le harnais OpenClaw intégré. Codex gère la session d’agent de bas niveau : reprise native des fils, poursuite native des outils, Compaction native et exécution par le serveur d’application. OpenClaw continue de gérer les canaux de discussion, les fichiers de session, la sélection du modèle, les outils dynamiques OpenClaw, les approbations, la diffusion des médias et la copie visible de la transcription.

Utilisez des références de modèles OpenAI canoniques telles que `openai/gpt-5.6-sol`. Ne configurez pas d’anciennes références GPT de Codex ; définissez l’ordre d’authentification de l’agent OpenAI sous `auth.order.openai`. Les anciens identifiants de profils d’authentification Codex et les anciennes entrées d’ordre d’authentification Codex sont réparés par `openclaw doctor --fix`.

Lorsque la stratégie d’exécution du fournisseur/modèle n’est pas définie ou vaut `auto`, le préfixe `openai/*` seul ne sélectionne jamais ce harnais. OpenAI ne peut sélectionner Codex implicitement que pour une route officielle HTTPS exacte vers Platform Responses ou ChatGPT Responses, sans remplacement de requête défini par l’auteur. Consultez
[Exécution implicite de l’agent OpenAI](/fr/providers/openai#implicit-agent-runtime).
Si Codex gère l’authentification avant que le routage entre Platform et ChatGPT soit connu, OpenClaw exige toujours que chaque route candidate déclare sa compatibilité avec Codex. Le simple fait de gérer nativement l’authentification ne permet jamais de contourner cette vérification de route.

Lorsqu’aucun bac à sable OpenClaw n’est actif, OpenClaw démarre les fils du serveur d’application Codex avec le mode code natif de Codex activé (le mode exclusivement code reste désactivé par défaut), afin que les fonctionnalités natives d’espace de travail et de code restent disponibles parallèlement aux outils dynamiques OpenClaw acheminés par le pont `item/tool/call` du serveur d’application. Un bac à sable OpenClaw actif ou une stratégie d’outils restrictive désactive entièrement le mode code natif, sauf si vous activez explicitement le chemin expérimental du serveur d’exécution en bac à sable.

Avec la valeur par défaut `tools.exec.host: "auto"` et sans bac à sable OpenClaw actif, Codex reçoit également les outils `node_exec` et `node_process` pour exécuter des commandes sur les nœuds appairés. Le shell natif reste sur l’hôte et dans l’espace de travail du serveur d’application Codex (local au Gateway pour le déploiement stdio par défaut) ; `node_exec` sélectionne un nœud par nom ou identifiant et maintient en vigueur la stratégie d’approbation des nœuds d’OpenClaw.

Cette fonctionnalité native de Codex est distincte du
[mode code OpenClaw](/fr/reference/code-mode), un environnement d’exécution QuickJS-WASI facultatif destiné aux exécutions OpenClaw génériques, avec une structure d’entrée `exec` différente. Pour une présentation plus générale de la séparation entre modèle, fournisseur et environnement d’exécution, commencez par
[Environnements d’exécution des agents](/fr/concepts/agent-runtimes) : `openai/gpt-5.6-sol` est la référence du modèle, `codex` est l’environnement d’exécution, et Telegram, Discord, Slack ou un autre canal constitue la surface de communication.

## Prérequis

- Le plugin officiel `@openclaw/codex` doit être installé. Incluez `codex` dans
  `plugins.allow` si votre configuration utilise une liste d’autorisation.
- Le serveur d’application Codex `0.143.0` ou une version ultérieure. Le plugin gère par défaut un
  binaire compatible ; la présence d’une commande `codex` dans `PATH` n’affecte donc pas le démarrage
  normal.
- Une authentification Codex via `openclaw models auth login --provider openai`, un
  compte de serveur d’application déjà présent dans le répertoire personnel Codex de l’agent, ou un
  profil d’authentification explicite par clé API Codex.

Pour l’ordre de priorité de l’authentification, l’isolation de l’environnement, les commandes personnalisées du serveur d’application, la découverte des modèles et la liste complète des champs de configuration, consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Démarrage rapide

Installez le plugin officiel, puis connectez-vous avec OAuth Codex :

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Activez le plugin `codex` et sélectionnez un modèle d’agent OpenAI :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Si votre configuration utilise `plugins.allow`, ajoutez-y également `codex` :

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Redémarrez le Gateway après avoir modifié la configuration du plugin. Si une discussion possède déjà une session, exécutez d’abord `/new` ou `/reset` afin que le tour suivant détermine le harnais à partir de la configuration actuelle.

## Partager les fils avec Codex Desktop et la CLI

La valeur par défaut `appServer.homeScope: "agent"` isole chaque agent OpenClaw de l’état Codex natif de l’opérateur. Pour permettre à un propriétaire d’inspecter et de gérer les mêmes fils natifs que ceux affichés par Codex Desktop et la CLI Codex, activez explicitement le répertoire personnel Codex de l’utilisateur :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Le mode utilisateur prend en charge un processus stdio géré local ou le transport
partagé par socket Unix. Il utilise `$CODEX_HOME` lorsqu’il est défini, sinon
`~/.codex`, y compris l’authentification Codex native de ce répertoire personnel,
sa configuration, ses plugins et son magasin de fils de discussion. OpenClaw
n’injecte aucun profil d’authentification OpenClaw dans cet app-server.

Les tours du propriétaire disposent de l’outil `codex_threads` : répertorier,
rechercher, lire, dupliquer, renommer, archiver et restaurer les fils de discussion
natifs. Dupliquez un fil de discussion pour le poursuivre dans OpenClaw ; la
duplication est associée à la session OpenClaw actuelle et reste visible par les
autres clients Codex natifs. L’archivage nécessite une confirmation explicite
que le fil de discussion est fermé ailleurs. Lorsque la supervision est également
activée, les champs de transcription et les mutations nécessitent l’activation
explicite correspondante de `supervision.allowRawTranscripts` ou
`supervision.allowWriteControls`.

Ne reprenez pas et ne modifiez pas simultanément le même fil de discussion au
moyen d’app-servers stdio gérés indépendants. Codex coordonne les processus
d’écriture actifs au sein d’un même app-server, mais pas entre des processus
distincts. La duplication constitue la voie de coexistence sûre pour les sessions
stdio utilisateur ordinaires.

`appServer.homeScope: "user"` seul n’active pas le catalogue de la flotte. Utilisez
`supervision.enabled: true` lorsque vous souhaitez que les sessions natives
apparaissent dans la barre latérale d’OpenClaw. La supervision utilise une
connexion de supervision distincte ; sans paramètres de connexion `appServer`
explicites, cette connexion utilise par défaut un processus stdio utilisateur
géré, tandis que le harnais ordinaire reste limité à l’agent. Les paramètres
`appServer` explicites sont respectés par les deux chemins. Définissez
explicitement `homeScope: "user"`, comme ci-dessus, lorsque le harnais ordinaire
doit également partager l’état natif.

## Superviser les sessions Codex

Le même plugin `codex` peut répertorier les sessions Codex non archivées de
l’ordinateur Gateway et des nœuds appairés ayant explicitement accepté cette
fonctionnalité. Une session locale au Gateway, stockée ou inactive, peut créer
un Chat verrouillé sur un modèle qui reflète son historique persistant et borné
des messages de l’utilisateur et de l’assistant. Sa liaison privée utilise la
connexion de supervision pour l’instantané natif, la branche canonique et les
tours ultérieurs, tandis que les sessions Codex ordinaires restent limitées à
l’agent. Le premier démarrage canonique utilise exactement le modèle et le
fournisseur renvoyés par Codex pour la duplication de l’instantané. Lors des
reprises ultérieures, la sélection est laissée à la configuration native de
Codex ; le modèle OpenClaw externe et la chaîne de repli ne le remplacent jamais.
Les lignes stockées et inactives peuvent être archivées après confirmation
explicite qu’aucun autre exécuteur ne les utilise. Les sources actives ne peuvent
ni créer une branche ni être archivées ; un Chat supervisé existant peut
néanmoins être ouvert. Les sessions des nœuds appairés restent limitées aux
métadonnées.

Consultez [Superviser les sessions Codex](/plugins/codex-supervision) pour la
configuration, les règles de création de branches, les limites des nœuds appairés,
l’exposition des métadonnées et le dépannage.

## Configuration

| Besoin                                                      | Paramètre                                                                                                  | Emplacement                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Activer le harnais                                          | `plugins.entries.codex.enabled: true`                                                                      | Configuration OpenClaw                           |
| Afficher les sessions Codex non archivées                   | `plugins.entries.codex.config.supervision.enabled: true`                                                   | Configuration du plugin Codex                    |
| Conserver une installation de plugin dans la liste autorisée | Inclure `codex` dans `plugins.allow`                                                                       | Configuration OpenClaw                           |
| Autoriser implicitement les tours OpenAI admissibles à utiliser Codex | Route HTTPS officielle exacte Responses/ChatGPT, aucune substitution dans la requête créée, runtime non défini/`auto` | Configuration du fournisseur/modèle OpenAI       |
| Se connecter avec OAuth ChatGPT/Codex                       | `openclaw models auth login --provider openai`                                                             | Profil d’authentification CLI                    |
| Ajouter une clé API de secours pour les exécutions Codex    | Profil de clé API `openai:*` répertorié après l’authentification par abonnement dans `auth.order.openai`   | Profil d’authentification CLI + configuration OpenClaw |
| Échouer de manière fermée lorsque Codex est indisponible    | `agentRuntime.id: "codex"` pour le fournisseur ou le modèle                                                | Configuration du modèle/fournisseur OpenClaw     |
| Utiliser directement le trafic de l’API OpenAI              | `agentRuntime.id: "openclaw"` pour le fournisseur ou le modèle avec l’authentification OpenAI normale      | Configuration du modèle/fournisseur OpenClaw     |
| Ajuster le comportement de l’app-server                     | `plugins.entries.codex.config.appServer.*`                                                                 | Configuration du plugin Codex                    |
| Activer les applications de plugins Codex natives           | `plugins.entries.codex.config.codexPlugins.*`                                                              | Configuration du plugin Codex                    |
| Activer Codex Computer Use                                  | `plugins.entries.codex.config.computerUse.*`                                                               | Configuration du plugin Codex                    |

Privilégiez `auth.order.openai` pour ordonner l’authentification par abonnement
en premier et la clé API de secours ensuite. Les identifiants de profils
d’authentification Codex hérités existants et l’ordre d’authentification Codex
hérité constituent un état hérité réservé à doctor ; n’écrivez pas de nouvelles
références GPT Codex héritées.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Pour une route effective compatible avec Codex, les deux profils ci-dessus restent candidats
pour la même exécution Codex. L’ordre des profils sélectionne les identifiants, pas l’environnement d’exécution.
Modifier l’ordre d’authentification ne rend pas une route personnalisée, Completions, HTTP ou
remplacée au niveau de la requête compatible avec Codex.

### Compaction

Ne définissez pas `compaction.model` ni `compaction.provider` sur les agents
reposant sur Codex. Codex effectue la compaction au moyen de l’état natif des fils de discussion de son serveur d’application ; ainsi,
OpenClaw ignore ces remplacements locaux du modèle de synthèse lors de l’exécution, et
`openclaw doctor --fix` les supprime lorsque l’agent utilise Codex.

Lossless reste pris en charge comme moteur de contexte pour l’assemblage, l’ingestion et
la maintenance autour des tours Codex. Il se configure au moyen de
`plugins.slots.contextEngine: "lossless-claw"` et
`plugins.entries.lossless-claw.config.summaryModel`, et non de
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migre l’ancienne
structure `compaction.provider: "lossless-claw"` vers l’emplacement du moteur de contexte
Lossless lorsque Codex est l’environnement d’exécution actif, mais Codex natif reste
responsable de la compaction. Le harnais natif du serveur d’application prend en charge les moteurs de contexte
qui nécessitent un assemblage avant le prompt ; les backends CLI génériques, y compris `codex-cli`,
ne fournissent pas cette fonctionnalité d’hôte.

Pour les agents reposant sur Codex, `/compact` lance la compaction native du serveur d’application Codex
sur le fil de discussion lié. OpenClaw n’attend pas la fin de l’opération,
n’impose pas de délai d’expiration OpenClaw, ne redémarre pas le serveur d’application partagé et ne se rabat pas sur
un moteur de contexte ou un modèle de synthèse public d’OpenAI. Si la liaison au fil de discussion Codex natif
est absente ou obsolète, la commande échoue de manière fermée au lieu de changer silencieusement
de backend de compaction.

La suite de cette page présente la structure de déploiement, le routage avec échec fermé, la politique
d’approbation du gardien, les plugins Codex natifs et Computer Use. Pour consulter les listes complètes
d’options, les valeurs par défaut, les énumérations, la découverte, l’isolation de l’environnement, les délais d’expiration et
les champs de transport du serveur d’application, consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vérifier l’environnement d’exécution Codex

Utilisez `/status` dans la discussion où vous attendez Codex. Un tour d’agent OpenAI
reposant sur Codex affiche :

```text
Environnement d’exécution : OpenAI Codex
```

Vérifiez ensuite l’état du serveur d’application Codex :

```text
/codex status
/codex models
```

`/codex status` indique la connectivité à l'app-server, le compte, les limites de débit, les serveurs MCP et les Skills. `/codex models` répertorie le catalogue actif de l'app-server Codex pour le harnais et le compte. Si le résultat de `/status` est inattendu, consultez la section [Dépannage](#troubleshooting).

## Routage et sélection du modèle

Séparez les références de fournisseur de la politique d'exécution :

- Utilisez `openai/gpt-*` pour la sélection canonique des modèles OpenAI. Le préfixe seul ne sélectionne jamais Codex.
- Lorsque l'environnement d'exécution n'est pas défini ou vaut `auto`, seule une route HTTPS officielle exacte Platform Responses ou ChatGPT Responses, sans remplacement de requête défini par l'utilisateur, peut sélectionner implicitement Codex.
- N'utilisez pas les anciennes références GPT Codex dans la configuration ; exécutez `openclaw doctor --fix` pour corriger les anciennes références et les épingles de routage de session obsolètes.
- `agentRuntime.id: "codex"` fait de Codex une exigence sans repli pour une route compatible. Cela ne rend pas compatible une route effective incompatible.
- `agentRuntime.id: "openclaw"` fait utiliser à un fournisseur ou à un modèle l'environnement d'exécution OpenClaw intégré lorsque ce choix est intentionnel.
- `/codex ...` contrôle les conversations natives de l'app-server Codex depuis le chat.
- ACP/acpx constitue un chemin de harnais externe distinct. Utilisez-le uniquement lorsque l'utilisateur demande ACP/acpx ou un adaptateur de harnais externe.

| Intention de l'utilisateur                                      | Utiliser                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Associer le chat actuel                                         | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Reprendre un fil Codex existant                                 | `/codex resume <thread-id>`                                                                            |
| Répertorier ou filtrer les fils Codex                           | `/codex threads [filter]`                                                                              |
| Répertorier les plugins Codex natifs                            | `/codex plugins list`                                                                                  |
| Activer ou désactiver un plugin Codex natif configuré           | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Reprendre une session CLI Codex stockée comme tour de nœud appairé | `/codex sessions --host <node> [filter]`, puis `/codex resume <session-id> --host <node> --bind here` |
| Afficher les sessions Codex non archivées sur plusieurs ordinateurs | Activez la supervision Codex et ouvrez **Sessions Codex**                                           |
| Modifier le modèle, le mode rapide ou les autorisations du fil associé | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Arrêter ou orienter le tour actif                               | `/codex stop`, `/codex steer <text>`                                                                   |
| Dissocier l'association actuelle                                | `/codex detach` (alias `/codex unbind`)                                                                |
| Envoyer uniquement des commentaires à Codex                     | `/codex diagnostics [note]`                                                                            |
| Démarrer une tâche ACP/acpx                                     | Commandes de session ACP/acpx, et non `/codex`                                                         |

| Cas d'utilisation                                      | Configuration                                                                                               | Vérification                                  | Remarques                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Route OpenAI admissible avec environnement d'exécution Codex natif | Route HTTPS officielle exacte Responses/ChatGPT sans remplacement de requête défini par l'utilisateur, avec le plugin `codex` activé | `/status` affiche `Runtime: OpenAI Codex` | Chemin implicite lorsque l'environnement d'exécution n'est pas défini ou vaut `auto` |
| Échouer sans repli si Codex est indisponible           | Fournisseur ou modèle avec `agentRuntime.id: "codex"`                                                       | Le tour échoue au lieu d'utiliser le repli intégré | À utiliser pour les déploiements exclusivement Codex          |
| Trafic direct par clé API OpenAI via OpenClaw           | Fournisseur ou modèle avec `agentRuntime.id: "openclaw"` et authentification OpenAI normale                 | `/status` affiche l'environnement d'exécution OpenClaw | À utiliser uniquement lorsque OpenClaw est intentionnel       |
| Ancienne configuration                                 | anciennes références GPT Codex                                                                              | `openclaw doctor --fix` les réécrit           | Ne rédigez pas de nouvelle configuration de cette manière     |
| Adaptateur Codex ACP/acpx                              | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | État de la tâche/session ACP                  | Distinct du harnais Codex natif                               |

`agents.defaults.imageModel` suit la même séparation par préfixe. Utilisez `openai/gpt-*` pour la route OpenAI normale et `codex/gpt-*` uniquement lorsque la compréhension des images doit s'exécuter au moyen d'un tour limité de l'app-server Codex. Doctor réécrit les anciennes références GPT Codex en `openai/gpt-*`.

## Modèles de déploiement

### Déploiement Codex de base

Utilisez la configuration de démarrage rapide pour un modèle OpenAI dont la route HTTPS officielle effective peut sélectionner implicitement Codex :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Déploiement avec plusieurs fournisseurs

Conservez Claude comme agent par défaut et ajoutez un agent Codex nommé :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

L'agent `main` utilise son chemin de fournisseur normal. L'agent `codex` utilise l'app-server Codex tant que sa route OpenAI effective reste compatible ; ajoutez explicitement `agentRuntime.id: "codex"` au niveau du modèle lorsque cela doit constituer une exigence sans repli.

### Déploiement Codex sans repli

Une route OpenAI HTTPS officielle exacte et admissible peut être résolue vers Codex lorsque le plugin intégré est disponible. Ajoutez une politique d'exécution explicite pour établir une règle écrite sans repli :

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Lorsque Codex est imposé, OpenClaw échoue rapidement si la route effective n'est pas déclarée compatible avec Codex, si le plugin est désactivé, si l'app-server est trop ancien ou si l'app-server ne peut pas démarrer.

## Politique de l'app-server

Par défaut, le plugin démarre localement le binaire Codex géré par OpenClaw avec un transport stdio. Définissez `appServer.command` uniquement pour exécuter intentionnellement un autre exécutable. Utilisez le transport WebSocket uniquement lorsqu'un app-server est déjà exécuté ailleurs :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Les sessions locales de l'app-server stdio adoptent par défaut la posture de l'opérateur local de confiance : `approvalPolicy: "never"`, `approvalsReviewer: "user"` et `sandbox: "danger-full-access"`. Si les exigences Codex locales interdisent cette posture YOLO implicite, OpenClaw sélectionne à la place les autorisations Guardian permises. Lorsqu'un bac à sable OpenClaw est actif pour la session, OpenClaw désactive le Code Mode natif de Codex, les serveurs MCP de l'utilisateur et l'exécution des plugins adossés à une application pour ce tour, au lieu de s'appuyer sur l'isolation côté hôte de Codex. L'accès au shell passe alors par des outils dynamiques adossés au bac à sable OpenClaw, tels que `sandbox_exec` et `sandbox_process`, lorsque les outils exec/process normaux sont disponibles.

Utilisez le mode exec OpenClaw normalisé pour l'examen automatique natif de Codex avant les sorties du bac à sable ou les autorisations supplémentaires :

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Pour les sessions de l'app-server Codex, `tools.exec.mode: "auto"` correspond aux approbations examinées par Codex Guardian : généralement `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"` lorsque les exigences locales autorisent ces valeurs. Avec `tools.exec.mode: "auto"`, OpenClaw ne conserve pas les anciens remplacements Codex non sécurisés `approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ; utilisez `tools.exec.mode: "full"` pour adopter intentionnellement une posture Codex sans approbation. L'ancien préréglage `plugins.entries.codex.config.appServer.mode: "guardian"` fonctionne toujours, mais `tools.exec.mode: "auto"` est la surface OpenClaw normalisée.

Pour comparer les modes avec les approbations exec de l'hôte et les autorisations ACPX, consultez [Modes d'autorisation](/fr/tools/permission-modes). Pour tous les champs de l'app-server, l'ordre d'authentification, l'isolation de l'environnement et le comportement des délais d'expiration, consultez la [Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Commandes et diagnostics

Le plugin `codex` enregistre `/codex` comme commande à barre oblique sur tout canal prenant en charge les commandes textuelles OpenClaw.

L'exécution et le contrôle natifs nécessitent un propriétaire ou un client Gateway `operator.admin` : associer ou reprendre des fils, envoyer ou arrêter des tours, modifier le modèle, le mode rapide ou l'état des autorisations, effectuer une Compaction ou un examen, et dissocier une association. Les autres expéditeurs autorisés conservent des commandes en lecture seule pour consulter l'état, l'aide, le compte, les modèles, les fils, les serveurs MCP, les Skills et les associations.

Formes courantes :

- `/codex status` vérifie la connectivité à l'app-server, les modèles, le compte, les limites de débit, les serveurs MCP et les Skills.
- `/codex models` répertorie les modèles actifs de l'app-server Codex.
- `/codex threads [filter]` répertorie les fils récents de l'app-server Codex.
- `/codex resume <thread-id>` associe la session OpenClaw actuelle à un fil Codex existant.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  associe le chat actuel.
- `/codex detach` (ou `/codex unbind`) dissocie l'association actuelle.
- `/codex binding` décrit l'association actuelle.
- `/codex stop` arrête le tour actif ; `/codex steer <text>` l'oriente.
- `/codex model <model>`, `/codex fast [on|off|status]` et
  `/codex permissions [default|yolo|status]` modifient l'état propre à la conversation.
- `/codex compact` demande à l'app-server Codex d'effectuer une Compaction du fil associé.
- `/codex review` démarre l'examen natif Codex pour le fil associé.
- `/codex diagnostics [note]` demande confirmation avant d'envoyer des commentaires à Codex pour le fil associé.
- `/codex account` affiche l'état du compte et des limites de débit.
- `/codex mcp` répertorie l'état des serveurs MCP de l'app-server Codex.
- `/codex skills` répertorie les Skills de l'app-server Codex.
- `/codex plugins list`, `/codex plugins enable <name>` et
  `/codex plugins disable <name>` gèrent les plugins Codex natifs configurés.
- `/codex computer-use [status|install]` gère Codex Computer Use.
- `/codex help` répertorie l'arborescence complète des commandes.

Pour la plupart des demandes d’assistance, commencez par `/diagnostics [note]` dans la
conversation où le bug s’est produit. Cette commande crée un rapport de diagnostic
du Gateway et, pour les sessions du harnais Codex, demande l’autorisation d’envoyer le
paquet de commentaires Codex pertinent. Consultez
[Export des diagnostics](/fr/gateway/diagnostics) pour connaître le modèle de confidentialité et le
comportement dans les discussions de groupe. Utilisez `/codex diagnostics [note]` uniquement lorsque vous
souhaitez spécifiquement téléverser les commentaires Codex pour le fil actuellement associé, sans
le paquet de diagnostic complet du Gateway.

### Inspecter localement les fils Codex

Le moyen le plus rapide d’inspecter une exécution Codex défaillante consiste souvent à ouvrir directement le
fil Codex natif :

```bash
codex resume <thread-id>
```

Récupérez l’identifiant du fil dans la réponse finale de `/diagnostics`, avec `/codex binding`,
ou avec `/codex threads [filter]`.

Pour les mécanismes de téléversement et les limites des diagnostics au niveau de l’environnement d’exécution, consultez
[Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime#codex-feedback-upload).

### Ordre d’authentification

Dans le répertoire personnel par agent par défaut, l’authentification est sélectionnée dans cet ordre :

1. Les profils d’authentification OpenAI ordonnés de l’agent, de préférence sous
   `auth.order.openai`. Exécutez `openclaw doctor --fix` pour migrer les anciens
   identifiants de profils d’authentification Codex hérités et l’ancien ordre d’authentification Codex.
2. Le compte existant du serveur d’application dans le répertoire personnel Codex de cet agent.
3. Uniquement pour les lancements locaux du serveur d’application via stdio, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte du serveur d’application n’est présent et qu’une authentification
   OpenAI reste nécessaire.

Lorsqu’OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il
supprime `CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex
créé. Ainsi, les clés API au niveau du Gateway restent disponibles pour les plongements ou
les modèles OpenAI directs, sans que les tours natifs du serveur d’application Codex soient
facturés accidentellement via l’API. Les profils Codex explicites fondés sur une clé API et le
repli local vers une clé d’environnement via stdio utilisent la connexion au serveur d’application au lieu de
l’environnement hérité du processus enfant. Les connexions au serveur d’application par WebSocket ne
reçoivent pas le repli vers les clés API d’environnement du Gateway ; utilisez un profil
d’authentification explicite ou le propre compte du serveur d’application distant.

Si un profil d’abonnement atteint une limite d’utilisation de Codex, OpenClaw enregistre
l’heure de réinitialisation lorsque Codex en indique une et essaie le profil d’authentification ordonné suivant
pour la même exécution Codex. Une fois l’heure de réinitialisation passée, le profil
d’abonnement redevient éligible sans modifier le modèle `openai/gpt-*`
sélectionné ni l’environnement d’exécution Codex.

Lorsque des plugins Codex natifs sont configurés, OpenClaw installe ou actualise
ces plugins par l’intermédiaire du serveur d’application connecté avant d’exposer au fil Codex les
applications appartenant aux plugins. `app/list` reste la source de vérité pour les
identifiants d’application, l’accessibilité et les métadonnées, mais OpenClaw décide de
l’activation pour chaque fil : si la politique autorise une application accessible répertoriée, OpenClaw
envoie `thread/start.config.apps[appId].enabled = true`, même lorsque `app/list`
indique actuellement que cette application est désactivée. Ce chemin n’invente pas
d’installation d’application pour des identifiants inconnus ; OpenClaw active uniquement les plugins de la place de marché
avec `plugin/install`, puis actualise l’inventaire.

### Isolation de l’environnement

Pour les lancements locaux du serveur d’application via stdio, OpenClaw définit `CODEX_HOME` sur un
répertoire propre à chaque agent afin que la configuration Codex, les fichiers d’authentification et de compte, le cache et les données
des plugins, ainsi que l’état natif des fils, ne lisent ni n’écrivent par défaut dans le répertoire
`~/.codex` personnel de l’opérateur. OpenClaw conserve la valeur normale de `HOME` du processus ;
les sous-processus exécutés par Codex peuvent toujours trouver la configuration et les jetons du répertoire personnel de l’utilisateur, et
Codex peut découvrir les entrées partagées de `$HOME/.agents/skills` et
`$HOME/.agents/plugins/marketplace.json`. Avec
`appServer.homeScope: "user"`, OpenClaw utilise à la place le répertoire personnel Codex natif de
l’utilisateur et son compte existant, sans injecter de profil d’authentification OpenClaw.

Si un déploiement nécessite une isolation supplémentaire de l’environnement, ajoutez ces
variables à `appServer.clearEnv` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` affecte uniquement le processus enfant du serveur d’application Codex
créé. OpenClaw supprime `CODEX_HOME` et `HOME` de cette liste pendant la
normalisation du lancement local : `CODEX_HOME` reste défini sur la portée de l’agent
ou de l’utilisateur sélectionnée, et `HOME` reste hérité afin que les sous-processus puissent utiliser
l’état normal du répertoire personnel de l’utilisateur.

### Outils dynamiques et recherche sur le Web

Par défaut, les outils dynamiques Codex utilisent le chargement `searchable`. OpenClaw
n’expose pas les outils dynamiques qui dupliquent les opérations natives de Codex sur l’espace de travail :
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` et `tool_search_code`. La plupart
des autres outils d’intégration OpenClaw, comme la messagerie, les médias, cron,
le navigateur, les nœuds, le Gateway et `heartbeat_respond`, sont disponibles par l’intermédiaire de
la recherche d’outils Codex dans l’espace de noms `openclaw`, ce qui réduit la taille du contexte
initial du modèle.

Les outils marqués `catalogMode: "direct-only"`, notamment l’outil `computer`
d’OpenClaw, utilisent à la place l’espace de noms `openclaw_direct`. Codex traite cet espace de noms
comme `DirectModelOnly` ; ces outils restent donc directement visibles par le modèle dans les fils
normaux et ceux limités au mode code, au lieu de passer par des appels `tools.*` imbriqués du mode Code.

La recherche sur le Web utilise par défaut l’outil hébergé `web_search` de Codex lorsque la recherche est
activée et qu’aucun fournisseur géré n’est sélectionné. La recherche hébergée native et
l’outil dynamique géré `web_search` d’OpenClaw sont mutuellement exclusifs afin que
la recherche gérée ne puisse pas contourner les restrictions de domaines natives. OpenClaw utilise
l’outil géré lorsque la recherche hébergée est indisponible, explicitement désactivée ou
remplacée par un fournisseur géré sélectionné. OpenClaw maintient désactivée l’extension autonome
`web.run` de Codex, car le trafic de production du serveur d’application rejette
son espace de noms `web` défini par l’utilisateur. `tools.web.search.enabled: false`
désactive les deux chemins, tout comme les exécutions limitées au LLM dont les outils sont désactivés. Codex traite
`"cached"` comme une préférence et la résout en accès externe en direct pour
les tours non restreints du serveur d’application. Le repli automatique vers la recherche gérée échoue de manière fermée lorsque
des `allowedDomains` natifs sont définis, afin que la liste d’autorisation ne puisse pas être contournée.
Les modifications persistantes de la politique de recherche effective font tourner le fil Codex associé
avant le tour suivant ; les restrictions transitoires propres à un tour utilisent un fil
restreint temporaire et conservent l’association existante pour une reprise ultérieure.

Les réponses sources de `sessions_yield` et celles utilisant uniquement l’outil de messagerie restent directes, car
il s’agit de contrats de contrôle des tours. `sessions_spawn` reste disponible par recherche afin que
le `spawn_agent` natif de Codex demeure la principale surface de sous-agents Codex,
tandis que la délégation explicite OpenClaw ou ACP reste disponible par l’intermédiaire de
l’espace de noms d’outils dynamiques `openclaw`. Les instructions de collaboration du Heartbeat
indiquent à Codex de rechercher `heartbeat_respond` avant de terminer un tour de Heartbeat
lorsque l’outil n’est pas déjà chargé.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un serveur
d’application Codex personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du
débogage de la charge utile complète des outils.

### Champs de configuration

Champs de premier niveau pris en charge pour le plugin Codex :

| Champ                      | Valeur par défaut | Signification                                                                            |
| -------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"`    | Utilisez `"direct"` pour placer directement les outils dynamiques OpenClaw dans le contexte initial des outils Codex. |
| `codexDynamicToolsExclude` | `[]`              | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours du serveur d’application Codex. |
| `codexPlugins`             | désactivé         | Prise en charge native des plugins et applications Codex pour les plugins sélectionnés migrés et installés depuis les sources. |
| `supervision`              | désactivé         | Catalogue des sessions natives non archivées, poursuite de la branche locale et politique des outils de l’agent. |

Champs `appServer` pris en charge :

| Champ                                         | Valeur par défaut                                     | Signification                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; la valeur explicite `"unix"` établit une connexion au socket de contrôle local ; `"websocket"` établit une connexion à `url`.                                                                                                                                                                                                                                              |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isole l’état ordinaire du harnais pour chaque agent OpenClaw. `"user"` est une option d’activation explicite qui partage le `$CODEX_HOME` natif ou `~/.codex`, utilise l’authentification native et active la gestion des fils réservée au propriétaire. La portée utilisateur prend en charge le transport stdio local ou Unix. Pour la connexion de supervision distincte, une valeur non définie devient `"user"` pour stdio ou Unix et `"agent"` pour WebSocket. |
| `command`                                     | binaire Codex géré                                     | Exécutable du transport stdio. Laissez cette valeur non définie pour utiliser le binaire géré ; définissez-la uniquement pour un remplacement explicite.                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments du transport stdio.                                                                                                                                                                                                                                                                                                                                                                      |
| `url`                                         | non défini                                             | URL WebSocket de l’App Server ou URL `unix://`. Un chemin Unix explicite vide sélectionne le socket de contrôle canonique du répertoire personnel de l’utilisateur.                                                                                                                                                                                                                                 |
| `authToken`                                   | non défini                                             | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou une SecretInput telle que `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                   |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                 |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité. OpenClaw conserve le `CODEX_HOME` sélectionné et le `HOME` hérité pour les lancements locaux.                                                                                                                                                 |
| `codeModeOnly`                                | `false`                                                | Active uniquement la surface d’outils en mode code de Codex. Les outils dynamiques ordinaires d’OpenClaw restent disponibles via des appels `tools.*` imbriqués ; les outils `openclaw_direct` restent directement visibles par le modèle.                                                                                                                                                           |
| `remoteWorkspaceRoot`                         | non défini                                             | Racine distante de l’espace de travail de l’app-server Codex. Lorsqu’elle est définie, OpenClaw déduit la racine locale de l’espace de travail à partir de l’espace de travail OpenClaw résolu, conserve le suffixe du répertoire de travail courant sous cette racine distante et envoie uniquement le répertoire de travail final de l’app-server à Codex. Si le répertoire de travail courant se trouve hors de la racine résolue de l’espace de travail OpenClaw, OpenClaw échoue de manière fermée au lieu d’envoyer un chemin local au Gateway à l’app-server distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration des appels du plan de contrôle de l’app-server.                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre de silence après que Codex a accepté un tour ou après une requête app-server limitée à un tour, pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde de progression et d’inactivité d’achèvement utilisée après un transfert vers un outil, l’achèvement d’un outil natif, une progression brute de l’assistant après l’outil, l’achèvement du raisonnement brut ou la progression du raisonnement, pendant qu’OpenClaw attend `turn/completed`. Utilisez-la pour les charges de travail fiables ou lourdes où la synthèse après l’outil peut légitimement rester silencieuse plus longtemps que le budget de publication finale de l’assistant. |
| `mode`                                        | `"yolo"` sauf si les exigences locales de Codex interdisent YOLO | Préréglage pour l’exécution YOLO ou examinée par le gardien. Les exigences stdio locales qui omettent `danger-full-access`, l’approbation `never` ou l’examinateur `user` font du gardien la valeur implicite par défaut.                                                                                                                                                                                |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation autorisée du gardien | Politique d’approbation native de Codex envoyée au démarrage, à la reprise ou au tour du fil. Les valeurs par défaut du gardien privilégient `"on-request"` lorsque cette valeur est autorisée.                                                                                                                                                                                                     |
| `sandbox`                                     | `"danger-full-access"` ou un bac à sable autorisé du gardien | Mode de bac à sable natif de Codex envoyé au démarrage ou à la reprise du fil. Les valeurs par défaut du gardien privilégient `"workspace-write"` lorsque cette valeur est autorisée, sinon `"read-only"`. Lorsqu’un bac à sable OpenClaw est actif, les tours `danger-full-access` utilisent le mode Codex `workspace-write`, avec un accès réseau dérivé du paramètre de sortie du bac à sable OpenClaw. |
| `approvalsReviewer`                           | `"user"` ou un examinateur autorisé du gardien         | Utilisez `"auto_review"` pour laisser Codex examiner les demandes d’approbation natives lorsque cela est autorisé, sinon `guardian_subagent` ou `user`. `guardian_subagent` reste un alias hérité.                                                                                                                                                                                                  |
| `serviceTier`                                 | non défini                                             | Niveau de service facultatif de l’app-server Codex. `"priority"` active le routage en mode rapide, `"flex"` demande un traitement flexible, `null` efface le remplacement et la valeur héritée `"fast"` est acceptée comme `"priority"`.                                                                                                                                                             |
| `networkProxy`                                | désactivé                                              | Active la mise en réseau du profil d’autorisations Codex pour les commandes de l’app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la choisit avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                                | Option d’aperçu qui enregistre auprès de l’app-server Codex pris en charge un environnement Codex adossé au bac à sable OpenClaw, afin que l’exécution native de Codex puisse s’effectuer dans le bac à sable OpenClaw actif.                                                                                                                                                                          |

`appServer.networkProxy` est explicite, car il modifie le contrat du bac à
sable Codex. Lorsqu’il est activé, OpenClaw définit également
`features.network_proxy.enabled` et `default_permissions` dans la
configuration du fil Codex afin que le profil d’autorisations généré puisse
démarrer la mise en réseau gérée par Codex. Par défaut, OpenClaw génère un
nom de profil `openclaw-network-<fingerprint>` résistant aux collisions à
partir du corps du profil ; utilisez `profileName` uniquement lorsqu’un nom
local stable est requis.

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

Si l’environnement d’exécution normal de l’app-server devait être `danger-full-access`, l’activation de
`networkProxy` utilise un accès au système de fichiers de type espace de travail pour le profil
d’autorisation généré : l’application de la politique réseau gérée par Codex s’appuie sur un réseau
en bac à sable ; un profil d’accès complet ne protégerait donc pas le trafic sortant.
Les entrées de domaine utilisent `allow` ou `deny` ; les entrées de socket Unix utilisent les
valeurs `allow` ou `none` de Codex.

### Délais d’expiration des appels d’outils dynamiques

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs` : les requêtes Codex `item/tool/call` utilisent par défaut un
chien de garde OpenClaw de 90 secondes. Un argument `timeoutMs` positif propre à l’appel
allonge ou raccourcit le délai alloué à cet outil précis, avec un plafond de 600000 ms.
L’outil `image_generate` utilise `agents.defaults.imageGenerationModel.timeoutMs`
lorsque l’appel d’outil ne fournit pas son propre délai d’expiration, ou, à défaut, le délai
par défaut de 120 secondes pour la génération d’images. L’outil `image` de compréhension
des médias utilise `tools.media.image.timeoutSeconds` ou son délai par défaut de 60 secondes
pour les médias ; pour la compréhension d’images, ce délai s’applique à la requête elle-même
et n’est pas réduit par le travail de préparation antérieur. À l’expiration du délai, OpenClaw
interrompt le signal de l’outil lorsque cela est pris en charge et renvoie à Codex une réponse
d’échec de l’outil dynamique afin que le tour puisse continuer au lieu de laisser la session
dans l’état `processing`. Ce chien de garde constitue le délai global de l’appel dynamique
`item/tool/call` ; les délais d’expiration des requêtes propres au fournisseur s’exécutent
à l’intérieur de cet appel et conservent leur propre sémantique.

Après que Codex a accepté un tour, et après qu’OpenClaw a répondu à une requête app-server
limitée à ce tour, le harnais attend de Codex qu’il progresse dans le tour en cours et qu’il
termine finalement le tour natif avec `turn/completed`. Si l’app-server reste silencieux pendant
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw tente d’interrompre le tour Codex, enregistre
un délai d’expiration de diagnostic et libère la file de session OpenClaw afin que les messages
de discussion suivants ne restent pas en attente derrière un tour natif obsolète. La plupart des
notifications non terminales du même tour désarment ce court chien de garde, car Codex a prouvé
que le tour est toujours actif.

Les transferts d’outils utilisent un délai d’inactivité post-outil plus long : après qu’OpenClaw
a renvoyé une réponse `item/tool/call`, après l’achèvement d’éléments d’outils natifs tels que
`commandExecution`, après les achèvements bruts `custom_tool_call_output`, ainsi qu’après la
progression brute post-outil de l’assistant, les achèvements bruts du raisonnement ou la progression
du raisonnement. Le garde utilise `appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il
est configuré et, à défaut, une durée de cinq minutes ; ce même délai prolonge également le chien
de garde de progression pendant la fenêtre de synthèse silencieuse précédant l’émission par Codex
de l’événement suivant du tour en cours. Les notifications globales de l’app-server, telles que les
mises à jour de limite de débit, ne réinitialisent pas la progression liée à l’inactivité du tour.
Les achèvements du raisonnement, les achèvements `agentMessage` de commentaire et la progression
brute du raisonnement ou de l’assistant précédant l’outil peuvent être suivis d’une réponse finale
automatique ; ils utilisent donc le garde de réponse post-progression au lieu de libérer immédiatement
la file de session.

Seuls les éléments `agentMessage` terminés, finaux et hors commentaire, ainsi que les achèvements
bruts de l’assistant précédant l’outil, arment la libération liée à la sortie de l’assistant : si Codex
reste ensuite silencieux sans `turn/completed`, OpenClaw tente d’interrompre le tour natif et libère
la file de session. Si un autre surveillant de tour remporte cette course de libération, OpenClaw
accepte tout de même l’élément final terminé de l’assistant dès qu’aucune requête native, aucun élément
ni aucun achèvement d’outil dynamique ne reste actif, que la libération liée à la sortie de l’assistant
appartient toujours au dernier élément terminé et qu’aucun élément ultérieur ne s’est achevé. Cela peut
préserver la réponse finale après l’achèvement du travail des outils sans rejouer le tour. Les deltas
partiels de l’assistant, les réponses antérieures obsolètes et les achèvements ultérieurs vides ne sont
pas admissibles.

Les défaillances rejouables en toute sécurité de l’app-server stdio, notamment les délais d’inactivité
d’achèvement du tour sans indice provenant de l’assistant, d’un outil, d’un élément actif ou d’un effet
de bord, font l’objet d’une nouvelle tentative unique sur une nouvelle instance de l’app-server.
Les délais d’expiration non sûrs retirent tout de même le client app-server bloqué et libèrent la file
de session OpenClaw ; ils effacent également l’association obsolète au fil natif au lieu d’être rejoués
automatiquement. Les délais d’expiration du surveillant d’achèvement affichent un texte propre à Codex :
les cas rejouables en toute sécurité indiquent que la réponse peut être incomplète, tandis que les cas
non sûrs demandent à l’utilisateur de vérifier l’état actuel avant de réessayer. Les diagnostics publics
de délai d’expiration comprennent des champs structurels tels que la méthode de la dernière notification
de l’app-server, l’identifiant, le type et le rôle de l’élément brut de réponse de l’assistant, le nombre
de requêtes et d’éléments actifs, ainsi que l’état du surveillant armé ; lorsque la dernière notification
est un élément brut de réponse de l’assistant, ils comprennent également un aperçu limité du texte de
l’assistant. Ils n’incluent ni le contenu brut du prompt ni celui des outils.

### Remplacements de variables d’environnement pour les tests locaux

- `OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
  `appServer.command` n’est pas défini.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez plutôt
`plugins.entries.codex.config.appServer.mode: "guardian"`, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration
est préférable pour les déploiements reproductibles, car elle conserve le comportement du plugin
dans le même fichier vérifié que le reste de la configuration du harnais Codex.

## Plugins Codex natifs

La prise en charge des plugins Codex natifs utilise les propres capacités d’application et de plugin
de l’app-server Codex dans le même fil Codex que le tour du harnais OpenClaw. OpenClaw ne traduit pas
les plugins Codex en outils dynamiques OpenClaw synthétiques `codex_plugin_*`.

`codexPlugins` affecte uniquement les sessions qui sélectionnent le harnais Codex natif.
Il n’a aucun effet sur les exécutions du harnais intégré, les exécutions normales du fournisseur OpenAI,
les associations de conversations ACP ni les autres harnais.

Configuration minimale migrée :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

La configuration des applications du fil est calculée lorsqu’OpenClaw établit une session du harnais
Codex ou remplace une association obsolète au fil Codex ; elle n’est pas recalculée à chaque tour.
Après avoir modifié `codexPlugins`, utilisez `/new`, `/reset` ou redémarrez le Gateway afin que les
futures sessions du harnais Codex démarrent avec l’ensemble d’applications mis à jour.

Pour l’admissibilité à la migration, l’inventaire des applications, la politique relative aux actions
destructives, les sollicitations et les diagnostics des plugins natifs, consultez
[Plugins Codex natifs](/fr/plugins/codex-native-plugins).

L’accès aux applications et aux plugins côté OpenAI est contrôlé par le compte Codex connecté et,
pour les espaces de travail Business et Enterprise/Edu, par les contrôles d’applications de l’espace
de travail. Consultez
[Utiliser Codex avec votre offre ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
pour une présentation par OpenAI des contrôles de compte et d’espace de travail.

## Utilisation de l’ordinateur

L’utilisation de l’ordinateur dispose de son propre guide de configuration :
[Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use).

En bref : OpenClaw n’intègre pas l’application de contrôle du bureau et n’exécute pas lui-même les
actions sur le bureau. Il prépare l’app-server Codex, vérifie que le serveur MCP `computer-use` est
disponible, puis laisse Codex gérer les appels d’outils MCP natifs pendant les tours en mode Codex.

## Limites de l’environnement d’exécution

Le harnais Codex modifie uniquement l’exécuteur d’agent intégré de bas niveau.

- Les outils dynamiques OpenClaw sont pris en charge. Codex demande à OpenClaw d’exécuter
  ces outils ; OpenClaw reste donc dans le chemin d’exécution.
- Les outils natifs de shell, de correctif, MCP et d’application de Codex appartiennent à Codex.
  OpenClaw peut observer ou bloquer certains événements natifs par l’intermédiaire du relais
  pris en charge, mais ne réécrit pas les arguments des outils natifs.
- Codex gère la Compaction native. OpenClaw conserve une copie du relevé pour
  l’historique du canal, la recherche, `/new`, `/reset` et les futurs changements de modèle ou
  de harnais, mais ne remplace pas la Compaction Codex par un outil de résumé OpenClaw ou
  du moteur de contexte.
- La génération de médias, la compréhension des médias, la synthèse vocale, les approbations
  et la sortie des outils de messagerie continuent d’utiliser les paramètres de fournisseur et
  de modèle OpenClaw correspondants.
- `tool_result_persist` s’applique aux résultats d’outils du relevé appartenant à OpenClaw,
  et non aux enregistrements de résultats d’outils natifs de Codex.

Pour les couches de hooks, les surfaces V1 prises en charge, la gestion native des autorisations,
le pilotage de la file d’attente, les mécanismes d’envoi de commentaires Codex et les détails de
la Compaction, consultez
[Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime).

## Dépannage

**Codex n’apparaît pas comme un fournisseur `/model` normal :** ce comportement est attendu pour les
nouvelles configurations. Sélectionnez un modèle `openai/gpt-*`, activez
`plugins.entries.codex.enabled` et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise le harnais intégré au lieu de Codex :** confirmez que la route effective
est exactement une route HTTPS officielle Platform Responses ou ChatGPT Responses,
qu’elle ne comporte aucun remplacement de requête défini par l’auteur et que le plugin Codex
est installé et activé. Le préfixe `openai/gpt-*` seul ne suffit pas. Pour obtenir une preuve stricte
pendant les tests, définissez `agentRuntime.id: "codex"` pour le fournisseur ou le modèle ; le forçage
de Codex échoue au lieu de se rabattre sur une autre solution lorsque la route ou le harnais est
incompatible.

**L’environnement d’exécution OpenAI Codex se rabat sur le chemin par clé d’API :** recueillez un
extrait expurgé du Gateway montrant le modèle, l’environnement d’exécution, le fournisseur sélectionné
et l’échec. Demandez aux collaborateurs concernés d’exécuter cette commande en lecture seule sur leur
hôte OpenClaw :

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Les extraits utiles comprennent généralement `openai/gpt-5.6-sol` ou `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` ou `harnessRuntime`,
`candidateProvider: "openai"`, ainsi qu’un résultat `401`, `Incorrect API key` ou
`No API key`. Une exécution corrigée doit montrer le chemin OAuth OpenAI
au lieu d’un simple échec lié à une clé d’API OpenAI.

**La configuration contient encore des références de modèles Codex héritées :** exécutez
`openclaw doctor --fix`. Doctor réécrit les références de modèles héritées en `openai/*`,
supprime les associations obsolètes de session et d’environnement d’exécution de l’agent entier,
et conserve les remplacements de profils d’authentification existants.

**L’app-server est rejeté :** utilisez l’app-server Codex `0.143.0` ou une version ultérieure.
Les préversions de même version ou les versions dotées d’un suffixe de compilation, telles que
`0.143.0-alpha.2` ou `0.143.0+custom`, sont rejetées, car OpenClaw vérifie que la version stable
minimale du protocole est `0.143.0`.

**`/codex status` ne parvient pas à se connecter :** vérifiez que le plugin `codex`
est activé, que `plugins.allow` l’inclut lorsqu’une liste d’autorisation est
configurée, et que les éventuels `appServer.command`, `url`, `authToken` ou
en-têtes personnalisés sont valides.

**La découverte des modèles est lente :** réduisez
`plugins.entries.codex.config.discovery.timeoutMs` ou désactivez la découverte.
Consultez [Référence du harnais Codex](/fr/plugins/codex-harness-reference#model-discovery).

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`,
`authToken`, les en-têtes et assurez-vous que l’app-server distant utilise la même version
du protocole app-server Codex.

**Les outils shell natifs ou les outils de correctif sont bloqués avec `Native hook relay
unavailable` :** le fil Codex tente toujours d’utiliser un identifiant de relais de hook natif
qui n’est plus enregistré dans OpenClaw. Il s’agit d’un problème de transport des hooks
Codex natifs, et non d’une défaillance du backend ACP, du fournisseur, de GitHub ou d’une
commande shell. Démarrez une nouvelle session dans la conversation concernée avec `/new`
ou `/reset`, puis réessayez une commande sans risque. Si cela fonctionne une fois, mais que
l’appel d’outil natif suivant échoue à nouveau, considérez `/new` uniquement comme une
solution temporaire : copiez l’invite dans une nouvelle session après avoir redémarré le
serveur d’application Codex ou le Gateway OpenClaw, afin que les anciens fils soient
supprimés et que les enregistrements de hooks natifs soient recréés.

**Un modèle autre que Codex utilise le harnais intégré :** ce comportement est attendu, sauf
si la politique d’exécution du fournisseur ou du modèle l’achemine vers un autre harnais. Les
références ordinaires de fournisseurs autres qu’OpenAI restent sur le chemin normal de leur
fournisseur en mode `auto`.

**Computer Use est installé, mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, suivez la procédure de récupération du relais de hook natif
ci-dessus. Consultez [Codex Computer Use](/fr/plugins/codex-computer-use#troubleshooting).

## Pages connexes

- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Supervision de Codex](/plugins/codex-supervision)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Aide sur OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Exportation des diagnostics](/fr/gateway/diagnostics)
- [État](/fr/cli/status)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
