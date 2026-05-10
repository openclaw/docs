---
read_when:
    - Potrzebujesz każdego pola konfiguracji mechanizmu Codex
    - Zmieniasz zachowanie app-server w zakresie transportu, uwierzytelniania, wykrywania lub limitów czasu
    - Debugujesz uruchamianie środowiska Codex, wykrywanie modeli lub izolację środowiska
summary: Dokumentacja referencyjna konfiguracji, uwierzytelniania, wykrywania i serwera aplikacji dla środowiska Codex
title: Dokumentacja referencyjna środowiska uruchomieniowego Codex
x-i18n:
    generated_at: "2026-05-10T19:44:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Ta dokumentacja referencyjna obejmuje szczegółową konfigurację dołączonego Pluginu `codex`. W przypadku konfiguracji i decyzji dotyczących routingu zacznij od
[środowiska Codex](/pl/plugins/codex-harness).

## Powierzchnia konfiguracji Pluginu

Wszystkie ustawienia środowiska Codex znajdują się w `plugins.entries.codex.config`.

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

| Pole                       | Domyślnie               | Znaczenie                                                                                                                                                        |
| -------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | włączone                | Ustawienia wykrywania modeli dla `model/list` serwera aplikacji Codex.                                                                                           |
| `appServer`                | zarządzany stdio serwer aplikacji | Ustawienia transportu, polecenia, uwierzytelniania, zatwierdzania, piaskownicy i limitów czasu.                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`          | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex.                                                |
| `codexDynamicToolsExclude` | `[]`                    | Dodatkowe nazwy dynamicznych narzędzi OpenClaw, które mają być pomijane w turach serwera aplikacji Codex.                                                        |
| `codexPlugins`             | wyłączone               | Natywna obsługa Pluginów/aplikacji Codex dla zmigrowanych, instalowanych ze źródeł, kuratorowanych Pluginów. Zobacz [Natywne Pluginy Codex](/pl/plugins/codex-native-plugins). |
| `computerUse`              | wyłączone               | Konfiguracja Codex Computer Use. Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use).                                                                       |

## Transport serwera aplikacji

Domyślnie OpenClaw uruchamia zarządzany plik binarny Codex dostarczany z dołączonym Pluginem:

```bash
codex app-server --listen stdio://
```

Dzięki temu wersja serwera aplikacji pozostaje powiązana z dołączonym Pluginem `codex`, zamiast z dowolnym osobnym CLI Codex, które akurat jest zainstalowane lokalnie. Ustaw `appServer.command` tylko wtedy, gdy celowo chcesz uruchomić inny plik wykonywalny.

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

| Pole                          | Domyślnie                                             | Znaczenie                                                                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                               |
| `command`                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego.                                                                                                      |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | Argumenty dla transportu stdio.                                                                                                                                                                           |
| `url`                         | nieustawione                                          | Adres URL WebSocket serwera aplikacji.                                                                                                                                                                    |
| `authToken`                   | nieustawione                                          | Token Bearer dla transportu WebSocket.                                                                                                                                                                    |
| `headers`                     | `{}`                                                  | Dodatkowe nagłówki WebSocket.                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                                  | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu serwera aplikacji stdio po zbudowaniu przez OpenClaw odziedziczonego środowiska.                                                |
| `requestTimeoutMs`            | `60000`                                               | Limit czasu dla wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                         |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | Okno ciszy po żądaniu serwera aplikacji ograniczonym do tury, podczas gdy OpenClaw czeka na `turn/completed`.                                                                                             |
| `mode`                        | `"yolo"`, chyba że lokalne wymagania Codex nie zezwalają na YOLO | Preset dla wykonywania YOLO albo sprawdzanego przez opiekuna.                                                                                                                                             |
| `approvalPolicy`              | `"never"` albo dozwolona polityka zatwierdzania opiekuna | Natywna polityka zatwierdzania Codex wysyłana przy uruchomieniu wątku, wznowieniu i turze.                                                                                                                |
| `sandbox`                     | `"danger-full-access"` albo dozwolona piaskownica opiekuna | Natywny tryb piaskownicy Codex wysyłany przy uruchomieniu i wznowieniu wątku.                                                                                                                             |
| `approvalsReviewer`           | `"user"` albo dozwolony recenzent opiekuna            | Użyj `"auto_review"`, aby pozwolić Codex sprawdzać natywne monity zatwierdzeń, gdy jest to dozwolone.                                                                                                     |
| `defaultWorkspaceDir`         | katalog bieżącego procesu                             | Przestrzeń robocza używana przez `/codex bind`, gdy pominięto `--cwd`.                                                                                                                                    |
| `serviceTier`                 | nieustawione                                          | Opcjonalna warstwa usług serwera aplikacji Codex. `"priority"` włącza routing w trybie szybkim, `"flex"` żąda przetwarzania flex, a `null` czyści nadpisanie. Starsze `"fast"` jest akceptowane jako `"priority"`. |

Plugin blokuje starsze lub niewersjonowane uzgadniania serwera aplikacji. Serwer aplikacji Codex musi zgłaszać stabilną wersję `0.125.0` lub nowszą.

## Tryby zatwierdzania i piaskownicy

Lokalne sesje serwera aplikacji stdio domyślnie używają trybu YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Ta zaufana lokalna postawa operatora pozwala nienadzorowanym turom OpenClaw i Heartbeatom robić postępy bez natywnych monitów zatwierdzeń, na które nie ma komu odpowiedzieć.

Jeśli plik lokalnych wymagań systemowych Codex nie zezwala na niejawne wartości zatwierdzania, recenzenta lub piaskownicy YOLO, OpenClaw traktuje niejawną wartość domyślną jako guardian i wybiera dozwolone uprawnienia guardian. Wpisy `[[remote_sandbox_config]]` w tym samym pliku wymagań, dopasowane do nazwy hosta, są respektowane przy podejmowaniu decyzji o domyślnej piaskownicy.

Ustaw `appServer.mode: "guardian"` dla zatwierdzeń Codex sprawdzanych przez guardian:

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
`approvalsReviewer: "auto_review"` i `sandbox: "workspace-write"`, gdy te wartości są dozwolone. Poszczególne pola polityki nadpisują `mode`. Starsza wartość recenzenta `guardian_subagent` jest nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać `auto_review`.

## Uwierzytelnianie i izolacja środowiska

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, następnie
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich modeli OpenAI bez przypadkowego rozliczania natywnych tur serwera aplikacji Codex przez API.

Jawne profile klucza API Codex oraz lokalny fallback kluczy środowiskowych stdio używają logowania serwera aplikacji zamiast odziedziczonego środowiska procesu potomnego. Połączenia WebSocket z serwerem aplikacji nie otrzymują fallbacku kluczy API środowiska Gateway; użyj jawnego profilu uwierzytelniania albo własnego konta zdalnego serwera aplikacji.

Uruchomienia serwera aplikacji stdio domyślnie dziedziczą środowisko procesu OpenClaw, ale OpenClaw zarządza mostem konta serwera aplikacji Codex i ustawia zarówno `CODEX_HOME`, jak i `HOME` na katalogi per agent w stanie OpenClaw tego agenta. Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` i `$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień serwera aplikacji. Dzięki temu natywne dla Codex Skills, Pluginy, konfiguracja, konta i stan wątku są ograniczone do agenta OpenClaw, zamiast wyciekać z osobistego katalogu domowego CLI Codex operatora.

Pluginy OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny rejestr Pluginów i loader Skills w OpenClaw. Osobiste zasoby CLI Codex nie przepływają. Jeśli masz przydatne Skills lub Pluginy CLI Codex, które powinny stać się częścią agenta OpenClaw, zinwentaryzuj je jawnie:

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

`appServer.clearEnv` wpływa tylko na uruchomiony proces potomny serwera aplikacji Codex.
`CODEX_HOME` i `HOME` pozostają zarezerwowane dla izolacji Codex per agent w OpenClaw przy lokalnych uruchomieniach.

## Narzędzia dynamiczne

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia dynamicznych narzędzi, które duplikują natywne operacje obszaru roboczego Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Pozostałe narzędzia integracji OpenClaw, takie jak wiadomości, sesje, media, cron,
przeglądarka, węzły, gateway, `heartbeat_respond` i `web_search`, są dostępne
przez wyszukiwanie narzędzi Codex w przestrzeni nazw `openclaw`. Dzięki temu
początkowy kontekst modelu jest mniejszy. `sessions_yield` i odpowiedzi źródłowe
tylko przez narzędzie wiadomości pozostają bezpośrednie, ponieważ są to kontrakty
kontroli tury.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
serwerem aplikacji Codex, który nie może wyszukiwać odroczonych narzędzi dynamicznych,
albo podczas debugowania pełnego ładunku narzędzi.

## Limity czasu

Wywołania narzędzi dynamicznych należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`. Każde żądanie Codex `item/tool/call` używa pierwszego
dostępnego limitu czasu w tej kolejności:

- Dodatni argument `timeoutMs` dla pojedynczego wywołania.
- Dla `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Dla narzędzia `image` do rozumienia mediów, `tools.media.image.timeoutSeconds`
  przeliczone na milisekundy albo domyślne 60 sekund dla mediów.
- Domyślne 30 sekund dla narzędzi dynamicznych.

Budżety narzędzi dynamicznych są ograniczone do 600000 ms. Po przekroczeniu limitu
czasu OpenClaw przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca
nieudaną odpowiedź narzędzia dynamicznego do Codex, aby tura mogła być kontynuowana
zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie serwera aplikacji o zakresie tury Codex,
harness oczekuje również, że Codex zakończy natywną turę przez `turn/completed`.
Jeśli serwer aplikacji pozostaje bezczynny przez `appServer.turnCompletionIdleTimeoutMs`
po tej odpowiedzi, OpenClaw w trybie best-effort przerywa turę Codex, zapisuje
diagnostyczne przekroczenie limitu czasu i zwalnia pas sesji OpenClaw, aby kolejne
wiadomości czatu nie były kolejkowane za nieaktualną natywną turą.

Każde nieterminalne powiadomienie dla tej samej tury, w tym
`rawResponseItem/completed`, rozbraja ten krótki watchdog, ponieważ Codex dowiódł,
że tura nadal działa. Dłuższy watchdog terminalny nadal chroni przed rzeczywiście
zablokowanymi turami. Diagnostyka limitów czasu obejmuje ostatnią metodę
powiadomienia serwera aplikacji oraz, dla surowych elementów odpowiedzi asystenta,
typ elementu, rolę, identyfikator i ograniczony podgląd tekstu asystenta.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacji o dostępne modele. Dostępność modeli
należy do serwera aplikacji Codex, więc lista może się zmienić, gdy OpenClaw
zaktualizuje dołączoną wersję `@openai/codex` albo gdy wdrożenie skieruje
`appServer.command` na inny plik binarny Codex. Dostępność może też zależeć od
konta. Użyj `/codex models` na działającym gateway, aby zobaczyć aktywny katalog
dla tego harness i konta.

Jeśli wykrywanie się nie powiedzie lub przekroczy limit czasu, OpenClaw używa
dołączonego katalogu awaryjnego dla:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Obecny dołączony harness to `@openai/codex` `0.130.0`. Próba `model/list`
wobec tego dołączonego serwera aplikacji zwróciła:

| Identyfikator modelu  | Domyślny | Ukryty | Modalności wejściowe | Wysiłki rozumowania      |
| --------------------- | -------- | ------ | -------------------- | ------------------------ |
| `gpt-5.5`             | Tak      | Nie    | tekst, obraz         | low, medium, high, xhigh |
| `gpt-5.4`             | Nie      | Nie    | tekst, obraz         | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Nie      | Nie    | tekst, obraz         | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Nie      | Nie    | tekst, obraz         | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Nie      | Nie    | tekst                | low, medium, high, xhigh |
| `gpt-5.2`             | Nie      | Nie    | tekst, obraz         | low, medium, high, xhigh |

Ukryte modele mogą być zwracane przez katalog serwera aplikacji dla wewnętrznych
lub wyspecjalizowanych przepływów, ale nie są zwykłymi opcjami wyboru modelu.

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

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i używało
wyłącznie katalogu awaryjnego:

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

## Pliki bootstrap obszaru roboczego

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentacji projektu.
OpenClaw nie zapisuje syntetycznych plików dokumentacji projektu Codex ani nie
zależy od awaryjnych nazw plików Codex dla plików persony, ponieważ mechanizmy
awaryjne Codex mają zastosowanie tylko wtedy, gdy brakuje `AGENTS.md`.

Aby zachować parytet obszaru roboczego OpenClaw, harness Codex rozwiązuje pozostałe
pliki bootstrap, w tym `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md`, gdy są obecne, i przekazuje je
przez instrukcje deweloperskie Codex w `thread/start` i `thread/resume`.
Dzięki temu kontekst persony i profilu obszaru roboczego pozostaje widoczny
w natywnym pasie kształtowania zachowania Codex bez duplikowania `AGENTS.md`.

## Nadpisania środowiskowe

Nadpisania środowiskowe pozostają dostępne do testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` pomija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych.
Konfiguracja jest preferowana przy powtarzalnych wdrożeniach, ponieważ utrzymuje
zachowanie Plugin w tym samym zrecenzowanym pliku co reszta konfiguracji harness Codex.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Środowisko uruchomieniowe harness Codex](/pl/plugins/codex-harness-runtime)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Dostawca OpenAI](/pl/providers/openai)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
