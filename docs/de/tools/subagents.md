---
read_when:
    - Sie möchten Hintergrund-/Parallelarbeit über den Agenten ausführen.
    - Sie ändern die Richtlinie für `sessions_spawn` oder das Sub-Agent-Tool.
    - Sie implementieren oder beheben Probleme bei threadgebundenen Subagent-Sitzungen.
summary: 'Sub-Agents: isolierte Agentenläufe starten, die Ergebnisse an den anfragenden Chat zurückmelden'
title: Sub-Agents
x-i18n:
    generated_at: "2026-04-21T19:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-Agents

Sub-Agents sind Hintergrund-Agentenläufe, die aus einem bestehenden Agentenlauf heraus gestartet werden. Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und **melden** ihr Ergebnis nach Abschluss an den anfragenden Chat-Kanal zurück. Jeder Sub-Agent-Lauf wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

## Slash-Befehl

Verwenden Sie `/subagents`, um Sub-Agent-Läufe für die **aktuelle Sitzung** zu prüfen oder zu steuern:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Steuerelemente für Thread-Bindung:

Diese Befehle funktionieren auf Kanälen, die persistente Thread-Bindungen unterstützen. Siehe **Kanäle mit Thread-Unterstützung** unten.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` zeigt Lauf-Metadaten an (Status, Zeitstempel, Sitzungs-ID, Transkriptpfad, Bereinigung).
Verwenden Sie `sessions_history` für eine begrenzte, sicherheitsgefilterte Erinnerungsansicht; prüfen Sie den
Transkriptpfad auf dem Datenträger, wenn Sie das rohe vollständige Transkript benötigen.

### Spawn-Verhalten

`/subagents spawn` startet einen Sub-Agenten im Hintergrund als Benutzerbefehl, nicht als interne Weiterleitung, und sendet ein abschließendes Abschluss-Update an den anfragenden Chat, wenn der Lauf beendet ist.

- Der Spawn-Befehl blockiert nicht; er gibt sofort eine Lauf-ID zurück.
- Nach Abschluss meldet der Sub-Agent eine Zusammenfassungs-/Ergebnisnachricht an den anfragenden Chat-Kanal zurück.
- Der Abschluss ist push-basiert. Nach dem Start sollten Sie nicht in einer Schleife `/subagents list`,
  `sessions_list` oder `sessions_history` abfragen, nur um auf den Abschluss zu
  warten; prüfen Sie den Status nur bei Bedarf für Debugging oder Eingriffe.
- Nach Abschluss schließt OpenClaw nach bestem Bemühen verfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Bereinigungsablauf der Meldung fortgesetzt wird.
- Für manuelle Spawns ist die Zustellung robust:
  - OpenClaw versucht zuerst die direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
  - Wenn die direkte Zustellung fehlschlägt, erfolgt ein Fallback auf Queue-Routing.
  - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Meldung mit einem kurzen exponentiellen Backoff erneut versucht, bevor endgültig aufgegeben wird.
- Die Abschlusszustellung behält die aufgelöste Anfrageroute bei:
  - threadgebundene oder konversationsgebundene Abschlussrouten haben Vorrang, wenn verfügbar
  - wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anfragersitzung (`lastChannel` / `lastTo` / `lastAccountId`), sodass die direkte Zustellung weiterhin funktioniert
- Die Abschlussübergabe an die Anfragersitzung ist zur Laufzeit generierter interner Kontext (kein vom Benutzer verfasster Text) und enthält:
  - `Result` (letzter sichtbarer `assistant`-Antworttext, andernfalls bereinigter letzter Tool-/`toolResult`-Text; terminal fehlgeschlagene Läufe verwenden keinen erfassten Antworttext erneut)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakte Laufzeit-/Token-Statistiken
  - eine Zustellungsanweisung, die dem anfragenden Agenten mitteilt, in normaler Assistant-Stimme umzuschreiben (keine rohen internen Metadaten weiterleiten)
- `--model` und `--thinking` überschreiben die Standardwerte für diesen spezifischen Lauf.
- Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
- `/subagents spawn` ist der Einmalmodus (`mode: "run"`). Für persistente threadgebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
- Für ACP-Harness-Sitzungen (Codex, Claude Code, Gemini CLI) verwenden Sie `sessions_spawn` mit `runtime: "acp"` und siehe [ACP Agents](/de/tools/acp-agents).

Primäre Ziele:

- „Recherche / lange Aufgabe / langsames Tool“-Arbeit parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungs-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

Hinweis zu Kosten: Jeder Sub-Agent hat seinen **eigenen** Kontext und eigenen Token-Verbrauch. Für schwere oder wiederholte
Aufgaben sollten Sie ein günstigeres Modell für Sub-Agents festlegen und Ihren Hauptagenten auf einem hochwertigeren Modell belassen.
Sie können dies über `agents.defaults.subagents.model` oder agentenspezifische Überschreibungen konfigurieren.

## Tool

Verwenden Sie `sessions_spawn`:

- Startet einen Sub-Agent-Lauf (`deliver: false`, globale Lane: `subagent`)
- Führt dann einen Meldungsschritt aus und veröffentlicht die Meldungsantwort im anfragenden Chat-Kanal
- Standardmodell: übernimmt den Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- Standard-`thinking`: übernimmt den Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- Standard-Lauf-Timeout: Wenn `sessions_spawn.runTimeoutSeconds` weggelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls wird auf `0` zurückgefallen (kein Timeout).

Tool-Parameter:

- `task` (erforderlich)
- `label?` (optional)
- `agentId?` (optional; unter einer anderen Agenten-ID starten, falls erlaubt)
- `model?` (optional; überschreibt das Sub-Agent-Modell; ungültige Werte werden übersprungen und der Sub-Agent läuft mit dem Standardmodell mit einer Warnung im Tool-Ergebnis)
- `thinking?` (optional; überschreibt die Thinking-Stufe für den Sub-Agent-Lauf)
- `runTimeoutSeconds?` (standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`; wenn gesetzt, wird der Sub-Agent-Lauf nach N Sekunden abgebrochen)
- `thread?` (standardmäßig `false`; wenn `true`, wird eine Kanal-Thread-Bindung für diese Sub-Agent-Sitzung angefordert)
- `mode?` (`run|session`)
  - Standard ist `run`
  - wenn `thread: true` und `mode` ausgelassen wird, wird standardmäßig `session`
  - `mode: "session"` erfordert `thread: true`
- `cleanup?` (`delete|keep`, standardmäßig `keep`)
- `sandbox?` (`inherit|require`, standardmäßig `inherit`; `require` lehnt den Spawn ab, es sei denn, die Ziel-Child-Runtime ist sandboxed)
- `sessions_spawn` akzeptiert **keine** Kanal-Zustellparameter (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Für die Zustellung verwenden Sie `message`/`sessions_send` aus dem gestarteten Lauf.

## Threadgebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiterhin an dieselbe Sub-Agent-Sitzung geleitet werden.

### Kanäle mit Thread-Unterstützung

- Discord (derzeit der einzige unterstützte Kanal): unterstützt persistente threadgebundene Sub-Agent-Sitzungen (`sessions_spawn` mit `thread: true`), manuelle Thread-Steuerung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) und Adapter-Schlüssel `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` und `channels.discord.threadBindings.spawnSubagentSessions`.

Kurzer Ablauf:

1. Starten Sie mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"`).
2. OpenClaw erstellt einen Thread oder bindet einen Thread an dieses Sitzungsziel im aktiven Kanal.
3. Antworten und Folgemeldungen in diesem Thread werden an die gebundene Sitzung weitergeleitet.
4. Verwenden Sie `/session idle`, um die automatische Entfokussierung bei Inaktivität zu prüfen/aktualisieren, und `/session max-age`, um die harte Obergrenze zu steuern.
5. Verwenden Sie `/unfocus`, um die Bindung manuell zu lösen.

Manuelle Steuerelemente:

- `/focus <target>` bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Sitzungsziel.
- `/unfocus` entfernt die Bindung für den aktuell gebundenen Thread.
- `/agents` listet aktive Läufe und den Bindungsstatus auf (`thread:<id>` oder `unbound`).
- `/session idle` und `/session max-age` funktionieren nur für fokussierte gebundene Threads.

Konfigurationsschalter:

- Globaler Standard: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Kanalüberschreibung und Schlüssel für automatisches Spawn-Binding sind adapterspezifisch. Siehe **Kanäle mit Thread-Unterstützung** oben.

Siehe [Configuration Reference](/de/gateway/configuration-reference) und [Slash commands](/de/tools/slash-commands) für aktuelle Adapterdetails.

Allowlist:

- `agents.list[].subagents.allowAgents`: Liste von Agenten-IDs, die über `agentId` als Ziel verwendet werden können (`["*"]`, um beliebige zu erlauben). Standard: nur der anfragende Agent.
- `agents.defaults.subagents.allowAgents`: Standard-Zielagenten-Allowlist, die verwendet wird, wenn der anfragende Agent keine eigene `subagents.allowAgents` setzt.
- Sandbox-Vererbungswächter: Wenn die Anfragersitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: Wenn `true`, werden `sessions_spawn`-Aufrufe blockiert, die `agentId` auslassen (erzwingt explizite Profilauswahl). Standard: `false`.

Erkennung:

- Verwenden Sie `agents_list`, um zu sehen, welche Agenten-IDs derzeit für `sessions_spawn` erlaubt sind.

Automatische Archivierung:

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard: 60).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (im selben Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Meldung (behält das Transkript dennoch durch Umbenennung).
- Die automatische Archivierung erfolgt nach bestem Bemühen; ausstehende Timer gehen verloren, wenn das Gateway neu startet.
- `runTimeoutSeconds` archiviert nicht automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von der Archivbereinigung getrennt: Verfolgte Browser-Tabs/Prozesse werden nach bestem Bemühen geschlossen, wenn der Lauf endet, selbst wenn das Transkript/der Sitzungsdatensatz erhalten bleibt.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents starten (`maxSpawnDepth: 1`). Sie können eine Ebene der Verschachtelung aktivieren, indem Sie `maxSpawnDepth: 2` setzen; dadurch wird das **Orchestrator-Muster** erlaubt: Hauptagent → Orchestrator-Sub-Agent → Worker-Sub-Sub-Agents.

### Aktivierung

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // Sub-Agents dürfen Children starten (Standard: 1)
        maxChildrenPerAgent: 5, // maximal aktive Children pro Agentensitzung (Standard: 5)
        maxConcurrent: 8, // globale Obergrenze für gleichzeitige Ausführung in der Lane (Standard: 8)
        runTimeoutSeconds: 900, // Standard-Timeout für sessions_spawn, wenn ausgelassen (0 = kein Timeout)
      },
    },
  },
}
```

### Tiefenebenen

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                         | Kann starten?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Hauptagent                                    | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Niemals                      |

### Meldekette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 wird abgeschlossen → meldet an seinen Parent (Orchestrator der Tiefe 1)
2. Orchestrator der Tiefe 1 empfängt die Meldung, synthetisiert Ergebnisse, wird abgeschlossen → meldet an den Hauptagenten
3. Hauptagent empfängt die Meldung und stellt sie dem Benutzer zu

Jede Ebene sieht nur Meldungen ihrer direkten Children.

Betriebshinweise:

- Starten Sie Child-Arbeit einmal und warten Sie auf Abschlussereignisse, anstatt Polling-
  Schleifen um `sessions_list`, `sessions_history`, `/subagents list` oder
  `exec`-sleep-Befehle zu bauen.
- Wenn ein Child-Abschlussereignis eintrifft, nachdem Sie bereits die endgültige Antwort gesendet haben,
  ist die korrekte Folgeaktion das exakte stille Token `NO_REPLY` / `no_reply`.

### Tool-Richtlinie nach Tiefe

- Rolle und Kontrollumfang werden beim Start in die Sitzungsmetadaten geschrieben. Dadurch wird verhindert, dass flache oder wiederhergestellte Sitzungsschlüssel versehentlich wieder Orchestrator-Berechtigungen erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`)**: Erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Children verwalten kann. Andere Sitzungs-/System-Tools bleiben weiterhin verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`)**: Keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker)**: Keine Sitzungs-Tools — `sessions_spawn` wird in Tiefe 2 immer verweigert. Kann keine weiteren Children starten.

### Spawn-Limit pro Agent

Jede Agentensitzung (in jeder Tiefe) kann höchstens `maxChildrenPerAgent` (Standard: 5) aktive Children gleichzeitig haben. Das verhindert unkontrolliertes Fan-out von einem einzelnen Orchestrator.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Children der Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agenten der Tiefe 1 und kaskadiert zu ihren Children der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Children.
- `/subagents kill all` stoppt alle Sub-Agents für den Anfragenden und kaskadiert.

## Authentifizierung

Die Authentifizierung für Sub-Agents wird über die **Agenten-ID** aufgelöst, nicht über den Sitzungstyp:

- Der Sitzungsschlüssel des Sub-Agenten ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Hauptagenten werden als **Fallback** zusammengeführt; Agentenprofile überschreiben bei Konflikten die Profile des Hauptagenten.

Hinweis: Die Zusammenführung ist additiv, daher sind die Profile des Hauptagenten immer als Fallbacks verfügbar. Vollständig isolierte Authentifizierung pro Agent wird derzeit noch nicht unterstützt.

## Meldung

Sub-Agents melden sich über einen Meldungsschritt zurück:

- Der Meldungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht in der Anfragersitzung).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts veröffentlicht.
- Wenn der letzte Assistant-Text das exakte stille Token `NO_REPLY` / `no_reply` ist,
  wird die Meldungsausgabe unterdrückt, selbst wenn es zuvor sichtbaren Fortschritt gab.
- Andernfalls hängt die Zustellung von der Anfragertiefe ab:
  - Anfragersitzungen der obersten Ebene verwenden einen nachgelagerten `agent`-Aufruf mit externer Zustellung (`deliver=true`)
  - verschachtelte Anfrager-Subagent-Sitzungen erhalten eine interne nachgelagerte Injektion (`deliver=false`), damit der Orchestrator Child-Ergebnisse in der Sitzung synthetisieren kann
  - wenn eine verschachtelte Anfrager-Subagent-Sitzung nicht mehr existiert, fällt OpenClaw, wenn verfügbar, auf den Anfragenden dieser Sitzung zurück
- Für Anfragersitzungen der obersten Ebene löst die direkte Zustellung im Abschlussmodus zunächst jede gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und ergänzt dann fehlende Kanal-Zielfelder aus der gespeicherten Route der Anfragersitzung. Dadurch bleiben Abschlüsse im richtigen Chat/Topic, auch wenn der Abschlussursprung nur den Kanal identifiziert.
- Die Aggregation von Child-Abschlüssen wird beim Erstellen verschachtelter Abschlussbefunde auf den aktuellen Anfragerlauf begrenzt, damit veraltete Child-Ausgaben aus früheren Läufen nicht in die aktuelle Meldung gelangen.
- Meldungsantworten behalten Thread-/Topic-Routing bei, wenn dies in Kanaladaptern verfügbar ist.
- Der Meldungskontext wird zu einem stabilen internen Ereignisblock normalisiert:
  - Quelle (`subagent` oder `cron`)
  - Child-Sitzungsschlüssel/-ID
  - Meldungstyp + Aufgabenlabel
  - Statuszeile, abgeleitet aus dem Laufzeitergebnis (`success`, `error`, `timeout` oder `unknown`)
  - Ergebnisinhalt, ausgewählt aus dem letzten sichtbaren Assistant-Text, andernfalls bereinigter letzter Tool-/`toolResult`-Text; terminal fehlgeschlagene Läufe melden den Fehlerstatus, ohne erfassten Antworttext erneut wiederzugeben
  - eine Folgeanweisung, die beschreibt, wann geantwortet und wann still geblieben werden soll
- `Status` wird nicht aus der Modellausgabe abgeleitet; er stammt aus Laufzeit-Ergebnissignalen.
- Bei einem Timeout kann die Meldung diese Historie zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, wenn das Child nur bis zu Tool-Aufrufen gekommen ist, statt rohe Tool-Ausgabe wiederzugeben.

Meldungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn sie umschlossen sind):

- Laufzeit (z. B. `runtime 5m12s`)
- Token-Nutzung (Eingabe/Ausgabe/Gesamt)
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` und Transkriptpfad (damit der Hauptagent den Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann)
- Interne Metadaten sind nur für die Orchestrierung gedacht; benutzerseitige Antworten sollten in normaler Assistant-Stimme umgeschrieben werden.

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistant-Recall wird zuerst normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>` / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - XML-Payload-Blöcke für Tool-Aufrufe im Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich
    abgeschnittener Payloads, die nie sauber geschlossen werden
  - herabgestufte Tool-Call-/Ergebnisgerüste und historische Kontextmarker werden entfernt
  - ausgetretene Modell-Steuerungstoken wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Token und Varianten in voller Breite `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Call-XML wird entfernt
- credential-/tokenähnlicher Text wird geschwärzt
- lange Blöcke können gekürzt werden
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- die Prüfung des rohen Transkripts auf dem Datenträger ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen

## Tool-Richtlinie (Sub-Agent-Tools)

Standardmäßig erhalten Sub-Agents **alle Tools außer Sitzungs-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Erinnerungsansicht; es ist
kein Rohdump des Transkripts.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agents der Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre Children verwalten können.

Überschreibung per Konfiguration:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny gewinnt
        deny: ["gateway", "cron"],
        // wenn allow gesetzt ist, wird es zu einer reinen Allowlist (deny gewinnt weiterhin)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Nebenläufigkeit

Sub-Agents verwenden eine dedizierte prozessinterne Queue-Lane:

- Lane-Name: `subagent`
- Nebenläufigkeit: `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Stoppen

- Das Senden von `/stop` im Anfrager-Chat bricht die Anfragersitzung ab und stoppt alle aktiven Sub-Agent-Läufe, die daraus gestartet wurden, einschließlich kaskadierter verschachtelter Children.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Children.

## Einschränkungen

- Die Meldung von Sub-Agenten erfolgt **nach bestem Bemühen**. Wenn das Gateway neu startet, gehen ausstehende „Zurückmelden“-Aufgaben verloren.
- Sub-Agents teilen sich weiterhin dieselben Gateway-Prozessressourcen; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` blockiert nie: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Kontext von Sub-Agenten injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Children pro Sitzung (Standard: 5, Bereich: 1–20).
