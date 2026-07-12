---
read_when:
    - Chcesz generować multimedia za pomocą Vydra w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji klucza API Vydra
summary: Korzystanie z obrazów, wideo i mowy Vydra w OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T15:34:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Dołączony Plugin Vydra dodaje:

- Generowanie obrazów za pomocą `vydra/grok-imagine`
- Generowanie wideo za pomocą `vydra/veo3` (tekst na wideo) i `vydra/kling` (obraz na wideo)
- Syntezę mowy za pośrednictwem trasy TTS Vydra opartej na ElevenLabs

OpenClaw używa tego samego klucza `VYDRA_API_KEY` dla wszystkich trzech funkcji.

| Właściwość                  | Wartość                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| Identyfikator dostawcy      | `vydra`                                                                   |
| Plugin                      | dołączony, `enabledByDefault: true`                                       |
| Zmienna środowiskowa uwierz. | `VYDRA_API_KEY`                                                          |
| Flaga wdrażania             | `--auth-choice vydra-api-key`                                             |
| Bezpośrednia flaga CLI      | `--vydra-api-key <key>`                                                   |
| Kontrakty                   | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| Bazowy adres URL            | `https://www.vydra.ai/api/v1` (użyj hosta `www`)                          |

<Warning>
Użyj `https://www.vydra.ai/api/v1` jako bazowego adresu URL. Główny host domeny Vydra (`https://vydra.ai/api/v1`) obecnie przekierowuje do `www`. Niektóre klienty HTTP usuwają nagłówek `Authorization` podczas tego przekierowania między hostami, przez co prawidłowy klucz API powoduje mylący błąd uwierzytelniania. Aby temu zapobiec, dołączony Plugin normalizuje każdy skonfigurowany bazowy adres URL `vydra.ai` do `www.vydra.ai`.
</Warning>

## Konfiguracja

<Steps>
  <Step title="Uruchom interaktywne wdrażanie">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Możesz też bezpośrednio ustawić zmienną środowiskową:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Wybierz funkcję domyślną">
    Wybierz co najmniej jedną z poniższych funkcji (obraz, wideo lub mowa) i zastosuj odpowiednią konfigurację.
  </Step>
</Steps>

## Funkcje

<AccordionGroup>
  <Accordion title="Generowanie obrazów">
    Domyślny i jedyny dołączony model obrazów:

    - `vydra/grok-imagine`

    Ustaw go jako domyślnego dostawcę generowania obrazów:

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

    Dołączona obsługa obejmuje wyłącznie generowanie obrazów z tekstu, maksymalnie jednego obrazu na żądanie. Hostowane trasy edycji Vydra oczekują zdalnych adresów URL obrazów, a dołączony Plugin nie dodaje mostu przesyłania specyficznego dla Vydra.

    <Note>
    Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i działanie mechanizmu przełączania awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Generowanie wideo">
    Zarejestrowane modele wideo:

    - `vydra/veo3` do generowania wideo z tekstu (odrzuca wejściowe obrazy referencyjne)
    - `vydra/kling` do generowania wideo z obrazu (wymaga dokładnie jednego zdalnego adresu URL obrazu)

    Ustaw Vydra jako domyślnego dostawcę generowania wideo:

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

    - `vydra/kling` od razu odrzuca przesyłanie plików lokalnych; działa wyłącznie odwołanie do zdalnego adresu URL obrazu.
    - Trasa HTTP `kling` usługi Vydra nie zawsze zachowuje się spójnie w kwestii wymagania pola `image_url` lub `video_url`; dołączony dostawca wysyła ten sam zdalny adres URL obrazu w obu polach.
    - Dołączony Plugin zachowuje ostrożne podejście i nie przekazuje nieudokumentowanych parametrów stylu, takich jak proporcje obrazu, rozdzielczość, znak wodny czy generowany dźwięk.

    <Note>
    Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i działanie mechanizmu przełączania awaryjnego.
    </Note>

  </Accordion>

  <Accordion title="Testy na żywo generowania wideo">
    Testy na żywo specyficzne dla dostawcy:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Dołączony plik testów na żywo Vydra obejmuje:

    - generowanie wideo z tekstu przez `vydra/veo3`
    - generowanie wideo z obrazu przez `vydra/kling` przy użyciu zdalnego adresu URL obrazu

    W razie potrzeby zastąp zdalny obraz testowy:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Synteza mowy">
    Ustaw Vydra jako dostawcę syntezy mowy:

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
    - Identyfikator głosu: `21m00Tcm4TlvDq8ikWAM` („Rachel”)

    Dołączony Plugin udostępnia ten jeden sprawdzony domyślny głos i zwraca pliki dźwiękowe MP3.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Katalog dostawców" href="/pl/providers/index" icon="list">
    Przeglądaj wszystkich dostępnych dostawców.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agentów i konfiguracja modeli.
  </Card>
</CardGroup>
