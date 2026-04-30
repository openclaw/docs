---
read_when:
    - Sie möchten Hintergrund- oder Parallelarbeit über den Agenten ausführen
    - Sie ändern sessions_spawn oder die Richtlinie für Sub-Agent-Tools
    - Sie implementieren oder beheben Probleme mit threadgebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Isolierte Hintergrund-Agentenläufe starten, die Ergebnisse an den Chat der anfragenden Person zurückmelden
title: Unteragenten
x-i18n:
    generated_at: "2026-04-30T07:19:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agenten sind Hintergrund-Agent-Ausführungen, die aus einer bestehenden Agent-Ausführung heraus gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**melden** nach Abschluss ihr Ergebnis zurück an den Chat-Kanal des
Anforderers. Jede Sub-Agent-Ausführung wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Hauptziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne die Hauptausführung zu blockieren.
- Sub-Agenten standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agenten erhalten standardmäßig **keine** Sitzungs-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext
und Token-Verbrauch. Für aufwendige oder wiederkehrende Aufgaben legen Sie
für Sub-Agenten ein günstigeres Modell fest und behalten Sie für Ihren
Haupt-Agenten ein hochwertigeres Modell bei. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder agentenspezifische Überschreibungen.
Wenn ein untergeordneter Agent wirklich das aktuelle Transkript des
Anforderers benötigt, kann der Agent bei genau diesem Start
`context: "fork"` anfordern.
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

`/subagents info` zeigt Laufzeitmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine
begrenzte, sicherheitsgefilterte Rückrufansicht; prüfen Sie den
Transkriptpfad auf dem Datenträger, wenn Sie das vollständige Rohtranskript
benötigen.

### Thread-Bindungssteuerung

Diese Befehle funktionieren in Kanälen, die persistente Thread-Bindungen
unterstützen. Siehe [Kanäle mit Thread-Unterstützung](#thread-supporting-channels)
unten.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Startverhalten

`/subagents spawn` startet einen Hintergrund-Sub-Agenten als Benutzerbefehl
(nicht als internes Relay) und sendet eine abschließende Abschlussmeldung an
den Chat des Anforderers zurück, wenn die Ausführung endet.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Der Startbefehl ist nicht blockierend; er gibt sofort eine Ausführungs-ID zurück.
    - Nach Abschluss meldet der Sub-Agent eine Zusammenfassung/Ergebnismeldung zurück an den Chat-Kanal des Anforderers.
    - Der Abschluss ist push-basiert. Sobald der Sub-Agent gestartet ist, fragen Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife ab, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zum Debuggen oder Eingreifen.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand verfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Ablauf zur Ankündigungsbereinigung fortgesetzt wird.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw versucht zuerst die direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
    - Wenn die direkte Zustellung fehlschlägt, fällt es auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Meldung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Route des Anforderers bei: Thread-gebundene oder gesprächsgebundene Abschlussrouten haben Vorrang, wenn sie verfügbar sind; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anforderersitzung (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Die Abschlussübergabe an die Anforderersitzung ist zur Laufzeit erzeugter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — der neueste sichtbare `assistant`-Antworttext, andernfalls bereinigter neuester Tool-/toolResult-Text. Terminal fehlgeschlagene Ausführungen verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellanweisung, die dem anfordernden Agenten vorgibt, in normaler Assistentenstimme umzuformulieren (nicht rohe interne Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` und `--thinking` überschreiben die Standardwerte für diese konkrete Ausführung.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist der Einmalmodus (`mode: "run"`). Für persistente Thread-gebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit bewirbt. Siehe [ACP-Zustellmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht explizit ACP/acpx anfordert.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht in einer Sandbox läuft und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.list[]`-Eintrag mit `runtime.type="acp"`; verwenden Sie die Standard-Sub-Agent-Laufzeit für normale OpenClaw-Konfigurationsagenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agenten starten isoliert, sofern der Aufrufer nicht ausdrücklich
anfordert, das aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden sollten                                                                                                         | Verhalten                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext knapp beschrieben werden kann     | Erstellt ein sauberes untergeordnetes Transkript. Dies ist der Standard und hält den Token-Verbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, vorherigen Tool-Ergebnissen oder bereits im Anforderertranskript vorhandenen nuancierten Anweisungen abhängt | Verzweigt das Anforderertranskript in die untergeordnete Sitzung, bevor der untergeordnete Agent startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht,
nicht als Ersatz für eine klare Aufgabenbeschreibung.

## Tool: `sessions_spawn`

Startet eine Sub-Agent-Ausführung mit `deliver: false` auf der globalen
`subagent`-Lane, führt dann einen Meldeschritt aus und postet die
Meldeantwort in den Chat-Kanal des Anforderers.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab.
Die Profile `coding` und `full` stellen `sessions_spawn` standardmäßig
bereit. Das Profil `messaging` tut dies nicht; fügen Sie
`tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` hinzu
oder verwenden Sie `tools.profile: "coding"` für Agenten, die Arbeit delegieren
sollen. Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische
Allow-/Deny-Richtlinien können das Tool nach der Profilphase weiterhin
entfernen. Verwenden Sie `/tools` aus derselben Sitzung, um die effektive
Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Thinking:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Ausführungs-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, falls festgelegt; andernfalls fällt es auf `0` zurück (kein Timeout).

### Tool-Parameter

<ParamField path="task" type="string" required>
  Die Aufgabenbeschreibung für den Sub-Agenten.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agent-ID starten, wenn dies durch `subagents.allowAgents` erlaubt ist.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder explizit angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge gedacht, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Starts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt ACP-Ausführungsausgabe an die übergeordnete Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Starts weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Sub-Agent-Modell. Ungültige Werte werden übersprungen und der Sub-Agent läuft mit einer Warnung im Tool-Ergebnis auf dem Standardmodell.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt das Thinking-Level für die Sub-Agent-Ausführung.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn festgelegt, andernfalls `0`. Wenn festgelegt, wird die Sub-Agent-Ausführung nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird eine Kanal-Thread-Bindung für diese Sub-Agent-Sitzung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` und `mode` ausgelassen wird, wird `session` zum Standard. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert direkt nach der Meldung (behält das Transkript weiterhin per Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Start ab, sofern die Ziellaufzeit des untergeordneten Agenten nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die untergeordnete Sitzung. Nur native Sub-Agenten. Verwenden Sie `fork` nur, wenn der untergeordnete Agent das aktuelle Transkript benötigt.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Kanalzustellungsparameter (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die
Zustellung `message`/`sessions_send` aus der gestarteten Ausführung.
</Warning>

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an
einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in
diesem Thread weiterhin an dieselbe Sub-Agent-Sitzung geroutet werden.

### Kanäle mit Thread-Unterstützung

**Discord** ist derzeit der einzige unterstützte Kanal. Er unterstützt
persistente Thread-gebundene Sub-Agent-Sitzungen (`sessions_spawn` mit
`thread: true`), manuelle Thread-Steuerungen (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) und Adapter-Schlüssel
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` und
`channels.discord.threadBindings.spawnSubagentSessions`.

### Schnellablauf

<Steps>
  <Step title="Spawn">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw erstellt oder bindet einen Thread an dieses Sitzungsziel im aktiven Kanal.
  </Step>
  <Step title="Route follow-ups">
    Antworten und Folgenachrichten in diesem Thread werden an die gebundene Sitzung geroutet.
  </Step>
  <Step title="Inspect timeouts">
    Verwenden Sie `/session idle`, um die automatische Inaktivitäts-Aufhebung des Fokus zu prüfen/aktualisieren, und
    `/session max-age`, um die feste Obergrenze zu steuern.
  </Step>
  <Step title="Detach">
    Verwenden Sie `/unfocus`, um manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerungen

| Befehl            | Wirkung                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Sitzungsziel |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                       |
| `/agents`          | Listet aktive Läufe und den Bindungszustand auf (`thread:<id>` oder `unbound`)       |
| `/session idle`    | Prüft/aktualisiert das automatische Aufheben des Fokus bei Inaktivität (nur fokussierte gebundene Threads)         |
| `/session max-age` | Prüft/aktualisiert die feste Obergrenze (nur fokussierte gebundene Threads)                  |

### Konfigurationsschalter

- **Globale Standardeinstellung:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Schlüssel für Kanalüberschreibung und automatische Bindung beim Spawn** sind adapterspezifisch. Siehe oben [Thread-unterstützende Kanäle](#thread-supporting-channels).

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Positivliste

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste der Agent-IDs, die über explizites `agentId` adressiert werden können (`["*"]` erlaubt beliebige). Standard: nur der anfordernde Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Anforderer sich selbst mit `agentId` spawnen kann, nehmen Sie die Anforderer-ID in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Positivliste für Ziel-Agents, die verwendet wird, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` auslassen (erzwingt explizite Profilauswahl). Überschreibung pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die Anforderer-Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox ausgeführt würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive
Modell jedes aufgeführten Agents und eingebettete Laufzeit-Metadaten, sodass Aufrufer Pi, den Codex
App-Server und andere konfigurierte native Laufzeiten unterscheiden können.

### Automatische Archivierung

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` (Standard `60`) automatisch archiviert.
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (gleicher Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (behält das Transkript weiterhin per Umbenennung).
- Die automatische Archivierung erfolgt nach bestem Aufwand; ausstehende Timer gehen verloren, wenn der Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von der Archivbereinigung getrennt: Verfolgte Browser-Tabs/-Prozesse werden nach bestem Aufwand geschlossen, wenn der Lauf endet, auch wenn das Transkript/der Sitzungseintrag beibehalten wird.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents spawnen
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Verschachtelungsebene zu aktivieren — das **Orchestrator-Muster**: Haupt-Agent → Orchestrator-Sub-Agent →
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

| Tiefe | Form des Sitzungsschlüssels                            | Rolle                                          | Kann spawnen?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                    | Immer                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Nie                        |

### Ankündigungskette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 beendet sich → kündigt beim übergeordneten Element an (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet sich → kündigt beim Haupt-Agent an.
3. Haupt-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten Kinder.

<Note>
**Betriebliche Hinweise:** Starten Sie Kindarbeit einmal und warten Sie auf Abschlussereignisse,
anstatt Polling-Schleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten Kind-Sitzungsbeziehungen
auf laufende Arbeit fokussiert — laufende Kinder bleiben angehängt, beendete Kinder bleiben
für ein kurzes aktuelles Zeitfenster sichtbar, und veraltete, nur im Speicher vorhandene Kind-Links werden
nach ihrem Frischefenster ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`- /
`parentSessionKey`-Metadaten nach einem Neustart Geisterkinder wiederherstellen. Wenn ein Abschlussereignis eines Kindes eintrifft, nachdem Sie bereits die
endgültige Antwort gesendet haben, ist die korrekte Folgeaktion das exakte stumme Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rollen- und Steuerungsumfang werden beim Spawnen in die Sitzungsmetadaten geschrieben. Dadurch wird verhindert, dass flache oder wiederhergestellte Sitzungsschlüssel versehentlich Orchestrator-Privilegien zurückerhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Kinder verwalten kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Sitzungs-Tools — `sessions_spawn` wird in Tiefe 2 immer verweigert. Kann keine weiteren Kinder spawnen.

### Spawn-Limit pro Agent

Jede Agent-Sitzung (in beliebiger Tiefe) kann höchstens `maxChildrenPerAgent`
(Standard `5`) aktive Kinder gleichzeitig haben. Dies verhindert unkontrolliertes Fan-out
von einem einzelnen Orchestrator.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Kinder der Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agents der Tiefe 1 und kaskadiert zu deren Kindern der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen Kindern.
- `/subagents kill all` stoppt alle Sub-Agents für den Anforderer und kaskadiert.

## Authentifizierung

Sub-Agent-Authentifizierung wird nach **Agent-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sub-Agent-Sitzungsschlüssel ist `agent:<agentId>:subagent:<uuid>`.
- Der Authentifizierungsspeicher wird aus dem `agentDir` dieses Agents geladen.
- Die Authentifizierungsprofile des Haupt-Agents werden als **Fallback** zusammengeführt; Agent-Profile überschreiben Hauptprofile bei Konflikten.

Die Zusammenführung ist additiv, sodass Hauptprofile immer als
Fallbacks verfügbar sind. Vollständig isolierte Authentifizierung pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agents melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht der Anforderer-Sitzung).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistant-Text das exakte stumme Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Anforderer-Tiefe ab:

- Anforderer-Sitzungen der obersten Ebene verwenden einen Folge-`agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Anforderer-Sub-Agent-Sitzungen erhalten eine interne Folgeinjektion (`deliver=false`), damit der Orchestrator Kind-Ergebnisse innerhalb der Sitzung synthetisieren kann.
- Wenn eine verschachtelte Anforderer-Sub-Agent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw auf den Anforderer dieser Sitzung zurück, sofern verfügbar.

Für Anforderer-Sitzungen der obersten Ebene löst die direkte Zustellung im Abschlussmodus zuerst
jede gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und füllt dann
fehlende Kanalzielfelder aus der gespeicherten Route der Anforderer-Sitzung.
So bleiben Abschlüsse im richtigen Chat/Thema, auch wenn der Abschlussursprung
nur den Kanal identifiziert.

Die Aggregation von Kind-Abschlüssen ist beim Erstellen verschachtelter Abschlussbefunde auf den aktuellen Anforderer-Lauf begrenzt, wodurch verhindert wird, dass Kind-Ausgaben aus veralteten früheren Läufen in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten
Thread-/Themen-Routing bei, wenn es auf Kanaladaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld          | Quelle                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                          |
| Sitzungs-IDs    | Kind-Sitzungsschlüssel/-ID                                                                                          |
| Typ           | Ankündigungstyp + Aufgabenlabel                                                                                    |
| Status         | Aus dem Laufzeitergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistant-Text, andernfalls bereinigter neuester Tool-/toolResult-Text                                |
| Folgeaktion      | Anweisung, die beschreibt, wann geantwortet bzw. stumm geblieben werden soll                                                           |

Terminal fehlgeschlagene Läufe melden den Fehlerstatus, ohne erfassten
Antworttext erneut wiederzugeben. Bei Timeout kann die Ankündigung, wenn das Kind nur bis zu Tool-Aufrufen gekommen ist,
diesen Verlauf zu einer kurzen Zusammenfassung des Teilfortschritts verdichten,
anstatt rohe Tool-Ausgabe wiederzugeben.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Haupt-Agent den Verlauf über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistant-Stimme neu formuliert werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistant-Erinnerung wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`- / `<relevant_memories>`-Gerüst entfernt; Klartext-Tool-Call-XML-Payload-Blöcke (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; herabgestuftes Tool-Call-/Ergebnisgerüst und historische Kontextmarker entfernt; durchgesickerte Modell-Steuerungstokens (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Anmeldedaten-/tokenähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die Prüfung des rohen Transkripts auf der Festplatte ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Sub-Agents verwenden zuerst dieselbe Profil- und Tool-Richtlinien-Pipeline wie der übergeordnete oder
Ziel-Agent. Danach wendet OpenClaw die Sub-Agent-Einschränkungsschicht an.

Ohne restriktives `tools.profile` erhalten Sub-Agents **alle Tools außer
Sitzungs-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Erinnerungsansicht — es
ist kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agents der Tiefe 1 zusätzlich
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

`tools.subagents.tools.allow` ist ein abschließender Allow-Only-Filter. Er kann
die bereits aufgelöste Tool-Menge einschränken, aber er kann kein Tool
**wieder hinzufügen**, das durch `tools.profile` entfernt wurde. Zum Beispiel
enthält `tools.profile: "coding"` `web_search`/`web_fetch`, aber nicht das Tool
`browser`. Damit Sub-Agents mit Coding-Profil Browser-Automatisierung verwenden
können, fügen Sie `browser` in der Profilphase hinzu:

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

## Parallelität

Sub-Agents verwenden eine eigene prozessinterne Queue-Lane:

- **Lane-Name:** `subagent`
- **Parallelität:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Aktivitätsstatus und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein
Sub-Agent noch aktiv ist. Nicht beendete Ausführungen, die älter als das Zeitfenster für veraltete Ausführungen sind,
zählen in `/subagents list`, Statuszusammenfassungen,
Abschluss-Gating für Nachkommen und Parallelitätsprüfungen pro Sitzung nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Ausführungen entfernt, es sei denn,
ihre untergeordnete Sitzung ist mit `abortedLastRun: true` markiert. Diese
beim Neustart abgebrochenen untergeordneten Sitzungen bleiben über den Wiederherstellungsablauf für verwaiste Sub-Agents
wiederherstellbar; dieser sendet eine synthetische Fortsetzungsnachricht, bevor
die Abbruchmarkierung entfernt wird.

<Note>
Wenn das Starten eines Sub-Agents mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Status bearbeiten.
Interne `sessions_spawn`-Koordination sollte sich als
`client.id: "gateway-client"` mit `client.mode: "backend"` über direkte
local loopback-Shared-Token-/Passwort-Authentifizierung verbinden; dieser Pfad hängt nicht von der
Scope-Baseline des gekoppelten CLI-Geräts ab. Remote-Aufrufer, explizite
`deviceIdentity`, explizite Geräte-Token-Pfade und Browser-/Node-Clients
benötigen weiterhin die normale Gerätefreigabe für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im anfordernden Chat bricht die anfordernde Sitzung ab und stoppt alle daraus gestarteten aktiven Sub-Agent-Ausführungen, einschließlich kaskadierender Beendigung verschachtelter untergeordneter Ausführungen.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu dessen untergeordneten Ausführungen.

## Einschränkungen

- Die Sub-Agent-Ankündigung erfolgt **nach bestem Aufwand**. Wenn das Gateway neu startet, gehen ausstehende „announce back“-Aufgaben verloren.
- Sub-Agents teilen weiterhin dieselben Gateway-Prozessressourcen; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Sub-Agent-Kontext injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive untergeordnete Ausführungen pro Sitzung (Standard `5`, Bereich `1–20`).

## Verwandte Themen

- [ACP-Agents](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrundaufgaben](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
