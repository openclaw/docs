---
read_when:
    - Sie möchten Hintergrundarbeit oder parallele Arbeit über den Agenten ausführen
    - Sie ändern `sessions_spawn` oder die Richtlinie für Sub-Agent-Tools
    - Sie implementieren oder beheben Probleme bei threadgebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Isolierte Agent-Ausführungen im Hintergrund starten, die Ergebnisse an den Chat der anfragenden Person zurückmelden
title: Sub-Agenten
x-i18n:
    generated_at: "2026-05-04T02:26:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0df39e06b952def3eb0b296f36c7dc8c0b0a115785d865236a970c5d453fc37
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agents sind Hintergrund-Agentenläufe, die aus einem bestehenden Agentenlauf gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**kündigen** nach Abschluss ihr Ergebnis im Chat-Kanal des Anforderers an.
Jeder Sub-Agent-Lauf wird als
[Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Primäre Ziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungs-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext
und Token-Verbrauch. Legen Sie für aufwendige oder repetitive Aufgaben ein
günstigeres Modell für Sub-Agents fest und behalten Sie Ihren Haupt-Agenten
auf einem hochwertigeren Modell. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder über agentenspezifische Overrides. Wenn ein Kind
    tatsächlich das aktuelle Transkript des Anforderers benötigt, kann der Agent
    für diesen einen Spawn `context: "fork"` anfordern. Thread-gebundene Sub-Agent-Sitzungen verwenden standardmäßig
    `context: "fork"`, weil sie die aktuelle Unterhaltung in einen
    Folge-Thread verzweigen.
</Note>

## Slash-Befehl

Verwenden Sie `/subagents`, um Sub-Agent-Läufe für die **aktuelle
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

Verwenden Sie den Top-Level-Befehl [`/steer <message>`](/de/tools/steer), um den aktiven Lauf der aktuellen Anforderer-Sitzung zu steuern. Verwenden Sie `/subagents steer <id|#> <message>`, wenn das Ziel ein Kindlauf ist.

`/subagents info` zeigt Lauf-Metadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Erinnerungsansicht; prüfen Sie den Transkriptpfad auf dem Datenträger, wenn Sie
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
interne Weiterleitung) und sendet eine abschließende Abschlussaktualisierung zurück an den
Anforderer-Chat, wenn der Lauf beendet ist.

<AccordionGroup>
  <Accordion title="Nicht blockierender, push-basierter Abschluss">
    - Der Spawn-Befehl ist nicht blockierend; er gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss kündigt der Sub-Agent eine Zusammenfassung/Ergebnisnachricht zurück im Chat-Kanal des Anforderers an.
    - Der Abschluss ist push-basiert. Nach dem Starten sollten Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife abfragen, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zum Debuggen oder Eingreifen.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand nachverfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Ankündigungs-Bereinigungsablauf fortgesetzt wird.

  </Accordion>
  <Accordion title="Ausfallsicherheit bei manuell gestarteter Zustellung">
    - OpenClaw versucht zuerst die direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
    - Wenn die direkte Zustellung fehlschlägt, fällt es auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Ankündigung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Anforderer-Route bei: Thread-gebundene oder unterhaltungsgebundene Abschlussrouten gewinnen, wenn sie verfügbar sind; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anforderer-Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), sodass die direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten für Abschlussübergabe">
    Die Abschlussübergabe an die Anforderer-Sitzung ist zur Laufzeit erzeugter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — den neuesten sichtbaren `assistant`-Antworttext, andernfalls bereinigten neuesten Tool-/toolResult-Text. Terminal fehlgeschlagene Läufe verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellungsanweisung, die dem Anforderer-Agenten mitteilt, in normaler Assistant-Stimme umzuschreiben (keine rohen internen Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben die Standards für diesen spezifischen Lauf.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist ein Einmalmodus (`mode: "run"`). Verwenden Sie für persistente Thread-gebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit bewirbt. Siehe [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen Eintrag `agents.list[]` mit `runtime.type="acp"`; verwenden Sie die Standard-Sub-Agent-Laufzeit für normale OpenClaw-Konfigurationsagenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich anfordert, das
aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden sollten                                                                                                        | Verhalten                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext knapp erklärt werden kann        | Erstellt ein sauberes Kindtranskript. Dies ist der Standard und hält den Token-Verbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, vorherigen Tool-Ergebnissen oder nuancierten Anweisungen abhängt, die bereits im Anforderer-Transkript vorhanden sind | Verzweigt das Anforderer-Transkript in die Kind-Sitzung, bevor das Kind startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegierung gedacht, nicht als
Ersatz für einen klaren Aufgaben-Prompt.

## Tool: `sessions_spawn`

Startet einen Sub-Agent-Lauf mit `deliver: false` auf der globalen `subagent`-Lane,
führt dann einen Ankündigungsschritt aus und postet die Ankündigungsantwort in den
Chat-Kanal des Anforderers.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab. Die Profile `coding` und
`full` stellen `sessions_spawn` standardmäßig bereit. Das Profil `messaging`
tut dies nicht; fügen Sie `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agenten, die Arbeit
delegieren sollen. Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische Allow-/Deny-Richtlinien können
das Tool nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standards:**

- **Modell:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` festlegen (oder agentenspezifisch `agents.list[].subagents.model`); ein explizites `sessions_spawn.model` gewinnt weiterhin.
- **Thinking:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` festlegen (oder agentenspezifisch `agents.list[].subagents.thinking`); ein explizites `sessions_spawn.thinking` gewinnt weiterhin.
- **Lauf-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, falls gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

### Tool-Parameter

<ParamField path="task" type="string" required>
  Die Aufgabenbeschreibung für den Sub-Agent.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agenten-ID starten, wenn dies durch `subagents.allowAgents` erlaubt ist.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesse (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Spawns ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die übergeordnete Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Spawns weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Sub-Agent-Modell. Ungültige Werte werden übersprungen und der Sub-Agent läuft mit einer Warnung im Tool-Ergebnis auf dem Standardmodell.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt die Thinking-Stufe für den Sub-Agent-Lauf.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird der Sub-Agent-Lauf nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, fordert dies eine Kanal-Thread-Bindung für diese Sub-Agent-Sitzung an.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` und `mode` ausgelassen wird, wird der Standard zu `session`. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert unmittelbar nach der Ankündigung (behält das Transkript trotzdem per Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Spawn ab, sofern die Ziel-Kindlaufzeit nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die Kind-Sitzung. Nur native Sub-Agents. Thread-gebundene Spawns verwenden standardmäßig `fork`; nicht Thread-gebundene Spawns standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Parameter für Kanalzustellung (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die Zustellung
`message`/`sessions_send` aus dem gestarteten Lauf.
</Warning>

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an
einen Thread gebunden bleiben, sodass Folge-Nachrichten von Benutzern in diesem Thread weiterhin an dieselbe
Sub-Agent-Sitzung weitergeleitet werden.

### Thread-unterstützende Kanäle

**Discord** ist derzeit der einzige unterstützte Kanal. Er unterstützt
persistente Thread-gebundene Sub-Agent-Sitzungen (`sessions_spawn` mit
`thread: true`), manuelle Thread-Steuerungen (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) und Adapter-Schlüssel
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` und
`channels.discord.threadBindings.spawnSessions`.

### Schnellablauf

<Steps>
  <Step title="Starten">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt oder bindet einen Thread an dieses Sitzungsziel im aktiven Kanal.
  </Step>
  <Step title="Folgenachrichten weiterleiten">
    Antworten und Folge-Nachrichten in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Timeouts prüfen">
    Verwenden Sie `/session idle`, um automatisches Unfocus bei Inaktivität zu prüfen/aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerungen

| Befehl            | Wirkung                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Sitzungsziel |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                       |
| `/agents`          | Listet aktive Ausführungen und den Bindungsstatus auf (`thread:<id>` oder `unbound`)       |
| `/session idle`    | Idle-Auto-Unfocus prüfen/aktualisieren (nur fokussierte gebundene Threads)         |
| `/session max-age` | Hard Cap prüfen/aktualisieren (nur fokussierte gebundene Threads)                  |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Channel-Override und Spawn-Auto-Bind-Schlüssel** sind adapter-spezifisch. Siehe [Thread-unterstützende Channels](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste von Agent-IDs, die über explizites `agentId` als Ziel verwendet werden können (`["*"]` erlaubt beliebige). Standard: nur der anfragende Agent. Wenn Sie eine Liste festlegen und trotzdem möchten, dass der Anfragende sich selbst mit `agentId` starten kann, nehmen Sie die ID des Anfragenden in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist für Ziel-Agenten, die verwendet wird, wenn der anfragende Agent kein eigenes `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` weglassen (erzwingt explizite Profilauswahl). Override pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die Sitzung des Anfragenden sandboxed ist, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox laufen würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive
Modell jedes aufgeführten Agenten und eingebettete Laufzeitmetadaten, damit Aufrufer Pi, Codex
App-Server und andere konfigurierte native Laufzeiten unterscheiden können.

### Automatische Archivierung

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard `60`).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (gleicher Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (behält das Transkript trotzdem per Umbenennung).
- Automatische Archivierung ist bestmöglich; ausstehende Timer gehen verloren, wenn der Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur die Ausführung. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von Archivbereinigung getrennt: Verfolgte Browser-Tabs/-Prozesse werden bestmöglich geschlossen, wenn die Ausführung endet, auch wenn der Transkript-/Sitzungsdatensatz behalten wird.

## Verschachtelte Sub-Agenten

Standardmäßig können Sub-Agenten keine eigenen Sub-Agenten starten
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene der
Verschachtelung zu aktivieren — das **Orchestrator-Muster**: Haupt → Orchestrator-Sub-Agent →
Worker-Sub-Sub-Agenten.

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

| Tiefe | Form des Sitzungsschlüssels                 | Rolle                                         | Kann starten?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                   | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Nie                          |

### Ankündigungskette

Ergebnisse fließen entlang der Kette zurück:

1. Worker der Tiefe 2 beendet → kündigt an seinen Parent an (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet → kündigt an Haupt an.
3. Haupt-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten Children.

<Note>
**Betriebliche Anleitung:** Starten Sie Child-Arbeit einmal und warten Sie auf Abschlussereignisse,
anstatt Polling-Schleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten Child-Sitzungsbeziehungen
auf Live-Arbeit fokussiert — Live-Children bleiben angehängt, beendete Children bleiben
für ein kurzes aktuelles Fenster sichtbar, und veraltete reine Store-Child-Links werden
nach ihrem Aktualitätsfenster ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`-/
`parentSessionKey`-Metadaten nach einem Neustart Ghost-Children wiederbeleben.
Wenn ein Child-Abschlussereignis eintrifft, nachdem Sie bereits die
finale Antwort gesendet haben, ist die korrekte Nachfolge der exakte stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Kontrollumfang werden zum Spawn-Zeitpunkt in die Sitzungsmetadaten geschrieben. Dadurch wird verhindert, dass flache oder wiederhergestellte Sitzungsschlüssel versehentlich Orchestrator-Berechtigungen zurückerlangen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Children verwalten kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Sitzungs-Tools — `sessions_spawn` wird bei Tiefe 2 immer verweigert. Kann keine weiteren Children starten.

### Spawn-Limit pro Agent

Jede Agent-Sitzung (in beliebiger Tiefe) kann höchstens `maxChildrenPerAgent`
(Standard `5`) aktive Children gleichzeitig haben. Das verhindert unkontrolliertes Fan-out
durch einen einzelnen Orchestrator.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Children der Tiefe 2:

- `/stop` im Haupt-Chat stoppt alle Agenten der Tiefe 1 und kaskadiert zu ihren Children der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Children.
- `/subagents kill all` stoppt alle Sub-Agenten für den Anfragenden und kaskadiert.

## Authentifizierung

Sub-Agent-Auth wird nach **Agent-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sub-Agent-Sitzungsschlüssel ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Haupt-Agenten werden als **Fallback** zusammengeführt; Agent-Profile überschreiben Hauptprofile bei Konflikten.

Die Zusammenführung ist additiv, sodass Hauptprofile immer als
Fallbacks verfügbar sind. Vollständig isolierte Auth pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agenten melden über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht der Sitzung des Anfragenden).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistententext der exakte stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, auch wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Tiefe des Anfragenden ab:

- Top-Level-Sitzungen des Anfragenden verwenden einen Follow-up-`agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte anfragende Sub-Agent-Sitzungen erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Child-Ergebnisse innerhalb der Sitzung synthetisieren kann.
- Wenn eine verschachtelte anfragende Sub-Agent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw auf den Anfragenden dieser Sitzung zurück, sofern verfügbar.

Für Top-Level-Sitzungen des Anfragenden löst die direkte Zustellung im Abschlussmodus zuerst
jede gebundene Konversations-/Thread-Route und jeden Hook-Override auf und füllt dann
fehlende Channel-Zielfelder aus der gespeicherten Route der Sitzung des Anfragenden.
So bleiben Abschlüsse im richtigen Chat/Thema, auch wenn der Abschlussursprung
nur den Channel identifiziert.

Die Child-Abschlussaggregation ist beim Erstellen verschachtelter Abschlussbefunde
auf die aktuelle Ausführung des Anfragenden begrenzt, wodurch verhindert wird, dass veraltete Child-
Ausgaben aus früheren Ausführungen in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten
Thread-/Themen-Routing bei, wenn es auf Channel-Adaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird auf einen stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                          |
| Sitzungs-IDs   | Child-Sitzungsschlüssel/-ID                                                                                          |
| Typ            | Ankündigungstyp + Aufgabenlabel                                                                                    |
| Status         | Aus Laufzeitergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext erschlossen |
| Ergebnisinhalt | Neuester sichtbarer Assistententext, andernfalls bereinigter neuester Tool-/toolResult-Text                                |
| Follow-up      | Anweisung, die beschreibt, wann geantwortet bzw. still geblieben werden soll                                                           |

Terminal fehlgeschlagene Ausführungen melden den Fehlerstatus, ohne erfassten
Antworttext erneut abzuspielen. Bei Timeout kann die Ankündigung, wenn das Child nur bis zu Tool-Aufrufen gekommen ist,
diese Historie zu einer kurzen Teilfortschrittszusammenfassung zusammenfassen, anstatt rohe Tool-Ausgabe erneut abzuspielen.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Haupt-Agent die Historie über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerorientierte Antworten
sollten in normaler Assistentenstimme neu geschrieben werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistenten-Recall wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`-/`<relevant_memories>`-Gerüst entfernt; Klartext-Tool-Call-XML-Payload-Blöcke (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; herabgestuftes Tool-Call-/Result-Gerüst und historische Kontextmarker entfernt; durchgesickerte Modell-Steuertoken (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Credential-/Token-ähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Historien können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die Prüfung des rohen On-Disk-Transkripts ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Sub-Agenten verwenden zuerst dieselbe Profil- und Tool-Policy-Pipeline wie der Parent- oder
Ziel-Agent. Danach wendet OpenClaw die Sub-Agent-Einschränkungs-
schicht an.

Ohne einschränkendes `tools.profile` erhalten Sub-Agenten **alle Tools außer
Sitzungs-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht — es
ist kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agenten der Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre Children verwalten können.

### Override über Konfiguration

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

`tools.subagents.tools.allow` ist ein abschließender Allow-Only-Filter. Er kann den bereits aufgelösten Tool-Satz einschränken, aber kein Tool **wieder hinzufügen**, das durch `tools.profile` entfernt wurde. Beispielsweise enthält `tools.profile: "coding"` `web_search`/`web_fetch`, aber nicht das Tool `browser`. Damit Unteragenten mit Coding-Profil Browser-Automatisierung verwenden können, fügen Sie browser in der Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie `agents.list[].tools.alsoAllow: ["browser"]` pro Agent, wenn nur ein Agent Browser-Automatisierung erhalten soll.

## Nebenläufigkeit

Unteragenten verwenden eine dedizierte In-Process-Warteschlangen-Lane:

- **Lane-Name:** `subagent`
- **Nebenläufigkeit:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Nachweis dafür, dass ein Unteragent noch aktiv ist. Nicht beendete Läufe, die älter als das Zeitfenster für veraltete Läufe sind, zählen in `/subagents list`, Statuszusammenfassungen, Abschluss-Gating für Nachkommen und sitzungsbezogenen Nebenläufigkeitsprüfungen nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Läufe bereinigt, sofern ihre untergeordnete Sitzung nicht als `abortedLastRun: true` markiert ist. Diese durch den Neustart abgebrochenen untergeordneten Sitzungen bleiben über den Orphan-Wiederherstellungsfluss für Unteragenten wiederherstellbar, der eine synthetische Resume-Nachricht sendet, bevor die Abbruchmarkierung gelöscht wird.

Die automatische Neustartwiederherstellung ist pro untergeordneter Sitzung begrenzt. Wenn derselbe untergeordnete Unteragent innerhalb des schnellen Re-Wedge-Zeitfensters wiederholt für die Orphan-Wiederherstellung akzeptiert wird, speichert OpenClaw einen Wiederherstellungs-Tombstone für diese Sitzung und nimmt sie bei späteren Neustarts nicht mehr automatisch wieder auf. Führen Sie `openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder `openclaw doctor --fix`, um veraltete abgebrochene Wiederherstellungs-Flags auf Tombstone-Sitzungen zu löschen.

<Note>
Wenn das Starten eines Unteragenten mit Gateway `PAIRING_REQUIRED` / `scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Status bearbeiten. Interne `sessions_spawn`-Koordination sollte sich als `client.id: "gateway-client"` mit `client.mode: "backend"` über direkte loopback-Authentifizierung mit gemeinsamem Token/Passwort verbinden; dieser Pfad hängt nicht von der Scope-Baseline der gekoppelten Geräte der CLI ab. Remote-Aufrufer, explizite `deviceIdentity`, explizite Gerätetoken-Pfade und Browser-/Node-Clients benötigen weiterhin die normale Gerätegenehmigung für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im Anforderer-Chat bricht die Anforderer-Sitzung ab und stoppt alle aktiven Unteragenten-Läufe, die von ihr gestartet wurden, kaskadierend bis zu verschachtelten untergeordneten Läufen.
- `/subagents kill <id>` stoppt einen bestimmten Unteragenten und kaskadiert zu seinen untergeordneten Läufen.

## Einschränkungen

- Die Ankündigung von Unteragenten erfolgt **nach bestem Bemühen**. Wenn der Gateway neu startet, geht ausstehende „announce back“-Arbeit verloren.
- Unteragenten teilen sich weiterhin dieselben Ressourcen des Gateway-Prozesses; betrachten Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Kontext von Unteragenten injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive untergeordnete Läufe pro Sitzung (Standard `5`, Bereich `1–20`).

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrundtasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
