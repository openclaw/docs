---
read_when:
    - Il vous faut tous les champs de configuration du harnais Codex
    - Vous modifiez le comportement de transport, d’authentification, de découverte ou de délai d’expiration d’app-server
    - Vous déboguez le démarrage du harnais Codex, la découverte des modèles ou l’isolation de l’environnement
summary: Référence de configuration, d’authentification, de découverte et de serveur d’application pour le harnais Codex
title: Référence du harnais Codex
x-i18n:
    generated_at: "2026-07-01T08:01:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Cette référence couvre la configuration détaillée du Plugin `codex`
fourni. Pour la configuration initiale et les décisions de routage, commencez par
[le harnais Codex](/fr/plugins/codex-harness).

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

| Champ                      | Valeur par défaut        | Signification                                                                                                                              |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | activé                   | Paramètres de découverte de modèles pour `model/list` du serveur d’application Codex.                                                      |
| `appServer`                | serveur d’application stdio géré | Paramètres de transport, commande, authentification, approbation, bac à sable et délai d’expiration.                                      |
| `codexDynamicToolsLoading` | `"searchable"`           | Utilisez `"direct"` pour placer les outils dynamiques OpenClaw directement dans le contexte initial des outils Codex.                      |
| `codexDynamicToolsExclude` | `[]`                     | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours du serveur d’application Codex.                                     |
| `codexPlugins`             | désactivé                | Prise en charge native des plugins/applications Codex pour les plugins organisés installés depuis les sources et migrés. Consultez [Plugins Codex natifs](/fr/plugins/codex-native-plugins). |
| `computerUse`              | désactivé                | Configuration de Codex Computer Use. Consultez [Codex Computer Use](/fr/plugins/codex-computer-use).                                         |

## Transport du serveur d’application

Par défaut, OpenClaw démarre le binaire Codex géré livré avec le Plugin
fourni :

```bash
codex app-server --listen stdio://
```

Cela maintient la version du serveur d’application liée au Plugin `codex` fourni plutôt qu’à
n’importe quelle CLI Codex distincte installée localement. Définissez
`appServer.command` uniquement lorsque vous souhaitez intentionnellement exécuter un autre
exécutable.

Pour un serveur d’application déjà en cours d’exécution, utilisez le transport WebSocket :

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

| Champ                                         | Valeur par défaut                                     | Signification                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                                                                                                                      |
| `command`                                     | binaire Codex géré                                    | Exécutable pour le transport stdio. Laissez non défini pour utiliser le binaire géré.                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | non défini                                            | URL WebSocket de l’app-server.                                                                                                                                                                                                                                                                                                                                                                  |
| `authToken`                                   | non défini                                            | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou un SecretInput tel que `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                   |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité.                                                                                                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | non défini                                            | Racine de l’espace de travail distant de l’app-server Codex. Lorsqu’elle est définie, OpenClaw déduit la racine de l’espace de travail local depuis l’espace de travail OpenClaw résolu, conserve le suffixe cwd actuel sous cette racine distante et envoie uniquement le cwd final de l’app-server à Codex. Si le cwd se trouve hors de la racine de l’espace de travail OpenClaw résolue, OpenClaw échoue de manière fermée au lieu d’envoyer un chemin local au Gateway à l’app-server distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration pour les appels du plan de contrôle de l’app-server.                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre silencieuse après que Codex accepte un tour ou après une requête app-server limitée au tour pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde de progression et d’inactivité de complétion utilisé après un transfert d’outil, une complétion d’outil natif, une progression brute de l’assistant après outil, une complétion de raisonnement brut ou une progression de raisonnement pendant qu’OpenClaw attend `turn/completed`. Utilisez ceci pour les charges de travail fiables ou lourdes où la synthèse après outil peut légitimement rester silencieuse plus longtemps que le budget final de publication de l’assistant. |
| `mode`                                        | `"yolo"` sauf si les exigences locales de Codex interdisent YOLO | Préréglage pour l’exécution YOLO ou revue par un gardien.                                                                                                                                                                                                                                                                                                                                       |
| `approvalPolicy`                              | `"never"` ou une stratégie d’approbation de gardien autorisée | Stratégie d’approbation native de Codex envoyée au démarrage du fil, à la reprise et au tour.                                                                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` ou un sandbox de gardien autorisé | Mode sandbox natif de Codex envoyé au démarrage du fil et à la reprise. Les sandboxes OpenClaw actifs restreignent les tours `danger-full-access` à Codex `workspace-write` ; le drapeau réseau du tour suit la sortie sandbox d’OpenClaw.                                                                                                                                                     |
| `approvalsReviewer`                           | `"user"` ou un relecteur de gardien autorisé           | Utilisez `"auto_review"` pour laisser Codex revoir les invites d’approbation natives lorsque c’est autorisé.                                                                                                                                                                                                                                                                                    |
| `defaultWorkspaceDir`                         | répertoire du processus actuel                         | Espace de travail utilisé par `/codex bind` lorsque `--cwd` est omis.                                                                                                                                                                                                                                                                                                                           |
| `serviceTier`                                 | non défini                                            | Niveau de service app-server Codex facultatif. `"priority"` active le routage en mode rapide, `"flex"` demande le traitement flex, et `null` efface la substitution. L’ancien `"fast"` est accepté comme `"priority"`.                                                                                                                                                                          |
| `networkProxy`                                | désactivé                                             | Active la mise en réseau du profil d’autorisations Codex pour les commandes app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la sélectionne avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                                | Option d’aperçu qui enregistre un environnement Codex adossé au sandbox OpenClaw auprès de Codex app-server 0.132.0 ou plus récent afin que l’exécution native de Codex puisse s’exécuter dans le sandbox OpenClaw actif.                                                                                                                                                                      |

`appServer.networkProxy` est explicite parce qu’il modifie le contrat de sandbox
Codex. Lorsqu’il est activé, OpenClaw définit aussi `features.network_proxy.enabled` et
`default_permissions` dans la configuration du fil Codex afin que le profil
d’autorisations généré puisse démarrer la mise en réseau gérée par Codex. Par défaut, OpenClaw génère un
nom de profil `openclaw-network-<fingerprint>` résistant aux collisions à partir du
corps du profil ; utilisez `profileName` uniquement lorsqu’un nom local stable est nécessaire.

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

Si l’exécution normale de l’app-server serait `danger-full-access`, l’activation de
`networkProxy` utilise un accès au système de fichiers de type espace de travail pour le profil
d’autorisations généré. L’application réseau gérée par Codex est une mise en réseau sandboxée,
donc un profil avec accès complet ne protégerait pas le trafic sortant.

Le Plugin bloque les handshakes app-server plus anciens ou sans version. Codex app-server
doit déclarer la version stable `0.125.0` ou plus récente.

OpenClaw traite les URL de serveur d’applications WebSocket hors loopback comme distantes et exige
une authentification WebSocket portant une identité via `appServer.authToken` ou un en-tête
`Authorization`. `appServer.authToken` et chaque valeur `appServer.headers.*`
peuvent être une SecretInput ; le runtime des secrets résout les SecretRefs et les raccourcis
d’environnement avant qu’OpenClaw construise les options de démarrage du serveur d’applications, et les
SecretRefs structurées non résolues échouent avant l’envoi de tout jeton ou en-tête. Lorsque des
plugins Codex natifs sont configurés, OpenClaw utilise le plan de contrôle des plugins du
serveur d’applications connecté pour installer ou actualiser ces plugins, puis actualise l’inventaire
des applications afin que les applications appartenant aux plugins soient visibles par le fil Codex.
`app/list` reste la source faisant autorité pour l’inventaire et les métadonnées, mais la politique
OpenClaw décide si `thread/start` envoie `config.apps[appId].enabled = true` pour une application
accessible listée, même si Codex la marque actuellement comme désactivée. Les identifiants
d’application inconnus ou manquants restent fermés par défaut ; ce chemin n’active les plugins
de marketplace que via `plugin/install` et actualise l’inventaire. Connectez OpenClaw uniquement
à des serveurs d’applications distants auxquels vous faites confiance pour accepter les installations
de plugins gérées par OpenClaw et les actualisations d’inventaire d’applications.

## Modes d’approbation et de bac à sable

Les sessions locales de serveur d’applications stdio utilisent le mode YOLO par défaut :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Cette posture d’opérateur local de confiance permet aux
tours OpenClaw sans surveillance et aux heartbeats de progresser sans invites d’approbation
natives auxquelles personne n’est présent pour répondre.

Si le fichier local des exigences système de Codex interdit les valeurs implicites YOLO
d’approbation, de réviseur ou de bac à sable, OpenClaw traite à la place la valeur implicite
par défaut comme guardian et sélectionne les autorisations guardian permises.
`tools.exec.mode: "auto"` force également les approbations Codex examinées par guardian et ne
préserve pas les anciennes substitutions non sûres `approvalPolicy: "never"` ou
`sandbox: "danger-full-access"` ; définissez `tools.exec.mode: "full"` pour une posture
intentionnelle sans approbation. Les entrées
`[[remote_sandbox_config]]` correspondant au nom d’hôte dans le même fichier d’exigences sont
honorées pour la décision par défaut du bac à sable.

Définissez `appServer.mode: "guardian"` pour les approbations Codex examinées par guardian :

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
valeur de réviseur `guardian_subagent` est toujours acceptée comme alias de compatibilité,
mais les nouvelles configurations doivent utiliser `auto_review`.

Lorsqu’un bac à sable OpenClaw est actif, le processus local du serveur d’applications Codex
s’exécute toujours sur l’hôte Gateway. OpenClaw désactive donc Code Mode natif de Codex,
les serveurs MCP utilisateur et l’exécution de plugins adossée aux applications pour ce tour,
au lieu de traiter le sandboxing côté hôte de Codex comme équivalent au backend de bac à sable
OpenClaw. L’accès shell est exposé via des outils dynamiques adossés au bac à sable OpenClaw
tels que `sandbox_exec` et `sandbox_process` lorsque les outils exec/process normaux sont
disponibles.

Sur les hôtes Ubuntu/AppArmor, Codex bwrap peut échouer sous `workspace-write` avant le
démarrage de la commande shell lorsque vous exécutez intentionnellement le
`workspace-write` Codex natif sans sandboxing OpenClaw actif. Si vous voyez
`bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, exécutez
`openclaw doctor` et corrigez la politique d’espaces de noms hôte signalée pour l’utilisateur
du service OpenClaw, plutôt que d’accorder des privilèges plus larges au conteneur Docker.
Préférez un profil AppArmor limité au processus de service ; le recours
`kernel.apparmor_restrict_unprivileged_userns=0` s’applique à tout l’hôte et comporte
des compromis de sécurité.

## Exécution native en bac à sable

Le comportement stable par défaut est fermé par défaut : le sandboxing OpenClaw actif désactive
les surfaces d’exécution natives Codex qui s’exécuteraient autrement depuis l’hôte du serveur
d’applications Codex. Utilisez `appServer.experimental.sandboxExecServer: true` uniquement
lorsque vous voulez essayer la prise en charge des environnements distants de Codex avec le
backend de bac à sable d’OpenClaw. Ce chemin d’aperçu nécessite le serveur d’applications
Codex 0.132.0 ou plus récent.

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
démarre un serveur d’exécution local loopback adossé au bac à sable actif, l’enregistre auprès
du serveur d’applications Codex, puis démarre le fil et le tour Codex avec cet environnement
appartenant à OpenClaw. Si le serveur d’applications ne peut pas enregistrer l’environnement,
l’exécution échoue en mode fermé au lieu de revenir silencieusement à l’exécution sur l’hôte.

Ce chemin d’aperçu est uniquement local. Un serveur d’applications WebSocket distant ne peut
pas atteindre le serveur d’exécution loopback sauf s’il s’exécute sur le même hôte, donc
OpenClaw rejette cette combinaison.

## Authentification et isolation de l’environnement

L’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification OpenClaw Codex explicite pour l’agent.
2. Le compte existant du serveur d’applications dans le répertoire Codex de cet agent.
3. Pour les lancements locaux de serveur d’applications stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte de serveur d’applications n’est présent et que
   l’authentification OpenAI est encore requise.

Lorsque OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT, il
retire `CODEX_API_KEY` et `OPENAI_API_KEY` du processus enfant Codex lancé. Cela conserve
les clés API de niveau Gateway disponibles pour les embeddings ou les modèles OpenAI directs,
sans faire facturer par accident les tours du serveur d’applications Codex natif via l’API.

Les profils Codex explicites à clé API et le recours local stdio à une clé d’environnement
utilisent la connexion du serveur d’applications au lieu de l’environnement hérité du processus
enfant. Les connexions WebSocket au serveur d’applications ne reçoivent pas le recours aux clés
API d’environnement du Gateway ; utilisez un profil d’authentification explicite ou le propre
compte du serveur d’applications distant.

Les lancements stdio de serveur d’applications héritent par défaut de l’environnement du processus
OpenClaw. OpenClaw possède le pont de comptes du serveur d’applications Codex et définit
`CODEX_HOME` sur un répertoire par agent sous l’état OpenClaw de cet agent. Cela maintient la
configuration Codex, les comptes, le cache/les données des plugins et l’état des fils limités à
l’agent OpenClaw au lieu de les laisser fuir depuis le répertoire personnel `~/.codex` de
l’opérateur.

OpenClaw ne réécrit pas `HOME` pour les lancements locaux normaux du serveur d’applications.
Les sous-processus exécutés par Codex, tels que `openclaw`, `gh`, `git`, les CLI cloud et les
commandes shell, voient le répertoire personnel normal du processus et peuvent trouver la
configuration et les jetons du répertoire personnel utilisateur. Codex peut aussi découvrir
`$HOME/.agents/skills` et `$HOME/.agents/plugins/marketplace.json` ; cette découverte
`.agents` est intentionnellement partagée avec le répertoire personnel de l’opérateur et reste
séparée de l’état isolé `~/.codex`.

Les plugins OpenClaw et les instantanés de Skills OpenClaw passent toujours par le registre de
plugins et le chargeur de Skills propres à OpenClaw. Les ressources personnelles Codex
`~/.codex`, elles, n’y passent pas. Si vous avez des Skills ou plugins Codex CLI utiles provenant
d’un répertoire Codex qui doivent faire partie d’un agent OpenClaw, inventoriez-les explicitement :

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un déploiement nécessite une isolation supplémentaire de l’environnement, ajoutez ces variables
à `appServer.clearEnv` :

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

`appServer.clearEnv` n’affecte que le processus enfant du serveur d’applications Codex lancé.
OpenClaw retire `CODEX_HOME` et `HOME` de cette liste pendant la normalisation du lancement
local : `CODEX_HOME` reste propre à chaque agent, et `HOME` reste hérité afin que les
sous-processus puissent utiliser l’état normal du répertoire personnel utilisateur.

## Outils dynamiques

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`. OpenClaw n’expose
pas les outils dynamiques qui dupliquent les opérations d’espace de travail natives de Codex :

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

La plupart des autres outils d’intégration OpenClaw, tels que la messagerie, les médias, cron,
le navigateur, les nœuds, gateway, `heartbeat_respond` et `web_search`, sont disponibles via
la recherche d’outils Codex sous l’espace de noms `openclaw`. Cela réduit le contexte initial
du modèle. `sessions_yield` et les réponses de source limitées aux outils de message restent
directs, car il s’agit de contrats de contrôle de tour. `sessions_spawn` reste consultable afin
que le `spawn_agent` natif de Codex demeure la principale surface de sous-agent Codex, tandis
que la délégation explicite OpenClaw ou ACP reste disponible via l’espace de noms des outils
dynamiques `openclaw`.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un serveur
d’applications Codex personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou
lors du débogage de la charge utile complète des outils.

## Délais d’expiration

Les appels d’outils dynamiques appartenant à OpenClaw sont bornés indépendamment de
`appServer.requestTimeoutMs`. Chaque requête Codex `item/tool/call` utilise le premier délai
disponible dans cet ordre :

- Un argument par appel `timeoutMs` positif.
- Pour `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Pour `image_generate` sans délai configuré, la valeur par défaut de génération d’images de
  120 secondes.
- Pour l’outil `image` de compréhension des médias, `tools.media.image.timeoutSeconds`
  converti en millisecondes, ou la valeur par défaut média de 60 secondes. Pour la
  compréhension d’image, cela s’applique à la requête elle-même et n’est pas réduit par le
  travail de préparation antérieur.
- La valeur par défaut des outils dynamiques de 90 secondes.

Ce chien de garde est le budget externe de l’appel dynamique `item/tool/call`. Les délais
d’expiration de requête propres aux fournisseurs s’exécutent à l’intérieur de cet appel et
conservent leur propre sémantique de délai. Les budgets d’outils dynamiques sont plafonnés à
600000 ms. En cas d’expiration, OpenClaw interrompt le signal de l’outil lorsque c’est pris en
charge et renvoie une réponse d’outil dynamique en échec à Codex afin que le tour puisse
continuer au lieu de laisser la session en `processing`.

Après que Codex accepte un tour, et après qu’OpenClaw répond à une requête de serveur
d’applications limitée au tour, le harnais s’attend à ce que Codex progresse dans le tour en
cours et finisse par terminer le tour natif avec `turn/completed`. Si le serveur d’applications
reste silencieux pendant `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrompt au
mieux le tour Codex, enregistre un délai d’expiration de diagnostic et libère la voie de session
OpenClaw afin que les messages de chat suivants ne soient pas mis en file derrière un ancien
tour natif.

La plupart des notifications non terminales pour le même tour désarment ce court watchdog
car Codex a prouvé que le tour est toujours actif. Les transferts d’outil utilisent un budget
d’inactivité post-outil plus long : après qu’OpenClaw renvoie une réponse `item/tool/call`, après
la fin d’éléments d’outils natifs tels que `commandExecution`, après les achèvements bruts
`custom_tool_call_output`, et après la progression brute post-outil de l’assistant,
les achèvements de raisonnement bruts ou la progression du raisonnement. Le garde utilise
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré et
prend par défaut cinq minutes sinon. Ce même budget post-outil étend aussi le
watchdog de progression pour la fenêtre de synthèse silencieuse avant que Codex n’émette
l’événement suivant du tour courant. Les achèvements de raisonnement, les achèvements
`agentMessage` de commentaire, ainsi que la progression brute de raisonnement ou d’assistant
pré-outil peuvent être suivis d’une réponse finale automatique ; ils utilisent donc le garde
de réponse post-progression au lieu de libérer immédiatement la voie de session. Seuls
les éléments `agentMessage` finalisés finaux/non-commentaires et les achèvements bruts
d’assistant pré-outil arment la libération de sortie de l’assistant : si Codex devient ensuite
silencieux sans `turn/completed`, OpenClaw interrompt au mieux le tour natif et libère
la voie de session. Les échecs stdio de l’app-server pouvant être rejoués sans risque,
y compris les délais d’inactivité d’achèvement de tour sans preuve d’assistant, d’outil,
d’élément actif ou d’effet de bord, sont réessayés une fois sur une nouvelle tentative
d’app-server. Les délais d’attente non sûrs retirent tout de même le client app-server
bloqué et libèrent la voie de session OpenClaw. Ils effacent aussi la liaison obsolète
du thread natif au lieu d’être rejoués automatiquement. Les délais d’attente de surveillance
d’achèvement affichent un texte de délai d’attente propre à Codex : les cas rejouables
sans risque indiquent que la réponse peut être incomplète, tandis que les cas non sûrs
demandent à l’utilisateur de vérifier l’état actuel avant de réessayer. Les diagnostics publics
de délai d’attente incluent des champs structurels comme la dernière méthode de notification
de l’app-server, l’id/le type/le rôle de l’élément de réponse brute de l’assistant, les nombres
de requêtes/d’éléments actifs, et l’état de surveillance armé. Lorsque la dernière notification
est un élément de réponse brute de l’assistant, ils incluent aussi un aperçu borné du texte
de l’assistant. Ils n’incluent pas le prompt brut ni le contenu des outils.

## Découverte de modèles

Par défaut, le plugin Codex demande à l’app-server les modèles disponibles. La disponibilité
des modèles appartient à l’app-server Codex ; la liste peut donc changer lorsqu’OpenClaw
met à niveau la version groupée de `@openai/codex` ou lorsqu’un déploiement fait pointer
`appServer.command` vers un autre binaire Codex. La disponibilité peut aussi dépendre
du compte. Utilisez `/codex models` sur un gateway en cours d’exécution pour voir le catalogue
actif de ce harnais et de ce compte.

Si la découverte échoue ou expire, OpenClaw utilise un catalogue de secours groupé pour :

- GPT-5.5
- GPT-5.4 mini

Le harnais groupé actuel est `@openai/codex` `0.142.4`. Une sonde `model/list`
sur cet app-server groupé dans un espace de travail compatible GPT-5.6 a renvoyé ces
lignes publiques de sélecteur :

| Id du modèle          | Modalités d’entrée | Efforts de raisonnement              |
| --------------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`         | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image        | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image        | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image        | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image        | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image        | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text               | low, medium, high, xhigh             |

L’accès à GPT-5.6 dépend du compte pendant l’aperçu limité. `max` est un effort
de raisonnement de modèle. `ultra` est une métadonnée d’orchestration multi-agent
Codex distincte, et non un effort de raisonnement OpenAI standard.

Les modèles masqués peuvent être renvoyés par le catalogue de l’app-server pour des flux
internes ou spécialisés, mais ce ne sont pas des choix normaux du sélecteur de modèles.

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

Désactivez la découverte lorsque vous voulez éviter que le démarrage sonde Codex et utiliser
uniquement le catalogue de secours :

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

## Fichiers de bootstrap d’espace de travail

Codex gère lui-même `AGENTS.md` via la découverte native des documents de projet. OpenClaw
n’écrit pas de fichiers synthétiques de documents de projet Codex et ne dépend pas des noms
de fichiers de secours Codex pour les fichiers de persona, car les secours Codex ne s’appliquent
que lorsque `AGENTS.md` est absent.

Pour la parité de l’espace de travail OpenClaw, le harnais Codex résout les autres fichiers
de bootstrap. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` et `USER.md` sont transmis comme
instructions développeur OpenClaw Codex parce qu’ils définissent l’agent actif,
les consignes disponibles pour l’espace de travail et le profil utilisateur. La liste compacte
des Skills OpenClaw est transmise comme instructions développeur de collaboration bornées
au tour. Le contenu de `HEARTBEAT.md` n’est pas injecté ; les tours Heartbeat reçoivent
un pointeur de mode collaboration leur indiquant de lire le fichier lorsqu’il existe et n’est
pas vide. Le contenu de `MEMORY.md` depuis l’espace de travail d’agent configuré n’est pas
collé dans l’entrée de tour native Codex lorsque des outils mémoire sont disponibles pour cet
espace de travail ; lorsqu’il existe, le harnais ajoute un petit pointeur de mémoire d’espace
de travail aux instructions développeur de collaboration bornées au tour, et Codex doit utiliser
`memory_search` ou `memory_get` lorsque la mémoire durable est pertinente. Si les outils sont
désactivés, si la recherche mémoire est indisponible, ou si l’espace de travail actif diffère
de l’espace de travail mémoire de l’agent, `MEMORY.md` utilise le chemin normal de contexte
de tour borné.
`BOOTSTRAP.md`, lorsqu’il est présent, est transmis comme contexte de référence d’entrée
de tour OpenClaw.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La configuration
est préférable pour les déploiements reproductibles, car elle garde le comportement du plugin
dans le même fichier relu que le reste de la configuration du harnais Codex.

## Associé

- [Harnais Codex](/fr/plugins/codex-harness)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Codex Computer Use](/fr/plugins/codex-computer-use)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Référence de configuration](/fr/gateway/configuration-reference)
