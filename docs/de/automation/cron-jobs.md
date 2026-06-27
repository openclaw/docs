---
read_when:
    - Hintergrundaufgaben oder Weckvorgänge planen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Zwischen Heartbeat und Cron für geplante Aufgaben entscheiden
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-06-27T17:09:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zur richtigen Zeit und kann Ausgaben zurück an einen Chat-Kanal oder Webhook-Endpunkt liefern.

## Schnellstart

<Steps>
  <Step title="Einmalige Erinnerung hinzufügen">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Ihre Jobs prüfen">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ausführungsverlauf anzeigen">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Funktionsweise von Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Jobdefinitionen, Laufzeitstatus und Ausführungsverlauf werden in der gemeinsamen SQLite-Statusdatenbank von OpenClaw gespeichert, sodass Zeitpläne bei Neustarts nicht verloren gehen.
- Führen Sie beim Upgrade `openclaw doctor --fix` aus, um ältere Dateien `~/.openclaw/cron/jobs.json`, `jobs-state.json` und `runs/*.jsonl` in SQLite zu importieren und sie mit dem Suffix `.migrated` umzubenennen. Fehlerhafte Job-Zeilen werden zur Laufzeit übersprungen und zur späteren Reparatur oder Prüfung nach `jobs-quarantine.json` kopiert.
- `cron.store` benennt weiterhin den logischen Cron-Speicherschlüssel und den Importpfad für Doctor. Nach dem Import ändern Bearbeitungen an dieser JSON-Datei keine aktiven Cron-Jobs mehr; verwenden Sie stattdessen `openclaw cron add|edit|remove` oder die Cron-RPC-Methoden des Gateway.
- Alle Cron-Ausführungen erstellen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Start des Gateway werden überfällige isolierte Agent-Turn-Jobs außerhalb des Kanal-Verbindungsfensters neu geplant, statt sofort wiedergegeben zu werden, sodass Discord-/Telegram-Start und Einrichtung nativer Befehle nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Aufwand nachverfolgte Browser-Tabs/-Prozesse für ihre `cron:<jobId>`-Sitzung, wenn die Ausführung abgeschlossen ist, damit abgekoppelte Browser-Automatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen, die die eng gefasste Cron-Selbstbereinigungsberechtigung erhalten, können weiterhin Scheduler-Status, eine selbst gefilterte Liste ihres aktuellen Jobs und den Ausführungsverlauf dieses Jobs lesen, sodass Status-/Heartbeat-Prüfungen ihren eigenen Zeitplan einsehen können, ohne breiteren Zugriff auf Cron-Mutationen zu erhalten.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine zwischenzeitliche Statusmeldung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein nachgelagerter Subagent-Lauf mehr für die finale Antwort verantwortlich ist, fordert OpenClaw einmal erneut das tatsächliche Ergebnis an, bevor es ausgeliefert wird.
- Isolierte Cron-Ausführungen verwenden strukturierte Metadaten zu Ausführungsverweigerungen aus dem eingebetteten Lauf, einschließlich node-host-`UNAVAILABLE`-Wrappern, deren verschachtelte Fehlermeldung mit `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST` beginnt. Dadurch wird ein blockierter Befehl nicht als grüne Ausführung gemeldet, während gewöhnliche Assistentenprosa nicht als Verweigerung behandelt wird.
- Isolierte Cron-Ausführungen behandeln außerdem Fehler auf Agent-Laufebene als Jobfehler, selbst wenn keine Antwortnutzlast erzeugt wird. So erhöhen Modell-/Provider-Fehler Fehlerzähler und lösen Fehlerbenachrichtigungen aus, statt den Job als erfolgreich zu bereinigen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron den zugrunde liegenden Agentenlauf ab und gibt ihm ein kurzes Bereinigungsfenster. Wenn der Lauf nicht ausläuft, erzwingt die Gateway-eigene Bereinigung das Freigeben der Sitzungszuständigkeit dieses Laufs, bevor Cron das Timeout aufzeichnet, sodass eingereihte Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung hängen bleibt.
- Wenn ein isolierter Agent-Turn vor dem Start des Runners oder vor dem ersten Modellaufruf hängen bleibt, zeichnet Cron ein phasenspezifisches Timeout auf, etwa `setup timed out before runner start` oder `stalled before first model call (last phase: context-engine)`. Diese Watchdogs decken eingebettete Provider und CLI-gestützte Provider ab, bevor ihr externer CLI-Prozess tatsächlich gestartet wird, und sind unabhängig von langen `timeoutSeconds`-Werten begrenzt, damit Kaltstart-/Auth-/Kontextfehler schnell sichtbar werden, statt auf das gesamte Job-Budget zu warten.
- Wenn Sie System-Cron oder einen anderen externen Scheduler verwenden, um `openclaw agent` auszuführen, umschließen Sie ihn mit einer Hard-Kill-Eskalation, auch wenn die CLI `SIGTERM`/`SIGINT` verarbeitet. Gateway-gestützte Läufe bitten das Gateway, angenommene Läufe abzubrechen; lokale und eingebettete Fallback-Läufe erhalten dasselbe Abbruchsignal. Für GNU `timeout` bevorzugen Sie `timeout -k 60 600 openclaw agent ...` gegenüber einfachem `timeout 600 ...`; der Wert `-k` ist die Supervisor-Absicherung, falls der Prozess nicht auslaufen kann. Für systemd-Units behalten Sie dieselbe Form bei, indem Sie ein `SIGTERM`-Stoppsignal plus ein Karenzfenster wie `TimeoutStopSec` vor einem finalen Kill verwenden. Wenn ein erneuter Versuch eine `--run-id` wiederverwendet, während der ursprüngliche Gateway-Lauf noch aktiv ist, wird das Duplikat als laufend gemeldet, statt einen zweiten Lauf zu starten.

<a id="maintenance"></a>

<Note>
Der Aufgabenabgleich für Cron ist zuerst laufzeitverwaltet und erst danach durch dauerhaften Verlauf gestützt: Eine aktive Cron-Aufgabe bleibt live, solange die Cron-Laufzeit diesen Job noch als laufend nachverfolgt, selbst wenn noch eine alte Zeile einer untergeordneten Sitzung existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-minütige Karenzfenster abläuft, prüfen Wartungschecks persistierte Ausführungslogs und den Jobstatus für den passenden `cron:<jobId>:<startedAt>`-Lauf. Wenn dieser dauerhafte Verlauf ein terminales Ergebnis zeigt, wird das Aufgabenbuch daraus finalisiert; andernfalls kann die Gateway-eigene Wartung die Aufgabe als `lost` markieren. Das Offline-CLI-Audit kann aus dauerhaftem Verlauf wiederherstellen, behandelt seine eigene leere prozessinterne Menge aktiver Jobs jedoch nicht als Beweis dafür, dass ein Gateway-eigener Cron-Lauf verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                             |
| ------- | --------- | -------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`) |
| `every` | `--every` | Festes Intervall                                        |
| `cron`  | `--cron`  | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz` |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wall-Clock-Planung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Tag-der-Woche verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Tag-des-Monats- als auch das Tag-der-Woche-Feld keine Wildcards sind, stimmt croner überein, wenn **eines der beiden** Felder übereinstimmt — nicht beide. Das ist das Standardverhalten von Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies löst etwa 5- bis 6-mal pro Monat aus statt 0- bis 1-mal pro Monat. OpenClaw verwendet hier Croners standardmäßiges ODER-Verhalten. Um beide Bedingungen zu verlangen, verwenden Sie Croners `+`-Modifier für den Wochentag (`0 9 15 * +1`) oder planen Sie über ein Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil             | `--session`-Wert   | Läuft in                        | Am besten für                         |
| ---------------- | ------------------ | ------------------------------- | ------------------------------------- |
| Hauptsitzung     | `main`             | Dedizierte Cron-Weckspur        | Erinnerungen, Systemereignisse        |
| Isoliert         | `isolated`         | Dediziertes `cron:<jobId>`      | Berichte, Hintergrundarbeiten         |
| Aktuelle Sitzung | `current`          | Bei Erstellung gebunden         | Kontextbewusste wiederkehrende Arbeit |
| Eigene Sitzung   | `session:custom-id`| Persistente benannte Sitzung    | Workflows, die auf Verlauf aufbauen   |

<AccordionGroup>
  <Accordion title="Hauptsitzung vs. isoliert vs. eigene Sitzung">
    Jobs der **Hauptsitzung** reihen ein Systemereignis in eine Cron-eigene Laufspur ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Sie können den letzten Lieferkontext der Ziel-Hauptsitzung für Antworten verwenden, hängen Routine-Cron-Turns jedoch nicht an die menschliche Chat-Spur an und verlängern nicht die tägliche/Leerlauf-Reset-Aktualität der Zielsitzung. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit frischer Sitzung aus. **Eigene Sitzungen** (`session:xxx`) behalten Kontext über Ausführungen hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf früheren Zusammenfassungen aufbauen.

    Cron-Ereignisse der Hauptsitzung sind eigenständige Systemereignis-Erinnerungen. Sie enthalten nicht automatisch die Anweisung "Read HEARTBEAT.md" aus dem Standard-Heartbeat-Prompt. Wenn eine wiederkehrende Erinnerung `HEARTBEAT.md` konsultieren soll, sagen Sie dies ausdrücklich im Cron-Ereignistext oder in den eigenen Anweisungen des Agenten.

  </Accordion>
  <Accordion title="Was „frische Sitzung“ für isolierte Jobs bedeutet">
    Für isolierte Jobs bedeutet „frische Sitzung“ eine neue Transkript-/Sitzungs-ID für jede Ausführung. OpenClaw kann sichere Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und ausdrücklich vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, erbt aber keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job absichtlich auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeitbereinigung">
    Für isolierte Jobs umfasst der Laufzeitabbau jetzt eine bestmögliche Browser-Bereinigung für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit das tatsächliche Cron-Ergebnis weiterhin Vorrang hat.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Das entspricht dem Abbau von MCP-Clients der Hauptsitzung und eigener Sitzungen, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Ausführungen hinweg verlieren.

  </Accordion>
  <Accordion title="Subagent- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, bevorzugt die Zustellung außerdem die finale Ausgabe des Nachfahren gegenüber veraltetem zwischenzeitlichem Elterntext. Wenn Nachfahren noch laufen, unterdrückt OpenClaw dieses teilweise Eltern-Update, statt es anzukündigen.

    Für reine Text-Ankündigungsziele in Discord sendet OpenClaw den kanonischen finalen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die finale Antwort erneut abzuspielen. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten geliefert, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Befehlsnutzlasten

Verwenden Sie Befehlsnutzlasten für deterministische Skripte, die im Gateway-Scheduler laufen sollen, ohne einen modellgestützten isolierten Agent-Turn zu starten. Befehlsjobs werden auf dem Gateway-Host ausgeführt, erfassen stdout/stderr, zeichnen die Ausführung im Cron-Verlauf auf und verwenden dieselben Zustellmodi `announce`, `webhook` und `none` wie isolierte Jobs.

<Note>
Command-Cron ist eine Operator-Admin-Automatisierungsoberfläche des Gateway, kein Agent-`tools.exec`-Aufruf. Das Erstellen, Aktualisieren, Entfernen oder manuelle Ausführen von Cron-Jobs erfordert `operator.admin`; geplante Befehlsausführungen laufen später innerhalb des Gateway-Prozesses als von diesem Admin verfasste Automatisierung. Agent-Exec-Richtlinien wie `tools.exec.mode`, Genehmigungsaufforderungen und agentenspezifische Tool-Allowlists steuern modell sichtbare Exec-Tools, nicht Command-Cron-Nutzlasten.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'`, wenn Sie exakte argv-Ausführung ohne Shell-Parsing wünschen. Optionale Felder `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` und `--output-max-bytes` steuern die Prozessumgebung, stdin und Ausgabegrenzen.

Wenn stdout nicht leer ist, ist dieser Text das zugestellte Ergebnis. Wenn stdout leer und stderr nicht leer ist, wird stderr zugestellt. Wenn beide Streams vorhanden sind, stellt Cron einen kleinen `stdout:`- / `stderr:`-Block zu. Ein Exit-Code von null zeichnet den Lauf als `ok` auf; ein Exit-Code ungleich null, ein Signal, ein Timeout oder ein Timeout ohne Ausgabe zeichnet `error` auf und kann Fehlerwarnungen auslösen. Ein Befehl, der nur `NO_REPLY` ausgibt, verwendet die normale Unterdrückung des stillen Cron-Tokens und postet nichts zurück in den Chat.

### Payload-Optionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isoliert erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modell-Override; verwendet das ausgewählte erlaubte Modell für den Job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Fallback-Modellliste pro Job, zum Beispiel `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Entfernt bei `cron edit` den Fallback-Override pro Job, sodass der Job der konfigurierten Fallback-Priorität folgt. Kann nicht mit `--fallbacks` kombiniert werden.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Entfernt bei `cron edit` den Modell-Override pro Job, sodass der Job der normalen Cron-Modellauswahl-Priorität folgt (ein gespeicherter Cron-Session-Override, falls gesetzt, andernfalls das Agent-/Standardmodell). Kann nicht mit `--model` kombiniert werden.
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking-Level-Override.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Workspace-Bootstrap-Dateiinjektion überspringen.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte erlaubte Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie ein Chat-Session-Override mit `/model`: konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Job-Modell fehlschlägt. Wenn das angeforderte Modell nicht erlaubt ist oder nicht aufgelöst werden kann, schlägt Cron den Lauf mit einem expliziten Validierungsfehler fehl, statt still auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können auch `fallbacks` auf Payload-Ebene enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` in der Job-Payload/API, wenn Sie einen strikten Cron-Lauf wünschen, der nur das ausgewählte Modell versucht. Wenn ein Job `--model`, aber weder Payload- noch konfigurierte Fallbacks hat, übergibt OpenClaw einen expliziten leeren Fallback-Override, sodass das primäre Agent-Modell nicht als verborgenes zusätzliches Wiederholungsziel angehängt wird.

Preflight-Prüfungen für lokale Provider durchlaufen konfigurierte Fallbacks, bevor sie einen Cron-Lauf als `skipped` markieren; `fallbacks: []` hält diesen Preflight-Pfad strikt.

Die Modellauswahl-Priorität für isolierte Jobs lautet:

1. Gmail-Hook-Modell-Override (wenn der Lauf von Gmail kam und dieser Override erlaubt ist)
2. `model` pro Job-Payload
3. Vom Benutzer ausgewählter gespeicherter Cron-Session-Modell-Override
4. Agent-/Standardmodellauswahl

Der Schnellmodus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Ein gespeicherter Session-Override für `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration. Der Auto-Modus verwendet den Grenzwert `params.fastAutoOnSeconds` des ausgewählten Modells, falls vorhanden, standardmäßig 60 Sekunden.

Wenn ein isolierter Lauf eine Live-Handoff für den Modellwechsel erreicht, versucht Cron es erneut mit dem gewechselten Provider/Modell und speichert diese Live-Auswahl vor dem erneuten Versuch für den aktiven Lauf. Wenn der Wechsel auch ein neues Auth-Profil enthält, speichert Cron auch diesen Auth-Profil-Override für den aktiven Lauf. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

Bevor ein isolierter Cron-Lauf in den Agent-Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte Provider mit `api: "ollama"` und `api: "openai-completions"`, deren `baseUrl` local loopback, ein privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt nicht verfügbar ist, wird der Lauf als `skipped` mit einem klaren Provider-/Modellfehler aufgezeichnet, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten lang zwischengespeichert, sodass viele fällige Jobs, die denselben ausgefallenen lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine kleine Prüfung teilen, statt eine Anfragesturm zu erzeugen. Übersprungene Provider-Preflight-Läufe erhöhen den Backoff für Ausführungsfehler nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Skip-Benachrichtigungen wünschen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Finalen Text per Fallback an das Ziel zustellen, wenn der Agent nicht gesendet hat |
| `webhook`  | Fertige Ereignis-Payload per POST an eine URL senden               |
| `none`     | Keine Runner-Fallback-Zustellung                                   |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für Kanalzustellung. Für Telegram-Forum-Themen verwenden Sie `-1001234567890:topic:123`; OpenClaw akzeptiert auch die Telegram-eigene Kurzform `-1001234567890:123`. Direkte RPC-/Config-Aufrufer können `delivery.threadId` als String oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs beachten Groß-/Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` von Matrix.

Wenn Announce-Zustellung `channel: "last"` verwendet oder `channel` weglässt, kann ein Provider-präfigiertes Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf den Session-Verlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; zum Beispiel wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanalinterne Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung geteilt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` verwenden, selbst wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Turn mit der finalen Antwort macht.

Wenn ein Agent aus einem aktiven Chat eine isolierte Erinnerung erstellt, speichert OpenClaw das beibehaltene Live-Zustellungsziel für die Fallback-Announce-Route. Interne Session-Schlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Implizite Announce-Zustellung verwendet konfigurierte Kanal-Allowlisten, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen aus dem DM-Pairing-Store sind keine Empfänger für Fallback-Automatisierung; setzen Sie `delivery.to` oder konfigurieren Sie den Kanaleintrag `allowFrom`, wenn ein geplanter Job proaktiv an eine DM senden soll.

## Ausgabesprache

Cron-Jobs leiten keine Antwortsprache aus Kanal, Locale oder vorherigen
Nachrichten ab. Schreiben Sie die Sprachregel in die geplante Nachricht oder Vorlage:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Behalten Sie bei Vorlagendateien die Sprachanweisung im gerenderten Prompt und
prüfen Sie, ob Platzhalter wie `{{language}}` ausgefüllt sind, bevor der Job läuft. Wenn
die Ausgabe Sprachen mischt, machen Sie die Regel explizit, zum Beispiel: „Verwenden Sie Chinesisch
für Fließtext und behalten Sie technische Begriffe auf Englisch.“

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, außer der primäre Zustellungsmodus ist `webhook`.
- `failureAlert.includeSkipped: true` nimmt einen Job oder eine globale Cron-Warnrichtlinie in wiederholte Warnungen für übersprungene Läufe auf. Übersprungene Läufe führen einen separaten Zähler aufeinanderfolgender Skips, sodass sie den Backoff für Ausführungsfehler nicht beeinflussen.

## CLI-Beispiele

<Tabs>
  <Tab title="Einmalige Erinnerung">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Wiederkehrender isolierter Job">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Modell- und Thinking-Override">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook-Ausgabe">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Befehlsausgabe">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. Aktivieren Sie dies in der Config:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentifizierung

Jede Anfrage muss das Hook-Token über einen Header enthalten:

- `Authorization: Bearer <token>` (empfohlen)
- `x-openclaw-token: <token>`

Query-String-Token werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ein Systemereignis für die Hauptsession einreihen:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Ereignisbeschreibung.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` oder `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Einen isolierten Agent-Turn ausführen:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Zugeordnete Hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Config aufgelöst. Zuordnungen können beliebige Payloads mit Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter local loopback, Tailnet oder einem vertrauenswürdigen Reverse-Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Auth-Tokens nicht erneut.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um zu begrenzen, welchen effektiven Agent ein Hook ansprechen kann, einschließlich des Standard-Agents, wenn `agentId` weggelassen wird.
- Behalten Sie `hooks.allowRequestSessionKey=false` bei, sofern Sie keine vom Aufrufer ausgewählten Sessions benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um erlaubte Session-Schlüsselformen einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangsauslöser über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die `hooks.gmail`-Konfiguration, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet der Gateway beim Booten `gog gmail watch serve` und erneuert die Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

<Steps>
  <Step title="GCP-Projekt auswählen">
    Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Topic erstellen und Gmail-Push-Zugriff gewähren">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Watch starten">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail-Modell-Override

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Jobs verwalten

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` kehrt zurück, nachdem der manuelle Lauf in die Warteschlange eingereiht wurde. Verwenden Sie `--wait` für Shutdown-Hooks, Wartungsskripte oder andere Automatisierung, die blockieren muss, bis der eingereihte Lauf abgeschlossen ist. Der Wartemodus fragt exakt die zurückgegebene `runId` ab; er beendet mit `0` für den Status `ok` und mit einem Wert ungleich null für `error`, `skipped` oder ein Wartezeitlimit.

Das Agenten-Tool `cron` gibt kompakte Job-Zusammenfassungen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) von `cron(action: "list")` zurück; verwenden Sie `cron(action: "get", jobId: "...")` für eine vollständige Job-Definition. Direkte Gateway-Aufrufer können `compact: true` an `cron.list` übergeben; wenn es weggelassen wird, bleibt die bestehende vollständige Antwort mit Zustellungsvorschauen erhalten.

`openclaw cron create` ist ein Alias für `openclaw cron add`, und neue Jobs können einen positionalen Zeitplan (`"0 9 * * 1"`, `"every 1h"`, `"20m"` oder einen ISO-Zeitstempel) gefolgt von einem positionalen Agenten-Prompt verwenden. Verwenden Sie `--webhook <url>` bei `cron add|create` oder `cron edit`, um die Payload des abgeschlossenen Laufs per POST an einen HTTP-Endpunkt zu senden. Webhook-Zustellung kann nicht mit Chat-Zustellungs-Flags wie `--announce`, `--channel`, `--to`, `--thread-id` oder `--account` kombiniert werden. Bei `cron edit` heben `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` diese Routing-Felder jeweils einzeln auf (jedes wird zusammen mit seinem passenden Set-Flag abgelehnt). Das unterscheidet sich davon, dass `--no-deliver` die Runner-Fallback-Zustellung deaktiviert.

<Note>
Hinweis zum Modell-Override:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agentenlauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen.
- API-`cron.update`-Payload-Patches können `model: null` setzen, um einen gespeicherten Modell-Override des Jobs zu löschen.
- `openclaw cron edit <job-id> --clear-model` löscht diesen Override über die CLI (gleiche Wirkung wie der Patch `model: null`) und kann nicht mit `--model` kombiniert werden.
- Konfigurierte Fallback-Ketten gelten weiterhin, weil Cron `--model` ein primäres Job-Modell ist, kein Sitzungs-Override `/model`.
- `openclaw cron add|edit --fallbacks ...` setzt die Payload `fallbacks` und ersetzt konfigurierte Fallbacks für diesen Job; `--fallbacks ""` deaktiviert Fallback und macht den Lauf strikt. `openclaw cron edit <job-id> --clear-fallbacks` löscht den jobbezogenen Override.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht stillschweigend auf das primäre Agentenmodell als zusätzliches Wiederholungsziel zurück.

</Note>

## Konfiguration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` begrenzt sowohl die geplante Cron-Verteilung als auch die Ausführung isolierter Agenten-Turns und ist standardmäßig 8. Isolierte Cron-Agenten-Turns verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange. Wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel fortschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsam genutzte Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht erweitert.

`cron.store` ist ein logischer Store-Schlüssel und Legacy-Importpfad für Doctor. Führen Sie `openclaw doctor --fix` aus, um bestehende JSON-Stores in SQLite zu importieren und zu archivieren; zukünftige Cron-Änderungen sollten über die CLI oder die Gateway-API erfolgen.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry-Verhalten">
    **Einmaliger Retry**: vorübergehende Fehler (Ratenbegrenzung, Überlastung, Netzwerk, Serverfehler) werden bis zu 3-mal mit exponentiellem Backoff erneut versucht. Dauerhafte Fehler deaktivieren sofort.

    **Wiederkehrender Retry**: exponentieller Backoff (30 s bis 60 m) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Lauf-Sitzungseinträge. `cron.runLog.keepLines` begrenzt die beibehaltenen SQLite-Laufverlaufszeilen pro Job; `maxBytes` bleibt für die Konfigurationskompatibilität mit älteren dateibasierten Laufprotokollen erhalten.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

### Befehlsleiter

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron wird nicht ausgelöst">
    - Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
    - Bestätigen Sie, dass der Gateway dauerhaft läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
    - `reason: not-due` in der Laufausgabe bedeutet, dass ein manueller Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung erfolgt">
    - Zustellungsmodus `none` bedeutet, dass kein Runner-Fallback-Senden erwartet wird. Der Agent kann weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Fehlendes/ungültiges Zustellungsziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
    - Bei Matrix können kopierte oder Legacy-Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, weil Matrix-Raum-IDs Groß-/Kleinschreibung beachten. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Channel-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad der eingereihten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent selbst eine Nachricht an den Benutzer senden soll, prüfen Sie, dass der Job eine nutzbare Route hat (`channel: "last"` mit einem früheren Chat oder einen expliziten Channel/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint /new-artigen Rollover zu verhindern">
    - Die Aktualität für tägliche und Leerlauf-Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Weckvorgänge, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Sitzungszeile für Routing/Status aktualisieren, aber sie verlängern nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Für Legacy-Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Legacy-Leerlaufzeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als ihre Leerlauf-Basislinie.

  </Accordion>
  <Accordion title="Zeitzonen-Fallstricke">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgaben-Ledger für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
