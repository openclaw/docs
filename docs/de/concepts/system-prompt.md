---
read_when:
    - System-Prompt-Text, Tools-Liste oder Zeit-/Heartbeat-Abschnitte bearbeiten
    - Ändern des Workspace-Bootstraps oder des Verhaltens der Skills-Injektion
summary: Was der OpenClaw-Systemprompt enthält und wie er zusammengesetzt wird
title: Systemanweisung
x-i18n:
    generated_at: "2026-05-02T23:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agent-Lauf einen benutzerdefinierten System-Prompt. Der Prompt ist **OpenClaw-owned** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agent-Lauf injiziert.

Provider-Plugins können cache-bewusste Prompt-Anweisungen beitragen, ohne den
vollständigen OpenClaw-owned Prompt zu ersetzen. Die Provider-Runtime kann:

- eine kleine Gruppe benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für modellfamilien-spezifisches Tuning. Behalten Sie die alte
`before_prompt_build`-Prompt-Mutation für Kompatibilität oder wirklich globale Prompt-
Änderungen bei, nicht für normales Provider-Verhalten.

Das OpenAI-GPT-5-Familien-Overlay hält die zentrale Ausführungsregel klein und fügt
modellspezifische Hinweise für Persona-Latching, knappe Ausgabe, Werkzeugdisziplin,
paralleles Nachschlagen, Abdeckung von Arbeitsergebnissen, Verifikation, fehlenden Kontext und
Terminal-Tool-Hygiene hinzu.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Werkzeuge**: Erinnerung an die strukturierte Tool-Quelle der Wahrheit sowie Runtime-Hinweise zur Tool-Nutzung.
- **Ausführungsbias**: kompakte Follow-through-Hinweise: bei
  umsetzbaren Anfragen im aktuellen Turn handeln, fortfahren, bis die Aufgabe erledigt oder blockiert ist, schwache Tool-
  Ergebnisse ausgleichen, veränderlichen Zustand live prüfen und vor dem Abschließen verifizieren.
- **Sicherheit**: kurze Guardrail-Erinnerung, machtstrebendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw-Selbstaktualisierung**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf explizite Benutzeranfrage
  ausgeführt wird. Das owner-only `gateway`-Tool verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich alter `tools.bash.*`-
  Aliasse, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Arbeitsbereich**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden soll.
- **Arbeitsbereichsdateien (injiziert)**: zeigt an, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): zeigt sandboxed Runtime, Sandbox-Pfade und ob erhöhte Exec-Rechte verfügbar sind.
- **Aktuelles Datum & Uhrzeit**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Antwort-Tags**: optionale Antwort-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standard-Agent aktiviert sind.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repo-Root (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis zum /reasoning-Umschalter.

OpenClaw hält große stabile Inhalte, einschließlich **Projektkontext**, oberhalb der
internen Prompt-Cache-Grenze. Veränderliche Channel-/Session-Abschnitte wie
Control-UI-Einbettungshinweise, **Messaging**, **Voice**, **Gruppenchat-Kontext**,
**Reactions**, **Heartbeats** und **Runtime** werden unterhalb dieser Grenze angehängt,
damit lokale Backends mit Präfix-Caches das stabile Arbeitsbereichspräfix
über Channel-Turns hinweg wiederverwenden können. Tool-Beschreibungen sollten ebenfalls vermeiden, aktuelle
Channel-Namen einzubetten, wenn das akzeptierte Schema dieses Runtime-Detail bereits enthält.

Der Abschnitt Werkzeuge enthält außerdem Runtime-Hinweise für lang laufende Arbeit:

- Verwenden Sie Cron für künftige Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- verwenden Sie `exec` / `process` nur für Befehle, die jetzt starten und
  im Hintergrund weiterlaufen
- wenn automatisches Aufwachen bei Abschluss aktiviert ist, starten Sie den Befehl einmal und verlassen Sie sich auf
  den push-basierten Wake-Pfad, wenn er Ausgabe erzeugt oder fehlschlägt
- verwenden Sie `process` für Logs, Status, Eingaben oder Eingriffe, wenn Sie
  einen laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, bevorzugen Sie `sessions_spawn`; der Abschluss von Sub-Agents ist
  push-basiert und meldet sich automatisch beim Anfragenden zurück
- pollen Sie `subagents list` / `sessions_list` nicht in einer Schleife, nur um auf
  den Abschluss zu warten

Wenn das experimentelle `update_plan`-Tool aktiviert ist, weist Werkzeuge das
Modell außerdem an, es nur für nicht triviale mehrschrittige Arbeit zu verwenden, genau einen
`in_progress`-Schritt beizubehalten und den gesamten Plan nicht nach jeder Aktualisierung zu wiederholen.

Sicherheits-Guardrails im System-Prompt sind beratend. Sie leiten das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Channel-Allowlists für harte Durchsetzung; Betreiber können diese absichtlich deaktivieren.

Auf Channels mit nativen Genehmigungskarten/-Buttons weist der Runtime-Prompt den
Agent jetzt an, zuerst diese native Genehmigungs-UI zu verwenden. Er sollte nur dann einen manuellen
`/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agents rendern. Die Runtime setzt für
jeden Lauf einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agents verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** aus. Werkzeuge, **Sicherheit**,
  Arbeitsbereich, Sandbox, Aktuelles Datum & Uhrzeit (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal` gilt, werden zusätzlich injizierte Prompts als **Subagent
Context** statt **Group Chat Context** beschriftet.

Für Channel-Auto-Reply-Läufe kann OpenClaw den generischen Abschnitt **Silent Replies**
weglassen, wenn der Direkt-/Gruppenchat-Kontext bereits das aufgelöste
konversationsspezifische `NO_REPLY`-Verhalten enthält. Dadurch wird vermieden, Token-Mechaniken
sowohl im globalen System-Prompt als auch im Channel-Kontext zu wiederholen.

## Prompt-Snapshots

OpenClaw hält committete Prompt-Snapshots für den Happy Path der Codex-Runtime unter
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Sie rendern
ausgewählte App-Server-Thread-/Turn-Parameter plus einen rekonstruierten modellgebundenen Prompt-
Layer-Stack für Telegram-Direkt-, Discord-Gruppen- und Heartbeat-Turns. Dieser Stack
enthält ein gepinntes Codex-`gpt-5.5`-Modell-Prompt-Fixture, das aus Codex’
Modellkatalog-/Cache-Form erzeugt wurde, den Codex-Happy-Path-Berechtigungs-Developer-Text,
OpenClaw-Developer-Anweisungen, Benutzereingabe im Turn und Referenzen auf die dynamischen
Tool-Spezifikationen.

Aktualisieren Sie das gepinnte Codex-Modell-Prompt-Fixture mit
`pnpm prompt:snapshots:sync-codex-model`. Standardmäßig sucht das Skript nach
Codex’ Runtime-Cache unter `$CODEX_HOME/models_cache.json`, dann unter
`~/.codex/models_cache.json` und fällt erst danach auf die Maintainer-Codex-
Checkout-Konvention unter `~/code/codex/codex-rs/models-manager/models.json` zurück. Wenn
keine dieser Quellen existiert, beendet sich der Befehl, ohne das committete
Fixture zu ändern. Übergeben Sie `--catalog <path>`, um aus einer bestimmten `models_cache.json`-
oder `models.json`-Datei zu aktualisieren.

Diese Snapshots sind weiterhin keine bytegenaue Roh-Erfassung einer OpenAI-Anfrage. Codex
kann Runtime-eigenen Arbeitsbereichskontext wie `AGENTS.md`, Umgebungs-
kontext, Erinnerungen, App-/Plugin-Anweisungen und künftige Collaboration-Mode-
Anweisungen innerhalb der Codex-Runtime hinzufügen, nachdem OpenClaw Thread- und Turn-
Parameter gesendet hat.

Regenerieren Sie sie mit `pnpm prompt:snapshots:gen` und prüfen Sie Drift mit
`pnpm prompt:snapshots:check`. CI führt die Drift-Prüfung im zusätzlichen
Boundary-Shard aus, damit Prompt-Änderungen und Snapshot-Aktualisierungen am selben
PR hängen bleiben.

## Arbeitsbereich-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Projektkontext** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesezugriffe zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur bei ganz neuen Arbeitsbereichen)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
kein dateispezifisches Gate gilt. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn
Heartbeats für den Standard-Agent deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte
Dateien knapp — besonders `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung sowie häufigerer Compaction führen kann.

Wenn eine Session auf dem nativen Codex-Harness läuft, lädt Codex `AGENTS.md`
über seine eigene Projekt-Dokumenterkennung. OpenClaw löst weiterhin die übrigen
Bootstrap-Dateien auf und leitet sie als Codex-Konfigurationsanweisungen weiter, sodass `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und
`MEMORY.md` dieselbe Arbeitsbereich-Kontextrolle behalten, ohne
`AGENTS.md` zu duplizieren.

<Note>
Tägliche `memory/*.md`-Dateien sind **nicht** Teil des normalen Bootstrap-Projektkontexts. Bei gewöhnlichen Turns wird bei Bedarf über die Tools `memory_search` und `memory_get` darauf zugegriffen, sodass sie nicht auf das Kontextfenster angerechnet werden, sofern das Modell sie nicht explizit liest. Reine `/new`- und `/reset`-Turns sind die Ausnahme: Die Runtime kann aktuellen täglichen Speicher als einmaligen Startkontextblock für diesen ersten Turn voranstellen.
</Note>

Große Dateien werden mit einer Markierung abgeschnitten. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der gesamte injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren eine kurze Missing-File-Markierung. Wenn Kürzung
auftritt, kann OpenClaw einen Warnblock im Projektkontext injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Sub-Agent-Sessions injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitverarbeitung

Der System-Prompt enthält einen eigenen Abschnitt **Aktuelles Datum & Uhrzeit**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhr oder kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine Modellauswahl pro Session
setzen (`model=default` löscht sie).

Konfiguration mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vollständige Verhaltensdetails finden Sie unter [Datum & Uhrzeit](/de/date-time).

## Skills

Wenn geeignete Skills existieren, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgelisteten
Ort zu laden (Arbeitsbereich, verwaltet oder gebündelt). Wenn keine Skills geeignet sind, wird der
Skills-Abschnitt ausgelassen.

Die Eignung umfasst Skill-Metadaten-Gates, Runtime-Umgebungs-/Konfigurationsprüfungen
und die effektive Skill-Allowlist des Agent, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur geeignet, wenn ihr besitzendes Plugin aktiviert ist.
Dadurch können Tool-Plugins tiefere Betriebsanleitungen bereitstellen, ohne alle
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

Das hält den Basis-Prompt klein und ermöglicht dennoch gezielte Skill-Nutzung.

Das Budget der Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Agent-spezifische Überschreibung: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Runtime-Auszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Aufteilung hält die Dimensionierung von Skills getrennt von der Dimensionierung für das Lesen/Injizieren zur Laufzeit, etwa `memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach der Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist, verweist er auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelte npm-Paketdokumentation). Wenn keine lokale Dokumentation verfügbar ist, fällt er auf [https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält außerdem den Speicherort des OpenClaw-Quellcodes. Git-Checkouts stellen das lokale Source-Root bereit, damit der Agent Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-Quell-URL und weisen den Agenten an, dort den Quellcode zu prüfen, wenn die Dokumentation unvollständig oder veraltet ist. Der Prompt erwähnt außerdem die öffentliche Dokumentationsspiegelung, den Community-Discord und ClawHub ([https://clawhub.ai](https://clawhub.ai)) zur Entdeckung von Skills. Er weist das Modell an, zuerst die Dokumentation zu OpenClaw-Verhalten, -Befehlen, -Konfiguration oder -Architektur zu konsultieren und nach Möglichkeit selbst `openclaw status` auszuführen (und den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt). Speziell für die Konfiguration verweist er Agenten zuerst auf die `gateway`-Tool-Aktion `config.schema.lookup` für exakte Dokumentation und Einschränkungen auf Feldebene, anschließend auf `docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md` für weiterführende Anleitung.

## Verwandte Themen

- [Agent-Laufzeitumgebung](/de/concepts/agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
