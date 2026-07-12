---
read_when:
    - Bearbeiten des System-Prompt-Texts, der Werkzeugliste oder der Zeit-/Heartbeat-Abschnitte
    - Ändern des Verhaltens beim Workspace-Bootstrap oder bei der Skills-Injektion
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengestellt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-07-12T01:38:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agentenlauf einen eigenen System-Prompt; es gibt keinen standardmäßigen Laufzeit-Prompt.

Der Aufbau umfasst drei Ebenen:

- `buildAgentSystemPrompt` rendert den Prompt aus expliziten Eingaben. Die Funktion bleibt ein reiner Renderer und liest die globale Konfiguration nicht direkt.
- `resolveAgentSystemPromptConfig` löst konfigurationsgestützte Prompt-Optionen (Anzeige des Besitzers, TTS-Hinweise, Modellaliase, Zitiermodus für den Speicher, Delegierungsmodus für Sub-Agenten) für einen bestimmten Agenten auf.
- Laufzeitadapter (eingebettet, CLI, Befehls-/Exportvorschauen, Compaction) erfassen aktuelle Fakten (Werkzeuge, Sandbox-Status, Kanalfunktionen, Kontextdateien, Prompt-Beiträge des Providers) und rufen die konfigurierte Prompt-Fassade auf.

Dadurch bleiben exportierte und zur Fehlerdiagnose verwendete Prompt-Oberflächen mit Live-Läufen abgestimmt, ohne jedes Laufzeitdetail in einen einzigen monolithischen Builder zu überführen.

Provider-Plugins können cachebewusste Anweisungen beitragen, ohne den OpenClaw-eigenen Prompt zu ersetzen. Eine Provider-Laufzeit kann:

- einen von drei benannten Kernabschnitten ersetzen: `interaction_style`, `tool_call_style`, `execution_bias`
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze einfügen
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze einfügen

Verwenden Sie Provider-eigene Beiträge für die spezifische Abstimmung von Modellfamilien. Behalten Sie den veralteten Hook `before_prompt_build` der Kompatibilität oder tatsächlich globalen Prompt-Änderungen vor.

Das gebündelte Overlay für die OpenAI-/Codex-GPT-5-Familie (`resolveGpt5SystemPromptContribution`) verwendet diesen Mechanismus: einen `stablePrefix`-Verhaltensvertrag (Ausführungsrichtlinie, Werkzeugdisziplin, Ausgabevertrag, Abschlussvertrag) sowie eine optionale Überschreibung von `interaction_style` für einen freundlicheren Ton. Es gilt für jede über die OpenAI- oder Codex-Plugins weitergeleitete Modell-ID `gpt-5*` und wird durch `agents.defaults.promptOverlays.gpt5.personality` gesteuert (`"friendly"`/`"on"` oder `"off"`).

## Struktur

Der Prompt ist kompakt und enthält feste Abschnitte:

- **Werkzeuge**: Hinweis, dass strukturierte Werkzeuge die maßgebliche Quelle sind, sowie Laufzeitanweisungen zur Werkzeugverwendung. Wenn das experimentelle Werkzeug `update_plan` aktiviert ist (`tools.experimental.planTool`), ergänzt dessen eigene Werkzeugbeschreibung: nur für nicht triviale, mehrstufige Arbeiten verwenden, höchstens einen Schritt auf `in_progress` setzen und bei einfachen, einstufigen Arbeiten darauf verzichten.
- **Ausführungspriorität**: Bei umsetzbaren Anfragen innerhalb des aktuellen Durchlaufs handeln, bis zum Abschluss oder bis zu einer Blockierung fortfahren, sich von unzureichenden Werkzeugergebnissen erholen, veränderlichen Status live prüfen und vor dem Abschluss verifizieren.
- **Sicherheit**: kurzer Leitplankenhinweis gegen machtstrebendes Verhalten oder das Umgehen von Aufsicht.
- **Skills** (sofern verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw-Steuerung**: Für Konfigurations- und Neustartarbeiten das Werkzeug `gateway` bevorzugen; keine CLI-Befehle erfinden.
- **OpenClaw-Selbstaktualisierung**: Konfiguration sicher mit `config.schema.lookup` prüfen, mit `config.patch` ändern, die vollständige Konfiguration mit `config.apply` ersetzen und `update.run` nur auf ausdrückliche Benutzeranfrage ausführen. Das agentenseitige Werkzeug `gateway` verweigert das Umschreiben von `tools.exec.ask` / `tools.exec.security`, einschließlich veralteter Aliase unter `tools.bash.*`, die auf diese geschützten Pfade normalisiert werden.
- **Arbeitsbereich**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Pfad zu Dokumentation/Quellen und Hinweise dazu, wann diese gelesen werden sollen.
- **Arbeitsbereichsdateien (eingefügt)**: weist darauf hin, dass Bootstrap-Dateien weiter unten enthalten sind.
- **Sandbox** (wenn aktiviert): Sandbox-Laufzeit, Sandbox-Pfade und Verfügbarkeit einer Ausführung mit erhöhten Rechten.
- **Aktuelles Datum und aktuelle Uhrzeit**: nur die Zeitzone (cache-stabil; die aktuelle Uhrzeit stammt aus `session_status`).
- **Anweisungen für die Assistentenausgabe**: kompakte Syntax für Anhänge, Sprachnachrichten und Antwort-Tags.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Laufzeit**: Host, Betriebssystem, Node, Modell, Repository-Stammverzeichnis (wenn erkannt), Denkintensität (eine Zeile).
- **Schlussfolgerung**: aktuelle Sichtbarkeitsstufe sowie Hinweis zum Umschalten mit `/reasoning`.

Umfangreiche stabile Inhalte (einschließlich **Projektkontext**) bleiben oberhalb der internen Prompt-Cache-Grenze. Veränderliche Abschnitte pro Durchlauf (Einbettungsanweisungen für die Steuerungsoberfläche, **Nachrichtenübermittlung**, **Sprache**, **Gruppenchat-Kontext**, **Reaktionen**, **Heartbeats**, **Laufzeit**) werden unterhalb dieser Grenze angefügt, damit lokale Backends mit Präfix-Caches das stabile Arbeitsbereichspräfix über mehrere Kanaldurchläufe hinweg wiederverwenden können. Werkzeugbeschreibungen sollten keine aktuellen Kanalnamen einbetten, wenn das akzeptierte Schema dieses Laufzeitdetail bereits enthält.

Der Werkzeugabschnitt enthält außerdem Anweisungen für lang laufende Arbeiten:

- Cron für zukünftige Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeiten) statt Warteschleifen mit `exec`, Verzögerungstricks mit `yieldMs` oder wiederholter Abfrage von `process` verwenden
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf den Push-basierten Aufweckpfad verlassen
- `process` für Protokolle, Status, Eingaben oder Eingriffe bei einem laufenden Befehl verwenden
- bei größeren Aufgaben `sessions_spawn` bevorzugen; der Abschluss von Sub-Agenten erfolgt Push-basiert und wird dem Anfragenden automatisch gemeldet
- `subagents list` / `sessions_list` nicht in einer Schleife abfragen, nur um auf den Abschluss zu warten

`agents.defaults.subagents.delegationMode` (Standardwert `"suggest"`) kann dies verstärken. `"prefer"` fügt einen eigenen Abschnitt **Delegierung an Sub-Agenten** hinzu, der den Hauptagenten anweist, als reaktionsfähiger Koordinator zu handeln und alles, was über eine direkte Antwort hinausgeht, über `sessions_spawn` abzuwickeln. Dies betrifft nur den Prompt; die Werkzeugrichtlinie steuert weiterhin, ob `sessions_spawn` verfügbar ist.

Sicherheitsleitplanken im System-Prompt sind Empfehlungen, keine Durchsetzung. Verwenden Sie Werkzeugrichtlinien, Ausführungsgenehmigungen, Sandboxing und Kanal-Zulassungslisten für eine verbindliche Durchsetzung; Betreiber können Prompt-Leitplanken bewusst deaktivieren.

Bei Kanälen mit nativen Genehmigungskarten oder -schaltflächen weist der Prompt den Agenten an, sich zuerst auf diese Benutzeroberfläche zu verlassen und einen manuellen Befehl `/approve` nur dann anzugeben, wenn das Werkzeugergebnis meldet, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw rendert kleinere System-Prompts für Sub-Agenten. Die Laufzeit setzt pro Lauf einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agenten verwendet; lässt den Speicher-Prompt-Abschnitt (als **Speicherabruf** gebündelt), **OpenClaw-Selbstaktualisierung**, **Modellaliase**, **Benutzeridentität**, **Anweisungen für die Assistentenausgabe**, **Nachrichtenübermittlung**, **Stille Antworten** und **Heartbeats** aus. Werkzeuge, **Sicherheit**, **Skills** (wenn bereitgestellt), Arbeitsbereich, Sandbox, aktuelles Datum und aktuelle Uhrzeit (sofern bekannt), Laufzeit und eingefügter Kontext bleiben verfügbar.
- `none`: gibt nur die grundlegende Identitätszeile zurück.

Unter `promptMode=minimal` werden zusätzlich eingefügte Prompts als **Sub-Agenten-Kontext** statt als **Gruppenchat-Kontext** bezeichnet.

Bei automatischen Kanalantwortläufen lässt OpenClaw den allgemeinen Abschnitt **Stille Antworten** aus, wenn der Kontext für Direktnachrichten, Gruppen oder ausschließlich über das Nachrichtenwerkzeug gesendete Antworten bereits den Vertrag für sichtbare Antworten festlegt. Nur der veraltete automatische Gruppen-/Kanalmodus zeigt `NO_REPLY`; Direktchats und ausschließlich über das Nachrichtenwerkzeug gesendete Antworten verzichten auf Anweisungen zu Tokens für stille Antworten.

## Prompt-Snapshots

OpenClaw verwaltet eingecheckte Prompt-Snapshots für den Standardablauf der Codex-Laufzeit unter `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Sie rendern ausgewählte Thread-/Durchlaufparameter des App-Servers sowie einen rekonstruierten Stapel modellgebundener Prompt-Ebenen für Telegram-Direktnachrichten, Discord-Gruppen und Heartbeat-Durchläufe: ein fixiertes Codex-Modell-Prompt-Fixture für `gpt-5.5`, den Codex-Entwicklertext zu Berechtigungen für den Standardablauf, OpenClaw-Entwickleranweisungen, durchlaufbezogene Anweisungen zum Zusammenarbeitsmodus, wenn OpenClaw sie bereitstellt, Benutzereingaben des Durchlaufs und Verweise auf dynamische Werkzeugspezifikationen.

Aktualisieren Sie das fixierte Codex-Modell-Prompt-Fixture mit `pnpm prompt:snapshots:sync-codex-model`. Standardmäßig wird zunächst nach `$CODEX_HOME/models_cache.json`, dann nach `~/.codex/models_cache.json` und anschließend nach der Konvention für Maintainer-Checkouts `~/code/codex/codex-rs/models-manager/models.json` gesucht; wenn keine dieser Dateien vorhanden ist, wird der Vorgang beendet, ohne das eingecheckte Fixture zu ändern. Übergeben Sie `--catalog <path>`, um es aus einer bestimmten Datei `models_cache.json` oder `models.json` zu aktualisieren.

Diese Snapshots sind keine bytegenaue Erfassung einer unverarbeiteten OpenAI-Anfrage. Codex kann laufzeiteigenen Arbeitsbereichskontext (`AGENTS.md`, Umgebungskontext, Erinnerungen, App-/Plugin-Anweisungen, integrierte Anweisungen für den Default-Zusammenarbeitsmodus) hinzufügen, nachdem OpenClaw die Thread- und Durchlaufparameter gesendet hat.

Generieren Sie sie mit `pnpm prompt:snapshots:gen` neu; prüfen Sie Abweichungen mit `pnpm prompt:snapshots:check`. Die CI führt die Abweichungsprüfung zusammen mit den Shards für zusätzliche Grenzen aus, sodass Prompt-Änderungen und Snapshot-Aktualisierungen im selben PR eingehen.

## Einfügen des Arbeitsbereich-Bootstraps

Bootstrap-Dateien werden aus dem aktiven Arbeitsbereich aufgelöst und an die Prompt-Oberfläche weitergeleitet, die ihrer Lebensdauer entspricht:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in ganz neuen Arbeitsbereichen)
- `MEMORY.md`, sofern vorhanden

Im nativen Codex-Harness vermeidet OpenClaw, stabile Arbeitsbereichsdateien in jedem Benutzerdurchlauf zu wiederholen. Codex lädt `AGENTS.md` über seine eigene Erkennung von Projektdokumenten. `TOOLS.md` wird als vererbte Codex-Entwickleranweisung weitergeleitet. `SOUL.md`, `IDENTITY.md` und `USER.md` werden als durchlaufbezogene Entwickleranweisungen für den Zusammenarbeitsmodus weitergeleitet, damit native Codex-Sub-Agenten sie nicht erben. Der Inhalt von `HEARTBEAT.md` wird nicht direkt eingefügt; Heartbeat-Durchläufe erhalten einen Hinweis zum Zusammenarbeitsmodus, der auf die Datei verweist, wenn sie vorhanden und nicht leer ist. Der Inhalt von `MEMORY.md` wird ebenfalls nicht in jeden nativen Codex-Durchlauf eingefügt: Wenn Speicherwerkzeuge für den Arbeitsbereich verfügbar sind, erhalten Codex-Durchläufe einen kurzen Hinweis zum Arbeitsbereichsspeicher, der das Modell zu `memory_search` oder `memory_get` führt. Wenn Werkzeuge deaktiviert sind, die Speichersuche nicht verfügbar ist oder sich der aktive Arbeitsbereich vom Agentenspeicher-Arbeitsbereich unterscheidet, greift `MEMORY.md` auf den normalen begrenzten Durchlaufkontextpfad zurück. `BOOTSTRAP.md` behält die normale Rolle im Durchlaufkontext.

In anderen Harnesses als Codex werden Bootstrap-Dateien gemäß ihren bestehenden Bedingungen in den OpenClaw-Prompt aufgenommen. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn Heartbeats für den Standardagenten deaktiviert sind oder `agents.defaults.heartbeat.includeSystemPromptSection` auf `false` gesetzt ist. Halten Sie eingefügte Dateien kurz, insbesondere `MEMORY.md` außerhalb von Codex: Sie sollte eine kuratierte langfristige Zusammenfassung bleiben; ausführliche tägliche Notizen gehören in `memory/*.md` und können bei Bedarf über `memory_search` / `memory_get` abgerufen werden. Übermäßig große `MEMORY.md`-Dateien außerhalb von Codex erhöhen die Prompt-Nutzung und können gemäß den nachstehenden Grenzwerten für Bootstrap-Dateien nur teilweise eingefügt werden.

<Note>
Tägliche Dateien unter `memory/*.md` sind **nicht** Teil des normalen Bootstrap-Projektkontexts. Bei gewöhnlichen Durchläufen wird bei Bedarf über `memory_search` / `memory_get` auf sie zugegriffen, sodass sie nicht auf das Kontextfenster angerechnet werden, sofern das Modell sie nicht ausdrücklich liest. Unveränderte `/new`- und `/reset`-Durchläufe bilden die Ausnahme: Die Laufzeit kann aktuelle tägliche Erinnerungen als einmaligen Startkontextblock für diesen ersten Durchlauf voranstellen.
</Note>

Große Dateien werden mit einer Markierung gekürzt:

| Grenzwert                                    | Konfigurationsschlüssel                             | Standardwert |
| -------------------------------------------- | --------------------------------------------------- | ------------ |
| Maximale Zeichenzahl pro Datei               | `agents.defaults.bootstrapMaxChars`                 | 20000        |
| Gesamtzahl über alle Dateien                 | `agents.defaults.bootstrapTotalMaxChars`            | 60000        |
| Kürzungswarnung (`off`\|`once`\|`always`)    | `agents.defaults.bootstrapPromptTruncationWarning`  | `always`     |

Fehlende Dateien fügen eine kurze Markierung für fehlende Dateien ein. Detaillierte Rohdaten- und Einfügungszahlen bleiben in Diagnoseausgaben wie `/context`, `/status`, doctor und Protokollen verfügbar.

Bei Speicherdateien bedeutet die Kürzung keinen Datenverlust: Die Datei bleibt auf dem Datenträger unverändert. Im nativen Codex wird `MEMORY.md`, sofern verfügbar, bei Bedarf über Speicherwerkzeuge gelesen; andernfalls wird ein begrenzter Prompt-Rückfallpfad verwendet. In anderen Harnesses sieht das Modell nur die gekürzte eingefügte Kopie, bis es den Speicher direkt liest oder durchsucht. Wenn `MEMORY.md` wiederholt gekürzt wird, verdichten Sie sie zu einer kürzeren dauerhaften Zusammenfassung, verschieben Sie den ausführlichen Verlauf nach `memory/*.md` oder erhöhen Sie die Bootstrap-Grenzwerte bewusst.

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien werden herausgefiltert, um den Kontext des Sub-Agenten klein zu halten).

Interne Hooks können diesen Schritt über das Ereignis `agent:bootstrap` abfangen, um die injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (beispielsweise um `SOUL.md` gegen eine alternative Persona auszutauschen).

Um weniger generisch zu klingen, beginnen Sie mit dem [Persönlichkeitsleitfaden in SOUL.md](/de/concepts/soul).

Um zu prüfen, welchen Umfang jede injizierte Datei beiträgt (Rohdaten gegenüber injizierten Daten, Kürzung, Mehraufwand durch das Werkzeugschema), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitverarbeitung

Der Abschnitt **Aktuelles Datum und aktuelle Uhrzeit** erscheint nur, wenn die Zeitzone des Benutzers bekannt ist, und enthält ausschließlich die **Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat), damit der Prompt-Cache stabil bleibt.

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; dessen Statuskarte enthält eine Zeitstempelzeile. Dasselbe Werkzeug kann optional eine sitzungsspezifische Modellüberschreibung festlegen (`model=default` hebt sie auf).

Konfigurieren Sie dies mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vollständige Einzelheiten zum Verhalten finden Sie unter [Zeitzonen](/de/concepts/timezone) und [Datum und Uhrzeit](/de/date-time).

## Skills

Wenn geeignete Skills vorhanden sind, injiziert OpenClaw eine kompakte `<available_skills>`-Liste (`formatSkillsForPrompt`) mit dem **Dateipfad** und einer aus dem Inhalt abgeleiteten `<version>sha256:...</version>`-Markierung für jeden Skill. Der Prompt weist das Modell an, mit `read` die SKILL.md am angegebenen Speicherort (Arbeitsbereich, verwaltet oder mitgeliefert) zu laden und einen Skill erneut zu lesen, wenn sich dessen `<version>` von einer vorherigen Interaktion unterscheidet. Wenn keine Skills geeignet sind, wird der Abschnitt „Skills“ weggelassen.

Native Codex-Interaktionen erhalten diese Liste als auf die jeweilige Interaktion beschränkte Entwickleranweisungen zur Zusammenarbeit statt als Benutzereingabe pro Interaktion; ausgenommen sind einfache Cron-Interaktionen, die den exakten geplanten Prompt beibehalten. Andere Laufzeitumgebungen verwenden weiterhin den normalen Prompt-Abschnitt.

Der Speicherort kann auf einen verschachtelten Skill verweisen, beispielsweise `skills/personal/foo/SKILL.md`. Die Verschachtelung dient ausschließlich der Organisation; der Prompt verwendet den flachen Skill-Namen aus dem Frontmatter von `SKILL.md`.

Die Eignung berücksichtigt Metadatenbedingungen des Skills, Prüfungen der Laufzeitumgebung und -konfiguration sowie die effektive Skill-Zulassungsliste des Agenten, wenn `agents.defaults.skills` oder `agents.list[].skills` konfiguriert ist. Mit Plugins gebündelte Skills sind nur geeignet, wenn das zugehörige Plugin aktiviert ist. Dadurch können Werkzeug-Plugins ausführlichere Bedienungsanleitungen bereitstellen, ohne all diese Hinweise in jede Werkzeugbeschreibung einzubetten.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Dadurch bleibt der Basis-Prompt klein, während die gezielte Verwendung von Skills weiterhin möglich ist. Die Größenbegrenzung wird vom Skills-Subsystem verwaltet und ist von der allgemeinen Größenbegrenzung für das Lesen und Injizieren zur Laufzeit getrennt:

| Geltungsbereich | Budget für den Skills-Prompt                       | Budget für Laufzeitauszüge         |
| --------------- | -------------------------------------------------- | ---------------------------------- |
| Global          | `skills.limits.maxSkillsPromptChars`               | `agents.defaults.contextLimits.*`  |
| Pro Agent       | `agents.list[].skillsLimits.maxSkillsPromptChars`  | `agents.list[].contextLimits.*`    |

Das Budget für Laufzeitauszüge umfasst `memory_get`, aktuelle Werkzeugergebnisse und Aktualisierungen von `AGENTS.md` nach der Compaction.

## Dokumentation

Der Abschnitt **Dokumentation** verweist auf lokale Dokumentation, sofern verfügbar (`docs/` in einem Git-Checkout oder die mitgelieferte Dokumentation des npm-Pakets), und verwendet andernfalls [https://docs.openclaw.ai](https://docs.openclaw.ai). Außerdem wird der Speicherort des OpenClaw-Quellcodes aufgeführt: Git-Checkouts stellen das lokale Quellstammverzeichnis bereit, während Paketinstallationen die GitHub-URL des Quellcodes sowie die Anweisung erhalten, den Quellcode dort zu prüfen, wenn die Dokumentation unvollständig oder veraltet ist.

Der Prompt stellt die Dokumentation als maßgebliche Quelle für das Eigenwissen von OpenClaw dar, bevor das Modell versteht, wie OpenClaw funktioniert (Speicher/Tagesnotizen, Sitzungen, Werkzeuge, Gateway, Konfiguration, Befehle, Projektkontext). Er weist das Modell an, `AGENTS.md`, den Projektkontext, Arbeitsbereichs-, Profil- und Speichernotizen sowie `memory_search` als Anweisungskontext oder Benutzerspeicher und nicht als Wissen über das Design oder die Implementierung von OpenClaw zu behandeln. Wenn die Dokumentation keine Angaben enthält oder veraltet ist, soll das Modell dies mitteilen und den Quellcode prüfen. Außerdem wird das Modell angewiesen, nach Möglichkeit selbst `openclaw status` auszuführen und den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt.

Für die Konfiguration verweist der Prompt die Agenten zunächst auf die Aktion `config.schema.lookup` des Werkzeugs `gateway`, um genaue Dokumentation und Einschränkungen auf Feldebene zu erhalten, und anschließend auf `docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md`, um weiterführende Anleitungen zu erhalten.

## Verwandte Themen

- [Agent-Laufzeit](/de/concepts/agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
