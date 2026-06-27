---
read_when:
    - Vous avez besoin de chaque champ de configuration du harnais Codex
    - Vous modifiez le transport, l’authentification, la découverte ou le comportement de délai d’expiration d’app-server
    - Vous déboguez le démarrage du harnais Codex, la découverte des modèles ou l’isolation de l’environnement
summary: Référence de configuration, d’authentification, de découverte et de serveur d’application pour le harnais Codex
title: Référence du harnais Codex
x-i18n:
    generated_at: "2026-06-27T17:46:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Cette référence couvre la configuration détaillée du plugin `codex`
fourni. Pour la configuration initiale et les décisions de routage, commencez par
[Harnais Codex](/fr/plugins/codex-harness).

## Surface de configuration du plugin

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

| Champ                      | Par défaut              | Signification                                                                                                                            |
| -------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | activé                  | Paramètres de découverte de modèles pour `model/list` de l’app-server Codex.                                                             |
| `appServer`                | app-server stdio géré   | Paramètres de transport, de commande, d’authentification, d’approbation, de bac à sable et de délai d’expiration.                        |
| `codexDynamicToolsLoading` | `"searchable"`          | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte d’outils Codex initial.                      |
| `codexDynamicToolsExclude` | `[]`                    | Noms d’outils dynamiques OpenClaw supplémentaires à omettre des tours d’app-server Codex.                                                 |
| `codexPlugins`             | désactivé               | Prise en charge native des plugins/applications Codex pour les plugins organisés migrés installés depuis les sources. Voir [Plugins Codex natifs](/fr/plugins/codex-native-plugins). |
| `computerUse`              | désactivé               | Configuration de Codex Computer Use. Voir [Codex Computer Use](/fr/plugins/codex-computer-use).                                             |

## Transport de l’app-server

Par défaut, OpenClaw démarre le binaire Codex géré livré avec le plugin
fourni :

```bash
codex app-server --listen stdio://
```

Cela garde la version de l’app-server liée au plugin `codex` fourni au lieu de
la CLI Codex séparée qui se trouve être installée localement. Définissez
`appServer.command` uniquement lorsque vous voulez intentionnellement exécuter un autre
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

| Champ                                         | Valeur par défaut                                      | Signification                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                                                                                                                      |
| `command`                                     | binaire Codex géré                                    | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré.                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | non défini                                            | URL WebSocket app-server.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | non défini                                            | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou SecretInput comme `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité.                                                                                                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | non défini                                            | Racine distante de l’espace de travail app-server Codex. Lorsqu’elle est définie, OpenClaw déduit la racine de l’espace de travail local à partir de l’espace de travail OpenClaw résolu, conserve le suffixe cwd actuel sous cette racine distante et envoie uniquement le cwd app-server final à Codex. Si le cwd est en dehors de la racine de l’espace de travail OpenClaw résolue, OpenClaw échoue de manière fermée au lieu d’envoyer un chemin local au Gateway à l’app-server distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration pour les appels du plan de contrôle app-server.                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre silencieuse après que Codex accepte un tour ou après une requête app-server limitée au tour pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde de progression et d’inactivité de complétion utilisée après un transfert d’outil, une complétion d’outil native, une progression brute d’assistant après outil, une complétion de raisonnement brute ou une progression de raisonnement pendant qu’OpenClaw attend `turn/completed`. Utilisez ceci pour les charges de travail fiables ou lourdes où la synthèse après outil peut légitimement rester silencieuse plus longtemps que le budget final de publication de l’assistant. |
| `mode`                                        | `"yolo"` sauf si les exigences Codex locales interdisent YOLO | Préréglage pour l’exécution YOLO ou revue par un gardien.                                                                                                                                                                                                                                                                                                                                       |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation de gardien autorisée | Politique d’approbation native Codex envoyée au démarrage du fil, à la reprise et au tour.                                                                                                                                                                                                                                                                                                      |
| `sandbox`                                     | `"danger-full-access"` ou un bac à sable de gardien autorisé | Mode de bac à sable natif Codex envoyé au démarrage du fil et à la reprise. Les bacs à sable OpenClaw actifs restreignent les tours `danger-full-access` à Codex `workspace-write` ; l’indicateur réseau du tour suit la sortie du bac à sable OpenClaw.                                                                                                                                        |
| `approvalsReviewer`                           | `"user"` ou un réviseur de gardien autorisé            | Utilisez `"auto_review"` pour laisser Codex revoir les invites d’approbation natives lorsque c’est autorisé.                                                                                                                                                                                                                                                                                    |
| `defaultWorkspaceDir`                         | répertoire du processus actuel                         | Espace de travail utilisé par `/codex bind` lorsque `--cwd` est omis.                                                                                                                                                                                                                                                                                                                           |
| `serviceTier`                                 | non défini                                            | Niveau de service app-server Codex facultatif. `"priority"` active le routage en mode rapide, `"flex"` demande un traitement flexible et `null` efface la surcharge. L’ancien `"fast"` est accepté comme `"priority"`.                                                                                                                                                                          |
| `networkProxy`                                | désactivé                                             | Active la mise en réseau du profil d’autorisations Codex pour les commandes app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la sélectionne avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in d’aperçu qui enregistre auprès de Codex app-server 0.132.0 ou plus récent un environnement Codex adossé au bac à sable OpenClaw, afin que l’exécution native Codex puisse s’exécuter dans le bac à sable OpenClaw actif.                                                                                                                                                                 |

`appServer.networkProxy` est explicite, car il modifie le contrat de bac à sable
Codex. Lorsqu’il est activé, OpenClaw définit aussi `features.network_proxy.enabled` et
`default_permissions` dans la configuration de fil Codex afin que le profil
d’autorisation généré puisse démarrer la mise en réseau gérée par Codex. Par défaut,
OpenClaw génère un nom de profil `openclaw-network-<fingerprint>` résistant aux
collisions à partir du corps du profil ; utilisez `profileName` uniquement lorsqu’un
nom local stable est requis.

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
`networkProxy` utilise un accès au système de fichiers de type espace de travail
pour le profil d’autorisation généré. L’application réseau gérée par Codex est
une mise en réseau en bac à sable ; un profil avec accès complet ne protégerait
donc pas le trafic sortant.

Le Plugin bloque les handshakes app-server plus anciens ou non versionnés. Codex app-server
doit signaler la version stable `0.125.0` ou plus récente.

OpenClaw traite les URL de serveur d’applications WebSocket non local loopback comme distantes et exige
une authentification WebSocket portant l’identité via `appServer.authToken` ou un en-tête
`Authorization`. `appServer.authToken` et chaque valeur `appServer.headers.*`
peuvent être un SecretInput ; le runtime des secrets résout les SecretRefs et les raccourcis
d’environnement avant qu’OpenClaw construise les options de démarrage du serveur d’applications, et les
SecretRefs structurées non résolues échouent avant l’envoi de tout jeton ou en-tête. Lorsque des
plugins Codex natifs sont configurés, OpenClaw utilise le plan de contrôle des plugins du serveur
d’applications connecté pour installer ou actualiser ces plugins, puis actualise l’inventaire des
applications afin que les applications appartenant aux plugins soient visibles par le fil Codex. `app/list` reste la
source d’inventaire et de métadonnées faisant autorité, mais la politique OpenClaw décide si
`thread/start` envoie `config.apps[appId].enabled = true` pour une application accessible répertoriée
même si Codex la marque actuellement comme désactivée. Les identifiants d’application inconnus ou manquants restent
fermés par défaut ; ce chemin active uniquement les plugins de place de marché via `plugin/install`
et actualise l’inventaire. Connectez OpenClaw uniquement à des serveurs d’applications distants auxquels vous faites
confiance pour accepter les installations de plugins gérées par OpenClaw et les actualisations d’inventaire d’applications.

## Modes d’approbation et de bac à sable

Les sessions locales de serveur d’applications stdio utilisent le mode YOLO par défaut :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Cette posture d’opérateur local de confiance permet
aux tours OpenClaw non surveillés et aux heartbeats de progresser sans invites d’approbation
natives auxquelles personne n’est présent pour répondre.

Si le fichier local des exigences système de Codex interdit les valeurs implicites d’approbation YOLO,
de réviseur ou de bac à sable, OpenClaw traite plutôt la valeur implicite par défaut comme guardian
et sélectionne les autorisations guardian permises. `tools.exec.mode: "auto"`
force également les approbations Codex revues par guardian et ne conserve pas les remplacements
hérités non sûrs `approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ;
définissez `tools.exec.mode: "full"` pour une posture intentionnelle sans approbation.
Les entrées
`[[remote_sandbox_config]]` correspondant au nom d’hôte dans le même fichier d’exigences sont respectées
pour la décision de valeur par défaut du bac à sable.

Définissez `appServer.mode: "guardian"` pour les approbations Codex revues par guardian :

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
valeurs sont autorisées. Les champs de politique individuels remplacent `mode`. L’ancienne
valeur de réviseur `guardian_subagent` est toujours acceptée comme alias de compatibilité,
mais les nouvelles configurations devraient utiliser `auto_review`.

Lorsqu’un bac à sable OpenClaw est actif, le processus local du serveur d’applications Codex
s’exécute toujours sur l’hôte Gateway. OpenClaw désactive donc le Code Mode natif de Codex,
les serveurs MCP utilisateur et l’exécution de plugins adossée aux applications pour ce tour, au lieu de
considérer que le bac à sable côté hôte Codex est équivalent au backend de bac à sable OpenClaw.
L’accès au shell est exposé via les outils dynamiques adossés au bac à sable OpenClaw
tels que `sandbox_exec` et `sandbox_process` lorsque les outils exec/process normaux
sont disponibles.

Sur les hôtes Ubuntu/AppArmor, Codex bwrap peut échouer sous `workspace-write` avant
le démarrage de la commande shell lorsque vous exécutez intentionnellement le
`workspace-write` Codex natif sans bac à sable OpenClaw actif. Si vous voyez
`bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, exécutez
`openclaw doctor` et corrigez la politique d’espace de noms hôte signalée pour l’utilisateur de service
OpenClaw plutôt que d’accorder des privilèges plus larges au conteneur Docker. Préférez
un profil AppArmor ciblé pour le processus de service ; le repli
`kernel.apparmor_restrict_unprivileged_userns=0` s’applique à tout l’hôte et comporte
des compromis de sécurité.

## Exécution native en bac à sable

La valeur par défaut stable est fermée par défaut : le bac à sable OpenClaw actif désactive les surfaces
d’exécution Codex natives qui s’exécuteraient autrement depuis l’hôte du serveur d’applications Codex.
Utilisez `appServer.experimental.sandboxExecServer: true` uniquement lorsque vous voulez
essayer la prise en charge de l’environnement distant de Codex avec le backend de bac à sable d’OpenClaw. Ce
chemin d’aperçu nécessite Codex app-server 0.132.0 ou une version plus récente.

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

Lorsque le drapeau est activé et que la session OpenClaw actuelle est en bac à sable, OpenClaw
démarre un serveur exec local loopback adossé au bac à sable actif, l’enregistre
auprès de Codex app-server, puis démarre le fil et le tour Codex avec cet
environnement appartenant à OpenClaw. Si le serveur d’applications ne peut pas enregistrer l’environnement,
l’exécution échoue en mode fermé au lieu de revenir silencieusement à l’exécution sur l’hôte.

Ce chemin d’aperçu est local uniquement. Un serveur d’applications WebSocket distant ne peut pas atteindre le
serveur exec loopback sauf s’il s’exécute sur le même hôte ; OpenClaw rejette donc
cette combinaison.

## Authentification et isolation de l’environnement

L’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification OpenClaw Codex explicite pour l’agent.
2. Le compte existant du serveur d’applications dans le répertoire Codex de cet agent.
3. Pour les lancements locaux de serveur d’applications stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’applications n’est présent et que l’authentification OpenAI est
   toujours requise.

Lorsqu’OpenClaw voit un profil d’authentification Codex de type abonnement ChatGPT, il retire
`CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela
maintient les clés API de niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs
sans faire facturer par accident les tours natifs du serveur d’applications Codex via l’API.

Les profils Codex explicites à clé API et le repli local stdio par clé d’environnement utilisent la connexion
au serveur d’applications au lieu de l’environnement hérité du processus enfant. Les connexions WebSocket au serveur d’applications
ne reçoivent pas le repli de clé API d’environnement du Gateway ; utilisez un profil d’authentification explicite ou le
compte propre du serveur d’applications distant.

Les lancements de serveur d’applications stdio héritent par défaut de l’environnement du processus OpenClaw.
OpenClaw possède le pont de compte du serveur d’applications Codex et définit `CODEX_HOME` sur un
répertoire propre à l’agent sous l’état OpenClaw de cet agent. Cela garde la configuration Codex,
les comptes, le cache/les données des plugins et l’état des fils limités à l’agent OpenClaw
au lieu de fuiter depuis le répertoire personnel `~/.codex` de l’opérateur.

OpenClaw ne réécrit pas `HOME` pour les lancements locaux normaux du serveur d’applications. Les
sous-processus exécutés par Codex tels que `openclaw`, `gh`, `git`, les CLI cloud et les commandes shell voient
le répertoire personnel normal du processus et peuvent trouver la configuration et les jetons du répertoire utilisateur. Codex peut aussi
découvrir `$HOME/.agents/skills` et `$HOME/.agents/plugins/marketplace.json` ;
cette découverte `.agents` est intentionnellement partagée avec le répertoire personnel de l’opérateur et est
distincte de l’état isolé `~/.codex`.

Les plugins OpenClaw et les instantanés Skills OpenClaw passent toujours par le
registre de plugins et le chargeur de Skills propres à OpenClaw. Les ressources personnelles Codex `~/.codex`
ne le font pas. Si vous avez des Skills ou plugins Codex CLI utiles provenant d’un répertoire Codex qui devraient devenir
partie intégrante d’un agent OpenClaw, inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un déploiement nécessite une isolation supplémentaire de l’environnement, ajoutez ces variables à
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

`appServer.clearEnv` affecte uniquement le processus enfant Codex app-server lancé.
OpenClaw retire `CODEX_HOME` et `HOME` de cette liste pendant la normalisation du lancement local :
`CODEX_HOME` reste propre à l’agent, et `HOME` reste hérité afin que
les sous-processus puissent utiliser l’état normal du répertoire utilisateur.

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

La plupart des autres outils d’intégration OpenClaw, tels que la messagerie, les médias, cron,
le navigateur, les nœuds, gateway, `heartbeat_respond` et `web_search`, sont disponibles
via la recherche d’outils Codex sous l’espace de noms `openclaw`. Cela réduit la taille du
contexte initial du modèle. `sessions_yield` et les réponses de source propres aux outils de message
restent directes, car ce sont des contrats de contrôle de tour. `sessions_spawn` reste
interrogeable afin que le `spawn_agent` natif de Codex demeure la principale surface de sous-agent Codex,
tandis que la délégation OpenClaw ou ACP explicite reste disponible via
l’espace de noms d’outils dynamiques `openclaw`.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un serveur d’applications Codex
personnalisé qui ne peut pas rechercher les outils dynamiques différés ou lors du débogage de la charge utile
complète des outils.

## Délais d’expiration

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs`. Chaque requête Codex `item/tool/call` utilise le premier
délai d’expiration disponible dans cet ordre :

- Un argument positif `timeoutMs` propre à l’appel.
- Pour `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Pour `image_generate` sans délai d’expiration configuré, la valeur par défaut de 120 secondes
  pour la génération d’images.
- Pour l’outil `image` de compréhension des médias, `tools.media.image.timeoutSeconds`
  converti en millisecondes, ou la valeur par défaut de 60 secondes pour les médias. Pour la
  compréhension d’image, cela s’applique à la requête elle-même et n’est pas réduit par
  le travail de préparation antérieur.
- La valeur par défaut de 90 secondes pour les outils dynamiques.

Ce chien de garde est le budget externe du `item/tool/call` dynamique. Les délais d’expiration
de requête propres au fournisseur s’exécutent à l’intérieur de cet appel et conservent leurs propres sémantiques
de délai d’expiration. Les budgets des outils dynamiques sont plafonnés à 600000 ms. En cas de délai dépassé, OpenClaw interrompt
le signal de l’outil lorsque c’est pris en charge et renvoie une réponse d’outil dynamique échouée à Codex
afin que le tour puisse continuer au lieu de laisser la session en `processing`.

Après que Codex a accepté un tour, et après qu’OpenClaw répond à une requête de serveur d’applications
limitée au tour, le harnais s’attend à ce que Codex progresse dans le tour actuel et
termine finalement le tour natif avec `turn/completed`. Si le serveur d’applications reste
silencieux pendant `appServer.turnCompletionIdleTimeoutMs`, OpenClaw tente au mieux
d’interrompre le tour Codex, enregistre un délai d’expiration diagnostique et libère la voie de session
OpenClaw afin que les messages de chat suivants ne soient pas mis en file derrière un tour natif
périmé.

La plupart des notifications non terminales pour le même tour désarment ce court chien de garde
parce que Codex a prouvé que le tour est toujours actif. Les transferts d’outils utilisent un budget
d’inactivité plus long après outil : après qu’OpenClaw renvoie une réponse `item/tool/call`, après
l’achèvement d’éléments d’outils natifs tels que `commandExecution`, après les achèvements bruts
`custom_tool_call_output`, et après la progression brute de l’assistant après outil,
les achèvements de raisonnement bruts ou la progression du raisonnement. Le garde utilise
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré et
utilise sinon cinq minutes par défaut. Ce même budget après outil étend aussi le
chien de garde de progression pour la fenêtre de synthèse silencieuse avant que Codex émette
l’événement suivant du tour en cours. Les achèvements de raisonnement, les achèvements
`agentMessage` de commentaire, ainsi que la progression de raisonnement ou d’assistant brute
avant outil peuvent être suivis d’une réponse finale automatique ; ils utilisent donc le garde
de réponse après progression au lieu de libérer immédiatement la voie de session. Seuls
les éléments `agentMessage` finaux/non-commentaire terminés et les achèvements bruts de
l’assistant avant outil arment la libération de sortie de l’assistant : si Codex devient ensuite
silencieux sans `turn/completed`, OpenClaw interrompt au mieux le tour natif et libère
la voie de session. Les échecs de serveur d’application stdio rejouables en toute sécurité,
y compris les délais d’inactivité de fin de tour sans preuve d’assistant, d’outil, d’élément actif
ou d’effet de bord, sont réessayés une fois sur une nouvelle tentative de serveur d’application.
Les délais non sûrs retirent quand même le client de serveur d’application bloqué et libèrent
la voie de session OpenClaw. Ils effacent aussi la liaison de fil natif obsolète au lieu d’être
rejoués automatiquement. Les délais de surveillance d’achèvement affichent un texte de délai
spécifique à Codex : les cas rejouables en toute sécurité indiquent que la réponse peut être
incomplète, tandis que les cas non sûrs demandent à l’utilisateur de vérifier l’état actuel avant
de réessayer. Les diagnostics publics de délai incluent des champs structurels tels que la dernière
méthode de notification du serveur d’application, l’identifiant/le type/le rôle de l’élément de
réponse brute de l’assistant, les nombres de requêtes/d’éléments actifs et l’état de surveillance armé.
Lorsque la dernière notification est un élément de réponse brute de l’assistant, ils incluent aussi
un aperçu borné du texte de l’assistant. Ils n’incluent pas le prompt brut ni le contenu des outils.

## Découverte des modèles

Par défaut, le Plugin Codex demande au serveur d’application les modèles disponibles. La disponibilité
des modèles appartient au serveur d’application Codex ; la liste peut donc changer lorsqu’OpenClaw
met à niveau la version groupée de `@openai/codex` ou lorsqu’un déploiement fait pointer
`appServer.command` vers un autre binaire Codex. La disponibilité peut aussi être propre à un compte.
Utilisez `/codex models` sur un Gateway en cours d’exécution pour voir le catalogue actif
pour ce harnais et ce compte.

Si la découverte échoue ou expire, OpenClaw utilise un catalogue de repli groupé pour :

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Le harnais groupé actuel est `@openai/codex` `0.139.0`. Une sonde `model/list`
contre ce serveur d’application groupé a renvoyé :

| ID du modèle    | Par défaut | Masqué | Modalités d’entrée | Efforts de raisonnement  |
| --------------- | ---------- | ------ | ------------------ | ------------------------ |
| `gpt-5.5`       | Oui        | Non    | text, image        | low, medium, high, xhigh |
| `gpt-5.4`       | Non        | Non    | text, image        | low, medium, high, xhigh |
| `gpt-5.4-mini`  | Non        | Non    | text, image        | low, medium, high, xhigh |
| `gpt-5.3-codex` | Non        | Non    | text, image        | low, medium, high, xhigh |
| `gpt-5.2`       | Non        | Non    | text, image        | low, medium, high, xhigh |

Les modèles masqués peuvent être renvoyés par le catalogue du serveur d’application pour des flux
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

Désactivez la découverte lorsque vous voulez que le démarrage évite de sonder Codex et utilise
uniquement le catalogue de repli :

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

Codex gère lui-même `AGENTS.md` par la découverte native des documents de projet. OpenClaw
n’écrit pas de fichiers synthétiques de documents de projet Codex et ne dépend pas des noms
de fichiers de repli Codex pour les fichiers de persona, car les replis Codex ne s’appliquent
que lorsque `AGENTS.md` est absent.

Pour la parité de l’espace de travail OpenClaw, le harnais Codex résout les autres fichiers
d’amorçage. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` et `USER.md` sont transmis comme
instructions développeur OpenClaw Codex, car ils définissent l’agent actif, les consignes
d’espace de travail disponibles et le profil utilisateur. La liste compacte des Skills OpenClaw
est transmise comme instructions développeur de collaboration propres au tour.
Le contenu de `HEARTBEAT.md` n’est pas injecté ; les tours Heartbeat reçoivent un pointeur
de mode collaboration indiquant de lire le fichier lorsqu’il existe et n’est pas vide. Le contenu
de `MEMORY.md` provenant de l’espace de travail d’agent configuré n’est pas collé dans l’entrée
de tour native de Codex lorsque les outils de mémoire sont disponibles pour cet espace de travail ;
lorsqu’il existe, le harnais ajoute un petit pointeur de mémoire d’espace de travail aux instructions
développeur de collaboration propres au tour, et Codex doit utiliser `memory_search` ou `memory_get`
lorsqu’une mémoire durable est pertinente. Si les outils sont désactivés, si la recherche mémoire
est indisponible ou si l’espace de travail actif diffère de l’espace de travail de mémoire de l’agent,
`MEMORY.md` utilise le chemin normal de contexte de tour borné.
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

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez plutôt
`plugins.entries.codex.config.appServer.mode: "guardian"`, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration est
préférée pour les déploiements reproductibles, car elle conserve le comportement du Plugin dans
le même fichier relu que le reste de la configuration du harnais Codex.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Référence de configuration](/fr/gateway/configuration-reference)
