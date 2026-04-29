---
read_when:
    - Fouten opsporen in de mac WebChat-weergave of loopbackpoort
summary: Hoe de Mac-app de Gateway WebChat insluit en hoe je deze debugt
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-29T23:00:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 16
---

De macOS-menubalk-app sluit de WebChat-UI in als een native SwiftUI-weergave. Deze
maakt verbinding met de Gateway en gebruikt standaard de **hoofdsessie** voor de geselecteerde
agent (met een sessiewisselaar voor andere sessies).

- **Lokale modus**: maakt rechtstreeks verbinding met de lokale Gateway-WebSocket.
- **Externe modus**: stuurt de Gateway-controlepoort door via SSH en gebruikt die
  tunnel als datavlak.

## Starten en debuggen

- Handmatig: Lobster-menu → “Chat openen”.
- Automatisch openen voor tests:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logs: `./scripts/clawlog.sh` (subsysteem `ai.openclaw`, categorie `WebChatSwiftUI`).

## Hoe het is gekoppeld

- Datavlak: Gateway-WS-methoden `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` en gebeurtenissen `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` retourneert voor weergave genormaliseerde transcriptieregels: inline directieve
  tags worden uit zichtbare tekst verwijderd, platte-tekst XML-payloads voor tool-aanroepen
  (inclusief `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` en afgekorte tool-aanroepblokken) en
  gelekte ASCII-/volledige-breedte modelcontroletokens worden verwijderd, zuivere
  assistentregels met stille tokens zoals exact `NO_REPLY` / `no_reply` worden
  weggelaten, en te grote regels kunnen worden vervangen door placeholders.
- Sessie: gebruikt standaard de primaire sessie (`main`, of `global` wanneer het bereik
  globaal is). De UI kan tussen sessies wisselen.
- Onboarding gebruikt een speciale sessie om de eerste installatie gescheiden te houden.

## Beveiligingsoppervlak

- Externe modus stuurt alleen de Gateway-WebSocket-controlepoort door via SSH.

## Bekende beperkingen

- De UI is geoptimaliseerd voor chatsessies (geen volledige browsersandbox).

## Gerelateerd

- [WebChat](/nl/web/webchat)
- [macOS-app](/nl/platforms/macos)
