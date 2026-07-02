---
read_when:
    - Planen von Hintergrundaufgaben oder Weckvorgängen
    - Externe Auslöser (Webhooks, Gmail) in OpenClaw einbinden
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Auslöser für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-07-02T00:48:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateway. Er persistiert Jobs, weckt den Agent zur richtigen Zeit und kann Ausgaben zurück an einen Chat-Kanal oder Webhook-Endpunkt liefern.

## Schnellstart

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## So funktioniert Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Jobdefinitionen, Laufzeitstatus und Ausführungsverlauf werden in der gemeinsam genutzten SQLite-Statusdatenbank von OpenClaw persistiert, sodass Zeitpläne bei Neustarts nicht verloren gehen.
- Führen Sie beim Upgrade `openclaw doctor --fix` aus, um ältere Dateien `~/.openclaw/cron/jobs.json`, `jobs-state.json` und `runs/*.jsonl` in SQLite zu importieren und sie mit einem `.migrated`-Suffix umzubenennen. Fehlerhafte Jobzeilen werden zur Laufzeit übersprungen und zur späteren Reparatur oder Prüfung nach `jobs-quarantine.json` kopiert.
- `cron.store` benennt weiterhin den logischen Cron-Store-Schlüssel und den Doctor-Importpfad. Nach dem Import ändert das Bearbeiten dieser JSON-Datei keine aktiven Cron-Jobs mehr; verwenden Sie stattdessen `openclaw cron add|edit|remove` oder die Gateway-Cron-RPC-Methoden.
- Alle Cron-Ausführungen erstellen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Start des Gateway werden überfällige isolierte Agent-Turn-Jobs aus dem Kanalverbindungsfenster heraus neu geplant, statt sofort wiedergegeben zu werden, damit Discord/Telegram-Start und Native-Command-Einrichtung nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden nach Erfolg standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Bemühen nachverfolgte Browser-Tabs/-Prozesse für ihre Sitzung `cron:<jobId>`, wenn die Ausführung abgeschlossen ist, damit abgekoppelte Browser-Automatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen, die die enge Cron-Selbstbereinigungsberechtigung erhalten, können weiterhin den Scheduler-Status, eine selbst gefilterte Liste ihres aktuellen Jobs und den Ausführungsverlauf dieses Jobs lesen, sodass Status-/Heartbeat-Prüfungen ihren eigenen Zeitplan prüfen können, ohne breiteren Zugriff auf Cron-Mutationen zu erhalten.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur ein vorläufiges Statusupdate ist (`on it`, `pulling everything together` und ähnliche Hinweise) und keine nachgelagerte Subagent-Ausführung mehr für die endgültige Antwort verantwortlich ist, fordert OpenClaw das eigentliche Ergebnis vor der Zustellung einmal erneut an.
- Isolierte Cron-Ausführungen verwenden strukturierte Metadaten zu Ausführungsverweigerungen aus der eingebetteten Ausführung, einschließlich Node-Host-`UNAVAILABLE`-Wrappern, deren verschachtelte Fehlermeldung mit `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST` beginnt, sodass ein blockierter Befehl nicht als grüne Ausführung gemeldet wird, während gewöhnlicher Assistant-Text nicht als Verweigerung behandelt wird.
- Isolierte Cron-Ausführungen behandeln außerdem Ausführungsfehler auf Agent-Ebene als Jobfehler, auch wenn keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlermeldungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron die zugrunde liegende Agent-Ausführung ab und gibt ihr ein kurzes Bereinigungsfenster. Wenn die Ausführung nicht ausläuft, erzwingt die Gateway-eigene Bereinigung das Freigeben der Sitzungszuständigkeit dieser Ausführung, bevor Cron das Timeout protokolliert, sodass eingereihte Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.
- Wenn ein isolierter Agent-Turn vor dem Start des Runners oder vor dem ersten Modellaufruf hängen bleibt, protokolliert Cron ein phasenspezifisches Timeout wie `setup timed out before runner start` oder `stalled before first model call (last phase: context-engine)`. Diese Watchdogs decken eingebettete Provider und CLI-gestützte Provider ab, bevor ihr externer CLI-Prozess tatsächlich gestartet wird, und sind unabhängig von langen `timeoutSeconds`-Werten begrenzt, damit Kaltstart-, Authentifizierungs- oder Kontextfehler schnell sichtbar werden, statt auf das gesamte Job-Budget zu warten.
- Wenn Sie System-Cron oder einen anderen externen Scheduler verwenden, um `openclaw agent` auszuführen, umschließen Sie ihn mit einer Hard-Kill-Eskalation, auch wenn die CLI `SIGTERM`/`SIGINT` verarbeitet. Gateway-gestützte Ausführungen bitten das Gateway, akzeptierte Ausführungen abzubrechen; lokale und eingebettete Fallback-Ausführungen erhalten dasselbe Abbruchsignal. Für GNU `timeout` bevorzugen Sie `timeout -k 60 600 openclaw agent ...` gegenüber schlichtem `timeout 600 ...`; der Wert `-k` ist der Supervisor-Backstop, falls der Prozess nicht auslaufen kann. Behalten Sie für systemd-Units dieselbe Form bei, indem Sie ein `SIGTERM`-Stoppsignal plus ein Kulanzfenster wie `TimeoutStopSec` vor einem finalen Kill verwenden. Wenn ein Wiederholungsversuch eine `--run-id` wiederverwendet, während die ursprüngliche Gateway-Ausführung noch aktiv ist, wird das Duplikat als laufend gemeldet, statt eine zweite Ausführung zu starten.

<a id="maintenance"></a>

<Note>
Aufgabenabgleich für Cron ist zuerst laufzeiteigen und zweitens durch dauerhaften Verlauf abgesichert: Eine aktive Cron-Aufgabe bleibt live, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, auch wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-minütige Kulanzfenster abläuft, prüft die Wartung persistierte Ausführungsprotokolle und den Jobstatus für die passende Ausführung `cron:<jobId>:<startedAt>`. Wenn dieser dauerhafte Verlauf ein terminales Ergebnis zeigt, wird das Aufgaben-Ledger daraus finalisiert; andernfalls kann die Gateway-eigene Wartung die Aufgabe als `lost` markieren. Ein Offline-CLI-Audit kann aus dauerhaftem Verlauf wiederherstellen, behandelt aber die eigene leere prozessinterne Menge aktiver Jobs nicht als Beweis dafür, dass eine Gateway-eigene Cron-Ausführung verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                                   |
| ------- | --------- | -------------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)       |
| `every` | `--every` | Festes Intervall                                               |
| `cron`  | `--cron`  | 5-Feld- oder 6-Feld-Cron-Ausdruck mit optionalem `--tz`        |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wall-Clock-Zeitplanung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag des Monats und Wochentag verwenden OR-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder für Tag des Monats als auch Wochentag keine Wildcards sind, stimmt croner überein, wenn **eines der beiden** Felder übereinstimmt — nicht beide. Dies ist das Standardverhalten von Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier das standardmäßige OR-Verhalten von Croner. Um beide Bedingungen zu verlangen, verwenden Sie Croners `+`-Wochentagsmodifikator (`0 9 15 * +1`) oder planen Sie über ein Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil               | `--session`-Wert    | Läuft in                       | Am besten für                         |
| ------------------ | ------------------- | ------------------------------ | ------------------------------------- |
| Hauptsitzung       | `main`              | Dedizierte Cron-Weck-Lane      | Erinnerungen, Systemereignisse        |
| Isoliert           | `isolated`          | Dediziertes `cron:<jobId>`     | Berichte, Hintergrundarbeiten         |
| Aktuelle Sitzung   | `current`           | Abgekoppelte Cron-Ausführung   | Kontextbewusste wiederkehrende Arbeit |
| Benutzerdefiniert  | `session:custom-id` | Abgekoppelte Cron-Ausführung   | Ausrichtung auf bekannten Chat/Sitzung |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Jobs in der **Hauptsitzung** reihen ein Systemereignis in eine Cron-eigene Ausführungs-Lane ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Sie können den letzten Zustellungskontext der Ziel-Hauptsitzung für Antworten verwenden, hängen routinemäßige Cron-Turns aber nicht an die menschliche Chat-Lane an und verlängern nicht die tägliche/Leerlauf-Reset-Aktualität der Zielsitzung. **Isolierte** Jobs führen einen dedizierten Agent-Turn mit einer frischen Sitzung aus. Jobs der **aktuellen** und **benutzerdefinierten** Sitzung (`current`, `session:xxx`) können den ausgewählten Chat/die ausgewählte Sitzung für Zustellungskontext und sicheres Setzen von Präferenzen verwenden, aber jede Ausführung läuft weiterhin in einer abgekoppelten Cron-Sitzung, damit geplante Arbeit das Live-Gesprächstranskript nicht blockiert oder verunreinigt.

    Cron-Ereignisse der Hauptsitzung sind eigenständige Systemereignis-Erinnerungen. Sie
    enthalten nicht automatisch die Anweisung "Read
    HEARTBEAT.md" des standardmäßigen Heartbeat-Prompts. Wenn eine wiederkehrende Erinnerung
    `HEARTBEAT.md` konsultieren soll, sagen Sie das explizit im Cron-Ereignistext oder in den
    eigenen Anweisungen des Agent.

  </Accordion>
  <Accordion title="What 'fresh session' means for detached jobs">
    Für isolierte Jobs, Jobs der aktuellen Sitzung und benutzerdefinierte Sitzungsjobs bedeutet "frische Sitzung" eine neue Transkript-/Sitzungs-ID für jede Ausführung. OpenClaw kann sichere Präferenzen wie Denk-/Schnell-/Ausführlich-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Authentifizierungs-Overrides übernehmen. Abgekoppelte Ausführungen erben keinen umgebenden Gesprächskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Erhöhung, Ursprung oder ACP-Laufzeitbindung. Legen Sie dauerhaften Status wiederkehrender Arbeit im Prompt, in Workspace-Dateien, Tools oder dem System ab, auf dem der Job arbeitet, statt sich auf ein Live-Chat-Transkript als Cron-Speicher zu verlassen.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Für isolierte Jobs umfasst das Laufzeit-Teardown jetzt eine bestmögliche Browser-Bereinigung für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit weiterhin das tatsächliche Cron-Ergebnis zählt.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Dies entspricht dem Teardown von MCP-Clients der Hauptsitzung und benutzerdefinierter Sitzungen, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Ausführungen hinweg verlieren.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Wenn isolierte Cron-Ausführungen Subagents orchestrieren, bevorzugt die Zustellung ebenfalls die endgültige Ausgabe des Nachkommen gegenüber veraltetem vorläufigem Elterntext. Wenn Nachkommen noch laufen, unterdrückt OpenClaw dieses partielle Eltern-Update, statt es anzukündigen.

    Für reine Text-Discord-Ankündigungsziele sendet OpenClaw den kanonischen finalen Assistant-Text einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die endgültige Antwort wiederzugeben. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Befehlsnutzlasten

Verwenden Sie Befehlsnutzlasten für deterministische Skripte, die im Gateway-Scheduler laufen sollen, ohne einen modellgestützten isolierten Agent-Turn zu starten. Befehlsjobs werden auf dem Gateway-Host ausgeführt, erfassen stdout/stderr, protokollieren die Ausführung im Cron-Verlauf und verwenden dieselben Zustellmodi `announce`, `webhook` und `none` wie isolierte Jobs.

<Note>
Befehls-Cron ist eine Operator-Admin-Automatisierungsoberfläche des Gateway, kein Agent-
`tools.exec`-Aufruf. Das Erstellen, Aktualisieren, Entfernen oder manuelle Ausführen von Cron-Jobs
erfordert `operator.admin`; geplante Befehlsausführungen laufen später innerhalb des
Gateway-Prozesses als diese vom Admin verfasste Automatisierung. Agent-Exec-Richtlinien wie
`tools.exec.mode`, Genehmigungs-Prompts und Tool-Allowlisten pro Agent steuern
modell sichtbare Exec-Tools, nicht Befehls-Cron-Nutzlasten.
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

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'`, wenn Sie exakte argv-Ausführung ohne Shell-Parsing möchten. Optionale Felder `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` und `--output-max-bytes` steuern die Prozessumgebung, stdin und Ausgabegrenzen.

Wenn stdout nicht leer ist, ist dieser Text das zugestellte Ergebnis. Wenn stdout leer und stderr nicht leer ist, wird stderr zugestellt. Wenn beide Streams vorhanden sind, stellt Cron einen kleinen `stdout:`-/`stderr:`-Block zu. Ein Exit-Code von null zeichnet den Lauf als `ok` auf; ein Exit ungleich null, Signal, Timeout oder Timeout bei fehlender Ausgabe zeichnet `error` auf und kann Fehlerwarnungen auslösen. Ein Befehl, der nur `NO_REPLY` ausgibt, verwendet die normale Silent-Token-Unterdrückung von Cron und postet nichts zurück in den Chat.

### Payload-Optionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isolierte Jobs erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modellüberschreibung; verwendet das ausgewählte erlaubte Modell für den Job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Fallback-Modellliste pro Job, zum Beispiel `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Entfernt bei `cron edit` die Fallback-Überschreibung pro Job, sodass der Job der konfigurierten Fallback-Priorität folgt. Kann nicht mit `--fallbacks` kombiniert werden.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Entfernt bei `cron edit` die Modellüberschreibung pro Job, sodass der Job der normalen Cron-Priorität für die Modellauswahl folgt (eine gespeicherte Cron-Sitzungsüberschreibung, falls gesetzt, andernfalls das Agent-/Standardmodell). Kann nicht mit `--model` kombiniert werden.
</ParamField>
<ParamField path="--thinking" type="string">
  Überschreibung des Thinking-Levels.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Entfernt bei `cron edit` die Thinking-Überschreibung pro Job, sodass der Job der normalen Cron-Priorität für Thinking folgt. Kann nicht mit `--thinking` kombiniert werden.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Überspringt die Workspace-Bootstrap-Dateiinjektion.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Tools der Job verwenden darf, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte erlaubte Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie eine `/model`-Überschreibung in einer Chatsitzung: Konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Job-Modell fehlschlägt. Wenn das angeforderte Modell nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen, statt stillschweigend auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können außerdem `fallbacks` auf Payload-Ebene enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` im Job-Payload/API, wenn Sie einen strikten Cron-Lauf möchten, der nur das ausgewählte Modell versucht. Wenn ein Job `--model`, aber weder Payload- noch konfigurierte Fallbacks hat, übergibt OpenClaw eine explizite leere Fallback-Überschreibung, damit das primäre Agent-Modell nicht als verstecktes zusätzliches Wiederholungsziel angehängt wird.

Preflight-Prüfungen für lokale Provider durchlaufen konfigurierte Fallbacks, bevor ein Cron-Lauf als `skipped` markiert wird; `fallbacks: []` hält diesen Preflight-Pfad strikt.

Die Priorität der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modellüberschreibung (wenn der Lauf von Gmail kam und diese Überschreibung erlaubt ist)
2. `model` im Payload pro Job
3. Vom Benutzer ausgewählte gespeicherte Cron-Sitzungsmodellüberschreibung
4. Agent-/Standardmodellauswahl

Der Fast-Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` enthält, verwendet isoliertes Cron dies standardmäßig. Eine gespeicherte Sitzungsüberschreibung für `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration. Der Auto-Modus verwendet den Grenzwert `params.fastAutoOnSeconds` des ausgewählten Modells, wenn vorhanden, andernfalls standardmäßig 60 Sekunden.

Wenn ein isolierter Lauf eine Live-Modellwechsel-Übergabe erreicht, wiederholt Cron den Lauf mit dem gewechselten Provider/Modell und speichert diese Live-Auswahl vor der Wiederholung für den aktiven Lauf. Wenn der Wechsel außerdem ein neues Auth-Profil enthält, speichert Cron diese Auth-Profilüberschreibung ebenfalls für den aktiven Lauf. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechselwiederholungen bricht Cron ab, statt endlos zu loopen.

Bevor ein isolierter Cron-Lauf in den Agent-Runner eintritt, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` Loopback, privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt ausgefallen ist, wird der Lauf als `skipped` mit einem klaren Provider-/Modellfehler aufgezeichnet, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten lang gecacht, sodass viele fällige Jobs, die denselben ausgefallenen lokalen Ollama-, vLLM-, SGLang- oder LM Studio-Server verwenden, eine einzelne kleine Probe teilen, statt einen Request-Sturm zu erzeugen. Übersprungene Provider-Preflight-Läufe erhöhen den Backoff für Ausführungsfehler nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Skip-Benachrichtigungen möchten.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Stellt den finalen Text per Fallback an das Ziel zu, wenn der Agent nicht gesendet hat |
| `webhook`  | POSTet das Payload des abgeschlossenen Ereignisses an eine URL      |
| `none`     | Keine Fallback-Zustellung durch den Runner                         |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Für Telegram-Forumthemen verwenden Sie `-1001234567890:topic:123`; OpenClaw akzeptiert auch die Telegram-eigene Kurzform `-1001234567890:123`. Direkte RPC-/Konfigurationsaufrufer können `delivery.threadId` als String oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs beachten Groß-/Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die Announce-Zustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Provider-präfigiertes Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; zum Beispiel wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zieltyp- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanaleigene Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung gemeinsam genutzt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` auch dann verwenden, wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw das Fallback-Announce. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach der Agent-Runde mit der finalen Antwort macht.

Wenn ein Agent aus einem aktiven Chat eine isolierte Erinnerung erstellt, speichert OpenClaw das bewahrte Live-Zustellungsziel für die Fallback-Announce-Route. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellungsziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Implizite Announce-Zustellung verwendet konfigurierte Kanal-Allowlists, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen aus dem DM-Pairing-Store sind keine Empfänger für Fallback-Automatisierung; setzen Sie `delivery.to` oder konfigurieren Sie den `allowFrom`-Eintrag des Kanals, wenn ein geplanter Job proaktiv an eine DM senden soll.

## Ausgabesprache

Cron-Jobs leiten keine Antwortsprache aus Kanal, Locale oder vorherigen
Nachrichten ab. Setzen Sie die Sprachregel in die geplante Nachricht oder Vorlage:

```bash
openclaw cron edit <jobId> \
  --message "Fasse die Updates zusammen. Antworte auf Chinesisch; lasse URLs, Code und Produktnamen unverändert."
```

Behalten Sie bei Vorlagendateien die Sprachanweisung im gerenderten Prompt bei und
prüfen Sie, ob Platzhalter wie `{{language}}` ausgefüllt sind, bevor der Job ausgeführt wird. Wenn
die Ausgabe mehrere Sprachen mischt, formulieren Sie die Regel explizit, zum Beispiel: „Verwenden Sie Chinesisch
für erzählenden Text und behalten Sie technische Begriffe auf Englisch bei.“

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` ausliefert, fallen Fehlerbenachrichtigungen nun auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre Auslieferungsmodus ist `webhook`.
- `failureAlert.includeSkipped: true` aktiviert für einen Job oder eine globale Cron-Benachrichtigungsrichtlinie wiederholte Benachrichtigungen über übersprungene Läufe. Übersprungene Läufe behalten einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie den Backoff für Ausführungsfehler nicht beeinflussen.

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

Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. Aktivieren Sie dies in der Konfiguration:

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

Jede Anfrage muss das Hook-Token per Header enthalten:

- `Authorization: Bearer <token>` (empfohlen)
- `x-openclaw-token: <token>`

Query-String-Tokens werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Stellt ein Systemereignis für die Hauptsitzung in die Warteschlange:

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
    Führt einen isolierten Agent-Turn aus:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Zugeordnete Hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads mit Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter local loopback, tailnet oder einem vertrauenswürdigen Reverse Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Auth-Token nicht erneut.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um zu begrenzen, welchen effektiven Agent ein Hook ansprechen kann, einschließlich des Standard-Agent, wenn `agentId` ausgelassen wird.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sessions benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um zulässige Session-Key-Formen einzuschränken.
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

Dies schreibt die `hooks.gmail`-Konfiguration, aktiviert die Gmail-Voreinstellung und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet der Gateway beim Booten `gog gmail watch serve` und verlängert die Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

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

### Gmail-Modellüberschreibung

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

`openclaw cron run <jobId>` kehrt zurück, nachdem der manuelle Lauf in die Warteschlange eingereiht wurde. Verwenden Sie `--wait` für Shutdown-Hooks, Wartungsskripte oder andere Automatisierung, die blockieren muss, bis der eingereihte Lauf abgeschlossen ist. Der Wartemodus fragt die exakt zurückgegebene `runId` ab; er beendet sich mit `0` für den Status `ok` und mit einem Wert ungleich null für `error`, `skipped` oder ein Warte-Timeout.

Das Agent-Tool `cron` gibt kompakte Job-Zusammenfassungen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) von `cron(action: "list")` zurück; verwenden Sie `cron(action: "get", jobId: "...")` für eine vollständige Job-Definition. Direkte Gateway-Aufrufer können `compact: true` an `cron.list` übergeben; wenn es ausgelassen wird, bleibt die bestehende vollständige Antwort mit Zustellvorschauen erhalten.

`openclaw cron create` ist ein Alias für `openclaw cron add`, und neue Jobs können einen positionalen Zeitplan (`"0 9 * * 1"`, `"every 1h"`, `"20m"` oder einen ISO-Zeitstempel) gefolgt von einem positionalen Agent-Prompt verwenden. Verwenden Sie `--webhook <url>` bei `cron add|create` oder `cron edit`, um den Payload des abgeschlossenen Laufs per POST an einen HTTP-Endpunkt zu senden. Webhook-Zustellung kann nicht mit Chat-Zustellungs-Flags wie `--announce`, `--channel`, `--to`, `--thread-id` oder `--account` kombiniert werden. Bei `cron edit` heben `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` diese Routing-Felder einzeln auf (jeweils neben dem passenden Set-Flag abgelehnt); dies unterscheidet sich davon, dass `--no-deliver` die Fallback-Zustellung des Runners deaktiviert.

<Note>
Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das für den Job ausgewählte Modell.
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Lauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen.
- API-`cron.update`-Payload-Patches können `model: null` setzen, um eine gespeicherte Modellüberschreibung des Jobs zu entfernen.
- `openclaw cron edit <job-id> --clear-model` entfernt diese Überschreibung über die CLI (gleicher Effekt wie der `model: null`-Patch) und kann nicht mit `--model` kombiniert werden.
- Konfigurierte Fallback-Ketten gelten weiterhin, da Cron-`--model` ein primäres Job-Modell ist, keine Session-`/model`-Überschreibung.
- `openclaw cron add|edit --fallbacks ...` setzt den Payload `fallbacks` und ersetzt konfigurierte Fallbacks für diesen Job; `--fallbacks ""` deaktiviert Fallback und macht den Lauf strikt. `openclaw cron edit <job-id> --clear-fallbacks` entfernt die jobbezogene Überschreibung.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht stillschweigend auf das primäre Agent-Modell als zusätzliches Retry-Ziel zurück.

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

`maxConcurrentRuns` begrenzt sowohl geplanten Cron-Versand als auch die Ausführung isolierter Agent-Turns und ist standardmäßig 8. Isolierte Cron-Agent-Turns verwenden intern die dedizierte `cron-nested`-Ausführungsspur der Warteschlange; wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel fortschreiten, anstatt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsame Nicht-Cron-`nested`-Spur wird durch diese Einstellung nicht erweitert.

`cron.store` ist ein logischer Store-Schlüssel und ein Legacy-Doctor-Importpfad. Führen Sie `openclaw doctor --fix` aus, um vorhandene JSON-Stores in SQLite zu importieren und zu archivieren; zukünftige Cron-Änderungen sollten über die CLI oder die Gateway-API erfolgen.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry-Verhalten">
    **Einmaliger Retry**: Vorübergehende Fehler (Rate Limit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3-mal mit exponentiellem Backoff erneut versucht. Permanente Fehler deaktivieren sofort.

    **Wiederkehrender Retry**: exponentieller Backoff (30s bis 60m) zwischen Retries. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`) entfernt isolierte Lauf-Session-Einträge. `cron.runLog.keepLines` begrenzt beibehaltene SQLite-Laufverlaufszeilen pro Job; `maxBytes` bleibt für Konfigurationskompatibilität mit älteren dateibasierten Laufprotokollen erhalten.
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
  <Accordion title="Cron löst nicht aus">
    - Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
    - Bestätigen Sie, dass der Gateway kontinuierlich läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) gegenüber der Host-Zeitzone.
    - `reason: not-due` in der Lauf-Ausgabe bedeutet, dass der manuelle Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung">
    - Zustellmodus `none` bedeutet, dass kein Runner-Fallback-Senden erwartet wird. Der Agent kann weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass der ausgehende Versand übersprungen wurde.
    - Bei Matrix können kopierte oder Legacy-Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, weil Matrix-Raum-IDs zwischen Groß- und Kleinschreibung unterscheiden. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Channel-Auth-Fehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Zugangsdaten blockiert wurde.
    - Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw direkte ausgehende Zustellung und auch den Fallback-Pfad der eingereihten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, dass der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Channel/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint /new-artigen Rollover zu verhindern">
    - Die Frische für tägliche und Leerlauf-Resets basiert nicht auf `updatedAt`; siehe [Session-Verwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Weckvorgänge, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchhaltung können die Session-Zeile für Routing/Status aktualisieren, verlängern aber nicht `sessionStartedAt` oder `lastInteractionAt`.
    - Für Legacy-Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem JSONL-Session-Header des Transkripts wiederherstellen, wenn die Datei noch verfügbar ist. Legacy-Leerlaufzeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als ihre Leerlauf-Basislinie.

  </Accordion>
  <Accordion title="Zeitzonen-Fallstricke">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat-`activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenbuch für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Main-Session-Turns
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
