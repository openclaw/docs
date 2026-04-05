---
read_when:
    - Chcesz analizować pliki PDF z agentów
    - Potrzebujesz dokładnych parametrów i limitów narzędzia pdf
    - Diagnozujesz natywny tryb PDF w porównaniu z zapasowym trybem ekstrakcji
summary: Analizuj jeden lub więcej dokumentów PDF z natywną obsługą dostawców i zapasowym trybem ekstrakcji
title: Narzędzie PDF
x-i18n:
    generated_at: "2026-04-05T14:08:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# Narzędzie PDF

`pdf` analizuje jeden lub więcej dokumentów PDF i zwraca tekst.

Szybki opis działania:

- Natywny tryb dostawcy dla dostawców modeli Anthropic i Google.
- Zapasowy tryb ekstrakcji dla innych dostawców (najpierw ekstrakcja tekstu, a potem obrazy stron, gdy to potrzebne).
- Obsługuje pojedyncze (`pdf`) lub wielokrotne (`pdfs`) wejście, maksymalnie 10 plików PDF na jedno wywołanie.

## Dostępność

Narzędzie jest rejestrowane tylko wtedy, gdy OpenClaw może rozwiązać konfigurację modelu obsługującego PDF dla agenta:

1. `agents.defaults.pdfModel`
2. fallback do `agents.defaults.imageModel`
3. fallback do rozwiązanego modelu sesji/domyślnego agenta
4. jeśli natywni dostawcy PDF są wspierani przez uwierzytelnianie, preferuj ich przed ogólnymi kandydatami zapasowymi dla obrazów

Jeśli nie da się rozwiązać używalnego modelu, narzędzie `pdf` nie jest udostępniane.

Uwagi dotyczące dostępności:

- Łańcuch fallback jest świadomy uwierzytelniania. Skonfigurowany `provider/model` liczy się tylko wtedy, gdy
  OpenClaw może rzeczywiście uwierzytelnić tego dostawcę dla agenta.
- Natywni dostawcy PDF to obecnie **Anthropic** i **Google**.
- Jeśli rozwiązany dostawca sesji/domyslny ma już skonfigurowany model vision/PDF,
  narzędzie PDF używa go ponownie przed przejściem do innych dostawców wspieranych przez uwierzytelnianie.

## Opis wejścia

- `pdf` (`string`): jedna ścieżka lub URL PDF
- `pdfs` (`string[]`): wiele ścieżek lub URL-i PDF, maksymalnie 10 łącznie
- `prompt` (`string`): prompt analizy, domyślnie `Analyze this PDF document.`
- `pages` (`string`): filtr stron, taki jak `1-5` lub `1,3,7-9`
- `model` (`string`): opcjonalne nadpisanie modelu (`provider/model`)
- `maxBytesMb` (`number`): limit rozmiaru na PDF w MB

Uwagi dotyczące wejścia:

- `pdf` i `pdfs` są scalane i deduplikowane przed ładowaniem.
- Jeśli nie podano żadnego wejścia PDF, narzędzie zwraca błąd.
- `pages` jest parsowane jako numery stron od 1, deduplikowane, sortowane i ograniczane do skonfigurowanego maksimum stron.
- `maxBytesMb` domyślnie przyjmuje `agents.defaults.pdfMaxBytesMb` lub `10`.

## Obsługiwane odwołania do PDF

- lokalna ścieżka pliku (w tym rozwijanie `~`)
- URL `file://`
- URL `http://` i `https://`

Uwagi dotyczące odwołań:

- Inne schematy URI (na przykład `ftp://`) są odrzucane z `unsupported_pdf_reference`.
- W trybie sandbox zdalne URL-e `http(s)` są odrzucane.
- Przy włączonej polityce plików ograniczonej tylko do workspace lokalne ścieżki plików spoza dozwolonych katalogów głównych są odrzucane.

## Tryby wykonania

### Natywny tryb dostawcy

Tryb natywny jest używany dla dostawców `anthropic` i `google`.
Narzędzie wysyła surowe bajty PDF bezpośrednio do API dostawców.

Limity trybu natywnego:

- `pages` nie jest obsługiwane. Jeśli zostanie ustawione, narzędzie zwraca błąd.
- Obsługiwane jest wejście z wieloma PDF; każdy PDF jest wysyłany jako natywny blok dokumentu /
  wbudowana część PDF przed promptem.

### Zapasowy tryb ekstrakcji

Tryb zapasowy jest używany dla dostawców nienatywnych.

Przepływ:

1. Wyodrębnij tekst z wybranych stron (do `agents.defaults.pdfMaxPages`, domyślnie `20`).
2. Jeśli długość wyodrębnionego tekstu jest mniejsza niż `200` znaków, wyrenderuj wybrane strony do obrazów PNG i dołącz je.
3. Wyślij wyodrębnioną zawartość wraz z promptem do wybranego modelu.

Szczegóły fallbacku:

- Ekstrakcja obrazów stron używa budżetu pikseli `4,000,000`.
- Jeśli model docelowy nie obsługuje wejścia obrazów i nie ma tekstu możliwego do wyodrębnienia, narzędzie zwraca błąd.
- Jeśli ekstrakcja tekstu się powiedzie, ale ekstrakcja obrazów wymagałaby vision w modelu
  obsługującym tylko tekst, OpenClaw usuwa wyrenderowane obrazy i kontynuuje z wyodrębnionym tekstem.
- Zapasowy tryb ekstrakcji wymaga `pdfjs-dist` (oraz `@napi-rs/canvas` do renderowania obrazów).

## Konfiguracja

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Pełne szczegóły pól znajdziesz w [Configuration Reference](/pl/gateway/configuration-reference).

## Szczegóły wyjścia

Narzędzie zwraca tekst w `content[0].text` oraz uporządkowane metadane w `details`.

Typowe pola `details`:

- `model`: rozwiązany ref modelu (`provider/model`)
- `native`: `true` dla natywnego trybu dostawcy, `false` dla fallbacku
- `attempts`: nieudane próby fallbacku przed powodzeniem

Pola ścieżek:

- pojedyncze wejście PDF: `details.pdf`
- wiele wejść PDF: `details.pdfs[]` z wpisami `pdf`
- metadane przepisania ścieżki sandboxa (gdy dotyczy): `rewrittenFrom`

## Zachowanie błędów

- Brak wejścia PDF: zgłasza `pdf required: provide a path or URL to a PDF document`
- Za dużo plików PDF: zwraca uporządkowany błąd w `details.error = "too_many_pdfs"`
- Nieobsługiwany schemat odwołania: zwraca `details.error = "unsupported_pdf_reference"`
- Tryb natywny z `pages`: zgłasza czytelny błąd `pages is not supported with native PDF providers`

## Przykłady

Pojedynczy PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Wiele PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Model fallback z filtrem stron:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Powiązane

- [Przegląd narzędzi](/tools) — wszystkie dostępne narzędzia agenta
- [Configuration Reference](/pl/gateway/configuration-reference#agent-defaults) — konfiguracja pdfMaxBytesMb i pdfMaxPages
