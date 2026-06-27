---
read_when:
    - Vous voulez que les agents OpenClaw en mode Codex utilisent Codex Computer Use
    - Vous choisissez entre Codex Computer Use, PeekabooBridge et le MCP direct cua-driver
    - Vous choisissez entre Codex Computer Use et une configuration MCP directe avec cua-driver
    - Vous configurez computerUse pour le plugin Codex inclus
    - Vous diagnostiquez l’état ou l’installation de `/codex` pour l’utilisation de l’ordinateur
summary: Configurer Codex Computer Use pour les agents OpenClaw en mode Codex
title: Utilisation de l’ordinateur par Codex
x-i18n:
    generated_at: "2026-06-27T17:45:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use est un plugin MCP natif de Codex pour le contrôle local du bureau. OpenClaw
n’intègre pas l’application de bureau, n’exécute pas lui-même les actions de bureau et ne contourne pas
les autorisations de Codex. Le plugin `codex` inclus prépare uniquement le serveur d’applications Codex :
il active la prise en charge des plugins Codex, trouve ou installe le plugin Codex
Computer Use configuré, vérifie que le serveur MCP `computer-use` est disponible, puis
laisse Codex prendre en charge les appels d’outils MCP natifs pendant les tours en mode Codex.

Utilisez cette page quand OpenClaw utilise déjà le harnais Codex natif. Pour la
configuration du runtime elle-même, consultez [Harnais Codex](/fr/plugins/codex-harness).

## OpenClaw.app et Peekaboo

L’intégration Peekaboo d’OpenClaw.app est distincte de Codex Computer Use. L’application
macOS peut héberger un socket PeekabooBridge afin que la CLI `peekaboo` puisse réutiliser les
autorisations locales d’accessibilité et d’enregistrement de l’écran de l’application pour les propres
outils d’automatisation de Peekaboo. Ce pont n’installe pas et ne relaie pas Codex Computer Use, et
Codex Computer Use n’appelle pas via le socket PeekabooBridge.

Utilisez [Pont Peekaboo](/fr/platforms/mac/peekaboo) quand vous voulez qu’OpenClaw.app soit
un hôte conscient des autorisations pour l’automatisation Peekaboo CLI. Utilisez cette page quand un
agent OpenClaw en mode Codex doit disposer du plugin MCP `computer-use` natif de Codex
avant le début du tour.

## Application iOS

L’application iOS est distincte de Codex Computer Use. Elle n’installe pas et ne relaie pas
le serveur MCP Codex `computer-use`, et ce n’est pas un backend de contrôle du bureau.
À la place, l’application iOS se connecte comme un nœud OpenClaw et expose des capacités
mobiles via des commandes de nœud telles que `canvas.*`, `camera.*`, `screen.*`,
`location.*` et `talk.*`.

Utilisez [iOS](/fr/platforms/ios) quand vous voulez qu’un agent pilote un nœud iPhone via
le Gateway. Utilisez cette page quand un agent en mode Codex doit contrôler le bureau
macOS local via le plugin Computer Use natif de Codex.

## MCP cua-driver direct

Codex Computer Use n’est pas la seule façon d’exposer le contrôle du bureau. Si vous voulez que
les runtimes gérés par OpenClaw appellent directement le pilote de TryCua, utilisez le serveur
`cua-driver mcp` amont via le registre MCP d’OpenClaw au lieu du flux de place de marché
spécifique à Codex.

Après avoir installé `cua-driver`, demandez-lui la commande OpenClaw :

```bash
cua-driver mcp-config --client openclaw
```

ou enregistrez vous-même le serveur stdio :

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Ce chemin conserve intacte la surface d’outils MCP amont, y compris les schémas du pilote
et les réponses MCP structurées. Utilisez-le quand vous voulez que le pilote CUA soit
disponible comme serveur MCP OpenClaw normal. Utilisez la configuration Codex Computer Use sur
cette page quand le serveur d’applications Codex doit prendre en charge l’installation du plugin, les rechargements MCP
et les appels d’outils natifs à l’intérieur des tours en mode Codex.

Le pilote CUA est spécifique à macOS et nécessite toujours les autorisations macOS locales
demandées par son application, comme l’accessibilité et l’enregistrement de l’écran. OpenClaw
n’installe pas `cua-driver`, n’accorde pas ces autorisations et ne contourne pas le modèle de sécurité
du pilote amont.

## Configuration rapide

Définissez `plugins.entries.codex.config.computerUse` quand les tours en mode Codex doivent avoir
Computer Use disponible avant le démarrage d’un fil. `autoInstall: true` active
Computer Use et permet à OpenClaw de l’installer ou de le réactiver avant le tour :

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

Avec cette configuration, OpenClaw vérifie le serveur d’applications Codex avant chaque tour en mode Codex.
Si Computer Use est absent mais que le serveur d’applications Codex a déjà découvert une
place de marché installable, OpenClaw demande au serveur d’applications Codex d’installer ou de réactiver
le plugin et de recharger les serveurs MCP. Sur macOS, quand aucune place de marché correspondante n’est
enregistrée et que le paquet d’application Codex standard existe, OpenClaw essaie aussi
d’enregistrer la place de marché Codex incluse depuis
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` avant d’échouer. Si la configuration
ne parvient toujours pas à rendre le serveur MCP disponible, le tour échoue
avant le démarrage du fil.

Après avoir modifié la configuration Computer Use, utilisez `/new` ou `/reset` dans la discussion concernée
avant de tester si un fil Codex existant a déjà démarré.

Au démarrage stdio géré sur macOS, OpenClaw préfère le paquet d’application Codex de bureau signé
situé à `/Applications/Codex.app/Contents/Resources/codex` quand il existe.
Cela garde Computer Use sous le paquet d’application qui possède les autorisations locales de contrôle
du bureau. Si l’application de bureau n’est pas installée, OpenClaw revient au binaire
Codex géré installé à côté du plugin. Si une application de bureau installée
s’initialise avec une version de serveur d’applications non prise en charge, OpenClaw ferme cet enfant
et réessaie le candidat de binaire géré suivant au lieu de laisser une application de bureau
obsolète masquer le repli local au plugin. La configuration explicite `appServer.command`
ou `OPENCLAW_CODEX_APP_SERVER_BIN` remplace toujours cette sélection gérée.

## Commandes

Utilisez les commandes `/codex computer-use` depuis toute surface de discussion où la surface de commandes du plugin `codex`
est disponible. Ce sont des commandes de discussion/runtime OpenClaw,
pas des sous-commandes CLI `openclaw codex ...` :

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` est en lecture seule. Elle n’ajoute pas de sources de place de marché, n’installe pas de plugins et
n’active pas la prise en charge des plugins Codex. Si aucune configuration n’active Computer Use,
`status` peut signaler qu’il est désactivé même après une commande d’installation ponctuelle.

`install` active la prise en charge des plugins par le serveur d’applications Codex, ajoute éventuellement une
source de place de marché configurée, installe ou réactive le plugin configuré via le serveur d’applications
Codex, recharge les serveurs MCP et vérifie que le serveur MCP expose des outils.

## Choix de place de marché

OpenClaw utilise la même API de serveur d’applications que celle exposée par Codex lui-même. Les
champs de place de marché choisissent où Codex doit trouver `computer-use`.

| Champ                | À utiliser quand                                                        | Prise en charge de l’installation                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Aucun champ de place de marché | Vous voulez que le serveur d’applications Codex utilise les places de marché qu’il connaît déjà. | Oui, quand le serveur d’applications renvoie une place de marché locale.        |
| `marketplaceSource`  | Vous avez une source de place de marché Codex que le serveur d’applications peut ajouter.         | Oui, pour `/codex computer-use install` explicite.         |
| `marketplacePath`    | Vous connaissez déjà le chemin de fichier de place de marché locale sur l’hôte.   | Oui, pour l’installation explicite et l’installation automatique au début du tour.   |
| `marketplaceName`    | Vous voulez sélectionner par nom une place de marché déjà enregistrée.  | Oui seulement quand la place de marché sélectionnée a un chemin local. |

Les foyers Codex fraîchement créés peuvent avoir besoin d’un bref instant pour amorcer leurs places de marché officielles.
Pendant l’installation, OpenClaw interroge `plugin/list` pendant jusqu’à
`marketplaceDiscoveryTimeoutMs` millisecondes. La valeur par défaut est de 60 secondes.

Si plusieurs places de marché connues contiennent Computer Use, OpenClaw préfère
`openai-bundled`, puis `openai-curated`, puis `local`. Les correspondances ambiguës inconnues
échouent de manière sécurisée et vous demandent de définir `marketplaceName` ou `marketplacePath`.

## Place de marché macOS incluse

Les versions récentes de Codex Desktop incluent Computer Use ici :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Quand `computerUse.autoInstall` est vrai et qu’aucune place de marché contenant
`computer-use` n’est enregistrée, OpenClaw essaie d’ajouter automatiquement la racine de place de marché
incluse standard :

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Vous pouvez aussi l’enregistrer explicitement depuis un shell avec Codex :

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Si vous utilisez un chemin d’application Codex non standard, exécutez `/codex computer-use install
--source <marketplace-root>` une fois ou définissez `computerUse.marketplacePath` sur un
chemin de fichier de place de marché locale. Utilisez `--marketplace-path` uniquement quand vous avez le
chemin du fichier JSON de place de marché, pas la racine de place de marché incluse.

## Limite du catalogue distant

Le serveur d’applications Codex peut lister et lire les entrées de catalogue uniquement distantes, mais il ne prend pas
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
| `enabled`                       | inferred       | Exiger Computer Use. La valeur par défaut est vrai quand un autre champ Computer Use est défini. |
| `autoInstall`                   | false          | Installer ou réactiver depuis les places de marché déjà découvertes au début du tour.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Durée pendant laquelle l’installation attend la découverte de places de marché par le serveur d’applications Codex.             |
| `marketplaceSource`             | unset          | Chaîne source passée à `marketplace/add` du serveur d’applications Codex.                    |
| `marketplacePath`               | unset          | Chemin local du fichier de place de marché Codex contenant le plugin.                       |
| `marketplaceName`               | unset          | Nom de place de marché Codex enregistrée à sélectionner.                                   |
| `pluginName`                    | `computer-use` | Nom de plugin de place de marché Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nom du serveur MCP exposé par le plugin installé.                               |

L’installation automatique au début du tour refuse intentionnellement les valeurs `marketplaceSource`
configurées. L’ajout d’une nouvelle source est une opération de configuration explicite, donc utilisez
`/codex computer-use install --source <marketplace-source>` une fois, puis laissez
`autoInstall` gérer les futures réactivations depuis les places de marché locales découvertes.
L’installation automatique au début du tour peut utiliser un `marketplacePath` configuré, car c’est
déjà un chemin local sur l’hôte.

## Ce qu’OpenClaw vérifie

OpenClaw signale en interne une raison de configuration stable et formate le statut visible par l’utilisateur
pour la discussion :

| Raison                       | Signification                                          | Étape suivante                                |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` a été résolu à false.            | Définissez `enabled` ou un autre champ Computer Use. |
| `marketplace_missing`        | Aucune marketplace correspondante n’était disponible.  | Configurez la source, le chemin ou le nom de la marketplace. |
| `plugin_not_installed`       | La marketplace existe, mais le plugin n’est pas installé. | Exécutez l’installation ou activez `autoInstall`. |
| `plugin_disabled`            | Le plugin est installé mais désactivé dans la configuration Codex. | Exécutez l’installation pour le réactiver. |
| `remote_install_unsupported` | La marketplace sélectionnée est uniquement distante.   | Utilisez `marketplaceSource` ou `marketplacePath`. |
| `mcp_missing`                | Le plugin est activé, mais le serveur MCP est indisponible. | Vérifiez Computer Use de Codex et les autorisations du système d’exploitation. |
| `ready`                      | Le plugin et les outils MCP sont disponibles.          | Démarrez le tour en mode Codex.               |
| `check_failed`               | Une requête au app-server Codex a échoué pendant la vérification de l’état. | Vérifiez la connectivité et les journaux du app-server. |
| `auto_install_blocked`       | La configuration au démarrage du tour devrait ajouter une nouvelle source. | Exécutez d’abord une installation explicite.  |

La sortie du chat inclut l’état du plugin, l’état du serveur MCP, la marketplace, les outils
lorsqu’ils sont disponibles, ainsi que le message spécifique de l’étape de configuration en échec.

## Autorisations macOS

Computer Use est spécifique à macOS. Le serveur MCP détenu par Codex peut nécessiter des
autorisations locales du système d’exploitation avant de pouvoir inspecter ou contrôler des applications. Si OpenClaw indique que Computer Use
est installé mais que le serveur MCP est indisponible, vérifiez d’abord la configuration de Computer
Use côté Codex :

- Le app-server Codex s’exécute sur le même hôte que celui où le contrôle du bureau doit
  avoir lieu.
- Le plugin Computer Use est activé dans la configuration Codex.
- Le serveur MCP `computer-use` apparaît dans l’état MCP du app-server Codex.
- macOS a accordé les autorisations requises à l’application de contrôle du bureau.
- La session hôte actuelle peut accéder au bureau contrôlé.

OpenClaw échoue volontairement en mode fermé lorsque `computerUse.enabled` vaut true. Un
tour en mode Codex ne doit pas continuer silencieusement sans les outils natifs de bureau
exigés par la configuration.

## Dépannage

**L’état indique non installé.** Exécutez `/codex computer-use install`. Si la
marketplace n’est pas découverte, passez `--source` ou `--marketplace-path`.

**L’état indique installé mais désactivé.** Exécutez de nouveau `/codex computer-use install`.
L’installation du app-server Codex réécrit la configuration du plugin en l’activant.

**L’état indique que l’installation distante n’est pas prise en charge.** Utilisez une source ou un
chemin de marketplace local. Les entrées de catalogue uniquement distantes peuvent être inspectées mais pas installées via l’API app-server
actuelle.

**L’état indique que le serveur MCP est indisponible.** Relancez l’installation une fois afin que les serveurs MCP
se rechargent. S’il reste indisponible, corrigez l’application Codex Computer Use,
l’état MCP du app-server Codex ou les autorisations macOS.

**L’état ou une sonde expire sur `computer-use.list_apps`.** Le plugin et le serveur MCP
sont présents, mais le pont local Computer Use n’a pas répondu. Quittez ou
redémarrez Codex Computer Use, relancez Codex Desktop si nécessaire, puis réessayez dans une
nouvelle session OpenClaw. Si l’hôte a précédemment exécuté Computer Use via un ancien
app-server Codex géré, actualisez le plugin installé depuis la marketplace groupée avec l’application de bureau :

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Un outil Computer Use indique `Native hook relay unavailable`.** Le hook d’outil natif Codex
n’a pas pu joindre un relais OpenClaw actif via le pont local ou le
repli Gateway. Démarrez une nouvelle session OpenClaw avec `/new` ou `/reset`. Si cela
fonctionne une fois puis échoue de nouveau lors d’un appel d’outil ultérieur, `/new` ne fait qu’effacer la
tentative actuelle ; redémarrez le app-server Codex ou OpenClaw Gateway afin que les anciens threads
et enregistrements de hooks soient supprimés, puis réessayez dans une nouvelle session.

**L’auto-installation au démarrage du tour refuse une source.** C’est intentionnel. Ajoutez d’abord la
source avec `/codex computer-use install --source <marketplace-source>` de manière explicite,
puis les futures auto-installations au démarrage du tour pourront utiliser la marketplace locale
découverte.

## Connexe

- [Harnais Codex](/fr/plugins/codex-harness)
- [Pont Peekaboo](/fr/platforms/mac/peekaboo)
- [Application iOS](/fr/platforms/ios)
