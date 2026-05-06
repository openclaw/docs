---
read_when:
    - Je wilt Vydra-mediageneratie in OpenClaw
    - Je hebt hulp nodig bij het instellen van een Vydra API-sleutel
summary: Gebruik Vydra voor afbeeldingen, video en spraak in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T09:30:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

De gebundelde Vydra-plugin voegt toe:

- Afbeeldingen genereren via `vydra/grok-imagine`
- Video's genereren via `vydra/veo3` en `vydra/kling`
- Spraaksynthese via Vydra's door ElevenLabs ondersteunde TTS-route

OpenClaw gebruikt dezelfde `VYDRA_API_KEY` voor alle drie mogelijkheden.

| Eigenschap      | Waarde                                                                    |
| --------------- | ------------------------------------------------------------------------- |
| Provider-id     | `vydra`                                                                   |
| Plugin          | gebundeld, `enabledByDefault: true`                                       |
| Auth-env-var    | `VYDRA_API_KEY`                                                           |
| Onboarding-flag | `--auth-choice vydra-api-key`                                             |
| Directe CLI-flag | `--vydra-api-key <key>`                                                   |
| Contracten      | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Basis-URL       | `https://www.vydra.ai/api/v1` (gebruik de `www`-host)                    |

<Warning>
  Gebruik `https://www.vydra.ai/api/v1` als basis-URL. Vydra's apex-host (`https://vydra.ai/api/v1`) verwijst momenteel door naar `www`. Sommige HTTP-clients verwijderen `Authorization` bij die cross-host-doorverwijzing, waardoor een geldige API-sleutel verandert in een misleidende auth-fout. De gebundelde plugin gebruikt direct de `www`-basis-URL om dat te voorkomen.
</Warning>

## Instellen

<Steps>
  <Step title="Voer interactieve onboarding uit">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Of stel de env-var direct in:

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
  <Accordion title="Afbeeldingen genereren">
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

    De huidige gebundelde ondersteuning is alleen tekst-naar-afbeelding. Vydra's gehoste bewerkingsroutes verwachten externe afbeeldings-URL's, en OpenClaw voegt nog geen Vydra-specifieke uploadbrug toe in de gebundelde plugin.

    <Note>
    Zie [Afbeeldingen genereren](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failover-gedrag.
    </Note>

  </Accordion>

  <Accordion title="Video's genereren">
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

    - `vydra/veo3` is alleen als tekst-naar-video gebundeld.
    - `vydra/kling` vereist momenteel een externe afbeeldings-URL-referentie. Lokale bestandsuploads worden vooraf geweigerd.
    - Vydra's huidige `kling`-HTTP-route is inconsistent geweest over de vraag of `image_url` of `video_url` vereist is; de gebundelde provider koppelt dezelfde externe afbeeldings-URL aan beide velden.
    - De gebundelde plugin blijft conservatief en stuurt geen ongedocumenteerde stijlknoppen door, zoals beeldverhouding, resolutie, watermerk of gegenereerde audio.

    <Note>
    Zie [Video's genereren](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failover-gedrag.
    </Note>

  </Accordion>

  <Accordion title="Video-live-tests">
    Provider-specifieke live-dekking:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Het gebundelde Vydra-livebestand dekt nu:

    - `vydra/veo3` tekst-naar-video
    - `vydra/kling` afbeelding-naar-video met een externe afbeeldings-URL

    Overschrijf de externe afbeeldingsfixture wanneer nodig:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Spraaksynthese">
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

    Standaardwaarden:

    - Model: `elevenlabs/tts`
    - Stem-id: `21m00Tcm4TlvDq8ikWAM`

    De gebundelde plugin biedt momenteel een bekende, goed werkende standaardstem en retourneert MP3-audiobestanden.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Providerdirectory" href="/nl/providers/index" icon="list">
    Blader door alle beschikbare providers.
  </Card>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Gedeelde afbeeldings-toolparameters en providerselectie.
  </Card>
  <Card title="Video's genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde video-toolparameters en providerselectie.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults" icon="gear">
    Agentstandaarden en modelconfiguratie.
  </Card>
</CardGroup>
