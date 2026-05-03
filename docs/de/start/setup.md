---
read_when:
    - Eine neue Maschine einrichten
    - Sie möchten „das Neueste und Beste“, ohne Ihre persönliche Konfiguration zu beschädigen
summary: Erweiterte Einrichtung und Entwicklungsabläufe für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-05-03T21:38:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
Wenn Sie OpenClaw zum ersten Mal einrichten, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Details zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## Kurzfassung

Wählen Sie einen Einrichtungsablauf danach aus, wie häufig Sie Updates wünschen und ob Sie den Gateway selbst ausführen möchten:

- **Anpassungen liegen außerhalb des Repos:** Bewahren Sie Ihre Konfiguration und Ihren Arbeitsbereich in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/` auf, damit Repo-Updates sie nicht verändern.
- **Stabiler Ablauf (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie den gebündelten Gateway ausführen.
- **Bleeding-Edge-Ablauf (Entwicklung):** Führen Sie den Gateway selbst über `pnpm gateway:watch` aus und lassen Sie die macOS-App dann im lokalen Modus verbinden.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.14+`, wird weiterhin unterstützt)
- `pnpm` ist für Source-Checkouts erforderlich. OpenClaw lädt gebündelte Plugins im Entwicklungsmodus aus den pnpm-Workspace-Paketen
  `extensions/*`, daher bereitet ein `npm install` im Root-Verzeichnis
  nicht den vollständigen Quellbaum vor.
- Docker (optional; nur für containerisierte Einrichtung/e2e — siehe [Docker](/de/install/docker))

## Anpassungsstrategie (damit Updates nicht stören)

Wenn Sie „100 % auf mich zugeschnitten“ _und_ einfache Updates möchten, bewahren Sie Ihre Anpassungen hier auf:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/JSON5-ähnlich)
- **Arbeitsbereich:** `~/.openclaw/workspace` (Skills, Prompts, Memories; machen Sie ihn zu einem privaten Git-Repo)

Einmalig bootstrappen:

```bash
openclaw setup
```

Verwenden Sie innerhalb dieses Repos den lokalen CLI-Einstieg:

```bash
openclaw setup
```

Wenn Sie noch keine globale Installation haben, führen Sie sie über `pnpm openclaw setup` aus.

## Den Gateway aus diesem Repo ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Ablauf (macOS-App zuerst)

1. Installieren und starten Sie **OpenClaw.app** (Menüleiste).
2. Schließen Sie die Onboarding-/Berechtigungscheckliste ab (TCC-Abfragen).
3. Stellen Sie sicher, dass der Gateway **Lokal** ist und läuft (die App verwaltet ihn).
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

## Bleeding-Edge-Ablauf (Gateway in einem Terminal)

Ziel: Am TypeScript-Gateway arbeiten, Hot Reload erhalten und die UI der macOS-App verbunden halten.

### 0) (Optional) Die macOS-App ebenfalls aus dem Quellcode ausführen

Wenn Sie auch die macOS-App auf Bleeding Edge nutzen möchten:

```bash
./scripts/restart-mac.sh
```

### 1) Den Entwicklungs-Gateway starten

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` startet oder startet den Gateway-Watch-Prozess in einer benannten tmux-
Sitzung neu und verbindet interaktive Terminals automatisch. Nicht interaktive Shells bleiben
getrennt und geben `tmux attach -t openclaw-gateway-watch-main` aus; verwenden Sie
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, um einen interaktiven Lauf
getrennt zu halten, oder `pnpm gateway:watch:raw` für den Watch-Modus im Vordergrund. Der Watcher
lädt bei relevanten Änderungen an Quellcode, Konfiguration und Metadaten gebündelter Plugins neu. Wenn der
überwachte Gateway während des Starts beendet wird, führt `gateway:watch` einmal
`openclaw doctor --fix --non-interactive` aus und versucht es erneut; setzen Sie
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, um diesen nur für die Entwicklung gedachten Reparaturlauf zu deaktivieren.
`pnpm openclaw setup` ist der einmalige Schritt zur Initialisierung der lokalen Konfiguration/des Arbeitsbereichs für einen frischen Checkout.
`pnpm gateway:watch` baut `dist/control-ui` nicht neu, führen Sie daher nach Änderungen an `ui/` erneut `pnpm ui:build` aus oder verwenden Sie `pnpm ui:dev`, während Sie die Control UI entwickeln.

### 2) Die macOS-App auf Ihren laufenden Gateway ausrichten

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

- **Falscher Port:** Gateway WS verwendet standardmäßig `ws://127.0.0.1:18789`; halten Sie App und CLI auf demselben Port.
- **Wo Statusdaten gespeichert werden:**
  - Kanal-/Provider-Status: `~/.openclaw/credentials/`
  - Modellauthentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Zuordnung der Anmeldedatenspeicherung

Verwenden Sie dies, wenn Sie Authentifizierung debuggen oder entscheiden, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/env oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/env oder SecretRef (env-/Datei-/exec-Provider)
- **Slack-Tokens**: Konfiguration/env (`channels.slack.*`)
- **Pairing-Zulassungslisten**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modellauthentifizierungsprofile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secrets-Nutzlast (optional)**: `~/.openclaw/secrets.json`
- **Legacy-OAuth-Import**: `~/.openclaw/credentials/oauth.json`
  Mehr Details: [Sicherheit](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihre Einrichtung zu beschädigen)

- Behandeln Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Daten“; legen Sie keine persönlichen Prompts/Konfigurationen im `openclaw`-Repo ab.
- Quellcode aktualisieren: `git pull` + `pnpm install` + weiterhin `pnpm gateway:watch` verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzerdienst**. Standardmäßig stoppt systemd Benutzerdienste
beim Abmelden/Leerlauf, wodurch der Gateway beendet wird. Das Onboarding versucht,
Lingering für Sie zu aktivieren (möglicherweise mit sudo-Abfrage). Wenn es weiterhin deaktiviert ist, führen Sie aus:

```bash
sudo loginctl enable-linger $USER
```

Für Always-on- oder Multi-User-Server sollten Sie statt eines
Benutzerdienstes einen **Systemdienst** in Betracht ziehen (kein Lingering erforderlich). Siehe [Gateway-Runbook](/de/gateway) für die systemd-Hinweise.

## Verwandte Dokumentation

- [Gateway-Runbook](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags + replyToMode-Einstellungen)
- [OpenClaw-Assistent einrichten](/de/start/openclaw)
- [macOS-App](/de/platforms/macos) (Gateway-Lebenszyklus)
