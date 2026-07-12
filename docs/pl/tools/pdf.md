---
read_when:
    - Chcesz analizować pliki PDF za pomocą agentów
    - Potrzebujesz dokładnych parametrów i limitów narzędzia PDF
    - Debugujesz natywny tryb PDF w porównaniu z awaryjnym wyodrębnianiem
summary: Analizuj co najmniej jeden dokument PDF z natywną obsługą dostawcy i awaryjnym wyodrębnianiem
title: Narzędzie PDF
x-i18n:
    generated_at: "2026-07-12T15:43:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analizuje co najmniej jeden dokument PDF i zwraca tekst. Korzysta z natywnej obsługi dokumentów w modelach Anthropic i Google, a w przypadku wszystkich pozostałych dostawców używa awaryjnie wyodrębniania tekstu i obrazów.

## Dostępność

Narzędzie jest rejestrowane tylko wtedy, gdy OpenClaw może określić dla agenta model obsługujący pliki PDF. Kolejność określania:

1. `agents.defaults.pdfModel` (jawnie określony model podstawowy i modele zapasowe)
2. `agents.defaults.imageModel` (jawnie określony model podstawowy i modele zapasowe)
3. Model określony dla sesji agenta lub model domyślny, jeśli jego dostawca obsługuje natywne dane wejściowe PDF (Anthropic, Google) albo ma już skonfigurowany model wizyjny
4. Automatycznie wykryci dostawcy modeli obsługujących obrazy lub dane wizyjne, z dostępnym uwierzytelnianiem i pierwszeństwem dostawców natywnie obsługujących pliki PDF

Przed użyciem każdego kandydata zapasowego sprawdzane jest uwierzytelnianie, dlatego skonfigurowany `provider/model` jest uwzględniany tylko wtedy, gdy OpenClaw może uwierzytelnić agenta u tego dostawcy. Jeśli nie uda się określić żadnego dostępnego modelu, narzędzie `pdf` nie jest udostępniane.

## Parametry wejściowe

<ParamField path="pdf" type="string">
Jedna ścieżka lub adres URL pliku PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Wiele ścieżek lub adresów URL plików PDF, łącznie maksymalnie 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt analizy.
</ParamField>

<ParamField path="pages" type="string">
Filtr stron, na przykład `1-5` lub `1,3,7-9`. Nie jest obsługiwany w trybie natywnym dostawcy.
</ParamField>

<ParamField path="password" type="string">
Hasło do zaszyfrowanych plików PDF. Dotyczy każdego pliku PDF w żądaniu; jest używane tylko w awaryjnym trybie wyodrębniania.
</ParamField>

<ParamField path="model" type="string">
Opcjonalne zastąpienie modelu w formacie `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limit rozmiaru pojedynczego pliku PDF w MB. Domyślnie `agents.defaults.pdfMaxBytesMb` albo `10`, jeśli wartość nie jest ustawiona.
</ParamField>

Uwagi:

- Wartości `pdf` i `pdfs` są scalane i deduplikowane przed wczytaniem; wymagane jest podanie co najmniej jednej z nich.
- Wartość `pages` jest interpretowana jako numery stron liczone od 1, deduplikowana, sortowana i ograniczana do `agents.defaults.pdfMaxPages` (domyślnie `20`). Zakres, który nie obejmuje żadnych istniejących stron, powoduje błąd przed wywołaniem modelu.

## Obsługiwane odwołania do plików PDF

- Ścieżka do pliku lokalnego (w tym z rozwinięciem `~`)
- Adres URL `file://`
- Adres URL `http://` lub `https://`
- Zarządzane przez OpenClaw odwołania do danych przychodzących, takie jak `media://inbound/<id>`

Inne schematy URI (na przykład `ftp://`) zwracają `details.error = "unsupported_pdf_reference"`. Zdalne adresy URL `http(s)` są odrzucane, gdy narzędzie działa w piaskownicy. Po włączeniu zasad dostępu do plików ograniczonych do przestrzeni roboczej lokalne ścieżki poza dozwolonymi katalogami głównymi są odrzucane; zarządzane odwołania do danych przychodzących oraz odtwarzane ścieżki w magazynie przychodzących multimediów OpenClaw pozostają dozwolone.

## Tryby wykonywania

### Tryb natywny dostawcy

Używany w przypadku dostawców `anthropic` i `google` (jedynych dostawców, którzy obecnie deklarują natywną obsługę dokumentów PDF). Surowe bajty każdego pliku PDF trafiają bezpośrednio do interfejsu API dostawcy jako natywny dokument lub osadzona część PDF.

Ograniczenia:

- Parametr `pages` nie jest obsługiwany; jeśli zostanie ustawiony, narzędzie zgłasza `pages is not supported with native PDF providers`.
- Parametr `password` nie jest obsługiwany; jeśli zostanie ustawiony, narzędzie zgłasza `password is not supported with native PDF providers`. Do zaszyfrowanych plików PDF użyj modelu bez natywnej obsługi.

### Awaryjny tryb wyodrębniania

Używany w przypadku wszystkich pozostałych dostawców.

1. Wyodrębnij tekst z wybranych stron (maksymalnie do `agents.defaults.pdfMaxPages`, domyślnie `20`) za pomocą dołączonego Pluginu `document-extract`, który używa pakietu `clawpdf` (PDFium WebAssembly) do wyodrębniania tekstu i obrazów.
2. Jeśli wyodrębniony tekst ma mniej niż `200` znaków, wyrenderuj te same strony jako obrazy PNG. Łączny budżet renderowania wynosi `4,000,000` pikseli i jest współdzielony przez wszystkie strony wymagające obrazów (przydzielany proporcjonalnie na każdą pozostałą stronę, a nie osobno dla każdej strony), dlatego strony tekstowe, które zawierają już wystarczającą ilość tekstu, w ogóle nie są renderowane.
3. Wyślij wyodrębniony tekst (oraz wszystkie wyrenderowane obrazy) wraz z promptem do wybranego modelu.

Szczegóły:

- Zaszyfrowane pliki PDF są otwierane za pomocą parametru najwyższego poziomu `password`.
- Jeśli model nie obsługuje obrazów wejściowych i nie można wyodrębnić tekstu, narzędzie zgłasza błąd.
- Jeśli renderowanie obrazów się nie powiedzie, OpenClaw pomija obrazy i kontynuuje z wyodrębnionym tekstem.
- Jeśli model docelowy obsługuje wyłącznie tekst, a podczas wyodrębniania powstały obrazy, OpenClaw pomija obrazy i wysyła tylko tekst.

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

| Klucz                           | Wartość domyślna | Znaczenie                                                                                                            |
| ------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | nieustawiona     | Jawnie określone podstawowe i zapasowe modele PDF; w razie potrzeby używa `imageModel`, a następnie modelu sesji.    |
| `agents.defaults.pdfMaxBytesMb` | `10`             | Limit rozmiaru pojedynczego pliku PDF w MB.                                                                           |
| `agents.defaults.pdfMaxPages`   | `20`             | Maksymalna liczba stron przetwarzanych w pojedynczym pliku PDF.                                                       |

Pełne informacje o polach zawiera [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults).

## Szczegóły danych wyjściowych

Narzędzie zwraca tekst w `content[0].text`, a ustrukturyzowane metadane w `details`.

Typowe pola `details`:

- `model`: określone odwołanie do modelu (`provider/model`)
- `native`: `true` dla trybu natywnego dostawcy, `false` dla trybu awaryjnego
- `attempts`: nieudane próby użycia modeli zapasowych poprzedzające powodzenie

Pola ścieżek:

- Pojedynczy plik PDF na wejściu: `details.pdf`
- Wiele plików PDF na wejściu: `details.pdfs[]` z wpisami `pdf`
- Metadane przepisywania ścieżek w piaskownicy (gdy ma zastosowanie): `rewrittenFrom`

## Obsługa błędów

| Warunek                               | Wynik                                                          |
| ------------------------------------- | -------------------------------------------------------------- |
| Brak pliku PDF na wejściu             | Zgłasza `pdf required: provide a path or URL to a PDF document` |
| Więcej niż 10 plików PDF              | `details.error = "too_many_pdfs"`                              |
| Nieobsługiwany schemat odwołania      | `details.error = "unsupported_pdf_reference"`                  |
| `pages` z natywnym dostawcą           | Zgłasza `pages is not supported with native PDF providers`      |
| `password` z natywnym dostawcą        | Zgłasza `password is not supported with native PDF providers`   |

## Przykłady

Pojedynczy plik PDF:

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

Model zapasowy z filtrowaniem stron:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

Zaszyfrowany plik PDF z awaryjnym wyodrębnianiem:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Powiązane materiały

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — konfiguracja `pdfMaxBytesMb` i `pdfMaxPages`
