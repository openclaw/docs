---
read_when:
    - Chcesz używać generowania obrazów fal w OpenClaw
    - Potrzebujesz przepływu uwierzytelniania FAL_KEY
    - Chcesz użyć domyślnych ustawień fal dla image_generate, video_generate lub music_generate
summary: Konfiguracja generowania obrazów, wideo i muzyki fal w OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:12:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw zawiera wbudowanego dostawcę `fal` do hostowanego generowania obrazów, wideo i muzyki.

| Właściwość | Wartość                                                               |
| ---------- | --------------------------------------------------------------------- |
| Dostawca   | `fal`                                                                 |
| Auth       | `FAL_KEY` (kanoniczny; `FAL_API_KEY` działa też jako opcja awaryjna) |
| API        | punkty końcowe modeli fal                                             |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
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

| Możliwość          | Wartość                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| Maks. liczba obrazów | 4 na żądanie; Krea 2: 1 na żądanie                                      |
| Tryb edycji        | Flux: 1 obraz referencyjny; GPT Image 2: 10; Nano Banana 2: 14           |
| Referencje stylu   | Krea 2: do 10 referencji stylu przez `image` / `images`                  |
| Nadpisania rozmiaru | Obsługiwane                                                             |
| Proporcje obrazu   | Obsługiwane dla generowania, Krea 2 oraz edycji GPT Image 2/Nano Banana 2 |
| Rozdzielczość      | Obsługiwana                                                              |
| Format wyjściowy   | `png` lub `jpeg`                                                         |

<Warning>
Żądania Flux image-to-image **nie** obsługują nadpisań `aspectRatio`. Żądania edycji GPT
Image 2 i Nano Banana 2 używają punktu końcowego `/edit` fal i akceptują
wskazówki dotyczące proporcji obrazu. Nano Banana 2 akceptuje też dodatkowe natywne szerokie/wysokie proporcje,
takie jak `4:1`, `1:4`, `8:1` i `1:8`; Krea 2 sprawdza własny mniejszy
podzbiór proporcji obrazu.
</Warning>

Modele Krea 2 używają natywnego schematu ładunku Krea w fal. OpenClaw wysyła
`aspect_ratio`, `creativity` i `image_style_references` zamiast
ogólnego ładunku `image_size` / punktu końcowego edycji używanego przez Flux. Referencje modeli to:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Użyj Medium do szybszych ekspresyjnych ilustracji, anime, malarstwa i stylów
artystycznych. Użyj Large do wolniejszych fotorealistycznych ujęć, surowych tekstur, ziarna filmowego i szczegółowych
wyglądów. Krea domyślnie używa `fal.creativity: "medium"`; obsługiwane wartości to
`raw`, `low`, `medium` i `high`.

Krea 2 udostępnia proporcje obrazu, a nie `image_size`, w schemacie żądania fal. Preferuj
`aspectRatio`; OpenClaw mapuje `size` na najbliższe obsługiwane proporcje obrazu Krea
i odrzuca `resolution` dla Krea zamiast je pomijać.

Użyj `outputFormat: "png"`, gdy chcesz uzyskać wyjście PNG z modeli fal, które udostępniają
`output_format`. fal nie deklaruje w OpenClaw jawnej kontroli przezroczystego tła,
więc `background: "transparent"` jest zgłaszane jako ignorowane
nadpisanie dla modeli fal.
Punkty końcowe Krea 2 nie udostępniają pola żądania `output_format` przez fal, więc
OpenClaw odrzuca nadpisania `outputFormat` dla żądań Krea.

Aby używać fal jako domyślnego dostawcy obrazów:

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

Aby używać Krea 2 Medium:

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

| Możliwość | Wartość                                                            |
| --------- | ------------------------------------------------------------------ |
| Tryby     | Tekst na wideo, referencja z pojedynczego obrazu, Seedance reference-to-video |
| Runtime   | Przepływ submit/status/result oparty na kolejce dla długotrwałych zadań |

<AccordionGroup>
  <Accordion title="Dostępne modele wideo">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

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

  <Accordion title="Przykład konfiguracji Seedance 2.0 reference-to-video">
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

    Reference-to-video akceptuje do 9 obrazów, 3 wideo i 3 referencje audio
    przez współdzielone parametry `video_generate` `images`, `videos` i `audioRefs`,
    z limitem maksymalnie 12 plików referencyjnych łącznie.

  </Accordion>

  <Accordion title="Przykład konfiguracji HeyGen video-agent">
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

Wbudowany Plugin `fal` rejestruje też dostawcę generowania muzyki dla
współdzielonego narzędzia `music_generate`.

| Możliwość       | Wartość                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Model domyślny  | `fal/fal-ai/minimax-music/v2.6`                                                                          |
| Modele          | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Runtime         | Żądanie synchroniczne oraz pobieranie wygenerowanego audio                                               |

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

`fal-ai/minimax-music/v2.6` obsługuje jawne teksty utworów i tryb instrumentalny.
ACE-Step i Stable Audio to punkty końcowe prompt-to-audio; wybierz je przy użyciu
nadpisania `model`, gdy chcesz użyć tych rodzin modeli.

<Tip>
Użyj `openclaw models list --provider fal`, aby zobaczyć pełną listę dostępnych modeli fal,
w tym wszystkie ostatnio dodane pozycje.
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
    Domyślne ustawienia agentów, w tym wybór modeli obrazów, wideo i muzyki.
  </Card>
</CardGroup>
