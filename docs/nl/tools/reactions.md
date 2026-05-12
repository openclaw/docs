---
read_when:
    - Werken met reacties in elk kanaal
    - Inzicht in hoe emoji-reacties verschillen tussen platforms
summary: Semantiek van reactietools in alle ondersteunde kanalen
title: Reacties
x-i18n:
    generated_at: "2026-05-12T01:00:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

De agent kan emoji-reacties toevoegen aan en verwijderen van berichten met de `message`-tool met de actie `react`. Het gedrag van reacties verschilt per kanaal en transport.

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
- Op kanalen die statusreacties ondersteunen, kan `trackToolCalls: true` op een
  reactie de runtime dat bericht met reactie laten gebruiken voor daaropvolgende
  voortgangsreacties van tools tijdens dezelfde beurt.

## Kanaalgedrag

<AccordionGroup>
  <Accordion title="Discord en Slack">
    - Een lege `emoji` verwijdert alle reacties van de bot op het bericht.
    - `remove: true` verwijdert alleen de opgegeven emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Een lege `emoji` verwijdert de reacties van de app op het bericht.
    - `remove: true` verwijdert alleen de opgegeven emoji.

  </Accordion>

  <Accordion title="Telegram">
    - Een lege `emoji` verwijdert de reacties van de bot.
    - `remove: true` verwijdert ook reacties, maar vereist nog steeds een niet-lege `emoji` voor toolvalidatie.

  </Accordion>

  <Accordion title="WhatsApp">
    - Een lege `emoji` verwijdert de botreactie.
    - `remove: true` wordt intern toegewezen aan een lege emoji (vereist nog steeds `emoji` in de toolaanroep).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Vereist een niet-lege `emoji`.
    - `remove: true` verwijdert die specifieke emoji-reactie.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gebruik de `feishu_reaction`-tool met de acties `add`, `remove` en `list`.
    - Toevoegen/verwijderen vereist `emoji_type`; verwijderen vereist ook `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Meldingen voor inkomende reacties worden beheerd door `channels.signal.reactionNotifications`: `"off"` schakelt ze uit, `"own"` (standaard) geeft gebeurtenissen uit wanneer gebruikers reageren op botberichten, en `"all"` geeft gebeurtenissen uit voor alle reacties.

  </Accordion>

  <Accordion title="iMessage">
    - Uitgaande reacties zijn iMessage-tapbacks (`love`, `like`, `dislike`, `laugh`, `emphasize` en `question`).
    - Meldingen voor inkomende tapbacks worden beheerd door `channels.imessage.reactionNotifications`: `"off"` schakelt ze uit, `"own"` (standaard) geeft gebeurtenissen uit wanneer gebruikers reageren op berichten die door de bot zijn geschreven, en `"all"` geeft gebeurtenissen uit voor alle tapbacks van geautoriseerde afzenders.

  </Accordion>
</AccordionGroup>

## Reactieniveau

De per-kanaalconfiguratie `reactionLevel` bepaalt hoe breed de agent reacties gebruikt. Waarden zijn doorgaans `off`, `ack`, `minimal` of `extensive`.

- [Telegram reactionLevel](/nl/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/nl/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Stel `reactionLevel` in op afzonderlijke kanalen om af te stemmen hoe actief de agent op berichten reageert op elk platform.

## Gerelateerd

- [Agent Send](/nl/tools/agent-send) — de `message`-tool die `react` bevat
- [Kanalen](/nl/channels) — kanaalspecifieke configuratie
