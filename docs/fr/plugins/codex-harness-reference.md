---
read_when:
    - Vous avez besoin de chaque champ de configuration du harnais Codex
    - Vous modifiez le comportement du transport, de l’authentification, de la découverte ou des délais d’expiration de l’app-server
    - Vous déboguez le démarrage du harnais Codex, la découverte des modèles ou l’isolation de l’environnement
summary: Référence de configuration, d’authentification, de découverte et du serveur d’application pour le harnais Codex
title: Référence du harnais Codex
x-i18n:
    generated_at: "2026-07-12T15:32:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Cette référence couvre la configuration détaillée du plugin officiel `codex`.
Pour les décisions de configuration et de routage, commencez par
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

Champs de premier niveau :

| Champ                      | Valeur par défaut                | Signification                                                                                                                                                                                                   |
| -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | activé                           | Paramètres de découverte des modèles pour `model/list` de l'app-server Codex.                                                                                                                                   |
| `appServer`                | app-server stdio géré            | Paramètres de transport, de commande, d'authentification, d'approbation, de bac à sable et de délai d'expiration. Le harnais ordinaire utilise par défaut un état propre à l'agent.                               |
| `codexDynamicToolsLoading` | `"searchable"`                   | Utilisez `"direct"` pour placer directement les outils dynamiques OpenClaw dans le contexte initial des outils Codex.                                                                                           |
| `codexDynamicToolsExclude` | `[]`                             | Noms supplémentaires d'outils dynamiques OpenClaw à omettre dans les tours de l'app-server Codex.                                                                                                               |
| `codexPlugins`             | désactivé                        | Prise en charge native des plugins/applications Codex, y compris l'accès facultatif aux applications des comptes connectés. Voir [Plugins Codex natifs](/fr/plugins/codex-native-plugins).                          |
| `computerUse`              | désactivé                        | Configuration de Codex Computer Use. Voir [Codex Computer Use](/fr/plugins/codex-computer-use).                                                                                                                     |
| `supervision`              | désactivé                        | Catalogue des sessions natives non archivées, poursuite des branches locales et politique des outils d'agent. Voir [Supervision Codex](/plugins/codex-supervision).                                             |

## Supervision

La supervision répertorie les sessions Codex non archivées de l'ordinateur du Gateway et
des nœuds appairés ayant donné leur accord. Activez-la indépendamment du harnais de l'agent :

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

| Champ                 | Valeur par défaut       | Signification                                                                                                                                                                                                                                                                                    |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`             | `false`                 | Publie le catalogue de sessions local et, sur le Gateway, agrège les catalogues des nœuds appairés ayant donné leur accord pour la page Sessions Codex.                                                                                                                                         |
| `endpoints`           | point de terminaison local intégré | Cibles de points de terminaison de compatibilité et avancées pour l'agent de supervision Codex conservé et les outils MCP autonomes. Le catalogue destiné aux utilisateurs et le flux de branches ignorent ces cibles et utilisent l'App Server de supervision résolu à partir de `appServer`. |
| `allowRawTranscripts` | `false`                 | Lorsque la supervision est activée, autorise les agents autonomes ou les outils MCP autonomes à lire les transcriptions et les champs de liste dérivés de celles-ci. Les lectures de métadonnées uniquement de `codex_threads` restent disponibles. Ne contrôle pas la poursuite authentifiée dans l'interface de contrôle. |
| `allowWriteControls`  | `false`                 | Lorsque la supervision est activée, autorise les opérations autonomes de duplication, de renommage, d'archivage et de désarchivage de `codex_threads`, ainsi que les opérations autonomes MCP d'envoi, de réorientation et d'interruption. Ne contourne pas les autres vérifications de liaison, d'hôte, d'état ou de confirmation. |

Les entrées de point de terminaison acceptent les champs suivants :

| Champ          | S'applique à   | Signification                                                                        |
| -------------- | -------------- | ------------------------------------------------------------------------------------ |
| `id`           | tous           | Identifiant stable du point de terminaison.                                          |
| `label`        | tous           | Libellé d'affichage facultatif.                                                      |
| `transport`    | tous           | `"stdio-proxy"` ou `"websocket"`.                                                    |
| `command`      | `stdio-proxy`  | Commande App Server facultative.                                                     |
| `args`         | `stdio-proxy`  | Arguments de commande facultatifs.                                                  |
| `cwd`          | `stdio-proxy`  | Répertoire de travail facultatif du processus enfant.                                |
| `url`          | `websocket`    | URL WebSocket ou URL de socket local prise en charge, obligatoire.                   |
| `authTokenEnv` | `websocket`    | Variable d'environnement facultative dont la valeur authentifie le point de terminaison. |

La page **Sessions Codex** utilise l'App Server de supervision du plugin et affiche
uniquement les sessions non archivées. Sans paramètres de connexion `appServer`
explicites, cette connexion utilise un stdio géré dans le répertoire personnel de
l'utilisateur. Les lignes locales stockées ou inactives peuvent créer un Chat
verrouillé sur un modèle, avec un historique utilisateur et assistant limité
jusqu'au dernier tour source terminal conservé. Sa liaison privée maintient le
fork de l'instantané, la branche canonique issue d'`appServer`, l'injection de
l'historique et les tours ultérieurs sur cette connexion. Le premier démarrage
canonique utilise la paire renvoyée par le fork. Lors des reprises ultérieures,
OpenClaw omet les substitutions de modèle et de fournisseur afin que Codex
restaure la paire persistante du fil canonique ; une modification native distincte
peut mettre cette paire à jour, mais le modèle externe et la chaîne de repli ne
la remplacent jamais. Les lignes stockées et inactives peuvent être archivées
après confirmation qu'aucun autre exécuteur n'est présent, sauf si une autre
liaison OpenClaw active possède la cible exacte ou l'un de ses descendants générés
non archivés. OpenClaw suit la pagination des descendants de Codex et échoue de
manière fermée en cas d'erreur d'énumération, de cycle ou d'épuisement de la limite
de sécurité. La confirmation couvre toujours les clients natifs inconnus et la
condition de concurrence entre l'état et l'archivage. Un Chat supervisé verrouillé
sur un modèle ne peut pas être supprimé tant qu'il protège la liaison native.
Les sources actives ne peuvent ni créer de branche ni être archivées, mais un Chat
supervisé existant peut toujours être ouvert. Chaque ligne d'un nœud appairé reste
en lecture seule ; le transport du nœud ne fournit pas encore le cycle de vie de
diffusion en continu requis par le harnais.

`appServer.homeScope: "user"` seul modifie le répertoire personnel Codex utilisé
par un processus de harnais géré ; il ne publie pas le catalogue de la flotte.
L'activation de la supervision ne modifie pas la valeur par défaut du harnais.
À la place, la connexion de supervision distincte utilise par défaut un stdio géré
dans le répertoire personnel de l'utilisateur lorsqu'aucun paramètre de connexion
`appServer` explicite n'existe. Les paramètres explicites sont respectés pour cette
connexion. Les liaisons supervisées en attente et validées conservent cette
connexion pour chaque tour ; une supervision désactivée ou une dérive de connexion
ou de cycle de vie échoue de manière fermée au lieu de revenir au harnais utilisant
le répertoire personnel de l'agent. La connexion par défaut partage les sessions
stockées avec les clients Codex natifs, mais pas leur état d'activité propre au
processus.

Les paramètres hérités `plugins.entries.codex-supervisor` sont supprimés. Exécutez
`openclaw doctor --fix` pour migrer l'ancienne entrée, les définitions de points de
terminaison, les indicateurs de politique et les références d'autorisation ou de
refus de plugins vers ce bloc. Les valeurs canoniques explicites de
`codex.config.supervision` prévalent en cas de conflit.

## Transport de l'app-server

Pour les tours ordinaires du harnais, OpenClaw lance le binaire Codex géré fourni
avec le plugin officiel (actuellement `@openai/codex` `0.144.1`) :

```bash
codex app-server --listen stdio://
```

Cela maintient la version de l'app-server liée au plugin officiel `codex` plutôt
qu'à une autre CLI Codex installée localement. Définissez `appServer.command`
uniquement si vous souhaitez intentionnellement utiliser un autre exécutable.
Les tours gérés ordinaires utilisant le répertoire personnel d'agent isolé par
défaut privilégient ce paquet épinglé, même lorsqu'un bundle d'application de
bureau macOS est installé. Lorsque
[Computer Use](/fr/plugins/codex-computer-use) est activé, ou lorsque `homeScope`
vaut `"user"` et peut charger l'état natif de Computer Use, le démarrage géré
privilégie plutôt le binaire de l'application de bureau qui détient les
autorisations macOS requises. La même règle donnant la priorité à l'application
de bureau s'applique lorsque la configuration Codex effective du répertoire
personnel isolé d'un agent active Computer Use natif. Si aucun bundle
d'application de bureau n'est installé, OpenClaw revient au binaire du paquet
épinglé.

Le transfert de l'exécutable et le cloisonnement de la configuration native
coordonnent les clients au sein d'un même processus Gateway en cours d'exécution.
Redémarrez le Gateway après qu'un autre processus a modifié la configuration
native du plugin Codex.

La supervision résout une connexion distincte. Sans paramètres de connexion
`appServer` explicites, elle utilise un stdio géré avec `homeScope: "user"` ;
le harnais ordinaire conserve un stdio géré avec `homeScope: "agent"`. Les
paramètres de connexion explicites sont respectés par les deux chemins.
Définissez explicitement `homeScope: "user"` lorsque le harnais ordinaire doit
partager `$CODEX_HOME` (ou `~/.codex`) avec les clients natifs. Une liaison
supervisée privée utilise la connexion de supervision, quelle que soit la valeur
par défaut du harnais ordinaire. Les processus App Server indépendants conservent
des états actifs et d'approbation distincts.

Pour un app-server déjà en cours d'exécution, utilisez le transport WebSocket :

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
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; la valeur explicite `"unix"` établit une connexion au socket de contrôle local ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isole l’état ordinaire du harnais pour chaque agent OpenClaw. `"user"` est une option explicite qui partage le `$CODEX_HOME` natif ou `~/.codex`, utilise l’authentification native et active la gestion des fils de discussion réservée au propriétaire. La portée utilisateur prend en charge le transport stdio local ou Unix. Pour la connexion de supervision distincte, une valeur non définie est résolue en `"user"` pour stdio ou Unix et en `"agent"` pour WebSocket.     |
| `command`                                     | binaire Codex géré                                     | Exécutable pour le transport stdio. Laissez cette valeur non définie pour utiliser le binaire géré.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | non défini                                             | URL du serveur d’application WebSocket ou URL `unix://`. Un chemin Unix explicite vide sélectionne le socket de contrôle canonique du répertoire personnel de l’utilisateur.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | non défini                                             | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou une SecretInput telle que `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | non défini                                             | Racine distante de l’espace de travail de l’app-server Codex. Lorsqu’elle est définie, OpenClaw déduit la racine locale de l’espace de travail à partir de l’espace de travail OpenClaw résolu, conserve le suffixe du cwd actuel sous cette racine distante et envoie uniquement le cwd final de l’app-server à Codex. Si le cwd se trouve hors de la racine résolue de l’espace de travail OpenClaw, OpenClaw bloque l’opération au lieu d’envoyer un chemin local au Gateway à l’app-server distant. |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration des appels du plan de contrôle de l’app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre d’inactivité après que Codex a accepté un tour ou après une requête app-server limitée au tour, pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde d’inactivité d’achèvement et de progression utilisée après un transfert vers un outil, l’achèvement d’un outil natif, une progression brute de l’assistant après l’outil, l’achèvement du raisonnement brut ou une progression du raisonnement, pendant qu’OpenClaw attend `turn/completed`. Utilisez-la pour les charges de travail fiables ou lourdes où la synthèse après l’outil peut légitimement rester silencieuse plus longtemps que le budget final de restitution de l’assistant.                                |
| `mode`                                        | `"yolo"` sauf si les exigences locales de Codex interdisent YOLO | Préréglage pour une exécution YOLO ou examinée par un gardien.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation de gardien autorisée       | Politique d’approbation native de Codex envoyée au démarrage du fil de discussion, à sa reprise et au tour.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou un bac à sable de gardien autorisé  | Mode de bac à sable natif de Codex envoyé au démarrage et à la reprise du fil de discussion. Les bacs à sable OpenClaw actifs restreignent les tours `danger-full-access` à `workspace-write` de Codex ; l’indicateur réseau du tour suit la sortie réseau du bac à sable OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` ou un examinateur de gardien autorisé               | Utilisez `"auto_review"` pour permettre à Codex d’examiner les demandes d’approbation natives lorsque cela est autorisé.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | répertoire du processus actuel                              | Espace de travail utilisé par `/codex bind` lorsque `--cwd` est omis.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | non défini                                             | Niveau de service facultatif de l’app-server Codex. `"priority"` active le routage en mode rapide, `"flex"` demande le traitement flex et `null` supprime le remplacement. L’ancienne valeur `"fast"` est acceptée comme `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | désactivé                                               | Active la mise en réseau du profil d’autorisations Codex pour les commandes de l’app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la choisit avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Option expérimentale de préversion qui enregistre un environnement Codex adossé au bac à sable OpenClaw auprès de l’app-server Codex pris en charge, afin que l’exécution native de Codex puisse avoir lieu dans le bac à sable OpenClaw actif.                                                                                                                                                                                                            |

`appServer.networkProxy` est explicite, car il modifie le contrat du bac à sable
Codex. Lorsqu’il est activé, OpenClaw définit également `features.network_proxy.enabled` et
`default_permissions` dans la configuration du fil de discussion Codex afin que le profil
d’autorisations généré puisse démarrer la mise en réseau gérée par Codex. OpenClaw génère par
défaut un nom de profil `openclaw-network-<fingerprint>` résistant aux collisions à partir du
corps du profil ; utilisez `profileName` uniquement lorsqu’un nom local stable est
requis.

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

Si l’exécution normale d’app-server utilisait `danger-full-access`, l’activation de
`networkProxy` utilise à la place un accès au système de fichiers de type espace de travail pour le
profil d’autorisations généré. L’application par Codex des restrictions réseau repose sur une mise en réseau
en bac à sable ; un profil d’accès complet ne protégerait donc pas le trafic sortant.

Le plugin bloque les négociations app-server anciennes ou sans version : l’app-server Codex
doit signaler la version stable `0.143.0` ou une version ultérieure.

OpenClaw considère les URL WebSocket app-server hors boucle locale comme distantes et exige
une authentification WebSocket porteuse d’identité via `appServer.authToken` ou un en-tête
`Authorization`. `appServer.authToken` et chaque valeur `appServer.headers.*`
peuvent être des SecretInput ; le moteur d’exécution des secrets résout les SecretRefs et la notation
abrégée des variables d’environnement avant qu’OpenClaw ne construise les options de démarrage d’app-server, et les
SecretRefs structurées non résolues provoquent un échec avant l’envoi de tout jeton ou en-tête. Lorsque des
plugins Codex natifs sont configurés, OpenClaw utilise le plan de contrôle des plugins
de l’app-server connecté pour installer ou actualiser ces plugins, puis actualise
l’inventaire des applications afin que les applications appartenant aux plugins soient visibles dans le fil Codex. `app/list` reste
la source de référence pour l’inventaire et les métadonnées, mais la politique OpenClaw
détermine si `thread/start` envoie `config.apps[appId].enabled = true` pour une
application accessible répertoriée, même si Codex la marque actuellement comme désactivée. Les identifiants d’application
inconnus ou manquants restent bloqués par défaut ; ce chemin active uniquement les plugins de la place de marché
via `plugin/install` et actualise l’inventaire. Ne connectez OpenClaw qu’à des
app-servers distants auxquels vous faites confiance pour accepter les installations de plugins gérées par OpenClaw
et les actualisations de l’inventaire des applications.

## Modes d’approbation et de bac à sable

Les sessions app-server stdio locales utilisent par défaut le mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Cette posture d’opérateur local de confiance permet
aux tours et aux heartbeats OpenClaw sans surveillance de progresser sans invites d’approbation
natives auxquelles personne n’est présent pour répondre.

Si le fichier local d’exigences système de Codex interdit les valeurs implicites YOLO d’approbation,
de réviseur ou de bac à sable, OpenClaw traite à la place la valeur implicite par défaut comme guardian
et sélectionne les autorisations guardian permises. `tools.exec.mode: "auto"`
impose également des approbations Codex examinées par guardian et ne conserve pas les substitutions
historiques non sûres `approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ;
définissez `tools.exec.mode: "full"` pour adopter intentionnellement une posture sans approbation.
Les entrées `[[remote_sandbox_config]]` correspondant au nom d’hôte dans le même fichier d’exigences
sont prises en compte pour déterminer la valeur par défaut du bac à sable.

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

Lorsqu’un bac à sable OpenClaw est actif, le processus app-server Codex local
s’exécute toujours sur l’hôte du Gateway. OpenClaw désactive donc, pour ce tour, le Code Mode
natif de Codex, les serveurs MCP de l’utilisateur et l’exécution des plugins adossés à des applications, au lieu de
considérer la mise en bac à sable côté hôte de Codex comme équivalente au moteur de bac à sable
d’OpenClaw. L’accès au shell est exposé par des outils dynamiques adossés au bac à sable OpenClaw,
tels que `sandbox_exec` et `sandbox_process`, lorsque les outils normaux d’exécution/de processus
sont disponibles.

<Note>
Sur les hôtes de bac à sable OpenClaw adossés à Docker (`agents.defaults.sandbox.mode` défini sur
un moteur Docker), `openclaw doctor` vérifie si l’hôte autorise les espaces de noms
utilisateur non privilégiés (et, lorsque le trafic réseau sortant du bac à sable Docker est désactivé, les espaces de noms
réseau) dont le `bwrap` imbriqué de Codex a besoin pour l’exécution du shell en
`workspace-write` dans le conteneur du bac à sable. L’échec de cette vérification apparaît généralement
sous la forme `bwrap: setting up uid map: Permission denied` ou
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sur les
hôtes Ubuntu/AppArmor. Corrigez la politique d’espaces de noms de l’hôte signalée pour l’utilisateur du
service OpenClaw et redémarrez le Gateway ; préférez un profil AppArmor limité au
processus du service au recours global à
`kernel.apparmor_restrict_unprivileged_userns=0` sur l’hôte, et n’accordez pas
de privilèges plus larges au conteneur Docker uniquement pour satisfaire le `bwrap` imbriqué.
</Note>

## Exécution native en bac à sable

La valeur stable par défaut est le blocage en cas d’échec : la mise en bac à sable OpenClaw active désactive les surfaces
d’exécution natives de Codex qui s’exécuteraient autrement depuis l’hôte app-server Codex.
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

Lorsque l’indicateur est activé et que la session OpenClaw actuelle est mise en bac à sable, OpenClaw
démarre un serveur d’exécution local en boucle locale adossé au bac à sable actif, l’enregistre
auprès de l’app-server Codex, puis démarre le fil et le tour Codex avec cet
environnement appartenant à OpenClaw. Si l’app-server ne peut pas enregistrer l’environnement,
l’exécution échoue en mode fermé au lieu de revenir silencieusement à une exécution sur l’hôte.

Ce chemin en préversion est réservé au local. Un app-server WebSocket distant ne peut pas atteindre
le serveur d’exécution en boucle locale sauf s’il s’exécute sur le même hôte ; OpenClaw
rejette donc cette combinaison.

## Isolation de l’authentification et de l’environnement

Dans le répertoire personnel par agent utilisé par défaut, l’authentification est sélectionnée dans cet ordre :

1. Un profil d’authentification OpenClaw Codex explicite pour l’agent.
2. Le compte existant de l’app-server dans le répertoire personnel Codex de cet agent.
3. Uniquement pour les lancements locaux d’app-server stdio, `CODEX_API_KEY`, puis
   `OPENAI_API_KEY`, lorsqu’aucun compte app-server n’est présent et que l’authentification OpenAI est
   toujours requise.

Lorsqu’OpenClaw détecte un profil d’authentification Codex de type abonnement ChatGPT (OAuth ou
type d’identifiant jeton), il supprime `CODEX_API_KEY` et `OPENAI_API_KEY` du
processus enfant Codex lancé. Cela permet de conserver les clés API au niveau du Gateway
pour les embeddings ou les modèles OpenAI directs, sans facturer accidentellement
les tours natifs de l’app-server Codex via l’API.

Les profils explicites de clé API Codex et le repli local sur une clé d’environnement pour stdio utilisent
la connexion à l’app-server plutôt que l’environnement hérité du processus enfant. Les connexions
app-server WebSocket ne reçoivent pas le repli sur les clés API de l’environnement du Gateway ; utilisez un profil
d’authentification explicite ou le propre compte de l’app-server distant.

Les lancements d’app-server stdio héritent par défaut de l’environnement de processus d’OpenClaw.
OpenClaw gère la passerelle de compte de l’app-server Codex et définit `CODEX_HOME` sur un
répertoire par agent dans l’état OpenClaw de cet agent. Ainsi, la configuration, les comptes,
le cache et les données des plugins, ainsi que l’état des fils Codex restent limités à l’agent OpenClaw
au lieu de provenir du répertoire personnel `~/.codex` de l’opérateur.

Définissez `appServer.homeScope: "user"` pour partager l’état Codex natif avec Codex
Desktop et la CLI. Ce mode de répertoire personnel utilisateur local prend en charge stdio géré et
le transport Unix explicite. Il utilise `$CODEX_HOME` lorsqu’il est défini et `~/.codex`
sinon, y compris l’authentification native, la configuration, les plugins et les fils.
OpenClaw ignore sa passerelle de profil d’authentification pour l’app-server. Les tours vérifiés du
propriétaire peuvent utiliser `codex_threads` pour répertorier (avec un filtre `search` facultatif),
lire, dupliquer, renommer, archiver et désarchiver ces fils. Dupliquez un fil avant
de le poursuivre dans OpenClaw ; les processus Codex indépendants ne coordonnent pas
les écritures simultanées sur le même fil.

Cette activation explicite de `homeScope` s’applique aux sessions ordinaires du harnais. Un Chat créé
via Codex Sessions utilise à la place sa connexion de supervision privée, ce qui
préserve la configuration d’authentification et de fournisseur de la connexion native pour la
branche canonique et les reprises ultérieures.

Dans un Chat supervisé verrouillé sur un modèle, `codex_threads` ne peut pas attacher une autre
duplication ni archiver le fil natif lié au Chat. La liste et la lecture limitée aux métadonnées
restent disponibles. La lecture brute des transcriptions nécessite `allowRawTranscripts` ; lorsqu’elle
est désactivée, la recherche dans la liste est également rejetée, car la recherche native peut correspondre
aux aperçus de transcription. Le renommage, le désarchivage, la duplication détachée et l’archivage d’un
fil sans rapport qui n’appartient pas à un autre Chat OpenClaw nécessitent
`allowWriteControls`. Aucune de ces options ne contourne une liaison verrouillée.

OpenClaw ne réécrit pas `HOME` pour les lancements locaux normaux d’app-server.
Les sous-processus exécutés par Codex, tels que `openclaw`, `gh`, `git`, les CLI
cloud et les commandes shell, voient le répertoire personnel normal du processus et peuvent trouver
la configuration et les jetons du répertoire personnel utilisateur. Codex peut également découvrir
`$HOME/.agents/skills` et `$HOME/.agents/plugins/marketplace.json` ; cette découverte
de `.agents` est intentionnellement partagée avec le répertoire personnel de l’opérateur et reste distincte
de l’état isolé de `~/.codex`.

Dans la portée d’agent par défaut, les plugins OpenClaw et les instantanés de Skills OpenClaw
continuent de transiter par le propre registre de plugins et le chargeur de Skills d’OpenClaw ; les ressources
personnelles de Codex dans `~/.codex` ne le font pas. Si vous disposez de Skills ou de plugins CLI Codex
utiles provenant d’un répertoire personnel Codex qui doivent faire partie d’un agent OpenClaw
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

`appServer.clearEnv` affecte uniquement le processus enfant app-server Codex lancé.
OpenClaw supprime `CODEX_HOME` et `HOME` de cette liste pendant la normalisation du lancement
local : `CODEX_HOME` reste dirigé vers la portée d’agent ou d’utilisateur sélectionnée,
et `HOME` reste hérité afin que les sous-processus puissent utiliser l’état normal du répertoire personnel utilisateur.

## Outils dynamiques

Le chargement par défaut des outils dynamiques Codex est `searchable`, exposé sous l’espace de noms
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

La plupart des autres outils d’intégration OpenClaw, tels que la messagerie, les médias, cron,
le navigateur, les nodes, le gateway, `heartbeat_respond` et `web_search`, sont disponibles
par la recherche d’outils Codex sous cet espace de noms. Cela réduit le contexte initial
du modèle. Un petit ensemble d’outils reste directement appelable indépendamment de
`codexDynamicToolsLoading`, car la recherche d’outils Codex peut être indisponible ou
se limiter à un univers de connecteurs : `agents_list`, `sessions_spawn` et
`sessions_yield`. Les instructions du développeur continuent d’orienter les sous-agents Codex normaux
vers `spawn_agent` natif pour le travail de sous-agent natif de Codex, tandis que
`sessions_spawn` reste disponible pour une délégation OpenClaw ou ACP explicite.
Les réponses sources limitées à l’outil de messagerie restent également directes, car il s’agit d’un
contrat de contrôle du tour.

Les outils marqués `catalogMode: "direct-only"`, notamment l’outil `computer`
d’OpenClaw, sont regroupés sous `openclaw_direct`. OpenClaw ajoute cet espace de noms à
la liste `code_mode.direct_only_tool_namespaces` de Codex sans remplacer les
entrées fournies par l’opérateur. Codex expose donc ces outils en tant que
`DirectModelOnly` dans les fils normaux et ceux limités au mode code, au lieu de les acheminer
par des appels `tools.*` imbriqués du Code Mode. Cette frontière est requise pour
les résultats contenant des images : la sérialisation imbriquée du Code Mode aplatit la sortie d’image en
texte, ce qui supprimerait la capture d’écran nécessaire à l’action informatique suivante.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un
app-server Codex personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du débogage
de la charge utile complète des outils.

## Délais d’expiration

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs`. Chaque requête Codex `item/tool/call` utilise le
premier délai d’expiration disponible dans cet ordre :

- Un argument `timeoutMs` positif propre à l’appel.
- Pour `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Pour `image_generate` sans délai d’expiration configuré, la valeur par défaut de
  120 secondes pour la génération d’images.
- Pour l’outil de compréhension multimédia `image`, `tools.media.image.timeoutSeconds`
  converti en millisecondes, ou la valeur multimédia par défaut de 60 secondes. Pour la
  compréhension d’images, cela s’applique à la requête elle-même et n’est pas réduit par
  les travaux de préparation antérieurs.
- Pour l’outil `message`, une valeur par défaut fixe de 120 secondes.
- La valeur par défaut de 90 secondes pour les outils dynamiques.

Ce mécanisme de surveillance constitue le budget externe de l’appel dynamique `item/tool/call`.
Les délais d’expiration des requêtes propres aux fournisseurs s’exécutent dans cet appel et
conservent leur propre sémantique. Les budgets des outils dynamiques sont plafonnés à 600000 ms.
En cas d’expiration, OpenClaw interrompt le signal de l’outil lorsque cela est pris en charge et
renvoie à Codex une réponse d’échec de l’outil dynamique afin que le tour puisse continuer au
lieu de laisser la session dans l’état `processing`.

Une fois qu’un tour est accepté par Codex, et après la réponse d’OpenClaw à une requête
app-server limitée au tour, le banc d’exécution attend de Codex qu’il progresse dans le tour
actuel et termine finalement le tour natif avec `turn/completed`. Si l’app-server reste
silencieux pendant `appServer.turnCompletionIdleTimeoutMs`, OpenClaw tente d’interrompre le
tour Codex, enregistre un diagnostic d’expiration et libère la file de session OpenClaw afin
que les messages de discussion suivants ne restent pas en attente derrière un tour natif
obsolète.

La plupart des notifications non terminales du même tour désarment ce bref mécanisme de
surveillance, car Codex a prouvé que le tour est toujours actif. Les transferts vers les outils
utilisent un budget d’inactivité post-outil plus long : après qu’OpenClaw a renvoyé une réponse
`item/tool/call`, après l’achèvement d’éléments d’outil natifs tels que `commandExecution`,
après l’achèvement de sorties brutes `custom_tool_call_output`, et après une progression brute
post-outil de l’assistant, l’achèvement d’un raisonnement brut ou la progression du raisonnement.
La protection utilise `appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est
configuré et, sinon, une valeur par défaut de cinq minutes. Ce même budget post-outil prolonge
également la surveillance de progression pendant la fenêtre de synthèse silencieuse précédant
l’émission par Codex de l’événement suivant du tour actuel. Les achèvements de raisonnement, les
achèvements `agentMessage` de commentaire et la progression brute du raisonnement ou de
l’assistant avant l’outil peuvent être suivis d’une réponse finale automatique ; ils utilisent
donc la protection de réponse post-progression au lieu de libérer immédiatement la file de
session. Seuls les éléments `agentMessage` terminés finaux ou hors commentaire et les
achèvements bruts de l’assistant avant l’outil arment la libération de sortie de l’assistant :
si Codex devient ensuite silencieux sans `turn/completed`, OpenClaw tente d’interrompre le tour
natif et libère la file de session. Les échecs de l’app-server stdio pouvant être relus sans
risque, y compris les expirations d’inactivité d’achèvement du tour sans preuve d’assistant,
d’outil, d’élément actif ou d’effet secondaire, font l’objet d’une nouvelle tentative unique
dans une nouvelle instance de l’app-server. Les expirations non sûres retirent tout de même le
client app-server bloqué et libèrent la file de session OpenClaw. Elles effacent également
l’association obsolète au fil natif au lieu d’être automatiquement relues. Les expirations de
la surveillance d’achèvement affichent un texte d’expiration propre à Codex : les cas pouvant
être relus sans risque indiquent que la réponse peut être incomplète, tandis que les cas non
sûrs demandent à l’utilisateur de vérifier l’état actuel avant de réessayer. Les diagnostics
publics d’expiration incluent des champs structurels tels que la dernière méthode de notification
de l’app-server, l’identifiant, le type et le rôle de l’élément de réponse brute de l’assistant,
le nombre de requêtes et d’éléments actifs, ainsi que l’état armé de la surveillance. Lorsque
la dernière notification est un élément de réponse brute de l’assistant, ils incluent également
un aperçu limité du texte de l’assistant. Ils n’incluent pas le contenu brut du prompt ni des
outils.

## Découverte des modèles

Par défaut, le Plugin Codex demande à l’app-server les modèles disponibles. La disponibilité
des modèles relève de l’app-server Codex ; la liste peut donc changer lorsqu’OpenClaw met à
niveau la version intégrée de `@openai/codex` ou lorsqu’un déploiement fait pointer
`appServer.command` vers un autre binaire Codex. La disponibilité peut également dépendre du
compte. Utilisez `/codex models` sur un Gateway en cours d’exécution pour afficher le catalogue
actif de ce banc d’exécution et de ce compte.

Si la découverte échoue ou expire, OpenClaw utilise un catalogue de secours intégré :

| Identifiant du modèle | Nom d’affichage | Niveaux de raisonnement |
| --------------------- | --------------- | ----------------------- |
| `gpt-5.5`             | gpt-5.5         | low, medium, high, xhigh |
| `gpt-5.4-mini`        | GPT-5.4-Mini    | low, medium, high, xhigh |

<Note>
Le banc d’exécution intégré actuel est `@openai/codex` `0.144.1`. Une interrogation `model/list`
de cet app-server intégré a renvoyé les lignes publiques suivantes du sélecteur :

| Identifiant du modèle | Modalités d’entrée | Niveaux de raisonnement                 |
| --------------------- | ------------------ | --------------------------------------- |
| `gpt-5.6-sol`         | texte, image       | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | texte, image       | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | texte, image       | low, medium, high, xhigh, max        |
| `gpt-5.5`             | texte, image       | low, medium, high, xhigh             |
| `gpt-5.4`             | texte, image       | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | texte, image       | low, medium, high, xhigh             |
| `gpt-5.2`             | texte, image       | low, medium, high, xhigh             |

Le catalogue de l’app-server peut signaler `ultra` ; les contrôles de raisonnement d’OpenClaw
exposent actuellement les niveaux jusqu’à `max`.

Les lignes actives du sélecteur dépendent du compte et peuvent changer selon le compte, le
catalogue Codex ou la version intégrée ; exécutez `/codex models` pour obtenir la liste actuelle
plutôt que de vous fier à un tableau établi à un instant donné. Des modèles masqués peuvent
également apparaître dans le catalogue de l’app-server pour des flux internes ou spécialisés
sans constituer des choix normaux du sélecteur de modèles.
</Note>

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

Désactivez la découverte si vous souhaitez éviter d’interroger Codex au démarrage et utiliser
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

## Fichiers d’amorçage de l’espace de travail

Codex gère lui-même `AGENTS.md` grâce à la découverte native de la documentation du projet.
OpenClaw n’écrit pas de fichiers synthétiques de documentation de projet Codex et ne dépend
pas des noms de fichiers de secours de Codex pour les fichiers de persona, car les mécanismes
de secours de Codex ne s’appliquent que lorsque `AGENTS.md` est absent.

Pour assurer la parité de l’espace de travail OpenClaw, le banc d’exécution Codex transmet les
autres fichiers d’amorçage sous forme d’instructions de développeur, mais pas de manière
identique :

- `TOOLS.md` est transmis comme instructions de développeur Codex **héritées**, afin que les
  sous-agents Codex natifs créés pendant le tour puissent également le consulter.
- `SOUL.md`, `IDENTITY.md` et `USER.md` sont transmis comme instructions de collaboration
  **limitées au tour**. Les sous-agents Codex natifs ne les héritent pas, ce qui empêche leurs
  tours de reprendre la persona et le profil utilisateur de l’agent parent.
- La liste compacte des Skills OpenClaw chargés est également transmise comme instructions de
  développeur de collaboration limitées au tour, afin que les sous-agents Codex natifs ne
  l’héritent pas non plus.
- Le contenu de `HEARTBEAT.md` n’est pas injecté ; les tours de Heartbeat reçoivent en mode
  collaboration une indication leur demandant de lire le fichier lorsqu’il existe et n’est
  pas vide.
- Le contenu de `MEMORY.md` provenant de l’espace de travail configuré de l’agent n’est pas
  inséré dans l’entrée du tour Codex natif lorsque les outils de mémoire sont disponibles pour
  cet espace de travail ; lorsqu’il existe, le banc d’exécution ajoute une courte indication
  sur la mémoire de l’espace de travail aux instructions de développeur de collaboration
  limitées au tour, et Codex doit utiliser `memory_search` ou `memory_get` lorsque la mémoire
  durable est pertinente. Si les outils sont désactivés, si la recherche en mémoire est
  indisponible ou si l’espace de travail actif diffère de l’espace de travail mémoire de
  l’agent, `MEMORY.md` emprunte à la place le chemin normal de contexte de tour limité.
- `BOOTSTRAP.md`, lorsqu’il est présent, est transmis comme contexte de référence d’entrée du
  tour OpenClaw.

## Remplacements par variables d’environnement

Les remplacements par variables d’environnement restent disponibles pour les tests locaux :

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
préférable pour les déploiements reproductibles, car elle conserve le comportement du Plugin
dans le même fichier révisé que le reste de la configuration du banc d’exécution Codex.

## Voir aussi

- [Banc d’exécution Codex](/fr/plugins/codex-harness)
- [Environnement d’exécution du banc Codex](/fr/plugins/codex-harness-runtime)
- [Supervision de Codex](/plugins/codex-supervision)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Utilisation de l’ordinateur par Codex](/fr/plugins/codex-computer-use)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Référence de configuration](/fr/gateway/configuration-reference)
