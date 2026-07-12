---
summary: Rediriger vers /plugins/sdk-channel-outbound
title: API de messages de canal
x-i18n:
    generated_at: "2026-07-12T02:59:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Cette page a été déplacée vers [API d’envoi sortant des canaux](/fr/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` et
`openclaw/plugin-sdk/channel-message-runtime` restent des sous-chemins de
compatibilité obsolètes destinés aux anciens plugins ; tous deux sont de simples
alias du cœur partagé de la messagerie des canaux. Les nouveaux plugins de canal
doivent utiliser `openclaw/plugin-sdk/channel-outbound` pour les assistants de
cycle de vie des messages, d’accusé de réception, d’envoi durable et d’aperçu en
direct, au lieu d’ajouter de nouveaux assistants aux sous-chemins obsolètes.

Plan de suppression : conserver ces alias pendant la période de migration des
plugins externes, puis les supprimer lors du prochain nettoyage majeur du SDK,
une fois les appelants migrés vers `channel-outbound`.
