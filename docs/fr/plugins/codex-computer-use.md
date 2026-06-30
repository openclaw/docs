---
read_when:
    - Vous voulez que les agents OpenClaw en mode Codex utilisent Codex Computer Use
    - Vous choisissez entre Codex Computer Use, PeekabooBridge et le MCP direct cua-driver
    - Vous devez choisir entre Codex Computer Use et une configuration MCP directe de cua-driver
    - Vous configurez computerUse pour le Plugin Codex intégré
    - Vous dépannez l’état ou l’installation de /codex computer-use
summary: Configurer Codex Computer Use pour les agents OpenClaw en mode Codex
title: Utilisation de l’ordinateur avec Codex
x-i18n:
    generated_at: "2026-06-30T13:58:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use est un Plugin MCP natif de Codex pour le contrôle du bureau local. OpenClaw
n’intègre pas l’application de bureau, n’exécute pas lui-même d’actions de bureau et ne contourne pas
les autorisations Codex. Le Plugin `codex` intégré prépare uniquement le app-server Codex :
il active la prise en charge des Plugins Codex, trouve ou installe le Plugin Codex
Computer Use configuré, vérifie que le serveur MCP `computer-use` est disponible, puis
laisse Codex gérer les appels d’outils MCP natifs pendant les tours en mode Codex.

Utilisez cette page quand OpenClaw utilise déjà le harness Codex natif. Pour la
configuration du runtime elle-même, consultez [harness Codex](/fr/plugins/codex-harness).

## OpenClaw.app et Peekaboo

L’intégration Peekaboo d’OpenClaw.app est distincte de Codex Computer Use. L’application
macOS peut héberger un socket PeekabooBridge afin que la CLI `peekaboo` puisse réutiliser les
autorisations locales d’accessibilité et d’enregistrement de l’écran de l’application pour les propres
outils d’automatisation de Peekaboo. Ce bridge n’installe pas et ne proxyfie pas Codex Computer Use, et
Codex Computer Use ne passe pas par le socket PeekabooBridge.

Utilisez [bridge Peekaboo](/fr/platforms/mac/peekaboo) lorsque vous voulez qu’OpenClaw.app soit
un hôte conscient des autorisations pour l’automatisation Peekaboo CLI. Utilisez cette page lorsqu’un
agent OpenClaw en mode Codex doit disposer du Plugin MCP `computer-use` natif de Codex
avant le début du tour.

## Application iOS

L’application iOS est distincte de Codex Computer Use. Elle n’installe pas et ne proxyfie pas
le serveur MCP Codex `computer-use`, et ce n’est pas un backend de contrôle du bureau.
À la place, l’application iOS se connecte comme nœud OpenClaw et expose des capacités
mobiles au moyen de commandes de nœud telles que `canvas.*`, `camera.*`, `screen.*`,
`location.*` et `talk.*`.

Utilisez [iOS](/fr/platforms/ios) lorsque vous voulez qu’un agent pilote un nœud iPhone via
le Gateway. Utilisez cette page lorsqu’un agent en mode Codex doit contrôler le bureau
macOS local via le Plugin Computer Use natif de Codex.

## MCP cua-driver direct

Codex Computer Use n’est pas la seule façon d’exposer le contrôle du bureau. Si vous voulez
que les runtimes gérés par OpenClaw appellent directement le driver de TryCua, utilisez le serveur
amont `cua-driver mcp` via le registre MCP d’OpenClaw plutôt que le flux de marketplace
spécifique à Codex.

Après avoir installé `cua-driver`, demandez-lui la commande OpenClaw :

```bash
cua-driver mcp-config --client openclaw
```

ou enregistrez vous-même le serveur stdio :

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Ce chemin conserve intacte la surface d’outils MCP amont, y compris les schémas du driver
et les réponses MCP structurées. Utilisez-le lorsque vous voulez que le driver CUA soit
disponible comme serveur MCP OpenClaw normal. Utilisez la configuration Codex Computer Use
de cette page lorsque le app-server Codex doit gérer l’installation du Plugin, les rechargements MCP
et les appels d’outils natifs dans les tours en mode Codex.

Le driver CUA est spécifique à macOS et nécessite toujours les autorisations macOS locales
demandées par son application, comme l’accessibilité et l’enregistrement de l’écran. OpenClaw
n’installe pas `cua-driver`, n’accorde pas ces autorisations et ne contourne pas le modèle de sécurité
du driver amont.

## Configuration rapide

Définissez `plugins.entries.codex.config.computerUse` lorsque les tours en mode Codex doivent disposer de
Computer Use avant le démarrage d’un fil. `autoInstall: true` active
Computer Use et laisse OpenClaw l’installer ou le réactiver avant le tour :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Avec cette configuration, OpenClaw vérifie le app-server Codex avant chaque tour en mode Codex.
Si Computer Use est manquant mais que le app-server Codex a déjà découvert une
marketplace installable, OpenClaw demande au app-server Codex d’installer ou de réactiver
le Plugin et de recharger les serveurs MCP. Sur macOS, lorsqu’aucune marketplace correspondante
n’est enregistrée et que le bundle d’application Codex standard existe, OpenClaw essaie aussi
d’enregistrer la marketplace Codex intégrée depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` avant
d’échouer. Si la configuration ne parvient toujours pas à rendre le serveur MCP disponible, le tour échoue
avant le démarrage du fil.

Après avoir modifié la configuration de Computer Use, utilisez `/new` ou `/reset` dans la conversation
concernée avant de tester si un fil Codex existant a déjà démarré.

Au démarrage stdio géré sur macOS, OpenClaw privilégie le bundle signé de l’application de bureau Codex
situé à `/Applications/Codex.app/Contents/Resources/codex` lorsqu’il existe.
Cela maintient Computer Use sous le bundle d’application qui détient les autorisations locales de contrôle
du bureau. Si l’application de bureau n’est pas installée, OpenClaw se rabat sur le
binaire Codex géré installé à côté du Plugin. Si une application de bureau installée
s’initialise avec une version de app-server non prise en charge, OpenClaw ferme cet enfant
et essaie le candidat de binaire géré suivant au lieu de laisser une
application de bureau obsolète masquer le repli local au Plugin. Une configuration explicite `appServer.command`
ou `OPENCLAW_CODEX_APP_SERVER_BIN` remplace toujours cette sélection gérée.

## Commandes

Utilisez les commandes `/codex computer-use` depuis toute interface de conversation où la surface de commandes du Plugin `codex`
est disponible. Ce sont des commandes de conversation/runtime OpenClaw,
pas des sous-commandes CLI `openclaw codex ...` :

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` est en lecture seule. Il n’ajoute pas de sources de marketplace, n’installe pas de Plugins et
n’active pas la prise en charge des Plugins Codex. Si aucune configuration n’active Computer Use, `status` peut
indiquer disabled même après une commande d’installation ponctuelle.

`install` active la prise en charge des Plugins du app-server Codex, ajoute éventuellement une
source de marketplace configurée, installe ou réactive le Plugin configuré via le app-server Codex,
recharge les serveurs MCP et vérifie que le serveur MCP expose des outils.
Comme l’installation modifie des ressources d’hôte de confiance, seul un propriétaire ou un
client Gateway `operator.admin` peut exécuter `install`. Les autres expéditeurs autorisés peuvent
continuer à utiliser la commande `status` en lecture seule, y compris avec des remplacements.

## Choix de marketplace

OpenClaw utilise la même API de app-server que celle exposée par Codex lui-même. Les
champs de marketplace choisissent où Codex doit trouver `computer-use`.

| Champ                | À utiliser quand                                                        | Prise en charge de l’installation                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Aucun champ de marketplace | Vous voulez que le app-server Codex utilise les marketplaces qu’il connaît déjà. | Oui, lorsque le app-server renvoie une marketplace locale.        |
| `marketplaceSource`  | Vous avez une source de marketplace Codex que le app-server peut ajouter.         | Oui, pour `/codex computer-use install` explicite.         |
| `marketplacePath`    | Vous connaissez déjà le chemin du fichier de marketplace local sur l’hôte.   | Oui, pour l’installation explicite et l’installation automatique au démarrage du tour.   |
| `marketplaceName`    | Vous voulez sélectionner une marketplace déjà enregistrée par son nom.  | Oui uniquement lorsque la marketplace sélectionnée a un chemin local. |

Les homes Codex récents peuvent avoir besoin d’un court instant pour amorcer leurs marketplaces officielles.
Pendant l’installation, OpenClaw interroge `plugin/list` pendant au plus
`marketplaceDiscoveryTimeoutMs` millisecondes. La valeur par défaut est de 60 secondes.

Si plusieurs marketplaces connues contiennent Computer Use, OpenClaw privilégie
`openai-bundled`, puis `openai-curated`, puis `local`. Les correspondances ambiguës inconnues
échouent en mode fermé et vous demandent de définir `marketplaceName` ou `marketplacePath`.

## Marketplace macOS intégrée

Les builds récents du bureau Codex intègrent Computer Use ici :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Lorsque `computerUse.autoInstall` vaut true et qu’aucune marketplace contenant
`computer-use` n’est enregistrée, OpenClaw essaie d’ajouter automatiquement la racine
standard de la marketplace intégrée :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Vous pouvez aussi l’enregistrer explicitement depuis un shell avec Codex :

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Si vous utilisez un chemin d’application Codex non standard, exécutez `/codex computer-use install
--source <marketplace-root>` une fois ou définissez `computerUse.marketplacePath` sur un
chemin de fichier de marketplace local. Utilisez `--marketplace-path` uniquement lorsque vous avez le
chemin du fichier JSON de marketplace, pas la racine de la marketplace intégrée.

## Limite du catalogue distant

Le app-server Codex peut lister et lire les entrées de catalogue uniquement distantes, mais il ne prend pas
actuellement en charge `plugin/install` distant. Cela signifie que `marketplaceName` peut
sélectionner une marketplace uniquement distante pour les vérifications de statut, mais les installations et réactivations
ont toujours besoin d’une marketplace locale via `marketplaceSource` ou `marketplacePath`.

Si le statut indique que le Plugin est disponible dans une marketplace Codex distante mais que l’installation distante
n’est pas prise en charge, exécutez l’installation avec une source ou un chemin local :

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Référence de configuration

| Champ                           | Valeur par défaut        | Signification                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Exiger Computer Use. Par défaut à true lorsqu’un autre champ Computer Use est défini. |
| `autoInstall`                   | false          | Installer ou réactiver depuis les marketplaces déjà découvertes au démarrage du tour.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Durée pendant laquelle l’installation attend la découverte des marketplaces par le app-server Codex.             |
| `marketplaceSource`             | unset          | Chaîne source transmise à `marketplace/add` du app-server Codex.                    |
| `marketplacePath`               | unset          | Chemin du fichier de marketplace Codex local contenant le Plugin.                       |
| `marketplaceName`               | unset          | Nom de marketplace Codex enregistrée à sélectionner.                                   |
| `pluginName`                    | `computer-use` | Nom du Plugin de marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nom du serveur MCP exposé par le Plugin installé.                               |

L’installation automatique au démarrage du tour refuse intentionnellement les valeurs `marketplaceSource`
configurées. L’ajout d’une nouvelle source est une opération de configuration explicite ; utilisez donc
`/codex computer-use install --source <marketplace-source>` une fois, puis laissez
`autoInstall` gérer les futures réactivations depuis les marketplaces locales découvertes.
L’installation automatique au démarrage du tour peut utiliser un `marketplacePath` configuré, car il s’agit
déjà d’un chemin local sur l’hôte.

## Ce qu’OpenClaw vérifie

OpenClaw signale en interne un motif de configuration stable et met en forme le statut visible par l’utilisateur
pour la conversation :

| Raison                       | Signification                                          | Étape suivante                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` a été résolu à false.            | Définissez `enabled` ou un autre champ Computer Use. |
| `marketplace_missing`        | Aucune place de marché correspondante n’était disponible. | Configurez la source, le chemin ou le nom de la place de marché. |
| `plugin_not_installed`       | La place de marché existe, mais le Plugin n’est pas installé. | Exécutez l’installation ou activez `autoInstall`. |
| `plugin_disabled`            | Le Plugin est installé mais désactivé dans la configuration Codex. | Exécutez l’installation pour le réactiver.    |
| `remote_install_unsupported` | La place de marché sélectionnée est uniquement distante. | Utilisez `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | Le Plugin est activé, mais le serveur MCP est indisponible. | Vérifiez Computer Use de Codex et les autorisations du système d’exploitation. |
| `ready`                      | Le Plugin et les outils MCP sont disponibles.          | Démarrez le tour en mode Codex.               |
| `check_failed`               | Une requête du serveur d’application Codex a échoué pendant la vérification de l’état. | Vérifiez la connectivité et les journaux du serveur d’application. |
| `auto_install_blocked`       | La configuration au démarrage du tour devrait ajouter une nouvelle source. | Exécutez d’abord une installation explicite.  |

La sortie du chat inclut l’état du Plugin, l’état du serveur MCP, la place de marché, les outils
lorsqu’ils sont disponibles, ainsi que le message précis de l’étape de configuration en échec.

## Autorisations macOS

Computer Use est propre à macOS. Le serveur MCP appartenant à Codex peut nécessiter des
autorisations locales du système d’exploitation avant de pouvoir inspecter ou contrôler des applications. Si OpenClaw indique que Computer Use
est installé mais que le serveur MCP est indisponible, vérifiez d’abord la configuration Computer
Use côté Codex :

- Le serveur d’application Codex s’exécute sur le même hôte que celui où le contrôle du bureau doit
  avoir lieu.
- Le Plugin Computer Use est activé dans la configuration Codex.
- Le serveur MCP `computer-use` apparaît dans l’état MCP du serveur d’application Codex.
- macOS a accordé les autorisations requises à l’application de contrôle du bureau.
- La session hôte actuelle peut accéder au bureau contrôlé.

OpenClaw échoue volontairement en mode fermé lorsque `computerUse.enabled` est true. Un
tour en mode Codex ne doit pas continuer silencieusement sans les outils de bureau natifs
requis par la configuration.

## Dépannage

**L’état indique non installé.** Exécutez `/codex computer-use install`. Si la
place de marché n’est pas détectée, passez `--source` ou `--marketplace-path`.

**L’état indique installé mais désactivé.** Exécutez à nouveau `/codex computer-use install`.
L’installation du serveur d’application Codex réécrit la configuration du Plugin en l’activant.

**L’état indique que l’installation distante n’est pas prise en charge.** Utilisez une source ou
un chemin de place de marché local. Les entrées de catalogue uniquement distantes peuvent être inspectées, mais pas installées via l’API actuelle du serveur d’application.

**L’état indique que le serveur MCP est indisponible.** Relancez l’installation une fois afin que les serveurs MCP
se rechargent. S’il reste indisponible, corrigez l’application Codex Computer Use,
l’état MCP du serveur d’application Codex ou les autorisations macOS.

**L’état ou une sonde expire sur `computer-use.list_apps`.** Le Plugin et le serveur MCP
sont présents, mais le pont Computer Use local n’a pas répondu. Quittez ou
redémarrez Codex Computer Use, relancez Codex Desktop si nécessaire, puis réessayez dans une
nouvelle session OpenClaw. Si l’hôte exécutait auparavant Computer Use via un ancien
serveur d’application Codex géré, actualisez le Plugin installé depuis la place de marché groupée
du bureau :

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Un outil Computer Use indique `Native hook relay unavailable`.** Le hook d’outil natif Codex
n’a pas pu atteindre un relais OpenClaw actif via le pont local ou le
repli Gateway. Démarrez une nouvelle session OpenClaw avec `/new` ou `/reset`. Si cela
fonctionne une fois puis échoue à nouveau lors d’un appel d’outil ultérieur, `/new` ne fait qu’effacer la
tentative actuelle ; redémarrez le serveur d’application Codex ou le Gateway OpenClaw afin que les anciens fils
et enregistrements de hooks soient supprimés, puis réessayez dans une nouvelle session.

**L’installation automatique au démarrage du tour refuse une source.** C’est intentionnel. Ajoutez la
source avec `/codex computer-use install --source <marketplace-source>` explicite
d’abord, puis les futures installations automatiques au démarrage du tour pourront utiliser la
place de marché locale découverte.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [Pont Peekaboo](/fr/platforms/mac/peekaboo)
- [Application iOS](/fr/platforms/ios)
