---
read_when:
    - Chcesz generować multimedia Vydra w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji klucza API Vydra
summary: Korzystaj z obrazów, wideo i mowy Vydra w OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T09:28:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Wbudowany Plugin Vydra dodaje:

- Generowanie obrazów przez `vydra/grok-imagine`
- Generowanie wideo przez `vydra/veo3` i `vydra/kling`
- Syntezę mowy przez obsługiwaną przez ElevenLabs trasę TTS Vydra

OpenClaw używa tego samego `VYDRA_API_KEY` dla wszystkich trzech możliwości.

| Właściwość        | Wartość                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Identyfikator dostawcy     | `vydra`                                                                   |
| Plugin          | wbudowany, `enabledByDefault: true`                                         |
| Zmienna środowiskowa uwierzytelniania    | `VYDRA_API_KEY`                                                           |
| Flaga wdrażania | `--auth-choice vydra-api-key`                                             |
| Bezpośrednia flaga CLI | `--vydra-api-key <key>`                                                   |
| Kontrakty       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Bazowy URL        | `https://www.vydra.ai/api/v1` (użyj hosta `www`)                        |

<Warning>
  Użyj `https://www.vydra.ai/api/v1` jako bazowego URL. Host apex Vydra (`https://vydra.ai/api/v1`) obecnie przekierowuje do `www`. Niektóre klienty HTTP usuwają `Authorization` przy takim przekierowaniu między hostami, co zamienia prawidłowy klucz API w mylący błąd uwierzytelniania. Wbudowany Plugin używa bezpośrednio bazowego URL z `www`, aby tego uniknąć.
</Warning>

## Konfiguracja

<Steps>
  <Step title="Uruchom interaktywne wdrażanie">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Albo ustaw zmienną środowiskową bezpośrednio:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Wybierz domyślną możliwość">
    Wybierz jedną lub więcej z poniższych możliwości (obraz, wideo lub mowa) i zastosuj pasującą konfigurację.
  </Step>
</Steps>

## Możliwości

<AccordionGroup>
  <Accordion title="Generowanie obrazów">
    Domyślny model obrazu:

    - `vydra/grok-imagine`

    Ustaw go jako domyślnego dostawcę obrazów:

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

    Obecna wbudowana obsługa obejmuje tylko przekształcanie tekstu w obraz. Hostowane trasy edycji Vydra oczekują zdalnych adresów URL obrazów, a OpenClaw nie dodaje jeszcze mostka przesyłania specyficznego dla Vydra we wbudowanym Plugin.

    <Note>
    Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Generowanie wideo">
    Zarejestrowane modele wideo:

    - `vydra/veo3` do przekształcania tekstu w wideo
    - `vydra/kling` do przekształcania obrazu w wideo

    Ustaw Vydra jako domyślnego dostawcę wideo:

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

    - `vydra/veo3` jest wbudowany tylko jako model przekształcania tekstu w wideo.
    - `vydra/kling` obecnie wymaga odwołania do zdalnego adresu URL obrazu. Przesyłanie plików lokalnych jest odrzucane z góry.
    - Obecna trasa HTTP `kling` Vydra działała niespójnie pod względem tego, czy wymaga `image_url`, czy `video_url`; wbudowany dostawca mapuje ten sam zdalny adres URL obrazu do obu pól.
    - Wbudowany Plugin pozostaje zachowawczy i nie przekazuje nieudokumentowanych pokręteł stylu, takich jak proporcje, rozdzielczość, znak wodny czy wygenerowany dźwięk.

    <Note>
    Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Testy live wideo">
    Pokrycie live specyficzne dla dostawcy:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Wbudowany plik live Vydra obejmuje teraz:

    - `vydra/veo3` przekształcanie tekstu w wideo
    - `vydra/kling` przekształcanie obrazu w wideo z użyciem zdalnego adresu URL obrazu

    W razie potrzeby nadpisz zdalny fixture obrazu:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Synteza mowy">
    Ustaw Vydra jako dostawcę mowy:

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

    Wbudowany Plugin obecnie udostępnia jeden sprawdzony domyślny głos i zwraca pliki audio MP3.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Katalog dostawców" href="/pl/providers/index" icon="list">
    Przeglądaj wszystkich dostępnych dostawców.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazu i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agentów i konfiguracja modelu.
  </Card>
</CardGroup>
