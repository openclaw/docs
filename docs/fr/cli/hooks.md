---
read_when:
    - Vous souhaitez gérer les points d’accroche d’agent
    - Vous souhaitez vérifier la disponibilité des hooks ou activer les hooks d’espace de travail
summary: Référence CLI pour `openclaw hooks` (points d’accroche d’agent)
title: Points d’accroche
x-i18n:
    generated_at: "2026-05-05T08:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gérer les points d’accroche d’agent (automatisations déclenchées par des événements pour des commandes comme `/new`, `/reset` et le démarrage du Gateway).

Exécuter `openclaw hooks` sans sous-commande équivaut à `openclaw hooks list`.

Liés :

- Points d’accroche : [Points d’accroche](/fr/automation/hooks)
- Points d’accroche de Plugin : [Points d’accroche de Plugin](/fr/plugins/hooks)

## Lister tous les points d’accroche

```bash
openclaw hooks list
```

Liste tous les points d’accroche découverts dans les répertoires de l’espace de travail, gérés, supplémentaires et intégrés.
Le démarrage du Gateway ne charge pas les gestionnaires de points d’accroche internes tant qu’au moins un point d’accroche interne n’est pas configuré.

**Options :**

- `--eligible` : Afficher uniquement les points d’accroche éligibles (exigences satisfaites)
- `--json` : Produire une sortie au format JSON
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

**Exemple (détaillé) :**

```bash
openclaw hooks list --verbose
```

Affiche les exigences manquantes pour les points d’accroche non éligibles.

**Exemple (JSON) :**

```bash
openclaw hooks list --json
```

Renvoie un JSON structuré pour une utilisation programmatique.

## Obtenir des informations sur un point d’accroche

```bash
openclaw hooks info <name>
```

Afficher des informations détaillées sur un point d’accroche spécifique.

**Arguments :**

- `<name>` : Nom du point d’accroche ou clé du point d’accroche (par exemple, `session-memory`)

**Options :**

- `--json` : Produire une sortie au format JSON

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

## Vérifier l’éligibilité des points d’accroche

```bash
openclaw hooks check
```

Afficher un résumé de l’état d’éligibilité des points d’accroche (combien sont prêts et combien ne le sont pas).

**Options :**

- `--json` : Produire une sortie au format JSON

**Exemple de sortie :**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Activer un point d’accroche

```bash
openclaw hooks enable <name>
```

Activer un point d’accroche spécifique en l’ajoutant à votre configuration (`~/.openclaw/openclaw.json` par défaut).

**Remarque :** Les points d’accroche d’espace de travail sont désactivés par défaut jusqu’à leur activation ici ou dans la configuration. Les points d’accroche gérés par des Plugins affichent `plugin:<id>` dans `openclaw hooks list` et ne peuvent pas être activés/désactivés ici. Activez/désactivez plutôt le Plugin.

**Arguments :**

- `<name>` : Nom du point d’accroche (par exemple, `session-memory`)

**Exemple :**

```bash
openclaw hooks enable session-memory
```

**Sortie :**

```
✓ Enabled hook: 💾 session-memory
```

**Ce que cela fait :**

- Vérifie si le point d’accroche existe et est éligible
- Met à jour `hooks.internal.entries.<name>.enabled = true` dans votre configuration
- Enregistre la configuration sur le disque

Si le point d’accroche provient de `<workspace>/hooks/`, cette étape d’adhésion est requise avant que le Gateway ne le charge.

**Après l’activation :**

- Redémarrez le Gateway afin que les points d’accroche soient rechargés (redémarrage de l’application de barre de menus sur macOS, ou redémarrage de votre processus Gateway en développement).

## Désactiver un point d’accroche

```bash
openclaw hooks disable <name>
```

Désactiver un point d’accroche spécifique en mettant à jour votre configuration.

**Arguments :**

- `<name>` : Nom du point d’accroche (par exemple, `command-logger`)

**Exemple :**

```bash
openclaw hooks disable command-logger
```

**Sortie :**

```
⏸ Disabled hook: 📝 command-logger
```

**Après la désactivation :**

- Redémarrez le Gateway afin que les points d’accroche soient rechargés

## Notes

- `openclaw hooks list --json`, `info --json` et `check --json` écrivent un JSON structuré directement dans stdout.
- Les points d’accroche gérés par des Plugins ne peuvent pas être activés ni désactivés ici ; activez ou désactivez plutôt le Plugin propriétaire.

## Installer des packs de points d’accroche

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installer des packs de points d’accroche via l’installateur unifié de Plugins.

`openclaw hooks install` fonctionne toujours comme alias de compatibilité, mais affiche un avertissement d’obsolescence et transfère vers `openclaw plugins install`.

Les spécifications npm sont **limitées au registre** (nom de paquet + **version exacte** facultative ou **dist-tag**). Les spécifications Git/URL/fichier et les plages semver sont rejetées. Les installations de dépendances s’exécutent localement au projet avec `--ignore-scripts` par sécurité, même lorsque votre shell possède des paramètres d’installation npm globaux.

Les spécifications nues et `@latest` restent sur le canal stable. Si npm résout l’un ou l’autre vers une préversion, OpenClaw s’arrête et vous demande d’accepter explicitement avec une balise de préversion telle que `@beta`/`@rc` ou une version de préversion exacte.

**Ce que cela fait :**

- Copie le pack de points d’accroche dans `~/.openclaw/hooks/<id>`
- Active les points d’accroche installés dans `hooks.internal.entries.*`
- Enregistre l’installation sous `hooks.internal.installs`

**Options :**

- `-l, --link` : Lier un répertoire local au lieu de le copier (l’ajoute à `hooks.internal.load.extraDirs`)
- `--pin` : Enregistrer les installations npm comme `name@version` résolu exact dans `hooks.internal.installs`

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

Les packs de points d’accroche liés sont traités comme des points d’accroche gérés provenant d’un répertoire configuré par l’opérateur, et non comme des points d’accroche d’espace de travail.

## Mettre à jour des packs de points d’accroche

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Mettre à jour les packs de points d’accroche basés sur npm et suivis via le programme de mise à jour unifié de Plugins.

`openclaw hooks update` fonctionne toujours comme alias de compatibilité, mais affiche un avertissement d’obsolescence et transfère vers `openclaw plugins update`.

**Options :**

- `--all` : Mettre à jour tous les packs de points d’accroche suivis
- `--dry-run` : Afficher ce qui changerait sans écrire

Lorsqu’un hachage d’intégrité stocké existe et que le hachage de l’artefact récupéré change, OpenClaw affiche un avertissement et demande confirmation avant de continuer. Utilisez l’option globale `--yes` pour contourner les invites en CI/exécutions non interactives.

## Points d’accroche intégrés

### session-memory

Enregistre le contexte de session en mémoire lorsque vous émettez `/new` ou `/reset`.

**Activer :**

```bash
openclaw hooks enable session-memory
```

**Sortie :** `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md` par défaut. Définissez `hooks.internal.entries.session-memory.llmSlug: true` pour des slugs de noms de fichiers générés par modèle.

**Voir :** [documentation de session-memory](/fr/automation/hooks#session-memory)

### bootstrap-extra-files

Injecte des fichiers d’amorçage supplémentaires (par exemple `AGENTS.md` / `TOOLS.md` locaux au monorepo) pendant `agent:bootstrap`.

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

Exécute `BOOT.md` lorsque le Gateway démarre (après le démarrage des canaux).

**Événements** : `gateway:startup`

**Activer** :

```bash
openclaw hooks enable boot-md
```

**Voir :** [documentation de boot-md](/fr/automation/hooks#boot-md)

## Liés

- [Référence CLI](/fr/cli)
- [Points d’accroche d’automatisation](/fr/automation/hooks)
