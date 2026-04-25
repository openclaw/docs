---
read_when:
    - Sie möchten Hintergrundarbeit/parallelisierte Arbeit über den Agenten ausführen.
    - Sie ändern `sessions_spawn` oder die Richtlinie für das Sub-Agenten-Tool.
    - Sie implementieren oder beheben Fehler bei threadgebundenen Sitzungen von Sub-Agenten.
summary: 'Sub-Agenten: isolierte Agentenläufe starten, die Ergebnisse an den anfragenden Chat zurückmelden'
title: Sub-Agenten
x-i18n:
    generated_at: "2026-04-25T13:59:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b262edf46b9c823dcf0ad6514e560d2d1a718e9081015ea8bb5c081206b88fce
    source_path: tools/subagents.md
    workflow: 15
---

Sub-Agenten sind Hintergrund-Agentenläufe, die aus einem bestehenden Agentenlauf heraus gestartet werden. Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und **kündigen** ihr Ergebnis nach Abschluss wieder im anfragenden Chat-Kanal an. Jeder Sub-Agentenlauf wird als [background task](/de/automation/tasks) verfolgt.

## Slash-Command

Verwenden Sie `/subagents`, um Sub-Agentenläufe für die **aktuelle Sitzung** zu prüfen oder zu steuern:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Steuerelemente für Thread-Bindung:

Diese Befehle funktionieren auf Kanälen, die persistente Thread-Bindings unterstützen. Siehe **Kanäle mit Thread-Unterstützung** unten.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` zeigt Lauf-Metadaten an (Status, Zeitstempel, Sitzungs-ID, Transkriptpfad, Bereinigung).
Verwenden Sie `sessions_history` für eine begrenzte, sicherheitsgefilterte Recall-Ansicht; prüfen Sie
den Transkriptpfad auf dem Datenträger, wenn Sie das rohe vollständige Transkript benötigen.

### Spawn-Verhalten

`/subagents spawn` startet einen Hintergrund-Sub-Agenten als Benutzerbefehl, nicht als internen Relay, und sendet ein abschließendes Status-Update zurück an den anfragenden Chat, wenn der Lauf beendet ist.

- Der Spawn-Befehl ist nicht blockierend; er gibt sofort eine Lauf-ID zurück.
- Nach Abschluss kündigt der Sub-Agent eine Zusammenfassung/Ergebnisnachricht im anfragenden Chat-Kanal an.
- Die Zustellung des Abschlusses ist push-basiert. Sobald der Lauf gestartet wurde, pollen Sie nicht in einer Schleife `\/subagents list`,
  `sessions_list` oder `sessions_history`, nur um auf das
  Ende zu warten; prüfen Sie den Status nur bei Bedarf für Debugging oder Eingriffe.
- Nach Abschluss schließt OpenClaw best effort verfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agenten-Sitzung geöffnet wurden, bevor die Bereinigung der Ankündigung fortgesetzt wird.
- Bei manuellen Spawns ist die Zustellung resilient:
  - OpenClaw versucht zuerst direkte `agent`-Zustellung mit einem stabilen Idempotency-Key.
  - Wenn direkte Zustellung fehlschlägt, fällt es auf Queue-Routing zurück.
  - Wenn Queue-Routing ebenfalls nicht verfügbar ist, wird die Ankündigung vor dem endgültigen Abbruch mit kurzem exponentiellem Backoff erneut versucht.
- Die Zustellung des Abschlusses behält die aufgelöste Route des Anfragestellers bei:
  - threadgebundene oder unterhaltungsgebundene Abschlussrouten haben Vorrang, wenn verfügbar
  - wenn der Ursprung des Abschlusses nur einen Kanal liefert, füllt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anfragersitzung (`lastChannel` / `lastTo` / `lastAccountId`) auf, sodass direkte Zustellung weiterhin funktioniert
- Die Übergabe des Abschlusses an die Sitzung des Anfragestellers ist intern generierter Laufzeitkontext (kein vom Benutzer verfasster Text) und enthält:
  - `Result` (neuster sichtbarer `assistant`-Antworttext, andernfalls bereinigter neuester Text von Tool/ToolResult; terminal fehlgeschlagene Läufe verwenden keinen erfassten Antworttext wieder)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakte Laufzeit-/Token-Statistiken
  - eine Zustellungsanweisung, die dem anfragenden Agenten sagt, in normaler Assistentenstimme umzuschreiben (keine Weiterleitung roher interner Metadaten)
- `--model` und `--thinking` überschreiben Standardwerte für diesen spezifischen Lauf.
- Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
- `/subagents spawn` ist der One-Shot-Modus (`mode: "run"`). Für persistente threadgebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
- Für ACP-Harness-Sitzungen (Codex, Claude Code, Gemini CLI) verwenden Sie `sessions_spawn` mit `runtime: "acp"` und siehe [ACP Agents](/de/tools/acp-agents), insbesondere das [ACP delivery model](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen.

Primäre Ziele:

- Arbeit wie „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agenten standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agenten erhalten standardmäßig **keine** Session-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

Hinweis zu den Kosten: Jeder Sub-Agent hat standardmäßig **seinen eigenen** Kontext und seine eigene Token-Nutzung. Für schwere oder
wiederholte Aufgaben setzen Sie ein günstigeres Modell für Sub-Agenten und belassen Ihren Haupt-Agenten auf einem
höherwertigen Modell. Sie können dies über `agents.defaults.subagents.model` oder agentenspezifische
Overrides konfigurieren. Wenn ein Kind tatsächlich das aktuelle Transkript des Anfragestellers benötigt, kann der Agent bei diesem einen Spawn `context: "fork"` anfordern.

## Kontextmodi

Native Sub-Agenten starten isoliert, sofern der Aufrufer nicht explizit darum bittet, das
aktuelle Transkript zu forken.

| Modus       | Wann er verwendet werden sollte                                                                                                          | Verhalten                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was sich im Aufgabentext kurz beschreiben lässt       | Erstellt ein sauberes Kind-Transkript. Dies ist der Standard und hält die Token-Nutzung niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder nuancierten Anweisungen im Transkript des Anfragestellers abhängt | Verzweigt das Transkript des Anfragestellers in die Kind-Sitzung, bevor das Kind startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht, nicht als Ersatz
für das Schreiben eines klaren Aufgaben-Prompts.

## Tool

Verwenden Sie `sessions_spawn`:

- Startet einen Sub-Agentenlauf (`deliver: false`, globale Lane: `subagent`)
- Führt dann einen Ankündigungsschritt aus und veröffentlicht die Ankündigungsantwort im anfragenden Chat-Kanal
- Standardmodell: erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder pro Agent `agents.list[].subagents.model`) setzen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- Standard-Reasoning: erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder pro Agent `agents.list[].subagents.thinking`) setzen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- Standard-Timeout für den Lauf: Wenn `sessions_spawn.runTimeoutSeconds` weggelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, sofern gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

Tool-Parameter:

- `task` (erforderlich)
- `label?` (optional)
- `agentId?` (optional; unter einer anderen Agenten-ID starten, sofern erlaubt)
- `model?` (optional; überschreibt das Sub-Agenten-Modell; ungültige Werte werden übersprungen und der Sub-Agent läuft mit dem Standardmodell mit einer Warnung im Tool-Ergebnis)
- `thinking?` (optional; überschreibt das Thinking-Level für den Sub-Agentenlauf)
- `runTimeoutSeconds?` (standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, sofern gesetzt, sonst `0`; wenn gesetzt, wird der Sub-Agentenlauf nach N Sekunden abgebrochen)
- `thread?` (Standard `false`; wenn `true`, wird Thread-Bindung des Kanals für diese Sub-Agenten-Sitzung angefordert)
- `mode?` (`run|session`)
  - Standard ist `run`
  - wenn `thread: true` und `mode` weggelassen wird, wird der Standard zu `session`
  - `mode: "session"` erfordert `thread: true`
- `cleanup?` (`delete|keep`, Standard `keep`)
- `sandbox?` (`inherit|require`, Standard `inherit`; `require` lehnt den Spawn ab, sofern die Laufzeit des Ziel-Kinds nicht sandboxed ist)
- `context?` (`isolated|fork`, Standard `isolated`; nur native Sub-Agenten)
  - `isolated` erstellt ein sauberes Kind-Transkript und ist der Standard.
  - `fork` verzweigt das aktuelle Transkript des Anfragestellers in die Kind-Sitzung, sodass das Kind mit demselben Unterhaltungskontext startet.
  - Verwenden Sie `fork` nur dann, wenn das Kind das aktuelle Transkript benötigt. Für eingegrenzte Arbeit lassen Sie `context` weg.
- `sessions_spawn` akzeptiert **keine** kanalbezogenen Zustellungsparameter (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Für Zustellung verwenden Sie `message`/`sessions_send` aus dem gestarteten Lauf.

## Thread-gebundene Sitzungen

Wenn Thread-Bindings für einen Kanal aktiviert sind, kann ein Sub-Agent an einen Thread gebunden bleiben, sodass Folge-Nachrichten des Benutzers in diesem Thread weiterhin an dieselbe Sub-Agenten-Sitzung geroutet werden.

### Kanäle mit Thread-Unterstützung

- Discord (derzeit der einzige unterstützte Kanal): unterstützt persistente threadgebundene Sitzungen von Sub-Agenten (`sessions_spawn` mit `thread: true`), manuelle Thread-Steuerung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) und Adapter-Schlüssel `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` und `channels.discord.threadBindings.spawnSubagentSessions`.

Schneller Ablauf:

1. Mit `sessions_spawn` unter Verwendung von `thread: true` starten (und optional `mode: "session"`).
2. OpenClaw erstellt einen Thread oder bindet ihn an dieses Sitzungsziel im aktiven Kanal.
3. Antworten und Folge-Nachrichten in diesem Thread werden an die gebundene Sitzung geroutet.
4. Verwenden Sie `/session idle`, um automatische Entfokussierung bei Inaktivität zu prüfen/zu aktualisieren, und `/session max-age`, um das harte Limit zu steuern.
5. Verwenden Sie `/unfocus`, um die Bindung manuell zu lösen.

Manuelle Steuerung:

- `/focus <target>` bindet den aktuellen Thread (oder erstellt einen) an ein Ziel für Sub-Agent/Sitzung.
- `/unfocus` entfernt die Bindung für den aktuell gebundenen Thread.
- `/agents` listet aktive Läufe und den Bindungsstatus auf (`thread:<id>` oder `unbound`).
- `/session idle` und `/session max-age` funktionieren nur für fokussierte gebundene Threads.

Konfigurationsschalter:

- Globaler Standard: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Kanalüberschreibungen und Schlüssel für automatische Bindung beim Spawn sind adapterspezifisch. Siehe **Kanäle mit Thread-Unterstützung** oben.

Siehe [Configuration Reference](/de/gateway/configuration-reference) und [Slash commands](/de/tools/slash-commands) für aktuelle Adapterdetails.

Allowlist:

- `agents.list[].subagents.allowAgents`: Liste von Agenten-IDs, die über `agentId` als Ziel verwendet werden dürfen (`["*"]`, um alle zuzulassen). Standard: nur der anfragende Agent.
- `agents.defaults.subagents.allowAgents`: Standard-Allowlist für Ziel-Agenten, die verwendet wird, wenn der anfragende Agent keine eigene `subagents.allowAgents` setzt.
- Guard für Sandbox-Vererbung: Wenn die Sitzung des Anfragestellers sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: wenn `true`, blockieren sie `sessions_spawn`-Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl). Standard: `false`.

Discovery:

- Verwenden Sie `agents_list`, um zu sehen, welche Agenten-IDs derzeit für `sessions_spawn` erlaubt sind.

Automatisches Archivieren:

- Sitzungen von Sub-Agenten werden automatisch nach `agents.defaults.subagents.archiveAfterMinutes` archiviert (Standard: 60).
- Das Archiv verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (im selben Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (behält das Transkript weiterhin über Umbenennung).
- Automatisches Archivieren erfolgt best effort; ausstehende Timer gehen verloren, wenn das Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zum automatischen Archivieren bestehen.
- Automatisches Archivieren gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von der Archivbereinigung getrennt: Verfolgte Browser-Tabs/Prozesse werden best effort geschlossen, wenn der Lauf abgeschlossen ist, auch wenn der Datensatz für Transkript/Sitzung beibehalten wird.

## Verschachtelte Sub-Agenten

Standardmäßig können Sub-Agenten keine eigenen Sub-Agenten starten (`maxSpawnDepth: 1`). Sie können eine Ebene der Verschachtelung aktivieren, indem Sie `maxSpawnDepth: 2` setzen. Dadurch wird das **Orchestrator-Muster** ermöglicht: Haupt-Agent → Orchestrator-Sub-Agent → Worker-Sub-Sub-Agenten.

### Aktivieren

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // erlaubt Sub-Agenten, eigene Kinder zu starten (Standard: 1)
        maxChildrenPerAgent: 5, // maximale Anzahl aktiver Kinder pro Agenten-Sitzung (Standard: 5)
        maxConcurrent: 8, // globales Parallelitätslimit der Lane (Standard: 8)
        runTimeoutSeconds: 900, // Standard-Timeout für sessions_spawn, wenn weggelassen (0 = kein Timeout)
      },
    },
  },
}
```

### Tiefenstufen

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                         | Kann starten?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                   | Immer                         |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Niemals                       |

### Kette der Ankündigungen

Ergebnisse fließen die Kette nach oben zurück:

1. Worker auf Tiefe 2 beendet sich → kündigt seinem Elternteil (Orchestrator auf Tiefe 1) an
2. Orchestrator auf Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet sich → kündigt dem Haupt-Agenten an
3. Haupt-Agent empfängt die Ankündigung und liefert an den Benutzer aus

Jede Ebene sieht nur Ankündigungen ihrer direkten Kinder.

Betriebshinweise:

- Starten Sie Kinderarbeit einmal und warten Sie auf Ereignisse bei Abschluss, statt Poll-
  Schleifen um `sessions_list`, `sessions_history`, `/subagents list` oder
  `exec`-Sleep-Befehle zu bauen.
- `sessions_list` und `/subagents list` halten Beziehungen zwischen Kind-Sitzungen auf laufende Arbeit fokussiert:
  laufende Kinder bleiben angehängt, beendete Kinder bleiben für ein
  kurzes aktuelles Fenster sichtbar, und veraltete store-only-Kind-Links werden nach ihrem
  Frischefenster ignoriert. Das verhindert, dass alte Metadaten `spawnedBy` / `parentSessionKey`
  nach einem Neustart Geisterkinder wiederbeleben.
- Wenn ein Ereignis zum Abschluss eines Kindes eintrifft, nachdem Sie bereits die endgültige Antwort gesendet haben,
  ist das korrekte Follow-up das exakte stille Token `NO_REPLY` / `no_reply`.

### Tool-Richtlinie nach Tiefe

- Rollen- und Kontrollbereich werden beim Spawn in die Sitzungsmetadaten geschrieben. Dadurch wird verhindert, dass flache oder wiederhergestellte Sitzungsschlüssel versehentlich erneut Orchestrator-Rechte erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`)**: Erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit Kinder verwaltet werden können. Andere Session-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`)**: Keine Session-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker)**: Keine Session-Tools — `sessions_spawn` wird auf Tiefe 2 immer abgelehnt. Kann keine weiteren Kinder starten.

### Spawn-Limit pro Agent

Jede Agenten-Sitzung (in jeder Tiefe) kann höchstens `maxChildrenPerAgent` (Standard: 5) aktive Kinder gleichzeitig haben. Das verhindert unkontrolliertes Fan-out von einem einzelnen Orchestrator.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators auf Tiefe 1 stoppt automatisch alle seine Kinder auf Tiefe 2:

- `/stop` im Haupt-Chat stoppt alle Agenten auf Tiefe 1 und kaskadiert auf ihre Kinder auf Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert auf dessen Kinder.
- `/subagents kill all` stoppt alle Sub-Agenten für den Anfragesteller und kaskadiert.

## Authentifizierung

Die Authentifizierung von Sub-Agenten wird über die **Agenten-ID** aufgelöst, nicht über den Sitzungstyp:

- Der Sitzungsschlüssel des Sub-Agenten ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Speicher wird aus dem `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Haupt-Agenten werden als **Fallback** zusammengeführt; Agentenprofile überschreiben Hauptprofile bei Konflikten.

Hinweis: Das Zusammenführen ist additiv, daher sind Hauptprofile immer als Fallbacks verfügbar. Vollständig isolierte Auth pro Agent wird derzeit noch nicht unterstützt.

## Ankündigung

Sub-Agenten melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agenten-Sitzung (nicht in der Sitzung des Anfragestellers).
- Wenn der Sub-Agent genau `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistententext das exakte stille Token `NO_REPLY` / `no_reply` ist,
  wird die Ankündigungsausgabe unterdrückt, auch wenn es zuvor sichtbaren Fortschritt gab.
- Andernfalls hängt die Zustellung von der Tiefe des Anfragestellers ab:
  - Top-Level-Sitzungen des Anfragestellers verwenden einen Follow-up-`agent`-Aufruf mit externer Zustellung (`deliver=true`)
  - verschachtelte Sub-Agenten-Sitzungen des Anfragestellers erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Ergebnisse seiner Kinder in der Sitzung synthetisieren kann
  - wenn eine verschachtelte Sub-Agenten-Sitzung des Anfragestellers nicht mehr vorhanden ist, fällt OpenClaw nach Möglichkeit auf den Anfragesteller dieser Sitzung zurück
- Für Top-Level-Sitzungen des Anfragestellers löst die direkte Zustellung im Completion-Modus zuerst jede gebundene Unterhaltungs-/Thread-Route und jeden Hook-Override auf und füllt dann fehlende Felder für Kanalziel aus der gespeicherten Route der Sitzung des Anfragestellers auf. Dadurch bleiben Abschlüsse im richtigen Chat/Topic, selbst wenn der Abschlussursprung nur den Kanal identifiziert.
- Die Aggregation von Abschlüssen von Kindern ist beim Erstellen verschachtelter Ergebnisse auf den aktuellen Lauf des Anfragestellers beschränkt und verhindert, dass veraltete Ausgaben von Kindern aus früheren Läufen in die aktuelle Ankündigung einfließen.
- Ankündigungsantworten behalten Thread-/Topic-Routing bei, wenn es auf Kanal-Adaptern verfügbar ist.
- Ankündigungskontext wird in einen stabilen internen Ereignisblock normalisiert:
  - Quelle (`subagent` oder `cron`)
  - Kind-Sitzungsschlüssel/-ID
  - Typ der Ankündigung + Aufgabenbezeichnung
  - Statuszeile, abgeleitet aus dem Laufzeitergebnis (`success`, `error`, `timeout` oder `unknown`)
  - Ergebnisinhalt, ausgewählt aus dem neuesten sichtbaren Assistententext, andernfalls bereinigter neuester Text von Tool/ToolResult; terminal fehlgeschlagene Läufe melden den Fehlerstatus, ohne erfassten Antworttext erneut wiederzugeben
  - eine Follow-up-Anweisung, die beschreibt, wann geantwortet werden soll und wann still zu bleiben ist
- `Status` wird nicht aus der Modellausgabe abgeleitet; er stammt aus Signalen des Laufzeitergebnisses.
- Bei einem Timeout kann die Ankündigung, wenn das Kind nur Tool-Aufrufe geschafft hat, den Verlauf zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, statt rohe Tool-Ausgabe wiederzugeben.

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn sie umschlossen sind):

- Laufzeit (zum Beispiel `runtime 5m12s`)
- Token-Nutzung (Eingabe/Ausgabe/Gesamt)
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` und Transkriptpfad (damit der Haupt-Agent Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann)
- Interne Metadaten sind nur für die Orchestrierung gedacht; benutzerseitige Antworten sollten in normaler Assistentenstimme umgeschrieben werden.

`sessions_history` ist der sicherere Orchestrierungsweg:

- Recall des Assistenten wird zuerst normalisiert:
  - Thinking-Tags werden entfernt
  - Gerüstblöcke `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - einfache XML-Payload-Blöcke von Tool-Aufrufen als Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen werden
  - herabgestuftes Gerüst für Tool-Aufrufe/-Ergebnisse und Marker für historischen Kontext werden entfernt
  - durchgesickerte Modell-Steuertokens wie `<|assistant|>`, andere ASCII-
    Tokens `<|...|>` und Varianten in Vollbreite `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Call-XML wird entfernt
- textähnliche Anmeldedaten-/Token-Inhalte werden redigiert
- lange Blöcke können gekürzt werden
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- Prüfung des rohen On-Disk-Transkripts ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen

## Tool-Richtlinie (Sub-Agenten-Tools)

Standardmäßig erhalten Sub-Agenten **alle Tools außer Session-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht; es ist
kein roher Transcript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agenten auf Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre Kinder verwalten können.

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
        // wenn allow gesetzt ist, wird es zu allow-only (deny gewinnt weiterhin)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Parallelität

Sub-Agenten verwenden eine dedizierte In-Process-Queue-Lane:

- Lane-Name: `subagent`
- Parallelität: `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein Sub-Agent
noch lebt. Nicht beendete Läufe, die älter als das Fenster für veraltete Läufe sind, zählen nicht mehr
als aktiv/ausstehend in `/subagents list`, Statuszusammenfassungen, Completion-Gating für Nachkommen
und Prüfungen der Parallelität pro Sitzung.

Nach einem Gateway-Neustart werden veraltete nicht beendete wiederhergestellte Läufe bereinigt, sofern ihre
Kind-Sitzung nicht mit `abortedLastRun: true` markiert ist. Diese beim Neustart abgebrochenen Kind-Sitzungen bleiben über den Flow zur Wiederherstellung verwaister Sub-Agenten wiederherstellbar; dieser
sendet eine synthetische Resume-Nachricht, bevor der Abbruch-Marker gelöscht wird.

## Stoppen

- Das Senden von `/stop` im Chat des Anfragestellers bricht die Sitzung des Anfragestellers ab und stoppt alle aktiven, daraus gestarteten Sub-Agentenläufe, kaskadierend bis zu verschachtelten Kindern.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert auf dessen Kinder.

## Einschränkungen

- Die Ankündigung von Sub-Agenten erfolgt **best effort**. Wenn das Gateway neu startet, geht ausstehende Arbeit zum „Zurückankündigen“ verloren.
- Sub-Agenten teilen sich weiterhin dieselben Prozessressourcen des Gateways; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Kontext von Sub-Agenten injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth` Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Kinder pro Sitzung (Standard: 5, Bereich: 1–20).

## Verwandt

- [ACP agents](/de/tools/acp-agents)
- [Multi-agent sandbox tools](/de/tools/multi-agent-sandbox-tools)
- [Agent send](/de/tools/agent-send)
