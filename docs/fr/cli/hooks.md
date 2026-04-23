---
read_when:
    - Vous voulez gérer les hooks d’agent
    - Vous voulez inspecter la disponibilité des hooks ou activer les hooks de l’espace de travail
summary: Référence CLI pour `openclaw hooks` (hooks d’agent)
title: hooks
x-i18n:
    generated_at: "2026-04-23T07:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gérez les hooks d’agent (automatisations pilotées par événements pour des commandes comme `/new`, `/reset` et le démarrage de la Gateway).

Exécuter `openclaw hooks` sans sous-commande équivaut à `openclaw hooks list`.

Liens associés :

- Hooks : [Hooks](/fr/automation/hooks)
- Hooks de Plugin : [Plugin hooks](/fr/plugins/architecture#provider-runtime-hooks)

## Lister tous les hooks

```bash
openclaw hooks list
```

Liste tous les hooks découverts à partir des répertoires workspace, managed, extra et intégrés.
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

**Exemple (verbeux) :**

```bash
openclaw hooks list --verbose
```

Affiche les exigences manquantes pour les hooks non éligibles.

**Exemple (JSON) :**

```bash
openclaw hooks list --json
```

Renvoie un JSON structuré pour un usage programmatique.

## Obtenir des informations sur un hook

```bash
openclaw hooks info <name>
```

Affiche des informations détaillées sur un hook spécifique.

**Arguments :**

- `<name>` : nom du hook ou clé du hook (par exemple, `session-memory`)

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

Affiche un résumé de l’état d’éligibilité des hooks (combien sont prêts et combien ne le sont pas).

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

Active un hook spécifique en l’ajoutant à votre configuration (par défaut `~/.openclaw/openclaw.json`).

**Remarque :** Les hooks d’espace de travail sont désactivés par défaut jusqu’à leur activation ici ou dans la configuration. Les hooks gérés par des plugins affichent `plugin:<id>` dans `openclaw hooks list` et ne peuvent pas être activés/désactivés ici. Activez/désactivez plutôt le plugin.

**Arguments :**

- `<name>` : nom du hook (par exemple, `session-memory`)

**Exemple :**

```bash
openclaw hooks enable session-memory
```

**Sortie :**

```
✓ Enabled hook: 💾 session-memory
```

**Ce que cela fait :**

- Vérifie si le hook existe et est éligible
- Met à jour `hooks.internal.entries.<name>.enabled = true` dans votre configuration
- Enregistre la configuration sur le disque

Si le hook provient de `<workspace>/hooks/`, cette étape d’activation explicite est requise avant
que la Gateway ne le charge.

**Après activation :**

- Redémarrez la Gateway pour recharger les hooks (redémarrage de l’app de barre de menus sur macOS, ou redémarrage de votre processus Gateway en développement).

## Désactiver un hook

```bash
openclaw hooks disable <name>
```

Désactive un hook spécifique en mettant à jour votre configuration.

**Arguments :**

- `<name>` : nom du hook (par exemple, `command-logger`)

**Exemple :**

```bash
openclaw hooks disable command-logger
```

**Sortie :**

```
⏸ Disabled hook: 📝 command-logger
```

**Après désactivation :**

- Redémarrez la Gateway pour recharger les hooks

## Remarques

- `openclaw hooks list --json`, `info --json` et `check --json` écrivent un JSON structuré directement sur stdout.
- Les hooks gérés par des plugins ne peuvent pas être activés ou désactivés ici ; activez ou désactivez plutôt le plugin propriétaire.

## Installer des packs de hooks

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installez des packs de hooks via l’installateur unifié de plugins.

`openclaw hooks install` fonctionne encore comme alias de compatibilité, mais il affiche un
avertissement de dépréciation et transfère vers `openclaw plugins install`.

Les spécifications npm sont **limitées au registre** (nom de package + **version exacte** facultative ou
**dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations
de dépendances s’exécutent avec `--ignore-scripts` pour des raisons de sécurité.

Les spécifications nues et `@latest` restent sur la piste stable. Si npm résout l’un ou l’autre
vers une préversion, OpenClaw s’arrête et vous demande un consentement explicite avec un
tag de préversion tel que `@beta`/`@rc` ou une version exacte de préversion.

**Ce que cela fait :**

- Copie le pack de hooks dans `~/.openclaw/hooks/<id>`
- Active les hooks installés dans `hooks.internal.entries.*`
- Enregistre l’installation sous `hooks.internal.installs`

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
configuré par l’opérateur, et non comme des hooks d’espace de travail.

## Mettre à jour des packs de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Mettez à jour les packs de hooks suivis basés sur npm via le programme unifié de mise à jour des plugins.

`openclaw hooks update` fonctionne encore comme alias de compatibilité, mais il affiche un
avertissement de dépréciation et transfère vers `openclaw plugins update`.

**Options :**

- `--all` : mettre à jour tous les packs de hooks suivis
- `--dry-run` : afficher ce qui changerait sans écrire

Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change,
OpenClaw affiche un avertissement et demande confirmation avant de continuer. Utilisez
le `--yes` global pour contourner les prompts dans les exécutions CI/non interactives.

## Hooks intégrés

### session-memory

Enregistre le contexte de session en mémoire lorsque vous exécutez `/new` ou `/reset`.

**Activer :**

```bash
openclaw hooks enable session-memory
```

**Sortie :** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Voir :** [documentation session-memory](/fr/automation/hooks#session-memory)

### bootstrap-extra-files

Injecte des fichiers de bootstrap supplémentaires (par exemple `AGENTS.md` / `TOOLS.md` locaux à un monorepo) pendant `agent:bootstrap`.

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

Exécute `BOOT.md` lorsque la Gateway démarre (après le démarrage des canaux).

**Événements** : `gateway:startup`

**Activer** :

```bash
openclaw hooks enable boot-md
```

**Voir :** [documentation boot-md](/fr/automation/hooks#boot-md)
