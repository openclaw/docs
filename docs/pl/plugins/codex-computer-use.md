---
read_when:
    - Chcesz, aby agenty OpenClaw w trybie Codex używały Codex Computer Use
    - Wybierasz między Codex Computer Use, PeekabooBridge i bezpośrednim MCP cua-driver
    - Decydujesz między Codex Computer Use a bezpośrednią konfiguracją cua-driver MCP
    - Konfigurujesz computerUse dla dołączonego pluginu Codex
    - Rozwiązujesz problemy ze statusem lub instalacją /codex computer-use
summary: Skonfiguruj Codex Computer Use dla agentów OpenClaw w trybie Codex
title: Używanie komputera w Codex
x-i18n:
    generated_at: "2026-06-30T14:28:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use to natywny dla Codex plugin MCP do lokalnego sterowania pulpitem. OpenClaw
nie dostarcza aplikacji desktopowej, nie wykonuje samodzielnie działań na pulpicie ani nie omija
uprawnień Codex. Dołączony plugin `codex` tylko przygotowuje Codex app-server:
włącza obsługę pluginów Codex, znajduje lub instaluje skonfigurowany plugin Codex
Computer Use, sprawdza, czy serwer MCP `computer-use` jest dostępny, a
następnie pozwala Codex obsługiwać natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Użyj tej strony, gdy OpenClaw korzysta już z natywnego harnessu Codex. Samą
konfigurację runtime opisuje [harness Codex](/pl/plugins/codex-harness).

## OpenClaw.app i Peekaboo

Integracja Peekaboo w OpenClaw.app jest oddzielna od Codex Computer Use. Aplikacja
macOS może hostować gniazdo PeekabooBridge, aby CLI `peekaboo` mogło ponownie używać
lokalnych uprawnień aplikacji do Dostępności i Nagrywania ekranu na potrzeby własnych
narzędzi automatyzacji Peekaboo. Ten mostek nie instaluje ani nie pośredniczy dla Codex Computer Use, a
Codex Computer Use nie wywołuje niczego przez gniazdo PeekabooBridge.

Użyj [mostka Peekaboo](/pl/platforms/mac/peekaboo), gdy chcesz, aby OpenClaw.app było
hostem świadomym uprawnień dla automatyzacji Peekaboo CLI. Użyj tej strony, gdy
agent OpenClaw w trybie Codex powinien mieć natywny plugin MCP `computer-use` Codex
dostępny przed rozpoczęciem tury.

## Aplikacja iOS

Aplikacja iOS jest oddzielna od Codex Computer Use. Nie instaluje ani nie pośredniczy
dla serwera MCP Codex `computer-use` i nie jest backendem sterowania pulpitem.
Zamiast tego aplikacja iOS łączy się jako węzeł OpenClaw i udostępnia możliwości
mobilne przez polecenia węzła, takie jak `canvas.*`, `camera.*`, `screen.*`,
`location.*` i `talk.*`.

Użyj [iOS](/pl/platforms/ios), gdy chcesz, aby agent sterował węzłem iPhone przez
gateway. Użyj tej strony, gdy agent w trybie Codex powinien sterować lokalnym
pulpitem macOS przez natywny plugin Computer Use Codex.

## Bezpośredni MCP cua-driver

Codex Computer Use nie jest jedynym sposobem udostępniania sterowania pulpitem. Jeśli chcesz,
aby runtime zarządzane przez OpenClaw wywoływały sterownik TryCua bezpośrednio, użyj nadrzędnego
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

Ta ścieżka zachowuje nienaruszoną nadrzędną powierzchnię narzędzi MCP, w tym schematy
sterownika i ustrukturyzowane odpowiedzi MCP. Użyj jej, gdy chcesz, aby sterownik CUA
był dostępny jako zwykły serwer MCP OpenClaw. Użyj konfiguracji Codex Computer Use z
tej strony, gdy Codex app-server powinien odpowiadać za instalację pluginu, ponowne ładowanie MCP
i natywne wywołania narzędzi wewnątrz tur w trybie Codex.

Sterownik CUA jest specyficzny dla macOS i nadal wymaga lokalnych uprawnień macOS,
o które prosi jego aplikacja, takich jak Dostępność i Nagrywanie ekranu. OpenClaw
nie instaluje `cua-driver`, nie przyznaje tych uprawnień ani nie omija modelu bezpieczeństwa
nadrzędnego sterownika.

## Szybka konfiguracja

Ustaw `plugins.entries.codex.config.computerUse`, gdy tury w trybie Codex muszą mieć
Computer Use dostępny przed rozpoczęciem wątku. `autoInstall: true` włącza
Computer Use i pozwala OpenClaw zainstalować lub ponownie włączyć go przed turą:

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

Z tą konfiguracją OpenClaw sprawdza Codex app-server przed każdą turą w trybie Codex.
Jeśli brakuje Computer Use, ale Codex app-server wykrył już instalowalny
marketplace, OpenClaw prosi Codex app-server o zainstalowanie lub ponowne włączenie
pluginu i ponowne załadowanie serwerów MCP. Na macOS, gdy nie jest zarejestrowany żaden
pasujący marketplace, a standardowy pakiet aplikacji Codex istnieje, OpenClaw próbuje też
zarejestrować dołączony marketplace Codex z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` przed
zgłoszeniem błędu. Jeśli konfiguracja nadal nie może udostępnić serwera MCP, tura kończy się błędem
przed rozpoczęciem wątku.

Po zmianie konfiguracji Computer Use użyj `/new` lub `/reset` w dotkniętym czacie
przed testowaniem, jeśli istniejący wątek Codex już się rozpoczął.

Przy zarządzanym uruchamianiu stdio na macOS OpenClaw preferuje podpisany pakiet
desktopowej aplikacji Codex pod `/Applications/Codex.app/Contents/Resources/codex`, gdy istnieje.
Dzięki temu Computer Use pozostaje pod pakietem aplikacji, który posiada lokalne uprawnienia
sterowania pulpitem. Jeśli aplikacja desktopowa nie jest zainstalowana, OpenClaw wraca do
zarządzanego pliku binarnego Codex zainstalowanego obok pluginu. Jeśli zainstalowana aplikacja desktopowa
inicjalizuje się z nieobsługiwaną wersją app-server, OpenClaw zamyka ten proces potomny
i próbuje następnego zarządzanego kandydata binarnego zamiast pozwolić przestarzałej
aplikacji desktopowej przesłonić fallback lokalny dla pluginu. Jawna konfiguracja `appServer.command`
lub `OPENCLAW_CODEX_APP_SERVER_BIN` nadal zastępuje ten zarządzany
wybór.

## Polecenia

Używaj poleceń `/codex computer-use` z dowolnej powierzchni czatu, na której powierzchnia poleceń pluginu `codex`
jest dostępna. Są to polecenia czatu/runtime OpenClaw,
a nie podpolecenia CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` jest tylko do odczytu. Nie dodaje źródeł marketplace, nie instaluje pluginów ani
nie włącza obsługi pluginów Codex. Jeśli żadna konfiguracja nie włącza Computer Use,
`status` może zgłosić wyłączenie nawet po jednorazowym poleceniu instalacji.

`install` włącza obsługę pluginów Codex app-server, opcjonalnie dodaje skonfigurowane
źródło marketplace, instaluje lub ponownie włącza skonfigurowany plugin przez Codex
app-server, ponownie ładuje serwery MCP i weryfikuje, że serwer MCP udostępnia narzędzia.
Ponieważ instalacja zmienia zaufane zasoby hosta, tylko właściciel lub klient Gateway
`operator.admin` może uruchomić `install`. Inni autoryzowani nadawcy mogą
nadal używać polecenia tylko do odczytu `status`, także z nadpisaniami.

## Wybory marketplace

OpenClaw używa tego samego API app-server, które udostępnia sam Codex.
Pola marketplace wybierają, gdzie Codex powinien znaleźć `computer-use`.

| Pole                 | Użyj, gdy                                                       | Obsługa instalacji                                       |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Brak pola marketplace | Chcesz, aby Codex app-server używał marketplace, które już zna. | Tak, gdy app-server zwraca lokalny marketplace.          |
| `marketplaceSource`  | Masz źródło marketplace Codex, które app-server może dodać.     | Tak, dla jawnego `/codex computer-use install`.          |
| `marketplacePath`    | Znasz już lokalną ścieżkę pliku marketplace na hoście.          | Tak, dla jawnej instalacji i autoinstalacji przy starcie tury. |
| `marketplaceName`    | Chcesz wybrać jeden już zarejestrowany marketplace według nazwy. | Tak tylko wtedy, gdy wybrany marketplace ma lokalną ścieżkę. |

Świeże katalogi domowe Codex mogą potrzebować krótkiej chwili, aby zainicjować swoje oficjalne marketplace.
Podczas instalacji OpenClaw odpytuje `plugin/list` przez maksymalnie
`marketplaceDiscoveryTimeoutMs` milisekund. Domyślnie jest to 60 sekund.

Jeśli kilka znanych marketplace zawiera Computer Use, OpenClaw preferuje
`openai-bundled`, potem `openai-curated`, a następnie `local`. Nieznane niejednoznaczne dopasowania
kończą się odmową i proszą o ustawienie `marketplaceName` lub `marketplacePath`.

## Dołączony marketplace macOS

Nowsze buildy desktopowe Codex dołączają Computer Use tutaj:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Gdy `computerUse.autoInstall` ma wartość true i nie jest zarejestrowany żaden marketplace zawierający
`computer-use`, OpenClaw próbuje automatycznie dodać standardowy dołączony
korzeń marketplace:

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
ścieżkę pliku JSON marketplace, a nie dołączony korzeń marketplace.

## Ograniczenie zdalnego katalogu

Codex app-server może wyświetlać i odczytywać wpisy katalogu tylko zdalnego, ale obecnie nie
obsługuje zdalnego `plugin/install`. Oznacza to, że `marketplaceName` może
wybrać marketplace tylko zdalny do sprawdzeń statusu, ale instalacje i ponowne włączenia
nadal wymagają lokalnego marketplace przez `marketplaceSource` lub `marketplacePath`.

Jeśli status mówi, że plugin jest dostępny w zdalnym marketplace Codex, ale zdalna
instalacja nie jest obsługiwana, uruchom instalację z lokalnym źródłem lub ścieżką:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Odniesienie konfiguracji

| Pole                            | Domyślnie      | Znaczenie                                                                      |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Wymagaj Computer Use. Domyślnie true, gdy ustawione jest inne pole Computer Use. |
| `autoInstall`                   | false          | Instaluj lub ponownie włączaj z już wykrytych marketplace przy starcie tury.   |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Jak długo instalacja czeka na wykrycie marketplace przez Codex app-server.     |
| `marketplaceSource`             | unset          | Ciąg źródłowy przekazywany do Codex app-server `marketplace/add`.              |
| `marketplacePath`               | unset          | Lokalna ścieżka pliku marketplace Codex zawierającego plugin.                  |
| `marketplaceName`               | unset          | Nazwa zarejestrowanego marketplace Codex do wybrania.                          |
| `pluginName`                    | `computer-use` | Nazwa pluginu w marketplace Codex.                                             |
| `mcpServerName`                 | `computer-use` | Nazwa serwera MCP udostępniana przez zainstalowany plugin.                     |

Autoinstalacja przy starcie tury celowo odmawia skonfigurowanych wartości `marketplaceSource`.
Dodanie nowego źródła jest jawną operacją konfiguracyjną, więc użyj raz
`/codex computer-use install --source <marketplace-source>`, a potem pozwól
`autoInstall` obsługiwać przyszłe ponowne włączenia z wykrytych lokalnych marketplace.
Autoinstalacja przy starcie tury może użyć skonfigurowanego `marketplacePath`, ponieważ jest to
już lokalna ścieżka na hoście.

## Co sprawdza OpenClaw

OpenClaw zgłasza stabilny powód konfiguracji wewnętrznie i formatuje widoczny dla użytkownika
status dla czatu:

| Przyczyna                    | Znaczenie                                              | Następny krok                                 |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` rozpoznano jako false.           | Ustaw `enabled` albo inne pole Computer Use.  |
| `marketplace_missing`        | Brak dostępnego pasującego marketplace.                | Skonfiguruj źródło, ścieżkę albo nazwę marketplace. |
| `plugin_not_installed`       | Marketplace istnieje, ale Plugin nie jest zainstalowany. | Uruchom instalację albo włącz `autoInstall`. |
| `plugin_disabled`            | Plugin jest zainstalowany, ale wyłączony w konfiguracji Codex. | Uruchom instalację, aby włączyć go ponownie. |
| `remote_install_unsupported` | Wybrany marketplace jest tylko zdalny.                 | Użyj `marketplaceSource` albo `marketplacePath`. |
| `mcp_missing`                | Plugin jest włączony, ale serwer MCP jest niedostępny. | Sprawdź Computer Use w Codex i uprawnienia systemu operacyjnego. |
| `ready`                      | Plugin i narzędzia MCP są dostępne.                    | Rozpocznij turę w trybie Codex.               |
| `check_failed`               | Żądanie app-server Codex nie powiodło się podczas sprawdzania statusu. | Sprawdź łączność i logi app-server. |
| `auto_install_blocked`       | Konfiguracja przy rozpoczęciu tury musiałaby dodać nowe źródło. | Najpierw uruchom jawną instalację. |

Wynik czatu zawiera stan Plugin, stan serwera MCP, marketplace, narzędzia,
gdy są dostępne, oraz konkretny komunikat dla kroku konfiguracji, który się nie powiódł.

## Uprawnienia macOS

Computer Use jest specyficzny dla macOS. Serwer MCP należący do Codex może wymagać lokalnych uprawnień systemu operacyjnego, zanim będzie mógł sprawdzać lub kontrolować aplikacje. Jeśli OpenClaw informuje, że Computer Use jest zainstalowany, ale serwer MCP jest niedostępny, najpierw zweryfikuj konfigurację Computer Use po stronie Codex:

- Codex app-server działa na tym samym hoście, na którym ma odbywać się
  sterowanie pulpitem.
- Plugin Computer Use jest włączony w konfiguracji Codex.
- Serwer MCP `computer-use` pojawia się w statusie MCP Codex app-server.
- macOS przyznał wymagane uprawnienia aplikacji sterującej pulpitem.
- Bieżąca sesja hosta ma dostęp do kontrolowanego pulpitu.

OpenClaw celowo kończy się odmową, gdy `computerUse.enabled` ma wartość true. Tura w trybie Codex nie powinna po cichu przechodzić dalej bez natywnych narzędzi pulpitu, których wymaga konfiguracja.

## Rozwiązywanie problemów

**Status mówi, że nie zainstalowano.** Uruchom `/codex computer-use install`. Jeśli
marketplace nie zostanie wykryty, przekaż `--source` albo `--marketplace-path`.

**Status mówi, że zainstalowano, ale wyłączono.** Uruchom ponownie `/codex computer-use install`.
Instalacja przez Codex app-server zapisuje konfigurację Plugin z powrotem jako włączoną.

**Status mówi, że instalacja zdalna nie jest obsługiwana.** Użyj lokalnego źródła albo
ścieżki marketplace. Wpisy katalogu dostępne tylko zdalnie można sprawdzać, ale nie instalować przez bieżące API app-server.

**Status mówi, że serwer MCP jest niedostępny.** Uruchom instalację ponownie raz, aby serwery MCP
zostały przeładowane. Jeśli nadal jest niedostępny, napraw aplikację Codex Computer Use,
status MCP Codex app-server albo uprawnienia macOS.

**Status lub próba przekracza limit czasu na `computer-use.list_apps`.** Plugin i serwer MCP
są obecne, ale lokalny most Computer Use nie odpowiedział. Zamknij lub uruchom ponownie
Codex Computer Use, w razie potrzeby ponownie uruchom Codex Desktop, a następnie spróbuj ponownie w świeżej sesji OpenClaw. Jeśli host wcześniej uruchamiał Computer Use przez starszy zarządzany Codex app-server, odśwież zainstalowany Plugin z marketplace dołączonego do aplikacji desktopowej:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Narzędzie Computer Use mówi `Native hook relay unavailable`.** Natywny hook narzędzia Codex
nie mógł połączyć się z aktywnym przekaźnikiem OpenClaw przez lokalny most ani
awaryjną ścieżkę Gateway. Rozpocznij świeżą sesję OpenClaw za pomocą `/new` albo `/reset`. Jeśli
zadziała raz, a potem znów zawiedzie przy późniejszym wywołaniu narzędzia, `/new` czyści tylko
bieżącą próbę; uruchom ponownie Codex app-server albo OpenClaw Gateway, aby stare wątki
i rejestracje hooków zostały usunięte, a następnie spróbuj ponownie w świeżej sesji.

**Automatyczna instalacja przy rozpoczęciu tury odmawia użycia źródła.** To celowe. Najpierw dodaj
źródło przez jawne `/codex computer-use install --source <marketplace-source>`,
a wtedy przyszła automatyczna instalacja przy rozpoczęciu tury będzie mogła użyć wykrytego lokalnego
marketplace.

## Powiązane

- [harness Codex](/pl/plugins/codex-harness)
- [mostek Peekaboo](/pl/platforms/mac/peekaboo)
- [aplikacja iOS](/pl/platforms/ios)
