---
summary: Doorverwijzen naar /plugins/sdk-channel-outbound
title: API voor kanaalberichten
x-i18n:
    generated_at: "2026-07-12T09:15:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Deze pagina is verplaatst naar [API voor uitgaande kanaalberichten](/nl/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` en
`openclaw/plugin-sdk/channel-message-runtime` blijven verouderde
compatibiliteitssubpaden voor oudere plugins; beide zijn dunne aliassen voor
de gedeelde kern voor kanaalberichten. Nieuwe kanaalplugins moeten
`openclaw/plugin-sdk/channel-outbound` gebruiken voor de berichtlevenscyclus,
ontvangstbevestigingen, duurzaam verzenden en helpers voor livevoorbeelden,
in plaats van nieuwe helpers toe te voegen aan de verouderde subpaden.

Verwijderingsplan: behoud deze aliassen gedurende de migratieperiode voor
externe plugins en verwijder ze vervolgens bij de volgende grote
SDK-opschoning, nadat aanroepers zijn overgestapt op `channel-outbound`.
