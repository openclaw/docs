---
doc-schema-version: 1
read_when:
    - Vous voulez des exemples rapides pour lister, installer, mettre à jour, inspecter ou désinstaller des plugins
    - Vous souhaitez choisir une source d’installation de plugin
    - Vous voulez la bonne référence pour publier des packages de Plugin
sidebarTitle: Manage plugins
summary: Exemples rapides pour lister, installer, mettre à jour, inspecter et désinstaller les plugins OpenClaw
title: Gérer les plugins
x-i18n:
    generated_at: "2026-06-27T17:49:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Utilisez cette page pour les commandes courantes de gestion des plugins. Pour le
contrat de commande exhaustif, les options, les règles de sélection de source et
les cas limites, consultez [`openclaw plugins`](/fr/cli/plugins).

La plupart des flux d’installation consistent à :

1. trouver un paquet
2. l’installer depuis ClawHub, npm, git ou un chemin local
3. laisser le Gateway géré redémarrer automatiquement, ou le redémarrer manuellement lorsqu’il n’est pas géré
4. vérifier les enregistrements d’exécution du plugin

## Lister et rechercher des plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Utilisez `--json` pour les scripts :

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` est une vérification d’inventaire à froid. Elle affiche ce
qu’OpenClaw peut découvrir depuis la configuration, les manifestes et le registre
des plugins ; elle ne prouve pas qu’un Gateway déjà en cours d’exécution a importé
l’exécution du plugin. La sortie JSON inclut les diagnostics du registre et le
`dependencyStatus` statique de chaque plugin lorsque le paquet du plugin déclare
des `dependencies` ou des `optionalDependencies`.

`plugins search` interroge ClawHub pour trouver des paquets de plugins
installables et affiche des indications d’installation comme
`openclaw plugins install clawhub:<package>`.

## Installer des plugins

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Les spécifications de paquet nues s’installent depuis npm pendant la transition
de lancement. Utilisez `clawhub:`, `npm:`, `git:` ou `npm-pack:` lorsque vous
avez besoin d’une sélection de source déterministe. Si le nom nu correspond à un
identifiant de plugin officiel, OpenClaw peut installer directement l’entrée du
catalogue.

Utilisez `--force` uniquement lorsque vous voulez intentionnellement écraser une
cible d’installation existante. Pour les mises à niveau courantes
d’installations suivies depuis npm, ClawHub ou hook-pack, utilisez
`openclaw plugins update`.

## Redémarrer et inspecter

Après l’installation, la mise à jour ou la désinstallation du code d’un plugin,
un Gateway géré en cours d’exécution avec le rechargement de configuration activé
redémarre automatiquement. Si le Gateway n’est pas géré ou si le rechargement est
désactivé, redémarrez-le vous-même avant de vérifier les surfaces d’exécution en
direct :

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Utilisez `inspect --runtime` lorsque vous avez besoin de prouver que le plugin a
enregistré des surfaces d’exécution comme des outils, hooks, services, méthodes
Gateway, routes HTTP ou commandes CLI appartenant au plugin. `inspect` et `list`
simples sont des vérifications à froid de manifeste, de configuration et de
registre.

## Mettre à jour des plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Lorsque vous passez un identifiant de plugin, OpenClaw réutilise la
spécification d’installation suivie. Les dist-tags stockés comme `@beta` et les
versions épinglées exactes continuent à être utilisés lors des exécutions
ultérieures de `update <plugin-id>`.

`openclaw plugins update --all` est le chemin de maintenance en masse. Il
respecte toujours les spécifications d’installation suivies ordinaires, mais les
enregistrements de plugins OpenClaw officiels de confiance peuvent se synchroniser
sur la cible actuelle du catalogue officiel au lieu de rester sur un paquet
officiel exact obsolète. Si `update.channel` est défini sur `beta`, cette
synchronisation officielle en masse utilise le contexte du canal bêta. Utilisez
un `update <plugin-id>` ciblé lorsque vous voulez intentionnellement conserver
inchangée une spécification officielle exacte ou étiquetée.

Pour les installations npm, vous pouvez passer une spécification de paquet
explicite afin de modifier l’enregistrement suivi :

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

La deuxième commande ramène un plugin vers la ligne de publication par défaut du
registre lorsqu’il était auparavant épinglé à une version exacte ou à une
étiquette.

Lorsque `openclaw update` s’exécute sur le canal bêta, les enregistrements de
plugins peuvent privilégier les versions `@beta` correspondantes. Pour les règles
exactes de repli et d’épinglage, consultez
[`openclaw plugins`](/fr/cli/plugins#update).

## Désinstaller des plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

La désinstallation supprime l’entrée de configuration du plugin, l’enregistrement
persisté d’index du plugin, les entrées de listes d’autorisation/refus et les
chemins de chargement liés le cas échéant. Les répertoires d’installation gérés
sont supprimés sauf si vous passez `--keep-files`. Un Gateway géré en cours
d’exécution redémarre automatiquement lorsque la désinstallation modifie la source
du plugin.

En mode Nix (`OPENCLAW_NIX_MODE=1`), les commandes d’installation, de mise à
jour, de désinstallation, d’activation et de désactivation des plugins sont
désactivées. Gérez plutôt ces choix dans la source Nix de l’installation.

## Choisir une source

| Source      | À utiliser quand                                                           | Exemple                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Vous voulez une découverte native OpenClaw, des résumés d’analyse, des versions et des indications | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Vous publiez déjà des paquets JavaScript ou avez besoin de dist-tags npm/d’un registre privé | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Vous voulez une branche, une étiquette ou un commit depuis un dépôt         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| chemin local | Vous développez ou testez un plugin sur la même machine                    | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Vous validez un artefact de paquet local via la sémantique d’installation npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Vous installez un plugin de marketplace compatible avec Claude             | `openclaw plugins install <plugin> --marketplace <source>`     |

Les installations gérées depuis un chemin local doivent être des répertoires ou
archives de plugin. Placez les fichiers de plugin autonomes dans
`plugins.load.paths` au lieu de les installer avec `plugins install`.

## Publier des plugins

ClawHub est la principale surface de découverte publique pour les plugins
OpenClaw. Publiez-y lorsque vous voulez que les utilisateurs trouvent les
métadonnées du plugin, l’historique des versions, les résultats d’analyse du
registre et les indications d’installation avant d’installer.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Les plugins npm natifs doivent inclure un manifeste de plugin et des métadonnées
de paquet avant publication :

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

Utilisez ces pages pour le contrat de publication complet au lieu de considérer
cette page comme la référence de publication :

- [Publication ClawHub](/fr/clawhub/publishing) explique les propriétaires, portées, versions,
  revues, validations de paquet et transferts de paquet.
- [Créer des plugins](/fr/plugins/building-plugins) montre la forme du paquet de plugin
  et le premier flux de publication.
- [Manifeste de plugin](/fr/plugins/manifest) définit les champs du manifeste de plugin natif.

Si le même paquet est disponible à la fois sur ClawHub et npm, utilisez le
préfixe explicite `clawhub:` ou `npm:` lorsque vous devez forcer une source.

## Connexe

- [Plugins](/fr/tools/plugin) - installer, configurer, redémarrer et dépanner
- [`openclaw plugins`](/fr/cli/plugins) - référence CLI complète
- [Plugins communautaires](/fr/plugins/community) - découverte publique et publication ClawHub
- [ClawHub](/fr/clawhub/cli) - opérations CLI du registre
- [Créer des plugins](/fr/plugins/building-plugins) - créer un paquet de plugin
- [Manifeste de plugin](/fr/plugins/manifest) - manifeste et métadonnées de paquet
