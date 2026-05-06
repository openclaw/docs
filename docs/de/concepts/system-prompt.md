---
read_when:
    - System-Prompt-Text, Werkzeugliste oder Zeit-/Heartbeat-Abschnitte bearbeiten
    - Verhalten beim Workspace-Bootstrap oder bei der Skills-Injektion ändern
summary: Was der OpenClaw-Systemprompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-05-06T06:46:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agentenlauf einen benutzerdefinierten System-Prompt. Der Prompt ist **OpenClaw-eigen** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agentenlauf injiziert.

Provider-Plugins können cache-bewusste Prompt-Hinweise beitragen, ohne den vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Runtime kann:

- eine kleine Gruppe benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für modellspezifisches Tuning nach Modellfamilie. Behalten Sie die alte Prompt-Mutation
`before_prompt_build` für Kompatibilität oder wirklich globale Prompt-Änderungen bei, nicht für normales Provider-Verhalten.

Das Overlay der OpenAI GPT-5-Familie hält die zentrale Ausführungsregel klein und ergänzt
modellspezifische Hinweise zu Persona-Latching, knapper Ausgabe, Tool-Disziplin,
paralleler Suche, Abdeckung von Liefergegenständen, Verifikation, fehlendem Kontext und
Hygiene bei Terminal-Tools.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an strukturierte Tools als Source of Truth sowie Laufzeit-Hinweise zur Tool-Nutzung.
- **Ausführungsneigung**: kompakte Hinweise zum konsequenten Abarbeiten: bei
  umsetzbaren Anfragen innerhalb des Turns handeln, weitermachen, bis die Aufgabe erledigt oder blockiert ist, schwache Tool-
  Ergebnisse wiederherstellen, veränderlichen Zustand live prüfen und vor dem Finalisieren verifizieren.
- **Sicherheit**: kurze Guardrail-Erinnerung, machtstrebendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw-Selbstaktualisierung**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, Konfiguration mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzeranforderung
  ausgeführt wird. Das nur für Owner verfügbare Tool `gateway` verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich alter `tools.bash.*`-
  Aliasse, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Pfad zu den OpenClaw-Dokumenten (Repo oder npm-Paket) und wann sie zu lesen sind.
- **Workspace-Dateien (injiziert)**: zeigt an, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): zeigt sandboxed Runtime, Sandbox-Pfade und ob erhöhte Exec-Rechte verfügbar sind.
- **Aktuelles Datum und Uhrzeit**: nur Zeitzone (cache-stabil; die Live-Uhr kommt aus `session_status`).
- **Antwort-Tags**: optionale Antwort-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Ack-Verhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Runtime**: Host, OS, Node, Modell, Repo-Root (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktueller Sichtbarkeitsgrad + Hinweis auf den /reasoning-Schalter.

OpenClaw hält große stabile Inhalte, einschließlich **Projektkontext**, oberhalb der
internen Prompt-Cache-Grenze. Veränderliche Kanal-/Sitzungsabschnitte wie
Control-UI-Embed-Hinweise, **Messaging**, **Voice**, **Gruppenchat-Kontext**,
**Reaktionen**, **Heartbeats** und **Runtime** werden unterhalb dieser Grenze angehängt,
damit lokale Backends mit Präfix-Caches das stabile Workspace-Präfix
über Kanal-Turns hinweg wiederverwenden können. Tool-Beschreibungen sollten ebenfalls vermeiden, aktuelle
Kanalnamen einzubetten, wenn das akzeptierte Schema dieses Laufzeitdetail bereits enthält.

Der Tooling-Abschnitt enthält außerdem Laufzeit-Hinweise für lang laufende Arbeit:

- Cron für zukünftige Follow-ups verwenden (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund
  weiterlaufen
- wenn automatisches Completion-Wake aktiviert ist, den Befehl einmal starten und sich auf
  den push-basierten Wake-Pfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingabe oder Eingriff verwenden, wenn Sie einen laufenden
  Befehl prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Sub-Agenten ist
  push-basiert und kündigt sich automatisch beim Anfragenden zurück
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf
  Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
`in_progress`-Schritt beizubehalten und zu vermeiden, nach jeder Aktualisierung den gesamten Plan zu wiederholen.

Sicherheits-Guardrails im System-Prompt sind beratend. Sie leiten das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Kanal-Allowlists für harte Durchsetzung; Betreiber können diese absichtlich deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-Buttons weist der Runtime-Prompt den
Agenten jetzt an, zuerst auf diese native Genehmigungs-UI zu setzen. Er sollte nur dann einen manuellen
`/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agenten rendern. Die Runtime setzt für jeden Lauf einen
`promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agenten verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Sicherheit**,
  Workspace, Sandbox, Aktuelles Datum und Uhrzeit (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal`, werden zusätzlich injizierte Prompts als **Subagent
Context** statt **Group Chat Context** bezeichnet.

Für Auto-Reply-Läufe von Kanälen kann OpenClaw den generischen Abschnitt **Silent Replies**
weglassen, wenn der direkte/Gruppenchat-Kontext bereits das aufgelöste
gesprächsspezifische `NO_REPLY`-Verhalten enthält. Dadurch wird vermieden, Token-Mechanik
sowohl im globalen System-Prompt als auch im Kanal-Kontext zu wiederholen.

## Prompt-Snapshots

OpenClaw hält eingecheckte Prompt-Snapshots für den Happy Path der Codex-Runtime unter
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` vor. Sie rendern
ausgewählte App-Server-Thread-/Turn-Parameter plus einen rekonstruierten modellgebundenen Prompt-
Layer-Stack für Telegram-Direkt-, Discord-Gruppen- und Heartbeat-Turns. Dieser Stack
enthält eine gepinnte Codex-`gpt-5.5`-Modell-Prompt-Fixture, die aus Codex'
Modellkatalog-/Cache-Form erzeugt wurde, den Codex-Happy-Path-Berechtigungs-Developer-Text,
OpenClaw-Developer-Anweisungen, turn-bezogene Collaboration-Mode-Anweisungen,
wenn OpenClaw sie bereitstellt, Benutzereingabe im Turn und Referenzen auf die dynamischen Tool-
Spezifikationen.

Aktualisieren Sie die gepinnte Codex-Modell-Prompt-Fixture mit
`pnpm prompt:snapshots:sync-codex-model`. Standardmäßig sucht das Skript nach
Codex' Runtime-Cache unter `$CODEX_HOME/models_cache.json`, dann
`~/.codex/models_cache.json` und fällt erst danach auf die Maintainer-Codex-
Checkout-Konvention unter `~/code/codex/codex-rs/models-manager/models.json` zurück. Wenn
keine dieser Quellen existiert, beendet sich der Befehl, ohne die eingecheckte
Fixture zu ändern. Übergeben Sie `--catalog <path>`, um aus einer bestimmten `models_cache.json`-
oder `models.json`-Datei zu aktualisieren.

Diese Snapshots sind weiterhin keine bytegenaue rohe OpenAI-Anfrageerfassung. Codex
kann Runtime-eigenen Workspace-Kontext wie `AGENTS.md`, Umgebungskontext,
Memories, App-/Plugin-Anweisungen und eingebaute Standard-
Collaboration-Mode-Anweisungen innerhalb der Codex-Runtime hinzufügen, nachdem OpenClaw
Thread- und Turn-Parameter gesendet hat.

Regenerieren Sie sie mit `pnpm prompt:snapshots:gen` und prüfen Sie Drift mit
`pnpm prompt:snapshots:check`. CI führt die Drift-Prüfung im zusätzlichen
Boundary-Shard aus, damit Prompt-Änderungen und Snapshot-Updates an demselben
PR hängen bleiben.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Projektkontext** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in ganz neuen Workspaces)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
kein dateispezifisches Gate greift. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn
Heartbeats für den Standardagenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte
Dateien knapp — insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung sowie häufigerer Compaction führen kann.

Wenn eine Sitzung auf dem nativen Codex-Harness läuft, lädt Codex `AGENTS.md`
über seine eigene Projekt-Dokumenterkennung. OpenClaw löst weiterhin die verbleibenden
Bootstrap-Dateien auf und leitet sie als Codex-Konfigurationsanweisungen weiter, sodass `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und
`MEMORY.md` dieselbe Workspace-Kontextrolle behalten, ohne
`AGENTS.md` zu duplizieren.

<Note>
Tägliche Dateien unter `memory/*.md` sind **nicht** Teil des normalen Bootstrap-Projektkontexts. Bei gewöhnlichen Turns werden sie bei Bedarf über die Tools `memory_search` und `memory_get` abgerufen, sodass sie nicht auf das Kontextfenster angerechnet werden, sofern das Modell sie nicht ausdrücklich liest. Bare-`/new`- und `/reset`-Turns sind die Ausnahme: Die Runtime kann aktuellen täglichen Speicher als einmaligen Startup-Kontextblock für diesen ersten Turn voranstellen.
</Note>

Große Dateien werden mit einem Marker abgeschnitten. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der gesamte injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren einen kurzen Missing-File-Marker. Wenn Kürzung
auftritt, kann OpenClaw einen knappen System-Prompt-Warnhinweis injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`). Detaillierte rohe/injizierte Zählwerte bleiben in Diagnosen wie
`/context`, `/status`, Doctor und Logs.

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Kontext des Sub-Agenten klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu mutieren oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen dedizierten Abschnitt **Aktuelles Datum und Uhrzeit**, wenn die
Zeitzone des Benutzers bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur
die **Zeitzone** (keine dynamische Uhr oder Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional einen sitzungsbezogenen Modell-
Override setzen (`model=default` löscht ihn).

Konfigurieren Sie dies mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Datum und Uhrzeit](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn geeignete Skills existieren, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Ort (Workspace, verwaltet oder gebündelt) zu laden. Wenn keine Skills geeignet sind, wird der
Skills-Abschnitt ausgelassen.

Eignung umfasst Skill-Metadaten-Gates, Runtime-Umgebungs-/Konfigurationsprüfungen
und die effektive Skill-Allowlist des Agenten, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur geeignet, wenn ihr besitzendes Plugin aktiviert ist.
Dadurch können Tool-Plugins tiefere Betriebsanleitungen bereitstellen, ohne diese
Anleitungen direkt in jede Tool-Beschreibung einzubetten.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

So bleibt der Basis-Prompt klein, während gezielte Skill-Nutzung weiterhin möglich ist.

Das Budget der Skills-Liste wird vom Skills-Subsystem verwaltet:

- Globale Standardeinstellung: `skills.limits.maxSkillsPromptChars`
- Überschreibung pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Allgemeine begrenzte Laufzeit-Auszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Dimensionierung von Skills getrennt von der Dimensionierung für Laufzeit-Lesevorgänge und -Injektionen wie `memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach der Compaction.

## Dokumentation

Der Systemprompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist, verweist er auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelte Dokumentation des npm-Pakets). Wenn lokale Dokumentation nicht verfügbar ist, fällt er auf [https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält außerdem den OpenClaw-Quellspeicherort. Git-Checkouts stellen den lokalen Source-Root bereit, damit der Agent den Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-Quell-URL und weisen den Agent an, die Quellen dort zu prüfen, wenn die Dokumentation unvollständig oder veraltet ist. Der Prompt erwähnt außerdem den öffentlichen Dokumentations-Mirror, den Community-Discord und ClawHub ([https://clawhub.ai](https://clawhub.ai)) für die Entdeckung von Skills. Er weist das Modell an, zuerst die Dokumentation zu OpenClaw-Verhalten, Befehlen, Konfiguration oder Architektur zu konsultieren und nach Möglichkeit selbst `openclaw status` auszuführen (und den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt). Speziell für die Konfiguration verweist er Agents für exakte Dokumentation und Einschränkungen auf Feldebene auf die `gateway`-Tool-Aktion `config.schema.lookup` und anschließend für umfassendere Anleitung auf `docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md`.

## Verwandt

- [Agent-Laufzeit](/de/concepts/agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
