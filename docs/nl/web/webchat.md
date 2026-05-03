---
read_when:
    - WebChat-toegang debuggen of configureren
summary: Statische host voor Loopback WebChat en Gateway-WS-gebruik voor de chatinterface
title: Webchat
x-i18n:
    generated_at: "2026-05-03T11:16:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Status: de macOS/iOS SwiftUI-chatinterface communiceert rechtstreeks met de Gateway WebSocket.

## Wat het is

- Een native chatinterface voor de Gateway (geen ingesloten browser en geen lokale statische server).
- Gebruikt dezelfde sessies en routeringsregels als andere kanalen.
- Deterministische routering: antwoorden gaan altijd terug naar WebChat.

## Snel starten

1. Start de Gateway.
2. Open de WebChat-UI (macOS/iOS-app) of het chattabblad van de Control UI.
3. Zorg dat een geldig Gateway-authenticatiepad is geconfigureerd (standaard gedeeld geheim,
   zelfs op loopback).

## Hoe het werkt (gedrag)

- De UI maakt verbinding met de Gateway WebSocket en gebruikt `chat.history`, `chat.send` en `chat.inject`.
- `chat.history` is begrensd voor stabiliteit: Gateway kan lange tekstvelden inkorten, zware metadata weglaten en te grote vermeldingen vervangen door `[chat.history omitted: message too large]`.
- `chat.history` volgt de actieve transcriptvertakking voor moderne append-only sessiebestanden, zodat verlaten herschrijfvertakkingen en vervangen promptkopieen niet in WebChat worden weergegeven.
- Compaction-vermeldingen worden weergegeven als een expliciete scheiding voor gecompacteerde geschiedenis. De scheiding legt uit dat eerdere beurten in een checkpoint worden bewaard en linkt naar de checkpointbediening voor Sessions, waar operators de weergave van voor de Compaction kunnen vertakken of herstellen wanneer hun machtigingen dat toestaan.
- Control UI onthoudt de onderliggende Gateway-`sessionId` die door `chat.history` wordt geretourneerd en neemt deze op in vervolgoproepen naar `chat.send`, zodat herverbindingen en pagina-verversingen hetzelfde opgeslagen gesprek voortzetten tenzij de gebruiker een sessie start of reset.
- Control UI voegt dubbele lopende inzendingen voor dezelfde sessie, hetzelfde bericht en dezelfde bijlagen samen voordat een nieuwe run-id voor `chat.send` wordt gegenereerd; de Gateway dedupliceert nog steeds herhaalde aanvragen die dezelfde idempotentiesleutel hergebruiken.
- `chat.history` wordt ook genormaliseerd voor weergave: runtime-only OpenClaw-context,
  inkomende envelop-wrappers, inline tags voor bezorgrichtlijnen
  zoals `[[reply_to_*]]` en `[[audio_as_voice]]`, plattetekst-XML-payloads
  voor toolcalls (waaronder `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` en afgekorte toolcallblokken), en
  gelekte ASCII-/volledige-breedte modelcontroletokens worden uit zichtbare tekst gestript,
  en assistentvermeldingen waarvan de volledige zichtbare tekst alleen het exacte stille
  token `NO_REPLY` / `no_reply` is, worden weggelaten.
- Antwoordpayloads met reasoning-vlag (`isReasoning: true`) worden uitgesloten van WebChat-assistentinhoud, transcript-herhalingstekst en audiocontentblokken, zodat payloads die alleen voor denken zijn niet verschijnen als zichtbare assistentberichten of afspeelbare audio.
- `chat.inject` voegt een assistentnotitie rechtstreeks toe aan het transcript en zendt deze uit naar de UI (geen agentrun).
- Afgebroken runs kunnen gedeeltelijke assistentuitvoer zichtbaar houden in de UI.
- Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat, en markeert die vermeldingen met abortmetadata.
- Geschiedenis wordt altijd opgehaald bij de Gateway (geen lokale bestandsbewaking).
- Als de Gateway onbereikbaar is, is WebChat alleen-lezen.

## Toolspaneel voor Control UI-agenten

- Het Toolspaneel van Control UI `/agents` heeft twee aparte weergaven:
  - **Nu beschikbaar** gebruikt `tools.effective(sessionKey=...)` en toont wat de huidige
    sessie daadwerkelijk tijdens runtime kan gebruiken, inclusief tools die eigendom zijn van core, Plugin en kanalen.
  - **Toolconfiguratie** gebruikt `tools.catalog` en blijft gericht op profielen, overrides en
    catalogussemantiek.
- Runtimebeschikbaarheid is sessiegebonden. Wisselen van sessie op dezelfde agent kan de lijst
  **Nu beschikbaar** wijzigen.
- De configuratie-editor impliceert geen runtimebeschikbaarheid; effectieve toegang volgt nog steeds de beleidsprioriteit
  (`allow`/`deny`, per-agent- en provider-/kanaaloverrides).

## Gebruik op afstand

- Externe modus tunnelt de Gateway WebSocket via SSH/Tailscale.
- Je hoeft geen aparte WebChat-server uit te voeren.

## Configuratiereferentie (WebChat)

Volledige configuratie: [Configuratie](/nl/gateway/configuration)

WebChat-opties:

- `gateway.webchat.chatHistoryMaxChars`: maximaal aantal tekens voor tekstvelden in `chat.history`-antwoorden. Wanneer een transcriptvermelding deze limiet overschrijdt, kort Gateway lange tekstvelden in en kan te grote berichten vervangen door een placeholder. Per-aanvraag `maxChars` kan ook door de client worden verzonden om deze standaardwaarde voor een enkele `chat.history`-oproep te overschrijven.

Gerelateerde globale opties:

- `gateway.port`, `gateway.bind`: WebSocket-host/-poort.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  gedeeld-geheim WebSocket-authenticatie.
- `gateway.auth.allowTailscale`: het chattabblad van de browser-Control UI kan Tailscale
  Serve-identiteitsheaders gebruiken wanneer ingeschakeld.
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy-authenticatie voor browserclients achter een identiteitsbewuste **niet-loopback** proxybron (zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: extern Gateway-doel.
- `session.*`: sessieopslag en standaardwaarden voor hoofdsleutel.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [Dashboard](/nl/web/dashboard)
