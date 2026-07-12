---
read_when:
    - Matrix-clients bouwen die uitgebreide OpenClaw-antwoorden weergeven
    - Foutopsporing van de inhoud van com.openclaw.presentation-gebeurtenissen
summary: Matrix MessagePresentation-metadata voor OpenClaw-bewuste clients
title: Matrix-presentatiemetadata
x-i18n:
    generated_at: "2026-07-12T08:37:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw voegt genormaliseerde `MessagePresentation`-metadata toe aan uitgaande Matrix-`m.room.message`-gebeurtenissen onder de inhoudssleutel `com.openclaw.presentation`.

Standaard Matrix-clients blijven de platte tekst in `body` weergeven. Clients met ondersteuning voor OpenClaw kunnen de gestructureerde metadata lezen en systeemeigen UI-elementen weergeven, zoals knoppen, keuzelijsten, contextregels en scheidingslijnen.

## Gebeurtenisinhoud

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
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

- `version` is de versie van het metadataschema; de huidige versie is `1`. `type` is een stabiele discriminator en is altijd `"message.presentation"`. De Matrix-adapter verzendt alleen payloads met exact deze versie en dit type; clients moeten eveneens onbekende versies die ze niet veilig kunnen interpreteren, onbekende `type`-waarden en onbekende bloktypen negeren.
- `title` en `tone` (`info`, `success`, `warning`, `danger`, `neutral`) zijn optionele aanwijzingen.
- Knoppen en opties in keuzelijsten kunnen naast de verouderde tekenreeks `value` een getypeerde `action` bevatten (`{ "type": "command", "command": "/..." }` of `{ "type": "callback", "value": "..." }`). Geef de voorkeur aan `action` wanneer beide aanwezig zijn.

## Terugvalgedrag

OpenClaw geeft altijd een leesbare terugvaltekst zonder opmaak weer in `body`. De gestructureerde metadata is aanvullend en mag niet vereist zijn voor elementaire interoperabiliteit met Matrix.

Regels voor terugvalweergave:

- Inhoud van `title`, `text` en `context` wordt als regels zonder opmaak weergegeven.
- Knoppen met een `command`-actie worden weergegeven als ``label: `/command` ``, zodat de opdracht kopieerbaar blijft. Knoppen met een `callback`-actie of alleen een verouderde `value` worden uitsluitend met hun label weergegeven, zodat ondoorzichtige callbackwaarden privé blijven; uitgeschakelde knoppen worden altijd uitsluitend met hun label weergegeven. URL- en webapp-knoppen worden weergegeven als `label: URL`.
- `select`-blokken geven de tijdelijke aanduiding (of `Options:`) weer als kop, gevolgd door optieregels die uitsluitend het label bevatten.
- Als niets wordt weergegeven, bijvoorbeeld bij een presentatie die alleen uit een scheidingslijn bestaat, valt de hoofdtekst terug op `---`.

Niet-ondersteunde clients blijven de terugvaltekst tonen. Clients met ondersteuning voor OpenClaw kunnen voor de weergave de voorkeur geven aan de gestructureerde metadata, terwijl ze de terugvaltekst behouden voor kopiëren, zoeken, meldingen en toegankelijkheid.

## Ondersteunde blokken

De uitgaande Matrix-adapter vermeldt systeemeigen ondersteuning voor:

- `buttons`
- `select`
- `context`
- `divider`

`text`-blokken worden altijd ondersteund via de terugvaltekst. Behandel alle blokken als niet-gegarandeerde presentatieaanwijzingen; negeer onbekende velden en bloktypen in plaats van het volledige bericht te laten mislukken.

## Interacties

Deze metadata voegt geen callback-semantiek toe aan Matrix. Waarden van knoppen en keuzelijsten zijn terugvalpayloads voor interacties, doorgaans slash-opdrachten of tekstopdrachten. Een Matrix-client die interactie wil ondersteunen, bepaalt de besturingswaarde (`action.command`, vervolgens `action.value` en daarna `value`) en stuurt deze als een normaal bericht terug naar de ruimte.

Een knop met de waarde `/model deepseek/deepseek-chat` kan bijvoorbeeld worden verwerkt door die waarde als versleuteld Matrix-tekstbericht in dezelfde ruimte te verzenden.

## Relatie tot goedkeuringsmetadata

`com.openclaw.presentation` is bedoeld voor algemene, uitgebreide berichtpresentatie.

Goedkeuringsprompts gebruiken de specifieke metadata `com.openclaw.approval`, omdat goedkeuringen veiligheidsgevoelige status, beslissingen en uitvoerings-/Plugingegevens bevatten. Als beide metadatasleutels op dezelfde gebeurtenis aanwezig zijn, moeten clients de voorkeur geven aan de specifieke goedkeuringsweergave.

## Mediaberichten

Wanneer een antwoord meerdere media-URL's bevat, verzendt OpenClaw één Matrix-gebeurtenis per media-URL. Bijschrifttekst en presentatiemetadata worden alleen aan de eerste gebeurtenis toegevoegd, zodat clients één stabiele, gestructureerde payload ontvangen zonder dubbele weergavecomponenten. Dezelfde regel geldt wanneer lange tekst over meerdere gebeurtenissen wordt verdeeld: de metadata wordt alleen met de eerste gebeurtenis meegestuurd.

Houd presentatiemetadata compact. Lange, voor gebruikers zichtbare tekst moet in `body` blijven staan en het normale pad voor het opsplitsen van Matrix-tekst gebruiken.
