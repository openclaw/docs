---
read_when:
    - Bearbeiten des System-Prompt-Texts, der Werkzeugliste oder der Zeit-/Heartbeat-Abschnitte
    - Ändern des Verhaltens beim Workspace-Bootstrap oder bei der Skills-Injektion
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengestellt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-07-24T03:46:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 669fbc6f21a82a2c3c067d2ff3a6365acb3316460a85f2db165b7ad49ce79f70
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw erstellt für jeden Agentenlauf einen eigenen System-Prompt; es gibt keinen standardmäßigen Laufzeit-Prompt.

Die Zusammensetzung umfasst drei Ebenen:

- `buildAgentSystemPrompt` rendert den Prompt aus expliziten Eingaben. Diese Ebene bleibt ein reiner Renderer und liest die globale Konfiguration nicht direkt.
- `resolveAgentSystemPromptConfig` löst konfigurationsgestützte Prompt-Optionen (Anzeige des Eigentümers, TTS-Hinweise, Modellaliase, Zitiermodus für den Speicher, Delegierungsmodus für Unteragenten) für einen bestimmten Agenten auf.
- Laufzeitadapter (eingebettet, CLI, Befehls-/Exportvorschauen, Compaction) erfassen aktuelle Fakten (Tools, Sandbox-Status, Kanalfunktionen, Kontextdateien, Prompt-Beiträge von Providern) und rufen die konfigurierte Prompt-Fassade auf.

Dadurch bleiben exportierte und zur Fehlerdiagnose dienende Prompt-Oberflächen mit tatsächlichen Läufen konsistent, ohne jedes Laufzeitdetail in einen einzigen monolithischen Builder zu verlagern.

Provider-Plugins können cachegerechte Anweisungen beitragen, ohne den OpenClaw-eigenen Prompt zu ersetzen. Eine Provider-Laufzeit kann:

- einen von drei benannten Kernabschnitten ersetzen: `interaction_style`, `tool_call_style`, `execution_bias`
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze einfügen
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze einfügen

Verwenden Sie Provider-eigene Beiträge für die modellspezifische Abstimmung einer Modellfamilie. Behalten Sie den veralteten Hook `before_prompt_build` der Kompatibilität oder wirklich globalen Prompt-Änderungen vor.

Das gebündelte Overlay für die OpenAI/Codex-GPT-5-Familie (`resolveGpt5SystemPromptContribution`) verwendet diesen Mechanismus: einen `stablePrefix`-Verhaltensvertrag (Ausführungsrichtlinie, Tool-Disziplin, Ausgabevertrag, Abschlussvertrag) sowie eine optionale `interaction_style`-Überschreibung für einen freundlicheren Ton. Es gilt für jede über die OpenAI- oder Codex-Plugins weitergeleitete `gpt-5*`-Modell-ID und wird durch `agents.defaults.promptOverlays.gpt5.personality` gesteuert (`"friendly"`/`"on"` oder `"off"`).

## Struktur

Der Prompt ist kompakt und enthält feste Abschnitte:

- **Tools**: Hinweis auf strukturierte Tools als maßgebliche Quelle sowie Laufzeitanweisungen zur Tool-Nutzung. Wenn das experimentelle Tool `update_plan` aktiviert ist (`tools.experimental.planTool`), ergänzt dessen eigene Tool-Beschreibung: nur für nicht triviale, mehrstufige Arbeiten verwenden, höchstens einen Schritt im Status `in_progress` halten und bei einfachen, einstufigen Arbeiten darauf verzichten.
- **Ausführungspriorität**: bei umsetzbaren Anfragen im aktuellen Durchlauf handeln, bis zum Abschluss oder bis zu einer Blockierung fortfahren, schwache Tool-Ergebnisse ausgleichen, veränderlichen Zustand aktuell prüfen und vor dem Abschluss verifizieren.
- **Sicherheit**: kurze Leitplankenerinnerung gegen Machtstreben oder das Umgehen von Aufsicht.
- **Skills** (sofern verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw-Steuerung**: für Konfigurations- und Neustartarbeiten das Tool `gateway` bevorzugen; keine CLI-Befehle erfinden.
- **OpenClaw-Selbstaktualisierung**: die Konfiguration sicher mit `config.schema.lookup` prüfen, mit `config.patch` patchen, mit `config.apply` vollständig ersetzen und `update.run` nur auf ausdrückliche Benutzeranfrage ausführen. Das agentenseitige Tool `gateway` verweigert das Umschreiben von `tools.exec.mode`.
- **Arbeitsbereich**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Dokumentation**: lokaler Dokumentations-/Quellpfad und Hinweise dazu, wann dieser gelesen werden soll.
- **Arbeitsbereichsdateien (eingefügt)**: weist darauf hin, dass Bootstrap-Dateien nachfolgend enthalten sind.
- **Sandbox** (wenn aktiviert): Sandbox-Laufzeit, Sandbox-Pfade, Verfügbarkeit erhöhter Ausführungsrechte.
- **Aktuelles Datum und aktuelle Uhrzeit**: nur die Zeitzone (cache-stabil; die aktuelle Uhrzeit stammt aus `session_status`).
- **Anweisungen für Assistentenausgaben**: kompakte Syntax für Anhänge, Sprachnachrichten und Antwort-Tags.
- **Heartbeats**: Heartbeat-Prompt und Bestätigungsverhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Laufzeit**: Host, Betriebssystem, Node, Modell, Repository-Stammverzeichnis (wenn erkannt), Denkstufe (eine Zeile).
- **Schlussfolgerung**: aktuelle Sichtbarkeitsstufe sowie Hinweis zum Umschalter `/reasoning`.

Umfangreiche stabile Inhalte (einschließlich **Projektkontext**) verbleiben oberhalb der internen Prompt-Cache-Grenze. Veränderliche Abschnitte pro Durchlauf (Einbettungsanweisungen für die Control UI, **Nachrichten**, **Sprache**, **Gruppenchatkontext**, **Reaktionen**, **Heartbeats**, **Laufzeit**) werden unterhalb dieser Grenze angefügt, damit lokale Backends mit Präfix-Caches das stabile Arbeitsbereichspräfix über mehrere Kanaldurchläufe hinweg wiederverwenden können. Tool-Beschreibungen sollten keine aktuellen Kanalnamen einbetten, wenn das akzeptierte Schema dieses Laufzeitdetail bereits enthält.

Der Abschnitt zu Tools enthält außerdem Anweisungen für lang laufende Arbeiten:

- Cron für spätere Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeiten) anstelle von `exec`-Warteschleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-Polling verwenden
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund weiterlaufen
- wenn das automatische Aufwecken nach Abschluss aktiviert ist, den Befehl einmal starten und sich auf den Push-basierten Aufweckpfad verlassen
- `process` für Protokolle, Status, Eingaben oder Eingriffe bei einem laufenden Befehl verwenden
- bei größeren Aufgaben `sessions_spawn` bevorzugen; der Abschluss von Unteragenten erfolgt Push-basiert und wird dem Anfragenden automatisch mitgeteilt
- `subagents list` / `sessions_list` nicht in einer Schleife abfragen, nur um auf den Abschluss zu warten

`agents.defaults.subagents.delegationMode` (Standard: `"suggest"`) kann dies verstärken. `"prefer"` fügt einen eigenen Abschnitt **Delegierung an Unteragenten** hinzu, der den Hauptagenten anweist, als reaktionsfähiger Koordinator zu handeln und alles, was über eine direkte Antwort hinausgeht, über `sessions_spawn` abzuwickeln. Dies betrifft nur den Prompt; die Tool-Richtlinie steuert weiterhin, ob `sessions_spawn` verfügbar ist.

Die Sicherheitsleitplanken im System-Prompt sind Empfehlungen und keine Durchsetzungsmechanismen. Verwenden Sie Tool-Richtlinien, Ausführungsgenehmigungen, Sandboxing und Kanal-Zulassungslisten zur verbindlichen Durchsetzung; Betreiber können die Prompt-Leitplanken bewusst deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten oder -schaltflächen weist der Prompt den Agenten an, sich zuerst auf diese Benutzeroberfläche zu verlassen und einen manuellen `/approve`-Befehl nur dann anzugeben, wenn das Tool-Ergebnis meldet, dass Chat-Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw rendert kleinere System-Prompts für Unteragenten. Die Laufzeit legt pro Lauf einen `promptMode` fest (keine benutzerseitige Konfiguration):

- `full` (Standard): alle oben genannten Abschnitte.
- `minimal`: wird für Unteragenten verwendet; lässt den Speicher-Prompt-Abschnitt (als **Speicherabruf** gebündelt), **OpenClaw-Selbstaktualisierung**, **Modellaliase**, **Benutzeridentität**, **Anweisungen für Assistentenausgaben**, **Nachrichten**, **Stille Antworten** und **Heartbeats** aus. Tools, **Sicherheit**, **Skills** (sofern bereitgestellt), Arbeitsbereich, Sandbox, aktuelles Datum und aktuelle Uhrzeit (sofern bekannt), Laufzeit und eingefügter Kontext bleiben verfügbar.
- `none`: gibt nur die grundlegende Identitätszeile zurück.

Unter `promptMode=minimal` werden zusätzlich eingefügte Prompts als **Unteragentenkontext** statt als **Gruppenchatkontext** bezeichnet.

Bei automatischen Antwortläufen für Kanäle lässt OpenClaw den allgemeinen Abschnitt **Stille Antworten** aus, wenn der direkte, der Gruppen- oder der ausschließlich auf Nachrichtentools basierende Kontext bereits den Vertrag für sichtbare Antworten definiert. Nur der veraltete automatische Gruppen-/Kanalmodus zeigt `NO_REPLY`; Direktchats und ausschließlich auf Nachrichtentools basierende Antworten lassen Anweisungen zu stillen Tokens aus.

## Prompt-Snapshots

OpenClaw verwaltet eingecheckte Prompt-Snapshots für den Codex-Laufzeit-Standardpfad unter `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Sie rendern ausgewählte Thread-/Durchlaufparameter des App-Servers sowie einen rekonstruierten Schichtenstapel des modellgebundenen Prompts für Telegram-Direktnachrichten, Discord-Gruppen und Heartbeat-Durchläufe: eine fixierte Codex-Vorlage für den `gpt-5.5`-Modell-Prompt, den Entwicklertext zu Berechtigungen für den Codex-Standardpfad, OpenClaw-Entwickleranweisungen, auf den Durchlauf begrenzte Anweisungen zum Zusammenarbeitsmodus, sofern OpenClaw sie bereitstellt, die Benutzereingabe des Durchlaufs sowie Verweise auf dynamische Tool-Spezifikationen.

Aktualisieren Sie die fixierte Codex-Modell-Prompt-Vorlage mit `pnpm prompt:snapshots:sync-codex-model`. Standardmäßig wird zuerst nach `$CODEX_HOME/models_cache.json`, dann nach `~/.codex/models_cache.json` und anschließend nach der Maintainer-Checkout-Konvention `~/code/codex/codex-rs/models-manager/models.json` gesucht; wenn keine davon vorhanden ist, wird das Programm beendet, ohne die eingecheckte Vorlage zu ändern. Übergeben Sie `--catalog <path>`, um sie aus einer bestimmten `models_cache.json`- oder `models.json`-Datei zu aktualisieren.

Diese Snapshots sind keine bytegenaue Erfassung einer unverarbeiteten OpenAI-Anfrage. Codex kann laufzeiteigenen Arbeitsbereichskontext (`AGENTS.md`, Umgebungskontext, Speicherinhalte, App-/Plugin-Anweisungen, integrierte Anweisungen für den Standard-Zusammenarbeitsmodus) hinzufügen, nachdem OpenClaw die Thread- und Durchlaufparameter gesendet hat.

Generieren Sie sie mit `pnpm prompt:snapshots:gen` neu; prüfen Sie Abweichungen mit `pnpm prompt:snapshots:check`. Die CI führt die Abweichungsprüfung zusammen mit den Shards für zusätzliche Grenzen aus, sodass Prompt-Änderungen und Snapshot-Aktualisierungen im selben PR landen.

## Einfügen von Arbeitsbereichs-Bootstrap-Dateien

Bootstrap-Dateien werden aus dem aktiven Arbeitsbereich aufgelöst und an die ihrer Lebensdauer entsprechende Prompt-Oberfläche weitergeleitet:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Arbeitsbereichen)
- `MEMORY.md`, sofern vorhanden

Im nativen Codex-Harness vermeidet OpenClaw, stabile Arbeitsbereichsdateien in jedem Benutzerdurchlauf erneut einzufügen. Codex lädt `AGENTS.md` über seine eigene Erkennung von Projektdokumenten. `TOOLS.md` wird als vererbte Codex-Entwickleranweisung weitergeleitet. `SOUL.md`, `IDENTITY.md` und `USER.md` werden als auf den Durchlauf begrenzte Entwickleranweisungen zum Zusammenarbeitsmodus weitergeleitet, damit native Codex-Unteragenten sie nicht erben. Der Inhalt von `HEARTBEAT.md` wird nicht direkt eingefügt; Heartbeat-Durchläufe erhalten einen Hinweis zum Zusammenarbeitsmodus, der auf die Datei verweist, wenn sie vorhanden und nicht leer ist. Auch der Inhalt von `MEMORY.md` wird nicht in jeden nativen Codex-Durchlauf eingefügt: Wenn Speicher-Tools für den Arbeitsbereich verfügbar sind, erhalten Codex-Durchläufe einen kurzen Hinweis zum Arbeitsbereichsspeicher, der das Modell auf `memory_search` oder `memory_get` verweist. Wenn Tools deaktiviert sind, die Speichersuche nicht verfügbar ist oder sich der aktive Arbeitsbereich vom Agentenspeicher-Arbeitsbereich unterscheidet, greift `MEMORY.md` auf den normalen begrenzten Durchlaufkontextpfad zurück. `BOOTSTRAP.md` behält die normale Durchlaufkontextrolle.

Auf anderen Harnesses als Codex werden Bootstrap-Dateien gemäß ihren bestehenden Bedingungen in den OpenClaw-Prompt integriert. `HEARTBEAT.md` wird bei normalen Läufen ausgelassen, wenn Heartbeats für den Standardagenten deaktiviert sind oder `agents.defaults.heartbeat.includeSystemPromptSection` den Wert „false“ hat. Halten Sie eingefügte Dateien knapp, insbesondere `MEMORY.md` außerhalb von Codex: Diese Datei sollte eine kuratierte langfristige Zusammenfassung bleiben, während detaillierte tägliche Notizen in `memory/*.md` bei Bedarf über `memory_search` / `memory_get` abgerufen werden können. Übergroße `MEMORY.md`-Dateien außerhalb von Codex erhöhen die Prompt-Nutzung und können gemäß den nachfolgenden Begrenzungen für Bootstrap-Dateien nur teilweise eingefügt werden.

<Note>
Die Tagesdateien `memory/*.md` sind **kein** Bestandteil des normalen Bootstrap-Projektkontexts. Bei gewöhnlichen Durchläufen wird bei Bedarf über `memory_search` / `memory_get` auf sie zugegriffen, sodass sie nicht auf das Kontextfenster angerechnet werden, sofern das Modell sie nicht ausdrücklich liest. Reine `/new`- und `/reset`-Durchläufe bilden die Ausnahme: Die Laufzeit kann aktuelle tägliche Speicherinhalte als einmaligen Startkontextblock für diesen ersten Durchlauf voranstellen.
</Note>

Große Dateien werden mit einer Markierung gekürzt:

| Grenze                                       | Konfigurationsschlüssel                              | Standard |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| Maximale Zeichenzahl pro Datei               | `agents.defaults.bootstrapMaxChars`                | 20000    |
| Gesamtzahl über alle Dateien hinweg          | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| Kürzungswarnung (`off`\|`once`\|`always`) | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

Fehlende Dateien fügen eine kurze Markierung für fehlende Dateien ein. Detaillierte Roh-/Einfügungszahlen verbleiben in Diagnosen wie `/context`, `/status`, doctor und Protokollen.

Bei Speicherdateien bedeutet Kürzung keinen Datenverlust: Die Datei bleibt auf dem Datenträger unverändert. In nativem Codex wird `MEMORY.md` bei Bedarf über Speicherwerkzeuge gelesen, sofern verfügbar, andernfalls mit einer begrenzten Prompt-Ausweichlösung. In anderen Harnesses sieht das Modell nur die gekürzte eingefügte Kopie, bis es den Speicher direkt liest oder durchsucht. Wenn `MEMORY.md` wiederholt gekürzt wird, verdichten Sie die Datei zu einer kürzeren dauerhaften Zusammenfassung, verschieben Sie den detaillierten Verlauf nach `memory/*.md`, oder erhöhen Sie bewusst die Bootstrap-Grenzwerte.

Sub-Agent-Sitzungen fügen nur `AGENTS.md` und `TOOLS.md` ein (andere Bootstrap-Dateien werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über das Ereignis `agent:bootstrap` abfangen, um die eingefügten Bootstrap-Dateien zu verändern oder zu ersetzen (beispielsweise indem `SOUL.md` durch eine alternative Persona ersetzt wird).

Um weniger generisch zu klingen, beginnen Sie mit dem [Persönlichkeitsleitfaden in SOUL.md](/de/concepts/soul).

Um zu prüfen, wie viel jede eingefügte Datei beiträgt (roh gegenüber eingefügt, Kürzung, Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitverarbeitung

Der Abschnitt **Aktuelles Datum und aktuelle Uhrzeit** erscheint nur, wenn die Zeitzone des Benutzers bekannt ist, und enthält nur die **Zeitzone** (keine dynamische Uhr oder kein Zeitformat), damit der Prompt-Cache stabil bleibt.

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die zugehörige Statuskarte enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine sitzungsspezifische Modellüberschreibung festlegen (`model=default` löscht sie).

Konfiguration:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Vollständige Details zum Verhalten finden Sie unter [Zeitzonen](/de/concepts/timezone) und [Datum und Uhrzeit](/de/date-time).

## Skills

Wenn geeignete Skills vorhanden sind, fügt OpenClaw eine kompakte Liste `<available_skills>` (`formatSkillsForPrompt`) mit dem **Dateipfad** und einer aus dem Inhalt abgeleiteten `<version>sha256:...</version>`-Markierung pro Skill ein. Der Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten Speicherort (Arbeitsbereich, verwaltet oder gebündelt) zu laden und einen Skill erneut zu lesen, wenn sich dessen `<version>` gegenüber einem vorherigen Durchlauf unterscheidet. Wenn keine Skills geeignet sind, wird der Abschnitt „Skills“ ausgelassen.

Native Codex-Durchläufe erhalten diese Liste als durchlaufsbezogene Entwickleranweisungen zur Zusammenarbeit statt als Benutzereingabe pro Durchlauf, ausgenommen schlanke Cron-Durchläufe, die den exakten geplanten Prompt beibehalten. Andere Harnesses behalten den normalen Prompt-Abschnitt bei.

Der Speicherort kann auf einen verschachtelten Skill verweisen, beispielsweise `skills/personal/foo/SKILL.md`. Die Verschachtelung dient nur der Organisation; der Prompt verwendet den flachen Skill-Namen aus dem `SKILL.md`-Frontmatter.

Die Eignung umfasst Metadaten-Gates für Skills, Prüfungen der Laufzeitumgebung und -konfiguration sowie die effektive Skill-Zulassungsliste des Agenten, wenn `agents.defaults.skills` oder `agents.entries.*.skills` konfiguriert ist. In Plugins gebündelte Skills sind nur geeignet, wenn das zugehörige Plugin aktiviert ist. Dadurch können Tool-Plugins ausführlichere Betriebsanleitungen bereitstellen, ohne all diese Anweisungen in jede Tool-Beschreibung einzubetten.

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

Dadurch bleibt der Basis-Prompt klein, während die gezielte Verwendung von Skills weiterhin möglich ist. Die Größenbegrenzung liegt in der Verantwortung des Skills-Subsystems und ist von der generischen Größenbegrenzung für das Lesen und Einfügen zur Laufzeit getrennt:

| Geltungsbereich | Budget für den Skills-Prompt                          | Budget für Laufzeitauszüge          |
| --------- | ---------------------------------------------------- | ---------------------------------- |
| Global    | `skills.limits.maxSkillsPromptChars`                 | `agents.defaults.contextLimits.*`  |
| Pro Agent | `agents.entries.*.skillsLimits.maxSkillsPromptChars` | `agents.entries.*.contextLimits.*` |

Das Budget für Laufzeitauszüge deckt `memory_get`, Live-Tool-Ergebnisse und Aktualisierungen von `AGENTS.md` nach der Compaction ab.

## Dokumentation

Der Abschnitt **Dokumentation** verweist auf lokale Dokumentation, sofern verfügbar (`docs/` in einem Git-Checkout oder die gebündelte Dokumentation des npm-Pakets), und greift andernfalls auf [https://docs.openclaw.ai](https://docs.openclaw.ai) zurück. Er führt außerdem den Speicherort des OpenClaw-Quellcodes auf: Git-Checkouts stellen das lokale Quellstammverzeichnis bereit, während Paketinstallationen die GitHub-Quell-URL mit der Anweisung erhalten, den Quellcode dort zu prüfen, wenn die Dokumentation unvollständig oder veraltet ist.

Der Prompt stellt die Dokumentation als maßgebliche Quelle für OpenClaw-Selbstwissen dar, bevor das Modell versteht, wie OpenClaw funktioniert (Speicher/Tagesnotizen, Sitzungen, Tools, Gateway, Konfiguration, Befehle, Projektkontext), und weist das Modell an, `AGENTS.md`, den Projektkontext, Arbeitsbereichs-/Profil-/Speichernotizen und `memory_search` als Anweisungskontext oder Benutzerspeicher zu behandeln und nicht als Wissen über das Design oder die Implementierung von OpenClaw. Wenn die Dokumentation keine Angaben enthält oder veraltet ist, sollte das Modell dies angeben und den Quellcode prüfen. Der Prompt weist das Modell außerdem an, `openclaw status` nach Möglichkeit selbst auszuführen und den Benutzer nur zu fragen, wenn es keinen Zugriff hat.

Speziell für die Konfiguration verweist er Agenten zunächst auf die Tool-Aktion `config.schema.lookup` des Tools `gateway`, um genaue Dokumentation und Einschränkungen auf Feldebene zu erhalten, und anschließend auf `docs/gateway/configuration.md` und `docs/gateway/configuration-reference.md` für umfassendere Anleitungen.

## Verwandte Themen

- [Agent-Laufzeit](/de/concepts/agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Kontext-Engine](/de/concepts/context-engine)
