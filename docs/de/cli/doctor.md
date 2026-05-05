---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten eine geführte Fehlerbehebung
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-05T01:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Health Checks + Schnellreparaturen für das Gateway und die Kanäle.

Verwandte Themen:

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
- `--repair`: empfohlene Reparaturen ohne Dienstbezug ohne Rückfrage anwenden; Gateway-Dienstinstallationen und -Neuschreibungen erfordern weiterhin interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Dienstkonfiguration, wenn nötig
- `--non-interactive`: ohne Rückfragen ausführen; nur sichere Migrationen und Reparaturen ohne Dienstbezug
- `--generate-gateway-token`: ein Gateway-Token erzeugen und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen prüfen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Schlüsselbund-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Performance: Nicht interaktive `doctor`-Ausführungen überspringen vorsorgliches Plugin-Laden, damit Headless-Health-Checks schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn ein Check deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder schreibt sie außerhalb des Update-Reparaturmodus jedoch nicht neu. Führen Sie `openclaw gateway install` für einen fehlenden Dienst aus oder `openclaw gateway install --force`, wenn Sie den Launcher bewusst ersetzen möchten.
- Integritätsprüfungen des Zustands erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Deren Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie bestehen.
- Doctor prüft auch `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf veraltete Cron-Job-Formate und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann falsche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-Benutzerbus-Umgebung fehlt.
- Doctor bereinigt veralteten Staging-Zustand für Plugin-Abhängigkeiten, der von älteren OpenClaw-Versionen erstellt wurde. Außerdem repariert es fehlende herunterladbare Plugins, die in der Konfiguration referenziert werden, etwa `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Runtimes. Während Paketaktualisierungen überspringt Doctor die Plugin-Reparatur durch den Paketmanager, bis der Paketaustausch abgeschlossen ist; führen Sie danach erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Wenn der Download fehlschlägt, meldet Doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, außerdem passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor stellt ungültige Plugin-Konfiguration unter Quarantäne, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und seine ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin Gateway-/Dienstzustand und wendet Reparaturen ohne Dienstbezug an, überspringt jedoch Dienstinstallation/-Start/-Neustart/-Bootstrap und die Bereinigung veralteter Dienste.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und schreibt bei der Reparatur keine Befehls-/Entrypoint-Metadaten für einen laufenden systemd-Gateway-Dienst neu. Stoppen Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher bewusst ersetzen möchten.
- Doctor migriert automatisch veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Einträge) nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge von Objektschlüsseln ist.
- Doctor enthält einen Readiness-Check für Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Embedding-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehls-Owner konfiguriert ist. Der Befehls-Owner ist das menschliche Betreiberkonto, das Owner-only-Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, mit dem Bot zu sprechen; wenn Sie einen Absender genehmigt haben, bevor das Bootstrap für den ersten Owner existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Betreibers vorhanden sind. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent. Verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst hochgestuft werden sollten.
- Doctor warnt, wenn Skills, die für den Standardagenten erlaubt sind, in der aktuellen Runtime-Umgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder OS-Anforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie den Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn veraltete Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet Doctor sie; `openclaw doctor --fix` migriert gültige Einträge in geshardete Registry-Verzeichnisse und stellt ungültige Legacy-Dateien unter Quarantäne.
- Wenn `gateway.auth.token`/`gateway.auth.password` per SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Plaintext-Fallback-Anmeldedaten.
- Wenn die SecretRef-Inspektion eines Kanals in einem Korrekturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Migrationen des Zustandsverzeichnisses warnt Doctor, wenn aktivierte Standardkonten für Telegram oder Discord von einem Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann dauerhafte „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway Doctor](/de/gateway/doctor)
