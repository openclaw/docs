---
read_when:
    - Einrichten eines neuen Computers
    - Sie möchten das „Neueste und Beste“, ohne Ihre persönliche Einrichtung zu beeinträchtigen
summary: Erweiterte Einrichtungs- und Entwicklungsabläufe für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-07-24T04:07:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
Wenn Sie die Einrichtung zum ersten Mal vornehmen, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Einzelheiten zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## Kurzfassung

Wählen Sie einen Einrichtungsablauf danach aus, wie häufig Sie Aktualisierungen wünschen und ob Sie den Gateway selbst ausführen möchten:

- **Anpassungen bleiben außerhalb des Repositorys:** Bewahren Sie Ihre Konfiguration und Ihren Workspace in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/` auf, damit Repository-Aktualisierungen sie nicht verändern.
- **Stabiler Ablauf (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie den mitgelieferten Gateway ausführen.
- **Bleeding-Edge-Ablauf (Entwicklung):** Führen Sie den Gateway selbst über `pnpm gateway:watch` aus und lassen Sie anschließend die macOS-App im lokalen Modus eine Verbindung herstellen.

## Voraussetzungen (aus dem Quellcode)

- Node 24.15+ empfohlen (Node 22 LTS, derzeit `22.22.3+`, wird weiterhin unterstützt)
- `pnpm` ist für Quellcode-Checkouts erforderlich. OpenClaw lädt im Entwicklungsmodus mitgelieferte Plugins aus den
  `extensions/*`-pnpm-Workspace-Paketen, daher bereitet `npm install` im Stammverzeichnis
  nicht den vollständigen Quellbaum vor.
- Docker (optional; nur für containerisierte Einrichtung/E2E – siehe [Docker](/de/install/docker))

## Anpassungsstrategie (damit Aktualisierungen nichts beeinträchtigen)

Wenn Sie eine „zu 100 % auf mich zugeschnittene“ Einrichtung _und_ einfache Aktualisierungen wünschen, bewahren Sie Ihre Anpassungen hier auf:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON-/JSON5-ähnlich)
- **Workspace:** `~/.openclaw/workspace` (Skills, Prompts, Erinnerungen; verwenden Sie dafür ein privates Git-Repository)

Initialisieren Sie die Konfigurations- und Workspace-Ordner einmalig, ohne den vollständigen Onboarding-Assistenten auszuführen:

```bash
openclaw setup --baseline
```

Noch keine globale Installation vorhanden? Führen Sie den Befehl stattdessen aus diesem Repository aus:

```bash
pnpm openclaw setup --baseline
```

(Der alleinige Befehl `openclaw setup` ohne `--baseline` ist ein Alias für `openclaw onboard` und führt den vollständigen interaktiven Assistenten aus.)

## Gateway aus diesem Repository ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Ablauf (macOS-App zuerst)

1. Installieren und starten Sie **OpenClaw.app** (Menüleiste).
2. Schließen Sie die Onboarding-/Berechtigungscheckliste ab (TCC-Abfragen).
3. Stellen Sie sicher, dass der Gateway auf **Local** eingestellt ist und ausgeführt wird (die App verwaltet ihn).
4. Verknüpfen Sie Kommunikationsdienste (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Plausibilitätsprüfung:

```bash
openclaw health
```

Wenn das Onboarding in Ihrem Build nicht verfügbar ist:

- Führen Sie `openclaw setup` und anschließend `openclaw channels login` aus und starten Sie danach den Gateway manuell (`openclaw gateway`).

## Bleeding-Edge-Ablauf (Gateway in einem Terminal)

Ziel: Am TypeScript-Gateway arbeiten, Hot Reload nutzen und die Benutzeroberfläche der macOS-App verbunden halten.

### 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen

Wenn Sie auch für die macOS-App die Bleeding-Edge-Version verwenden möchten:

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
(`openclaw-gateway-watch-main`) oder startet ihn dort neu und stellt aus interaktiven
Terminals automatisch eine Verbindung her. Nicht interaktive Shells bleiben getrennt und geben
`tmux attach -t openclaw-gateway-watch-main` aus; verwenden Sie
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`, um eine interaktive Ausführung
getrennt zu halten, oder `pnpm gateway:watch:raw` für den Watch-Modus im Vordergrund. Der Watcher
beendet den installierten Gateway-Dienst des aktiven Profils, bevor er dessen
konfigurierten/standardmäßigen Port übernimmt. Dadurch wird verhindert, dass der Dienst-Supervisor den
Quellprozess ersetzt. Der Dienst bleibt installiert; führen Sie `pnpm openclaw gateway start` aus,
wenn Sie den Watch-Modus beenden. Der tmux-Bereich bleibt nach einem Startfehler verfügbar,
sodass ein anderes Terminal oder ein Agent eine Verbindung herstellen oder seine Protokolle erfassen kann. Der Watcher
lädt bei relevanten Änderungen am Quellcode, an der Konfiguration und an Metadaten mitgelieferter Plugins neu. Wenn der
überwachte Gateway während des Starts beendet wird, führt `gateway:watch`
`openclaw doctor --fix --non-interactive` einmal aus und versucht es erneut; setzen Sie
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`, um diesen ausschließlich für die Entwicklung vorgesehenen Reparaturdurchlauf zu deaktivieren.
`pnpm gateway:watch` erstellt `dist/control-ui` nicht neu. Führen Sie daher nach Änderungen an `ui/` erneut `pnpm ui:build` aus oder verwenden Sie bei der Entwicklung der Control UI `pnpm ui:dev`.

### 2) macOS-App mit Ihrem laufenden Gateway verbinden

In **OpenClaw.app**:

- Connection Mode: **Local**
  Die App stellt über den konfigurierten Port eine Verbindung zum laufenden Gateway her.

### 3) Überprüfen

- Der Gateway-Status in der App sollte **„Using existing gateway …“** anzeigen.
- Alternativ über die CLI:

```bash
openclaw health
```

### Häufige Stolperfallen

- **Falscher Port:** Gateway WS verwendet standardmäßig `ws://127.0.0.1:18789`; verwenden Sie für App und CLI denselben Port.
- **Speicherorte des Zustands:**
  - Kanal-/Provider-Zustand: `~/.openclaw/credentials/`
  - Modell-Authentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen und Transkripte: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Veraltete/archivierte Sitzungsartefakte: `~/.openclaw/agents/<agentId>/sessions/`
  - Protokolle: `/tmp/openclaw/`

## Übersicht der Anmeldedatenspeicherung

Verwenden Sie diese Übersicht beim Debuggen der Authentifizierung oder bei der Entscheidung, welche Daten gesichert werden sollen:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Umgebungsvariable oder `channels.telegram.tokenFile` (nur reguläre Datei; symbolische Links werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/Umgebungsvariable oder SecretRef (Provider für Umgebungsvariablen/Dateien/Befehlsausführung)
- **Slack-Tokens**: Konfiguration/Umgebungsvariable (`channels.slack.*`)
- **Kopplungs-Zulassungslisten**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modell-Authentifizierungsprofile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secret-Nutzlast (optional)**: `~/.openclaw/secrets.json`
- **Import veralteter OAuth-Daten**: `~/.openclaw/credentials/oauth.json`
  Weitere Einzelheiten: [Sicherheit](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihre Einrichtung zu beschädigen)

- Behandeln Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre eigenen Daten“; legen Sie keine persönlichen Prompts oder Konfigurationen im `openclaw`-Repository ab.
- Quellcode aktualisieren: `git pull` + `pnpm install` + `pnpm gateway:watch` weiterhin verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzerdienst**. Standardmäßig beendet systemd Benutzer-
dienste bei der Abmeldung oder bei Inaktivität, wodurch der Gateway beendet wird. Das Onboarding versucht,
Lingering für Sie zu aktivieren (möglicherweise mit einer sudo-Abfrage). Falls es weiterhin deaktiviert ist, führen Sie Folgendes aus:

```bash
sudo loginctl enable-linger $USER
```

Für dauerhaft aktive Server oder Mehrbenutzerserver sollten Sie statt eines
Benutzerdienstes einen **Systemdienst** verwenden (kein Lingering erforderlich). Hinweise zu systemd finden Sie im [Gateway-Betriebshandbuch](/de/gateway).

## Zugehörige Dokumentation

- [Gateway-Betriebshandbuch](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema und Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags und replyToMode-Einstellungen)
- [Einrichtung des OpenClaw-Assistenten](/de/start/openclaw)
- [macOS-App](/de/platforms/macos) (Gateway-Lebenszyklus)
