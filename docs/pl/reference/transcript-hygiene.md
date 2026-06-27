---
read_when:
    - Debugujesz odrzucenia żądań dostawcy związane z kształtem transkryptu
    - Zmieniasz logikę sanityzacji transkrypcji lub naprawy wywołań narzędzi
    - Badasz niezgodności identyfikatorów wywołań narzędzi między dostawcami
summary: 'Dokumentacja referencyjna: reguły sanityzacji transkryptów i naprawy specyficzne dla dostawcy'
title: Higiena transkrypcji
x-i18n:
    generated_at: "2026-06-27T18:21:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw stosuje **poprawki specyficzne dla dostawcy** do transkrypcji przed przebiegiem (budowaniem kontekstu modelu). Większość z nich to korekty **w pamięci**, używane do spełnienia rygorystycznych wymagań dostawcy. Osobny przebieg naprawy pliku sesji może także przepisać zapisany JSONL przed załadowaniem sesji, ale tylko dla nieprawidłowo sformatowanych wierszy lub utrwalonych tur, które są nieprawidłowymi trwałymi rekordami. Dostarczone odpowiedzi asystenta są zachowywane na dysku; usuwanie wstępnego wypełnienia asystenta specyficzne dla dostawcy odbywa się tylko podczas konstruowania wychodzących ładunków. Gdy dochodzi do naprawy, oryginalny plik jest zapisywany do tymczasowego sąsiedniego pliku `*.bak-<pid>-<ts>` przed atomowym zastąpieniem i usuwany po powodzeniu zastąpienia; kopia zapasowa jest zachowywana tylko wtedy, gdy samo czyszczenie się nie powiedzie (w takim przypadku ścieżka jest zwracana).

Zakres obejmuje:

- Kontekst promptu wyłącznie w czasie wykonywania pozostający poza widocznymi dla użytkownika turami transkrypcji
- Sanityzację identyfikatorów wywołań narzędzi
- Walidację wejścia wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / porządkowanie tur
- Czyszczenie sygnatur myśli
- Czyszczenie sygnatur myślenia
- Sanityzację ładunków obrazów
- Czyszczenie pustych bloków tekstu przed odtwarzaniem u dostawcy
- Czyszczenie niekompletnych tur długości zawierających tylko rozumowanie przed odtwarzaniem u dostawcy
- Oznaczanie pochodzenia danych wejściowych użytkownika (dla promptów trasowanych między sesjami)
- Naprawę pustych tur błędu asystenta dla odtwarzania Bedrock Converse

Jeśli potrzebujesz szczegółów przechowywania transkrypcji, zobacz:

- [Szczegółowe omówienie zarządzania sesją](/pl/reference/session-management-compaction)

---

## Reguła globalna: kontekst czasu wykonywania nie jest transkrypcją użytkownika

Kontekst czasu wykonywania/systemowy może zostać dodany do promptu modelu dla tury, ale nie jest
treścią utworzoną przez użytkownika końcowego. OpenClaw utrzymuje osobne, skierowane do transkrypcji
ciało promptu dla odpowiedzi Gateway, kolejkowanych kontynuacji, ACP, CLI i osadzonych przebiegów OpenClaw.
Zapisane widoczne tury użytkownika używają tego ciała transkrypcji zamiast
promptu wzbogaconego o dane czasu wykonywania.

Dla starszych sesji, które już utrwaliły opakowania czasu wykonywania, powierzchnie historii Gateway
stosują projekcję wyświetlania przed zwróceniem wiadomości do klientów WebChat,
TUI, REST lub SSE.

---

## Gdzie to działa

Cała higiena transkrypcji jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji/naprawy: `sanitizeSessionHistory` w `src/agents/embedded-agent-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId`, aby zdecydować, co zastosować.

Niezależnie od higieny transkrypcji pliki sesji są naprawiane (w razie potrzeby) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu limitów
rozmiaru (skalowanie w dół/rekompresja zbyt dużych obrazów base64).

Pomaga to także kontrolować presję tokenów generowaną przez obrazy dla modeli obsługujących wizję.
Niższe maksymalne wymiary zwykle zmniejszają użycie tokenów; wyższe wymiary zachowują szczegóły.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można skonfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).
- Puste bloki tekstu są usuwane podczas tego przebiegu po zawartości odtwarzania. Tury asystenta,
  które stają się puste, są usuwane z kopii odtwarzania; tury użytkownika i wyniku narzędzia,
  które stają się puste, otrzymują niepusty placeholder pominiętej zawartości.

---

## Reguła globalna: nieprawidłowo sformatowane wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom przez dostawcę wynikającym z częściowo
utrwalonych wywołań narzędzi (na przykład po błędzie limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Zastosowane w `sanitizeSessionHistory` w `src/agents/embedded-agent-runner/replay-history.ts`

---

## Reguła globalna: niekompletne tury zawierające tylko rozumowanie

Tury asystenta, które osiągnęły limit wyjścia dostawcy i zawierają tylko myślenie lub
zredagowaną treść myślenia, są pomijane w kopii odtwarzania w pamięci. Takie tury
zawierają niekompletny stan dostawcy i mogą przenosić częściową sygnaturę myślenia.

Puste tury długości pozostają niezmienione, podobnie jak tury długości z widocznym tekstem, wywołaniami
narzędzi lub nieznanymi blokami zawartości. Zapisane transkrypcje nie są przepisywane.

Implementacja:

- `normalizeAssistantReplayContent` w `src/agents/embedded-agent-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie wejścia między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym kroki
odpowiedzi/ogłoszenia agent-do-agenta), OpenClaw utrwala utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

OpenClaw dodaje także na początku tej samej tury znacznik `[Inter-session message ... isUser=false]`
przed tekstem trasowanego promptu, aby aktywne wywołanie modelu mogło odróżnić
wyjście obcej sesji od zewnętrznych instrukcji użytkownika końcowego. Ten znacznik zawiera
sesję źródłową, kanał i narzędzie, jeśli są dostępne. Transkrypcja nadal używa
`role: "user"` dla zgodności z dostawcą, ale widoczny tekst i metadane pochodzenia
oznaczają turę jako dane między sesjami.

Podczas odbudowy kontekstu OpenClaw stosuje ten sam znacznik do starszych utrwalonych
tur użytkownika między sesjami, które mają tylko metadane pochodzenia.

---

## Macierz dostawców (obecne zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuwanie osieroconych sygnatur rozumowania (samodzielnych elementów rozumowania bez następującego po nich bloku zawartości) dla transkrypcji OpenAI Responses/Codex oraz usuwanie odtwarzalnego rozumowania OpenAI po zmianie trasy modelu.
- Zachowywanie ładunków odtwarzalnych elementów rozumowania OpenAI Responses, w tym zaszyfrowanych elementów z pustym podsumowaniem, aby ręczne/WebSocket odtwarzanie utrzymywało wymagany stan `rs_*` sparowany z elementami wyjścia asystenta.
- Natywne ChatGPT Codex Responses podąża za zgodnością przewodową Codex, odtwarzając wcześniejsze ładunki rozumowania/wiadomości/funkcji Responses bez wcześniejszych identyfikatorów elementów, przy zachowaniu sesyjnego `prompt_cache_key`.
- Odtwarzanie rodziny OpenAI Responses zachowuje kanoniczne pary rozumowania tego samego modelu `call_*|fc_*`, ale deterministycznie normalizuje nieprawidłowo sformatowane lub zbyt długie identyfikatory `call_id` / elementów wywołań funkcji przed konwersją ładunku pi-ai.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane wyjścia i syntetyzować wyjścia w stylu Codex `aborted` dla brakujących wywołań narzędzi.
- Brak walidacji lub zmiany kolejności tur.
- Brakujące wyjścia narzędzi rodziny OpenAI Responses są syntetyzowane jako `aborted`, aby pasować do normalizacji odtwarzania Codex.
- Brak usuwania sygnatur myśli.

**Chat Completions zgodne z OpenAI**

- Historyczne bloki myślenia/rozumowania asystenta są usuwane przed odtwarzaniem, aby
  lokalne i proxy-style serwery zgodne z OpenAI nie otrzymywały pól rozumowania z wcześniejszych tur,
  takich jak `reasoning` lub `reasoning_content`.
- Bieżące kontynuacje wywołań narzędzi w tej samej turze zachowują blok rozumowania asystenta
  dołączony do wywołania narzędzia do czasu odtworzenia wyniku narzędzia.
- Niestandardowe/samodzielnie hostowane wpisy modeli z `reasoning: true` zachowują odtworzone
  metadane rozumowania.
- Wyjątki należące do dostawcy mogą zrezygnować, gdy ich protokół przewodowy wymaga
  odtworzonych metadanych rozumowania.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: ścisłe znaki alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Naprawa kolejności tur Google (dodanie na początku drobnego bootstrapu użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizowanie sygnatur myślenia; usuwanie niepodpisanych bloków myślenia.

**Anthropic / Minimax (zgodne z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (scalanie kolejnych tur użytkownika, aby spełnić ścisłą naprzemienność).
- Końcowe tury wstępnego wypełnienia asystenta są usuwane z wychodzących ładunków Anthropic Messages,
  gdy myślenie jest włączone, w tym tras Cloudflare AI Gateway.
- Sygnatury myślenia asystenta sprzed Compaction są usuwane przed odtwarzaniem
  u dostawcy, gdy sesja została skompaktowana. Sygnatury myślenia są
  kryptograficznie powiązane z prefiksem konwersacji w czasie generowania; po
  Compaction prefiks się zmienia (podsumowana treść jest zastępowana podsumowaniem
  Compaction), więc odtworzenie oryginalnych sygnatur powoduje odrzucenie żądania
  przez Anthropic z komunikatem "Invalid signature in thinking block". Tekst myślenia jest
  zachowywany jako niepodpisany blok, a następnie obsługiwany przez regułę poniżej.
- Bloki myślenia z brakującymi, pustymi lub blank replay signatures są usuwane
  przed konwersją dostawcy. Jeśli to opróżnia turę asystenta, OpenClaw zachowuje
  kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego rozumowania, aby adaptery dostawcy nie usuwały odtwarzanej
  tury.

**Amazon Bedrock (Converse API)**

- Puste tury błędu strumienia asystenta są naprawiane do niepustego zastępczego bloku tekstu
  przed odtwarzaniem. Bedrock Converse odrzuca wiadomości asystenta z `content: []`, więc
  utrwalone tury asystenta ze `stopReason: "error"` i pustą zawartością są także
  naprawiane na dysku przed załadowaniem.
- Tury błędu strumienia asystenta, które zawierają tylko puste bloki tekstu, są usuwane
  z kopii odtwarzania w pamięci zamiast odtwarzać nieprawidłowy pusty blok.
- Sygnatury myślenia asystenta sprzed Compaction są usuwane przed odtwarzaniem Converse,
  gdy sesja została skompaktowana, z tego samego powodu co w Anthropic
  powyżej.
- Bloki myślenia Claude z brakującymi, pustymi lub blank replay signatures są
  usuwane przed odtwarzaniem Converse. Jeśli to opróżnia turę asystenta, OpenClaw
  zachowuje kształt tury z niepustym tekstem pominiętego rozumowania.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego rozumowania, aby odtwarzanie Converse zachowało ścisły kształt tury.
- Odtwarzanie filtruje tury asystenta OpenClaw będące lustrzanymi kopiami dostarczenia i wstrzyknięte przez Gateway.
- Sanityzacja obrazów stosuje się przez regułę globalną.

**Mistral (w tym wykrywanie na podstawie identyfikatora modelu)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (długość alfanumeryczna 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwanie wartości `thought_signature` niebędących base64 (zachowywanie base64).

**OpenRouter Anthropic**

- Końcowe tury wstępnego wypełnienia asystenta są usuwane ze zweryfikowanych ładunków modeli Anthropic
  zgodnych z OpenAI w OpenRouter, gdy rozumowanie jest włączone, zgodnie z
  bezpośrednim zachowaniem odtwarzania Anthropic i Cloudflare Anthropic.

**Wszystko inne**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkrypcji:

- Rozszerzenie **transcript-sanitize** działało przy każdym budowaniu kontekstu i mogło:
  - Naprawiać parowanie użycia narzędzia/wyniku.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nieścisły, który zachowywał `_`/`-`).
- Runner wykonywał także sanityzację specyficzną dla dostawcy, co dublowało pracę.
- Dodatkowe mutacje zachodziły poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędu asystenta.
  - Przycinanie zawartości asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (zwłaszcza parowanie `call_id|fc_id`
`openai-responses`). Czyszczenie w 2026.1.22 usunęło rozszerzenie, scentralizowało
logikę w runnerze i uczyniło OpenAI **bez dotykania** poza sanityzacją obrazów.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
