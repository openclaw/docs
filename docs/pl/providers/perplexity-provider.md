---
read_when:
    - Chcesz skonfigurować Perplexity jako dostawcę wyszukiwania w sieci@endsection to=final code
    - Potrzebujesz klucza API Perplexity lub konfiguracji proxy OpenRouter
summary: Konfiguracja dostawcy wyszukiwania w sieci Perplexity (klucz API, tryby wyszukiwania, filtrowanie)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T09:29:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (dostawca wyszukiwania w sieci)

Plugin Perplexity zapewnia możliwości wyszukiwania w sieci przez API Perplexity
Search lub Perplexity Sonar przez OpenRouter.

<Note>
Ta strona dotyczy konfiguracji **dostawcy** Perplexity. W przypadku **narzędzia**
Perplexity (jak agent z niego korzysta) zobacz [Perplexity tool](/pl/tools/perplexity-search).
</Note>

| Właściwość | Wartość                                                               |
| ---------- | --------------------------------------------------------------------- |
| Typ        | Dostawca wyszukiwania w sieci (nie dostawca modeli)                   |
| Uwierzytelnianie | `PERPLEXITY_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter) |
| Ścieżka konfiguracji | `plugins.entries.perplexity.config.webSearch.apiKey`          |

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
  <Step title="Zacznij wyszukiwać">
    Agent automatycznie użyje Perplexity do wyszukiwania w sieci, gdy klucz
    zostanie skonfigurowany. Nie są wymagane żadne dodatkowe kroki.
  </Step>
</Steps>

## Tryby wyszukiwania

Plugin automatycznie wybiera transport na podstawie prefiksu klucza API:

<Tabs>
  <Tab title="Natywne API Perplexity (pplx-)">
    Gdy Twój klucz zaczyna się od `pplx-`, OpenClaw używa natywnego API Perplexity Search.
    Ten transport zwraca ustrukturyzowane wyniki i obsługuje filtry domen, języka
    i daty (zobacz opcje filtrowania poniżej).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Gdy Twój klucz zaczyna się od `sk-or-`, OpenClaw kieruje ruch przez OpenRouter, używając
    modelu Perplexity Sonar. Ten transport zwraca odpowiedzi syntetyzowane przez AI wraz z
    cytowaniami.
  </Tab>
</Tabs>

| Prefiks klucza | Transport                    | Funkcje                                           |
| -------------- | ---------------------------- | ------------------------------------------------- |
| `pplx-`        | Natywne API Perplexity Search | Ustrukturyzowane wyniki, filtry domen/języka/daty |
| `sk-or-`       | OpenRouter (Sonar)           | Odpowiedzi syntetyzowane przez AI z cytowaniami   |

## Filtrowanie natywnego API

<Note>
Opcje filtrowania są dostępne tylko przy użyciu natywnego API Perplexity
(klucz `pplx-`). Wyszukiwania OpenRouter/Sonar nie obsługują tych parametrów.
</Note>

Przy użyciu natywnego API Perplexity wyszukiwanie obsługuje następujące filtry:

| Filtr          | Opis                                  | Przykład                            |
| -------------- | ------------------------------------- | ----------------------------------- |
| Kraj           | 2-literowy kod kraju                  | `us`, `de`, `jp`                    |
| Język          | Kod języka ISO 639-1                  | `en`, `fr`, `zh`                    |
| Zakres dat     | Okno świeżości                        | `day`, `week`, `month`, `year`      |
| Filtry domen   | Lista dozwolonych lub blokowanych (maks. 20 domen) | `example.com`           |
| Budżet treści  | Limity tokenów na odpowiedź / na stronę | `max_tokens`, `max_tokens_per_page` |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów daemon">
    Jeśli Gateway OpenClaw działa jako daemon (launchd/systemd), upewnij się, że
    `PERPLEXITY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz ustawiony tylko w `~/.profile` nie będzie widoczny dla daemona launchd/systemd,
    chyba że to środowisko zostanie jawnie zaimportowane. Ustaw klucz w
    `~/.openclaw/.env` albo przez `env.shellEnv`, aby mieć pewność, że proces gateway może
    go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Konfiguracja proxy OpenRouter">
    Jeśli wolisz kierować wyszukiwania Perplexity przez OpenRouter, ustaw
    `OPENROUTER_API_KEY` (prefiks `sk-or-`) zamiast natywnego klucza Perplexity.
    OpenClaw wykryje prefiks i automatycznie przełączy się na transport
    Sonar.

    <Tip>
    Transport OpenRouter jest przydatny, jeśli masz już konto OpenRouter
    i chcesz skonsolidowanego rozliczania dla wielu dostawców.
    </Tip>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzie wyszukiwania Perplexity" href="/pl/tools/perplexity-search" icon="magnifying-glass">
    Jak agent wywołuje wyszukiwania Perplexity i interpretuje wyniki.
  </Card>
  <Card title="Dokumentacja referencyjna konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja referencyjna konfiguracji, w tym wpisów Pluginów.
  </Card>
</CardGroup>
