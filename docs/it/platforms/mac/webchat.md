---
read_when:
    - Debug della vista WebChat Mac o della porta loopback
summary: Come l'app Mac incorpora la WebChat del Gateway e come eseguirne il debug
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T08:50:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

L'app macOS nella barra dei menu incorpora la UI WebChat come vista SwiftUI nativa. Si
connette al Gateway e usa come predefinita la **sessione principale** per l'agente selezionato
(con un selettore di sessione per le altre sessioni).

- **Modalità locale**: si connette direttamente al WebSocket del Gateway locale.
- **Modalità remota**: inoltra la porta di controllo del Gateway tramite SSH e usa quel
  tunnel come piano dati.

## Avvio e debugging

- Manuale: menu Lobster → “Open Chat”.
- Apertura automatica per i test:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Log: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Come è collegata

- Piano dati: metodi WS del Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` ed eventi `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` restituisce righe di trascrizione normalizzate per la visualizzazione: i tag delle direttive inline
  vengono rimossi dal testo visibile, i payload XML delle chiamate di tool in testo semplice
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocchi di chiamata di tool troncati) e i token di controllo del modello trapelati in ASCII/full-width vengono rimossi, le righe dell'assistente composte solo da token silenziosi come l'esatto `NO_REPLY` / `no_reply` vengono
  omesse, e le righe troppo grandi possono essere sostituite da placeholder.
- Sessione: usa come predefinita la sessione primaria (`main`, oppure `global` quando l'ambito è
  globale). La UI può passare da una sessione all'altra.
- L'onboarding usa una sessione dedicata per mantenere separata la configurazione del primo avvio.

## Superficie di sicurezza

- La modalità remota inoltra via SSH solo la porta di controllo WebSocket del Gateway.

## Limitazioni note

- La UI è ottimizzata per sessioni di chat (non è un sandbox browser completo).

## Correlati

- [WebChat](/it/web/webchat)
- [app macOS](/it/platforms/macos)
