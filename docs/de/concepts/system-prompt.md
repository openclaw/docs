---
read_when:
    - Bearbeiten von System-Prompt-Text, Werkzeugliste oder Zeit-/Heartbeat-Abschnitten
    - Ändern des Workspace-Bootstraps oder des Verhaltens der Skills-Injektion
summary: Was der System Prompt von OpenClaw enthält und wie er zusammengesetzt wird
title: System Prompt
x-i18n:
    generated_at: "2026-04-06T03:07:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f14ba7f16dda81ac973d72be05931fa246bdfa0e1068df1a84d040ebd551c236
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System Prompt

OpenClaw erstellt für jede Agent-Ausführung einen benutzerdefinierten System Prompt. Der Prompt gehört **OpenClaw** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jede Agent-Ausführung injiziert.

Provider-Plugins können cachebewusste Prompt-Hinweise beitragen, ohne den
vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Laufzeitumgebung kann:

- eine kleine Menge benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie provider-eigene Beiträge für modellfamilienspezifisches Tuning. Behalten Sie die ältere
Prompt-Mutation `before_prompt_build` für Kompatibilität oder wirklich globale Prompt-Änderungen bei,
nicht für normales Provider-Verhalten.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: strukturierte Quelle-der-Wahrheit-Erinnerung für Tools plus laufzeitbezogene Hinweise zur Tool-Nutzung.
- **Safety**: kurze Erinnerung an Schutzmaßnahmen, um machtorientiertes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf laden kann.
- **OpenClaw Self-Update**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, Konfiguration mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche
  Benutzeranfrage ausgeführt wird. Das nur für Eigentümer verfügbare Tool `gateway`
  verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich älterer `tools.bash.*`-
  Aliasse, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden soll.
- **Workspace Files (injected)**: zeigt an, dass Bootstrap-Dateien unten eingefügt sind.
- **Sandbox** (wenn aktiviert): zeigt die sandboxierte Laufzeitumgebung, Sandbox-Pfade und ob erhöhter Exec verfügbar ist.
- **Current Date & Time**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt- und Acknowledge-Verhalten.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repo-Stammverzeichnis (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis auf den Schalter `/reasoning`.

Der Abschnitt Tooling enthält außerdem laufzeitbezogene Hinweise für lang laufende Arbeit:

- verwenden Sie Cron für spätere Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  anstelle von `exec`-Sleep-Schleifen, `yieldMs`-Delay-Tricks oder wiederholtem `process`-
  Polling
- verwenden Sie `exec` / `process` nur für Befehle, die jetzt starten und im
  Hintergrund weiterlaufen
- wenn automatisches Completion-Wake aktiviert ist, starten Sie den Befehl einmal und verlassen sich auf
  den pushbasierten Wake-Pfad, wenn er Ausgabe erzeugt oder fehlschlägt
- verwenden Sie `process` für Logs, Status, Eingaben oder Eingriffe, wenn Sie
  einen laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, bevorzugen Sie `sessions_spawn`; der Abschluss eines Subagents ist
  pushbasiert und wird automatisch an den Anforderer zurückgemeldet
- pollen Sie `subagents list` / `sessions_list` nicht in einer Schleife, nur um auf den
  Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
Schritt mit `in_progress` beizubehalten und den gesamten Plan nicht nach jeder Aktualisierung zu wiederholen.

Safety-Schutzmaßnahmen im System Prompt sind beratend. Sie leiten das Verhalten des Modells, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxen und Kanal-Allowlists für harte Durchsetzung; Operatoren können diese absichtlich deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-schaltflächen weist der Laufzeit-Prompt den
Agenten jetzt an, sich zuerst auf diese native Genehmigungs-UI zu verlassen. Er sollte einen manuellen
Befehl `/approve` nur dann einschließen, wenn das Tool-Ergebnis besagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System Prompts für Sub-Agents rendern. Die Laufzeitumgebung setzt für jede Ausführung einen
`promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agents verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die grundlegende Identitätszeile zurück.

Wenn `promptMode=minimal` gilt, werden zusätzlich injizierte Prompts als **Subagent
Context** statt als **Group Chat Context** gekennzeichnet.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne sie explizit lesen zu müssen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden, andernfalls `memory.md` als Fallback in Kleinbuchstaben

Alle diese Dateien werden bei jeder Ausführung **in das Kontextfenster injiziert**, was
bedeutet, dass sie Tokens verbrauchen. Halten Sie sie kurz — insbesondere `MEMORY.md`, das
im Laufe der Zeit wachsen kann und zu unerwartet hoher Kontextnutzung und häufigerer
Kompaktierung führen kann.

> **Hinweis:** Tägliche Dateien in `memory/*.md` werden **nicht** automatisch injiziert. Auf
> sie wird bei Bedarf über die Tools `memory_search` und `memory_get` zugegriffen, daher
> zählen sie nicht gegen das Kontextfenster, solange das Modell sie nicht ausdrücklich liest.

Große Dateien werden mit einer Markierung abgeschnitten. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 20000). Der gesamte injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 150000). Fehlende Dateien injizieren eine kurze Markierung für fehlende Dateien. Wenn eine Abschneidung
auftritt, kann OpenClaw einen Warnblock in Project Context injizieren; dies wird über
`agents.defaults.bootstrapPromptTruncationWarning` gesteuert (`off`, `once`, `always`;
Standard: `once`).

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Abschneidung, plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitbehandlung

Der System Prompt enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional ein modellspezifisches Override pro Sitzung setzen
(`model=default` entfernt es wieder).

Konfiguration mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vollständige Verhaltensdetails finden Sie unter [Date & Time](/de/date-time).

## Skills

Wenn geeignete Skills vorhanden sind, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Speicherort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine Skills geeignet sind, wird der
Skills-Abschnitt ausgelassen.

Die Eignung umfasst Skill-Metadaten-Gates, Prüfungen der Laufzeitumgebung/Konfiguration
und die effektive Allowlist der Agent-Skills, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dadurch bleibt der Basis-Prompt klein und ermöglicht dennoch die gezielte Nutzung von Skills.

## Documentation

Wenn verfügbar, enthält der System Prompt einen Abschnitt **Documentation**, der auf das
lokale OpenClaw-Dokumentationsverzeichnis verweist (entweder `docs/` im Repo-Workspace oder die gebündelte npm-
Paketdokumentation) und außerdem auf den öffentlichen Spiegel, das Quell-Repo, die Community auf Discord und
ClawHub ([https://clawhub.ai](https://clawhub.ai)) zur Skill-Entdeckung hinweist. Der Prompt weist das Modell an, zuerst die lokalen Dokumente zu konsultieren
für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur, und
nach Möglichkeit selbst `openclaw status` auszuführen (den Benutzer nur zu fragen, wenn es keinen Zugriff hat).
