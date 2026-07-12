---
read_when:
    - Chcesz, aby agenci OpenClaw działający w trybie Codex korzystali z Codex Computer Use
    - Wybierasz między Codex Computer Use, PeekabooBridge a bezpośrednim MCP cua-driver
    - Konfigurujesz computerUse dla dołączonego pluginu Codex
    - Rozwiązujesz problemy ze stanem lub instalacją obsługi komputera w /codex
summary: Skonfiguruj Codex Computer Use dla agentów OpenClaw działających w trybie Codex
title: Obsługa komputera w Codex
x-i18n:
    generated_at: "2026-07-12T15:18:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use to natywny dla Codex Plugin MCP do lokalnego sterowania pulpitem. OpenClaw
nie dostarcza aplikacji desktopowej, nie wykonuje samodzielnie działań na pulpicie ani nie omija
uprawnień Codex. Dołączony Plugin `codex` jedynie przygotowuje serwer aplikacji Codex:
włącza obsługę Pluginów Codex, znajduje lub instaluje skonfigurowany Plugin Computer Use,
sprawdza dostępność serwera MCP `computer-use`, a następnie pozwala
Codex obsługiwać natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Skorzystaj z tej strony, gdy OpenClaw używa już natywnego środowiska wykonawczego Codex. Informacje
o konfiguracji samego środowiska wykonawczego znajdziesz w sekcji [Środowisko wykonawcze Codex](/pl/plugins/codex-harness).

Rozwiązanie to różni się od wbudowanego w OpenClaw [narzędzia komputerowego opartego na węźle](/pl/nodes/computer-use). Użyj wbudowanego narzędzia, gdy ten sam kontrakt agenta ma sterować sparowanym komputerem Mac niezależnie od tego, czy agent działa na Gateway, czy na innym węźle. Użyj Codex Computer Use, gdy serwer aplikacji Codex ma zarządzać lokalną instalacją MCP, uprawnieniami i natywnymi wywołaniami narzędzi.

## OpenClaw.app i Peekaboo

Integracja Peekaboo w OpenClaw.app jest niezależna od Codex Computer Use.
Aplikacja macOS może udostępniać gniazdo PeekabooBridge, aby CLI `peekaboo` mogło ponownie wykorzystywać
lokalne uprawnienia aplikacji do funkcji Dostępność i Nagrywanie ekranu na potrzeby własnych
narzędzi automatyzacji Peekaboo. Ten most nie instaluje ani nie pośredniczy w działaniu Codex Computer Use,
a Codex Computer Use nie wykonuje wywołań przez gniazdo PeekabooBridge.

Użyj [mostu Peekaboo](/pl/platforms/mac/peekaboo), jeśli chcesz, aby OpenClaw.app pełniła
funkcję hosta uwzględniającego uprawnienia dla automatyzacji CLI Peekaboo. Użyj tej strony, gdy
agent OpenClaw działający w trybie Codex powinien mieć dostęp do natywnego Pluginu MCP `computer-use`
Codex przed rozpoczęciem tury.

## Aplikacja iOS

Aplikacja iOS jest niezależna od Codex Computer Use. Nie instaluje ani nie pośredniczy w działaniu
serwera MCP `computer-use` Codex i nie jest backendem sterowania pulpitem.
Zamiast tego aplikacja iOS łączy się jako węzeł OpenClaw i udostępnia funkcje mobilne
za pomocą poleceń węzła, takich jak `canvas.*`, `camera.*`, `screen.*`,
`location.*` i `talk.*`.

Użyj [iOS](/pl/platforms/ios), jeśli chcesz, aby agent sterował węzłem iPhone'a
przez Gateway. Użyj tej strony, gdy agent działający w trybie Codex powinien sterować
lokalnym pulpitem macOS za pomocą natywnego Pluginu Computer Use Codex.

## Bezpośredni MCP cua-driver

Codex Computer Use nie jest jedynym sposobem udostępnienia sterowania pulpitem. Jeśli chcesz,
aby środowiska wykonawcze zarządzane przez OpenClaw bezpośrednio wywoływały sterownik TryCua, użyj nadrzędnego
serwera `cua-driver mcp` za pośrednictwem rejestru MCP OpenClaw zamiast
przepływu rynku przeznaczonego dla Codex.

Po zainstalowaniu `cua-driver` poproś go o polecenie OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

lub zarejestruj bezpośrednio serwer stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Ta ścieżka zachowuje bez zmian udostępniany przez nadrzędny serwer zestaw narzędzi MCP, w tym schematy
sterownika i ustrukturyzowane odpowiedzi MCP. Użyj jej, gdy sterownik CUA
ma być dostępny jako zwykły serwer MCP OpenClaw. Użyj konfiguracji Codex Computer Use opisanej na
tej stronie, gdy serwer aplikacji Codex ma zarządzać instalacją Pluginu, ponownym ładowaniem MCP
oraz natywnymi wywołaniami narzędzi podczas tur w trybie Codex.

Sterownik CUA jest przeznaczony wyłącznie dla systemu macOS i nadal wymaga lokalnych uprawnień macOS,
o które prosi jego aplikacja, takich jak Dostępność i Nagrywanie ekranu. OpenClaw nie
instaluje `cua-driver`, nie przyznaje tych uprawnień ani nie omija modelu
bezpieczeństwa nadrzędnego sterownika.

## Szybka konfiguracja

Ustaw `plugins.entries.codex.config.computerUse`, gdy Computer Use musi być
dostępne podczas tur w trybie Codex przed rozpoczęciem wątku. `autoInstall: true` włącza
Computer Use i pozwala OpenClaw zainstalować je lub ponownie włączyć przed turą:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Przy tej konfiguracji OpenClaw sprawdza serwer aplikacji Codex przed każdą turą
w trybie Codex. Jeśli brakuje Computer Use, ale serwer aplikacji Codex wykrył już
rynek umożliwiający instalację, OpenClaw prosi serwer aplikacji Codex o zainstalowanie lub
ponowne włączenie Pluginu i ponowne załadowanie serwerów MCP. W systemie macOS, gdy nie jest
zarejestrowany żaden pasujący rynek, a istnieje standardowy pakiet aplikacji desktopowej, OpenClaw
próbuje również zarejestrować dołączony rynek Codex z lokalizacji
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, zachowując
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jako rozwiązanie
awaryjne dla starszych samodzielnych instalacji. Jeśli konfiguracja nadal nie może udostępnić
serwera MCP, tura kończy się niepowodzeniem przed rozpoczęciem wątku.

Po zmianie konfiguracji Computer Use użyj `/new` lub `/reset` w odpowiednim
czacie przed testowaniem, jeśli istniejący wątek Codex został już rozpoczęty.

W systemie macOS zarządzane uruchamianie Computer Use w pierwszej kolejności używa pliku binarnego aplikacji desktopowej
`/Applications/ChatGPT.app/Contents/Resources/codex`, a następnie
korzysta z `/Applications/Codex.app/Contents/Resources/codex` jako rozwiązania awaryjnego dla starszych
samodzielnych instalacji. Dotyczy to również jednorazowych poleceń sprawdzania stanu i instalacji
Computer Use, które uruchamiają własnego klienta. Dzięki temu sterowanie pulpitem pozostaje
w pakiecie aplikacji posiadającym lokalne uprawnienia macOS. Jeśli aplikacja desktopowa nie jest
zainstalowana, OpenClaw korzysta z zarządzanego pliku binarnego Codex zainstalowanego obok
Pluginu. Zwykłe zarządzane tury Codex z domyślnym izolowanym katalogiem domowym agenta preferują
najpierw ten przypięty pakiet, aby starsza aplikacja desktopowa nie mogła przesłonić obsługi
aktualnych modeli. Katalogi domowe o zakresie użytkownika nadal preferują aplikację desktopową, ponieważ mogą wczytywać natywny
stan Computer Use. Izolowany katalog domowy agenta, którego efektywna konfiguracja Codex włącza
Computer Use, również nadal preferuje aplikację desktopową. Jawna konfiguracja
`appServer.command` lub `OPENCLAW_CODEX_APP_SERVER_BIN` nadal zastępuje
ten zarządzany wybór.

OpenClaw szereguje natywne odczyty konfiguracji Codex i instalację Computer Use
w obrębie jednego działającego Gateway. Osobny proces Codex lub inny Gateway nie
jest objęty tą blokadą. Po zmianie natywnej konfiguracji Pluginu Codex poza
Gateway uruchom ponownie Gateway i rozpocznij nowy czat, zanim zaczniesz polegać na nowym
wyborze.

## Polecenia

Użyj poleceń `/codex computer-use` z dowolnego interfejsu czatu, w którym
dostępny jest zestaw poleceń Pluginu `codex`. Są to polecenia czatu/środowiska wykonawczego
OpenClaw, a nie podpolecenia CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` jest działaniem domyślnym i tylko do odczytu: nie dodaje źródeł
rynków, nie instaluje Pluginów ani nie włącza obsługi Pluginów Codex. Jeśli żadna konfiguracja nie włącza
Computer Use, `status` może zgłosić, że jest ono wyłączone, nawet po wykonaniu jednorazowego polecenia
instalacji.

`install` włącza obsługę Pluginów serwera aplikacji Codex, opcjonalnie dodaje
skonfigurowane źródło rynku, instaluje lub ponownie włącza skonfigurowany Plugin
za pośrednictwem serwera aplikacji Codex, ponownie ładuje serwery MCP i sprawdza, czy serwer MCP
udostępnia narzędzia. Ponieważ instalacja zmienia zaufane zasoby hosta,
polecenie `install` może uruchomić tylko właściciel lub klient Gateway z uprawnieniem `operator.admin`. Inni
uprawnieni nadawcy mogą nadal korzystać z polecenia `status` działającego tylko do odczytu,
również z ustawieniami zastępującymi.

Starsze wersje akceptowały jednorazowe ustawienia zastępujące tożsamość `--plugin`, `--server` i `--mcp-server`.
Zamiast tego skonfiguruj trwale `computerUse.pluginName` i
`computerUse.mcpServerName`. Gdy użyta zostanie starsza flaga tożsamości,
polecenie wskazuje dokładne ustawienie, które należy utrwalić, i powtarza
żądane działanie wraz ze wszystkimi obsługiwanymi flagami rynku w instrukcjach migracji.

## Opcje rynku

OpenClaw używa tego samego interfejsu API serwera aplikacji, który udostępnia sam Codex.
Pola rynku określają, gdzie Codex powinien znaleźć `computer-use`.

| Pole                 | Kiedy używać                                                    | Obsługa instalacji                                       |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Brak pola rynku      | Gdy serwer aplikacji Codex ma używać rynków, które już zna.     | Tak, gdy serwer aplikacji zwraca rynek lokalny.          |
| `marketplaceSource`  | Gdy masz źródło rynku Codex, które serwer aplikacji może dodać. | Tak, dla jawnego `/codex computer-use install`.          |
| `marketplacePath`    | Gdy znasz już lokalną ścieżkę pliku rynku na hoście.            | Tak, dla jawnej instalacji i automatycznej instalacji przy rozpoczęciu tury. |
| `marketplaceName`    | Gdy chcesz wybrać według nazwy jeden z już zarejestrowanych rynków. | Tak, tylko gdy wybrany rynek ma ścieżkę lokalną.       |

Nowe katalogi domowe Codex mogą potrzebować krótkiej chwili na zainicjowanie oficjalnych
rynków. Podczas instalacji OpenClaw odpytuje `plugin/list` przez maksymalnie
`marketplaceDiscoveryTimeoutMs` milisekund (domyślnie 60 sekund).

Jeśli wiele znanych rynków zawiera Computer Use, OpenClaw preferuje
`openai-bundled`, następnie `openai-curated`, a potem `local`. Niejednoznaczne
dopasowania z nieznanych rynków powodują bezpieczne przerwanie działania i prośbę o ustawienie `marketplaceName` lub
`marketplacePath`.

## Dołączony rynek macOS

Bieżące kompilacje desktopowe ChatGPT zawierają Computer Use w poniższej lokalizacji; starsze samodzielne
kompilacje desktopowe Codex używają tego samego układu w `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Gdy `computerUse.autoInstall` ma wartość true i nie zarejestrowano rynku zawierającego
`computer-use`, OpenClaw próbuje dodać pierwszy istniejący standardowy
katalog główny dołączonego rynku:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Możesz go również zarejestrować jawnie z poziomu powłoki za pomocą Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Jeśli używasz niestandardowej ścieżki aplikacji Codex, uruchom raz `/codex computer-use install
--source <marketplace-root>` albo ustaw `computerUse.marketplacePath` na
lokalną ścieżkę pliku rynku. Używaj `--marketplace-path` tylko wtedy, gdy masz
ścieżkę pliku JSON rynku, a nie katalog główny dołączonego rynku.

### Współdzielona pamięć podręczna Pluginów

Domyślne ustawienie `pluginCacheMode: "independent"` pozostawia każdy katalog domowy Codex i jego
pamięć podręczną Pluginów bez zarządzania. Ustaw `pluginCacheMode: "shared"`, aby przed uruchomieniem serwera aplikacji
skopiować dołączony Plugin Computer Use do wykrywalnej pamięci podręcznej Pluginów
aktywnego katalogu domowego Codex. Tryb współdzielony zachowuje starsze wersje w pamięci podręcznej, ponieważ
działający klienci Codex mogą nadal odwoływać się do swoich wersjonowanych katalogów Pluginów;
nieudana kopia zastępcza również zachowuje aktywną pamięć podręczną. Jawna konfiguracja
`marketplaceName` lub `marketplacePath` wyłącza to
uzgadnianie, aby OpenClaw nie zastępował tego wyboru.

## Ograniczenie zdalnego katalogu

Serwer aplikacji Codex może wyświetlać i odczytywać wpisy katalogu dostępne tylko zdalnie, ale obecnie
nie obsługuje zdalnego `plugin/install`. Oznacza to, że `marketplaceName`
może wybrać rynek dostępny tylko zdalnie do sprawdzania stanu, ale instalacje i
ponowne włączanie nadal wymagają rynku lokalnego określonego przez `marketplaceSource` lub
`marketplacePath`.

Jeśli stan wskazuje, że Plugin jest dostępny na zdalnym rynku Codex, ale
instalacja zdalna nie jest obsługiwana, uruchom instalację z lokalnym źródłem lub ścieżką:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Dokumentacja konfiguracji

| Pole                            | Wartość domyślna | Znaczenie                                                                                       |
| ------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `enabled`                       | wywnioskowana    | Wymaga funkcji Computer Use. Domyślnie ma wartość true, gdy ustawiono inne pole Computer Use.   |
| `autoInstall`                   | false            | Instaluje lub ponownie włącza z wykrytych wcześniej marketplace’ów na początku tury.            |
| `marketplaceDiscoveryTimeoutMs` | 60000            | Czas oczekiwania instalacji na wykrycie marketplace’u przez app-server Codex.                   |
| `liveTestTimeoutMs`             | 60000            | Limit czasu tymczasowego wątku sprawdzania gotowości i żądań jego czyszczenia.                  |
| `toolCallTimeoutMs`             | 60000            | Limit czasu wywołania narzędzia gotowości Computer Use `list_apps`.                             |
| `healthCheckEnabled`            | false            | Uruchamia okresowe sondy gotowości, gdy odpowiedzialny klient app-servera jest aktywny.         |
| `healthCheckIntervalMinutes`    | 60               | Częstotliwość sondowania; akceptowane wartości to 30, 60, 120 lub 240 minut.                    |
| `pluginCacheMode`               | `independent`    | Użyj `shared`, aby odświeżać pamięć podręczną katalogu domowego Codex z dołączonego Pluginu komputerowego. |
| `strictReadiness`               | false            | Zatrzymuje uruchamianie po nieudanej sondzie na żywo zamiast kontynuować z ostrzeżeniem.        |
| `autoRepair`                    | false            | Kończy nieaktualne procesy potomne MCP Computer Use z danego zakresu i raz ponawia nieudaną sondę. |
| `marketplaceSource`             | nieustawiona     | Ciąg źródła przekazywany do `marketplace/add` app-servera Codex.                                |
| `marketplacePath`               | nieustawiona     | Lokalna ścieżka do pliku marketplace’u Codex zawierającego Plugin.                              |
| `marketplaceName`               | nieustawiona     | Nazwa zarejestrowanego marketplace’u Codex do wybrania.                                         |
| `pluginName`                    | `computer-use`   | Nazwa Pluginu w marketplace Codex.                                                              |
| `mcpServerName`                 | `computer-use`   | Nazwa serwera MCP udostępnianego przez zainstalowany Plugin.                                    |

Automatyczna instalacja na początku tury celowo odrzuca skonfigurowane
wartości `marketplaceSource`. Dodanie nowego źródła jest jawną operacją
konfiguracyjną, dlatego użyj raz
`/codex computer-use install --source <marketplace-source>`, a następnie
pozwól, aby `autoInstall` obsługiwało przyszłe ponowne włączanie z wykrytych
lokalnych marketplace’ów. Automatyczna instalacja na początku tury może używać
skonfigurowanego `marketplacePath`, ponieważ jest to już lokalna ścieżka na
hoście.

Każde pole akceptuje również nadpisanie za pomocą zmiennej środowiskowej,
sprawdzanej, gdy odpowiadający klucz konfiguracji nie jest ustawiony:

| Pole                            | Zmienna środowiskowa                                           |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## Co sprawdza OpenClaw

OpenClaw wewnętrznie zgłasza stabilny powód stanu konfiguracji i formatuje
status widoczny dla użytkownika na czacie:

| Powód                        | Znaczenie                                                     | Następny krok                                         |
| ---------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` przyjęło wartość false.                 | Ustaw `enabled` lub inne pole Computer Use.           |
| `marketplace_missing`        | Brak pasującego dostępnego marketplace’u.                     | Skonfiguruj źródło, ścieżkę lub nazwę marketplace’u.  |
| `plugin_not_installed`       | Marketplace istnieje, ale Plugin nie jest zainstalowany.      | Uruchom instalację lub włącz `autoInstall`.           |
| `plugin_disabled`            | Plugin jest zainstalowany, ale wyłączony w konfiguracji Codex. | Uruchom instalację, aby ponownie go włączyć.          |
| `remote_install_unsupported` | Wybrany marketplace jest dostępny wyłącznie zdalnie.          | Użyj `marketplaceSource` lub `marketplacePath`.        |
| `mcp_missing`                | Plugin jest włączony, ale serwer MCP jest niedostępny.        | Sprawdź Computer Use Codex i uprawnienia systemu operacyjnego. |
| `ready`                      | Plugin i narzędzia MCP są dostępne.                           | Rozpocznij turę w trybie Codex.                        |
| `check_failed`               | Żądanie app-servera Codex nie powiodło się podczas sprawdzania statusu. | Sprawdź łączność z app-serverem i dzienniki. |
| `auto_install_blocked`       | Konfiguracja na początku tury wymagałaby dodania nowego źródła. | Najpierw uruchom jawną instalację.                   |

Dane wyjściowe czatu obejmują stan Pluginu, stan serwera MCP, marketplace,
narzędzia, gdy są dostępne, oraz konkretny komunikat dotyczący nieudanego
etapu konfiguracji.

## Uprawnienia systemu macOS

Computer Use działa wyłącznie w systemie macOS. Serwer MCP należący do Codex
może wymagać lokalnych uprawnień systemu operacyjnego, zanim będzie mógł
sprawdzać aplikacje lub nimi sterować. Jeśli OpenClaw informuje, że Computer
Use jest zainstalowane, ale serwer MCP jest niedostępny, najpierw sprawdź
konfigurację Computer Use po stronie Codex:

- App-server Codex działa na tym samym hoście, na którym ma odbywać się
  sterowanie pulpitem.
- Plugin Computer Use jest włączony w konfiguracji Codex.
- Serwer MCP `computer-use` jest widoczny w stanie MCP app-servera Codex.
- System macOS przyznał wymagane uprawnienia aplikacji sterującej pulpitem.
- Bieżąca sesja hosta ma dostęp do sterowanego pulpitu.

OpenClaw celowo przerywa działanie w razie niespełnienia wymagań, gdy
`computerUse.enabled` ma wartość true. Tura w trybie Codex nie powinna po
cichu kontynuować bez natywnych narzędzi pulpitu wymaganych przez
konfigurację.

## Rozwiązywanie problemów

**Status informuje, że Plugin nie jest zainstalowany.** Uruchom
`/codex computer-use install`. Jeśli marketplace nie został wykryty, przekaż
`--source` lub `--marketplace-path`.

**Status informuje, że Plugin jest zainstalowany, ale wyłączony.** Ponownie
uruchom `/codex computer-use install`. Instalacja przez app-server Codex
ponownie zapisuje konfigurację Pluginu jako włączoną.

**Status informuje, że instalacja zdalna nie jest obsługiwana.** Użyj
lokalnego źródła lub ścieżki marketplace’u. Wpisy katalogu dostępne wyłącznie
zdalnie można sprawdzać, ale nie można ich instalować za pomocą bieżącego API
app-servera.

**Status informuje, że serwer MCP jest niedostępny.** Uruchom ponownie
instalację, aby serwery MCP zostały przeładowane. Jeśli nadal jest
niedostępny, napraw aplikację Computer Use Codex, stan MCP app-servera Codex
lub uprawnienia systemu macOS.

**Przekroczono limit czasu statusu lub sondy dla `computer-use.list_apps`.**
Plugin i serwer MCP są obecne, ale lokalny most Computer Use nie odpowiedział.
Zamknij lub uruchom ponownie Computer Use Codex, w razie potrzeby uruchom
ponownie Codex Desktop, a następnie ponów próbę w nowej sesji OpenClaw. Jeśli
host wcześniej uruchamiał Computer Use za pośrednictwem starszego
zarządzanego app-servera Codex, odśwież zainstalowany Plugin z dołączonego do
aplikacji komputerowej marketplace’u (dla samodzielnych instalacji aplikacji
Codex Desktop użyj ścieżki `Codex.app`):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Narzędzie Computer Use zgłasza `Native hook relay unavailable`.**
Natywny punkt zaczepienia narzędzia Codex nie mógł połączyć się z aktywnym
przekaźnikiem OpenClaw przez lokalny most ani zapasowy Gateway. Rozpocznij
nową sesję OpenClaw za pomocą `/new` lub `/reset`. Jeśli zadziała raz, a potem
ponownie nie powiedzie się przy późniejszym wywołaniu narzędzia, `/new`
jedynie czyści bieżącą próbę; uruchom ponownie app-server Codex lub Gateway
OpenClaw, aby usunąć stare wątki i rejestracje punktów zaczepienia, a następnie
ponów próbę w nowej sesji.

**Automatyczna instalacja na początku tury odrzuca źródło.** Jest to
zamierzone. Najpierw dodaj źródło za pomocą jawnego polecenia
`/codex computer-use install --source <marketplace-source>`, a następnie
przyszła automatyczna instalacja na początku tury będzie mogła używać
wykrytego lokalnego marketplace’u.

## Powiązane

- [Środowisko uruchomieniowe Codex](/pl/plugins/codex-harness)
- [Most Peekaboo](/pl/platforms/mac/peekaboo)
- [Aplikacja iOS](/pl/platforms/ios)
