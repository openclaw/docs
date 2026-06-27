---
summary: Reindirizza a /plugins/sdk-channel-outbound
title: API dei messaggi di canale
x-i18n:
    generated_at: "2026-06-27T18:00:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Questa pagina è stata spostata in [API outbound del canale](/it/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` e
`openclaw/plugin-sdk/channel-message-runtime` rimangono sottopercorsi di
compatibilità deprecati per i Plugin meno recenti. I nuovi Plugin di canale
dovrebbero usare `openclaw/plugin-sdk/channel-outbound` per gli helper di ciclo
di vita dei messaggi, ricevuta, invio durevole e anteprima in tempo reale. I
sottopercorsi deprecati sono alias sottili sul core condiviso dei messaggi di
canale e sulle superfici SDK inbound/outbound mirate; non aggiungere nuovi
helper lì.

Piano di rimozione: mantieni questi alias per tutta la finestra di migrazione
dei Plugin esterni, quindi rimuovili nella successiva pulizia major dell'SDK
dopo che i chiamanti saranno passati a `channel-outbound`.
