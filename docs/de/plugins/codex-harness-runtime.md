---
read_when:
    - Sie benötigen den Laufzeitunterstützungsvertrag der Codex-Harness.
    - Sie debuggen native Codex-Tools, Hooks, Compaction oder den Feedback-Upload
    - Sie ändern das Plugin-Verhalten über OpenClaw- und Codex-Harness-Durchläufe hinweg
summary: Laufzeitgrenzen, Hooks, Tools, Berechtigungen und Diagnosefunktionen für das Codex-Harness
title: Codex-Harness-Laufzeit
x-i18n:
    generated_at: "2026-07-12T15:40:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Laufzeitvertrag für Turns im Codex-Harness. Einrichtung und Routing werden unter
[Codex-Harness](/de/plugins/codex-harness) beschrieben. Informationen zu Konfigurationsfeldern finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Übersicht

Codex ist für die native Modellschleife, die native Wiederaufnahme von Threads, die native
Fortsetzung von Tools und die native Compaction zuständig. OpenClaw ist für das Kanal-Routing, Sitzungsdateien,
die sichtbare Nachrichtenzustellung, dynamische OpenClaw-Tools, Genehmigungen, die Medienzustellung
und eine Transkriptspiegelung an dieser Grenze zuständig.

Das Prompt-Routing folgt der ausgewählten Laufzeit und nicht nur der Provider-Zeichenfolge. Ein
nativer Codex-Turn erhält Entwickleranweisungen des Codex App Server; bei einer expliziten
OpenClaw-Kompatibilitätsroute bleibt der normale OpenClaw-System-Prompt erhalten, selbst wenn
Codex-spezifische OpenAI-Authentifizierung oder ein entsprechender Transport verwendet wird.

OpenClaw startet native Codex-Threads und nimmt sie wieder auf, wobei die integrierte
Persönlichkeit von Codex deaktiviert ist (`personality: "none"`), damit Persönlichkeitsdateien des Arbeitsbereichs
und die OpenClaw-Agentenidentität maßgeblich bleiben. Ansonsten behält natives Codex die Codex-eigenen
Basis-/Modellanweisungen und das Laden von Projektdokumenten bei. Leichtgewichtige
OpenClaw-Ausführungen (beispielsweise Cron) unterdrücken das Laden von Projektdokumenten weiterhin.

Die OpenClaw-Entwickleranweisungen decken Laufzeitaspekte von OpenClaw ab: Zustellung über den
Quellkanal, dynamische OpenClaw-Tools, ACP-Delegation, Adapterkontext und die
aktiven Arbeitsbereich-Profil-Dateien des Agenten. Skills-Kataloge und durch Tools weitergeleitete
`MEMORY.md`-Verweise werden als auf den Turn beschränkte Entwickleranweisungen für die Zusammenarbeit
projiziert. Wenn Speicher-Tools nicht verfügbar sind, werden aktive Inhalte aus `BOOTSTRAP.md`
und die vollständige `MEMORY.md` stattdessen als einfacher Eingabekontext für den Turn bereitgestellt.

Die meisten dynamischen OpenClaw-Tools verwenden den durchsuchbaren Namespace `openclaw`. Tools
mit der Kennzeichnung `catalogMode: "direct-only"` verwenden `openclaw_direct`, den Codex
als `DirectModelOnly` direkt für das Modell sichtbar hält, anstatt ihn für die verschachtelte
Ausführung im Code-Modus bereitzustellen.

## Thread-Bindungen und Modellwechsel

Wenn eine OpenClaw-Sitzung mit einem vorhandenen Codex-Thread verknüpft ist, übermittelt der nächste
Turn das aktuell ausgewählte Modell, die Genehmigungsrichtlinie, die Sandbox,
die Prüfinstanz für Genehmigungen und die Dienststufe erneut an den App Server. Beim Wechsel von
`openai/gpt-5.5` zu `openai/gpt-5.2` bleibt die Thread-Bindung erhalten, Codex wird jedoch
aufgefordert, mit dem neu ausgewählten Modell fortzufahren.

Überwachte Bindungen bilden die Ausnahme. Die OpenClaw-Modellauswahl bleibt gesperrt,
und bei der Wiederaufnahme werden Modell- und Provider-Überschreibungen ausgelassen, damit Codex das persistierte
Modell und den persistierten Provider des kanonischen Threads wiederherstellt. Eine separate native Codex-Steuerung kann
dieses persistierte Paar ändern, und der anfängliche Snapshot kann die normale
Warnung von Codex über Modellunterschiede auslösen; das äußere OpenClaw-Modell und die Fallback-Kette
ersetzen keines der beiden.

## Überwachung und sichere Fortsetzung

Die Codex-Überwachung ist eine optionale Funktion desselben `codex`-Plugins. Sie erkennt
native Threads über eine separate Verbindung und projiziert nur nicht archivierte
Sitzungen in den Gateway-Katalog. Ohne explizite `appServer`-Verbindungseinstellungen
verwendet diese Verbindung verwaltetes stdio im Benutzerverzeichnis, während das reguläre
Harness auf den Agenten beschränkt bleibt. Auflistungen und das Lesen von Metadaten sind passiv: Dabei wird
weder ein Thread wiederaufgenommen noch OpenClaw für dessen Live-Ereignisse registriert oder auf dessen
Genehmigungsanfragen geantwortet.

Für eine gespeicherte oder inaktive Sitzung auf dem Gateway-Computer erstellt **Als Branch fortsetzen**
einen normalen, modellgebundenen Chat und spiegelt begrenzte Benutzer- und Assistentenverläufe
bis einschließlich des letzten terminalen persistierten Turns der Quelle. Der erste normale
Chat-Turn installiert die tatsächlichen Genehmigungs-Handler und verwendet einen temporären nativen Fork,
um den Snapshot ohne Modell- oder Provider-Überschreibung zu fixieren. Codex App Server verwendet
seine aktuelle native Konfiguration und gibt das ausgewählte Paar zurück; er gibt seine
normale Warnung aus, wenn sich dieses Modell vom zuletzt aufgezeichneten Modell der Quelle unterscheidet.
Über dieselbe Überwachungsverbindung startet OpenClaw den kanonischen
Codex-Harness-Thread der `appServer`-Quelle unter dessen Arbeitsverzeichnis und Laufzeitrichtlinie mit
exakt dem zurückgegebenen Modell und Provider für diesen anfänglichen Start, fügt den
begrenzten sichtbaren Verlauf ein und archiviert den temporären Fork. Die Quelle wird niemals
wiederaufgenommen. Der kanonische Thread verfügt über die vollständige Tool-Oberfläche des OpenClaw-Harness;
Schlussfolgerungen, Tool-Aufrufe und Tool-Ergebnisse aus der Quelle werden nicht in ihn geklont.
Der private Verbindungsbereich bleibt sowohl bei ausstehenden als auch bei übernommenen Bindungszuständen erhalten, sodass
jeder spätere Turn auf dieser Verbindung mit nativer Authentifizierung und
Provider-Konfiguration verbleibt. Eine deaktivierte Überwachung oder eine Abweichung der Bindung beziehungsweise Verbindung
schlägt sicher fehl, statt zum regulären Harness im Agentenverzeichnis zu wechseln.

Die ursprüngliche CLI- oder VS-Code-Quelle bleibt für beide Kataloge verfügbar. Der
kanonische Branch ist ein nativer Codex-Thread, seine Quellart ist jedoch `appServer`;
native Clients können diese Quellart herausfiltern, sodass sein Erscheinen in Codex Desktop
nicht garantiert ist.

Aktive Quellen können keinen neuen Branch starten und nicht archiviert werden; ein vorhandener überwachter
Chat kann weiterhin geöffnet werden. `notLoaded` bedeutet, dass die Aktivität unbekannt und nicht, dass die Quelle inaktiv ist;
OpenClaw erlaubt die Archivierung einer lokalen Zeile mit `idle` oder `notLoaded` nur nach einer expliziten
Bestätigung, dass keine andere Ausführungsinstanz vorhanden ist, und nach einer aktuellen prozesslokalen Statusabfrage. Codex
serialisiert Thread-Mutationen innerhalb eines App-Server-Prozesses, stellt jedoch
weder eine exklusive prozessübergreifende Runner- noch eine Genehmigungsinhaber-Lease bereit, sodass diese Abfrage nicht
beweisen kann, dass kein anderer Prozess den Thread verwendet. OpenClaw blockiert einen bekannten
aktiven Bindungsinhaber für das exakte Ziel oder jeden nicht archivierten erzeugten Nachfolger,
der von der paginierten Nachfolgerabfrage von Codex zurückgegeben wird. Aufzählungsfehler, Zyklen und
das Ausschöpfen von Sicherheitsgrenzen schlagen sicher fehl. Eine native Archivierung kann weiterhin mit einem neuen Turn
in einem anderen Prozess kollidieren, daher deckt die Bestätigung unbekannte Clients und die Lücke zwischen
Statusabfrage und Archivierung ab. Ein überwachter modellgebundener Chat kann nicht gelöscht werden, solange
er die native Bindung schützt.

Kataloge gekoppelter Nodes bleiben in der ersten Version reine Metadatenkataloge. Die aktuelle
Node-Aufrufgrenze basiert auf Anfrage und Antwort und kann die langlebigen Turn-Ereignisse,
Genehmigungsanfragen oder Streaming-Ausgaben nicht übertragen, die für eine echte Codex-Harness-
Bindung erforderlich sind. **Fortsetzen** und **Archivieren** bleiben daher für entfernte
Quellen nicht verfügbar, selbst wenn die Zeile inaktiv ist.

Informationen zur Einrichtung durch Betreiber und zum sichtbaren Verhalten der Control UI finden Sie unter
[Codex-Überwachung](/de/plugins/codex-supervision).

## Sichtbare Antworten und Heartbeats

Direkte beziehungsweise Quell-Chat-Turns über das Codex-Harness verwenden für interne WebChat-Oberflächen
standardmäßig die automatische Zustellung der endgültigen Assistentenantwort, entsprechend dem Vertrag des Pi-Harness:
Der Agent antwortet normal, und OpenClaw veröffentlicht den endgültigen Text in der
Quellkonversation. Legen Sie `messages.visibleReplies: "message_tool"` fest, damit
der endgültige Assistententext privat bleibt, sofern der Agent nicht `message(action="send")` aufruft.

Codex-Heartbeat-Turns erhalten standardmäßig `heartbeat_respond` im durchsuchbaren OpenClaw-Tool-
Katalog, damit der Agent aufzeichnen kann, ob der Weckvorgang still bleiben oder eine Benachrichtigung
auslösen soll. Hinweise zur Heartbeat-Initiative werden als Codex-Entwickleranweisung im Zusammenarbeitsmodus
gesendet, die auf den Heartbeat-Turn beschränkt ist; normale Chat-Turns bleiben
im Codex-Standardmodus. Wenn `HEARTBEAT.md` nicht leer ist, verweisen die Heartbeat-
Anweisungen Codex auf die Datei, anstatt deren Inhalt einzubetten.

## Hook-Grenzen

| Ebene                                 | Verantwortlich           | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über OpenClaw- und Codex-Harnesses hinweg. |
| Codex-App-Server-Erweiterungs-Middleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.         |
| Native Codex-Hooks                    | Codex                    | Grundlegender Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet weder projektbezogene noch globale Codex-`hooks.json`-Dateien, um
Plugin-Verhalten weiterzuleiten. Für die native Tool- und Berechtigungsbrücke fügt OpenClaw
für jeden Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`, `PermissionRequest`
und `Stop` ein.

Wenn Genehmigungen des Codex App Server aktiviert sind (`approvalPolicy` ist nicht
`"never"`), lässt die standardmäßig eingefügte native Hook-Konfiguration `PermissionRequest`
aus, damit die App-Server-Prüfinstanz von Codex und die Genehmigungsbrücke von OpenClaw tatsächliche
Eskalationen nach der Prüfung verarbeiten. Fügen Sie `permission_request` zu
`nativeHookRelay.events` hinzu, um das Kompatibilitäts-Relay dennoch zu erzwingen. Andere Codex-
Hooks wie `SessionStart` und `UserPromptSubmit` bleiben Steuerungen auf Codex-Ebene;
sie werden im v1-Vertrag nicht als OpenClaw-Plugin-Hooks bereitgestellt.

Bei dynamischen OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat, sodass das Verhalten von Plugin und Middleware im Harness-Adapter ausgeführt wird. Bei
Codex-nativen Tools ist Codex für den kanonischen Tool-Datensatz verantwortlich; OpenClaw kann
ausgewählte Ereignisse spiegeln, den nativen Thread jedoch nicht umschreiben, sofern Codex dies nicht
über App Server oder native Hook-Callbacks bereitstellt.

Codex-App-Server-`PreToolUse`-Ereignisse im Berichtsmodus verschieben die Plugin-Genehmigung auf die
entsprechende App-Server-Genehmigung. Wenn ein OpenClaw-`before_tool_call`-Hook
`requireApproval` zurückgibt, während die native Nutzlast `openclaw_approval_mode:
"report"` festlegt, zeichnet das native Hook-Relay die Plugin-Genehmigungsanforderung auf und
gibt keine native Entscheidung zurück. Wenn Codex später die App-Server-Genehmigungsanfrage
für dieselbe Tool-Nutzung sendet, öffnet OpenClaw die Plugin-Genehmigungsabfrage und
ordnet die Entscheidung Codex zu. Codex-`PermissionRequest`-Ereignisse bilden einen
separaten Genehmigungspfad und können weiterhin über OpenClaw-Genehmigungen weitergeleitet werden, wenn
diese Brücke entsprechend konfiguriert ist.

Elementbenachrichtigungen des Codex App Server stellen außerdem asynchrone `after_tool_call`-
Beobachtungen für Abschlüsse nativer Tools bereit, die nicht bereits durch das native
`PostToolUse`-Relay abgedeckt sind. Diese dienen ausschließlich Telemetrie und Kompatibilität; sie können
den nativen Tool-Aufruf weder blockieren noch verzögern oder verändern.

Projektionen für Compaction und den LLM-Lebenszyklus stammen aus Benachrichtigungen des Codex App Server
und dem Zustand des OpenClaw-Adapters, nicht aus nativen Codex-Hook-Befehlen.
`before_compaction`, `after_compaction`, `llm_input` und `llm_output` sind
Beobachtungen auf Adapterebene und keine bytegenauen Erfassungen der internen
Anfrage- oder Compaction-Nutzlasten von Codex.

Native Codex-App-Server-Benachrichtigungen vom Typ `hook/started` und `hook/completed` werden
als `codex_app_server.hook`-Agentenereignisse für Ablaufverfolgung und
Debugging projiziert. Sie rufen keine OpenClaw-Plugin-Hooks auf.

## Unterstützungsvertrag für V1

Unterstützt in der Codex-Laufzeit v1:

| Oberfläche                                    | Unterstützung                                                                   | Warum                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                                                                      | Der Codex-App-Server verwaltet den OpenAI-Durchlauf, die native Fortsetzung von Threads und die native Fortsetzung von Tools.                                                                                                                                                                                                                                                                                                                                                            |
| OpenClaw-Kanalrouting und -zustellung         | Unterstützt                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modelllaufzeit.                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamische OpenClaw-Tools                     | Unterstützt                                                                      | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw Teil des Ausführungspfads bleibt.                                                                                                                                                                                                                                                                                                                                                                                      |
| Prompt- und Kontext-Plugins                   | Unterstützt                                                                      | OpenClaw projiziert OpenClaw-spezifische Prompts und Kontexte in den Codex-Durchlauf, während Codex-eigene Basis-, Modell- und konfigurierte Projektdokument-Prompts im nativen Codex-Pfad verbleiben. OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für native Threads, damit Persönlichkeitsdateien im Agent-Arbeitsbereich maßgeblich bleiben. Native Codex-Entwickleranweisungen akzeptieren nur Befehlsvorgaben, die ausdrücklich auf `codex_app_server` beschränkt sind; ältere globale Befehlshinweise bleiben für Prompt-Oberflächen außerhalb von Codex bestehen. |
| Lebenszyklus der Kontext-Engine               | Unterstützt                                                                      | Zusammenstellung, Aufnahme und Wartung nach dem Durchlauf werden um Codex-Durchläufe herum ausgeführt. Kontext-Engines ersetzen nicht die native Codex-Compaction.                                                                                                                                                                                                                                                                                                                          |
| Hooks für dynamische Tools                    | Unterstützt                                                                      | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware werden um OpenClaw-eigene dynamische Tools herum ausgeführt.                                                                                                                                                                                                                                                                                                                                                            |
| Lebenszyklus-Hooks                            | Als Adapterbeobachtungen unterstützt                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit unverfälschten Nutzdaten für den Codex-Modus ausgelöst.                                                                                                                                                                                                                                                                                                                                       |
| Revisionsprüfung für die endgültige Antwort   | Über native Hook-Weiterleitung unterstützt                                       | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor dem Abschluss zu einem weiteren Modelldurchlauf auf.                                                                                                                                                                                                                                                                                                                                               |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über native Hook-Weiterleitung unterstützt                                       | Codex `PreToolUse` und `PostToolUse` werden für festgeschriebene native Tool-Oberflächen weitergeleitet, einschließlich MCP-Nutzdaten auf Codex-App-Server `0.142.0` oder neuer. Blockierung wird unterstützt, das Umschreiben von Argumenten jedoch nicht.                                                                                                                                                                                                                                     |
| Native Berechtigungsrichtlinie                | Über Genehmigungen des Codex-App-Servers und kompatible native Hook-Weiterleitung unterstützt | Genehmigungsanfragen des Codex-App-Servers werden nach der Codex-Prüfung über OpenClaw weitergeleitet. Die native Hook-Weiterleitung `PermissionRequest` ist für native Genehmigungsmodi optional, da Codex sie vor der Guardian-Prüfung ausgibt.                                                                                                                                                                                                                                             |
| Erfassung des App-Server-Verlaufs             | Unterstützt                                                                      | OpenClaw zeichnet die an den App-Server gesendete Anfrage und die vom App-Server empfangenen Benachrichtigungen auf.                                                                                                                                                                                                                                                                                                                                                                       |

In der Codex-Laufzeit v1 nicht unterstützt:

| Oberfläche                                          | V1-Grenze                                                                                                                                               | Zukünftiger Lösungsweg                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                     | Native Codex-Hooks vor der Tool-Ausführung können blockieren, aber OpenClaw schreibt Argumente Codex-nativer Tools nicht um.                            | Erfordert Codex-Hook-/Schemasupport für ersetzende Tool-Eingaben.                            |
| Bearbeitbarer Codex-nativer Transkriptverlauf       | Codex verwaltet den maßgeblichen nativen Thread-Verlauf. OpenClaw verwaltet eine Spiegelung und kann zukünftigen Kontext projizieren, sollte jedoch nicht unterstützte Interna nicht verändern. | Explizite Codex-App-Server-APIs hinzufügen, falls Eingriffe in native Threads erforderlich sind. |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert OpenClaw-eigene Transkriptschreibvorgänge, nicht Datensätze Codex-nativer Tools.                                               | Transformierte Datensätze könnten gespiegelt werden, für eine maßgebliche Neuschreibung ist jedoch Codex-Unterstützung erforderlich. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw kann native Compaction anfordern, erhält jedoch keine stabile Liste beibehaltener/verworfener Elemente, kein Token-Delta, keine Abschlusszusammenfassung und keine Zusammenfassungsnutzdaten. | Erfordert umfangreichere Codex-Compaction-Ereignisse.                                        |
| Eingriff in die Compaction                          | OpenClaw ermöglicht Plugins oder Kontext-Engines nicht, native Codex-Compaction zu verhindern, umzuschreiben oder zu ersetzen.                          | Codex-Hooks vor/nach der Compaction hinzufügen, falls Plugins native Compaction verhindern oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen        | OpenClaw kann App-Server-Anfragen und -Benachrichtigungen erfassen, aber der Codex-Kern erstellt die endgültige OpenAI-API-Anfrage intern.                | Erfordert ein Codex-Tracing-Ereignis für Modellanfragen oder eine Debug-API.                 |

## Native Berechtigungen und MCP-Abfragen

Bei `PermissionRequest` gibt OpenClaw nur dann ausdrückliche Zulassungs- oder
Ablehnungsentscheidungen zurück, wenn die Richtlinie eine Entscheidung trifft.
Ein Ergebnis ohne Entscheidung ist keine Zulassung: Codex behandelt es als
fehlende Hook-Entscheidung und greift auf den eigenen Guardian- oder
Benutzergenehmigungspfad zurück.

In den Genehmigungsmodi des Codex-App-Servers ist dieser native Hook
standardmäßig nicht enthalten. Dies gilt, sofern `permission_request` nicht
ausdrücklich in `nativeHookRelay.events` enthalten ist oder von einer
Kompatibilitätslaufzeit installiert wird.

Wenn ein Betreiber für eine native Codex-Berechtigungsanfrage `allow-always`
auswählt, merkt sich OpenClaw den exakten Fingerabdruck aus
Provider/Sitzung/Tool-Eingabe/cwd für ein begrenztes Sitzungszeitfenster. Die
gespeicherte Entscheidung gilt absichtlich nur bei exakter Übereinstimmung:
Ein geänderter Befehl, andere Argumente, andere Tool-Nutzdaten oder ein anderes
cwd erfordern eine neue Genehmigung.

Genehmigungsabfragen für Codex-MCP-Tools werden über den Plugin-Genehmigungsablauf
von OpenClaw weitergeleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` kennzeichnet. Codex-Eingabeaufforderungen vom Typ
`request_user_input` werden an den ursprünglichen Chat zurückgesendet, und die
nächste in die Warteschlange gestellte Folgenachricht beantwortet diese native
Serveranfrage, anstatt als zusätzlicher Kontext gesteuert zu werden. Andere
MCP-Abfrageanfragen schlagen sicher geschlossen fehl.

Den allgemeinen Plugin-Genehmigungsablauf, der diese Eingabeaufforderungen
überträgt, finden Sie unter
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests).

## Warteschlangensteuerung

Die Warteschlangensteuerung für aktive Durchläufe wird auf `turn/steer` des
Codex-App-Servers abgebildet. Mit dem Standardwert
`messages.queue.mode: "steer"` fasst OpenClaw Chat-Nachrichten im
Steuerungsmodus für das konfigurierte Ruhezeitfenster zusammen und sendet sie
in der Reihenfolge ihres Eingangs als eine `turn/steer`-Anfrage.

Codex-Überprüfungen und manuelle Compaction-Durchläufe können Steuerungsanweisungen im selben Durchlauf ablehnen. In
diesem Fall wartet OpenClaw, bis der aktive Durchlauf abgeschlossen ist, bevor
der Prompt gestartet wird. Verwenden Sie `/queue followup` oder `/queue collect`, wenn Nachrichten
standardmäßig in die Warteschlange gestellt statt zur Steuerung verwendet werden sollen. Siehe [Steuerungswarteschlange](/de/concepts/queue-steering).

## Hochladen von Codex-Feedback

Wenn `/diagnostics [note]` für eine Sitzung im nativen Codex-
Harness genehmigt wird, ruft OpenClaw für relevante
Codex-Threads zusätzlich `feedback/upload` des Codex-App-Servers auf, einschließlich der Protokolle für jeden aufgeführten Thread und erzeugte Codex-
Unterthreads, sofern verfügbar.

Der Upload erfolgt über den normalen Feedback-Pfad von Codex zu OpenAI-Servern. Wenn
Codex-Feedback in diesem App-Server deaktiviert ist, gibt der Befehl den
App-Server-Fehler zurück. Die Antwort nach Abschluss der Diagnose führt die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf.

Wenn Sie die Genehmigung verweigern oder ignorieren, gibt OpenClaw diese Codex-IDs
nicht aus und sendet kein Codex-Feedback. Der Upload ersetzt nicht den lokalen
Export der Gateway-Diagnose. Informationen zu Genehmigung, Datenschutz, lokalem Paket und Verhalten in Gruppenchats finden Sie unter
[Diagnoseexport](/de/gateway/diagnostics).

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie den Codex-Feedback-Upload
für den derzeit angehängten Thread ohne das vollständige Gateway-Diagnosepaket
durchführen möchten.

## Compaction und Transkriptspiegel

Wenn das ausgewählte Modell das Codex-Harness verwendet, ist der Codex-App-Server
für die native Thread-Compaction zuständig. OpenClaw führt für
Codex-Durchläufe keine vorbereitende Compaction aus, ersetzt die Codex-Compaction nicht durch die Compaction der Kontext-Engine und greift
nicht auf OpenClaw oder die öffentliche Zusammenfassung von OpenAI zurück, wenn die native Compaction nicht
gestartet werden kann. OpenClaw führt einen Transkriptspiegel für den Kanalverlauf, die Suche,
`/new`, `/reset` sowie zukünftige Modell- oder Harness-Wechsel.

Explizite Compaction-Anfragen wie `/compact` oder eine von einem Plugin angeforderte manuelle
Compaction-Operation starten die native Codex-Compaction mit `thread/compact/start`.
OpenClaw hält die Anfrage und die gemeinsam genutzte Client-Lease offen, bis Codex das
zugehörige Abschlusselement `contextCompaction` ausgibt, und meldet anschließend den Compaction-
Durchlauf als abgeschlossen. Wenn dieser abschließende Durchlauf das konfigurierte Compaction-
Zeitlimit überschreitet, fordert OpenClaw eine native Unterbrechung des Durchlaufs an. Die Lease und die Thread-spezifische
Compaction-Sperre bleiben bestehen, bis Codex einen Endzustand meldet oder
den Unterbrechungs-RPC bestätigt. Wenn Codex die Unterbrechung nicht innerhalb der
Toleranzfrist bestätigt, setzt OpenClaw die Verbindung außer Betrieb, bevor die Sperre freigegeben wird. Bei Remote-
Verbindungen wird außerdem die zugehörige Thread-Bindung getrennt, damit sich spätere Arbeiten nicht
mit einem unbestätigten Remote-Durchlauf überschneiden können. Andere Durchläufe auf einer außer Betrieb gesetzten Verbindung schlagen fehl
und können mit einem neuen Client erneut versucht werden. Das Schließen des Clients, der Abbruch der Anfrage oder ein
fehlgeschlagener Compaction-Durchlauf führt zu einer fehlgeschlagenen Operation. Die automatische Compaction bei Kontextauslastung
ist Aufgabe von Codex; OpenClaw startet die native Compaction nur bei manuell
angeforderten Auslösern.

Wenn eine Kontext-Engine die Projektion zum Initialisieren eines Codex-Threads anfordert, projiziert OpenClaw
Namen und IDs von Tool-Aufrufen, Eingabeformen und geschwärzte Inhalte von Tool-Ergebnissen
in den neuen Codex-Thread. Unverarbeitete Argumentwerte von Tool-Aufrufen werden
nicht in diese Projektion kopiert.

Der Spiegel enthält den Benutzer-Prompt, den endgültigen Assistententext und kompakte
Codex-Denk- oder Planungsdatensätze, sofern der App-Server sie ausgibt. OpenClaw
zeichnet den Start und den Endstatus der nativen Compaction auf, stellt jedoch
weder eine menschenlesbare Compaction-Zusammenfassung noch eine überprüfbare Liste der Einträge bereit,
die Codex nach der Compaction beibehalten hat.

Da Codex Eigentümer des kanonischen nativen Threads ist, schreibt `tool_result_persist`
Codex-native Tool-Ergebnisdatensätze nicht neu. Es gilt nur, wenn OpenClaw
ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

## Medien und Zustellung

OpenClaw bleibt für die Medienzustellung und die Auswahl des Medien-Providers zuständig. Bild-,
Video- und Musikgenerierung, PDF, TTS sowie Medienverständnis verwenden entsprechende Provider-/Modell-
Einstellungen wie `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` und `messages.tts`.

Text, Bilder, Videos, Musik, TTS, Genehmigungen und die Ausgabe von Messaging-Tools werden weiterhin
über den normalen Zustellungspfad von OpenClaw übertragen; die Mediengenerierung erfordert
die Legacy-Laufzeit nicht. Wenn Codex ein natives Element zur Bildgenerierung mit einem
`savedPath` ausgibt, leitet OpenClaw genau diese Datei über den normalen Antwortmedien-
Pfad weiter, selbst wenn der Codex-Durchlauf keinen Assistententext enthält.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Überwachung](/de/plugins/codex-supervision)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Plugin-Hooks](/de/plugins/hooks)
- [Plugins für Agent-Harnesses](/de/plugins/sdk-agent-harness)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Trajektorienexport](/de/tools/trajectory)
