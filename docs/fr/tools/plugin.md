---
doc-schema-version: 1
read_when:
    - Installation ou configuration des plugins
    - Comprendre les règles de découverte et de chargement des plugins
    - Utilisation des bundles de plugins compatibles avec Codex/Claude
sidebarTitle: Getting Started
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-06-27T18:20:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Les Plugins étendent OpenClaw avec des canaux, des fournisseurs de modèles, des harnais d’agent, des outils,
des Skills, la parole, la transcription en temps réel, la voix, la compréhension des médias, la génération,
la récupération web, la recherche web et d’autres capacités d’exécution.

Utilisez cette page lorsque vous voulez installer un plugin, redémarrer le Gateway, vérifier
que le runtime l’a chargé et résoudre les échecs de configuration courants. Pour des exemples uniquement
sous forme de commandes, consultez [Gérer les plugins](/fr/plugins/manage-plugins). Pour l’inventaire généré complet
des plugins groupés, externes officiels et disponibles uniquement dans le source, consultez
[Inventaire des Plugin](/fr/plugins/plugin-inventory).

## Prérequis

Avant d’installer un plugin, assurez-vous de disposer de :

- un checkout ou une installation OpenClaw avec la CLI `openclaw` disponible
- un accès réseau à la source sélectionnée, comme ClawHub, npm ou un hôte git
- tous les identifiants, clés de configuration ou outils de système d’exploitation propres au plugin indiqués
  par la documentation de configuration de ce plugin
- l’autorisation pour le Gateway qui dessert vos canaux de se recharger ou de redémarrer

## Démarrage rapide

<Steps>
  <Step title="Trouver le plugin">
    Recherchez des paquets de plugins publics dans [ClawHub](/fr/clawhub) :

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub est la principale surface de découverte pour les plugins communautaires. Pendant la
    bascule de lancement, les spécifications de paquet ordinaires sans préfixe s’installent toujours depuis npm sauf
    si elles correspondent à un id de plugin officiel. Les spécifications de paquet `@openclaw/*` brutes qui correspondent
    à des plugins groupés utilisent la copie groupée de la version actuelle d’OpenClaw. Utilisez un
    préfixe explicite lorsque vous avez besoin d’une source précise.

  </Step>

  <Step title="Installer le plugin">
    ```bash
    # Depuis ClawHub.
    openclaw plugins install clawhub:<package>

    # Depuis npm.
    openclaw plugins install npm:<package>

    # Depuis git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Depuis un checkout de développement local.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Traitez les installations de plugins comme l’exécution de code. Préférez les versions épinglées lorsque vous
    avez besoin d’installations de production reproductibles.

  </Step>

  <Step title="Le configurer et l’activer">
    Configurez les paramètres propres au plugin sous `plugins.entries.<id>.config`.
    Activez le plugin lorsqu’il ne l’est pas déjà :

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Si votre configuration utilise une liste restrictive `plugins.allow`, l’id du plugin installé
    doit y être présent avant que le plugin puisse se charger.
    `openclaw plugins install` ajoute l’id installé à une liste `plugins.allow`
    existante et supprime le même id de `plugins.deny` afin que
    l’installation explicite puisse se charger après redémarrage.

  </Step>

  <Step title="Laisser le Gateway se recharger">
    L’installation, la mise à jour ou la désinstallation du code d’un plugin nécessite un redémarrage du Gateway.
    Lorsqu’un Gateway géré est déjà en cours d’exécution avec le rechargement de configuration
    activé, OpenClaw détecte l’enregistrement d’installation de plugin modifié et redémarre le
    Gateway automatiquement. Si le Gateway n’est pas géré ou si le rechargement est désactivé,
    redémarrez-le vous-même :

    ```bash
    openclaw gateway restart
    ```

    Les opérations d’activation et de désactivation mettent à jour la configuration et rafraîchissent le registre à froid.
    Une inspection du runtime reste le chemin de vérification le plus clair pour les surfaces d’exécution
    actives.

  </Step>

  <Step title="Vérifier l’enregistrement dans le runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Utilisez `--runtime` lorsque vous devez prouver les outils, hooks, services,
    méthodes Gateway ou commandes CLI appartenant au plugin qui sont enregistrés. Un simple `inspect` est une vérification
    à froid du manifeste et du registre.

  </Step>
</Steps>

## Configuration

### Choisir une source d’installation

| Source      | À utiliser lorsque                                                              | Exemple                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Vous voulez une découverte native OpenClaw, des analyses, des métadonnées de version et des indications d’installation | `openclaw plugins install clawhub:<package>`                   |
| npm         | Vous avez besoin de workflows directs de registre npm ou de dist-tag            | `openclaw plugins install npm:<package>`                       |
| git         | Vous avez besoin d’une branche, d’un tag ou d’un commit depuis un dépôt         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| chemin local | Vous développez ou testez un plugin sur la même machine                        | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Vous installez un plugin de marketplace compatible avec Claude                 | `openclaw plugins install <plugin> --marketplace <source>`     |

Les spécifications de paquet sans préfixe ont un comportement de compatibilité spécial. Si le nom sans préfixe correspond
à un id de plugin groupé, OpenClaw utilise cette source groupée. S’il correspond à un
id de plugin externe officiel, OpenClaw utilise le catalogue de paquets officiel. Les autres
spécifications de paquet ordinaires sans préfixe s’installent via npm pendant la bascule de lancement. Les spécifications de paquet
`@openclaw/*` brutes qui correspondent à des plugins groupés se résolvent aussi vers la
copie groupée avant le repli npm. Utilisez `npm:@openclaw/<plugin>@<version>` lorsque
vous voulez délibérément le paquet npm externe plutôt que la copie groupée détenue par l’image.
Utilisez `clawhub:`, `npm:`, `git:` ou `npm-pack:` lorsque vous avez besoin
d’une sélection de source déterministe. Consultez [`openclaw plugins`](/fr/cli/plugins#install)
pour le contrat de commande complet.

Pour les installations npm, les spécifications de paquet non épinglées et `@latest` choisissent le paquet stable
le plus récent qui annonce sa compatibilité avec cette version d’OpenClaw. Si la
version latest actuelle de npm déclare un `openclaw.compat.pluginApi` ou un
`openclaw.install.minHostVersion` plus récent, OpenClaw analyse les anciennes versions stables du paquet
et installe la plus récente qui convient. Les versions exactes et les tags de canal explicites
comme `@beta` restent épinglés au paquet sélectionné et échouent en cas d’incompatibilité.

### Politique d’installation de l’opérateur

Configurez `security.installPolicy` pour exécuter une commande de politique locale de confiance avant que
l’installation ou la mise à jour d’un plugin ne se poursuive. La politique reçoit les métadonnées ainsi que le chemin
source préparé et peut autoriser ou bloquer l’installation. Elle couvre les chemins d’installation/mise à jour de plugins
adossés à la CLI et au Gateway. Les hooks `before_install` de plugin s’exécutent plus tard uniquement dans
les processus OpenClaw où les hooks de plugin sont chargés, donc utilisez `security.installPolicy`
pour les décisions d’installation détenues par l’opérateur. L’option obsolète
`--dangerously-force-unsafe-install` est acceptée pour compatibilité mais ne
contourne pas la politique d’installation ni la denylist intégrée d’OpenClaw pour les dépendances de plugins.

Consultez [Configuration des Skills](/fr/tools/skills-config#operator-install-policy-securityinstallpolicy)
pour le schéma exec partagé `security.installPolicy` utilisé à la fois par les Skills et
les plugins.

### Configurer la politique des plugins

La forme de configuration commune des plugins est :

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

Règles de politique clés :

- `plugins.enabled: false` désactive tous les plugins et ignore le travail de découverte/chargement
  des plugins. Les références de plugins obsolètes sont inertes tant que cela est actif ; réactivez
  les plugins avant d’exécuter le nettoyage doctor lorsque vous voulez supprimer les ids obsolètes.
- `plugins.deny` l’emporte sur l’autorisation et l’activation par plugin.
- `plugins.allow` est une allowlist exclusive. Les outils appartenant aux plugins en dehors de
  l’allowlist restent indisponibles, même lorsque `tools.allow` inclut `"*"`.
- `plugins.entries.<id>.enabled: false` désactive un plugin tout en conservant sa
  configuration.
- `plugins.load.paths` ajoute des fichiers ou répertoires de plugin locaux explicites. Les chemins locaux
  `plugins install` gérés doivent être des répertoires ou archives de plugin ; utilisez
  `plugins.load.paths` pour les fichiers de plugin autonomes.
- Les plugins issus du workspace sont désactivés par défaut ; activez-les explicitement ou
  ajoutez-les à l’allowlist avant d’utiliser du code de workspace local.
- Les plugins groupés suivent leurs métadonnées intégrées default-on/default-off sauf
  si la configuration les remplace explicitement.
- `plugins.slots.<slot>` choisit un plugin pour des catégories exclusives comme
  les moteurs de mémoire et de contexte. La sélection d’un slot force l’activation du plugin sélectionné
  pour ce slot en comptant comme activation explicite ; il peut se charger même lorsqu’il
  serait sinon opt-in. `plugins.deny` et
  `plugins.entries.<id>.enabled: false` le bloquent toujours.
- Les plugins groupés opt-in peuvent s’auto-activer lorsque la configuration nomme l’une de leurs surfaces
  détenues, comme une référence fournisseur/modèle, une configuration de canal, un backend CLI ou un
  runtime de harnais d’agent.
- Le routage Codex de la famille OpenAI garde les frontières du fournisseur et du plugin de runtime
  séparées : les anciennes références de modèles Codex sont une configuration legacy réparée par doctor, tandis que le plugin groupé
  `codex` possède le runtime serveur d’application Codex pour les références d’agent canoniques `openai/*`,
  `agentRuntime.id: "codex"` explicite et les références legacy `codex/*`.

Lorsque `plugins.allow` n’est pas défini et que des plugins non groupés sont auto-découverts depuis
le workspace ou les racines de plugins globales, les journaux de démarrage indiquent
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
L’avertissement inclut les ids de plugins découverts et, pour les listes courtes, un extrait minimal
`plugins.allow`. Exécutez
[`openclaw plugins list --enabled --verbose`](/fr/cli/plugins#list) ou
[`openclaw plugins inspect <id>`](/fr/cli/plugins#inspect) avec l’id de plugin indiqué
avant de copier des plugins de confiance dans `openclaw.json`. Les mêmes recommandations d’épinglage de confiance
s’appliquent lorsque les diagnostics indiquent qu’un plugin s’est chargé
`without install/load-path provenance` : inspectez cet id de plugin, puis épinglez l’id
de confiance dans `plugins.allow` ou réinstallez depuis une source de confiance afin qu’OpenClaw
enregistre la provenance d’installation.

Exécutez `openclaw doctor` ou `openclaw doctor --fix` lorsque la validation de configuration signale
des ids de plugins obsolètes, des incohérences allowlist/outils ou des chemins de plugins groupés legacy.

## Comprendre les formats de plugins

OpenClaw reconnaît deux formats de plugins :

| Format                 | Comment il se charge                                                         | À utiliser lorsque                                                     |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin OpenClaw natif | `openclaw.plugin.json` plus un module de runtime chargé dans le processus     | Vous installez ou construisez des capacités de runtime propres à OpenClaw |
| Bundle compatible      | Agencement de plugin Codex, Claude ou Cursor mappé dans l’inventaire des plugins OpenClaw | Vous réutilisez des Skills, commandes, hooks ou métadonnées de bundle compatibles |

Les deux formats apparaissent dans `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` et `openclaw plugins disable`. Consultez
[Bundles de plugins](/fr/plugins/bundles) pour la frontière de compatibilité des bundles et
[Construire des plugins](/fr/plugins/building-plugins) pour la création de plugins natifs.

## Hooks de plugin

Les plugins peuvent enregistrer des hooks au runtime, mais il existe deux API différentes avec
des rôles différents.

- Utilisez les hooks typés via `api.on(...)` pour les hooks de cycle de vie du runtime. C’est la
  surface privilégiée pour les middlewares, les politiques, la réécriture de messages, la mise en forme des prompts
  et le contrôle des outils.
- Utilisez `api.registerHook(...)` uniquement lorsque vous voulez participer au système de hooks interne
  décrit dans [Hooks](/fr/automation/hooks). C’est principalement destiné aux effets de bord grossiers
  de commande/cycle de vie et à la compatibilité avec l’automatisation existante de style HOOK.

Règle rapide :

- Si le gestionnaire a besoin d’une priorité, d’une sémantique de fusion ou d’un comportement de blocage/annulation, utilisez
  les hooks de plugin typés.
- Si le gestionnaire réagit simplement à `command:new`, `command:reset`, `message:sent`
  ou à des événements grossiers similaires, `api.registerHook(...)` convient.

Les hooks internes gérés par des plugins apparaissent dans `openclaw hooks list` avec
`plugin:<id>`. Vous ne pouvez pas les activer ni les désactiver via `openclaw hooks` ;
activez ou désactivez plutôt le plugin.

## Vérifier le Gateway actif

`openclaw plugins list` et `openclaw plugins inspect` simple lisent l’état à froid
de la config, du manifeste et du registre. Ils ne prouvent pas qu’un Gateway
déjà en cours d’exécution a importé le même code de Plugin.

Lorsqu’un Plugin semble installé mais que le trafic de discussion en direct ne l’utilise pas :

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Les Gateways gérés redémarrent automatiquement après les changements d’installation,
de mise à jour et de désinstallation de Plugins qui modifient la source du Plugin.
Sur les installations VPS ou en conteneur, assurez-vous que tout redémarrage manuel
cible le véritable processus enfant `openclaw gateway run` qui sert vos canaux,
et pas seulement un wrapper ou un superviseur.

## Dépannage

| Symptôme                                                       | Vérification                                                                                                                              | Correctif                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Le Plugin apparaît dans `plugins list`, mais les hooks runtime ne s’exécutent pas | Utilisez `openclaw plugins inspect <id> --runtime --json` et confirmez le Gateway actif avec `gateway status --deep --require-rpc`         | Redémarrez le Gateway en direct après des changements d’installation, de mise à jour, de config ou de source |
| Des diagnostics de propriété de canal ou d’outil en double apparaissent | Exécutez `openclaw plugins list --enabled --verbose`, inspectez chaque Plugin suspect avec `--runtime --json`, et comparez la propriété des canaux/outils | Désactivez un propriétaire, supprimez les installations obsolètes, ou utilisez le manifeste `preferOver` pour un remplacement intentionnel |
| La config indique qu’un Plugin est manquant                    | Consultez [Inventaire des Plugins](/fr/plugins/plugin-inventory) pour savoir s’il est groupé, externe officiel ou uniquement source           | Installez le package externe, activez le Plugin groupé, ou supprimez la config obsolète                 |
| La config est invalide pendant l’installation                  | Lisez le message de validation et exécutez `openclaw doctor --fix` lorsqu’il pointe vers un état de Plugin obsolète                       | Doctor peut mettre en quarantaine une config de Plugin invalide en désactivant l’entrée et en supprimant le payload invalide |
| Le chemin du Plugin est bloqué pour cause de propriété ou de permissions suspectes | Inspectez le diagnostic avant l’erreur de config                                                                                          | Corrigez la propriété/les permissions du système de fichiers, puis exécutez `openclaw plugins registry --refresh` |
| `OPENCLAW_NIX_MODE=1` bloque les commandes de cycle de vie     | Confirmez que l’installation est gérée par Nix                                                                                            | Modifiez la sélection de Plugins dans la source Nix au lieu d’utiliser les commandes de mutation de Plugins |
| L’importation d’une dépendance échoue au runtime               | Vérifiez si le Plugin a été installé via npm/git/ClawHub ou chargé depuis un chemin local                                                  | Exécutez `openclaw plugins update <id>`, réinstallez la source, ou installez vous-même les dépendances locales du Plugin |

Lorsqu’une config de Plugin obsolète nomme encore un Plugin de canal qui n’est
plus découvrable, le démarrage du Gateway ignore ce canal fourni par Plugin au
lieu de bloquer tous les autres canaux. Exécutez `openclaw doctor --fix` pour
supprimer les entrées de Plugin et de canal obsolètes. Les clés de canal inconnues
sans preuve de Plugin obsolète échouent toujours à la validation afin que les
fautes de frappe restent visibles.

Pour un remplacement intentionnel de canal, le Plugin préféré doit déclarer
`channelConfigs.<channel-id>.preferOver` avec l’id de Plugin hérité ou de priorité
inférieure. Si les deux Plugins sont explicitement activés, OpenClaw conserve
cette demande et signale des diagnostics de canal ou d’outil en double au lieu
de choisir silencieusement un propriétaire.

Si un package installé signale qu’il `requires compiled runtime output for
TypeScript entry ...`, le package a été publié sans les fichiers JavaScript dont
OpenClaw a besoin au runtime. Mettez à jour ou réinstallez après que l’éditeur
a livré le JavaScript compilé, ou désactivez/désinstallez le Plugin jusque-là.

### Propriété bloquée du chemin de Plugin

Si les diagnostics de Plugin indiquent
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
et que la validation de config suit avec `plugin present but blocked`, OpenClaw a
trouvé des fichiers de Plugin appartenant à un utilisateur Unix différent de celui
du processus qui les charge. Gardez la config de Plugin en place ; corrigez la
propriété du système de fichiers ou exécutez OpenClaw avec le même utilisateur que
celui qui possède le répertoire d’état.

Pour les installations Docker, l’image officielle s’exécute en tant que `node`
(uid `1000`), donc les répertoires de config OpenClaw et d’espace de travail
montés depuis l’hôte doivent normalement appartenir à l’uid `1000` :

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si vous exécutez intentionnellement OpenClaw en tant que root, réparez plutôt la
racine de Plugins gérée pour qu’elle appartienne à root :

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Après avoir corrigé la propriété, relancez `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` afin que le registre de Plugins persistant
corresponde aux fichiers réparés.

### Configuration lente des outils de Plugin

Si les tours d’agent semblent se bloquer pendant la préparation des outils,
activez la journalisation de trace et recherchez les lignes de chronométrage des
fabriques d’outils de Plugin :

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Recherchez :

```text
[trace:plugin-tools] factory timings ...
```

Le résumé liste le temps total des fabriques et les fabriques d’outils de Plugin
les plus lentes, y compris l’id du Plugin, les noms d’outils déclarés, la forme
du résultat, et si l’outil est optionnel. Les lignes lentes sont promues en
avertissements lorsqu’une seule fabrique prend au moins 1 s ou que la préparation
totale des fabriques d’outils de Plugin prend au moins 5 s.

OpenClaw met en cache les résultats réussis des fabriques d’outils de Plugin
pour les résolutions répétées avec le même contexte de requête effectif. La clé
de cache inclut la config runtime effective, l’espace de travail, les ids
d’agent/session, la politique de sandbox, les paramètres du navigateur, le
contexte de livraison, l’identité du demandeur et l’état de propriété, de sorte
que les fabriques qui dépendent de ces champs fiables sont réexécutées lorsque
le contexte change. Si les temps restent élevés, le Plugin effectue peut-être un
travail coûteux avant de renvoyer ses définitions d’outils.

Si un Plugin domine le chronométrage, inspectez ses enregistrements runtime :

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Ensuite, mettez à jour, réinstallez ou désactivez ce Plugin. Les auteurs de
Plugins doivent déplacer le chargement coûteux des dépendances derrière le chemin
d’exécution de l’outil au lieu de le faire dans la fabrique d’outils.

Pour les racines de dépendances, la validation des métadonnées de package, les
enregistrements de registre, le comportement de rechargement au démarrage et le
nettoyage hérité, consultez
[Résolution des dépendances de Plugins](/fr/plugins/dependency-resolution).

## Liens associés

- [Gérer les Plugins](/fr/plugins/manage-plugins) - exemples de commandes pour lister, installer, mettre à jour, désinstaller et publier
- [`openclaw plugins`](/fr/cli/plugins) - référence CLI complète
- [Inventaire des Plugins](/fr/plugins/plugin-inventory) - liste générée des Plugins groupés et externes
- [Référence des Plugins](/fr/plugins/reference) - pages de référence générées par Plugin
- [Plugins communautaires](/fr/plugins/community) - découverte ClawHub et politique de PR de docs
- [Résolution des dépendances de Plugins](/fr/plugins/dependency-resolution) - racines d’installation, enregistrements de registre et frontières runtime
- [Créer des Plugins](/fr/plugins/building-plugins) - guide de création de Plugins natifs
- [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview) - enregistrement runtime, hooks et champs d’API
- [Manifeste de Plugin](/fr/plugins/manifest) - métadonnées de manifeste et de package
