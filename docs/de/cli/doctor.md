---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und möchten angeleitete Lösungen
    - Sie haben ein Update durchgeführt und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-05T08:25:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Integritätsprüfungen + Schnellreparaturen für Gateway und Kanäle.

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
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Reparaturen außerhalb von Diensten ohne Nachfrage anwenden; Gateway-Dienstinstallationen und Umschreibungen erfordern weiterhin eine interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Dienstkonfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen und Reparaturen außerhalb von Diensten
- `--generate-gateway-token`: Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen prüfen und aktuelle Übergaben von Gateway-Supervisor-Neustarts melden

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das vorzeitige Laden von Plugins, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder überschreibt sie aber außerhalb des Update-Reparaturmodus nicht. Führen Sie `openclaw gateway install` für einen fehlenden Dienst aus, oder `openclaw gateway install --force`, wenn Sie den Launcher bewusst ersetzen möchten.
- Zustandsintegritätsprüfungen erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Ihre Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor prüft außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf veraltete Cron-Job-Strukturen und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann falsche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-User-Bus-Umgebung fehlt.
- Wenn WhatsApp aktiviert ist, prüft Doctor auf eine beeinträchtigte Gateway-Event-Loop, während lokale `openclaw-tui`-Clients noch ausgeführt werden. `doctor --fix` stoppt nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen eingereiht werden.
- Doctor bereinigt veralteten Plugin-Abhängigkeits-Staging-Zustand, der von älteren OpenClaw-Versionen erstellt wurde. Außerdem repariert es fehlende herunterladbare Plugins, die von der Konfiguration referenziert werden, z. B. `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Laufzeiten. Während Paketaktualisierungen überspringt Doctor die Plugin-Reparatur durch den Paketmanager, bis der Paketaustausch abgeschlossen ist; führen Sie danach erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Wenn der Download fehlschlägt, meldet Doctor den Installationsfehler und bewahrt den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch auf.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, außerdem passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung intakt ist.
- Doctor stellt ungültige Plugin-Konfiguration unter Quarantäne, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin Gateway-/Dienstintegrität und wendet Reparaturen außerhalb von Diensten an, überspringt aber Dienstinstallation, -start, -neustart, Bootstrap und Bereinigung veralteter Dienste.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und überschreibt während der Reparatur keine Befehls-/Entry-Point-Metadaten für einen laufenden systemd-Gateway-Dienst. Stoppen Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher bewusst ersetzen möchten.
- Doctor migriert automatisch veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Schlüssel) nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied die Reihenfolge von Objektschlüsseln ist.
- Doctor enthält eine Bereitschaftsprüfung für Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Zugangsdaten fehlen.
- Doctor warnt, wenn kein Befehlsinhaber konfiguriert ist. Der Befehlsinhaber ist das menschliche Operatorkonto, das Owner-only-Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, mit dem Bot zu sprechen; wenn Sie einen Absender genehmigt haben, bevor der Bootstrap des ersten Owners existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Codex-Modus-Agenten konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators existieren. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent, verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst übernommen werden sollten.
- Doctor warnt, wenn Skills, die für den Standard-Agenten erlaubt sind, in der aktuellen Laufzeitumgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder Betriebssystemanforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie den Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn veraltete Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet Doctor sie; `openclaw doctor --fix` migriert gültige Einträge in fragmentierte Registry-Verzeichnisse und stellt ungültige veraltete Dateien unter Quarantäne.
- Wenn `gateway.auth.token`/`gateway.auth.password` per SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Zugangsdaten.
- Wenn die Channel-SecretRef-Inspektion in einem Reparaturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Migrationen des Zustandsverzeichnisses warnt Doctor, wenn aktivierte Standardkonten für Telegram oder Discord von Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann persistente „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway doctor](/de/gateway/doctor)
