---
read_when:
    - Chcesz użyć dołączonego harnessa app-server Codex
    - Potrzebujesz przykładów konfiguracji harnessa Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przełączać się awaryjnie na OpenClaw
summary: Uruchamiaj tury wbudowanego agenta OpenClaw za pomocą dołączonego mechanizmu serwera aplikacji Codex
title: Uprząż Codex
x-i18n:
    generated_at: "2026-07-03T17:45:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agentów OpenAI
przez Codex app-server zamiast wbudowanego mechanizmu OpenClaw.

Używaj mechanizmu Codex, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
natywnym wznawianiem wątku, natywną kontynuacją narzędzi, natywną Compaction oraz
wykonywaniem w app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modelu,
dynamicznymi narzędziami OpenClaw, zatwierdzeniami, dostarczaniem multimediów oraz widocznym
lustrem transkrypcji.

Standardowa konfiguracja używa kanonicznych referencji modeli OpenAI, takich jak `openai/gpt-5.5`.
Nie konfiguruj starszych referencji GPT Codex. Umieść kolejność uwierzytelniania agenta OpenAI
pod `auth.order.openai`; starsze identyfikatory profili uwierzytelniania Codex oraz
starsze wpisy kolejności uwierzytelniania Codex są stanem legacy naprawianym przez
`openclaw doctor --fix`.

Gdy nie jest aktywna żadna piaskownica OpenClaw, OpenClaw uruchamia wątki Codex app-server
z włączonym natywnym trybem kodu Codex, pozostawiając domyślnie wyłączony tryb tylko kodowy.
Dzięki temu natywny obszar roboczy Codex i możliwości kodowania pozostają dostępne, a
dynamiczne narzędzia OpenClaw nadal działają przez most `item/tool/call` app-server.
Aktywna piaskownica OpenClaw oraz ograniczone zasady narzędzi całkowicie wyłączają natywny tryb kodu,
chyba że włączysz eksperymentalną ścieżkę exec-server piaskownicy.

Ta natywna funkcja Codex jest oddzielna od
[trybu kodu OpenClaw](/pl/reference/code-mode), który jest opcjonalnym środowiskiem QuickJS-WASI
dla ogólnych uruchomień OpenClaw z innym kształtem wejścia `exec`.

Szerszy podział na model/dostawcę/środowisko uruchomieniowe zacznij od
[Środowisk uruchomieniowych agentów](/pl/concepts/agent-runtimes). Krótka wersja:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij `codex`.
- Codex app-server `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarium Codex app-server, więc lokalne polecenia `codex` w `PATH` nie wpływają
  na normalne uruchamianie mechanizmu.
- Uwierzytelnianie Codex dostępne przez `openclaw models auth login --provider openai`,
  konto app-server w katalogu domowym Codex agenta albo jawny profil uwierzytelniania
  Codex z kluczem API.

Pierwszeństwo uwierzytelniania, izolację środowiska, niestandardowe polecenia app-server, wykrywanie modeli
oraz wszystkie pola konfiguracji opisuje
[Referencja mechanizmu Codex](/pl/plugins/codex-harness-reference).

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

Jeśli Twoja konfiguracja używa `plugins.allow`, dodaj tam także `codex`:

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
sesję, użyj `/new` lub `/reset` przed testowaniem zmian środowiska uruchomieniowego, aby następna
tura rozwiązała mechanizm z bieżącej konfiguracji.

## Konfiguracja

Konfiguracja ze szybkiego startu to minimalna działająca konfiguracja mechanizmu Codex. Ustaw opcje
mechanizmu Codex w konfiguracji OpenClaw, a CLI używaj tylko do uwierzytelniania Codex:

| Potrzeba                               | Ustaw                                                                            | Gdzie                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Włączenie mechanizmu                   | `plugins.entries.codex.enabled: true`                                            | Konfiguracja OpenClaw              |
| Zachowanie instalacji Plugin z listą dozwolonych | Uwzględnij `codex` w `plugins.allow`                                             | Konfiguracja OpenClaw              |
| Kierowanie tur agenta OpenAI przez Codex | `agents.defaults.model` lub `agents.list[].model` jako `openai/gpt-*`            | Konfiguracja agenta OpenClaw       |
| Logowanie przez OAuth ChatGPT/Codex    | `openclaw models auth login --provider openai`                                   | Profil uwierzytelniania CLI        |
| Dodanie zapasowego klucza API dla uruchomień Codex | Profil klucza API `openai:*` wymieniony po uwierzytelnianiu subskrypcyjnym w `auth.order.openai` | Profil uwierzytelniania CLI + konfiguracja OpenClaw |
| Zamykanie z błędem, gdy Codex jest niedostępny | `agentRuntime.id: "codex"` dostawcy lub modelu                                  | Konfiguracja modelu/dostawcy OpenClaw |
| Użycie bezpośredniego ruchu API OpenAI | `agentRuntime.id: "openclaw"` dostawcy lub modelu ze standardowym uwierzytelnianiem OpenAI | Konfiguracja modelu/dostawcy OpenClaw |
| Dostrajanie zachowania app-server      | `plugins.entries.codex.config.appServer.*`                                       | Konfiguracja Plugin Codex          |
| Włączenie natywnych aplikacji Plugin Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Konfiguracja Plugin Codex          |
| Włączenie Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Konfiguracja Plugin Codex          |

Używaj referencji modeli `openai/gpt-*` dla tur agentów OpenAI obsługiwanych przez Codex. Preferuj
`auth.order.openai` dla kolejności: najpierw subskrypcja, potem zapasowy klucz API. Istniejące
starsze identyfikatory profili uwierzytelniania Codex oraz starsza kolejność uwierzytelniania Codex to
stan legacy wyłącznie dla narzędzia doctor; nie zapisuj nowych starszych referencji GPT Codex.

Nie ustawiaj `compaction.model` ani `compaction.provider` dla agentów obsługiwanych przez Codex.
Codex kompaktuje przez swój natywny stan wątku app-server, więc OpenClaw ignoruje
te lokalne nadpisania podsumowywania w czasie działania, a `openclaw doctor --fix` usuwa
je, gdy agent używa Codex.

Lossless pozostaje obsługiwany jako silnik kontekstu do składania, pobierania i
utrzymania wokół tur Codex. Skonfiguruj go przez
`plugins.slots.contextEngine: "lossless-claw"` oraz
`plugins.entries.lossless-claw.config.summaryModel`, a nie przez
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migruje stary
kształt `compaction.provider: "lossless-claw"` do slotu silnika kontekstu Lossless,
gdy Codex jest aktywnym środowiskiem uruchomieniowym, ale natywny Codex nadal zarządza Compaction.

Natywny mechanizm Codex app-server obsługuje silniki kontekstu, które wymagają
składania przed promptem. Ogólne backendy CLI, w tym `codex-cli`, nie zapewniają
tej możliwości hosta.

Dla agentów obsługiwanych przez Codex `/compact` uruchamia natywną Compaction Codex app-server na
powiązanym wątku. OpenClaw nie czeka na zakończenie, nie narzuca limitu czasu OpenClaw,
nie restartuje współdzielonego app-server ani nie przełącza awaryjnie na silnik kontekstu lub
publiczny podsumowywacz OpenAI. Jeśli natywne powiązanie wątku Codex jest brakujące albo
nieaktualne, polecenie kończy się błędem zamkniętym, aby operator zobaczył rzeczywistą granicę środowiska uruchomieniowego
zamiast cichego przełączenia backendów Compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

W tym kształcie oba profile nadal działają przez Codex dla tur agentów `openai/gpt-*`.
Klucz API jest tylko zapasowym uwierzytelnianiem, a nie żądaniem przełączenia na OpenClaw lub
zwykłe OpenAI Responses.

Pozostała część tej strony opisuje typowe warianty, między którymi użytkownicy muszą wybrać:
kształt wdrożenia, routing zamykany z błędem, zasady zatwierdzania guardian, natywne
pluginy Codex oraz Computer Use. Pełne listy opcji, wartości domyślne, enumy, wykrywanie,
izolację środowiska, limity czasu oraz pola transportu app-server opisuje
[Referencja mechanizmu Codex](/pl/plugins/codex-harness-reference).

## Weryfikacja środowiska uruchomieniowego Codex

Użyj `/status` w czacie, w którym oczekujesz Codex. Tura agenta OpenAI obsługiwana przez Codex
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
oraz Skills. `/codex models` wyświetla bieżący katalog Codex app-server dla
mechanizmu i konta. Jeśli `/status` jest zaskakujący, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Routing i wybór modelu

Oddzielaj referencje dostawcy od zasad środowiska uruchomieniowego:

- Używaj `openai/gpt-*` dla tur agentów OpenAI przez Codex.
- Nie używaj starszych referencji GPT Codex w konfiguracji. Uruchom `openclaw doctor --fix`, aby
  naprawić starsze referencje i nieaktualne przypięcia tras sesji.
- `agentRuntime.id: "codex"` jest opcjonalne dla normalnego trybu automatycznego OpenAI, ale przydatne,
  gdy wdrożenie powinno zakończyć się błędem, jeśli Codex jest niedostępny.
- `agentRuntime.id: "openclaw"` świadomie przełącza dostawcę lub model na osadzone
  środowisko uruchomieniowe OpenClaw.
- `/codex ...` steruje natywnymi konwersacjami Codex app-server z czatu.
- ACP/acpx to oddzielna ścieżka zewnętrznego mechanizmu. Używaj jej tylko wtedy, gdy użytkownik prosi
  o ACP/acpx albo zewnętrzny adapter mechanizmu.

Typowy routing poleceń:

| Intencja użytkownika                                   | Użyj                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Dołączenie bieżącego czatu                            | `/codex bind [--cwd <path>]`                                                                          |
| Wznowienie istniejącego wątku Codex                   | `/codex resume <thread-id>`                                                                           |
| Wyświetlenie lub filtrowanie wątków Codex             | `/codex threads [filter]`                                                                             |
| Wyświetlenie natywnych pluginów Codex                 | `/codex plugins list`                                                                                 |
| Włączenie lub wyłączenie skonfigurowanego natywnego Plugin Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Dołączenie istniejącej sesji Codex CLI na sparowanym węźle | `/codex sessions --host <node> [filter]`, następnie `/codex resume <session-id> --host <node> --bind here` |
| Wysłanie tylko opinii dla Codex                       | `/codex diagnostics [note]`                                                                           |
| Uruchomienie zadania ACP/acpx                         | Polecenia sesji ACP/acpx, nie `/codex`                                                               |

| Przypadek użycia                                      | Konfiguracja                                                           | Weryfikacja                             | Uwagi                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-*` plus włączony Plugin `codex`                            | `/status` pokazuje `Runtime: OpenAI Codex` | Zalecana ścieżka                      |
| Wymuś niepowodzenie, jeśli Codex jest niedostępny     | Dostawca lub model `agentRuntime.id: "codex"`                          | Tura kończy się niepowodzeniem zamiast osadzonego fallbacku | Używaj dla wdrożeń wyłącznie z Codex |
| Bezpośredni ruch klucza API OpenAI przez OpenClaw     | Dostawca lub model `agentRuntime.id: "openclaw"` i normalne uwierzytelnianie OpenAI | `/status` pokazuje środowisko uruchomieniowe OpenClaw | Używaj tylko wtedy, gdy OpenClaw jest celowy |
| Starsza konfiguracja                                  | starsze odwołania Codex GPT                                            | `openclaw doctor --fix` przepisuje ją   | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter ACP/acpx Codex                                | ACP `sessions_spawn({ runtime: "acp" })`                               | Status zadania/sesji ACP                | Oddzielne od natywnego harnessu Codex |

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj `openai/gpt-*`
dla normalnej ścieżki OpenAI oraz `codex/gpt-*` tylko wtedy, gdy rozumienie obrazu
ma działać przez ograniczoną turę serwera aplikacji Codex. Nie używaj
starszych odwołań Codex GPT; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.

## Wzorce wdrażania

### Podstawowe wdrożenie Codex

Użyj konfiguracji quickstart, gdy wszystkie tury agenta OpenAI mają domyślnie
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

Ta forma pozostawia Claude jako domyślnego agenta i dodaje nazwanego agenta Codex:

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

### Wdrożenie Codex z wymuszonym niepowodzeniem

Dla tur agenta OpenAI `openai/gpt-*` już rozwiązuje się do Codex, gdy
dołączony Plugin jest dostępny. Dodaj jawną politykę środowiska uruchomieniowego,
gdy chcesz mieć zapisaną regułę wymuszonego niepowodzenia:

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

Gdy Codex jest wymuszony, OpenClaw kończy działanie wcześnie, jeśli Plugin Codex
jest wyłączony, serwer aplikacji jest zbyt stary albo serwer aplikacji nie może
się uruchomić.

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

Lokalne sesje serwera aplikacji stdio domyślnie używają zaufanej postawy
lokalnego operatora: `approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie pozwalają na
tę niejawną postawę YOLO, OpenClaw wybiera zamiast tego dozwolone uprawnienia
guardian. Gdy dla sesji aktywna jest piaskownica OpenClaw, OpenClaw wyłącza dla
tej tury natywny Code Mode Codex, serwery MCP użytkownika oraz wykonywanie Plugin
wspierane przez aplikację, zamiast polegać na piaskownicy po stronie hosta Codex.
Dostęp do powłoki jest udostępniany przez dynamiczne narzędzia wspierane
piaskownicą OpenClaw, takie jak `sandbox_exec` i `sandbox_process`, gdy dostępne
są normalne narzędzia exec/process.

Użyj znormalizowanego trybu exec OpenClaw, gdy chcesz natywnego auto-review
Codex przed ucieczkami z piaskownicy lub dodatkowymi uprawnieniami:

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
`sandbox: "workspace-write"`, gdy lokalne wymagania pozwalają na te wartości.
W `tools.exec.mode: "auto"` OpenClaw nie zachowuje starszych, niebezpiecznych
nadpisań Codex `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`;
użyj `tools.exec.mode: "full"` dla celowej postawy Codex bez zatwierdzania.
Starszy preset `plugins.entries.codex.config.appServer.mode: "guardian"` nadal
działa, ale `tools.exec.mode: "auto"` jest znormalizowaną powierzchnią OpenClaw.

Porównanie na poziomie trybu z zatwierdzeniami exec hosta i uprawnieniami ACPX
znajdziesz w [Trybach uprawnień](/pl/tools/permission-modes).

Pełne informacje o każdym polu serwera aplikacji, kolejności uwierzytelniania,
izolacji środowiska, wykrywaniu i zachowaniu limitów czasu znajdziesz w
[Referencji harnessu Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Dołączony Plugin rejestruje `/codex` jako polecenie slash na każdym kanale,
który obsługuje polecenia tekstowe OpenClaw.

Natywne wykonywanie i kontrola wymagają właściciela albo klienta Gateway
`operator.admin`. Obejmuje to wiązanie lub wznawianie wątków, wysyłanie lub
zatrzymywanie tur, zmianę modelu, trybu szybkiego lub stanu uprawnień,
kompaktowanie lub review oraz odłączanie wiązania. Inni autoryzowani nadawcy
zachowują polecenia tylko do odczytu dotyczące statusu, pomocy, konta, modelu,
wątku, serwera MCP, skill, Skills i inspekcji wiązań.

Typowe formy:

- `/codex status` sprawdza łączność z serwerem aplikacji, modele, konto, limity
  użycia, serwery MCP i Skills.
- `/codex models` wyświetla modele aktywnego serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki serwera aplikacji Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego
  wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywne review Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem feedbacku Codex dla
  dołączonego wątku.
- `/codex account` pokazuje stan konta i limitów użycia.
- `/codex mcp` wyświetla stan serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

W przypadku większości zgłoszeń do wsparcia zacznij od `/diagnostics [note]` w
rozmowie, w której wystąpił błąd. Tworzy ono jeden raport diagnostyczny Gateway
i, dla sesji harnessu Codex, prosi o zgodę na wysłanie odpowiedniego pakietu
feedbacku Codex. Model prywatności i zachowanie czatów grupowych opisuje
[Eksport diagnostyki](/pl/gateway/diagnostics).

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
feedback Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostyki
Gateway.

### Lokalna inspekcja wątków Codex

Najszybszym sposobem zbadania złego uruchomienia Codex jest często bezpośrednie
otwarcie natywnego wątku Codex:

```bash
codex resume <thread-id>
```

Pobierz identyfikator wątku z ukończonej odpowiedzi `/diagnostics`,
`/codex binding` albo `/codex threads [filter]`.

Mechanikę przesyłania i granice diagnostyki na poziomie środowiska
uruchomieniowego opisuje
[Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

Uwierzytelnianie jest wybierane w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej pod
   `auth.order.openai`. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
   identyfikatory profili uwierzytelniania Codex i starszą kolejność
   uwierzytelniania Codex.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, a
   potem `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji i uwierzytelnianie
   OpenAI jest nadal wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT,
usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex.
Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla embeddings lub
bezpośrednich modeli OpenAI, nie powodując przypadkowo rozliczania natywnych tur
serwera aplikacji Codex przez API. Jawne profile klucza API Codex i lokalny
fallback klucza ze środowiska stdio używają logowania serwera aplikacji zamiast
dziedziczonego środowiska procesu potomnego. Połączenia WebSocket z serwerem
aplikacji nie otrzymują fallbacku klucza API ze środowiska Gateway; użyj jawnego
profilu uwierzytelniania albo własnego konta zdalnego serwera aplikacji.
Gdy skonfigurowane są natywne Pluginy Codex, OpenClaw instaluje lub odświeża te
Pluginy przez połączony serwer aplikacji przed udostępnieniem aplikacji należących
do Plugin wątkowi Codex. `app/list` pozostaje źródłem prawdy dla identyfikatorów
aplikacji, dostępności i metadanych, ale OpenClaw odpowiada za decyzję włączenia
dla wątku: jeśli polityka zezwala na wymienioną dostępną aplikację, OpenClaw
wysyła `thread/start.config.apps[appId].enabled = true`, nawet gdy `app/list`
aktualnie zgłasza tę aplikację jako wyłączoną. Ta ścieżka nie wymyśla instalacji
aplikacji dla nieznanych identyfikatorów; OpenClaw aktywuje tylko Pluginy z
marketplace przez `plugin/install`, a następnie odświeża inwentarz.

Jeśli profil subskrypcyjny osiągnie limit użycia Codex, OpenClaw zapisuje czas
resetu, gdy Codex go zgłosi, i próbuje następnego uporządkowanego profilu
uwierzytelniania dla tego samego uruchomienia Codex. Po upływie czasu resetu
profil subskrypcyjny ponownie staje się kwalifikowalny bez zmiany wybranego
modelu `openai/gpt-*` ani środowiska uruchomieniowego Codex.

Dla lokalnych uruchomień serwera aplikacji stdio OpenClaw ustawia `CODEX_HOME`
na katalog per-agent, aby konfiguracja Codex, pliki uwierzytelniania/konta,
pamięć podręczna/dane Plugin oraz natywny stan wątków domyślnie nie odczytywały
ani nie zapisywały osobistego `~/.codex` operatora. OpenClaw zachowuje normalny
procesowy `HOME`; podprocesy uruchamiane przez Codex nadal mogą znaleźć
konfigurację i tokeny w katalogu domowym użytkownika, a Codex może wykrywać
wspólne wpisy `$HOME/.agents/skills` i `$HOME/.agents/plugins/marketplace.json`.

Jeśli wdrożenie potrzebuje dodatkowej izolacji środowiska, dodaj te zmienne do
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

`appServer.clearEnv` wpływa tylko na uruchamiany proces potomny serwera aplikacji
Codex. OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji
lokalnego uruchomienia: `CODEX_HOME` pozostaje per-agent, a `HOME` pozostaje
dziedziczone, aby podprocesy mogły używać normalnego stanu katalogu domowego
użytkownika.

Narzędzia dynamiczne Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
narzędzi dynamicznych, które duplikują natywne operacje obszaru roboczego Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` i `update_plan`. Większość pozostałych
narzędzi integracyjnych OpenClaw, takich jak komunikacja, media, Cron, przeglądarka, węzły,
Gateway i `heartbeat_respond`, jest dostępna przez wyszukiwanie narzędzi Codex w przestrzeni nazw
`openclaw`, co zmniejsza początkowy kontekst modelu. Wyszukiwanie w sieci
domyślnie używa hostowanego narzędzia `web_search` Codex, gdy wyszukiwanie jest włączone i nie
wybrano zarządzanego dostawcy. Natywne hostowane wyszukiwanie i zarządzane przez OpenClaw
narzędzie dynamiczne `web_search` wzajemnie się wykluczają, więc zarządzane wyszukiwanie nie może omijać
natywnych ograniczeń domen. OpenClaw używa zarządzanego narzędzia, gdy hostowane wyszukiwanie jest
niedostępne, jawnie wyłączone albo zastąpione przez wybranego zarządzanego dostawcę.
OpenClaw pozostawia samodzielne rozszerzenie `web.run` Codex wyłączone, ponieważ
ruch produkcyjnego serwera aplikacji odrzuca jego zdefiniowaną przez użytkownika przestrzeń nazw `web`.
`tools.web.search.enabled: false` wyłącza obie ścieżki, tak samo jak przebiegi tylko LLM
z wyłączonymi narzędziami. Codex traktuje `"cached"` jako preferencję i rozwiązuje ją do aktywnego
zewnętrznego dostępu dla nieograniczonych tur serwera aplikacji. Automatyczna zarządzana ścieżka awaryjna
zamyka się bezpiecznie, gdy ustawiono natywne `allowedDomains`, aby nie można było ominąć
listy dozwolonych domen. Trwałe zmiany efektywnej polityki wyszukiwania rotują powiązany wątek Codex
przed następną turą. Przejściowe ograniczenia dla pojedynczej tury używają tymczasowego
ograniczonego wątku i zachowują istniejące powiązanie do późniejszego wznowienia.
`sessions_yield` oraz odpowiedzi źródłowe używające wyłącznie narzędzi wiadomości pozostają bezpośrednie, ponieważ
są to kontrakty sterowania turą. `sessions_spawn` pozostaje wyszukiwalne, aby natywne
`spawn_agent` Codex pozostało podstawową powierzchnią podagentów Codex, a jawna
delegacja OpenClaw lub ACP nadal była dostępna przez przestrzeń nazw narzędzi dynamicznych
`openclaw`. Instrukcje współpracy Heartbeat mówią Codex, aby wyszukał
`heartbeat_respond` przed zakończeniem tury Heartbeat, gdy narzędzie nie jest już
załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym serwerem aplikacji Codex,
który nie może wyszukiwać odroczonych narzędzi dynamicznych, albo podczas debugowania pełnego
ładunku narzędzi.

Obsługiwane pola najwyższego poziomu Pluginu Codex:

| Pole                       | Domyślnie      | Znaczenie                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić narzędzia dynamiczne OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy narzędzi dynamicznych OpenClaw do pominięcia w turach serwera aplikacji Codex. |
| `codexPlugins`             | wyłączone      | Natywna obsługa pluginów/aplikacji Codex dla zmigrowanych, kuratorowanych pluginów instalowanych ze źródła. |

Obsługiwane pola `appServer`:

| Pole                                          | Domyślne                                              | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                                                                     |
| `command`                                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko w celu jawnego nadpisania.                                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | nieustawione                                           | Adres URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | nieustawione                                           | Token Bearer dla transportu WebSocket. Akceptuje dosłowny ciąg znaków lub SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                   | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują dosłowne ciągi znaków lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                        |
| `clearEnv`                                    | `[]`                                                   | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu stdio app-server po tym, jak OpenClaw zbuduje swoje dziedziczone środowisko. OpenClaw zachowuje osobny dla każdego agenta `CODEX_HOME` oraz dziedziczone `HOME` dla lokalnych uruchomień.                                                                                                                             |
| `codeModeOnly`                                | `false`                                                | Włącza powierzchnię narzędzi Codex ograniczoną wyłącznie do trybu kodu. Dynamiczne narzędzia OpenClaw pozostają zarejestrowane w Codex, aby zagnieżdżone wywołania `tools.*` wracały przez most app-server `item/tool/call`.                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | nieustawione                                           | Katalog główny zdalnego obszaru roboczego Codex app-server. Po ustawieniu OpenClaw wyprowadza lokalny katalog główny obszaru roboczego z rozpoznanego obszaru roboczego OpenClaw, zachowuje bieżący sufiks cwd pod tym zdalnym katalogiem głównym i wysyła do Codex tylko końcowe cwd app-server. Jeśli cwd znajduje się poza rozpoznanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw kończy działanie w trybie fail-closed zamiast wysyłać lokalną dla Gateway ścieżkę do zdalnego app-server. |
| `requestTimeoutMs`                            | `60000`                                                | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Okno ciszy po zaakceptowaniu tury przez Codex lub po żądaniu app-server o zakresie tury, gdy OpenClaw czeka na `turn/completed`.                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Strażnik bezczynności ukończenia i postępu używany po przekazaniu narzędziu, ukończeniu natywnego narzędzia, surowym postępie asystenta po narzędziu, ukończeniu surowego rozumowania lub postępie rozumowania, gdy OpenClaw czeka na `turn/completed`. Używaj tego dla zaufanych lub ciężkich zadań, w których synteza po narzędziu może zasadnie pozostawać cicha dłużej niż końcowy budżet publikacji asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex nie zezwalają na YOLO | Preset dla wykonania YOLO lub wykonania weryfikowanego przez strażnika. Lokalne wymagania stdio, które pomijają `danger-full-access`, zatwierdzanie `never` albo recenzenta `user`, sprawiają, że niejawną wartością domyślną jest strażnik.                                                                                                                                                  |
| `approvalPolicy`                              | `"never"` lub dozwolona polityka zatwierdzania strażnika | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku/turze. Domyślne ustawienia strażnika preferują `"on-request"`, gdy jest dozwolone.                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` lub dozwolony sandbox strażnika | Natywny tryb sandbox Codex wysyłany przy rozpoczęciu/wznowieniu wątku. Domyślne ustawienia strażnika preferują `"workspace-write"`, gdy jest dozwolone, w przeciwnym razie `"read-only"`. Gdy aktywny jest sandbox OpenClaw, tury `danger-full-access` używają Codex `workspace-write` z dostępem sieciowym wyprowadzonym z ustawienia ruchu wychodzącego sandbox OpenClaw.                   |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent strażnika             | Użyj `"auto_review"`, aby pozwolić Codex recenzować natywne monity zatwierdzania, gdy jest to dozwolone; w przeciwnym razie użyj `guardian_subagent` albo `user`. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                                                                               |
| `serviceTier`                                 | nieustawione                                           | Opcjonalna warstwa usługi Codex app-server. `"priority"` włącza routing w trybie szybkim, `"flex"` żąda przetwarzania flex, `null` czyści nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                                    |
| `networkProxy`                                | wyłączone                                              | Włącza sieć profilu uprawnień Codex dla poleceń app-server. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją za pomocą `default_permissions` zamiast wysyłać `sandbox`.                                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | Podglądowa zgoda, która rejestruje środowisko Codex oparte na sandbox OpenClaw w Codex app-server 0.132.0 lub nowszym, aby natywne wykonanie Codex mogło działać wewnątrz aktywnego sandbox OpenClaw.                                                                                                                                                                                          |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt sandbox Codex.
Po włączeniu OpenClaw ustawia również `features.network_proxy.enabled` i
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

Jeśli normalnym środowiskiem uruchomieniowym app-server byłoby `danger-full-access`,
włączenie `networkProxy` używa dostępu do systemu plików w stylu obszaru roboczego
dla wygenerowanego profilu uprawnień. Zarządzane przez Codex egzekwowanie sieci
to sieć sandbox, więc profil z pełnym dostępem nie chroniłby ruchu wychodzącego.
Wpisy domen używają `allow` lub `deny`; wpisy gniazd Unix używają wartości
Codex `allow` lub `none`.

Wywołania dynamicznych narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie używają 90-sekundowego
watchdoga OpenClaw. Dodatni argument `timeoutMs` dla pojedynczego wywołania wydłuża
albo skraca budżet tego konkretnego narzędzia. Narzędzie `image_generate` używa
`agents.defaults.imageGenerationModel.timeoutMs`, gdy wywołanie narzędzia nie
podaje własnego limitu czasu, albo w przeciwnym razie domyślnego 120-sekundowego
limitu dla generowania obrazów.
Narzędzie `image` do rozumienia multimediów używa
`tools.media.image.timeoutSeconds` albo swojego 60-sekundowego domyślnego limitu
dla multimediów. W przypadku rozumienia obrazów ten limit czasu dotyczy samego
żądania i nie jest pomniejszany przez wcześniejsze prace przygotowawcze. Budżety
dynamicznych narzędzi są ograniczone do 600000 ms. Po przekroczeniu limitu czasu
OpenClaw przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do
Codex nieudaną odpowiedź dynamicznego narzędzia, aby tura mogła być kontynuowana
zamiast pozostawiać sesję w stanie `processing`.
Ten watchdog jest zewnętrznym budżetem dynamicznego `item/tool/call`; specyficzne
dla dostawcy limity czasu żądań działają wewnątrz tego wywołania i zachowują
własną semantykę limitów czasu.

Po zaakceptowaniu tury przez Codex oraz po odpowiedzi OpenClaw na żądanie
app-server o zakresie tury harness oczekuje, że Codex zrobi postęp w bieżącej
turze i ostatecznie zakończy natywną turę za pomocą `turn/completed`. Jeśli
app-server pozostaje cichy przez `appServer.turnCompletionIdleTimeoutMs`,
OpenClaw w trybie best-effort przerywa turę Codex, zapisuje diagnostyczny limit
czasu i zwalnia pas sesji OpenClaw, aby kolejne wiadomości czatu nie były
kolejkowane za przestarzałą natywną turą. Większość nieterminalnych powiadomień
dla tej samej tury rozbraja tego krótkiego watchdoga, ponieważ Codex dowiódł, że
tura nadal żyje. Przekazania narzędzi używają dłuższego budżetu bezczynności po
narzędziu: po tym, jak OpenClaw zwróci odpowiedź `item/tool/call`, po zakończeniu
natywnych elementów narzędzi takich jak `commandExecution`, po zakończeniach
surowego `custom_tool_call_output` oraz po surowym postępie asystenta po
narzędziu, zakończeniach rozumowania albo postępie rozumowania. Strażnik używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, gdy jest skonfigurowany,
a w przeciwnym razie domyślnie pięciu minut. Ten sam budżet po narzędziu wydłuża
też watchdoga postępu dla cichego okna syntezy, zanim Codex wyemituje następne
zdarzenie bieżącej tury. Globalne powiadomienia app-server, takie jak aktualizacje
limitów szybkości, nie resetują postępu bezczynności tury. Zakończenia
rozumowania, zakończenia komentarzowego `agentMessage` i surowy postęp
rozumowania lub asystenta przed narzędziem mogą zostać uzupełnione automatyczną
odpowiedzią końcową, więc używają strażnika odpowiedzi po postępie zamiast
natychmiast zwalniać pas sesji. Tylko końcowe/niekomentarzowe ukończone elementy
`agentMessage` oraz surowe zakończenia asystenta przed narzędziem uzbrajają
zwolnienie po wyjściu asystenta: jeśli Codex następnie ucichnie bez
`turn/completed`, OpenClaw w trybie best-effort przerywa natywną turę i zwalnia
pas sesji. Jeśli inny obserwator tury wygra wyścig o to zwolnienie, OpenClaw
nadal akceptuje ukończony końcowy element asystenta, gdy żadne natywne żądanie,
element ani zakończenie dynamicznego narzędzia nie pozostaje aktywne, a
zwolnienie po wyjściu asystenta nadal należy do ostatnio ukończonego elementu,
bez późniejszego zakończenia elementu. Może to zachować końcową odpowiedź po
ukończonej pracy narzędzi bez odtwarzania tury. Częściowe delty asystenta,
nieaktualne wcześniejsze odpowiedzi i puste późniejsze zakończenia nie spełniają
warunków. Bezpieczne do odtworzenia awarie app-server przez stdio,
w tym limity czasu bezczynności zakończenia tury bez dowodów asystenta,
narzędzia, aktywnego elementu lub skutku ubocznego, są ponawiane raz w nowej
próbie app-server. Niebezpieczne limity czasu nadal wycofują zablokowanego
klienta app-server i zwalniają pas sesji OpenClaw. Czyszczą też przestarzałe
wiązanie natywnego wątku zamiast automatycznie je odtwarzać. Limity czasu
obserwatora zakończenia pokazują tekst limitu czasu specyficzny dla Codex:
przypadki bezpieczne do odtworzenia mówią, że odpowiedź może być niekompletna,
podczas gdy przypadki niebezpieczne każą użytkownikowi zweryfikować bieżący stan
przed ponowieniem. Publiczna diagnostyka limitów czasu zawiera pola strukturalne,
takie jak ostatnia metoda powiadomienia app-server, identyfikator/typ/rola
elementu surowej odpowiedzi asystenta, liczby aktywnych żądań/elementów i
uzbrojony stan obserwatora. Gdy ostatnie powiadomienie jest elementem surowej
odpowiedzi asystenta, zawiera też ograniczony podgląd tekstu asystenta. Nie
zawiera surowej treści promptu ani narzędzia.

Nadpisania środowiskowe pozostają dostępne do testowania lokalnego:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego testowania lokalnego.
Konfiguracja jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje
zachowanie pluginu w tym samym recenzowanym pliku co reszta konfiguracji harnessu
Codex.

## Natywne pluginy Codex

Obsługa natywnych pluginów Codex używa własnych możliwości aplikacji i pluginów
app-server Codex w tym samym wątku Codex co tura harnessu OpenClaw. OpenClaw nie
tłumaczy pluginów Codex na syntetyczne dynamiczne narzędzia OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa tylko na sesje, które wybierają natywny harness Codex. Nie
ma wpływu na uruchomienia wbudowanego harnessu, normalne uruchomienia dostawcy
OpenAI, wiązania konwersacji ACP ani inne harnessy.

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
harnessu Codex albo zastępuje przestarzałe wiązanie wątku Codex. Nie jest
przeliczana przy każdej turze. Po zmianie `codexPlugins` użyj `/new`, `/reset`
albo zrestartuj gateway, aby przyszłe sesje harnessu Codex zaczynały z
zaktualizowanym zestawem aplikacji.

Informacje o kwalifikacji do migracji, inwentarzu aplikacji, zasadach działań
destrukcyjnych, elicitations i diagnostyce natywnych pluginów znajdziesz w
[Natywne pluginy Codex](/pl/plugins/codex-native-plugins).

Dostęp do aplikacji i pluginów po stronie OpenAI jest kontrolowany przez
zalogowane konto Codex oraz, w przypadku przestrzeni roboczych Business i
Enterprise/Edu, przez kontrolę aplikacji w przestrzeni roboczej. Zobacz
[Używanie Codex z planem ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan),
aby uzyskać przegląd konta i kontroli przestrzeni roboczej OpenAI.

## Computer Use

Computer Use opisano w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji do sterowania pulpitem ani sam nie
wykonuje działań pulpitu. Przygotowuje app-server Codex, weryfikuje, że serwer
MCP `computer-use` jest dostępny, a następnie pozwala Codex zarządzać natywnymi
wywołaniami narzędzi MCP podczas tur w trybie Codex.

## Granice środowiska uruchomieniowego

Harness Codex zmienia tylko niskopoziomowy osadzony executor agenta.

- Dynamiczne narzędzia OpenClaw są obsługiwane. Codex prosi OpenClaw o wykonanie
  tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.
- Natywne narzędzia powłoki, poprawek, MCP i natywnych aplikacji Codex należą do
  Codex. OpenClaw może obserwować albo blokować wybrane natywne zdarzenia przez
  obsługiwany relay, ale nie przepisuje natywnych argumentów narzędzi.
- Codex zarządza natywnym Compaction. OpenClaw utrzymuje lustrzaną kopię
  transkryptu dla historii kanałów, wyszukiwania, `/new`, `/reset` i przyszłego
  przełączania modelu albo harnessu, ale nie zastępuje Compaction Codex
  podsumowywaniem OpenClaw ani silnika kontekstu.
- Generowanie multimediów, rozumienie multimediów, TTS, zatwierdzenia i wyjście
  narzędzi wiadomości nadal przechodzą przez odpowiednie ustawienia
  dostawcy/modelu OpenClaw.
- `tool_result_persist` dotyczy wyników narzędzi transkryptu należących do
  OpenClaw, a nie rekordów wyników narzędzi natywnych Codex.

Informacje o warstwach hooków, obsługiwanych powierzchniach V1, obsłudze
natywnych uprawnień, sterowaniu kolejką, mechanice przesyłania opinii Codex i
szczegółach Compaction znajdziesz w
[Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie pojawia się jako normalny dostawca `/model`:** jest to oczekiwane w
nowych konfiguracjach. Wybierz model `openai/gpt-*`, włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa wbudowanego harnessu zamiast Codex:** upewnij się, że ref modelu
to `openai/gpt-*` u oficjalnego dostawcy OpenAI oraz że plugin Codex jest
zainstalowany i włączony. Jeśli podczas testowania potrzebujesz ścisłego dowodu,
ustaw `agentRuntime.id: "codex"` na dostawcy albo modelu. Wymuszone środowisko
uruchomieniowe Codex kończy się niepowodzeniem zamiast wracać do OpenClaw.

**Środowisko uruchomieniowe OpenAI Codex wraca do ścieżki klucza API:** zbierz
zredagowany fragment gateway pokazujący model, środowisko uruchomieniowe,
wybranego dostawcę i błąd. Poproś dotkniętych współpracowników o uruchomienie
tego polecenia tylko do odczytu na ich hoście OpenClaw:

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
`No API key`. Poprawione uruchomienie powinno pokazać ścieżkę OAuth OpenAI
zamiast zwykłej awarii klucza API OpenAI.

**Pozostała konfiguracja starszych refów modeli Codex:** uruchom
`openclaw doctor --fix`. Doctor przepisuje starsze refy modeli na `openai/*`,
usuwa przestarzałe piny środowiska uruchomieniowego sesji i całego agenta oraz
zachowuje istniejące nadpisania profilu uwierzytelniania.

**App-server jest odrzucany:** użyj app-server Codex `0.125.0` albo nowszego.
Wersje prerelease o tej samej wersji albo wersje z sufiksem buildu, takie jak
`0.125.0-alpha.2` albo `0.125.0+custom`, są odrzucane, ponieważ OpenClaw testuje
stabilny minimalny protokół `0.125.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy dołączony plugin `codex`
jest włączony, czy `plugins.allow` go uwzględnia, gdy skonfigurowano listę
dozwolonych, oraz czy dowolne niestandardowe `appServer.command`, `url`,
`authToken` albo nagłówki są prawidłowe.

**Wykrywanie modeli jest wolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie. Zobacz
[Referencja harnessu Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket od razu zawodzi:** sprawdź `appServer.url`, `authToken`,
nagłówki oraz czy zdalny app-server mówi tą samą wersją protokołu app-server
Codex.

**Natywna powłoka lub narzędzia poprawek są blokowane komunikatem `Native hook relay unavailable`:**
wątek Codex nadal próbuje używać natywnego identyfikatora przekaźnika hook, którego OpenClaw nie
ma już zarejestrowanego. To problem transportu natywnego hook Codex, a nie awaria backendu ACP,
dostawcy, GitHub ani polecenia powłoki. Rozpocznij nową sesję w
dotkniętym czacie poleceniem `/new` lub `/reset`, a następnie ponów nieszkodliwe polecenie. Jeśli to
zadziała raz, ale kolejne natywne wywołanie narzędzia znów się nie powiedzie, traktuj `/new` tylko jako tymczasowe
obejście: skopiuj prompt do nowej sesji po ponownym uruchomieniu serwera aplikacji Codex
lub OpenClaw Gateway, aby stare wątki zostały porzucone, a rejestracje natywnych hook
zostały odtworzone.

**Model inny niż Codex używa wbudowanego harnessu:** jest to oczekiwane, chyba że
polityka środowiska uruchomieniowego dostawcy lub modelu kieruje go do innego harnessu. Zwykłe odwołania do dostawców innych niż OpenAI
pozostają na swojej normalnej ścieżce dostawcy w trybie `auto`.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` z nowej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj opisanej powyżej procedury odzyskiwania natywnego przekaźnika hook. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use#troubleshooting).

## Powiązane

- [Dokumentacja harnessu Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Natywne Pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pomoc OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Hooki Pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Status](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
