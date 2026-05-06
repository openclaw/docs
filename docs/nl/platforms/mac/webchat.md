---
read_when:
    - Debuggen van mac WebChat-weergave of loopbackpoort
summary: Hoe de Mac-app de Gateway WebChat insluit en hoe je deze debugt
title: Webchat (macOS)
x-i18n:
    generated_at: "2026-05-06T09:23:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

De macOS-menubalk-app sluit de WebChat-UI in als een native SwiftUI-weergave. Deze
maakt verbinding met de Gateway en gebruikt standaard de **hoofdsessie** voor de geselecteerde
agent (met een sessiewisselaar voor andere sessies).

- **Lokale modus**: maakt rechtstreeks verbinding met de lokale Gateway-WebSocket.
- **Externe modus**: stuurt de Gateway-besturingspoort door via SSH en gebruikt die
  tunnel als het datavlak.

## Starten en debuggen

- Handmatig: Lobster-menu → "Chat openen".
- Automatisch openen voor tests:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Logboeken: `./scripts/clawlog.sh` (subsysteem `ai.openclaw`, categorie `WebChatSwiftUI`).

## Hoe het is gekoppeld

- Datavlak: Gateway-WS-methoden `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` en events `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` retourneert voor weergave genormaliseerde transcriptieregels: inline directive
  tags worden uit zichtbare tekst gestript, XML-payloads van toolaanroepen in platte tekst
  (waaronder `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, en afgekorte toolaanroepblokken) en
  gelekte ASCII-/volledige-breedte-modelbesturingstokens worden gestript, zuivere
  assistant-regels met stille tokens, zoals exact `NO_REPLY` / `no_reply`, worden
  weggelaten, en te grote regels kunnen worden vervangen door placeholders.
- Sessie: gebruikt standaard de primaire sessie (`main`, of `global` wanneer het bereik
  globaal is). De UI kan wisselen tussen sessies.
- Onboarding gebruikt een toegewezen sessie om de eerste installatie gescheiden te houden.

## Beveiligingsoppervlak

- Externe modus stuurt alleen de Gateway-WebSocket-besturingspoort door via SSH.

## Bekende beperkingen

- De UI is geoptimaliseerd voor chatsessies (geen volledige browsersandbox).

## Gerelateerd

- [WebChat](/nl/web/webchat)
- [macOS-app](/nl/platforms/macos)
