---
read_when:
    - Vous voulez que les agents OpenClaw en mode Codex utilisent Codex Computer Use
    - Vous choisissez entre Codex Computer Use, PeekabooBridge et le MCP cua-driver direct
    - Vous choisissez entre Codex Computer Use et une configuration MCP directe avec cua-driver
    - Vous configurez computerUse pour le Plugin Codex inclus
    - Vous dépannez l’état ou l’installation de /codex computer-use
summary: Configurer Codex Computer Use pour les agents OpenClaw en mode Codex
title: Utilisation de l’ordinateur par Codex
x-i18n:
    generated_at: "2026-05-11T20:44:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use est un plugin MCP natif de Codex pour le contrôle du bureau local. OpenClaw
n’intègre pas l’application de bureau, n’exécute pas lui-même d’actions de bureau et ne contourne pas
les autorisations de Codex. Le plugin `codex` fourni prépare seulement Codex app-server :
il active la prise en charge des plugins Codex, trouve ou installe le plugin Codex
Computer Use configuré, vérifie que le serveur MCP `computer-use` est disponible, puis
laisse Codex gérer les appels d’outils MCP natifs pendant les tours en mode Codex.

Utilisez cette page lorsque OpenClaw utilise déjà le harnais Codex natif. Pour la
configuration d’exécution elle-même, consultez [Harnais Codex](/fr/plugins/codex-harness).

## OpenClaw.app et Peekaboo

L’intégration Peekaboo d’OpenClaw.app est distincte de Codex Computer Use. L’application
macOS peut héberger un socket PeekabooBridge afin que la CLI `peekaboo` puisse réutiliser les
autorisations locales Accessibilité et Enregistrement de l’écran de l’application pour les propres
outils d’automatisation de Peekaboo. Ce pont n’installe pas et ne relaie pas Codex Computer Use, et
Codex Computer Use ne passe pas par le socket PeekabooBridge.

Utilisez [Pont Peekaboo](/fr/platforms/mac/peekaboo) lorsque vous voulez qu’OpenClaw.app soit
un hôte conscient des autorisations pour l’automatisation Peekaboo CLI. Utilisez cette page lorsqu’un
agent OpenClaw en mode Codex doit disposer du plugin MCP `computer-use` natif de Codex
avant le début du tour.

## Application iOS

L’application iOS est distincte de Codex Computer Use. Elle n’installe pas et ne relaie pas
le serveur MCP Codex `computer-use`, et ce n’est pas un backend de contrôle du bureau.
À la place, l’application iOS se connecte comme un nœud OpenClaw et expose des
capacités mobiles via des commandes de nœud telles que `canvas.*`, `camera.*`, `screen.*`,
`location.*` et `talk.*`.

Utilisez [iOS](/fr/platforms/ios) lorsque vous voulez qu’un agent pilote un nœud iPhone via
le Gateway. Utilisez cette page lorsqu’un agent en mode Codex doit contrôler le bureau
macOS local via le plugin natif Computer Use de Codex.

## MCP cua-driver direct

Codex Computer Use n’est pas le seul moyen d’exposer le contrôle du bureau. Si vous voulez
que les environnements d’exécution gérés par OpenClaw appellent directement le pilote de TryCua, utilisez le serveur
amont `cua-driver mcp` via le registre MCP d’OpenClaw au lieu du flux de place de marché
spécifique à Codex.

Après avoir installé `cua-driver`, demandez-lui la commande OpenClaw :

```bash
cua-driver mcp-config --client openclaw
```

ou enregistrez vous-même le serveur stdio :

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Cette voie conserve intacte la surface d’outils MCP amont, y compris les schémas du pilote
et les réponses MCP structurées. Utilisez-la lorsque vous voulez que le pilote CUA soit
disponible comme serveur MCP OpenClaw normal. Utilisez la configuration Codex Computer Use de
cette page lorsque Codex app-server doit gérer l’installation des plugins, les rechargements MCP
et les appels d’outils natifs dans les tours en mode Codex.

Le pilote CUA est spécifique à macOS et nécessite toujours les autorisations macOS locales
demandées par son application, comme Accessibilité et Enregistrement de l’écran. OpenClaw
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
    },
  },
}
```

Avec cette configuration, OpenClaw vérifie Codex app-server avant chaque tour en mode Codex.
Si Computer Use est absent mais que Codex app-server a déjà découvert une place de marché
installable, OpenClaw demande à Codex app-server d’installer ou de réactiver
le plugin et de recharger les serveurs MCP. Sur macOS, lorsqu’aucune place de marché correspondante n’est
enregistrée et que le bundle d’application Codex standard existe, OpenClaw essaie également
d’enregistrer la place de marché Codex groupée depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` avant d’échouer.
Si la configuration ne parvient toujours pas à rendre le serveur MCP disponible, le tour échoue
avant le démarrage du fil.

Après avoir modifié la configuration Computer Use, utilisez `/new` ou `/reset` dans le chat concerné
avant de tester si un fil Codex existant a déjà démarré.

## Commandes

Utilisez les commandes `/codex computer-use` depuis toute surface de chat où la surface de commande du plugin `codex`
est disponible. Ce sont des commandes de chat/d’exécution OpenClaw,
pas des sous-commandes CLI `openclaw codex ...` :

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` est en lecture seule. Il n’ajoute pas de sources de place de marché, n’installe pas de plugins et
n’active pas la prise en charge des plugins Codex.

`install` active la prise en charge des plugins Codex app-server, ajoute éventuellement une
source de place de marché configurée, installe ou réactive le plugin configuré via Codex
app-server, recharge les serveurs MCP et vérifie que le serveur MCP expose des outils.

## Choix de place de marché

OpenClaw utilise la même API app-server que celle exposée par Codex lui-même. Les
champs de place de marché déterminent où Codex doit trouver `computer-use`.

| Champ                | À utiliser quand                                                        | Prise en charge de l’installation                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Aucun champ de place de marché | Vous voulez que Codex app-server utilise les places de marché qu’il connaît déjà. | Oui, lorsque app-server renvoie une place de marché locale.        |
| `marketplaceSource`  | Vous avez une source de place de marché Codex qu’app-server peut ajouter.         | Oui, pour `/codex computer-use install` explicite.         |
| `marketplacePath`    | Vous connaissez déjà le chemin de fichier de la place de marché locale sur l’hôte.   | Oui, pour l’installation explicite et l’installation automatique au démarrage du tour.   |
| `marketplaceName`    | Vous voulez sélectionner par nom une place de marché déjà enregistrée.  | Oui seulement lorsque la place de marché sélectionnée a un chemin local. |

Les nouveaux répertoires personnels Codex peuvent nécessiter un court instant pour initialiser leurs places de marché officielles.
Pendant l’installation, OpenClaw interroge `plugin/list` pendant jusqu’à
`marketplaceDiscoveryTimeoutMs` millisecondes. La valeur par défaut est 60 secondes.

Si plusieurs places de marché connues contiennent Computer Use, OpenClaw préfère
`openai-bundled`, puis `openai-curated`, puis `local`. Les correspondances ambiguës inconnues
échouent fermées et vous demandent de définir `marketplaceName` ou `marketplacePath`.

## Place de marché macOS groupée

Les versions récentes de Codex desktop groupent Computer Use ici :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Lorsque `computerUse.autoInstall` vaut true et qu’aucune place de marché contenant
`computer-use` n’est enregistrée, OpenClaw essaie d’ajouter automatiquement la racine de place de marché
groupée standard :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Vous pouvez aussi l’enregistrer explicitement depuis un shell avec Codex :

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Si vous utilisez un chemin d’application Codex non standard, définissez `computerUse.marketplacePath` sur un
chemin de fichier de place de marché locale ou exécutez `/codex computer-use install --source
<marketplace-source>` une fois.

## Limite du catalogue distant

Codex app-server peut lister et lire les entrées de catalogue uniquement distantes, mais il ne prend pas
actuellement en charge `plugin/install` distant. Cela signifie que `marketplaceName` peut
sélectionner une place de marché uniquement distante pour les vérifications de statut, mais les installations et réactivations
nécessitent toujours une place de marché locale via `marketplaceSource` ou `marketplacePath`.

Si le statut indique que le plugin est disponible dans une place de marché Codex distante mais que l’installation
distante n’est pas prise en charge, exécutez l’installation avec une source ou un chemin local :

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Référence de configuration

| Champ                           | Par défaut        | Signification                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Exiger Computer Use. Valeur par défaut true lorsqu’un autre champ Computer Use est défini. |
| `autoInstall`                   | false          | Installer ou réactiver depuis les places de marché déjà découvertes au démarrage du tour.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Durée pendant laquelle l’installation attend la découverte des places de marché par Codex app-server.             |
| `marketplaceSource`             | unset          | Chaîne source passée à `marketplace/add` de Codex app-server.                    |
| `marketplacePath`               | unset          | Chemin de fichier de place de marché Codex locale contenant le plugin.                       |
| `marketplaceName`               | unset          | Nom de place de marché Codex enregistrée à sélectionner.                                   |
| `pluginName`                    | `computer-use` | Nom du plugin dans la place de marché Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nom du serveur MCP exposé par le plugin installé.                               |

L’installation automatique au démarrage du tour refuse volontairement les valeurs `marketplaceSource`
configurées. Ajouter une nouvelle source est une opération de configuration explicite ; utilisez donc
`/codex computer-use install --source <marketplace-source>` une fois, puis laissez
`autoInstall` gérer les réactivations futures depuis les places de marché locales découvertes.
L’installation automatique au démarrage du tour peut utiliser un `marketplacePath` configuré, car il s’agit
déjà d’un chemin local sur l’hôte.

## Ce qu’OpenClaw vérifie

OpenClaw signale en interne une raison de configuration stable et formate le statut visible par l’utilisateur
pour le chat :

| Raison                       | Signification                                                | Étape suivante                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` s’est résolu à false.               | Définissez `enabled` ou un autre champ Computer Use.  |
| `marketplace_missing`        | Aucune place de marché correspondante n’était disponible.                 | Configurez la source, le chemin ou le nom de place de marché.  |
| `plugin_not_installed`       | La place de marché existe, mais le plugin n’est pas installé.   | Exécutez install ou activez `autoInstall`.          |
| `plugin_disabled`            | Le plugin est installé mais désactivé dans la configuration Codex.      | Exécutez install pour le réactiver.                  |
| `remote_install_unsupported` | La place de marché sélectionnée est uniquement distante.                   | Utilisez `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | Le plugin est activé, mais le serveur MCP est indisponible.  | Vérifiez Codex Computer Use et les autorisations du système d’exploitation.  |
| `ready`                      | Le plugin et les outils MCP sont disponibles.                    | Démarrez le tour en mode Codex.                    |
| `check_failed`               | Une requête Codex app-server a échoué pendant la vérification du statut. | Vérifiez la connectivité et les journaux d’app-server.       |
| `auto_install_blocked`       | La configuration au démarrage du tour devrait ajouter une nouvelle source.       | Exécutez d’abord l’installation explicite.                   |

La sortie de chat inclut l’état du plugin, l’état du serveur MCP, la place de marché, les outils
lorsqu’ils sont disponibles, et le message précis pour l’étape de configuration en échec.

## Autorisations macOS

Computer Use est spécifique à macOS. Le serveur MCP géré par Codex peut nécessiter des
autorisations locales du système d’exploitation avant de pouvoir inspecter ou contrôler des applications. Si OpenClaw indique que Computer Use
est installé mais que le serveur MCP est indisponible, vérifiez d’abord la configuration Computer
Use côté Codex :

- Le serveur d’application Codex s’exécute sur le même hôte que celui où le
  contrôle du bureau doit avoir lieu.
- Le plugin Computer Use est activé dans la configuration Codex.
- Le serveur MCP `computer-use` apparaît dans l’état MCP du serveur
  d’application Codex.
- macOS a accordé les autorisations requises pour l’application de contrôle du
  bureau.
- La session hôte actuelle peut accéder au bureau contrôlé.

OpenClaw échoue volontairement en mode fermé lorsque `computerUse.enabled` vaut
true. Une interaction en mode Codex ne doit pas continuer silencieusement sans
les outils natifs de bureau requis par la configuration.

## Dépannage

**L’état indique que ce n’est pas installé.** Exécutez `/codex computer-use install`. Si la
place de marché n’est pas découverte, passez `--source` ou `--marketplace-path`.

**L’état indique que c’est installé mais désactivé.** Exécutez de nouveau `/codex computer-use install`.
L’installation du serveur d’application Codex réécrit la configuration du plugin
avec l’activation.

**L’état indique que l’installation distante n’est pas prise en charge.** Utilisez une source ou
un chemin de place de marché local. Les entrées de catalogue uniquement distantes
peuvent être inspectées, mais pas installées via l’API actuelle du serveur
d’application.

**L’état indique que le serveur MCP est indisponible.** Réexécutez l’installation une fois afin que les
serveurs MCP se rechargent. S’il reste indisponible, corrigez l’application
Codex Computer Use, l’état MCP du serveur d’application Codex ou les
autorisations macOS.

**L’état ou une sonde expire sur `computer-use.list_apps`.** Le plugin et le serveur MCP
sont présents, mais le pont Computer Use local n’a pas répondu. Quittez ou
redémarrez Codex Computer Use, relancez Codex Desktop si nécessaire, puis
réessayez dans une nouvelle session OpenClaw.

**Un outil Computer Use indique `Native hook relay unavailable`.** Le hook d’outil natif Codex
n’a pas pu atteindre un relais OpenClaw actif via le pont local ou le repli du
Gateway. Démarrez une nouvelle session OpenClaw avec `/new` ou `/reset`. Si cela
continue, redémarrez le Gateway afin que les anciens fils du serveur
d’application et les enregistrements de hooks soient abandonnés, puis réessayez.

**L’installation automatique au début du tour refuse une source.** C’est intentionnel. Ajoutez d’abord la
source avec `/codex computer-use install --source <marketplace-source>` explicite,
puis les futures installations automatiques au début du tour pourront utiliser la
place de marché locale découverte.

## Voir aussi

- [harnais Codex](/fr/plugins/codex-harness)
- [pont Peekaboo](/fr/platforms/mac/peekaboo)
- [application iOS](/fr/platforms/ios)
