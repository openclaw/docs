---
read_when:
    - Diagnozujesz odrzucenia żądań przez dostawców związane ze strukturą transkryptu
    - Zmieniasz logikę sanityzacji transkryptu lub naprawy wywołań narzędzi
    - Badasz niezgodności identyfikatorów wywołań narzędzi między dostawcami
summary: 'Materiały referencyjne: specyficzne dla dostawcy reguły oczyszczania i naprawy transkryptu'
title: Higiena transkrypcji
x-i18n:
    generated_at: "2026-04-30T10:18:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw stosuje **poprawki specyficzne dla dostawcy** do transkryptów przed uruchomieniem (podczas budowania kontekstu modelu). Większość z nich to korekty **w pamięci**, używane do spełnienia rygorystycznych wymagań dostawców. Oddzielny przebieg naprawy pliku sesji może też przepisać zapisany JSONL przed wczytaniem sesji, usuwając zniekształcone wiersze JSONL albo naprawiając utrwalone tury, które są poprawne składniowo, ale wiadomo, że zostaną odrzucone przez
dostawcę podczas odtwarzania. Gdy nastąpi naprawa, oryginalny plik jest archiwizowany obok
pliku sesji.

Zakres obejmuje:

- Kontekst promptu wyłącznie czasu wykonania, który nie trafia do widocznych dla użytkownika tur transkryptu
- Sanityzację identyfikatorów wywołań narzędzi
- Walidację danych wejściowych wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / porządkowanie tur
- Czyszczenie sygnatur myśli
- Czyszczenie sygnatur myślenia
- Sanityzację ładunków obrazów
- Czyszczenie pustych bloków tekstu przed odtworzeniem u dostawcy
- Oznaczanie pochodzenia danych wejściowych użytkownika (dla promptów trasowanych między sesjami)
- Naprawę pustej tury błędu asystenta dla odtwarzania Bedrock Converse

Jeśli potrzebujesz szczegółów przechowywania transkryptów, zobacz:

- [Szczegółowy opis zarządzania sesjami](/pl/reference/session-management-compaction)

---

## Reguła globalna: kontekst czasu wykonania nie jest transkryptem użytkownika

Kontekst czasu wykonania/systemowy może zostać dodany do promptu modelu dla danej tury, ale nie jest
treścią utworzoną przez użytkownika końcowego. OpenClaw utrzymuje oddzielną, skierowaną do transkryptu
treść promptu dla odpowiedzi Gateway, zakolejkowanych kontynuacji, ACP, CLI i osadzonych uruchomień Pi.
Zapisane widoczne tury użytkownika używają tej treści transkryptu zamiast
promptu wzbogaconego o kontekst czasu wykonania.

W przypadku starszych sesji, które już utrwaliły opakowania czasu wykonania, powierzchnie historii Gateway
stosują projekcję wyświetlania przed zwróceniem wiadomości klientom WebChat,
TUI, REST lub SSE.

---

## Gdzie to działa

Cała higiena transkryptu jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji/naprawy: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId`, aby zdecydować, co zastosować.

Niezależnie od higieny transkryptu pliki sesji są naprawiane (jeśli to potrzebne) przed wczytaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu limitów
rozmiaru (zmniejszanie/rekompresja zbyt dużych obrazów base64).

Pomaga to też kontrolować presję tokenów wywoływaną przez obrazy w modelach obsługujących widzenie.
Niższe maksymalne wymiary zwykle zmniejszają użycie tokenów; wyższe wymiary zachowują szczegóły.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można skonfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).
- Puste bloki tekstowe są usuwane, gdy ten przebieg przechodzi po treści odtwarzania. Tury asystenta,
  które stają się puste, są usuwane z kopii odtwarzania; tury użytkownika i wyników narzędzi,
  które stają się puste, otrzymują niepusty placeholder pominiętej treści.

---

## Reguła globalna: zniekształcone wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom przez dostawców z powodu częściowo
utrwalonych wywołań narzędzi (na przykład po błędzie limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Zastosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi/ogłoszenia agent-do-agenta), OpenClaw utrwala utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

OpenClaw poprzedza też trasowany tekst promptu znacznikiem tej samej tury `[Inter-session message ... isUser=false]`,
aby aktywne wywołanie modelu mogło odróżnić dane wyjściowe obcej sesji od zewnętrznych instrukcji użytkownika końcowego.
Ten znacznik zawiera sesję źródłową, kanał i narzędzie, gdy są dostępne. Transkrypt nadal używa
`role: "user"` dla zgodności z dostawcą, ale widoczny tekst i metadane pochodzenia
oznaczają turę jako dane między sesjami.

Podczas przebudowy kontekstu OpenClaw stosuje ten sam znacznik do starszych utrwalonych
tur użytkownika między sesjami, które mają tylko metadane pochodzenia.

---

## Macierz dostawców (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuwanie osieroconych sygnatur rozumowania (samodzielnych elementów rozumowania bez następującego po nich bloku treści) dla transkryptów OpenAI Responses/Codex oraz usuwanie odtwarzalnego rozumowania OpenAI po przełączeniu trasy modelu.
- Zachowywanie ładunków odtwarzalnych elementów rozumowania OpenAI Responses, w tym zaszyfrowanych elementów z pustym podsumowaniem, aby ręczne/WebSocket odtwarzanie zachowało wymagany stan `rs_*` sparowany z elementami wyjściowymi asystenta.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane wyjścia i syntetyzować wyjścia `aborted` w stylu Codex dla brakujących wywołań narzędzi.
- Brak walidacji lub zmiany kolejności tur.
- Brakujące wyjścia narzędzi z rodziny OpenAI Responses są syntetyzowane jako `aborted`, aby odpowiadać normalizacji odtwarzania Codex.
- Brak usuwania sygnatur myśli.

**Gemma 4 zgodna z OpenAI**

- Historyczne bloki myślenia/rozumowania asystenta są usuwane przed odtworzeniem, aby lokalne
  serwery Gemma 4 zgodne z OpenAI nie otrzymywały treści rozumowania z wcześniejszych tur.
- Bieżące kontynuacje wywołań narzędzi w tej samej turze zachowują blok rozumowania asystenta
  dołączony do wywołania narzędzia do momentu odtworzenia wyniku narzędzia.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisłe alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Korekta kolejności tur Google (dodanie na początku małego bootstrapu użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur myślenia; usuwanie niepodpisanych bloków myślenia.

**Anthropic / Minimax (zgodny z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (scalanie kolejnych tur użytkownika, aby spełnić ścisłą naprzemienność).
- Końcowe tury wypełnienia wstępnego asystenta są usuwane z wychodzących ładunków Anthropic Messages,
  gdy myślenie jest włączone, w tym tras Cloudflare AI Gateway.
- Bloki myślenia z brakującymi, pustymi lub pustymi po usunięciu białych znaków sygnaturami odtwarzania są usuwane
  przed konwersją dostawcy. Jeśli to opróżni turę asystenta, OpenClaw zachowuje
  kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego rozumowania, aby adaptery dostawców nie usuwały tury
  odtwarzania.

**Amazon Bedrock (Converse API)**

- Puste tury błędu strumienia asystenta są naprawiane do niepustego awaryjnego bloku tekstowego
  przed odtworzeniem. Bedrock Converse odrzuca wiadomości asystenta z `content: []`, więc
  utrwalone tury asystenta z `stopReason: "error"` i pustą treścią są też
  naprawiane na dysku przed wczytaniem.
- Tury błędu strumienia asystenta, które zawierają tylko puste bloki tekstowe, są usuwane
  z kopii odtwarzania w pamięci zamiast odtwarzać nieprawidłowy pusty blok.
- Bloki myślenia Claude z brakującymi, pustymi lub pustymi po usunięciu białych znaków sygnaturami odtwarzania są
  usuwane przed odtwarzaniem Converse. Jeśli to opróżni turę asystenta, OpenClaw
  zachowuje kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego rozumowania, aby odtwarzanie Converse zachowało ścisły kształt tury.
- Odtwarzanie filtruje tury asystenta będące lustrzanym odbiciem dostarczenia OpenClaw oraz tury wstrzyknięte przez Gateway.
- Sanityzacja obrazów działa przez regułę globalną.

**Mistral (w tym wykrywanie na podstawie identyfikatora modelu)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (alfanumeryczne o długości 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwanie wartości `thought_signature`, które nie są base64 (zachowywanie base64).

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkryptu:

- **Rozszerzenie sanityzujące transkrypt** działało przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie użycia narzędzi/wyników.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner wykonywał też sanityzację specyficzną dla dostawcy, co dublowało pracę.
- Dodatkowe mutacje występowały poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędów asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (zwłaszcza parowanie `call_id|fc_id` w `openai-responses`).
Porządkowanie w wersji 2026.1.22 usunęło rozszerzenie, scentralizowało
logikę w runnerze i sprawiło, że OpenAI pozostaje **nietknięte** poza sanityzacją obrazów.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
