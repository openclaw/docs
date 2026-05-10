---
read_when:
    - Sie benötigen den Laufzeitunterstützungsvertrag für das Codex-Harness
    - Sie debuggen native Codex-Tools, Hooks, Compaction oder den Feedback-Upload
    - Sie ändern das Plugin-Verhalten über PI- und Codex-Harness-Turns hinweg
summary: Laufzeitgrenzen, Hooks, Tools, Berechtigungen und Diagnosefunktionen für den Codex-Harness
title: Codex-Harness-Laufzeit
x-i18n:
    generated_at: "2026-05-10T19:42:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Diese Seite dokumentiert den Laufzeitvertrag für Codex-Harness-Turns. Für Einrichtung und
Routing beginnen Sie mit [Codex-Harness](/de/plugins/codex-harness). Informationen zu Konfigurationsfeldern
finden Sie in der [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Überblick

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex übernimmt mehr von
der nativen Modellschleife, und OpenClaw passt seine Plugin-, Tool-, Sitzungs- und
Diagnoseoberflächen an diese Grenze an.

OpenClaw besitzt weiterhin Kanal-Routing, Sitzungsdateien, sichtbare Nachrichtenzustellung,
dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und eine Transkriptspiegelung.
Codex besitzt den kanonischen nativen Thread, die native Modellschleife, die native Tool-
Fortsetzung und native Compaction.

## Thread-Bindungen und Modellwechsel

Wenn eine OpenClaw-Sitzung an einen bestehenden Codex-Thread angehängt ist, sendet der nächste Turn
das aktuell ausgewählte OpenAI-Modell, die Genehmigungsrichtlinie, die Sandbox und die Service-
Stufe erneut an app-server. Der Wechsel von `openai/gpt-5.5` zu
`openai/gpt-5.2` behält die Thread-Bindung bei, weist Codex aber an, mit dem
neu ausgewählten Modell fortzufahren.

## Sichtbare Antworten und Heartbeats

Wenn ein Quell-Chat-Turn über den Codex-Harness läuft, verwenden sichtbare Antworten standardmäßig
das OpenClaw-Tool `message`, sofern die Bereitstellung `messages.visibleReplies` nicht explizit
konfiguriert hat. Der Agent kann seinen Codex-Turn weiterhin privat beenden; er postet nur dann in
den Kanal, wenn er `message(action="send")` aufruft. Setzen Sie
`messages.visibleReplies: "automatic"`, um finale Direct-Chat-Antworten auf dem
älteren automatischen Zustellpfad zu belassen.

Codex-Heartbeat-Turns erhalten standardmäßig auch `heartbeat_respond` im durchsuchbaren OpenClaw-
Toolkatalog, sodass der Agent aufzeichnen kann, ob das Aufwachen still bleiben oder benachrichtigen
soll, ohne diesen Kontrollfluss im finalen Text zu codieren.

Heartbeat-spezifische Initiativanweisungen werden als Codex-Developer-Anweisung im
Kollaborationsmodus auf dem Heartbeat-Turn selbst gesendet. Normale Chat-Turns stellen stattdessen
den Codex-Standardmodus wieder her, anstatt Heartbeat-Philosophie in ihrem normalen
Laufzeit-Prompt mitzuführen.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Eigentümer               | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex-app-server-Erweiterungsmiddleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.        |
| Native Codex-Hooks                    | Codex                    | Niedrigstufiger Codex-Lebenszyklus und native Tool-Richtlinien aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektbezogenen oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte Brücke für native Tools und Berechtigungen
injiziert OpenClaw Codex-Konfiguration pro Thread für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`.

Wenn Codex-app-server-Genehmigungen aktiviert sind, also `approvalPolicy` nicht
`"never"` ist, lässt die standardmäßig injizierte native Hook-Konfiguration `PermissionRequest` aus,
damit der Codex-app-server-Prüfer und die OpenClaw-Genehmigungsbrücke echte Eskalationen nach der
Prüfung verarbeiten. Betreiber können `permission_request` explizit zu
`nativeHookRelay.events` hinzufügen, wenn sie den Kompatibilitäts-Relay benötigen.

Andere Codex-Hooks wie `SessionStart` und `UserPromptSubmit` bleiben
Codex-seitige Steuerungen. Sie werden im v1-Vertrag nicht als OpenClaw-Plugin-Hooks bereitgestellt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den Aufruf angefordert hat,
sodass OpenClaw das Plugin- und Middleware-Verhalten, das es besitzt, im Harness-Adapter auslöst. Bei
Codex-nativen Tools besitzt Codex den kanonischen Tool-Datensatz. OpenClaw kann ausgewählte
Ereignisse spiegeln, aber es kann den nativen Codex-Thread nicht umschreiben, es sei denn, Codex
stellt diese Operation über app-server oder native Hook-Callbacks bereit.

Compaction- und LLM-Lebenszyklus-Projektionen stammen aus Codex-app-server-Benachrichtigungen und
dem OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen. Die OpenClaw-Ereignisse
`before_compaction`, `after_compaction`, `llm_input` und
`llm_output` sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen der internen
Anfrage- oder Compaction-Nutzlasten von Codex.

Native Codex-app-server-Benachrichtigungen `hook/started` und `hook/completed` werden als
`codex_app_server.hook`-Agent-Ereignisse für Trajektorie und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Unterstützt in Codex-Laufzeit v1:

| Oberfläche                                    | Unterstützung                                                                    | Warum                                                                                                                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                                                                      | Codex-app-server besitzt den OpenAI-Turn, die native Thread-Wiederaufnahme und die native Tool-Fortsetzung.                                                                                                |
| OpenClaw-Kanal-Routing und Zustellung         | Unterstützt                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modelllaufzeit.                                                                                                      |
| Dynamische OpenClaw-Tools                     | Unterstützt                                                                      | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                           |
| Prompt- und Kontext-Plugins                   | Unterstützt                                                                      | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder wiederaufgenommen wird.                                                                       |
| Lebenszyklus der Kontext-Engine               | Unterstützt                                                                      | Zusammenstellung, Ingestion, Wartung nach dem Turn und Koordination der Kontext-Engine-Compaction laufen für Codex-Turns.                                                                                |
| Dynamische Tool-Hooks                         | Unterstützt                                                                      | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen rund um dynamische Tools, die OpenClaw besitzt.                                                                                 |
| Lebenszyklus-Hooks                            | Als Adapterbeobachtungen unterstützt                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Nutzlasten ausgelöst.                                                                |
| Revisions-Gate für finale Antworten           | Über nativen Hook-Relay unterstützt                                              | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                         |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über nativen Hook-Relay unterstützt                              | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Nutzlasten auf Codex-app-server `0.125.0` oder neuer. Blockieren wird unterstützt; Umschreiben von Argumenten nicht. |
| Native Berechtigungsrichtlinie                | Über Codex-app-server-Genehmigungen und Kompatibilitäts-Relay für native Hooks unterstützt | Codex-app-server-Genehmigungsanfragen werden nach Codex-Prüfung durch OpenClaw geroutet. Der native Hook-Relay `PermissionRequest` ist für native Genehmigungsmodi optional, weil Codex ihn vor der Guardian-Prüfung ausgibt. |
| app-server-Trajektorieerfassung               | Unterstützt                                                                      | OpenClaw zeichnet die Anfrage auf, die es an app-server gesendet hat, sowie die app-server-Benachrichtigungen, die es empfängt.                                                                           |

Nicht unterstützt in Codex-Laufzeit v1:

| Oberfläche                                         | V1-Grenze                                                                                                                                      | Zukünftiger Pfad                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                     | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                     | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzende Tool-Eingaben.                  |
| Editierbarer Codex-nativer Transkriptverlauf        | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Explizite Codex-app-server-APIs hinzufügen, wenn native Thread-Chirurgie benötigt wird.    |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert Transkriptschreibvorgänge, die OpenClaw besitzt, nicht Codex-native Tool-Datensätze.                                | Könnte transformierte Datensätze spiegeln, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verworfener Inhalte, kein Token-Delta und keine Zusammenfassungsnutzlast. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                      |
| Compaction-Eingriff                                 | Die aktuellen OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsebene.                                                           | Codex-Pre-/Post-Compaction-Hooks hinzufügen, wenn Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung der Modell-API-Anfrage         | OpenClaw kann app-server-Anfragen und Benachrichtigungen erfassen, aber Codex Core erstellt die finale OpenAI-API-Anfrage intern.               | Benötigt ein Codex-Modellanfrage-Tracing-Ereignis oder eine Debug-API.                    |

## Native Berechtigungen und MCP-Elicitations

Für `PermissionRequest` gibt OpenClaw nur dann explizite Zulassen- oder Ablehnen-Entscheidungen
zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist keine Zulassung. Codex
behandelt es als keine Hook-Entscheidung und fällt auf seinen eigenen Guardian- oder
Benutzergenehmigungspfad zurück.

Codex-app-server-Genehmigungsmodi lassen diesen nativen Hook standardmäßig aus. Dieses Verhalten
gilt, wenn `permission_request` explizit in `nativeHookRelay.events` aufgenommen wird oder eine
Kompatibilitätslaufzeit ihn installiert.

Wenn ein Operator für eine native Codex-Berechtigungsanfrage `allow-always` auswählt,
merkt sich OpenClaw diesen exakten Provider-/Sitzungs-/Tool-Eingabe-/cwd-Fingerabdruck für ein
begrenztes Sitzungsfenster. Die gemerkte Entscheidung ist absichtlich nur ein
exakter Treffer: Ein geänderter Befehl, geänderte Argumente, eine geänderte Tool-Nutzlast oder ein geändertes cwd erzeugt eine neue
Genehmigung.

Genehmigungsaufforderungen für Codex MCP-Tools werden über den Plugin-Genehmigungsablauf
von OpenClaw geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden an den
ursprünglichen Chat zurückgesendet, und die nächste eingereihte Folgenachricht beantwortet diese native
Serveranforderung, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Elicitation-
Anfragen schlagen standardmäßig geschlossen fehl.

## Warteschlangensteuerung

Die Warteschlangensteuerung während eines aktiven Laufs wird auf `turn/steer` des Codex-App-Servers abgebildet. Mit dem
Standardwert `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie in
Eingangsreihenfolge als eine `turn/steer`-Anfrage. Der Legacy-Modus `queue` sendet separate `turn/steer`-Anfragen.

Codex-Review- und manuelle Compaction-Turns können Steuerung im selben Turn ablehnen. In diesem
Fall verwendet OpenClaw die Folgewarteschlange, wenn der ausgewählte Modus einen Fallback erlaubt.
Siehe [Steuerungswarteschlange](/de/concepts/queue-steering).

## Codex-Feedback-Upload

Wenn `/diagnostics [note]` für eine Sitzung genehmigt wird, die den nativen Codex-
Harness verwendet, ruft OpenClaw außerdem `feedback/upload` des Codex-App-Servers für relevante
Codex-Threads auf. Der Upload fordert den App-Server auf, Protokolle für jeden aufgeführten Thread
und für erzeugte Codex-Unterthreads einzuschließen, sofern verfügbar.

Der Upload läuft über den normalen Codex-Feedbackpfad zu OpenAI-Servern. Wenn Codex-
Feedback in diesem App-Server deaktiviert ist, gibt der Befehl den App-Server-
Fehler zurück. Die abgeschlossene Diagnosereply listet die Kanäle, OpenClaw-Sitzungs-IDs,
Codex-Thread-IDs und lokalen `codex resume <thread-id>`-Befehle für die gesendeten Threads
auf.

Wenn Sie die Genehmigung ablehnen oder ignorieren, gibt OpenClaw diese Codex-IDs nicht aus und
sendet kein Codex-Feedback. Der Upload ersetzt nicht den lokalen Gateway-
Diagnoseexport. Siehe [Diagnoseexport](/de/gateway/diagnostics) für Genehmigung,
Datenschutz, lokales Bundle und Gruppenchat-Verhalten.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige Gateway-
Diagnosebundle wünschen.

## Compaction und Transkriptspiegel

Wenn das ausgewählte Modell den Codex-Harness verwendet, wird native Thread-Compaction an den Codex-App-Server
delegiert. OpenClaw hält einen Transkriptspiegel für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel vor.

Der Spiegel enthält den Benutzer-Prompt, den endgültigen Assistententext sowie schlanke Codex-
Reasoning- oder Planungsdatensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
Start- und Abschlusssignale der nativen Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine
Codex-nativen Tool-Ergebnisdatensätze um. Es gilt nur, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

## Medien und Zustellung

OpenClaw besitzt weiterhin die Medienzustellung und die Auswahl des Medienproviders. Bild,
Video, Musik, PDF, TTS und Medienverständnis verwenden passende Provider-/Modelleinstellungen
wie `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` und `messages.tts`.

Text, Bilder, Video, Musik, TTS, Genehmigungen und Messaging-Tool-Ausgaben laufen weiterhin
über den normalen OpenClaw-Zustellpfad. Mediengenerierung erfordert kein PI.
Wenn Codex ein natives Element zur Bildgenerierung mit einem `savedPath` ausgibt, leitet OpenClaw
genau diese Datei über den normalen Antwort-Medienpfad weiter, auch wenn der Codex-
Turn keinen Assistententext enthält.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Plugin-Hooks](/de/plugins/hooks)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Trajektorienexport](/de/tools/trajectory)
