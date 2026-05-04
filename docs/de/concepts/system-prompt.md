---
read_when:
    - System-Prompt-Text, Tool-Liste oder Zeit-/Heartbeat-Abschnitte bearbeiten
    - Workspace-Bootstrap oder Verhalten der Skills-Injektion ändern
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: Systemanweisung
x-i18n:
    generated_at: "2026-05-04T02:23:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jede Agent-Ausführung einen benutzerdefinierten System-Prompt. Der Prompt ist **im Besitz von OpenClaw** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jede Agent-Ausführung injiziert.

Provider-Plugins können cache-bewusste Prompt-Anweisungen beitragen, ohne den vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Runtime kann:

- einen kleinen Satz benannter Kernabschnitte ersetzen (`interaction_style`, `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für modellspezifisches Tuning nach Modellfamilie. Behalten Sie die ältere `before_prompt_build`-Prompt-Mutation für Kompatibilität oder wirklich globale Prompt-Änderungen bei, nicht für normales Provider-Verhalten.

Das Overlay der OpenAI GPT-5-Familie hält die zentrale Ausführungsregel klein und ergänzt modellspezifische Hinweise zu Persona-Bindung, knapper Ausgabe, Tool-Disziplin, paralleler Suche, Abdeckung von Ergebnissen, Verifikation, fehlendem Kontext und sauberer Terminal-Tool-Nutzung.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Werkzeugeinsatz**: Erinnerung an strukturierte Tools als Source of Truth plus Runtime-Hinweise zur Tool-Nutzung.
- **Ausführungsneigung**: kompakte Hinweise zum konsequenten Abschließen: bei umsetzbaren Anfragen innerhalb des Turns handeln, fortfahren, bis die Aufgabe erledigt oder blockiert ist, schwache Tool-Ergebnisse abfangen, veränderlichen Zustand live prüfen und vor dem Finalisieren verifizieren.
- **Sicherheit**: kurze Erinnerung an Leitplanken, um machtstrebendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw-Selbstaktualisierung**: wie Konfiguration sicher mit `config.schema.lookup` geprüft, mit `config.patch` gepatcht, mit `config.apply` vollständig ersetzt und `update.run` nur auf ausdrückliche Benutzeranfrage ausgeführt wird. Das nur für Owner verfügbare Tool `gateway` verweigert außerdem das Umschreiben von `tools.exec.ask` / `tools.exec.security`, einschließlich älterer `tools.bash.*`-Aliase, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden soll.
- **Workspace-Dateien (injiziert)**: zeigt an, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): zeigt Sandbox-Runtime, Sandbox-Pfade und ob erhöhte Exec-Rechte verfügbar sind.
- **Aktuelles Datum und Uhrzeit**: benutzerlokale Uhrzeit, Zeitzone und Zeitformat.
- **Antwort-Tags**: optionale Antwort-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Ack-Verhalten, wenn Heartbeats für den Standard-Agent aktiviert sind.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repo-Root (wenn erkannt), Denkniveau (eine Zeile).
- **Reasoning**: aktuelles Sichtbarkeitsniveau + Hinweis zum /reasoning-Umschalter.

OpenClaw hält große stabile Inhalte, einschließlich **Project Context**, oberhalb der internen Prompt-Cache-Grenze. Flüchtige Kanal-/Sitzungsabschnitte wie Control-UI-Einbettungshinweise, **Messaging**, **Voice**, **Group Chat Context**, **Reactions**, **Heartbeats** und **Runtime** werden unterhalb dieser Grenze angehängt, damit lokale Backends mit Präfix-Caches das stabile Workspace-Präfix über Kanal-Turns hinweg wiederverwenden können. Tool-Beschreibungen sollten ebenso vermeiden, aktuelle Kanalnamen einzubetten, wenn das akzeptierte Schema dieses Runtime-Detail bereits enthält.

Der Abschnitt Werkzeugeinsatz enthält außerdem Runtime-Hinweise für lang laufende Arbeiten:

- Cron für zukünftige Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeit) verwenden statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund weiterlaufen
- wenn automatisches Abschluss-Wecken aktiviert ist, den Befehl einmal starten und sich auf den Push-basierten Wake-Pfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingabe oder Eingriff verwenden, wenn ein laufender Befehl geprüft werden muss
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Sub-Agents ist Push-basiert und meldet sich automatisch beim Anfragenden zurück
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Werkzeugeinsatz das Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen `in_progress`-Schritt beizubehalten und nach jeder Aktualisierung nicht den gesamten Plan zu wiederholen.

Sicherheitsleitplanken im System-Prompt sind beratend. Sie lenken das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Kanal-Allowlisten für harte Durchsetzung; Operatoren können diese bewusst deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-Schaltflächen weist der Runtime-Prompt den Agent jetzt an, zuerst diese native Genehmigungs-UI zu verwenden. Er sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agents rendern. Die Runtime setzt für jede Ausführung einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agents verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**, **Messaging**, **Silent Replies** und **Heartbeats** weg. Werkzeugeinsatz, **Safety**, Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und injizierter Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal` gilt, werden zusätzliche injizierte Prompts als **Subagent Context** statt **Group Chat Context** gekennzeichnet.

Für Kanal-Auto-Reply-Ausführungen kann OpenClaw den generischen Abschnitt **Silent Replies** weglassen, wenn der Direkt-/Gruppenchatkontext bereits das aufgelöste konversationsspezifische `NO_REPLY`-Verhalten enthält. Dadurch wird vermieden, Token-Mechanik sowohl im globalen System-Prompt als auch im Kanalkontext zu wiederholen.

## Prompt-Snapshots

OpenClaw hält committete Prompt-Snapshots für den glücklichen Pfad der Codex-Runtime unter `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` vor. Sie rendern ausgewählte App-Server-Thread-/Turn-Parameter plus einen rekonstruierten modellgebundenen Prompt-Layer-Stack für Telegram-Direkt-, Discord-Gruppen- und Heartbeat-Turns. Dieser Stack enthält eine gepinnte Codex-`gpt-5.5`-Modell-Prompt-Fixture, die aus der Modellkatalog-/Cache-Form von Codex generiert wurde, den Codex-Entwicklertext für Berechtigungen im glücklichen Pfad, OpenClaw-Entwickleranweisungen, turn-bezogene Anweisungen zum Kollaborationsmodus, wenn OpenClaw sie bereitstellt, Benutzereingaben im Turn und Verweise auf die dynamischen Tool-Spezifikationen.

Aktualisieren Sie die gepinnte Codex-Modell-Prompt-Fixture mit `pnpm prompt:snapshots:sync-codex-model`. Standardmäßig sucht das Skript Codex' Runtime-Cache unter `$CODEX_HOME/models_cache.json`, dann unter `~/.codex/models_cache.json`, und fällt erst danach auf die Maintainer-Codex-Checkout-Konvention unter `~/code/codex/codex-rs/models-manager/models.json` zurück. Wenn keine dieser Quellen existiert, beendet sich der Befehl, ohne die committete Fixture zu ändern. Übergeben Sie `--catalog <path>`, um aus einer bestimmten Datei `models_cache.json` oder `models.json` zu aktualisieren.

Diese Snapshots sind weiterhin keine bytegenaue Roh-Erfassung einer OpenAI-Anfrage. Codex kann innerhalb der Codex-Runtime, nachdem OpenClaw Thread- und Turn-Parameter gesendet hat, Runtime-eigenen Workspace-Kontext wie `AGENTS.md`, Umgebungskontext, Erinnerungen, App-/Plugin-Anweisungen und integrierte Default-Anweisungen zum Kollaborationsmodus hinzufügen.

Regenerieren Sie sie mit `pnpm prompt:snapshots:gen` und prüfen Sie Abweichungen mit `pnpm prompt:snapshots:check`. CI führt die Drift-Prüfung im zusätzlichen Boundary-Shard aus, damit Prompt-Änderungen und Snapshot-Aktualisierungen im selben PR zusammenbleiben.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur bei brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern kein dateispezifisches Gate greift. `HEARTBEAT.md` wird bei normalen Ausführungen weggelassen, wenn Heartbeats für den Standard-Agent deaktiviert sind oder `agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte Dateien knapp, insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu unerwartet hoher Kontextnutzung sowie häufigerer Compaction führen kann.

Wenn eine Sitzung auf dem nativen Codex-Harness läuft, lädt Codex `AGENTS.md` über seine eigene Projekt-Dokumenterkennung. OpenClaw löst weiterhin die übrigen Bootstrap-Dateien auf und leitet sie als Codex-Konfigurationsanweisungen weiter, sodass `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md` dieselbe Workspace-Kontextrolle behalten, ohne `AGENTS.md` zu duplizieren.

<Note>
Tägliche Dateien unter `memory/*.md` sind **nicht** Teil des normalen Bootstrap-Project Context. Bei gewöhnlichen Turns werden sie bei Bedarf über die Tools `memory_search` und `memory_get` abgerufen, sodass sie nicht gegen das Kontextfenster zählen, solange das Modell sie nicht ausdrücklich liest. Reine `/new`- und `/reset`-Turns sind die Ausnahme: Die Runtime kann aktuelle tägliche Erinnerungen als einmaligen Startup-Kontextblock für diesen ersten Turn voranstellen.
</Note>

Große Dateien werden mit einer Markierung gekürzt. Die maximale Größe pro Datei wird durch `agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der gesamte injizierte Bootstrap-Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Fehlende Dateien injizieren eine kurze Fehlende-Datei-Markierung. Wenn Kürzung auftritt, kann OpenClaw einen knappen System-Prompt-Warnhinweis injizieren; steuern Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard: `once`). Detaillierte Roh-/Injektionszählungen bleiben in Diagnosen wie `/context`, `/status`, doctor und Logs.

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem [SOUL.md-Persönlichkeitsleitfaden](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen eigenen Abschnitt **Aktuelles Datum und Uhrzeit**, wenn die Zeitzone des Benutzers bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch die **Zeitzone** (keine dynamische Uhrzeit oder kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte enthält eine Zeitstempelzeile. Dasselbe Tool kann optional ein sitzungsbezogenes Modell-Override setzen (`model=default` löscht es).

Konfigurieren Sie mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Datum und Uhrzeit](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn geeignete Skills vorhanden sind, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills** (`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten Speicherort (Workspace, verwaltet oder gebündelt) zu laden. Wenn keine Skills geeignet sind, wird der Abschnitt Skills weggelassen.

Die Eignung umfasst Skill-Metadaten-Gates, Runtime-Umgebungs-/Konfigurationsprüfungen und die effektive Skill-Allowlist des Agent, wenn `agents.defaults.skills` oder `agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur geeignet, wenn ihr besitzendes Plugin aktiviert ist. Dadurch können Tool-Plugins tiefere Betriebsleitfäden bereitstellen, ohne all diese Hinweise direkt in jede Tool-Beschreibung einzubetten.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dies hält den Basis-Prompt klein und ermöglicht dennoch gezielte Skill-Nutzung.

Das Budget der Skills-Liste gehört dem Skills-Subsystem:

- Globale Standardeinstellung: `skills.limits.maxSkillsPromptChars`
- Agent-spezifische Überschreibung: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Runtime-Auszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größenbemessung für Skills getrennt von der Größenbemessung für Runtime-Lesevorgänge und -Injektionen, etwa `memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach der Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist, verweist er auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelte npm-Paketdokumentation). Wenn lokale Dokumentation nicht verfügbar ist, greift er auf [https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält auch den Speicherort des OpenClaw-Quellcodes. Git-Checkouts stellen das lokale Quell-Root bereit, damit der Agent den Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-Quell-URL und weisen den Agent an, den Quellcode dort zu prüfen, wenn die Dokumentation unvollständig oder veraltet ist. Der Prompt erwähnt außerdem die öffentliche Dokumentationsspiegelung, den Community-Discord und ClawHub ([https://clawhub.ai](https://clawhub.ai)) für die Ermittlung von Skills. Er weist das Modell an, bei OpenClaw-Verhalten, Befehlen, Konfiguration oder Architektur zuerst die Dokumentation zu konsultieren und nach Möglichkeit selbst `openclaw status` auszuführen (und den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt). Speziell für die Konfiguration verweist er Agenten zuerst auf die `gateway`-Tool-Aktion `config.schema.lookup` für exakte Dokumentation und Einschränkungen auf Feldebene, anschließend auf `docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md` für umfassendere Anleitung.

## Verwandte Themen

- [Agent-Laufzeitumgebung](/de/concepts/agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
