---
read_when:
    - Hintergrundaufgaben oder Aufweckvorgänge planen
    - Externe Auslöser (Webhooks, Gmail) in OpenClaw einbinden
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
sidebarTitle: Scheduled tasks
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Auslöser für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-07-02T08:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron ist der integrierte Scheduler des Gateway. Er persistiert Jobs, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben an einen Chat-Kanal oder Webhook-Endpunkt zurückliefern.

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
  <Step title="Ausführungshistorie ansehen">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Funktionsweise von Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Jobdefinitionen, Laufzeitstatus und Ausführungshistorie werden in der gemeinsamen SQLite-Zustandsdatenbank von OpenClaw persistiert, sodass Neustarts keine Zeitpläne verlieren.
- Führen Sie beim Upgrade `openclaw doctor --fix` aus, um ältere Dateien `~/.openclaw/cron/jobs.json`, `jobs-state.json` und `runs/*.jsonl` in SQLite zu importieren und sie mit dem Suffix `.migrated` umzubenennen. Fehlerhafte Job-Zeilen werden zur Laufzeit übersprungen und zur späteren Reparatur oder Prüfung nach `jobs-quarantine.json` kopiert.
- `cron.store` benennt weiterhin den logischen Cron-Store-Schlüssel und den doctor-Importpfad. Nach dem Import ändert das Bearbeiten dieser JSON-Datei keine aktiven Cron-Jobs mehr; verwenden Sie stattdessen `openclaw cron add|edit|remove` oder die Cron-RPC-Methoden des Gateway.
- Alle Cron-Ausführungen erstellen Datensätze für [Hintergrundaufgaben](/de/automation/tasks).
- Beim Start des Gateway werden überfällige isolierte Agent-Turn-Jobs aus dem Kanalverbindungsfenster heraus neu geplant, statt sofort erneut abgespielt zu werden, damit Discord/Telegram-Start und native Befehlseinrichtung nach Neustarts reaktionsfähig bleiben.
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Aufwand nachverfolgte Browser-Tabs/-Prozesse für ihre Sitzung `cron:<jobId>`, wenn die Ausführung abgeschlossen ist, damit losgelöste Browser-Automatisierung keine verwaisten Prozesse zurücklässt.
- Isolierte Cron-Ausführungen, die die eingeschränkte Cron-Selbstbereinigungsberechtigung erhalten, können weiterhin den Scheduler-Status, eine selbst gefilterte Liste ihres aktuellen Jobs und die Ausführungshistorie dieses Jobs lesen, sodass Status-/Heartbeat-Prüfungen ihren eigenen Zeitplan einsehen können, ohne breiteren Zugriff auf Cron-Mutationen zu erhalten.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur eine vorläufige Statusaktualisierung ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein nachgelagerter Subagentenlauf mehr für die endgültige Antwort verantwortlich ist, fordert OpenClaw einmal erneut das eigentliche Ergebnis an, bevor es zugestellt wird.
- Isolierte Cron-Ausführungen verwenden strukturierte Metadaten zu Ausführungsverweigerungen aus dem eingebetteten Lauf, einschließlich Node-Host-`UNAVAILABLE`-Wrappern, deren verschachtelte Fehlermeldung mit `SYSTEM_RUN_DENIED` oder `INVALID_REQUEST` beginnt, sodass ein blockierter Befehl nicht als erfolgreicher Lauf gemeldet wird, während gewöhnliche Assistentenprosa nicht als Verweigerung behandelt wird.
- Isolierte Cron-Ausführungen behandeln außerdem Fehler des Agenten auf Laufebene als Jobfehler, selbst wenn keine Antwortnutzlast erzeugt wird, sodass Modell-/Provider-Fehler Fehlerzähler erhöhen und Fehlerbenachrichtigungen auslösen, statt den Job als erfolgreich abzuschließen.
- Wenn ein isolierter Agent-Turn-Job `timeoutSeconds` erreicht, bricht Cron den zugrunde liegenden Agentenlauf ab und gibt ihm ein kurzes Bereinigungsfenster. Wenn der Lauf nicht abläuft, löscht die Gateway-eigene Bereinigung die Sitzungszuständigkeit dieses Laufs zwangsweise, bevor Cron das Timeout protokolliert, damit wartende Chat-Arbeit nicht hinter einer veralteten Verarbeitungssitzung zurückbleibt.
- Wenn ein isolierter Agent-Turn vor dem Start des Runners oder vor dem ersten Modellaufruf hängen bleibt, protokolliert Cron ein phasenspezifisches Timeout wie `setup timed out before runner start` oder `stalled before first model call (last phase: context-engine)`. Diese Watchdogs decken eingebettete Provider und CLI-gestützte Provider ab, bevor deren externer CLI-Prozess tatsächlich gestartet wird, und sind unabhängig von langen `timeoutSeconds`-Werten begrenzt, damit Cold-Start-/Auth-/Kontextfehler schnell sichtbar werden, statt auf das gesamte Job-Budget zu warten.
- Wenn Sie System-Cron oder einen anderen externen Scheduler verwenden, um `openclaw agent` auszuführen, umschließen Sie ihn mit einer Hard-Kill-Eskalation, obwohl die CLI `SIGTERM`/`SIGINT` verarbeitet. Gateway-gestützte Läufe bitten das Gateway, angenommene Läufe abzubrechen; lokale und eingebettete Fallback-Läufe erhalten dasselbe Abbruchsignal. Für GNU `timeout` bevorzugen Sie `timeout -k 60 600 openclaw agent ...` gegenüber einfachem `timeout 600 ...`; der Wert `-k` ist die Supervisor-Absicherung, falls der Prozess nicht ablaufen kann. Behalten Sie für systemd-Units dieselbe Struktur bei, indem Sie ein `SIGTERM`-Stoppsignal plus ein Kulanzfenster wie `TimeoutStopSec` vor einem finalen Kill verwenden. Wenn ein Wiederholungsversuch eine `--run-id` wiederverwendet, während der ursprüngliche Gateway-Lauf noch aktiv ist, wird das Duplikat als laufend gemeldet, statt einen zweiten Lauf zu starten.

<a id="maintenance"></a>

<Note>
Die Aufgabenabstimmung für Cron ist zuerst laufzeitgeführt und danach durch dauerhafte Historie abgesichert: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend nachverfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert. Sobald die Laufzeit den Job nicht mehr besitzt und das 5-Minuten-Kulanzfenster abläuft, prüft die Wartung persistierte Laufprotokolle und den Jobstatus für den passenden Lauf `cron:<jobId>:<startedAt>`. Wenn diese dauerhafte Historie ein finales Ergebnis zeigt, wird das Aufgaben-Ledger daraus finalisiert; andernfalls kann Gateway-eigene Wartung die Aufgabe als `lost` markieren. Offline-CLI-Audit kann aus dauerhafter Historie wiederherstellen, behandelt seine eigene leere In-Process-Menge aktiver Jobs jedoch nicht als Beweis dafür, dass ein Gateway-eigener Cron-Lauf verschwunden ist.
</Note>

## Zeitplantypen

| Art     | CLI-Flag  | Beschreibung                                             |
| ------- | --------- | -------------------------------------------------------- |
| `at`    | `--at`    | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`) |
| `every` | `--every` | Festes Intervall                                         |
| `cron`  | `--cron`  | Cron-Ausdruck mit 5 oder 6 Feldern und optionalem `--tz` |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Wanduhr-Zeitplanung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um eine präzise Zeitplanung zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag des Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl das Feld für den Tag des Monats als auch das Feld für den Wochentag keine Wildcards sind, stimmt croner überein, wenn **eines** der Felder passt, nicht beide. Dies ist standardmäßiges Vixie-Cron-Verhalten.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dies löst etwa 5- bis 6-mal pro Monat aus statt 0- bis 1-mal pro Monat. OpenClaw verwendet hier Croners standardmäßiges ODER-Verhalten. Um beide Bedingungen zu verlangen, verwenden Sie Croners Wochentagsmodifikator `+` (`0 9 15 * +1`) oder planen Sie auf einem Feld und prüfen Sie das andere in der Eingabeaufforderung oder dem Befehl Ihres Jobs.

## Ausführungsstile

| Stil              | `--session`-Wert   | Läuft in                       | Am besten für                                      |
| ----------------- | ------------------ | ------------------------------ | -------------------------------------------------- |
| Hauptsitzung      | `main`             | Dedizierte Cron-Wake-Lane      | Erinnerungen, Systemereignisse                     |
| Isoliert          | `isolated`         | Dediziertes `cron:<jobId>`     | Berichte, Hintergrundarbeiten                      |
| Aktuelle Sitzung  | `current`          | Zum Erstellungszeitpunkt gebunden | Kontextbewusste wiederkehrende Arbeit           |
| Eigene Sitzung    | `session:custom-id` | Persistente benannte Sitzung   | Workflows, die auf Historie aufbauen               |

<AccordionGroup>
  <Accordion title="Hauptsitzung vs. isoliert vs. eigene Sitzung">
    Jobs der **Hauptsitzung** reihen ein Systemereignis in eine Cron-eigene Ausführungslane ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). Sie können den letzten Zustellungskontext der Ziel-Hauptsitzung für Antworten verwenden, hängen aber keine routinemäßigen Cron-Turns an die menschliche Chat-Lane an und verlängern nicht die tägliche/Leerlauf-Reset-Aktualität für die Zielsitzung. **Isolierte** Jobs führen einen dedizierten Agenten-Turn mit einer frischen Sitzung aus. **Eigene Sitzungen** (`session:xxx`) persistieren Kontext über Läufe hinweg und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.

    Cron-Ereignisse der Hauptsitzung sind eigenständige Systemereignis-Erinnerungen. Sie enthalten nicht automatisch die Anweisung „Read HEARTBEAT.md“ aus der Standard-Heartbeat-Eingabeaufforderung. Wenn eine wiederkehrende Erinnerung `HEARTBEAT.md` berücksichtigen soll, sagen Sie das ausdrücklich im Cron-Ereignistext oder in den eigenen Anweisungen des Agenten.

  </Accordion>
  <Accordion title="Was „frische Sitzung“ für isolierte Jobs bedeutet">
    Für isolierte Jobs bedeutet „frische Sitzung“ eine neue Transcript-/Sitzungs-ID für jeden Lauf. OpenClaw kann sichere Präferenzen wie Denk-/Schnell-/Ausführlich-Einstellungen, Labels und explizit vom Benutzer ausgewählte Modell-/Auth-Overrides übernehmen, erbt aber keinen umgebenden Konversationskontext aus einer älteren Cron-Zeile: Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung oder ACP-Laufzeitbindung. Verwenden Sie `current` oder `session:<id>`, wenn ein wiederkehrender Job bewusst auf demselben Konversationskontext aufbauen soll.
  </Accordion>
  <Accordion title="Laufzeitbereinigung">
    Für isolierte Jobs umfasst der Laufzeitabbau jetzt eine Best-Effort-Browserbereinigung für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit das eigentliche Cron-Ergebnis weiterhin Vorrang hat.

    Isolierte Cron-Ausführungen entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job erstellt wurden, über den gemeinsamen Laufzeitbereinigungspfad. Dies entspricht der Art, wie MCP-Clients der Hauptsitzung und eigener Sitzungen abgebaut werden, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über Läufe hinweg leaken.

  </Accordion>
  <Accordion title="Subagenten- und Discord-Zustellung">
    Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, bevorzugt die Zustellung außerdem die finale Ausgabe des Nachfahren gegenüber veraltetem vorläufigem Text des Elternlaufs. Wenn Nachfahren noch laufen, unterdrückt OpenClaw diese partielle Elternaktualisierung, statt sie anzukündigen.

    Für reine Text-Ankündigungsziele in Discord sendet OpenClaw den kanonischen finalen Assistententext einmal, statt sowohl gestreamte/zwischenzeitliche Textnutzlasten als auch die finale Antwort erneut abzuspielen. Medien und strukturierte Discord-Nutzlasten werden weiterhin als separate Nutzlasten zugestellt, damit Anhänge und Komponenten nicht verworfen werden.

  </Accordion>
</AccordionGroup>

### Befehlsnutzlasten

Verwenden Sie Befehlsnutzlasten für deterministische Skripte, die innerhalb des Gateway-Schedulers laufen sollen, ohne einen modellgestützten isolierten Agenten-Turn zu starten. Befehlsjobs werden auf dem Gateway-Host ausgeführt, erfassen stdout/stderr, protokollieren den Lauf in der Cron-Historie und verwenden dieselben Zustellmodi `announce`, `webhook` und `none` wie isolierte Jobs.

<Note>
Befehls-Cron ist eine Operator-Admin-Automatisierungsoberfläche des Gateway, kein Agentenaufruf von `tools.exec`. Das Erstellen, Aktualisieren, Entfernen oder manuelle Ausführen von Cron-Jobs erfordert `operator.admin`; geplante Befehlsläufe werden später innerhalb des Gateway-Prozesses als diese vom Admin erstellte Automatisierung ausgeführt. Agenten-Exec-Richtlinien wie `tools.exec.mode`, Genehmigungsaufforderungen und Tool-Allowlists pro Agent steuern modell sichtbare Exec-Tools, nicht Befehls-Cron-Nutzlasten.
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

`--command <shell>` speichert `argv: ["sh", "-lc", <shell>]`. Verwenden Sie `--command-argv '["node","scripts/report.mjs"]'`, wenn Sie eine exakte argv-Ausführung ohne Shell-Parsing wünschen. Optionale Felder `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` und `--output-max-bytes` steuern die Prozessumgebung, stdin und Ausgabegrenzen.

Wenn stdout nicht leer ist, ist dieser Text das zugestellte Ergebnis. Wenn stdout leer ist und stderr nicht leer ist, wird stderr zugestellt. Wenn beide Streams vorhanden sind, stellt Cron einen kleinen `stdout:`- / `stderr:`-Block zu. Ein Exit-Code von null zeichnet den Lauf als `ok` auf; ein Exit-Code ungleich null, ein Signal, ein Timeout oder ein Timeout wegen fehlender Ausgabe zeichnet `error` auf und kann Fehlerbenachrichtigungen auslösen. Ein Befehl, der nur `NO_REPLY` ausgibt, verwendet die normale Unterdrückung des Cron-Stille-Tokens und postet nichts zurück in den Chat.

### Payload-Optionen für isolierte Jobs

<ParamField path="--message" type="string" required>
  Prompt-Text (für isolierte Jobs erforderlich).
</ParamField>
<ParamField path="--model" type="string">
  Modell-Override; verwendet das ausgewählte erlaubte Modell für den Job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Fallback-Modellliste pro Job, zum Beispiel `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Übergeben Sie `--fallbacks ""` für einen strikten Lauf ohne Fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Entfernt bei `cron edit` den Fallback-Override pro Job, sodass der Job der konfigurierten Fallback-Reihenfolge folgt. Kann nicht mit `--fallbacks` kombiniert werden.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Entfernt bei `cron edit` den Modell-Override pro Job, sodass der Job der normalen Cron-Reihenfolge für die Modellauswahl folgt (ein gespeicherter Cron-Session-Override, falls gesetzt, andernfalls das Agent-/Standardmodell). Kann nicht mit `--model` kombiniert werden.
</ParamField>
<ParamField path="--thinking" type="string">
  Override für das Thinking-Level.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Entfernt bei `cron edit` den Thinking-Override pro Job, sodass der Job der normalen Cron-Reihenfolge für Thinking folgt. Kann nicht mit `--thinking` kombiniert werden.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Überspringt die Injektion der Workspace-Bootstrap-Datei.
</ParamField>
<ParamField path="--tools" type="string">
  Beschränkt, welche Tools der Job verwenden kann, zum Beispiel `--tools exec,read`.
</ParamField>

`--model` verwendet das ausgewählte erlaubte Modell als primäres Modell dieses Jobs. Es ist nicht dasselbe wie ein `/model`-Override einer Chat-Session: konfigurierte Fallback-Ketten gelten weiterhin, wenn das primäre Modell des Jobs fehlschlägt. Wenn das angeforderte Modell nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem ausdrücklichen Validierungsfehler fehlschlagen, statt still auf die Agent-/Standardmodellauswahl des Jobs zurückzufallen.

Cron-Jobs können auch `fallbacks` auf Payload-Ebene enthalten. Wenn vorhanden, ersetzt diese Liste die konfigurierte Fallback-Kette für den Job. Verwenden Sie `fallbacks: []` im Job-Payload/API, wenn Sie einen strikten Cron-Lauf möchten, der nur das ausgewählte Modell ausprobiert. Wenn ein Job `--model`, aber weder Payload- noch konfigurierte Fallbacks hat, übergibt OpenClaw einen ausdrücklichen leeren Fallback-Override, damit das primäre Agent-Modell nicht als verborgenes zusätzliches Wiederholungsziel angehängt wird.

Preflight-Prüfungen für lokale Provider durchlaufen konfigurierte Fallbacks, bevor ein Cron-Lauf als `skipped` markiert wird; `fallbacks: []` hält diesen Preflight-Pfad strikt.

Die Reihenfolge der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modell-Override (wenn der Lauf von Gmail kam und dieser Override erlaubt ist)
2. `model` im Payload pro Job
3. Vom Benutzer ausgewählter gespeicherter Cron-Session-Modell-Override
4. Agent-/Standardmodellauswahl

Der Schnellmodus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isolierter Cron dies standardmäßig. Ein gespeicherter Session-Override für `fastMode` hat weiterhin in beide Richtungen Vorrang vor der Konfiguration. Der Auto-Modus verwendet den Schwellenwert `params.fastAutoOnSeconds` des ausgewählten Modells, wenn vorhanden, andernfalls standardmäßig 60 Sekunden.

Wenn ein isolierter Lauf eine Live-Modellwechsel-Übergabe erreicht, wiederholt Cron den Versuch mit dem gewechselten Provider/Modell und persistiert diese Live-Auswahl vor der Wiederholung für den aktiven Lauf. Wenn der Wechsel auch ein neues Auth-Profil enthält, persistiert Cron diesen Auth-Profil-Override ebenfalls für den aktiven Lauf. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

Bevor ein isolierter Cron-Lauf den Agent-Runner erreicht, prüft OpenClaw erreichbare lokale Provider-Endpunkte für konfigurierte `api: "ollama"`- und `api: "openai-completions"`-Provider, deren `baseUrl` loopback, ein privates Netzwerk oder `.local` ist. Wenn dieser Endpunkt nicht verfügbar ist, wird der Lauf als `skipped` mit einem klaren Provider-/Modellfehler aufgezeichnet, statt einen Modellaufruf zu starten. Das Endpunktergebnis wird 5 Minuten lang zwischengespeichert, sodass viele fällige Jobs, die denselben nicht erreichbaren lokalen Ollama-, vLLM-, SGLang- oder LM-Studio-Server verwenden, eine kleine Prüfung teilen, statt einen Anfragesturm zu erzeugen. Übersprungene Provider-Preflight-Läufe erhöhen das Backoff für Ausführungsfehler nicht; aktivieren Sie `failureAlert.includeSkipped`, wenn Sie wiederholte Benachrichtigungen über Überspringungen wünschen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Stellt finalen Text per Fallback an das Ziel zu, falls der Agent nicht gesendet hat |
| `webhook`  | POSTet Payload des abgeschlossenen Ereignisses an eine URL         |
| `none`     | Keine Fallback-Zustellung durch den Runner                         |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an einen Kanal. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`; OpenClaw akzeptiert auch die Telegram-eigene Kurzform `-1001234567890:123`. Direkte RPC-/Konfigurationsaufrufer können `delivery.threadId` als String oder Zahl übergeben. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`). Matrix-Raum-IDs beachten Groß-/Kleinschreibung; verwenden Sie die exakte Raum-ID oder die Form `room:!room:server` aus Matrix.

Wenn die announce-Zustellung `channel: "last"` verwendet oder `channel` auslässt, kann ein Provider-präfixiertes Ziel wie `telegram:123` den Kanal auswählen, bevor Cron auf den Session-Verlauf oder einen einzelnen konfigurierten Kanal zurückfällt. Nur Präfixe, die vom geladenen Plugin angekündigt werden, sind Provider-Selektoren. Wenn `delivery.channel` explizit ist, muss das Zielpräfix denselben Provider benennen; zum Beispiel wird `channel: "whatsapp"` mit `to: "telegram:123"` abgelehnt, statt WhatsApp die Telegram-ID als Telefonnummer interpretieren zu lassen. Zielart- und Dienstpräfixe wie `channel:<id>`, `user:<id>`, `imessage:<handle>` und `sms:<number>` bleiben kanaleigene Zielsyntax, keine Provider-Selektoren.

Für isolierte Jobs wird die Chat-Zustellung geteilt. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` verwenden, auch wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Ankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Turn mit der finalen Antwort macht.

Wenn ein Agent eine isolierte Erinnerung aus einem aktiven Chat erstellt, speichert OpenClaw das beibehaltene Live-Zustellziel für die Fallback-announce-Route. Interne Session-Schlüssel können kleingeschrieben sein; Provider-Zustellziele werden nicht aus diesen Schlüsseln rekonstruiert, wenn aktueller Chat-Kontext verfügbar ist.

Implizite announce-Zustellung verwendet konfigurierte Kanal-Allowlists, um veraltete Ziele zu validieren und umzuleiten. Genehmigungen aus dem DM-Pairing-Store sind keine Empfänger für Fallback-Automatisierung; setzen Sie `delivery.to` oder konfigurieren Sie den `allowFrom`-Eintrag des Kanals, wenn ein geplanter Job proaktiv an eine DM senden soll.

## Ausgabesprache

Cron-Jobs leiten keine Antwortsprache aus Kanal, Locale oder vorherigen
Nachrichten ab. Setzen Sie die Sprachregel in die geplante Nachricht oder Vorlage:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Bei Vorlagendateien behalten Sie die Sprachanweisung im gerenderten Prompt und
prüfen Sie, dass Platzhalter wie `{{language}}` ausgefüllt sind, bevor der Job läuft. Wenn
die Ausgabe Sprachen mischt, formulieren Sie die Regel ausdrücklich, zum Beispiel: "Use Chinese
for narrative text and keep technical terms in English."

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre announce-Ziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, außer der primäre Zustellmodus ist `webhook`.
- `failureAlert.includeSkipped: true` nimmt einen Job oder eine globale Cron-Benachrichtigungsrichtlinie in wiederholte Benachrichtigungen über übersprungene Läufe auf. Übersprungene Läufe behalten einen separaten Zähler für aufeinanderfolgende Überspringungen, sodass sie das Backoff für Ausführungsfehler nicht beeinflussen.

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

Query-String-Token werden abgelehnt.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Stellt ein Systemereignis für die Haupt-Session in die Warteschlange:

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
    Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads mit Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen transformieren.
  </Accordion>
</AccordionGroup>

<Warning>
Halten Sie Hook-Endpunkte hinter loopback, Tailnet oder einem vertrauenswürdigen Reverse Proxy.

- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Auth-Token erneut.
- Belassen Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um einzuschränken, welchen effektiven Agent ein Hook ansprechen kann, einschließlich des Standard-Agents, wenn `agentId` ausgelassen wird.
- Belassen Sie `hooks.allowRequestSessionKey=false`, außer Sie benötigen vom Aufrufer ausgewählte Sitzungen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um zulässige Session-Key-Formen einzuschränken.
- Hook-Nutzlasten werden standardmäßig mit Sicherheitsgrenzen umschlossen.

</Warning>

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangsauslöser über Google PubSub mit OpenClaw.

<Note>
**Voraussetzungen:** `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.
</Note>

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die `hooks.gmail`-Konfiguration, aktiviert die Gmail-Voreinstellung und verwendet Tailscale Funnel für den Push-Endpunkt.

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

`openclaw cron run <jobId>` kehrt zurück, nachdem der manuelle Lauf in die Warteschlange gestellt wurde. Verwenden Sie `--wait` für Shutdown-Hooks, Wartungsskripte oder andere Automatisierung, die blockieren muss, bis der eingereihte Lauf abgeschlossen ist. Der Wartemodus pollt die exakt zurückgegebene `runId`; er beendet sich mit `0` bei Status `ok` und mit einem Wert ungleich null bei `error`, `skipped` oder einem Warte-Timeout.

Das Agent-Tool `cron` gibt kompakte Job-Zusammenfassungen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) von `cron(action: "list")` zurück; verwenden Sie `cron(action: "get", jobId: "...")` für eine vollständige Jobdefinition. Direkte Gateway-Aufrufer können `compact: true` an `cron.list` übergeben; wenn es ausgelassen wird, bleibt die bestehende vollständige Antwort mit Zustellungsvorschauen erhalten.

`openclaw cron create` ist ein Alias für `openclaw cron add`, und neue Jobs können einen positionsbasierten Zeitplan (`"0 9 * * 1"`, `"every 1h"`, `"20m"` oder einen ISO-Zeitstempel) verwenden, gefolgt von einem positionsbasierten Agent-Prompt. Verwenden Sie `--webhook <url>` bei `cron add|create` oder `cron edit`, um die Nutzlast des abgeschlossenen Laufs per POST an einen HTTP-Endpunkt zu senden. Webhook-Zustellung kann nicht mit Chat-Zustellungsflags wie `--announce`, `--channel`, `--to`, `--thread-id` oder `--account` kombiniert werden. Bei `cron edit` entfernen `--clear-channel`, `--clear-to`, `--clear-thread-id` und `--clear-account` diese Routing-Felder einzeln (jeweils abgelehnt zusammen mit dem passenden Set-Flag), was sich davon unterscheidet, dass `--no-deliver` die Runner-Fallback-Zustellung deaktiviert.

<Note>
Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Lauf.
- Wenn es nicht erlaubt ist oder nicht aufgelöst werden kann, lässt Cron den Lauf mit einem expliziten Validierungsfehler fehlschlagen.
- API-`cron.update`-Nutzlast-Patches können `model: null` setzen, um eine gespeicherte Modellüberschreibung für einen Job zu löschen.
- `openclaw cron edit <job-id> --clear-model` löscht diese Überschreibung über die CLI (gleicher Effekt wie der Patch `model: null`) und kann nicht mit `--model` kombiniert werden.
- Konfigurierte Fallback-Ketten gelten weiterhin, weil Cron-`--model` ein Job-Primary ist, keine Sitzungs-`/model`-Überschreibung.
- `openclaw cron add|edit --fallbacks ...` setzt die Nutzlast `fallbacks` und ersetzt konfigurierte Fallbacks für diesen Job; `--fallbacks ""` deaktiviert Fallback und macht den Lauf strikt. `openclaw cron edit <job-id> --clear-fallbacks` löscht die jobbezogene Überschreibung.
- Ein einfaches `--model` ohne explizite oder konfigurierte Fallback-Liste fällt nicht stillschweigend auf den Agent-Primary als zusätzliches Retry-Ziel zurück.

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

`maxConcurrentRuns` begrenzt sowohl geplante Cron-Dispatches als auch die isolierte Agent-Turn-Ausführung und ist standardmäßig 8. Isolierte Cron-Agent-Turns verwenden intern die dedizierte Ausführungsspur `cron-nested` der Warteschlange; wenn Sie diesen Wert erhöhen, können unabhängige Cron-LLM-Läufe parallel fortschreiten, statt nur ihre äußeren Cron-Wrapper zu starten. Die gemeinsame Nicht-Cron-Spur `nested` wird durch diese Einstellung nicht erweitert.

`cron.store` ist ein logischer Store-Schlüssel und ein Legacy-Doctor-Importpfad. Führen Sie `openclaw doctor --fix` aus, um bestehende JSON-Stores in SQLite zu importieren und zu archivieren; zukünftige Cron-Änderungen sollten über die CLI oder Gateway-API erfolgen.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry-Verhalten">
    **Einmaliger Retry**: Vorübergehende Fehler (Rate Limit, Überlastung, Netzwerk, Serverfehler) werden bis zu 3 Mal mit exponentiellem Backoff erneut versucht. Dauerhafte Fehler deaktivieren sofort.

    **Wiederkehrender Retry**: exponentieller Backoff (30s bis 60m) zwischen Retries. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

  </Accordion>
  <Accordion title="Wartung">
    `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Run-Session-Einträge. `cron.runLog.keepLines` begrenzt die beibehaltenen SQLite-Run-History-Zeilen pro Job; `maxBytes` bleibt aus Konfigurationskompatibilität mit älteren dateibasierten Run-Logs erhalten.
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
    - Prüfen Sie `cron.enabled` und die Env-Var `OPENCLAW_SKIP_CRON`.
    - Stellen Sie sicher, dass der Gateway kontinuierlich läuft.
    - Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) gegenüber der Host-Zeitzone.
    - `reason: not-due` in der Run-Ausgabe bedeutet, dass der manuelle Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

  </Accordion>
  <Accordion title="Cron wurde ausgelöst, aber keine Zustellung">
    - Der Zustellungsmodus `none` bedeutet, dass kein Runner-Fallback-Senden erwartet wird. Der Agent kann mit dem `message`-Tool weiterhin direkt senden, wenn eine Chat-Route verfügbar ist.
    - Fehlendes/ungültiges Zustellungsziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
    - Bei Matrix können kopierte oder Legacy-Jobs mit kleingeschriebenen `delivery.to`-Room-IDs fehlschlagen, weil Matrix-Room-IDs Groß-/Kleinschreibung unterscheiden. Bearbeiten Sie den Job auf den exakten Wert `!room:server` oder `room:!room:server` aus Matrix.
    - Channel-Auth-Fehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
    - Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad der eingereihten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
    - Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, dass der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Channel/ein explizites Ziel).

  </Accordion>
  <Accordion title="Cron oder Heartbeat scheint /new-artigen Rollover zu verhindern">
    - Tägliche und Leerlauf-Reset-Freshness basiert nicht auf `updatedAt`; siehe [Sitzungsverwaltung](/de/concepts/session#session-lifecycle).
    - Cron-Wakeups, Heartbeat-Läufe, Exec-Benachrichtigungen und Gateway-Buchführung können die Sitzungszeile für Routing/Status aktualisieren, verlängern aber weder `sessionStartedAt` noch `lastInteractionAt`.
    - Für Legacy-Zeilen, die erstellt wurden, bevor diese Felder existierten, kann OpenClaw `sessionStartedAt` aus dem Transcript-JSONL-Sitzungsheader wiederherstellen, wenn die Datei noch verfügbar ist. Legacy-Leerlaufzeilen ohne `lastInteractionAt` verwenden diese wiederhergestellte Startzeit als ihre Leerlauf-Baseline.

  </Accordion>
  <Accordion title="Zeitzonen-Fallstricke">
    - Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
    - `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
    - Heartbeat-`activeHours` verwendet die konfigurierte Zeitzonenauflösung.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Automatisierung](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Task-Ledger für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Turns der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
