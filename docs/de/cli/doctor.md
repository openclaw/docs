---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und möchten geführte Korrekturen
    - Sie haben ein Update durchgeführt und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:26:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Integritätsprüfungen + schnelle Korrekturen für das Gateway und die Kanäle.

Verwandt:

- Fehlerbehebung: [Fehlerbehebung](/de/gateway/troubleshooting)
- Sicherheitsaudit: [Sicherheit](/de/gateway/security)

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
- `--repair`: empfohlene Reparaturen ohne Rückfrage anwenden
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Service-Konfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen
- `--generate-gateway-token`: ein Gateway-Token erzeugen und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen prüfen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, ohne Terminal) überspringen Eingabeaufforderungen.
- Leistung: nicht interaktive `doctor`-Ausführungen überspringen das eager Laden von Plugins, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel; jede Entfernung wird aufgelistet.
- Integritätsprüfungen des Status erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis und können sie sicher als `.deleted.<timestamp>` archivieren, um Speicherplatz zurückzugewinnen.
- Doctor scannt außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf veraltete Formen von Cron-Jobs und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Doctor repariert fehlende Laufzeitabhängigkeiten gebündelter Plugins, ohne in paketierte globale Installationen zu schreiben. Für npm-Installationen mit Root-Besitz oder gehärtete systemd-Units setzen Sie `OPENCLAW_PLUGIN_STAGE_DIR` auf ein beschreibbares Verzeichnis wie `/var/lib/openclaw/plugin-runtime-deps`.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin den Zustand von Gateway/Service und wendet Nicht-Service-Reparaturen an, überspringt aber Service-Installation/-Start/-Neustart/-Bootstrap und die Bereinigung veralteter Services.
- Doctor migriert veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und ähnliche) automatisch zu `talk.provider` + `talk.providers.<provider>`.
- Wiederholte Ausführungen von `doctor --fix` melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge von Objektschlüsseln ist.
- Doctor enthält eine Bereitschaftsprüfung für Memory Search und kann `openclaw configure --section model` empfehlen, wenn Anmeldedaten für Embeddings fehlen.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine gut sichtbare Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` durch SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten.
- Wenn die SecretRef-Inspektion eines Kanals in einem Korrekturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt vorzeitig zu beenden.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung in diesem Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann anhaltende Fehler vom Typ „unauthorized“ verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Doctor](/de/gateway/doctor)
