---
read_when:
    - Bearbeiten von Systemprompt-Text, Tool-Liste oder Zeit-/Heartbeat-Abschnitten
    - Ändern des Workspace-Bootstraps oder des Verhaltens bei der Skills-Injektion
summary: Was der OpenClaw-Systemprompt enthält und wie er zusammengesetzt wird
title: Systemprompt
x-i18n:
    generated_at: "2026-04-12T06:16:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 057f01aac51f7737b5223f61f5d55e552d9011232aebb130426e269d8f6c257f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Systemprompt

OpenClaw erstellt für jeden Agentenlauf einen benutzerdefinierten Systemprompt. Der Prompt ist **OpenClaw-eigen** und verwendet nicht den Standardprompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengestellt und in jeden Agentenlauf injiziert.

Provider-Plugins können cachefähige Prompt-Hinweise beisteuern, ohne den
vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Laufzeit kann:

- eine kleine Menge benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwende provider-eigene Beiträge für modellspezifische Abstimmung nach
Modellfamilie. Behalte die ältere Prompt-Mutation per
`before_prompt_build` für Kompatibilität oder wirklich globale
Prompt-Änderungen bei, nicht für normales Provider-Verhalten.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an die strukturierte Tool-Quelle der Wahrheit sowie Hinweise zur Tool-Nutzung zur Laufzeit.
- **Safety**: kurze Guardrail-Erinnerung, um machtsuchendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw Self-Update**: wie die Konfiguration sicher mit
  `config.schema.lookup` geprüft, mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf
  ausdrücklichen Benutzerwunsch ausgeführt wird. Das nur für Owner verfügbare
  `gateway`-Tool verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich älterer
  `tools.bash.*`-Aliase, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repository oder npm-Paket) und wann sie gelesen werden sollte.
- **Workspace Files (injected)**: zeigt an, dass Bootstrap-Dateien unten eingefügt sind.
- **Sandbox** (wenn aktiviert): zeigt eine sandboxed Laufzeit, Sandbox-Pfade und ob erhöhtes `exec` verfügbar ist.
- **Current Date & Time**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repo-Root (wenn erkannt), Thinking-Level (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsebene + Hinweis auf den Schalter `/reasoning`.

Der Abschnitt Tooling enthält außerdem Laufzeithinweise für lang laufende Arbeit:

- verwende `cron` für spätere Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem
  `process`-Polling
- verwende `exec` / `process` nur für Befehle, die jetzt starten und im
  Hintergrund weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, starte den Befehl
  einmal und verlasse dich auf den pushbasierten Aufweckpfad, wenn er Ausgabe
  erzeugt oder fehlschlägt
- verwende `process` für Logs, Status, Eingaben oder Eingriffe, wenn du einen
  laufenden Befehl prüfen musst
- wenn die Aufgabe größer ist, bevorzuge `sessions_spawn`; der Abschluss von
  Sub-Agenten ist pushbasiert und wird dem Anfragenden automatisch angekündigt
- frage nicht in einer Schleife `subagents list` / `sessions_list` ab, nur um
  auf den Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden,
genau einen Schritt als `in_progress` zu halten und nicht nach jedem Update den
gesamten Plan zu wiederholen.

Safety-Guardrails im Systemprompt sind beratend. Sie lenken das Modellverhalten, setzen aber keine Richtlinien durch. Verwende Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Channel-Allowlists für harte Durchsetzung; Operatoren können diese absichtlich deaktivieren.

Auf Channels mit nativen Genehmigungskarten/-schaltflächen weist der Laufzeitprompt den
Agenten jetzt an, sich zuerst auf diese native Genehmigungs-UI zu verlassen. Er
sollte einen manuellen Befehl `/approve` nur dann einfügen, wenn das
Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder eine
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere Systemprompts für Sub-Agenten rendern. Die Laufzeit setzt
für jeden Lauf einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle obigen Abschnitte.
- `minimal`: wird für Sub-Agenten verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die grundlegende Identitätszeile zurück.

Wenn `promptMode=minimal` gilt, werden zusätzlich injizierte Prompts als **Subagent
Context** statt als **Group Chat Context** bezeichnet.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne sie explizit lesen zu müssen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden, andernfalls `memory.md` als Fallback in Kleinschreibung

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
keine dateispezifische Bedingung greift. `HEARTBEAT.md` wird bei normalen Läufen
weggelassen, wenn Heartbeats für den Standardagenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halte injizierte
Dateien knapp – insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung sowie häufigerer Kompaktierung führen kann.

> **Hinweis:** Tägliche Dateien `memory/*.md` sind **kein** Teil des normalen Bootstrap-
> Project Context. Bei normalen Turns wird auf sie bei Bedarf über die Tools
> `memory_search` und `memory_get` zugegriffen, sodass sie nicht gegen das
> Kontextfenster zählen, sofern das Modell sie nicht explizit liest. Bloße
> Turns mit `/new` und `/reset` sind die Ausnahme: Die Laufzeit kann aktuelle
> tägliche Memory-Dateien als einmaligen Startup-Kontextblock für diesen ersten Turn
> voranstellen.

Große Dateien werden mit einem Marker gekürzt. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 20000). Der insgesamt
injizierte Bootstrap-Inhalt über alle Dateien hinweg ist durch
`agents.defaults.bootstrapTotalMaxChars` begrenzt
(Standard: 150000). Fehlende Dateien injizieren einen kurzen Marker für fehlende Dateien. Wenn Kürzung
auftritt, kann OpenClaw einen Warnblock in Project Context injizieren; dies wird mit
`agents.defaults.bootstrapPromptTruncationWarning` gesteuert (`off`, `once`, `always`;
Standard: `once`).

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` durch eine alternative Persona auszutauschen).

Wenn du den Agenten weniger generisch klingen lassen möchtest, beginne mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung sowie Tool-Schema-Overhead), verwende `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitverarbeitung

Der Systemprompt enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt cache-stabil zu halten, enthält er
jetzt nur noch die **Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat).

Verwende `session_status`, wenn der Agent die aktuelle Zeit benötigt; die
Statuskarte enthält eine Zeitstempelzeile. Dasselbe Tool kann optional auch ein
modellspezifisches Override pro Sitzung setzen (`model=default` entfernt es).

Konfiguration mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Date & Time](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn geeignete Skills vorhanden sind, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die für jeden Skill den **Dateipfad** enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Ort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine geeigneten Skills
vorhanden sind, wird der Abschnitt Skills weggelassen.

Zur Eignung gehören Skill-Metadaten-Bedingungen, Prüfungen der Laufzeitumgebung/-konfiguration
sowie die effektive Skill-Allowlist des Agenten, wenn `agents.defaults.skills` oder
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

So bleibt der Basisprompt klein und ermöglicht dennoch eine gezielte Skill-Nutzung.

## Dokumentation

Wenn verfügbar, enthält der Systemprompt einen Abschnitt **Documentation**, der auf das
lokale OpenClaw-Dokumentationsverzeichnis verweist (entweder `docs/` im Repo-Workspace oder die gebündelte npm-
Paketdokumentation) und außerdem den öffentlichen Spiegel, das Quell-Repository, die
Community auf Discord sowie ClawHub ([https://clawhub.ai](https://clawhub.ai)) zur Entdeckung von Skills nennt. Der Prompt weist das Modell an, zuerst die lokale Dokumentation
für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur zu konsultieren und
nach Möglichkeit selbst `openclaw status` auszuführen (den Benutzer nur zu fragen, wenn kein Zugriff besteht).
