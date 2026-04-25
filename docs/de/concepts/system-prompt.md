---
read_when:
    - Text des System-Prompts, Tool-Liste oder Abschnitte zu Zeit/Heartbeat bearbeiten
    - Verhalten von Workspace-Bootstrap oder Skill-Injektion ändern
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-04-25T13:45:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw erstellt für jeden Agent-Lauf einen benutzerdefinierten System-Prompt. Der Prompt gehört **OpenClaw** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agent-Lauf injiziert.

Provider-Plugins können cache-fähige Prompt-Hinweise beisteuern, ohne den
vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Laufzeit kann:

- eine kleine Menge benannter Core-Abschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für modellfamilien-spezifisches Tuning. Behalten Sie die veraltete
Prompt-Mutation `before_prompt_build` aus Kompatibilitätsgründen oder für wirklich globale Prompt-
Änderungen bei, nicht für normales Provider-Verhalten.

Das Overlay für die OpenAI-GPT-5-Familie hält die Core-Ausführungsregel klein und ergänzt
modellspezifische Hinweise für Persona-Bindung, knappe Ausgabe, Tool-Disziplin,
paralleles Nachschlagen, Abdeckung der Ergebnisse, Verifizierung, fehlenden Kontext und
Hygiene bei Terminal-Tools.

## Struktur

Der Prompt ist bewusst kompakt und verwendet feste Abschnitte:

- **Tooling**: strukturierter Hinweis auf die Tool-Quelle der Wahrheit plus Laufzeit-Hinweise zur Tool-Verwendung.
- **Execution Bias**: kompakte Hinweise zum Durchziehen: in derselben Runde auf
  umsetzbare Anfragen reagieren, weitermachen bis erledigt oder blockiert, sich von schwachen Tool-
  Ergebnissen erholen, veränderlichen Zustand live prüfen und vor dem Abschließen verifizieren.
- **Safety**: kurze Guardrail-Erinnerung, machtsuchendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw Self-Update**: wie die Konfiguration sicher mit
  `config.schema.lookup` geprüft, mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzeranfrage ausgeführt wird. Das Tool `gateway`, das nur für Owner bestimmt ist, verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich veralteter `tools.bash.*`-
  Aliase, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden sollte.
- **Workspace Files (injected)**: weist darauf hin, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): weist auf die sandboxed Laufzeit, Sandbox-Pfade und darauf hin, ob erhöhter Exec verfügbar ist.
- **Current Date & Time**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standard-Agenten aktiviert sind.
- **Runtime**: Host, OS, Node, Modell, Repo-Root (wenn erkannt), thinking-Stufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis zum Umschalten mit /reasoning.

Der Abschnitt Tooling enthält außerdem Laufzeit-Hinweise für lang laufende Arbeit:

- Cron für zukünftige Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Schleifen mit sleep, `yieldMs`-Delay-Tricks oder wiederholtem `process`-
  Polling verwenden
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im
  Hintergrund weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf
  den Push-basierten Wake-Pfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingaben oder Eingriffe verwenden, wenn Sie einen laufenden Befehl
  prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Subagenten ist
  Push-basiert und wird automatisch an den Anfragenden angekündigt
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf den
  Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
Schritt `in_progress` beizubehalten und nicht nach jedem Update den gesamten Plan zu wiederholen.

Safety-Guardrails im System-Prompt sind beratend. Sie leiten das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Kanal-Allowlists für harte Durchsetzung; Operatoren können diese absichtlich deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-Buttons weist der Laufzeit-Prompt den
Agenten jetzt an, sich zuerst auf diese native Genehmigungs-UI zu verlassen. Einen manuellen
`/approve`-Befehl sollte er nur einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
die manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Subagenten rendern. Die Laufzeit setzt für jeden
Lauf einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle obigen Abschnitte.
- `minimal`: wird für Subagenten verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die grundlegende Identitätszeile zurück.

Wenn `promptMode=minimal`, werden zusätzlich injizierte Prompts als **Subagent
Context** statt als **Group Chat Context** bezeichnet.

## Injektion des Workspace-Bootstraps

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur bei brandneuen Workspaces)
- `MEMORY.md`, falls vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
keine dateispezifische Sperre greift. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn
Heartbeats für den Standard-Agenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte
Dateien knapp — insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung und häufigerer Compaction führen kann.

> **Hinweis:** Tägliche Dateien in `memory/*.md` sind **kein** Teil des normalen Bootstrap-
> Project Context. Bei gewöhnlichen Turns wird auf sie bei Bedarf über die
> Tools `memory_search` und `memory_get` zugegriffen, sodass sie nicht gegen das
> Kontextfenster zählen, sofern das Modell sie nicht explizit liest. Einfache `/new`-
> und `/reset`-Turns sind die Ausnahme: Die Laufzeit kann für diesen ersten Turn
> aktuelle tägliche Memory als einmaligen Startup-Kontextblock voranstellen.

Große Dateien werden mit einer Markierung abgeschnitten. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der insgesamt injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren eine kurze Missing-File-Markierung. Wenn Abschneiden
auftritt, kann OpenClaw einen Warnblock in Project Context injizieren; dies steuern Sie mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Subagent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Subagent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um
die injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[Persönlichkeitsleitfaden für SOUL.md](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Abschneiden sowie Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhrzeit oder Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Zeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional ein Modell-
Override pro Sitzung setzen (`model=default` löscht es).

Konfigurieren mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vollständige Verhaltensdetails finden Sie unter [Date & Time](/de/date-time).

## Skills

Wenn berechtigte Skills vorhanden sind, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die für jede Skill den **Dateipfad** enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Ort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine Skills berechtigt sind, wird der
Abschnitt Skills ausgelassen.

Die Berechtigung umfasst Skill-Metadaten-Sperren, Prüfungen der Laufzeitumgebung/Konfiguration
und die effektive Agent-Skill-Allowlist, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Von Plugins gebündelte Skills sind nur berechtigt, wenn ihr besitzendes Plugin aktiviert ist.
Dadurch können Tool-Plugins tiefere Betriebsleitfäden bereitstellen, ohne all diese
Hinweise direkt in jede Tool-Beschreibung einzubetten.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dadurch bleibt der Basis-Prompt klein, während gezielte Skill-Nutzung weiterhin möglich ist.

Das Budget für die Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Override pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Laufzeitauszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größenbestimmung für Skills getrennt von der Größenbestimmung für Laufzeit-Lese-/Injektionsvorgänge wie
`memory_get`, Live-Tool-Ergebnissen und dem Aktualisieren von AGENTS.md nach Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Documentation**. Wenn lokale Dokumentation verfügbar ist,
verweist er auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelte npm-
Paketdokumentation). Wenn keine lokale Dokumentation verfügbar ist, greift er auf
[https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält auch den Speicherort des OpenClaw-Quellcodes. Git-Checkouts stellen den lokalen
Source-Root bereit, damit der Agent den Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-
Quellcode-URL und weisen den Agenten an, den Quellcode dort zu prüfen, wenn die Dokumentation unvollständig oder
veraltet ist. Der Prompt erwähnt außerdem den öffentlichen Dokumentationsspiegel, die Community auf Discord und ClawHub
([https://clawhub.ai](https://clawhub.ai)) zur Skill-Entdeckung. Er weist das Modell an,
zuerst die Dokumentation für Verhalten, Befehle, Konfiguration oder Architektur von OpenClaw zu konsultieren und
nach Möglichkeit selbst `openclaw status` auszuführen (den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt).

## Verwandt

- [Agent-Laufzeit](/de/concepts/agent)
- [Agent-Workspace](/de/concepts/agent-workspace)
- [Context-Engine](/de/concepts/context-engine)
