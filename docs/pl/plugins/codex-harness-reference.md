---
read_when:
    - Potrzebujesz każdego pola konfiguracji harnessa Codex
    - Zmieniasz transport, uwierzytelnianie, wykrywanie lub zachowanie limitu czasu app-server
    - Debugujesz uruchamianie harnessu Codex, wykrywanie modelu lub izolację środowiska
summary: Konfiguracja, uwierzytelnianie, wykrywanie i dokumentacja app-server dla harnessu Codex
title: Dokumentacja referencyjna mechanizmu Codex
x-i18n:
    generated_at: "2026-07-04T11:05:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Ta dokumentacja referencyjna omawia szczegółową konfigurację dołączonego Pluginu `codex`. W przypadku decyzji dotyczących konfiguracji i routingu zacznij od
[środowiska uruchomieniowego Codex](/pl/plugins/codex-harness).

## Powierzchnia konfiguracji Pluginu

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

Obsługiwane pola najwyższego poziomu:

| Pole                       | Wartość domyślna         | Znaczenie                                                                                                                                       |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | włączone                 | Ustawienia wykrywania modeli dla `model/list` app-servera Codex.                                                                                |
| `appServer`                | zarządzany app-server stdio | Ustawienia transportu, polecenia, uwierzytelniania, zatwierdzania, sandboxa i limitów czasu.                                                     |
| `codexDynamicToolsLoading` | `"searchable"`           | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex.                               |
| `codexDynamicToolsExclude` | `[]`                     | Dodatkowe nazwy dynamicznych narzędzi OpenClaw, które należy pominąć w turach app-servera Codex.                                                 |
| `codexPlugins`             | wyłączone                | Natywna obsługa Pluginów/aplikacji Codex dla zmigrowanych, instalowanych ze źródeł, kuratorowanych Pluginów. Zobacz [natywne Pluginy Codex](/pl/plugins/codex-native-plugins). |
| `computerUse`              | wyłączone                | Konfiguracja Codex Computer Use. Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use).                                                       |

## Transport app-servera

Domyślnie OpenClaw uruchamia zarządzany plik binarny Codex dostarczany z dołączonym
Pluginem:

```bash
codex app-server --listen stdio://
```

Dzięki temu wersja app-servera jest powiązana z dołączonym Pluginem `codex`, a nie z
dowolnym osobnym Codex CLI, które akurat jest zainstalowane lokalnie. Ustaw
`appServer.command` tylko wtedy, gdy celowo chcesz uruchomić inny
plik wykonywalny.

Dla już uruchomionego app-servera użyj transportu WebSocket:

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

| Pole                                          | Domyślne                                              | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                                                                      |
| `homeScope`                                   | `"agent"`                                              | `"agent"` izoluje stan Codex dla każdego agenta OpenClaw. `"user"` współdzieli natywne `$CODEX_HOME` lub `~/.codex`, używa natywnego uwierzytelniania i włącza zarządzanie wątkami tylko przez właściciela. Zakres użytkownika wymaga stdio.                                                                                                                                                   |
| `command`                                     | zarządzany plik binarny Codex                          | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego.                                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | nieustawione                                           | Adres URL WebSocket app-server.                                                                                                                                                                                                                                                                                                                                                                  |
| `authToken`                                   | nieustawione                                           | Token Bearer dla transportu WebSocket. Przyjmuje literał tekstowy lub SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                         |
| `headers`                                     | `{}`                                                   | Dodatkowe nagłówki WebSocket. Wartości nagłówków przyjmują literały tekstowe lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-server stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska.                                                                                                                                                                                                                                               |
| `remoteWorkspaceRoot`                         | nieustawione                                           | Zdalny katalog główny obszaru roboczego app-server Codex. Gdy jest ustawiony, OpenClaw wnioskuje lokalny katalog główny obszaru roboczego z rozwiązanego obszaru roboczego OpenClaw, zachowuje bieżący sufiks cwd pod tym zdalnym katalogiem głównym i wysyła do Codex tylko końcowy cwd app-server. Jeśli cwd znajduje się poza rozwiązanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw odmawia w trybie fail-closed zamiast wysyłać ścieżkę lokalną dla Gateway do zdalnego app-server. |
| `requestTimeoutMs`                            | `60000`                                                | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Okno ciszy po zaakceptowaniu tury przez Codex lub po żądaniu app-server w zakresie tury, gdy OpenClaw czeka na `turn/completed`.                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Strażnik bezczynności ukończenia i postępu używany po przekazaniu do narzędzia, natywnym ukończeniu narzędzia, postępie surowej odpowiedzi asystenta po narzędziu, ukończeniu surowego rozumowania lub postępie rozumowania, gdy OpenClaw czeka na `turn/completed`. Używaj tego dla zaufanych lub ciężkich obciążeń, w których synteza po narzędziu może zasadnie pozostawać cicha dłużej niż końcowy budżet wydania odpowiedzi asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex zabraniają YOLO | Ustawienie wstępne dla wykonania YOLO lub wykonania z recenzją opiekuna.                                                                                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` lub dozwolona polityka zatwierdzania opiekuna | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu wątku, wznowieniu i turze.                                                                                                                                                                                                                                                                                                        |
| `sandbox`                                     | `"danger-full-access"` lub dozwolona piaskownica opiekuna | Natywny tryb piaskownicy Codex wysyłany przy rozpoczęciu i wznowieniu wątku. Aktywne piaskownice OpenClaw zawężają tury `danger-full-access` do Codex `workspace-write`; flaga sieci tury podąża za wyjściem piaskownicy OpenClaw.                                                                                                                                                             |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent opiekuna              | Użyj `"auto_review"`, aby pozwolić Codex recenzować natywne monity zatwierdzania, gdy jest to dozwolone.                                                                                                                                                                                                                                                                                        |
| `defaultWorkspaceDir`                         | katalog bieżącego procesu                              | Obszar roboczy używany przez `/codex bind`, gdy pominięto `--cwd`.                                                                                                                                                                                                                                                                                                                              |
| `serviceTier`                                 | nieustawione                                           | Opcjonalny poziom usługi app-server Codex. `"priority"` włącza routing w trybie szybkim, `"flex"` żąda przetwarzania flex, a `null` czyści nadpisanie. Starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                                      |
| `networkProxy`                                | wyłączone                                              | Włącza sieć profilu uprawnień Codex dla poleceń app-server. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją za pomocą `default_permissions` zamiast wysyłać `sandbox`.                                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | Eksperymentalna zgoda na podgląd, która rejestruje środowisko Codex oparte na piaskownicy OpenClaw w Codex app-server 0.132.0 lub nowszym, aby natywne wykonanie Codex mogło działać wewnątrz aktywnej piaskownicy OpenClaw.                                                                                                                                                                    |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt piaskownicy Codex.
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

Jeśli normalne środowisko uruchomieniowe app-server byłoby `danger-full-access`, włączenie
`networkProxy` używa dostępu do systemu plików w stylu workspace dla wygenerowanego
profilu uprawnień. Zarządzane przez Codex egzekwowanie sieci to sieć w piaskownicy,
więc profil z pełnym dostępem nie chroniłby ruchu wychodzącego.

Plugin blokuje starsze lub niewersjonowane uzgodnienia app-server. Codex app-server
musi zgłaszać stabilną wersję `0.125.0` lub nowszą.

OpenClaw traktuje adresy URL WebSocket app-server spoza loopback jako zdalne i wymaga
uwierzytelniania WebSocket z tożsamością przez `appServer.authToken` albo nagłówek
`Authorization`. `appServer.authToken` i każda wartość `appServer.headers.*`
mogą być SecretInput; środowisko uruchomieniowe sekretów rozwiązuje SecretRefs i skróty
env, zanim OpenClaw zbuduje opcje startowe app-server, a nierozwiązane
ustrukturyzowane SecretRefs kończą się niepowodzeniem, zanim jakikolwiek token lub nagłówek
zostanie wysłany. Gdy skonfigurowane są natywne Pluginy Codex, OpenClaw używa płaszczyzny
sterowania pluginami połączonego app-server, aby zainstalować lub odświeżyć te Pluginy,
a następnie odświeża inwentarz aplikacji, tak aby aplikacje należące do Pluginów były
widoczne dla wątku Codex. `app/list` nadal jest autorytatywnym źródłem inwentarza
i metadanych, ale polityka OpenClaw decyduje, czy `thread/start` wysyła
`config.apps[appId].enabled = true` dla wymienionej dostępnej aplikacji, nawet jeśli
Codex obecnie oznacza ją jako wyłączoną. Nieznane lub brakujące identyfikatory aplikacji
nadal pozostają fail-closed; ta ścieżka aktywuje tylko Pluginy z marketplace przez
`plugin/install` i odświeża inwentarz. Łącz OpenClaw tylko ze zdalnymi app-serverami,
którym ufasz, że będą akceptować zarządzane przez OpenClaw instalacje Pluginów
i odświeżenia inwentarza aplikacji.

## Tryby zatwierdzania i piaskownicy

Lokalne sesje app-server stdio domyślnie używają trybu YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Ta zaufana postawa lokalnego operatora pozwala
nienadzorowanym turam OpenClaw i heartbeatom robić postępy bez natywnych monitów
o zatwierdzenie, na które nikt nie może odpowiedzieć.

Jeśli lokalny plik wymagań systemowych Codex nie pozwala na niejawne wartości zatwierdzania
YOLO, recenzenta lub piaskownicy, OpenClaw traktuje niejawne ustawienie domyślne
zamiast tego jako guardian i wybiera dozwolone uprawnienia guardian. `tools.exec.mode: "auto"`
również wymusza zatwierdzenia Codex recenzowane przez guardian i nie zachowuje niebezpiecznych
starszych nadpisań `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`;
ustaw `tools.exec.mode: "full"` dla celowej postawy bez zatwierdzeń.
Wpisy
`[[remote_sandbox_config]]` dopasowane do nazwy hosta w tym samym pliku wymagań są honorowane
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
serwery MCP użytkownika i wykonywanie Pluginów opartych na aplikacjach dla tej tury,
zamiast traktować piaskownicę po stronie hosta Codex jako równoważną backendowi
piaskownicy OpenClaw. Dostęp do powłoki jest udostępniany przez dynamiczne narzędzia
wspierane piaskownicą OpenClaw, takie jak `sandbox_exec` i `sandbox_process`, gdy
normalne narzędzia exec/process są dostępne.

Na hostach Ubuntu/AppArmor Codex bwrap może zakończyć się niepowodzeniem pod
`workspace-write`, zanim polecenie powłoki wystartuje, gdy celowo uruchamiasz natywne
Codex `workspace-write` bez aktywnej piaskownicy OpenClaw. Jeśli widzisz
`bwrap: setting up uid map: Permission denied` albo
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, uruchom
`openclaw doctor` i napraw zgłoszoną politykę przestrzeni nazw hosta dla użytkownika
usługi OpenClaw, zamiast przyznawać szersze uprawnienia kontenera Docker. Preferuj
profil AppArmor ograniczony do procesu usługi; obejście
`kernel.apparmor_restrict_unprivileged_userns=0` działa dla całego hosta i wiąże się
z kompromisami bezpieczeństwa.

## Natywne wykonywanie w piaskownicy

Stabilne ustawienie domyślne to fail-closed: aktywna piaskownica OpenClaw wyłącza natywne
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
uruchamia lokalny exec-server local loopback wspierany przez aktywną piaskownicę,
rejestruje go w Codex app-server i uruchamia wątek oraz turę Codex z tym
środowiskiem należącym do OpenClaw. Jeśli app-server nie może zarejestrować środowiska,
uruchomienie kończy się fail-closed zamiast po cichu wracać do wykonywania na hoście.

Ta ścieżka podglądowa jest tylko lokalna. Zdalny WebSocket app-server nie może dotrzeć do
loopback exec-server, chyba że działa na tym samym hoście, dlatego OpenClaw odrzuca
taką kombinację.

## Izolacja uwierzytelniania i środowiska

W domyślnym katalogu domowym per agenta uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto app-server w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień app-server stdio: `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta app-server, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchomionego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich modeli
OpenAI, bez przypadkowego rozliczania natywnych tur Codex app-server przez API.

Jawne profile klucza API Codex i lokalny fallback klucza env stdio używają logowania
app-server zamiast odziedziczonego env procesu potomnego. Połączenia WebSocket app-server
nie otrzymują fallbacku klucza API env Gateway; użyj jawnego profilu uwierzytelniania
albo własnego konta zdalnego app-server.

Uruchomienia app-server stdio domyślnie dziedziczą środowisko procesu OpenClaw.
OpenClaw jest właścicielem mostu kont Codex app-server i ustawia `CODEX_HOME` na
katalog per agenta w stanie OpenClaw tego agenta. Dzięki temu konfiguracja Codex,
konta, pamięć podręczna/dane Pluginów i stan wątków są ograniczone do agenta OpenClaw,
zamiast wyciekać z osobistego katalogu domowego operatora `~/.codex`.

Ustaw `appServer.homeScope: "user"`, aby współdzielić natywny stan Codex z Codex
Desktop i CLI. Ten tryb tylko dla lokalnego stdio używa `$CODEX_HOME`, gdy jest ustawione,
a w przeciwnym razie `~/.codex`, w tym natywnego uwierzytelniania, konfiguracji,
Pluginów i wątków. OpenClaw pomija swój most profilu uwierzytelniania dla app-server.
Zweryfikowane tury właściciela mogą używać `codex_threads` do listowania, wyszukiwania,
odczytu, forkowania, zmiany nazwy, archiwizacji i przywracania tych wątków. Sforkuj
wątek przed kontynuowaniem go w OpenClaw; niezależne procesy Codex nie koordynują
równoczesnych zapisujących dla tego samego wątku.

OpenClaw nie przepisuje `HOME` dla normalnych lokalnych uruchomień app-server. Podprocesy
uruchamiane przez Codex, takie jak `openclaw`, `gh`, `git`, CLI chmurowe i polecenia
powłoki, widzą normalny katalog domowy procesu i mogą znaleźć konfigurację oraz tokeny
z katalogu domowego użytkownika. Codex może także odkryć `$HOME/.agents/skills` oraz
`$HOME/.agents/plugins/marketplace.json`; to odkrywanie `.agents` jest celowo współdzielone
z katalogiem domowym operatora i jest oddzielne od izolowanego stanu `~/.codex`.

W domyślnym zakresie agenta Pluginy OpenClaw i migawki Skills OpenClaw nadal przepływają
przez własny rejestr Pluginów i loader Skills OpenClaw; osobiste zasoby Codex
`~/.codex` nie. Jeśli masz przydatne Skills lub Pluginy CLI Codex z katalogu domowego
Codex, które powinny stać się częścią izolowanego agenta OpenClaw, zinwentaryzuj je
jawnie:

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

`appServer.clearEnv` wpływa tylko na uruchomiony proces potomny Codex app-server.
OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji lokalnego uruchomienia:
`CODEX_HOME` pozostaje skierowane na wybrany zakres agenta lub użytkownika,
a `HOME` pozostaje dziedziczone, aby podprocesy mogły używać normalnego stanu
z katalogu domowego użytkownika.

## Narzędzia dynamiczne

Narzędzia dynamiczne Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
narzędzi dynamicznych, które powielają natywne operacje workspace Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Większość pozostałych narzędzi integracyjnych OpenClaw, takich jak wiadomości, media, cron,
przeglądarka, węzły, Gateway, `heartbeat_respond` i `web_search`, jest dostępna
przez wyszukiwanie narzędzi Codex w przestrzeni nazw `openclaw`. Dzięki temu początkowy
kontekst modelu jest mniejszy. `sessions_yield` i odpowiedzi źródłowe tylko dla narzędzi
wiadomości pozostają bezpośrednie, ponieważ są to kontrakty sterowania turą.
`sessions_spawn` pozostaje searchable, aby natywne `spawn_agent` Codex pozostało główną
powierzchnią subagentów Codex, podczas gdy jawna delegacja OpenClaw lub ACP nadal jest
dostępna przez przestrzeń nazw narzędzi dynamicznych `openclaw`.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
Codex app-server, który nie może wyszukiwać odroczonych narzędzi dynamicznych, albo podczas
debugowania pełnego ładunku narzędzi.

## Limity czasu

Wywołania narzędzi dynamicznych należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`. Każde żądanie Codex `item/tool/call` używa pierwszego
dostępnego limitu czasu w tej kolejności:

- Dodatni argument per wywołanie `timeoutMs`.
- Dla `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Dla `image_generate` bez skonfigurowanego limitu czasu domyślne 120 sekund
  generowania obrazów.
- Dla narzędzia rozumienia mediów `image`, `tools.media.image.timeoutSeconds`
  przekonwertowane na milisekundy albo domyślne 60 sekund dla mediów. Dla rozumienia
  obrazów dotyczy to samego żądania i nie jest zmniejszane przez wcześniejszą pracę
  przygotowawczą.
- Domyślne 90 sekund narzędzi dynamicznych.

Ten watchdog jest zewnętrznym budżetem dynamicznego `item/tool/call`. Limity czasu żądań
specyficzne dla dostawcy działają wewnątrz tego wywołania i zachowują własną semantykę
limitów czasu. Budżety narzędzi dynamicznych są ograniczone do 600000 ms. Po przekroczeniu
limitu czasu OpenClaw przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca
nieudane response narzędzia dynamicznego do Codex, aby tura mogła kontynuować zamiast
pozostawiać sesję w stanie `processing`.

Po tym, jak Codex zaakceptuje turę, oraz po tym, jak OpenClaw odpowie na żądanie app-server
o zakresie tury, harness oczekuje, że Codex będzie robić postępy w bieżącej turze
i ostatecznie zakończy natywną turę przez `turn/completed`. Jeśli app-server milczy przez
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw w trybie best-effort przerywa turę Codex,
zapisuje diagnostyczne przekroczenie limitu czasu i zwalnia pas sesji OpenClaw, aby kolejne
wiadomości czatu nie były kolejkowane za nieaktualną natywną turą.

Większość nieterminalnych powiadomień dla tej samej tury rozbraja ten krótki watchdog,
ponieważ Codex udowodnił, że tura nadal jest aktywna. Przekazania narzędzi używają dłuższego
budżetu bezczynności po narzędziu: po tym, jak OpenClaw zwróci odpowiedź `item/tool/call`, po
zakończeniu natywnych elementów narzędzi, takich jak `commandExecution`, po surowych
zakończeniach `custom_tool_call_output` oraz po surowym postępie asystenta po narzędziu,
surowych zakończeniach rozumowania albo postępie rozumowania. Strażnik używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, gdy jest skonfigurowane, a w przeciwnym
razie domyślnie używa pięciu minut. Ten sam budżet po narzędziu wydłuża też watchdog postępu
dla cichego okna syntezy, zanim Codex wyemituje następne zdarzenie bieżącej tury. Zakończenia
rozumowania, zakończenia komentarzy `agentMessage` oraz surowy postęp rozumowania lub asystenta
przed narzędziem mogą zostać uzupełnione automatyczną odpowiedzią końcową, więc używają strażnika
odpowiedzi po postępie zamiast natychmiast zwalniać pas sesji. Tylko końcowe/niekomentarzowe
ukończone elementy `agentMessage` oraz surowe zakończenia asystenta przed narzędziem uzbrajają
zwolnienie wyjścia asystenta: jeśli Codex potem ucichnie bez `turn/completed`, OpenClaw w trybie
best-effort przerywa natywną turę i zwalnia pas sesji. Bezpieczne do odtworzenia awarie stdio
app-servera, w tym limity czasu bezczynności ukończenia tury bez dowodów asystenta, narzędzia,
aktywnego elementu lub efektów ubocznych, są ponawiane raz w nowej próbie app-servera. Niebezpieczne
limity czasu nadal wycofują zablokowanego klienta app-servera i zwalniają pas sesji OpenClaw.
Czyszczą też nieaktualne powiązanie natywnego wątku zamiast automatycznie je odtwarzać. Limity
czasu obserwacji ukończenia pokazują tekst limitu czasu specyficzny dla Codex: przypadki bezpieczne
do odtworzenia informują, że odpowiedź może być niekompletna, a przypadki niebezpieczne mówią
użytkownikowi, aby zweryfikował bieżący stan przed ponowną próbą. Publiczna diagnostyka limitów
czasu obejmuje pola strukturalne, takie jak ostatnia metoda powiadomienia app-servera, id/typ/rola
surowego elementu odpowiedzi asystenta, liczby aktywnych żądań/elementów oraz uzbrojony stan
obserwacji. Gdy ostatnim powiadomieniem jest surowy element odpowiedzi asystenta, obejmuje też
ograniczony podgląd tekstu asystenta. Nie obejmuje surowej treści promptu ani narzędzi.

## Wykrywanie modeli

Domyślnie plugin Codex prosi app-server o dostępne modele. Dostępność modeli należy do app-servera
Codex, więc lista może się zmienić, gdy OpenClaw zaktualizuje dołączoną wersję `@openai/codex`
albo gdy wdrożenie skieruje `appServer.command` na inny binarny plik Codex. Dostępność może też
zależeć od konta. Użyj `/codex models` na działającym gatewayu, aby zobaczyć aktywny katalog
dla tego harnessu i konta.

Jeśli wykrywanie nie powiedzie się lub przekroczy limit czasu, OpenClaw używa dołączonego katalogu
zapasowego dla:

- GPT-5.5
- GPT-5.4 mini

Bieżący dołączony harness to `@openai/codex` `0.142.4`. Sonda `model/list` wobec tego dołączonego
app-servera w przestrzeni roboczej z włączonym GPT-5.6 zwróciła te publiczne wiersze selektora:

| Identyfikator modelu  | Modalności wejściowe | Nakłady rozumowania                    |
| --------------------- | -------------------- | -------------------------------------- |
| `gpt-5.6-sol`         | tekst, obraz         | low, medium, high, xhigh, max, ultra   |
| `gpt-5.6-terra`       | tekst, obraz         | low, medium, high, xhigh, max, ultra   |
| `gpt-5.6-luna`        | tekst, obraz         | low, medium, high, xhigh, max          |
| `gpt-5.5`             | tekst, obraz         | low, medium, high, xhigh               |
| `gpt-5.4`             | tekst, obraz         | low, medium, high, xhigh               |
| `gpt-5.4-mini`        | tekst, obraz         | low, medium, high, xhigh               |
| `gpt-5.4-pro`         | tekst, obraz         | medium, high, xhigh                    |
| `gpt-5.3-codex-spark` | tekst                | low, medium, high, xhigh               |

Dostęp do GPT-5.6 zależy od konta w okresie ograniczonego podglądu. `max` jest nakładem
rozumowania modelu. `ultra` to osobne metadane wieloagentowej orkiestracji Codex, a nie standardowy
nakład rozumowania OpenAI.

Ukryte modele mogą być zwracane przez katalog app-servera dla wewnętrznych lub wyspecjalizowanych
przepływów, ale nie są zwykłymi wyborami selektora modeli.

Dostrój wykrywanie pod `plugins.entries.codex.config.discovery`:

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

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i używało tylko katalogu
zapasowego:

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

## Pliki bootstrapu przestrzeni roboczej

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentacji projektu. OpenClaw nie zapisuje
syntetycznych plików dokumentacji projektu Codex ani nie zależy od zapasowych nazw plików Codex dla
plików persony, ponieważ mechanizmy zapasowe Codex mają zastosowanie tylko wtedy, gdy brakuje
`AGENTS.md`.

Dla parytetu przestrzeni roboczej OpenClaw harness Codex rozwiązuje pozostałe pliki bootstrapu.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` i `USER.md` są przekazywane jako instrukcje deweloperskie
OpenClaw Codex, ponieważ definiują aktywnego agenta, dostępne wskazówki przestrzeni roboczej oraz
profil użytkownika. Zwarta lista Skills OpenClaw jest przekazywana jako instrukcje deweloperskie
współpracy o zakresie tury. Treść `HEARTBEAT.md` nie jest wstrzykiwana; tury heartbeat otrzymują
wskaźnik trybu współpracy, aby odczytać plik, gdy istnieje i nie jest pusty. Treść `MEMORY.md`
ze skonfigurowanej przestrzeni roboczej agenta nie jest wklejana do natywnego wejścia tury Codex,
gdy narzędzia pamięci są dostępne dla tej przestrzeni roboczej; gdy istnieje, harness dodaje mały
wskaźnik pamięci przestrzeni roboczej do instrukcji deweloperskich współpracy o zakresie tury, a
Codex powinien używać `memory_search` lub `memory_get`, gdy trwała pamięć jest istotna. Jeśli
narzędzia są wyłączone, wyszukiwanie w pamięci jest niedostępne albo aktywna przestrzeń robocza
różni się od przestrzeni roboczej pamięci agenta, `MEMORY.md` używa normalnej ograniczonej ścieżki
kontekstu tury.
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
preferowana w powtarzalnych wdrożeniach, ponieważ utrzymuje zachowanie pluginu w tym samym
sprawdzanym pliku co resztę konfiguracji harnessu Codex.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Dostawca OpenAI](/pl/providers/openai)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
