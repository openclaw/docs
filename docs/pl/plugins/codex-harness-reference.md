---
read_when:
    - Potrzebujesz każdego pola konfiguracji harnessu Codex
    - Zmieniasz zachowanie transportu, uwierzytelniania, wykrywania lub limitu czasu app-server
    - Debugujesz uruchamianie harnessu Codex, wykrywanie modeli lub izolację środowiska
summary: Konfiguracja, uwierzytelnianie, wykrywanie i dokumentacja serwera aplikacji dla harnessu Codex
title: Dokumentacja referencyjna harnessu Codex
x-i18n:
    generated_at: "2026-07-01T08:34:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

To odniesienie opisuje szczegółową konfigurację dołączonego Pluginu `codex`.
W przypadku decyzji dotyczących konfiguracji i routingu zacznij od
[Codex harness](/pl/plugins/codex-harness).

## Powierzchnia konfiguracji Pluginu

Wszystkie ustawienia Codex harness znajdują się w `plugins.entries.codex.config`.

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

Obsługiwane pola najwyższego poziomu:

| Pole                       | Domyślnie                | Znaczenie                                                                                                                                |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | włączone                 | Ustawienia wykrywania modeli dla `model/list` serwera app-server Codex.                                                                  |
| `appServer`                | zarządzany stdio app-server | Ustawienia transportu, polecenia, uwierzytelniania, zatwierdzania, piaskownicy i limitu czasu.                                           |
| `codexDynamicToolsLoading` | `"searchable"`           | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex.                       |
| `codexDynamicToolsExclude` | `[]`                     | Dodatkowe nazwy dynamicznych narzędzi OpenClaw, które należy pominąć w turach app-server Codex.                                          |
| `codexPlugins`             | wyłączone                | Natywna obsługa pluginów/aplikacji Codex dla zmigrowanych, instalowanych ze źródeł kuratorowanych pluginów. Zobacz [Native Codex plugins](/pl/plugins/codex-native-plugins). |
| `computerUse`              | wyłączone                | Konfiguracja Codex Computer Use. Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use).                                                |

## Transport app-server

Domyślnie OpenClaw uruchamia zarządzany plik binarny Codex dostarczany z dołączonym
Pluginem:

```bash
codex app-server --listen stdio://
```

Dzięki temu wersja app-server pozostaje powiązana z dołączonym Pluginem `codex`, zamiast
z osobnym CLI Codex, który akurat jest zainstalowany lokalnie. Ustaw
`appServer.command` tylko wtedy, gdy celowo chcesz uruchomić inny
plik wykonywalny.

Dla już uruchomionego app-server użyj transportu WebSocket:

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

Obsługiwane pola `appServer`:

| Pole                                          | Domyślne                                              | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                                                                    |
| `command`                                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego.                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | nieustawione                                          | URL app-servera WebSocket.                                                                                                                                                                                                                                                                                                                                                                     |
| `authToken`                                   | nieustawione                                          | Token Bearer dla transportu WebSocket. Akceptuje literał tekstowy lub SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                  | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują literały tekstowe lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                  | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-servera stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska.                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | nieustawione                                          | Zdalny katalog główny przestrzeni roboczej app-servera Codex. Gdy jest ustawiony, OpenClaw wyprowadza lokalny katalog główny przestrzeni roboczej z rozwiązanej przestrzeni roboczej OpenClaw, zachowuje sufiks bieżącego katalogu roboczego pod tym zdalnym katalogiem głównym i wysyła do Codex tylko końcowy katalog roboczy app-servera. Jeśli katalog roboczy znajduje się poza rozwiązanym katalogiem głównym przestrzeni roboczej OpenClaw, OpenClaw odmawia bezpiecznie zamiast wysyłać lokalną dla Gateway ścieżkę do zdalnego app-servera. |
| `requestTimeoutMs`                            | `60000`                                               | Limit czasu dla wywołań płaszczyzny sterowania app-servera.                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Okno ciszy po zaakceptowaniu tury przez Codex lub po żądaniu app-servera w zakresie tury, gdy OpenClaw czeka na `turn/completed`.                                                                                                                                                                                                                                                              |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Strażnik bezczynności ukończenia i postępu używany po przekazaniu narzędzia, ukończeniu narzędzia natywnego, postępie surowej odpowiedzi asystenta po narzędziu, ukończeniu surowego rozumowania lub postępie rozumowania, gdy OpenClaw czeka na `turn/completed`. Używaj tego dla zaufanych lub ciężkich zadań, w których synteza po narzędziu może zasadnie pozostawać cicha dłużej niż końcowy budżet wydania odpowiedzi asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex zabraniają YOLO | Ustawienie wstępne dla wykonywania YOLO lub sprawdzanego przez guardian.                                                                                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` lub dozwolona polityka zatwierdzania guardian | Natywna polityka zatwierdzania Codex wysyłana do rozpoczęcia wątku, wznowienia i tury.                                                                                                                                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` lub dozwolony sandbox guardian | Natywny tryb sandbox Codex wysyłany do rozpoczęcia i wznowienia wątku. Aktywne sandboxy OpenClaw zawężają tury `danger-full-access` do Codex `workspace-write`; flaga sieci tury podąża za wyjściem z sandboxa OpenClaw.                                                                                                                                                                         |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent guardian             | Użyj `"auto_review"`, aby Codex sprawdzał natywne monity zatwierdzania, gdy jest to dozwolone.                                                                                                                                                                                                                                                                                                  |
| `defaultWorkspaceDir`                         | katalog bieżącego procesu                             | Przestrzeń robocza używana przez `/codex bind`, gdy pominięto `--cwd`.                                                                                                                                                                                                                                                                                                                          |
| `serviceTier`                                 | nieustawione                                          | Opcjonalna warstwa usługi app-servera Codex. `"priority"` włącza routing trybu szybkiego, `"flex"` żąda przetwarzania flex, a `null` czyści nadpisanie. Starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                                    |
| `networkProxy`                                | wyłączone                                             | Włącza sieciowanie profilu uprawnień Codex dla poleceń app-servera. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją przez `default_permissions` zamiast wysyłać `sandbox`.                                                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                               | Eksperymentalne włączenie podglądowe, które rejestruje środowisko Codex wspierane sandboxem OpenClaw w app-serverze Codex 0.132.0 lub nowszym, aby natywne wykonywanie Codex mogło działać wewnątrz aktywnego sandboxa OpenClaw.                                                                                                                                                                 |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt sandboxa Codex.
Po włączeniu OpenClaw ustawia także `features.network_proxy.enabled` i
`default_permissions` w konfiguracji wątku Codex, aby wygenerowany profil
uprawnień mógł uruchomić zarządzane sieciowanie Codex. Domyślnie OpenClaw
generuje odporną na kolizje nazwę profilu `openclaw-network-<fingerprint>` z
treści profilu; używaj `profileName` tylko wtedy, gdy wymagana jest stabilna
lokalna nazwa.

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

Jeśli normalne środowisko uruchomieniowe app-servera byłoby `danger-full-access`,
włączenie `networkProxy` używa dostępu do systemu plików w stylu przestrzeni
roboczej dla wygenerowanego profilu uprawnień. Zarządzane wymuszanie sieci przez
Codex jest sieciowaniem w sandboxie, więc profil z pełnym dostępem nie chroniłby
ruchu wychodzącego.

Plugin blokuje starsze lub niewersjonowane uzgodnienia app-servera. App-server
Codex musi zgłaszać stabilną wersję `0.125.0` lub nowszą.

OpenClaw traktuje adresy URL serwera aplikacji WebSocket inne niż loopback jako zdalne i wymaga
uwierzytelniania WebSocket przenoszącego tożsamość przez `appServer.authToken` albo
nagłówek `Authorization`. `appServer.authToken` oraz każda wartość
`appServer.headers.*` mogą być SecretInput; środowisko uruchomieniowe sekretów rozwiązuje SecretRefs i skróty env,
zanim OpenClaw zbuduje opcje uruchamiania serwera aplikacji, a nierozwiązane
ustrukturyzowane SecretRefs kończą się błędem, zanim jakikolwiek token lub nagłówek zostanie wysłany. Gdy skonfigurowane są natywne Pluginy Codex,
OpenClaw używa płaszczyzny sterowania Pluginami podłączonego serwera aplikacji,
aby zainstalować lub odświeżyć te Pluginy, a następnie odświeża inwentarz aplikacji, aby
aplikacje należące do Pluginów były widoczne dla wątku Codex. `app/list` nadal jest
autorytatywnym źródłem inwentarza i metadanych, ale polityka OpenClaw decyduje, czy
`thread/start` wysyła `config.apps[appId].enabled = true` dla wymienionej dostępnej
aplikacji, nawet jeśli Codex obecnie oznacza ją jako wyłączoną. Nieznane lub brakujące identyfikatory aplikacji pozostają
fail-closed; ta ścieżka aktywuje Pluginy z marketplace wyłącznie przez `plugin/install`
i odświeża inwentarz. Łącz OpenClaw tylko ze zdalnymi serwerami aplikacji, którym
można zaufać, że zaakceptują instalacje Pluginów zarządzane przez OpenClaw oraz odświeżenia inwentarza aplikacji.

## Tryby zatwierdzania i sandbox

Lokalne sesje serwera aplikacji stdio domyślnie używają trybu YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Ta postawa zaufanego lokalnego operatora pozwala
nienadzorowanym turynom OpenClaw i Heartbeat postępować bez natywnych monitów o zatwierdzenie,
na które nikt nie może odpowiedzieć.

Jeśli lokalny plik wymagań systemowych Codex zabrania niejawnych wartości zatwierdzenia YOLO,
recenzenta lub sandbox, OpenClaw traktuje niejawną wartość domyślną jako guardian
i wybiera dozwolone uprawnienia guardian. `tools.exec.mode: "auto"`
również wymusza zatwierdzenia Codex recenzowane przez guardian i nie zachowuje niebezpiecznych
starszych nadpisań `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`;
ustaw `tools.exec.mode: "full"` dla świadomej postawy bez zatwierdzeń.
Wpisy
`[[remote_sandbox_config]]` dopasowane do nazwy hosta w tym samym pliku wymagań są honorowane
przy decyzji o domyślnym sandbox.

Ustaw `appServer.mode: "guardian"` dla zatwierdzeń Codex recenzowanych przez guardian:

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

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`, gdy te
wartości są dozwolone. Poszczególne pola polityki nadpisują `mode`. Starsza
wartość recenzenta `guardian_subagent` jest nadal akceptowana jako alias zgodności,
ale nowe konfiguracje powinny używać `auto_review`.

Gdy sandbox OpenClaw jest aktywny, lokalny proces serwera aplikacji Codex nadal
działa na hoście Gateway. Dlatego OpenClaw wyłącza natywny Code Mode Codex,
serwery MCP użytkownika oraz wykonywanie Pluginów wspieranych przez aplikacje dla tej tury, zamiast
traktować sandboxing po stronie hosta Codex jako równoważny backendowi sandbox
OpenClaw. Dostęp do powłoki jest udostępniany przez dynamiczne narzędzia wspierane przez sandbox OpenClaw,
takie jak `sandbox_exec` i `sandbox_process`, gdy normalne narzędzia exec/process
są dostępne.

Na hostach Ubuntu/AppArmor bwrap Codex może zakończyć się błędem w `workspace-write`, zanim
uruchomi się polecenie powłoki, gdy celowo uruchamiasz natywne Codex
`workspace-write` bez aktywnego sandboxingu OpenClaw. Jeśli widzisz
`bwrap: setting up uid map: Permission denied` albo
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, uruchom
`openclaw doctor` i napraw zgłoszoną politykę przestrzeni nazw hosta dla użytkownika usługi OpenClaw,
zamiast nadawać szersze uprawnienia kontenera Docker. Preferuj
zakresowy profil AppArmor dla procesu usługi; obejście
`kernel.apparmor_restrict_unprivileged_userns=0` obejmuje cały host i ma
kompromisy bezpieczeństwa.

## Natywne wykonywanie w sandbox

Stabilna wartość domyślna to fail-closed: aktywny sandboxing OpenClaw wyłącza natywne
powierzchnie wykonywania Codex, które w przeciwnym razie działałyby z hosta serwera aplikacji Codex.
Używaj `appServer.experimental.sandboxExecServer: true` tylko wtedy, gdy chcesz
wypróbować obsługę zdalnego środowiska Codex z backendem sandbox OpenClaw. Ta
ścieżka podglądowa wymaga serwera aplikacji Codex 0.132.0 lub nowszego.

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

Gdy flaga jest włączona, a bieżąca sesja OpenClaw działa w sandbox, OpenClaw
uruchamia local loopback exec-server wspierany przez aktywny sandbox, rejestruje go
w serwerze aplikacji Codex i uruchamia wątek oraz turę Codex z tym
środowiskiem należącym do OpenClaw. Jeśli serwer aplikacji nie może zarejestrować środowiska,
uruchomienie kończy się fail-closed zamiast po cichu wracać do wykonywania na hoście.

Ta ścieżka podglądowa jest tylko lokalna. Zdalny serwer aplikacji WebSocket nie może dosięgnąć
loopback exec-server, chyba że działa na tym samym hoście, więc OpenClaw odrzuca
taką kombinację.

## Uwierzytelnianie i izolacja środowiska

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu Codex home tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, następnie
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie OpenAI
   jest nadal wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z utworzonego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddings lub bezpośrednich modeli OpenAI,
bez przypadkowego rozliczania natywnych tur serwera aplikacji Codex przez API.

Jawne profile klucza API Codex i lokalny fallback klucza env stdio używają logowania serwera aplikacji
zamiast odziedziczonego env procesu potomnego. Połączenia z serwerem aplikacji WebSocket
nie otrzymują fallbacku klucza API env Gateway; użyj jawnego profilu uwierzytelniania albo
własnego konta zdalnego serwera aplikacji.

Uruchomienia serwera aplikacji stdio domyślnie dziedziczą środowisko procesu OpenClaw.
OpenClaw posiada most konta serwera aplikacji Codex i ustawia `CODEX_HOME` na
katalog per-agent w stanie OpenClaw tego agenta. Dzięki temu konfiguracja Codex,
konta, pamięć podręczna/dane Pluginów oraz stan wątku są ograniczone do agenta OpenClaw,
zamiast przeciekać z osobistego katalogu operatora `~/.codex`.

OpenClaw nie przepisuje `HOME` dla normalnych lokalnych uruchomień serwera aplikacji. Podprocesy
uruchamiane przez Codex, takie jak `openclaw`, `gh`, `git`, CLI chmurowe i polecenia powłoki, widzą
normalny katalog domowy procesu i mogą znaleźć konfigurację oraz tokeny w katalogu domowym użytkownika. Codex może też
odkrywać `$HOME/.agents/skills` i `$HOME/.agents/plugins/marketplace.json`;
to odkrywanie `.agents` jest celowo współdzielone z katalogiem domowym operatora i jest
oddzielne od izolowanego stanu `~/.codex`.

Pluginy OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny
rejestr Pluginów i loader Skills OpenClaw. Osobiste zasoby Codex `~/.codex` nie. Jeśli
masz przydatne Skills lub Pluginy CLI Codex z Codex home, które powinny stać się
częścią agenta OpenClaw, zinwentaryzuj je jawnie:

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

`appServer.clearEnv` wpływa tylko na utworzony proces potomny serwera aplikacji Codex.
OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji lokalnego uruchomienia:
`CODEX_HOME` pozostaje per-agent, a `HOME` pozostaje odziedziczone, aby
podprocesy mogły używać normalnego stanu katalogu domowego użytkownika.

## Narzędzia dynamiczne

Narzędzia dynamiczne Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
narzędzi dynamicznych, które powielają natywne operacje obszaru roboczego Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Większość pozostałych narzędzi integracyjnych OpenClaw, takich jak wiadomości, media, cron,
przeglądarka, węzły, gateway, `heartbeat_respond` i `web_search`, jest dostępna
przez wyszukiwanie narzędzi Codex w przestrzeni nazw `openclaw`. Dzięki temu początkowy
kontekst modelu jest mniejszy. `sessions_yield` i odpowiedzi źródłowe tylko z narzędzi wiadomości
pozostają bezpośrednie, ponieważ są to kontrakty sterowania turą. `sessions_spawn` pozostaje
wyszukiwalne, aby natywne `spawn_agent` Codex pozostało główną powierzchnią podagentów Codex,
podczas gdy jawna delegacja OpenClaw lub ACP jest nadal dostępna przez
przestrzeń nazw narzędzi dynamicznych `openclaw`.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym serwerem aplikacji Codex,
który nie potrafi wyszukiwać odroczonych narzędzi dynamicznych, albo podczas debugowania pełnego
ładunku narzędzi.

## Limity czasu

Wywołania narzędzi dynamicznych należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`. Każde żądanie Codex `item/tool/call` używa pierwszego
dostępnego limitu czasu w tej kolejności:

- Dodatni argument per-call `timeoutMs`.
- Dla `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Dla `image_generate` bez skonfigurowanego limitu czasu domyślny limit
  generowania obrazów wynoszący 120 sekund.
- Dla narzędzia rozumienia mediów `image`, `tools.media.image.timeoutSeconds`
  przeliczone na milisekundy albo domyślne 60 sekund dla mediów. Dla rozumienia obrazu
  dotyczy to samego żądania i nie jest zmniejszane przez
  wcześniejsze prace przygotowawcze.
- Domyślny limit narzędzia dynamicznego wynoszący 90 sekund.

Ten watchdog jest zewnętrznym budżetem dynamicznego `item/tool/call`. Limity czasu żądań
specyficzne dla dostawcy działają wewnątrz tego wywołania i zachowują własną semantykę limitów czasu.
Budżety narzędzi dynamicznych są ograniczone do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa
sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca nieudaną odpowiedź narzędzia dynamicznego do Codex,
aby tura mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.

Po zaakceptowaniu tury przez Codex oraz po odpowiedzi OpenClaw na żądanie serwera aplikacji
w zakresie tury harness oczekuje, że Codex wykona postęp w bieżącej turze i
ostatecznie zakończy natywną turę zdarzeniem `turn/completed`. Jeśli serwer aplikacji milczy
przez `appServer.turnCompletionIdleTimeoutMs`, OpenClaw w trybie best-effort
przerywa turę Codex, zapisuje diagnostyczny limit czasu i zwalnia pas sesji
OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za przestarzałą
natywną turą.

Większość nieterminalnych powiadomień dla tego samego obrotu rozbraja ten krótki watchdog,
ponieważ Codex dowiódł, że obrót nadal jest aktywny. Przekazania narzędzi używają dłuższego
budżetu bezczynności po narzędziu: po tym, jak OpenClaw zwróci odpowiedź `item/tool/call`, po
ukończeniu natywnych elementów narzędzi, takich jak `commandExecution`, po surowych
ukończeniach `custom_tool_call_output` oraz po surowym postępie asystenta po narzędziu,
surowych ukończeniach rozumowania lub postępie rozumowania. Strażnik używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, gdy jest skonfigurowany, a w
przeciwnym razie domyślnie przyjmuje pięć minut. Ten sam budżet po narzędziu rozszerza także
watchdog postępu dla cichego okna syntezy, zanim Codex wyemituje następne zdarzenie bieżącego
obrotu. Ukończenia rozumowania, ukończenia `agentMessage` w komentarzu oraz surowe postępy
rozumowania lub asystenta przed narzędziem mogą zostać zakończone automatyczną odpowiedzią
końcową, dlatego używają strażnika odpowiedzi po postępie zamiast natychmiast zwalniać tor
sesji. Tylko końcowe/niekomentarzowe ukończone elementy `agentMessage` i surowe ukończenia
asystenta przed narzędziem uzbrajają zwolnienie wyjścia asystenta: jeśli Codex potem zamilknie
bez `turn/completed`, OpenClaw w trybie best-effort przerywa natywny obrót i zwalnia tor sesji.
Bezpieczne do odtworzenia awarie serwera aplikacji stdio, w tym limity czasu bezczynności
ukończenia obrotu bez dowodów asystenta, narzędzia, aktywnego elementu lub efektu ubocznego,
są ponawiane raz przy świeżej próbie serwera aplikacji. Niebezpieczne limity czasu nadal
wycofują zablokowanego klienta serwera aplikacji i zwalniają tor sesji OpenClaw. Czyszczą też
nieaktualne powiązanie natywnego wątku zamiast automatycznie je odtwarzać. Limity czasu
obserwacji ukończenia pokazują tekst limitu czasu specyficzny dla Codex: przypadki bezpieczne
do odtworzenia mówią, że odpowiedź może być niekompletna, natomiast przypadki niebezpieczne
informują użytkownika, aby zweryfikował bieżący stan przed ponowną próbą. Publiczna diagnostyka
limitów czasu obejmuje pola strukturalne, takie jak ostatnia metoda powiadomienia serwera
aplikacji, identyfikator/typ/rola surowego elementu odpowiedzi asystenta, liczby aktywnych
żądań/elementów oraz uzbrojony stan obserwacji. Gdy ostatnim powiadomieniem jest surowy
element odpowiedzi asystenta, obejmuje także ograniczony podgląd tekstu asystenta. Nie obejmuje
surowego promptu ani treści narzędzi.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacji o dostępne modele. Dostępność modeli należy do
serwera aplikacji Codex, więc lista może się zmieniać, gdy OpenClaw aktualizuje dołączoną wersję
`@openai/codex` albo gdy wdrożenie kieruje `appServer.command` na inny plik binarny Codex.
Dostępność może także zależeć od konta. Użyj `/codex models` na działającym Gateway, aby
zobaczyć katalog na żywo dla tego harnessu i konta.

Jeśli wykrywanie się nie powiedzie lub przekroczy limit czasu, OpenClaw używa dołączonego
katalogu awaryjnego dla:

- GPT-5.5
- GPT-5.4 mini

Bieżący dołączony harness to `@openai/codex` `0.142.4`. Próba `model/list` wobec tego
dołączonego serwera aplikacji w przestrzeni roboczej z włączonym GPT-5.6 zwróciła te publiczne
wiersze selektora:

| Identyfikator modelu  | Modalności wejściowe | Poziomy wysiłku rozumowania          |
| --------------------- | -------------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image          | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image          | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image          | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image          | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image          | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image          | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image          | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text                 | low, medium, high, xhigh             |

Dostęp do GPT-5.6 zależy od konta podczas ograniczonej wersji podglądowej. `max` jest poziomem
wysiłku rozumowania modelu. `ultra` to oddzielne metadane orkiestracji wieloagentowej Codex, a
nie standardowy poziom wysiłku rozumowania OpenAI.

Ukryte modele mogą być zwracane przez katalog serwera aplikacji dla wewnętrznych lub
wyspecjalizowanych przepływów, ale nie są normalnymi opcjami selektora modeli.

Dostrój wykrywanie w `plugins.entries.codex.config.discovery`:

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

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i używało tylko
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

## Pliki rozruchowe przestrzeni roboczej

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentacji projektu. OpenClaw nie
zapisuje syntetycznych plików dokumentacji projektu Codex ani nie zależy od awaryjnych nazw
plików Codex dla plików persony, ponieważ awaryjne mechanizmy Codex mają zastosowanie tylko
wtedy, gdy brakuje `AGENTS.md`.

Dla parytetu przestrzeni roboczej OpenClaw harness Codex rozwiązuje pozostałe pliki rozruchowe.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` i `USER.md` są przekazywane jako instrukcje developerskie
OpenClaw Codex, ponieważ definiują aktywnego agenta, dostępne wskazówki przestrzeni roboczej i
profil użytkownika. Zwarta lista Skills OpenClaw jest przekazywana jako instrukcje developerskie
współpracy ograniczone do obrotu. Treść `HEARTBEAT.md` nie jest wstrzykiwana; obroty heartbeat
otrzymują wskaźnik trybu współpracy, aby odczytać plik, gdy istnieje i nie jest pusty. Treść
`MEMORY.md` ze skonfigurowanej przestrzeni roboczej agenta nie jest wklejana do natywnego wejścia
obrotu Codex, gdy narzędzia pamięci są dostępne dla tej przestrzeni roboczej; gdy istnieje,
harness dodaje mały wskaźnik pamięci przestrzeni roboczej do instrukcji developerskich
współpracy ograniczonych do obrotu, a Codex powinien użyć `memory_search` lub `memory_get`, gdy
trwała pamięć jest istotna. Jeśli narzędzia są wyłączone, wyszukiwanie pamięci jest niedostępne
albo aktywna przestrzeń robocza różni się od przestrzeni roboczej pamięci agenta, `MEMORY.md`
używa normalnej ograniczonej ścieżki kontekstu obrotu. `BOOTSTRAP.md`, gdy jest obecny, jest
przekazywany jako kontekst referencyjny wejścia obrotu OpenClaw.

## Nadpisania środowiska

Nadpisania środowiska pozostają dostępne do lokalnego testowania:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy `appServer.command` nie jest
ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` usunięto. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego lokalnego testowania. Konfiguracja
jest preferowana w powtarzalnych wdrożeniach, ponieważ utrzymuje zachowanie Pluginu w tym samym
sprawdzanym pliku co reszta konfiguracji harnessu Codex.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Runtime harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Natywne Pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Dostawca OpenAI](/pl/providers/openai)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
