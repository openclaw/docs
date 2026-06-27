---
read_when:
    - Sie möchten Hintergrund- oder Parallelarbeit über den Agenten durchführen
    - Sie ändern die Richtlinie für sessions_spawn oder das Sub-Agent-Tool
    - Sie implementieren oder beheben Fehler bei threadgebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Isolierte Hintergrund-Agentenläufe starten, die Ergebnisse an den anfragenden Chat zurückmelden
title: Sub-Agents
x-i18n:
    generated_at: "2026-06-27T18:21:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agents sind Hintergrund-Agent-Ausführungen, die aus einer bestehenden Agent-Ausführung heraus gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**melden** ihr Ergebnis nach Abschluss zurück an den anfordernden Chat-
Kanal. Jede Sub-Agent-Ausführung wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Primäre Ziele:

- „Recherche / lange Aufgabe / langsames Tool“-Arbeit parallelisieren, ohne die Hauptausführung zu blockieren.
- Sub-Agents standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agents erhalten standardmäßig **keine** Sitzungs-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig seinen eigenen Kontext und
Token-Verbrauch. Legen Sie für umfangreiche oder repetitive Aufgaben ein günstigeres Modell
für Sub-Agents fest und behalten Sie für Ihren Haupt-Agent ein Modell mit höherer Qualität bei.
Konfigurieren Sie dies über `agents.defaults.subagents.model` oder über agentenspezifische
Überschreibungen. Wenn ein untergeordneter Agent wirklich das aktuelle Transkript
    des Anforderers benötigt, kann der Agent bei diesem einen Start
    `context: "fork"` anfordern. Thread-gebundene Sub-Agent-Sitzungen verwenden standardmäßig
    `context: "fork"`, weil sie die aktuelle Unterhaltung in einen
    Follow-up-Thread verzweigen.
</Note>

## Slash-Befehl

Verwenden Sie `/subagents`, um Sub-Agent-Ausführungen für die **aktuelle Sitzung** zu prüfen:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` zeigt Ausführungsmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Abrufansicht; prüfen Sie den Transkriptpfad auf dem Datenträger, wenn Sie
das rohe vollständige Transkript benötigen.

### Steuerelemente für Thread-Bindungen

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

Agents starten Hintergrund-Sub-Agents mit `sessions_spawn`. Abschlüsse von Sub-Agents
werden als interne Ereignisse der übergeordneten Sitzung zurückgegeben; der übergeordnete/anfordernde Agent entscheidet,
ob eine nutzerseitige Aktualisierung erforderlich ist.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` ist nicht blockierend; es gibt sofort eine Ausführungs-ID zurück.
    - Beim Abschluss meldet sich der Sub-Agent an die übergeordnete/anfordernde Sitzung zurück.
    - Agent-Durchläufe, die Ergebnisse von untergeordneten Agents benötigen, sollten nach dem Starten erforderlicher Arbeit `sessions_yield` aufrufen. Dadurch wird der aktuelle Durchlauf beendet, und Abschlussereignisse können als nächste für das Modell sichtbare Nachricht eintreffen.
    - Der Abschluss ist push-basiert. Sobald gestartet, sollten Sie **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife abfragen, nur um auf das Ende zu warten; prüfen Sie den Status nur bei Bedarf für Debugging-Sichtbarkeit.
    - Die Ausgabe des untergeordneten Agents ist ein Bericht/Nachweis, den der anfordernde Agent synthetisiert. Sie ist kein nutzerverfasster Anweisungstext und kann System-, Developer- oder User-Policy nicht überschreiben.
    - Beim Abschluss schließt OpenClaw nach bestem Aufwand nachverfolgte Browser-Tabs/Prozesse, die von dieser Sub-Agent-Sitzung geöffnet wurden, bevor der Ablauf zur Ankündigungsbereinigung fortgesetzt wird.

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw übergibt Abschlüsse über einen `agent`-Turn mit stabilem Idempotenzschlüssel zurück an die anfordernde Sitzung.
    - Wenn die anfordernde Ausführung noch aktiv ist, versucht OpenClaw zunächst, diese Ausführung zu wecken/zu steuern, statt einen zweiten sichtbaren Antwortpfad zu starten.
    - Wenn ein aktiver Anforderer nicht geweckt werden kann, fällt OpenClaw auf eine Übergabe an den anfordernden Agent mit demselben Abschlusskontext zurück, statt die Ankündigung zu verwerfen.
    - Eine erfolgreiche übergeordnete Übergabe schließt die Sub-Agent-Zustellung ab, auch wenn der übergeordnete Agent entscheidet, dass keine sichtbare Nutzeraktualisierung erforderlich ist.
    - Native Sub-Agents erhalten das Nachrichten-Tool nicht. Sie geben einfachen Assistententext an den übergeordneten/anfordernden Agent zurück; für Menschen sichtbare Antworten gehören zur normalen Zustellungsrichtlinie des übergeordneten/anfordernden Agents.
    - Wenn die direkte Übergabe nicht verwendet werden kann, wird auf Queue-Routing zurückgefallen.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Ankündigung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Anforderer-Route bei: Thread-gebundene oder unterhaltungsgebundene Abschlussrouten haben Vorrang, wenn sie verfügbar sind; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw fehlendes Ziel/Konto aus der aufgelösten Route der anfordernden Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), damit direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Die Abschlussübergabe an die anfordernde Sitzung ist zur Laufzeit erzeugter
    interner Kontext (kein nutzerverfasster Text) und umfasst:

    - `Result` — den neuesten sichtbaren `assistant`-Antworttext des untergeordneten Agents. Tool-/toolResult-Ausgaben werden nicht in Ergebnisse des untergeordneten Agents hochgestuft. Terminal fehlgeschlagene Ausführungen verwenden erfassten Antworttext nicht wieder.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Review-Anweisung, die den anfordernden Agent anweist, das Ergebnis zu überprüfen, bevor entschieden wird, ob die ursprüngliche Aufgabe erledigt ist.
    - Follow-up-Anleitung, die den anfordernden Agent anweist, die Aufgabe fortzusetzen oder ein Follow-up zu erfassen, wenn das Ergebnis des untergeordneten Agents weitere Aktionen offenlässt.
    - Eine Anweisung für die finale Aktualisierung für den Pfad ohne weitere Aktion, geschrieben in normaler Assistentenstimme ohne Weiterleitung roher interner Metadaten.

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` und `--thinking` überschreiben Standards für genau diese Ausführung.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - Verwenden Sie für persistente Thread-gebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Wenn der anfordernde Kanal keine Thread-Bindungen unterstützt, verwenden Sie `mode: "run"`, statt unmögliche Thread-gebundene Kombinationen erneut zu versuchen.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit ausweist. Siehe [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Nutzer nicht ausdrücklich ACP/acpx verlangt.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.list[]`-Eintrag mit `runtime.type="acp"`; verwenden Sie die Standard-Sub-Agent-Laufzeit für normale OpenClaw-Konfigurations-Agents aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agents starten isoliert, sofern der Aufrufer nicht ausdrücklich anfordert,
das aktuelle Transkript zu forken.

| Modus      | Wann er verwendet werden sollte                                                                                                       | Verhalten                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Frische Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext kurz beschrieben werden kann      | Erstellt ein sauberes Transkript des untergeordneten Agents. Dies ist der Standard und senkt den Token-Verbrauch. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder nuancierten Anweisungen abhängt, die bereits im Anforderer-Transkript vorhanden sind | Verzweigt das Anforderer-Transkript in die Sitzung des untergeordneten Agents, bevor dieser startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht, nicht als
Ersatz für das Schreiben eines klaren Aufgaben-Prompts.

## Tool: `sessions_spawn`

Startet eine Sub-Agent-Ausführung mit `deliver: false` auf der globalen `subagent`-Lane,
führt anschließend einen Ankündigungsschritt aus und postet die Ankündigungsantwort an den anfordernden
Chat-Kanal.

Die Verfügbarkeit hängt von der effektiven Tool-Policy des Aufrufers ab. Die Profile `coding` und
`full` stellen `sessions_spawn` standardmäßig bereit. Das Profil `messaging`
tut dies nicht; fügen Sie `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agents, die
Arbeit delegieren sollen. Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische Allow-/Deny-Policies können
das Tool nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standards:**

- **Modell:** Native Sub-Agents erben den Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen. ACP-Laufzeitstarts verwenden dasselbe konfigurierte Sub-Agent-Modell, wenn vorhanden; andernfalls behält das ACP-Harness seinen eigenen Standard bei. Ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Thinking:** Native Sub-Agents erben den Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen. ACP-Laufzeitstarts wenden außerdem `agents.defaults.models["provider/model"].params.thinking` für das ausgewählte Modell an. Ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Ausführungs-Timeout:** OpenClaw verwendet `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls fällt es auf `0` (kein Timeout) zurück. `sessions_spawn` akzeptiert keine Timeout-Überschreibungen pro Aufruf.
- **Aufgabenzustellung:** Native Sub-Agents erhalten die delegierte Aufgabe in ihrer ersten sichtbaren `[Subagent Task]`-Nachricht. Der System-Prompt des Sub-Agents trägt Laufzeitregeln und Routing-Kontext, kein verborgenes Duplikat der Aufgabe.

Akzeptierte native Sub-Agent-Starts enthalten die aufgelösten Modellmetadaten des untergeordneten Agents im
Tool-Ergebnis: `resolvedModel` enthält die angewendete Modellreferenz und
`resolvedProvider` enthält das Provider-Präfix, wenn die Referenz eines hat.

### Delegations-Prompt-Modus

`agents.defaults.subagents.delegationMode` steuert nur die Prompt-Anleitung; es ändert weder die Tool-Policy noch erzwingt es Delegation.

- `suggest` (Standard): behält den Standard-Prompt-Hinweis bei, Sub-Agents für größere oder langsamere Arbeit zu verwenden.
- `prefer`: weist den Haupt-Agent an, reaktionsfähig zu bleiben und alles, was über eine direkte Antwort hinausgeht, über `sessions_spawn` zu delegieren.

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
  Optionaler stabiler Handle zur Identifizierung eines bestimmten Childs in späteren Statusausgaben. Muss `[a-z][a-z0-9_-]{0,63}` entsprechen und darf kein reserviertes Ziel wie `last` oder `all` sein.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen konfigurierten Agent-ID starten, wenn dies durch `subagents.allowAgents` erlaubt ist.
</ParamField>
<ParamField path="cwd" type="string">
  Optionales Arbeitsverzeichnis der Aufgabe für den Child-Lauf. Native Sub-Agenten laden Bootstrap-Dateien weiterhin aus dem Ziel-Agent-Arbeitsbereich; `cwd` ändert nur, wo Laufzeit-Tools und CLI-Harnesses die delegierte Arbeit ausführen.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder explizit angefordertes Codex ACP/acpx) und für Einträge in `agents.list[]`, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Starts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die Parent-Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Starts weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Modell des Sub-Agenten. Ungültige Werte werden übersprungen, und der Sub-Agent läuft mit dem Standardmodell; im Tool-Ergebnis erscheint eine Warnung.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt die Denkstufe für den Sub-Agent-Lauf.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird für diese Sub-Agent-Sitzung eine Kanal-Thread-Bindung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` ist und `mode` ausgelassen wird, wird der Standard zu `session`. `mode: "session"` erfordert `thread: true`.
  Wenn Thread-Bindung für den anfragenden Kanal nicht verfügbar ist, verwenden Sie stattdessen `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert sofort nach der Ankündigung (behält das Transkript weiterhin per Umbenennung).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Start ab, sofern die Ziel-Child-Laufzeit nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anfragenden in die Child-Sitzung. Nur native Sub-Agenten. Thread-gebundene Starts verwenden standardmäßig `fork`; Starts ohne Thread verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Parameter für Kanalzustellung (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Native Sub-Agenten melden
ihren neuesten Assistant-Turn an den Anfragenden zurück; externe Zustellung bleibt beim
Parent-/Requester-Agent.
</Warning>

### Aufgabennamen und Zielauswahl

`taskName` ist ein modellseitiger Handle für Orchestrierung, kein Sitzungsschlüssel.
Verwenden Sie ihn für stabile Child-Namen wie `review_subagents`,
`linux_validation` oder `docs_update`, wenn ein Koordinator dieses Child
später prüfen können muss.

Die Zielauflösung akzeptiert exakte `taskName`-Übereinstimmungen und eindeutige
Präfixe. Der Abgleich ist auf dasselbe aktive/aktuelle Zielfenster beschränkt, das
von nummerierten `/subagents`-Zielen verwendet wird, sodass ein veraltetes abgeschlossenes Child
einen wiederverwendeten Handle nicht mehrdeutig macht. Wenn zwei aktive oder aktuelle Childs denselben
`taskName` teilen, ist das Ziel mehrdeutig; verwenden Sie stattdessen den Listenindex, den Sitzungsschlüssel oder
die Lauf-ID.

Die reservierten Ziele `last` und `all` sind keine gültigen `taskName`-Werte,
da sie bereits Steuerungsbedeutungen haben.

## Tool: `sessions_yield`

Beendet den aktuellen Modell-Turn und wartet darauf, dass Laufzeitereignisse, hauptsächlich
Sub-Agent-Abschlussereignisse, als nächste Nachricht eintreffen. Verwenden Sie es nach dem
Starten erforderlicher Child-Arbeit, wenn der Anfragende keine endgültige
Antwort erzeugen kann, bis diese Abschlüsse eingetroffen sind.

`sessions_yield` ist das Warteprimitiv. Ersetzen Sie es nicht durch Polling-
Schleifen über `subagents`, `sessions_list`, `sessions_history`, Shell-
`sleep` oder Prozess-Polling, nur um den Abschluss eines Childs zu erkennen.

Verwenden Sie `sessions_yield` nur, wenn die effektive Tool-Liste der Sitzung
es enthält. Einige minimale oder benutzerdefinierte Tool-Profile können `sessions_spawn` und
`subagents` bereitstellen, ohne `sessions_yield` bereitzustellen; erfinden Sie in diesem Fall
keine Polling-Schleife, nur um auf Abschluss zu warten.

Wenn aktive Childs vorhanden sind, fügt OpenClaw einen kompakten, laufzeitgenerierten
Prompt-Block `Active Subagents` in normale Turns ein, damit der Anfragende
die aktuellen Child-Sitzungen, Lauf-IDs, Status, Labels, Aufgaben und
`taskName`-Aliasse ohne Polling sehen kann. Die Aufgaben- und Label-Felder in diesem
Block werden als Daten zitiert, nicht als Anweisungen, da sie aus vom Benutzer/Modell
bereitgestellten Spawn-Argumenten stammen können.

## Tool: `subagents`

Listet gestartete Sub-Agent-Läufe auf, die der Requester-Sitzung gehören. Der Umfang ist
auf den aktuellen Requester beschränkt; ein Child kann nur seine eigenen kontrollierten Childs sehen.

Verwenden Sie `subagents` für Status bei Bedarf und Debugging. Verwenden Sie `sessions_yield`, um
auf Abschlussereignisse zu warten.

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an
einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiter an
dieselbe Sub-Agent-Sitzung geleitet werden.

### Thread-unterstützende Kanäle

Jeder Kanal mit einem Sitzungsbindungs-Adapter kann persistente
Thread-gebundene Subagent-Sitzungen unterstützen (`sessions_spawn` mit `thread: true`).
Gebündelte Adapter umfassen derzeit Discord-Threads, Matrix-Threads,
Telegram-Forum-Themen und Bindungen an die aktuelle Unterhaltung für Feishu.
Verwenden Sie die kanalbezogenen `threadBindings`-Konfigurationsschlüssel für Aktivierung,
Timeouts und `spawnSessions`.

### Schnellablauf

<Steps>
  <Step title="Starten">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt oder bindet einen Thread an dieses Sitzungsziel im aktiven Kanal.
  </Step>
  <Step title="Folgenachrichten weiterleiten">
    Antworten und Folgenachrichten in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Timeouts prüfen">
    Verwenden Sie `/session idle`, um den automatischen Inaktivitäts-Unfokus zu prüfen/aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerungen

| Befehl             | Wirkung                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread (oder erstellt einen) an ein Sub-Agent-/Sitzungsziel |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                 |
| `/agents`          | Listet aktive Läufe und Bindungsstatus (`thread:<id>` oder `unbound`) |
| `/session idle`    | Inaktiven Auto-Unfokus prüfen/aktualisieren (nur fokussierte gebundene Threads) |
| `/session max-age` | Harte Obergrenze prüfen/aktualisieren (nur fokussierte gebundene Threads) |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal-Override und Schlüssel für automatisches Binden beim Start** sind adapterspezifisch. Siehe [Thread-unterstützende Kanäle](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste konfigurierter Agent-IDs, die über explizites `agentId` als Ziel verwendet werden können (`["*"]` erlaubt jedes konfigurierte Ziel). Standard: nur der Requester-Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Requester sich selbst mit `agentId` startet, nehmen Sie die Requester-ID in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist konfigurierter Ziel-Agenten, die verwendet wird, wenn der Requester-Agent kein eigenes `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` auslassen (erzwingt explizite Profilauswahl). Override pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout pro Aufruf für Zustellversuche der Gateway-`agent`-Ankündigung. Werte sind positive ganzzahlige Millisekunden und werden auf das plattformsichere Timermaximum begrenzt. Transiente Wiederholungen können dazu führen, dass die gesamte Ankündigungswartezeit länger als ein konfiguriertes Timeout ist.
</ParamField>

Wenn die Requester-Sitzung sandboxed ist, lehnt `sessions_spawn` Ziele ab,
die unsandboxed laufen würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive
Modell jedes aufgeführten Agenten und eingebettete Laufzeit-Metadaten, damit Aufrufer OpenClaw, Codex
App-Server und andere konfigurierte native Laufzeiten unterscheiden können.

`allowAgents`-Einträge müssen auf konfigurierte Agent-IDs in `agents.list[]` zeigen.
`["*"]` bedeutet jeden konfigurierten Ziel-Agenten plus den Requester. Wenn eine Agent-Konfiguration
gelöscht wird, ihre ID aber in `allowAgents` verbleibt, lehnt `sessions_spawn` diese ID ab,
und `agents_list` lässt sie aus. Führen Sie `openclaw doctor --fix` aus, um veraltete
Allowlist-Einträge zu bereinigen, oder fügen Sie einen minimalen `agents.list[]`-Eintrag hinzu, wenn das Ziel
startbar bleiben soll, während es Standardwerte erbt.

### Automatische Archivierung

- Sub-Agent-Sitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` (Standard `60`) automatisch archiviert.
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (derselbe Ordner).
- `cleanup: "delete"` archiviert sofort nach der Ankündigung (behält das Transkript weiterhin per Umbenennung).
- Automatische Archivierung erfolgt nach bestem Aufwand; ausstehende Timer gehen verloren, wenn der Gateway neu startet.
- Konfigurierte Lauf-Timeouts archivieren **nicht** automatisch; sie stoppen nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Aufwand geschlossen, wenn der Lauf abgeschlossen ist, selbst wenn der Transkript-/Sitzungsdatensatz behalten wird.

## Verschachtelte Sub-Agenten

Standardmäßig können Sub-Agenten keine eigenen Sub-Agenten starten
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene
der Verschachtelung zu aktivieren — das **Orchestrator-Muster**: Main → Orchestrator-Sub-Agent →
Worker-Sub-Sub-Agenten.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // Sub-Agenten erlauben, Childs zu starten (Standard: 1)
        maxChildrenPerAgent: 5, // max. aktive Childs pro Agent-Sitzung (Standard: 5)
        maxConcurrent: 8, // globale Obergrenze für parallele Lanes (Standard: 8)
        runTimeoutSeconds: 900, // Standard-Timeout für sessions_spawn (0 = kein Timeout)
        announceTimeoutMs: 120000, // Gateway-Ankündigungs-Timeout pro Aufruf
      },
    },
  },
}
```

### Tiefenebenen

| Tiefe | Form des Sitzungsschlüssels                   | Rolle                                         | Kann starten?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                   | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                  | Nie                          |

### Ankündigungskette

Ergebnisse fließen die Kette zurück hinauf:

1. Depth-2-Worker beendet die Arbeit → kündigt dies seinem Parent (Depth-1-Orchestrator) an.
2. Depth-1-Orchestrator empfängt die Ankündigung, synthetisiert die Ergebnisse, beendet die Arbeit → kündigt dies an main an.
3. Main-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten Children.

<Note>
**Betriebliche Anleitung:** Starten Sie Child-Arbeit einmal und warten Sie auf Completion-
Events, statt Poll-Loops um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen.
`sessions_list` und `/subagents list` halten Child-Session-Beziehungen
auf Live-Arbeit fokussiert — Live-Children bleiben angehängt, beendete Children bleiben
für ein kurzes aktuelles Fenster sichtbar, und veraltete, nur im Store vorhandene Child-Links werden
nach ihrem Freshness-Fenster ignoriert. Das verhindert, dass alte `spawnedBy`- /
`parentSessionKey`-Metadaten nach einem Neustart Ghost-Children wiederbeleben.
Wenn ein Child-Completion-Event eintrifft, nachdem Sie bereits die
finale Antwort gesendet haben, ist das korrekte Follow-up das exakt stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Depth

- Rolle und Control Scope werden beim Spawn in Session-Metadaten geschrieben. Dadurch können flache oder wiederhergestellte Session Keys nicht versehentlich Orchestrator-Rechte zurückerlangen.
- **Depth 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er Children spawnen und ihren Status prüfen kann. Andere Session-/System-Tools bleiben verweigert.
- **Depth 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Session-Tools (aktuelles Standardverhalten).
- **Depth 2 (Leaf-Worker):** keine Session-Tools — `sessions_spawn` wird bei Depth 2 immer verweigert. Kann keine weiteren Children spawnen.

### Spawn-Limit pro Agent

Jede Agent-Session (bei beliebiger Depth) kann gleichzeitig höchstens `maxChildrenPerAgent`
(Standard `5`) aktive Children haben. Das verhindert unkontrolliertes Fan-out
durch einen einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Depth-1-Orchestrators stoppt automatisch alle seine Depth-2-
Children:

- `/stop` im Haupt-Chat stoppt alle Depth-1-Agents und kaskadiert zu ihren Depth-2-Children.

## Authentifizierung

Sub-Agent-Auth wird über die **Agent-ID** aufgelöst, nicht über den Session-Typ:

- Der Sub-Agent-Session-Key lautet `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agents geladen.
- Die Auth-Profile des Main-Agents werden als **Fallback** zusammengeführt; Agent-Profile überschreiben Main-Profile bei Konflikten.

Die Zusammenführung ist additiv, daher sind Main-Profile immer als
Fallbacks verfügbar. Vollständig isolierte Auth pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agents melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Session (nicht der Requester-Session).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistant-Text das exakt stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, auch wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Requester-Depth ab:

- Top-Level-Requester-Sessions verwenden einen Follow-up-`agent`-Call mit externer Zustellung (`deliver=true`).
- Verschachtelte Requester-Subagent-Sessions erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Child-Ergebnisse in der Session synthetisieren kann.
- Wenn eine verschachtelte Requester-Subagent-Session nicht mehr vorhanden ist, fällt OpenClaw auf den Requester dieser Session zurück, sofern verfügbar.

Für Top-Level-Requester-Sessions löst die direkte Zustellung im Completion-Modus zuerst
jede gebundene Conversation-/Thread-Route und Hook-Override auf und füllt dann
fehlende Channel-Target-Felder aus der gespeicherten Route der Requester-Session.
So bleiben Completions im richtigen Chat/Thema, selbst wenn der Completion-
Ursprung nur den Channel identifiziert.

Die Aggregation von Child-Completions ist beim Erstellen verschachtelter Completion-Findings
auf den aktuellen Requester-Run beschränkt, sodass veraltete Child-Ausgaben aus früheren Runs
nicht in die aktuelle Ankündigung gelangen. Ankündigungsantworten erhalten
Thread-/Themen-Routing, sofern es auf Channel-Adaptern verfügbar ist.

### Ankündigungskontext

Ankündigungskontext wird zu einem stabilen internen Event-Block normalisiert:

| Feld           | Quelle                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                            |
| Session-IDs    | Child-Session-Key/-ID                                                                                             |
| Typ            | Ankündigungstyp + Task-Label                                                                                      |
| Status         | Aus Runtime-Outcome abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistant-Text vom Child                                                                       |
| Follow-up      | Anweisung, die beschreibt, wann zu antworten ist und wann still geblieben werden soll                              |

Terminal fehlgeschlagene Runs melden Fehlerstatus, ohne erfassten
Antworttext erneut abzuspielen. Tool-/toolResult-Ausgabe wird nicht zu Child-Ergebnistext hochgestuft.

### Stats-Zeile

Ankündigungs-Payloads enthalten am Ende eine Stats-Zeile (auch bei Umbruch):

- Runtime (z. B. `runtime 5m12s`).
- Token-Nutzung (Input/Output/Total).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transcript-Pfad, damit der Main-Agent den Verlauf über `sessions_history` abrufen oder die Datei auf der Festplatte prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten
sollten in normaler Assistant-Stimme neu formuliert werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungsweg:

- Assistant-Recall wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`- / `<relevant_memories>`-Scaffolding entfernt; Plain-Text-Tool-Call-XML-Payload-Blöcke (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; herabgestuftes Tool-Call-/Result-Scaffolding und Historical-Context-Marker entfernt; geleakte Model-Control-Tokens (`<|assistant|>`, andere ASCII-`<|...|>`, Full-Width-`<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Credential-/Token-ähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Verläufe können ältere Zeilen entfernen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Die Prüfung des rohen On-Disk-Transcripts ist der Fallback, wenn Sie das vollständige bytegenaue Transcript benötigen.

## Tool-Richtlinie

Sub-Agents verwenden zuerst dieselbe Profile- und Tool-Policy-Pipeline wie der Parent oder
Target-Agent. Danach wendet OpenClaw die Sub-Agent-Restriction-
Ebene an.

Ohne restriktives `tools.profile` erhalten Sub-Agents **alle Tools außer dem
Message-Tool, Session-Tools und System-Tools**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht — es
ist kein roher Transcript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Depth-1-Orchestrator-Sub-Agents zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre Children verwalten können.

### Override per Config

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

`tools.subagents.tools.allow` ist ein finaler allow-only-Filter. Er kann
das bereits aufgelöste Tool-Set einschränken, aber kein Tool **wieder hinzufügen**,
das durch `tools.profile` entfernt wurde. Beispiel: `tools.profile: "coding"` enthält
`web_search`/`web_fetch`, aber nicht das `browser`-Tool. Damit
Sub-Agents mit Coding-Profile Browser-Automatisierung verwenden können, fügen Sie browser in der
Profile-Phase hinzu:

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

Sub-Agents verwenden eine dedizierte In-Process-Queue-Lane:

- **Lane-Name:** `subagent`
- **Nebenläufigkeit:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein
Sub-Agent noch lebt. Nicht beendete Runs, die älter als das Stale-Run-Fenster sind,
zählen in `/subagents list`, Statuszusammenfassungen,
Descendant-Completion-Gating und Per-Session-Concurrency-Prüfungen nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Runs bereinigt, es sei denn,
ihre Child-Session ist als `abortedLastRun: true` markiert. Diese
restart-aborted Child-Sessions bleiben über den Sub-Agent-
Orphan-Recovery-Flow wiederherstellbar, der vor dem
Löschen des Aborted-Markers eine synthetische Resume-Nachricht sendet.

Die automatische Restart-Recovery ist pro Child-Session begrenzt. Wenn dasselbe
Sub-Agent-Child innerhalb des schnellen Re-Wedge-Fensters wiederholt für Orphan-Recovery
akzeptiert wird, persistiert OpenClaw einen Recovery-Tombstone auf dieser
Session und stoppt das automatische Resume bei späteren Neustarts. Führen Sie
`openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder
`openclaw doctor --fix`, um veraltete Aborted-Recovery-Flags auf
tombstoned Sessions zu löschen.

<Note>
Wenn ein Sub-Agent-Spawn mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Caller, bevor Sie den Pairing-State bearbeiten.
Interne `sessions_spawn`-Koordination wird im Prozess dispatcht, wenn der
Caller bereits innerhalb des Gateway-Request-Kontexts läuft; sie öffnet also
keinen Loopback-WebSocket und hängt nicht von der Paired-Device-Scope-
Baseline der CLI ab. Caller außerhalb des Gateway-Prozesses verwenden weiterhin den WebSocket-
Fallback als `client.id: "gateway-client"` mit `client.mode: "backend"`
über direkte Loopback-Shared-Token-/Passwort-Auth. Remote-Caller, explizite
`deviceIdentity`, explizite Device-Token-Pfade und Browser-/Node-Clients
benötigen weiterhin normale Device-Genehmigung für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im Requester-Chat bricht die Requester-Session ab und stoppt alle aktiven Sub-Agent-Runs, die von ihr gespawnt wurden, einschließlich kaskadierender Stopps für verschachtelte Children.

## Einschränkungen

- Sub-Agent-Ankündigung ist **Best-Effort**. Wenn der Gateway neu startet, geht ausstehende „announce back“-Arbeit verloren.
- Sub-Agents teilen weiterhin dieselben Gateway-Prozessressourcen; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Sub-Agent-Kontext injiziert nur `AGENTS.md` und `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`). Codex-native Subagents folgen derselben Grenze: `TOOLS.md` bleibt in geerbten Codex-Thread-Instructions, während Parent-only Persona-, Identity- und User-Dateien als turn-scoped Collaboration Instructions injiziert werden, sodass Children sie nicht klonen.
- Maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth`-Bereich: 1–5). Depth 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Children pro Session (Standard `5`, Bereich `1–20`).

## Verwandt

- [ACP-Agents](/de/tools/acp-agents)
- [Agent Send](/de/tools/agent-send)
- [Background-Tasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
