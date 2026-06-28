---
read_when:
    - Matrix-clients bouwen die rijke OpenClaw-antwoorden weergeven
    - Debuggen van com.openclaw.presentation-gebeurtenisinhoud
summary: Matrix MessagePresentation-metadata voor clients die OpenClaw herkennen
title: Matrix-presentatiemetadata
x-i18n:
    generated_at: "2026-05-10T19:22:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw kan genormaliseerde `MessagePresentation`-metadata toevoegen aan uitgaande Matrix-`m.room.message`-gebeurtenissen onder `com.openclaw.presentation`.

Standaard Matrix-clients blijven de platte tekst `body` weergeven. Clients die OpenClaw ondersteunen kunnen de gestructureerde metadata lezen en native UI weergeven, zoals knoppen, keuzelijsten, contextrijen en scheidingslijnen.

## Gebeurtenisinhoud

De metadata wordt opgeslagen in Matrix-gebeurtenisinhoud:

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

`version` is de schemaversie voor Matrix-presentatiemetadata. `type` is een stabiele discriminator voor clients die OpenClaw ondersteunen. Clients moeten onbekende `type`-waarden, onbekende versies die ze niet veilig kunnen interpreteren en onbekende bloktypen negeren.

## Terugvalgedrag

OpenClaw geeft altijd een leesbare terugval in platte tekst weer in `body`. De gestructureerde metadata is aanvullend en mag niet vereist zijn voor basale Matrix-interoperabiliteit.

Niet-ondersteunde clients moeten de terugvaltekst blijven tonen. Clients die OpenClaw ondersteunen kunnen de voorkeur geven aan de gestructureerde metadata voor weergave, terwijl ze de terugvaltekst behouden voor kopiëren, zoeken, meldingen en toegankelijkheid.

## Ondersteunde blokken

De uitgaande Matrix-adapter adverteert ondersteuning voor:

- `buttons`
- `select`
- `context`
- `divider`

Clients moeten deze blokken behandelen als best-effort presentatiehints. Onbekende velden en onbekende bloktypen moeten worden genegeerd in plaats van ervoor te zorgen dat het volledige bericht niet kan worden weergegeven.

## Interacties

Deze metadata voegt geen Matrix-callbacksemantiek toe. Waarden van knoppen en selectieopties zijn terugval-interactiepayloads, meestal slash-commando's of tekstcommando's. Een Matrix-client die interactie wil ondersteunen, kan de geselecteerde waarde als normaal bericht terugsturen naar de ruimte.

Een knop met de waarde `/model deepseek/deepseek-chat` kan bijvoorbeeld worden afgehandeld door die waarde als versleuteld Matrix-tekstbericht in dezelfde ruimte te verzenden.

## Relatie tot goedkeuringsmetadata

`com.openclaw.presentation` is bedoeld voor algemene rijke berichtpresentatie.

Goedkeuringsprompts gebruiken de speciale `com.openclaw.approval`-metadata, omdat goedkeuringen veiligheidsgevoelige status, beslissingen en uitvoerings-/Plugin-details bevatten. Als beide metadatasleutels op dezelfde gebeurtenis aanwezig zijn, moeten clients de voorkeur geven aan de speciale goedkeuringsrenderer.

## Mediaberichten

Wanneer een antwoord meerdere media-URL's bevat, verzendt OpenClaw één Matrix-gebeurtenis per media-URL. Presentatiemetadata wordt alleen aan de eerste media-gebeurtenis toegevoegd, zodat clients één stabiele gestructureerde payload hebben en dubbele renderers worden vermeden.

Houd presentatiemetadata compact. Grote gebruikerszichtbare tekst moet in `body` blijven en het normale Matrix-pad voor tekstsegmentatie gebruiken.
