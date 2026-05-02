---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Problembehebungen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-05-02T20:43:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
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
- `--repair`: empfohlene Reparaturen ohne Service-Bezug ohne Nachfrage anwenden; Gateway-Service-Installationen und Neuschreibungen erfordern weiterhin eine interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Service-Konfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen und Reparaturen ohne Service-Bezug
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Performance: Nicht interaktive `doctor`-Ausführungen überspringen vorzeitiges Plugin-Laden, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Service-Definitionen, installiert oder schreibt sie aber außerhalb des Update-Reparaturmodus nicht neu. Führen Sie `openclaw gateway install` für einen fehlenden Service aus, oder `openclaw gateway install --force`, wenn Sie den Launcher bewusst ersetzen möchten.
- Zustandsintegritätsprüfungen erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Das Archivieren als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor durchsucht außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach veralteten Cron-Job-Formaten und kann sie direkt neu schreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Unter Linux warnt Doctor, wenn die crontab des Benutzers weiterhin das veraltete `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann falsche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-User-Bus-Umgebung fehlt.
- Doctor bereinigt veralteten Plugin-Dependency-Staging-Zustand, der von älteren OpenClaw-Versionen erstellt wurde. Er repariert außerdem fehlende konfigurierte herunterladbare Plugins, wenn die Registry sie auflösen kann, und der Doctor-Durchlauf 2026.5.2 installiert automatisch herunterladbare Plugins, die eine ältere Konfiguration bereits verwendet, bevor er die Konfiguration für dieses Release als berührt markiert.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, zusätzlich zu passender verwaister Kanalkonfiguration, Heartbeat-Zielen und Kanalmodell-Overrides, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor isoliert ungültige Plugin-Konfiguration, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Payload entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, damit andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin Gateway-/Service-Zustand und wendet Reparaturen ohne Service-Bezug an, überspringt aber Service-Installation/-Start/-Neustart/-Bootstrap und die Bereinigung veralteter Services.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und schreibt während der Reparatur keine Befehls-/Entrypoint-Metadaten für einen laufenden systemd-Gateway-Service neu. Stoppen Sie zuerst den Service oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher bewusst ersetzen möchten.
- Doctor migriert veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Einstellungen) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden die Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied in der Reihenfolge der Objektschlüssel liegt.
- Doctor enthält eine Bereitschaftsprüfung für die Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Embedding-Zugangsdaten fehlen.
- Doctor warnt, wenn kein Befehlsinhaber konfiguriert ist. Der Befehlsinhaber ist das menschliche Operatorkonto, das Besitzerbefehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, mit dem Bot zu sprechen; wenn Sie einen Absender genehmigt haben, bevor der First-Owner-Bootstrap existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators vorhanden sind. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent. Verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst übernommen werden sollten.
- Doctor warnt, wenn Skills, die für den Standardagenten erlaubt sind, in der aktuellen Laufzeitumgebung nicht verfügbar sind, weil Binaries, Env Vars, Konfiguration oder OS-Anforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn Sie den Skill aktiv halten möchten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine prägnante Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` über SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Plaintext-Fallback-Zugangsdaten.
- Wenn die SecretRef-Prüfung eines Kanals in einem Fix-Pfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Zustandsverzeichnis-Migrationen warnt Doctor, wenn aktivierte standardmäßige Telegram- oder Discord-Konten von Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Prüfung nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

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
