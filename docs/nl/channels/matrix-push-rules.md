---
read_when:
    - Stille streaming in Matrix instellen voor zelfgehoste Synapse of Tuwunel
    - Gebruikers willen alleen meldingen voor voltooide blokken, niet voor elke bewerking van het voorbeeld
summary: Matrix-pushregels per ontvanger voor stille bewerkingen van voltooide voorbeelden
title: Matrix-pushregels voor stille voorbeelden
x-i18n:
    generated_at: "2026-07-12T08:36:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Wanneer `channels.matrix.streaming` is ingesteld op `"quiet"`, streamt OpenClaw het antwoord door één voorbeeldgebeurtenis ter plekke te bewerken. Voorbeelden worden verzonden als niet-meldende `m.notice`-gebeurtenissen en de definitieve bewerking wordt gemarkeerd met `content["com.openclaw.finalized_preview"] = true`. Matrix-clients geven bij die definitieve bewerking alleen een melding als een pushregel per gebruiker overeenkomt met de markering. Deze pagina is bedoeld voor beheerders die Matrix zelf hosten en die regel voor elk account van een ontvanger willen installeren.

`streaming: "progress"` rondt concepten via hetzelfde pad af, zodat dezelfde regel ook wordt geactiveerd voor definitieve bewerkingen in de voortgangsmodus.

Als u alleen het standaardmeldingsgedrag van Matrix wilt, gebruikt u `streaming: "partial"` of schakelt u streaming uit. Zie [Matrix-kanaal instellen](/nl/channels/matrix#streaming-previews).

## Vereisten

- ontvangende gebruiker = de persoon die de melding moet ontvangen
- botgebruiker = het OpenClaw Matrix-account dat het antwoord verzendt
- gebruik het toegangstoken van de ontvangende gebruiker voor de onderstaande API-aanroepen
- laat `sender` in de pushregel overeenkomen met de volledige MXID van de botgebruiker
- het account van de ontvanger moet al werkende pushers hebben; regels voor stille voorbeelden werken alleen wanneer de normale pushbezorging van Matrix correct functioneert

## Stappen

<Steps>
  <Step title="Stille voorbeelden configureren">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Het toegangstoken van de ontvanger ophalen">
    Gebruik waar mogelijk opnieuw een bestaand clientsessietoken. Zo maakt u een nieuw token aan:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Controleren of er pushers bestaan">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Als er geen pushers worden geretourneerd, herstelt u eerst de normale pushbezorging van Matrix voor dit account voordat u doorgaat.

  </Step>

  <Step title="De overschrijvende pushregel installeren">
    Installeer een regel die overeenkomt met de markering voor het definitieve voorbeeld en met de MXID van de bot als afzender:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Vervang vóór het uitvoeren:

    - `https://matrix.example.org`: de basis-URL van uw homeserver
    - `$USER_ACCESS_TOKEN`: het toegangstoken van de ontvangende gebruiker
    - `openclaw-finalized-preview-botname`: een regel-ID die uniek is per bot en per ontvanger (patroon: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: de MXID van uw OpenClaw-bot, niet die van de ontvanger

  </Step>

  <Step title="Verifiëren">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Test vervolgens een gestreamd antwoord. In de stille modus toont de ruimte een stil conceptvoorbeeld en wordt één melding gegeven zodra het blok of de beurt is voltooid.

  </Step>
</Steps>

Als u de regel later wilt verwijderen, voert u een `DELETE` uit op dezelfde regel-URL met het token van de ontvanger.

## Opmerkingen voor meerdere bots

Pushregels worden geïdentificeerd door `ruleId`: als u `PUT` opnieuw uitvoert met dezelfde ID, wordt één regel bijgewerkt. Als meerdere OpenClaw-bots dezelfde ontvanger meldingen sturen, maakt u voor elke bot één regel met een afzonderlijke afzenderovereenkomst.

Nieuwe, door gebruikers gedefinieerde `override`-regels worden vóór de standaardonderdrukkingsregels van de server ingevoegd, zodat geen aanvullende ordeningsparameter nodig is. De regel is alleen van invloed op uitsluitend tekst bevattende voorbeeldbewerkingen die ter plekke kunnen worden afgerond; media-antwoorden, terugvalopties voor verouderde voorbeelden en definitieve teksten die Matrix-vermeldingen zouden activeren, worden in plaats daarvan als normale meldingsberichten bezorgd.

## Opmerkingen voor homeservers

<AccordionGroup>
  <Accordion title="Synapse">
    Er is geen speciale wijziging in `homeserver.yaml` vereist. Als normale Matrix-meldingen deze gebruiker al bereiken, vormen het token van de ontvanger en de bovenstaande `pushrules`-aanroep de belangrijkste configuratiestap.

    Als u Synapse achter een reverse proxy of met workers uitvoert, controleert u of `/_matrix/client/.../pushrules/` Synapse correct bereikt. Pushbezorging wordt afgehandeld door het hoofdproces of door `synapse.app.pusher`/geconfigureerde pusher-workers; zorg dat deze correct functioneren.

    De regel gebruikt de pushregelvoorwaarde `event_property_is` (MSC3758, pushregel v1.10), die in 2023 aan Synapse is toegevoegd. Oudere Synapse-versies accepteren de aanroep `PUT pushrules/...`, maar laten de voorwaarde ongemerkt nooit overeenkomen. Werk Synapse bij als er geen melding binnenkomt bij een definitieve voorbeeldbewerking.

  </Accordion>

  <Accordion title="Tuwunel">
    Dezelfde werkwijze als voor Synapse; er is geen Tuwunel-specifieke configuratie nodig voor de markering van het definitieve voorbeeld.

    Als meldingen verdwijnen terwijl de gebruiker op een ander apparaat actief is, controleert u of `suppress_push_when_active` is ingeschakeld. Tuwunel heeft deze optie toegevoegd in versie 1.4.2 (september 2025) en kan daarmee pushmeldingen naar andere apparaten bewust onderdrukken terwijl één apparaat actief is.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Matrix-kanaal instellen](/nl/channels/matrix)
- [Streamingconcepten](/nl/concepts/streaming)
