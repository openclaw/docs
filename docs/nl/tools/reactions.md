---
read_when:
    - Werken aan reacties in elk kanaal
    - Begrijpen hoe emoji-reacties per platform verschillen
summary: Semantiek van de reactietool voor alle ondersteunde kanalen
title: Reacties
x-i18n:
    generated_at: "2026-05-03T21:38:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

De agent kan emoji-reacties op berichten toevoegen en verwijderen met de `message`-tool met de actie `react`. Reactiegedrag verschilt per kanaal en transport.

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
- Op kanalen die statusreacties ondersteunen, laat `trackToolCalls: true` op een reactie de runtime dat bericht met reactie gebruiken voor volgende reacties op toolvoortgang tijdens dezelfde beurt.

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

  <Accordion title="Telegram">
    - Lege `emoji` verwijdert de reacties van de bot.
    - `remove: true` verwijdert ook reacties, maar vereist nog steeds een niet-lege `emoji` voor toolvalidatie.

  </Accordion>

  <Accordion title="WhatsApp">
    - Lege `emoji` verwijdert de botreactie.
    - `remove: true` wordt intern toegewezen aan een lege emoji (vereist nog steeds `emoji` in de toolaanroep).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Vereist niet-lege `emoji`.
    - `remove: true` verwijdert die specifieke emoji-reactie.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gebruik de `feishu_reaction`-tool met de acties `add`, `remove` en `list`.
    - Toevoegen/verwijderen vereist `emoji_type`; verwijderen vereist ook `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Meldingen voor inkomende reacties worden beheerd door `channels.signal.reactionNotifications`: `"off"` schakelt ze uit, `"own"` (standaard) verzendt events wanneer gebruikers op botberichten reageren, en `"all"` verzendt events voor alle reacties.

  </Accordion>
</AccordionGroup>

## Reactieniveau

De per-kanaalconfiguratie `reactionLevel` bepaalt hoe breed de agent reacties gebruikt. Waarden zijn meestal `off`, `ack`, `minimal` of `extensive`.

- [Telegram reactionLevel](/nl/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/nl/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Stel `reactionLevel` in op afzonderlijke kanalen om af te stemmen hoe actief de agent op berichten reageert op elk platform.

## Gerelateerd

- [Agent Send](/nl/tools/agent-send) — de `message`-tool die `react` bevat
- [Kanalen](/nl/channels) — kanaalspecifieke configuratie
