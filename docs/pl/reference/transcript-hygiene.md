---
read_when:
    - Debugujesz odrzucenia żądań dostawcy związane ze strukturą transkryptu
    - Zmieniasz logikę sanityzacji transkryptu lub naprawy wywołań narzędzi
    - Badasz niedopasowania identyfikatorów wywołań narzędzi między dostawcami
summary: 'Informacje referencyjne: reguły sanityzacji i naprawy transkryptu specyficzne dla dostawcy'
title: Higiena transkryptu
x-i18n:
    generated_at: "2026-04-24T09:32:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiena transkryptu (poprawki dostawców)

Ten dokument opisuje **poprawki specyficzne dla dostawców** stosowane do transkryptów przed uruchomieniem
(budowaniem kontekstu modelu). Są to **modyfikacje w pamięci** używane do spełnienia rygorystycznych
wymagań dostawców. Te kroki higieny **nie** przepisują zapisanego na dysku transkryptu JSONL;
jednak osobny etap naprawy pliku sesji może przepisać nieprawidłowe pliki JSONL
przez usunięcie nieprawidłowych linii przed załadowaniem sesji. Gdy dojdzie do naprawy, oryginalny
plik jest archiwizowany obok pliku sesji.

Zakres obejmuje:

- Sanityzację identyfikatorów wywołań narzędzi
- Walidację danych wejściowych wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / porządkowanie tur
- Czyszczenie sygnatur myśli
- Sanityzację ładunków obrazów
- Tagowanie pochodzenia danych wejściowych użytkownika (dla promptów przekierowywanych między sesjami)

Jeśli potrzebujesz szczegółów dotyczących przechowywania transkryptów, zobacz:

- [/reference/session-management-compaction](/pl/reference/session-management-compaction)

---

## Gdzie to działa

Cała higiena transkryptu jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji/naprawy: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId`, aby zdecydować, co zastosować.

Niezależnie od higieny transkryptu, pliki sesji są naprawiane (jeśli to konieczne) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu
limitów rozmiaru (zmniejszanie rozdzielczości/ponowna kompresja zbyt dużych obrazów base64).

Pomaga to także kontrolować presję tokenów powodowaną przez obrazy w modelach obsługujących vision.
Mniejsze maksymalne wymiary zwykle zmniejszają zużycie tokenów; większe wymiary zachowują więcej szczegółów.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można skonfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).

---

## Reguła globalna: nieprawidłowe wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom po stronie dostawcy spowodowanym częściowo
utrwalonymi wywołaniami narzędzi (na przykład po błędzie limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi/ogłoszeń agent-do-agenta), OpenClaw zapisuje utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

Te metadane są zapisywane w momencie dołączania do transkryptu i nie zmieniają roli
(`role: "user"` pozostaje dla zgodności z dostawcami). Czytniki transkryptów mogą używać
tych danych, aby nie traktować przekierowanych wewnętrznych promptów jako instrukcji pochodzących od użytkownika końcowego.

Podczas ponownego budowania kontekstu OpenClaw dodaje także krótki znacznik `[Inter-session message]`
na początku tych tur użytkownika w pamięci, aby model mógł odróżnić je od
zewnętrznych instrukcji użytkownika końcowego.

---

## Macierz dostawców (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuwanie osieroconych sygnatur rozumowania (samodzielnych elementów rozumowania bez następującego po nich bloku treści) z transkryptów OpenAI Responses/Codex.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Brak naprawy parowania wyników narzędzi.
- Brak walidacji lub zmiany kolejności tur.
- Brak syntetycznych wyników narzędzi.
- Brak usuwania sygnatur myśli.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisły format alfanumeryczny.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Poprawka kolejności tur Google (dodanie na początku krótkiego bootstrapu użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur myślenia; usuwanie niepodpisanych bloków myślenia.

**Anthropic / Minimax (zgodne z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (łączenie kolejnych tur użytkownika, aby spełnić wymóg ścisłej naprzemienności).

**Mistral (w tym wykrywanie na podstawie `modelId`)**

- Sanityzacja identyfikatorów wywołań narzędzi: `strict9` (ciąg alfanumeryczny o długości 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwanie wartości `thought_signature`, które nie są base64 (wartości base64 są zachowywane).

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkryptu:

- Rozszerzenie **transcript-sanitize** było uruchamiane przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie użyć narzędzi/wyników.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner wykonywał także sanityzację specyficzną dla dostawcy, co dublowało pracę.
- Dodatkowe mutacje występowały poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (zwłaszcza w parowaniu `openai-responses`
`call_id|fc_id`). Porządki z wersji 2026.1.22 usunęły rozszerzenie, scentralizowały
logikę w runnerze i sprawiły, że OpenAI stał się **nietykany** poza sanityzacją obrazów.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
