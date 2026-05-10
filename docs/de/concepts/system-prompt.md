---
read_when:
    - Bearbeiten von System-Prompt-Text, Tool-Liste oder Zeit-/Heartbeat-Abschnitten
    - Ändern des Workspace-Bootstraps oder des Verhaltens der Skills-Injektion
summary: Was der OpenClaw-Systemprompt enthält und wie er zusammengestellt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-05-10T19:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agent-Lauf einen benutzerdefinierten System-Prompt. Der Prompt ist **OpenClaw-owned** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agent-Lauf injiziert.

Die Prompt-Zusammenstellung hat drei Schichten:

- `buildAgentSystemPrompt` rendert den Prompt aus expliziten Eingaben. Er sollte
  ein reiner Renderer bleiben und globale Konfiguration nicht direkt lesen.
- `resolveAgentSystemPromptConfig` löst konfigurationsgestützte Prompt-Regler wie
  Owner-Anzeige, TTS-Hinweise, Modell-Aliase, Memory-Zitationsmodus und den
  Delegationsmodus für Sub-Agenten für einen bestimmten Agent auf.
- Laufzeitadapter (embedded, CLI, Befehls-/Exportvorschauen, Compaction) erfassen
  Live-Fakten wie Tools, Sandbox-Status, Channel-Fähigkeiten, Kontextdateien
  und Provider-Prompt-Beiträge und rufen dann die konfigurierte Prompt-Fassade auf.

So bleiben exportierte und Debug-Prompt-Oberflächen mit Live-Läufen abgestimmt, ohne
jedes laufzeitspezifische Detail in einen monolithischen Builder zu verwandeln.

Provider-Plugins können cache-bewusste Prompt-Hinweise beitragen, ohne den
vollständigen OpenClaw-owned Prompt zu ersetzen. Die Provider-Laufzeit kann:

- eine kleine Gruppe benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-owned Beiträge für modellspezifisches Tuning je Modellfamilie. Behalten Sie die veraltete
Prompt-Mutation `before_prompt_build` für Kompatibilität oder wirklich globale Prompt-Änderungen bei,
nicht für normales Provider-Verhalten.

Das Overlay der OpenAI-GPT-5-Familie hält die zentrale Ausführungsregel klein und ergänzt
modellspezifische Hinweise für Persona-Latching, knappe Ausgabe, Tool-Disziplin,
paralleles Nachschlagen, Abdeckung von Deliverables, Verifikation, fehlenden Kontext und
Hygiene beim Terminal-Tool.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an die strukturierte Tool-Quelle der Wahrheit plus Laufzeit-Hinweise zur Tool-Nutzung.
- **Execution Bias**: kompakte Follow-through-Hinweise: bei
  umsetzbaren Anfragen im aktuellen Turn handeln, weitermachen, bis die Aufgabe erledigt oder blockiert ist, schwache Tool-
  Ergebnisse auffangen, veränderlichen Zustand live prüfen und vor dem Finalisieren verifizieren.
- **Safety**: kurze Guardrail-Erinnerung, machtsuchendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw Control**: weist das Modell an, für
  Konfigurations-/Neustartarbeiten bevorzugt das `gateway`-Tool zu verwenden und keine CLI-Befehle zu erfinden.
- **OpenClaw Self-Update**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzeranfrage
  ausgeführt wird. Das owner-only `gateway`-Tool verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich veralteter `tools.bash.*`-
  Aliase, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zu OpenClaw-Dokumentation/-Quelle und wann diese gelesen werden soll.
- **Workspace Files (injected)**: zeigt an, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): zeigt Sandbox-Laufzeit, Sandbox-Pfade und ob erweiterte Exec-Ausführung verfügbar ist.
- **Current Date & Time**: nur Zeitzone (cache-stabil; die Live-Uhr kommt aus `session_status`).
- **Assistant Output Directives**: kompakte Syntax für Anhänge, Sprachnotizen und Antwort-Tags.
- **Heartbeats**: Heartbeat-Prompt und Ack-Verhalten, wenn Heartbeats für den Standard-Agent aktiviert sind.
- **Runtime**: Host, OS, Node, Modell, Repo-Root (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis zum /reasoning-Umschalter.

OpenClaw hält große stabile Inhalte, einschließlich **Project Context**, oberhalb der
internen Prompt-Cache-Grenze. Flüchtige Channel-/Sitzungsabschnitte wie
Control-UI-Einbettungshinweise, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats** und **Runtime** werden unterhalb dieser Grenze angehängt,
damit lokale Backends mit Präfix-Caches das stabile Workspace-Präfix
über Channel-Turns hinweg wiederverwenden können. Tool-Beschreibungen sollten ebenfalls vermeiden,
aktuelle Channel-Namen einzubetten, wenn das akzeptierte Schema dieses Laufzeitdetail bereits enthält.

Der Abschnitt Tooling enthält außerdem Laufzeit-Hinweise für lange laufende Arbeit:

- Cron für zukünftiges Nachfassen verwenden (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und
  im Hintergrund weiterlaufen
- wenn automatisches Aufwachen bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf
  den push-basierten Wake-Pfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingabe oder Eingriffe verwenden, wenn Sie
  einen laufenden Befehl inspizieren müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Sub-Agenten ist
  push-basiert und meldet sich automatisch beim Anfragenden zurück
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf
  den Abschluss zu warten

`agents.defaults.subagents.delegationMode` kann diese Hinweise verstärken. Der
Standardmodus `suggest` behält den grundlegenden Anstoß bei. `prefer` ergänzt einen eigenen
Abschnitt **Sub-Agent Delegation**, der den Haupt-Agent anweist, als reaktionsfähiger
Koordinator zu agieren und alles, was über eine direkte Antwort hinausgeht, über
`sessions_spawn` weiterzugeben. Dies ist nur Prompt-Verhalten; die Tool-Richtlinie steuert weiterhin, ob
`sessions_spawn` verfügbar ist.

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
`in_progress`-Schritt beizubehalten und nicht nach jeder Aktualisierung den gesamten Plan zu wiederholen.

Safety-Guardrails im System-Prompt sind beratend. Sie leiten das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Channel-Allowlists für harte Durchsetzung; Operatoren können diese absichtlich deaktivieren.

Auf Channels mit nativen Genehmigungskarten/-Buttons weist der Laufzeit-Prompt den
Agent jetzt an, zuerst diese native Genehmigungs-UI zu verwenden. Er sollte nur dann einen manuellen
`/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agenten rendern. Die Laufzeit setzt für jeden Lauf einen
`promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle obigen Abschnitte.
- `minimal`: wird für Sub-Agenten verwendet; lässt **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Assistant Output Directives**,
  **Messaging**, **Silent Replies** und **Heartbeats** aus. Tooling, **Safety**,
  **Skills**, wenn bereitgestellt, Workspace, Sandbox, Current Date & Time (wenn
  bekannt), Runtime und injizierter Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Bei `promptMode=minimal` werden zusätzlich injizierte Prompts als **Subagent
Context** statt als **Group Chat Context** beschriftet.

Für automatische Channel-Antwortläufe kann OpenClaw den generischen Abschnitt **Silent Replies**
weglassen, wenn der direkte/Gruppenchat-Kontext bereits das aufgelöste
konversationsspezifische `NO_REPLY`-Verhalten enthält. Dadurch wird vermieden, Token-Mechanik
sowohl im globalen System-Prompt als auch im Channel-Kontext zu wiederholen.

## Prompt-Snapshots

OpenClaw hält committete Prompt-Snapshots für den Happy Path der Codex-Laufzeit unter
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Sie rendern
ausgewählte App-Server-Thread-/Turn-Parameter plus einen rekonstruierten modellgebundenen Prompt-
Layer-Stack für Telegram-Direkt-, Discord-Gruppen- und Heartbeat-Turns. Dieser Stack
enthält ein gepinntes Codex-`gpt-5.5`-Modell-Prompt-Fixture, das aus der Form von Codex'
Modellkatalog/-Cache generiert wurde, den Codex-Happy-Path-Permission-Developer-Text,
OpenClaw-Developer-Anweisungen, turn-bezogene Collaboration-Mode-Anweisungen,
wenn OpenClaw sie bereitstellt, Benutzereingabe im Turn und Referenzen auf die dynamischen Tool-
Spezifikationen.

Aktualisieren Sie das gepinnte Codex-Modell-Prompt-Fixture mit
`pnpm prompt:snapshots:sync-codex-model`. Standardmäßig sucht das Skript nach
Codex' Laufzeit-Cache unter `$CODEX_HOME/models_cache.json`, dann
`~/.codex/models_cache.json`, und fällt erst dann auf die Maintainer-Codex-
Checkout-Konvention unter `~/code/codex/codex-rs/models-manager/models.json` zurück. Wenn
keine dieser Quellen existiert, beendet sich der Befehl, ohne das committete
Fixture zu ändern. Übergeben Sie `--catalog <path>`, um aus einer bestimmten Datei `models_cache.json`
oder `models.json` zu aktualisieren.

Diese Snapshots sind weiterhin kein bytegenauer Rohmitschnitt einer OpenAI-Anfrage. Codex
kann laufzeit-owned Workspace-Kontext wie `AGENTS.md`, Umgebungs-
Kontext, Erinnerungen, App-/Plugin-Anweisungen und eingebaute Default-
Collaboration-Mode-Anweisungen innerhalb der Codex-Laufzeit hinzufügen, nachdem OpenClaw
Thread- und Turn-Parameter gesendet hat.

Regenerieren Sie sie mit `pnpm prompt:snapshots:gen` und prüfen Sie Drift mit
`pnpm prompt:snapshots:check`. CI führt die Drift-Prüfung im zusätzlichen
Boundary-Shard aus, damit Prompt-Änderungen und Snapshot-Aktualisierungen mit demselben
PR verbunden bleiben.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizit lesen zu müssen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur bei ganz neuen Workspaces)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, sofern
kein dateispezifisches Gate greift. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn
Heartbeats für den Standard-Agent deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte
Dateien knapp, insbesondere `MEMORY.md`. `MEMORY.md` soll eine
kuratierte Langzeit-Zusammenfassung bleiben; detaillierte Tagesnotizen gehören in `memory/*.md`, wo
`memory_search` und `memory_get` sie bei Bedarf abrufen können. Zu große
`MEMORY.md`-Dateien erhöhen die Prompt-Nutzung und können wegen der unten genannten
Bootstrap-Dateigrenzen teilweise injiziert werden.

Wenn eine Sitzung auf dem nativen Codex-Harness läuft, lädt Codex `AGENTS.md`
über seine eigene Projekt-Dokumenterkennung. OpenClaw löst weiterhin die übrigen
Bootstrap-Dateien auf und leitet sie als Codex-Konfigurationsanweisungen weiter, sodass `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und
`MEMORY.md` dieselbe Workspace-Kontextrolle behalten, ohne `AGENTS.md` zu duplizieren.

<Note>
`memory/*.md`-Tagesdateien sind **nicht** Teil des normalen Bootstrap-Project-Context. Bei gewöhnlichen Turns wird bei Bedarf über die Tools `memory_search` und `memory_get` auf sie zugegriffen, sodass sie nicht gegen das Kontextfenster zählen, sofern das Modell sie nicht explizit liest. Reine `/new`- und `/reset`-Turns sind die Ausnahme: Die Laufzeit kann aktuelle tägliche Memory als einmaligen Startup-Kontextblock für diesen ersten Turn voranstellen.
</Note>

Große Dateien werden mit einer Markierung gekürzt. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der gesamte injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren eine kurze Missing-File-Markierung. Wenn Kürzung
auftritt, kann OpenClaw einen knappen Warnhinweis im System-Prompt injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`). Detaillierte Roh-/Injektionszählungen bleiben in Diagnosen wie
`/context`, `/status`, doctor und Logs erhalten.

Bei Memory-Dateien ist Kürzung kein Datenverlust: Die Datei bleibt auf der Festplatte intakt,
aber das Modell sieht nur die gekürzte injizierte Kopie, bis es Memory direkt liest oder durchsucht.
Wenn `MEMORY.md` wiederholt gekürzt wird, verdichten Sie sie zu einer
kürzeren dauerhaften Zusammenfassung und verschieben Sie die detaillierte Historie nach `memory/*.md`, oder
erhöhen Sie die Bootstrap-Grenzen bewusst.

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um
die injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona austauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung sowie Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Zeitzone des Benutzers bekannt ist. Damit der Prompt cache-stabil bleibt, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional ein sitzungsbezogenes Modell-
Override setzen (`model=default` hebt es auf).

Konfiguration mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vollständige Details zum Verhalten finden Sie unter [Date & Time](/de/date-time).

## Skills

Wenn geeignete Skills vorhanden sind, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Speicherort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine Skills geeignet sind, wird der
Abschnitt Skills ausgelassen.

Die Eignung umfasst Gates aus Skill-Metadaten, Prüfungen der Laufzeitumgebung/Konfiguration
und die effektive Skill-Allowlist des Agents, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Von Plugins gebündelte Skills sind nur geeignet, wenn ihr besitzendes Plugin aktiviert ist.
So können Tool-Plugins ausführlichere Betriebsanleitungen bereitstellen, ohne diese
Anleitung direkt in jede Tool-Beschreibung einzubetten.

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

Das Budget der Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Override pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Laufzeitauszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größenbestimmung für Skills getrennt von der Größenbestimmung für Laufzeit-Lesen/Injektion, etwa
`memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist, verweist er
auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelte Dokumentation des npm-
Pakets). Wenn lokale Dokumentation nicht verfügbar ist, fällt er auf
[https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält außerdem den OpenClaw-Quellspeicherort. Git-Checkouts machen das lokale
Quell-Root verfügbar, damit der Agent Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-
Quell-URL und weisen den Agent an, die Quellen dort zu prüfen, wenn die Dokumentation unvollständig oder
veraltet ist. Der Prompt erwähnt außerdem die öffentliche Docs-Spiegelung, den Community-Discord und ClawHub
([https://clawhub.ai](https://clawhub.ai)) zur Entdeckung von Skills. Er weist das Modell an,
zuerst die Dokumentation für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur zu konsultieren und
`openclaw status` nach Möglichkeit selbst auszuführen (und den Benutzer nur zu fragen, wenn kein Zugriff besteht).
Speziell für die Konfiguration verweist er Agents auf die `gateway`-Tool-Aktion
`config.schema.lookup` für exakte feldbezogene Dokumentation und Einschränkungen, anschließend auf
`docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md`
für umfassendere Anleitung.

## Verwandt

- [Agent runtime](/de/concepts/agent)
- [Agent workspace](/de/concepts/agent-workspace)
- [Context engine](/de/concepts/context-engine)
