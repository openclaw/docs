---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex korzystali z Codex Computer Use
    - Wybierasz między Codex Computer Use, PeekabooBridge a bezpośrednim cua-driver MCP
    - Decydujesz między Codex Computer Use a bezpośrednią konfiguracją cua-driver MCP
    - Konfigurujesz computerUse dla dołączonego Plugin Codex
    - Rozwiązujesz problemy z /codex computer-use status lub install
summary: Skonfiguruj Codex Computer Use dla agentów OpenClaw w trybie Codex
title: Korzystanie z komputera przez Codex
x-i18n:
    generated_at: "2026-05-10T19:44:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use to natywny dla Codex Plugin MCP do sterowania lokalnym pulpitem. OpenClaw
nie dołącza aplikacji desktopowej do dystrybucji, nie wykonuje samodzielnie działań na pulpicie ani nie omija
uprawnień Codex. Dołączony Plugin `codex` przygotowuje wyłącznie Codex app-server:
włącza obsługę Pluginów Codex, znajduje lub instaluje skonfigurowany Plugin Codex
Computer Use, sprawdza, czy serwer MCP `computer-use` jest dostępny, a
następnie pozwala Codex przejąć natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Użyj tej strony, gdy OpenClaw korzysta już z natywnego harnessu Codex. Informacje o samej
konfiguracji runtime znajdziesz w [Harness Codex](/pl/plugins/codex-harness).

## OpenClaw.app i Peekaboo

Integracja Peekaboo w OpenClaw.app jest oddzielna od Codex Computer Use. Aplikacja
macOS może hostować gniazdo PeekabooBridge, aby CLI `peekaboo` mogło ponownie używać
lokalnych uprawnień aplikacji do Dostępności i Nagrywania ekranu dla własnych
narzędzi automatyzacji Peekaboo. Ten mostek nie instaluje ani nie pośredniczy w Codex Computer Use, a
Codex Computer Use nie wywołuje niczego przez gniazdo PeekabooBridge.

Użyj [Mostka Peekaboo](/pl/platforms/mac/peekaboo), gdy chcesz, aby OpenClaw.app było
hostem świadomym uprawnień dla automatyzacji Peekaboo CLI. Użyj tej strony, gdy
agent OpenClaw w trybie Codex powinien mieć natywny Plugin MCP `computer-use` Codex
dostępny przed rozpoczęciem tury.

## Aplikacja iOS

Aplikacja iOS jest oddzielna od Codex Computer Use. Nie instaluje ani nie pośredniczy w
serwerze MCP `computer-use` Codex i nie jest backendem do sterowania pulpitem.
Zamiast tego aplikacja iOS łączy się jako węzeł OpenClaw i udostępnia możliwości
mobilne przez polecenia węzła, takie jak `canvas.*`, `camera.*`, `screen.*`,
`location.*` i `talk.*`.

Użyj [iOS](/pl/platforms/ios), gdy chcesz, aby agent sterował węzłem iPhone przez
Gateway. Użyj tej strony, gdy agent w trybie Codex powinien sterować lokalnym
pulpitem macOS przez natywny Plugin Computer Use Codex.

## Bezpośredni MCP cua-driver

Codex Computer Use nie jest jedynym sposobem udostępniania sterowania pulpitem. Jeśli chcesz,
aby runtime zarządzane przez OpenClaw wywoływały sterownik TryCua bezpośrednio, użyj upstreamowego
serwera `cua-driver mcp` przez rejestr MCP OpenClaw zamiast
przepływu marketplace specyficznego dla Codex.

Po zainstalowaniu `cua-driver` poproś go o polecenie OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

albo samodzielnie zarejestruj serwer stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Ta ścieżka zachowuje powierzchnię narzędzi MCP upstreamu w niezmienionej postaci, w tym schematy
sterownika i ustrukturyzowane odpowiedzi MCP. Użyj jej, gdy chcesz, aby sterownik CUA
był dostępny jako zwykły serwer MCP OpenClaw. Użyj konfiguracji Codex Computer Use z
tej strony, gdy Codex app-server ma odpowiadać za instalację Pluginu, przeładowania MCP
i natywne wywołania narzędzi w turach trybu Codex.

Sterownik CUA jest specyficzny dla macOS i nadal wymaga lokalnych uprawnień macOS,
o które prosi jego aplikacja, takich jak Dostępność i Nagrywanie ekranu. OpenClaw
nie instaluje `cua-driver`, nie nadaje tych uprawnień ani nie omija modelu bezpieczeństwa
upstreamowego sterownika.

## Szybka konfiguracja

Ustaw `plugins.entries.codex.config.computerUse`, gdy tury w trybie Codex muszą mieć
Computer Use dostępne przed rozpoczęciem wątku:

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

Przy tej konfiguracji OpenClaw sprawdza Codex app-server przed każdą turą w trybie Codex.
Jeśli Computer Use jest brakujące, ale Codex app-server wykrył już
marketplace możliwy do instalacji, OpenClaw prosi Codex app-server o zainstalowanie lub ponowne włączenie
Pluginu i przeładowanie serwerów MCP. W macOS, gdy żaden pasujący marketplace nie jest
zarejestrowany, a standardowy pakiet aplikacji Codex istnieje, OpenClaw próbuje także
zarejestrować dołączony marketplace Codex z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, zanim
zakończy niepowodzeniem. Jeśli konfiguracja nadal nie może udostępnić serwera MCP, tura kończy się
niepowodzeniem przed rozpoczęciem wątku.

Po zmianie konfiguracji Computer Use użyj `/new` lub `/reset` w dotkniętym czacie
przed testowaniem, jeśli istniejący wątek Codex został już rozpoczęty.

## Polecenia

Użyj poleceń `/codex computer-use` z dowolnej powierzchni czatu, na której dostępna jest powierzchnia poleceń Pluginu `codex`.
Są to polecenia czatu/runtime OpenClaw,
a nie podpolecenia CLI `openclaw codex ...`:

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
app-server, przeładowuje serwery MCP i weryfikuje, czy serwer MCP udostępnia narzędzia.

## Wybór marketplace

OpenClaw używa tego samego API app-server, które udostępnia sam Codex. Pola
marketplace wybierają, gdzie Codex ma znaleźć `computer-use`.

| Pole                 | Użyj, gdy                                                        | Obsługa instalacji                                      |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Brak pola marketplace | Chcesz, aby Codex app-server używał marketplace, które już zna. | Tak, gdy app-server zwraca lokalny marketplace.         |
| `marketplaceSource`  | Masz źródło marketplace Codex, które app-server może dodać.     | Tak, dla jawnego `/codex computer-use install`.         |
| `marketplacePath`    | Znasz już lokalną ścieżkę pliku marketplace na hoście.          | Tak, dla jawnej instalacji i automatycznej instalacji przy starcie tury. |
| `marketplaceName`    | Chcesz wybrać jeden już zarejestrowany marketplace po nazwie.   | Tak tylko wtedy, gdy wybrany marketplace ma lokalną ścieżkę. |

Świeże katalogi domowe Codex mogą potrzebować krótkiej chwili na zainicjowanie oficjalnych marketplace.
Podczas instalacji OpenClaw odpytuje `plugin/list` przez maksymalnie
`marketplaceDiscoveryTimeoutMs` milisekund. Domyślna wartość to 60 sekund.

Jeśli wiele znanych marketplace zawiera Computer Use, OpenClaw preferuje
`openai-bundled`, potem `openai-curated`, a potem `local`. Nieznane, niejednoznaczne dopasowania
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

## Ograniczenie zdalnego katalogu

Codex app-server może listować i odczytywać wpisy katalogu dostępne tylko zdalnie, ale obecnie
nie obsługuje zdalnego `plugin/install`. Oznacza to, że `marketplaceName` może
wybrać marketplace dostępny tylko zdalnie do sprawdzeń statusu, ale instalacje i ponowne włączenia
nadal wymagają lokalnego marketplace przez `marketplaceSource` lub `marketplacePath`.

Jeśli status mówi, że Plugin jest dostępny w zdalnym marketplace Codex, ale zdalna
instalacja nie jest obsługiwana, uruchom instalację z lokalnym źródłem lub ścieżką:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Dokumentacja konfiguracji

| Pole                            | Domyślnie      | Znaczenie                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Wymagaj Computer Use. Domyślnie true, gdy ustawiono inne pole Computer Use.    |
| `autoInstall`                   | false          | Instaluj lub ponownie włączaj z już wykrytych marketplace przy starcie tury.   |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Jak długo instalacja czeka na wykrywanie marketplace przez Codex app-server.   |
| `marketplaceSource`             | unset          | Ciąg źródła przekazywany do `marketplace/add` Codex app-server.                |
| `marketplacePath`               | unset          | Lokalna ścieżka pliku marketplace Codex zawierającego Plugin.                 |
| `marketplaceName`               | unset          | Nazwa zarejestrowanego marketplace Codex do wybrania.                         |
| `pluginName`                    | `computer-use` | Nazwa Pluginu marketplace Codex.                                               |
| `mcpServerName`                 | `computer-use` | Nazwa serwera MCP udostępniana przez zainstalowany Plugin.                    |

Automatyczna instalacja przy starcie tury celowo odrzuca skonfigurowane wartości `marketplaceSource`.
Dodanie nowego źródła jest jawną operacją konfiguracyjną, więc użyj
`/codex computer-use install --source <marketplace-source>` raz, a potem pozwól
`autoInstall` obsługiwać przyszłe ponowne włączenia z wykrytych lokalnych marketplace.
Automatyczna instalacja przy starcie tury może używać skonfigurowanego `marketplacePath`, ponieważ jest to
już lokalna ścieżka na hoście.

## Co sprawdza OpenClaw

OpenClaw raportuje stabilny powód konfiguracji wewnętrznie i formatuje widoczny dla użytkownika
status dla czatu:

| Powód                        | Znaczenie                                             | Następny krok                                  |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` rozstrzygnięto jako false.      | Ustaw `enabled` lub inne pole Computer Use.   |
| `marketplace_missing`        | Brak pasującego marketplace.                          | Skonfiguruj źródło, ścieżkę lub nazwę marketplace. |
| `plugin_not_installed`       | Marketplace istnieje, ale Plugin nie jest zainstalowany. | Uruchom instalację lub włącz `autoInstall`.   |
| `plugin_disabled`            | Plugin jest zainstalowany, ale wyłączony w konfiguracji Codex. | Uruchom instalację, aby włączyć go ponownie. |
| `remote_install_unsupported` | Wybrany marketplace jest dostępny tylko zdalnie.      | Użyj `marketplaceSource` lub `marketplacePath`. |
| `mcp_missing`                | Plugin jest włączony, ale serwer MCP jest niedostępny. | Sprawdź Codex Computer Use i uprawnienia OS.  |
| `ready`                      | Plugin i narzędzia MCP są dostępne.                   | Rozpocznij turę w trybie Codex.               |
| `check_failed`               | Żądanie Codex app-server nie powiodło się podczas sprawdzania statusu. | Sprawdź łączność z app-server i logi.         |
| `auto_install_blocked`       | Konfiguracja przy starcie tury wymagałaby dodania nowego źródła. | Najpierw uruchom jawną instalację.            |

Wynik czatu zawiera stan Pluginu, stan serwera MCP, marketplace, narzędzia,
gdy są dostępne, oraz konkretny komunikat dla nieudanego kroku konfiguracji.

## Uprawnienia macOS

Computer Use jest specyficzne dla macOS. Serwer MCP należący do Codex może potrzebować lokalnych uprawnień OS,
zanim będzie mógł sprawdzać aplikacje lub nimi sterować. Jeśli OpenClaw mówi, że Computer Use
jest zainstalowane, ale serwer MCP jest niedostępny, najpierw zweryfikuj konfigurację Computer Use
po stronie Codex:

- Codex app-server działa na tym samym hoście, na którym ma odbywać się
  sterowanie pulpitem.
- Plugin Computer Use jest włączony w konfiguracji Codex.
- Serwer MCP `computer-use` jest widoczny w statusie MCP Codex app-server.
- macOS przyznał wymagane uprawnienia aplikacji do sterowania pulpitem.
- Bieżąca sesja hosta może uzyskać dostęp do kontrolowanego pulpitu.

OpenClaw celowo bezpiecznie odmawia działania, gdy `computerUse.enabled` ma wartość true. Tura
w trybie Codex nie powinna po cichu kontynuować bez natywnych narzędzi pulpitu,
których wymaga konfiguracja.

## Rozwiązywanie problemów

**Status informuje, że nie zainstalowano.** Uruchom `/codex computer-use install`. Jeśli
marketplace nie zostanie wykryty, przekaż `--source` lub `--marketplace-path`.

**Status informuje, że zainstalowano, ale wyłączono.** Uruchom ponownie `/codex computer-use install`.
Instalacja Codex app-server zapisuje konfigurację pluginu z powrotem jako włączoną.

**Status informuje, że instalacja zdalna nie jest obsługiwana.** Użyj lokalnego źródła lub
ścieżki marketplace. Wpisy katalogu dostępne tylko zdalnie można przeglądać, ale nie da się ich
zainstalować przez bieżące API app-server.

**Status informuje, że serwer MCP jest niedostępny.** Uruchom ponownie instalację raz, aby serwery MCP
zostały przeładowane. Jeśli nadal jest niedostępny, napraw aplikację Codex Computer Use,
status MCP Codex app-server albo uprawnienia macOS.

**Status lub sonda przekracza limit czasu na `computer-use.list_apps`.** Plugin i serwer MCP
są obecne, ale lokalny most Computer Use nie odpowiedział. Zamknij lub
uruchom ponownie Codex Computer Use, w razie potrzeby uruchom ponownie Codex Desktop, a następnie spróbuj ponownie w
nowej sesji OpenClaw.

**Narzędzie Computer Use zgłasza `Native hook relay unavailable`.** Natywny hook narzędzia Codex
nie mógł połączyć się z aktywnym przekaźnikiem OpenClaw przez lokalny most lub
awaryjny Gateway. Rozpocznij nową sesję OpenClaw poleceniem `/new` lub `/reset`. Jeśli problem
nadal występuje, uruchom ponownie gateway, aby stare wątki app-server i rejestracje hooków
zostały usunięte, a następnie spróbuj ponownie.

**Automatyczna instalacja na początku tury odrzuca źródło.** To celowe. Najpierw dodaj
źródło jawnie poleceniem `/codex computer-use install --source <marketplace-source>`,
a wtedy przyszła automatyczna instalacja na początku tury będzie mogła użyć wykrytego lokalnego
marketplace.

## Powiązane

- [Uprząż Codex](/pl/plugins/codex-harness)
- [Most Peekaboo](/pl/platforms/mac/peekaboo)
- [Aplikacja iOS](/pl/platforms/ios)
