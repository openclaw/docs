---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, okresów karencji oraz zachowania mechanizmu przełączania awaryjnego modeli
    - Aktualizowanie reguł przełączania awaryjnego dla profili uwierzytelniania lub modeli
    - Jak nadpisania modelu sesji współdziałają z ponawianiem prób przy użyciu modeli zapasowych
sidebarTitle: Model failover
summary: Jak OpenClaw rotuje profile uwierzytelniania i przełącza się awaryjnie między modelami
title: Przełączanie awaryjne modelu
x-i18n:
    generated_at: "2026-07-12T14:58:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profilu uwierzytelniania** w obrębie bieżącego dostawcy.
2. **Przełączenie awaryjne modelu** na następny model w `agents.defaults.model.fallbacks`.

## Przepływ wykonania

<Steps>
  <Step title="Ustal stan sesji">
    Ustal aktywny model sesji i preferencję profilu uwierzytelniania.
  </Step>
  <Step title="Utwórz łańcuch kandydatów">
    Utwórz łańcuch kandydatów na modele na podstawie bieżącego wyboru modelu oraz zasad przełączania awaryjnego dla źródła tego wyboru. Skonfigurowane wartości domyślne, modele podstawowe zadań cron oraz automatycznie wybrane modele awaryjne mogą korzystać ze skonfigurowanych modeli awaryjnych; jawne wybory użytkownika w sesji są ścisłe.
  </Step>
  <Step title="Wypróbuj bieżącego dostawcę">
    Wypróbuj bieżącego dostawcę zgodnie z regułami rotacji i okresu karencji profili uwierzytelniania.
  </Step>
  <Step title="Przejdź dalej po błędach uzasadniających przełączenie awaryjne">
    Jeśli możliwości tego dostawcy zostaną wyczerpane z powodu błędu uzasadniającego przełączenie awaryjne, przejdź do następnego kandydata na model.
  </Step>
  <Step title="Utrwal nadpisanie awaryjne">
    Utrwal wybrane nadpisanie awaryjne przed rozpoczęciem ponownej próby, aby inne procesy odczytujące sesję widziały tego samego dostawcę i model, których moduł wykonawczy zamierza użyć. Utrwalone nadpisanie modelu jest oznaczone jako `modelOverrideSource: "auto"`.
  </Step>
  <Step title="W razie niepowodzenia wycofaj tylko niezbędne zmiany">
    Jeśli kandydat awaryjny zawiedzie, wycofaj wyłącznie pola nadpisania sesji należące do mechanizmu przełączania awaryjnego, o ile nadal odpowiadają temu kandydatowi, który zawiódł.
  </Step>
  <Step title="Zgłoś FallbackSummaryError po wyczerpaniu kandydatów">
    Jeśli wszyscy kandydaci zawiodą, zgłoś `FallbackSummaryError` ze szczegółami każdej próby oraz najbliższym terminem wygaśnięcia okresu karencji, jeśli jest znany.
  </Step>
</Steps>

Jest to celowo węższe niż „zapisz i przywróć całą sesję”. Moduł wykonawczy odpowiedzi utrwala tylko należące do niego pola wyboru modelu używane przez mechanizm przełączania awaryjnego: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Zapobiega to nadpisaniu przez nieudaną ponowną próbę awaryjną nowszych, niezwiązanych z nią zmian sesji, takich jak ręczna zmiana `/model` lub aktualizacja rotacji sesji, która nastąpiła podczas wykonywania próby.

## Zasady źródła wyboru

Źródło wyboru określa, czy użycie łańcucha awaryjnego jest dozwolone:

- **Skonfigurowana wartość domyślna**: `agents.defaults.model.primary` używa `agents.defaults.model.fallbacks`.
- **Model podstawowy agenta**: `agents.list[].model` działa ściśle, chyba że obiekt modelu tego agenta zawiera własne `fallbacks`. Użyj `fallbacks: []`, aby jawnie włączyć ścisłe zachowanie, lub niepustej listy, aby zezwolić temu agentowi na awaryjne przełączanie modeli.
- **Automatyczne nadpisanie awaryjne**: mechanizm awaryjny podczas wykonania zapisuje `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` oraz wybrany model źródłowy przed ponowieniem próby. To nadpisanie umożliwia dalsze przechodzenie po skonfigurowanym łańcuchu awaryjnym bez sprawdzania modelu podstawowego przy każdej wiadomości, ale OpenClaw sprawdza skonfigurowany model źródłowy co 5 minut (wartość nie jest konfigurowalna) i usuwa nadpisanie po przywróceniu jego działania. `/new`, `/reset` i `sessions.reset` również usuwają nadpisania pochodzące z automatycznego wyboru. Uruchomienia Heartbeat bez jawnego `heartbeat.model` usuwają bezpośrednie automatyczne nadpisania, gdy ich model źródłowy nie odpowiada już bieżącej skonfigurowanej wartości domyślnej.
- **Nadpisanie sesji przez użytkownika**: `/model`, selektor modelu, `session_status(model=...)` i `sessions.patch` zapisują `modelOverrideSource: "user"`. Jest to dokładny wybór dla sesji. Jeśli wybrany dostawca lub model zawiedzie przed wygenerowaniem odpowiedzi, OpenClaw zgłosi błąd zamiast odpowiadać przy użyciu niezwiązanego, skonfigurowanego modelu awaryjnego.
- **Starsze nadpisanie sesji**: starsze wpisy sesji mogą zawierać `modelOverride` bez `modelOverrideSource`. OpenClaw traktuje je jako nadpisania użytkownika, aby jawny starszy wybór nie został po cichu przekształcony w zachowanie awaryjne.
- **Model w ładunku Cron**: `payload.model` / `--model` zadania cron jest modelem podstawowym zadania, a nie nadpisaniem sesji przez użytkownika. Używa skonfigurowanych modeli awaryjnych, chyba że zadanie zawiera `payload.fallbacks`; `payload.fallbacks: []` wymusza ścisłe wykonanie zadania cron.

OpenClaw zapamiętuje ostatnie sprawdzenia modelu podstawowego dla każdej sesji i każdego modelu podstawowego, aby niesprawny model podstawowy nie był ponownie sprawdzany przy każdej turze. Wysyła widoczne powiadomienie, gdy sesja przechodzi na model awaryjny, oraz kolejne, gdy wraca do wybranego modelu podstawowego; powiadomienie nie jest powtarzane przy każdej turze korzystającej z utrwalonego modelu awaryjnego.

## Pamięć podręczna pomijania błędów uwierzytelniania

Domyślnie każda nowa tura zachowuje dotychczasowe działanie ponownych prób awaryjnych: OpenClaw ponownie próbuje użyć każdego skonfigurowanego kandydata awaryjnego, w tym kandydatów innych niż podstawowy, którzy niedawno zawiedli z błędem `auth` lub `auth_permanent`.

Aby włączyć pomijanie powtarzających się błędów uwierzytelniania, ustaw:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Po włączeniu tej funkcji OpenClaw zapisuje w pamięci znacznik pominięcia o zasięgu sesji dla kandydata awaryjnego innego niż podstawowy po błędzie klasy uwierzytelniania. Kluczem jest identyfikator sesji, dostawca i model. Kandydaci podstawowi nigdy nie są pomijani, dzięki czemu jawny wybór modelu przez użytkownika nadal ujawnia rzeczywisty błąd uwierzytelniania. Pamięć podręczna ma zasięg procesu i jest czyszczona po ponownym uruchomieniu Gateway.

Wartość określa TTL w milisekundach. Wartość `0` lub brak ustawienia wyłącza pamięć podręczną. Wartości dodatnie są ograniczane do przedziału od 1 sekundy do 10 minut.

## Widoczne dla użytkownika powiadomienia o przełączeniu awaryjnym

Gdy sesja przechodzi na automatycznie wybrany model awaryjny, OpenClaw wysyła powiadomienie o stanie w tym samym kanale odpowiedzi:

```text
↪️ Przełączenie awaryjne modelu: <fallback> (wybrano <primary>; <reason>)
```

Gdy późniejsze sprawdzenie zakończy się powodzeniem i sesja wróci do wybranego modelu podstawowego, OpenClaw wysyła:

```text
↪️ Wyłączono przełączenie awaryjne modelu: <primary> (poprzednio <fallback>)
```

Te powiadomienia są komunikatami operacyjnymi, a nie treścią asystenta. Są dostarczane jednokrotnie przy każdej zmianie stanu, w miarę możliwości również w turach obejmujących wyłącznie skutki uboczne, ale nie są powtarzane w turach korzystających z utrwalonego modelu awaryjnego. Dostarczanie omija zwykłe pomijanie odpowiedzi do źródła, nie zajmuje pierwszego miejsca odpowiedzi asystenta w kanałach z wątkami oraz jest wyłączone z syntezy mowy i wyodrębniania zobowiązań.

## Przechowywanie danych uwierzytelniających (klucze i OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety i stan routingu uwierzytelniania podczas wykonania znajdują się w `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfiguracje `auth.profiles` / `auth.order` zawierają **wyłącznie metadane i routing** (bez sekretów).
- Starszy plik OAuth przeznaczony wyłącznie do importu: `~/.openclaw/credentials/oauth.json` (importowany do magazynu uwierzytelniania agenta przy pierwszym użyciu).
- Starsze pliki `auth-profiles.json`, `auth-state.json` oraz pliki `auth.json` poszczególnych agentów są importowane przez `openclaw doctor --fix`.

Więcej szczegółów: [OAuth](/pl/concepts/oauth)

Typy danych uwierzytelniających:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych dostawców)
- `type: "token"` → statyczny token typu bearer, opcjonalnie wygasający; OpenClaw go nie odświeża (używany przez `aws-sdk` i inne tryby uwierzytelniania oparte na łańcuchu danych uwierzytelniających)

## Identyfikatory profili

Logowania OAuth tworzą odrębne profile, dzięki czemu może współistnieć wiele kont.

- Domyślnie: `provider:default`, gdy adres e-mail jest niedostępny.
- OAuth z adresem e-mail: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w magazynie profili uwierzytelniania `openclaw-agent.sqlite` danego agenta.

## Kolejność rotacji

Gdy dostawca ma wiele profili, OpenClaw wybiera kolejność w następujący sposób:

<Steps>
  <Step title="Jawna konfiguracja">
    `auth.order[provider]` (jeśli ustawiono).
  </Step>
  <Step title="Skonfigurowane profile">
    `auth.profiles` przefiltrowane według dostawcy.
  </Step>
  <Step title="Przechowywane profile">
    Wpisy profili uwierzytelniania dostawcy w bazie SQLite danego agenta.
  </Step>
</Steps>

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności cyklicznej:

- **Klucz podstawowy:** typ profilu (**OAuth, następnie token statyczny, a następnie klucz API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw w obrębie każdego typu).
- **Profile w okresie karencji lub wyłączone** są przenoszone na koniec i porządkowane według najbliższego terminu wygaśnięcia.

### Przywiązanie do sesji (sprzyjające pamięci podręcznej)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać aktywność pamięci podręcznych dostawcy. **Nie** wykonuje rotacji przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- nie zakończy się Compaction (licznik Compaction zostanie zwiększony)
- profil nie znajdzie się w okresie karencji lub nie zostanie wyłączony

Ręczny wybór za pomocą `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji i nie podlega automatycznej rotacji do czasu rozpoczęcia nowej sesji.

<Note>
Automatycznie przypięte profile (wybrane przez router sesji) są traktowane jako **preferencja**: są sprawdzane jako pierwsze, ale OpenClaw może przełączyć się na inny profil po przekroczeniu limitów żądań lub upływie limitu czasu. Gdy pierwotny profil ponownie stanie się dostępny, nowe uruchomienia mogą znów go preferować bez zmiany wybranego modelu ani środowiska wykonawczego. Profile przypięte przez użytkownika pozostają zablokowane na tym profilu; jeśli zawiedzie, a skonfigurowano modele awaryjne, OpenClaw przechodzi do następnego modelu zamiast zmieniać profil.
</Note>

### Subskrypcja OpenAI Codex z zapasowym kluczem API

W przypadku modeli agentowych OpenAI uwierzytelnianie i środowisko wykonawcze są odrębne. `openai/gpt-*` pozostaje w środowisku Codex, natomiast uwierzytelnianie może rotować między profilem subskrypcji Codex a zapasowym kluczem API OpenAI.

Użyj `auth.order.openai`, aby określić kolejność widoczną dla użytkownika:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Używaj `openai:*` zarówno dla profili OAuth ChatGPT/Codex, jak i profili kluczy API OpenAI. Gdy subskrypcja osiągnie limit użycia Codex, OpenClaw zapisuje dokładny czas resetowania, jeśli Codex go udostępnia, próbuje użyć następnego profilu uwierzytelniania w kolejności i utrzymuje wykonanie w środowisku Codex. Po upływie czasu resetowania profil subskrypcji ponownie kwalifikuje się do użycia, a następny automatyczny wybór może do niego wrócić.

Używaj profilu przypiętego przez użytkownika tylko wtedy, gdy chcesz wymusić użycie jednego konta lub klucza w danej sesji. Profile przypięte przez użytkownika są celowo ścisłe i nie przełączają się po cichu na inny profil.

## Okresy karencji

Gdy profil zawiedzie z powodu błędów uwierzytelniania lub limitu żądań (albo przekroczenia limitu czasu przypominającego ograniczenie liczby żądań), OpenClaw umieszcza go w okresie karencji i przechodzi do następnego profilu.

<AccordionGroup>
  <Accordion title="Co trafia do kategorii limitu żądań lub przekroczenia limitu czasu">
    Kategoria limitu żądań jest szersza niż samo `429`: obejmuje także komunikaty dostawców, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, oraz okresowe limity okna użycia, takie jak `weekly limit reached` lub `monthly limit exhausted`.

    Błędy formatu lub nieprawidłowego żądania są zazwyczaj końcowe, ponieważ ponowienie tego samego ładunku zakończyłoby się identycznym niepowodzeniem, dlatego OpenClaw je ujawnia zamiast rotować profile uwierzytelniania. Znane ścieżki naprawy i ponowienia mogą jawnie włączyć tę możliwość: na przykład błędy walidacji identyfikatora wywołania narzędzia Cloud Code Assist są oczyszczane, a próba jest ponawiana jednokrotnie zgodnie z zasadą `allowFormatRetry`. Błędy przyczyny zatrzymania zgodne z OpenAI, takie jak `Unhandled stop reason: error`, `stop reason: error` i `reason: error`, są klasyfikowane jako sygnały przekroczenia limitu czasu lub konieczności przełączenia awaryjnego.

    Ogólny tekst błędu serwera może również trafić do kategorii przekroczenia limitu czasu, gdy źródło odpowiada znanemu wzorcowi błędu przejściowego. Na przykład sam komunikat otoki strumienia środowiska wykonawczego modelu `An unknown error occurred` jest uznawany za uzasadniający przełączenie awaryjne dla każdego dostawcy, ponieważ współdzielone środowisko wykonawcze modelu emituje go, gdy strumienie dostawcy kończą się z `stopReason: "aborted"` lub `stopReason: "error"` bez szczegółowych informacji. Ładunki JSON `api_error` zawierające tekst przejściowego błędu serwera, taki jak `internal server error`, `unknown error, 520`, `upstream error` lub `backend error`, są również traktowane jako przekroczenia limitu czasu uzasadniające przełączenie awaryjne.

    Ogólny tekst błędu usługi nadrzędnej charakterystyczny dla OpenRouter, taki jak sam komunikat `Provider returned error`, jest traktowany jako przekroczenie limitu czasu tylko wtedy, gdy dostawcą w danym kontekście rzeczywiście jest OpenRouter. Ogólny wewnętrzny tekst awaryjny, taki jak `LLM request failed with an unknown error.`, jest traktowany zachowawczo i sam w sobie nie uruchamia przełączenia awaryjnego.

  </Accordion>
  <Accordion title="Limity retry-after zestawu SDK">
    Niektóre zestawy SDK dostawców mogłyby w przeciwnym razie wstrzymywać działanie przez długi okres `Retry-After`, zanim zwrócą sterowanie do OpenClaw. W przypadku zestawów SDK opartych na Stainless, takich jak Anthropic i OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwanie zestawu SDK na `retry-after-ms` / `retry-after` do 60 sekund i natychmiast zgłasza dłuższe odpowiedzi kwalifikujące się do ponowienia, aby ta ścieżka przełączania awaryjnego mogła zadziałać. Limit można dostosować lub wyłączyć za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [Zachowanie ponowień](/pl/concepts/retry).
  </Accordion>
  <Accordion title="Okresy karencji zależne od modelu">
    Okresy karencji po przekroczeniu limitu żądań mogą również dotyczyć konkretnego modelu:

    - OpenClaw zapisuje `cooldownModel` dla błędów limitu żądań, gdy znany jest identyfikator modelu, którego dotyczy błąd.
    - Nadal można wypróbować inny model tego samego dostawcy, gdy okres karencji dotyczy innego modelu.
    - Okresy związane z rozliczeniami lub wyłączeniem nadal blokują cały profil we wszystkich modelach.

  </Accordion>
</AccordionGroup>

Zwykłe okresy karencji (niezwiązane z rozliczeniami ani trwałym błędem uwierzytelniania) wydłużają się wraz z liczbą ostatnich błędów profilu:

- 1. błąd: 30 sekund
- 2. błąd: 1 minuta
- 3. i kolejne błędy: 5 minut (limit)

Liczniki są resetowane po upływie okna błędów profilu (`auth.cooldowns.failureWindowHours`, domyślnie 24).

Stan jest przechowywany w stanie uwierzytelniania SQLite danego agenta, w sekcji `usageStats`:

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

Błędy rozliczeń lub środków (na przykład „niewystarczająca liczba środków” / „zbyt niskie saldo środków”) są traktowane jako uzasadniające przełączenie awaryjne, ale zwykle nie są przejściowe. Zamiast krótkiego okresu karencji OpenClaw oznacza profil jako **wyłączony** (z dłuższym okresem oczekiwania) i przełącza się na następny profil lub kolejnego dostawcę.

<Note>
Nie każda odpowiedź wyglądająca na błąd rozliczeń ma kod `402` i nie każdy kod HTTP `402` trafia do tej kategorii. OpenClaw klasyfikuje jednoznaczny tekst dotyczący rozliczeń jako błąd rozliczeń, nawet jeśli dostawca zwraca zamiast tego kod `401` lub `403`, ale dopasowania specyficzne dla dostawcy pozostają ograniczone do dostawcy, do którego należą (na przykład `403 Key limit exceeded` w OpenRouter).

Tymczasowe błędy `402` dotyczące okna użycia oraz limitu wydatków organizacji lub obszaru roboczego są natomiast klasyfikowane jako `rate_limit`, gdy komunikat wskazuje na możliwość ponowienia (na przykład `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` lub `organization spending limit exceeded`). Pozostają one na ścieżce krótkiego okresu karencji i przełączania awaryjnego zamiast na ścieżce długiego wyłączenia z powodu rozliczeń.
</Note>

Trwałe błędy uwierzytelniania rozpoznane z wysoką pewnością (unieważnione lub dezaktywowane klucze, dezaktywowane obszary robocze) trafiają do podobnej kategorii wyłączenia, ale przywrócenie następuje znacznie szybciej niż w przypadku rozliczeń, ponieważ podczas incydentów niektórzy dostawcy przejściowo zwracają dane przypominające błędy uwierzytelniania.

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

Wartości domyślne (`auth.cooldowns.*`):

| Klucz                         | Wartość domyślna | Przeznaczenie                                                                                         |
| ----------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5                | Bazowy okres oczekiwania po błędzie rozliczeń, podwajany po każdym takim błędzie                       |
| `billingMaxHours`             | 24               | Maksymalny okres oczekiwania po błędzie rozliczeń                                                      |
| `authPermanentBackoffMinutes` | 10               | Bazowy okres oczekiwania po trwałym błędzie uwierzytelniania rozpoznanym z wysoką pewnością            |
| `authPermanentMaxMinutes`     | 60               | Maksymalna wartość tego okresu oczekiwania                                                             |
| `failureWindowHours`          | 24               | Liczniki błędów są resetowane, jeśli w tym oknie nie wystąpią żadne błędy                              |
| `overloadedProfileRotations`  | 1                | Liczba dozwolonych zmian profilu tego samego dostawcy przed użyciem modelu zapasowego przy przeciążeniu |
| `overloadedBackoffMs`         | 0                | Stałe opóźnienie przed ponowną próbą po zmianie profilu wskutek przeciążenia                           |
| `rateLimitedProfileRotations` | 1                | Liczba dozwolonych zmian profilu tego samego dostawcy przed użyciem modelu zapasowego przy limicie żądań |

Błędy przeciążenia i limitu żądań są obsługiwane bardziej agresywnie niż okresy karencji związane z rozliczeniami: domyślnie OpenClaw zezwala na jedną ponowną próbę z profilem uwierzytelniania tego samego dostawcy, a następnie bez oczekiwania przełącza się na kolejny skonfigurowany model zapasowy.

## Model zapasowy

Jeśli zawiodą wszystkie profile dostawcy, OpenClaw przechodzi do następnego modelu z `agents.defaults.model.fallbacks`. Dotyczy to błędów uwierzytelniania, limitów żądań i przekroczeń czasu, dla których wyczerpano możliwości zmiany profilu (inne błędy nie powodują przejścia do modelu zapasowego). Błędy dostawcy, które nie zawierają wystarczających szczegółów, nadal otrzymują precyzyjne etykiety w stanie przełączania awaryjnego: `empty_response` oznacza, że dostawca nie zwrócił użytecznej wiadomości ani statusu, `no_error_details` oznacza, że dostawca jawnie zwrócił `Unknown error (no error details in response)`, a `unclassified` oznacza, że OpenClaw zachował surowy podgląd, ale nie dopasował go jeszcze żaden klasyfikator.

Sygnały zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają do kategorii przeciążenia i podlegają tej samej zasadzie jednej zmiany profilu przed przełączeniem awaryjnym co limity żądań (zobacz powyższą tabelę wartości domyślnych).

Gdy uruchomienie rozpoczyna się od skonfigurowanego domyślnego modelu głównego, modelu głównego zadania Cron, modelu głównego agenta z jawnymi modelami zapasowymi lub automatycznie wybranego nadpisania modelu zapasowego, OpenClaw może przejść przez odpowiedni skonfigurowany łańcuch modeli zapasowych. Modele główne agentów bez jawnych modeli zapasowych oraz jawne wybory użytkownika (na przykład `/model ollama/qwen3.5:27b`, selektor modelu, `sessions.patch` lub jednorazowe nadpisania dostawcy lub modelu w CLI) są traktowane ściśle: jeśli dany dostawca lub model jest nieosiągalny albo ulegnie awarii przed wygenerowaniem odpowiedzi, OpenClaw zgłasza błąd zamiast odpowiadać za pomocą niepowiązanego modelu zapasowego.

### Reguły łańcucha kandydatów

OpenClaw tworzy listę kandydatów z aktualnie żądanego `provider/model` oraz skonfigurowanych modeli zapasowych.

<AccordionGroup>
  <Accordion title="Reguły">
    - Żądany model zawsze znajduje się na początku.
    - Jawnie skonfigurowane modele zapasowe są deduplikowane, ale nie są filtrowane według listy dozwolonych modeli. Są traktowane jako jawna intencja operatora.
    - Jeśli bieżące uruchomienie korzysta już ze skonfigurowanego modelu zapasowego z tej samej rodziny dostawców, OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
    - Gdy nie podano jawnego nadpisania modeli zapasowych, skonfigurowane modele zapasowe są wypróbowywane przed skonfigurowanym modelem głównym, nawet jeśli żądany model korzysta z innego dostawcy.
    - Gdy wykonawca przełączania awaryjnego nie otrzyma jawnego nadpisania modeli zapasowych, skonfigurowany model główny jest dodawany na końcu, aby po wyczerpaniu wcześniejszych kandydatów łańcuch mógł powrócić do zwykłego modelu domyślnego.
    - Gdy wywołujący podaje `fallbacksOverride`, wykonawca używa dokładnie żądanego modelu oraz tej listy nadpisań. Pusta lista wyłącza przełączanie na model zapasowy i zapobiega dodaniu skonfigurowanego modelu głównego jako ukrytego celu ponownej próby.

  </Accordion>
</AccordionGroup>

### Błędy powodujące przejście do modelu zapasowego

<Tabs>
  <Tab title="Kontynuacja w przypadku">
    - błędów uwierzytelniania
    - limitów żądań i wyczerpania okresów karencji
    - błędów przeciążenia lub zajętości dostawcy
    - błędów przełączania awaryjnego związanych z przekroczeniem czasu
    - wyłączeń z powodu rozliczeń
    - `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki przełączania awaryjnego, aby nieaktualny utrwalony model nie powodował zewnętrznej pętli ponowień
    - innych nierozpoznanych błędów, jeśli nadal pozostają kandydaci

  </Tab>
  <Tab title="Brak kontynuacji w przypadku">
    - jawnego przerwania, które nie ma charakteru przekroczenia czasu ani przełączania awaryjnego
    - błędów przepełnienia kontekstu, które powinny pozostać w logice Compaction i ponowień (na przykład `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` lub `ollama error: context length exceeded`)
    - końcowego nieznanego błędu, gdy nie pozostał żaden kandydat
    - odmów bezpieczeństwa Claude Fable 5; bezpośrednie żądania z kluczem API obsługują je na poziomie dostawcy za pomocą obsługiwanego po stronie serwera Anthropic przełączenia awaryjnego na `claude-opus-4-8` (zobacz [Anthropic](/pl/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Pomijanie okresu karencji a zachowanie sondowania

Gdy wszystkie profile uwierzytelniania dostawcy są już objęte okresem karencji, OpenClaw nie pomija automatycznie tego dostawcy na zawsze. Podejmuje decyzję osobno dla każdego kandydata:

<AccordionGroup>
  <Accordion title="Decyzje dla poszczególnych kandydatów">
    - Trwałe błędy uwierzytelniania powodują natychmiastowe pominięcie całego dostawcy.
    - Wyłączenia z powodu rozliczeń zwykle powodują pominięcie, ale główny kandydat może być nadal okresowo sondowany, aby odzyskanie działania było możliwe bez ponownego uruchamiania.
    - Główny kandydat może być sondowany pod koniec okresu karencji, z ograniczeniem częstotliwości osobnym dla każdego dostawcy.
    - Inne modele zapasowe tego samego dostawcy mogą zostać wypróbowane mimo okresu karencji, gdy błąd wygląda na przejściowy (`rate_limit`, `overloaded` lub nieznany). Jest to szczególnie istotne, gdy limit żądań dotyczy konkretnego modelu i inny model może natychmiast odzyskać działanie.
    - Przejściowe sondowania podczas okresu karencji są ograniczone do jednego na dostawcę w ramach każdego uruchomienia przełączania awaryjnego, aby pojedynczy dostawca nie opóźniał przełączania między dostawcami.

  </Accordion>
</AccordionGroup>

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji stanowią współdzielony stan. Aktywny wykonawca, polecenie `/model`, aktualizacje Compaction lub sesji oraz uzgadnianie sesji na żywo odczytują lub zapisują części tego samego wpisu sesji.

Oznacza to, że ponowne próby przełączenia awaryjnego muszą być skoordynowane z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu zainicjowane przez użytkownika oznaczają oczekujące przełączenie na żywo. Obejmuje to `/model`, `session_status(model=...)` i `sessions.patch`.
- Zmiany modelu inicjowane przez system, takie jak rotacja modeli zapasowych, nadpisania Heartbeat lub Compaction, nigdy same nie oznaczają oczekującego przełączenia na żywo.
- Nadpisania modelu zainicjowane przez użytkownika są traktowane jako dokładne wybory na potrzeby zasad przełączania awaryjnego, dlatego nieosiągalny wybrany dostawca powoduje zgłoszenie błędu zamiast jego ukrycia przez `agents.defaults.model.fallbacks`.
- Przed rozpoczęciem ponownej próby przełączenia awaryjnego wykonawca odpowiedzi utrwala pola nadpisania wybranego modelu zapasowego we wpisie sesji.
- Automatyczne nadpisania modelu zapasowego pozostają wybrane w kolejnych turach, dzięki czemu OpenClaw nie sonduje znanego jako niesprawny modelu głównego przy każdej wiadomości. OpenClaw okresowo ponownie sonduje skonfigurowany model pierwotny i usuwa automatyczne nadpisanie po odzyskaniu przez niego działania; `/new`, `/reset` i `sessions.reset` natychmiast usuwają nadpisania pochodzące z automatycznego wyboru.
- Odpowiedzi dla użytkownika informują o przejściu na model zapasowy i przywróceniu działania po usunięciu tego przełączenia raz na każdą zmianę stanu. Kolejne tury korzystające z zachowanego modelu zapasowego nie powtarzają tego powiadomienia.
- `/status` pokazuje wybrany model, a gdy stan przełączania awaryjnego jest inny — również aktywny model zapasowy i przyczynę.
- Uzgadnianie sesji na żywo preferuje utrwalone nadpisania sesji względem nieaktualnych pól modelu środowiska wykonawczego.
- Jeśli błąd przełączenia na żywo wskazuje późniejszego kandydata w aktywnym łańcuchu modeli zapasowych, OpenClaw przechodzi bezpośrednio do tego wybranego modelu zamiast najpierw sprawdzać niepowiązanych kandydatów.
- Jeśli próba użycia modelu zapasowego zakończy się niepowodzeniem, wykonawca wycofuje tylko zapisane przez siebie pola nadpisania i tylko wtedy, gdy nadal odpowiadają temu kandydatowi, który uległ awarii.

Zapobiega to klasycznemu wyścigowi:

<Steps>
  <Step title="Model główny ulega awarii">
    Wybrany model główny ulega awarii.
  </Step>
  <Step title="Model zapasowy wybrany w pamięci">
    Kandydat na model zapasowy zostaje wybrany w pamięci.
  </Step>
  <Step title="Magazyn sesji nadal wskazuje stary model główny">
    Magazyn sesji nadal odzwierciedla stary model główny.
  </Step>
  <Step title="Uzgadnianie na żywo odczytuje nieaktualny stan">
    Uzgadnianie sesji na żywo odczytuje nieaktualny stan sesji.
  </Step>
  <Step title="Ponowna próba wraca do poprzedniego modelu">
    Ponowna próba zostaje cofnięta do starego modelu przed rozpoczęciem próby użycia modelu zapasowego.
  </Step>
</Steps>

Utrwalone nadpisanie modelu zapasowego zamyka to okno, a wąski zakres wycofania zachowuje nowsze ręczne lub wykonawcze zmiany sesji.

## Obserwowalność i podsumowania błędów

`runWithModelFallback(...)` zapisuje szczegóły każdej próby, które są wykorzystywane w dziennikach i komunikatach dla użytkownika dotyczących okresu karencji:

- podjęta próba użycia dostawcy/modelu
- przyczyna (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i podobne przyczyny przełączenia awaryjnego)
- opcjonalny stan/kod
- czytelne dla człowieka podsumowanie błędu

Ustrukturyzowane dzienniki `model_fallback_decision` zawierają również płaskie pola `fallbackStep*`, gdy kandydat zawiedzie, zostanie pominięty lub późniejsze przełączenie awaryjne zakończy się powodzeniem. Pola te jednoznacznie opisują podjętą próbę przejścia (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), dzięki czemu eksportery dzienników i danych diagnostycznych mogą odtworzyć pierwotną awarię, nawet gdy końcowe przełączenie awaryjne również zawiedzie.

Gdy wszyscy kandydaci zawiodą, OpenClaw zgłasza `FallbackSummaryError`. Zewnętrzny mechanizm obsługi odpowiedzi może użyć tego błędu do utworzenia bardziej szczegółowego komunikatu, na przykład „wszystkie modele są tymczasowo objęte limitami szybkości”, i podać najbliższy termin wygaśnięcia okresu karencji, jeśli jest znany.

To podsumowanie okresów karencji uwzględnia modele:

- niepowiązane limity szybkości dotyczące konkretnych modeli są ignorowane w przypadku rozpatrywanego łańcucha dostawców/modeli
- jeśli pozostałą blokadą jest pasujący limit szybkości dotyczący konkretnego modelu, OpenClaw podaje ostatni pasujący termin wygaśnięcia, który nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [konfigurację Gateway](/pl/gateway/configuration), aby uzyskać informacje o:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routingu `agents.defaults.imageModel`

Szersze omówienie wyboru modeli i przełączania awaryjnego znajdziesz w sekcji [Modele](/pl/concepts/models).
