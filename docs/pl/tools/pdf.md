---
read_when:
    - Chcesz analizować pliki PDF z agentów
    - Potrzebujesz dokładnych parametrów i limitów narzędzia PDF
    - Debugujesz natywny tryb PDF a fallback ekstrakcji ტექstu
summary: Analizuj jeden lub wiele dokumentów PDF z natywną obsługą providera i fallbackiem ekstrakcji ტექstu
title: Narzędzie PDF
x-i18n:
    generated_at: "2026-04-24T09:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analizuje jeden lub wiele dokumentów PDF i zwraca tekst.

Szybki opis działania:

- Natywny tryb providera dla providerów modeli Anthropic i Google.
- Tryb fallbacku ekstrakcji dla innych providerów (najpierw ekstrakcja tekstu, a potem obrazy stron, gdy są potrzebne).
- Obsługuje pojedyncze wejście (`pdf`) albo wiele wejść (`pdfs`), maks. 10 plików PDF na wywołanie.

## Dostępność

Narzędzie jest rejestrowane tylko wtedy, gdy OpenClaw może rozwiązać konfigurację modelu obsługującego PDF dla agenta:

1. `agents.defaults.pdfModel`
2. fallback do `agents.defaults.imageModel`
3. fallback do rozwiązanego modelu sesji/domniemanego modelu agenta
4. jeśli natywni providerzy PDF są zabezpieczeni auth, preferuj ich przed generycznymi kandydatami fallbacku obrazu

Jeśli nie da się rozwiązać żadnego użytecznego modelu, narzędzie `pdf` nie jest wystawiane.

Uwagi o dostępności:

- Łańcuch fallbacku jest świadomy auth. Skonfigurowane `provider/model` liczy się tylko wtedy, gdy
  OpenClaw rzeczywiście potrafi uwierzytelnić tego providera dla agenta.
- Natywni providerzy PDF to obecnie **Anthropic** i **Google**.
- Jeśli rozwiązany provider sesji/domniemany provider ma już skonfigurowany model vision/PDF,
  narzędzie PDF używa go ponownie przed przejściem do innych providerów zabezpieczonych auth.

## Dokumentacja wejścia

<ParamField path="pdf" type="string">
Jedna ścieżka albo URL do PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Wiele ścieżek albo URL-i do PDF, maksymalnie 10 łącznie.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt analizy.
</ParamField>

<ParamField path="pages" type="string">
Filtr stron, taki jak `1-5` albo `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Opcjonalne nadpisanie modelu w postaci `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limit rozmiaru na PDF w MB. Domyślnie `agents.defaults.pdfMaxBytesMb` albo `10`.
</ParamField>

Uwagi o wejściu:

- `pdf` i `pdfs` są scalane i deduplikowane przed załadowaniem.
- Jeśli nie podano żadnego wejścia PDF, narzędzie zwraca błąd.
- `pages` jest parsowane jako numery stron liczone od 1, deduplikowane, sortowane i ograniczane do skonfigurowanego maksymalnego limitu stron.
- `maxBytesMb` domyślnie ma wartość `agents.defaults.pdfMaxBytesMb` albo `10`.

## Obsługiwane referencje PDF

- lokalna ścieżka pliku (w tym rozwijanie `~`)
- URL `file://`
- URL `http://` i `https://`

Uwagi o referencjach:

- Inne schematy URI (na przykład `ftp://`) są odrzucane z `unsupported_pdf_reference`.
- W trybie sandbox zdalne URL-e `http(s)` są odrzucane.
- Przy włączonej polityce plików tylko dla obszaru roboczego lokalne ścieżki plików poza dozwolonymi katalogami głównymi są odrzucane.

## Tryby wykonania

### Natywny tryb providera

Tryb natywny jest używany dla providerów `anthropic` i `google`.
Narzędzie wysyła surowe bajty PDF bezpośrednio do API providera.

Ograniczenia trybu natywnego:

- `pages` nie jest obsługiwane. Jeśli jest ustawione, narzędzie zwraca błąd.
- Obsługiwane jest wejście z wieloma PDF; każdy PDF jest wysyłany jako natywny blok dokumentu /
  inline’owa część PDF przed promptem.

### Tryb fallbacku ekstrakcji

Tryb fallbacku jest używany dla providerów nienatywnych.

Przepływ:

1. Wyekstrahuj tekst z wybranych stron (do `agents.defaults.pdfMaxPages`, domyślnie `20`).
2. Jeśli długość wyekstrahowanego tekstu jest mniejsza niż `200` znaków, wyrenderuj wybrane strony do obrazów PNG i dołącz je.
3. Wyślij wyekstrahowaną treść wraz z promptem do wybranego modelu.

Szczegóły fallbacku:

- Ekstrakcja obrazów stron używa budżetu pikseli `4,000,000`.
- Jeśli docelowy model nie obsługuje wejścia obrazów i nie ma tekstu możliwego do wyekstrahowania, narzędzie zwraca błąd.
- Jeśli ekstrakcja tekstu się powiedzie, ale ekstrakcja obrazów wymagałaby vision na
  modelu tylko tekstowym, OpenClaw pomija wyrenderowane obrazy i kontynuuje z
  wyekstrahowanym tekstem.
- Fallback ekstrakcji wymaga `pdfjs-dist` (oraz `@napi-rs/canvas` do renderowania obrazów).

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

Zobacz [Configuration Reference](/pl/gateway/configuration-reference), aby poznać pełne szczegóły pól.

## Szczegóły danych wyjściowych

Narzędzie zwraca tekst w `content[0].text` oraz ustrukturyzowane metadane w `details`.

Typowe pola `details`:

- `model`: rozwiązana referencja modelu (`provider/model`)
- `native`: `true` dla natywnego trybu providera, `false` dla fallbacku
- `attempts`: próby fallbacku, które zakończyły się błędem przed sukcesem

Pola ścieżek:

- pojedyncze wejście PDF: `details.pdf`
- wiele wejść PDF: `details.pdfs[]` z wpisami `pdf`
- metadane przepisywania ścieżki sandboxa (gdy dotyczy): `rewrittenFrom`

## Zachowanie błędów

- Brak wejścia PDF: rzuca `pdf required: provide a path or URL to a PDF document`
- Zbyt wiele PDF: zwraca ustrukturyzowany błąd w `details.error = "too_many_pdfs"`
- Nieobsługiwany schemat referencji: zwraca `details.error = "unsupported_pdf_reference"`
- Tryb natywny z `pages`: rzuca czytelny błąd `pages is not supported with native PDF providers`

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

Model fallbacku z filtrem stron:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Powiązane

- [Tools Overview](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Configuration Reference](/pl/gateway/config-agents#agent-defaults) — konfiguracja pdfMaxBytesMb i pdfMaxPages
