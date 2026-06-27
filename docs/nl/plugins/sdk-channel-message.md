---
summary: Redirect naar /plugins/sdk-channel-outbound
title: API voor kanaalberichten
x-i18n:
    generated_at: "2026-06-27T18:05:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Deze pagina is verplaatst naar [uitgaande kanaal-API](/nl/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` en
`openclaw/plugin-sdk/channel-message-runtime` blijven verouderde compatibiliteitssubpaden voor oudere plugins. Nieuwe kanaalplugins moeten `openclaw/plugin-sdk/channel-outbound` gebruiken voor de levenscyclus van berichten, ontvangstbewijzen, duurzame verzending en helpers voor livevoorvertoning. De verouderde subpaden zijn dunne aliassen bovenop de gedeelde kern voor kanaalberichten en de gerichte inkomende/uitgaande SDK-interfaces; voeg daar geen nieuwe helpers toe.

Verwijderingsplan: behoud deze aliassen gedurende de migratieperiode voor externe plugins en verwijder ze daarna bij de volgende grote SDK-opschoning nadat callers zijn overgestapt op `channel-outbound`.
