---
read_when:
    - Sie möchten Hintergrund- oder Parallelaufgaben über den Agenten ausführen
    - Sie ändern sessions_spawn oder die Richtlinie für Sub-Agent-Tools
    - Sie implementieren oder beheben Probleme bei threadgebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Starten Sie isolierte Agentenläufe im Hintergrund, die Ergebnisse an den anfragenden Chat zurückmelden
title: Sub-Agenten
x-i18n:
    generated_at: "2026-05-02T06:48:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

Unteragenten sind Hintergrund-Agentenläufe, die aus einem bestehenden Agentenlauf gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**melden** ihr Ergebnis nach Abschluss an den anfordernden Chat-
Kanal zurück. Jeder Unteragentenlauf wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Primäre Ziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne den Hauptlauf zu blockieren.
- Unteragenten standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Unteragenten erhalten standardmäßig **keine** Sitzungstools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Unteragent hat standardmäßig seinen eigenen Kontext
und Token-Verbrauch. Legen Sie für aufwendige oder wiederkehrende Aufgaben ein
günstigeres Modell für Unteragenten fest und behalten Sie für Ihren Hauptagenten
ein hochwertigeres Modell bei. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder agentenspezifische Überschreibungen.
Wenn ein untergeordneter Agent tatsächlich das aktuelle Transkript des
Anforderers benötigt, kann der Agent für diesen einen Start
`context: "fork"` anfordern. Threadgebundene Unteragentensitzungen verwenden
standardmäßig `context: "fork"`, weil sie die aktuelle Unterhaltung in einen
Folgethread verzweigen.
</Note>

## Slash-Befehl

Verwenden Sie `/subagents`, um Unteragentenläufe für die **aktuelle
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

`/subagents info` zeigt Laufmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine
begrenzte, sicherheitsgefilterte Abrufansicht; prüfen Sie den Transkriptpfad
auf der Festplatte, wenn Sie das rohe vollständige Transkript benötigen.

### Steuerung der Threadbindung

Diese Befehle funktionieren in Kanälen, die persistente Threadbindungen
unterstützen. Siehe [Thread-unterstützende Kanäle](#thread-supporting-channels) unten.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Startverhalten

`/subagents spawn` startet einen Hintergrund-Unteragenten als Benutzerbefehl
(nicht als internes Relay) und sendet nach Abschluss des Laufs eine finale
Abschlussmeldung an den anfordernden Chat zurück.

<AccordionGroup>
  <Accordion title="Nicht blockierender, pushbasierter Abschluss">
    - Der Startbefehl ist nicht blockierend; er gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss meldet der Unteragent eine Zusammenfassung/Ergebnisnachricht an den anfordernden Chat-Kanal zurück.
    - Der Abschluss ist pushbasiert. Nach dem Start dürfen Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife abfragen, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zum Debuggen oder Eingreifen.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand nachverfolgte Browser-Tabs/Prozesse, die von dieser Unteragentensitzung geöffnet wurden, bevor der Ablauf zur Ankündigungsbereinigung fortgesetzt wird.

  </Accordion>
  <Accordion title="Zustellresilienz bei manuellem Start">
    - OpenClaw versucht zuerst eine direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
    - Wenn die direkte Zustellung fehlschlägt, fällt es auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Ankündigung mit kurzem exponentiellem Backoff wiederholt, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Anfordererroute bei: threadgebundene oder unterhaltungsgebundene Abschlussrouten haben Vorrang, wenn sie verfügbar sind; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anforderersitzung (`lastChannel` / `lastTo` / `lastAccountId`), damit die direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Abschlussübergabe">
    Die Abschlussübergabe an die Anforderersitzung ist zur Laufzeit erzeugter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — neuester sichtbarer `assistant`-Antworttext, andernfalls bereinigter neuester Tool-/toolResult-Text. Terminal fehlgeschlagene Läufe verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellanweisung, die den anfordernden Agenten anweist, in normaler Assistant-Stimme umzuschreiben (keine rohen internen Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben die Standardwerte für diesen spezifischen Lauf.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist ein Einmalmodus (`mode: "run"`). Für persistente threadgebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) verwenden Sie `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit angibt. Siehe [ACP-Zustellmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Threadsteuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw verbirgt `runtime: "acp"`, bis ACP aktiviert ist, der Anforderer nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.list[]`-Eintrag mit `runtime.type="acp"`; verwenden Sie die Standard-Unteragentenlaufzeit für normale OpenClaw-Konfigurationsagenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Unteragenten starten isoliert, sofern der Aufrufer nicht ausdrücklich
anfordert, das aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden sollten                                                                                                         | Verhalten                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext ausreichend beschrieben werden kann | Erstellt ein sauberes untergeordnetes Transkript. Dies ist der Standard und hält die Token-Nutzung niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder differenzierten Anweisungen abhängt, die bereits im Anforderertranskript vorhanden sind | Verzweigt das Anforderertranskript in die untergeordnete Sitzung, bevor der untergeordnete Agent startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht,
nicht als Ersatz für das Schreiben eines klaren Aufgabenprompts.

## Tool: `sessions_spawn`

Startet einen Unteragentenlauf mit `deliver: false` auf der globalen
`subagent`-Spur, führt dann einen Ankündigungsschritt aus und postet die
Ankündigungsantwort an den anfordernden Chat-Kanal.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab.
Die Profile `coding` und `full` stellen `sessions_spawn` standardmäßig bereit.
Das Profil `messaging` tut dies nicht; fügen Sie
`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agenten,
die Arbeit delegieren sollen. Kanal-/Gruppen-, Provider-, Sandbox- und
agentenspezifische Zulassen-/Verweigern-Richtlinien können das Tool nach der
Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Thinking:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Laufzeitüberschreitung:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

### Tool-Parameter

<ParamField path="task" type="string" required>
  Die Aufgabenbeschreibung für den Unteragenten.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agenten-ID starten, wenn dies durch `subagents.allowAgents` erlaubt ist.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder explizit angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge vorgesehen, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Unteragentenstarts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die übergeordnete Sitzung, wenn `runtime: "acp"`; bei nativen Unteragentenstarts auslassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Unteragentenmodell. Ungültige Werte werden übersprungen, und der Unteragent läuft mit einer Warnung im Tool-Ergebnis auf dem Standardmodell.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt das Thinking-Level für den Unteragentenlauf.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird der Unteragentenlauf nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, fordert es eine Kanal-Threadbindung für diese Unteragentensitzung an.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` und `mode` ausgelassen wird, wird der Standardwert zu `session`. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert unmittelbar nach der Ankündigung (behält das Transkript weiterhin per Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Start ab, sofern die Ziellaufzeit des untergeordneten Agenten nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die untergeordnete Sitzung. Nur native Unteragenten. Threadgebundene Starts verwenden standardmäßig `fork`; nicht threadgebundene Starts verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Kanalzustellungsparameter (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die
Zustellung `message`/`sessions_send` aus dem gestarteten Lauf.
</Warning>

## Threadgebundene Sitzungen

Wenn Threadbindungen für einen Kanal aktiviert sind, kann ein Unteragent an
einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in
diesem Thread weiterhin an dieselbe Unteragentensitzung geroutet werden.

### Thread-unterstützende Kanäle

**Discord** ist derzeit der einzige unterstützte Kanal. Er unterstützt
persistente threadgebundene Unteragentensitzungen (`sessions_spawn` mit
`thread: true`), manuelle Threadsteuerungen (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) und Adapter-Schlüssel
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` und
`channels.discord.threadBindings.spawnSessions`.

### Schneller Ablauf

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
    Verwenden Sie `/session idle`, um die automatische Inaktivitäts-Aufhebung des Fokus zu prüfen/aktualisieren, und
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
| `/agents`          | Listet aktive Läufe und den Bindungsstatus auf (`thread:<id>` oder `unbound`)       |
| `/session idle`    | Prüft/aktualisiert automatisches Unfocus bei Inaktivität (nur fokussierte gebundene Threads)         |
| `/session max-age` | Prüft/aktualisiert die harte Obergrenze (nur fokussierte gebundene Threads)                  |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Channel-Override- und Spawn-Auto-Bind-Schlüssel** sind adapterspezifisch. Siehe [Thread-unterstützende Channels](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste von Agent-IDs, die über explizites `agentId` als Ziel verwendet werden können (`["*"]` erlaubt beliebige). Standard: nur der anfordernde Agent. Wenn Sie eine Liste festlegen und dennoch möchten, dass der Anforderer sich selbst mit `agentId` starten kann, nehmen Sie die Anforderer-ID in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist für Ziel-Agents, die verwendet wird, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` auslassen (erzwingt explizite Profilauswahl). Override pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die Anforderer-Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab,
die unsandboxed laufen würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive
Modell jedes aufgelisteten Agents und eingebettete Runtime-Metadaten, damit Aufrufer PI, Codex
App-Server und andere konfigurierte native Runtimes unterscheiden können.

### Automatische Archivierung

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard `60`).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (gleicher Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (das Transkript bleibt per Umbenennung erhalten).
- Die automatische Archivierung erfolgt nach bestem Aufwand; ausstehende Timer gehen verloren, wenn das Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Die Browser-Bereinigung ist von der Archivbereinigung getrennt: nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Aufwand geschlossen, wenn der Lauf endet, selbst wenn der Transkript-/Sitzungsdatensatz erhalten bleibt.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents starten
(`maxSpawnDepth: 1`). Legen Sie `maxSpawnDepth: 2` fest, um eine Ebene
der Verschachtelung zu aktivieren — das **Orchestrator-Muster**: Haupt-Agent → Orchestrator-Sub-Agent →
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

| Tiefe | Form des Sitzungsschlüssels                            | Rolle                                          | Kann starten?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                    | Immer                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Nie                        |

### Ankündigungskette

Ergebnisse fließen die Kette zurück nach oben:

1. Worker der Tiefe 2 beendet → kündigt an seinen Parent an (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet → kündigt an den Haupt-Agent an.
3. Haupt-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten Kinder.

<Note>
**Betriebliche Anleitung:** Starten Sie untergeordnete Arbeit einmal und warten Sie auf Abschlussereignisse,
anstatt Polling-Schleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten Beziehungen zu untergeordneten Sitzungen
auf Live-Arbeit fokussiert — Live-Kinder bleiben angehängt, beendete Kinder bleiben
für ein kurzes aktuelles Fenster sichtbar, und veraltete Nur-Store-Kindlinks werden
nach ihrem Aktualitätsfenster ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`-/
`parentSessionKey`-Metadaten nach einem Neustart Ghost-Kinder wiederherstellen.
Wenn ein Abschlussereignis eines Kindes eintrifft, nachdem Sie bereits die
finale Antwort gesendet haben, ist die korrekte Folgeantwort das exakte stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Kontrollumfang werden beim Startzeitpunkt in die Sitzungsmetadaten geschrieben. Dadurch wird verhindert, dass flache oder wiederhergestellte Sitzungsschlüssel versehentlich Orchestrator-Berechtigungen zurückerlangen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Kinder verwalten kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Sitzungs-Tools — `sessions_spawn` wird in Tiefe 2 immer verweigert. Kann keine weiteren Kinder starten.

### Spawn-Limit pro Agent

Jede Agent-Sitzung (in beliebiger Tiefe) kann höchstens `maxChildrenPerAgent`
(Standard `5`) aktive Kinder gleichzeitig haben. Dies verhindert unkontrolliertes Fan-out
von einem einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Kinder
der Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agents der Tiefe 1 und kaskadiert zu deren Kindern der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen Kindern.
- `/subagents kill all` stoppt alle Sub-Agents für den Anforderer und kaskadiert.

## Authentifizierung

Sub-Agent-Authentifizierung wird über die **Agent-ID** aufgelöst, nicht über den Sitzungstyp:

- Der Sub-Agent-Sitzungsschlüssel ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Speicher wird aus dem `agentDir` dieses Agents geladen.
- Die Auth-Profile des Haupt-Agents werden als **Fallback** zusammengeführt; Agent-Profile überschreiben Hauptprofile bei Konflikten.

Die Zusammenführung ist additiv, daher sind Hauptprofile immer als
Fallbacks verfügbar. Vollständig isolierte Authentifizierung pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agents melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht der Anforderer-Sitzung).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistententext das exakte stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Anforderertiefe ab:

- Anforderer-Sitzungen der obersten Ebene verwenden einen Folge-`agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Anforderer-Subagent-Sitzungen erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Kindergebnisse innerhalb der Sitzung synthetisieren kann.
- Wenn eine verschachtelte Anforderer-Subagent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw auf den Anforderer dieser Sitzung zurück, sofern verfügbar.

Für Anforderer-Sitzungen der obersten Ebene löst die direkte Zustellung im Abschlussmodus zuerst
jede gebundene Konversations-/Thread-Route und jeden Hook-Override auf und füllt dann
fehlende Channel-Zielfelder aus der gespeicherten Route der Anforderer-Sitzung.
Dadurch bleiben Abschlüsse im richtigen Chat/Thema, selbst wenn der Ursprung des Abschlusses
nur den Channel identifiziert.

Die Aggregation von Kinderabschlüssen ist beim Erstellen verschachtelter Abschlussbefunde
auf den aktuellen Anforderer-Lauf beschränkt, sodass veraltete Kindausgaben aus früheren Läufen
nicht in die aktuelle Ankündigung gelangen. Ankündigungsantworten erhalten
Thread-/Themenrouting, sofern auf Channel-Adaptern verfügbar.

### Ankündigungskontext

Der Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld          | Quelle                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                          |
| Sitzungs-IDs    | Untergeordneter Sitzungsschlüssel/ID                                                                                          |
| Typ           | Ankündigungstyp + Aufgabenlabel                                                                                    |
| Status         | Aus dem Runtime-Ergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistententext, andernfalls bereinigter neuester Tool-/toolResult-Text                                |
| Follow-up      | Anweisung, die beschreibt, wann geantwortet und wann still geblieben werden soll                                                           |

Fehlgeschlagene terminale Läufe melden einen Fehlerstatus, ohne erfassten
Antworttext erneut abzuspielen. Bei Timeout kann die Ankündigung, wenn das Kind nur
bis zu Tool-Aufrufen gekommen ist, diese Historie zu einer kurzen Teilfortschrittszusammenfassung verdichten,
anstatt rohe Tool-Ausgabe erneut abzuspielen.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Runtime (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Haupt-Agent die Historie über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für die Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistentenstimme neu formuliert werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistenten-Recall wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`- / `<relevant_memories>`-Gerüst entfernt; Plain-Text-Tool-Call-XML-Payload-Blöcke (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich gekürzter Payloads, die nie sauber schließen; herabgestuftes Tool-Call-/Ergebnisgerüst und historische Kontextmarker entfernt; durchgesickerte Modell-Kontrolltokens (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Zugangsdaten-/Token-ähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Historien können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die Prüfung des rohen Transkripts auf der Festplatte ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Sub-Agents verwenden zuerst dieselbe Profil- und Tool-Policy-Pipeline wie der Parent-
oder Ziel-Agent. Danach wendet OpenClaw die Sub-Agent-Einschränkungsschicht an.

Ohne restriktives `tools.profile` erhalten Sub-Agents **alle Tools außer
Sitzungs-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht — es
ist kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agents der Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre Kinder verwalten können.

### Override per Konfiguration

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

`tools.subagents.tools.allow` ist ein finaler Nur-Erlauben-Filter. Er kann
die bereits aufgelöste Tool-Menge einschränken, aber kein durch
`tools.profile` entferntes Tool **wieder hinzufügen**. Zum Beispiel enthält
`tools.profile: "coding"` `web_search`/`web_fetch`, aber nicht das Tool
`browser`. Damit Sub-Agenten mit coding-Profil Browser-Automatisierung verwenden können, fügen Sie `browser` in der Profilphase hinzu:

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

Sub-Agenten verwenden eine dedizierte In-Process-Warteschlangen-Lane:

- **Lane-Name:** `subagent`
- **Nebenläufigkeit:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein
Sub-Agent noch aktiv ist. Nicht beendete Ausführungen, die älter als das Fenster für veraltete Ausführungen sind,
zählen in `/subagents list`, Statuszusammenfassungen,
Gating für Abschluss von Nachkommen und Nebenläufigkeitsprüfungen pro Sitzung nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Ausführungen entfernt, außer
ihre untergeordnete Sitzung ist mit `abortedLastRun: true` markiert. Diese
durch Neustart abgebrochenen untergeordneten Sitzungen bleiben über den Sub-Agent-
Orphan-Wiederherstellungsfluss wiederherstellbar, der vor dem
Löschen der Abbruchmarkierung eine synthetische Fortsetzen-Nachricht sendet.

Die automatische Neustart-Wiederherstellung ist pro untergeordneter Sitzung begrenzt. Wenn dasselbe
untergeordnete Sub-Agent-Element wiederholt innerhalb des Rapid-Re-Wedge-Fensters
für die Orphan-Wiederherstellung akzeptiert wird, persistiert OpenClaw einen Wiederherstellungs-Tombstone für diese
Sitzung und setzt sie bei späteren Neustarts nicht mehr automatisch fort. Führen Sie
`openclaw tasks maintenance --apply` aus, um den Aufgabendatensatz abzugleichen, oder
`openclaw doctor --fix`, um veraltete abgebrochene Wiederherstellungs-Flags auf
Sitzungen mit Tombstone zu löschen.

<Note>
Wenn das Starten eines Sub-Agenten mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Zustand bearbeiten.
Interne `sessions_spawn`-Koordination sollte sich als
`client.id: "gateway-client"` mit `client.mode: "backend"` über direkte
local loopback-Shared-Token-/Passwortauthentifizierung verbinden; dieser Pfad hängt nicht von der
Geltungsbereichs-Baseline der gekoppelten Geräte der CLI ab. Remote-Aufrufer, explizite
`deviceIdentity`, explizite Geräte-Token-Pfade und Browser-/Node-Clients
benötigen weiterhin die normale Gerätefreigabe für Geltungsbereichserweiterungen.
</Note>

## Stoppen

- Das Senden von `/stop` im Chat des Anfordernden bricht die Sitzung des Anfordernden ab und stoppt alle daraus gestarteten aktiven Sub-Agent-Ausführungen, einschließlich Kaskadierung auf verschachtelte untergeordnete Elemente.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert auf seine untergeordneten Elemente.

## Einschränkungen

- Die Sub-Agent-Ankündigung erfolgt **best-effort**. Wenn das Gateway neu startet, geht ausstehende Arbeit zum Zurückmelden der Ankündigung verloren.
- Sub-Agenten teilen sich weiterhin dieselben Gateway-Prozessressourcen; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Sub-Agent-Kontext injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive untergeordnete Elemente pro Sitzung (Standard `5`, Bereich `1–20`).

## Verwandt

- [ACP-Agenten](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrundaufgaben](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
