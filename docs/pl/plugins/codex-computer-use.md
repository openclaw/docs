---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali Codex Computer Use
    - Decydujesz między Codex Computer Use, PeekabooBridge i bezpośrednim cua-driver MCP
    - Decydujesz między Codex Computer Use a bezpośrednią konfiguracją MCP cua-driver
    - Konfigurujesz computerUse dla dołączonego Pluginu Codex
    - Rozwiązujesz problemy ze statusem lub instalacją /codex computer-use
summary: Skonfiguruj Codex Computer Use dla agentów OpenClaw w trybie Codex
title: Korzystanie z komputera przez Codex
x-i18n:
    generated_at: "2026-04-30T10:06:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use to natywny dla Codex Plugin MCP do lokalnego sterowania pulpitem. OpenClaw
nie dostarcza aplikacji desktopowej, nie wykonuje samodzielnie działań na pulpicie ani nie omija
uprawnień Codex. Dołączony Plugin `codex` tylko przygotowuje Codex app-server:
włącza obsługę Pluginów Codex, znajduje lub instaluje skonfigurowany Plugin Codex
Computer Use, sprawdza, czy serwer MCP `computer-use` jest dostępny, a następnie
pozwala Codex obsługiwać natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Użyj tej strony, gdy OpenClaw korzysta już z natywnego harnessu Codex. Informacje o samej
konfiguracji środowiska uruchomieniowego znajdziesz w [harness Codex](/pl/plugins/codex-harness).

## OpenClaw.app i Peekaboo

Integracja Peekaboo w OpenClaw.app jest oddzielna od Codex Computer Use. Aplikacja
macOS może hostować gniazdo PeekabooBridge, aby CLI `peekaboo` mogło ponownie użyć
lokalnych zgód aplikacji na Accessibility i Screen Recording dla własnych
narzędzi automatyzacji Peekaboo. Ten mostek nie instaluje ani nie pośredniczy w
Codex Computer Use, a Codex Computer Use nie wywołuje niczego przez gniazdo
PeekabooBridge.

Użyj [mostka Peekaboo](/pl/platforms/mac/peekaboo), gdy chcesz, aby OpenClaw.app było
hostem świadomym uprawnień dla automatyzacji Peekaboo CLI. Użyj tej strony, gdy
agent OpenClaw w trybie Codex powinien mieć natywny Plugin MCP `computer-use` Codex
dostępny przed rozpoczęciem tury.

## Aplikacja iOS

Aplikacja iOS jest oddzielna od Codex Computer Use. Nie instaluje ani nie pośredniczy
w serwerze MCP `computer-use` Codex i nie jest backendem sterowania pulpitem.
Zamiast tego aplikacja iOS łączy się jako węzeł OpenClaw i udostępnia możliwości
mobilne przez polecenia węzła, takie jak `canvas.*`, `camera.*`, `screen.*`,
`location.*` i `talk.*`.

Użyj [iOS](/pl/platforms/ios), gdy chcesz, aby agent sterował węzłem iPhone przez
Gateway. Użyj tej strony, gdy agent w trybie Codex powinien sterować lokalnym
pulpitem macOS przez natywny Plugin Computer Use Codex.

## Bezpośredni MCP cua-driver

Codex Computer Use nie jest jedynym sposobem udostępnienia sterowania pulpitem. Jeśli chcesz,
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

Ta ścieżka zachowuje nienaruszoną upstreamową powierzchnię narzędzi MCP, w tym schematy sterownika
i ustrukturyzowane odpowiedzi MCP. Użyj jej, gdy chcesz, aby sterownik CUA był
dostępny jako zwykły serwer MCP OpenClaw. Użyj konfiguracji Codex Computer Use na
tej stronie, gdy Codex app-server powinien odpowiadać za instalację Pluginu, przeładowania MCP
i natywne wywołania narzędzi wewnątrz tur w trybie Codex.

Sterownik CUA jest specyficzny dla macOS i nadal wymaga lokalnych uprawnień macOS,
o które prosi jego aplikacja, takich jak Accessibility i Screen Recording. OpenClaw
nie instaluje `cua-driver`, nie przyznaje tych uprawnień ani nie omija modelu
bezpieczeństwa upstreamowego sterownika.

## Szybka konfiguracja

Ustaw `plugins.entries.codex.config.computerUse`, gdy tury w trybie Codex muszą mieć
dostępny Computer Use przed rozpoczęciem wątku:

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
        fallback: "none",
      },
    },
  },
}
```

Przy tej konfiguracji OpenClaw sprawdza Codex app-server przed każdą turą w trybie Codex.
Jeśli brakuje Computer Use, ale Codex app-server odkrył już instalowalny
marketplace, OpenClaw prosi Codex app-server o zainstalowanie lub ponowne włączenie
Pluginu i przeładowanie serwerów MCP. Na macOS, gdy nie zarejestrowano pasującego
marketplace, a standardowy pakiet aplikacji Codex istnieje, OpenClaw próbuje także
zarejestrować dołączony marketplace Codex z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` zanim
zakończy się niepowodzeniem. Jeśli konfiguracja nadal nie może udostępnić serwera MCP,
tura kończy się niepowodzeniem przed rozpoczęciem wątku.

Istniejące sesje zachowują swoje środowisko uruchomieniowe i powiązanie wątku Codex. Po zmianie
`agentRuntime` lub konfiguracji Computer Use użyj `/new` albo `/reset` w odpowiednim
czacie przed testowaniem.

## Polecenia

Używaj poleceń `/codex computer-use` z dowolnej powierzchni czatu, w której dostępna jest
powierzchnia poleceń Pluginu `codex`. To są polecenia czatu/środowiska uruchomieniowego OpenClaw,
a nie podpola CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` jest tylko do odczytu. Nie dodaje źródeł marketplace, nie instaluje Pluginów ani
nie włącza obsługi Pluginów Codex.

`install` włącza obsługę Pluginów Codex app-server, opcjonalnie dodaje skonfigurowane
źródło marketplace, instaluje lub ponownie włącza skonfigurowany Plugin przez Codex
app-server, przeładowuje serwery MCP i sprawdza, czy serwer MCP udostępnia narzędzia.

## Wybór marketplace

OpenClaw używa tego samego API app-server, które udostępnia sam Codex. Pola
marketplace wybierają, gdzie Codex powinien znaleźć `computer-use`.

| Pole                 | Użyj, gdy                                                        | Obsługa instalacji                                      |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Brak pola marketplace | Chcesz, aby Codex app-server użył marketplace, które już zna.   | Tak, gdy app-server zwraca lokalny marketplace.         |
| `marketplaceSource`  | Masz źródło marketplace Codex, które app-server może dodać.     | Tak, dla jawnego `/codex computer-use install`.         |
| `marketplacePath`    | Znasz już lokalną ścieżkę pliku marketplace na hoście.          | Tak, dla jawnej instalacji i automatycznej instalacji na początku tury. |
| `marketplaceName`    | Chcesz wybrać jeden już zarejestrowany marketplace według nazwy. | Tak tylko wtedy, gdy wybrany marketplace ma lokalną ścieżkę. |

Świeże katalogi domowe Codex mogą potrzebować krótkiej chwili, aby zainicjować oficjalne marketplace.
Podczas instalacji OpenClaw odpytuje `plugin/list` przez maksymalnie
`marketplaceDiscoveryTimeoutMs` milisekund. Domyślnie jest to 60 sekund.

Jeśli wiele znanych marketplace zawiera Computer Use, OpenClaw preferuje
`openai-bundled`, potem `openai-curated`, a następnie `local`. Nieznane, niejednoznaczne
dopasowania kończą się bezpiecznym niepowodzeniem i proszą o ustawienie `marketplaceName` lub `marketplacePath`.

## Dołączony marketplace macOS

Najnowsze kompilacje desktopowe Codex dołączają Computer Use tutaj:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Gdy `computerUse.autoInstall` ma wartość true i nie zarejestrowano marketplace zawierającego
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
lokalną ścieżkę pliku marketplace albo raz uruchom `/codex computer-use install --source
<marketplace-source>`.

## Ograniczenie zdalnego katalogu

Codex app-server może listować i odczytywać wpisy katalogu tylko zdalnego, ale obecnie nie
obsługuje zdalnego `plugin/install`. Oznacza to, że `marketplaceName` może wybrać
marketplace tylko zdalny do sprawdzania statusu, ale instalacje i ponowne włączenia
nadal wymagają lokalnego marketplace przez `marketplaceSource` lub `marketplacePath`.

Jeśli status mówi, że Plugin jest dostępny w zdalnym marketplace Codex, ale zdalna
instalacja nie jest obsługiwana, uruchom instalację z lokalnym źródłem lub ścieżką:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Informacje o konfiguracji

| Pole                            | Domyślnie       | Znaczenie                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | wywnioskowane  | Wymagaj Computer Use. Domyślnie true, gdy ustawiono inne pole Computer Use. |
| `autoInstall`                   | false          | Instaluj lub ponownie włączaj z już odkrytych marketplace na początku tury. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Jak długo instalacja czeka na odkrywanie marketplace przez Codex app-server. |
| `marketplaceSource`             | nieustawione   | Ciąg źródła przekazywany do `marketplace/add` Codex app-server. |
| `marketplacePath`               | nieustawione   | Lokalna ścieżka pliku marketplace Codex zawierającego Plugin. |
| `marketplaceName`               | nieustawione   | Nazwa zarejestrowanego marketplace Codex do wybrania. |
| `pluginName`                    | `computer-use` | Nazwa Pluginu marketplace Codex. |
| `mcpServerName`                 | `computer-use` | Nazwa serwera MCP udostępnianego przez zainstalowany Plugin. |

Automatyczna instalacja na początku tury celowo odmawia użycia skonfigurowanych wartości `marketplaceSource`.
Dodanie nowego źródła jest jawną operacją konfiguracyjną, więc użyj raz
`/codex computer-use install --source <marketplace-source>`, a potem pozwól
`autoInstall` obsługiwać przyszłe ponowne włączenia z odkrytych lokalnych marketplace.
Automatyczna instalacja na początku tury może użyć skonfigurowanego `marketplacePath`, ponieważ jest to
już lokalna ścieżka na hoście.

## Co sprawdza OpenClaw

OpenClaw raportuje wewnętrznie stabilny powód konfiguracji i formatuje widoczny dla użytkownika
status w czacie:

| Powód                        | Znaczenie                                              | Następny krok                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` rozwiązało się do false.         | Ustaw `enabled` albo inne pole Computer Use.  |
| `marketplace_missing`        | Brak dostępnego pasującego marketplace.                | Skonfiguruj źródło, ścieżkę lub nazwę marketplace. |
| `plugin_not_installed`       | Marketplace istnieje, ale Plugin nie jest zainstalowany. | Uruchom install albo włącz `autoInstall`. |
| `plugin_disabled`            | Plugin jest zainstalowany, ale wyłączony w konfiguracji Codex. | Uruchom install, aby ponownie go włączyć. |
| `remote_install_unsupported` | Wybrany marketplace jest tylko zdalny.                 | Użyj `marketplaceSource` lub `marketplacePath`. |
| `mcp_missing`                | Plugin jest włączony, ale serwer MCP jest niedostępny. | Sprawdź Codex Computer Use i uprawnienia systemu operacyjnego. |
| `ready`                      | Plugin i narzędzia MCP są dostępne.                    | Rozpocznij turę w trybie Codex.              |
| `check_failed`               | Żądanie Codex app-server nie powiodło się podczas sprawdzania statusu. | Sprawdź łączność app-server i logi. |
| `auto_install_blocked`       | Konfiguracja na początku tury wymagałaby dodania nowego źródła. | Najpierw uruchom jawną instalację. |

Wyjście czatu zawiera stan Pluginu, stan serwera MCP, marketplace, narzędzia,
gdy są dostępne, oraz konkretny komunikat dla nieudanego kroku konfiguracji.

## Uprawnienia macOS

Computer Use jest specyficzny dla macOS. Serwer MCP należący do Codex może potrzebować lokalnych
uprawnień systemu operacyjnego, zanim będzie mógł sprawdzać lub kontrolować aplikacje. Jeśli OpenClaw mówi, że Computer Use
jest zainstalowany, ale serwer MCP jest niedostępny, najpierw zweryfikuj konfigurację Computer
Use po stronie Codex:

- Codex app-server działa na tym samym hoście, na którym ma odbywać się sterowanie pulpitem.
- Plugin Computer Use jest włączony w konfiguracji Codex.
- Serwer MCP `computer-use` pojawia się w statusie MCP Codex app-server.
- macOS przyznał wymagane uprawnienia aplikacji do sterowania pulpitem.
- Bieżąca sesja hosta ma dostęp do sterowanego pulpitu.

OpenClaw celowo kończy działanie w trybie fail closed, gdy `computerUse.enabled` ma wartość true. Tura w trybie Codex nie powinna po cichu przechodzić dalej bez natywnych narzędzi pulpitu wymaganych przez konfigurację.

## Rozwiązywanie problemów

**Status mówi, że nie zainstalowano.** Uruchom `/codex computer-use install`. Jeśli marketplace nie zostanie wykryty, przekaż `--source` albo `--marketplace-path`.

**Status mówi, że zainstalowano, ale wyłączono.** Uruchom ponownie `/codex computer-use install`. Instalacja Codex app-server zapisuje konfigurację pluginu z powrotem jako włączoną.

**Status mówi, że zdalna instalacja nie jest obsługiwana.** Użyj lokalnego źródła lub ścieżki marketplace. Wpisy katalogu dostępne tylko zdalnie można przeglądać, ale nie można ich instalować przez bieżące API app-server.

**Status mówi, że serwer MCP jest niedostępny.** Uruchom instalację ponownie raz, aby serwery MCP się przeładowały. Jeśli nadal jest niedostępny, napraw aplikację Codex Computer Use, status MCP Codex app-server albo uprawnienia macOS.

**Status lub próba przekracza limit czasu na `computer-use.list_apps`.** Plugin i serwer MCP są obecne, ale lokalny most Computer Use nie odpowiedział. Zamknij lub uruchom ponownie Codex Computer Use, w razie potrzeby uruchom ponownie Codex Desktop, a potem spróbuj ponownie w nowej sesji OpenClaw.

**Narzędzie Computer Use mówi `Native hook relay unavailable`.** Natywny hook narzędzia Codex nie mógł dotrzeć do aktywnego przekaźnika OpenClaw przez lokalny most ani awaryjnie przez Gateway. Uruchom nową sesję OpenClaw za pomocą `/new` albo `/reset`. Jeśli problem nadal występuje, uruchom ponownie gateway, aby stare wątki app-server i rejestracje hooków zostały porzucone, a potem spróbuj ponownie.

**Automatyczna instalacja na początku tury odrzuca źródło.** To celowe. Najpierw dodaj źródło jawnie za pomocą `/codex computer-use install --source <marketplace-source>`, a potem przyszła automatyczna instalacja na początku tury będzie mogła użyć wykrytego lokalnego marketplace.
