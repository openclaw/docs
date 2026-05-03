---
read_when:
    - Vous souhaitez que les agents OpenClaw en mode Codex utilisent Codex Computer Use
    - Vous choisissez entre Codex Computer Use, PeekabooBridge et l’utilisation directe de cua-driver MCP
    - Vous hésitez entre Codex Computer Use et une configuration MCP directe avec cua-driver
    - Vous configurez computerUse pour le Plugin Codex inclus
    - Vous dépannez l’état ou l’installation de /codex computer-use
summary: Configurer l’utilisation de l’ordinateur par Codex pour les agents OpenClaw en mode Codex
title: Utilisation de l’ordinateur par Codex
x-i18n:
    generated_at: "2026-05-03T07:11:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use est un Plugin MCP natif de Codex pour le contrôle du bureau local. OpenClaw
n’intègre pas l’application de bureau, n’exécute pas lui-même les actions de bureau et ne contourne pas
les autorisations de Codex. Le Plugin `codex` inclus prépare uniquement le serveur d’application Codex :
il active la prise en charge des Plugins Codex, trouve ou installe le Plugin Codex
Computer Use configuré, vérifie que le serveur MCP `computer-use` est disponible, puis
laisse Codex gérer les appels d’outils MCP natifs pendant les tours en mode Codex.

Utilisez cette page quand OpenClaw utilise déjà le harnais natif Codex. Pour la
configuration de l’environnement d’exécution lui-même, consultez [harnais Codex](/fr/plugins/codex-harness).

## OpenClaw.app et Peekaboo

L’intégration Peekaboo d’OpenClaw.app est distincte de Codex Computer Use. L’application
macOS peut héberger un socket PeekabooBridge afin que la CLI `peekaboo` puisse réutiliser les
autorisations locales d’Accessibilité et d’Enregistrement de l’écran de l’application pour les propres
outils d’automatisation de Peekaboo. Ce pont n’installe pas et ne relaie pas Codex Computer Use, et
Codex Computer Use ne passe pas par le socket PeekabooBridge.

Utilisez [pont Peekaboo](/fr/platforms/mac/peekaboo) quand vous voulez qu’OpenClaw.app soit
un hôte conscient des autorisations pour l’automatisation CLI Peekaboo. Utilisez cette page quand un
agent OpenClaw en mode Codex doit disposer du Plugin MCP natif `computer-use` de Codex
avant le début du tour.

## Application iOS

L’application iOS est distincte de Codex Computer Use. Elle n’installe pas et ne relaie pas
le serveur MCP `computer-use` de Codex, et ce n’est pas un backend de contrôle du bureau.
À la place, l’application iOS se connecte en tant que nœud OpenClaw et expose des capacités
mobiles via des commandes de nœud comme `canvas.*`, `camera.*`, `screen.*`,
`location.*` et `talk.*`.

Utilisez [iOS](/fr/platforms/ios) quand vous voulez qu’un agent pilote un nœud iPhone via
le Gateway. Utilisez cette page quand un agent en mode Codex doit contrôler le bureau macOS
local via le Plugin natif Computer Use de Codex.

## MCP cua-driver direct

Codex Computer Use n’est pas le seul moyen d’exposer le contrôle du bureau. Si vous voulez
que les environnements d’exécution gérés par OpenClaw appellent directement le pilote TryCua, utilisez le serveur
`cua-driver mcp` amont via le registre MCP d’OpenClaw au lieu du flux de marketplace
propre à Codex.

Après avoir installé `cua-driver`, demandez-lui la commande OpenClaw :

```bash
cua-driver mcp-config --client openclaw
```

ou enregistrez vous-même le serveur stdio :

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Cette voie conserve intacte la surface d’outils MCP amont, y compris les schémas du pilote
et les réponses MCP structurées. Utilisez-la quand vous voulez que le pilote CUA
soit disponible comme serveur MCP OpenClaw normal. Utilisez la configuration Codex Computer Use de
cette page quand le serveur d’application Codex doit gérer l’installation du Plugin, les rechargements MCP
et les appels d’outils natifs dans les tours en mode Codex.

Le pilote de CUA est spécifique à macOS et nécessite toujours les autorisations macOS locales
demandées par son application, comme l’Accessibilité et l’Enregistrement de l’écran. OpenClaw
n’installe pas `cua-driver`, n’accorde pas ces autorisations et ne contourne pas le modèle de sécurité
du pilote amont.

## Configuration rapide

Définissez `plugins.entries.codex.config.computerUse` lorsque les tours en mode Codex doivent disposer de
Computer Use avant le démarrage d’un fil :

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Avec cette configuration, OpenClaw vérifie le serveur d’application Codex avant chaque tour en mode Codex.
Si Computer Use est absent mais que le serveur d’application Codex a déjà découvert une
marketplace installable, OpenClaw demande au serveur d’application Codex d’installer ou de réactiver
le Plugin et de recharger les serveurs MCP. Sur macOS, lorsqu’aucune marketplace correspondante
n’est enregistrée et que le bundle standard de l’application Codex existe, OpenClaw essaie aussi
d’enregistrer la marketplace Codex incluse depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` avant d’échouer.
Si la configuration ne parvient toujours pas à rendre le serveur MCP disponible, le tour échoue
avant le démarrage du fil.

Les sessions existantes conservent leur environnement d’exécution et leur liaison au fil Codex. Après avoir modifié
`agentRuntime` ou la configuration Computer Use, utilisez `/new` ou `/reset` dans la conversation
concernée avant de tester.

## Commandes

Utilisez les commandes `/codex computer-use` depuis toute surface de conversation où la surface de commande du Plugin
`codex` est disponible. Ce sont des commandes de conversation/environnement d’exécution OpenClaw,
pas des sous-commandes CLI `openclaw codex ...` :

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` est en lecture seule. Elle n’ajoute pas de sources de marketplace, n’installe pas de Plugins et
n’active pas la prise en charge des Plugins Codex.

`install` active la prise en charge des Plugins du serveur d’application Codex, ajoute éventuellement une
source de marketplace configurée, installe ou réactive le Plugin configuré via le serveur
d’application Codex, recharge les serveurs MCP et vérifie que le serveur MCP expose des outils.

## Choix de marketplace

OpenClaw utilise la même API de serveur d’application que Codex expose lui-même. Les
champs de marketplace choisissent où Codex doit trouver `computer-use`.

| Champ                | À utiliser quand                                                        | Prise en charge de l’installation                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Aucun champ de marketplace | Vous voulez que le serveur d’application Codex utilise les marketplaces qu’il connaît déjà. | Oui, quand le serveur d’application renvoie une marketplace locale.        |
| `marketplaceSource`  | Vous avez une source de marketplace Codex que le serveur d’application peut ajouter.         | Oui, pour un `/codex computer-use install` explicite.         |
| `marketplacePath`    | Vous connaissez déjà le chemin de fichier de la marketplace locale sur l’hôte.   | Oui, pour l’installation explicite et l’installation automatique au début du tour.   |
| `marketplaceName`    | Vous voulez sélectionner par nom une marketplace déjà enregistrée.  | Oui uniquement lorsque la marketplace sélectionnée a un chemin local. |

Les nouveaux dossiers personnels Codex peuvent avoir besoin d’un court délai pour initialiser leurs marketplaces officielles.
Pendant l’installation, OpenClaw interroge `plugin/list` pendant au maximum
`marketplaceDiscoveryTimeoutMs` millisecondes. La valeur par défaut est de 60 secondes.

Si plusieurs marketplaces connues contiennent Computer Use, OpenClaw préfère
`openai-bundled`, puis `openai-curated`, puis `local`. Les correspondances ambiguës inconnues
échouent fermées et vous demandent de définir `marketplaceName` ou `marketplacePath`.

## Marketplace macOS incluse

Les versions récentes du bureau Codex incluent Computer Use ici :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Lorsque `computerUse.autoInstall` vaut true et qu’aucune marketplace contenant
`computer-use` n’est enregistrée, OpenClaw essaie d’ajouter automatiquement la racine standard
de la marketplace incluse :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Vous pouvez aussi l’enregistrer explicitement depuis un shell avec Codex :

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Si vous utilisez un chemin d’application Codex non standard, définissez `computerUse.marketplacePath` sur un
chemin de fichier de marketplace locale ou exécutez `/codex computer-use install --source
<marketplace-source>` une fois.

## Limite du catalogue distant

Le serveur d’application Codex peut lister et lire les entrées de catalogue uniquement distantes, mais il ne prend pas
actuellement en charge `plugin/install` distant. Cela signifie que `marketplaceName` peut
sélectionner une marketplace uniquement distante pour les vérifications de statut, mais les installations et réactivations
nécessitent toujours une marketplace locale via `marketplaceSource` ou `marketplacePath`.

Si le statut indique que le Plugin est disponible dans une marketplace Codex distante mais que l’installation
distante n’est pas prise en charge, exécutez l’installation avec une source ou un chemin local :

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Référence de configuration

| Champ                           | Par défaut        | Signification                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | déduit       | Exiger Computer Use. La valeur par défaut est true lorsqu’un autre champ Computer Use est défini. |
| `autoInstall`                   | false          | Installer ou réactiver depuis les marketplaces déjà découvertes au début du tour.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Durée pendant laquelle l’installation attend la découverte de marketplace par le serveur d’application Codex.             |
| `marketplaceSource`             | non défini          | Chaîne source transmise à `marketplace/add` du serveur d’application Codex.                    |
| `marketplacePath`               | non défini          | Chemin de fichier de marketplace Codex locale contenant le Plugin.                       |
| `marketplaceName`               | non défini          | Nom de marketplace Codex enregistrée à sélectionner.                                   |
| `pluginName`                    | `computer-use` | Nom du Plugin de marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nom du serveur MCP exposé par le Plugin installé.                               |

L’installation automatique au début du tour refuse intentionnellement les valeurs `marketplaceSource`
configurées. L’ajout d’une nouvelle source est une opération de configuration explicite, donc utilisez
`/codex computer-use install --source <marketplace-source>` une fois, puis laissez
`autoInstall` gérer les futures réactivations depuis les marketplaces locales découvertes.
L’installation automatique au début du tour peut utiliser un `marketplacePath` configuré, car il s’agit
déjà d’un chemin local sur l’hôte.

## Ce qu’OpenClaw vérifie

OpenClaw signale en interne une raison de configuration stable et met en forme le statut
destiné à l’utilisateur pour la conversation :

| Raison                       | Signification                                                | Étape suivante                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` est résolu à false.               | Définissez `enabled` ou un autre champ Computer Use.  |
| `marketplace_missing`        | Aucune marketplace correspondante n’était disponible.                 | Configurez la source, le chemin ou le nom de marketplace.  |
| `plugin_not_installed`       | La marketplace existe, mais le Plugin n’est pas installé.   | Exécutez l’installation ou activez `autoInstall`.          |
| `plugin_disabled`            | Le Plugin est installé mais désactivé dans la configuration Codex.      | Exécutez l’installation pour le réactiver.                  |
| `remote_install_unsupported` | La marketplace sélectionnée est uniquement distante.                   | Utilisez `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | Le Plugin est activé, mais le serveur MCP est indisponible.  | Vérifiez Codex Computer Use et les autorisations du système d’exploitation.  |
| `ready`                      | Le Plugin et les outils MCP sont disponibles.                    | Démarrez le tour en mode Codex.                    |
| `check_failed`               | Une requête au serveur d’application Codex a échoué pendant la vérification du statut. | Vérifiez la connectivité et les journaux du serveur d’application.       |
| `auto_install_blocked`       | La configuration au début du tour devrait ajouter une nouvelle source.       | Exécutez d’abord une installation explicite.                   |

La sortie de conversation inclut l’état du Plugin, l’état du serveur MCP, la marketplace, les outils
lorsqu’ils sont disponibles, ainsi que le message précis de l’étape de configuration en échec.

## Autorisations macOS

Computer Use est spécifique à macOS. Le serveur MCP géré par Codex peut nécessiter des
autorisations locales du système d’exploitation avant de pouvoir inspecter ou contrôler des applications. Si OpenClaw indique que Computer Use
est installé mais que le serveur MCP est indisponible, vérifiez d’abord la configuration Computer
Use côté Codex :

- Codex app-server s’exécute sur le même hôte où le contrôle du bureau doit
  avoir lieu.
- Le Plugin Computer Use est activé dans la configuration de Codex.
- Le serveur MCP `computer-use` apparaît dans l’état MCP de Codex app-server.
- macOS a accordé les permissions requises pour l’app de contrôle du bureau.
- La session actuelle de l’hôte peut accéder au bureau contrôlé.

OpenClaw échoue intentionnellement en mode fermé lorsque `computerUse.enabled` est true. Une
interaction en mode Codex ne doit pas se poursuivre silencieusement sans les outils de bureau natifs
exigés par la configuration.

## Dépannage

**L’état indique que ce n’est pas installé.** Exécutez `/codex computer-use install`. Si la
place de marché n’est pas découverte, passez `--source` ou `--marketplace-path`.

**L’état indique que c’est installé mais désactivé.** Exécutez à nouveau `/codex computer-use install`.
L’installation de Codex app-server réécrit la configuration du Plugin avec l’état activé.

**L’état indique que l’installation distante n’est pas prise en charge.** Utilisez une source ou un
chemin de place de marché local. Les entrées de catalogue disponibles uniquement à distance peuvent être inspectées, mais pas installées via l’API app-server actuelle.

**L’état indique que le serveur MCP n’est pas disponible.** Relancez l’installation une fois afin que les serveurs MCP
se rechargent. S’il reste indisponible, corrigez l’app Codex Computer Use,
l’état MCP de Codex app-server ou les permissions macOS.

**L’état ou une sonde expire sur `computer-use.list_apps`.** Le Plugin et le serveur MCP
sont présents, mais le pont local Computer Use n’a pas répondu. Quittez ou
redémarrez Codex Computer Use, relancez Codex Desktop si nécessaire, puis réessayez dans une
nouvelle session OpenClaw.

**Un outil Computer Use indique `Native hook relay unavailable`.** Le hook d’outil natif Codex
n’a pas pu atteindre un relais OpenClaw actif via le pont local ou le repli
Gateway. Démarrez une nouvelle session OpenClaw avec `/new` ou `/reset`. Si cela
continue, redémarrez le gateway afin que les anciens threads app-server et les enregistrements de hooks
soient supprimés, puis réessayez.

**L’auto-installation au démarrage d’une interaction refuse une source.** C’est intentionnel. Ajoutez d’abord la
source avec `/codex computer-use install --source <marketplace-source>` explicite,
puis les futures auto-installations au démarrage d’une interaction pourront utiliser la place de marché locale
découverte.
