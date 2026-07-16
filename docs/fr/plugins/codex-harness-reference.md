---
read_when:
    - Vous avez besoin de tous les champs de configuration du harness Codex
    - Vous modifiez le comportement du transport, de l’authentification, de la découverte ou du délai d’expiration de l’app-server
    - Vous déboguez le démarrage du harnais Codex, la découverte des modèles ou l’isolation de l’environnement
summary: Référence de configuration, d’authentification, de découverte et du serveur d’applications pour le harnais Codex
title: Référence du harnais Codex
x-i18n:
    generated_at: "2026-07-16T13:31:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Cette référence couvre la configuration détaillée du plugin officiel `codex`.
Pour les décisions de configuration et de routage, commencez par
[le harnais Codex](/fr/plugins/codex-harness).

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

| Champ                      | Valeur par défaut                  | Signification                                                                                                                                        |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | activé                  | Paramètres de découverte des modèles pour l'app-server Codex `model/list`.                                                                                    |
| `appServer`                | app-server stdio géré | Paramètres de transport, de commande, d'authentification, d'approbation, de bac à sable et de délai d'expiration. Le harnais ordinaire utilise par défaut un état limité à l'agent.                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Utilisez `"direct"` pour placer directement les outils dynamiques d'OpenClaw dans le contexte d'outils Codex initial.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Noms supplémentaires d'outils dynamiques d'OpenClaw à omettre des tours de l'app-server Codex.                                                                    |
| `codexPlugins`             | désactivé                 | Prise en charge native des plugins et applications Codex, notamment l'accès facultatif aux applications des comptes connectés. Consultez [Plugins Codex natifs](/fr/plugins/codex-native-plugins). |
| `computerUse`              | désactivé                 | Configuration de Codex Computer Use. Consultez [Codex Computer Use](/fr/plugins/codex-computer-use).                                                               |
| `sessionCatalog`           | activé                  | Découverte native des sessions Codex pour la barre latérale. Définissez `enabled: false` pour désactiver la découverte sans désactiver le fournisseur ni le harnais.           |
| `supervision`              | désactivé                 | Politique de contrôle des écritures et des transcriptions des sessions natives accessible aux agents. Consultez [Supervision Codex](/fr/plugins/codex-supervision).                          |

## Supervision

Par défaut, la découverte des sessions natives répertorie les sessions Codex non archivées de l'ordinateur du Gateway
et des nœuds appairés ayant accepté de participer. Pour désactiver uniquement ce catalogue :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` contrôle séparément les outils accessibles aux agents :

| Champ                 | Valeur par défaut                 | Signification                                                                                                                                                                                                                                   |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Active les outils de supervision Codex accessibles aux agents. Cela ne contrôle pas le catalogue de sessions d'opérateur authentifiées.                                                                                                                            |
| `endpoints`           | point de terminaison local intégré | Cibles de points de terminaison avancées et de compatibilité pour l'agent de supervision Codex conservé et les outils MCP autonomes. Le catalogue humain et le flux de branches ignorent ces cibles et utilisent l'App Server de supervision résolu à partir de `appServer`.       |
| `allowRawTranscripts` | `false`                 | Lorsque la supervision est activée, autorise les agents autonomes ou les outils MCP autonomes à lire les transcriptions et les champs de liste dérivés des transcriptions. Les lectures de métadonnées uniquement de `codex_threads` restent disponibles. Ne contrôle pas la poursuite authentifiée dans la Control UI.     |
| `allowWriteControls`  | `false`                 | Lorsque la supervision est activée, autorise les mutations autonomes `codex_threads` de bifurcation, de renommage, d'archivage et de désarchivage, ainsi que les opérations autonomes MCP d'envoi, d'orientation et d'interruption. Ne contourne pas les autres contrôles de liaison, d'hôte, d'état ou de confirmation. |

Les entrées de point de terminaison acceptent les champs suivants :

| Champ          | S'applique à    | Signification                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | tous           | Identifiant stable du point de terminaison.                                                   |
| `label`        | tous           | Libellé d'affichage facultatif.                                               |
| `transport`    | tous           | `"stdio-proxy"` ou `"websocket"`.                                     |
| `command`      | `stdio-proxy` | Commande App Server facultative.                                          |
| `args`         | `stdio-proxy` | Arguments de commande facultatifs.                                           |
| `cwd`          | `stdio-proxy` | Répertoire de travail facultatif du processus enfant.                             |
| `url`          | `websocket`   | URL WebSocket ou d'un socket local pris en charge requise.                     |
| `authTokenEnv` | `websocket`   | Variable d'environnement facultative dont la valeur authentifie le point de terminaison. |

La page **Sessions Codex** utilise l'App Server de supervision du plugin et affiche
uniquement les sessions non archivées. Sans paramètres de connexion `appServer` explicites,
cette connexion utilise le stdio géré du répertoire personnel de l'utilisateur. Les lignes locales stockées ou inactives peuvent créer
un Chat verrouillé sur le modèle, avec un historique borné des messages de l'utilisateur et de l'assistant jusqu'au dernier
tour source terminal persistant. Sa liaison privée conserve sur cette
connexion la bifurcation de l'instantané, la branche source canonique `appServer`, l'injection de l'historique et les tours ultérieurs.
Le premier démarrage canonique utilise la paire renvoyée par la bifurcation. Les reprises
ultérieures omettent les substitutions du modèle et du fournisseur OpenClaw afin que Codex restaure la
paire persistante du fil canonique ; une modification native distincte peut mettre à jour cette
paire, mais le modèle externe et la chaîne de repli ne la remplacent jamais. Les lignes stockées et inactives
peuvent être archivées après confirmation qu'aucun autre exécuteur n'est présent, sauf si une autre liaison OpenClaw
active possède la cible exacte ou l'un de ses descendants générés non archivés.
OpenClaw suit la pagination des descendants de Codex et échoue de manière fermée en cas
d'erreurs d'énumération, de cycles ou d'épuisement de la limite de sécurité. La confirmation couvre toujours
les clients natifs inconnus et la condition de concurrence entre l'état et l'archivage. Un Chat supervisé
verrouillé sur le modèle ne peut pas être supprimé tant qu'il protège la liaison native.
Les sources actives ne peuvent pas créer de branche ni être archivées, mais un Chat supervisé existant
peut toujours être ouvert. Chaque ligne de nœud appairé reste en lecture seule ; le transport du nœud
ne fournit pas encore le cycle de vie de diffusion en continu requis par le harnais.

`appServer.homeScope: "user"` seul modifie le répertoire personnel Codex utilisé par un processus de harnais
géré ; il ne publie pas le catalogue de la flotte. L'activation de la supervision ne
modifie pas la valeur par défaut du harnais. À la place, la connexion de supervision distincte
utilise par défaut le stdio géré du répertoire personnel de l'utilisateur lorsqu'aucun paramètre de connexion
`appServer` explicite n'existe. Les paramètres explicites sont respectés pour cette connexion.
Les liaisons supervisées en attente et validées conservent cette connexion à chaque tour ;
une supervision désactivée ou une dérive de connexion ou de cycle de vie échoue de manière fermée au lieu
de revenir au harnais du répertoire personnel de l'agent. La connexion par défaut partage les sessions stockées
avec les clients Codex natifs, mais pas leur état d'activité local au processus.

Les anciens paramètres `plugins.entries.codex-supervisor` sont retirés. Exécutez
`openclaw doctor --fix` pour migrer l'ancienne entrée, les définitions des points de terminaison, les indicateurs de politique
et les références d'autorisation ou de refus du plugin vers ce bloc. Les valeurs canoniques explicites
`codex.config.supervision` prévalent en cas de conflit.

## Transport de l'app-server

Pour les tours ordinaires du harnais, OpenClaw démarre le binaire Codex géré fourni
avec le plugin officiel (actuellement `@openai/codex` `0.144.3`) :

```bash
codex app-server --listen stdio://
```

Cela maintient la version de l'app-server liée au plugin officiel `codex`, plutôt qu'à
une éventuelle CLI Codex distincte installée localement. Définissez
`appServer.command` uniquement si vous souhaitez intentionnellement utiliser un autre exécutable.
Les tours gérés ordinaires utilisant le répertoire personnel isolé par défaut de l'agent privilégient ce
paquet épinglé, même lorsqu'un paquet d'application de bureau macOS est installé. Lorsque
[Computer Use](/fr/plugins/codex-computer-use) est activé, ou lorsque `homeScope` vaut
`"user"` et peut charger l'état natif de Computer Use, le démarrage géré privilégie plutôt
le binaire de l'application de bureau qui possède les autorisations macOS requises. La même
règle donnant la priorité à l'application de bureau s'applique lorsque la configuration Codex effective du répertoire personnel isolé
d'un agent active Computer Use natif. Si aucun paquet d'application de bureau n'est installé, OpenClaw
revient au binaire du paquet épinglé.

Le transfert de l'exécutable et le cloisonnement de la configuration native coordonnent les clients dans un même
processus Gateway en cours d'exécution. Redémarrez le Gateway après qu'un autre processus a modifié la
configuration du plugin Codex natif.

La supervision résout une connexion distincte. Sans paramètres de connexion
`appServer` explicites, elle utilise le stdio géré avec `homeScope: "user"` ;
le harnais ordinaire reste en stdio géré avec `homeScope: "agent"`. Les paramètres de
connexion explicites sont respectés par les deux chemins. Définissez explicitement `homeScope: "user"`
lorsque le harnais ordinaire doit partager `$CODEX_HOME` (ou `~/.codex`)
avec les clients natifs. Une liaison supervisée privée utilise la connexion de supervision
quelle que soit la valeur par défaut du harnais ordinaire. Les processus App Server indépendants
conservent des états actifs et d'approbation distincts.

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

| Champ                                         | Valeur par défaut                                      | Signification                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` lance Codex ; la valeur explicite `"unix"` se connecte au socket de contrôle local ; `"websocket"` se connecte à `url`.                                                                                                                                                                                                                                      |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isole l’état ordinaire du banc de test pour chaque agent OpenClaw. `"user"` est une activation explicite qui partage le `$CODEX_HOME` ou le `~/.codex` natif, utilise l’authentification native et active la gestion des threads réservée au propriétaire. La portée utilisateur prend en charge le transport stdio local ou Unix. Pour la connexion de supervision distincte, une valeur non définie est résolue en `"user"` pour stdio ou Unix et en `"agent"` pour WebSocket.     |
| `command`                                     | binaire Codex géré                                    | Exécutable pour le transport stdio. Laissez cette valeur non définie pour utiliser le binaire géré.                                                                                                                                                                                                                                                                                             |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Arguments pour le transport stdio.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | non défini                                             | URL du serveur d’applications WebSocket ou URL `unix://`. Un chemin Unix explicite vide sélectionne le socket de contrôle canonique du répertoire personnel de l’utilisateur.                                                                                                                                                                                                                   |
| `authToken`                                   | non défini                                             | Jeton Bearer pour le transport WebSocket. Accepte une chaîne littérale ou une SecretInput telle que `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | En-têtes WebSocket supplémentaires. Les valeurs d’en-tête acceptent des chaînes littérales ou des valeurs SecretInput, par exemple `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Noms de variables d’environnement supplémentaires supprimés du processus app-server stdio lancé après qu’OpenClaw a construit son environnement hérité.                                                                                                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | non défini                                             | Racine distante de l’espace de travail du serveur d’applications Codex. Lorsqu’elle est définie, OpenClaw déduit la racine locale de l’espace de travail à partir de l’espace de travail OpenClaw résolu, conserve le suffixe du répertoire de travail actuel sous cette racine distante et envoie uniquement le répertoire de travail final de l’app-server à Codex. Si le répertoire de travail se trouve hors de la racine de l’espace de travail OpenClaw résolue, OpenClaw échoue de manière fermée au lieu d’envoyer un chemin local au Gateway vers l’app-server distant. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Installe le sous-processus Codex `PreToolUse`, utilisé uniquement pour la détection des boucles OpenClaw et son marqueur explicite d’absence de politique. Définissez `false` pour réduire la multiplication des processus par outil. Les hooks de Plugin préalables aux outils et la politique des outils de confiance installent toujours leur relais requis.                                                                 |
| `requestTimeoutMs`                            | `60000`                                                | Délai d’expiration des appels du plan de contrôle de l’app-server.                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Fenêtre de silence après que Codex a accepté un tour ou après une requête app-server limitée au tour, pendant qu’OpenClaw attend `turn/completed`.                                                                                                                                                                                                                                              |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Garde d’inactivité d’achèvement et de progression utilisée après un transfert à un outil, l’achèvement d’un outil natif, une progression brute de l’assistant après un outil, l’achèvement du raisonnement brut ou la progression du raisonnement, pendant qu’OpenClaw attend `turn/completed`. Utilisez-la pour les charges de travail fiables ou lourdes dont la synthèse après outil peut légitimement rester silencieuse plus longtemps que le budget final de publication de l’assistant.                                |
| `mode`                                        | `"yolo"` sauf si les exigences locales de Codex interdisent YOLO | Préréglage pour l’exécution YOLO ou examinée par un gardien.                                                                                                                                                                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` ou une politique d’approbation de gardien autorisée       | Politique d’approbation Codex native envoyée au démarrage du thread, à sa reprise et au tour.                                                                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` ou un bac à sable de gardien autorisé  | Mode de bac à sable Codex natif envoyé au démarrage et à la reprise du thread. Les bacs à sable OpenClaw actifs restreignent les tours `danger-full-access` à Codex `workspace-write` ; l’indicateur réseau du tour suit la sortie réseau du bac à sable OpenClaw.                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` ou un examinateur gardien autorisé               | Utilisez `"auto_review"` pour permettre à Codex d’examiner les demandes d’approbation natives lorsque cela est autorisé.                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | répertoire du processus actuel                         | Espace de travail utilisé par `/codex bind` lorsque `--cwd` est omis.                                                                                                                                                                                                                                                                                                           |
| `serviceTier`                                 | non défini                                             | Niveau de service facultatif de l’app-server Codex. `"priority"` active le routage en mode rapide, `"flex"` demande le traitement flexible et `null` supprime le remplacement. L’ancienne valeur `"fast"` est acceptée comme `"priority"`.                                                                                                         |
| `networkProxy`                                | désactivé                                              | Active la mise en réseau du profil d’autorisations Codex pour les commandes app-server. OpenClaw définit la configuration `permissions.<profile>.network` sélectionnée et la choisit avec `default_permissions` au lieu d’envoyer `sandbox`.                                                                                                                                                        |
| `experimental.sandboxExecServer`              | `false`                                                | Activation d’aperçu qui enregistre auprès de l’app-server Codex pris en charge un environnement Codex reposant sur le bac à sable OpenClaw, afin que l’exécution Codex native puisse s’effectuer dans le bac à sable OpenClaw actif.                                                                                                                                                                |

`appServer.networkProxy` est explicite, car il modifie le contrat du bac à sable
Codex. Lorsqu’il est activé, OpenClaw définit également `features.network_proxy.enabled` et
`default_permissions` dans la configuration du thread Codex afin que le profil
d’autorisations généré puisse démarrer la mise en réseau gérée par Codex. Par
défaut, OpenClaw génère un nom de profil `openclaw-network-<fingerprint>` résistant aux
collisions à partir du corps du profil ; utilisez `profileName` uniquement
lorsqu’un nom local stable est requis.

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

Si l’environnement d’exécution app-server normal devait être
`danger-full-access`, l’activation de `networkProxy` utilise à la place un
accès au système de fichiers de type espace de travail pour le profil
d’autorisations généré. L’application par Codex des règles réseau est une mise
en réseau dans un bac à sable ; un profil d’accès complet ne protégerait donc
pas le trafic sortant.

Le plugin bloque les négociations app-server plus anciennes ou sans version :
l’app-server Codex doit signaler la version stable `0.143.0` ou une
version ultérieure.

OpenClaw considère les URL WebSocket d’app-server qui ne sont pas en boucle
locale comme distantes et exige une authentification WebSocket portant une
identité via `appServer.authToken` ou un en-tête `Authorization`.
`appServer.authToken` et chaque valeur `appServer.headers.*` peuvent être des
SecretInput ; l’environnement d’exécution des secrets résout les SecretRefs et
les raccourcis d’environnement avant qu’OpenClaw ne construise les options de
démarrage de l’app-server, et les SecretRefs structurées non résolues
provoquent un échec avant l’envoi de tout jeton ou en-tête. Lorsque des plugins
Codex natifs sont configurés, OpenClaw utilise le plan de contrôle des plugins
de l’app-server connecté pour installer ou actualiser ces plugins, puis
actualise l’inventaire des applications afin que les applications appartenant
aux plugins soient visibles par le thread Codex. `app/list` reste la
source faisant autorité pour l’inventaire et les métadonnées, mais la politique
OpenClaw détermine si `thread/start` envoie `config.apps[appId].enabled = true` pour une
application accessible répertoriée, même si Codex la marque actuellement comme
désactivée. Les identifiants d’application inconnus ou manquants restent
fermés par défaut ; ce chemin active uniquement les plugins de la place de
marché via `plugin/install` et actualise l’inventaire. Ne connectez OpenClaw
qu’à des app-servers distants auxquels vous faites confiance pour accepter les
installations de plugins gérées par OpenClaw et les actualisations de
l’inventaire des applications.

## Modes d’approbation et de bac à sable

Les sessions app-server stdio locales utilisent par défaut le mode YOLO :
`approvalPolicy: "never"`, `approvalsReviewer: "user"` et
`sandbox: "danger-full-access"`. Cette posture d’opérateur local de confiance permet aux
tours et aux heartbeats OpenClaw sans surveillance de progresser sans invites
d’approbation natives auxquelles personne n’est présent pour répondre.

Si le fichier local d’exigences système de Codex interdit les valeurs
implicites YOLO d’approbation, de réviseur ou de bac à sable, OpenClaw traite
plutôt la valeur implicite par défaut comme guardian et sélectionne les
autorisations guardian permises. `tools.exec.mode: "auto"` impose également des
approbations Codex examinées par guardian et ne conserve pas les substitutions
héritées non sûres `approvalPolicy: "never"` ou `sandbox: "danger-full-access"` ; définissez
`tools.exec.mode: "full"` pour adopter intentionnellement une posture sans
approbation. Les entrées `[[remote_sandbox_config]]` du même fichier d’exigences dont le
nom d’hôte correspond sont prises en compte pour la décision relative au bac à
sable par défaut.

Définissez `appServer.mode: "guardian"` pour les approbations Codex examinées par
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

Le préréglage `guardian` se développe en `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` et `sandbox: "workspace-write"` lorsque ces valeurs sont autorisées.
Les champs de politique individuels remplacent `mode`. L’ancienne
valeur de réviseur `guardian_subagent` est toujours acceptée comme alias de
compatibilité, mais les nouvelles configurations doivent utiliser
`auto_review`.

Lorsqu’un bac à sable OpenClaw est actif, le processus app-server Codex local
s’exécute toujours sur l’hôte du Gateway. OpenClaw désactive donc le Code Mode
natif de Codex, les serveurs MCP utilisateur et l’exécution de plugins adossée
à des applications pour ce tour, au lieu de considérer la mise en bac à sable
côté hôte de Codex comme équivalente au backend de bac à sable OpenClaw.
L’accès au shell est exposé par l’intermédiaire d’outils dynamiques adossés au
bac à sable OpenClaw, tels que `sandbox_exec` et `sandbox_process`,
lorsque les outils exec/process normaux sont disponibles.

<Note>
Sur les hôtes de bac à sable OpenClaw adossés à Docker
(`agents.defaults.sandbox.mode` défini sur un backend Docker), `openclaw doctor` vérifie
si l’hôte autorise les espaces de noms d’utilisateur non privilégié et, lorsque
la sortie réseau du bac à sable Docker est désactivée, les espaces de noms
réseau dont le bac à sable Codex `bwrap` imbriqué a besoin pour
l’exécution du shell `workspace-write` dans le conteneur du bac à sable.
L’échec de cette vérification apparaît généralement sous la forme
`bwrap: setting up uid map: Permission denied` ou `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sur les hôtes Ubuntu/AppArmor.
Corrigez la politique d’espaces de noms de l’hôte signalée pour l’utilisateur
du service OpenClaw et redémarrez le Gateway ; préférez un profil AppArmor
limité au processus de service plutôt que la solution de repli à l’échelle de
l’hôte `kernel.apparmor_restrict_unprivileged_userns=0`, et n’accordez pas de privilèges de conteneur Docker
plus étendus uniquement pour satisfaire le bac à sable `bwrap`
imbriqué.
</Note>

## Exécution native dans un bac à sable

La valeur stable par défaut est la fermeture en cas d’échec : la mise en bac à
sable OpenClaw active désactive les surfaces d’exécution Codex natives qui
s’exécuteraient autrement depuis l’hôte de l’app-server Codex. Utilisez
`appServer.experimental.sandboxExecServer: true` uniquement si vous souhaitez essayer la prise en charge des
environnements distants de Codex avec le backend de bac à sable d’OpenClaw. Ce
chemin en préversion fonctionne avec toutes les versions d’app-server Codex
prises en charge.

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

Lorsque l’indicateur est activé et que la session OpenClaw actuelle est dans un
bac à sable, OpenClaw démarre un serveur d’exécution local en boucle locale
adossé au bac à sable actif, l’enregistre auprès de l’app-server Codex, puis
démarre le thread et le tour Codex avec cet environnement appartenant à
OpenClaw. Si l’app-server ne peut pas enregistrer l’environnement, l’exécution
échoue en restant fermée au lieu de revenir silencieusement à une exécution sur
l’hôte.

Ce chemin en préversion est uniquement local. Un app-server WebSocket distant
ne peut pas atteindre le serveur d’exécution en boucle locale, sauf s’il
s’exécute sur le même hôte ; OpenClaw rejette donc cette combinaison.

## Isolation de l’authentification et de l’environnement

Dans le répertoire personnel par agent par défaut, l’authentification est
sélectionnée dans cet ordre :

1. Un profil d’authentification Codex OpenClaw explicite pour l’agent.
2. Le compte existant de l’app-server dans le répertoire personnel Codex de cet agent.
3. Uniquement pour les lancements locaux de l’app-server stdio,
   `CODEX_API_KEY`, puis `OPENAI_API_KEY`, lorsqu’aucun compte app-server
   n’est présent et que l’authentification OpenAI reste requise.

Lorsqu’OpenClaw détecte un profil d’authentification Codex de type abonnement
ChatGPT (type d’identifiant OAuth ou jeton), il supprime `CODEX_API_KEY` et
`OPENAI_API_KEY` du processus enfant Codex créé. Les clés d’API au niveau du
Gateway restent ainsi disponibles pour les embeddings ou les modèles OpenAI
directs, sans que les tours natifs de l’app-server Codex soient facturés par
inadvertance via l’API.

Les profils Codex explicites à clé d’API et la solution de repli sur une clé
d’environnement pour le stdio local utilisent la connexion de l’app-server
plutôt que l’environnement hérité du processus enfant. Les connexions
app-server WebSocket ne reçoivent pas la solution de repli sur la clé d’API
d’environnement du Gateway ; utilisez un profil d’authentification explicite
ou le propre compte de l’app-server distant.

Par défaut, les lancements de l’app-server stdio héritent de l’environnement
du processus OpenClaw. OpenClaw possède la passerelle de compte de l’app-server
Codex et définit `CODEX_HOME` sur un répertoire par agent situé dans
l’état OpenClaw de cet agent. La configuration, les comptes, le cache et les
données des plugins, ainsi que l’état des threads Codex restent ainsi limités à
l’agent OpenClaw au lieu de provenir du répertoire personnel
`~/.codex` de l’opérateur.

Définissez `appServer.homeScope: "user"` pour partager l’état Codex natif avec Codex
Desktop et la CLI. Ce mode de répertoire personnel utilisateur local prend en
charge le stdio géré et le transport Unix explicite. Il utilise
`$CODEX_HOME` lorsque cette valeur est définie et `~/.codex` dans
le cas contraire, y compris pour l’authentification native, la configuration,
les plugins et les threads. OpenClaw ignore sa passerelle de profil
d’authentification pour l’app-server. Les tours de propriétaires vérifiés
peuvent utiliser `codex_threads` pour répertorier, avec un filtre
`search` facultatif, lire, dupliquer, renommer, archiver et
désarchiver ces threads. Dupliquez un thread avant de le poursuivre dans
OpenClaw ; les processus Codex indépendants ne coordonnent pas les écritures
simultanées sur le même thread.

Cette activation explicite `homeScope` s’applique aux sessions de
harnais ordinaires. Un Chat créé au moyen de Codex Sessions utilise plutôt sa
connexion de supervision privée, qui conserve la configuration
d’authentification et de fournisseur de la connexion native pour la branche
canonique et les reprises futures.

Dans un Chat supervisé verrouillé sur un modèle, `codex_threads` ne peut pas
associer une autre duplication ni archiver le thread natif lié au Chat. La
liste et la lecture des métadonnées uniquement restent disponibles. Les
lectures brutes de la transcription nécessitent `allowRawTranscripts` ; lorsque
cette option est désactivée, la recherche dans la liste est également rejetée,
car la recherche native peut trouver des correspondances dans les aperçus de
transcription. Renommer, désarchiver, effectuer une duplication détachée ou
archiver un thread sans rapport qui n’appartient pas à un autre Chat OpenClaw
nécessite `allowWriteControls`. Aucune de ces options ne contourne une liaison
verrouillée.

OpenClaw ne réécrit pas `HOME` pour les lancements locaux normaux
de l’app-server. Les sous-processus exécutés par Codex, tels que
`openclaw`, `gh`, `git`, les CLI cloud et
les commandes shell voient le répertoire personnel normal du processus et
peuvent trouver la configuration et les jetons du répertoire personnel de
l’utilisateur. Codex peut également découvrir `$HOME/.agents/skills` et
`$HOME/.agents/plugins/marketplace.json` ; cette découverte `.agents` est
intentionnellement partagée avec le répertoire personnel de l’opérateur et
distincte de l’état `~/.codex` isolé.

Dans la portée d’agent par défaut, les plugins OpenClaw et les instantanés de
Skills OpenClaw continuent de transiter par le registre de plugins et le
chargeur de Skills propres à OpenClaw ; ce n’est pas le cas des ressources
personnelles Codex `~/.codex`. Si vous disposez de Skills de CLI Codex
ou de plugins utiles provenant d’un répertoire personnel Codex qui devraient
faire partie d’un agent OpenClaw isolé, inventoriez-les explicitement :

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

`appServer.clearEnv` affecte uniquement le processus enfant de l’app-server
Codex créé. OpenClaw supprime `CODEX_HOME` et `HOME` de cette
liste lors de la normalisation du lancement local : `CODEX_HOME` reste
orienté vers la portée d’agent ou d’utilisateur sélectionnée, et
`HOME` reste hérité afin que les sous-processus puissent utiliser
l’état normal du répertoire personnel de l’utilisateur.

## Outils dynamiques

Les outils dynamiques Codex utilisent par défaut le chargement
`searchable`, exposé sous l’espace de noms `openclaw` avec
`deferLoading: true`. OpenClaw n’expose normalement pas les outils dynamiques qui
font double emploi avec les opérations d’espace de travail natives de Codex ou
avec la propre surface de recherche d’outils de Codex :

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

Lorsqu’une liste d’autorisation d’environnement d’exécution finie désactive le
Code Mode natif, OpenClaw envoie une sélection vide d’environnement
d’exécution. Dans ce cas direct, sans bac à sable, OpenClaw conserve ses outils
`exec` et `process`, filtrés par la politique, comme
solution de repli pour le shell. Les listes d’autorisation de l’environnement
d’exécution et `codexDynamicToolsExclude` continuent de s’appliquer.

La plupart des outils d’intégration OpenClaw restants, tels que la messagerie, les médias, Cron,
le navigateur, les Nodes, le Gateway, `heartbeat_respond` et `web_search`, sont disponibles
via la recherche d’outils Codex dans cet espace de noms. Cela réduit la taille du contexte
initial du modèle. Un petit ensemble d’outils reste directement appelable, indépendamment de
`codexDynamicToolsLoading`, car la recherche d’outils Codex peut être indisponible ou
ne trouver qu’un univers limité aux connecteurs : `agents_list`, `sessions_spawn` et
`sessions_yield`. Les instructions destinées aux développeurs continuent d’orienter les sous-agents Codex ordinaires
vers le mécanisme natif `spawn_agent` pour les tâches de sous-agent propres à Codex, tandis que
`sessions_spawn` reste disponible pour une délégation explicite à OpenClaw ou ACP.
Les réponses provenant uniquement d’un outil de messagerie restent également directes, car il s’agit d’un
contrat de contrôle du tour.

Les outils marqués `catalogMode: "direct-only"`, notamment l’outil OpenClaw `computer`,
sont regroupés sous `openclaw_direct`. OpenClaw ajoute cet espace de noms à
la liste `code_mode.direct_only_tool_namespaces` de Codex sans remplacer
les entrées fournies par l’opérateur. Codex expose donc ces outils en tant que
`DirectModelOnly` dans les fils ordinaires et ceux réservés au mode code, au lieu de les acheminer
via des appels Code Mode `tools.*` imbriqués. Cette frontière est nécessaire pour
les résultats contenant des images : la sérialisation imbriquée du Code Mode réduit la sortie d’image à
du texte, ce qui supprimerait la capture d’écran nécessaire à l’action informatique suivante.

Définissez `codexDynamicToolsLoading: "direct"` uniquement lors de la connexion à un
serveur d’application Codex personnalisé qui ne peut pas rechercher les outils dynamiques différés, ou lors du débogage
de la charge utile complète des outils.

## Délais d’expiration

Les appels d’outils dynamiques appartenant à OpenClaw sont limités indépendamment de
`appServer.requestTimeoutMs`. Chaque requête Codex `item/tool/call` utilise le
premier délai d’expiration disponible dans cet ordre :

- Un argument positif `timeoutMs` propre à l’appel.
- Pour `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Pour `image_generate` sans délai d’expiration configuré, la valeur par défaut de 120 secondes
  pour la génération d’images.
- Pour l’outil de compréhension des médias `image`, `tools.media.image.timeoutSeconds`
  converti en millisecondes, ou la valeur par défaut de 60 secondes pour les médias. Pour la compréhension
  des images, cela s’applique à la requête elle-même et n’est pas réduit par
  les travaux de préparation antérieurs.
- Pour l’outil `message`, une valeur par défaut fixe de 120 secondes.
- La valeur par défaut de 90 secondes pour les outils dynamiques.

Ce mécanisme de surveillance constitue le budget dynamique externe de `item/tool/call`. Les délais d’expiration
propres aux requêtes des fournisseurs s’exécutent à l’intérieur de cet appel et conservent leur propre sémantique.
Les budgets des outils dynamiques sont plafonnés à 600000 ms. En cas de dépassement du délai, OpenClaw interrompt le
signal de l’outil lorsque cela est pris en charge et renvoie à
Codex une réponse d’échec de l’outil dynamique afin que le tour puisse continuer, au lieu de laisser la session dans
`processing`.

Une fois qu’un tour a été accepté par Codex et qu’OpenClaw a répondu à une requête du
serveur d’application limitée au tour, le dispositif attend de Codex qu’il progresse dans le tour actuel
et termine finalement le tour natif avec `turn/completed`. Si le
serveur d’application reste silencieux pendant `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
tente d’interrompre le tour Codex, enregistre un diagnostic de dépassement de délai et
libère la voie de session OpenClaw afin que les messages de discussion suivants ne restent pas en attente
derrière un tour natif obsolète.

La plupart des notifications non terminales du même tour désarment ce court mécanisme de surveillance,
car Codex a prouvé que le tour est toujours actif. Les transferts d’outils utilisent un budget
d’inactivité après outil plus long : après qu’OpenClaw a renvoyé une réponse `item/tool/call`,
après l’achèvement d’éléments d’outils natifs tels que `commandExecution`, après les achèvements
bruts `custom_tool_call_output`, ainsi qu’après la progression brute de l’assistant
postérieure à l’outil, les achèvements de raisonnement brut ou la progression du raisonnement. Le mécanisme de protection utilise
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` lorsqu’il est configuré et
cinq minutes par défaut dans les autres cas. Ce même budget postérieur à l’outil prolonge également
le mécanisme de surveillance de la progression pendant la fenêtre de synthèse silencieuse précédant l’émission par Codex du
prochain événement du tour actuel. Les achèvements de raisonnement, les achèvements `agentMessage`
de commentaire et la progression brute du raisonnement ou de l’assistant antérieure à l’outil peuvent être suivis
d’une réponse finale automatique ; ils utilisent donc le mécanisme de protection de réponse postérieure à la progression
au lieu de libérer immédiatement la voie de session. Seuls les éléments `agentMessage`
terminés finaux ou hors commentaire et les achèvements bruts de l’assistant antérieurs à l’outil activent la
libération de la sortie de l’assistant : si Codex reste ensuite silencieux sans `turn/completed`,
OpenClaw tente d’interrompre le tour natif et libère la voie de
session. Les échecs du serveur d’application stdio pouvant être rejoués en toute sécurité, notamment les délais
d’inactivité d’achèvement du tour sans preuve provenant de l’assistant, d’un outil, d’un élément actif ou d’un
effet secondaire, font l’objet d’une nouvelle tentative unique sur un nouveau serveur d’application. Les délais d’expiration
non sûrs entraînent néanmoins le retrait du client de serveur d’application bloqué et la libération de la voie de session
OpenClaw. Ils suppriment également la liaison obsolète du fil natif au lieu d’être rejoués
automatiquement. Les délais d’expiration de surveillance de l’achèvement affichent un texte propre à Codex :
les cas pouvant être rejoués en toute sécurité indiquent que la réponse peut être incomplète, tandis que les cas non sûrs demandent
à l’utilisateur de vérifier l’état actuel avant de réessayer. Les diagnostics publics de dépassement de délai
incluent des champs structurels tels que la dernière méthode de notification du serveur d’application,
l’identifiant, le type et le rôle de l’élément de réponse brute de l’assistant, le nombre de requêtes et d’éléments actifs, ainsi que
l’état de surveillance activé. Lorsque la dernière notification est un élément de réponse brute de
l’assistant, ils incluent également un aperçu limité du texte de l’assistant. Ils n’incluent pas
le contenu brut de l’invite ou des outils.

## Découverte des modèles

Par défaut, le Plugin Codex demande au serveur d’application les modèles disponibles. La
disponibilité des modèles relève du serveur d’application Codex ; la liste peut donc changer lorsque
OpenClaw met à niveau la version intégrée de `@openai/codex` ou lorsqu’un déploiement
fait pointer `appServer.command` vers un autre binaire Codex. La disponibilité peut également
dépendre du compte. Utilisez `/codex models` sur un Gateway en cours d’exécution pour consulter le catalogue
actuel de ce dispositif et de ce compte.

Si la découverte échoue ou dépasse le délai imparti, OpenClaw utilise un catalogue de secours intégré :

| Identifiant du modèle | Nom d’affichage | Niveaux de raisonnement   |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | faible, moyen, élevé, très élevé |
| `gpt-5.4-mini` | GPT-5.4-Mini | faible, moyen, élevé, très élevé |

<Note>
Le dispositif intégré actuel est `@openai/codex` `0.144.3`. Une sonde `model/list`
exécutée sur ce serveur d’application intégré a renvoyé les lignes publiques suivantes du sélecteur :

| Identifiant du modèle | Modalités d’entrée | Niveaux de raisonnement                    |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | texte, image      | faible, moyen, élevé, très élevé, maximal, ultra |
| `gpt-5.6-terra` | texte, image      | faible, moyen, élevé, très élevé, maximal, ultra |
| `gpt-5.6-luna`  | texte, image      | faible, moyen, élevé, très élevé, maximal        |
| `gpt-5.5`       | texte, image      | faible, moyen, élevé, très élevé             |
| `gpt-5.4`       | texte, image      | faible, moyen, élevé, très élevé             |
| `gpt-5.4-mini`  | texte, image      | faible, moyen, élevé, très élevé             |
| `gpt-5.2`       | texte, image      | faible, moyen, élevé, très élevé             |

Le catalogue du serveur d’application peut indiquer `ultra` ; les contrôles de raisonnement OpenClaw exposent actuellement
les niveaux jusqu’à `max`.

Les lignes du sélecteur en direct dépendent du compte et peuvent changer selon le compte, le catalogue
Codex ou la version intégrée ; exécutez `/codex models` pour obtenir la liste actuelle plutôt
que de vous fier à un tableau établi à un instant donné. Des modèles masqués peuvent également apparaître dans le
catalogue du serveur d’application pour des flux internes ou spécialisés sans constituer des choix ordinaires
du sélecteur de modèles.
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

Désactivez la découverte lorsque vous souhaitez éviter l’interrogation de Codex au démarrage et utiliser uniquement
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

Codex gère lui-même `AGENTS.md` au moyen de la découverte native de la documentation du projet.
OpenClaw n’écrit pas de fichiers synthétiques de documentation de projet Codex et ne dépend pas des noms
de fichiers de secours de Codex pour les fichiers de personnalité, car les mécanismes de secours de Codex ne s’appliquent que lorsque
`AGENTS.md` est absent.

Pour assurer la parité avec l’espace de travail OpenClaw, le dispositif Codex transmet les autres
fichiers d’amorçage sous forme d’instructions destinées aux développeurs, mais pas de manière identique :

- `TOOLS.md` est transmis en tant qu’instructions de développement Codex **héritées**, afin que
  les sous-agents Codex natifs créés pendant le tour les reçoivent également.
- `SOUL.md`, `IDENTITY.md` et `USER.md` sont transmis en tant qu’instructions de collaboration
  **limitées au tour**. Les sous-agents Codex natifs ne les héritent pas,
  ce qui évite que les tours des sous-agents reprennent la personnalité et
  le profil utilisateur de l’agent parent.
- La liste compacte des Skills OpenClaw chargés est également transmise sous forme d’instructions de développement
  de collaboration limitées au tour, afin que les sous-agents Codex natifs ne
  l’héritent pas non plus.
- Le contenu de `HEARTBEAT.md` n’est pas injecté ; les tours Heartbeat reçoivent un
  pointeur en mode collaboration leur demandant de lire le fichier lorsqu’il existe et n’est
  pas vide.
- Le contenu de `MEMORY.md` provenant de l’espace de travail configuré de l’agent n’est pas inséré dans
  l’entrée native du tour Codex lorsque des outils de mémoire sont disponibles pour cet
  espace de travail ; lorsqu’il existe, le dispositif ajoute un petit pointeur vers la mémoire de l’espace de travail
  aux instructions de développement de collaboration limitées au tour, et Codex
  doit utiliser `memory_search` ou `memory_get` lorsque la mémoire persistante est pertinente.
  Si les outils sont désactivés, si la recherche dans la mémoire est indisponible ou si l’espace de travail actif
  diffère de l’espace de travail de mémoire de l’agent, `MEMORY.md` utilise plutôt le
  chemin normal de contexte limité au tour.
- `BOOTSTRAP.md`, lorsqu’il est présent, est transmis en tant que contexte de référence d’entrée du tour
  OpenClaw.

## Remplacements par variables d’environnement

Les remplacements par variables d’environnement restent disponibles pour les tests locaux :

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
préférable pour les déploiements reproductibles, car elle conserve le comportement du Plugin dans
le même fichier révisé que le reste de la configuration du dispositif Codex.

## Rubriques connexes

- [Dispositif Codex](/fr/plugins/codex-harness)
- [Environnement d’exécution du dispositif Codex](/fr/plugins/codex-harness-runtime)
- [Supervision de Codex](/fr/plugins/codex-supervision)
- [Plugins Codex natifs](/fr/plugins/codex-native-plugins)
- [Utilisation de l’ordinateur avec Codex](/fr/plugins/codex-computer-use)
- [Fournisseur OpenAI](/fr/providers/openai)
- [Référence de configuration](/fr/gateway/configuration-reference)
