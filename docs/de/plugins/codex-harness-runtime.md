---
read_when:
    - Sie benötigen den Supportvertrag für die Codex-Harness-Laufzeit
    - Sie debuggen native Codex-Tools, Hooks, Compaction oder den Feedback-Upload
    - Sie ändern das Plugin-Verhalten über Interaktionsrunden in PI und in der Codex-Testumgebung hinweg.
summary: Runtime-Grenzen, Hooks, Tools, Berechtigungen und Diagnostik für das Codex-Harness
title: Codex-Harness-Laufzeit
x-i18n:
    generated_at: "2026-05-11T20:33:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Diese Seite dokumentiert den Laufzeitvertrag für Codex-Harness-Turns. Für Einrichtung und
Routing beginnen Sie mit [Codex-Harness](/de/plugins/codex-harness). Für Konfigurationsfelder
siehe [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Überblick

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex übernimmt mehr
von der nativen Modellschleife, und OpenClaw passt seine Plugin-, Tool-, Sitzungs- und
Diagnoseoberflächen an diese Grenze an.

OpenClaw besitzt weiterhin Channel-Routing, Sitzungsdateien, sichtbare Nachrichtenzustellung,
dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und einen Transkriptspiegel.
Codex besitzt den kanonischen nativen Thread, die native Modellschleife, die native Tool-
Fortsetzung und die native Compaction.

## Thread-Bindungen und Modellwechsel

Wenn eine OpenClaw-Sitzung an einen vorhandenen Codex-Thread angehängt ist, sendet der nächste
Turn das aktuell ausgewählte OpenAI-Modell, die Genehmigungsrichtlinie, die Sandbox und die
Service-Stufe erneut an app-server. Ein Wechsel von `openai/gpt-5.5` zu
`openai/gpt-5.2` behält die Thread-Bindung bei, weist Codex aber an, mit dem neu
ausgewählten Modell fortzufahren.

## Sichtbare Antworten und Heartbeats

Wenn ein Quell-Chat-Turn über den Codex-Harness läuft, verwenden sichtbare Antworten
standardmäßig das OpenClaw-Tool `message`, sofern die Bereitstellung
`messages.visibleReplies` nicht ausdrücklich konfiguriert hat. Der Agent kann seinen
Codex-Turn weiterhin privat abschließen; er postet nur dann in den Channel, wenn er
`message(action="send")` aufruft. Setzen Sie `messages.visibleReplies: "automatic"`,
um abschließende Antworten in Direkt-Chats auf dem alten automatischen Zustellpfad zu belassen.

Codex-Heartbeat-Turns erhalten standardmäßig auch `heartbeat_respond` im durchsuchbaren
OpenClaw-Toolkatalog, damit der Agent aufzeichnen kann, ob das Aufwachen still bleiben oder
benachrichtigen soll, ohne diesen Kontrollfluss im Abschlusstext zu kodieren.

Heartbeat-spezifische Initiative-Anleitung wird als Entwickleranweisung im Codex-
Kollaborationsmodus im Heartbeat-Turn selbst gesendet. Normale Chat-Turns stellen stattdessen
den Codex-Default-Modus wieder her, anstatt Heartbeat-Philosophie in ihrem normalen
Laufzeit-Prompt mitzuführen.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Besitzer                 | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität zwischen PI- und Codex-Harnesses.    |
| Codex-app-server-Erweiterungsmiddleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.        |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lifecycle und native Tool-Richtlinien aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`.

Wenn Codex-app-server-Genehmigungen aktiviert sind, also `approvalPolicy` nicht
`"never"` ist, lässt die standardmäßig injizierte native Hook-Konfiguration
`PermissionRequest` aus, damit der Codex-app-server-Reviewer und OpenClaws Genehmigungsbrücke
echte Eskalationen nach der Prüfung behandeln. Betreiber können `permission_request`
ausdrücklich zu `nativeHookRelay.events` hinzufügen, wenn sie das Kompatibilitäts-Relay benötigen.

Andere Codex-Hooks wie `SessionStart` und `UserPromptSubmit` bleiben Steuerungen auf
Codex-Ebene. Sie werden im v1-Vertrag nicht als OpenClaw-Plugin-Hooks bereitgestellt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den Aufruf angefordert
hat. Daher löst OpenClaw das Plugin- und Middleware-Verhalten aus, das es im Harness-Adapter
besitzt. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz. OpenClaw kann
ausgewählte Ereignisse spiegeln, aber den nativen Codex-Thread nicht umschreiben, außer Codex
stellt diese Operation über app-server- oder native Hook-Callbacks bereit.

Codex-app-server-Elementbenachrichtigungen liefern außerdem asynchrone `after_tool_call`-
Beobachtungen für native Tool-Abschlüsse, die nicht bereits durch das native `PostToolUse`-
Relay abgedeckt sind. Diese Beobachtungen dienen nur Telemetrie und Plugin-Kompatibilität;
sie können den nativen Tool-Aufruf nicht blockieren, verzögern oder verändern.

Compaction- und LLM-Lifecycle-Projektionen stammen aus Codex-app-server-Benachrichtigungen
und dem OpenClaw-Adapterzustand, nicht aus nativen Codex-Hook-Befehlen. OpenClaws Ereignisse
`before_compaction`, `after_compaction`, `llm_input` und `llm_output` sind Beobachtungen auf
Adapterebene, keine bytegenauen Erfassungen der internen Anfragen oder Compaction-Payloads
von Codex.

Native Codex-`hook/started`- und `hook/completed`-app-server-Benachrichtigungen werden als
`codex_app_server.hook`-Agent-Ereignisse für Verlauf und Debugging projiziert. Sie rufen keine
OpenClaw-Plugin-Hooks auf.

## V1-Unterstützungsvertrag

Unterstützt in Codex-Laufzeit v1:

| Oberfläche                                    | Unterstützung                                                                   | Warum                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                                                                      | Codex-app-server besitzt den OpenAI-Turn, die native Thread-Wiederaufnahme und die native Tool-Fortsetzung.                                                                                                |
| OpenClaw-Channel-Routing und Zustellung       | Unterstützt                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage und andere Channels bleiben außerhalb der Modelllaufzeit.                                                                                                      |
| Dynamische OpenClaw-Tools                     | Unterstützt                                                                      | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                            |
| Prompt- und Kontext-Plugins                   | Unterstützt                                                                      | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder wiederaufgenommen wird.                                                                         |
| Lifecycle der Kontext-Engine                  | Unterstützt                                                                      | Zusammenstellung, Aufnahme, Wartung nach dem Turn und Koordination der Kontext-Engine-Compaction laufen für Codex-Turns.                                                                                   |
| Dynamische Tool-Hooks                         | Unterstützt                                                                      | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen um OpenClaw-eigene dynamische Tools herum.                                                                                       |
| Lifecycle-Hooks                               | Als Adapterbeobachtungen unterstützt                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                                    |
| Gate für Überarbeitung der Abschlussantwort   | Über natives Hook-Relay unterstützt                                              | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                           |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über natives Hook-Relay unterstützt                                  | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-app-server `0.125.0` oder neuer. Blockieren wird unterstützt; Argumentumschreibung nicht. |
| Native Berechtigungsrichtlinie                | Über Codex-app-server-Genehmigungen und Kompatibilitäts-Relay für native Hooks unterstützt | Codex-app-server-Genehmigungsanfragen werden nach der Codex-Prüfung durch OpenClaw geroutet. Das native `PermissionRequest`-Hook-Relay ist für native Genehmigungsmodi optional, da Codex es vor der Guardian-Prüfung ausgibt. |
| app-server-Verlaufserfassung                  | Unterstützt                                                                      | OpenClaw zeichnet die Anfrage auf, die es an app-server gesendet hat, sowie die app-server-Benachrichtigungen, die es empfängt.                                                                            |

Nicht unterstützt in Codex-Laufzeit v1:

| Oberfläche                                          | V1-Grenze                                                                                                                                       | Zukünftiger Pfad                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                     | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                    | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzte Tool-Eingaben.                   |
| Bearbeitbare Codex-native Transkripthistorie        | Codex besitzt die kanonische native Thread-Historie. OpenClaw besitzt einen Spiegel und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna verändern. | Explizite Codex-app-server-APIs hinzufügen, falls native Thread-Eingriffe nötig sind.     |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert OpenClaw-eigene Transkriptschreibvorgänge, nicht Codex-native Tool-Datensätze.                                      | Transformierte Datensätze könnten gespiegelt werden, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verworfener Inhalte, kein Token-Delta und keine Zusammenfassungs-Payload. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                      |
| Compaction-Intervention                             | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsebene.                                                                 | Codex-Pre-/Post-Compaction-Hooks hinzufügen, wenn Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen        | OpenClaw kann app-server-Anfragen und -Benachrichtigungen erfassen, aber Codex Core erstellt die finale OpenAI-API-Anfrage intern.              | Benötigt ein Codex-Modellanfrage-Tracing-Ereignis oder eine Debug-API.                    |

## Native Berechtigungen und MCP-Elicitations

Für `PermissionRequest` gibt OpenClaw nur dann ausdrückliche Zulassen- oder Ablehnen-
Entscheidungen zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist
keine Zulassung. Codex behandelt es als keine Hook-Entscheidung und fällt auf seinen eigenen
Guardian- oder Benutzergenehmigungspfad zurück.

Codex-App-Server-Genehmigungsmodi lassen diesen nativen Hook standardmäßig aus. Dieses Verhalten
gilt, wenn `permission_request` explizit in
`nativeHookRelay.events` enthalten ist oder eine Kompatibilitätsruntime ihn installiert.

Wenn ein Operator `allow-always` für eine native Codex-Berechtigungsanfrage auswählt,
merkt sich OpenClaw diesen exakten Provider-/Sitzungs-/Tool-Eingabe-/cwd-Fingerprint für ein
begrenztes Sitzungsfenster. Die gemerkte Entscheidung ist bewusst nur ein
exakter Treffer: Ein geänderter Befehl, geänderte Argumente, eine geänderte Tool-Payload oder ein geändertes cwd
erfordert eine neue Genehmigung.

Codex-MCP-Tool-Genehmigungsaufforderungen werden durch den Plugin-Genehmigungsfluss von OpenClaw
geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden zurück an den
ursprünglichen Chat gesendet, und die nächste eingereihte Folgenachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Aufforderungsanfragen
schlagen geschlossen fehl.

## Queue-Steuerung

Die Queue-Steuerung bei aktivem Lauf wird auf `turn/steer` des Codex-App-Servers abgebildet. Mit dem
Standardwert `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie in
Eingangsreihenfolge als eine `turn/steer`-Anfrage. Der ältere Modus `queue` sendet separate `turn/steer`-Anfragen.

Codex-Review- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen. In diesem
Fall verwendet OpenClaw die Folge-Queue, wenn der ausgewählte Modus Fallback zulässt.
Siehe [Steering-Queue](/de/concepts/queue-steering).

## Codex-Feedback-Upload

Wenn `/diagnostics [note]` für eine Sitzung genehmigt wird, die den nativen Codex-Harness
verwendet, ruft OpenClaw auch `feedback/upload` des Codex-App-Servers für relevante
Codex-Threads auf. Der Upload fordert den App-Server auf, Logs für jeden aufgeführten Thread
und erzeugte Codex-Unterthreads einzuschließen, wenn verfügbar.

Der Upload läuft über den normalen Feedback-Pfad von Codex zu OpenAI-Servern. Wenn Codex-
Feedback in diesem App-Server deaktiviert ist, gibt der Befehl den App-Server-
Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle, OpenClaw-Sitzungs-IDs,
Codex-Thread-IDs und lokale `codex resume <thread-id>`-Befehle für die gesendeten Threads auf.

Wenn Sie die Genehmigung ablehnen oder ignorieren, gibt OpenClaw diese Codex-IDs nicht aus und
sendet kein Codex-Feedback. Der Upload ersetzt nicht den lokalen Gateway-
Diagnoseexport. Siehe [Diagnoseexport](/de/gateway/diagnostics) für Genehmigung,
Datenschutz, lokales Bundle und Gruppenchat-Verhalten.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie speziell den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige Gateway-
Diagnosebundle wünschen.

## Compaction und Transkriptspiegel

Wenn das ausgewählte Modell den Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw hält einen Transkriptspiegel für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel vor.

Der Spiegel enthält den Benutzerprompt, den finalen Assistententext und schlanke Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
native Compaction-Start- und -Abschlussignale auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste der Einträge bereit, die Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine
Codex-nativen Tool-Ergebnisdatensätze um. Es greift nur, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

## Medien und Zustellung

OpenClaw bleibt für Medienzustellung und Medien-Provider-Auswahl zuständig. Bild,
Video, Musik, PDF, TTS und Medienverständnis verwenden passende Provider-/Modell-
Einstellungen wie `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` und `messages.tts`.

Text, Bilder, Video, Musik, TTS, Genehmigungen und Messaging-Tool-Ausgaben laufen weiterhin
über den normalen OpenClaw-Zustellpfad. Mediengenerierung erfordert kein PI.
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
