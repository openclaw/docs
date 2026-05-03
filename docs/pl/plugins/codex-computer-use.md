---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali Codex Computer Use
    - Wybierasz między Codex Computer Use, PeekabooBridge i bezpośrednim cua-driver MCP
    - Wybierasz między Codex Computer Use a bezpośrednią konfiguracją MCP cua-driver
    - Konfigurujesz computerUse dla dołączonego pluginu Codex
    - Rozwiązujesz problemy ze statusem lub instalacją /codex computer-use
summary: Skonfiguruj Codex Computer Use dla agentów OpenClaw w trybie Codex
title: Korzystanie z komputera przez Codex
x-i18n:
    generated_at: "2026-05-03T09:49:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use to natywny dla Codex plugin MCP do lokalnego sterowania pulpitem. OpenClaw
nie dostarcza aplikacji desktopowej, nie wykonuje samodzielnie akcji na pulpicie ani nie obchodzi
uprawnień Codex. Dołączony plugin `codex` tylko przygotowuje Codex app-server:
włącza obsługę pluginów Codex, znajduje lub instaluje skonfigurowany plugin Codex
Computer Use, sprawdza, czy serwer MCP `computer-use` jest dostępny, a
następnie pozwala Codex obsługiwać natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Użyj tej strony, gdy OpenClaw korzysta już z natywnego środowiska Codex. Informacje o samej
konfiguracji środowiska uruchomieniowego znajdziesz w [środowisku Codex](/pl/plugins/codex-harness).

## OpenClaw.app i Peekaboo

Integracja Peekaboo w OpenClaw.app jest oddzielna od Codex Computer Use. Aplikacja
macOS może hostować gniazdo PeekabooBridge, aby CLI `peekaboo` mogło ponownie użyć
lokalnych uprawnień aplikacji do Dostępności i Nagrywania ekranu dla własnych
narzędzi automatyzacji Peekaboo. Ten most nie instaluje ani nie pośredniczy w Codex Computer Use,
a Codex Computer Use nie wywołuje niczego przez gniazdo PeekabooBridge.

Użyj [mostu Peekaboo](/pl/platforms/mac/peekaboo), gdy chcesz, aby OpenClaw.app był
hostem świadomym uprawnień dla automatyzacji Peekaboo CLI. Użyj tej strony, gdy
agent OpenClaw w trybie Codex powinien mieć natywny plugin MCP `computer-use`
Codex dostępny przed rozpoczęciem tury.

## Aplikacja iOS

Aplikacja iOS jest oddzielna od Codex Computer Use. Nie instaluje ani nie pośredniczy
w serwerze MCP `computer-use` Codex i nie jest backendem sterowania pulpitem.
Zamiast tego aplikacja iOS łączy się jako węzeł OpenClaw i udostępnia możliwości
mobilne przez polecenia węzła, takie jak `canvas.*`, `camera.*`, `screen.*`,
`location.*` i `talk.*`.

Użyj [iOS](/pl/platforms/ios), gdy chcesz, aby agent sterował węzłem iPhone przez
Gateway. Użyj tej strony, gdy agent w trybie Codex powinien sterować lokalnym
pulpitem macOS przez natywny plugin Computer Use Codex.

## Bezpośredni MCP cua-driver

Codex Computer Use nie jest jedynym sposobem udostępniania sterowania pulpitem. Jeśli chcesz,
aby środowiska uruchomieniowe zarządzane przez OpenClaw wywoływały sterownik TryCua bezpośrednio,
użyj upstreamowego serwera `cua-driver mcp` przez rejestr MCP OpenClaw zamiast
przepływu marketplace specyficznego dla Codex.

Po zainstalowaniu `cua-driver` poproś go o polecenie OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

albo samodzielnie zarejestruj serwer stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Ta ścieżka zachowuje nienaruszoną upstreamową powierzchnię narzędzi MCP, w tym schematy
sterownika i ustrukturyzowane odpowiedzi MCP. Użyj jej, gdy chcesz, aby sterownik CUA
był dostępny jako zwykły serwer MCP OpenClaw. Użyj konfiguracji Codex Computer Use
na tej stronie, gdy Codex app-server ma odpowiadać za instalację pluginu, przeładowania MCP
i natywne wywołania narzędzi wewnątrz tur w trybie Codex.

Sterownik CUA jest specyficzny dla macOS i nadal wymaga lokalnych uprawnień macOS,
o które prosi jego aplikacja, takich jak Dostępność i Nagrywanie ekranu. OpenClaw
nie instaluje `cua-driver`, nie przyznaje tych uprawnień ani nie obchodzi modelu
bezpieczeństwa upstreamowego sterownika.

## Szybka konfiguracja

Ustaw `plugins.entries.codex.config.computerUse`, gdy tury w trybie Codex muszą mieć
Computer Use dostępny przed rozpoczęciem wątku:

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
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Przy tej konfiguracji OpenClaw sprawdza Codex app-server przed każdą turą w trybie Codex.
Jeśli brakuje Computer Use, ale Codex app-server odkrył już instalowalny
marketplace, OpenClaw prosi Codex app-server o zainstalowanie lub ponowne włączenie
pluginu i przeładowanie serwerów MCP. W systemie macOS, gdy nie jest zarejestrowany
żaden pasujący marketplace, a standardowy pakiet aplikacji Codex istnieje, OpenClaw próbuje też
zarejestrować dołączony marketplace Codex z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, zanim
zakończy się niepowodzeniem. Jeśli konfiguracja nadal nie może udostępnić serwera MCP,
tura kończy się niepowodzeniem przed rozpoczęciem wątku.

Istniejące sesje zachowują swoje środowisko uruchomieniowe i powiązanie wątku Codex. Po zmianie
`agentRuntime` lub konfiguracji Computer Use użyj `/new` albo `/reset` w danym
czacie przed testowaniem.

## Polecenia

Używaj poleceń `/codex computer-use` z dowolnej powierzchni czatu, na której dostępna jest
powierzchnia poleceń pluginu `codex`. Są to polecenia czatu/środowiska uruchomieniowego OpenClaw,
a nie podpolecenia CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` jest tylko do odczytu. Nie dodaje źródeł marketplace, nie instaluje pluginów ani
nie włącza obsługi pluginów Codex.

`install` włącza obsługę pluginów Codex app-server, opcjonalnie dodaje skonfigurowane
źródło marketplace, instaluje lub ponownie włącza skonfigurowany plugin przez Codex
app-server, przeładowuje serwery MCP i sprawdza, czy serwer MCP udostępnia narzędzia.

## Wybór marketplace

OpenClaw używa tego samego API app-server, które udostępnia sam Codex. Pola
marketplace wybierają, gdzie Codex ma znaleźć `computer-use`.

| Pole                 | Użyj, gdy                                                       | Obsługa instalacji                                      |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Brak pola marketplace | Chcesz, aby Codex app-server używał marketplace, które już zna. | Tak, gdy app-server zwraca lokalny marketplace.         |
| `marketplaceSource`  | Masz źródło marketplace Codex, które app-server może dodać.     | Tak, dla jawnego `/codex computer-use install`.         |
| `marketplacePath`    | Znasz już lokalną ścieżkę pliku marketplace na hoście.          | Tak, dla jawnej instalacji i autoinstalacji przy starcie tury. |
| `marketplaceName`    | Chcesz wybrać jeden już zarejestrowany marketplace po nazwie.   | Tak tylko wtedy, gdy wybrany marketplace ma lokalną ścieżkę. |

Nowe katalogi domowe Codex mogą potrzebować krótkiej chwili na przygotowanie oficjalnych marketplace.
Podczas instalacji OpenClaw odpytuje `plugin/list` przez maksymalnie
`marketplaceDiscoveryTimeoutMs` milisekund. Wartość domyślna to 60 sekund.

Jeśli wiele znanych marketplace zawiera Computer Use, OpenClaw preferuje
`openai-bundled`, potem `openai-curated`, a potem `local`. Nieznane niejednoznaczne dopasowania
kończą się bezpiecznym niepowodzeniem i proszą o ustawienie `marketplaceName` lub `marketplacePath`.

## Dołączony marketplace macOS

Najnowsze kompilacje desktopowe Codex dołączają Computer Use tutaj:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Gdy `computerUse.autoInstall` ma wartość true i nie jest zarejestrowany żaden marketplace zawierający
`computer-use`, OpenClaw próbuje automatycznie dodać standardowy dołączony
katalog główny marketplace:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Możesz też zarejestrować go jawnie z powłoki za pomocą Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Jeśli używasz niestandardowej ścieżki aplikacji Codex, ustaw `computerUse.marketplacePath` na
lokalną ścieżkę pliku marketplace albo uruchom raz `/codex computer-use install --source
<marketplace-source>`.

## Limit zdalnego katalogu

Codex app-server może wyświetlać i odczytywać wpisy katalogu dostępne tylko zdalnie, ale obecnie nie
obsługuje zdalnego `plugin/install`. Oznacza to, że `marketplaceName` może
wybrać marketplace dostępny tylko zdalnie do sprawdzania statusu, ale instalacje i ponowne włączenia
nadal wymagają lokalnego marketplace przez `marketplaceSource` lub `marketplacePath`.

Jeśli status informuje, że plugin jest dostępny w zdalnym marketplace Codex, ale zdalna
instalacja nie jest obsługiwana, uruchom instalację z lokalnym źródłem lub ścieżką:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Dokumentacja konfiguracji

| Pole                            | Domyślnie       | Znaczenie                                                                      |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | wnioskowane     | Wymagaj Computer Use. Domyślnie true, gdy ustawione jest inne pole Computer Use. |
| `autoInstall`                   | false           | Instaluj lub ponownie włączaj z już odkrytych marketplace przy starcie tury.   |
| `marketplaceDiscoveryTimeoutMs` | 60000           | Jak długo instalacja czeka na odkrywanie marketplace przez Codex app-server.   |
| `marketplaceSource`             | nieustawione    | Ciąg źródłowy przekazywany do `marketplace/add` Codex app-server.              |
| `marketplacePath`               | nieustawione    | Lokalna ścieżka pliku marketplace Codex zawierającego plugin.                  |
| `marketplaceName`               | nieustawione    | Nazwa zarejestrowanego marketplace Codex do wybrania.                          |
| `pluginName`                    | `computer-use`  | Nazwa pluginu w marketplace Codex.                                             |
| `mcpServerName`                 | `computer-use`  | Nazwa serwera MCP udostępnianego przez zainstalowany plugin.                   |

Autoinstalacja przy starcie tury celowo odrzuca skonfigurowane wartości `marketplaceSource`.
Dodanie nowego źródła jest jawną operacją konfiguracji, więc użyj raz
`/codex computer-use install --source <marketplace-source>`, a następnie pozwól
`autoInstall` obsługiwać przyszłe ponowne włączenia z odkrytych lokalnych marketplace.
Autoinstalacja przy starcie tury może używać skonfigurowanego `marketplacePath`, ponieważ jest to
już lokalna ścieżka na hoście.

## Co sprawdza OpenClaw

OpenClaw raportuje wewnętrznie stabilny powód konfiguracji i formatuje widoczny dla użytkownika
status dla czatu:

| Powód                        | Znaczenie                                             | Następny krok                                  |
| ---------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `disabled`                   | `computerUse.enabled` zostało rozstrzygnięte jako false. | Ustaw `enabled` lub inne pole Computer Use.    |
| `marketplace_missing`        | Brak dostępnego pasującego marketplace.               | Skonfiguruj źródło, ścieżkę lub nazwę marketplace. |
| `plugin_not_installed`       | Marketplace istnieje, ale plugin nie jest zainstalowany. | Uruchom instalację lub włącz `autoInstall`.    |
| `plugin_disabled`            | Plugin jest zainstalowany, ale wyłączony w konfiguracji Codex. | Uruchom instalację, aby go ponownie włączyć.   |
| `remote_install_unsupported` | Wybrany marketplace jest tylko zdalny.                | Użyj `marketplaceSource` lub `marketplacePath`. |
| `mcp_missing`                | Plugin jest włączony, ale serwer MCP jest niedostępny. | Sprawdź Codex Computer Use i uprawnienia systemu operacyjnego. |
| `ready`                      | Plugin i narzędzia MCP są dostępne.                   | Rozpocznij turę w trybie Codex.                |
| `check_failed`               | Żądanie Codex app-server nie powiodło się podczas sprawdzania statusu. | Sprawdź łączność z app-server i logi.          |
| `auto_install_blocked`       | Konfiguracja przy starcie tury musiałaby dodać nowe źródło. | Najpierw uruchom jawną instalację.             |

Wynik czatu zawiera stan pluginu, stan serwera MCP, marketplace, narzędzia,
gdy są dostępne, oraz konkretny komunikat dla nieudanego kroku konfiguracji.

## Uprawnienia macOS

Computer Use jest specyficzny dla macOS. Serwer MCP zarządzany przez Codex może potrzebować lokalnych
uprawnień systemu operacyjnego, zanim będzie mógł sprawdzać lub sterować aplikacjami. Jeśli OpenClaw mówi,
że Computer Use jest zainstalowany, ale serwer MCP jest niedostępny, najpierw zweryfikuj konfigurację
Computer Use po stronie Codex:

- Codex app-server działa na tym samym hoście, na którym ma odbywać się
  sterowanie pulpitem.
- Plugin Computer Use jest włączony w konfiguracji Codex.
- Serwer MCP `computer-use` pojawia się w statusie MCP Codex app-server.
- macOS przyznał wymagane uprawnienia aplikacji do sterowania pulpitem.
- Bieżąca sesja hosta ma dostęp do kontrolowanego pulpitu.

OpenClaw celowo odmawia działania, gdy `computerUse.enabled` ma wartość true. Tura
w trybie Codex nie powinna po cichu kontynuować bez natywnych narzędzi pulpitu,
których wymaga konfiguracja.

## Rozwiązywanie problemów

**Status informuje, że nie zainstalowano.** Uruchom `/codex computer-use install`. Jeśli
marketplace nie zostanie wykryty, przekaż `--source` lub `--marketplace-path`.

**Status informuje, że zainstalowano, ale wyłączono.** Uruchom ponownie `/codex computer-use install`.
Instalacja Codex app-server zapisuje konfigurację Pluginu z powrotem jako włączoną.

**Status informuje, że instalacja zdalna nie jest obsługiwana.** Użyj lokalnego źródła marketplace lub
ścieżki. Wpisy katalogu dostępne tylko zdalnie można przeglądać, ale nie instalować przez
bieżące API app-server.

**Status informuje, że serwer MCP jest niedostępny.** Uruchom instalację ponownie raz, aby serwery MCP
zostały przeładowane. Jeśli nadal jest niedostępny, napraw aplikację Codex Computer Use,
status MCP Codex app-server albo uprawnienia macOS.

**Status lub sonda przekracza limit czasu na `computer-use.list_apps`.** Plugin i serwer MCP
są obecne, ale lokalny most Computer Use nie odpowiedział. Zamknij lub
uruchom ponownie Codex Computer Use, w razie potrzeby uruchom ponownie Codex Desktop, a następnie spróbuj ponownie w
nowej sesji OpenClaw.

**Narzędzie Computer Use zgłasza `Native hook relay unavailable`.** Natywny dla Codex
hook narzędziowy nie mógł dotrzeć do aktywnego przekaźnika OpenClaw przez lokalny most ani
awaryjny Gateway. Rozpocznij nową sesję OpenClaw za pomocą `/new` lub `/reset`. Jeśli problem
nadal występuje, uruchom ponownie Gateway, aby stare wątki app-server i rejestracje hooków
zostały usunięte, a następnie spróbuj ponownie.

**Automatyczna instalacja przy rozpoczęciu tury odmawia użycia źródła.** To zamierzone. Dodaj
źródło najpierw jawnie za pomocą `/codex computer-use install --source <marketplace-source>`,
a wtedy przyszła automatyczna instalacja przy rozpoczęciu tury będzie mogła użyć wykrytego lokalnego
marketplace.
