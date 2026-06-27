---
read_when:
    - WebChat-toegang debuggen of configureren
summary: Statische host voor Loopback WebChat en Gateway WS-gebruik voor chat-UI
title: WebChat
x-i18n:
    generated_at: "2026-06-27T18:32:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Status: de macOS/iOS SwiftUI-chat-UI praat rechtstreeks met de Gateway WebSocket.

## Wat het is

- Een native chat-UI voor de Gateway (geen ingesloten browser en geen lokale statische server).
- Gebruikt dezelfde sessies en routeringsregels als andere kanalen.
- Deterministische routering: antwoorden gaan altijd terug naar WebChat.

## Snel starten

1. Start de Gateway.
2. Open de WebChat-UI (macOS/iOS-app) of het chattabblad van de Control UI.
3. Zorg dat er een geldig Gateway-authenticatiepad is geconfigureerd (standaard gedeeld geheim,
   zelfs op loopback).

## Hoe het werkt (gedrag)

- De UI maakt verbinding met de Gateway WebSocket en gebruikt `chat.history`, `chat.send` en `chat.inject`.
- `chat.history` is begrensd voor stabiliteit: Gateway kan lange tekstvelden inkorten, zware metadata weglaten en te grote vermeldingen vervangen door `[chat.history omitted: message too large]`.
- Wanneer een zichtbaar assistentbericht in `chat.history` is ingekort, kan Control UI een zijlezer openen en de volledige, voor weergave genormaliseerde vermelding op aanvraag ophalen via `chat.message.get` zonder de standaardgeschiedenispayload te vergroten.
- `chat.history` volgt de actieve transcriptvertakking voor moderne append-only sessiebestanden, zodat verlaten herschrijvingsvertakkingen en vervangen promptkopieën niet in WebChat worden weergegeven.
- Compaction-vermeldingen worden weergegeven als een expliciete scheidingslijn voor gecomprimeerde geschiedenis. De scheidingslijn legt uit dat het gecomprimeerde transcript als checkpoint wordt bewaard en linkt naar de checkpointbediening van Sessions, waar operators vanuit die gecomprimeerde weergave kunnen vertakken of herstellen wanneer hun machtigingen dat toestaan.
- Control UI onthoudt de onderliggende Gateway `sessionId` die door `chat.history` wordt geretourneerd en neemt die op in vervolgaanroepen naar `chat.send`, zodat herverbindingen en paginavernieuwingen hetzelfde opgeslagen gesprek voortzetten tenzij de gebruiker een sessie start of reset.
- Control UI voegt dubbele lopende inzendingen voor dezelfde sessie, hetzelfde bericht en dezelfde bijlagen samen voordat een nieuwe `chat.send`-run-id wordt gegenereerd; de Gateway dedupliceert nog steeds herhaalde aanvragen die dezelfde idempotentiesleutel hergebruiken.
- Werkruimte-opstartbestanden en wachtende `BOOTSTRAP.md`-instructies worden geleverd via de Project Context van de systeem-prompt van de agent, niet gekopieerd naar het WebChat-gebruikersbericht. Bootstrap-inkorting voegt alleen een beknopte herstelmelding in de systeem-prompt toe; gedetailleerde aantallen en configuratieknoppen blijven op diagnostische oppervlakken.
- `chat.history` is ook voor weergave genormaliseerd: runtime-only OpenClaw-context,
  inkomende envelope-wrappers, inline delivery directive-tags
  zoals `[[reply_to_*]]` en `[[audio_as_voice]]`, plattetekst-tool-call-XML-
  payloads (inclusief `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` en ingekorte tool-call-blokken), en
  gelekte ASCII-/full-width-modelbesturingstokens worden uit zichtbare tekst verwijderd,
  en assistentvermeldingen waarvan de volledige zichtbare tekst alleen het exacte stille
  token `NO_REPLY` / `no_reply` is, worden weggelaten.
- Antwoordpayloads met reasoning-vlag (`isReasoning: true`) worden uitgesloten van WebChat-assistentinhoud, transcript-herhalingstekst en audio-inhoudsblokken, zodat payloads die alleen denkstappen bevatten niet verschijnen als zichtbare assistentberichten of afspeelbare audio.
- `chat.inject` voegt een assistentnotitie rechtstreeks toe aan het transcript en zendt die uit naar de UI (geen agent-run).
- Afgebroken runs kunnen gedeeltelijke assistentuitvoer zichtbaar houden in de UI.
- Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat, en markeert die vermeldingen met afbreekmetadata.
- Geschiedenis wordt altijd opgehaald uit de Gateway (geen lokale bestandsbewaking).
- Als de Gateway onbereikbaar is, is WebChat alleen-lezen.

### Transcript- en aflevermodel

WebChat heeft twee afzonderlijke datapaden:

- Het sessie-JSONL-bestand is het duurzame model-/runtime-transcript. Voor normale agent-runs bewaart de ingesloten OpenClaw-runtime modelzichtbare `user`-, `assistant`- en `toolResult`-berichten via zijn sessiebeheerder. WebChat schrijft geen willekeurige afleverings-, status- of helpertekst naar dat transcript.
- Gateway `ReplyPayload`-gebeurtenissen zijn de live afleveringsprojectie. Ze kunnen worden genormaliseerd voor WebChat-/kanaalweergave, blokstreaming, directive-tags, media-insluiting, TTS-/audiovlaggen en UI-fallbackgedrag. Ze zijn zelf niet het canonieke sessielogboek.
- Harnesses die zichtbare antwoorden via `tools.message` vereisen, gebruiken WebChat nog steeds als interne bron-antwoord-sink voor de huidige run. Een doelloze `message.send` vanuit die actieve WebChat-run wordt naar dezelfde chat geprojecteerd en gespiegeld naar het sessietranscript; WebChat wordt geen herbruikbaar uitgaand kanaal en erft nooit `lastChannel`.
- WebChat injecteert assistenttranscriptvermeldingen alleen wanneer de Gateway eigenaar is van een weergegeven bericht buiten een normale ingesloten agent-beurt: `chat.inject`, niet-agent-commandantwoorden, afgebroken gedeeltelijke uitvoer en door WebChat beheerde media-transcriptsupplementen.
- `chat.history` leest het opgeslagen sessietranscript en past WebChat-weergaveprojectie toe. Als live assistenttekst tijdens een run verschijnt maar verdwijnt na het herladen van de geschiedenis, controleer dan eerst of de ruwe JSONL de assistenttekst bevat, daarna of de `chat.history`-projectie die heeft verwijderd, en daarna of de optimistische tail-merge van de Control UI de lokale afleveringsstatus heeft vervangen door de opgeslagen snapshot.
- `chat.message.get` gebruikt dezelfde transcriptvertakking en weergaveprojectieregels als `chat.history`, inclusief actieve-agent-scoping, maar richt zich op één transcriptvermelding via `messageId` en retourneert een eerlijke reden voor onbeschikbaarheid wanneer de volledige inhoud niet meer kan worden geretourneerd.

Normale eindantwoorden van agent-runs moeten duurzaam zijn omdat de ingesloten runtime de assistent-`message_end` schrijft. Elke fallback die een afgeleverde eindpayload naar het transcript spiegelt, moet eerst voorkomen dat een assistentbeurt wordt gedupliceerd die de ingesloten runtime al heeft geschreven.

## Control UI-agenttools-paneel

- Het Tools-paneel van Control UI `/agents` heeft twee afzonderlijke weergaven:
  - **Nu Beschikbaar** gebruikt `tools.effective(sessionKey=...)` en toont een door de server afgeleide
    alleen-lezen projectie van de huidige sessie-inventaris, inclusief core-, plugin-, kanaaleigen
    en al ontdekte MCP-servertools.
  - **Toolconfiguratie** gebruikt `tools.catalog` en blijft gericht op profielen, overrides en
    catalogussemantiek.
- Runtimebeschikbaarheid is sessiegebonden. Wisselen tussen sessies op dezelfde agent kan de
  lijst **Nu Beschikbaar** wijzigen. Als geconfigureerde MCP-servers nog niet zijn verbonden of
  sinds de laatste ontdekking zijn gewijzigd, toont het paneel een melding in plaats van stilzwijgend MCP-transports
  vanuit het leespad te starten.
- De configuratie-editor impliceert geen runtimebeschikbaarheid; effectieve toegang volgt nog steeds beleidsprioriteit
  (`allow`/`deny`, per-agent- en provider-/kanaaloverrides).

## Gebruik op afstand

- Externe modus tunnelt de Gateway WebSocket via SSH/Tailscale.
- Je hoeft geen aparte WebChat-server te draaien.

## Configuratiereferentie (WebChat)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

WebChat heeft geen blijvende configuratiesectie. Gateway gebruikt de ingebouwde weergavelimiet van `chat.history`; API-clients kunnen per aanvraag `maxChars` verzenden om die voor één `chat.history`-aanroep te overschrijven. Verouderde `channels.webchat`- en `gateway.webchat`-configuratie is buiten gebruik gesteld; voer `openclaw doctor --fix` uit om die te verwijderen.

Gerelateerde globale opties:

- `gateway.port`, `gateway.bind`: WebSocket-host/-poort.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  authenticatie met gedeeld geheim voor WebSocket.
- `gateway.auth.allowTailscale`: chattabblad van browser-Control UI kan Tailscale
  Serve-identiteitsheaders gebruiken wanneer ingeschakeld.
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy-authenticatie voor browserclients achter een identiteitsbewuste **niet-loopback**-proxybron (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: extern Gateway-doel.
- `session.*`: sessieopslag en standaardwaarden voor hoofdsleutel.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Dashboard](/nl/web/dashboard)
