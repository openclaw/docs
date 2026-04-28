---
read_when:
    - Sie möchten Hintergrund- oder Parallelarbeit über den Agenten.
    - Sie ändern `sessions_spawn` oder die Tool-Richtlinie für Subagenten.
    - Sie implementieren oder beheben threadgebundene Subagent-Sitzungen.
sidebarTitle: Sub-agents
summary: Isolierte Agent-Läufe im Hintergrund starten, die Ergebnisse zurück an den anfragenden Chat melden
title: Subagenten
x-i18n:
    generated_at: "2026-04-26T11:41:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

Subagenten sind Hintergrund-Agent-Läufe, die aus einem bestehenden Agent-Lauf gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
melden ihr Ergebnis nach Abschluss **zurück** an den anfragenden Chat-
Channel. Jeder Subagent-Lauf wird als
[Hintergrund-Task](/de/automation/tasks) verfolgt.

Primäre Ziele:

- „Recherche / lange Aufgabe / langsames Tool“-Arbeit parallelisieren, ohne den Hauptlauf zu blockieren.
- Subagenten standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer fehlzuverwenden halten: Subagenten erhalten standardmäßig **keine** Session-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Hinweis zu Kosten:** Jeder Subagent hat standardmäßig seinen eigenen Kontext und seine eigene Tokennutzung.
Für schwere oder wiederkehrende Aufgaben sollten Sie für Subagenten ein günstigeres Modell festlegen
und Ihren Haupt-Agenten auf einem qualitativ höherwertigen Modell belassen. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder über Agent-spezifische Überschreibungen. Wenn ein Kindlauf
wirklich das aktuelle Transkript des Anfragenden benötigt, kann der Agent bei genau diesem Spawn
`context: "fork"` anfordern.
</Note>

## Slash-Befehl

Verwenden Sie `/subagents`, um Subagent-Läufe für die **aktuelle
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
Transkriptpfad, Cleanup). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Rückschau; prüfen Sie den Transkriptpfad auf der Festplatte, wenn Sie
das rohe vollständige Transkript benötigen.

### Steuerung der Thread-Bindung

Diese Befehle funktionieren in Channels, die persistente Thread-Bindungen unterstützen.
Siehe [Channels mit Thread-Unterstützung](#thread-supporting-channels) weiter unten.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Spawn-Verhalten

`/subagents spawn` startet einen Hintergrund-Subagenten als Benutzerbefehl (nicht als
internes Relay) und sendet nach Abschluss des Laufs ein abschließendes Status-Update zurück an den
anfragenden Chat.

<AccordionGroup>
  <Accordion title="Nicht blockierend, pushbasierter Abschluss">
    - Der Spawn-Befehl blockiert nicht; er gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss meldet der Subagent eine Zusammenfassung/Ergebnisnachricht zurück an den Chat-Channel des Anfragenden.
    - Der Abschluss ist pushbasiert. Nach dem Start sollten Sie `/subagents list`, `sessions_list` oder `sessions_history` nicht in einer Schleife pollen, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zum Debugging oder Eingreifen.
    - Nach Abschluss schließt OpenClaw nach bestem Bemühen erfasste Browser-Tabs/Prozesse, die von dieser Subagent-Sitzung geöffnet wurden, bevor der Cleanup-Fluss für die Meldung fortgesetzt wird.

  </Accordion>
  <Accordion title="Robuste Zustellung bei manuellem Spawn">
    - OpenClaw versucht zuerst direkte `agent`-Zustellung mit einem stabilen Idempotenzschlüssel.
    - Wenn die direkte Zustellung fehlschlägt, wird auf Queue-Routing zurückgegriffen.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Meldung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Zustellung des Abschlusses behält die aufgelöste Route des Anfragenden bei: Thread-gebundene oder konversationsgebundene Abschlussrouten haben Vorrang, wenn verfügbar; wenn der Abschlussursprung nur einen Channel liefert, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Sitzung des Anfragenden (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten für die Übergabe bei Abschluss">
    Die Übergabe des Abschlusses an die Sitzung des Anfragenden ist intern zur Laufzeit erzeugter
    Kontext (nicht vom Benutzer verfasster Text) und enthält:

    - `Result` — letzter sichtbarer `assistant`-Antworttext, andernfalls bereinigter letzter Text aus Tool/ToolResult. Fehlgeschlagene Endläufe verwenden keinen erfassten Antworttext erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellungsanweisung, die dem Agenten des Anfragenden mitteilt, in normaler Assistentenstimme umzuschreiben (keine rohen internen Metadaten weiterleiten).

  </Accordion>
  <Accordion title="Modi und ACP-Runtime">
    - `--model` und `--thinking` überschreiben die Standardwerte für genau diesen Lauf.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach dem Abschluss zu prüfen.
    - `/subagents spawn` ist ein Einmalmodus (`mode: "run"`). Für persistente threadgebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) verwenden Sie `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Runtime anbietet. Siehe [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das Plugin `codex` aktiviert ist, sollte die Steuerung von Codex-Chat/Thread `/codex ...` gegenüber ACP bevorzugen, es sei denn, der Benutzer fordert ausdrücklich ACP/acpx an.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anfragende nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen Eintrag in `agents.list[]` mit `runtime.type="acp"`; verwenden Sie die Standard-Subagent-Runtime für normale OpenClaw-Konfigurations-Agenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Subagenten starten isoliert, sofern der Aufrufer nicht ausdrücklich verlangt,
das aktuelle Transkript zu forken.

| Modus      | Wann er verwendet werden sollte                                                                                                        | Verhalten                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext knapp beschrieben werden kann    | Erstellt ein sauberes Kind-Transkript. Dies ist der Standard und hält die Tokennutzung niedriger. |
| `fork`     | Arbeit, die von der aktuellen Konversation, früheren Tool-Ergebnissen oder differenzierten Anweisungen im Transkript des Anfragenden abhängt | Verzweigt das Transkript des Anfragenden in die Kind-Sitzung, bevor das Kind startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht,
nicht als Ersatz für das Schreiben eines klaren Aufgaben-Prompts.

## Tool: `sessions_spawn`

Startet einen Subagent-Lauf mit `deliver: false` auf der globalen Lane `subagent`,
führt dann einen Ankündigungsschritt aus und sendet die Ankündigungsantwort an den Chat-
Channel des Anfragenden.

**Standardwerte:**

- **Modell:** übernimmt den Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` setzen (oder pro Agent `agents.list[].subagents.model`); ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Thinking:** übernimmt den Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` setzen (oder pro Agent `agents.list[].subagents.thinking`); ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Run-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls wird auf `0` zurückgefallen (kein Timeout).

### Tool-Parameter

<ParamField path="task" type="string" required>
  Die Aufgabenbeschreibung für den Subagenten.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agent-ID starten, wenn dies durch `subagents.allowAgents` erlaubt ist.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für Einträge in `agents.list[]`, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Modell des Subagenten. Ungültige Werte werden übersprungen und der Subagent läuft auf dem Standardmodell weiter, mit einer Warnung im Tool-Ergebnis.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt das Thinking-Level für den Subagent-Lauf.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird der Subagent-Lauf nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird für diese Subagent-Sitzung eine Channel-Thread-Bindung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` gesetzt und `mode` ausgelassen wird, wird standardmäßig `session` verwendet. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert sofort nach der Meldung (behält das Transkript aber weiterhin per Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Spawn ab, sofern die Ziel-Kind-Runtime nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anfragenden in die Kind-Sitzung. Nur für native Subagenten. Verwenden Sie `fork` nur, wenn das Kind das aktuelle Transkript benötigt.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Channel-Zustellungsparameter (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Für die Zustellung verwenden Sie
`message`/`sessions_send` aus dem gestarteten Lauf.
</Warning>

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Channel aktiviert sind, kann ein Subagent an
einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiterhin an dieselbe Subagent-Sitzung weitergeleitet werden.

### Channels mit Thread-Unterstützung

**Discord** ist derzeit der einzige unterstützte Channel. Er unterstützt
persistente threadgebundene Subagent-Sitzungen (`sessions_spawn` mit
`thread: true`), manuelle Thread-Steuerung (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) und Adapter-Schlüssel
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` und
`channels.discord.threadBindings.spawnSubagentSessions`.

### Schneller Ablauf

<Steps>
  <Step title="Starten">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt oder bindet einen Thread an dieses Sitzungsziel im aktiven Channel.
  </Step>
  <Step title="Follow-ups routen">
    Antworten und Folge-Nachrichten in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Timeouts prüfen">
    Verwenden Sie `/session idle`, um automatische Entbindung bei Inaktivität zu prüfen/zu aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerung

| Befehl             | Wirkung                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread (oder erstellt einen) an ein Subagent-/Sitzungsziel |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread               |
| `/agents`          | Listet aktive Läufe und den Bindungsstatus (`thread:<id>` oder `unbound`) auf |
| `/session idle`    | Prüft/aktualisiert automatische Entbindung bei Inaktivität (nur fokussierte gebundene Threads) |
| `/session max-age` | Prüft/aktualisiert harte Obergrenze (nur fokussierte gebundene Threads) |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Channel-Override- und Spawn-Auto-Bind-Schlüssel** sind adapterspezifisch. Siehe [Channels mit Thread-Unterstützung](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapter-Details.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste von Agent-IDs, die über `agentId` als Ziel verwendet werden können (`["*"]` erlaubt jede). Standard: nur der anfragende Agent.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist für Ziel-Agenten, die verwendet wird, wenn der anfragende Agent keine eigene `subagents.allowAgents` setzt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl). Überschreibung pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die Sitzung des Anfragenden sandboxed ist, lehnt `sessions_spawn` Ziele
ab, die unsandboxed laufen würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive
Modell jedes aufgeführten Agenten und eingebettete Laufzeitmetadaten, sodass Aufrufer zwischen PI, Codex
app-server und anderen konfigurierten nativen Runtimes unterscheiden können.

### Auto-Archivierung

- Subagent-Sitzungen werden automatisch nach `agents.defaults.subagents.archiveAfterMinutes` archiviert (Standard `60`).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (derselbe Ordner).
- `cleanup: "delete"` archiviert sofort nach der Meldung (behält das Transkript aber weiterhin per Umbenennung).
- Die Auto-Archivierung erfolgt nach bestem Bemühen; ausstehende Timer gehen verloren, wenn das Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur Auto-Archivierung bestehen.
- Die Auto-Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und der Tiefe 2.
- Browser-Cleanup ist von Archiv-Cleanup getrennt: Erfasste Browser-Tabs/Prozesse werden nach bestem Bemühen geschlossen, wenn der Lauf endet, auch wenn Transkript/Sitzungsdatensatz erhalten bleiben.

## Verschachtelte Subagenten

Standardmäßig können Subagenten keine eigenen Subagenten starten
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene
der Verschachtelung zu aktivieren — das **Orchestrator-Muster**: Haupt-Agent → Orchestrator-Subagent →
Worker-Sub-Subagenten.

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

| Tiefe | Form des Sitzungsschlüssels                   | Rolle                                        | Kann starten?               |
| ----- | --------------------------------------------- | -------------------------------------------- | --------------------------- |
| 0     | `agent:<id>:main`                             | Haupt-Agent                                  | Immer                       |
| 1     | `agent:<id>:subagent:<uuid>`                  | Subagent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Sub-Subagent (Leaf-Worker)                   | Niemals                     |

### Meldungskette

Ergebnisse fließen die Kette nach oben zurück:

1. Worker der Tiefe 2 wird fertig → meldet an seinen Elternteil (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 erhält die Meldung, synthetisiert Ergebnisse, wird fertig → meldet an den Haupt-Agenten.
3. Haupt-Agent erhält die Meldung und stellt sie dem Benutzer zu.

Jede Ebene sieht nur Meldungen ihrer direkten Kinder.

<Note>
**Betriebshinweis:** Starten Sie Child-Arbeit einmal und warten Sie auf Abschlussereignisse,
statt Poll-Schleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten die Beziehungen zu Child-Sitzungen
auf aktive Arbeit fokussiert — aktive Kinder bleiben verbunden, beendete Kinder bleiben
für ein kurzes aktuelles Fenster sichtbar, und veraltete, nur im Store vorhandene Child-Links werden
nach Ablauf ihres Aktualitätsfensters ignoriert. Dadurch wird verhindert, dass alte Metadaten `spawnedBy` /
`parentSessionKey` nach einem Neustart Geister-Kinder wiederbeleben.
Wenn ein Child-Abschlussereignis eintrifft, nachdem Sie bereits die
abschließende Antwort gesendet haben, ist das korrekte Follow-up das exakte stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rollen- und Steuerungsbereich werden beim Start in Sitzungsmetadaten geschrieben. Dadurch wird verhindert, dass flache oder wiederhergestellte Sitzungsschlüssel versehentlich wieder Orchestrator-Berechtigungen erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Kinder verwalten kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Session-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Session-Tools — `sessions_spawn` ist in Tiefe 2 immer verweigert. Kann keine weiteren Kinder starten.

### Spawn-Limit pro Agent

Jede Agent-Sitzung (in jeder Tiefe) kann höchstens `maxChildrenPerAgent`
(Standard `5`) aktive Kinder gleichzeitig haben. Dies verhindert unkontrolliertes Fan-out
durch einen einzelnen Orchestrator.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine
Kinder der Tiefe 2:

- `/stop` im Haupt-Chat stoppt alle Agenten der Tiefe 1 und kaskadiert zu deren Kindern der Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Subagenten und kaskadiert zu dessen Kindern.
- `/subagents kill all` stoppt alle Subagenten für den Anfragenden und kaskadiert.

## Authentifizierung

Subagent-Auth wird nach **Agent-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sitzungsschlüssel des Subagenten ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Haupt-Agenten werden als **Fallback** zusammengeführt; Agent-Profile überschreiben Haupt-Profile bei Konflikten.

Das Zusammenführen ist additiv, daher sind Haupt-Profile immer als
Fallbacks verfügbar. Vollständig isolierte Auth pro Agent wird derzeit noch nicht unterstützt.

## Meldung

Subagenten melden sich über einen Meldungsschritt zurück:

- Der Meldungsschritt läuft innerhalb der Subagent-Sitzung (nicht in der Sitzung des Anfragenden).
- Wenn der Subagent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gesendet.
- Wenn der neueste Assistententext exakt das stille Token `NO_REPLY` / `no_reply` ist, wird die Meldungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Tiefe des Anfragenden ab:

- Anfragende Top-Level-Sitzungen verwenden einen nachfolgenden `agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte anfragende Subagent-Sitzungen erhalten eine interne Follow-up-Injektion (`deliver=false`), sodass der Orchestrator Child-Ergebnisse innerhalb der Sitzung synthetisieren kann.
- Wenn eine verschachtelte anfragende Subagent-Sitzung nicht mehr vorhanden ist, greift OpenClaw, wenn möglich, auf den Anfragenden dieser Sitzung zurück.

Bei anfragenden Top-Level-Sitzungen löst die direkte Zustellung im Abschlussmodus
zuerst jede gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und füllt dann
fehlende Channel-Zielfelder aus der gespeicherten Route der Sitzung des Anfragenden auf.
Dadurch bleiben Abschlüsse im richtigen Chat/Topic, selbst wenn der Abschlussursprung
nur den Channel identifiziert.

Die Aggregation von Child-Abschlüssen ist beim Erstellen verschachtelter Abschlussbefunde
auf den aktuellen Lauf des Anfragenden beschränkt, wodurch verhindert wird, dass veraltete Child-
Ausgaben aus früheren Läufen in die aktuelle Meldung gelangen. Meldungsantworten bewahren
Thread-/Topic-Routing, wenn dies auf Channel-Adaptern verfügbar ist.

### Kontext der Meldung

Der Kontext der Meldung wird auf einen stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                      |
| Sitzungs-IDs   | Child-Sitzungsschlüssel/-ID                                                                                 |
| Typ            | Meldungstyp + Task-Label                                                                                    |
| Status         | Aus dem Laufzeitergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Letzter sichtbarer Assistententext, andernfalls bereinigter letzter Text aus Tool/ToolResult               |
| Follow-up      | Anweisung, die beschreibt, wann geantwortet und wann geschwiegen werden soll                                |

Fehlgeschlagene Endläufe melden den Fehlerstatus, ohne erfassten
Antworttext erneut wiederzugeben. Bei einem Timeout kann die Meldung, wenn das Child nur bis zu Tool-Calls gekommen ist,
diesen Verlauf zu einer kurzen Teilfortschrittszusammenfassung verdichten,
anstatt rohe Tool-Ausgabe erneut wiederzugeben.

### Statistikzeile

Meldungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn sie umschlossen sind):

- Laufzeit (z. B. `runtime 5m12s`).
- Tokennutzung (Eingabe/Ausgabe/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Haupt-Agent den Verlauf über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für die Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistentenstimme umgeschrieben werden.

### Warum `sessions_history` bevorzugt wird

`sessions_history` ist der sicherere Orchestrierungspfad:

- Die Assistenten-Rückschau wird zuerst normalisiert: Thinking-Tags entfernt; Gerüste `<relevant-memories>` / `<relevant_memories>` entfernt; XML-Payload-Blöcke von Tool-Calls im Klartext (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber geschlossen werden; herabgestufte Gerüste für Tool-Call/Result und Marker für historischen Kontext entfernt; ausgetretene Kontroll-Tokens des Modells (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Anmeldedaten-/tokenähnlicher Text wird redigiert.
- Lange Blöcke können abgeschnitten werden.
- Sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die rohe Prüfung des On-Disk-Transkripts ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Subagenten verwenden zuerst dasselbe Profil und dieselbe Tool-Richtlinien-Pipeline wie der übergeordnete oder Ziel-Agent.
Danach wendet OpenClaw die Einschränkungsschicht für Subagenten an.

Ohne restriktives `tools.profile` erhalten Subagenten **alle Tools außer
Session-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Rückschau —
es ist kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Subagenten der Tiefe 1 als Orchestratoren zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre Kinder verwalten können.

### Überschreibung per Konfiguration

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
die bereits aufgelöste Tool-Menge weiter einschränken, aber er kann **kein** Tool
wieder hinzufügen, das durch `tools.profile` entfernt wurde. Zum Beispiel enthält
`tools.profile: "coding"` `web_search`/`web_fetch`, aber nicht das Tool `browser`. Um
Subagenten mit Coding-Profil Browser-Automatisierung zu ermöglichen, fügen Sie Browser
in der Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie Agent-spezifisch `agents.list[].tools.alsoAllow: ["browser"]`, wenn nur ein
Agent Browser-Automatisierung erhalten soll.

## Nebenläufigkeit

Subagenten verwenden eine dedizierte In-Process-Queue-Lane:

- **Lane-Name:** `subagent`
- **Nebenläufigkeit:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein
Subagent noch lebt. Nicht beendete Läufe, die älter als das Fenster für veraltete Läufe sind,
zählen in `/subagents list`, Statuszusammenfassungen,
Descendant-Completion-Gating und Prüfungen der Nebenläufigkeit pro Sitzung nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Läufe entfernt, außer
ihre Child-Sitzung ist mit `abortedLastRun: true` markiert. Diese
beim Neustart abgebrochenen Child-Sitzungen bleiben über den Orphan-Recovery-Flow für Subagenten
wiederherstellbar, der eine synthetische Resume-Nachricht sendet, bevor der Abbruch-Marker gelöscht wird.

<Note>
Wenn ein Subagent-Spawn mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Status bearbeiten.
Interne Koordination von `sessions_spawn` sollte sich als
`client.id: "gateway-client"` mit `client.mode: "backend"` über direkte
loopback-Authentifizierung mit gemeinsamem Token/Passwort verbinden; dieser Pfad hängt nicht von der Baseline des Scope für gepaarte Geräte der CLI ab. Remote-Aufrufer, explizite
`deviceIdentity`, explizite Pfade mit Device-Token und Browser-/Node-Clients
benötigen für Scope-Upgrades weiterhin die normale Gerätefreigabe.
</Note>

## Stoppen

- Das Senden von `/stop` im Chat des Anfragenden bricht die Sitzung des Anfragenden ab und stoppt alle aktiven daraus gestarteten Subagent-Läufe, kaskadierend auch für verschachtelte Kinder.
- `/subagents kill <id>` stoppt einen bestimmten Subagenten und kaskadiert zu dessen Kindern.

## Einschränkungen

- Die Meldung von Subagenten erfolgt **nach bestem Bemühen**. Wenn das Gateway neu startet, gehen ausstehende Aufgaben zum „Zurückmelden“ verloren.
- Subagenten teilen sich weiterhin dieselben Ressourcen des Gateway-Prozesses; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Subagent-Kontext injiziert nur `AGENTS.md` + `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Kinder pro Sitzung (Standard `5`, Bereich `1–20`).

## Verwandt

- [ACP-Agenten](/de/tools/acp-agents)
- [Agent send](/de/tools/agent-send)
- [Hintergrund-Tasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
