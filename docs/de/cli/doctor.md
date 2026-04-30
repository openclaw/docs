---
read_when:
    - Sie haben Verbindungs- oder Authentifizierungsprobleme und möchten angeleitete Fehlerbehebungen
    - Sie haben ein Update durchgeführt und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Zustandsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-04-30T06:45:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Healthchecks + Schnellkorrekturen für Gateway und Kanäle.

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

- `--no-workspace-suggestions`: Workspace-Speicher-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Reparaturen ohne Nachfrage anwenden
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Dienstkonfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen
- `--generate-gateway-token`: Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Performance: Nicht interaktive `doctor`-Ausführungen überspringen das frühzeitige Laden von Plugins, damit Headless-Healthchecks schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung deren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- Zustandsintegritätsprüfungen erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Das Archivieren als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor scannt auch `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach Legacy-Cron-Job-Strukturen und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Doctor repariert fehlende gebündelte Plugin-Laufzeitabhängigkeiten, ohne in paketierte globale Installationen zu schreiben. Setzen Sie bei root-eigenen npm-Installationen oder gehärteten systemd-Units `OPENCLAW_PLUGIN_STAGE_DIR` auf ein beschreibbares Verzeichnis wie `/var/lib/openclaw/plugin-runtime-deps`; es kann auch eine Pfadliste wie `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` sein, wobei frühere Wurzeln schreibgeschützte Nachschlageebenen sind und die letzte Wurzel das Reparaturziel ist.
- Doctor repariert veraltete Plugin-Konfigurationen, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, plus passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor quarantäniert ungültige Plugin-Konfigurationen, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin Gateway-/Dienstzustand und wendet Reparaturen ohne Dienstbezug an, überspringt aber Dienstinstallation, Start, Neustart, Bootstrap und Legacy-Dienstbereinigung.
- Unter Linux ignoriert Doctor inaktive zusätzliche gateway-artige systemd-Units und schreibt bei der Reparatur keine Befehls-/Einstiegspunkt-Metadaten für einen laufenden systemd-Gateway-Dienst um. Stoppen Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher bewusst ersetzen möchten.
- Doctor migriert automatisch alte flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Schlüssel) nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehlseigentümer konfiguriert ist. Der Befehlseigentümer ist das menschliche Operatorkonto, das owner-only Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, mit dem Bot zu sprechen; wenn Sie einen Absender genehmigt haben, bevor der First-Owner-Bootstrap existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` SecretRef-verwaltet und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten.
- Wenn die Kanal-SecretRef-Inspektion in einem Korrekturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann dauerhafte Fehler wegen „nicht autorisiert“ verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway doctor](/de/gateway/doctor)
