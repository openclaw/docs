---
read_when:
    - Chcesz skonfigurować Perplexity jako dostawcę wyszukiwania w internecie
    - Potrzebujesz klucza API Perplexity albo konfiguracji proxy OpenRouter
summary: Konfiguracja dostawcy wyszukiwania w sieci Perplexity (klucz API, tryby wyszukiwania, filtrowanie)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:14:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity zapewnia możliwości wyszukiwania w sieci za pośrednictwem Perplexity
Search API lub Perplexity Sonar przez OpenRouter.

<Note>
Ta strona dotyczy konfiguracji **dostawcy** Perplexity. Informacje o **narzędziu** Perplexity (jak używa go agent) znajdziesz w sekcji [Narzędzie Perplexity](/pl/tools/perplexity-search).
</Note>

| Właściwość           | Wartość                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| Typ                  | Dostawca wyszukiwania w sieci (nie dostawca modeli)                      |
| Uwierzytelnianie     | `PERPLEXITY_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter) |
| Ścieżka konfiguracji | `plugins.entries.perplexity.config.webSearch.apiKey`                     |

## Instalacja Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

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
    Agent automatycznie zacznie używać Perplexity do wyszukiwań w sieci po
    skonfigurowaniu klucza. Nie są wymagane żadne dodatkowe kroki.
  </Step>
</Steps>

## Tryby wyszukiwania

Plugin automatycznie wybiera transport na podstawie prefiksu klucza API:

<Tabs>
  <Tab title="Natywne API Perplexity (pplx-)">
    Gdy klucz zaczyna się od `pplx-`, OpenClaw używa natywnego Perplexity Search
    API. Ten transport zwraca ustrukturyzowane wyniki i obsługuje filtry domen,
    języka oraz dat (zobacz opcje filtrowania poniżej).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Gdy klucz zaczyna się od `sk-or-`, OpenClaw kieruje żądania przez OpenRouter,
    używając modelu Perplexity Sonar. Ten transport zwraca odpowiedzi syntetyzowane
    przez AI z cytowaniami.
  </Tab>
</Tabs>

| Prefiks klucza | Transport                    | Funkcje                                          |
| --------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`         | Natywne Perplexity Search API | Ustrukturyzowane wyniki, filtry domen/języka/dat |
| `sk-or-`        | OpenRouter (Sonar)           | Odpowiedzi syntetyzowane przez AI z cytowaniami  |

## Filtrowanie w natywnym API

<Note>
Opcje filtrowania są dostępne tylko podczas korzystania z natywnego API Perplexity
(klucz `pplx-`). Wyszukiwania OpenRouter/Sonar nie obsługują tych parametrów.
</Note>

Podczas korzystania z natywnego API Perplexity wyszukiwania obsługują następujące filtry:

| Filtr          | Opis                                      | Przykład                            |
| -------------- | ----------------------------------------- | ----------------------------------- |
| Kraj           | Dwuliterowy kod kraju                     | `us`, `de`, `jp`                    |
| Język          | Kod języka ISO 639-1                      | `en`, `fr`, `zh`                    |
| Zakres dat     | Okno aktualności                          | `day`, `week`, `month`, `year`      |
| Filtry domen   | Lista dozwolonych lub blokowanych domen (maks. 20 domen) | `example.com`                       |
| Budżet treści  | Limity tokenów na odpowiedź / na stronę   | `max_tokens`, `max_tokens_per_page` |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów demonów">
    Jeśli OpenClaw Gateway działa jako demon (launchd/systemd), upewnij się, że
    `PERPLEXITY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz wyeksportowany tylko w interaktywnej powłoce nie będzie widoczny dla
    demona launchd/systemd, chyba że to środowisko zostanie jawnie zaimportowane. Ustaw
    klucz w `~/.openclaw/.env` lub przez `env.shellEnv`, aby mieć pewność, że proces
    gateway może go odczytać.
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
