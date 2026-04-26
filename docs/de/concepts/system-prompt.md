---
read_when:
    - System-Prompt-Text, Tool-Liste oder Abschnitte zu Zeit/Heartbeat bearbeiten
    - Verhalten des Workspace-Bootstrap oder der Skills-Injektion ändern
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-04-26T11:27:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw erstellt für jeden Agent-Lauf einen benutzerdefinierten System-Prompt. Der Prompt ist **OpenClaw-eigen** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agent-Lauf injiziert.

Provider-Plugins können cachebewusste Prompt-Hinweise beisteuern, ohne den
vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Laufzeit kann:

- eine kleine Menge benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie provider-eigene Beiträge für modellfamilien-spezifisches Tuning. Behalten Sie die ältere
Prompt-Mutation `before_prompt_build` für Kompatibilität oder wirklich globale Prompt-Änderungen bei, nicht für normales Provider-Verhalten.

Das Overlay für die OpenAI-GPT-5-Familie hält die Kernregel für die Ausführung klein und ergänzt
modellspezifische Hinweise für Persona-Bindung, knappe Ausgabe, Tool-Disziplin,
parallele Nachschlagevorgänge, Abdeckung von Ergebnissen, Verifizierung, fehlenden Kontext und
saubere Verwendung von Terminal-Tools.

## Struktur

Der Prompt ist bewusst kompakt gehalten und verwendet feste Abschnitte:

- **Tooling**: strukturierte Erinnerung an die Quelle der Wahrheit für Tools sowie Laufzeit-Hinweise zur Tool-Nutzung.
- **Execution Bias**: kompakte Hinweise zum konsequenten Weiterarbeiten: bei
  ausführbaren Anfragen im selben Turn handeln, weitermachen bis zur Erledigung oder Blockierung,
  schwache Tool-Ergebnisse auffangen, veränderlichen Status live prüfen und vor dem Abschluss verifizieren.
- **Safety**: kurze Guardrail-Erinnerung, um machtsuchendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw Self-Update**: wie die Konfiguration sicher mit
  `config.schema.lookup` geprüft, mit `config.patch` gepatcht, mit `config.apply` vollständig ersetzt
  und `update.run` nur auf ausdrückliche Benutzeranfrage ausgeführt wird. Das nur für Eigentümer verfügbare Tool `gateway` verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich älterer
  Aliase `tools.bash.*`, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden sollte.
- **Workspace Files (injected)**: weist darauf hin, dass Bootstrap-Dateien unten eingefügt sind.
- **Sandbox** (wenn aktiviert): weist auf eine sandboxed Laufzeit, Sandbox-Pfade und darauf hin, ob erhöhter `exec` verfügbar ist.
- **Current Date & Time**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Acknowledge-Verhalten, wenn Heartbeats für den Standard-Agenten aktiviert sind.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repo-Root (wenn erkannt), Thinking-Level (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsebene + Hinweis auf `/reasoning`-Umschaltung.

Der Abschnitt Tooling enthält auch Laufzeit-Hinweise für lang laufende Arbeiten:

- verwenden Sie Cron für spätere Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- verwenden Sie `exec` / `process` nur für Befehle, die jetzt starten und im
  Hintergrund weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, starten Sie den Befehl einmal und verlassen sich auf
  den pushbasierten Aufweckpfad, wenn er Ausgabe erzeugt oder fehlschlägt
- verwenden Sie `process` für Protokolle, Status, Eingaben oder Eingriffe, wenn Sie
  einen laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, bevorzugen Sie `sessions_spawn`; der Abschluss von Subagents ist
  pushbasiert und wird automatisch dem Anfragenden angekündigt
- pollen Sie `subagents list` / `sessions_list` nicht in einer Schleife, nur um auf
  den Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
Schritt mit `in_progress` zu halten und nicht nach jeder Aktualisierung den ganzen Plan zu wiederholen.

Safety-Guardrails im System-Prompt sind hinweisend. Sie lenken das Modellverhalten, erzwingen aber keine Richtlinien. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Kanal-Allowlists für harte Durchsetzung; Betreiber können diese bewusst deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-schaltflächen weist der Laufzeit-Prompt den
Agenten jetzt an, sich zuerst auf diese native Genehmigungs-UI zu verlassen. Er sollte einen manuellen
Befehl `/approve` nur dann einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann für Subagents kleinere System-Prompts rendern. Die Laufzeit setzt für jeden
Lauf ein `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle obigen Abschnitte.
- `minimal`: wird für Subagents verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal` gilt, werden zusätzlich injizierte Prompts als **Subagent
Context** statt als **Group Chat Context** bezeichnet.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne sie ausdrücklich lesen zu müssen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, falls vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
keine dateispezifische Sperre gilt. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn
Heartbeats für den Standard-Agenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` auf false steht. Halten Sie injizierte
Dateien knapp — insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung und häufigerer Compaction führen kann.

> **Hinweis:** Tägliche Dateien `memory/*.md` sind **nicht** Teil des normalen Bootstrap-
> Project Context. In gewöhnlichen Turns wird auf sie bedarfsorientiert über die
> Tools `memory_search` und `memory_get` zugegriffen, sodass sie nicht gegen das
> Kontextfenster zählen, sofern das Modell sie nicht ausdrücklich liest. Reine `/new`- und
> `/reset`-Turns sind die Ausnahme: Die Laufzeit kann aktuelle tägliche Speicherdateien
> als einmaligen Startup-Kontextblock für diesen ersten Turn voranstellen.

Große Dateien werden mit einem Marker abgeschnitten. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der insgesamt injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren einen kurzen Marker für fehlende Dateien. Wenn Abschneiden
auftritt, kann OpenClaw im Project Context einen Warnblock injizieren; dies wird mit
`agents.defaults.bootstrapPromptTruncationWarning` gesteuert (`off`, `once`, `always`;
Standard: `once`).

Subagent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Subagent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Abschneiden sowie Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen dedizierten Abschnitt **Current Date & Time**, wenn die
Zeitzone des Benutzers bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional ein Modell-Override pro Sitzung
setzen (`model=default` löscht es).

Konfiguration über:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Datum & Uhrzeit](/de/date-time) für vollständige Details zum Verhalten.

## Skills

Wenn zulässige Skills vorhanden sind, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jedes Skill enthält. Der
Prompt weist das Modell an, mit `read` die SKILL.md am angegebenen
Ort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine zulässigen Skills vorhanden sind, wird der
Abschnitt Skills ausgelassen.

Die Zulässigkeit umfasst Skill-Metadaten-Gates, Prüfungen von Laufzeitumgebung/Konfiguration
und die effektive Skill-Allowlist des Agenten, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur zulässig, wenn das zugehörige Plugin aktiviert ist.
Dadurch können Tool-Plugins tiefere Betriebsanleitungen bereitstellen, ohne all diese
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

Dadurch bleibt der Basis-Prompt klein und ermöglicht dennoch gezielte Skill-Nutzung.

Das Budget für die Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Überschreibung pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Laufzeitauszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größe von Skills getrennt von der Größe für Laufzeit-Lesen/Injektion wie
`memory_get`, Live-Tool-Ergebnisse und Aktualisierungen von AGENTS.md nach Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Documentation**. Wenn lokale Dokumentation verfügbar ist, verweist er
auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelte npm-
Paketdokumentation). Wenn lokale Dokumentation nicht verfügbar ist, fällt er auf
[https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält auch den Speicherort des OpenClaw-Quellcodes. Git-Checkouts stellen den lokalen
Source-Root bereit, damit der Agent den Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-
Quellcode-URL und weisen den Agenten an, den Quellcode dort zu prüfen, wenn die Dokumentation unvollständig oder
veraltet ist. Der Prompt weist außerdem auf den öffentlichen Dokumentationsspiegel, die Community auf Discord und ClawHub
([https://clawhub.ai](https://clawhub.ai)) zur Skills-Entdeckung hin. Er weist das Modell an,
bei OpenClaw-Verhalten, Befehlen, Konfiguration oder Architektur zuerst die Dokumentation zu konsultieren und
`openclaw status` nach Möglichkeit selbst auszuführen (den Benutzer nur dann zu fragen, wenn kein Zugriff besteht).
Speziell für Konfiguration verweist er Agenten auf die Tool-Aktion `gateway`
`config.schema.lookup` für exakte feldbezogene Dokumentation und Einschränkungen und danach auf
`docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md`
für allgemeinere Hinweise.

## Verwandt

- [Agent-Laufzeit](/de/concepts/agent)
- [Agent-Workspace](/de/concepts/agent-workspace)
- [Context engine](/de/concepts/context-engine)
