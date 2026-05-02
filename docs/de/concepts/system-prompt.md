---
read_when:
    - System-Prompt-Text, Tool-Liste oder Zeit-/Heartbeat-Abschnitte bearbeiten
    - Ändern des Workspace-Bootstraps oder des Verhaltens der Skills-Injektion
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-05-02T22:17:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jede Agent-Ausführung einen benutzerdefinierten System-Prompt. Der Prompt ist **OpenClaw-eigen** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jede Agent-Ausführung injiziert.

Provider-Plugins können cache-bewusste Prompt-Hinweise beitragen, ohne den
vollständigen OpenClaw-eigenen Prompt zu ersetzen. Die Provider-Laufzeitumgebung kann:

- einen kleinen Satz benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für modellfamilien-spezifische Feinabstimmung. Behalten Sie die ältere
`before_prompt_build`-Prompt-Mutation für Kompatibilität oder wirklich globale Prompt-Änderungen bei,
nicht für normales Provider-Verhalten.

Das Overlay für die OpenAI GPT-5-Familie hält die Kernausführungsregel klein und ergänzt
modellspezifische Hinweise für Persona-Verankerung, knappe Ausgabe, Tool-Disziplin,
parallele Nachschlagevorgänge, Abdeckung von Liefergegenständen, Verifikation, fehlenden Kontext und
Hygiene bei Terminal-Tools.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an strukturierte Tools als Quelle der Wahrheit plus Laufzeit-Hinweise zur Tool-Nutzung.
- **Ausführungsfokus**: kompakte Hinweise zum konsequenten Abarbeiten: bei
  handlungsfähigen Anfragen innerhalb derselben Runde handeln, fortfahren bis abgeschlossen oder blockiert,
  sich von schwachen Tool-Ergebnissen erholen, veränderlichen Zustand live prüfen und vor der Finalisierung verifizieren.
- **Sicherheit**: kurze Guardrail-Erinnerung, machtstrebendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf laden soll.
- **OpenClaw-Selbstaktualisierung**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, Konfiguration mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzeranforderung
  ausgeführt wird. Das nur für Eigentümer vorgesehene `gateway`-Tool verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich älterer `tools.bash.*`-
  Aliasse, die auf diese geschützten exec-Pfade normalisieren.
- **Arbeitsbereich**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Pfad zu OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie zu lesen ist.
- **Arbeitsbereichsdateien (injiziert)**: weist darauf hin, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): weist auf Sandbox-Laufzeitumgebung, Sandbox-Pfade und die Verfügbarkeit erhöhter exec-Rechte hin.
- **Aktuelles Datum und Uhrzeit**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Antwort-Tags**: optionale Antwort-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standard-Agent aktiviert sind.
- **Laufzeitumgebung**: Host, Betriebssystem, Node, Modell, Repo-Wurzel (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis zum /reasoning-Umschalter.

OpenClaw hält große stabile Inhalte, einschließlich **Projektkontext**, oberhalb der
internen Prompt-Cache-Grenze. Veränderliche Kanal-/Sitzungsabschnitte wie
Control-UI-Einbettungshinweise, **Messaging**, **Voice**, **Gruppenchat-Kontext**,
**Reaktionen**, **Heartbeats** und **Laufzeitumgebung** werden unterhalb dieser Grenze angehängt,
damit lokale Backends mit Präfix-Caches das stabile Arbeitsbereichspräfix
über Kanalrunden hinweg wiederverwenden können. Tool-Beschreibungen sollten ebenfalls vermeiden,
aktuelle Kanalnamen einzubetten, wenn das akzeptierte Schema dieses Laufzeitdetail bereits enthält.

Der Tooling-Abschnitt enthält außerdem Laufzeit-Hinweise für lang laufende Arbeit:

- Cron für zukünftige Nachverfolgung verwenden (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf
  den push-basierten Aufweckpfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Protokolle, Status, Eingabe oder Eingriff verwenden, wenn Sie einen laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Sub-Agents ist
  push-basiert und kündigt sich automatisch beim Anforderer zurück
- `subagents list` / `sessions_list` nicht in einer Schleife abfragen, nur um auf den Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
`in_progress`-Schritt beizubehalten und zu vermeiden, nach jeder Aktualisierung den gesamten Plan zu wiederholen.

Sicherheits-Guardrails im System-Prompt sind beratend. Sie leiten Modellverhalten an, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, exec-Genehmigungen, Sandboxing und Kanal-Allowlists für harte Durchsetzung; Operatoren können diese absichtlich deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-Buttons weist der Laufzeit-Prompt den
Agent jetzt an, zuerst diese native Genehmigungs-UI zu verwenden. Er sollte nur dann einen manuellen
`/approve`-Befehl einschließen, wenn das Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agents rendern. Die Laufzeitumgebung setzt für jede Ausführung einen
`promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agents verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw-
  Selbstaktualisierung**, **Modellaliase**, **Benutzeridentität**, **Antwort-Tags**,
  **Messaging**, **Stille Antworten** und **Heartbeats** aus. Tooling, **Sicherheit**,
  Arbeitsbereich, Sandbox, Aktuelles Datum und Uhrzeit (wenn bekannt), Laufzeitumgebung und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basisidentitätszeile zurück.

Wenn `promptMode=minimal` ist, werden zusätzlich injizierte Prompts als **Subagent-
Kontext** statt **Gruppenchat-Kontext** gekennzeichnet.

Für automatische Kanalantwort-Ausführungen kann OpenClaw den generischen Abschnitt **Stille Antworten**
weglassen, wenn der direkte/Gruppenchat-Kontext bereits das aufgelöste
konversationsspezifische `NO_REPLY`-Verhalten enthält. Dadurch wird vermieden, Token-Mechanik
sowohl im globalen System-Prompt als auch im Kanalkontext zu wiederholen.

## Prompt-Snapshots

OpenClaw hält committete Happy-Path-Prompt-Snapshots für die Codex/message-tool-
Laufzeit unter `test/fixtures/agents/prompt-snapshots/happy-path/` vor. Sie rendern
ausgewählte App-Server-Thread-/Rundenparameter plus einen rekonstruierten modellgebundenen Prompt-
Layer-Stack für direkte Telegram-, Discord-Gruppen- und Heartbeat-Runden. Dieser Stack
enthält ein angeheftetes Codex-`gpt-5.5`-Modell-Prompt-Fixture, das aus der
Modellkatalog-/Cache-Form von Codex generiert wurde, den Codex-Happy-Path-Berechtigungs-Developer-Text,
OpenClaw-Developer-Anweisungen, Benutzerrunden-Eingabe und Verweise auf die dynamischen
Tool-Spezifikationen.

Aktualisieren Sie das angeheftete Codex-Modell-Prompt-Fixture mit
`pnpm prompt:snapshots:sync-codex-model`. Standardmäßig sucht das Skript den
Laufzeit-Cache von Codex unter `$CODEX_HOME/models_cache.json`, dann unter
`~/.codex/models_cache.json` und fällt erst danach auf die Maintainer-Codex-
Checkout-Konvention unter `~/code/codex/codex-rs/models-manager/models.json` zurück. Wenn
keine dieser Quellen existiert, beendet sich der Befehl, ohne das committete
Fixture zu ändern. Übergeben Sie `--catalog <path>`, um aus einer bestimmten `models_cache.json`-
oder `models.json`-Datei zu aktualisieren.

Diese Snapshots sind weiterhin keine bytegenaue rohe OpenAI-Anfrageerfassung. Codex
kann laufzeiteigenen Arbeitsbereichskontext wie `AGENTS.md`, Umgebungskontext,
Memories, App-/Plugin-Anweisungen und zukünftige Anweisungen für den Kollaborationsmodus
innerhalb der Codex-Laufzeit hinzufügen, nachdem OpenClaw Thread- und Rundenparameter
gesendet hat.

Generieren Sie sie mit `pnpm prompt:snapshots:gen` neu und prüfen Sie Drift mit
`pnpm prompt:snapshots:check`. CI führt die Drift-Prüfung im zusätzlichen
Boundary-Shard aus, damit Prompt-Änderungen und Snapshot-Aktualisierungen am selben
PR hängen bleiben.

## Arbeitsbereich-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Projektkontext** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Arbeitsbereichen)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden bei jeder Runde **in das Kontextfenster injiziert**, sofern
kein dateispezifisches Gate greift. `HEARTBEAT.md` wird bei normalen Ausführungen weggelassen, wenn
Heartbeats für den Standard-Agent deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie injizierte
Dateien knapp, insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung und häufigerer Compaction führen kann.

<Note>
Tägliche `memory/*.md`-Dateien sind **nicht** Teil des normalen Bootstrap-Projektkontexts. In gewöhnlichen Runden wird bei Bedarf über die Tools `memory_search` und `memory_get` auf sie zugegriffen, sodass sie nicht gegen das Kontextfenster zählen, sofern das Modell sie nicht explizit liest. Bloße `/new`- und `/reset`-Runden sind die Ausnahme: Die Laufzeitumgebung kann aktuellen täglichen Memory als einmaligen Startkontextblock für diese erste Runde voranstellen.
</Note>

Große Dateien werden mit einer Markierung abgeschnitten. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der gesamte injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren eine kurze Markierung für fehlende Dateien. Wenn Kürzung
auftritt, kann OpenClaw einen Warnblock im Projektkontext injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md-Persönlichkeitsleitfaden](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh gegenüber injiziert, Kürzung plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen dedizierten Abschnitt **Aktuelles Datum und Uhrzeit**, wenn die
Zeitzone des Benutzers bekannt ist. Damit der Prompt cache-stabil bleibt, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhr oder kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine modellspezifische Überschreibung pro Sitzung
setzen (`model=default` entfernt sie).

Konfigurieren Sie dies mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Datum und Uhrzeit](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn geeignete Skills existieren, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Ort zu laden (Arbeitsbereich, verwaltet oder gebündelt). Wenn keine Skills geeignet sind, wird der
Skills-Abschnitt ausgelassen.

Die Eignung umfasst Skill-Metadaten-Gates, Laufzeitumgebungs-/Konfigurationsprüfungen
und die effektive Skill-Allowlist des Agent, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur geeignet, wenn ihr besitzendes Plugin aktiviert ist.
Dadurch können Tool-Plugins tiefere Betriebsleitfäden bereitstellen, ohne die gesamte
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

Dies hält den Basis-Prompt klein und ermöglicht dennoch gezielte Skill-Nutzung.

Das Budget für die Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Überschreibung pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Laufzeitauszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Skills-Größenbemessung getrennt von der Größenbemessung für Laufzeit-Lesen/-Injektion wie
`memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist, verweist er auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die mitgelieferte Dokumentation des npm-Pakets). Wenn keine lokale Dokumentation verfügbar ist, weicht er auf [https://docs.openclaw.ai](https://docs.openclaw.ai) aus.

Derselbe Abschnitt enthält außerdem den Speicherort des OpenClaw-Quellcodes. Git-Checkouts stellen das lokale Quell-Root bereit, damit der Agent den Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-Quell-URL und weisen den Agenten an, den Quellcode dort zu prüfen, wenn die Dokumentation unvollständig oder veraltet ist. Der Prompt erwähnt außerdem die öffentliche Dokumentationsspiegelung, den Community-Discord und ClawHub ([https://clawhub.ai](https://clawhub.ai)) für die Entdeckung von Skills. Er weist das Modell an, für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur zuerst die Dokumentation zu konsultieren und nach Möglichkeit selbst `openclaw status` auszuführen (und den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt). Speziell für die Konfiguration verweist er Agenten auf die `gateway`-Tool-Aktion `config.schema.lookup` für exakte feldbezogene Dokumentation und Einschränkungen und anschließend auf `docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md` für weiterführende Anleitung.

## Verwandt

- [Agenten-Laufzeit](/de/concepts/agent)
- [Agenten-Arbeitsbereich](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
