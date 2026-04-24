---
read_when:
    - Chcesz używać generowania wideo Runway w OpenClaw
    - Potrzebujesz konfiguracji klucza API i zmiennych środowiskowych Runway
    - Chcesz ustawić Runway jako domyślnego dostawcę wideo
summary: Konfiguracja generowania wideo Runway w OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-24T09:29:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw zawiera dołączonego dostawcę `runway` do hostowanego generowania wideo.

| Właściwość | Wartość                                                            |
| ----------- | ------------------------------------------------------------------ |
| Identyfikator dostawcy | `runway`                                                  |
| Uwierzytelnianie | `RUNWAYML_API_SECRET` (kanoniczne) lub `RUNWAY_API_KEY`     |
| API         | Generowanie wideo Runway oparte na zadaniach (polling `GET /v1/tasks/{id}`) |

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

## Obsługiwane tryby

| Tryb           | Model              | Wejście referencyjne         |
| -------------- | ------------------ | ---------------------------- |
| Tekst do wideo | `gen4.5` (domyślny) | Brak                         |
| Obraz do wideo | `gen4.5`           | 1 lokalny lub zdalny obraz   |
| Wideo do wideo | `gen4_aleph`       | 1 lokalne lub zdalne wideo   |

<Note>
Lokalne referencje obrazów i wideo są obsługiwane przez URI danych. Uruchomienia tylko tekstowe
obecnie udostępniają proporcje `16:9` i `9:16`.
</Note>

<Warning>
Wideo do wideo obecnie wymaga konkretnie `runway/gen4_aleph`.
</Warning>

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
    OpenClaw rozpoznaje zarówno `RUNWAYML_API_SECRET` (kanoniczne), jak i `RUNWAY_API_KEY`.
    Każda z tych zmiennych uwierzytelni dostawcę Runway.
  </Accordion>

  <Accordion title="Polling zadań">
    Runway używa API opartego na zadaniach. Po wysłaniu żądania generowania OpenClaw
    odpytuje `GET /v1/tasks/{id}`, aż wideo będzie gotowe. Dla tego zachowania pollingowego
    nie jest potrzebna żadna dodatkowa konfiguracja.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia, wybór dostawcy i zachowanie asynchroniczne.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agenta, w tym model generowania wideo.
  </Card>
</CardGroup>
