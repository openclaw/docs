---
read_when:
    - WebChat-toegang debuggen of configureren
summary: Gebruik van statische Loopback WebChat-host en Gateway WS voor chat-UI
title: Webchat
x-i18n:
    generated_at: "2026-04-29T23:28:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
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
3. Zorg dat een geldig Gateway-authenticatiepad is geconfigureerd (standaard shared-secret,
   zelfs op loopback).

## Hoe het werkt (gedrag)

- De UI maakt verbinding met de Gateway WebSocket en gebruikt `chat.history`, `chat.send` en `chat.inject`.
- `chat.history` is begrensd voor stabiliteit: Gateway kan lange tekstvelden inkorten, zware metadata weglaten en te grote vermeldingen vervangen door `[chat.history omitted: message too large]`.
- `chat.history` volgt de actieve transcriptvertakking voor moderne append-only sessiebestanden, zodat verlaten herschrijfvertakkingen en vervangen promptkopieën niet worden weergegeven in WebChat.
- Control UI voegt dubbele lopende verzendingen voor dezelfde sessie, hetzelfde bericht en dezelfde bijlagen samen voordat een nieuwe `chat.send`-run-id wordt gegenereerd; de Gateway dedupliceert nog steeds herhaalde aanvragen die dezelfde idempotentiesleutel hergebruiken.
- `chat.history` is ook genormaliseerd voor weergave: runtime-only OpenClaw-context,
  inkomende envelope-wrappers, inline tags voor afleveringsinstructies
  zoals `[[reply_to_*]]` en `[[audio_as_voice]]`, tool-call-XML-payloads in platte tekst
  (waaronder `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` en ingekorte tool-call-blokken), en
  gelekte ASCII-/full-width-modelbesturingstokens worden uit zichtbare tekst verwijderd,
  en assistentvermeldingen waarvan de volledige zichtbare tekst alleen het exacte stille
  token `NO_REPLY` / `no_reply` is, worden weggelaten.
- Antwoordpayloads met redeneermarkering (`isReasoning: true`) worden uitgesloten van WebChat-assistentinhoud, transcript-replaytekst en audio-inhoudsblokken, zodat payloads die alleen denkstappen bevatten niet verschijnen als zichtbare assistentberichten of afspeelbare audio.
- `chat.inject` voegt een assistentnotitie rechtstreeks toe aan het transcript en zendt die uit naar de UI (geen agent-run).
- Afgebroken runs kunnen gedeeltelijke assistentuitvoer zichtbaar houden in de UI.
- Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat, en markeert die vermeldingen met afbreekmetadata.
- Geschiedenis wordt altijd opgehaald uit de Gateway (geen lokale bestandsbewaking).
- Als de Gateway onbereikbaar is, is WebChat alleen-lezen.

## Tools-paneel voor Control UI-agents

- Het Tools-paneel van Control UI `/agents` heeft twee afzonderlijke weergaven:
  - **Nu beschikbaar** gebruikt `tools.effective(sessionKey=...)` en toont wat de huidige
    sessie daadwerkelijk tijdens runtime kan gebruiken, inclusief tools die eigendom zijn van core, Plugin en kanaal.
  - **Toolconfiguratie** gebruikt `tools.catalog` en blijft gericht op profielen, overrides en
    catalogussemantiek.
- Runtimebeschikbaarheid is sessiegebonden. Sessies wisselen op dezelfde agent kan de
  lijst **Nu beschikbaar** wijzigen.
- De configuratie-editor impliceert geen runtimebeschikbaarheid; effectieve toegang volgt nog steeds de beleidsprioriteit
  (`allow`/`deny`, per-agent- en provider-/kanaaloverrides).

## Gebruik op afstand

- Externe modus tunnelt de Gateway WebSocket via SSH/Tailscale.
- Je hoeft geen aparte WebChat-server uit te voeren.

## Configuratiereferentie (WebChat)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

WebChat-opties:

- `gateway.webchat.chatHistoryMaxChars`: maximaal aantal tekens voor tekstvelden in `chat.history`-antwoorden. Wanneer een transcriptvermelding deze limiet overschrijdt, kort Gateway lange tekstvelden in en kan het te grote berichten vervangen door een placeholder. Per aanvraag kan `maxChars` ook door de client worden verzonden om deze standaardwaarde voor één `chat.history`-aanroep te overschrijven.

Gerelateerde globale opties:

- `gateway.port`, `gateway.bind`: WebSocket-host/-poort.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket-authenticatie.
- `gateway.auth.allowTailscale`: het chattabblad van de browser-Control UI kan Tailscale
  Serve-identiteitsheaders gebruiken wanneer dit is ingeschakeld.
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy-authenticatie voor browserclients achter een identiteitsbewuste **niet-loopback** proxybron (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: extern Gateway-doel.
- `session.*`: sessieopslag en standaardwaarden voor de hoofdsleutel.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Dashboard](/nl/web/dashboard)
