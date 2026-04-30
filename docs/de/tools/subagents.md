---
read_when:
    - Sie möchten Hintergrundarbeit oder parallele Arbeit über den Agenten durchführen
    - Sie ändern sessions_spawn oder die Sub-Agent-Tool-Richtlinie
    - Sie implementieren Thread-gebundene Subagent-Sitzungen oder beheben Probleme damit
sidebarTitle: Sub-agents
summary: Starten Sie isolierte Agent-Ausführungen im Hintergrund, die die Ergebnisse an den Chat der anfragenden Person zurückmelden
title: Sub-Agenten
x-i18n:
    generated_at: "2026-04-30T16:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agents sind im Hintergrund laufende Agent-Ausführungen, die aus einer vorhandenen Agent-Ausführung gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**melden** nach Abschluss ihr Ergebnis zurück an den anfragenden Chat-
Kanal. Jede Sub-Agent-Ausführung wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Primäre Ziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne die Hauptausführung zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungstools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext
und Token-Verbrauch. Legen Sie für aufwendige oder wiederkehrende Aufgaben
ein günstigeres Modell für Sub-Agents fest und behalten Sie für Ihren
Haupt-Agent ein hochwertigeres Modell bei. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder agentenspezifische Überschreibungen. Wenn ein Child
wirklich das aktuelle Transkript des Anfragenden benötigt, kann der Agent
für genau diesen einen Start `context: "fork"` anfordern.
</Note>

## Slash-Befehl

Verwenden Sie `/subagents`, um Sub-Agent-Ausführungen für die **aktuelle
Sitzung** zu prüfen oder zu steuern:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` zeigt Ausführungsmetadaten an (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Rückrufansicht; prüfen Sie den Transkriptpfad auf dem Datenträger,
wenn Sie das rohe vollständige Transkript benötigen.

### Steuerelemente für Thread-Bindung

Diese Befehle funktionieren in Kanälen, die persistente Thread-Bindungen unterstützen.
Siehe [Thread-unterstützende Kanäle](#thread-supporting-channels) unten.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Startverhalten

`/subagents spawn` startet einen Hintergrund-Sub-Agent als Benutzerbefehl (nicht als
internes Relay) und sendet eine abschließende Abschlussmeldung zurück an den
anfragenden Chat, wenn die Ausführung beendet ist.

<AccordionGroup>
  <Accordion title="Nicht blockierender, pushbasierter Abschluss">
    - Der Startbefehl ist nicht blockierend; er gibt sofort eine Ausführungs-ID zurück.
    - Nach Abschluss meldet der Sub-Agent eine Zusammenfassung/Ergebnismeldung zurück an den anfragenden Chat-Kanal.
    - Der Abschluss ist pushbasiert. Fragen Sie nach dem Start **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife ab, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zum Debugging oder Eingreifen.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand die verfolgten Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Ablauf zur Bereinigungsmeldung fortgesetzt wird.

  </Accordion>
  <Accordion title="Zuverlässigkeit der manuellen Startzustellung">
    - OpenClaw versucht zuerst die direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
    - Wenn die direkte Zustellung fehlschlägt, fällt es auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Meldung vor dem endgültigen Aufgeben mit kurzem exponentiellem Backoff erneut versucht.
    - Die Abschlusszustellung behält die aufgelöste Route des Anfragenden bei: Thread-gebundene oder Konversations-gebundene Abschlussrouten gewinnen, wenn verfügbar; wenn der Abschlussursprung nur einen Kanal bereitstellt, füllt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der anfragenden Sitzung (`lastChannel` / `lastTo` / `lastAccountId`) aus, sodass die direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Abschlussübergabe">
    Die Abschlussübergabe an die anfragende Sitzung ist zur Laufzeit erzeugter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — den neuesten sichtbaren `assistant`-Antworttext, andernfalls den bereinigten neuesten Tool-/toolResult-Text. Terminal fehlgeschlagene Ausführungen verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellanweisung, die dem anfragenden Agent sagt, in normaler Assistant-Stimme umzuschreiben (nicht rohe interne Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben Standardwerte für diese bestimmte Ausführung.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist der Einmalmodus (`mode: "run"`). Für persistente Thread-gebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit bewirbt. Siehe [ACP-Zustellmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anfragende nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen Eintrag `agents.list[]` mit `runtime.type="acp"`; verwenden Sie die Standard-Sub-Agent-Laufzeit für normale OpenClaw-Konfigurations-Agents aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich anfordert,
das aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden sollten                                                                                                        | Verhalten                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext gebrieft werden kann             | Erstellt ein sauberes Child-Transkript. Dies ist der Standard und hält den Token-Verbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder nuancierten Anweisungen abhängt, die bereits im Transkript des Anfragenden vorhanden sind | Verzweigt das Transkript des Anfragenden in die Child-Sitzung, bevor das Child startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht, nicht als
Ersatz für das Schreiben einer klaren Aufgabenaufforderung.

## Tool: `sessions_spawn`

Startet eine Sub-Agent-Ausführung mit `deliver: false` auf der globalen `subagent`-Lane,
führt dann einen Meldeschritt aus und postet die Meldeantwort an den anfragenden
Chat-Kanal.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab. Die Profile `coding` und
`full` stellen `sessions_spawn` standardmäßig bereit. Das Profil `messaging`
tut dies nicht; fügen Sie `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agents, die Arbeit
delegieren sollen. Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische Allow-/Deny-Richtlinien können
das Tool nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` gewinnt weiterhin.
- **Thinking:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` gewinnt weiterhin.
- **Ausführungs-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

### Tool-Parameter

<ParamField path="task" type="string" required>
  Die Aufgabenbeschreibung für den Sub-Agent.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agent-ID starten, wenn durch `subagents.allowAgents` erlaubt.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge gedacht, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Nimmt eine vorhandene ACP-Harness-Sitzung wieder auf, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Starts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe der ACP-Ausführung an die Parent-Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Starts auslassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Sub-Agent-Modell. Ungültige Werte werden übersprungen und der Sub-Agent läuft mit dem Standardmodell mit einer Warnung im Tool-Ergebnis.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt die Thinking-Stufe für die Sub-Agent-Ausführung.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird die Sub-Agent-Ausführung nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird die Kanal-Thread-Bindung für diese Sub-Agent-Sitzung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` und `mode` ausgelassen wird, wird der Standardwert zu `session`. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert unmittelbar nach der Meldung (behält das Transkript dennoch über Umbenennung bei).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weist den Start zurück, sofern die Ziel-Child-Laufzeit nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anfragenden in die Child-Sitzung. Nur native Sub-Agents. Verwenden Sie `fork` nur, wenn das Child das aktuelle Transkript benötigt.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Kanalzustellungsparameter (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die Zustellung
`message`/`sessions_send` aus der gestarteten Ausführung.
</Warning>

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an
einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiterhin an
dieselbe Sub-Agent-Sitzung geroutet werden.

### Thread-unterstützende Kanäle

**Discord** ist derzeit der einzige unterstützte Kanal. Er unterstützt
persistente Thread-gebundene Subagent-Sitzungen (`sessions_spawn` mit
`thread: true`), manuelle Thread-Steuerungen (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) sowie Adapter-Schlüssel
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` und
`channels.discord.threadBindings.spawnSubagentSessions`.

### Schnellablauf

<Steps>
  <Step title="Starten">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt oder bindet einen Thread an dieses Sitzungsziel im aktiven Kanal.
  </Step>
  <Step title="Folgenachrichten routen">
    Antworten und Folgenachrichten in diesem Thread werden an die gebundene Sitzung geroutet.
  </Step>
  <Step title="Timeouts prüfen">
    Verwenden Sie `/session idle`, um das automatische Entfernen des Fokus bei Inaktivität zu prüfen/aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerungen

| Befehl            | Wirkung                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread (oder erstellt einen) an ein Unteragent-/Sitzungsziel |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                       |
| `/agents`          | Listet aktive Ausführungen und den Bindungsstatus auf (`thread:<id>` oder `unbound`)       |
| `/session idle`    | Prüft/aktualisiert automatische Entfokussierung bei Inaktivität (nur fokussierte gebundene Threads)         |
| `/session max-age` | Prüft/aktualisiert die harte Obergrenze (nur fokussierte gebundene Threads)                  |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanalspezifische Überschreibung und Schlüssel für automatische Bindung beim Spawnen** sind adapterabhängig. Siehe [Thread-unterstützende Kanäle](#thread-supporting-channels) oben.

Aktuelle Adapterdetails finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference) und den
[Slash-Befehlen](/de/tools/slash-commands).

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste von Agenten-IDs, die über explizites `agentId` adressiert werden können (`["*"]` erlaubt beliebige). Standard: nur der anfordernde Agent. Wenn Sie eine Liste festlegen und trotzdem möchten, dass der Requester sich selbst mit `agentId` spawnen kann, nehmen Sie die Requester-ID in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist für Zielagenten, die verwendet wird, wenn der anfordernde Agent keine eigene `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` auslassen (erzwingt explizite Profilauswahl). Überschreibung pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die Requester-Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox laufen würden.

### Discovery

Verwenden Sie `agents_list`, um zu sehen, welche Agenten-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive Modell
jedes aufgeführten Agenten und eingebettete Laufzeitmetadaten, damit Aufrufer Pi, Codex-App-Server
und andere konfigurierte native Laufzeiten unterscheiden können.

### Automatische Archivierung

- Unteragent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard `60`).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (gleicher Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (behält das Transkript trotzdem durch Umbenennen).
- Die automatische Archivierung erfolgt nach bestem Bemühen; ausstehende Timer gehen verloren, wenn der Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur die Ausführung. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Bemühen geschlossen, wenn die Ausführung endet, auch wenn der Transkript-/Sitzungsdatensatz beibehalten wird.

## Verschachtelte Unteragenten

Standardmäßig können Unteragenten keine eigenen Unteragenten spawnen
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene
der Verschachtelung zu aktivieren — das **Orchestrator-Muster**: Hauptagent → Orchestrator-Unteragent →
Worker-Unterunteragenten.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Tiefenebenen

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                         | Kann spawnen?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Hauptagent                                    | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Unteragent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Unterunteragent (Leaf-Worker)                 | Nie                          |

### Ankündigungskette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 endet → kündigt an seinen Parent an (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet → kündigt an den Hauptagenten an.
3. Hauptagent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten Kinder.

<Note>
**Betriebliche Anleitung:** Starten Sie Kindarbeit einmal und warten Sie auf Abschlussereignisse,
anstatt Polling-Schleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten Kind-Sitzungsbeziehungen
auf Live-Arbeit fokussiert — Live-Kinder bleiben angehängt, beendete Kinder bleiben
für ein kurzes aktuelles Fenster sichtbar, und veraltete, nur im Store vorhandene Kind-Links werden
nach ihrem Aktualitätsfenster ignoriert. Das verhindert, dass alte `spawnedBy`-/
`parentSessionKey`-Metadaten nach einem Neustart Geisterkinder wiederherstellen.
Wenn ein Kindabschlussereignis eintrifft, nachdem Sie die endgültige Antwort bereits gesendet haben,
ist die korrekte Folgeaktion das exakt stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Kontrollumfang werden beim Spawnen in die Sitzungsmetadaten geschrieben. Dadurch können flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich erneut Orchestrator-Rechte erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Kinder verwalten kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Sitzungs-Tools — `sessions_spawn` wird bei Tiefe 2 immer verweigert. Kann keine weiteren Kinder spawnen.

### Spawn-Limit pro Agent

Jede Agentensitzung (in beliebiger Tiefe) kann gleichzeitig höchstens `maxChildrenPerAgent`
(Standard `5`) aktive Kinder haben. Das verhindert unkontrolliertes Fan-out
durch einen einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Kinder
der Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agenten der Tiefe 1 und kaskadiert zu ihren Kindern der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Unteragenten und kaskadiert zu seinen Kindern.
- `/subagents kill all` stoppt alle Unteragenten für den Requester und kaskadiert.

## Authentifizierung

Unteragent-Authentifizierung wird über die **Agenten-ID** aufgelöst, nicht über den Sitzungstyp:

- Der Sitzungsschlüssel des Unteragenten ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Speicher wird aus dem `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Hauptagenten werden als **Fallback** zusammengeführt; Agentenprofile überschreiben Hauptprofile bei Konflikten.

Die Zusammenführung ist additiv, daher sind Hauptprofile immer als
Fallbacks verfügbar. Vollständig isolierte Auth pro Agent wird noch nicht unterstützt.

## Ankündigung

Unteragenten melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Unteragent-Sitzung (nicht in der Requester-Sitzung).
- Wenn der Unteragent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der letzte Assistententext das exakt stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Requester-Tiefe ab:

- Requester-Sitzungen der obersten Ebene verwenden einen Folge-`agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Requester-Unteragent-Sitzungen erhalten eine interne Folge-Injektion (`deliver=false`), damit der Orchestrator Kindergebnisse innerhalb der Sitzung synthetisieren kann.
- Wenn eine verschachtelte Requester-Unteragent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw auf den Requester dieser Sitzung zurück, sofern verfügbar.

Für Requester-Sitzungen der obersten Ebene löst die direkte Zustellung im Abschlussmodus zuerst
jede gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und füllt dann
fehlende Kanalzielfelder aus der gespeicherten Route der Requester-Sitzung.
So bleiben Abschlüsse im richtigen Chat/Thema, auch wenn der Abschlussursprung
nur den Kanal identifiziert.

Die Aggregation von Kindabschlüssen ist beim Erstellen verschachtelter Abschlussbefunde
auf die aktuelle Requester-Ausführung beschränkt, wodurch verhindert wird, dass veraltete Kindausgaben
früherer Ausführungen in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten
Thread-/Themen-Routing bei, wenn es auf Kanaladaptern verfügbar ist.

### Ankündigungskontext

Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                        |
| Sitzungs-IDs   | Sitzungsschlüssel/-ID des Kindes                                                                              |
| Typ            | Ankündigungstyp + Aufgabenlabel                                                                               |
| Status         | Aus Laufzeitergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Letzter sichtbarer Assistententext, andernfalls bereinigter letzter Tool-/toolResult-Text                     |
| Folgeaktion    | Anweisung, die beschreibt, wann zu antworten ist und wann still zu bleiben ist                                |

Terminal fehlgeschlagene Ausführungen melden Fehlerstatus, ohne erfassten
Antworttext erneut abzuspielen. Bei Timeout kann die Ankündigung, wenn das Kind nur bis zu Tool-Aufrufen gekommen ist,
diesen Verlauf zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, statt
rohe Tool-Ausgabe erneut abzuspielen.

### Statistikzeile

Ankündigungspayloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Hauptagent den Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistentenstimme neu formuliert werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistentenabruf wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`- / `<relevant_memories>`-Gerüst entfernt; Klartext-XML-Payload-Blöcke von Tool-Aufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; heruntergestuftes Tool-Call-/Result-Gerüst und historische Kontextmarker entfernt; geleakte Modellsteuerungstoken (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Text, der wie Zugangsdaten/Token aussieht, wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die Prüfung des rohen Transkripts auf dem Datenträger ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Unteragenten verwenden zuerst dieselbe Profil- und Tool-Richtlinien-Pipeline wie der Parent-
oder Zielagent. Danach wendet OpenClaw die Unteragent-Einschränkungsschicht an.

Ohne restriktives `tools.profile` erhalten Unteragenten **alle Tools außer
Sitzungs-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Abrufansicht —
es ist kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2` ist, erhalten Orchestrator-Unteragenten der Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre Kinder verwalten können.

### Überschreibung über Konfiguration

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` ist ein abschließender Filter, der ausschließlich Zulassungen erlaubt. Er kann die bereits aufgelöste Tool-Menge einschränken, aber er kann kein Tool **wieder hinzufügen**, das durch `tools.profile` entfernt wurde. Beispielsweise enthält `tools.profile: "coding"` `web_search`/`web_fetch`, aber nicht das Tool `browser`. Damit Sub-Agenten mit Coding-Profil Browser-Automatisierung verwenden können, fügen Sie browser auf der Profilstufe hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie `agents.list[].tools.alsoAllow: ["browser"]` pro Agent, wenn nur ein Agent Browser-Automatisierung erhalten soll.

## Parallelität

Sub-Agenten verwenden eine dedizierte In-Process-Warteschlangenspur:

- **Spurname:** `subagent`
- **Parallelität:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Nachweis dafür, dass ein Sub-Agent noch aktiv ist. Nicht beendete Ausführungen, die älter als das Fenster für veraltete Ausführungen sind, zählen in `/subagents list`, Statuszusammenfassungen, Abschluss-Gating für Nachkommen und Parallelitätsprüfungen pro Sitzung nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Ausführungen entfernt, sofern ihre untergeordnete Sitzung nicht mit `abortedLastRun: true` markiert ist. Diese durch Neustart abgebrochenen untergeordneten Sitzungen bleiben über den Wiederherstellungsfluss für verwaiste Sub-Agenten wiederherstellbar, der eine synthetische Fortsetzungsnachricht sendet, bevor die Abbruchmarkierung gelöscht wird.

Die automatische Neustart-Wiederherstellung ist pro untergeordneter Sitzung begrenzt. Wenn derselbe untergeordnete Sub-Agent innerhalb des schnellen erneuten Verklemmungsfensters wiederholt für die Wiederherstellung verwaister Sitzungen akzeptiert wird, speichert OpenClaw einen Wiederherstellungs-Tombstone für diese Sitzung und setzt sie bei späteren Neustarts nicht mehr automatisch fort. Führen Sie `openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder `openclaw doctor --fix`, um veraltete Abbruch-Wiederherstellungsflags auf Sitzungen mit Tombstone zu löschen.

<Note>
Wenn das Starten eines Sub-Agenten mit Gateway `PAIRING_REQUIRED` / `scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Zustand bearbeiten. Interne `sessions_spawn`-Koordination sollte sich als `client.id: "gateway-client"` mit `client.mode: "backend"` über direkte local loopback-Authentifizierung per gemeinsamem Token/Passwort verbinden; dieser Pfad hängt nicht vom Scope-Baseline des gekoppelten Geräts der CLI ab. Remote-Aufrufer, explizite `deviceIdentity`, explizite Geräte-Token-Pfade und Browser/Node-Clients benötigen weiterhin die normale Gerätegenehmigung für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im anfordernden Chat bricht die anfordernde Sitzung ab und stoppt alle aktiven Sub-Agent-Ausführungen, die daraus gestartet wurden, einschließlich kaskadierender Beendigung verschachtelter untergeordneter Sitzungen.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und beendet seine untergeordneten Sitzungen kaskadierend.

## Einschränkungen

- Die Sub-Agent-Ankündigung erfolgt **nach bestem Aufwand**. Wenn der Gateway neu startet, gehen ausstehende „Zurückankündigungs“-Arbeiten verloren.
- Sub-Agenten teilen sich weiterhin dieselben Gateway-Prozessressourcen; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Sub-Agent-Kontext injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1-5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive untergeordnete Sitzungen pro Sitzung (Standard `5`, Bereich `1-20`).

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrund-Tasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
