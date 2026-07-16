---
read_when:
    - Vous souhaitez utiliser le harnais officiel du serveur d’application Codex
    - Vous avez besoin d’exemples de configuration du harness Codex
    - Vous souhaitez que les déploiements exclusivement Codex échouent au lieu de se rabattre sur OpenClaw
summary: Exécuter les tours d’agent intégré OpenClaw via le harnais officiel du serveur d’application Codex
title: Harnais Codex
x-i18n:
    generated_at: "2026-07-16T13:31:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

Le plugin officiel `codex` exécute les tours d’agent OpenAI intégrés via le serveur d’application Codex
au lieu du harnais OpenClaw intégré. Codex gère la
session d’agent de bas niveau : reprise native des threads, poursuite native des outils,
Compaction native et exécution par le serveur d’application. OpenClaw continue de gérer les canaux
de discussion, les fichiers de session, la sélection du modèle, les outils dynamiques OpenClaw, les approbations,
la livraison des médias et le miroir visible de la transcription.

Utilisez des références de modèle OpenAI canoniques telles que `openai/gpt-5.6-sol`. Ne configurez pas
d’anciennes références GPT Codex ; placez l’ordre d’authentification de l’agent OpenAI sous `auth.order.openai`.
Les identifiants d’anciens profils d’authentification Codex et les anciennes entrées d’ordre d’authentification Codex sont
réparés par `openclaw doctor --fix`.

Lorsque la stratégie d’exécution du fournisseur/modèle n’est pas définie ou vaut `auto`, le préfixe `openai/*` seul
ne sélectionne jamais ce harnais. OpenAI peut sélectionner Codex implicitement uniquement pour une
route HTTPS officielle exacte de Platform Responses ou ChatGPT Responses sans
remplacement de requête défini. Consultez
[Exécution implicite de l’agent OpenAI](/fr/providers/openai#implicit-agent-runtime).
Si Codex gère l’authentification avant que le routage Platform ou ChatGPT soit connu, OpenClaw
exige toujours que chaque route candidate déclare sa compatibilité avec Codex. La gestion native
de l’authentification ne contourne jamais à elle seule cette vérification de route.

Lorsqu’aucun bac à sable OpenClaw n’est actif, OpenClaw démarre les threads du serveur d’application Codex
avec le mode code natif de Codex activé (le mode code uniquement reste désactivé par défaut), afin que
les fonctionnalités natives d’espace de travail et de code restent disponibles avec les outils
dynamiques OpenClaw acheminés par le pont `item/tool/call` du serveur d’application. Un
bac à sable OpenClaw actif ou une stratégie d’outils restrictive désactive entièrement le mode code natif,
sauf si vous activez le chemin expérimental du serveur d’exécution du bac à sable.

Avec la valeur `tools.exec.host: "auto"` par défaut et sans bac à sable OpenClaw actif,
Codex reçoit également les outils `node_exec` et `node_process` pour les commandes sur les Nodes
appairés. Le shell natif reste sur l’hôte et dans l’espace de travail du serveur d’application Codex
(local au Gateway pour le déploiement stdio par défaut) ; `node_exec` sélectionne un Node par
nom ou identifiant et maintient en vigueur la stratégie d’approbation des Nodes d’OpenClaw. Si une liste
d’autorisation d’exécution finie désactive le mode code natif et laisse le tour sans
environnement d’exécution, OpenClaw conserve à la place ses outils `exec` et `process`
filtrés par la stratégie pour une exécution directe sans bac à sable.

Cette fonctionnalité native de Codex est distincte du
[mode code OpenClaw](/fr/reference/code-mode), un environnement d’exécution QuickJS-WASI facultatif
pour les exécutions OpenClaw génériques avec une forme d’entrée `exec` différente. Pour comprendre
la séparation plus générale entre modèle, fournisseur et environnement d’exécution, commencez par
[Environnements d’exécution des agents](/fr/concepts/agent-runtimes) : `openai/gpt-5.6-sol` est la référence
du modèle, `codex` est l’environnement d’exécution, et Telegram, Discord, Slack ou un autre
canal constitue la surface de communication.

## Prérequis

- Le plugin officiel `@openclaw/codex` doit être installé. Incluez `codex` dans
  `plugins.allow` si votre configuration utilise une liste d’autorisation.
- Serveur d’application Codex `0.143.0` ou version ultérieure. Le plugin gère par défaut un
  binaire compatible ; une commande `codex` dans `PATH` n’affecte donc pas le démarrage
  normal.
- Authentification Codex via `openclaw models auth login --provider openai`, un
  compte de serveur d’application déjà présent dans le répertoire d’accueil Codex de l’agent, ou un
  profil d’authentification explicite par clé API Codex.

Pour la priorité d’authentification, l’isolation de l’environnement, les commandes personnalisées du serveur d’application,
la découverte des modèles et la liste complète des champs de configuration, consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference).

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

Redémarrez le Gateway après avoir modifié la configuration du plugin. Si une discussion possède déjà une
session, exécutez d’abord `/new` ou `/reset` afin que le tour suivant résolve le harnais
à partir de la configuration actuelle.

## Partager des threads avec Codex Desktop et la CLI

La valeur `appServer.homeScope: "agent"` par défaut isole chaque agent OpenClaw de
l’état Codex natif de l’opérateur. Pour permettre à un propriétaire d’inspecter et de gérer les
mêmes threads natifs affichés par Codex Desktop et la CLI Codex, activez le
répertoire d’accueil Codex de l’utilisateur :

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

Le mode de répertoire d’accueil utilisateur prend en charge un processus stdio géré localement ou le transport
partagé par socket Unix. Il utilise `$CODEX_HOME` lorsqu’il est défini et `~/.codex` dans le cas contraire, y compris
l’authentification Codex native, la configuration, les plugins et le stockage des threads de ce répertoire. OpenClaw
n’injecte aucun profil d’authentification OpenClaw dans ce serveur d’application.

Les tours du propriétaire obtiennent l’outil `codex_threads` : répertorier, rechercher, lire, créer une branche,
renommer, archiver et restaurer des threads natifs. Créez une branche d’un thread pour le poursuivre dans
OpenClaw ; la branche est associée à la session OpenClaw actuelle et reste
visible pour les autres clients Codex natifs. L’archivage exige la confirmation explicite
que le thread est fermé ailleurs. Lorsque la supervision est également
activée, les champs de transcription et les mutations nécessitent l’activation correspondante
de `supervision.allowRawTranscripts` ou `supervision.allowWriteControls`.

Ne reprenez pas et ne modifiez pas simultanément le même thread via des serveurs d’application stdio
gérés indépendants. Codex coordonne les processus d’écriture actifs au sein d’un seul serveur d’application, mais pas
entre des processus distincts. La création d’une branche constitue la voie de coexistence sûre pour les sessions stdio
ordinaires utilisant le répertoire d’accueil utilisateur.

`appServer.homeScope: "user"` seul ne contrôle pas le catalogue de la flotte. La
découverte des sessions natives est activée tant que le plugin est actif ; définissez
`sessionCatalog.enabled: false` pour la retirer de la barre latérale OpenClaw sans
désactiver Codex. Le catalogue utilise une connexion de supervision distincte ; sans
paramètres de connexion `appServer` explicites, cette connexion utilise par défaut un processus stdio géré
dans le répertoire d’accueil utilisateur, tandis que le harnais ordinaire reste limité à l’agent. Les paramètres
`appServer` explicites sont respectés par les deux chemins. Définissez explicitement `homeScope: "user"`,
comme ci-dessus, lorsque le harnais ordinaire doit également partager l’état natif.

## Superviser les sessions Codex

Le même plugin `codex` peut répertorier les sessions Codex non archivées de l’ordinateur du Gateway
et des Nodes appairés ayant accepté cette fonctionnalité. Une session locale au Gateway, stockée ou inactive, peut
créer une discussion verrouillée sur un modèle qui reproduit son historique persistant et limité de messages utilisateur et assistant.
Sa liaison privée utilise la connexion de supervision pour l’instantané natif,
la branche canonique et les tours suivants, tandis que les sessions Codex ordinaires restent
limitées à l’agent. Le premier démarrage canonique utilise exactement le modèle et le fournisseur que
Codex renvoie pour la branche de l’instantané. Lors des reprises ultérieures, la sélection relève de la
configuration native de Codex ; le modèle OpenClaw externe et la chaîne de repli ne le remplacent
jamais. Les lignes stockées et inactives peuvent être archivées après confirmation explicite
qu’aucun autre processus d’exécution ne les utilise. Les sources actives ne peuvent pas créer de branche ni être archivées ; une
discussion supervisée existante peut néanmoins être ouverte. Les sessions des Nodes appairés restent limitées aux métadonnées.

Consultez [Superviser les sessions Codex](/fr/plugins/codex-supervision) pour la configuration, les règles de création de branches,
les limites des Nodes appairés, l’exposition des métadonnées et le dépannage.

## Configuration

| Besoin                                              | Valeur à définir                                                                                 | Emplacement                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Activer le harnais                                  | `plugins.entries.codex.enabled: true`                                                            | Configuration OpenClaw             |
| Masquer la découverte des sessions Codex natives    | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Configuration du plugin Codex      |
| Conserver l’installation d’un plugin autorisé       | Inclure `codex` dans `plugins.allow`                                                               | Configuration OpenClaw             |
| Autoriser les tours OpenAI admissibles à utiliser Codex implicitement | Route HTTPS officielle exacte Responses/ChatGPT, aucun remplacement de requête défini, environnement d’exécution non défini/`auto` | Configuration du fournisseur/modèle OpenAI |
| Se connecter avec OAuth ChatGPT/Codex               | `openclaw models auth login --provider openai`                                                   | Profil d’authentification de la CLI |
| Ajouter une clé API de secours pour les exécutions Codex | Profil de clé API `openai:*` répertorié après l’authentification par abonnement dans `auth.order.openai` | Profil d’authentification de la CLI + configuration OpenClaw |
| Échouer de manière fermée lorsque Codex est indisponible | `agentRuntime.id: "codex"` du fournisseur ou du modèle                                             | Configuration du modèle/fournisseur OpenClaw |
| Utiliser directement le trafic de l’API OpenAI      | `agentRuntime.id: "openclaw"` du fournisseur ou du modèle avec une authentification OpenAI normale           | Configuration du modèle/fournisseur OpenClaw |
| Ajuster le comportement du serveur d’application    | `plugins.entries.codex.config.appServer.*`                                                       | Configuration du plugin Codex      |
| Activer les applications des plugins Codex natifs   | `plugins.entries.codex.config.codexPlugins.*`                                                    | Configuration du plugin Codex      |
| Activer l’utilisation de l’ordinateur par Codex     | `plugins.entries.codex.config.computerUse.*`                                                     | Configuration du plugin Codex      |

Préférez `auth.order.openai` pour ordonner d’abord l’abonnement, puis la clé API de secours.
Les identifiants d’anciens profils d’authentification Codex et l’ancien ordre d’authentification Codex constituent
un état hérité réservé à doctor ; n’écrivez pas de nouvelles références GPT Codex héritées.

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
pour la même exécution Codex. L’ordre des profils sélectionne les identifiants d’authentification, pas l’environnement d’exécution.
La modification de l’ordre d’authentification ne rend pas compatible avec Codex une route personnalisée, Completions, HTTP ou
comportant un remplacement de requête.

### Compaction

Ne définissez pas `compaction.model` ni `compaction.provider` sur les agents
reposant sur Codex. Codex effectue la Compaction via l’état de ses threads natifs du serveur d’application ; OpenClaw
ignore donc ces remplacements du synthétiseur local pendant l’exécution, et
`openclaw doctor --fix` les supprime lorsque l’agent utilise Codex.

Lossless reste pris en charge comme moteur de contexte pour l’assemblage, l’ingestion et
la maintenance autour des tours Codex, configuré au moyen de
`plugins.slots.contextEngine: "lossless-claw"` et
`plugins.entries.lossless-claw.config.summaryModel`, et non de
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migre l’ancienne
forme `compaction.provider: "lossless-claw"` vers l’emplacement du moteur
de contexte Lossless lorsque Codex est l’environnement d’exécution actif, mais Codex natif
continue de gérer la Compaction. Le harnais natif du serveur d’application prend en charge les moteurs de contexte
qui nécessitent un assemblage préalable à l’invite ; les backends CLI génériques, notamment `codex-cli`,
ne fournissent pas cette fonctionnalité d’hôte.

Pour les agents reposant sur Codex, `/compact` démarre la Compaction native du serveur d’application Codex
sur le thread lié. OpenClaw n’attend pas son achèvement,
n’impose pas de délai d’expiration OpenClaw, ne redémarre pas le serveur d’application partagé et ne se rabat pas sur un
moteur de contexte ni sur un synthétiseur OpenAI public. Si la liaison native du thread Codex
est absente ou obsolète, la commande échoue de manière fermée au lieu de
changer silencieusement de backend de Compaction.

Le reste de cette page couvre la forme du déploiement, le routage à échec fermé, la stratégie
d’approbation du gardien, les plugins Codex natifs et l’utilisation de l’ordinateur. Pour les listes complètes
d’options, les valeurs par défaut, les énumérations, la découverte, l’isolation de l’environnement, les délais d’expiration et
les champs de transport du serveur d’application, consultez
[Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Vérifier le runtime Codex

Utilisez `/status` dans la conversation où vous attendez Codex. Un tour d’agent OpenAI
s’appuyant sur Codex affiche :

```text
Runtime : OpenAI Codex
```

Vérifiez ensuite l’état de l’app-server Codex :

```text
/codex status
/codex models
```

`/codex status` indique la connectivité de l’app-server, le compte, les limites de débit, les serveurs
MCP et les Skills. `/codex models` répertorie le catalogue actif de l’app-server Codex
pour le harnais et le compte. Si `/status` est inattendu, consultez
[Résolution des problèmes](#troubleshooting).

## Routage et sélection du modèle

Séparez les références de fournisseur de la politique de runtime :

- Utilisez `openai/gpt-*` pour la sélection canonique des modèles OpenAI. Le préfixe seul
  ne sélectionne jamais Codex.
- Lorsque le runtime n’est pas défini ou vaut `auto`, seule une route officielle exacte HTTPS Platform Responses
  ou ChatGPT Responses sans remplacement de requête défini par l’auteur peut sélectionner Codex
  implicitement.
- N’utilisez pas de références GPT Codex héritées dans la configuration ; exécutez `openclaw doctor --fix` pour
  réparer les références héritées et les épinglages obsolètes de route de session.
- `agentRuntime.id: "codex"` fait de Codex une exigence avec fermeture en cas d’échec pour une
  route compatible. Cela ne rend pas compatible une route effective incompatible.
- `agentRuntime.id: "openclaw"` fait délibérément utiliser à un fournisseur ou à un modèle le runtime
  OpenClaw intégré.
- `/codex ...` contrôle depuis la conversation les conversations natives de l’app-server Codex.
- ACP/acpx constitue un chemin distinct de harnais externe. Utilisez-le uniquement lorsque l’utilisateur
  demande ACP/acpx ou un adaptateur de harnais externe.

| Intention de l’utilisateur                                  | Utiliser                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Attacher la conversation actuelle                          | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Reprendre un fil Codex existant                            | `/codex resume <thread-id>`                                                                           |
| Répertorier ou filtrer les fils Codex                      | `/codex threads [filter]`                                                                             |
| Répertorier les plugins Codex natifs                       | `/codex plugins list`                                                                                 |
| Activer ou désactiver un plugin Codex natif configuré      | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Reprendre une session CLI Codex stockée comme tour de nœud appairé | `/codex sessions --host <node> [filter]`, puis `/codex resume <session-id> --host <node> --bind here` |
| Afficher les sessions Codex non archivées sur plusieurs ordinateurs | Activer la supervision Codex et ouvrir **Sessions Codex**                                      |
| Modifier le modèle, le mode rapide ou les autorisations du fil lié | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Arrêter ou orienter le tour actif                          | `/codex stop`, `/codex steer <text>`                                                                  |
| Détacher la liaison actuelle                               | `/codex detach` (alias `/codex unbind`)                                                               |
| Envoyer uniquement des commentaires sur Codex              | `/codex diagnostics [note]`                                                                           |
| Démarrer une tâche ACP/acpx                                | Commandes de session ACP/acpx, et non `/codex`                                                      |

| Cas d’utilisation                                  | Configurer                                                                                                   | Vérifier                                | Remarques                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Route OpenAI admissible avec runtime Codex natif   | Route officielle exacte HTTPS Responses/ChatGPT sans remplacement de requête défini par l’auteur, avec le plugin `codex` activé | `/status` affiche `Runtime: OpenAI Codex` | Chemin implicite lorsque le runtime n’est pas défini/vaut `auto` |
| Échouer de manière fermée si Codex est indisponible | Fournisseur ou modèle `agentRuntime.id: "codex"`                                                               | Le tour échoue au lieu de revenir au runtime intégré | À utiliser pour les déploiements exclusivement Codex |
| Acheminer directement le trafic par clé API OpenAI via OpenClaw | Fournisseur ou modèle `agentRuntime.id: "openclaw"` et authentification OpenAI normale                         | `/status` affiche le runtime OpenClaw | À utiliser uniquement lorsque OpenClaw est intentionnel |
| Configuration héritée                              | références GPT Codex héritées                                                                                | `openclaw doctor --fix` les réécrit     | N’écrivez pas de nouvelle configuration ainsi |
| Adaptateur Codex ACP/acpx                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | État de la tâche/session ACP            | Distinct du harnais Codex natif            |

`agents.defaults.imageModel` suit la même séparation de préfixes. Utilisez `openai/gpt-*`
pour la route OpenAI normale et `codex/gpt-*` uniquement lorsque la compréhension d’images
doit passer par un tour limité de l’app-server Codex. Doctor réécrit les références GPT
Codex héritées en `openai/gpt-*`.

## Modèles de déploiement

### Déploiement Codex de base

Utilisez la configuration de démarrage rapide pour un modèle OpenAI dont la route officielle HTTPS
effective est admissible à la sélection implicite de Codex :

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

L’agent `main` utilise son chemin de fournisseur normal. L’agent `codex` utilise l’app-server
Codex lorsque sa route OpenAI effective reste compatible ; ajoutez explicitement
`agentRuntime.id: "codex"` au niveau du modèle lorsque cela doit constituer une exigence
avec fermeture en cas d’échec.

### Déploiement Codex avec fermeture en cas d’échec

Une route OpenAI officielle exacte HTTPS admissible peut se résoudre vers Codex lorsque le
plugin fourni est disponible. Ajoutez une politique de runtime explicite pour définir une règle
écrite de fermeture en cas d’échec :

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

Lorsque Codex est imposé, OpenClaw échoue rapidement si la route effective n’est pas déclarée
compatible avec Codex, si le plugin est désactivé, si l’app-server est trop ancien ou si
l’app-server ne peut pas démarrer.

## Politique de l’app-server

Par défaut, le plugin démarre localement le binaire Codex géré par OpenClaw avec
un transport stdio. Définissez `appServer.command` uniquement pour exécuter intentionnellement
un autre exécutable. Utilisez le transport WebSocket uniquement lorsqu’un app-server est
déjà exécuté ailleurs :

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

Les sessions locales de l’app-server stdio adoptent par défaut la posture de confiance envers
l’opérateur local : `approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Si les exigences Codex locales interdisent cette
posture YOLO implicite, OpenClaw sélectionne à la place les autorisations Guardian permises.
Lorsqu’un bac à sable OpenClaw est actif pour la session, OpenClaw
désactive le mode Code natif de Codex, les serveurs MCP de l’utilisateur et l’exécution de plugins
adossés à des applications pour ce tour, au lieu de s’appuyer sur le bac à sable côté hôte de Codex.
L’accès au shell passe alors par des outils dynamiques adossés au bac à sable OpenClaw, tels que
`sandbox_exec` et `sandbox_process`, lorsque les outils normaux d’exécution/de processus
sont disponibles.

Utilisez le mode d’exécution OpenClaw normalisé pour la revue automatique native de Codex avant
les sorties du bac à sable ou les autorisations supplémentaires :

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

Pour les sessions de l’app-server Codex, `tools.exec.mode: "auto"` correspond aux approbations
examinées par Codex Guardian : généralement `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"` lorsque
les exigences locales autorisent ces valeurs. Dans `tools.exec.mode: "auto"`,
OpenClaw ne conserve pas les remplacements Codex non sécurisés hérités `approvalPolicy: "never"` ou
`sandbox: "danger-full-access"` ; utilisez `tools.exec.mode: "full"` pour
adopter intentionnellement une posture Codex sans approbation. Le préréglage hérité
`plugins.entries.codex.config.appServer.mode: "guardian"` fonctionne toujours,
mais `tools.exec.mode: "auto"` est la surface OpenClaw normalisée.

Pour une comparaison au niveau des modes avec les approbations d’exécution de l’hôte et les
autorisations ACPX, consultez [Modes d’autorisation](/fr/tools/permission-modes). Pour chaque
champ de l’app-server, l’ordre d’authentification, l’isolation de l’environnement et le comportement
des délais d’expiration, consultez la [Référence du harnais Codex](/fr/plugins/codex-harness-reference).

## Commandes et diagnostics

Le plugin `codex` enregistre `/codex` comme commande oblique sur tout canal prenant
en charge les commandes textuelles OpenClaw.

L’exécution et le contrôle natifs nécessitent un propriétaire ou un client Gateway
`operator.admin` : liaison ou reprise de fils, envoi ou arrêt de tours,
modification du modèle, du mode rapide ou de l’état des autorisations, compaction ou revue, et
détachement d’une liaison. Les autres expéditeurs autorisés conservent des commandes en lecture seule
pour l’état, l’aide, le compte, les modèles, les fils, les serveurs MCP, les Skills et l’inspection
des liaisons.

Formes courantes :

- `/codex status` vérifie la connectivité de l’app-server, les modèles, le compte, les limites
  de débit, les serveurs MCP et les Skills.
- `/codex models` répertorie les modèles actifs de l’app-server Codex.
- `/codex threads [filter]` répertorie les fils récents de l’app-server Codex.
- `/codex resume <thread-id>` attache la session OpenClaw actuelle à un
  fil Codex existant.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  attache la conversation actuelle.
- `/codex detach` (ou `/codex unbind`) détache la liaison actuelle.
- `/codex binding` décrit la liaison actuelle.
- `/codex stop` arrête le tour actif ; `/codex steer <text>` l’oriente.
- `/codex model <model>`, `/codex fast [on|off|status]` et
  `/codex permissions [default|yolo|status]` modifient l’état propre à la conversation.
- `/codex compact` demande à l’app-server Codex de compacter le fil attaché.
- `/codex review` démarre la revue native Codex pour le fil attaché.
- `/codex diagnostics [note]` demande confirmation avant d’envoyer des commentaires Codex pour le
  fil attaché.
- `/codex account` affiche l’état du compte et des limites de débit.
- `/codex mcp` répertorie l’état des serveurs MCP de l’app-server Codex.
- `/codex skills` répertorie les Skills de l’app-server Codex.
- `/codex plugins list`, `/codex plugins enable <name>` et
  `/codex plugins disable <name>` gèrent les plugins Codex natifs configurés.
- `/codex computer-use [status|install]` gère l’utilisation de l’ordinateur par Codex.
- `/codex help` répertorie l’arborescence complète des commandes.

Pour la plupart des demandes d’assistance, commencez par `/diagnostics [note]` dans la
conversation où le bug s’est produit. Cela crée un rapport de diagnostic
du Gateway et, pour les sessions du harnais Codex, demande l’autorisation d’envoyer
le paquet de retours Codex pertinent. Consultez
[Exportation des diagnostics](/fr/gateway/diagnostics) pour le modèle de confidentialité et le comportement
dans les discussions de groupe. Utilisez `/codex diagnostics [note]` uniquement lorsque vous souhaitez
spécifiquement téléverser les retours Codex pour le fil actuellement associé, sans
le paquet de diagnostic complet du Gateway.

### Inspecter les fils Codex localement

Le moyen le plus rapide d’inspecter une exécution Codex défectueuse consiste souvent à ouvrir directement
le fil Codex natif :

```bash
codex resume <thread-id>
```

Obtenez l’identifiant du fil dans la réponse `/diagnostics` terminée, `/codex binding`,
ou `/codex threads [filter]`.

Pour les mécanismes de téléversement et les limites des diagnostics au niveau de l’environnement d’exécution, consultez
[Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime#codex-feedback-upload).

### Ordre d’authentification

Dans le répertoire personnel par défaut propre à chaque agent, l’authentification est sélectionnée dans cet ordre :

1. Profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Exécutez `openclaw doctor --fix` pour migrer les anciens
   identifiants de profils d’authentification Codex hérités et l’ancien ordre d’authentification Codex.
2. Le compte existant du serveur d’application dans le répertoire personnel Codex de cet agent.
3. Pour les lancements locaux du serveur d’application via stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’application n’est présent et qu’une authentification OpenAI
   reste requise.

Lorsque OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il
supprime `CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex
lancé. Ainsi, les clés d’API au niveau du Gateway restent disponibles pour les plongements ou
les modèles OpenAI directs, sans que les tours du serveur d’application Codex natif soient
accidentellement facturés via l’API. Les profils explicites de clé d’API Codex et le
repli local sur une clé d’environnement via stdio utilisent la connexion du serveur d’application au lieu de
l’environnement hérité du processus enfant. Les connexions au serveur d’application par WebSocket ne reçoivent pas
le repli sur une clé d’API d’environnement du Gateway ; utilisez un profil d’authentification explicite ou le
compte propre au serveur d’application distant.

Si un profil d’abonnement atteint une limite d’utilisation de Codex, OpenClaw enregistre
l’heure de réinitialisation lorsque Codex en indique une et essaie le profil d’authentification ordonné suivant
pour la même exécution Codex. Une fois l’heure de réinitialisation passée, le profil
d’abonnement redevient admissible sans modifier le modèle `openai/gpt-*`
sélectionné ni l’environnement d’exécution Codex.

Lorsque des plugins Codex natifs sont configurés, OpenClaw installe ou actualise
ces plugins via le serveur d’application connecté avant d’exposer au fil Codex
les applications appartenant aux plugins. `app/list` reste la source de vérité pour les
identifiants d’application, l’accessibilité et les métadonnées, mais OpenClaw contrôle la décision
d’activation propre à chaque fil : si la politique autorise une application accessible répertoriée, OpenClaw
envoie `thread/start.config.apps[appId].enabled = true` même lorsque `app/list`
indique actuellement que cette application est désactivée. Ce chemin n’invente pas l’installation
d’applications pour des identifiants inconnus ; OpenClaw active uniquement les plugins de la place de marché
avec `plugin/install`, puis actualise l’inventaire.

### Isolation de l’environnement

Pour les lancements locaux du serveur d’application via stdio, OpenClaw définit `CODEX_HOME` sur un
répertoire propre à chaque agent afin que la configuration Codex, les fichiers d’authentification et de compte, le cache et les données
des plugins ainsi que l’état natif des fils ne lisent ni n’écrivent par défaut dans le
répertoire personnel `~/.codex` de l’opérateur. OpenClaw conserve la valeur `HOME` normale du processus ;
les sous-processus exécutés par Codex peuvent toujours trouver la configuration et les jetons du répertoire personnel de l’utilisateur, et
Codex peut découvrir les entrées partagées `$HOME/.agents/skills` et
`$HOME/.agents/plugins/marketplace.json`. Avec
`appServer.homeScope: "user"`, OpenClaw utilise à la place le répertoire personnel Codex natif
de l’utilisateur et son compte existant, sans injecter de profil d’authentification OpenClaw.

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
lancé. OpenClaw supprime `CODEX_HOME` et `HOME` de cette liste pendant
la normalisation du lancement local : `CODEX_HOME` reste dirigé vers la portée
d’agent ou d’utilisateur sélectionnée, et `HOME` reste hérité afin que les sous-processus puissent utiliser
l’état normal du répertoire personnel de l’utilisateur.

### Outils dynamiques et recherche sur le Web

Les outils dynamiques de Codex utilisent par défaut le chargement `searchable`. En règle générale, OpenClaw
n’expose pas les outils dynamiques qui font double emploi avec les opérations natives de Codex sur l’espace de travail :
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` et `tool_search_code`. La plupart
des autres outils d’intégration OpenClaw, tels que la messagerie, les médias, Cron,
le navigateur, les nœuds, le Gateway et `heartbeat_respond`, sont accessibles via
la recherche d’outils Codex sous l’espace de noms `openclaw`, ce qui réduit le contexte initial
du modèle. Le repli sur l’interpréteur de commandes pour les tours restreints constitue l’exception pour
`exec` et `process` lorsqu’une liste d’autorisation finie désactive le Code Mode natif ;
les listes d’autorisation de l’environnement d’exécution et `codexDynamicToolsExclude` continuent de s’appliquer.

Les outils marqués `catalogMode: "direct-only"`, notamment l’outil OpenClaw `computer`,
utilisent à la place l’espace de noms `openclaw_direct`. Codex traite cet espace de noms
comme `DirectModelOnly`, de sorte que ces outils restent directement visibles par le modèle dans les fils
normaux et limités au mode code, plutôt que de passer par des appels `tools.*` imbriqués
du Code Mode.

La recherche sur le Web utilise par défaut l’outil hébergé `web_search` de Codex lorsque la recherche est
activée et qu’aucun fournisseur géré n’est sélectionné. La recherche hébergée native et
l’outil dynamique géré `web_search` d’OpenClaw s’excluent mutuellement afin que
la recherche gérée ne puisse pas contourner les restrictions natives de domaine. OpenClaw utilise
l’outil géré lorsque la recherche hébergée est indisponible, explicitement désactivée ou
remplacée par un fournisseur géré sélectionné. OpenClaw maintient l’extension autonome
`web.run` de Codex désactivée, car le trafic de production du serveur d’application rejette
son espace de noms `web` défini par l’utilisateur. `tools.web.search.enabled: false`
désactive les deux chemins, tout comme les exécutions réservées au LLM avec les outils désactivés. Codex traite
`"cached"` comme une préférence et la résout en accès externe actif pour
les tours non restreints du serveur d’application. Le repli géré automatique échoue de manière fermée lorsque
des `allowedDomains` natifs sont définis, afin que la liste d’autorisation ne puisse pas être contournée.
Les modifications persistantes de la politique de recherche effective font pivoter le fil Codex associé
avant le tour suivant ; les restrictions temporaires propres à un tour utilisent un fil
restreint temporaire et conservent l’association existante pour une reprise ultérieure.

`sessions_yield` et les réponses de source limitées aux outils de messagerie restent directes, car
il s’agit de contrats de contrôle des tours. `sessions_spawn` reste consultable afin que
le `spawn_agent` natif de Codex demeure la principale surface de sous-agent Codex,
tandis qu’une délégation explicite via OpenClaw ou ACP reste disponible dans
l’espace de noms d’outils dynamiques `openclaw`. Les instructions de collaboration du Heartbeat
indiquent à Codex de rechercher `heartbeat_respond` avant de terminer un tour de Heartbeat
lorsque l’outil n’est pas déjà chargé.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un serveur d’application
Codex personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du
débogage de la charge utile complète des outils.

### Champs de configuration

Champs de premier niveau pris en charge pour le plugin Codex :

| Champ                      | Valeur par défaut | Signification                                                                            |
| -------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial des outils Codex. |
| `codexDynamicToolsExclude` | `[]`           | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours du serveur d’application Codex.              |
| `codexPlugins`             | désactivé         | Prise en charge native des plugins et applications Codex pour les plugins sélectionnés migrés et installés depuis les sources. |
| `sessionCatalog`           | activé            | Découverte dans la barre latérale des sessions Codex natives sur ce Gateway et les nœuds associés admissibles.     |
| `supervision`              | désactivé         | Politique de transcription et de contrôle d’écriture des sessions natives destinée aux agents.                    |

Champs `appServer` pris en charge :

| Champ                                         | Valeur par défaut                                     | Signification                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; la valeur explicite `"unix"` se connecte au socket de contrôle local ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isole l’état ordinaire du harnais pour chaque agent OpenClaw. `"user"` constitue une activation explicite qui partage le `$CODEX_HOME` ou le `~/.codex` natif, utilise l’authentification native et active la gestion des fils de discussion réservée au propriétaire. La portée utilisateur prend en charge le transport stdio local ou Unix. Pour la connexion de supervision distincte, une valeur non définie est résolue en `"user"` pour stdio ou Unix et en `"agent"` pour WebSocket.     |
| `command`                                     | binaire Codex géré                                    | Exécutable pour le transport stdio. Laissez cette valeur non définie pour utiliser le binaire géré ; définissez-la uniquement pour un remplacement explicite.                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | non défini                                             | URL du serveur d’application WebSocket ou URL `unix://`. Un chemin Unix explicitement vide sélectionne le socket de contrôle canonique du répertoire personnel de l’utilisateur.                                                                                                                                                                                                        |
| `authToken`                                   | non défini                                             | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou une SecretInput telle que `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                         |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                          |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité. OpenClaw conserve les valeurs `CODEX_HOME` sélectionnées et `HOME` héritées pour les lancements locaux.                                                                                                                  |
| `codeModeOnly`                                | `false`                                                | Active la surface d’outils de Codex réservée au mode code. Les outils dynamiques ordinaires d’OpenClaw restent disponibles par l’intermédiaire d’appels `tools.*` imbriqués ; les outils `openclaw_direct` restent directement visibles par le modèle.                                                                                                                                      |
| `remoteWorkspaceRoot`                         | non défini                                             | Racine distante de l’espace de travail du serveur d’application Codex. Lorsqu’elle est définie, OpenClaw déduit la racine de l’espace de travail local à partir de l’espace de travail OpenClaw résolu, conserve le suffixe du cwd actuel sous cette racine distante et envoie uniquement le cwd final de l’app-server à Codex. Si le cwd se trouve hors de la racine résolue de l’espace de travail OpenClaw, OpenClaw échoue de manière fermée au lieu d’envoyer un chemin local au Gateway à l’app-server distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration des appels du plan de contrôle de l’app-server.                                                                                                                                                                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre de silence après que Codex a accepté un tour ou après une requête app-server limitée à un tour, pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde d’inactivité de fin et de progression utilisée après un transfert vers un outil, l’achèvement d’un outil natif, une progression brute de l’assistant après un outil, l’achèvement du raisonnement brut ou la progression du raisonnement, pendant qu’OpenClaw attend `turn/completed`. Utilisez-la pour les charges de travail fiables ou lourdes lorsque la synthèse après outil peut légitimement rester silencieuse plus longtemps que le budget de publication finale de l’assistant.                                |
| `mode`                                        | `"yolo"` sauf si les exigences locales de Codex interdisent YOLO | Préréglage pour l’exécution YOLO ou examinée par le gardien. Les exigences stdio locales qui omettent `danger-full-access`, l’approbation `never` ou le réviseur `user` font du gardien la valeur implicite par défaut.                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation du gardien autorisée       | Politique d’approbation native de Codex envoyée au démarrage, à la reprise ou au tour du fil de discussion. Les valeurs par défaut du gardien privilégient `"on-request"` lorsque cela est autorisé.                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` ou un bac à sable du gardien autorisé  | Mode de bac à sable natif de Codex envoyé au démarrage ou à la reprise du fil de discussion. Les valeurs par défaut du gardien privilégient `"workspace-write"` lorsque cela est autorisé, sinon `"read-only"`. Lorsqu’un bac à sable OpenClaw est actif, les tours `danger-full-access` utilisent le `workspace-write` de Codex avec un accès réseau dérivé du paramètre de sortie du bac à sable OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` ou un réviseur du gardien autorisé               | Utilisez `"auto_review"` pour permettre à Codex d’examiner les invites d’approbation natives lorsque cela est autorisé, sinon `guardian_subagent` ou `user`. `guardian_subagent` reste un alias hérité.                                                                                                                                                                                |
| `serviceTier`                                 | non défini                                             | Niveau de service facultatif de l’app-server Codex. `"priority"` active le routage en mode rapide, `"flex"` demande un traitement flexible, `null` efface le remplacement et la valeur héritée `"fast"` est acceptée comme `"priority"`.                                                                                                                |
| `networkProxy`                                | désactivé                                              | Active la mise en réseau du profil d’autorisations Codex pour les commandes de l’app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la choisit avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | Activation en préversion qui enregistre auprès de l’app-server Codex pris en charge un environnement Codex reposant sur le bac à sable OpenClaw, afin que l’exécution native de Codex puisse s’effectuer dans le bac à sable OpenClaw actif.                                                                                                                                                      |

`appServer.networkProxy` est explicite, car cette option modifie le contrat
du bac à sable Codex. Lorsqu’elle est activée, OpenClaw définit également `features.network_proxy.enabled`
et `default_permissions` dans la configuration du fil de discussion Codex afin que le profil
d’autorisations généré puisse démarrer la mise en réseau gérée par Codex. Par défaut, OpenClaw
génère un nom de profil `openclaw-network-<fingerprint>` résistant aux collisions
à partir du corps du profil ; utilisez `profileName` uniquement lorsqu’un nom local stable
est requis.

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
d’autorisations généré : l’application par Codex des règles réseau gérées repose sur une mise en bac à sable
du réseau ; un profil d’accès complet ne protégerait donc pas le trafic sortant.
Les entrées de domaine utilisent `allow` ou `deny` ; les entrées de socket Unix utilisent les valeurs
`allow` ou `none` de Codex.

### Délais d’expiration des appels d’outils dynamiques

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs` : les requêtes Codex `item/tool/call` utilisent par défaut un mécanisme de surveillance OpenClaw de 90
secondes. Un argument positif `timeoutMs` propre à l’appel prolonge ou raccourcit
le budget de cet outil précis, dans la limite de 600000 ms.
L’outil `image_generate` utilise `agents.defaults.imageGenerationModel.timeoutMs`
lorsque l’appel d’outil ne fournit pas son propre délai d’expiration, ou, dans le cas contraire, un délai par défaut de 120 secondes
pour la génération d’images. L’outil de compréhension des médias `image`
utilise `tools.media.image.timeoutSeconds` ou son délai par défaut de 60 secondes pour les médias ; pour
la compréhension d’images, ce délai s’applique à la requête elle-même et n’est pas
réduit par le travail de préparation antérieur. À l’expiration du délai, OpenClaw interrompt le signal
de l’outil lorsque cela est pris en charge et renvoie à Codex une réponse d’échec de l’outil dynamique
afin que le tour puisse continuer plutôt que de laisser la session dans `processing`.
Ce mécanisme de surveillance constitue le budget dynamique externe de `item/tool/call` ; les délais d’expiration
des requêtes propres aux fournisseurs s’exécutent à l’intérieur de cet appel et conservent leur propre sémantique.

Une fois qu’un tour a été accepté par Codex, et après qu’OpenClaw a répondu à une requête
app-server limitée au tour, le harnais attend de Codex qu’il progresse dans le tour en cours
et qu’il termine finalement le tour natif avec `turn/completed`. Si
l’app-server reste silencieux pendant `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
tente au mieux d’interrompre le tour Codex, enregistre un délai d’expiration de diagnostic et
libère la voie de session OpenClaw afin que les messages de discussion suivants ne soient pas
placés en file d’attente derrière un tour natif obsolète. La plupart des notifications non terminales du
même tour désactivent ce court mécanisme de surveillance, car Codex a prouvé que le tour est
toujours actif.

Les transferts d’outils utilisent un budget d’inactivité postérieur à l’outil plus long : après qu’OpenClaw a renvoyé une
réponse `item/tool/call`, après l’achèvement d’éléments d’outils natifs tels que
`commandExecution`, après l’achèvement brut de `custom_tool_call_output`,
et après une progression brute de l’assistant postérieure à l’outil, l’achèvement d’un raisonnement brut
ou la progression d’un raisonnement. Le garde utilise
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré et
cinq minutes par défaut dans le cas contraire ; ce même budget prolonge également le
mécanisme de surveillance de la progression pendant la fenêtre de synthèse silencieuse avant que Codex n’émette
l’événement suivant du tour en cours. Les notifications globales de l’app-server, telles que
les mises à jour des limites de débit, ne réinitialisent pas la progression liée à l’inactivité du tour. Les achèvements de raisonnement,
les achèvements `agentMessage` de commentaire et la progression brute du raisonnement ou de
l’assistant antérieure à l’outil peuvent être suivis d’une réponse finale automatique ; ils utilisent donc
le garde de réponse postérieur à la progression au lieu de libérer immédiatement la voie de session.

Seuls les éléments `agentMessage` finaux/sans commentaire achevés et les achèvements bruts de
l’assistant antérieurs à l’outil activent la libération sur sortie de l’assistant : si Codex reste ensuite
silencieux sans `turn/completed`, OpenClaw tente au mieux d’interrompre le tour natif
et libère la voie de session. Si un autre dispositif de surveillance de tour remporte cette course à la libération,
OpenClaw accepte tout de même l’élément final achevé de l’assistant dès qu’aucune
requête native, aucun élément ni aucun achèvement d’outil dynamique ne reste actif et que la
libération sur sortie de l’assistant appartient toujours au dernier élément achevé, sans
achèvement d’élément ultérieur. Cela peut préserver la réponse finale après
l’achèvement du travail des outils sans réexécuter le tour. Les deltas partiels de l’assistant,
les réponses antérieures obsolètes et les achèvements ultérieurs vides ne sont pas admissibles.

Les échecs de l’app-server stdio pouvant être réexécutés sans risque, notamment les
délais d’inactivité à l’achèvement du tour sans preuve liée à l’assistant, à un outil, à un élément actif
ou à un effet de bord, font l’objet d’une nouvelle tentative unique auprès d’un nouvel app-server. Les délais d’expiration
non sûrs mettent tout de même hors service le client app-server bloqué et libèrent la
voie de session OpenClaw ; ils effacent également l’association obsolète au thread natif au lieu
de la réexécuter automatiquement. Les délais d’expiration de surveillance de l’achèvement affichent un texte
propre à Codex : les cas pouvant être réexécutés sans risque indiquent que la réponse peut être incomplète,
tandis que les cas non sûrs demandent à l’utilisateur de vérifier l’état actuel avant de réessayer. Les diagnostics
publics de délai d’expiration comprennent des champs structurels tels que la dernière méthode de notification
de l’app-server, l’identifiant/le type/le rôle de l’élément de réponse brute de l’assistant, le nombre
de requêtes et d’éléments actifs ainsi que l’état du dispositif de surveillance activé ; lorsque la dernière notification est un
élément de réponse brute de l’assistant, ils comprennent également un aperçu limité du texte de l’assistant.
Ils ne comprennent ni le prompt brut ni le contenu brut des outils.

### Remplacements par variables d’environnement pour les tests locaux

- `OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
  `appServer.command` n’est pas défini.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez
`plugins.entries.codex.config.appServer.mode: "guardian"` à la place, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration
est préférable pour les déploiements reproductibles, car elle conserve le comportement du Plugin
dans le même fichier contrôlé que le reste de la configuration du harnais Codex.

## Plugins Codex natifs

La prise en charge des plugins Codex natifs utilise les capacités propres aux applications et aux plugins
de l’app-server Codex dans le même thread Codex que le tour du harnais OpenClaw. OpenClaw
ne convertit pas les plugins Codex en outils dynamiques OpenClaw `codex_plugin_*`
synthétiques.

`codexPlugins` affecte uniquement les sessions qui sélectionnent le harnais Codex natif.
Il n’a aucun effet sur les exécutions du harnais intégré, les exécutions normales du fournisseur OpenAI, les associations
de conversations ACP ni les autres harnais.

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

La configuration des applications du thread est calculée lorsqu’OpenClaw établit une session du harnais
Codex ou remplace une association obsolète à un thread Codex ; elle n’est pas recalculée à
chaque tour. Après avoir modifié `codexPlugins`, utilisez `/new`, `/reset` ou redémarrez
le Gateway afin que les futures sessions du harnais Codex démarrent avec l’ensemble d’applications
mis à jour.

Pour l’admissibilité à la migration, l’inventaire des applications, la politique relative aux actions destructrices,
les sollicitations et les diagnostics des plugins natifs, consultez
[Plugins Codex natifs](/fr/plugins/codex-native-plugins).

L’accès aux applications et aux plugins côté OpenAI est contrôlé par le compte Codex
connecté et, pour les espaces de travail Business et Enterprise/Edu, par les contrôles des applications
de l’espace de travail. Consultez
[Utiliser Codex avec votre forfait ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
pour une présentation par OpenAI du compte et des contrôles de l’espace de travail.

## Utilisation de l’ordinateur

L’utilisation de l’ordinateur dispose de son propre guide de configuration :
[Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use).

En bref : OpenClaw n’intègre pas l’application de contrôle du bureau et n’exécute
pas lui-même les actions sur le bureau. Il prépare l’app-server Codex, vérifie que le
serveur MCP `computer-use` est disponible, puis laisse Codex gérer les appels d’outils
MCP natifs pendant les tours en mode Codex.

## Limites de l’environnement d’exécution

Le harnais Codex modifie uniquement l’exécuteur d’agent embarqué de bas niveau.

- Les outils dynamiques OpenClaw sont pris en charge. Codex demande à OpenClaw d’exécuter
  ces outils ; OpenClaw reste donc dans le chemin d’exécution.
- Le shell, les correctifs, le MCP et les outils d’applications natifs de Codex appartiennent à Codex.
  OpenClaw peut observer ou bloquer certains événements natifs au moyen du
  relais pris en charge, mais il ne réécrit pas les arguments des outils natifs.
- Codex gère la Compaction native. OpenClaw conserve un miroir de la transcription pour
  l’historique du canal, la recherche, `/new`, `/reset`, ainsi que les futurs changements de modèle ou de harnais,
  mais ne remplace pas la Compaction Codex par un outil de synthèse OpenClaw ou
  du moteur de contexte.
- La génération de médias, la compréhension des médias, la synthèse vocale, les approbations et la sortie des outils
  de messagerie continuent de passer par les paramètres correspondants de fournisseur/modèle OpenClaw.
- `tool_result_persist` s’applique aux résultats des outils de transcription appartenant à OpenClaw,
  et non aux enregistrements de résultats des outils natifs de Codex.

Pour les couches de hooks, les surfaces V1 prises en charge, la gestion des autorisations natives, l’orientation
des files d’attente, les mécanismes d’envoi des retours Codex et les détails de la Compaction, consultez
[Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime).

## Dépannage

**Codex n’apparaît pas comme un fournisseur `/model` normal :** ce comportement est attendu pour les nouvelles
configurations. Sélectionnez un modèle `openai/gpt-*`, activez
`plugins.entries.codex.enabled` et vérifiez si `plugins.allow` exclut
`codex`.

**OpenClaw utilise le harnais intégré au lieu de Codex :** vérifiez que la route effective
est exactement une route HTTPS officielle Platform Responses ou ChatGPT Responses,
qu’elle ne comporte aucun remplacement de requête défini par l’auteur, et que le Plugin Codex est installé et
activé. Le préfixe `openai/gpt-*` seul ne suffit pas. Pour obtenir une preuve stricte pendant
les tests, définissez `agentRuntime.id: "codex"` pour le fournisseur ou le modèle ; l’utilisation forcée de Codex échoue
au lieu de revenir à une solution de repli lorsque la route ou le harnais est incompatible.

**L’environnement d’exécution OpenAI Codex revient au chemin utilisant une clé d’API :** recueillez un extrait expurgé
du Gateway indiquant le modèle, l’environnement d’exécution, le fournisseur sélectionné et
l’échec. Demandez aux collaborateurs concernés d’exécuter cette commande en lecture seule sur leur
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
`No API key`. Une exécution corrigée doit afficher le chemin OAuth OpenAI
au lieu d’un simple échec lié à la clé d’API OpenAI.

**La configuration des références de modèles Codex héritées subsiste :** exécutez `openclaw doctor --fix`.
Doctor réécrit les références de modèles héritées en `openai/*`, supprime les épinglages obsolètes de l’environnement d’exécution
de la session et de l’agent entier, et préserve les remplacements existants des profils d’authentification.

**L’app-server est rejeté :** utilisez la version `0.143.0` ou ultérieure de l’app-server Codex.
Les préversions ou versions assorties d’un suffixe de build de même version, telles que
`0.143.0-alpha.2` ou `0.143.0+custom`, sont rejetées, car OpenClaw teste
la version stable minimale du protocole `0.143.0`.

**`/codex status` ne peut pas se connecter :** vérifiez que le plugin `codex`
est activé, que `plugins.allow` l’inclut lorsqu’une liste d’autorisation est
configurée et que les éventuels `appServer.command`, `url`, `authToken` ou
en-têtes personnalisés sont valides.

**La découverte des modèles est lente :** réduisez
`plugins.entries.codex.config.discovery.timeoutMs` ou désactivez la découverte.
Consultez la [référence du harnais Codex](/fr/plugins/codex-harness-reference#model-discovery).

**Le transport WebSocket échoue immédiatement :** vérifiez `appServer.url`,
`authToken`, les en-têtes et assurez-vous que le serveur d’application distant utilise la même version du
protocole de serveur d’application Codex.

**Les outils de shell natif ou de correctif sont bloqués avec `Native hook relay
unavailable` :** le thread Codex tente toujours d’utiliser un identifiant
de relais de hook natif qui n’est plus enregistré auprès d’OpenClaw. Il s’agit d’un problème de transport
des hooks natifs Codex, et non d’une défaillance du backend ACP, du fournisseur, de GitHub ou d’une commande
shell. Démarrez une nouvelle session dans la conversation concernée avec `/new` ou `/reset`,
puis réessayez une commande sans danger. Si elle fonctionne une fois, mais que l’appel suivant d’un outil natif
échoue à nouveau, considérez `/new` uniquement comme une solution de contournement temporaire : copiez
le prompt dans une nouvelle session après avoir redémarré le serveur d’application Codex ou le
Gateway OpenClaw, afin que les anciens threads soient supprimés et que les enregistrements des hooks natifs
soient recréés.

**Les appels d’outils Codex créent trop de processus de hooks à courte durée de vie :** définissez
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
et redémarrez le Gateway. Cela désactive uniquement le sous-processus Codex `PreToolUse`
utilisé pour la détection des boucles OpenClaw et son marqueur d’absence de politique. Les relais de politique
`before_tool_call` obligatoires et ceux des outils approuvés restent activés.

**Un modèle autre que Codex utilise le harnais intégré :** ce comportement est attendu, sauf si la politique
d’exécution du fournisseur ou du modèle l’achemine vers un autre harnais. Les références simples de fournisseurs autres qu’OpenAI
restent sur le chemin normal de leur fournisseur en mode `auto`.

**Computer Use est installé, mais les outils ne s’exécutent pas :** vérifiez
`/codex computer-use status` depuis une nouvelle session. Si un outil signale
`Native hook relay unavailable`, utilisez la procédure de récupération du relais de hook natif décrite ci-dessus.
Consultez [Computer Use de Codex](/fr/plugins/codex-computer-use#troubleshooting).

## Pages connexes

- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Supervision Codex](/fr/plugins/codex-supervision)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Computer Use de Codex](/fr/plugins/codex-computer-use)
- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Aide sur OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
- [Hooks de Plugin](/fr/plugins/hooks)
- [Exportation des diagnostics](/fr/gateway/diagnostics)
- [État](/fr/cli/status)
- [Tests](/fr/help/testing-live#live-codex-app-server-harness-smoke)
