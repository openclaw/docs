---
read_when:
    - Werken met reacties in elk kanaal
    - Begrijpen hoe emoji-reacties per platform verschillen
summary: Semantiek van reactietools voor alle ondersteunde kanalen
title: Reacties
x-i18n:
    generated_at: "2026-04-29T23:25:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

De agent kan emoji-reacties aan berichten toevoegen en verwijderen met de `message`
tool met de actie `react`. Reactiegedrag verschilt per kanaal en transport.

## Hoe het werkt

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` is vereist bij het toevoegen van een reactie.
- Stel `emoji` in op een lege tekenreeks (`""`) om de reactie(s) van de bot te verwijderen.
- Stel `remove: true` in om een specifieke emoji te verwijderen (vereist een niet-lege `emoji`).

## Kanaalgedrag

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Lege `emoji` verwijdert alle reacties van de bot op het bericht.
    - `remove: true` verwijdert alleen de opgegeven emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Lege `emoji` verwijdert de reacties van de app op het bericht.
    - `remove: true` verwijdert alleen de opgegeven emoji.

  </Accordion>

  <Accordion title="Telegram">
    - Lege `emoji` verwijdert de reacties van de bot.
    - `remove: true` verwijdert ook reacties, maar vereist nog steeds een niet-lege `emoji` voor toolvalidatie.

  </Accordion>

  <Accordion title="WhatsApp">
    - Lege `emoji` verwijdert de botreactie.
    - `remove: true` wordt intern toegewezen aan een lege emoji (vereist nog steeds `emoji` in de toolaanroep).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Vereist een niet-lege `emoji`.
    - `remove: true` verwijdert die specifieke emoji-reactie.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gebruik de `feishu_reaction` tool met de acties `add`, `remove` en `list`.
    - Toevoegen/verwijderen vereist `emoji_type`; verwijderen vereist ook `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Inkomende reactiemeldingen worden beheerd door `channels.signal.reactionNotifications`: `"off"` schakelt ze uit, `"own"` (standaard) genereert gebeurtenissen wanneer gebruikers reageren op botberichten, en `"all"` genereert gebeurtenissen voor alle reacties.

  </Accordion>
</AccordionGroup>

## Reactieniveau

De configuratie `reactionLevel` per kanaal bepaalt hoe breed de agent reacties gebruikt. Waarden zijn meestal `off`, `ack`, `minimal` of `extensive`.

- [Telegram reactionLevel](/nl/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/nl/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Stel `reactionLevel` in op afzonderlijke kanalen om af te stemmen hoe actief de agent op elk platform op berichten reageert.

## Gerelateerd

- [Agent verzenden](/nl/tools/agent-send) — de `message` tool die `react` bevat
- [Kanalen](/nl/channels) — kanaalspecifieke configuratie
