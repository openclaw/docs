---
read_when:
    - Chcesz, aby agenci OpenClaw działający w trybie Codex używali natywnych pluginów Codex
    - Migrujesz instalowane ze źródeł pluginy Codex wyselekcjonowane przez OpenAI
    - Konfigurujesz istniejący Plugin Codex w katalogu obszaru roboczego
    - Rozwiązujesz problemy z codexPlugins, inwentarzem aplikacji, działaniami destrukcyjnymi lub diagnostyką aplikacji Pluginu
summary: Skonfiguruj natywne pluginy Codex dla agentów OpenClaw działających w trybie Codex
title: Natywne pluginy Codex
x-i18n:
    generated_at: "2026-07-12T15:23:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Natywna obsługa pluginów Codex pozwala agentowi OpenClaw działającemu w trybie Codex korzystać z własnych funkcji aplikacji i pluginów serwera aplikacji Codex w ramach tego samego wątku Codex, który obsługuje turę OpenClaw. Wywołania pluginów pozostają w natywnym transkrypcie Codex; serwer aplikacji Codex odpowiada za wykonywanie MCP oparte na aplikacjach. OpenClaw nie przekształca pluginów Codex w syntetyczne narzędzia dynamiczne OpenClaw `codex_plugin_*`.

Skorzystaj z tej strony, gdy podstawowy [mechanizm Codex](/pl/plugins/codex-harness) już działa.

## Wymagania

- Środowiskiem uruchomieniowym agenta musi być natywny mechanizm Codex.
- `plugins.entries.codex.enabled` ma wartość `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` ma wartość `true`.
- Docelowy serwer aplikacji Codex ma dostęp do oczekiwanego katalogu marketplace oraz wykazu pluginów i aplikacji.
- Migracja obsługuje tylko pluginy `openai-curated`, które wykryła jako zainstalowane ze źródła w źródłowym katalogu domowym Codex.
- Ręcznie skonfigurowane pluginy `workspace-directory` wymagają serwera aplikacji Codex, którego `plugin/list` akceptuje `marketplaceKinds` i którego bezścieżkowe podsumowania przestrzeni roboczej zawierają `remotePluginId`. Plugin musi być już zainstalowany i włączony, a należące do niego aplikacje muszą być dostępne w `app/list`.

`codexPlugins` nie ma wpływu na uruchomienia z dostawcą OpenClaw, powiązania konwersacji ACP ani inne mechanizmy, ponieważ te ścieżki nigdy nie tworzą wątków serwera aplikacji Codex z natywną konfiguracją `apps`.

Konto Codex po stronie OpenAI, dostępność aplikacji oraz mechanizmy kontroli aplikacji i pluginów w przestrzeni roboczej wynikają z zalogowanego konta Codex. Informacje o modelu kont i administracji OpenAI zawiera strona [Korzystanie z Codex w ramach planu ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Szybki start

Wyświetl podgląd migracji ze źródłowego katalogu domowego Codex:

```bash
openclaw migrate codex --dry-run
```

Dodaj `--verify-plugin-apps`, aby podczas migracji wywołać źródłowe `app/list` i przed zaplanowaniem natywnej aktywacji wymagać obecności, włączenia i dostępności każdej należącej do pluginu aplikacji:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Zastosuj migrację, gdy plan wygląda prawidłowo:

```bash
openclaw migrate apply codex --yes
```

Migracja zapisuje jawne wpisy `codexPlugins` dla kwalifikujących się pluginów i wywołuje `plugin/install` serwera aplikacji Codex dla wybranych pluginów. Konfiguracja po migracji wygląda następująco:

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

Migracja pozostaje ograniczona do `openai-curated`. Aby użyć istniejącego pluginu `workspace-directory`, dodaj go ręcznie, używając dokładnego identyfikatora `summary.id` z kwalifikatorem marketplace zwróconego przez `plugin/list`. Jeśli na przykład Codex zwróci `example-plugin@workspace-directory`, skonfiguruj tę pełną wartość zamiast jego nazwy wyświetlanej:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw nie wywołuje `plugin/install` ani nie rozpoczyna uwierzytelniania pluginu `workspace-directory`. Zainstaluj i włącz go oraz uwierzytelnij w Codex przed dodaniem lub włączeniem zasad OpenClaw. OpenClaw pozostawia aplikacje ukryte, gdy odpowiedź nie zawiera dokładnego marketplace, identyfikatora pluginu, identyfikatora szczegółów lub dowodu gotowości aplikacji. Jeśli Codex odrzuci jawne żądanie `plugin/list` dla przestrzeni roboczej, OpenClaw zgłosi `marketplace_missing` dla każdego włączonego pluginu przestrzeni roboczej i pozostawi dostępne wszystkie niezależnie wykryte pluginy z wyselekcjonowanego katalogu.

Po zmianie `codexPlugins` nowe konwersacje Codex automatycznie używają zaktualizowanego zestawu aplikacji. Uruchom `/new` lub `/reset`, aby odświeżyć bieżącą konwersację. Zmiany włączenia lub wyłączenia pluginów nie wymagają ponownego uruchomienia Gateway.

## Zarządzanie pluginami z poziomu czatu

`/codex plugins` sprawdza lub zmienia skonfigurowane natywne pluginy Codex z poziomu tego samego czatu, w którym obsługujesz mechanizm Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` jest aliasem polecenia `/codex plugins list`. Lista przedstawia klucz każdego skonfigurowanego pluginu, jego stan włączenia, nazwę pluginu Codex oraz marketplace z `plugins.entries.codex.config.codexPlugins.plugins`.

Polecenia `enable`/`disable` zapisują zmiany wyłącznie w `~/.openclaw/openclaw.json`; nigdy nie modyfikują `~/.codex/config.toml` ani nie instalują nowych pluginów Codex. Może je uruchamiać wyłącznie właściciel lub klient Gateway z zakresem `operator.admin`.

Włączenie skonfigurowanego pluginu aktywuje również globalny przełącznik `codexPlugins.enabled`. Jeśli plugin z wyselekcjonowanego katalogu został zapisany jako wyłączony, ponieważ migracja zwróciła `auth_required`, przed włączeniem go w OpenClaw ponownie autoryzuj aplikację w Codex. W przypadku wpisu `workspace-directory` włączenie go w tym miejscu zmienia wyłącznie zasady OpenClaw; plugin i aplikacja muszą już być aktywne w Codex.

## Jak działa natywna konfiguracja pluginów

Integracja śledzi trzy stany:

| Stan         | Znaczenie                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Zainstalowany | Codex ma pakiet pluginu w docelowym środowisku uruchomieniowym serwera aplikacji.                                                         |
| Włączony     | Codex zgłasza plugin jako włączony, a konfiguracja OpenClaw zezwala na jego użycie w turach mechanizmu Codex.                            |
| Dostępny     | Serwer aplikacji Codex potwierdza, że wpisy aplikacji pluginu są dostępne dla aktywnego konta i odpowiadają skonfigurowanej tożsamości pluginu. |

W przypadku pluginów `openai-curated` migracja stanowi trwały etap instalacji i kwalifikacji:

- Podczas planowania OpenClaw odczytuje szczegóły ze źródłowego `plugin/read` Codex i sprawdza, czy konto źródłowego serwera aplikacji Codex jest kontem z subskrypcją ChatGPT. Odpowiedź wskazująca konto inne niż ChatGPT lub brak konta powoduje pominięcie pluginów opartych na aplikacjach z kodem `codex_subscription_required`.
- Domyślnie migracja pomija źródłowe wywołanie `app/list`: źródłowe pluginy oparte na aplikacjach, które przejdą kontrolę konta, są planowane bez weryfikacji dostępności aplikacji źródłowych, a błędy transportu podczas wyszukiwania konta powodują pominięcie z kodem `codex_account_unavailable`.
- Z opcją `--verify-plugin-apps` migracja pobiera świeży obraz źródłowego `app/list` i przed zaplanowaniem natywnej aktywacji wymaga obecności, włączenia i dostępności każdej należącej do pluginu aplikacji. Błędy transportu podczas wyszukiwania konta przechodzą wtedy do kontroli źródłowego wykazu aplikacji, zamiast powodować natychmiastowe pominięcie.

W przypadku pluginów `workspace-directory` konfiguracja odbywa się poza OpenClaw. OpenClaw wysyła zapytania do tego marketplace tylko wtedy, gdy skonfigurowano co najmniej jeden włączony wpis przestrzeni roboczej, rozpoznaje każdy plugin na podstawie dokładnego `summary.id` i ponownie wykorzystuje istniejące kontrole własności z `plugin/read` oraz gotowości z `app/list`. Plugin niezainstalowany, wyłączony, niedostępny lub nieuwierzytelniony nie udostępnia żadnych aplikacji; OpenClaw nie próbuje go instalować ani uwierzytelniać.

Wykaz aplikacji środowiska uruchomieniowego służy do sprawdzania dostępności sesji docelowej zarówno dla zmigrowanych pluginów z wyselekcjonowanego katalogu, jak i ręcznie skonfigurowanych pluginów przestrzeni roboczej. Podczas konfigurowania sesji mechanizm Codex wyznacza restrykcyjną konfigurację aplikacji wątku na podstawie włączonych i dostępnych aplikacji pluginów; nie jest ona wyznaczana ponownie przy każdej turze, dlatego `/codex plugins enable`/`disable` wpływa tylko na nowe konwersacje Codex. Aby zastosować zmianę w bieżącej konwersacji, użyj `/new` lub `/reset`.

## Zakres obsługi wersji V1

- Do migracji kwalifikują się wyłącznie pluginy `openai-curated`, które są już zainstalowane w wykazie źródłowego serwera aplikacji Codex.
- Środowisko uruchomieniowe obsługuje również jawne wpisy `workspace-directory` w kompilacjach serwera aplikacji, w których `plugin/list` implementuje `marketplaceKinds` i zwraca `remotePluginId` dla bezścieżkowych podsumowań przestrzeni roboczej. Wpisy te muszą używać dokładnego `summary.id` z kwalifikatorem marketplace oraz muszą być już zainstalowane, włączone i dostępne dla aplikacji. Odrzucone żądanie listy przestrzeni roboczej powoduje wygenerowanie istniejącej diagnostyki `marketplace_missing` dla każdego pluginu; brak dowodu marketplace, pluginu, szczegółów lub aplikacji nie udostępnia żadnej aplikacji przestrzeni roboczej. Wykaz z wyselekcjonowanego katalogu uzyskany z domyślnego żądania listy pozostaje dostępny.
- Źródłowe pluginy oparte na aplikacjach muszą przejść kontrolę subskrypcji podczas migracji. Opcja `--verify-plugin-apps` dodaje kontrolę źródłowego wykazu aplikacji. Konta niespełniające wymagań subskrypcji, a w trybie weryfikacji także niedostępne, wyłączone lub brakujące aplikacje źródłowe oraz niepowodzenia odświeżania wykazu aplikacji, są zgłaszane jako pominięte elementy wymagające ręcznej obsługi zamiast włączonych wpisów konfiguracji. Nieczytelne szczegóły pluginu są pomijane przed kontrolą wykazu aplikacji.
- Migracja zapisuje jawne tożsamości pluginów (`marketplaceName` i `pluginName`); nie zapisuje lokalnych ścieżek pamięci podręcznej `marketplacePath`.
- `codexPlugins.enabled` jest jedynym globalnym przełącznikiem włączającym; nie istnieje symbol wieloznaczny `plugins["*"]` ani klucz konfiguracji przyznający dowolne uprawnienia do instalacji.
- Marketplace inne niż wyselekcjonowane, pakiety pluginów w pamięci podręcznej, hooki i pliki konfiguracyjne Codex są zachowywane w raporcie migracji do ręcznego przeglądu, a nie automatycznie aktywowane. Środowisko uruchomieniowe akceptuje ręcznie skonfigurowane wpisy `workspace-directory`; pozostałe marketplace nie są obsługiwane.

## Wykaz aplikacji i własność

OpenClaw odczytuje wykaz aplikacji Codex przez `app/list` serwera aplikacji, przechowuje go w pamięci podręcznej przez godzinę oraz asynchronicznie odświeża nieaktualne lub brakujące wpisy. Pamięć podręczna działa lokalnie dla procesu; ponowne uruchomienie CLI lub Gateway ją usuwa, a OpenClaw odbudowuje ją przy następnym odczycie `app/list`.

Migracja i środowisko uruchomieniowe używają oddzielnych kluczy pamięci podręcznej:

- Weryfikacja migracji źródłowej używa źródłowego katalogu domowego Codex i opcji uruchamiania. Działa wyłącznie z opcją `--verify-plugin-apps` i wymusza świeże przejście źródłowego `app/list` dla danego przebiegu planowania.
- Konfiguracja docelowego środowiska uruchomieniowego używa tożsamości serwera aplikacji Codex docelowego agenta podczas tworzenia konfiguracji aplikacji wątku. Aktywacja pluginu z wyselekcjonowanego katalogu unieważnia ten docelowy klucz pamięci podręcznej, a następnie wymusza jego odświeżenie po `plugin/install`. Konfiguracja `workspace-directory` nigdy nie uruchamia tej ścieżki aktywacji.

Aplikacja pluginu jest udostępniana tylko wtedy, gdy OpenClaw może przypisać ją z powrotem do skonfigurowanego pluginu na podstawie stabilnej własności: dokładnego identyfikatora aplikacji ze szczegółów pluginu, znanej nazwy serwera MCP lub unikalnych stabilnych metadanych. Własność oparta wyłącznie na nazwie wyświetlanej lub niejednoznaczna jest wykluczana do czasu, gdy kolejne odświeżenie wykazu potwierdzi własność.

## Aplikacje połączonego konta

Agenci obsługiwani przez właściciela mogą włączyć wszystkie aplikacje już połączone z ich kontem Codex bez wymagania odpowiadającego im pakietu pluginu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` pobiera pełny obraz `app/list` podczas tworzenia nowego natywnego wątku Codex i dopuszcza wyłącznie aplikacje oznaczone jako dostępne dla danego konta. Nie instaluje, nie uwierzytelnia ani nie włącza aplikacji globalnie. Istniejące wątki zachowują utrwalony zestaw aplikacji; użyj `/new`, `/reset` lub uruchom ponownie Gateway, aby uwzględnić nowo połączone lub odwołane aplikacje.

Aplikacje konta dziedziczą globalną wartość `codexPlugins.allow_destructive_actions`, która akceptuje `true`, `false`, `"auto"` lub `"ask"`. Jawne zasady dla poszczególnych pluginów zastępują zasady globalne dla pokrywających się identyfikatorów aplikacji. Błędy wykazu powodują bezpieczną odmowę zamiast użycia nieograniczonej wartości domyślnej.

## Konfiguracja aplikacji wątku

OpenClaw wstrzykuje restrykcyjną poprawkę `config.apps` dla wątku Codex:
`_default` jest wyłączone, a włączone są tylko aplikacje należące do włączonych, skonfigurowanych pluginów lub dostępne aplikacje konta dopuszczone przez `allow_all_plugins`.

Wartość `destructive_enabled` każdej aplikacji wynika z obowiązującej globalnej lub przypisanej do pluginu polityki `allow_destructive_actions`; wartości `true`, `"auto"` i `"ask"` ustawiają `destructive_enabled: true`, natomiast `false` ustawia ją na `false`. Codex nadal egzekwuje metadane narzędzi destrukcyjnych pochodzące z natywnych adnotacji narzędzi aplikacji.
`_default` jest wyłączone z ustawieniem `open_world_enabled: false`; włączone aplikacje pluginów otrzymują `open_world_enabled: true`. OpenClaw nie udostępnia osobnego ustawienia polityki otwartego świata na poziomie pluginu ani nie utrzymuje list zabronionych nazw narzędzi destrukcyjnych dla poszczególnych pluginów.

Tryb zatwierdzania narzędzi domyślnie działa automatycznie dla dopuszczonych aplikacji, dzięki czemu niedestrukcyjne narzędzia odczytu działają bez monitu o zatwierdzenie w tym samym wątku. Narzędzia destrukcyjne pozostają kontrolowane przez politykę `destructive_enabled` każdej aplikacji.

## Polityka działań destrukcyjnych

Destrukcyjne żądania dodatkowych danych przez pluginy są domyślnie dozwolone dla skonfigurowanych pluginów Codex, natomiast niebezpieczne schematy i niejednoznaczna własność powodują bezpieczną odmowę:

- Globalne ustawienie `allow_destructive_actions` ma domyślnie wartość `true`.
- Ustawienie `allow_destructive_actions` przypisane do pluginu zastępuje politykę globalną dla tego pluginu.
- `false`: OpenClaw zwraca deterministyczną odmowę.
- `true`: OpenClaw automatycznie akceptuje tylko bezpieczne schematy, które może odwzorować na odpowiedź zatwierdzającą, na przykład logiczne pole zatwierdzenia.
- `"auto"`: OpenClaw udostępnia destrukcyjne działania pluginu systemowi Codex, a następnie przekształca żądania zatwierdzenia MCP o potwierdzonej własności w zatwierdzenia pluginu OpenClaw przed zwróceniem odpowiedzi zatwierdzającej Codex.
- `"ask"`: OpenClaw stosuje te same mechanizmy kontroli zapisu i działań destrukcyjnych Codex co w przypadku `"auto"`, usuwa trwałe nadpisania zatwierdzeń Codex dla poszczególnych narzędzi aplikacji przed rozpoczęciem wątku oraz oferuje wyłącznie jednorazowe zatwierdzenie lub odmowę, dzięki czemu trwałe zatwierdzenia nie mogą wyłączyć późniejszych monitów dotyczących działań zapisu. Dla każdej dopuszczonej aplikacji używającej `"ask"` OpenClaw wybiera dla niej recenzenta zatwierdzeń przez człowieka w Codex, aby Codex wysyłał swoje żądania zatwierdzenia do OpenClaw; inne aplikacje oraz zatwierdzenia wątku niezwiązane z aplikacjami zachowują skonfigurowanego recenzenta i politykę.
- Brak tożsamości pluginu, niejednoznaczna własność, brakujący lub niezgodny identyfikator tury albo niebezpieczny schemat żądania skutkuje odmową zamiast wyświetlenia monitu.

## Rozwiązywanie problemów

| Kod                                               | Znaczenie                                                                                                                                                 | Rozwiązanie                                                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth_required`                                   | Migracja zainstalowała plugin, ale jedna z jego aplikacji nadal wymaga uwierzytelnienia. Wpis jest zapisywany jako wyłączony do czasu ponownej autoryzacji. | Ponownie autoryzuj aplikację w Codex, a następnie włącz plugin w OpenClaw.                                                                         |
| `app_inaccessible`, `app_disabled`, `app_missing` | Przy użyciu `--verify-plugin-apps` źródłowy spis aplikacji Codex nie wykazał obecności, włączenia i dostępności wszystkich należących do pluginu aplikacji. | Ponownie autoryzuj lub włącz aplikację w Codex, a następnie ponownie uruchom migrację z opcją `--verify-plugin-apps`.                               |
| `app_inventory_unavailable`                       | Zażądano ścisłej weryfikacji aplikacji źródłowych, ale odświeżenie źródłowego spisu aplikacji Codex nie powiodło się.                                       | Napraw dostęp do źródłowego serwera aplikacji Codex lub spróbuj ponownie bez `--verify-plugin-apps`, aby zaakceptować szybszy plan oparty na koncie. |
| `codex_subscription_required`                     | Konto źródłowego serwera aplikacji Codex nie było kontem z subskrypcją ChatGPT.                                                                            | Zaloguj się w aplikacji Codex przy użyciu uwierzytelnienia subskrypcyjnego, a następnie ponownie uruchom migrację.                                  |
| `codex_account_unavailable`                       | Nie można było odczytać konta źródłowego serwera aplikacji Codex.                                                                                          | Napraw uwierzytelnianie źródłowego serwera aplikacji Codex lub uruchom ponownie z `--verify-plugin-apps`, aby spis aplikacji źródłowych określił kwalifikowalność. |
| `marketplace_missing`, `plugin_missing`           | Marketplace lub dokładnie wskazany plugin jest niedostępny; jawne żądanie katalogu przestrzeni roboczej mogło zostać odrzucone; aplikacje przestrzeni roboczej są bezpiecznie odrzucane. | Zweryfikuj zgodną umowę serwera aplikacji i dokładny identyfikator opisany poniżej.                                                                |
| `plugin_detail_unavailable`                       | OpenClaw nie mógł odczytać szczegółów własności pluginu.                                                                                                   | Sprawdź odpowiedzi `plugin/list` i `plugin/read` docelowego serwera aplikacji.                                                                     |
| `plugin_disabled`                                 | Codex zgłasza, że plugin jest zainstalowany, ale wyłączony.                                                                                                | Aktywacja wyselekcjonowanego pluginu może to naprawić; przed ponowną próbą włącz plugin przestrzeni roboczej w Codex.                               |
| `plugin_activation_failed`                        | Aktywacja pluginu nie została ukończona.                                                                                                                   | Użyj dołączonej diagnostyki, aby rozróżnić błędy Marketplace, uwierzytelniania, odświeżania lub gotowości przestrzeni roboczej.                      |
| `app_inventory_missing`, `app_inventory_stale`    | Gotowość aplikacji określono na podstawie pustej lub nieaktualnej pamięci podręcznej.                                                                       | OpenClaw automatycznie planuje asynchroniczne odświeżenie; aplikacje pluginu pozostają wykluczone do czasu poznania ich własności i gotowości.      |
| `app_ownership_ambiguous`                         | Spis aplikacji dopasował pozycję wyłącznie na podstawie nazwy wyświetlanej.                                                                                | Aplikacja pozostaje ukryta przed wątkiem Codex, dopóki późniejsze odświeżenie nie potwierdzi jej własności.                                         |

**Plugin przestrzeni roboczej jest zainstalowany, ale niewidoczny:** upewnij się, że wynik `plugin/list` dla przestrzeni roboczej zgłasza dokładnie skonfigurowany identyfikator jako zainstalowany i włączony, a następnie upewnij się, że `app/list` zgłasza każdą aplikację należącą do pluginu jako dostępną dla tego samego konta Codex. OpenClaw może włączyć dostępną aplikację dla wątku nawet wtedy, gdy spis konta zgłasza ją obecnie jako wyłączoną. Jeśli ten stan zmieniono po zapisaniu spisu aplikacji w pamięci podręcznej Gateway, poczekaj na cogodzinne odświeżenie pamięci podręcznej lub uruchom ponownie Gateway, a następnie użyj `/new` lub `/reset`. OpenClaw nie naprawia ani nie uwierzytelnia pluginów przestrzeni roboczej.
Jeśli jawne żądanie listy przestrzeni roboczej zostanie odrzucone, każdy włączony wpis przestrzeni roboczej zgłosi `marketplace_missing`; niezwiązane z nim wyselekcjonowane wpisy nadal będą przetwarzane na podstawie domyślnej odpowiedzi listy.

W przypadku `plugin_detail_unavailable` podsumowanie przestrzeni roboczej bez ścieżki musi zawierać `remotePluginId`; OpenClaw utrzymuje aplikacje należące do pluginu w ukryciu, gdy ten selektor lub wynik późniejszego wywołania `plugin/read` jest niedostępny. W przypadku `plugin_activation_failed` wyselekcjonowane pluginy mogą zgłaszać błąd Marketplace, uwierzytelniania lub odświeżania po instalacji. Plugin przestrzeni roboczej zgłasza ten kod, gdy nie jest jeszcze aktywny; zainstaluj, włącz i uwierzytelnij go poza OpenClaw.

**Konfiguracja została zmieniona, ale agent nie widzi pluginu:** uruchom `/codex plugins
list`, aby potwierdzić skonfigurowany stan, a następnie użyj `/new` lub `/reset`. Istniejące powiązania wątku Codex zachowują konfigurację aplikacji, z którą zostały uruchomione, dopóki OpenClaw nie ustanowi nowej sesji środowiska wykonawczego lub nie zastąpi nieaktualnego powiązania.

**Działanie destrukcyjne zostało odrzucone:** sprawdź globalne i przypisane do pluginu wartości `allow_destructive_actions`. Nawet przy wartości `true`, `"auto"` lub `"ask"` niebezpieczne schematy żądań i niejednoznaczna tożsamość pluginu nadal powodują bezpieczną odmowę.

## Powiązane materiały

- [Środowisko wykonawcze Codex](/pl/plugins/codex-harness)
- [Dokumentacja referencyjna środowiska wykonawczego Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe mechanizmu Codex](/pl/plugins/codex-harness-runtime)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migracji](/pl/cli/migrate)
