---
read_when:
    - Diagnozujesz odrzucenia żądań przez dostawcę związane ze strukturą transkryptu
    - Zmieniasz logikę sanityzacji transkryptu lub naprawy wywołań narzędzi
    - Badasz niezgodności identyfikatorów wywołań narzędzi między dostawcami
summary: 'Dokumentacja referencyjna: reguły oczyszczania i naprawy transkryptów specyficzne dla dostawcy'
title: Higiena transkryptu
x-i18n:
    generated_at: "2026-05-03T09:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw stosuje **poprawki specyficzne dla dostawców** do transkrypcji przed uruchomieniem (podczas budowania kontekstu modelu). Większość z nich to korekty **w pamięci**, używane do spełnienia ścisłych wymagań dostawców. Osobny przebieg naprawy pliku sesji może też przepisać zapisany JSONL przed załadowaniem sesji, ale tylko w przypadku zniekształconych wierszy lub utrwalonych tur, które nie są prawidłowymi trwałymi rekordami. Dostarczone odpowiedzi asystenta są zachowywane na dysku; specyficzne dla dostawcy usuwanie wstępnego wypełnienia asystenta odbywa się tylko podczas konstruowania wychodzących ładunków. Gdy dochodzi do naprawy, oryginalny plik jest archiwizowany obok pliku sesji.

Zakres obejmuje:

- Kontekst promptu działający tylko w czasie wykonywania, pozostający poza widocznymi dla użytkownika turami transkrypcji
- Sanityzację identyfikatorów wywołań narzędzi
- Walidację danych wejściowych wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / porządkowanie tur
- Czyszczenie sygnatur myśli
- Czyszczenie sygnatur myślenia
- Sanityzację ładunków obrazów
- Czyszczenie pustych bloków tekstu przed odtwarzaniem u dostawcy
- Oznaczanie pochodzenia danych wejściowych użytkownika (dla promptów routowanych między sesjami)
- Naprawę pustych tur błędów asystenta dla odtwarzania Bedrock Converse

Jeśli potrzebujesz szczegółów dotyczących przechowywania transkrypcji, zobacz:

- [Szczegółowy opis zarządzania sesjami](/pl/reference/session-management-compaction)

---

## Reguła globalna: kontekst czasu wykonywania nie jest transkrypcją użytkownika

Kontekst czasu wykonywania/systemowy może zostać dodany do promptu modelu dla tury, ale nie jest treścią autorstwa użytkownika końcowego. OpenClaw utrzymuje osobną treść promptu widoczną w transkrypcji dla odpowiedzi Gateway, kolejkowanych kontynuacji, ACP, CLI oraz osadzonych uruchomień Pi. Zapisane widoczne tury użytkownika używają tej treści transkrypcji zamiast promptu wzbogaconego w czasie wykonywania.

W przypadku starszych sesji, które już utrwaliły wrappery czasu wykonywania, powierzchnie historii Gateway stosują projekcję wyświetlania przed zwróceniem wiadomości do klientów WebChat, TUI, REST lub SSE.

---

## Gdzie to działa

Cała higiena transkrypcji jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji/naprawy: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId`, aby zdecydować, co zastosować.

Niezależnie od higieny transkrypcji pliki sesji są naprawiane (jeśli potrzeba) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu limitów rozmiaru (zmniejszanie skali / ponowna kompresja zbyt dużych obrazów base64).

Pomaga to też kontrolować presję na tokeny wywołaną obrazami w modelach obsługujących wizję. Niższe maksymalne wymiary zwykle zmniejszają użycie tokenów; wyższe wymiary zachowują szczegóły.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można skonfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).
- Puste bloki tekstu są usuwane, gdy ten przebieg przechodzi po treści odtwarzania. Tury asystenta, które stają się puste, są usuwane z kopii odtwarzania; tury użytkownika i wyników narzędzi, które stają się puste, otrzymują niepusty placeholder pominiętej treści.

---

## Reguła globalna: zniekształcone wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom przez dostawców wynikającym z częściowo utrwalonych wywołań narzędzi (na przykład po błędzie limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym kroki odpowiedzi/ogłoszeń między agentami), OpenClaw utrwala utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

OpenClaw poprzedza też tekst routowanego promptu znacznikiem tej samej tury `[Inter-session message ... isUser=false]`, aby aktywne wywołanie modelu mogło odróżnić wynik z obcej sesji od zewnętrznych instrukcji użytkownika końcowego. Ten znacznik obejmuje sesję źródłową, kanał i narzędzie, gdy są dostępne. Transkrypcja nadal używa `role: "user"` dla zgodności z dostawcami, ale widoczny tekst i metadane pochodzenia oznaczają turę jako dane między sesjami.

Podczas odbudowy kontekstu OpenClaw stosuje ten sam znacznik do starszych utrwalonych tur użytkownika między sesjami, które mają tylko metadane pochodzenia.

---

## Macierz dostawców (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuwanie osieroconych sygnatur rozumowania (samodzielnych elementów rozumowania bez następującego po nich bloku treści) dla transkrypcji OpenAI Responses/Codex oraz usuwanie odtwarzalnego rozumowania OpenAI po przełączeniu trasy modelu.
- Zachowywanie odtwarzalnych ładunków elementów rozumowania OpenAI Responses, w tym zaszyfrowanych elementów z pustym podsumowaniem, aby ręczne/WebSocket odtwarzanie utrzymywało wymagany stan `rs_*` sparowany z elementami wyniku asystenta.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane wyniki i syntetyzować wyniki w stylu Codex z wartością `aborted` dla brakujących wywołań narzędzi.
- Brak walidacji ani zmiany kolejności tur.
- Brakujące wyniki narzędzi z rodziny OpenAI Responses są syntetyzowane jako `aborted`, aby dopasować normalizację odtwarzania Codex.
- Brak usuwania sygnatur myśli.

**Gemma 4 zgodna z OpenAI**

- Historyczne bloki myślenia/rozumowania asystenta są usuwane przed odtwarzaniem, aby lokalne serwery Gemma 4 zgodne z OpenAI nie otrzymywały treści rozumowania z poprzednich tur.
- Bieżące kontynuacje wywołań narzędzi w tej samej turze zachowują blok rozumowania asystenta dołączony do wywołania narzędzia, dopóki wynik narzędzia nie zostanie odtworzony.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisłe znaki alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Korekta kolejności tur Google (dodanie na początku małego bootstrapu użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur myślenia; usuwanie niepodpisanych bloków myślenia.

**Anthropic / Minimax (zgodny z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (scalanie kolejnych tur użytkownika, aby spełnić ścisłą naprzemienność).
- Końcowe tury wstępnego wypełnienia asystenta są usuwane z wychodzących ładunków Anthropic Messages, gdy myślenie jest włączone, w tym dla tras Cloudflare AI Gateway.
- Bloki myślenia z brakującymi, pustymi lub pustymi po usunięciu białych znaków sygnaturami odtwarzania są usuwane przed konwersją dostawcy. Jeśli opróżnia to turę asystenta, OpenClaw zachowuje kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane niepustym tekstem pominiętego rozumowania, aby adaptery dostawców nie usuwały tury odtwarzania.

**Amazon Bedrock (Converse API)**

- Puste tury błędów strumienia asystenta są naprawiane do niepustego awaryjnego bloku tekstu przed odtwarzaniem. Bedrock Converse odrzuca wiadomości asystenta z `content: []`, więc utrwalone tury asystenta z `stopReason: "error"` i pustą treścią są też naprawiane na dysku przed załadowaniem.
- Tury błędów strumienia asystenta, które zawierają tylko puste bloki tekstu, są usuwane z kopii odtwarzania w pamięci zamiast odtwarzać nieprawidłowy pusty blok.
- Bloki myślenia Claude z brakującymi, pustymi lub pustymi po usunięciu białych znaków sygnaturami odtwarzania są usuwane przed odtwarzaniem Converse. Jeśli opróżnia to turę asystenta, OpenClaw zachowuje kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane niepustym tekstem pominiętego rozumowania, aby odtwarzanie Converse zachowało ścisły kształt tur.
- Odtwarzanie filtruje tury asystenta będące lustrami dostarczenia OpenClaw oraz tury wstrzyknięte przez Gateway.
- Sanityzacja obrazów jest stosowana przez regułę globalną.

**Mistral (w tym wykrywanie oparte na identyfikatorze modelu)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (znaki alfanumeryczne o długości 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwanie wartości `thought_signature`, które nie są base64 (zachowywanie base64).

**OpenRouter Anthropic**

- Końcowe tury wstępnego wypełnienia asystenta są usuwane ze zweryfikowanych ładunków modeli Anthropic zgodnych z OpenAI w OpenRouter, gdy rozumowanie jest włączone, zgodnie z zachowaniem bezpośredniego odtwarzania Anthropic i Cloudflare Anthropic.

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkrypcji:

- **Rozszerzenie sanityzacji transkrypcji** uruchamiało się przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie użycia narzędzi / wyników.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner wykonywał też sanityzację specyficzną dla dostawców, co dublowało pracę.
- Dodatkowe mutacje występowały poza polityką dostawcy, w tym:
  - Usuwanie znaczników `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (szczególnie parowanie `call_id|fc_id` w `openai-responses`). Porządki w wersji 2026.1.22 usunęły rozszerzenie, scentralizowały logikę w runnerze i sprawiły, że OpenAI pozostaje **bez zmian** poza sanityzacją obrazów.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
