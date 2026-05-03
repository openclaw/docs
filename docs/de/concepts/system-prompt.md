---
read_when:
    - Bearbeiten von System-Prompt-Text, Tool-Liste oder Zeit-/Heartbeat-Abschnitten
    - Verhalten der Arbeitsbereichs-Initialisierung oder der Skills-Injektion ändern
summary: Was der OpenClaw-Systemprompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-05-03T21:30:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agentenlauf einen benutzerdefinierten System-Prompt. Der Prompt ist **OpenClaw-eigen** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agentenlauf injiziert.

Provider-Plugins können cache-bewusste Prompt-Anweisungen beitragen, ohne den vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Runtime kann:

- einen kleinen Satz benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für modellspezifische Abstimmung nach Modellfamilie. Behalten Sie die ältere
`before_prompt_build`-Prompt-Mutation für Kompatibilität oder wirklich globale Prompt-Änderungen bei, nicht für normales Provider-Verhalten.

Das Overlay der OpenAI GPT-5-Familie hält die zentrale Ausführungsregel klein und ergänzt
modellspezifische Hinweise zu Persona-Verankerung, knapper Ausgabe, Tool-Disziplin,
paralleler Suche, Abdeckung von Lieferobjekten, Verifizierung, fehlendem Kontext und
Terminal-Tool-Hygiene.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Werkzeuge**: Erinnerung an die strukturierte Tool-Quelle der Wahrheit plus Laufzeit-Anweisungen zur Tool-Nutzung.
- **Ausführungspräferenz**: kompakte Follow-through-Anweisungen: innerhalb des Turns auf
  umsetzbare Anfragen reagieren, fortfahren, bis die Aufgabe erledigt oder blockiert ist, schwache Tool-
  Ergebnisse abfangen, veränderlichen Zustand live prüfen und vor der Finalisierung verifizieren.
- **Sicherheit**: kurze Guardrail-Erinnerung, machtstrebendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw-Selbstaktualisierung**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, Konfiguration mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzeranfrage
  ausgeführt wird. Das nur für Owner verfügbare `gateway`-Tool verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich älterer `tools.bash.*`-
  Aliasse, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Arbeitsbereich**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden sollte.
- **Arbeitsbereichsdateien (injiziert)**: zeigt an, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): zeigt sandboxed Runtime, Sandbox-Pfade und ob erhöhte Exec-Rechte verfügbar sind.
- **Aktuelles Datum & Uhrzeit**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Antwort-Tags**: optionale Antwort-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repo-Root (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis auf den /reasoning-Schalter.

OpenClaw hält große stabile Inhalte, einschließlich **Projektkontext**, oberhalb der
internen Prompt-Cache-Grenze. Flüchtige kanal-/sitzungsbezogene Abschnitte wie
Control-UI-Einbettungshinweise, **Messaging**, **Voice**, **Gruppenchat-Kontext**,
**Reaktionen**, **Heartbeats** und **Runtime** werden unterhalb dieser Grenze angehängt,
damit lokale Backends mit Präfix-Caches das stabile Arbeitsbereichspräfix
über Kanal-Turns hinweg wiederverwenden können. Tool-Beschreibungen sollten ebenso vermeiden,
aktuelle Kanalnamen einzubetten, wenn das akzeptierte Schema dieses Laufzeitdetail bereits enthält.

Der Abschnitt Werkzeuge enthält außerdem Laufzeit-Anweisungen für länger laufende Arbeit:

- Cron für zukünftige Nachverfolgung verwenden (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund
  weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf
  den push-basierten Aufweckpfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingabe oder Eingriffe verwenden, wenn Sie einen
  laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Sub-Agenten ist
  push-basiert und meldet sich automatisch beim Anforderer zurück
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf
  Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Werkzeuge das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
`in_progress`-Schritt beizubehalten und nach jeder Aktualisierung nicht den gesamten Plan zu wiederholen.

Sicherheits-Guardrails im System-Prompt sind beratend. Sie leiten das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Kanal-Allowlists für harte Durchsetzung; Operatoren können diese absichtlich deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-schaltflächen weist der Runtime-Prompt den
Agenten jetzt an, zuerst diese native Genehmigungs-UI zu verwenden. Er sollte nur dann einen manuellen
`/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agenten rendern. Die Runtime setzt für jeden Lauf einen
`promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle obigen Abschnitte.
- `minimal`: wird für Sub-Agenten verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** aus. Werkzeuge, **Sicherheit**,
  Arbeitsbereich, Sandbox, Aktuelles Datum & Uhrzeit (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal` gilt, werden zusätzliche injizierte Prompts als **Subagent
Context** statt als **Group Chat Context** bezeichnet.

Für automatische Kanalantwort-Läufe kann OpenClaw den generischen Abschnitt **Silent Replies**
auslassen, wenn der Direkt-/Gruppenchat-Kontext bereits das aufgelöste
konversationsspezifische `NO_REPLY`-Verhalten enthält. Dadurch wird vermieden, Token-Mechanik
sowohl im globalen System-Prompt als auch im Kanalkontext zu wiederholen.

## Prompt-Snapshots

OpenClaw hält committete Prompt-Snapshots für den Happy Path der Codex-Runtime unter
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Sie rendern
ausgewählte App-Server-Thread-/Turn-Parameter plus einen rekonstruierten modellgebundenen Prompt-
Layer-Stack für Telegram-Direkt-, Discord-Gruppen- und Heartbeat-Turns. Dieser Stack
enthält eine gepinnte Codex-`gpt-5.5`-Modell-Prompt-Fixture, die aus Codex'
Modellkatalog-/Cache-Form erzeugt wurde, den Codex-Happy-Path-Berechtigungs-Developer-Text,
OpenClaw-Developer-Anweisungen, turn-bezogene Collaboration-Mode-Anweisungen,
wenn OpenClaw sie bereitstellt, Benutzereingaben des Turns und Verweise auf die dynamischen Tool-
Spezifikationen.

Aktualisieren Sie die gepinnte Codex-Modell-Prompt-Fixture mit
`pnpm prompt:snapshots:sync-codex-model`. Standardmäßig sucht das Skript nach
Codex' Runtime-Cache unter `$CODEX_HOME/models_cache.json`, dann unter
`~/.codex/models_cache.json`, und fällt erst dann auf die Maintainer-Codex-
Checkout-Konvention unter `~/code/codex/codex-rs/models-manager/models.json` zurück. Wenn
keine dieser Quellen existiert, beendet sich der Befehl, ohne die committete
Fixture zu ändern. Übergeben Sie `--catalog <path>`, um aus einer bestimmten Datei `models_cache.json`
oder `models.json` zu aktualisieren.

Diese Snapshots sind weiterhin keine bytegenaue rohe OpenAI-Request-Erfassung. Codex
kann runtime-eigenen Arbeitsbereichskontext wie `AGENTS.md`, Umgebungskontext,
Memories, App-/Plugin-Anweisungen und integrierte Default-
Collaboration-Mode-Anweisungen innerhalb der Codex-Runtime ergänzen, nachdem OpenClaw
Thread- und Turn-Parameter gesendet hat.

Regenerieren Sie sie mit `pnpm prompt:snapshots:gen` und verifizieren Sie Drift mit
`pnpm prompt:snapshots:check`. CI führt die Drift-Prüfung im zusätzlichen
Boundary-Shard aus, damit Prompt-Änderungen und Snapshot-Aktualisierungen im selben
PR verbunden bleiben.

## Arbeitsbereichs-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Projektkontext** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in ganz neuen Arbeitsbereichen)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
kein dateispezifisches Gate greift. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn
Heartbeats für den Standardagenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte
Dateien knapp — insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung sowie häufigerer Compaction führen kann.

Wenn eine Sitzung auf dem nativen Codex-Harness läuft, lädt Codex `AGENTS.md`
über seine eigene Projektdokument-Erkennung. OpenClaw löst weiterhin die übrigen
Bootstrap-Dateien auf und leitet sie als Codex-Konfigurationsanweisungen weiter, sodass `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und
`MEMORY.md` dieselbe Arbeitsbereichskontext-Rolle behalten, ohne
`AGENTS.md` zu duplizieren.

<Note>
Tägliche Dateien `memory/*.md` sind **nicht** Teil des normalen Bootstrap-Projektkontexts. Bei gewöhnlichen Turns werden sie bei Bedarf über die Tools `memory_search` und `memory_get` abgerufen, sodass sie nicht auf das Kontextfenster angerechnet werden, sofern das Modell sie nicht explizit liest. Bloße `/new`- und `/reset`-Turns sind die Ausnahme: Die Runtime kann aktuelle tägliche Memory als einmaligen Startkontextblock für diesen ersten Turn voranstellen.
</Note>

Große Dateien werden mit einer Markierung gekürzt. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der gesamte injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren eine kurze Markierung für fehlende Dateien. Wenn Kürzung
auftritt, kann OpenClaw einen Warnblock in den Projektkontext injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die injizierten
Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona austauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh gegenüber injiziert, Kürzung plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitverarbeitung

Der System-Prompt enthält einen eigenen Abschnitt **Aktuelles Datum & Uhrzeit**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhr oder kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine sitzungsbezogene Modell-
Überschreibung setzen (`model=default` löscht sie).

Konfigurieren mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Datum & Uhrzeit](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn zulässige Skills existieren, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Ort zu laden (Arbeitsbereich, verwaltet oder gebündelt). Wenn keine Skills zulässig sind, wird der
Skills-Abschnitt ausgelassen.

Die Zulässigkeit umfasst Skill-Metadaten-Gates, Prüfungen der Runtime-Umgebung/-Konfiguration
und die effektive Skill-Allowlist des Agenten, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur zulässig, wenn ihr zugehöriges Plugin aktiviert ist.
Dadurch können Tool-Plugins tiefere Betriebsanleitungen bereitstellen, ohne all diese
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

Das Budget für die Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Agentenspezifische Überschreibung: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Runtime-Auszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Aufteilung hält die Größenbemessung von Skills getrennt von der Größenbemessung für Runtime-Lesen/-Injektion, etwa `memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach der Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist, verweist er auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelte npm-Paketdokumentation). Wenn lokale Dokumentation nicht verfügbar ist, fällt er auf [https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält auch den Speicherort des OpenClaw-Quellcodes. Git-Checkouts stellen das lokale Quell-Root bereit, damit der Agent den Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-Quell-URL und weisen den Agenten an, den Quellcode dort zu prüfen, wenn die Dokumentation unvollständig oder veraltet ist. Der Prompt erwähnt außerdem den öffentlichen Dokumentationsspiegel, den Community-Discord und ClawHub ([https://clawhub.ai](https://clawhub.ai)) zur Entdeckung von Skills. Er weist das Modell an, für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur zuerst die Dokumentation zu konsultieren und nach Möglichkeit selbst `openclaw status` auszuführen (und den Benutzer nur zu fragen, wenn kein Zugriff besteht). Speziell für die Konfiguration verweist er Agenten für exakte feldbezogene Dokumentation und Einschränkungen zuerst auf die `gateway`-Tool-Aktion `config.schema.lookup` und anschließend auf `docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md` für breitere Orientierung.

## Verwandt

- [Agent-Runtime](/de/concepts/agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Context Engine](/de/concepts/context-engine)
