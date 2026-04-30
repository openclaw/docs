---
read_when:
    - Bearbeiten von System-Prompt-Text, Tool-Liste oder Zeit-/Heartbeat-Abschnitten
    - Ändern des Workspace-Bootstraps oder des Verhaltens der Skills-Injektion
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-04-30T06:51:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agent-Lauf einen benutzerdefinierten System-Prompt. Der Prompt ist **OpenClaw-eigen** und verwendet nicht den Standardprompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengestellt und in jeden Agent-Lauf injiziert.

Provider-Plugins können cache-bewusste Prompt-Hinweise beisteuern, ohne den
vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Runtime kann:

- eine kleine Gruppe benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für die modellfamilien-spezifische Feinabstimmung. Behalten Sie die ältere
`before_prompt_build`-Prompt-Mutation für Kompatibilität oder wirklich globale Prompt-Änderungen bei,
nicht für normales Provider-Verhalten.

Das Overlay der OpenAI-GPT-5-Familie hält die zentrale Ausführungsregel klein und ergänzt
modellspezifische Hinweise zu Persona-Bindung, knapper Ausgabe, Tool-Disziplin,
paralleler Suche, Abdeckung von Ergebnissen, Verifikation, fehlendem Kontext und
Hygiene bei Terminal-Tools.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an strukturierte Tools als maßgebliche Quelle plus Runtime-Hinweise zur Tool-Nutzung.
- **Ausführungsfokus**: kompakte Hinweise zum konsequenten Weiterarbeiten: bei
  umsetzbaren Anfragen innerhalb des aktuellen Turns handeln, fortfahren, bis die Aufgabe erledigt oder blockiert ist, sich von schwachen Tool-
  Ergebnissen erholen, veränderlichen Zustand live prüfen und vor dem Finalisieren verifizieren.
- **Sicherheit**: kurze Guardrail-Erinnerung, machtorientiertes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw-Selbstaktualisierung**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzer-
  anfrage ausgeführt wird. Das nur für Owner bestimmte `gateway`-Tool verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich älterer `tools.bash.*`-
  Aliasse, die auf diese geschützten Exec-Pfade normalisieren.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Pfad zu den OpenClaw-Dokumenten (Repository oder npm-Paket) und wann sie gelesen werden sollten.
- **Workspace-Dateien (injiziert)**: gibt an, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): gibt die Sandbox-Runtime, Sandbox-Pfade und an, ob erhöhtes Exec verfügbar ist.
- **Aktuelles Datum & Uhrzeit**: lokale Zeit des Benutzers, Zeitzone und Zeitformat.
- **Antwort-Tags**: optionale Antwort-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standard-Agent aktiviert sind.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repository-Root (falls erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis auf den /reasoning-Schalter.

OpenClaw hält große stabile Inhalte, einschließlich **Projektkontext**, oberhalb der
internen Prompt-Cache-Grenze. Veränderliche Channel-/Sitzungsabschnitte wie
Einbettungshinweise für die Control UI, **Messaging**, **Voice**, **Gruppenchat-Kontext**,
**Reaktionen**, **Heartbeats** und **Runtime** werden unterhalb dieser Grenze angehängt,
damit lokale Backends mit Präfix-Caches das stabile Workspace-Präfix
über Channel-Turns hinweg wiederverwenden können. Tool-Beschreibungen sollten ebenfalls vermeiden, aktuelle
Channel-Namen einzubetten, wenn das akzeptierte Schema dieses Runtime-Detail bereits enthält.

Der Abschnitt Tooling enthält außerdem Runtime-Hinweise für lange laufende Arbeit:

- Cron für zukünftige Nachverfolgung verwenden (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und
  im Hintergrund weiterlaufen
- wenn automatisches Aufwachen bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf
  den Push-basierten Aufwachpfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingabe oder Eingriffe verwenden, wenn Sie einen
  laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Sub-Agents ist
  Push-basiert und kündigt sich automatisch beim Anfragenden zurück
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf
  Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
`in_progress`-Schritt beizubehalten und nicht nach jeder Aktualisierung den gesamten Plan zu wiederholen.

Sicherheits-Guardrails im System-Prompt sind beratend. Sie lenken das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Channel-Allowlists für harte Durchsetzung; Betreiber können diese bewusst deaktivieren.

In Channels mit nativen Genehmigungskarten/-buttons weist der Runtime-Prompt den
Agent jetzt an, zuerst diese native Genehmigungs-UI zu verwenden. Er sollte nur dann einen manuellen
`/approve`-Befehl einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agents rendern. Die Runtime setzt für jeden Lauf einen
`promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agents verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw-
  Selbstaktualisierung**, **Modell-Aliasse**, **Benutzeridentität**, **Antwort-Tags**,
  **Messaging**, **Stille Antworten** und **Heartbeats** aus. Tooling, **Sicherheit**,
  Workspace, Sandbox, Aktuelles Datum & Uhrzeit (falls bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basisidentitätszeile zurück.

Wenn `promptMode=minimal` gilt, werden zusätzlich injizierte Prompts als **Subagent
Context** statt als **Gruppenchat-Kontext** beschriftet.

Für automatische Channel-Antwortläufe kann OpenClaw den generischen Abschnitt **Stille Antworten**
auslassen, wenn der Direkt-/Gruppenchatkontext bereits das aufgelöste
konversationsspezifische `NO_REPLY`-Verhalten enthält. Dadurch werden Token-Mechaniken
nicht sowohl im globalen System-Prompt als auch im Channel-Kontext wiederholt.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Projektkontext** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
kein dateispezifisches Gate greift. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn
Heartbeats für den Standard-Agent deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte
Dateien knapp - insbesondere `MEMORY.md`, das im Laufe der Zeit wachsen und zu
unerwartet hoher Kontextnutzung und häufigerer Compaction führen kann.

<Note>
Tägliche `memory/*.md`-Dateien sind **nicht** Teil des normalen Bootstrap-Projektkontexts. In gewöhnlichen Turns werden sie bei Bedarf über die Tools `memory_search` und `memory_get` abgerufen, sodass sie nicht gegen das Kontextfenster zählen, sofern das Modell sie nicht ausdrücklich liest. Bloße `/new`- und `/reset`-Turns sind die Ausnahme: Die Runtime kann aktuelle tägliche Memory als einmaligen Startup-Kontextblock für diesen ersten Turn voranstellen.
</Note>

Große Dateien werden mit einer Markierung abgeschnitten. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der gesamte injizierte Bootstrap-
Inhalt über Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren eine kurze Markierung für fehlende Dateien. Wenn Kürzung
auftritt, kann OpenClaw einen Warnblock im Projektkontext injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu mutieren oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md-Persönlichkeitsleitfaden](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung, plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitverarbeitung

Der System-Prompt enthält einen eigenen Abschnitt **Aktuelles Datum & Uhrzeit**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt Cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine sitzungsbezogene Modell-
Überschreibung setzen (`model=default` löscht sie).

Konfigurieren Sie mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Datum & Uhrzeit](/de/date-time) für vollständige Details zum Verhalten.

## Skills

Wenn berechtigte Skills vorhanden sind, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgelisteten
Speicherort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine Skills berechtigt sind, wird der
Skills-Abschnitt ausgelassen.

Die Berechtigung umfasst Skill-Metadaten-Gates, Runtime-Umgebungs-/Konfigurationsprüfungen
und die effektive Skill-Allowlist des Agent, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur berechtigt, wenn ihr besitzendes Plugin aktiviert ist.
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

So bleibt der Basisprompt klein, während gezielte Skill-Nutzung weiterhin möglich ist.

Das Budget der Skills-Liste gehört zum Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Überschreibung pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Runtime-Auszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größenbegrenzung von Skills getrennt von der Größenbegrenzung für Runtime-Lesen/-Injektion, etwa
`memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist,
verweist er auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelten npm-
Paketdokumente). Wenn lokale Dokumentation nicht verfügbar ist, fällt er auf
[https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält auch den OpenClaw-Quellort. Git-Checkouts stellen das lokale
Quell-Root bereit, damit der Agent Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-
Quell-URL und weisen den Agent an, dort den Quellcode zu prüfen, wenn die Dokumentation unvollständig oder
veraltet ist. Der Prompt erwähnt außerdem den öffentlichen Dokumentationsspiegel, den Community-Discord und ClawHub
([https://clawhub.ai](https://clawhub.ai)) für die Entdeckung von Skills. Er weist das Modell an,
zuerst die Dokumentation für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur zu konsultieren und
`openclaw status` nach Möglichkeit selbst auszuführen (den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt).
Speziell für Konfiguration verweist er Agents auf die `gateway`-Tool-Aktion
`config.schema.lookup` für exakte Feld-Dokumentation und Einschränkungen und dann auf
`docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md`
für breitere Orientierung.

## Verwandt

- [Agent-Runtime](/de/concepts/agent)
- [Agent-Workspace](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
