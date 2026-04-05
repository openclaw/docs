---
read_when:
    - Debugujesz odrzucenia żądań przez dostawcę związane z kształtem transkryptu
    - Zmieniasz sanityzację transkryptu lub logikę naprawy wywołań narzędzi
    - Badasz niedopasowania id wywołań narzędzi między dostawcami
summary: 'Dokumentacja referencyjna: reguły sanityzacji i naprawy transkryptów specyficzne dla dostawców'
title: Higiena transkryptu
x-i18n:
    generated_at: "2026-04-05T14:05:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiena transkryptu (poprawki dla dostawców)

Ten dokument opisuje **poprawki specyficzne dla dostawców** stosowane do transkryptów przed uruchomieniem
(budowaniem kontekstu modelu). Są to korekty **w pamięci**, używane do spełnienia rygorystycznych
wymagań dostawców. Te kroki higieny **nie** przepisują zapisanego na dysku transkryptu JSONL;
jednak osobny etap naprawy pliku sesji może przepisać nieprawidłowe pliki JSONL,
usuwając błędne linie przed załadowaniem sesji. Gdy dojdzie do naprawy, oryginalny
plik jest zapisywany jako kopia zapasowa obok pliku sesji.

Zakres obejmuje:

- sanityzację id wywołań narzędzi
- walidację danych wejściowych wywołań narzędzi
- naprawę parowania wyników narzędzi
- walidację / kolejność tur
- czyszczenie sygnatur myślenia
- sanityzację ładunków obrazów
- tagowanie pochodzenia danych wejściowych użytkownika (dla promptów routowanych między sesjami)

Jeśli potrzebujesz szczegółów dotyczących przechowywania transkryptów, zobacz:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Gdzie to działa

Cała higiena transkryptu jest scentralizowana w embedded runner:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Stosowanie sanityzacji/napraw: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/google.ts`

Polityka używa `provider`, `modelApi` i `modelId` do podjęcia decyzji, co zastosować.

Oddzielnie od higieny transkryptu pliki sesji są naprawiane (w razie potrzeby) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (embedded runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu
limitów rozmiaru (skalowanie w dół / ponowna kompresja zbyt dużych obrazów base64).

Pomaga to również kontrolować presję tokenów generowaną przez obrazy dla modeli obsługujących vision.
Mniejsze maksymalne wymiary zwykle zmniejszają użycie tokenów; większe wymiary zachowują więcej szczegółów.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można konfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).

---

## Reguła globalna: nieprawidłowe wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom przez dostawców spowodowanym częściowo
utrwalonymi wywołaniami narzędzi (na przykład po błędzie rate limit).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/google.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi/ogłoszeń agent-do-agenta), OpenClaw zapisuje utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

Te metadane są zapisywane w momencie dopisania do transkryptu i nie zmieniają roli
(`role: "user"` pozostaje ze względu na zgodność z dostawcami). Odczytujący transkrypty mogą używać tego, aby nie traktować routowanych promptów wewnętrznych jako instrukcji tworzonych przez końcowego użytkownika.

Podczas odbudowy kontekstu OpenClaw również dodaje krótki znacznik `[Inter-session message]`
na początku tych tur użytkownika w pamięci, aby model mógł odróżnić je od
zewnętrznych instrukcji końcowego użytkownika.

---

## Macierz dostawców (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuwanie osieroconych sygnatur reasoning (samodzielnych elementów reasoning bez następującego po nich bloku treści) dla transkryptów OpenAI Responses/Codex.
- Brak sanityzacji id wywołań narzędzi.
- Brak naprawy parowania wyników narzędzi.
- Brak walidacji lub zmiany kolejności tur.
- Brak syntetycznych wyników narzędzi.
- Brak usuwania sygnatur myślenia.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja id wywołań narzędzi: ścisły alfanumeryczny format.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Poprawka kolejności tur Google (dodanie małego bootstrapu użytkownika na początku, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur myślenia; usuwanie bloków myślenia bez podpisu.

**Anthropic / Minimax (zgodne z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (scalanie kolejnych tur użytkownika, aby spełnić wymóg ścisłej naprzemienności).

**Mistral (w tym wykrywanie na podstawie id modelu)**

- Sanityzacja id wywołań narzędzi: strict9 (alfanumeryczne, długość 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myślenia: usuwanie wartości `thought_signature`, które nie są base64 (zachowanie base64).

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkryptu:

- Rozszerzenie **transcript-sanitize** było uruchamiane przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie tool use/result.
  - Sanityzować id wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner również wykonywał sanityzację specyficzną dla dostawcy, co dublowało pracę.
- Dodatkowe mutacje zachodziły poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (zwłaszcza parowanie `openai-responses`
`call_id|fc_id`). Porządki w wersji 2026.1.22 usunęły rozszerzenie, scentralizowały
logikę w runnerze i uczyniły OpenAI trybem **no-touch** poza sanityzacją obrazów.
