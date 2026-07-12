---
read_when:
    - Chcesz korzystać z generowania obrazów fal w OpenClaw
    - Potrzebujesz procesu uwierzytelniania FAL_KEY
    - Chcesz użyć domyślnych ustawień fal dla image_generate, video_generate lub music_generate
summary: Konfiguracja generowania obrazów, filmów i muzyki za pomocą fal w OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T15:32:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw zawiera wbudowanego dostawcę `fal` do hostowanego generowania obrazów, filmów i muzyki.

| Właściwość       | Wartość                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Dostawca         | `fal`                                                                                       |
| Uwierzytelnianie | `FAL_KEY` (kanoniczna; `FAL_API_KEY` działa również jako wartość zapasowa)                   |
| API              | punkty końcowe modeli fal (`https://fal.run`; zadania wideo używają `https://queue.fal.run`) |
| Bazowy adres URL | Zastąp za pomocą `models.providers.fal.baseUrl`                                              |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Konfiguracje nieinteraktywne mogą przekazać `--fal-api-key <key>` lub wyeksportować `FAL_KEY`.
    Proces wdrażania ustawia również `fal/fal-ai/flux/dev` jako domyślny model obrazu, jeśli
    żaden nie został skonfigurowany.

  </Step>
  <Step title="Ustaw domyślny model obrazu">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Generowanie obrazów

Wbudowany dostawca generowania obrazów `fal` domyślnie używa
`fal/fal-ai/flux/dev`.

| Możliwość             | Wartość                                                              |
| --------------------- | -------------------------------------------------------------------- |
| Maksymalna liczba obrazów | 4 na żądanie; Krea 2: 1 na żądanie                               |
| Zastępowanie rozmiaru | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`      |
| Proporcje obrazu      | Obsługiwane wszędzie z wyjątkiem przekształcania obrazu w obraz Flux |
| Rozdzielczość         | `1K`, `2K`, `4K` (ograniczenia poszczególnych modeli poniżej)        |
| Format wyjściowy      | `png` (domyślnie) lub `jpeg`; Krea 2 odrzuca zastąpienia `outputFormat` |

Żądania edycji (obrazy referencyjne przekazywane przez współdzielone parametry `image` / `images`)
są kierowane do punktu końcowego edycji odpowiedniego modelu, z limitami obrazów referencyjnych zależnymi od modelu:

| Rodzina modeli             | Odwołanie do modelu po `fal/`         | Punkt końcowy edycji | Maks. liczba obrazów referencyjnych |
| -------------------------- | ------------------------------------- | -------------------- | ---------------------------------- |
| Flux i inne modele fal     | `fal-ai/flux/dev` (domyślny)          | `/image-to-image`    | 1                                  |
| GPT Image                  | `openai/gpt-image-*`                  | `/edit`              | 10                                 |
| Grok Imagine               | `xai/grok-imagine-image`              | `/edit`              | 3                                  |
| Nano Banana (starszy)      | `fal-ai/nano-banana`                  | `/edit`              | 3                                  |
| Nano Banana 2              | `fal-ai/nano-banana-*`                | `/edit`              | 14                                 |
| Nano Banana 2 Lite         | `google/nano-banana-2-lite`           | `/edit`              | 14                                 |
| Krea 2                     | `krea/v2/{medium,large}/text-to-image` | brak (referencje stylu) | 10 referencji stylu              |

<Warning>
Żądania przekształcania obrazu w obraz Flux **nie** obsługują zastępowania `aspectRatio`. Żądania edycji GPT
Image i Nano Banana 2 używają punktu końcowego `/edit` fal i przyjmują
wskazówki dotyczące proporcji obrazu. Nano Banana 2 przyjmuje także dodatkowe natywne, szerokie i wysokie proporcje,
takie jak `4:1`, `1:4`, `8:1` oraz `1:8`; Krea 2 weryfikuje własny, mniejszy
podzbiór proporcji obrazu. Grok Imagine ma własną listę proporcji (obejmującą `2:1`,
`20:9`, `19.5:9` oraz ich odwrotności) i przyjmuje wyłącznie rozdzielczości `1K`/`2K`;
starszy Nano Banana oraz Nano Banana 2 Lite odrzucają zastąpienia `resolution`.
</Warning>

Modele Krea 2 używają natywnego schematu ładunku Krea w fal. OpenClaw wysyła
`aspect_ratio`, `creativity` oraz `image_style_references` zamiast
ogólnego ładunku `image_size` / punktu końcowego edycji używanego przez Flux. Odwołania do modeli to:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Użyj Medium do szybszych, ekspresyjnych ilustracji, anime, malarstwa i stylów
artystycznych. Użyj Large do wolniejszych, fotorealistycznych obrazów, surowych tekstur, ziarna
filmowego i szczegółowego wyglądu. Domyślną wartością Krea jest `fal.creativity: "medium"`; obsługiwane wartości to
`raw`, `low`, `medium` oraz `high`.

Krea 2 udostępnia proporcje obrazu, a nie `image_size`, w schemacie żądania fal. Preferuj
`aspectRatio`; OpenClaw mapuje `size` na najbliższe obsługiwane proporcje obrazu Krea
i odrzuca `resolution` dla Krea zamiast je pomijać.

Użyj `outputFormat: "png"`, jeśli chcesz uzyskać dane wyjściowe PNG z modeli fal udostępniających
`output_format`. fal nie deklaruje w OpenClaw jawnej opcji sterowania przezroczystym tłem,
dlatego `background: "transparent"` jest zgłaszane jako zignorowane
zastąpienie dla modeli fal.
Punkty końcowe Krea 2 nie udostępniają pola żądania `output_format` przez fal, dlatego
OpenClaw odrzuca zastąpienia `outputFormat` w żądaniach Krea.

Aby użyć Krea 2 Medium:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## Generowanie wideo

Wbudowany dostawca generowania wideo `fal` domyślnie używa
`fal/fal-ai/minimax/video-01-live`.

| Możliwość      | Wartość                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| Tryby          | Tekst na wideo, pojedynczy obraz referencyjny, referencja na wideo Seedance |
| Środowisko wykonawcze | Przepływ wysyłania, sprawdzania stanu i pobierania wyniku oparty na kolejce dla długotrwałych zadań |
| Limit czasu    | Domyślnie 20 minut na zadanie; stan sprawdzany co 5 sekund              |

<AccordionGroup>
  <Accordion title="Dostępne modele wideo">
    **MiniMax (domyślny):**

    - `fal/fal-ai/minimax/video-01-live`

    **Agent wideo HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling i Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    Żądania MiniMax Live i HeyGen wysyłają wyłącznie prompt oraz opcjonalny
    pojedynczy obraz referencyjny; inne zastąpienia nie są przekazywane. Modele Seedance
    przyjmują `aspectRatio`, `size`, `resolution`, czas trwania od 4 do 15 sekund oraz
    przełącznik dźwięku.

  </Accordion>

  <Accordion title="Przykład konfiguracji Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Przykład konfiguracji referencji na wideo Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Tryb referencji na wideo przyjmuje do 9 obrazów, 3 filmów i 3 referencji audio
    przez współdzielone parametry `images`, `videos` i `audioRefs` narzędzia `video_generate`,
    przy czym łączna liczba plików referencyjnych nie może przekraczać 12. Referencje audio wymagają
    co najmniej jednej referencji obrazu lub wideo w tym samym żądaniu.

  </Accordion>

  <Accordion title="Przykład konfiguracji agenta wideo HeyGen">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Generowanie muzyki

Wbudowany plugin `fal` rejestruje również dostawcę generowania muzyki dla
współdzielonego narzędzia `music_generate`.

| Możliwość       | Wartość                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Domyślny model   | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| Modele           | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Maksymalny czas trwania | 240 sekund                                                                                                        |
| Środowisko wykonawcze | Żądanie synchroniczne oraz pobranie wygenerowanego dźwięku                                                        |

Użyj fal jako domyślnego dostawcy muzyki:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` obsługuje jawnie podany tekst utworu oraz tryb instrumentalny,
ale nie oba jednocześnie w tym samym żądaniu. ACE-Step i Stable Audio to
punkty końcowe przekształcające prompt w dźwięk; wybierz je za pomocą zastąpienia `model`, gdy chcesz
użyć tych rodzin modeli. ACE-Step odrzuca jawnie podany tekst utworu; Stable Audio odrzuca
zarówno tekst utworu, jak i tryb instrumentalny.

<Tip>
Powyższe tabele i sekcje rozwijane obejmują rodziny modeli, które wbudowany dostawca fal
obsługuje w sposób specjalny. Inne identyfikatory punktów końcowych obrazów fal nadal można wybrać jako
model obrazu; są one traktowane jak Flux (ogólny ładunek `image_size`, jeden
obraz referencyjny przez `/image-to-image`).
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Współdzielone parametry narzędzia muzyki i wybór dostawcy.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Ustawienia domyślne agenta, w tym wybór modeli obrazu, wideo i muzyki.
  </Card>
</CardGroup>
