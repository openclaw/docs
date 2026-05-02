---
read_when:
    - Einrichten eines neuen Computers
    - Sie möchten „das Neueste und Beste“, ohne Ihre persönliche Konfiguration zu beschädigen
summary: Erweiterte Einrichtung und Entwicklungsworkflows für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-05-02T06:45:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
Wenn Sie die Einrichtung zum ersten Mal vornehmen, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Details zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## TL;DR

Wählen Sie einen Einrichtungsablauf danach aus, wie häufig Sie Updates wünschen und ob Sie den Gateway selbst ausführen möchten:

- **Anpassungen liegen außerhalb des Repos:** Bewahren Sie Ihre Konfiguration und Ihren Workspace in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/` auf, damit Repo-Updates sie nicht verändern.
- **Stabiler Ablauf (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie den gebündelten Gateway ausführen.
- **Bleeding-Edge-Ablauf (Entwicklung):** Führen Sie den Gateway selbst über `pnpm gateway:watch` aus und lassen Sie die macOS-App dann im Local-Modus verbinden.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.14+`, wird weiterhin unterstützt)
- `pnpm` ist für Source-Checkouts erforderlich. OpenClaw lädt gebündelte Plugins im Entwicklungsmodus aus den pnpm-Workspace-Paketen unter
  `extensions/*`, daher bereitet ein `npm install` im Root-Verzeichnis
  nicht den vollständigen Source Tree vor.
- Docker (optional; nur für containerisierte Einrichtung/e2e — siehe [Docker](/de/install/docker))

## Anpassungsstrategie (damit Updates nicht stören)

Wenn Sie „100 % auf mich zugeschnitten“ _und_ einfache Updates möchten, halten Sie Ihre Anpassungen in:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/JSON5-ähnlich)
- **Workspace:** `~/.openclaw/workspace` (Skills, Prompts, Memories; machen Sie daraus ein privates Git-Repo)

Einmalig bootstrapen:

```bash
openclaw setup
```

Verwenden Sie aus diesem Repo heraus den lokalen CLI-Einstieg:

```bash
openclaw setup
```

Wenn Sie noch keine globale Installation haben, führen Sie es über `pnpm openclaw setup` aus.

## Den Gateway aus diesem Repo ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Ablauf (zuerst macOS-App)

1. Installieren und starten Sie **OpenClaw.app** (Menüleiste).
2. Schließen Sie die Onboarding-/Berechtigungs-Checkliste ab (TCC-Eingabeaufforderungen).
3. Stellen Sie sicher, dass der Gateway **Local** ist und läuft (die App verwaltet ihn).
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

## Bleeding-Edge-Ablauf (Gateway in einem Terminal)

Ziel: Am TypeScript-Gateway arbeiten, Hot Reload erhalten und die macOS-App-UI verbunden halten.

### 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen

Wenn Sie auch die macOS-App auf dem Bleeding Edge nutzen möchten:

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

`gateway:watch` startet oder startet den Gateway-Watch-Prozess in einer benannten tmux-Sitzung neu
und hängt sich aus interaktiven Terminals automatisch an. Nicht interaktive Shells bleiben
getrennt und geben `tmux attach -t openclaw-gateway-watch-main` aus; verwenden Sie
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, um einen interaktiven Lauf
getrennt zu halten, oder `pnpm gateway:watch:raw` für den Watch-Modus im Vordergrund. Der Watcher
lädt bei relevanten Änderungen an Quellcode, Konfiguration und Metadaten gebündelter Plugins neu.
`pnpm openclaw setup` ist der einmalige Initialisierungsschritt für lokale Konfiguration und Workspace bei einem frischen Checkout.
`pnpm gateway:watch` baut `dist/control-ui` nicht neu, führen Sie daher nach Änderungen in `ui/` erneut `pnpm ui:build` aus oder verwenden Sie während der Entwicklung der Control UI `pnpm ui:dev`.

### 2) Die macOS-App auf Ihren laufenden Gateway verweisen

In **OpenClaw.app**:

- Verbindungsmodus: **Local**
  Die App verbindet sich mit dem laufenden Gateway auf dem konfigurierten Port.

### 3) Überprüfen

- Der In-App-Gateway-Status sollte **„Vorhandener Gateway wird verwendet …“** anzeigen
- Oder per CLI:

```bash
openclaw health
```

### Häufige Fallstricke

- **Falscher Port:** Gateway WS verwendet standardmäßig `ws://127.0.0.1:18789`; halten Sie App und CLI auf demselben Port.
- **Wo der Zustand liegt:**
  - Channel-/Provider-Zustand: `~/.openclaw/credentials/`
  - Auth-Profile für Modelle: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Übersicht zur Speicherung von Zugangsdaten

Verwenden Sie dies beim Debuggen von Authentifizierung oder bei der Entscheidung, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Env oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/Env oder SecretRef (Env-/Datei-/Exec-Provider)
- **Slack-Token**: Konfiguration/Env (`channels.slack.*`)
- **Pairing-Allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Auth-Profile für Modelle**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secrets-Payload (optional)**: `~/.openclaw/secrets.json`
- **Legacy-OAuth-Import**: `~/.openclaw/credentials/oauth.json`
  Mehr Details: [Security](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihre Einrichtung zu beschädigen)

- Behandeln Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Dinge“; legen Sie keine persönlichen Prompts/Konfigurationen in das `openclaw`-Repo.
- Quellcode aktualisieren: `git pull` + `pnpm install` + weiterhin `pnpm gateway:watch` verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzerdienst**. Standardmäßig stoppt systemd Benutzerdienste
bei Logout/Inaktivität, wodurch der Gateway beendet wird. Das Onboarding versucht,
Lingering für Sie zu aktivieren (kann nach sudo fragen). Falls es weiterhin deaktiviert ist, führen Sie aus:

```bash
sudo loginctl enable-linger $USER
```

Für dauerhaft aktive Server oder Mehrbenutzerserver sollten Sie statt eines
Benutzerdienstes einen **Systemdienst** in Betracht ziehen (kein Lingering erforderlich). Siehe [Gateway-Runbook](/de/gateway) für die systemd-Hinweise.

## Verwandte Dokumentation

- [Gateway-Runbook](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags + replyToMode-Einstellungen)
- [OpenClaw-Assistent einrichten](/de/start/openclaw)
- [macOS-App](/de/platforms/macos) (Gateway-Lebenszyklus)
