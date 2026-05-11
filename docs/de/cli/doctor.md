---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Fehlerbehebungen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-11T20:26:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Integritätsprüfungen + Schnellreparaturen für den Gateway und die Kanäle.

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

Verwenden Sie für kanalspezifische Berechtigungen die Kanal-Probes statt `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Die gezielte Discord-Capabilities-Probe meldet die effektiven Kanalberechtigungen des Bots; die Status-Probe prüft konfigurierte Discord-Kanäle und Ziele für den automatischen Voice-Beitritt.

## Optionen

- `--no-workspace-suggestions`: Workspace-Memory-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Nicht-Service-Reparaturen ohne Nachfrage anwenden; Gateway-Service-Installationen und Umschreibungen erfordern weiterhin eine interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Service-Konfiguration bei Bedarf
- `--non-interactive`: ohne Prompts ausführen; nur sichere Migrationen und Nicht-Service-Reparaturen
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen scannen und aktuelle Übergaben von Gateway-Supervisor-Neustarts melden

Hinweise:

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, da `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; verwenden Sie für nix-openclaw den agent-first-[Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Prompts (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Prompts.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das frühzeitige Laden von Plugins, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Service-Definitionen, installiert oder überschreibt sie jedoch außerhalb des Update-Reparaturmodus nicht. Führen Sie `openclaw gateway install` für einen fehlenden Service aus oder `openclaw gateway install --force`, wenn Sie den Launcher bewusst ersetzen möchten.
- Zustandsintegritätsprüfungen erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Deren Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen belassen sie an Ort und Stelle.
- Doctor scannt außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf veraltete Cron-Job-Strukturen und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt doctor, wenn die Crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann fälschliche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-User-Bus-Umgebung fehlt.
- Wenn WhatsApp aktiviert ist, prüft doctor auf eine degradierte Gateway-Event-Loop mit weiterhin laufenden lokalen `openclaw-tui`-Clients. `doctor --fix` stoppt nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen in die Warteschlange geraten.
- Doctor schreibt veraltete `openai-codex/*`-Modellreferenzen in kanonische `openai/*`-Referenzen um, über primäre Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und veraltete Sitzungs-Routen-Pins hinweg. `--fix` verschiebt Codex-Intent in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge, erhält Auth-Profile-Pins von Sitzungen wie `openai-codex:...`, entfernt veraltete Whole-Agent-/Sitzungs-Runtime-Pins und hält reparierte OpenAI-Agent-Referenzen auf Codex-Auth-Routing statt direkter OpenAI-API-Key-Auth.
- Doctor bereinigt veralteten Plugin-Abhängigkeits-Staging-Zustand, der von älteren OpenClaw-Versionen erstellt wurde. Außerdem repariert es fehlende herunterladbare Plugins, die von der Konfiguration referenziert werden, etwa `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Runtimes. Während Paketaktualisierungen überspringt doctor die Paketmanager-Plugin-Reparatur, bis der Pakettausch abgeschlossen ist; führen Sie anschließend erneut `openclaw doctor --fix` aus, falls ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Wenn der Download fehlschlägt, meldet doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.deny`/`plugins.entries` entfernt werden, außerdem passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor isoliert ungültige Plugin-Konfiguration, indem der betroffene `plugins.entries.<id>`-Eintrag deaktiviert und sein ungültiger `config`-Payload entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus besitzt. Doctor meldet weiterhin Gateway-/Service-Zustand und wendet Nicht-Service-Reparaturen an, überspringt jedoch Service-Installation/-Start/-Neustart/-Bootstrap und die Bereinigung veralteter Services.
- Unter Linux ignoriert doctor inaktive zusätzliche gatewayähnliche systemd-Units und überschreibt während der Reparatur keine Befehls-/Entrypoint-Metadaten für einen laufenden systemd-Gateway-Service. Stoppen Sie den Service zuerst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher bewusst ersetzen möchten.
- Doctor migriert veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Schlüssel) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied die Reihenfolge von Objektschlüsseln ist.
- Doctor enthält eine Bereitschaftsprüfung für Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Embedding-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehlsinhaber konfiguriert ist. Der Befehlsinhaber ist das menschliche Operatorkonto, das owner-only Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt lediglich, mit dem Bot zu sprechen; wenn Sie einen Absender genehmigt haben, bevor First-Owner-Bootstrap existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agents im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators vorhanden sind. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent; verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst hochgestuft werden sollten.
- Doctor entfernt das ausgemusterte `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server behält Codex-native Workspace-Tools immer nativ bei.
- Doctor warnt, wenn Skills, die für den Standard-Agent erlaubt sind, in der aktuellen Runtime-Umgebung nicht verfügbar sind, weil Binaries, Env-Vars, Konfiguration oder OS-Anforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie die Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn veraltete Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet doctor sie; `openclaw doctor --fix` migriert gültige Einträge in geshardete Registry-Verzeichnisse und isoliert ungültige Legacy-Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` SecretRef-verwaltet und im aktuellen Befehlspfad nicht verfügbar sind, meldet doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten.
- Wenn die Kanal-SecretRef-Inspektion in einem Fix-Pfad fehlschlägt, fährt doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Zustandsverzeichnis-Migrationen warnt doctor, wenn aktivierte Standard-Telegram- oder Discord-Konten von Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann persistente „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Zugehörig

- [CLI-Referenz](/de/cli)
- [Gateway doctor](/de/gateway/doctor)
