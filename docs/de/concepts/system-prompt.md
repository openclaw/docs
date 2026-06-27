---
read_when:
    - System-Prompt-Text, Werkzeugliste oder Zeit-/Heartbeat-Abschnitte bearbeiten
    - Verhalten beim Workspace-Bootstrap oder bei der Skills-Injektion ändern
summary: Was der OpenClaw-Systemprompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-06-27T17:26:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agentenlauf einen benutzerdefinierten System-Prompt. Der Prompt ist **OpenClaw-owned** und verwendet keinen Laufzeit-Standard-Prompt.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agentenlauf injiziert.

Die Prompt-Zusammensetzung hat drei Ebenen:

- `buildAgentSystemPrompt` rendert den Prompt aus expliziten Eingaben. Es sollte
  ein reiner Renderer bleiben und die globale Konfiguration nicht direkt lesen.
- `resolveAgentSystemPromptConfig` löst konfigurationsgestützte Prompt-Regler wie
  Owner-Anzeige, TTS-Hinweise, Modell-Aliasse, Speicher-Zitationsmodus und
  Delegationsmodus für Sub-Agenten für einen bestimmten Agenten auf.
- Laufzeitadapter (Embedded, CLI, Befehls-/Exportvorschauen, Compaction) erfassen
  Live-Fakten wie Tools, Sandbox-Status, Channel-Fähigkeiten, Kontextdateien
  und Provider-Prompt-Beiträge und rufen dann die konfigurierte Prompt-Fassade auf.

Dadurch bleiben exportierte Debug-Prompt-Oberflächen mit Live-Läufen abgeglichen,
ohne jedes laufzeitspezifische Detail in einen monolithischen Builder zu
verwandeln.

Provider-Plugins können cache-bewusste Prompt-Anleitung beitragen, ohne den
vollständigen OpenClaw-owned Prompt zu ersetzen. Die Provider-Laufzeit kann:

- eine kleine Menge benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze injizieren
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze injizieren

Verwenden Sie Provider-eigene Beiträge für modellspezifisches Tuning einer
Modellfamilie. Behalten Sie die veraltete Prompt-Mutation `before_prompt_build`
für Kompatibilität oder wirklich globale Prompt-Änderungen bei, nicht für
normales Provider-Verhalten.

Das Overlay der OpenAI GPT-5-Familie hält die Kern-Ausführungsregel klein und
ergänzt modellspezifische Anleitung für Persona-Latching, knappe Ausgabe,
Tool-Disziplin, parallele Suche, Lieferumfang, Verifizierung, fehlenden Kontext
und Hygiene bei Terminal-Tools.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an strukturierte Tools als Quelle der Wahrheit plus Laufzeit-Anleitung zur Tool-Nutzung.
- **Execution Bias**: kompakte Anleitung zum konsequenten Abschließen: bei
  umsetzbaren Anfragen innerhalb der Runde handeln, fortfahren bis erledigt
  oder blockiert, sich von schwachen Tool-Ergebnissen erholen, veränderlichen
  Zustand live prüfen und vor dem Finalisieren verifizieren.
- **Safety**: kurze Guardrail-Erinnerung, machtsuchendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw Control**: weist das Modell an, für
  Konfigurations-/Neustartarbeiten das `gateway`-Tool zu bevorzugen und keine CLI-Befehle zu erfinden.
- **OpenClaw Self-Update**: wie Konfiguration sicher mit
  `config.schema.lookup` inspiziert, mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche
  Benutzeranfrage ausgeführt wird. Das agentenseitige `gateway`-Tool verweigert
  außerdem das Umschreiben von `tools.exec.ask` / `tools.exec.security`,
  einschließlich veralteter `tools.bash.*`-Aliasse, die auf diese geschützten
  Exec-Pfade normalisieren.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zu OpenClaw-Dokumentation/-Quelle und wann sie zu lesen ist.
- **Workspace Files (injected)**: zeigt an, dass Bootstrap-Dateien unten enthalten sind.
- **Sandbox** (wenn aktiviert): zeigt Sandbox-Laufzeit, Sandbox-Pfade und ob erhöhte Exec-Rechte verfügbar sind.
- **Current Date & Time**: nur Zeitzone (cache-stabil; die Live-Uhr kommt aus `session_status`).
- **Assistant Output Directives**: kompakte Syntax für Anhänge, Sprachnotizen und Reply-Tags.
- **Heartbeats**: Heartbeat-Prompt und Ack-Verhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repo-Root (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis zum `/reasoning`-Schalter.

OpenClaw hält große stabile Inhalte, einschließlich **Project Context**, oberhalb
der internen Prompt-Cache-Grenze. Flüchtige Channel-/Sitzungsabschnitte wie
Control-UI-Einbettungsanleitung, **Messaging**, **Voice**, **Group Chat Context**,
**Reactions**, **Heartbeats** und **Runtime** werden unterhalb dieser Grenze
angefügt, damit lokale Backends mit Präfix-Caches das stabile Workspace-Präfix
über Channel-Runden hinweg wiederverwenden können. Tool-Beschreibungen sollten
ebenfalls vermeiden, aktuelle Channel-Namen einzubetten, wenn das akzeptierte
Schema dieses Laufzeitdetail bereits enthält.

Der Tooling-Abschnitt enthält außerdem Laufzeit-Anleitung für lang laufende Arbeit:

- Cron für zukünftige Nachfassaktionen (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  verwenden statt `exec`-Sleep-Schleifen, `yieldMs`-Delay-Tricks oder wiederholtem
  `process`-Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund
  weiterlaufen
- wenn automatisches Aufwachen bei Abschluss aktiviert ist, den Befehl einmal
  starten und sich auf den Push-basierten Aufwachpfad verlassen, wenn er Ausgabe
  erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingabe oder Eingriffe verwenden, wenn Sie einen
  laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von
  Sub-Agenten ist Push-basiert und kündigt sich automatisch beim Anfragenden an
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf
  den Abschluss zu warten

`agents.defaults.subagents.delegationMode` kann diese Anleitung verstärken. Der
Standardmodus `suggest` behält den grundlegenden Hinweis bei. `prefer` fügt einen
dedizierten Abschnitt **Sub-Agent Delegation** hinzu, der den Hauptagenten anweist,
als reaktionsschneller Koordinator zu handeln und alles, was über eine direkte
Antwort hinausgeht, über `sessions_spawn` weiterzugeben. Dies betrifft nur den
Prompt; die Tool-Policy steuert weiterhin, ob `sessions_spawn` verfügbar ist.

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden,
genau einen `in_progress`-Schritt beizubehalten und nach jedem Update nicht den
gesamten Plan zu wiederholen.

Safety-Guardrails im System-Prompt sind beratend. Sie leiten das Modellverhalten, erzwingen aber keine Policy. Verwenden Sie Tool-Policy, Exec-Genehmigungen, Sandboxing und Channel-Allowlists für harte Durchsetzung; Betreiber können diese absichtlich deaktivieren.

Auf Channels mit nativen Genehmigungskarten/-Buttons weist der Laufzeit-Prompt
den Agenten nun an, zuerst diese native Genehmigungs-UI zu verwenden. Er sollte
nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis sagt,
dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der
einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agenten rendern. Die Laufzeit setzt
für jeden Lauf einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agenten verwendet; lässt **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Assistant Output Directives**,
  **Messaging**, **Silent Replies** und **Heartbeats** aus. Tooling, **Safety**,
  **Skills** sofern bereitgestellt, Workspace, Sandbox, Current Date & Time (wenn
  bekannt), Runtime und injizierter Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal` ist, werden zusätzlich injizierte Prompts als **Subagent
Context** statt **Group Chat Context** beschriftet.

Für automatische Channel-Antwortläufe lässt OpenClaw den generischen Abschnitt
**Silent Replies** weg, wenn direkter, Gruppen- oder nur Message-Tool-Kontext den
Vertrag für sichtbare Antworten besitzt. Nur der alte automatische Gruppen-/
Channel-Modus sollte `NO_REPLY` anzeigen; direkte Chats und reine Message-Tool-
Antworten erhalten keine Anleitung zu Silent-Tokens.

## Prompt-Snapshots

OpenClaw hält committete Prompt-Snapshots für den erfolgreichen Pfad der Codex-Laufzeit unter
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Sie rendern
ausgewählte App-Server-Thread-/Turn-Parameter plus einen rekonstruierten
modellgebundenen Prompt-Layer-Stack für direkte Telegram-, Discord-Gruppen- und
Heartbeat-Runden. Dieser Stack enthält eine gepinnte Codex-`gpt-5.5`-Modell-
Prompt-Fixture, die aus Codex' Modellkatalog-/Cache-Form generiert wurde, den
Codex-Happy-Path-Developer-Text für Berechtigungen, OpenClaw-Developer-
Anweisungen, rundenbezogene Collaboration-Mode-Anweisungen, wenn OpenClaw sie
bereitstellt, Benutzereingabe der Runde und Referenzen auf die dynamischen Tool-
Spezifikationen.

Aktualisieren Sie die gepinnte Codex-Modell-Prompt-Fixture mit
`pnpm prompt:snapshots:sync-codex-model`. Standardmäßig sucht das Skript nach
Codex' Laufzeit-Cache unter `$CODEX_HOME/models_cache.json`, dann unter
`~/.codex/models_cache.json`, und fällt erst dann auf die Maintainer-Codex-
Checkout-Konvention unter `~/code/codex/codex-rs/models-manager/models.json`
zurück. Wenn keine dieser Quellen existiert, beendet sich der Befehl ohne
Änderung der committeten Fixture. Übergeben Sie `--catalog <path>`, um aus einer
bestimmten Datei `models_cache.json` oder `models.json` zu aktualisieren.

Diese Snapshots sind weiterhin keine Byte-für-Byte-Rohaufzeichnung einer OpenAI-Anfrage. Codex
kann laufzeiteigenen Workspace-Kontext wie `AGENTS.md`, Umgebungskontext,
Speicher, App-/Plugin-Anweisungen und eingebaute Default-Collaboration-Mode-
Anweisungen innerhalb der Codex-Laufzeit hinzufügen, nachdem OpenClaw Thread-
und Turn-Parameter sendet.

Regenerieren Sie sie mit `pnpm prompt:snapshots:gen` und verifizieren Sie Drift mit
`pnpm prompt:snapshots:check`. CI führt die Drift-Prüfung im zusätzlichen
Boundary-Shard aus, damit Prompt-Änderungen und Snapshot-Updates im selben PR
zusammenbleiben.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden aus dem aktiven Workspace aufgelöst und dann an die
Prompt-Oberfläche geleitet, die ihrer Lebensdauer entspricht:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden

Im nativen Codex-Harness vermeidet OpenClaw, stabile Workspace-Dateien in jeder
Benutzerrunde zu wiederholen. Codex lädt `AGENTS.md` über seine eigene Project-
Doc-Erkennung. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` und `USER.md` werden als
Codex-Developer-Anweisungen weitergeleitet. Die kompakte OpenClaw-Skills-Liste
wird ebenfalls als rundenbezogene Collaboration-Developer-Anweisungen
weitergeleitet. Inhalte aus `HEARTBEAT.md` werden nicht injiziert; Heartbeat-
Runden erhalten eine Collaboration-Mode-Notiz, die auf die Datei verweist, wenn
sie existiert und nicht leer ist. Inhalte aus `MEMORY.md` aus dem konfigurierten
Agenten-Workspace werden nicht in jede native Codex-Runde eingefügt; wenn
Speicher-Tools für diesen Workspace verfügbar sind, erhalten Codex-Runden eine
kleine Workspace-Memory-Notiz in rundenbezogenen Collaboration-Developer-
Anweisungen und sollten `memory_search` oder `memory_get` verwenden, wenn
dauerhafter Speicher relevant ist. Wenn Tools deaktiviert sind, die Speichersuche
nicht verfügbar ist oder der aktive Workspace vom Agenten-Speicher-Workspace
abweicht, fällt `MEMORY.md` auf den normalen begrenzten Turn-Context-Pfad zurück.
Aktiver `BOOTSTRAP.md`-Inhalt behält vorerst die normale Turn-Context-Rolle.

Auf Nicht-Codex-Harnesses werden Bootstrap-Dateien weiterhin gemäß ihren
bestehenden Gates in den OpenClaw-Prompt komponiert. `HEARTBEAT.md` wird bei
normalen Läufen ausgelassen, wenn Heartbeats für den Standardagenten deaktiviert
sind oder `agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten
Sie injizierte Dateien knapp, besonders `MEMORY.md` außerhalb von Codex.
`MEMORY.md` soll eine kuratierte Langzeitzusammenfassung bleiben; detaillierte
Tagesnotizen gehören in `memory/*.md`, wo `memory_search` und `memory_get` sie
bei Bedarf abrufen können. Überdimensionierte `MEMORY.md`-Dateien außerhalb von
Codex erhöhen die Prompt-Nutzung und können wegen der unten genannten Grenzen für
Bootstrap-Dateien teilweise injiziert werden.

<Note>
Tägliche Dateien unter `memory/*.md` sind **nicht** Teil des normalen Bootstrap-Project-Context. In gewöhnlichen Runden wird bei Bedarf über die Tools `memory_search` und `memory_get` auf sie zugegriffen, sodass sie nicht gegen das Kontextfenster zählen, außer das Modell liest sie explizit. Reine `/new`- und `/reset`-Runden sind die Ausnahme: Die Laufzeit kann aktuellen täglichen Speicher als einmaligen Startup-Context-Block für diese erste Runde voranstellen.
</Note>

Große Dateien werden mit einer Markierung gekürzt. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 20000). Der gesamte injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien injizieren eine kurze Fehlende-Datei-Markierung. Wenn eine Kürzung
erfolgt, kann OpenClaw einen knappen Warnhinweis in den System-Prompt injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `always`). Detaillierte Roh-/Injektionszählungen bleiben in Diagnosen wie
`/context`, `/status`, doctor und Logs.

Bei Speicherdateien ist Kürzung kein Datenverlust: Die Datei bleibt auf der Festplatte intakt.
Bei nativem Codex wird `MEMORY.md` bei Bedarf über Speicher-Tools gelesen, wenn
verfügbar, mit begrenztem Prompt-Fallback, wenn Tools nicht ausgeführt werden können. Bei anderen
Harnesses sieht das Modell nur die gekürzte injizierte Kopie, bis es den Speicher direkt liest oder
durchsucht. Wenn `MEMORY.md` dort wiederholt gekürzt wird, destillieren
Sie sie in eine kürzere dauerhafte Zusammenfassung und verschieben detaillierte Historie nach `memory/*.md`,
oder erhöhen Sie die Bootstrap-Grenzen bewusst.

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` durch eine alternative Persona zu ersetzen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung sowie Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen eigenen Abschnitt **Aktuelles Datum & aktuelle Uhrzeit**, wenn die
Zeitzone des Benutzers bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhr oder Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional einen modellspezifischen Override pro Sitzung
setzen (`model=default` löscht ihn).

Konfigurieren Sie mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Datum & Uhrzeit](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn geeignete Skills vorhanden sind, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die den **Dateipfad** und die aus dem Inhalt abgeleitete
`<version>`-Markierung für jeden Skill enthält. Der Prompt weist das Modell an, `read`
zu verwenden, um die SKILL.md am aufgeführten Ort zu laden (Workspace, verwaltet oder gebündelt),
und einen Skill erneut zu lesen, wenn seine `<version>` von einem vorherigen Turn abweicht. Wenn keine
Skills geeignet sind, wird der Abschnitt Skills ausgelassen.

Native Codex-Turns erhalten diese Liste als turn-bezogene Entwickleranweisungen zur Zusammenarbeit
statt als Benutzereingabe pro Turn, außer leichtgewichtige Cron-Turns, die
den exakt geplanten Prompt beibehalten. Andere Harnesses behalten den normalen Prompt-
Abschnitt bei.

Der Ort kann auf einen verschachtelten Skill verweisen, zum Beispiel
`skills/personal/foo/SKILL.md`. Verschachtelung dient nur der Organisation; der Prompt verwendet weiterhin
den flachen Skill-Namen aus dem Frontmatter von `SKILL.md`.

Eignung umfasst Metadaten-Gates für Skills, Laufzeitumgebungs-/Konfigurationsprüfungen
und die effektive Skill-Allowlist des Agents, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

Plugin-gebündelte Skills sind nur geeignet, wenn ihr besitzendes Plugin aktiviert ist.
So können Tool-Plugins tiefere Betriebsanleitungen bereitstellen, ohne all diese
Anleitungen direkt in jede Tool-Beschreibung einzubetten.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
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

Diese Trennung hält die Größenbemessung von Skills getrennt von der Größenbemessung für Laufzeit-Lesen/-Injektion, wie
`memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach Compaction.

## Dokumentation

Der System-Prompt enthält einen Abschnitt **Dokumentation**. Wenn lokale Dokumentation verfügbar ist, verweist er
auf das lokale OpenClaw-Dokumentationsverzeichnis (`docs/` in einem Git-Checkout oder die gebündelten npm-
Paketdokumente). Wenn lokale Dokumentation nicht verfügbar ist, fällt er auf
[https://docs.openclaw.ai](https://docs.openclaw.ai) zurück.

Derselbe Abschnitt enthält außerdem den Quellort von OpenClaw. Git-Checkouts geben den lokalen
Quell-Root frei, damit der Agent Code direkt prüfen kann. Paketinstallationen enthalten die GitHub-
Quell-URL und weisen den Agent an, dort den Quellcode zu prüfen, wenn die Dokumentation unvollständig oder
veraltet ist. Der Prompt erwähnt außerdem den öffentlichen Dokumentationsspiegel, den Community-Discord und ClawHub
([https://clawhub.ai](https://clawhub.ai)) für die Entdeckung von Skills. Er rahmt die Dokumentation als
Autorität für OpenClaw-Selbstwissen ein, bevor das Modell versteht, wie OpenClaw funktioniert,
einschließlich Speicher/täglicher Notizen, Sitzungen, Tools, Gateway, Konfiguration, Befehle oder Projekt-
kontext. Der Prompt weist das Modell an, zuerst lokale Dokumentation (oder den Dokumentationsspiegel, wenn lokale Dokumentation
nicht verfügbar ist) zu verwenden und AGENTS.md, Projektkontext, Workspace-/Profil-/Speicher-
notizen und `memory_search` als Anweisungskontext oder Benutzerspeicher statt als OpenClaw-
Design- oder Implementierungswissen zu behandeln. Wenn die Dokumentation schweigt oder veraltet ist, sollte das Modell dies sagen
und den Quellcode prüfen. Der Prompt weist das Modell außerdem an, `openclaw status` selbst auszuführen, wenn
möglich, und den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt.
Speziell für Konfiguration verweist er Agents auf die `gateway`-Tool-Aktion
`config.schema.lookup` für exakte feldspezifische Dokumentation und Einschränkungen, danach auf
`docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md`
für breitere Anleitung.

## Verwandt

- [Agent-Laufzeit](/de/concepts/agent)
- [Agent-Workspace](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
