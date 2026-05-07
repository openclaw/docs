---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Fehlerbehebungen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Zustandsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-07T13:14:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Integritätsprüfungen + schnelle Korrekturen für Gateway und Kanäle.

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

Verwenden Sie für kanalspezifische Berechtigungen die Kanalprüfungen statt `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Die gezielte Discord-Fähigkeitsprüfung meldet die effektiven Kanalberechtigungen des Bots; die Statusprüfung auditiert konfigurierte Discord-Kanäle und Ziele für den automatischen Sprachbeitritt.

## Optionen

- `--no-workspace-suggestions`: Workspace-Speicher-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Reparaturen außerhalb von Diensten ohne Nachfrage anwenden; Gateway-Dienstinstallationen und Umschreibungen erfordern weiterhin eine interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Dienstkonfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen und Reparaturen außerhalb von Diensten
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen scannen und aktuelle Gateway-Supervisor-Neustartübergaben melden

Hinweise:

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, weil `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; für nix-openclaw verwenden Sie den agent-first [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das vorzeitige Laden von Plugins, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgeführt wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder überschreibt sie aber außerhalb des Update-Reparaturmodus nicht. Führen Sie `openclaw gateway install` für einen fehlenden Dienst aus oder `openclaw gateway install --force`, wenn Sie den Launcher bewusst ersetzen möchten.
- Prüfungen der Zustandsintegrität erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Ihre Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor scannt auch `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf alte Cron-Job-Formate und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt doctor, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann fälschliche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-Benutzerbus-Umgebung fehlt.
- Wenn WhatsApp aktiviert ist, prüft doctor auf eine beeinträchtigte Gateway-Ereignisschleife, während lokale `openclaw-tui`-Clients noch laufen. `doctor --fix` stoppt nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen eingereiht werden.
- Doctor schreibt veraltete `openai-codex/*`-Modellreferenzen in kanonische `openai/*`-Referenzen um, über Primärmodelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodell-Überschreibungen und veraltete Sitzungsrouten-Pins hinweg. `--fix` wählt `agentRuntime.id: "codex"` nur aus, wenn das Codex-Plugin installiert und aktiviert ist, das `codex`-Harness beiträgt und nutzbares OAuth hat; andernfalls wählt es `agentRuntime.id: "pi"`, damit die Route auf dem Standard-OpenClaw-Runner bleibt.
- Doctor bereinigt alte Plugin-Abhängigkeits-Staging-Zustände, die von älteren OpenClaw-Versionen erstellt wurden. Außerdem repariert es fehlende herunterladbare Plugins, auf die in der Konfiguration verwiesen wird, etwa `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Runtimes. Während Paketaktualisierungen überspringt doctor die Plugin-Reparatur durch den Paketmanager, bis der Pakettausch abgeschlossen ist; führen Sie danach erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Wenn der Download fehlschlägt, meldet doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfigurationen, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, zusammen mit passender hängender Kanalkonfiguration, Heartbeat-Zielen und Kanalmodell-Überschreibungen, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor isoliert ungültige Plugin-Konfigurationen, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin Gateway-/Dienstintegrität und wendet Reparaturen außerhalb von Diensten an, überspringt aber Dienstinstallation/-start/-neustart/-bootstrap sowie die Bereinigung alter Dienste.
- Unter Linux ignoriert doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und überschreibt während der Reparatur keine Befehls-/Einstiegspunkt-Metadaten für einen laufenden systemd-Gateway-Dienst. Stoppen Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher bewusst ersetzen möchten.
- Doctor migriert veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Einträge) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden die Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Embedding-Zugangsdaten fehlen.
- Doctor warnt, wenn kein Befehlseigentümer konfiguriert ist. Der Befehlseigentümer ist das menschliche Operatorkonto, das Eigentümerbefehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, mit dem Bot zu sprechen; wenn Sie einen Absender genehmigt haben, bevor der erste Eigentümer-Bootstrap existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators existieren. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent, verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst übernommen werden sollten.
- Doctor warnt, wenn Skills, die für den Standard-Agent erlaubt sind, in der aktuellen Laufzeitumgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder Betriebssystemanforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie den Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn veraltete Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet doctor sie; `openclaw doctor --fix` migriert gültige Einträge in geshardete Registry-Verzeichnisse und isoliert ungültige alte Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` von SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Zugangsdaten.
- Wenn die SecretRef-Prüfung eines Kanals in einem Korrekturpfad fehlschlägt, fährt doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Zustandsverzeichnis-Migrationen warnt doctor, wenn aktivierte Standard-Telegram- oder Discord-Konten von Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Prüfung nicht verfügbar ist, meldet doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Umgebungsüberschreibungen

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann dauerhafte „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Diagnose](/de/gateway/doctor)
