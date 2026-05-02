---
read_when:
    - Bearbeiten von System-Prompt-Text, Tools-Liste oder Zeit-/Heartbeat-Abschnitten
    - Ändern des Arbeitsbereich-Bootstraps oder des Verhaltens der Skills-Injektion
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-05-02T20:46:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jede Agent-Ausführung einen benutzerdefinierten System-Prompt. Der Prompt wird **von OpenClaw verwaltet** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jede Agent-Ausführung injiziert.

Provider-Plugins können cache-bewusste Prompt-Anweisungen beitragen, ohne den vollständigen von OpenClaw verwalteten Prompt zu ersetzen. Die Provider-Runtime kann:

- einen kleinen Satz benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für modellspezifische Abstimmung pro Modellfamilie. Behalten Sie die alte Prompt-Mutation
`before_prompt_build` für Kompatibilität oder wirklich globale Prompt-Änderungen bei, nicht für normales Provider-Verhalten.

Das Overlay für die OpenAI GPT-5-Familie hält die zentrale Ausführungsregel klein und ergänzt
modellspezifische Hinweise zu Persona-Fixierung, knapper Ausgabe, Tool-Disziplin,
paralleler Suche, Abdeckung von Ergebnissen, Verifizierung, fehlendem Kontext und
Hygiene bei Terminal-Tools.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an die maßgebliche Quelle für strukturierte Tools plus Runtime-Hinweise zur Tool-Nutzung.
- **Ausführungspriorität**: kompakte Hinweise zum Durchziehen: auf
  ausführbare Anfragen innerhalb des Turns handeln, weitermachen, bis die Aufgabe erledigt oder blockiert ist, schwache Tool-
  Ergebnisse auffangen, veränderlichen Zustand live prüfen und vor dem Finalisieren verifizieren.
- **Sicherheit**: kurze Guardrail-Erinnerung, machtstrebendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw-Selbstaktualisierung**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, Konfiguration mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzeranfrage
  ausgeführt wird. Das nur für Owner bestimmte `gateway`-Tool verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich alter `tools.bash.*`-
  Aliasse, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Pfad zu OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie zu lesen ist.
- **Workspace-Dateien (injiziert)**: zeigt an, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): zeigt Sandbox-Runtime, Sandbox-Pfade und ob erhöhte Exec-Rechte verfügbar sind.
- **Aktuelles Datum und Uhrzeit**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Antwort-Tags**: optionale Antwort-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Ack-Verhalten, wenn Heartbeats für den Standard-Agenten aktiviert sind.
- **Runtime**: Host, OS, Node, Modell, Repo-Root (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis zum /reasoning-Umschalter.

OpenClaw hält große stabile Inhalte, einschließlich **Projektkontext**, oberhalb der
internen Prompt-Cache-Grenze. Flüchtige Kanal-/Sitzungsabschnitte wie
Control-UI-Einbettungshinweise, **Messaging**, **Voice**, **Gruppenchat-Kontext**,
**Reaktionen**, **Heartbeats** und **Runtime** werden unterhalb dieser Grenze angehängt,
damit lokale Backends mit Präfix-Caches das stabile Workspace-Präfix
über Kanal-Turns hinweg wiederverwenden können. Tool-Beschreibungen sollten ebenso vermeiden,
aktuelle Kanalnamen einzubetten, wenn das akzeptierte Schema dieses Runtime-Detail bereits enthält.

Der Tooling-Abschnitt enthält außerdem Runtime-Hinweise für lang laufende Arbeit:

- Cron für zukünftige Nachverfolgung verwenden (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf
  den push-basierten Wake-Pfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingabe oder Eingriffe verwenden, wenn Sie einen laufenden Befehl
  prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Sub-Agents ist
  push-basiert und meldet sich automatisch beim Anfragenden zurück
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf
  Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
`in_progress`-Schritt beizubehalten und nach jeder Aktualisierung nicht den gesamten Plan zu wiederholen.

Sicherheits-Guardrails im System-Prompt sind beratend. Sie leiten das Modellverhalten an, erzwingen aber keine Policy. Verwenden Sie Tool-Policy, Exec-Genehmigungen, Sandboxing und Kanal-Allowlists für harte Durchsetzung; Betreiber können diese bewusst deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-Buttons weist der Runtime-Prompt den
Agenten jetzt an, zuerst diese native Genehmigungs-UI zu nutzen. Er sollte nur dann einen manuellen
`/approve`-Befehl einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agents rendern. Die Runtime setzt für jede Ausführung einen
`promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle obigen Abschnitte.
- `minimal`: wird für Sub-Agents verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** aus. Tooling, **Sicherheit**,
  Workspace, Sandbox, Aktuelles Datum und Uhrzeit (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal` ist, werden zusätzlich injizierte Prompts als **Subagent
Context** statt **Group Chat Context** gekennzeichnet.

Für automatische Kanalantworten kann OpenClaw den generischen Abschnitt **Silent Replies**
auslassen, wenn der Direkt-/Gruppenchat-Kontext bereits das aufgelöste
konversationsspezifische `NO_REPLY`-Verhalten enthält. Dadurch wird vermieden, Token-Mechanik
sowohl im globalen System-Prompt als auch im Kanalkontext zu wiederholen.

## Prompt-Snapshots

OpenClaw hält eingecheckte Happy-Path-Prompt-Snapshots für die Codex-/Message-Tool-
Runtime unter `test/fixtures/agents/prompt-snapshots/happy-path/`. Sie rendern
die von OpenClaw verwalteten Entwickleranweisungen des Codex-App-Servers, ausgewählte Thread-
Start-/Resume-Parameter, Turn-Benutzereingaben und dynamische Tool-Spezifikationen für Telegram-Direktnachrichten,
Discord-Gruppen und Heartbeat-Turns. Der verborgene Basis-System-Prompt von Codex und
die turn-bezogenen Codex-Anweisungen für den Kollaborationsmodus werden von der Codex-Runtime
verwaltet und nicht von OpenClaw gerendert.

Erzeugen Sie sie mit `pnpm prompt:snapshots:gen` neu und prüfen Sie Drift mit
`pnpm prompt:snapshots:check`.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Projektkontext** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur bei brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
kein dateispezifisches Gate greift. `HEARTBEAT.md` wird bei normalen Ausführungen ausgelassen, wenn
Heartbeats für den Standard-Agenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte
Dateien knapp — insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung sowie häufigerer Compaction führen kann.

<Note>
Tägliche Dateien unter `memory/*.md` sind **nicht** Teil des normalen Bootstrap-Projektkontexts. In gewöhnlichen Turns wird bei Bedarf über die Tools `memory_search` und `memory_get` auf sie zugegriffen, sodass sie nicht auf das Kontextfenster angerechnet werden, sofern das Modell sie nicht explizit liest. Bloße `/new`- und `/reset`-Turns sind die Ausnahme: Die Runtime kann aktuelle tägliche Memory als einmaligen Startkontextblock für diesen ersten Turn voranstellen.
</Note>

Große Dateien werden mit einem Marker abgeschnitten. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der gesamte injizierte Bootstrap-
Inhalt über Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren einen kurzen Marker für fehlende Dateien. Wenn Kürzung
auftritt, kann OpenClaw einen Warnblock in den Projektkontext injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung, plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Umgang mit Zeit

Der System-Prompt enthält einen eigenen Abschnitt **Aktuelles Datum und Uhrzeit**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhr oder kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine sitzungsbezogene Modell-
Überschreibung setzen (`model=default` löscht sie).

Konfigurieren Sie dies mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Datum und Uhrzeit](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn geeignete Skills existieren, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Speicherort (Workspace, verwaltet oder gebündelt) zu laden. Wenn keine Skills geeignet sind, wird der
Skills-Abschnitt ausgelassen.

Die Eignung umfasst Gates für Skill-Metadaten, Runtime-Umgebung-/Konfigurationsprüfungen
und die effektive Skill-Allowlist des Agenten, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur geeignet, wenn ihr zugehöriges Plugin aktiviert ist.
Dadurch können Tool-Plugins tiefere Bedienungsanleitungen bereitstellen, ohne alle
diese Hinweise direkt in jede Tool-Beschreibung einzubetten.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

So bleibt der Basis-Prompt klein und gezielte Skill-Nutzung trotzdem möglich.

Das Budget für die Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Agent-spezifische Überschreibung: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Runtime-Auszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größensteuerung für Skills getrennt von der Größensteuerung für Runtime-Lesevorgänge/-Injektionen wie
`memory_get`, Live-Tool-Ergebnissen und AGENTS.md-Aktualisierungen nach Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist, verweist er
auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelte npm-
Paketdokumentation). Wenn lokale Dokumentation nicht verfügbar ist, fällt er auf
[https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält außerdem den OpenClaw-Quellspeicherort. Git-Checkouts stellen den lokalen
Source-Root bereit, damit der Agent Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-
Quell-URL und weisen den Agenten an, dort die Quellen zu prüfen, wenn die Dokumentation unvollständig oder
veraltet ist. Der Prompt erwähnt außerdem den öffentlichen Dokumentationsspiegel, den Community-Discord und ClawHub
([https://clawhub.ai](https://clawhub.ai)) für die Skills-Entdeckung. Er weist das Modell an,
bei OpenClaw-Verhalten, Befehlen, Konfiguration oder Architektur zuerst die Dokumentation zu konsultieren und
wenn möglich selbst `openclaw status` auszuführen (und den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt).
Speziell für Konfiguration verweist er Agenten auf die `gateway`-Tool-Aktion
`config.schema.lookup` für exakte feldbezogene Dokumentation und Einschränkungen, anschließend auf
`docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md`
für breitere Hinweise.

## Verwandt

- [Agent-Laufzeit](/de/concepts/agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
