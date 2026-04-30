---
read_when:
    - Chcesz skonfigurować Perplexity jako dostawcę wyszukiwania w sieci
    - Potrzebujesz klucza API Perplexity lub konfiguracji proxy OpenRouter
summary: Konfiguracja dostawcy wyszukiwania w sieci Perplexity (klucz API, tryby wyszukiwania, filtrowanie)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T10:14:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity zapewnia funkcje wyszukiwania w sieci za pośrednictwem Perplexity
Search API lub Perplexity Sonar przez OpenRouter.

<Note>
Ta strona dotyczy konfiguracji **dostawcy** Perplexity. Informacje o **narzędziu** Perplexity (jak agent go używa) znajdziesz w sekcji [narzędzie Perplexity](/pl/tools/perplexity-search).
</Note>

| Właściwość       | Wartość                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| Typ              | Dostawca wyszukiwania w sieci (nie dostawca modelu)                     |
| Uwierzytelnianie | `PERPLEXITY_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter) |
| Ścieżka konfiguracji | `plugins.entries.perplexity.config.webSearch.apiKey`                |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Uruchom interaktywny przepływ konfiguracji wyszukiwania w sieci:

    ```bash
    openclaw configure --section web
    ```

    Albo ustaw klucz bezpośrednio:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Rozpocznij wyszukiwanie">
    Agent automatycznie będzie używać Perplexity do wyszukiwań w sieci, gdy klucz zostanie
    skonfigurowany. Nie są wymagane żadne dodatkowe kroki.
  </Step>
</Steps>

## Tryby wyszukiwania

Plugin automatycznie wybiera transport na podstawie prefiksu klucza API:

<Tabs>
  <Tab title="Natywne Perplexity API (pplx-)">
    Gdy klucz zaczyna się od `pplx-`, OpenClaw używa natywnego Perplexity Search
    API. Ten transport zwraca uporządkowane wyniki i obsługuje filtry domeny, języka
    oraz daty (zobacz opcje filtrowania poniżej).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Gdy klucz zaczyna się od `sk-or-`, OpenClaw kieruje zapytania przez OpenRouter z użyciem
    modelu Perplexity Sonar. Ten transport zwraca odpowiedzi zsyntetyzowane przez AI wraz z
    cytowaniami.
  </Tab>
</Tabs>

| Prefiks klucza | Transport                    | Funkcje                                          |
| -------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`        | Natywne Perplexity Search API | Uporządkowane wyniki, filtry domeny/języka/daty |
| `sk-or-`       | OpenRouter (Sonar)           | Odpowiedzi zsyntetyzowane przez AI z cytowaniami |

## Filtrowanie w natywnym API

<Note>
Opcje filtrowania są dostępne tylko podczas używania natywnego Perplexity API
(klucz `pplx-`). Wyszukiwania OpenRouter/Sonar nie obsługują tych parametrów.
</Note>

Podczas używania natywnego Perplexity API wyszukiwania obsługują następujące filtry:

| Filtr          | Opis                                   | Przykład                            |
| -------------- | -------------------------------------- | ----------------------------------- |
| Kraj           | 2-literowy kod kraju                   | `us`, `de`, `jp`                    |
| Język          | Kod języka ISO 639-1                   | `en`, `fr`, `zh`                    |
| Zakres dat     | Okno aktualności                       | `day`, `week`, `month`, `year`      |
| Filtry domen   | Lista dozwolonych lub blokowanych domen (maks. 20 domen) | `example.com`                       |
| Budżet treści  | Limity tokenów na odpowiedź / na stronę | `max_tokens`, `max_tokens_per_page` |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów daemon">
    Jeśli OpenClaw Gateway działa jako daemon (launchd/systemd), upewnij się, że
    `PERPLEXITY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz ustawiony tylko w `~/.profile` nie będzie widoczny dla daemona launchd/systemd,
    chyba że to środowisko zostanie jawnie zaimportowane. Ustaw klucz w
    `~/.openclaw/.env` albo przez `env.shellEnv`, aby zapewnić, że proces Gateway może
    go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Konfiguracja proxy OpenRouter">
    Jeśli wolisz kierować wyszukiwania Perplexity przez OpenRouter, ustaw
    `OPENROUTER_API_KEY` (prefiks `sk-or-`) zamiast natywnego klucza Perplexity.
    OpenClaw wykryje prefiks i automatycznie przełączy się na transport Sonar.

    <Tip>
    Transport OpenRouter jest przydatny, jeśli masz już konto OpenRouter
    i chcesz skonsolidować rozliczenia u wielu dostawców.
    </Tip>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzie wyszukiwania Perplexity" href="/pl/tools/perplexity-search" icon="magnifying-glass">
    Jak agent wywołuje wyszukiwania Perplexity i interpretuje wyniki.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji, w tym wpisy Plugin.
  </Card>
</CardGroup>
