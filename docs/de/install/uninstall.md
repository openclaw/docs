---
read_when:
    - Sie möchten OpenClaw von einem Rechner entfernen
    - Der Gateway-Dienst läuft nach der Deinstallation weiterhin
summary: OpenClaw vollständig deinstallieren (CLI, Dienst, Status, Arbeitsbereich)
title: Deinstallieren
x-i18n:
    generated_at: "2026-06-27T17:39:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Zwei Wege:

- **Einfacher Weg**, wenn `openclaw` noch installiert ist.
- **Manuelle Dienstentfernung**, wenn die CLI nicht mehr vorhanden ist, der Dienst aber noch läuft.

## Einfacher Weg (CLI noch installiert)

Empfohlen: Verwenden Sie den integrierten Uninstaller:

```bash
openclaw uninstall
```

Bei Verwendung der CLI bleiben konfigurierte Arbeitsbereichsverzeichnisse bei der Zustandsentfernung erhalten, sofern Sie nicht zusätzlich `--workspace` auswählen.

Vorschau dessen, was entfernt wird (sicher):

```bash
openclaw uninstall --dry-run --all
```

Nicht interaktiv (Automatisierung / npx). Mit Vorsicht verwenden und nur, nachdem Sie die Geltungsbereiche bestätigt haben:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Manuelle Schritte (gleiches Ergebnis):

1. Stoppen Sie den Gateway-Dienst:

```bash
openclaw gateway stop
```

2. Deinstallieren Sie den Gateway-Dienst (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Löschen Sie Zustand + Konfiguration:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Wenn Sie `OPENCLAW_CONFIG_PATH` auf einen benutzerdefinierten Speicherort außerhalb des Zustandsverzeichnisses gesetzt haben, löschen Sie auch diese Datei.
Wenn Sie einen Arbeitsbereich im Zustandsverzeichnis behalten möchten, etwa `~/.openclaw/workspace`, verschieben Sie ihn vor dem Ausführen von `rm -rf` an einen anderen Ort oder löschen Sie die Zustandsinhalte selektiv.

4. Löschen Sie Ihren Arbeitsbereich (optional, entfernt Agent-Dateien):

```bash
rm -rf ~/.openclaw/workspace
```

5. Entfernen Sie die CLI-Installation (wählen Sie die Variante, die Sie verwendet haben):

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

- Wenn Sie Profile (`--profile` / `OPENCLAW_PROFILE`) verwendet haben, wiederholen Sie Schritt 3 für jedes Zustandsverzeichnis (Standardwerte sind `~/.openclaw-<profile>`).
- Im Remote-Modus befindet sich das Zustandsverzeichnis auf dem **Gateway-Host**. Führen Sie die Schritte 1-4 daher auch dort aus.

## Manuelle Dienstentfernung (CLI nicht installiert)

Verwenden Sie dies, wenn der Gateway-Dienst weiterläuft, aber `openclaw` fehlt.

### macOS (launchd)

Das Standardlabel ist `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; ältere `com.openclaw.*` können noch vorhanden sein):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Wenn Sie ein Profil verwendet haben, ersetzen Sie das Label und den plist-Namen durch `ai.openclaw.<profile>`. Entfernen Sie alle älteren `com.openclaw.*`-plists, falls vorhanden.

### Linux (systemd-Benutzereinheit)

Der Standardname der Einheit ist `openclaw-gateway.service` (oder `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Geplante Aufgabe)

Der Standardname der Aufgabe ist `OpenClaw Gateway` (oder `OpenClaw Gateway (<profile>)`).
Das Aufgabenskript liegt in Ihrem Zustandsverzeichnis als `gateway.cmd`; aktuelle Installationen können
außerdem einen fensterlosen `gateway.vbs`-Launcher erstellen, den die Aufgabenplanung stattdessen ausführt,
anstatt `gateway.cmd` direkt zu öffnen.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Wenn Sie ein Profil verwendet haben, löschen Sie den passenden Aufgabennamen und die Dateien `gateway.cmd` /
`gateway.vbs` unter `~\.openclaw-<profile>`.

## Normale Installation im Vergleich zum Source-Checkout

### Normale Installation (install.sh / npm / pnpm / bun)

Wenn Sie `https://openclaw.ai/install.sh` oder `install.ps1` verwendet haben, wurde die CLI mit `npm install -g openclaw@latest` installiert.
Entfernen Sie sie mit `npm rm -g openclaw` (oder `pnpm remove -g` / `bun remove -g`, wenn Sie diese Methode verwendet haben).

### Source-Checkout (git clone)

Wenn Sie aus einem Repo-Checkout heraus ausführen (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Deinstallieren Sie den Gateway-Dienst **bevor** Sie das Repo löschen (verwenden Sie den einfachen Weg oben oder die manuelle Dienstentfernung).
2. Löschen Sie das Repo-Verzeichnis.
3. Entfernen Sie Zustand + Arbeitsbereich wie oben gezeigt.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Migrationsleitfaden](/de/install/migrating)
