---
read_when:
    - Einrichten eines neuen Rechners
    - Sie möchten das „Neueste und Beste“, ohne Ihre persönliche Konfiguration zu beschädigen
summary: Erweiterte Einrichtung und Entwicklungsabläufe für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-04-30T07:15:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Wenn Sie OpenClaw zum ersten Mal einrichten, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Details zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## Kurzfassung

Wählen Sie einen Einrichtungsworkflow danach aus, wie häufig Sie Updates möchten und ob Sie den Gateway selbst ausführen möchten:

- **Anpassungen liegen außerhalb des Repos:** Bewahren Sie Ihre Konfiguration und Ihren Workspace in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/` auf, damit Repo-Updates sie nicht verändern.
- **Stabiler Workflow (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie den gebündelten Gateway ausführen.
- **Bleeding-Edge-Workflow (Entwicklung):** Führen Sie den Gateway selbst über `pnpm gateway:watch` aus und lassen Sie die macOS-App dann im lokalen Modus verbinden.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.14+`, wird weiterhin unterstützt)
- `pnpm` bevorzugt (oder Bun, wenn Sie bewusst den [Bun-Workflow](/de/install/bun) verwenden)
- Docker (optional; nur für containerisierte Einrichtung/e2e — siehe [Docker](/de/install/docker))

## Anpassungsstrategie (damit Updates nicht schaden)

Wenn Sie „100 % auf mich zugeschnitten“ _und_ einfache Updates möchten, behalten Sie Ihre Anpassungen in:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/JSON5-ähnlich)
- **Workspace:** `~/.openclaw/workspace` (Skills, Prompts, Memories; machen Sie daraus ein privates Git-Repo)

Einmalig bootstrapen:

```bash
openclaw setup
```

Verwenden Sie innerhalb dieses Repos den lokalen CLI-Einstieg:

```bash
openclaw setup
```

Wenn Sie noch keine globale Installation haben, führen Sie es über `pnpm openclaw setup` aus (oder `bun run openclaw setup`, wenn Sie den Bun-Workflow verwenden).

## Gateway aus diesem Repo ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Workflow (macOS-App zuerst)

1. Installieren und starten Sie **OpenClaw.app** (Menüleiste).
2. Schließen Sie die Onboarding-/Berechtigungscheckliste ab (TCC-Abfragen).
3. Stellen Sie sicher, dass Gateway auf **Lokal** steht und ausgeführt wird (die App verwaltet ihn).
4. Verknüpfen Sie Oberflächen (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Plausibilitätsprüfung:

```bash
openclaw health
```

Wenn Onboarding in Ihrem Build nicht verfügbar ist:

- Führen Sie `openclaw setup` aus, dann `openclaw channels login`, und starten Sie anschließend den Gateway manuell (`openclaw gateway`).

## Bleeding-Edge-Workflow (Gateway in einem Terminal)

Ziel: am TypeScript-Gateway arbeiten, Hot Reload erhalten und die UI der macOS-App verbunden halten.

### 0) (Optional) macOS-App ebenfalls aus dem Quellcode ausführen

Wenn Sie auch die macOS-App auf dem neuesten Entwicklungsstand verwenden möchten:

```bash
./scripts/restart-mac.sh
```

### 1) Entwicklungs-Gateway starten

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` startet oder startet den Gateway-Watch-Prozess in einer benannten tmux-Sitzung neu und verbindet interaktive Terminals automatisch. Nicht interaktive Shells bleiben getrennt und geben `tmux attach -t openclaw-gateway-watch-main` aus; verwenden Sie `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, um einen interaktiven Lauf getrennt zu halten, oder `pnpm gateway:watch:raw` für den Watch-Modus im Vordergrund. Der Watcher lädt bei relevanten Änderungen an Quellcode, Konfiguration und Metadaten gebündelter Plugins neu.
`pnpm openclaw setup` ist der einmalige Initialisierungsschritt für lokale Konfiguration und Workspace bei einem frischen Checkout.
`pnpm gateway:watch` baut `dist/control-ui` nicht neu. Führen Sie daher nach Änderungen an `ui/` erneut `pnpm ui:build` aus oder verwenden Sie während der Entwicklung der Control UI `pnpm ui:dev`.

Wenn Sie bewusst den Bun-Workflow verwenden, lauten die entsprechenden Befehle:

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) macOS-App auf Ihren laufenden Gateway verweisen lassen

In **OpenClaw.app**:

- Verbindungsmodus: **Lokal**
  Die App verbindet sich mit dem laufenden Gateway auf dem konfigurierten Port.

### 3) Überprüfen

- Der Gateway-Status in der App sollte **„Vorhandener Gateway wird verwendet …“** anzeigen
- Oder über die CLI:

```bash
openclaw health
```

### Häufige Stolperfallen

- **Falscher Port:** Gateway-WS verwendet standardmäßig `ws://127.0.0.1:18789`; halten Sie App und CLI auf demselben Port.
- **Wo der Zustand liegt:**
  - Channel-/Provider-Zustand: `~/.openclaw/credentials/`
  - Modellauthentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Übersicht der Speicherorte für Anmeldeinformationen

Verwenden Sie dies beim Debuggen der Authentifizierung oder wenn Sie entscheiden, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Env oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/Env oder SecretRef (Env-/Datei-/Exec-Provider)
- **Slack-Tokens**: Konfiguration/Env (`channels.slack.*`)
- **Pairing-Zulassungslisten**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modellauthentifizierungsprofile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secrets-Nutzlast (optional)**: `~/.openclaw/secrets.json`
- **Legacy-OAuth-Import**: `~/.openclaw/credentials/oauth.json`
  Weitere Details: [Sicherheit](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihre Einrichtung zu zerstören)

- Behandeln Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Sachen“; legen Sie keine persönlichen Prompts/Konfigurationen im `openclaw`-Repo ab.
- Quellcode aktualisieren: `git pull` + der von Ihnen gewählte Installationsschritt des Paketmanagers (`pnpm install` standardmäßig; `bun install` für den Bun-Workflow) + weiterhin den passenden `gateway:watch`-Befehl verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzer**dienst. Standardmäßig stoppt systemd Benutzerdienste beim Abmelden oder im Leerlauf, wodurch der Gateway beendet wird. Das Onboarding versucht, Lingering für Sie zu aktivieren (möglicherweise mit sudo-Abfrage). Wenn es weiterhin deaktiviert ist, führen Sie aus:

```bash
sudo loginctl enable-linger $USER
```

Für Always-on- oder Mehrbenutzer-Server sollten Sie statt eines Benutzerdienstes einen **System**dienst in Betracht ziehen (kein Lingering erforderlich). Siehe [Gateway-Runbook](/de/gateway) für die systemd-Hinweise.

## Verwandte Dokumentation

- [Gateway-Runbook](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags + replyToMode-Einstellungen)
- [Einrichtung des OpenClaw-Assistenten](/de/start/openclaw)
- [macOS-App](/de/platforms/macos) (Gateway-Lebenszyklus)
