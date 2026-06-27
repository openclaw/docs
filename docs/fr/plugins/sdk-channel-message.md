---
summary: Rediriger vers /plugins/sdk-channel-outbound
title: API de message de canal
x-i18n:
    generated_at: "2026-06-27T17:58:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Cette page a été déplacée vers [API sortante des canaux](/fr/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` et
`openclaw/plugin-sdk/channel-message-runtime` restent des sous-chemins de compatibilité obsolètes
pour les anciens plugins. Les nouveaux plugins de canal doivent utiliser
`openclaw/plugin-sdk/channel-outbound` pour les helpers de cycle de vie des messages, de réception,
d’envoi durable et de prévisualisation en direct. Les sous-chemins obsolètes sont de simples alias autour
du noyau partagé de messages de canal et des surfaces SDK entrantes/sortantes spécialisées ;
n’y ajoutez pas de nouveaux helpers.

Plan de suppression : conserver ces alias pendant la fenêtre de migration des plugins externes,
puis les supprimer lors du prochain grand nettoyage du SDK après que les appelants seront passés à
`channel-outbound`.
