---
read_when:
    - Je wilt Vydra-mediageneratie in OpenClaw
    - Je hebt hulp nodig bij het instellen van de Vydra API-sleutel
summary: Gebruik beeld, video en spraak van Vydra in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-29T23:14:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 16
---

De meegeleverde Vydra-Plugin voegt toe:

- Afbeeldingsgeneratie via `vydra/grok-imagine`
- Videogeneratie via `vydra/veo3` en `vydra/kling`
- Spraaksynthese via Vydra's door ElevenLabs ondersteunde TTS-route

OpenClaw gebruikt dezelfde `VYDRA_API_KEY` voor alle drie de mogelijkheden.

<Warning>
Gebruik `https://www.vydra.ai/api/v1` als basis-URL.

Vydra's apex-host (`https://vydra.ai/api/v1`) leidt momenteel om naar `www`. Sommige HTTP-clients verwijderen `Authorization` bij die cross-host-omleiding, waardoor een geldige API-sleutel verandert in een misleidende authenticatiefout. De meegeleverde Plugin gebruikt de `www`-basis-URL rechtstreeks om dat te voorkomen.
</Warning>

## Instellen

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Of stel de omgevingsvariabele rechtstreeks in:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    Kies een of meer van de onderstaande mogelijkheden (afbeelding, video of spraak) en pas de bijbehorende configuratie toe.
  </Step>
</Steps>

## Mogelijkheden

<AccordionGroup>
  <Accordion title="Image generation">
    Standaard afbeeldingsmodel:

    - `vydra/grok-imagine`

    Stel dit in als standaardprovider voor afbeeldingen:

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

    De huidige meegeleverde ondersteuning is alleen tekst-naar-afbeelding. Vydra's gehoste bewerkingsroutes verwachten externe afbeeldings-URL's, en OpenClaw voegt in de meegeleverde Plugin nog geen Vydra-specifieke uploadbrug toe.

    <Note>
    Zie [Afbeeldingsgeneratie](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    Geregistreerde videomodellen:

    - `vydra/veo3` voor tekst-naar-video
    - `vydra/kling` voor afbeelding-naar-video

    Stel Vydra in als standaardprovider voor video:

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

    - `vydra/veo3` is alleen meegeleverd als tekst-naar-video.
    - `vydra/kling` vereist momenteel een externe afbeeldings-URL-verwijzing. Uploads van lokale bestanden worden vooraf geweigerd.
    - Vydra's huidige `kling`-HTTP-route is inconsistent geweest over of deze `image_url` of `video_url` vereist; de meegeleverde provider zet dezelfde externe afbeeldings-URL in beide velden.
    - De meegeleverde Plugin blijft conservatief en geeft geen ongedocumenteerde stijlknoppen door, zoals beeldverhouding, resolutie, watermerk of gegenereerde audio.

    <Note>
    Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    Providerspecifieke live-dekking:

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

  <Accordion title="Speech synthesis">
    Stel Vydra in als spraakprovider:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Standaarden:

    - Model: `elevenlabs/tts`
    - Stem-id: `21m00Tcm4TlvDq8ikWAM`

    De meegeleverde Plugin biedt momenteel een bekende goed werkende standaardstem en retourneert MP3-audiobestanden.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Provider directory" href="/nl/providers/index" icon="list">
    Blader door alle beschikbare providers.
  </Card>
  <Card title="Image generation" href="/nl/tools/image-generation" icon="image">
    Gedeelde afbeeldingstoolparameters en providerselectie.
  </Card>
  <Card title="Video generation" href="/nl/tools/video-generation" icon="video">
    Gedeelde videotoolparameters en providerselectie.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden en modelconfiguratie.
  </Card>
</CardGroup>
