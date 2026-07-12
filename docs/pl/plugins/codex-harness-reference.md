---
read_when:
    - Potrzebujesz wszystkich pól konfiguracji środowiska Codex
    - Zmieniasz zachowanie transportu, uwierzytelniania, wykrywania lub limitu czasu serwera aplikacji
    - Debugujesz uruchamianie środowiska testowego Codex, wykrywanie modeli lub izolację środowiska
summary: Dokumentacja konfiguracji, uwierzytelniania, wykrywania i serwera aplikacji dla środowiska testowego Codex
title: Dokumentacja zestawu testowego Codex
x-i18n:
    generated_at: "2026-07-12T15:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Ten materiał referencyjny obejmuje szczegółową konfigurację oficjalnego pluginu `codex`.
Informacje o konfiguracji i decyzjach dotyczących routingu znajdziesz najpierw w sekcji
[Środowisko wykonawcze Codex](/pl/plugins/codex-harness).

## Zakres konfiguracji pluginu

Wszystkie ustawienia środowiska wykonawczego Codex znajdują się w `plugins.entries.codex.config`.

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

| Pole                       | Wartość domyślna                    | Znaczenie                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | włączone                            | Ustawienia wykrywania modeli dla `model/list` serwera aplikacji Codex.                                                                                                                                    |
| `appServer`                | zarządzany serwer aplikacji stdio   | Ustawienia transportu, polecenia, uwierzytelniania, zatwierdzania, piaskownicy i limitów czasu. Zwykłe środowisko wykonawcze domyślnie korzysta ze stanu o zakresie agenta.                                  |
| `codexDynamicToolsLoading` | `"searchable"`                      | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex.                                                                                          |
| `codexDynamicToolsExclude` | `[]`                                | Dodatkowe nazwy dynamicznych narzędzi OpenClaw, które mają być pomijane w turach serwera aplikacji Codex.                                                                                                 |
| `codexPlugins`             | wyłączone                           | Natywna obsługa pluginów i aplikacji Codex, w tym opcjonalny dostęp do aplikacji połączonych kont. Zobacz [Natywne pluginy Codex](/pl/plugins/codex-native-plugins).                                           |
| `computerUse`              | wyłączone                           | Konfiguracja funkcji obsługi komputera Codex. Zobacz [Obsługa komputera Codex](/pl/plugins/codex-computer-use).                                                                                             |
| `supervision`              | wyłączone                           | Katalog niezarchiwizowanych sesji natywnych, kontynuowanie lokalnych gałęzi i zasady narzędzi agenta. Zobacz [Nadzór Codex](/plugins/codex-supervision).                                                   |

## Nadzór

Nadzór wyświetla listę niezarchiwizowanych sesji Codex z komputera Gateway oraz
z uwzględnionych sparowanych węzłów. Włącz go niezależnie od środowiska wykonawczego agenta:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Pola `supervision`:

| Pole                  | Wartość domyślna             | Znaczenie                                                                                                                                                                                                                                                                                             |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                      | Udostępnia lokalny katalog sesji, a na Gateway agreguje katalogi uwzględnionych sparowanych węzłów na potrzeby strony Sesje Codex.                                                                                                                                                                     |
| `endpoints`           | wbudowany lokalny punkt końcowy | Cele punktów końcowych zgodności i zaawansowanej konfiguracji dla zachowanego agenta nadzoru Codex oraz samodzielnych narzędzi MCP. Katalog dla użytkownika i przepływ gałęzi ignorują te cele i używają serwera aplikacji nadzoru określonego na podstawie `appServer`.                                  |
| `allowRawTranscripts` | `false`                      | Gdy nadzór jest włączony, zezwala autonomicznemu agentowi lub samodzielnemu MCP na odczyt transkrypcji i pól list pochodzących z transkrypcji. Odczyty samych metadanych `codex_threads` pozostają dostępne. Nie steruje uwierzytelnionym kontynuowaniem w interfejsie sterowania.                         |
| `allowWriteControls`  | `false`                      | Gdy nadzór jest włączony, zezwala na autonomiczne operacje `codex_threads`: rozwidlanie, zmianę nazwy, archiwizowanie i przywracanie z archiwum, a także samodzielne operacje MCP: wysyłanie, sterowanie i przerywanie. Nie omija innych kontroli powiązań, hosta, stanu ani potwierdzeń. |

Wpisy punktów końcowych przyjmują następujące pola:

| Pole           | Dotyczy       | Znaczenie                                                                         |
| -------------- | ------------- | --------------------------------------------------------------------------------- |
| `id`           | wszystkie     | Stabilny identyfikator punktu końcowego.                                           |
| `label`        | wszystkie     | Opcjonalna etykieta wyświetlana.                                                   |
| `transport`    | wszystkie     | `"stdio-proxy"` lub `"websocket"`.                                                 |
| `command`      | `stdio-proxy` | Opcjonalne polecenie serwera aplikacji.                                            |
| `args`         | `stdio-proxy` | Opcjonalne argumenty polecenia.                                                    |
| `cwd`          | `stdio-proxy` | Opcjonalny katalog roboczy procesu podrzędnego.                                    |
| `url`          | `websocket`   | Wymagany adres URL WebSocket lub obsługiwanego lokalnego gniazda.                  |
| `authTokenEnv` | `websocket`   | Opcjonalna zmienna środowiskowa, której wartość uwierzytelnia punkt końcowy.       |

Strona **Sesje Codex** korzysta z serwera aplikacji nadzoru pluginu i wyświetla
wyłącznie niezarchiwizowane sesje. Bez jawnych ustawień połączenia `appServer`
połączenie to jest zarządzanym stdio korzystającym z katalogu domowego użytkownika. Zapisane lub bezczynne
wiersze lokalne mogą utworzyć czat z zablokowanym modelem i ograniczoną historią użytkownika
oraz asystenta, obejmującą ostatnią utrwaloną turę źródłową kończącą sesję. Jego prywatne
powiązanie utrzymuje rozwidlenie migawki, kanoniczną gałąź źródłową `appServer`,
wstrzykiwanie historii i późniejsze tury na tym połączeniu. Pierwsze kanoniczne
uruchomienie używa pary zwróconej przez rozwidlenie. Późniejsze wznowienia pomijają
nadpisania modelu i dostawcy OpenClaw, aby Codex przywrócił utrwaloną parę
kanonicznego wątku; osobna zmiana natywna może zaktualizować tę parę,
ale zewnętrzny model i łańcuch rezerwowy nigdy jej nie zastępują. Zapisane i bezczynne
wiersze można zarchiwizować po potwierdzeniu braku innych procesów wykonawczych, chyba że inne aktywne
powiązanie OpenClaw jest właścicielem dokładnie tego celu lub jednego z jego niezarchiwizowanych,
utworzonych potomków. OpenClaw stosuje stronicowanie potomków Codex i bezpiecznie odmawia operacji w przypadku
błędów wyliczania, cykli lub wyczerpania limitu bezpieczeństwa. Potwierdzenie nadal
obejmuje nieznanych klientów natywnych i wyścig między zmianą stanu a archiwizacją. Nadzorowanego
czatu z zablokowanym modelem nie można usunąć, dopóki chroni natywne powiązanie.
Aktywne źródła nie mogą tworzyć gałęzi ani być archiwizowane, ale istniejący nadzorowany
czat nadal można otworzyć. Każdy wiersz sparowanego węzła pozostaje tylko do odczytu; transport węzła
nie zapewnia jeszcze cyklu życia przesyłania strumieniowego wymaganego przez środowisko wykonawcze.

Samo `appServer.homeScope: "user"` zmienia jedynie katalog domowy Codex używany przez zarządzany proces
środowiska wykonawczego; nie publikuje katalogu floty. Włączenie nadzoru nie
zmienia domyślnego ustawienia środowiska wykonawczego. Zamiast tego oddzielne połączenie nadzoru
domyślnie korzysta z zarządzanego stdio z katalogiem domowym użytkownika, gdy nie istnieją jawne ustawienia
połączenia `appServer`. Jawne ustawienia są stosowane dla tego połączenia.
Oczekujące i zatwierdzone nadzorowane powiązania zachowują to połączenie dla każdej tury;
wyłączony nadzór lub rozbieżność połączenia albo cyklu życia powodują bezpieczną odmowę zamiast
przejścia awaryjnego do środowiska wykonawczego korzystającego z katalogu domowego agenta. Domyślne połączenie współdzieli zapisane
sesje z natywnymi klientami Codex, ale nie ich lokalny dla procesu stan aktywności.

Starsze ustawienia `plugins.entries.codex-supervisor` zostały wycofane. Uruchom
`openclaw doctor --fix`, aby przenieść stary wpis, definicje punktów końcowych, flagi zasad
oraz odwołania list dozwolonych i blokowanych pluginów do tego bloku. Jawne wartości kanoniczne
`codex.config.supervision` mają pierwszeństwo w przypadku konfliktów.

## Transport serwera aplikacji

W przypadku zwykłych tur środowiska wykonawczego OpenClaw uruchamia zarządzany plik wykonywalny Codex dostarczany
z oficjalnym pluginem (obecnie `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Dzięki temu wersja serwera aplikacji jest powiązana z oficjalnym pluginem `codex`, a nie
z dowolną osobno zainstalowaną lokalnie wersją CLI Codex. Ustaw `appServer.command`
tylko wtedy, gdy celowo chcesz użyć innego pliku wykonywalnego.
Zwykłe zarządzane tury z domyślnym odizolowanym katalogiem domowym agenta preferują ten przypięty
pakiet nawet wtedy, gdy zainstalowany jest pakiet aplikacji komputerowej macOS. Gdy
[Obsługa komputera](/pl/plugins/codex-computer-use) jest włączona lub gdy `homeScope` ma wartość
`"user"` i może wczytać natywny stan obsługi komputera, zarządzane uruchamianie preferuje
zamiast tego plik wykonywalny aplikacji komputerowej, która ma wymagane uprawnienia systemu macOS. Ta sama
reguła pierwszeństwa aplikacji komputerowej obowiązuje, gdy efektywna konfiguracja Codex
odizolowanego katalogu domowego agenta włącza natywną obsługę komputera. Jeśli nie zainstalowano pakietu aplikacji
komputerowej, OpenClaw używa rezerwowo pliku wykonywalnego z przypiętego pakietu.

Przekazywanie pliku wykonywalnego i izolowanie konfiguracji natywnej koordynują klientów wewnątrz jednego
działającego procesu Gateway. Uruchom ponownie Gateway, gdy inny proces zmieni
konfigurację natywnego pluginu Codex.

Nadzór ustanawia oddzielne połączenie. Bez jawnych ustawień połączenia
`appServer` używa zarządzanego stdio z `homeScope: "user"`;
zwykłe środowisko wykonawcze pozostaje przy zarządzanym stdio z `homeScope: "agent"`. Jawne
ustawienia połączenia są stosowane w obu ścieżkach. Ustaw `homeScope: "user"`
jawnie, gdy zwykłe środowisko wykonawcze ma współdzielić `$CODEX_HOME` (lub `~/.codex`)
z klientami natywnymi. Prywatne nadzorowane powiązanie korzysta z połączenia nadzoru
niezależnie od domyślnego ustawienia zwykłego środowiska wykonawczego. Niezależne procesy serwera aplikacji
zachowują oddzielny bieżący stan i stan zatwierdzania.

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

| Pole                                          | Wartość domyślna                                       | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; jawne `"unix"` łączy się z lokalnym gniazdem sterującym; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                             |
| `homeScope`                                   | `"agent"`                                              | `"agent"` izoluje zwykły stan środowiska testowego dla każdego agenta OpenClaw. `"user"` jest jawną opcją wymagającą włączenia, która współdzieli natywny `$CODEX_HOME` lub `~/.codex`, używa natywnego uwierzytelniania i włącza zarządzanie wątkami wyłącznie przez właściciela. Zakres użytkownika obsługuje lokalny transport stdio lub Unix. Dla oddzielnego połączenia nadzorującego nieustawiona wartość jest rozstrzygana jako `"user"` dla stdio lub Unix oraz `"agent"` dla WebSocket. |
| `command`                                     | zarządzany plik binarny Codex                          | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego.                                                                                                                                                                                                                                                                                             |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | nieustawione                                           | Adres URL serwera aplikacji WebSocket lub adres URL `unix://`. Jawnie określona pusta ścieżka Unix wybiera kanoniczne gniazdo sterujące w katalogu domowym użytkownika.                                                                                                                                                                                                                           |
| `authToken`                                   | nieustawione                                           | Token Bearer dla transportu WebSocket. Akceptuje literał ciągu znaków lub SecretInput, na przykład `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują literały ciągów znaków lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                          |
| `clearEnv`                                    | `[]`                                                   | Nazwy dodatkowych zmiennych środowiskowych usuwanych z uruchomionego procesu app-server stdio po utworzeniu przez OpenClaw dziedziczonego środowiska.                                                                                                                                                                                                                                            |
| `remoteWorkspaceRoot`                         | nieustawione                                           | Katalog główny zdalnego obszaru roboczego serwera aplikacji Codex. Gdy jest ustawiony, OpenClaw określa lokalny katalog główny obszaru roboczego na podstawie rozstrzygniętego obszaru roboczego OpenClaw, zachowuje sufiks bieżącego cwd w tym zdalnym katalogu głównym i wysyła do Codex tylko końcowy cwd serwera aplikacji. Jeśli cwd znajduje się poza rozstrzygniętym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw odmawia działania zamiast wysyłać ścieżkę lokalną dla Gateway do zdalnego serwera aplikacji. |
| `requestTimeoutMs`                            | `60000`                                                | Limit czasu wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                                                                                                                                                                                                                   |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Okres ciszy po zaakceptowaniu tury przez Codex lub po żądaniu serwera aplikacji dotyczącym tury, gdy OpenClaw oczekuje na `turn/completed`.                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Limit bezczynności ukończenia i mechanizm nadzorowania postępu używane po przekazaniu do narzędzia, zakończeniu działania natywnego narzędzia, nieprzetworzonym postępie asystenta po użyciu narzędzia, zakończeniu nieprzetworzonego rozumowania lub postępie rozumowania, gdy OpenClaw oczekuje na `turn/completed`. Używaj tego dla zaufanych lub wymagających obciążeń, w których synteza po użyciu narzędzia może zasadnie pozostawać bezczynna dłużej niż budżet końcowego udostępnienia odpowiedzi asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex nie zezwalają na YOLO | Ustawienie wstępne dla wykonywania w trybie YOLO lub pod nadzorem strażnika.                                                                                                                                                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` lub dozwolona polityka zatwierdzania strażnika | Natywna polityka zatwierdzania Codex wysyłana podczas rozpoczynania i wznawiania wątku oraz tury.                                                                                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` lub dozwolona piaskownica strażnika | Natywny tryb piaskownicy Codex wysyłany podczas rozpoczynania i wznawiania wątku. Aktywne piaskownice OpenClaw ograniczają tury `danger-full-access` do `workspace-write` Codex; flaga sieciowa tury jest zgodna z regułami ruchu wychodzącego piaskownicy OpenClaw.                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent strażnika             | Użyj `"auto_review"`, aby zezwolić Codex na przeglądanie natywnych monitów zatwierdzania, gdy jest to dozwolone.                                                                                                                                                                                                                                                                                  |
| `defaultWorkspaceDir`                         | bieżący katalog procesu                                | Obszar roboczy używany przez `/codex bind`, gdy pominięto `--cwd`.                                                                                                                                                                                                                                                                                                                              |
| `serviceTier`                                 | nieustawione                                           | Opcjonalny poziom usługi serwera aplikacji Codex. `"priority"` włącza trasowanie w trybie szybkim, `"flex"` żąda elastycznego przetwarzania, a `null` usuwa nadpisanie. Starsza wartość `"fast"` jest akceptowana jako `"priority"`.                                                                                                                                                                  |
| `networkProxy`                                | wyłączone                                              | Włącza obsługę sieci z profilu uprawnień Codex dla poleceń serwera aplikacji. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją za pomocą `default_permissions` zamiast wysyłania `sandbox`.                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | Eksperymentalna opcja wymagająca jawnego włączenia, która rejestruje środowisko Codex oparte na piaskownicy OpenClaw w obsługiwanym serwerze aplikacji Codex, dzięki czemu natywne wykonywanie Codex może działać wewnątrz aktywnej piaskownicy OpenClaw.                                                                                                                                              |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt piaskownicy
Codex. Po włączeniu OpenClaw ustawia również `features.network_proxy.enabled` i
`default_permissions` w konfiguracji wątku Codex, aby wygenerowany profil
uprawnień mógł uruchomić sieć zarządzaną przez Codex. OpenClaw domyślnie
generuje odporną na kolizje nazwę profilu `openclaw-network-<fingerprint>` na
podstawie treści profilu; używaj `profileName` tylko wtedy, gdy wymagana jest
stabilna nazwa lokalna.

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

Jeśli normalne środowisko uruchomieniowe serwera aplikacji używałoby `danger-full-access`, włączenie
`networkProxy` powoduje zamiast tego zastosowanie dostępu do systemu plików w stylu obszaru roboczego
dla wygenerowanego profilu uprawnień. Egzekwowanie dostępu do sieci zarządzane przez Codex odbywa się
w piaskownicy, dlatego profil pełnego dostępu nie chroniłby ruchu wychodzącego.

Plugin blokuje starsze lub niewersjonowane uzgodnienia połączenia z serwerem aplikacji: serwer aplikacji
Codex musi zgłaszać stabilną wersję `0.143.0` lub nowszą.

OpenClaw traktuje adresy URL WebSocket serwera aplikacji inne niż local loopback jako zdalne i wymaga
uwierzytelniania WebSocket zawierającego tożsamość za pomocą `appServer.authToken` lub nagłówka
`Authorization`. `appServer.authToken` oraz każda wartość `appServer.headers.*`
mogą być typu SecretInput; środowisko uruchomieniowe sekretów rozwiązuje SecretRefs i skrócony zapis
zmiennych środowiskowych, zanim OpenClaw utworzy opcje uruchomienia serwera aplikacji, a nierozwiązane
ustrukturyzowane SecretRefs powodują błąd przed wysłaniem jakiegokolwiek tokenu lub nagłówka. Gdy
skonfigurowane są natywne pluginy Codex, OpenClaw używa płaszczyzny sterowania pluginami połączonego
serwera aplikacji, aby zainstalować lub odświeżyć te pluginy, a następnie odświeża spis aplikacji,
dzięki czemu aplikacje należące do pluginów są widoczne dla wątku Codex. `app/list` pozostaje
autorytatywnym źródłem spisu i metadanych, ale zasady OpenClaw decydują, czy `thread/start` wysyła
`config.apps[appId].enabled = true` dla wymienionej dostępnej aplikacji, nawet jeśli Codex obecnie
oznacza ją jako wyłączoną. Nieznane lub brakujące identyfikatory aplikacji nadal powodują bezpieczne
odrzucenie; ta ścieżka aktywuje wyłącznie pluginy z marketplace za pomocą `plugin/install` i odświeża
spis. Łącz OpenClaw wyłącznie ze zdalnymi serwerami aplikacji, którym można zaufać w zakresie
przyjmowania instalacji pluginów zarządzanych przez OpenClaw oraz odświeżania spisu aplikacji.

## Tryby zatwierdzania i piaskownicy

Lokalne sesje serwera aplikacji przez stdio domyślnie używają trybu YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Takie ustawienie zaufanego lokalnego operatora umożliwia
nienadzorowanym turonom OpenClaw i mechanizmom Heartbeat działanie bez natywnych monitów o zatwierdzenie,
na które nikt nie mógłby odpowiedzieć.

Jeśli lokalny plik wymagań systemowych Codex nie zezwala na niejawne wartości zatwierdzania YOLO,
recenzenta lub piaskownicy, OpenClaw traktuje niejawne ustawienie domyślne jako guardian
i wybiera dozwolone uprawnienia guardian. `tools.exec.mode: "auto"`
również wymusza zatwierdzenia Codex sprawdzane przez guardian i nie zachowuje niebezpiecznych
starszych nadpisań `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`;
ustaw `tools.exec.mode: "full"`, aby świadomie wybrać działanie bez zatwierdzeń.
Wpisy `[[remote_sandbox_config]]` dopasowane do nazwy hosta w tym samym pliku wymagań
są uwzględniane przy wyborze domyślnej piaskownicy.

Ustaw `appServer.mode: "guardian"`, aby używać zatwierdzeń Codex sprawdzanych przez guardian:

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
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`, gdy te
wartości są dozwolone. Poszczególne pola zasad zastępują `mode`. Starsza
wartość recenzenta `guardian_subagent` jest nadal akceptowana jako alias zgodności,
ale nowe konfiguracje powinny używać `auto_review`.

Gdy piaskownica OpenClaw jest aktywna, lokalny proces serwera aplikacji Codex nadal
działa na hoście Gateway. Dlatego OpenClaw wyłącza w tej turze natywny tryb Code Mode
Codex, serwery MCP użytkownika i wykonywanie pluginów opartych na aplikacjach, zamiast
uznawać piaskownicę po stronie hosta Codex za równoważną mechanizmowi piaskownicy
OpenClaw. Dostęp do powłoki jest udostępniany przez dynamiczne narzędzia korzystające
z piaskownicy OpenClaw, takie jak `sandbox_exec` i `sandbox_process`, gdy dostępne są
standardowe narzędzia wykonywania i procesów.

<Note>
Na hostach piaskownicy OpenClaw opartych na Dockerze (`agents.defaults.sandbox.mode`
ustawione na mechanizm Docker) polecenie `openclaw doctor` sprawdza, czy host zezwala
na przestrzenie nazw użytkownika bez uprawnień (oraz, gdy wychodzący ruch sieciowy
piaskownicy Docker jest wyłączony, przestrzenie nazw sieci), których zagnieżdżony
Codex `bwrap` potrzebuje do wykonywania poleceń powłoki z uprawnieniami
`workspace-write` wewnątrz kontenera piaskownicy. Nieudana próba zwykle objawia się
komunikatem `bwrap: setting up uid map: Permission denied` lub
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` na hostach
Ubuntu/AppArmor. Napraw zgłoszone zasady przestrzeni nazw hosta dla użytkownika usługi
OpenClaw i uruchom ponownie Gateway; preferuj profil AppArmor ograniczony do procesu
usługi zamiast ogólnosystemowego rozwiązania zastępczego
`kernel.apparmor_restrict_unprivileged_userns=0` i nie przyznawaj szerszych uprawnień
kontenerowi Docker wyłącznie w celu spełnienia wymagań zagnieżdżonego `bwrap`.
</Note>

## Natywne wykonywanie w piaskownicy

Stabilne ustawienie domyślne bezpiecznie odrzuca operację: aktywna piaskownica OpenClaw
wyłącza natywne powierzchnie wykonywania Codex, które w przeciwnym razie działałyby
z hosta serwera aplikacji Codex. Używaj `appServer.experimental.sandboxExecServer: true`
tylko wtedy, gdy chcesz wypróbować obsługę środowiska zdalnego Codex z mechanizmem
piaskownicy OpenClaw. Ta ścieżka w wersji zapoznawczej działa z każdą obsługiwaną
wersją serwera aplikacji Codex.

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
uruchamia serwer wykonywania local loopback oparty na aktywnej piaskownicy, rejestruje
go w serwerze aplikacji Codex oraz uruchamia wątek i turę Codex z tym środowiskiem
należącym do OpenClaw. Jeśli serwer aplikacji nie może zarejestrować środowiska,
uruchomienie jest bezpiecznie odrzucane zamiast niejawnie przechodzić do wykonywania
na hoście.

Ta ścieżka w wersji zapoznawczej działa wyłącznie lokalnie. Zdalny serwer aplikacji
WebSocket nie może uzyskać dostępu do serwera wykonywania local loopback, chyba że
działa na tym samym hoście, dlatego OpenClaw odrzuca takie połączenie ustawień.

## Izolacja uwierzytelniania i środowiska

W domyślnym katalogu domowym przypisanym do agenta uwierzytelnianie jest wybierane
w następującej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Wyłącznie w przypadku lokalnych uruchomień serwera aplikacji przez stdio:
   `CODEX_API_KEY`, a następnie `OPENAI_API_KEY`, gdy nie istnieje konto serwera
   aplikacji, a uwierzytelnianie OpenAI jest nadal wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex typu subskrypcji ChatGPT
(OAuth lub typ danych uwierzytelniających oparty na tokenie), usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex.
Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla osadzeń lub
bezpośrednich modeli OpenAI, a natywne tury serwera aplikacji Codex nie są
przypadkowo rozliczane przez API.

Jawne profile Codex z kluczem API oraz lokalne użycie klucza ze zmiennej środowiskowej
przez stdio korzystają z logowania serwera aplikacji zamiast z dziedziczonego
środowiska procesu potomnego. Połączenia WebSocket z serwerem aplikacji nie otrzymują
zastępczego klucza API ze środowiska Gateway; użyj jawnego profilu uwierzytelniania
lub własnego konta zdalnego serwera aplikacji.

Uruchomienia serwera aplikacji przez stdio domyślnie dziedziczą środowisko procesu
OpenClaw. OpenClaw zarządza pomostem konta serwera aplikacji Codex i ustawia
`CODEX_HOME` na katalog przypisany do agenta w stanie OpenClaw tego agenta.
Dzięki temu konfiguracja Codex, konta, pamięć podręczna i dane pluginów oraz stan
wątków pozostają ograniczone do agenta OpenClaw, zamiast przenikać z osobistego
katalogu domowego operatora `~/.codex`.

Ustaw `appServer.homeScope: "user"`, aby współdzielić natywny stan Codex z aplikacją
Codex Desktop i CLI. Ten lokalny tryb katalogu domowego użytkownika obsługuje
zarządzane stdio i jawny transport Unix. Używa `$CODEX_HOME`, gdy jest ustawione,
a w przeciwnym razie `~/.codex`, w tym natywnego uwierzytelniania, konfiguracji,
pluginów i wątków. OpenClaw pomija pomost profilu uwierzytelniania dla serwera
aplikacji. Zweryfikowane tury właściciela mogą używać `codex_threads`, aby wyświetlać
(z opcjonalnym filtrem `search`), odczytywać, rozwidlać, zmieniać nazwy, archiwizować
i przywracać z archiwum te wątki. Rozwidlenie wątku wykonaj przed kontynuowaniem go
w OpenClaw; niezależne procesy Codex nie koordynują równoczesnych zapisów do tego
samego wątku.

To jawne ustawienie `homeScope` dotyczy zwykłych sesji mechanizmu wykonawczego.
Czat utworzony przez Codex Sessions korzysta zamiast tego ze swojego prywatnego
połączenia nadzorczego, które zachowuje konfigurację uwierzytelniania i dostawcy
natywnego połączenia dla kanonicznej gałęzi i przyszłych wznowień.

W nadzorowanym czacie z zablokowanym modelem `codex_threads` nie może dołączyć
innego rozwidlenia ani zarchiwizować natywnego wątku powiązanego z czatem.
Wyświetlanie listy i odczyt wyłącznie metadanych pozostają dostępne. Odczyt surowego
zapisu wymaga `allowRawTranscripts`; gdy ta opcja jest wyłączona, wyszukiwanie na
liście również jest odrzucane, ponieważ natywne wyszukiwanie może dopasowywać
podglądy zapisu. Zmiana nazwy, przywrócenie z archiwum, odłączone rozwidlenie oraz
archiwizacja niepowiązanego wątku, który nie należy do innego czatu OpenClaw,
wymagają `allowWriteControls`. Żadna z tych opcji nie omija zablokowanego powiązania.

OpenClaw nie zmienia `HOME` dla zwykłych lokalnych uruchomień serwera aplikacji.
Podprocesy uruchamiane przez Codex, takie jak `openclaw`, `gh`, `git`, narzędzia CLI
usług chmurowych i polecenia powłoki, widzą zwykły katalog domowy procesu i mogą
odnajdywać konfigurację oraz tokeny z katalogu domowego użytkownika. Codex może
również wykryć `$HOME/.agents/skills` oraz
`$HOME/.agents/plugins/marketplace.json`; to wykrywanie `.agents` jest celowo
współdzielone z katalogiem domowym operatora i pozostaje niezależne od izolowanego
stanu `~/.codex`.

W domyślnym zakresie agenta pluginy OpenClaw oraz migawki Skills OpenClaw nadal
przepływają przez własny rejestr pluginów i moduł ładujący Skills OpenClaw; osobiste
zasoby Codex z `~/.codex` nie są uwzględniane. Jeśli masz przydatne Skills lub
pluginy Codex CLI z katalogu domowego Codex, które powinny stać się częścią
izolowanego agenta OpenClaw, jawnie sporządź ich spis:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Jeśli wdrożenie wymaga dodatkowej izolacji środowiska, dodaj te zmienne do
`appServer.clearEnv`:

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

`appServer.clearEnv` wpływa wyłącznie na uruchamiany proces potomny serwera aplikacji
Codex. OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji lokalnego
uruchomienia: `CODEX_HOME` nadal wskazuje wybrany zakres agenta lub użytkownika,
a `HOME` pozostaje dziedziczone, dzięki czemu podprocesy mogą korzystać ze zwykłego
stanu katalogu domowego użytkownika.

## Narzędzia dynamiczne

Narzędzia dynamiczne Codex domyślnie korzystają z ładowania `searchable` i są
udostępniane w przestrzeni nazw `openclaw` z ustawieniem `deferLoading: true`.
OpenClaw nie udostępnia narzędzi dynamicznych, które powielają natywne operacje
obszaru roboczego Codex lub własną powierzchnię wyszukiwania narzędzi Codex:

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

Większość pozostałych narzędzi integracyjnych OpenClaw, takich jak obsługa wiadomości,
multimediów, Cron, przeglądarki, węzłów, Gateway, `heartbeat_respond` i `web_search`,
jest dostępna przez wyszukiwanie narzędzi Codex w tej przestrzeni nazw. Dzięki temu
początkowy kontekst modelu jest mniejszy. Niewielki zestaw narzędzi pozostaje
bezpośrednio wywoływalny niezależnie od `codexDynamicToolsLoading`, ponieważ
wyszukiwanie narzędzi Codex może być niedostępne lub zwracać wyłącznie zbiór
konektorów: `agents_list`, `sessions_spawn` oraz `sessions_yield`. Instrukcje
deweloperskie nadal kierują zwykłe podagenty Codex do natywnego `spawn_agent`
w przypadku natywnej pracy podagentów Codex, natomiast `sessions_spawn` pozostaje
dostępne do jawnego delegowania przez OpenClaw lub ACP. Odpowiedzi źródłowe używające
wyłącznie narzędzia wiadomości również pozostają bezpośrednie, ponieważ stanowi to
kontrakt sterowania turą.

Narzędzia oznaczone `catalogMode: "direct-only"`, w tym narzędzie `computer`
OpenClaw, są grupowane w `openclaw_direct`. OpenClaw dodaje tę przestrzeń nazw do
listy `code_mode.direct_only_tool_namespaces` Codex bez zastępowania wpisów
dostarczonych przez operatora. Dzięki temu Codex udostępnia te narzędzia jako
`DirectModelOnly` w zwykłych wątkach i wątkach działających wyłącznie w trybie
Code Mode, zamiast kierować je przez zagnieżdżone wywołania `tools.*` trybu
Code Mode. Ta granica jest wymagana w przypadku wyników zawierających obrazy:
zagnieżdżona serializacja Code Mode spłaszcza dane wyjściowe obrazu do tekstu,
co spowodowałoby odrzucenie zrzutu ekranu potrzebnego do następnej operacji na
komputerze.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
serwerem aplikacji Codex, który nie może przeszukiwać odroczonych narzędzi dynamicznych,
lub podczas debugowania pełnego ładunku narzędzi.

## Limity czasu

Należące do OpenClaw dynamiczne wywołania narzędzi są ograniczane niezależnie od
`appServer.requestTimeoutMs`. Każde żądanie Codex `item/tool/call` używa
pierwszego dostępnego limitu czasu w następującej kolejności:

- Dodatnia wartość argumentu `timeoutMs` dla danego wywołania.
- Dla `image_generate`: `agents.defaults.imageGenerationModel.timeoutMs`.
- Dla `image_generate` bez skonfigurowanego limitu czasu: domyślny limit
  generowania obrazów wynoszący 120 sekund.
- Dla narzędzia `image` do interpretacji multimediów:
  `tools.media.image.timeoutSeconds` przeliczony na milisekundy albo domyślny
  limit multimediów wynoszący 60 sekund. W przypadku interpretacji obrazu
  dotyczy to samego żądania i limit nie jest pomniejszany o czas wcześniejszych
  prac przygotowawczych.
- Dla narzędzia `message`: stały domyślny limit wynoszący 120 sekund.
- Domyślny limit dynamicznego narzędzia wynoszący 90 sekund.

Ten mechanizm nadzorujący stanowi zewnętrzny budżet dynamicznego
`item/tool/call`. Limity czasu żądań właściwe dla poszczególnych dostawców
działają wewnątrz tego wywołania i zachowują własną semantykę. Budżety
dynamicznych narzędzi są ograniczone do 600000 ms. Po przekroczeniu limitu
czasu OpenClaw przerywa sygnał narzędzia, jeśli jest to obsługiwane, i zwraca
do Codex odpowiedź o niepowodzeniu dynamicznego narzędzia, aby tura mogła być
kontynuowana, zamiast pozostawiać sesję w stanie `processing`.

Po zaakceptowaniu tury przez Codex oraz po udzieleniu przez OpenClaw odpowiedzi
na żądanie serwera aplikacji dotyczące danej tury środowisko wykonawcze
oczekuje, że Codex będzie czynić postępy w bieżącej turze i ostatecznie
zakończy natywną turę zdarzeniem `turn/completed`. Jeśli serwer aplikacji
pozostaje bezczynny przez `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
podejmuje próbę przerwania tury Codex, rejestruje diagnostyczne przekroczenie
limitu czasu i zwalnia pasmo sesji OpenClaw, aby kolejne wiadomości czatu nie
były kolejkowane za nieaktualną natywną turą.

Większość niekońcowych powiadomień dotyczących tej samej tury rozbraja ten
krótki mechanizm nadzorujący, ponieważ Codex potwierdził, że tura jest nadal
aktywna. Przekazanie sterowania narzędziu używa dłuższego budżetu bezczynności
po narzędziu: po zwróceniu przez OpenClaw odpowiedzi `item/tool/call`, po
zakończeniu natywnych elementów narzędzi, takich jak `commandExecution`, po
zakończeniu surowych `custom_tool_call_output`, a także po surowym postępie
asystenta po narzędziu, zakończeniu surowego rozumowania lub postępie
rozumowania. Mechanizm ochronny używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, jeśli ta wartość jest
skonfigurowana, a w przeciwnym razie domyślnie przyjmuje pięć minut. Ten sam
budżet po narzędziu wydłuża również nadzór postępu w cichym okresie syntezy,
zanim Codex wyemituje następne zdarzenie bieżącej tury. Po zakończeniu
rozumowania, zakończeniu `agentMessage` w trybie komentarza oraz surowym
postępie rozumowania lub asystenta przed użyciem narzędzia może nastąpić
automatyczna odpowiedź końcowa, dlatego używają one mechanizmu ochronnego
odpowiedzi po postępie zamiast natychmiast zwalniać pasmo sesji. Tylko
ukończone, końcowe elementy `agentMessage` niebędące komentarzami oraz
zakończenia surowej odpowiedzi asystenta przed użyciem narzędzia uruchamiają
zwolnienie po odpowiedzi asystenta: jeśli Codex następnie pozostaje bezczynny
bez `turn/completed`, OpenClaw podejmuje próbę przerwania natywnej tury i
zwalnia pasmo sesji. Błędy serwera aplikacji stdio, których ponowienie jest
bezpieczne, w tym przekroczenia limitu bezczynności zakończenia tury bez
dowodów na odpowiedź asystenta, użycie narzędzia, aktywny element lub skutek
uboczny, są ponawiane raz w ramach nowej próby uruchomienia serwera aplikacji.
Niebezpieczne przekroczenia limitu czasu nadal wycofują zablokowanego klienta
serwera aplikacji i zwalniają pasmo sesji OpenClaw. Usuwają również nieaktualne
powiązanie natywnego wątku zamiast automatycznie ponawiać jego odtwarzanie.
Przekroczenia limitu czasu nadzoru zakończenia wyświetlają tekst właściwy dla
Codex: w przypadkach bezpiecznych do ponowienia informują, że odpowiedź może
być niepełna, natomiast w przypadkach niebezpiecznych zalecają użytkownikowi
sprawdzenie bieżącego stanu przed ponowieniem. Publiczne dane diagnostyczne
przekroczenia limitu czasu zawierają pola strukturalne, takie jak metoda
ostatniego powiadomienia serwera aplikacji, identyfikator, typ i rola surowego
elementu odpowiedzi asystenta, liczby aktywnych żądań i elementów oraz stan
uzbrojonego mechanizmu nadzoru. Jeśli ostatnim powiadomieniem jest surowy
element odpowiedzi asystenta, zawierają również ograniczony podgląd tekstu
asystenta. Nie zawierają surowej treści monitu ani narzędzia.

## Wykrywanie modeli

Domyślnie Plugin Codex prosi serwer aplikacji o dostępne modele. Za dostępność
modeli odpowiada serwer aplikacji Codex, dlatego lista może się zmienić, gdy
OpenClaw zaktualizuje dołączoną wersję `@openai/codex` lub gdy wdrożenie
skieruje `appServer.command` do innego pliku wykonywalnego Codex. Dostępność
może również zależeć od konta. Użyj `/codex models` w działającym Gateway, aby
wyświetlić aktualny katalog dla danego środowiska wykonawczego i konta.

Jeśli wykrywanie zakończy się niepowodzeniem lub przekroczeniem limitu czasu,
OpenClaw użyje dołączonego katalogu rezerwowego:

| Identyfikator modelu | Nazwa wyświetlana | Poziomy intensywności rozumowania |
| -------------------- | ----------------- | --------------------------------- |
| `gpt-5.5`            | gpt-5.5           | niski, średni, wysoki, xhigh      |
| `gpt-5.4-mini`       | GPT-5.4-Mini      | niski, średni, wysoki, xhigh      |

<Note>
Obecnie dołączone środowisko wykonawcze to `@openai/codex` `0.144.1`. Sonda
`model/list` przeprowadzona na tym dołączonym serwerze aplikacji zwróciła
następujące publiczne wiersze selektora:

| Identyfikator modelu | Modalności wejściowe | Poziomy intensywności rozumowania         |
| -------------------- | -------------------- | ----------------------------------------- |
| `gpt-5.6-sol`        | tekst, obraz         | niski, średni, wysoki, xhigh, max, ultra |
| `gpt-5.6-terra`      | tekst, obraz         | niski, średni, wysoki, xhigh, max, ultra |
| `gpt-5.6-luna`       | tekst, obraz         | niski, średni, wysoki, xhigh, max        |
| `gpt-5.5`            | tekst, obraz         | niski, średni, wysoki, xhigh             |
| `gpt-5.4`            | tekst, obraz         | niski, średni, wysoki, xhigh             |
| `gpt-5.4-mini`       | tekst, obraz         | niski, średni, wysoki, xhigh             |
| `gpt-5.2`            | tekst, obraz         | niski, średni, wysoki, xhigh             |

Katalog serwera aplikacji może zgłaszać poziom `ultra`; mechanizmy sterowania
rozumowaniem OpenClaw obecnie udostępniają poziomy do `max`.

Aktualne wiersze selektora zależą od konta i mogą się zmieniać wraz z kontem,
katalogiem Codex lub dołączoną wersją. Aby uzyskać bieżącą listę, uruchom
`/codex models`, zamiast polegać na tabeli przedstawiającej stan z określonego
momentu. Ukryte modele mogą również pojawiać się w katalogu serwera aplikacji
na potrzeby wewnętrznych lub wyspecjalizowanych przepływów, nie będąc zwykłymi
opcjami w selektorze modeli.
</Note>

Dostosuj wykrywanie w `plugins.entries.codex.config.discovery`:

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

Wyłącz wykrywanie, jeśli chcesz uniknąć odpytywania Codex podczas uruchamiania
i używać wyłącznie katalogu rezerwowego:

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

## Pliki inicjalizacyjne obszaru roboczego

Codex samodzielnie obsługuje `AGENTS.md` za pomocą natywnego wykrywania
dokumentacji projektu. OpenClaw nie zapisuje syntetycznych plików dokumentacji
projektu Codex ani nie korzysta z rezerwowych nazw plików Codex dla plików
persony, ponieważ mechanizm rezerwowy Codex ma zastosowanie tylko wtedy, gdy
brakuje `AGENTS.md`.

Aby zachować zgodność obszaru roboczego OpenClaw, środowisko wykonawcze Codex
przekazuje pozostałe pliki inicjalizacyjne jako instrukcje deweloperskie, ale
nie w identyczny sposób:

- `TOOLS.md` jest przekazywany jako **dziedziczone** instrukcje deweloperskie
  Codex, dzięki czemu natywne podagenty Codex uruchomione podczas tury również
  go widzą.
- `SOUL.md`, `IDENTITY.md` i `USER.md` są przekazywane jako instrukcje
  współpracy **ograniczone do tury**. Natywne podagenty Codex ich nie
  dziedziczą, co zapobiega przejmowaniu przez ich tury persony i profilu
  użytkownika agenta nadrzędnego.
- Skrócona, wczytana lista Skills OpenClaw jest również przekazywana jako
  deweloperskie instrukcje współpracy ograniczone do tury, więc natywne
  podagenty Codex także jej nie dziedziczą.
- Treść `HEARTBEAT.md` nie jest wstrzykiwana; tury heartbeat otrzymują w trybie
  współpracy wskazówkę, aby odczytać plik, jeśli istnieje i nie jest pusty.
- Treść `MEMORY.md` ze skonfigurowanego obszaru roboczego agenta nie jest
  wklejana do danych wejściowych natywnej tury Codex, gdy dla tego obszaru
  roboczego dostępne są narzędzia pamięci. Jeśli plik istnieje, środowisko
  wykonawcze dodaje małą wskazówkę dotyczącą pamięci obszaru roboczego do
  deweloperskich instrukcji współpracy ograniczonych do tury, a Codex powinien
  używać `memory_search` lub `memory_get`, gdy istotna jest pamięć trwała.
  Jeśli narzędzia są wyłączone, wyszukiwanie w pamięci jest niedostępne lub
  aktywny obszar roboczy różni się od obszaru roboczego pamięci agenta,
  `MEMORY.md` korzysta ze zwykłej, ograniczonej ścieżki kontekstu tury.
- `BOOTSTRAP.md`, jeśli istnieje, jest przekazywany jako kontekst referencyjny
  danych wejściowych tury OpenClaw.

## Nadpisania środowiskowe

Nadpisania środowiskowe pozostają dostępne na potrzeby testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik wykonywalny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` na potrzeby jednorazowych testów
lokalnych. W przypadku powtarzalnych wdrożeń preferowana jest konfiguracja,
ponieważ zachowuje zachowanie Pluginu w tym samym poddanym przeglądowi pliku
co pozostała konfiguracja środowiska wykonawczego Codex.

## Powiązane

- [Środowisko wykonawcze Codex](/pl/plugins/codex-harness)
- [Środowisko uruchomieniowe środowiska wykonawczego Codex](/pl/plugins/codex-harness-runtime)
- [Nadzór Codex](/plugins/codex-supervision)
- [Natywne Pluginy Codex](/pl/plugins/codex-native-plugins)
- [Obsługa komputera przez Codex](/pl/plugins/codex-computer-use)
- [Dostawca OpenAI](/pl/providers/openai)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
