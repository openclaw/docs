---
read_when:
    - Sie benötigen den Vertrag zur Laufzeitunterstützung des Codex-Harness
    - Sie debuggen native Codex-Tools, Hooks, Compaction oder Feedback-Upload
    - Sie ändern Plugin-Verhalten über OpenClaw- und Codex-Harness-Turns hinweg
summary: Runtime-Grenzen, Hooks, Tools, Berechtigungen und Diagnosen für das Codex-Harness
title: Codex-Harness-Laufzeit
x-i18n:
    generated_at: "2026-06-27T17:46:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Diese Seite dokumentiert den Runtime-Vertrag für Codex-Harness-Durchläufe. Für Einrichtung und
Routing beginnen Sie mit [Codex-Harness](/de/plugins/codex-harness). Informationen zu Konfigurationsfeldern
finden Sie in der [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Übersicht

Der Codex-Modus ist nicht OpenClaw mit einem anderen Modellaufruf darunter. Codex übernimmt mehr von
der nativen Modellschleife, und OpenClaw passt seine Plugin-, Tool-, Sitzungs- und
Diagnoseoberflächen an diese Grenze an.

OpenClaw bleibt zuständig für Kanal-Routing, Sitzungsdateien, sichtbare Nachrichtenzustellung,
dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und eine Transkriptspiegelung.
Codex besitzt den kanonischen nativen Thread, die native Modellschleife, die native Tool-
Fortsetzung und native Compaction.

Das Prompt-Routing folgt der ausgewählten Runtime, nicht nur dem Provider-String. Ein
nativer Codex-Durchlauf erhält Codex-App-Server-Developer-Anweisungen, während eine
explizite OpenClaw-Kompatibilitätsroute den normalen OpenClaw-System-Prompt beibehält, auch
wenn sie Codex-artige OpenAI-Authentifizierung oder -Transport nutzt.

Natives Codex behält Codex-eigene Basis-/Modellanweisungen und Projekt-Dokument-Verhalten
gemäß der aktiven Codex-Thread-Konfiguration bei. OpenClaw startet native Codex-Threads
und nimmt sie wieder auf, wobei die integrierte Persönlichkeit von Codex deaktiviert ist,
damit Workspace-Persönlichkeitsdateien und die OpenClaw-Agentenidentität maßgeblich bleiben.
Leichtgewichtige OpenClaw-Läufe behalten weiterhin ihre bestehende Unterdrückung von Projekt-Dokumenten bei.
OpenClaw-Developer-Anweisungen decken OpenClaw-Runtime-Belange ab, etwa Zustellung über
Quellkanäle, dynamische OpenClaw-Tools, ACP-Delegation, Adapterkontext und die
aktiven Workspace-Profildateien des Agenten. OpenClaw-Skill-Kataloge und über Tools geroutete
`MEMORY.md`-Zeiger werden für natives Codex als durchlaufspezifische Developer-Anweisungen
für die Zusammenarbeit projiziert. Aktive `BOOTSTRAP.md`-Inhalte und vollständige
`MEMORY.md`-Fallback-Injektion verwenden weiterhin Eingabereferenzkontext des Durchlaufs.

## Thread-Bindungen und Modelländerungen

Wenn eine OpenClaw-Sitzung an einen bestehenden Codex-Thread angehängt ist, sendet der nächste Durchlauf
das aktuell ausgewählte OpenAI-Modell, die Genehmigungsrichtlinie, Sandbox und Service-Stufe
erneut an den App-Server. Ein Wechsel von `openai/gpt-5.5` zu
`openai/gpt-5.2` behält die Thread-Bindung bei, weist Codex aber an, mit dem
neu ausgewählten Modell fortzufahren.

## Sichtbare Antworten und Heartbeats

Wenn ein direkter Quell-Chat-Durchlauf über das Codex-Harness läuft, verwenden sichtbare Antworten
standardmäßig die automatische Zustellung der finalen Assistant-Antwort für interne WebChat-Oberflächen.
Dadurch bleibt Codex am Prompt-Vertrag des Pi-Harness ausgerichtet: Agenten antworten
normal, und OpenClaw veröffentlicht den finalen Text in der Quellkonversation. Setzen Sie
`messages.visibleReplies: "message_tool"`, wenn ein direkter Quell-Chat den finalen
Assistant-Text absichtlich privat halten soll, sofern der Agent nicht
`message(action="send")` aufruft.

Codex-Heartbeat-Durchläufe erhalten standardmäßig auch `heartbeat_respond` im durchsuchbaren
OpenClaw-Tool-Katalog, damit der Agent aufzeichnen kann, ob das Aufwachen still bleiben
oder benachrichtigen soll, ohne diesen Kontrollfluss im finalen Text zu codieren.

Heartbeat-spezifische Initiative-Anleitung wird im Heartbeat-Durchlauf selbst als Codex-Developer-Anweisung
im Kollaborationsmodus gesendet. Gewöhnliche Chat-Durchläufe stellen den Codex-Default-Modus wieder her,
anstatt Heartbeat-Philosophie in ihrem normalen Runtime-Prompt mitzuführen. Wenn eine nicht leere
`HEARTBEAT.md` vorhanden ist, verweisen die Heartbeat-Anweisungen im Kollaborationsmodus
Codex auf die Datei, statt deren Inhalt inline einzufügen.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Schichten:

| Schicht                               | Eigentümer               | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität zwischen OpenClaw- und Codex-Harnesses. |
| Codex-App-Server-Erweiterungs-Middleware | OpenClaw-gebündelte Plugins | Adapterverhalten pro Durchlauf rund um dynamische OpenClaw-Tools.   |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine Projekt- oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`.

Wenn Codex-App-Server-Genehmigungen aktiviert sind, also `approvalPolicy` nicht
`"never"` ist, lässt die standardmäßig injizierte native Hook-Konfiguration `PermissionRequest` aus,
damit der App-Server-Reviewer von Codex und die Genehmigungsbrücke von OpenClaw echte
Eskalationen nach der Prüfung behandeln. Operatoren können `permission_request` explizit zu
`nativeHookRelay.events` hinzufügen, wenn sie die Kompatibilitätsweiterleitung benötigen.

Andere Codex-Hooks wie `SessionStart` und `UserPromptSubmit` bleiben
Steuerungen auf Codex-Ebene. Sie werden im v1-Vertrag nicht als OpenClaw-Plugin-Hooks
offengelegt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat; daher löst OpenClaw das Plugin- und Middleware-Verhalten aus, das es im
Harness-Adapter besitzt. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-Thread nicht umschreiben,
sofern Codex diese Operation nicht über App-Server- oder native Hook-Callbacks freigibt.

Codex-App-Server-`PreToolUse`-Ereignisse im Report-Modus verschieben Plugin-Genehmigungsanfragen
auf die passende App-Server-Genehmigung. Wenn ein OpenClaw-`before_tool_call`-Hook
`requireApproval` zurückgibt, während die native Nutzlast den Report-Genehmigungsmodus setzt
(`openclaw_approval_mode` ist `"report"`), zeichnet die native Hook-Weiterleitung die
Plugin-Genehmigungsanforderung auf und gibt keine native Entscheidung zurück. Wenn Codex die
App-Server-Genehmigungsanfrage für dieselbe Tool-Nutzung sendet, öffnet OpenClaw den
Plugin-Genehmigungs-Prompt und ordnet die Entscheidung zurück zu Codex zu. Codex-`PermissionRequest`-
Ereignisse sind ein separater Genehmigungspfad und können weiterhin über OpenClaw-
Genehmigungen geroutet werden, wenn die Runtime für diese Brücke konfiguriert ist.

Codex-App-Server-Elementbenachrichtigungen stellen außerdem asynchrone `after_tool_call`-
Beobachtungen für native Tool-Abschlüsse bereit, die nicht bereits durch die
native `PostToolUse`-Weiterleitung abgedeckt sind. Diese Beobachtungen dienen nur Telemetrie
und Plugin-Kompatibilität; sie können den nativen Tool-Aufruf nicht blockieren, verzögern
oder verändern.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Codex-App-Server-
Benachrichtigungen und OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen.
OpenClaws `before_compaction`-, `after_compaction`-, `llm_input`- und
`llm_output`-Ereignisse sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen
der internen Anfrage- oder Compaction-Nutzlasten von Codex.

Codex-native App-Server-Benachrichtigungen `hook/started` und `hook/completed` werden
als `codex_app_server.hook`-Agentenereignisse für Trajektorie und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Support-Vertrag

Unterstützt in Codex-Runtime v1:

| Bereich                                       | Unterstützung                                                                          | Warum                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex               | Unterstützt                                                                        | Der Codex-App-Server besitzt den OpenAI-Turn, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw-Kanal-Routing und -Zustellung         | Unterstützt                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modelllaufzeit.                                                                                                                                                                                                                                                                                                                                                                                    |
| Dynamische OpenClaw-Tools                        | Unterstützt                                                                        | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                                                                                                                                                                                                                                                                                                                |
| Prompt- und Kontext-Plugins                    | Unterstützt                                                                        | OpenClaw projiziert OpenClaw-spezifische Prompts und Kontext in den Codex-Turn, während die von Codex verwalteten Basis-, Modell- und konfigurierten Projektdokument-Prompts in der nativen Codex-Spur bleiben. OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für native Threads, damit Persönlichkeitsdateien des Agent-Arbeitsbereichs maßgeblich bleiben. Native Codex-Entwickleranweisungen akzeptieren nur Befehlsanleitung, die ausdrücklich auf `codex_app_server` beschränkt ist; ältere globale Befehlshinweise bleiben für Nicht-Codex-Prompt-Oberflächen erhalten. |
| Lebenszyklus der Kontext-Engine                      | Unterstützt                                                                        | Zusammenstellung, Aufnahme und Wartung nach dem Turn laufen rund um Codex-Turns. Kontext-Engines ersetzen nicht die native Codex-Compaction.                                                                                                                                                                                                                                                                                                                                                        |
| Dynamische Tool-Hooks                            | Unterstützt                                                                        | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen rund um dynamische Tools, die OpenClaw gehören.                                                                                                                                                                                                                                                                                                                                                                          |
| Lebenszyklus-Hooks                               | Als Adapterbeobachtungen unterstützt                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                                                                                                                                                                                                                                                                                                                           |
| Überarbeitungs-Gate für finale Antworten                    | Über natives Hook-Relay unterstützt                                              | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                                                                                                                                                                                                                                                                                                                                |
| Native Shell-, Patch- und MCP-Sperre oder -Beobachtung | Über natives Hook-Relay unterstützt                                              | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; Umschreiben von Argumenten nicht.                                                                                                                                                                                                                                                                               |
| Native Berechtigungsrichtlinie                      | Über Codex-App-Server-Genehmigungen und natives Kompatibilitäts-Hook-Relay unterstützt | Genehmigungsanfragen des Codex-App-Servers laufen nach der Codex-Prüfung über OpenClaw. Das native Hook-Relay `PermissionRequest` ist für native Genehmigungsmodi optional, weil Codex es vor der Guardian-Prüfung ausgibt.                                                                                                                                                                                                                                                                          |
| App-Server-Trajektorienerfassung                 | Unterstützt                                                                        | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                                                                                                                                                                                                                                                                                                                                                    |

Nicht unterstützt in Codex-Laufzeit v1:

| Bereich                                             | V1-Grenze                                                                                                                                     | Zukünftiger Weg                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                       | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                               | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzende Tool-Eingaben.                            |
| Bearbeitbarer Codex-nativer Transkriptverlauf            | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber nicht unterstützte Interna nicht mutieren. | Explizite Codex-App-Server-APIs hinzufügen, falls native Thread-Eingriffe erforderlich sind.                    |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert Transkriptschreibvorgänge, die OpenClaw gehören, nicht Codex-native Tool-Datensätze.                                                           | Transformierte Datensätze könnten gespiegelt werden, aber kanonisches Umschreiben benötigt Codex-Unterstützung.              |
| Umfangreiche native Compaction-Metadaten                     | OpenClaw kann native Compaction anfordern, erhält aber keine stabile Liste beibehaltener/verworfener Inhalte, kein Token-Delta, keine Abschlusszusammenfassung und keinen Zusammenfassungs-Payload.   | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                                     |
| Compaction-Intervention                             | OpenClaw lässt Plugins oder Kontext-Engines native Codex-Compaction nicht per Veto ablehnen, umschreiben oder ersetzen.                                             | Codex-Pre-/Post-Compaction-Hooks hinzufügen, falls Plugins native Compaction per Veto ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen             | OpenClaw kann App-Server-Anfragen und -Benachrichtigungen erfassen, aber Codex Core erstellt die endgültige OpenAI-API-Anfrage intern.                      | Benötigt ein Codex-Ereignis zur Modellanfragen-Ablaufverfolgung oder eine Debug-API.                                   |

## Native Berechtigungen und MCP-Abfragen

Für `PermissionRequest` gibt OpenClaw nur ausdrückliche Zulassen- oder Ablehnen-Entscheidungen zurück,
wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist kein Zulassen. Codex behandelt es als keine
Hook-Entscheidung und fällt auf seinen eigenen Guardian- oder Benutzergenehmigungspfad zurück.

Genehmigungsmodi des Codex-App-Servers lassen diesen nativen Hook standardmäßig aus. Dieses Verhalten
gilt, wenn `permission_request` ausdrücklich in
`nativeHookRelay.events` enthalten ist oder eine Kompatibilitätslaufzeit ihn installiert.

Wenn ein Operator für eine native Codex-Berechtigungsanfrage `allow-always` auswählt,
merkt sich OpenClaw genau diesen Provider-/Sitzungs-/Tool-Eingabe-/cwd-Fingerabdruck für ein
begrenztes Sitzungsfenster. Die gemerkte Entscheidung ist absichtlich nur ein exakter Treffer:
Ein geänderter Befehl, geänderte Argumente, ein geänderter Tool-Payload oder ein geändertes cwd erzeugt eine neue
Genehmigung.

Codex-MCP-Tool-Genehmigungsabfragen werden durch den Plugin-Genehmigungsfluss von OpenClaw geleitet,
wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Eingabeaufforderungen werden an den
ursprünglichen Chat zurückgesendet, und die nächste eingereihte Folgenachricht beantwortet diese native
Serveranfrage, anstatt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Abfrageanfragen
werden standardmäßig abgelehnt.

Den allgemeinen Plugin-Genehmigungsfluss, der diese Eingabeaufforderungen transportiert, finden Sie unter
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests).

## Warteschlangensteuerung

Die Steuerung aktiver Ausführungswarteschlangen wird auf `turn/steer` des Codex-App-Servers abgebildet. Mit dem
standardmäßigen `messages.queue.mode: "steer"` bündelt OpenClaw Chatnachrichten im Steuerungsmodus
für das konfigurierte Ruhefenster und sendet sie als eine `turn/steer`-Anfrage
in Eingangsreihenfolge.

Codex-Reviews und manuelle Compaction-Turns können Steering im selben Turn ablehnen. In diesem
Fall wartet OpenClaw, bis der aktive Lauf abgeschlossen ist, bevor der Prompt gestartet wird.
Verwenden Sie `/queue followup` oder `/queue collect`, wenn Nachrichten standardmäßig in die Warteschlange eingereiht
werden sollen, statt Steering zu verwenden. Siehe [Steering-Warteschlange](/de/concepts/queue-steering).

## Codex-Feedback-Upload

Wenn `/diagnostics [note]` für eine Sitzung genehmigt wird, die den nativen Codex-
Harness verwendet, ruft OpenClaw für relevante Codex-Threads auch `feedback/upload` des Codex App-Servers auf.
Der Upload fordert den App-Server auf, Logs für jeden aufgeführten Thread
und für erzeugte Codex-Subthreads einzuschließen, sofern verfügbar.

Der Upload läuft über den normalen Codex-Feedback-Pfad zu OpenAI-Servern. Wenn Codex-
Feedback in diesem App-Server deaktiviert ist, gibt der Befehl den App-Server-
Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle, OpenClaw-Sitzungs-IDs,
Codex-Thread-IDs und lokalen `codex resume <thread-id>`-Befehle für die Threads auf,
die gesendet wurden.

Wenn Sie die Genehmigung ablehnen oder ignorieren, gibt OpenClaw diese Codex-IDs nicht aus und
sendet kein Codex-Feedback. Der Upload ersetzt nicht den lokalen Gateway-
Diagnoseexport. Siehe [Diagnoseexport](/de/gateway/diagnostics) für Informationen zu
Genehmigung, Datenschutz, lokalem Bundle und Verhalten in Gruppenchats.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige Gateway-
Diagnosebundle wünschen.

## Compaction und Transcript-Spiegel

Wenn das ausgewählte Modell den Codex-Harness verwendet, gehört die native Thread-Compaction
zum Codex App-Server. OpenClaw führt für Codex-Turns keine Preflight-Compaction aus,
ersetzt Codex-Compaction nicht durch Kontext-Engine-Compaction und weicht nicht
auf OpenClaw- oder öffentliche OpenAI-Zusammenfassung aus, wenn native Codex-
Compaction nicht gestartet werden kann. OpenClaw hält einen Transcript-Spiegel für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel vor.

Explizite Compaction-Anfragen, wie `/compact` oder eine von einem Plugin angeforderte manuelle
Compact-Operation, starten native Codex-Compaction mit `thread/compact/start`.
OpenClaw kehrt zurück, nachdem diese native Operation gestartet wurde. Es wartet nicht auf
den Abschluss, erzwingt keinen separaten OpenClaw-Timeout, startet den gemeinsam genutzten Codex-
App-Server nicht neu und zeichnet die Operation nicht als von OpenClaw abgeschlossene Compaction auf.

Wenn eine Kontext-Engine eine Codex-Thread-Bootstrap-Projektion anfordert, projiziert OpenClaw
Tool-Aufrufnamen und -IDs, Eingabeformen sowie redigierte Tool-Ergebnisinhalte
in den frischen Codex-Thread. Es kopiert keine Rohwerte von Tool-Aufrufargumenten in
diese Projektion.

Der Spiegel enthält den Benutzer-Prompt, den finalen Assistententext und schlanke Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
explizite native Compaction-Startsignale auf, wenn es Compaction anfordert. Es stellt
keine menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche
Einträge Codex nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine
Codex-nativen Tool-Ergebnisdatensätze um. Es greift nur, wenn OpenClaw ein Tool-Ergebnis
in ein OpenClaw-eigenes Sitzungs-Transcript schreibt.

## Medien und Zustellung

OpenClaw bleibt weiterhin für Medienzustellung und Medien-Provider-Auswahl verantwortlich. Bild,
Video, Musik, PDF, TTS und Medienverständnis verwenden passende Provider-/Modelleinstellungen
wie `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` und `messages.tts`.

Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools laufen weiterhin
über den normalen OpenClaw-Zustellungspfad. Mediengenerierung erfordert nicht die Legacy-Runtime.
Wenn Codex ein natives Bildgenerierungselement mit einem `savedPath` ausgibt, leitet OpenClaw
genau diese Datei über den normalen Antwortmedienpfad weiter, selbst wenn der Codex-
Turn keinen Assistententext enthält.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Plugin-Hooks](/de/plugins/hooks)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Trajektorienexport](/de/tools/trajectory)
