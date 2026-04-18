---
read_when:
    - Bearbeiten von Text der Systemaufforderung, der Tool-Liste oder von Zeit-/Heartbeat-Abschnitten
    - Ändern des Workspace-Bootstrap oder des Verhaltens der Skills-Injektion
summary: Was die OpenClaw-Systemaufforderung enthält und wie sie zusammengesetzt wird
title: Systemaufforderung
x-i18n:
    generated_at: "2026-04-18T06:12:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e60705994cebdd9768926168cb1c6d17ab717d7ff02353a5d5e7478ba8191cab
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Systemaufforderung

OpenClaw erstellt für jeden Agentenlauf eine benutzerdefinierte Systemaufforderung. Die Aufforderung gehört **OpenClaw** und verwendet nicht die Standardaufforderung von pi-coding-agent.

Die Aufforderung wird von OpenClaw zusammengesetzt und in jeden Agentenlauf eingefügt.

Provider-Plugins können cache-fähige Prompt-Hinweise beitragen, ohne die
vollständige OpenClaw-eigene Aufforderung zu ersetzen. Die Provider-Laufzeit kann:

- einen kleinen Satz benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabilen Präfix** oberhalb der Prompt-Cache-Grenze einfügen
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze einfügen

Verwenden Sie provider-eigene Beiträge für modellfamilien-spezifisches Tuning. Behalten Sie die ältere
`before_prompt_build`-Mutation der Aufforderung für Kompatibilität oder wirklich globale Änderungen
an der Aufforderung bei, nicht für normales Provider-Verhalten.

## Struktur

Die Aufforderung ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an die strukturierte Tool-Source-of-Truth plus Laufzeit-Hinweise zur Tool-Nutzung.
- **Safety**: kurze Leitplanken-Erinnerung, um machtorientiertes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf laden kann.
- **OpenClaw Self-Update**: wie die Konfiguration sicher mit
  `config.schema.lookup` geprüft wird, die Konfiguration mit `config.patch` gepatcht wird, die vollständige
  Konfiguration mit `config.apply` ersetzt wird und `update.run` nur auf ausdrückliche
  Benutzeranfrage ausgeführt wird. Das Tool `gateway`, das nur für Eigentümer verfügbar ist, weigert sich außerdem,
  `tools.exec.ask` / `tools.exec.security` neu zu schreiben, einschließlich älterer `tools.bash.*`-
  Aliasse, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repository oder npm-Paket) und wann sie gelesen werden soll.
- **Workspace Files (injected)**: weist darauf hin, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): weist auf eine Laufzeit in der Sandbox, Sandbox-Pfade und darauf hin, ob erhöhter Exec verfügbar ist.
- **Current Date & Time**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Aufforderung und Ack-Verhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Runtime**: Host, OS, Node, Modell, Repo-Stammverzeichnis (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis zum Umschalten mit `/reasoning`.

Der Abschnitt Tooling enthält außerdem Laufzeit-Hinweise für lang laufende Arbeit:

- Verwenden Sie Cron für künftige Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Delay-Tricks oder wiederholtem
  `process`-Polling
- Verwenden Sie `exec` / `process` nur für Befehle, die jetzt starten und im
  Hintergrund weiterlaufen
- Wenn automatisches Aufwachen bei Abschluss aktiviert ist, starten Sie den Befehl einmal und verlassen Sie sich auf
  den push-basierten Aufwachpfad, wenn er Ausgabe erzeugt oder fehlschlägt
- Verwenden Sie `process` für Logs, Status, Eingaben oder Eingriffe, wenn Sie
  einen laufenden Befehl prüfen müssen
- Wenn die Aufgabe größer ist, bevorzugen Sie `sessions_spawn`; der Abschluss von Unteragenten ist
  push-basiert und wird dem Anfragenden automatisch zurückgemeldet
- Führen Sie kein `subagents list` / `sessions_list` in einer Schleife aus, nur um auf
  den Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, teilt Tooling dem
Modell außerdem mit, es nur für nicht triviale Arbeit mit mehreren Schritten zu verwenden, genau einen
Schritt im Status `in_progress` beizubehalten und nicht nach jeder Aktualisierung den vollständigen Plan
zu wiederholen.

Safety-Leitplanken in der Systemaufforderung sind hinweisend. Sie steuern das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Freigaben, Sandboxing und Channel-Allowlists für harte Durchsetzung; Operatoren können diese absichtlich deaktivieren.

Auf Channels mit nativen Freigabekarten/-schaltflächen teilt die Laufzeitaufforderung dem
Agenten jetzt mit, sich zuerst auf diese native Freigabe-UI zu verlassen. Sie sollte nur dann einen manuellen
`/approve`-Befehl enthalten, wenn das Tool-Ergebnis sagt, dass Chat-Freigaben nicht verfügbar sind oder
manuelle Freigabe der einzige Weg ist.

## Aufforderungsmodi

OpenClaw kann kleinere Systemaufforderungen für Unteragenten rendern. Die Laufzeit setzt für
jeden Lauf einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Unteragenten verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und eingefügter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal`, werden zusätzlich eingefügte Aufforderungen als **Subagent
Context** statt als **Group Chat Context** beschriftet.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden, sonst `memory.md` als kleingeschriebener Fallback

Alle diese Dateien werden **bei jedem Zug in das Kontextfenster eingefügt**, sofern
keine dateispezifische Sperre gilt. `HEARTBEAT.md` wird bei normalen Läufen weggelassen, wenn
Heartbeats für den Standardagenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` auf false gesetzt ist. Halten Sie eingefügte
Dateien knapp — insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung und häufigerer Compaction führen kann.

> **Hinweis:** tägliche `memory/*.md`-Dateien sind **kein** Teil des normalen Bootstrap-
> Project Context. Bei gewöhnlichen Zügen wird auf sie bei Bedarf über die
> Tools `memory_search` und `memory_get` zugegriffen, sodass sie nicht gegen das
> Kontextfenster zählen, sofern das Modell sie nicht ausdrücklich liest. Bare `/new`- und
> `/reset`-Züge sind die Ausnahme: Die Laufzeit kann aktuelle tägliche Memory-
> Einträge als einmaligen Startkontext-Block für diesen ersten Zug voranstellen.

Große Dateien werden mit einer Markierung gekürzt. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der insgesamt eingefügte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien fügen eine kurze Fehlende-Datei-Markierung ein. Wenn Kürzung
auftritt, kann OpenClaw einen Warnblock in Project Context einfügen; dies wird mit
`agents.defaults.bootstrapPromptTruncationWarning` gesteuert (`off`, `once`, `always`;
Standard: `once`).

Unteragenten-Sitzungen fügen nur `AGENTS.md` und `TOOLS.md` ein (andere Bootstrap-Dateien
werden herausgefiltert, um den Unteragenten-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um
die eingefügten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` durch eine alternative Persona zu ersetzen).

Wenn Sie den Agenten weniger generisch klingen lassen möchten, beginnen Sie mit
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede eingefügte Datei beiträgt (roh vs. eingefügt, Kürzung sowie Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitbehandlung

Die Systemaufforderung enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt cache-stabil zu halten, enthält sie jetzt nur noch die
**Zeitzone** (keine dynamische Uhrzeit oder kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine sitzungsspezifische Modell-
Überschreibung setzen (`model=default` löscht sie).

Konfiguration über:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Date & Time](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn geeignete Skills vorhanden sind, fügt OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`) ein, die für jeden Skill den **Dateipfad** enthält. Die
Aufforderung weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Ort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine Skills geeignet sind, wird der
Abschnitt Skills weggelassen.

Die Eignung umfasst Skill-Metadaten-Sperren, Prüfungen der Laufzeitumgebung/-konfiguration
und die effektive Skill-Allowlist des Agenten, wenn `agents.defaults.skills` oder
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

Dadurch bleibt die Basisaufforderung klein und ermöglicht dennoch eine gezielte Skill-Nutzung.

Das Budget der Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Überschreibung pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Laufzeit-Auszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größenbemessung von Skills getrennt von der Größenbemessung für Laufzeit-Lesen/-Einfügen,
wie etwa `memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach Compaction.

## Dokumentation

Wenn verfügbar, enthält die Systemaufforderung einen Abschnitt **Documentation**, der auf das
lokale OpenClaw-Dokumentationsverzeichnis verweist (entweder `docs/` im Repository-Workspace oder die gebündelte npm-
Paketdokumentation) und außerdem den öffentlichen Mirror, das Quell-Repository, die Community auf Discord und
ClawHub ([https://clawhub.ai](https://clawhub.ai)) zur Skill-Entdeckung erwähnt. Die Aufforderung weist das Modell an, zuerst die lokale Dokumentation zu konsultieren
für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur, und
nach Möglichkeit selbst `openclaw status` auszuführen (den Benutzer nur zu fragen, wenn kein Zugriff besteht).
