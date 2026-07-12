---
read_when:
    - Sie möchten Hintergrund- oder Parallelarbeit über den Agenten ausführen.
    - Sie ändern die Richtlinie für `sessions_spawn` oder das Subagenten-Tool
    - Sie implementieren Thread-gebundene Subagent-Sitzungen oder beheben dabei Probleme
sidebarTitle: Sub-agents
summary: Starten Sie isolierte Agent-Ausführungen im Hintergrund, die die Ergebnisse im Chat des Anfragenden bekannt geben.
title: Unteragenten
x-i18n:
    generated_at: "2026-07-12T16:00:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

Sub-Agenten sind im Hintergrund ausgeführte Agentenläufe, die aus einem bestehenden Agentenlauf gestartet werden.
Jeder läuft in einer eigenen Sitzung (`agent:<agentId>:subagent:<uuid>`) und
**meldet** sein Ergebnis nach Abschluss an den anfordernden Chatkanal zurück.
Jeder Sub-Agentenlauf wird als [Hintergrundaufgabe](/de/automation/tasks) nachverfolgt.

Ziele:

- Recherche, langwierige Aufgaben und langsame Tool-Arbeit parallelisieren, ohne den Hauptlauf zu blockieren.
- Sub-Agenten standardmäßig isoliert halten (getrennte Sitzungen, optionales Sandboxing).
- Die Tool-Oberfläche vor Fehlbedienung schützen: Sub-Agenten erhalten standardmäßig **keine** Sitzungs- oder Nachrichten-Tools.
- Konfigurierbare Verschachtelungstiefen für Orchestrierungsmuster unterstützen.

<Note>
**Kostenhinweis:** Jeder Sub-Agent verfügt standardmäßig über einen eigenen
Kontext und Tokenverbrauch. Legen Sie für aufwendige oder sich wiederholende Aufgaben
ein günstigeres Modell für Sub-Agenten fest und verwenden Sie für Ihren Hauptagenten
über `agents.defaults.subagents.model` oder agentenspezifische Überschreibungen ein
höherwertiges Modell. Wenn ein untergeordneter Agent tatsächlich das aktuelle Transkript
des Anforderers benötigt, starten Sie ihn mit `context: "fork"`. Threadgebundene
Sub-Agentensitzungen verwenden standardmäßig `context: "fork"`, da sie die aktuelle
Unterhaltung in einen Folgethread verzweigen.
</Note>

## Slash-Befehl

`/subagents` prüft Sub-Agentenläufe für die **aktuelle Sitzung**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` zeigt Metadaten des Laufs (Status, Zeitstempel, Sitzungs-ID,
Transkriptpfad, Bereinigung). `/subagents log` gibt die letzten Chatbeiträge eines
Laufs aus; fügen Sie das Token `tools` hinzu, um Tool-Aufruf-/Ergebnismeldungen
einzubeziehen (standardmäßig ausgelassen). Verwenden Sie `sessions_history` für
eine begrenzte, sicherheitsgefilterte Verlaufsansicht innerhalb eines Agentendurchlaufs
oder prüfen Sie den Transkriptpfad auf dem Datenträger, um das ungekürzte Rohtranskript
anzuzeigen.

### Steuerelemente für die Threadbindung

Diese Befehle funktionieren in Kanälen mit dauerhaften Threadbindungen. Siehe
[Kanäle mit Threadunterstützung](#thread-supporting-channels) unten.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Startverhalten

Agenten starten Hintergrund-Sub-Agenten mit dem Tool `sessions_spawn`.
Abschlüsse werden als interne Ereignisse der übergeordneten Sitzung zurückgegeben;
der übergeordnete bzw. anfordernde Agent entscheidet, ob eine für den Benutzer
sichtbare Aktualisierung erforderlich ist.

<AccordionGroup>
  <Accordion title="Nicht blockierender, Push-basierter Abschluss">
    - `sessions_spawn` blockiert nicht; es gibt sofort eine Lauf-ID zurück.
    - Nach Abschluss meldet sich der Sub-Agent bei der übergeordneten bzw. anfordernden Sitzung zurück.
    - Agentendurchläufe, die Ergebnisse untergeordneter Agenten benötigen, sollten nach dem Starten der erforderlichen Arbeit `sessions_yield` aufrufen. Dadurch wird der aktuelle Durchlauf beendet und das Abschlussereignis kann als nächste für das Modell sichtbare Nachricht eintreffen.
    - Der Abschluss erfolgt Push-basiert. Fragen Sie nach dem Start **nicht** `/subagents list`, `sessions_list` oder `sessions_history` in einer Schleife ab, nur um auf den Abschluss zu warten; prüfen Sie den Status nur bei Bedarf während der Fehlerdiagnose.
    - Die Ausgabe des untergeordneten Agenten ist ein Bericht bzw. Nachweis, den der anfordernde Agent zusammenführen muss. Sie ist kein vom Benutzer verfasster Anweisungstext und kann System-, Entwickler- oder Benutzerrichtlinien nicht außer Kraft setzen.
    - Nach Abschluss schließt OpenClaw nach bestem Bemühen die von dieser Sub-Agentensitzung geöffneten und nachverfolgten Browser-Tabs bzw. Prozesse, bevor der Bereinigungsablauf der Meldung fortgesetzt wird.

  </Accordion>
  <Accordion title="Übermittlung des Abschlusses">
    - OpenClaw übergibt Abschlüsse über einen `agent`-Durchlauf mit einem stabilen Idempotenzschlüssel an die anfordernde Sitzung zurück.
    - Wenn der anfordernde Lauf noch aktiv ist, versucht OpenClaw zunächst, diesen Lauf aufzuwecken bzw. zu steuern, anstatt einen zweiten sichtbaren Antwortpfad zu starten.
    - Wenn ein aktiver Anforderer nicht aufgeweckt werden kann, greift OpenClaw auf eine Übergabe an den anfordernden Agenten mit demselben Abschlusskontext zurück, anstatt die Meldung zu verwerfen.
    - Eine erfolgreiche Übergabe an den übergeordneten Agenten schließt die Übermittlung des Sub-Agenten auch dann ab, wenn der übergeordnete Agent entscheidet, dass keine sichtbare Benutzeraktualisierung erforderlich ist.
    - Native Sub-Agenten erhalten das Nachrichten-Tool nicht. Sie geben einfachen Assistententext an den übergeordneten bzw. anfordernden Agenten zurück; für Menschen sichtbare Antworten verbleiben im Zuständigkeitsbereich der normalen Zustellungsrichtlinie des übergeordneten bzw. anfordernden Agenten.
    - Wenn die direkte Übergabe nicht verwendet werden kann, greift die Zustellung zunächst auf die Warteschlangenweiterleitung und anschließend auf eine kurze Wiederholung der Meldung mit exponentiellem Backoff zurück, bevor sie endgültig aufgegeben wird.
    - Die Zustellung behält die aufgelöste Route des Anforderers bei: Thread- oder unterhaltungsgebundene Abschlussrouten haben Vorrang, wenn sie verfügbar sind. Wenn der Ursprung des Abschlusses nur einen Kanal bereitstellt, ergänzt OpenClaw das fehlende Ziel bzw. Konto anhand der aufgelösten Route der anfordernden Sitzung (`lastChannel` / `lastTo` / `lastAccountId`), damit die direkte Zustellung weiterhin funktioniert.

  </Accordion>
  <Accordion title="Metadaten der Abschlussübergabe">
    Die Abschlussübergabe an die anfordernde Sitzung ist ein zur Laufzeit erzeugter
    interner Kontext (kein vom Benutzer verfasster Text) und enthält:

    - `Result` — den neuesten sichtbaren `assistant`-Antworttext des untergeordneten Agenten. Die Ausgabe von Tool/toolResult wird nicht in die Ergebnisse des untergeordneten Agenten übernommen. Endgültig fehlgeschlagene Läufe verwenden erfassten Antworttext nicht erneut.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompakte Laufzeit-/Tokenstatistiken.
    - Eine Prüfanweisung, die den anfordernden Agenten auffordert, das Ergebnis zu überprüfen, bevor er entscheidet, ob die ursprüngliche Aufgabe abgeschlossen ist.
    - Eine Anleitung für Folgemaßnahmen, die den anfordernden Agenten auffordert, die Aufgabe fortzusetzen oder eine Folgemaßnahme zu vermerken, wenn das Ergebnis des untergeordneten Agenten weitere Schritte erfordert.
    - Eine Anweisung zur abschließenden Aktualisierung für den Fall, dass keine weiteren Maßnahmen erforderlich sind, formuliert in normaler Assistentensprache und ohne Weiterleitung interner Rohmetadaten.

  </Accordion>
  <Accordion title="Modi und ACP-Laufzeit">
    - `--model` und `--thinking` überschreiben die Standardwerte für diesen bestimmten Lauf.
    - Verwenden Sie `info`/`log`, um Details und Ausgabe nach dem Abschluss zu prüfen.
    - Verwenden Sie für dauerhafte threadgebundene Sitzungen `sessions_spawn` mit `thread: true` und `mode: "session"`.
    - Wenn der anfordernde Kanal keine Threadbindungen unterstützt, verwenden Sie `mode: "run"`, anstatt eine unmögliche threadgebundene Kombination erneut zu versuchen.
    - Verwenden Sie für ACP-Harness-Sitzungen (Claude Code, Gemini CLI, OpenCode oder ausdrücklich Codex ACP/acpx) `sessions_spawn` mit `runtime: "acp"`, wenn das Tool diese Laufzeit anbietet. Siehe [ACP-Zustellungsmodell](/de/tools/acp-agents#delivery-model) zur Fehlerdiagnose von Abschlüssen oder Agent-zu-Agent-Schleifen. Wenn das `codex`-Plugin aktiviert ist, sollte die Codex-Chat-/Threadsteuerung ACP gegenüber `/codex ...` den Vorzug geben, sofern der Benutzer nicht ausdrücklich ACP/acpx anfordert.
    - OpenClaw blendet `runtime: "acp"` aus, bis ACP aktiviert ist, der Anforderer nicht in einer Sandbox ausgeführt wird und ein Backend-Plugin wie `acpx` geladen ist. `runtime: "acp"` erwartet eine externe ACP-Harness-ID oder einen Eintrag unter `agents.list[]` mit `runtime.type="acp"`; verwenden Sie die standardmäßige Sub-Agentenlaufzeit für normale OpenClaw-Konfigurationsagenten aus `agents_list`.

  </Accordion>
</AccordionGroup>

## Kontextmodi

Native Sub-Agenten starten isoliert, sofern der Aufrufer nicht ausdrücklich
eine Verzweigung des aktuellen Transkripts anfordert.

| Modus      | Verwendungszweck                                                                                                                        | Verhalten                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `isolated` | Neue Recherche, unabhängige Implementierung, langsame Tool-Arbeit oder alles, was im Aufgabentext beschrieben werden kann               | Erstellt ein leeres Transkript für den untergeordneten Agenten. Dies ist der Standard und hält den Tokenverbrauch niedriger. |
| `fork`     | Arbeit, die von der aktuellen Unterhaltung, vorherigen Tool-Ergebnissen oder differenzierten Anweisungen im Transkript des Anforderers abhängt | Verzweigt das Transkript des Anforderers in die Sitzung des untergeordneten Agenten, bevor dieser startet. |

Verwenden Sie `fork` sparsam. Es ist für kontextsensitive Delegierung gedacht
und kein Ersatz für eine klare Aufgabenbeschreibung.

## Tool: `sessions_spawn`

Startet einen Sub-Agentenlauf mit `deliver: false` auf der globalen
`subagent`-Lane, führt anschließend einen Meldeschritt aus und veröffentlicht
die Meldungsantwort im Chatkanal des Anforderers.

Die Verfügbarkeit hängt von der effektiven Tool-Richtlinie des Aufrufers ab. Das
integrierte Profil `coding` enthält `sessions_spawn`; `messaging` und `minimal`
enthalten es nicht. `full` erlaubt jedes Tool. Fügen Sie `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` hinzu oder verwenden Sie `tools.profile: "coding"` für
Agenten mit einem eingeschränkteren Profil, die dennoch Arbeit delegieren sollen.
Richtlinien für Kanal/Gruppe, Provider, Sandbox und agentenspezifische Erlaubnis-/Verbotslisten
können das Tool nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` in derselben
Sitzung, um die effektive Tool-Liste zu bestätigen.

**Standardwerte:**

- **Modell:** Native Sub-Agenten übernehmen das Modell des Aufrufers, sofern Sie nicht `agents.defaults.subagents.model` (oder agentenspezifisch `agents.list[].subagents.model`) festlegen. ACP-Laufzeitstarts verwenden dasselbe konfigurierte Sub-Agentenmodell, sofern vorhanden; andernfalls behält das ACP-Harness seinen eigenen Standard bei. Ein explizites `sessions_spawn.model` hat weiterhin Vorrang.
- **Denken:** Native Sub-Agenten übernehmen die Einstellung des Aufrufers, sofern Sie nicht `agents.defaults.subagents.thinking` (oder agentenspezifisch `agents.list[].subagents.thinking`) festlegen. ACP-Laufzeitstarts wenden außerdem `agents.defaults.models["provider/model"].params.thinking` für das ausgewählte Modell an. Ein explizites `sessions_spawn.thinking` hat weiterhin Vorrang.
- **Laufzeitlimit:** OpenClaw verwendet `agents.defaults.subagents.runTimeoutSeconds`, wenn es festgelegt ist; andernfalls wird auf `0` (kein Zeitlimit) zurückgegriffen. `sessions_spawn` akzeptiert keine laufbezogenen Überschreibungen des Zeitlimits.
- **Aufgabenübermittlung:** Native Sub-Agenten erhalten die delegierte Aufgabe in ihrer ersten sichtbaren `[Subagent Task]`-Nachricht. Der System-Prompt des Sub-Agenten enthält Laufzeitregeln und Routingkontext, nicht ein verborgenes Duplikat der Aufgabe.

Akzeptierte native Sub-Agentenstarts enthalten die aufgelösten Metadaten des untergeordneten Modells
im Tool-Ergebnis: `resolvedModel` enthält die angewendete Modellreferenz und
`resolvedProvider` enthält das Provider-Präfix, wenn die Referenz eines besitzt.

### Modus des Delegierungs-Prompts

`agents.defaults.subagents.delegationMode` steuert nur die Prompt-Anleitung; die Tool-Richtlinie wird dadurch weder geändert noch wird Delegierung erzwungen.

- `suggest` (Standard): Behält den üblichen Prompt-Hinweis bei, Sub-Agenten für größere oder langsamere Arbeiten zu verwenden.
- `prefer`: Weist den Hauptagenten an, reaktionsfähig zu bleiben und alles, was über eine direkte Antwort hinausgeht, über `sessions_spawn` zu delegieren.

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
  Optionales Arbeitsverzeichnis für den untergeordneten Lauf. Native Unteragenten laden Bootstrap-Dateien weiterhin aus dem Arbeitsbereich des Zielagenten; `cwd` ändert nur, wo Laufzeitwerkzeuge und CLI-Harnesses die delegierte Arbeit ausführen.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` ist ausschließlich für externe ACP-Harnesses (`claude`, `droid`, `gemini`, `opencode` oder ausdrücklich angefordertes Codex ACP/acpx) sowie für Einträge in `agents.list[]` vorgesehen, deren `runtime.type` den Wert `acp` hat.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Nur ACP. Setzt eine bestehende ACP-Harness-Sitzung fort, wenn `runtime: "acp"` gilt; wird beim Start nativer Unteragenten ignoriert.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Nur ACP. Streamt die Ausgabe des ACP-Laufs an die übergeordnete Sitzung, wenn `runtime: "acp"` gilt; beim Start nativer Unteragenten weglassen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibt das Modell des Unteragenten. Ungültige Werte werden übersprungen, und der Unteragent wird mit dem Standardmodell ausgeführt; das Werkzeugergebnis enthält dabei eine Warnung.
</ParamField>
<ParamField path="thinking" type="string">
  Überschreibt die Denkstufe für den Lauf des Unteragenten.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Fordert bei `true` für diese Unteragentensitzung die Bindung an einen Kanal-Thread an.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Wenn `thread: true` gilt und `mode` weggelassen wird, ist der Standardwert `session`. `mode: "session"` erfordert `thread: true`.
  Wenn für den anfordernden Kanal keine Thread-Bindung verfügbar ist, verwenden Sie stattdessen `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiviert die Sitzung unmittelbar nach der Ankündigung (das Transkript bleibt durch Umbenennung erhalten).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` lehnt den Start ab, sofern die Laufzeit des untergeordneten Zielagenten nicht in einer Sandbox ausgeführt wird.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` verzweigt das aktuelle Transkript des Anforderers in die untergeordnete Sitzung. Nur für native Unteragenten. Thread-gebundene Starts verwenden standardmäßig `fork`; nicht Thread-gebundene Starts verwenden standardmäßig `isolated`.
</ParamField>

<Warning>
`sessions_spawn` akzeptiert **keine** Parameter für die Kanalauslieferung (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Native Unteragenten melden
ihre neueste Assistentenantwort an den Anforderer zurück; die externe Auslieferung
verbleibt beim übergeordneten bzw. anfordernden Agenten.
</Warning>

### Aufgabennamen und Zielauswahl

`taskName` ist ein modellseitiger Bezeichner für die Orchestrierung, kein Sitzungsschlüssel.
Verwenden Sie ihn für stabile Namen untergeordneter Agenten wie `review_subagents`,
`linux_validation` oder `docs_update`, wenn ein Koordinator diesen untergeordneten
Agenten später möglicherweise prüfen muss.

Die Zielauflösung akzeptiert exakte Übereinstimmungen mit `taskName` und eindeutige
Präfixe. Die Zuordnung ist auf dasselbe Fenster aktiver/kürzlich verwendeter Ziele
beschränkt, das auch für nummerierte `/subagents`-Ziele verwendet wird, sodass ein
veralteter abgeschlossener untergeordneter Agent einen wiederverwendeten Bezeichner
nicht mehrdeutig macht. Wenn zwei aktive oder kürzlich verwendete untergeordnete Agenten
denselben `taskName` haben, ist das Ziel mehrdeutig; verwenden Sie stattdessen den
Listenindex, den Sitzungsschlüssel oder die Lauf-ID.

Die reservierten Ziele `last` und `all` sind keine gültigen `taskName`-Werte,
da sie bereits Steuerungsbedeutungen haben.

## Werkzeug: `sessions_yield`

Beendet die aktuelle Modellantwort und wartet darauf, dass Laufzeitereignisse,
hauptsächlich Abschlussereignisse von Unteragenten, als nächste Nachricht eintreffen.
Verwenden Sie es nach dem Start erforderlicher untergeordneter Arbeiten, wenn der
Anforderer keine abschließende Antwort erstellen kann, bevor diese Arbeiten abgeschlossen sind.

`sessions_yield` ist das elementare Wartewerkzeug. Ersetzen Sie es nicht durch
Abfrageschleifen über `subagents`, `sessions_list`, `sessions_history`, Shell-
`sleep` oder Prozessabfragen, nur um den Abschluss untergeordneter Agenten zu erkennen.

Verwenden Sie `sessions_yield` nur, wenn es in der effektiven Werkzeugliste der Sitzung
enthalten ist. Einige minimale oder benutzerdefinierte Werkzeugprofile können
`sessions_spawn` und `subagents` bereitstellen, ohne `sessions_yield` bereitzustellen;
erfinden Sie in diesem Fall keine Abfrageschleife, nur um auf den Abschluss zu warten.

Wenn aktive untergeordnete Agenten vorhanden sind, fügt OpenClaw in normale Antworten
einen kompakten, zur Laufzeit generierten Prompt-Block `Active Subagents` ein, damit
der Anforderer die aktuellen untergeordneten Sitzungen, Lauf-IDs, Status, Bezeichnungen,
Aufgaben und `taskName`-Aliasse ohne Abfragen sehen kann. Die Aufgaben- und
Bezeichnungsfelder in diesem Block werden als Daten und nicht als Anweisungen zitiert,
da sie aus vom Benutzer oder Modell bereitgestellten Startargumenten stammen können.

## Werkzeug: `subagents`

Listet die gestarteten Unteragentenläufe auf, die der anfordernden Sitzung gehören.
Der Geltungsbereich ist auf den aktuellen Anforderer beschränkt; ein untergeordneter
Agent kann nur die von ihm selbst gesteuerten untergeordneten Agenten sehen.

Verwenden Sie `subagents` für Statusabfragen bei Bedarf und zur Fehlerdiagnose.
Verwenden Sie `sessions_yield`, um auf Abschlussereignisse zu warten.

## Thread-gebundene Sitzungen

Wenn Thread-Bindungen für einen Kanal aktiviert sind, kann ein Unteragent an einen
Thread gebunden bleiben, sodass nachfolgende Benutzernachrichten in diesem Thread
weiterhin an dieselbe Unteragentensitzung weitergeleitet werden.

### Kanäle mit Thread-Unterstützung

Ein Kanal unterstützt dauerhafte Thread-gebundene Unteragentensitzungen
(`sessions_spawn` mit `thread: true`), wenn er einen Adapter für Konversationsbindungen
registriert. Gebündelte Kanäle mit dieser Unterstützung: **Discord**,
**iMessage**, **Matrix** und **Telegram**. Discord und Matrix erstellen standardmäßig
einen untergeordneten Thread; Telegram und iMessage binden standardmäßig die aktuelle
Konversation. Verwenden Sie die kanalspezifischen `threadBindings`-Konfigurationsschlüssel
für Aktivierung, Zeitüberschreitungen und `spawnSessions`.

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
  <Step title="Zeitüberschreitungen prüfen">
    Verwenden Sie `/session idle`, um die automatische Aufhebung des Fokus bei Inaktivität zu prüfen/aktualisieren, und
    `/session max-age`, um die feste Obergrenze zu steuern.
  </Step>
  <Step title="Trennen">
    Verwenden Sie `/unfocus`, um die Bindung manuell zu trennen.
  </Step>
</Steps>

### Manuelle Steuerung

| Befehl             | Wirkung                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Bindet den aktuellen Thread an ein Unteragenten-/Sitzungsziel (oder erstellt einen Thread) |
| `/unfocus`         | Entfernt die Bindung für den aktuell gebundenen Thread                                    |
| `/agents`          | Listet aktive Läufe und den Bindungsstatus auf (`binding:<id>`, `unbound` oder `bindings unavailable`) |
| `/session idle`    | Prüft/aktualisiert die automatische Aufhebung des Fokus bei Inaktivität (nur fokussierte gebundene Threads) |
| `/session max-age` | Prüft/aktualisiert die feste Obergrenze (nur fokussierte gebundene Threads)               |

### Konfigurationsschalter

- **Globaler Standard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanalspezifische Überschreibungen und Schlüssel für die automatische Bindung beim Start** sind adapterspezifisch. Siehe oben [Kanäle mit Thread-Unterstützung](#thread-supporting-channels).

Aktuelle Adapterdetails finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference) und unter
[Slash-Befehle](/de/tools/slash-commands).

### Zulassungsliste

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Liste konfigurierter Agenten-IDs, die über eine explizite `agentId` als Ziel verwendet werden können (`["*"]` erlaubt jedes konfigurierte Ziel). Standard: nur der anfordernde Agent. Wenn Sie eine Liste festlegen und weiterhin möchten, dass der Anforderer sich selbst mit `agentId` startet, nehmen Sie die ID des Anforderers in die Liste auf.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standardmäßige Zulassungsliste konfigurierter Zielagenten, die verwendet wird, wenn der anfordernde Agent keine eigene `subagents.allowAgents`-Liste festlegt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blockiert `sessions_spawn`-Aufrufe, die `agentId` weglassen (erzwingt eine explizite Profilauswahl). Agentenspezifische Überschreibung: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Zeitüberschreitung pro Aufruf für Auslieferungsversuche der Gateway-`agent`-Ankündigung. Die Werte sind positive ganzzahlige Millisekundenangaben und werden auf das plattformsichere Timermaximum begrenzt. Vorübergehende Wiederholungsversuche können dazu führen, dass die gesamte Wartezeit für die Ankündigung länger als eine konfigurierte Zeitüberschreitung ist.
</ParamField>

Wenn die anfordernde Sitzung in einer Sandbox ausgeführt wird, lehnt `sessions_spawn`
Ziele ab, die ohne Sandbox ausgeführt würden.

### Ermittlung

Verwenden Sie `agents_list`, um zu sehen, welche Agenten-IDs derzeit für
`sessions_spawn` zulässig sind. Die Antwort enthält das effektive Modell und die
eingebetteten Laufzeitmetadaten jedes aufgeführten Agenten, sodass Aufrufer zwischen
OpenClaw, dem Codex-App-Server und anderen konfigurierten nativen Laufzeiten unterscheiden können.

Einträge in `allowAgents` müssen auf konfigurierte Agenten-IDs in `agents.list[]` verweisen.
`["*"]` bezeichnet jeden konfigurierten Zielagenten sowie den Anforderer. Wenn eine
Agentenkonfiguration gelöscht wird, ihre ID aber in `allowAgents` verbleibt, lehnt
`sessions_spawn` diese ID ab und `agents_list` lässt sie aus. Führen Sie
`openclaw doctor --fix` aus, um veraltete Einträge in der Zulassungsliste zu bereinigen,
oder fügen Sie einen minimalen Eintrag in `agents.list[]` hinzu, wenn das Ziel unter
Übernahme der Standardwerte weiterhin startbar bleiben soll.

### Automatische Archivierung

- Unteragentensitzungen werden nach `agents.defaults.subagents.archiveAfterMinutes` (Standardwert `60`) automatisch archiviert.
- Die Archivierung verwendet `sessions.delete` und benennt das Transkript in `*.deleted.<timestamp>` um (im selben Ordner).
- `cleanup: "delete"` archiviert unmittelbar nach der Ankündigung (das Transkript bleibt durch Umbenennung erhalten).
- Die automatische Archivierung erfolgt nach bestem Bemühen; ausstehende Timer gehen beim Neustart des Gateways verloren.
- Konfigurierte Laufzeitüberschreitungen führen **nicht** zur automatischen Archivierung; sie beenden nur den Lauf. Die Sitzung bleibt bis zur automatischen Archivierung erhalten.
- Die automatische Archivierung gilt gleichermaßen für Sitzungen der Tiefe 1 und 2.
- Die Browserbereinigung ist von der Archivbereinigung getrennt: Erfasste Browser-Tabs/-Prozesse werden nach bestem Bemühen geschlossen, wenn der Lauf endet, selbst wenn das Transkript bzw. der Sitzungseintrag erhalten bleibt.

## Verschachtelte Unteragenten

Standardmäßig können Unteragenten keine eigenen Unteragenten starten
(`maxSpawnDepth: 1`). Legen Sie `maxSpawnDepth: 2` fest, um eine
Verschachtelungsebene zu aktivieren – das **Orchestrator-Muster**:
Hauptagent → Orchestrator-Unteragent → ausführende Unter-Unteragenten.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // Unteragenten dürfen untergeordnete Agenten starten (Standard: 1, Bereich 1–5)
        maxChildrenPerAgent: 5, // max. aktive untergeordnete Agenten pro Agentensitzung (Standard: 5, Bereich 1–20)
        maxConcurrent: 8, // globale Obergrenze der Parallelitätsspur (Standard: 8)
        runTimeoutSeconds: 900, // Standardzeitüberschreitung für sessions_spawn (0 = keine Zeitüberschreitung)
        announceTimeoutMs: 120000, // Gateway-Zeitüberschreitung pro Ankündigungsaufruf
      },
    },
  },
}
```

### Tiefenebenen

| Tiefe | Form des Sitzungsschlüssels                  | Rolle                                                | Kann untergeordnete Agenten starten? |
| ----- | -------------------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| 0     | `agent:<id>:main`                            | Hauptagent                                           | Immer                                |
| 1     | `agent:<id>:subagent:<uuid>`                 | Untergeordneter Agent (Orchestrator, wenn Tiefe 2 zulässig ist) | Nur wenn `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Unter-Unter-Agent (ausführender Endknoten)           | Nie                                  |

### Ankündigungskette

Ergebnisse werden entlang der Kette nach oben weitergegeben:

1. Der ausführende Agent auf Tiefe 2 wird fertig → kündigt dies seinem übergeordneten Agenten an (Orchestrator auf Tiefe 1).
2. Der Orchestrator auf Tiefe 1 erhält die Ankündigung, fasst die Ergebnisse zusammen und wird fertig → kündigt dies dem Hauptagenten an.
3. Der Hauptagent erhält die Ankündigung und übermittelt sie dem Benutzer.

Jede Ebene sieht nur Ankündigungen ihrer direkten untergeordneten Agenten.

<Note>
**Betriebshinweis:** Starten Sie untergeordnete Aufgaben einmal und warten Sie auf Abschlussereignisse, statt Abfrageschleifen um `sessions_list`,
`sessions_history`, `/subagents list` oder `exec`-Ruhezustandsbefehle zu erstellen.
`sessions_list` und `/subagents list` beschränken die Beziehungen untergeordneter Sitzungen
auf aktive Arbeit — aktive untergeordnete Sitzungen bleiben zugeordnet, beendete untergeordnete Sitzungen bleiben
kurzzeitig in einem Fenster mit aktuellen Einträgen sichtbar und veraltete, nur im Speicher vorhandene Verknüpfungen mit untergeordneten Sitzungen werden
nach Ablauf ihres Aktualitätsfensters ignoriert. Dadurch wird verhindert, dass alte `spawnedBy`- /
`parentSessionKey`-Metadaten nach einem Neustart untergeordnete Geistersitzungen wiederherstellen.
Wenn das Abschlussereignis eines untergeordneten Agenten eintrifft, nachdem Sie bereits die
endgültige Antwort gesendet haben, ist die korrekte Folgeaktion exakt das stille Token
`NO_REPLY` / `no_reply`.
</Note>

### Werkzeugrichtlinie nach Tiefe

- Rolle und Kontrollumfang werden beim Start in die Sitzungsmetadaten geschrieben. Dadurch können flache oder wiederhergestellte Sitzungsschlüssel nicht versehentlich erneut Orchestratorberechtigungen erhalten.
- **Tiefe 1 (Orchestrator, wenn `maxSpawnDepth >= 2`):** erhält `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, damit er untergeordnete Agenten starten und deren Status prüfen kann. Andere Sitzungs-/Systemwerkzeuge bleiben verweigert.
- **Tiefe 1 (Endknoten, wenn `maxSpawnDepth == 1`):** keine Sitzungswerkzeuge (aktuelles Standardverhalten).
- **Tiefe 2 (ausführender Endknoten):** keine Sitzungswerkzeuge — `sessions_spawn` wird auf Tiefe 2 immer verweigert. Kann keine weiteren untergeordneten Agenten starten.

### Startlimit pro Agent

Jede Agentensitzung (auf jeder Tiefe) kann gleichzeitig höchstens `maxChildrenPerAgent`
(standardmäßig `5`) aktive untergeordnete Agenten haben. Dies verhindert eine unkontrollierte Auffächerung
durch einen einzelnen Orchestrator.

### Kaskadierendes Stoppen

Das Stoppen eines Orchestrators auf Tiefe 1 stoppt automatisch alle seine untergeordneten Agenten
auf Tiefe 2:

- `/stop` im Hauptchat stoppt alle Agenten auf Tiefe 1 und kaskadiert zu deren untergeordneten Agenten auf Tiefe 2.

## Authentifizierung

Die Authentifizierung untergeordneter Agenten wird anhand der **Agenten-ID** aufgelöst, nicht anhand des Sitzungstyps:

- Der Sitzungsschlüssel des untergeordneten Agenten lautet `agent:<agentId>:subagent:<uuid>`.
- Der Authentifizierungsspeicher wird aus dem `agentDir` dieses Agenten geladen.
- Die Authentifizierungsprofile des Hauptagenten werden als **Fallback** zusammengeführt; Agentenprofile überschreiben bei Konflikten die Profile des Hauptagenten.

Die Zusammenführung ist additiv, daher sind die Profile des Hauptagenten immer als
Fallbacks verfügbar. Eine vollständig isolierte Authentifizierung pro Agent wird noch nicht unterstützt.

## Ankündigung

Untergeordnete Agenten melden über einen Ankündigungsschritt zurück:

- Der Ankündigungsschritt wird innerhalb der Sitzung des untergeordneten Agenten ausgeführt (nicht in der Sitzung des Anfordernden).
- Wenn der untergeordnete Agent exakt mit `ANNOUNCE_SKIP` antwortet, wird nichts veröffentlicht.
- Wenn der neueste Assistententext exakt dem stillen Token `NO_REPLY` / `no_reply` entspricht, wird die Ankündigungsausgabe unterdrückt, selbst wenn zuvor sichtbarer Fortschritt vorhanden war.

Die Zustellung hängt von der Tiefe des Anfordernden ab:

- Anfordernde Sitzungen auf oberster Ebene verwenden einen nachfolgenden `agent`-Aufruf mit externer Zustellung (`deliver=true`).
- Verschachtelte anfordernde Sitzungen untergeordneter Agenten erhalten eine interne Folgeinjektion (`deliver=false`), damit der Orchestrator die Ergebnisse untergeordneter Agenten innerhalb der Sitzung zusammenfassen kann.
- Wenn die verschachtelte anfordernde Sitzung eines untergeordneten Agenten nicht mehr vorhanden ist, greift OpenClaw nach Möglichkeit auf den Anfordernden dieser Sitzung zurück.

Bei anfordernden Sitzungen auf oberster Ebene löst die direkte Zustellung im Abschlussmodus zuerst
eine eventuell gebundene Konversations-/Thread-Route und Hook-Überschreibung auf und ergänzt anschließend
fehlende Kanal-Zielfelder aus der gespeicherten Route der anfordernden Sitzung.
Dadurch bleiben Abschlüsse im richtigen Chat/Thema, selbst wenn der Ursprung des Abschlusses
nur den Kanal angibt.

Die Aggregation von Abschlüssen untergeordneter Agenten wird beim Erstellen verschachtelter Abschlussbefunde
auf den aktuellen Lauf des Anfordernden beschränkt, sodass veraltete Ausgaben untergeordneter Agenten aus früheren Läufen
nicht in die aktuelle Ankündigung gelangen. Ankündigungsantworten behalten
die Thread-/Themenweiterleitung bei, wenn sie auf Kanaladaptern verfügbar ist.

### Ankündigungskontext

Der Ankündigungskontext wird in einen stabilen internen Ereignisblock normalisiert:

| Feld           | Quelle                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Quelle         | `subagent` oder `cron`                                                                                   |
| Sitzungs-IDs   | Sitzungsschlüssel/-ID des untergeordneten Agenten                                                        |
| Typ            | Ankündigungstyp + Aufgabenbezeichnung                                                                    |
| Status         | Aus dem Laufzeitergebnis abgeleitet (`ok`, `error`, `timeout` oder `unknown`) — **nicht** aus Modelltext abgeleitet |
| Ergebnisinhalt | Neuester sichtbarer Assistententext des untergeordneten Agenten                                          |
| Folgeaktion    | Anweisung, die beschreibt, wann geantwortet bzw. still geblieben werden soll                             |

Fehlgeschlagene abgeschlossene Läufe melden den Fehlerstatus, ohne erfassten
Antworttext erneut wiederzugeben. Die Ausgabe von Werkzeugen/Werkzeugergebnissen wird nicht zum Ergebnistext des untergeordneten Agenten hochgestuft.

### Statistikzeile

Ankündigungsnutzlasten enthalten am Ende eine Statistikzeile (auch bei Umbruch):

- Laufzeit (z. B. `runtime 5m12s`).
- Token-Nutzung (Eingabe/Ausgabe/gesamt).
- Geschätzte Kosten, wenn die Modellpreise konfiguriert sind (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` und Transkriptpfad, damit der Hauptagent den Verlauf über `sessions_history` abrufen oder die Datei auf dem Datenträger prüfen kann.

Interne Metadaten sind nur für die Orchestrierung bestimmt; benutzerseitige Antworten
sollten in der normalen Ausdrucksweise des Assistenten neu formuliert werden.

### Warum `sessions_history` bevorzugt werden sollte

`sessions_history` ist der sicherere Orchestrierungsweg, um das Transkript eines untergeordneten Agenten
innerhalb eines Agentendurchlaufs zu lesen:

- Schwärzt Anmeldedaten-/Token-ähnlichen Text, selbst wenn die allgemeine Protokollschwärzung deaktiviert ist.
- Kürzt lange Textblöcke (4000 Zeichen pro Block) und entfernt Denksignaturen, Wiedergaben von Schlussfolgerungsdaten sowie eingebettete Bilddaten.
- Erzwingt eine Antwortobergrenze von 80 KB; übergroße Zeilen werden durch `[sessions_history omitted: message too large]` ersetzt.
- Verwenden Sie `nextOffset`, sofern vorhanden, um rückwärts durch ältere Transkriptfenster zu blättern.
- `sessions_history` entfernt **keine** Schlussfolgerungs-Tags, `<relevant-memories>`-Gerüste oder Werkzeugaufruf-XML aus Nachrichtentexten — es gibt strukturierte Inhaltsblöcke nahe an der Rohform des Transkripts zurück, lediglich geschwärzt und größenbegrenzt. `/subagents log` wendet die stärkere Prosa-Bereinigung an (entfernt Schlussfolgerungs-Tags, Gedächtnisgerüste und Werkzeugaufruf-XML), da es einfache Chatzeilen statt strukturierter Blöcke darstellt.
- Die Prüfung des Rohtranskripts auf dem Datenträger ist der Fallback, wenn Sie das vollständige, bytegenaue Transkript benötigen.

## Werkzeugrichtlinie

Untergeordnete Agenten durchlaufen zunächst dieselbe Profil- und Werkzeugrichtlinienpipeline wie der übergeordnete
oder Zielagent. Anschließend wendet OpenClaw die Einschränkungsebene für untergeordnete Agenten
an.

Untergeordnete Agenten verlieren unabhängig von Tiefe oder Rolle immer `gateway`, `agents_list`, `session_status` und
`cron` (Werkzeuge auf Systemebene/interaktive Werkzeuge oder
Werkzeuge, die der Hauptagent koordinieren sollte). Untergeordnete Endknotenagenten (standardmäßiges Verhalten auf Tiefe 1
und immer auf Tiefe 2) verlieren zusätzlich `subagents`,
`sessions_list`, `sessions_history` und `sessions_spawn`. Untergeordnete Agenten erhalten niemals
das Werkzeug `message` — es wird beim Start deaktiviert und nicht durch
diese Verweigerungsliste gefiltert — und `sessions_send` bleibt verweigert, sodass untergeordnete Agenten
nur über die Ankündigungskette kommunizieren.

`sessions_history` bleibt auch hier eine begrenzte, bereinigte Rückschau — es
ist keine Ausgabe des Rohtranskripts.

Wenn `maxSpawnDepth >= 2`, erhalten untergeordnete Orchestrator-Agenten auf Tiefe 1 zusätzlich
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
        // Verweigerung hat Vorrang
        deny: ["gateway", "cron"],
        // wenn „allow“ gesetzt ist, wird es zu einer reinen Zulassungsliste (Verweigerung hat weiterhin Vorrang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` ist ein abschließender Filter, der ausschließlich die aufgeführten Werkzeuge zulässt. Er kann die
bereits aufgelöste Werkzeugmenge einschränken, aber kein durch
`tools.profile` entferntes Werkzeug **wieder hinzufügen**. Beispielsweise umfasst `tools.profile: "coding"`
`web_search`/`web_fetch`, aber nicht das Werkzeug `browser`. Damit
untergeordnete Agenten mit Codierungsprofil Browserautomatisierung verwenden können, fügen Sie den Browser in der
Profilphase hinzu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Verwenden Sie je Agent `agents.list[].tools.alsoAllow: ["browser"]`, wenn nur ein
Agent Browserautomatisierung erhalten soll.

## Nebenläufigkeit

Untergeordnete Agenten verwenden eine dedizierte prozessinterne Warteschlangenspur:

- **Spurname:** `subagent`
- **Nebenläufigkeit:** `agents.defaults.subagents.maxConcurrent` (standardmäßig `8`)

## Verfügbarkeit und Wiederherstellung

OpenClaw betrachtet das Fehlen von `endedAt` nicht als dauerhaften Nachweis dafür, dass ein
untergeordneter Agent noch aktiv ist. Nicht beendete Läufe, die älter als das Zeitfenster für veraltete Läufe sind
(2 Stunden oder das konfigurierte Laufzeitlimit plus eine kurze Karenzzeit,
je nachdem, welcher Wert größer ist), werden in `/subagents list`,
Statuszusammenfassungen, der Abschlussblockierung für Nachkommen und den Nebenläufigkeitsprüfungen
pro Sitzung nicht mehr als aktiv/ausstehend gezählt.

Nach einem Gateway-Neustart werden veraltete, nicht beendete, wiederhergestellte Läufe entfernt, sofern
ihre untergeordnete Sitzung nicht mit `abortedLastRun: true` markiert ist. Durch einen Neustart abgebrochene
Läufe bleiben für den Wiederherstellungsablauf verwaister untergeordneter Agenten registriert: veraltete
Läufe werden ohne Fortsetzung abgeschlossen, während aktuelle untergeordnete Sitzungen
eine synthetische Fortsetzungsnachricht erhalten, bevor die Abbruchmarkierung entfernt wird.

Die automatische Wiederherstellung nach einem Neustart ist pro untergeordneter Sitzung begrenzt. Wenn derselbe
untergeordnete Agent innerhalb des Zeitfensters für schnelles wiederholtes Festfahren mehrfach für die Wiederherstellung verwaister Sitzungen akzeptiert wird,
speichert OpenClaw einen Wiederherstellungs-Grabstein für diese
Sitzung und setzt sie bei späteren Neustarts nicht mehr automatisch fort. Führen Sie
`openclaw tasks maintenance --apply` aus, um den Aufgabeneintrag abzugleichen, oder
`openclaw doctor --fix`, um veraltete Markierungen für abgebrochene Wiederherstellungen bei
Sitzungen mit Grabstein zu löschen.

<Note>
Wenn das Starten eines untergeordneten Agenten mit Gateway `PAIRING_REQUIRED` /
`scope-upgrade` fehlschlägt, prüfen Sie den RPC-Aufrufer, bevor Sie den Kopplungsstatus bearbeiten.
Die interne `sessions_spawn`-Koordinierung wird innerhalb des Prozesses ausgeführt, wenn der
Aufrufer bereits im Kontext der Gateway-Anforderung läuft, sodass sie keinen
Loopback-WebSocket öffnet und nicht vom Bereichsgrundwert des gekoppelten CLI-Geräts
abhängt. Aufrufer außerhalb des Gateway-Prozesses verwenden weiterhin den WebSocket-
Fallback als `client.id: "gateway-client"` mit `client.mode: "backend"`
über direkte Loopback-Authentifizierung mit gemeinsamem Token/Passwort. Entfernte Aufrufer, explizite
`deviceIdentity`-, explizite Geräte-Token-Pfade sowie Browser-/Node-Clients
benötigen weiterhin die normale Gerätegenehmigung für Bereichserweiterungen.
</Note>

## Stoppen

- Das Senden von `/stop` im Chat des Anfordernden bricht dessen Sitzung ab und stoppt alle daraus gestarteten aktiven Läufe untergeordneter Agenten, kaskadierend bis zu verschachtelten untergeordneten Agenten.

## Einschränkungen

- Die Ankündigung durch Sub-Agenten erfolgt nach dem **Best-Effort-Prinzip**. Wenn der Gateway neu startet, gehen ausstehende „announce back“-Vorgänge verloren.
- Sub-Agenten teilen sich weiterhin die Ressourcen desselben Gateway-Prozesses; betrachten Sie `maxConcurrent` als Sicherheitsmechanismus.
- `sessions_spawn` ist immer nicht blockierend: Die Funktion gibt sofort `{ status: "accepted", runId, childSessionKey }` zurück.
- In den Kontext von Sub-Agenten werden nur `AGENTS.md` und `TOOLS.md` eingefügt (nicht `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` oder `BOOTSTRAP.md`). Codex-native Sub-Agenten unterliegen derselben Abgrenzung: `TOOLS.md` verbleibt in den geerbten Anweisungen des Codex-Threads, während Persona-, Identitäts- und Benutzerdateien, die ausschließlich für den übergeordneten Agenten bestimmt sind, als auf den jeweiligen Turn beschränkte Anweisungen zur Zusammenarbeit eingefügt werden, damit untergeordnete Agenten sie nicht klonen.
- Die maximale Verschachtelungstiefe beträgt 5 (`maxSpawnDepth`-Bereich: 1-5). Für die meisten Anwendungsfälle wird Tiefe 2 empfohlen.
- `maxChildrenPerAgent` begrenzt die Anzahl aktiver untergeordneter Agenten pro Sitzung (Standardwert `5`, Bereich `1-20`).

## Verwandte Themen

- [Sitzungswerkzeuge und Statusänderungen](/de/concepts/session-tool)
- [ACP-Agenten](/de/tools/acp-agents)
- [Agentenversand](/de/tools/agent-send)
- [Hintergrundaufgaben](/de/automation/tasks)
- [Multi-Agent-Sandbox-Werkzeuge](/de/tools/multi-agent-sandbox-tools)
