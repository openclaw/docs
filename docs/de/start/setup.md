---
read_when:
    - Einrichten eines neuen Rechners
    - Sie möchten „das Neueste und Beste“, ohne Ihre persönliche Konfiguration zu beschädigen
summary: Erweiterte Einrichtung und Entwicklungsabläufe für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-05-06T07:04:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
Wenn Sie die Einrichtung zum ersten Mal durchführen, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Details zur Ersteinrichtung finden Sie unter [Ersteinrichtung (CLI)](/de/start/wizard).
</Note>

## Kurzfassung

Wählen Sie einen Einrichtungs-Workflow danach aus, wie häufig Sie Updates möchten und ob Sie den Gateway selbst ausführen möchten:

- **Anpassungen liegen außerhalb des Repos:** Bewahren Sie Ihre Konfiguration und Ihren Arbeitsbereich in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/` auf, damit Repo-Updates sie nicht berühren.
- **Stabiler Workflow (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie den gebündelten Gateway ausführen.
- **Workflow für den neuesten Entwicklungsstand (dev):** Führen Sie den Gateway selbst über `pnpm gateway:watch` aus und lassen Sie die macOS-App dann im lokalen Modus verbinden.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.14+`, wird weiterhin unterstützt)
- `pnpm` ist für Source-Checkouts erforderlich. OpenClaw lädt gebündelte Plugins im Entwicklungsmodus aus den `extensions/*`-pnpm-Workspace-Paketen, daher bereitet `npm install` im Root-Verzeichnis nicht den vollständigen Quellbaum vor.
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

Wenn Sie noch keine globale Installation haben, führen Sie ihn über `pnpm openclaw setup` aus.

## Gateway aus diesem Repo ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Workflow (zuerst die macOS-App)

1. Installieren und starten Sie **OpenClaw.app** (Menüleiste).
2. Schließen Sie die Checkliste für Ersteinrichtung/Berechtigungen ab (TCC-Aufforderungen).
3. Stellen Sie sicher, dass der Gateway **Lokal** ist und läuft (die App verwaltet ihn).
4. Verknüpfen Sie Oberflächen (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Plausibilitätsprüfung:

```bash
openclaw health
```

Wenn die Ersteinrichtung in Ihrem Build nicht verfügbar ist:

- Führen Sie `openclaw setup`, dann `openclaw channels login` aus, und starten Sie anschließend den Gateway manuell (`openclaw gateway`).

## Workflow für den neuesten Entwicklungsstand (Gateway in einem Terminal)

Ziel: am TypeScript-Gateway arbeiten, Hot Reload erhalten und die UI der macOS-App verbunden halten.

### 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen

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

`gateway:watch` startet oder startet den Gateway-Watch-Prozess in einer benannten tmux-Sitzung neu und verbindet interaktive Terminals automatisch. Nicht-interaktive Shells bleiben getrennt und geben `tmux attach -t openclaw-gateway-watch-main` aus; verwenden Sie `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, um einen interaktiven Lauf getrennt zu halten, oder `pnpm gateway:watch:raw` für den Watch-Modus im Vordergrund. Der Watcher lädt bei relevanten Änderungen an Quellcode, Konfiguration und Metadaten gebündelter Plugins neu. Wenn der überwachte Gateway während des Starts beendet wird, führt `gateway:watch` einmal `openclaw doctor --fix --non-interactive` aus und versucht es erneut; setzen Sie `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, um diesen nur für die Entwicklung vorgesehenen Reparaturlauf zu deaktivieren. `pnpm openclaw setup` ist der einmalige Initialisierungsschritt für lokale Konfiguration und Arbeitsbereich bei einem frischen Checkout.
`pnpm gateway:watch` baut `dist/control-ui` nicht neu. Führen Sie daher nach Änderungen unter `ui/` erneut `pnpm ui:build` aus oder verwenden Sie während der Entwicklung der Control UI `pnpm ui:dev`.

### 2) Die macOS-App auf Ihren laufenden Gateway verweisen

In **OpenClaw.app**:

- Verbindungsmodus: **Lokal**
  Die App verbindet sich auf dem konfigurierten Port mit dem laufenden Gateway.

### 3) Prüfen

- Der Gateway-Status in der App sollte **„Vorhandenen Gateway verwenden …“** anzeigen
- Oder über die CLI:

```bash
openclaw health
```

### Häufige Fallstricke

- **Falscher Port:** Gateway WS ist standardmäßig `ws://127.0.0.1:18789`; halten Sie App und CLI auf demselben Port.
- **Wo der Zustand liegt:**
  - Kanal-/Provider-Zustand: `~/.openclaw/credentials/`
  - Modellauthentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Übersicht zur Speicherung von Zugangsdaten

Verwenden Sie dies beim Debuggen der Authentifizierung oder bei der Entscheidung, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Env oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/Env oder SecretRef (Env-/Datei-/Exec-Provider)
- **Slack-Token**: Konfiguration/Env (`channels.slack.*`)
- **Pairing-Zulassungslisten**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modellauthentifizierungsprofile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secret-Nutzlast (optional)**: `~/.openclaw/secrets.json`
- **Legacy-OAuth-Import**: `~/.openclaw/credentials/oauth.json`
  Weitere Details: [Sicherheit](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihre Einrichtung zu beschädigen)

- Behandeln Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Dinge“; legen Sie keine persönlichen Prompts/Konfigurationen im `openclaw`-Repo ab.
- Quellcode aktualisieren: `git pull` + `pnpm install` + weiter `pnpm gateway:watch` verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzerdienst**. Standardmäßig stoppt systemd Benutzerdienste beim Abmelden/Leerlauf, wodurch der Gateway beendet wird. Die Ersteinrichtung versucht, Lingering für Sie zu aktivieren (möglicherweise mit sudo-Aufforderung). Wenn es weiterhin deaktiviert ist, führen Sie aus:

```bash
sudo loginctl enable-linger $USER
```

Für Always-on- oder Mehrbenutzer-Server sollten Sie statt eines Benutzerdienstes einen **Systemdienst** erwägen (kein Lingering erforderlich). Siehe [Gateway-Runbook](/de/gateway) für die systemd-Hinweise.

## Verwandte Dokumentation

- [Gateway-Runbook](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags + replyToMode-Einstellungen)
- [OpenClaw-Assistent einrichten](/de/start/openclaw)
- [macOS-App](/de/platforms/macos) (Gateway-Lebenszyklus)
