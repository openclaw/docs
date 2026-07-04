---
read_when:
    - Sie benötigen den Supportvertrag für die Codex-Harness-Laufzeitumgebung
    - Sie debuggen native Codex-Tools, Hooks, Compaction oder den Feedback-Upload
    - Sie ändern das Plugin-Verhalten über OpenClaw- und Codex-Harness-Durchläufe hinweg
summary: Laufzeitgrenzen, Hooks, Tools, Berechtigungen und Diagnose für das Codex-Harness
title: Codex-Harness-Laufzeit
x-i18n:
    generated_at: "2026-07-04T20:29:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Diese Seite dokumentiert den Runtime-Vertrag für Codex-Harness-Durchläufe. Für Einrichtung und
Routing beginnen Sie mit [Codex-Harness](/de/plugins/codex-harness). Für Konfigurationsfelder
siehe [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Überblick

Der Codex-Modus ist nicht einfach OpenClaw mit einem anderen Modellaufruf darunter. Codex übernimmt mehr vom
nativen Modell-Loop, und OpenClaw passt seine Plugin-, Tool-, Sitzungs- und
Diagnoseoberflächen an diese Grenze an.

OpenClaw besitzt weiterhin Channel-Routing, Sitzungsdateien, sichtbare Nachrichtenzustellung,
dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und einen Transkriptspiegel.
Codex besitzt den kanonischen nativen Thread, den nativen Modell-Loop, die native Tool-
Fortsetzung und die native Compaction.

Das Prompt-Routing folgt der ausgewählten Runtime, nicht nur dem Provider-String. Ein
nativer Codex-Durchlauf erhält Codex-app-server-Entwickleranweisungen, während eine
explizite OpenClaw-Kompatibilitätsroute den normalen OpenClaw-Systemprompt beibehält, selbst
wenn sie Codex-artige OpenAI-Authentifizierung oder entsprechenden Transport verwendet.

Native Codex behält Codex-eigene Basis-/Modellanweisungen und Projekt-Dokumentverhalten
gemäß der aktiven Codex-Thread-Konfiguration bei. OpenClaw startet native
Codex-Threads und setzt sie fort, wobei die integrierte Persönlichkeit von Codex deaktiviert ist, damit Workspace-
Persönlichkeitsdateien und die OpenClaw-Agentenidentität maßgeblich bleiben. Schlanke
OpenClaw-Läufe behalten weiterhin ihre bestehende Unterdrückung von Projekt-Dokumenten bei. OpenClaw-
Entwickleranweisungen decken OpenClaw-Runtime-Aspekte wie Zustellung über den Quell-Channel,
dynamische OpenClaw-Tools, ACP-Delegation, Adapterkontext und die
aktiven Workspace-Profildateien des Agenten ab. OpenClaw-Skill-Kataloge und tool-geroutete
`MEMORY.md`-Verweise werden als durchlaufbezogene Entwickleranweisungen für Zusammenarbeit
für native Codex projiziert. Aktive `BOOTSTRAP.md`-Inhalte und vollständige
`MEMORY.md`-Fallback-Injektion verwenden weiterhin Referenzkontext der Durchlaufeingabe.

## Thread-Bindungen und Modelländerungen

Wenn eine OpenClaw-Sitzung an einen bestehenden Codex-Thread angehängt ist, sendet der nächste Durchlauf
das aktuell ausgewählte OpenAI-Modell, die Genehmigungsrichtlinie, die Sandbox und den Service-
Tier erneut an app-server. Ein Wechsel von `openai/gpt-5.5` zu
`openai/gpt-5.2` behält die Thread-Bindung bei, bittet Codex aber, mit dem
neu ausgewählten Modell fortzufahren.

## Sichtbare Antworten und Heartbeats

Wenn ein direkter/Quell-Chat-Durchlauf über den Codex-Harness läuft, verwenden sichtbare Antworten
standardmäßig die automatische Zustellung der finalen Assistant-Antwort für interne WebChat-Oberflächen.
Damit bleibt Codex am Prompt-Vertrag des Pi-Harness ausgerichtet: Agenten antworten
normal, und OpenClaw postet den finalen Text in die Quellkonversation. Setzen Sie
`messages.visibleReplies: "message_tool"`, wenn ein direkter/Quell-Chat
den finalen Assistant-Text absichtlich privat halten soll, sofern der Agent nicht
`message(action="send")` aufruft.

Codex-Heartbeat-Durchläufe erhalten standardmäßig auch `heartbeat_respond` im durchsuchbaren OpenClaw-
Tool-Katalog, sodass der Agent erfassen kann, ob das Aufwachen still bleiben
oder benachrichtigen soll, ohne diesen Kontrollfluss im finalen Text zu kodieren.

Heartbeat-spezifische Initiative-Anleitung wird als Codex-Entwickleranweisung im Zusammenarbeitsmodus
im Heartbeat-Durchlauf selbst gesendet. Gewöhnliche Chat-Durchläufe stellen
stattdessen den Codex-Default-Modus wieder her, anstatt Heartbeat-Philosophie in ihrem normalen
Runtime-Prompt mitzuführen. Wenn eine nicht leere `HEARTBEAT.md` existiert, verweisen die Heartbeat-
Anweisungen im Zusammenarbeitsmodus Codex auf die Datei, anstatt deren
Inhalt inline einzufügen.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Besitzer                 | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über OpenClaw- und Codex-Harnesses hinweg. |
| Codex-app-server-Erweiterungsmiddleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Durchlauf rund um dynamische OpenClaw-Tools.  |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`.

Wenn Codex-app-server-Genehmigungen aktiviert sind, also `approvalPolicy` nicht
`"never"` ist, lässt die standardmäßig injizierte native Hook-Konfiguration `PermissionRequest` aus, damit
der app-server-Reviewer von Codex und die Genehmigungsbrücke von OpenClaw echte
Eskalationen nach der Prüfung behandeln. Betreiber können `permission_request` explizit zu
`nativeHookRelay.events` hinzufügen, wenn sie den Kompatibilitäts-Relay benötigen.

Andere Codex-Hooks wie `SessionStart` und `UserPromptSubmit` bleiben
Codex-Level-Steuerelemente. Sie werden im v1-Vertrag nicht als OpenClaw-Plugin-Hooks
bereitgestellt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex nach dem
Aufruf gefragt hat, sodass OpenClaw das Plugin- und Middleware-Verhalten auslöst, das es im
Harness-Adapter besitzt. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber es kann den nativen Codex-
Thread nicht umschreiben, sofern Codex diese Operation nicht über app-server oder native Hook-
Callbacks bereitstellt.

Codex-app-server-`PreToolUse`-Ereignisse im Report-Modus verschieben Plugin-Genehmigungsanforderungen
auf die passende app-server-Genehmigung. Wenn ein OpenClaw-`before_tool_call`-Hook
`requireApproval` zurückgibt, während die native Nutzlast den Report-Genehmigungsmodus setzt
(`openclaw_approval_mode` ist `"report"`), zeichnet der native Hook-Relay die
Plugin-Genehmigungsanforderung auf und gibt keine native Entscheidung zurück. Wenn Codex die
app-server-Genehmigungsanforderung für dieselbe Tool-Nutzung sendet, öffnet OpenClaw den Plugin-
Genehmigungsprompt und ordnet die Entscheidung zurück zu Codex zu. Codex-`PermissionRequest`-
Ereignisse sind ein separater Genehmigungspfad und können weiterhin über OpenClaw-
Genehmigungen geroutet werden, wenn die Runtime für diese Brücke konfiguriert ist.

Codex-app-server-Item-Benachrichtigungen liefern außerdem asynchrone `after_tool_call`-
Beobachtungen für native Tool-Abschlüsse, die nicht bereits durch den
nativen `PostToolUse`-Relay abgedeckt sind. Diese Beobachtungen dienen nur Telemetrie und Plugin-
Kompatibilität; sie können den nativen Tool-Aufruf nicht blockieren, verzögern oder mutieren.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Codex-app-server-
Benachrichtigungen und dem OpenClaw-Adapterstatus, nicht aus nativen Codex-Hook-Befehlen.
Die OpenClaw-Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen
der internen Anfrage- oder Compaction-Nutzlasten von Codex.

Native Codex-`hook/started`- und `hook/completed`-app-server-Benachrichtigungen werden
als `codex_app_server.hook`-Agentenereignisse für Trajektorie und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Support-Vertrag

Unterstützt in Codex-Runtime v1:

| Oberfläche                                   | Unterstützung                                                                    | Warum                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex             | Unterstützt                                                                      | Der Codex-App-Server besitzt den OpenAI-Turn, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw-Kanalrouting und -Zustellung        | Unterstützt                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-Runtime.                                                                                                                                                                                                                                                                                                                                                                                  |
| Dynamische OpenClaw-Tools                    | Unterstützt                                                                      | Codex fordert OpenClaw auf, diese Tools auszuführen, daher bleibt OpenClaw im Ausführungspfad.                                                                                                                                                                                                                                                                                                                                                                                        |
| Prompt- und Kontext-Plugins                  | Unterstützt                                                                      | OpenClaw projiziert OpenClaw-spezifische Prompts/Kontexte in den Codex-Turn, während von Codex besessene Basis-, Modell- und konfigurierte Projektdokument-Prompts in der nativen Codex-Spur verbleiben. OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für native Threads, damit Persönlichkeitsdateien im Agent-Arbeitsbereich maßgeblich bleiben. Native Codex-Entwickleranweisungen akzeptieren nur Befehlsführung, die ausdrücklich auf `codex_app_server` beschränkt ist; veraltete globale Befehlshinweise bleiben für Nicht-Codex-Prompt-Oberflächen erhalten. |
| Lebenszyklus der Kontext-Engine              | Unterstützt                                                                      | Zusammenstellen, Aufnehmen und Wartung nach dem Turn laufen um Codex-Turns herum. Kontext-Engines ersetzen nicht die native Codex-Compaction.                                                                                                                                                                                                                                                                                                                                         |
| Dynamische Tool-Hooks                        | Unterstützt                                                                      | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen um dynamische Tools, die OpenClaw gehören.                                                                                                                                                                                                                                                                                                                                                                   |
| Lebenszyklus-Hooks                           | Als Adapterbeobachtungen unterstützt                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                                                                                                                                                                                                                                                                                                                |
| Gate für Überarbeitung der finalen Antwort   | Über native Hook-Weiterleitung unterstützt                                       | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                                                                                                                                                                                                                                                                                                       |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über native Hook-Weiterleitung unterstützt                          | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; das Umschreiben von Argumenten nicht.                                                                                                                                                                                                                                           |
| Native Berechtigungsrichtlinie               | Über Codex-App-Server-Genehmigungen und kompatible native Hook-Weiterleitung unterstützt | Genehmigungsanfragen des Codex-App-Servers werden nach der Codex-Prüfung durch OpenClaw geroutet. Die native Hook-Weiterleitung `PermissionRequest` ist für native Genehmigungsmodi optional, weil Codex sie vor der Guardian-Prüfung ausgibt.                                                                                                                                                                                                                                       |
| App-Server-Trajektorienerfassung             | Unterstützt                                                                      | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                                                                                                                                                                                                                                                                                                                    |

Nicht unterstützt in Codex-Runtime v1:

| Oberfläche                                             | V1-Grenze                                                                                                                                      | Zukünftiger Pfad                                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                        | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                   | Erfordert Codex-Hook-/Schemaunterstützung für ersetzende Tool-Eingaben.                  |
| Bearbeitbarer Codex-nativer Transkriptverlauf          | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber nicht nicht unterstützte Interna mutieren. | Fügen Sie explizite Codex-App-Server-APIs hinzu, falls native Thread-Operationen nötig sind. |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert Transkriptschreibvorgänge, die OpenClaw gehören, nicht Codex-native Tool-Datensätze.                                | Könnte transformierte Datensätze spiegeln, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten               | OpenClaw kann native Compaction anfordern, erhält aber keine stabile Beibehalten-/Verworfen-Liste, Token-Differenz, Abschlusszusammenfassung oder Zusammenfassungs-Payload. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                      |
| Compaction-Intervention                                | OpenClaw erlaubt Plugins oder Kontext-Engines nicht, native Codex-Compaction zu verhindern, umzuschreiben oder zu ersetzen.                    | Fügen Sie Codex-Pre-/Post-Compaction-Hooks hinzu, wenn Plugins native Compaction verhindern oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen           | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber Codex-Core erstellt die finale OpenAI-API-Anfrage intern.              | Benötigt ein Codex-Modellanfrage-Tracing-Ereignis oder eine Debug-API.                    |

## Native Berechtigungen und MCP-Elicitations

Für `PermissionRequest` gibt OpenClaw nur explizite Zulassen- oder Ablehnen-Entscheidungen zurück,
wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist keine Zulassung. Codex behandelt es als keine
Hook-Entscheidung und fällt auf den eigenen Guardian- oder Benutzer-Genehmigungspfad zurück.

Codex-App-Server-Genehmigungsmodi lassen diesen nativen Hook standardmäßig aus. Dieses Verhalten
gilt, wenn `permission_request` ausdrücklich in
`nativeHookRelay.events` enthalten ist oder eine Kompatibilitäts-Runtime ihn installiert.

Wenn ein Operator für eine native Codex-Berechtigungsanfrage `allow-always` auswählt,
merkt sich OpenClaw diesen exakten Provider-/Sitzungs-/Tool-Eingabe-/cwd-Fingerabdruck für ein
begrenztes Sitzungsfenster. Die gemerkte Entscheidung ist absichtlich nur eine exakte Übereinstimmung:
Ein geänderter Befehl, geänderte Argumente, ein geänderter Tool-Payload oder ein geändertes cwd erzeugt eine neue
Genehmigung.

Genehmigungs-Elicitations für Codex-MCP-Tools werden durch den Plugin-
Genehmigungsablauf von OpenClaw geroutet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden zurück an den
ursprünglichen Chat gesendet, und die nächste eingereihte Folgenachricht beantwortet diese native
Serveranfrage, anstatt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Elicitation-
Anfragen schlagen geschlossen fehl.

Den allgemeinen Plugin-Genehmigungsablauf, der diese Prompts transportiert, finden Sie unter
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests).

## Queue-Steering

Active-Run-Queue-Steering wird auf `turn/steer` des Codex-App-Servers abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw Chatnachrichten im Steer-Modus
für das konfigurierte Ruhefenster und sendet sie in Ankunftsreihenfolge als eine `turn/steer`-
Anfrage.

Codex-Reviews und manuelle Compaction-Turns können Steering im selben Turn ablehnen. In diesem Fall wartet OpenClaw, bis der aktive Lauf beendet ist, bevor der Prompt gestartet wird. Verwenden Sie `/queue followup` oder `/queue collect`, wenn Nachrichten standardmäßig in die Warteschlange gestellt werden sollen, statt Steering zu verwenden. Siehe [Steering-Warteschlange](/de/concepts/queue-steering).

## Codex-Feedback-Upload

Wenn `/diagnostics [note]` für eine Sitzung genehmigt wird, die den nativen Codex-Harness verwendet, ruft OpenClaw außerdem `feedback/upload` des Codex-App-Servers für relevante Codex-Threads auf. Der Upload fordert den App-Server auf, Logs für jeden aufgeführten Thread und, sofern verfügbar, für gestartete Codex-Subthreads einzuschließen.

Der Upload läuft über den normalen Feedback-Pfad von Codex zu OpenAI-Servern. Wenn Codex-Feedback in diesem App-Server deaktiviert ist, gibt der Befehl den App-Server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-Befehle für die gesendeten Threads auf.

Wenn Sie die Genehmigung ablehnen oder ignorieren, gibt OpenClaw diese Codex-IDs nicht aus und sendet kein Codex-Feedback. Der Upload ersetzt nicht den lokalen Gateway-Diagnoseexport. Informationen zu Genehmigung, Datenschutz, lokalem Bundle und Gruppenchat-Verhalten finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich den Codex-Feedback-Upload für den aktuell angehängten Thread ohne das vollständige Gateway-Diagnosebundle wünschen.

## Compaction und Transcript-Spiegel

Wenn das ausgewählte Modell den Codex-Harness verwendet, gehört native Thread-Compaction zum Codex-App-Server. OpenClaw führt keine Preflight-Compaction für Codex-Turns aus, ersetzt Codex-Compaction nicht durch Context-Engine-Compaction und fällt nicht auf OpenClaw- oder öffentliche OpenAI-Zusammenfassung zurück, wenn native Codex-Compaction nicht gestartet werden kann. OpenClaw hält einen Transcript-Spiegel für Kanalverlauf, Suche, `/new`, `/reset` sowie zukünftige Modell- oder Harness-Wechsel vor.

Explizite Compaction-Anfragen wie `/compact` oder eine von einem Plugin angeforderte manuelle Compact-Operation starten native Codex-Compaction mit `thread/compact/start`. OpenClaw hält die Anfrage und die Shared-Client-Lease offen, bis Codex das passende Abschluss-Item `contextCompaction` ausgibt, und meldet den Compaction-Turn anschließend als abgeschlossen. Wenn dieser Terminal-Turn das konfigurierte Compaction-Timeout überschreitet, fordert OpenClaw eine native Turn-Unterbrechung an. Die Lease und die threadbezogene Compaction-Fence bleiben gehalten, bis Codex den terminalen Zustand meldet oder den Interrupt-RPC bestätigt. Wenn Codex innerhalb der Interrupt-Nachfrist nicht bestätigt, setzt OpenClaw die Verbindung außer Betrieb, bevor die Fence freigegeben wird. Remote-Verbindungen lösen außerdem das passende Thread-Binding, damit spätere Arbeit nicht mit einem unbestätigten Remote-Turn überlappt. Andere Turns auf einer außer Betrieb gesetzten Verbindung schlagen fehl und können auf einem frischen Client erneut versucht werden. Client-Schließung, Anfrageabbruch oder ein fehlgeschlagener Compaction-Turn geben eine fehlgeschlagene Operation zurück.

Wenn eine Context Engine eine Codex-Thread-Bootstrap-Projektion anfordert, projiziert OpenClaw Tool-Call-Namen und -IDs, Eingabeformen und redigierte Tool-Ergebnisinhalte in den frischen Codex-Thread. Rohwerte von Tool-Call-Argumenten werden nicht in diese Projektion kopiert.

Der Spiegel enthält den Benutzer-Prompt, den finalen Assistant-Text sowie schlanke Codex-Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. OpenClaw zeichnet den nativen Compaction-Start und den terminalen Status auf, stellt jedoch keine menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste der Einträge bereit, die Codex nach der Compaction beibehalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine Codex-nativen Tool-Ergebnisdatensätze um. Es gilt nur, wenn OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungs-Transcript schreibt.

## Medien und Zustellung

OpenClaw bleibt weiterhin für Medienzustellung und Auswahl des Medien-Providers zuständig. Bild, Video, Musik, PDF, TTS und Medienverständnis verwenden passende Provider-/Modelleinstellungen wie `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und `messages.tts`.

Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools laufen weiterhin über den normalen OpenClaw-Zustellungspfad. Mediengenerierung erfordert nicht die Legacy-Runtime. Wenn Codex ein natives Bildgenerierungs-Item mit einem `savedPath` ausgibt, leitet OpenClaw genau diese Datei über den normalen Antwort-Medienpfad weiter, selbst wenn der Codex-Turn keinen Assistant-Text enthält.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Plugin-Hooks](/de/plugins/hooks)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Trajektorienexport](/de/tools/trajectory)
