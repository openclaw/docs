---
read_when:
    - Vous souhaitez supprimer OpenClaw d’une machine
    - Le service Gateway est toujours en cours d’exécution après la désinstallation
summary: Désinstaller complètement OpenClaw (CLI, service, état, espace de travail)
title: Désinstallation
x-i18n:
    generated_at: "2026-07-12T02:46:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Deux méthodes :

- **Méthode simple** si `openclaw` est toujours installé.
- **Suppression manuelle du service** si la CLI n’est plus installée, mais que le service est toujours en cours d’exécution.

## Méthode simple (CLI toujours installée)

Recommandation : utilisez le programme de désinstallation intégré :

```bash
openclaw uninstall
```

La suppression de l’état préserve les répertoires d’espace de travail configurés, sauf si vous sélectionnez également `--workspace`.

Prévisualisez ce qui sera supprimé (sans risque) :

```bash
openclaw uninstall --dry-run --all
```

Mode non interactif (automatisation / npx). Utilisez-le avec prudence et uniquement après avoir vérifié les périmètres :

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Options : `--service`, `--state`, `--workspace` et `--app` sélectionnent des périmètres individuels ; `--all` sélectionne les quatre.

Étapes manuelles (même résultat) :

1. Arrêtez le service Gateway :

```bash
openclaw gateway stop
```

2. Désinstallez le service Gateway (launchd/systemd/schtasks) :

```bash
openclaw gateway uninstall
```

3. Supprimez l’état et la configuration :

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Si vous avez défini `OPENCLAW_CONFIG_PATH` sur un emplacement personnalisé situé hors du répertoire d’état, supprimez également ce fichier.
Si vous souhaitez conserver un espace de travail situé dans le répertoire d’état, tel que `~/.openclaw/workspace`, déplacez-le ailleurs avant d’exécuter `rm -rf` ou supprimez sélectivement le contenu du répertoire d’état.

4. Supprimez votre espace de travail (facultatif, supprime les fichiers de l’agent) :

```bash
rm -rf ~/.openclaw/workspace
```

5. Supprimez l’installation de la CLI (choisissez la commande correspondant à votre installation) :

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Si vous avez installé l’application macOS :

```bash
rm -rf /Applications/OpenClaw.app
```

Remarques :

- Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), répétez l’étape 3 pour chaque répertoire d’état (les valeurs par défaut sont `~/.openclaw-<profile>`).
- En mode distant, le répertoire d’état se trouve sur l’**hôte du Gateway** ; exécutez donc également les étapes 1 à 4 sur cet hôte.

## Suppression manuelle du service (CLI non installée)

Utilisez cette méthode si le service Gateway continue de s’exécuter alors que `openclaw` est absent.

### macOS (launchd)

Le libellé par défaut est `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` avec un profil) :

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Si vous avez utilisé un profil, remplacez le libellé et le nom du fichier plist par `ai.openclaw.<profile>`.

### Linux (unité utilisateur systemd)

Le nom d’unité par défaut est `openclaw-gateway.service` (ou `openclaw-gateway-<profile>.service`). Une unité `clawdbot-gateway.service` antérieure au changement de nom peut encore exister sur les machines mises à niveau depuis de très anciennes installations ; `openclaw uninstall` / `openclaw gateway uninstall` la détecte et la supprime automatiquement.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (tâche planifiée)

Le nom de tâche par défaut est `OpenClaw Gateway` (ou `OpenClaw Gateway (<profile>)`).
La tâche lance un script `gateway.vbs` sans fenêtre dans votre répertoire d’état, qui exécute à son tour
`gateway.cmd` ; supprimez les deux.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Si vous avez utilisé un profil, supprimez la tâche correspondante ainsi que les fichiers `gateway.cmd` /
`gateway.vbs` sous `~\.openclaw-<profile>`.

## Installation normale ou dépôt de code source

### Installation normale (install.sh / npm / pnpm / bun)

Si vous avez utilisé `https://openclaw.ai/install.sh` ou `install.ps1`, la CLI a été installée avec `npm install -g openclaw@latest`.
Supprimez-la avec `npm rm -g openclaw` (ou `pnpm remove -g` / `bun remove -g` si vous l’avez installée de cette manière).

### Dépôt de code source (git clone)

Si vous exécutez OpenClaw depuis un dépôt local (`git clone` + `openclaw ...` / `bun run openclaw ...`) :

1. Désinstallez le service Gateway **avant** de supprimer le dépôt (utilisez la méthode simple ci-dessus ou la suppression manuelle du service).
2. Supprimez le répertoire du dépôt.
3. Supprimez l’état et l’espace de travail comme indiqué ci-dessus.

## Pages connexes

- [Présentation de l’installation](/fr/install)
- [Guide de migration](/fr/install/migrating)
