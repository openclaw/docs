---
read_when:
    - U hebt het ondersteuningscontract voor de Codex-harnasruntime nodig
    - Je debugt native Codex-tools, hooks, compaction of het uploaden van feedback
    - Je wijzigt het gedrag van Plugins in OpenClaw- en Codex-harnessturns
summary: Runtimegrenzen, hooks, tools, machtigingen en diagnostiek voor de Codex-harness
title: Codex-harnasruntime
x-i18n:
    generated_at: "2026-07-12T09:01:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Runtimecontract voor Codex-harnassessies. Zie voor installatie en routering
[Codex-harnas](/nl/plugins/codex-harness). Zie voor configuratievelden
[Codex-harnasreferentie](/nl/plugins/codex-harness-reference).

## Overzicht

Codex beheert de ingebouwde modellus, het ingebouwd hervatten van threads, de ingebouwde
voortzetting van tools en ingebouwde Compaction. OpenClaw beheert kanaalroutering, sessie-
bestanden, levering van zichtbare berichten, dynamische OpenClaw-tools, goedkeuringen, media-
levering en een transcriptspiegel rond die grens.

Promptroutering volgt de geselecteerde runtime, niet alleen de providertekenreeks. Een
ingebouwde Codex-sessie krijgt ontwikkelaarsinstructies van de Codex-appserver; een expliciete
OpenClaw-compatibiliteitsroute behoudt de normale OpenClaw-systeemprompt, zelfs wanneer
deze Codex-achtige OpenAI-authenticatie of transport gebruikt.

OpenClaw start en hervat ingebouwde Codex-threads met de ingebouwde persoonlijkheid
van Codex uitgeschakeld (`personality: "none"`), zodat persoonlijkheidsbestanden in de werkruimte
en de OpenClaw-agentidentiteit gezaghebbend blijven. Ingebouwde Codex behoudt verder
de door Codex beheerde basis-/modelinstructies en het laden van projectdocumentatie. Lichtgewicht
OpenClaw-uitvoeringen (bijvoorbeeld Cron) onderdrukken nog steeds het laden van projectdocumentatie.

OpenClaw-ontwikkelaarsinstructies behandelen aandachtspunten van de OpenClaw-runtime: levering via het bronkanaal,
dynamische OpenClaw-tools, ACP-delegatie, adaptercontext en de actieve
werkruimteprofielbestanden van de agent. Skills-catalogi en via tools gerouteerde
`MEMORY.md`-verwijzingen worden geprojecteerd als ontwikkelaarsinstructies voor samenwerking
die alleen voor de sessie gelden. Wanneer geheugentools niet beschikbaar zijn, vallen de actieve inhoud van `BOOTSTRAP.md`
en het volledige `MEMORY.md` in plaats daarvan terug op gewone invoercontext voor de sessie.

De meeste dynamische OpenClaw-tools gebruiken de doorzoekbare naamruimte `openclaw`. Tools
die zijn gemarkeerd met `catalogMode: "direct-only"` gebruiken `openclaw_direct`, dat Codex
rechtstreeks zichtbaar houdt voor het model als `DirectModelOnly`, in plaats van het beschikbaar te maken voor geneste
Code Mode-uitvoering.

## Threadkoppelingen en modelwijzigingen

Wanneer een OpenClaw-sessie is gekoppeld aan een bestaande Codex-thread, verzendt de volgende
sessie het momenteel geselecteerde model, goedkeuringsbeleid, de sandbox,
goedkeuringsbeoordelaar en het serviceniveau opnieuw naar de appserver. Bij overschakelen van
`openai/gpt-5.5` naar `openai/gpt-5.2` blijft de threadkoppeling behouden, maar wordt Codex gevraagd
door te gaan met het nieuw geselecteerde model.

Koppelingen onder toezicht vormen de uitzondering. De OpenClaw-modelkiezer blijft vergrendeld
en bij hervatten worden model- en provideroverschrijvingen weggelaten, zodat Codex het opgeslagen
model en de provider van de canonieke thread herstelt. Een afzonderlijk ingebouwd Codex-besturingselement kan
dat opgeslagen paar wijzigen en de eerste momentopname kan de normale
waarschuwing van Codex over een modelverschil opleveren; het buitenste OpenClaw-model en de terugvalketen vervangen
geen van beide.

## Toezicht en veilige voortzetting

Codex-toezicht is een optionele mogelijkheid van dezelfde `codex`-Plugin. Deze detecteert
ingebouwde threads via een afzonderlijke verbinding en projecteert alleen niet-gearchiveerde
sessies in de Gateway-catalogus. Zonder expliciete verbindingsinstellingen voor `appServer`
gebruikt die verbinding beheerde standaardinvoer/-uitvoer in de basismap van de gebruiker, terwijl het gewone
harnas agentspecifiek blijft. Vermeldingen en het lezen van metadata zijn passief: ze
hervatten geen thread, abonneren OpenClaw niet op de livegebeurtenissen ervan en beantwoorden
de goedkeuringen ervan niet.

Voor een opgeslagen of inactieve sessie op de Gateway-computer maakt **Doorgaan als vertakking**
een normale, modelvergrendelde chat en spiegelt deze een begrensde gebruikers- en assistent-
geschiedenis tot en met de laatste definitief opgeslagen sessie van de bron. De eerste normale
chatsessie installeert de echte goedkeuringsafhandelaars en gebruikt een tijdelijke ingebouwde vertakking
om de momentopname vast te zetten zonder model- of provideroverschrijving. Codex App Server gebruikt
de huidige ingebouwde configuratie en retourneert het geselecteerde paar; deze geeft de
normale waarschuwing als dat model verschilt van het laatst geregistreerde model van de bron.
Via dezelfde toezichtverbinding start OpenClaw de canonieke
Codex-harnasthread met `appServer` als bron onder de bijbehorende werkmap en runtimebeleid, met
exact het geretourneerde model en de geretourneerde provider voor die eerste start, injecteert de
begrensde zichtbare geschiedenis en archiveert de tijdelijke vertakking. De bron wordt nooit
hervat. De canonieke thread heeft het volledige OpenClaw-harnastooloppervlak;
redeneringen, toolaanroepen en toolresultaten uit de bron worden er niet naartoe gekloond.
Het privéverbindingsbereik blijft behouden tijdens wachtende en vastgelegde koppelingsstatussen, zodat
elke latere sessie op die verbinding blijft met ingebouwde authenticatie- en provider-
configuratie. Uitgeschakeld toezicht of afwijkingen in koppeling/verbinding zorgen voor veilig afsluiten,
in plaats van over te schakelen naar het gewone harnas in de basismap van de agent.

De oorspronkelijke CLI- of VS Code-bron blijft geschikt voor beide catalogi. De
canonieke vertakking is een ingebouwde Codex-thread, maar het brontype ervan is `appServer`;
ingebouwde clients kunnen dat brontype filteren, waardoor de weergave ervan in Codex Desktop
niet gegarandeerd is.

Actieve bronnen kunnen geen nieuwe vertakking starten of worden gearchiveerd; een bestaande chat onder toezicht
kan nog steeds worden geopend. `notLoaded` betekent dat de activiteit onbekend is, niet dat deze inactief is;
OpenClaw staat archivering van een lokale rij met `idle` of `notLoaded` alleen toe na expliciete
bevestiging dat er geen andere uitvoerder is en na een nieuwe proceslokale statusuitlezing. Codex
serialiseert threadmutaties binnen één App Server-proces, maar biedt geen
exclusieve lease voor uitvoerders of goedkeuringseigenaren over processen heen, zodat die uitlezing niet kan
bewijzen dat een ander proces de thread niet gebruikt. OpenClaw blokkeert een bekende
actieve koppelingseigenaar voor het exacte doel of een niet-gearchiveerde voortgebrachte afstammeling
die wordt geretourneerd door de gepagineerde afstammelingenquery van Codex. Opsommingsfouten, cycli en
het bereiken van veiligheidslimieten zorgen voor veilig afsluiten. Ingebouwde archivering kan nog steeds samenvallen met een nieuwe sessie
in een ander proces, waardoor de bevestiging onbekende clients en het hiaat tussen
statusuitlezing en archivering omvat. Een modelvergrendelde chat onder toezicht kan niet worden verwijderd zolang
deze de ingebouwde koppeling beschermt.

Catalogi met gekoppelde Nodes blijven in de eerste release beperkt tot metadata. De huidige
aanroepgrens van Nodes werkt met verzoek/antwoord en kan de langlopende sessie-
gebeurtenissen, goedkeuringsverzoeken of streaminguitvoer die een echte Codex-harnas-
koppeling vereist niet doorgeven. Externe opties **Doorgaan** en **Archiveren** blijven daarom niet beschikbaar, zelfs
wanneer de rij inactief is.

Zie [Codex-toezicht](/nl/plugins/codex-supervision) voor installatie door beheerders en het
zichtbare gedrag van de bedieningsinterface.

## Zichtbare antwoorden en Heartbeats

Directe-/bronchatsessies via het Codex-harnas leveren standaard automatisch het uiteindelijke
assistentantwoord voor interne WebChat-oppervlakken, conform het Pi-harnas-
contract: de agent antwoordt normaal en OpenClaw plaatst de definitieve tekst in het
brongesprek. Stel `messages.visibleReplies: "message_tool"` in om
de definitieve assistenttekst privé te houden, tenzij de agent `message(action="send")` aanroept.

Codex Heartbeat-sessies krijgen standaard `heartbeat_respond` in de doorzoekbare OpenClaw-tool-
catalogus, zodat de agent kan vastleggen of het wekken stil moet blijven
of een melding moet geven. Richtlijnen voor Heartbeat-initiatieven worden verzonden als een Codex-ontwikkelaarsinstructie in samenwerkingsmodus
die alleen voor de Heartbeat-sessie geldt; gewone chatsessies blijven
in de standaardmodus van Codex. Wanneer `HEARTBEAT.md` niet leeg is, verwijzen de Heartbeat-
instructies Codex naar het bestand in plaats van de inhoud ervan rechtstreeks op te nemen.

## Hook-grenzen

| Laag                                  | Eigenaar                  | Doel                                                                |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| OpenClaw-Pluginhooks                  | OpenClaw                  | Compatibiliteit van product/Plugin tussen OpenClaw- en Codex-harnassen. |
| Uitbreidingsmiddleware van de Codex-appserver | Gebundelde OpenClaw-Plugins | Adaptergedrag per sessie rond dynamische OpenClaw-tools.             |
| Ingebouwde Codex-hooks                | Codex                     | Codex-levenscyclus op laag niveau en ingebouwd toolbeleid vanuit de Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex-`hooks.json`-bestanden om
Plugingedrag te routeren. Voor de brug voor ingebouwde tools en machtigingen injecteert OpenClaw
Codex-configuratie per thread voor `PreToolUse`, `PostToolUse`, `PermissionRequest`
en `Stop`.

Wanneer goedkeuringen van de Codex-appserver zijn ingeschakeld (`approvalPolicy` is niet
`"never"`), laat de standaard geïnjecteerde ingebouwde hookconfiguratie `PermissionRequest`
weg, zodat de appserverbeoordelaar van Codex en de goedkeuringsbrug van OpenClaw echte
escalaties na beoordeling afhandelen. Voeg `permission_request` toe aan
`nativeHookRelay.events` om het compatibiliteitsrelais toch af te dwingen. Andere Codex-
hooks, zoals `SessionStart` en `UserPromptSubmit`, blijven besturingselementen op Codex-niveau;
ze worden in het v1-contract niet beschikbaar gemaakt als OpenClaw-Pluginhooks.

Voor dynamische OpenClaw-tools voert OpenClaw de tool uit nadat Codex om
de aanroep vraagt, zodat Plugin- en middlewaregedrag in de harnasadapter wordt uitgevoerd. Voor
ingebouwde Codex-tools beheert Codex de canonieke toolregistratie; OpenClaw kan
geselecteerde gebeurtenissen spiegelen, maar kan de ingebouwde thread niet herschrijven tenzij Codex dat
via de appserver of ingebouwde hookcallbacks beschikbaar maakt.

`PreToolUse`-gebeurtenissen in rapportagemodus van de Codex-appserver stellen Plugingoedkeuring uit tot de
overeenkomende appservergoedkeuring. Als een OpenClaw-`before_tool_call`-hook
`requireApproval` retourneert terwijl de ingebouwde payload `openclaw_approval_mode:
"report"` instelt, registreert het ingebouwde hookrelais de vereiste Plugingoedkeuring en
retourneert het geen ingebouwde beslissing. Wanneer Codex later het appservergoedkeurings-
verzoek voor hetzelfde toolgebruik verzendt, opent OpenClaw de Plugingoedkeuringsprompt en
koppelt het de beslissing terug naar Codex. Codex-`PermissionRequest`-gebeurtenissen vormen een
afzonderlijk goedkeuringspad en kunnen nog steeds via OpenClaw-goedkeuringen worden gerouteerd wanneer
dit voor die brug is geconfigureerd.

Itemmeldingen van de Codex-appserver bieden ook asynchrone `after_tool_call`-
waarnemingen voor voltooide ingebouwde tools die nog niet door het ingebouwde
`PostToolUse`-relais worden gedekt. Deze dienen alleen voor telemetrie/compatibiliteit; ze kunnen
de ingebouwde toolaanroep niet blokkeren, vertragen of wijzigen.

Projecties van Compaction en de LLM-levenscyclus zijn afkomstig van meldingen van de Codex-appserver
en de status van de OpenClaw-adapter, niet van ingebouwde Codex-hookopdrachten.
`before_compaction`, `after_compaction`, `llm_input` en `llm_output` zijn
waarnemingen op adapterniveau, geen byte-voor-byte vastleggingen van de interne
verzoek- of Compaction-payloads van Codex.

Ingebouwde Codex-meldingen `hook/started` en `hook/completed` van de appserver worden
geprojecteerd als `codex_app_server.hook`-agentgebeurtenissen voor trajectregistratie en
foutopsporing. Ze roepen geen OpenClaw-Pluginhooks aan.

## Ondersteuningscontract voor V1

Ondersteund in Codex-runtime v1:

| Oppervlak                                      | Ondersteuning                                                                    | Waarom                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                      | Ondersteund                                                                      | Codex app-server beheert de OpenAI-beurt, het native hervatten van threads en de native voortzetting van tools.                                                                                                                                                                                                                                                                                                                                                                                  |
| OpenClaw-kanaalroutering en -aflevering        | Ondersteund                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                                                                                                                                                                                                                                                                                                                   |
| Dynamische tools van OpenClaw                  | Ondersteund                                                                      | Codex vraagt OpenClaw om deze tools uit te voeren, waardoor OpenClaw deel blijft uitmaken van het uitvoeringspad.                                                                                                                                                                                                                                                                                                                                                                                |
| Plugins voor prompts en context                | Ondersteund                                                                      | OpenClaw projecteert OpenClaw-specifieke prompts/context in de Codex-beurt, terwijl door Codex beheerde basis-, model- en geconfigureerde projectdocumentprompts in het native Codex-pad blijven. OpenClaw schakelt de ingebouwde persoonlijkheid van Codex uit voor native threads, zodat persoonlijkheidsbestanden in de agentwerkruimte leidend blijven. Native Codex-ontwikkelaarsinstructies accepteren alleen opdrachtinstructies die expliciet zijn beperkt tot `codex_app_server`; verouderde globale opdrachthints blijven behouden voor niet-Codex-promptoppervlakken. |
| Levenscyclus van de contextengine              | Ondersteund                                                                      | Samenstelling, opname en onderhoud na de beurt worden rondom Codex-beurten uitgevoerd. Contextengines vervangen native Codex Compaction niet.                                                                                                                                                                                                                                                                                                                                                    |
| Hooks voor dynamische tools                    | Ondersteund                                                                      | `before_tool_call`, `after_tool_call` en middleware voor toolresultaten worden rondom dynamische tools van OpenClaw uitgevoerd.                                                                                                                                                                                                                                                                                                                                                                  |
| Levenscyclushooks                              | Ondersteund als adapterwaarnemingen                                               | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden geactiveerd met waarheidsgetrouwe payloads voor de Codex-modus.                                                                                                                                                                                                                                                                                                                                          |
| Revisiepoort voor het definitieve antwoord     | Ondersteund via native hookdoorgifte                                              | Codex `Stop` wordt doorgegeven aan `before_agent_finalize`; `revise` vraagt Codex om nog één modeldoorgang vóór de afronding.                                                                                                                                                                                                                                                                                                                                                                     |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via native hookdoorgifte                                          | Codex `PreToolUse` en `PostToolUse` worden doorgegeven voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.142.0` of nieuwer. Blokkeren wordt ondersteund; het herschrijven van argumenten niet.                                                                                                                                                                                                                                                                  |
| Native machtigingsbeleid                       | Ondersteund via goedkeuringen van Codex app-server en compatibele native hookdoorgifte | Goedkeuringsverzoeken van Codex app-server worden na beoordeling door Codex via OpenClaw geleid. De native hookdoorgifte van `PermissionRequest` is opt-in voor native goedkeuringsmodi, omdat Codex deze vóór de guardian-beoordeling uitzendt.                                                                                                                                                                                                                                                    |
| Vastlegging van app-servertraject              | Ondersteund                                                                      | OpenClaw registreert het verzoek dat het naar app-server heeft verzonden en de meldingen die het van app-server ontvangt.                                                                                                                                                                                                                                                                                                                                                                        |

Niet ondersteund in Codex-runtime v1:

| Oppervlak                                          | V1-grens                                                                                                                                          | Toekomstig pad                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Mutatie van native toolargumenten                   | Native hooks vóór toolgebruik van Codex kunnen blokkeren, maar OpenClaw herschrijft geen argumenten van Codex-native tools.                       | Vereist ondersteuning in Codex-hooks/schema's voor vervangende toolinvoer.                                 |
| Bewerkbare Codex-native transcriptgeschiedenis     | Codex beheert de canonieke native threadgeschiedenis. OpenClaw beheert een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde interne onderdelen niet wijzigen. | Voeg expliciete Codex app-server-API's toe als bewerking van native threads nodig is.                      |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert door OpenClaw beheerde transcriptschrijfacties, niet de records van Codex-native tools.                                    | Getransformeerde records kunnen worden gespiegeld, maar canoniek herschrijven vereist ondersteuning van Codex. |
| Rijke native Compaction-metadata                    | OpenClaw kan native Compaction aanvragen, maar ontvangt geen stabiele lijst met behouden/verwijderde items, tokenverschil, voltooiingssamenvatting of samenvattingspayload. | Vereist uitgebreidere Codex Compaction-gebeurtenissen.                                                     |
| Ingrijpen in Compaction                             | OpenClaw staat Plugins of contextengines niet toe native Codex Compaction te blokkeren, herschrijven of vervangen.                                | Voeg Codex-hooks vóór/na Compaction toe als Plugins native Compaction moeten kunnen blokkeren of herschrijven. |
| Byte-voor-bytevastlegging van model-API-verzoeken   | OpenClaw kan app-serververzoeken en -meldingen vastleggen, maar de Codex-kern bouwt het uiteindelijke OpenAI-API-verzoek intern op.                | Vereist een Codex-traceergebeurtenis voor modelverzoeken of een debug-API.                                 |

## Native machtigingen en MCP-uitvragen

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete beslissingen
om toe te staan of te weigeren wanneer het beleid een beslissing neemt. Geen
beslissing betekent niet dat toestemming wordt gegeven: Codex behandelt dit
als het ontbreken van een hookbeslissing en valt terug op zijn eigen guardian-
of gebruikersgoedkeuringspad.

Goedkeuringsmodi van Codex app-server laten deze native hook standaard weg.
Dit geldt tenzij `permission_request` expliciet is opgenomen in
`nativeHookRelay.events` of een compatibiliteitsruntime deze installeert.

Wanneer een beheerder `allow-always` kiest voor een native machtigingsverzoek
van Codex, onthoudt OpenClaw die exacte vingerafdruk van
provider/sessie/toolinvoer/cwd gedurende een begrensd sessievenster. De
onthouden beslissing geldt bewust alleen bij een exacte overeenkomst: een
gewijzigde opdracht, andere argumenten, een gewijzigde toolpayload of een
andere cwd leidt tot een nieuwe goedkeuring.

Goedkeuringsuitvragen voor Codex MCP-tools worden via de
Plugin-goedkeuringsstroom van OpenClaw geleid wanneer Codex
`_meta.codex_approval_kind` markeert als `"mcp_tool_call"`. Codex-prompts van
`request_user_input` worden teruggestuurd naar de oorspronkelijke chat en het
volgende in de wachtrij geplaatste vervolgbericht beantwoordt dat native
serververzoek in plaats van als extra context te worden gestuurd. Andere
MCP-uitvraagverzoeken worden standaard geweigerd.

Zie voor de algemene Plugin-goedkeuringsstroom die deze prompts verwerkt
[Plugin-machtigingsverzoeken](/nl/plugins/plugin-permission-requests).

## Wachtrijsturing

Wachtrijsturing tijdens een actieve uitvoering wordt gekoppeld aan
`turn/steer` van Codex app-server. Met de standaardinstelling
`messages.queue.mode: "steer"` bundelt OpenClaw chatberichten in de
sturingsmodus gedurende het geconfigureerde stiltevenster en verzendt deze in
volgorde van binnenkomst als één `turn/steer`-verzoek.

Codex-beoordelingen en handmatige Compaction-beurten kunnen bijsturing tijdens dezelfde beurt weigeren. In
dat geval wacht OpenClaw tot de actieve uitvoering is voltooid voordat de
prompt wordt gestart. Gebruik `/queue followup` of `/queue collect` wanneer berichten
standaard in de wachtrij moeten worden geplaatst in plaats van als bijsturing te dienen. Zie [Wachtrij voor bijsturing](/nl/concepts/queue-steering).

## Codex-feedback uploaden

Wanneer `/diagnostics [note]` voor een sessie op de ingebouwde Codex-
harness wordt goedgekeurd, roept OpenClaw ook `feedback/upload` van de Codex-app-server aan voor relevante
Codex-threads, inclusief logboeken voor elke vermelde thread en aangemaakte Codex-
subthreads, indien beschikbaar.

De upload verloopt via het normale feedbackpad van Codex naar OpenAI-servers. Als
Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht de
app-serverfout. Het voltooide antwoord van de diagnostiek vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-
opdrachten voor de verzonden threads.

Als u de goedkeuring weigert of negeert, drukt OpenClaw die Codex-id's niet af
en verzendt het geen Codex-feedback. De upload vervangt de lokale
export van Gateway-diagnostiek niet. Zie [Diagnostiek exporteren](/nl/gateway/diagnostics) voor
het gedrag rond goedkeuring, privacy, de lokale bundel en groepschats.

Gebruik `/codex diagnostics [note]` alleen wanneer u de Codex-feedbackupload
voor de momenteel gekoppelde thread wilt, zonder de volledige bundel met Gateway-diagnostiek.

## Compaction en transcriptspiegel

Wanneer het geselecteerde model de Codex-harness gebruikt, valt ingebouwde thread-Compaction
onder de Codex-app-server. OpenClaw voert geen voorafgaande Compaction uit voor
Codex-beurten, vervangt Codex-Compaction niet door Compaction van de contextengine en
valt niet terug op samenvatting door OpenClaw of de openbare OpenAI-dienst wanneer ingebouwde Compaction niet
kan worden gestart. OpenClaw houdt een transcriptspiegel bij voor kanaalgeschiedenis, zoeken,
`/new`, `/reset` en toekomstige wisselingen van model of harness.

Expliciete Compaction-verzoeken, zoals `/compact` of een door een Plugin aangevraagde handmatige
Compaction-bewerking, starten ingebouwde Codex-Compaction met `thread/compact/start`.
OpenClaw houdt het verzoek en de lease van de gedeelde client open totdat Codex
het bijbehorende voltooiingsitem `contextCompaction` uitzendt en meldt vervolgens dat de Compaction-
beurt is voltooid. Als die afsluitende beurt de geconfigureerde Compaction-
time-out overschrijdt, vraagt OpenClaw om een ingebouwde onderbreking van de beurt. De lease en de Compaction-
blokkering per thread blijven behouden totdat Codex een eindstatus meldt of
de onderbrekings-RPC bevestigt. Als Codex niet binnen de respijtperiode voor de onderbreking
bevestigt, stelt OpenClaw de verbinding buiten gebruik voordat de blokkering wordt vrijgegeven. Bij externe
verbindingen wordt ook de bijbehorende threadkoppeling losgemaakt, zodat later werk niet
kan overlappen met een onbevestigde externe beurt. Andere beurten op een buiten gebruik gestelde verbinding mislukken
en kunnen het opnieuw proberen met een nieuwe client. Het sluiten van de client, het annuleren van het verzoek of een
mislukte Compaction-beurt retourneert een mislukte bewerking. Automatische Compaction bij contextdruk
is de taak van Codex; OpenClaw start ingebouwde Compaction alleen voor handmatig
aangevraagde activeringen.

Wanneer een contextengine om een projectie voor het initialiseren van een Codex-thread vraagt, projecteert OpenClaw
namen en id's van toolaanroepen, invoerstructuren en geredigeerde inhoud van toolresultaten
naar de nieuwe Codex-thread. Het kopieert geen onbewerkte argumentwaarden van toolaanroepen
naar die projectie.

De spiegel bevat de gebruikersprompt, de definitieve assistenttekst en beknopte
Codex-redeneer- of plangegevens wanneer de app-server deze uitzendt. OpenClaw
registreert het begin en de eindstatus van de ingebouwde Compaction, maar stelt geen
voor mensen leesbare Compaction-samenvatting of controleerbare lijst beschikbaar van welke
items Codex na Compaction heeft behouden.

Omdat Codex eigenaar is van de canonieke ingebouwde thread, herschrijft `tool_result_persist`
geen Codex-eigen toolresultaatrecords. Het is alleen van toepassing wanneer OpenClaw
een toolresultaat schrijft naar een sessietranscript waarvan OpenClaw eigenaar is.

## Media en aflevering

OpenClaw blijft verantwoordelijk voor de aflevering van media en de selectie van mediaproviders. Voor het genereren van afbeeldingen,
video, muziek, PDF's, TTS en mediabegrip worden bijbehorende provider-/model-
instellingen gebruikt, zoals `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` en `messages.tts`.

Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en uitvoer van berichtentools blijven
via het normale afleverpad van OpenClaw verlopen; voor het genereren van media is
de verouderde runtime niet vereist. Wanneer Codex een ingebouwd item voor het genereren van afbeeldingen uitzendt met een
`savedPath`, stuurt OpenClaw precies dat bestand door via het normale pad voor antwoordmedia,
zelfs als de Codex-beurt geen assistenttekst bevat.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Naslaginformatie voor de Codex-harness](/nl/plugins/codex-harness-reference)
- [Codex-supervisie](/nl/plugins/codex-supervision)
- [Ingebouwde Codex-plugins](/nl/plugins/codex-native-plugins)
- [Plugin-hooks](/nl/plugins/hooks)
- [Plugins voor agent-harnesses](/nl/plugins/sdk-agent-harness)
- [Diagnostiek exporteren](/nl/gateway/diagnostics)
- [Traject exporteren](/nl/tools/trajectory)
