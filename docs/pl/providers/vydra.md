---
read_when:
- Chcesz generowania multimediów Vydra w OpenClaw
- You need Vydra API key setup guidance
summary: Używaj obrazów, wideo i mowy Vydra w OpenClaw
title: Vydra
x-i18n:
  generated_at: '2026-04-24T09:30:26Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
  source_path: providers/vydra.md
  workflow: 15
---

Dołączony Plugin Vydra dodaje:

- Generowanie obrazów przez `vydra/grok-imagine`
- Generowanie wideo przez `vydra/veo3` i `vydra/kling`
- Syntezę mowy przez trasę TTS Vydra opartą na ElevenLabs

OpenClaw używa tego samego `VYDRA_API_KEY` dla wszystkich trzech możliwości.

<Warning>
Używaj `https://www.vydra.ai/api/v1` jako base URL.

Host apex Vydra (`https://vydra.ai/api/v1`) obecnie przekierowuje do `www`. Niektóre klienty HTTP usuwają `Authorization` przy takim przekierowaniu między hostami, co zamienia poprawny klucz API w mylący błąd auth. Dołączony Plugin używa bezpośrednio base URL z `www`, aby tego uniknąć.
</Warning>

## Konfiguracja

<Steps>
  <Step title="Uruchom interaktywny onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Albo ustaw zmienną środowiskową bezpośrednio:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Wybierz domyślną możliwość">
    Wybierz jedną lub więcej poniższych możliwości (obraz, wideo lub mowa) i zastosuj pasującą konfigurację.
  </Step>
</Steps>

## Możliwości

<AccordionGroup>
  <Accordion title="Generowanie obrazów">
    Domyślny model obrazu:

    - `vydra/grok-imagine`

    Ustaw go jako domyślnego providera obrazów:

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

    Obecna dołączona obsługa obejmuje tylko text-to-image. Hostowane trasy edycji Vydra oczekują zdalnych URL-i obrazów, a OpenClaw nie dodaje jeszcze mostu uploadu specyficznego dla Vydra w dołączonym Pluginie.

    <Note>
    Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać współdzielone parametry narzędzia, wybór providera i zachowanie failover.
    </Note>

  </Accordion>

  <Accordion title="Generowanie wideo">
    Zarejestrowane modele wideo:

    - `vydra/veo3` dla text-to-video
    - `vydra/kling` dla image-to-video

    Ustaw Vydra jako domyślnego providera wideo:

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

    Uwagi:

    - `vydra/veo3` jest dołączony tylko jako text-to-video.
    - `vydra/kling` obecnie wymaga odwołania do zdalnego URL obrazu. Przesyłanie lokalnych plików jest odrzucane z góry.
    - Obecna trasa HTTP `kling` Vydra bywa niespójna co do tego, czy wymaga `image_url` czy `video_url`; dołączony provider mapuje ten sam zdalny URL obrazu do obu pól.
    - Dołączony Plugin pozostaje zachowawczy i nie przekazuje nieudokumentowanych ustawień stylu, takich jak proporcje obrazu, rozdzielczość, watermark czy generowane audio.

    <Note>
    Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór providera i zachowanie failover.
    </Note>

  </Accordion>

  <Accordion title="Testy live wideo">
    Pokrycie live specyficzne dla providera:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Dołączony plik live Vydra obejmuje teraz:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video z użyciem zdalnego URL obrazu

    W razie potrzeby nadpisz fixture zdalnego obrazu:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Synteza mowy">
    Ustaw Vydra jako providera mowy:

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

    Wartości domyślne:

    - Model: `elevenlabs/tts`
    - Identyfikator głosu: `21m00Tcm4TlvDq8ikWAM`

    Dołączony Plugin obecnie udostępnia jeden sprawdzony domyślny głos i zwraca pliki audio MP3.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Katalog providerów" href="/pl/providers/index" icon="list">
    Przeglądaj wszystkich dostępnych providerów.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór providera.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór providera.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Ustawienia domyślne agentów i konfiguracja modeli.
  </Card>
</CardGroup>
