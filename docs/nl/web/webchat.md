---
read_when:
    - WebChat-toegang debuggen of configureren
summary: Statische loopbackhost voor WebChat en gebruik van Gateway-WS voor de chatinterface
title: WebChat
x-i18n:
    generated_at: "2026-07-16T16:33:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Status: de macOS/iOS SwiftUI-chatinterface communiceert rechtstreeks met de Gateway-WebSocket. Geen ingesloten browser, geen lokale statische server.

## Wat het is

- Een native chatinterface voor de Gateway.
- Gebruikt dezelfde sessies en routeringsregels als andere kanalen.
- Deterministische routering: antwoorden gaan altijd terug naar WebChat.
- De geschiedenis wordt altijd opgehaald bij de Gateway (zonder lokale bestandsbewaking). Als de Gateway niet bereikbaar is, is WebChat alleen-lezen.

## Snel aan de slag

1. Start de Gateway.
2. Open de WebChat-interface (macOS/iOS-app) of het chattabblad van de Control UI.
3. Zorg dat een geldig authenticatiepad voor de Gateway is geconfigureerd (standaard een gedeeld geheim, zelfs op loopback).

## Hoe het werkt

- De interface maakt verbinding met de Gateway-WebSocket en gebruikt de RPC-methoden `chat.history`, `chat.send`, `chat.inject` en `chat.message.get`.
- `chat.history` is voor stabiliteit begrensd: de Gateway kan lange tekstvelden afkappen, omvangrijke metagegevens weglaten en te grote vermeldingen vervangen door `[chat.history omitted: message too large]`. API-clients kunnen per verzoek een `maxChars` verzenden om de standaardlimiet voor één aanroep te overschrijven.
- Wanneer een zichtbaar assistentbericht in `chat.history` is afgekapt, kan de Control UI een zijlezer openen en de volledige, voor weergave genormaliseerde vermelding op aanvraag ophalen via `chat.message.get`, zonder de standaardpayload van de geschiedenis te vergroten. `chat.message.get` gebruikt dezelfde transcriptvertakking en weergaveregels als `chat.history`, maar richt zich via `messageId` op één vermelding en retourneert een eerlijke reden voor onbeschikbaarheid wanneer de volledige inhoud niet meer kan worden geretourneerd.
- `chat.history` volgt de actieve transcriptvertakking voor sessiebestanden waaraan alleen wordt toegevoegd, zodat verlaten herschrijfvertakkingen en vervangen kopieën van prompts niet in WebChat worden weergegeven.
- Compaction-vermeldingen worden weergegeven als een scheidingslijn 'Gecompacteerde geschiedenis' die uitlegt dat het gecompacteerde transcript als controlepunt wordt bewaard, met een actie om sessiecontrolepunten te openen (vertakken of herstellen, wanneer de machtigingen dit toestaan).
- De Control UI onthoudt de onderliggende Gateway-`sessionId` die door `chat.history` wordt geretourneerd en neemt deze op in volgende aanroepen van `chat.send`, zodat bij opnieuw verbinden en vernieuwen van de pagina hetzelfde opgeslagen gesprek wordt voortgezet, tenzij de gebruiker een sessie start of opnieuw instelt.
- `chat.send` gebruikt een idempotentiesleutel (de Control UI gebruikt de uitvoerings-id); de Gateway dedupliceert herhaalde verzoeken die dezelfde sleutel hergebruiken, zodat opnieuw uitgevoerde of dubbele inzendingen die voor dezelfde sessie/hetzelfde bericht/dezelfde bijlagen worden verwerkt, geen tweede uitvoering aanmaken.
- Opstartbestanden van de werkruimte en wachtende `BOOTSTRAP.md`-instructies worden aangeleverd via de sectie `# Project Context` van de systeemprompt van de agent en niet naar het WebChat-gebruikersbericht gekopieerd. Als de bootstrapinhoud wordt afgekapt, krijgt de systeemprompt in plaats daarvan een korte 'Melding over bootstrapcontext'; gedetailleerde aantallen en configuratieopties blijven op diagnostische oppervlakken.
- Weergavenormalisatie in `chat.history` verwijdert: OpenClaw-context die alleen tijdens runtime wordt gebruikt, wrappers rond inkomende enveloppen, inline tags voor afleveringsinstructies zoals `[[reply_to_current]]`, `[[reply_to:<id>]]` en `[[audio_as_voice]]`, XML-payloads in platte tekst voor toolaanroepen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, inclusief afgekapt blokken) en gelekte ASCII-/volledige-breedtemodelbesturingstokens. Assistentvermeldingen waarvan de volledige zichtbare tekst alleen uit het stille token `NO_REPLY` bestaat (hoofdletterongevoelig), worden weggelaten.
- Als redenering gemarkeerde antwoordpayloads (`isReasoning: true`) worden uitgesloten van assistentinhoud in WebChat, tekst bij het opnieuw afspelen van transcripten en audio-inhoudsblokken, zodat payloads die alleen denkstappen bevatten niet als zichtbare assistentberichten of afspeelbare audio verschijnen.
- `chat.inject` voegt rechtstreeks een assistentnotitie toe aan het transcript en zendt deze naar de interface (zonder agentuitvoering).
- Bij afgebroken uitvoeringen kan gedeeltelijke assistentuitvoer zichtbaar blijven in de interface. De Gateway bewaart die gedeeltelijke tekst in de transcriptgeschiedenis wanneer er gebufferde uitvoer bestaat en markeert de vermelding met afbreekmetagegevens.

### Transcript- en afleveringsmodel

WebChat heeft twee afzonderlijke gegevenspaden:

- De SQLite-transcriptrijen vormen het duurzame model-/runtimetranscript. Voor normale agentuitvoeringen bewaart de ingesloten OpenClaw-runtime modelzichtbare `user`-, `assistant`- en `toolResult`-berichten via de sessietoegangslaag. WebChat schrijft geen willekeurige afleverings-, status- of hulptekst naar dat transcript.
- Gateway-`ReplyPayload`-gebeurtenissen vormen de live afleveringsprojectie: genormaliseerd voor weergave in WebChat/kanalen, blokstreaming, instructietags, media-insluiting, TTS-/audiovlaggen en terugvalgedrag van de interface. Ze vormen zelf niet het canonieke sessielogboek.
- Testomgevingen die zichtbare antwoorden via `tools.message` vereisen, gebruiken WebChat nog steeds als interne bronantwoordbestemming voor de huidige uitvoering. Een `message.send` zonder doel uit die actieve WebChat-uitvoering wordt in dezelfde chat geprojecteerd en naar het sessietranscript gespiegeld; WebChat wordt geen herbruikbaar uitgaand kanaal en neemt nooit `lastChannel` over.
- WebChat voegt alleen assistentvermeldingen aan het transcript toe wanneer de Gateway eigenaar is van een weergegeven bericht buiten een normale ingesloten agentbeurt: `chat.inject`, antwoorden op niet-agentopdrachten, afgebroken gedeeltelijke uitvoer en door WebChat beheerde aanvullende mediatranscripten.
- Als tijdens een uitvoering live assistenttekst verschijnt maar na het opnieuw laden van de geschiedenis verdwijnt, controleer dan in deze volgorde: of het SQLite-transcript de assistenttekst bevat, of de weergaveprojectie van `chat.history` deze heeft verwijderd en vervolgens of het samenvoegen van de optimistische staart in de Control UI de lokale afleveringsstatus door de bewaarde momentopname heeft vervangen.

Definitieve antwoorden van normale agentuitvoeringen horen duurzaam te zijn, omdat de ingesloten runtime de assistent-`message_end` schrijft. Elke terugval die een afgeleverde definitieve payload naar het transcript spiegelt, moet eerst voorkomen dat een assistentbeurt wordt gedupliceerd die de ingesloten runtime al heeft geschreven.

## Toolpaneel voor agenten in de Control UI

- Het toolpaneel `/agents` van de Control UI heeft een weergave 'Nu beschikbaar' die wordt aangestuurd door `tools.effective(sessionKey=...)`: een door de server afgeleide alleen-lezenprojectie van de toolinventaris van de huidige sessie, inclusief kern-, Plugin-, kanaaleigen en al ontdekte MCP-servertools.
- Een afzonderlijke weergave voor configuratiebewerking (aangestuurd door `tools.catalog`) omvat profielen, overschrijvingen per agent en catalogussemantiek.
- Beschikbaarheid tijdens runtime is sessiegebonden. Wisselen tussen sessies van dezelfde agent kan de lijst 'Nu beschikbaar' wijzigen. Als geconfigureerde MCP-servers sinds de laatste detectie niet zijn verbonden of gewijzigd, toont het paneel een melding in plaats van stilzwijgend MCP-transporten vanuit het leespad te starten.
- De configuratie-editor impliceert geen beschikbaarheid tijdens runtime; effectieve toegang volgt nog steeds de beleidsprioriteit (`allow`/`deny`, met overschrijvingen per agent en provider/kanaal).

## Gebruik op afstand

- De externe modus tunnelt de Gateway-WebSocket via SSH/Tailscale.
- Je hoeft geen afzonderlijke WebChat-server uit te voeren.

## Configuratiereferentie (WebChat)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

WebChat heeft geen blijvend opgeslagen configuratiesectie. De Gateway gebruikt de ingebouwde weergavelimiet `chat.history`; API-clients kunnen per verzoek `maxChars` verzenden om deze voor één aanroep te overschrijven. De verouderde configuratie `channels.webchat` en `gateway.webchat` is buiten gebruik gesteld; voer `openclaw doctor --fix` uit om deze te verwijderen.

Gerelateerde globale opties:

- `gateway.port`, `gateway.bind`: WebSocket-host/-poort.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  WebSocket-authenticatie met een gedeeld geheim.
- `gateway.auth.allowTailscale`: het chattabblad van de Control UI in de browser kan Tailscale
  Serve-identiteitsheaders gebruiken wanneer dit is ingeschakeld.
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxyauthenticatie voor browserclients achter een identiteitsbewuste **niet-loopback** proxybron (zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: externe Gateway-bestemming.
- `session.*`: sessieopslag en standaardwaarden voor de hoofdsleutel.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Dashboard](/nl/web/dashboard)
