---
read_when:
    - WebChat-toegang debuggen of configureren
summary: Statische host voor Loopback WebChat en Gateway-WS-gebruik voor de chat-UI
title: Webchat
x-i18n:
    generated_at: "2026-05-02T23:39:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

Status: de macOS/iOS SwiftUI-chat-UI communiceert rechtstreeks met de Gateway WebSocket.

## Wat het is

- Een native chat-UI voor de gateway (geen ingesloten browser en geen lokale statische server).
- Gebruikt dezelfde sessies en routeringsregels als andere kanalen.
- Deterministische routering: antwoorden gaan altijd terug naar WebChat.

## Snel starten

1. Start de gateway.
2. Open de WebChat-UI (macOS/iOS-app) of het chattabblad van de Control UI.
3. Zorg dat er een geldig gateway-authenticatiepad is geconfigureerd (standaard shared-secret,
   zelfs op loopback).

## Hoe het werkt (gedrag)

- De UI maakt verbinding met de Gateway WebSocket en gebruikt `chat.history`, `chat.send`, `chat.inject` en `chat.transcribeAudio`.
- `chat.history` is begrensd voor stabiliteit: Gateway kan lange tekstvelden inkorten, zware metadata weglaten en te grote items vervangen door `[chat.history omitted: message too large]`.
- `chat.history` volgt de actieve transcriptvertakking voor moderne append-only sessiebestanden, zodat verlaten herschrijftakken en vervangen promptkopieën niet in WebChat worden weergegeven.
- Control UI onthoudt de onderliggende Gateway `sessionId` die door `chat.history` wordt geretourneerd en neemt die op in vervolgoproepen naar `chat.send`, zodat herverbindingen en paginavernieuwingen hetzelfde opgeslagen gesprek voortzetten, tenzij de gebruiker een sessie start of reset.
- Control UI voegt dubbele lopende inzendingen voor dezelfde sessie, hetzelfde bericht en dezelfde bijlagen samen voordat een nieuwe `chat.send`-run-id wordt gegenereerd; de Gateway dedupliceert nog steeds herhaalde verzoeken die dezelfde idempotentiesleutel hergebruiken.
- `chat.history` is ook genormaliseerd voor weergave: runtime-only OpenClaw-context,
  inkomende envelope-wrappers, inline tags voor bezorginstructies
  zoals `[[reply_to_*]]` en `[[audio_as_voice]]`, XML-payloads voor toolaanroepen in platte tekst
  (waaronder `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken), en
  gelekte ASCII-/full-width modelcontroletokens worden uit zichtbare tekst verwijderd,
  en assistentitems waarvan de volledige zichtbare tekst alleen het exacte stille
  token `NO_REPLY` / `no_reply` is, worden weggelaten.
- Antwoordpayloads met een redeneringsvlag (`isReasoning: true`) worden uitgesloten van WebChat-assistentcontent, tekst voor transcriptweergave en audiocontentblokken, zodat payloads die alleen denkinhoud bevatten niet verschijnen als zichtbare assistentberichten of afspeelbare audio.
- `chat.transcribeAudio` verzorgt server-side dicteren in de chatcomposer van de Control UI. De browser neemt microfoonaudio op, verstuurt die als base64 naar de Gateway, en de Gateway voert de geconfigureerde `tools.media.audio`-pipeline uit. Het geretourneerde transcript wordt in het concept ingevoegd; er wordt geen agentrun gestart totdat de gebruiker het verstuurt.
- `chat.inject` voegt een assistentnotitie rechtstreeks toe aan het transcript en zendt die uit naar de UI (geen agentrun).
- Afgebroken runs kunnen gedeeltelijke assistentuitvoer zichtbaar houden in de UI.
- Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer er gebufferde uitvoer bestaat, en markeert die items met afbreekmetadata.
- Geschiedenis wordt altijd opgehaald uit de gateway (geen lokale bestandsbewaking).
- Als de gateway onbereikbaar is, is WebChat alleen-lezen.

## Toolspaneel voor Control UI-agents

- Het Tools-paneel van Control UI `/agents` heeft twee afzonderlijke weergaven:
  - **Nu beschikbaar** gebruikt `tools.effective(sessionKey=...)` en toont wat de huidige
    sessie daadwerkelijk tijdens runtime kan gebruiken, inclusief tools die eigendom zijn van core, plugin en kanaal.
  - **Toolconfiguratie** gebruikt `tools.catalog` en blijft gericht op profielen, overschrijvingen en
    catalogussemantiek.
- Runtimebeschikbaarheid is sessiegebonden. Wisselen van sessie op dezelfde agent kan de
  lijst **Nu beschikbaar** wijzigen.
- De configuratie-editor impliceert geen runtimebeschikbaarheid; effectieve toegang volgt nog steeds de beleidsprioriteit
  (`allow`/`deny`, per-agent en provider-/kanaaloverschrijvingen).

## Gebruik op afstand

- Externe modus tunnelt de gateway WebSocket via SSH/Tailscale.
- Je hoeft geen aparte WebChat-server te draaien.

## Configuratiereferentie (WebChat)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

WebChat-opties:

- `gateway.webchat.chatHistoryMaxChars`: maximum aantal tekens voor tekstvelden in `chat.history`-antwoorden. Wanneer een transcriptitem deze limiet overschrijdt, kort Gateway lange tekstvelden in en kan het te grote berichten vervangen door een placeholder. Per verzoek kan `maxChars` ook door de client worden verzonden om deze standaardwaarde voor één `chat.history`-aanroep te overschrijven.

Gerelateerde globale opties:

- `gateway.port`, `gateway.bind`: WebSocket-host/-poort.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket-authenticatie.
- `gateway.auth.allowTailscale`: het chattabblad van de browser-Control UI kan Tailscale
  Serve-identiteitsheaders gebruiken wanneer ingeschakeld.
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy-authenticatie voor browserclients achter een identiteitsbewuste **niet-loopback** proxybron (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: externe gatewaydoel.
- `session.*`: sessieopslag en standaardwaarden voor de hoofdsleutel.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Dashboard](/nl/web/dashboard)
