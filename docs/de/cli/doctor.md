---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Fehlerbehebungen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + angeleitete Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-06T17:53:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Zustandsprüfungen + Schnellreparaturen für Gateway und Kanäle.

Verwandt:

- Fehlerbehebung: [Fehlerbehebung](/de/gateway/troubleshooting)
- Sicherheitsprüfung: [Sicherheit](/de/gateway/security)

## Beispiele

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Optionen

- `--no-workspace-suggestions`: Workspace-Speicher-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Reparaturen außerhalb von Diensten ohne Nachfrage anwenden; Installationen und Neuschreibungen des Gateway-Diensts erfordern weiterhin interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Dienstkonfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen und Reparaturen außerhalb von Diensten
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen und aktuelle Gateway-Supervisor-Übergaben bei Neustarts melden

Hinweise:

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte Doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, weil `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; für nix-openclaw verwenden Sie den agent-first [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Eingabeaufforderungen (wie Schlüsselbund-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das vorzeitige Laden von Plugins, damit Headless-Zustandsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder schreibt sie aber außerhalb des Update-Reparaturmodus nicht neu. Führen Sie `openclaw gateway install` für einen fehlenden Dienst aus oder `openclaw gateway install --force`, wenn Sie den Launcher absichtlich ersetzen möchten.
- Zustandsintegritätsprüfungen erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Das Archivieren als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor durchsucht außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach veralteten Cron-Job-Strukturen und kann sie direkt neu schreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gewartet und kann falsche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-Benutzerbus-Umgebung fehlt.
- Wenn WhatsApp aktiviert ist, prüft Doctor auf eine beeinträchtigte Gateway-Event-Loop, während lokale `openclaw-tui`-Clients noch laufen. `doctor --fix` stoppt nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen eingereiht werden.
- Doctor schreibt veraltete `openai-codex/*`-Modellreferenzen in kanonische `openai/*`-Referenzen um, über primäre Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und veraltete Sitzungsrouten-Pins hinweg. `--fix` wählt `agentRuntime.id: "codex"` nur aus, wenn das Codex-Plugin installiert und aktiviert ist, den `codex`-Harness bereitstellt und nutzbares OAuth hat; andernfalls wählt es `agentRuntime.id: "pi"`, damit die Route auf dem standardmäßigen OpenClaw-Runner bleibt.
- Doctor bereinigt veralteten Plugin-Abhängigkeits-Staging-Zustand, der von älteren OpenClaw-Versionen erstellt wurde. Er repariert außerdem fehlende herunterladbare Plugins, die von der Konfiguration referenziert werden, etwa `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Runtimes. Während Paketaktualisierungen überspringt Doctor die Paketmanager-Plugin-Reparatur, bis der Pakettausch abgeschlossen ist; führen Sie anschließend erneut `openclaw doctor --fix` aus, falls ein konfiguriertes Plugin weiterhin wiederhergestellt werden muss. Wenn der Download fehlschlägt, meldet Doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, plus passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor isoliert ungültige Plugin-Konfiguration, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und seine ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus besitzt. Doctor meldet weiterhin Gateway-/Dienstzustand und wendet Reparaturen außerhalb von Diensten an, überspringt aber Dienstinstallation/-start/-neustart/-bootstrap und die Bereinigung veralteter Dienste.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und schreibt Befehls-/Entry-Point-Metadaten für einen laufenden systemd-Gateway-Dienst während der Reparatur nicht neu. Stoppen Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher absichtlich ersetzen möchten.
- Doctor migriert veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und ähnliche) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge von Objektschlüsseln ist.
- Doctor enthält eine Prüfung der Bereitschaft für Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Embedding-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehlsbesitzer konfiguriert ist. Der Befehlsbesitzer ist das menschliche Operatorkonto, das Owner-only-Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing lässt jemanden nur mit dem Bot sprechen; wenn Sie einen Absender genehmigt haben, bevor der Bootstrap für den ersten Besitzer existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators vorhanden sind. Lokale Codex-App-Server-Starts verwenden isolierte agentenspezifische Homes; verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst übertragen werden sollten.
- Doctor warnt, wenn für den Standardagenten erlaubte Skills in der aktuellen Laufzeitumgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder Betriebssystemanforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Voraussetzung, wenn Sie den Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn veraltete Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet Doctor sie; `openclaw doctor --fix` migriert gültige Einträge in geshardete Registry-Verzeichnisse und isoliert ungültige veraltete Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` von SecretRef verwaltet und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten.
- Wenn die Kanal-SecretRef-Inspektion in einem Korrekturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, anstatt frühzeitig zu beenden.
- Nach Zustandsverzeichnis-Migrationen warnt Doctor, wenn aktivierte Standardkonten für Telegram oder Discord von Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann dauerhafte „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway Doctor](/de/gateway/doctor)
