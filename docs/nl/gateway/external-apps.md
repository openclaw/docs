---
read_when:
    - Je bouwt een externe app, script, dashboard, CI-taak of IDE-extensie die met OpenClaw communiceert
    - U kiest tussen Gateway-RPC en de Plugin-SDK
    - U integreert met Gateway-agentuitvoeringen, sessies, gebeurtenissen, goedkeuringen, modellen of tools
    - Je koppelt een hostingcontroller aan een externe wekplanner
sidebarTitle: External apps
summary: Huidig integratiepad voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
title: Gateway-integraties voor externe apps
x-i18n:
    generated_at: "2026-07-12T08:53:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Externe apps communiceren met OpenClaw via het Gateway-protocol: WebSocket-
transport plus RPC-methoden. Gebruik dit wanneer een script, dashboard, CI-taak, IDE-
extensie of een ander proces agentuitvoeringen wil starten, gebeurtenissen wil streamen, op
resultaten wil wachten, werk wil annuleren of Gateway-resources wil inspecteren.

<Warning>
  Er is nog geen openbaar npm-clientpakket. Voeg geen namen van OpenClaw-clientpakketten
  toe als applicatieafhankelijkheden totdat de releaseopmerkingen een gepubliceerd
  pakket aankondigen en deze pagina installatie-instructies bevat.
</Warning>

<Note>
  Deze pagina is bedoeld voor code buiten het OpenClaw-proces. Plugincode die
  binnen OpenClaw wordt uitgevoerd, moet in plaats daarvan gedocumenteerde subpaden van
  `openclaw/plugin-sdk/*` gebruiken.
</Note>

## Wat er momenteel beschikbaar is

| Oppervlak                               | Status  | Gebruik dit voor                                                                                         |
| --------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| [Gateway-protocol](/nl/gateway/protocol)   | Gereed  | WebSocket-transport, verbindingshandshake, autorisatiebereiken, protocolversiebeheer en gebeurtenissen.  |
| [Gateway RPC-referentie](/nl/reference/rpc) | Gereed | Huidige Gateway-methoden voor agents, sessies, taken, modellen, tools, artefacten en goedkeuringen.       |
| [`openclaw agent`](/nl/cli/agent)          | Gereed  | Eenmalige scriptintegratie wanneer het aanroepen van de CLI via de shell voldoende is.                   |
| [`openclaw message`](/nl/cli/message)      | Gereed  | Berichten of kanaalacties vanuit scripts verzenden.                                                      |

Er wordt intern gewerkt aan een toekomstig clientbibliotheekpakket, maar dit is
nog geen openbaar installatieoppervlak. Beschouw het als een implementatiedetail
in de previewfase totdat een release een gepubliceerd pakket met versiebeheer aankondigt.

## Aanbevolen aanpak

1. Voer een Gateway uit of zoek er een.
2. Maak verbinding via het [Gateway-protocol](/nl/gateway/protocol).
3. Roep gedocumenteerde RPC-methoden aan uit de [Gateway RPC-referentie](/nl/reference/rpc).
4. Zet de OpenClaw-versie waartegen u test vast.
5. Controleer de RPC-referentie opnieuw wanneer u OpenClaw bijwerkt.

Begin voor agentuitvoeringen met de RPC `agent` en combineer deze met `agent.wait`
voor een eindresultaat. Gebruik voor duurzame gespreksstatus de methoden
`sessions.*`. Abonneer u voor UI-integraties op Gateway-gebeurtenissen en geef
alleen de gebeurtenisfamilies weer die uw app begrijpt.

## Coöperatieve opschorting door de host

Hostingcontrollers die een actief proces bevriezen of er een momentopname van
maken, kunnen de hostneutrale opschortingshandshake gebruiken:

1. Sta geen nieuwe externe toegang meer toe die door de host wordt beheerd.
2. Roep `gateway.suspend.prepare` aan met een stabiele, unieke `requestId`.
3. Als het antwoord `busy` is, laat u het proces actief en probeert u het later opnieuw.
4. Als het `ready` is, slaat u de geretourneerde `suspensionId` op en bevriest u
   het proces of maakt u er een momentopname van vóór `expiresAtMs`.
5. Roep na het hervatten, of als de opschorting wordt afgebroken,
   `gateway.suspend.resume` aan met die `suspensionId` via de bestaande
   WebSocket of het Admin HTTP-besturingspad.

Een voorbereide Gateway weigert nieuwe WebSocket-handshakes. Een
WebSocket-controller moet zijn geauthenticeerde verbinding tijdens de
hostbewerking openhouden. Als dit niet kan worden gegarandeerd, schakelt u vóór
de voorbereiding de [Admin HTTP RPC-plugin](/nl/plugins/admin-http-rpc) in en
gebruikt u deze. Als het besturingspad verloren gaat, wacht u tot de lease van
twee minuten is verlopen voordat u opnieuw verbinding maakt; na het verlopen
wordt toegang automatisch weer toegestaan.

Het RPC-contract is:

- `gateway.suspend.prepare` — `operator.admin`; parameters
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parameters
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parameters
  `{ "suspensionId": "id-from-prepare" }`

Voorloop- en volgspaties worden uit ID's verwijderd. ID's moeten een teken
bevatten dat geen witruimte is en zijn beperkt tot 128 tekens. Een bezet
voorbereidingsresultaat heeft `status: "busy"`, `reason`, `retryAfterMs`,
`activeCount` en `blockers`. Een gereed resultaat heeft deze vorm:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Status retourneert `{"status":"running"}` of een gereed resultaat met
`expiresAtMs`. Hervatten retourneert
`{"ok":true,"status":"running","resumed":true}`; als dit na een geslaagde
hervatting wordt herhaald, wordt `resumed: false` geretourneerd.

Een conflicterend aanvraag-ID of een tijdelijke fout bij het hervatten van de
planner retourneert de opnieuw te proberen fout `UNAVAILABLE` met
`retryAfterMs`. Tijdens het herstel van de planner retourneren voorbereiding,
status en hervatten allemaal die fout, blijft de Gateway niet-gereed en
fail-closed en mag de host deze niet bevriezen of er een momentopname van maken.
OpenClaw probeert de planner automatisch opnieuw te starten en staat toegang pas
weer toe nadat het herstel is geslaagd. Een niet-overeenkomend hervattings-ID
retourneert `INVALID_REQUEST`. Voorbereiding deelt het schrijfbudget van het
besturingsvlak van de Gateway van drie pogingen per minuut; respecteer de
geretourneerde wachttijd. WebSocket-clients worden per apparaat en IP-adres
gegroepeerd. Admin HTTP-controllers worden per herleid IP-adres van de client
gegroepeerd, zodat controllers achter één proxy een budget kunnen delen.

Voorbereiding weigert alleen: OpenClaw sluit nieuwe toegang voor
hoofd-, sessie- en opdrachtbewerkingen, pauzeert automatische Cron-tikken en
inspecteert werk synchroon. Als er iets actief is, hervat het de planner en
staat het toegang weer toe voordat `busy` wordt geretourneerd; het onderbreekt
of voltooit dat werk niet geforceerd. Een gereedlease duurt twee minuten.
`prepare` herhalen met dezelfde `requestId` verlengt deze; bij het verlopen
wordt de planner hervat voordat toegang weer wordt toegestaan.
Een herstartsignaal dat tijdens een gereedlease verschuldigd wordt, wacht totdat
de lease wordt hervat; door een lopende herstart retourneert de voorbereiding
`busy`.

Wanneer de status gereed is, blijft `/healthz` actief en retourneert `/readyz`
`503`. Lokale of geauthenticeerde gereedheidsantwoorden bevatten
`gateway-draining`; niet-geauthenticeerde externe controles ontvangen alleen
`{ "ready": false }`. De HTTP-statuscontrole, opschortingsmethoden op bestaande
WebSocket-verbindingen en een reeds ingeschakelde Admin HTTP RPC-route blijven
beschikbaar. Andere RPC's retourneren de opnieuw te proberen fout
`UNAVAILABLE`. Ingebouwde HTTP-routes voor gebruikerswerk en gewone HTTP-routes
van plugins, waaronder OpenAI-compatibele API's, tool- en sessiebewerkingen,
Node-bewaking en geconfigureerde hooks, retourneren `503` met
`error.code: "gateway_unavailable"`. Nieuwe WebSocket-upgrades die eigendom zijn
van plugins retourneren eveneens `503`; dit betreft het eigendom van de upgrade,
niet werk dat later via een bestaande pluginsocket wordt uitgevoerd.

Deze handshake bewaart binnenkomende berichten niet, stopt
kanaaltransporten van derden niet en bestuurt het hostingplatform niet. De host
moet vóór de voorbereiding de toegang afschermen en blijft verantwoordelijk
voor activeren, momentopnamen/bevriezen en stoppen. `activeCount` is het
geaggregeerde aantal gevolgde werkzaamheden, terwijl `blockers` de niet-nulle
categorieaantallen en begrensde taakdetails bevat. Dit is geen algemene barrière
voor volledige procesrust. Een `background-exec`-blokkering is uitsluitend
geaggregeerd: opdrachttekst, proces-ID's, uitvoer en sessie- of
bereik-ID's worden nooit via het protocol overgedragen. Kanaalstatus, onderhoud,
cachevernieuwing, bestaande WebSocket-sessies van plugins en niet-geregistreerd
achtergrondwerk dat eigendom is van plugins kunnen actief blijven.
Het hostingplatform moet de volledige procesboom en het bestandssysteem
consistent bevriezen of er een momentopname van maken; met dit eerste contract
kan niet worden aangetoond dat niet-geregistreerd werk niet actief is.

<Tip>
  Houd voor activeringsplanning door de host het op OpenClaw gerichte gedeelte
  in een Plugin binnen het proces en projecteer idempotente volledige
  momentopnamen naar de externe hostadapter. De hostingcontroller mag de
  Plugin SDK niet importeren of de Cron-status reconstrueren uit
  gebeurtenisdelta's. Zie [Veilige externe Cron-
  projectie](/nl/plugins/hooks#safe-external-cron-projection).
</Tip>

## Appcode versus plugincode

Gebruik Gateway RPC wanneer code buiten OpenClaw wordt uitgevoerd:

- Node-scripts die agentuitvoeringen starten of observeren
- CI-taken die een Gateway aanroepen
- dashboards en beheerpanelen
- IDE-extensies
- externe bruggen die geen kanaalplugins hoeven te worden
- integratietests met gesimuleerde of echte Gateway-transporten

Gebruik de Plugin SDK wanneer code binnen OpenClaw wordt uitgevoerd:

- providerplugins
- kanaalplugins
- tool- of levenscyclushooks
- agentharnasplugins
- vertrouwde runtimehelpers

Externe apps mogen `openclaw/plugin-sdk/*` niet importeren; die subpaden zijn
bedoeld voor plugins die door OpenClaw worden geladen.

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)
- [Gateway RPC-referentie](/nl/reference/rpc)
- [CLI-agentopdracht](/nl/cli/agent)
- [CLI-berichtopdracht](/nl/cli/message)
- [Agentlus](/nl/concepts/agent-loop)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Sessies](/nl/concepts/session)
- [Achtergrondtaken](/nl/automation/tasks)
- [ACP-agents](/nl/tools/acp-agents)
- [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview)
