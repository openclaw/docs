---
read_when:
    - Chcesz, aby agenci OpenClaw w trybie Codex korzystali z Codex Computer Use
    - Wybierasz między Codex Computer Use, PeekabooBridge a bezpośrednim cua-driver MCP
    - Wybierasz między Codex Computer Use a bezpośrednią konfiguracją MCP z cua-driver
    - Konfigurujesz computerUse dla dołączonego Pluginu Codex
    - Rozwiązujesz problem ze statusem lub instalacją /codex computer-use
summary: Skonfiguruj Codex Computer Use dla agentów OpenClaw w trybie Codex
title: Używanie komputera przez Codex
x-i18n:
    generated_at: "2026-05-06T09:23:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use to natywny dla Codex Plugin MCP do lokalnego sterowania pulpitem. OpenClaw
nie dostarcza aplikacji desktopowej, nie wykonuje samodzielnie akcji na pulpicie ani nie omija
uprawnień Codex. Dołączony Plugin `codex` tylko przygotowuje Codex app-server:
włącza obsługę Pluginów Codex, znajduje lub instaluje skonfigurowany Plugin Codex
Computer Use, sprawdza dostępność serwera MCP `computer-use`, a
następnie pozwala Codex przejąć natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Użyj tej strony, gdy OpenClaw korzysta już z natywnego środowiska Codex. Informacje o
samej konfiguracji runtime znajdziesz w [środowisku Codex](/pl/plugins/codex-harness).

## OpenClaw.app i Peekaboo

Integracja Peekaboo w OpenClaw.app jest niezależna od Codex Computer Use. Aplikacja
macOS może hostować gniazdo PeekabooBridge, aby CLI `peekaboo` mogło ponownie używać
lokalnych zgód aplikacji na Accessibility i Screen Recording dla własnych
narzędzi automatyzacji Peekaboo. Ten mostek nie instaluje ani nie pośredniczy w
Codex Computer Use, a Codex Computer Use nie wywołuje niczego przez gniazdo PeekabooBridge.

Użyj [mostka Peekaboo](/pl/platforms/mac/peekaboo), gdy chcesz, aby OpenClaw.app było
hostem świadomym uprawnień dla automatyzacji Peekaboo CLI. Użyj tej strony, gdy
agent OpenClaw w trybie Codex powinien mieć natywny Plugin MCP `computer-use` Codex
dostępny przed rozpoczęciem tury.

## Aplikacja iOS

Aplikacja iOS jest niezależna od Codex Computer Use. Nie instaluje ani nie pośredniczy
w serwerze MCP `computer-use` Codex i nie jest backendem do sterowania pulpitem.
Zamiast tego aplikacja iOS łączy się jako węzeł OpenClaw i udostępnia mobilne
możliwości przez polecenia węzła, takie jak `canvas.*`, `camera.*`, `screen.*`,
`location.*` i `talk.*`.

Użyj [iOS](/pl/platforms/ios), gdy chcesz, aby agent sterował węzłem iPhone'a przez
Gateway. Użyj tej strony, gdy agent w trybie Codex powinien sterować lokalnym
pulpitem macOS przez natywny Plugin Computer Use Codex.

## Bezpośrednie MCP cua-driver

Codex Computer Use nie jest jedynym sposobem udostępniania sterowania pulpitem. Jeśli chcesz,
aby runtime zarządzane przez OpenClaw wywoływały sterownik TryCua bezpośrednio, użyj nadrzędnego
serwera `cua-driver mcp` przez rejestr MCP OpenClaw zamiast przepływu marketplace
specyficznego dla Codex.

Po zainstalowaniu `cua-driver` poproś go o polecenie OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

albo samodzielnie zarejestruj serwer stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Ta ścieżka zachowuje nienaruszoną nadrzędną powierzchnię narzędzi MCP, w tym schematy
sterownika i ustrukturyzowane odpowiedzi MCP. Użyj jej, gdy chcesz, aby sterownik CUA
był dostępny jako zwykły serwer MCP OpenClaw. Użyj konfiguracji Codex Computer Use na
tej stronie, gdy Codex app-server powinien zarządzać instalacją Pluginu, ponownym ładowaniem MCP
i natywnymi wywołaniami narzędzi wewnątrz tur w trybie Codex.

Sterownik CUA jest specyficzny dla macOS i nadal wymaga lokalnych uprawnień macOS,
o które prosi jego aplikacja, takich jak Accessibility i Screen Recording. OpenClaw
nie instaluje `cua-driver`, nie przyznaje tych uprawnień ani nie omija modelu
bezpieczeństwa nadrzędnego sterownika.

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Przy tej konfiguracji OpenClaw sprawdza Codex app-server przed każdą turą w trybie Codex.
Jeśli brakuje Computer Use, ale Codex app-server wykrył już możliwy do zainstalowania
marketplace, OpenClaw prosi Codex app-server o zainstalowanie lub ponowne włączenie
Pluginu i przeładowanie serwerów MCP. Na macOS, gdy nie zarejestrowano pasującego
marketplace, a standardowy pakiet aplikacji Codex istnieje, OpenClaw próbuje także
zarejestrować dołączony marketplace Codex z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, zanim
zakończy się niepowodzeniem. Jeśli konfiguracja nadal nie może udostępnić serwera MCP,
tura kończy się niepowodzeniem przed rozpoczęciem wątku.

Istniejące sesje zachowują swój runtime i powiązanie wątku Codex. Po zmianie
`agentRuntime` lub konfiguracji Computer Use użyj `/new` albo `/reset` w danym
czacie przed testowaniem.

## Polecenia

Używaj poleceń `/codex computer-use` z dowolnej powierzchni czatu, w której dostępna jest
powierzchnia poleceń Pluginu `codex`. Są to polecenia czatu/runtime OpenClaw,
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

`install` włącza obsługę Pluginów w Codex app-server, opcjonalnie dodaje skonfigurowane
źródło marketplace, instaluje lub ponownie włącza skonfigurowany Plugin przez Codex
app-server, przeładowuje serwery MCP i sprawdza, czy serwer MCP udostępnia narzędzia.

## Wybór marketplace

OpenClaw używa tego samego API app-server, które udostępnia sam Codex. Pola
marketplace wybierają, gdzie Codex ma znaleźć `computer-use`.

| Pole                 | Użyj, gdy                                                        | Obsługa instalacji                                      |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Brak pola marketplace | Chcesz, aby Codex app-server używał marketplace, które już zna. | Tak, gdy app-server zwraca lokalny marketplace.         |
| `marketplaceSource`  | Masz źródło marketplace Codex, które app-server może dodać.     | Tak, dla jawnego `/codex computer-use install`.          |
| `marketplacePath`    | Znasz już lokalną ścieżkę pliku marketplace na hoście.          | Tak, dla jawnej instalacji i automatycznej instalacji na starcie tury. |
| `marketplaceName`    | Chcesz wybrać jeden już zarejestrowany marketplace po nazwie.   | Tak, tylko gdy wybrany marketplace ma lokalną ścieżkę. |

Świeże katalogi domowe Codex mogą potrzebować krótkiej chwili na zasianie swoich oficjalnych marketplace.
Podczas instalacji OpenClaw odpytuje `plugin/list` przez maksymalnie
`marketplaceDiscoveryTimeoutMs` milisekund. Domyślna wartość to 60 sekund.

Jeśli wiele znanych marketplace zawiera Computer Use, OpenClaw preferuje
`openai-bundled`, potem `openai-curated`, a następnie `local`. Nieznane niejednoznaczne dopasowania
kończą się bezpiecznym niepowodzeniem i proszą o ustawienie `marketplaceName` albo `marketplacePath`.

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
lokalną ścieżkę pliku marketplace albo raz uruchom `/codex computer-use install --source
<marketplace-source>`.

## Ograniczenie katalogu zdalnego

Codex app-server może wyświetlać i odczytywać wpisy katalogu dostępne tylko zdalnie, ale obecnie
nie obsługuje zdalnego `plugin/install`. Oznacza to, że `marketplaceName` może
wybrać marketplace dostępny tylko zdalnie na potrzeby sprawdzania statusu, ale instalacje i ponowne włączenia
nadal wymagają lokalnego marketplace przez `marketplaceSource` albo `marketplacePath`.

Jeśli status mówi, że Plugin jest dostępny w zdalnym marketplace Codex, ale instalacja zdalna
nie jest obsługiwana, uruchom instalację z lokalnym źródłem lub ścieżką:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Dokumentacja konfiguracji

| Pole                            | Domyślnie      | Znaczenie                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Wymagaj Computer Use. Domyślnie true, gdy ustawiono inne pole Computer Use.    |
| `autoInstall`                   | false          | Instaluj lub ponownie włączaj z już wykrytych marketplace na starcie tury.     |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Jak długo instalacja czeka na wykrycie marketplace przez Codex app-server.     |
| `marketplaceSource`             | unset          | Ciąg źródła przekazywany do `marketplace/add` Codex app-server.                |
| `marketplacePath`               | unset          | Lokalna ścieżka pliku marketplace Codex zawierającego Plugin.                  |
| `marketplaceName`               | unset          | Nazwa zarejestrowanego marketplace Codex do wyboru.                            |
| `pluginName`                    | `computer-use` | Nazwa Pluginu w marketplace Codex.                                             |
| `mcpServerName`                 | `computer-use` | Nazwa serwera MCP udostępniana przez zainstalowany Plugin.                     |

Automatyczna instalacja na starcie tury celowo odmawia skonfigurowanych wartości `marketplaceSource`.
Dodanie nowego źródła jest jawną operacją konfiguracyjną, więc użyj raz
`/codex computer-use install --source <marketplace-source>`, a potem pozwól
`autoInstall` obsługiwać przyszłe ponowne włączenia z wykrytych lokalnych marketplace.
Automatyczna instalacja na starcie tury może używać skonfigurowanego `marketplacePath`, ponieważ jest to
już lokalna ścieżka na hoście.

## Co sprawdza OpenClaw

OpenClaw raportuje stabilny powód konfiguracji wewnętrznie i formatuje widoczny dla użytkownika
status dla czatu:

| Powód                        | Znaczenie                                             | Następny krok                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` rozwiązało się do false.         | Ustaw `enabled` lub inne pole Computer Use.   |
| `marketplace_missing`        | Nie był dostępny żaden pasujący marketplace.           | Skonfiguruj źródło, ścieżkę lub nazwę marketplace. |
| `plugin_not_installed`       | Marketplace istnieje, ale Plugin nie jest zainstalowany. | Uruchom instalację lub włącz `autoInstall`. |
| `plugin_disabled`            | Plugin jest zainstalowany, ale wyłączony w konfiguracji Codex. | Uruchom instalację, aby włączyć go ponownie. |
| `remote_install_unsupported` | Wybrany marketplace jest dostępny tylko zdalnie.       | Użyj `marketplaceSource` lub `marketplacePath`. |
| `mcp_missing`                | Plugin jest włączony, ale serwer MCP jest niedostępny. | Sprawdź Codex Computer Use i uprawnienia OS.  |
| `ready`                      | Plugin i narzędzia MCP są dostępne.                    | Rozpocznij turę w trybie Codex.               |
| `check_failed`               | Żądanie Codex app-server nie powiodło się podczas sprawdzania statusu. | Sprawdź łączność i logi app-server. |
| `auto_install_blocked`       | Konfiguracja na starcie tury wymagałaby dodania nowego źródła. | Najpierw uruchom jawną instalację. |

Wynik czatu zawiera stan Pluginu, stan serwera MCP, marketplace, narzędzia,
gdy są dostępne, oraz konkretny komunikat dla nieudanego kroku konfiguracji.

## Uprawnienia macOS

Computer Use jest specyficzne dla macOS. Serwer MCP zarządzany przez Codex może wymagać lokalnych uprawnień OS,
zanim będzie mógł sprawdzać lub kontrolować aplikacje. Jeśli OpenClaw informuje, że Computer Use
jest zainstalowane, ale serwer MCP jest niedostępny, najpierw zweryfikuj konfigurację Computer
Use po stronie Codex:

- Codex app-server działa na tym samym hoście, na którym powinno odbywać się sterowanie pulpitem.
