---
read_when:
    - Potrzebne są wszystkie pola konfiguracji środowiska Codex
    - Zmieniasz zachowanie transportu, uwierzytelniania, wykrywania lub limitów czasu serwera aplikacji
    - Debugowanie uruchamiania środowiska testowego Codex, wykrywania modeli lub izolacji środowiska
summary: Dokumentacja konfiguracji, uwierzytelniania, wykrywania i serwera aplikacji dla środowiska Codex
title: Dokumentacja środowiska uruchomieniowego Codex
x-i18n:
    generated_at: "2026-07-16T18:38:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Ten dokument zawiera szczegółową konfigurację oficjalnego pluginu `codex`.
Informacje o konfiguracji i wyborze routingu znajdują się najpierw w sekcji
[Środowisko uruchomieniowe Codex](/pl/plugins/codex-harness).

## Powierzchnia konfiguracji pluginu

Wszystkie ustawienia środowiska uruchomieniowego Codex znajdują się w `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Pola najwyższego poziomu:

| Pole                       | Wartość domyślna         | Znaczenie                                                                                                                                      |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | włączone                 | Ustawienia wykrywania modeli dla serwera aplikacji Codex `model/list`.                                                                          |
| `appServer`                | zarządzany serwer aplikacji stdio | Ustawienia transportu, polecenia, uwierzytelniania, zatwierdzania, piaskownicy i limitów czasu. Zwykłe środowisko uruchomieniowe domyślnie korzysta ze stanu o zakresie agenta. |
| `codexDynamicToolsLoading` | `"searchable"`           | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex.                            |
| `codexDynamicToolsExclude` | `[]`                     | Dodatkowe nazwy dynamicznych narzędzi OpenClaw, które mają być pomijane w turach serwera aplikacji Codex.                                      |
| `codexPlugins`             | wyłączone                | Natywna obsługa pluginów/aplikacji Codex, w tym opcjonalny dostęp do aplikacji połączonego konta. Zobacz [Natywne pluginy Codex](/pl/plugins/codex-native-plugins). |
| `computerUse`              | wyłączone                | Konfiguracja funkcji Codex Computer Use. Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use).                                             |
| `sessionCatalog`           | włączone                 | Natywne wykrywanie sesji Codex na pasku bocznym. Ustaw `enabled: false`, aby wyłączyć wykrywanie bez wyłączania dostawcy ani środowiska uruchomieniowego. |
| `supervision`              | wyłączone                | Dostępne dla agenta zasady transkrypcji sesji natywnych i kontroli zapisu. Zobacz [Nadzór Codex](/plugins/codex-supervision).                   |

## Nadzór

Natywne wykrywanie sesji domyślnie wyświetla niezarchiwizowane sesje Codex z komputera
Gateway oraz z włączonych sparowanych węzłów. Aby wyłączyć wyłącznie ten katalog:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` oddzielnie steruje narzędziami dostępnymi dla agenta:

| Pole                  | Wartość domyślna        | Znaczenie                                                                                                                                                                                                                                 |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Włącza dostępne dla agenta narzędzia nadzoru Codex. Nie steruje to katalogiem sesji uwierzytelnionego operatora.                                                                                                                           |
| `endpoints`           | wbudowany lokalny punkt końcowy | Cele punktów końcowych zgodności i zaawansowane cele dla zachowanego agenta nadzoru Codex oraz samodzielnych narzędzi MCP. Katalog użytkownika i przepływ gałęzi ignorują te cele oraz korzystają z serwera aplikacji nadzoru rozpoznanego na podstawie `appServer`. |
| `allowRawTranscripts` | `false`                 | Przy włączonym nadzorze zezwala autonomicznemu agentowi lub samodzielnemu MCP na odczyt transkrypcji i pól list pochodzących z transkrypcji. Odczyty `codex_threads` obejmujące tylko metadane pozostają dostępne. Nie steruje to uwierzytelnioną kontynuacją w interfejsie Control UI. |
| `allowWriteControls`  | `false`                 | Przy włączonym nadzorze zezwala na autonomiczne operacje `codex_threads`: rozwidlanie, zmianę nazwy, archiwizowanie i cofanie archiwizacji, a także na samodzielne operacje MCP: wysyłanie, sterowanie i przerywanie. Nie pomija innych kontroli powiązania, hosta, stanu ani potwierdzenia. |

Wpisy punktów końcowych obsługują następujące pola:

| Pole           | Dotyczy        | Znaczenie                                                             |
| -------------- | -------------- | --------------------------------------------------------------------- |
| `id`           | wszystkich    | Stabilny identyfikator punktu końcowego.                              |
| `label`        | wszystkich    | Opcjonalna etykieta wyświetlana.                                      |
| `transport`    | wszystkich    | `"stdio-proxy"` lub `"websocket"`.                                    |
| `command`      | `stdio-proxy` | Opcjonalne polecenie serwera aplikacji.                               |
| `args`         | `stdio-proxy` | Opcjonalne argumenty polecenia.                                       |
| `cwd`          | `stdio-proxy` | Opcjonalny katalog roboczy procesu podrzędnego.                        |
| `url`          | `websocket`   | Wymagany adres URL WebSocket lub obsługiwanego lokalnego gniazda.     |
| `authTokenEnv` | `websocket`   | Opcjonalna zmienna środowiskowa, której wartość uwierzytelnia punkt końcowy. |

Strona **Sesje Codex** korzysta z serwera aplikacji nadzoru pluginu i wyświetla
wyłącznie niezarchiwizowane sesje. Bez jawnych ustawień połączenia `appServer`
połączenie to jest zarządzanym stdio w katalogu domowym użytkownika. Zapisane lub bezczynne wiersze lokalne mogą utworzyć
czat z zablokowanym modelem i ograniczoną historią użytkownika oraz asystenta, obejmującą ostatnią
końcową utrwaloną turę źródłową. Jego prywatne powiązanie utrzymuje rozwidlenie migawki,
kanoniczną gałąź źródłową `appServer`, wstrzykiwanie historii oraz późniejsze tury w tym
połączeniu. Pierwsze kanoniczne uruchomienie używa pary zwróconej przez rozwidlenie. Późniejsze
wznowienia pomijają nadpisania modelu i dostawcy OpenClaw, dzięki czemu Codex przywraca
utrwaloną parę kanonicznego wątku; oddzielna natywna zmiana może zaktualizować tę
parę, ale zewnętrzny model i łańcuch awaryjny nigdy jej nie zastępują. Zapisane i bezczynne
wiersze mogą zostać zarchiwizowane po potwierdzeniu braku innych procesów wykonawczych, chyba że inne aktywne
powiązanie OpenClaw jest właścicielem dokładnego celu lub jednego z jego niezarchiwizowanych utworzonych
potomków. OpenClaw korzysta ze stronicowania potomków Codex i bezpiecznie odmawia działania w przypadku
błędów wyliczania, cykli lub wyczerpania limitu bezpieczeństwa. Potwierdzenie nadal
obejmuje nieznanych klientów natywnych oraz sytuację wyścigu między stanem a archiwizacją. Nadzorowanego
czatu z zablokowanym modelem nie można usunąć, gdy chroni natywne powiązanie.
Aktywne źródła nie mogą tworzyć gałęzi ani być archiwizowane, ale istniejący nadzorowany
czat można nadal otworzyć. Każdy wiersz sparowanego węzła pozostaje tylko do odczytu; transport
węzła nie udostępnia jeszcze cyklu życia przesyłania strumieniowego wymaganego przez środowisko uruchomieniowe.

Samo `appServer.homeScope: "user"` zmienia katalog domowy Codex używany przez zarządzany proces
środowiska uruchomieniowego; nie publikuje katalogu floty. Włączenie nadzoru nie
zmienia wartości domyślnej środowiska uruchomieniowego. Zamiast tego oddzielne połączenie nadzoru
domyślnie korzysta z zarządzanego stdio w katalogu domowym użytkownika, jeśli nie istnieją jawne
ustawienia połączenia `appServer`. Jawne ustawienia są stosowane do tego połączenia.
Oczekujące i zatwierdzone nadzorowane powiązania zachowują to połączenie w każdej turze;
wyłączony nadzór lub rozbieżność połączenia albo cyklu życia powoduje bezpieczną odmowę działania zamiast
przełączenia awaryjnego na środowisko uruchomieniowe w katalogu domowym agenta. Domyślne połączenie współdzieli zapisane
sesje z natywnymi klientami Codex, ale nie ich lokalny dla procesu stan aktywności.

Starsze ustawienia `plugins.entries.codex-supervisor` zostały wycofane. Uruchom
`openclaw doctor --fix`, aby przenieść stary wpis, definicje punktów końcowych, flagi
zasad oraz odwołania zezwalające lub zabraniające pluginów do tego bloku. Jawne kanoniczne
wartości `codex.config.supervision` mają pierwszeństwo w przypadku konfliktów.

## Transport serwera aplikacji

W przypadku zwykłych tur środowiska uruchomieniowego OpenClaw uruchamia zarządzany plik binarny Codex dostarczany
z oficjalnym pluginem (obecnie `@openai/codex` `0.144.3`):

```bash
codex app-server --listen stdio://
```

Dzięki temu wersja serwera aplikacji pozostaje powiązana z oficjalnym pluginem `codex`, zamiast
z dowolnym oddzielnym CLI Codex zainstalowanym lokalnie. Ustaw
`appServer.command` tylko wtedy, gdy celowo ma być używany inny plik wykonywalny.
Zwykłe zarządzane tury z domyślnym izolowanym katalogiem domowym agenta preferują ten przypięty
pakiet nawet wtedy, gdy zainstalowany jest pakiet aplikacji komputerowej macOS. Gdy funkcja
[Computer Use](/pl/plugins/codex-computer-use) jest włączona lub gdy `homeScope` ma wartość
`"user"` i może wczytać natywny stan Computer Use, zarządzane uruchamianie zamiast tego preferuje
plik binarny aplikacji komputerowej, która ma wymagane uprawnienia macOS. Ta sama
zasada pierwszeństwa aplikacji komputerowej obowiązuje, gdy efektywna konfiguracja Codex w izolowanym katalogu domowym agenta
włącza natywną funkcję Computer Use. Jeśli nie jest zainstalowany pakiet aplikacji komputerowej, OpenClaw
przełącza się awaryjnie na plik binarny z przypiętego pakietu.

Przekazywanie pliku wykonywalnego i ograniczanie konfiguracji natywnej koordynują klientów w ramach jednego
działającego procesu Gateway. Uruchom ponownie Gateway po zmianie konfiguracji natywnego pluginu Codex przez inny proces.

Nadzór rozpoznaje oddzielne połączenie. Bez jawnych
ustawień połączenia `appServer` korzysta z zarządzanego stdio z `homeScope: "user"`;
zwykłe środowisko uruchomieniowe nadal korzysta z zarządzanego stdio z `homeScope: "agent"`. Jawne
ustawienia połączenia są stosowane w obu ścieżkach. Ustaw jawnie `homeScope: "user"`,
gdy zwykłe środowisko uruchomieniowe ma współdzielić `$CODEX_HOME` (lub `~/.codex`)
z klientami natywnymi. Prywatne nadzorowane powiązanie korzysta z połączenia nadzoru
niezależnie od wartości domyślnej zwykłego środowiska uruchomieniowego. Niezależne procesy serwera aplikacji
zachowują oddzielny bieżący stan i stan zatwierdzeń.

W przypadku już działającego serwera aplikacji użyj transportu WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Pola `appServer`:

| Pole                                         | Wartość domyślna                                                | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; jawne `"unix"` łączy się z lokalnym gniazdem sterującym; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` izoluje zwykły stan środowiska testowego dla każdego agenta OpenClaw. `"user"` to jawna opcja wymagająca włączenia, która współdzieli natywne `$CODEX_HOME` lub `~/.codex`, używa natywnego uwierzytelniania i włącza zarządzanie wątkami wyłącznie przez właściciela. Zakres użytkownika obsługuje lokalny transport stdio lub Unix. W przypadku oddzielnego połączenia nadzorczego nieustawiona wartość jest rozwiązywana jako `"user"` dla stdio lub Unix oraz `"agent"` dla WebSocket.     |
| `command`                                     | zarządzany plik wykonywalny Codex                                   | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku wykonywalnego.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | nieustawione                                                  | Adres URL App Server WebSocket lub adres URL `unix://`. Jawnie określona pusta ścieżka Unix wybiera kanoniczne gniazdo sterujące w katalogu domowym użytkownika.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | nieustawione                                                  | Token Bearer dla transportu WebSocket. Akceptuje ciąg literału lub SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują ciągi literałów lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nazwy dodatkowych zmiennych środowiskowych usuwanych z uruchomionego procesu serwera aplikacji stdio po utworzeniu przez OpenClaw dziedziczonego środowiska.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | nieustawione                                                  | Katalog główny zdalnego obszaru roboczego serwera aplikacji Codex. Po ustawieniu OpenClaw wyznacza katalog główny lokalnego obszaru roboczego na podstawie rozwiązanego obszaru roboczego OpenClaw, zachowuje bieżący sufiks cwd w tym zdalnym katalogu głównym i wysyła do Codex tylko końcowy cwd serwera aplikacji. Jeśli cwd znajduje się poza rozwiązanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw bezpiecznie odmawia działania zamiast wysyłać lokalną ścieżkę Gateway do zdalnego serwera aplikacji. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Instaluje podproces Codex `PreToolUse`, używany wyłącznie do wykrywania pętli OpenClaw i jego jawnego znacznika braku zasad. Ustaw `false`, aby ograniczyć rozgałęzianie procesów dla poszczególnych narzędzi. Hooki Pluginów wykonywane przed narzędziem oraz zasady zaufanych narzędzi nadal instalują wymagany przekaźnik.                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | Limit czasu wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Okno ciszy po zaakceptowaniu tury przez Codex lub po żądaniu serwera aplikacji dotyczącym danej tury, gdy OpenClaw oczekuje na `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Zabezpieczenie bezczynności ukończenia i postępu używane po przekazaniu do narzędzia, ukończeniu działania natywnego narzędzia, surowym postępie asystenta po użyciu narzędzia, ukończeniu surowego rozumowania lub postępie rozumowania, gdy OpenClaw oczekuje na `turn/completed`. Należy go używać w przypadku zaufanych lub wymagających obciążeń, w których synteza po użyciu narzędzia może zasadnie pozostawać bezczynna dłużej niż pozwala na to końcowy budżet udostępnienia odpowiedzi asystenta.                                |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex nie zezwalają na YOLO | Ustawienie wstępne dla wykonywania YOLO lub wykonywania sprawdzanego przez strażnika.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` lub dozwolona zasada zatwierdzania przez strażnika       | Natywna zasada zatwierdzania Codex wysyłana przy rozpoczęciu i wznowieniu wątku oraz podczas tury.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` lub dozwolona piaskownica strażnika  | Natywny tryb piaskownicy Codex wysyłany przy rozpoczęciu i wznowieniu wątku. Aktywne piaskownice OpenClaw zawężają tury `danger-full-access` do `workspace-write` Codex; flaga sieciowa tury jest zgodna z ruchem wychodzącym piaskownicy OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent-strażnik               | Użyj `"auto_review"`, aby zezwolić Codex na sprawdzanie natywnych monitów o zatwierdzenie, gdy jest to dozwolone.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | katalog bieżącego procesu                              | Obszar roboczy używany przez `/codex bind`, gdy pominięto `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | nieustawione                                                  | Opcjonalny poziom usługi serwera aplikacji Codex. `"priority"` włącza routing w trybie szybkim, `"flex"` żąda elastycznego przetwarzania, a `null` usuwa nadpisanie. Starsza wartość `"fast"` jest akceptowana jako `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | wyłączone                                               | Włącza obsługę sieci na podstawie profilu uprawnień Codex dla poleceń serwera aplikacji. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją za pomocą `default_permissions` zamiast wysyłać `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Opcja podglądowa wymagająca włączenia, która rejestruje środowisko Codex oparte na piaskownicy OpenClaw w obsługiwanym serwerze aplikacji Codex, dzięki czemu natywne wykonywanie Codex może odbywać się wewnątrz aktywnej piaskownicy OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt piaskownicy
Codex. Po włączeniu OpenClaw ustawia również `features.network_proxy.enabled` i
`default_permissions` w konfiguracji wątku Codex, aby wygenerowany profil uprawnień
mógł uruchamiać sieć zarządzaną przez Codex. Domyślnie OpenClaw generuje odporną
na kolizje nazwę profilu `openclaw-network-<fingerprint>` na podstawie treści
profilu; `profileName` należy używać tylko wtedy, gdy wymagana jest stabilna
nazwa lokalna.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Jeśli normalnym środowiskiem uruchomieniowym serwera aplikacji byłoby `danger-full-access`, włączenie
`networkProxy` powoduje zamiast tego użycie dostępu do systemu plików w stylu przestrzeni roboczej
dla wygenerowanego profilu uprawnień. Egzekwowanie dostępu do sieci zarządzane przez Codex jest siecią
działającą w piaskownicy, dlatego profil pełnego dostępu nie chroniłby ruchu wychodzącego.

Plugin blokuje starsze lub niewersjonowane uzgadnianie połączenia z serwerem aplikacji: serwer aplikacji Codex
musi zgłaszać stabilną wersję `0.143.0` lub nowszą.

OpenClaw traktuje adresy URL serwera aplikacji WebSocket spoza interfejsu zwrotnego jako zdalne i wymaga
uwierzytelniania WebSocket zawierającego tożsamość za pośrednictwem `appServer.authToken` lub
nagłówka `Authorization`. `appServer.authToken` oraz każda wartość `appServer.headers.*`
mogą być typu SecretInput; środowisko uruchomieniowe sekretów rozwiązuje SecretRefs i skrócony zapis zmiennych
środowiskowych, zanim OpenClaw utworzy opcje uruchomienia serwera aplikacji, a nierozwiązane
ustrukturyzowane SecretRefs powodują błąd przed wysłaniem jakiegokolwiek tokenu lub nagłówka. Gdy skonfigurowane
są natywne pluginy Codex, OpenClaw używa płaszczyzny sterowania pluginami połączonego serwera aplikacji,
aby zainstalować lub odświeżyć te pluginy, a następnie odświeża spis aplikacji, dzięki czemu aplikacje należące
do pluginów są widoczne dla wątku Codex. `app/list` nadal jest
autorytatywnym źródłem spisu i metadanych, ale zasady OpenClaw
decydują, czy `thread/start` wysyła `config.apps[appId].enabled = true` dla
wymienionej dostępnej aplikacji, nawet jeśli Codex obecnie oznacza ją jako wyłączoną. Nieznane lub
brakujące identyfikatory aplikacji nadal powodują bezpieczne odrzucenie; ta ścieżka aktywuje jedynie pluginy
z marketplace za pośrednictwem `plugin/install` i odświeża spis. OpenClaw należy łączyć wyłącznie ze
zdalnymi serwerami aplikacji, którym można zaufać w zakresie przyjmowania instalacji pluginów zarządzanych
przez OpenClaw i odświeżania spisu aplikacji.

## Tryby zatwierdzania i piaskownicy

Lokalne sesje serwera aplikacji stdio domyślnie działają w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` i
`sandbox: "danger-full-access"`. Ta konfiguracja zaufanego lokalnego operatora umożliwia
nienadzorowanym turom OpenClaw i Heartbeat postęp bez natywnych monitów o zatwierdzenie,
na które nikt nie może odpowiedzieć.

Jeśli lokalny plik wymagań systemowych Codex nie zezwala na niejawne zatwierdzanie YOLO,
wartości recenzenta lub piaskownicy, OpenClaw traktuje niejawne ustawienie domyślne jako guardian
i wybiera dozwolone uprawnienia guardian. `tools.exec.mode: "auto"`
wymusza również zatwierdzanie Codex sprawdzane przez guardian i nie zachowuje niebezpiecznych
starszych nadpisań `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`;
aby celowo wyłączyć zatwierdzanie, należy ustawić `tools.exec.mode: "full"`.
Wpisy `[[remote_sandbox_config]]` pasujące do nazwy hosta w tym samym pliku wymagań
są uwzględniane przy wyborze domyślnej piaskownicy.

Aby używać zatwierdzania Codex sprawdzanego przez guardian, należy ustawić `appServer.mode: "guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Ustawienie wstępne `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` i `sandbox: "workspace-write"`, jeśli te
wartości są dozwolone. Poszczególne pola zasad zastępują `mode`. Starsza
wartość recenzenta `guardian_subagent` jest nadal akceptowana jako alias zgodności,
ale nowe konfiguracje powinny używać `auto_review`.

Gdy piaskownica OpenClaw jest aktywna, lokalny proces serwera aplikacji Codex nadal
działa na hoście Gateway. Dlatego OpenClaw wyłącza dla tej tury natywny tryb Code Mode
Codex, serwery MCP użytkownika i wykonywanie pluginów wspieranych przez aplikacje, zamiast
traktować piaskownicę Codex po stronie hosta jako równoważną zapleczu piaskownicy OpenClaw.
Dostęp do powłoki jest udostępniany za pośrednictwem dynamicznych narzędzi korzystających
z piaskownicy OpenClaw, takich jak `sandbox_exec` i `sandbox_process`, gdy dostępne
są standardowe narzędzia exec/process.

<Note>
Na hostach piaskownicy OpenClaw opartych na Dockerze (`agents.defaults.sandbox.mode` ustawione na
zaplecze Docker) `openclaw doctor` sprawdza, czy host zezwala na przestrzenie nazw
użytkownika bez uprawnień (oraz sieciowe, gdy wychodzący ruch sieciowy piaskownicy Docker
jest wyłączony), których zagnieżdżony `bwrap` Codex potrzebuje do wykonywania
powłoki `workspace-write` wewnątrz kontenera piaskownicy. Nieudane sprawdzenie zwykle
objawia się jako `bwrap: setting up uid map: Permission denied` lub
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` na
hostach Ubuntu/AppArmor. Należy naprawić zgłoszone zasady przestrzeni nazw hosta dla
użytkownika usługi OpenClaw i ponownie uruchomić Gateway; preferowany jest profil AppArmor
ograniczony do procesu usługi zamiast ogólnosystemowego rozwiązania awaryjnego
`kernel.apparmor_restrict_unprivileged_userns=0`. Nie należy przyznawać
szerszych uprawnień kontenerowi Docker wyłącznie w celu spełnienia wymagań zagnieżdżonego `bwrap`.
</Note>

## Natywne wykonywanie w piaskownicy

Stabilnym ustawieniem domyślnym jest bezpieczne odrzucenie: aktywna piaskownica OpenClaw wyłącza natywne
powierzchnie wykonywania Codex, które w przeciwnym razie działałyby na hoście serwera aplikacji Codex.
Opcji `appServer.experimental.sandboxExecServer: true` należy używać tylko wtedy, gdy ma zostać
wypróbowana obsługa zdalnego środowiska Codex z zapleczem piaskownicy OpenClaw.
Ta ścieżka eksperymentalna działa z każdą obsługiwaną wersją serwera aplikacji Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Gdy flaga jest włączona, a bieżąca sesja OpenClaw działa w piaskownicy, OpenClaw
uruchamia lokalny serwer wykonywania na interfejsie zwrotnym, obsługiwany przez aktywną piaskownicę, rejestruje go
w serwerze aplikacji Codex i uruchamia wątek oraz turę Codex z tym
środowiskiem należącym do OpenClaw. Jeśli serwer aplikacji nie może zarejestrować środowiska,
uruchomienie zostaje bezpiecznie odrzucone zamiast niejawnie przełączyć się na wykonywanie na hoście.

Ta ścieżka eksperymentalna działa wyłącznie lokalnie. Zdalny serwer aplikacji WebSocket nie może uzyskać dostępu
do serwera wykonywania na interfejsie zwrotnym, chyba że działa na tym samym hoście, dlatego OpenClaw
odrzuca taką kombinację.

## Izolacja uwierzytelniania i środowiska

W domyślnym katalogu domowym przypisanym do agenta uwierzytelnianie jest wybierane w następującej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko w przypadku lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy nie istnieje konto serwera aplikacji, a uwierzytelnianie OpenAI
   jest nadal wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex typu subskrypcji ChatGPT (OAuth lub
typ poświadczeń tokenowych), usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z
uruchomionego procesu podrzędnego Codex. Dzięki temu klucze API na poziomie Gateway pozostają dostępne
dla osadzania lub bezpośrednich modeli OpenAI, bez przypadkowego rozliczania natywnych tur
serwera aplikacji Codex przez API.

Jawne profile klucza API Codex oraz lokalne awaryjne użycie klucza ze środowiska stdio korzystają
z logowania serwera aplikacji zamiast ze środowiska odziedziczonego przez proces podrzędny. Połączenia z serwerem aplikacji
WebSocket nie otrzymują awaryjnego klucza API ze środowiska Gateway; należy użyć jawnego profilu uwierzytelniania
lub własnego konta zdalnego serwera aplikacji.

Uruchomienia serwera aplikacji stdio domyślnie dziedziczą środowisko procesu OpenClaw.
OpenClaw zarządza mostem konta serwera aplikacji Codex i ustawia `CODEX_HOME` na
katalog przypisany do agenta w stanie OpenClaw tego agenta. Dzięki temu konfiguracja,
konta, pamięć podręczna i dane pluginów oraz stan wątków Codex pozostają ograniczone do agenta OpenClaw,
zamiast przenikać z osobistego katalogu domowego `~/.codex` operatora.

Aby współdzielić natywny stan Codex z Codex Desktop i CLI, należy ustawić `appServer.homeScope: "user"`.
Ten tryb lokalnego katalogu domowego użytkownika obsługuje zarządzane stdio i
jawny transport Unix. Używa `$CODEX_HOME`, gdy jest ustawione, a w przeciwnym razie `~/.codex`,
w tym natywnego uwierzytelniania, konfiguracji, pluginów i wątków.
OpenClaw pomija swój most profilu uwierzytelniania dla serwera aplikacji. Zweryfikowane tury właściciela
mogą używać `codex_threads` do wyświetlania listy (z opcjonalnym filtrem `search`),
odczytywania, rozwidlania, zmiany nazwy, archiwizowania i przywracania tych wątków z archiwum. Przed
kontynuowaniem wątku w OpenClaw należy go rozwidlić; niezależne procesy Codex nie koordynują
równoczesnego zapisu do tego samego wątku.

To dobrowolne ustawienie `homeScope` dotyczy zwykłych sesji uprzęży. Czat utworzony
za pośrednictwem Codex Sessions korzysta zamiast tego z prywatnego połączenia nadzorującego, które
zachowuje konfigurację uwierzytelniania i dostawcy natywnego połączenia dla
kanonicznej gałęzi i przyszłych wznowień.

W nadzorowanym Czacie z zablokowanym modelem `codex_threads` nie może dołączyć innego
rozwidlenia ani zarchiwizować natywnego wątku powiązanego z Czatem. Lista i odczyt samych metadanych
pozostają dostępne. Odczyt surowego transkryptu wymaga `allowRawTranscripts`; gdy ta opcja
jest wyłączona, wyszukiwanie na liście jest również odrzucane, ponieważ natywne wyszukiwanie może dopasowywać
podglądy transkryptów. Zmiana nazwy, przywracanie z archiwum, odłączone rozwidlenie i archiwizowanie
niepowiązanego wątku, który nie należy do innego Czatu OpenClaw, wymagają
`allowWriteControls`. Żadna z tych opcji nie omija zablokowanego powiązania.

OpenClaw nie zmienia `HOME` podczas normalnych lokalnych uruchomień serwera aplikacji.
Procesy podrzędne uruchamiane przez Codex, takie jak `openclaw`, `gh`, `git`, narzędzia CLI usług chmurowych i polecenia
powłoki, widzą normalny katalog domowy procesu i mogą znaleźć konfigurację oraz
tokeny z katalogu domowego użytkownika. Codex może również wykrywać `$HOME/.agents/skills` i
`$HOME/.agents/plugins/marketplace.json`; to wykrywanie `.agents` jest
celowo współdzielone z katalogiem domowym operatora i pozostaje oddzielone od izolowanego
stanu `~/.codex`.

W domyślnym zakresie agenta pluginy OpenClaw i migawki Skills OpenClaw
nadal przepływają przez własny rejestr pluginów i moduł ładujący Skills OpenClaw; osobiste
zasoby Codex `~/.codex` nie są uwzględniane. Jeśli w katalogu domowym Codex znajdują się przydatne Skills CLI Codex lub
pluginy, które powinny stać się częścią izolowanego agenta OpenClaw,
należy jawnie utworzyć ich spis:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Jeśli wdrożenie wymaga dodatkowej izolacji środowiska, należy dodać te zmienne
do `appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` wpływa wyłącznie na uruchomiony proces podrzędny serwera aplikacji Codex.
OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji lokalnego uruchomienia:
`CODEX_HOME` pozostaje skierowane do wybranego zakresu agenta lub użytkownika,
a `HOME` pozostaje dziedziczone, aby procesy podrzędne mogły korzystać z normalnego stanu katalogu domowego użytkownika.

## Narzędzia dynamiczne

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable` i są udostępniane w
przestrzeni nazw `openclaw` za pomocą `deferLoading: true`. OpenClaw zwykle nie
udostępnia narzędzi dynamicznych, które powielają natywne operacje Codex na przestrzeni roboczej lub
własną powierzchnię wyszukiwania narzędzi Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

Gdy skończona lista dozwolonych elementów środowiska uruchomieniowego wyłącza natywny tryb Code Mode, OpenClaw wysyła
pusty wybór środowiska wykonywania. W takim bezpośrednim przypadku bez piaskownicy
OpenClaw zachowuje filtrowane przez zasady narzędzia `exec` i `process` jako
awaryjny dostęp do powłoki. Listy dozwolonych elementów środowiska uruchomieniowego i `codexDynamicToolsExclude` nadal obowiązują.

Większość pozostałych narzędzi integracyjnych OpenClaw, takich jak wiadomości, multimedia, cron,
przeglądarka, węzły, Gateway, `heartbeat_respond` i `web_search`, jest dostępna
za pośrednictwem wyszukiwania narzędzi Codex w tej przestrzeni nazw. Dzięki temu początkowy
kontekst modelu jest mniejszy. Niewielki zestaw narzędzi pozostaje dostępny do bezpośredniego wywołania niezależnie od
`codexDynamicToolsLoading`, ponieważ wyszukiwanie narzędzi Codex może być niedostępne lub
zwracać wyłącznie zestaw konektorów: `agents_list`, `sessions_spawn` i
`sessions_yield`. Instrukcje deweloperskie nadal kierują zwykłe podagenty Codex
do natywnego `spawn_agent` w przypadku pracy podagentów natywnej dla Codex, natomiast
`sessions_spawn` pozostaje dostępne do jawnego delegowania przez OpenClaw lub ACP.
Odpowiedzi źródłowe korzystające wyłącznie z narzędzia wiadomości również pozostają bezpośrednie, ponieważ jest to
kontrakt sterowania turą.

Narzędzia oznaczone jako `catalogMode: "direct-only"`, w tym narzędzie OpenClaw `computer`,
są grupowane w przestrzeni nazw `openclaw_direct`. OpenClaw dodaje tę przestrzeń nazw do
listy `code_mode.direct_only_tool_namespaces` Codex bez zastępowania
wpisów dostarczonych przez operatora. Dlatego Codex udostępnia te narzędzia jako
`DirectModelOnly` w zwykłych wątkach i wątkach działających wyłącznie w trybie kodu, zamiast kierować je
przez zagnieżdżone wywołania Code Mode `tools.*`. Ta granica jest niezbędna w przypadku
wyników zawierających obrazy: zagnieżdżona serializacja Code Mode spłaszcza dane wyjściowe obrazu do
tekstu, co spowodowałoby odrzucenie zrzutu ekranu potrzebnego do następnej operacji na komputerze.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
serwerem aplikacji Codex, który nie może wyszukiwać odroczonych narzędzi dynamicznych, lub podczas debugowania
pełnego ładunku narzędzi.

## Limity czasu

Wywołania narzędzi dynamicznych należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`. Każde żądanie Codex `item/tool/call` używa
pierwszego dostępnego limitu czasu w następującej kolejności:

- Dodatni argument `timeoutMs` dla danego wywołania.
- Dla `image_generate`: `agents.defaults.imageGenerationModel.timeoutMs`.
- Dla `image_generate` bez skonfigurowanego limitu czasu: domyślny limit generowania obrazów wynoszący 120 sekund.
- Dla narzędzia rozumienia multimediów `image`: `tools.media.image.timeoutSeconds`
  przeliczone na milisekundy lub domyślny limit multimediów wynoszący 60 sekund. W przypadku
  rozumienia obrazów dotyczy to samego żądania i nie jest pomniejszane o
  wcześniejsze prace przygotowawcze.
- Dla narzędzia `message`: stały domyślny limit wynoszący 120 sekund.
- Domyślny limit narzędzia dynamicznego wynoszący 90 sekund.

Ten mechanizm nadzorujący wyznacza zewnętrzny budżet dynamicznego `item/tool/call`. Limity czasu
żądań specyficzne dla dostawcy działają wewnątrz tego wywołania i zachowują własną semantykę limitów czasu.
Budżety narzędzi dynamicznych są ograniczone do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa
sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do
Codex odpowiedź o niepowodzeniu narzędzia dynamicznego, dzięki czemu tura może być kontynuowana, zamiast pozostawiać sesję w stanie
`processing`.

Po zaakceptowaniu tury przez Codex oraz po udzieleniu przez OpenClaw odpowiedzi na żądanie serwera aplikacji
ograniczone do tury, mechanizm wykonawczy oczekuje, że Codex poczyni postępy w bieżącej turze
i ostatecznie zakończy natywną turę za pomocą `turn/completed`. Jeśli
serwer aplikacji nie wykazuje aktywności przez `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
w miarę możliwości przerywa turę Codex, rejestruje diagnostyczne przekroczenie limitu czasu i
zwalnia tor sesji OpenClaw, aby kolejne wiadomości czatu nie oczekiwały w kolejce
za nieaktualną natywną turą.

Większość powiadomień niekończących tej samej tury rozbraja ten krótki mechanizm nadzorujący,
ponieważ Codex potwierdził, że tura jest nadal aktywna. Przekazania narzędzi korzystają z dłuższego
budżetu bezczynności po użyciu narzędzia: po zwróceniu przez OpenClaw odpowiedzi `item/tool/call`,
po zakończeniu natywnych elementów narzędzi, takich jak `commandExecution`, po zakończeniu nieprzetworzonych
`custom_tool_call_output` oraz po nieprzetworzonym postępie asystenta
po użyciu narzędzia, zakończeniu nieprzetworzonego rozumowania lub postępie rozumowania. Mechanizm zabezpieczający używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, jeśli skonfigurowano tę wartość,
a w przeciwnym razie domyślnie pięciu minut. Ten sam budżet po użyciu narzędzia wydłuża również
mechanizm nadzorujący postęp w cichym okresie syntezy, zanim Codex wyemituje
następne zdarzenie bieżącej tury. Zakończenia rozumowania, zakończenia komentarza `agentMessage`
oraz nieprzetworzone rozumowanie lub postęp asystenta przed użyciem narzędzia mogą poprzedzać
automatyczną odpowiedź końcową, dlatego korzystają z mechanizmu zabezpieczającego odpowiedź po postępie
zamiast natychmiastowego zwolnienia toru sesji. Tylko końcowe elementy `agentMessage`,
które nie są komentarzami, oraz nieprzetworzone zakończenia asystenta przed użyciem narzędzia uruchamiają
zwalnianie po wygenerowaniu odpowiedzi asystenta: jeśli następnie Codex nie wykazuje aktywności bez `turn/completed`,
OpenClaw w miarę możliwości przerywa natywną turę i zwalnia tor
sesji. Bezpieczne do ponownego odtworzenia awarie serwera aplikacji stdio, w tym limity czasu bezczynności
podczas kończenia tury bez dowodów na odpowiedź asystenta, użycie narzędzia, aktywny element lub efekt uboczny,
są ponawiane raz w nowej próbie serwera aplikacji. Niebezpieczne limity czasu nadal wycofują
zablokowanego klienta serwera aplikacji i zwalniają tor sesji OpenClaw. Powodują też
usunięcie nieaktualnego powiązania natywnego wątku zamiast automatycznego
ponownego odtworzenia. Limity czasu oczekiwania na zakończenie wyświetlają tekst dotyczący limitu czasu specyficzny dla Codex:
w przypadkach bezpiecznych do ponownego odtworzenia informują, że odpowiedź może być niekompletna, natomiast w przypadkach niebezpiecznych zalecają
sprawdzenie bieżącego stanu przed ponowieniem. Publiczna diagnostyka limitów czasu
zawiera pola strukturalne, takie jak ostatnia metoda powiadomienia serwera aplikacji,
identyfikator/typ/rola elementu nieprzetworzonej odpowiedzi asystenta, liczba aktywnych żądań/elementów oraz
stan aktywnego mechanizmu nadzorującego. Gdy ostatnim powiadomieniem jest element nieprzetworzonej odpowiedzi
asystenta, diagnostyka zawiera również ograniczony podgląd tekstu asystenta. Nie
zawiera nieprzetworzonej treści promptu ani narzędzia.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacji o dostępne modele. Dostępność
modeli jest kontrolowana przez serwer aplikacji Codex, dlatego lista może się zmienić, gdy
OpenClaw zaktualizuje dołączoną wersję `@openai/codex` lub gdy wdrożenie
skieruje `appServer.command` do innego pliku binarnego Codex. Dostępność może być również
zależna od konta. Użyj `/codex models` na działającym Gateway, aby wyświetlić aktualny
katalog dla tego mechanizmu wykonawczego i konta.

Jeśli wykrywanie nie powiedzie się lub przekroczy limit czasu, OpenClaw użyje dołączonego katalogu awaryjnego:

| Identyfikator modelu | Nazwa wyświetlana | Poziomy intensywności rozumowania |
| -------------------- | ----------------- | --------------------------------- |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
Bieżący dołączony mechanizm wykonawczy to `@openai/codex` `0.144.3`. Sonda `model/list`
wykonana względem tego dołączonego serwera aplikacji zwróciła następujące publiczne wiersze selektora:

| Identyfikator modelu | Modalności wejściowe | Poziomy intensywności rozumowania    |
| -------------------- | -------------------- | ------------------------------------ |
| `gpt-5.6-sol`   | tekst, obraz         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | tekst, obraz         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | tekst, obraz         | low, medium, high, xhigh, max        |
| `gpt-5.5`       | tekst, obraz         | low, medium, high, xhigh             |
| `gpt-5.4`       | tekst, obraz         | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | tekst, obraz         | low, medium, high, xhigh             |
| `gpt-5.2`       | tekst, obraz         | low, medium, high, xhigh             |

Katalog serwera aplikacji może zgłaszać `ultra`; mechanizmy sterowania rozumowaniem OpenClaw obecnie
udostępniają poziomy do `max`.

Aktualne wiersze selektora są zależne od konta i mogą się zmieniać wraz z kontem, katalogiem
Codex lub dołączoną wersją; należy uruchomić `/codex models`, aby uzyskać bieżącą listę, zamiast
polegać na tabeli z określonego momentu. Ukryte modele mogą również pojawiać się w
katalogu serwera aplikacji na potrzeby wewnętrznych lub wyspecjalizowanych przepływów, nie będąc zwykłymi
opcjami selektora modeli.
</Note>

Dostosuj wykrywanie w sekcji `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Wyłącz wykrywanie, jeśli proces uruchamiania ma nie sondować Codex i używać wyłącznie
katalogu awaryjnego:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Pliki inicjalizacji przestrzeni roboczej

Codex samodzielnie obsługuje `AGENTS.md` za pomocą natywnego wykrywania dokumentacji projektu.
OpenClaw nie zapisuje syntetycznych plików dokumentacji projektu Codex ani nie korzysta z
awaryjnych nazw plików Codex dla plików persony, ponieważ mechanizmy awaryjne Codex mają zastosowanie tylko wtedy, gdy
brakuje `AGENTS.md`.

Aby zachować zgodność przestrzeni roboczej OpenClaw, mechanizm wykonawczy Codex przekazuje pozostałe
pliki inicjalizacji jako instrukcje deweloperskie, ale nie w identyczny sposób:

- `TOOLS.md` jest przekazywane jako **dziedziczone** instrukcje deweloperskie Codex, dzięki czemu
  natywne podagenty Codex uruchomione podczas tury również je otrzymują.
- `SOUL.md`, `IDENTITY.md` i `USER.md` są przekazywane jako **ograniczone do tury**
  instrukcje współpracy. Natywne podagenty Codex ich nie dziedziczą,
  dzięki czemu tury podagentów nie przejmują persony i
  profilu użytkownika agenta nadrzędnego.
- Skrócona lista załadowanych Skills OpenClaw jest również przekazywana jako ograniczone do tury
  deweloperskie instrukcje współpracy, dlatego natywne podagenty Codex także
  jej nie dziedziczą.
- Treść `HEARTBEAT.md` nie jest wstrzykiwana; tury Heartbeat otrzymują
  w trybie współpracy wskazówkę, aby odczytać plik, jeśli istnieje i
  nie jest pusty.
- Treść `MEMORY.md` ze skonfigurowanej przestrzeni roboczej agenta nie jest wklejana do
  danych wejściowych natywnej tury Codex, gdy dla tej
  przestrzeni roboczej dostępne są narzędzia pamięci; jeśli plik istnieje, mechanizm wykonawczy dodaje małą wskazówkę dotyczącą pamięci
  przestrzeni roboczej do ograniczonych do tury deweloperskich instrukcji współpracy, a Codex
  powinien użyć `memory_search` lub `memory_get`, gdy istotna jest pamięć trwała.
  Jeśli narzędzia są wyłączone, wyszukiwanie w pamięci jest niedostępne lub aktywna
  przestrzeń robocza różni się od przestrzeni roboczej pamięci agenta, `MEMORY.md` korzysta ze
  zwykłej, ograniczonej ścieżki kontekstu tury.
- `BOOTSTRAP.md`, jeśli jest dostępne, jest przekazywane jako kontekst referencyjny danych wejściowych
  tury OpenClaw.

## Nadpisania środowiskowe

Nadpisania środowiskowe pozostają dostępne na potrzeby testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast niego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych. Konfiguracja jest
preferowana w przypadku powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie Pluginu w
tym samym poddanym przeglądowi pliku co pozostała konfiguracja mechanizmu wykonawczego Codex.

## Powiązane

- [Mechanizm wykonawczy Codex](/pl/plugins/codex-harness)
- [Środowisko uruchomieniowe mechanizmu wykonawczego Codex](/pl/plugins/codex-harness-runtime)
- [Nadzór Codex](/plugins/codex-supervision)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Obsługa komputera przez Codex](/pl/plugins/codex-computer-use)
- [Dostawca OpenAI](/pl/providers/openai)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
