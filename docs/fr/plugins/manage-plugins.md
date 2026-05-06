---
read_when:
    - Vous voulez des exemples rapides pour installer, lister, mettre à jour ou désinstaller des Plugins
    - Vous voulez choisir entre ClawHub et la distribution de Plugins via npm
    - Vous publiez un paquet de Plugin
sidebarTitle: Manage plugins
summary: Exemples rapides pour installer, lister, désinstaller, mettre à jour et publier des plugins OpenClaw
title: Gérer les plugins
x-i18n:
    generated_at: "2026-05-06T17:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

La plupart des workflows de plugins se résument à quelques commandes : rechercher, installer, redémarrer le Gateway,
vérifier, puis désinstaller le plugin lorsque vous n’en avez plus besoin.

## Lister les plugins

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Utilisez `--json` pour les scripts. Il inclut les diagnostics du registre et le
`dependencyStatus` statique de chaque plugin lorsque le package du plugin déclare
`dependencies` ou `optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` est une vérification d’inventaire à froid. Elle montre ce
qu’OpenClaw peut découvrir à partir de la configuration, des manifestes et du
registre de plugins ; elle ne prouve pas qu’un processus Gateway déjà en cours
d’exécution a importé le runtime du plugin.

## Installer des plugins

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Après avoir installé le code du plugin, redémarrez le Gateway qui sert vos canaux :

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Utilisez `inspect --runtime` lorsque vous avez besoin de prouver que le plugin a
enregistré des surfaces de runtime telles que des outils, hooks, services,
méthodes Gateway ou commandes CLI appartenant au plugin.

## Mettre à jour des plugins

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Si un plugin a été installé depuis un dist-tag npm tel que `@beta`, les appels
ultérieurs à `update <plugin-id>` réutilisent cette balise enregistrée. Passer
une spec npm explicite fait basculer l’installation suivie vers cette spec pour
les futures mises à jour.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

La deuxième commande ramène un plugin à la ligne de publication par défaut du
registre lorsqu’il était auparavant épinglé à une version exacte ou à une balise.

Lorsque `openclaw update` s’exécute sur le canal bêta, les enregistrements de
plugins npm et ClawHub de ligne par défaut essaient d’abord la publication de
plugin `@beta` correspondante. Si cette publication bêta n’existe pas, OpenClaw
revient à la spec par défaut/dernière enregistrée. Pour les plugins npm,
OpenClaw revient aussi en arrière lorsque le package bêta existe mais échoue à la
validation d’installation. Les versions exactes et les balises explicites comme
`@rc` ou `@beta` sont conservées.

## Désinstaller des plugins

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

La désinstallation supprime l’entrée de configuration du plugin,
l’enregistrement d’index du plugin, les entrées de liste d’autorisation/de refus
et les chemins de chargement liés le cas échéant. Les répertoires d’installation
gérés sont supprimés sauf si vous passez `--keep-files`.

En mode Nix (`OPENCLAW_NIX_MODE=1`), les commandes d’installation, de mise à
jour, de désinstallation, d’activation et de désactivation de plugins sont
désactivées. Gérez plutôt ces choix dans la source Nix de l’installation ; pour
nix-openclaw, utilisez le
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) centré sur
l’agent.

## Publier des plugins

Vous pouvez publier des plugins externes sur [ClawHub](https://clawhub.ai),
npmjs.com, ou les deux.

### Publier sur ClawHub

ClawHub est la principale surface publique de découverte des plugins OpenClaw. Il
fournit aux utilisateurs des métadonnées consultables, l’historique des versions
et les résultats d’analyse du registre avant l’installation.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Les utilisateurs installent depuis ClawHub avec :

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

La forme simple vérifie toujours ClawHub en premier.

### Publier sur npmjs.com

Les plugins npm natifs doivent inclure un manifeste de plugin et des métadonnées
de point d’entrée OpenClaw dans `package.json`.

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
```

Les utilisateurs installent uniquement depuis npm avec :

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Si le même package est aussi disponible sur ClawHub, `npm:` ignore la recherche
ClawHub et force la résolution npm.

## Choix de la source

- **ClawHub** : à utiliser lorsque vous voulez une découverte native OpenClaw,
  des résumés d’analyse, des versions et des indications d’installation.
- **npmjs.com** : à utiliser lorsque vous publiez déjà des packages JavaScript ou
  avez besoin de workflows npm avec dist-tags/registre privé.
- **Git** : à utiliser lorsque vous voulez installer directement depuis une
  branche, une balise ou un commit.
- **Chemin local** : à utiliser lorsque vous développez ou testez un plugin sur
  la même machine.

## Connexe

- [Plugins](/fr/tools/plugin) - vue d’ensemble et dépannage
- [`openclaw plugins`](/fr/cli/plugins) - référence CLI complète
- [ClawHub](/fr/tools/clawhub) - publication et opérations de registre
- [Créer des plugins](/fr/plugins/building-plugins) - créer un package de plugin
- [Manifeste de plugin](/fr/plugins/manifest) - manifeste et métadonnées de package
