---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, okresów cooldown lub zachowania awaryjnego wyboru modelu
    - Aktualizowanie reguł przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modelu sesji współdziałają z ponownymi próbami fallback
sidebarTitle: Model failover
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Przełączanie awaryjne modelu
x-i18n:
    generated_at: "2026-07-04T15:39:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profilu uwierzytelniania** w ramach bieżącego dostawcy.
2. **Fallback modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły działania w czasie wykonania oraz dane, na których się opierają.

## Przepływ w czasie wykonania

Dla zwykłego uruchomienia tekstowego OpenClaw ocenia kandydatów w tej kolejności:

<Steps>
  <Step title="Ustal stan sesji">
    Ustal aktywny model sesji i preferencję profilu uwierzytelniania.
  </Step>
  <Step title="Zbuduj łańcuch kandydatów">
    Zbuduj łańcuch kandydatów modeli na podstawie bieżącego wyboru modelu i zasad fallback dla źródła tego wyboru. Skonfigurowane wartości domyślne, modele główne zadań cron i automatycznie wybrane modele fallback mogą używać skonfigurowanych fallbacków; jawne wybory sesji użytkownika są ścisłe.
  </Step>
  <Step title="Wypróbuj bieżącego dostawcę">
    Wypróbuj bieżącego dostawcę z regułami rotacji/ochłodzenia profili uwierzytelniania.
  </Step>
  <Step title="Przejdź dalej przy błędach kwalifikujących się do przełączenia awaryjnego">
    Jeśli ten dostawca zostanie wyczerpany z błędem kwalifikującym się do przełączenia awaryjnego, przejdź do następnego kandydata modelu.
  </Step>
  <Step title="Utrwal nadpisanie fallback">
    Utrwal wybrane nadpisanie fallback przed rozpoczęciem ponownej próby, aby inni czytelnicy sesji widzieli tego samego dostawcę/model, którego runner zaraz użyje. Utrwalone nadpisanie modelu jest oznaczone jako `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Wycofaj wąsko przy niepowodzeniu">
    Jeśli kandydat fallback zawiedzie, wycofaj tylko pola nadpisania sesji należące do fallback, gdy nadal odpowiadają temu nieudanemu kandydatowi.
  </Step>
  <Step title="Rzuć FallbackSummaryError po wyczerpaniu">
    Jeśli każdy kandydat zawiedzie, rzuć `FallbackSummaryError` ze szczegółami każdej próby i najbliższym terminem wygaśnięcia ochłodzenia, gdy jest znany.
  </Step>
</Steps>

Jest to celowo węższe niż „zapisz i przywróć całą sesję”. Runner odpowiedzi utrwala tylko pola wyboru modelu, które posiada na potrzeby fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Zapobiega to nadpisaniu przez nieudaną ponowną próbę fallback nowszych, niepowiązanych mutacji sesji, takich jak ręczne zmiany `/model` lub aktualizacje rotacji sesji, które nastąpiły w trakcie działania próby.

## Zasady źródła wyboru

OpenClaw oddziela wybranego dostawcę/model od powodu, dla którego został wybrany. To źródło kontroluje, czy łańcuch fallback jest dozwolony:

- **Skonfigurowana wartość domyślna**: `agents.defaults.model.primary` używa `agents.defaults.model.fallbacks`.
- **Model główny agenta**: `agents.list[].model` jest ścisły, chyba że obiekt modelu tego agenta zawiera własne `fallbacks`. Użyj `fallbacks: []`, aby jawnie wskazać ścisłe zachowanie, albo podaj niepustą listę, aby włączyć fallback modelu dla tego agenta.
- **Automatyczne nadpisanie fallback**: fallback w czasie wykonania zapisuje `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` i wybrany model źródłowy przed ponowną próbą. To automatyczne nadpisanie może dalej przechodzić przez skonfigurowany łańcuch fallback bez sprawdzania modelu głównego przy każdej wiadomości, ale OpenClaw okresowo ponownie sprawdza skonfigurowane źródło i czyści automatyczne nadpisanie, gdy ono się odtworzy. `/new`, `/reset` i `sessions.reset` również czyszczą nadpisania pochodzące z automatycznego źródła. Uruchomienia Heartbeat bez jawnego `heartbeat.model` czyszczą bezpośrednie automatyczne nadpisania, gdy ich źródło nie odpowiada już bieżącej skonfigurowanej wartości domyślnej.
- **Nadpisanie sesji użytkownika**: `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`. To jest dokładny wybór sesji. Jeśli wybrany dostawca/model zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza awarię zamiast odpowiadać z niepowiązanego skonfigurowanego fallback.
- **Starsze nadpisanie sesji**: starsze wpisy sesji mogą mieć `modelOverride` bez `modelOverrideSource`. OpenClaw traktuje je jako nadpisania użytkownika, aby jawny stary wybór nie został po cichu przekształcony w zachowanie fallback.
- **Model ładunku Cron**: `payload.model` / `--model` zadania cron jest modelem głównym zadania, a nie nadpisaniem sesji użytkownika. Używa skonfigurowanych fallbacków, chyba że zadanie podaje `payload.fallbacks`; `payload.fallbacks: []` sprawia, że uruchomienie cron jest ścisłe.

Interwał automatycznego sprawdzania modelu głównego fallback wynosi pięć minut i nie jest konfigurowalny. OpenClaw zapamiętuje ostatnie sprawdzenia według sesji i modelu głównego, aby niesprawny model główny nie był ponawiany przy każdej turze. OpenClaw wysyła widoczne powiadomienie, gdy sesja przechodzi na fallback, oraz kolejne powiadomienie, gdy wraca do wybranego modelu głównego; nie powtarza powiadomienia przy każdej lepkiej turze fallback.

## Pamięć podręczna pomijania awarii uwierzytelniania

Domyślnie każda nowa tura zachowuje istniejące zachowanie ponawiania fallback: OpenClaw
ponownie wypróbuje każdego skonfigurowanego kandydata fallback, w tym kandydatów
innych niż główny, którzy niedawno zawiedli z `auth` lub `auth_permanent`.

Operatorzy, którzy wolą tłumić te powtarzające się awarie uwierzytelniania, mogą włączyć:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Po włączeniu OpenClaw zapisuje w pamięci marker pominięcia, ograniczony do sesji,
dla kandydata fallback innego niż główny po awarii klasy uwierzytelniania. Marker jest kluczowany
według identyfikatora sesji, dostawcy i modelu. Kandydaci główni nigdy nie są pomijani, więc
jawny wybór modelu przez użytkownika nadal ujawnia rzeczywisty błąd uwierzytelniania. Pamięć podręczna jest
lokalna dla procesu i czyści się po ponownym uruchomieniu Gateway.

Wartość to TTL w milisekundach. `0` lub wartość nieustawiona wyłącza pamięć podręczną.
Wartości dodatnie są ograniczane do zakresu od 1 sekundy do 10 minut.

## Powiadomienia fallback widoczne dla użytkownika

Gdy sesja przechodzi na automatycznie wybrany fallback, OpenClaw wysyła powiadomienie statusu w tej samej powierzchni odpowiedzi:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Gdy późniejsze sprawdzenie powiedzie się i sesja wróci do wybranego modelu głównego, OpenClaw wysyła:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Te powiadomienia są komunikatami operacyjnymi, a nie treścią asystenta. Są dostarczane raz na zmianę stanu, w tym w turach wyłącznie z efektami ubocznymi, gdy jest to wykonalne, ale lepkie tury fallback ich nie powtarzają. Dostarczanie omija normalne tłumienie odpowiedzi źródłowej, powiadomienie nie zajmuje pierwszego miejsca odpowiedzi asystenta w kanałach wątkowych i jest wykluczone z zamiany tekstu na mowę oraz ekstrakcji zobowiązań.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety i stan routingu uwierzytelniania w czasie wykonania znajdują się w `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfiguracja `auth.profiles` / `auth.order` to **tylko metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do magazynu uwierzytelniania danego agenta przy pierwszym użyciu).
- Starsze pliki `auth-profiles.json`, `auth-state.json` i pliki `auth.json` dla poszczególnych agentów są importowane przez `openclaw doctor --fix`.

Więcej szczegółów: [OAuth](/pl/concepts/oauth)

Typy poświadczeń:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych dostawców)

## Identyfikatory profili

Logowania OAuth tworzą odrębne profile, aby wiele kont mogło współistnieć.

- Domyślnie: `provider:default`, gdy adres e-mail nie jest dostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w magazynie profili uwierzytelniania `openclaw-agent.sqlite` danego agenta.

## Kolejność rotacji

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność w taki sposób:

<Steps>
  <Step title="Jawna konfiguracja">
    `auth.order[provider]` (jeśli ustawiono).
  </Step>
  <Step title="Skonfigurowane profile">
    `auth.profiles` filtrowane według dostawcy.
  </Step>
  <Step title="Zapisane profile">
    Wpisy profili uwierzytelniania SQLite danego agenta dla dostawcy.
  </Step>
</Steps>

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round-robin:

- **Klucz główny:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w ramach każdego typu).
- **Profile w ochłodzeniu/wyłączone** są przenoszone na koniec, uporządkowane według najbliższego wygaśnięcia.

### Lepkość sesji (przyjazna dla pamięci podręcznych)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymywać ciepłe pamięci podręczne dostawcy. **Nie** rotuje przy każdym żądaniu. Przypięty profil jest używany ponownie do czasu, gdy:

- sesja zostanie zresetowana (`/new` / `/reset`)
- zakończy się compaction (licznik compaction wzrośnie)
- profil jest w ochłodzeniu/wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji i nie jest automatycznie rotowany do rozpoczęcia nowej sesji.

<Note>
Automatycznie przypięte profile (wybrane przez router sesji) są traktowane jako **preferencja**: są próbowane jako pierwsze, ale OpenClaw może rotować do innego profilu przy limitach szybkości/przekroczeniach czasu. Gdy pierwotny profil znów stanie się dostępny, nowe uruchomienia mogą ponownie go preferować bez zmiany wybranego modelu lub runtime. Profile przypięte przez użytkownika pozostają zablokowane na tym profilu; jeśli zawiedzie, a fallbacki modeli są skonfigurowane, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.
</Note>

### Subskrypcja OpenAI Codex plus zapasowy klucz API

Dla modeli agentów OpenAI uwierzytelnianie i runtime są oddzielne. `openai/gpt-*` pozostaje w
harnessie Codex, podczas gdy uwierzytelnianie może rotować między profilem subskrypcji Codex a
zapasowym kluczem API OpenAI.

Użyj `auth.order.openai` dla kolejności widocznej dla użytkownika:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Użyj `openai:*` zarówno dla profili OAuth ChatGPT/Codex, jak i profili
kluczy API OpenAI. Gdy subskrypcja osiągnie limit użycia Codex,
OpenClaw zapisuje dokładny czas resetu, gdy Codex go podaje, wypróbowuje następny
uporządkowany profil uwierzytelniania i utrzymuje uruchomienie w harnessie Codex. Po upływie czasu
resetu profil subskrypcji znów kwalifikuje się do użycia, a następny automatyczny
wybór może do niego wrócić.

Używaj profilu przypiętego przez użytkownika tylko wtedy, gdy chcesz wymusić jedno konto/klucz dla tej
sesji. Profile przypięte przez użytkownika są celowo ścisłe i nie przeskakują po cichu
do innego profilu.

## Ochłodzenia

Gdy profil zawiedzie z powodu błędów uwierzytelniania/limitu szybkości (lub przekroczenia czasu, które wygląda jak limit szybkości), OpenClaw oznacza go jako będący w ochłodzeniu i przechodzi do następnego profilu.

<AccordionGroup>
  <Accordion title="Co trafia do koszyka limitu szybkości / przekroczenia czasu">
    Ten koszyk limitu szybkości jest szerszy niż zwykłe `429`: obejmuje również komunikaty dostawców, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, oraz okresowe limity okna użycia, takie jak `weekly/monthly limit reached`.

    Błędy formatu/nieprawidłowego żądania są zwykle terminalne, ponieważ ponowienie tego samego ładunku zawiodłoby w ten sam sposób, więc OpenClaw je ujawnia zamiast rotować profile uwierzytelniania. Znane ścieżki naprawy przez ponowienie mogą włączyć się jawnie: na przykład awarie walidacji identyfikatora wywołania narzędzia Cloud Code Assist są oczyszczane i ponawiane raz przez zasadę `allowFormatRetry`. Błędy powodów zatrzymania zgodne z OpenAI, takie jak `Unhandled stop reason: error`, `stop reason: error` i `reason: error`, są klasyfikowane jako sygnały przekroczenia czasu/przełączenia awaryjnego.

    Ogólny tekst serwera może również trafić do tego koszyka przekroczenia czasu, gdy źródło pasuje do znanego wzorca przejściowego. Na przykład goły komunikat wrappera strumienia runtime modelu `An unknown error occurred` jest traktowany jako kwalifikujący się do przełączenia awaryjnego dla każdego dostawcy, ponieważ współdzielony runtime modelu emituje go, gdy strumienie dostawcy kończą się z `stopReason: "aborted"` lub `stopReason: "error"` bez konkretnych szczegółów. Ładunki JSON `api_error` z przejściowym tekstem serwera, takim jak `internal server error`, `unknown error, 520`, `upstream error` lub `backend error`, również są traktowane jako kwalifikujące się do przełączenia awaryjnego przekroczenia czasu.

    Ogólny tekst upstream specyficzny dla OpenRouter, taki jak gołe `Provider returned error`, jest traktowany jako przekroczenie czasu tylko wtedy, gdy kontekst dostawcy faktycznie jest OpenRouter. Ogólny wewnętrzny tekst fallback, taki jak `LLM request failed with an unknown error.`, pozostaje konserwatywny i samodzielnie nie wyzwala przełączenia awaryjnego.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Niektóre SDK dostawców mogłyby w przeciwnym razie czekać przez długie okno `Retry-After`, zanim zwrócą sterowanie do OpenClaw. W przypadku SDK opartych na Stainless, takich jak Anthropic i OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60 sekund i natychmiast ujawnia dłuższe odpowiedzi nadające się do ponowienia, aby ta ścieżka przełączenia awaryjnego mogła się wykonać. Dostosuj lub wyłącz limit za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [Zachowanie ponowień](/pl/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Okresy wyciszenia po limitach szybkości mogą być także ograniczone do modelu:

    - OpenClaw zapisuje `cooldownModel` dla błędów limitu szybkości, gdy identyfikator modelu, który zawiódł, jest znany.
    - Model równorzędny u tego samego dostawcy nadal może zostać wypróbowany, gdy wyciszenie dotyczy innego modelu.
    - Okna rozliczeń/wyłączeń nadal blokują cały profil we wszystkich modelach.

  </Accordion>
</AccordionGroup>

Okresy wyciszenia używają wykładniczego opóźniania:

- 1 minuta
- 5 minut
- 25 minut
- 1 godzina (limit)

Stan jest przechowywany w stanie uwierzytelniania SQLite poszczególnego agenta w `usageStats`:

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

Błędy rozliczeń/kredytów (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do przełączenia awaryjnego, ale zwykle nie są przejściowe. Zamiast krótkiego wyciszenia OpenClaw oznacza profil jako **wyłączony** (z dłuższym opóźnieniem) i przechodzi do następnego profilu/dostawcy.

<Note>
Nie każda odpowiedź o charakterze rozliczeniowym ma kod `402` i nie każde HTTP `402` trafia tutaj. OpenClaw utrzymuje jawny tekst rozliczeniowy na ścieżce rozliczeń nawet wtedy, gdy dostawca zwraca zamiast tego `401` lub `403`, ale dopasowania specyficzne dla dostawcy pozostają ograniczone do dostawcy, który jest ich właścicielem (na przykład OpenRouter `403 Key limit exceeded`).

Tymczasowe błędy `402` związane z oknem użycia oraz limitami wydatków organizacji/przestrzeni roboczej są natomiast klasyfikowane jako `rate_limit`, gdy komunikat wygląda na możliwy do ponowienia (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` albo `organization spending limit exceeded`). Pozostają one na krótkiej ścieżce wyciszenia/przełączenia awaryjnego zamiast na długiej ścieżce wyłączenia rozliczeniowego.
</Note>

Stan jest przechowywany w stanie uwierzytelniania SQLite poszczególnego agenta:

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

- Opóźnienie rozliczeniowe zaczyna się od **5 godzin**, podwaja się przy każdym błędzie rozliczeniowym i ma limit **24 godzin**.
- Liczniki opóźnień resetują się, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Ponowienia przy przeciążeniu pozwalają na **1 rotację profilu tego samego dostawcy** przed awaryjnym przełączeniem modelu.
- Ponowienia przy przeciążeniu domyślnie używają opóźnienia **0 ms**.

## Awaryjne przełączenie modelu

Jeśli wszystkie profile dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w `agents.defaults.model.fallbacks`. Dotyczy to błędów uwierzytelniania, limitów szybkości i przekroczeń czasu, które wyczerpały rotację profili (inne błędy nie uruchamiają awaryjnego przełączenia). Błędy dostawcy, które nie ujawniają wystarczających szczegółów, nadal są precyzyjnie oznaczane w stanie przełączenia awaryjnego: `empty_response` oznacza, że dostawca nie zwrócił użytecznej wiadomości ani statusu, `no_error_details` oznacza, że dostawca jawnie zwrócił `Unknown error (no error details in response)`, a `unclassified` oznacza, że OpenClaw zachował surowy podgląd, ale żaden klasyfikator jeszcze go nie dopasował.

Błędy przeciążenia i limitów szybkości są obsługiwane bardziej agresywnie niż wyciszenia rozliczeniowe. Domyślnie OpenClaw pozwala na jedno ponowienie profilu uwierzytelniania u tego samego dostawcy, a następnie przełącza się na następny skonfigurowany model awaryjny bez czekania. Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do tego koszyka przeciążenia. Dostosuj to za pomocą `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` i `auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się od skonfigurowanego domyślnego modelu podstawowego, modelu podstawowego zadania Cron, modelu podstawowego agenta z jawnymi modelami awaryjnymi albo automatycznie wybranego zastąpienia awaryjnego, OpenClaw może przejść przez pasujący skonfigurowany łańcuch awaryjny. Modele podstawowe agentów bez jawnych modeli awaryjnych oraz jawne wybory użytkownika (na przykład `/model ollama/qwen3.5:27b`, selektor modelu, `sessions.patch` albo jednorazowe nadpisania dostawcy/modelu w CLI) są ścisłe: jeśli ten dostawca/model jest nieosiągalny albo zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza błąd zamiast odpowiadać z niepowiązanego modelu awaryjnego.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model` oraz skonfigurowanych modeli awaryjnych.

<AccordionGroup>
  <Accordion title="Rules">
    - Żądany model jest zawsze pierwszy.
    - Jawnie skonfigurowane modele awaryjne są deduplikowane, ale nie są filtrowane przez listę dozwolonych modeli. Są traktowane jako jawna intencja operatora.
    - Jeśli bieżące uruchomienie jest już na skonfigurowanym modelu awaryjnym w tej samej rodzinie dostawcy, OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
    - Gdy nie podano jawnego zastąpienia awaryjnego, skonfigurowane modele awaryjne są próbowane przed skonfigurowanym modelem podstawowym, nawet jeśli żądany model używa innego dostawcy.
    - Gdy do modułu uruchamiającego przełączenie awaryjne nie podano jawnego zastąpienia awaryjnego, skonfigurowany model podstawowy jest dopisywany na końcu, aby łańcuch mógł wrócić do normalnej wartości domyślnej po wyczerpaniu wcześniejszych kandydatów.
    - Gdy wywołujący podaje `fallbacksOverride`, moduł uruchamiający używa dokładnie żądanego modelu oraz tej listy zastąpień. Pusta lista wyłącza awaryjne przełączanie modelu i zapobiega dopisaniu skonfigurowanego modelu podstawowego jako ukrytego celu ponowienia.

  </Accordion>
</AccordionGroup>

### Które błędy uruchamiają przełączenie awaryjne

<Tabs>
  <Tab title="Continues on">
    - błędy uwierzytelniania
    - limity szybkości i wyczerpanie wyciszenia
    - błędy przeciążenia/zajętości dostawcy
    - błędy przełączenia awaryjnego o kształcie przekroczenia czasu
    - wyłączenia rozliczeniowe
    - `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki przełączenia awaryjnego, aby przestarzały utrwalony model nie tworzył zewnętrznej pętli ponowień
    - inne nierozpoznane błędy, gdy nadal pozostają kandydaci

  </Tab>
  <Tab title="Does not continue on">
    - jawne przerwania, które nie mają kształtu przekroczenia czasu/przełączenia awaryjnego
    - błędy przepełnienia kontekstu, które powinny pozostać wewnątrz logiki Compaction/ponowień (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` albo `ollama error: context length exceeded`)
    - końcowy nieznany błąd, gdy nie ma już kandydatów
    - odmowy bezpieczeństwa Claude Fable 5; żądania z bezpośrednim kluczem API obsługują je zamiast tego na poziomie dostawcy przez serwerowe przełączenie awaryjne Anthropic do `claude-opus-4-8` (zobacz [Anthropic](/pl/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Pomijanie wyciszenia a zachowanie sondowania

Gdy każdy profil uwierzytelniania dostawcy jest już w wyciszeniu, OpenClaw nie pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję dla każdego kandydata:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Trwałe błędy uwierzytelniania natychmiast pomijają całego dostawcę.
    - Wyłączenia rozliczeniowe zwykle są pomijane, ale kandydat podstawowy nadal może być sondowany z ograniczeniem częstotliwości, aby odzyskanie było możliwe bez ponownego uruchamiania.
    - Kandydat podstawowy może być sondowany blisko wygaśnięcia wyciszenia, z ograniczeniem częstotliwości dla danego dostawcy.
    - Równorzędne modele awaryjne tego samego dostawcy mogą być próbowane mimo wyciszenia, gdy błąd wygląda na przejściowy (`rate_limit`, `overloaded` albo nieznany). Jest to szczególnie istotne, gdy limit szybkości jest ograniczony do modelu, a model równorzędny może nadal natychmiast odzyskać działanie.
    - Sondowania przejściowego wyciszenia są ograniczone do jednego na dostawcę na jedno uruchomienie przełączenia awaryjnego, aby pojedynczy dostawca nie blokował przełączenia awaryjnego między dostawcami.

  </Accordion>
</AccordionGroup>

## Zastąpienia sesji i przełączanie modelu na żywo

Zmiany modelu sesji są stanem współdzielonym. Aktywny moduł uruchamiający, polecenie `/model`, aktualizacje Compaction/sesji oraz uzgadnianie sesji na żywo odczytują lub zapisują części tego samego wpisu sesji.

Oznacza to, że ponowienia przełączenia awaryjnego muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu inicjowane przez użytkownika oznaczają oczekujące przełączenie na żywo. Obejmuje to `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu inicjowane przez system, takie jak rotacja awaryjna, zastąpienia Heartbeat albo Compaction, nigdy same nie oznaczają oczekującego przełączenia na żywo.
- Zastąpienia modelu inicjowane przez użytkownika są traktowane jako dokładne wybory dla polityki przełączeń awaryjnych, więc nieosiągalny wybrany dostawca ujawnia się jako błąd zamiast być maskowany przez `agents.defaults.model.fallbacks`.
- Zanim rozpocznie się ponowienie przełączenia awaryjnego, moduł uruchamiający odpowiedź utrwala wybrane pola zastąpienia awaryjnego we wpisie sesji.
- Automatyczne zastąpienia awaryjne pozostają wybrane w kolejnych turach, aby OpenClaw nie sondował znanego wadliwego modelu podstawowego przy każdej wiadomości. OpenClaw okresowo ponownie sonduje skonfigurowane źródło i czyści automatyczne zastąpienie, gdy odzyska ono działanie; `/new`, `/reset` i `sessions.reset` natychmiast czyszczą zastąpienia pochodzące automatycznie.
- Odpowiedzi użytkownika ogłaszają przejścia awaryjne i przywrócenie po wyczyszczeniu przełączenia awaryjnego raz na zmianę stanu. Tury z utrwalonym przełączeniem awaryjnym nie powtarzają powiadomienia.
- `/status` pokazuje wybrany model oraz, gdy stan przełączenia awaryjnego się różni, aktywny model awaryjny i powód.
- Uzgadnianie sesji na żywo preferuje utrwalone zastąpienia sesji zamiast przestarzałych pól modelu środowiska uruchomieniowego.
- Jeśli błąd przełączenia na żywo wskazuje późniejszego kandydata w aktywnym łańcuchu awaryjnym, OpenClaw przechodzi bezpośrednio do tego wybranego modelu zamiast najpierw przechodzić przez niepowiązanych kandydatów.
- Jeśli próba przełączenia awaryjnego zawiedzie, moduł uruchamiający wycofuje tylko pola zastąpienia, które zapisał, i tylko jeśli nadal pasują do tego nieudanego kandydata.

Zapobiega to klasycznemu wyścigowi:

<Steps>
  <Step title="Primary fails">
    Wybrany model podstawowy zawodzi.
  </Step>
  <Step title="Fallback chosen in memory">
    Kandydat awaryjny zostaje wybrany w pamięci.
  </Step>
  <Step title="Session store still says old primary">
    Magazyn sesji nadal odzwierciedla stary model podstawowy.
  </Step>
  <Step title="Live reconciliation reads stale state">
    Uzgadnianie sesji na żywo odczytuje przestarzały stan sesji.
  </Step>
  <Step title="Retry snapped back">
    Ponowienie zostaje cofnięte do starego modelu, zanim rozpocznie się próba przełączenia awaryjnego.
  </Step>
</Steps>

Utrwalone zastąpienie awaryjne zamyka to okno, a wąskie wycofanie pozostawia nowsze ręczne lub uruchomieniowe zmiany sesji nienaruszone.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` zapisuje szczegóły każdej próby, które zasilają logi i komunikaty wyciszenia widoczne dla użytkownika:

- próbowany dostawca/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i podobne powody przełączenia awaryjnego)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Strukturalne logi `model_fallback_decision` zawierają także płaskie pola `fallbackStep*`, gdy kandydat zawodzi, jest pomijany albo późniejsze przełączenie awaryjne się udaje. Te pola czynią próbę przejścia jawną (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), aby eksportery logów i diagnostyki mogły odtworzyć pierwotną awarię nawet wtedy, gdy końcowy model awaryjny także zawiedzie.

Gdy każdy kandydat zawiedzie, OpenClaw zgłasza `FallbackSummaryError`. Zewnętrzny moduł uruchamiający odpowiedź może użyć tego do zbudowania bardziej szczegółowego komunikatu, takiego jak „wszystkie modele są tymczasowo objęte limitem szybkości”, i uwzględnić najbliższy czas wygaśnięcia wyciszenia, gdy jest znany.

To podsumowanie wyciszenia uwzględnia model:

- niepowiązane limity szybkości ograniczone do modelu są ignorowane dla próbowanego łańcucha dostawca/model
- jeśli pozostała blokada jest pasującym limitem szybkości ograniczonym do modelu, OpenClaw zgłasza ostatni pasujący czas wygaśnięcia, który nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja Gateway](/pl/gateway/configuration), aby uzyskać informacje o:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routowanie `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby uzyskać szerszy przegląd wyboru modelu i mechanizmu awaryjnego.
