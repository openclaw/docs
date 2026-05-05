---
read_when:
    - Diagnozujesz odrzucenia żądań dostawcy związane ze strukturą transkryptu
    - Zmieniasz logikę oczyszczania transkryptu lub naprawy wywołań narzędzi
    - Badasz niezgodności identyfikatorów wywołań narzędzi między dostawcami
summary: 'Dokument referencyjny: reguły sanityzacji i naprawy transkryptu specyficzne dla dostawcy'
title: Higiena transkryptu
x-i18n:
    generated_at: "2026-05-05T01:50:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw stosuje **poprawki specyficzne dla dostawcy** do transkryptów przed uruchomieniem (budowaniem kontekstu modelu). Większość z nich to korekty **w pamięci**, używane do spełnienia rygorystycznych wymagań dostawców. Osobny przebieg naprawy pliku sesji może też przepisać zapisany JSONL przed załadowaniem sesji, ale tylko dla źle sformatowanych wierszy lub utrwalonych tur, które są nieprawidłowymi trwałymi rekordami. Dostarczone odpowiedzi asystenta są zachowywane na dysku; usuwanie specyficznych dla dostawcy wstępnych treści asystenta odbywa się tylko podczas konstruowania wychodzących payloadów. Gdy następuje naprawa, oryginalny plik jest zapisywany jako kopia zapasowa obok pliku sesji.

Zakres obejmuje:

- Kontekst promptu tylko w czasie działania pozostający poza widocznymi dla użytkownika turami transkryptu
- Sanityzację identyfikatorów wywołań narzędzi
- Walidację danych wejściowych wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / kolejność tur
- Czyszczenie sygnatur myśli
- Czyszczenie sygnatur myślenia
- Sanityzację payloadów obrazów
- Czyszczenie pustych bloków tekstu przed odtworzeniem u dostawcy
- Oznaczanie pochodzenia danych wejściowych użytkownika (dla promptów routowanych między sesjami)
- Naprawę pustych tur błędów asystenta dla odtwarzania Bedrock Converse

Jeśli potrzebujesz szczegółów dotyczących przechowywania transkryptów, zobacz:

- [Szczegółowy opis zarządzania sesjami](/pl/reference/session-management-compaction)

---

## Reguła globalna: kontekst uruchomieniowy nie jest transkryptem użytkownika

Kontekst uruchomieniowy/systemowy może zostać dodany do promptu modelu dla tury, ale nie jest
treścią napisaną przez użytkownika końcowego. OpenClaw utrzymuje osobną, przeznaczoną dla transkryptu
treść promptu dla odpowiedzi Gateway, zakolejkowanych kontynuacji, ACP, CLI oraz osadzonych uruchomień Pi.
Zapisane widoczne tury użytkownika używają tej treści transkryptu zamiast
promptu wzbogaconego kontekstem uruchomieniowym.

W przypadku starszych sesji, które już utrwaliły opakowania uruchomieniowe, powierzchnie historii Gateway
stosują projekcję wyświetlania przed zwróceniem wiadomości do klientów WebChat,
TUI, REST lub SSE.

---

## Gdzie to działa

Cała higiena transkryptu jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji/naprawy: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId`, aby zdecydować, co zastosować.

Niezależnie od higieny transkryptu pliki sesji są naprawiane (jeśli to konieczne) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Payloady obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu limitów
rozmiaru (zmniejszenie skali/rekompresja zbyt dużych obrazów base64).

Pomaga to również kontrolować presję tokenów wynikającą z obrazów dla modeli obsługujących widzenie.
Niższe maksymalne wymiary zwykle zmniejszają użycie tokenów; wyższe wymiary zachowują szczegóły.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można skonfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).
- Puste bloki tekstu są usuwane, gdy ten przebieg przechodzi po treści odtwarzania. Tury asystenta,
  które stają się puste, są usuwane z kopii odtwarzania; tury użytkownika i wyników narzędzi,
  które stają się puste, otrzymują niepusty placeholder pominiętej treści.

---

## Reguła globalna: źle sformatowane wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom przez dostawców wynikającym z częściowo
utrwalonych wywołań narzędzi (na przykład po awarii z powodu limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi/ogłoszeń między agentami), OpenClaw utrwala utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

OpenClaw dopisuje też w tej samej turze znacznik `[Inter-session message ... isUser=false]`
przed tekstem routowanego promptu, aby aktywne wywołanie modelu mogło odróżnić
wynik z obcej sesji od zewnętrznych instrukcji użytkownika końcowego. Ten znacznik zawiera
sesję źródłową, kanał i narzędzie, gdy są dostępne. Transkrypt nadal używa
`role: "user"` dla zgodności z dostawcami, ale widoczny tekst i metadane pochodzenia
oznaczają turę jako dane między sesjami.

Podczas odbudowy kontekstu OpenClaw stosuje ten sam znacznik do starszych utrwalonych
tur użytkownika między sesjami, które mają tylko metadane pochodzenia.

---

## Macierz dostawców (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuwanie osieroconych sygnatur rozumowania (samodzielnych elementów rozumowania bez następującego po nich bloku treści) dla transkryptów OpenAI Responses/Codex oraz usuwanie odtwarzalnego rozumowania OpenAI po przełączeniu trasy modelu.
- Zachowanie odtwarzalnych payloadów elementów rozumowania OpenAI Responses, w tym zaszyfrowanych elementów z pustym podsumowaniem, aby ręczne/WebSocket odtwarzanie utrzymywało wymagany stan `rs_*` sparowany z elementami wyjściowymi asystenta.
- Natywne ChatGPT Codex Responses zachowuje parytet przewodowy Codex przez odtwarzanie wcześniejszych payloadów rozumowania/wiadomości/funkcji Responses bez wcześniejszych identyfikatorów elementów, przy zachowaniu sesyjnego `prompt_cache_key`.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane wyjścia i syntetyzować wyjścia w stylu Codex oznaczone jako `aborted` dla brakujących wywołań narzędzi.
- Brak walidacji ani zmiany kolejności tur.
- Brakujące wyjścia narzędzi z rodziny OpenAI Responses są syntetyzowane jako `aborted`, aby odpowiadać normalizacji odtwarzania Codex.
- Brak usuwania sygnatur myśli.

**OpenAI-kompatybilny Gemma 4**

- Historyczne bloki myślenia/rozumowania asystenta są usuwane przed odtworzeniem, aby lokalne
  OpenAI-kompatybilne serwery Gemma 4 nie otrzymywały treści rozumowania z poprzednich tur.
- Bieżące kontynuacje wywołań narzędzi w tej samej turze zachowują blok rozumowania asystenta
  dołączony do wywołania narzędzia do czasu odtworzenia wyniku narzędzia.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisłe znaki alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Korekta kolejności tur Google (dodanie na początku krótkiej tury inicjalizującej użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur myślenia; usuwanie niepodpisanych bloków myślenia.

**Anthropic / Minimax (kompatybilny z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (scalanie kolejnych tur użytkownika, aby spełnić ścisłą naprzemienność).
- Końcowe tury wstępnego wypełnienia asystenta są usuwane z wychodzących payloadów Anthropic Messages,
  gdy myślenie jest włączone, w tym dla tras Cloudflare AI Gateway.
- Bloki myślenia z brakującymi, pustymi lub blankowymi sygnaturami odtwarzania są usuwane
  przed konwersją dostawcy. Jeśli opróżnia to turę asystenta, OpenClaw zachowuje
  kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego rozumowania, aby adaptery dostawców nie usuwały tury
  odtwarzania.

**Amazon Bedrock (Converse API)**

- Puste tury błędu strumienia asystenta są naprawiane do niepustego zastępczego bloku tekstu
  przed odtworzeniem. Bedrock Converse odrzuca wiadomości asystenta z `content: []`, więc
  utrwalone tury asystenta z `stopReason: "error"` i pustą treścią są również
  naprawiane na dysku przed załadowaniem.
- Tury błędu strumienia asystenta, które zawierają tylko puste bloki tekstu, są usuwane
  z kopii odtwarzania w pamięci zamiast odtwarzać nieprawidłowy pusty blok.
- Bloki myślenia Claude z brakującymi, pustymi lub blankowymi sygnaturami odtwarzania są
  usuwane przed odtwarzaniem Converse. Jeśli opróżnia to turę asystenta, OpenClaw
  zachowuje kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego rozumowania, aby odtwarzanie Converse zachowało ścisły kształt tur.
- Odtwarzanie filtruje lustrzane tury dostarczenia OpenClaw oraz tury asystenta wstrzyknięte przez Gateway.
- Sanityzacja obrazów stosuje się zgodnie z regułą globalną.

**Mistral (w tym wykrywanie na podstawie identyfikatora modelu)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (alfanumeryczne o długości 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwanie wartości `thought_signature` innych niż base64 (zachowanie base64).

**OpenRouter Anthropic**

- Końcowe tury wstępnego wypełnienia asystenta są usuwane ze zweryfikowanych payloadów modeli Anthropic
  zgodnych z OpenAI w OpenRouter, gdy rozumowanie jest włączone, co odpowiada
  bezpośredniemu zachowaniu odtwarzania Anthropic i Cloudflare Anthropic.

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (sprzed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkryptu:

- **Plugin transcript-sanitize** działał przy każdym budowaniu kontekstu i mógł:
  - Naprawiać parowanie użycia narzędzi/wyników.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner wykonywał również sanityzację specyficzną dla dostawcy, co dublowało pracę.
- Dodatkowe mutacje następowały poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (zwłaszcza parowanie `call_id|fc_id`
w `openai-responses`). Porządkowanie w 2026.1.22 usunęło Plugin, scentralizowało
logikę w runnerze i sprawiło, że OpenAI pozostał **nietknięty** poza sanityzacją obrazów.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
