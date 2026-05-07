---
read_when:
    - Einrichten eines neuen Computers
    - Sie möchten „das Neueste und Beste“, ohne Ihre persönliche Konfiguration zu beschädigen
summary: Erweiterte Einrichtung und Entwicklungsworkflows für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-05-07T13:25:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
Wenn Sie die Einrichtung zum ersten Mal durchführen, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Details zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## Kurzfassung

Wählen Sie einen Einrichtungs-Workflow danach aus, wie oft Sie Updates möchten und ob Sie den Gateway selbst ausführen möchten:

- **Anpassungen liegen außerhalb des Repos:** Bewahren Sie Ihre Konfiguration und Ihren Arbeitsbereich in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/` auf, damit Repo-Updates sie nicht berühren.
- **Stabiler Workflow (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie den gebündelten Gateway ausführen.
- **Workflow für neueste Entwicklungsversionen (dev):** Führen Sie den Gateway selbst über `pnpm gateway:watch` aus und lassen Sie dann die macOS-App im lokalen Modus verbinden.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.16+`, wird weiterhin unterstützt)
- `pnpm` ist für Source-Checkouts erforderlich. OpenClaw lädt gebündelte Plugins im dev-Modus aus den
  `extensions/*`-pnpm-Workspace-Paketen, daher bereitet ein `npm install` im Root-Verzeichnis
  nicht den vollständigen Quellbaum vor.
- Docker (optional; nur für containerisierte Einrichtung/e2e - siehe [Docker](/de/install/docker))

## Anpassungsstrategie (damit Updates nicht schaden)

Wenn Sie „100 % auf mich zugeschnitten“ _und_ einfache Updates möchten, bewahren Sie Ihre Anpassungen hier auf:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/JSON5-ähnlich)
- **Arbeitsbereich:** `~/.openclaw/workspace` (Skills, Prompts, Erinnerungen; machen Sie daraus ein privates Git-Repo)

Einmalig initialisieren:

```bash
openclaw setup
```

Verwenden Sie innerhalb dieses Repos den lokalen CLI-Einstieg:

```bash
openclaw setup
```

Wenn Sie noch keine globale Installation haben, führen Sie es über `pnpm openclaw setup` aus.

## Gateway aus diesem Repo ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Workflow (macOS-App zuerst)

1. Installieren und starten Sie **OpenClaw.app** (Menüleiste).
2. Schließen Sie die Onboarding-/Berechtigungs-Checkliste ab (TCC-Abfragen).
3. Stellen Sie sicher, dass der Gateway auf **Lokal** gesetzt ist und läuft (die App verwaltet ihn).
4. Verknüpfen Sie Oberflächen (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Plausibilitätsprüfung:

```bash
openclaw health
```

Wenn Onboarding in Ihrem Build nicht verfügbar ist:

- Führen Sie `openclaw setup`, dann `openclaw channels login` aus und starten Sie anschließend den Gateway manuell (`openclaw gateway`).

## Workflow für neueste Entwicklungsversionen (Gateway in einem Terminal)

Ziel: am TypeScript-Gateway arbeiten, Hot Reload erhalten und die UI der macOS-App verbunden lassen.

### 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen

Wenn Sie auch die macOS-App auf der neuesten Entwicklungsversion verwenden möchten:

```bash
./scripts/restart-mac.sh
```

### 1) Dev-Gateway starten

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` startet oder startet den Gateway-Watch-Prozess in einer benannten tmux-
Sitzung neu und verbindet sich aus interaktiven Terminals automatisch damit. Nicht interaktive Shells bleiben
getrennt und geben `tmux attach -t openclaw-gateway-watch-main` aus; verwenden Sie
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, um einen interaktiven Lauf
getrennt zu halten, oder `pnpm gateway:watch:raw` für den Watch-Modus im Vordergrund. Der Watcher
lädt bei relevanten Änderungen an Quellcode, Konfiguration und Metadaten gebündelter Plugins neu. Wenn der
überwachte Gateway während des Starts beendet wird, führt `gateway:watch` einmal
`openclaw doctor --fix --non-interactive` aus und versucht es erneut; setzen Sie
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, um diesen nur für dev gedachten Reparaturlauf zu deaktivieren.
`pnpm openclaw setup` ist der einmalige Initialisierungsschritt für lokale Konfiguration/Arbeitsbereich bei einem frischen Checkout.
`pnpm gateway:watch` baut `dist/control-ui` nicht neu. Führen Sie daher nach Änderungen in `ui/` erneut `pnpm ui:build` aus oder verwenden Sie `pnpm ui:dev`, während Sie an der Control UI entwickeln.

### 2) Die macOS-App auf Ihren laufenden Gateway ausrichten

In **OpenClaw.app**:

- Verbindungsmodus: **Lokal**
  Die App verbindet sich auf dem konfigurierten Port mit dem laufenden Gateway.

### 3) Überprüfen

- Der Gateway-Status in der App sollte **„Vorhandenen Gateway verwenden …“** anzeigen
- Oder über die CLI:

```bash
openclaw health
```

### Häufige Stolperfallen

- **Falscher Port:** Gateway-WS verwendet standardmäßig `ws://127.0.0.1:18789`; halten Sie App und CLI auf demselben Port.
- **Speicherort des Zustands:**
  - Channel-/Provider-Zustand: `~/.openclaw/credentials/`
  - Modellauthentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Zuordnung der Anmeldedatenspeicherung

Verwenden Sie dies beim Debuggen der Authentifizierung oder bei der Entscheidung, was Sie sichern sollten:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Env oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/Env oder SecretRef (Env-/Datei-/Exec-Provider)
- **Slack-Tokens**: Konfiguration/Env (`channels.slack.*`)
- **Pairing-Allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modellauthentifizierungsprofile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secrets-Nutzlast (optional)**: `~/.openclaw/secrets.json`
- **Legacy-OAuth-Import**: `~/.openclaw/credentials/oauth.json`
  Weitere Details: [Sicherheit](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihre Einrichtung zu beschädigen)

- Behandeln Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Dinge“; legen Sie persönliche Prompts/Konfiguration nicht im `openclaw`-Repo ab.
- Quellcode aktualisieren: `git pull` + `pnpm install` + weiter `pnpm gateway:watch` verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzerdienst**. Standardmäßig stoppt systemd Benutzer-
dienste beim Abmelden/Idle, wodurch der Gateway beendet wird. Onboarding versucht,
Lingering für Sie zu aktivieren (kann nach sudo fragen). Wenn es weiterhin deaktiviert ist, führen Sie aus:

```bash
sudo loginctl enable-linger $USER
```

Für Always-on- oder Mehrbenutzer-Server sollten Sie stattdessen einen **System**dienst statt eines
Benutzerdiensts in Betracht ziehen (kein Lingering erforderlich). Siehe [Gateway-Runbook](/de/gateway) für die systemd-Hinweise.

## Zugehörige Dokumentation

- [Gateway-Runbook](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags + replyToMode-Einstellungen)
- [OpenClaw-Assistent einrichten](/de/start/openclaw)
- [macOS-App](/de/platforms/macos) (Gateway-Lebenszyklus)
