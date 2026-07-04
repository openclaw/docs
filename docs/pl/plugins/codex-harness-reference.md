---
read_when:
    - Potrzebujesz każdego pola konfiguracji uprzęży Codex
    - Zmieniasz zachowanie transportu, uwierzytelniania, wykrywania lub limitu czasu app-server
    - Debugujesz uruchamianie harnessu Codex, wykrywanie modeli lub izolację środowiska
summary: Dokumentacja konfiguracji, uwierzytelniania, wykrywania i serwera aplikacji dla uprzęży Codex
title: Dokumentacja referencyjna uprzęży Codex
x-i18n:
    generated_at: "2026-07-04T20:44:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

To odniesienie omawia szczegółową konfigurację dołączonego Pluginu `codex`.
W kwestii konfiguracji i decyzji dotyczących routingu zacznij od
[harnessu Codex](/pl/plugins/codex-harness).

## Powierzchnia konfiguracji Pluginu

Wszystkie ustawienia harnessu Codex znajdują się pod `plugins.entries.codex.config`.

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

| Pole                       | Domyślnie                | Znaczenie                                                                                                                                 |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | włączone                 | Ustawienia wykrywania modeli dla `model/list` serwera aplikacji Codex.                                                                    |
| `appServer`                | zarządzany serwer aplikacji stdio | Ustawienia transportu, polecenia, uwierzytelniania, zatwierdzania, piaskownicy i limitów czasu.                                           |
| `codexDynamicToolsLoading` | `"searchable"`           | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex.                         |
| `codexDynamicToolsExclude` | `[]`                     | Dodatkowe nazwy dynamicznych narzędzi OpenClaw, które mają zostać pominięte w turach serwera aplikacji Codex.                              |
| `codexPlugins`             | wyłączone                | Natywna obsługa pluginów/aplikacji Codex dla zmigrowanych, instalowanych ze źródeł, kuratorowanych pluginów. Zobacz [Natywne pluginy Codex](/pl/plugins/codex-native-plugins). |
| `computerUse`              | wyłączone                | Konfiguracja Codex Computer Use. Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use).                                                 |

## Transport serwera aplikacji

Domyślnie OpenClaw uruchamia zarządzany plik binarny Codex dostarczany z dołączonym
Pluginem:

```bash
codex app-server --listen stdio://
```

Dzięki temu wersja serwera aplikacji jest powiązana z dołączonym Pluginem `codex`, a nie z
dowolnym oddzielnym Codex CLI, który akurat jest zainstalowany lokalnie. Ustaw
`appServer.command` tylko wtedy, gdy celowo chcesz uruchomić inny
plik wykonywalny.

Dla już działającego serwera aplikacji użyj transportu WebSocket:

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

| Pole                                          | Domyślne                                              | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                                                                                  |
| `homeScope`                                   | `"agent"`                                              | `"agent"` izoluje stan Codex dla każdego agenta OpenClaw. `"user"` współdzieli natywny `$CODEX_HOME` lub `~/.codex`, używa natywnego uwierzytelniania i włącza zarządzanie wątkami tylko przez właściciela. Zakres użytkownika wymaga stdio.                                                                                                                                                                  |
| `command`                                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego.                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | nieustawione                                          | Adres URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                              |
| `authToken`                                   | nieustawione                                          | Token Bearer dla transportu WebSocket. Akceptuje dosłowny ciąg znaków lub SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują dosłowne ciągi znaków lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                      |
| `clearEnv`                                    | `[]`                                                   | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-server stdio po zbudowaniu przez OpenClaw odziedziczonego środowiska.                                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | nieustawione                                          | Zdalny katalog główny obszaru roboczego app-server Codex. Gdy jest ustawiony, OpenClaw wywnioskuje lokalny katalog główny obszaru roboczego z rozwiązanego obszaru roboczego OpenClaw, zachowa bieżący sufiks cwd pod tym zdalnym katalogiem głównym i wyśle do Codex tylko końcowe cwd app-server. Jeśli cwd znajduje się poza rozwiązanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw zakończy działanie w trybie fail-closed zamiast wysyłać lokalną dla Gateway ścieżkę do zdalnego app-server. |
| `requestTimeoutMs`                            | `60000`                                                | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ciche okno po zaakceptowaniu tury przez Codex albo po żądaniu app-server w zakresie tury, gdy OpenClaw czeka na `turn/completed`.                                                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Strażnik bezczynności ukończenia i postępu używany po przekazaniu do narzędzia, natywnym ukończeniu narzędzia, postępie surowego asystenta po narzędziu, ukończeniu surowego rozumowania lub postępie rozumowania, gdy OpenClaw czeka na `turn/completed`. Używaj tego dla zaufanych lub ciężkich obciążeń, w których synteza po narzędziu może zasadnie pozostawać cicha dłużej niż końcowy budżet wydania asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex nie zezwalają na YOLO | Ustawienie wstępne dla wykonywania YOLO lub wykonywania sprawdzanego przez strażnika.                                                                                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` lub dozwolona polityka zatwierdzania strażnika | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu wątku, wznowieniu i turze.                                                                                                                                                                                                                                                                                                                    |
| `sandbox`                                     | `"danger-full-access"` lub dozwolony sandbox strażnika | Natywny tryb sandbox Codex wysyłany przy rozpoczęciu i wznowieniu wątku. Aktywne sandboxy OpenClaw zawężają tury `danger-full-access` do Codex `workspace-write`; flaga sieci tury podąża za wyjściem z sandboxa OpenClaw.                                                                                                                                                                                    |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent strażnika             | Użyj `"auto_review"`, aby pozwolić Codex przeglądać natywne monity zatwierdzeń, gdy jest to dozwolone.                                                                                                                                                                                                                                                                                                       |
| `defaultWorkspaceDir`                         | katalog bieżącego procesu                             | Obszar roboczy używany przez `/codex bind`, gdy `--cwd` jest pominięte.                                                                                                                                                                                                                                                                                                                                      |
| `serviceTier`                                 | nieustawione                                          | Opcjonalna warstwa usługi app-server Codex. `"priority"` włącza trasowanie w trybie szybkim, `"flex"` żąda przetwarzania flex, a `null` czyści nadpisanie. Starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                                              |
| `networkProxy`                                | wyłączone                                             | Włącza sieć profilu uprawnień Codex dla poleceń app-server. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją za pomocą `default_permissions` zamiast wysyłania `sandbox`.                                                                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                                | Eksperymentalne włączenie podglądu, które rejestruje środowisko Codex oparte na sandboxie OpenClaw w Codex app-server 0.132.0 lub nowszym, aby natywne wykonywanie Codex mogło działać wewnątrz aktywnego sandboxa OpenClaw.                                                                                                                                                                                 |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt sandboxa Codex.
Po włączeniu OpenClaw ustawia także `features.network_proxy.enabled` i
`default_permissions` w konfiguracji wątku Codex, aby wygenerowany profil
uprawnień mógł uruchomić sieć zarządzaną przez Codex. Domyślnie OpenClaw generuje
odporną na kolizje nazwę profilu `openclaw-network-<fingerprint>` z treści
profilu; używaj `profileName` tylko wtedy, gdy wymagana jest stabilna nazwa lokalna.

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

Jeśli normalne środowisko uruchomieniowe app-servera miałoby `danger-full-access`, włączenie
`networkProxy` używa dostępu do systemu plików w stylu obszaru roboczego dla wygenerowanego
profilu uprawnień. Zarządzane przez Codex egzekwowanie sieci to sieć w piaskownicy,
więc profil pełnego dostępu nie chroniłby ruchu wychodzącego.

Plugin blokuje starsze lub niewersjonowane uzgodnienia app-servera. Codex app-server
musi zgłaszać stabilną wersję `0.125.0` lub nowszą.

OpenClaw traktuje adresy URL WebSocket app-servera spoza loopback jako zdalne i wymaga
uwierzytelniania WebSocket niosącego tożsamość przez `appServer.authToken` albo nagłówek
`Authorization`. `appServer.authToken` oraz każda wartość `appServer.headers.*`
może być SecretInput; środowisko sekretów rozwiązuje SecretRefs i skrót env,
zanim OpenClaw zbuduje opcje startowe app-servera, a nierozwiązane
ustrukturyzowane SecretRefs kończą się niepowodzeniem, zanim jakikolwiek token lub nagłówek zostanie wysłany. Gdy skonfigurowane są natywne Pluginy Codex,
OpenClaw używa płaszczyzny sterowania Pluginami podłączonego app-servera, aby zainstalować lub odświeżyć te Pluginy, a następnie odświeża inwentarz aplikacji, aby
aplikacje należące do Pluginów były widoczne dla wątku Codex. `app/list` pozostaje
autorytatywnym źródłem inwentarza i metadanych, ale polityka OpenClaw decyduje, czy
`thread/start` wysyła `config.apps[appId].enabled = true` dla wymienionej dostępnej
aplikacji, nawet jeśli Codex obecnie oznacza ją jako wyłączoną. Nieznane lub brakujące identyfikatory aplikacji nadal kończą się bezpiecznym niepowodzeniem; ta ścieżka aktywuje tylko Pluginy z marketplace przez `plugin/install`
i odświeża inwentarz. Łącz OpenClaw wyłącznie ze zdalnymi app-serverami, którym ufasz, że zaakceptują instalacje Pluginów zarządzane przez OpenClaw oraz odświeżenia inwentarza aplikacji.

## Tryby zatwierdzania i piaskownicy

Lokalne sesje app-servera stdio domyślnie używają trybu YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Ta postawa zaufanego lokalnego operatora pozwala
nienadzorowanym turom OpenClaw i Heartbeat robić postępy bez natywnych monitów o zatwierdzenie,
na które nikt nie jest obecny, aby odpowiedzieć.

Jeśli lokalny plik wymagań systemowych Codex zabrania niejawnych wartości zatwierdzania YOLO,
recenzenta lub piaskownicy, OpenClaw traktuje niejawne ustawienie domyślne jako guardian
i wybiera dozwolone uprawnienia guardian. `tools.exec.mode: "auto"`
również wymusza zatwierdzenia Codex recenzowane przez guardian i nie zachowuje niebezpiecznych
starszych nadpisań `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`;
ustaw `tools.exec.mode: "full"` dla celowej postawy bez zatwierdzeń.
Dopasowywane po nazwie hosta wpisy
`[[remote_sandbox_config]]` w tym samym pliku wymagań są respektowane
przy decyzji o domyślnej piaskownicy.

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

Gdy piaskownica OpenClaw jest aktywna, lokalny proces Codex app-server nadal
działa na hoście Gateway. Dlatego OpenClaw wyłącza natywny Code Mode Codex,
serwery MCP użytkownika oraz wykonywanie Pluginów wspieranych przez aplikacje dla tej tury, zamiast
traktować piaskownicę po stronie hosta Codex jako równoważną z backendem piaskownicy
OpenClaw. Dostęp do powłoki jest udostępniany przez dynamiczne narzędzia wspierane piaskownicą OpenClaw,
takie jak `sandbox_exec` i `sandbox_process`, gdy normalne narzędzia exec/process
są dostępne.

Na hostach Ubuntu/AppArmor Codex bwrap może zawieść w `workspace-write`, zanim
polecenie powłoki się rozpocznie, gdy celowo uruchamiasz natywne Codex
`workspace-write` bez aktywnej piaskownicy OpenClaw. Jeśli zobaczysz
`bwrap: setting up uid map: Permission denied` albo
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, uruchom
`openclaw doctor` i napraw zgłoszoną politykę przestrzeni nazw hosta dla użytkownika usługi OpenClaw,
zamiast przyznawać szersze uprawnienia kontenera Docker. Preferuj
zakresowy profil AppArmor dla procesu usługi; awaryjne
`kernel.apparmor_restrict_unprivileged_userns=0` działa dla całego hosta i ma
kompromisy bezpieczeństwa.

## Natywne wykonywanie w piaskownicy

Stabilne ustawienie domyślne to bezpieczne niepowodzenie: aktywna piaskownica OpenClaw wyłącza natywne
powierzchnie wykonywania Codex, które w przeciwnym razie działałyby z hosta Codex app-server.
Używaj `appServer.experimental.sandboxExecServer: true` tylko wtedy, gdy chcesz
wypróbować obsługę zdalnego środowiska Codex z backendem piaskownicy OpenClaw. Ta
ścieżka podglądowa wymaga Codex app-server 0.132.0 lub nowszego.

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
uruchamia local loopback exec-server wspierany aktywną piaskownicą, rejestruje go
w Codex app-server i uruchamia wątek oraz turę Codex z tym
środowiskiem należącym do OpenClaw. Jeśli app-server nie może zarejestrować środowiska,
uruchomienie kończy się bezpiecznym niepowodzeniem, zamiast po cichu wracać do wykonywania na hoście.

Ta ścieżka podglądowa jest tylko lokalna. Zdalny WebSocket app-server nie może dotrzeć do
loopback exec-servera, chyba że działa na tym samym hoście, więc OpenClaw odrzuca
taką kombinację.

## Uwierzytelnianie i izolacja środowiska

W domyślnym katalogu domowym per agent uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto app-servera w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień app-servera stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy nie ma konta app-servera, a uwierzytelnianie OpenAI
   jest nadal wymagane.

Gdy OpenClaw zobaczy profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchomionego procesu podrzędnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich modeli OpenAI,
bez przypadkowego rozliczania natywnych tur Codex app-servera przez API.

Jawne profile klucza API Codex i lokalny fallback klucza env stdio używają logowania app-servera
zamiast dziedziczonego env procesu podrzędnego. Połączenia WebSocket app-servera
nie otrzymują fallbacku klucza API env Gateway; użyj jawnego profilu uwierzytelniania albo
własnego konta zdalnego app-servera.

Uruchomienia app-servera stdio domyślnie dziedziczą środowisko procesu OpenClaw.
OpenClaw jest właścicielem mostu kont Codex app-servera i ustawia `CODEX_HOME` na
katalog per agent w stanie OpenClaw tego agenta. To utrzymuje konfigurację Codex,
konta, cache/dane Pluginów i stan wątków w zakresie agenta OpenClaw,
zamiast przeciekania z osobistego katalogu domowego operatora `~/.codex`.

Ustaw `appServer.homeScope: "user"`, aby współdzielić natywny stan Codex z Codex
Desktop i CLI. Ten tryb tylko dla lokalnego stdio używa `$CODEX_HOME`, gdy jest ustawione,
a w przeciwnym razie `~/.codex`, włącznie z natywnym uwierzytelnianiem, konfiguracją, Pluginami i wątkami.
OpenClaw pomija swój most profilu uwierzytelniania dla app-servera. Zweryfikowane tury właściciela
mogą używać `codex_threads` do wyświetlania, wyszukiwania, odczytu, forkowania, zmiany nazwy, archiwizacji i przywracania
tych wątków. Sforkuj wątek przed kontynuowaniem go w OpenClaw; niezależne
procesy Codex nie koordynują współbieżnych zapisujących dla tego samego wątku.

OpenClaw nie przepisuje `HOME` dla normalnych lokalnych uruchomień app-servera. Podprocesy uruchamiane przez Codex,
takie jak `openclaw`, `gh`, `git`, CLI chmurowe i polecenia powłoki, widzą
normalny katalog domowy procesu i mogą znaleźć konfigurację oraz tokeny w katalogu domowym użytkownika. Codex może też
wykrywać `$HOME/.agents/skills` i `$HOME/.agents/plugins/marketplace.json`;
to wykrywanie `.agents` jest celowo współdzielone z katalogiem domowym operatora i jest
oddzielne od izolowanego stanu `~/.codex`.

W domyślnym zakresie agenta Pluginy OpenClaw i snapshoty Skills OpenClaw nadal
przepływają przez własny rejestr Pluginów oraz loader Skills OpenClaw; osobiste zasoby Codex
`~/.codex` nie przepływają. Jeśli masz przydatne umiejętności lub Pluginy Codex CLI z
katalogu domowego Codex, które powinny stać się częścią izolowanego agenta OpenClaw, zinwentaryzuj
je jawnie:

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

`appServer.clearEnv` wpływa tylko na uruchomiony proces podrzędny Codex app-server.
OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji lokalnego uruchomienia:
`CODEX_HOME` pozostaje wskazane na wybrany zakres agenta lub użytkownika,
a `HOME` pozostaje dziedziczone, aby podprocesy mogły używać normalnego stanu katalogu domowego użytkownika.

## Narzędzia dynamiczne

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
dynamicznych narzędzi, które duplikują natywne operacje obszaru roboczego Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Większość pozostałych narzędzi integracyjnych OpenClaw, takich jak wiadomości, media, Cron,
przeglądarka, węzły, Gateway, `heartbeat_respond` i `web_search`, jest dostępna
przez wyszukiwanie narzędzi Codex w przestrzeni nazw `openclaw`. Dzięki temu początkowy
kontekst modelu jest mniejszy. `sessions_yield` oraz odpowiedzi źródłowe tylko dla narzędzi wiadomości
pozostają bezpośrednie, ponieważ są kontraktami sterowania turą. `sessions_spawn` pozostaje
wyszukiwalne, aby natywne `spawn_agent` Codex pozostało podstawową powierzchnią subagenta Codex,
podczas gdy jawna delegacja OpenClaw lub ACP jest nadal dostępna przez
przestrzeń nazw dynamicznych narzędzi `openclaw`.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym Codex
app-serverem, który nie może wyszukiwać odroczonych narzędzi dynamicznych, albo podczas debugowania pełnego
ładunku narzędzi.

## Limity czasu

Wywołania dynamicznych narzędzi należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`. Każde żądanie Codex `item/tool/call` używa pierwszego
dostępnego limitu czasu w tej kolejności:

- Dodatni argument per wywołanie `timeoutMs`.
- Dla `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Dla `image_generate` bez skonfigurowanego limitu czasu, domyślne 120 sekund
  generowania obrazów.
- Dla narzędzia rozumienia mediów `image`, `tools.media.image.timeoutSeconds`
  przekonwertowane na milisekundy albo domyślne 60 sekund dla mediów. Dla
  rozumienia obrazów dotyczy to samego żądania i nie jest zmniejszane przez
  wcześniejsze prace przygotowawcze.
- Domyślne 90 sekund narzędzia dynamicznego.

Ten watchdog jest zewnętrznym budżetem dynamicznego `item/tool/call`. Limity czasu żądań
specyficzne dla dostawcy działają wewnątrz tego wywołania i zachowują własną semantykę limitu czasu.
Budżety narzędzi dynamicznych są ograniczone do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa
sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca nieudaną odpowiedź dynamicznego narzędzia do Codex,
aby tura mogła być kontynuowana, zamiast zostawiać sesję w stanie `processing`.

Po tym, jak Codex zaakceptuje turę, oraz po tym, jak OpenClaw odpowie na żądanie app-servera
w zakresie tury, harness oczekuje, że Codex poczyni postęp w bieżącej turze i
ostatecznie zakończy natywną turę przez `turn/completed`. Jeśli app-server milczy
przez `appServer.turnCompletionIdleTimeoutMs`, OpenClaw w trybie best-effort
przerywa turę Codex, zapisuje diagnostyczny limit czasu i zwalnia
pas sesji OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za przestarzałą
natywną turą.

Większość nieterminalnych powiadomień dla tej samej tury rozbraja ten krótki mechanizm nadzorczy,
ponieważ Codex udowodnił, że tura nadal żyje. Przekazania do narzędzi używają dłuższego
budżetu bezczynności po narzędziu: po tym, jak OpenClaw zwróci odpowiedź `item/tool/call`, po
zakończeniu natywnych elementów narzędzi, takich jak `commandExecution`, po zakończeniach surowych
`custom_tool_call_output`, oraz po surowym postępie asystenta po narzędziu,
zakończeniach surowego rozumowania lub postępie rozumowania. Strażnik używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, gdy jest skonfigurowane, a w przeciwnym
razie domyślnie pięciu minut. Ten sam budżet po narzędziu wydłuża także
mechanizm nadzorczy postępu dla cichego okna syntezy, zanim Codex wyemituje następne
zdarzenie bieżącej tury. Zakończenia rozumowania, zakończenia
`agentMessage` w kanale komentarza oraz surowy postęp rozumowania lub asystenta przed narzędziem mogą
zostać uzupełnione automatyczną końcową odpowiedzią, więc używają strażnika odpowiedzi
po postępie zamiast natychmiast zwalniać pasmo sesji. Tylko
końcowe/niekomentarzowe ukończone elementy `agentMessage` oraz surowe zakończenia asystenta
przed narzędziem uzbrajają zwolnienie wyjścia asystenta: jeśli Codex potem zamilknie bez
`turn/completed`, OpenClaw w trybie best-effort przerywa natywną turę i zwalnia
pasmo sesji. Bezpieczne do odtworzenia awarie app-servera stdio, w tym
limity czasu bezczynności ukończenia tury bez dowodów asystenta, narzędzia, aktywnego elementu lub
skutku ubocznego, są ponawiane raz przy świeżej próbie app-servera. Niebezpieczne
limity czasu nadal wycofują zablokowanego klienta app-servera i zwalniają pasmo sesji
OpenClaw. Czyszczą też nieaktualne powiązanie natywnego wątku zamiast
odtwarzać je automatycznie. Limity czasu obserwacji ukończeń pokazują tekst limitu czasu
specyficzny dla Codex: przypadki bezpieczne do odtworzenia mówią, że odpowiedź może być niekompletna,
a przypadki niebezpieczne każą użytkownikowi zweryfikować bieżący stan przed ponowieniem. Publiczna
diagnostyka limitów czasu zawiera pola strukturalne, takie jak ostatnia metoda powiadomienia
app-servera, identyfikator/typ/rola surowego elementu odpowiedzi asystenta, liczby aktywnych
żądań/elementów oraz uzbrojony stan obserwacji. Gdy ostatnie powiadomienie jest surowym
elementem odpowiedzi asystenta, zawiera także ograniczony podgląd tekstu asystenta. Nie zawiera
surowej treści promptu ani narzędzia.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta app-server o dostępne modele. Dostępność modeli
należy do Codex app-server, więc lista może się zmienić, gdy OpenClaw
zaktualizuje dołączoną wersję `@openai/codex` albo gdy wdrożenie skieruje
`appServer.command` na inny plik binarny Codex. Dostępność może też zależeć od
konta. Użyj `/codex models` na działającym Gateway, aby zobaczyć bieżący katalog
dla tego harnessa i konta.

Jeśli wykrywanie się nie powiedzie albo przekroczy limit czasu, OpenClaw używa dołączonego katalogu awaryjnego dla:

- GPT-5.5
- GPT-5.4 mini

Obecny dołączony harness to `@openai/codex` `0.142.5`. Sonda `model/list`
wobec tego dołączonego app-servera zwróciła następujące publiczne wiersze selektora:

| Identyfikator modelu  | Modalności wejścia | Poziomy wysiłku rozumowania |
| --------------------- | ------------------ | --------------------------- |
| `gpt-5.5`             | tekst, obraz       | low, medium, high, xhigh    |
| `gpt-5.4`             | tekst, obraz       | low, medium, high, xhigh    |
| `gpt-5.4-mini`        | tekst, obraz       | low, medium, high, xhigh    |
| `gpt-5.3-codex-spark` | tekst              | low, medium, high, xhigh    |

Ukryte modele mogą być zwracane przez katalog app-servera dla wewnętrznych lub
wyspecjalizowanych przepływów, ale nie są zwykłymi wyborami w selektorze modeli.

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

## Pliki startowe obszaru roboczego

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentacji projektu. OpenClaw
nie zapisuje syntetycznych plików dokumentacji projektu Codex ani nie zależy od awaryjnych
nazw plików Codex dla plików persony, ponieważ rozwiązania awaryjne Codex mają zastosowanie tylko wtedy, gdy
brakuje `AGENTS.md`.

Dla parytetu obszaru roboczego OpenClaw harness Codex rozwiązuje pozostałe pliki
startowe. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` i `USER.md` są przekazywane jako
instrukcje deweloperskie OpenClaw Codex, ponieważ definiują aktywnego agenta,
dostępne wskazówki obszaru roboczego oraz profil użytkownika. Zwięzła lista OpenClaw Skills
jest przekazywana jako deweloperskie instrukcje współpracy ograniczone do tury.
Treść `HEARTBEAT.md` nie jest wstrzykiwana; tury Heartbeat otrzymują wskaźnik trybu współpracy,
aby odczytać plik, gdy istnieje i nie jest pusty. Treść `MEMORY.md`
ze skonfigurowanego obszaru roboczego agenta nie jest wklejana do natywnego wejścia tury Codex,
gdy narzędzia pamięci są dostępne dla tego obszaru roboczego; gdy istnieje, harness
dodaje mały wskaźnik pamięci obszaru roboczego do deweloperskich instrukcji współpracy
ograniczonych do tury, a Codex powinien użyć `memory_search` lub `memory_get`, gdy trwała
pamięć jest istotna. Jeśli narzędzia są wyłączone, wyszukiwanie pamięci jest niedostępne albo
aktywny obszar roboczy różni się od obszaru roboczego pamięci agenta, `MEMORY.md` używa
normalnej ograniczonej ścieżki kontekstu tury.
`BOOTSTRAP.md`, gdy jest obecny, jest przekazywany jako kontekst referencyjny wejścia tury OpenClaw.

## Nadpisania środowiska

Nadpisania środowiska pozostają dostępne do lokalnego testowania:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego lokalnego testowania. Konfiguracja jest
preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie Pluginu w tym samym
przeglądanym pliku co reszta konfiguracji harnessa Codex.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Runtime harnessa Codex](/pl/plugins/codex-harness-runtime)
- [Natywne Pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Dostawca OpenAI](/pl/providers/openai)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
