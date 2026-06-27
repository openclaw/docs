---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und möchten angeleitete Korrekturen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnose
x-i18n:
    generated_at: "2026-06-27T17:18:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Health Checks + Schnellkorrekturen für Gateway und Kanäle.

Verwandt:

- Fehlerbehebung: [Fehlerbehebung](/de/gateway/troubleshooting)
- Sicherheitsaudit: [Sicherheit](/de/gateway/security)

## Warum Verwenden

`openclaw doctor` ist die Health-Oberfläche von OpenClaw. Verwenden Sie sie, wenn Gateway,
Kanäle, Plugins, Skills, Modell-Routing, lokaler Zustand oder Konfigurationsmigrationen sich
nicht wie erwartet verhalten und Sie einen Befehl möchten, der erklären kann, was
falsch ist.

Doctor hat drei Haltungen:

| Haltung     | Befehl                  | Verhalten                                                                                           |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| Prüfen      | `openclaw doctor`       | Menschenorientierte Prüfungen und geführte Eingabeaufforderungen.                                   |
| Reparieren  | `openclaw doctor --fix` | Wendet unterstützte Reparaturen an, mit Eingabeaufforderungen, sofern nicht-interaktive Reparatur nicht sicher ist. |
| Lint        | `openclaw doctor --lint` | Schreibgeschützte strukturierte Findings für CI, Preflight und Review-Gates.                        |

Bevorzugen Sie `--lint`, wenn Automatisierung ein stabiles Ergebnis benötigt. Bevorzugen Sie `--fix`, wenn ein
menschlicher Operator ausdrücklich möchte, dass doctor Konfiguration oder Zustand bearbeitet.

## Beispiele

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

Verwenden Sie für kanalspezifische Berechtigungen die Kanal-Probes statt `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Die gezielte Discord-Capabilities-Probe meldet die effektiven Kanalberechtigungen des Bots; die Status-Probe auditiert konfigurierte Discord-Kanäle und Ziele für automatisches Voice-Beitreten.

## Optionen

- `--no-workspace-suggestions`: deaktiviert Vorschläge aus Workspace Memory/Suche
- `--yes`: akzeptiert Standardwerte ohne Nachfrage
- `--repair`: wendet empfohlene Nicht-Service-Reparaturen ohne Nachfrage an; Gateway-Service-Installationen und Umschreibungen erfordern weiterhin interaktive Bestätigung oder explizite Gateway-Befehle
- `--fix`: Alias für `--repair`
- `--force`: wendet aggressive Reparaturen an, einschließlich Überschreiben benutzerdefinierter Service-Konfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen und Nicht-Service-Reparaturen
- `--generate-gateway-token`: generiert und konfiguriert ein Gateway-Token
- `--allow-exec`: erlaubt doctor, konfigurierte exec SecretRefs beim Verifizieren von Secrets auszuführen
- `--deep`: scannt Systemdienste auf zusätzliche Gateway-Installationen und meldet aktuelle Übergaben von Gateway-Supervisor-Neustarts
- `--lint`: führt modernisierte Health Checks im schreibgeschützten Modus aus und gibt diagnostische Findings aus
- `--post-upgrade`: führt Plugin-Kompatibilitäts-Probes nach einem Upgrade aus; gibt Findings an stdout aus; beendet mit Code 1, wenn Findings auf Error-Ebene vorhanden sind
- `--json`: mit `--lint` JSON-Findings statt menschenlesbarer Ausgabe ausgeben; mit `--post-upgrade` einen maschinenlesbaren JSON-Umschlag ausgeben (`{ probesRun, findings }`)
- `--severity-min <level>`: mit `--lint` Findings unterhalb von `info`, `warning` oder `error` verwerfen
- `--all`: mit `--lint` alle registrierten Prüfungen ausführen, einschließlich Opt-in-Prüfungen, die aus dem Standard-Automatisierungsset ausgeschlossen sind
- `--skip <id>`: mit `--lint` eine Prüfungs-ID überspringen; wiederholen, um mehr als eine zu überspringen
- `--only <id>`: mit `--lint` nur eine Prüfungs-ID ausführen; wiederholen, um eine kleine ausgewählte Menge auszuführen

## Lint-Modus

`openclaw doctor --lint` ist die schreibgeschützte Automatisierungshaltung für doctor-Prüfungen.
Sie verwendet den strukturierten Health-Check-Pfad, fragt nicht nach und repariert oder überschreibt
keine Konfiguration bzw. keinen Zustand. Verwenden Sie sie in CI, Preflight-Skripten und Review-Workflows,
wenn Sie maschinenlesbare Findings statt geführter Reparaturaufforderungen möchten.
Lint-Ausgabeoptionen wie `--json`, `--severity-min`, `--all`, `--only` und `--skip`
werden nur mit `--lint` akzeptiert.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Die menschenlesbare Ausgabe ist kompakt:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON-Ausgabe ist die Skripting-Oberfläche für Lint-Läufe:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Exit-Verhalten:

- `0`: keine Findings auf oder über dem ausgewählten Severity-Schwellenwert
- `1`: mindestens ein Finding erfüllt den ausgewählten Schwellenwert
- `2`: Befehls-/Runtime-Fehler, bevor Lint-Findings erzeugt werden können

`--severity-min` steuert sowohl sichtbare Findings als auch den Exit-Schwellenwert. Zum
Beispiel kann `openclaw doctor --lint --severity-min error` keine Findings ausgeben und
mit `0` beenden, selbst wenn Findings mit niedrigerer Severity wie `info` oder `warning` vorhanden sind.

`--all` steuert, welche Prüfungen vor dem Severity-Filtering ausgewählt werden. Der
standardmäßige Lint-Lauf ist das stabile Automatisierungs-Gate und schließt Prüfungen aus, die
absichtlich Opt-in sind, weil sie tiefgehend, historisch oder eher dazu geeignet sind,
reparierbare Legacy-Rückstände offenzulegen. Verwenden Sie `--all`, wenn Sie das vollständige Lint-
Inventar möchten, ohne jede Prüfungs-ID aufzulisten. `--only <id>` bleibt der präziseste
Selektor und kann jede registrierte Prüfung anhand ihrer ID ausführen.

## Strukturierte Health Checks

Moderne doctor-Prüfungen verwenden einen kleinen strukturierten Vertrag:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` treibt `doctor --lint` an. `repair()` ist optional und wird nur
von `doctor --fix` / `doctor --repair` berücksichtigt. Prüfungen, die noch nicht zu dieser
Form migriert wurden, verwenden weiterhin den Legacy-doctor-Beitragsfluss.

Die Trennung ist beabsichtigt: `detect()` besitzt die Diagnose, während `repair()`
berichtet, was es geändert hat oder ändern würde. Reparaturkontexte können
`dryRun`/`diff`-Anfragen tragen, und Reparaturergebnisse können strukturierte `diffs` für
Konfigurations-/Dateibearbeitungen plus `effects` für Service-, Prozess-, Paket-, Zustands- oder andere
Nebeneffekte zurückgeben. Dadurch können konvertierte Prüfungen in Richtung `doctor --fix --dry-run`
und Diff-Berichterstattung wachsen, ohne Mutationsplanung in `detect()` zu verschieben.

`repair()` meldet mit `status:
"repaired" | "skipped" | "failed"`, ob es die angeforderte Reparatur versucht hat. Ein ausgelassener Status bedeutet `repaired`, sodass einfache
Reparaturprüfungen nur Änderungen zurückgeben müssen. Wenn die Reparatur `skipped` oder
`failed` zurückgibt, meldet doctor den Grund und führt für diese Prüfung keine Validierung aus.

Nach einer erfolgreichen strukturierten Reparatur führt doctor `detect()` erneut mit den
reparierten Findings als Scope aus. Prüfungen können ausgewählte Findings, Pfade oder `ocPath`-
Werte für fokussierte Validierung verwenden. Wenn das Finding weiterhin vorhanden ist, meldet doctor eine
Reparaturwarnung, statt die Änderung als stillschweigend abgeschlossen zu behandeln.

Ein Finding enthält:

| Feld              | Zweck                                                  |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Stabile ID für skip/only-Filter und CI-Allowlisten.    |
| `severity`        | `info`, `warning` oder `error`.                        |
| `message`         | Menschenlesbare Problembeschreibung.                   |
| `path`            | Konfigurations-, Datei- oder logischer Pfad, wenn verfügbar. |
| `line` / `column` | Quellposition, wenn verfügbar.                         |
| `ocPath`          | Präzise `oc://`-Adresse, wenn eine Prüfung auf eine zeigen kann. |
| `fixHint`         | Vorgeschlagene Operator-Aktion oder Reparaturzusammenfassung. |

Modernisierte Core-doctor-Prüfungen bleiben an den geordneten doctor-Beitrag angehängt,
der ihr menschenlesbares Verhalten für `doctor` / `doctor --fix` besitzt. Die gemeinsam genutzte strukturierte
Health-Registry ist der Erweiterungspunkt: gebündelte und Plugin-gestützte Prüfungen laufen
nach Core-doctor-Prüfungen, sobald ihr besitzendes Paket sie im aktiven
Befehlspfad registriert. Der Unterpfad `openclaw/plugin-sdk/health` stellt denselben
Vertrag für diese Erweiterungskonsumenten bereit.

## Prüfungsauswahl

Verwenden Sie `--only` und `--skip`, wenn ein Workflow ein fokussiertes Gate benötigt:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` und `--skip` akzeptieren vollständige Prüfungs-IDs und können wiederholt werden. Wenn eine `--only`-
ID nicht registriert ist, läuft für diese ID keine Prüfung; verwenden Sie die Felder `checksRun`
und `checksSkipped` des Befehls, um zu verifizieren, dass ein fokussiertes Gate die erwarteten Prüfungen
auswählt.

## Post-Upgrade-Modus

`openclaw doctor --post-upgrade` führt Plugin-Kompatibilitäts-Probes aus, die dafür gedacht sind, nach einem
Build oder Upgrade verkettet zu werden. Findings werden an stdout ausgegeben; der Befehl
beendet mit Code 1, wenn ein Finding `level: "error"` hat. Fügen Sie `--json` hinzu, um einen
maschinenlesbaren Umschlag (`{ probesRun, findings }`) zu erhalten, der für CI, den
Community-`fork-upgrade`-Skill und andere Post-Upgrade-Smoke-Tools geeignet ist. Wenn der
installierte Plugin-Index fehlt oder fehlerhaft ist, gibt der JSON-Modus dennoch diesen
Umschlag mit einem `plugin.index_unavailable`-Error-Finding aus.

Hinweise:

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte Doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, weil `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; für nix-openclaw verwenden Sie den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Eingabeaufforderungen (wie Schlüsselbund-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Ausführungen ohne Terminal (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das eifrige Laden von Plugins, damit Systemprüfungen ohne Terminal schnell bleiben. Interaktive Doctor-Sitzungen laden weiterhin die Plugin-Oberflächen, die vom bestehenden Zustands- und Reparaturablauf benötigt werden.
- `--lint` ist strenger als `--non-interactive`: Es ist immer schreibgeschützt, fragt nie nach und wendet nie sichere Migrationen an. Führen Sie `doctor --fix` oder `doctor --repair` aus, wenn Doctor Änderungen vornehmen soll.
- Standardmäßig führt Doctor keine `exec`-SecretRefs aus, während Secrets geprüft werden. Verwenden Sie `openclaw doctor --allow-exec` oder `openclaw doctor --lint --allow-exec` nur, wenn Doctor diese konfigurierten Secret-Resolver absichtlich ausführen soll.
- `--fix` (Alias für `--repair`) schreibt eine Sicherung nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- Modernisierte Zustandsprüfungen können einen `repair()`-Pfad für `doctor --fix` bereitstellen; Prüfungen ohne solchen Pfad laufen weiterhin durch den bestehenden Doctor-Reparaturablauf.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder schreibt sie aber außerhalb des Update-Reparaturmodus nicht neu. Führen Sie `openclaw gateway install` für einen fehlenden Dienst aus oder `openclaw gateway install --force`, wenn Sie den Launcher absichtlich ersetzen möchten.
- Integritätsprüfungen des Zustands erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis. Sie als `.deleted.<timestamp>` zu archivieren erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Ausführungen ohne Terminal lassen sie unverändert.
- Doctor scannt außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach alten Cron-Job-Formaten und schreibt sie neu, bevor kanonische Zeilen in SQLite importiert werden.
- Doctor meldet Cron-Jobs mit expliziten `payload.model`-Overrides, einschließlich Provider-Namespace-Zählungen und Abweichungen von `agents.defaults.model`, damit geplante Jobs, die das Standardmodell nicht erben, bei Authentifizierungs- oder Abrechnungsuntersuchungen sichtbar sind.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers weiterhin das alte `~/.openclaw/bin/ensure-whatsapp.sh` ausführt; dieses Skript wird nicht mehr gepflegt und kann fälschliche WhatsApp-Gateway-Ausfälle protokollieren, wenn Cron die systemd-Benutzerbus-Umgebung fehlt.
- Wenn WhatsApp aktiviert ist, prüft Doctor auf eine beeinträchtigte Gateway-Ereignisschleife mit weiterhin laufenden lokalen `openclaw-tui`-Clients. `doctor --fix` stoppt nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen eingereiht werden.
- Doctor schreibt alte `openai-codex/*`-Modellrefs in kanonische `openai/*`-Refs um, über primäre Modelle, Fallbacks, Bild-/Videogenerierungsmodelle, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanalmodell-Overrides und veraltete Sitzungsrouten-Pins hinweg. `--fix` migriert außerdem alte `openai-codex:*`-Auth-Profile und `auth.order.openai-codex`-Einträge zu `openai:*`, verschiebt Codex-Intent auf Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge, entfernt veraltete Whole-Agent-/Sitzungs-Runtime-Pins und behält reparierte OpenAI-Agent-Refs auf Codex-Auth-Routing statt direkter OpenAI-API-Schlüssel-Auth.
- Doctor bereinigt alten Plugin-Abhängigkeits-Staging-Zustand, der von älteren OpenClaw-Versionen erstellt wurde, und verknüpft das Hostpaket `openclaw` für verwaltete npm-Plugins neu, die es als Peer-Abhängigkeit deklarieren. Außerdem repariert es fehlende herunterladbare Plugins, die von der Konfiguration referenziert werden, etwa `plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen oder konfigurierte Agent-Runtimes. Während Paketaktualisierungen überspringt Doctor die Plugin-Reparatur über den Paketmanager, bis der Pakettausch abgeschlossen ist; führen Sie danach erneut `openclaw doctor --fix` aus, wenn ein konfiguriertes Plugin weiterhin Wiederherstellung benötigt. Wenn der Download fehlschlägt, meldet Doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfiguration, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.deny`/`plugins.entries` entfernt werden, plus passende verwaiste Kanalkonfiguration, Heartbeat-Ziele und Kanalmodell-Overrides, wenn die Plugin-Erkennung fehlerfrei ist.
- Doctor quarantänisiert ungültige Plugin-Konfiguration, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Der Gateway-Start überspringt bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiterlaufen können.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus besitzt. Doctor meldet weiterhin Gateway-/Dienstzustand und wendet Reparaturen an, die keine Dienste betreffen, überspringt aber Dienstinstallation, Start, Neustart, Bootstrap und Bereinigung alter Dienste.
- Unter Linux ignoriert Doctor inaktive zusätzliche gatewayähnliche systemd-Units und schreibt während der Reparatur keine Befehls-/Einstiegspunktmetadaten für einen laufenden systemd-Gateway-Dienst neu. Stoppen Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, wenn Sie den aktiven Launcher absichtlich ersetzen möchten.
- Doctor migriert alte flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Schlüssel) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge von Objektschlüsseln ist.
- Doctor enthält eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehlsinhaber konfiguriert ist. Der Befehlsinhaber ist das menschliche Operatorkonto, das Inhaberbefehle ausführen und gefährliche Aktionen genehmigen darf. DM-Pairing erlaubt nur, mit dem Bot zu sprechen; wenn Sie einen Absender genehmigt haben, bevor der Bootstrap für den ersten Inhaber existierte, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor meldet einen Infohinweis, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Assets im Codex-Home des Operators vorhanden sind. Lokale Codex-App-Server-Starts verwenden isolierte agentenspezifische Homes. Installieren Sie daher bei Bedarf zuerst das Codex-Plugin und verwenden Sie dann `openclaw migrate plan codex`, um Assets zu inventarisieren, die bewusst übernommen werden sollen.
- Doctor entfernt das außer Betrieb genommene `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server belässt Codex-native Workspace-Tools immer nativ.
- Doctor warnt, wenn Skills, die für den Standardagenten erlaubt sind, in der aktuellen Runtime-Umgebung nicht verfügbar sind, weil Binaries, Umgebungsvariablen, Konfiguration oder Betriebssystemanforderungen fehlen. `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren/konfigurieren Sie stattdessen die fehlende Anforderung, wenn der Skill aktiv bleiben soll.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn alte Sandbox-Registry-Dateien oder Shard-Verzeichnisse vorhanden sind (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` oder `~/.openclaw/sandbox/browsers/`), meldet Doctor sie; `openclaw doctor --fix` migriert gültige Einträge nach SQLite und quarantänisiert ungültige alte Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` von SecretRefs verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Anmeldedaten. Bei exec-gestützten SecretRefs überspringt Doctor die Ausführung, sofern `--allow-exec` nicht vorhanden ist.
- Wenn die Prüfung von Kanal-SecretRefs in einem Reparaturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt frühzeitig zu beenden.
- Nach Zustandsverzeichnis-Migrationen warnt Doctor, wenn aktivierte Standardkonten für Telegram oder Discord von Env-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Prüfung nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann anhaltende „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway-Doctor](/de/gateway/doctor)
