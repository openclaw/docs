---
read_when:
    - Vous avez besoin de chaque champ de configuration du harnais Codex
    - Vous modifiez le comportement du transport, de l’authentification, de la découverte ou des délais d’expiration de l’app-server
    - Vous déboguez le démarrage du harnais Codex, la découverte des modèles ou l’isolation de l’environnement
summary: Référence de configuration, d’authentification, de découverte et du serveur d’application pour le harnais Codex
title: Référence du harnais Codex
x-i18n:
    generated_at: "2026-07-12T02:51:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Cette référence couvre la configuration détaillée du Plugin officiel `codex`.
Pour la configuration et les décisions de routage, commencez par
[Harnais Codex](/fr/plugins/codex-harness).

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

Champs de niveau supérieur :

| Champ                      | Valeur par défaut                     | Signification                                                                                                                                                                      |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | activée                               | Paramètres de découverte des modèles pour `model/list` de l’app-server Codex.                                                                                                      |
| `appServer`                | app-server stdio géré                 | Paramètres de transport, de commande, d’authentification, d’approbation, de bac à sable et de délai d’attente. Le harnais ordinaire utilise par défaut un état propre à l’agent.   |
| `codexDynamicToolsLoading` | `"searchable"`                        | Utilisez `"direct"` pour placer directement les outils dynamiques OpenClaw dans le contexte initial des outils Codex.                                                              |
| `codexDynamicToolsExclude` | `[]`                                  | Noms supplémentaires d’outils dynamiques OpenClaw à omettre des tours de l’app-server Codex.                                                                                       |
| `codexPlugins`             | désactivé                             | Prise en charge native des Plugins/applications Codex, notamment l’accès optionnel aux applications de comptes connectés. Voir [Plugins Codex natifs](/fr/plugins/codex-native-plugins). |
| `computerUse`              | désactivé                             | Configuration de Codex Computer Use. Voir [Codex Computer Use](/fr/plugins/codex-computer-use).                                                                                       |
| `supervision`              | désactivée                            | Catalogue des sessions natives non archivées, poursuite des branches locales et politique des outils d’agent. Voir [Supervision Codex](/plugins/codex-supervision).                |

## Supervision

La supervision répertorie les sessions Codex non archivées de l’ordinateur du Gateway et
des nœuds appairés ayant donné leur accord. Activez-la indépendamment du harnais d’agent :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Champs de `supervision` :

| Champ                 | Valeur par défaut             | Signification                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`             | `false`                       | Publie le catalogue local des sessions et, sur le Gateway, agrège les catalogues des nœuds appairés ayant donné leur accord pour la page Sessions Codex.                                                                                                                                                                             |
| `endpoints`           | point de terminaison local intégré | Cibles de points de terminaison de compatibilité et avancées pour l’agent de supervision Codex conservé et les outils MCP autonomes. Le catalogue destiné aux utilisateurs et le flux de branchement ignorent ces cibles et utilisent l’App Server de supervision résolu à partir de `appServer`.                                     |
| `allowRawTranscripts` | `false`                       | Lorsque la supervision est activée, autorise les agents autonomes ou les outils MCP autonomes à lire les transcriptions et les champs de liste dérivés de celles-ci. Les lectures de `codex_threads` limitées aux métadonnées restent disponibles. Ne contrôle pas la poursuite authentifiée dans l’interface Control UI.                 |
| `allowWriteControls`  | `false`                       | Lorsque la supervision est activée, autorise les opérations autonomes de duplication, de renommage, d’archivage et de désarchivage de `codex_threads`, ainsi que les opérations autonomes MCP d’envoi, d’orientation et d’interruption. Ne contourne pas les autres vérifications de liaison, d’hôte, d’état ou de confirmation.           |

Les entrées de point de terminaison acceptent les champs suivants :

| Champ          | S’applique à   | Signification                                                                          |
| -------------- | -------------- | -------------------------------------------------------------------------------------- |
| `id`           | tous           | Identifiant stable du point de terminaison.                                             |
| `label`        | tous           | Libellé d’affichage facultatif.                                                         |
| `transport`    | tous           | `"stdio-proxy"` ou `"websocket"`.                                                       |
| `command`      | `stdio-proxy`  | Commande App Server facultative.                                                        |
| `args`         | `stdio-proxy`  | Arguments de commande facultatifs.                                                      |
| `cwd`          | `stdio-proxy`  | Répertoire de travail facultatif du processus enfant.                                   |
| `url`          | `websocket`    | URL WebSocket ou URL de socket locale prise en charge, obligatoire.                     |
| `authTokenEnv` | `websocket`    | Variable d’environnement facultative dont la valeur authentifie le point de terminaison. |

La page **Sessions Codex** utilise l’App Server de supervision du Plugin et affiche
uniquement les sessions non archivées. Sans paramètres de connexion `appServer`
explicites, cette connexion utilise un stdio géré dans le répertoire personnel de
l’utilisateur. Les lignes locales enregistrées ou inactives peuvent créer un Chat
verrouillé sur un modèle avec un historique utilisateur et assistant limité jusqu’au
dernier tour source terminal conservé. Sa liaison privée conserve la duplication de
l’instantané, la branche canonique issue d’`appServer`, l’injection de l’historique et
les tours ultérieurs sur cette connexion. Le premier démarrage canonique utilise la
paire renvoyée par la duplication. Lors des reprises ultérieures, les remplacements de
modèle et de fournisseur OpenClaw sont omis afin que Codex restaure la paire persistante
du fil canonique ; une modification native distincte peut mettre à jour cette paire,
mais le modèle externe et la chaîne de repli ne la remplacent jamais. Les lignes
enregistrées et inactives peuvent être archivées après confirmation qu’aucun autre
exécuteur n’est présent, sauf si une autre liaison OpenClaw active possède la cible
exacte ou l’un de ses descendants générés non archivés. OpenClaw suit la pagination
des descendants de Codex et échoue de manière fermée en cas d’erreur d’énumération,
de cycle ou d’épuisement de la limite de sécurité. La confirmation couvre toujours
les clients natifs inconnus et la condition de concurrence entre l’état et l’archivage.
Un Chat supervisé verrouillé sur un modèle ne peut pas être supprimé tant qu’il protège
la liaison native. Les sources actives ne peuvent ni créer une branche ni être archivées,
mais un Chat supervisé existant peut toujours être ouvert. Chaque ligne d’un nœud
appairé reste en lecture seule ; le transport du nœud ne fournit pas encore le cycle
de vie en diffusion continue requis par le harnais.

`appServer.homeScope: "user"` seul modifie le répertoire personnel Codex utilisé par
un processus de harnais géré ; il ne publie pas le catalogue du parc. L’activation de
la supervision ne modifie pas la valeur par défaut du harnais. À la place, la connexion
de supervision distincte utilise par défaut un stdio géré dans le répertoire personnel
de l’utilisateur lorsqu’aucun paramètre de connexion `appServer` explicite n’existe.
Les paramètres explicites sont respectés pour cette connexion. Les liaisons supervisées
en attente et validées conservent cette connexion pour chaque tour ; une supervision
désactivée ou une dérive de la connexion ou du cycle de vie provoque un échec fermé au
lieu d’un repli vers le harnais du répertoire personnel de l’agent. La connexion par
défaut partage les sessions enregistrées avec les clients Codex natifs, mais pas leur
état d’activité local au processus.

Les anciens paramètres `plugins.entries.codex-supervisor` sont retirés. Exécutez
`openclaw doctor --fix` pour migrer l’ancienne entrée, les définitions des points de
terminaison, les indicateurs de politique et les références d’autorisation ou de refus
du Plugin vers ce bloc. Les valeurs canoniques explicites de
`codex.config.supervision` prévalent en cas de conflit.

## Transport de l’app-server

Pour les tours ordinaires du harnais, OpenClaw lance le binaire Codex géré fourni
avec le Plugin officiel (actuellement `@openai/codex` `0.144.1`) :

```bash
codex app-server --listen stdio://
```

Cela lie la version de l’app-server au Plugin officiel `codex` plutôt qu’à une
éventuelle installation locale distincte de la CLI Codex. Définissez
`appServer.command` uniquement si vous souhaitez intentionnellement utiliser un autre
exécutable. Les tours gérés ordinaires utilisant le répertoire personnel isolé par
défaut de l’agent privilégient ce paquet épinglé même lorsqu’un paquet d’application
de bureau macOS est installé. Lorsque
[Computer Use](/fr/plugins/codex-computer-use) est activé, ou lorsque `homeScope` vaut
`"user"` et peut charger l’état natif de Computer Use, le démarrage géré privilégie
plutôt le binaire de l’application de bureau qui détient les autorisations macOS
requises. La même règle donnant la priorité à l’application de bureau s’applique
lorsque la configuration Codex effective du répertoire personnel isolé d’un agent
active Computer Use natif. Si aucun paquet d’application de bureau n’est installé,
OpenClaw se replie sur le binaire du paquet épinglé.

Le transfert de l’exécutable et le cloisonnement de la configuration native coordonnent
les clients au sein d’un même processus Gateway en cours d’exécution. Redémarrez le
Gateway après qu’un autre processus a modifié la configuration native du Plugin Codex.

La supervision résout une connexion distincte. En l’absence de paramètres de connexion
`appServer` explicites, elle utilise un stdio géré avec `homeScope: "user"` ; le
harnais ordinaire reste un stdio géré avec `homeScope: "agent"`. Les paramètres de
connexion explicites sont respectés par les deux chemins. Définissez explicitement
`homeScope: "user"` lorsque le harnais ordinaire doit partager `$CODEX_HOME` (ou
`~/.codex`) avec les clients natifs. Une liaison supervisée privée utilise la connexion
de supervision indépendamment de la valeur par défaut du harnais ordinaire. Les
processus App Server indépendants conservent des états d’activité et d’approbation
distincts.

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

Champs de `appServer` :

| Champ                                         | Valeur par défaut                                      | Signification                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; la valeur explicite `"unix"` se connecte au socket de contrôle local ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                                                     |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isole l’état ordinaire du harnais pour chaque agent OpenClaw. `"user"` est une option explicite qui partage le `$CODEX_HOME` natif ou `~/.codex`, utilise l’authentification native et active la gestion des fils de discussion réservée au propriétaire. La portée utilisateur prend en charge le transport stdio local ou Unix. Pour la connexion de supervision distincte, une valeur non définie est résolue en `"user"` pour stdio ou Unix et en `"agent"` pour WebSocket. |
| `command`                                     | binaire Codex géré                                     | Exécutable pour le transport stdio. Laissez cette valeur non définie pour utiliser le binaire géré.                                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                                    |
| `url`                                         | non défini                                             | URL du serveur d’application WebSocket ou URL `unix://`. Un chemin Unix explicitement vide sélectionne le socket de contrôle canonique du répertoire personnel de l’utilisateur.                                                                                                                                                                                                                       |
| `authToken`                                   | non défini                                             | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou une valeur SecretInput telle que `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                    |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité.                                                                                                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | non défini                                             | Racine distante de l’espace de travail du serveur d’application Codex. Lorsqu’elle est définie, OpenClaw déduit la racine locale de l’espace de travail à partir de l’espace de travail OpenClaw résolu, conserve le suffixe du répertoire de travail actuel sous cette racine distante et envoie uniquement le répertoire de travail final du serveur d’application à Codex. Si le répertoire de travail se trouve hors de la racine résolue de l’espace de travail OpenClaw, OpenClaw échoue de manière sécurisée au lieu d’envoyer un chemin local au Gateway vers le serveur d’application distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration des appels du plan de contrôle du serveur d’application.                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Période d’inactivité après que Codex a accepté un tour ou après une requête du serveur d’application limitée au tour, pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                      |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde de progression et d’inactivité avant achèvement utilisée après un transfert vers un outil, l’achèvement d’un outil natif, une progression brute de l’assistant après l’outil, l’achèvement du raisonnement brut ou une progression du raisonnement, pendant qu’OpenClaw attend `turn/completed`. Utilisez-la pour les charges de travail fiables ou lourdes dans lesquelles la synthèse après l’outil peut légitimement rester silencieuse plus longtemps que le délai final de publication de l’assistant. |
| `mode`                                        | `"yolo"` sauf si les exigences locales de Codex interdisent YOLO | Préréglage pour une exécution YOLO ou examinée par le gardien.                                                                                                                                                                                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation autorisée du gardien | Politique d’approbation native de Codex envoyée au démarrage du fil de discussion, à sa reprise et au tour.                                                                                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` ou un bac à sable autorisé du gardien | Mode de bac à sable natif de Codex envoyé au démarrage et à la reprise du fil de discussion. Les bacs à sable OpenClaw actifs restreignent les tours `danger-full-access` à `workspace-write` dans Codex ; l’indicateur réseau du tour suit les règles de trafic sortant du bac à sable OpenClaw.                                                                                                       |
| `approvalsReviewer`                           | `"user"` ou un examinateur autorisé du gardien         | Utilisez `"auto_review"` pour permettre à Codex d’examiner les demandes d’approbation natives lorsque cela est autorisé.                                                                                                                                                                                                                                                                                 |
| `defaultWorkspaceDir`                         | répertoire actuel du processus                         | Espace de travail utilisé par `/codex bind` lorsque `--cwd` est omis.                                                                                                                                                                                                                                                                                                                                  |
| `serviceTier`                                 | non défini                                             | Niveau de service facultatif du serveur d’application Codex. `"priority"` active le routage en mode rapide, `"flex"` demande un traitement flexible et `null` efface la substitution. L’ancienne valeur `"fast"` est acceptée comme `"priority"`.                                                                                                                                                       |
| `networkProxy`                                | désactivé                                              | Active la mise en réseau du profil d’autorisations Codex pour les commandes du serveur d’application. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la choisit avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                               |
| `experimental.sandboxExecServer`              | `false`                                                | Option d’aperçu qui enregistre auprès du serveur d’application Codex pris en charge un environnement Codex reposant sur le bac à sable OpenClaw, afin que l’exécution native de Codex puisse s’effectuer dans le bac à sable OpenClaw actif.                                                                                                                                                              |

`appServer.networkProxy` est explicite, car cette option modifie le contrat du
bac à sable Codex. Lorsqu’elle est activée, OpenClaw définit également
`features.network_proxy.enabled` et `default_permissions` dans la configuration
du fil de discussion Codex afin que le profil d’autorisations généré puisse
démarrer la mise en réseau gérée par Codex. Par défaut, OpenClaw génère un nom
de profil `openclaw-network-<fingerprint>` résistant aux collisions à partir du
corps du profil ; utilisez `profileName` uniquement lorsqu’un nom local stable
est requis.

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

Si l’environnement d’exécution normal de l’app-server devait être `danger-full-access`, l’activation de
`networkProxy` utilise à la place, pour le profil d’autorisations généré, un accès au système de fichiers de type espace de travail. L’application des restrictions réseau gérée par Codex repose sur une mise en bac à sable
du réseau ; un profil d’accès complet ne protégerait donc pas le trafic sortant.

Le Plugin bloque les négociations app-server anciennes ou sans version : l’app-server Codex
doit déclarer la version stable `0.143.0` ou une version ultérieure.

OpenClaw considère les URL WebSocket d’app-server hors local loopback comme distantes et exige
une authentification WebSocket portant une identité via `appServer.authToken` ou un
en-tête `Authorization`. `appServer.authToken` et chaque valeur
`appServer.headers.*` peuvent être un SecretInput ; l’environnement d’exécution des secrets résout les SecretRefs et les
formes abrégées de variables d’environnement avant qu’OpenClaw ne construise les options de démarrage de l’app-server, et les
SecretRefs structurées non résolues provoquent un échec avant l’envoi de tout jeton ou en-tête. Lorsque des
plugins Codex natifs sont configurés, OpenClaw utilise le plan de contrôle des plugins de l’app-server
connecté pour installer ou actualiser ces plugins, puis actualise
l’inventaire des applications afin que les applications appartenant aux plugins soient visibles par le fil Codex. `app/list` reste
la source de référence pour l’inventaire et les métadonnées, mais la politique OpenClaw
détermine si `thread/start` envoie `config.apps[appId].enabled = true` pour une
application accessible répertoriée, même si Codex l’indique actuellement comme désactivée. Les identifiants d’application inconnus ou
manquants restent refusés par défaut ; ce chemin active uniquement les plugins de la place de marché
via `plugin/install` et actualise l’inventaire. Ne connectez OpenClaw qu’à des
app-servers distants jugés fiables pour accepter les installations de plugins gérées par OpenClaw
et les actualisations de l’inventaire des applications.

## Modes d’approbation et de bac à sable

Les sessions app-server stdio locales utilisent par défaut le mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Cette posture d’opérateur local de confiance permet
aux tours OpenClaw sans surveillance et aux Heartbeats de progresser sans invites d’approbation
natives auxquelles personne n’est présent pour répondre.

Si le fichier local des exigences système de Codex interdit les valeurs implicites YOLO d’approbation,
de réviseur ou de bac à sable, OpenClaw traite à la place la valeur implicite par défaut comme guardian
et sélectionne les autorisations guardian permises. `tools.exec.mode: "auto"`
impose également des approbations Codex examinées par guardian et ne conserve pas les substitutions
héritées non sécurisées `approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ;
définissez `tools.exec.mode: "full"` pour adopter intentionnellement une posture sans approbation.
Les entrées `[[remote_sandbox_config]]` correspondant au nom d’hôte dans le même fichier d’exigences
sont respectées pour la décision relative à la valeur par défaut du bac à sable.

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
valeur de réviseur `guardian_subagent` reste acceptée comme alias de compatibilité,
mais les nouvelles configurations doivent utiliser `auto_review`.

Lorsqu’un bac à sable OpenClaw est actif, le processus app-server Codex local s’exécute toujours
sur l’hôte du Gateway. OpenClaw désactive donc le Code Mode natif de Codex,
les serveurs MCP de l’utilisateur et l’exécution de plugins adossés à des applications pour ce tour, au lieu de
considérer la mise en bac à sable côté hôte de Codex comme équivalente au moteur de bac à sable
d’OpenClaw. L’accès au shell est exposé au moyen d’outils dynamiques adossés au bac à sable OpenClaw,
tels que `sandbox_exec` et `sandbox_process`, lorsque les outils normaux d’exécution et de processus
sont disponibles.

<Note>
Sur les hôtes de bac à sable OpenClaw adossés à Docker (`agents.defaults.sandbox.mode` défini sur
un moteur Docker), `openclaw doctor` vérifie si l’hôte autorise les espaces de noms
utilisateur non privilégié et, lorsque la sortie réseau du bac à sable Docker est désactivée, les espaces de noms
réseau dont le `bwrap` imbriqué de Codex a besoin pour l’exécution du shell en
`workspace-write` dans le conteneur de bac à sable. L’échec de la vérification se manifeste généralement
par `bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sur les
hôtes Ubuntu/AppArmor. Corrigez la politique d’espaces de noms de l’hôte signalée pour l’utilisateur du
service OpenClaw et redémarrez le Gateway ; privilégiez un profil AppArmor limité au
processus de service plutôt que la solution de repli globale à l’hôte
`kernel.apparmor_restrict_unprivileged_userns=0`, et n’accordez pas
de privilèges plus larges au conteneur Docker uniquement pour satisfaire le `bwrap` imbriqué.
</Note>

## Exécution native en bac à sable

La valeur stable par défaut refuse l’exécution en cas d’incertitude : la mise en bac à sable OpenClaw active désactive les surfaces
d’exécution natives de Codex qui s’exécuteraient autrement depuis l’hôte de l’app-server Codex.
Utilisez `appServer.experimental.sandboxExecServer: true` uniquement si vous souhaitez
essayer la prise en charge des environnements distants de Codex avec le moteur de bac à sable d’OpenClaw.
Ce chemin en préversion fonctionne avec toutes les versions prises en charge de l’app-server Codex.

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

Lorsque l’option est activée et que la session OpenClaw actuelle est en bac à sable, OpenClaw
démarre un serveur d’exécution en local loopback adossé au bac à sable actif, l’enregistre
auprès de l’app-server Codex, puis démarre le fil et le tour Codex avec cet
environnement appartenant à OpenClaw. Si l’app-server ne peut pas enregistrer l’environnement,
l’exécution échoue de manière sécurisée au lieu de revenir silencieusement à une exécution sur l’hôte.

Ce chemin en préversion est uniquement local. Un app-server WebSocket distant ne peut pas atteindre
le serveur d’exécution en local loopback, sauf s’il s’exécute sur le même hôte ; OpenClaw
rejette donc cette combinaison.

## Isolation de l’authentification et de l’environnement

Dans le répertoire personnel par agent par défaut, l’authentification est sélectionnée dans l’ordre suivant :

1. Un profil d’authentification Codex OpenClaw explicite pour l’agent.
2. Le compte existant de l’app-server dans le répertoire personnel Codex de cet agent.
3. Pour les lancements locaux de l’app-server stdio uniquement, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte d’app-server n’est présent et qu’une authentification OpenAI reste
   requise.

Lorsqu’OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT (type d’identifiant OAuth ou
jeton), il supprime `CODEX_API_KEY` et `OPENAI_API_KEY` du
processus enfant Codex lancé. Cela permet de conserver les clés d’API au niveau du Gateway
pour les embeddings ou les modèles OpenAI directs, sans que les tours natifs de l’app-server Codex
ne soient facturés accidentellement via l’API.

Les profils explicites de clé d’API Codex et la solution de repli sur une clé d’environnement pour stdio local utilisent
la connexion de l’app-server au lieu de l’environnement hérité du processus enfant. Les connexions à un app-server
WebSocket ne reçoivent pas la solution de repli sur une clé d’API de l’environnement du Gateway ; utilisez un profil d’authentification
explicite ou le propre compte de l’app-server distant.

Les lancements d’app-server stdio héritent par défaut de l’environnement du processus OpenClaw.
OpenClaw gère la passerelle de compte de l’app-server Codex et définit `CODEX_HOME` sur un
répertoire propre à l’agent dans l’état OpenClaw de cet agent. Ainsi, la
configuration, les comptes, le cache et les données des plugins, ainsi que l’état des fils Codex restent limités à l’agent
OpenClaw, au lieu de provenir du répertoire personnel `~/.codex` de l’opérateur.

Définissez `appServer.homeScope: "user"` pour partager l’état natif de Codex avec Codex
Desktop et la CLI. Ce mode de répertoire personnel utilisateur local prend en charge stdio géré et
le transport Unix explicite. Il utilise `$CODEX_HOME` lorsque celui-ci est défini et `~/.codex`
dans le cas contraire, notamment pour l’authentification native, la configuration, les plugins et les fils.
OpenClaw ignore sa passerelle de profil d’authentification pour l’app-server. Les tours dont le propriétaire est
vérifié peuvent utiliser `codex_threads` pour répertorier les fils (avec un filtre `search` facultatif),
les lire, les dupliquer, les renommer, les archiver et les désarchiver. Dupliquez un fil avant
de le poursuivre dans OpenClaw ; les processus Codex indépendants ne coordonnent pas
les écritures simultanées sur un même fil.

Cette activation facultative de `homeScope` s’applique aux sessions ordinaires du harnais. Une conversation créée
au moyen de Codex Sessions utilise plutôt sa connexion de supervision privée, ce qui
préserve l’authentification et la configuration du fournisseur de la connexion native pour la
branche canonique et les reprises ultérieures.

Dans une conversation supervisée verrouillée sur un modèle, `codex_threads` ne peut pas attacher une autre
duplication ni archiver le fil natif lié à la conversation. La liste et la lecture des seules métadonnées
restent disponibles. La lecture des transcriptions brutes nécessite `allowRawTranscripts` ; lorsque cette
option est désactivée, la recherche dans la liste est également rejetée, car la recherche native peut correspondre
aux aperçus de transcription. Le renommage, le désarchivage, la duplication détachée et l’archivage d’un
fil sans rapport qui n’appartient pas à une autre conversation OpenClaw nécessitent
`allowWriteControls`. Aucune de ces options ne contourne une liaison verrouillée.

OpenClaw ne réécrit pas `HOME` pour les lancements locaux normaux de l’app-server.
Les sous-processus exécutés par Codex, tels que `openclaw`, `gh`, `git`, les CLI
cloud et les commandes shell, voient le répertoire personnel normal du processus et peuvent trouver la configuration et les
jetons du répertoire personnel utilisateur. Codex peut également découvrir `$HOME/.agents/skills` et
`$HOME/.agents/plugins/marketplace.json` ; cette découverte de `.agents` est
intentionnellement partagée avec le répertoire personnel de l’opérateur et distincte de l’état isolé
`~/.codex`.

Dans la portée d’agent par défaut, les plugins OpenClaw et les instantanés de Skills OpenClaw
continuent de transiter par le propre registre de plugins et le chargeur de Skills d’OpenClaw ; les ressources
personnelles Codex de `~/.codex` ne le font pas. Si vous disposez de compétences CLI Codex ou de
plugins utiles provenant d’un répertoire personnel Codex qui doivent faire partie d’un agent OpenClaw
isolé, inventoriez-les explicitement :

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

`appServer.clearEnv` n’affecte que le processus enfant de l’app-server Codex lancé.
OpenClaw retire `CODEX_HOME` et `HOME` de cette liste pendant la normalisation du lancement
local : `CODEX_HOME` reste orienté vers la portée d’agent ou d’utilisateur sélectionnée,
et `HOME` reste hérité afin que les sous-processus puissent utiliser l’état normal du répertoire personnel utilisateur.

## Outils dynamiques

Les outils dynamiques Codex utilisent par défaut le chargement `searchable`, exposé dans l’espace de noms
`openclaw` avec `deferLoading: true`. OpenClaw n’expose pas
les outils dynamiques qui dupliquent les opérations natives de Codex sur l’espace de travail ou la propre
surface de recherche d’outils de Codex :

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

La plupart des autres outils d’intégration OpenClaw, tels que la messagerie, les médias, Cron,
le navigateur, les nœuds, le Gateway, `heartbeat_respond` et `web_search`, sont disponibles
via la recherche d’outils Codex dans cet espace de noms. Cela réduit le contexte initial du
modèle. Un petit ensemble d’outils reste directement appelable, quelle que soit la valeur de
`codexDynamicToolsLoading`, car la recherche d’outils Codex peut être indisponible ou
ne résoudre qu’un univers limité aux connecteurs : `agents_list`, `sessions_spawn` et
`sessions_yield`. Les instructions du développeur continuent d’orienter les sous-agents Codex ordinaires
vers le `spawn_agent` natif pour les travaux de sous-agent natifs de Codex, tandis que
`sessions_spawn` reste disponible pour une délégation OpenClaw ou ACP explicite.
Les réponses provenant uniquement de l’outil de messagerie restent également directes, car il s’agit d’un
contrat de contrôle du tour.

Les outils marqués `catalogMode: "direct-only"`, notamment l’outil `computer`
d’OpenClaw, sont regroupés sous `openclaw_direct`. OpenClaw ajoute cet espace de noms à la
liste `code_mode.direct_only_tool_namespaces` de Codex sans remplacer les
entrées fournies par l’opérateur. Codex expose donc ces outils en tant que
`DirectModelOnly` dans les fils normaux et ceux limités au Code Mode, au lieu de les acheminer
par l’intermédiaire d’appels `tools.*` du Code Mode imbriqué. Cette frontière est nécessaire pour
les résultats contenant des images : la sérialisation du Code Mode imbriqué réduit la sortie d’image à du
texte, ce qui supprimerait la capture d’écran nécessaire à l’action informatique suivante.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un app-server
Codex personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du débogage
de la charge utile complète des outils.

## Délais d’expiration

Les appels d’outils dynamiques gérés par OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs`. Chaque requête Codex `item/tool/call` utilise le
premier délai d’expiration disponible dans cet ordre :

- Un argument `timeoutMs` positif propre à l’appel.
- Pour `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Pour `image_generate` sans délai d’expiration configuré, la valeur par défaut
  de 120 secondes pour la génération d’images.
- Pour l’outil de compréhension des médias `image`, `tools.media.image.timeoutSeconds`
  converti en millisecondes, ou la valeur par défaut de 60 secondes pour les médias.
  Pour la compréhension d’images, ce délai s’applique à la requête elle-même et
  n’est pas réduit par les travaux de préparation antérieurs.
- Pour l’outil `message`, une valeur par défaut fixe de 120 secondes.
- La valeur par défaut de 90 secondes pour les outils dynamiques.

Ce mécanisme de surveillance constitue le budget externe de l’appel dynamique
`item/tool/call`. Les délais d’expiration des requêtes propres aux fournisseurs
s’exécutent à l’intérieur de cet appel et conservent leur propre sémantique.
Les budgets des outils dynamiques sont plafonnés à 600000 ms. En cas
d’expiration, OpenClaw interrompt le signal de l’outil lorsque cela est pris en
charge et renvoie à Codex une réponse d’échec de l’outil dynamique afin que le
tour puisse continuer au lieu de laisser la session dans l’état `processing`.

Après que Codex a accepté un tour, et après qu’OpenClaw a répondu à une requête
du serveur d’application limitée à ce tour, le harnais attend de Codex qu’il
progresse dans le tour en cours et termine finalement le tour natif avec
`turn/completed`. Si le serveur d’application reste silencieux pendant
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw tente d’interrompre le tour
Codex, enregistre un diagnostic d’expiration et libère la voie de session
OpenClaw afin que les messages de discussion suivants ne restent pas en file
d’attente derrière un tour natif obsolète.

La plupart des notifications non terminales du même tour désactivent ce court
mécanisme de surveillance, car Codex a prouvé que le tour est toujours actif.
Les transferts d’outils utilisent un budget d’inactivité post-outil plus long :
après qu’OpenClaw a renvoyé une réponse `item/tool/call`, après l’achèvement
d’éléments d’outils natifs tels que `commandExecution`, après l’achèvement brut
de `custom_tool_call_output`, ainsi qu’après une progression brute de
l’assistant post-outil, l’achèvement d’un raisonnement brut ou une progression
du raisonnement. La protection utilise
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré
et, à défaut, une valeur de cinq minutes. Ce même budget post-outil prolonge
également le mécanisme de surveillance de la progression pendant la fenêtre de
synthèse silencieuse précédant l’émission par Codex du prochain événement du
tour en cours. Les achèvements de raisonnement, les achèvements `agentMessage`
de commentaire et les progressions brutes de raisonnement ou de l’assistant
avant un outil peuvent être suivis d’une réponse finale automatique ; ils
utilisent donc la protection de réponse post-progression au lieu de libérer
immédiatement la voie de session. Seuls les éléments `agentMessage` achevés,
finaux et hors commentaire, ainsi que les achèvements bruts de l’assistant
avant un outil, activent la libération après sortie de l’assistant : si Codex
reste ensuite silencieux sans `turn/completed`, OpenClaw tente d’interrompre le
tour natif et libère la voie de session. Les échecs reproductibles sans risque
du serveur d’application stdio, notamment les expirations d’inactivité à
l’achèvement du tour sans preuve liée à l’assistant, à un outil, à un élément
actif ou à un effet secondaire, font l’objet d’une nouvelle tentative unique
avec une nouvelle instance du serveur d’application. Les expirations non sûres
entraînent toujours le retrait du client du serveur d’application bloqué et la
libération de la voie de session OpenClaw. Elles effacent également
l’association obsolète au fil natif au lieu de la rejouer automatiquement. Les
expirations de surveillance de l’achèvement affichent un texte propre à Codex :
les cas reproductibles sans risque indiquent que la réponse peut être
incomplète, tandis que les cas non sûrs demandent à l’utilisateur de vérifier
l’état actuel avant de réessayer. Les diagnostics publics d’expiration incluent
des champs structurels tels que la dernière méthode de notification du serveur
d’application, l’identifiant, le type et le rôle de l’élément de réponse brute
de l’assistant, le nombre de requêtes et d’éléments actifs, ainsi que l’état de
la surveillance activée. Lorsque la dernière notification est un élément de
réponse brute de l’assistant, ils incluent également un aperçu de longueur
limitée du texte de l’assistant. Ils n’incluent pas le contenu brut des invites
ni des outils.

## Découverte des modèles

Par défaut, le Plugin Codex demande au serveur d’application les modèles
disponibles. La disponibilité des modèles relève du serveur d’application
Codex ; la liste peut donc changer lorsqu’OpenClaw met à niveau la version
intégrée de `@openai/codex` ou lorsqu’un déploiement fait pointer
`appServer.command` vers un autre binaire Codex. La disponibilité peut également
dépendre du compte. Utilisez `/codex models` sur un Gateway en cours d’exécution
pour afficher le catalogue actif de ce harnais et de ce compte.

Si la découverte échoue ou expire, OpenClaw utilise un catalogue de secours
intégré :

| Identifiant du modèle | Nom d’affichage | Niveaux d’effort de raisonnement |
| --------------------- | --------------- | -------------------------------- |
| `gpt-5.5`             | gpt-5.5         | low, medium, high, xhigh         |
| `gpt-5.4-mini`        | GPT-5.4-Mini    | low, medium, high, xhigh         |

<Note>
Le harnais intégré actuel est `@openai/codex` `0.144.1`. Une requête
`model/list` envoyée à ce serveur d’application intégré a renvoyé les lignes
publiques suivantes dans le sélecteur :

| Identifiant du modèle | Modalités d’entrée | Niveaux d’effort de raisonnement       |
| --------------------- | ------------------ | -------------------------------------- |
| `gpt-5.6-sol`         | text, image        | low, medium, high, xhigh, max, ultra   |
| `gpt-5.6-terra`       | text, image        | low, medium, high, xhigh, max, ultra   |
| `gpt-5.6-luna`        | text, image        | low, medium, high, xhigh, max          |
| `gpt-5.5`             | text, image        | low, medium, high, xhigh               |
| `gpt-5.4`             | text, image        | low, medium, high, xhigh               |
| `gpt-5.4-mini`        | text, image        | low, medium, high, xhigh               |
| `gpt-5.2`             | text, image        | low, medium, high, xhigh               |

Le catalogue du serveur d’application peut indiquer `ultra` ; les contrôles de
raisonnement d’OpenClaw exposent actuellement les niveaux jusqu’à `max`.

Les lignes actives du sélecteur dépendent du compte et peuvent changer selon le
compte, le catalogue Codex ou la version intégrée ; exécutez `/codex models`
pour obtenir la liste actuelle au lieu de vous fier à un tableau établi à un
instant donné. Des modèles masqués peuvent également apparaître dans le
catalogue du serveur d’application pour des flux internes ou spécialisés sans
constituer des choix habituels dans le sélecteur de modèles.
</Note>

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

Désactivez la découverte lorsque vous souhaitez éviter l’interrogation de
Codex au démarrage et utiliser uniquement le catalogue de secours :

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

Codex gère lui-même `AGENTS.md` grâce à la découverte native de la
documentation du projet. OpenClaw n’écrit pas de fichiers synthétiques de
documentation de projet Codex et ne dépend pas des noms de fichiers de secours
de Codex pour les fichiers de personnalité, car ces solutions de secours ne
s’appliquent que lorsque `AGENTS.md` est absent.

Pour assurer la parité avec l’espace de travail OpenClaw, le harnais Codex
transmet les autres fichiers d’amorçage comme instructions du développeur,
mais pas de manière identique :

- `TOOLS.md` est transmis comme instructions du développeur Codex
  **héritées**, de sorte que les sous-agents Codex natifs créés pendant le tour
  le voient également.
- `SOUL.md`, `IDENTITY.md` et `USER.md` sont transmis comme instructions de
  collaboration **limitées au tour**. Les sous-agents Codex natifs ne les
  héritent pas, ce qui évite que leurs tours reprennent la personnalité et le
  profil utilisateur de l’agent parent.
- La liste compacte des Skills OpenClaw chargés est également transmise comme
  instructions de collaboration du développeur limitées au tour, de sorte que
  les sous-agents Codex natifs ne l’héritent pas non plus.
- Le contenu de `HEARTBEAT.md` n’est pas injecté ; les tours Heartbeat
  reçoivent, en mode collaboration, une indication leur demandant de lire le
  fichier lorsqu’il existe et n’est pas vide.
- Le contenu de `MEMORY.md` provenant de l’espace de travail configuré de
  l’agent n’est pas inséré dans l’entrée du tour Codex natif lorsque des outils
  de mémoire sont disponibles pour cet espace de travail ; lorsqu’il existe,
  le harnais ajoute une brève indication relative à la mémoire de l’espace de
  travail dans les instructions de collaboration du développeur limitées au
  tour, et Codex doit utiliser `memory_search` ou `memory_get` lorsque la
  mémoire persistante est pertinente. Si les outils sont désactivés, si la
  recherche en mémoire est indisponible ou si l’espace de travail actif
  diffère de l’espace de travail de mémoire de l’agent, `MEMORY.md` emprunte à
  la place le chemin normal de contexte de tour de taille limitée.
- `BOOTSTRAP.md`, lorsqu’il est présent, est transmis comme contexte de
  référence d’entrée du tour OpenClaw.

## Remplacements par variables d’environnement

Les remplacements par variables d’environnement restent disponibles pour les
tests locaux :

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` contourne le binaire géré lorsque
`appServer.command` n’est pas défini.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` a été supprimé. Utilisez plutôt
`plugins.entries.codex.config.appServer.mode: "guardian"`, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` pour un test local ponctuel. La
configuration est préférable pour les déploiements reproductibles, car elle
conserve le comportement du Plugin dans le même fichier vérifié que le reste
de la configuration du harnais Codex.

## Pages connexes

- [Harnais Codex](/fr/plugins/codex-harness)
- [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Supervision de Codex](/plugins/codex-supervision)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Utilisation de l’ordinateur par Codex](/fr/plugins/codex-computer-use)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Référence de configuration](/fr/gateway/configuration-reference)
