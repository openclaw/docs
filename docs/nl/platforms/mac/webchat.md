---
read_when:
    - Fouten opsporen in de WebChat-weergave op de Mac of de local loopback-poort
summary: Hoe de Mac-app de Gateway WebChat insluit en hoe je deze debugt
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T09:06:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

De macOS-menubalkapp sluit de WebChat-UI in als een systeemeigen SwiftUI-weergave. De app maakt verbinding met de Gateway en gebruikt standaard de primaire sessie voor de geselecteerde agent (`main`, of `global` wanneer `session.scope` gelijk is aan `global`).

Het volledige chatvenster is een systeemeigen gesplitste weergave:

- **Sessiezijbalk**: doorzoekbare sessielijst met vastgemaakte en recente secties, indicatoren voor ongelezen berichten en contextmenu's voor vastmaken/losmaken, de sessiesleutel kopiëren en verwijderen. Met een werkbalkknop (of Cmd-N) wordt via `sessions.create` een echte nieuwe sessie aangemaakt.
- **Vensterwerkbalk**: ring voor contextgebruik (tokens en sessiekosten, met een compacte actie), keuzelijst voor denkniveau, modelkiezer en een menu met sessieacties (nieuwe sessie, vernieuwen, sessiesleutel kopiëren, transcript exporteren, comprimeren, geschiedenis wissen).
- **Transcript en opsteller**: assistentberichten worden als platte tekst met een avatar weergegeven, gebruikersberichten als ballonnen met een accentkleur. Als u `/` typt, wordt automatisch aanvullen voor slash-opdrachten geopend, aangestuurd door `commands.list`, met toetsenbordnavigatie via de pijltoetsen/Tab/Return/Escape. Klik met de rechtermuisknop op een bericht om het te kopiëren.

Het verankerde snelle-chatpaneel vanuit de menubalk behoudt de compacte indeling met één kolom en ingebouwde keuzelijsten.

- **Lokale modus**: maakt rechtstreeks verbinding met de lokale Gateway-WebSocket.
- **Externe modus**: stuurt de Gateway-besturingspoort door via SSH en gebruikt die tunnel als gegevensvlak.

## Starten en fouten opsporen

- Handmatig: Lobster-menu -> "Open Chat".
- Automatisch openen voor tests:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` wordt geaccepteerd als verouderde alias.)

- Logboeken: `./scripts/clawlog.sh` (subsysteem `ai.openclaw`, categorie `WebChatSwiftUI`).

## Hoe alles is gekoppeld

- Gegevensvlak: Gateway-WS-methoden `chat.history`, `chat.send`, `chat.abort`, `chat.inject` en gebeurtenissen `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` retourneert een voor weergave genormaliseerd transcript: ingebedde instructietags worden uit zichtbare tekst verwijderd, XML-payloads van toolaanroepen in platte tekst (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, inclusief afgekapt blokken) en gelekte modelbesturingstokens worden verwijderd, assistentrijen die uitsluitend uit stille tokens bestaan, zoals exact `NO_REPLY`/`no_reply`, worden weggelaten en te grote rijen kunnen worden vervangen door een afgekapt tijdelijke aanduiding.
- Sessie: gebruikt standaard de primaire sessie zoals hierboven beschreven; via de UI kan tussen sessies worden gewisseld.
- De introductie gebruikt een afzonderlijke sessie om de configuratie bij de eerste uitvoering gescheiden te houden.
- Offlinecache: de app bewaart per Gateway een kleine alleen-lezen cache met recente chatsessies en transcripten (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): bij een koude start wordt het laatst bekende transcript onmiddellijk weergegeven en vernieuwd zodra de Gateway reageert, en recente chats blijven doorzoekbaar wanneer de verbinding is verbroken (verzenden blijft uitgeschakeld totdat de verbinding is hersteld).

## Beveiligingsoppervlak

- De externe modus stuurt alleen de Gateway-WebSocket-besturingspoort door via SSH.

## Bekende beperkingen

- De UI is geoptimaliseerd voor chatsessies, niet als volledige browsersandbox.

## Gerelateerd

- [WebChat](/nl/web/webchat)
- [macOS-app](/nl/platforms/macos)
