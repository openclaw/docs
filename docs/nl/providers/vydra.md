---
read_when:
    - Je wilt Vydra-mediageneratie in OpenClaw
    - U hebt begeleiding nodig voor het instellen van de Vydra-API-sleutel
summary: Gebruik Vydra-afbeeldingen, -video en -spraak in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:15:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

De meegeleverde Vydra-Plugin voegt toe:

- Afbeeldingsgeneratie via `vydra/grok-imagine`
- Videogeneratie via `vydra/veo3` en `vydra/kling`
- Spraaksynthese via Vydra's door ElevenLabs ondersteunde TTS-route

OpenClaw gebruikt dezelfde `VYDRA_API_KEY` voor alle drie mogelijkheden.

| Eigenschap      | Waarde                                                                    |
| --------------- | ------------------------------------------------------------------------- |
| Provider-id     | `vydra`                                                                   |
| Plugin          | meegeleverd, `enabledByDefault: true`                                     |
| Auth-env-var    | `VYDRA_API_KEY`                                                           |
| Onboarding-vlag | `--auth-choice vydra-api-key`                                             |
| Directe CLI-vlag | `--vydra-api-key <key>`                                                  |
| Contracten      | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Basis-URL       | `https://www.vydra.ai/api/v1` (gebruik de `www`-host)                     |

<Warning>
  Gebruik `https://www.vydra.ai/api/v1` als basis-URL. Vydra's apex-host (`https://vydra.ai/api/v1`) verwijst momenteel door naar `www`. Sommige HTTP-clients laten `Authorization` weg bij die cross-host-redirect, waardoor een geldige API-sleutel verandert in een misleidende auth-fout. De meegeleverde Plugin gebruikt de `www`-basis-URL rechtstreeks om dat te vermijden.
</Warning>

## Installatie

<Steps>
  <Step title="Interactieve onboarding uitvoeren">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Of stel de env-var rechtstreeks in:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Kies een standaardmogelijkheid">
    Kies een of meer van de onderstaande mogelijkheden (afbeelding, video of spraak) en pas de bijbehorende configuratie toe.
  </Step>
</Steps>

## Mogelijkheden

<AccordionGroup>
  <Accordion title="Afbeeldingsgeneratie">
    Standaard afbeeldingsmodel:

    - `vydra/grok-imagine`

    Stel dit in als de standaard afbeeldingsprovider:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    De huidige meegeleverde ondersteuning is alleen tekst-naar-afbeelding. Vydra's gehoste bewerkingsroutes verwachten externe afbeeldings-URL's, en OpenClaw voegt nog geen Vydra-specifieke uploadbrug toe in de meegeleverde Plugin.

    <Note>
    Zie [Afbeeldingsgeneratie](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
    </Note>

  </Accordion>

  <Accordion title="Videogeneratie">
    Geregistreerde videomodellen:

    - `vydra/veo3` voor tekst-naar-video
    - `vydra/kling` voor afbeelding-naar-video

    Stel Vydra in als de standaard videoprovider:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Opmerkingen:

    - `vydra/veo3` wordt meegeleverd als alleen tekst-naar-video.
    - `vydra/kling` vereist momenteel een externe afbeeldings-URL-referentie. Lokale bestandsuploads worden vooraf geweigerd.
    - Vydra's huidige `kling`-HTTP-route is inconsistent geweest over de vraag of deze `image_url` of `video_url` vereist; de meegeleverde provider koppelt dezelfde externe afbeeldings-URL aan beide velden.
    - De meegeleverde Plugin blijft conservatief en stuurt geen ongedocumenteerde stijlknoppen door, zoals beeldverhouding, resolutie, watermerk of gegenereerde audio.

    <Note>
    Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
    </Note>

  </Accordion>

  <Accordion title="Live videotests">
    Provider-specifieke live dekking:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Het meegeleverde Vydra-livebestand dekt nu:

    - `vydra/veo3` tekst-naar-video
    - `vydra/kling` afbeelding-naar-video met een externe afbeeldings-URL

    Overschrijf de externe afbeeldingsfixture wanneer nodig:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Spraaksynthese">
    Stel Vydra in als de spraakprovider:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Standaarden:

    - Model: `elevenlabs/tts`
    - Stem-id: `21m00Tcm4TlvDq8ikWAM`

    De meegeleverde Plugin stelt momenteel een bekende, goed werkende standaardstem beschikbaar en retourneert MP3-audiobestanden.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Providerdirectory" href="/nl/providers/index" icon="list">
    Blader door alle beschikbare providers.
  </Card>
  <Card title="Afbeeldingsgeneratie" href="/nl/tools/image-generation" icon="image">
    Gedeelde afbeeldings-toolparameters en providerselectie.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde video-toolparameters en providerselectie.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden en modelconfiguratie.
  </Card>
</CardGroup>
