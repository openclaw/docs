---
read_when:
    - Chcesz korzystać z generowania wideo Runway w OpenClaw
    - Potrzebujesz klucza API Runway i konfiguracji środowiska
    - Chcesz ustawić Runway jako domyślnego dostawcę wideo
summary: Konfiguracja generowania wideo Runway w OpenClaw
title: Pas startowy
x-i18n:
    generated_at: "2026-05-06T09:27:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw dostarcza dołączonego dostawcę `runway` do hostowanego generowania wideo. Plugin jest domyślnie włączony i rejestruje dostawcę `runway` względem kontraktu `videoGenerationProviders`.

| Właściwość             | Wartość                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| Identyfikator dostawcy | `runway`                                                             |
| Plugin                 | dołączony, `enabledByDefault: true`                                  |
| Zmienne env auth       | `RUNWAYML_API_SECRET` (kanoniczna) lub `RUNWAY_API_KEY`              |
| Flaga onboardingu      | `--auth-choice runway-api-key`                                       |
| Bezpośrednia flaga CLI | `--runway-api-key <key>`                                             |
| API                    | Generowanie wideo Runway oparte na zadaniach (sondowanie `GET /v1/tasks/{id}`) |
| Model domyślny         | `runway/gen4.5`                                                      |

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

Dostawca udostępnia siedem modeli Runway podzielonych na trzy tryby. Ten sam identyfikator modelu może obsługiwać więcej niż jeden tryb (na przykład `gen4.5` działa zarówno dla tekstu na wideo, jak i obrazu na wideo).

| Tryb            | Modele                                                                 | Wejście referencyjne        |
| --------------- | ---------------------------------------------------------------------- | --------------------------- |
| Tekst na wideo  | `gen4.5` (domyślny), `veo3.1`, `veo3.1_fast`, `veo3`                  | Brak                        |
| Obraz na wideo  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 obraz lokalny lub zdalny  |
| Wideo na wideo  | `gen4_aleph`                                                           | 1 wideo lokalne lub zdalne  |

Lokalne referencje obrazów i wideo są obsługiwane przez identyfikatory URI danych.

| Proporcje obrazu        | Dozwolone wartości                          |
| ----------------------- | ------------------------------------------- |
| Tekst na wideo          | `16:9`, `9:16`                              |
| Edycje obrazu i wideo   | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Tryb wideo na wideo obecnie wymaga `runway/gen4_aleph`. Inne identyfikatory modeli Runway odrzucają wejścia z referencją wideo.
</Warning>

<Note>
  Wybranie identyfikatora modelu Runway z niewłaściwej kolumny powoduje jawny błąd, zanim żądanie API opuści OpenClaw. Dostawca sprawdza `model` względem listy dozwolonych wartości dla trybu (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) w `extensions/runway/video-generation-provider.ts`.
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
    OpenClaw rozpoznaje zarówno `RUNWAYML_API_SECRET` (kanoniczną), jak i `RUNWAY_API_KEY`.
    Każda z tych zmiennych uwierzytelni dostawcę Runway.
  </Accordion>

  <Accordion title="Sondowanie zadań">
    Runway używa API opartego na zadaniach. Po przesłaniu żądania generowania OpenClaw
    sonduje `GET /v1/tasks/{id}`, aż wideo będzie gotowe. Zachowanie sondowania nie wymaga
    dodatkowej konfiguracji.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia, wybór dostawcy i zachowanie asynchroniczne.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agenta, w tym model generowania wideo.
  </Card>
</CardGroup>
