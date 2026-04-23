---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und möchten geführte Fehlerbehebungen
    - Sie haben ein Update durchgeführt und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: doctor
x-i18n:
    generated_at: "2026-04-23T06:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad44619b427b938b2f6d4f904fcdc2d9862ff33c569008590f25e17d12e03530
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Integritätsprüfungen + schnelle Fehlerbehebungen für das Gateway und die Kanäle.

Verwandt:

- Fehlerbehebung: [Troubleshooting](/de/gateway/troubleshooting)
- Sicherheitsprüfung: [Security](/de/gateway/security)

## Beispiele

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Optionen

- `--no-workspace-suggestions`: Workspace-Memory-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Rückfrage akzeptieren
- `--repair`: Empfohlene Fehlerbehebungen ohne Rückfrage anwenden
- `--fix`: Alias für `--repair`
- `--force`: Aggressive Fehlerbehebungen anwenden, einschließlich des Überschreibens benutzerdefinierter Service-Konfiguration, wenn nötig
- `--non-interactive`: Ohne Eingabeaufforderungen ausführen; nur sichere Migrationen
- `--generate-gateway-token`: Ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen prüfen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Fehlerbehebungen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Läufe (Cron, Telegram, ohne Terminal) überspringen Eingabeaufforderungen.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- Integritätsprüfungen des Status erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis und können sie als `.deleted.<timestamp>` archivieren, um Speicherplatz sicher freizugeben.
- Doctor prüft auch `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf veraltete Cron-Job-Formen und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Doctor repariert fehlende Laufzeitabhängigkeiten gebündelter Plugins, ohne Schreibzugriff auf das installierte OpenClaw-Paket zu benötigen. Bei root-eigenen npm-Installationen oder gehärteten systemd-Units setzen Sie `OPENCLAW_PLUGIN_STAGE_DIR` auf ein beschreibbares Verzeichnis wie `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migriert die veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und ähnliche) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Läufe melden/wenden Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für die Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Anmeldedaten fehlen.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet doctor eine deutliche Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` per SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet doctor eine schreibgeschützte Warnung und schreibt keine Fallback-Anmeldedaten im Klartext.
- Wenn die SecretRef-Prüfung eines Kanals in einem Fehlerbehebungspfad fehlschlägt, fährt doctor fort und meldet eine Warnung, statt vorzeitig zu beenden.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Prüfung nicht verfügbar ist, meldet doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Umgebungsvariablen-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann zu dauerhaften Fehlern vom Typ „unauthorized“ führen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
