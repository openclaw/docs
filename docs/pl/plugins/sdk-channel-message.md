---
summary: Przekieruj do /plugins/sdk-channel-outbound
title: API wiadomości kanału
x-i18n:
    generated_at: "2026-07-12T15:31:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Ta strona została przeniesiona do [interfejsu API wysyłania kanału](/pl/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` oraz
`openclaw/plugin-sdk/channel-message-runtime` pozostają przestarzałymi podścieżkami
zgodności dla starszych pluginów; obie są cienkimi aliasami wspólnego rdzenia
wiadomości kanału. Nowe pluginy kanałów powinny używać
`openclaw/plugin-sdk/channel-outbound` do obsługi cyklu życia wiadomości, potwierdzeń,
trwałego wysyłania oraz podglądu na żywo, zamiast dodawać nowe funkcje pomocnicze do
przestarzałych podścieżek.

Plan usunięcia: zachować te aliasy przez okres migracji zewnętrznych pluginów,
a następnie usunąć je podczas kolejnego dużego porządkowania SDK, gdy kod wywołujący
zostanie przeniesiony do `channel-outbound`.
