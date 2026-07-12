---
read_when:
    - Debugujesz odrzucenia żądań przez dostawcę związane ze strukturą transkrypcji
    - Zmieniasz logikę oczyszczania transkrypcji lub naprawy wywołań narzędzi
    - Badasz niezgodności identyfikatorów wywołań narzędzi między dostawcami
summary: 'Dokumentacja: reguły oczyszczania i naprawy transkrypcji specyficzne dla dostawcy'
title: Higiena transkrypcji
x-i18n:
    generated_at: "2026-07-12T15:37:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw stosuje **poprawki specyficzne dla dostawcy** do transkrypcji przed uruchomieniem
(podczas budowania kontekstu modelu). Większość z nich to korekty wykonywane **w pamięci**,
służące spełnieniu rygorystycznych wymagań dostawcy. Osobny etap naprawy pliku sesji może
również przepisać zapisany plik JSONL przed wczytaniem sesji, ale tylko w przypadku
nieprawidłowych wierszy lub utrwalonych tur, które nie są prawidłowymi trwałymi rekordami.
Dostarczone odpowiedzi asystenta są zachowywane na dysku; usuwanie wstępnego uzupełnienia
asystenta specyficzne dla dostawcy odbywa się wyłącznie podczas konstruowania wychodzących
ładunków.

Gdy następuje naprawa, przed atomową zamianą oryginalny plik jest zapisywany w tym samym
katalogu jako tymczasowy plik `*.bak-<pid>-<ts>`, a po pomyślnym zakończeniu zamiany jest
usuwany. Kopia zapasowa jest zachowywana tylko wtedy, gdy samo czyszczenie się nie powiedzie;
w takim przypadku zwracana jest jej ścieżka.

Zakres obejmuje:

- Utrzymywanie kontekstu polecenia wyłącznie dla środowiska uruchomieniowego poza turami transkrypcji widocznymi dla użytkownika
- Oczyszczanie identyfikatorów wywołań narzędzi
- Walidację danych wejściowych wywołań narzędzi
- Naprawę parowania wyników narzędzi
- Walidację i porządkowanie tur
- Czyszczenie sygnatur toku rozumowania
- Czyszczenie sygnatur myślenia
- Oczyszczanie ładunków obrazów
- Usuwanie pustych bloków tekstowych przed ponownym odtworzeniem u dostawcy
- Usuwanie niekompletnych tur ograniczonych długością, zawierających wyłącznie rozumowanie, przed ponownym odtworzeniem u dostawcy
- Oznaczanie pochodzenia danych wejściowych użytkownika (dla poleceń kierowanych między sesjami)
- Naprawę pustych tur błędów asystenta podczas ponownego odtwarzania przez Bedrock Converse

Szczegółowe informacje o przechowywaniu transkrypcji zawiera
[szczegółowy opis zarządzania sesjami](/pl/reference/session-management-compaction).

---

## Reguła globalna: kontekst środowiska uruchomieniowego nie jest transkrypcją użytkownika

Kontekst środowiska uruchomieniowego lub systemowy może zostać dodany do polecenia modelu
dla danej tury, ale nie stanowi treści utworzonej przez użytkownika końcowego. OpenClaw
przechowuje osobną treść polecenia przeznaczoną do transkrypcji dla odpowiedzi Gateway,
kolejkowanych działań uzupełniających, ACP, CLI i osadzonych uruchomień OpenClaw.
Zapisane, widoczne tury użytkownika używają tej treści transkrypcji zamiast polecenia
wzbogaconego o kontekst środowiska uruchomieniowego.

W przypadku starszych sesji, w których utrwalono już opakowania środowiska uruchomieniowego,
powierzchnie historii Gateway stosują projekcję wyświetlania przed zwróceniem wiadomości
klientom WebChat, TUI, REST lub SSE.

---

## Gdzie jest to wykonywane

Cała higiena transkrypcji jest scentralizowana w osadzonym module uruchamiającym:

- Wybór zasad: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, według `provider`, `modelApi` i `modelId`)
- Stosowanie oczyszczania i napraw: `sanitizeSessionHistory` w
  `src/agents/embedded-agent-runner/replay-history.ts`

Niezależnie od higieny transkrypcji pliki sesji są w razie potrzeby naprawiane
przed wczytaniem:

- `repairSessionFileIfNeeded` w `src/agents/session-file-repair.ts`
- Wywoływane z `src/agents/embedded-agent-runner/run/attempt.ts` oraz
  `src/agents/embedded-agent-runner/compact.ts`

---

## Reguła globalna: oczyszczanie obrazów

Ładunki obrazów są zawsze oczyszczane, aby zapobiec odrzuceniu przez dostawcę z powodu
limitów rozmiaru (zmniejszanie rozdzielczości i ponowna kompresja zbyt dużych obrazów
base64). Pomaga to również kontrolować zużycie tokenów przez obrazy w modelach obsługujących
widzenie: mniejsze maksymalne wymiary ograniczają zużycie tokenów, a większe zachowują
więcej szczegółów.

Implementacja:

- `sanitizeSessionMessagesImages` w
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` w `src/agents/tool-images.ts`
- Maksymalny bok obrazu można skonfigurować za pomocą `agents.defaults.imageMaxDimensionPx`
  (domyślnie: `1200`)
- Podczas przechodzenia przez ponownie odtwarzaną treść ten etap usuwa puste bloki tekstowe.
  Tury asystenta, które staną się puste, są usuwane z kopii do ponownego odtworzenia;
  tury użytkownika i wyników narzędzi, które staną się puste, otrzymują niepusty znacznik
  pominiętej treści.

---

## Reguła globalna: nieprawidłowe wywołania narzędzi

Bloki wywołań narzędzi asystenta, w których brakuje zarówno `input`, jak i `arguments`,
są usuwane przed zbudowaniem kontekstu modelu. Zapobiega to odrzucaniu przez dostawcę
częściowo utrwalonych wywołań narzędzi (na przykład po błędzie limitu szybkości).

Implementacja:

- `sanitizeToolCallInputs` w `src/agents/session-transcript-repair.ts`
- Stosowane w `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Reguła globalna: niekompletne tury zawierające wyłącznie rozumowanie

Tury asystenta, które osiągnęły limit danych wyjściowych dostawcy i zawierają wyłącznie
treść myślenia lub zredagowanego myślenia, są pomijane w przechowywanej w pamięci kopii
do ponownego odtworzenia. Takie tury zawierają niekompletny stan dostawcy i mogą przenosić
częściową sygnaturę myślenia.

Puste tury zakończone z powodu limitu długości pozostają niezmienione, podobnie jak tury
z widocznym tekstem, wywołaniami narzędzi lub nieznanymi blokami treści. Zapisane
transkrypcje nie są przepisywane.

Implementacja: `normalizeAssistantReplayContent` w
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Reguła globalna: pochodzenie danych wejściowych między sesjami

Gdy agent wysyła polecenie do innej sesji za pomocą `sessions_send`
(w tym na etapach odpowiedzi lub ogłoszeń między agentami), OpenClaw utrwala
utworzoną turę użytkownika z `message.provenance.kind = "inter_session"`.

OpenClaw dodaje również przed tekstem kierowanego polecenia znacznik tej samej tury
`[Inter-session message] ... isUser=false`, aby aktywne wywołanie modelu mogło odróżnić
dane wyjściowe obcej sesji od zewnętrznych instrukcji użytkownika końcowego. Znacznik ten
zawiera sesję źródłową, kanał i narzędzie, jeśli są dostępne. Ze względu na zgodność
z dostawcami transkrypcja nadal używa `role: "user"`, ale zarówno widoczny tekst, jak
i metadane pochodzenia oznaczają turę jako dane między sesjami.

Podczas odbudowywania kontekstu OpenClaw stosuje ten sam znacznik do starszych utrwalonych
tur użytkownika pochodzących z innych sesji, które mają wyłącznie metadane pochodzenia.

---

## Macierz dostawców (bieżące zachowanie)

**OpenAI / OpenAI Codex**

- Tylko oczyszczanie obrazów.
- Usuwanie osieroconych sygnatur rozumowania (samodzielnych elementów rozumowania bez
  następującego po nich bloku treści) z transkrypcji OpenAI Responses/Codex oraz usuwanie
  rozumowania OpenAI możliwego do ponownego odtworzenia po przełączeniu trasy modelu.
- Zachowywanie ładunków elementów rozumowania OpenAI Responses możliwych do ponownego
  odtworzenia, w tym zaszyfrowanych elementów z pustym podsumowaniem, aby ręczne ponowne
  odtwarzanie lub odtwarzanie przez WebSocket utrzymywało wymagany stan `rs_*` sparowany
  z elementami wyjściowymi asystenta.
- Natywny ChatGPT Codex Responses zachowuje zgodność z protokołem Codex, ponownie odtwarzając
  wcześniejsze ładunki rozumowania, wiadomości i funkcji Responses bez identyfikatorów
  wcześniejszych elementów, przy jednoczesnym zachowaniu sesyjnego `prompt_cache_key`.
- Ponowne odtwarzanie z rodziny OpenAI Responses zachowuje kanoniczne pary rozumowania
  tego samego modelu `call_*|fc_*`, ale przed konwersją ładunku pi-ai deterministycznie
  normalizuje nieprawidłowe lub zbyt długie identyfikatory `call_id` i elementów wywołań funkcji.
- Naprawa parowania wyników narzędzi może przenosić rzeczywiste dopasowane dane wyjściowe
  i generować dane wyjściowe w stylu Codex z wartością `aborted` dla brakujących wywołań narzędzi.
- Brak walidacji i zmiany kolejności tur; brak usuwania sygnatur toku rozumowania.

**Uzupełnianie czatu zgodne z OpenAI**

- Historyczne bloki myślenia i rozumowania asystenta są usuwane przed ponownym odtworzeniem,
  aby lokalne i pośredniczące serwery zgodne z OpenAI nie otrzymywały pól rozumowania
  z wcześniejszych tur, takich jak `reasoning` lub `reasoning_content`.
- Bieżące kontynuacje wywołań narzędzi w tej samej turze zachowują blok rozumowania asystenta
  dołączony do wywołania narzędzia, dopóki wynik narzędzia nie zostanie ponownie odtworzony.
- Niestandardowe lub samodzielnie hostowane wpisy modeli z `reasoning: true` zachowują
  ponownie odtwarzane metadane rozumowania.
- Wyjątki należące do dostawcy mogą zrezygnować z tej reguły, gdy ich protokół komunikacyjny
  wymaga ponownego odtwarzania metadanych rozumowania.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Oczyszczanie identyfikatorów wywołań narzędzi: wyłącznie znaki alfanumeryczne.
- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (naprzemienność tur w stylu Gemini).
- Korekta kolejności tur Google (dodanie na początku krótkiej inicjalizującej tury użytkownika,
  jeśli historia zaczyna się od asystenta).
- Antigravity Claude: normalizacja sygnatur myślenia; usuwanie niepodpisanych bloków myślenia.

**Anthropic / Minimax (zgodne z Anthropic)**

- Naprawa parowania wyników narzędzi i syntetyczne wyniki narzędzi.
- Walidacja tur (łączenie kolejnych tur użytkownika w celu spełnienia wymogu ścisłej
  naprzemienności).
- Końcowe tury wstępnego uzupełnienia asystenta są usuwane z wychodzących ładunków
  Anthropic Messages, gdy myślenie jest włączone, w tym na trasach Cloudflare AI Gateway.
- Sygnatury myślenia asystenta sprzed Compaction są usuwane przed ponownym odtworzeniem
  u dostawcy, gdy sesja została poddana Compaction. Sygnatury myślenia są kryptograficznie
  powiązane z prefiksem konwersacji istniejącym w chwili generowania; po Compaction prefiks
  się zmienia (podsumowana treść zastępuje oryginał), dlatego ponowne odtworzenie oryginalnych
  sygnatur powoduje odrzucenie żądania przez Anthropic z komunikatem
  "Invalid signature in thinking block". Tekst myślenia jest zachowywany jako niepodpisany
  blok, a następnie przetwarzany zgodnie z poniższą regułą.
- Bloki myślenia z brakującymi, pustymi lub zawierającymi wyłącznie białe znaki sygnaturami
  ponownego odtwarzania są usuwane przed konwersją dla dostawcy. Jeśli spowoduje to opróżnienie
  tury asystenta, OpenClaw zachowuje jej strukturę za pomocą niepustego tekstu informującego
  o pominięciu rozumowania.
- Starsze tury asystenta zawierające wyłącznie myślenie, które muszą zostać usunięte,
  są zastępowane niepustym tekstem informującym o pominięciu rozumowania, aby adaptery
  dostawcy nie usuwały ponownie odtwarzanej tury.

**Amazon Bedrock (Converse API)**

- Puste tury błędów strumienia asystenta są przed ponownym odtworzeniem naprawiane przez
  dodanie niepustego zastępczego bloku tekstowego. Bedrock Converse odrzuca wiadomości
  asystenta z `content: []`, dlatego utrwalone tury asystenta z `stopReason:
"error"` i pustą treścią są również naprawiane na dysku przed wczytaniem.
- Tury błędów strumienia asystenta zawierające wyłącznie puste bloki tekstowe są usuwane
  z przechowywanej w pamięci kopii do ponownego odtworzenia zamiast odtwarzania
  nieprawidłowego pustego bloku.
- Sygnatury myślenia asystenta sprzed Compaction są usuwane przed ponownym odtworzeniem
  przez Converse, gdy sesja została poddana Compaction, z tego samego powodu co w przypadku
  Anthropic opisanym powyżej.
- Bloki myślenia Claude z brakującymi, pustymi lub zawierającymi wyłącznie białe znaki
  sygnaturami ponownego odtwarzania są usuwane przed ponownym odtworzeniem przez Converse.
  Jeśli spowoduje to opróżnienie tury asystenta, OpenClaw zachowuje jej strukturę za pomocą
  niepustego tekstu informującego o pominięciu rozumowania.
- Starsze tury asystenta zawierające wyłącznie myślenie, które muszą zostać usunięte,
  są zastępowane niepustym tekstem informującym o pominięciu rozumowania, aby ponowne
  odtwarzanie przez Converse zachowało ścisłą strukturę tur.
- Ponowne odtwarzanie odfiltrowuje tury asystenta stanowiące kopie lustrzane dostarczenia
  OpenClaw oraz tury wstrzyknięte przez Gateway.
- Oczyszczanie obrazów jest stosowane zgodnie z regułą globalną.

**Mistral (w tym wykrywanie na podstawie identyfikatora modelu)**

- Oczyszczanie identyfikatorów wywołań narzędzi: strict9 (znaki alfanumeryczne, długość 9).

**OpenRouter Gemini**

- Czyszczenie sygnatur toku rozumowania: usuwanie wartości `thought_signature`, które
  nie są w formacie base64 (wartości base64 są zachowywane).

**OpenRouter Anthropic**

- Końcowe tury wstępnego uzupełnienia asystenta są usuwane ze zweryfikowanych ładunków
  modeli Anthropic zgodnych z OpenAI w OpenRouter, gdy rozumowanie jest włączone,
  zgodnie z zachowaniem ponownego odtwarzania bezpośredniego Anthropic i Cloudflare Anthropic.

**Wszystkie pozostałe**

- Tylko oczyszczanie obrazów.

---

## Zachowanie historyczne (sprzed wersji 2026.1.22)

Przed wydaniem wersji 2026.1.22 OpenClaw stosował wiele warstw higieny transkrypcji:

- **Rozszerzenie oczyszczające transkrypcję** było uruchamiane przy każdym budowaniu kontekstu
  i mogło:
  - Naprawiać parowanie użycia narzędzi i ich wyników.
  - Oczyszczać identyfikatory wywołań narzędzi (w tym w trybie nieścisłym,
    który zachowywał `_`/`-`).
- Moduł uruchamiający wykonywał również oczyszczanie specyficzne dla dostawcy,
  co powodowało powielanie pracy.
- Dodatkowe modyfikacje odbywały się poza zasadami dostawcy, w tym usuwanie znaczników
  `<final>` z tekstu asystenta przed utrwaleniem, usuwanie pustych tur błędów asystenta
  oraz przycinanie treści asystenta po wywołaniach narzędzi.

Ta złożoność powodowała regresje między dostawcami (zwłaszcza w parowaniu
`call_id|fc_id` dla `openai-responses`). Porządki w wersji 2026.1.22 usunęły
rozszerzenie, scentralizowały logikę w module uruchamiającym i wprowadziły zasadę
**bez ingerencji** dla OpenAI poza oczyszczaniem obrazów.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Oczyszczanie sesji](/pl/concepts/session-pruning)
