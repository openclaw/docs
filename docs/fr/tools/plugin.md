---
doc-schema-version: 1
read_when:
    - Installation ou configuration des plugins
    - Comprendre les règles de découverte et de chargement des plugins
    - Utilisation de bundles de plugins compatibles avec Codex/Claude
sidebarTitle: Getting Started
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-07-12T03:25:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Les Plugins étendent OpenClaw avec des canaux, des fournisseurs de modèles, des environnements d’exécution d’agents, des outils,
des compétences, la synthèse vocale, la transcription en temps réel, la voix, la compréhension des médias, la génération,
la récupération de contenu web, la recherche web et d’autres fonctionnalités d’exécution.

Utilisez cette page pour installer un Plugin, redémarrer le Gateway, vérifier que l’environnement d’exécution
l’a chargé et résoudre les échecs de configuration courants. Pour des exemples portant uniquement sur les commandes, consultez
[Gérer les Plugins](/fr/plugins/manage-plugins). Pour l’inventaire généré des
Plugins intégrés, externes officiels et disponibles uniquement dans le code source, consultez
[Inventaire des Plugins](/fr/plugins/plugin-inventory).

## Prérequis

- une copie de travail ou une installation d’OpenClaw avec la CLI `openclaw` disponible
- un accès réseau à la source sélectionnée (ClawHub, npm ou un hébergeur git)
- tous les identifiants, clés de configuration ou outils de système d’exploitation propres au Plugin indiqués dans
  la documentation de configuration de ce Plugin
- l’autorisation de recharger ou redémarrer le Gateway qui dessert vos canaux

## Démarrage rapide

<Steps>
  <Step title="Trouver le Plugin">
    Recherchez des paquets de Plugins publics dans [ClawHub](/clawhub) :

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub est l’interface principale de découverte des Plugins communautaires. Pendant la
    transition de lancement, les spécifications de paquets simples ordinaires s’installent toujours depuis npm, sauf si
    elles correspondent à l’identifiant d’un Plugin officiel. Les spécifications `@openclaw/*` brutes qui correspondent à un
    Plugin intégré sont résolues vers cette copie intégrée. Utilisez un préfixe de source explicite
    lorsque vous avez besoin d’une source précise.

  </Step>

  <Step title="Installer le Plugin">
    ```bash
    # Depuis ClawHub.
    openclaw plugins install clawhub:<package>

    # Depuis npm.
    openclaw plugins install npm:<package>

    # Depuis git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Depuis une copie de travail de développement locale.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Considérez l’installation d’un Plugin comme l’exécution de code. Privilégiez les versions épinglées pour
    des installations de production reproductibles.

  </Step>

  <Step title="Le configurer et l’activer">
    Configurez les paramètres propres au Plugin sous `plugins.entries.<id>.config`.
    Activez le Plugin s’il ne l’est pas déjà :

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Si `plugins.allow` est défini, l’identifiant du Plugin installé doit figurer dans cette liste
    avant que le Plugin puisse être chargé. `openclaw plugins install` ajoute l’identifiant installé
    à une liste `plugins.allow` existante et supprime ce même identifiant de
    `plugins.deny` afin que l’installation explicite puisse être chargée après le redémarrage.

  </Step>

  <Step title="Laisser le Gateway se recharger">
    L’installation, la mise à jour ou la désinstallation du code d’un Plugin nécessite un redémarrage du
    Gateway. Un Gateway géré avec le rechargement de la configuration activé détecte la modification
    de l’enregistrement d’installation du Plugin et redémarre automatiquement. Sinon, redémarrez-le
    vous-même :

    ```bash
    openclaw gateway restart
    ```

    L’activation ou la désactivation met à jour la configuration et le registre à froid. Une inspection de l’environnement d’exécution reste
    la preuve la plus claire des interfaces d’exécution actives.

  </Step>

  <Step title="Vérifier l’enregistrement dans l’environnement d’exécution">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Utilisez `--runtime` pour confirmer l’enregistrement des outils, hooks, services, méthodes du Gateway
    ou commandes de CLI appartenant au Plugin. Une commande `inspect` simple vérifie uniquement le manifeste
    et le registre à froid.

  </Step>
</Steps>

## Configuration

### Choisir une source d’installation

| Source              | À utiliser lorsque                                                                                                   | Exemple                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub             | Vous souhaitez bénéficier de la découverte native d’OpenClaw, des analyses, des métadonnées de version et des conseils d’installation | `openclaw plugins install clawhub:<package>`                   |
| npm                 | Vous avez besoin d’accéder directement au registre npm ou à des flux de travail fondés sur les balises de distribution | `openclaw plugins install npm:<package>`                       |
| git                 | Vous avez besoin d’une branche, d’une balise ou d’un commit provenant d’un dépôt                                     | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| chemin local        | Vous développez ou testez un Plugin sur la même machine                                                              | `openclaw plugins install --link ./my-plugin`                  |
| place de marché     | Vous installez un Plugin de place de marché compatible avec Claude                                                   | `openclaw plugins install <plugin> --marketplace <source>`     |

Les spécifications de paquets simples ont un comportement de compatibilité particulier : un nom simple qui
correspond à l’identifiant d’un Plugin intégré utilise cette source intégrée ; un nom simple qui correspond
à l’identifiant d’un Plugin externe officiel utilise le catalogue officiel des paquets ; toute autre
spécification simple s’installe via npm pendant la transition de lancement. Les spécifications `@openclaw/*`
brutes qui correspondent à des Plugins intégrés sont également résolues vers la copie intégrée avant le
repli sur npm. Utilisez `npm:@openclaw/<plugin>@<version>` pour installer délibérément le
paquet npm externe à la place de la copie intégrée. Utilisez `clawhub:`, `npm:`,
`git:` ou `npm-pack:` pour sélectionner la source de manière déterministe. Consultez
[`openclaw plugins`](/fr/cli/plugins#install) pour connaître le contrat complet de la commande.

Pour les installations npm, les spécifications non épinglées et `@latest` sélectionnent le paquet
stable le plus récent qui indique être compatible avec cette version d’OpenClaw. Si la
dernière version actuelle de npm déclare un `openclaw.compat.pluginApi` ou un
`openclaw.install.minHostVersion` plus récent que ce que prend en charge cette version, OpenClaw analyse
les anciennes versions stables et installe la plus récente qui convient. Les versions exactes
et les balises de canal explicites telles que `@beta` restent épinglées au paquet sélectionné
et échouent en cas d’incompatibilité.

### Politique d’installation de l’opérateur

Configurez `security.installPolicy` afin d’exécuter une commande de politique locale approuvée
avant qu’une installation ou une mise à jour de Plugin ne se poursuive. La politique reçoit des métadonnées ainsi que
le chemin de la source préparée et peut autoriser ou bloquer l’installation. Elle couvre les chemins
d’installation et de mise à jour reposant à la fois sur la CLI et sur le Gateway. Les hooks `before_install`
du Plugin s’exécutent plus tard, et uniquement dans les processus OpenClaw où les hooks du Plugin sont chargés ;
utilisez donc plutôt `security.installPolicy` pour les décisions d’installation appartenant à l’opérateur. L’option
obsolète `--dangerously-force-unsafe-install` est acceptée à des fins de
compatibilité, mais n’a aucun effet : elle ne contourne ni la politique d’installation ni la
liste de refus intégrée d’OpenClaw pour les dépendances de Plugins.

Consultez [Configuration des Skills](/fr/tools/skills-config#operator-install-policy-securityinstallpolicy)
pour connaître le schéma d’exécution partagé de `security.installPolicy` utilisé par les Skills et les
Plugins.

### Configurer la politique des Plugins

La structure de configuration commune des Plugins est la suivante :

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Principales règles de la politique :

- `plugins.enabled: false` désactive tous les Plugins et ignore les opérations de découverte et de chargement.
  Les références obsolètes à des Plugins restent inertes tant que ce paramètre est actif ; réactivez
  les Plugins avant d’exécuter le nettoyage par doctor si vous souhaitez supprimer les identifiants obsolètes.
- `plugins.deny` prévaut sur la liste d’autorisation et sur l’activation individuelle des Plugins.
- `plugins.allow` est une liste d’autorisation exclusive. Les outils appartenant aux Plugins qui n’y figurent pas
  restent indisponibles même lorsque `tools.allow` inclut `"*"`.
- `plugins.entries.<id>.enabled: false` désactive un Plugin tout en conservant sa
  configuration.
- `plugins.load.paths` ajoute explicitement des fichiers ou répertoires locaux de Plugins.
  Les chemins locaux gérés par `plugins install` doivent être des répertoires ou
  des archives de Plugin ; utilisez `plugins.load.paths` pour les fichiers de Plugin autonomes.
- Les Plugins provenant de l’espace de travail sont désactivés par défaut ; activez-les explicitement ou
  ajoutez-les à la liste d’autorisation avant d’utiliser du code local de l’espace de travail.
- Les Plugins intégrés suivent leurs métadonnées intégrées d’activation ou de désactivation par défaut,
  sauf si la configuration les remplace explicitement.
- `plugins.slots.<slot>` (`memory` ou `contextEngine`) sélectionne un Plugin pour une
  catégorie exclusive. La sélection d’un emplacement compte comme une activation explicite et
  force l’activation du Plugin sélectionné pour cet emplacement, même s’il devrait autrement
  être activé manuellement. `plugins.deny` et `plugins.entries.<id>.enabled: false` continuent
  de le bloquer.
- Les Plugins intégrés à activation manuelle peuvent s’activer automatiquement lorsque la configuration nomme l’une de leurs
  interfaces, par exemple une référence de fournisseur ou de modèle, une configuration de canal, un moteur de CLI
  ou un environnement d’exécution d’agent.
- Le routage Codex de la famille OpenAI maintient séparées les limites du fournisseur et du Plugin d’exécution :
  les anciennes références de modèles Codex constituent une configuration héritée que doctor répare,
  tandis que le Plugin `codex` intégré gère l’environnement d’exécution du serveur d’application Codex pour
  les références d’agents canoniques `openai/*`, les valeurs explicites `agentRuntime.id: "codex"` et
  les anciennes références `codex/*`.

Lorsque `plugins.allow` n’est pas défini et que des Plugins non intégrés sont découverts automatiquement dans
l’espace de travail ou les racines globales de Plugins, le démarrage journalise
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
avec les identifiants des Plugins découverts et, pour les listes courtes, un extrait minimal de `plugins.allow`.
Exécutez [`openclaw plugins list --enabled --verbose`](/fr/cli/plugins#list)
ou [`openclaw plugins inspect <id>`](/fr/cli/plugins#inspect) sur l’identifiant du
Plugin indiqué avant de copier les Plugins approuvés dans `openclaw.json`. Le même
épinglage de confiance s’applique lorsque les diagnostics indiquent qu’un Plugin a été chargé
`without install/load-path provenance` : inspectez cet identifiant de Plugin, puis épinglez-le dans
`plugins.allow` ou réinstallez-le depuis une source approuvée afin qu’OpenClaw enregistre la
provenance de l’installation.

Exécutez `openclaw doctor` ou `openclaw doctor --fix` lorsque la validation de la configuration
signale des identifiants de Plugins obsolètes, des incohérences entre la liste d’autorisation et les outils, ou d’anciens chemins
de Plugins intégrés.

## Comprendre les formats de Plugins

OpenClaw reconnaît deux formats de Plugins :

| Format                  | Méthode de chargement                                                                   | À utiliser lorsque                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Plugin OpenClaw natif   | `openclaw.plugin.json` accompagné d’un module d’exécution chargé dans le processus      | Vous installez ou créez des fonctionnalités d’exécution propres à OpenClaw           |
| Paquet compatible       | Structure de Plugin Codex, Claude ou Cursor convertie dans l’inventaire des Plugins OpenClaw | Vous réutilisez des Skills, commandes, hooks ou métadonnées de paquet compatibles |

Les deux formats apparaissent dans `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` et `openclaw plugins disable`. Consultez
[Paquets de Plugins](/fr/plugins/bundles) pour connaître la limite de compatibilité des paquets et
[Créer des Plugins](/fr/plugins/building-plugins) pour la création de Plugins natifs.

## Hooks de Plugins

Les Plugins peuvent enregistrer des hooks à l’exécution par l’intermédiaire de deux API différentes :

- les hooks typés `api.on(...)` pour les événements du cycle de vie de l’environnement d’exécution. Il s’agit de
  l’interface privilégiée pour les intergiciels, les politiques, la réécriture des messages, la
  mise en forme des invites et le contrôle des outils ;
- `api.registerHook(...)` pour le système de hooks interne décrit dans
  [Hooks](/fr/automation/hooks). Il sert principalement aux effets secondaires généraux liés aux commandes ou au cycle de vie
  et à la compatibilité avec l’automatisation existante de type HOOK.

Règle rapide : si le gestionnaire a besoin d’une priorité, d’une sémantique de fusion ou d’un
comportement de blocage ou d’annulation, utilisez les hooks typés. S’il réagit simplement à `command:new`,
`command:reset`, `message:sent` ou à des événements généraux similaires, `api.registerHook`
convient.

Les hooks internes gérés par les Plugins apparaissent dans `openclaw hooks list` avec
`plugin:<id>`. Vous ne pouvez pas les activer ou les désactiver via `openclaw hooks` ;
activez ou désactivez plutôt le Plugin.

## Vérifier le Gateway actif

`openclaw plugins list` et la commande simple `openclaw plugins inspect` lisent la configuration,
le manifeste et l’état du registre à froid. Ils ne prouvent pas qu’un Gateway déjà en cours d’exécution
a importé le même code de Plugin.

Lorsqu’un Plugin semble installé mais que le trafic de discussion en direct ne l’utilise pas :

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Les Gateways gérés redémarrent automatiquement après l’installation, la mise à jour et
la désinstallation d’un plugin lorsque ces changements modifient sa source. Pour les installations sur VPS ou dans des conteneurs, assurez-vous
que tout redémarrage manuel cible le véritable processus enfant `openclaw gateway run` qui
dessert vos canaux, et pas seulement un wrapper ou un superviseur.

## Dépannage

| Symptôme                                                        | Vérification                                                                                                                                      | Correction                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Le plugin apparaît dans `plugins list`, mais les hooks d’exécution ne s’exécutent pas  | Utilisez `openclaw plugins inspect <id> --runtime --json` et confirmez le Gateway actif avec `gateway status --deep --require-rpc`             | Redémarrez le Gateway actif après toute modification liée à l’installation, à la mise à jour, à la configuration ou à la source                               |
| Des diagnostics de propriété en double d’un canal ou d’un outil apparaissent         | Exécutez `openclaw plugins list --enabled --verbose`, inspectez chaque plugin suspect avec `--runtime --json` et comparez la propriété des canaux et des outils | Désactivez l’un des propriétaires, supprimez les installations obsolètes ou utilisez `preferOver` dans le manifeste pour un remplacement intentionnel      |
| La configuration indique qu’un plugin est manquant                                | Consultez l’[inventaire des plugins](/fr/plugins/plugin-inventory) pour déterminer s’il est intégré, externe officiel ou disponible uniquement sous forme de source                           | Installez le paquet externe, activez le plugin intégré ou supprimez la configuration obsolète                         |
| La configuration est invalide pendant l’installation                               | Lisez le message de validation et exécutez `openclaw doctor --fix` s’il indique un état de plugin obsolète                                             | Doctor peut mettre en quarantaine la configuration de plugin invalide en désactivant l’entrée et en supprimant la charge utile invalide     |
| Le chemin du plugin est bloqué en raison d’une propriété ou d’autorisations suspectes | Examinez le diagnostic précédant l’erreur de configuration                                                                                             | Corrigez la propriété et les autorisations du système de fichiers, puis exécutez `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloque les commandes de cycle de vie                | Confirmez que l’installation est gérée par Nix                                                                                                      | Modifiez la sélection des plugins dans la source Nix au lieu d’utiliser les commandes de modification des plugins                      |
| L’importation d’une dépendance échoue à l’exécution                             | Vérifiez si le plugin a été installé via npm/git/ClawHub ou chargé depuis un chemin local                                                 | Exécutez `openclaw plugins update <id>`, réinstallez la source ou installez vous-même les dépendances locales du plugin |

Lorsqu’une configuration de plugin obsolète désigne encore un plugin de canal qui n’est plus détectable,
la validation de la configuration transforme la clé de ce canal en avertissement au lieu d’une erreur
bloquante, afin que le démarrage du Gateway puisse toujours desservir tous les autres canaux. Exécutez
`openclaw doctor --fix` pour supprimer les entrées de plugin et de canal obsolètes. Les clés de canal
inconnues sans preuve de plugin obsolète font toujours échouer la validation, afin que les fautes de frappe
restent visibles.

Pour remplacer intentionnellement un canal, le plugin privilégié doit déclarer
`channelConfigs.<channel-id>.preferOver` avec l’identifiant du plugin hérité ou de priorité
inférieure. Si les deux plugins sont explicitement activés, OpenClaw conserve cette demande
et signale des diagnostics de propriété en double des canaux et outils au lieu de choisir
silencieusement un propriétaire.

Si un paquet installé indique qu’il `requires compiled runtime output for
TypeScript entry ...`, le paquet a été publié sans les fichiers JavaScript
dont OpenClaw a besoin à l’exécution. Effectuez une mise à jour ou une réinstallation après que l’éditeur a fourni
le JavaScript compilé, ou désactivez/désinstallez le plugin jusque-là.

### Propriété bloquée du chemin du plugin

Si les diagnostics indiquent
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
et que la validation est suivie de `plugin present but blocked`, OpenClaw a trouvé
des fichiers de plugin appartenant à un utilisateur Unix différent de celui du processus qui les charge.
Conservez la configuration du plugin ; corrigez la propriété du système de fichiers ou exécutez OpenClaw
avec le même utilisateur que celui qui possède le répertoire d’état.

Pour les installations Docker, l’image officielle s’exécute sous l’utilisateur `node` (uid `1000`). Les
répertoires de configuration et d’espace de travail OpenClaw montés depuis l’hôte doivent donc normalement
appartenir à l’uid `1000` :

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si vous exécutez intentionnellement OpenClaw en tant que root, attribuez plutôt
la propriété root à la racine gérée des plugins :

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Après avoir corrigé la propriété, réexécutez `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` afin que le registre persistant des plugins
corresponde aux fichiers réparés.

### Configuration lente des outils de plugin

Si les tours de l’agent semblent se bloquer pendant la préparation des outils, activez la journalisation de trace
et recherchez les lignes de durée des fabriques d’outils de plugin :

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Recherchez :

```text
[trace:plugin-tools] factory timings ...
```

Le résumé indique la durée totale des fabriques et les fabriques d’outils de plugin les plus lentes,
notamment l’identifiant du plugin, les noms d’outils déclarés, la forme du résultat et le caractère
facultatif de l’outil. Les lignes lentes deviennent des avertissements lorsqu’une seule fabrique prend
au moins 1 s ou que la préparation totale des fabriques d’outils de plugin prend au moins 5 s.

OpenClaw met en cache les résultats réussis des fabriques d’outils de plugin pour les résolutions répétées
utilisant le même contexte de requête effectif. La clé de cache comprend la configuration d’exécution effective,
l’espace de travail et l’identifiant de l’agent, la politique de bac à sable, les paramètres du navigateur,
le contexte de livraison, l’identité du demandeur et l’état de propriété ; les fabriques qui dépendent de ces
champs fiables sont donc réexécutées lorsque le contexte change. Si les durées restent élevées, le plugin
effectue peut-être une opération coûteuse avant de renvoyer ses définitions d’outils.

Si un plugin représente l’essentiel de la durée, inspectez ses enregistrements d’exécution :

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Mettez ensuite à jour, réinstallez ou désactivez ce plugin. Les auteurs de plugins doivent reporter
le chargement coûteux des dépendances dans le chemin d’exécution de l’outil au lieu de l’effectuer
dans la fabrique d’outils.

Pour les racines de dépendances, la validation des métadonnées des paquets, les enregistrements du registre,
le comportement de rechargement au démarrage et le nettoyage des éléments hérités, consultez
[Résolution des dépendances des plugins](/fr/plugins/dependency-resolution).

## Pages connexes

- [Gérer les plugins](/fr/plugins/manage-plugins) - exemples de commandes pour répertorier, installer, mettre à jour, désinstaller et publier
- [`openclaw plugins`](/fr/cli/plugins) - référence complète de la CLI
- [Inventaire des plugins](/fr/plugins/plugin-inventory) - liste générée des plugins intégrés et externes
- [Référence des plugins](/fr/plugins/reference) - pages de référence générées pour chaque plugin
- [Plugins de la communauté](/fr/plugins/community) - découverte avec ClawHub et politique relative aux PR de documentation
- [Résolution des dépendances des plugins](/fr/plugins/dependency-resolution) - racines d’installation, enregistrements du registre et limites d’exécution
- [Création de plugins](/fr/plugins/building-plugins) - guide de création de plugins natifs
- [Présentation du SDK des plugins](/fr/plugins/sdk-overview) - enregistrement à l’exécution, hooks et champs d’API
- [Manifeste de plugin](/fr/plugins/manifest) - manifeste et métadonnées du paquet
