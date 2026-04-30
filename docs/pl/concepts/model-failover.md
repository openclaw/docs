---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, okresów karencji lub zachowania awaryjnego przełączania modelu
    - Aktualizowanie reguł przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modelu sesji współdziałają z ponowieniami awaryjnymi
sidebarTitle: Model failover
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza awaryjnie między modelami
title: Przełączanie awaryjne modelu
x-i18n:
    generated_at: "2026-04-30T09:48:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profilu uwierzytelniania** w ramach bieżącego dostawcy.
2. **Awaryjne przełączenie modelu** na następny model w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły działania w czasie wykonywania oraz dane, na których się opierają.

## Przepływ działania

W przypadku zwykłego uruchomienia tekstowego OpenClaw ocenia kandydatów w tej kolejności:

<Steps>
  <Step title="Ustal stan sesji">
    Ustal aktywny model sesji i preferencję profilu uwierzytelniania.
  </Step>
  <Step title="Zbuduj łańcuch kandydatów">
    Zbuduj łańcuch kandydatów modelu na podstawie bieżącego wyboru modelu i zasad awaryjnego przełączania dla źródła tego wyboru. Skonfigurowane wartości domyślne, podstawowe modele zadań cron oraz automatycznie wybrane modele awaryjne mogą używać skonfigurowanych opcji awaryjnych; jawne wybory sesji użytkownika są ścisłe.
  </Step>
  <Step title="Wypróbuj bieżącego dostawcę">
    Wypróbuj bieżącego dostawcę z regułami rotacji profili uwierzytelniania i okresów cooldown.
  </Step>
  <Step title="Przejdź dalej przy błędach kwalifikujących się do failover">
    Jeśli ten dostawca zostanie wyczerpany z błędem kwalifikującym się do failover, przejdź do następnego kandydata modelu.
  </Step>
  <Step title="Utrwal nadpisanie awaryjne">
    Utrwal wybrane nadpisanie awaryjne przed rozpoczęciem ponownej próby, aby inne czytniki sesji widziały tego samego dostawcę/model, którego runner zaraz użyje. Utrwalone nadpisanie modelu jest oznaczone jako `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Wycofaj wąsko przy niepowodzeniu">
    Jeśli kandydat awaryjny zawiedzie, wycofaj tylko pola nadpisania sesji należące do mechanizmu awaryjnego, gdy nadal odpowiadają temu nieudanemu kandydatowi.
  </Step>
  <Step title="Rzuć FallbackSummaryError po wyczerpaniu">
    Jeśli każdy kandydat zawiedzie, rzuć `FallbackSummaryError` ze szczegółami każdej próby i najbliższym czasem wygaśnięcia cooldown, jeśli jest znany.
  </Step>
</Steps>

Jest to celowo węższe niż „zapisz i przywróć całą sesję”. Runner odpowiedzi utrwala tylko pola wyboru modelu, które należą do niego w ramach mechanizmu awaryjnego:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Zapobiega to sytuacji, w której nieudana ponowna próba awaryjna nadpisuje nowsze, niepowiązane mutacje sesji, takie jak ręczne zmiany `/model` lub aktualizacje rotacji sesji, które nastąpiły w trakcie działania próby.

## Zasady źródła wyboru

OpenClaw oddziela wybranego dostawcę/model od powodu, dla którego został wybrany. To źródło kontroluje, czy łańcuch awaryjny jest dozwolony:

- **Skonfigurowana wartość domyślna**: `agents.defaults.model.primary` używa `agents.defaults.model.fallbacks`.
- **Podstawowy model agenta**: `agents.list[].model` jest ścisły, chyba że obiekt modelu tego agenta zawiera własne `fallbacks`. Użyj `fallbacks: []`, aby jawnie ustawić ścisłe zachowanie, albo podaj niepustą listę, aby włączyć awaryjne przełączanie modeli dla tego agenta.
- **Automatyczne nadpisanie awaryjne**: awaryjne przełączenie w czasie wykonywania zapisuje `providerOverride`, `modelOverride` i `modelOverrideSource: "auto"` przed ponowną próbą. To automatyczne nadpisanie może dalej przechodzić po skonfigurowanym łańcuchu awaryjnym i jest czyszczone przez `/new`, `/reset` oraz `sessions.reset`.
- **Nadpisanie sesji użytkownika**: `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`. To dokładny wybór sesji. Jeśli wybrany dostawca/model zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza błąd zamiast odpowiadać z niepowiązanego skonfigurowanego modelu awaryjnego.
- **Starsze nadpisanie sesji**: starsze wpisy sesji mogą mieć `modelOverride` bez `modelOverrideSource`. OpenClaw traktuje je jako nadpisania użytkownika, aby jawny stary wybór nie został po cichu przekształcony w zachowanie awaryjne.
- **Model w ładunku Cron**: `payload.model` / `--model` zadania cron jest podstawowym modelem zadania, a nie nadpisaniem sesji użytkownika. Używa skonfigurowanych opcji awaryjnych, chyba że zadanie podaje `payload.fallbacks`; `payload.fallbacks: []` sprawia, że uruchomienie cron jest ścisłe.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza ścieżka: `~/.openclaw/agent/auth-profiles.json`).
- Stan routingu uwierzytelniania w czasie wykonywania znajduje się w `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguracje `auth.profiles` / `auth.order` to **tylko metadane + routing** (bez sekretów).
- Starszy plik OAuth wyłącznie do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

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
  <Step title="Jawna konfiguracja">
    `auth.order[provider]` (jeśli ustawiono).
  </Step>
  <Step title="Skonfigurowane profile">
    `auth.profiles` przefiltrowane według dostawcy.
  </Step>
  <Step title="Zapisane profile">
    Wpisy w `auth-profiles.json` dla dostawcy.
  </Step>
</Steps>

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round-robin:

- **Klucz główny:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w ramach każdego typu).
- **Profile w cooldown/wyłączone** są przenoszone na koniec, uporządkowane według najbliższego wygaśnięcia.

### Przywiązanie do sesji (przyjazne dla cache)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać ciepłe cache dostawców. **Nie** rotuje przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- Compaction się nie zakończy (licznik compaction wzrośnie)
- profil nie znajdzie się w cooldown/nie zostanie wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji i nie jest automatycznie rotowany do rozpoczęcia nowej sesji.

<Note>
Automatycznie przypięte profile (wybrane przez router sesji) są traktowane jako **preferencja**: są próbowane jako pierwsze, ale OpenClaw może przejść do innego profilu przy limitach szybkości/timeoutach. Profile przypięte przez użytkownika pozostają zablokowane na tym profilu; jeśli zawiedzie, a awaryjne przełączanie modeli jest skonfigurowane, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.
</Note>

### Dlaczego OAuth może „wyglądać na utracone”

Jeśli masz zarówno profil OAuth, jak i profil klucza API dla tego samego dostawcy, round-robin może przełączać się między nimi w kolejnych wiadomościach, chyba że profil jest przypięty. Aby wymusić jeden profil:

- Przypnij za pomocą `auth.order[provider] = ["provider:profileId"]`, albo
- Użyj nadpisania dla sesji przez `/model …` z nadpisaniem profilu (gdy jest obsługiwane przez Twój interfejs UI/czat).

## Cooldowny

Gdy profil zawiedzie z powodu błędów uwierzytelniania/limitów szybkości (albo timeoutu wyglądającego jak limit szybkości), OpenClaw oznacza go jako w cooldown i przechodzi do następnego profilu.

<AccordionGroup>
  <Accordion title="Co trafia do koszyka limitu szybkości / timeoutu">
    Ten koszyk limitu szybkości jest szerszy niż zwykłe `429`: obejmuje też komunikaty dostawców takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` oraz okresowe limity okien użycia, takie jak `weekly/monthly limit reached`.

    Błędy formatu/nieprawidłowego żądania (na przykład błędy walidacji identyfikatora wywołania narzędzia Cloud Code Assist) są traktowane jako kwalifikujące się do failover i używają tych samych cooldownów. Błędy powodu zatrzymania zgodne z OpenAI, takie jak `Unhandled stop reason: error`, `stop reason: error` i `reason: error`, są klasyfikowane jako sygnały timeoutu/failover.

    Ogólny tekst serwera może również trafić do tego koszyka timeoutów, gdy źródło pasuje do znanego wzorca przejściowego. Na przykład podstawowy komunikat wrappera strumienia pi-ai `An unknown error occurred` jest traktowany jako kwalifikujący się do failover dla każdego dostawcy, ponieważ pi-ai emituje go, gdy strumienie dostawcy kończą się z `stopReason: "aborted"` lub `stopReason: "error"` bez konkretnych szczegółów. Ładunki JSON `api_error` z przejściowym tekstem serwera, takim jak `internal server error`, `unknown error, 520`, `upstream error` lub `backend error`, są również traktowane jako timeouty kwalifikujące się do failover.

    Ogólny tekst upstream specyficzny dla OpenRouter, taki jak samo `Provider returned error`, jest traktowany jako timeout tylko wtedy, gdy kontekst dostawcy faktycznie jest OpenRouter. Ogólny wewnętrzny tekst awaryjny, taki jak `LLM request failed with an unknown error.`, pozostaje zachowawczy i sam nie wyzwala failover.

  </Accordion>
  <Accordion title="Limity retry-after w SDK">
    Niektóre SDK dostawców mogłyby w przeciwnym razie uśpić proces na długie okno `Retry-After` przed zwróceniem kontroli do OpenClaw. Dla SDK opartych na Stainless, takich jak Anthropic i OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60 sekund i natychmiast ujawnia dłuższe odpowiedzi nadające się do ponowienia, aby ta ścieżka failover mogła się uruchomić. Dostosuj lub wyłącz limit za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [Zachowanie ponowień](/pl/concepts/retry).
  </Accordion>
  <Accordion title="Cooldowny zakresowane do modelu">
    Cooldowny limitów szybkości mogą być także zakresowane do modelu:

    - OpenClaw zapisuje `cooldownModel` dla awarii limitu szybkości, gdy identyfikator modelu, który zawiódł, jest znany.
    - Pokrewny model u tego samego dostawcy nadal może zostać wypróbowany, gdy cooldown jest ograniczony do innego modelu.
    - Okna rozliczeń/wyłączenia nadal blokują cały profil we wszystkich modelach.

  </Accordion>
</AccordionGroup>

Cooldowny używają wykładniczego backoffu:

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

Awarie rozliczeń/kredytów (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do failover, ale zwykle nie są przejściowe. Zamiast krótkiego cooldownu OpenClaw oznacza profil jako **wyłączony** (z dłuższym backoffem) i rotuje do następnego profilu/dostawcy.

<Note>
Nie każda odpowiedź wyglądająca na rozliczeniową jest `402` i nie każde HTTP `402` trafia tutaj. OpenClaw utrzymuje jawny tekst rozliczeniowy w ścieżce rozliczeń nawet wtedy, gdy dostawca zwraca zamiast tego `401` lub `403`, ale matchery specyficzne dla dostawcy pozostają ograniczone do dostawcy, który jest ich właścicielem (na przykład OpenRouter `403 Key limit exceeded`).

Tymczasem tymczasowe błędy `402` dotyczące okna użycia oraz limitów wydatków organizacji/przestrzeni roboczej są klasyfikowane jako `rate_limit`, gdy komunikat wygląda na możliwy do ponowienia (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` lub `organization spending limit exceeded`). Pozostają one na krótkiej ścieżce cooldown/failover zamiast długiej ścieżki wyłączenia rozliczeniowego.
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

- Backoff rozliczeniowy zaczyna się od **5 godzin**, podwaja się po każdej awarii rozliczeniowej i ma limit **24 godzin**.
- Liczniki backoffu resetują się, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Ponowienia przy przeciążeniu pozwalają na **1 rotację profilu tego samego dostawcy** przed awaryjnym przełączeniem modelu.
- Ponowienia przy przeciążeniu domyślnie używają **0 ms backoffu**.

## Awaryjne przełączanie modelu

Jeśli wszystkie profile dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w `agents.defaults.model.fallbacks`. Dotyczy to awarii uwierzytelniania, limitów szybkości i timeoutów, które wyczerpały rotację profili (inne błędy nie przechodzą dalej w ramach awaryjnego przełączania). Błędy dostawcy, które nie ujawniają wystarczających szczegółów, nadal są precyzyjnie etykietowane w stanie awaryjnym: `empty_response` oznacza, że dostawca nie zwrócił użytecznej wiadomości ani statusu, `no_error_details` oznacza, że dostawca jawnie zwrócił `Unknown error (no error details in response)`, a `unclassified` oznacza, że OpenClaw zachował surowy podgląd, ale żaden klasyfikator jeszcze go nie dopasował.

Błędy przeciążenia i limitów szybkości są obsługiwane bardziej agresywnie niż przerwy rozliczeniowe. Domyślnie OpenClaw zezwala na jedną ponowną próbę z profilem uwierzytelniania tego samego dostawcy, a następnie przełącza się na następny skonfigurowany model zapasowy bez czekania. Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do tej kategorii przeciążenia. Dostosuj to za pomocą `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` i `auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się od skonfigurowanego domyślnego modelu podstawowego, modelu podstawowego zadania cron, modelu podstawowego agenta z jawnymi modelami zapasowymi albo automatycznie wybranego nadpisania zapasowego, OpenClaw może przejść przez pasujący skonfigurowany łańcuch modeli zapasowych. Modele podstawowe agentów bez jawnych modeli zapasowych oraz jawne wybory użytkownika (na przykład `/model ollama/qwen3.5:27b`, selektor modelu, `sessions.patch` albo jednorazowe nadpisania dostawcy/modelu w CLI) są ścisłe: jeśli ten dostawca/model jest nieosiągalny albo zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza błąd zamiast odpowiadać z niepowiązanego modelu zapasowego.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model` oraz skonfigurowanych modeli zapasowych.

<AccordionGroup>
  <Accordion title="Reguły">
    - Żądany model jest zawsze pierwszy.
    - Jawnie skonfigurowane modele zapasowe są deduplikowane, ale nie są filtrowane przez listę dozwolonych modeli. Są traktowane jako jawny zamiar operatora.
    - Jeśli bieżące uruchomienie już działa na skonfigurowanym modelu zapasowym z tej samej rodziny dostawców, OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
    - Jeśli bieżące uruchomienie działa u innego dostawcy niż w konfiguracji, a bieżący model nie jest już częścią skonfigurowanego łańcucha modeli zapasowych, OpenClaw nie dołącza niepowiązanych skonfigurowanych modeli zapasowych od innego dostawcy.
    - Gdy do mechanizmu modeli zapasowych nie podano jawnego nadpisania zapasowego, skonfigurowany model podstawowy jest dołączany na końcu, aby łańcuch mógł wrócić do normalnej wartości domyślnej po wyczerpaniu wcześniejszych kandydatów.
    - Gdy wywołujący podaje `fallbacksOverride`, mechanizm używa dokładnie żądanego modelu oraz tej listy nadpisań. Pusta lista wyłącza przełączanie na modele zapasowe i zapobiega dołączaniu skonfigurowanego modelu podstawowego jako ukrytego celu ponownej próby.

  </Accordion>
</AccordionGroup>

### Które błędy przechodzą do modelu zapasowego

<Tabs>
  <Tab title="Kontynuuje przy">
    - błędach uwierzytelniania
    - limitach szybkości i wyczerpaniu przerw
    - błędach przeciążenia/zajętości dostawcy
    - błędach przełączania awaryjnego przypominających przekroczenie czasu
    - wyłączeniach rozliczeń
    - `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki przełączania awaryjnego, aby nieaktualny utrwalony model nie tworzył zewnętrznej pętli ponownych prób
    - innych nierozpoznanych błędach, gdy nadal pozostają kandydaci

  </Tab>
  <Tab title="Nie kontynuuje przy">
    - jawnych przerwaniach, które nie przypominają przekroczenia czasu/przełączania awaryjnego
    - błędach przepełnienia kontekstu, które powinny pozostać wewnątrz logiki Compaction/ponownej próby (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` albo `ollama error: context length exceeded`)
    - końcowym nieznanym błędzie, gdy nie pozostało już żadnych kandydatów

  </Tab>
</Tabs>

### Pomijanie przerw a zachowanie sondowania

Gdy każdy profil uwierzytelniania dla dostawcy jest już w okresie przerwy, OpenClaw nie pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję dla każdego kandydata:

<AccordionGroup>
  <Accordion title="Decyzje dla każdego kandydata">
    - Trwałe błędy uwierzytelniania natychmiast pomijają całego dostawcę.
    - Wyłączenia rozliczeń zwykle są pomijane, ale kandydat podstawowy nadal może być sondowany z ograniczeniem, aby odzyskanie działania było możliwe bez ponownego uruchamiania.
    - Kandydat podstawowy może być sondowany w pobliżu wygaśnięcia przerwy, z ograniczeniem dla każdego dostawcy.
    - Zapasowe modele siostrzane tego samego dostawcy mogą być próbowane mimo przerwy, gdy błąd wygląda na przejściowy (`rate_limit`, `overloaded` lub nieznany). Jest to szczególnie istotne, gdy limit szybkości jest przypisany do modelu, a model siostrzany może nadal odzyskać działanie natychmiast.
    - Sondowania przejściowych przerw są ograniczone do jednego na dostawcę w ramach jednego uruchomienia modeli zapasowych, aby pojedynczy dostawca nie wstrzymywał przełączania między dostawcami.

  </Accordion>
</AccordionGroup>

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji są współdzielonym stanem. Aktywny mechanizm uruchamiający, polecenie `/model`, aktualizacje Compaction/sesji oraz uzgadnianie sesji na żywo odczytują lub zapisują części tego samego wpisu sesji.

Oznacza to, że ponowne próby z modelami zapasowymi muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu zainicjowane przez użytkownika oznaczają oczekujące przełączenie na żywo. Obejmuje to `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu inicjowane przez system, takie jak rotacja modeli zapasowych, nadpisania Heartbeat lub Compaction, nigdy same nie oznaczają oczekującego przełączenia na żywo.
- Nadpisania modelu zainicjowane przez użytkownika są traktowane jako dokładne wybory dla zasad modeli zapasowych, więc nieosiągalny wybrany dostawca jest zgłaszany jako błąd zamiast być maskowany przez `agents.defaults.model.fallbacks`.
- Zanim rozpocznie się ponowna próba z modelem zapasowym, mechanizm odpowiedzi utrwala wybrane pola nadpisania zapasowego we wpisie sesji.
- Automatyczne nadpisania zapasowe pozostają wybrane w kolejnych turach, aby OpenClaw nie sondował znanego wadliwego modelu podstawowego przy każdej wiadomości. `/new`, `/reset` i `sessions.reset` czyszczą nadpisania pochodzące z automatycznego wyboru i przywracają sesję do skonfigurowanej wartości domyślnej.
- `/status` pokazuje wybrany model oraz, gdy stan zapasowy się różni, aktywny model zapasowy i powód.
- Uzgadnianie sesji na żywo preferuje utrwalone nadpisania sesji zamiast nieaktualnych pól modelu w czasie działania.
- Jeśli błąd przełączenia na żywo wskazuje późniejszego kandydata w aktywnym łańcuchu modeli zapasowych, OpenClaw przechodzi bezpośrednio do tego wybranego modelu zamiast najpierw przechodzić przez niepowiązanych kandydatów.
- Jeśli próba z modelem zapasowym się nie powiedzie, mechanizm wycofuje tylko pola nadpisania, które sam zapisał, i tylko jeśli nadal pasują do tego nieudanego kandydata.

Zapobiega to klasycznemu wyścigowi:

<Steps>
  <Step title="Model podstawowy zawodzi">
    Wybrany model podstawowy zawodzi.
  </Step>
  <Step title="Model zapasowy wybrany w pamięci">
    Kandydat zapasowy zostaje wybrany w pamięci.
  </Step>
  <Step title="Magazyn sesji nadal wskazuje stary model podstawowy">
    Magazyn sesji nadal odzwierciedla stary model podstawowy.
  </Step>
  <Step title="Uzgadnianie na żywo odczytuje nieaktualny stan">
    Uzgadnianie sesji na żywo odczytuje nieaktualny stan sesji.
  </Step>
  <Step title="Ponowna próba wróciła do starego modelu">
    Ponowna próba zostaje cofnięta do starego modelu, zanim rozpocznie się próba z modelem zapasowym.
  </Step>
</Steps>

Utrwalone nadpisanie zapasowe zamyka to okno, a wąskie wycofanie zachowuje nowsze ręczne lub uruchomieniowe zmiany sesji.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` zapisuje szczegóły każdej próby, które zasilają dzienniki i komunikaty o przerwach widoczne dla użytkownika:

- próbowany dostawca/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i podobne powody przełączania awaryjnego)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Ustrukturyzowane dzienniki `model_fallback_decision` zawierają także płaskie pola `fallbackStep*`, gdy kandydat zawodzi, jest pomijany albo późniejszy model zapasowy kończy się powodzeniem. Te pola czynią próbę przejścia jawną (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), aby eksportery dzienników i diagnostyki mogły odtworzyć błąd modelu podstawowego nawet wtedy, gdy końcowy model zapasowy również zawiedzie.

Gdy każdy kandydat zawiedzie, OpenClaw zgłasza `FallbackSummaryError`. Zewnętrzny mechanizm odpowiedzi może użyć tego do zbudowania bardziej szczegółowego komunikatu, takiego jak „wszystkie modele są tymczasowo ograniczone limitami szybkości”, i dołączyć najbliższe wygaśnięcie przerwy, gdy jest znane.

To podsumowanie przerw uwzględnia model:

- niepowiązane limity szybkości przypisane do modelu są ignorowane dla próbowanego łańcucha dostawca/model
- jeśli pozostała blokada jest pasującym limitem szybkości przypisanym do modelu, OpenClaw zgłasza ostatnie pasujące wygaśnięcie, które nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [konfigurację Gateway](/pl/gateway/configuration), aby poznać:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby poznać szerszy przegląd wyboru modelu i modeli zapasowych.
