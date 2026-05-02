---
read_when:
    - Debugujesz odrzucenia żądań przez dostawcę związane ze strukturą transkryptu
    - Zmieniasz logikę sanityzacji transkryptu lub naprawy wywołań narzędzi
    - Badasz niezgodności identyfikatorów wywołań narzędzi między dostawcami
summary: 'Informacje referencyjne: reguły oczyszczania i naprawy transkryptów specyficzne dla dostawcy'
title: Higiena transkryptu
x-i18n:
    generated_at: "2026-05-02T10:02:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw stosuje **poprawki specyficzne dla dostawcy** do transkrypcji przed uruchomieniem (podczas budowania kontekstu modelu). Większość z nich to korekty **w pamięci**, używane do spełnienia rygorystycznych wymagań dostawców. Osobny przebieg naprawy pliku sesji może także przepisać zapisany JSONL przed załadowaniem sesji, usuwając nieprawidłowe wiersze JSONL albo naprawiając utrwalone tury, które są składniowo poprawne, ale wiadomo, że zostaną odrzucone przez
dostawcę podczas odtwarzania. Gdy nastąpi naprawa, oryginalny plik jest zapisywany jako kopia zapasowa obok
pliku sesji.

Zakres obejmuje:

- Kontekst promptu tylko w czasie działania pozostający poza widocznymi dla użytkownika turami transkrypcji
- Sanityzację identyfikatorów wywołań narzędzi
- Walidację danych wejściowych wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację / porządkowanie tur
- Czyszczenie sygnatur myśli
- Czyszczenie sygnatur myślenia
- Sanityzację ładunków obrazów
- Czyszczenie pustych bloków tekstowych przed odtwarzaniem u dostawcy
- Oznaczanie pochodzenia danych wejściowych użytkownika (dla promptów kierowanych między sesjami)
- Naprawę pustych tur błędu asystenta dla odtwarzania Bedrock Converse

Jeśli potrzebujesz szczegółów przechowywania transkrypcji, zobacz:

- [Szczegółowy opis zarządzania sesją](/pl/reference/session-management-compaction)

---

## Reguła globalna: kontekst runtime nie jest transkrypcją użytkownika

Kontekst runtime/systemowy może zostać dodany do promptu modelu dla danej tury, ale nie jest
treścią napisaną przez użytkownika końcowego. OpenClaw utrzymuje osobną treść
promptu przeznaczoną dla transkrypcji na potrzeby odpowiedzi Gateway, kolejkowanych kontynuacji, ACP, CLI i osadzonych uruchomień Pi.
Zapisane widoczne tury użytkownika używają tej treści transkrypcji zamiast
promptu wzbogaconego w czasie działania.

Dla starszych sesji, które już utrwaliły opakowania runtime, powierzchnie historii Gateway
stosują projekcję wyświetlania przed zwróceniem wiadomości do klientów WebChat,
TUI, REST lub SSE.

---

## Gdzie to działa

Cała higiena transkrypcji jest scentralizowana w osadzonym runnerze:

- Wybór polityki: `src/agents/transcript-policy.ts`
- Zastosowanie sanityzacji/naprawy: `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

Polityka używa `provider`, `modelApi` i `modelId`, aby zdecydować, co zastosować.

Niezależnie od higieny transkrypcji pliki sesji są naprawiane (w razie potrzeby) przed załadowaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `run/attempt.ts` i `compact.ts` (osadzony runner)

---

## Reguła globalna: sanityzacja obrazów

Ładunki obrazów są zawsze sanityzowane, aby zapobiec odrzuceniu po stronie dostawcy z powodu limitów
rozmiaru (skalowanie w dół / ponowna kompresja zbyt dużych obrazów base64).

Pomaga to także kontrolować presję tokenów wywołaną obrazami w modelach obsługujących widzenie.
Niższe maksymalne wymiary zwykle zmniejszają użycie tokenów; wyższe wymiary zachowują szczegóły.

Implementacja:

- `sanitizeSessionMessagesImages` w `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można skonfigurować przez `agents.defaults.imageMaxDimensionPx` (domyślnie: `1200`).
- Puste bloki tekstowe są usuwane, gdy ten przebieg przechodzi przez treść odtwarzania. Tury asystenta,
  które stają się puste, są usuwane z kopii odtwarzania; tury użytkownika i wyniku narzędzia,
  które stają się puste, otrzymują niepusty placeholder pominiętej treści.

---

## Reguła globalna: nieprawidłowe wywołania narzędzi

Bloki wywołań narzędzi asystenta, którym brakuje zarówno `input`, jak i `arguments`, są usuwane
przed zbudowaniem kontekstu modelu. Zapobiega to odrzuceniom przez dostawcę z powodu częściowo
utrwalonych wywołań narzędzi (na przykład po błędzie limitu częstotliwości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory` w `src/agents/pi-embedded-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła prompt do innej sesji przez `sessions_send` (w tym
kroki odpowiedzi/ogłoszeń między agentami), OpenClaw zapisuje utworzoną turę użytkownika z:

- `message.provenance.kind = "inter_session"`

OpenClaw poprzedza także tekst kierowanego promptu znacznikiem w tej samej turze `[Inter-session message ... isUser=false]`,
aby aktywne wywołanie modelu mogło odróżnić dane wyjściowe obcej sesji
od zewnętrznych instrukcji użytkownika końcowego. Ten znacznik zawiera
sesję źródłową, kanał i narzędzie, gdy są dostępne. Transkrypcja nadal używa
`role: "user"` dla zgodności z dostawcami, ale widoczny tekst i metadane
pochodzenia oznaczają turę jako dane między sesjami.

Podczas odbudowy kontekstu OpenClaw stosuje ten sam znacznik do starszych utrwalonych
tur użytkownika między sesjami, które mają tylko metadane pochodzenia.

---

## Macierz dostawców (obecne zachowanie)

**OpenAI / OpenAI Codex**

- Tylko sanityzacja obrazów.
- Usuń osierocone sygnatury reasoning (samodzielne elementy reasoning bez następującego po nich bloku treści) dla transkrypcji OpenAI Responses/Codex oraz usuń odtwarzalne reasoning OpenAI po zmianie trasy modelu.
- Zachowaj odtwarzalne ładunki elementów reasoning OpenAI Responses, w tym zaszyfrowane elementy pustego podsumowania, aby ręczne/WebSocket odtwarzanie zachowało wymagany stan `rs_*` sparowany z elementami wyjściowymi asystenta.
- Brak sanityzacji identyfikatorów wywołań narzędzi.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane dane wyjściowe i syntetyzować dane wyjściowe w stylu Codex `aborted` dla brakujących wywołań narzędzi.
- Brak walidacji ani zmiany kolejności tur.
- Brakujące dane wyjściowe narzędzi rodziny OpenAI Responses są syntetyzowane jako `aborted`, aby pasowały do normalizacji odtwarzania Codex.
- Brak usuwania sygnatur myśli.

**Gemma 4 zgodna z OpenAI**

- Historyczne bloki myślenia/reasoning asystenta są usuwane przed odtwarzaniem, aby lokalne
  serwery Gemma 4 zgodne z OpenAI nie otrzymywały treści reasoning z poprzednich tur.
- Bieżące kontynuacje wywołań narzędzi w tej samej turze zachowują blok reasoning asystenta
  dołączony do wywołania narzędzia, dopóki wynik narzędzia nie zostanie odtworzony.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanityzacja identyfikatorów wywołań narzędzi: rygorystycznie alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Korekta kolejności tur Google (dodanie na początku małej tury startowej użytkownika, jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizuj sygnatury myślenia; usuwaj niepodpisane bloki myślenia.

**Anthropic / Minimax (zgodny z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (scalanie kolejnych tur użytkownika, aby spełnić rygorystyczną naprzemienność).
- Końcowe tury wstępnego wypełnienia asystenta są usuwane z wychodzących ładunków Anthropic Messages,
  gdy myślenie jest włączone, w tym tras Cloudflare AI Gateway.
- Bloki myślenia z brakującymi, pustymi lub pustymi po przycięciu sygnaturami odtwarzania są usuwane
  przed konwersją dla dostawcy. Jeśli opróżni to turę asystenta, OpenClaw zachowuje
  kształt tury z niepustym tekstem pominiętego reasoning.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego reasoning, aby adaptery dostawców nie usuwały tury
  odtwarzania.

**Amazon Bedrock (Converse API)**

- Puste tury błędów strumienia asystenta są naprawiane do niepustego bloku tekstu zastępczego
  przed odtwarzaniem. Bedrock Converse odrzuca wiadomości asystenta z `content: []`, więc
  utrwalone tury asystenta z `stopReason: "error"` i pustą treścią są także
  naprawiane na dysku przed załadowaniem.
- Tury błędów strumienia asystenta, które zawierają tylko puste bloki tekstowe, są usuwane
  z kopii odtwarzania w pamięci zamiast odtwarzania nieprawidłowego pustego bloku.
- Bloki myślenia Claude z brakującymi, pustymi lub pustymi po przycięciu sygnaturami odtwarzania są
  usuwane przed odtwarzaniem Converse. Jeśli opróżni to turę asystenta, OpenClaw
  zachowuje kształt tury z niepustym tekstem pominiętego reasoning.
- Starsze tury asystenta zawierające tylko myślenie, które muszą zostać usunięte, są zastępowane
  niepustym tekstem pominiętego reasoning, aby odtwarzanie Converse zachowało rygorystyczny kształt tur.
- Odtwarzanie filtruje tury asystenta z lustrzanego dostarczania OpenClaw i wstrzyknięte przez Gateway.
- Sanityzacja obrazów jest stosowana przez regułę globalną.

**Mistral (w tym wykrywanie na podstawie identyfikatora modelu)**

- Sanityzacja identyfikatorów wywołań narzędzi: strict9 (alfanumeryczne, długość 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur myśli: usuwaj wartości `thought_signature`, które nie są base64 (zachowuj base64).

**OpenRouter Anthropic**

- Końcowe tury wstępnego wypełnienia asystenta są usuwane ze zweryfikowanych ładunków modeli Anthropic
  zgodnych z OpenAI przez OpenRouter, gdy reasoning jest włączone, zgodnie z zachowaniem
  odtwarzania bezpośrednio w Anthropic i Cloudflare Anthropic.

**Wszystko pozostałe**

- Tylko sanityzacja obrazów.

---

## Zachowanie historyczne (przed 2026.1.22)

Przed wydaniem 2026.1.22 OpenClaw stosował wiele warstw higieny transkrypcji:

- **Plugin sanityzujący transkrypcję** działał przy każdym budowaniu kontekstu i mógł:
  - Naprawiać parowanie użycia/wyniku narzędzia.
  - Sanityzować identyfikatory wywołań narzędzi (w tym tryb nierygorystyczny, który zachowywał `_`/`-`).
- Runner wykonywał także sanityzację specyficzną dla dostawcy, co duplikowało pracę.
- Dodatkowe mutacje zachodziły poza polityką dostawcy, w tym:
  - Usuwanie tagów `<final>` z tekstu asystenta przed utrwaleniem.
  - Usuwanie pustych tur błędu asystenta.
  - Przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (zwłaszcza parowanie `call_id|fc_id` w `openai-responses`).
Porządki w 2026.1.22 usunęły Plugin, scentralizowały
logikę w runnerze i sprawiły, że OpenAI jest **no-touch** poza sanityzacją obrazów.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
