---
read_when:
    - Potrzebujesz każdego pola konfiguracji harnessa Codex
    - Zmieniasz transport, uwierzytelnianie, wykrywanie lub zachowanie limitów czasu app-server
    - Debugujesz uruchamianie harnessu Codex, wykrywanie modeli lub izolację środowiska
summary: Dokumentacja konfiguracji, uwierzytelniania, wykrywania i serwera aplikacji dla harnessu Codex
title: Dokumentacja referencyjna środowiska Codex
x-i18n:
    generated_at: "2026-06-27T17:50:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Ten dokument referencyjny opisuje szczegółową konfigurację dołączonego Pluginu
`codex`. W przypadku konfiguracji i decyzji dotyczących routingu zacznij od
[mechanizmu Codex](/pl/plugins/codex-harness).

## Powierzchnia konfiguracji Pluginu

Wszystkie ustawienia mechanizmu Codex znajdują się w `plugins.entries.codex.config`.

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
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | włączone                 | Ustawienia wykrywania modeli dla `model/list` serwera aplikacji Codex.                                                                   |
| `appServer`                | zarządzany serwer aplikacji stdio | Ustawienia transportu, polecenia, uwierzytelniania, zatwierdzania, piaskownicy i limitu czasu.                                           |
| `codexDynamicToolsLoading` | `"searchable"`           | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex.                       |
| `codexDynamicToolsExclude` | `[]`                     | Dodatkowe nazwy dynamicznych narzędzi OpenClaw, które należy pominąć w turach serwera aplikacji Codex.                                  |
| `codexPlugins`             | wyłączone                | Natywna obsługa Pluginów/aplikacji Codex dla migrowanych, instalowanych ze źródeł, kuratorowanych Pluginów. Zobacz [natywne Pluginy Codex](/pl/plugins/codex-native-plugins). |
| `computerUse`              | wyłączone                | Konfiguracja Codex Computer Use. Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use).                                               |

## Transport serwera aplikacji

Domyślnie OpenClaw uruchamia zarządzany plik binarny Codex dostarczany z dołączonym
Pluginem:

```bash
codex app-server --listen stdio://
```

Dzięki temu wersja serwera aplikacji jest powiązana z dołączonym Pluginem `codex`, a nie z
dowolnym osobnym Codex CLI, który akurat jest zainstalowany lokalnie. Ustaw
`appServer.command` tylko wtedy, gdy celowo chcesz uruchomić inny
plik wykonywalny.

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

Obsługiwane pola `appServer`:

| Pole                                          | Domyślnie                                             | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                                                                     |
| `command`                                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego.                                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | nieustawione                                           | Adres URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | nieustawione                                           | Token bearer dla transportu WebSocket. Akceptuje dosłowny ciąg znaków albo SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                   |
| `headers`                                     | `{}`                                                   | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują dosłowne ciągi znaków albo wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                        |
| `clearEnv`                                    | `[]`                                                   | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu stdio app-server po zbudowaniu przez OpenClaw dziedziczonego środowiska.                                                                                                                                                                                                                                               |
| `remoteWorkspaceRoot`                         | nieustawione                                           | Katalog główny zdalnego obszaru roboczego Codex app-server. Gdy jest ustawiony, OpenClaw wywnioskuje lokalny katalog główny obszaru roboczego z rozwiązanego obszaru roboczego OpenClaw, zachowa bieżący sufiks cwd pod tym zdalnym katalogiem głównym i wyśle do Codex tylko końcowy cwd app-server. Jeśli cwd znajduje się poza rozwiązanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw zakończy działanie w trybie fail-closed zamiast wysyłać lokalną dla gateway ścieżkę do zdalnego app-server. |
| `requestTimeoutMs`                            | `60000`                                                | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Okno ciszy po zaakceptowaniu tury przez Codex albo po żądaniu app-server ograniczonym do tury, gdy OpenClaw czeka na `turn/completed`.                                                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Strażnik bezczynności ukończenia i postępu używany po przekazaniu do narzędzia, ukończeniu narzędzia natywnego, postępie surowej odpowiedzi asystenta po narzędziu, ukończeniu surowego rozumowania albo postępie rozumowania, gdy OpenClaw czeka na `turn/completed`. Używaj tego dla zaufanych lub ciężkich obciążeń, w których synteza po narzędziu może zasadnie pozostawać cicha dłużej niż końcowy budżet wydania asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex nie pozwalają na YOLO | Ustawienie wstępne dla wykonywania YOLO albo wykonywania przeglądanego przez guardian.                                                                                                                                                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` albo dozwolona polityka zatwierdzania guardian | Natywna polityka zatwierdzania Codex wysyłana przy uruchomieniu wątku, wznowieniu i turze.                                                                                                                                                                                                                                                                                                      |
| `sandbox`                                     | `"danger-full-access"` albo dozwolona piaskownica guardian | Natywny tryb piaskownicy Codex wysyłany przy uruchomieniu i wznowieniu wątku. Aktywne piaskownice OpenClaw zawężają tury `danger-full-access` do Codex `workspace-write`; flaga sieciowa tury podąża za wyjściem sieciowym piaskownicy OpenClaw.                                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` albo dozwolony recenzent guardian             | Użyj `"auto_review"`, aby pozwolić Codex przeglądać natywne monity zatwierdzania, gdy jest to dozwolone.                                                                                                                                                                                                                                                                                        |
| `defaultWorkspaceDir`                         | katalog bieżącego procesu                              | Obszar roboczy używany przez `/codex bind`, gdy pominięto `--cwd`.                                                                                                                                                                                                                                                                                                                              |
| `serviceTier`                                 | nieustawione                                           | Opcjonalna warstwa usługi Codex app-server. `"priority"` włącza trasowanie fast-mode, `"flex"` żąda przetwarzania flex, a `null` czyści nadpisanie. Starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                                        |
| `networkProxy`                                | wyłączone                                              | Włącz obsługę sieci profilu uprawnień Codex dla poleceń app-server. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją przez `default_permissions` zamiast wysyłać `sandbox`.                                                                                                                                                                                 |
| `experimental.sandboxExecServer`              | `false`                                                | Opcja podglądowa, która rejestruje środowisko Codex wspierane piaskownicą OpenClaw w Codex app-server 0.132.0 lub nowszym, aby natywne wykonywanie Codex mogło działać wewnątrz aktywnej piaskownicy OpenClaw.                                                                                                                                                                                  |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt piaskownicy Codex.
Po włączeniu OpenClaw ustawia także `features.network_proxy.enabled` i
`default_permissions` w konfiguracji wątku Codex, aby wygenerowany profil
uprawnień mógł uruchomić sieć zarządzaną przez Codex. Domyślnie OpenClaw
generuje odporną na kolizje nazwę profilu `openclaw-network-<fingerprint>` z
treści profilu; użyj `profileName` tylko wtedy, gdy wymagana jest stabilna
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

Jeśli normalnym środowiskiem uruchomieniowym app-server byłoby
`danger-full-access`, włączenie `networkProxy` używa dostępu do systemu plików w
stylu obszaru roboczego dla wygenerowanego profilu uprawnień. Zarządzane przez
Codex egzekwowanie sieci jest siecią w piaskownicy, więc profil z pełnym
dostępem nie chroniłby ruchu wychodzącego.

Plugin blokuje starsze albo niewersjonowane uzgadniania app-server. Codex
app-server musi zgłaszać stabilną wersję `0.125.0` lub nowszą.

OpenClaw traktuje adresy URL app-servera WebSocket inne niż loopback jako zdalne i wymaga
uwierzytelniania WebSocket niosącego tożsamość przez `appServer.authToken` lub
nagłówek `Authorization`. `appServer.authToken` i każda wartość `appServer.headers.*`
może być SecretInput; środowisko uruchomieniowe sekretów rozwiązuje SecretRefs i skróty
env, zanim OpenClaw zbuduje opcje uruchamiania app-servera, a nierozwiązane
ustrukturyzowane SecretRefs powodują błąd przed wysłaniem jakiegokolwiek tokenu lub
nagłówka. Gdy skonfigurowane są natywne pluginy Codex, OpenClaw używa płaszczyzny
sterowania pluginami połączonego app-servera, aby zainstalować lub odświeżyć te
pluginy, a następnie odświeża inwentarz aplikacji, tak aby aplikacje należące do
pluginów były widoczne dla wątku Codex. `app/list` pozostaje autorytatywnym źródłem
inwentarza i metadanych, ale polityka OpenClaw decyduje, czy `thread/start` wysyła
`config.apps[appId].enabled = true` dla wymienionej dostępnej aplikacji, nawet jeśli
Codex obecnie oznacza ją jako wyłączoną. Nieznane lub brakujące identyfikatory aplikacji
pozostają domyślnie zablokowane; ta ścieżka aktywuje tylko pluginy z marketplace przez
`plugin/install` i odświeża inwentarz. Łącz OpenClaw tylko ze zdalnymi app-serverami,
którym można ufać w zakresie akceptowania instalacji pluginów zarządzanych przez
OpenClaw i odświeżania inwentarza aplikacji.

## Tryby zatwierdzania i sandboxa

Lokalne sesje app-servera stdio domyślnie używają trybu YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Ta postawa zaufanego lokalnego operatora pozwala
nienadzorowanym turom OpenClaw i heartbeatom robić postęp bez natywnych monitów o
zatwierdzenie, na które nikt nie może odpowiedzieć.

Jeśli lokalny plik wymagań systemowych Codex nie zezwala na niejawne wartości
zatwierdzania YOLO, recenzenta lub sandboxa, OpenClaw traktuje niejawne ustawienie
domyślne jako guardian i wybiera dozwolone uprawnienia guardian. `tools.exec.mode: "auto"`
również wymusza zatwierdzenia Codex recenzowane przez guardian i nie zachowuje
niebezpiecznych starszych nadpisań `approvalPolicy: "never"` ani
`sandbox: "danger-full-access"`; ustaw `tools.exec.mode: "full"` dla celowej postawy
bez zatwierdzeń. Wpisy `[[remote_sandbox_config]]` dopasowane do nazwy hosta w tym
samym pliku wymagań są respektowane przy decyzji o domyślnym sandboxie.

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
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`, gdy te wartości
są dozwolone. Poszczególne pola polityki nadpisują `mode`. Starsza wartość recenzenta
`guardian_subagent` jest nadal akceptowana jako alias zgodności, ale nowe konfiguracje
powinny używać `auto_review`.

Gdy sandbox OpenClaw jest aktywny, lokalny proces app-servera Codex nadal działa na
hoście Gateway. Dlatego OpenClaw wyłącza natywny Code Mode Codex, serwery MCP
użytkownika oraz wykonywanie pluginów wspieranych przez aplikacje dla tej tury, zamiast
traktować sandboxing po stronie hosta Codex jako równoważny backendowi sandboxa
OpenClaw. Dostęp do powłoki jest udostępniany przez dynamiczne narzędzia wspierane
sandboxem OpenClaw, takie jak `sandbox_exec` i `sandbox_process`, gdy normalne narzędzia
exec/process są dostępne.

Na hostach Ubuntu/AppArmor Codex bwrap może zawieść w `workspace-write` przed
uruchomieniem polecenia powłoki, gdy celowo uruchamiasz natywne Codex
`workspace-write` bez aktywnego sandboxingu OpenClaw. Jeśli zobaczysz
`bwrap: setting up uid map: Permission denied` lub
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, uruchom
`openclaw doctor` i napraw zgłoszoną politykę przestrzeni nazw hosta dla użytkownika
usługi OpenClaw, zamiast nadawać szersze uprawnienia kontenera Docker. Preferuj
zakresowy profil AppArmor dla procesu usługi; obejście
`kernel.apparmor_restrict_unprivileged_userns=0` działa na całym hoście i ma kompromisy
bezpieczeństwa.

## Sandboxowane natywne wykonywanie

Stabilne ustawienie domyślne to blokada w razie niepowodzenia: aktywny sandboxing
OpenClaw wyłącza natywne powierzchnie wykonywania Codex, które w przeciwnym razie
działałyby z hosta app-servera Codex. Użyj `appServer.experimental.sandboxExecServer: true`
tylko wtedy, gdy chcesz wypróbować obsługę zdalnego środowiska Codex z backendem
sandboxa OpenClaw. Ta ścieżka podglądu wymaga app-servera Codex 0.132.0 lub nowszego.

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

Gdy flaga jest włączona, a bieżąca sesja OpenClaw jest sandboxowana, OpenClaw uruchamia
lokalny local loopback exec-server wspierany aktywnym sandboxem, rejestruje go w
app-serverze Codex oraz uruchamia wątek i turę Codex z tym środowiskiem należącym do
OpenClaw. Jeśli app-server nie może zarejestrować środowiska, uruchomienie kończy się
blokadą zamiast cicho wracać do wykonywania na hoście.

Ta ścieżka podglądu jest tylko lokalna. Zdalny app-server WebSocket nie może dotrzeć do
loopback exec-servera, chyba że działa na tym samym hoście, więc OpenClaw odrzuca taką
kombinację.

## Uwierzytelnianie i izolacja środowiska

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto app-servera w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień app-servera stdio, `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta app-servera, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw zobaczy profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich
modeli OpenAI, bez przypadkowego rozliczania natywnych tur app-servera Codex przez API.

Jawne profile kluczy API Codex i lokalny fallback kluczy env stdio używają logowania
app-servera zamiast odziedziczonego env procesu potomnego. Połączenia app-servera
WebSocket nie otrzymują fallbacku klucza API env z Gateway; użyj jawnego profilu
uwierzytelniania albo własnego konta zdalnego app-servera.

Uruchomienia app-servera stdio domyślnie dziedziczą środowisko procesu OpenClaw.
OpenClaw jest właścicielem mostu kont app-servera Codex i ustawia `CODEX_HOME` na
katalog per-agent pod stanem OpenClaw tego agenta. Dzięki temu konfiguracja Codex,
konta, pamięć podręczna/dane pluginów i stan wątku są ograniczone do agenta OpenClaw,
zamiast przeciekać z osobistego katalogu domowego operatora `~/.codex`.

OpenClaw nie przepisuje `HOME` dla normalnych lokalnych uruchomień app-servera.
Podprocesy uruchamiane przez Codex, takie jak `openclaw`, `gh`, `git`, CLI chmurowe
i polecenia powłoki, widzą normalny katalog domowy procesu i mogą znaleźć konfigurację
oraz tokeny z katalogu domowego użytkownika. Codex może też odkryć
`$HOME/.agents/skills` i `$HOME/.agents/plugins/marketplace.json`; to odkrywanie
`.agents` jest celowo współdzielone z katalogiem domowym operatora i jest oddzielne od
izolowanego stanu `~/.codex`.

Pluginy OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny rejestr
pluginów i loader Skills OpenClaw. Osobiste zasoby Codex `~/.codex` nie. Jeśli masz
przydatne Skills lub pluginy CLI Codex z katalogu domowego Codex, które powinny stać
się częścią agenta OpenClaw, zinwentaryzuj je jawnie:

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

`appServer.clearEnv` wpływa tylko na uruchamiany proces potomny app-servera Codex.
OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji lokalnego
uruchamiania: `CODEX_HOME` pozostaje per-agent, a `HOME` pozostaje dziedziczone, aby
podprocesy mogły używać normalnego stanu z katalogu domowego użytkownika.

## Dynamiczne narzędzia

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable`. OpenClaw nie
udostępnia dynamicznych narzędzi, które duplikują natywne operacje przestrzeni roboczej
Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Większość pozostałych narzędzi integracyjnych OpenClaw, takich jak wiadomości, media,
cron, przeglądarka, węzły, gateway, `heartbeat_respond` i `web_search`, jest dostępna
przez wyszukiwanie narzędzi Codex w przestrzeni nazw `openclaw`. Dzięki temu początkowy
kontekst modelu jest mniejszy. `sessions_yield` i odpowiedzi źródłowe wyłącznie dla
narzędzi wiadomości pozostają bezpośrednie, ponieważ są to kontrakty sterowania turą.
`sessions_spawn` pozostaje wyszukiwalne, aby natywne `spawn_agent` Codex pozostało
główną powierzchnią podagentów Codex, podczas gdy jawna delegacja OpenClaw lub ACP jest
nadal dostępna przez przestrzeń nazw dynamicznych narzędzi `openclaw`.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
app-serverem Codex, który nie może wyszukiwać odroczonych dynamicznych narzędzi, albo
podczas debugowania pełnego payloadu narzędzi.

## Limity czasu

Wywołania dynamicznych narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`. Każde żądanie Codex `item/tool/call` używa pierwszego
dostępnego limitu czasu w tej kolejności:

- Dodatni argument per-wywołanie `timeoutMs`.
- Dla `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Dla `image_generate` bez skonfigurowanego limitu czasu, domyślne 120 sekund dla
  generowania obrazów.
- Dla narzędzia rozumienia mediów `image`, `tools.media.image.timeoutSeconds`
  przeliczone na milisekundy albo domyślne 60 sekund dla mediów. Dla rozumienia obrazów
  dotyczy to samego żądania i nie jest zmniejszane przez wcześniejszą pracę
  przygotowawczą.
- Domyślne 90 sekund dla dynamicznych narzędzi.

Ten watchdog jest zewnętrznym budżetem dynamicznego `item/tool/call`. Limity czasu
żądań specyficzne dla providerów działają wewnątrz tego wywołania i zachowują własną
semantykę limitów czasu. Budżety dynamicznych narzędzi są ograniczone do 600000 ms. Po
przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia tam, gdzie jest to
obsługiwane, i zwraca do Codex nieudaną odpowiedź dynamicznego narzędzia, aby tura mogła
trwać dalej zamiast pozostawić sesję w stanie `processing`.

Po zaakceptowaniu tury przez Codex oraz po odpowiedzi OpenClaw na żądanie app-servera
ograniczone do tury harness oczekuje, że Codex zrobi postęp w bieżącej turze i
ostatecznie zakończy natywną turę przez `turn/completed`. Jeśli app-server zamilknie na
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw w trybie best-effort przerywa turę
Codex, zapisuje diagnostyczne przekroczenie limitu czasu i zwalnia pasmo sesji
OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za nieaktualną natywną turą.

Większość nieterminalnych powiadomień dla tej samej tury rozbraja ten krótki mechanizm nadzorujący, ponieważ Codex potwierdził, że tura nadal żyje. Przekazania do narzędzi używają dłuższego budżetu bezczynności po narzędziu: po tym, jak OpenClaw zwróci odpowiedź `item/tool/call`, po ukończeniu natywnych elementów narzędziowych, takich jak `commandExecution`, po ukończeniach surowych `custom_tool_call_output` oraz po surowym postępie asystenta po narzędziu, ukończeniach surowego rozumowania lub postępie rozumowania. Strażnik używa `appServer.postToolRawAssistantCompletionIdleTimeoutMs`, gdy jest skonfigurowane, a w przeciwnym razie domyślnie pięciu minut. Ten sam budżet po narzędziu rozszerza również mechanizm nadzorujący postęp dla cichego okna syntezy, zanim Codex wyemituje następne zdarzenie bieżącej tury. Ukończenia rozumowania, ukończenia `agentMessage` w komentarzu oraz surowy postęp rozumowania lub asystenta przed narzędziem mogą zostać zakończone automatyczną odpowiedzią końcową, więc używają strażnika odpowiedzi po postępie zamiast natychmiast zwalniać ścieżkę sesji. Tylko końcowe/niekomentarzowe ukończone elementy `agentMessage` oraz surowe ukończenia asystenta przed narzędziem uzbrajają zwolnienie wyjścia asystenta: jeśli Codex następnie milknie bez `turn/completed`, OpenClaw w trybie best-effort przerywa natywną turę i zwalnia ścieżkę sesji. Bezpieczne do odtworzenia awarie serwera aplikacji stdio, w tym limity czasu bezczynności ukończenia tury bez dowodów asystenta, narzędzia, aktywnego elementu lub efektu ubocznego, są ponawiane raz przy świeżej próbie serwera aplikacji. Niebezpieczne limity czasu nadal wycofują zablokowanego klienta serwera aplikacji i zwalniają ścieżkę sesji OpenClaw. Czyszczą też przestarzałe natywne powiązanie wątku zamiast być automatycznie odtwarzane. Limity czasu obserwacji ukończenia pokazują tekst limitu czasu specyficzny dla Codex: przypadki bezpieczne do odtworzenia informują, że odpowiedź może być niekompletna, a przypadki niebezpieczne mówią użytkownikowi, aby zweryfikował bieżący stan przed ponowieniem. Publiczna diagnostyka limitów czasu obejmuje pola strukturalne, takie jak ostatnia metoda powiadomienia serwera aplikacji, identyfikator/typ/rola elementu surowej odpowiedzi asystenta, liczba aktywnych żądań/elementów oraz uzbrojony stan obserwacji. Gdy ostatnim powiadomieniem jest element surowej odpowiedzi asystenta, obejmuje również ograniczony podgląd tekstu asystenta. Nie obejmuje surowej treści promptu ani narzędzia.

## Odkrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacji o dostępne modele. Dostępność modeli jest własnością serwera aplikacji Codex, więc lista może się zmienić, gdy OpenClaw uaktualni dołączoną wersję `@openai/codex` albo gdy wdrożenie skieruje `appServer.command` na inny plik binarny Codex. Dostępność może też zależeć od konta. Użyj `/codex models` na działającym Gateway, aby zobaczyć aktywny katalog dla tego środowiska uruchomieniowego i konta.

Jeśli odkrywanie nie powiedzie się lub przekroczy limit czasu, OpenClaw używa dołączonego katalogu awaryjnego dla:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Bieżące dołączone środowisko uruchomieniowe to `@openai/codex` `0.139.0`. Próba `model/list` względem tego dołączonego serwera aplikacji zwróciła:

| Identyfikator modelu | Domyślny | Ukryty | Modalności wejściowe | Poziomy rozumowania     |
| -------------------- | -------- | ------ | -------------------- | ----------------------- |
| `gpt-5.5`            | Tak      | Nie    | tekst, obraz         | low, medium, high, xhigh |
| `gpt-5.4`            | Nie      | Nie    | tekst, obraz         | low, medium, high, xhigh |
| `gpt-5.4-mini`       | Nie      | Nie    | tekst, obraz         | low, medium, high, xhigh |
| `gpt-5.3-codex`      | Nie      | Nie    | tekst, obraz         | low, medium, high, xhigh |
| `gpt-5.2`            | Nie      | Nie    | tekst, obraz         | low, medium, high, xhigh |

Ukryte modele mogą być zwracane przez katalog serwera aplikacji dla wewnętrznych lub wyspecjalizowanych przepływów, ale nie są zwykłymi opcjami w selektorze modeli.

Dostrój odkrywanie w `plugins.entries.codex.config.discovery`:

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

Wyłącz odkrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i używało tylko katalogu awaryjnego:

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

## Pliki inicjalizacji obszaru roboczego

Codex sam obsługuje `AGENTS.md` przez natywne odkrywanie dokumentacji projektu. OpenClaw nie zapisuje syntetycznych plików dokumentacji projektu Codex ani nie zależy od awaryjnych nazw plików Codex dla plików persony, ponieważ mechanizmy awaryjne Codex mają zastosowanie tylko wtedy, gdy brakuje `AGENTS.md`.

Aby zachować zgodność obszaru roboczego OpenClaw, środowisko uruchomieniowe Codex rozwiązuje pozostałe pliki inicjalizacyjne. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` i `USER.md` są przekazywane jako instrukcje developerskie OpenClaw Codex, ponieważ definiują aktywnego agenta, dostępne wskazówki obszaru roboczego i profil użytkownika. Zwięzła lista Skills OpenClaw jest przekazywana jako instrukcje developerskie współpracy o zakresie tury. Treść `HEARTBEAT.md` nie jest wstrzykiwana; tury heartbeat otrzymują wskaźnik trybu współpracy, aby przeczytać plik, gdy istnieje i nie jest pusty. Treść `MEMORY.md` ze skonfigurowanego obszaru roboczego agenta nie jest wklejana do natywnego wejścia tury Codex, gdy narzędzia pamięci są dostępne dla tego obszaru roboczego; gdy istnieje, środowisko uruchomieniowe dodaje mały wskaźnik pamięci obszaru roboczego do instrukcji developerskich współpracy o zakresie tury, a Codex powinien użyć `memory_search` lub `memory_get`, gdy trwała pamięć jest istotna. Jeśli narzędzia są wyłączone, wyszukiwanie pamięci jest niedostępne albo aktywny obszar roboczy różni się od obszaru roboczego pamięci agenta, `MEMORY.md` używa normalnej ograniczonej ścieżki kontekstu tury.
`BOOTSTRAP.md`, gdy istnieje, jest przekazywany jako kontekst odniesienia wejścia tury OpenClaw.

## Nadpisania środowiskowe

Nadpisania środowiskowe pozostają dostępne do testowania lokalnego:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy `appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj `plugins.entries.codex.config.appServer.mode: "guardian"` albo `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego testowania lokalnego. Konfiguracja jest preferowana w przypadku powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie pluginu w tym samym sprawdzanym pliku co resztę konfiguracji środowiska uruchomieniowego Codex.

## Powiązane

- [Środowisko uruchomieniowe Codex](/pl/plugins/codex-harness)
- [Runtime środowiska uruchomieniowego Codex](/pl/plugins/codex-harness-runtime)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Dostawca OpenAI](/pl/providers/openai)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
