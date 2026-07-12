---
read_when:
    - Planen von Hintergrundaufgaben oder Aufweckvorgängen
    - Externe Auslöser (Webhooks, Gmail) mit OpenClaw verbinden
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Aufträge, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-07-12T14:57:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dc6ac442b03f892b916cf04695b770bc86ee6b00978b95ffaeb8e6480f5b8af6
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateways. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben an einen Chat-Kanal, einen Webhook oder nirgendwohin übermitteln.

## Schnellstart

<Steps>
  <Step title="Einmalige Erinnerung hinzufügen">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
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

- Cron wird **innerhalb des Gateway-Prozesses** ausgeführt, nicht innerhalb des Modells. Das Gateway muss laufen, damit Zeitpläne ausgelöst werden.
- Jobdefinitionen, Laufzeitstatus und Ausführungsverlauf werden dauerhaft in der gemeinsamen SQLite-Statusdatenbank von OpenClaw gespeichert, sodass Zeitpläne bei Neustarts nicht verloren gehen.
- Jede Cron-Ausführung erstellt einen Datensatz für eine [Hintergrundaufgabe](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht; übergeben Sie `--keep-after-run`, um sie beizubehalten.
- Zeitbudget pro Ausführung: `--timeout-seconds`, sofern festgelegt. Andernfalls werden isolierte/abgekoppelte Agent-Turn-Jobs durch den Cron-eigenen Watchdog auf 60 Minuten begrenzt, bevor das zugrunde liegende Agent-Turn-Zeitlimit (`agents.defaults.timeoutSeconds`, standardmäßig 48 Stunden) überhaupt greifen würde; Befehlsjobs haben standardmäßig ein Zeitlimit von 10 Minuten.
- Beim Start des Gateways werden überfällige isolierte Agent-Turn-Jobs neu geplant, statt sofort erneut ausgeführt zu werden. Dadurch bleibt die Bootstrap-Arbeit für Modell und Tools außerhalb des Zeitfensters für die Kanalverbindung.
- Wenn Sie `openclaw agent` über System-Cron oder einen anderen externen Scheduler ausführen, kapseln Sie den Aufruf mit einer Eskalation zum erzwungenen Beenden, obwohl die CLI `SIGTERM`/`SIGINT` bereits verarbeitet. Gateway-gestützte Ausführungen fordern das Gateway auf, angenommene Ausführungen abzubrechen; lokale und eingebettete Fallback-Ausführungen erhalten dasselbe Abbruchsignal. Verwenden Sie bei GNU `timeout` vorzugsweise `timeout -k 60 600 openclaw agent ...` statt nur `timeout 600 ...` — der Wert für `-k` dient als Rückfallebene, falls der Prozess nicht rechtzeitig ordnungsgemäß beendet werden kann. Verwenden Sie für systemd-Units ein `SIGTERM`-Stoppsignal mit einem Kulanzzeitfenster (`TimeoutStopSec`) vor dem endgültigen Beenden. Wenn eine `--run-id` erneut verwendet wird, während die ursprüngliche Gateway-Ausführung noch aktiv ist, wird das Duplikat als laufend gemeldet, statt eine zweite Ausführung zu starten.

<AccordionGroup>
  <Accordion title="Absicherung isolierter Ausführungen">
    - Isolierte Ausführungen versuchen nach bestem Bemühen, nach Abschluss nachverfolgte Browser-Tabs und -Prozesse ihrer Sitzung `cron:<jobId>` zu schließen. Außerdem geben sie alle gebündelten MCP-Laufzeitinstanzen frei, die für den Job erstellt wurden, und verwenden dazu denselben gemeinsamen Bereinigungspfad wie Ausführungen der Hauptsitzung und benutzerdefinierter Sitzungen. Bereinigungsfehler werden ignoriert, damit das Cron-Ergebnis weiterhin maßgeblich bleibt.
    - Isolierte Ausführungen mit der eingeschränkten Berechtigung zur Cron-Selbstbereinigung können den Scheduler-Status, eine selbstgefilterte Liste, die ausschließlich ihren eigenen Job enthält, sowie den Ausführungsverlauf dieses Jobs lesen und dürfen nur ihren eigenen Job entfernen.
    - Isolierte Ausführungen schützen vor veralteten Bestätigungsantworten: Wenn das erste Ergebnis lediglich eine vorläufige Statusmeldung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein untergeordneter Subagent weiterhin für die endgültige Antwort verantwortlich ist, fordert OpenClaw einmal erneut das tatsächliche Ergebnis an, bevor es übermittelt wird.
    - Strukturierte Metadaten zu Ausführungsverweigerungen (einschließlich Node-Host-Wrappern mit `UNAVAILABLE`, deren verschachtelter Fehler mit `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST` beginnt) werden erkannt, sodass ein blockierter Befehl nicht als erfolgreiche Ausführung gemeldet wird, während gewöhnlicher Assistententext nicht irrtümlich als Verweigerung interpretiert wird.
    - Fehler auf Ebene der Agentenausführung zählen auch ohne Antwortnutzlast als Jobfehler, sodass Modell-/Provider-Fehler die Fehlerzähler erhöhen und Fehlermeldungen auslösen, statt den Job als erfolgreich abzuschließen.
    - Wenn ein Job `timeoutSeconds` erreicht, bricht Cron die Ausführung ab und gewährt ihr ein kurzes Zeitfenster zur Bereinigung. Wenn sie nicht ordnungsgemäß beendet wird, löscht die Gateway-eigene Bereinigung die Sitzungszuständigkeit dieser Ausführung zwangsweise, bevor Cron das Zeitlimit protokolliert, damit in der Warteschlange befindliche Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung hängen bleibt.
    - Blockierungen bei Einrichtung oder Start erhalten ein phasenspezifisches Zeitlimit (zum Beispiel `cron: isolated agent setup timed out before runner start` oder `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Diese Watchdogs decken eingebettete und CLI-gestützte Provider bereits ab, bevor deren externer CLI-Prozess startet, und werden unabhängig von langen `timeoutSeconds`-Werten begrenzt, damit Fehler bei Kaltstart, Authentifizierung oder Kontext schnell sichtbar werden.

  </Accordion>
  <Accordion title="Aufgabenabgleich">
    Der Cron-Aufgabenabgleich stützt sich zuerst auf die Laufzeit und anschließend auf den dauerhaften Verlauf: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job weiterhin als laufend nachverfolgt, selbst wenn noch eine alte Zeile einer untergeordneten Sitzung vorhanden ist. Sobald die Laufzeit nicht mehr für den Job zuständig ist und ein Kulanzzeitfenster von 5 Minuten abgelaufen ist, prüft die Wartung gespeicherte Ausführungsprotokolle und den Jobstatus für die entsprechende Ausführung `cron:<jobId>:<startedAt>`. Ein dort vorhandenes Endergebnis schließt das Aufgabenbuch ab; andernfalls kann die Gateway-eigene Wartung die Aufgabe als `lost` markieren. Eine Offline-CLI-Prüfung kann die Aufgabe anhand des dauerhaften Verlaufs wiederherstellen, aber ihre eigene leere prozessinterne Menge aktiver Jobs beweist nicht, dass eine Gateway-eigene Ausführung nicht mehr vorhanden ist.
  </Accordion>
</AccordionGroup>

## Zeitplantypen

| Art       | CLI-Flag    | Beschreibung                                                                                                        |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)                                                            |
| `every`   | `--every`   | Festes Intervall (`10m`, `1h`, `1d`)                                                                                |
| `cron`    | `--cron`    | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz`                                                            |
| `on-exit` | `--on-exit` | Einmal auslösen, wenn ein überwachter Befehl beendet wird (Ereignisauslöser; übersteht den Turn-Abbau; optional `--on-exit-cwd`) |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` hinzu, um eine `--at`-Datums-/Zeitangabe ohne UTC-Versatz in dieser IANA-Zeitzone zu interpretieren oder einen Cron-Ausdruck darin auszuwerten. Cron-Ausdrücke ohne `--tz` verwenden die Zeitzone des Gateway-Hosts. `--tz` ist mit `--every` oder `--on-exit` nicht zulässig.

Wiederkehrende Ausdrücke zur vollen Stunde (Minute `0` mit einem Platzhalter im Stundenfeld) werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um eine präzise Zeitplanung zu erzwingen, oder `--stagger 30s` für ein explizites Zeitfenster (nur Cron-Zeitpläne).

### Tag des Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) analysiert. Wenn sowohl das Feld für den Tag des Monats als auch das Feld für den Wochentag keinen Platzhalter enthalten, ergibt sich bei croner eine Übereinstimmung, wenn **eines der beiden** Felder übereinstimmt, nicht beide. Dies entspricht dem standardmäßigen Verhalten von Vixie cron.

```bash
# Beabsichtigt: „9 Uhr am 15., nur wenn es ein Montag ist“
# Tatsächlich: „9 Uhr an jedem 15. UND 9 Uhr an jedem Montag“
0 9 15 * 1
```

Dadurch erfolgt die Ausführung ungefähr 5-6 Mal pro Monat statt 0-1 Mal pro Monat. Um beide Bedingungen zu verlangen, verwenden Sie den `+`-Wochentagsmodifikator von croner (`0 9 15 * +1`) oder planen Sie anhand eines Feldes und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ereignisauslöser (Bedingungsüberwachungen)

Ein Ereignisauslöser fügt einem `every`- oder `cron`-Zeitplan ein unbeaufsichtigtes Bedingungsskript hinzu. Cron wertet das Skript aus, wenn der Job fällig ist, und führt die normale Nutzlast nur aus, wenn das Skript `fire: true` zurückgibt:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Wird nur ausgelöst, wenn sich der beobachtete Status von der letzten Auswertung unterscheidet.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Investigate the CI status change." },
}
```

Das Skript muss `{ fire, message?, state? }` zurückgeben. Der vorherige JSON-Status steht als tiefgehend eingefrorenes `trigger.state` zur Verfügung; geben Sie einen neuen `state`-Wert zurück, um ihn dauerhaft zu speichern. Der Status ist auf 16 KB begrenzt. Wenn ein auslösendes Ergebnis `message` enthält, hängt Cron diese vor der Ausführung an den Text des Systemereignisses oder die Agent-Turn-Nachricht an. `once: true` deaktiviert den Job nach seiner ersten erfolgreich ausgelösten Nutzlast.

`fire: false` speichert den Auswertungsstatus und die Zähler dauerhaft und plant anschließend neu, ohne einen Ausführungsverlauf zu erstellen. Wenn die Ausführung einer ausgelösten Nutzlast fehlschlägt, wird der zurückgegebene `state` **nicht** dauerhaft gespeichert — die nächste Auswertung sieht den vorherigen Status und kann erneut auslösen. Schreiben Sie Skripte daher als schreibgeschützte Prüfungen und belassen Sie Aktionen in der Nutzlast. Auslöserzeitpläne haben ein konfigurierbares Mindestintervall (standardmäßig 30 Sekunden). Jede Auswertung hat ein Zeitbudget von 30 Sekunden und darf bis zu 5 Tool-Aufrufe ausführen.

<Warning>
Wenn Sie `cron.triggers.enabled` aktivieren, können von Agenten verfasste Skripte unbeaufsichtigt mit der **vollständigen Tool-Richtlinie des besitzenden Agenten, einschließlich `exec`**, ausgeführt werden. Behandeln Sie dies als unbeaufsichtigte Codeausführung mit den Berechtigungen dieses Agenten; lassen Sie die Option deaktiviert, sofern nicht jeder Agent, der Cron-Jobs erstellen darf, entsprechend vertrauenswürdig ist.
</Warning>

Erstellen Sie eine Überwachung aus einer lokalen Skriptdatei (`-` liest das Skript aus stdin):

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Respond to the CI status change" \
  --session isolated
```

## Nutzlasten

Jeder Job enthält genau eine durch ein Flag ausgewählte Nutzlastart:

| Nutzlast       | Flag                                           | Ausführung                                                      |
| -------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Systemereignis | `--system-event <text>`                        | Wird in die Hauptsitzung eingereiht, selbst kein Modellaufruf   |
| Agentennachricht | `--message <text>`                           | Ein modellgestützter Agent-Turn                                 |
| Befehl         | `--command <shell>` oder `--command-argv <json>` | Eine Shell/ein Prozess auf dem Gateway-Host, kein Modellaufruf |

### Agent-Turn-Optionen

<ParamField path="--message" type="string" required>
  Prompttext (erforderlich für isolierte Jobs, Jobs der aktuellen Sitzung und Jobs benutzerdefinierter Sitzungen).
</ParamField>
<ParamField path="--model" type="string">
  Modellüberschreibung; muss in ein zulässiges Modell aufgelöst werden können, andernfalls schlägt die Ausführung mit einem Validierungsfehler fehl.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Liste der Fallback-Modelle pro Job, zum Beispiel `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Übergeben Sie `--fallbacks ""` für eine strikte Ausführung ohne Fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Entfernt bei `cron edit` die Fallback-Überschreibung des Jobs, sodass der Job der konfigurierten Fallback-Priorität folgt. Kann nicht mit `--fallbacks` kombiniert werden.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Entfernt bei `cron edit` die Modellüberschreibung des Jobs, sodass der Job der normalen Cron-Modellpriorität folgt (gespeicherte Cron-Sitzungsüberschreibung, andernfalls Agenten-/Standardmodell). Kann nicht mit `--model` kombiniert werden.
</ParamField>
<ParamField path="--thinking" type="string">
  Überschreibung der Thinking-Stufe (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). Die verfügbaren Stufen hängen weiterhin vom ausgewählten Modell und von der Agentenlaufzeit ab.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Entfernt bei `cron edit` die Thinking-Überschreibung des Jobs. Kann nicht mit `--thinking` kombiniert werden.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Überspringt das Einfügen der Workspace-Bootstrap-Dateien.
</ParamField>
<ParamField path="--tools" type="string">
  Schränkt ein, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` legt das primäre Modell des Jobs fest; es ersetzt keine `/model`-Überschreibung einer Sitzung, sodass konfigurierte Fallback-Ketten weiterhin zusätzlich gelten. Ein nicht aufgelöstes oder unzulässiges Modell lässt die Ausführung mit einem expliziten Validierungsfehler fehlschlagen, statt stillschweigend auf den Standard zurückzufallen. Wenn ein Job `--model`, aber keine explizite oder konfigurierte Fallback-Liste enthält, übergibt OpenClaw eine leere Fallback-Überschreibung, statt das primäre Agent-Modell stillschweigend als verborgenes Wiederholungsziel anzuhängen.

Priorität der Modellauswahl für isolierte Jobs, absteigend:

1. `model` in der jobbezogenen Nutzlast (explizite Konfiguration; ein unzulässiges Modell lässt die Ausführung fehlschlagen)
2. Modellüberschreibung des Gmail-Hooks (nur wenn die Ausführung von Gmail stammt und diese Überschreibung zulässig ist)
3. Vom Benutzer ausgewählte, gespeicherte Modellüberschreibung der Cron-Sitzung
4. Modellauswahl des Agenten bzw. Standardmodellauswahl

Der schnelle Modus folgt der aufgelösten aktiven Auswahl. Wenn die Konfiguration des ausgewählten Modells `params.fastMode` enthält, verwendet isoliertes Cron diesen Wert standardmäßig; eine gespeicherte `fastMode`-Überschreibung der Sitzung (und danach ein `fastModeDefault` des Agenten) hat in beiden Richtungen weiterhin Vorrang vor der Modellkonfiguration. Der automatische Modus verwendet den Grenzwert `params.fastAutoOnSeconds` des Modells, standardmäßig 60 Sekunden.

Wenn eine Ausführung eine aktive Übergabe aufgrund eines Modellwechsels erreicht, wiederholt Cron den Versuch mit dem gewechselten Provider/Modell und speichert diese Auswahl (sowie jedes neue Authentifizierungsprofil) für die aktive Ausführung. Die Wiederholungsversuche sind begrenzt: Nach dem ersten Versuch und 2 Wiederholungen aufgrund eines Wechsels bricht Cron ab, statt eine Schleife zu bilden.

Bevor eine isolierte Ausführung beginnt, prüft OpenClaw erreichbare lokale Endpunkte für konfigurierte Provider mit `api: "ollama"` und `api: "openai-completions"`, deren `baseUrl` auf Loopback, ein privates Netzwerk oder `.local` verweist. Diese Vorabprüfung durchläuft die konfigurierte Fallback-Kette des Jobs und markiert die Ausführung erst dann als `skipped`, wenn kein Kandidat erreichbar ist; `--fallbacks ""` beschränkt diesen Durchlauf strikt auf das primäre Modell. Bei einem ausgefallenen Endpunkt wird die Ausführung mit einer eindeutigen Fehlermeldung als `skipped` erfasst, statt einen Modellaufruf zu starten. Das Ergebnis wird pro Endpunkt 5 Minuten lang zwischengespeichert (nicht pro Job oder Modell), sodass viele fällige Jobs, die denselben ausgefallenen lokalen Ollama-/vLLM-/SGLang-/LM-Studio-Server verwenden, nur eine Prüfung statt einer Anfragelawine verursachen. Durch die Vorabprüfung übersprungene Ausführungen erhöhen den Ausführungsfehler-Backoff nicht; setzen Sie `failureAlert.includeSkipped`, um wiederholte Benachrichtigungen über übersprungene Ausführungen zu aktivieren.

### Befehlsnutzlasten

Befehlsnutzlasten führen deterministische Skripte innerhalb des Gateway-Schedulers aus, ohne einen modellgestützten Durchlauf zu starten. Sie werden auf dem Gateway-Host ausgeführt, erfassen stdout/stderr, zeichnen die Ausführung im Cron-Verlauf auf und verwenden dieselben Zustellmodi `announce`, `webhook` und `none` wie Jobs mit Agent-Durchläufen.

<Note>
Befehls-Cron ist eine Gateway-Automatisierungsoberfläche für Operator-Administratoren und kein `tools.exec`-Aufruf eines Agenten. Zum Erstellen, Aktualisieren, Entfernen oder manuellen Ausführen von Cron-Jobs ist `operator.admin` erforderlich; geplante Befehlsausführungen werden später innerhalb des Gateway-Prozesses als diese vom Administrator erstellte Automatisierung ausgeführt. Die Ausführungsrichtlinie des Agenten (`tools.exec.mode`, Genehmigungsaufforderungen, agentenspezifische Werkzeug-Zulassungslisten) regelt die für Modelle sichtbaren Ausführungswerkzeuge, nicht Befehls-Cron-Nutzlasten.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Warteschlangentiefe prüfen" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'` für eine exakte argv-Ausführung ohne Shell-Parsing. Die optionalen Optionen `--command-env KEY=VALUE` (wiederholbar), `--command-input`, `--timeout-seconds` (standardmäßig 10 Minuten), `--no-output-timeout-seconds` und `--output-max-bytes` steuern die Prozessumgebung, stdin und die Ausgabegrenzen.

Der zugestellte Text wird aus der Prozessausgabe abgeleitet: Eine nicht leere stdout-Ausgabe hat Vorrang; wenn stdout leer und stderr nicht leer ist, wird stderr zugestellt; wenn beide vorhanden sind, sendet Cron einen kleinen `stdout:`- / `stderr:`-Block. Der Exit-Code `0` erfasst die Ausführung als `ok`; ein Exit-Code ungleich null, ein Signal, ein Timeout oder ein Timeout wegen ausbleibender Ausgabe erfasst sie als `error` und kann Fehlerbenachrichtigungen auslösen. Ein Befehl, der ausschließlich `NO_REPLY` ausgibt, verwendet die normale Unterdrückung stiller Cron-Tokens und sendet nichts an den Chat zurück.

## Ausführungsarten

| Art               | Wert von `--session` | Ausführung in                         | Am besten geeignet für                    |
| ----------------- | -------------------- | ------------------------------------- | ----------------------------------------- |
| Hauptsitzung      | `main`               | Dedizierte Cron-Aktivierungsspur      | Erinnerungen, Systemereignisse            |
| Isoliert          | `isolated`           | Dedizierte Sitzung `cron:<jobId>`     | Berichte, Hintergrundaufgaben             |
| Aktuelle Sitzung  | `current`            | Bei der Erstellung gebunden           | Kontextbezogene wiederkehrende Aufgaben   |
| Benutzerdefiniert | `session:custom-id`  | Persistente benannte Sitzung          | Workflows, die auf dem Verlauf aufbauen   |

<AccordionGroup>
  <Accordion title="Hauptsitzung im Vergleich zu isoliert und benutzerdefiniert">
    Jobs der **Hauptsitzung** stellen ein Systemereignis in eine Cron-eigene Ausführungsspur ein und aktivieren optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Sie können für Antworten den letzten Zustellkontext der Ziel-Hauptsitzung verwenden, hängen routinemäßige Cron-Durchläufe jedoch nicht an die menschliche Chat-Spur an und verlängern nicht die Aktualitätsfrist für den täglichen bzw. inaktivitätsbedingten Reset der Zielsitzung. **Isolierte** Jobs führen einen dedizierten Agent-Durchlauf mit einer neuen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) bewahren den Kontext über Ausführungen hinweg und ermöglichen so Workflows wie tägliche Stand-ups, die auf vorherigen Zusammenfassungen aufbauen.

    Cron-Ereignisse der Hauptsitzung sind eigenständige Systemereignis-Erinnerungen. Sie enthalten nicht automatisch die Anweisung „Read HEARTBEAT.md“ aus der standardmäßigen Heartbeat-Eingabeaufforderung; geben Sie dies im Text des Cron-Ereignisses ausdrücklich an, wenn eine Erinnerung `HEARTBEAT.md` berücksichtigen soll.

  </Accordion>
  <Accordion title="Was „neue Sitzung“ bei isolierten Jobs bedeutet">
    Eine neue Transkript-/Sitzungs-ID pro Ausführung. OpenClaw übernimmt sichere Einstellungen (Denk-/Schnell-/Ausführlichkeitseinstellungen, Bezeichnungen sowie explizite vom Benutzer ausgewählte Modell-/Authentifizierungsüberschreibungen), erbt jedoch keinen umgebenden Unterhaltungskontext aus einem älteren Cron-Eintrag: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Rechteerhöhung, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Unterhaltungskontext aufbauen soll.
  </Accordion>
  <Accordion title="Zustellung durch Subagenten und Discord">
    Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, wird für die Zustellung die endgültige Ausgabe des letzten Nachfahren gegenüber einem veralteten Zwischenstand des übergeordneten Agenten bevorzugt. Wenn Nachfahren noch ausgeführt werden, unterdrückt OpenClaw diese unvollständige Aktualisierung des übergeordneten Agenten, statt sie anzukündigen.

    Bei reinen Textzielen für Discord-Ankündigungen sendet OpenClaw den kanonischen endgültigen Assistententext einmal, statt sowohl gestreamten bzw. zwischenzeitlichen Text als auch die endgültige Antwort erneut wiederzugeben. Medien und strukturierte Discord-Nutzlasten werden weiterhin separat zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

## Zustellung und Ausgabe

| Modus      | Verhalten                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- |
| `announce` | Stellt den endgültigen Text ersatzweise an das Ziel zu, wenn der Agent ihn nicht gesendet hat |
| `webhook`  | Sendet die Ereignisnutzlast der abgeschlossenen Ausführung per POST an eine URL            |
| `none`     | Keine ersatzweise Zustellung durch den Runner                                              |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Kanalzustellung. Verwenden Sie für Telegram-Forenthemen `-1001234567890:topic:123`; OpenClaw akzeptiert außerdem die Telegram-eigene Kurzform `-1001234567890:123`. Direkte RPC-/Konfigurationsaufrufer können `delivery.threadId` als Zeichenfolge oder Zahl übergeben. Ziele für Slack/Discord/Mattermost verwenden explizite Präfixe (`channel:<id>`, `user:<id>`). Bei Matrix-Raum-IDs wird zwischen Groß- und Kleinschreibung unterschieden; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die Ankündigungszustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Ziel mit Provider-Präfix wie `telegram:123` den Kanal auswählen, bevor Cron auf den Sitzungsverlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin bekannt gegeben werden, dienen als Provider-Selektoren. Wenn `delivery.channel` explizit angegeben ist, muss das Zielpräfix denselben Provider benennen; `channel: "whatsapp"` mit `to: "telegram:123"` wird abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Präfixe für Zielart und Dienst (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) bleiben kanaleigene Zielsyntax und sind keine Provider-Selektoren.

Bei isolierten Jobs wird die Chat-Zustellung gemeinsam genutzt: Wenn eine Chat-Route verfügbar ist, kann der Agent das Werkzeug `message` auch mit `--no-deliver` verwenden. Wenn der Agent an das konfigurierte bzw. aktuelle Ziel sendet, überspringt OpenClaw die ersatzweise Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` ausschließlich, wie der Runner nach dem Agent-Durchlauf mit der endgültigen Antwort verfährt.

Wenn ein Agent aus einem aktiven Chat heraus eine isolierte Erinnerung erstellt, speichert OpenClaw das beibehaltene aktive Zustellziel für die ersatzweise Ankündigungsroute. Interne Sitzungsschlüssel können kleingeschrieben sein; Provider-Zustellziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn der aktuelle Chat-Kontext verfügbar ist.

Die implizite Ankündigungszustellung verwendet konfigurierte Kanal-Zulassungslisten, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen aus dem Kopplungsspeicher für Direktnachrichten sind keine Empfänger für die Fallback-Automatisierung; setzen Sie `delivery.to` oder konfigurieren Sie den Kanaleintrag `allowFrom`, wenn ein geplanter Job proaktiv an eine Direktnachricht senden soll.

### Fehlerbenachrichtigungen

Fehlerbenachrichtigungen verwenden einen separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt diesen Wert pro Job.
- Wenn keiner der beiden Werte festgelegt ist und der Job bereits über `announce` zustellt, greifen Fehlerbenachrichtigungen auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre Zustellmodus nicht `webhook` ist.
- `failureAlert.includeSkipped: true` aktiviert für einen Job oder die globale Cron-Benachrichtigungsrichtlinie wiederholte Benachrichtigungen über übersprungene Ausführungen. Übersprungene Ausführungen verwenden einen separaten Zähler für aufeinanderfolgende Überspringungen und wirken sich daher nicht auf den Ausführungsfehler-Backoff aus.
- `openclaw cron edit` stellt die Benachrichtigungskonfiguration pro Job bereit: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` und `--failure-alert-account-id`.

### Ausgabesprache

Cron-Jobs leiten die Sprache einer Antwort nicht aus dem Kanal, dem Gebietsschema oder vorherigen Nachrichten ab. Fügen Sie die Sprachregel in die geplante Nachricht oder Vorlage ein:

```bash
openclaw cron edit <jobId> \
  --message "Fassen Sie die Aktualisierungen zusammen. Antworten Sie auf Chinesisch; lassen Sie URLs, Code und Produktnamen unverändert."
```

Lassen Sie bei Vorlagendateien die Sprachanweisung in der gerenderten Eingabeaufforderung stehen und stellen Sie vor der Ausführung des Jobs sicher, dass Platzhalter wie `{{language}}` ausgefüllt sind. Wenn die Ausgabe Sprachen mischt, formulieren Sie die Regel ausdrücklich, zum Beispiel: „Verwenden Sie Chinesisch für Fließtext und belassen Sie Fachbegriffe auf Englisch.“

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
      "Nächtliche Aktualisierungen zusammenfassen." \
      --name "Morgenübersicht" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Überschreiben von Modell und Denkmodus">
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
      "Heutige Deployments als JSON zusammenfassen." \
      --name "Deployment-Zusammenfassung" \
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
# Alle Jobs auflisten
openclaw cron list

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

# Einen Job jetzt zwangsweise ausführen und auf seinen endgültigen Status warten
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Nur ausführen, wenn der Job fällig ist
openclaw cron run <jobId> --due

# Ausführungsverlauf anzeigen
openclaw cron runs --id <jobId> --limit 50

# Eine bestimmte Ausführung anzeigen
openclaw cron runs --id <jobId> --run-id <runId>

# Einen Job löschen
openclaw cron remove <jobId>

# Agent-Auswahl (Multi-Agent-Konfigurationen)
openclaw cron create "0 6 * * *" "Betriebswarteschlange prüfen" --name "Betriebsprüfung" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Das Archivieren einer Sitzung (über die Control UI oder `sessions.patch { archived: true }` durch einen Aufrufer mit Operator-Admin-Rechten) deaktiviert jeden aktivierten Cron-Job, der an diese Sitzung gebunden ist: ihre isolierte `cron:<jobId>`-Sitzung, ein `session:<key>`-Ziel oder eine Zustell-/Weckspur mit `sessionKey`. Durch das Wiederherstellen der Sitzung werden diese Jobs nicht erneut aktiviert; verwenden Sie `openclaw cron enable <jobId>`. Sitzungen mit einem aktivierten gebundenen Job werden in der Seitenleiste der Control UI mit einem Uhrsymbol gekennzeichnet.

`openclaw cron run <jobId>` kehrt zurück, nachdem die manuelle Ausführung in die Warteschlange gestellt wurde. Verwenden Sie `--wait` für Hooks beim Herunterfahren, Wartungsskripte oder andere Automatisierungen, die blockieren müssen, bis die Ausführung in der Warteschlange abgeschlossen ist; dabei wird die zurückgegebene `runId` abgefragt (Standardzeitlimit `10m`, Abfrageintervall `2s`). Der Befehl wird bei Status `ok` mit `0` und bei `error`, `skipped` oder einem Wartezeitlimit mit einem Wert ungleich null beendet.

Das Agent-Werkzeug `cron` gibt über `cron(action: "list")` kompakte Job-Zusammenfassungen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) zurück; verwenden Sie `cron(action: "get", jobId: "...")`, um eine vollständige Jobdefinition abzurufen. Direkte Gateway-Aufrufer können `compact: true` an `cron.list` übergeben; wenn der Parameter ausgelassen wird, bleibt die vollständige Antwort mit Zustellungsvorschauen erhalten.

`openclaw cron create` ist ein Alias für `openclaw cron add`. Neue Jobs können einen positionsgebundenen Zeitplan (`"0 9 * * 1"`, `"every 1h"`, `"20m"` oder einen ISO-Zeitstempel) verwenden, gefolgt von einem positionsgebundenen Agent-Prompt. Verwenden Sie `--webhook <url>` bei `cron add|create` oder `cron edit`, um die Nutzlast der abgeschlossenen Ausführung per POST an einen HTTP-Endpunkt zu senden; die Webhook-Zustellung kann nicht mit Chat-Zustellungsoptionen (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`) kombiniert werden. Bei `cron edit` heben `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` diese Routingfelder einzeln auf (jede Option wird zusammen mit der jeweils entsprechenden Setzoption abgelehnt) — im Gegensatz zu `--no-deliver`, das nur die Fallback-Zustellung des Runners deaktiviert.

<Note>
Hinweis zum Überschreiben des Modells:

- `openclaw cron add|edit --model ...` ändert das für den Job ausgewählte Modell.
- Wenn das Modell zulässig ist, wird exakt dieser Provider/dieses Modell für die isolierte Agent-Ausführung verwendet.
- Wenn es nicht zulässig ist oder nicht aufgelöst werden kann, schlägt Cron die Ausführung mit einem ausdrücklichen Validierungsfehler fehl.
- Patches der API-Nutzlast `cron.update` können `model: null` setzen, um eine gespeicherte Modellüberschreibung des Jobs zu entfernen.
- `openclaw cron edit <job-id> --clear-model` entfernt diese Überschreibung über die CLI (mit derselben Wirkung wie der Patch `model: null`) und kann nicht mit `--model` kombiniert werden.
- Konfigurierte Fallback-Ketten gelten weiterhin, da Cron-`--model` das primäre Modell eines Jobs und keine sitzungsbezogene `/model`-Überschreibung ist.
- `openclaw cron add|edit --fallbacks ...` setzt `fallbacks` in der Nutzlast und ersetzt die konfigurierten Fallbacks für diesen Job; `--fallbacks ""` deaktiviert Fallbacks und erzwingt eine strikte Ausführung. `openclaw cron edit <job-id> --clear-fallbacks` entfernt die jobspezifische Überschreibung.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste wechselt nicht stillschweigend zum primären Modell des Agent als zusätzlichem Wiederholungsziel.

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

Token in der Abfragezeichenfolge werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Stellt ein Systemereignis für die Hauptsitzung in die Warteschlange:

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
    Führt einen isolierten Agent-Durchlauf aus:

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
Schützen Sie Hook-Endpunkte durch Loopback, Tailnet oder einen vertrauenswürdigen Reverse-Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Authentifizierungstoken nicht erneut.
- Legen Sie `hooks.path` auf einen dedizierten Unterpfad fest; `/` wird abgelehnt.
- Legen Sie `hooks.allowedAgentIds` fest, um einzuschränken, welchen effektiven Agent ein Hook ansprechen kann, einschließlich des Standard-Agent, wenn `agentId` ausgelassen wird.
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

Dadurch wird die Konfiguration `hooks.gmail` geschrieben, die Gmail-Voreinstellung aktiviert und standardmäßig Tailscale Funnel für den Push-Endpunkt verwendet (`--tailscale funnel|serve|off`).

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` gilt und `hooks.gmail.account` festgelegt ist, startet das Gateway beim Hochfahren `gog gmail watch serve` und erneuert die Überwachung automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

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
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Konfiguration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Die obigen `retry`-Werte sind die Standardwerte: bis zu 3 Wiederholungen mit `30s/60s/5m` Wartezeit, wobei alle fünf vorübergehenden Kategorien erneut versucht werden. `webhookToken` wird bei Cron-Webhook-POST-Anfragen als `Authorization: Bearer <token>` gesendet.

`maxConcurrentRuns` begrenzt sowohl die geplante Cron-Ausführung als auch die Ausführung isolierter Agent-Durchläufe und hat den Standardwert 8. Isolierte Cron-Agent-Durchläufe verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange. Durch Erhöhen dieses Werts können unabhängige Cron-LLM-Ausführungen parallel fortschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsam genutzte, nicht zu Cron gehörende Spur `nested` wird durch diese Einstellung nicht erweitert.

`cron.store` ist ein logischer Speicherschlüssel und Doctor-Migrationspfad, keine aktive JSON-Datei zur manuellen Bearbeitung. Jobdaten werden in SQLite gespeichert; verwenden Sie für Änderungen die CLI oder die Gateway-API.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Wiederholungsverhalten">
    **Wiederholung bei einmaliger Ausführung**: Vorübergehende Fehler (Ratenbegrenzung, Überlastung, Netzwerk, Zeitüberschreitung, Serverfehler) werden bis zu `retry.maxAttempts` Mal (Standardwert 3) mit `retry.backoffMs` (standardmäßig 30s, 60s, 5m) erneut versucht. Dauerhafte Fehler deaktivieren den Job sofort.

    **Wiederholung bei wiederkehrender Ausführung**: Bei aufeinanderfolgenden Ausführungsfehlern wird nach einem erweiterten Zeitplan gewartet (30s, 60s, 5m, 15m, 60m). Nach der nächsten erfolgreichen Ausführung wird die Wartezeit zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standardwert `24h`, `false` deaktiviert die Funktion) bereinigt isolierte Ausführungssitzungseinträge. `cron.runLog.keepLines` begrenzt die Anzahl der pro Job beibehaltenen SQLite-Zeilen im Ausführungsverlauf; `maxBytes` bleibt zur Konfigurationskompatibilität mit älteren dateibasierten Ausführungsprotokollen erhalten.
  </Accordion>
  <Accordion title="Migration des Legacy-Speichers">
    Führen Sie nach einem Upgrade `openclaw doctor --fix` aus, um die Legacy-Dateien `~/.openclaw/cron/jobs.json`, `jobs-state.json` und `runs/*.jsonl` in SQLite zu importieren und sie mit dem Suffix `.migrated` umzubenennen. Fehlerhafte Jobzeilen werden bei der Laufzeit übersprungen und zur späteren Reparatur oder Überprüfung nach `jobs-quarantine.json` kopiert.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

### Befehlsabfolge

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
    - Überprüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
    - Vergewissern Sie sich, dass der Gateway durchgehend ausgeführt wird.
    - Überprüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Zeitzone des Hosts.
    - `reason: not-due` in der Ausführungsausgabe bedeutet, dass die manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber es erfolgte keine Zustellung">
    - Beim Zustellungsmodus `none` wird kein ersatzweises Senden durch den Runner erwartet. Der Agent kann weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist.
    - Ein fehlendes oder ungültiges Zustellungsziel (`channel`/`to`) bedeutet, dass die ausgehende Zustellung übersprungen wurde.
    - Bei Matrix können kopierte oder ältere Jobs mit kleingeschriebenen Raum-IDs in `delivery.to` fehlschlagen, da bei Matrix-Raum-IDs die Groß-/Kleinschreibung beachtet wird. Bearbeiten Sie den Job so, dass er exakt den Wert `!room:server` oder `room:!room:server` aus Matrix enthält.
    - Kanalauthentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung aufgrund der Anmeldedaten blockiert wurde.
    - Wenn die isolierte Ausführung nur das Stille-Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und den ersatzweisen Pfad für Zusammenfassungen in der Warteschlange, sodass nichts an den Chat zurückgesendet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, ob der Job über eine nutzbare Route verfügt (`channel: "last"` mit einem vorherigen Chat oder ein expliziter Kanal bzw. ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint einen Rollover im Stil von /new zu verhindern">
    - Die Aktualität für tägliche und inaktivitätsbedingte Zurücksetzungen basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Aktivierungen, Heartbeat-Ausführungen, Exec-Benachrichtigungen und die Gateway-Buchführung können die Sitzungszeile für Routing und Status aktualisieren, verlängern jedoch weder `sessionStartedAt` noch `lastInteractionAt`.
    - Bei älteren Zeilen, die erstellt wurden, bevor diese Felder vorhanden waren, kann OpenClaw `sessionStartedAt` aus dem JSONL-Sitzungsheader des Transkripts wiederherstellen, sofern die Datei noch verfügbar ist. Ältere inaktive Zeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als Ausgangspunkt für die Inaktivität.

  </Accordion>
  <Accordion title="Fallstricke bei Zeitzonen">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat-`activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenregister für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Durchläufe der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
