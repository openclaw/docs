---
read_when:
    - Chcesz używać generowania mediów Vydra w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji klucza API Vydra
summary: Używaj generowania obrazów, wideo i mowy Vydra w OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-07T09:49:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24006a687ed6f9792e7b2b10927cc7ad71c735462a92ce03d5fa7c2b2ee2fcc2
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Dołączona wtyczka Vydra dodaje:

- generowanie obrazów przez `vydra/grok-imagine`
- generowanie wideo przez `vydra/veo3` i `vydra/kling`
- syntezę mowy przez trasę TTS Vydra opartą na ElevenLabs

OpenClaw używa tego samego `VYDRA_API_KEY` dla wszystkich trzech możliwości.

## Ważny bazowy URL

Używaj `https://www.vydra.ai/api/v1`.

Host apex Vydra (`https://vydra.ai/api/v1`) obecnie przekierowuje do `www`. Niektórzy klienci HTTP usuwają `Authorization` przy takim przekierowaniu między hostami, co zamienia prawidłowy klucz API w mylący błąd uwierzytelniania. Dołączona wtyczka używa bezpośrednio bazowego URL `www`, aby tego uniknąć.

## Konfiguracja

Interaktywny onboarding:

```bash
openclaw onboard --auth-choice vydra-api-key
```

Albo ustaw bezpośrednio zmienną env:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Generowanie obrazów

Domyślny model obrazów:

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

Obecne wsparcie w dołączonej wtyczce obejmuje tylko text-to-image. Hostowane trasy edycji Vydra oczekują zdalnych URL obrazów, a OpenClaw nie dodaje jeszcze mostu uploadu specyficznego dla Vydra w dołączonej wtyczce.

Zobacz [Image Generation](/pl/tools/image-generation), aby poznać wspólne zachowanie narzędzia.

## Generowanie wideo

Zarejestrowane modele wideo:

- `vydra/veo3` dla text-to-video
- `vydra/kling` dla image-to-video

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

- `vydra/veo3` jest dołączony tylko jako text-to-video.
- `vydra/kling` obecnie wymaga odwołania do zdalnego URL obrazu. Upload lokalnych plików jest odrzucany z góry.
- Obecna trasa HTTP `kling` w Vydra bywa niespójna co do tego, czy wymaga `image_url`, czy `video_url`; dołączony dostawca mapuje ten sam zdalny URL obrazu do obu pól.
- Dołączona wtyczka pozostaje zachowawcza i nie przekazuje nieudokumentowanych ustawień stylu, takich jak aspect ratio, resolution, watermark czy generowane audio.

Pokrycie live specyficzne dla dostawcy:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_VYDRA_VIDEO=1 \
pnpm test:live -- extensions/vydra/vydra.live.test.ts
```

Dołączony plik live Vydra obejmuje teraz:

- `vydra/veo3` text-to-video
- `vydra/kling` image-to-video z użyciem zdalnego URL obrazu

W razie potrzeby nadpisz zdalną fixturę obrazu:

```bash
export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
```

Zobacz [Video Generation](/pl/tools/video-generation), aby poznać wspólne zachowanie narzędzia.

## Synteza mowy

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

- model: `elevenlabs/tts`
- voice id: `21m00Tcm4TlvDq8ikWAM`

Dołączona wtyczka obecnie udostępnia jeden sprawdzony domyślny głos i zwraca pliki audio MP3.

## Powiązane

- [Provider Directory](/pl/providers/index)
- [Image Generation](/pl/tools/image-generation)
- [Video Generation](/pl/tools/video-generation)
