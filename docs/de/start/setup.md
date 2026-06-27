---
read_when:
    - Eine neue Maschine einrichten
    - Sie möchten „das Neueste und Beste“, ohne Ihre persönliche Einrichtung zu beschädigen
summary: Erweiterte Einrichtung und Entwicklungs-Workflows für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-06-27T18:14:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Wenn Sie die Einrichtung zum ersten Mal durchführen, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Details zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## TL;DR

Wählen Sie einen Einrichtungsablauf danach aus, wie häufig Sie Updates wünschen und ob Sie den Gateway selbst ausführen möchten:

- **Anpassungen liegen außerhalb des Repos:** Bewahren Sie Ihre Konfiguration und Ihren Arbeitsbereich in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/` auf, damit Repo-Updates sie nicht berühren.
- **Stabiler Ablauf (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie den gebündelten Gateway ausführen.
- **Bleeding-Edge-Ablauf (Entwicklung):** Führen Sie den Gateway selbst über `pnpm gateway:watch` aus und lassen Sie dann die macOS-App im lokalen Modus verbinden.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.19+`, weiterhin unterstützt)
- `pnpm` ist für Source-Checkouts erforderlich. OpenClaw lädt gebündelte Plugins im Entwicklungsmodus aus den
  `extensions/*`-pnpm-Workspace-Paketen, daher bereitet ein `npm install` im Root
  nicht den vollständigen Quellbaum vor.
- Docker (optional; nur für containerisierte Einrichtung/E2E - siehe [Docker](/de/install/docker))

## Anpassungsstrategie (damit Updates nicht stören)

Wenn Sie „100 % auf mich zugeschnitten“ _und_ einfache Updates möchten, bewahren Sie Ihre Anpassungen hier auf:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/JSON5-artig)
- **Arbeitsbereich:** `~/.openclaw/workspace` (Skills, Prompts, Erinnerungen; machen Sie daraus ein privates Git-Repo)

Einmalig initialisieren:

```bash
openclaw setup
```

Verwenden Sie innerhalb dieses Repos den lokalen CLI-Einstieg:

```bash
openclaw setup
```

Wenn Sie noch keine globale Installation haben, führen Sie ihn über `pnpm openclaw setup` aus.

## Den Gateway aus diesem Repo ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Ablauf (macOS-App zuerst)

1. **OpenClaw.app** installieren und starten (Menüleiste).
2. Die Checkliste für Onboarding/Berechtigungen abschließen (TCC-Eingabeaufforderungen).
3. Sicherstellen, dass Gateway **Local** ist und ausgeführt wird (die App verwaltet ihn).
4. Oberflächen verknüpfen (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Plausibilitätsprüfung:

```bash
openclaw health
```

Wenn Onboarding in Ihrem Build nicht verfügbar ist:

- Führen Sie `openclaw setup` aus, dann `openclaw channels login`, und starten Sie anschließend den Gateway manuell (`openclaw gateway`).

## Bleeding-Edge-Ablauf (Gateway in einem Terminal)

Ziel: am TypeScript-Gateway arbeiten, Hot Reload erhalten, die UI der macOS-App verbunden lassen.

### 0) (Optional) Die macOS-App ebenfalls aus dem Quellcode ausführen

Wenn Sie auch die macOS-App auf dem Bleeding Edge nutzen möchten:

```bash
./scripts/restart-mac.sh
```

### 1) Den Entwicklungs-Gateway starten

```bash
pnpm install
# Nur beim ersten Lauf (oder nach dem Zurücksetzen der lokalen OpenClaw-Konfiguration/des Arbeitsbereichs)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` startet oder startet den Gateway-Watch-Prozess in einer benannten tmux-
Sitzung neu und hängt sich aus interaktiven Terminals automatisch an. Nicht interaktive Shells bleiben
getrennt und geben `tmux attach -t openclaw-gateway-watch-main` aus; verwenden Sie
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, um einen interaktiven Lauf
getrennt zu halten, oder `pnpm gateway:watch:raw` für den Watch-Modus im Vordergrund. Der Watcher
lädt bei relevanten Änderungen an Quellcode, Konfiguration und Metadaten gebündelter Plugins neu. Wenn der
überwachte Gateway während des Starts beendet wird, führt `gateway:watch` einmal
`openclaw doctor --fix --non-interactive` aus und versucht es erneut; setzen Sie
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, um diesen nur für die Entwicklung vorgesehenen Reparaturdurchlauf zu deaktivieren.
`pnpm openclaw setup` ist der einmalige Initialisierungsschritt für lokale Konfiguration/Arbeitsbereich bei einem frischen Checkout.
`pnpm gateway:watch` baut `dist/control-ui` nicht neu. Führen Sie daher nach Änderungen in `ui/` erneut `pnpm ui:build` aus oder verwenden Sie `pnpm ui:dev`, während Sie an der Control UI entwickeln.

### 2) Die macOS-App auf Ihren laufenden Gateway zeigen lassen

In **OpenClaw.app**:

- Verbindungsmodus: **Local**
  Die App verbindet sich mit dem laufenden Gateway auf dem konfigurierten Port.

### 3) Überprüfen

- Der Gateway-Status in der App sollte **„Vorhandenen Gateway verwenden …“** anzeigen
- Oder per CLI:

```bash
openclaw health
```

### Häufige Stolperfallen

- **Falscher Port:** Gateway WS ist standardmäßig `ws://127.0.0.1:18789`; verwenden Sie in App und CLI denselben Port.
- **Wo der Zustand gespeichert ist:**
  - Kanal-/Provider-Zustand: `~/.openclaw/credentials/`
  - Modell-Auth-Profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Speicherortübersicht für Anmeldedaten

Verwenden Sie dies beim Debuggen von Authentifizierung oder wenn Sie entscheiden, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: config/env oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt)
- **Discord-Bot-Token**: config/env oder SecretRef (env/file/exec-Provider)
- **Slack-Token**: config/env (`channels.slack.*`)
- **Pairing-Positivlisten**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modell-Auth-Profile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secrets-Nutzlast (optional)**: `~/.openclaw/secrets.json`
- **Legacy-OAuth-Import**: `~/.openclaw/credentials/oauth.json`
  Mehr Details: [Sicherheit](/de/gateway/security#credential-storage-map).

## Aktualisierung (ohne Ihre Einrichtung zu beschädigen)

- Behalten Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Daten“; legen Sie keine persönlichen Prompts/Konfiguration in das `openclaw`-Repo.
- Quellcode aktualisieren: `git pull` + `pnpm install` + weiterhin `pnpm gateway:watch` verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzer**dienst. Standardmäßig stoppt systemd Benutzer-
dienste beim Abmelden/Leerlauf, wodurch der Gateway beendet wird. Onboarding versucht,
Lingering für Sie zu aktivieren (kann nach sudo fragen). Wenn es weiterhin deaktiviert ist, führen Sie aus:

```bash
sudo loginctl enable-linger $USER
```

Für dauerhaft laufende oder Mehrbenutzer-Server sollten Sie statt eines
Benutzerdienstes einen **System**dienst in Betracht ziehen (kein Lingering erforderlich). Siehe [Gateway-Runbook](/de/gateway) für die systemd-Hinweise.

## Verwandte Dokumentation

- [Gateway-Runbook](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags + replyToMode-Einstellungen)
- [OpenClaw-Assistent einrichten](/de/start/openclaw)
- [macOS-App](/de/platforms/macos) (Gateway-Lebenszyklus)
