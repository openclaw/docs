---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Lösungen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-10T19:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Integritätsprüfungen + Schnellreparaturen für den Gateway und Kanäle.

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

Für kanalspezifische Berechtigungen verwenden Sie die Kanal-Probes statt `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Die gezielte Discord-Fähigkeiten-Probe meldet die effektiven Kanalberechtigungen des Bots; die Status-Probe prüft konfigurierte Discord-Kanäle und Ziele für automatischen Sprachbeitritt.

## Optionen

- `--no-workspace-suggestions`: Workspace-Speicher-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Reparaturen ohne Service-Bezug ohne Nachfrage anwenden; Gateway-Service-Installationen und Umschreibungen erfordern weiterhin interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Service-Konfiguration bei Bedarf
- `--non-interactive`: ohne Prompts ausführen; nur sichere Migrationen und Reparaturen ohne Service-Bezug
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen scannen und aktuelle Übergaben bei Gateway-Supervisor-Neustarts melden

Hinweise:

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, weil `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; verwenden Sie für nix-openclaw den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Prompts (wie Keychain-/OAuth-Reparaturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (cron, Telegram, kein Terminal) überspringen Prompts.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen eifriges Plugin-Laden, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Service-Definitionen, installiert oder überschreibt sie jedoch außerhalb des Update-Reparaturmodus nicht. Führen Sie `openclaw gateway install` für einen fehlenden Service aus oder `openclaw gateway install --force`, wenn Sie den Launcher absichtlich ersetzen möchten.
- Statusintegritätsprüfungen erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Ihre Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor scannt außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf ältere Cron-Job-Formate und kann sie direkt überschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers noch das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann falsche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-User-Bus-Umgebung fehlt.
- Wenn WhatsApp aktiviert ist, prüft Doctor auf eine beeinträchtigte Gateway-Ereignisschleife, während lokale `openclaw-tui`-Clients noch laufen. `doctor --fix` stoppt nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen eingereiht werden.
- Doctor schreibt ältere `openai-codex/*`-Modellreferenzen in kanonische `openai/*`-Referenzen über primäre Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und veraltete Sitzungs-Routen-Pins um. `--fix` verschiebt Codex-Intent in provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge, behält Sitzungs-Auth-Profil-Pins wie `openai-codex:...` bei, entfernt veraltete Runtime-Pins für ganze Agenten/Sitzungen und belässt reparierte OpenAI-Agent-Referenzen auf Codex-Auth-Routing statt direkter OpenAI-API-Schlüssel-Authentifizierung.
- Doctor bereinigt älteren Plugin-Abhängigkeits-Staging-Status, der von älteren OpenClaw-Versionen erstellt wurde. Außerdem repariert es fehlende herunterladbare Plugins, auf die die Konfiguration verweist, etwa `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Runtimes. Während Paketaktualisierungen überspringt Doctor die Paketmanager-Plugin-Reparatur, bis der Pakettausch abgeschlossen ist; führen Sie danach erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Wenn der Download fehlschlägt, meldet Doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, plus passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor quarantänisiert ungültige Plugin-Konfiguration, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, damit andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus besitzt. Doctor meldet weiterhin Gateway-/Service-Integrität und wendet Reparaturen ohne Service-Bezug an, überspringt aber Service-Installation/-Start/-Neustart/-Bootstrap und die Bereinigung älterer Services.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und überschreibt bei der Reparatur keine Befehls-/Entrypoint-Metadaten für einen laufenden systemd-Gateway-Service. Stoppen Sie zuerst den Service oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher absichtlich ersetzen möchten.
- Doctor migriert automatisch ältere flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Schlüssel) nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied die Reihenfolge von Objektschlüsseln ist.
- Doctor enthält eine Bereitschaftsprüfung für Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Einbettungszugangsdaten fehlen.
- Doctor warnt, wenn kein Befehlsbesitzer konfiguriert ist. Der Befehlsbesitzer ist das menschliche Operatorkonto, das Owner-only-Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, dass jemand mit dem Bot spricht; wenn Sie einen Absender genehmigt haben, bevor der First-Owner-Bootstrap existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators vorhanden sind. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent, verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst übernommen werden sollten.
- Doctor entfernt das eingestellte `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server belässt Codex-native Workspace-Tools immer nativ.
- Doctor warnt, wenn Skills, die für den Standardagenten erlaubt sind, in der aktuellen Runtime-Umgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder OS-Anforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie die Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine prägnante Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn ältere Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet Doctor sie; `openclaw doctor --fix` migriert gültige Einträge in geshardete Registry-Verzeichnisse und quarantänisiert ungültige ältere Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` SecretRef-verwaltet und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Zugangsdaten.
- Wenn die Kanal-SecretRef-Prüfung in einem Reparaturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Statusverzeichnis-Migrationen warnt Doctor, wenn aktivierte Standard-Telegram- oder Discord-Konten von Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn Token-Prüfung nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

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
