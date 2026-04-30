---
read_when:
    - Vous souhaitez que les agents OpenClaw en mode Codex utilisent Codex Computer Use
    - Vous choisissez entre Codex Computer Use, PeekabooBridge et l’utilisation directe de cua-driver MCP
    - Vous hésitez entre Codex Computer Use et une configuration MCP directe de cua-driver
    - Vous configurez computerUse pour le Plugin Codex intégré
    - Vous dépannez l’état ou l’installation de /codex computer-use
summary: Configurer l’utilisation de l’ordinateur de Codex pour les agents OpenClaw en mode Codex
title: Utilisation de l’ordinateur par Codex
x-i18n:
    generated_at: "2026-04-30T07:38:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use est un plugin MCP natif de Codex pour le contrôle du bureau local. OpenClaw
n’intègre pas l’application de bureau, n’exécute pas lui-même d’actions sur le bureau et ne contourne pas
les autorisations de Codex. Le plugin `codex` fourni prépare uniquement Codex app-server :
il active la prise en charge des plugins Codex, trouve ou installe le plugin Codex
Computer Use configuré, vérifie que le serveur MCP `computer-use` est disponible, puis
laisse Codex posséder les appels aux outils MCP natifs pendant les tours en mode Codex.

Utilisez cette page lorsqu’OpenClaw utilise déjà le harnais Codex natif. Pour la
configuration d’exécution elle-même, consultez [Harnais Codex](/fr/plugins/codex-harness).

## OpenClaw.app et Peekaboo

L’intégration Peekaboo d’OpenClaw.app est séparée de Codex Computer Use. L’application
macOS peut héberger un socket PeekabooBridge afin que la CLI `peekaboo` puisse réutiliser les
autorisations locales d’accessibilité et d’enregistrement d’écran de l’application pour les propres
outils d’automatisation de Peekaboo. Ce pont n’installe pas et ne relaie pas Codex Computer Use, et
Codex Computer Use ne passe pas par le socket PeekabooBridge.

Utilisez [Pont Peekaboo](/fr/platforms/mac/peekaboo) lorsque vous voulez qu’OpenClaw.app soit
un hôte conscient des autorisations pour l’automatisation Peekaboo CLI. Utilisez cette page lorsqu’un
agent OpenClaw en mode Codex doit disposer du plugin MCP `computer-use` natif de Codex
avant le début du tour.

## Application iOS

L’application iOS est séparée de Codex Computer Use. Elle n’installe pas et ne relaie pas
le serveur MCP Codex `computer-use` et n’est pas un backend de contrôle du bureau.
À la place, l’application iOS se connecte comme un nœud OpenClaw et expose des capacités
mobiles via des commandes de nœud telles que `canvas.*`, `camera.*`, `screen.*`,
`location.*` et `talk.*`.

Utilisez [iOS](/fr/platforms/ios) lorsque vous voulez qu’un agent pilote un nœud iPhone via
le Gateway. Utilisez cette page lorsqu’un agent en mode Codex doit contrôler le bureau
macOS local via le plugin Computer Use natif de Codex.

## MCP cua-driver direct

Codex Computer Use n’est pas la seule façon d’exposer le contrôle du bureau. Si vous voulez
que les environnements d’exécution gérés par OpenClaw appellent directement le pilote de TryCua, utilisez le serveur
`cua-driver mcp` en amont via le registre MCP d’OpenClaw au lieu du flux de marketplace
spécifique à Codex.

Après avoir installé `cua-driver`, demandez-lui la commande OpenClaw :

```bash
cua-driver mcp-config --client openclaw
```

ou enregistrez vous-même le serveur stdio :

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Ce chemin conserve intacte la surface d’outils MCP en amont, y compris les schémas du pilote
et les réponses MCP structurées. Utilisez-le lorsque vous voulez que le pilote CUA
soit disponible comme serveur MCP OpenClaw normal. Utilisez la configuration Codex Computer Use de
cette page lorsque Codex app-server doit posséder l’installation du plugin, les rechargements MCP
et les appels d’outils natifs dans les tours en mode Codex.

Le pilote de CUA est spécifique à macOS et nécessite toujours les autorisations macOS locales
demandées par son application, comme l’accessibilité et l’enregistrement d’écran. OpenClaw
n’installe pas `cua-driver`, n’accorde pas ces autorisations et ne contourne pas le modèle de sécurité
du pilote en amont.

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
        fallback: "none",
      },
    },
  },
}
```

Avec cette configuration, OpenClaw vérifie Codex app-server avant chaque tour en mode Codex.
Si Computer Use est absent mais que Codex app-server a déjà découvert une marketplace
installable, OpenClaw demande à Codex app-server d’installer ou de réactiver
le plugin et de recharger les serveurs MCP. Sur macOS, lorsqu’aucune marketplace correspondante n’est
enregistrée et que le bundle d’application Codex standard existe, OpenClaw essaie également
d’enregistrer la marketplace Codex fournie depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` avant d’échouer.
Si la configuration ne parvient toujours pas à rendre le serveur MCP disponible, le tour échoue
avant le démarrage du fil.

Les sessions existantes conservent leur environnement d’exécution et leur liaison de fil Codex. Après avoir modifié
`agentRuntime` ou la configuration Computer Use, utilisez `/new` ou `/reset` dans la discussion
concernée avant de tester.

## Commandes

Utilisez les commandes `/codex computer-use` depuis toute surface de discussion où la surface de commandes du plugin `codex`
est disponible. Ce sont des commandes de discussion/environnement d’exécution OpenClaw,
pas des sous-commandes CLI `openclaw codex ...` :

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` est en lecture seule. Elle n’ajoute pas de sources de marketplace, n’installe pas de plugins et
n’active pas la prise en charge des plugins Codex.

`install` active la prise en charge des plugins Codex app-server, ajoute éventuellement une
source de marketplace configurée, installe ou réactive le plugin configuré via Codex
app-server, recharge les serveurs MCP et vérifie que le serveur MCP expose des outils.

## Choix de marketplace

OpenClaw utilise la même API app-server que Codex expose lui-même. Les
champs de marketplace choisissent où Codex doit trouver `computer-use`.

| Champ                | À utiliser lorsque                                             | Prise en charge de l’installation                         |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| Aucun champ marketplace | Vous voulez que Codex app-server utilise les marketplaces qu’il connaît déjà. | Oui, lorsque app-server renvoie une marketplace locale. |
| `marketplaceSource`  | Vous avez une source de marketplace Codex qu’app-server peut ajouter. | Oui, pour `/codex computer-use install` explicite.        |
| `marketplacePath`    | Vous connaissez déjà le chemin de fichier de marketplace locale sur l’hôte. | Oui, pour l’installation explicite et l’auto-installation au début du tour. |
| `marketplaceName`    | Vous voulez sélectionner par nom une marketplace déjà enregistrée. | Oui uniquement lorsque la marketplace sélectionnée a un chemin local. |

Les nouveaux répertoires d’accueil Codex peuvent avoir besoin d’un court instant pour initialiser leurs marketplaces officielles.
Pendant l’installation, OpenClaw interroge `plugin/list` pendant au maximum
`marketplaceDiscoveryTimeoutMs` millisecondes. La valeur par défaut est de 60 secondes.

Si plusieurs marketplaces connues contiennent Computer Use, OpenClaw préfère
`openai-bundled`, puis `openai-curated`, puis `local`. Les correspondances ambiguës inconnues
échouent de manière fermée et vous demandent de définir `marketplaceName` ou `marketplacePath`.

## Marketplace macOS fournie

Les versions récentes de Codex desktop fournissent Computer Use ici :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Lorsque `computerUse.autoInstall` vaut true et qu’aucune marketplace contenant
`computer-use` n’est enregistrée, OpenClaw essaie d’ajouter automatiquement la racine de marketplace
fournie standard :

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

Codex app-server peut lister et lire les entrées de catalogue uniquement distantes, mais il ne prend pas
actuellement en charge `plugin/install` distant. Cela signifie que `marketplaceName` peut
sélectionner une marketplace uniquement distante pour les vérifications d’état, mais les installations et réactivations
ont toujours besoin d’une marketplace locale via `marketplaceSource` ou `marketplacePath`.

Si l’état indique que le plugin est disponible dans une marketplace Codex distante mais que l’installation
distante n’est pas prise en charge, lancez l’installation avec une source ou un chemin local :

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Référence de configuration

| Champ                           | Par défaut     | Signification                                                                  |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Exiger Computer Use. La valeur par défaut est true lorsqu’un autre champ Computer Use est défini. |
| `autoInstall`                   | false          | Installer ou réactiver depuis les marketplaces déjà découvertes au début du tour. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Durée pendant laquelle l’installation attend la découverte de marketplace par Codex app-server. |
| `marketplaceSource`             | unset          | Chaîne source transmise à `marketplace/add` de Codex app-server.               |
| `marketplacePath`               | unset          | Chemin de fichier de marketplace Codex locale contenant le plugin.             |
| `marketplaceName`               | unset          | Nom de marketplace Codex enregistrée à sélectionner.                           |
| `pluginName`                    | `computer-use` | Nom du plugin de marketplace Codex.                                            |
| `mcpServerName`                 | `computer-use` | Nom du serveur MCP exposé par le plugin installé.                              |

L’auto-installation au début du tour refuse intentionnellement les valeurs `marketplaceSource`
configurées. L’ajout d’une nouvelle source est une opération de configuration explicite, utilisez donc
`/codex computer-use install --source <marketplace-source>` une fois, puis laissez
`autoInstall` gérer les réactivations futures depuis les marketplaces locales découvertes.
L’auto-installation au début du tour peut utiliser un `marketplacePath` configuré, car c’est
déjà un chemin local sur l’hôte.

## Ce qu’OpenClaw vérifie

OpenClaw signale en interne une raison de configuration stable et met en forme l’état destiné à l’utilisateur
pour la discussion :

| Raison                       | Signification                                        | Étape suivante                                |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` s’est résolu en false.         | Définissez `enabled` ou un autre champ Computer Use. |
| `marketplace_missing`        | Aucune marketplace correspondante n’était disponible. | Configurez une source, un chemin ou un nom de marketplace. |
| `plugin_not_installed`       | La marketplace existe, mais le plugin n’est pas installé. | Lancez install ou activez `autoInstall`.      |
| `plugin_disabled`            | Le plugin est installé mais désactivé dans la configuration Codex. | Lancez install pour le réactiver.             |
| `remote_install_unsupported` | La marketplace sélectionnée est uniquement distante. | Utilisez `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | Le plugin est activé, mais le serveur MCP est indisponible. | Vérifiez Codex Computer Use et les autorisations du système d’exploitation. |
| `ready`                      | Le plugin et les outils MCP sont disponibles.        | Démarrez le tour en mode Codex.               |
| `check_failed`               | Une requête Codex app-server a échoué pendant la vérification d’état. | Vérifiez la connectivité et les journaux app-server. |
| `auto_install_blocked`       | La configuration au début du tour devrait ajouter une nouvelle source. | Lancez d’abord une installation explicite.    |

La sortie de discussion inclut l’état du plugin, l’état du serveur MCP, la marketplace, les outils
lorsqu’ils sont disponibles et le message spécifique pour l’étape de configuration en échec.

## Autorisations macOS

Computer Use est spécifique à macOS. Le serveur MCP possédé par Codex peut nécessiter des
autorisations locales du système d’exploitation avant de pouvoir inspecter ou contrôler des applications. Si OpenClaw indique que Computer Use
est installé mais que le serveur MCP est indisponible, vérifiez d’abord la configuration Computer
Use côté Codex :

- Le serveur d’application Codex s’exécute sur le même hôte où le contrôle du bureau doit
  avoir lieu.
- Le Plugin Computer Use est activé dans la configuration de Codex.
- Le serveur MCP `computer-use` apparaît dans l’état MCP du serveur d’application Codex.
- macOS a accordé les autorisations requises pour l’application de contrôle du bureau.
- La session hôte actuelle peut accéder au bureau contrôlé.

OpenClaw échoue intentionnellement de façon fermée lorsque `computerUse.enabled` vaut true. Un
tour en mode Codex ne doit pas se poursuivre silencieusement sans les outils natifs de bureau
que la configuration exigeait.

## Dépannage

**L’état indique que ce n’est pas installé.** Exécutez `/codex computer-use install`. Si la
marketplace n’est pas découverte, passez `--source` ou `--marketplace-path`.

**L’état indique que c’est installé mais désactivé.** Exécutez à nouveau `/codex computer-use install`.
L’installation du serveur d’application Codex réécrit la configuration du Plugin pour le réactiver.

**L’état indique que l’installation distante n’est pas prise en charge.** Utilisez une source ou un
chemin de marketplace local. Les entrées de catalogue uniquement distantes peuvent être inspectées, mais pas installées via
l’API actuelle du serveur d’application.

**L’état indique que le serveur MCP est indisponible.** Relancez l’installation une fois afin que les serveurs MCP
se rechargent. S’il reste indisponible, corrigez l’application Codex Computer Use,
l’état MCP du serveur d’application Codex ou les autorisations macOS.

**L’état ou une sonde expire sur `computer-use.list_apps`.** Le Plugin et le serveur MCP
sont présents, mais le bridge Computer Use local n’a pas répondu. Quittez ou
redémarrez Codex Computer Use, relancez Codex Desktop si nécessaire, puis réessayez dans une
nouvelle session OpenClaw.

**Un outil Computer Use indique `Native hook relay unavailable`.** Le hook d’outil natif Codex
n’a pas pu joindre un relais OpenClaw actif via le bridge local ou le
repli Gateway. Démarrez une nouvelle session OpenClaw avec `/new` ou `/reset`. Si cela
continue, redémarrez le gateway afin que les anciens fils du serveur d’application et les
enregistrements de hook soient supprimés, puis réessayez.

**L’installation automatique au début du tour refuse une source.** C’est intentionnel. Ajoutez d’abord la
source avec `/codex computer-use install --source <marketplace-source>` explicitement, puis les prochaines installations automatiques au début du tour pourront utiliser la marketplace locale
découverte.
