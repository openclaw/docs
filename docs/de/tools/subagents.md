---
read_when:
    - Sie möchten Hintergrundarbeit oder parallele Arbeit über den Agenten ausführen lassen
    - Sie ändern sessions_spawn oder die Richtlinie für Sub-Agent-Tools
    - Sie implementieren oder beheben Probleme mit threadgebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Isolierte Agent-Läufe im Hintergrund starten, die Ergebnisse an den Chat der anfragenden Person zurückmelden
title: Unteragenten
x-i18n:
    generated_at: "2026-05-11T20:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agents sind Hintergrund-Agent-Läufe, die aus einem bestehenden Agent-Lauf gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**melden** ihr Ergebnis nach Abschluss an den anfordernden Chatkanal zurück.
Jeder Sub-Agent-Lauf wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Primäre Ziele:

- Arbeiten für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungs-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext
und Token-Verbrauch. Legen Sie für umfangreiche oder repetitive Aufgaben ein
günstigeres Modell für Sub-Agents fest und lassen Sie Ihren Haupt-Agent auf
einem höherwertigen Modell. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder agentenspezifische Überschreibungen.
Wenn ein untergeordneter Agent tatsächlich das aktuelle Transkript des
Anforderers benötigt, kann der Agent für genau diesen Start
`context: "fork"` anfordern. Thread-gebundene Sub-Agent-Sitzungen verwenden
standardmäßig `context: "fork"`, weil sie die aktuelle Unterhaltung in einen
Folge-Thread verzweigen.
</Note>

## Slash-Befehl

Verwenden Sie `/subagents`, um Sub-Agent-Läufe für die **aktuelle Sitzung** zu
prüfen oder zu steuern:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Verwenden Sie den übergeordneten [`/steer <message>`](/de/tools/steer), um den aktiven Lauf der aktuellen anfordernden Sitzung zu steuern. Verwenden Sie `/subagents steer <id|#> <message>`, wenn das Ziel ein untergeordneter Lauf ist.

`/subagents info` zeigt Laufmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine
begrenzte, sicherheitsgefilterte Rückblickansicht; prüfen Sie den
Transkriptpfad auf der Festplatte, wenn Sie das rohe vollständige Transkript
benötigen.

### Steuerelemente für Thread-Bindung

Diese Befehle funktionieren in Kanälen, die dauerhafte Thread-Bindungen
unterstützen. Siehe [Kanäle mit Thread-Unterstützung](#thread-supporting-channels) unten.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Startverhalten

`/subagents spawn` startet einen Hintergrund-Sub-Agent als Benutzerbefehl
(nicht als interne Weiterleitung) und sendet eine abschließende
Fertigstellungsmeldung an den anfordernden Chat zurück, wenn der Lauf endet.

<AccordionGroup>
  <Accordion title="Nicht blockierende, push-basierte Fertigstellung">
    - Der Startbefehl ist nicht blockierend; er gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss meldet der Sub-Agent eine Zusammenfassung/Ergebnisnachricht an den anfordernden Chatkanal zurück.
    - Agent-Durchläufe, die Ergebnisse untergeordneter Agenten benötigen, sollten nach dem Starten der erforderlichen Arbeit `sessions_yield` aufrufen. Das beendet den aktuellen Turn und lässt Fertigstellungsereignisse als nächste für das Modell sichtbare Nachricht eintreffen.
    - Die Fertigstellung ist push-basiert. Sobald ein Lauf gestartet wurde, fragen Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife ab, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zum Debugging oder Eingreifen.
    - Die Ausgabe des untergeordneten Agenten ist ein Bericht/Nachweis, den der anfordernde Agent zusammenführen soll. Sie ist kein vom Benutzer verfasster Anweisungstext und kann System-, Developer- oder Benutzerregeln nicht überschreiben.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand nachverfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Bereinigungsablauf der Meldung fortgesetzt wird.

  </Accordion>
  <Accordion title="Robuste Zustellung bei manuellem Start">
    - OpenClaw übergibt Fertigstellungen über einen `agent`-Turn mit stabilem Idempotenzschlüssel an die anfordernde Sitzung zurück.
    - Wenn der anfordernde Lauf noch aktiv ist, versucht OpenClaw zuerst, diesen Lauf zu wecken/zu steuern, anstatt einen zweiten sichtbaren Antwortpfad zu starten.
    - Wenn die Übergabe der Fertigstellung an den anfordernden Agenten fehlschlägt oder keine sichtbare Ausgabe erzeugt, behandelt OpenClaw die Zustellung als fehlgeschlagen und fällt auf Queue-Routing/Wiederholung zurück. Das untergeordnete Ergebnis wird nicht roh direkt an den externen Chat gesendet.
    - Wenn die direkte Übergabe nicht verwendet werden kann, wird auf Queue-Routing zurückgegriffen.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Meldung mit kurzem exponentiellem Backoff wiederholt, bevor endgültig aufgegeben wird.
    - Die Fertigstellungszustellung behält die aufgelöste Anforderer-Route bei: Thread-gebundene oder unterhaltungsgebundene Fertigstellungsrouten haben Vorrang, wenn verfügbar; wenn der Fertigstellungsursprung nur einen Kanal bereitstellt, füllt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der anfordernden Sitzung (`lastChannel` / `lastTo` / `lastAccountId`) aus, damit direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Fertigstellungsübergabe">
    Die Fertigstellungsübergabe an die anfordernde Sitzung ist zur Laufzeit
    erzeugter interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — neuester sichtbarer `assistant`-Antworttext, andernfalls bereinigter neuester Tool-/toolResult-Text. Terminal fehlgeschlagene Läufe verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellungsanweisung, die den anfordernden Agenten anweist, in normaler Assistentenstimme umzuformulieren (keine rohen internen Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben die Standardwerte für genau diesen Lauf.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist der Einmalmodus (`mode: "run"`). Für persistente Thread-gebundene Sitzungen verwenden Sie `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) verwenden Sie `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit ankündigt. Siehe [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn Sie Fertigstellungen oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich nach ACP/acpx fragt.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.list[]`-Eintrag mit `runtime.type="acp"`; verwenden Sie die Standard-Sub-Agent-Laufzeit für normale OpenClaw-Konfigurationsagenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich
anfordert, das aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden sollten                                                                                                        | Verhalten                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Neue Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext beschrieben werden kann              | Erstellt ein sauberes untergeordnetes Transkript. Dies ist der Standard und hält den Token-Verbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder nuancierten Anweisungen abhängt, die bereits im Anforderer-Transkript vorhanden sind | Verzweigt das Anforderer-Transkript in die untergeordnete Sitzung, bevor der untergeordnete Agent startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht,
nicht als Ersatz für das Schreiben eines klaren Aufgabenprompts.

## Tool: `sessions_spawn`

Startet einen Sub-Agent-Lauf mit `deliver: false` auf der globalen
`subagent`-Lane, führt dann einen Meldeschritt aus und postet die Antwort der
Meldung in den anfordernden Chatkanal.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab.
Die Profile `coding` und `full` stellen `sessions_spawn` standardmäßig
bereit. Das Profil `messaging` tut dies nicht; fügen Sie
`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agenten,
die Arbeit delegieren sollen. Kanal-/Gruppen-, Provider-, Sandbox- und
agentenspezifische Allow-/Deny-Richtlinien können das Tool nach der
Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Denken:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Lauf-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, sofern festgelegt; andernfalls fällt es auf `0` (kein Timeout) zurück.

### Delegationsprompt-Modus

`agents.defaults.subagents.delegationMode` steuert nur die Prompt-Anleitung; es ändert keine Tool-Richtlinie und erzwingt keine Delegation.

- `suggest` (Standard): behält den Standard-Prompt-Hinweis bei, Sub-Agents für größere oder langsamere Arbeit zu verwenden.
- `prefer`: weist den Haupt-Agent an, reaktionsfähig zu bleiben und alles, was umfangreicher als eine direkte Antwort ist, über `sessions_spawn` zu delegieren.

Agentenspezifische Überschreibungen verwenden `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Tool-Parameter

<ParamField path="task" type="string" required>
  Die Aufgabenbeschreibung für den Sub-Agenten.
</ParamField>
<ParamField path="taskName" type="string">
  Optionaler stabiler Bezeichner für spätere `subagents`-Zielangaben. Muss `[a-z][a-z0-9_]{0,63}` entsprechen und darf kein reserviertes Ziel wie `last` oder `all` sein. Bevorzugen Sie ihn, wenn der Koordinator nach dem Starten mehrerer untergeordneter Prozesse ein bestimmtes Kind steuern, beenden oder identifizieren muss.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agent-ID starten, wenn `subagents.allowAgents` dies erlaubt.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für Einträge in `agents.list[]`, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine vorhandene ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Starts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die übergeordnete Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Starts weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Sub-Agent-Modell. Ungültige Werte werden übersprungen und der Sub-Agent läuft mit dem Standardmodell, mit einer Warnung im Tool-Ergebnis.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt die Denkstufe für den Sub-Agent-Lauf.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird der Sub-Agent-Lauf nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird für diese Sub-Agent-Sitzung eine Kanal-Thread-Bindung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` ist und `mode` weggelassen wird, wird der Standardwert zu `session`. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert sofort nach der Ankündigung (behält das Transkript weiterhin durch Umbenennen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Start ab, sofern die Ziel-Laufzeitumgebung des Kindes nicht in einer Sandbox läuft.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die Kind-Sitzung. Nur native Sub-Agents. Thread-gebundene Starts verwenden standardmäßig `fork`; Nicht-Thread-Starts verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Parameter für Kanalzustellung (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die Zustellung
`message`/`sessions_send` aus dem gestarteten Lauf.
</Warning>

### Aufgabennamen und Zielangaben

`taskName` ist ein modellseitiger Bezeichner für die Orchestrierung, kein Sitzungsschlüssel.
Verwenden Sie ihn für stabile Kind-Namen wie `review_subagents`,
`linux_validation` oder `docs_update`, wenn ein Koordinator dieses Kind später
möglicherweise steuern oder beenden muss.

Die Zielauflösung akzeptiert exakte `taskName`-Übereinstimmungen und eindeutige
Präfixe. Der Abgleich ist auf dasselbe aktive/aktuelle Zielfenster beschränkt,
das auch von nummerierten `/subagents`-Zielen verwendet wird, sodass ein veraltetes
abgeschlossenes Kind einen wiederverwendeten Bezeichner nicht mehrdeutig macht.
Wenn zwei aktive oder aktuelle Kinder denselben `taskName` teilen, ist das Ziel
mehrdeutig; verwenden Sie stattdessen den Listenindex, den Sitzungsschlüssel oder
die Lauf-ID.

Die reservierten Ziele `last` und `all` sind keine gültigen `taskName`-Werte,
weil sie bereits Steuerungsbedeutungen haben.

## Tool: `sessions_yield`

Beendet den aktuellen Modellzug und wartet darauf, dass Laufzeitereignisse, vor allem
Abschlussereignisse von Sub-Agents, als nächste Nachricht eintreffen. Verwenden Sie es
nach dem Starten erforderlicher Kind-Arbeit, wenn der Anforderer keine endgültige
Antwort liefern kann, bis diese Abschlüsse eintreffen.

`sessions_yield` ist das Warteprimitive. Ersetzen Sie es nicht durch Polling-Schleifen
über `subagents`, `sessions_list`, `sessions_history`, Shell-`sleep` oder Prozess-Polling,
nur um den Abschluss eines Kindes zu erkennen.

Verwenden Sie `sessions_yield` nur, wenn die effektive Tool-Liste der Sitzung es enthält.
Einige minimale oder benutzerdefinierte Tool-Profile stellen möglicherweise `sessions_spawn`
und `subagents` bereit, ohne `sessions_yield` bereitzustellen; erfinden Sie in diesem Fall
keine Polling-Schleife, nur um auf den Abschluss zu warten.

Wenn aktive Kinder vorhanden sind, fügt OpenClaw einen kompakten, von der Laufzeit erzeugten
Prompt-Block `Active Subagents` in normale Züge ein, damit der Anforderer die aktuellen
Kind-Sitzungen, Lauf-IDs, Status, Labels, Aufgaben und `taskName`-Aliasse ohne Polling sehen
kann. Die Aufgaben- und Label-Felder in diesem Block sind als Daten zitiert, nicht als
Anweisungen, weil sie aus benutzer- oder modellbereitgestellten Startargumenten stammen können.

## Tool: `subagents`

Listet, steuert oder beendet gestartete Sub-Agent-Läufe, die der Anforderersitzung gehören.
Der Geltungsbereich ist auf den aktuellen Anforderer beschränkt; ein Kind kann nur seine
eigenen kontrollierten Kinder sehen/steuern.

Verwenden Sie `subagents` für Status bei Bedarf, Debugging, Steuerung oder Beenden.
Verwenden Sie `sessions_yield`, um auf Abschlussereignisse zu warten.

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an einen Thread
gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiterhin an
dieselbe Sub-Agent-Sitzung weitergeleitet werden.

### Thread-unterstützende Kanäle

**Discord** ist derzeit der einzige unterstützte Kanal. Er unterstützt
persistente Thread-gebundene Subagent-Sitzungen (`sessions_spawn` mit
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
    OpenClaw erstellt oder bindet im aktiven Kanal einen Thread an dieses Sitzungsziel.
  </Step>
  <Step title="Folgenachrichten weiterleiten">
    Antworten und Folgenachrichten in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Timeouts prüfen">
    Verwenden Sie `/session idle`, um automatische Inaktivitäts-Entfokussierung zu prüfen/aktualisieren, und
    `/session max-age`, um die feste Obergrenze zu steuern.
  </Step>
  <Step title="Lösen">
    Verwenden Sie `/unfocus`, um die Bindung manuell zu lösen.
  </Step>
</Steps>

### Manuelle Steuerungen

| Befehl             | Wirkung                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Sitzungsziel |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                |
| `/agents`          | Listet aktive Läufe und den Bindungsstatus auf (`thread:<id>` oder `unbound`) |
| `/session idle`    | Inaktivitäts-Auto-Entfokussierung prüfen/aktualisieren (nur fokussierte gebundene Threads) |
| `/session max-age` | Feste Obergrenze prüfen/aktualisieren (nur fokussierte gebundene Threads) |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal-Override und Schlüssel für automatische Bindung beim Start** sind adapterspezifisch. Siehe [Thread-unterstützende Kanäle](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste von Agent-IDs, die über explizites `agentId` als Ziel verwendet werden können (`["*"]` erlaubt beliebige). Standard: nur der Anforderer-Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Anforderer sich selbst mit `agentId` startet, nehmen Sie die Anforderer-ID in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist für Ziel-Agents, die verwendet wird, wenn der Anforderer-Agent keine eigene `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` weglassen (erzwingt explizite Profilauswahl). Override pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout pro Aufruf für Gateway-Zustellversuche von `agent`-Ankündigungen. Werte sind positive Ganzzahlen in Millisekunden und werden auf das plattformsichere Timer-Maximum begrenzt. Vorübergehende Wiederholungen können dazu führen, dass die gesamte Wartezeit auf die Ankündigung länger als ein konfiguriertes Timeout ist.
</ParamField>

Wenn die Anforderersitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox ausgeführt würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive Modell jedes
aufgeführten Agents und eingebettete Laufzeitmetadaten, damit Aufrufer PI, Codex
App-Server und andere konfigurierte native Laufzeiten unterscheiden können.

### Auto-Archivierung

- Sub-Agent-Sitzungen werden automatisch nach `agents.defaults.subagents.archiveAfterMinutes` archiviert (Standard `60`).
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (derselbe Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (behält das Transkript weiterhin durch Umbenennen).
- Auto-Archivierung erfolgt nach bestem Aufwand; ausstehende Timer gehen verloren, wenn der Gateway neu startet.
- `runTimeoutSeconds` archiviert **nicht** automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur Auto-Archivierung bestehen.
- Auto-Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von der Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Aufwand geschlossen, wenn der Lauf endet, auch wenn das Transkript/der Sitzungsdatensatz behalten wird.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents starten
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene der
Verschachtelung zu aktivieren — das **Orchestrator-Muster**: Haupt-Agent → Orchestrator-Sub-Agent →
Arbeiter-Sub-Sub-Agents.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Tiefenstufen

| Tiefe | Form des Sitzungsschlüssels                   | Rolle                                         | Kann starten?                |
| ----- | --------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                             | Haupt-Agent                                   | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                  | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Sub-Sub-Agent (Blatt-Arbeiter)                | Nie                          |

### Ankündigungskette

Ergebnisse fließen die Kette nach oben zurück:

1. Arbeiter der Tiefe 2 wird fertig → kündigt an seinen übergeordneten Agenten an (Orchestrator der Tiefe 1).
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, wird fertig → kündigt an den Haupt-Agenten an.
3. Haupt-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen von ihren direkten Kindern.

<Note>
**Betrieblicher Hinweis:** Starten Sie untergeordnete Arbeit einmal und warten Sie auf Abschlussereignisse, anstatt Polling-Schleifen um `sessions_list`, `sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen. `sessions_list` und `/subagents list` halten Beziehungen zu untergeordneten Sessions auf Live-Arbeit fokussiert — aktive untergeordnete Sessions bleiben angehängt, beendete untergeordnete Sessions bleiben für ein kurzes aktuelles Zeitfenster sichtbar, und veraltete, nur im Store vorhandene untergeordnete Links werden nach ihrem Aktualitätsfenster ignoriert. Das verhindert, dass alte `spawnedBy`- / `parentSessionKey`-Metadaten nach einem Neustart Phantom-untergeordnete Sessions wiederherstellen. Wenn ein Abschlussereignis einer untergeordneten Session eintrifft, nachdem Sie bereits die finale Antwort gesendet haben, ist die korrekte Folgeantwort das exakte stille Token `NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Steuerungsbereich werden beim Spawnen in die Session-Metadaten geschrieben. Dadurch können flache oder wiederhergestellte Session-Schlüssel nicht versehentlich Orchestrator-Berechtigungen zurückerlangen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine untergeordneten Sessions verwalten kann. Andere Session-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Session-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Session-Tools — `sessions_spawn` wird in Tiefe 2 immer verweigert. Kann keine weiteren untergeordneten Sessions spawnen.

### Spawn-Limit pro Agent

Jede Agent-Session (in jeder Tiefe) kann höchstens `maxChildrenPerAgent` (Standard `5`) aktive untergeordnete Sessions gleichzeitig haben. Das verhindert unkontrolliertes Auffächern durch einen einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Tiefe-1-Orchestrators stoppt automatisch alle seine Tiefe-2-untergeordneten Sessions:

- `/stop` im Hauptchat stoppt alle Tiefe-1-Agents und kaskadiert zu ihren Tiefe-2-untergeordneten Sessions.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen untergeordneten Sessions.
- `/subagents kill all` stoppt alle Sub-Agents für den Anfragenden und kaskadiert.

## Authentifizierung

Sub-Agent-Auth wird nach **Agent-ID** aufgelöst, nicht nach Session-Typ:

- Der Session-Schlüssel des Sub-Agents ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agents geladen.
- Die Auth-Profile des Haupt-Agents werden als **Fallback** zusammengeführt; Agent-Profile überschreiben Hauptprofile bei Konflikten.

Die Zusammenführung ist additiv, daher sind Hauptprofile immer als Fallbacks verfügbar. Vollständig isolierte Auth pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agents melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Session (nicht in der Session des Anfragenden).
- Wenn der Sub-Agent exakt mit `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistant-Text das exakte stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, selbst wenn es früher sichtbaren Fortschritt gab.

Die Zustellung hängt von der Tiefe des Anfragenden ab:

- Sessions von Anfragenden auf oberster Ebene verwenden einen nachfolgenden `agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Subagent-Sessions von Anfragenden erhalten eine interne Folge-Injektion (`deliver=false`), damit der Orchestrator Ergebnisse untergeordneter Sessions innerhalb der Session synthetisieren kann.
- Wenn eine verschachtelte Subagent-Session des Anfragenden nicht mehr existiert, fällt OpenClaw auf den Anfragenden dieser Session zurück, sofern verfügbar.

Für Sessions von Anfragenden auf oberster Ebene löst die direkte Zustellung im Abschlussmodus zuerst eine gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und füllt dann fehlende Kanal-Zielfelder aus der gespeicherten Route der Session des Anfragenden. So bleiben Abschlüsse im richtigen Chat/Thema, selbst wenn der Ursprung des Abschlusses nur den Kanal identifiziert.

Die Aggregation von Abschlüssen untergeordneter Sessions ist beim Erstellen verschachtelter Abschlussbefunde auf den aktuellen Lauf des Anfragenden begrenzt, wodurch verhindert wird, dass Ausgaben untergeordneter Sessions aus früheren Läufen in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten Thread-/Themen-Routing bei, wenn es auf Kanaladaptern verfügbar ist.

### Ankündigungskontext

Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                                |
| Session-IDs    | Schlüssel/ID der untergeordneten Session                                                                              |
| Typ            | Ankündigungstyp + Aufgabenlabel                                                                                       |
| Status         | Aus Laufzeitergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext erschlossen |
| Ergebnisinhalt | Neuester sichtbarer Assistant-Text, sonst bereinigter neuester Tool-/toolResult-Text                                  |
| Folgeaktion    | Anweisung, die beschreibt, wann geantwortet werden soll und wann Stille gewahrt werden soll                           |

Final fehlgeschlagene Läufe melden Fehlerstatus, ohne erfassten Antworttext erneut abzuspielen. Bei Timeout kann die Ankündigung, wenn die untergeordnete Session nur Tool-Aufrufe erreicht hat, diese Historie zu einer kurzen Zusammenfassung des Teilfortschritts verdichten, anstatt rohe Tool-Ausgabe erneut abzuspielen.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn sie umbrochen wird):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Haupt-Agent die Historie über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten sollten in normaler Assistant-Stimme neu formuliert werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistant-Erinnerung wird zuerst normalisiert: Thinking-Tags werden entfernt; `<relevant-memories>`- / `<relevant_memories>`-Gerüst wird entfernt; reine Text-XML-Payload-Blöcke von Tool-Aufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) werden entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; herabgestuftes Tool-Call-/Result-Gerüst und historische Kontextmarker werden entfernt; durchgesickerte Modellsteuerungstoken (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) werden entfernt; fehlerhaftes MiniMax-Tool-Call-XML wird entfernt.
- Anmeldeinformations-/tokenähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Historien können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die Prüfung des rohen Transkripts auf der Festplatte ist der Fallback, wenn Sie das vollständige Byte-für-Byte-Transkript benötigen.

## Tool-Richtlinie

Sub-Agents verwenden zuerst dieselbe Profil- und Tool-Policy-Pipeline wie der übergeordnete oder Ziel-Agent. Danach wendet OpenClaw die Einschränkungsebene für Sub-Agents an.

Ohne restriktives `tools.profile` erhalten Sub-Agents **alle Tools außer Session-Tools** und System-Tools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Erinnerungsansicht — kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Tiefe-1-Orchestrator-Sub-Agents zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre untergeordneten Sessions verwalten können.

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

`tools.subagents.tools.allow` ist ein finaler Nur-Erlauben-Filter. Er kann die bereits aufgelöste Tool-Menge einschränken, aber er kann kein Tool **wieder hinzufügen**, das durch `tools.profile` entfernt wurde. Beispielsweise enthält `tools.profile: "coding"` `web_search`/`web_fetch`, aber nicht das `browser`-Tool. Damit Sub-Agents mit Coding-Profil Browser-Automatisierung verwenden können, fügen Sie Browser auf der Profilstufe hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie pro Agent `agents.list[].tools.alsoAllow: ["browser"]`, wenn nur ein Agent Browser-Automatisierung erhalten soll.

## Nebenläufigkeit

Sub-Agents verwenden eine dedizierte In-Process-Warteschlangen-Lane:

- **Lane-Name:** `subagent`
- **Nebenläufigkeit:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Lebendigkeit und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis, dass ein Sub-Agent noch aktiv ist. Nicht beendete Läufe, die älter als das Fenster für veraltete Läufe sind, zählen in `/subagents list`, Statuszusammenfassungen, Abschluss-Gating von Nachkommen und Nebenläufigkeitsprüfungen pro Session nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Läufe bereinigt, sofern ihre untergeordnete Session nicht als `abortedLastRun: true` markiert ist. Diese durch Neustart abgebrochenen untergeordneten Sessions bleiben über den Orphan-Recovery-Flow für Sub-Agents wiederherstellbar, der vor dem Entfernen des Abbruchmarkers eine synthetische Resume-Nachricht sendet.

Die automatische Neustartwiederherstellung ist pro untergeordneter Session begrenzt. Wenn dieselbe untergeordnete Sub-Agent-Session innerhalb des schnellen Re-Wedge-Fensters wiederholt für Orphan-Recovery akzeptiert wird, persistiert OpenClaw einen Recovery-Tombstone für diese Session und setzt sie bei späteren Neustarts nicht mehr automatisch fort. Führen Sie `openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder `openclaw doctor --fix`, um veraltete Abbruch-Recovery-Flags auf mit Tombstones markierten Sessions zu entfernen.

<Note>
Wenn das Spawnen eines Sub-Agents mit Gateway `PAIRING_REQUIRED` / `scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Zustand bearbeiten. Interne `sessions_spawn`-Koordination sollte sich als `client.id: "gateway-client"` mit `client.mode: "backend"` über direkte loopback-Shared-Token-/Passwort-Auth verbinden; dieser Pfad hängt nicht von der Baseline des gekoppelten Gerätescopes der CLI ab. Remote-Aufrufer, explizite `deviceIdentity`, explizite Gerätetoken-Pfade sowie Browser-/Node-Clients benötigen weiterhin die normale Gerätegenehmigung für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im Chat des Anfragenden bricht die Session des Anfragenden ab und stoppt alle aktiven Sub-Agent-Läufe, die daraus gespawnt wurden, mit Kaskadierung zu verschachtelten untergeordneten Sessions.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agent und kaskadiert zu seinen untergeordneten Sessions.

## Einschränkungen

- Die Sub-Agent-Ankündigung erfolgt **nach bestem Bemühen**. Wenn der Gateway neu startet, geht ausstehende „zurück ankündigen“-Arbeit verloren.
- Sub-Agents teilen sich weiterhin dieselben Gateway-Prozessressourcen; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Sub-Agent-Kontext injiziert nur `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` und `USER.md` (kein `MEMORY.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive untergeordnete Sessions pro Session (Standard `5`, Bereich `1–20`).

## Verwandte Themen

- [ACP-Agents](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrundaufgaben](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
