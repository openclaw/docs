---
read_when:
    - Stille streaming van Matrix instellen voor zelfgehoste Synapse of Tuwunel
    - Gebruikers willen alleen meldingen voor voltooide blokken, niet bij elke bewerking van het voorbeeld.
summary: Matrix-pushregels per ontvanger voor stille definitieve previewbewerkingen
title: Matrix-pushregels voor stille voorvertoningen
x-i18n:
    generated_at: "2026-07-16T15:19:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Wanneer `channels.matrix.streaming.mode` is ingesteld op `"quiet"`, streamt OpenClaw het antwoord door één voorbeeldgebeurtenis ter plaatse te bewerken. Voorbeelden worden verzonden als niet-meldende `m.notice`-gebeurtenissen en de definitieve bewerking wordt gemarkeerd met `content["com.openclaw.finalized_preview"] = true`. Matrix-clients melden die definitieve bewerking alleen als een pushregel per gebruiker overeenkomt met de markering. Deze pagina is bedoeld voor beheerders die Matrix zelf hosten en die regel voor elk ontvangend account willen installeren.

`streaming.mode: "progress"` rondt concepten via hetzelfde pad af, zodat dezelfde regel ook wordt geactiveerd voor afgeronde bewerkingen in de voortgangsmodus.

Als je alleen het standaardmeldingsgedrag van Matrix wilt, gebruik dan `streaming.mode: "partial"` of laat streaming uitgeschakeld. Zie [Matrix-kanaal instellen](/nl/channels/matrix#streaming-previews).

## Vereisten

- ontvangende gebruiker = de persoon die de melding moet ontvangen
- botgebruiker = het OpenClaw Matrix-account dat het antwoord verzendt
- gebruik het toegangstoken van de ontvangende gebruiker voor de onderstaande API-aanroepen
- laat `sender` in de pushregel overeenkomen met de volledige MXID van de botgebruiker
- het ontvangende account moet al werkende pushers hebben; regels voor stille voorbeelden werken alleen wanneer de normale pushbezorging van Matrix goed functioneert

## Stappen

<Steps>
  <Step title="Stille voorbeelden configureren">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Het toegangstoken van de ontvanger verkrijgen">
    Gebruik waar mogelijk opnieuw een bestaand clientsessietoken. Zo maak je een nieuw token aan:

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

  <Step title="Controleren of pushers bestaan">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Als er geen pushers worden geretourneerd, herstel dan eerst de normale pushbezorging van Matrix voor dit account voordat je doorgaat.

  </Step>

  <Step title="De overschrijvende pushregel installeren">
    Installeer een regel die overeenkomt met de markering voor het definitieve voorbeeld en met de bot-MXID als afzender:

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

    Vervang vóór uitvoering:

    - `https://matrix.example.org`: de basis-URL van je homeserver
    - `$USER_ACCESS_TOKEN`: het toegangstoken van de ontvangende gebruiker
    - `openclaw-finalized-preview-botname`: een regel-ID die per bot en per ontvanger uniek is (patroon: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: de MXID van je OpenClaw-bot, niet die van de ontvanger

  </Step>

  <Step title="Verifiëren">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Test daarna een gestreamd antwoord. In de stille modus toont de ruimte een stil conceptvoorbeeld en wordt er een melding verzonden zodra het blok of de beurt is voltooid.

  </Step>
</Steps>

Als je de regel later wilt verwijderen, voer dan `DELETE` uit op dezelfde regel-URL met het token van de ontvanger.

## Opmerkingen voor meerdere bots

Pushregels worden geïdentificeerd door `ruleId`: als je `PUT` opnieuw uitvoert voor dezelfde ID, wordt één regel bijgewerkt. Maak voor meerdere OpenClaw-bots die dezelfde ontvanger melden één regel per bot met een afzonderlijke overeenkomst voor de afzender.

Nieuwe door gebruikers gedefinieerde `override`-regels worden vóór de standaardonderdrukkingsregels van de server ingevoegd, zodat geen extra parameter voor de volgorde nodig is. De regel is alleen van invloed op tekstvoorbeelden die ter plaatse definitief kunnen worden gemaakt; media-antwoorden, terugvalopties voor verouderde voorbeelden en definitieve teksten die Matrix-vermeldingen zouden activeren, worden in plaats daarvan als normale meldende berichten bezorgd.

## Opmerkingen voor homeservers

<AccordionGroup>
  <Accordion title="Synapse">
    Er is geen speciale wijziging aan `homeserver.yaml` vereist. Als normale Matrix-meldingen deze gebruiker al bereiken, vormen het token van de ontvanger en de bovenstaande `pushrules`-aanroep de belangrijkste configuratiestap.

    Als je Synapse achter een reverse proxy of met workers uitvoert, zorg er dan voor dat `/_matrix/client/.../pushrules/` Synapse correct bereikt. Pushbezorging wordt afgehandeld door het hoofdproces of door `synapse.app.pusher` / geconfigureerde pusher-workers — zorg ervoor dat deze goed functioneren.

    De regel gebruikt de pushregelvoorwaarde `event_property_is` (MSC3758, pushregel v1.10), die in 2023 aan Synapse is toegevoegd. Oudere Synapse-versies accepteren de `PUT pushrules/...`-aanroep, maar laten de voorwaarde stilzwijgend nooit overeenkomen — werk Synapse bij als er geen melding binnenkomt bij een bewerking van een definitief voorbeeld.

  </Accordion>

  <Accordion title="Tuwunel">
    Dezelfde procedure als voor Synapse; voor de markering van het definitieve voorbeeld is geen Tuwunel-specifieke configuratie nodig.

    Als meldingen verdwijnen terwijl de gebruiker actief is op een ander apparaat, controleer dan of `suppress_push_when_active` is ingeschakeld. Tuwunel heeft deze optie toegevoegd in 1.4.2 (september 2025) en deze kan pushes naar andere apparaten opzettelijk onderdrukken zolang één apparaat actief is.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Matrix-kanaal instellen](/nl/channels/matrix)
- [Streamingconcepten](/nl/concepts/streaming)
