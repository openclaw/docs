---
read_when:
    - Je hebt het ondersteuningscontract voor de Codex-harnessruntime nodig
    - Je debugt native Codex-tools, hooks, Compaction of feedbackupload
    - Je wijzigt Plugin-gedrag in OpenClaw- en Codex-harness-beurten
summary: Runtimegrenzen, hooks, tools, machtigingen en diagnostiek voor de Codex-harness
title: Runtime van het Codex-testharnas
x-i18n:
    generated_at: "2026-06-27T17:51:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Deze pagina documenteert het runtimecontract voor Codex-harnessbeurten. Voor installatie en
routering begin je met [Codex-harness](/nl/plugins/codex-harness). Voor configuratievelden
zie [Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Overzicht

Codex-modus is niet OpenClaw met daaronder een andere modelaanroep. Codex beheert meer van
de native modellus, en OpenClaw past zijn Plugin-, tool-, sessie- en
diagnostische oppervlakken rond die grens aan.

OpenClaw blijft eigenaar van kanaalroutering, sessiebestanden, zichtbare berichtbezorging,
dynamische OpenClaw-tools, goedkeuringen, mediabezorgen en een transcriptspiegel.
Codex is eigenaar van de canonieke native thread, native modellus, native toolvoortzetting
en native Compaction.

Promptroutering volgt de geselecteerde runtime, niet alleen de providertekenreeks. Een
native Codex-beurt ontvangt ontwikkelaarsinstructies van de Codex-appserver, terwijl een
expliciete OpenClaw-compatibiliteitsroute de normale OpenClaw-systeemprompt behoudt, zelfs
wanneer die Codex-achtige OpenAI-authenticatie of transport gebruikt.

Native Codex behoudt Codex-eigen basis-/modelinstructies en projectdoc-gedrag
volgens de actieve Codex-threadconfiguratie. OpenClaw start en hervat native
Codex-threads met Codex' ingebouwde persoonlijkheid uitgeschakeld, zodat
persoonlijkheidsbestanden in de werkruimte en de OpenClaw-agentidentiteit leidend blijven. Lichtgewicht
OpenClaw-runs behouden nog steeds hun bestaande onderdrukking van projectdocs. OpenClaw-
ontwikkelaarsinstructies dekken OpenClaw-runtimezaken zoals bronkanaalbezorging,
dynamische OpenClaw-tools, ACP-delegatie, adaptercontext en de
actieve profielbestanden van de agentwerkruimte. OpenClaw-Skills-catalogi en via tools gerouteerde
`MEMORY.md`-verwijzingen worden geprojecteerd als beurtgebonden ontwikkelaarsinstructies
voor samenwerking voor native Codex. Actieve `BOOTSTRAP.md`-inhoud en volledige
`MEMORY.md`-fallbackinjectie blijven invoerreferentiecontext per beurt gebruiken.

## Threadbindingen en modelwijzigingen

Wanneer een OpenClaw-sessie aan een bestaande Codex-thread is gekoppeld, stuurt de volgende beurt
het huidige geselecteerde OpenAI-model, goedkeuringsbeleid, sandbox en serviceniveau opnieuw naar de appserver.
Overschakelen van `openai/gpt-5.5` naar
`openai/gpt-5.2` behoudt de threadbinding, maar vraagt Codex om door te gaan met het
nieuw geselecteerde model.

## Zichtbare antwoorden en Heartbeats

Wanneer een directe/brongespreksbeurt via de Codex-harness loopt, vallen zichtbare antwoorden
standaard terug op automatische bezorging van de uiteindelijke assistent voor interne WebChat-oppervlakken.
Dit houdt Codex afgestemd op het prompcontract van de Pi-harness: agents antwoorden
normaal, en OpenClaw plaatst de uiteindelijke tekst in het brongesprek. Stel
`messages.visibleReplies: "message_tool"` in wanneer een direct/brongesprek
de uiteindelijke assistenttekst bewust privé moet houden, tenzij de agent
`message(action="send")` aanroept.

Codex-Heartbeatbeurten krijgen standaard ook `heartbeat_respond` in de doorzoekbare OpenClaw-
toolcatalogus, zodat de agent kan vastleggen of de wekactie stil moet blijven
of een melding moet sturen zonder die controlestroom in de uiteindelijke tekst te coderen.

Heartbeat-specifieke initiatiefrichtlijnen worden als ontwikkelaarsinstructie voor de Codex-
samenwerkingsmodus verzonden op de Heartbeatbeurt zelf. Gewone chatbeurten herstellen
Codex Default-modus in plaats van Heartbeat-filosofie mee te dragen in hun normale
runtimeprompt. Wanneer een niet-lege `HEARTBEAT.md` bestaat, wijzen de Heartbeat-
instructies voor samenwerkingsmodus Codex naar het bestand in plaats van de inhoud inline op te nemen.

## Hookgrenzen

De Codex-harness heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Pluginhooks                  | OpenClaw                 | Product-/Plugincompatibiliteit tussen OpenClaw- en Codex-harnesses. |
| Extensiemiddleware van Codex-appserver | Gebundelde OpenClaw-plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.             |
| Native Codex-hooks                    | Codex                    | Laag-niveau Codex-levenscyclus en native toolbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-`hooks.json`-bestanden om
OpenClaw-Plugingedrag te routeren. Voor de ondersteunde native tool- en machtigingsbrug
injecteert OpenClaw per-thread Codex-configuratie voor `PreToolUse`, `PostToolUse`,
`PermissionRequest` en `Stop`.

Wanneer Codex-appservergoedkeuringen zijn ingeschakeld, wat betekent dat `approvalPolicy` niet
`"never"` is, laat de standaard geinjecteerde native hookconfiguratie `PermissionRequest` weg, zodat
de appserverbeoordelaar van Codex en de goedkeuringsbrug van OpenClaw echte
escalaties na beoordeling afhandelen. Operators kunnen expliciet `permission_request` toevoegen aan
`nativeHookRelay.events` wanneer zij de compatibiliteitsrelay nodig hebben.

Andere Codex-hooks zoals `SessionStart` en `UserPromptSubmit` blijven
Codex-niveaucontroles. Ze worden in het v1-contract niet als OpenClaw-Pluginhooks blootgesteld.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, zodat OpenClaw het Plugin- en middlewaregedrag dat het bezit in de
harnessadapter uitvoert. Voor Codex-native tools bezit Codex het canonieke toolrecord.
OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking via appserver- of native hook-
callbacks beschikbaar stelt.

Codex-appserver `PreToolUse`-gebeurtenissen in rapportmodus stellen Plugin-goedkeuringsverzoeken uit
naar de bijbehorende appservergoedkeuring. Als een OpenClaw-`before_tool_call`-hook
`requireApproval` retourneert terwijl de native payload rapportgoedkeuringsmodus instelt
(`openclaw_approval_mode` is `"report"`), legt de native hookrelay de
Plugin-goedkeuringsvereiste vast en retourneert geen native beslissing. Wanneer Codex het
appservergoedkeuringsverzoek voor hetzelfde toolgebruik verzendt, opent OpenClaw de Plugin-
goedkeuringsprompt en koppelt de beslissing terug naar Codex. Codex-`PermissionRequest`-
gebeurtenissen zijn een apart goedkeuringspad en kunnen nog steeds via OpenClaw-
goedkeuringen routeren wanneer de runtime voor die brug is geconfigureerd.

Codex-appserveritemmeldingen leveren ook asynchrone `after_tool_call`-
observaties voor native toolvoltooiingen die nog niet door de native
`PostToolUse`-relay worden gedekt. Deze observaties zijn alleen voor telemetrie en Plugin-
compatibiliteit; ze kunnen de native toolaanroep niet blokkeren, vertragen of wijzigen.

Compaction- en LLM-levenscyclusprojecties komen uit Codex-appserver-
meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookopdrachten.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input` en
`llm_output`-gebeurtenissen zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen
van Codex' interne verzoek- of Compaction-payloads.

Native Codex-`hook/started`- en `hook/completed`-appservermeldingen worden
geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en debugging.
Ze roepen geen OpenClaw-Pluginhooks aan.

## V1-ondersteuningscontract

Ondersteund in Codex-runtime v1:

| Oppervlak                                     | Ondersteuning                                                                    | Waarom                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                     | Ondersteund                                                                      | De Codex app-server beheert de OpenAI-beurt, het native hervatten van threads en native voortzetting van tools.                                                                                                                                                                                                                                                                                                                                                                     |
| OpenClaw-kanaalroutering en -bezorging        | Ondersteund                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                                                                                                                                                                                                                                                                                                      |
| Dynamische OpenClaw-tools                     | Ondersteund                                                                      | Codex vraagt OpenClaw om deze tools uit te voeren, zodat OpenClaw in het uitvoeringspad blijft.                                                                                                                                                                                                                                                                                                                                                                                     |
| Prompt- en contextplugins                     | Ondersteund                                                                      | OpenClaw projecteert OpenClaw-specifieke prompt/context in de Codex-beurt, terwijl door Codex beheerde basis-, model- en geconfigureerde projectdocumentprompts in de native Codex-baan blijven. OpenClaw schakelt de ingebouwde persoonlijkheid van Codex uit voor native threads, zodat persoonlijkheidsbestanden in de agentwerkruimte leidend blijven. Native Codex-ontwikkelaarsinstructies accepteren alleen commandorichtlijnen die expliciet tot `codex_app_server` zijn beperkt; verouderde globale commandohints blijven bestaan voor niet-Codex-promptoppervlakken. |
| Levenscyclus van contextengine                | Ondersteund                                                                      | Samenstellen, opnemen en onderhoud na de beurt draaien rondom Codex-beurten. Contextengines vervangen native Codex-Compaction niet.                                                                                                                                                                                                                                                                                                                                                  |
| Dynamische toolhooks                          | Ondersteund                                                                      | `before_tool_call`, `after_tool_call` en middleware voor toolresultaten draaien rondom dynamische tools die OpenClaw beheert.                                                                                                                                                                                                                                                                                                                                                        |
| Levenscyclushooks                             | Ondersteund als adapterobservaties                                               | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden geactiveerd met eerlijke payloads voor de Codex-modus.                                                                                                                                                                                                                                                                                                                                      |
| Revisiepoort voor eindantwoord                | Ondersteund via native hookrelay                                                 | Codex `Stop` wordt doorgestuurd naar `before_agent_finalize`; `revise` vraagt Codex om nog één modelpass vóór finalisatie.                                                                                                                                                                                                                                                                                                                                                           |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via native hookrelay                                             | Codex `PreToolUse` en `PostToolUse` worden doorgestuurd voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet.                                                                                                                                                                                                                                                        |
| Native machtigingsbeleid                      | Ondersteund via goedkeuringen van Codex app-server en compatibele native hookrelay | Goedkeuringsverzoeken van Codex app-server lopen via OpenClaw na Codex-review. De native hookrelay `PermissionRequest` is opt-in voor native goedkeuringsmodi, omdat Codex deze vóór guardian-review uitzendt.                                                                                                                                                                                                                                                                       |
| Trajectvastlegging van app-server             | Ondersteund                                                                      | OpenClaw registreert het verzoek dat het naar app-server stuurde en de app-servermeldingen die het ontvangt.                                                                                                                                                                                                                                                                                                                                                                        |

Niet ondersteund in Codex-runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                       | Toekomstig pad                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutatie van native toolargumenten                   | Native pre-toolhooks van Codex kunnen blokkeren, maar OpenClaw herschrijft geen Codex-native toolargumenten.                                    | Vereist Codex-hook/schema-ondersteuning voor vervangende toolinvoer.                      |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex beheert de canonieke native threadgeschiedenis. OpenClaw beheert een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.           |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die OpenClaw beheert, niet Codex-native toolrecords.                                                    | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning. |
| Rijke native Compaction-metadata                    | OpenClaw kan native Compaction aanvragen, maar ontvangt geen stabiele lijst met behouden/verwijderde items, tokendelta, voltooiingssamenvatting of samenvattingspayload. | Vereist rijkere Codex-Compaction-events.                                                  |
| Compaction-interventie                              | OpenClaw laat plugins of contextengines native Codex-Compaction niet vetoën, herschrijven of vervangen.                                         | Voeg Codex-pre/post-Compaction-hooks toe als plugins native Compaction moeten vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-verzoeken  | OpenClaw kan app-serververzoeken en meldingen vastleggen, maar Codex-core bouwt intern het uiteindelijke OpenAI API-verzoek.                    | Vereist een Codex-modelverzoek-tracingevent of debug-API.                                 |

## Native machtigingen en MCP-elicitations

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of weigerbeslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen toestemming. Codex behandelt dit als geen
hookbeslissing en valt terug op zijn eigen guardian- of gebruikersgoedkeuringspad.

Goedkeuringsmodi van Codex app-server laten deze native hook standaard weg. Dit gedrag
geldt wanneer `permission_request` expliciet is opgenomen in
`nativeHookRelay.events` of wanneer een compatibiliteitsruntime deze installeert.

Wanneer een operator `allow-always` kiest voor een native Codex-machtigingsverzoek,
onthoudt OpenClaw die exacte provider-/sessie-/toolinvoer-/cwd-fingerprint voor een
begrensd sessievenster. De onthouden beslissing is bewust alleen een exacte match:
een gewijzigd commando, gewijzigde argumenten, toolpayload of cwd maakt een nieuwe
goedkeuring nodig.

Goedkeurings-elicitations voor Codex MCP-tools worden via de Plugin-goedkeuringsflow
van OpenClaw geleid wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex-`request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende wachtrij-follow-upbericht beantwoordt dat native
serververzoek in plaats van als extra context te worden gestuurd. Andere MCP-elicitation-
verzoeken falen gesloten.

Voor de algemene Plugin-goedkeuringsflow die deze prompts draagt, zie
[Plugin-machtigingsverzoeken](/nl/plugins/plugin-permission-requests).

## Wachtrijsturing

Sturing van actieve-runwachtrijen wordt gemapt op Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` bundelt OpenClaw chatberichten in steer-modus
voor het geconfigureerde stille venster en verstuurt ze als één `turn/steer`-
verzoek in aankomstvolgorde.

Codex-review en handmatige Compaction-beurten kunnen sturing binnen dezelfde beurt afwijzen. In dat
geval wacht OpenClaw tot de actieve uitvoering is voltooid voordat de prompt wordt gestart.
Gebruik `/queue followup` of `/queue collect` wanneer berichten standaard in de wachtrij moeten komen
in plaats van te sturen. Zie [Sturingswachtrij](/nl/concepts/queue-steering).

## Codex-feedbackupload

Wanneer `/diagnostics [note]` wordt goedgekeurd voor een sessie die de native Codex-
harness gebruikt, roept OpenClaw ook Codex app-server `feedback/upload` aan voor relevante
Codex-threads. De upload vraagt app-server om logs op te nemen voor elke vermelde thread
en voortgebrachte Codex-subthreads wanneer beschikbaar.

De upload loopt via het normale feedbackpad van Codex naar OpenAI-servers. Als Codex-
feedback in die app-server is uitgeschakeld, retourneert de opdracht de app-server-
fout. Het voltooide diagnostiekantwoord vermeldt de kanalen, OpenClaw-sessie-id's,
Codex-thread-id's en lokale `codex resume <thread-id>`-opdrachten voor de threads
die zijn verzonden.

Als je de goedkeuring weigert of negeert, drukt OpenClaw die Codex-id's niet af en
verzendt het geen Codex-feedback. De upload vervangt de lokale Gateway-
diagnostiekexport niet. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het
goedkeurings-, privacy-, lokale bundel- en groepschatgedrag.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload wilt voor de momenteel gekoppelde thread zonder de volledige Gateway-
diagnostiekbundel.

## Compaction en transcriptspiegel

Wanneer het geselecteerde model de Codex-harness gebruikt, hoort native thread-Compaction
bij Codex app-server. OpenClaw voert geen preflight-Compaction uit voor Codex-beurten,
vervangt Codex-Compaction niet door context-engine-Compaction en valt niet terug
op OpenClaw- of openbare OpenAI-samenvatting wanneer native Codex-
Compaction niet kan worden gestart. OpenClaw houdt een transcriptspiegel bij voor kanaal-
geschiedenis, zoeken, `/new`, `/reset` en toekomstige model- of harness-wisselingen.

Expliciete Compaction-aanvragen, zoals `/compact` of een door een Plugin aangevraagde handmatige
compact-bewerking, starten native Codex-Compaction met `thread/compact/start`.
OpenClaw keert terug nadat die native bewerking is gestart. Het wacht niet op
voltooiing, legt geen afzonderlijke OpenClaw-time-out op, herstart de gedeelde Codex-
app-server niet en registreert de bewerking niet als een door OpenClaw voltooide Compaction.

Wanneer een context-engine Codex-thread-bootstrap-projectie aanvraagt, projecteert OpenClaw
namen en id's van toolaanroepen, invoervormen en geredigeerde toolresultaatinhoud
in de nieuwe Codex-thread. Het kopieert geen ruwe argumentwaarden van toolaanroepen naar
die projectie.

De spiegel bevat de gebruikersprompt, de definitieve assistenttekst en lichtgewicht Codex-
redeneer- of planrecords wanneer de app-server die uitgeeft. Op dit moment registreert OpenClaw alleen
expliciete native Compaction-startsignalen wanneer het Compaction aanvraagt. Het
stelt geen voor mensen leesbare Compaction-samenvatting of controleerbare lijst beschikbaar van
welke vermeldingen Codex na Compaction heeft behouden.

Omdat Codex eigenaar is van de canonieke native thread, herschrijft `tool_result_persist`
momenteel geen Codex-native toolresultaatrecords. Het is alleen van toepassing wanneer
OpenClaw een toolresultaat naar een OpenClaw-eigen sessietranscript schrijft.

## Media en levering

OpenClaw blijft eigenaar van medialevering en selectie van mediaproviders. Afbeeldingen,
video, muziek, PDF, TTS en mediabegrip gebruiken overeenkomende provider-/modelinstellingen
zoals `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` en `messages.tts`.

Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en output van berichtentools blijven
via het normale OpenClaw-leveringspad lopen. Mediageneratie vereist de legacy runtime niet.
Wanneer Codex een native afbeeldingsgeneratie-item met een `savedPath` uitgeeft, stuurt OpenClaw
dat exacte bestand door via het normale antwoordmediapad, zelfs als de Codex-
beurt geen assistenttekst heeft.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Native Codex-plugins](/nl/plugins/codex-native-plugins)
- [Plugin-hooks](/nl/plugins/hooks)
- [Agent-harnessplugins](/nl/plugins/sdk-agent-harness)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Trajectexport](/nl/tools/trajectory)
