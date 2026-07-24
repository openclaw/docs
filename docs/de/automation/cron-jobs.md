---
read_when:
    - Hintergrundaufgaben oder Aktivierungen planen
    - Externe Auslöser (Webhooks, Gmail) mit OpenClaw verbinden
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Aufgaben, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-07-24T04:51:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dd889cf8e45196eda3ec7c2af930abcb2cc2bae8bad2dbdcaf3cd521a9e884b2
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateways. Er speichert Jobs dauerhaft, weckt den Agent zum richtigen Zeitpunkt und kann Ausgaben an einen Chat-Kanal, einen Webhook oder an kein Ziel übermitteln.

## Schnellstart

<Steps>
  <Step title="Einmalige Erinnerung hinzufügen">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Erinnerung" \
      --session main \
      --system-event "Erinnerung: Entwurf der Cron-Dokumentation prüfen" \
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

- Cron wird **innerhalb des Gateway-Prozesses** ausgeführt, nicht innerhalb des Modells. Das Gateway muss laufen, damit Zeitpläne ausgelöst werden.
- Jobdefinitionen, Laufzeitstatus und Ausführungsverlauf werden dauerhaft in der gemeinsam genutzten SQLite-Zustandsdatenbank von OpenClaw gespeichert, sodass Zeitpläne bei Neustarts nicht verloren gehen.
- Jede Cron-Ausführung erstellt einen Datensatz für eine [Hintergrundaufgabe](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht; übergeben Sie `--keep-after-run`, um sie beizubehalten.
- Zeitbudget pro Ausführung: `--timeout-seconds`, sofern festgelegt. Andernfalls werden isolierte/abgekoppelte Agent-Turn-Jobs durch den eigenen 60-Minuten-Watchdog von Cron begrenzt, bevor das zugrunde liegende Agent-Turn-Zeitlimit (`agents.defaults.timeoutSeconds`, standardmäßig 48 Stunden) überhaupt greifen würde; Befehlsjobs haben standardmäßig ein Zeitlimit von 10 Minuten und Skript-Payloads von 5 Minuten.
- Beim Start des Gateways werden überfällige isolierte Agent-Turn-Jobs neu geplant, statt sofort erneut ausgeführt zu werden. Dadurch bleibt die Bootstrap-Arbeit für Modell und Tools außerhalb des Zeitfensters für den Kanalaufbau.
- Wenn Sie `openclaw agent` über System-Cron oder einen anderen externen Scheduler steuern, versehen Sie ihn mit einer Eskalation zum erzwungenen Beenden, obwohl die CLI `SIGTERM`/`SIGINT` bereits verarbeitet. Gateway-gestützte Ausführungen fordern das Gateway auf, angenommene Ausführungen abzubrechen; `--local`-Ausführungen erhalten dasselbe Abbruchsignal. Bevorzugen Sie bei GNU `timeout` `timeout -k 60 600 openclaw agent ...` gegenüber einfachem `timeout 600 ...` — der Wert `-k` dient als Rückfallebene, falls der Prozess nicht rechtzeitig beendet werden kann. Verwenden Sie für systemd-Units ein `SIGTERM`-Stoppsignal mit einem Kulanzzeitfenster (`TimeoutStopSec`) vor dem endgültigen Beenden. Wird eine `--run-id` erneut verwendet, während die ursprüngliche Gateway-Ausführung noch aktiv ist, wird das Duplikat als laufend gemeldet, statt eine zweite Ausführung zu starten.

<AccordionGroup>
  <Accordion title="Absicherung isolierter Ausführungen">
    - Isolierte Ausführungen versuchen nach bestem Ermessen, nach Abschluss die nachverfolgten Browser-Tabs und -Prozesse ihrer `cron:<jobId>`-Sitzung zu schließen und alle für den Job erstellten gebündelten MCP-Laufzeitinstanzen über denselben gemeinsam genutzten Bereinigungspfad zu entsorgen, der auch für Haupt- und benutzerdefinierte Sitzungen verwendet wird. Bereinigungsfehler werden ignoriert, damit weiterhin das Cron-Ergebnis maßgeblich bleibt.
    - Isolierte Ausführungen mit der eingeschränkten Berechtigung zur Cron-Selbstbereinigung können den Scheduler-Status, eine auf den eigenen Job beschränkte Liste und den Ausführungsverlauf dieses Jobs lesen und dürfen ausschließlich den eigenen Job entfernen.
    - Isolierte Ausführungen schützen vor veralteten Bestätigungsantworten: Wenn das erste Ergebnis lediglich eine vorläufige Statusmeldung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein untergeordneter Subagent mehr für die endgültige Antwort zuständig ist, fordert OpenClaw einmal erneut das tatsächliche Ergebnis an, bevor es übermittelt wird.
    - Strukturierte Metadaten zur Ausführungsverweigerung (einschließlich Node-Host-Wrappern vom Typ `UNAVAILABLE`, deren verschachtelter Fehler mit `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST` beginnt) werden erkannt, damit ein blockierter Befehl nicht als erfolgreiche Ausführung gemeldet wird, während gewöhnlicher Assistant-Text nicht fälschlich als Verweigerung eingestuft wird.
    - Fehler des Agent auf Ausführungsebene gelten auch ohne Antwort-Payload als Jobfehler, sodass Modell-/Provider-Fehler die Fehlerzähler erhöhen und Fehlermeldungen auslösen, statt den Job als erfolgreich abzuschließen.
    - Wenn ein Job `timeoutSeconds` erreicht, bricht Cron die Ausführung ab und gewährt ihr ein kurzes Bereinigungszeitfenster. Wird sie darin nicht beendet, hebt die Gateway-eigene Bereinigung die Sitzungszuständigkeit dieser Ausführung zwangsweise auf, bevor Cron das Zeitlimit protokolliert, sodass in der Warteschlange befindliche Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung blockiert bleibt.
    - Blockierungen bei Einrichtung oder Start erhalten ein phasenspezifisches Zeitlimit (beispielsweise `cron: isolated agent setup timed out before runner start` oder `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Diese Watchdogs decken eingebettete und CLI-gestützte Provider bereits ab, bevor deren externer CLI-Prozess startet, und werden unabhängig von langen `timeoutSeconds`-Werten begrenzt, damit Fehler bei Kaltstart, Authentifizierung oder Kontext schnell sichtbar werden.

  </Accordion>
  <Accordion title="Aufgabenabgleich">
    Beim Abgleich von Cron-Aufgaben hat zunächst der Laufzeitstatus Vorrang, danach der dauerhafte Verlauf: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit den entsprechenden Job weiterhin als laufend nachverfolgt, selbst wenn noch ein alter Datensatz einer untergeordneten Sitzung vorhanden ist. Sobald die Laufzeit nicht mehr für den Job zuständig ist und ein Kulanzzeitfenster von 5 Minuten abgelaufen ist, prüft die Wartung gespeicherte Ausführungsprotokolle und den Jobstatus der passenden `cron:<jobId>:<startedAt>`-Ausführung. Ein dort vorhandenes Endergebnis schließt das Aufgabenregister ab; andernfalls kann die Gateway-eigene Wartung die Aufgabe als `lost` markieren. Eine Offline-CLI-Prüfung kann den Zustand aus dem dauerhaften Verlauf wiederherstellen, aber ihre eigene leere Menge aktiver prozessinterner Jobs beweist nicht, dass eine Gateway-eigene Ausführung beendet ist.
  </Accordion>
</AccordionGroup>

## Zeitplantypen

| Art       | CLI-Flag           | Beschreibung                                                                                             |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`             | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)                                                  |
| `every`   | `--every`          | Festes Intervall (`10m`, `1h`, `1d`)                                                                    |
| `cron`    | `--cron`           | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz`                                                 |
| `on-exit` | `--on-exit`        | Einmal auslösen, wenn ein überwachter Befehl beendet wird (Ereignisauslöser; übersteht den Abbau des Turns; optional `--on-exit-cwd`) |
| `stream`  | `--stream-command` | Aus Stapelzeilen auslösen, die von einem überwachten langlebigen Befehl erzeugt werden                        |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` hinzu, um ein `--at`-Datum mit Uhrzeit ohne Offset in dieser IANA-Zeitzone zu interpretieren oder einen Cron-Ausdruck darin auszuwerten. Cron-Ausdrücke ohne `--tz` verwenden die Zeitzone des Gateway-Hosts. `--tz` ist nicht zusammen mit `--every` oder `--on-exit` gültig.

Wiederkehrende Ausdrücke zur vollen Stunde (Minute `0` mit einem Platzhalter im Stundenfeld) werden automatisch um bis zu 5 Minuten versetzt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um eine präzise Zeitsteuerung zu erzwingen, oder `--stagger 30s` für ein explizites Zeitfenster (nur Cron-Zeitpläne).

### Migration von Heartbeat-Aufgaben

Der ältere Heartbeat-Arbeitsbereich unterstützte einen strukturierten `tasks:`-Block. Führen Sie nach dem Upgrade `openclaw doctor --fix` aus, um jeden Eintrag in einen gewöhnlichen bearbeitbaren Cron-Job der Hauptsitzung umzuwandeln. Doctor behält das Intervall und den vorherigen Zeitpunkt der letzten Ausführung bei, erstellt die Jobs vor dem Entfernen des Blocks und führt dieselben Deklarationsschlüssel bei erneuter Ausführung sicher zusammen.

Diese migrierten Jobs verwenden öffentliche `systemEvent`-Payloads, sodass `openclaw cron list`, `get`, `edit` und `remove` sowie das Cron-Tool sie wie andere Jobs verwalten. Ihre Ausführung verwendet den abgesicherten Wake-Vorgang für Heartbeat-Aufgaben: Aktive Stunden, Mindestabstände, Überlastungsschutz und Wiederholungsversuche bei Auslastung gelten weiterhin, während Cron den unabhängigen Takt jeder Aufgabe steuert. Jobs, die im selben Zusammenfassungszeitfenster fällig sind, können sich einen Heartbeat-Turn teilen. Ein geplanter Termin außerhalb der aktiven Heartbeat-Zeiten wird übersprungen und beim nächsten Termin des Jobs erneut versucht.

Der Heartbeat-Arbeitsbereich enthält jetzt ausschließlich Überwachungstext. Heartbeats der Laufzeit interpretieren `tasks:`-Text nicht als Zeitpläne; erstellen Sie neue wiederkehrende Aufgaben mit Cron.

### Stream-Quellen

Ein Stream-Zeitplan führt einen vom Operator erstellten argv-Befehl unter dem Gateway dauerhaft aus und löst den Job anhand seiner stdout- und stderr-Zeilen aus. Stream-Zeitpläne sind ereignisgesteuert, niemals zeitlich fällig und erfordern `cron.triggers.enabled: true`, da der langlebige Befehl derselben unbeaufsichtigten Vertrauensklasse wie Trigger-Skripte angehört. Durch Deaktivieren oder Entfernen des Jobs wird der Prozess beendet; beim Herunterfahren des Gateways wird auf den Abbau des Prozessbaums gewartet. Schnelle Fehler führen zu Neustarts mit dem integrierten Fehler-Backoff von Cron. Nach fünf aufeinanderfolgenden Ausführungen, die jeweils kürzer als 60 Sekunden dauern, verbleibt der Job in einem Fehlerstatus und verwendet den normalen Pfad für Fehlerwarnungen; aktivieren Sie den Job manuell erneut, um die Neustartbegrenzung zurückzusetzen.

```bash
openclaw cron add \
  --name "Build-Ereignisstream" \
  --stream-command '["node","scripts/build-events.mjs"]' \
  --stream-mode match \
  --stream-match '^(failed|recovered):' \
  --stream-batch-ms 250 \
  --session isolated \
  --message "Diese Build-Ereignisse untersuchen."
```

`mode: "line"` (Standardwert) akzeptiert jede Zeile. `mode: "match"` akzeptiert nur Zeilen, die dem kompilierten regulären Ausdruck `match` entsprechen. Ein Stapel wird nach `batchMs` ohne Aktivität (standardmäßig 250 ms, begrenzt auf 50–5000) oder bei `maxBatchBytes` (standardmäßig 16384, begrenzt auf 1024–65536) geschlossen. Bei Erreichen der Bytegrenze endet der Stapel mit `[truncated]`. Der Übereinstimmungsmodus wertet vollständige Zeilen stets anhand ihres gesamten Textes aus, auch über `maxBatchBytes` hinaus (nur der übermittelte Stapel wird gekürzt); eine an der begrenzten Rohdaten-Aufnahmegrenze abgeschnittene Zeile ist lediglich ein Präfix und wird daher als nicht übereinstimmend behandelt, statt ein am Ende verankertes Muster auf dem abgeschnittenen Text auszulösen. Der Stapel wird an den Text des Systemereignisses oder die Agent-Turn-Nachricht angehängt. Befehls-Payloads werden für Stream-Zeitpläne abgelehnt, da die Prozesszuständigkeit zwischen Quellbefehl und Payload-Befehl mehrdeutig wäre.

Pro Job werden nur eine Payload-Auslösung und ein begrenzter ausstehender Stapel beibehalten. Zeilen, die während der Ausführung eines Payloads oder vor Ablauf des integrierten 30-sekündigen Trigger-Intervalls eintreffen, werden in diesem ausstehenden Stapel zusammengeführt, statt eine unbegrenzte Warteschlange aufzubauen. Eine einzelne serialisierte Instanz protokolliert durch Sperren verworfene Ausführungen, Payload-Fehler und Dispatches bei inaktiver Ausführung in `streamDroppedBatches`; begrenzte Zusammenführungen erhöhen `streamCoalescedBatches`. Fehlgeschlagene Payloads werden nicht erneut versucht, da sie möglicherweise nicht idempotent sind. Eine logische Quellidentität bleibt über Neustarts überwachter untergeordneter Prozesse hinweg stabil, wird jedoch geändert, wenn die Quelle deaktiviert, entfernt oder ersetzt wird. Dadurch können Stapel aus der ausgemusterten Quelle selbst nach einer Änderung von A zu B und zurück zu A nicht ausgelöst werden. Nach Abschluss eines Stopps bleiben verspätete Callbacks eines alten untergeordneten Prozesses wirkungslos. V1 enthält keine native WebSocket-Quelle; überbrücken Sie eine solche Quelle mit einem argv-Befehl wie `websocat wss://example.invalid/events`.

Wenn ein Stream-Job zusätzlich `trigger.script` verwendet, wird die Sperre einmal pro geschlossenem Stapel ausgeführt. Der aktuelle Stapel ist als tiefgehend eingefrorener `trigger.streamBatch`-String neben `trigger.state` verfügbar. `fire: false` verwirft diesen Stapel nach dem dauerhaften Speichern des Sperrstatus. `fire: true` behält die vorhandene Semantik der Trigger-Nachricht bei und hängt anschließend den Stapel an das resultierende Payload an. Ein Stream-Job kann stattdessen ein Skript-Payload ohne Bedingungssperre verwenden; dieses Skript empfängt den Stapel über denselben `trigger.streamBatch`-Wert. Die Kombination eines Skript-Payloads mit einer Bedingungssperre wird abgelehnt, da beide den dauerhaft gespeicherten `trigger.state`-Slot beanspruchen würden.

### Dynamischer Takt (Steuerung)

Wiederkehrende Jobs können `pacing.min` und/oder `pacing.max` auf Dauerangaben wie `15m` oder `4h` setzen; mindestens eine Grenze ist erforderlich. Verwenden Sie `--pacing-min` und `--pacing-max` zusammen mit `cron add|edit` (`--clear-pacing` entfernt beide Grenzen).

Während eines isolierten Laufs kann ein getakteter Job das Tool `cron` mit `action: "next_check"` und `in: "30m"` aufrufen. Der Vorschlag gilt nur für diesen aktuell laufenden Job und wird ab dem erfolgreichen Abschluss des Laufs gemessen. OpenClaw begrenzt ihn stillschweigend auf die konfigurierten Grenzen.

Eine Taktung ohne Vorschlag lässt den normalen Zeitplan unverändert. Fehlgeschlagene, wegen Zeitüberschreitung abgebrochene und übersprungene Läufe verwerfen den Vorschlag, sodass das bestehende Wiederholungs- und Fehler-Backoff-Verhalten Vorrang hat. Das manuelle Erzwingen eines wiederkehrenden Jobs erfolgt außerhalb des regulären Ablaufs und behält dessen ausstehenden natürlichen oder getakteten Zeitpunkt bei. Bei bedingungsausgelösten Jobs bleibt das integrierte Mindestintervall auch dann eine Untergrenze, wenn ein Vorschlag eine frühere Prüfung anfordert.

### Monatstag und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Feld für den Monatstag als auch das für den Wochentag keine Platzhalter enthalten, gilt für croner eine Übereinstimmung, wenn **eines der beiden** Felder übereinstimmt, nicht beide. Dies entspricht dem Standardverhalten von Vixie cron.

```bash
# Beabsichtigt: „9 Uhr am 15., aber nur wenn es ein Montag ist“
# Tatsächlich: „9 Uhr an jedem 15. UND 9 Uhr an jedem Montag“
0 9 15 * 1
```

Dies wird ungefähr 5–6-mal pro Monat statt 0–1-mal pro Monat ausgelöst. Um beide Bedingungen vorauszusetzen, verwenden Sie den Wochentagsmodifikator `+` von croner (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ereignisauslöser (Bedingungswächter)

Ein Ereignisauslöser ergänzt einen `every`-, `cron`- oder `stream`-Zeitplan um ein Bedingungsskript ohne Benutzeroberfläche. Zeitpläne werten es bei Fälligkeit aus; Stream-Zeitpläne werten es für jeden abgeschlossenen Batch aus. Cron führt die normale Nutzlast nur aus, wenn das Skript `fire: true` zurückgibt:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Wird nur ausgelöst, wenn sich der beobachtete Status von der letzten Auswertung unterscheidet.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Untersuchen Sie die Änderung des CI-Status." },
}
```

Das Skript muss `{ fire, message?, state? }` zurückgeben. Der vorherige JSON-Zustand ist als tief eingefrorenes `trigger.state` verfügbar; Stream-Gates erhalten außerdem den aktuellen Batch als `trigger.streamBatch`. Geben Sie einen neuen `state`-Wert zurück, um ihn zu persistieren. Der Zustand ist auf 16 KB begrenzt. Wenn ein auslösendes Ergebnis `message` enthält, hängt Cron es vor der Ausführung an den Systemereignistext oder die Agent-Turn-Nachricht an. `once: true` deaktiviert den Job nach seiner ersten erfolgreich ausgelösten Nutzlast.

`fire: false` persistiert Auswertungszustand und Zähler und plant anschließend neu, ohne einen Verlaufseintrag für den Lauf zu erstellen. Wenn ein ausgelöster Nutzlastlauf fehlschlägt, wird das zurückgegebene `state` **nicht** persistiert – die nächste Auswertung sieht den vorherigen Zustand und kann erneut auslösen. Schreiben Sie Skripte daher als schreibgeschützte Prüfungen und belassen Sie Aktionen in der Nutzlast. Auslöserzeitpläne haben ein integriertes Mindestintervall von 30 Sekunden. Jede Auswertung verfügt über ein Echtzeitbudget von 30 Sekunden und bis zu 5 Tool-Aufrufe.

Konzipieren Sie Wächter rund um **handlungsrelevante Zustände**, nicht nur um Erfolg: Ein Wächter, der verstummt, wenn seine Prüfung fehlschlägt oder wegen Zeitüberschreitung abgebrochen wird, wirkt trotz seines Defekts intakt. Vergleichen Sie die Beobachtung mit `trigger.state` und geben Sie einen aktuellen Zustand zurück, um Duplikate zu vermeiden; verlassen Sie sich nicht auf Modell- oder Prozessspeicher. Gestalten Sie `message` beim Auslösen eigenständig verständlich, da es zum vollständigen Ereigniskontext des ausgelösten Laufs wird.

<Warning>
Die Aktivierung von `cron.triggers.enabled` erlaubt sowohl Bedingungsauslöserskripten als auch `script`-Nutzlasten, ohne Benutzeroberfläche mit der **vollständigen Tool-Richtlinie des zuständigen Agenten einschließlich `exec`** ausgeführt zu werden. Behandeln Sie dies als unbeaufsichtigte Codeausführung mit den Berechtigungen dieses Agenten; lassen Sie die Funktion deaktiviert, sofern nicht jeder Agent, der Cron-Jobs erstellen darf, entsprechend vertrauenswürdig ist.
</Warning>

Erstellen Sie einen Wächter aus einer lokalen Skriptdatei (`-` liest das Skript von der Standardeingabe):

```bash
openclaw cron add \
  --name "PR-CI-Wächter" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Reagieren Sie auf die Änderung des CI-Status" \
  --session isolated
```

## Nutzlasten

Jeder Job enthält genau eine durch ein Flag ausgewählte Nutzlastart:

| Nutzlast       | Flag                                           | Ausführung                                                       |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Systemereignis  | `--system-event <text>`                        | Wird in die Hauptsitzung eingereiht, löst selbst keinen Modellaufruf aus    |
| Agentennachricht | `--message <text>`                             | Ein modellgestützter Agent-Turn                                  |
| Befehl       | `--command <shell>` oder `--command-argv <json>` | Eine Shell/ein Prozess auf dem Gateway-Host, kein Modellaufruf         |
| Skript        | `--script <file\|->`                           | Ein Code-Mode-Skript ohne Benutzeroberfläche, das die Tools des zuständigen Agenten verwendet |

Eine zusätzliche Nutzlastart, `heartbeat`, ist systemverwaltet: Das Gateway gleicht pro Agent mit aktiviertem Heartbeat einen Heartbeat-Überwachungsjob ab (siehe [Heartbeat](/de/gateway/heartbeat)). Er erscheint in `cron list --all`, kann jedoch nicht über die CLI oder API erstellt oder bearbeitet werden. Die Heartbeat-Konfiguration wird beim Start, beim Neuladen der Konfiguration oder durch `openclaw doctor --fix` in den persistierten Überwachungszeitplan übertragen. Wenn Cron deaktiviert ist, wird die Überwachung nicht ausgeführt und es läuft kein ersatzweiser Heartbeat-Timer.

### Agent-Turn-Optionen

<ParamField path="--message" type="string" required>
  Prompt-Text (für Jobs mit isolierter, aktueller oder benutzerdefinierter Sitzung erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modellüberschreibung; muss zu einem zulässigen Modell aufgelöst werden, andernfalls schlägt der Lauf mit einem Validierungsfehler fehl.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Liste der Fallback-Modelle pro Job, zum Beispiel `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Entfernt bei `cron edit` die Fallback-Überschreibung pro Job, sodass der Job der konfigurierten Fallback-Priorität folgt. Kann nicht mit `--fallbacks` kombiniert werden.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Entfernt bei `cron edit` die Modellüberschreibung pro Job, sodass der Job der normalen Cron-Modellpriorität folgt (gespeicherte Cron-Sitzungsüberschreibung, andernfalls Agenten-/Standardmodell). Kann nicht mit `--model` kombiniert werden.
</ParamField>
<ParamField path="--thinking" type="string">
  Überschreibung der Thinking-Stufe (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Die verfügbaren Stufen hängen weiterhin vom ausgewählten Modell und der Agenten-Laufzeit ab.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Entfernt bei `cron edit` die Thinking-Überschreibung pro Job. Kann nicht mit `--thinking` kombiniert werden.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Überspringt die Einfügung der Workspace-Bootstrap-Datei.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

Neue Jobs, die Tools ausführen können, speichern immer eine explizite Tool-Richtlinie. Von einem Agenten erstellte Jobs
sind auf die Tools beschränkt, die dem erstellenden Turn zur Verfügung stehen, und der Agent kann die
gespeicherte Liste nicht erweitern. Von einem authentifizierten Operator ohne `--tools` erstellte Jobs speichern eine
uneingeschränkte `*`-Richtlinie; `cron edit --clear-tools` stellt diese explizite uneingeschränkte
Richtlinie wieder her. Bestehende Jobs, die vor der Einführung expliziter Tool-Richtlinien erstellt wurden, behalten ihr aktuelles Verhalten,
bis ihre Tool-Richtlinie ausdrücklich bearbeitet oder der Job neu erstellt wird.

`--model` legt das primäre Modell des Jobs fest; es ersetzt keine `/model`-Überschreibung einer Sitzung, sodass konfigurierte Fallback-Ketten weiterhin zusätzlich angewendet werden. Ein nicht auflösbares oder unzulässiges Modell lässt den Lauf mit einem ausdrücklichen Validierungsfehler fehlschlagen, statt stillschweigend auf das Standardmodell zurückzufallen. Wenn ein Job `--model`, aber keine explizite oder konfigurierte Fallback-Liste besitzt, übergibt OpenClaw eine leere Fallback-Überschreibung, statt das primäre Modell des Agenten stillschweigend als verborgenes Wiederholungsziel anzuhängen.

Priorität der Modellauswahl für isolierte Jobs, von der höchsten zur niedrigsten:

1. Nutzlastbezogenes `model` (explizite Konfiguration; ein unzulässiges Modell lässt den Lauf fehlschlagen)
2. Modellüberschreibung des Gmail-Hooks (nur wenn der Lauf von Gmail stammt und diese Überschreibung zulässig ist)
3. Vom Benutzer ausgewählte, gespeicherte Modellüberschreibung der Cron-Sitzung
4. Agenten-/Standardmodellauswahl

Der schnelle Modus folgt der aufgelösten aktuellen Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` enthält, verwendet isoliertes Cron dies standardmäßig; eine gespeicherte `fastMode`-Überschreibung der Sitzung (danach ein `fastModeDefault` des Agenten) hat in beiden Richtungen weiterhin Vorrang vor der Modellkonfiguration. Der automatische Modus verwendet den `params.fastAutoOnSeconds`-Grenzwert des Modells, standardmäßig 60 Sekunden.

Wenn ein Lauf auf eine Übergabe durch einen aktuellen Modellwechsel trifft, wiederholt Cron den Versuch mit dem gewechselten Provider/Modell und persistiert diese Auswahl (sowie ein etwaiges neues Authentifizierungsprofil) für den aktiven Lauf. Wiederholungsversuche sind begrenzt: Nach dem ersten Versuch und 2 Wiederholungen aufgrund eines Wechsels bricht Cron ab, statt eine Schleife zu erzeugen.

Bevor ein isolierter Lauf beginnt, prüft OpenClaw erreichbare lokale Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` Loopback, ein privates Netzwerk oder `.local` ist. Diese Vorabprüfung durchläuft die konfigurierte Fallback-Kette des Jobs und markiert den Lauf erst dann als `skipped`, wenn alle Kandidaten nicht erreichbar sind; `--fallbacks ""` beschränkt diesen Durchlauf strikt auf das primäre Modell. Bei einem ausgefallenen Endpunkt wird der Lauf mit einem eindeutigen Fehler als `skipped` erfasst, statt einen Modellaufruf zu starten. Das Ergebnis wird pro Endpunkt (nicht pro Job oder Modell) 5 Minuten zwischengespeichert, sodass viele fällige Jobs, die denselben ausgefallenen lokalen Ollama-/vLLM-/SGLang-/LM-Studio-Server verwenden, nur eine Prüfung statt eines Anfragesturms verursachen. Durch die Vorabprüfung übersprungene Läufe erhöhen das Backoff für Ausführungsfehler nicht; setzen Sie `failureAlert.includeSkipped`, um wiederholte Überspringungswarnungen zu aktivieren.

### Befehlsnutzlasten

Befehlsnutzlasten führen deterministische Skripte innerhalb des Gateway-Schedulers aus, ohne einen modellgestützten Turn zu starten. Sie werden auf dem Gateway-Host ausgeführt, erfassen Standardausgabe/Standardfehlerausgabe, zeichnen den Lauf im Cron-Verlauf auf und verwenden dieselben Zustellmodi `announce`, `webhook` und `none` wie Agent-Turn-Jobs.

<Note>
Befehls-Cron ist eine Gateway-Automatisierungsoberfläche für Operator-Administratoren und kein `tools.exec`-Aufruf eines Agenten. Das Erstellen, Aktualisieren, Entfernen oder manuelle Ausführen von Cron-Jobs erfordert `operator.admin`; geplante Befehlsläufe werden später als diese vom Administrator erstellte Automatisierung innerhalb des Gateway-Prozesses ausgeführt. Die Ausführungsrichtlinie für Agenten (`tools.exec.mode`, Genehmigungsabfragen, Tool-Zulassungslisten pro Agent) steuert für das Modell sichtbare Ausführungstools, nicht die Befehlsnutzlasten von Cron.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Prüfung der Warteschlangentiefe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für die exakte Ausführung von argv ohne Shell-Parsing. Die optionalen Optionen `--command-env KEY=VALUE` (wiederholbar), `--command-input`, `--timeout-seconds` (standardmäßig 10 Minuten), `--no-output-timeout-seconds` und `--output-max-bytes` steuern die Prozessumgebung, die Standardeingabe und die Ausgabegrenzen.

Der zugestellte Text wird aus der Prozessausgabe abgeleitet: Eine nicht leere Standardausgabe hat Vorrang; wenn die Standardausgabe leer und die Standardfehlerausgabe nicht leer ist, wird die Standardfehlerausgabe zugestellt; wenn beide vorhanden sind, sendet Cron einen kleinen `stdout:`-/`stderr:`-Block. Der Exit-Code `0` zeichnet den Lauf als `ok` auf; ein von null abweichender Exit-Code, ein Signal, eine Zeitüberschreitung oder eine Zeitüberschreitung ohne Ausgabe zeichnet `error` auf und kann Fehlerwarnungen auslösen. Ein Befehl, der nur `NO_REPLY` ausgibt, verwendet die normale Cron-Unterdrückung für stille Token und sendet nichts an den Chat zurück.

### Skriptnutzlasten

Skript-Payloads werden ohne Benutzeroberfläche im selben Code-Mode-Executor wie Trigger-Skripte ausgeführt, ohne einen dialogorientierten Agent-Turn zu starten. Aktivieren Sie `cron.triggers.enabled`, bevor Sie sie erstellen oder ausführen; diese Schutzschranke für gefährliche Automatisierung gilt sowohl für Trigger-Skripte als auch für Skript-Payloads. Skript-Jobs unterstützen nur die Session-Ziele `main` und `isolated`.

```bash
openclaw cron create "0 * * * *" \
  --name "Stündliche Warteschlangenprüfung" \
  --script ./automation/check-queue.js \
  --script-timeout-seconds 300 \
  --script-tool-budget 50 \
  --session isolated \
  --announce
```

Verwenden Sie `--script <file|->`, um JavaScript aus einer Datei oder von stdin zu lesen. Das Zeitlimit beträgt standardmäßig 300 Sekunden und ist auf 900 begrenzt; das Tool-Budget beträgt standardmäßig 50 Aufrufe und ist auf 200 begrenzt. Diese Payload-Budgets sind von den kleineren Auswertungsbudgets der Trigger-Schutzschranke getrennt.

Das Skript kann ein Objekt mit diesen optionalen Feldern zurückgeben:

- `notify`: Text, der über den Zustellmodus `announce`, `webhook` oder `none` des Jobs zugestellt wird. Wenn das Feld fehlt, wird nichts zugestellt. Bei einem `main`-Job wird der Text zu einem Systemereignis.
- `wake`: `"now"` fordert unmittelbar nach dem Einreihen von `notify` (oder eines kompakten Abschlussereignisses) einen Heartbeat an; `"next-heartbeat"` reiht das Ereignis für den nächsten Heartbeat ein.
- `state`: JSON-Zustand, auf 16 KB begrenzt und nur nach einer erfolgreichen Ausführung gespeichert. Die nächste Ausführung erhält eine unveränderliche Kopie als `trigger.state`, entsprechend den Trigger-Skripten. Da dieser Namensraum nur einen Besitzer für den gespeicherten Zustand hat, kann ein Skript-Payload im selben Job nicht mit einem Bedingungstrigger kombiniert werden.
- `nextCheck`: Eine Dauer wie `"15m"`. Sie ist nur für Jobs mit aktivierter Taktung gültig und verwendet dieselbe Taktungsbegrenzung wie Vorschläge von Agent-Turns.

Ausnahmen, Zeitüberschreitungen, ausgeschöpfte Tool-Budgets, ungültige Ergebnisse und `nextCheck` ohne Taktung sind normale Cron-Ausführungsfehler: Sie werden im Ausführungsverlauf, bei der Rückstufung und bei der Behandlung von Fehlerwarnungen berücksichtigt, ohne den zurückgegebenen Zustand zu speichern.

## Ausführungsarten

| Art             | Wert von `--session` | Wird ausgeführt in        | Am besten geeignet für          |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Haupt-Session   | `main`              | Eigene Cron-Aktivierungsspur | Erinnerungen, Systemereignisse |
| Isoliert        | `isolated`          | Eigene `cron:<jobId>` | Berichte, Hintergrundaufgaben   |
| Aktuelle Session | `current`           | Bei der Erstellung gebunden | Kontextbezogene wiederkehrende Aufgaben |
| Benutzerdefinierte Session | `session:custom-id` | Dauerhafte benannte Session | Workflows, die auf dem Verlauf aufbauen |

<AccordionGroup>
  <Accordion title="Haupt-Session, isolierte und benutzerdefinierte Session im Vergleich">
    Jobs der **Haupt-Session** reihen ein Systemereignis in eine Cron-eigene Ausführungsspur ein und aktivieren optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Sie können für Antworten den letzten Zustellkontext der Ziel-Haupt-Session verwenden, hängen routinemäßige Cron-Turns jedoch nicht an die menschliche Chatspur an und verlängern nicht die Aktualität für tägliche oder inaktivitätsbedingte Zurücksetzungen der Ziel-Session. **Isolierte** Jobs führen einen eigenen Agent-Turn mit einer neuen Session aus. **Benutzerdefinierte Sessions** (`session:xxx`) bewahren den Kontext über Ausführungen hinweg und ermöglichen damit Workflows wie tägliche Stand-ups, die auf vorherigen Zusammenfassungen aufbauen.

    Cron-Ereignisse der Haupt-Session sind eigenständige Systemereignis-Erinnerungen. Sie enthalten nicht automatisch den standardmäßigen Heartbeat-Prompt oder die Arbeitsnotizen des Heartbeat-Monitors; geben Sie dies im Text des Cron-Ereignisses ausdrücklich an, wenn eine Erinnerung diesen Kontext berücksichtigen soll.

  </Accordion>
  <Accordion title="Was „neue Session“ bei isolierten Jobs bedeutet">
    Pro Ausführung wird eine neue Transkript-/Session-ID verwendet. OpenClaw übernimmt sichere Einstellungen (Einstellungen für Denken/schnelle oder ausführliche Antworten, Bezeichnungen sowie ausdrücklich vom Benutzer ausgewählte Modell-/Authentifizierungsüberschreibungen), übernimmt jedoch keinen impliziten Gesprächskontext aus einem älteren Cron-Eintrag: Kanal-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Rechteerhöhung, Ursprung oder ACP-Runtime-Bindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Gesprächskontext aufbauen soll.
  </Accordion>
  <Accordion title="Vertrag für unbeaufsichtigte Ausführungen">
    Agent-Turns von isolierten Cron- und Hook-Ausführungen sind ausdrücklich unbeaufsichtigt: Es ist niemand anwesend, um Rückfragen zu beantworten oder Genehmigungen zu erteilen. Die abschließende Antwort muss das Ergebnis liefern und darf kein Plan, keine Bestätigung und keine Bitte um Eingaben sein. Der Agent gibt `HEARTBEAT_OK` zurück, wenn nichts zu tun ist, und benennt Fehler eindeutig; Cron verwaltet die Richtlinien für Wiederholungsversuche und Fehlerwarnungen.

    Bei vertrauenswürdigen geplanten Jobs haben die eigenen Anweisungen des Jobs Vorrang, wenn sie bewusst um eine Frage oder einen Plan bitten, und der Agent darf einen nicht mehr benötigten Job entfernen. Externe Hook-Turns erhalten nur den allgemeinen Vertrag für unbeaufsichtigte Ausführungen; über die Grenze für externe Inhalte hinweg erhalten sie weder diese Ausnahme noch Hinweise zur Selbstentfernung.

  </Accordion>
  <Accordion title="Zustellung von Subagenten und Discord">
    Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, wird für die Zustellung die endgültige Ausgabe des letzten Nachfolgers gegenüber veraltetem vorläufigem Text des übergeordneten Agenten bevorzugt. Falls Nachfolger noch ausgeführt werden, unterdrückt OpenClaw diese unvollständige Aktualisierung des übergeordneten Agenten, statt sie anzukündigen.

    Bei reinen Text-Zielen für Discord-Ankündigungen sendet OpenClaw den kanonischen endgültigen Assistententext einmal, statt sowohl gestreamten/vorläufigen Text als auch die endgültige Antwort wiederzugeben. Medien und strukturierte Discord-Payloads werden weiterhin separat zugestellt, damit Anhänge und Komponenten nicht verloren gehen.

  </Accordion>
</AccordionGroup>

## Zustellung und Ausgabe

| Modus      | Verhalten                                                           |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Stellt den endgültigen Text ersatzweise an das Ziel zu, wenn der Agent ihn nicht gesendet hat |
| `webhook`  | Sendet den Payload des Abschlussereignisses per POST an eine URL    |
| `none`     | Keine ersatzweise Zustellung durch den Runner                       |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Verwenden Sie für Telegram-Forenthemen `-1001234567890:topic:123`; OpenClaw akzeptiert außerdem die Telegram-eigene Kurzform `-1001234567890:123`. Direkte RPC-/Konfigurationsaufrufer können `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Ziele für Slack/Discord/Mattermost verwenden explizite Präfixe (`channel:<id>`, `user:<id>`). Bei Matrix-Raum-IDs wird zwischen Groß- und Kleinschreibung unterschieden; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` von Matrix.

Wenn die Ankündigungszustellung `channel: "last"` verwendet oder `channel` fehlt, kann ein Ziel mit Provider-Präfix wie `telegram:123` den Kanal auswählen, bevor Cron auf den Session-Verlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin ausgewiesen werden, dienen als Provider-Selektoren. Wenn `delivery.channel` explizit angegeben ist, muss das Zielpräfix denselben Provider benennen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Präfixe für Zielart und Dienst (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) bleiben kanaleigene Zielsyntax und sind keine Provider-Selektoren.

Bei isolierten Jobs wird die Chat-Zustellung gemeinsam genutzt: Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` auch mit `--no-deliver` verwenden. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die ersatzweise Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` lediglich, wie der Runner nach dem Agent-Turn mit der endgültigen Antwort verfährt.

Wenn ein Agent aus einem aktiven Chat eine isolierte Erinnerung erstellt, speichert OpenClaw das erhaltene aktive Zustellziel für die ersatzweise Ankündigungsroute. Interne Session-Schlüssel können kleingeschrieben sein; Provider-Zustellziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn der aktuelle Chat-Kontext verfügbar ist.

Die implizite Ankündigungszustellung verwendet konfigurierte Kanal-Zulassungslisten, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen aus dem DM-Kopplungsspeicher sind keine Empfänger für ersatzweise Automatisierung; legen Sie `delivery.to` fest oder konfigurieren Sie den Kanaleintrag `allowFrom`, wenn ein geplanter Job proaktiv an eine DM senden soll.

### Fehlerbenachrichtigungen

Fehlerbenachrichtigungen verwenden einen separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt diesen pro Job.
- Wenn keiner von beiden festgelegt ist und der Job bereits über `announce` zustellt, greifen Fehlerbenachrichtigungen auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur für `sessionTarget="isolated"`-Jobs unterstützt, sofern der primäre Zustellmodus nicht `webhook` ist.
- `failureAlert.includeSkipped: true` aktiviert für einen Job oder die globale Cron-Warnrichtlinie wiederholte Warnungen bei übersprungenen Ausführungen. Übersprungene Ausführungen verwenden einen separaten Zähler für aufeinanderfolgende Überspringungen und wirken sich daher nicht auf die Rückstufung bei Ausführungsfehlern aus.
- `openclaw cron edit` stellt die Warnkonfiguration pro Job bereit: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` und `--failure-alert-account-id`.

### Ausgabesprache

Cron-Jobs leiten die Sprache einer Antwort nicht aus dem Kanal, dem Gebietsschema oder vorherigen Nachrichten ab. Fügen Sie die Sprachregel in die geplante Nachricht oder Vorlage ein:

```bash
openclaw cron edit <jobId> \
  --message "Fassen Sie die Aktualisierungen zusammen. Antworten Sie auf Chinesisch; lassen Sie URLs, Code und Produktnamen unverändert."
```

Belassen Sie bei Vorlagendateien die Sprachanweisung im gerenderten Prompt und prüfen Sie vor der Ausführung des Jobs, ob Platzhalter wie `{{language}}` ausgefüllt sind. Falls die Ausgabe mehrere Sprachen vermischt, formulieren Sie die Regel ausdrücklich, beispielsweise: „Verwenden Sie Chinesisch für Fließtext und belassen Sie technische Begriffe auf Englisch.“

## CLI-Beispiele

<Tabs>
  <Tab title="Einmalige Erinnerung">
    ```bash
    openclaw cron add \
      --name "Kalenderprüfung" \
      --at "20m" \
      --session main \
      --system-event "Nächster Heartbeat: Kalender prüfen." \
      --wake now
    ```
  </Tab>
  <Tab title="Wiederkehrender isolierter Job">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Fassen Sie die Aktualisierungen über Nacht zusammen." \
      --name "Morgenübersicht" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Modell- und Denküberschreibung">
    ```bash
    openclaw cron add \
      --name "Tiefgehende Analyse" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Wöchentliche tiefgehende Analyse des Projektfortschritts." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook-Ausgabe">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Fassen Sie die heutigen Bereitstellungen als JSON zusammen." \
      --name "Bereitstellungsübersicht" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Befehlsausgabe">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Prüfung der Warteschlangentiefe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Jobs verwalten

```bash
# Aktivierte Jobs auflisten
openclaw cron list

# Deaktivierte Jobs einschließen
openclaw cron list --all

# Einen gespeicherten Job als JSON abrufen
openclaw cron get <jobId>

# Einen Job einschließlich der aufgelösten Zustellroute anzeigen
openclaw cron show <jobId>

# Aktivieren/deaktivieren, ohne zu löschen
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Einen Job bearbeiten
openclaw cron edit <jobId> --message "Aktualisierter Prompt" --model "opus"

# Einen Job jetzt zwangsweise ausführen
openclaw cron run <jobId>

# Einen Job jetzt zwangsweise ausführen und auf seinen Endstatus warten
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Nur ausführen, wenn der Job fällig ist
openclaw cron run <jobId> --due

# Ausführungsverlauf anzeigen
openclaw cron runs --id <jobId> --limit 50

# Eine bestimmte Ausführung anzeigen
openclaw cron runs --id <jobId> --run-id <runId>

# Einen Job löschen
openclaw cron remove <jobId>

# Agentenauswahl (Multi-Agent-Konfigurationen)
openclaw cron create "0 6 * * *" "Betriebswarteschlange prüfen" --name "Betriebsprüfung" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Das Archivieren einer Sitzung (Control UI oder `sessions.patch { archived: true }` durch einen Aufrufer mit Operator-Administratorrechten) deaktiviert jeden aktivierten Cron-Job, der an diese Sitzung gebunden ist: ihre isolierte `cron:<jobId>`-Sitzung, ein `session:<key>`-Ziel oder eine `sessionKey`-Spur für Zustellung/Aktivierung. Durch das Wiederherstellen der Sitzung werden diese Jobs nicht erneut aktiviert; verwenden Sie `openclaw cron enable <jobId>`. Sitzungen mit einem aktivierten gebundenen Job zeigen in der Seitenleiste der Control UI ein Uhrsymbol an.

`openclaw cron run <jobId>` kehrt nach dem Einreihen der manuellen Ausführung zurück. Verwenden Sie `--wait` für Hooks beim Herunterfahren, Wartungsskripte oder andere Automatisierungen, die blockieren müssen, bis die eingereihte Ausführung abgeschlossen ist. Der zurückgegebene `runId` wird dabei abgefragt (Standard-Zeitüberschreitung `10m`, Abfrageintervall `2s`). Der Befehl wird für den Status `ok` mit `0` beendet und für `error`, `skipped` oder eine Wartezeitüberschreitung mit einem von null verschiedenen Wert.

Das Agentenwerkzeug `cron` gibt kompakte Jobzusammenfassungen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) aus `cron(action: "list")` zurück; verwenden Sie `cron(action: "get", jobId: "...")` für eine vollständige Jobdefinition. Direkte Gateway-Aufrufer können `compact: true` an `cron.list` übergeben; wenn dieser Wert weggelassen wird, bleibt die vollständige Antwort mit Zustellvorschauen erhalten.

`openclaw cron create` ist ein Alias für `openclaw cron add`. Neue Jobs können einen positionellen Zeitplan (`"0 9 * * 1"`, `"every 1h"`, `"20m"` oder einen ISO-Zeitstempel) verwenden, gefolgt von einem positionellen Agenten-Prompt. Verwenden Sie `--webhook <url>` mit `cron add|create` oder `cron edit`, um die Nutzlast der abgeschlossenen Ausführung per POST an einen HTTP-Endpunkt zu senden. Die Webhook-Zustellung kann nicht mit Chat-Zustellungsflags (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`) kombiniert werden. Bei `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` werden diese Routingfelder einzeln entfernt (jedes wird zusammen mit dem zugehörigen Setz-Flag abgelehnt) – im Unterschied zu `--no-deliver`, das nur die Fallback-Zustellung des Runners deaktiviert.

<Note>
Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das für den Job ausgewählte Modell.
- Wenn das Modell zulässig ist, wird genau diese Provider-/Modellkombination für die isolierte Agentenausführung verwendet.
- Wenn es nicht zulässig ist oder nicht aufgelöst werden kann, lässt Cron die Ausführung mit einem ausdrücklichen Validierungsfehler fehlschlagen.
- Nutzlast-Patches für die API `cron.update` können `model: null` festlegen, um eine gespeicherte Modellüberschreibung des Jobs zu löschen.
- `openclaw cron edit <job-id> --clear-model` löscht diese Überschreibung über die CLI (mit derselben Wirkung wie der Patch `model: null`) und kann nicht mit `--model` kombiniert werden.
- Konfigurierte Fallback-Ketten gelten weiterhin, da Cron `--model` als primäres Jobmodell und nicht als `/model`-Überschreibung einer Sitzung behandelt.
- `openclaw cron add|edit --fallbacks ...` legt die Nutzlast `fallbacks` fest und ersetzt damit die konfigurierten Fallbacks für diesen Job; `--fallbacks ""` deaktiviert Fallbacks und erzwingt eine strikte Ausführung. `openclaw cron edit <job-id> --clear-fallbacks` löscht die jobspezifische Überschreibung.
- Ein einfaches `--model` ohne ausdrückliche oder konfigurierte Fallback-Liste greift nicht stillschweigend auf das primäre Agentenmodell als zusätzliches Wiederholungsziel zurück.

</Note>

## Webhooks

Das Gateway kann HTTP-Webhook-Endpunkte für externe Auslöser bereitstellen. Aktivieren Sie sie in der Konfiguration:

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

Tokens in Abfragezeichenfolgen werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Ein Systemereignis für die Hauptsitzung einreihen:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Neue E-Mail empfangen","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Ereignisbeschreibung.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` oder `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Einen isolierten Agentendurchlauf ausführen:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Posteingang zusammenfassen","name":"E-Mail","model":"openai/gpt-5.6-sol"}'
    ```

    Felder: `message` (erforderlich), `name`, `agentId`, `sessionKey` (erfordert `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Zugeordnete Hooks (POST /hooks/<name>)">
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Nutzlasten mithilfe von Vorlagen oder Codetransformationen in `wake`- oder `agent`-Aktionen umwandeln.
  </Accordion>
</AccordionGroup>

<Warning>
Belassen Sie Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse-Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Authentifizierungstokens nicht erneut.
- Belassen Sie `hooks.path` in einem dedizierten Unterpfad; `/` wird abgelehnt.
- Legen Sie `hooks.allowedAgentIds` fest, um einzuschränken, auf welchen effektiven Agenten ein Hook zielen kann. Dies schließt den Standardagenten ein, wenn `agentId` weggelassen wird.
- Behalten Sie `hooks.allowRequestSessionKey=false` bei, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, legen Sie zusätzlich `hooks.allowedSessionKeyPrefixes` fest, um die zulässigen Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Nutzlasten werden standardmäßig mit Sicherheitsbegrenzungen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangsauslöser über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud`-CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Einrichtung mit dem Assistenten (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dadurch wird die `hooks.gmail`-Konfiguration geschrieben, die Gmail-Voreinstellung aktiviert und standardmäßig Tailscale Funnel für den Push-Endpunkt (`--tailscale funnel|serve|off`) verwendet.

<Warning>
Die sitzungsbezogene Trennung pro Nachricht der Gmail-Voreinstellung trennt den Gesprächskontext; sie schränkt weder die Werkzeuge noch den Arbeitsbereich des Zielagenten ein. Ohne eine benutzerdefinierte Zuordnung, die `agentId` festlegt, werden Gmail-Hooks als Standardagent ausgeführt.

Leiten Sie den Hook für nicht vertrauenswürdige Posteingänge an einen dedizierten Leseagenten weiter, gewähren Sie diesem Agenten ausschließlich Lesezugriff oder keinen Zugriff auf den Arbeitsbereich und verweigern Sie Schreibzugriffe auf das Dateisystem, Shell-, Browser- und andere nicht erforderliche Werkzeuge. Wenn er den Hauptagenten benachrichtigen muss, erlauben Sie nur die erforderliche Übergabe zwischen Agenten. Siehe [Prompt-Injection](/de/gateway/security#prompt-injection), [Multi-Agent-Sandbox und -Werkzeuge](/de/tools/multi-agent-sandbox-tools) und [`tools.agentToAgent`](/de/gateway/config-tools#toolsagenttoagent).
</Warning>

### Automatischer Start des Gateways

Wenn `hooks.enabled=true` und `hooks.gmail.account` festgelegt sind, startet das Gateway beim Hochfahren `gog gmail watch serve` und erneuert die Überwachung automatisch. Legen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1` fest, um dies zu deaktivieren.

### Einmalige manuelle Einrichtung

<Steps>
  <Step title="GCP-Projekt auswählen">
    Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Thema erstellen und Gmail-Push-Zugriff gewähren">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Überwachung starten">
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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Verwenden Sie für nicht vertrauenswürdige Posteingänge das verfügbare Modell der neuesten Generation und besten Stufe Ihres Providers. Der obige Wert ist ein Beispiel; das Modell muss in Ihrem konfigurierten Katalog und Ihrer Zulassungsliste vorhanden sein.

## Konfiguration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    triggers: {
      enabled: false,
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

`webhookToken` wird bei Cron-Webhook-POSTs als `Authorization: Bearer <token>` gesendet.

`cron.store` ist ein logischer Speicherschlüssel und ein Doctor-Migrationspfad, keine aktive JSON-Datei zur manuellen Bearbeitung. Jobdaten befinden sich in SQLite; verwenden Sie für Änderungen die CLI oder die Gateway-API.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Wiederholungsverhalten">
    **Wiederholung bei einmaliger Ausführung**: Vorübergehende Fehler (Ratenbegrenzung, Überlastung, Netzwerk, Zeitüberschreitung, Serverfehler) verwenden einen integrierten Wiederholungszeitplan. Dauerhafte Fehler deaktivieren den Job sofort.

    **Wiederholung bei wiederkehrender Ausführung**: Bei aufeinanderfolgenden Ausführungsfehlern verlängern sich die Abstände gemäß einem erweiterten Zeitplan (30s, 60s, 5m, 15m, 60m). Nach der nächsten erfolgreichen Ausführung wird der Backoff zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`, `false` deaktiviert die Funktion) bereinigt Einträge isolierter Ausführungssitzungen. Der Ausführungsverlauf behält die neuesten 2000 Endstatuszeilen pro Job; verlorene Zeilen behalten ihr 24-stündiges Bereinigungsfenster.
  </Accordion>
  <Accordion title="Migration des Legacy-Speichers">
    Führen Sie beim Upgrade `openclaw doctor --fix` aus, um ältere Dateien aus `~/.openclaw/cron/jobs.json`, `jobs-state.json` und `runs/*.jsonl` in SQLite zu importieren und sie mit dem Suffix `.migrated` umzubenennen. Fehlerhafte Jobzeilen werden von der Laufzeit übersprungen und zur späteren Reparatur oder Überprüfung nach `jobs-quarantine.json` kopiert.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

### Befehlsfolge

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
    - Vergewissern Sie sich, dass das Gateway kontinuierlich ausgeführt wird.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Zeitzone des Hosts.
    - `reason: not-due` in der Ausführungsausgabe bedeutet, dass die manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung erfolgte">
    - Der Zustellungsmodus `none` bedeutet, dass keine ersatzweise Zustellung durch den Runner erwartet wird. Der Agent kann weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Ein fehlendes/ungültiges Zustellungsziel (`channel`/`to`) bedeutet, dass der ausgehende Versand übersprungen wurde.
    - Bei Matrix können kopierte oder ältere Jobs mit kleingeschriebenen `delivery.to`-Raum-IDs fehlschlagen, da bei Matrix-Raum-IDs die Groß-/Kleinschreibung beachtet wird. Bearbeiten Sie den Job, sodass er exakt dem Wert `!room:server` oder `room:!room:server` aus Matrix entspricht.
    - Fehler bei der Kanalauthentifizierung (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung aufgrund der Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das Silent-Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw sowohl die direkte ausgehende Zustellung als auch den ersatzweisen Pfad für Zusammenfassungen in der Warteschlange, sodass nichts an den Chat zurückgesendet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Job über eine verwendbare Route verfügt (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Kanal/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint einen Rollover im /new-Stil zu verhindern">
    - Die Aktualität für tägliche und inaktivitätsbasierte Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Aktivierungen, Heartbeat-Läufe, Ausführungsbenachrichtigungen und die Gateway-Verwaltung können die Sitzungszeile für Routing/Status aktualisieren, verlängern jedoch weder `sessionStartedAt` noch `lastInteractionAt`.
    - Bei älteren Zeilen, die vor der Einführung dieser Felder erstellt wurden, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, sofern die Datei noch verfügbar ist. Ältere inaktive Zeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als Ausgangswert für die Inaktivität.

  </Accordion>
  <Accordion title="Fallstricke bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Durchläufe der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
