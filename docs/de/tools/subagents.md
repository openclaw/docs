---
read_when:
    - Sie möchten Hintergrund- oder Parallelarbeit über den Agenten durchführen
    - Sie ändern `sessions_spawn` oder die Richtlinie für Sub-Agent-Tools
    - Sie implementieren oder beheben Probleme bei threadgebundenen Subagenten-Sitzungen
sidebarTitle: Sub-agents
summary: Starten Sie isolierte Agentenläufe im Hintergrund, die Ergebnisse an den anfragenden Chat zurückmelden
title: Unteragenten
x-i18n:
    generated_at: "2026-06-28T00:13:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Unteragenten sind Hintergrund-Agentenläufe, die aus einem bestehenden Agentenlauf gestartet werden.
Sie laufen in ihrer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**melden** nach Abschluss ihr Ergebnis zurück an den anfordernden Chat-
Kanal. Jeder Unteragentenlauf wird als
[Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Hauptziele:

- Arbeit für „Recherche / lange Aufgabe / langsames Tool“ parallelisieren, ohne den Hauptlauf zu blockieren.
- Unteragenten standardmäßig isoliert halten (Sitzungstrennung + optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Unteragenten erhalten standardmäßig **keine** Sitzungstools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Unteragent hat standardmäßig seinen eigenen Kontext und Tokenverbrauch.
Für aufwendige oder wiederkehrende Aufgaben legen Sie für Unteragenten ein günstigeres Modell fest
und behalten Sie für Ihren Hauptagenten ein hochwertigeres Modell bei. Konfigurieren Sie dies über
`agents.defaults.subagents.model` oder mit agentenspezifischen Overrides. Wenn ein untergeordneter Agent
    wirklich das aktuelle Transkript des Anforderers benötigt, kann der Agent
    `context: "fork"` für genau diesen Start anfordern. Thread-gebundene Unteragentensitzungen verwenden standardmäßig
    `context: "fork"`, weil sie die aktuelle Unterhaltung in einen
    Folge-Thread verzweigen.
</Note>

## Slash-Befehl

Verwenden Sie `/subagents`, um Unteragentenläufe für die **aktuelle Sitzung** zu prüfen:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` zeigt Laufmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). Verwenden Sie `sessions_history` für eine begrenzte,
sicherheitsgefilterte Recall-Ansicht; prüfen Sie den Transkriptpfad auf dem Datenträger, wenn Sie
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

### Startverhalten

Agenten starten Hintergrund-Unteragenten mit `sessions_spawn`. Abschlüsse von Unteragenten
kehren als interne Ereignisse der übergeordneten Sitzung zurück; der übergeordnete/anfordernde Agent entscheidet,
ob eine benutzer sichtbare Aktualisierung erforderlich ist.

<AccordionGroup>
  <Accordion title="Nicht blockierender, Push-basierter Abschluss">
    - `sessions_spawn` ist nicht blockierend; es gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss meldet sich der Unteragent an die übergeordnete/anfordernde Sitzung zurück.
    - Agentendurchläufe, die Ergebnisse von untergeordneten Agenten benötigen, sollten nach dem Starten der erforderlichen Arbeit `sessions_yield` aufrufen. Dadurch wird der aktuelle Durchlauf beendet und Abschlussereignisse können als nächste für das Modell sichtbare Nachricht eintreffen.
    - Der Abschluss ist Push-basiert. Nach dem Starten dürfen Sie `/subagents list`, `sessions_list` oder `sessions_history` nicht in einer Schleife abfragen, nur um auf das Ende zu warten; prüfen Sie den Status nur bei Bedarf für Debugging-Transparenz.
    - Die Ausgabe des untergeordneten Agenten ist ein Bericht/Nachweis, den der anfordernde Agent synthetisiert. Sie ist kein vom Benutzer verfasster Anweisungstext und kann System-, Entwickler- oder Benutzerrichtlinien nicht außer Kraft setzen.
    - Nach Abschluss schließt OpenClaw nach bestem Aufwand verfolgte Browser-Tabs/Prozesse, die von dieser Unteragentensitzung geöffnet wurden, bevor der Bereinigungsablauf der Meldung fortgesetzt wird.

  </Accordion>
  <Accordion title="Abschlusszustellung">
    - OpenClaw übergibt Abschlüsse über einen `agent`-Durchlauf mit stabilem Idempotenzschlüssel zurück an die anfordernde Sitzung.
    - Wenn der anfordernde Lauf noch aktiv ist, versucht OpenClaw zuerst, diesen Lauf zu wecken/zu steuern, statt einen zweiten sichtbaren Antwortpfad zu starten.
    - Wenn ein aktiver Anforderer nicht geweckt werden kann, fällt OpenClaw auf eine Übergabe an den anfordernden Agenten mit demselben Abschlusskontext zurück, statt die Meldung zu verwerfen.
    - Eine erfolgreiche übergeordnete Übergabe schließt die Unteragentenzustellung ab, selbst wenn der übergeordnete Agent entscheidet, dass keine sichtbare Benutzeraktualisierung erforderlich ist.
    - Native Unteragenten erhalten das Nachrichten-Tool nicht. Sie geben reinen Assistant-Text an den übergeordneten/anfordernden Agenten zurück; für Menschen sichtbare Antworten unterliegen der normalen Zustellungsrichtlinie des übergeordneten/anfordernden Agenten.
    - Wenn die direkte Übergabe nicht verwendet werden kann, fällt sie auf Queue-Routing zurück.
    - Wenn Queue-Routing weiterhin nicht verfügbar ist, wird die Meldung mit kurzem exponentiellem Backoff erneut versucht, bevor endgültig aufgegeben wird.
    - Die Abschlusszustellung behält die aufgelöste Anforderer-Route bei: Thread-gebundene oder unterhaltungsgebundene Abschlussrouten haben Vorrang, wenn verfügbar; wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der anfordernden Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), sodass direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Abschlussübergabe">
    Die Abschlussübergabe an die anfordernde Sitzung ist laufzeitgenerierter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — den neuesten sichtbaren `assistant`-Antworttext des untergeordneten Agenten. Tool-/toolResult-Ausgaben werden nicht in Ergebnisse des untergeordneten Agenten übernommen. Terminal fehlgeschlagene Läufe verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Review-Anweisung, die den anfordernden Agenten auffordert, das Ergebnis zu verifizieren, bevor entschieden wird, ob die ursprüngliche Aufgabe erledigt ist.
    - Folgehinweise, die den anfordernden Agenten auffordern, die Aufgabe fortzusetzen oder eine Folgeaufgabe zu erfassen, wenn das Ergebnis des untergeordneten Agenten weiteren Handlungsbedarf lässt.
    - Eine Anweisung für die finale Aktualisierung für den Pfad ohne weiteren Handlungsbedarf, in normaler Assistant-Stimme geschrieben, ohne rohe interne Metadaten weiterzuleiten.

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben die Standardwerte für diesen spezifischen Lauf.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach Abschluss zu prüfen.
    - Verwenden Sie für persistente Thread-gebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Wenn der anfordernde Kanal Thread-Bindungen nicht unterstützt, verwenden Sie `mode: "run"`, statt unmögliche Thread-gebundene Kombinationen erneut zu versuchen.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit ankündigt. Siehe [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model), wenn Sie Abschlüsse oder Agent-zu-Agent-Schleifen debuggen. Wenn das `codex`-Plugin aktiviert ist, sollte Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, es sei denn, der Benutzer fragt ausdrücklich nach ACP/acpx.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht sandboxed ist und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen Eintrag in `agents.list[]` mit `runtime.type="acp"`; verwenden Sie die Standard-Unteragentenlaufzeit für normale OpenClaw-Konfigurationsagenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Unteragenten starten isoliert, sofern der Aufrufer nicht ausdrücklich anfordert, das aktuelle Transkript zu forken.

| Modus      | Wann Sie ihn verwenden sollten                                                                                                      | Verhalten                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `isolated` | Neue Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext knapp gebrieft werden kann        | Erstellt ein sauberes untergeordnetes Transkript. Dies ist der Standard und hält den Tokenverbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, früheren Tool-Ergebnissen oder bereits im Transkript des Anforderers vorhandenen nuancierten Anweisungen abhängt | Verzweigt das Transkript des Anforderers in die untergeordnete Sitzung, bevor der untergeordnete Agent startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht, nicht als
Ersatz für das Schreiben eines klaren Aufgabenprompts.

## Tool: `sessions_spawn`

Startet einen Unteragentenlauf mit `deliver: false` auf der globalen `subagent`-Lane,
führt dann einen Meldeschritt aus und postet die Meldungsantwort in den anfordernden
Chat-Kanal.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab. Die Profile `coding` und
`full` stellen `sessions_spawn` standardmäßig bereit. Das Profil `messaging`
tut dies nicht; fügen Sie `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für Agenten, die Arbeit delegieren sollen.
Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische Allow-/Deny-Richtlinien können
das Tool nach der Profilphase dennoch entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** Native Unteragenten erben den Aufrufer, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen. Starts der ACP-Laufzeit verwenden dasselbe konfigurierte Unteragentenmodell, wenn vorhanden; andernfalls behält das ACP-Harness seinen eigenen Standard. Ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Thinking:** Native Unteragenten erben den Aufrufer, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen. Starts der ACP-Laufzeit wenden außerdem `agents.defaults.models["provider/model"].params.thinking` für das ausgewählte Modell an. Ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Lauf-Timeout:** OpenClaw verwendet `agents.defaults.subagents.runTimeoutSeconds`, wenn gesetzt; andernfalls fällt es auf `0` zurück (kein Timeout). `sessions_spawn` akzeptiert keine Timeout-Overrides pro Aufruf.
- **Aufgabenzustellung:** Native Unteragenten erhalten die delegierte Aufgabe in ihrer ersten sichtbaren `[Subagent Task]`-Nachricht. Der Systemprompt des Unteragenten trägt Laufzeitregeln und Routing-Kontext, kein verstecktes Duplikat der Aufgabe.

Akzeptierte native Unteragentenstarts enthalten die aufgelösten Metadaten des untergeordneten Modells im
Tool-Ergebnis: `resolvedModel` enthält die angewendete Modellreferenz und
`resolvedProvider` enthält das Provider-Präfix, wenn die Referenz eines hat.

### Delegations-Prompt-Modus

`agents.defaults.subagents.delegationMode` steuert nur die Prompt-Hinweise; es ändert keine Tool-Richtlinie und erzwingt keine Delegation.

- `suggest` (Standard): den standardmäßigen Prompt-Hinweis beibehalten, Unteragenten für größere oder langsamere Arbeit zu verwenden.
- `prefer`: den Hauptagenten anweisen, reaktionsfähig zu bleiben und alles, was aufwendiger als eine direkte Antwort ist, über `sessions_spawn` zu delegieren.

Agentenspezifische Overrides verwenden `agents.list[].subagents.delegationMode`.

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
  Optionaler stabiler Bezeichner zur Identifizierung eines bestimmten Child in späteren Statusausgaben. Muss `[a-z][a-z0-9_-]{0,63}` entsprechen und darf keine reservierten Ziele wie `last` oder `all` verwenden.
</ParamField>
<ParamField path="label" type="string">
  Optionales menschenlesbares Label.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen konfigurierten Agent-ID starten, wenn dies durch `subagents.allowAgents` erlaubt ist.
</ParamField>
<ParamField path="cwd" type="string">
  Optionales Arbeitsverzeichnis der Aufgabe für den Child-Lauf. Native Sub-Agents laden Bootstrap-Dateien weiterhin aus dem Workspace des Ziel-Agenten; `cwd` ändert nur, wo Runtime-Tools und CLI-Harnesses die delegierte Arbeit ausführen.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) und für `agents.list[]`-Einträge vorgesehen, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agent-Starts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die übergeordnete Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agent-Starts weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Modell des Sub-Agent. Ungültige Werte werden übersprungen, und der Sub-Agent läuft mit einer Warnung im Tool-Ergebnis auf dem Standardmodell.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt das Thinking-Level für den Sub-Agent-Lauf.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird Thread-Bindung für diese Sub-Agent-Sitzung im Channel angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` ist und `mode` weggelassen wird, wird der Standardwert `session`. `mode: "session"` erfordert `thread: true`.
  Wenn Thread-Bindung für den anfordernden Channel nicht verfügbar ist, verwenden Sie stattdessen `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert unmittelbar nach der Ankündigung (behält das Transkript weiterhin durch Umbenennen bei).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weist den Start zurück, wenn die Ziel-Child-Runtime nicht sandboxed ist.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Requesters in die Child-Sitzung. Nur native Sub-Agents. Thread-gebundene Starts verwenden standardmäßig `fork`; nicht Thread-gebundene Starts verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Channel-Zustellungsparameter (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Native Sub-Agents melden
ihren neuesten Assistenten-Turn an den Requester zurück; externe Zustellung verbleibt beim
übergeordneten/Requester-Agent.
</Warning>

### Aufgabennamen und Targeting

`taskName` ist ein modellseitiger Bezeichner für Orchestrierung, kein Sitzungsschlüssel.
Verwenden Sie ihn für stabile Child-Namen wie `review_subagents`,
`linux_validation` oder `docs_update`, wenn ein Koordinator diesen
Child später inspizieren muss.

Die Zielauflösung akzeptiert exakte `taskName`-Übereinstimmungen und eindeutige
Präfixe. Das Matching ist auf dasselbe aktive/kürzliche Zielfenster beschränkt,
das von nummerierten `/subagents`-Zielen verwendet wird, sodass ein veralteter abgeschlossener Child
einen wiederverwendeten Bezeichner nicht mehrdeutig macht. Wenn zwei aktive oder kürzliche Children denselben
`taskName` teilen, ist das Ziel mehrdeutig; verwenden Sie stattdessen den Listenindex, Sitzungsschlüssel oder
die Lauf-ID.

Die reservierten Ziele `last` und `all` sind keine gültigen `taskName`-Werte,
weil sie bereits Steuerungsbedeutungen haben.

## Tool: `sessions_yield`

Beendet den aktuellen Modell-Turn und wartet darauf, dass Runtime-Ereignisse, primär
Abschlussereignisse von Sub-Agents, als nächste Nachricht eintreffen. Verwenden Sie es nach dem
Starten erforderlicher Child-Arbeit, wenn der Requester keine finale
Antwort erzeugen kann, bis diese Abschlüsse eintreffen.

`sessions_yield` ist das Warte-Primitiv. Ersetzen Sie es nicht durch Polling-
Schleifen über `subagents`, `sessions_list`, `sessions_history`, Shell-
`sleep` oder Prozess-Polling, nur um den Abschluss von Children zu erkennen.

Verwenden Sie `sessions_yield` nur, wenn die effektive Tool-Liste der Sitzung
es enthält. Einige minimale oder benutzerdefinierte Tool-Profile können `sessions_spawn` und
`subagents` bereitstellen, ohne `sessions_yield` bereitzustellen; erfinden Sie in diesem Fall
keine Polling-Schleife, nur um auf Abschluss zu warten.

Wenn aktive Children existieren, injiziert OpenClaw einen kompakten, Runtime-generierten
`Active Subagents`-Promptblock in normale Turns, sodass der Requester
die aktuellen Child-Sitzungen, Lauf-IDs, Status, Labels, Aufgaben und
`taskName`-Aliasse ohne Polling sehen kann. Die Aufgaben- und Labelfelder in diesem
Block werden als Daten zitiert, nicht als Anweisungen, weil sie aus
benutzer-/modellbereitgestellten Startargumenten stammen können.

## Tool: `subagents`

Listet gestartete Sub-Agent-Läufe auf, die der Requester-Sitzung gehören. Es ist auf
den aktuellen Requester beschränkt; ein Child kann nur seine eigenen kontrollierten Children sehen.

Verwenden Sie `subagents` für Status auf Abruf und Debugging. Verwenden Sie `sessions_yield`, um
auf Abschlussereignisse zu warten.

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Channel aktiviert sind, kann ein Sub-Agent an einen
Thread gebunden bleiben, sodass Follow-up-Benutzernachrichten in diesem Thread weiterhin an dieselbe
Sub-Agent-Sitzung geleitet werden.

### Channels mit Thread-Unterstützung

Jeder Channel mit einem Sitzungsbindungsadapter kann persistente
Thread-gebundene Subagent-Sitzungen unterstützen (`sessions_spawn` mit `thread: true`).
Gebündelte Adapter umfassen derzeit Discord-Threads, Matrix-Threads,
Telegram-Forumsthemen und Aktuelle-Unterhaltung-Bindungen für Feishu.
Verwenden Sie die channel-spezifischen `threadBindings`-Konfigurationsschlüssel für Aktivierung,
Timeouts und `spawnSessions`.

### Schnellablauf

<Steps>
  <Step title="Starten">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt oder bindet einen Thread an dieses Sitzungsziel im aktiven Channel.
  </Step>
  <Step title="Follow-ups routen">
    Antworten und Follow-up-Nachrichten in diesem Thread werden an die gebundene Sitzung geleitet.
  </Step>
  <Step title="Timeouts inspizieren">
    Verwenden Sie `/session idle`, um den automatischen Inaktivitäts-Unfocus zu inspizieren/aktualisieren, und
    `/session max-age`, um die harte Obergrenze zu steuern.
  </Step>
  <Step title="Lösen">
    Verwenden Sie `/unfocus`, um die Bindung manuell zu lösen.
  </Step>
</Steps>

### Manuelle Steuerungen

| Befehl             | Wirkung                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Aktuellen Thread (oder einen neuen) an ein Sub-Agent-/Sitzungsziel binden |
| `/unfocus`         | Bindung für den aktuell gebundenen Thread entfernen                   |
| `/agents`          | Aktive Läufe und Bindungsstatus auflisten (`thread:<id>` oder `unbound`) |
| `/session idle`    | Automatischen Idle-Unfocus inspizieren/aktualisieren (nur fokussierte gebundene Threads) |
| `/session max-age` | Harte Obergrenze inspizieren/aktualisieren (nur fokussierte gebundene Threads) |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Channel-Override und Schlüssel für automatisches Binden beim Start** sind adapterspezifisch. Siehe [Channels mit Thread-Unterstützung](#thread-supporting-channels) oben.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference) und
[Slash-Befehle](/de/tools/slash-commands) für aktuelle Adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste konfigurierter Agent-IDs, die über explizites `agentId` als Ziel verwendet werden können (`["*"]` erlaubt jedes konfigurierte Ziel). Standard: nur der Requester-Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Requester sich selbst mit `agentId` startet, nehmen Sie die Requester-ID in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standard-Allowlist konfigurierter Ziel-Agenten, die verwendet wird, wenn der Requester-Agent kein eigenes `subagents.allowAgents` setzt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` weglassen (erzwingt explizite Profilauswahl). Override pro Agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout pro Aufruf für Gateway-Zustellversuche der `agent`-Ankündigung. Werte sind positive ganzzahlige Millisekunden und werden auf das plattformsichere Timermaximum begrenzt. Vorübergehende Wiederholungen können dazu führen, dass die gesamte Wartezeit auf die Ankündigung länger als ein konfiguriertes Timeout ist.
</ParamField>

Wenn die Requester-Sitzung sandboxed ist, weist `sessions_spawn` Ziele zurück,
die unsandboxed laufen würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agent-IDs derzeit für
`sessions_spawn` erlaubt sind. Die Antwort enthält das effektive
Modell jedes aufgelisteten Agenten und eingebettete Runtime-Metadaten, sodass Aufrufer OpenClaw, den Codex
App-Server und andere konfigurierte native Runtimes unterscheiden können.

`allowAgents`-Einträge müssen auf konfigurierte Agent-IDs in `agents.list[]` zeigen.
`["*"]` bedeutet jeden konfigurierten Ziel-Agenten plus den Requester. Wenn eine Agent-Konfiguration
gelöscht wird, ihre ID aber in `allowAgents` verbleibt, weist `sessions_spawn` diese ID zurück
und `agents_list` lässt sie aus. Führen Sie `openclaw doctor --fix` aus, um veraltete
Allowlist-Einträge zu bereinigen, oder fügen Sie einen minimalen `agents.list[]`-Eintrag hinzu, wenn das Ziel
weiterhin startbar bleiben soll, während es Standards erbt.

### Automatisches Archivieren

- Sub-Agent-Sitzungen werden automatisch nach `agents.defaults.subagents.archiveAfterMinutes` archiviert (Standard `60`).
- Das Archivieren verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (gleicher Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (behält das Transkript weiterhin durch Umbenennen bei).
- Automatisches Archivieren erfolgt nach bestem Bemühen; ausstehende Timer gehen verloren, wenn der Gateway neu startet.
- Konfigurierte Laufzeit-Timeouts archivieren **nicht** automatisch; sie stoppen nur den Lauf. Die Sitzung bleibt bis zum automatischen Archivieren bestehen.
- Automatisches Archivieren gilt gleichermaßen für Sitzungen der Tiefe 1 und Tiefe 2.
- Browser-Bereinigung ist von Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Bemühen geschlossen, wenn der Lauf endet, auch wenn das Transkript/der Sitzungsdatensatz beibehalten wird.

## Verschachtelte Sub-Agents

Standardmäßig können Sub-Agents keine eigenen Sub-Agents starten
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Ebene der
Verschachtelung zu aktivieren — das **Orchestrator-Muster**: main → Orchestrator-Sub-Agent →
Worker-Sub-Sub-Agents.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Tiefenstufen

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                         | Kann starten?                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Haupt-Agent                                   | Immer                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-Agent (Orchestrator, wenn Tiefe 2 erlaubt ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-Sub-Agent (Leaf-Worker)                   | Nie                          |

### Ankündigungskette

Ergebnisse fließen in der Kette zurück nach oben:

1. Worker der Tiefe 2 beendet seine Arbeit → kündigt dies seinem Parent (Orchestrator der Tiefe 1) an.
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, synthetisiert Ergebnisse, beendet seine Arbeit → kündigt dies Main an.
3. Main-Agent empfängt die Ankündigung und liefert sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten Children.

<Note>
**Operative Anleitung:** Starten Sie Child-Arbeit einmalig und warten Sie auf Abschlussereignisse, statt Polling-Schleifen um `sessions_list`, `sessions_history`, `/subagents list` oder `exec`-Sleep-Befehle zu bauen. `sessions_list` und `/subagents list` halten Child-Session-Beziehungen auf Live-Arbeit fokussiert — Live-Children bleiben angehängt, beendete Children bleiben für ein kurzes aktuelles Zeitfenster sichtbar, und veraltete, nur im Store vorhandene Child-Links werden nach ihrem Freshness-Fenster ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`- / `parentSessionKey`-Metadaten nach einem Neustart Phantom-Children wiederbeleben. Wenn ein Child-Abschlussereignis eintrifft, nachdem Sie bereits die finale Antwort gesendet haben, ist die korrekte Folgeaktion das exakte stille Token `NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Kontrollumfang werden beim Spawn-Zeitpunkt in die Session-Metadaten geschrieben. Dadurch können flache oder wiederhergestellte Session-Schlüssel nicht versehentlich Orchestrator-Privilegien zurückerlangen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er Children spawnen und ihren Status prüfen kann. Andere Session-/System-Tools bleiben verweigert.
- **Tiefe 1 (Leaf, wenn `maxSpawnDepth == 1`):** keine Session-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Leaf-Worker):** keine Session-Tools — `sessions_spawn` wird in Tiefe 2 immer verweigert. Kann keine weiteren Children spawnen.

### Spawn-Limit pro Agent

Jede Agent-Session (in jeder Tiefe) kann gleichzeitig höchstens `maxChildrenPerAgent` (Standard `5`) aktive Children haben. Das verhindert unkontrolliertes Fan-out durch einen einzelnen Orchestrator.

### Kaskadierender Stopp

Das Stoppen eines Orchestrators der Tiefe 1 stoppt automatisch alle seine Children der Tiefe 2:

- `/stop` im Main-Chat stoppt alle Agenten der Tiefe 1 und kaskadiert zu deren Children der Tiefe 2.

## Authentifizierung

Sub-Agent-Auth wird über **Agent-ID** aufgelöst, nicht über den Session-Typ:

- Der Sub-Agent-Session-Schlüssel ist `agent:<agentId>:subagent:<uuid>`.
- Der Auth-Store wird aus dem `agentDir` dieses Agenten geladen.
- Die Auth-Profile des Main-Agenten werden als **Fallback** eingebunden; Agent-Profile überschreiben Main-Profile bei Konflikten.

Der Merge ist additiv, daher sind Main-Profile immer als Fallbacks verfügbar. Vollständig isolierte Auth pro Agent wird noch nicht unterstützt.

## Ankündigung

Sub-Agenten melden über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt läuft innerhalb der Sub-Agent-Session (nicht in der Requester-Session).
- Wenn der Sub-Agent exakt `ANNOUNCE_SKIP` antwortet, wird nichts gepostet.
- Wenn der neueste Assistant-Text das exakte stille Token `NO_REPLY` / `no_reply` ist, wird die Ankündigungsausgabe unterdrückt, auch wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Requester-Tiefe ab:

- Top-Level-Requester-Sessions verwenden einen Follow-up-`agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Requester-Subagent-Sessions erhalten eine interne Follow-up-Injektion (`deliver=false`), damit der Orchestrator Child-Ergebnisse innerhalb der Session synthetisieren kann.
- Wenn eine verschachtelte Requester-Subagent-Session nicht mehr vorhanden ist, fällt OpenClaw, sofern verfügbar, auf den Requester dieser Session zurück.

Für Top-Level-Requester-Sessions löst die direkte Zustellung im Completion-Modus zuerst jede gebundene Conversation-/Thread-Route und jeden Hook-Override auf und füllt dann fehlende Channel-Target-Felder aus der gespeicherten Route der Requester-Session. Dadurch bleiben Completions im richtigen Chat/Thema, auch wenn der Completion-Ursprung nur den Channel identifiziert.

Die Child-Completion-Aggregation ist beim Erstellen verschachtelter Completion-Findings auf den aktuellen Requester-Run beschränkt, sodass veraltete Child-Ausgaben aus früheren Runs nicht in die aktuelle Ankündigung gelangen. Ankündigungsantworten erhalten Thread-/Themen-Routing, wenn es auf Channel-Adaptern verfügbar ist.

### Ankündigungskontext

Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Quelle         | `subagent` oder `cron`                                                                                             |
| Session-IDs    | Child-Session-Schlüssel/-ID                                                                                        |
| Typ            | Ankündigungstyp + Task-Label                                                                                       |
| Status         | Aus Runtime-Ergebnis abgeleitet (`success`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext gefolgert |
| Ergebnisinhalt | Neuester sichtbarer Assistant-Text des Child                                                                        |
| Follow-up      | Anweisung, die beschreibt, wann geantwortet und wann still geblieben werden soll                                    |

Terminal fehlgeschlagene Runs melden Fehlerstatus, ohne erfassten Antworttext erneut abzuspielen. Tool-/toolResult-Ausgabe wird nicht zu Child-Ergebnistext hochgestuft.

### Statistikzeile

Ankündigungs-Payloads enthalten am Ende eine Statistikzeile (auch wenn umbrochen):

- Runtime (z. B. `runtime 5m12s`).
- Token-Nutzung (Input/Output/Gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Main-Agent den Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann.

Interne Metadaten sind nur für Orchestrierung gedacht; benutzerseitige Antworten sollten in normaler Assistant-Stimme neu formuliert werden.

### Warum `sessions_history` bevorzugen

`sessions_history` ist der sicherere Orchestrierungspfad:

- Assistant-Recall wird zuerst normalisiert: Thinking-Tags entfernt; `<relevant-memories>`- / `<relevant_memories>`-Scaffolding entfernt; Plain-Text-Tool-Call-XML-Payload-Blöcke (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) entfernt, einschließlich abgeschnittener Payloads, die nie sauber schließen; herabgestuftes Tool-Call-/Result-Scaffolding und Historical-Context-Marker entfernt; geleakte Modell-Steuerungstokens (`<|assistant|>`, andere ASCII-`<|...|>`, Full-Width-`<｜...｜>`) entfernt; fehlerhaftes MiniMax-Tool-Call-XML entfernt.
- Zugangsdaten-/Token-ähnlicher Text wird redigiert.
- Lange Blöcke können gekürzt werden.
- Sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzen.
- Verwenden Sie `nextOffset`, wenn vorhanden, um rückwärts durch ältere Transkriptfenster zu blättern.
- Die rohe Prüfung des Transkripts auf dem Datenträger ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Sub-Agenten verwenden zuerst dieselbe Profil- und Tool-Richtlinien-Pipeline wie der Parent- oder Ziel-Agent. Danach wendet OpenClaw die Sub-Agent-Einschränkungsschicht an.

Ohne restriktives `tools.profile` erhalten Sub-Agenten **alle Tools außer dem Message-Tool, Session-Tools und System-Tools**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Recall-Ansicht — kein roher Transkript-Dump.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agenten der Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre Children verwalten können.

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

`tools.subagents.tools.allow` ist ein finaler Allow-only-Filter. Er kann das bereits aufgelöste Tool-Set eingrenzen, aber kein Tool **wieder hinzufügen**, das durch `tools.profile` entfernt wurde. Beispiel: `tools.profile: "coding"` enthält `web_search`/`web_fetch`, aber nicht das `browser`-Tool. Damit Sub-Agenten mit Coding-Profil Browser-Automatisierung verwenden können, fügen Sie Browser auf der Profilstufe hinzu:

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

Sub-Agenten verwenden eine dedizierte In-Process-Queue-Lane:

- **Lane-Name:** `subagent`
- **Parallelität:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Liveness und Wiederherstellung

OpenClaw behandelt das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein Sub-Agent noch lebt. Unbeendete Runs, die älter als das Stale-Run-Fenster sind, zählen in `/subagents list`, Statuszusammenfassungen, Descendant-Completion-Gating und Per-Session-Parallelitätsprüfungen nicht mehr als aktiv/ausstehend.

Nach einem Gateway-Neustart werden veraltete unbeendete wiederhergestellte Runs bereinigt, sofern ihre Child-Session nicht als `abortedLastRun: true` markiert ist. Diese durch Neustart abgebrochenen Child-Sessions bleiben über den Sub-Agent-Orphan-Recovery-Flow wiederherstellbar, der vor dem Löschen des Aborted-Markers eine synthetische Resume-Nachricht sendet.

Automatische Neustart-Wiederherstellung ist pro Child-Session begrenzt. Wenn derselbe Sub-Agent-Child innerhalb des schnellen Re-Wedge-Fensters wiederholt für Orphan-Recovery akzeptiert wird, persistiert OpenClaw einen Recovery-Tombstone auf dieser Session und setzt sie bei späteren Neustarts nicht mehr automatisch fort. Führen Sie `openclaw tasks maintenance --apply` aus, um den Task-Datensatz abzugleichen, oder `openclaw doctor --fix`, um veraltete Aborted-Recovery-Flags auf Sessions mit Tombstone zu löschen.

<Note>
Wenn ein Sub-Agent-Spawn mit Gateway `PAIRING_REQUIRED` / `scope-upgrade` fehlschlägt, prüfen Sie den RPC-Caller, bevor Sie den Pairing-Status bearbeiten. Interne `sessions_spawn`-Koordination dispatcht im Prozess, wenn der Caller bereits innerhalb des Gateway-Request-Kontexts läuft, öffnet also keinen Loopback-WebSocket und hängt nicht von der Paired-Device-Scope-Baseline der CLI ab. Caller außerhalb des Gateway-Prozesses verwenden weiterhin den WebSocket-Fallback als `client.id: "gateway-client"` mit `client.mode: "backend"` über direkte Loopback-Shared-Token-/Passwort-Auth. Remote-Caller, explizite `deviceIdentity`, explizite Device-Token-Pfade und Browser-/Node-Clients benötigen weiterhin normale Gerätefreigabe für Scope-Upgrades.
</Note>

## Stoppen

- Das Senden von `/stop` im Requester-Chat bricht die Requester-Session ab und stoppt alle aktiven Sub-Agent-Runs, die daraus gespawnt wurden, mit Kaskadierung zu verschachtelten Children.

## Einschränkungen

- Sub-Agent-Ankündigung ist **Best-Effort**. Wenn der Gateway neu startet, geht ausstehende „announce back“-Arbeit verloren.
- Sub-Agenten teilen weiterhin dieselben Gateway-Prozessressourcen; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- Sub-Agent-Kontext injiziert nur `AGENTS.md` und `TOOLS.md` (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`). Codex-native Subagents folgen derselben Grenze: `TOOLS.md` bleibt in geerbten Codex-Thread-Anweisungen, während Parent-only-Persona-, Identitäts- und Benutzerdateien als turn-scoped Kollaborationsanweisungen injiziert werden, damit Children sie nicht klonen.
- Maximale Verschachtelungstiefe ist 5 (`maxSpawnDepth`-Bereich: 1–5). Tiefe 2 wird für die meisten Anwendungsfälle empfohlen.
- `maxChildrenPerAgent` begrenzt aktive Children pro Session (Standard `5`, Bereich `1–20`).

## Verwandt

- [ACP-Agenten](/de/tools/acp-agents)
- [Agent senden](/de/tools/agent-send)
- [Hintergrund-Tasks](/de/automation/tasks)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
