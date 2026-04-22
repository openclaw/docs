---
read_when:
    - Du möchtest Hintergrund-/Parallel-Arbeit über den Agent ausführen
    - Du änderst `sessions_spawn` oder die Tool-Richtlinie für Sub-Agents
    - Du implementierst oder behebst threadgebundene Sub-Agent-Sitzungen
summary: 'Sub-Agents: isolierte Agent-Läufe starten, die Ergebnisse zurück in den anfragenden Chat melden'
title: Sub-Agents
x-i18n:
    generated_at: "2026-04-22T04:28:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-Agents

Sub-Agents sind Hintergrund-Agent-Läufe, die aus einem bestehenden Agent-Lauf heraus gestartet werden. Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und **melden** ihr Ergebnis nach Abschluss zurück in den Chatkanal des Anfragenden. Jeder Sub-Agent-Lauf wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

## Slash-Befehl

Verwende `/subagents`, um Sub-Agent-Läufe für die **aktuelle Sitzung** zu prüfen oder zu steuern:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Steuerung der Thread-Bindung:

Diese Befehle funktionieren in Kanälen, die persistente Thread-Bindings unterstützen. Siehe **Kanäle mit Thread-Unterstützung** unten.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` zeigt Laufzeitmetadaten an (Status, Zeitstempel, Sitzungs-ID, Transkriptpfad, Cleanup).
Verwende `sessions_history` für eine begrenzte, sicherheitsgefilterte Erinnerungsansicht; prüfe den
Transkriptpfad auf der Festplatte, wenn du das rohe vollständige Transkript benötigst.

### Verhalten beim Spawn

`/subagents spawn` startet einen Hintergrund-Sub-Agent als Benutzerbefehl, nicht als interne Weiterleitung, und sendet bei Abschluss des Laufs ein finales Abschluss-Update zurück an den Chat des Anfragenden.

- Der Spawn-Befehl blockiert nicht; er gibt sofort eine Lauf-ID zurück.
- Nach Abschluss meldet der Sub-Agent eine Zusammenfassungs-/Ergebnisnachricht zurück in den Chatkanal des Anfragenden.
- Die Abschlusszustellung ist Push-basiert. Wenn der Spawn erfolgt ist, frage nicht in einer Schleife `/subagents list`,
  `sessions_list` oder `sessions_history` ab, nur um auf den Abschluss zu
  warten; prüfe den Status nur bei Bedarf für Debugging oder Eingriffe.
- Nach Abschluss schließt OpenClaw nach Best Effort verfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Cleanup-Ablauf der Meldung fortgesetzt wird.
- Bei manuellen Spawns ist die Zustellung robust:
  - OpenClaw versucht zuerst direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
  - Wenn direkte Zustellung fehlschlägt, fällt es auf Queue-Routing zurück.
  - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Meldung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
- Die Abschlusszustellung behält die aufgelöste Route des Anfragenden bei:
  - threadgebundene oder konversationsgebundene Abschlussrouten gewinnen, wenn verfügbar
  - wenn der Ursprung des Abschlusses nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Sitzung des Anfragenden (`lastChannel` / `lastTo` / `lastAccountId`), damit direkte Zustellung weiterhin funktioniert
- Die Übergabe des Abschlusses an die Sitzung des Anfragenden ist intern zur Laufzeit generierter Kontext (kein vom Benutzer verfasster Text) und enthält:
  - `Result` (neuester sichtbarer `assistant`-Antworttext, andernfalls bereinigter neuester Text aus tool/toolResult; terminal fehlgeschlagene Läufe verwenden keinen erfassten Antworttext erneut)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakte Laufzeit-/Token-Statistiken
  - eine Zustellungsanweisung, die dem Agent des Anfragenden sagt, in normaler Assistentenstimme umzuschreiben (keine rohen internen Metadaten weiterleiten)
- `--model` und `--thinking` überschreiben die Standards für diesen spezifischen Lauf.
- Verwende `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
- `/subagents spawn` ist ein Einmalmodus (`mode: "run"`). Für persistente threadgebundene Sitzungen verwende `sessions_spawn` mit `thread: true` und `mode: "session"`.
- Für ACP-Harness-Sitzungen (Codex, Claude Code, Gemini CLI) verwende `sessions_spawn` mit `runtime: "acp"` und siehe [ACP Agents](/de/tools/acp-agents), insbesondere das [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn du Abschlüsse oder Agent-zu-Agent-Schleifen debuggst.

Primäre Ziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionale Sandbox).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungstools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

Hinweis zu Kosten: Jeder Sub-Agent hat seinen **eigenen** Kontext und Token-Verbrauch. Für schwere oder wiederholte
Aufgaben setze ein günstigeres Modell für Sub-Agents und lasse deinen Haupt-Agent auf einem qualitativ hochwertigeren Modell laufen.
Du kannst dies über `agents.defaults.subagents.model` oder Überschreibungen pro Agent konfigurieren.

## Tool

Verwende `sessions_spawn`:

- Startet einen Sub-Agent-Lauf (`deliver: false`, globale Lane: `subagent`)
- Führt dann einen Meldeschritt aus und postet die Meldungsantwort in den Chatkanal des Anfragenden
- Standardmodell: erbt vom Aufrufer, außer du setzt `agents.defaults.subagents.model` (oder pro Agent `agents.list[].subagents.model`); ein explizites `sessions_spawn.model` gewinnt weiterhin.
- Standard-Thinking: erbt vom Aufrufer, außer du setzt `agents.defaults.subagents.thinking` (oder pro Agent `agents.list[].subagents.thinking`); ein explizites `sessions_spawn.thinking` gewinnt weiterhin.
- Standard-Run-Timeout: Wenn `sessions_spawn.runTimeoutSeconds` weggelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

Tool-Parameter:

- `task` (erforderlich)
- `label?` (optional)
- `agentId?` (optional; unter einer anderen Agent-ID spawnen, wenn erlaubt)
- `model?` (optional; überschreibt das Sub-Agent-Modell; ungültige Werte werden übersprungen und der Sub-Agent läuft mit dem Standardmodell, mit einer Warnung im Tool-Ergebnis)
- `thinking?` (optional; überschreibt das Thinking-Level für den Sub-Agent-Lauf)
- `runTimeoutSeconds?` (standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`; wenn gesetzt, wird der Sub-Agent-Lauf nach N Sekunden abgebrochen)
- `thread?` (Standard `false`; wenn `true`, wird Thread-Binding für diese Sub-Agent-Sitzung angefordert)
- `mode?` (`run|session`)
  - Standard ist `run`
  - wenn `thread: true` und `mode` weggelassen wird, wird standardmäßig `session` verwendet
  - `mode: "session"` erfordert `thread: true`
- `cleanup?` (`delete|keep`, Standard `keep`)
- `sandbox?` (`inherit|require`, Standard `inherit`; `require` lehnt den Spawn ab, wenn die Ziel-Child-Laufzeit nicht sandboxed ist)
- `sessions_spawn` akzeptiert **keine** Parameter für Kanalzustellung (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Für Zustellung verwende `message`/`sessions_send` aus dem gestarteten Lauf.

## Threadgebundene Sitzungen

Wenn Thread-Bindings für einen Kanal aktiviert sind, kann ein Sub-Agent an einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiterhin an dieselbe Sub-Agent-Sitzung geroutet werden.

### Kanäle mit Thread-Unterstützung

- Discord (derzeit der einzige unterstützte Kanal): unterstützt persistente threadgebundene Sub-Agent-Sitzungen (`sessions_spawn` mit `thread: true`), manuelle Thread-Steuerung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) und Adapter-Schlüssel `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` und `channels.discord.threadBindings.spawnSubagentSessions`.

Schnellablauf:

1. Mit `sessions_spawn` unter Verwendung von `thread: true` spawnen (und optional `mode: "session"`).
2. OpenClaw erstellt oder bindet einen Thread an dieses Sitzungsziel im aktiven Kanal.
3. Antworten und Folgebenachrichten in diesem Thread werden an die gebundene Sitzung geroutet.
4. Verwende `/session idle`, um das automatische Entfokussieren bei Inaktivität zu prüfen/aktualisieren, und `/session max-age`, um die harte Obergrenze zu steuern.
5. Verwende `/unfocus`, um die Bindung manuell zu lösen.

Manuelle Steuerung:

- `/focus <target>` bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Sitzungsziel.
- `/unfocus` entfernt das Binding für den aktuell gebundenen Thread.
- `/agents` listet aktive Läufe und den Binding-Status auf (`thread:<id>` oder `unbound`).
- `/session idle` und `/session max-age` funktionieren nur für fokussierte gebundene Threads.

Konfigurationsschalter:

- Globaler Standard: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Kanalüberschreibungen und Auto-Bind-Schlüssel beim Spawn sind adapterspezifisch. Siehe **Kanäle mit Thread-Unterstützung** oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und [Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

Allowlist:

- `agents.list[].subagents.allowAgents`: Liste von Agent-IDs, die über `agentId` als Ziel verwendet werden dürfen (`["*"]`, um alle zuzulassen). Standard: nur der Agent des Anfragenden.
- `agents.defaults.subagents.allowAgents`: Standard-Allowlist für Ziel-Agents, die verwendet wird, wenn der Agent des Anfragenden kein eigenes `subagents.allowAgents` setzt.
- Sandbox-Vererbungs-Guard: Wenn die Sitzung des Anfragenden sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: wenn true, blockiert `sessions_spawn` Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl). Standard: false.

Discovery:

- Verwende `agents_list`, um zu sehen, welche Agent-IDs derzeit für `sessions_spawn` erlaubt sind.

Auto-Archivierung:

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard: 60).
- Für das Archiv wird `sessions.delete` verwendet und das Transkript in `*.deleted.<timestamp>` umbenannt (im selben Ordner).
- `cleanup: "delete"` archiviert sofort nach der Meldung (behält das Transkript weiterhin per Umbenennung).
- Auto-Archivierung erfolgt nach Best Effort; ausstehende Timer gehen verloren, wenn das Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur Auto-Archivierung bestehen.
- Auto-Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und 2.
- Browser-Cleanup ist getrennt vom Archiv-Cleanup: verfolgte Browser-Tabs/Prozesse werden nach Best Effort geschlossen, wenn der Lauf endet, selbst wenn das Transkript/der Sitzungseintrag erhalten bleibt.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents starten (`maxSpawnDepth: 1`). Du kannst eine Verschachtelungsebene aktivieren, indem du `maxSpawnDepth: 2` setzt. Das erlaubt das **Orchestrator-Muster**: main → Orchestrator-Sub-Agent → Worker-Sub-Sub-Agents.

### Aktivierung

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // Sub-Agents erlauben, Children zu starten (Standard: 1)
        maxChildrenPerAgent: 5, // max. aktive Children pro Agent-Sitzung (Standard: 5)
        maxConcurrent: 8, // globale Obergrenze für gleichzeitige Lanes (Standard: 8)
        runTimeoutSeconds: 900, // Standard-Timeout für sessions_spawn, wenn weggelassen (0 = kein Timeout)
      },
    },
  },
}
```

### Tiefenebenen

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                         | Kann spawnen?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                   | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf Worker)                   | Niemals                      |

### Meldungskette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 beendet → meldet an seinen Parent (Orchestrator der Tiefe 1)
2. Orchestrator der Tiefe 1 erhält die Meldung, synthetisiert Ergebnisse, beendet → meldet an main
3. Haupt-Agent erhält die Meldung und liefert an den Benutzer aus

Jede Ebene sieht nur Meldungen ihrer direkten Children.

Betriebshinweise:

- Starte Child-Arbeit einmal und warte auf Abschlussereignisse, statt Poll-Schleifen
  um `sessions_list`, `sessions_history`, `/subagents list` oder
  `exec`-Sleep-Befehle zu bauen.
- Wenn ein Child-Abschlussereignis eintrifft, nachdem du bereits die endgültige Antwort gesendet hast,
  ist die korrekte Folgeaktion das exakte stille Token `NO_REPLY` / `no_reply`.

### Tool-Richtlinie nach Tiefe

- Rolle und Kontrollbereich werden beim Spawn in die Sitzungsmetadaten geschrieben. Dadurch wird verhindert, dass flache oder wiederhergestellte Sitzungsschlüssel versehentlich erneut Orchestrator-Berechtigungen erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`)**: Erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Children verwalten kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`)**: Keine Sitzungstools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf Worker)**: Keine Sitzungstools — `sessions_spawn` wird auf Tiefe 2 immer verweigert. Kann keine weiteren Children starten.

### Spawn-Limit pro Agent

Jede Agent-Sitzung (auf jeder Tiefe) kann höchstens `maxChildrenPerAgent` (Standard: 5) aktive Children gleichzeitig haben. Das verhindert unkontrolliertes Fan-out von einem einzelnen Orchestrator aus.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Children der Tiefe 2:

- `/stop` im Haupt-Chat stoppt alle Agents der Tiefe 1 und kaskadiert zu ihren Children der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen Children.
- `/subagents kill all` stoppt alle Sub-Agents für den Anfragenden und kaskadiert.

## Authentifizierung

Sub-Agent-Auth wird über die **Agent-ID**, nicht über den Sitzungstyp, aufgelöst:

- Der Sitzungsschlüssel des Sub-Agents ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agents geladen.
- Die Auth-Profile des Haupt-Agents werden als **Fallback** zusammengeführt; bei Konflikten überschreiben Agent-Profile die Profile des Haupt-Agents.

Hinweis: Die Zusammenführung ist additiv, daher sind die Profile des Haupt-Agents immer als Fallback verfügbar. Vollständig isolierte Auth pro Agent wird derzeit noch nicht unterstützt.

## Meldung

Sub-Agents melden über einen Meldungsschritt zurück:

- Der Meldungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht in der Sitzung des Anfragenden).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistententext exakt das stille Token `NO_REPLY` / `no_reply` ist,
  wird die Meldungsausgabe unterdrückt, selbst wenn es zuvor sichtbaren Fortschritt gab.
- Andernfalls hängt die Zustellung von der Tiefe des Anfragenden ab:
  - Top-Level-Sitzungen von Anfragenden verwenden einen nachgelagerten `agent`-Aufruf mit externer Zustellung (`deliver=true`)
  - verschachtelte Sub-Agent-Sitzungen von Anfragenden erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Ergebnisse der Children in der Sitzung synthetisieren kann
  - wenn eine verschachtelte Sub-Agent-Sitzung des Anfragenden nicht mehr existiert, fällt OpenClaw, wenn verfügbar, auf den Anfragenden dieser Sitzung zurück
- Für Top-Level-Sitzungen von Anfragenden löst die direkte Zustellung im Abschlussmodus zunächst jede gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und ergänzt dann fehlende Kanal-Zielfelder aus der gespeicherten Route der Sitzung des Anfragenden. Dadurch bleiben Abschlüsse im richtigen Chat/Topic, auch wenn der Ursprung des Abschlusses nur den Kanal identifiziert.
- Die Aggregation von Child-Abschlüssen ist beim Erstellen verschachtelter Abschlussbefunde auf den aktuellen Lauf des Anfragenden begrenzt, sodass veraltete Child-Ausgaben aus früheren Läufen nicht in die aktuelle Meldung hineinlecken.
- Meldungsantworten bewahren Thread-/Topic-Routing, wenn dies in Kanal-Adaptern verfügbar ist.
- Meldungskontext wird auf einen stabilen internen Ereignisblock normalisiert:
  - Quelle (`subagent` oder `cron`)
  - Child-Sitzungsschlüssel/-ID
  - Meldungstyp + Aufgabenlabel
  - Statuszeile, abgeleitet aus Laufzeitergebnis (`success`, `error`, `timeout` oder `unknown`)
  - Ergebnisinhalt, ausgewählt aus dem neuesten sichtbaren Assistententext, andernfalls bereinigter neuester Text aus tool/toolResult; terminal fehlgeschlagene Läufe melden einen Fehlerstatus, ohne erfassten Antworttext erneut abzuspielen
  - eine Follow-up-Anweisung, die beschreibt, wann geantwortet werden soll und wann still geblieben werden soll
- `Status` wird nicht aus der Modellausgabe abgeleitet; er stammt aus Laufzeitsignalen zum Ergebnis.
- Bei Timeout kann die Meldung, wenn das Child nur bis zu Tool-Aufrufen gekommen ist, diese Historie zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, statt rohe Tool-Ausgabe erneut abzuspielen.

Meldungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn sie umschlossen sind):

- Laufzeit (z. B. `runtime 5m12s`)
- Token-Nutzung (Eingabe/Ausgabe/Gesamt)
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` und Transkriptpfad (damit der Haupt-Agent den Verlauf über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann)
- Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten sollten in normaler Assistentenstimme umgeschrieben werden.

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistenten-Recall wird zuerst normalisiert:
  - Thinking-Tags werden entfernt
  - Gerüstblöcke `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - XML-Payload-Blöcke für Tool-Aufrufe im Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich
    abgeschnittener Payloads, die nie sauber geschlossen wurden
  - herabgestuftes Tool-Call-/Ergebnis-Gerüst und Marker für historischen Kontext werden entfernt
  - durchgesickerte Modell-Kontrolltokens wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Tokens und Vollbreitenvarianten `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Call-XML wird entfernt
- Text, der Anmeldedaten/Token ähnelt, wird redigiert
- lange Blöcke können gekürzt werden
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- die Prüfung des rohen On-Disk-Transkripts ist der Fallback, wenn du das vollständige bytegenaue Transkript benötigst

## Tool-Richtlinie (Sub-Agent-Tools)

Standardmäßig erhalten Sub-Agents **alle Tools außer Sitzungstools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Erinnerungsansicht; es ist
kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Sub-Agent-Orchestratoren der Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre Children verwalten können.

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
        // deny hat Vorrang
        deny: ["gateway", "cron"],
        // wenn allow gesetzt ist, wird es zu einer reinen Allowlist (deny hat weiterhin Vorrang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Parallelität

Sub-Agents verwenden eine dedizierte In-Process-Queue-Lane:

- Lane-Name: `subagent`
- Parallelität: `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Stoppen

- Das Senden von `/stop` im Chat des Anfragenden bricht die Sitzung des Anfragenden ab und stoppt alle aktiven Sub-Agent-Läufe, die daraus gestartet wurden, mit Kaskadierung zu verschachtelten Children.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen Children.

## Einschränkungen

- Die Meldung von Sub-Agents erfolgt nach dem Prinzip **best effort**. Wenn das Gateway neu startet, geht ausstehende „zurückmelden“-Arbeit verloren.
- Sub-Agents teilen sich weiterhin dieselben Ressourcen des Gateway-Prozesses; behandle `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` blockiert nie: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Kontext von Sub-Agents injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Children pro Sitzung (Standard: 5, Bereich: 1–20).
