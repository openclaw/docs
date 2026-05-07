---
read_when:
    - Sie möchten über den Agenten im Hintergrund oder parallel arbeiten
    - Sie ändern die Richtlinie für sessions_spawn oder Sub-Agent-Tools
    - Sie implementieren oder beheben Probleme mit threadgebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Isolierte Hintergrund-Agent-Ausführungen starten, die Ergebnisse an den anfordernden Chat zurückmelden
title: Sub-Agenten
x-i18n:
    generated_at: "2026-05-07T13:26:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agents sind Agent-Ausführungen im Hintergrund, die aus einer bestehenden Agent-Ausführung heraus gestartet werden.
Sie laufen in ihrer eigenen Session (`agent:<agentId>:subagent:<uuid>`) und
geben nach Abschluss ihr Ergebnis im Chat-Kanal des Anforderers
**bekannt**. Jede Sub-Agent-Ausführung wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Primäre Ziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne die Hauptausführung zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Session-Trennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Session-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext
und eigenen Tokenverbrauch. Für aufwendige oder repetitive Aufgaben sollten Sie
ein günstigeres Modell für Sub-Agents festlegen und Ihren Hauptagenten auf
einem höherwertigen Modell belassen. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder agentenspezifische Overrides. Wenn ein Kindprozess
    tatsächlich das aktuelle Transkript des Anforderers benötigt, kann der Agent
    `context: "fork"` für genau diesen einen Start anfordern. Thread-gebundene Sub-Agent-Sessions verwenden standardmäßig
    `context: "fork"`, weil sie die aktuelle Unterhaltung in einen
    Follow-up-Thread verzweigen.
</Note>

## Slash-Befehl

Verwenden Sie `/subagents`, um Sub-Agent-Ausführungen für die **aktuelle
Session** zu prüfen oder zu steuern:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Verwenden Sie den obersten [`/steer <message>`](/de/tools/steer)-Befehl, um die aktive Ausführung der aktuellen Anforderer-Session zu steuern. Verwenden Sie `/subagents steer <id|#> <message>`, wenn das Ziel eine Kind-Ausführung ist.

`/subagents info` zeigt Ausführungsmetadaten (Status, Zeitstempel, Session-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Abrufansicht; prüfen Sie den Transkriptpfad auf dem Datenträger, wenn Sie
das vollständige Rohtranskript benötigen.

### Steuerung für Thread-Bindung

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
internes Relay) und sendet nach Abschluss der Ausführung ein finales Abschlussupdate zurück an den
Anforderer-Chat.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Der Startbefehl ist nicht blockierend; er gibt sofort eine Ausführungs-ID zurück.
    - Bei Abschluss gibt der Sub-Agent eine Zusammenfassungs-/Ergebnismeldung im Chat-Kanal des Anforderers bekannt.
    - Der Abschluss ist push-basiert. Nach dem Start sollten Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife abfragen, nur um auf das Ende zu warten; prüfen Sie den Status nur bei Bedarf für Debugging oder Eingriffe.
    - Bei Abschluss schließt OpenClaw nach bestem Aufwand verfolgte Browser-Tabs/-Prozesse, die von dieser Sub-Agent-Session geöffnet wurden, bevor der Bekanntgabe-Bereinigungsablauf fortgesetzt wird.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw übergibt Abschlüsse über einen `agent`-Turn mit stabilem Idempotenzschlüssel zurück an die Anforderer-Session.
    - Wenn die Anfordererausführung noch aktiv ist, versucht OpenClaw zuerst, diese Ausführung zu wecken/zu steuern, statt einen zweiten sichtbaren Antwortpfad zu starten.
    - Wenn die Abschlussübergabe an den Anforderer-Agent fehlschlägt oder keine sichtbare Ausgabe erzeugt, behandelt OpenClaw die Zustellung als fehlgeschlagen und fällt auf Queue-Routing/Wiederholung zurück. Es sendet das Kindergebnis nicht roh direkt an den externen Chat.
    - Wenn die direkte Übergabe nicht verwendet werden kann, fällt es auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Bekanntgabe mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Route des Anforderers bei: Thread-gebundene oder unterhaltungsgebundene Abschlussrouten haben Vorrang, wenn verfügbar; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anforderer-Session (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Die Abschlussübergabe an die Anforderer-Session ist zur Laufzeit generierter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — neuesten sichtbaren `assistant`-Antworttext, andernfalls bereinigten neuesten Tool-/toolResult-Text. Terminal fehlgeschlagene Ausführungen verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Tokenstatistiken.
    - Eine Zustellanweisung, die den Anforderer-Agent anweist, in normaler Assistentenstimme umzuschreiben (nicht rohe interne Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` und `--thinking` überschreiben Standardwerte für diese spezifische Ausführung.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist ein Einmalmodus (`mode: "run"`). Für persistente Thread-gebundene Sessions verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Für ACP-Harness-Sessions (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) verwenden Sie `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Runtime bewirbt. Siehe [ACP-Zustellmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht in einer Sandbox läuft und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen Eintrag in `agents.list[]` mit `runtime.type="acp"`; verwenden Sie die Standard-Sub-Agent-Runtime für normale OpenClaw-Konfigurationsagenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich anfordert,
das aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden sollten                                                                                                       | Verhalten                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext kurz erläutert werden kann      | Erstellt ein sauberes Kind-Transkript. Dies ist der Standard und hält den Tokenverbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, vorherigen Tool-Ergebnissen oder nuancierten Anweisungen abhängt, die bereits im Anforderer-Transkript vorhanden sind | Verzweigt das Anforderer-Transkript in die Kind-Session, bevor das Kind startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht, nicht als
Ersatz für das Schreiben eines klaren Aufgabenprompts.

## Tool: `sessions_spawn`

Startet eine Sub-Agent-Ausführung mit `deliver: false` auf der globalen `subagent`-Lane,
führt dann einen Bekanntgabeschritt aus und postet die Bekanntgabeantwort in den
Chat-Kanal des Anforderers.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab. Die Profile `coding` und
`full` stellen `sessions_spawn` standardmäßig bereit. Das Profil `messaging`
tut dies nicht; fügen Sie `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agenten, die Arbeit delegieren
sollen. Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische Allow-/Deny-Richtlinien können
das Tool nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Session, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Thinking:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Ausführungs-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, falls festgelegt; andernfalls fällt es auf `0` zurück (kein Timeout).

### Tool-Parameter

<ParamField path="task" type="string" required>
  Die Aufgabenbeschreibung für den Sub-Agent.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agent-ID starten, wenn dies durch `subagents.allowAgents` erlaubt ist.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge bestimmt, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine vorhandene ACP-Harness-Session fort, wenn `runtime: "acp"`; wird für native Sub-Agent-Starts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt ACP-Ausführungsausgabe an die Parent-Session, wenn `runtime: "acp"`; für native Sub-Agent-Starts auslassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Sub-Agent-Modell. Ungültige Werte werden übersprungen, und der Sub-Agent läuft mit einer Warnung im Tool-Ergebnis auf dem Standardmodell.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt das Thinking-Level für die Sub-Agent-Ausführung.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird die Sub-Agent-Ausführung nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, fordert dies Kanal-Thread-Bindung für diese Sub-Agent-Session an.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` ist und `mode` ausgelassen wird, wird `session` zum Standard. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert unmittelbar nach der Bekanntgabe (behält das Transkript weiterhin durch Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weist den Start zurück, sofern die Ziel-Kind-Runtime nicht in einer Sandbox läuft.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die Kind-Session. Nur native Sub-Agents. Thread-gebundene Starts verwenden standardmäßig `fork`; Nicht-Thread-Starts verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Kanalzustellungsparameter (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die Zustellung
`message`/`sessions_send` aus der gestarteten Ausführung.
</Warning>

## Thread-gebundene Sessions

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an
einen Thread gebunden bleiben, sodass Folge-Nachrichten von Benutzern in diesem Thread weiter an dieselbe
Sub-Agent-Session geroutet werden.

### Thread-unterstützende Kanäle

**Discord** ist derzeit der einzige unterstützte Kanal. Er unterstützt
persistente Thread-gebundene Sub-Agent-Sessions (`sessions_spawn` mit
`thread: true`), manuelle Thread-Steuerung (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) und Adapter-Schlüssel
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` und
`channels.discord.threadBindings.spawnSessions`.

### Schnellablauf

<Steps>
  <Step title="Erzeugen">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt einen Thread oder bindet einen Thread im aktiven Kanal an dieses Sitzungsziel.
  </Step>
  <Step title="Folgenachrichten weiterleiten">
    Antworten und Folgenachrichten in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Timeouts prüfen">
    Verwenden Sie `/session idle`, um die automatische Inaktivitäts-Entfokussierung zu prüfen/aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um die Bindung manuell zu lösen.
  </Step>
</Steps>

### Manuelle Steuerung

| Befehl            | Wirkung                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Den aktuellen Thread (oder einen neuen) an ein Sub-Agent-/Sitzungsziel binden |
| `/unfocus`         | Die Bindung für den aktuell gebundenen Thread entfernen                       |
| `/agents`          | Aktive Läufe und Bindungsstatus auflisten (`thread:<id>` oder `unbound`)       |
| `/session idle`    | Automatische Inaktivitäts-Entfokussierung prüfen/aktualisieren (nur fokussierte gebundene Threads) |
| `/session max-age` | Harte Obergrenze prüfen/aktualisieren (nur fokussierte gebundene Threads)      |

### Konfigurationsschalter

- **Globale Vorgabe:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal-Override und Schlüssel für automatische Bindung beim Erzeugen** sind adapter-spezifisch. Siehe [Thread-unterstützende Kanäle](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Zulassungsliste

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste von Agent-IDs, die über explizites `agentId` adressiert werden können (`["*"]` erlaubt alle). Standard: nur der anfragende Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Anfragende sich selbst mit `agentId` erzeugen kann, nehmen Sie die ID des Anfragenden in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standardmäßige Ziel-Agent-Zulassungsliste, die verwendet wird, wenn der anfragende Agent kein eigenes `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` auslassen (erzwingt explizite Profilauswahl). Override pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die anfragende Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox ausgeführt würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive Modell jedes
aufgelisteten Agents und eingebettete Laufzeitmetadaten, damit Aufrufer zwischen PI, Codex
app-server und anderen konfigurierten nativen Laufzeiten unterscheiden können.

### Automatische Archivierung

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard `60`).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (gleicher Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (das Transkript bleibt durch Umbenennung erhalten).
- Die automatische Archivierung erfolgt nach bestem Bemühen; ausstehende Timer gehen verloren, wenn das Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung erhalten.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von der Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Bemühen geschlossen, wenn der Lauf endet, selbst wenn das Transkript/der Sitzungseintrag erhalten bleibt.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents erzeugen
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Verschachtelungsebene zu aktivieren:
das **Orchestrator-Muster**: Haupt-Agent → Orchestrator-Sub-Agent →
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

### Tiefenstufen

| Tiefe | Form des Sitzungsschlüssels                 | Rolle                                         | Kann erzeugen?               |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                   | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Nie                          |

### Ankündigungskette

Ergebnisse fließen in der Kette nach oben zurück:

1. Worker der Tiefe 2 beendet → kündigt an seinen Parent an (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet → kündigt an main an.
3. Haupt-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten Children.

<Note>
**Betriebliche Hinweise:** Starten Sie Child-Arbeit einmalig und warten Sie auf Abschlussereignisse,
anstatt Polling-Schleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten Child-Sitzungsbeziehungen
auf Live-Arbeit fokussiert: Live-Children bleiben angehängt, beendete Children bleiben
für ein kurzes aktuelles Zeitfenster sichtbar, und veraltete nur im Store vorhandene Child-Links werden
nach ihrem Freshness-Fenster ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`- /
`parentSessionKey`-Metadaten nach einem Neustart Ghost-Children wieder erscheinen lassen.
Wenn ein Child-Abschlussereignis eintrifft, nachdem Sie die
finale Antwort bereits gesendet haben, ist die korrekte Folgenachricht das exakte stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Steuerungsumfang werden beim Erzeugen in die Sitzungsmetadaten geschrieben. Dadurch können flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich Orchestrator-Privilegien zurückerlangen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Children verwalten kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Sitzungs-Tools — `sessions_spawn` wird in Tiefe 2 immer verweigert. Kann keine weiteren Children erzeugen.

### Erzeugungslimit pro Agent

Jede Agent-Sitzung (in jeder Tiefe) kann höchstens `maxChildrenPerAgent`
(Standard `5`) gleichzeitig aktive Children haben. Das verhindert unkontrolliertes Fan-out
durch einen einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Children der Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agents der Tiefe 1 und kaskadiert zu ihren Children der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen Children.
- `/subagents kill all` stoppt alle Sub-Agents für den Anfragenden und kaskadiert.

## Authentifizierung

Sub-Agent-Auth wird nach **Agent-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sitzungsschlüssel des Sub-Agents lautet `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agents geladen.
- Die Auth-Profile des Haupt-Agents werden als **Fallback** zusammengeführt; Agent-Profile überschreiben bei Konflikten Hauptprofile.

Die Zusammenführung ist additiv, daher sind Hauptprofile immer als
Fallbacks verfügbar. Vollständig isolierte Auth pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agents melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht der anfragenden Sitzung).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistant-Text das exakte stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Tiefe des Anfragenden ab:

- Anfragende Sitzungen auf oberster Ebene verwenden einen Follow-up-`agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte anfragende Sub-Agent-Sitzungen erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Child-Ergebnisse innerhalb der Sitzung synthetisieren kann.
- Wenn eine verschachtelte anfragende Sub-Agent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw auf den Anfragenden dieser Sitzung zurück, sofern verfügbar.

Für anfragende Sitzungen auf oberster Ebene löst die direkte Zustellung im Abschlussmodus zuerst
alle gebundenen Konversations-/Thread-Routen und Hook-Overrides auf und füllt anschließend
fehlende Kanal-Zielfelder aus der gespeicherten Route der anfragenden Sitzung.
Dadurch bleiben Abschlüsse im richtigen Chat/Thema, selbst wenn der Abschlussursprung
nur den Kanal identifiziert.

Die Aggregation von Child-Abschlüssen ist beim Erstellen verschachtelter Abschlussbefunde
auf den aktuellen anfragenden Lauf beschränkt, wodurch verhindert wird, dass veraltete Child-Ausgaben
früherer Läufe in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten
Thread-/Themen-Routing bei, wenn es auf Kanaladaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                        |
| Sitzungs-IDs   | Child-Sitzungsschlüssel/-ID                                                                                   |
| Typ            | Ankündigungstyp + Aufgabenlabel                                                                               |
| Status         | Aus Laufzeitergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistant-Text, andernfalls bereinigter neuester Tool-/toolResult-Text                    |
| Follow-up      | Anweisung, die beschreibt, wann geantwortet werden soll und wann Stille beibehalten werden soll               |

Abgeschlossene fehlgeschlagene Läufe melden den Fehlerstatus, ohne erfassten
Antworttext erneut abzuspielen. Bei Timeout kann die Ankündigung, wenn das Child nur bis zu Tool-Aufrufen kam,
diese Historie zu einer kurzen Zusammenfassung des Teilfortschritts komprimieren, anstatt
rohe Tool-Ausgabe erneut abzuspielen.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Haupt-Agent die Historie über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistant-Stimme umgeschrieben werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistant-Recall wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`- / `<relevant_memories>`-Gerüst entfernt; XML-Payload-Blöcke für Plain-Text-Tool-Aufrufe (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; herabgestuftes Tool-Call-/Result-Gerüst und Historical-Context-Marker entfernt; durchgesickerte Modell-Steuerungstokens (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Anmeldeinformations-/token-ähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Historien können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die Prüfung des rohen On-Disk-Transkripts ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Unteragenten verwenden zuerst dieselbe Profil- und Tool-Policy-Pipeline wie der übergeordnete oder
Ziel-Agent. Danach wendet OpenClaw die Einschränkungsebene für Unteragenten
an.

Ohne restriktives `tools.profile` erhalten Unteragenten **alle Tools außer
Sitzungs-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Abrufansicht —
es ist kein Rohdump des Transkripts.

Wenn `maxSpawnDepth >= 2` ist, erhalten Orchestrator-Unteragenten auf Tiefe 1
zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre eigenen Kinder verwalten können.

### Überschreiben über die Konfiguration

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

`tools.subagents.tools.allow` ist ein abschließender Allow-only-Filter. Er kann
die bereits aufgelöste Tool-Menge weiter einschränken, aber kein Tool
**wieder hinzufügen**, das durch `tools.profile` entfernt wurde. Zum Beispiel
enthält `tools.profile: "coding"` `web_search`/`web_fetch`, aber nicht das
Tool `browser`. Damit Unteragenten mit Coding-Profil Browser-Automatisierung
verwenden können, fügen Sie Browser in der Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie pro Agent `agents.list[].tools.alsoAllow: ["browser"]`, wenn nur ein
Agent Browser-Automatisierung erhalten soll.

## Nebenläufigkeit

Unteragenten verwenden eine dedizierte In-Process-Warteschlangen-Lane:

- **Lane-Name:** `subagent`
- **Nebenläufigkeit:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Lebendigkeit und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Nachweis dafür, dass ein
Unteragent noch aktiv ist. Nicht beendete Läufe, die älter als das Stale-Run-Fenster sind,
zählen in `/subagents list`, Statuszusammenfassungen,
Descendant-Completion-Gating und sitzungsbezogenen Nebenläufigkeitsprüfungen
nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete nicht beendete wiederhergestellte Läufe bereinigt, sofern
ihre Kind-Sitzung nicht mit `abortedLastRun: true` markiert ist. Diese
durch Neustart abgebrochenen Kind-Sitzungen bleiben über den Orphan-Recovery-Flow
für Unteragenten wiederherstellbar, der vor dem Löschen der Abbruchmarkierung
eine synthetische Resume-Nachricht sendet.

Die automatische Neustart-Wiederherstellung ist pro Kind-Sitzung begrenzt. Wenn dasselbe
Unteragent-Kind innerhalb des schnellen Re-Wedge-Fensters wiederholt für die Orphan-Wiederherstellung
akzeptiert wird, speichert OpenClaw einen Recovery-Tombstone auf dieser
Sitzung und setzt die automatische Wiederaufnahme bei späteren Neustarts aus. Führen Sie
`openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder
`openclaw doctor --fix`, um veraltete Abbruch-Recovery-Flags auf
Sessions mit Tombstone zu löschen.

<Note>
Wenn das Spawnen eines Unteragenten mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Zustand bearbeiten.
Interne `sessions_spawn`-Koordination sollte sich als
`client.id: "gateway-client"` mit `client.mode: "backend"` über direkte
local loopback-Shared-Token-/Passwortauthentifizierung verbinden; dieser Pfad hängt nicht von der
Scope-Basislinie gekoppelter Geräte der CLI ab. Entfernte Aufrufer, explizite
`deviceIdentity`, explizite Device-Token-Pfade und Browser-/Node-Clients
benötigen weiterhin die normale Gerätefreigabe für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im Requester-Chat bricht die Requester-Sitzung ab und stoppt alle aktiven Unteragenten-Läufe, die daraus gespawnt wurden, einschließlich kaskadierender Beendigung verschachtelter Kinder.
- `/subagents kill <id>` stoppt einen bestimmten Unteragenten und wirkt kaskadierend auf seine Kinder.

## Einschränkungen

- Die Ankündigung von Unteragenten ist **Best-Effort**. Wenn der Gateway neu startet, geht ausstehende „announce back“-Arbeit verloren.
- Unteragenten teilen sich weiterhin dieselben Ressourcen des Gateway-Prozesses; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Kontext von Unteragenten injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Kinder pro Sitzung (Standard `5`, Bereich `1–20`).

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrund-Tasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
