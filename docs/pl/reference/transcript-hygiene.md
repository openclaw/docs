---
read_when:
    - Diagnozujesz odrzucenia żądań przez dostawcę związane ze strukturą transkryptu
    - Zmieniasz logikę sanityzacji transkrypcji lub naprawy wywołań narzędzi
    - Badasz niezgodności identyfikatorów wywołań narzędzi między dostawcami
summary: 'Dokumentacja referencyjna: reguły sanityzacji i naprawy transkryptu zależne od dostawcy'
title: Higiena transkryptu
x-i18n:
    generated_at: "2026-05-10T19:54:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw stosuje **poprawki specyficzne dla dostawcy** do transkryptów przed uruchomieniem (podczas budowania kontekstu modelu). Większość z nich to korekty **w pamięci**, używane do spełnienia ścisłych wymagań dostawców. Osobny przebieg naprawy pliku sesji może też przepisać zapisany JSONL przed załadowaniem sesji, ale tylko w przypadku nieprawidłowo sformatowanych wierszy lub utrwalonych tur, które nie są prawidłowymi trwałymi rekordami. Dostarczone odpowiedzi asystenta są zachowywane na dysku; usuwanie wstępnego wypełnienia asystenta specyficzne dla dostawcy odbywa się tylko podczas konstruowania ładunków wychodzących. Gdy nastąpi naprawa, oryginalny plik jest archiwizowany obok pliku sesji.

Zakres obejmuje:

- Kontekst promptu tylko w czasie działania, pozostający poza widocznymi dla użytkownika turami transkryptu
- Sanityzację identyfikatorów wywołań narzędzi
- Walidację danych wejściowych wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / porządkowanie tur
- Czyszczenie sygnatur myśli
- Czyszczenie sygnatur myślenia
- Sanityzację ładunków obrazów
- Czyszczenie pustych bloków tekstu przed odtworzeniem u dostawcy
- Tagowanie pochodzenia danych wejściowych użytkownika (dla promptów routowanych między sesjami)
- Naprawę pustych tur błędów asystenta dla odtworzenia Bedrock Converse

Jeśli potrzebujesz szczegółów przechowywania transkryptów, zobacz:

- [Szczegółowe omówienie zarządzania sesją](/pl/reference/session-management-compaction)

---

## Reguła globalna: kontekst czasu działania nie jest transkryptem użytkownika

Kontekst czasu działania/systemowy może zostać dodany do promptu modelu dla danej tury, ale nie jest
treścią utworzoną przez użytkownika końcowego. OpenClaw utrzymuje oddzielną, skierowaną do transkryptu
treść promptu dla odpowiedzi Gateway, kolejkowanych kontynuacji, ACP, CLI i osadzonych uruchomień Pi.
Zapisane widoczne tury użytkownika używają tej treści transkryptu zamiast promptu
wzbogaconego o kontekst czasu działania.

Dla starszych sesji, które już utrwaliły opakowania czasu działania, powierzchnie historii Gateway
stosują projekcję wyświetlania przed zwróceniem wiadomości do klientów WebChat,
TUI, REST lub SSE.

---

## Gdzie to działa

Cała higiena transkryptu jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji/naprawy: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId`, aby zdecydować, co zastosować.

Niezależnie od higieny transkryptu pliki sesji są naprawiane (jeśli trzeba) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu limitów
rozmiaru (zmniejszanie skali/rekompresja zbyt dużych obrazów base64).

Pomaga to też kontrolować presję tokenów wywołaną obrazami w modelach obsługujących widzenie.
Niższe maksymalne wymiary zwykle zmniejszają użycie tokenów; wyższe wymiary zachowują szczegóły.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można skonfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).
- Puste bloki tekstu są usuwane, gdy ten przebieg przechodzi po treści odtwarzania. Tury asystenta,
  które stają się puste, są usuwane z kopii odtwarzania; tury użytkownika i wyników narzędzi,
  które stają się puste, otrzymują niepusty symbol zastępczy pominiętej treści.

---

## Reguła globalna: nieprawidłowo sformatowane wywołania narzędzi

Bloki wywołań narzędzi asystenta, w których brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom przez dostawców wynikającym z częściowo
utrwalonych wywołań narzędzi (na przykład po niepowodzeniu z powodu limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie wejścia między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi/ogłoszeń agent-do-agenta), OpenClaw utrwala utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

OpenClaw dodaje też na początku tej samej tury znacznik `[Inter-session message ... isUser=false]`
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
- Zachowanie odtwarzalnych ładunków elementów rozumowania OpenAI Responses, w tym zaszyfrowanych elementów z pustym podsumowaniem, aby ręczne/WebSocket odtwarzanie utrzymywało wymagany stan `rs_*` sparowany z elementami wyjściowymi asystenta.
- Natywne ChatGPT Codex Responses zachowuje parytet protokołu Codex, odtwarzając wcześniejsze ładunki rozumowania/wiadomości/funkcji Responses bez wcześniejszych identyfikatorów elementów, jednocześnie zachowując sesyjny `prompt_cache_key`.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane wyniki i syntetyzować wyniki `aborted` w stylu Codex dla brakujących wywołań narzędzi.
- Brak walidacji ani zmiany kolejności tur.
- Brakujące wyniki narzędzi z rodziny OpenAI Responses są syntetyzowane jako `aborted`, aby odpowiadały normalizacji odtwarzania Codex.
- Brak usuwania sygnatur myśli.

**OpenAI-compatible Chat Completions**

- Historyczne bloki myślenia/rozumowania asystenta są usuwane przed odtwarzaniem, aby
  lokalne serwery i serwery proxy zgodne z OpenAI nie otrzymywały pól rozumowania
  z wcześniejszych tur, takich jak `reasoning` lub `reasoning_content`.
- Bieżące kontynuacje wywołań narzędzi w tej samej turze zachowują blok rozumowania asystenta
  dołączony do wywołania narzędzia, dopóki wynik narzędzia nie zostanie odtworzony.
- Wyjątki należące do dostawcy mogą zrezygnować z tego zachowania, gdy ich protokół przewodowy wymaga
  odtwarzanych metadanych rozumowania.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisłe znaki alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Korekta kolejności tur Google (dodanie na początku małego rozruchu użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur myślenia; usuwanie niepodpisanych bloków myślenia.

**Anthropic / Minimax (zgodny z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (scalanie kolejnych tur użytkownika w celu spełnienia ścisłej naprzemienności).
- Końcowe tury wstępnego wypełnienia asystenta są usuwane z wychodzących ładunków Anthropic Messages,
  gdy myślenie jest włączone, w tym tras Cloudflare AI Gateway.
- Bloki myślenia z brakującymi, pustymi lub zawierającymi tylko białe znaki sygnaturami odtwarzania są usuwane
  przed konwersją dostawcy. Jeśli powoduje to opróżnienie tury asystenta, OpenClaw zachowuje
  kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego rozumowania, aby adaptery dostawców nie usuwały tury odtwarzania.

**Amazon Bedrock (Converse API)**

- Puste tury błędów strumienia asystenta są naprawiane do niepustego awaryjnego bloku tekstu
  przed odtwarzaniem. Bedrock Converse odrzuca wiadomości asystenta z `content: []`, więc
  utrwalone tury asystenta z `stopReason: "error"` i pustą treścią są też
  naprawiane na dysku przed załadowaniem.
- Tury błędów strumienia asystenta, które zawierają tylko puste bloki tekstu, są usuwane
  z kopii odtwarzania w pamięci zamiast odtwarzać nieprawidłowy pusty blok.
- Bloki myślenia Claude z brakującymi, pustymi lub zawierającymi tylko białe znaki sygnaturami odtwarzania są
  usuwane przed odtwarzaniem Converse. Jeśli powoduje to opróżnienie tury asystenta, OpenClaw
  zachowuje kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego rozumowania, aby odtwarzanie Converse zachowało ścisły kształt tur.
- Odtwarzanie filtruje lustrzane dostawy OpenClaw i tury asystenta wstrzyknięte przez gateway.
- Sanityzacja obrazów ma zastosowanie przez regułę globalną.

**Mistral (w tym wykrywanie na podstawie identyfikatora modelu)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (znaki alfanumeryczne o długości 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwanie wartości `thought_signature`, które nie są base64 (zachowanie base64).

**OpenRouter Anthropic**

- Końcowe tury wstępnego wypełnienia asystenta są usuwane ze zweryfikowanych ładunków modeli Anthropic
  zgodnych z OpenAI w OpenRouter, gdy rozumowanie jest włączone, zgodnie
  z zachowaniem odtwarzania bezpośredniego Anthropic i Cloudflare Anthropic.

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkryptu:

- Rozszerzenie **transcript-sanitize** działało przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie użycia/wyników narzędzi.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner wykonywał też sanityzację specyficzną dla dostawcy, co dublowało pracę.
- Dodatkowe mutacje zachodziły poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (szczególnie parowanie `call_id|fc_id`
w `openai-responses`). Czyszczenie w 2026.1.22 usunęło rozszerzenie, scentralizowało
logikę w runnerze i uczyniło OpenAI **bez ingerencji** poza sanityzacją obrazów.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
