---
read_when:
    - Bearbeiten des System-Prompt-Texts, der Werkzeugliste oder der Zeit-/Heartbeat-Abschnitte
    - Verhalten beim Bootstrap des Arbeitsbereichs oder bei der Skills-Injektion ändern
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengestellt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-07-12T15:20:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agentenlauf einen eigenen System-Prompt; es gibt keinen standardmäßigen Laufzeit-Prompt.

Die Zusammenstellung erfolgt in drei Schichten:

- `buildAgentSystemPrompt` rendert den Prompt aus expliziten Eingaben. Die Funktion bleibt ein reiner Renderer und liest die globale Konfiguration nicht direkt.
- `resolveAgentSystemPromptConfig` löst konfigurationsgestützte Prompt-Optionen (Besitzeranzeige, TTS-Hinweise, Modellaliase, Zitiermodus für den Speicher, Delegierungsmodus für Sub-Agenten) für einen bestimmten Agenten auf.
- Laufzeitadapter (eingebettet, CLI, Befehls-/Exportvorschauen, Compaction) erfassen aktuelle Fakten (Tools, Sandbox-Status, Kanalfunktionen, Kontextdateien, Prompt-Beiträge des Providers) und rufen die konfigurierte Prompt-Fassade auf.

Dadurch bleiben exportierte und Debug-Prompt-Oberflächen mit Live-Läufen abgestimmt, ohne jedes Laufzeitdetail in einen einzigen monolithischen Builder zu verwandeln.

Provider-Plugins können cachebewusste Anleitungen beitragen, ohne den OpenClaw-eigenen Prompt zu ersetzen. Eine Provider-Laufzeit kann:

- einen von drei benannten Kernabschnitten ersetzen: `interaction_style`, `tool_call_style`, `execution_bias`
- oberhalb der Prompt-Cache-Grenze ein **stabiles Präfix** einfügen
- unterhalb der Prompt-Cache-Grenze ein **dynamisches Suffix** einfügen

Verwenden Sie Provider-eigene Beiträge für die spezifische Abstimmung auf Modellfamilien. Behalten Sie den älteren Hook `before_prompt_build` für Kompatibilität oder wirklich globale Prompt-Änderungen vor.

Das gebündelte Overlay der OpenAI-/Codex-GPT-5-Familie (`resolveGpt5SystemPromptContribution`) verwendet diesen Mechanismus: einen `stablePrefix`-Verhaltensvertrag (Ausführungsrichtlinie, Tool-Disziplin, Ausgabevertrag, Abschlussvertrag) sowie eine optionale Überschreibung von `interaction_style` für einen freundlicheren Ton. Es gilt für jede `gpt-5*`-Modell-ID, die über die OpenAI- oder Codex-Plugins geleitet wird, und wird durch `agents.defaults.promptOverlays.gpt5.personality` (`"friendly"`/`"on"` oder `"off"`) gesteuert.

## Struktur

Der Prompt ist kompakt und enthält feste Abschnitte:

- **Tools**: Hinweis, dass strukturierte Tools die maßgebliche Informationsquelle sind, sowie Anleitungen zur Tool-Nutzung während der Laufzeit. Wenn das experimentelle Tool `update_plan` aktiviert ist (`tools.experimental.planTool`), ergänzt dessen eigene Tool-Beschreibung: Verwenden Sie es nur für nicht triviale, mehrstufige Aufgaben, halten Sie höchstens einen Schritt auf `in_progress` und überspringen Sie es bei einfachen, einstufigen Aufgaben.
- **Ausführungspriorität**: Bei umsetzbaren Anforderungen innerhalb des aktuellen Durchlaufs handeln, bis zum Abschluss oder bis zu einer Blockierung fortfahren, sich von unzureichenden Tool-Ergebnissen erholen, veränderlichen Status live prüfen und vor dem Abschluss verifizieren.
- **Sicherheit**: Kurzer Leitplankenhinweis gegen machtorientiertes Verhalten oder die Umgehung von Aufsicht.
- **Skills** (wenn verfügbar): Erläutert dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw-Steuerung**: Für Konfigurations-/Neustartarbeiten bevorzugt das Tool `gateway` verwenden; keine CLI-Befehle erfinden.
- **OpenClaw-Selbstaktualisierung**: Die Konfiguration sicher mit `config.schema.lookup` prüfen, mit `config.patch` ändern, die vollständige Konfiguration mit `config.apply` ersetzen und `update.run` nur auf ausdrücklichen Wunsch des Benutzers ausführen. Das agentenseitige Tool `gateway` weigert sich, `tools.exec.ask` / `tools.exec.security` neu zu schreiben; dies schließt ältere `tools.bash.*`-Aliase ein, die auf diese geschützten Pfade normalisiert werden.
- **Arbeitsbereich**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: Lokaler Pfad zu Dokumentation/Quellen und Hinweise dazu, wann diese zu lesen sind.
- **Arbeitsbereichsdateien (eingefügt)**: Weist darauf hin, dass Bootstrap-Dateien nachfolgend enthalten sind.
- **Sandbox** (wenn aktiviert): Sandbox-Laufzeit, Sandbox-Pfade, Verfügbarkeit erhöhter Ausführungsrechte.
- **Aktuelles Datum und aktuelle Uhrzeit**: Nur die Zeitzone (cache-stabil; die aktuelle Uhrzeit stammt aus `session_status`).
- **Direktiven für die Assistentenausgabe**: Kompakte Syntax für Anhänge, Sprachnachrichten und Antwort-Tags.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Laufzeit**: Host, Betriebssystem, Node, Modell, Repository-Stammverzeichnis (wenn erkannt), Denkstufe (eine Zeile).
- **Schlussfolgerung**: Aktuelle Sichtbarkeitsstufe sowie Hinweis auf den Umschalter `/reasoning`.

Umfangreiche stabile Inhalte (einschließlich **Projektkontext**) bleiben oberhalb der internen Prompt-Cache-Grenze. Veränderliche Abschnitte pro Durchlauf (Einbettungsanleitung für die Control UI, **Nachrichtenübermittlung**, **Sprache**, **Gruppenchat-Kontext**, **Reaktionen**, **Heartbeats**, **Laufzeit**) werden unterhalb dieser Grenze angefügt, damit lokale Backends mit Präfix-Caches das stabile Arbeitsbereichspräfix über mehrere Kanaldurchläufe hinweg wiederverwenden können. Tool-Beschreibungen sollten keine aktuellen Kanalnamen einbetten, wenn das akzeptierte Schema dieses Laufzeitdetail bereits enthält.

Die Tool-Anleitung enthält außerdem Hinweise für lang laufende Arbeiten:

- Cron für spätere Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeiten) anstelle von `exec`-Warteschleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-Polling verwenden
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund weiterlaufen
- wenn das automatische Aufwecken bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf den Push-basierten Aufweckpfad verlassen
- `process` für Protokolle, Status, Eingaben oder Eingriffe bei einem laufenden Befehl verwenden
- bei größeren Aufgaben `sessions_spawn` bevorzugen; der Abschluss von Sub-Agenten ist Push-basiert und wird dem Anfordernden automatisch mitgeteilt
- `subagents list` / `sessions_list` nicht in einer Schleife abfragen, nur um auf den Abschluss zu warten

`agents.defaults.subagents.delegationMode` (Standard `"suggest"`) kann dies verstärken. `"prefer"` fügt einen eigenen Abschnitt **Delegierung an Sub-Agenten** hinzu, der den Hauptagenten anweist, als reaktionsfähiger Koordinator zu handeln und alles, was über eine direkte Antwort hinausgeht, über `sessions_spawn` weiterzuleiten. Dies wirkt sich nur auf den Prompt aus; die Tool-Richtlinie bestimmt weiterhin, ob `sessions_spawn` verfügbar ist.

Die Sicherheitsleitplanken im System-Prompt sind Empfehlungen und keine Durchsetzung. Verwenden Sie Tool-Richtlinien, Ausführungsgenehmigungen, Sandboxing und Kanal-Zulassungslisten für eine strikte Durchsetzung; Betreiber können Prompt-Leitplanken absichtlich deaktivieren.

Bei Kanälen mit nativen Genehmigungskarten/-schaltflächen weist der Prompt den Agenten an, sich zunächst auf diese UI zu verlassen und einen manuellen `/approve`-Befehl nur dann anzugeben, wenn das Tool-Ergebnis meldet, dass Chat-Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw rendert kleinere System-Prompts für Sub-Agenten. Die Laufzeit legt pro Durchlauf einen `promptMode` fest (keine benutzerseitige Konfiguration):

- `full` (Standard): alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agenten verwendet; lässt den Speicher-Prompt-Abschnitt (gebündelt als **Speicherabruf**), **OpenClaw-Selbstaktualisierung**, **Modellaliase**, **Benutzeridentität**, **Direktiven für die Assistentenausgabe**, **Nachrichtenübermittlung**, **Stille Antworten** und **Heartbeats** aus. Tools, **Sicherheit**, **Skills** (wenn bereitgestellt), Arbeitsbereich, Sandbox, aktuelles Datum und aktuelle Uhrzeit (wenn bekannt), Laufzeit und eingefügter Kontext bleiben verfügbar.
- `none`: gibt nur die grundlegende Identitätszeile zurück.

Unter `promptMode=minimal` werden zusätzlich eingefügte Prompts mit **Subagent-Kontext** statt mit **Gruppenchat-Kontext** bezeichnet.

Bei automatischen Kanalantworten lässt OpenClaw den allgemeinen Abschnitt **Stille Antworten** weg, wenn der Direkt-, Gruppen- oder reine Nachrichtentool-Kontext bereits den Vertrag für sichtbare Antworten festlegt. Nur der ältere automatische Gruppen-/Kanalmodus zeigt `NO_REPLY`; Direktchats und reine Nachrichtentool-Antworten überspringen die Anleitung für stille Tokens.

## Prompt-Snapshots

OpenClaw verwaltet eingecheckte Prompt-Snapshots für den Codex-Laufzeit-Standardpfad unter `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Sie rendern ausgewählte App-Server-Thread-/Durchlaufparameter sowie einen rekonstruierten Stapel modellgebundener Prompt-Schichten für Telegram-Direkt-, Discord-Gruppen- und Heartbeat-Durchläufe: ein fixiertes Codex-`gpt-5.5`-Modell-Prompt-Fixture, den Codex-Entwicklertext zu Berechtigungen für den Standardpfad, OpenClaw-Entwickleranweisungen, durchlaufbezogene Anweisungen zum Zusammenarbeitsmodus, wenn OpenClaw diese bereitstellt, die Benutzereingabe des Durchlaufs und Verweise auf dynamische Tool-Spezifikationen.

Aktualisieren Sie das fixierte Codex-Modell-Prompt-Fixture mit `pnpm prompt:snapshots:sync-codex-model`. Standardmäßig sucht der Befehl nach `$CODEX_HOME/models_cache.json`, anschließend nach `~/.codex/models_cache.json` und dann gemäß der Maintainer-Checkout-Konvention nach `~/code/codex/codex-rs/models-manager/models.json`; wenn keine dieser Dateien vorhanden ist, wird der Befehl beendet, ohne das eingecheckte Fixture zu ändern. Übergeben Sie `--catalog <path>`, um die Aktualisierung aus einer bestimmten Datei `models_cache.json` oder `models.json` vorzunehmen.

Diese Snapshots sind keine bytegenaue Rohaufzeichnung einer OpenAI-Anfrage. Codex kann laufzeiteigenen Arbeitsbereichskontext (`AGENTS.md`, Umgebungskontext, Erinnerungen, App-/Plugin-Anweisungen, integrierte Anweisungen für den Standard-Zusammenarbeitsmodus) hinzufügen, nachdem OpenClaw Thread- und Durchlaufparameter gesendet hat.

Generieren Sie sie mit `pnpm prompt:snapshots:gen` neu; prüfen Sie Abweichungen mit `pnpm prompt:snapshots:check`. CI führt die Abweichungsprüfung zusammen mit den zusätzlichen Grenz-Shards aus, sodass Prompt-Änderungen und Snapshot-Aktualisierungen im selben PR aufgenommen werden.

## Einfügung des Arbeitsbereich-Bootstraps

Bootstrap-Dateien werden aus dem aktiven Arbeitsbereich aufgelöst und an die Prompt-Oberfläche weitergeleitet, die ihrer Lebensdauer entspricht:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Arbeitsbereichen)
- `MEMORY.md`, wenn vorhanden

Im nativen Codex-Harness vermeidet OpenClaw, stabile Arbeitsbereichsdateien in jedem Benutzerdurchlauf zu wiederholen. Codex lädt `AGENTS.md` über seine eigene Projektdokumenterkennung. `TOOLS.md` wird als vererbte Codex-Entwickleranweisung weitergeleitet. `SOUL.md`, `IDENTITY.md` und `USER.md` werden als durchlaufbezogene Entwickleranweisungen für die Zusammenarbeit weitergeleitet, damit native Codex-Sub-Agenten sie nicht erben. Der Inhalt von `HEARTBEAT.md` wird nicht direkt eingefügt; Heartbeat-Durchläufe erhalten einen Hinweis zum Zusammenarbeitsmodus, der auf die Datei verweist, wenn sie vorhanden und nicht leer ist. Der Inhalt von `MEMORY.md` wird ebenfalls nicht in jeden nativen Codex-Durchlauf eingefügt: Wenn Speicher-Tools für den Arbeitsbereich verfügbar sind, erhalten Codex-Durchläufe einen kurzen Hinweis zum Arbeitsbereichsspeicher, der das Modell zu `memory_search` oder `memory_get` führt. Wenn Tools deaktiviert sind, die Speichersuche nicht verfügbar ist oder sich der aktive Arbeitsbereich vom Agentenspeicher-Arbeitsbereich unterscheidet, fällt `MEMORY.md` auf den normalen begrenzten Durchlaufkontextpfad zurück. `BOOTSTRAP.md` behält die normale Rolle im Durchlaufkontext.

In Nicht-Codex-Harnesses werden Bootstrap-Dateien gemäß ihren bestehenden Bedingungen in den OpenClaw-Prompt aufgenommen. `HEARTBEAT.md` wird bei normalen Durchläufen ausgelassen, wenn Heartbeats für den Standardagenten deaktiviert sind oder `agents.defaults.heartbeat.includeSystemPromptSection` den Wert false hat. Halten Sie eingefügte Dateien kurz, insbesondere `MEMORY.md` außerhalb von Codex: Sie sollte eine kuratierte langfristige Zusammenfassung bleiben, während detaillierte tägliche Notizen in `memory/*.md` bei Bedarf über `memory_search` / `memory_get` abrufbar sind. Übermäßig große Nicht-Codex-Dateien vom Typ `MEMORY.md` erhöhen die Prompt-Nutzung und können gemäß den nachstehenden Grenzwerten für Bootstrap-Dateien nur teilweise eingefügt werden.

<Note>
Tägliche Dateien unter `memory/*.md` sind **nicht** Teil des normalen Bootstrap-Projektkontexts. Bei gewöhnlichen Durchläufen wird bei Bedarf über `memory_search` / `memory_get` auf sie zugegriffen, sodass sie nicht auf das Kontextfenster angerechnet werden, sofern das Modell sie nicht ausdrücklich liest. Reine `/new`- und `/reset`-Durchläufe bilden die Ausnahme: Die Laufzeit kann aktuelle tägliche Erinnerungen als einmaligen Startkontextblock für diesen ersten Durchlauf voranstellen.
</Note>

Große Dateien werden mit einer Markierung gekürzt:

| Grenzwert                                    | Konfigurationsschlüssel                             | Standard |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| Maximale Zeichenanzahl pro Datei             | `agents.defaults.bootstrapMaxChars`                | 20000    |
| Gesamtanzahl über alle Dateien hinweg        | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| Kürzungswarnung (`off`\|`once`\|`always`)    | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

Fehlende Dateien fügen eine kurze Markierung für fehlende Dateien ein. Detaillierte Roh-/Einfügungszahlen verbleiben in Diagnoseausgaben wie `/context`, `/status`, doctor und Protokollen.

Bei Speicherdateien bedeutet die Kürzung keinen Datenverlust: Die Datei bleibt auf dem Datenträger unverändert. Im nativen Codex wird `MEMORY.md` bei Bedarf über Speicher-Tools gelesen, wenn diese verfügbar sind, andernfalls über einen begrenzten Prompt-Rückfallpfad. In anderen Harnesses sieht das Modell nur die gekürzte eingefügte Kopie, bis es den Speicher direkt liest oder durchsucht. Wenn `MEMORY.md` wiederholt gekürzt wird, verdichten Sie die Datei zu einer kürzeren dauerhaften Zusammenfassung, verschieben Sie den detaillierten Verlauf nach `memory/*.md` oder erhöhen Sie die Bootstrap-Grenzwerte bewusst.

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien werden herausgefiltert, um den Kontext des Sub-Agents klein zu halten).

Interne Hooks können diesen Schritt über das Ereignis `agent:bootstrap` abfangen, um die injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (beispielsweise um `SOUL.md` gegen eine alternative Persona auszutauschen).

Damit die Ausgabe weniger generisch klingt, beginnen Sie mit dem [Persönlichkeitsleitfaden in SOUL.md](/de/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh gegenüber injiziert, Kürzung, Overhead des Toolschemas), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitverarbeitung

Der Abschnitt **Aktuelles Datum und aktuelle Uhrzeit** erscheint nur, wenn die Zeitzone des Benutzers bekannt ist, und enthält ausschließlich die **Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat), damit der Prompt-Cache stabil bleibt.

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; dessen Statuskarte enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine sitzungsspezifische Modellüberschreibung festlegen (`model=default` hebt sie auf).

Konfigurieren Sie dies mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Ausführliche Informationen zum Verhalten finden Sie unter [Zeitzonen](/de/concepts/timezone) und [Datum und Uhrzeit](/de/date-time).

## Skills

Wenn geeignete Skills vorhanden sind, injiziert OpenClaw eine kompakte Liste `<available_skills>` (`formatSkillsForPrompt`) mit dem **Dateipfad** und einer aus dem Inhalt abgeleiteten Markierung `<version>sha256:...</version>` für jeden Skill. Der Prompt weist das Modell an, mit `read` die SKILL.md am angegebenen Speicherort (Workspace, verwaltet oder gebündelt) zu laden und einen Skill erneut zu lesen, wenn sich dessen `<version>` gegenüber einer vorherigen Runde unterscheidet. Wenn keine Skills geeignet sind, wird der Abschnitt „Skills“ weggelassen.

Native Codex-Runden erhalten diese Liste als auf die jeweilige Runde beschränkte Entwickleranweisungen für die Zusammenarbeit statt als Benutzereingabe pro Runde. Ausgenommen sind leichtgewichtige Cron-Runden, die den exakten geplanten Prompt beibehalten. Andere Harnesses behalten den normalen Prompt-Abschnitt bei.

Der Speicherort kann auf einen verschachtelten Skill verweisen, etwa `skills/personal/foo/SKILL.md`. Die Verschachtelung dient nur der Organisation; der Prompt verwendet den flachen Skill-Namen aus dem Frontmatter von `SKILL.md`.

Die Eignungsprüfung umfasst Metadaten-Gates für Skills, Prüfungen der Laufzeitumgebung und -konfiguration sowie die effektive Skill-Zulassungsliste des Agents, wenn `agents.defaults.skills` oder `agents.list[].skills` konfiguriert ist. In Plugins gebündelte Skills sind nur geeignet, wenn ihr zugehöriges Plugin aktiviert ist. Dadurch können Tool-Plugins ausführlichere Betriebsanleitungen bereitstellen, ohne all diese Hinweise in jede Toolbeschreibung einzubetten.

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

Dadurch bleibt der Basis-Prompt klein, während die gezielte Verwendung von Skills weiterhin möglich ist. Die Größenbegrenzung wird vom Skills-Subsystem verwaltet, getrennt von der allgemeinen Größenbegrenzung für das Lesen und Injizieren zur Laufzeit:

| Geltungsbereich | Prompt-Budget für Skills                           | Budget für Laufzeitauszüge         |
| --------------- | -------------------------------------------------- | ---------------------------------- |
| Global          | `skills.limits.maxSkillsPromptChars`               | `agents.defaults.contextLimits.*`  |
| Pro Agent       | `agents.list[].skillsLimits.maxSkillsPromptChars`  | `agents.list[].contextLimits.*`    |

Das Budget für Laufzeitauszüge umfasst `memory_get`, Live-Toolergebnisse und Aktualisierungen von `AGENTS.md` nach einer Compaction.

## Dokumentation

Der Abschnitt **Dokumentation** verweist auf lokale Dokumentation, sofern verfügbar (`docs/` in einem Git-Checkout oder die Dokumentation des gebündelten npm-Pakets), und verwendet andernfalls [https://docs.openclaw.ai](https://docs.openclaw.ai). Außerdem wird der Speicherort des OpenClaw-Quellcodes aufgeführt: Git-Checkouts stellen das lokale Quellstammverzeichnis bereit, während Paketinstallationen die GitHub-URL des Quellcodes zusammen mit der Anweisung erhalten, den Quellcode dort zu prüfen, wenn die Dokumentation unvollständig oder veraltet ist.

Der Prompt stellt die Dokumentation als maßgebliche Quelle für das Selbstwissen von OpenClaw dar, bevor das Modell nachvollzieht, wie OpenClaw funktioniert (Speicher/Tagesnotizen, Sitzungen, Tools, Gateway, Konfiguration, Befehle, Projektkontext). Er weist das Modell außerdem an, `AGENTS.md`, den Projektkontext, Workspace-/Profil-/Speichernotizen und `memory_search` als Anweisungskontext oder Benutzerspeicher zu behandeln und nicht als Wissen über Entwurf oder Implementierung von OpenClaw. Wenn die Dokumentation keine Angaben enthält oder veraltet ist, soll das Modell darauf hinweisen und den Quellcode prüfen. Außerdem wird das Modell angewiesen, `openclaw status` nach Möglichkeit selbst auszuführen und den Benutzer nur zu fragen, wenn es keinen Zugriff hat.

Speziell für die Konfiguration verweist der Prompt Agents zunächst auf die Aktion `config.schema.lookup` des Tools `gateway`, um genaue Dokumentation und Einschränkungen auf Feldebene zu erhalten, und anschließend auf `docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md` für weiterführende Hinweise.

## Verwandte Themen

- [Agent-Laufzeit](/de/concepts/agent)
- [Agent-Workspace](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
