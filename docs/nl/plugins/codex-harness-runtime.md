---
read_when:
    - Je hebt het runtime-ondersteuningscontract van de Codex-harness nodig
    - Je debugt native Codex-tools, hooks, Compaction of feedbackupload
    - Je wijzigt Plugin-gedrag in OpenClaw- en Codex-harnassessies
summary: Runtimegrenzen, hooks, tools, machtigingen en diagnostiek voor de Codex-harness
title: Codex-harnessruntime
x-i18n:
    generated_at: "2026-07-04T20:38:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Deze pagina documenteert het runtimecontract voor Codex-harnasbeurten. Voor setup en
routing begint u met [Codex-harnas](/nl/plugins/codex-harness). Voor configuratievelden,
zie [Codex-harnasreferentie](/nl/plugins/codex-harness-reference).

## Overzicht

Codex-modus is niet OpenClaw met daaronder een andere modelaanroep. Codex beheert meer van
de native modellus, en OpenClaw past zijn Plugin-, tool-, sessie- en
diagnostische oppervlakken rond die grens aan.

OpenClaw beheert nog steeds kanaalroutering, sessiebestanden, zichtbare berichtaflevering,
dynamische OpenClaw-tools, goedkeuringen, medialevering en een transcriptspiegel.
Codex beheert de canonieke native thread, native modellus, native tool-
voortzetting en native Compaction.

Promptroutering volgt de geselecteerde runtime, niet alleen de providerstring. Een
native Codex-beurt ontvangt Codex app-server-ontwikkelaarsinstructies, terwijl een
expliciete OpenClaw-compatibiliteitsroute de normale OpenClaw-systeemprompt behoudt, zelfs
wanneer die Codex-achtige OpenAI-authenticatie of transport gebruikt.

Native Codex behoudt Codex-beheerde basis-/modelinstructies en projectdocumentgedrag
volgens de actieve Codex-threadconfiguratie. OpenClaw start en hervat native
Codex-threads met Codex' ingebouwde persoonlijkheid uitgeschakeld, zodat werkruimte-
persoonlijkheidsbestanden en OpenClaw-agentidentiteit gezaghebbend blijven. Lichtgewicht
OpenClaw-runs behouden nog steeds hun bestaande projectdocumentonderdrukking. OpenClaw-
ontwikkelaarsinstructies behandelen OpenClaw-runtimeaspecten zoals bronkanaal-
aflevering, dynamische OpenClaw-tools, ACP-delegatie, adaptercontext en de
actieve agentwerkruimteprofielbestanden. OpenClaw-Skills-catalogi en tool-gerouteerde
`MEMORY.md`-verwijzingen worden geprojecteerd als beurtgebonden ontwikkelaarsinstructies
voor samenwerking voor native Codex. Actieve `BOOTSTRAP.md`-inhoud en volledige
`MEMORY.md`-fallbackinjectie gebruiken nog steeds referentiecontext voor beurtinvoer.

## Threadbindingen en modelwijzigingen

Wanneer een OpenClaw-sessie aan een bestaande Codex-thread is gekoppeld, stuurt de volgende beurt
het momenteel geselecteerde OpenAI-model, goedkeuringsbeleid, de sandbox en servicelaag
opnieuw naar app-server. Overschakelen van `openai/gpt-5.5` naar
`openai/gpt-5.2` behoudt de threadbinding maar vraagt Codex om door te gaan met het
nieuw geselecteerde model.

## Zichtbare antwoorden en heartbeats

Wanneer een directe/bronschatbeurt via het Codex-harnas loopt, worden zichtbare antwoorden
standaard automatisch als definitieve assistentaflevering geleverd voor interne WebChat-oppervlakken.
Dit houdt Codex in lijn met het promptcontract van het Pi-harnas: agents antwoorden
normaal, en OpenClaw plaatst de definitieve tekst in het brongesprek. Stel
`messages.visibleReplies: "message_tool"` in wanneer een directe/bronschat
opzettelijk definitieve assistenttekst privé moet houden, tenzij de agent
`message(action="send")` aanroept.

Codex-Heartbeat-beurten krijgen standaard ook `heartbeat_respond` in de doorzoekbare OpenClaw-
toolcatalogus, zodat de agent kan vastleggen of het wekken stil moet blijven
of moet melden zonder die controlestroom in definitieve tekst te coderen.

Heartbeat-specifieke initiatiefrichtlijnen worden als een Codex-ontwikkelaarsinstructie in
samenwerkingsmodus op de Heartbeat-beurt zelf verzonden. Gewone chatbeurten herstellen
Codex Default-modus in plaats van Heartbeat-filosofie in hun normale
runtimeprompt mee te dragen. Wanneer een niet-lege `HEARTBEAT.md` bestaat, verwijzen de Heartbeat-
instructies voor samenwerkingsmodus Codex naar het bestand in plaats van de
inhoud inline op te nemen.

## Hookgrenzen

Het Codex-harnas heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-hooks                 | OpenClaw                 | Product-/Plugin-compatibiliteit tussen OpenClaw- en Codex-harnassen. |
| Codex app-server-extensiemiddleware   | Gebundelde OpenClaw-Plugins | Adaptergedrag per beurt rond dynamische OpenClaw-tools.             |
| Native Codex-hooks                    | Codex                    | Laag-niveau Codex-levenscyclus en native toolbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-`hooks.json`-bestanden om
OpenClaw-Plugin-gedrag te routeren. Voor de ondersteunde native tool- en toestemmingsbrug
injecteert OpenClaw Codex-configuratie per thread voor `PreToolUse`, `PostToolUse`,
`PermissionRequest` en `Stop`.

Wanneer Codex app-server-goedkeuringen zijn ingeschakeld, wat betekent dat `approvalPolicy` niet
`"never"` is, laat de standaard geïnjecteerde native hookconfiguratie `PermissionRequest` weg, zodat
Codex' app-server-reviewer en OpenClaw's goedkeuringsbrug echte
escalaties na review afhandelen. Operators kunnen expliciet `permission_request` toevoegen aan
`nativeHookRelay.events` wanneer zij de compatibiliteitsrelay nodig hebben.

Andere Codex-hooks zoals `SessionStart` en `UserPromptSubmit` blijven
Codex-niveau controles. Ze worden in het v1-contract niet als OpenClaw-Plugin-hooks
blootgesteld.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, zodat OpenClaw het Plugin- en middlewaregedrag dat het beheert in de
harnasadapter activeert. Voor Codex-native tools beheert Codex het canonieke toolrecord.
OpenClaw kan geselecteerde gebeurtenissen spiegelen, maar kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking via app-server of native hook-
callbacks blootstelt.

Codex app-server report-modus-`PreToolUse`-gebeurtenissen stellen Plugin-goedkeuringsverzoeken uit
naar de bijbehorende app-server-goedkeuring. Als een OpenClaw-`before_tool_call`-hook
`requireApproval` retourneert terwijl de native payload report-goedkeuringsmodus instelt
(`openclaw_approval_mode` is `"report"`), registreert de native hookrelay de
Plugin-goedkeuringsvereiste en retourneert geen native beslissing. Wanneer Codex het
app-server-goedkeuringsverzoek voor hetzelfde toolgebruik verzendt, opent OpenClaw de Plugin-
goedkeuringsprompt en koppelt de beslissing terug naar Codex. Codex-`PermissionRequest`-
gebeurtenissen zijn een afzonderlijk goedkeuringspad en kunnen nog steeds via OpenClaw-
goedkeuringen routeren wanneer de runtime voor die brug is geconfigureerd.

Codex app-server-itemmeldingen leveren ook asynchrone `after_tool_call`-
observaties voor native toolvoltooiingen die nog niet door de
native `PostToolUse`-relay worden gedekt. Deze observaties zijn alleen voor telemetrie en Plugin-
compatibiliteit; ze kunnen de native toolaanroep niet blokkeren, vertragen of muteren.

Compaction- en LLM-levenscyclusprojecties komen uit Codex app-server-
meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookcommando's.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input` en
`llm_output`-gebeurtenissen zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen
van Codex' interne verzoek- of Compaction-payloads.

Codex native `hook/started`- en `hook/completed`-app-servermeldingen worden
geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor traject en debugging.
Ze roepen geen OpenClaw-Plugin-hooks aan.

## V1-ondersteuningscontract

Ondersteund in Codex-runtime v1:

| Oppervlak                                     | Ondersteuning                                                                  | Waarom                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                     | Ondersteund                                                                      | De Codex app-server beheert de OpenAI-turn, native threadhervatting en native toolvoortzetting.                                                                                                                                                                                                                                                                                                                                                                                       |
| OpenClaw-kanaalroutering en -levering         | Ondersteund                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamische OpenClaw-tools                     | Ondersteund                                                                      | Codex vraagt OpenClaw om deze tools uit te voeren, dus OpenClaw blijft in het uitvoeringspad.                                                                                                                                                                                                                                                                                                                                                                                          |
| Prompt- en contextplugins                     | Ondersteund                                                                      | OpenClaw projecteert OpenClaw-specifieke prompt/context in de Codex-turn, terwijl door Codex beheerde basis-, model- en geconfigureerde projectdoc-prompts in de native Codex-baan blijven. OpenClaw schakelt de ingebouwde persoonlijkheid van Codex uit voor native threads, zodat agentwerkruimte-persoonlijkheidsbestanden leidend blijven. Native Codex-ontwikkelaarsinstructies accepteren alleen commandorichtlijnen die expliciet zijn beperkt tot `codex_app_server`; verouderde globale commandohints blijven bestaan voor niet-Codex-promptoppervlakken. |
| Levenscyclus van contextengine                | Ondersteund                                                                      | Samenstellen, opnemen en onderhoud na de turn draaien rondom Codex-turns. Contextengines vervangen native Codex-Compaction niet.                                                                                                                                                                                                                                                                                                                                                       |
| Dynamische toolhooks                          | Ondersteund                                                                      | `before_tool_call`, `after_tool_call` en toolresultaatmiddleware draaien rondom door OpenClaw beheerde dynamische tools.                                                                                                                                                                                                                                                                                                                                                                |
| Levenscyclushooks                             | Ondersteund als adapterobservaties                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden geactiveerd met eerlijke payloads in Codex-modus.                                                                                                                                                                                                                                                                                                                                              |
| Revisiegate voor eindantwoord                 | Ondersteund via native hookrelay                                                  | Codex `Stop` wordt doorgegeven aan `before_agent_finalize`; `revise` vraagt Codex om nog één modelpass vóór afronding.                                                                                                                                                                                                                                                                                                                                                                  |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via native hookrelay                                              | Codex `PreToolUse` en `PostToolUse` worden doorgegeven voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet.                                                                                                                                                                                                                                                            |
| Native machtigingsbeleid                      | Ondersteund via Codex app-server-goedkeuringen en compatibiliteits-native-hookrelay | Goedkeuringsverzoeken van Codex app-server lopen via OpenClaw na Codex-review. De native hookrelay `PermissionRequest` is opt-in voor native goedkeuringsmodi omdat Codex deze vóór guardian-review uitzendt.                                                                                                                                                                                                                                                                            |
| Trajectvastlegging van app-server             | Ondersteund                                                                      | OpenClaw registreert het verzoek dat het naar app-server stuurde en de app-servermeldingen die het ontvangt.                                                                                                                                                                                                                                                                                                                                                                           |

Niet ondersteund in Codex runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                       | Toekomstig pad                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Native toolargumentmutatie                          | Codex native pre-toolhooks kunnen blokkeren, maar OpenClaw herschrijft geen Codex-native toolargumenten.                                       | Vereist Codex-hook/schemaondersteuning voor vervangende toolinput.                        |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex beheert de canonieke native threadgeschiedenis. OpenClaw beheert een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.           |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert door OpenClaw beheerde transcriptwrites, niet Codex-native toolrecords.                                                  | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning. |
| Rijke native Compaction-metadata                    | OpenClaw kan native Compaction aanvragen, maar ontvangt geen stabiele lijst met behouden/verwijderde items, tokendelta, voltooiingssamenvatting of samenvattingspayload. | Vereist rijkere Codex-Compaction-events.                                                  |
| Compaction-interventie                              | OpenClaw laat plugins of contextengines native Codex-Compaction niet vetoën, herschrijven of vervangen.                                       | Voeg Codex pre/post-Compaction-hooks toe als plugins native Compaction moeten vetoën of herschrijven. |
| Byte-voor-byte vastlegging van model-API-verzoek    | OpenClaw kan app-serververzoeken en meldingen vastleggen, maar Codex core bouwt het uiteindelijke OpenAI API-verzoek intern.                   | Vereist een Codex-modelverzoektracingevent of debug-API.                                  |

## Native machtigingen en MCP-elicitations

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of weigeren-beslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen toestemming. Codex behandelt het als geen
hookbeslissing en valt terug op zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex app-server-goedkeuringsmodi laten deze native hook standaard weg. Dit gedrag
geldt wanneer `permission_request` expliciet is opgenomen in
`nativeHookRelay.events` of wanneer een compatibiliteitsruntime deze installeert.

Wanneer een operator `allow-always` kiest voor een Codex native machtigingsverzoek,
onthoudt OpenClaw die exacte provider-/sessie-/toolinput-/cwd-fingerprint voor een
begrensd sessievenster. De onthouden beslissing is bewust alleen exact-match:
een gewijzigd commando, gewijzigde argumenten, toolpayload of cwd maakt een nieuwe
goedkeuring aan.

Codex MCP-toolgoedkeuringselicitations worden gerouteerd via de plugin-goedkeuringsflow
van OpenClaw wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex `request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende wachtrijvervolgbericht beantwoordt dat native
serververzoek in plaats van te worden gestuurd als extra context. Andere MCP-elicitation-
verzoeken falen gesloten.

Zie voor de algemene plugin-goedkeuringsflow die deze prompts draagt
[Plugin-machtigingsverzoeken](/nl/plugins/plugin-permission-requests).

## Wachtrijsturing

Active-run-wachtrijsturing wordt toegewezen aan Codex app-server `turn/steer`. Met de
standaard `messages.queue.mode: "steer"` batcht OpenClaw chatberichten in steer-modus
voor het geconfigureerde stille venster en verzendt ze als één `turn/steer`-
verzoek in aankomstvolgorde.

Codex-review en handmatige Compaction-beurten kunnen sturing in dezelfde beurt weigeren. In dat
geval wacht OpenClaw tot de actieve run is voltooid voordat de prompt wordt gestart.
Gebruik `/queue followup` of `/queue collect` wanneer berichten standaard in de wachtrij moeten komen
in plaats van te sturen. Zie [Sturingswachtrij](/nl/concepts/queue-steering).

## Codex-feedbackupload

Wanneer `/diagnostics [note]` wordt goedgekeurd voor een sessie die het native Codex-
harnas gebruikt, roept OpenClaw ook Codex app-server `feedback/upload` aan voor relevante
Codex-threads. De upload vraagt app-server om logs op te nemen voor elke vermelde thread
en voortgebrachte Codex-subthreads wanneer beschikbaar.

De upload loopt via het normale feedbackpad van Codex naar OpenAI-servers. Als Codex-
feedback is uitgeschakeld in die app-server, retourneert de opdracht de app-server-
fout. Het voltooide diagnostiekantwoord vermeldt de kanalen, OpenClaw-sessie-id's,
Codex-thread-id's en lokale `codex resume <thread-id>`-opdrachten voor de threads
die zijn verzonden.

Als je de goedkeuring weigert of negeert, drukt OpenClaw die Codex-id's niet af en
verstuurt het geen Codex-feedback. De upload vervangt de lokale Gateway-
diagnostiekexport niet. Zie [Diagnostiekexport](/nl/gateway/diagnostics) voor het
goedkeurings-, privacy-, lokale bundel- en groepschatgedrag.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de Codex-
feedbackupload wilt voor de momenteel gekoppelde thread zonder de volledige Gateway-
diagnostiekbundel.

## Compaction en transcriptspiegel

Wanneer het geselecteerde model het Codex-harnas gebruikt, hoort native thread-Compaction
bij Codex app-server. OpenClaw voert geen preflight-Compaction uit voor Codex-beurten,
vervangt Codex-Compaction niet door context-engine-Compaction en valt niet
terug op OpenClaw- of openbare OpenAI-samenvatting wanneer native Codex-
Compaction niet kan worden gestart. OpenClaw houdt een transcriptspiegel bij voor kanaalgeschiedenis,
zoeken, `/new`, `/reset` en toekomstig wisselen van model of harnas.

Expliciete Compaction-verzoeken, zoals `/compact` of een door een Plugin aangevraagde handmatige
compact-bewerking, starten native Codex-Compaction met `thread/compact/start`.
OpenClaw houdt het verzoek en de shared-client-lease open totdat Codex het
bijbehorende voltooiingsitem `contextCompaction` uitzendt en meldt de Compaction-beurt
daarna als voltooid. Als die terminale beurt de geconfigureerde Compaction-time-out overschrijdt,
vraagt OpenClaw een native beurtinterrupt aan. De lease en per-thread Compaction-
fence blijven vastgehouden totdat Codex de terminale status meldt of de interrupt-RPC bevestigt.
Als Codex niet binnen de interrupt-gratieperiode bevestigt, trekt OpenClaw
de verbinding terug voordat de fence wordt vrijgegeven. Externe verbindingen ontkoppelen ook de
bijbehorende threadbinding zodat later werk geen onbevestigde externe
beurt kan overlappen. Andere beurten op een teruggetrokken verbinding falen en kunnen opnieuw proberen met een nieuwe client.
Clientsluiting, aanvraagannulering of een mislukte Compaction-beurt retourneert een
mislukte bewerking.

Wanneer een context-engine Codex-thread-bootstrapprojectie aanvraagt, projecteert OpenClaw
tool-call-namen en -id's, invoervormen en geredigeerde tool-resultaatinhoud
naar de nieuwe Codex-thread. Het kopieert geen ruwe argumentwaarden van tool-calls naar
die projectie.

De spiegel bevat de gebruikersprompt, definitieve assistenttekst en lichte Codex-
redeneer- of planrecords wanneer app-server die uitzendt. OpenClaw registreert de
start en terminale status van native Compaction, maar stelt geen
menselijk leesbare Compaction-samenvatting of controleerbare lijst beschikbaar van welke items Codex
na Compaction heeft behouden.

Omdat Codex eigenaar is van de canonieke native thread, herschrijft `tool_result_persist` momenteel
geen Codex-native tool-resultaatrecords. Het is alleen van toepassing wanneer
OpenClaw een tool-resultaat schrijft in een sessietranscript waarvan OpenClaw eigenaar is.

## Media en levering

OpenClaw blijft eigenaar van medialevering en selectie van mediaproviders. Begrip van afbeeldingen,
video, muziek, PDF, TTS en media gebruikt overeenkomende provider-/modelinstellingen
zoals `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` en `messages.tts`.

Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en uitvoer van berichtentools blijven
via het normale OpenClaw-leveringspad lopen. Mediageneratie vereist de legacy runtime niet.
Wanneer Codex een native afbeeldingsgeneratie-item uitzendt met een `savedPath`, stuurt OpenClaw
dat exacte bestand door via het normale antwoord-mediapad, zelfs als de Codex-
beurt geen assistenttekst heeft.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Referentie voor Codex-harnas](/nl/plugins/codex-harness-reference)
- [Native Codex-Plugins](/nl/plugins/codex-native-plugins)
- [Plugin-hooks](/nl/plugins/hooks)
- [Agent-harnas-Plugins](/nl/plugins/sdk-agent-harness)
- [Diagnostiekexport](/nl/gateway/diagnostics)
- [Trajectexport](/nl/tools/trajectory)
