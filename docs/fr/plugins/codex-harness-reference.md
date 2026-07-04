---
read_when:
    - Vous avez besoin de chaque champ de configuration du harnais Codex
    - Vous modifiez le comportement du transport, de l’authentification, de la découverte ou des délais d’expiration d’app-server
    - Vous déboguez le démarrage du harnais Codex, la découverte des modèles ou l’isolation de l’environnement
summary: Référence de configuration, d’authentification, de découverte et de serveur d’application pour le harnais Codex
title: Référence du harnais Codex
x-i18n:
    generated_at: "2026-07-04T20:29:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Cette référence couvre la configuration détaillée du Plugin `codex`
intégré. Pour la configuration initiale et les décisions de routage, commencez par
[harnais Codex](/fr/plugins/codex-harness).

## Surface de configuration du Plugin

Tous les paramètres du harnais Codex se trouvent sous `plugins.entries.codex.config`.

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

| Champ                      | Valeur par défaut        | Signification                                                                                                                            |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | activé                   | Paramètres de découverte des modèles pour `model/list` de l’app-server Codex.                                                            |
| `appServer`                | app-server stdio géré    | Paramètres de transport, commande, authentification, approbation, sandbox et délai d’expiration.                                         |
| `codexDynamicToolsLoading` | `"searchable"`           | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial des outils Codex.                     |
| `codexDynamicToolsExclude` | `[]`                     | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours d’app-server Codex.                                                |
| `codexPlugins`             | désactivé                | Prise en charge native des Plugins/applications Codex pour les plugins sélectionnés installés depuis la source et migrés. Voir [Plugins Codex natifs](/fr/plugins/codex-native-plugins). |
| `computerUse`              | désactivé                | Configuration de Codex Computer Use. Voir [Codex Computer Use](/fr/plugins/codex-computer-use).                                             |

## Transport de l’app-server

Par défaut, OpenClaw démarre le binaire Codex géré livré avec le Plugin
intégré :

```bash
codex app-server --listen stdio://
```

Cela garde la version de l’app-server liée au Plugin `codex` intégré au lieu de
celle d’une CLI Codex distincte qui se trouve installée localement. Définissez
`appServer.command` uniquement lorsque vous souhaitez intentionnellement exécuter un autre
exécutable.

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

| Champ                                         | Par défaut                                             | Signification                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                                                                                                                      |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isole l’état de Codex par agent OpenClaw. `"user"` partage le `$CODEX_HOME` natif ou `~/.codex`, utilise l’authentification native et active la gestion des fils réservée au propriétaire. La portée utilisateur nécessite stdio.                                                                                                                                                    |
| `command`                                     | binaire Codex géré                                    | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré.                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | non défini                                            | URL WebSocket app-server.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | non défini                                            | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou une SecretInput comme `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité.                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | non défini                                            | Racine de l’espace de travail distant de l’app-server Codex. Lorsqu’elle est définie, OpenClaw déduit la racine de l’espace de travail local à partir de l’espace de travail OpenClaw résolu, préserve le suffixe cwd actuel sous cette racine distante et envoie uniquement le cwd app-server final à Codex. Si le cwd se trouve en dehors de la racine de l’espace de travail OpenClaw résolue, OpenClaw échoue de manière fermée au lieu d’envoyer un chemin local au Gateway à l’app-server distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration pour les appels de plan de contrôle app-server.                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre de silence après que Codex a accepté un tour ou après une requête app-server limitée au tour pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde d’inactivité de complétion et de progression utilisée après un transfert d’outil, une complétion d’outil natif, une progression brute de l’assistant après outil, une complétion de raisonnement brut ou une progression de raisonnement pendant qu’OpenClaw attend `turn/completed`. Utilisez ce paramètre pour les charges de travail fiables ou lourdes où la synthèse après outil peut légitimement rester silencieuse plus longtemps que le budget final de publication de l’assistant. |
| `mode`                                        | `"yolo"` sauf si les exigences Codex locales interdisent YOLO | Préréglage pour une exécution YOLO ou revue par le gardien.                                                                                                                                                                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation de gardien autorisée | Politique d’approbation Codex native envoyée au démarrage du fil, à la reprise et au tour.                                                                                                                                                                                                                                                                                                      |
| `sandbox`                                     | `"danger-full-access"` ou un sandbox de gardien autorisé | Mode sandbox Codex natif envoyé au démarrage et à la reprise du fil. Les sandboxes OpenClaw actifs restreignent les tours `danger-full-access` à Codex `workspace-write` ; l’indicateur réseau du tour suit la sortie du sandbox OpenClaw.                                                                                                                                                     |
| `approvalsReviewer`                           | `"user"` ou un réviseur de gardien autorisé            | Utilisez `"auto_review"` pour laisser Codex examiner les invites d’approbation natives lorsque cela est autorisé.                                                                                                                                                                                                                                                                               |
| `defaultWorkspaceDir`                         | répertoire du processus actuel                         | Espace de travail utilisé par `/codex bind` lorsque `--cwd` est omis.                                                                                                                                                                                                                                                                                                                           |
| `serviceTier`                                 | non défini                                            | Niveau de service app-server Codex facultatif. `"priority"` active le routage en mode rapide, `"flex"` demande un traitement flex, et `null` efface le remplacement. L’ancien `"fast"` est accepté comme `"priority"`.                                                                                                                                                                          |
| `networkProxy`                                | désactivé                                             | Opte pour le réseau de profil d’autorisations Codex pour les commandes app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la sélectionne avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                                | Option d’aperçu qui enregistre un environnement Codex adossé au sandbox OpenClaw auprès de Codex app-server 0.132.0 ou plus récent afin que l’exécution Codex native puisse s’exécuter dans le sandbox OpenClaw actif.                                                                                                                                                                          |

`appServer.networkProxy` est explicite parce qu’il modifie le contrat de sandbox
Codex. Lorsqu’il est activé, OpenClaw définit aussi `features.network_proxy.enabled` et
`default_permissions` dans la configuration du fil Codex afin que le profil
d’autorisations généré puisse démarrer le réseau géré par Codex. Par défaut, OpenClaw génère un
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

Si le runtime app-server normal devait être `danger-full-access`, l’activation de
`networkProxy` utilise un accès au système de fichiers de type workspace pour le
profil d’autorisations généré. L’application réseau gérée par Codex est un réseau
sandboxé, donc un profil avec accès complet ne protégerait pas le trafic sortant.

Le Plugin bloque les handshakes app-server anciens ou non versionnés. L’app-server
Codex doit déclarer la version stable `0.125.0` ou une version plus récente.

OpenClaw traite les URL WebSocket app-server non loopback comme distantes et exige
une authentification WebSocket porteuse d’identité via `appServer.authToken` ou un
en-tête `Authorization`. `appServer.authToken` et chaque valeur
`appServer.headers.*` peuvent être un SecretInput ; le runtime des secrets résout
les SecretRefs et les raccourcis d’environnement avant qu’OpenClaw ne construise
les options de démarrage app-server, et les SecretRefs structurés non résolus
échouent avant l’envoi de tout jeton ou en-tête. Lorsque des plugins Codex natifs
sont configurés, OpenClaw utilise le plan de contrôle de Plugin de l’app-server
connecté pour installer ou actualiser ces plugins, puis actualise l’inventaire des
apps afin que les apps appartenant aux plugins soient visibles par le fil Codex.
`app/list` reste la source d’inventaire et de métadonnées faisant autorité, mais
la politique OpenClaw décide si `thread/start` envoie
`config.apps[appId].enabled = true` pour une app listée et accessible, même si
Codex la marque actuellement comme désactivée. Les identifiants d’app inconnus ou
manquants restent en échec fermé ; ce chemin active uniquement les plugins de
marketplace via `plugin/install` et actualise l’inventaire. Connectez OpenClaw
uniquement à des app-servers distants approuvés pour accepter les installations de
plugins gérées par OpenClaw et les actualisations d’inventaire d’apps.

## Modes d’approbation et de sandbox

Les sessions app-server stdio locales utilisent par défaut le mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Cette posture d’opérateur local approuvé permet
aux tours OpenClaw sans surveillance et aux Heartbeats de progresser sans invites
d’approbation natives auxquelles personne n’est présent pour répondre.

Si le fichier local d’exigences système de Codex interdit les valeurs YOLO
implicites d’approbation, de réviseur ou de sandbox, OpenClaw traite plutôt la
valeur implicite par défaut comme guardian et sélectionne les autorisations
guardian permises. `tools.exec.mode: "auto"` force également les approbations
Codex révisées par guardian et ne préserve pas les anciens overrides non sûrs
`approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ; définissez
`tools.exec.mode: "full"` pour une posture intentionnelle sans approbation. Les
entrées `[[remote_sandbox_config]]` correspondant au nom d’hôte dans le même
fichier d’exigences sont honorées pour la décision par défaut du sandbox.

Définissez `appServer.mode: "guardian"` pour les approbations Codex révisées par
guardian :

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

Le préréglage `guardian` s’étend à `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"` lorsque ces
valeurs sont autorisées. Les champs de politique individuels remplacent `mode`.
L’ancienne valeur de réviseur `guardian_subagent` est toujours acceptée comme
alias de compatibilité, mais les nouvelles configurations devraient utiliser
`auto_review`.

Lorsqu’un sandbox OpenClaw est actif, le processus app-server Codex local
s’exécute toujours sur l’hôte Gateway. OpenClaw désactive donc pour ce tour le
mode Code natif de Codex, les serveurs MCP utilisateur et l’exécution de Plugin
adossée à des apps, au lieu de considérer le sandboxing côté hôte Codex comme
équivalent au backend de sandbox OpenClaw. L’accès shell est exposé via des outils
dynamiques adossés au sandbox OpenClaw, tels que `sandbox_exec` et
`sandbox_process`, lorsque les outils exec/process normaux sont disponibles.

Sur les hôtes Ubuntu/AppArmor, Codex bwrap peut échouer sous `workspace-write`
avant le démarrage de la commande shell lorsque vous exécutez intentionnellement
le `workspace-write` Codex natif sans sandboxing OpenClaw actif. Si vous voyez
`bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, exécutez
`openclaw doctor` et corrigez la politique d’espace de noms hôte signalée pour
l’utilisateur du service OpenClaw plutôt que d’accorder des privilèges plus
larges au conteneur Docker. Préférez un profil AppArmor limité au processus de
service ; le recours `kernel.apparmor_restrict_unprivileged_userns=0` s’applique
à tout l’hôte et comporte des compromis de sécurité.

## Exécution native sandboxée

La valeur par défaut stable est l’échec fermé : le sandboxing OpenClaw actif
désactive les surfaces d’exécution natives Codex qui s’exécuteraient autrement
depuis l’hôte app-server Codex. Utilisez
`appServer.experimental.sandboxExecServer: true` uniquement lorsque vous voulez
essayer la prise en charge des environnements distants de Codex avec le backend
de sandbox d’OpenClaw. Ce chemin en préversion nécessite Codex app-server 0.132.0
ou une version plus récente.

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

Lorsque le drapeau est activé et que la session OpenClaw actuelle est sandboxée,
OpenClaw démarre un exec-server en local loopback adossé au sandbox actif,
l’enregistre auprès de Codex app-server, puis démarre le fil et le tour Codex
avec cet environnement appartenant à OpenClaw. Si l’app-server ne peut pas
enregistrer l’environnement, l’exécution échoue en mode fermé au lieu de revenir
silencieusement à l’exécution sur l’hôte.

Ce chemin en préversion est uniquement local. Un app-server WebSocket distant ne
peut pas atteindre l’exec-server loopback sauf s’il s’exécute sur le même hôte ;
OpenClaw rejette donc cette combinaison.

## Authentification et isolation de l’environnement

Dans le home par agent par défaut, l’authentification est sélectionnée dans cet
ordre :

1. Un profil d’authentification OpenClaw Codex explicite pour l’agent.
2. Le compte existant de l’app-server dans le home Codex de cet agent.
3. Pour les lancements app-server stdio locaux uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte app-server n’est présent et qu’une
   authentification OpenAI est encore requise.

Quand OpenClaw détecte un profil d’authentification Codex de type abonnement
ChatGPT, il retire `CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex
généré. Cela garde les clés d’API de niveau Gateway disponibles pour les
embeddings ou les modèles OpenAI directs sans faire facturer par accident les
tours app-server Codex natifs via l’API.

Les profils explicites de clé d’API Codex et le recours local stdio par clé
d’environnement utilisent la connexion app-server au lieu de l’environnement
hérité du processus enfant. Les connexions app-server WebSocket ne reçoivent pas
le recours par clé d’API d’environnement Gateway ; utilisez un profil
d’authentification explicite ou le compte propre de l’app-server distant.

Les lancements app-server stdio héritent par défaut de l’environnement de
processus d’OpenClaw. OpenClaw possède le pont de compte app-server Codex et
définit `CODEX_HOME` sur un répertoire par agent sous l’état OpenClaw de cet
agent. Cela garde la configuration Codex, les comptes, le cache/les données de
Plugin et l’état des fils limités à l’agent OpenClaw au lieu de les laisser fuir
depuis le home personnel `~/.codex` de l’opérateur.

Définissez `appServer.homeScope: "user"` pour partager l’état Codex natif avec
Codex Desktop et la CLI. Ce mode limité au stdio local utilise `$CODEX_HOME`
lorsqu’il est défini et `~/.codex` sinon, y compris l’authentification native, la
configuration, les plugins et les fils. OpenClaw ignore son pont de profil
d’authentification pour l’app-server. Les tours de propriétaire vérifiés peuvent
utiliser `codex_threads` pour lister, rechercher, lire, forker, renommer,
archiver et restaurer ces fils. Forkez un fil avant de le poursuivre dans
OpenClaw ; les processus Codex indépendants ne coordonnent pas les rédacteurs
concurrents pour le même fil.

OpenClaw ne réécrit pas `HOME` pour les lancements app-server locaux normaux. Les
sous-processus exécutés par Codex, tels que `openclaw`, `gh`, `git`, les CLI
cloud et les commandes shell, voient le home de processus normal et peuvent
trouver la configuration et les jetons du home utilisateur. Codex peut également
découvrir `$HOME/.agents/skills` et `$HOME/.agents/plugins/marketplace.json` ;
cette découverte `.agents` est intentionnellement partagée avec le home de
l’opérateur et est distincte de l’état `~/.codex` isolé.

Dans la portée d’agent par défaut, les plugins OpenClaw et les instantanés de
Skills OpenClaw continuent de passer par le registre de plugins et le chargeur de
Skills propres à OpenClaw ; les ressources Codex personnelles de `~/.codex`, non.
Si vous avez des Skills ou plugins Codex CLI utiles provenant d’un home Codex qui
devraient faire partie d’un agent OpenClaw isolé, inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un déploiement nécessite une isolation supplémentaire de l’environnement,
ajoutez ces variables à `appServer.clearEnv` :

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

`appServer.clearEnv` affecte uniquement le processus enfant app-server Codex
généré. OpenClaw retire `CODEX_HOME` et `HOME` de cette liste pendant la
normalisation du lancement local : `CODEX_HOME` reste pointé vers la portée agent
ou utilisateur sélectionnée, et `HOME` reste hérité afin que les sous-processus
puissent utiliser l’état normal du home utilisateur.

## Outils dynamiques

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`.
OpenClaw n’expose pas les outils dynamiques qui dupliquent les opérations de
workspace natives de Codex :

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

La plupart des outils d’intégration OpenClaw restants, comme la messagerie, les
médias, Cron, le navigateur, les nœuds, Gateway, `heartbeat_respond` et
`web_search`, sont disponibles via la recherche d’outils Codex sous l’espace de
noms `openclaw`. Cela réduit le contexte initial du modèle. `sessions_yield` et
les réponses de source limitées aux outils de message restent directs, car ce
sont des contrats de contrôle de tour. `sessions_spawn` reste recherchable afin
que le `spawn_agent` natif de Codex demeure la surface principale de sous-agent
Codex, tandis que la délégation explicite OpenClaw ou ACP reste disponible via
l’espace de noms d’outils dynamiques `openclaw`.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à
un app-server Codex personnalisé qui ne peut pas rechercher les outils dynamiques
différés, ou lors du débogage de la charge utile complète des outils.

## Délais d’expiration

Les appels d’outils dynamiques appartenant à OpenClaw sont bornés indépendamment
de `appServer.requestTimeoutMs`. Chaque requête Codex `item/tool/call` utilise le
premier délai disponible dans cet ordre :

- Un argument `timeoutMs` positif propre à l’appel.
- Pour `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Pour `image_generate` sans délai configuré, la valeur par défaut de génération
  d’image de 120 secondes.
- Pour l’outil de compréhension des médias `image`,
  `tools.media.image.timeoutSeconds` converti en millisecondes, ou la valeur par
  défaut média de 60 secondes. Pour la compréhension d’image, cela s’applique à
  la requête elle-même et n’est pas réduit par le travail de préparation
  antérieur.
- La valeur par défaut d’outil dynamique de 90 secondes.

Ce chien de garde est le budget externe de `item/tool/call` dynamique. Les délais
d’expiration de requête propres au fournisseur s’exécutent à l’intérieur de cet
appel et conservent leur propre sémantique de délai. Les budgets des outils
dynamiques sont plafonnés à 600000 ms. En cas de délai dépassé, OpenClaw annule
le signal de l’outil lorsque c’est pris en charge et renvoie à Codex une réponse
d’outil dynamique échouée afin que le tour puisse continuer au lieu de laisser la
session en `processing`.

Après que Codex accepte un tour, et après qu’OpenClaw répond à une requête
app-server limitée au tour, le harnais s’attend à ce que Codex progresse dans le
tour actuel et finisse éventuellement le tour natif avec `turn/completed`. Si
l’app-server reste silencieux pendant `appServer.turnCompletionIdleTimeoutMs`,
OpenClaw tente au mieux d’interrompre le tour Codex, enregistre un délai
diagnostique et libère la file de session OpenClaw afin que les messages de chat
suivants ne soient pas mis en attente derrière un tour natif obsolète.

La plupart des notifications non terminales pour le même tour désarment ce court watchdog
parce que Codex a prouvé que le tour est toujours actif. Les transferts d’outils utilisent un budget
d’inactivité post-outil plus long : après qu’OpenClaw renvoie une réponse `item/tool/call`, après
l’achèvement d’éléments d’outils natifs comme `commandExecution`, après les achèvements bruts
`custom_tool_call_output`, et après la progression brute post-outil de l’assistant,
les achèvements bruts de raisonnement ou la progression du raisonnement. Le garde utilise
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré et
utilise par défaut cinq minutes sinon. Ce même budget post-outil étend également le
watchdog de progression pour la fenêtre de synthèse silencieuse avant que Codex émette le prochain
événement du tour courant. Les achèvements de raisonnement, les achèvements
`agentMessage` de commentary, ainsi que la progression brute de raisonnement ou d’assistant pré-outil peuvent
être suivis d’une réponse finale automatique ; ils utilisent donc le garde de réponse post-progression
au lieu de libérer immédiatement la voie de session. Seuls les éléments `agentMessage`
final/non-commentary terminés et les achèvements bruts d’assistant pré-outil arment la libération de sortie
de l’assistant : si Codex devient ensuite silencieux sans `turn/completed`, OpenClaw interrompt
au mieux le tour natif et libère la voie de session. Les échecs de serveur d’application stdio rejouables
sans risque, y compris les délais d’inactivité d’achèvement de tour sans preuve d’assistant,
d’outil, d’élément actif ou d’effet de bord, sont retentés une fois sur une nouvelle tentative
de serveur d’application. Les délais dangereux retirent tout de même le client de serveur d’application bloqué
et libèrent la voie de session OpenClaw. Ils effacent aussi la liaison obsolète du thread natif
au lieu d’être rejoués automatiquement. Les délais de surveillance d’achèvement affichent un texte de délai
spécifique à Codex : les cas rejouables sans risque indiquent que la réponse peut être incomplète,
tandis que les cas dangereux demandent à l’utilisateur de vérifier l’état actuel avant de réessayer.
Les diagnostics publics de délai incluent des champs structurels comme la dernière méthode de notification
du serveur d’application, l’identifiant/le type/le rôle de l’élément de réponse brute de l’assistant,
les nombres de requêtes/d’éléments actifs, et l’état de surveillance armé. Lorsque la dernière notification
est un élément de réponse brute de l’assistant, ils incluent également un aperçu borné du texte
de l’assistant. Ils n’incluent pas le prompt brut ni le contenu des outils.

## Découverte des modèles

Par défaut, le plugin Codex demande au serveur d’application les modèles disponibles. La disponibilité
des modèles appartient au serveur d’application Codex ; la liste peut donc changer lorsqu’OpenClaw
met à niveau la version groupée de `@openai/codex` ou lorsqu’un déploiement fait pointer
`appServer.command` vers un autre binaire Codex. La disponibilité peut également être
propre au compte. Utilisez `/codex models` sur un gateway en cours d’exécution pour voir le catalogue
actif pour ce harnais et ce compte.

Si la découverte échoue ou expire, OpenClaw utilise un catalogue de secours groupé pour :

- GPT-5.5
- GPT-5.4 mini

Le harnais groupé actuel est `@openai/codex` `0.142.5`. Une sonde `model/list`
contre ce serveur d’application groupé a renvoyé ces lignes publiques de sélecteur :

| Identifiant du modèle | Modalités d’entrée | Efforts de raisonnement |
| --------------------- | ------------------ | ----------------------- |
| `gpt-5.5`             | texte, image       | low, medium, high, xhigh |
| `gpt-5.4`             | texte, image       | low, medium, high, xhigh |
| `gpt-5.4-mini`        | texte, image       | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | texte              | low, medium, high, xhigh |

Des modèles masqués peuvent être renvoyés par le catalogue du serveur d’application pour des flux
internes ou spécialisés, mais ce ne sont pas des choix normaux du sélecteur de modèles.

Ajustez la découverte sous `plugins.entries.codex.config.discovery` :

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

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et utilise uniquement le
catalogue de secours :

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

Codex gère lui-même `AGENTS.md` via la découverte native de documentation de projet. OpenClaw
n’écrit pas de fichiers synthétiques de documentation de projet Codex et ne dépend pas des noms
de fichiers de secours Codex pour les fichiers de persona, car les solutions de secours Codex ne s’appliquent
que lorsque `AGENTS.md` est absent.

Pour la parité d’espace de travail OpenClaw, le harnais Codex résout les autres fichiers
d’amorçage. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` et `USER.md` sont transmis comme
instructions développeur OpenClaw Codex parce qu’ils définissent l’agent actif,
les consignes d’espace de travail disponibles et le profil utilisateur. La liste compacte des Skills OpenClaw
est transmise comme instructions développeur de collaboration limitées au tour.
Le contenu de `HEARTBEAT.md` n’est pas injecté ; les tours de heartbeat reçoivent un pointeur
en mode collaboration pour lire le fichier lorsqu’il existe et n’est pas vide. Le contenu de `MEMORY.md`
provenant de l’espace de travail d’agent configuré n’est pas collé dans l’entrée de tour Codex native
lorsque les outils de mémoire sont disponibles pour cet espace de travail ; lorsqu’il existe, le harnais
ajoute un petit pointeur de mémoire d’espace de travail aux instructions développeur de collaboration limitées
au tour, et Codex doit utiliser `memory_search` ou `memory_get` lorsque la mémoire durable
est pertinente. Si les outils sont désactivés, si la recherche mémoire est indisponible, ou si
l’espace de travail actif diffère de l’espace de travail de mémoire de l’agent, `MEMORY.md` utilise le
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
préférée pour les déploiements répétables, car elle conserve le comportement du plugin dans le
même fichier revu que le reste de la configuration du harnais Codex.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Référence de configuration](/fr/gateway/configuration-reference)
