---
read_when:
    - Sie möchten OpenClaw von einem Computer entfernen
    - Der Gateway-Dienst wird nach der Deinstallation weiterhin ausgeführt
summary: OpenClaw vollständig deinstallieren (CLI, Dienst, Status, Arbeitsbereich)
title: Deinstallieren
x-i18n:
    generated_at: "2026-07-24T03:56:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Zwei Wege:

- **Einfacher Weg**, wenn `openclaw` noch installiert ist.
- **Manuelles Entfernen des Dienstes**, wenn die CLI nicht mehr vorhanden ist, der Dienst aber weiterhin ausgeführt wird.

## Einfacher Weg (CLI noch installiert)

Empfohlen: Verwenden Sie das integrierte Deinstallationsprogramm:

```bash
openclaw uninstall
```

Beim Entfernen des Zustands bleiben konfigurierte Workspace-Verzeichnisse erhalten, sofern Sie nicht zusätzlich `--workspace` auswählen.

Vorschau der zu entfernenden Elemente (sicher):

```bash
openclaw uninstall --dry-run --all
```

Nicht interaktiv (Automatisierung / npx). Verwenden Sie dies mit Vorsicht und erst, nachdem Sie die Bereiche bestätigt haben:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Flags: `--service`, `--state`, `--workspace`, `--app` wählen einzelne Bereiche aus; `--all` wählt alle vier aus.

Manuelle Schritte (gleiches Ergebnis):

1. Beenden Sie den Gateway-Dienst:

```bash
openclaw gateway stop
```

2. Deinstallieren Sie den Gateway-Dienst (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Löschen Sie Zustand und Konfiguration:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Wenn Sie `OPENCLAW_CONFIG_PATH` auf einen benutzerdefinierten Speicherort außerhalb des Zustandsverzeichnisses festgelegt haben, löschen Sie auch diese Datei.
Wenn Sie einen Workspace innerhalb des Zustandsverzeichnisses behalten möchten, beispielsweise `~/.openclaw/workspace`, verschieben Sie ihn vor der Ausführung von `rm -rf` an einen anderen Ort oder löschen Sie die Inhalte des Zustandsverzeichnisses selektiv.

4. Löschen Sie Ihren Workspace (optional, entfernt Agentendateien):

```bash
rm -rf ~/.openclaw/workspace
```

5. Entfernen Sie die CLI-Installation (wählen Sie die von Ihnen verwendete Variante):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Wenn Sie die macOS-App installiert haben:

```bash
rm -rf /Applications/OpenClaw.app
```

Hinweise:

- Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), wiederholen Sie Schritt 3 für jedes Zustandsverzeichnis (Standardwerte sind `~/.openclaw-<profile>`).
- Im Remote-Modus befindet sich das Zustandsverzeichnis auf dem **Gateway-Host**; führen Sie daher auch dort die Schritte 1–4 aus.

## Manuelles Entfernen des Dienstes (CLI nicht installiert)

Verwenden Sie diese Vorgehensweise, wenn der Gateway-Dienst weiterhin ausgeführt wird, aber `openclaw` fehlt.

### macOS (launchd)

Die Standardbezeichnung lautet `ai.openclaw.gateway` (oder `ai.openclaw.<profile>` mit einem Profil):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Wenn Sie ein Profil verwendet haben, ersetzen Sie die Bezeichnung und den plist-Namen durch `ai.openclaw.<profile>`.

### Linux (systemd-Benutzereinheit)

Der Standardeinheitenname lautet `openclaw-gateway.service` (oder `openclaw-gateway-<profile>.service`). Eine vor der Umbenennung verwendete Einheit `clawdbot-gateway.service` kann auf Computern, die von sehr alten Installationen aktualisiert wurden, noch vorhanden sein; `openclaw uninstall` / `openclaw gateway uninstall` erkennt und entfernt sie automatisch.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Geplante Aufgabe)

Der Standardname der Aufgabe lautet `OpenClaw Gateway` (oder `OpenClaw Gateway (<profile>)`).
Die Aufgabe startet ein fensterloses `gateway.vbs`-Skript in Ihrem Zustandsverzeichnis, das wiederum
`gateway.cmd` ausführt; entfernen Sie beide.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Wenn Sie ein Profil verwendet haben, löschen Sie den entsprechenden Aufgabennamen und die Dateien `gateway.cmd` /
`gateway.vbs` unter `~\.openclaw-<profile>`.

## Normale Installation im Vergleich zum Quellcode-Checkout

### Normale Installation (install.sh / npm / pnpm / bun)

Wenn Sie `https://openclaw.ai/install.sh` oder `install.ps1` verwendet haben, wurde die CLI mit `npm install -g openclaw@latest` installiert.
Entfernen Sie sie mit `npm rm -g openclaw` (oder `pnpm remove -g` / `bun remove -g`, wenn Sie die Installation auf diese Weise durchgeführt haben).

### Quellcode-Checkout (git clone)

Wenn Sie die Anwendung aus einem Repository-Checkout ausführen (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Deinstallieren Sie den Gateway-Dienst, **bevor** Sie das Repository löschen (verwenden Sie den oben beschriebenen einfachen Weg oder das manuelle Entfernen des Dienstes).
2. Löschen Sie das Repository-Verzeichnis.
3. Entfernen Sie Zustand und Workspace wie oben beschrieben.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Migrationsleitfaden](/de/install/migrating)
