---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, okresów karencji lub zachowania awaryjnego przełączania modelu
    - Aktualizowanie reguł przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modelu sesji współdziałają z ponownymi próbami awaryjnymi
sidebarTitle: Model failover
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Przełączanie awaryjne modelu
x-i18n:
    generated_at: "2026-06-27T17:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profili uwierzytelniania** w obrębie bieżącego dostawcy.
2. **Awaryjne przełączenie modelu** na następny model w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły działania w czasie wykonywania oraz dane, które je wspierają.

## Przepływ w czasie wykonywania

Dla zwykłego uruchomienia tekstowego OpenClaw ocenia kandydatów w tej kolejności:

<Steps>
  <Step title="Rozwiąż stan sesji">
    Rozwiąż aktywny model sesji oraz preferencję profilu uwierzytelniania.
  </Step>
  <Step title="Zbuduj łańcuch kandydatów">
    Zbuduj łańcuch kandydatów modeli na podstawie bieżącego wyboru modelu oraz polityki awaryjnego przełączania dla źródła tego wyboru. Skonfigurowane wartości domyślne, modele główne zadań cron oraz automatycznie wybrane modele rezerwowe mogą używać skonfigurowanych modeli rezerwowych; jawne wybory sesji użytkownika są ścisłe.
  </Step>
  <Step title="Wypróbuj bieżącego dostawcę">
    Wypróbuj bieżącego dostawcę z regułami rotacji/okresu cooldown dla profili uwierzytelniania.
  </Step>
  <Step title="Przejdź dalej przy błędach uzasadniających przełączenie awaryjne">
    Jeśli ten dostawca zostanie wyczerpany z błędem uzasadniającym przełączenie awaryjne, przejdź do następnego kandydata modelu.
  </Step>
  <Step title="Utrwal nadpisanie awaryjne">
    Utrwal wybrane nadpisanie awaryjne przed rozpoczęciem ponownej próby, aby inne czytniki sesji widziały tego samego dostawcę/model, którego runner zaraz użyje. Utrwalone nadpisanie modelu jest oznaczone jako `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Cofnij wąsko w razie awarii">
    Jeśli kandydat rezerwowy zawiedzie, cofnij tylko pola nadpisania sesji należące do mechanizmu awaryjnego, gdy nadal odpowiadają temu nieudanemu kandydatowi.
  </Step>
  <Step title="Rzuć FallbackSummaryError po wyczerpaniu">
    Jeśli każdy kandydat zawiedzie, rzuć `FallbackSummaryError` ze szczegółami każdej próby oraz najbliższym wygaśnięciem cooldown, gdy jest znane.
  </Step>
</Steps>

To celowo węższe podejście niż „zapisz i przywróć całą sesję”. Runner odpowiedzi utrwala tylko pola wyboru modelu, które posiada na potrzeby awaryjnego przełączania:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Zapobiega to nadpisaniu przez nieudaną ponowną próbę awaryjną nowszych, niezwiązanych mutacji sesji, takich jak ręczne zmiany `/model` albo aktualizacje rotacji sesji, które nastąpiły w trakcie działania próby.

## Polityka źródła wyboru

OpenClaw oddziela wybranego dostawcę/model od powodu jego wyboru. To źródło kontroluje, czy łańcuch awaryjny jest dozwolony:

- **Skonfigurowana wartość domyślna**: `agents.defaults.model.primary` używa `agents.defaults.model.fallbacks`.
- **Model główny agenta**: `agents.list[].model` jest ścisły, chyba że obiekt modelu tego agenta zawiera własne `fallbacks`. Użyj `fallbacks: []`, aby jawnie wskazać ścisłe zachowanie, albo podaj niepustą listę, aby włączyć awaryjne przełączanie modeli dla tego agenta.
- **Automatyczne nadpisanie awaryjne**: awaryjne przełączenie w czasie wykonywania zapisuje `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` oraz wybrany model źródłowy przed ponowną próbą. Takie automatyczne nadpisanie może dalej przechodzić po skonfigurowanym łańcuchu modeli rezerwowych bez sprawdzania modelu głównego przy każdej wiadomości, ale OpenClaw okresowo ponownie sprawdza skonfigurowane źródło i czyści automatyczne nadpisanie, gdy ono wróci do działania. `/new`, `/reset` oraz `sessions.reset` także czyszczą nadpisania pochodzące z auto. Uruchomienia Heartbeat bez jawnego `heartbeat.model` czyszczą bezpośrednie automatyczne nadpisania, gdy ich źródło nie pasuje już do bieżącej skonfigurowanej wartości domyślnej.
- **Nadpisanie sesji użytkownika**: `/model`, selektor modelu, `session_status(model=...)` oraz `sessions.patch` zapisują `modelOverrideSource: "user"`. To dokładny wybór sesji. Jeśli wybrany dostawca/model zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza awarię zamiast odpowiadać z niezwiązanego skonfigurowanego modelu rezerwowego.
- **Starsze nadpisanie sesji**: starsze wpisy sesji mogą mieć `modelOverride` bez `modelOverrideSource`. OpenClaw traktuje je jako nadpisania użytkownika, aby jawny stary wybór nie został po cichu przekształcony w zachowanie awaryjne.
- **Model ładunku Cron**: `payload.model` / `--model` zadania cron jest modelem głównym zadania, a nie nadpisaniem sesji użytkownika. Używa skonfigurowanych modeli rezerwowych, chyba że zadanie podaje `payload.fallbacks`; `payload.fallbacks: []` sprawia, że uruchomienie cron jest ścisłe.

Interwał sondowania modelu głównego przy automatycznym awaryjnym przełączeniu wynosi pięć minut i nie można go skonfigurować. OpenClaw zapamiętuje ostatnie sondowania według sesji i modelu głównego, aby niesprawny model główny nie był ponawiany przy każdej turze. OpenClaw wysyła widoczne powiadomienie, gdy sesja przechodzi na model rezerwowy, oraz kolejne powiadomienie, gdy wraca do wybranego modelu głównego; nie powtarza powiadomienia przy każdej utrzymanej turze awaryjnej.

## Pamięć podręczna pomijania awarii uwierzytelniania

Domyślnie każda nowa tura zachowuje istniejące zachowanie ponownych prób awaryjnych: OpenClaw
ponownie wypróbuje każdego skonfigurowanego kandydata rezerwowego, w tym kandydatów innych niż główny,
którzy niedawno zawiedli z `auth` albo `auth_permanent`.

Operatorzy, którzy wolą wyciszyć te powtarzające się awarie uwierzytelniania, mogą włączyć to przez:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Po włączeniu OpenClaw zapisuje w pamięci znacznik pominięcia o zakresie sesji dla
kandydata rezerwowego innego niż główny po awarii klasy auth. Znacznik jest kluczowany
według identyfikatora sesji, dostawcy i modelu. Kandydaci główni nigdy nie są pomijani, więc
jawny wybór modelu przez użytkownika nadal pokazuje rzeczywisty błąd uwierzytelniania. Pamięć podręczna jest
lokalna dla procesu i czyści się przy restarcie Gateway.

Wartość jest TTL w milisekundach. `0` albo brak wartości wyłącza pamięć podręczną.
Wartości dodatnie są ograniczane do zakresu od 1 sekundy do 10 minut.

## Powiadomienia awaryjne widoczne dla użytkownika

Gdy sesja przechodzi na automatycznie wybrany model rezerwowy, OpenClaw wysyła powiadomienie o stanie na tej samej powierzchni odpowiedzi:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Gdy późniejsze sondowanie powiedzie się i sesja wróci do wybranego modelu głównego, OpenClaw wysyła:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Te powiadomienia są komunikatami operacyjnymi, a nie treścią asystenta. Są dostarczane raz na zmianę stanu, w tym dla tur mających tylko skutki uboczne, gdy to wykonalne, ale utrzymane tury awaryjne ich nie powtarzają. Dostarczanie omija normalne tłumienie odpowiedzi źródłowej, powiadomienie nie zużywa pierwszego slotu odpowiedzi asystenta dla kanałów wątkowanych i jest wyłączone z zamiany tekstu na mowę oraz ekstrakcji zobowiązań.

## Magazyn uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety i stan routingu uwierzytelniania w czasie wykonywania znajdują się w `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfiguracja `auth.profiles` / `auth.order` to **tylko metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do magazynu uwierzytelniania danego agenta przy pierwszym użyciu).
- Starsze pliki `auth-profiles.json`, `auth-state.json` i pliki `auth.json` poszczególnych agentów są importowane przez `openclaw doctor --fix`.

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

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność w następujący sposób:

<Steps>
  <Step title="Jawna konfiguracja">
    `auth.order[provider]` (jeśli ustawione).
  </Step>
  <Step title="Skonfigurowane profile">
    `auth.profiles` przefiltrowane według dostawcy.
  </Step>
  <Step title="Zapisane profile">
    Wpisy profili uwierzytelniania SQLite danego agenta dla dostawcy.
  </Step>
</Steps>

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round-robin:

- **Klucz główny:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w obrębie każdego typu).
- **Profile w cooldown/wyłączone** są przesuwane na koniec, uporządkowane według najbliższego wygaśnięcia.

### Lepkość sesji (przyjazna pamięci podręcznej)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać ciepłe pamięci podręczne dostawcy. **Nie** rotuje przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- Compaction się nie zakończy (licznik Compaction wzrośnie)
- profil nie jest w cooldown/wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji i nie jest automatycznie rotowany do rozpoczęcia nowej sesji.

<Note>
Automatycznie przypięte profile (wybrane przez router sesji) są traktowane jako **preferencja**: są próbowane jako pierwsze, ale OpenClaw może przełączyć się na inny profil przy limitach szybkości/przekroczeniach czasu. Gdy pierwotny profil znów stanie się dostępny, nowe uruchomienia mogą ponownie go preferować bez zmiany wybranego modelu ani runtime. Profile przypięte przez użytkownika pozostają zablokowane na tym profilu; jeśli zawiedzie i skonfigurowano modele rezerwowe, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.
</Note>

### Subskrypcja OpenAI Codex plus zapasowy klucz API

Dla modeli agentów OpenAI uwierzytelnianie i runtime są oddzielne. `openai/gpt-*` pozostaje na
harnessie Codex, a uwierzytelnianie może rotować między profilem subskrypcji Codex i
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
OpenClaw zapisuje dokładny czas resetu, gdy Codex go podaje, próbuje następnego
uporządkowanego profilu uwierzytelniania i utrzymuje uruchomienie wewnątrz harnessu Codex. Gdy czas resetu
minie, profil subskrypcji ponownie kwalifikuje się do użycia i następny automatyczny
wybór może do niego wrócić.

Używaj profilu przypiętego przez użytkownika tylko wtedy, gdy chcesz wymusić jedno konto/klucz dla tej
sesji. Profile przypięte przez użytkownika są celowo ścisłe i nie przeskakują po cichu
na inny profil.

## Cooldown

Gdy profil zawiedzie z powodu błędów uwierzytelniania/limitów szybkości (albo przekroczenia czasu, które wygląda jak limit szybkości), OpenClaw oznacza go jako będący w cooldown i przechodzi do następnego profilu.

<AccordionGroup>
  <Accordion title="Co trafia do koszyka limitów szybkości / przekroczeń czasu">
    Ten koszyk limitów szybkości jest szerszy niż zwykłe `429`: obejmuje również komunikaty dostawców, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` oraz okresowe limity okien użycia, takie jak `weekly/monthly limit reached`.

    Błędy formatu/nieprawidłowego żądania są zwykle terminalne, ponieważ ponowienie tego samego ładunku zakończyłoby się tak samo, więc OpenClaw je pokazuje zamiast rotować profile uwierzytelniania. Znane ścieżki naprawy i ponowienia mogą jawnie się włączyć: na przykład błędy walidacji identyfikatora wywołania narzędzia Cloud Code Assist są sanitizowane i ponawiane raz przez politykę `allowFormatRetry`. Błędy powodów zatrzymania zgodne z OpenAI, takie jak `Unhandled stop reason: error`, `stop reason: error` i `reason: error`, są klasyfikowane jako sygnały przekroczenia czasu/przełączenia awaryjnego.

    Ogólny tekst serwera może również trafić do tego koszyka przekroczeń czasu, gdy źródło pasuje do znanego wzorca przejściowego. Na przykład goły komunikat wrappera strumienia runtime modelu `An unknown error occurred` jest traktowany jako uzasadniający przełączenie awaryjne dla każdego dostawcy, ponieważ współdzielony runtime modelu emituje go, gdy strumienie dostawcy kończą się z `stopReason: "aborted"` albo `stopReason: "error"` bez konkretnych szczegółów. Ładunki JSON `api_error` z przejściowym tekstem serwera, takim jak `internal server error`, `unknown error, 520`, `upstream error` albo `backend error`, także są traktowane jako przekroczenia czasu uzasadniające przełączenie awaryjne.

    Ogólny tekst upstream specyficzny dla OpenRouter, taki jak gołe `Provider returned error`, jest traktowany jako przekroczenie czasu tylko wtedy, gdy kontekstem dostawcy rzeczywiście jest OpenRouter. Ogólny wewnętrzny tekst awaryjny, taki jak `LLM request failed with an unknown error.`, pozostaje konserwatywny i sam nie wyzwala przełączenia awaryjnego.

  </Accordion>
  <Accordion title="Limity retry-after SDK">
    Niektóre SDK dostawców mogą w przeciwnym razie czekać przez długie okno `Retry-After`, zanim zwrócą sterowanie do OpenClaw. W przypadku SDK opartych na Stainless, takich jak Anthropic i OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60 sekund i natychmiast ujawnia dłuższe odpowiedzi kwalifikujące się do ponowienia, aby ta ścieżka przełączenia awaryjnego mogła się wykonać. Dostosuj lub wyłącz limit za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [Zachowanie ponowień](/pl/concepts/retry).
  </Accordion>
  <Accordion title="Okresy wyciszenia ograniczone do modelu">
    Okresy wyciszenia limitów szybkości mogą być też ograniczone do modelu:

    - OpenClaw zapisuje `cooldownModel` dla awarii limitu szybkości, gdy znany jest identyfikator modelu, który zawiódł.
    - Model pokrewny u tego samego dostawcy nadal może zostać wypróbowany, gdy okres wyciszenia dotyczy innego modelu.
    - Okna rozliczeń/wyłączenia nadal blokują cały profil we wszystkich modelach.

  </Accordion>
</AccordionGroup>

Okresy wyciszenia używają wykładniczego backoffu:

- 1 minuta
- 5 minut
- 25 minut
- 1 godzina (limit)

Stan jest przechowywany w stanie uwierzytelniania SQLite danego agenta pod `usageStats`:

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

## Wyłączenia z powodu rozliczeń

Awarie rozliczeń/kredytów (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do przełączenia awaryjnego, ale zwykle nie są przejściowe. Zamiast krótkiego okresu wyciszenia OpenClaw oznacza profil jako **wyłączony** (z dłuższym backoffem) i przełącza się na następny profil/dostawcę.

<Note>
Nie każda odpowiedź przypominająca rozliczenia ma kod `402` i nie każdy HTTP `402` trafia tutaj. OpenClaw utrzymuje jawny tekst rozliczeniowy w ścieżce rozliczeń nawet wtedy, gdy dostawca zwraca zamiast tego `401` lub `403`, ale dopasowania specyficzne dla dostawcy pozostają ograniczone do dostawcy, który je posiada (na przykład OpenRouter `403 Key limit exceeded`).

Tymczasem tymczasowe błędy `402` związane z oknem użycia oraz limitami wydatków organizacji/przestrzeni roboczej są klasyfikowane jako `rate_limit`, gdy komunikat wygląda na możliwy do ponowienia (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` lub `organization spending limit exceeded`). Pozostają one na krótkiej ścieżce okresu wyciszenia/przełączenia awaryjnego zamiast na długiej ścieżce wyłączenia z powodu rozliczeń.
</Note>

Stan jest przechowywany w stanie uwierzytelniania SQLite danego agenta:

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
- Liczniki backoffu resetują się, jeśli profil nie miał awarii przez **24 godziny** (konfigurowalne).
- Ponowienia przeciążenia pozwalają na **1 rotację profilu tego samego dostawcy** przed awaryjnym przejściem na model zastępczy.
- Ponowienia przeciążenia domyślnie używają backoffu **0 ms**.

## Awaryjne przełączanie modeli

Jeśli wszystkie profile dostawcy zawiodą, OpenClaw przechodzi do następnego modelu w `agents.defaults.model.fallbacks`. Dotyczy to awarii uwierzytelniania, limitów szybkości i timeoutów, które wyczerpały rotację profili (inne błędy nie przesuwają przełączania awaryjnego dalej). Błędy dostawcy, które nie ujawniają wystarczająco dużo szczegółów, nadal są precyzyjnie oznaczane w stanie przełączania awaryjnego: `empty_response` oznacza, że dostawca nie zwrócił użytecznej wiadomości ani statusu, `no_error_details` oznacza, że dostawca jawnie zwrócił `Unknown error (no error details in response)`, a `unclassified` oznacza, że OpenClaw zachował surowy podgląd, ale żaden klasyfikator jeszcze go nie dopasował.

Błędy przeciążenia i limitu szybkości są obsługiwane bardziej agresywnie niż okresy wyciszenia rozliczeń. Domyślnie OpenClaw pozwala na jedno ponowienie profilu uwierzytelniania u tego samego dostawcy, a potem bez czekania przełącza się na następny skonfigurowany model zastępczy. Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do tego koszyka przeciążenia. Dostosuj to za pomocą `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` i `auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się od skonfigurowanego domyślnego modelu podstawowego, modelu podstawowego zadania Cron, modelu podstawowego agenta z jawnymi modelami zastępczymi albo automatycznie wybranego nadpisania modelu zastępczego, OpenClaw może przejść przez pasujący skonfigurowany łańcuch modeli zastępczych. Modele podstawowe agentów bez jawnych modeli zastępczych oraz jawne wybory użytkownika (na przykład `/model ollama/qwen3.5:27b`, selektor modelu, `sessions.patch` albo jednorazowe nadpisania dostawcy/modelu w CLI) są ścisłe: jeśli ten dostawca/model jest nieosiągalny albo zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłasza awarię zamiast odpowiadać z niepowiązanego modelu zastępczego.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów z aktualnie żądanego `provider/model` oraz skonfigurowanych modeli zastępczych.

<AccordionGroup>
  <Accordion title="Reguły">
    - Żądany model zawsze jest pierwszy.
    - Jawnie skonfigurowane modele zastępcze są deduplikowane, ale nie są filtrowane przez listę dozwolonych modeli. Są traktowane jako jawna intencja operatora.
    - Jeśli bieżące uruchomienie jest już na skonfigurowanym modelu zastępczym w tej samej rodzinie dostawców, OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
    - Gdy nie podano jawnego nadpisania modelu zastępczego, skonfigurowane modele zastępcze są próbowane przed skonfigurowanym modelem podstawowym, nawet jeśli żądany model używa innego dostawcy.
    - Gdy do runnera przełączania awaryjnego nie podano jawnego nadpisania modelu zastępczego, skonfigurowany model podstawowy jest dodawany na końcu, aby łańcuch mógł wrócić do normalnej wartości domyślnej po wyczerpaniu wcześniejszych kandydatów.
    - Gdy wywołujący podaje `fallbacksOverride`, runner używa dokładnie żądanego modelu plus tej listy nadpisań. Pusta lista wyłącza awaryjne przełączanie modeli i zapobiega dodaniu skonfigurowanego modelu podstawowego jako ukrytego celu ponowienia.

  </Accordion>
</AccordionGroup>

### Które błędy przesuwają przełączanie awaryjne dalej

<Tabs>
  <Tab title="Kontynuuje przy">
    - awariach uwierzytelniania
    - limitach szybkości i wyczerpaniu okresu wyciszenia
    - błędach przeciążenia/zajętości dostawcy
    - błędach przełączania awaryjnego przypominających timeout
    - wyłączeniach z powodu rozliczeń
    - `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki przełączenia awaryjnego, aby nieaktualny utrwalony model nie tworzył zewnętrznej pętli ponowień
    - innych nierozpoznanych błędach, gdy nadal pozostają kandydaci

  </Tab>
  <Tab title="Nie kontynuuje przy">
    - jawnych przerwaniach, które nie mają kształtu timeoutu/przełączenia awaryjnego
    - błędach przepełnienia kontekstu, które powinny pozostać wewnątrz logiki Compaction/ponowień (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` lub `ollama error: context length exceeded`)
    - końcowym nieznanym błędzie, gdy nie ma już kandydatów

  </Tab>
</Tabs>

### Zachowanie pomijania okresu wyciszenia a sondowania

Gdy każdy profil uwierzytelniania dostawcy jest już w okresie wyciszenia, OpenClaw nie pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję osobno dla każdego kandydata:

<AccordionGroup>
  <Accordion title="Decyzje dla kandydatów">
    - Trwałe awarie uwierzytelniania natychmiast pomijają całego dostawcę.
    - Wyłączenia z powodu rozliczeń zwykle pomijają, ale kandydat podstawowy nadal może być sondowany z ograniczeniem przepustowości, aby odzyskanie było możliwe bez ponownego uruchamiania.
    - Kandydat podstawowy może być sondowany blisko wygaśnięcia okresu wyciszenia, z ograniczeniem na dostawcę.
    - Pokrewne modele zastępcze tego samego dostawcy mogą być próbowane mimo okresu wyciszenia, gdy awaria wygląda na przejściową (`rate_limit`, `overloaded` albo nieznana). Jest to szczególnie istotne, gdy limit szybkości jest ograniczony do modelu i pokrewny model może nadal odzyskać dostęp natychmiast.
    - Sondowania przejściowego okresu wyciszenia są ograniczone do jednego na dostawcę w ramach jednego uruchomienia przełączania awaryjnego, aby pojedynczy dostawca nie blokował przełączania awaryjnego między dostawcami.

  </Accordion>
</AccordionGroup>

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji są współdzielonym stanem. Aktywny runner, polecenie `/model`, aktualizacje Compaction/sesji oraz uzgadnianie sesji na żywo odczytują lub zapisują części tego samego wpisu sesji.

Oznacza to, że ponowienia z przełączaniem awaryjnym muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu sterowane przez użytkownika oznaczają oczekujące przełączenie na żywo. Obejmuje to `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu sterowane przez system, takie jak rotacja przełączania awaryjnego, nadpisania Heartbeat lub Compaction, nigdy same nie oznaczają oczekującego przełączenia na żywo.
- Nadpisania modelu sterowane przez użytkownika są traktowane jako dokładne wybory dla polityki przełączania awaryjnego, więc nieosiągalny wybrany dostawca jest ujawniany jako awaria zamiast być maskowany przez `agents.defaults.model.fallbacks`.
- Zanim rozpocznie się ponowienie przełączania awaryjnego, runner odpowiedzi utrwala wybrane pola nadpisania modelu zastępczego we wpisie sesji.
- Automatyczne nadpisania modeli zastępczych pozostają wybrane w kolejnych turach, aby OpenClaw nie sondował znanego wadliwego modelu podstawowego przy każdej wiadomości. OpenClaw okresowo sonduje ponownie skonfigurowane źródło i czyści automatyczne nadpisanie, gdy odzyska dostęp; `/new`, `/reset` i `sessions.reset` natychmiast czyszczą nadpisania pochodzące z automatyki.
- Odpowiedzi użytkownika ogłaszają przejścia na model zastępczy i odzyskanie po wyczyszczeniu modelu zastępczego raz na zmianę stanu. Tury z utrwalonym modelem zastępczym nie powtarzają powiadomienia.
- `/status` pokazuje wybrany model oraz, gdy stan przełączania awaryjnego się różni, aktywny model zastępczy i powód.
- Uzgadnianie sesji na żywo preferuje utrwalone nadpisania sesji nad nieaktualnymi polami modelu środowiska uruchomieniowego.
- Jeśli błąd przełączenia na żywo wskazuje późniejszego kandydata w aktywnym łańcuchu przełączania awaryjnego, OpenClaw przechodzi bezpośrednio do tego wybranego modelu zamiast najpierw przechodzić przez niepowiązanych kandydatów.
- Jeśli próba przełączenia awaryjnego zawiedzie, runner wycofuje tylko pola nadpisania, które sam zapisał, i tylko jeśli nadal pasują do tego nieudanego kandydata.

Zapobiega to klasycznemu wyścigowi:

<Steps>
  <Step title="Model podstawowy zawodzi">
    Wybrany model podstawowy zawodzi.
  </Step>
  <Step title="Model zastępczy wybrany w pamięci">
    Kandydat zastępczy zostaje wybrany w pamięci.
  </Step>
  <Step title="Magazyn sesji nadal wskazuje stary model podstawowy">
    Magazyn sesji nadal odzwierciedla stary model podstawowy.
  </Step>
  <Step title="Uzgadnianie na żywo odczytuje nieaktualny stan">
    Uzgadnianie sesji na żywo odczytuje nieaktualny stan sesji.
  </Step>
  <Step title="Ponowienie wróciło do poprzedniego modelu">
    Ponowienie zostaje cofnięte do starego modelu przed rozpoczęciem próby przełączenia awaryjnego.
  </Step>
</Steps>

Utrwalone nadpisanie modelu zastępczego zamyka to okno, a wąskie wycofanie pozostawia nowsze ręczne lub środowiskowe zmiany sesji nienaruszone.

## Obserwowalność i podsumowania awarii

`runWithModelFallback(...)` zapisuje szczegóły każdej próby, które zasilają logi i komunikaty okresów wyciszenia widoczne dla użytkownika:

- próbowany dostawca/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i podobne powody przełączenia awaryjnego)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Strukturalne logi `model_fallback_decision` zawierają też płaskie pola `fallbackStep*`, gdy kandydat zawodzi, jest pomijany albo późniejszy model zastępczy się udaje. Te pola czynią próbę przejścia jawną (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), aby eksportery logów i diagnostyki mogły odtworzyć awarię modelu podstawowego nawet wtedy, gdy końcowy model zastępczy również zawiedzie.

Gdy każdy kandydat zawiedzie, OpenClaw zgłasza `FallbackSummaryError`. Zewnętrzny runner odpowiedzi może użyć tego do zbudowania bardziej konkretnego komunikatu, takiego jak „wszystkie modele są tymczasowo ograniczone limitem szybkości”, i dołączyć najbliższe wygaśnięcie okresu wyciszenia, gdy jest znane.

To podsumowanie okresu wyciszenia uwzględnia model:

- niepowiązane limity szybkości ograniczone do modelu są ignorowane dla próbowanego łańcucha dostawca/model
- jeśli pozostała blokada jest pasującym limitem szybkości ograniczonym do modelu, OpenClaw zgłasza ostatnie pasujące wygaśnięcie, które nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja Gateway](/pl/gateway/configuration), aby uzyskać:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby uzyskać szersze omówienie wyboru modeli i mechanizmów awaryjnych.
