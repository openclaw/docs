---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und möchten geführte Korrekturen.
    - Sie haben ein Update durchgeführt und möchten eine Plausibilitätsprüfung.
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:43:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Integritätsprüfungen + Schnellreparaturen für das Gateway und Channels.

Verwandt:

- Fehlerbehebung: [Troubleshooting](/de/gateway/troubleshooting)
- Sicherheitsaudit: [Security](/de/gateway/security)

## Beispiele

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Optionen

- `--no-workspace-suggestions`: Vorschläge für Workspace-Speicher/-Suche deaktivieren
- `--yes`: Standardwerte ohne Nachfrage übernehmen
- `--repair`: empfohlene Reparaturen ohne Nachfrage anwenden
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich des Überschreibens benutzerdefinierter Service-Konfigurationen, wenn nötig
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Performance: nicht interaktive `doctor`-Ausführungen überspringen das eager Laden von Plugins, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- Integritätsprüfungen des Status erkennen jetzt verwaiste Transcript-Dateien im Sessions-Verzeichnis und können sie als `.deleted.<timestamp>` archivieren, um Speicherplatz sicher zurückzugewinnen.
- Doctor scannt auch `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf Legacy-Formen von Cron-Jobs und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Doctor repariert fehlende Laufzeitabhängigkeiten gebündelter Plugins, ohne in paketierte globale Installationen zu schreiben. Für npm-Installationen mit Root-Besitz oder gehärtete systemd-Units setzen Sie `OPENCLAW_PLUGIN_STAGE_DIR` auf ein beschreibbares Verzeichnis wie `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migriert automatisch die alte flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und Ähnliche) nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte Ausführungen von `doctor --fix` melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Anmeldedaten fehlen.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet doctor eine Warnung mit hohem Signalgehalt samt Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` von SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten.
- Wenn die SecretRef-Prüfung für Channels in einem Reparaturpfad fehlschlägt, fährt doctor fort und meldet eine Warnung, statt vorzeitig zu beenden.
- Die automatische Auflösung von Telegram-Benutzernamen in `allowFrom` (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Prüfung nicht verfügbar ist, meldet doctor eine Warnung und überspringt die automatische Auflösung in diesem Durchlauf.

## macOS: `launchctl`-Env-Überschreibungen

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann anhaltende „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway doctor](/de/gateway/doctor)
