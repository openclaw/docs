---
read_when:
    - Sie möchten Arbeit im Hintergrund oder parallele Arbeit über den Agenten ausführen
    - Sie ändern sessions_spawn oder die Richtlinie für Sub-Agent-Tools
    - Sie implementieren oder beheben Probleme bei threadgebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Isolierte Agentenläufe im Hintergrund starten, die Ergebnisse an den anfordernden Chat zurückmelden
title: Unteragenten
x-i18n:
    generated_at: "2026-05-07T01:54:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agents sind Agent-Läufe im Hintergrund, die aus einem bestehenden Agent-Lauf heraus gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**kündigen** ihr Ergebnis nach Abschluss im Chat-Kanal des Anforderers
an. Jeder Sub-Agent-Lauf wird als
[Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Zum Sicherheitsmodell hinter Delegation siehe
[Multi-Agent- und Sub-Agent-Grenzen](/de/gateway/security#multi-agent-and-sub-agent-boundaries).
Sub-Agents sind nützliche Einheiten für Isolation und Workflows, aber sie sind
keine feindselige Multi-Tenant-Autorisierungsgrenze innerhalb eines gemeinsam genutzten Gateway.

Primäre Ziele:

- "Recherche / lange Aufgabe / langsames Tool" parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungstools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext
und eigenen Token-Verbrauch. Legen Sie für schwere oder repetitive Aufgaben ein günstigeres Modell
für Sub-Agents fest und behalten Sie für Ihren Haupt-Agent ein hochwertigeres Modell bei.
Konfigurieren Sie dies über `agents.defaults.subagents.model` oder Überschreibungen pro Agent.
Wenn ein Child wirklich das aktuelle Transkript des Anforderers benötigt, kann der Agent bei diesem einen Spawn
    `context: "fork"` anfordern. Thread-gebundene Sub-Agent-Sitzungen verwenden standardmäßig
    `context: "fork"`, weil sie die aktuelle Unterhaltung in einen
    Follow-up-Thread verzweigen.
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

Verwenden Sie den übergeordneten Befehl [`/steer <message>`](/de/tools/steer), um den aktiven Lauf der aktuellen Anforderer-Sitzung zu steuern. Verwenden Sie `/subagents steer <id|#> <message>`, wenn das Ziel ein Child-Lauf ist.

`/subagents info` zeigt Lauf-Metadaten an (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Rückblickansicht; prüfen Sie den Transkriptpfad auf der Festplatte, wenn Sie
das rohe vollständige Transkript benötigen.

### Steuerung der Thread-Bindung

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

`/subagents spawn` startet einen Sub-Agent im Hintergrund als Benutzerbefehl (nicht als
internes Relay) und sendet eine finale Abschlussaktualisierung zurück an den
Anforderer-Chat, wenn der Lauf beendet ist.

<AccordionGroup>
  <Accordion title="Nicht blockierender, pushbasierter Abschluss">
    - Der Spawn-Befehl ist nicht blockierend; er gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss kündigt der Sub-Agent eine Zusammenfassung/Ergebnisnachricht im Chat-Kanal des Anforderers an.
    - Der Abschluss ist pushbasiert. Nach dem Spawn sollten Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife abfragen, nur um auf das Ende zu warten; prüfen Sie den Status nur bei Bedarf zum Debuggen oder Eingreifen.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand nachverfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Ankündigungs-Bereinigungsablauf fortgesetzt wird.

  </Accordion>
  <Accordion title="Resilienz der manuell gestarteten Zustellung">
    - OpenClaw versucht zuerst die direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
    - Wenn der Abschluss-Turn des Anforderer-Agent fehlschlägt, keine sichtbare Ausgabe erzeugt oder ein offensichtlich unvollständiges Präfix des erfassten Child-Ergebnisses zurückgibt, fällt OpenClaw auf direkte Abschlusszustellung aus dem erfassten Child-Ergebnis zurück.
    - Wenn direkte Zustellung nicht verwendet werden kann, fällt es auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Ankündigung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Anforderer-Route bei: Thread-gebundene oder unterhaltungsgebundene Abschlussrouten gewinnen, wenn verfügbar; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anforderer-Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Abschlussübergabe">
    Die Abschlussübergabe an die Anforderer-Sitzung ist zur Laufzeit erzeugter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — neuesten sichtbaren `assistant`-Antworttext, andernfalls bereinigten neuesten Tool-/toolResult-Text. Terminal fehlgeschlagene Läufe verwenden erfassten Antworttext nicht wieder.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellanweisung, die den Anforderer-Agent anweist, in normaler Assistentenstimme umzuschreiben (nicht rohe interne Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben Standardwerte für genau diesen Lauf.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist der Einmalmodus (`mode: "run"`). Verwenden Sie für persistente Thread-gebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit bewirbt. Siehe [ACP-Zustellmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` ACP vorziehen, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw verbirgt `runtime: "acp"`, bis ACP aktiviert ist, der Anforderer nicht in einer Sandbox läuft und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.list[]`-Eintrag mit `runtime.type="acp"`; verwenden Sie die Standard-Sub-Agent-Laufzeit für normale OpenClaw-Konfigurations-Agenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich anfordert,
das aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden sollten                                                                                                       | Verhalten                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext kurz gebrieft werden kann       | Erstellt ein sauberes Child-Transkript. Dies ist die Standardeinstellung und hält die Token-Nutzung niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder nuancierten Anweisungen abhängt, die bereits im Anforderer-Transkript vorhanden sind | Verzweigt das Anforderer-Transkript in die Child-Sitzung, bevor das Child startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht, nicht als
Ersatz für das Schreiben eines klaren Aufgaben-Prompts.

## Tool: `sessions_spawn`

Startet einen Sub-Agent-Lauf mit `deliver: false` auf der globalen `subagent`-Lane,
führt dann einen Ankündigungsschritt aus und postet die Ankündigungsantwort im
Chat-Kanal des Anforderers.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab. Die Profile `coding` und
`full` stellen `sessions_spawn` standardmäßig bereit. Das Profil `messaging`
tut dies nicht; fügen Sie `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agenten, die
Arbeit delegieren sollen. Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische Allow-/Deny-Richtlinien können
das Tool nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** erbt den Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder pro Agent `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` gewinnt weiterhin.
- **Thinking:** erbt den Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder pro Agent `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` gewinnt weiterhin.
- **Lauf-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

### Tool-Parameter

<ParamField path="task" type="string" required>
  Die Aufgabenbeschreibung für den Sub-Agent.
</ParamField>
<ParamField path="label" type="string">
  Optionale menschenlesbare Bezeichnung.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agent-ID spawnen, wenn durch `subagents.allowAgents` erlaubt.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Spawns ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt ACP-Laufausgabe an die Parent-Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Spawns weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Sub-Agent-Modell. Ungültige Werte werden übersprungen und der Sub-Agent läuft mit dem Standardmodell, mit einer Warnung im Tool-Ergebnis.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt das Thinking-Level für den Sub-Agent-Lauf.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardwert ist `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird der Sub-Agent-Lauf nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, fordert dies Kanal-Thread-Bindung für diese Sub-Agent-Sitzung an.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` und `mode` ausgelassen ist, wird der Standard `session`. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert sofort nach der Ankündigung (behält das Transkript dennoch per Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Spawn ab, sofern die Ziel-Child-Laufzeit nicht in einer Sandbox läuft.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die Child-Sitzung. Nur native Sub-Agents. Thread-gebundene Spawns verwenden standardmäßig `fork`; nicht Thread-gebundene Spawns verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Parameter für Kanalzustellung (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die Zustellung
`message`/`sessions_send` aus dem gestarteten Lauf.
</Warning>

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an einen Thread gebunden bleiben,
sodass Follow-up-Benutzernachrichten in diesem Thread weiterhin an dieselbe
Sub-Agent-Sitzung geroutet werden.

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
  <Step title="Erzeugen">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt einen Thread oder bindet ihn an dieses Sitzungsziel im aktiven Kanal.
  </Step>
  <Step title="Folgenachrichten weiterleiten">
    Antworten und Folgenachrichten in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Timeouts prüfen">
    Verwenden Sie `/session idle`, um den Inaktivitäts-Auto-Unfocus zu prüfen/aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um die Bindung manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerung

| Befehl            | Wirkung                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Den aktuellen Thread (oder einen neu erstellten) an ein Sub-Agent-/Sitzungsziel binden |
| `/unfocus`         | Die Bindung für den aktuell gebundenen Thread entfernen                       |
| `/agents`          | Aktive Läufe und Bindungsstatus auflisten (`thread:<id>` oder `unbound`)       |
| `/session idle`    | Inaktivitäts-Auto-Unfocus prüfen/aktualisieren (nur fokussierte gebundene Threads)         |
| `/session max-age` | Harte Obergrenze prüfen/aktualisieren (nur fokussierte gebundene Threads)                  |

### Konfigurationsschalter

- **Globale Standardeinstellung:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal-Override- und Spawn-Auto-Bind-Schlüssel** sind adapterspezifisch. Siehe [Thread-unterstützende Kanäle](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste der Agent-IDs, die über eine explizite `agentId` als Ziel verwendet werden können (`["*"]` erlaubt beliebige). Standard: nur der anfordernde Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Anforderer sich selbst mit `agentId` erzeugen kann, nehmen Sie die Anforderer-ID in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist für Ziel-Agents, die verwendet wird, wenn der anfordernde Agent keine eigene `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` auslassen (erzwingt explizite Profilauswahl). Agent-spezifischer Override: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die anfordernde Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox ausgeführt würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive
Modell jedes aufgeführten Agents und eingebettete Runtime-Metadaten, damit Aufrufer Pi, Codex-
App-Server und andere konfigurierte native Runtimes unterscheiden können.

### Automatische Archivierung

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` automatisch archiviert (Standard `60`).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (derselbe Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (das Transkript bleibt über Umbenennung erhalten).
- Automatische Archivierung erfolgt nach bestem Aufwand; ausstehende Timer gehen verloren, wenn das Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Aufwand geschlossen, wenn der Lauf endet, auch wenn das Transkript/der Sitzungseintrag erhalten bleibt.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents erzeugen
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene
Verschachtelung zu aktivieren — das **Orchestrator-Muster**: Haupt-Agent → Orchestrator-Sub-Agent →
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

| Tiefe | Form des Sitzungsschlüssels                            | Rolle                                          | Kann erzeugen?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                    | Immer                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Nie                        |

### Ankündigungskette

Ergebnisse fließen die Kette nach oben zurück:

1. Worker der Tiefe 2 beendet → kündigt an seinen Parent an (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet → kündigt an den Haupt-Agent an.
3. Haupt-Agent empfängt die Ankündigung und liefert sie an den Benutzer aus.

Jede Ebene sieht nur Ankündigungen ihrer direkten Children.

<Note>
**Betriebliche Leitlinien:** Starten Sie Child-Arbeit einmal und warten Sie auf Abschlussereignisse,
statt Poll-Schleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten Child-Sitzungsbeziehungen
auf Live-Arbeit fokussiert — Live-Children bleiben angehängt, beendete Children bleiben
für ein kurzes aktuelles Fenster sichtbar, und veraltete reine Store-Child-Links werden
nach ihrem Aktualitätsfenster ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`- /
`parentSessionKey`-Metadaten nach einem
Neustart Ghost-Children wiederherstellen. Wenn ein Child-Abschlussereignis eintrifft, nachdem Sie bereits die
finale Antwort gesendet haben, ist die korrekte Folgenachricht das exakte stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Steuerungsumfang werden beim Erzeugen in die Sitzungsmetadaten geschrieben. Dadurch können flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich Orchestrator-Berechtigungen zurückerlangen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Children verwalten kann. Andere Sitzungs-/Systemtools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Sitzungstools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Sitzungstools — `sessions_spawn` wird in Tiefe 2 immer verweigert. Kann keine weiteren Children erzeugen.

### Spawn-Limit pro Agent

Jede Agent-Sitzung (in jeder Tiefe) kann höchstens `maxChildrenPerAgent`
(Standard `5`) aktive Children gleichzeitig haben. Dies verhindert unkontrolliertes Fan-out
durch einen einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Children der Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agents der Tiefe 1 und kaskadiert zu ihren Children der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu dessen Children.
- `/subagents kill all` stoppt alle Sub-Agents für den Anforderer und kaskadiert.

## Authentifizierung

Sub-Agent-Authentifizierung wird nach **Agent-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sub-Agent-Sitzungsschlüssel ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agents geladen.
- Die Auth-Profile des Haupt-Agents werden als **Fallback** zusammengeführt; Agent-Profile überschreiben Hauptprofile bei Konflikten.

Die Zusammenführung ist additiv, sodass Hauptprofile immer als
Fallbacks verfügbar sind. Vollständig isolierte Authentifizierung pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agents melden über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht der Anforderer-Sitzung).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistant-Text das exakte stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, auch wenn vorher sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Anforderertiefe ab:

- Top-Level-Anforderersitzungen verwenden einen Follow-up-`agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Anforderer-Sub-Agent-Sitzungen erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Child-Ergebnisse in der Sitzung synthetisieren kann.
- Wenn eine verschachtelte Anforderer-Sub-Agent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw auf den Anforderer dieser Sitzung zurück, sofern verfügbar.

Für Top-Level-Anforderersitzungen löst die direkte Zustellung im Completion-Modus zuerst
jede gebundene Konversations-/Thread-Route und jeden Hook-Override auf und füllt dann
fehlende Kanalzielfelder aus der gespeicherten Route der Anforderer-Sitzung.
So bleiben Completions im richtigen Chat/Thema, auch wenn der Completion-
Ursprung nur den Kanal identifiziert.

Die Aggregation von Child-Abschlüssen ist beim Erstellen verschachtelter Completion-Ergebnisse
auf den aktuellen Anfordererlauf beschränkt, wodurch verhindert wird, dass veraltete Child-
Ausgaben aus früheren Läufen in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten
Thread-/Themen-Routing bei, wenn es auf Kanaladaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld          | Quelle                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                          |
| Sitzungs-IDs    | Child-Sitzungsschlüssel/-ID                                                                                          |
| Typ           | Ankündigungstyp + Aufgabenlabel                                                                                    |
| Status         | Aus Runtime-Ergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistant-Text, andernfalls bereinigter neuester Tool-/toolResult-Text                                |
| Follow-up      | Anweisung, die beschreibt, wann geantwortet werden soll und wann Stille gewahrt bleiben soll                                                           |

Terminal fehlgeschlagene Läufe melden Fehlerstatus, ohne erfassten
Antworttext erneut abzuspielen. Bei Timeout kann die Ankündigung, wenn das Child nur Tool-Aufrufe erreicht hat,
diese Historie in eine kurze Zusammenfassung des Teilfortschritts verdichten,
statt rohe Tool-Ausgabe erneut abzuspielen.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Runtime (z. B. `runtime 5m12s`).
- Token-Nutzung (Input/Output/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Haupt-Agent die Historie über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistant-Stimme neu formuliert werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistant-Recall wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`- / `<relevant_memories>`-Gerüst entfernt; Plain-Text-Tool-Call-XML-Payload-Blöcke (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; herabgestuftes Tool-Call-/Ergebnis-Gerüst und historische Kontextmarker entfernt; geleakte Modell-Steuerungstokens (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Zugangsdaten-/Token-ähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Historien können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Rohe Transkriptprüfung auf der Festplatte ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Sub-Agents verwenden zuerst dieselbe Profil- und Tool-Richtlinien-Pipeline wie der übergeordnete oder Ziel-Agent. Danach wendet OpenClaw die Einschränkungsebene für Sub-Agents an.

Ohne einschränkendes `tools.profile` erhalten Sub-Agents **alle Tools außer Sitzungstools** und Systemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht — es ist kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2` ist, erhalten Orchestrator-Sub-Agents auf Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre untergeordneten Instanzen verwalten können.

### Überschreiben per Konfiguration

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

`tools.subagents.tools.allow` ist ein endgültiger Nur-allow-Filter. Er kann das bereits aufgelöste Tool-Set weiter einschränken, aber kein Tool **wieder hinzufügen**, das durch `tools.profile` entfernt wurde. Zum Beispiel enthält `tools.profile: "coding"` `web_search`/`web_fetch`, aber nicht das Tool `browser`. Damit Sub-Agents mit Coding-Profil Browser-Automatisierung verwenden können, fügen Sie browser in der Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie pro Agent `agents.list[].tools.alsoAllow: ["browser"]`, wenn nur ein Agent Browser-Automatisierung erhalten soll.

## Parallelität

Sub-Agents verwenden eine dedizierte In-Process-Warteschlangen-Lane:

- **Lane-Name:** `subagent`
- **Parallelität:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein Sub-Agent noch aktiv ist. Nicht beendete Läufe, die älter als das Zeitfenster für veraltete Läufe sind, zählen in `/subagents list`, Statuszusammenfassungen, Abschluss-Gating für Nachkommen und Parallelitätsprüfungen pro Sitzung nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Läufe bereinigt, sofern ihre untergeordnete Sitzung nicht als `abortedLastRun: true` markiert ist. Diese durch den Neustart abgebrochenen untergeordneten Sitzungen bleiben über den Orphan-Recovery-Flow für Sub-Agents wiederherstellbar, der vor dem Löschen der Abbruchmarkierung eine synthetische Resume-Nachricht sendet.

Die automatische Wiederherstellung nach einem Neustart ist pro untergeordneter Sitzung begrenzt. Wenn derselbe untergeordnete Sub-Agent innerhalb des schnellen Re-Wedge-Zeitfensters wiederholt für Orphan-Recovery akzeptiert wird, persistiert OpenClaw einen Recovery-Tombstone auf dieser Sitzung und setzt die automatische Fortsetzung bei späteren Neustarts aus. Führen Sie `openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder `openclaw doctor --fix`, um veraltete Abbruch-Recovery-Flags auf Sitzungen mit Tombstone zu löschen.

<Note>
Wenn ein Sub-Agent-Spawn mit Gateway `PAIRING_REQUIRED` / `scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Zustand bearbeiten. Interne `sessions_spawn`-Koordination sollte sich als `client.id: "gateway-client"` mit `client.mode: "backend"` über direkte local loopback-Shared-Token-/Passwortauthentifizierung verbinden; dieser Pfad hängt nicht von der Scope-Baseline der gekoppelten Geräte der CLI ab. Remote-Aufrufer, explizite `deviceIdentity`, explizite Device-Token-Pfade und Browser-/Node-Clients benötigen für Scope-Upgrades weiterhin die normale Gerätegenehmigung.
</Note>

## Stoppen

- Das Senden von `/stop` im Requester-Chat bricht die Requester-Sitzung ab und stoppt alle daraus gestarteten aktiven Sub-Agent-Läufe, mit Kaskadierung auf verschachtelte untergeordnete Instanzen.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert auf dessen untergeordnete Instanzen.

## Einschränkungen

- Sub-Agent-Ankündigungen erfolgen **best-effort**. Wenn das Gateway neu startet, gehen ausstehende „announce back“-Aufgaben verloren.
- Sub-Agents teilen sich weiterhin dieselben Ressourcen des Gateway-Prozesses; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Sub-Agent-Kontext injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive untergeordnete Instanzen pro Sitzung (Standard `5`, Bereich `1–20`).

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrund-Tasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
