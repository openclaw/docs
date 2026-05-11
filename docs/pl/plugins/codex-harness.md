---
read_when:
    - Chcesz użyć dołączonego środowiska Codex app-server
    - Potrzebujesz przykładów konfiguracji harnessu Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się błędem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pośrednictwem dołączonego środowiska harness serwera aplikacji Codex
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-05-11T20:34:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta OpenAI
przez app-server Codex zamiast wbudowanego harnessa PI.

Użyj harnessa Codex, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
natywnym wznawianiem wątku, natywną kontynuacją narzędzi, natywną Compaction oraz
wykonywaniem w app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji,
wyborem modelu, dynamicznymi narzędziami OpenClaw, zatwierdzeniami, dostarczaniem
multimediów i widocznym lustrzanym zapisem transkrypcji.

Standardowa konfiguracja używa kanonicznych referencji modeli OpenAI, takich jak `openai/gpt-5.5`.
Nie konfiguruj referencji modeli `openai-codex/gpt-*`. Umieść kolejność uwierzytelniania agenta OpenAI
pod `auth.order.openai`; starsze profile `openai-codex:*` i wpisy
`auth.order.openai-codex` pozostają obsługiwane w istniejących instalacjach.

OpenClaw uruchamia wątki app-server Codex z natywnym trybem kodu Codex oraz
włączonym trybem tylko kodu. Dzięki temu odroczone/przeszukiwalne dynamiczne narzędzia OpenClaw
pozostają we własnym środowisku wykonywania kodu i powierzchni wyszukiwania narzędzi Codex,
zamiast dodawać wrapper wyszukiwania narzędzi w stylu PI na wierzchu Codex.

Szerszy podział modelu, dostawcy i środowiska uruchomieniowego zacznij od
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes). W skrócie:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Wymagania

- OpenClaw z dostępnym dołączonym Pluginem `codex`.
- Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij `codex`.
- Codex app-server `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarnym plikiem Codex app-server, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na standardowe uruchamianie harnessa.
- Uwierzytelnianie Codex dostępne przez `openclaw models auth login --provider openai-codex`,
  konto app-server w katalogu domowym Codex agenta albo jawny profil uwierzytelniania
  Codex z kluczem API.

Informacje o priorytecie uwierzytelniania, izolacji środowiska, niestandardowych poleceniach app-server,
odkrywaniu modeli i wszystkich polach konfiguracji znajdziesz w
[Referencji harnessa Codex](/pl/plugins/codex-harness-reference).

## Szybki start

Większość użytkowników, którzy chcą używać Codex w OpenClaw, wybiera tę ścieżkę: zaloguj się za pomocą
subskrypcji ChatGPT/Codex, włącz dołączony Plugin `codex` i użyj
kanonicznej referencji modelu `openai/gpt-*`.

Zaloguj się przez OAuth Codex:

```bash
openclaw models auth login --provider openai-codex
```

Włącz dołączony Plugin `codex` i wybierz model agenta OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
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

Jeśli Twoja konfiguracja używa `plugins.allow`, dodaj tam również `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Po zmianie konfiguracji Pluginu uruchom Gateway ponownie. Jeśli istniejący czat ma już
sesję, użyj `/new` albo `/reset` przed testowaniem zmian środowiska uruchomieniowego, aby następna
tura rozwiązała harness z bieżącej konfiguracji.

## Konfiguracja

Konfiguracja szybkiego startu to minimalna działająca konfiguracja harnessa Codex. Ustaw opcje
harnessa Codex w konfiguracji OpenClaw, a CLI używaj tylko do uwierzytelniania Codex:

| Potrzeba                               | Ustaw                                                                            | Gdzie                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Włącz harness                          | `plugins.entries.codex.enabled: true`                                            | Konfiguracja OpenClaw              |
| Utrzymaj instalację Pluginu z listą dozwolonych | Uwzględnij `codex` w `plugins.allow`                                             | Konfiguracja OpenClaw              |
| Kieruj tury agenta OpenAI przez Codex  | `agents.defaults.model` lub `agents.list[].model` jako `openai/gpt-*`            | Konfiguracja agenta OpenClaw       |
| Zaloguj się przez OAuth Codex          | `openclaw models auth login --provider openai-codex`                             | Profil uwierzytelniania CLI        |
| Dodaj zapasowy klucz API dla uruchomień Codex | Profil klucza API `openai:*` wymieniony po uwierzytelnianiu subskrypcji w `auth.order.openai` | Profil uwierzytelniania CLI + konfiguracja OpenClaw |
| Zakończ niepowodzeniem, gdy Codex jest niedostępny | `agentRuntime.id: "codex"` dostawcy lub modelu                                  | Konfiguracja modelu/dostawcy OpenClaw |
| Użyj bezpośredniego ruchu API OpenAI   | `agentRuntime.id: "pi"` dostawcy lub modelu ze standardowym uwierzytelnianiem OpenAI | Konfiguracja modelu/dostawcy OpenClaw |
| Dostrój zachowanie app-server          | `plugins.entries.codex.config.appServer.*`                                       | Konfiguracja Pluginu Codex         |
| Włącz natywne aplikacje Pluginów Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Konfiguracja Pluginu Codex         |
| Włącz Codex Computer Use               | `plugins.entries.codex.config.computerUse.*`                                     | Konfiguracja Pluginu Codex         |

Używaj referencji modeli `openai/gpt-*` dla tur agentów OpenAI obsługiwanych przez Codex. Preferuj
`auth.order.openai` dla kolejności: najpierw subskrypcja, potem zapasowy klucz API. Istniejące
profile uwierzytelniania `openai-codex:*` i `auth.order.openai-codex` pozostają prawidłowe, ale
nie zapisuj nowych referencji modeli `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

W tej postaci oba profile nadal działają przez Codex dla tur agenta
`openai/gpt-*`. Klucz API jest tylko zapasowym uwierzytelnianiem, a nie żądaniem przełączenia na PI ani
zwykłe OpenAI Responses.

Pozostała część tej strony omawia typowe warianty, spośród których użytkownicy muszą wybrać:
kształt wdrożenia, trasowanie z zamkniętym niepowodzeniem, politykę zatwierdzania opiekuna, natywne Pluginy Codex
oraz Computer Use. Pełne listy opcji, wartości domyślne, enumy, odkrywanie,
izolację środowiska, limity czasu i pola transportu app-server znajdziesz w
[Referencji harnessa Codex](/pl/plugins/codex-harness-reference).

## Weryfikacja środowiska uruchomieniowego Codex

Użyj `/status` w czacie, w którym oczekujesz Codex. Tura agenta OpenAI obsługiwana przez Codex
pokazuje:

```text
Runtime: OpenAI Codex
```

Następnie sprawdź stan app-server Codex:

```text
/codex status
/codex models
```

`/codex status` zgłasza łączność app-server, konto, limity szybkości, serwery MCP
oraz Skills. `/codex models` wyświetla bieżący katalog Codex app-server dla
harnessa i konta. Jeśli `/status` jest zaskakujący, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Trasowanie i wybór modelu

Trzymaj referencje dostawców i politykę środowiska uruchomieniowego osobno:

- Używaj `openai/gpt-*` dla tur agentów OpenAI przez Codex.
- Nie używaj `openai-codex/gpt-*` w konfiguracji. Uruchom `openclaw doctor --fix`, aby
  naprawić starsze referencje i nieaktualne przypięcia tras sesji.
- `agentRuntime.id: "codex"` jest opcjonalne w standardowym trybie automatycznym OpenAI, ale przydatne,
  gdy wdrożenie powinno zakończyć się niepowodzeniem, jeśli Codex jest niedostępny.
- `agentRuntime.id: "pi"` przełącza dostawcę lub model na bezpośrednie zachowanie PI, gdy
  jest to zamierzone.
- `/codex ...` steruje natywnymi rozmowami Codex app-server z czatu.
- ACP/acpx to osobna ścieżka zewnętrznego harnessa. Używaj jej tylko wtedy, gdy użytkownik prosi
  o ACP/acpx albo zewnętrzny adapter harnessa.

Typowe trasowanie poleceń:

| Intencja użytkownika             | Użyj                                    |
| -------------------------------- | --------------------------------------- |
| Dołącz bieżący czat              | `/codex bind [--cwd <path>]`            |
| Wznów istniejący wątek Codex     | `/codex resume <thread-id>`             |
| Wyświetl lub filtruj wątki Codex | `/codex threads [filter]`               |
| Wyślij tylko opinię diagnostyczną Codex | `/codex diagnostics [note]`             |
| Rozpocznij zadanie ACP/acpx      | Polecenia sesji ACP/acpx, nie `/codex`  |

| Przypadek użycia                                      | Skonfiguruj                                                     | Zweryfikuj                              | Uwagi                              |
| ----------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-*` plus włączony Plugin `codex`                     | `/status` pokazuje `Runtime: OpenAI Codex` | Zalecana ścieżka                  |
| Zakończ niepowodzeniem, jeśli Codex jest niedostępny  | `agentRuntime.id: "codex"` dostawcy lub modelu                  | Tura kończy się niepowodzeniem zamiast fallbacku PI | Używaj dla wdrożeń tylko Codex    |
| Bezpośredni ruch z kluczem API OpenAI przez PI        | `agentRuntime.id: "pi"` dostawcy lub modelu i standardowe uwierzytelnianie OpenAI | `/status` pokazuje środowisko uruchomieniowe PI | Używaj tylko wtedy, gdy PI jest zamierzone |
| Starsza konfiguracja                                  | `openai-codex/gpt-*`                                            | `openclaw doctor --fix` przepisuje ją   | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter ACP/acpx Codex                                | ACP `sessions_spawn({ runtime: "acp" })`                        | Stan zadania/sesji ACP                  | Oddzielne od natywnego harnessa Codex |

`agents.defaults.imageModel` używa tego samego podziału prefiksów. Używaj `openai/gpt-*`
dla standardowej trasy OpenAI oraz `codex/gpt-*` tylko wtedy, gdy rozumienie obrazów
ma działać przez ograniczoną turę Codex app-server. Nie używaj
`openai-codex/gpt-*`; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.

## Wzorce wdrożenia

### Podstawowe wdrożenie Codex

Użyj konfiguracji szybkiego startu, gdy wszystkie tury agenta OpenAI mają domyślnie
używać Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
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

### Wdrożenie z mieszanymi dostawcami

Ten kształt zachowuje Claude jako domyślnego agenta i dodaje nazwanego agenta Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

W tej konfiguracji agent `main` używa swojej standardowej ścieżki dostawcy, a agent
`codex` używa Codex app-server.

### Wdrożenie Codex z zamkniętym niepowodzeniem

W przypadku tur agenta OpenAI `openai/gpt-*` już rozwiązuje się do Codex, gdy
dołączony Plugin jest dostępny. Dodaj jawną politykę środowiska uruchomieniowego, gdy chcesz mieć zapisaną
regułę zamkniętego niepowodzenia:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Przy wymuszonym Codex OpenClaw kończy działanie wcześnie, jeśli Plugin Codex jest wyłączony,
app-server jest zbyt stary albo app-server nie może się uruchomić.

## Polityka app-server

Domyślnie Plugin uruchamia zarządzany przez OpenClaw binarny plik Codex lokalnie z transportem
stdio. Ustaw `appServer.command` tylko wtedy, gdy celowo chcesz uruchomić
inny plik wykonywalny. Używaj transportu WebSocket tylko wtedy, gdy app-server już
działa gdzie indziej:

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
          },
        },
      },
    },
  },
}
```

Lokalne sesje app-server stdio domyślnie używają zaufanej postawy operatora lokalnego:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie pozwalają na tę
niejawną postawę YOLO, OpenClaw wybiera zamiast niej dozwolone uprawnienia guardian.
Gdy sandbox OpenClaw jest aktywny dla sesji, OpenClaw zawęża Codex
`danger-full-access` do Codex `workspace-write`, aby natywne tury trybu kodu Codex
pozostawały w sandboxowanym obszarze roboczym.

Użyj trybu guardian, gdy chcesz natywnego automatycznego przeglądu Codex przed wyjściami poza sandbox
lub dodatkowymi uprawnieniami:

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

Tryb guardian rozwija się do zatwierdzeń app-server Codex, zwykle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` oraz
`sandbox: "workspace-write"`, gdy lokalne wymagania pozwalają na te wartości.

Opis każdego pola app-server, kolejności uwierzytelniania, izolacji środowiska, wykrywania i
zachowania limitów czasu znajdziesz w [dokumentacji referencyjnej harness Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Dołączony Plugin rejestruje `/codex` jako polecenie ukośnikowe na każdym kanale, który
obsługuje polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` sprawdza łączność app-server, modele, konto, limity szybkości,
  serwery MCP i umiejętności.
- `/codex models` wyświetla modele app-server Codex na żywo.
- `/codex threads [filter]` wyświetla ostatnie wątki app-server Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do
  istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii Codex dla
  dołączonego wątku.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwera MCP app-server Codex.
- `/codex skills` wyświetla umiejętności app-server Codex.

W przypadku większości zgłoszeń do pomocy technicznej zacznij od `/diagnostics [note]` w rozmowie,
w której wystąpił błąd. Tworzy to jeden raport diagnostyczny Gateway i, dla sesji
harness Codex, prosi o zgodę na wysłanie odpowiedniego pakietu opinii Codex.
Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać model prywatności i zachowanie
czatów grupowych.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać opinię Codex
dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego Gateway.

### Lokalna inspekcja wątków Codex

Najszybszym sposobem sprawdzenia nieudanego uruchomienia Codex jest często bezpośrednie otwarcie natywnego
wątku Codex:

```bash
codex resume <thread-id>
```

Pobierz identyfikator wątku z ukończonej odpowiedzi `/diagnostics`, `/codex binding` lub
`/codex threads [filter]`.

Mechanikę przesyłania i granice diagnostyki na poziomie środowiska uruchomieniowego opisuje
[środowisko uruchomieniowe harness Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

Uwierzytelnianie jest wybierane w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej w
   `auth.order.openai`. Istniejące identyfikatory profili `openai-codex:*` pozostają prawidłowe.
2. Istniejące konto app-server w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień app-server stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy nie ma konta app-server, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchomionego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych tur app-server Codex przez API.
Jawne profile kluczy API Codex i lokalna awaryjna ścieżka kluczy środowiskowych stdio używają logowania app-server
zamiast dziedziczonego środowiska procesu potomnego. Połączenia app-server WebSocket
nie otrzymują awaryjnego klucza API środowiska Gateway; użyj jawnego profilu uwierzytelniania lub
własnego konta zdalnego app-server.

Jeśli profil subskrypcji osiągnie limit użycia Codex, OpenClaw zapisuje czas resetu,
gdy Codex go zgłosi, i próbuje następnego uporządkowanego profilu uwierzytelniania dla tego samego
uruchomienia Codex. Gdy czas resetu minie, profil subskrypcji ponownie kwalifikuje się
bez zmiany wybranego modelu `openai/gpt-*` ani środowiska uruchomieniowego Codex.

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

`appServer.clearEnv` wpływa tylko na uruchomiony proces potomny app-server Codex.

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
dynamicznych narzędzi, które dublują natywne operacje Codex na obszarze roboczym: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` i `update_plan`. Pozostałe narzędzia integracji OpenClaw,
takie jak wiadomości, sesje, media, cron, przeglądarka, węzły,
gateway, `heartbeat_respond` i `web_search`, są dostępne przez wyszukiwanie narzędzi Codex
w przestrzeni nazw `openclaw`, dzięki czemu początkowy kontekst modelu jest
mniejszy.
`sessions_yield` i odpowiedzi źródłowe tylko z narzędzi wiadomości pozostają bezpośrednie, ponieważ są to
kontrakty sterowania turą. Instrukcje współpracy Heartbeat mówią Codex, aby
wyszukał `heartbeat_respond` przed zakończeniem tury heartbeat, gdy narzędzie nie jest
jeszcze załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
app-server Codex, który nie potrafi wyszukiwać odroczonych dynamicznych narzędzi, albo podczas debugowania pełnego
ładunku narzędzi.

Obsługiwane pola najwyższego poziomu Pluginu Codex:

| Pole                       | Domyślnie       | Znaczenie                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy dynamicznych narzędzi OpenClaw do pominięcia w turach app-server Codex.  |
| `codexPlugins`             | wyłączone      | Natywna obsługa pluginów/aplikacji Codex dla zmigrowanych, instalowanych ze źródła wyselekcjonowanych pluginów. |

Obsługiwane pola `appServer`:

| Pole                          | Domyślnie                                             | Znaczenie                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                             |
| `command`                     | zarządzany plik binarny Codex                          | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko przy jawnym nadpisaniu.                                                                                                |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                         |
| `url`                         | nieustawione                                           | URL app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | nieustawione                                           | Token Bearer dla transportu WebSocket.                                                                                                                                                                                                  |
| `headers`                     | `{}`                                                   | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                           |
| `clearEnv`                    | `[]`                                                   | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchamianego procesu app-server stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent w lokalnych uruchomieniach OpenClaw. |
| `requestTimeoutMs`            | `60000`                                                | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ciche okno po żądaniu app-server Codex ograniczonym do tury, gdy OpenClaw czeka na `turn/completed`. Zwiększ tę wartość dla wolnych faz syntezy po narzędziach lub tylko statusowych.                                                   |
| `mode`                        | `"yolo"`, chyba że lokalne wymagania Codex nie pozwalają na YOLO | Preset dla wykonania YOLO lub przeglądanego przez guardian. Lokalne wymagania stdio, które pomijają `danger-full-access`, zatwierdzenie `never` lub recenzenta `user`, sprawiają, że niejawną wartością domyślną jest guardian.            |
| `approvalPolicy`              | `"never"` lub dozwolona polityka zatwierdzania guardian | Natywna polityka zatwierdzania Codex wysyłana do uruchomienia/wznowienia/tury wątku. Domyślne wartości guardian preferują `"on-request"`, gdy jest dozwolone.                                                                            |
| `sandbox`                     | `"danger-full-access"` lub dozwolony sandbox guardian  | Natywny tryb sandbox Codex wysyłany do uruchomienia/wznowienia wątku. Domyślne wartości guardian preferują `"workspace-write"`, gdy jest dozwolone, w przeciwnym razie `"read-only"`. Gdy sandbox OpenClaw jest aktywny, `danger-full-access` jest zawężany do `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` lub dozwolony recenzent guardian              | Użyj `"auto_review"`, aby pozwolić Codex przeglądać natywne monity zatwierdzeń, gdy jest to dozwolone, w przeciwnym razie `guardian_subagent` lub `user`. `guardian_subagent` pozostaje starszym aliasem.                               |
| `serviceTier`                 | nieustawione                                           | Opcjonalny poziom usługi app-server Codex. `"priority"` włącza routing trybu szybkiego, `"flex"` żąda przetwarzania flex, `null` czyści nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.                              |

Wywołania dynamicznych narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie używają 30-sekundowego
watchdoga OpenClaw. Dodatni argument `timeoutMs` dla pojedynczego wywołania wydłuża
lub skraca budżet tego konkretnego narzędzia. Narzędzie `image_generate` używa też
`agents.defaults.imageGenerationModel.timeoutMs`, gdy wywołanie narzędzia nie podaje
własnego limitu czasu, a narzędzie `image` do rozumienia multimediów używa
`tools.media.image.timeoutSeconds` albo swojego 60-sekundowego domyślnego limitu dla multimediów. Budżety dynamicznych narzędzi
są ograniczone do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia
tam, gdzie jest to obsługiwane, i zwraca do Codex nieudana odpowiedź dynamicznego narzędzia, aby tura
mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie serwera aplikacji o zakresie tury Codex, harness
oczekuje też, że Codex zakończy natywną turę za pomocą `turn/completed`. Jeśli
serwer aplikacji milknie na czas `appServer.turnCompletionIdleTimeoutMs` po tej
odpowiedzi, OpenClaw w trybie najlepszych starań przerywa turę Codex, zapisuje diagnostykę
przekroczenia limitu czasu i zwalnia tor sesji OpenClaw, aby kolejne wiadomości czatu
nie były kolejkowane za nieaktualną natywną turą. Każde nieterminalne powiadomienie dla tej
samej tury, w tym `rawResponseItem/completed`, rozbraja tego krótkiego watchdoga,
ponieważ Codex udowodnił, że tura nadal żyje; dłuższy terminalny watchdog
nadal chroni naprawdę zablokowane tury. Diagnostyka limitu czasu obejmuje
ostatnią metodę powiadomienia serwera aplikacji oraz, dla surowych elementów odpowiedzi asystenta,
typ elementu, rolę, id i ograniczony podgląd tekstu asystenta.

Nadpisania środowiskowe pozostają dostępne do lokalnego testowania:

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
preferowana w powtarzalnych wdrożeniach, ponieważ utrzymuje zachowanie pluginu w tym
samym sprawdzonym pliku co reszta konfiguracji harnessu Codex.

## Natywne pluginy Codex

Obsługa natywnych pluginów Codex używa własnych możliwości aplikacji i pluginów
serwera aplikacji Codex w tym samym wątku Codex co tura harnessu OpenClaw. OpenClaw
nie tłumaczy pluginów Codex na syntetyczne dynamiczne narzędzia OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa tylko na sesje, które wybierają natywny harness Codex. Nie
ma wpływu na uruchomienia PI, zwykłe uruchomienia dostawcy OpenAI, powiązania konwersacji
ACP ani inne harnessy.

Minimalna zmigrowana konfiguracja:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję harnessu Codex
albo zastępuje nieaktualne powiązanie wątku Codex. Nie jest przeliczana przy każdej turze.
Po zmianie `codexPlugins` użyj `/new`, `/reset` albo uruchom ponownie gateway, aby
przyszłe sesje harnessu Codex startowały ze zaktualizowanym zestawem aplikacji.

Aby uzyskać informacje o kwalifikowalności migracji, inwentarzu aplikacji, zasadach akcji destrukcyjnych,
wywołaniach użytkownika i diagnostyce natywnych pluginów, zobacz
[Natywne pluginy Codex](/pl/plugins/codex-native-plugins).

## Użycie komputera

Użycie komputera opisano w osobnym przewodniku konfiguracji:
[Użycie komputera w Codex](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza wbudowanej aplikacji sterowania pulpitem ani nie wykonuje
samodzielnie akcji pulpitu. Przygotowuje serwer aplikacji Codex, weryfikuje, że
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex przejąć natywne
wywołania narzędzi MCP podczas tur w trybie Codex.

## Granice środowiska uruchomieniowego

Harness Codex zmienia wyłącznie niskopoziomowy wbudowany wykonawca agenta.

- Dynamiczne narzędzia OpenClaw są obsługiwane. Codex prosi OpenClaw o wykonanie tych
  narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.
- Natywne narzędzia powłoki, łatek, MCP i aplikacji Codex należą do Codex.
  OpenClaw może obserwować lub blokować wybrane natywne zdarzenia przez obsługiwany
  przekaźnik, ale nie przepisuje argumentów natywnych narzędzi.
- Codex jest właścicielem natywnej Compaction. OpenClaw utrzymuje lustrzaną kopię transkryptu dla historii
  kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub harnessu.
- Generowanie multimediów, rozumienie multimediów, TTS, zatwierdzenia i dane wyjściowe narzędzi wiadomości
  nadal przechodzą przez odpowiednie ustawienia dostawcy/modelu OpenClaw.
- `tool_result_persist` dotyczy wyników narzędzi transkryptu należących do OpenClaw, a nie
  natywnych rekordów wyników narzędzi Codex.

Informacje o warstwach hooków, obsługiwanych powierzchniach V1, natywnej obsłudze uprawnień, sterowaniu kolejką,
mechanice przesyłania opinii Codex i szczegółach Compaction znajdziesz w
[Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** to oczekiwane w nowych
konfiguracjach. Wybierz model `openai/gpt-*`, włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** upewnij się, że referencja modelu to
`openai/gpt-*` na oficjalnym dostawcy OpenAI oraz że plugin Codex jest
zainstalowany i włączony. Jeśli podczas testowania potrzebujesz ścisłego dowodu, ustaw dla dostawcy lub
modelu `agentRuntime.id: "codex"`. Wymuszone środowisko uruchomieniowe Codex kończy się niepowodzeniem zamiast
wracać do PI.

**Pozostała starsza konfiguracja `openai-codex/*`:** uruchom `openclaw doctor --fix`.
Doctor przepisuje starsze referencje modeli na `openai/*`, usuwa nieaktualne przypięcia środowiska uruchomieniowego sesji i
całego agenta oraz zachowuje istniejące nadpisania profili uwierzytelniania.

**Serwer aplikacji jest odrzucany:** użyj serwera aplikacji Codex `0.125.0` lub nowszego.
Wydania wstępne tej samej wersji albo wersje z sufiksem builda, takie jak
`0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ OpenClaw testuje
stabilny dolny próg protokołu `0.125.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy dołączony plugin `codex` jest
włączony, czy `plugins.allow` obejmuje go, gdy skonfigurowano listę dozwolonych, oraz
czy wszelkie niestandardowe `appServer.command`, `url`, `authToken` lub nagłówki są poprawne.

**Wykrywanie modeli jest wolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie. Zobacz
[Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket natychmiast kończy się niepowodzeniem:** sprawdź `appServer.url`, `authToken`,
nagłówki oraz czy zdalny serwer aplikacji używa tej samej wersji protokołu serwera aplikacji
Codex.

**Model inny niż Codex używa PI:** to oczekiwane, chyba że polityka środowiska uruchomieniowego dostawcy lub modelu
kieruje go do innego harnessu. Zwykłe referencje dostawców innych niż OpenAI pozostają na
swojej normalnej ścieżce dostawcy w trybie `auto`.

**Użycie komputera jest zainstalowane, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` albo `/reset`; jeśli problem się utrzymuje, uruchom ponownie
gateway, aby wyczyścić nieaktualne rejestracje natywnych hooków. Zobacz
[Użycie komputera w Codex](/pl/plugins/codex-computer-use#troubleshooting).

## Powiązane

- [Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Użycie komputera w Codex](/pl/plugins/codex-computer-use)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pluginy harnessu agentów](/pl/plugins/sdk-agent-harness)
- [Hooki pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Status](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
