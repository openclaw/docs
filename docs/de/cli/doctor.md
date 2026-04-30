---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und möchten angeleitete Korrekturen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-04-30T20:05:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Health Checks + Schnellreparaturen für Gateway und Kanäle.

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

- `--no-workspace-suggestions`: Workspace-Memory-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: empfohlene Reparaturen ohne Nachfrage anwenden
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich Überschreiben benutzerdefinierter Dienstkonfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das eifrige Laden von Plugins, damit Headless-Health Checks schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung ihren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und verwirft unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- Prüfungen der Zustandsintegrität erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Ihre Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen lassen sie unverändert.
- Doctor durchsucht auch `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach Legacy-Cron-Job-Formaten und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Doctor repariert fehlende Laufzeitabhängigkeiten gebündelter Plugins, ohne in paketierte globale Installationen zu schreiben. Für root-eigene npm-Installationen oder gehärtete systemd-Units setzen Sie `OPENCLAW_PLUGIN_STAGE_DIR` auf ein beschreibbares Verzeichnis wie `/var/lib/openclaw/plugin-runtime-deps`; es kann auch eine Pfadliste wie `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` sein, wobei frühere Roots schreibgeschützte Lookup-Ebenen sind und der letzte Root das Reparaturziel ist.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.entries` entfernt werden, plus passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung gesund ist.
- Doctor quarantiniert ungültige Plugin-Konfiguration, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus besitzt. Doctor meldet weiterhin Gateway-/Dienstzustand und wendet Nicht-Dienst-Reparaturen an, überspringt aber Dienstinstallation, -Start, -Neustart, -Bootstrap und Legacy-Dienstbereinigung.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und schreibt bei der Reparatur keine Befehls-/Entrypoint-Metadaten für einen laufenden systemd-Gateway-Dienst um. Stoppen Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher absichtlich ersetzen möchten.
- Doctor migriert automatisch alte flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Schlüssel) nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden die Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied die Reihenfolge von Objektschlüsseln ist.
- Doctor enthält eine Bereitschaftsprüfung für Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehls-Owner konfiguriert ist. Der Befehls-Owner ist das menschliche Operatorkonto, das Owner-only-Befehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt jemandem nur, mit dem Bot zu sprechen; wenn Sie einen Absender genehmigt haben, bevor der First-Owner-Bootstrap existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor warnt, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators vorhanden sind. Lokale Codex-App-Server-Starts verwenden isolierte Homes pro Agent, verwenden Sie daher `openclaw migrate codex --dry-run`, um Assets zu inventarisieren, die bewusst befördert werden sollten.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` per SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten.
- Wenn die Kanal-SecretRef-Inspektion in einem Korrekturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann dauerhafte „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway Doctor](/de/gateway/doctor)
