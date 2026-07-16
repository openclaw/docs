---
read_when:
    - Sie möchten Hintergrund- oder parallele Arbeit über den Agenten ausführen lassen
    - Sie ändern die Richtlinie für `sessions_spawn` oder das Sub-Agent-Tool
    - Sie implementieren oder beheben Probleme bei Thread-gebundenen Subagent-Sitzungen
sidebarTitle: Sub-agents
summary: Starten Sie isolierte Agent-Läufe im Hintergrund, die ihre Ergebnisse im Chat des Anfragenden bekannt geben.
title: Unteragenten
x-i18n:
    generated_at: "2026-07-16T13:20:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agenten sind im Hintergrund ausgeführte Agentenläufe, die aus einem bestehenden Agentenlauf gestartet werden.
Jeder läuft in einer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**meldet** sein Ergebnis nach Abschluss an den anfordernden Chat-Kanal zurück.
Jeder Sub-Agent-Lauf wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Ziele:

- Recherche, langwierige Aufgaben und langsame Tool-Arbeit parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agenten standardmäßig isoliert halten (Sitzungstrennung, optionales Sandboxing).
- Die Tool-Oberfläche schwer missbrauchbar halten: Sub-Agenten erhalten standardmäßig **keine** Sitzungs- oder Nachrichten-Tools.
- Konfigurierbare Verschachtelungstiefe für Orchestrator-Muster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent hat standardmäßig einen eigenen Kontext und
Token-Verbrauch. Legen Sie für rechenintensive oder repetitive Aufgaben ein günstigeres Modell für Sub-Agenten fest
und verwenden Sie für Ihren Haupt-Agenten über
`agents.defaults.subagents.model` oder agentenspezifische Überschreibungen ein höherwertiges Modell. Wenn ein untergeordneter Agent
tatsächlich das aktuelle Transkript des Anforderers benötigt, starten Sie ihn mit
`context: "fork"`. Thread-gebundene Sub-Agent-Sitzungen verwenden standardmäßig
`context: "fork"`, da sie die aktuelle Unterhaltung in einen
Folge-Thread verzweigen.
</Note>

## Slash-Befehl

`/subagents` untersucht Sub-Agent-Läufe für die **aktuelle Sitzung**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` zeigt Laufmetadaten (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). `/subagents log` gibt die letzten Chat-Beiträge eines
Laufs aus; fügen Sie das Token `tools` hinzu, um Tool-Aufruf-/Ergebnismeldungen einzuschließen (standardmäßig
ausgelassen). Verwenden Sie `sessions_history` für eine begrenzte, sicherheitsgefilterte Rückschau
innerhalb eines Agentendurchlaufs oder prüfen Sie den Transkriptpfad auf dem Datenträger, um
das vollständige Rohtranskript einzusehen.

In der Control UI verfügen übergeordnete Sitzungen mit kürzlich ausgeführten untergeordneten Läufen über eine ausklappbare
Seitenleistenzeile. Die verschachtelten Zeilen zeigen Status und Laufzeit des untergeordneten Laufs an; durch Auswahl einer Zeile
wird der Chat dieses untergeordneten Laufs geöffnet, wobei die übergeordnete Hierarchie erhalten bleibt.

### Steuerelemente für die Thread-Bindung

Diese Befehle funktionieren in Kanälen mit dauerhaften Thread-Bindungen. Siehe
[Kanäle mit Thread-Unterstützung](#thread-supporting-channels) unten.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Startverhalten

Agenten starten Hintergrund-Sub-Agenten mit dem Tool `sessions_spawn`.
Abschlüsse werden als interne Ereignisse der übergeordneten Sitzung zurückgegeben; der übergeordnete/anfordernde
Agent entscheidet, ob eine für den Benutzer sichtbare Aktualisierung erforderlich ist.

<AccordionGroup>
  <Accordion title="Nicht blockierender, Push-basierter Abschluss">
    - `sessions_spawn` ist nicht blockierend und gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss meldet sich der Sub-Agent bei der übergeordneten/anfordernden Sitzung zurück.
    - Agentendurchläufe, die Ergebnisse untergeordneter Agenten benötigen, sollten nach dem Start der erforderlichen Arbeit `sessions_yield` aufrufen. Dadurch wird der aktuelle Durchlauf beendet und das Abschlussereignis kann als nächste für das Modell sichtbare Nachricht eintreffen.
    - Der Abschluss erfolgt Push-basiert. Rufen Sie nach dem Start **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife ab, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf zur Fehlerbehebung.
    - Die Ausgabe des untergeordneten Agenten ist ein Bericht/Nachweis, den der anfordernde Agent zusammenführen soll. Sie ist kein vom Benutzer verfasster Anweisungstext und kann System-, Entwickler- oder Benutzerrichtlinien nicht außer Kraft setzen.
    - Nach Abschluss schließt OpenClaw nach bestem Bemühen die von dieser Sub-Agent-Sitzung geöffneten und nachverfolgten Browser-Tabs/-Prozesse, bevor der Bereinigungsablauf der Meldung fortgesetzt wird.

  </Accordion>
  <Accordion title="Zustellung des Abschlusses">
    - OpenClaw übergibt Abschlüsse über einen `agent`-Durchlauf mit einem stabilen Idempotenzschlüssel an die anfordernde Sitzung zurück.
    - Wenn der anfordernde Lauf noch aktiv ist, versucht OpenClaw zunächst, diesen Lauf zu wecken/zu steuern, anstatt einen zweiten sichtbaren Antwortpfad zu starten.
    - Wenn ein aktiver Anforderer nicht geweckt werden kann, greift OpenClaw auf eine Übergabe an den anfordernden Agenten mit demselben Abschlusskontext zurück, anstatt die Meldung zu verwerfen.
    - Eine erfolgreiche Übergabe an den übergeordneten Agenten schließt die Zustellung des Sub-Agenten auch dann ab, wenn der übergeordnete Agent entscheidet, dass keine sichtbare Benutzeraktualisierung erforderlich ist.
    - Native Sub-Agenten erhalten das Nachrichten-Tool nicht. Sie geben einfachen Assistententext an den übergeordneten/anfordernden Agenten zurück; für Menschen sichtbare Antworten bleiben der normalen Zustellungsrichtlinie des übergeordneten/anfordernden Agenten unterstellt.
    - Wenn eine direkte Übergabe nicht verwendet werden kann, greift die Zustellung auf Warteschlangen-Routing und anschließend auf einen kurzen Wiederholungsversuch der Meldung mit exponentiellem Backoff zurück, bevor sie endgültig aufgegeben wird.
    - Die Zustellung behält die aufgelöste Route des Anforderers bei: Thread- oder unterhaltungsgebundene Abschlussrouten haben Vorrang, sofern verfügbar. Wenn der Abschlussursprung nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel/Konto aus der aufgelösten Route der anfordernden Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), damit die direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Abschlussübergabe">
    Die Abschlussübergabe an die anfordernde Sitzung ist ein zur Laufzeit erzeugter
    interner Kontext (kein vom Benutzer verfasster Text) und umfasst:

    - `Result` — den neuesten sichtbaren `assistant`-Antworttext des untergeordneten Agenten. Tool-/toolResult-Ausgaben werden nicht in Ergebnisse des untergeordneten Agenten übernommen. Endgültig fehlgeschlagene Läufe verwenden keinen erfassten Antworttext erneut.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Token-Statistiken.
    - Eine Prüfanweisung, die den anfordernden Agenten auffordert, das Ergebnis zu überprüfen, bevor er entscheidet, ob die ursprüngliche Aufgabe abgeschlossen ist.
    - Eine Folgeanweisung, die den anfordernden Agenten auffordert, die Aufgabe fortzusetzen oder eine Folgeaufgabe zu erfassen, wenn das Ergebnis des untergeordneten Agenten weitere Maßnahmen erfordert.
    - Eine Anweisung zur abschließenden Aktualisierung für den Fall, dass keine weiteren Maßnahmen erforderlich sind, verfasst in normaler Assistentensprache, ohne rohe interne Metadaten weiterzuleiten.

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben die Standardwerte für diesen spezifischen Lauf.
    - Verwenden Sie `info`/`log`, um nach Abschluss Details und Ausgabe zu prüfen.
    - Verwenden Sie für dauerhafte Thread-gebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Wenn der anfordernde Kanal keine Thread-Bindungen unterstützt, verwenden Sie `mode: "run"`, anstatt eine unmögliche Thread-gebundene Kombination erneut zu versuchen.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder explizites Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit angibt. Siehe [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model) bei der Fehlerbehebung von Abschlüssen oder Agent-zu-Agent-Schleifen. Wenn das Plugin `codex` aktiviert ist, sollte die Codex-Chat-/Thread-Steuerung `/codex ...` gegenüber ACP bevorzugen, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht in einer Sandbox ausgeführt wird und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen `agents.list[]`-Eintrag mit `runtime.type="acp"`; verwenden Sie für normale OpenClaw-Konfigurationsagenten aus `agents_list` die standardmäßige Sub-Agent-Laufzeit.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agenten starten isoliert, sofern der Aufrufer nicht ausdrücklich die Verzweigung
des aktuellen Transkripts anfordert.

| Modus       | Verwendungszweck                                                                                                                         | Verhalten                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Neue Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext beschrieben werden kann                           | Erstellt ein sauberes Transkript für den untergeordneten Agenten. Dies ist die Standardeinstellung und hält den Token-Verbrauch niedriger.  |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, vorherigen Tool-Ergebnissen oder differenzierten Anweisungen abhängt, die bereits im Transkript des Anforderers enthalten sind | Verzweigt das Transkript des Anforderers in die Sitzung des untergeordneten Agenten, bevor dieser startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegation gedacht und kein
Ersatz für eine klare Aufgabenbeschreibung.

## Tool: `sessions_spawn`

Startet einen Sub-Agent-Lauf mit `deliver: false` auf der globalen `subagent`-Lane,
führt anschließend einen Meldungsschritt aus und veröffentlicht die Meldungsantwort im anfordernden
Chat-Kanal.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab. Das integrierte
Profil `coding` enthält `sessions_spawn`; `messaging` und `minimal` dagegen
nicht. `full` erlaubt jedes Tool. Fügen Sie `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für
Agenten mit einem enger gefassten Profil, die dennoch Arbeit delegieren sollen.
Kanal-/Gruppen-, Provider-, Sandbox- und agentenspezifische Zulassungs-/Verweigerungsrichtlinien können
das Tool auch nach der Profilphase entfernen. Verwenden Sie `/tools` aus derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** Native Sub-Agenten übernehmen das Modell des Aufrufers, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen. Starts über die ACP-Laufzeit verwenden dasselbe konfigurierte Sub-Agent-Modell, sofern vorhanden; andernfalls behält das ACP-Harness seinen eigenen Standard bei. Ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Denken:** Native Sub-Agenten übernehmen die Einstellung des Aufrufers, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen. Starts über die ACP-Laufzeit wenden außerdem `agents.defaults.models["provider/model"].params.thinking` auf das ausgewählte Modell an. Ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Laufzeitlimit:** OpenClaw verwendet `agents.defaults.subagents.runTimeoutSeconds`, wenn es festgelegt ist; andernfalls wird auf `0` zurückgegriffen (kein Zeitlimit). `sessions_spawn` akzeptiert keine aufrufspezifischen Zeitlimitüberschreibungen.
- **Aufgabenzustellung:** Native Sub-Agenten erhalten die delegierte Aufgabe in ihrer ersten sichtbaren `[Subagent Task]`-Nachricht. Der System-Prompt des Sub-Agenten enthält Laufzeitregeln und Routing-Kontext, kein verborgenes Duplikat der Aufgabe.

Akzeptierte Starts nativer Sub-Agenten enthalten die aufgelösten Modellmetadaten des untergeordneten Agenten
im Tool-Ergebnis: `resolvedModel` enthält die angewendete Modellreferenz und
`resolvedProvider` enthält das Provider-Präfix, sofern die Referenz eines besitzt.

### Modus des Delegierungs-Prompts

`agents.defaults.subagents.delegationMode` steuert nur die Prompt-Anleitung; es ändert weder die Tool-Richtlinie noch erzwingt es eine Delegation.

- `suggest` (Standard): Behält den standardmäßigen Prompt-Hinweis bei, Sub-Agenten für umfangreichere oder langsamere Arbeit zu verwenden.
- `prefer`: Weist den Haupt-Agenten an, reaktionsfähig zu bleiben und alles, was über eine direkte Antwort hinausgeht, über `sessions_spawn` zu delegieren.

Agentenspezifische Überschreibung: `agents.list[].subagents.delegationMode`.

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
  Die Aufgabenbeschreibung für den Unteragenten.
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
  Optionales Arbeitsverzeichnis für die Aufgabe des untergeordneten Laufs. Native Unteragenten laden Bootstrap-Dateien weiterhin aus dem Arbeitsbereich des Zielagenten; `cwd` ändert lediglich, wo Laufzeitwerkzeuge und CLI-Harnesses die delegierte Arbeit ausführen.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist ausschließlich für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) sowie für `agents.list[]`-Einträge vorgesehen, deren `runtime.type` `acp` ist.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"`; wird beim Start nativer Unteragenten ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die übergeordnete Sitzung, wenn `runtime: "acp"`; beim Start nativer Unteragenten weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Modell des Unteragenten. Ungültige Werte werden übersprungen, und der Unteragent wird mit dem Standardmodell ausgeführt; das Werkzeugergebnis enthält eine Warnung.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt die Denkstufe für den Lauf des Unteragenten.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wenn `true`, wird eine Bindung an einen Kanal-Thread für diese Unteragentensitzung angefordert.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` und `mode` weggelassen wird, wird `session` zum Standardwert. `mode: "session"` erfordert `thread: true`.
  Wenn für den Kanal des Anforderers keine Thread-Bindung verfügbar ist, verwenden Sie stattdessen `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert die Sitzung unmittelbar nach der Ankündigung (das Transkript bleibt durch Umbenennung erhalten).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Start ab, sofern die Ziel-Laufzeit des untergeordneten Agenten nicht in einer Sandbox ausgeführt wird.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die untergeordnete Sitzung. Nur für native Unteragenten. Thread-gebundene Starts verwenden standardmäßig `fork`; Starts ohne Thread verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Parameter für die Kanalauslieferung (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Native Unteragenten melden
ihren neuesten Assistentenbeitrag an den Anforderer zurück; die externe Auslieferung verbleibt beim
übergeordneten/anfordernden Agenten.
</Warning>

### Aufgabennamen und Zielauswahl

`taskName` ist ein modellseitiger Bezeichner für die Orchestrierung, kein Sitzungsschlüssel.
Verwenden Sie ihn für stabile Namen untergeordneter Agenten wie `review_subagents`,
`linux_validation` oder `docs_update`, wenn ein Koordinator diesen untergeordneten Agenten
später möglicherweise prüfen muss.

Die Zielauflösung akzeptiert exakte Übereinstimmungen mit `taskName` und eindeutige
Präfixe. Der Abgleich ist auf dasselbe Fenster aktiver/kürzlich verwendeter Ziele beschränkt,
das auch für nummerierte `/subagents`-Ziele verwendet wird. Daher führt ein veralteter, abgeschlossener untergeordneter Agent nicht dazu,
dass ein wiederverwendeter Bezeichner mehrdeutig wird. Wenn zwei aktive oder kürzlich verwendete untergeordnete Agenten denselben
`taskName` haben, ist das Ziel mehrdeutig; verwenden Sie stattdessen den Listenindex, den Sitzungsschlüssel oder
die Lauf-ID.

Die reservierten Ziele `last` und `all` sind keine gültigen Werte für `taskName`,
da sie bereits Steuerungsbedeutungen haben.

## Werkzeug: `sessions_yield`

Beendet den aktuellen Modellbeitrag und wartet darauf, dass Laufzeitereignisse, hauptsächlich
Abschlussereignisse von Unteragenten, als nächste Nachricht eintreffen. Verwenden Sie es nach
dem Start erforderlicher untergeordneter Aufgaben, wenn der Anforderer erst nach deren Abschluss
eine endgültige Antwort erstellen kann.

`sessions_yield` ist die primitive Warteoperation. Ersetzen Sie sie nicht durch Abfrageschleifen
über `subagents`, `sessions_list`, `sessions_history`, Shell-
`sleep` oder Prozessabfragen, nur um den Abschluss eines untergeordneten Agenten zu erkennen.

Verwenden Sie `sessions_yield` nur, wenn die effektive Werkzeugliste der Sitzung
es enthält. Einige minimale oder benutzerdefinierte Werkzeugprofile stellen möglicherweise `sessions_spawn` und
`subagents` bereit, ohne `sessions_yield` bereitzustellen; erfinden Sie in diesem Fall keine
Abfrageschleife, nur um auf den Abschluss zu warten.

Wenn aktive untergeordnete Agenten vorhanden sind, fügt OpenClaw normalen Beiträgen einen kompakten, zur Laufzeit generierten
`Active Subagents`-Promptblock hinzu, damit der Anforderer
die aktuellen untergeordneten Sitzungen, Lauf-IDs, Statuswerte, Bezeichnungen, Aufgaben und
`taskName`-Aliasse ohne Abfragen sehen kann. Die Aufgaben- und Bezeichnungsfelder in diesem
Block werden als Daten und nicht als Anweisungen in Anführungszeichen gesetzt, da sie aus vom Benutzer/Modell bereitgestellten Startargumenten
stammen können.

## Werkzeug: `subagents`

Listet gestartete Unteragentenläufe auf, die der anfordernden Sitzung gehören. Der Gültigkeitsbereich ist
auf den aktuellen Anforderer beschränkt; ein untergeordneter Agent kann nur seine eigenen kontrollierten untergeordneten Agenten sehen.

Verwenden Sie `subagents` für bedarfsgesteuerte Statusabfragen und Fehlerdiagnosen. Verwenden Sie `sessions_yield`, um
auf Abschlussereignisse zu warten.

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Unteragent an einen
Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread weiterhin an dieselbe
Unteragentensitzung weitergeleitet werden.

### Kanäle mit Thread-Unterstützung

Ein Kanal unterstützt dauerhafte Thread-gebundene Unteragentensitzungen
(`sessions_spawn` mit `thread: true`), wenn er einen Adapter für Konversationsbindungen
registriert. Mitgelieferte Kanäle mit dieser Unterstützung: **Discord**,
**iMessage**, **Matrix** und **Telegram**. Discord und Matrix erstellen standardmäßig
einen untergeordneten Thread; Telegram und iMessage binden standardmäßig die
aktuelle Konversation. Verwenden Sie die kanalspezifischen `threadBindings`-Konfigurationsschlüssel für
Aktivierung, Zeitüberschreitungen und `spawnSessions`.

### Schnellablauf

<Steps>
  <Step title="Starten">
    `sessions_spawn` mit `thread: true` (und optional `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw erstellt einen Thread oder bindet einen Thread im aktiven Kanal an dieses Sitzungsziel.
  </Step>
  <Step title="Folgenachrichten weiterleiten">
    Antworten und Folgenachrichten in diesem Thread werden an die gebundene Sitzung weitergeleitet.
  </Step>
  <Step title="Zeitüberschreitungen prüfen">
    Verwenden Sie `/session idle`, um das automatische Aufheben des Fokus bei Inaktivität zu prüfen/aktualisieren, und
    `/session max-age`, um die absolute Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um die Bindung manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerung

| Befehl            | Wirkung                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread an ein Unteragenten-/Sitzungsziel (oder erstellt einen Thread)                     |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                                           |
| `/agents`          | Listet aktive Läufe und den Bindungsstatus auf (`binding:<id>`, `unbound` oder `bindings unavailable`) |
| `/session idle`    | Prüft/aktualisiert das automatische Aufheben des Fokus bei Inaktivität (nur fokussierte gebundene Threads)                             |
| `/session max-age` | Prüft/aktualisiert die absolute Obergrenze (nur fokussierte gebundene Threads)                                      |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanalspezifische Überschreibungs- und Schlüssel für automatische Bindung beim Start** sind adapterspezifisch. Weitere Informationen finden Sie oben unter [Kanäle mit Thread-Unterstützung](#thread-supporting-channels).

Aktuelle Adapterdetails finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference) und unter
[Slash-Befehle](/de/tools/slash-commands).

### Zulassungsliste

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste konfigurierter Agenten-IDs, die über explizites `agentId` als Ziel verwendet werden können (`["*"]` erlaubt jedes konfigurierte Ziel). Standard: nur der anfordernde Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Anforderer sich selbst mit `agentId` startet, nehmen Sie die ID des Anforderers in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standardmäßige Zulassungsliste konfigurierter Zielagenten, die verwendet wird, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` auslassen (erzwingt die explizite Profilauswahl). Agentenspezifische Überschreibung: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Aufrufbezogene Zeitüberschreitung für Zustellversuche von Gateway-`agent`-Ankündigungen. Werte sind positive ganzzahlige Millisekundenwerte und werden auf das plattformsichere Timermaximum begrenzt. Vorübergehende Wiederholungsversuche können dazu führen, dass die gesamte Wartezeit für die Ankündigung länger als eine konfigurierte Zeitüberschreitung ist.
</ParamField>

Wenn die anfordernde Sitzung in einer Sandbox ausgeführt wird, lehnt `sessions_spawn` Ziele ab,
die ohne Sandbox ausgeführt würden.

### Erkennung

Verwenden Sie `agents_list`, um zu sehen, welche Agenten-IDs derzeit für
`sessions_spawn` zulässig sind. Die Antwort enthält das effektive
Modell jedes aufgeführten Agenten und eingebettete Laufzeitmetadaten, damit Aufrufer zwischen OpenClaw, dem Codex-
App-Server und anderen konfigurierten nativen Laufzeiten unterscheiden können.

`allowAgents`-Einträge müssen auf konfigurierte Agenten-IDs in `agents.list[]` verweisen.
`["*"]` bedeutet jeden konfigurierten Zielagenten sowie den Anforderer. Wenn eine Agentenkonfiguration
gelöscht wird, ihre ID aber in `allowAgents` verbleibt, lehnt `sessions_spawn` diese ID ab,
und `agents_list` lässt sie aus. Führen Sie `openclaw doctor --fix` aus, um veraltete
Einträge der Zulassungsliste zu bereinigen, oder fügen Sie einen minimalen `agents.list[]`-Eintrag hinzu, wenn das Ziel
weiterhin startbar bleiben und dabei Standardwerte übernehmen soll.

### Automatische Archivierung

- Unteragentensitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` (standardmäßig `60`) automatisch archiviert.
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (derselbe Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (das Transkript bleibt durch Umbenennung erhalten).
- Die automatische Archivierung erfolgt nach bestem Bemühen; ausstehende Timer gehen verloren, wenn das Gateway neu gestartet wird.
- Konfigurierte Laufzeitüberschreitungen führen **nicht** zur automatischen Archivierung; sie stoppen lediglich den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung erhalten.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und 2.
- Die Browserbereinigung ist von der Archivbereinigung getrennt: Nachverfolgte Browser-Tabs/-Prozesse werden nach bestem Bemühen geschlossen, wenn der Lauf endet, auch wenn das Transkript/der Sitzungseintrag erhalten bleibt.

## Verschachtelte Unteragenten

Standardmäßig können Unteragenten keine eigenen Unteragenten starten
(`maxSpawnDepth: 1`). Setzen Sie `maxSpawnDepth: 2`, um eine Verschachtelungsebene zu
aktivieren – das **Orchestrator-Muster**: Hauptagent → Orchestrator-Unteragent →
Unter-Unteragenten als Worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // Unteragenten dürfen untergeordnete Agenten starten (Standard: 1, Bereich 1-5)
        maxChildrenPerAgent: 5, // maximale Anzahl aktiver untergeordneter Agenten pro Agentensitzung (Standard: 5, Bereich 1-20)
        maxConcurrent: 8, // globale Obergrenze der Parallelitätsspur (Standard: 8)
        runTimeoutSeconds: 900, // Standardzeitüberschreitung für sessions_spawn (0 = keine Zeitüberschreitung)
        announceTimeoutMs: 120000, // aufrufbezogene Zeitüberschreitung für Gateway-Ankündigungen
      },
    },
  },
}
```

### Tiefenebenen

| Tiefe | Form des Sitzungsschlüssels                 | Rolle                                                     | Kann Unteragenten starten?     |
| ----- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------ |
| 0     | `agent:<id>:main`                           | Hauptagent                                                | Immer                          |
| 1     | `agent:<id>:subagent:<uuid>`                           | Unteragent (Orchestrator, wenn Tiefe 2 zulässig ist)      | Nur wenn `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>`                           | Unter-Unteragent (ausführender Endknoten)                 | Nie                            |

### Ankündigungskette

Ergebnisse fließen die Kette wieder hinauf:

1. Der Worker auf Tiefe 2 wird fertig → kündigt dies seinem übergeordneten Orchestrator auf Tiefe 1 an.
2. Der Orchestrator auf Tiefe 1 erhält die Ankündigung, führt die Ergebnisse zusammen und wird fertig → kündigt dies dem Hauptagenten an.
3. Der Hauptagent erhält die Ankündigung und übermittelt sie an den Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten untergeordneten Agenten.

<Note>
**Betriebshinweis:** Starten Sie untergeordnete Aufgaben einmalig und warten Sie auf Abschlussereignisse,
anstatt Abfrageschleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Schlafbefehle zu bauen.
`sessions_list` und `/subagents list` beschränken Beziehungen zu untergeordneten Sitzungen
auf aktive Arbeit — aktive untergeordnete Agenten bleiben verknüpft, beendete untergeordnete Agenten bleiben
für ein kurzes aktuelles Zeitfenster sichtbar und veraltete, nur im Speicher vorhandene Verknüpfungen zu untergeordneten Agenten
werden nach Ablauf ihres Aktualitätsfensters ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`- /
`parentSessionKey`-Metadaten nach einem
Neustart Phantomagenten wiederherstellen. Wenn ein Abschlussereignis eines untergeordneten Agenten eintrifft, nachdem Sie bereits die
endgültige Antwort gesendet haben, ist die korrekte Folgeaktion exakt das stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Tool-Richtlinie nach Tiefe

- Rolle und Steuerungsumfang werden beim Startzeitpunkt in die Sitzungsmetadaten geschrieben. Dadurch erhalten flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich erneut Orchestratorberechtigungen.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er untergeordnete Agenten starten und deren Status prüfen kann. Andere Sitzungs-/Systemtools bleiben verweigert.
- **Tiefe 1 (Endknoten, wenn `maxSpawnDepth == 1`):** keine Sitzungstools (aktuelles Standardverhalten).
- **Tiefe 2 (ausführender Endknoten):** keine Sitzungstools — `sessions_spawn` wird auf Tiefe 2 immer verweigert. Kann keine weiteren untergeordneten Agenten starten.

### Startlimit pro Agent

Jede Agentensitzung (auf jeder Tiefe) kann gleichzeitig höchstens `maxChildrenPerAgent`
(standardmäßig `5`) aktive untergeordnete Agenten haben. Dies verhindert eine unkontrollierte Auffächerung
durch einen einzelnen Orchestrator.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators auf Tiefe 1 stoppt automatisch alle seine untergeordneten Agenten
auf Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agenten auf Tiefe 1 und kaskadiert zu deren untergeordneten Agenten auf Tiefe 2.

## Authentifizierung

Die Authentifizierung von Unteragenten wird anhand der **Agenten-ID** aufgelöst, nicht anhand des Sitzungstyps:

- Der Sitzungsschlüssel des Unteragenten lautet `agent:<agentId>:subagent:<uuid>`.
- Der Authentifizierungsspeicher wird aus `agentDir` dieses Agenten geladen.
- Die Authentifizierungsprofile des Hauptagenten werden als **Fallback** zusammengeführt; bei Konflikten haben die Agentenprofile Vorrang vor den Hauptprofilen.

Die Zusammenführung ist additiv, sodass Hauptprofile immer als
Fallbacks verfügbar sind. Eine vollständig isolierte Authentifizierung pro Agent wird noch nicht unterstützt.

## Ankündigung

Unteragenten melden sich über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt wird innerhalb der Sitzung des Unteragenten ausgeführt (nicht in der Sitzung des Anforderers).
- Wenn der Unteragent exakt mit `ANNOUNCE_SKIP` antwortet, wird nichts veröffentlicht.
- Wenn der neueste Assistententext exakt dem stillen Token `NO_REPLY` / `no_reply` entspricht, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Tiefe des Anforderers ab:

- Anforderersitzungen auf oberster Ebene verwenden einen nachfolgenden `agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte Unteragentensitzungen des Anforderers erhalten eine interne Folgeeinspeisung (`deliver=false`), damit der Orchestrator die Ergebnisse der untergeordneten Agenten innerhalb der Sitzung zusammenführen kann.
- Wenn eine verschachtelte Unteragentensitzung des Anforderers nicht mehr vorhanden ist, fällt OpenClaw auf den Anforderer dieser Sitzung zurück, sofern verfügbar.

Bei Anforderersitzungen auf oberster Ebene löst die direkte Zustellung im Abschlussmodus zuerst
eine gebundene Konversations-/Thread-Route und eine Hook-Überschreibung auf und ergänzt anschließend
fehlende Kanal-Zielfelder aus der gespeicherten Route der Anforderersitzung.
Dadurch bleiben Abschlüsse im richtigen Chat/Thema, selbst wenn der Ursprung des Abschlusses
nur den Kanal identifiziert.

Die Aggregation der Abschlüsse untergeordneter Agenten ist beim Erstellen verschachtelter Abschlussbefunde
auf den aktuellen Lauf des Anforderers beschränkt. Dadurch wird verhindert, dass veraltete Ausgaben untergeordneter Agenten aus früheren Läufen
in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten
die Thread-/Themenweiterleitung bei, sofern diese in Kanaladaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird zu einem stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                       |
| Sitzungs-IDs   | Sitzungsschlüssel/-ID des untergeordneten Agenten                                                                |
| Typ            | Ankündigungstyp + Aufgabenbezeichnung                                                                            |
| Status         | Aus dem Laufzeitergebnis abgeleitet (`ok`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistententext des untergeordneten Agenten                                                  |
| Folgeaktion    | Anweisung, die beschreibt, wann geantwortet bzw. still geblieben werden soll                                     |

Fehlgeschlagene beendete Läufe melden den Fehlerstatus, ohne erfassten
Antworttext erneut auszugeben. Tool-/ToolResult-Ausgaben werden nicht zum Ergebnistext des untergeordneten Agenten hochgestuft.

### Statistikzeile

Ankündigungsnutzlasten enthalten am Ende eine Statistikzeile (auch bei Umbruch):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/gesamt).
- Geschätzte Kosten, wenn Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Hauptagent den Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann.

Interne Metadaten sind ausschließlich für die Orchestrierung bestimmt; benutzerseitige Antworten
sollten in normaler Assistentensprache neu formuliert werden.

### Warum `sessions_history` bevorzugen?

`sessions_history` ist der sicherere Orchestrierungspfad zum Lesen des
Transkripts eines untergeordneten Agenten innerhalb eines Agentendurchlaufs:

- Schwärzt Text, der Anmeldedaten oder Tokens ähnelt, selbst wenn die allgemeine Protokollschwärzung deaktiviert ist.
- Kürzt lange Textblöcke (4000 Zeichen pro Block) und entfernt Denksignaturen, Nutzlasten zur Wiedergabe von Schlussfolgerungen und eingebettete Bilddaten.
- Erzwingt eine Antwortobergrenze von 80 KB; übergroße Zeilen werden durch `[sessions_history omitted: message too large]` ersetzt.
- Verwenden Sie `nextOffset`, sofern vorhanden, um rückwärts durch ältere Transkriptfenster zu blättern.
- `sessions_history` entfernt **keine** Schlussfolgerungs-Tags, `<relevant-memories>`-Gerüststrukturen oder Tool-Aufruf-XML aus Nachrichtentexten — es gibt strukturierte Inhaltsblöcke zurück, die der Rohform des Transkripts nahekommen und lediglich geschwärzt sowie größenbegrenzt sind. `/subagents log` wendet die stärkere Prosa-Bereinigung an (entfernt Schlussfolgerungs-Tags, Speichergerüste und Tool-Aufruf-XML), da es einfache Chatzeilen statt strukturierter Blöcke darstellt.
- Die direkte Prüfung des Transkripts auf dem Datenträger ist der Fallback, wenn Sie das vollständige bytegenaue Transkript benötigen.

## Tool-Richtlinie

Unteragenten verwenden zunächst dieselbe Profil- und Tool-Richtlinien-Pipeline wie der übergeordnete oder
der Zielagent. Danach wendet OpenClaw die Beschränkungsebene für Unteragenten an.

Unteragenten verlieren unabhängig von Tiefe oder Rolle immer `gateway`, `agents_list`, `session_status` und
`cron` (Tools auf Systemebene/interaktive Tools oder
Tools, die der Hauptagent koordinieren sollte). Unteragenten als Endknoten (standardmäßiges Verhalten auf Tiefe 1
und immer auf Tiefe 2) verlieren zusätzlich `subagents`,
`sessions_list`, `sessions_history` und `sessions_spawn`. Unteragenten erhalten niemals
das Tool `message` — es wird beim Startzeitpunkt deaktiviert und nicht durch
diese Verweigerungsliste gefiltert — und `sessions_send` bleibt verweigert, damit Unteragenten
ausschließlich über die Ankündigungskette kommunizieren.

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Erinnerungsansicht —
es handelt sich nicht um einen Rohdump des Transkripts.

Wenn `maxSpawnDepth >= 2`, erhalten Orchestrator-Unteragenten auf Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und
`sessions_history`, damit sie ihre untergeordneten Agenten verwalten können.

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
        // Verweigerung hat Vorrang
        deny: ["gateway", "cron"],
        // wenn allow gesetzt ist, wird nur Erlaubtes zugelassen (Verweigerung hat weiterhin Vorrang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` ist ein abschließender Filter, der nur Erlaubtes zulässt. Er kann
die bereits aufgelöste Tool-Menge einschränken, aber kein durch
`tools.profile` entferntes Tool **wieder hinzufügen**. Beispielsweise enthält `tools.profile: "coding"`
`web_search`/`web_fetch`, aber nicht das Tool `browser`. Damit
Unteragenten mit Coding-Profil Browserautomatisierung verwenden können, fügen Sie den Browser in der
Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie `agents.list[].tools.alsoAllow: ["browser"]` pro Agent, wenn nur ein
Agent Browserautomatisierung erhalten soll.

## Parallelität

Unteragenten verwenden eine dedizierte prozessinterne Warteschlangenspur:

- **Spurname:** `subagent`
- **Parallelität:** `agents.defaults.subagents.maxConcurrent` (standardmäßig `8`)

## Verfügbarkeit und Wiederherstellung

OpenClaw betrachtet das Fehlen von `endedAt` nicht als dauerhaften Beweis dafür, dass ein
Unteragent noch aktiv ist. Nicht beendete Läufe, die älter als das Zeitfenster für veraltete Läufe sind
(2 Stunden oder das konfigurierte Laufzeitlimit zuzüglich einer kurzen Kulanzfrist,
je nachdem, was länger ist), werden in `/subagents list`,
Statuszusammenfassungen, der Abschlussblockierung für Nachkommen und den Parallelitätsprüfungen
pro Sitzung nicht mehr als aktiv/ausstehend gezählt.

Nach einem Gateway-Neustart werden veraltete, nicht beendete wiederhergestellte Läufe entfernt, sofern
ihre untergeordnete Sitzung nicht als `abortedLastRun: true` markiert ist. Durch einen Neustart abgebrochene
Läufe bleiben für den Wiederherstellungsablauf verwaister Unteragenten registriert: Veraltete
Läufe werden ohne Fortsetzung abgeschlossen, während aktuelle untergeordnete Sitzungen
eine synthetische Fortsetzungsnachricht erhalten, bevor die Abbruchmarkierung gelöscht wird.

Die automatische Wiederherstellung nach einem Neustart ist pro untergeordneter Sitzung begrenzt. Wenn derselbe
Unteragent innerhalb des Zeitfensters für eine schnelle erneute Blockierung wiederholt für die Wiederherstellung verwaister Agenten
akzeptiert wird, speichert OpenClaw einen Wiederherstellungs-Tombstone in dieser
Sitzung und beendet die automatische Fortsetzung bei späteren Neustarts. Führen Sie
`openclaw tasks maintenance --apply` aus, um den Aufgabendatensatz abzugleichen, oder
`openclaw doctor --fix`, um veraltete Abbruchmarkierungen für die Wiederherstellung in
Sitzungen mit Tombstone zu löschen.

<Note>
Wenn das Starten eines Sub-Agenten mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Kopplungsstatus bearbeiten.
Die interne `sessions_spawn`-Koordination führt den Dispatch prozessintern aus, wenn der
Aufrufer bereits im Kontext der Gateway-Anfrage ausgeführt wird. Daher öffnet sie
keinen Loopback-WebSocket und hängt nicht von der Bereichsbasislinie für gekoppelte Geräte
der CLI ab. Aufrufer außerhalb des Gateway-Prozesses verwenden weiterhin den WebSocket-
Fallback als `client.id: "gateway-client"` mit `client.mode: "backend"`
über direkte Loopback-Authentifizierung mittels gemeinsamem Token/Passwort. Remote-Aufrufer, explizite
`deviceIdentity`, explizite Geräte-Token-Pfade sowie Browser-/Node-Clients
benötigen für Bereichserweiterungen weiterhin die normale Gerätegenehmigung.
</Note>

## Stoppen

- Das Senden von `/stop` im Chat des Anforderers bricht dessen Sitzung ab und stoppt alle aktiven, von ihr gestarteten Sub-Agent-Läufe, einschließlich verschachtelter untergeordneter Läufe.

## Einschränkungen

- Die Ankündigung durch Sub-Agenten erfolgt nach dem **Best-Effort-Prinzip**. Bei einem Neustart des Gateways gehen ausstehende „announce back“-Aufgaben verloren.
- Sub-Agenten nutzen weiterhin dieselben Ressourcen des Gateway-Prozesses gemeinsam; behandeln Sie `maxConcurrent` als Sicherheitsventil.
- `sessions_spawn` ist immer nicht blockierend: Es gibt `{ status: "accepted", runId, childSessionKey }` sofort zurück.
- Der Kontext eines Sub-Agenten fügt nur `AGENTS.md` und `TOOLS.md` ein (keine `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`). Codex-native Sub-Agenten folgen derselben Grenze: `TOOLS.md` verbleibt in den geerbten Codex-Thread-Anweisungen, während ausschließlich für den übergeordneten Agenten bestimmte Persona-, Identitäts- und Benutzerdateien als rundenbezogene Anweisungen zur Zusammenarbeit eingefügt werden, damit untergeordnete Agenten sie nicht klonen.
- Die maximale Verschachtelungstiefe beträgt 5 (Bereich für `maxSpawnDepth`: 1-5). Für die meisten Anwendungsfälle wird Tiefe 2 empfohlen.
- `maxChildrenPerAgent` begrenzt die aktiven untergeordneten Agenten pro Sitzung (Standardwert `5`, Bereich `1-20`).

## Verwandte Themen

- [Sitzungswerkzeuge und Statusänderungen](/de/concepts/session-tool)
- [ACP-Agenten](/de/tools/acp-agents)
- [Agentenversand](/de/tools/agent-send)
- [Hintergrundaufgaben](/de/automation/tasks)
- [Multi-Agent-Sandbox-Werkzeuge](/de/tools/multi-agent-sandbox-tools)
