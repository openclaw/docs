---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Fehlerbehebungen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Zustandsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-12T08:45:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Integritätsprüfungen und schnelle Reparaturen für den Gateway und Kanäle.

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

Verwenden Sie für kanalspezifische Berechtigungen die Kanalprüfungen statt `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Die gezielte Discord-Fähigkeitsprüfung meldet die effektiven Kanalberechtigungen des Bots; die Statusprüfung auditiert konfigurierte Discord-Kanäle und Ziele für den automatischen Voice-Beitritt.

## Optionen

- `--no-workspace-suggestions`: Vorschläge für Arbeitsbereichsspeicher/-suche deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Reparaturen ohne Service-Bezug ohne Nachfrage anwenden; Gateway-Service-Installationen und -Neuschreibungen erfordern weiterhin eine interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Service-Konfiguration, wenn nötig
- `--non-interactive`: ohne Nachfragen ausführen; nur sichere Migrationen und Reparaturen ohne Service-Bezug
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen prüfen und aktuelle Übergaben von Gateway-Supervisor-Neustarts melden

Hinweise:

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, weil `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; für nix-openclaw verwenden Sie den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Abfragen (wie Schlüsselbund-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Abfragen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das eifrige Laden von Plugins, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung ihren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt eine Sicherung nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Service-Definitionen, installiert oder schreibt sie aber außerhalb des Update-Reparaturmodus nicht neu. Führen Sie `openclaw gateway install` für einen fehlenden Service aus oder `openclaw gateway install --force`, wenn Sie den Launcher bewusst ersetzen möchten.
- Prüfungen der Zustandsintegrität erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Ihre Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor prüft außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf ältere Formen von Cron-Jobs und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt doctor, wenn die crontab des Benutzers noch das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann falsche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-Benutzerbus-Umgebung fehlt.
- Wenn WhatsApp aktiviert ist, prüft doctor auf eine beeinträchtigte Gateway-Ereignisschleife mit weiterhin laufenden lokalen `openclaw-tui`-Clients. `doctor --fix` stoppt nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen warten.
- Doctor schreibt ältere `openai-codex/*`-Modellreferenzen in kanonische `openai/*`-Referenzen um, über primäre Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und veraltete Sitzungsrouten-Pins hinweg. `--fix` verschiebt die Codex-Absicht auf Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge, bewahrt Sitzungs-Auth-Profil-Pins wie `openai-codex:...`, entfernt veraltete Runtime-Pins für ganze Agenten/Sitzungen und hält reparierte OpenAI-Agentenreferenzen auf Codex-Auth-Routing statt direkter OpenAI-API-Schlüssel-Authentifizierung.
- Doctor bereinigt veraltete Bereitstellungszustände für Plugin-Abhängigkeiten, die von älteren OpenClaw-Versionen erstellt wurden, und verknüpft das Hostpaket `openclaw` für verwaltete npm-Plugins neu, die es als Peer-Abhängigkeit deklarieren. Außerdem repariert es fehlende herunterladbare Plugins, die von der Konfiguration referenziert werden, etwa `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Runtimes. Während Paketaktualisierungen überspringt doctor die Reparatur von Paketmanager-Plugins, bis der Pakettausch abgeschlossen ist; führen Sie anschließend erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Wenn der Download fehlschlägt, meldet doctor den Installationsfehler und bewahrt den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.deny`/`plugins.entries` entfernt werden, plus passende lose Kanal-Konfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung intakt ist.
- Doctor isoliert ungültige Plugin-Konfiguration, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und seine ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt ohnehin nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus besitzt. Doctor meldet weiterhin Gateway-/Service-Integrität und wendet Reparaturen ohne Service-Bezug an, überspringt aber Service-Installation/-Start/-Neustart/-Bootstrap und die Bereinigung veralteter Services.
- Unter Linux ignoriert doctor inaktive zusätzliche gateway-ähnliche systemd-Units und schreibt während der Reparatur keine Befehls-/Einstiegspunkt-Metadaten für einen laufenden systemd-Gateway-Service um. Stoppen Sie zuerst den Service oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher bewusst ersetzen möchten.
- Doctor migriert ältere flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Einstellungen) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden die Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Embedding-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehlsinhaber konfiguriert ist. Der Befehlsinhaber ist das menschliche Operatorkonto, das owner-only-Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing lässt jemanden nur mit dem Bot sprechen; wenn Sie einen Absender genehmigt haben, bevor der Bootstrap für den ersten Inhaber existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators existieren. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent, verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die gezielt hochgestuft werden sollten.
- Doctor entfernt das außer Dienst gestellte `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server hält Codex-native Arbeitsbereichstools immer nativ.
- Doctor warnt, wenn Skills, die für den Standardagenten erlaubt sind, in der aktuellen Laufzeitumgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder Betriebssystemanforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie den Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn ältere Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet doctor sie; `openclaw doctor --fix` migriert gültige Einträge in aufgeteilte Registry-Verzeichnisse und isoliert ungültige Legacy-Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` SecretRef-verwaltet und im aktuellen Befehlspfad nicht verfügbar sind, meldet doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten.
- Wenn die Prüfung von Kanal-SecretRefs in einem Reparaturpfad fehlschlägt, fährt doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Zustandsverzeichnis-Migrationen warnt doctor, wenn aktivierte Standard-Telegram- oder Discord-Konten von einem Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Prüfung nicht verfügbar ist, meldet doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

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
- [Gateway doctor](/de/gateway/doctor)
