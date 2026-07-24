---
read_when:
    - Sie möchten Hintergrund- oder parallele Arbeit über den Agenten ausführen.
    - Sie ändern die Richtlinie für `sessions_spawn` oder das Sub-Agent-Tool.
    - Sie implementieren Thread-gebundene Subagent-Sitzungen oder beheben dabei Probleme
sidebarTitle: Sub-agents
summary: Starten Sie isolierte Agentenläufe im Hintergrund, die Ergebnisse an den anfordernden Chat zurückmelden.
title: Unteragenten
x-i18n:
    generated_at: "2026-07-24T05:21:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e45b32fdb177c52ed785287712b9b6c2c30bbe392f0ce975970910ff91ed30ed
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agenten sind im Hintergrund ausgeführte Agentenläufe, die aus einem bestehenden Agentenlauf gestartet werden.
Jeder läuft in einer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**meldet** nach Abschluss sein Ergebnis an den anfordernden Chatkanal zurück.
Jeder Sub-Agentenlauf wird als [Hintergrundaufgabe](/de/automation/tasks) verfolgt.

Ziele:

- Recherche, lange Aufgaben und langsame Tool-Arbeit parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agenten standardmäßig isoliert halten (getrennte Sitzungen, optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agenten erhalten standardmäßig **keine** Sitzungs- oder Nachrichtentools.
- Konfigurierbare Verschachtelungstiefe für Orchestrierungsmuster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig einen eigenen Kontext
und Token-Verbrauch. Legen Sie für aufwendige oder wiederkehrende Aufgaben
ein kostengünstigeres Modell für Sub-Agenten fest und verwenden Sie für Ihren
Haupt-Agenten über `agents.defaults.subagents.model` oder agentenspezifische
Überschreibungen weiterhin ein höherwertiges Modell. Wenn ein untergeordneter
Agent tatsächlich das aktuelle Transkript des Anfordernden benötigt, starten
Sie ihn mit `context: "fork"`. An Threads gebundene Sub-Agenten-Sitzungen
verwenden standardmäßig `context: "fork"`, da sie die aktuelle Unterhaltung
in einen Folge-Thread verzweigen.
</Note>

## Slash-Befehl

`/subagents` untersucht Sub-Agentenläufe für die **aktuelle Sitzung**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` zeigt Laufmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). `/subagents log` gibt die letzten Chatbeiträge
eines Laufs aus; fügen Sie das Token `tools` hinzu, um Nachrichten
zu Tool-Aufrufen und -Ergebnissen einzuschließen (standardmäßig ausgelassen).
Verwenden Sie `sessions_history` für eine begrenzte, sicherheitsgefilterte
Rückblickansicht innerhalb eines Agentenbeitrags oder prüfen Sie den
Transkriptpfad auf dem Datenträger, um das vollständige Rohtranskript anzuzeigen.

In der Control UI besitzen übergeordnete Sitzungen mit kürzlich ausgeführten
untergeordneten Läufen eine ausklappbare Seitenleistenzeile. Die verschachtelten
Zeilen zeigen Status und Laufzeit der untergeordneten Läufe. Durch Auswahl
einer Zeile wird der Chat dieses untergeordneten Laufs geöffnet, wobei die
übergeordnete Hierarchie erhalten bleibt.

### Steuerelemente für die Thread-Bindung

Diese Befehle funktionieren in Kanälen mit dauerhaften Thread-Bindungen. Siehe
[Kanäle mit Thread-Unterstützung](#thread-supporting-channels) weiter unten.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Startverhalten

Agenten starten Sub-Agenten im Hintergrund mit dem Tool `sessions_spawn`.
Abschlüsse werden als interne Ereignisse der übergeordneten Sitzung
zurückgegeben; der übergeordnete/anfordernde Agent entscheidet, ob eine
für Benutzer sichtbare Aktualisierung erforderlich ist.

<AccordionGroup>
  <Accordion title="Nicht blockierender, Push-basierter Abschluss">
    - `sessions_spawn` ist nicht blockierend und gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss meldet sich der Sub-Agent bei der übergeordneten/anfordernden Sitzung zurück.
    - Agentenbeiträge, die Ergebnisse untergeordneter Agenten benötigen, sollten nach dem Start der erforderlichen Arbeit `sessions_yield` aufrufen. Dadurch wird der aktuelle Beitrag beendet und das Abschlussereignis kann als nächste für das Modell sichtbare Nachricht eintreffen.
    - Der Abschluss erfolgt Push-basiert. Fragen Sie nach dem Start **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife ab, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zur Fehlerdiagnose.
    - Die Ausgabe des untergeordneten Agenten ist ein Bericht/Nachweis, den der anfordernde Agent zusammenfassen soll. Sie ist kein vom Benutzer verfasster Anweisungstext und kann System-, Entwickler- oder Benutzerrichtlinien nicht außer Kraft setzen.
    - Nach Abschluss versucht OpenClaw, die von dieser Sub-Agenten-Sitzung geöffneten und nachverfolgten Browser-Tabs/-Prozesse zu schließen, bevor der Bereinigungsablauf der Meldung fortgesetzt wird.

  </Accordion>
  <Accordion title="Übermittlung des Abschlusses">
    - OpenClaw übergibt Abschlüsse über einen `agent`-Beitrag mit einem stabilen Idempotenzschlüssel an die anfordernde Sitzung zurück.
    - Wenn der anfordernde Lauf noch aktiv ist, versucht OpenClaw zunächst, diesen Lauf aufzuwecken/zu steuern, anstatt einen zweiten sichtbaren Antwortpfad zu starten.
    - Wenn ein aktiver Anfordernder nicht aufgeweckt werden kann, greift OpenClaw auf eine Übergabe an den anfordernden Agenten mit demselben Abschlusskontext zurück, anstatt die Meldung zu verwerfen.
    - Eine erfolgreiche Übergabe an den übergeordneten Agenten schließt die Übermittlung des Sub-Agenten ab, selbst wenn der übergeordnete Agent entscheidet, dass keine sichtbare Benutzeraktualisierung erforderlich ist.
    - Native Sub-Agenten erhalten das Nachrichtentool nicht. Sie geben reinen Assistententext an den übergeordneten/anfordernden Agenten zurück; für Menschen sichtbare Antworten unterliegen weiterhin den normalen Übermittlungsrichtlinien des übergeordneten/anfordernden Agenten.
    - Wenn eine direkte Übergabe nicht verwendet werden kann, greift die Übermittlung zunächst auf das Warteschlangen-Routing und anschließend vor der endgültigen Aufgabe auf eine kurze Wiederholung der Meldung mit exponentiellem Backoff zurück.
    - Bei der Übermittlung bleibt die aufgelöste Route des Anfordernden erhalten: An Threads oder Unterhaltungen gebundene Abschlussrouten haben Vorrang, sofern sie verfügbar sind. Wenn der Ursprung des Abschlusses nur einen Kanal angibt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der anfordernden Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), damit die direkte Übermittlung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Abschlussübergabe">
    Die Abschlussübergabe an die anfordernde Sitzung ist ein zur Laufzeit
    erzeugter interner Kontext (kein vom Benutzer verfasster Text) und umfasst:

    - `Result` — den neuesten sichtbaren `assistant`-Antworttext des untergeordneten Agenten. Die Ausgabe von Tool/Tool-Ergebnis wird nicht in Ergebnisse des untergeordneten Agenten übernommen. Endgültig fehlgeschlagene Läufe verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Prüfanweisung, die den anfordernden Agenten auffordert, das Ergebnis zu verifizieren, bevor er entscheidet, ob die ursprüngliche Aufgabe abgeschlossen ist.
    - Eine Folgeanweisung, die den anfordernden Agenten auffordert, die Aufgabe fortzusetzen oder eine Folgeaufgabe zu erfassen, wenn das Ergebnis des untergeordneten Agenten weitere Maßnahmen erfordert.
    - Eine Anweisung zur abschließenden Aktualisierung für den Fall, dass keine weiteren Maßnahmen erforderlich sind, formuliert in normaler Assistentensprache und ohne Weitergabe interner Rohmetadaten.

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben die Standardwerte für diesen konkreten Lauf.
    - Verwenden Sie `info`/`log`, um nach dem Abschluss Details und Ausgabe zu prüfen.
    - Verwenden Sie für dauerhafte, an Threads gebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Wenn der Kanal des Anfordernden keine Thread-Bindungen unterstützt, verwenden Sie `mode: "run"`, statt eine unmögliche an einen Thread gebundene Kombination erneut zu versuchen.
    - Verwenden Sie für Sitzungen mit ACP-Harness (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit ausweist. Siehe [ACP-Übermittlungsmodell](/de/tools/acp-agents#delivery-model) bei der Fehlerdiagnose von Abschlüssen oder Agent-zu-Agent-Schleifen. Wenn das Plugin `codex` aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anfordernde nicht in einer Sandbox ausgeführt wird und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.entries.*`-Eintrag mit `runtime.type="acp"`; verwenden Sie für normale OpenClaw-Konfigurationsagenten aus `agents_list` die standardmäßige Sub-Agenten-Laufzeit.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agenten starten isoliert, sofern der Aufrufer nicht ausdrücklich
anfordert, das aktuelle Transkript zu verzweigen.

| Modus       | Verwendungszweck                                                                                                                         | Verhalten                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Neue Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext vollständig beschrieben werden kann | Erstellt ein leeres Transkript für den untergeordneten Agenten. Dies ist der Standard und hält den Token-Verbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, vorherigen Tool-Ergebnissen oder differenzierten Anweisungen abhängt, die bereits im Transkript des Anfordernden enthalten sind | Verzweigt das Transkript des Anfordernden in die Sitzung des untergeordneten Agenten, bevor dieser startet. |

Verwenden Sie `fork` sparsam. Es dient der kontextabhängigen
Delegation und ersetzt keine klar formulierte Aufgabenbeschreibung.

## Tool: `sessions_spawn`

Startet einen Sub-Agentenlauf mit `deliver: false` auf der globalen
`subagent`-Spur, führt anschließend einen Meldungsschritt aus und
sendet die Meldungsantwort an den Chatkanal des Anfordernden.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab.
Die integrierten Profile `coding` und `messaging` enthalten
`sessions_spawn`, `sessions_yield` und `subagents`;
`minimal` enthält sie nicht. `full` erlaubt jedes Tool.
Fügen Sie diese Tools mit `tools.alsoAllow` hinzu oder verwenden Sie eines
der oben genannten Profile für einen Agenten mit einem benutzerdefinierten,
restriktiveren Profil, der dennoch Arbeit delegieren soll.
Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische Zulassungs-/
Verweigerungsrichtlinien können das Tool nach der Profilphase weiterhin
entfernen. Verwenden Sie `/tools` aus derselben Sitzung, um die
effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** Native Sub-Agenten übernehmen das Modell des Aufrufers, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.entries.*.subagents.model`) festlegen. Starts der ACP-Laufzeit verwenden dasselbe konfigurierte Sub-Agentenmodell, sofern vorhanden; andernfalls behält das ACP-Harness seinen eigenen Standard bei. Ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Reasoning:** Native Sub-Agenten übernehmen die Einstellung des Aufrufers, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.entries.*.subagents.thinking`) festlegen. Starts der ACP-Laufzeit wenden außerdem `agents.defaults.models["provider/model"].params.thinking` auf das ausgewählte Modell an. Ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Zeitüberschreitung des Laufs:** OpenClaw verwendet `agents.defaults.subagents.runTimeoutSeconds`, wenn dieser Wert festgelegt ist; andernfalls greift es auf `0` zurück (keine Zeitüberschreitung). `sessions_spawn` akzeptiert keine aufrufspezifischen Überschreibungen der Zeitüberschreitung.
- **Prozesslebensdauer:** Ein losgelöster OpenClaw-Sub-Agent besitzt einen eigenen Lauflebenszyklus. Eine innerhalb eines externen CLI-Backends erstellte Hintergrundaufgabe unterscheidet sich davon: Sie teilt sich den übergeordneten CLI-Unterprozess und wird beendet, wenn dieser `agents.defaults.timeoutSeconds` erreicht.
- **Aufgabenübermittlung:** Native Sub-Agenten erhalten die delegierte Aufgabe in ihrer ersten sichtbaren `[Subagent Task]`-Nachricht. Der System-Prompt des Sub-Agenten enthält Laufzeitregeln und Routing-Kontext, nicht ein verborgenes Duplikat der Aufgabe.

Akzeptierte Starts nativer Sub-Agenten enthalten die aufgelösten
Modellmetadaten des untergeordneten Agenten im Tool-Ergebnis:
`resolvedModel` enthält die angewendete Modellreferenz und
`resolvedProvider` das Provider-Präfix, sofern die Referenz eines besitzt.

### Modus des Delegierungs-Prompts

`agents.defaults.subagents.delegationMode` steuert nur die Prompt-Anleitung; die Tool-Richtlinie
wird dadurch weder geändert noch wird die Delegation erzwungen.

- `suggest` (Standard): Den standardmäßigen Prompt-Hinweis beibehalten, Sub-Agenten für größere oder langsamere Arbeiten zu verwenden.
- `prefer`: Den Haupt-Agenten anweisen, reaktionsfähig zu bleiben und alles, was über eine direkte Antwort hinausgeht, über `sessions_spawn` zu delegieren.

Agentenspezifische Überschreibung: `agents.entries.*.subagents.delegationMode`.

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
  Optionaler stabiler Bezeichner zur Identifizierung eines bestimmten untergeordneten Agenten in späteren Statusausgaben. Muss `[a-z][a-z0-9_-]{0,63}` entsprechen und darf kein reserviertes Ziel wie `last` oder `all` sein.
</ParamField>
<ParamField path="label" type="string">
  Optionale menschenlesbare Bezeichnung.
</ParamField>
<ParamField path="agentId" type="string">
  Unter einer anderen konfigurierten Agenten-ID starten, sofern durch `subagents.allowAgents` zulässig.
</ParamField>
<ParamField path="cwd" type="string">
  Optionales Arbeitsverzeichnis für die Aufgabe des untergeordneten Laufs. Native Sub-Agenten laden Bootstrap-Dateien weiterhin aus dem Arbeitsbereich des Zielagenten; `cwd` ändert nur, wo Laufzeitwerkzeuge und CLI-Harnesses die delegierte Arbeit ausführen.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist nur für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) sowie für `agents.entries.*`-Einträge vorgesehen, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird bei nativen Sub-Agenten-Starts ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die übergeordnete Sitzung, wenn `runtime: "acp"`; bei nativen Sub-Agenten-Starts weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Modell des Sub-Agenten. Ungültige Werte werden übersprungen, und der Sub-Agent wird mit dem Standardmodell ausgeführt; das Werkzeugergebnis enthält eine Warnung.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt die Denkstufe für den Sub-Agenten-Lauf. Mit `visible: true` nicht verfügbar.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird eine Bindung an einen Kanal-Thread für diese Sub-Agenten-Sitzung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` und `mode` weggelassen wird, wird `session` zum Standardwert. `mode: "session"` erfordert `thread: true`.
  Falls für den Kanal des Anforderers keine Thread-Bindung verfügbar ist, verwenden Sie stattdessen `mode: "run"`.
  Lassen Sie bei `visible: true` `mode` weg; sichtbare Sitzungen sind persistent und unterstützen `mode: "run"` nicht.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert die Sitzung unmittelbar nach der Ankündigung (das Transkript bleibt durch Umbenennung erhalten).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Start ab, sofern die Ziellaufzeit des untergeordneten Agenten nicht in einer Sandbox ausgeführt wird.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die untergeordnete Sitzung. Nur native Sub-Agenten. Thread-gebundene Starts verwenden standardmäßig `fork`; Starts ohne Thread verwenden standardmäßig `isolated`. Ein sichtbarer Fork muss auf denselben Agenten wie der Anforderer zielen.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Erstellt eine persistente Dashboard-Sitzung, die der Benutzer in der Control UI öffnen kann. Sichtbare Starts unterstützen nur `runtime: "subagent"` und behalten die erstellte Sitzung immer bei.
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  Stellt einen verwalteten Git-Worktree für die neue Dashboard-Sitzung bereit. Erfordert `visible: true`.
</ParamField>
<ParamField path="worktreeName" type="string">
  Optionaler Name des verwalteten Worktrees. Erfordert `visible: true` und `worktree: true`.
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  Optionale Git-Basisreferenz für den verwalteten Worktree. Erfordert `visible: true` und `worktree: true`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Parameter für die Kanalzustellung (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Native Sub-Agenten melden
ihren neuesten Assistentenbeitrag an den Anforderer zurück; die externe Zustellung verbleibt beim
übergeordneten Agenten bzw. Anforderer.
</Warning>

Mit `visible: true` werden `model`, `cwd` und ein agentengleiches `context: "fork"` unterstützt. Ein Ziel in einer Sandbox beschränkt `cwd` auf den Arbeitsbereich dieses Agenten. Thread-Bindung, `mode`, Überschreibungen der Denkstufe, `lightContext`, `attachments` und `attachAs` sind auf diesem Pfad nicht verfügbar, da sichtbare Sitzungen persistente Dashboard-Sitzungen sind, die über `sessions.create` erstellt werden. Ein sichtbarer Start wird abgelehnt, wenn der Anforderer selbst mit einer geerbten Werkzeug-Zulassungs- oder -Sperrliste gestartet wurde; diese Einschränkung wird beim Start festgelegt und kann nicht durch die Konfiguration überschrieben werden. Sitzungsauflistung und -adressierung richten sich nach `tools.sessions.visibility`; der standardmäßige `tree`-Geltungsbereich umfasst die aktuelle Sitzung und ihren eigenen Start-Unterbaum. Informationen zur Benennung von Checkouts sowie zum Einrichten, Bereinigen und Wiederherstellen finden Sie unter [Verwaltete Worktrees](/de/concepts/managed-worktrees).

### Aufgabennamen und Zielauswahl

`taskName` ist ein modellseitiger Bezeichner für die Orchestrierung, kein Sitzungsschlüssel.
Verwenden Sie ihn für stabile Namen untergeordneter Agenten wie `review_subagents`,
`linux_validation` oder `docs_update`, wenn ein Koordinator diesen
untergeordneten Agenten später möglicherweise überprüfen muss.

Die Zielauflösung akzeptiert exakte Übereinstimmungen mit `taskName` und eindeutige
Präfixe. Die Übereinstimmung ist auf dasselbe aktive/kürzlich verwendete Zielfenster beschränkt,
das für nummerierte `/subagents`-Ziele verwendet wird, sodass ein veralteter abgeschlossener untergeordneter Agent
einen wiederverwendeten Bezeichner nicht mehrdeutig macht. Wenn zwei aktive oder kürzlich verwendete untergeordnete Agenten denselben
`taskName` verwenden, ist das Ziel mehrdeutig; verwenden Sie stattdessen den Listenindex, den Sitzungsschlüssel oder
die Lauf-ID.

Die reservierten Ziele `last` und `all` sind keine gültigen `taskName`-Werte,
da sie bereits Steuerungsbedeutungen haben.

## Werkzeug: `sessions_yield`

Beendet den aktuellen Modellbeitrag und wartet darauf, dass Laufzeitereignisse, hauptsächlich
Abschlussereignisse von Sub-Agenten, als nächste Nachricht eintreffen. Verwenden Sie es nach
dem Start erforderlicher untergeordneter Arbeiten, wenn der Anforderer erst nach deren Abschluss
eine endgültige Antwort erstellen kann.

`sessions_yield` ist das Warteprimitiv. Ersetzen Sie es nicht durch Abfrageschleifen
über `subagents`, `sessions_list`, `sessions_history`, Shell-
`sleep` oder Prozessabfragen, nur um den Abschluss untergeordneter Agenten zu erkennen.

Verwenden Sie `sessions_yield` nur, wenn es in der effektiven Werkzeugliste der Sitzung enthalten ist.
Einige minimale oder benutzerdefinierte Werkzeugprofile stellen möglicherweise `sessions_spawn` und
`subagents` bereit, ohne `sessions_yield` bereitzustellen; erfinden Sie in diesem Fall keine
Abfrageschleife, nur um auf den Abschluss zu warten.

Wenn aktive untergeordnete Agenten vorhanden sind, fügt OpenClaw in normale Beiträge einen kompakten, zur Laufzeit erzeugten
`Active Subagents`-Promptblock ein, damit der Anforderer
die aktuellen Sitzungen untergeordneter Agenten, Lauf-IDs, Statusangaben, Bezeichnungen, Aufgaben und
`taskName`-Aliasse ohne Abfragen sehen kann. Die Aufgaben- und Bezeichnungsfelder in diesem
Block werden als Daten und nicht als Anweisungen in Anführungszeichen gesetzt, da sie aus vom Benutzer oder Modell bereitgestellten
Startargumenten stammen können.

## Werkzeug: `subagents`

Listet gestartete Sub-Agenten-Läufe und Datensätze von Hintergrundaufgaben auf, die dem
Sitzungsbaum des Anforderers gehören. Die Aufgabenzeilen umfassen native Sub-Agenten, ACP-Läufe,
Gateway-CLI-/Medienarbeiten und Cron-Ausführungen. Der Geltungsbereich ist auf den aktuellen
Anforderer beschränkt; ein untergeordneter Agent kann nur seine eigenen kontrollierten untergeordneten Agenten sehen.

Verwenden Sie `subagents` für bedarfsgesteuerte Statusabfragen und zur Fehlerdiagnose. Verwenden Sie `sessions_yield`, um
auf Abschlussereignisse zu warten.

Verwenden Sie `action: "cancel"` mit einer von `action: "list"` zurückgegebenen `taskId`, um
eine Aufgabe zu beenden. Der Abbruch ist auf den kontrollierten Sitzungsbaum beschränkt; ein
Sub-Agent ohne untergeordnete Agenten kann keine Arbeit abbrechen, die einer anderen Sitzung gehört.

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Sub-Agent an
einen Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiterhin an
dieselbe Sub-Agenten-Sitzung weitergeleitet werden.

### Kanäle mit Thread-Unterstützung

Ein Kanal unterstützt persistente Thread-gebundene Sub-Agenten-Sitzungen
(`sessions_spawn` mit `thread: true`), wenn er einen Adapter für Gesprächsbindungen
registriert. Mitgelieferte Kanäle mit dieser Unterstützung: **Discord**,
**iMessage**, **Matrix** und **Telegram**. Discord und Matrix erstellen standardmäßig
einen untergeordneten Thread; Telegram und iMessage binden standardmäßig die
aktuelle Unterhaltung. Verwenden Sie die kanalspezifischen `threadBindings`-Konfigurationsschlüssel für
Aktivierung, Zeitüberschreitungen und `spawnSessions`.

### Schnellablauf

<Steps>
  <Step title="Starten">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt einen Thread oder bindet einen Thread an dieses Sitzungsziel im aktiven Kanal.
  </Step>
  <Step title="Folgenachrichten weiterleiten">
    Antworten und Folgenachrichten in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Zeitüberschreitungen prüfen">
    Verwenden Sie `/session idle`, um die automatische Aufhebung des Fokus bei Inaktivität zu prüfen/aktualisieren, und
    `/session max-age`, um die feste Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um die Bindung manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerung

| Befehl            | Wirkung                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread an ein Sub-Agenten-/Sitzungsziel (oder erstellt einen)                     |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                                           |
| `/agents`          | Listet aktive Läufe und den Bindungsstatus auf (`binding:<id>`, `unbound` oder `bindings unavailable`) |
| `/session idle`    | Prüft/aktualisiert die automatische Aufhebung des Fokus bei Inaktivität (nur fokussierte gebundene Threads)                             |
| `/session max-age` | Prüft/aktualisiert die feste Obergrenze (nur fokussierte gebundene Threads)                                      |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanalspezifische Überschreibungen und Schlüssel für die automatische Bindung beim Start** sind adapterspezifisch. Siehe oben [Kanäle mit Thread-Unterstützung](#thread-supporting-channels).

Aktuelle Adapterdetails finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference) und unter
[Slash-Befehle](/de/tools/slash-commands).

### Zulassungsliste

<ParamField path="agents.entries.*.subagents.allowAgents" type="string[]">
  Liste der konfigurierten Agenten-IDs, die über ein explizites `agentId` als Ziel angegeben werden können (`["*"]` lässt jedes konfigurierte Ziel zu). Standard: nur der Agent des Anforderers. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Anforderer sich selbst mit `agentId` startet, nehmen Sie die ID des Anforderers in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standardmäßige Zulassungsliste konfigurierter Zielagenten, die verwendet wird, wenn der Agent des Anforderers keine eigene `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, bei denen `agentId` weggelassen wird (erzwingt eine explizite Profilauswahl). Agentenspezifische Überschreibung: `agents.entries.*.subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Zeitüberschreitung pro Aufruf für Zustellversuche von Gateway-`agent`-Ankündigungen. Die Werte sind positive ganzzahlige Millisekunden und werden auf den plattformsicheren maximalen Zeitgeberwert begrenzt. Vorübergehende Wiederholungsversuche können dazu führen, dass die gesamte Wartezeit für die Ankündigung länger als eine konfigurierte Zeitüberschreitung ist.
</ParamField>

Wenn die Sitzung des Anforderers in einer Sandbox ausgeführt wird, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox ausgeführt würden.

### Ermittlung

Verwenden Sie `agents_list`, um zu sehen, welche Agenten-IDs derzeit für
`sessions_spawn` zulässig sind. Die Antwort enthält für jeden aufgeführten Agenten das effektive
Modell und eingebettete Runtime-Metadaten, damit Aufrufer OpenClaw, den Codex-
App-Server und andere konfigurierte native Runtimes unterscheiden können.

`allowAgents`-Einträge müssen auf konfigurierte Agenten-IDs in `agents.entries.*` verweisen.
`["*"]` bedeutet jeden konfigurierten Zielagenten sowie den Anforderer. Wenn eine Agentenkonfiguration
gelöscht wird, ihre ID jedoch in `allowAgents` verbleibt, lehnt `sessions_spawn` diese ID ab
und `agents_list` lässt sie aus. Führen Sie `openclaw doctor --fix` aus, um veraltete
Zulassungslisteneinträge zu bereinigen, oder fügen Sie einen minimalen `agents.entries.*`-Eintrag hinzu, wenn das Ziel
weiterhin erzeugt werden können soll und dabei Standardwerte erbt.

### Automatische Archivierung

- Unteragentensitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` (Standardwert: `60`) automatisch archiviert.
- Bei der Archivierung wird `sessions.delete` verwendet und das Transkript in `*.deleted.<timestamp>` umbenannt (derselbe Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (das Transkript bleibt durch die Umbenennung erhalten).
- Die automatische Archivierung erfolgt nach bestem Bemühen; ausstehende Timer gehen bei einem Neustart des Gateways verloren.
- Konfigurierte Laufzeitüberschreitungen archivieren **nicht** automatisch; sie beenden lediglich den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung bestehen.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und 2.
- Die Browserbereinigung erfolgt getrennt von der Archivbereinigung: Erfasste Browser-Tabs und -Prozesse werden nach bestem Bemühen geschlossen, wenn der Lauf endet, selbst wenn der Transkript-/Sitzungsdatensatz beibehalten wird.

## Verschachtelte Unteragenten

Standardmäßig können Unteragenten keine eigenen Unteragenten erzeugen
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine
Verschachtelungsebene zu aktivieren – das **Orchestrator-Muster**: Hauptagent → Orchestrator-Unteragent →
Unter-Unteragenten als Worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // Unteragenten dürfen untergeordnete Agenten erzeugen (Standardwert: 1, Bereich 1-5)
        maxChildrenPerAgent: 5, // maximale Anzahl aktiver untergeordneter Agenten pro Agentensitzung (Standardwert: 5, Bereich 1-20)
        maxConcurrent: 8, // globale Obergrenze der Nebenläufigkeitsspur (Standardwert: 8)
        runTimeoutSeconds: 900, // standardmäßige Zeitüberschreitung für sessions_spawn (0 = keine Zeitüberschreitung)
        announceTimeoutMs: 120000, // Gateway-Ankündigungszeitüberschreitung pro Aufruf
      },
    },
  },
}
```

### Tiefenstufen

| Tiefe | Form des Sitzungsschlüssels                 | Rolle                                                 | Kann Agenten erzeugen?         |
| ----- | -------------------------------------------- | ----------------------------------------------------- | ------------------------------ |
| 0     | `agent:<id>:main`                            | Hauptagent                                            | Immer                          |
| 1     | `agent:<id>:subagent:<uuid>`                 | Unteragent (Orchestrator, wenn Tiefe 2 zulässig ist)  | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Unter-Unteragent (Worker-Blatt)                       | Nie                            |

### Ankündigungskette

Ergebnisse fließen die Kette aufwärts zurück:

1. Worker der Tiefe 2 wird fertig → kündigt dies seinem übergeordneten Agenten (Orchestrator der Tiefe 1) an.
2. Orchestrator der Tiefe 1 empfängt die Ankündigung, führt die Ergebnisse zusammen und wird fertig → kündigt dies dem Hauptagenten an.
3. Der Hauptagent empfängt die Ankündigung und übermittelt sie dem Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer unmittelbar untergeordneten Agenten.

<Note>
**Betriebshinweis:** Starten Sie untergeordnete Aufgaben einmalig und warten Sie auf Abschlussereignisse,
anstatt Abfrageschleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Ruhebefehle zu erstellen.
`sessions_list` und `/subagents list` beschränken Beziehungen zu untergeordneten Sitzungen
auf laufende Arbeit – aktive untergeordnete Agenten bleiben verknüpft, beendete untergeordnete Agenten bleiben
für ein kurzes aktuelles Zeitfenster sichtbar und veraltete, nur im Speicher vorhandene Verknüpfungen zu untergeordneten Agenten werden
nach Ablauf ihres Aktualitätsfensters ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`- /
`parentSessionKey`-Metadaten nach einem Neustart Phantom-Agenten wiederherstellen.
Wenn ein Abschlussereignis eines untergeordneten Agenten eintrifft, nachdem Sie bereits die
endgültige Antwort gesendet haben, ist die korrekte Folgeaktion exakt das stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Ein untergeordneter Agent übernimmt beim Erzeugen die effektive Absenderrichtlinie des Anforderers. Läufe untergeordneter Agenten ohne Absender und authentifizierte Wiederaufnahmen durch Operatoren behalten diesen Snapshot bei, selbst wenn sich `toolsBySender` später ändert; aktuelle globale Einschränkungen sowie Agenten-, Provider-, Sandbox- und Unteragenteneinschränkungen gelten weiterhin. Bei einer neuen externen Kanalinteraktion, die an den untergeordneten Agenten gerichtet ist, wird stattdessen die aktuelle Absenderrichtlinie neu aufgelöst.
- Rolle und Steuerungsumfang werden beim Erzeugen in die Sitzungsmetadaten geschrieben. Dadurch erhalten flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich erneut Orchestrator-Berechtigungen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er untergeordnete Agenten erzeugen und deren Status prüfen kann. Andere Sitzungs-/System-Tools bleiben verweigert.
- **Tiefe 1 (Blatt, wenn `maxSpawnDepth == 1`):** keine Sitzungs-Tools (aktuelles Standardverhalten).
- **Tiefe 2 (Worker-Blatt):** keine Sitzungs-Tools – `sessions_spawn` wird bei Tiefe 2 immer verweigert. Es können keine weiteren untergeordneten Agenten erzeugt werden.

### Erzeugungslimit pro Agent

Jede Agentensitzung (in beliebiger Tiefe) kann gleichzeitig höchstens `maxChildrenPerAgent`
(Standardwert: `5`) aktive untergeordnete Agenten haben. Dies verhindert eine unkontrollierte Auffächerung
durch einen einzelnen Orchestrator.

### Kaskadierendes Beenden

Beim Beenden eines Orchestrators der Tiefe 1 werden automatisch alle seine
untergeordneten Agenten der Tiefe 2 beendet:

- `/stop` im Hauptchat beendet alle Agenten der Tiefe 1 und kaskadiert zu deren untergeordneten Agenten der Tiefe 2.

## Authentifizierung

Die Authentifizierung von Unteragenten wird anhand der **Agenten-ID** aufgelöst, nicht anhand des Sitzungstyps:

- Der Sitzungsschlüssel des Unteragenten lautet `agent:<agentId>:subagent:<uuid>`.
- Der Authentifizierungsspeicher wird aus `agentDir` dieses Agenten geladen.
- Die Authentifizierungsprofile des Hauptagenten werden als **Fallback** zusammengeführt; bei Konflikten überschreiben Agentenprofile die Profile des Hauptagenten.

Die Zusammenführung ist additiv, sodass die Profile des Hauptagenten immer als
Fallbacks verfügbar sind. Eine vollständig isolierte Authentifizierung pro Agent wird noch nicht unterstützt.

## Ankündigung

Unteragenten melden über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt wird innerhalb der Unteragentensitzung ausgeführt (nicht in der Sitzung des Anforderers).
- Wenn der Unteragent exakt `ANNOUNCE_SKIP` antwortet, wird nichts veröffentlicht.
- Wenn der neueste Assistententext exakt dem stillen Token `NO_REPLY` / `no_reply` entspricht, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbare Fortschrittsmeldungen vorhanden waren.

Die Zustellung hängt von der Tiefe des Anforderers ab:

- Anforderersitzungen der obersten Ebene verwenden einen nachfolgenden `agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Unteragentensitzungen des Anforderers erhalten eine interne nachfolgende Einspeisung (`deliver=false`), damit der Orchestrator die Ergebnisse untergeordneter Agenten innerhalb der Sitzung zusammenführen kann.
- Wenn eine verschachtelte Unteragentensitzung des Anforderers nicht mehr vorhanden ist, greift OpenClaw auf den Anforderer dieser Sitzung zurück, sofern verfügbar.

Bei Anforderersitzungen der obersten Ebene löst die direkte Zustellung im Abschlussmodus zunächst
eine etwaige gebundene Unterhaltungs-/Thread-Route und Hook-Überschreibung auf und ergänzt anschließend
fehlende Kanal-Zielfelder aus der gespeicherten Route der Anforderersitzung.
Dadurch bleiben Abschlüsse im richtigen Chat/Thema, selbst wenn der Ursprung des Abschlusses
nur den Kanal identifiziert.

Die Aggregation der Abschlüsse untergeordneter Agenten ist beim Erstellen verschachtelter Abschlussbefunde
auf den aktuellen Lauf des Anforderers beschränkt. Dadurch wird verhindert, dass Ausgaben untergeordneter Agenten
aus veralteten früheren Läufen in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten
die Thread-/Themenweiterleitung bei, sofern diese in Kanaladaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird in einen stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                               |
| Sitzungs-IDs   | Sitzungsschlüssel/-ID des untergeordneten Agenten                                                         |
| Typ            | Ankündigungstyp + Aufgabenbezeichnung                                                                     |
| Status         | Aus dem Runtime-Ergebnis abgeleitet (`ok`, `error`, `timeout` oder `unknown`) – **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistententext des untergeordneten Agenten                                           |
| Folgeaktion    | Anweisung, die beschreibt, wann geantwortet bzw. geschwiegen werden soll                                  |

Fehlgeschlagene beendete Läufe melden den Fehlerstatus, ohne erfassten
Antworttext erneut wiederzugeben. Tool-/ToolResult-Ausgaben werden nicht zum Ergebnistext des untergeordneten Agenten hochgestuft.

### Statistikzeile

Ankündigungsnutzlasten enthalten am Ende eine Statistikzeile (auch bei Zeilenumbruch):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/gesamt).
- Geschätzte Kosten, wenn die Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und den Transkriptpfad, damit der Hauptagent den Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann.

Interne Metadaten sind ausschließlich für die Orchestrierung bestimmt; benutzerseitige Antworten
sollten in normaler Assistentensprache neu formuliert werden.

### Warum `sessions_history` vorzuziehen ist

`sessions_history` ist der sicherere Orchestrierungsweg, um das Transkript eines untergeordneten Agenten
innerhalb einer Agenteninteraktion zu lesen:

- Schwärzt Text, der Anmeldedaten oder Tokens ähnelt, selbst wenn die allgemeine Protokollschwärzung deaktiviert ist.
- Kürzt lange Textblöcke (4000 Zeichen pro Block) und entfernt Denksignaturen, Nutzlasten zur Wiedergabe von Schlussfolgerungen und Inline-Bilddaten.
- Erzwingt eine Antwortobergrenze von 80 KB; übergroße Zeilen werden durch `[sessions_history omitted: message too large]` ersetzt.
- Verwenden Sie `nextOffset`, sofern vorhanden, um rückwärts durch ältere Transkriptfenster zu blättern.
- `sessions_history` entfernt **keine** Schlussfolgerungs-Tags, `<relevant-memories>`-Gerüste oder Tool-Aufruf-XML aus dem Nachrichtentext – es gibt strukturierte Inhaltsblöcke zurück, die der Rohform des Transkripts nahekommen und lediglich geschwärzt sowie größenbegrenzt sind. `/subagents log` wendet die stärkere Fließtextbereinigung an (entfernt Schlussfolgerungs-Tags, Speichergerüste und Tool-Aufruf-XML), da es einfache Chatzeilen anstelle strukturierter Blöcke darstellt.
- Die direkte Prüfung des Transkripts auf dem Datenträger ist der Fallback, wenn Sie das vollständige, bytegenaue Transkript benötigen.

## Tool-Richtlinie

Unteragenten verwenden zunächst dieselbe Profil- und Tool-Richtlinien-Pipeline wie der übergeordnete
oder Zielagent. Anschließend wendet OpenClaw die Einschränkungsebene für Unteragenten
an.

Unteragenten verlieren unabhängig von Tiefe oder Rolle immer `gateway`, `agents_list`, `session_status` und
`cron` (Tools auf Systemebene/interaktive Tools oder
Tools, die der Hauptagent koordinieren sollte). Blatt-Unteragenten (standardmäßiges Verhalten bei Tiefe 1
und immer bei Tiefe 2) verlieren zusätzlich `subagents`,
`sessions_list`, `sessions_history` und `sessions_spawn`. Unteragenten
erhalten niemals das Tool `message` – es wird beim Erzeugen deaktiviert und nicht durch
diese Sperrliste herausgefiltert – und `sessions_send` bleibt verweigert, sodass Unteragenten
ausschließlich über die Ankündigungskette kommunizieren.

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Erinnerungsansicht –
es handelt sich nicht um eine rohe Transkriptausgabe.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Unteragenten der Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre untergeordneten Agenten verwalten können.

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
        // Ablehnung hat Vorrang
        deny: ["gateway", "cron"],
        // wenn „allow“ festgelegt ist, werden ausschließlich diese Einträge zugelassen (Ablehnung hat weiterhin Vorrang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` ist ein abschließender Filter, der ausschließlich Zulässiges berücksichtigt. Er kann
die bereits aufgelöste Werkzeugmenge einschränken, aber kein durch
`tools.profile` entferntes Werkzeug **wieder hinzufügen**. Beispielsweise enthält `tools.profile: "coding"`
`web_search`/`web_fetch`, jedoch nicht das Werkzeug `browser`. Damit
Sub-Agenten mit Coding-Profil Browserautomatisierung verwenden können, fügen Sie „browser“ auf der
Profilebene hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie `agents.entries.*.tools.alsoAllow: ["browser"]` pro Agent, wenn nur ein
Agent Browserautomatisierung erhalten soll.

## Parallelität

Sub-Agenten verwenden eine dedizierte prozessinterne Warteschlangenspur:

- **Spurname:** `subagent`
- **Parallelität:** `agents.defaults.subagents.maxConcurrent` (Standard `8`)

## Verfügbarkeit und Wiederherstellung

OpenClaw betrachtet das Ausbleiben von `endedAt` nicht als dauerhaften Beweis dafür, dass ein
Sub-Agent noch aktiv ist. Nicht beendete Ausführungen, die älter als das Zeitfenster für veraltete Ausführungen sind
(2 Stunden oder das konfigurierte Ausführungszeitlimit zuzüglich einer kurzen Kulanzfrist,
je nachdem, welcher Zeitraum länger ist), werden in `/subagents list`,
Statuszusammenfassungen, der Abschlussprüfung für Nachkommen und den Parallelitätsprüfungen
pro Sitzung nicht mehr als aktiv/ausstehend gezählt.

Nach einem Gateway-Neustart werden wiederhergestellte, veraltete und nicht beendete Ausführungen entfernt, sofern
ihre untergeordnete Sitzung nicht als `abortedLastRun: true` markiert ist. Durch einen Neustart abgebrochene
Ausführungen bleiben für den Wiederherstellungsablauf verwaister Sub-Agenten registriert: Veraltete
Ausführungen werden ohne Fortsetzung abgeschlossen, während aktuelle untergeordnete Sitzungen eine
synthetische Fortsetzungsnachricht erhalten, bevor die Abbruchmarkierung entfernt wird.

Die automatische Wiederherstellung nach einem Neustart ist pro untergeordneter Sitzung begrenzt. Wenn derselbe
untergeordnete Sub-Agent innerhalb des Zeitfensters für schnelle erneute Blockierungen wiederholt zur Wiederherstellung
verwaister Ausführungen angenommen wird, speichert OpenClaw einen Wiederherstellungs-Tombstone für diese
Sitzung und setzt sie bei späteren Neustarts nicht mehr automatisch fort. Führen Sie
`openclaw tasks maintenance --apply` aus, um den Aufgabeneintrag abzugleichen, oder
`openclaw doctor --fix`, um veraltete Abbruchmarkierungen für die Wiederherstellung bei
Sitzungen mit Tombstone zu entfernen.

<Note>
Wenn das Starten eines Sub-Agenten mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Kopplungsstatus bearbeiten.
Interne `sessions_spawn`-Koordinierungsaufrufe werden prozessintern verarbeitet, wenn der
Aufrufer bereits im Kontext einer Gateway-Anfrage ausgeführt wird. Daher wird weder eine
Loopback-WebSocket-Verbindung geöffnet noch die grundlegende Berechtigung des gekoppelten CLI-Geräts
benötigt. Aufrufer außerhalb des Gateway-Prozesses verwenden weiterhin den WebSocket-
Fallback als `client.id: "gateway-client"` mit `client.mode: "backend"`
über direkte Loopback-Authentifizierung mittels gemeinsamem Token/Passwort. Remote-Aufrufer, explizite
`deviceIdentity`, explizite Geräte-Token-Pfade sowie Browser-/Node-Clients
benötigen für Berechtigungserweiterungen weiterhin die normale Gerätegenehmigung.
</Note>

## Beenden

- Das Senden von `/stop` im Chat des Anforderers bricht dessen Sitzung ab und beendet alle daraus gestarteten aktiven Sub-Agent-Ausführungen, einschließlich verschachtelter untergeordneter Ausführungen.

## Einschränkungen

- Die Ankündigung von Sub-Agenten erfolgt nach dem **Best-Effort-Prinzip**. Wenn das Gateway neu startet, gehen ausstehende Arbeiten zur Rückmeldung der Ankündigung verloren.
- Sub-Agenten nutzen weiterhin dieselben Ressourcen des Gateway-Prozesses gemeinsam; betrachten Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt `{ status: "accepted", runId, childSessionKey }` sofort zurück.
- Der Kontext eines Sub-Agenten fügt nur `AGENTS.md` und `TOOLS.md` ein (kein `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`). Codex-native Sub-Agenten folgen derselben Grenze: `TOOLS.md` verbleibt in den vererbten Codex-Thread-Anweisungen, während nur für den übergeordneten Agenten bestimmte Persona-, Identitäts- und Benutzerdateien als auf den jeweiligen Turn beschränkte Anweisungen zur Zusammenarbeit eingefügt werden, damit untergeordnete Agenten sie nicht klonen.
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1-5). Für die meisten Anwendungsfälle wird Tiefe 2 empfohlen.
- `maxChildrenPerAgent` begrenzt die aktiven untergeordneten Agenten pro Sitzung (Standard `5`, Bereich `1-20`).

## Verwandte Themen

- [Sitzungswerkzeuge und Statusänderungen](/de/concepts/session-tool)
- [ACP-Agenten](/de/tools/acp-agents)
- [Agentenversand](/de/tools/agent-send)
- [Hintergrundaufgaben](/de/automation/tasks)
- [Multi-Agent-Sandbox-Werkzeuge](/de/tools/multi-agent-sandbox-tools)
