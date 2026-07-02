---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali natywnych Plugin Codex
    - Migrujesz kuratorowane przez OpenAI pluginy Codex zainstalowane ze źródła
    - Rozwiązujesz problemy z codexPlugins, inwentarzem aplikacji, destrukcyjnymi akcjami lub diagnostyką aplikacji Plugin
summary: Skonfiguruj zmigrowane natywne pluginy Codex dla agentów OpenClaw w trybie Codex
title: Natywne Pluginy Codex
x-i18n:
    generated_at: "2026-07-02T01:18:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Natywna obsługa pluginów Codex pozwala agentowi OpenClaw działającemu w trybie Codex używać własnych możliwości aplikacji i pluginów Codex app-server w tym samym wątku Codex, który obsługuje turę OpenClaw.

OpenClaw nie tłumaczy pluginów Codex na syntetyczne dynamiczne narzędzia OpenClaw `codex_plugin_*`. Wywołania pluginów pozostają w natywnym transkrypcie Codex, a Codex app-server odpowiada za wykonywanie MCP wspierane przez aplikację.

Użyj tej strony po uruchomieniu podstawowego [harnessu Codex](/pl/plugins/codex-harness).

## Wymagania

- Wybranym środowiskiem uruchomieniowym agenta OpenClaw musi być natywny harness Codex.
- `plugins.entries.codex.enabled` musi mieć wartość true.
- `plugins.entries.codex.config.codexPlugins.enabled` musi mieć wartość true.
- V1 obsługuje tylko pluginy `openai-curated`, które migracja zaobserwowała jako zainstalowane ze źródła w źródłowym katalogu domowym Codex.
- Docelowy Codex app-server musi widzieć oczekiwany marketplace oraz inwentarz pluginów i aplikacji.

`codexPlugins` nie wpływa na przebiegi OpenClaw, normalne przebiegi dostawcy OpenAI, powiązania rozmów ACP ani inne harnessy, ponieważ te ścieżki nie tworzą wątków Codex app-server z natywną konfiguracją `apps`.

Dostęp do Codex po stronie OpenAI, dostępność aplikacji oraz kontrolki aplikacji/pluginów w obszarze roboczym pochodzą z zalogowanego konta Codex. Model konta OpenAI i administratora opisano w artykule [Używanie Codex z planem ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Szybki start

Podejrzyj migrację ze źródłowego katalogu domowego Codex:

```bash
openclaw migrate codex --dry-run
```

Użyj ścisłej weryfikacji aplikacji źródłowej, gdy chcesz, aby migracja sprawdziła dostępność aplikacji źródłowej przed zaplanowaniem natywnej aktywacji pluginów:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Zastosuj migrację, gdy plan wygląda poprawnie:

```bash
openclaw migrate apply codex --yes
```

Migracja zapisuje jawne wpisy `codexPlugins` dla kwalifikujących się pluginów i wywołuje `plugin/install` w Codex app-server dla wybranych pluginów. Typowa zmigrowana konfiguracja wygląda tak:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Po zmianie `codexPlugins` nowe rozmowy Codex automatycznie pobierają zaktualizowany zestaw aplikacji. Użyj `/new` lub `/reset`, aby odświeżyć bieżącą rozmowę. Restart Gateway nie jest wymagany przy zmianach włączania lub wyłączania pluginów.

## Zarządzanie pluginami z czatu

Użyj `/codex plugins`, gdy chcesz sprawdzić lub zmienić skonfigurowane natywne pluginy Codex z tego samego czatu, w którym obsługujesz harness Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` jest aliasem dla `/codex plugins list`. Dane wyjściowe listy pokazują skonfigurowane klucze pluginów, stan włączenia/wyłączenia, nazwę pluginu Codex oraz marketplace z `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` i `disable` zapisują tylko konfigurację OpenClaw w `~/.openclaw/openclaw.json`; nie edytują `~/.codex/config.toml` ani nie instalują nowych pluginów Codex. Stan pluginu może zmienić tylko właściciel albo klient Gateway z zakresem `operator.admin`.

Włączenie skonfigurowanego pluginu włącza również globalny przełącznik `codexPlugins.enabled`. Jeśli plugin został zapisany jako wyłączony, ponieważ migracja zwróciła `auth_required`, ponownie autoryzuj aplikację w Codex przed włączeniem jej w OpenClaw.

## Jak działa konfiguracja natywnych pluginów

Integracja ma trzy oddzielne stany:

- Zainstalowany: Codex ma lokalny pakiet pluginu w docelowym środowisku uruchomieniowym app-server.
- Włączony: konfiguracja OpenClaw pozwala udostępnić plugin turom harnessu Codex.
- Dostępny: Codex app-server potwierdza, że wpisy aplikacji pluginu są dostępne dla aktywnego konta i można je zmapować na zmigrowaną tożsamość pluginu.

Migracja jest trwałym krokiem instalacji i kwalifikacji. Podczas planowania OpenClaw odczytuje szczegóły `plugin/read` ze źródłowego Codex i sprawdza, czy odpowiedź konta źródłowego Codex app-server dotyczy konta subskrypcji ChatGPT. Odpowiedzi kont innych niż ChatGPT albo brakujące odpowiedzi konta pomijają pluginy wspierane przez aplikację z `codex_subscription_required`. Domyślnie migracja nie wywołuje źródłowego `app/list`; pluginy źródłowe wspierane przez aplikację, które przejdą bramkę konta, są planowane bez weryfikacji dostępności aplikacji źródłowej, a awarie transportu podczas wyszukiwania konta powodują pominięcie z `codex_account_unavailable`. Z opcją `--verify-plugin-apps` migracja pobiera świeży snapshot źródłowego `app/list` i wymaga, aby każda posiadana aplikacja była obecna, włączona i dostępna przed zaplanowaniem natywnej aktywacji. W tym trybie awarie transportu podczas wyszukiwania konta przechodzą do bramki inwentarza aplikacji źródłowej. Inwentarz aplikacji środowiska uruchomieniowego jest sprawdzeniem dostępności sesji docelowej po migracji. Następnie konfiguracja sesji harnessu Codex oblicza restrykcyjną konfigurację aplikacji wątku dla włączonych i dostępnych aplikacji pluginów.

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję uprzęży Codex
albo zastępuje nieaktualne powiązanie wątku Codex. Nie jest przeliczana przy każdej turze, więc
`/codex plugins enable` i `/codex plugins disable` wpływają na nowe
konwersacje Codex. Użyj `/new` albo `/reset`, gdy bieżąca konwersacja ma
pobrać zaktualizowany zestaw aplikacji.

## Granica obsługi V1

V1 jest celowo wąski:

- Do migracji kwalifikują się tylko Pluginy `openai-curated`, które były już zainstalowane w źródłowym
  inwentarzu app-servera Codex.
- Źródłowe Pluginy oparte na aplikacjach muszą przejść bramkę subskrypcji w czasie migracji.
  `--verify-plugin-apps` dodaje bramkę źródłowego inwentarza aplikacji. Konta wymagające subskrypcji oraz,
  w trybie weryfikacji, niedostępne, wyłączone, brakujące aplikacje źródłowe
  albo błędy odświeżania źródłowego inwentarza aplikacji są zgłaszane jako pominięte elementy ręczne
  zamiast włączonych wpisów konfiguracji. Nieczytelne szczegóły Pluginu są pomijane
  przed bramką źródłowego inwentarza aplikacji.
- Migracja zapisuje jawne tożsamości Pluginów z `marketplaceName` i
  `pluginName`; nie zapisuje lokalnych ścieżek pamięci podręcznej `marketplacePath`.
- `codexPlugins.enabled` jest globalnym przełącznikiem włączenia.
- Nie ma symbolu wieloznacznego `plugins["*"]` ani klucza konfiguracji, który przyznaje dowolne
  uprawnienie instalacji.
- Nieobsługiwane marketplace'y, buforowane pakiety Pluginów, hooki i pliki konfiguracji Codex
  są zachowywane w raporcie migracji do ręcznego przeglądu.

## Inwentarz aplikacji i własność

OpenClaw odczytuje inwentarz aplikacji Codex przez `app/list` app-servera, buforuje go przez
jedną godzinę oraz odświeża nieaktualne lub brakujące wpisy asynchronicznie. Pamięć podręczna jest
wyłącznie w pamięci; ponowne uruchomienie CLI lub gatewaya ją usuwa, a OpenClaw odbudowuje ją
przy następnym odczycie `app/list`.

Migracja i środowisko uruchomieniowe używają osobnych kluczy pamięci podręcznej:

- Weryfikacja migracji źródłowej używa źródłowego katalogu domowego Codex i opcji uruchomienia źródłowego app-servera. Działa to tylko wtedy, gdy ustawiono `--verify-plugin-apps`, i
  wymusza świeże przejście przez źródłowe `app/list` dla tego przebiegu planowania.
- Konfiguracja docelowego środowiska uruchomieniowego używa tożsamości app-servera Codex docelowego agenta, gdy
  buduje konfigurację aplikacji wątku Codex. Aktywacja Pluginu unieważnia ten docelowy
  klucz pamięci podręcznej, a następnie wymusza jego odświeżenie po `plugin/install`.

Aplikacja Pluginu jest eksponowana tylko wtedy, gdy OpenClaw może zmapować ją z powrotem do zmigrowanego
Pluginu przez stabilną własność:

- dokładny identyfikator aplikacji ze szczegółów Pluginu
- znana nazwa serwera MCP
- unikatowe stabilne metadane

Własność oparta wyłącznie na nazwie wyświetlanej albo niejednoznaczna jest wykluczana, dopóki następne odświeżenie inwentarza
nie potwierdzi własności.

## Konfiguracja aplikacji wątku

OpenClaw wstrzykuje restrykcyjną łatkę `config.apps` dla wątku Codex:
`_default` jest wyłączone i włączone są tylko aplikacje należące do włączonych zmigrowanych Pluginów.

OpenClaw ustawia `destructive_enabled` na poziomie aplikacji na podstawie efektywnej globalnej albo
per-Pluginowej polityki `allow_destructive_actions` i pozwala Codex egzekwować
metadane narzędzi destrukcyjnych z jego natywnych adnotacji narzędzi aplikacji. `true`,
`"auto"` i `"ask"` ustawiają `destructive_enabled: true`; `false` ustawia ją
na false. Konfiguracja aplikacji `_default` jest wyłączona z `open_world_enabled: false`.
Włączone aplikacje Pluginów są emitowane z `open_world_enabled: true`; OpenClaw nie
udostępnia osobnego pokrętła polityki open-world dla Pluginu i nie utrzymuje
per-Pluginowych list blokowania nazw narzędzi destrukcyjnych.

Tryb zatwierdzania narzędzi jest domyślnie automatyczny dla aplikacji Pluginów, więc niedestrukcyjne
narzędzia odczytu mogą działać bez interfejsu zatwierdzania w tym samym wątku. Narzędzia destrukcyjne pozostają
kontrolowane przez politykę `destructive_enabled` każdej aplikacji.

## Polityka działań destrukcyjnych

Destrukcyjne żądania Pluginów są domyślnie dozwolone dla zmigrowanych Pluginów Codex,
podczas gdy niebezpieczne schematy i niejednoznaczna własność nadal są domyślnie odrzucane:

- Globalne `allow_destructive_actions` domyślnie ma wartość `true`.
- Per-Pluginowe `allow_destructive_actions` nadpisuje globalną politykę dla tego
  Pluginu.
- Gdy polityka ma wartość `false`, OpenClaw zwraca deterministyczną odmowę.
- Gdy polityka ma wartość `true`, OpenClaw automatycznie akceptuje tylko bezpieczne schematy, które może zmapować na
  odpowiedź zatwierdzenia, takie jak boolowskie pole akceptacji.
- Gdy polityka ma wartość `"auto"`, OpenClaw eksponuje destrukcyjne akcje Pluginu
  do Codex, ale zamienia potwierdzone własnością żądania zatwierdzenia MCP na zatwierdzenia Pluginów OpenClaw przed zwróceniem odpowiedzi zatwierdzenia Codex.
- Gdy polityka ma wartość `"ask"`, OpenClaw używa tej samej bramki zapisu/destrukcji Codex
  co `"auto"`, czyści trwałe nadpisania zatwierdzeń per-narzędzie Codex dla
  aplikacji przed startem wątku i oferuje tylko jednorazowe zatwierdzenie lub odmowę, aby
  trwałe zatwierdzenia nie mogły tłumić późniejszych monitów o akcje zapisu.
- Dla każdej dopuszczonej aplikacji, która używa `"ask"`, OpenClaw wybiera recenzenta
  zatwierdzeń ludzkich Codex dla tej aplikacji, aby Codex wysyłał swoje żądania zatwierdzenia do
  OpenClaw. Inne aplikacje i zatwierdzenia wątku niezwiązane z aplikacjami zachowują skonfigurowanego
  recenzenta i politykę.
- Brak tożsamości Pluginu, niejednoznaczna własność, brakujący identyfikator tury, błędny identyfikator tury
  albo niebezpieczny schemat żądania powodują odmowę zamiast wyświetlenia monitu.

## Rozwiązywanie problemów

**`auth_required`:** migracja zainstalowała Plugin, ale jedna z jego aplikacji nadal
wymaga uwierzytelnienia. Jawny wpis Pluginu jest zapisywany jako wyłączony, dopóki go
ponownie nie autoryzujesz i nie włączysz.

**`app_inaccessible`, `app_disabled` albo `app_missing`:**
migracja nie zainstalowała Pluginu, ponieważ źródłowy inwentarz aplikacji Codex
nie pokazał wszystkich posiadanych aplikacji jako obecnych, włączonych i dostępnych, gdy
ustawiono `--verify-plugin-apps`. Ponownie autoryzuj albo włącz aplikację w Codex, a następnie
uruchom migrację ponownie z `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migracja nie zainstalowała Pluginu, ponieważ
zażądano ścisłej weryfikacji aplikacji źródłowych, a odświeżenie źródłowego inwentarza aplikacji Codex
nie powiodło się. Napraw dostęp do źródłowego app-servera Codex albo ponów bez
`--verify-plugin-apps`, jeśli akceptujesz szybszy plan z bramką konta.

**`codex_subscription_required`:** migracja nie zainstalowała Pluginu opartego na aplikacji,
ponieważ konto źródłowego app-servera Codex nie było zalogowane jako konto
z subskrypcją ChatGPT. Zaloguj się do aplikacji Codex z uwierzytelnieniem subskrypcyjnym,
a następnie uruchom migrację ponownie.

**`codex_account_unavailable`:** migracja nie zainstalowała Pluginu opartego na aplikacji,
ponieważ nie można było odczytać konta źródłowego app-servera Codex. Napraw uwierzytelnianie źródłowego app-servera Codex albo uruchom ponownie z `--verify-plugin-apps`, jeśli chcesz, aby źródłowy inwentarz aplikacji
decydował o kwalifikowalności, gdy wyszukiwanie konta się nie powiedzie.

**`marketplace_missing` albo `plugin_missing`:** docelowy app-server Codex
nie widzi oczekiwanego marketplace'u lub Pluginu `openai-curated`. Uruchom migrację ponownie
względem docelowego środowiska uruchomieniowego albo sprawdź stan Pluginu app-servera Codex.

**`app_inventory_missing` albo `app_inventory_stale`:** gotowość aplikacji pochodziła z
pustej lub nieaktualnej pamięci podręcznej. OpenClaw planuje asynchroniczne odświeżenie i wyklucza aplikacje Pluginów, dopóki własność i gotowość nie będą znane.

**`app_ownership_ambiguous`:** inwentarz aplikacji pasował tylko po nazwie wyświetlanej, więc
aplikacja nie jest eksponowana w wątku Codex.

**Konfiguracja się zmieniła, ale agent nie widzi Pluginu:** użyj `/codex plugins
list`, aby potwierdzić skonfigurowany stan, a następnie użyj `/new` lub `/reset`. Istniejące
powiązania wątków Codex zachowują konfigurację aplikacji, z którą zostały uruchomione, dopóki OpenClaw
nie ustanowi nowej sesji harnessa lub nie zastąpi nieaktualnego powiązania.

**Destrukcyjna akcja została odrzucona:** sprawdź globalne i właściwe dla Pluginu
wartości `allow_destructive_actions`. Nawet gdy polityka ma wartość true, `"auto"` lub
`"ask"`, niebezpieczne schematy pozyskiwania informacji i niejednoznaczna tożsamość Pluginu nadal kończą się
odmową.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna harnessa Codex](/pl/plugins/codex-harness-reference)
- [Środowisko wykonawcze harnessa Codex](/pl/plugins/codex-harness-runtime)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#codex-harness-plugin-config)
- [Migracja CLI](/pl/cli/migrate)
