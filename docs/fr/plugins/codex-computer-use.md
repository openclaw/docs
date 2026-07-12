---
read_when:
    - Vous souhaitez que les agents OpenClaw en mode Codex utilisent Codex Computer Use
    - Vous hésitez entre Codex Computer Use, PeekabooBridge et le MCP cua-driver direct
    - Vous configurez computerUse pour le plugin Codex intégré
    - Vous dépannez l’état ou l’installation de l’utilisation de l’ordinateur de /codex
summary: Configurer Codex Computer Use pour les agents OpenClaw en mode Codex
title: Utilisation de l’ordinateur avec Codex
x-i18n:
    generated_at: "2026-07-12T15:40:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use est un plugin MCP natif de Codex destiné au contrôle du bureau local. OpenClaw
n’intègre pas l’application de bureau, n’exécute pas lui-même les actions sur le bureau et ne contourne pas
les autorisations de Codex. Le plugin `codex` inclus prépare uniquement le serveur d’application Codex :
il active la prise en charge des plugins Codex, recherche ou installe le plugin Computer Use
configuré, vérifie que le serveur MCP `computer-use` est disponible, puis laisse
Codex gérer les appels d’outils MCP natifs pendant les tours en mode Codex.

Utilisez cette page lorsqu’OpenClaw utilise déjà le système natif Codex. Pour la
configuration de l’environnement d’exécution lui-même, consultez [Système Codex](/fr/plugins/codex-harness).

Cela diffère de l’[outil informatique intégré reposant sur un Node](/nodes/computer-use) d’OpenClaw. Utilisez l’outil intégré lorsque le même contrat d’agent doit contrôler un Mac appairé, que l’agent s’exécute sur le Gateway ou sur un autre Node. Utilisez Codex Computer Use lorsque le serveur d’application Codex doit gérer l’installation MCP locale, les autorisations et les appels d’outils natifs.

## OpenClaw.app et Peekaboo

L’intégration de Peekaboo dans OpenClaw.app est distincte de Codex Computer Use. L’application
macOS peut héberger un socket PeekabooBridge afin que la CLI `peekaboo` puisse réutiliser les
autorisations locales d’accessibilité et d’enregistrement de l’écran de l’application pour les propres
outils d’automatisation de Peekaboo. Ce pont n’installe pas Codex Computer Use et ne lui sert pas de proxy, et
Codex Computer Use n’effectue pas d’appels par l’intermédiaire du socket PeekabooBridge.

Utilisez le [pont Peekaboo](/fr/platforms/mac/peekaboo) lorsque vous souhaitez qu’OpenClaw.app serve
d’hôte tenant compte des autorisations pour l’automatisation de la CLI Peekaboo. Utilisez cette page lorsqu’un
agent OpenClaw en mode Codex doit disposer du plugin MCP `computer-use` natif de Codex
avant le début du tour.

## Application iOS

L’application iOS est distincte de Codex Computer Use. Elle n’installe pas le serveur MCP
`computer-use` de Codex, ne lui sert pas de proxy et ne constitue pas un moteur de contrôle du bureau.
À la place, l’application iOS se connecte en tant que Node OpenClaw et expose des
fonctionnalités mobiles au moyen de commandes de Node telles que `canvas.*`, `camera.*`, `screen.*`,
`location.*` et `talk.*`.

Utilisez [iOS](/fr/platforms/ios) lorsque vous souhaitez qu’un agent pilote un Node iPhone
par l’intermédiaire du Gateway. Utilisez cette page lorsqu’un agent en mode Codex doit contrôler le
bureau macOS local au moyen du plugin Computer Use natif de Codex.

## MCP cua-driver direct

Codex Computer Use n’est pas le seul moyen d’exposer le contrôle du bureau. Si vous souhaitez que
les environnements d’exécution gérés par OpenClaw appellent directement le pilote de TryCua, utilisez le serveur
`cua-driver mcp` en amont par l’intermédiaire du registre MCP d’OpenClaw plutôt que le
processus de place de marché propre à Codex.

Après avoir installé `cua-driver`, demandez-lui la commande OpenClaw :

```bash
cua-driver mcp-config --client openclaw
```

ou enregistrez directement le serveur stdio :

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Cette méthode conserve intacte la surface des outils MCP en amont, notamment les schémas du pilote
et les réponses MCP structurées. Utilisez-la lorsque vous souhaitez que le pilote CUA
soit disponible comme serveur MCP OpenClaw normal. Utilisez la configuration de Codex Computer Use décrite sur
cette page lorsque le serveur d’application Codex doit gérer l’installation du plugin, les rechargements MCP
et les appels d’outils natifs au sein des tours en mode Codex.

Le pilote de CUA est propre à macOS et exige toujours les autorisations macOS locales
demandées par son application, notamment l’accessibilité et l’enregistrement de l’écran. OpenClaw
n’installe pas `cua-driver`, n’accorde pas ces autorisations et ne contourne pas le
modèle de sécurité du pilote en amont.

## Configuration rapide

Définissez `plugins.entries.codex.config.computerUse` lorsque les tours en mode Codex doivent disposer de
Computer Use avant le démarrage d’un fil. `autoInstall: true` active
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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Avec cette configuration, OpenClaw vérifie le serveur d’application Codex avant chaque
tour en mode Codex. Si Computer Use est absent, mais que le serveur d’application Codex a déjà détecté
une place de marché permettant son installation, OpenClaw demande au serveur d’application Codex d’installer ou de
réactiver le plugin et de recharger les serveurs MCP. Sous macOS, lorsqu’aucune
place de marché correspondante n’est enregistrée et qu’un paquet d’application de bureau standard existe, OpenClaw
essaie également d’enregistrer la place de marché Codex incluse depuis
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, avec
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` conservé
comme solution de repli pour les anciennes installations autonomes. Si la configuration ne parvient toujours pas à rendre le
serveur MCP disponible, le tour échoue avant le démarrage du fil.

Après avoir modifié la configuration de Computer Use, utilisez `/new` ou `/reset` dans la
conversation concernée avant d’effectuer un test si un fil Codex existant a déjà démarré.

Sous macOS, le démarrage géré de Computer Use privilégie le binaire de l’application de bureau situé à
`/Applications/ChatGPT.app/Contents/Resources/codex`, puis utilise
`/Applications/Codex.app/Contents/Resources/codex` comme solution de repli pour les anciennes
installations autonomes. Cela s’applique également aux commandes ponctuelles d’état et
d’installation de Computer Use qui démarrent leur propre client. Le contrôle du bureau reste ainsi sous
l’autorité du paquet d’application qui détient les autorisations macOS locales. Si l’application de bureau n’est pas
installée, OpenClaw utilise comme solution de repli le binaire Codex géré installé à côté du
plugin. Les tours Codex gérés ordinaires utilisant le répertoire personnel d’agent isolé par défaut privilégient
d’abord ce paquet épinglé afin qu’une ancienne application de bureau ne puisse pas masquer la prise en charge des modèles
actuels. Les répertoires personnels propres à l’utilisateur continuent de privilégier l’application de bureau, car ils peuvent charger l’état
natif de Computer Use. Un répertoire personnel d’agent isolé dont la configuration Codex effective active
Computer Use continue également de privilégier l’application de bureau. Une configuration explicite
`appServer.command` ou `OPENCLAW_CODEX_APP_SERVER_BIN` remplace toujours
cette sélection gérée.

OpenClaw sérialise les lectures de la configuration native de Codex et l’installation de Computer Use
au sein d’un même Gateway en cours d’exécution. Un processus Codex distinct ou un autre Gateway ne fait pas
partie de ce verrou. Après avoir modifié la configuration native des plugins Codex en dehors du
Gateway, redémarrez le Gateway et démarrez une nouvelle conversation avant de vous fier à la nouvelle
sélection.

## Commandes

Utilisez les commandes `/codex computer-use` depuis toute interface de conversation où la
surface de commandes du plugin `codex` est disponible. Il s’agit de commandes de conversation ou d’environnement d’exécution
OpenClaw, et non de sous-commandes de la CLI `openclaw codex ...` :

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` est l’action par défaut et est en lecture seule : elle n’ajoute pas de sources de place de marché,
n’installe pas de plugins et n’active pas la prise en charge des plugins Codex. Si aucune configuration
n’active Computer Use, `status` peut indiquer qu’il est désactivé même après une commande
d’installation ponctuelle.

`install` active la prise en charge des plugins du serveur d’application Codex, ajoute éventuellement une
source de place de marché configurée, installe ou réactive le plugin configuré
par l’intermédiaire du serveur d’application Codex, recharge les serveurs MCP et vérifie que le serveur MCP
expose des outils. Comme l’installation modifie des ressources hôtes de confiance,
seul un propriétaire ou un client Gateway `operator.admin` peut exécuter `install`. Les autres
expéditeurs autorisés peuvent continuer à utiliser la commande `status` en lecture seule,
y compris avec des remplacements.

Les versions antérieures acceptaient les remplacements ponctuels d’identité `--plugin`, `--server` et `--mcp-server`.
Configurez plutôt `computerUse.pluginName` et
`computerUse.mcpServerName` de manière persistante. Lorsqu’un ancien indicateur d’identité
est utilisé, la commande indique le paramètre exact à conserver et répète
l’action demandée ainsi que tous les indicateurs de place de marché pris en charge dans ses instructions de migration.

## Choix de la place de marché

OpenClaw utilise la même API du serveur d’application que celle exposée par Codex lui-même. Les
champs de place de marché déterminent où Codex doit rechercher `computer-use`.

| Champ                      | À utiliser lorsque                                                                 | Prise en charge de l’installation                                    |
| -------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Aucun champ de place de marché | Vous souhaitez que le serveur d’application Codex utilise les places de marché qu’il connaît déjà. | Oui, lorsque le serveur d’application renvoie une place de marché locale. |
| `marketplaceSource`        | Vous disposez d’une source de place de marché Codex que le serveur d’application peut ajouter. | Oui, pour `/codex computer-use install` explicite.                    |
| `marketplacePath`          | Vous connaissez déjà le chemin local du fichier de la place de marché sur l’hôte. | Oui, pour l’installation explicite et l’installation automatique au démarrage du tour. |
| `marketplaceName`          | Vous souhaitez sélectionner par son nom une place de marché déjà enregistrée.     | Oui, uniquement lorsque la place de marché sélectionnée possède un chemin local. |

Les nouveaux répertoires personnels Codex peuvent nécessiter un court délai pour initialiser leurs
places de marché officielles. Pendant l’installation, OpenClaw interroge `plugin/list` pendant un maximum de
`marketplaceDiscoveryTimeoutMs` millisecondes (60 secondes par défaut).

Si plusieurs places de marché connues contiennent Computer Use, OpenClaw privilégie
`openai-bundled`, puis `openai-curated`, puis `local`. Les correspondances inconnues
et ambiguës provoquent un échec sécurisé et vous invitent à définir `marketplaceName` ou
`marketplacePath`.

## Place de marché macOS incluse

Les versions actuelles de l’application de bureau ChatGPT incluent Computer Use à cet emplacement ; les anciennes versions autonomes
de l’application de bureau Codex utilisent la même structure sous `Codex.app` :

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Lorsque `computerUse.autoInstall` vaut true et qu’aucune place de marché contenant
`computer-use` n’est enregistrée, OpenClaw essaie d’ajouter la première racine de
place de marché incluse standard qui existe :

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Vous pouvez également l’enregistrer explicitement depuis un shell avec Codex :

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Si vous utilisez un chemin non standard pour l’application Codex, exécutez une fois `/codex computer-use install
--source <marketplace-root>`, ou définissez `computerUse.marketplacePath` sur un
chemin local de fichier de place de marché. Utilisez `--marketplace-path` uniquement lorsque vous disposez du
chemin du fichier JSON de la place de marché, et non de la racine de la place de marché incluse.

### Cache partagé des plugins

La valeur par défaut `pluginCacheMode: "independent"` laisse chaque répertoire personnel Codex et son
cache de plugins sans gestion. Définissez `pluginCacheMode: "shared"` pour copier le plugin
Computer Use inclus dans le cache de plugins détectable du répertoire personnel Codex actif
avant le démarrage du serveur d’application. Le mode partagé conserve les anciennes versions en cache, car
les clients Codex en cours d’exécution peuvent encore référencer leurs répertoires de plugins versionnés ; un
échec de la copie de remplacement conserve également le cache actif. Une configuration explicite de
`marketplaceName` ou `marketplacePath` désactive cette
réconciliation afin qu’OpenClaw ne remplace pas cette sélection.

## Limite du catalogue distant

Le serveur d’application Codex peut répertorier et lire les entrées de catalogue disponibles uniquement à distance, mais il ne
prend actuellement pas en charge `plugin/install` à distance. Cela signifie que `marketplaceName`
peut sélectionner une place de marché disponible uniquement à distance pour les vérifications d’état, mais que les installations et
réactivations nécessitent toujours une place de marché locale via `marketplaceSource` ou
`marketplacePath`.

Si l’état indique que le plugin est disponible dans une place de marché Codex distante, mais que
l’installation à distance n’est pas prise en charge, exécutez l’installation avec une source ou un chemin local :

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Référence de configuration

| Champ                           | Valeur par défaut | Signification                                                                                           |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `enabled`                       | déduite           | Exige Computer Use. Vaut true par défaut lorsqu’un autre champ Computer Use est défini.                 |
| `autoInstall`                   | false             | Installe ou réactive, au début du tour, depuis les marketplaces déjà découvertes.                       |
| `marketplaceDiscoveryTimeoutMs` | 60000             | Durée pendant laquelle l’installation attend la découverte des marketplaces par le serveur d’application Codex. |
| `liveTestTimeoutMs`             | 60000             | Délai d’expiration du thread temporaire de vérification de disponibilité et de ses requêtes de nettoyage. |
| `toolCallTimeoutMs`             | 60000             | Délai d’expiration de l’appel à l’outil de vérification de disponibilité `list_apps` de Computer Use.   |
| `healthCheckEnabled`            | false             | Exécute des sondes périodiques de disponibilité tant que le client propriétaire du serveur d’application est actif. |
| `healthCheckIntervalMinutes`    | 60                | Fréquence des sondes ; les valeurs acceptées sont 30, 60, 120 ou 240 minutes.                           |
| `pluginCacheMode`               | `independent`     | Utilisez `shared` pour actualiser le cache du répertoire personnel Codex depuis le plugin de bureau intégré. |
| `strictReadiness`               | false             | Interrompt le démarrage si une sonde en direct échoue, au lieu de continuer avec un avertissement.      |
| `autoRepair`                    | false             | Arrête les processus enfants MCP Computer Use obsolètes de la portée concernée et réessaie une fois une sonde ayant échoué. |
| `marketplaceSource`             | non définie       | Chaîne source transmise à `marketplace/add` du serveur d’application Codex.                             |
| `marketplacePath`               | non défini        | Chemin local du fichier de marketplace Codex contenant le plugin.                                      |
| `marketplaceName`               | non défini        | Nom de marketplace Codex enregistré à sélectionner.                                                    |
| `pluginName`                    | `computer-use`    | Nom du plugin dans la marketplace Codex.                                                               |
| `mcpServerName`                 | `computer-use`    | Nom du serveur MCP exposé par le plugin installé.                                                       |

L’installation automatique au début du tour refuse volontairement les valeurs
`marketplaceSource` configurées. L’ajout d’une nouvelle source constitue une
opération de configuration explicite ; utilisez donc une fois
`/codex computer-use install --source <marketplace-source>`, puis laissez
`autoInstall` gérer les réactivations ultérieures depuis les marketplaces
locales découvertes. L’installation automatique au début du tour peut utiliser
un `marketplacePath` configuré, car il s’agit déjà d’un chemin local sur l’hôte.

Chaque champ accepte également un remplacement par variable d’environnement,
consulté lorsque la clé de configuration correspondante n’est pas définie :

| Champ                           | Variable d’environnement                                        |
| ------------------------------- | --------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## Ce que vérifie OpenClaw

OpenClaw consigne en interne un motif de configuration stable et met en forme
l’état présenté à l’utilisateur dans le chat :

| Motif                        | Signification                                                  | Étape suivante                                      |
| ---------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` a été résolu à false.                    | Définissez `enabled` ou un autre champ Computer Use. |
| `marketplace_missing`        | Aucune marketplace correspondante n’était disponible.         | Configurez la source, le chemin ou le nom de la marketplace. |
| `plugin_not_installed`       | La marketplace existe, mais le plugin n’est pas installé.      | Exécutez l’installation ou activez `autoInstall`.   |
| `plugin_disabled`            | Le plugin est installé, mais désactivé dans la configuration Codex. | Exécutez l’installation pour le réactiver.          |
| `remote_install_unsupported` | La marketplace sélectionnée est uniquement distante.          | Utilisez `marketplaceSource` ou `marketplacePath`.  |
| `mcp_missing`                | Le plugin est activé, mais le serveur MCP est indisponible.    | Vérifiez Computer Use de Codex et les autorisations du système d’exploitation. |
| `ready`                      | Le plugin et les outils MCP sont disponibles.                  | Démarrez le tour en mode Codex.                     |
| `check_failed`               | Une requête au serveur d’application Codex a échoué pendant la vérification de l’état. | Vérifiez la connectivité et les journaux du serveur d’application. |
| `auto_install_blocked`       | La configuration au début du tour nécessiterait l’ajout d’une nouvelle source. | Exécutez d’abord une installation explicite.        |

La sortie du chat inclut l’état du plugin, l’état du serveur MCP, la
marketplace, les outils lorsqu’ils sont disponibles et le message spécifique
à l’étape de configuration ayant échoué.

## Autorisations macOS

Computer Use est propre à macOS. Le serveur MCP appartenant à Codex peut
nécessiter des autorisations locales du système d’exploitation avant de
pouvoir inspecter ou contrôler des applications. Si OpenClaw indique que
Computer Use est installé, mais que le serveur MCP est indisponible, vérifiez
d’abord la configuration de Computer Use côté Codex :

- Le serveur d’application Codex s’exécute sur l’hôte où le contrôle du bureau
  doit avoir lieu.
- Le plugin Computer Use est activé dans la configuration Codex.
- Le serveur MCP `computer-use` apparaît dans l’état MCP du serveur
  d’application Codex.
- macOS a accordé les autorisations requises à l’application de contrôle du
  bureau.
- La session actuelle de l’hôte peut accéder au bureau contrôlé.

OpenClaw adopte volontairement un comportement de refus par défaut lorsque
`computerUse.enabled` vaut true. Un tour en mode Codex ne doit pas se
poursuivre silencieusement sans les outils natifs de bureau exigés par la
configuration.

## Dépannage

**L’état indique que le plugin n’est pas installé.** Exécutez
`/codex computer-use install`. Si la marketplace n’est pas découverte,
indiquez `--source` ou `--marketplace-path`.

**L’état indique que le plugin est installé, mais désactivé.** Exécutez à
nouveau `/codex computer-use install`. L’installation par le serveur
d’application Codex réécrit la configuration du plugin en l’activant.

**L’état indique que l’installation distante n’est pas prise en charge.**
Utilisez une source ou un chemin de marketplace local. Les entrées de
catalogue uniquement distantes peuvent être inspectées, mais pas installées
via l’API actuelle du serveur d’application.

**L’état indique que le serveur MCP est indisponible.** Relancez
l’installation une fois afin de recharger les serveurs MCP. S’il reste
indisponible, corrigez l’application Computer Use de Codex, l’état MCP du
serveur d’application Codex ou les autorisations macOS.

**L’état ou une sonde expire sur `computer-use.list_apps`.** Le plugin et le
serveur MCP sont présents, mais le pont Computer Use local n’a pas répondu.
Quittez ou redémarrez Computer Use de Codex, relancez Codex Desktop si
nécessaire, puis réessayez dans une nouvelle session OpenClaw. Si l’hôte a
précédemment exécuté Computer Use via un ancien serveur d’application Codex
géré, actualisez le plugin installé depuis la marketplace intégrée à
l’application de bureau (utilisez le chemin `Codex.app` pour les installations
autonomes de l’application de bureau Codex) :

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Un outil Computer Use indique `Native hook relay unavailable`.** Le hook
d’outil natif de Codex n’a pas pu atteindre un relais OpenClaw actif via le
pont local ou le mécanisme de repli du Gateway. Démarrez une nouvelle session
OpenClaw avec `/new` ou `/reset`. Si cela fonctionne une fois, puis échoue à
nouveau lors d’un appel d’outil ultérieur, `/new` ne fait qu’effacer la
tentative actuelle ; redémarrez le serveur d’application Codex ou le Gateway
OpenClaw afin de supprimer les anciens threads et enregistrements de hooks,
puis réessayez dans une nouvelle session.

**L’installation automatique au début du tour refuse une source.** Ce
comportement est intentionnel. Ajoutez d’abord la source avec la commande
explicite `/codex computer-use install --source
<marketplace-source>`, puis les installations automatiques ultérieures au
début du tour pourront utiliser la marketplace locale découverte.

## Pages associées

- [Environnement d’exécution Codex](/fr/plugins/codex-harness)
- [Pont Peekaboo](/fr/platforms/mac/peekaboo)
- [Application iOS](/fr/platforms/ios)
