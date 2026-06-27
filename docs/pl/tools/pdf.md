---
read_when:
    - Chcesz analizować pliki PDF od agentów
    - Potrzebujesz dokładnych parametrów i limitów narzędzia PDF
    - Debugujesz natywny tryb PDF względem zapasowej ekstrakcji
summary: Analizuj jeden lub więcej dokumentów PDF z natywną obsługą dostawcy i zapasowym wyodrębnianiem
title: Narzędzie PDF
x-i18n:
    generated_at: "2026-06-27T18:29:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analizuje jeden lub więcej dokumentów PDF i zwraca tekst.

Szybkie zachowanie:

- Natywny tryb dostawcy dla dostawców modeli Anthropic i Google.
- Rezerwowy tryb ekstrakcji dla innych dostawców (najpierw wyodrębnij tekst, potem obrazy stron, gdy są potrzebne).
- Obsługuje pojedyncze (`pdf`) lub wielokrotne (`pdfs`) dane wejściowe, maks. 10 plików PDF na wywołanie.

## Dostępność

Narzędzie jest rejestrowane tylko wtedy, gdy OpenClaw może rozwiązać konfigurację modelu obsługującego PDF dla agenta:

1. `agents.defaults.pdfModel`
2. rezerwowo `agents.defaults.imageModel`
3. rezerwowo rozwiązany model sesji/domyślny agenta
4. jeśli natywni dostawcy PDF są oparci na uwierzytelnianiu, preferuj ich przed ogólnymi rezerwowymi kandydatami obrazowymi

Jeśli nie można rozwiązać żadnego użytecznego modelu, narzędzie `pdf` nie jest udostępniane.

Uwagi dotyczące dostępności:

- Łańcuch rezerwowy uwzględnia uwierzytelnianie. Skonfigurowany `provider/model` liczy się tylko wtedy, gdy
  OpenClaw może faktycznie uwierzytelnić tego dostawcę dla agenta.
- Natywni dostawcy PDF to obecnie **Anthropic** i **Google**.
- Jeśli rozwiązany dostawca sesji/domyślny ma już skonfigurowany model vision/PDF,
  narzędzie PDF używa go ponownie przed przejściem do innych dostawców opartych na uwierzytelnianiu.

## Odniesienie danych wejściowych

<ParamField path="pdf" type="string">
Jedna ścieżka lub URL do pliku PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Wiele ścieżek lub URL-i do plików PDF, łącznie do 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt analizy.
</ParamField>

<ParamField path="pages" type="string">
Filtr stron, np. `1-5` lub `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
Hasło do zaszyfrowanych plików PDF w rezerwowym trybie ekstrakcji.
</ParamField>

<ParamField path="model" type="string">
Opcjonalne nadpisanie modelu w formie `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limit rozmiaru na plik PDF w MB. Domyślnie `agents.defaults.pdfMaxBytesMb` albo `10`.
</ParamField>

Uwagi dotyczące danych wejściowych:

- `pdf` i `pdfs` są scalane i deduplikowane przed wczytaniem.
- Jeśli nie podano żadnego pliku PDF, narzędzie zwraca błąd.
- `pages` jest parsowane jako numery stron liczone od 1, deduplikowane, sortowane i ograniczane do skonfigurowanej maksymalnej liczby stron.
- `password` dotyczy każdego pliku PDF w żądaniu i jest używane tylko przez rezerwowy tryb ekstrakcji.
- `maxBytesMb` domyślnie przyjmuje `agents.defaults.pdfMaxBytesMb` albo `10`.

## Obsługiwane odniesienia do plików PDF

- lokalna ścieżka pliku (w tym rozwijanie `~`)
- URL `file://`
- URL `http://` i `https://`
- zarządzane przez OpenClaw przychodzące odwołania, takie jak `media://inbound/<id>`

Uwagi dotyczące odniesień:

- Inne schematy URI (na przykład `ftp://`) są odrzucane z `unsupported_pdf_reference`.
- W trybie sandbox zdalne URL-e `http(s)` są odrzucane.
- Przy włączonej polityce plików ograniczonej do workspace lokalne ścieżki plików poza dozwolonymi katalogami głównymi są odrzucane.
- Zarządzane przychodzące odwołania i odtwarzane ścieżki w magazynie mediów przychodzących OpenClaw są dozwolone przy polityce plików ograniczonej do workspace.

## Tryby wykonania

### Natywny tryb dostawcy

Tryb natywny jest używany dla dostawców `anthropic` i `google`.
Narzędzie wysyła surowe bajty PDF bezpośrednio do API dostawców.

Ograniczenia trybu natywnego:

- `pages` nie jest obsługiwane. Jeśli jest ustawione, narzędzie zwraca błąd.
- `password` nie jest obsługiwane. Użyj nienatywnego modelu, aby analizować zaszyfrowane pliki PDF.
- Obsługiwane są dane wejściowe z wieloma plikami PDF; każdy PDF jest wysyłany jako natywny blok dokumentu /
  osadzona część PDF przed promptem.

### Rezerwowy tryb ekstrakcji

Tryb rezerwowy jest używany dla nienatywnych dostawców.

Przepływ:

1. Wyodrębnij tekst z wybranych stron (do `agents.defaults.pdfMaxPages`, domyślnie `20`).
2. Jeśli długość wyodrębnionego tekstu jest mniejsza niż `200` znaków, wyrenderuj wybrane strony jako obrazy PNG i dołącz je.
3. Wyślij wyodrębnioną treść wraz z promptem do wybranego modelu.

Szczegóły trybu rezerwowego:

- Ekstrakcja obrazów stron używa budżetu pikseli `4,000,000`.
- Zaszyfrowane pliki PDF można otworzyć za pomocą parametru najwyższego poziomu `password`.
- Jeśli model docelowy nie obsługuje danych wejściowych obrazu i nie ma tekstu możliwego do wyodrębnienia, narzędzie zwraca błąd.
- Jeśli ekstrakcja tekstu powiedzie się, ale ekstrakcja obrazów wymagałaby vision w
  modelu obsługującym tylko tekst, OpenClaw porzuca wyrenderowane obrazy i kontynuuje z
  wyodrębnionym tekstem.
- Rezerwowa ekstrakcja używa dołączonego Pluginu `document-extract`. Plugin jest właścicielem
  `clawpdf`, który zapewnia ekstrakcję tekstu i renderowanie obrazów przez PDFium
  WebAssembly.

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

Zobacz [Odniesienie konfiguracji](/pl/gateway/configuration-reference), aby poznać pełne szczegóły pól.

## Szczegóły wyjścia

Narzędzie zwraca tekst w `content[0].text` oraz uporządkowane metadane w `details`.

Typowe pola `details`:

- `model`: rozwiązane odniesienie modelu (`provider/model`)
- `native`: `true` dla natywnego trybu dostawcy, `false` dla trybu rezerwowego
- `attempts`: próby rezerwowe, które nie powiodły się przed sukcesem

Pola ścieżek:

- pojedynczy plik PDF na wejściu: `details.pdf`
- wiele plików PDF na wejściu: `details.pdfs[]` z wpisami `pdf`
- metadane przepisywania ścieżek sandbox (gdy ma zastosowanie): `rewrittenFrom`

## Zachowanie błędów

- Brak pliku PDF na wejściu: zgłasza `pdf required: provide a path or URL to a PDF document`
- Zbyt wiele plików PDF: zwraca uporządkowany błąd w `details.error = "too_many_pdfs"`
- Nieobsługiwany schemat odniesienia: zwraca `details.error = "unsupported_pdf_reference"`
- Tryb natywny z `pages`: zgłasza jasny błąd `pages is not supported with native PDF providers`

## Przykłady

Pojedynczy PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Wiele plików PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Model rezerwowy z filtrem stron:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

Zaszyfrowany PDF z rezerwową ekstrakcją:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Powiązane

- [Przegląd narzędzi](/pl/tools) - wszystkie dostępne narzędzia agenta
- [Odniesienie konfiguracji](/pl/gateway/config-agents#agent-defaults) - konfiguracja pdfMaxBytesMb i pdfMaxPages
