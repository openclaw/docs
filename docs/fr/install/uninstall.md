---
read_when:
    - Vous souhaitez supprimer OpenClaw d’une machine
    - Le service Gateway est toujours en cours d’exécution après la désinstallation
summary: Désinstaller complètement OpenClaw (CLI, service, état, espace de travail)
title: Désinstaller
x-i18n:
    generated_at: "2026-06-27T17:40:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Deux chemins :

- **Chemin simple** si `openclaw` est toujours installé.
- **Suppression manuelle du service** si la CLI a disparu mais que le service fonctionne encore.

## Chemin simple (CLI toujours installée)

Recommandé : utilisez le programme de désinstallation intégré :

```bash
openclaw uninstall
```

Lorsque vous utilisez la CLI, la suppression de l’état conserve les répertoires de travail configurés, sauf si vous sélectionnez aussi `--workspace`.

Prévisualiser ce qui sera supprimé (sans danger) :

```bash
openclaw uninstall --dry-run --all
```

Non interactif (automatisation / npx). À utiliser avec prudence et uniquement après confirmation des périmètres :

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Étapes manuelles (même résultat) :

1. Arrêter le service Gateway :

```bash
openclaw gateway stop
```

2. Désinstaller le service Gateway (launchd/systemd/schtasks) :

```bash
openclaw gateway uninstall
```

3. Supprimer l’état + la configuration :

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Si vous avez défini `OPENCLAW_CONFIG_PATH` vers un emplacement personnalisé en dehors du répertoire d’état, supprimez aussi ce fichier.
Si vous voulez conserver un espace de travail dans le répertoire d’état, comme `~/.openclaw/workspace`, déplacez-le avant d’exécuter `rm -rf` ou supprimez sélectivement le contenu de l’état.

4. Supprimer votre espace de travail (facultatif, supprime les fichiers d’agent) :

```bash
rm -rf ~/.openclaw/workspace
```

5. Supprimer l’installation de la CLI (choisissez celle que vous avez utilisée) :

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Si vous avez installé l’app macOS :

```bash
rm -rf /Applications/OpenClaw.app
```

Notes :

- Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), répétez l’étape 3 pour chaque répertoire d’état (les valeurs par défaut sont `~/.openclaw-<profile>`).
- En mode distant, le répertoire d’état se trouve sur l’**hôte Gateway** ; exécutez donc aussi les étapes 1 à 4 à cet endroit.

## Suppression manuelle du service (CLI non installée)

Utilisez ceci si le service Gateway continue de fonctionner mais que `openclaw` est manquant.

### macOS (launchd)

Le libellé par défaut est `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; l’ancien `com.openclaw.*` peut encore exister) :

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Si vous avez utilisé un profil, remplacez le libellé et le nom du plist par `ai.openclaw.<profile>`. Supprimez tous les plists hérités `com.openclaw.*` s’ils sont présents.

### Linux (unité utilisateur systemd)

Le nom d’unité par défaut est `openclaw-gateway.service` (ou `openclaw-gateway-<profile>.service`) :

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (tâche planifiée)

Le nom de tâche par défaut est `OpenClaw Gateway` (ou `OpenClaw Gateway (<profile>)`).
Le script de tâche se trouve sous votre répertoire d’état sous le nom `gateway.cmd` ; les installations actuelles peuvent
aussi créer un lanceur sans fenêtre `gateway.vbs` que le Planificateur de tâches exécute à la place
de l’ouverture directe de `gateway.cmd`.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Si vous avez utilisé un profil, supprimez le nom de tâche correspondant et les fichiers `gateway.cmd` /
`gateway.vbs` sous `~\.openclaw-<profile>`.

## Installation normale vs copie de travail source

### Installation normale (install.sh / npm / pnpm / bun)

Si vous avez utilisé `https://openclaw.ai/install.sh` ou `install.ps1`, la CLI a été installée avec `npm install -g openclaw@latest`.
Supprimez-la avec `npm rm -g openclaw` (ou `pnpm remove -g` / `bun remove -g` si vous l’avez installée de cette façon).

### Copie de travail source (git clone)

Si vous exécutez depuis une copie de travail du dépôt (`git clone` + `openclaw ...` / `bun run openclaw ...`) :

1. Désinstallez le service Gateway **avant** de supprimer le dépôt (utilisez le chemin simple ci-dessus ou la suppression manuelle du service).
2. Supprimez le répertoire du dépôt.
3. Supprimez l’état + l’espace de travail comme indiqué ci-dessus.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Guide de migration](/fr/install/migrating)
