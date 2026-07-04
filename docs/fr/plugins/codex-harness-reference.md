---
read_when:
    - Vous avez besoin de tous les champs de configuration du harnais Codex
    - Vous modifiez le comportement de transport, d’authentification, de découverte ou de délai d’expiration d’app-server
    - Vous déboguez le démarrage du harness Codex, la découverte de modèles ou l’isolation de l’environnement
summary: Référence de configuration, d’authentification, de découverte et de serveur d’application pour le harnais Codex
title: Référence du harnais Codex
x-i18n:
    generated_at: "2026-07-04T10:39:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Cette référence couvre la configuration détaillée du Plugin `codex`
fourni. Pour la configuration initiale et les décisions de routage, commencez par
[harnais Codex](/fr/plugins/codex-harness).

## Surface de configuration du Plugin

Tous les paramètres du harnais Codex résident sous `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Champs de premier niveau pris en charge :

| Champ                      | Par défaut              | Signification                                                                                                                                       |
| -------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | activé                  | Paramètres de découverte de modèles pour `model/list` de l’app-server Codex.                                                                        |
| `appServer`                | app-server stdio géré   | Paramètres de transport, commande, authentification, approbation, sandbox et délai d’expiration.                                                     |
| `codexDynamicToolsLoading` | `"searchable"`          | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial des outils Codex.                                |
| `codexDynamicToolsExclude` | `[]`                    | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours de l’app-server Codex.                                                        |
| `codexPlugins`             | désactivé               | Prise en charge native des plugins/applications Codex pour les plugins sélectionnés migrés installés depuis les sources. Voir [Plugins Codex natifs](/fr/plugins/codex-native-plugins). |
| `computerUse`              | désactivé               | Configuration de Codex Computer Use. Voir [Codex Computer Use](/fr/plugins/codex-computer-use).                                                        |

## Transport de l’app-server

Par défaut, OpenClaw démarre le binaire Codex géré fourni avec le Plugin
fourni :

```bash
codex app-server --listen stdio://
```

Cela garde la version de l’app-server liée au Plugin `codex` fourni au lieu de
la lier à une éventuelle CLI Codex distincte installée localement. Définissez
`appServer.command` uniquement lorsque vous souhaitez intentionnellement exécuter
un autre exécutable.

Pour un app-server déjà en cours d’exécution, utilisez le transport WebSocket :

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Champs `appServer` pris en charge :

| Champ                                         | Par défaut                                            | Signification                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isole l’état de Codex par agent OpenClaw. `"user"` partage le `$CODEX_HOME` natif ou `~/.codex`, utilise l’authentification native et active la gestion des fils réservée au propriétaire. La portée utilisateur nécessite stdio.                                                                                                                                                                                               |
| `command`                                     | binaire Codex géré                                   | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | non défini                                                  | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | non défini                                                  | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou une SecretInput telle que `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | non défini                                                  | Racine distante de l’espace de travail app-server Codex. Lorsqu’elle est définie, OpenClaw déduit la racine locale de l’espace de travail depuis l’espace de travail OpenClaw résolu, conserve le suffixe cwd actuel sous cette racine distante et n’envoie que le cwd app-server final à Codex. Si le cwd se trouve hors de la racine de l’espace de travail OpenClaw résolue, OpenClaw échoue de manière fermée au lieu d’envoyer un chemin local au Gateway à l’app-server distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration pour les appels du plan de contrôle app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre silencieuse après l’acceptation d’un tour par Codex ou après une requête app-server limitée au tour pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde d’inactivité de complétion et de progression utilisée après un transfert d’outil, une complétion d’outil natif, une progression brute de l’assistant après outil, une complétion de raisonnement brut ou une progression de raisonnement pendant qu’OpenClaw attend `turn/completed`. Utilisez-la pour les charges de travail fiables ou lourdes où la synthèse après outil peut légitimement rester silencieuse plus longtemps que le budget final de publication de l’assistant.                                |
| `mode`                                        | `"yolo"` sauf si les exigences Codex locales interdisent YOLO | Préréglage pour une exécution YOLO ou revue par guardian.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` ou une stratégie d’approbation guardian autorisée       | Stratégie d’approbation Codex native envoyée au démarrage du fil, à la reprise et au tour.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou un sandbox guardian autorisé  | Mode sandbox Codex natif envoyé au démarrage et à la reprise du fil. Les sandboxes OpenClaw actifs restreignent les tours `danger-full-access` à Codex `workspace-write` ; l’indicateur réseau du tour suit l’egress du sandbox OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` ou un réviseur guardian autorisé               | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives lorsque c’est autorisé.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | répertoire du processus actuel                              | Espace de travail utilisé par `/codex bind` lorsque `--cwd` est omis.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | non défini                                                  | Niveau de service app-server Codex facultatif. `"priority"` active le routage en mode rapide, `"flex"` demande un traitement flex et `null` efface le remplacement. L’ancien `"fast"` est accepté comme `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | désactivé                                               | Active l’utilisation du réseau par profil de permissions Codex pour les commandes app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la sélectionne avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Option d’aperçu qui enregistre auprès de Codex app-server 0.132.0 ou plus récent un environnement Codex adossé au sandbox OpenClaw, afin que l’exécution Codex native puisse s’exécuter dans le sandbox OpenClaw actif.                                                                                                                                                                                                         |

`appServer.networkProxy` est explicite parce qu’il modifie le contrat de sandbox
Codex. Lorsqu’il est activé, OpenClaw définit également `features.network_proxy.enabled` et
`default_permissions` dans la configuration du fil Codex afin que le profil de permissions
généré puisse démarrer le réseau géré par Codex. Par défaut, OpenClaw génère un
nom de profil `openclaw-network-<fingerprint>` résistant aux collisions à partir du
corps du profil ; utilisez `profileName` uniquement lorsqu’un nom local stable est requis.

```js
export default {
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
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Si le runtime normal du serveur d’application devait être `danger-full-access`, l’activation de
`networkProxy` utilise un accès au système de fichiers de type espace de travail pour le profil
d’autorisations généré. L’application réseau gérée par Codex est une mise en réseau en bac à sable,
donc un profil à accès complet ne protégerait pas le trafic sortant.

Le Plugin bloque les handshakes de serveur d’application anciens ou sans version. Le serveur d’application Codex
doit déclarer la version stable `0.125.0` ou une version plus récente.

OpenClaw traite les URL WebSocket de serveur d’application hors loopback comme distantes et exige
une authentification WebSocket portant une identité via `appServer.authToken` ou un en-tête
`Authorization`. `appServer.authToken` et chaque valeur `appServer.headers.*`
peuvent être un SecretInput ; le runtime des secrets résout les SecretRefs et les raccourcis d’environnement
avant qu’OpenClaw ne construise les options de démarrage du serveur d’application, et les SecretRefs
structurés non résolus échouent avant l’envoi de tout jeton ou en-tête. Lorsque des Plugins Codex
natifs sont configurés, OpenClaw utilise le plan de contrôle des Plugins du serveur d’application connecté
pour installer ou actualiser ces Plugins, puis actualise l’inventaire des applications afin que les
applications détenues par les Plugins soient visibles pour le thread Codex. `app/list` reste la
source faisant autorité pour l’inventaire et les métadonnées, mais la politique OpenClaw décide si
`thread/start` envoie `config.apps[appId].enabled = true` pour une application accessible listée,
même si Codex la marque actuellement comme désactivée. Les identifiants d’application inconnus ou manquants
restent en échec fermé ; ce chemin active uniquement les Plugins de marketplace via `plugin/install`
et actualise l’inventaire. Ne connectez OpenClaw qu’à des serveurs d’application distants auxquels vous
faites confiance pour accepter les installations de Plugins gérées par OpenClaw et les actualisations
d’inventaire d’applications.

## Modes d’approbation et de bac à sable

Les sessions de serveur d’application stdio locales utilisent par défaut le mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Cette posture d’opérateur local de confiance permet
aux tours OpenClaw sans surveillance et aux Heartbeats de progresser sans invites d’approbation
natives auxquelles personne n’est présent pour répondre.

Si le fichier local d’exigences système de Codex interdit les valeurs implicites YOLO d’approbation,
de réviseur ou de bac à sable, OpenClaw traite à la place la valeur implicite par défaut comme guardian
et sélectionne les autorisations guardian autorisées. `tools.exec.mode: "auto"`
force également les approbations Codex révisées par guardian et ne conserve pas les anciennes dérogations
non sûres `approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ;
définissez `tools.exec.mode: "full"` pour une posture intentionnelle sans approbation.
Les entrées
`[[remote_sandbox_config]]` correspondant au nom d’hôte dans le même fichier d’exigences sont respectées
pour décider de la valeur par défaut du bac à sable.

Définissez `appServer.mode: "guardian"` pour des approbations Codex révisées par guardian :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"` lorsque ces
valeurs sont autorisées. Les champs de politique individuels remplacent `mode`. L’ancienne
valeur de réviseur `guardian_subagent` est encore acceptée comme alias de compatibilité,
mais les nouvelles configurations doivent utiliser `auto_review`.

Lorsqu’un bac à sable OpenClaw est actif, le processus local de serveur d’application Codex
s’exécute toujours sur l’hôte Gateway. OpenClaw désactive donc le Code Mode natif de Codex,
les serveurs MCP utilisateur et l’exécution de Plugins adossée aux applications pour ce tour,
au lieu de considérer le bac à sable côté hôte de Codex comme équivalent au backend de bac à sable
OpenClaw. L’accès shell est exposé via des outils dynamiques adossés au bac à sable OpenClaw
comme `sandbox_exec` et `sandbox_process` lorsque les outils exec/process normaux
sont disponibles.

Sur les hôtes Ubuntu/AppArmor, Codex bwrap peut échouer sous `workspace-write` avant
le démarrage de la commande shell lorsque vous exécutez intentionnellement le mode Codex natif
`workspace-write` sans bac à sable OpenClaw actif. Si vous voyez
`bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, exécutez
`openclaw doctor` et corrigez la politique d’espaces de noms hôte signalée pour l’utilisateur
du service OpenClaw plutôt que d’accorder des privilèges plus larges au conteneur Docker. Préférez
un profil AppArmor ciblé pour le processus de service ; le repli
`kernel.apparmor_restrict_unprivileged_userns=0` s’applique à tout l’hôte et comporte
des compromis de sécurité.

## Exécution native en bac à sable

La valeur par défaut stable est l’échec fermé : un bac à sable OpenClaw actif désactive les surfaces
d’exécution native Codex qui s’exécuteraient autrement depuis l’hôte du serveur d’application Codex.
Utilisez `appServer.experimental.sandboxExecServer: true` uniquement lorsque vous voulez
essayer la prise en charge des environnements distants de Codex avec le backend de bac à sable d’OpenClaw.
Ce chemin d’aperçu exige Codex app-server 0.132.0 ou plus récent.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Lorsque l’indicateur est activé et que la session OpenClaw actuelle est en bac à sable, OpenClaw
démarre un serveur exec local loopback adossé au bac à sable actif, l’enregistre
auprès du serveur d’application Codex, puis démarre le thread et le tour Codex avec cet
environnement détenu par OpenClaw. Si le serveur d’application ne peut pas enregistrer l’environnement,
l’exécution échoue en mode fermé au lieu de revenir silencieusement à une exécution sur l’hôte.

Ce chemin d’aperçu est uniquement local. Un serveur d’application WebSocket distant ne peut pas atteindre le
serveur exec loopback sauf s’il s’exécute sur le même hôte, donc OpenClaw rejette
cette combinaison.

## Authentification et isolation de l’environnement

Dans le répertoire personnel par agent par défaut, l’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification OpenClaw Codex explicite pour l’agent.
2. Le compte existant du serveur d’application dans le répertoire personnel Codex de cet agent.
3. Pour les lancements de serveur d’application stdio locaux uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’application n’est présent et que l’authentification OpenAI
   reste nécessaire.

Lorsqu’OpenClaw voit un profil d’authentification Codex de type abonnement ChatGPT, il supprime
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex généré. Cela
maintient les clés API de niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans que les tours natifs du serveur d’application Codex soient facturés via l’API par accident.

Les profils de clé API Codex explicites et le repli par clé d’environnement stdio local utilisent la connexion
au serveur d’application au lieu d’un environnement hérité du processus enfant. Les connexions WebSocket
au serveur d’application ne reçoivent pas le repli de clé API d’environnement Gateway ; utilisez un profil
d’authentification explicite ou le propre compte du serveur d’application distant.

Les lancements de serveur d’application stdio héritent par défaut de l’environnement de processus d’OpenClaw.
OpenClaw possède le pont de compte du serveur d’application Codex et définit `CODEX_HOME` sur un
répertoire par agent sous l’état OpenClaw de cet agent. Cela maintient la configuration Codex,
les comptes, le cache/les données de Plugins et l’état des threads limités à l’agent OpenClaw
au lieu de les faire fuir depuis le répertoire personnel `~/.codex` de l’opérateur.

Définissez `appServer.homeScope: "user"` pour partager l’état Codex natif avec Codex
Desktop et la CLI. Ce mode uniquement stdio local utilise `$CODEX_HOME` lorsqu’il est défini et
`~/.codex` sinon, y compris l’authentification native, la configuration, les Plugins et les threads.
OpenClaw ignore son pont de profil d’authentification pour le serveur d’application. Les tours de propriétaire
vérifiés peuvent utiliser `codex_threads` pour lister, rechercher, lire, forker, renommer, archiver et restaurer
ces threads. Forkez un thread avant de le poursuivre dans OpenClaw ; les processus Codex indépendants
ne coordonnent pas les rédacteurs concurrents pour le même thread.

OpenClaw ne réécrit pas `HOME` pour les lancements locaux normaux de serveur d’application. Les sous-processus
exécutés par Codex comme `openclaw`, `gh`, `git`, les CLI cloud et les commandes shell voient
le répertoire personnel normal du processus et peuvent trouver la configuration et les jetons du répertoire
utilisateur. Codex peut aussi découvrir `$HOME/.agents/skills` et `$HOME/.agents/plugins/marketplace.json` ;
cette découverte `.agents` est intentionnellement partagée avec le répertoire personnel de l’opérateur et est
séparée de l’état `~/.codex` isolé.

Dans la portée agent par défaut, les Plugins OpenClaw et les instantanés de Skills OpenClaw continuent
de passer par le registre de Plugins et le chargeur de Skills propres à OpenClaw ; les ressources personnelles Codex
`~/.codex` ne le font pas. Si vous avez des Skills ou Plugins Codex CLI utiles depuis un
répertoire personnel Codex qui doivent faire partie d’un agent OpenClaw isolé, inventoriez-les
explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un déploiement nécessite une isolation d’environnement supplémentaire, ajoutez ces variables à
`appServer.clearEnv` :

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

`appServer.clearEnv` n’affecte que le processus enfant de serveur d’application Codex généré.
OpenClaw supprime `CODEX_HOME` et `HOME` de cette liste pendant la normalisation du lancement local :
`CODEX_HOME` reste pointé vers la portée agent ou utilisateur sélectionnée,
et `HOME` reste hérité afin que les sous-processus puissent utiliser l’état normal du répertoire utilisateur.

## Outils dynamiques

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`. OpenClaw n’expose pas
les outils dynamiques qui dupliquent les opérations d’espace de travail natives de Codex :

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

La plupart des autres outils d’intégration OpenClaw, comme la messagerie, les médias, Cron,
le navigateur, les nœuds, Gateway, `heartbeat_respond` et `web_search`, sont disponibles
via la recherche d’outils Codex sous l’espace de noms `openclaw`. Cela réduit le contexte initial
du modèle. `sessions_yield` et les réponses sources limitées aux outils de message
restent directs parce qu’il s’agit de contrats de contrôle de tour. `sessions_spawn` reste
recherchable afin que le `spawn_agent` natif de Codex reste la principale surface de sous-agent
Codex, tandis que la délégation explicite OpenClaw ou ACP reste disponible via
l’espace de noms d’outils dynamiques `openclaw`.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un serveur d’application Codex
personnalisé qui ne peut pas rechercher les outils dynamiques différés ou lors du débogage de la charge utile complète
des outils.

## Délais d’expiration

Les appels d’outils dynamiques détenus par OpenClaw sont bornés indépendamment de
`appServer.requestTimeoutMs`. Chaque requête Codex `item/tool/call` utilise le premier
délai disponible dans cet ordre :

- Un argument `timeoutMs` positif propre à l’appel.
- Pour `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Pour `image_generate` sans délai configuré, la valeur par défaut de génération d’images de 120 secondes.
- Pour l’outil `image` de compréhension des médias, `tools.media.image.timeoutSeconds`
  converti en millisecondes, ou la valeur par défaut média de 60 secondes. Pour la compréhension
  d’images, cela s’applique à la requête elle-même et n’est pas réduit par
  le travail de préparation antérieur.
- La valeur par défaut de 90 secondes pour les outils dynamiques.

Ce watchdog est le budget externe dynamique de `item/tool/call`. Les délais de requête
propres au fournisseur s’exécutent à l’intérieur de cet appel et conservent leur propre sémantique de délai.
Les budgets des outils dynamiques sont plafonnés à 600000 ms. En cas d’expiration, OpenClaw abandonne le
signal de l’outil lorsque c’est pris en charge et renvoie une réponse d’outil dynamique échouée à Codex
afin que le tour puisse continuer au lieu de laisser la session en `processing`.

Après que Codex accepte un tour, et après qu’OpenClaw répond à une requête de serveur d’application
limitée au tour, le harnais attend de Codex qu’il progresse sur le tour actuel et
termine finalement le tour natif avec `turn/completed`. Si le serveur d’application reste
silencieux pendant `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrompt au mieux
le tour Codex, enregistre un délai d’expiration de diagnostic et libère la voie de session
OpenClaw afin que les messages de discussion suivants ne soient pas mis en file derrière un tour
natif obsolète.

La plupart des notifications non terminales pour le même tour désarment ce court chien de garde
car Codex a prouvé que le tour est encore actif. Les transferts d’outils utilisent un budget
d’inactivité post-outil plus long : après qu’OpenClaw renvoie une réponse `item/tool/call`, après
l’achèvement d’éléments d’outils natifs comme `commandExecution`, après les achèvements bruts
`custom_tool_call_output`, et après la progression brute post-outil de l’assistant,
les achèvements de raisonnement bruts ou la progression du raisonnement. Le garde utilise
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré et
utilise sinon cinq minutes par défaut. Ce même budget post-outil prolonge aussi le
chien de garde de progression pour la fenêtre de synthèse silencieuse avant que Codex émette le prochain
événement du tour courant. Les achèvements de raisonnement, les achèvements
`agentMessage` de commentaire, ainsi que la progression brute pré-outil du raisonnement ou de l’assistant peuvent
être suivis d’une réponse finale automatique ; ils utilisent donc le garde de réponse post-progression
au lieu de libérer immédiatement la voie de session. Seuls les éléments `agentMessage`
finaux/non-commentaire terminés et les achèvements bruts pré-outil de l’assistant
arment la libération de sortie de l’assistant : si Codex devient ensuite silencieux sans
`turn/completed`, OpenClaw interrompt au mieux le tour natif et libère
la voie de session. Les échecs rejouables sans risque du serveur d’application stdio, y compris
les délais d’inactivité de complétion de tour sans preuve d’assistant, d’outil, d’élément actif ou
d’effet de bord, sont retentés une fois sur une nouvelle tentative de serveur d’application. Les délais
non sûrs retirent tout de même le client de serveur d’application bloqué et libèrent la voie de session
OpenClaw. Ils effacent aussi la liaison obsolète au thread natif au lieu d’être
rejoués automatiquement. Les délais de surveillance de complétion affichent un texte de délai
propre à Codex : les cas rejouables sans risque indiquent que la réponse peut être incomplète,
tandis que les cas non sûrs demandent à l’utilisateur de vérifier l’état courant avant de réessayer.
Les diagnostics publics de délai incluent des champs structurels comme la dernière méthode de
notification du serveur d’application, l’id/le type/le rôle de l’élément de réponse brute de l’assistant,
les nombres de requêtes/d’éléments actifs et l’état de surveillance armée. Lorsque la dernière notification
est un élément de réponse brute de l’assistant, ils incluent aussi un aperçu borné du texte
de l’assistant. Ils n’incluent pas le prompt brut ni le contenu des outils.

## Découverte des modèles

Par défaut, le Plugin Codex demande au serveur d’application les modèles disponibles. La
disponibilité des modèles appartient au serveur d’application Codex ; la liste peut donc changer quand OpenClaw
met à niveau la version groupée de `@openai/codex` ou quand un déploiement pointe
`appServer.command` vers un autre binaire Codex. La disponibilité peut aussi être
limitée au compte. Utilisez `/codex models` sur un Gateway en cours d’exécution pour voir le catalogue
actif de ce harnais et de ce compte.

Si la découverte échoue ou expire, OpenClaw utilise un catalogue de secours groupé pour :

- GPT-5.5
- GPT-5.4 mini

Le harnais groupé actuel est `@openai/codex` `0.142.4`. Une sonde `model/list`
contre ce serveur d’application groupé dans un espace de travail compatible GPT-5.6 a renvoyé ces
lignes publiques de sélecteur :

| Id de modèle          | Modalités d’entrée | Efforts de raisonnement              |
| --------------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`         | texte, image       | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | texte, image       | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | texte, image       | low, medium, high, xhigh, max        |
| `gpt-5.5`             | texte, image       | low, medium, high, xhigh             |
| `gpt-5.4`             | texte, image       | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | texte, image       | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | texte, image       | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | texte              | low, medium, high, xhigh             |

L’accès à GPT-5.6 est limité au compte pendant l’aperçu limité. `max` est un effort
de raisonnement de modèle. `ultra` est une métadonnée distincte d’orchestration multi-agent Codex,
et non un effort de raisonnement OpenAI standard.

Des modèles masqués peuvent être renvoyés par le catalogue du serveur d’application pour des flux
internes ou spécialisés, mais ils ne constituent pas des choix normaux dans le sélecteur de modèles.

Réglez la découverte sous `plugins.entries.codex.config.discovery` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Désactivez la découverte lorsque vous voulez éviter que le démarrage sonde Codex et utiliser uniquement
le catalogue de secours :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Fichiers d’amorçage de l’espace de travail

Codex gère lui-même `AGENTS.md` via la découverte native des documents de projet. OpenClaw
n’écrit pas de fichiers synthétiques de documents de projet Codex et ne dépend pas des noms
de fichiers de secours Codex pour les fichiers de persona, car les solutions de secours Codex ne s’appliquent que lorsque
`AGENTS.md` est absent.

Pour la parité de l’espace de travail OpenClaw, le harnais Codex résout les autres fichiers
d’amorçage. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` et `USER.md` sont transmis comme
instructions développeur OpenClaw Codex, car ils définissent l’agent actif,
les consignes disponibles pour l’espace de travail et le profil utilisateur. La liste compacte des Skills
OpenClaw est transmise comme instructions développeur de collaboration limitées au tour.
Le contenu de `HEARTBEAT.md` n’est pas injecté ; les tours de heartbeat reçoivent un pointeur
de mode collaboration indiquant de lire le fichier lorsqu’il existe et n’est pas vide. Le contenu de `MEMORY.md`
provenant de l’espace de travail d’agent configuré n’est pas collé dans l’entrée native du tour Codex
lorsque les outils de mémoire sont disponibles pour cet espace de travail ; lorsqu’il existe, le harnais
ajoute un petit pointeur de mémoire d’espace de travail aux instructions développeur de collaboration
limitées au tour, et Codex doit utiliser `memory_search` ou `memory_get` lorsque la mémoire
durable est pertinente. Si les outils sont désactivés, si la recherche mémoire est indisponible ou si
l’espace de travail actif diffère de l’espace de travail mémoire de l’agent, `MEMORY.md` utilise le
chemin normal de contexte de tour borné.
`BOOTSTRAP.md`, lorsqu’il est présent, est transmis comme contexte de référence d’entrée de tour OpenClaw.

## Remplacements d’environnement

Les remplacements d’environnement restent disponibles pour les tests locaux :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
`appServer.command` n’est pas défini.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez
`plugins.entries.codex.config.appServer.mode: "guardian"` à la place, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration est
préférable pour les déploiements reproductibles, car elle garde le comportement du Plugin dans le
même fichier revu que le reste de la configuration du harnais Codex.

## Voir aussi

- [Harnais Codex](/fr/plugins/codex-harness)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Référence de configuration](/fr/gateway/configuration-reference)
