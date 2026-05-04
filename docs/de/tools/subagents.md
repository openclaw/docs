---
read_when:
    - Sie möchten Hintergrundarbeit oder parallele Arbeit über den Agenten nutzen
    - Sie ändern die Richtlinie für sessions_spawn oder Sub-Agent-Tools
    - Sie implementieren threadgebundene Subagent-Sitzungen oder beheben Probleme damit
sidebarTitle: Sub-agents
summary: Starten Sie isolierte Hintergrund-Agentenläufe, die Ergebnisse an den Chat der anfragenden Person zurückmelden
title: Sub-Agenten
x-i18n:
    generated_at: "2026-05-04T06:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agents sind Hintergrund-Agent-Ausführungen, die aus einer bestehenden Agent-Ausführung gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**kündigen** nach Abschluss ihr Ergebnis im Chat-Kanal des Anforderers an. Jede Sub-Agent-Ausführung wird als
[Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Primäre Ziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne die Hauptausführung zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungs-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext
und Token-Verbrauch. Legen Sie für aufwendige oder repetitive Aufgaben ein
günstigeres Modell für Sub-Agents fest und behalten Sie für Ihren Haupt-Agent
ein hochwertigeres Modell bei. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder agent-spezifische Überschreibungen. Wenn ein untergeordneter Agent
    wirklich das aktuelle Transkript des Anforderers benötigt, kann der Agent
    bei genau diesem Spawn `context: "fork"` anfordern. Thread-gebundene Sub-Agent-Sitzungen verwenden standardmäßig
    `context: "fork"`, weil sie die aktuelle Unterhaltung in einen
    Follow-up-Thread verzweigen.
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

Verwenden Sie [`/steer <message>`](/de/tools/steer) auf oberster Ebene, um die aktive Ausführung der aktuellen Anforderer-Sitzung zu steuern. Verwenden Sie `/subagents steer <id|#> <message>`, wenn das Ziel eine untergeordnete Ausführung ist.

`/subagents info` zeigt Ausführungsmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Abrufansicht; prüfen Sie den Transkriptpfad auf dem Datenträger, wenn Sie
das rohe vollständige Transkript benötigen.

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

### Spawn-Verhalten

`/subagents spawn` startet einen Hintergrund-Sub-Agent als Benutzerbefehl (nicht als
internen Relay) und sendet eine abschließende Abschlussaktualisierung zurück an den
Anforderer-Chat, wenn die Ausführung beendet ist.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Der Spawn-Befehl blockiert nicht; er gibt sofort eine Ausführungs-ID zurück.
    - Nach Abschluss kündigt der Sub-Agent eine Zusammenfassungs-/Ergebnismeldung im Chat-Kanal des Anforderers an.
    - Der Abschluss ist Push-basiert. Nachdem der Spawn gestartet wurde, pollen Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf für Debugging oder Eingriff.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand nachverfolgte Browser-Tabs/-Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Ankündigungs-Bereinigungsablauf fortgesetzt wird.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw versucht zuerst die direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
    - Wenn der Abschluss-Turn des Anforderer-Agents fehlschlägt, keine sichtbare Ausgabe erzeugt oder ein offensichtlich unvollständiges Präfix des erfassten untergeordneten Ergebnisses zurückgibt, fällt OpenClaw auf direkte Abschlusszustellung aus dem erfassten untergeordneten Ergebnis zurück.
    - Wenn die direkte Zustellung nicht verwendet werden kann, fällt es auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Ankündigung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Anforderer-Route bei: Thread-gebundene oder unterhaltungsgebundene Abschlussrouten gewinnen, wenn verfügbar; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anforderer-Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Die Abschlussübergabe an die Anforderer-Sitzung ist zur Laufzeit erzeugter
    interner Kontext (kein von Benutzern verfasster Text) und enthält:

    - `Result` — neuester sichtbarer `assistant`-Antworttext, andernfalls bereinigter neuester Tool-/toolResult-Text. Terminal fehlgeschlagene Ausführungen verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellungsanweisung, die den Anforderer-Agent anweist, in normaler Assistentenstimme neu zu formulieren (keine rohen internen Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` und `--thinking` überschreiben die Standardwerte für diese spezifische Ausführung.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist ein Einmalmodus (`mode: "run"`). Verwenden Sie für persistente Thread-gebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Runtime bewirbt. Siehe [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Steuerung von Codex-Chat/-Thread `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.list[]`-Eintrag mit `runtime.type="acp"`; verwenden Sie die Standard-Sub-Agent-Runtime für normale OpenClaw-Konfigurations-Agents aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich anfordert, das aktuelle Transkript zu forken.

| Modus      | Wann er verwendet werden sollte                                                                                                         | Verhalten                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext beschrieben werden kann            | Erstellt ein sauberes untergeordnetes Transkript. Dies ist der Standard und hält den Token-Verbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder nuancierten Anweisungen abhängt, die bereits im Anforderer-Transkript vorhanden sind | Verzweigt das Anforderer-Transkript in die untergeordnete Sitzung, bevor der untergeordnete Agent startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht, nicht als
Ersatz für das Schreiben eines klaren Aufgabenprompts.

## Tool: `sessions_spawn`

Startet eine Sub-Agent-Ausführung mit `deliver: false` auf der globalen `subagent`-Lane,
führt dann einen Ankündigungsschritt aus und postet die Ankündigungsantwort in den
Chat-Kanal des Anforderers.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab. Die Profile `coding` und
`full` stellen `sessions_spawn` standardmäßig bereit. Das Profil `messaging`
nicht; fügen Sie `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agents, die Arbeit
delegieren sollen. Kanal-/Gruppen-, Provider-, Sandbox- und agent-spezifische Allow-/Deny-Richtlinien können
das Tool nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agent-spezifisch `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` gewinnt weiterhin.
- **Thinking:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agent-spezifisch `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` gewinnt weiterhin.
- **Ausführungs-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, sofern gesetzt; andernfalls fällt es auf `0` (kein Timeout) zurück.

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
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge bestimmt, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Spawns ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die ACP-Ausführungsausgabe an die übergeordnete Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Spawns auslassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Sub-Agent-Modell. Ungültige Werte werden übersprungen, und der Sub-Agent läuft auf dem Standardmodell mit einer Warnung im Tool-Ergebnis.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt die Thinking-Stufe für die Sub-Agent-Ausführung.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird die Sub-Agent-Ausführung nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird eine Kanal-Thread-Bindung für diese Sub-Agent-Sitzung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` und `mode` ausgelassen wird, wird der Standard zu `session`. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert unmittelbar nach der Ankündigung (behält das Transkript weiterhin per Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weist den Spawn zurück, sofern die Ziel-Laufzeit des untergeordneten Agents nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die untergeordnete Sitzung. Nur native Sub-Agents. Thread-gebundene Spawns verwenden standardmäßig `fork`; Nicht-Thread-Spawns standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Kanalzustellungsparameter (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die Zustellung
`message`/`sessions_send` aus der gestarteten Ausführung.
</Warning>

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an einen Thread
gebunden bleiben, sodass Folge-Nachrichten von Benutzern in diesem Thread weiterhin an dieselbe
Sub-Agent-Sitzung geroutet werden.

### Thread-unterstützende Kanäle

**Discord** ist derzeit der einzige unterstützte Kanal. Er unterstützt
persistente Thread-gebundene Sub-Agent-Sitzungen (`sessions_spawn` mit
`thread: true`), manuelle Thread-Steuerungen (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) sowie Adapter-Schlüssel
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` und
`channels.discord.threadBindings.spawnSessions`.

### Schnellablauf

<Steps>
  <Step title="Spawn">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw erstellt einen Thread oder bindet einen Thread an dieses Sitzungsziel im aktiven Kanal.
  </Step>
  <Step title="Route follow-ups">
    Antworten und Folgemeldungen in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Inspect timeouts">
    Verwenden Sie `/session idle`, um die automatische Inaktivitäts-Entfokussierung zu prüfen/aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Detach">
    Verwenden Sie `/unfocus`, um die Bindung manuell zu lösen.
  </Step>
</Steps>

### Manuelle Steuerungen

| Befehl            | Wirkung                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Aktuellen Thread (oder einen neuen) an ein Sub-Agent-/Sitzungsziel binden |
| `/unfocus`         | Bindung für den aktuell gebundenen Thread entfernen                       |
| `/agents`          | Aktive Läufe und Bindungsstatus auflisten (`thread:<id>` oder `unbound`)       |
| `/session idle`    | Automatische Inaktivitäts-Entfokussierung prüfen/aktualisieren (nur fokussierte gebundene Threads)         |
| `/session max-age` | Harte Obergrenze prüfen/aktualisieren (nur fokussierte gebundene Threads)                  |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanalspezifische Überschreibung und Schlüssel für automatische Bindung beim Spawn** sind adapterspezifisch. Siehe [Thread-unterstützende Kanäle](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste von Agent-IDs, die über explizites `agentId` adressiert werden können (`["*"]` erlaubt beliebige). Standard: nur der anfordernde Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der anfordernde Agent sich selbst mit `agentId` spawnt, nehmen Sie die ID des anfordernden Agents in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist für Ziel-Agents, die verwendet wird, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` auslassen (erzwingt explizite Profilauswahl). Überschreibung pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die anfordernde Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox laufen würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive
Modell jedes aufgeführten Agents und eingebettete Runtime-Metadaten, damit Aufrufer Pi, Codex
App-Server und andere konfigurierte native Runtimes unterscheiden können.

### Automatische Archivierung

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` (Standard `60`) automatisch archiviert.
- Die Archivierung verwendet `sessions.delete` und benennt das Transcript in `*.deleted.<timestamp>` um (gleicher Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (bewahrt das Transcript weiterhin per Umbenennung auf).
- Automatische Archivierung erfolgt nach bestem Aufwand; ausstehende Timer gehen verloren, wenn der Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Aufwand geschlossen, wenn der Lauf endet, auch wenn der Transcript-/Sitzungsdatensatz erhalten bleibt.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents spawnen
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene der
Verschachtelung zu aktivieren – das **Orchestrator-Muster**: Haupt-Agent → Orchestrator-Sub-Agent →
Worker-Sub-Sub-Agents.

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

| Tiefe | Form des Sitzungsschlüssels                            | Rolle                                          | Kann spawnen?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                    | Immer                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Nie                        |

### Ankündigungskette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 ist fertig → kündigt an seinen übergeordneten Agent an (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, ist fertig → kündigt an den Haupt-Agent an.
3. Haupt-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten untergeordneten Agents.

<Note>
**Betriebliche Leitlinien:** Starten Sie untergeordnete Arbeit einmalig und warten Sie auf Abschlussereignisse,
statt Poll-Schleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten Beziehungen zu untergeordneten Sitzungen
auf Live-Arbeit fokussiert – aktive untergeordnete Agents bleiben angehängt, beendete untergeordnete Agents bleiben
für ein kurzes aktuelles Zeitfenster sichtbar, und veraltete reine Store-Links zu untergeordneten Agents werden
nach ihrem Aktualitätsfenster ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`- /
`parentSessionKey`-Metadaten nach einem Neustart Ghost-Children wiederherstellen.
Wenn ein Abschlussereignis eines untergeordneten Agents eintrifft, nachdem Sie bereits die
finale Antwort gesendet haben, ist die korrekte Folgeantwort das exakte stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Steuerungsumfang werden beim Spawn in die Sitzungsmetadaten geschrieben. Dadurch können flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich Orchestrator-Berechtigungen zurückerlangen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine untergeordneten Agents verwalten kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Sitzungs-Tools – `sessions_spawn` wird in Tiefe 2 immer verweigert. Kann keine weiteren untergeordneten Agents spawnen.

### Spawn-Limit pro Agent

Jede Agent-Sitzung (in beliebiger Tiefe) kann gleichzeitig höchstens `maxChildrenPerAgent`
(Standard `5`) aktive untergeordnete Agents haben. Dies verhindert unkontrolliertes Fan-out
durch einen einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine untergeordneten Agents der Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agents der Tiefe 1 und kaskadiert zu deren untergeordneten Agents der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen untergeordneten Agents.
- `/subagents kill all` stoppt alle Sub-Agents für den Anforderer und kaskadiert.

## Authentifizierung

Sub-Agent-Authentifizierung wird nach **Agent-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sitzungsschlüssel des Sub-Agents lautet `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agents geladen.
- Die Auth-Profile des Haupt-Agents werden als **Fallback** zusammengeführt; Agent-Profile überschreiben bei Konflikten Hauptprofile.

Die Zusammenführung ist additiv, daher sind Hauptprofile immer als
Fallbacks verfügbar. Vollständig isolierte Authentifizierung pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agents melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt wird innerhalb der Sub-Agent-Sitzung ausgeführt (nicht in der anfordernden Sitzung).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistant-Text das exakte stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Tiefe des Anforderers ab:

- Anfordernde Sitzungen auf oberster Ebene verwenden einen Folge-`agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte anfordernde Subagent-Sitzungen erhalten eine interne Folgeinjektion (`deliver=false`), damit der Orchestrator untergeordnete Ergebnisse in der Sitzung synthetisieren kann.
- Wenn eine verschachtelte anfordernde Subagent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw auf den Anforderer dieser Sitzung zurück, sofern verfügbar.

Für anfordernde Sitzungen auf oberster Ebene löst direkte Zustellung im Completion-Modus zuerst
jede gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und füllt dann
fehlende Kanal-Zielfelder aus der gespeicherten Route der anfordernden Sitzung.
Dadurch bleiben Completions im richtigen Chat/Thema, selbst wenn der Completion-Ursprung
nur den Kanal identifiziert.

Die Aggregation von Abschlussmeldungen untergeordneter Agents ist beim Erstellen verschachtelter Completion-Befunde
auf den aktuellen Anforderer-Lauf begrenzt, wodurch verhindert wird, dass veraltete
Ausgaben untergeordneter Agents aus früheren Läufen in die aktuelle Ankündigung gelangen. Ankündigungsantworten bewahren
Thread-/Themen-Routing, sofern es auf Kanaladaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld          | Quelle                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                          |
| Sitzungs-IDs    | Sitzungsschlüssel/-ID des untergeordneten Agents                                                                                          |
| Typ           | Ankündigungstyp + Aufgabenlabel                                                                                    |
| Status         | Aus Runtime-Ergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) – **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistant-Text, andernfalls bereinigter neuester Tool-/toolResult-Text                                |
| Follow-up      | Anweisung, wann geantwortet bzw. still geblieben werden soll                                                           |

Terminal fehlgeschlagene Läufe melden den Fehlerstatus, ohne erfassten
Antworttext erneut abzuspielen. Bei Timeout kann die Ankündigung, wenn der untergeordnete Agent nur Tool-Aufrufe durchlaufen hat,
diesen Verlauf zu einer kurzen Zusammenfassung des Teilfortschritts verdichten,
statt rohe Tool-Ausgabe erneut abzuspielen.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Runtime (z. B. `runtime 5m12s`).
- Tokenverbrauch (Eingabe/Ausgabe/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transcript-Pfad, damit der Haupt-Agent den Verlauf über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistant-Stimme neu formuliert werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistant-Recall wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`- / `<relevant_memories>`-Gerüst entfernt; Klartext-Tool-Call-XML-Payload-Blöcke (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber geschlossen werden; herabgestuftes Tool-Call-/Ergebnis-Gerüst und historische Kontextmarker entfernt; durchgesickerte Modellsteuerungs-Token (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Anmeldeinformations-/tokenähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Rohe Transcript-Inspektion auf der Festplatte ist der Fallback, wenn Sie das vollständige bytegenaue Transcript benötigen.

## Tool-Richtlinie

Sub-Agents verwenden zuerst dieselbe Profil- und Tool-Policy-Pipeline wie der übergeordnete oder
Ziel-Agent. Danach wendet OpenClaw die Einschränkungsebene für Sub-Agents an.

Ohne einschränkendes `tools.profile` erhalten Sub-Agents **alle Tools außer
Session-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Erinnerungsansicht —
es ist kein roher Transcript-Dump.

Wenn `maxSpawnDepth >= 2` ist, erhalten Orchestrator-Sub-Agents auf Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre untergeordneten Agents verwalten können.

### Per Konfiguration überschreiben

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

`tools.subagents.tools.allow` ist ein finaler Allow-only-Filter. Er kann
die bereits aufgelöste Tool-Menge einschränken, aber kein Tool **wieder hinzufügen**,
das durch `tools.profile` entfernt wurde. Zum Beispiel enthält `tools.profile: "coding"`
`web_search`/`web_fetch`, aber nicht das `browser`-Tool. Damit
Sub-Agents mit Coding-Profil Browser-Automation verwenden können, fügen Sie Browser auf
der Profilebene hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie pro Agent `agents.list[].tools.alsoAllow: ["browser"]`, wenn nur ein
Agent Browser-Automation erhalten soll.

## Parallelität

Sub-Agents verwenden eine eigene In-Process-Warteschlangen-Lane:

- **Lane-Name:** `subagent`
- **Parallelität:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Nachweis, dass ein
Sub-Agent noch aktiv ist. Nicht beendete Ausführungen, die älter als das Stale-Run-Fenster sind,
zählen in `/subagents list`, Statuszusammenfassungen,
Abschluss-Gating für Nachkommen und Parallelitätsprüfungen pro Session nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Ausführungen entfernt, sofern
ihre Child-Session nicht als `abortedLastRun: true` markiert ist. Diese
durch Neustart abgebrochenen Child-Sessions bleiben über den Wiederherstellungsablauf für verwaiste Sub-Agents
wiederherstellbar; dabei wird eine synthetische Resume-Nachricht gesendet, bevor
die Abbruchmarkierung gelöscht wird.

Die automatische Neustart-Wiederherstellung ist pro Child-Session begrenzt. Wenn derselbe
Sub-Agent-Child innerhalb des schnellen Re-Wedge-Fensters wiederholt zur Wiederherstellung verwaister Sessions
angenommen wird, persistiert OpenClaw einen Wiederherstellungs-Tombstone auf dieser
Session und nimmt die automatische Wiederaufnahme bei späteren Neustarts nicht mehr vor. Führen Sie
`openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder
`openclaw doctor --fix`, um veraltete abgebrochene Wiederherstellungs-Flags auf
Sessions mit Tombstone zu löschen.

<Note>
Wenn das Starten eines Sub-Agents mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Zustand bearbeiten.
Interne `sessions_spawn`-Koordination sollte als
`client.id: "gateway-client"` mit `client.mode: "backend"` über direkte
local loopback Shared-Token-/Passwort-Authentifizierung verbinden; dieser Pfad hängt nicht von der
Scope-Baseline gekoppelter Geräte der CLI ab. Remote-Aufrufer, explizite
`deviceIdentity`, explizite Gerätetoken-Pfade und Browser-/Node-Clients
benötigen weiterhin die normale Gerätefreigabe für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im Requester-Chat bricht die Requester-Session ab und stoppt alle daraus gestarteten aktiven Sub-Agent-Ausführungen, kaskadierend bis zu verschachtelten Child-Agents.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen Child-Agents.

## Einschränkungen

- Die Ankündigung von Sub-Agents erfolgt **nach bestem Aufwand**. Wenn der Gateway neu startet, geht ausstehende „Zurückankündigen“-Arbeit verloren.
- Sub-Agents teilen sich weiterhin dieselben Ressourcen des Gateway-Prozesses; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Sub-Agent-Kontext injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Child-Agents pro Session (Standard `5`, Bereich `1–20`).

## Verwandte Themen

- [ACP-Agents](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrund-Tasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
