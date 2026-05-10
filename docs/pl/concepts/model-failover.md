---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, okresów karencji lub zachowania awaryjnego przełączania modeli
    - Aktualizowanie reguł przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modelu sesji współdziałają z ponownymi próbami awaryjnymi
sidebarTitle: Model failover
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Przełączanie awaryjne modelu
x-i18n:
    generated_at: "2026-05-10T19:32:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profilu uwierzytelniania** w ramach bieżącego dostawcy.
2. **Fallback modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły środowiska wykonawczego i dane, które je wspierają.

## Przepływ środowiska wykonawczego

Dla zwykłego przebiegu tekstowego OpenClaw ocenia kandydatów w tej kolejności:

<Steps>
  <Step title="Rozwiąż stan sesji">
    Rozwiąż aktywny model sesji i preferencję profilu uwierzytelniania.
  </Step>
  <Step title="Zbuduj łańcuch kandydatów">
    Zbuduj łańcuch kandydatów modelu na podstawie bieżącego wyboru modelu oraz zasad fallback dla tego źródła wyboru. Skonfigurowane wartości domyślne, podstawowe modele zadań Cron i automatycznie wybrane modele fallback mogą używać skonfigurowanych fallback; jawne wybory sesji użytkownika są ścisłe.
  </Step>
  <Step title="Wypróbuj bieżącego dostawcę">
    Wypróbuj bieżącego dostawcę z regułami rotacji/cooldown profili uwierzytelniania.
  </Step>
  <Step title="Przejdź dalej przy błędach kwalifikujących się do failover">
    Jeśli ten dostawca zostanie wyczerpany z błędem kwalifikującym się do failover, przejdź do następnego kandydata modelu.
  </Step>
  <Step title="Utrwal nadpisanie fallback">
    Utrwal wybrane nadpisanie fallback przed rozpoczęciem ponownej próby, aby inne czytniki sesji widziały tego samego dostawcę/model, którego runner zaraz użyje. Utrwalone nadpisanie modelu jest oznaczone jako `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Wycofaj wąsko przy awarii">
    Jeśli kandydat fallback zawiedzie, wycofaj tylko pola nadpisania sesji należące do fallback, gdy nadal pasują do tego nieudanego kandydata.
  </Step>
  <Step title="Rzuć FallbackSummaryError po wyczerpaniu">
    Jeśli każdy kandydat zawiedzie, rzuć `FallbackSummaryError` ze szczegółami poszczególnych prób i najbliższym wygaśnięciem cooldown, gdy jest znane.
  </Step>
</Steps>

Jest to celowo węższe niż „zapisz i przywróć całą sesję”. Runner odpowiedzi utrwala tylko pola wyboru modelu, za które odpowiada w ramach fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

To zapobiega nadpisaniu nowszych, niezwiązanych mutacji sesji przez nieudaną ponowną próbę fallback, takich jak ręczne zmiany `/model` lub aktualizacje rotacji sesji, które nastąpiły w trakcie wykonywania próby.

## Zasady źródła wyboru

OpenClaw oddziela wybranego dostawcę/model od powodu jego wyboru. To źródło kontroluje, czy łańcuch fallback jest dozwolony:

- **Skonfigurowana wartość domyślna**: `agents.defaults.model.primary` używa `agents.defaults.model.fallbacks`.
- **Model podstawowy agenta**: `agents.list[].model` jest ścisły, chyba że obiekt modelu tego agenta zawiera własne `fallbacks`. Użyj `fallbacks: []`, aby jawnie ustawić ścisłe zachowanie, albo podaj niepustą listę, aby włączyć fallback modelu dla tego agenta.
- **Automatyczne nadpisanie fallback**: fallback środowiska wykonawczego zapisuje `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` oraz wybrany model źródłowy przed ponowną próbą. To automatyczne nadpisanie może dalej przechodzić przez skonfigurowany łańcuch fallback i jest czyszczone przez `/new`, `/reset` oraz `sessions.reset`. Przebiegi Heartbeat bez jawnego `heartbeat.model` również czyszczą bezpośrednie automatyczne nadpisanie, gdy jego źródło nie pasuje już do bieżącej skonfigurowanej wartości domyślnej.
- **Nadpisanie sesji użytkownika**: `/model`, selektor modelu, `session_status(model=...)` oraz `sessions.patch` zapisują `modelOverrideSource: "user"`. To jest dokładny wybór sesji. Jeśli wybrany dostawca/model zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza awarię zamiast odpowiadać z niepowiązanego skonfigurowanego fallback.
- **Starsze nadpisanie sesji**: starsze wpisy sesji mogą mieć `modelOverride` bez `modelOverrideSource`. OpenClaw traktuje je jako nadpisania użytkownika, aby jawny stary wybór nie został po cichu przekształcony w zachowanie fallback.
- **Model z payloadu Cron**: `payload.model` / `--model` zadania Cron jest podstawowym modelem zadania, a nie nadpisaniem sesji użytkownika. Używa skonfigurowanych fallback, chyba że zadanie podaje `payload.fallbacks`; `payload.fallbacks: []` sprawia, że przebieg Cron jest ścisły.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza ścieżka: `~/.openclaw/agent/auth-profiles.json`).
- Stan routingu uwierzytelniania środowiska wykonawczego znajduje się w `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguracje `auth.profiles` / `auth.order` to **tylko metadane + routing** (bez sekretów).
- Starszy plik OAuth wyłącznie do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

Więcej szczegółów: [OAuth](/pl/concepts/oauth)

Typy poświadczeń:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych dostawców)

## Identyfikatory profili

Logowania OAuth tworzą odrębne profile, aby wiele kont mogło współistnieć.

- Domyślnie: `provider:default`, gdy adres e-mail nie jest dostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` w sekcji `profiles`.

## Kolejność rotacji

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność w następujący sposób:

<Steps>
  <Step title="Jawna konfiguracja">
    `auth.order[provider]` (jeśli ustawiono).
  </Step>
  <Step title="Skonfigurowane profile">
    `auth.profiles` odfiltrowane według dostawcy.
  </Step>
  <Step title="Przechowywane profile">
    Wpisy w `auth-profiles.json` dla dostawcy.
  </Step>
</Steps>

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round-robin:

- **Klucz podstawowy:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w ramach każdego typu).
- **Profile w cooldown/wyłączone** są przenoszone na koniec, uporządkowane według najbliższego wygaśnięcia.

### Przywiązanie sesji (przyjazne dla cache)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać rozgrzane cache dostawcy. **Nie** rotuje przy każdym żądaniu. Przypięty profil jest ponownie używany, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- nie zakończy się Compaction (licznik Compaction wzrośnie)
- profil nie jest w cooldown/wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji i nie jest automatycznie rotowany, dopóki nie rozpocznie się nowa sesja.

<Note>
Profile przypięte automatycznie (wybrane przez router sesji) są traktowane jako **preferencja**: są próbowane jako pierwsze, ale OpenClaw może zrotować do innego profilu przy limitach szybkości/timeoutach. Profile przypięte przez użytkownika pozostają zablokowane na tym profilu; jeśli zawiedzie, a fallback modelu jest skonfigurowany, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.
</Note>

### Dlaczego OAuth może „wyglądać na utracone”

Jeśli masz zarówno profil OAuth, jak i profil klucza API dla tego samego dostawcy, round-robin może przełączać się między nimi między wiadomościami, chyba że profil jest przypięty. Aby wymusić jeden profil:

- Przypnij przez `auth.order[provider] = ["provider:profileId"]`, albo
- Użyj nadpisania na sesję przez `/model …` z nadpisaniem profilu (gdy obsługuje to Twój interfejs użytkownika/powierzchnia czatu).

## Cooldown

Gdy profil zawiedzie z powodu błędów uwierzytelniania/limitów szybkości (albo timeoutu wyglądającego jak limit szybkości), OpenClaw oznacza go jako będący w cooldown i przechodzi do następnego profilu.

<AccordionGroup>
  <Accordion title="Co trafia do kubełka limitu szybkości / timeoutu">
    Ten kubełek limitu szybkości jest szerszy niż zwykłe `429`: obejmuje także komunikaty dostawców takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` oraz okresowe limity okien użycia, takie jak `weekly/monthly limit reached`.

    Błędy formatu/nieprawidłowego żądania są zwykle terminalne, ponieważ ponowienie tego samego payloadu zakończyłoby się tak samo, więc OpenClaw ujawnia je zamiast rotować profile uwierzytelniania. Znane ścieżki naprawy przez ponowienie mogą jawnie się włączyć: na przykład błędy walidacji identyfikatora wywołania narzędzia Cloud Code Assist są sanityzowane i ponawiane raz przez zasadę `allowFormatRetry`. Błędy przyczyny zatrzymania zgodne z OpenAI, takie jak `Unhandled stop reason: error`, `stop reason: error` i `reason: error`, są klasyfikowane jako sygnały timeout/failover.

    Ogólny tekst serwera może również trafić do tego kubełka timeoutu, gdy źródło pasuje do znanego wzorca przejściowego. Na przykład surowy komunikat wrappera strumienia pi-ai `An unknown error occurred` jest traktowany jako kwalifikujący się do failover dla każdego dostawcy, ponieważ pi-ai emituje go, gdy strumienie dostawcy kończą się z `stopReason: "aborted"` lub `stopReason: "error"` bez konkretnych szczegółów. Payloady JSON `api_error` z przejściowym tekstem serwera, takim jak `internal server error`, `unknown error, 520`, `upstream error` lub `backend error`, również są traktowane jako timeouty kwalifikujące się do failover.

    Ogólny tekst upstream specyficzny dla OpenRouter, taki jak surowe `Provider returned error`, jest traktowany jako timeout tylko wtedy, gdy kontekstem dostawcy faktycznie jest OpenRouter. Ogólny wewnętrzny tekst fallback, taki jak `LLM request failed with an unknown error.`, pozostaje konserwatywny i sam z siebie nie wyzwala failover.

  </Accordion>
  <Accordion title="Limity retry-after SDK">
    Niektóre SDK dostawców mogłyby w przeciwnym razie uśpić proces na długie okno `Retry-After` przed zwróceniem kontroli do OpenClaw. Dla SDK opartych na Stainless, takich jak Anthropic i OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60 sekund i natychmiast ujawnia dłuższe odpowiedzi możliwe do ponowienia, aby ta ścieżka failover mogła się wykonać. Dostosuj lub wyłącz limit za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [Zachowanie ponowień](/pl/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown ograniczone do modelu">
    Cooldown limitów szybkości mogą być także ograniczone do modelu:

    - OpenClaw zapisuje `cooldownModel` dla awarii limitu szybkości, gdy identyfikator modelu, który zawiódł, jest znany.
    - Model siostrzany u tego samego dostawcy nadal może zostać wypróbowany, gdy cooldown jest ograniczony do innego modelu.
    - Okna rozliczeń/wyłączenia nadal blokują cały profil między modelami.

  </Accordion>
</AccordionGroup>

Cooldown używa wykładniczego backoff:

- 1 minuta
- 5 minut
- 25 minut
- 1 godzina (limit)

Stan jest przechowywany w `auth-state.json` w sekcji `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Wyłączenia rozliczeń

Awarie rozliczeń/kredytów (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do failover, ale zwykle nie są przejściowe. Zamiast krótkiego cooldown, OpenClaw oznacza profil jako **wyłączony** (z dłuższym backoff) i rotuje do następnego profilu/dostawcy.

<Note>
Nie każda odpowiedź przypominająca rozliczenia ma kod `402` i nie każdy HTTP `402` trafia tutaj. OpenClaw utrzymuje jawny tekst rozliczeniowy w ścieżce rozliczeń nawet wtedy, gdy dostawca zwraca zamiast tego `401` lub `403`, ale matchery specyficzne dla dostawcy pozostają ograniczone do dostawcy, który je posiada (na przykład OpenRouter `403 Key limit exceeded`).

Tymczasem tymczasowe błędy `402` okna użycia oraz limitów wydatków organizacji/przestrzeni roboczej są klasyfikowane jako `rate_limit`, gdy komunikat wygląda na możliwy do ponowienia (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` lub `organization spending limit exceeded`). Pozostają one na krótkiej ścieżce cooldown/failover zamiast długiej ścieżki wyłączenia z powodu rozliczeń.
</Note>

Stan jest przechowywany w `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Wartości domyślne:

- Backoff rozliczeń zaczyna się od **5 godzin**, podwaja się przy każdej awarii rozliczeń i ma limit **24 godzin**.
- Liczniki backoff resetują się, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Ponowienia przy przeciążeniu pozwalają na **1 rotację profilu u tego samego dostawcy** przed fallback modelu.
- Ponowienia przy przeciążeniu domyślnie używają **0 ms backoff**.

## Fallback modelu

Jeśli wszystkie profile dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w `agents.defaults.model.fallbacks`. Dotyczy to błędów uwierzytelniania, limitów szybkości i limitów czasu, które wyczerpały rotację profili (inne błędy nie uruchamiają przejścia do modelu zapasowego). Błędy dostawcy, które nie ujawniają wystarczającej ilości szczegółów, nadal są precyzyjnie oznaczane w stanie modelu zapasowego: `empty_response` oznacza, że dostawca nie zwrócił użytecznej wiadomości ani statusu, `no_error_details` oznacza, że dostawca jawnie zwrócił `Unknown error (no error details in response)`, a `unclassified` oznacza, że OpenClaw zachował surowy podgląd, ale żaden klasyfikator jeszcze go nie dopasował.

Błędy przeciążenia i limitów szybkości są obsługiwane bardziej agresywnie niż okresy wyciszenia rozliczeń. Domyślnie OpenClaw pozwala na jedną ponowną próbę z profilem uwierzytelniania tego samego dostawcy, a następnie bez czekania przełącza się na następny skonfigurowany model zapasowy. Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do tej kategorii przeciążenia. Dostrój to za pomocą `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` i `auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się od skonfigurowanego domyślnego modelu głównego, głównego modelu zadania cron, głównego modelu agenta z jawnymi modelami zapasowymi lub automatycznie wybranego nadpisania modelu zapasowego, OpenClaw może przejść przez pasujący skonfigurowany łańcuch modeli zapasowych. Główne modele agentów bez jawnych modeli zapasowych oraz jawne wybory użytkownika (na przykład `/model ollama/qwen3.5:27b`, selektor modelu, `sessions.patch` albo jednorazowe nadpisania dostawcy/modelu w CLI) są ścisłe: jeśli ten dostawca/model jest nieosiągalny lub zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza błąd zamiast odpowiadać z niepowiązanego modelu zapasowego.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model` oraz skonfigurowanych modeli zapasowych.

<AccordionGroup>
  <Accordion title="Rules">
    - Żądany model jest zawsze pierwszy.
    - Jawnie skonfigurowane modele zapasowe są deduplikowane, ale nie filtrowane przez listę dozwolonych modeli. Są traktowane jako jawna intencja operatora.
    - Jeśli bieżące uruchomienie już używa skonfigurowanego modelu zapasowego w tej samej rodzinie dostawców, OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
    - Jeśli bieżące uruchomienie używa innego dostawcy niż konfiguracja, a bieżący model nie jest już częścią skonfigurowanego łańcucha modeli zapasowych, OpenClaw nie dołącza niepowiązanych skonfigurowanych modeli zapasowych od innego dostawcy.
    - Gdy do runnera modeli zapasowych nie podano jawnego nadpisania modeli zapasowych, skonfigurowany model główny jest dodawany na końcu, aby łańcuch mógł wrócić do normalnej wartości domyślnej po wyczerpaniu wcześniejszych kandydatów.
    - Gdy wywołujący podaje `fallbacksOverride`, runner używa dokładnie żądanego modelu oraz tej listy nadpisań. Pusta lista wyłącza przechodzenie do modeli zapasowych i zapobiega dodaniu skonfigurowanego modelu głównego jako ukrytego celu ponownej próby.

  </Accordion>
</AccordionGroup>

### Które błędy uruchamiają model zapasowy

<Tabs>
  <Tab title="Continues on">
    - błędy uwierzytelniania
    - limity szybkości i wyczerpanie okresów wyciszenia
    - błędy przeciążenia/zajętości dostawcy
    - błędy przełączenia awaryjnego o kształcie limitu czasu
    - wyłączenia rozliczeń
    - `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki przełączenia awaryjnego, aby przestarzały utrwalony model nie tworzył zewnętrznej pętli ponownych prób
    - inne nierozpoznane błędy, gdy nadal pozostają kandydaci

  </Tab>
  <Tab title="Does not continue on">
    - jawne przerwania, które nie mają kształtu limitu czasu/przełączenia awaryjnego
    - błędy przepełnienia kontekstu, które powinny pozostać wewnątrz logiki Compaction/ponownej próby (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` lub `ollama error: context length exceeded`)
    - końcowy nieznany błąd, gdy nie pozostał już żaden kandydat

  </Tab>
</Tabs>

### Pomijanie okresu wyciszenia a zachowanie sondowania

Gdy każdy profil uwierzytelniania dostawcy jest już w okresie wyciszenia, OpenClaw nie pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję dla każdego kandydata:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Trwałe błędy uwierzytelniania natychmiast pomijają całego dostawcę.
    - Wyłączenia rozliczeń zwykle są pomijane, ale główny kandydat nadal może być sondowany z ograniczeniem częstotliwości, aby odzyskanie działania było możliwe bez restartu.
    - Główny kandydat może być sondowany blisko wygaśnięcia okresu wyciszenia, z ograniczeniem częstotliwości dla każdego dostawcy.
    - Rodzeństwo modeli zapasowych tego samego dostawcy może być próbowane mimo okresu wyciszenia, gdy błąd wygląda na przejściowy (`rate_limit`, `overloaded` lub nieznany). Jest to szczególnie istotne, gdy limit szybkości jest ograniczony do modelu, a model siostrzany może nadal odzyskać działanie natychmiast.
    - Sondy przejściowych okresów wyciszenia są ograniczone do jednej na dostawcę w jednym uruchomieniu modeli zapasowych, aby pojedynczy dostawca nie zatrzymał przełączania między dostawcami.

  </Accordion>
</AccordionGroup>

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji są współdzielonym stanem. Aktywny runner, polecenie `/model`, aktualizacje Compaction/sesji oraz uzgadnianie sesji na żywo odczytują lub zapisują części tego samego wpisu sesji.

Oznacza to, że ponowne próby modeli zapasowych muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu inicjowane przez użytkownika oznaczają oczekujące przełączenie na żywo. Obejmuje to `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu sterowane przez system, takie jak rotacja modeli zapasowych, nadpisania Heartbeat lub Compaction, nigdy same nie oznaczają oczekującego przełączenia na żywo.
- Nadpisania modelu inicjowane przez użytkownika są traktowane jako dokładne wybory na potrzeby polityki modeli zapasowych, więc nieosiągalny wybrany dostawca pojawia się jako błąd zamiast zostać zamaskowany przez `agents.defaults.model.fallbacks`.
- Zanim rozpocznie się ponowna próba z modelem zapasowym, runner odpowiedzi utrwala wybrane pola nadpisania modelu zapasowego we wpisie sesji.
- Automatyczne nadpisania modeli zapasowych pozostają wybrane w kolejnych turach, aby OpenClaw nie sondował znanego wadliwego modelu głównego przy każdej wiadomości. `/new`, `/reset` i `sessions.reset` czyszczą nadpisania pochodzące automatycznie i przywracają sesję do skonfigurowanej wartości domyślnej.
- `/status` pokazuje wybrany model oraz, gdy stan modelu zapasowego się różni, aktywny model zapasowy i powód.
- Uzgadnianie sesji na żywo preferuje utrwalone nadpisania sesji względem przestarzałych pól modelu w czasie działania.
- Jeśli błąd przełączenia na żywo wskazuje późniejszego kandydata w aktywnym łańcuchu modeli zapasowych, OpenClaw przechodzi bezpośrednio do tego wybranego modelu zamiast najpierw przechodzić przez niepowiązanych kandydatów.
- Jeśli próba modelu zapasowego zawiedzie, runner wycofuje tylko pola nadpisania, które sam zapisał, i tylko wtedy, gdy nadal pasują do tego nieudanego kandydata.

Zapobiega to klasycznemu wyścigowi:

<Steps>
  <Step title="Primary fails">
    Wybrany model główny zawodzi.
  </Step>
  <Step title="Fallback chosen in memory">
    Kandydat zapasowy jest wybierany w pamięci.
  </Step>
  <Step title="Session store still says old primary">
    Magazyn sesji nadal wskazuje stary model główny.
  </Step>
  <Step title="Live reconciliation reads stale state">
    Uzgadnianie sesji na żywo odczytuje przestarzały stan sesji.
  </Step>
  <Step title="Retry snapped back">
    Ponowna próba zostaje cofnięta do starego modelu przed rozpoczęciem próby modelu zapasowego.
  </Step>
</Steps>

Utrwalone nadpisanie modelu zapasowego zamyka to okno, a wąskie wycofanie pozostawia nowsze ręczne lub wykonywane w czasie działania zmiany sesji bez zmian.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` rejestruje szczegóły dla każdej próby, które zasilają logi i komunikaty o okresach wyciszenia widoczne dla użytkownika:

- próbowany dostawca/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i podobne powody przełączenia awaryjnego)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Strukturalne logi `model_fallback_decision` zawierają też płaskie pola `fallbackStep*`, gdy kandydat zawiedzie, zostanie pominięty albo późniejszy model zapasowy się powiedzie. Te pola sprawiają, że próbowane przejście jest jawne (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), dzięki czemu eksportery logów i diagnostyki mogą odtworzyć błąd modelu głównego nawet wtedy, gdy końcowy model zapasowy również zawiedzie.

Gdy każdy kandydat zawiedzie, OpenClaw zgłasza `FallbackSummaryError`. Zewnętrzny runner odpowiedzi może użyć tego do zbudowania bardziej szczegółowego komunikatu, takiego jak „wszystkie modele są tymczasowo objęte limitem szybkości”, i uwzględnić najbliższy czas wygaśnięcia okresu wyciszenia, jeśli jest znany.

To podsumowanie okresu wyciszenia uwzględnia model:

- niepowiązane limity szybkości ograniczone do modelu są ignorowane dla próbowanego łańcucha dostawca/model
- jeśli pozostałą blokadą jest pasujący limit szybkości ograniczony do modelu, OpenClaw zgłasza ostatni pasujący czas wygaśnięcia, który nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja Gateway](/pl/gateway/configuration), aby uzyskać informacje o:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby uzyskać szersze omówienie wyboru modelu i modeli zapasowych.
