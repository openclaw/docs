---
doc-schema-version: 1
read_when:
    - Vous souhaitez parcourir, installer, activer ou désactiver des plugins dans l’interface de contrôle
    - Vous souhaitez des exemples rapides pour répertorier, installer, mettre à jour, inspecter ou désinstaller des plugins
    - Vous souhaitez choisir une source d’installation de plugin
    - Vous recherchez la référence appropriée pour publier des paquets de plugins
sidebarTitle: Manage plugins
summary: Gérez les plugins OpenClaw depuis l’interface de contrôle ou la CLI
title: Gérer les plugins
x-i18n:
    generated_at: "2026-07-16T13:31:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

L’interface de contrôle couvre le workflow courant de découverte, d’installation, d’activation et de désactivation. La CLI ajoute la mise à jour, la désinstallation, la configuration avancée et des contrôles explicites de la source d’installation. Pour consulter l’intégralité du contrat de commande, des options, des règles de sélection de la source et des cas limites, voir [`openclaw plugins`](/fr/cli/plugins).

Workflow CLI classique : trouvez un paquet, installez-le depuis ClawHub, npm, git ou un chemin local, laissez le Gateway géré redémarrer automatiquement (ou redémarrez-le manuellement), puis vérifiez les enregistrements d’exécution du plugin.

## Utiliser l’interface de contrôle

Ouvrez **Plugins** dans l’interface de contrôle, ou utilisez `/settings/plugins` relativement au chemin de base configuré de l’interface de contrôle. Par exemple, un chemin de base `/openclaw` utilise `/openclaw/settings/plugins`. La page comporte deux onglets :

- **Installés** affiche l’inventaire local complet regroupé par catégorie (canaux, fournisseurs de modèles, mémoire, outils). Chaque ligne ouvre une vue détaillée ; son menu de débordement (`…`) permet d’activer ou de désactiver le plugin et, pour les plugins installés en externe, propose **Supprimer**. L’onglet répertorie également les [serveurs MCP](/fr/cli/mcp) configurés, avec les mêmes actions d’activation, de désactivation et de suppression accessibles par le menu, en modifiant `mcp.servers` dans la configuration du Gateway.
- **Découvrir** correspond à la boutique : plugins en vedette inclus avec OpenClaw, plugins externes officiels et sélection organisée de connecteurs. Les cartes de connecteur ajoutent en un clic un serveur MCP hébergé (GitHub, Notion, Linear, Sentry, Home Assistant) ou ouvrent une recherche ClawHub préremplie. La saisie dans le champ de recherche interroge [ClawHub](https://clawhub.ai/plugins) directement et ajoute une section **Depuis ClawHub** contenant le nombre de téléchargements et des badges de vérification de la source.

Les plugins inclus ne nécessitent pas l’installation d’un paquet. Leur action de menu est **Activer** ou **Désactiver**. Workboard, par exemple, est inclus avec OpenClaw et désactivé par défaut ; choisissez donc **Activer** pour l’activer. Les plugins groupés ne peuvent pas être supprimés, seulement désactivés.

L’accès au catalogue et à la recherche nécessite `operator.read`. L’installation, l’activation, la désactivation, la suppression et les modifications des serveurs MCP nécessitent `operator.admin`. Une installation ClawHub est effectuée par le Gateway et conserve ses vérifications de confiance, d’intégrité et de stratégie d’installation des plugins. Lorsqu’un administrateur active un plugin installé, cette confiance explicite est également enregistrée en ajoutant le plugin sélectionné à une liste restrictive `plugins.allow` existante. Une entrée `plugins.deny` explicite reste prioritaire et doit être supprimée avant d’activer le plugin.

L’installation ou la suppression du code d’un plugin nécessite un redémarrage du Gateway. Les modifications d’activation peuvent être appliquées sans redémarrage lorsque le plugin installé et l’environnement d’exécution actuel du Gateway le permettent ; sinon, l’interface indique qu’un redémarrage est nécessaire. Les connecteurs MCP reposant sur OAuth nécessitent toujours une exécution unique de `openclaw mcp login <name>` depuis la CLI après leur ajout.

L’interface de contrôle ne permet pas d’installer depuis des sources npm, git ou des chemins locaux arbitraires, de mettre à jour les plugins ni d’accéder à une configuration avancée des plugins. Utilisez les workflows CLI ci-dessous pour ces opérations.

## Répertorier et rechercher des plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` pour les scripts :

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` est une vérification d’inventaire à froid : elle indique ce qu’OpenClaw peut découvrir à partir de la configuration, des manifestes et du registre persistant des plugins. Elle ne prouve pas qu’un Gateway déjà en cours d’exécution a importé l’environnement d’exécution du plugin. La sortie JSON inclut les diagnostics du registre et le champ `dependencyStatus` de chaque plugin (indiquant si les éléments `dependencies`/`optionalDependencies` déclarés sont résolus sur le disque).

`plugins search` interroge ClawHub pour rechercher des paquets de plugins installables et affiche une indication d’installation (`openclaw plugins install clawhub:<package>`) pour chaque résultat.

## Activer et désactiver des plugins

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Modifie l’entrée de configuration d’un plugin sans toucher aux fichiers installés. Certains plugins groupés (fournisseurs groupés de modèles ou de synthèse vocale et plugin de navigateur groupé) sont activés par défaut ; les autres nécessitent `enable` après l’installation.

## Installer des plugins

```bash
# Rechercher des paquets de plugins dans ClawHub.
openclaw plugins search "calendar"

# Installer depuis ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Installer depuis npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Installer depuis un artefact local produit par npm pack.
openclaw plugins install npm-pack:<path.tgz>

# Installer depuis git ou une copie de travail de développement locale.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Les spécifications de paquet sans préfixe sont installées depuis npm pendant la transition de lancement, sauf si le nom correspond à l’identifiant d’un plugin groupé ou officiel, auquel cas OpenClaw utilise cette copie locale ou officielle à la place. Utilisez `clawhub:`, `npm:`, `git:` ou `npm-pack:` pour sélectionner la source de manière déterministe. Les paquets groupés et officiels du catalogue OpenClaw sont approuvés au même titre que les paquets ClawHub. Toute nouvelle source arbitraire npm, git, de chemin ou d’archive locale, `npm-pack:` ou de place de marché nécessite `--force` lors des installations non interactives, après examen et approbation de la source.

`--force` confirme une source autre que ClawHub sans demander de confirmation et remplace une cible d’installation existante si nécessaire. Pour les mises à niveau courantes d’une installation npm, ClawHub ou hook-pack suivie, utilisez plutôt `openclaw plugins update`. Avec `--link`, `--force` confirme uniquement la source ; le répertoire lié n’est ni copié ni remplacé.

## Redémarrer et inspecter

Un Gateway géré en cours d’exécution, lorsque le rechargement de la configuration est activé, redémarre automatiquement après l’installation, la mise à jour ou la désinstallation du code d’un plugin. Si le Gateway n’est pas géré ou si le rechargement est désactivé, redémarrez-le vous-même avant de vérifier les surfaces d’exécution actives :

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` charge le module du plugin et prouve qu’il a enregistré des surfaces d’exécution (outils, hooks, services, méthodes du Gateway, routes HTTP et commandes CLI appartenant au plugin). Les commandes simples `inspect` et `list` effectuent uniquement des vérifications à froid du manifeste, de la configuration et du registre.

## Mettre à jour les plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

La transmission de l’identifiant d’un plugin réutilise sa spécification d’installation suivie : les dist-tags enregistrés (`@beta`) et les versions exactes épinglées sont conservés lors des exécutions ultérieures de `update <plugin-id>`.

`openclaw plugins update --all` est le workflow de maintenance en masse. Il respecte toujours les spécifications d’installation suivies ordinaires, mais les enregistrements approuvés de plugins OpenClaw officiels sont synchronisés avec la cible actuelle du catalogue officiel au lieu de rester épinglés à un ancien paquet officiel exact ; lorsque `update.channel` vaut `beta`, cette synchronisation privilégie la branche de versions bêta. Utilisez une commande `update <plugin-id>` ciblée pour conserver sans modification une spécification officielle exacte ou balisée.

Pour les installations npm, transmettez une spécification de paquet explicite afin de modifier l’enregistrement suivi :

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

La deuxième commande replace un plugin sur la branche de versions par défaut du registre lorsqu’il était précédemment épinglé à une version exacte ou à un tag.

Consultez [`openclaw plugins`](/fr/cli/plugins#update) pour connaître précisément les règles de repli et d’épinglage.

## Désinstaller des plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La désinstallation supprime l’entrée de configuration du plugin, l’enregistrement persistant de l’index des plugins, les entrées des listes d’autorisation et de refus, ainsi que les entrées `plugins.load.paths` liées, le cas échéant. Le répertoire d’installation géré est supprimé, sauf si vous transmettez `--keep-files`. Un Gateway géré en cours d’exécution redémarre automatiquement lorsque la désinstallation modifie la source du plugin.

En mode Nix (`OPENCLAW_NIX_MODE=1`), l’installation, la mise à jour, la désinstallation, l’activation et la désactivation des plugins sont toutes désactivées ; gérez plutôt ces choix dans la source Nix de l’installation.

## Choisir une source

| Source      | À utiliser lorsque                                                           | Exemple                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Vous souhaitez bénéficier de la découverte native d’OpenClaw, des résumés d’analyse, des versions et des indications | `openclaw plugins install clawhub:<package>`                   |
| git         | Vous souhaitez utiliser une branche, un tag ou un commit d’un dépôt         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| chemin local | Vous développez ou testez un plugin sur la même machine                     | `openclaw plugins install --link ./my-plugin`                  |
| place de marché | Vous installez un plugin de place de marché compatible avec Claude      | `openclaw plugins install <plugin> --marketplace <source>`     |
| paquet npm  | Vous validez un artefact de paquet local au moyen de la sémantique d’installation npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Vous distribuez déjà des paquets JavaScript ou avez besoin de dist-tags npm ou d’un registre privé | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Les installations gérées depuis un chemin local doivent correspondre à des répertoires ou à des archives de plugins. Placez les fichiers de plugin autonomes dans `plugins.load.paths` au lieu de les installer avec `plugins install`.

## Publier des plugins

ClawHub est la principale surface publique de découverte des plugins OpenClaw. Publiez-y vos plugins lorsque vous souhaitez que les utilisateurs puissent consulter leurs métadonnées, leur historique de versions, les résultats d’analyse du registre et les indications d’installation avant de les installer.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Les plugins npm natifs doivent inclure un manifeste de plugin (`openclaw.plugin.json`) ainsi que les métadonnées `package.json` avant leur publication :

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Utilisez les pages suivantes pour consulter l’intégralité du contrat de publication plutôt que de considérer cette page comme la référence en matière de publication :

- [Publication sur ClawHub](/fr/clawhub/publishing) explique les propriétaires, les portées, les versions, la révision, la validation des paquets et leur transfert.
- [Création de plugins](/fr/plugins/building-plugins) présente la structure complète d’un paquet de plugin (y compris `openclaw.plugin.json`) et le workflow de première publication.
- [Manifeste de plugin](/fr/plugins/manifest) définit les champs du manifeste d’un plugin natif.

Si le même paquet est disponible à la fois sur ClawHub et npm, utilisez le préfixe explicite `clawhub:` ou `npm:` pour imposer une source.

## Pages connexes

- [Plugins](/fr/tools/plugin) - installer, configurer, redémarrer et résoudre les problèmes
- [`openclaw plugins`](/fr/cli/plugins) - référence CLI complète
- [Plugins de la communauté](/fr/plugins/community) - découverte publique et publication sur ClawHub
- [ClawHub](/fr/clawhub/cli) - opérations de la CLI du registre
- [Création de plugins](/fr/plugins/building-plugins) - créer un paquet de plugin
- [Manifeste de plugin](/fr/plugins/manifest) - manifeste et métadonnées du paquet
