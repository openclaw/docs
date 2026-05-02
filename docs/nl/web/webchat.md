---
read_when:
    - WebChat-toegang debuggen of configureren
summary: Statische host voor Loopback WebChat en Gateway WS-gebruik voor chat-UI
title: Webchat
x-i18n:
    generated_at: "2026-05-02T11:31:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Status: de macOS/iOS SwiftUI-chat-UI praat rechtstreeks met de Gateway WebSocket.

## Wat het is

- Een native chat-UI voor de Gateway (geen ingebedde browser en geen lokale statische server).
- Gebruikt dezelfde sessies en routeringsregels als andere kanalen.
- Deterministische routering: antwoorden gaan altijd terug naar WebChat.

## Snel starten

1. Start de Gateway.
2. Open de WebChat-UI (macOS/iOS-app) of het chat-tabblad van de Control UI.
3. Zorg dat er een geldig authenticatiepad voor de Gateway is geconfigureerd (standaard shared-secret,
   zelfs op loopback).

## Hoe het werkt (gedrag)

- De UI maakt verbinding met de Gateway WebSocket en gebruikt `chat.history`, `chat.send` en `chat.inject`.
- `chat.history` is begrensd voor stabiliteit: Gateway kan lange tekstvelden inkorten, zware metadata weglaten en te grote items vervangen door `[chat.history omitted: message too large]`.
- `chat.history` volgt de actieve transcriptvertakking voor moderne sessiebestanden die alleen worden aangevuld, zodat verlaten herschrijfvertakkingen en vervangen promptkopieën niet in WebChat worden weergegeven.
- Control UI onthoudt de onderliggende Gateway `sessionId` die door `chat.history` wordt teruggegeven en neemt die op in vervolg-aanroepen naar `chat.send`, zodat opnieuw verbinden en pagina's verversen hetzelfde opgeslagen gesprek voortzetten, tenzij de gebruiker een sessie start of reset.
- Control UI voegt dubbele lopende verzendingen voor dezelfde sessie, hetzelfde bericht en dezelfde bijlagen samen voordat een nieuwe run-id voor `chat.send` wordt gegenereerd; de Gateway dedupliceert nog steeds herhaalde verzoeken die dezelfde idempotentiesleutel hergebruiken.
- `chat.history` wordt ook genormaliseerd voor weergave: runtime-only OpenClaw-context,
  wrappers voor inkomende enveloppen, inline tags voor bezorgingsrichtlijnen
  zoals `[[reply_to_*]]` en `[[audio_as_voice]]`, plain-text XML-payloads voor tool-aanroepen
  (inclusief `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` en ingekorte tool-aanroepblokken), en
  gelekte ASCII-/volledige-breedte modelbesturingstokens worden uit zichtbare tekst gestript,
  en assistent-items waarvan de volledige zichtbare tekst alleen het exacte stille
  token `NO_REPLY` / `no_reply` is, worden weggelaten.
- Antwoordpayloads met reasoning-vlag (`isReasoning: true`) worden uitgesloten van WebChat-assistentcontent, transcript-replaytekst en audiocontentblokken, zodat thinking-only payloads niet verschijnen als zichtbare assistentberichten of afspeelbare audio.
- `chat.inject` voegt een assistentnotitie rechtstreeks aan het transcript toe en broadcast die naar de UI (geen agent-run).
- Afgebroken runs kunnen gedeeltelijke assistentuitvoer zichtbaar houden in de UI.
- Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat, en markeert die items met afbreekmetadata.
- Geschiedenis wordt altijd opgehaald uit de Gateway (geen lokale bestandsbewaking).
- Als de Gateway onbereikbaar is, is WebChat alleen-lezen.

## Tools-paneel voor Control UI-agents

- Het Tools-paneel van Control UI `/agents` heeft twee afzonderlijke weergaven:
  - **Nu beschikbaar** gebruikt `tools.effective(sessionKey=...)` en toont wat de huidige
    sessie daadwerkelijk tijdens runtime kan gebruiken, inclusief tools die eigendom zijn van core, plugins en kanalen.
  - **Toolconfiguratie** gebruikt `tools.catalog` en blijft gericht op profielen, overrides en
    catalogussemantiek.
- Runtime-beschikbaarheid is sessiegebonden. Wisselen van sessie op dezelfde agent kan de
  lijst **Nu beschikbaar** wijzigen.
- De configuratie-editor impliceert geen runtime-beschikbaarheid; effectieve toegang volgt nog steeds beleidsprioriteit
  (`allow`/`deny`, overrides per agent en provider/kanaal).

## Extern gebruik

- Externe modus tunnelt de Gateway WebSocket via SSH/Tailscale.
- Je hoeft geen afzonderlijke WebChat-server te draaien.

## Configuratiereferentie (WebChat)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

WebChat-opties:

- `gateway.webchat.chatHistoryMaxChars`: maximaal aantal tekens voor tekstvelden in `chat.history`-antwoorden. Wanneer een transcriptitem deze limiet overschrijdt, kort Gateway lange tekstvelden in en kan te grote berichten vervangen door een placeholder. Per verzoek kan de client ook `maxChars` meesturen om deze standaardwaarde voor één `chat.history`-aanroep te overschrijven.

Gerelateerde globale opties:

- `gateway.port`, `gateway.bind`: WebSocket-host/-poort.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket-authenticatie.
- `gateway.auth.allowTailscale`: het chat-tabblad van de browser-Control UI kan Tailscale
  Serve-identiteitsheaders gebruiken wanneer ingeschakeld.
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy-authenticatie voor browserclients achter een identiteitsbewuste **niet-loopback** proxybron (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: extern Gateway-doel.
- `session.*`: sessieopslag en standaardwaarden voor hoofdsleutel.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Dashboard](/nl/web/dashboard)
