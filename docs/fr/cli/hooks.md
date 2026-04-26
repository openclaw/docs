---
read_when:
    - Vous souhaitez gérer les hooks d’agent
    - Vous souhaitez inspecter la disponibilité des hooks ou activer les hooks d’espace de travail
summary: Référence CLI pour `openclaw hooks` (hooks d’agent)
title: Hooks
x-i18n:
    generated_at: "2026-04-26T11:26:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gérer les hooks d’agent (automatisations pilotées par événements pour des commandes comme `/new`, `/reset` et le démarrage de la Gateway).

L’exécution de `openclaw hooks` sans sous-commande équivaut à `openclaw hooks list`.

Liens connexes :

- Hooks : [Hooks](/fr/automation/hooks)
- Hooks de Plugin : [Hooks de Plugin](/fr/plugins/hooks)

## Lister tous les hooks

```bash
openclaw hooks list
```

Lister tous les hooks découverts dans les répertoires workspace, managed, extra et bundled.
Le démarrage de la Gateway ne charge pas les gestionnaires de hooks internes tant qu’au moins un hook interne n’est pas configuré.

**Options :**

- `--eligible` : afficher uniquement les hooks éligibles (exigences satisfaites)
- `--json` : sortie au format JSON
- `-v, --verbose` : afficher des informations détaillées, y compris les exigences manquantes

**Exemple de sortie :**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Exemple (verbose) :**

```bash
openclaw hooks list --verbose
```

Affiche les exigences manquantes pour les hooks non éligibles.

**Exemple (JSON) :**

```bash
openclaw hooks list --json
```

Renvoie un JSON structuré pour une utilisation programmatique.

## Obtenir des informations sur un hook

```bash
openclaw hooks info <name>
```

Afficher des informations détaillées sur un hook spécifique.

**Arguments :**

- `<name>` : nom du hook ou clé du hook (par exemple `session-memory`)

**Options :**

- `--json` : sortie au format JSON

**Exemple :**

```bash
openclaw hooks info session-memory
```

**Sortie :**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Vérifier l’éligibilité des hooks

```bash
openclaw hooks check
```

Afficher un résumé de l’état d’éligibilité des hooks (combien sont prêts par rapport à ceux qui ne le sont pas).

**Options :**

- `--json` : sortie au format JSON

**Exemple de sortie :**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Activer un hook

```bash
openclaw hooks enable <name>
```

Activer un hook spécifique en l’ajoutant à votre configuration (`~/.openclaw/openclaw.json` par défaut).

**Remarque :** les hooks de workspace sont désactivés par défaut tant qu’ils ne sont pas activés ici ou dans la configuration. Les hooks gérés par des plugins affichent `plugin:<id>` dans `openclaw hooks list` et ne peuvent pas être activés/désactivés ici. Activez/désactivez plutôt le plugin.

**Arguments :**

- `<name>` : nom du hook (par exemple `session-memory`)

**Exemple :**

```bash
openclaw hooks enable session-memory
```

**Sortie :**

```
✓ Enabled hook: 💾 session-memory
```

**Ce que cela fait :**

- vérifie si le hook existe et est éligible
- met à jour `hooks.internal.entries.<name>.enabled = true` dans votre configuration
- enregistre la configuration sur le disque

Si le hook provient de `<workspace>/hooks/`, cette étape d’adhésion explicite est requise avant
que la Gateway ne le charge.

**Après l’activation :**

- redémarrez la Gateway pour recharger les hooks (redémarrage de l’application de barre de menus sur macOS, ou redémarrage de votre processus Gateway en développement).

## Désactiver un hook

```bash
openclaw hooks disable <name>
```

Désactiver un hook spécifique en mettant à jour votre configuration.

**Arguments :**

- `<name>` : nom du hook (par exemple `command-logger`)

**Exemple :**

```bash
openclaw hooks disable command-logger
```

**Sortie :**

```
⏸ Disabled hook: 📝 command-logger
```

**Après la désactivation :**

- redémarrez la Gateway pour recharger les hooks

## Remarques

- `openclaw hooks list --json`, `info --json` et `check --json` écrivent directement un JSON structuré sur stdout.
- Les hooks gérés par des plugins ne peuvent pas être activés ou désactivés ici ; activez ou désactivez plutôt le plugin propriétaire.

## Installer des packs de hooks

```bash
openclaw plugins install <package>        # ClawHub d’abord, puis npm
openclaw plugins install <package> --pin  # épingler la version
openclaw plugins install <path>           # chemin local
```

Installer des packs de hooks via l’installateur unifié de plugins.

`openclaw hooks install` fonctionne toujours comme alias de compatibilité, mais affiche un
avertissement de dépréciation et relaie vers `openclaw plugins install`.

Les spécifications npm sont **registry-only** (nom de package + **version exacte** facultative ou
**dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les
installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` pour des raisons de sécurité, même si votre shell a des paramètres globaux d’installation npm.

Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout l’un ou l’autre
vers une préversion, OpenClaw s’arrête et vous demande un consentement explicite avec un
tag de préversion tel que `@beta`/`@rc` ou une version exacte de préversion.

**Ce que cela fait :**

- copie le pack de hooks dans `~/.openclaw/hooks/<id>`
- active les hooks installés dans `hooks.internal.entries.*`
- enregistre l’installation sous `hooks.internal.installs`

**Options :**

- `-l, --link` : lier un répertoire local au lieu de le copier (l’ajoute à `hooks.internal.load.extraDirs`)
- `--pin` : enregistrer les installations npm comme `name@version` résolu exact dans `hooks.internal.installs`

**Archives prises en charge :** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemples :**

```bash
# Répertoire local
openclaw plugins install ./my-hook-pack

# Archive locale
openclaw plugins install ./my-hook-pack.zip

# Package NPM
openclaw plugins install @openclaw/my-hook-pack

# Lier un répertoire local sans le copier
openclaw plugins install -l ./my-hook-pack
```

Les packs de hooks liés sont traités comme des hooks gérés depuis un répertoire
configuré par un opérateur, et non comme des hooks de workspace.

## Mettre à jour des packs de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Mettre à jour les packs de hooks suivis basés sur npm via le programme de mise à jour unifié des plugins.

`openclaw hooks update` fonctionne toujours comme alias de compatibilité, mais affiche un
avertissement de dépréciation et relaie vers `openclaw plugins update`.

**Options :**

- `--all` : mettre à jour tous les packs de hooks suivis
- `--dry-run` : afficher ce qui changerait sans rien écrire

Lorsqu’un hash d’intégrité enregistré existe et que le hash de l’artefact récupéré change,
OpenClaw affiche un avertissement et demande une confirmation avant de continuer. Utilisez
le `--yes` global pour contourner les invites dans les exécutions CI/non interactives.

## Hooks intégrés

### session-memory

Enregistre le contexte de session dans la mémoire lorsque vous lancez `/new` ou `/reset`.

**Activer :**

```bash
openclaw hooks enable session-memory
```

**Sortie :** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Voir :** [documentation session-memory](/fr/automation/hooks#session-memory)

### bootstrap-extra-files

Injecte des fichiers bootstrap supplémentaires (par exemple `AGENTS.md` / `TOOLS.md` locaux à un monorepo) pendant `agent:bootstrap`.

**Activer :**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Voir :** [documentation bootstrap-extra-files](/fr/automation/hooks#bootstrap-extra-files)

### command-logger

Journalise tous les événements de commande dans un fichier d’audit centralisé.

**Activer :**

```bash
openclaw hooks enable command-logger
```

**Sortie :** `~/.openclaw/logs/commands.log`

**Afficher les journaux :**

```bash
# Commandes récentes
tail -n 20 ~/.openclaw/logs/commands.log

# Affichage formaté
cat ~/.openclaw/logs/commands.log | jq .

# Filtrer par action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Voir :** [documentation command-logger](/fr/automation/hooks#command-logger)

### boot-md

Exécute `BOOT.md` au démarrage de la Gateway (après le démarrage des canaux).

**Événements** : `gateway:startup`

**Activer** :

```bash
openclaw hooks enable boot-md
```

**Voir :** [documentation boot-md](/fr/automation/hooks#boot-md)

## Liens connexes

- [Référence CLI](/fr/cli)
- [Hooks d’automatisation](/fr/automation/hooks)
