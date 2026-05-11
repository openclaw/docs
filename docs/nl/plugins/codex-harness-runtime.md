---
read_when:
    - Je hebt het runtime-ondersteuningscontract van de Codex-harness nodig
    - Je debugt native Codex-tools, hooks, Compaction of feedbackupload
    - Je wijzigt Plugin-gedrag in PI- en Codex-harness-beurten
summary: Runtimegrenzen, aanhaakpunten, hulpmiddelen, machtigingen en diagnostiek voor het Codex-harnas
title: Uitvoeringsomgeving van het Codex-harnas
x-i18n:
    generated_at: "2026-05-11T20:38:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Deze pagina documenteert het runtimecontract voor Codex-harnessbeurten. Begin voor installatie en
routering met [Codex-harness](/nl/plugins/codex-harness). Zie voor configuratievelden
[Codex-harnessreferentie](/nl/plugins/codex-harness-reference).

## Overzicht

Codex-modus is geen PI met daaronder een andere modelaanroep. Codex beheert meer van
de native modellus, en OpenClaw past zijn Plugin-, tool-, sessie- en
diagnostische oppervlakken aan rond die grens.

OpenClaw beheert nog steeds kanaalroutering, sessiebestanden, bezorging van zichtbare berichten,
OpenClaw dynamische tools, goedkeuringen, mediabezorging en een transcriptspiegel.
Codex beheert de canonieke native thread, native modellus, native tool-
voortzetting en native Compaction.

## Threadbindingen en modelwijzigingen

Wanneer een OpenClaw-sessie aan een bestaande Codex-thread is gekoppeld, verzendt de volgende beurt
het momenteel geselecteerde OpenAI-model, goedkeuringsbeleid, sandbox en serviceniveau
opnieuw naar app-server. Overschakelen van `openai/gpt-5.5` naar
`openai/gpt-5.2` behoudt de threadbinding, maar vraagt Codex om door te gaan met het
nieuw geselecteerde model.

## Zichtbare antwoorden en Heartbeats

Wanneer een bronchatbeurt via de Codex-harness loopt, gebruiken zichtbare antwoorden standaard
de OpenClaw `message`-tool als de implementatie `messages.visibleReplies` niet expliciet heeft
geconfigureerd. De agent kan zijn Codex-beurt nog steeds privé afronden;
hij plaatst alleen iets in het kanaal wanneer hij `message(action="send")` aanroept. Stel
`messages.visibleReplies: "automatic"` in om definitieve antwoorden in directe chats op het
oude automatische bezorgingspad te houden.

Codex-Heartbeatbeurten krijgen standaard ook `heartbeat_respond` in de doorzoekbare OpenClaw
toolcatalogus, zodat de agent kan vastleggen of de wake stil moet blijven
of een melding moet geven zonder die besturingsstroom in definitieve tekst te coderen.

Heartbeat-specifieke initiatiefrichtlijnen worden verzonden als een Codex-ontwikkelaarsinstructie
voor samenwerkingsmodus op de Heartbeatbeurt zelf. Gewone chatbeurten herstellen
in plaats daarvan de Codex Default-modus, zonder Heartbeat-filosofie mee te nemen in hun normale
runtimeprompt.

## Hookgrenzen

De Codex-harness heeft drie hooklagen:

| Laag                                  | Eigenaar                 | Doel                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin-hooks                 | OpenClaw                 | Product-/Plugin-compatibiliteit tussen PI- en Codex-harnesses.      |
| Codex app-server-extensiemiddleware   | Gebundelde OpenClaw Plugins | Adaptergedrag per beurt rond OpenClaw dynamische tools.          |
| Codex native hooks                    | Codex                    | Low-level Codex-levenscyclus en native toolbeleid uit Codex-configuratie. |

OpenClaw gebruikt geen project- of globale Codex `hooks.json`-bestanden om
OpenClaw Plugin-gedrag te routeren. Voor de ondersteunde native tool- en machtigingsbrug
injecteert OpenClaw Codex-configuratie per thread voor `PreToolUse`, `PostToolUse`,
`PermissionRequest` en `Stop`.

Wanneer Codex app-server-goedkeuringen zijn ingeschakeld, wat betekent dat `approvalPolicy` niet
`"never"` is, laat de standaard geinjecteerde native hookconfiguratie `PermissionRequest` weg, zodat
de Codex app-server-reviewer en de OpenClaw-goedkeuringsbrug echte
escalaties na review afhandelen. Operators kunnen expliciet `permission_request` toevoegen aan
`nativeHookRelay.events` wanneer ze de compatibiliteitsrelay nodig hebben.

Andere Codex-hooks zoals `SessionStart` en `UserPromptSubmit` blijven
Codex-niveaucontroles. Ze worden in het v1-contract niet blootgesteld als OpenClaw Plugin-hooks.

Voor OpenClaw dynamische tools voert OpenClaw de tool uit nadat Codex om de
aanroep vraagt, dus OpenClaw activeert het Plugin- en middlewaregedrag dat het beheert in de
harnessadapter. Voor Codex-native tools beheert Codex het canonieke toolrecord.
OpenClaw kan geselecteerde events spiegelen, maar het kan de native Codex-
thread niet herschrijven tenzij Codex die bewerking via app-server of native hook-
callbacks blootstelt.

Codex app-server-itemmeldingen leveren ook asynchrone `after_tool_call`-
observaties voor native toolvoltooiingen die nog niet door de native
`PostToolUse`-relay worden gedekt. Deze observaties zijn alleen bedoeld voor telemetrie en Plugin-
compatibiliteit; ze kunnen de native toolaanroep niet blokkeren, vertragen of muteren.

Compaction- en LLM-levenscyclusprojecties komen uit Codex app-server-
meldingen en OpenClaw-adapterstatus, niet uit native Codex-hookopdrachten.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input` en
`llm_output`-events zijn observaties op adapterniveau, geen byte-voor-byte vastleggingen
van Codex' interne aanvraag- of Compaction-payloads.

Codex native `hook/started`- en `hook/completed` app-server-meldingen worden
geprojecteerd als `codex_app_server.hook`-agentevents voor traject en debugging.
Ze roepen geen OpenClaw Plugin-hooks aan.

## V1-ondersteuningscontract

Ondersteund in Codex-runtime v1:

| Oppervlak                                     | Ondersteuning                                                                    | Waarom                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-modellus via Codex                     | Ondersteund                                                                      | Codex app-server beheert de OpenAI-beurt, native threadhervatting en native toolvoortzetting.                                                                                                             |
| OpenClaw-kanaalroutering en -bezorging        | Ondersteund                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage en andere kanalen blijven buiten de modelruntime.                                                                                                            |
| OpenClaw dynamische tools                     | Ondersteund                                                                      | Codex vraagt OpenClaw om deze tools uit te voeren, zodat OpenClaw in het uitvoeringspad blijft.                                                                                                           |
| Prompt- en context-Plugins                    | Ondersteund                                                                      | OpenClaw bouwt promptoverlays en projecteert context in de Codex-beurt voordat de thread wordt gestart of hervat.                                                                                         |
| Levenscyclus van contextengine                | Ondersteund                                                                      | Assemblage, ingestie, onderhoud na de beurt en coordinatie van contextengine-Compaction worden uitgevoerd voor Codex-beurten.                                                                              |
| Dynamische tool-hooks                         | Ondersteund                                                                      | `before_tool_call`, `after_tool_call` en middleware voor toolresultaten draaien rond dynamische tools die OpenClaw beheert.                                                                                |
| Levenscyclushooks                             | Ondersteund als adapterobservaties                                               | `llm_input`, `llm_output`, `agent_end`, `before_compaction` en `after_compaction` worden geactiveerd met eerlijke Codex-moduspayloads.                                                                     |
| Revisiepoort voor definitief antwoord         | Ondersteund via native hookrelay                                                 | Codex `Stop` wordt doorgegeven aan `before_agent_finalize`; `revise` vraagt Codex om nog een modelpassage voor afronding.                                                                                 |
| Native shell, patch en MCP blokkeren of observeren | Ondersteund via native hookrelay                                             | Codex `PreToolUse` en `PostToolUse` worden doorgegeven voor vastgelegde native tooloppervlakken, inclusief MCP-payloads op Codex app-server `0.125.0` of nieuwer. Blokkeren wordt ondersteund; argumenten herschrijven niet. |
| Native machtigingsbeleid                      | Ondersteund via Codex app-server-goedkeuringen en compatibele native hookrelay   | Codex app-server-goedkeuringsverzoeken lopen na Codex-review via OpenClaw. De native hookrelay `PermissionRequest` is opt-in voor native goedkeuringsmodi omdat Codex deze voor guardian-review uitzendt. |
| Trajectvastlegging van app-server             | Ondersteund                                                                      | OpenClaw registreert de aanvraag die het naar app-server heeft verzonden en de app-server-meldingen die het ontvangt.                                                                                      |

Niet ondersteund in Codex-runtime v1:

| Oppervlak                                           | V1-grens                                                                                                                                       | Toekomstig pad                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutatie van native toolargumenten                   | Codex native pre-tool-hooks kunnen blokkeren, maar OpenClaw herschrijft geen Codex-native toolargumenten.                                      | Vereist Codex-hook-/schemaondersteuning voor vervangende toolinvoer.                     |
| Bewerkbare Codex-native transcriptgeschiedenis      | Codex beheert de canonieke native threadgeschiedenis. OpenClaw beheert een spiegel en kan toekomstige context projecteren, maar mag niet-ondersteunde internals niet muteren. | Voeg expliciete Codex app-server-API's toe als native threadchirurgie nodig is.           |
| `tool_result_persist` voor Codex-native toolrecords | Die hook transformeert transcriptwrites die OpenClaw beheert, geen Codex-native toolrecords.                                                   | Kan getransformeerde records spiegelen, maar canoniek herschrijven vereist Codex-ondersteuning. |
| Rijke native Compaction-metadata                    | OpenClaw observeert start en voltooiing van Compaction, maar ontvangt geen stabiele bewaarde/verwijderde lijst, token-delta of samenvattingspayload. | Vereist rijkere Codex-Compaction-events.                                                  |
| Compaction-interventie                             | Huidige OpenClaw Compaction-hooks zijn in Codex-modus op meldingsniveau.                                                                        | Voeg Codex pre-/post-Compaction-hooks toe als Plugins native Compaction moeten kunnen vetoen of herschrijven. |
| Byte-voor-byte vastlegging van model-API-aanvraag   | OpenClaw kan app-server-aanvragen en meldingen vastleggen, maar Codex core bouwt de uiteindelijke OpenAI API-aanvraag intern.                  | Vereist een Codex model-request tracing-event of debug-API.                               |

## Native machtigingen en MCP-elicitations

Voor `PermissionRequest` retourneert OpenClaw alleen expliciete toestaan- of weigeren-beslissingen
wanneer beleid beslist. Een resultaat zonder beslissing is geen toestemming. Codex behandelt dit als geen
hookbeslissing en valt terug naar zijn eigen guardian- of gebruikersgoedkeuringspad.

Codex-app-servergoedkeuringsmodi laten deze native hook standaard weg. Dit gedrag
is van toepassing wanneer `permission_request` expliciet is opgenomen in
`nativeHookRelay.events` of wanneer een compatibiliteitsruntime deze installeert.

Wanneer een operator `allow-always` kiest voor een native Codex-toestemmingsverzoek,
onthoudt OpenClaw die exacte vingerafdruk van provider/sessie/toolinvoer/cwd voor een
begrensd sessievenster. De onthouden beslissing is bewust alleen voor exacte
overeenkomsten: een gewijzigde opdracht, argumenten, toolpayload of cwd maakt een
nieuwe goedkeuring aan.

Codex MCP-toolgoedkeuringselicitations worden via OpenClaw's Plugin-goedkeuringsflow
geleid wanneer Codex `_meta.codex_approval_kind` markeert als
`"mcp_tool_call"`. Codex-`request_user_input`-prompts worden teruggestuurd naar de
oorspronkelijke chat, en het volgende in de wachtrij geplaatste vervolgbericht
beantwoordt dat native serververzoek in plaats van als extra context te worden
gestuurd. Andere MCP-elicitationverzoeken falen gesloten.

## Wachtrijbesturing

Wachtrijbesturing voor actieve runs wordt gekoppeld aan Codex-app-server
`turn/steer`. Met de standaard `messages.queue.mode: "steer"` bundelt OpenClaw
chatberichten in de wachtrij gedurende het geconfigureerde stille venster en
stuurt deze als één `turn/steer`-verzoek in volgorde van aankomst. De legacy
`queue`-modus stuurt afzonderlijke `turn/steer`-verzoeken.

Codex-review- en handmatige Compaction-beurten kunnen besturing binnen dezelfde
beurt weigeren. In dat geval gebruikt OpenClaw de vervolgwachtrij wanneer de
geselecteerde modus fallback toestaat. Zie [Wachtrijbesturing](/nl/concepts/queue-steering).

## Codex-feedbackupload

Wanneer `/diagnostics [note]` wordt goedgekeurd voor een sessie die de native
Codex-harness gebruikt, roept OpenClaw ook Codex-app-server `feedback/upload`
aan voor relevante Codex-threads. De upload vraagt de app-server om logs op te
nemen voor elke vermelde thread en, indien beschikbaar, gespawnde Codex-subthreads.

De upload verloopt via Codex's normale feedbackpad naar OpenAI-servers. Als
Codex-feedback in die app-server is uitgeschakeld, retourneert de opdracht de
app-serverfout. Het voltooide diagnostics-antwoord vermeldt de kanalen,
OpenClaw-sessie-id's, Codex-thread-id's en lokale `codex resume <thread-id>`-opdrachten
voor de threads die zijn verzonden.

Als je de goedkeuring weigert of negeert, drukt OpenClaw die Codex-id's niet af
en verzendt het geen Codex-feedback. De upload vervangt de lokale
Gateway-diagnosticsexport niet. Zie [Diagnosticsexport](/nl/gateway/diagnostics) voor
het goedkeurings-, privacy-, lokale bundel- en groepschatgedrag.

Gebruik `/codex diagnostics [note]` alleen wanneer je specifiek de
Codex-feedbackupload voor de momenteel gekoppelde thread wilt zonder de volledige
Gateway-diagnosticsbundel.

## Compaction en transcriptspiegel

Wanneer het geselecteerde model de Codex-harness gebruikt, wordt native
thread-Compaction gedelegeerd aan de Codex-app-server. OpenClaw houdt een
transcriptspiegel bij voor kanaalgeschiedenis, zoeken, `/new`, `/reset` en
toekomstig wisselen van model of harness.

De spiegel bevat de gebruikersprompt, de definitieve assistenttekst en lichte
Codex-redeneer- of planrecords wanneer de app-server deze uitzendt. Op dit moment
registreert OpenClaw alleen native signalen voor start en voltooiing van Compaction.
Het stelt nog geen menselijk leesbare Compaction-samenvatting of controleerbare
lijst beschikbaar van welke items Codex na Compaction heeft bewaard.

Omdat Codex eigenaar is van de canonieke native thread, herschrijft
`tool_result_persist` momenteel geen Codex-native toolresultaatrecords. Het is
alleen van toepassing wanneer OpenClaw een toolresultaat naar een
OpenClaw-eigen sessietranscript schrijft.

## Media en aflevering

OpenClaw blijft eigenaar van media-aflevering en selectie van mediaproviders.
Afbeeldingen, video, muziek, PDF, TTS en mediabegrip gebruiken overeenkomende
provider-/modelinstellingen zoals `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` en `messages.tts`.

Tekst, afbeeldingen, video, muziek, TTS, goedkeuringen en output van berichtentools
blijven via het normale OpenClaw-afleverpad lopen. Mediageneratie vereist geen PI.
Wanneer Codex een native afbeeldingsgeneratie-item met een `savedPath` uitzendt,
stuurt OpenClaw dat exacte bestand door via het normale antwoordmediapad, zelfs
als de Codex-beurt geen assistenttekst heeft.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Native Codex-Plugins](/nl/plugins/codex-native-plugins)
- [Plugin-hooks](/nl/plugins/hooks)
- [Agentharness-Plugins](/nl/plugins/sdk-agent-harness)
- [Diagnosticsexport](/nl/gateway/diagnostics)
- [Trajectexport](/nl/tools/trajectory)
