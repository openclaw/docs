---
summary: Reindirizzamento a /plugins/sdk-channel-outbound
title: API dei messaggi del canale
x-i18n:
    generated_at: "2026-07-12T07:24:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Questa pagina è stata spostata in [API di invio dei canali](/it/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` e
`openclaw/plugin-sdk/channel-message-runtime` rimangono sottopercorsi di compatibilità
deprecati per i plugin meno recenti; entrambi sono semplici alias del nucleo condiviso
dei messaggi dei canali. I nuovi plugin dei canali dovrebbero usare
`openclaw/plugin-sdk/channel-outbound` per il ciclo di vita dei messaggi, le ricevute,
l'invio durevole e le funzioni di supporto per l'anteprima in tempo reale, anziché aggiungere nuove funzioni
ai sottopercorsi deprecati.

Piano di rimozione: mantenere questi alias per tutta la finestra di migrazione
dei plugin esterni, quindi rimuoverli durante la successiva pulizia principale dell'SDK, dopo che i chiamanti
saranno passati a `channel-outbound`.
