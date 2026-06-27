---
read_when:
    - Chcesz użyć dołączonego mechanizmu testowego app-server Codex
    - Potrzebujesz przykładów konfiguracji środowiska uruchomieniowego Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przełączać się awaryjnie na OpenClaw
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pomocą dołączonego mechanizmu app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-06-27T17:51:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta OpenAI
przez Codex app-server zamiast wbudowanego harnessu OpenClaw.

Użyj harnessu Codex, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
natywnym wznawianiem wątku, natywną kontynuacją narzędzi, natywną compaction oraz
wykonywaniem przez app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modelu,
dynamicznymi narzędziami OpenClaw, zatwierdzeniami, dostarczaniem multimediów oraz widocznym
lustrzanym transkryptem.

Standardowa konfiguracja używa kanonicznych referencji modeli OpenAI, takich jak `openai/gpt-5.5`.
Nie konfiguruj starszych referencji Codex GPT. Umieść kolejność uwierzytelniania agenta OpenAI
pod `auth.order.openai`; starsze identyfikatory profili uwierzytelniania Codex oraz
starsze wpisy kolejności uwierzytelniania Codex są stanem legacy naprawianym przez
`openclaw doctor --fix`.

Gdy nie jest aktywny żaden sandbox OpenClaw, OpenClaw uruchamia wątki Codex app-server
z włączonym natywnym trybem kodu Codex, pozostawiając tryb wyłącznie kodowy domyślnie wyłączony.
Dzięki temu natywny obszar roboczy i możliwości kodowe Codex pozostają dostępne, podczas gdy
dynamiczne narzędzia OpenClaw nadal działają przez most app-server `item/tool/call`.
Aktywne sandboxing OpenClaw i ograniczone zasady narzędzi całkowicie wyłączają natywny tryb kodu,
chyba że włączysz eksperymentalną ścieżkę sandbox exec-server.

Ta natywna funkcja Codex jest oddzielna od
[trybu kodu OpenClaw](/pl/reference/code-mode), który jest opcjonalnym runtime QuickJS-WASI
dla ogólnych uruchomień OpenClaw z innym kształtem wejścia `exec`.

Szerszy podział na model/dostawcę/runtime zacznij od
[Runtime agenta](/pl/concepts/agent-runtimes). W skrócie:
`openai/gpt-5.5` to referencja modelu, `codex` to runtime, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij `codex`.
- Codex app-server `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  plikiem binarnym Codex app-server, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na standardowe uruchamianie harnessu.
- Uwierzytelnianie Codex dostępne przez `openclaw models auth login --provider openai`,
  konto app-server w katalogu domowym Codex agenta albo jawny profil uwierzytelniania
  kluczem API Codex.

Pierwszeństwo uwierzytelniania, izolację środowiska, niestandardowe polecenia app-server, wykrywanie modeli
oraz wszystkie pola konfiguracji opisuje
[referencja harnessu Codex](/pl/plugins/codex-harness-reference).

## Szybki start

Większość użytkowników, którzy chcą używać Codex w OpenClaw, wybiera tę ścieżkę: zaloguj się za pomocą
subskrypcji ChatGPT/Codex, włącz dołączony Plugin `codex` i użyj
kanonicznej referencji modelu `openai/gpt-*`.

Zaloguj się przez OAuth Codex:

```bash
openclaw models auth login --provider openai
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

Po zmianie konfiguracji Plugin zrestartuj gateway. Jeśli istniejący czat ma już
sesję, użyj `/new` lub `/reset` przed testowaniem zmian runtime, aby następna
tura rozwiązała harness z bieżącej konfiguracji.

## Konfiguracja

Konfiguracja z szybkiego startu to minimalna wykonalna konfiguracja harnessu Codex. Ustaw opcje
harnessu Codex w konfiguracji OpenClaw, a CLI używaj tylko do uwierzytelniania Codex:

| Potrzeba                               | Ustaw                                                                            | Gdzie                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Włączenie harnessu                     | `plugins.entries.codex.enabled: true`                                            | Konfiguracja OpenClaw              |
| Zachowanie instalacji Plugin z listy dozwolonych | Uwzględnij `codex` w `plugins.allow`                                             | Konfiguracja OpenClaw              |
| Kierowanie tur agenta OpenAI przez Codex | `agents.defaults.model` lub `agents.list[].model` jako `openai/gpt-*`            | Konfiguracja agenta OpenClaw       |
| Logowanie przez OAuth ChatGPT/Codex    | `openclaw models auth login --provider openai`                                   | Profil uwierzytelniania CLI        |
| Dodanie zapasowego klucza API dla uruchomień Codex | Profil klucza API `openai:*` wymieniony po uwierzytelnianiu subskrypcją w `auth.order.openai` | Profil uwierzytelniania CLI + konfiguracja OpenClaw |
| Fail closed, gdy Codex jest niedostępny | `agentRuntime.id: "codex"` dostawcy lub modelu                                  | Konfiguracja modelu/dostawcy OpenClaw |
| Użycie bezpośredniego ruchu API OpenAI | `agentRuntime.id: "openclaw"` dostawcy lub modelu ze standardowym uwierzytelnianiem OpenAI | Konfiguracja modelu/dostawcy OpenClaw |
| Dostrojenie zachowania app-server      | `plugins.entries.codex.config.appServer.*`                                       | Konfiguracja Plugin Codex          |
| Włączenie natywnych aplikacji Plugin Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Konfiguracja Plugin Codex          |
| Włączenie Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Konfiguracja Plugin Codex          |

Używaj referencji modeli `openai/gpt-*` dla tur agenta OpenAI obsługiwanych przez Codex. Preferuj
`auth.order.openai` dla kolejności: najpierw subskrypcja, zapasowo klucz API. Istniejące
starsze identyfikatory profili uwierzytelniania Codex oraz starsza kolejność uwierzytelniania Codex są stanem legacy
tylko dla doctor; nie zapisuj nowych starszych referencji Codex GPT.

Nie ustawiaj `compaction.model` ani `compaction.provider` dla agentów obsługiwanych przez Codex.
Codex wykonuje compaction przez natywny stan wątku app-server, więc OpenClaw ignoruje
te lokalne nadpisania summarizera w runtime, a `openclaw doctor --fix` usuwa
je, gdy agent używa Codex.

Lossless pozostaje obsługiwany jako silnik kontekstu do składania, pobierania i
utrzymania wokół tur Codex. Skonfiguruj go przez
`plugins.slots.contextEngine: "lossless-claw"` oraz
`plugins.entries.lossless-claw.config.summaryModel`, nie przez
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migruje stary
kształt `compaction.provider: "lossless-claw"` do slotu silnika kontekstu Lossless,
gdy aktywnym runtime jest Codex, ale natywny Codex nadal zarządza compaction.

Natywny harness Codex app-server obsługuje silniki kontekstu, które wymagają
składania pre-prompt. Ogólne backendy CLI, w tym `codex-cli`, nie zapewniają
tej możliwości hosta.

Dla agentów obsługiwanych przez Codex `/compact` uruchamia natywną compaction Codex app-server na
powiązanym wątku. OpenClaw nie czeka na ukończenie, nie narzuca limitu czasu OpenClaw,
nie restartuje współdzielonego app-server ani nie przełącza się awaryjnie na silnik kontekstu lub
publiczny summarizer OpenAI. Jeśli natywne powiązanie wątku Codex jest brakujące lub
nieaktualne, polecenie kończy się fail closed, aby operator widział rzeczywistą granicę runtime,
zamiast po cichu przełączać backendy compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

W tym kształcie oba profile nadal przechodzą przez Codex dla tur agenta `openai/gpt-*`.
Klucz API jest tylko zapasowym uwierzytelnianiem, nie żądaniem przełączenia na OpenClaw lub
zwykłe OpenAI Responses.

Pozostała część tej strony opisuje typowe warianty, między którymi użytkownicy muszą wybrać:
kształt wdrożenia, routing fail-closed, zasady zatwierdzania opiekuna, natywne
pluginy Codex oraz Computer Use. Pełne listy opcji, wartości domyślne, enumy, wykrywanie,
izolację środowiska, limity czasu i pola transportu app-server opisuje
[referencja harnessu Codex](/pl/plugins/codex-harness-reference).

## Weryfikacja runtime Codex

Użyj `/status` na czacie, na którym oczekujesz Codex. Tura agenta OpenAI obsługiwana przez Codex
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
oraz skills. `/codex models` wyświetla katalog live Codex app-server dla
harnessu i konta. Jeśli `/status` jest zaskakujący, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Routing i wybór modelu

Oddziel referencje dostawców od zasad runtime:

- Używaj `openai/gpt-*` dla tur agenta OpenAI przez Codex.
- Nie używaj starszych referencji Codex GPT w konfiguracji. Uruchom `openclaw doctor --fix`, aby
  naprawić starsze referencje i nieaktualne przypięcia tras sesji.
- `agentRuntime.id: "codex"` jest opcjonalne dla standardowego trybu automatycznego OpenAI, ale przydatne,
  gdy wdrożenie powinno kończyć się fail closed, jeśli Codex jest niedostępny.
- `agentRuntime.id: "openclaw"` przełącza dostawcę lub model na osadzony runtime OpenClaw,
  gdy jest to zamierzone.
- `/codex ...` steruje natywnymi rozmowami Codex app-server z czatu.
- ACP/acpx to oddzielna ścieżka zewnętrznego harnessu. Używaj jej tylko wtedy, gdy użytkownik prosi
  o ACP/acpx lub zewnętrzny adapter harnessu.

Typowy routing poleceń:

| Intencja użytkownika                                | Użyj                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Dołącz bieżący czat                                 | `/codex bind [--cwd <path>]`                                                                          |
| Wznów istniejący wątek Codex                        | `/codex resume <thread-id>`                                                                           |
| Wyświetl lub filtruj wątki Codex                    | `/codex threads [filter]`                                                                             |
| Wyświetl natywne pluginy Codex                      | `/codex plugins list`                                                                                 |
| Włącz lub wyłącz skonfigurowany natywny Plugin Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Dołącz istniejącą sesję Codex CLI na sparowanym węźle | `/codex sessions --host <node> [filter]`, potem `/codex resume <session-id> --host <node> --bind here` |
| Wyślij tylko opinię Codex                           | `/codex diagnostics [note]`                                                                           |
| Uruchom zadanie ACP/acpx                            | Polecenia sesji ACP/acpx, nie `/codex`                                                               |

| Przypadek użycia                                     | Konfiguracja                                                          | Weryfikacja                             | Uwagi                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-*` oraz włączony Plugin `codex`                            | `/status` pokazuje `Runtime: OpenAI Codex` | Zalecana ścieżka                     |
| Zakończ błędem w trybie fail-closed, jeśli Codex jest niedostępny | Dostawca lub model `agentRuntime.id: "codex"`                          | Tura kończy się błędem zamiast osadzonego fallbacku | Używaj dla wdrożeń wyłącznie z Codex |
| Bezpośredni ruch z kluczem API OpenAI przez OpenClaw | Dostawca lub model `agentRuntime.id: "openclaw"` i zwykłe uwierzytelnianie OpenAI | `/status` pokazuje środowisko uruchomieniowe OpenClaw | Używaj tylko wtedy, gdy OpenClaw jest zamierzony |
| Starsza konfiguracja                                 | starsze referencje GPT Codex                                           | `openclaw doctor --fix` przepisuje ją   | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter ACP/acpx Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | Status zadania/sesji ACP                | Oddzielne od natywnego harnessu Codex |

`agents.defaults.imageModel` stosuje ten sam podział według prefiksu. Użyj `openai/gpt-*`
dla normalnej ścieżki OpenAI oraz `codex/gpt-*` tylko wtedy, gdy rozumienie obrazów
ma działać przez ograniczoną turę serwera aplikacji Codex. Nie używaj
starszych referencji GPT Codex; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.

## Wzorce wdrożenia

### Podstawowe wdrożenie Codex

Użyj konfiguracji quickstart, gdy wszystkie tury agentów OpenAI mają domyślnie
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

### Wdrożenie z mieszanym dostawcą

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

Przy tej konfiguracji agent `main` używa swojej normalnej ścieżki dostawcy, a
agent `codex` używa serwera aplikacji Codex.

### Wdrożenie Codex w trybie fail-closed

Dla tur agentów OpenAI `openai/gpt-*` już rozwiązuje się do Codex, gdy
dołączony Plugin jest dostępny. Dodaj jawną politykę środowiska uruchomieniowego,
gdy chcesz zapisać regułę fail-closed:

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

Gdy Codex jest wymuszony, OpenClaw wcześnie kończy się błędem, jeśli Plugin Codex
jest wyłączony, serwer aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić.

## Polityka serwera aplikacji

Domyślnie Plugin uruchamia lokalnie zarządzany przez OpenClaw plik binarny Codex
z transportem stdio. Ustaw `appServer.command` tylko wtedy, gdy celowo chcesz
uruchomić inny plik wykonywalny. Używaj transportu WebSocket tylko wtedy, gdy
serwer aplikacji działa już gdzie indziej:

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

Lokalne sesje serwera aplikacji stdio domyślnie używają postawy zaufanego
lokalnego operatora: `approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie pozwalają na
tę niejawną postawę YOLO, OpenClaw wybiera zamiast tego dozwolone uprawnienia
guardian. Gdy sandbox OpenClaw jest aktywny dla sesji, OpenClaw wyłącza natywny
Code Mode Codex, serwery MCP użytkownika oraz wykonywanie Pluginów wspieranych
przez aplikację dla tej tury, zamiast polegać na sandboxingu po stronie hosta
Codex. Dostęp do powłoki jest udostępniany przez dynamiczne narzędzia wspierane
sandboxem OpenClaw, takie jak `sandbox_exec` i `sandbox_process`, gdy normalne
narzędzia exec/process są dostępne.

Użyj znormalizowanego trybu exec OpenClaw, gdy chcesz natywnej automatycznej
recenzji Codex przed wyjściem poza sandbox lub dodatkowymi uprawnieniami:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Dla sesji serwera aplikacji Codex OpenClaw mapuje `tools.exec.mode: "auto"` na
zatwierdzenia sprawdzane przez Codex Guardian, zwykle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` oraz
`sandbox: "workspace-write"`, gdy lokalne wymagania dopuszczają te wartości.
W `tools.exec.mode: "auto"` OpenClaw nie zachowuje starszych niebezpiecznych
nadpisań Codex `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`; użyj
`tools.exec.mode: "full"` dla celowej postawy Codex bez zatwierdzeń. Starszy
preset `plugins.entries.codex.config.appServer.mode: "guardian"` nadal działa,
ale `tools.exec.mode: "auto"` jest znormalizowaną powierzchnią OpenClaw.

Porównanie na poziomie trybów z zatwierdzeniami exec hosta i uprawnieniami ACPX
znajdziesz w [Tryby uprawnień](/pl/tools/permission-modes).

Opis każdego pola serwera aplikacji, kolejności uwierzytelniania, izolacji
środowiska, wykrywania i zachowania limitów czasu znajdziesz w
[Referencji harnessu Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Dołączony Plugin rejestruje `/codex` jako polecenie ukośnikowe na każdym kanale,
który obsługuje polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` sprawdza łączność z serwerem aplikacji, modele, konto, limity
  szybkości, serwery MCP i Skills.
- `/codex models` wyświetla modele aktywnego serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki serwera aplikacji Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego
  wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywną recenzję Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii Codex dla
  dołączonego wątku.
- `/codex account` pokazuje status konta i limitów szybkości.
- `/codex mcp` wyświetla status serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

W przypadku większości zgłoszeń wsparcia zacznij od `/diagnostics [note]` w rozmowie,
w której wystąpił błąd. Tworzy to jeden raport diagnostyczny Gateway i, dla sesji
harnessu Codex, prosi o zgodę na wysłanie odpowiedniego pakietu opinii Codex.
Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać model prywatności
i zachowanie czatu grupowego.

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego
Gateway.

### Lokalna inspekcja wątków Codex

Najszybszym sposobem sprawdzenia nieudanego uruchomienia Codex często jest
bezpośrednie otwarcie natywnego wątku Codex:

```bash
codex resume <thread-id>
```

Pobierz identyfikator wątku z ukończonej odpowiedzi `/diagnostics`, `/codex binding`
albo `/codex threads [filter]`.

Mechanikę przesyłania i granice diagnostyki na poziomie środowiska uruchomieniowego
opisuje [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

Uwierzytelnianie jest wybierane w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej pod
   `auth.order.openai`. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
   identyfikatory profili uwierzytelniania Codex i starszą kolejność uwierzytelniania Codex.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie
   OpenAI nadal jest wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT,
usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z utworzonego procesu potomnego Codex.
Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla embeddings lub
bezpośrednich modeli OpenAI, bez przypadkowego rozliczania natywnych tur serwera
aplikacji Codex przez API. Jawne profile klucza API Codex i lokalny fallback
klucza środowiskowego stdio używają logowania serwera aplikacji zamiast
dziedziczonego środowiska procesu potomnego. Połączenia WebSocket z serwerem
aplikacji nie otrzymują fallbacku klucza API ze środowiska Gateway; użyj jawnego
profilu uwierzytelniania albo własnego konta zdalnego serwera aplikacji.
Gdy skonfigurowane są natywne Pluginy Codex, OpenClaw instaluje lub odświeża te
Pluginy przez połączony serwer aplikacji przed udostępnieniem aplikacji
należących do Pluginów wątkowi Codex. `app/list` pozostaje źródłem prawdy dla
identyfikatorów aplikacji, dostępności i metadanych, ale OpenClaw odpowiada za
decyzję włączenia per wątek: jeśli polityka pozwala na wymienioną dostępną
aplikację, OpenClaw wysyła `thread/start.config.apps[appId].enabled = true`, nawet
gdy `app/list` obecnie zgłasza tę aplikację jako wyłączoną. Ta ścieżka nie tworzy
instalacji aplikacji dla nieznanych identyfikatorów; OpenClaw aktywuje tylko
Pluginy z marketplace za pomocą `plugin/install`, a następnie odświeża inwentarz.

Jeśli profil subskrypcji osiągnie limit użycia Codex, OpenClaw zapisuje czas
resetu, gdy Codex go zgłasza, i próbuje następnego uporządkowanego profilu
uwierzytelniania dla tego samego uruchomienia Codex. Gdy czas resetu minie,
profil subskrypcji znów staje się kwalifikowalny bez zmiany wybranego modelu
`openai/gpt-*` ani środowiska uruchomieniowego Codex.

Dla lokalnych uruchomień serwera aplikacji stdio OpenClaw ustawia `CODEX_HOME` na
katalog per agent, aby konfiguracja Codex, pliki uwierzytelniania/konta, cache/dane
Pluginów i natywny stan wątku domyślnie nie odczytywały ani nie zapisywały
osobistego `~/.codex` operatora. OpenClaw zachowuje normalny procesowy `HOME`;
podprocesy uruchamiane przez Codex nadal mogą znaleźć konfigurację i tokeny
katalogu domowego użytkownika, a Codex może wykrywać współdzielone wpisy
`$HOME/.agents/skills` i `$HOME/.agents/plugins/marketplace.json`.

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

`appServer.clearEnv` wpływa tylko na utworzony proces potomny serwera aplikacji
Codex. OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji
lokalnego uruchomienia: `CODEX_HOME` pozostaje per agent, a `HOME` pozostaje
dziedziczony, aby podprocesy mogły używać normalnego stanu katalogu domowego
użytkownika.

Dynamiczne narzędzia Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
dynamicznych narzędzi, które duplikują natywne operacje Codex na obszarze roboczym: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` i `update_plan`. Większość pozostałych
narzędzi integracyjnych OpenClaw, takich jak messaging, media, cron, browser, nodes,
gateway i `heartbeat_respond`, jest dostępna przez wyszukiwanie narzędzi Codex w przestrzeni nazw
`openclaw`, dzięki czemu początkowy kontekst modelu jest mniejszy. Wyszukiwanie w sieci
domyślnie używa hostowanego narzędzia Codex `web_search`, gdy wyszukiwanie jest włączone i nie
wybrano zarządzanego dostawcy. Natywne hostowane wyszukiwanie i zarządzane przez OpenClaw
dynamiczne narzędzie `web_search` wzajemnie się wykluczają, aby zarządzane wyszukiwanie nie mogło omijać
natywnych ograniczeń domen. OpenClaw używa zarządzanego narzędzia, gdy hostowane wyszukiwanie jest
niedostępne, jawnie wyłączone albo zastąpione przez wybranego zarządzanego dostawcę.
OpenClaw pozostawia samodzielne rozszerzenie Codex `web.run` wyłączone, ponieważ
ruch produkcyjnego serwera aplikacji odrzuca jego zdefiniowaną przez użytkownika przestrzeń nazw `web`.
`tools.web.search.enabled: false` wyłącza obie ścieżki, podobnie jak uruchomienia tylko LLM
z wyłączonymi narzędziami. Codex traktuje `"cached"` jako preferencję i rozwiązuje ją do
aktywnego dostępu zewnętrznego dla nieograniczonych tur serwera aplikacji. Automatyczny zarządzany fallback
kończy się bezpiecznie niepowodzeniem, gdy ustawione są natywne `allowedDomains`, aby nie można było ominąć
listy dozwolonych. Trwałe efektywne zmiany zasad wyszukiwania rotują powiązany wątek Codex
przed następną turą. Tymczasowe ograniczenia dla pojedynczej tury używają tymczasowego
ograniczonego wątku i zachowują istniejące powiązanie do późniejszego wznowienia.
`sessions_yield` oraz odpowiedzi źródłowe tylko z narzędzia wiadomości pozostają bezpośrednie, ponieważ
są to kontrakty sterowania turą. `sessions_spawn` pozostaje wyszukiwalne, aby natywne
`spawn_agent` Codex pozostało podstawową powierzchnią podagentów Codex, a jawna
delegacja OpenClaw lub ACP nadal była dostępna przez przestrzeń nazw dynamicznych narzędzi
`openclaw`. Instrukcje współpracy Heartbeat każą Codex wyszukać
`heartbeat_respond` przed zakończeniem tury Heartbeat, gdy narzędzie nie jest jeszcze
załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym serwerem aplikacji Codex,
który nie potrafi wyszukiwać odroczonych dynamicznych narzędzi, albo podczas debugowania pełnego
ładunku narzędzi.

Obsługiwane pola najwyższego poziomu Plugin Codex:

| Pole                       | Domyślnie      | Znaczenie                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić dynamiczne narzędzia OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy dynamicznych narzędzi OpenClaw do pominięcia w turach serwera aplikacji Codex. |
| `codexPlugins`             | wyłączone      | Natywna obsługa pluginów/aplikacji Codex dla migrowanych, instalowanych ze źródła kuratorowanych pluginów. |

Obsługiwane pola `appServer`:

| Pole                                          | Domyślnie                                             | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                                                                     |
| `command`                                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko w celu jawnego nadpisania.                                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | nieustawione                                          | Adres URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | nieustawione                                          | Token Bearer dla transportu WebSocket. Akceptuje literał ciągu znaków lub SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                  | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują literały ciągów znaków lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                        |
| `clearEnv`                                    | `[]`                                                  | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-server stdio po tym, jak OpenClaw zbuduje odziedziczone środowisko. OpenClaw zachowuje `CODEX_HOME` dla każdego agenta i odziedziczone `HOME` dla lokalnych uruchomień.                                                                                                                                          |
| `codeModeOnly`                                | `false`                                               | Włącza powierzchnię narzędzi Codex wyłącznie w trybie kodu. Narzędzia dynamiczne OpenClaw pozostają zarejestrowane w Codex, aby zagnieżdżone wywołania `tools.*` wracały przez most app-server `item/tool/call`.                                                                                                                                                                                 |
| `remoteWorkspaceRoot`                         | nieustawione                                          | Zdalny katalog główny obszaru roboczego app-server Codex. Gdy jest ustawiony, OpenClaw wywnioskuje lokalny katalog główny obszaru roboczego z rozwiązanego obszaru roboczego OpenClaw, zachowa bieżący sufiks cwd pod tym zdalnym katalogiem głównym i wyśle do Codex tylko końcowy cwd app-server. Jeśli cwd znajduje się poza rozwiązanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw odmawia działania zamiast wysyłać lokalną dla Gateway ścieżkę do zdalnego app-server. |
| `requestTimeoutMs`                            | `60000`                                               | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Okno ciszy po zaakceptowaniu tury przez Codex lub po żądaniu app-server w zakresie tury, gdy OpenClaw czeka na `turn/completed`.                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Strażnik bezczynności ukończenia i postępu używany po przekazaniu narzędzia, ukończeniu narzędzia natywnego, postępie surowej odpowiedzi asystenta po narzędziu, ukończeniu surowego rozumowania lub postępie rozumowania, gdy OpenClaw czeka na `turn/completed`. Użyj tego dla zaufanych lub ciężkich zadań, w których synteza po narzędziu może zasadnie pozostawać cicha dłużej niż końcowy budżet wydania odpowiedzi asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex zabraniają YOLO | Ustawienie wstępne dla wykonania YOLO lub wykonania z recenzją guardian. Lokalne wymagania stdio, które pomijają zatwierdzenie `danger-full-access`, `never` lub recenzenta `user`, sprawiają, że niejawną wartością domyślną jest guardian.                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` lub dozwolona polityka zatwierdzania guardian | Natywna polityka zatwierdzania Codex wysyłana przy uruchomieniu/wznowieniu wątku/tury. Domyślne ustawienia guardian preferują `"on-request"`, gdy jest dozwolone.                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` lub dozwolony sandbox guardian | Natywny tryb sandbox Codex wysyłany przy uruchomieniu/wznowieniu wątku. Domyślne ustawienia guardian preferują `"workspace-write"`, gdy jest dozwolone, w przeciwnym razie `"read-only"`. Gdy sandbox OpenClaw jest aktywny, tury `danger-full-access` używają Codex `workspace-write` z dostępem sieciowym wyprowadzonym z ustawienia ruchu wychodzącego sandbox OpenClaw.                         |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent guardian             | Użyj `"auto_review"`, aby pozwolić Codex recenzować natywne monity zatwierdzania, gdy jest to dozwolone; w przeciwnym razie użyj `guardian_subagent` lub `user`. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                                                                                 |
| `serviceTier`                                 | nieustawione                                          | Opcjonalna warstwa usługi app-server Codex. `"priority"` włącza trasowanie w trybie szybkim, `"flex"` żąda przetwarzania flex, `null` czyści nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                                  |
| `networkProxy`                                | wyłączone                                             | Włącza sieć profilu uprawnień Codex dla poleceń app-server. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją za pomocą `default_permissions` zamiast wysyłać `sandbox`.                                                                                                                                                                                      |
| `experimental.sandboxExecServer`              | `false`                                               | Eksperymentalne włączenie podglądu, które rejestruje w Codex środowisko Codex oparte na sandbox OpenClaw z app-server 0.132.0 lub nowszym, aby natywne wykonanie Codex mogło działać wewnątrz aktywnego sandbox OpenClaw.                                                                                                                                                                        |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt sandbox Codex.
Po włączeniu OpenClaw ustawia także `features.network_proxy.enabled` i
`default_permissions` w konfiguracji wątku Codex, aby wygenerowany profil
uprawnień mógł uruchomić zarządzaną przez Codex obsługę sieci. Domyślnie
OpenClaw generuje odporną na kolizje nazwę profilu
`openclaw-network-<fingerprint>` z treści profilu; używaj `profileName` tylko
wtedy, gdy wymagana jest stabilna nazwa lokalna.

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
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
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

Jeśli normalne środowisko uruchomieniowe app-server miałoby wartość
`danger-full-access`, włączenie `networkProxy` używa dostępu do systemu plików
w stylu obszaru roboczego dla wygenerowanego profilu uprawnień. Zarządzane
przez Codex egzekwowanie sieci to sieć w sandbox, więc profil z pełnym dostępem
nie chroniłby ruchu wychodzącego.
Wpisy domen używają `allow` lub `deny`; wpisy gniazd Unix używają wartości
Codex `allow` lub `none`.

Wywołania dynamicznych narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie używają 90-sekundowego
watchdoga OpenClaw. Dodatni argument `timeoutMs` dla pojedynczego wywołania wydłuża
lub skraca budżet tego konkretnego narzędzia. Narzędzie `image_generate` używa
`agents.defaults.imageGenerationModel.timeoutMs`, gdy wywołanie narzędzia nie
podaje własnego limitu czasu, albo w przeciwnym razie 120-sekundowej wartości domyślnej
generowania obrazów. Narzędzie rozumienia mediów `image` używa
`tools.media.image.timeoutSeconds` albo swojej 60-sekundowej wartości domyślnej dla mediów.
W przypadku rozumienia obrazów ten limit czasu dotyczy samego żądania i nie jest
pomniejszany przez wcześniejsze prace przygotowawcze. Budżety narzędzi dynamicznych są
ograniczone do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia
tam, gdzie jest to obsługiwane, i zwraca do Codex nieudaną odpowiedź narzędzia dynamicznego, aby tura
mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.
Ten watchdog jest zewnętrznym budżetem dynamicznego `item/tool/call`; limity czasu żądań
specyficzne dla dostawcy działają wewnątrz tego wywołania i zachowują własną semantykę limitów czasu.

Po zaakceptowaniu tury przez Codex oraz po odpowiedzi OpenClaw na żądanie app-server
ograniczone do tury, harness oczekuje, że Codex wykona postęp w bieżącej turze i
ostatecznie zakończy natywną turę przez `turn/completed`. Jeśli app-server zamilknie
na `appServer.turnCompletionIdleTimeoutMs`, OpenClaw w trybie best-effort
przerywa turę Codex, zapisuje diagnostyczne przekroczenie limitu czasu i zwalnia pas
sesji OpenClaw, aby kolejne wiadomości czatu nie czekały za przestarzałą
natywną turą. Większość nieterminalnych powiadomień dla tej samej tury rozbraja ten krótki
watchdog, ponieważ Codex potwierdził, że tura nadal żyje. Przekazania narzędzi używają
dłuższego budżetu bezczynności po narzędziu: po zwróceniu przez OpenClaw odpowiedzi
`item/tool/call`, po zakończeniu natywnych elementów narzędzi takich jak `commandExecution`, po surowych
zakończeniach `custom_tool_call_output` oraz po surowym postępie asystenta
po narzędziu, zakończeniach rozumowania lub postępie rozumowania. Zabezpieczenie używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, gdy jest skonfigurowane, a w przeciwnym razie
domyślnie pięciu minut. Ten sam budżet po narzędziu wydłuża również
watchdog postępu dla cichego okna syntezy, zanim Codex wyemituje następne
zdarzenie bieżącej tury. Globalne powiadomienia app-server, takie jak aktualizacje limitów szybkości,
nie resetują postępu bezczynności tury. Zakończenia rozumowania, zakończenia
`agentMessage` w komentarzu oraz surowy postęp rozumowania lub asystenta przed narzędziem mogą
zostać zakończone automatyczną odpowiedzią końcową, więc używają zabezpieczenia odpowiedzi
po postępie zamiast natychmiast zwalniać pas sesji. Tylko
końcowe/niekomentarzowe ukończone elementy `agentMessage` i surowe
zakończenia asystenta przed narzędziem uzbrajają zwolnienie po wyjściu asystenta: jeśli Codex następnie zamilknie
bez `turn/completed`, OpenClaw w trybie best-effort przerywa natywną turę i
zwalnia pas sesji. Bezpieczne do odtworzenia awarie app-server stdio, w tym
limity bezczynności zakończenia tury bez dowodów asystenta, narzędzia, aktywnego elementu lub
efektu ubocznego, są ponawiane raz przy świeżej próbie app-server. Niebezpieczne
limity czasu nadal wycofują zablokowanego klienta app-server i zwalniają pas sesji OpenClaw.
Czyszczą też przestarzałe powiązanie natywnego wątku zamiast automatycznie je
odtwarzać. Limity czasu obserwacji zakończenia pokazują tekst limitu czasu specyficzny dla Codex:
przypadki bezpieczne do odtworzenia mówią, że odpowiedź może być niekompletna, a przypadki niebezpieczne
instruują użytkownika, aby zweryfikował bieżący stan przed ponowną próbą. Publiczna diagnostyka limitów czasu
zawiera pola strukturalne, takie jak ostatnia metoda powiadomienia app-server,
identyfikator/typ/rola surowego elementu odpowiedzi asystenta, liczba aktywnych żądań/elementów oraz uzbrojony
stan obserwacji. Gdy ostatnim powiadomieniem jest surowy element odpowiedzi asystenta,
zawiera także ograniczony podgląd tekstu asystenta. Nie zawiera surowego promptu ani
treści narzędzi.

Nadpisania środowiskowe pozostają dostępne do testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych. Konfiguracja jest
preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie pluginu w tym
samym sprawdzanym pliku co reszta konfiguracji harness Codex.

## Natywne pluginy Codex

Obsługa natywnych pluginów Codex używa własnych możliwości aplikacji i pluginów
app-server Codex w tym samym wątku Codex co tura harness OpenClaw. OpenClaw
nie tłumaczy pluginów Codex na syntetyczne narzędzia dynamiczne OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa tylko na sesje, które wybierają natywny harness Codex. Nie
ma wpływu na uruchomienia wbudowanego harness, normalne uruchomienia dostawcy OpenAI, powiązania rozmów ACP
ani inne harnessy.

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

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję harness Codex
albo zastępuje przestarzałe powiązanie wątku Codex. Nie jest przeliczana przy każdej turze.
Po zmianie `codexPlugins` użyj `/new`, `/reset` albo uruchom ponownie gateway, aby
przyszłe sesje harness Codex startowały ze zaktualizowanym zestawem aplikacji.

Informacje o kwalifikacji do migracji, inwentarzu aplikacji, polityce działań destrukcyjnych,
elicitation i diagnostyce natywnych pluginów znajdziesz w
[Natywne pluginy Codex](/pl/plugins/codex-native-plugins).

Dostęp do aplikacji i pluginów po stronie OpenAI jest kontrolowany przez zalogowane konto Codex
oraz, w przypadku przestrzeni roboczych Business i Enterprise/Edu, przez kontrolki aplikacji w przestrzeni roboczej. Zobacz
[Używanie Codex z planem ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan),
aby zapoznać się z omówieniem konta i kontroli przestrzeni roboczej OpenAI.

## Computer Use

Computer Use opisano w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza w pakiecie aplikacji sterowania pulpitem ani sam nie wykonuje
działań na pulpicie. Przygotowuje app-server Codex, weryfikuje, że serwer MCP
`computer-use` jest dostępny, a następnie pozwala Codex przejąć natywne wywołania
narzędzi MCP podczas tur w trybie Codex.

## Granice runtime

Harness Codex zmienia wyłącznie niskopoziomowy osadzony executor agenta.

- Narzędzia dynamiczne OpenClaw są obsługiwane. Codex prosi OpenClaw o wykonanie tych
  narzędzi, więc OpenClaw pozostaje w ścieżce wykonania.
- Natywne narzędzia powłoki, patch, MCP i natywnych aplikacji Codex należą do Codex.
  OpenClaw może obserwować lub blokować wybrane natywne zdarzenia przez obsługiwany
  relay, ale nie przepisuje argumentów natywnych narzędzi.
- Codex jest właścicielem natywnego Compaction. OpenClaw utrzymuje lustrzaną kopię transkryptu dla historii
  kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub harness,
  ale nie zastępuje Compaction Codex podsumowywaniem OpenClaw ani context-engine.
- Generowanie mediów, rozumienie mediów, TTS, zatwierdzenia i wyjście narzędzia wiadomości
  nadal przechodzą przez odpowiadające ustawienia dostawcy/modelu OpenClaw.
- `tool_result_persist` dotyczy wyników narzędzi transkryptu należących do OpenClaw, a nie
  rekordów wyników narzędzi natywnych Codex.

Informacje o warstwach hooków, obsługiwanych powierzchniach V1, obsłudze natywnych uprawnień, sterowaniu
kolejką, mechanice przesyłania opinii Codex i szczegółach Compaction znajdziesz w
[Runtime harness Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie pojawia się jako normalny dostawca `/model`:** to oczekiwane w przypadku
nowych konfiguracji. Wybierz model `openai/gpt-*`, włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa wbudowanego harness zamiast Codex:** upewnij się, że referencja modelu to
`openai/gpt-*` u oficjalnego dostawcy OpenAI oraz że plugin Codex jest
zainstalowany i włączony. Jeśli podczas testów potrzebujesz ścisłego dowodu, ustaw u dostawcy lub
modelu `agentRuntime.id: "codex"`. Wymuszony runtime Codex kończy się niepowodzeniem zamiast
wracać do OpenClaw.

**Runtime OpenAI Codex wraca do ścieżki klucza API:** zbierz zredagowany
fragment gateway, który pokazuje model, runtime, wybranego dostawcę i błąd.
Poproś dotkniętych współpracowników o uruchomienie tego polecenia tylko do odczytu na ich hoście OpenClaw:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Przydatne fragmenty zwykle zawierają `openai/gpt-5.5` albo `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` albo `harnessRuntime`,
`candidateProvider: "openai"` oraz wynik `401`, `Incorrect API key` albo
`No API key`. Poprawione uruchomienie powinno pokazywać ścieżkę OpenAI OAuth
zamiast zwykłej awarii klucza API OpenAI.

**Pozostaje konfiguracja starszych referencji modeli Codex:** uruchom `openclaw doctor --fix`.
Doctor przepisuje starsze referencje modeli na `openai/*`, usuwa przestarzałe przypięcia runtime sesji i
całego agenta oraz zachowuje istniejące nadpisania profilu uwierzytelniania.

**App-server jest odrzucany:** użyj app-server Codex `0.125.0` lub nowszego.
Wersje prerelease o tej samej wersji albo wersje z sufiksem kompilacji, takie jak
`0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ OpenClaw sprawdza
stabilne minimum protokołu `0.125.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy dołączony plugin `codex` jest
włączony, czy `plugins.allow` zawiera go, gdy skonfigurowano listę dozwolonych, oraz
czy dowolne niestandardowe `appServer.command`, `url`, `authToken` lub nagłówki są poprawne.

**Odkrywanie modeli jest wolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz odkrywanie. Zobacz
[Referencja harness Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket natychmiast zawodzi:** sprawdź `appServer.url`, `authToken`,
nagłówki oraz to, czy zdalny app-server mówi tą samą wersją protokołu app-server Codex.

**Natywne narzędzia powłoki lub patch są blokowane z komunikatem `Native hook relay unavailable`:**
wątek Codex nadal próbuje użyć natywnego identyfikatora relay hooka, którego OpenClaw nie
ma już zarejestrowanego. To problem natywnego transportu hooków Codex, a nie awaria backendu ACP,
dostawcy, GitHub ani polecenia powłoki. Rozpocznij świeżą sesję w
dotkniętym czacie przez `/new` lub `/reset`, a następnie ponów nieszkodliwe polecenie. Jeśli to
zadziała raz, ale następne natywne wywołanie narzędzia znowu zawiedzie, traktuj `/new` tylko jako tymczasowe
obejście: skopiuj prompt do świeżej sesji po ponownym uruchomieniu app-server Codex
lub OpenClaw Gateway, aby stare wątki zostały porzucone, a natywne rejestracje hooków
utworzone ponownie.

**Model inny niż Codex używa wbudowanego harness:** to oczekiwane, chyba że
polityka runtime dostawcy lub modelu kieruje go do innego harness. Zwykłe referencje dostawców spoza OpenAI
pozostają na swojej normalnej ścieżce dostawcy w trybie `auto`.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` w nowej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj powyższej procedury odzyskiwania natywnego przekaźnika hooków. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use#troubleshooting).

## Powiązane

- [Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko wykonawcze harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pomoc OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Hooki pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Status](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
