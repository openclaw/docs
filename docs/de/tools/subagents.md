---
read_when:
    - Sie möchten Hintergrundarbeit oder parallele Arbeit über den Agenten
    - Sie ändern `sessions_spawn` oder die Richtlinie für Sub-Agent-Tools
    - Sie implementieren oder beheben Probleme mit Thread-gebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Isolierte Agent-Ausführungen im Hintergrund starten, die Ergebnisse an den Chat der anfragenden Person zurückmelden
title: Sub-Agenten
x-i18n:
    generated_at: "2026-05-10T19:56:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b4a78b83fda42931ed2a4795e2db611121a30378de149c0478e989029123382
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agents sind im Hintergrund laufende Agent-Ausführungen, die aus einer bestehenden Agent-Ausführung heraus gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**melden** ihr Ergebnis nach Abschluss an den anfordernden Chat-
Kanal zurück. Jede Sub-Agent-Ausführung wird als
[Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Primäre Ziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne die Hauptausführung zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungstools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext
und eigenen Token-Verbrauch. Legen Sie für umfangreiche oder repetitive
Aufgaben ein günstigeres Modell für Sub-Agents fest und behalten Sie für
Ihren Haupt-Agent ein höherwertiges Modell bei. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder agentenspezifische Überschreibungen.
Wenn ein Child tatsächlich das aktuelle Transkript des Anforderers benötigt,
kann der Agent für genau diesen Spawn `context: "fork"` anfordern.
Thread-gebundene Sub-Agent-Sitzungen verwenden standardmäßig
`context: "fork"`, weil sie die aktuelle Unterhaltung in einen
Folge-Thread verzweigen.
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

Verwenden Sie den Top-Level-Befehl [`/steer <message>`](/de/tools/steer), um die aktive Ausführung der aktuellen Anforderer-Sitzung zu steuern. Verwenden Sie `/subagents steer <id|#> <message>`, wenn das Ziel eine Child-Ausführung ist.

`/subagents info` zeigt Ausführungsmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Abrufansicht; prüfen Sie den Transkriptpfad auf der Festplatte,
wenn Sie das unverarbeitete vollständige Transkript benötigen.

### Thread-Bindungssteuerung

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
internes Relay) und sendet ein abschließendes Abschlussupdate an den
Anforderer-Chat, sobald die Ausführung beendet ist.

<AccordionGroup>
  <Accordion title="Nicht blockierender, pushbasierter Abschluss">
    - Der Spawn-Befehl ist nicht blockierend; er gibt sofort eine Ausführungs-ID zurück.
    - Nach Abschluss meldet der Sub-Agent eine Zusammenfassung/Ergebnisnachricht an den Chat-Kanal des Anforderers zurück.
    - Agent-Turns, die Child-Ergebnisse benötigen, sollten nach dem Starten erforderlicher Arbeit `sessions_yield` aufrufen. Dadurch endet der aktuelle Turn und Abschlussereignisse können als nächste für das Modell sichtbare Nachricht eintreffen.
    - Der Abschluss ist pushbasiert. Sobald ein Spawn gestartet wurde, fragen Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife ab, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf für Debugging oder Eingriffe.
    - Child-Ausgabe ist ein Bericht/Nachweis, den der anfordernde Agent zusammenfassen soll. Sie ist kein vom Benutzer verfasster Anweisungstext und kann System-, Entwickler- oder Benutzerrichtlinien nicht überschreiben.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand nachverfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Ablauf zur Ankündigungsbereinigung fortgesetzt wird.

  </Accordion>
  <Accordion title="Robustheit der Zustellung bei manuellem Spawn">
    - OpenClaw übergibt Abschlüsse über einen `agent`-Turn mit einem stabilen Idempotenzschlüssel zurück an die Anforderer-Sitzung.
    - Wenn die Anforderer-Ausführung noch aktiv ist, versucht OpenClaw zuerst, diese Ausführung aufzuwecken/zu steuern, anstatt einen zweiten sichtbaren Antwortpfad zu starten.
    - Wenn die Abschlussübergabe an den Anforderer-Agent fehlschlägt oder keine sichtbare Ausgabe erzeugt, behandelt OpenClaw die Zustellung als fehlgeschlagen und fällt auf Queue-Routing/Wiederholung zurück. Es sendet das Child-Ergebnis nicht direkt roh an den externen Chat.
    - Wenn die direkte Übergabe nicht verwendet werden kann, fällt es auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Meldung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Anforderer-Route bei: Thread-gebundene oder unterhaltungsgebundene Abschlussrouten haben Vorrang, wenn sie verfügbar sind; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der Anforderer-Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), damit direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Abschlussübergabe">
    Die Abschlussübergabe an die Anforderer-Sitzung ist zur Laufzeit erzeugter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — neuester sichtbarer `assistant`-Antworttext, andernfalls bereinigter neuester Tool-/toolResult-Text. Terminal fehlgeschlagene Ausführungen verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Zustellanweisung, die den Anforderer-Agent anweist, in normaler Assistentenstimme umzuschreiben (keine rohen internen Metadaten weiterzuleiten).

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben die Standardwerte für genau diese Ausführung.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - `/subagents spawn` ist der Einmalmodus (`mode: "run"`). Verwenden Sie für persistente Thread-gebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit bewirbt. Siehe [ACP-Zustellmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich ACP/acpx verlangt.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.list[]`-Eintrag mit `runtime.type="acp"`; verwenden Sie die standardmäßige Sub-Agent-Laufzeit für normale OpenClaw-Konfigurations-Agenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich anfordert,
das aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden                                                                                                                     | Verhalten                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext kurz beschrieben werden kann          | Erstellt ein sauberes Child-Transkript. Dies ist der Standard und hält den Token-Verbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder nuancierten Anweisungen abhängt, die bereits im Anforderer-Transkript vorhanden sind | Verzweigt das Anforderer-Transkript in die Child-Sitzung, bevor das Child startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht,
nicht als Ersatz für das Schreiben eines klaren Aufgaben-Prompts.

## Tool: `sessions_spawn`

Startet eine Sub-Agent-Ausführung mit `deliver: false` auf der globalen
`subagent`-Lane, führt dann einen Ankündigungsschritt aus und postet die
Ankündigungsantwort in den Chat-Kanal des Anforderers.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab.
Die Profile `coding` und `full` stellen `sessions_spawn` standardmäßig bereit.
Das Profil `messaging` tut dies nicht; fügen Sie
`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agenten,
die Arbeit delegieren sollen. Kanal-/Gruppen-, Provider-, Sandbox- und
agentenspezifische Zulassen-/Ablehnen-Richtlinien können das Tool nach der
Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen; ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Thinking:** erbt vom Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen; ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Ausführungs-Timeout:** Wenn `sessions_spawn.runTimeoutSeconds` ausgelassen wird, verwendet OpenClaw `agents.defaults.subagents.runTimeoutSeconds`, sofern gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout).

### Delegations-Prompt-Modus

`agents.defaults.subagents.delegationMode` steuert nur die Prompt-Anleitung; es ändert keine Tool-Richtlinie und erzwingt keine Delegation.

- `suggest` (Standard): behält den Standard-Prompt-Hinweis bei, Sub-Agents für größere oder langsamere Arbeit zu verwenden.
- `prefer`: weist den Haupt-Agent an, reaktionsfähig zu bleiben und alles, was aufwendiger ist als eine direkte Antwort, über `sessions_spawn` zu delegieren.

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
  Die Aufgabenbeschreibung für den Sub-Agent.
</ParamField>
<ParamField path="taskName" type="string">
  Optionaler stabiler Bezeichner für späteres `subagents`-Targeting. Muss `[a-z][a-z0-9_]{0,63}` entsprechen und darf kein reserviertes Ziel wie `last` oder `all` sein. Bevorzugen Sie ihn, wenn der Koordinator nach dem Starten mehrerer Childs ein bestimmtes Child steuern, beenden oder identifizieren muss.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen Agent-ID starten, wenn `subagents.allowAgents` dies erlaubt.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge bestimmt, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine vorhandene ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Starts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die Parent-Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Starts weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Sub-Agent-Modell. Ungültige Werte werden übersprungen, und der Sub-Agent läuft mit einer Warnung im Tool-Ergebnis auf dem Standardmodell.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt das Thinking-Level für den Sub-Agent-Lauf.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standardmäßig `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt, andernfalls `0`. Wenn gesetzt, wird der Sub-Agent-Lauf nach N Sekunden abgebrochen.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird eine Kanal-Thread-Bindung für diese Sub-Agent-Sitzung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` ist und `mode` weggelassen wird, wird der Standardwert zu `session`. `mode: "session"` erfordert `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert unmittelbar nach der Ankündigung (behält das Transkript weiterhin per Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Start ab, sofern die Ziel-Child-Runtime nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Requesters in die Child-Sitzung. Nur native Sub-Agents. Thread-gebundene Starts verwenden standardmäßig `fork`; nicht threadgebundene Starts verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Parameter für die Kanalzustellung (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Verwenden Sie für die Zustellung
`message`/`sessions_send` aus dem gestarteten Lauf.
</Warning>

### Aufgabennamen und Targeting

`taskName` ist ein modellseitiger Bezeichner für Orchestrierung, kein Sitzungsschlüssel.
Verwenden Sie ihn für stabile Child-Namen wie `review_subagents`,
`linux_validation` oder `docs_update`, wenn ein Koordinator dieses Child später
steuern oder beenden muss.

Die Zielauflösung akzeptiert exakte `taskName`-Treffer und eindeutige
Präfixe. Der Abgleich ist auf dasselbe aktive/aktuelle Zielfenster beschränkt,
das von nummerierten `/subagents`-Zielen verwendet wird, sodass ein veraltetes
abgeschlossenes Child einen wiederverwendeten Bezeichner nicht mehrdeutig macht.
Wenn zwei aktive oder aktuelle Childs denselben `taskName` teilen, ist das Ziel
mehrdeutig; verwenden Sie stattdessen den Listenindex, den Sitzungsschlüssel oder
die Lauf-ID.

Die reservierten Ziele `last` und `all` sind keine gültigen `taskName`-Werte,
weil sie bereits Steuerungsbedeutungen haben.

## Tool: `sessions_yield`

Beendet den aktuellen Modell-Turn und wartet darauf, dass Runtime-Ereignisse,
hauptsächlich Abschlussereignisse von Sub-Agents, als nächste Nachricht eintreffen.
Verwenden Sie es nach dem Starten erforderlicher Child-Arbeit, wenn der Requester
keine finale Antwort erzeugen kann, bis diese Abschlüsse eintreffen.

`sessions_yield` ist das Warteprimitiv. Ersetzen Sie es nicht durch Polling-Schleifen
über `subagents`, `sessions_list`, `sessions_history`, Shell-`sleep` oder
Prozess-Polling, nur um Child-Abschluss zu erkennen.

Verwenden Sie `sessions_yield` nur, wenn die effektive Tool-Liste der Sitzung es
enthält. Manche minimalen oder benutzerdefinierten Tool-Profile können
`sessions_spawn` und `subagents` bereitstellen, ohne `sessions_yield`
bereitzustellen; erfinden Sie in diesem Fall keine Polling-Schleife, nur um auf
Abschluss zu warten.

Wenn aktive Childs vorhanden sind, injiziert OpenClaw einen kompakten,
Runtime-generierten `Active Subagents`-Promptblock in normale Turns, damit der
Requester die aktuellen Child-Sitzungen, Lauf-IDs, Status, Labels, Aufgaben und
`taskName`-Aliase ohne Polling sehen kann. Die Aufgaben- und Labelfelder in
diesem Block werden als Daten zitiert, nicht als Anweisungen, weil sie aus von
Benutzern/Modellen bereitgestellten Startargumenten stammen können.

## Tool: `subagents`

Listet, steuert oder beendet gestartete Sub-Agent-Läufe, die der
Requester-Sitzung gehören. Es ist auf den aktuellen Requester beschränkt; ein
Child kann nur seine eigenen kontrollierten Childs sehen/steuern.

Verwenden Sie `subagents` für Status nach Bedarf, Debugging, Steuerung oder
Beenden. Verwenden Sie `sessions_yield`, um auf Abschlussereignisse zu warten.

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an
einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem
Thread weiterhin an dieselbe Sub-Agent-Sitzung geleitet werden.

### Thread-unterstützende Kanäle

**Discord** ist derzeit der einzige unterstützte Kanal. Er unterstützt
persistente threadgebundene Subagent-Sitzungen (`sessions_spawn` mit
`thread: true`), manuelle Thread-Steuerungen (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) sowie die Adapter-Schlüssel
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
    OpenClaw erstellt oder bindet im aktiven Kanal einen Thread an dieses Sitzungsziel.
  </Step>
  <Step title="Route follow-ups">
    Antworten und nachfolgende Nachrichten in diesem Thread werden an die gebundene Sitzung geleitet.
  </Step>
  <Step title="Inspect timeouts">
    Verwenden Sie `/session idle`, um automatische Inaktivitäts-Aufhebung des Fokus zu prüfen/aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Detach">
    Verwenden Sie `/unfocus`, um manuell zu lösen.
  </Step>
</Steps>

### Manuelle Steuerungen

| Befehl             | Wirkung                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Sitzungsziel |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                |
| `/agents`          | Listet aktive Läufe und Bindungsstatus (`thread:<id>` oder `unbound`) |
| `/session idle`    | Inaktivitäts-Auto-Unfocus prüfen/aktualisieren (nur fokussierte gebundene Threads) |
| `/session max-age` | Harte Obergrenze prüfen/aktualisieren (nur fokussierte gebundene Threads) |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal-Override- und Spawn-Auto-Bind-Schlüssel** sind adapterspezifisch. Siehe oben [Thread-unterstützende Kanäle](#thread-supporting-channels).

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste von Agent-IDs, die über explizites `agentId` als Ziel verwendet werden können (`["*"]` erlaubt alle). Standard: nur der Requester-Agent. Wenn Sie eine Liste festlegen und dennoch möchten, dass der Requester sich selbst mit `agentId` startet, nehmen Sie die Requester-ID in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Ziel-Agent-Allowlist, die verwendet wird, wenn der Requester-Agent kein eigenes `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` weglassen (erzwingt explizite Profilauswahl). Pro-Agent-Override: `agents.list[].subagents.requireAgentId`.
</ParamField>

Wenn die Requester-Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab,
die unsandboxed laufen würden.

### Discovery

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive Modell jedes
aufgelisteten Agents und eingebettete Runtime-Metadaten, damit Aufrufer PI,
Codex-App-Server und andere konfigurierte native Runtimes unterscheiden können.

### Auto-Archivierung

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` (Standard `60`) automatisch archiviert.
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (derselbe Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (behält das Transkript weiterhin per Umbenennung).
- Auto-Archivierung erfolgt nach bestem Aufwand; ausstehende Timer gehen verloren, wenn der Gateway neu startet.
- `runTimeoutSeconds` archiviert nicht automatisch; es stoppt nur den Lauf. Die Sitzung bleibt bis zur Auto-Archivierung erhalten.
- Auto-Archivierung gilt gleichermaßen für Sitzungen auf Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Aufwand geschlossen, wenn der Lauf endet, auch wenn das Transkript/der Sitzungseintrag behalten wird.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents starten
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene der
Verschachtelung zu aktivieren — das **Orchestrator-Muster**: Main → Orchestrator-Sub-Agent →
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

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                         | Kann starten?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                   | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Nie                          |

### Ankündigungskette

Ergebnisse fließen die Kette nach oben zurück:

1. Worker auf Tiefe 2 beendet → kündigt seinem Parent an (Orchestrator auf Tiefe 1).
2. Orchestrator auf Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet → kündigt Main an.
3. Haupt-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen von ihren direkten Childs.

<Note>
**Betriebliche Anleitung:** Starten Sie Child-Arbeit einmal und warten Sie auf Abschlussereignisse,
statt Polling-Schleifen um `sessions_list`, `sessions_history`, `/subagents list`
oder `exec`-Sleep-Befehle zu bauen. `sessions_list` und `/subagents list`
halten Child-Sitzungsbeziehungen auf Live-Arbeit fokussiert — Live-Childs bleiben
angehängt, beendete Childs bleiben für ein kurzes aktuelles Fenster sichtbar,
und veraltete, nur im Store vorhandene Child-Links werden nach ihrem Freshness-Fenster
ignoriert. Das verhindert, dass alte `spawnedBy`-/
`parentSessionKey`-Metadaten nach einem Neustart Ghost-Childs wiederbeleben.
Wenn ein Child-Abschlussereignis eintrifft, nachdem Sie bereits die finale
Antwort gesendet haben, ist die korrekte Folgeaktion das exakt stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Kontrollumfang werden beim Start in die Sitzungsmetadaten geschrieben. Dadurch können flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich erneut Orchestrator-Berechtigungen erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er seine Kinder verwalten kann. Andere Sitzungs-/Systemtools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Sitzungstools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Sitzungstools — `sessions_spawn` wird auf Tiefe 2 immer verweigert. Kann keine weiteren Kinder starten.

### Startlimit pro Agent

Jede Agent-Sitzung (auf jeder Tiefe) kann gleichzeitig höchstens `maxChildrenPerAgent`
(Standard `5`) aktive Kinder haben. Das verhindert ein unkontrolliertes Auffächern
durch einen einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Orchestrators auf Tiefe 1 stoppt automatisch alle seine Kinder
auf Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agenten auf Tiefe 1 und kaskadiert zu ihren Kindern auf Tiefe 2.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Kindern.
- `/subagents kill all` stoppt alle Sub-Agenten für den Anforderer und kaskadiert.

## Authentifizierung

Die Authentifizierung von Sub-Agenten wird nach **Agent-ID** aufgelöst, nicht nach Sitzungstyp:

- Der Sitzungsschlüssel des Sub-Agenten ist `agent:<agentId>:subagent:<uuid>`.
- Der Authentifizierungsspeicher wird aus dem `agentDir` dieses Agenten geladen.
- Die Authentifizierungsprofile des Hauptagenten werden als **Fallback** zusammengeführt; Agentenprofile überschreiben Hauptprofile bei Konflikten.

Die Zusammenführung ist additiv, daher sind Hauptprofile immer als
Fallbacks verfügbar. Vollständig isolierte Authentifizierung pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agenten melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Sitzung (nicht in der Anforderer-Sitzung).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistententext exakt dem stillen Token `NO_REPLY` / `no_reply` entspricht, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Tiefe des Anforderers ab:

- Anforderer-Sitzungen der obersten Ebene verwenden einen nachgelagerten `agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Anforderer-Subagent-Sitzungen erhalten eine interne nachgelagerte Injektion (`deliver=false`), damit der Orchestrator Kind-Ergebnisse innerhalb der Sitzung synthetisieren kann.
- Wenn eine verschachtelte Anforderer-Subagent-Sitzung nicht mehr vorhanden ist, fällt OpenClaw auf den Anforderer dieser Sitzung zurück, sofern verfügbar.

Für Anforderer-Sitzungen der obersten Ebene löst die direkte Zustellung im Abschlussmodus zuerst
jede gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und füllt dann
fehlende Kanal-Zielfelder aus der gespeicherten Route der Anforderer-Sitzung.
Dadurch bleiben Abschlüsse im richtigen Chat/Thema, selbst wenn der Abschlussursprung
nur den Kanal identifiziert.

Die Aggregation von Kind-Abschlüssen ist beim Erstellen verschachtelter Abschlussbefunde
auf den aktuellen Anforderer-Lauf begrenzt, sodass veraltete Kind-Ausgaben aus früheren Läufen
nicht in die aktuelle Ankündigung gelangen. Ankündigungsantworten bewahren
Thread-/Themen-Routing, wenn es auf Kanaladaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Quelle         | `subagent` oder `cron`                                                                                             |
| Sitzungs-IDs   | Sitzungsschlüssel/-ID des Kindes                                                                                   |
| Typ            | Ankündigungstyp + Aufgabenlabel                                                                                    |
| Status         | Aus dem Laufzeitergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistententext, andernfalls bereinigter neuester Tool-/toolResult-Text                        |
| Follow-up      | Anweisung, die beschreibt, wann geantwortet werden soll und wann Stille angebracht ist                              |

Abgeschlossene fehlgeschlagene Läufe melden den Fehlerstatus, ohne erfassten
Antworttext erneut abzuspielen. Bei einem Timeout kann die Ankündigung,
wenn das Kind nur bis zu Tool-Aufrufen gekommen ist, diese Historie zu einer kurzen
Zusammenfassung des Teilfortschritts verdichten, anstatt rohe Tool-Ausgabe erneut
abzuspielen.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn sie umschlossen sind):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Hauptagent den Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann.

Interne Metadaten sind nur für die Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistentenstimme neu formuliert werden.

### Warum `sessions_history` bevorzugt wird

`sessions_history` ist der sicherere Orchestrierungspfad:

- Der Assistentenabruf wird zuerst normalisiert: Thinking-Tags werden entfernt; `<relevant-memories>`- / `<relevant_memories>`-Gerüste werden entfernt; Klartext-XML-Payload-Blöcke von Tool-Aufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) werden entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; herabgestufte Tool-Aufruf-/Ergebnisgerüste und Marker für historischen Kontext werden entfernt; durchgesickerte Modell-Kontrolltokens (`<|assistant|>`, andere ASCII-`<|...|>`, vollbreite `<｜...｜>`) werden entfernt; fehlerhaftes MiniMax-Tool-Aufruf-XML wird entfernt.
- Anmeldedaten-/Token-ähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Historien können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die Prüfung des rohen Transkripts auf dem Datenträger ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Sub-Agenten verwenden zuerst dieselbe Profil- und Tool-Richtlinien-Pipeline wie der übergeordnete
oder Zielagent. Danach wendet OpenClaw die Einschränkungsschicht für Sub-Agenten an.

Ohne restriktives `tools.profile` erhalten Sub-Agenten **alle Tools außer
Sitzungstools** und Systemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Abrufansicht — es
ist kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agenten auf Tiefe 1 zusätzlich
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

`tools.subagents.tools.allow` ist ein finaler Allow-only-Filter. Er kann
die bereits aufgelöste Tool-Menge einschränken, aber er kann kein Tool **wieder hinzufügen**,
das durch `tools.profile` entfernt wurde. Beispielsweise enthält `tools.profile: "coding"`
`web_search`/`web_fetch`, aber nicht das `browser`-Tool. Damit
Sub-Agenten mit Coding-Profil Browser-Automatisierung verwenden können, fügen Sie Browser auf der
Profilstufe hinzu:

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

Sub-Agenten verwenden eine dedizierte In-Process-Warteschlangen-Lane:

- **Lane-Name:** `subagent`
- **Parallelität:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Lebendigkeit und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein
Sub-Agent noch lebt. Nicht beendete Läufe, die älter als das Stale-Run-Fenster sind,
zählen in `/subagents list`, Statuszusammenfassungen,
Abschluss-Gating von Nachkommen und Nebenläufigkeitsprüfungen pro Sitzung nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Läufe entfernt, es sei denn,
ihre Kind-Sitzung ist als `abortedLastRun: true` markiert. Diese
durch den Neustart abgebrochenen Kind-Sitzungen bleiben über den Orphan-Recovery-Flow
des Sub-Agenten wiederherstellbar, der vor dem Löschen der Abbruchmarkierung
eine synthetische Resume-Nachricht sendet.

Die automatische Neustart-Wiederherstellung ist pro Kind-Sitzung begrenzt. Wenn dasselbe
Sub-Agent-Kind innerhalb des schnellen Re-Wedge-Fensters wiederholt für die Orphan-Wiederherstellung
akzeptiert wird, speichert OpenClaw einen Wiederherstellungs-Tombstone auf dieser
Sitzung und setzt sie bei späteren Neustarts nicht mehr automatisch fort. Führen Sie
`openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder
`openclaw doctor --fix`, um veraltete abgebrochene Wiederherstellungsflags auf
tombstoned Sitzungen zu löschen.

<Note>
Wenn das Starten eines Sub-Agenten mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Pairing-Zustand bearbeiten.
Interne `sessions_spawn`-Koordination sollte als
`client.id: "gateway-client"` mit `client.mode: "backend"` über direkte
Loopback-Shared-Token-/Passwort-Authentifizierung verbinden; dieser Pfad hängt nicht von der
gepaarten Geräte-Scope-Baseline der CLI ab. Remote-Aufrufer, explizite
`deviceIdentity`, explizite Geräte-Token-Pfade und Browser-/Node-Clients
benötigen weiterhin normale Gerätegenehmigung für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im Anforderer-Chat bricht die Anforderer-Sitzung ab und stoppt alle aktiven Sub-Agent-Läufe, die daraus gestartet wurden, einschließlich Kaskadierung zu verschachtelten Kindern.
- `/subagents kill <id>` stoppt einen bestimmten Sub-Agenten und kaskadiert zu seinen Kindern.

## Einschränkungen

- Die Sub-Agent-Ankündigung ist **Best Effort**. Wenn der Gateway neu startet, geht ausstehende „Zurückmelden“-Arbeit verloren.
- Sub-Agenten teilen weiterhin dieselben Gateway-Prozessressourcen; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Der Sub-Agent-Kontext injiziert nur `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` und `USER.md` (kein `MEMORY.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`).
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Kinder pro Sitzung (Standard `5`, Bereich `1–20`).

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrund-Tasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
