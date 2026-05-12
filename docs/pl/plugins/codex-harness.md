---
read_when:
    - Chcesz użyć dołączonego harnessa serwera aplikacji Codex
    - Potrzebujesz przykładów konfiguracji harnessa Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączony mechanizm serwera aplikacji Codex
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-05-12T08:46:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta OpenAI
przez app-server Codex zamiast wbudowanej uprzęży PI.

Użyj uprzęży Codex, gdy chcesz, aby Codex odpowiadał za niskopoziomową sesję agenta:
natywne wznawianie wątków, natywną kontynuację narzędzi, natywną Compaction oraz
wykonywanie przez app-server. OpenClaw nadal odpowiada za kanały czatu, pliki sesji,
wybór modelu, dynamiczne narzędzia OpenClaw, zatwierdzenia, dostarczanie multimediów
oraz widoczne lustrzane odbicie transkrypcji.

Standardowa konfiguracja używa kanonicznych odwołań do modeli OpenAI, takich jak `openai/gpt-5.5`.
Nie konfiguruj odwołań do modeli `openai-codex/gpt-*`. Umieść kolejność uwierzytelniania agenta OpenAI
w `auth.order.openai`; starsze profile `openai-codex:*` oraz wpisy
`auth.order.openai-codex` pozostają obsługiwane w istniejących instalacjach.

OpenClaw uruchamia wątki app-server Codex z natywnym trybem kodu Codex oraz
włączonym wyłącznie trybem kodu. Dzięki temu odroczone i wyszukiwalne dynamiczne narzędzia OpenClaw
pozostają we własnej powierzchni wykonywania kodu i wyszukiwania narzędzi Codex, zamiast dodawać
opakowanie wyszukiwania narzędzi w stylu PI na Codex.

Szerszy podział model/dostawca/środowisko uruchomieniowe zacznij od
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes). Krótko:
`openai/gpt-5.5` to odwołanie do modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij `codex`.
- App-server Codex `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarium app-server Codex, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na zwykłe uruchamianie uprzęży.
- Uwierzytelnianie Codex dostępne przez `openclaw models auth login --provider openai-codex`,
  konto app-server w katalogu domowym Codex agenta albo jawny profil uwierzytelniania Codex z kluczem API.

Pierwszeństwo uwierzytelniania, izolację środowiska, niestandardowe polecenia app-server, wykrywanie modeli
i wszystkie pola konfiguracji opisuje
[Dokumentacja uprzęży Codex](/pl/plugins/codex-harness-reference).

## Szybki start

Większość użytkowników, którzy chcą używać Codex w OpenClaw, powinna wybrać tę ścieżkę: zalogować się za pomocą
subskrypcji ChatGPT/Codex, włączyć dołączony Plugin `codex` i użyć
kanonicznego odwołania do modelu `openai/gpt-*`.

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

Po zmianie konfiguracji Plugin uruchom ponownie Gateway. Jeśli istniejący czat ma już
sesję, użyj `/new` lub `/reset` przed testowaniem zmian środowiska uruchomieniowego, aby następna
tura rozwiązała uprząż z bieżącej konfiguracji.

## Konfiguracja

Konfiguracja z szybkiego startu to minimalna działająca konfiguracja uprzęży Codex. Ustaw opcje uprzęży
Codex w konfiguracji OpenClaw, a CLI używaj tylko do uwierzytelniania Codex:

| Potrzeba                               | Ustaw                                                                            | Gdzie                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Włączenie uprzęży                      | `plugins.entries.codex.enabled: true`                                            | Konfiguracja OpenClaw              |
| Zachowanie instalacji Plugin z listą dozwolonych | Uwzględnij `codex` w `plugins.allow`                                    | Konfiguracja OpenClaw              |
| Kierowanie tur agenta OpenAI przez Codex | `agents.defaults.model` lub `agents.list[].model` jako `openai/gpt-*`          | Konfiguracja agenta OpenClaw       |
| Logowanie przez OAuth Codex            | `openclaw models auth login --provider openai-codex`                             | Profil uwierzytelniania CLI        |
| Dodanie zapasowego klucza API dla uruchomień Codex | Profil klucza API `openai:*` wymieniony po uwierzytelnianiu subskrypcją w `auth.order.openai` | Profil uwierzytelniania CLI + konfiguracja OpenClaw |
| Zamknięcie awaryjne, gdy Codex jest niedostępny | `agentRuntime.id: "codex"` dostawcy lub modelu                              | Konfiguracja modelu/dostawcy OpenClaw |
| Używanie bezpośredniego ruchu API OpenAI | `agentRuntime.id: "pi"` dostawcy lub modelu ze zwykłym uwierzytelnianiem OpenAI | Konfiguracja modelu/dostawcy OpenClaw |
| Dostosowanie zachowania app-server     | `plugins.entries.codex.config.appServer.*`                                       | Konfiguracja Plugin Codex          |
| Włączenie natywnych aplikacji Plugin Codex | `plugins.entries.codex.config.codexPlugins.*`                                 | Konfiguracja Plugin Codex          |
| Włączenie Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Konfiguracja Plugin Codex          |

Używaj odwołań do modeli `openai/gpt-*` dla tur agentów OpenAI obsługiwanych przez Codex. Preferuj
`auth.order.openai` dla kolejności: najpierw subskrypcja, potem zapasowy klucz API. Istniejące
profile uwierzytelniania `openai-codex:*` i `auth.order.openai-codex` pozostają prawidłowe, ale
nie zapisuj nowych odwołań do modeli `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

W takim układzie oba profile nadal działają przez Codex dla tur agenta `openai/gpt-*`.
Klucz API jest tylko zapasową metodą uwierzytelniania, a nie żądaniem przełączenia na PI lub
zwykłe OpenAI Responses.

Dalsza część tej strony omawia typowe warianty, między którymi użytkownicy muszą wybrać:
kształt wdrożenia, routing z zamknięciem awaryjnym, politykę zatwierdzeń strażnika, natywne
pluginy Codex oraz Computer Use. Pełne listy opcji, wartości domyślne, enumy, wykrywanie,
izolację środowiska, limity czasu oraz pola transportu app-server opisuje
[Dokumentacja uprzęży Codex](/pl/plugins/codex-harness-reference).

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

`/codex status` raportuje łączność app-server, konto, limity szybkości, serwery MCP
oraz Skills. `/codex models` wypisuje aktywny katalog app-server Codex dla
uprzęży i konta. Jeśli `/status` jest zaskakujący, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Routing i wybór modelu

Oddzielaj odwołania do dostawców od polityki środowiska uruchomieniowego:

- Używaj `openai/gpt-*` dla tur agentów OpenAI przez Codex.
- Nie używaj `openai-codex/gpt-*` w konfiguracji. Uruchom `openclaw doctor --fix`, aby
  naprawić starsze odwołania i nieaktualne przypięcia tras sesji.
- `agentRuntime.id: "codex"` jest opcjonalne w zwykłym trybie automatycznym OpenAI, ale przydatne,
  gdy wdrożenie powinno zamknąć się awaryjnie, jeśli Codex jest niedostępny.
- `agentRuntime.id: "pi"` przełącza dostawcę lub model na bezpośrednie zachowanie PI, gdy
  jest to zamierzone.
- `/codex ...` steruje natywnymi konwersacjami app-server Codex z czatu.
- ACP/acpx to osobna ścieżka zewnętrznej uprzęży. Używaj jej tylko wtedy, gdy użytkownik prosi
  o ACP/acpx albo adapter zewnętrznej uprzęży.

Typowy routing poleceń:

| Intencja użytkownika          | Użyj                                    |
| ----------------------------- | --------------------------------------- |
| Dołączenie bieżącego czatu    | `/codex bind [--cwd <path>]`            |
| Wznowienie istniejącego wątku Codex | `/codex resume <thread-id>`       |
| Wypisanie lub filtrowanie wątków Codex | `/codex threads [filter]`      |
| Wysłanie tylko opinii diagnostycznej Codex | `/codex diagnostics [note]` |
| Rozpoczęcie zadania ACP/acpx  | Polecenia sesji ACP/acpx, nie `/codex`  |

| Przypadek użycia                                      | Skonfiguruj                                                     | Zweryfikuj                              | Uwagi                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-*` plus włączony Plugin `codex`       | `/status` pokazuje `Runtime: OpenAI Codex` | Zalecana ścieżka              |
| Zamknięcie awaryjne, jeśli Codex jest niedostępny    | `agentRuntime.id: "codex"` dostawcy lub modelu                  | Tura kończy się błędem zamiast powrotu do PI | Używaj dla wdrożeń tylko Codex |
| Bezpośredni ruch klucza API OpenAI przez PI          | `agentRuntime.id: "pi"` dostawcy lub modelu oraz zwykłe uwierzytelnianie OpenAI | `/status` pokazuje środowisko uruchomieniowe PI | Używaj tylko, gdy PI jest zamierzone |
| Starsza konfiguracja                                 | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` przepisuje ją   | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Stan zadania/sesji ACP                  | Oddzielne od natywnej uprzęży Codex |

`agents.defaults.imageModel` podąża za tym samym podziałem prefiksów. Używaj `openai/gpt-*`
dla zwykłej trasy OpenAI oraz `codex/gpt-*` tylko wtedy, gdy rozumienie obrazów
powinno działać przez ograniczoną turę app-server Codex. Nie używaj
`openai-codex/gpt-*`; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.

## Wzorce wdrożenia

### Podstawowe wdrożenie Codex

Użyj konfiguracji z szybkiego startu, gdy wszystkie tury agentów OpenAI mają domyślnie używać Codex.

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

Ten układ zachowuje Claude jako domyślnego agenta i dodaje nazwanego agenta Codex:

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

Przy tej konfiguracji agent `main` używa swojej zwykłej ścieżki dostawcy, a agent
`codex` używa app-server Codex.

### Wdrożenie Codex z zamknięciem awaryjnym

Dla tur agentów OpenAI `openai/gpt-*` już rozwiązuje się do Codex, gdy
dołączony Plugin jest dostępny. Dodaj jawną politykę środowiska uruchomieniowego, gdy chcesz mieć zapisaną
regułę zamknięcia awaryjnego:

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

Po wymuszeniu Codex OpenClaw kończy działanie wcześnie błędem, jeśli Plugin Codex jest wyłączony,
app-server jest zbyt stary albo app-server nie może się uruchomić.

## Polityka app-server

Domyślnie Plugin uruchamia lokalnie zarządzane przez OpenClaw binarium Codex z transportem stdio.
Ustaw `appServer.command` tylko wtedy, gdy celowo chcesz uruchomić inny
plik wykonywalny. Używaj transportu WebSocket tylko wtedy, gdy app-server już
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

Lokalne sesje app-servera stdio domyślnie używają postawy zaufanego lokalnego operatora:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie zezwalają na tę
niejawną postawę YOLO, OpenClaw wybiera zamiast tego dozwolone uprawnienia guardian.
Gdy sandbox OpenClaw jest aktywny dla sesji, OpenClaw zawęża Codex
`danger-full-access` do Codex `workspace-write`, aby natywne tury Codex w trybie
kodu pozostawały wewnątrz sandboxowanego obszaru roboczego.

Użyj trybu guardian, gdy chcesz natywnej automatycznej recenzji Codex przed
wyjściem poza sandbox lub przyznaniem dodatkowych uprawnień:

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

Tryb guardian rozwija się do zatwierdzeń app-servera Codex, zwykle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` oraz
`sandbox: "workspace-write"`, gdy lokalne wymagania zezwalają na te wartości.

W przypadku każdego pola app-servera, kolejności uwierzytelniania, izolacji
środowiska, wykrywania i działania limitów czasu zobacz [dokumentację referencyjną
harnessu Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Dołączony plugin rejestruje `/codex` jako polecenie ukośnikowe w każdym kanale,
który obsługuje polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` sprawdza łączność z app-serverem, modele, konto, limity
  szybkości, serwery MCP i Skills.
- `/codex models` wyświetla modele app-servera Codex dostępne na żywo.
- `/codex threads [filter]` wyświetla ostatnie wątki app-servera Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego
  wątku Codex.
- `/codex compact` prosi app-server Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywną recenzję Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii Codex dla dołączonego
  wątku.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwera MCP app-servera Codex.
- `/codex skills` wyświetla Skills app-servera Codex.

W przypadku większości zgłoszeń do pomocy technicznej zacznij od
`/diagnostics [note]` w rozmowie, w której wystąpił błąd. Tworzy ono jeden raport
diagnostyczny Gateway i, w przypadku sesji harnessu Codex, prosi o zgodę na
wysłanie odpowiedniego pakietu opinii Codex. Model prywatności i zachowanie w
czatach grupowych opisano w [eksporcie diagnostyki](/pl/gateway/diagnostics).

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego
Gateway.

### Lokalna inspekcja wątków Codex

Najszybszym sposobem sprawdzenia nieudanego uruchomienia Codex jest często
bezpośrednie otwarcie natywnego wątku Codex:

```bash
codex resume <thread-id>
```

Identyfikator wątku uzyskasz z ukończonej odpowiedzi `/diagnostics`,
`/codex binding` lub `/codex threads [filter]`.

Mechanikę przesyłania i granice diagnostyki na poziomie środowiska uruchomieniowego
opisano w [środowisku uruchomieniowym harnessu Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

Uwierzytelnianie jest wybierane w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej pod
   `auth.order.openai`. Istniejące identyfikatory profili `openai-codex:*`
   pozostają prawidłowe.
2. Istniejące konto app-servera w katalogu domowym Codex tego agenta.
3. Tylko w przypadku lokalnych uruchomień app-servera stdio: `CODEX_API_KEY`,
   następnie `OPENAI_API_KEY`, gdy nie ma konta app-servera, a uwierzytelnianie
   OpenAI nadal jest wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex w stylu subskrypcji ChatGPT,
usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z uruchomionego procesu podrzędnego
Codex. Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla
embeddingów lub bezpośrednich modeli OpenAI, bez przypadkowego rozliczania
natywnych tur app-servera Codex przez API. Jawne profile kluczy API Codex i
lokalny fallback kluczy środowiskowych stdio używają logowania app-servera
zamiast dziedziczonego środowiska procesu podrzędnego. Połączenia WebSocket
app-servera nie otrzymują fallbacku klucza API ze środowiska Gateway; użyj
jawnego profilu uwierzytelniania albo własnego konta zdalnego app-servera.

Jeśli profil subskrypcyjny osiągnie limit użycia Codex, OpenClaw zapisuje czas
resetu, gdy Codex go zgłosi, i próbuje następnego uporządkowanego profilu
uwierzytelniania dla tego samego uruchomienia Codex. Po upływie czasu resetu
profil subskrypcyjny ponownie kwalifikuje się do użycia bez zmiany wybranego
modelu `openai/gpt-*` ani środowiska uruchomieniowego Codex.

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

`appServer.clearEnv` wpływa tylko na uruchomiony proces podrzędny app-servera
Codex.

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable`. OpenClaw
nie udostępnia dynamicznych narzędzi, które dublują natywne operacje obszaru
roboczego Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` oraz
`update_plan`. Pozostałe narzędzia integracyjne OpenClaw, takie jak komunikacja,
sesje, media, cron, przeglądarka, węzły, gateway, `heartbeat_respond` i
`web_search`, są dostępne przez wyszukiwanie narzędzi Codex w przestrzeni nazw
`openclaw`, co zmniejsza początkowy kontekst modelu.
`sessions_yield` oraz odpowiedzi źródłowe wyłącznie z narzędzi komunikacyjnych
pozostają bezpośrednie, ponieważ są to kontrakty sterowania turą. Instrukcje
współpracy Heartbeat każą Codex wyszukać `heartbeat_respond` przed zakończeniem
tury heartbeat, gdy narzędzie nie jest jeszcze załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
app-serverem Codex, który nie potrafi wyszukiwać odroczonych dynamicznych
narzędzi, albo podczas debugowania pełnego ładunku narzędzi.

Obsługiwane pola najwyższego poziomu pluginu Codex:

| Pole                       | Domyślnie       | Znaczenie                                                                                         |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy dynamicznych narzędzi OpenClaw do pominięcia w turach app-servera Codex.           |
| `codexPlugins`             | wyłączone      | Natywna obsługa pluginów/aplikacji Codex dla zmigrowanych, kuratorowanych pluginów zainstalowanych ze źródeł. |

Obsługiwane pola `appServer`:

| Pole                          | Domyślnie                                             | Znaczenie                                                                                                                                                                                                                                |
| ----------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` uruchamia Codex; `"websocket"` łączy z `url`.                                                                                                                                                                                  |
| `command`                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko dla jawnego nadpisania.                                                                                                  |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | Argumenty dla transportu stdio.                                                                                                                                                                                                          |
| `url`                         | nieustawione                                          | URL app-servera WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | nieustawione                                          | Token Bearer dla transportu WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                  | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                            |
| `clearEnv`                    | `[]`                                                  | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-servera stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent OpenClaw przy lokalnych uruchomieniach. |
| `requestTimeoutMs`            | `60000`                                               | Limit czasu dla wywołań płaszczyzny sterowania app-servera.                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | Okno ciszy po żądaniu app-servera Codex o zakresie tury, gdy OpenClaw czeka na `turn/completed`. Zwiększ tę wartość dla wolnych faz syntezy po narzędziu lub wyłącznie statusowych.                                                       |
| `mode`                        | `"yolo"`, chyba że lokalne wymagania Codex nie zezwalają na YOLO | Preset dla wykonania YOLO lub recenzowanego przez guardian. Lokalne wymagania stdio, które pomijają `danger-full-access`, zatwierdzenie `never` albo recenzenta `user`, sprawiają, że niejawną wartością domyślną jest guardian. |
| `approvalPolicy`              | `"never"` lub dozwolona zasada zatwierdzania guardian | Natywna zasada zatwierdzania Codex wysyłana przy starcie/wznowieniu wątku/turze. Domyślne ustawienia guardian preferują `"on-request"`, gdy jest dozwolone.                                                                               |
| `sandbox`                     | `"danger-full-access"` lub dozwolony sandbox guardian | Natywny tryb sandbox Codex wysyłany przy starcie/wznowieniu wątku. Domyślne ustawienia guardian preferują `"workspace-write"`, gdy jest dozwolone, w przeciwnym razie `"read-only"`. Gdy sandbox OpenClaw jest aktywny, `danger-full-access` jest zawężane do `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` lub dozwolony recenzent guardian             | Użyj `"auto_review"`, aby pozwolić Codex recenzować natywne monity zatwierdzania, gdy jest to dozwolone; w przeciwnym razie `guardian_subagent` lub `user`. `guardian_subagent` pozostaje starszym aliasem.                                |
| `serviceTier`                 | nieustawione                                          | Opcjonalna warstwa usług app-servera Codex. `"priority"` włącza routing trybu szybkiego, `"flex"` żąda przetwarzania flex, `null` czyści nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.                              |

Wywołania dynamicznych narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie używają
30-sekundowego watchdog OpenClaw. Dodatni argument `timeoutMs` dla pojedynczego
wywołania wydłuża lub skraca budżet tego konkretnego narzędzia. Narzędzie
`image_generate` używa też `agents.defaults.imageGenerationModel.timeoutMs`,
gdy wywołanie narzędzia nie podaje własnego limitu czasu, a narzędzie `image`
do rozumienia multimediów używa `tools.media.image.timeoutSeconds` albo
60-sekundowej domyślnej wartości dla multimediów. Budżety dynamicznych narzędzi
są ograniczone do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa
sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex odpowiedź
nieudanego dynamicznego narzędzia, aby tura mogła być kontynuowana, zamiast
pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie app-server o zakresie tury Codex,
harness oczekuje również, że Codex zakończy natywną turę przez `turn/completed`.
Jeśli app-server milczy przez `appServer.turnCompletionIdleTimeoutMs` po tej
odpowiedzi, OpenClaw w trybie best-effort przerywa turę Codex, zapisuje
diagnostyczny limit czasu i zwalnia pasmo sesji OpenClaw, aby kolejne wiadomości
czatu nie czekały w kolejce za przestarzałą natywną turą. Każde nieterminalne
powiadomienie dla tej samej tury, w tym `rawResponseItem/completed`, rozbraja
ten krótki watchdog, ponieważ Codex dowiódł, że tura nadal żyje; dłuższy
terminalny watchdog nadal chroni rzeczywiście zablokowane tury. Globalne
powiadomienia app-server, takie jak aktualizacje limitów szybkości, nie
resetują postępu bezczynności tury. Gdy Codex emituje ukończony element
`agentMessage`, a następnie milczy bez `turn/completed`, OpenClaw traktuje
odpowiedź asystenta jako faktycznie ukończoną, w trybie best-effort przerywa
natywną turę Codex i zwalnia pasmo sesji. Diagnostyka limitów czasu obejmuje
ostatnią metodę powiadomienia app-server oraz, dla surowych elementów odpowiedzi
asystenta, typ elementu, rolę, identyfikator i ograniczony podgląd tekstu
asystenta.

Nadpisania środowiskowe pozostają dostępne do testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` pomija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` usunięto. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych.
Konfiguracja jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje
zachowanie pluginu w tym samym przeglądanym pliku co reszta konfiguracji
harnessu Codex.

## Natywne pluginy Codex

Obsługa natywnych pluginów Codex używa własnych możliwości aplikacji i pluginów
app-server Codex w tym samym wątku Codex co tura harnessu OpenClaw. OpenClaw nie
tłumaczy pluginów Codex na syntetyczne dynamiczne narzędzia OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa tylko na sesje, które wybierają natywny harness Codex. Nie
ma wpływu na uruchomienia PI, zwykłe uruchomienia dostawcy OpenAI, powiązania
konwersacji ACP ani inne harnessy.

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
            allow_destructive_actions: true,
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

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję
harnessu Codex albo zastępuje przestarzałe powiązanie wątku Codex. Nie jest
obliczana ponownie przy każdej turze. Po zmianie `codexPlugins` użyj `/new`,
`/reset` albo uruchom ponownie gateway, aby przyszłe sesje harnessu Codex
startowały ze zaktualizowanym zestawem aplikacji.

Informacje o kwalifikowalności migracji, inwentarzu aplikacji, polityce działań
destrukcyjnych, elicytacjach i diagnostyce natywnych pluginów znajdziesz w
[Natywne pluginy Codex](/pl/plugins/codex-native-plugins).

## Computer Use

Computer Use opisano w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji do sterowania pulpitem ani sam nie
wykonuje działań na pulpicie. Przygotowuje app-server Codex, weryfikuje, że
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex posiadać
natywne wywołania narzędzi MCP podczas tur w trybie Codex.

## Granice środowiska uruchomieniowego

Harness Codex zmienia tylko niskopoziomowy osadzony executor agenta.

- Dynamiczne narzędzia OpenClaw są obsługiwane. Codex prosi OpenClaw o wykonanie
  tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.
- Natywne narzędzia powłoki, poprawek, MCP i aplikacji Codex należą do Codex.
  OpenClaw może obserwować lub blokować wybrane natywne zdarzenia przez
  obsługiwany przekaźnik, ale nie przepisuje argumentów natywnych narzędzi.
- Codex posiada natywną Compaction. OpenClaw utrzymuje lustrzaną kopię
  transkrypcji na potrzeby historii kanału, wyszukiwania, `/new`, `/reset` oraz
  przyszłego przełączania modelu lub harnessu.
- Generowanie multimediów, rozumienie multimediów, TTS, zatwierdzenia i wyjście
  narzędzi komunikacyjnych nadal przechodzą przez odpowiadające im ustawienia
  dostawcy/modelu OpenClaw.
- `tool_result_persist` dotyczy należących do OpenClaw wyników narzędzi w
  transkrypcji, a nie natywnych rekordów wyników narzędzi Codex.

Informacje o warstwach hooków, obsługiwanych powierzchniach V1, natywnej obsłudze
uprawnień, sterowaniu kolejką, mechanice przesyłania opinii Codex i szczegółach
Compaction znajdziesz w
[Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** to oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*`, włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** upewnij się, że referencja modelu to
`openai/gpt-*` u oficjalnego dostawcy OpenAI oraz że plugin Codex jest
zainstalowany i włączony. Jeśli podczas testów potrzebujesz ścisłego dowodu,
ustaw `agentRuntime.id: "codex"` na dostawcy lub modelu. Wymuszone środowisko
uruchomieniowe Codex kończy się niepowodzeniem zamiast wracać do PI.

**Pozostaje starsza konfiguracja `openai-codex/*`:** uruchom
`openclaw doctor --fix`. Doctor przepisuje starsze referencje modeli na
`openai/*`, usuwa przestarzałe przypięcia środowiska uruchomieniowego sesji i
całego agenta oraz zachowuje istniejące nadpisania profilu uwierzytelniania.

**app-server jest odrzucany:** użyj app-server Codex `0.125.0` lub nowszego.
Wydania prerelease tej samej wersji albo wersje z sufiksem build, takie jak
`0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ OpenClaw testuje
stabilne minimum protokołu `0.125.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy dołączony plugin
`codex` jest włączony, czy `plugins.allow` go obejmuje, gdy skonfigurowano
listę dozwolonych, oraz czy dowolne niestandardowe `appServer.command`, `url`,
`authToken` lub nagłówki są poprawne.

**Odnajdywanie modeli jest wolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz odnajdywanie.
Zobacz
[Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket natychmiast kończy się niepowodzeniem:** sprawdź
`appServer.url`, `authToken`, nagłówki oraz czy zdalny app-server mówi tą samą
wersją protokołu app-server Codex.

**Model inny niż Codex używa PI:** to oczekiwane, chyba że polityka środowiska
uruchomieniowego dostawcy lub modelu kieruje go do innego harnessu. Zwykłe
referencje dostawców innych niż OpenAI pozostają na swojej normalnej ścieżce
dostawcy w trybie `auto`.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem się
utrzymuje, uruchom ponownie gateway, aby wyczyścić przestarzałe natywne
rejestracje hooków. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use#troubleshooting).

## Powiązane

- [Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pluginy harnessów agentów](/pl/plugins/sdk-agent-harness)
- [Hooki pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Status](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
