---
read_when:
    - Chcesz użyć dołączonego środowiska app-server Codex
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączony mechanizm app-server Codex
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-05-10T19:45:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agentów OpenAI
przez Codex app-server zamiast wbudowanego harnessu PI.

Użyj harnessu Codex, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
natywnym wznawianiem wątków, natywną kontynuacją narzędzi, natywną kompakcją oraz
wykonywaniem przez app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modelu,
dynamicznymi narzędziami OpenClaw, zatwierdzeniami, dostarczaniem multimediów oraz widocznym
lustrzanym zapisem transkrypcji.

Standardowa konfiguracja używa kanonicznych odwołań do modeli OpenAI, takich jak `openai/gpt-5.5`.
Nie konfiguruj odwołań do modeli `openai-codex/gpt-*`. `openai-codex` jest dostawcą profilu uwierzytelniania
dla profili Codex OAuth lub kluczy API Codex, a nie prefiksem dostawcy modeli
dla nowej konfiguracji agenta.

Szerszy podział na model/dostawcę/runtime zacznij od
[Runtime’y agentów](/pl/concepts/agent-runtimes). W skrócie:
`openai/gpt-5.5` to odwołanie do modelu, `codex` to runtime, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Wymagania

- OpenClaw z dostępnym dołączonym Pluginem `codex`.
- Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij `codex`.
- Codex app-server `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarnym plikiem Codex app-server, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na normalne uruchamianie harnessu.
- Uwierzytelnianie Codex dostępne przez `openclaw models auth login --provider openai-codex`,
  konto app-server w katalogu domowym Codex agenta albo jawny profil uwierzytelniania kluczem API Codex.

Pierwszeństwo uwierzytelniania, izolację środowiska, niestandardowe polecenia app-server, wykrywanie modeli
oraz wszystkie pola konfiguracji opisuje
[Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference).

## Szybki start

Większość użytkowników, którzy chcą używać Codex w OpenClaw, wybiera tę ścieżkę: zaloguj się za pomocą
subskrypcji ChatGPT/Codex, włącz dołączony Plugin `codex` i użyj kanonicznego
odwołania do modelu `openai/gpt-*`.

Zaloguj się przez Codex OAuth:

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

Uruchom ponownie Gateway po zmianie konfiguracji Pluginu. Jeśli istniejący czat ma już
sesję, użyj `/new` albo `/reset` przed testowaniem zmian runtime’u, aby następna
tura rozwiązała harness z bieżącej konfiguracji.

## Konfiguracja

Konfiguracja z szybkiego startu to minimalna działająca konfiguracja harnessu Codex. Ustawiaj opcje
harnessu Codex w konfiguracji OpenClaw, a CLI używaj tylko do uwierzytelniania Codex:

| Potrzeba                               | Ustaw                                                              | Gdzie                          |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| Włączenie harnessu                     | `plugins.entries.codex.enabled: true`                              | Konfiguracja OpenClaw          |
| Zachowanie instalacji Pluginu z listą dozwolonych | Uwzględnij `codex` w `plugins.allow`                               | Konfiguracja OpenClaw          |
| Kierowanie tur agenta OpenAI przez Codex | `agents.defaults.model` lub `agents.list[].model` jako `openai/gpt-*` | Konfiguracja agenta OpenClaw   |
| Logowanie przez Codex OAuth            | `openclaw models auth login --provider openai-codex`               | Profil uwierzytelniania CLI    |
| Zamknięcie z błędem, gdy Codex jest niedostępny | Dostawca albo model `agentRuntime.id: "codex"`                     | Konfiguracja modelu/dostawcy OpenClaw |
| Użycie bezpośredniego ruchu OpenAI API | Dostawca albo model `agentRuntime.id: "pi"` ze standardowym uwierzytelnianiem OpenAI | Konfiguracja modelu/dostawcy OpenClaw |
| Dostrajanie zachowania app-server      | `plugins.entries.codex.config.appServer.*`                         | Konfiguracja Pluginu Codex     |
| Włączenie natywnych aplikacji Pluginu Codex | `plugins.entries.codex.config.codexPlugins.*`                      | Konfiguracja Pluginu Codex     |
| Włączenie Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                       | Konfiguracja Pluginu Codex     |

Używaj odwołań do modeli `openai/gpt-*` dla tur agentów OpenAI wspieranych przez Codex.
`openai-codex` jest wyłącznie nazwą dostawcy profilu uwierzytelniania dla Codex OAuth i
profili kluczy API Codex. Nie zapisuj nowych odwołań do modeli `openai-codex/gpt-*`.

Pozostała część tej strony omawia typowe warianty, między którymi użytkownicy muszą wybrać:
kształt wdrożenia, routing fail-closed, politykę zatwierdzeń guardian, natywne Pluginy Codex
i Computer Use. Pełne listy opcji, wartości domyślne, enumy, wykrywanie,
izolację środowiska, limity czasu i pola transportu app-server znajdziesz w
[Dokumentacji referencyjnej harnessu Codex](/pl/plugins/codex-harness-reference).

## Weryfikacja runtime’u Codex

Użyj `/status` na czacie, na którym oczekujesz Codex. Tura agenta OpenAI wspierana przez Codex
pokazuje:

```text
Runtime: OpenAI Codex
```

Następnie sprawdź stan Codex app-server:

```text
/codex status
/codex models
```

`/codex status` raportuje łączność app-server, konto, limity szybkości, serwery MCP
i skills. `/codex models` wyświetla aktualny katalog Codex app-server dla
harnessu i konta. Jeśli `/status` zaskakuje, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Routing i wybór modelu

Oddziel odwołania do dostawców od polityki runtime’u:

- Używaj `openai/gpt-*` dla tur agentów OpenAI przez Codex.
- Nie używaj `openai-codex/gpt-*` w konfiguracji. Uruchom `openclaw doctor --fix`, aby
  naprawić starsze odwołania i nieaktualne przypięcia tras sesji.
- `agentRuntime.id: "codex"` jest opcjonalne dla normalnego trybu automatycznego OpenAI, ale przydatne,
  gdy wdrożenie ma zakończyć się błędem, jeśli Codex jest niedostępny.
- `agentRuntime.id: "pi"` przełącza dostawcę albo model na bezpośrednie zachowanie PI, gdy
  jest to zamierzone.
- `/codex ...` kontroluje natywne konwersacje Codex app-server z czatu.
- ACP/acpx to osobna zewnętrzna ścieżka harnessu. Używaj jej tylko wtedy, gdy użytkownik prosi
  o ACP/acpx albo zewnętrzny adapter harnessu.

Typowy routing poleceń:

| Intencja użytkownika            | Użyj                                    |
| ------------------------------- | --------------------------------------- |
| Dołączenie bieżącego czatu      | `/codex bind [--cwd <path>]`            |
| Wznowienie istniejącego wątku Codex | `/codex resume <thread-id>`             |
| Wyświetlenie lub filtrowanie wątków Codex | `/codex threads [filter]`               |
| Wysłanie tylko opinii Codex     | `/codex diagnostics [note]`             |
| Rozpoczęcie zadania ACP/acpx    | Polecenia sesji ACP/acpx, nie `/codex` |

| Przypadek użycia                                      | Konfiguracja                                                    | Weryfikacja                             | Uwagi                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym runtime’em Codex | `openai/gpt-*` plus włączony Plugin `codex`                      | `/status` pokazuje `Runtime: OpenAI Codex` | Zalecana ścieżka                  |
| Zamknięcie z błędem, jeśli Codex jest niedostępny     | Dostawca albo model `agentRuntime.id: "codex"`                   | Tura kończy się błędem zamiast fallbacku PI | Używaj we wdrożeniach tylko z Codex |
| Bezpośredni ruch klucza API OpenAI przez PI           | Dostawca albo model `agentRuntime.id: "pi"` i standardowe uwierzytelnianie OpenAI | `/status` pokazuje runtime PI           | Używaj tylko, gdy PI jest zamierzone |
| Starsza konfiguracja                                  | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` przepisuje ją   | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter Codex ACP/acpx                                | ACP `sessions_spawn({ runtime: "acp" })`                         | Stan zadania/sesji ACP                  | Oddzielny od natywnego harnessu Codex |

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Używaj `openai/gpt-*`
dla normalnej trasy OpenAI i `codex/gpt-*` tylko wtedy, gdy rozumienie obrazów
ma działać przez ograniczoną turę Codex app-server. Nie używaj
`openai-codex/gpt-*`; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.

## Wzorce wdrożenia

### Podstawowe wdrożenie Codex

Użyj konfiguracji z szybkiego startu, gdy wszystkie tury agentów OpenAI mają domyślnie
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

Ten wariant zachowuje Claude jako domyślnego agenta i dodaje nazwanego agenta Codex:

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

W tej konfiguracji agent `main` używa swojej normalnej ścieżki dostawcy, a agent
`codex` używa Codex app-server.

### Wdrożenie Codex fail-closed

Dla tur agentów OpenAI `openai/gpt-*` już rozwiązuje się do Codex, gdy
dołączony Plugin jest dostępny. Dodaj jawną politykę runtime’u, gdy chcesz mieć zapisaną
regułę fail-closed:

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

Przy wymuszonym Codex OpenClaw kończy działanie wcześnie błędem, jeśli Plugin Codex jest wyłączony,
app-server jest zbyt stary albo app-server nie może się uruchomić.

## Polityka app-server

Domyślnie Plugin uruchamia lokalnie zarządzany przez OpenClaw binarny plik Codex z transportem stdio.
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

Lokalne sesje app-server stdio domyślnie przyjmują postawę zaufanego lokalnego operatora:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie pozwalają na tę
domyślną postawę YOLO, OpenClaw wybiera zamiast tego dozwolone uprawnienia guardian.

Użyj trybu guardian, gdy chcesz natywnej automatycznej recenzji Codex przed wyjściem poza sandbox
albo dodatkowymi uprawnieniami:

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

Tryb guardian rozwija się do zatwierdzeń Codex app-server, zwykle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` oraz
`sandbox: "workspace-write"`, gdy lokalne wymagania pozwalają na te wartości.

Każde pole app-server, kolejność uwierzytelniania, izolację środowiska, wykrywanie i
zachowanie limitów czasu opisuje [Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Dołączony Plugin rejestruje `/codex` jako polecenie ukośnikowe w każdym kanale, który
obsługuje polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` sprawdza łączność z serwerem aplikacji, modele, konto, limity szybkości,
  serwery MCP oraz Skills.
- `/codex models` wyświetla dostępne na żywo modele serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki serwera aplikacji Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do
  istniejącego wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii Codex dla
  dołączonego wątku.
- `/codex account` pokazuje status konta i limitów szybkości.
- `/codex mcp` wyświetla status serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

W przypadku większości zgłoszeń do pomocy technicznej zacznij od `/diagnostics [note]` w rozmowie,
w której wystąpił błąd. Tworzy to jeden raport diagnostyczny Gateway i, w przypadku sesji
harnessa Codex, prosi o zgodę na wysłanie odpowiedniego pakietu opinii Codex.
Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać model prywatności i zachowanie
czatu grupowego.

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego
Gateway.

### Lokalna inspekcja wątków Codex

Najszybszym sposobem inspekcji nieudanego uruchomienia Codex jest często bezpośrednie otwarcie natywnego
wątku Codex:

```bash
codex resume <thread-id>
```

Identyfikator wątku uzyskaj z ukończonej odpowiedzi `/diagnostics`, `/codex binding` lub
`/codex threads [filter]`.

Mechanikę przesyłania i granice diagnostyki na poziomie runtime opisuje
[Runtime harnessa Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla osadzeń lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych tur serwera aplikacji Codex przez API.
Jawne profile klucza API Codex i lokalny fallback stdio z kluczem w środowisku używają logowania
serwera aplikacji zamiast dziedziczonego środowiska procesu potomnego. Połączenia WebSocket
z serwerem aplikacji nie otrzymują fallbacku klucza API ze środowiska Gateway; użyj jawnego profilu
uwierzytelniania albo własnego konta zdalnego serwera aplikacji.

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

`appServer.clearEnv` wpływa tylko na uruchamiany proces potomny serwera aplikacji Codex.

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
dynamicznych narzędzi, które duplikują natywne operacje Codex na obszarze roboczym: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` i `update_plan`. Pozostałe narzędzia integracji OpenClaw,
takie jak wiadomości, sesje, media, cron, przeglądarka, węzły,
gateway, `heartbeat_respond` i `web_search`, są dostępne przez wyszukiwanie narzędzi Codex
w przestrzeni nazw `openclaw`, dzięki czemu początkowy kontekst modelu jest
mniejszy.
`sessions_yield` i odpowiedzi źródłowe wyłącznie z narzędzi wiadomości pozostają bezpośrednie, ponieważ są
kontraktami sterowania turą. Instrukcje współpracy Heartbeat mówią Codex, aby
wyszukał `heartbeat_respond` przed zakończeniem tury Heartbeat, gdy narzędzie nie jest
jeszcze załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym serwerem aplikacji Codex,
który nie potrafi wyszukiwać odroczonych narzędzi dynamicznych, albo podczas debugowania pełnego
ładunku narzędzi.

Obsługiwane pola Pluginu Codex najwyższego poziomu:

| Pole                       | Domyślnie       | Znaczenie                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy dynamicznych narzędzi OpenClaw do pominięcia w turach serwera aplikacji Codex. |
| `codexPlugins`             | wyłączone      | Natywna obsługa pluginów/aplikacji Codex dla migrowanych, instalowanych ze źródeł kuratorowanych pluginów. |

Obsługiwane pola `appServer`:

| Pole                          | Domyślnie                                              | Znaczenie                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                       |
| `command`                     | zarządzany plik binarny Codex                          | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko jako jawne nadpisanie.                                                                                           |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                   |
| `url`                         | nieustawione                                           | URL serwera aplikacji WebSocket.                                                                                                                                                                                                  |
| `authToken`                   | nieustawione                                           | Token bearer dla transportu WebSocket.                                                                                                                                                                                            |
| `headers`                     | `{}`                                                   | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                     |
| `clearEnv`                    | `[]`                                                   | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchamianego procesu serwera aplikacji stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent OpenClaw przy lokalnych uruchomieniach. |
| `requestTimeoutMs`            | `60000`                                                | Limit czasu dla wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ciche okno po żądaniu serwera aplikacji Codex o zakresie tury, gdy OpenClaw czeka na `turn/completed`. Zwiększ tę wartość dla wolnych faz syntezy po narzędziach lub wyłącznie statusowych.                                      |
| `mode`                        | `"yolo"`, chyba że lokalne wymagania Codex zabraniają YOLO | Preset dla wykonywania YOLO albo przeglądanego przez guardiana. Lokalne wymagania stdio, które pomijają `danger-full-access`, zatwierdzanie `never` albo recenzenta `user`, czynią domyślny tryb guardianem.                       |
| `approvalPolicy`              | `"never"` albo dozwolona polityka zatwierdzania guardiana | Natywna polityka zatwierdzania Codex wysyłana przy starcie/wznowieniu/turze wątku. Domyślne ustawienia guardiana preferują `"on-request"`, gdy jest dozwolone.                                                                    |
| `sandbox`                     | `"danger-full-access"` albo dozwolony sandbox guardiana | Natywny tryb sandbox Codex wysyłany przy starcie/wznowieniu wątku. Domyślne ustawienia guardiana preferują `"workspace-write"`, gdy jest dozwolone, w przeciwnym razie `"read-only"`.                                            |
| `approvalsReviewer`           | `"user"` albo dozwolony recenzent guardiana             | Użyj `"auto_review"`, aby Codex przeglądał natywne monity zatwierdzania, gdy jest to dozwolone; w przeciwnym razie `guardian_subagent` albo `user`. `guardian_subagent` pozostaje starszym aliasem.                               |
| `serviceTier`                 | nieustawione                                           | Opcjonalna warstwa usługi serwera aplikacji Codex. `"priority"` włącza trasowanie w trybie szybkim, `"flex"` żąda przetwarzania flex, `null` czyści nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.             |

Wywołania dynamicznych narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie używają 30-sekundowego
watchdoga OpenClaw. Dodatni argument per wywołanie `timeoutMs` wydłuża
lub skraca budżet tego konkretnego narzędzia. Narzędzie `image_generate` używa również
`agents.defaults.imageGenerationModel.timeoutMs`, gdy wywołanie narzędzia nie
podaje własnego limitu czasu, a narzędzie rozumienia mediów `image` używa
`tools.media.image.timeoutSeconds` albo swojego 60-sekundowego domyślnego limitu dla mediów. Budżety
dynamicznych narzędzi są ograniczone do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia
tam, gdzie jest to obsługiwane, i zwraca do Codex nieudaną odpowiedź dynamicznego narzędzia, aby tura
mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie serwera aplikacji Codex o zakresie tury, harness
oczekuje też, że Codex zakończy natywną turę zdarzeniem `turn/completed`. Jeśli
serwer aplikacji milczy przez `appServer.turnCompletionIdleTimeoutMs` po tej
odpowiedzi, OpenClaw w trybie best-effort przerywa turę Codex, zapisuje diagnostyczny
timeout i zwalnia pas sesji OpenClaw, aby kolejne wiadomości czatu nie były
kolejkowane za nieaktualną natywną turą. Każde nieterminalne powiadomienie dla
tej samej tury, w tym `rawResponseItem/completed`, rozbraja tego krótkiego watchdoga,
ponieważ Codex udowodnił, że tura nadal żyje; dłuższy terminalny watchdog
nadal chroni rzeczywiście zablokowane tury. Diagnostyka timeoutów obejmuje
ostatnią metodę powiadomienia serwera aplikacji oraz, dla surowych elementów odpowiedzi asystenta,
typ elementu, rolę, identyfikator i ograniczony podgląd tekstu asystenta.

Nadpisania środowiskowe pozostają dostępne do lokalnych testów:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` pomija zarządzany plik binarny, gdy
`appServer.command` jest nieustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` usunięto. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego testowania lokalnego. Konfiguracja jest
preferowana przy powtarzalnych wdrożeniach, ponieważ utrzymuje zachowanie pluginu w
tym samym sprawdzanym pliku co pozostałą konfigurację harnessu Codex.

## Natywne pluginy Codex

Obsługa natywnych pluginów Codex używa własnych możliwości aplikacji i pluginów
Codex app-server w tym samym wątku Codex co tura harnessu OpenClaw. OpenClaw
nie tłumaczy pluginów Codex na syntetyczne dynamiczne narzędzia OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa wyłącznie na sesje, które wybierają natywny harness Codex. Nie
ma wpływu na przebiegi PI, zwykłe przebiegi dostawcy OpenAI, powiązania rozmów
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

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję
harnessu Codex albo zastępuje nieaktualne powiązanie wątku Codex. Nie jest
obliczana ponownie przy każdej turze. Po zmianie `codexPlugins` użyj `/new`,
`/reset` albo zrestartuj gateway, aby przyszłe sesje harnessu Codex startowały
ze zaktualizowanym zestawem aplikacji.

Informacje o kwalifikowaniu do migracji, inwentarzu aplikacji, zasadach działań
destrukcyjnych, wywołaniach elicitation i diagnostyce natywnych pluginów znajdziesz w
[Natywne pluginy Codex](/pl/plugins/codex-native-plugins).

## Computer Use

Computer Use opisano w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie vendoryzuje aplikacji do sterowania pulpitem ani sam
nie wykonuje działań na pulpicie. Przygotowuje Codex app-server, weryfikuje, że
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex przejąć
natywne wywołania narzędzi MCP podczas tur w trybie Codex.

## Granice środowiska uruchomieniowego

Harness Codex zmienia wyłącznie niskopoziomowy osadzony wykonawca agenta.

- Dynamiczne narzędzia OpenClaw są obsługiwane. Codex prosi OpenClaw o wykonanie tych
  narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.
- Natywne narzędzia powłoki, patchy, MCP i aplikacji Codex należą do Codex.
  OpenClaw może obserwować lub blokować wybrane zdarzenia natywne przez obsługiwany
  przekaźnik, ale nie przepisuje argumentów narzędzi natywnych.
- Codex odpowiada za natywną Compaction. OpenClaw utrzymuje lustrzaną kopię transkrypcji dla
  historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłej zmiany modelu lub harnessu.
- Generowanie mediów, rozumienie mediów, TTS, zatwierdzenia i dane wyjściowe
  narzędzi wiadomości nadal przechodzą przez odpowiednie ustawienia dostawcy/modelu OpenClaw.
- `tool_result_persist` dotyczy wyników narzędzi transkrypcji należących do OpenClaw, a nie
  rekordów wyników narzędzi natywnych Codex.

Szczegóły dotyczące warstw hooków, obsługiwanych powierzchni V1, natywnej obsługi uprawnień,
sterowania kolejką, mechaniki przesyłania opinii Codex i Compaction znajdziesz w
[Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** jest to oczekiwane w
nowych konfiguracjach. Wybierz model `openai/gpt-*`, włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** upewnij się, że referencja modelu to
`openai/gpt-*` u oficjalnego dostawcy OpenAI i że plugin Codex jest
zainstalowany oraz włączony. Jeśli podczas testów potrzebujesz ścisłego dowodu, ustaw w dostawcy lub
modelu `agentRuntime.id: "codex"`. Wymuszone środowisko uruchomieniowe Codex kończy się błędem zamiast
wracać do PI.

**Pozostała starsza konfiguracja `openai-codex/*`:** uruchom `openclaw doctor --fix`.
Doctor przepisuje starsze referencje modeli na `openai/*`, usuwa nieaktualne pinezki środowiska uruchomieniowego
sesji i całego agenta oraz zachowuje istniejące nadpisania profili uwierzytelniania.

**App-server jest odrzucany:** użyj Codex app-server `0.125.0` lub nowszego.
Wersje przedpremierowe o tej samej wersji albo wersje z sufiksem buildu, takie jak
`0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ OpenClaw testuje
stabilny minimalny poziom protokołu `0.125.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy dołączony plugin `codex` jest
włączony, czy `plugins.allow` obejmuje go, gdy skonfigurowano listę dozwolonych, oraz
czy wszystkie niestandardowe `appServer.command`, `url`, `authToken` lub nagłówki są poprawne.

**Wykrywanie modeli jest wolne:** zmniejsz
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie. Zobacz
[Referencja harnessu Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket natychmiast się nie udaje:** sprawdź `appServer.url`, `authToken`,
nagłówki oraz to, czy zdalny app-server używa tej samej wersji protokołu Codex app-server.

**Model inny niż Codex używa PI:** jest to oczekiwane, chyba że zasady środowiska uruchomieniowego
dostawcy lub modelu kierują go do innego harnessu. Zwykłe referencje dostawców innych niż OpenAI pozostają na
swojej normalnej ścieżce dostawcy w trybie `auto`.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem się utrzymuje, zrestartuj
gateway, aby wyczyścić nieaktualne rejestracje natywnych hooków. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use#troubleshooting).

## Powiązane

- [Referencja harnessu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Hooki pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Status](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
