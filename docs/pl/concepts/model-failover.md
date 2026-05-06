---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, okresów karencji lub zachowania awaryjnego wyboru modelu
    - Aktualizowanie reguł przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modelu sesji współdziałają z ponownymi próbami z modelem zastępczym
sidebarTitle: Model failover
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza awaryjnie między modelami
title: Przełączanie awaryjne modelu
x-i18n:
    generated_at: "2026-05-06T09:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profili uwierzytelniania** w ramach bieżącego dostawcy.
2. **Awaryjne przełączenie modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły działania w czasie wykonywania oraz dane, na których się opierają.

## Przepływ w czasie wykonywania

Dla standardowego przebiegu tekstowego OpenClaw ocenia kandydatów w tej kolejności:

<Steps>
  <Step title="Resolve session state">
    Rozwiąż aktywny model sesji i preferencję profilu uwierzytelniania.
  </Step>
  <Step title="Build candidate chain">
    Zbuduj łańcuch kandydatów modeli na podstawie bieżącego wyboru modelu i zasad awaryjnego przełączania dla źródła tego wyboru. Skonfigurowane ustawienia domyślne, podstawowe modele zadań cron oraz automatycznie wybrane modele awaryjne mogą używać skonfigurowanych modeli awaryjnych; jawne wybory sesji użytkownika są ścisłe.
  </Step>
  <Step title="Try the current provider">
    Wypróbuj bieżącego dostawcę zgodnie z regułami rotacji profili uwierzytelniania i okresów wyciszenia.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Jeśli ten dostawca zostanie wyczerpany z błędem kwalifikującym się do przełączenia awaryjnego, przejdź do następnego kandydata modelu.
  </Step>
  <Step title="Persist fallback override">
    Utrwal wybrane nadpisanie awaryjne przed rozpoczęciem ponownej próby, aby inne czytniki sesji widziały tego samego dostawcę i model, których runner zaraz użyje. Utrwalone nadpisanie modelu jest oznaczone jako `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Jeśli kandydat awaryjny zawiedzie, wycofaj tylko pola nadpisania sesji należące do mechanizmu awaryjnego, gdy nadal pasują do tego nieudanego kandydata.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Jeśli każdy kandydat zawiedzie, zgłoś `FallbackSummaryError` ze szczegółami każdej próby oraz najbliższym terminem wygaśnięcia okresu wyciszenia, jeśli jest znany.
  </Step>
</Steps>

Jest to celowo węższe niż „zapisz i przywróć całą sesję”. Runner odpowiedzi utrwala tylko pola wyboru modelu, za które odpowiada w ramach mechanizmu awaryjnego:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Zapobiega to nadpisaniu przez nieudaną ponowną próbę awaryjną nowszych, niepowiązanych mutacji sesji, takich jak ręczne zmiany `/model` albo aktualizacje rotacji sesji, które nastąpiły w trakcie wykonywania próby.

## Zasady źródła wyboru

OpenClaw oddziela wybranego dostawcę/model od powodu, dla którego został wybrany. To źródło decyduje, czy łańcuch awaryjny jest dozwolony:

- **Skonfigurowane ustawienie domyślne**: `agents.defaults.model.primary` używa `agents.defaults.model.fallbacks`.
- **Model podstawowy agenta**: `agents.list[].model` jest ścisły, chyba że obiekt modelu tego agenta zawiera własne `fallbacks`. Użyj `fallbacks: []`, aby jawnie wskazać ścisłe zachowanie, albo podaj niepustą listę, aby włączyć awaryjne przełączanie modeli dla tego agenta.
- **Automatyczne nadpisanie awaryjne**: mechanizm awaryjny w czasie wykonywania zapisuje `providerOverride`, `modelOverride` i `modelOverrideSource: "auto"` przed ponowną próbą. To automatyczne nadpisanie może dalej przechodzić po skonfigurowanym łańcuchu awaryjnym i jest czyszczone przez `/new`, `/reset` oraz `sessions.reset`.
- **Nadpisanie sesji użytkownika**: `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`. Jest to dokładny wybór sesji. Jeśli wybrany dostawca/model zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza awarię zamiast odpowiadać z niepowiązanego skonfigurowanego modelu awaryjnego.
- **Starsze nadpisanie sesji**: starsze wpisy sesji mogą mieć `modelOverride` bez `modelOverrideSource`. OpenClaw traktuje je jako nadpisania użytkownika, aby jawny stary wybór nie został po cichu przekształcony w zachowanie awaryjne.
- **Model w ładunku Cron**: zadanie cron `payload.model` / `--model` jest modelem podstawowym zadania, a nie nadpisaniem sesji użytkownika. Używa skonfigurowanych modeli awaryjnych, chyba że zadanie podaje `payload.fallbacks`; `payload.fallbacks: []` sprawia, że przebieg cron jest ścisły.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza ścieżka: `~/.openclaw/agent/auth-profiles.json`).
- Stan routingu uwierzytelniania w czasie wykonywania znajduje się w `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguracje `auth.profiles` / `auth.order` to **tylko metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

Więcej szczegółów: [OAuth](/pl/concepts/oauth)

Typy poświadczeń:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych dostawców)

## Identyfikatory profili

Logowania OAuth tworzą osobne profile, aby wiele kont mogło współistnieć.

- Domyślnie: `provider:default`, gdy adres e-mail nie jest dostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` pod `profiles`.

## Kolejność rotacji

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność w ten sposób:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (jeśli ustawione).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` odfiltrowane według dostawcy.
  </Step>
  <Step title="Stored profiles">
    Wpisy w `auth-profiles.json` dla dostawcy.
  </Step>
</Steps>

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round-robin:

- **Klucz podstawowy:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarszy najpierw, w ramach każdego typu).
- **Profile w okresie wyciszenia/wyłączone** są przenoszone na koniec, uporządkowane według najbliższego wygaśnięcia.

### Przywiązanie sesji (przyjazne dla pamięci podręcznej)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać ciepłe pamięci podręczne dostawcy. **Nie** rotuje go przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- zakończy się Compaction (licznik Compaction wzrośnie)
- profil nie znajdzie się w okresie wyciszenia albo nie zostanie wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji i nie jest automatycznie rotowany do rozpoczęcia nowej sesji.

<Note>
Automatycznie przypięte profile (wybrane przez router sesji) są traktowane jako **preferencja**: są próbowane jako pierwsze, ale OpenClaw może przełączyć się na inny profil przy limitach szybkości lub przekroczeniach czasu. Profile przypięte przez użytkownika pozostają zablokowane na tym profilu; jeśli zawiedzie, a modele awaryjne są skonfigurowane, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.
</Note>

### Dlaczego OAuth może „wyglądać na utracony”

Jeśli masz zarówno profil OAuth, jak i profil klucza API dla tego samego dostawcy, round-robin może przełączać się między nimi między wiadomościami, chyba że profil jest przypięty. Aby wymusić jeden profil:

- Przypnij za pomocą `auth.order[provider] = ["provider:profileId"]`, albo
- Użyj nadpisania dla sesji przez `/model …` z nadpisaniem profilu (gdy jest obsługiwane przez Twój interfejs UI/czat).

## Okresy wyciszenia

Gdy profil zawiedzie z powodu błędów uwierzytelniania/limitów szybkości (albo przekroczenia czasu wyglądającego jak ograniczanie szybkości), OpenClaw oznacza go jako objęty okresem wyciszenia i przechodzi do następnego profilu.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Ten kubeł limitów szybkości jest szerszy niż zwykłe `429`: obejmuje również komunikaty dostawców, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` oraz okresowe limity okien użycia, takie jak `weekly/monthly limit reached`.

    Błędy formatu/nieprawidłowych żądań (na przykład błędy walidacji identyfikatora wywołania narzędzia Cloud Code Assist) są traktowane jako kwalifikujące się do przełączenia awaryjnego i używają tych samych okresów wyciszenia. Błędy przyczyny zatrzymania zgodne z OpenAI, takie jak `Unhandled stop reason: error`, `stop reason: error` i `reason: error`, są klasyfikowane jako sygnały przekroczenia czasu/przełączenia awaryjnego.

    Ogólny tekst serwera może również trafić do tego kubełka przekroczeń czasu, gdy źródło pasuje do znanego wzorca przejściowego. Na przykład surowy komunikat wrappera strumienia pi-ai `An unknown error occurred` jest traktowany jako kwalifikujący się do przełączenia awaryjnego dla każdego dostawcy, ponieważ pi-ai emituje go, gdy strumienie dostawcy kończą się z `stopReason: "aborted"` lub `stopReason: "error"` bez konkretnych szczegółów. Ładunki JSON `api_error` z przejściowym tekstem serwera, takim jak `internal server error`, `unknown error, 520`, `upstream error` lub `backend error`, również są traktowane jako przekroczenia czasu kwalifikujące się do przełączenia awaryjnego.

    Ogólny tekst upstream specyficzny dla OpenRouter, taki jak surowe `Provider returned error`, jest traktowany jako przekroczenie czasu tylko wtedy, gdy kontekstem dostawcy jest faktycznie OpenRouter. Ogólny wewnętrzny tekst awaryjny, taki jak `LLM request failed with an unknown error.`, pozostaje konserwatywny i samodzielnie nie wyzwala przełączenia awaryjnego.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Niektóre SDK dostawców mogłyby w przeciwnym razie uśpić wykonanie na długie okno `Retry-After` przed zwróceniem kontroli do OpenClaw. Dla SDK opartych na Stainless, takich jak Anthropic i OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60 sekund i natychmiast ujawnia dłuższe odpowiedzi nadające się do ponowienia, aby ta ścieżka przełączenia awaryjnego mogła się uruchomić. Dostosuj albo wyłącz limit za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [Zachowanie ponawiania](/pl/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Okresy wyciszenia limitów szybkości mogą być także ograniczone do modelu:

    - OpenClaw zapisuje `cooldownModel` dla awarii limitu szybkości, gdy identyfikator nieudanego modelu jest znany.
    - Model siostrzany u tego samego dostawcy nadal może zostać wypróbowany, gdy okres wyciszenia jest ograniczony do innego modelu.
    - Okna rozliczeniowe/wyłączenia nadal blokują cały profil we wszystkich modelach.

  </Accordion>
</AccordionGroup>

Okresy wyciszenia używają wykładniczego backoffu:

- 1 minuta
- 5 minut
- 25 minut
- 1 godzina (limit)

Stan jest przechowywany w `auth-state.json` pod `usageStats`:

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

## Wyłączenia rozliczeniowe

Awarie rozliczeń/kredytów (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do przełączenia awaryjnego, ale zwykle nie są przejściowe. Zamiast krótkiego okresu wyciszenia OpenClaw oznacza profil jako **wyłączony** (z dłuższym backoffem) i rotuje do następnego profilu/dostawcy.

<Note>
Nie każda odpowiedź wyglądająca jak rozliczeniowa ma kod `402`, i nie każdy HTTP `402` trafia tutaj. OpenClaw utrzymuje jawny tekst rozliczeniowy w ścieżce rozliczeń nawet wtedy, gdy dostawca zwraca zamiast tego `401` lub `403`, ale dopasowania specyficzne dla dostawcy pozostają ograniczone do dostawcy, który je posiada (na przykład OpenRouter `403 Key limit exceeded`).

Tymczasem tymczasowe błędy `402` okien użycia oraz limitów wydatków organizacji/przestrzeni roboczej są klasyfikowane jako `rate_limit`, gdy komunikat wygląda na możliwy do ponowienia (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` lub `organization spending limit exceeded`). Pozostają one na krótkiej ścieżce okresu wyciszenia/przełączenia awaryjnego zamiast na długiej ścieżce wyłączenia rozliczeniowego.
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

Ustawienia domyślne:

- Backoff rozliczeniowy zaczyna się od **5 godzin**, podwaja się po każdej awarii rozliczeń i ma limit **24 godzin**.
- Liczniki backoffu resetują się, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Ponowienia przeciążenia pozwalają na **1 rotację profilu tego samego dostawcy** przed awaryjnym przełączeniem modelu.
- Ponowienia przeciążenia domyślnie używają backoffu **0 ms**.

## Awaryjne przełączanie modeli

Jeśli wszystkie profile dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w `agents.defaults.model.fallbacks`. Dotyczy to awarii uwierzytelniania, limitów szybkości i przekroczeń czasu, które wyczerpały rotację profili (inne błędy nie uruchamiają przełączenia awaryjnego). Błędy dostawców, które nie ujawniają wystarczającej liczby szczegółów, nadal są precyzyjnie oznaczane w stanie awaryjnym: `empty_response` oznacza, że dostawca nie zwrócił żadnej użytecznej wiadomości ani statusu, `no_error_details` oznacza, że dostawca jawnie zwrócił `Unknown error (no error details in response)`, a `unclassified` oznacza, że OpenClaw zachował surowy podgląd, ale żaden klasyfikator jeszcze go nie dopasował.

Błędy przeciążenia i limitów szybkości są obsługiwane bardziej agresywnie niż okresy odnowienia rozliczeń. Domyślnie OpenClaw zezwala na jedną ponowną próbę profilu uwierzytelniania u tego samego dostawcy, a następnie bez czekania przełącza się na następny skonfigurowany model rezerwowy. Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do tej kategorii przeciążenia. Dostosuj to za pomocą `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` oraz `auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się od skonfigurowanego domyślnego modelu podstawowego, modelu podstawowego zadania Cron, modelu podstawowego agenta z jawnymi modelami rezerwowymi albo automatycznie wybranego nadpisania rezerwowego, OpenClaw może przejść przez pasujący skonfigurowany łańcuch modeli rezerwowych. Modele podstawowe agentów bez jawnych modeli rezerwowych oraz jawne wybory użytkownika (na przykład `/model ollama/qwen3.5:27b`, selektor modelu, `sessions.patch` albo jednorazowe nadpisania dostawcy/modelu w CLI) są ścisłe: jeśli ten dostawca/model jest nieosiągalny albo zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza błąd zamiast odpowiadać z niepowiązanego modelu rezerwowego.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model` oraz skonfigurowanych modeli rezerwowych.

<AccordionGroup>
  <Accordion title="Reguły">
    - Żądany model jest zawsze pierwszy.
    - Jawnie skonfigurowane modele rezerwowe są deduplikowane, ale nie są filtrowane przez listę dozwolonych modeli. Są traktowane jako jawna intencja operatora.
    - Jeśli bieżące uruchomienie jest już na skonfigurowanym modelu rezerwowym z tej samej rodziny dostawców, OpenClaw dalej używa pełnego skonfigurowanego łańcucha.
    - Jeśli bieżące uruchomienie jest na innym dostawcy niż w konfiguracji, a bieżący model nie jest już częścią skonfigurowanego łańcucha rezerwowego, OpenClaw nie dołącza niepowiązanych skonfigurowanych modeli rezerwowych od innego dostawcy.
    - Gdy do mechanizmu modeli rezerwowych nie zostanie przekazane jawne nadpisanie rezerwowe, skonfigurowany model podstawowy jest dołączany na końcu, aby łańcuch mógł wrócić do normalnej wartości domyślnej po wyczerpaniu wcześniejszych kandydatów.
    - Gdy wywołujący przekazuje `fallbacksOverride`, mechanizm używa dokładnie żądanego modelu oraz tej listy nadpisań. Pusta lista wyłącza awaryjne przełączanie modelu i zapobiega dołączeniu skonfigurowanego modelu podstawowego jako ukrytego celu ponownej próby.

  </Accordion>
</AccordionGroup>

### Które błędy przesuwają do modelu rezerwowego

<Tabs>
  <Tab title="Kontynuuje przy">
    - błędach uwierzytelniania
    - limitach szybkości i wyczerpaniu okresów odnowienia
    - błędach przeciążenia/zajętości dostawcy
    - błędach przełączania awaryjnego mających postać limitu czasu
    - wyłączeniach rozliczeń
    - `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki przełączania awaryjnego, aby nieaktualny utrwalony model nie tworzył zewnętrznej pętli ponownych prób
    - innych nierozpoznanych błędach, gdy nadal pozostają kandydaci

  </Tab>
  <Tab title="Nie kontynuuje przy">
    - jawnych przerwaniach, które nie mają postaci limitu czasu/przełączania awaryjnego
    - błędach przepełnienia kontekstu, które powinny pozostać w logice Compaction/ponownych prób (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` albo `ollama error: context length exceeded`)
    - końcowym nieznanym błędzie, gdy nie ma już żadnych kandydatów

  </Tab>
</Tabs>

### Pomijanie okresu odnowienia a sondowanie

Gdy każdy profil uwierzytelniania dla dostawcy jest już w okresie odnowienia, OpenClaw nie pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję dla każdego kandydata:

<AccordionGroup>
  <Accordion title="Decyzje dla każdego kandydata">
    - Trwałe błędy uwierzytelniania natychmiast pomijają całego dostawcę.
    - Wyłączenia rozliczeń zwykle powodują pominięcie, ale kandydat podstawowy nadal może być sondowany z ograniczeniem częstotliwości, aby odzyskanie działania było możliwe bez restartu.
    - Kandydat podstawowy może być sondowany blisko wygaśnięcia okresu odnowienia, z ograniczeniem częstotliwości dla danego dostawcy.
    - Siostrzane modele rezerwowe tego samego dostawcy mogą zostać wypróbowane mimo okresu odnowienia, gdy błąd wygląda na przejściowy (`rate_limit`, `overloaded` albo nieznany). Jest to szczególnie istotne, gdy limit szybkości dotyczy konkretnego modelu, a model siostrzany może nadal natychmiast odzyskać działanie.
    - Przejściowe sondy okresu odnowienia są ograniczone do jednej na dostawcę w jednym uruchomieniu mechanizmu rezerwowego, aby jeden dostawca nie blokował przełączania awaryjnego między dostawcami.

  </Accordion>
</AccordionGroup>

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji są stanem współdzielonym. Aktywny runner, polecenie `/model`, aktualizacje Compaction/sesji oraz uzgadnianie sesji na żywo odczytują lub zapisują części tego samego wpisu sesji.

Oznacza to, że ponowne próby z modelami rezerwowymi muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu wykonywane przez użytkownika oznaczają oczekujące przełączenie na żywo. Obejmuje to `/model`, `session_status(model=...)` oraz `sessions.patch`.
- Zmiany modelu wykonywane przez system, takie jak rotacja rezerwowa, nadpisania Heartbeat albo Compaction, same nigdy nie oznaczają oczekującego przełączenia na żywo.
- Nadpisania modelu wykonywane przez użytkownika są traktowane jako dokładne wybory dla polityki modeli rezerwowych, więc nieosiągalny wybrany dostawca jest zgłaszany jako błąd zamiast ukrywania go przez `agents.defaults.model.fallbacks`.
- Przed rozpoczęciem ponownej próby z modelem rezerwowym runner odpowiedzi utrwala wybrane pola nadpisania rezerwowego we wpisie sesji.
- Automatyczne nadpisania rezerwowe pozostają wybrane w kolejnych turach, aby OpenClaw nie sondował znanego jako wadliwy modelu podstawowego przy każdej wiadomości. `/new`, `/reset` oraz `sessions.reset` czyszczą nadpisania pochodzące z automatyki i przywracają sesję do skonfigurowanej wartości domyślnej.
- `/status` pokazuje wybrany model oraz, gdy stan rezerwowy się różni, aktywny model rezerwowy i powód.
- Uzgadnianie sesji na żywo preferuje utrwalone nadpisania sesji względem nieaktualnych pól modelu w czasie wykonywania.
- Jeśli błąd przełączenia na żywo wskazuje późniejszego kandydata w aktywnym łańcuchu rezerwowym, OpenClaw przechodzi bezpośrednio do wybranego modelu zamiast najpierw przechodzić przez niepowiązanych kandydatów.
- Jeśli próba z modelem rezerwowym się nie powiedzie, runner wycofuje tylko pola nadpisania, które sam zapisał, i tylko jeśli nadal pasują do tego nieudanego kandydata.

Zapobiega to klasycznemu wyścigowi:

<Steps>
  <Step title="Model podstawowy zawodzi">
    Wybrany model podstawowy zawodzi.
  </Step>
  <Step title="Model rezerwowy wybrany w pamięci">
    Kandydat rezerwowy zostaje wybrany w pamięci.
  </Step>
  <Step title="Magazyn sesji nadal wskazuje stary model podstawowy">
    Magazyn sesji nadal odzwierciedla stary model podstawowy.
  </Step>
  <Step title="Uzgadnianie na żywo odczytuje nieaktualny stan">
    Uzgadnianie sesji na żywo odczytuje nieaktualny stan sesji.
  </Step>
  <Step title="Ponowna próba wróciła do poprzedniego modelu">
    Ponowna próba zostaje cofnięta do starego modelu, zanim rozpocznie się próba z modelem rezerwowym.
  </Step>
</Steps>

Utrwalone nadpisanie rezerwowe zamyka to okno, a wąskie wycofanie pozostawia nowsze ręczne lub wykonawcze zmiany sesji bez zmian.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` rejestruje szczegóły każdej próby, które trafiają do dzienników i komunikatów o okresach odnowienia widocznych dla użytkownika:

- próbowany dostawca/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` oraz podobne powody przełączania awaryjnego)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Strukturalne dzienniki `model_fallback_decision` zawierają też płaskie pola `fallbackStep*`, gdy kandydat zawiedzie, zostanie pominięty albo późniejszy model rezerwowy się powiedzie. Te pola jawnie opisują próbowane przejście (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), aby eksportery dzienników i diagnostyki mogły odtworzyć błąd modelu podstawowego nawet wtedy, gdy końcowy model rezerwowy również zawiedzie.

Gdy każdy kandydat zawiedzie, OpenClaw zgłasza `FallbackSummaryError`. Zewnętrzny runner odpowiedzi może użyć tego do zbudowania bardziej szczegółowego komunikatu, takiego jak „wszystkie modele są tymczasowo ograniczone limitami szybkości”, oraz dołączyć najbliższe wygaśnięcie okresu odnowienia, gdy jest znane.

To podsumowanie okresu odnowienia uwzględnia modele:

- niepowiązane limity szybkości ograniczone do modelu są ignorowane dla próbowanego łańcucha dostawca/model
- jeśli pozostała blokada jest pasującym limitem szybkości ograniczonym do modelu, OpenClaw zgłasza ostatnie pasujące wygaśnięcie, które nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfigurację Gateway](/pl/gateway/configuration), aby uzyskać informacje o:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routingu `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby uzyskać szersze omówienie wyboru modeli i modeli rezerwowych.
