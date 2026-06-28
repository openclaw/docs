---
read_when:
    - Debug della vista WebChat su Mac o della porta di loopback
summary: Come l'app Mac incorpora il WebChat del Gateway e come eseguirne il debug
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-05-06T09:00:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

L'app della barra dei menu di macOS incorpora l'interfaccia WebChat come vista SwiftUI nativa. Si
connette al Gateway e usa per impostazione predefinita la **sessione main** per l'agente
selezionato (con un selettore di sessione per le altre sessioni).

- **Modalità locale**: si connette direttamente al WebSocket del Gateway locale.
- **Modalità remota**: inoltra la porta di controllo del Gateway tramite SSH e usa quel
  tunnel come piano dati.

## Avvio e debug

- Manuale: menu Lobster → "Apri chat".
- Apertura automatica per i test:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Log: `./scripts/clawlog.sh` (sottosistema `ai.openclaw`, categoria `WebChatSwiftUI`).

## Come è collegata

- Piano dati: metodi WS del Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` ed eventi `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` restituisce righe della trascrizione normalizzate per la visualizzazione: i tag
  di direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata tool in testo normale
  (inclusi `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e i blocchi di chiamata tool troncati) e
  i token di controllo del modello trapelati in ASCII/a larghezza piena vengono rimossi, le righe
  dell'assistente composte solo da token silenziosi, come esattamente `NO_REPLY` / `no_reply`, vengono
  omesse, e le righe troppo grandi possono essere sostituite con segnaposto.
- Sessione: usa per impostazione predefinita la sessione principale (`main`, o `global` quando l'ambito è
  globale). L'interfaccia può passare da una sessione all'altra.
- L'onboarding usa una sessione dedicata per mantenere separata la configurazione del primo avvio.

## Superficie di sicurezza

- La modalità remota inoltra tramite SSH solo la porta di controllo WebSocket del Gateway.

## Limitazioni note

- L'interfaccia è ottimizzata per le sessioni di chat (non per una sandbox browser completa).

## Correlati

- [WebChat](/it/web/webchat)
- [app macOS](/it/platforms/macos)
