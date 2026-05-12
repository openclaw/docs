---
read_when:
    - Chcesz użyć dołączonego środowiska uruchomieniowego serwera aplikacji Codex
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przełączać się awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączony harness Codex app-server
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-05-12T00:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta OpenAI
przez app-server Codex zamiast wbudowanego harnessu PI.

Używaj harnessu Codex, gdy chcesz, aby Codex odpowiadał za niskopoziomową sesję agenta:
natywne wznawianie wątku, natywną kontynuację narzędzi, natywną Compaction oraz
wykonywanie przez app-server. OpenClaw nadal odpowiada za kanały czatu, pliki sesji, wybór modelu,
dynamiczne narzędzia OpenClaw, zatwierdzenia, dostarczanie multimediów oraz widoczne
lustrzane odzwierciedlenie transkrypcji.

Standardowa konfiguracja używa kanonicznych referencji modeli OpenAI, takich jak `openai/gpt-5.5`.
Nie konfiguruj referencji modeli `openai-codex/gpt-*`. Kolejność uwierzytelniania agenta OpenAI umieść
w `auth.order.openai`; starsze profile `openai-codex:*` i wpisy
`auth.order.openai-codex` pozostają obsługiwane dla istniejących instalacji.

OpenClaw uruchamia wątki app-server Codex z natywnym trybem kodu Codex i
włączonym wyłącznie trybem kodu. Dzięki temu odroczone/przeszukiwalne dynamiczne narzędzia OpenClaw
pozostają we własnym środowisku wykonywania kodu i powierzchni wyszukiwania narzędzi Codex, zamiast dodawać
wrapper wyszukiwania narzędzi w stylu PI ponad Codex.

Szerszy podział modelu/dostawcy/środowiska uruchomieniowego zacznij od
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes). Krótko mówiąc:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- Jeśli konfiguracja używa `plugins.allow`, uwzględnij `codex`.
- App-server Codex `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarium app-server Codex, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na standardowy start harnessu.
- Uwierzytelnianie Codex dostępne przez `openclaw models auth login --provider openai-codex`,
  konto app-server w katalogu domowym Codex agenta albo jawny profil uwierzytelniania Codex
  z kluczem API.

Pierwszeństwo uwierzytelniania, izolację środowiska, niestandardowe polecenia app-server, wykrywanie modeli
oraz wszystkie pola konfiguracji opisuje
[Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference).

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

Jeśli konfiguracja używa `plugins.allow`, dodaj tam również `codex`:

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

Zrestartuj Gateway po zmianie konfiguracji Plugin. Jeśli istniejący czat ma już
sesję, użyj `/new` lub `/reset` przed testowaniem zmian środowiska uruchomieniowego, aby następna
tura rozwiązała harness z bieżącej konfiguracji.

## Konfiguracja

Konfiguracja szybkiego startu to minimalna działająca konfiguracja harnessu Codex. Ustawiaj opcje
harnessu Codex w konfiguracji OpenClaw, a CLI używaj tylko do uwierzytelniania Codex:

| Potrzeba                               | Ustaw                                                                            | Gdzie                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Włączenie harnessu                     | `plugins.entries.codex.enabled: true`                                            | Konfiguracja OpenClaw              |
| Zachowanie instalacji Plugin na liście dozwolonych | Uwzględnij `codex` w `plugins.allow`                                    | Konfiguracja OpenClaw              |
| Kierowanie tur agenta OpenAI przez Codex | `agents.defaults.model` lub `agents.list[].model` jako `openai/gpt-*`          | Konfiguracja agenta OpenClaw       |
| Logowanie przez OAuth Codex            | `openclaw models auth login --provider openai-codex`                             | Profil uwierzytelniania CLI        |
| Dodanie zapasowego klucza API dla uruchomień Codex | Profil klucza API `openai:*` wymieniony po uwierzytelnianiu subskrypcyjnym w `auth.order.openai` | Profil uwierzytelniania CLI + konfiguracja OpenClaw |
| Zamknięcie z błędem, gdy Codex jest niedostępny | `agentRuntime.id: "codex"` na poziomie dostawcy lub modelu              | Konfiguracja modelu/dostawcy OpenClaw |
| Użycie bezpośredniego ruchu API OpenAI | `agentRuntime.id: "pi"` na poziomie dostawcy lub modelu ze standardowym uwierzytelnianiem OpenAI | Konfiguracja modelu/dostawcy OpenClaw |
| Dostrajanie zachowania app-server      | `plugins.entries.codex.config.appServer.*`                                       | Konfiguracja Plugin Codex          |
| Włączenie natywnych aplikacji Plugin Codex | `plugins.entries.codex.config.codexPlugins.*`                                 | Konfiguracja Plugin Codex          |
| Włączenie Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Konfiguracja Plugin Codex          |

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

W takim układzie oba profile nadal działają przez Codex dla tur agenta
`openai/gpt-*`. Klucz API jest tylko zapasowym uwierzytelnianiem, a nie żądaniem przełączenia na PI lub
zwykłe OpenAI Responses.

Pozostała część tej strony omawia typowe warianty, między którymi użytkownicy muszą wybrać:
kształt wdrożenia, trasowanie zamknięte z błędem, politykę zatwierdzania guardian, natywne Pluginy Codex
oraz Computer Use. Pełne listy opcji, wartości domyślne, wyliczenia, wykrywanie,
izolację środowiska, limity czasu i pola transportu app-server opisuje
[Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference).

## Weryfikacja środowiska uruchomieniowego Codex

Użyj `/status` na czacie, na którym oczekujesz Codex. Tura agenta OpenAI obsługiwana przez Codex
pokazuje:

```text
Runtime: OpenAI Codex
```

Następnie sprawdź stan app-server Codex:

```text
/codex status
/codex models
```

`/codex status` raportuje łączność app-server, konto, limity częstotliwości, serwery MCP
oraz Skills. `/codex models` wyświetla aktywny katalog app-server Codex dla
harnessu i konta. Jeśli `/status` jest zaskakujący, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Trasowanie i wybór modelu

Rozdziel referencje dostawców od polityki środowiska uruchomieniowego:

- Używaj `openai/gpt-*` dla tur agenta OpenAI przez Codex.
- Nie używaj `openai-codex/gpt-*` w konfiguracji. Uruchom `openclaw doctor --fix`, aby
  naprawić starsze referencje i przestarzałe przypięcia trasy sesji.
- `agentRuntime.id: "codex"` jest opcjonalne w standardowym automatycznym trybie OpenAI, ale przydatne,
  gdy wdrożenie powinno kończyć się błędem, jeśli Codex jest niedostępny.
- `agentRuntime.id: "pi"` przełącza dostawcę lub model na bezpośrednie zachowanie PI, gdy
  jest to zamierzone.
- `/codex ...` steruje natywnymi konwersacjami app-server Codex z czatu.
- ACP/acpx to osobna ścieżka zewnętrznego harnessu. Używaj jej tylko wtedy, gdy użytkownik prosi
  o ACP/acpx lub adapter zewnętrznego harnessu.

Typowe trasowanie poleceń:

| Intencja użytkownika             | Użyj                                    |
| ------------------------------- | --------------------------------------- |
| Dołącz bieżący czat             | `/codex bind [--cwd <path>]`            |
| Wznów istniejący wątek Codex    | `/codex resume <thread-id>`             |
| Wyświetl lub filtruj wątki Codex | `/codex threads [filter]`               |
| Wyślij tylko informację zwrotną Codex | `/codex diagnostics [note]`        |
| Rozpocznij zadanie ACP/acpx     | Polecenia sesji ACP/acpx, nie `/codex`  |

| Przypadek użycia                                      | Skonfiguruj                                                     | Zweryfikuj                              | Uwagi                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-*` plus włączony Plugin `codex`        | `/status` pokazuje `Runtime: OpenAI Codex` | Zalecana ścieżka                   |
| Zamknięcie z błędem, jeśli Codex jest niedostępny    | `agentRuntime.id: "codex"` na poziomie dostawcy lub modelu       | Tura kończy się błędem zamiast awaryjnego przejścia na PI | Używaj dla wdrożeń tylko z Codex |
| Bezpośredni ruch z kluczem API OpenAI przez PI       | `agentRuntime.id: "pi"` na poziomie dostawcy lub modelu oraz standardowe uwierzytelnianie OpenAI | `/status` pokazuje środowisko uruchomieniowe PI | Używaj tylko, gdy PI jest zamierzone |
| Starsza konfiguracja                                 | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` przepisuje ją   | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter ACP/acpx Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Status zadania/sesji ACP                | Oddzielne od natywnego harnessu Codex |

`agents.defaults.imageModel` używa tego samego podziału prefiksów. Używaj `openai/gpt-*`
dla standardowej trasy OpenAI i `codex/gpt-*` tylko wtedy, gdy rozumienie obrazów
powinno działać przez ograniczoną turę app-server Codex. Nie używaj
`openai-codex/gpt-*`; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.

## Wzorce wdrożenia

### Podstawowe wdrożenie Codex

Użyj konfiguracji szybkiego startu, gdy wszystkie tury agenta OpenAI powinny domyślnie używać Codex.

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

W tej konfiguracji agent `main` używa swojej standardowej ścieżki dostawcy, a agent
`codex` używa app-server Codex.

### Wdrożenie Codex zamknięte z błędem

Dla tur agenta OpenAI `openai/gpt-*` już rozwiązuje się do Codex, gdy
dołączony Plugin jest dostępny. Dodaj jawną politykę środowiska uruchomieniowego, gdy chcesz mieć zapisaną
regułę zamknięcia z błędem:

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

Domyślnie Plugin uruchamia lokalnie zarządzane przez OpenClaw binarium Codex z transportem
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

Lokalne sesje stdio app-server domyślnie używają postawy zaufanego lokalnego operatora:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie zezwalają na tę
niejawną postawę YOLO, OpenClaw wybiera zamiast tego dozwolone uprawnienia strażnika.
Gdy dla sesji aktywna jest piaskownica OpenClaw, OpenClaw zawęża Codex
`danger-full-access` do Codex `workspace-write`, aby natywne tury trybu kodu Codex
pozostawały w piaskownicowym obszarze roboczym.

Użyj trybu strażnika, gdy chcesz, aby Codex wykonywał natywny automatyczny przegląd przed wyjściami z piaskownicy
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

Tryb strażnika rozwija się do zatwierdzeń Codex app-server, zwykle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` oraz
`sandbox: "workspace-write"`, gdy lokalne wymagania zezwalają na te wartości.

W przypadku każdego pola app-server, kolejności uwierzytelniania, izolacji środowiska, wykrywania i
zachowania limitów czasu zobacz [odwołanie do harnessa Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Dołączony Plugin rejestruje `/codex` jako polecenie z ukośnikiem na każdym kanale, który
obsługuje polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` sprawdza łączność app-server, modele, konto, limity szybkości,
  serwery MCP oraz Skills.
- `/codex models` wyświetla listę aktywnych modeli Codex app-server.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex app-server.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do
  istniejącego wątku Codex.
- `/codex compact` prosi Codex app-server o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii Codex dotyczącej
  dołączonego wątku.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwerów MCP Codex app-server.
- `/codex skills` wyświetla Skills Codex app-server.

W przypadku większości zgłoszeń do pomocy technicznej zacznij od `/diagnostics [note]` w rozmowie,
w której wystąpił błąd. Tworzy to jeden raport diagnostyczny Gateway i, dla sesji
harnessa Codex, prosi o zgodę na wysłanie odpowiedniego pakietu opinii Codex.
Zobacz [eksport diagnostyki](/pl/gateway/diagnostics), aby poznać model prywatności i zachowanie
czatu grupowego.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać opinię Codex
dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego Gateway.

### Lokalna inspekcja wątków Codex

Najszybszym sposobem inspekcji nieudanego uruchomienia Codex jest często bezpośrednie otwarcie natywnego wątku Codex:

```bash
codex resume <thread-id>
```

Pobierz identyfikator wątku z ukończonej odpowiedzi `/diagnostics`, `/codex binding` lub
`/codex threads [filter]`.

Mechanikę przesyłania i granice diagnostyki na poziomie środowiska uruchomieniowego opisuje
[środowisko uruchomieniowe harnessa Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

Uwierzytelnianie jest wybierane w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej w
   `auth.order.openai`. Istniejące identyfikatory profili `openai-codex:*` pozostają ważne.
2. Istniejące konto app-server w katalogu domowym Codex tego agenta.
3. Tylko w przypadku lokalnych uruchomień stdio app-server, `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy nie ma konta app-server, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla osadzeń lub bezpośrednich modeli OpenAI,
bez przypadkowego rozliczania natywnych tur Codex app-server przez API.
Jawne profile kluczy API Codex i lokalne rezerwowe użycie kluczy środowiskowych stdio korzystają z logowania
app-server zamiast dziedziczonego środowiska procesu potomnego. Połączenia WebSocket app-server
nie otrzymują rezerwowych kluczy API środowiska Gateway; użyj jawnego profilu uwierzytelniania albo
własnego konta zdalnego app-server.

Jeśli profil subskrypcyjny osiągnie limit użycia Codex, OpenClaw zapisuje czas resetu,
gdy Codex go zgłosi, i próbuje następnego uporządkowanego profilu uwierzytelniania dla tego samego
uruchomienia Codex. Po upływie czasu resetu profil subskrypcyjny ponownie staje się kwalifikowalny
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

`appServer.clearEnv` wpływa tylko na uruchamiany proces potomny Codex app-server.

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
dynamicznych narzędzi, które dublują natywne operacje Codex na obszarze roboczym: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` i `update_plan`. Pozostałe narzędzia integracji OpenClaw,
takie jak wiadomości, sesje, media, cron, przeglądarka, węzły,
gateway, `heartbeat_respond` i `web_search`, są dostępne przez wyszukiwanie narzędzi Codex
w przestrzeni nazw `openclaw`, co zmniejsza początkowy kontekst modelu.
`sessions_yield` i odpowiedzi źródłowe wyłącznie z narzędzi wiadomości pozostają bezpośrednie, ponieważ są to
kontrakty sterowania turą. Instrukcje współpracy Heartbeat mówią Codex, aby
wyszukał `heartbeat_respond` przed zakończeniem tury Heartbeat, gdy narzędzie
nie jest jeszcze załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym Codex
app-server, który nie może wyszukiwać odroczonych narzędzi dynamicznych, albo podczas debugowania pełnego
ładunku narzędzi.

Obsługiwane pola najwyższego poziomu Plugin Codex:

| Pole                       | Domyślnie      | Znaczenie                                                                                  |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy dynamicznych narzędzi OpenClaw do pominięcia w turach Codex app-server.     |
| `codexPlugins`             | wyłączone      | Natywna obsługa pluginów/aplikacji Codex dla zmigrowanych, instalowanych ze źródeł, kuratorowanych pluginów. |

Obsługiwane pola `appServer`:

| Pole                          | Domyślnie                                             | Znaczenie                                                                                                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                             |
| `command`                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko dla jawnego nadpisania.                                                                                                |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | Argumenty dla transportu stdio.                                                                                                                                                                                                         |
| `url`                         | nieustawione                                          | Adres URL WebSocket app-server.                                                                                                                                                                                                         |
| `authToken`                   | nieustawione                                          | Token bearer dla transportu WebSocket.                                                                                                                                                                                                  |
| `headers`                     | `{}`                                                  | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                           |
| `clearEnv`                    | `[]`                                                  | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchamianego procesu stdio app-server po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent w lokalnych uruchomieniach OpenClaw. |
| `requestTimeoutMs`            | `60000`                                               | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | Okno ciszy po żądaniu Codex app-server w zakresie tury, gdy OpenClaw czeka na `turn/completed`. Zwiększ tę wartość dla wolnych faz syntezy po użyciu narzędzi lub wyłącznie statusowych.                                               |
| `mode`                        | `"yolo"`, chyba że lokalne wymagania Codex zabraniają YOLO | Ustawienie wstępne dla wykonywania YOLO lub przeglądanego przez strażnika. Lokalne wymagania stdio, które pomijają `danger-full-access`, zatwierdzenie `never` lub recenzenta `user`, sprawiają, że niejawną wartością domyślną jest strażnik. |
| `approvalPolicy`              | `"never"` lub dozwolona polityka zatwierdzania strażnika | Natywna polityka zatwierdzania Codex wysyłana do rozpoczęcia/wznowienia wątku/tury. Domyślne wartości strażnika preferują `"on-request"`, gdy jest dozwolone.                                                                            |
| `sandbox`                     | `"danger-full-access"` lub dozwolona piaskownica strażnika | Natywny tryb piaskownicy Codex wysyłany do rozpoczęcia/wznowienia wątku. Domyślne wartości strażnika preferują `"workspace-write"`, gdy jest dozwolone, w przeciwnym razie `"read-only"`. Gdy aktywna jest piaskownica OpenClaw, `danger-full-access` jest zawężane do `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` lub dozwolony recenzent strażnika            | Użyj `"auto_review"`, aby Codex przeglądał natywne monity zatwierdzeń, gdy jest to dozwolone; w przeciwnym razie `guardian_subagent` lub `user`. `guardian_subagent` pozostaje starszym aliasem.                                      |
| `serviceTier`                 | nieustawione                                          | Opcjonalny poziom usługi Codex app-server. `"priority"` włącza routing trybu szybkiego, `"flex"` żąda przetwarzania flex, `null` czyści nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.                              |

Dynamiczne wywołania narzędzi należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie używają
30-sekundowego watchdoga OpenClaw. Dodatni argument `timeoutMs` dla wywołania
wydłuża lub skraca budżet tego konkretnego narzędzia. Narzędzie
`image_generate` używa także `agents.defaults.imageGenerationModel.timeoutMs`,
gdy wywołanie narzędzia nie podaje własnego limitu czasu, a narzędzie `image`
do rozumienia mediów używa `tools.media.image.timeoutSeconds` albo domyślnego
60-sekundowego limitu dla mediów. Budżety narzędzi dynamicznych są ograniczone
do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia
tam, gdzie jest to obsługiwane, i zwraca do Codex nieudane dynamic-tool response,
aby tura mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie app-server ograniczone do tury Codex,
harness oczekuje także, że Codex zakończy natywną turę komunikatem
`turn/completed`. Jeśli app-server pozostaje bezczynny przez
`appServer.turnCompletionIdleTimeoutMs` po tej odpowiedzi, OpenClaw podejmuje
najlepszą możliwą próbę przerwania tury Codex, zapisuje diagnostyczne
przekroczenie limitu czasu i zwalnia tor sesji OpenClaw, aby kolejne wiadomości
czatu nie trafiały do kolejki za nieaktualną natywną turą. Każde nieterminalne
powiadomienie dla tej samej tury, w tym `rawResponseItem/completed`, rozbraja
tego krótkiego watchdoga, ponieważ Codex udowodnił, że tura nadal żyje; dłuższy
watchdog terminalny nadal chroni rzeczywiście zablokowane tury. Diagnostyka
limitów czasu zawiera ostatnią metodę powiadomienia app-server oraz, dla
surowych elementów odpowiedzi asystenta, typ elementu, rolę, id i ograniczony
podgląd tekstu asystenta.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego lokalnego testowania.
Konfiguracja jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje
zachowanie Plugin w tym samym zrecenzowanym pliku co reszta konfiguracji
harness Codex.

## Natywne Pluginy Codex

Obsługa natywnych Pluginów Codex używa własnych możliwości aplikacji i Plugin
Codex app-server w tym samym wątku Codex co tura harness OpenClaw. OpenClaw nie
tłumaczy Pluginów Codex na syntetyczne narzędzia dynamiczne OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa tylko na sesje, które wybierają natywny harness Codex.
Nie ma wpływu na uruchomienia PI, zwykłe uruchomienia dostawcy OpenAI,
powiązania konwersacji ACP ani inne harnessy.

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
harness Codex albo zastępuje nieaktualne powiązanie wątku Codex. Nie jest
ponownie obliczana przy każdej turze. Po zmianie `codexPlugins` użyj `/new`,
`/reset` albo uruchom ponownie gateway, aby przyszłe sesje harness Codex
startowały ze zaktualizowanym zestawem aplikacji.

Informacje o kwalifikowalności migracji, inwentarzu aplikacji, polityce działań
destrukcyjnych, elicitations i diagnostyce natywnych Pluginów znajdziesz w
[Natywne Pluginy Codex](/pl/plugins/codex-native-plugins).

## Computer Use

Computer Use omówiono w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza jako vendora aplikacji do sterowania pulpitem
ani sam nie wykonuje działań na pulpicie. Przygotowuje Codex app-server,
sprawdza, czy serwer MCP `computer-use` jest dostępny, a następnie pozwala
Codex przejąć natywne wywołania narzędzi MCP podczas tur w trybie Codex.

## Granice środowiska uruchomieniowego

Harness Codex zmienia wyłącznie niskopoziomowy osadzony executor agenta.

- Narzędzia dynamiczne OpenClaw są obsługiwane. Codex prosi OpenClaw o
  wykonanie tych narzędzi, więc OpenClaw pozostaje w ścieżce wykonania.
- Natywne narzędzia shell, patch, MCP i aplikacji Codex należą do Codex.
  OpenClaw może obserwować lub blokować wybrane natywne zdarzenia przez
  obsługiwany przekaźnik, ale nie przepisuje argumentów narzędzi natywnych.
- Codex odpowiada za natywne Compaction. OpenClaw utrzymuje lustrzaną kopię
  transkryptu dla historii kanału, wyszukiwania, `/new`, `/reset` oraz
  przyszłego przełączania modelu lub harnessu.
- Generowanie mediów, rozumienie mediów, TTS, zatwierdzenia i wyjście narzędzi
  komunikacyjnych nadal przechodzą przez odpowiadające im ustawienia
  dostawcy/modelu OpenClaw.
- `tool_result_persist` dotyczy wyników narzędzi transkryptu należących do
  OpenClaw, a nie rekordów wyników narzędzi natywnych Codex.

Informacje o warstwach hooków, obsługiwanych powierzchniach V1, natywnej obsłudze
uprawnień, sterowaniu kolejką, mechanice przesyłania opinii Codex i szczegółach
Compaction znajdziesz w
[Środowisko uruchomieniowe harness Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** to oczekiwane w nowych
konfiguracjach. Wybierz model `openai/gpt-*`, włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** upewnij się, że odwołanie do modelu to
`openai/gpt-*` u oficjalnego dostawcy OpenAI oraz że Plugin Codex jest
zainstalowany i włączony. Jeśli podczas testowania potrzebujesz ścisłego
dowodu, ustaw `agentRuntime.id: "codex"` na poziomie dostawcy lub modelu.
Wymuszone środowisko uruchomieniowe Codex kończy się niepowodzeniem zamiast
wracać do PI.

**Pozostaje starsza konfiguracja `openai-codex/*`:** uruchom
`openclaw doctor --fix`. Doctor przepisuje starsze odwołania do modeli na
`openai/*`, usuwa nieaktualne przypięcia runtime sesji i całego agenta oraz
zachowuje istniejące nadpisania auth-profile.

**App-server jest odrzucany:** użyj Codex app-server `0.125.0` lub nowszego.
Wersje prerelease o tej samej wersji albo wersje z sufiksem build, takie jak
`0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ OpenClaw testuje
stabilne minimum protokołu `0.125.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy dołączony Plugin
`codex` jest włączony, czy `plugins.allow` zawiera go, gdy skonfigurowano listę
dozwolonych, oraz czy niestandardowe `appServer.command`, `url`, `authToken` lub
nagłówki są prawidłowe.

**Wykrywanie modeli jest wolne:** zmniejsz
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie. Zobacz
[Dokumentacja referencyjna harness Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket natychmiast kończy się niepowodzeniem:** sprawdź
`appServer.url`, `authToken`, nagłówki oraz to, czy zdalny app-server mówi tą
samą wersją protokołu Codex app-server.

**Model inny niż Codex używa PI:** to oczekiwane, chyba że polityka runtime
dostawcy lub modelu kieruje go do innego harnessu. Zwykłe odwołania do
dostawców innych niż OpenAI pozostają na swojej normalnej ścieżce dostawcy w
trybie `auto`.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` z nowej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem się
utrzymuje, uruchom ponownie gateway, aby wyczyścić nieaktualne rejestracje
natywnych hooków. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use#troubleshooting).

## Powiązane

- [Dokumentacja referencyjna harness Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe harness Codex](/pl/plugins/codex-harness-runtime)
- [Natywne Pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pluginy harness agentów](/pl/plugins/sdk-agent-harness)
- [Hooki Pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Status](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
