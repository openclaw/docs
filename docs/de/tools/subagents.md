---
read_when:
    - Sie möchten Hintergrund-/Parallel-Arbeit über den Agenten.
    - Sie ändern die Richtlinie für das Tool `sessions_spawn` oder für Sub-Agents.
    - Sie implementieren oder beheben Probleme bei threadgebundenen Sub-Agent-Sitzungen.
summary: 'Sub-Agents: isolierte Agentenläufe starten, die Ergebnisse zurück an den anfragenden Chat melden'
title: Sub-Agents
x-i18n:
    generated_at: "2026-04-25T18:23:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70195000c4326baba38a9a096dc8d6db178f754f345ad05d122902ee1216ab1c
    source_path: tools/subagents.md
    workflow: 15
---

Sub-Agents sind Hintergrund-Agentenläufe, die aus einem bestehenden Agentenlauf heraus gestartet werden. Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und **kündigen** ihr Ergebnis nach Abschluss zurück im anfragenden Chat-Channel an. Jeder Sub-Agent-Lauf wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

## Slash-Befehl

Verwenden Sie `/subagents`, um Sub-Agent-Läufe für die **aktuelle Sitzung** zu prüfen oder zu steuern:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Steuerung für Thread-Bindung:

Diese Befehle funktionieren auf Channels, die persistente Thread-Bindungen unterstützen. Siehe **Channels mit Thread-Unterstützung** unten.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` zeigt Metadaten des Laufs an (Status, Zeitstempel, Sitzungs-ID, Transkriptpfad, Bereinigung).
Verwenden Sie `sessions_history` für eine begrenzte, sicherheitsgefilterte Rückrufansicht; prüfen Sie den
Transkriptpfad auf dem Datenträger, wenn Sie das rohe vollständige Transkript benötigen.

### Spawn-Verhalten

`/subagents spawn` startet einen Hintergrund-Sub-Agenten als Benutzerbefehl, nicht als internes Relay, und sendet bei Abschluss des Laufs genau ein abschließendes Status-Update zurück an den anfragenden Chat.

- Der Spawn-Befehl blockiert nicht; er gibt sofort eine Lauf-ID zurück.
- Nach Abschluss kündigt der Sub-Agent eine Zusammenfassungs-/Ergebnismeldung zurück im anfragenden Chat-Channel an.
- Die Abschlusszustellung ist push-basiert. Sobald der Sub-Agent gestartet wurde, pollen Sie nicht in einer Schleife mit `/subagents list`,
  `sessions_list` oder `sessions_history`, nur um auf den Abschluss zu
  warten; prüfen Sie den Status nur bei Bedarf zum Debuggen oder Eingreifen.
- Nach Abschluss schließt OpenClaw nach bestem Bemühen verfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Bereinigungsablauf für die Ankündigung fortgesetzt wird.
- Für manuelle Spawns ist die Zustellung robust:
  - OpenClaw versucht zuerst direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
  - Wenn die direkte Zustellung fehlschlägt, fällt es auf Queue-Routing zurück.
  - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Ankündigung vor dem endgültigen Aufgeben mit kurzem exponentiellem Backoff erneut versucht.
- Die Abschlusszustellung behält die aufgelöste Anfrage-Route bei:
  - thread-gebundene oder conversation-gebundene Abschlussrouten haben Vorrang, wenn verfügbar
  - wenn der Abschlussursprung nur einen Channel liefert, füllt OpenClaw Ziel/Konto aus der aufgelösten Route der anfragenden Sitzung (`lastChannel` / `lastTo` / `lastAccountId`) auf, damit direkte Zustellung weiterhin funktioniert
- Die Abschlussübergabe an die anfragende Sitzung ist zur Laufzeit generierter interner Kontext (kein vom Benutzer verfasster Text) und enthält:
  - `Result` (neuester sichtbarer `assistant`-Antworttext, andernfalls bereinigter neuester Text aus Tool/ToolResult; terminal fehlgeschlagene Läufe verwenden keinen erfassten Antworttext erneut)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakte Laufzeit-/Token-Statistiken
  - eine Zustellungsanweisung, die dem anfragenden Agenten sagt, in normaler Assistentenstimme umzuschreiben (keine rohen internen Metadaten weiterleiten)
- `--model` und `--thinking` überschreiben die Standardwerte für genau diesen Lauf.
- Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
- `/subagents spawn` ist der Einmalmodus (`mode: "run"`). Für persistente threadgebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
- Für ACP-Harness-Sitzungen (Codex, Claude Code, Gemini CLI) verwenden Sie `sessions_spawn` mit `runtime: "acp"` und siehe [ACP Agents](/de/tools/acp-agents), insbesondere das [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen.

Hauptziele:

- Arbeit wie „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optional Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungs-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

Hinweis zu Kosten: Jeder Sub-Agent hat standardmäßig seinen **eigenen** Kontext und eigenen Token-Verbrauch. Für schwere oder
wiederholte Aufgaben setzen Sie für Sub-Agents ein günstigeres Modell und belassen Sie Ihren Haupt-Agenten auf einem
hochwertigeren Modell. Sie können dies über `agents.defaults.subagents.model` oder per Agent-
Überschreibungen konfigurieren. Wenn ein Kind wirklich das aktuelle Transkript des Anfragenden benötigt, kann der Agent bei genau diesem Spawn
`context: "fork"` anfordern.

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich darum bittet, das
aktuelle Transkript zu forken.

| Modus      | Wann er verwendet werden sollte                                                                                                         | Verhalten                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext knapp beschrieben werden kann     | Erstellt ein sauberes Kind-Transkript. Dies ist der Standard und hält den Token-Verbrauch niedriger. |
| `fork`     | Arbeit, die vom aktuellen Gespräch, früheren Tool-Ergebnissen oder nuancierten Anweisungen im Transkript des Anfragenden abhängt       | Verzweigt das Transkript des Anfragenden in die Kind-Sitzung, bevor das Kind startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextabhängige Delegation gedacht, nicht als Ersatz
für einen klar formulierten Aufgaben-Prompt.

## Tool

Verwenden Sie `sessions_spawn`:

- Startet einen Sub-Agent-Lauf (`deliver: false`, globale Lane: `subagent`)
- Führt dann einen Ankündigungsschritt aus und postet die Ankündigungsantwort in den anfragenden Chat-Channel
- Standardmodell: erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder pro Agent `agents.list[].subagents.model`) setzen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- Standard-`thinking`: erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder pro Agent `agents.list[].subagents.thinking`) setzen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- Standard-Run-Timeout: Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, falls gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

Tool-Parameter:

- `task` (erforderlich)
- `label?` (optional)
- `agentId?` (optional; unter einer anderen Agent-ID starten, falls erlaubt)
- `model?` (optional; überschreibt das Sub-Agent-Modell; ungültige Werte werden übersprungen und der Sub-Agent läuft mit dem Standardmodell weiter, mit einer Warnung im Tool-Ergebnis)
- `thinking?` (optional; überschreibt das Thinking-Level für den Sub-Agent-Lauf)
- `runTimeoutSeconds?` (standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, falls gesetzt, sonst `0`; wenn gesetzt, wird der Sub-Agent-Lauf nach N Sekunden abgebrochen)
- `thread?` (Standard `false`; wenn `true`, fordert es eine Channel-Thread-Bindung für diese Sub-Agent-Sitzung an)
- `mode?` (`run|session`)
  - Standard ist `run`
  - wenn `thread: true` und `mode` ausgelassen wird, wird der Standard zu `session`
  - `mode: "session"` erfordert `thread: true`
- `cleanup?` (`delete|keep`, Standard `keep`)
- `sandbox?` (`inherit|require`, Standard `inherit`; `require` lehnt den Spawn ab, sofern die Ziel-Kindlaufzeit nicht sandboxed ist)
- `context?` (`isolated|fork`, Standard `isolated`; nur für native Sub-Agents)
  - `isolated` erstellt ein sauberes Kind-Transkript und ist der Standard.
  - `fork` verzweigt das aktuelle Transkript des Anfragenden in die Kind-Sitzung, sodass das Kind mit demselben Gesprächskontext startet.
  - Verwenden Sie `fork` nur, wenn das Kind das aktuelle Transkript benötigt. Für begrenzte Arbeit lassen Sie `context` weg.
- `sessions_spawn` akzeptiert **keine** Channel-Zustellungsparameter (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Für Zustellung verwenden Sie `message`/`sessions_send` aus dem gestarteten Lauf heraus.

## Threadgebundene Sitzungen

Wenn Thread-Bindungen für einen Channel aktiviert sind, kann ein Sub-Agent an einen Thread gebunden bleiben, sodass Folge-Nachrichten von Benutzern in diesem Thread weiterhin an dieselbe Sub-Agent-Sitzung geroutet werden.

### Channels mit Thread-Unterstützung

- Discord (derzeit der einzige unterstützte Channel): unterstützt persistente threadgebundene Sub-Agent-Sitzungen (`sessions_spawn` mit `thread: true`), manuelle Thread-Steuerung (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) und die Adapter-Keys `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` und `channels.discord.threadBindings.spawnSubagentSessions`.

Schneller Ablauf:

1. Starten Sie mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"`).
2. OpenClaw erstellt einen Thread oder bindet einen Thread an dieses Sitzungsziel im aktiven Channel.
3. Antworten und Folge-Nachrichten in diesem Thread werden an die gebundene Sitzung geroutet.
4. Verwenden Sie `/session idle`, um automatisches Entfokussieren bei Inaktivität zu prüfen/zu aktualisieren, und `/session max-age`, um die harte Obergrenze zu steuern.
5. Verwenden Sie `/unfocus`, um die Bindung manuell zu lösen.

Manuelle Steuerung:

- `/focus <target>` bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Sitzungsziel.
- `/unfocus` entfernt die Bindung für den aktuell gebundenen Thread.
- `/agents` listet aktive Läufe und den Bindungszustand auf (`thread:<id>` oder `unbound`).
- `/session idle` und `/session max-age` funktionieren nur für fokussierte gebundene Threads.

Konfigurationsschalter:

- Globaler Standard: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Channel-Override und Schlüssel für automatisches Spawn-Binding sind adapterspezifisch. Siehe **Channels mit Thread-Unterstützung** oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und [Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapter-Details.

Allowlist:

- `agents.list[].subagents.allowAgents`: Liste von Agent-IDs, die über `agentId` als Ziel verwendet werden können (`["*"]`, um beliebige zu erlauben). Standard: nur der anfragende Agent.
- `agents.defaults.subagents.allowAgents`: Standard-Allowlist für Ziel-Agenten, die verwendet wird, wenn der anfragende Agent nicht selbst `subagents.allowAgents` setzt.
- Vererbungs-Guard für Sandboxing: Wenn die anfragende Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: Wenn `true`, blockiert dies `sessions_spawn`-Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl). Standard: `false`.

Erkennung:

- Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für `sessions_spawn` erlaubt sind.

Automatische Archivierung:

- Sub-Agent-Sitzungen werden automatisch nach `agents.defaults.subagents.archiveAfterMinutes` archiviert (Standard: 60).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (im selben Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (behält das Transkript durch Umbenennung dennoch).
- Automatische Archivierung erfolgt nach bestem Bemühen; ausstehende Timer gehen verloren, wenn das Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Die Browser-Bereinigung ist von der Archiv-Bereinigung getrennt: Verfolgte Browser-Tabs/Prozesse werden nach bestem Bemühen geschlossen, wenn der Lauf endet, auch wenn Transkript/Sitzungsdatensatz erhalten bleiben.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents starten (`maxSpawnDepth: 1`). Sie können eine Ebene Verschachtelung aktivieren, indem Sie `maxSpawnDepth: 2` setzen; dadurch wird das **Orchestrator-Muster** ermöglicht: Haupt-Agent → Orchestrator-Sub-Agent → Worker-Sub-Sub-Agents.

### So aktivieren Sie es

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // Sub-Agents dürfen Kinder starten (Standard: 1)
        maxChildrenPerAgent: 5, // maximale Anzahl aktiver Kinder pro Agent-Sitzung (Standard: 5)
        maxConcurrent: 8, // globale Obergrenze für gleichzeitige Lanes (Standard: 8)
        runTimeoutSeconds: 900, // Standard-Timeout für sessions_spawn, wenn ausgelassen (0 = kein Timeout)
      },
    },
  },
}
```

### Tiefenebenen

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                        | Kann starten?                |
| ----- | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                  | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                  | Niemals                      |

### Ankündigungskette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 beendet sich → kündigt seinem Parent an (Orchestrator der Tiefe 1)
2. Orchestrator der Tiefe 1 erhält die Ankündigung, synthetisiert Ergebnisse, beendet sich → kündigt dem Haupt-Agenten an
3. Der Haupt-Agent erhält die Ankündigung und liefert an den Benutzer aus

Jede Ebene sieht nur Ankündigungen ihrer direkten Kinder.

Betriebshinweise:

- Starten Sie Kinderarbeit einmal und warten Sie auf Abschlussereignisse, statt Polling-
  Schleifen um `sessions_list`, `sessions_history`, `/subagents list` oder
  `exec`-Sleep-Befehle herumzubauen.
- `sessions_list` und `/subagents list` halten Beziehungen zu Kind-Sitzungen auf
  aktive Arbeit fokussiert: aktive Kinder bleiben angehängt, beendete Kinder bleiben
  für ein kurzes aktuelles Fenster sichtbar, und veraltete nur im Store vorhandene Kind-Links werden nach ihrem
  Frischefenster ignoriert. Das verhindert, dass alte Metadaten wie `spawnedBy` / `parentSessionKey`
  nach einem Neustart Geister-Kinder wiederauferstehen lassen.
- Wenn ein Abschlussereignis eines Kindes eintrifft, nachdem Sie bereits die finale Antwort gesendet haben,
  ist die korrekte Nachbereitung genau das stille Token `NO_REPLY` / `no_reply`.

### Tool-Richtlinie nach Tiefe

- Rolle und Steuerungsbereich werden beim Spawn in die Sitzungsmetadaten geschrieben. Dadurch erhalten flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich wieder Orchestrator-Berechtigungen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`)**: Erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Kinder verwalten kann. Andere Sitzungs-/System-Tools bleiben gesperrt.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`)**: Keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker)**: Keine Sitzungs-Tools — `sessions_spawn` ist in Tiefe 2 immer gesperrt. Kann keine weiteren Kinder starten.

### Spawn-Limit pro Agent

Jede Agent-Sitzung (in jeder Tiefe) kann höchstens `maxChildrenPerAgent` (Standard: 5) aktive Kinder gleichzeitig haben. Das verhindert unkontrolliertes Auffächern durch einen einzelnen Orchestrator.

### Kaskadenstopp

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Kinder der Tiefe 2:

- `/stop` im Haupt-Chat stoppt alle Agenten der Tiefe 1 und kaskadiert zu ihren Kindern der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Kindern.
- `/subagents kill all` stoppt alle Sub-Agents für den Anfragenden und kaskadiert.

## Authentifizierung

Sub-Agent-Authentifizierung wird nach **Agent-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sitzungsschlüssel des Sub-Agenten ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Haupt-Agenten werden als **Fallback** zusammengeführt; bei Konflikten überschreiben Agent-Profile die Haupt-Profile.

Hinweis: Das Zusammenführen ist additiv, daher sind Haupt-Profile immer als Fallback verfügbar. Vollständig isolierte Authentifizierung pro Agent wird derzeit noch nicht unterstützt.

## Ankündigung

Sub-Agents melden über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht in der Sitzung des Anfragenden).
- Wenn der Sub-Agent genau `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistententext genau das stille Token `NO_REPLY` / `no_reply` ist,
  wird die Ankündigungsausgabe unterdrückt, selbst wenn es zuvor sichtbaren Fortschritt gab.
- Andernfalls hängt die Zustellung von der Tiefe des Anfragenden ab:
  - Anfragende Sitzungen auf oberster Ebene verwenden einen nachgelagerten `agent`-Aufruf mit externer Zustellung (`deliver=true`)
  - verschachtelte anfragende Sub-Agent-Sitzungen erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Kind-Ergebnisse innerhalb der Sitzung synthetisieren kann
  - wenn eine verschachtelte anfragende Sub-Agent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw, wenn möglich, auf den Anfragenden dieser Sitzung zurück
- Für anfragende Sitzungen auf oberster Ebene löst die direkte Zustellung im Abschlussmodus zuerst jede gebundene Gesprächs-/Thread-Route und Hook-Überschreibung auf und ergänzt dann fehlende Channel-Zielfelder aus der gespeicherten Route der anfragenden Sitzung. Dadurch bleiben Abschlüsse im richtigen Chat/Topic, selbst wenn der Abschlussursprung nur den Channel identifiziert.
- Die Aggregation von Kind-Abschlüssen ist beim Erstellen verschachtelter Abschlussbefunde auf den aktuellen Lauf des Anfragenden beschränkt, wodurch verhindert wird, dass veraltete Kind-Ausgaben früherer Läufe in die aktuelle Ankündigung gelangen.
- Ankündigungsantworten behalten Thread-/Topic-Routing bei, wenn es auf Channel-Adaptern verfügbar ist.
- Der Ankündigungskontext wird in einen stabilen internen Ereignisblock normalisiert:
  - Quelle (`subagent` oder `cron`)
  - Kind-Sitzungsschlüssel/-ID
  - Ankündigungstyp + Aufgaben-Label
  - Statuszeile, abgeleitet aus dem Laufzeitergebnis (`success`, `error`, `timeout` oder `unknown`)
  - Ergebnisinhalt, ausgewählt aus dem neuesten sichtbaren Assistententext, andernfalls bereinigter neuester Text aus Tool/ToolResult; terminal fehlgeschlagene Läufe melden den Fehlerstatus, ohne erfassten Antworttext erneut abzuspielen
  - eine Follow-up-Anweisung, die beschreibt, wann geantwortet und wann still geblieben werden soll
- `Status` wird nicht aus der Modellausgabe abgeleitet; er kommt aus Signalen des Laufzeitergebnisses.
- Bei Timeout kann die Ankündigung, wenn das Kind nur Tool-Aufrufe geschafft hat, diesen Verlauf zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, statt rohe Tool-Ausgabe wiederzugeben.

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn sie umschlossen sind):

- Laufzeit (z. B. `runtime 5m12s`)
- Token-Nutzung (Input/Output/Gesamt)
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` und Transkriptpfad (damit der Haupt-Agent Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann)
- Interne Metadaten sind nur für die Orchestrierung gedacht; benutzerseitige Antworten sollten in normaler Assistentenstimme umgeschrieben werden.

`sessions_history` ist der sicherere Orchestrierungspfad:

- Der Recall von Assistenten wird zuerst normalisiert:
  - Thinking-Tags werden entfernt
  - Scaffold-Blöcke `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - XML-Payload-Blöcke für Tool-Aufrufe im Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen werden
  - herabgestuftes Scaffold für Tool-Aufrufe/-Ergebnisse und Marker für historischen Kontext werden entfernt
  - aus dem Modell ausgetretene Steuerungstokens wie `<|assistant|>`, andere ASCII-
    Tokens im Format `<|...|>` sowie Full-Width-Varianten `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Call-XML wird entfernt
- Text, der wie Zugangsdaten/Token aussieht, wird redigiert
- Lange Blöcke können abgeschnitten werden
- Sehr große Verläufe können ältere Zeilen fallen lassen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- Die Prüfung des rohen Transkripts auf dem Datenträger ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen

## Tool-Richtlinie (Sub-Agent-Tools)

Sub-Agents verwenden zuerst dieselbe Profil- und Tool-Richtlinien-Pipeline wie der Parent oder Ziel-
Agent. Danach wendet OpenClaw die Einschränkungsebene für Sub-Agents an.

Ohne restriktives `tools.profile` erhalten Sub-Agents **alle Tools außer Sitzungs-
Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht; es ist
kein Dump des rohen Transkripts.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agents der Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre Kinder verwalten können.

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

`tools.subagents.tools.allow` ist ein finaler Filter nach dem Prinzip allow-only. Er kann die
bereits aufgelöste Tool-Menge einschränken, aber kein Tool zurückbringen, das durch
`tools.profile` entfernt wurde. Zum Beispiel enthält `tools.profile: "coding"`
`web_search`/`web_fetch`, aber nicht das Tool `browser`. Damit Sub-Agents mit Coding-Profil
Browser-Automatisierung verwenden können, fügen Sie `browser` in der Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie pro Agent `agents.list[].tools.alsoAllow: ["browser"]`, wenn nur ein Agent
Browser-Automatisierung erhalten soll.

## Nebenläufigkeit

Sub-Agents verwenden eine dedizierte In-Process-Queue-Lane:

- Name der Lane: `subagent`
- Nebenläufigkeit: `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Lebendigkeit und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein Sub-Agent
noch lebt. Nicht beendete Läufe, die älter als das Fenster für veraltete Läufe sind, zählen nicht mehr
als aktiv/ausstehend in `/subagents list`, Statuszusammenfassungen, Gates für den Abschluss von Nachfahren
und Prüfungen der Nebenläufigkeit pro Sitzung.

Nach einem Gateway-Neustart werden veraltete wiederhergestellte Läufe ohne Ende bereinigt, sofern ihre
Kind-Sitzung nicht mit `abortedLastRun: true` markiert ist. Diese durch Neustart abgebrochenen Kind-Sitzungen
bleiben über den Wiederherstellungsablauf für verwaiste Sub-Agents wiederherstellbar, der eine synthetische Resume-Nachricht sendet, bevor der abgebrochene Marker gelöscht wird.

## Stoppen

- Das Senden von `/stop` im anfragenden Chat bricht die anfragende Sitzung ab und stoppt alle aktiven von ihr gestarteten Sub-Agent-Läufe, einschließlich Kaskade zu verschachtelten Kindern.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Kindern.

## Einschränkungen

- Die Ankündigung von Sub-Agents erfolgt **nach bestem Bemühen**. Wenn das Gateway neu startet, geht ausstehende Arbeit zum „Zurückankündigen“ verloren.
- Sub-Agents teilen sich weiterhin dieselben Prozessressourcen des Gateways; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` blockiert niemals: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Sub-Agent-Kontext injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Kinder pro Sitzung (Standard: 5, Bereich: 1–20).

## Verwandt

- [ACP Agents](/de/tools/acp-agents)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [Agent send](/de/tools/agent-send)
