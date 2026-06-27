---
summary: Przekierowanie do /plugins/sdk-channel-outbound
title: API wiadomości kanału
x-i18n:
    generated_at: "2026-06-27T18:05:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Ta strona została przeniesiona do [Interfejs API wychodzący kanału](/pl/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` i
`openclaw/plugin-sdk/channel-message-runtime` pozostają przestarzałymi podścieżkami zgodności
dla starszych pluginów. Nowe pluginy kanałów powinny używać
`openclaw/plugin-sdk/channel-outbound` do obsługi cyklu życia wiadomości, potwierdzeń odbioru, trwałego
wysyłania i pomocników podglądu na żywo. Przestarzałe podścieżki są cienkimi aliasami wspólnego
rdzenia wiadomości kanału oraz wyspecjalizowanych powierzchni SDK dla ruchu przychodzącego/wychodzącego;
nie dodawaj tam nowych pomocników.

Plan usunięcia: zachowaj te aliasy przez okres migracji zewnętrznych pluginów,
a następnie usuń je podczas kolejnego dużego czyszczenia SDK, gdy wywołujący przejdą na
`channel-outbound`.
