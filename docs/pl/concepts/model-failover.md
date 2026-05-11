---
read_when:
    - Diagnozowanie rotacji profilu uwierzytelniania, okresów odnowienia lub zachowania awaryjnego przełączania modelu
    - Aktualizowanie reguł przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modelu sesji współdziałają z ponownymi próbami awaryjnymi
sidebarTitle: Model failover
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Przełączanie awaryjne modelu
x-i18n:
    generated_at: "2026-05-11T20:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profilu uwierzytelniania** w obrębie bieżącego dostawcy.
2. **Awaryjny wybór modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły działania w czasie wykonywania oraz dane, na których się opierają.

## Przepływ w czasie wykonywania

Dla zwykłego przebiegu tekstowego OpenClaw ocenia kandydatów w tej kolejności:

<Steps>
  <Step title="Resolve session state">
    Ustal aktywny model sesji i preferencję profilu uwierzytelniania.
  </Step>
  <Step title="Build candidate chain">
    Zbuduj łańcuch kandydatów modeli na podstawie bieżącego wyboru modelu i zasad awaryjnego wyboru dla źródła tego wyboru. Skonfigurowane wartości domyślne, modele główne zadań cron oraz automatycznie wybrane modele awaryjne mogą używać skonfigurowanych modeli awaryjnych; jawne wybory sesji użytkownika są ścisłe.
  </Step>
  <Step title="Try the current provider">
    Spróbuj użyć bieżącego dostawcy z regułami rotacji/okresu wyciszenia profili uwierzytelniania.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Jeśli ten dostawca zostanie wyczerpany z błędem kwalifikującym się do przełączenia awaryjnego, przejdź do następnego kandydata modelu.
  </Step>
  <Step title="Persist fallback override">
    Utrwal wybrane nadpisanie awaryjne przed rozpoczęciem ponownej próby, aby inne czytniki sesji widziały tego samego dostawcę/model, którego za chwilę użyje runner. Utrwalone nadpisanie modelu jest oznaczone jako `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Jeśli kandydat awaryjny zawiedzie, wycofaj tylko pola nadpisania sesji należące do mechanizmu awaryjnego, gdy nadal odpowiadają temu nieudanemu kandydatowi.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Jeśli zawiodą wszyscy kandydaci, zgłoś `FallbackSummaryError` ze szczegółami każdej próby i najbliższym czasem zakończenia okresu wyciszenia, jeśli jest znany.
  </Step>
</Steps>

To celowo węższe niż „zapisz i przywróć całą sesję”. Runner odpowiedzi utrwala tylko pola wyboru modelu, które posiada na potrzeby awaryjnego wyboru:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Zapobiega to nadpisaniu nowszych, niezwiązanych mutacji sesji przez nieudaną ponowną próbę awaryjną, takich jak ręczne zmiany `/model` albo aktualizacje rotacji sesji, które wystąpiły w trakcie wykonywania próby.

## Zasady źródła wyboru

OpenClaw oddziela wybranego dostawcę/model od powodu tego wyboru. To źródło kontroluje, czy łańcuch awaryjny jest dozwolony:

- **Skonfigurowana wartość domyślna**: `agents.defaults.model.primary` używa `agents.defaults.model.fallbacks`.
- **Model główny agenta**: `agents.list[].model` jest ścisły, chyba że obiekt modelu tego agenta zawiera własne `fallbacks`. Użyj `fallbacks: []`, aby jawnie wskazać ścisłe zachowanie, albo podaj niepustą listę, aby włączyć awaryjny wybór modelu dla tego agenta.
- **Automatyczne nadpisanie awaryjne**: awaryjny wybór w czasie wykonywania zapisuje `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` oraz wybrany model pochodzenia przed ponowną próbą. To automatyczne nadpisanie może dalej przechodzić przez skonfigurowany łańcuch awaryjny i jest czyszczone przez `/new`, `/reset` oraz `sessions.reset`. Przebiegi Heartbeat bez jawnego `heartbeat.model` również czyszczą bezpośrednie automatyczne nadpisanie, gdy jego pochodzenie nie odpowiada już bieżącej skonfigurowanej wartości domyślnej.
- **Nadpisanie sesji użytkownika**: `/model`, selektor modelu, `session_status(model=...)` oraz `sessions.patch` zapisują `modelOverrideSource: "user"`. To jest dokładny wybór sesji. Jeśli wybrany dostawca/model zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłosi błąd zamiast odpowiedzieć z niepowiązanego skonfigurowanego modelu awaryjnego.
- **Starsze nadpisanie sesji**: starsze wpisy sesji mogą mieć `modelOverride` bez `modelOverrideSource`. OpenClaw traktuje je jako nadpisania użytkownika, aby jawny stary wybór nie został po cichu przekształcony w zachowanie awaryjne.
- **Model z ładunku Cron**: `payload.model` / `--model` zadania cron jest modelem głównym zadania, a nie nadpisaniem sesji użytkownika. Używa skonfigurowanych modeli awaryjnych, chyba że zadanie podaje `payload.fallbacks`; `payload.fallbacks: []` powoduje ścisłe wykonanie zadania cron.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza ścieżka: `~/.openclaw/agent/auth-profiles.json`).
- Stan routingu uwierzytelniania w czasie wykonywania znajduje się w `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguracja `auth.profiles` / `auth.order` to **tylko metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

Więcej szczegółów: [OAuth](/pl/concepts/oauth)

Typy poświadczeń:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych dostawców)

## Identyfikatory profili

Logowania OAuth tworzą osobne profile, aby wiele kont mogło współistnieć.

- Domyślnie: `provider:default`, gdy adres e-mail nie jest dostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` w sekcji `profiles`.

## Kolejność rotacji

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność tak:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (jeśli ustawiono).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` przefiltrowane według dostawcy.
  </Step>
  <Step title="Stored profiles">
    Wpisy w `auth-profiles.json` dla dostawcy.
  </Step>
</Steps>

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round-robin:

- **Klucz główny:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w obrębie każdego typu).
- **Profile w okresie wyciszenia/wyłączone** są przenoszone na koniec, uporządkowane według najbliższego czasu wygaśnięcia.

### Przywiązanie sesji (przyjazne dla cache)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać ciepłe cache dostawców. **Nie** rotuje go przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- nie zakończy się Compaction (licznik Compaction wzrośnie)
- profil nie jest w okresie wyciszenia/wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji i nie jest automatycznie rotowany aż do rozpoczęcia nowej sesji.

<Note>
Automatycznie przypięte profile (wybrane przez router sesji) są traktowane jako **preferencja**: są próbowane jako pierwsze, ale OpenClaw może przejść do innego profilu przy limitach szybkości/przekroczeniach czasu. Gdy pierwotny profil znów będzie dostępny, nowe przebiegi mogą ponownie go preferować bez zmiany wybranego modelu ani runtime. Profile przypięte przez użytkownika pozostają zablokowane na tym profilu; jeśli zawiedzie, a skonfigurowano awaryjne modele, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.
</Note>

### Subskrypcja OpenAI Codex plus zapasowy klucz API

Dla modeli agentów OpenAI uwierzytelnianie i runtime są oddzielne. `openai/gpt-*` pozostaje na
harnessie Codex, podczas gdy uwierzytelnianie może rotować między profilem subskrypcji Codex a
zapasowym kluczem API OpenAI.

Użyj `auth.order.openai` dla kolejności widocznej dla użytkownika:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Istniejące profile subskrypcji Codex mogą nadal używać starszego identyfikatora profilu
`openai-codex:*`. Uporządkowany zapasowy klucz API może być zwykłym profilem klucza API
`openai:*`. Gdy subskrypcja osiągnie limit użycia Codex,
OpenClaw zapisuje dokładny czas resetu, jeśli Codex go podaje, próbuje następnego
uporządkowanego profilu uwierzytelniania i utrzymuje przebieg w harnessie Codex. Gdy czas resetu
minie, profil subskrypcji znów kwalifikuje się do użycia, a następny automatyczny
wybór może do niego wrócić.

Używaj profilu przypiętego przez użytkownika tylko wtedy, gdy chcesz wymusić jedno konto/klucz dla tej
sesji. Profile przypięte przez użytkownika są celowo ścisłe i nie przeskakują po cichu
do innego profilu.

## Okresy wyciszenia

Gdy profil zawiedzie z powodu błędów uwierzytelniania/limitów szybkości (albo przekroczenia czasu wyglądającego jak limitowanie), OpenClaw oznacza go jako będący w okresie wyciszenia i przechodzi do następnego profilu.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Ten koszyk limitów szybkości jest szerszy niż zwykłe `429`: obejmuje też komunikaty dostawców takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` oraz okresowe limity okien użycia, takie jak `weekly/monthly limit reached`.

    Błędy formatu/nieprawidłowego żądania zwykle są terminalne, ponieważ ponowienie tego samego ładunku zakończyłoby się tak samo, więc OpenClaw je ujawnia zamiast rotować profile uwierzytelniania. Znane ścieżki naprawy przez ponowienie mogą włączać się jawnie: na przykład błędy walidacji identyfikatora wywołania narzędzia Cloud Code Assist są sanityzowane i ponawiane raz przez zasadę `allowFormatRetry`. Błędy powodów zatrzymania zgodne z OpenAI, takie jak `Unhandled stop reason: error`, `stop reason: error` i `reason: error`, są klasyfikowane jako sygnały przekroczenia czasu/przełączenia awaryjnego.

    Ogólny tekst serwera również może trafić do tego koszyka przekroczeń czasu, gdy źródło pasuje do znanego wzorca przejściowego. Na przykład surowy komunikat wrappera strumienia pi-ai `An unknown error occurred` jest traktowany jako kwalifikujący się do przełączenia awaryjnego dla każdego dostawcy, ponieważ pi-ai emituje go, gdy strumienie dostawców kończą się z `stopReason: "aborted"` albo `stopReason: "error"` bez konkretnych szczegółów. Ładunki JSON `api_error` z przejściowym tekstem serwera, takim jak `internal server error`, `unknown error, 520`, `upstream error` albo `backend error`, również są traktowane jako przekroczenia czasu kwalifikujące się do przełączenia awaryjnego.

    Ogólny tekst upstream specyficzny dla OpenRouter, taki jak surowe `Provider returned error`, jest traktowany jako przekroczenie czasu tylko wtedy, gdy kontekstem dostawcy faktycznie jest OpenRouter. Ogólny wewnętrzny tekst awaryjny, taki jak `LLM request failed with an unknown error.`, pozostaje konserwatywny i sam z siebie nie wyzwala przełączenia awaryjnego.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Niektóre SDK dostawców mogłyby w przeciwnym razie uśpić wykonanie na długie okno `Retry-After` przed zwróceniem kontroli do OpenClaw. Dla SDK opartych na Stainless, takich jak Anthropic i OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60 sekund i natychmiast ujawnia dłuższe odpowiedzi nadające się do ponowienia, aby ta ścieżka przełączenia awaryjnego mogła się uruchomić. Dostosuj albo wyłącz limit za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [Zachowanie ponawiania](/pl/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Okresy wyciszenia limitów szybkości mogą być też ograniczone do modelu:

    - OpenClaw zapisuje `cooldownModel` dla awarii limitów szybkości, gdy identyfikator modelu, który zawiódł, jest znany.
    - Model pokrewny u tego samego dostawcy nadal może zostać wypróbowany, gdy okres wyciszenia jest ograniczony do innego modelu.
    - Okna rozliczeniowe/wyłączenia nadal blokują cały profil we wszystkich modelach.

  </Accordion>
</AccordionGroup>

Okresy wyciszenia używają wykładniczego backoffu:

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

## Wyłączenia rozliczeniowe

Awarie rozliczeń/kredytów (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do przełączenia awaryjnego, ale zwykle nie są przejściowe. Zamiast krótkiego okresu wyciszenia OpenClaw oznacza profil jako **wyłączony** (z dłuższym backoffem) i rotuje do następnego profilu/dostawcy.

<Note>
Nie każda odpowiedź wyglądająca na rozliczeniową jest `402` i nie każde HTTP `402` trafia tutaj. OpenClaw utrzymuje jawny tekst rozliczeniowy w ścieżce rozliczeń nawet wtedy, gdy dostawca zwraca zamiast tego `401` albo `403`, ale dopasowania specyficzne dla dostawcy pozostają ograniczone do dostawcy, który jest ich właścicielem (na przykład OpenRouter `403 Key limit exceeded`).

Tymczasem tymczasowe błędy `402` dotyczące okna użycia oraz limitu wydatków organizacji/przestrzeni roboczej są klasyfikowane jako `rate_limit`, gdy komunikat wygląda na możliwy do ponowienia (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` albo `organization spending limit exceeded`). Pozostają one na krótkiej ścieżce odczekania/przełączenia awaryjnego zamiast długiej ścieżki wyłączenia z powodu rozliczeń.
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

- Odczekanie po błędzie rozliczeń zaczyna się od **5 godzin**, podwaja się po każdej awarii rozliczeń i jest ograniczone do **24 godzin**.
- Liczniki odczekania resetują się, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Ponowienia przy przeciążeniu pozwalają na **1 rotację profilu u tego samego dostawcy** przed awaryjnym przełączeniem modelu.
- Ponowienia przy przeciążeniu domyślnie używają odczekania **0 ms**.

## Awaryjne przełączanie modeli

Jeśli wszystkie profile dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w `agents.defaults.model.fallbacks`. Dotyczy to awarii uwierzytelniania, limitów szybkości i przekroczeń czasu, które wyczerpały rotację profili (inne błędy nie uruchamiają awaryjnego przełączenia). Błędy dostawcy, które nie ujawniają wystarczających szczegółów, nadal są precyzyjnie oznaczane w stanie awaryjnego przełączenia: `empty_response` oznacza, że dostawca nie zwrócił użytecznej wiadomości ani statusu, `no_error_details` oznacza, że dostawca jawnie zwrócił `Unknown error (no error details in response)`, a `unclassified` oznacza, że OpenClaw zachował surowy podgląd, ale żaden klasyfikator jeszcze do niego nie pasował.

Błędy przeciążenia i limitu szybkości są obsługiwane bardziej agresywnie niż odczekania rozliczeniowe. Domyślnie OpenClaw pozwala na jedną ponowną próbę profilu uwierzytelniania u tego samego dostawcy, a następnie bez czekania przełącza się na następny skonfigurowany model awaryjny. Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do tego koszyka przeciążenia. Dostosuj to za pomocą `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` i `auth.cooldowns.rateLimitedProfileRotations`.

Gdy przebieg zaczyna się od skonfigurowanego domyślnego modelu podstawowego, podstawowego modelu zadania cron, podstawowego modelu agenta z jawnymi modelami awaryjnymi albo automatycznie wybranego nadpisania awaryjnego, OpenClaw może przejść przez pasujący skonfigurowany łańcuch awaryjny. Podstawowe modele agentów bez jawnych modeli awaryjnych oraz jawne wybory użytkownika (na przykład `/model ollama/qwen3.5:27b`, selektor modelu, `sessions.patch` albo jednorazowe nadpisania dostawcy/modelu w CLI) są ścisłe: jeśli ten dostawca/model jest nieosiągalny albo zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza błąd zamiast odpowiadać z niepowiązanego modelu awaryjnego.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model` oraz skonfigurowanych modeli awaryjnych.

<AccordionGroup>
  <Accordion title="Reguły">
    - Żądany model jest zawsze pierwszy.
    - Jawnie skonfigurowane modele awaryjne są deduplikowane, ale nie są filtrowane według listy dozwolonych modeli. Są traktowane jako jawny zamiar operatora.
    - Jeśli bieżący przebieg jest już na skonfigurowanym modelu awaryjnym w tej samej rodzinie dostawców, OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
    - Gdy nie podano jawnego nadpisania awaryjnego, skonfigurowane modele awaryjne są próbowane przed skonfigurowanym modelem podstawowym, nawet jeśli żądany model używa innego dostawcy.
    - Gdy do mechanizmu awaryjnego nie podano jawnego nadpisania awaryjnego, skonfigurowany model podstawowy jest dodawany na końcu, aby łańcuch mógł wrócić do normalnej wartości domyślnej po wyczerpaniu wcześniejszych kandydatów.
    - Gdy wywołujący podaje `fallbacksOverride`, mechanizm używa dokładnie żądanego modelu oraz tej listy nadpisań. Pusta lista wyłącza awaryjne przełączanie modeli i zapobiega dodaniu skonfigurowanego modelu podstawowego jako ukrytego celu ponownej próby.

  </Accordion>
</AccordionGroup>

### Które błędy uruchamiają awaryjne przełączenie

<Tabs>
  <Tab title="Kontynuuje przy">
    - awariach uwierzytelniania
    - limitach szybkości i wyczerpaniu odczekania
    - błędach przeciążenia/zajętości dostawcy
    - błędach przełączenia awaryjnego o kształcie przekroczenia czasu
    - wyłączeniach rozliczeniowych
    - `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki przełączenia awaryjnego, aby nieaktualny utrwalony model nie tworzył zewnętrznej pętli ponowień
    - innych nierozpoznanych błędach, gdy nadal pozostali kandydaci

  </Tab>
  <Tab title="Nie kontynuuje przy">
    - jawnych przerwaniach, które nie mają kształtu przekroczenia czasu/przełączenia awaryjnego
    - błędach przepełnienia kontekstu, które powinny pozostać wewnątrz logiki Compaction/ponowień (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` albo `ollama error: context length exceeded`)
    - końcowym nieznanym błędzie, gdy nie ma już kandydatów

  </Tab>
</Tabs>

### Zachowanie pomijania odczekania kontra sondowania

Gdy każdy profil uwierzytelniania dla dostawcy jest już w okresie odczekania, OpenClaw nie pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję dla każdego kandydata:

<AccordionGroup>
  <Accordion title="Decyzje dla każdego kandydata">
    - Trwałe awarie uwierzytelniania natychmiast pomijają całego dostawcę.
    - Wyłączenia rozliczeniowe zwykle są pomijane, ale kandydat podstawowy nadal może być sondowany z ograniczeniem częstotliwości, aby odzyskanie było możliwe bez ponownego uruchamiania.
    - Kandydat podstawowy może być sondowany blisko wygaśnięcia odczekania, z ograniczeniem częstotliwości na dostawcę.
    - Pokrewne modele awaryjne tego samego dostawcy mogą być próbowane mimo odczekania, gdy awaria wygląda na przejściową (`rate_limit`, `overloaded` albo nieznana). Jest to szczególnie istotne, gdy limit szybkości dotyczy zakresu modelu, a pokrewny model nadal może odzyskać działanie natychmiast.
    - Przejściowe sondowania odczekania są ograniczone do jednego na dostawcę w jednym przebiegu awaryjnym, aby pojedynczy dostawca nie blokował awaryjnego przełączania między dostawcami.

  </Accordion>
</AccordionGroup>

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji są stanem współdzielonym. Aktywny mechanizm uruchamiający, polecenie `/model`, aktualizacje Compaction/sesji oraz uzgadnianie sesji na żywo odczytują lub zapisują części tego samego wpisu sesji.

Oznacza to, że ponowienia awaryjne muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu zainicjowane przez użytkownika oznaczają oczekujące przełączenie na żywo. Obejmuje to `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu zainicjowane przez system, takie jak rotacja awaryjna, nadpisania Heartbeat czy Compaction, nigdy same nie oznaczają oczekującego przełączenia na żywo.
- Nadpisania modelu zainicjowane przez użytkownika są traktowane jako dokładne wybory dla polityki awaryjnej, więc nieosiągalny wybrany dostawca ujawnia się jako awaria zamiast być maskowany przez `agents.defaults.model.fallbacks`.
- Przed rozpoczęciem ponownej próby awaryjnej mechanizm odpowiedzi utrwala wybrane pola nadpisania awaryjnego we wpisie sesji.
- Automatyczne nadpisania awaryjne pozostają wybrane w kolejnych turach, aby OpenClaw nie sondował znanego wadliwego modelu podstawowego przy każdej wiadomości. `/new`, `/reset` i `sessions.reset` czyszczą nadpisania pochodzące z automatyki i przywracają sesję do skonfigurowanej wartości domyślnej.
- `/status` pokazuje wybrany model, a gdy stan awaryjny się różni, aktywny model awaryjny i przyczynę.
- Uzgadnianie sesji na żywo preferuje utrwalone nadpisania sesji względem nieaktualnych pól modelu środowiska uruchomieniowego.
- Jeśli błąd przełączenia na żywo wskazuje późniejszego kandydata w aktywnym łańcuchu awaryjnym, OpenClaw przechodzi bezpośrednio do tego wybranego modelu zamiast najpierw przechodzić przez niepowiązanych kandydatów.
- Jeśli próba awaryjna zawiedzie, mechanizm uruchamiający wycofuje tylko pola nadpisania, które sam zapisał, i tylko jeśli nadal pasują do tego nieudanego kandydata.

Zapobiega to klasycznemu wyścigowi:

<Steps>
  <Step title="Model podstawowy zawodzi">
    Wybrany model podstawowy zawodzi.
  </Step>
  <Step title="Model awaryjny wybrany w pamięci">
    Kandydat awaryjny jest wybierany w pamięci.
  </Step>
  <Step title="Magazyn sesji nadal wskazuje stary model podstawowy">
    Magazyn sesji nadal odzwierciedla stary model podstawowy.
  </Step>
  <Step title="Uzgadnianie na żywo odczytuje nieaktualny stan">
    Uzgadnianie sesji na żywo odczytuje nieaktualny stan sesji.
  </Step>
  <Step title="Ponowienie wraca do poprzedniego modelu">
    Ponowienie zostaje przywrócone do starego modelu, zanim rozpocznie się próba awaryjna.
  </Step>
</Steps>

Utrwalone nadpisanie awaryjne zamyka to okno, a wąskie wycofanie pozostawia nowsze ręczne lub środowiskowe zmiany sesji bez zmian.

## Obserwowalność i podsumowania awarii

`runWithModelFallback(...)` rejestruje szczegóły każdej próby, które zasilają dzienniki oraz komunikaty o odczekaniu widoczne dla użytkownika:

- próbowany dostawca/model
- przyczyna (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` oraz podobne przyczyny przełączenia awaryjnego)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Strukturalne dzienniki `model_fallback_decision` zawierają też płaskie pola `fallbackStep*`, gdy kandydat zawodzi, jest pomijany albo późniejszy model awaryjny kończy się sukcesem. Te pola czynią próbowane przejście jawnym (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), aby eksportery dzienników i diagnostyki mogły odtworzyć awarię modelu podstawowego, nawet gdy końcowy model awaryjny także zawiedzie.

Gdy każdy kandydat zawiedzie, OpenClaw zgłasza `FallbackSummaryError`. Zewnętrzny mechanizm odpowiedzi może użyć tego do zbudowania bardziej szczegółowej wiadomości, takiej jak „wszystkie modele są tymczasowo objęte limitem szybkości”, i uwzględnić najbliższe wygaśnięcie odczekania, jeśli jest znane.

To podsumowanie odczekania uwzględnia model:

- niepowiązane limity szybkości o zakresie modelu są ignorowane dla próbowanego łańcucha dostawca/model
- jeśli pozostała blokada jest pasującym limitem szybkości o zakresie modelu, OpenClaw zgłasza ostatnie pasujące wygaśnięcie, które nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja Gateway](/pl/gateway/configuration), aby uzyskać informacje o:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routingu `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby uzyskać szerszy przegląd wyboru modelu i awaryjnego przełączania.
