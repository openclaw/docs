---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Fehlerbehebungen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Zustandsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-06T06:41:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Statusprüfungen + schnelle Korrekturen für Gateway und Kanäle.

Zugehörig:

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

- `--no-workspace-suggestions`: Workspace-Speicher-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Reparaturen außerhalb von Diensten ohne Nachfrage anwenden; Installationen und Neuschreibungen des Gateway-Dienstes erfordern weiterhin interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Dienstkonfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen und Reparaturen außerhalb von Diensten
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen scannen und aktuelle Gateway-Supervisor-Neustartübergaben melden

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das frühzeitige Laden von Plugins, damit Headless-Statusprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder überschreibt sie aber außerhalb des Update-Reparaturmodus nicht. Führen Sie `openclaw gateway install` für einen fehlenden Dienst aus, oder `openclaw gateway install --force`, wenn Sie den Launcher absichtlich ersetzen möchten.
- Zustandsintegritätsprüfungen erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Ihre Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen belassen sie an Ort und Stelle.
- Doctor scannt außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach veralteten Cron-Job-Formaten und kann sie direkt überschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann fälschliche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-Benutzerbus-Umgebung fehlt.
- Wenn WhatsApp aktiviert ist, prüft Doctor auf eine beeinträchtigte Gateway-Ereignisschleife, während lokale `openclaw-tui`-Clients noch ausgeführt werden. `doctor --fix` stoppt nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen eingereiht werden.
- Doctor schreibt veraltete `openai-codex/*`-Modellreferenzen in kanonische `openai/*`-Referenzen um, über primäre Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und veraltete Sitzungsrouten-Pins hinweg. `--fix` wählt `agentRuntime.id: "codex"` nur aus, wenn das Codex-Plugin installiert und aktiviert ist, das `codex`-Harness bereitstellt und nutzbares OAuth hat; andernfalls wählt es `agentRuntime.id: "pi"`, damit die Route auf dem Standard-OpenClaw-Runner bleibt.
- Doctor bereinigt veralteten Staging-Zustand für Plugin-Abhängigkeiten, der von älteren OpenClaw-Versionen erstellt wurde. Außerdem repariert es fehlende herunterladbare Plugins, auf die von der Konfiguration verwiesen wird, zum Beispiel `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Runtimes. Während Paketaktualisierungen überspringt Doctor die Paketmanager-Plugin-Reparatur, bis der Paketaustausch abgeschlossen ist; führen Sie danach erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Wenn der Download fehlschlägt, meldet Doctor den Installationsfehler und bewahrt den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch auf.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, plus passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Überschreibungen, wenn die Plugin-Erkennung gesund ist.
- Doctor quarantänisiert ungültige Plugin-Konfiguration, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültiger `config`-Payload entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, damit andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus besitzt. Doctor meldet weiterhin Gateway-/Dienstzustand und wendet Reparaturen außerhalb von Diensten an, überspringt aber Dienstinstallation, Start, Neustart, Bootstrap und Bereinigung veralteter Dienste.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und überschreibt während der Reparatur keine Befehls-/Entrypoint-Metadaten für einen laufenden systemd-Gateway-Dienst. Stoppen Sie den Dienst zuerst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher absichtlich ersetzen möchten.
- Doctor migriert veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Werte) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehlseigentümer konfiguriert ist. Der Befehlseigentümer ist das menschliche Operatorkonto, das Eigentümerbefehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, dass jemand mit dem Bot spricht; wenn Sie einen Absender genehmigt haben, bevor der Erst-Eigentümer-Bootstrap existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agents im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators existieren. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent; verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst übernommen werden sollten.
- Doctor warnt, wenn für den Standard-Agent erlaubte Skills in der aktuellen Laufzeitumgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder OS-Anforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie die Skill aktiv halten möchten.
- Wenn Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn veraltete Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet Doctor sie; `openclaw doctor --fix` migriert gültige Einträge in aufgeteilte Registry-Verzeichnisse und quarantänisiert ungültige veraltete Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` von SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten.
- Wenn die Channel-SecretRef-Inspektion in einem Korrekturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Zustandsverzeichnis-Migrationen warnt Doctor, wenn aktivierte Standardkonten für Telegram oder Discord von Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Überschreibungen für Umgebungsvariablen

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann dauerhafte „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Zugehörig

- [CLI-Referenz](/de/cli)
- [Gateway-Diagnose](/de/gateway/doctor)
