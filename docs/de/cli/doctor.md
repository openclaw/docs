---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Lösungen
    - Sie haben ein Update durchgeführt und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-03T21:28:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Health Checks + schnelle Korrekturen für das Gateway und Kanäle.

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

- `--no-workspace-suggestions`: deaktiviert Vorschläge für Workspace-Speicher/Suche
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene nicht dienstbezogene Reparaturen ohne Nachfrage anwenden; Gateway-Dienstinstallationen und -Neuschreibungen erfordern weiterhin eine interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Dienstkonfiguration, wenn erforderlich
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen und nicht dienstbezogene Reparaturen
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das eifrige Laden von Plugins, damit Headless-Health-Checks schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn ein Check deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder schreibt sie außerhalb des Update-Reparaturmodus jedoch nicht neu. Führen Sie `openclaw gateway install` für einen fehlenden Dienst aus, oder `openclaw gateway install --force`, wenn Sie den Launcher absichtlich ersetzen möchten.
- Zustandsintegritätsprüfungen erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Das Archivieren als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor scannt außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf alte Cron-Job-Formate und kann sie direkt neu schreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers weiterhin das alte `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann fälschliche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-User-Bus-Umgebung fehlt.
- Doctor bereinigt alten Plugin-Abhängigkeits-Staging-Zustand, der von älteren OpenClaw-Versionen erstellt wurde. Außerdem repariert er fehlende konfigurierte herunterladbare Plugins, wenn die Registry sie auflösen kann, und der Doctor-Durchlauf 2026.5.2 installiert automatisch herunterladbare Plugins, die eine ältere Konfiguration bereits verwendet, bevor die Konfiguration für dieses Release als geändert markiert wird.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, zusammen mit passender hängender Kanalkonfiguration, Heartbeat-Zielen und Kanalmodell-Überschreibungen, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor isoliert ungültige Plugin-Konfiguration, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin Gateway-/Dienstzustand und wendet nicht dienstbezogene Reparaturen an, überspringt aber Dienstinstallation/-start/-neustart/-bootstrap und die Bereinigung alter Dienste.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und schreibt während der Reparatur keine Befehls-/Entrypoint-Metadaten für einen laufenden systemd-Gateway-Dienst neu. Stoppen Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher absichtlich ersetzen möchten.
- Doctor migriert alte flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und ähnliche) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Zugangsdaten fehlen.
- Doctor warnt, wenn kein Befehlsbesitzer konfiguriert ist. Der Befehlsbesitzer ist das menschliche Betreiberkonto, das Besitzer-exklusive Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, dass jemand mit dem Bot sprechen kann; wenn Sie einen Absender genehmigt haben, bevor der Bootstrap für den ersten Besitzer existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Betreibers vorhanden sind. Lokale Starts des Codex-App-Servers verwenden isolierte Homes pro Agent, verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst hochgestuft werden sollten.
- Doctor warnt, wenn Skills, die für den Standardagenten erlaubt sind, in der aktuellen Laufzeitumgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder Betriebssystemanforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie den Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker jedoch nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn alte Sandbox-Registry-Dateien (`~/.openclaw/sandbox/containers.json` oder `~/.openclaw/sandbox/browsers.json`) vorhanden sind, meldet Doctor sie; `openclaw doctor --fix` migriert gültige Einträge in geshardete Registry-Verzeichnisse und isoliert ungültige alte Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` von SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Zugangsdaten.
- Wenn die SecretRef-Prüfung für Kanäle in einem Korrekturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Zustandsverzeichnis-Migrationen warnt Doctor, wenn aktivierte Standardkonten für Telegram oder Discord von einem Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Prüfung nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Env-Überschreibungen

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
