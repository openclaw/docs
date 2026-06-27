---
read_when:
    - Werken met reacties in elk kanaal
    - Begrijpen hoe emoji-reacties per platform verschillen
summary: Reactietoolsemantiek in alle ondersteunde kanalen
title: Reacties
x-i18n:
    generated_at: "2026-06-27T18:29:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

De agent kan emoji-reacties op berichten toevoegen en verwijderen met de `message`
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
- Stel `remove: true` in om een specifieke emoji te verwijderen (vereist niet-lege `emoji`).
- Op kanalen die statusreacties ondersteunen, laat `trackToolCalls: true` op een
  reactie de runtime dat bericht met reactie gebruiken voor volgende
  voortgangsreacties van tools tijdens dezelfde beurt.

## Kanaalgedrag

<AccordionGroup>
  <Accordion title="Discord en Slack">
    - Lege `emoji` verwijdert alle reacties van de bot op het bericht.
    - `remove: true` verwijdert alleen de opgegeven emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Lege `emoji` verwijdert de reacties van de app op het bericht.
    - `remove: true` verwijdert alleen de opgegeven emoji.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Alleen reacties toevoegen: `emoji` is vereist en mag niet leeg zijn.
    - Reacties verwijderen wordt nog niet ondersteund; aanroepen met `remove: true` (of lege `emoji`) worden afgewezen met een duidelijke fout in plaats van stilzwijgend niets te doen.
    - Vereist dat de Talk-bot is geregistreerd met de functie `reaction` (zie [Nextcloud Talk-kanaaldocumentatie](/nl/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Lege `emoji` verwijdert de reacties van de bot.
    - `remove: true` verwijdert ook reacties, maar vereist nog steeds een niet-lege `emoji` voor toolvalidatie.

  </Accordion>

  <Accordion title="WhatsApp">
    - Lege `emoji` verwijdert de botreactie.
    - `remove: true` wordt intern toegewezen aan een lege emoji (vereist nog steeds `emoji` in de toolaanroep).
    - WhatsApp heeft één botreactieslot per bericht; statusreactie-updates vervangen dat slot in plaats van meerdere emoji te stapelen.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Vereist niet-lege `emoji`.
    - `remove: true` verwijdert die specifieke emoji-reactie.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gebruik de tool `feishu_reaction` met de acties `add`, `remove` en `list`.
    - Toevoegen/verwijderen vereist `emoji_type`; verwijderen vereist ook `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Meldingen voor inkomende reacties worden beheerd door `channels.signal.reactionNotifications`: `"off"` schakelt ze uit, `"own"` (standaard) verzendt gebeurtenissen wanneer gebruikers reageren op botberichten, en `"all"` verzendt gebeurtenissen voor alle reacties.

  </Accordion>

  <Accordion title="iMessage">
    - Uitgaande reacties zijn iMessage-tapbacks (`love`, `like`, `dislike`, `laugh`, `emphasize` en `question`).
    - Meldingen voor inkomende tapbacks worden beheerd door `channels.imessage.reactionNotifications`: `"off"` schakelt ze uit, `"own"` (standaard) verzendt gebeurtenissen wanneer gebruikers reageren op door de bot geschreven berichten, en `"all"` verzendt gebeurtenissen voor alle tapbacks van geautoriseerde afzenders.

  </Accordion>
</AccordionGroup>

## Reactieniveau

Per-kanaalconfiguratie `reactionLevel` bepaalt hoe breed de agent reacties gebruikt. Waarden zijn doorgaans `off`, `ack`, `minimal` of `extensive`.

- [Telegram reactionLevel](/nl/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/nl/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Stel `reactionLevel` in op afzonderlijke kanalen om af te stemmen hoe actief de agent op elk platform op berichten reageert.

## Gerelateerd

- [Agent Send](/nl/tools/agent-send) — de `message`-tool die `react` bevat
- [Kanalen](/nl/channels) — kanaalspecifieke configuratie
