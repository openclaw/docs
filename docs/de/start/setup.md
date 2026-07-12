---
read_when:
    - Einrichten eines neuen Computers
    - Sie möchten das „Neueste und Beste“, ohne Ihre persönliche Einrichtung zu beeinträchtigen
summary: Erweiterte Einrichtungs- und Entwicklungsabläufe für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-07-12T15:54:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd35e9ab99de49a14f3d8673b2d11abe46aace18cc7edac43987826bbd1fd857
    source_path: start/setup.md
    workflow: 16
---

<Note>
Wenn Sie die Einrichtung zum ersten Mal durchführen, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Details zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## Kurzfassung

Wählen Sie einen Einrichtungsablauf danach aus, wie häufig Sie Aktualisierungen wünschen und ob Sie den Gateway selbst ausführen möchten:

- **Anpassungen bleiben außerhalb des Repositorys:** Bewahren Sie Ihre Konfiguration und Ihren Workspace in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/` auf, damit Aktualisierungen des Repositorys sie nicht verändern.
- **Stabiler Ablauf (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie den gebündelten Gateway ausführen.
- **Bleeding-Edge-Ablauf (Entwicklung):** Führen Sie den Gateway selbst über `pnpm gateway:watch` aus und lassen Sie anschließend die macOS-App im lokalen Modus eine Verbindung herstellen.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.19+`, wird weiterhin unterstützt)
- `pnpm` ist für Quellcode-Checkouts erforderlich. OpenClaw lädt gebündelte Plugins im Entwicklungsmodus aus den pnpm-Workspace-Paketen unter
  `extensions/*`. Daher bereitet `npm install` im Stammverzeichnis
  nicht den vollständigen Quellcodebaum vor.
- Docker (optional; nur für containerisierte Einrichtung/E2E – siehe [Docker](/de/install/docker))

## Anpassungsstrategie (damit Aktualisierungen nichts beeinträchtigen)

Wenn Sie sowohl eine „zu 100 % auf mich zugeschnittene“ Konfiguration _als auch_ einfache Aktualisierungen wünschen, bewahren Sie Ihre Anpassungen hier auf:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/ähnlich wie JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, Prompts, Erinnerungen; richten Sie ihn als privates Git-Repository ein)

Initialisieren Sie die Konfigurations- und Workspace-Ordner einmalig, ohne den vollständigen Onboarding-Assistenten auszuführen:

```bash
openclaw setup --baseline
```

Noch keine globale Installation vorhanden? Führen Sie den Befehl stattdessen aus diesem Repository aus:

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` ohne `--baseline` ist ein Alias für `openclaw onboard` und führt den vollständigen interaktiven Assistenten aus.)

## Gateway aus diesem Repository ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Ablauf (macOS-App zuerst)

1. Installieren und starten Sie **OpenClaw.app** (Menüleiste).
2. Schließen Sie die Onboarding-/Berechtigungscheckliste ab (TCC-Abfragen).
3. Stellen Sie sicher, dass der Gateway auf **Local** eingestellt ist und ausgeführt wird (die App verwaltet ihn).
4. Verknüpfen Sie Dienste (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Führen Sie eine Plausibilitätsprüfung durch:

```bash
openclaw health
```

Wenn das Onboarding in Ihrem Build nicht verfügbar ist:

- Führen Sie `openclaw setup` und anschließend `openclaw channels login` aus. Starten Sie danach den Gateway manuell (`openclaw gateway`).

## Bleeding-Edge-Ablauf (Gateway in einem Terminal)

Ziel: am TypeScript-Gateway arbeiten, Hot Reload nutzen und die Benutzeroberfläche der macOS-App verbunden halten.

### 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen

Wenn Sie auch die macOS-App auf dem neuesten Entwicklungsstand verwenden möchten:

```bash
./scripts/restart-mac.sh
```

### 1) Entwicklungs-Gateway starten

```bash
pnpm install
# Nur bei der ersten Ausführung (oder nach dem Zurücksetzen der lokalen OpenClaw-Konfiguration/des Workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` startet den Gateway-Watch-Prozess in einer benannten tmux-Sitzung
(`openclaw-gateway-watch-main`) oder startet ihn dort neu und verbindet interaktive
Terminals automatisch mit dieser Sitzung. Nicht interaktive Shells bleiben getrennt und geben
`tmux attach -t openclaw-gateway-watch-main` aus. Verwenden Sie
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, damit eine interaktive Ausführung
getrennt bleibt, oder `pnpm gateway:watch:raw` für den Watch-Modus im Vordergrund. Der Watcher
lädt bei relevanten Änderungen am Quellcode, an der Konfiguration und an den Metadaten gebündelter Plugins neu. Wenn der
überwachte Gateway während des Starts beendet wird, führt `gateway:watch` einmal
`openclaw doctor --fix --non-interactive` aus und versucht es erneut. Setzen Sie
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, um diesen ausschließlich für die Entwicklung vorgesehenen Reparaturdurchlauf zu deaktivieren.
`pnpm gateway:watch` erstellt `dist/control-ui` nicht neu. Führen Sie daher nach Änderungen unter `ui/` erneut `pnpm ui:build` aus oder verwenden Sie während der Entwicklung der Control UI `pnpm ui:dev`.

### 2) Die macOS-App mit Ihrem laufenden Gateway verbinden

In **OpenClaw.app**:

- Connection Mode: **Local**
  Die App stellt über den konfigurierten Port eine Verbindung zum laufenden Gateway her.

### 3) Überprüfen

- Der Gateway-Status in der App sollte **"Using existing gateway …"** anzeigen.
- Alternativ über die CLI:

```bash
openclaw health
```

### Häufige Fallstricke

- **Falscher Port:** Gateway-WS verwendet standardmäßig `ws://127.0.0.1:18789`. Verwenden Sie für App und CLI denselben Port.
- **Speicherorte des Zustands:**
  - Kanal-/Provider-Zustand: `~/.openclaw/credentials/`
  - Modellauthentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen und Transkripte: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Veraltete/archivierte Sitzungsartefakte: `~/.openclaw/agents/<agentId>/sessions/`
  - Protokolle: `/tmp/openclaw/`

## Übersicht der Anmeldedatenspeicherung

Verwenden Sie diese Übersicht bei der Fehlerbehebung für die Authentifizierung oder um zu entscheiden, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Umgebungsvariable oder `channels.telegram.tokenFile` (nur reguläre Datei; symbolische Links werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/Umgebungsvariable oder SecretRef (Provider für Umgebungsvariablen/Dateien/Ausführung)
- **Slack-Token**: Konfiguration/Umgebungsvariable (`channels.slack.*`)
- **Kopplungs-Zulassungslisten**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modellauthentifizierungsprofile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secrets-Nutzdaten (optional)**: `~/.openclaw/secrets.json`
- **Import veralteter OAuth-Daten**: `~/.openclaw/credentials/oauth.json`
  Weitere Details: [Sicherheit](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihre Einrichtung zu beschädigen)

- Behandeln Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Daten“. Legen Sie keine persönlichen Prompts oder Konfigurationen im `openclaw`-Repository ab.
- Quellcode aktualisieren: `git pull` + `pnpm install` + weiterhin `pnpm gateway:watch` verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzerdienst**. Standardmäßig beendet systemd Benutzer-
dienste bei der Abmeldung oder im Leerlauf, wodurch der Gateway beendet wird. Das Onboarding versucht,
Lingering für Sie zu aktivieren (möglicherweise werden Sie zur Eingabe von sudo aufgefordert). Falls es weiterhin deaktiviert ist, führen Sie Folgendes aus:

```bash
sudo loginctl enable-linger $USER
```

Für dauerhaft aktive Server oder Mehrbenutzerserver empfiehlt sich stattdessen ein **Systemdienst**
anstelle eines Benutzerdienstes (kein Lingering erforderlich). Hinweise zu systemd finden Sie im [Gateway-Betriebshandbuch](/de/gateway).

## Verwandte Dokumentation

- [Gateway-Betriebshandbuch](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema und Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags und replyToMode-Einstellungen)
- [Einrichtung des OpenClaw-Assistenten](/de/start/openclaw)
- [macOS-App](/de/platforms/macos) (Gateway-Lebenszyklus)
