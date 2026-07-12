---
read_when:
    - Chcesz skonfigurować Perplexity jako dostawcę wyszukiwania internetowego
    - Potrzebujesz klucza API Perplexity lub konfiguracji proxy OpenRouter
summary: Konfiguracja dostawcy wyszukiwania internetowego Perplexity (klucz API, tryby wyszukiwania, filtrowanie)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T15:36:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity rejestruje dostawcę `web_search` z dwoma mechanizmami transportu: natywnym interfejsem Perplexity Search API (ustrukturyzowane wyniki z filtrami) oraz uzupełnieniami czatu Perplexity Sonar, bezpośrednio lub przez OpenRouter (odpowiedzi syntetyzowane przez AI z cytowaniami).

<Note>
Ta strona opisuje konfigurację **dostawcy** Perplexity. Informacje o **narzędziu** Perplexity (sposobie korzystania z niego przez agenta) znajdziesz w sekcji [Wyszukiwanie Perplexity](/pl/tools/perplexity-search).
</Note>

| Właściwość       | Wartość                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| Typ              | Dostawca wyszukiwania internetowego (nie dostawca modelu)                      |
| Uwierzytelnianie | `PERPLEXITY_API_KEY` (natywnie) lub `OPENROUTER_API_KEY` (przez OpenRouter)    |
| Ścieżka konfiguracji | `plugins.entries.perplexity.config.webSearch.apiKey`                       |
| Nadpisania       | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`               |
| Pobieranie klucza | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)          |

## Instalowanie pluginu

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    openclaw configure --section web
    ```

    Możesz też ustawić klucz bezpośrednio:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Działa również klucz wyeksportowany jako `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY` w środowisku Gateway.

  </Step>
  <Step title="Rozpocznij wyszukiwanie">
    `web_search` automatycznie wykrywa Perplexity, gdy jego klucz jest dostępnymi danymi uwierzytelniającymi wyszukiwania; dodatkowa konfiguracja nie jest wymagana. Aby jawnie przypisać dostawcę:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Tryby wyszukiwania

Plugin wybiera mechanizm transportu w następującej kolejności:

1. Ustawiono `webSearch.baseUrl` lub `webSearch.model`: żądania są zawsze kierowane przez uzupełnienia czatu Sonar do tego punktu końcowego, niezależnie od typu klucza.
2. W przeciwnym razie źródło klucza określa punkt końcowy: prefiks skonfigurowanego klucza wybiera mechanizm transportu (konfiguracja ma pierwszeństwo przed zmiennymi środowiskowymi), a klucz środowiskowy bezpośrednio używa odpowiadającego mu punktu końcowego.

| Prefiks klucza | Mechanizm transportu                                      | Funkcje                                              |
| -------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `pplx-`        | Natywny Perplexity Search API (`https://api.perplexity.ai`) | Ustrukturyzowane wyniki, filtry domeny, języka i daty |
| `sk-or-`       | OpenRouter (`https://openrouter.ai/api/v1`), model Sonar  | Odpowiedzi syntetyzowane przez AI z cytowaniami      |

Skonfigurowany klucz z dowolnym innym prefiksem również korzysta z natywnego Search API. Ścieżka uzupełnień czatu domyślnie używa modelu `perplexity/sonar-pro`; możesz go nadpisać za pomocą `plugins.entries.perplexity.config.webSearch.model`.

## Filtrowanie natywnego API

| Filtr                                | Opis                                                               | Mechanizm transportu |
| ------------------------------------ | ------------------------------------------------------------------ | -------------------- |
| `count`                              | Liczba wyników na wyszukiwanie, 1–10 (domyślnie 5)                 | Tylko natywny        |
| `freshness`                          | Przedział aktualności: `day`, `week`, `month`, `year`              | Oba                  |
| `country`                            | Dwuliterowy kod kraju (`us`, `de`, `jp`)                           | Tylko natywny        |
| `language`                           | Kod języka ISO 639-1 (`en`, `fr`, `zh`)                            | Tylko natywny        |
| `date_after` / `date_before`         | Zakres dat publikacji w formacie `YYYY-MM-DD`                      | Tylko natywny        |
| `domain_filter`                      | Maks. 20 domen; lista dozwolonych lub lista blokowanych z prefiksem `-`, nigdy obie naraz | Tylko natywny |
| `max_tokens` / `max_tokens_per_page` | Budżet zawartości dla wszystkich wyników / na stronę               | Tylko natywny        |

Filtry dostępne tylko w trybie natywnym zwracają opisowy błąd w ścieżce uzupełnień czatu. Parametru `freshness` nie można łączyć z `date_after`/`date_before`.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów demona">
    <Warning>
    Klucz wyeksportowany wyłącznie w interaktywnej powłoce nie jest widoczny dla demona Gateway uruchamianego przez launchd/systemd, chyba że to środowisko zostanie jawnie zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub za pomocą `env.shellEnv`, aby proces Gateway mógł go odczytać. Pełną kolejność pierwszeństwa opisano w sekcji [Zmienne środowiskowe](/pl/help/environment).
    </Warning>
  </Accordion>

  <Accordion title="Konfiguracja proxy OpenRouter">
    Aby kierować wyszukiwania Perplexity przez OpenRouter, ustaw `OPENROUTER_API_KEY` (prefiks `sk-or-`) zamiast natywnego klucza Perplexity. OpenClaw wykrywa klucz i automatycznie przełącza się na mechanizm transportu Sonar. Jest to przydatne, jeśli rozliczenia OpenRouter są już skonfigurowane i chcesz skonsolidować tam dostawców.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Narzędzie wyszukiwania Perplexity" href="/pl/tools/perplexity-search" icon="magnifying-glass">
    Sposób wywoływania wyszukiwań Perplexity przez agenta i interpretowania wyników.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji, w tym wpisów pluginów.
  </Card>
</CardGroup>
