---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex używali Codex Computer Use
    - Decydujesz między Codex Computer Use, PeekabooBridge i bezpośrednim MCP cua-driver
    - Decydujesz między Codex Computer Use a bezpośrednią konfiguracją cua-driver MCP
    - Konfigurujesz computerUse dla dołączonego Plugin Codex
    - Rozwiązujesz problemy z /codex computer-use status lub /codex computer-use install
summary: Skonfiguruj Codex Computer Use dla agentów OpenClaw w trybie Codex
title: Korzystanie z komputera w Codex
x-i18n:
    generated_at: "2026-06-27T17:50:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use to natywna dla Codex wtyczka MCP do lokalnego sterowania pulpitem. OpenClaw
nie vendoryzuje aplikacji desktopowej, nie wykonuje samodzielnie akcji na pulpicie ani nie omija
uprawnień Codex. Dołączony Plugin `codex` tylko przygotowuje app-server Codex:
włącza obsługę wtyczek Codex, znajduje lub instaluje skonfigurowany Plugin
Codex Computer Use, sprawdza, czy serwer MCP `computer-use` jest dostępny, a
następnie pozwala Codex przejąć natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Użyj tej strony, gdy OpenClaw korzysta już z natywnego harnessu Codex. Informacje o
samej konfiguracji środowiska uruchomieniowego znajdziesz w [harness Codex](/pl/plugins/codex-harness).

## OpenClaw.app i Peekaboo

Integracja Peekaboo w OpenClaw.app jest oddzielna od Codex Computer Use. Aplikacja
macOS może hostować gniazdo PeekabooBridge, aby CLI `peekaboo` mogło ponownie używać
lokalnych zgód aplikacji na Accessibility i Screen Recording dla własnych
narzędzi automatyzacji Peekaboo. Ten most nie instaluje ani nie pośredniczy w Codex Computer Use, a
Codex Computer Use nie wywołuje niczego przez gniazdo PeekabooBridge.

Użyj [mostu Peekaboo](/pl/platforms/mac/peekaboo), gdy chcesz, aby OpenClaw.app było
hostem świadomym uprawnień dla automatyzacji Peekaboo CLI. Użyj tej strony, gdy
agent OpenClaw w trybie Codex powinien mieć natywny Plugin MCP `computer-use` Codex
dostępny przed rozpoczęciem tury.

## Aplikacja iOS

Aplikacja iOS jest oddzielna od Codex Computer Use. Nie instaluje ani nie pośredniczy
w serwerze MCP `computer-use` Codex i nie jest backendem do sterowania pulpitem.
Zamiast tego aplikacja iOS łączy się jako węzeł OpenClaw i udostępnia możliwości
mobilne przez polecenia węzła, takie jak `canvas.*`, `camera.*`, `screen.*`,
`location.*` i `talk.*`.

Użyj [iOS](/pl/platforms/ios), gdy chcesz, aby agent sterował węzłem iPhone przez
Gateway. Użyj tej strony, gdy agent w trybie Codex powinien sterować lokalnym
pulpitem macOS przez natywny Plugin Computer Use Codex.

## Bezpośredni MCP cua-driver

Codex Computer Use nie jest jedynym sposobem na udostępnienie sterowania pulpitem. Jeśli chcesz,
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

Ta ścieżka zachowuje upstreamową powierzchnię narzędzi MCP, w tym schematy
sterownika i ustrukturyzowane odpowiedzi MCP. Użyj jej, gdy chcesz, aby sterownik CUA
był dostępny jako zwykły serwer MCP OpenClaw. Użyj konfiguracji Codex Computer Use z
tej strony, gdy app-server Codex powinien zarządzać instalacją wtyczek, przeładowaniami MCP
i natywnymi wywołaniami narzędzi wewnątrz tur w trybie Codex.

Sterownik CUA jest specyficzny dla macOS i nadal wymaga lokalnych uprawnień macOS,
o które prosi jego aplikacja, takich jak Accessibility i Screen Recording. OpenClaw
nie instaluje `cua-driver`, nie przyznaje tych uprawnień ani nie omija modelu
bezpieczeństwa upstreamowego sterownika.

## Szybka konfiguracja

Ustaw `plugins.entries.codex.config.computerUse`, gdy tury w trybie Codex muszą mieć
Computer Use dostępne przed rozpoczęciem wątku. `autoInstall: true` włącza
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
      model: "openai/gpt-5.5",
    },
  },
}
```

Przy tej konfiguracji OpenClaw sprawdza app-server Codex przed każdą turą w trybie Codex.
Jeśli Computer Use brakuje, ale app-server Codex odkrył już instalowalny
marketplace, OpenClaw prosi app-server Codex o zainstalowanie lub ponowne włączenie
wtyczki i przeładowanie serwerów MCP. Na macOS, gdy nie zarejestrowano pasującego
marketplace, a istnieje standardowy pakiet aplikacji Codex, OpenClaw próbuje też
zarejestrować dołączony marketplace Codex z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, zanim
zakończy się niepowodzeniem. Jeśli konfiguracja nadal nie może udostępnić serwera MCP,
tura kończy się niepowodzeniem przed rozpoczęciem wątku.

Po zmianie konfiguracji Computer Use użyj `/new` lub `/reset` w danym czacie
przed testowaniem, jeśli istniejący wątek Codex już się rozpoczął.

Przy zarządzanym uruchamianiu stdio na macOS OpenClaw preferuje podpisany pakiet
desktopowej aplikacji Codex pod `/Applications/Codex.app/Contents/Resources/codex`,
gdy istnieje. Dzięki temu Computer Use pozostaje pod pakietem aplikacji, który posiada
lokalne uprawnienia do sterowania pulpitem. Jeśli aplikacja desktopowa nie jest
zainstalowana, OpenClaw wraca do zarządzanego binarium Codex zainstalowanego obok
wtyczki. Jeśli zainstalowana aplikacja desktopowa inicjalizuje się z nieobsługiwaną
wersją app-server, OpenClaw zamyka ten proces potomny i ponawia próbę z następnym
kandydatem zarządzanego binarium, zamiast pozwolić przestarzałej aplikacji
desktopowej przesłonić lokalny fallback wtyczki. Jawna konfiguracja `appServer.command`
lub `OPENCLAW_CODEX_APP_SERVER_BIN` nadal zastępuje ten zarządzany wybór.

## Polecenia

Użyj poleceń `/codex computer-use` z dowolnej powierzchni czatu, w której dostępna jest
powierzchnia poleceń Plugin `codex`. To są polecenia czatu/środowiska uruchomieniowego OpenClaw,
a nie podpolecenia CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` jest tylko do odczytu. Nie dodaje źródeł marketplace, nie instaluje wtyczek ani
nie włącza obsługi wtyczek Codex. Jeśli żadna konfiguracja nie włącza Computer Use,
`status` może zgłaszać wyłączenie nawet po jednorazowym poleceniu instalacji.

`install` włącza obsługę wtyczek app-server Codex, opcjonalnie dodaje skonfigurowane
źródło marketplace, instaluje lub ponownie włącza skonfigurowany Plugin przez app-server Codex,
przeładowuje serwery MCP i weryfikuje, że serwer MCP udostępnia narzędzia.

## Wybory marketplace

OpenClaw używa tego samego API app-server, które udostępnia sam Codex. Pola
marketplace wybierają, gdzie Codex powinien znaleźć `computer-use`.

| Pole                 | Użyj, gdy                                                       | Obsługa instalacji                                      |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Brak pola marketplace | Chcesz, aby app-server Codex używał marketplace, które już zna. | Tak, gdy app-server zwraca lokalny marketplace.        |
| `marketplaceSource`  | Masz źródło marketplace Codex, które app-server może dodać.     | Tak, dla jawnego `/codex computer-use install`.        |
| `marketplacePath`    | Znasz już lokalną ścieżkę pliku marketplace na hoście.          | Tak, dla jawnej instalacji i auto-instalacji na starcie tury. |
| `marketplaceName`    | Chcesz wybrać jeden już zarejestrowany marketplace po nazwie.   | Tak tylko wtedy, gdy wybrany marketplace ma lokalną ścieżkę. |

Świeże katalogi domowe Codex mogą potrzebować krótkiej chwili, aby zainicjować swoje
oficjalne marketplace. Podczas instalacji OpenClaw odpytuje `plugin/list` przez maksymalnie
`marketplaceDiscoveryTimeoutMs` milisekund. Wartość domyślna to 60 sekund.

Jeśli wiele znanych marketplace zawiera Computer Use, OpenClaw preferuje
`openai-bundled`, następnie `openai-curated`, a potem `local`. Nieznane niejednoznaczne
dopasowania kończą się bezpiecznym niepowodzeniem i proszą o ustawienie `marketplaceName` lub `marketplacePath`.

## Dołączony marketplace macOS

Najnowsze desktopowe wersje Codex dołączają Computer Use tutaj:

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

Jeśli używasz niestandardowej ścieżki aplikacji Codex, uruchom raz `/codex computer-use install
--source <marketplace-root>` albo ustaw `computerUse.marketplacePath` na
lokalną ścieżkę pliku marketplace. Używaj `--marketplace-path` tylko wtedy, gdy masz
ścieżkę pliku JSON marketplace, a nie dołączony katalog główny marketplace.

## Ograniczenie katalogu zdalnego

App-server Codex może wyświetlać i odczytywać wpisy katalogu dostępne tylko zdalnie, ale obecnie nie
obsługuje zdalnego `plugin/install`. Oznacza to, że `marketplaceName` może
wybrać marketplace dostępny tylko zdalnie do sprawdzania statusu, ale instalacje i ponowne włączenia
nadal wymagają lokalnego marketplace przez `marketplaceSource` lub `marketplacePath`.

Jeśli status mówi, że Plugin jest dostępny w zdalnym marketplace Codex, ale zdalna
instalacja nie jest obsługiwana, uruchom instalację z lokalnym źródłem lub ścieżką:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Odniesienie konfiguracji

| Pole                            | Domyślne      | Znaczenie                                                                      |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | wywnioskowane | Wymaga Computer Use. Domyślnie true, gdy ustawione jest inne pole Computer Use. |
| `autoInstall`                   | false         | Instaluje lub ponownie włącza z już odkrytych marketplace na starcie tury.     |
| `marketplaceDiscoveryTimeoutMs` | 60000         | Jak długo instalacja czeka na odkrycie marketplace przez app-server Codex.     |
| `marketplaceSource`             | nieustawione  | Ciąg źródła przekazywany do `marketplace/add` app-server Codex.                |
| `marketplacePath`               | nieustawione  | Lokalna ścieżka pliku marketplace Codex zawierającego Plugin.                  |
| `marketplaceName`               | nieustawione  | Nazwa zarejestrowanego marketplace Codex do wyboru.                            |
| `pluginName`                    | `computer-use` | Nazwa Plugin marketplace Codex.                                               |
| `mcpServerName`                 | `computer-use` | Nazwa serwera MCP udostępniana przez zainstalowany Plugin.                    |

Auto-instalacja na starcie tury celowo odrzuca skonfigurowane wartości `marketplaceSource`.
Dodanie nowego źródła jest jawną operacją konfiguracyjną, więc użyj raz
`/codex computer-use install --source <marketplace-source>`, a następnie pozwól
`autoInstall` obsługiwać przyszłe ponowne włączenia z odkrytych lokalnych marketplace.
Auto-instalacja na starcie tury może używać skonfigurowanego `marketplacePath`, ponieważ jest to
już lokalna ścieżka na hoście.

## Co sprawdza OpenClaw

OpenClaw zgłasza wewnętrznie stabilną przyczynę konfiguracji i formatuje status
widoczny dla użytkownika na czacie:

| Powód                        | Znaczenie                                              | Następny krok                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | Wartość `computerUse.enabled` została rozstrzygnięta jako false. | Ustaw `enabled` albo inne pole Computer Use.  |
| `marketplace_missing`        | Nie było dostępnego pasującego marketplace.            | Skonfiguruj źródło, ścieżkę lub nazwę marketplace. |
| `plugin_not_installed`       | Marketplace istnieje, ale Plugin nie jest zainstalowany. | Uruchom instalację albo włącz `autoInstall`.  |
| `plugin_disabled`            | Plugin jest zainstalowany, ale wyłączony w konfiguracji Codex. | Uruchom instalację, aby włączyć go ponownie.  |
| `remote_install_unsupported` | Wybrany marketplace obsługuje tylko tryb zdalny.       | Użyj `marketplaceSource` albo `marketplacePath`. |
| `mcp_missing`                | Plugin jest włączony, ale serwer MCP jest niedostępny. | Sprawdź Computer Use w Codex i uprawnienia systemu operacyjnego. |
| `ready`                      | Plugin i narzędzia MCP są dostępne.                    | Rozpocznij turę w trybie Codex.               |
| `check_failed`               | Żądanie do app-server Codex nie powiodło się podczas sprawdzania statusu. | Sprawdź łączność i logi app-server.           |
| `auto_install_blocked`       | Konfiguracja przy starcie tury musiałaby dodać nowe źródło. | Najpierw uruchom jawną instalację.            |

Wynik czatu zawiera stan Plugin, stan serwera MCP, marketplace, narzędzia,
gdy są dostępne, oraz konkretny komunikat dla kroku konfiguracji zakończonego niepowodzeniem.

## Uprawnienia macOS

Computer Use jest specyficzne dla macOS. Serwer MCP należący do Codex może wymagać lokalnych
uprawnień systemu operacyjnego, zanim będzie mógł sprawdzać lub kontrolować aplikacje. Jeśli OpenClaw zgłasza, że Computer Use
jest zainstalowane, ale serwer MCP jest niedostępny, najpierw zweryfikuj konfigurację Computer
Use po stronie Codex:

- App-server Codex działa na tym samym hoście, na którym ma odbywać się
  sterowanie pulpitem.
- Plugin Computer Use jest włączony w konfiguracji Codex.
- Serwer MCP `computer-use` pojawia się w statusie MCP app-server Codex.
- macOS przyznał wymagane uprawnienia aplikacji do sterowania pulpitem.
- Bieżąca sesja hosta ma dostęp do kontrolowanego pulpitu.

OpenClaw celowo kończy się odmową, gdy `computerUse.enabled` ma wartość true. Tura
w trybie Codex nie powinna po cichu przechodzić dalej bez natywnych narzędzi pulpitu,
których wymagała konfiguracja.

## Rozwiązywanie problemów

**Status mówi, że nie zainstalowano.** Uruchom `/codex computer-use install`. Jeśli
marketplace nie zostanie wykryty, przekaż `--source` albo `--marketplace-path`.

**Status mówi, że zainstalowano, ale wyłączono.** Uruchom ponownie `/codex computer-use install`.
Instalacja app-server Codex zapisuje konfigurację Plugin z powrotem jako włączoną.

**Status mówi, że instalacja zdalna nie jest obsługiwana.** Użyj lokalnego źródła marketplace albo
ścieżki. Wpisy katalogu dostępne tylko zdalnie można sprawdzać, ale nie można ich instalować przez
bieżące API app-server.

**Status mówi, że serwer MCP jest niedostępny.** Uruchom instalację ponownie raz, aby serwery MCP
zostały przeładowane. Jeśli nadal jest niedostępny, napraw aplikację Computer Use Codex,
status MCP app-server Codex albo uprawnienia macOS.

**Status albo próba przekracza limit czasu na `computer-use.list_apps`.** Plugin i serwer MCP
są obecne, ale lokalny most Computer Use nie odpowiedział. Zamknij albo
uruchom ponownie Codex Computer Use, w razie potrzeby uruchom ponownie Codex Desktop, a następnie spróbuj ponownie w
świeżej sesji OpenClaw. Jeśli host wcześniej uruchamiał Computer Use przez starszy
zarządzany app-server Codex, odśwież zainstalowany Plugin z marketplace dołączonego do aplikacji desktopowej:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Narzędzie Computer Use mówi `Native hook relay unavailable`.** Natywny dla Codex
hook narzędzia nie mógł połączyć się z aktywnym przekaźnikiem OpenClaw przez lokalny most albo
fallback Gateway. Rozpocznij świeżą sesję OpenClaw za pomocą `/new` albo `/reset`. Jeśli
zadziała raz, a potem ponownie zawiedzie przy późniejszym wywołaniu narzędzia, `/new` czyści tylko
bieżącą próbę; uruchom ponownie app-server Codex albo Gateway OpenClaw, aby stare wątki
i rejestracje hooków zostały usunięte, a następnie spróbuj ponownie w świeżej sesji.

**Automatyczna instalacja przy starcie tury odrzuca źródło.** To celowe. Dodaj
źródło najpierw za pomocą jawnego `/codex computer-use install --source <marketplace-source>`,
a wtedy przyszła automatyczna instalacja przy starcie tury będzie mogła użyć wykrytego lokalnego
marketplace.

## Powiązane

- [Codex harness](/pl/plugins/codex-harness)
- [Most Peekaboo](/pl/platforms/mac/peekaboo)
- [Aplikacja iOS](/pl/platforms/ios)
