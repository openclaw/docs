---
read_when:
    - Chcesz używać generowania filmów PixVerse w OpenClaw
    - Potrzebujesz konfiguracji klucza API i zmiennych środowiskowych PixVerse
    - Chcesz ustawić PixVerse jako domyślnego dostawcę wideo
summary: Konfiguracja generowania wideo PixVerse w OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T15:33:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw udostępnia `pixverse` jako oficjalny zewnętrzny plugin do generowania filmów za pomocą hostowanej usługi PixVerse. Plugin rejestruje dostawcę `pixverse` zgodnie z kontraktem `videoGenerationProviders`.

| Właściwość                | Wartość                                                                     |
| ------------------------- | --------------------------------------------------------------------------- |
| Identyfikator dostawcy    | `pixverse`                                                                  |
| Pakiet pluginu            | `@openclaw/pixverse-provider`                                               |
| Zmienna środowiskowa uwierzytelniania | `PIXVERSE_API_KEY`                                             |
| Flaga wdrażania           | `--auth-choice pixverse-api-key`                                            |
| Bezpośrednia flaga CLI    | `--pixverse-api-key <key>`                                                  |
| API                       | PixVerse Platform API v2 (przesłanie `video_id` i odpytywanie o wynik)      |
| Model domyślny             | `pixverse/v6`                                                               |
| Domyślny region API       | Międzynarodowy                                                              |

## Pierwsze kroki

<Steps>
  <Step title="Zainstaluj plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Ustaw klucz API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Kreator prosi o wybranie punktu końcowego International lub CN (zobacz region API
    poniżej), zanim zapisze `region` i `baseUrl` w konfiguracji dostawcy.
    Uruchomienia nieinteraktywne (klucz z `--pixverse-api-key` lub `PIXVERSE_API_KEY`)
    domyślnie używają regionu International.

    Wdrażanie ustawia również `agents.defaults.videoGenerationModel.primary` na
    `pixverse/v6`, jeśli nie skonfigurowano jeszcze domyślnego modelu generowania filmów.

  </Step>
  <Step title="Zmień istniejącego domyślnego dostawcę generowania filmów (opcjonalnie)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Wygeneruj film">
    Poproś agenta o wygenerowanie filmu. PixVerse zostanie użyty automatycznie.
  </Step>
</Steps>

## Obsługiwane tryby i modele

Dostawca udostępnia modele generowania PixVerse za pośrednictwem współdzielonego narzędzia wideo OpenClaw.

| Tryb             | Modele               | Dane wejściowe odniesienia |
| ---------------- | -------------------- | -------------------------- |
| Tekst na film    | `v6` (domyślny), `c1` | Brak                      |
| Obraz na film    | `v6` (domyślny), `c1` | 1 obraz lokalny lub zdalny |

Lokalne obrazy odniesienia są przesyłane do PixVerse przed żądaniem przekształcenia obrazu w film. Adresy URL zdalnych obrazów są przekazywane do punktu końcowego przesyłania obrazów PixVerse jako `image_url`.

| Opcja              | Obsługiwane wartości                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Czas trwania       | 1–15 sekund (domyślnie 5)                                                                                                                       |
| Rozdzielczość      | `360P`, `540P`, `720P`, `1080P` (domyślnie `540P`; żądania `480P` są mapowane na `540P`)                                                        |
| Proporcje obrazu   | `16:9` (domyślnie), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; tylko tekst na film, obraz na film zachowuje proporcje obrazu źródłowego |
| Generowany dźwięk  | `audio: true`                                                                                                                                   |

<Note>
Generowanie obrazów na podstawie szablonów PixVerse nie jest jeszcze udostępniane przez `image_generate`. To API korzysta z identyfikatorów szablonów, natomiast współdzielony kontrakt generowania obrazów OpenClaw nie zawiera obecnie typowanego zestawu opcji specyficznych dla PixVerse.
</Note>

## Opcje dostawcy

Dostawca generowania filmów przyjmuje następujące opcjonalne klucze specyficzne dla dostawcy:

| Opcja                                | Typ    | Działanie                                                |
| ------------------------------------ | ------ | -------------------------------------------------------- |
| `seed`                               | liczba | Deterministyczne ziarno od 0 do 2147483647               |
| `negativePrompt` / `negative_prompt` | ciąg   | Negatywny prompt                                         |
| `quality`                            | ciąg   | Jakość PixVerse, na przykład `720p`                      |
| `motionMode` / `motion_mode`         | ciąg   | Tryb ruchu obrazu na film (domyślnie `normal`)           |
| `cameraMovement` / `camera_movement` | ciąg   | Ustawienie wstępne ruchu kamery PixVerse                 |
| `templateId` / `template_id`         | liczba | Identyfikator aktywowanego szablonu PixVerse             |

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Region API">
    | Wartość regionu  | Bazowy adres URL API PixVerse                    |
    | ---------------- | ------------------------------------------------ |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`         |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`       |

    Ustaw ręcznie `models.providers.pixverse.region`, gdy klucz należy do
    konkretnego regionu platformy PixVerse, albo uruchom
    `openclaw onboard --auth-choice pixverse-api-key`, aby wybrać region w
    kreatorze konfiguracji:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Niestandardowy bazowy adres URL">
    Ustaw `models.providers.pixverse.baseUrl` tylko w przypadku kierowania ruchu przez zaufane, zgodne proxy.
    `baseUrl` ma pierwszeństwo przed `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Odpytywanie o stan zadania">
    PixVerse zwraca `video_id` z żądania generowania. OpenClaw odpytuje
    `/openapi/v2/video/result/{video_id}` co 5 sekund, aż zadanie
    zakończy się powodzeniem, niepowodzeniem lub przekroczy limit czasu (domyślnie 5 minut; można go zmienić za pomocą
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie filmów" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia, wybór dostawcy i zachowanie asynchroniczne.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agenta, w tym model generowania filmów.
  </Card>
</CardGroup>
