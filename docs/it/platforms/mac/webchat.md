---
read_when:
    - Debug della vista WebChat Mac o della porta loopback
summary: Come l'app Mac incorpora la WebChat del gateway e come eseguirne il debug
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-05T13:58:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat (app macOS)

L'app macOS nella barra dei menu incorpora la UI WebChat come vista SwiftUI nativa. Si
connette al Gateway e usa per impostazione predefinita la **sessione principale** per l'agente
selezionato (con un selettore di sessione per le altre sessioni).

- **Modalità locale**: si connette direttamente al WebSocket del Gateway locale.
- **Modalità remota**: inoltra la porta di controllo del Gateway tramite SSH e usa quel
  tunnel come data plane.

## Avvio e debug

- Manuale: menu Lobster → “Apri chat”.
- Apertura automatica per i test:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Log: `./scripts/clawlog.sh` (sottosistema `ai.openclaw`, categoria `WebChatSwiftUI`).

## Come è collegata

- Data plane: metodi WS del Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` ed eventi `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` restituisce righe della trascrizione normalizzate per la visualizzazione: i tag
  delle direttive inline vengono rimossi dal testo visibile, i payload XML plain-text delle
  chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati) e i
  token di controllo del modello ASCII/full-width fuoriusciti vengono rimossi, le righe dell'assistente composte solo da
  token silenziosi puri come `NO_REPLY` / `no_reply` esatti vengono omesse, e le righe
  troppo grandi possono essere sostituite con placeholder.
- Sessione: per impostazione predefinita usa la sessione primaria (`main`, oppure `global` quando l'ambito è
  globale). La UI può passare da una sessione all'altra.
- L'onboarding usa una sessione dedicata per mantenere separata la configurazione della prima esecuzione.

## Superficie di sicurezza

- La modalità remota inoltra tramite SSH solo la porta di controllo WebSocket del Gateway.

## Limitazioni note

- La UI è ottimizzata per sessioni di chat (non è un sandbox browser completo).
