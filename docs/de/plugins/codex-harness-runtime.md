---
read_when:
    - Sie benötigen den Laufzeitunterstützungsvertrag des Codex-Harnesses
    - Sie debuggen native Codex-Tools, Hooks, Compaction oder den Feedback-Upload
    - Sie ändern das Plugin-Verhalten über OpenClaw- und Codex-Harness-Durchläufe hinweg
summary: Laufzeitgrenzen, Hooks, Tools, Berechtigungen und Diagnosefunktionen für das Codex-Harness
title: Codex-Harness-Laufzeit
x-i18n:
    generated_at: "2026-07-24T03:57:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6d18d42683df0d827b776547f7b45f60f572cf39410d00533f53f8fdcdccb0d2
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Laufzeitvertrag für Codex-Harness-Turns. Informationen zu Einrichtung und Routing finden Sie unter
[Codex-Harness](/de/plugins/codex-harness). Informationen zu Konfigurationsfeldern finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Übersicht

Codex verwaltet die native Modellschleife, die native Fortsetzung von Threads, die native
Fortsetzung von Tools und die native Compaction. OpenClaw verwaltet das Kanal-Routing, Sitzungsdateien,
die sichtbare Nachrichtenzustellung, dynamische OpenClaw-Tools, Genehmigungen, die Medienzustellung
und eine Transkriptspiegelung um diese Grenze herum.

Das Prompt-Routing richtet sich nach der ausgewählten Laufzeit, nicht nur nach der Provider-Zeichenfolge. Ein
nativer Codex-Turn erhält Entwickleranweisungen des Codex App Server; bei einer expliziten
OpenClaw-Kompatibilitätsroute bleibt der normale OpenClaw-System-Prompt erhalten, selbst wenn
Codex-spezifische OpenAI-Authentifizierung oder ein entsprechender Transport verwendet wird.

OpenClaw startet native Codex-Threads und setzt sie fort, wobei die integrierte
Persönlichkeit von Codex deaktiviert ist (`personality: "none"`), sodass Persönlichkeitsdateien des Arbeitsbereichs
und die Identität des OpenClaw-Agenten maßgeblich bleiben. Ansonsten behält natives Codex die
von Codex verwalteten Basis-/Modellanweisungen und das Laden von Projektdokumenten bei. Leichtgewichtige
OpenClaw-Ausführungen (beispielsweise Cron) unterdrücken weiterhin das Laden von Projektdokumenten.

Die OpenClaw-Entwickleranweisungen decken Belange der OpenClaw-Laufzeit ab: Zustellung über den Quellkanal,
dynamische OpenClaw-Tools, ACP-Delegierung, Adapterkontext und die
aktiven Arbeitsbereich-Profildateien des Agenten. Skill-Kataloge und über Tools weitergeleitete
`MEMORY.md`-Verweise werden als auf den Turn beschränkte Entwickleranweisungen für die Zusammenarbeit
projiziert. Wenn Speicher-Tools nicht verfügbar sind, werden aktive `BOOTSTRAP.md`-Inhalte
und vollständige `MEMORY.md` stattdessen als einfacher Eingabekontext des Turns verwendet.

Die meisten dynamischen OpenClaw-Tools verwenden den durchsuchbaren `openclaw`-Namespace. Mit
`catalogMode: "direct-only"` gekennzeichnete Tools verwenden `openclaw_direct`, das Codex
direkt als `DirectModelOnly` für das Modell sichtbar hält, anstatt es für eine verschachtelte
Code-Mode-Ausführung bereitzustellen.

## Thread-Bindungen und Modelländerungen

Wenn eine OpenClaw-Sitzung mit einem vorhandenen Codex-Thread verknüpft ist, sendet der nächste
Turn das aktuell ausgewählte Modell, die Genehmigungsrichtlinie, die Sandbox,
den Genehmigungsprüfer und die Dienststufe erneut an den App Server. Beim Wechsel von
`openai/gpt-5.5` zu `openai/gpt-5.2` bleibt die Thread-Bindung erhalten, Codex wird jedoch
aufgefordert, mit dem neu ausgewählten Modell fortzufahren.

Überwachte Bindungen bilden die Ausnahme. Die OpenClaw-Modellauswahl bleibt gesperrt,
und bei Fortsetzungen werden Modell- und Provider-Überschreibungen ausgelassen, damit Codex das persistierte
Modell und den Provider des kanonischen Threads wiederherstellt. Eine separate native Codex-Steuerung kann
dieses persistierte Paar ändern, und der anfängliche Snapshot kann die normale
Modellabweichungswarnung von Codex auslösen; das äußere OpenClaw-Modell und die Fallback-Kette
ersetzen keines von beiden.

## Überwachung und sichere Fortsetzung

Die Codex-Überwachung ist eine optionale Funktion desselben `codex`-Plugins. Sie erkennt
native Threads über eine separate Verbindung und projiziert nur nicht archivierte
Sitzungen in den Gateway-Katalog. Ohne explizite `appServer`-Verbindungseinstellungen
verwendet diese Verbindung verwaltetes Benutzerverzeichnis-stdio, während das gewöhnliche
Harness agentenspezifisch bleibt. Auflistungs- und Metadatenlesevorgänge sind passiv: Sie
setzen keinen Thread fort, abonnieren OpenClaw nicht für dessen Live-Ereignisse und beantworten
dessen Genehmigungen nicht.

Für eine gespeicherte oder inaktive Sitzung auf dem Gateway-Computer erstellt **Als Branch fortsetzen**
einen normalen, modellgesperrten Chat und spiegelt einen begrenzten Benutzer- und Assistentenverlauf
bis einschließlich des letzten terminalen persistierten Turns der Quelle. Der erste normale
Chat-Turn installiert die tatsächlichen Genehmigungs-Handler und verwendet einen temporären nativen Fork,
um den Snapshot ohne Modell- oder Provider-Überschreibung festzuhalten. Codex App Server verwendet
seine aktuelle native Konfiguration und gibt das ausgewählte Paar zurück; er gibt seine
normale Warnung aus, wenn dieses Modell vom zuletzt aufgezeichneten Modell der Quelle abweicht.
Über dieselbe Überwachungsverbindung startet OpenClaw den kanonischen
Codex-Harness-Thread der `appServer`-Quelle unter dessen Arbeitsverzeichnis und Laufzeitrichtlinie mit
genau dem zurückgegebenen Modell und Provider für diesen ersten Start, fügt den
begrenzten sichtbaren Verlauf ein und archiviert den temporären Fork. Die Quelle wird niemals
fortgesetzt. Der kanonische Thread verfügt über die vollständige Tool-Oberfläche des OpenClaw-Harness;
Schlussfolgerungen, Tool-Aufrufe und Tool-Ergebnisse der Quelle werden nicht in ihn geklont.
Der private Verbindungsumfang bleibt über ausstehende und bestätigte Bindungszustände hinweg bestehen, sodass
jeder spätere Turn auf dieser Verbindung mit nativer Authentifizierung und Provider-Konfiguration
verbleibt. Eine deaktivierte Überwachung oder Abweichungen bei Bindung oder Verbindung führen zu einem sicheren
Abbruch, anstatt zum gewöhnlichen Harness im Agentenverzeichnis zu wechseln.

Die ursprüngliche CLI-, VS-Code-, Atlas- oder ChatGPT-Quelle bleibt für beide
Kataloge verfügbar. Der kanonische Branch ist ein nativer Codex-Thread, sein Quelltyp ist jedoch
`appServer`; native Clients können diesen Quelltyp herausfiltern, sodass sein Erscheinen in
Codex Desktop nicht garantiert ist.

Aktive Quellen können keinen neuen Branch starten und nicht archiviert werden; ein vorhandener überwachter
Chat kann weiterhin geöffnet werden. `notLoaded` bedeutet, dass die Aktivität unbekannt ist, nicht, dass sie inaktiv ist;
OpenClaw erlaubt die Archivierung einer lokalen `idle`- oder `notLoaded`-Zeile nur nach einer expliziten
Bestätigung, dass kein anderer Runner vorhanden ist, und einer aktuellen prozesslokalen Statusabfrage. Codex
serialisiert Thread-Mutationen innerhalb eines App-Server-Prozesses, stellt jedoch keine
exklusive prozessübergreifende Lease für Runner oder Genehmigungsinhaber bereit, sodass diese Abfrage nicht
beweisen kann, dass kein anderer Prozess den Thread verwendet. OpenClaw blockiert einen bekannten
aktiven Bindungsinhaber für das genaue Ziel oder einen nicht archivierten erzeugten Nachfahren,
den die paginierte Nachfahrenabfrage von Codex zurückgibt. Aufzählungsfehler, Zyklen und
das Ausschöpfen von Sicherheitsgrenzen führen zu einem sicheren Abbruch. Die native Archivierung kann dennoch mit einem neuen Turn
in einem anderen Prozess kollidieren; daher deckt die Bestätigung unbekannte Clients und die Lücke zwischen
Statusabfrage und Archivierung ab. Ein überwachter modellgesperrter Chat kann nicht gelöscht werden, solange
er die native Bindung schützt.

Kataloge gekoppelter Nodes bleiben in der ersten Version auf Metadaten beschränkt. Die aktuelle
Node-Aufrufgrenze basiert auf Anfrage und Antwort und kann die langlebigen Turn-Ereignisse,
Genehmigungsanfragen oder Streaming-Ausgaben nicht übertragen, die eine echte Codex-Harness-
Bindung erfordert. Remote-**Fortsetzen** und **Archivieren** bleiben daher selbst dann nicht verfügbar,
wenn die Zeile inaktiv ist.

Informationen zur Einrichtung durch den Betreiber und zum sichtbaren Verhalten der Control UI finden Sie unter
[Codex-Überwachung](/de/plugins/codex-supervision).

## Sichtbare Antworten und Heartbeats

Direkte bzw. über den Quell-Chat laufende Turns durch das Codex-Harness verwenden standardmäßig die automatische Zustellung der finalen
Assistentenantwort für interne WebChat-Oberflächen, entsprechend dem Vertrag des Pi-Harness:
Der Agent antwortet normal, und OpenClaw sendet den finalen Text an die
Quellkonversation. Legen Sie `messages.visibleReplies: "message_tool"` fest, damit
der finale Assistententext privat bleibt, sofern der Agent nicht `message(action="send")` aufruft.

Codex-Heartbeat-Turns erhalten standardmäßig `heartbeat_respond` im durchsuchbaren OpenClaw-Tool-
Katalog, damit der Agent festhalten kann, ob der Weckvorgang still bleiben oder eine Benachrichtigung
auslösen soll. Leitlinien zur Heartbeat-Initiative werden als Entwickleranweisung für den Codex-Zusammenarbeitsmodus
gesendet, die auf den Heartbeat-Turn beschränkt ist; gewöhnliche Chat-Turns bleiben
im Codex-Standardmodus. Wenn `HEARTBEAT.md` nicht leer ist, verweisen die Heartbeat-
Anweisungen auf die Datei, anstatt deren Inhalt direkt einzubetten.

## Hook-Grenzen

| Ebene                                 | Verantwortlicher         | Zweck                                                                |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität zwischen OpenClaw- und Codex-Harnesses. |
| Codex-App-Server-Erweiterungsmiddleware | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Turn für dynamische OpenClaw-Tools.           |
| Native Codex-Hooks                    | Codex                    | Codex-Lebenszyklus auf niedriger Ebene und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
Plugin-Verhalten weiterzuleiten. Für die native Tool- und Berechtigungsbrücke fügt OpenClaw
eine threadbezogene Codex-Konfiguration für `PreToolUse`, `PostToolUse`, `PermissionRequest`
und `Stop` ein.

Wenn Genehmigungen des Codex App Server aktiviert sind (`approvalPolicy` ist nicht
`"never"`), lässt die standardmäßig eingefügte native Hook-Konfiguration `PermissionRequest`
aus, sodass der App-Server-Prüfer von Codex und die Genehmigungsbrücke von OpenClaw tatsächliche
Eskalationen nach der Prüfung verarbeiten. Fügen Sie `permission_request` zu
`nativeHookRelay.events` hinzu, um das Kompatibilitäts-Relay dennoch zu erzwingen. Andere Codex-
Hooks wie `SessionStart` und `UserPromptSubmit` bleiben Steuerungen auf Codex-Ebene;
sie werden im v1-Vertrag nicht als OpenClaw-Plugin-Hooks bereitgestellt.

Bei dynamischen OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den Aufruf
angefordert hat, sodass Plugin- und Middleware-Verhalten im Harness-Adapter ausgeführt werden. Codex
Code Mode empfängt generische dynamische Ergebnisse als Text und serialisiert verschachtelte
dynamische Aufrufe; Aufrufer müssen JSON-ähnliche Ergebnisse parsen und können sich bei der
gleichzeitigen Übermittlung nicht auf `Promise.all` verlassen. Bei nativen Codex-Tools verwaltet Codex den
kanonischen Tool-Datensatz; OpenClaw kann ausgewählte Ereignisse spiegeln, den
nativen Thread jedoch nur umschreiben, wenn Codex dies über App-Server- oder native Hook-
Callbacks bereitstellt.

`PreToolUse`-Ereignisse im Berichtsmodus des Codex App Server verschieben die Plugin-Genehmigung auf die
entsprechende App-Server-Genehmigung. Wenn ein OpenClaw-`before_tool_call`-Hook
`requireApproval` zurückgibt, während die native Nutzlast `openclaw_approval_mode:
"report"` setzt, zeichnet das native Hook-Relay die Plugin-Genehmigungsanforderung auf und
gibt keine native Entscheidung zurück. Wenn Codex später die App-Server-Genehmigungsanfrage
für dieselbe Tool-Verwendung sendet, öffnet OpenClaw die Plugin-Genehmigungsabfrage und
bildet die Entscheidung wieder auf Codex ab. Codex-`PermissionRequest`-Ereignisse bilden einen
separaten Genehmigungspfad und können weiterhin über OpenClaw-Genehmigungen weitergeleitet werden, wenn
diese Brücke entsprechend konfiguriert ist.

Elementbenachrichtigungen des Codex App Server stellen außerdem asynchrone `after_tool_call`-
Beobachtungen für Abschlüsse nativer Tools bereit, die nicht bereits durch das native
`PostToolUse`-Relay abgedeckt sind. Diese dienen ausschließlich der Telemetrie und Kompatibilität; sie können
den nativen Tool-Aufruf weder blockieren noch verzögern oder verändern.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Benachrichtigungen des Codex App Server
und dem Zustand des OpenClaw-Adapters, nicht aus nativen Codex-Hook-Befehlen.
`before_compaction`, `after_compaction`, `llm_input` und `llm_output` sind
Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen der internen
Anfrage- oder Compaction-Nutzlasten von Codex.

Native Codex-App-Server-Benachrichtigungen `hook/started` und `hook/completed` werden
als `codex_app_server.hook`-Agentenereignisse für Ablaufverfolgung und
Fehlerbehebung projiziert. Sie rufen keine OpenClaw-Plugin-Hooks auf.

## Unterstützungsvertrag für V1

Unterstützt in Codex-Laufzeit v1:

| Oberfläche                                    | Unterstützung                                                                    | Begründung                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                                                                      | Der Codex-App-Server verwaltet den OpenAI-Turn, die native Fortsetzung von Threads und die native Fortsetzung von Tools.                                                                                                                                                                                                                                                                                                                                                            |
| OpenClaw-Kanalrouting und -zustellung         | Unterstützt                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-Runtime.                                                                                                                                                                                                                                                                                                                                                                                |
| Dynamische OpenClaw-Tools                     | Unterstützt                                                                      | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw Teil des Ausführungspfads bleibt.                                                                                                                                                                                                                                                                                                                                                                               |
| Prompt- und Kontext-Plugins                   | Unterstützt                                                                      | OpenClaw projiziert OpenClaw-spezifische Prompts und Kontexte in den Codex-Turn, während Codex-eigene Basis-, Modell- und konfigurierte Projektdokument-Prompts im nativen Codex-Pfad verbleiben. OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für native Threads, sodass die Persönlichkeitsdateien im Agent-Arbeitsbereich maßgeblich bleiben. Native Codex-Entwickleranweisungen akzeptieren nur Befehlsanleitungen, deren Geltungsbereich ausdrücklich auf `codex_app_server` beschränkt ist; ältere globale Befehlshinweise bleiben für Nicht-Codex-Prompt-Oberflächen erhalten. |
| Lebenszyklus der Kontext-Engine               | Unterstützt                                                                      | Zusammenstellung, Aufnahme und Wartung nach dem Turn werden um Codex-Turns herum ausgeführt. Kontext-Engines ersetzen nicht die native Codex-Compaction.                                                                                                                                                                                                                                                                                                                             |
| Hooks für dynamische Tools                    | Unterstützt                                                                      | `before_tool_call`, `after_tool_call` und die Tool-Ergebnis-Middleware werden um OpenClaw-eigene dynamische Tools herum ausgeführt.                                                                                                                                                                                                                                                                                                                                                  |
| Lebenszyklus-Hooks                            | Als Adapterbeobachtungen unterstützt                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit wahrheitsgetreuen Payloads für den Codex-Modus ausgelöst.                                                                                                                                                                                                                                                                                                             |
| Prüfstufe zur Überarbeitung der endgültigen Antwort | Über natives Hook-Relay unterstützt                                         | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                                                                                                                                                                                                                                                                                     |
| Native Shell-, Patch- und MCP-Aktionen blockieren oder beobachten | Über natives Hook-Relay unterstützt                              | Codex `PreToolUse` und `PostToolUse` werden für bestätigte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex-App-Server `0.142.0` oder neuer. Blockieren wird unterstützt, das Umschreiben von Argumenten nicht.                                                                                                                                                                                                                         |
| Native Berechtigungsrichtlinie                | Über Genehmigungen des Codex-App-Servers und das native Kompatibilitäts-Hook-Relay unterstützt | Genehmigungsanfragen des Codex-App-Servers werden nach der Codex-Prüfung über OpenClaw geleitet. Das native Hook-Relay `PermissionRequest` ist für native Genehmigungsmodi optional, da Codex es vor der Guardian-Prüfung ausgibt.                                                                                                                                                                                                                                                         |
| Erfassung der App-Server-Trajektorie           | Unterstützt                                                                      | OpenClaw zeichnet die an den App-Server gesendete Anfrage und die vom App-Server empfangenen Benachrichtigungen auf.                                                                                                                                                                                                                                                                                                                                                                 |

In Codex-Runtime v1 nicht unterstützt:

| Oberfläche                                          | V1-Grenze                                                                                                                                       | Zukünftiger Pfad                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                     | Native Pre-Tool-Hooks von Codex können blockieren, aber OpenClaw schreibt die Argumente Codex-nativer Tools nicht um.                            | Erfordert Codex-Hook-/Schema-Unterstützung für die Ersetzung der Tool-Eingabe.                       |
| Bearbeitbarer Codex-nativer Transkriptverlauf       | Codex verwaltet den kanonischen nativen Threadverlauf. OpenClaw verwaltet eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber nicht unterstützte Interna nicht verändern. | Explizite Codex-App-Server-APIs hinzufügen, falls eine Bearbeitung nativer Threads erforderlich ist. |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert OpenClaw-eigene Transkriptschreibvorgänge, nicht Codex-native Tool-Datensätze.                                         | Transformierte Datensätze könnten gespiegelt werden, aber eine kanonische Umschreibung erfordert Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw kann native Compaction anfordern, erhält jedoch keine stabile Liste beibehaltener/verworfener Elemente, kein Token-Delta, keine Abschlusszusammenfassung und keinen Zusammenfassungs-Payload. | Erfordert umfangreichere Codex-Compaction-Ereignisse.                                                |
| Eingriff in die Compaction                          | OpenClaw erlaubt Plugins oder Kontext-Engines nicht, native Codex-Compaction abzulehnen, umzuschreiben oder zu ersetzen.                         | Codex-Pre-/Post-Compaction-Hooks hinzufügen, falls Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen        | OpenClaw kann App-Server-Anfragen und -Benachrichtigungen erfassen, aber der Codex-Kern erstellt die endgültige OpenAI-API-Anfrage intern.        | Erfordert ein Codex-Ereignis zur Verfolgung von Modellanfragen oder eine Debug-API.                  |

## Native Berechtigungen und MCP-Elicitations

Für `PermissionRequest` gibt OpenClaw nur dann ausdrückliche Zulassungs- oder
Ablehnungsentscheidungen zurück, wenn die Richtlinie eine Entscheidung trifft.
Ein Ergebnis ohne Entscheidung ist keine Zulassung: Codex behandelt es so, als
läge keine Hook-Entscheidung vor, und greift auf seinen eigenen Guardian- oder
Benutzergenehmigungspfad zurück.

In den Genehmigungsmodi des Codex-App-Servers wird dieser native Hook
standardmäßig ausgelassen. Dies gilt, sofern `permission_request` nicht
ausdrücklich in `nativeHookRelay.events` enthalten ist oder eine
Kompatibilitäts-Runtime ihn installiert.

Wenn ein Betreiber `allow-always` für eine native Codex-
Berechtigungsanfrage auswählt, merkt sich OpenClaw diesen exakten Fingerabdruck
aus Provider-, Sitzungs- und Tool-Eingabe sowie cwd für ein begrenztes
Sitzungszeitfenster. Die gespeicherte Entscheidung gilt absichtlich nur bei
exakter Übereinstimmung: Ein geänderter Befehl, geänderte Argumente, ein
geänderter Tool-Payload oder ein geändertes cwd erfordern eine neue
Genehmigung.

Genehmigungs-Elicitations für Codex-MCP-Tools werden über den Plugin-
Genehmigungsablauf von OpenClaw geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` kennzeichnet. Codex `request_user_input` registriert eine
Provider-neutrale Gateway-Frage für die ursprüngliche Sitzung. Die Control UI
zeigt die Karte mit der Gateway-Frage an, und für eine einzelne nicht geheime
Auswahl werden typisierte Kanalschaltflächen verwendet, sofern der Kanal diese
unterstützt. Schaltflächenbetätigungen, Antworten in der Control UI und die
nächste in der Warteschlange stehende Klartextantwort lösen alle denselben
Gateway-Datensatz auf, bevor OpenClaw die App-Server-Antwort zurückgibt. Die
automatische Auflösung durch Codex und der Abbruch von Versuchen begrenzen die
Wartezeit und brechen den Datensatz ab. Geheime Fragen verbleiben vollständig
im mit einer Warnung versehenen Textantwortpfad. Andere MCP-Elicitation-
Anfragen werden standardmäßig abgelehnt.

Informationen zum allgemeinen Plugin-Genehmigungsablauf, der diese Prompts
überträgt, finden Sie unter
[Plugin-Berechtigungsanfragen](/de/plugins/plugin-permission-requests).

## Warteschlangensteuerung

Die Steuerung der Warteschlange aktiver Ausführungen wird auf Codex app-server `turn/steer` abgebildet. Mit dem
standardmäßigen `messages.queue.mode: "steer"` fasst OpenClaw Chatnachrichten im Steuerungsmodus
für das konfigurierte Ruhefenster zusammen und sendet sie in der Reihenfolge ihres Eingangs als eine `turn/steer`-
Anfrage.

Codex-Reviews und manuelle Compaction-Vorgänge können die Steuerung im selben Vorgang ablehnen. In
diesem Fall wartet OpenClaw, bis die aktive Ausführung abgeschlossen ist, bevor der
Prompt gestartet wird. Verwenden Sie `/queue followup` oder `/queue collect`, wenn Nachrichten standardmäßig
in die Warteschlange eingereiht statt zur Steuerung verwendet werden sollen. Siehe [Steuerungswarteschlange](/de/concepts/queue-steering).

## Hochladen von Codex-Feedback

Wenn `/diagnostics [note]` für eine Sitzung im nativen Codex-
Harness genehmigt wurde, ruft OpenClaw für relevante
Codex-Threads außerdem Codex app-server `feedback/upload` auf, einschließlich der Protokolle für jeden aufgeführten Thread und erzeugter Codex-
Unterthreads, sofern verfügbar.

Das Hochladen erfolgt über den regulären Feedbackpfad von Codex zu den OpenAI-Servern. Wenn
Codex-Feedback in diesem app-server deaktiviert ist, gibt der Befehl den
app-server-Fehler zurück. Die Antwort nach Abschluss der Diagnose führt die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf.

Wenn Sie die Genehmigung verweigern oder ignorieren, gibt OpenClaw diese Codex-IDs
nicht aus und sendet kein Codex-Feedback. Das Hochladen ersetzt nicht den lokalen
Export der Gateway-Diagnose. Weitere Informationen zu Genehmigung, Datenschutz, lokalem Paket und
Verhalten in Gruppenchats finden Sie unter [Diagnoseexport](/de/gateway/diagnostics).

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie das Hochladen von Codex-Feedback
für den derzeit angehängten Thread ohne das vollständige Gateway-Diagnosepaket
wünschen.

## Compaction und Transkriptspiegel

Wenn das ausgewählte Modell das Codex-Harness verwendet, gehört die native Thread-Compaction
zum Codex app-server. OpenClaw führt für
Codex-Vorgänge keine vorbereitende Compaction durch, ersetzt die Codex-Compaction nicht durch die Compaction der Kontext-Engine und greift
nicht auf eine Zusammenfassung durch OpenClaw oder die öffentliche OpenAI-Schnittstelle zurück, wenn die native Compaction nicht
gestartet werden kann. OpenClaw verwaltet einen Transkriptspiegel für den Kanalverlauf, die Suche,
`/new`, `/reset` und einen zukünftigen Wechsel des Modells oder Harnesses.

Explizite Compaction-Anfragen wie `/compact` oder eine von einem Plugin angeforderte manuelle
Compaction-Operation starten die native Codex-Compaction mit `thread/compact/start`.
OpenClaw hält die Anfrage und die Lease des gemeinsam genutzten Clients offen, bis Codex das
zugehörige `contextCompaction`-Abschlusselement ausgibt, und meldet den Compaction-
Vorgang anschließend als abgeschlossen. Wenn dieser abschließende Vorgang das konfigurierte Compaction-
Zeitlimit überschreitet, fordert OpenClaw eine native Unterbrechung des Vorgangs an. Die Lease und die Thread-spezifische
Compaction-Sperre bleiben bestehen, bis Codex einen Endzustand meldet oder
den Unterbrechungs-RPC bestätigt. Wenn Codex dies nicht innerhalb der Karenzfrist für die Unterbrechung
bestätigt, nimmt OpenClaw die Verbindung außer Betrieb, bevor die Sperre freigegeben wird. Bei entfernten
Verbindungen wird außerdem die zugehörige Thread-Bindung gelöst, sodass spätere Vorgänge
nicht mit einem unbestätigten entfernten Vorgang überlappen können. Andere Vorgänge auf einer außer Betrieb genommenen Verbindung schlagen
fehl und können mit einem neuen Client erneut versucht werden. Das Schließen des Clients, das Abbrechen einer Anfrage oder ein
fehlgeschlagener Compaction-Vorgang gibt eine fehlgeschlagene Operation zurück. Die automatische Compaction bei Kontextdruck
ist Aufgabe von Codex; OpenClaw startet die native Compaction nur bei manuell
angeforderten Auslösern.

Wenn eine Kontext-Engine die Projektion des Codex-Thread-Bootstraps anfordert, projiziert OpenClaw
Namen und IDs von Tool-Aufrufen, Eingabestrukturen und redigierte Inhalte von Tool-Ergebnissen
in den neuen Codex-Thread. Die Rohwerte der Argumente von Tool-Aufrufen
werden nicht in diese Projektion kopiert.

Der Spiegel umfasst den Benutzer-Prompt, den endgültigen Assistententext sowie kompakte
Codex-Datensätze zu Schlussfolgerungen oder Plänen, wenn der app-server sie ausgibt. OpenClaw
zeichnet den Beginn und Endstatus der nativen Compaction auf, stellt jedoch
weder eine menschenlesbare Compaction-Zusammenfassung noch eine überprüfbare Liste der
Einträge bereit, die Codex nach der Compaction beibehalten hat.

Da Codex Eigentümer des kanonischen nativen Threads ist, schreibt `tool_result_persist`
Codex-native Tool-Ergebnisdatensätze nicht neu. Dies gilt nur, wenn OpenClaw
ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

## Medien und Zustellung

OpenClaw ist weiterhin für die Medienzustellung und die Auswahl des Medien-Providers zuständig. Bild-,
Video-, Musik-, PDF- und TTS-Funktionen sowie die Medienanalyse verwenden entsprechende Provider-/Modell-
Einstellungen wie `agents.defaults.mediaModels.image`,
`agents.defaults.mediaModels.video`, `pdfModel` und `tts`.

Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools werden weiterhin
über den regulären Zustellungspfad von OpenClaw verarbeitet; die Mediengenerierung erfordert
nicht die Legacy-Laufzeit. Wenn Codex ein natives Element zur Bildgenerierung mit einer
`savedPath` ausgibt, leitet OpenClaw genau diese Datei über den regulären Pfad für Antwortmedien
weiter, selbst wenn der Codex-Vorgang keinen Assistententext enthält.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Überwachung](/de/plugins/codex-supervision)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Plugin-Hooks](/de/plugins/hooks)
- [Plugins für Agent-Harnesses](/de/plugins/sdk-agent-harness)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Trajektorienexport](/de/tools/trajectory)
