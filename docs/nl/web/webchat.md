---
read_when:
    - WebChat-toegang debuggen of configureren
summary: Statische host voor Loopback WebChat en Gateway-WS-gebruik voor de chat-UI
title: Webchat
x-i18n:
    generated_at: "2026-05-04T07:10:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Status: de macOS/iOS SwiftUI-chat-UI praat rechtstreeks met de Gateway WebSocket.

## Wat het is

- Een native chat-UI voor de Gateway (geen ingesloten browser en geen lokale statische server).
- Gebruikt dezelfde sessies en routeringsregels als andere kanalen.
- Deterministische routering: antwoorden gaan altijd terug naar WebChat.

## Snelstart

1. Start de Gateway.
2. Open de WebChat-UI (macOS/iOS-app) of het chattabblad van de Control UI.
3. Zorg dat er een geldig authenticatiepad voor de Gateway is geconfigureerd (standaard shared-secret,
   zelfs op loopback).

## Hoe het werkt (gedrag)

- De UI maakt verbinding met de Gateway WebSocket en gebruikt `chat.history`, `chat.send` en `chat.inject`.
- `chat.history` is begrensd voor stabiliteit: Gateway kan lange tekstvelden inkorten, zware metadata weglaten en te grote vermeldingen vervangen door `[chat.history omitted: message too large]`.
- `chat.history` volgt de actieve transcriptvertakking voor moderne append-only sessiebestanden, zodat verlaten herschrijftakken en vervangen promptkopieën niet in WebChat worden weergegeven.
- Compaction-vermeldingen worden weergegeven als een expliciete scheidingslijn voor gecompacteerde geschiedenis. De scheidingslijn legt uit dat eerdere beurten in een checkpoint worden bewaard en linkt naar de checkpointbediening van Sessies, waar operators de weergave van vóór de Compaction kunnen vertakken of herstellen wanneer hun machtigingen dit toestaan.
- Control UI onthoudt de onderliggende Gateway-`sessionId` die door `chat.history` wordt teruggegeven en neemt deze op in volgende `chat.send`-aanroepen, zodat opnieuw verbinden en pagina's vernieuwen hetzelfde opgeslagen gesprek voortzetten, tenzij de gebruiker een sessie start of reset.
- Control UI voegt dubbele lopende verzendingen voor dezelfde sessie, hetzelfde bericht en dezelfde bijlagen samen voordat een nieuwe `chat.send`-run-id wordt gegenereerd; de Gateway dedupliceert nog steeds herhaalde verzoeken die dezelfde idempotentiesleutel hergebruiken.
- Opstartbestanden voor de workspace en wachtende `BOOTSTRAP.md`-instructies worden geleverd via de Projectcontext van de systeemprompt van de agent, niet gekopieerd naar het gebruikersbericht van WebChat. Afkapping van de bootstrap voegt alleen een beknopte herstelmelding aan de systeemprompt toe; gedetailleerde aantallen en configuratieknoppen blijven op diagnostische oppervlakken.
- `chat.history` wordt ook genormaliseerd voor weergave: runtime-only OpenClaw-context,
  inkomende envelop-wrappers, inline tags voor afleveringsrichtlijnen
  zoals `[[reply_to_*]]` en `[[audio_as_voice]]`, plattetekst-XML-payloads voor tool-calls
  (inclusief `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` en afgekorte tool-call-blokken), en
  gelekte ASCII-/full-width-modelcontroletokens worden uit zichtbare tekst verwijderd,
  en assistentvermeldingen waarvan de volledige zichtbare tekst alleen het exacte stille
  token `NO_REPLY` / `no_reply` is, worden weggelaten.
- Antwoordpayloads met reasoning-vlag (`isReasoning: true`) worden uitgesloten van WebChat-assistentinhoud, transcriptreplaytekst en audio-inhoudsblokken, zodat payloads die alleen uit denkwerk bestaan niet verschijnen als zichtbare assistentberichten of afspeelbare audio.
- `chat.inject` voegt een assistentnotitie rechtstreeks toe aan het transcript en broadcast deze naar de UI (geen agent-run).
- Afgebroken runs kunnen gedeeltelijke assistentuitvoer zichtbaar houden in de UI.
- Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat, en markeert die vermeldingen met abortmetadata.
- Geschiedenis wordt altijd opgehaald uit de Gateway (geen lokale bestandsbewaking).
- Als de Gateway onbereikbaar is, is WebChat alleen-lezen.

### Transcript- en afleveringsmodel

WebChat heeft twee afzonderlijke datapaden:

- Het sessie-JSONL-bestand is het duurzame model-/runtime-transcript. Voor normale agent-runs bewaart Pi modelzichtbare `user`-, `assistant`- en `toolResult`-berichten via zijn sessiebeheerder. WebChat schrijft geen willekeurige afleverings-, status- of hulptekst naar dat transcript.
- Gateway-`ReplyPayload`-events zijn de live afleveringsprojectie. Ze kunnen worden genormaliseerd voor WebChat-/kanaalweergave, blokstreaming, richtlijntags, media-insluiting, TTS-/audiovlaggen en UI-fallbackgedrag. Ze zijn zelf niet het canonieke sessielogboek.
- WebChat injecteert alleen assistenttranscriptvermeldingen wanneer de Gateway eigenaar is van een weergegeven bericht buiten een normale Pi-assistentbeurt: `chat.inject`, antwoorden van niet-agentopdrachten, afgebroken gedeeltelijke uitvoer en door WebChat beheerde mediasupplementen voor transcripties.
- `chat.history` leest het opgeslagen sessietranscript en past de WebChat-weergaveprojectie toe. Als live assistenttekst tijdens een run verschijnt maar verdwijnt na het herladen van de geschiedenis, controleer dan eerst of de ruwe JSONL de assistenttekst bevat, daarna of de `chat.history`-projectie deze heeft verwijderd, en daarna of de optimistische-tail-merge van Control UI de lokale afleveringsstatus heeft vervangen door de opgeslagen snapshot.

Definitieve antwoorden van normale agent-runs zouden duurzaam moeten zijn omdat Pi de assistant-`message_end` schrijft. Elke fallback die een afgeleverde definitieve payload naar het transcript spiegelt, moet eerst voorkomen dat een assistentbeurt wordt gedupliceerd die Pi al heeft geschreven.

## Toolspaneel voor agenten in Control UI

- Het Tools-paneel van Control UI `/agents` heeft twee afzonderlijke weergaven:
  - **Nu beschikbaar** gebruikt `tools.effective(sessionKey=...)` en toont wat de huidige
    sessie daadwerkelijk tijdens runtime kan gebruiken, inclusief tools die eigendom zijn van core, Plugin en kanaal.
  - **Toolconfiguratie** gebruikt `tools.catalog` en blijft gericht op profielen, overrides en
    catalogussemantiek.
- Runtimebeschikbaarheid is sessiegebonden. Sessies wisselen op dezelfde agent kan de
  lijst **Nu beschikbaar** wijzigen.
- De configuratie-editor impliceert geen runtimebeschikbaarheid; effectieve toegang volgt nog steeds de beleidsprioriteit
  (`allow`/`deny`, per-agent en provider-/kanaaloverrides).

## Gebruik op afstand

- Externe modus tunnelt de Gateway WebSocket via SSH/Tailscale.
- Je hoeft geen afzonderlijke WebChat-server uit te voeren.

## Configuratiereferentie (WebChat)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

WebChat-opties:

- `gateway.webchat.chatHistoryMaxChars`: maximumaantal tekens voor tekstvelden in `chat.history`-antwoorden. Wanneer een transcriptvermelding deze limiet overschrijdt, kapt Gateway lange tekstvelden af en kan het te grote berichten vervangen door een placeholder. Per verzoek kan `maxChars` ook door de client worden verzonden om deze standaardwaarde voor één `chat.history`-aanroep te overschrijven.

Gerelateerde globale opties:

- `gateway.port`, `gateway.bind`: WebSocket-host/-poort.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket-authenticatie.
- `gateway.auth.allowTailscale`: het chattabblad van browser-Control UI kan Tailscale
  Serve-identiteitsheaders gebruiken wanneer dit is ingeschakeld.
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy-authenticatie voor browserclients achter een identiteitsbewuste **non-loopback** proxybron (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: extern Gateway-doel.
- `session.*`: sessieopslag en standaardwaarden voor hoofdsleutels.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Dashboard](/nl/web/dashboard)
