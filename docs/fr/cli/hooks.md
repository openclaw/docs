---
read_when:
    - Vous souhaitez gérer les points d’accroche d’agent
    - Vous souhaitez vérifier la disponibilité des points d’accroche ou activer les points d’accroche de l’espace de travail
summary: Référence CLI pour `openclaw hooks` (points d’accroche d’agent)
title: Points d’accroche
x-i18n:
    generated_at: "2026-04-30T07:18:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gérer les hooks d’agent (automatisations pilotées par des événements pour des commandes comme `/new`, `/reset` et le démarrage du Gateway).

Exécuter `openclaw hooks` sans sous-commande équivaut à `openclaw hooks list`.

Connexe :

- Hooks : [Hooks](/fr/automation/hooks)
- Hooks de Plugin : [Hooks de Plugin](/fr/plugins/hooks)

## Lister tous les hooks

```bash
openclaw hooks list
```

Liste tous les hooks découverts dans les répertoires workspace, gérés, supplémentaires et intégrés.
Le démarrage du Gateway ne charge pas les gestionnaires de hooks internes tant qu’au moins un hook interne n’est pas configuré.

**Options :**

- `--eligible` : Afficher uniquement les hooks éligibles (exigences satisfaites)
- `--json` : Produire la sortie au format JSON
- `-v, --verbose` : Afficher des informations détaillées, y compris les exigences manquantes

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

Renvoie un JSON structuré pour une utilisation programmatique.

## Obtenir les informations d’un hook

```bash
openclaw hooks info <name>
```

Afficher des informations détaillées sur un hook spécifique.

**Arguments :**

- `<name>` : Nom du hook ou clé du hook (par exemple, `session-memory`)

**Options :**

- `--json` : Produire la sortie au format JSON

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

Afficher un résumé de l’état d’éligibilité des hooks (combien sont prêts ou non prêts).

**Options :**

- `--json` : Produire la sortie au format JSON

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

**Remarque :** Les hooks de workspace sont désactivés par défaut jusqu’à leur activation ici ou dans la configuration. Les hooks gérés par des plugins affichent `plugin:<id>` dans `openclaw hooks list` et ne peuvent pas être activés/désactivés ici. Activez/désactivez plutôt le plugin.

**Arguments :**

- `<name>` : Nom du hook (par exemple, `session-memory`)

**Exemple :**

```bash
openclaw hooks enable session-memory
```

**Sortie :**

```
✓ Enabled hook: 💾 session-memory
```

**Ce que cela fait :**

- Vérifie que le hook existe et est éligible
- Met à jour `hooks.internal.entries.<name>.enabled = true` dans votre configuration
- Enregistre la configuration sur le disque

Si le hook provient de `<workspace>/hooks/`, cette étape d’adhésion est requise avant que le Gateway ne le charge.

**Après l’activation :**

- Redémarrez le gateway afin que les hooks soient rechargés (redémarrage de l’app de barre de menus sur macOS, ou redémarrage de votre processus gateway en développement).

## Désactiver un hook

```bash
openclaw hooks disable <name>
```

Désactiver un hook spécifique en mettant à jour votre configuration.

**Arguments :**

- `<name>` : Nom du hook (par exemple, `command-logger`)

**Exemple :**

```bash
openclaw hooks disable command-logger
```

**Sortie :**

```
⏸ Disabled hook: 📝 command-logger
```

**Après la désactivation :**

- Redémarrez le gateway afin que les hooks soient rechargés

## Notes

- `openclaw hooks list --json`, `info --json` et `check --json` écrivent un JSON structuré directement sur stdout.
- Les hooks gérés par des plugins ne peuvent pas être activés ou désactivés ici ; activez ou désactivez plutôt le plugin propriétaire.

## Installer des packs de hooks

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installer des packs de hooks via l’installateur unifié des plugins.

`openclaw hooks install` fonctionne toujours comme alias de compatibilité, mais affiche un avertissement d’obsolescence et transfère vers `openclaw plugins install`.

Les specs npm sont **uniquement issues du registre** (nom de package + **version exacte** facultative ou **dist-tag**). Les specs Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` pour plus de sécurité, même lorsque votre shell dispose de paramètres globaux d’installation npm.

Les specs nues et `@latest` restent sur la piste stable. Si npm résout l’un ou l’autre vers une préversion, OpenClaw s’arrête et vous demande d’y adhérer explicitement avec un tag de préversion comme `@beta`/`@rc` ou une version de préversion exacte.

**Ce que cela fait :**

- Copie le pack de hooks dans `~/.openclaw/hooks/<id>`
- Active les hooks installés dans `hooks.internal.entries.*`
- Enregistre l’installation sous `hooks.internal.installs`

**Options :**

- `-l, --link` : Lier un répertoire local au lieu de le copier (l’ajoute à `hooks.internal.load.extraDirs`)
- `--pin` : Enregistrer les installations npm sous forme de `name@version` résolu exact dans `hooks.internal.installs`

**Archives prises en charge :** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemples :**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Les packs de hooks liés sont traités comme des hooks gérés provenant d’un répertoire configuré par un opérateur, et non comme des hooks de workspace.

## Mettre à jour les packs de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Mettre à jour les packs de hooks npm suivis via le programme de mise à jour unifié des plugins.

`openclaw hooks update` fonctionne toujours comme alias de compatibilité, mais affiche un avertissement d’obsolescence et transfère vers `openclaw plugins update`.

**Options :**

- `--all` : Mettre à jour tous les packs de hooks suivis
- `--dry-run` : Afficher ce qui changerait sans écrire

Lorsqu’un hachage d’intégrité enregistré existe et que le hachage de l’artéfact récupéré change, OpenClaw affiche un avertissement et demande une confirmation avant de poursuivre. Utilisez le `--yes` global pour contourner les invites dans les exécutions CI/non interactives.

## Hooks intégrés

### session-memory

Enregistre le contexte de session en mémoire lorsque vous émettez `/new` ou `/reset`.

**Activer :**

```bash
openclaw hooks enable session-memory
```

**Sortie :** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Voir :** [documentation de session-memory](/fr/automation/hooks#session-memory)

### bootstrap-extra-files

Injecte des fichiers de bootstrap supplémentaires (par exemple `AGENTS.md` / `TOOLS.md` locaux au monorepo) pendant `agent:bootstrap`.

**Activer :**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Voir :** [documentation de bootstrap-extra-files](/fr/automation/hooks#bootstrap-extra-files)

### command-logger

Journalise tous les événements de commande dans un fichier d’audit centralisé.

**Activer :**

```bash
openclaw hooks enable command-logger
```

**Sortie :** `~/.openclaw/logs/commands.log`

**Afficher les journaux :**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Voir :** [documentation de command-logger](/fr/automation/hooks#command-logger)

### boot-md

Exécute `BOOT.md` lorsque le gateway démarre (après le démarrage des canaux).

**Événements** : `gateway:startup`

**Activer** :

```bash
openclaw hooks enable boot-md
```

**Voir :** [documentation de boot-md](/fr/automation/hooks#boot-md)

## Connexe

- [Référence CLI](/fr/cli)
- [Hooks d’automatisation](/fr/automation/hooks)
