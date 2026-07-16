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
    generated_at: "2026-07-16T13:52:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Les Plugins étendent OpenClaw avec des canaux, des fournisseurs de modèles, des environnements d’agents, des outils,
des Skills, la parole, la transcription en temps réel, la voix, la compréhension des médias, la génération,
la récupération Web, la recherche Web et d’autres fonctionnalités d’exécution.

Utilisez cette page pour installer un Plugin, redémarrer le Gateway, vérifier que l’environnement d’exécution
l’a chargé et résoudre les échecs de configuration courants. Pour des exemples portant uniquement sur les commandes, consultez
[Gérer les Plugins](/fr/plugins/manage-plugins). Pour l’inventaire généré des
Plugins intégrés, externes officiels et disponibles uniquement sous forme de code source, consultez
[Inventaire des Plugins](/fr/plugins/plugin-inventory).

## Prérequis

- une copie de travail ou une installation d’OpenClaw avec la CLI `openclaw` disponible
- un accès réseau à la source sélectionnée (ClawHub, npm ou un hébergeur git)
- les identifiants, clés de configuration ou outils du système d’exploitation propres au Plugin indiqués dans
  la documentation de configuration de ce Plugin
- l’autorisation de recharger ou redémarrer le Gateway qui dessert vos canaux

## Démarrage rapide

<Steps>
  <Step title="Trouver le Plugin">
    Recherchez des paquets de Plugins publics sur [ClawHub](/clawhub) :

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub est l’interface principale de découverte des Plugins communautaires. Pendant la
    transition de lancement, les spécifications de paquet simples ordinaires sont toujours installées depuis npm, sauf si
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

    Considérez l’installation d’un Plugin comme l’exécution de code. Préférez des versions épinglées pour
    des installations de production reproductibles. Les paquets ClawHub et le catalogue
    intégré/officiel d’OpenClaw sont des sources fiables. Les nouvelles sources arbitraires npm, git,
    de chemin/archive local, `npm-pack:` ou de place de marché nécessitent
    `--force` dans les installations non interactives après avoir
    examiné la source et établi qu’elle est fiable.

  </Step>

  <Step title="Le configurer et l’activer">
    Configurez les paramètres propres au Plugin sous `plugins.entries.<id>.config`.
    Activez le Plugin s’il ne l’est pas déjà :

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Si `plugins.allow` est défini, l’identifiant du Plugin installé doit figurer dans cette liste
    avant que le Plugin puisse être chargé. `openclaw plugins install` ajoute l’identifiant
    installé à une liste `plugins.allow` existante et supprime ce même identifiant de
    `plugins.deny` afin que l’installation explicite puisse être chargée après le redémarrage.

  </Step>

  <Step title="Laisser le Gateway se recharger">
    L’installation, la mise à jour ou la désinstallation du code d’un Plugin nécessite un redémarrage du
    Gateway. Un Gateway géré dont le rechargement de la configuration est activé détecte la modification
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
    ou commandes de la CLI appartenant au Plugin. La commande `inspect` simple vérifie uniquement le manifeste
    et le registre à froid.

  </Step>
</Steps>

## Configuration

### Choisir une source d’installation

| Source      | À utiliser lorsque                                                               | Exemple                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Vous souhaitez bénéficier de la découverte native d’OpenClaw, des analyses, des métadonnées de version et des indications d’installation | `openclaw plugins install clawhub:<package>`                   |
| npm         | Vous avez besoin d’utiliser directement le registre npm ou des flux de travail avec des balises de distribution                             | `openclaw plugins install npm:<package>`                       |
| git         | Vous avez besoin d’une branche, d’une balise ou d’un commit provenant d’un dépôt                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| chemin local  | Vous développez ou testez un Plugin sur la même machine                     | `openclaw plugins install --link ./my-plugin`                  |
| place de marché | Vous installez un Plugin de place de marché compatible avec Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Les spécifications de paquet simples ont un comportement de compatibilité particulier : un nom simple qui
correspond à l’identifiant d’un Plugin intégré utilise cette source intégrée ; un nom simple qui correspond
à l’identifiant d’un Plugin externe officiel utilise le catalogue officiel de paquets ; toute autre
spécification simple est installée par npm pendant la transition de lancement. Les spécifications `@openclaw/*`
brutes qui correspondent à des Plugins intégrés sont également résolues vers la copie intégrée avant le
repli vers npm. Utilisez `npm:@openclaw/<plugin>@<version>` pour installer délibérément le
paquet npm externe plutôt que la copie intégrée. Utilisez `clawhub:`, `npm:`,
`git:` ou `npm-pack:` pour sélectionner la source de manière déterministe. Consultez
[`openclaw plugins`](/fr/cli/plugins#install) pour connaître le contrat complet de la commande.

Pour les installations npm, les spécifications non épinglées et `@latest` sélectionnent le paquet
stable le plus récent qui annonce sa compatibilité avec cette version d’OpenClaw. Si la
dernière version actuellement publiée sur npm déclare une version de `openclaw.compat.pluginApi` ou
`openclaw.install.minHostVersion` plus récente que celle prise en charge par cette version, OpenClaw analyse
les anciennes versions stables et installe la plus récente qui convient. Les versions exactes
et les balises de canal explicites telles que `@beta` restent épinglées au paquet sélectionné
et échouent en cas d’incompatibilité.

### Politique d’installation de l’opérateur

Configurez `security.installPolicy` afin d’exécuter une commande de politique locale fiable
avant qu’une installation ou une mise à jour de Plugin ne se poursuive. La politique reçoit des métadonnées ainsi que
le chemin de la source préparée et peut autoriser ou bloquer l’installation. Elle couvre à la fois les chemins
d’installation et de mise à jour de la CLI et ceux gérés par le Gateway. Les hooks `before_install` du Plugin s’exécutent
plus tard, et uniquement dans les processus OpenClaw où les hooks de Plugins sont chargés ; utilisez donc
plutôt `security.installPolicy` pour les décisions d’installation appartenant à l’opérateur. L’option
obsolète `--dangerously-force-unsafe-install` est acceptée à des fins de
compatibilité, mais n’a aucun effet : elle ne contourne ni la politique d’installation ni la liste de refus
intégrée des dépendances de Plugins d’OpenClaw.

Consultez la [configuration des Skills](/fr/tools/skills-config#operator-install-policy-securityinstallpolicy)
pour connaître le schéma d’exécution `security.installPolicy` partagé par les Skills et les
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

Principales règles de politique :

- `plugins.enabled: false` désactive tous les Plugins et ignore les opérations de découverte et de chargement.
  Les références obsolètes à des Plugins restent inertes tant que cette option est active ; réactivez
  les Plugins avant d’exécuter le nettoyage par doctor si vous souhaitez supprimer les identifiants obsolètes.
- `plugins.deny` prévaut sur la liste d’autorisation et sur l’activation individuelle des Plugins.
- `plugins.allow` est une liste d’autorisation exclusive. Les outils appartenant à des Plugins qui ne figurent pas dans la
  liste d’autorisation restent indisponibles même lorsque `tools.allow` contient `"*"`.
- `plugins.entries.<id>.enabled: false` désactive un Plugin tout en conservant sa
  configuration.
- `plugins.load.paths` ajoute explicitement des fichiers ou répertoires de Plugins locaux.
  Les chemins locaux `plugins install` gérés doivent être des répertoires ou des
  archives de Plugins ; utilisez `plugins.load.paths` pour les fichiers de Plugin autonomes.
- Les Plugins provenant de l’espace de travail sont désactivés par défaut ; activez-les explicitement ou
  ajoutez-les à la liste d’autorisation avant d’utiliser du code local de l’espace de travail.
- Les Plugins intégrés suivent leurs métadonnées internes d’activation ou de désactivation par défaut,
  sauf si la configuration les remplace explicitement.
- `plugins.slots.<slot>` (`memory` ou `contextEngine`) sélectionne un Plugin pour une
  catégorie exclusive. La sélection d’un emplacement compte comme une activation explicite et
  force l’activation du Plugin sélectionné pour cet emplacement, même s’il devrait autrement
  être optionnel. `plugins.deny` et `plugins.entries.<id>.enabled: false` le
  bloquent toujours.
- Les Plugins intégrés optionnels peuvent s’activer automatiquement lorsque la configuration nomme l’une de leurs
  interfaces, comme une référence de fournisseur/modèle, une configuration de canal, un moteur de CLI
  ou un environnement d’exécution d’agent.
- Le routage Codex de la famille OpenAI maintient séparées les limites entre le fournisseur et le Plugin d’exécution :
  les anciennes références de modèles Codex constituent une configuration héritée que doctor répare,
  tandis que le Plugin intégré `codex` possède l’environnement d’exécution du serveur d’application Codex pour
  les références d’agents `openai/*` canoniques, les références `agentRuntime.id: "codex"` explicites et
  les anciennes références `codex/*`.

Lorsque `plugins.allow` n’est pas défini et que des Plugins non intégrés sont découverts automatiquement depuis
l’espace de travail ou les racines globales des Plugins, le démarrage consigne
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
avec les identifiants des Plugins découverts et, pour les listes courtes, un extrait `plugins.allow`
minimal. Exécutez [`openclaw plugins list --enabled --verbose`](/fr/cli/plugins#list)
ou [`openclaw plugins inspect <id>`](/fr/cli/plugins#inspect) avec l’identifiant du
Plugin indiqué avant de copier les Plugins fiables dans `openclaw.json`. Le même
épinglage de confiance s’applique lorsque les diagnostics indiquent qu’un Plugin a été chargé
`without install/load-path provenance` : inspectez cet identifiant de Plugin, puis épinglez-le dans
`plugins.allow` ou réinstallez-le depuis une source fiable afin qu’OpenClaw enregistre la
provenance de l’installation.

Exécutez `openclaw doctor` ou `openclaw doctor --fix` lorsque la validation de la configuration
signale des identifiants de Plugins obsolètes, des incohérences de liste d’autorisation ou d’outils, ou d’anciens chemins de
Plugins intégrés.

## Comprendre les formats de Plugins

OpenClaw reconnaît deux formats de Plugins :

| Format                 | Méthode de chargement                                                                 | À utiliser lorsque                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin OpenClaw natif | `openclaw.plugin.json` accompagné d’un module d’exécution chargé dans le processus               | Vous installez ou développez des fonctionnalités d’exécution propres à OpenClaw  |
| Bundle compatible      | Structure de Plugin Codex, Claude ou Cursor mappée dans l’inventaire des Plugins d’OpenClaw | Vous réutilisez des Skills, commandes, hooks ou métadonnées de bundle compatibles |

Les deux formats apparaissent dans `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` et `openclaw plugins disable`. Consultez
[Bundles de Plugins](/fr/plugins/bundles) pour connaître la limite de compatibilité des bundles et
[Créer des Plugins](/fr/plugins/building-plugins) pour la création de Plugins natifs.

## Hooks de Plugins

Les Plugins peuvent enregistrer des hooks à l’exécution au moyen de deux API différentes :

- Les hooks typés `api.on(...)` pour les événements du cycle de vie de l’environnement d’exécution. Il s’agit de
  l’interface privilégiée pour les intergiciels, les politiques, la réécriture des messages, la
  mise en forme des prompts et le contrôle des outils.
- `api.registerHook(...)` pour le système de hooks interne décrit dans
  [Hooks](/fr/automation/hooks). Il sert principalement aux effets secondaires généraux liés aux commandes ou au cycle de vie
  et à la compatibilité avec les automatisations existantes de style HOOK.

Règle simple : si le gestionnaire nécessite une priorité, une sémantique de fusion ou un
comportement de blocage/annulation, utilisez les hooks typés. S’il réagit simplement à `command:new`,
`command:reset`, `message:sent` ou à des événements généraux similaires, `api.registerHook`
convient.

Les hooks internes gérés par les Plugins apparaissent dans `openclaw hooks list` avec
`plugin:<id>`. Vous ne pouvez pas les activer ou les désactiver au moyen de `openclaw hooks` ;
activez ou désactivez plutôt le Plugin.

## Vérifier le Gateway actif

`openclaw plugins list` et la commande simple `openclaw plugins inspect` lisent l’état à froid de la configuration,
du manifeste et du registre. Elles ne prouvent pas qu’un
Gateway déjà en cours d’exécution a importé le même code de plugin.

Lorsqu’un plugin semble installé, mais que le trafic de discussion en direct ne l’utilise pas :

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Les Gateways gérés redémarrent automatiquement après les modifications d’installation, de mise à jour et
de désinstallation qui changent la source du plugin. Sur les installations VPS ou en conteneur, assurez-vous
que tout redémarrage manuel cible bien le processus enfant `openclaw gateway run`
qui dessert vos canaux, et pas seulement un encapsuleur ou un superviseur.

## Résolution des problèmes

| Symptôme                                                       | Vérification                                                                                                                                 | Correction                                                                                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Le plugin apparaît dans `plugins list`, mais les hooks d’exécution ne s’exécutent pas | Utilisez `openclaw plugins inspect <id> --runtime --json` et confirmez le Gateway actif avec `gateway status --deep --require-rpc` | Redémarrez le Gateway actif après toute modification d’installation, de mise à jour, de configuration ou de source |
| Des diagnostics de propriété de canal ou d’outil en double apparaissent | Exécutez `openclaw plugins list --enabled --verbose`, inspectez chaque plugin suspect avec `--runtime --json` et comparez la propriété des canaux/outils | Désactivez l’un des propriétaires, supprimez les installations obsolètes ou utilisez la propriété de manifeste `preferOver` pour un remplacement intentionnel |
| La configuration indique qu’un plugin est manquant             | Consultez l’[inventaire des plugins](/fr/plugins/plugin-inventory) pour déterminer s’il est intégré, externe officiel ou uniquement disponible sous forme de source | Installez le paquet externe, activez le plugin intégré ou supprimez la configuration obsolète |
| La configuration n’est pas valide pendant l’installation       | Lisez le message de validation et exécutez `openclaw doctor --fix` s’il signale un état de plugin obsolète | Doctor peut mettre en quarantaine la configuration de plugin non valide en désactivant l’entrée et en supprimant la charge utile non valide |
| Le chemin du plugin est bloqué en raison d’un propriétaire ou de permissions suspects | Examinez le diagnostic précédant l’erreur de configuration | Corrigez le propriétaire ou les permissions du système de fichiers, puis exécutez `openclaw plugins registry --refresh` |
| `OPENCLAW_NIX_MODE=1` bloque les commandes de cycle de vie        | Confirmez que l’installation est gérée par Nix | Modifiez la sélection des plugins dans la source Nix au lieu d’utiliser les commandes de modification des plugins |
| L’importation d’une dépendance échoue à l’exécution            | Vérifiez si le plugin a été installé via npm/git/ClawHub ou chargé depuis un chemin local | Exécutez `openclaw plugins update <id>`, réinstallez la source ou installez vous-même les dépendances locales du plugin |

Lorsque la configuration obsolète d’un plugin mentionne encore un plugin de canal qui n’est plus détectable,
la validation de la configuration rétrograde la clé de ce canal en avertissement au lieu d’émettre une
erreur bloquante, afin que le démarrage du Gateway puisse toujours desservir tous les autres canaux. Exécutez
`openclaw doctor --fix` pour supprimer les entrées obsolètes du plugin et du canal. Les clés
de canal inconnues sans preuve de plugin obsolète font toujours échouer la validation afin que les fautes de frappe
restent visibles.

Pour remplacer intentionnellement un canal, le plugin à privilégier doit déclarer
`channelConfigs.<channel-id>.preferOver` avec l’identifiant du plugin hérité ou de priorité inférieure.
Si les deux plugins sont explicitement activés, OpenClaw respecte cette demande
et signale des diagnostics de propriété de canal ou d’outil en double au lieu de choisir
silencieusement un propriétaire.

Si un paquet installé indique qu’il `requires compiled runtime output for
TypeScript entry ...`, le paquet a été publié sans les fichiers JavaScript
dont OpenClaw a besoin à l’exécution. Mettez-le à jour ou réinstallez-le après que l’éditeur a fourni
le JavaScript compilé, ou désactivez/désinstallez le plugin en attendant.

### Propriété bloquée du chemin du plugin

Si les diagnostics indiquent
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
et que la validation affiche ensuite `plugin present but blocked`, OpenClaw a trouvé
des fichiers de plugin appartenant à un utilisateur Unix différent de celui du processus qui les charge.
Conservez la configuration du plugin ; corrigez le propriétaire dans le système de fichiers ou exécutez OpenClaw
avec le même utilisateur que celui qui possède le répertoire d’état.

Pour les installations Docker, l’image officielle s’exécute sous l’identité `node` (uid `1000`) ; les
répertoires de configuration et d’espace de travail OpenClaw montés depuis l’hôte doivent donc normalement
appartenir à l’uid `1000` :

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si vous exécutez intentionnellement OpenClaw en tant que root, attribuez plutôt
à root la propriété de la racine des plugins gérés :

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Après avoir corrigé le propriétaire, réexécutez `openclaw doctor --fix` ou
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
[trace:plugin-tools] durées des fabriques ...
```

Le récapitulatif indique la durée totale des fabriques et les fabriques d’outils de plugin les plus lentes,
notamment l’identifiant du plugin, les noms d’outils déclarés, la forme du résultat et le caractère
facultatif ou non de l’outil. Les lignes lentes deviennent des avertissements lorsqu’une seule fabrique prend
au moins 1s ou que la préparation totale des fabriques d’outils de plugin prend au moins 5s.

OpenClaw met en cache les résultats réussis des fabriques d’outils de plugin pour les résolutions répétées
avec le même contexte de requête effectif. La clé du cache comprend
la configuration d’exécution effective, l’espace de travail et l’identifiant de l’agent, la politique de bac à sable, les paramètres
du navigateur, le contexte de livraison, l’identité du demandeur et l’état de propriété, de sorte que
les fabriques dépendant de ces champs fiables se réexécutent lorsque le contexte
change. Si les durées restent élevées, il est possible que le plugin effectue un travail coûteux avant
de renvoyer les définitions de ses outils.

Si un plugin domine les mesures de durée, examinez ses enregistrements d’exécution :

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Mettez ensuite à jour, réinstallez ou désactivez ce plugin. Les auteurs de plugins doivent déplacer
le chargement coûteux des dépendances vers le chemin d’exécution de l’outil plutôt que de l’effectuer
dans la fabrique d’outils.

Pour les racines des dépendances, la validation des métadonnées de paquet, les enregistrements du registre, le comportement
de rechargement au démarrage et le nettoyage des éléments hérités, consultez
[Résolution des dépendances des plugins](/fr/plugins/dependency-resolution).

## Pages connexes

- [Gérer les plugins](/fr/plugins/manage-plugins) - exemples de commandes pour répertorier, installer, mettre à jour, désinstaller et publier
- [`openclaw plugins`](/fr/cli/plugins) - référence complète de la CLI
- [Inventaire des plugins](/fr/plugins/plugin-inventory) - liste générée des plugins intégrés et externes
- [Référence des plugins](/fr/plugins/reference) - pages de référence générées pour chaque plugin
- [Plugins communautaires](/fr/plugins/community) - découverte sur ClawHub et politique relative aux PR de documentation
- [Résolution des dépendances des plugins](/fr/plugins/dependency-resolution) - racines d’installation, enregistrements du registre et limites d’exécution
- [Création de plugins](/fr/plugins/building-plugins) - guide de création de plugins natifs
- [Présentation du SDK des plugins](/fr/plugins/sdk-overview) - enregistrement à l’exécution, hooks et champs de l’API
- [Manifeste de plugin](/fr/plugins/manifest) - manifeste et métadonnées de paquet
