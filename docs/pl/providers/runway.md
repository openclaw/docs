---
read_when:
    - Chcesz korzystać z generowania filmów Runway w OpenClaw
    - Potrzebujesz klucza API Runway lub konfiguracji zmiennej środowiskowej
    - Chcesz ustawić Runway jako domyślnego dostawcę wideo
summary: Konfiguracja generowania filmów Runway w OpenClaw
title: Pas startowy
x-i18n:
    generated_at: "2026-07-12T15:31:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw zawiera wbudowanego dostawcę `runway` do hostowanego generowania wideo, domyślnie włączonego i zarejestrowanego zgodnie z kontraktem `videoGenerationProviders`.

| Właściwość                   | Wartość                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| Identyfikator dostawcy       | `runway`                                                                 |
| Plugin                       | wbudowany, `enabledByDefault: true`                                      |
| Zmienne środowiskowe uwierzytelniania | `RUNWAYML_API_SECRET` (kanoniczna) lub `RUNWAY_API_KEY`          |
| Flaga wdrażania              | `--auth-choice runway-api-key`                                           |
| Bezpośrednia flaga CLI       | `--runway-api-key <key>`                                                 |
| API                          | Zadaniowe generowanie wideo Runway (odpytywanie `GET /v1/tasks/{id}`)    |
| Model domyślny               | `runway/gen4.5`                                                          |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Ustaw Runway jako domyślnego dostawcę wideo">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Wygeneruj wideo">
    Poproś agenta o wygenerowanie wideo. Runway zostanie użyty automatycznie.
  </Step>
</Steps>

## Obsługiwane tryby i modele

Dostawca udostępnia siedem modeli Runway podzielonych na trzy tryby. Ten sam identyfikator modelu może obsługiwać więcej niż jeden tryb (na przykład `gen4.5` działa zarówno w trybie tekst-na-wideo, jak i obraz-na-wideo).

| Tryb           | Modele                                                                  | Dane wejściowe odniesienia |
| -------------- | ----------------------------------------------------------------------- | -------------------------- |
| Tekst-na-wideo | `gen4.5` (domyślny), `veo3.1`, `veo3.1_fast`, `veo3`                    | Brak                       |
| Obraz-na-wideo | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 obraz lokalny lub zdalny |
| Wideo-na-wideo | `gen4_aleph`                                                            | 1 wideo lokalne lub zdalne |

Lokalne odwołania do obrazów i wideo są obsługiwane za pomocą identyfikatorów URI danych.

| Proporcje obrazu         | Dozwolone wartości                          |
| ------------------------ | ------------------------------------------- |
| Tekst-na-wideo           | `16:9`, `9:16`                              |
| Edycje obrazów i wideo   | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Tryb wideo-na-wideo obecnie wymaga modelu `runway/gen4_aleph`. Inne identyfikatory modeli Runway odrzucają wejściowe odwołania do wideo.
</Warning>

<Note>
  Wybranie identyfikatora modelu Runway z niewłaściwej kolumny powoduje jawny błąd, zanim żądanie API opuści OpenClaw. Dostawca weryfikuje `model` względem listy dozwolonych modeli danego trybu (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) w pliku `extensions/runway/video-generation-provider.ts`.
</Note>

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Aliasy zmiennych środowiskowych">
    OpenClaw rozpoznaje zarówno `RUNWAYML_API_SECRET` (zmienną kanoniczną), jak i `RUNWAY_API_KEY`.
    Każda z tych zmiennych umożliwia uwierzytelnienie dostawcy Runway.
  </Accordion>

  <Accordion title="Odpytywanie zadań">
    Runway korzysta z zadaniowego API. Po przesłaniu żądania generowania OpenClaw
    odpytuje `GET /v1/tasks/{id}`, dopóki wideo nie będzie gotowe. Zachowanie
    odpytywania nie wymaga dodatkowej konfiguracji.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia, wybór dostawcy i zachowanie asynchroniczne.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agenta, w tym model generowania wideo.
  </Card>
</CardGroup>
