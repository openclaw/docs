---
read_when:
    - Chcesz użyć dołączonego harnessu serwera aplikacji Codex
    - Potrzebujesz przykładów konfiguracji harnessu Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na OpenClaw
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączony harness serwera aplikacji Codex
title: Uprząż Codex
x-i18n:
    generated_at: "2026-06-30T14:32:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta OpenAI
przez Codex app-server zamiast wbudowanego harnessu OpenClaw.

Użyj harnessu Codex, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
natywnym wznawianiem wątku, natywną kontynuacją narzędzi, natywną kompakcją oraz
wykonywaniem w app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modelu,
dynamicznymi narzędziami OpenClaw, zatwierdzeniami, dostarczaniem multimediów oraz widocznym
lustrzanym transkryptem.

Standardowa konfiguracja używa kanonicznych referencji modeli OpenAI, takich jak `openai/gpt-5.5`.
Nie konfiguruj starszych referencji GPT Codex. Umieść kolejność uwierzytelniania agenta OpenAI
w `auth.order.openai`; starsze identyfikatory profili uwierzytelniania Codex oraz
starsze wpisy kolejności uwierzytelniania Codex to stan legacy naprawiany przez
`openclaw doctor --fix`.

Gdy żaden sandbox OpenClaw nie jest aktywny, OpenClaw uruchamia wątki Codex app-server
z włączonym natywnym trybem kodu Codex, pozostawiając domyślnie wyłączony tryb tylko do kodu.
Dzięki temu natywny obszar roboczy i możliwości kodu Codex pozostają dostępne, podczas gdy
dynamiczne narzędzia OpenClaw nadal przechodzą przez most app-server `item/tool/call`.
Aktywne sandboxing OpenClaw i ograniczone zasady narzędzi całkowicie wyłączają natywny tryb kodu,
chyba że włączysz eksperymentalną ścieżkę sandbox exec-server.

Ta natywna funkcja Codex jest oddzielna od
[trybu kodu OpenClaw](/pl/reference/code-mode), który jest opcjonalnym środowiskiem uruchomieniowym QuickJS-WASI
dla ogólnych uruchomień OpenClaw z innym kształtem wejścia `exec`.

Szerszy podział na model/dostawcę/środowisko uruchomieniowe zacznij od
[środowisk uruchomieniowych agenta](/pl/concepts/agent-runtimes). W skrócie:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Wymagania

- OpenClaw z dostępnym dołączonym Pluginem `codex`.
- Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij `codex`.
- Codex app-server `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  plikiem binarnym Codex app-server, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na normalne uruchamianie harnessu.
- Uwierzytelnianie Codex dostępne przez `openclaw models auth login --provider openai`,
  konto app-server w katalogu domowym Codex agenta albo jawny profil uwierzytelniania
  Codex z kluczem API.

Pierwszeństwo uwierzytelniania, izolację środowiska, niestandardowe polecenia app-server, wykrywanie modeli
i wszystkie pola konfiguracji opisuje
[referencja harnessu Codex](/pl/plugins/codex-harness-reference).

## Szybki start

Większość użytkowników, którzy chcą używać Codex w OpenClaw, wybiera tę ścieżkę: zaloguj się
subskrypcją ChatGPT/Codex, włącz dołączony Plugin `codex` i użyj
kanonicznej referencji modelu `openai/gpt-*`.

Zaloguj się przez Codex OAuth:

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

Po zmianie konfiguracji Pluginu uruchom ponownie Gateway. Jeśli istniejący czat ma już
sesję, użyj `/new` albo `/reset` przed testowaniem zmian środowiska uruchomieniowego, aby następna
tura rozwiązała harness z bieżącej konfiguracji.

## Konfiguracja

Konfiguracja z szybkiego startu to minimalna działająca konfiguracja harnessu Codex. Ustaw opcje
harnessu Codex w konfiguracji OpenClaw, a CLI używaj tylko do uwierzytelniania Codex:

| Potrzeba                                               | Ustaw                                                                            | Gdzie                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------- |
| Włączenie harnessu                                     | `plugins.entries.codex.enabled: true`                                            | Konfiguracja OpenClaw              |
| Zachowanie instalacji Pluginu z listy dozwolonych      | Uwzględnij `codex` w `plugins.allow`                                             | Konfiguracja OpenClaw              |
| Kierowanie tur agenta OpenAI przez Codex               | `agents.defaults.model` albo `agents.list[].model` jako `openai/gpt-*`           | Konfiguracja agenta OpenClaw       |
| Logowanie przez ChatGPT/Codex OAuth                    | `openclaw models auth login --provider openai`                                   | Profil uwierzytelniania CLI        |
| Dodanie zapasowego klucza API dla uruchomień Codex     | Profil klucza API `openai:*` wymieniony po uwierzytelnianiu subskrypcji w `auth.order.openai` | Profil uwierzytelniania CLI + konfiguracja OpenClaw |
| Fail closed, gdy Codex jest niedostępny                | `agentRuntime.id: "codex"` dostawcy lub modelu                                   | Konfiguracja modelu/dostawcy OpenClaw |
| Użycie bezpośredniego ruchu API OpenAI                 | `agentRuntime.id: "openclaw"` dostawcy lub modelu ze standardowym uwierzytelnianiem OpenAI | Konfiguracja modelu/dostawcy OpenClaw |
| Dostrajanie zachowania app-server                      | `plugins.entries.codex.config.appServer.*`                                       | Konfiguracja Pluginu Codex         |
| Włączenie natywnych aplikacji Plugin Codex             | `plugins.entries.codex.config.codexPlugins.*`                                    | Konfiguracja Pluginu Codex         |
| Włączenie Codex Computer Use                           | `plugins.entries.codex.config.computerUse.*`                                     | Konfiguracja Pluginu Codex         |

Używaj referencji modeli `openai/gpt-*` dla tur agenta OpenAI obsługiwanych przez Codex. Preferuj
`auth.order.openai` dla kolejności: najpierw subskrypcja, potem zapasowy klucz API. Istniejące
starsze identyfikatory profili uwierzytelniania Codex oraz starsza kolejność uwierzytelniania Codex są
stanem legacy tylko dla doktora; nie zapisuj nowych starszych referencji GPT Codex.

Nie ustawiaj `compaction.model` ani `compaction.provider` na agentach obsługiwanych przez Codex.
Codex kompresuje przez swój natywny stan wątku app-server, więc OpenClaw ignoruje
te lokalne nadpisania podsumowywacza w czasie działania, a `openclaw doctor --fix` usuwa
je, gdy agent używa Codex.

Lossless pozostaje obsługiwany jako silnik kontekstu dla składania, pozyskiwania i
utrzymania wokół tur Codex. Skonfiguruj go przez
`plugins.slots.contextEngine: "lossless-claw"` oraz
`plugins.entries.lossless-claw.config.summaryModel`, nie przez
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migruje stary
kształt `compaction.provider: "lossless-claw"` do slotu silnika kontekstu Lossless,
gdy Codex jest aktywnym środowiskiem uruchomieniowym, ale natywny Codex nadal zarządza kompakcją.

Natywny harness Codex app-server obsługuje silniki kontekstu, które wymagają
składania przed promptem. Ogólne backendy CLI, w tym `codex-cli`, nie zapewniają
tej możliwości hosta.

Dla agentów obsługiwanych przez Codex `/compact` uruchamia natywną kompakcję Codex app-server
na powiązanym wątku. OpenClaw nie czeka na ukończenie, nie nakłada limitu czasu OpenClaw,
nie restartuje współdzielonego app-server ani nie wycofuje się do silnika kontekstu lub
publicznego podsumowywacza OpenAI. Jeśli natywne powiązanie wątku Codex jest brakujące albo
nieaktualne, polecenie kończy się fail closed, aby operator zobaczył rzeczywistą granicę środowiska uruchomieniowego
zamiast cichego przełączenia backendów kompakcji.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

W takim kształcie oba profile nadal działają przez Codex dla tur agenta `openai/gpt-*`.
Klucz API jest tylko zapasowym uwierzytelnianiem, a nie żądaniem przełączenia na OpenClaw lub
zwykłe OpenAI Responses.

Dalsza część tej strony omawia typowe warianty, między którymi użytkownicy muszą wybrać:
kształt wdrożenia, routing fail-closed, zasady zatwierdzania guardian, natywne Pluginy
Codex oraz Computer Use. Pełne listy opcji, wartości domyślne, enumy, wykrywanie,
izolację środowiska, limity czasu oraz pola transportu app-server opisuje
[referencja harnessu Codex](/pl/plugins/codex-harness-reference).

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
harnessu i konta. Jeśli `/status` jest zaskakujący, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Routing i wybór modelu

Trzymaj referencje dostawców i zasady środowiska uruchomieniowego oddzielnie:

- Używaj `openai/gpt-*` dla tur agenta OpenAI przez Codex.
- Nie używaj starszych referencji GPT Codex w konfiguracji. Uruchom `openclaw doctor --fix`, aby
  naprawić starsze referencje i nieaktualne przypięcia tras sesji.
- `agentRuntime.id: "codex"` jest opcjonalne dla normalnego trybu automatycznego OpenAI, ale przydatne,
  gdy wdrożenie ma fail closed, jeśli Codex jest niedostępny.
- `agentRuntime.id: "openclaw"` przełącza dostawcę lub model na osadzone środowisko uruchomieniowe OpenClaw,
  gdy jest to zamierzone.
- `/codex ...` steruje natywnymi konwersacjami Codex app-server z czatu.
- ACP/acpx to oddzielna ścieżka zewnętrznego harnessu. Używaj jej tylko wtedy, gdy użytkownik prosi
  o ACP/acpx albo adapter zewnętrznego harnessu.

Typowe kierowanie poleceń:

| Intencja użytkownika                                     | Użyj                                                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Dołączenie bieżącego czatu                               | `/codex bind [--cwd <path>]`                                                                          |
| Wznowienie istniejącego wątku Codex                      | `/codex resume <thread-id>`                                                                           |
| Wyświetlenie lub filtrowanie wątków Codex                | `/codex threads [filter]`                                                                             |
| Wyświetlenie natywnych Pluginów Codex                    | `/codex plugins list`                                                                                 |
| Włączenie lub wyłączenie skonfigurowanego natywnego Pluginu Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Dołączenie istniejącej sesji Codex CLI na sparowanym węźle | `/codex sessions --host <node> [filter]`, potem `/codex resume <session-id> --host <node> --bind here` |
| Wysłanie tylko opinii Codex                              | `/codex diagnostics [note]`                                                                           |
| Uruchomienie zadania ACP/acpx                            | Polecenia sesji ACP/acpx, nie `/codex`                                                                |

| Przypadek użycia                                    | Konfiguracja                                                           | Weryfikacja                            | Uwagi                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-*` plus włączony Plugin `codex`                            | `/status` pokazuje `Runtime: OpenAI Codex` | Zalecana ścieżka                           |
| Zakończ błędem, jeśli Codex jest niedostępny         | Provider lub model `agentRuntime.id: "codex"`                          | Tura kończy się błędem zamiast osadzonego fallbacku | Używaj dla wdrożeń wyłącznie z Codex       |
| Bezpośredni ruch z kluczem API OpenAI przez OpenClaw | Provider lub model `agentRuntime.id: "openclaw"` i zwykłe uwierzytelnianie OpenAI | `/status` pokazuje środowisko uruchomieniowe OpenClaw | Używaj tylko wtedy, gdy OpenClaw jest zamierzony |
| Starsza konfiguracja                                 | starsze referencje Codex GPT                                           | `openclaw doctor --fix` przepisuje ją  | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter ACP/acpx Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | Status zadania/sesji ACP               | Oddzielne od natywnego harnessu Codex      |

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj `openai/gpt-*`
dla zwykłej trasy OpenAI oraz `codex/gpt-*` tylko wtedy, gdy rozumienie obrazów
ma przebiegać przez ograniczoną turę serwera aplikacji Codex. Nie używaj
starszych referencji Codex GPT; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.

## Wzorce wdrożenia

### Podstawowe wdrożenie Codex

Użyj konfiguracji szybkiego startu, gdy wszystkie tury agentów OpenAI powinny
domyślnie używać Codex.

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

### Wdrożenie z mieszanymi providerami

Ten kształt pozostawia Claude jako domyślnego agenta i dodaje nazwanego agenta Codex:

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

Przy tej konfiguracji agent `main` używa swojej zwykłej ścieżki providera, a
agent `codex` używa serwera aplikacji Codex.

### Wdrożenie Codex z twardym błędem przy niedostępności

Dla tur agentów OpenAI `openai/gpt-*` już rozwiązuje się do Codex, gdy dostępny
jest dołączony Plugin. Dodaj jawną politykę środowiska uruchomieniowego, gdy
chcesz mieć zapisaną regułę twardego błędu:

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

Przy wymuszonym Codex OpenClaw kończy działanie wcześnie, jeśli Plugin Codex jest
wyłączony, serwer aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić.

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

Lokalne sesje serwera aplikacji stdio domyślnie przyjmują zaufaną postawę
lokalnego operatora: `approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie pozwalają na
tę niejawną postawę YOLO, OpenClaw wybiera zamiast tego dozwolone uprawnienia
ochronne. Gdy dla sesji aktywna jest piaskownica OpenClaw, OpenClaw wyłącza
natywny tryb Code Mode Codex, serwery MCP użytkownika oraz wykonywanie Pluginów
wspierane przez aplikację dla tej tury, zamiast polegać na piaskownicy po
stronie hosta Codex. Dostęp do powłoki jest udostępniany przez dynamiczne
narzędzia oparte na piaskownicy OpenClaw, takie jak `sandbox_exec` i
`sandbox_process`, gdy dostępne są zwykłe narzędzia exec/process.

Użyj znormalizowanego trybu exec OpenClaw, gdy chcesz natywnej automatycznej
recenzji Codex przed wyjściami poza piaskownicę lub dodatkowymi uprawnieniami:

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
zatwierdzenia recenzowane przez Codex Guardian, zwykle
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` oraz
`sandbox: "workspace-write"`, gdy lokalne wymagania pozwalają na te wartości.
W `tools.exec.mode: "auto"` OpenClaw nie zachowuje starszych niebezpiecznych
nadpisań Codex `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`;
użyj `tools.exec.mode: "full"` dla celowej postawy Codex bez zatwierdzeń. Starszy
preset `plugins.entries.codex.config.appServer.mode: "guardian"` nadal działa,
ale `tools.exec.mode: "auto"` jest znormalizowaną powierzchnią OpenClaw.

Porównanie na poziomie trybów z zatwierdzeniami exec hosta i uprawnieniami ACPX
znajdziesz w [Trybach uprawnień](/pl/tools/permission-modes).

Pełne informacje o każdym polu serwera aplikacji, kolejności uwierzytelniania,
izolacji środowiska, wykrywaniu i zachowaniu limitów czasu znajdziesz w
[Referencji harnessu Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Dołączony Plugin rejestruje `/codex` jako polecenie ukośnikowe w każdym kanale,
który obsługuje polecenia tekstowe OpenClaw.

Natywne wykonywanie i sterowanie wymagają właściciela albo klienta Gateway
`operator.admin`. Obejmuje to wiązanie lub wznawianie wątków, wysyłanie lub
zatrzymywanie tur, zmianę modelu, trybu szybkiego lub stanu uprawnień,
kompaktowanie lub recenzowanie oraz odłączanie powiązania. Inni upoważnieni
nadawcy zachowują polecenia tylko do odczytu dotyczące statusu, pomocy, konta,
modelu, wątku, serwera MCP, Skills i inspekcji powiązań.

Typowe formy:

- `/codex status` sprawdza łączność z serwerem aplikacji, modele, konto, limity
  użycia, serwery MCP i Skills.
- `/codex models` wyświetla listę aktywnych modeli serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki serwera aplikacji Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego
  wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o kompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywną recenzję Codex dla dołączonego wątku.
- `/codex diagnostics [note]` prosi o potwierdzenie przed wysłaniem opinii Codex
  dla dołączonego wątku.
- `/codex account` pokazuje status konta i limitów użycia.
- `/codex mcp` wyświetla status serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

W przypadku większości zgłoszeń wsparcia zacznij od `/diagnostics [note]` w
rozmowie, w której wystąpił błąd. Tworzy to jeden raport diagnostyczny Gateway i,
dla sesji harnessu Codex, prosi o zgodę na wysłanie odpowiedniego pakietu opinii
Codex. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać model
prywatności i zachowanie w czatach grupowych.

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego
Gateway.

### Lokalna inspekcja wątków Codex

Najszybszym sposobem inspekcji nieudanego uruchomienia Codex jest często
bezpośrednie otwarcie natywnego wątku Codex:

```bash
codex resume <thread-id>
```

Pobierz identyfikator wątku z ukończonej odpowiedzi `/diagnostics`,
`/codex binding` albo `/codex threads [filter]`.

Mechanikę przesyłania oraz granice diagnostyki na poziomie środowiska
uruchomieniowego opisuje
[Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

Uwierzytelnianie jest wybierane w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej w
   `auth.order.openai`. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
   identyfikatory profili uwierzytelniania Codex i starszą kolejność
   uwierzytelniania Codex.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie
   OpenAI nadal jest wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT,
usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex.
Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla embeddingów
lub bezpośrednich modeli OpenAI, bez przypadkowego rozliczania natywnych tur
serwera aplikacji Codex przez API. Jawne profile kluczy API Codex i lokalny
fallback klucza ze środowiska stdio używają logowania serwera aplikacji zamiast
dziedziczonego środowiska procesu potomnego. Połączenia WebSocket z serwerem
aplikacji nie otrzymują fallbacku klucza API ze środowiska Gateway; użyj jawnego
profilu uwierzytelniania albo własnego konta zdalnego serwera aplikacji.
Gdy skonfigurowane są natywne Pluginy Codex, OpenClaw instaluje lub odświeża te
Pluginy przez połączony serwer aplikacji przed udostępnieniem aplikacji
należących do Pluginów wątkowi Codex. `app/list` pozostaje źródłem prawdy dla
identyfikatorów aplikacji, dostępności i metadanych, ale OpenClaw jest
właścicielem decyzji o włączeniu dla danego wątku: jeśli polityka pozwala na
wymienioną dostępną aplikację, OpenClaw wysyła
`thread/start.config.apps[appId].enabled = true` nawet wtedy, gdy `app/list`
aktualnie zgłasza tę aplikację jako wyłączoną. Ta ścieżka nie wymyśla instalacji
aplikacji dla nieznanych identyfikatorów; OpenClaw aktywuje tylko Pluginy z
marketplace za pomocą `plugin/install`, a następnie odświeża inwentarz.

Jeśli profil subskrypcyjny osiągnie limit użycia Codex, OpenClaw zapisuje czas
resetu, gdy Codex go zgłasza, i próbuje następnego uporządkowanego profilu
uwierzytelniania dla tego samego uruchomienia Codex. Po upływie czasu resetu
profil subskrypcyjny ponownie kwalifikuje się bez zmiany wybranego modelu
`openai/gpt-*` ani środowiska uruchomieniowego Codex.

Dla lokalnych uruchomień serwera aplikacji stdio OpenClaw ustawia `CODEX_HOME`
na katalog per-agent, aby konfiguracja Codex, pliki uwierzytelniania/konta,
pamięć podręczna/dane Pluginów oraz natywny stan wątków domyślnie nie odczytywały
ani nie zapisywały osobistego katalogu operatora `~/.codex`. OpenClaw zachowuje
zwykłe procesowe `HOME`; podprocesy uruchamiane przez Codex nadal mogą znajdować
konfigurację i tokeny katalogu domowego użytkownika, a Codex może wykrywać
wspólne wpisy `$HOME/.agents/skills` i `$HOME/.agents/plugins/marketplace.json`.

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

`appServer.clearEnv` wpływa tylko na uruchamiany proces potomny serwera aplikacji
Codex. OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji
lokalnego uruchomienia: `CODEX_HOME` pozostaje per-agent, a `HOME` pozostaje
dziedziczone, aby podprocesy mogły używać zwykłego stanu katalogu domowego
użytkownika.

Narzędzia dynamiczne Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia
narzędzi dynamicznych, które duplikują natywne operacje obszaru roboczego Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` i `update_plan`. Większość pozostałych
narzędzi integracyjnych OpenClaw, takich jak wiadomości, media, Cron, przeglądarka, węzły,
Gateway i `heartbeat_respond`, jest dostępna przez wyszukiwanie narzędzi Codex w przestrzeni nazw
`openclaw`, dzięki czemu początkowy kontekst modelu pozostaje mniejszy. Wyszukiwanie w sieci
domyślnie używa hostowanego narzędzia Codex `web_search`, gdy wyszukiwanie jest włączone i nie
wybrano żadnego zarządzanego dostawcy. Natywne hostowane wyszukiwanie i zarządzane przez OpenClaw
narzędzie dynamiczne `web_search` wzajemnie się wykluczają, aby zarządzane wyszukiwanie nie mogło omijać
natywnych ograniczeń domen. OpenClaw używa zarządzanego narzędzia, gdy hostowane wyszukiwanie jest
niedostępne, jawnie wyłączone lub zastąpione przez wybranego zarządzanego dostawcę.
OpenClaw utrzymuje samodzielne rozszerzenie Codex `web.run` jako wyłączone, ponieważ
ruch produkcyjnego serwera aplikacji odrzuca jego zdefiniowaną przez użytkownika przestrzeń nazw `web`.
`tools.web.search.enabled: false` wyłącza obie ścieżki, podobnie jak uruchomienia tylko LLM
z wyłączonymi narzędziami. Codex traktuje `"cached"` jako preferencję i rozwiązuje ją do aktywnego
zewnętrznego dostępu dla nieograniczonych tur serwera aplikacji. Automatyczna zarządzana ścieżka awaryjna
zamyka się w trybie fail-closed, gdy ustawione są natywne `allowedDomains`, aby nie można było ominąć
listy dozwolonych domen. Trwałe zmiany skutecznej polityki wyszukiwania rotują powiązany wątek Codex
przed następną turą. Tymczasowe ograniczenia dla pojedynczej tury używają tymczasowego
ograniczonego wątku i zachowują istniejące powiązanie do późniejszego wznowienia.
`sessions_yield` oraz odpowiedzi źródłowe tylko z narzędzi wiadomości pozostają bezpośrednie, ponieważ
są to kontrakty sterowania turą. `sessions_spawn` pozostaje wyszukiwalne, więc natywne
`spawn_agent` Codex pozostaje podstawową powierzchnią podagentów Codex, a jawna
delegacja OpenClaw lub ACP nadal jest dostępna przez przestrzeń nazw narzędzi dynamicznych
`openclaw`. Instrukcje współpracy Heartbeat nakazują Codex wyszukać
`heartbeat_respond` przed zakończeniem tury Heartbeat, gdy narzędzie nie jest jeszcze
załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym
serwerem aplikacji Codex, który nie może wyszukiwać odroczonych narzędzi dynamicznych, albo podczas debugowania pełnego
ładunku narzędzi.

Obsługiwane pola najwyższego poziomu Pluginu Codex:

| Pole                       | Domyślnie      | Znaczenie                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić narzędzia dynamiczne OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy narzędzi dynamicznych OpenClaw do pominięcia w turach serwera aplikacji Codex. |
| `codexPlugins`             | wyłączone      | Natywna obsługa pluginów/aplikacji Codex dla zmigrowanych, kuratorowanych pluginów zainstalowanych ze źródła. |

Obsługiwane pola `appServer`:

| Pole                                          | Domyślne                                              | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                                                                   |
| `command`                                     | zarządzany plik binarny Codex                         | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko w celu jawnego nadpisania.                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | nie ustawiono                                         | URL WebSocket app-servera.                                                                                                                                                                                                                                                                                                                                                                    |
| `authToken`                                   | nie ustawiono                                         | Token Bearer dla transportu WebSocket. Przyjmuje literał tekstowy albo SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                     |
| `headers`                                     | `{}`                                                   | Dodatkowe nagłówki WebSocket. Wartości nagłówków przyjmują literały tekstowe albo wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                          |
| `clearEnv`                                    | `[]`                                                   | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-servera stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. OpenClaw zachowuje `CODEX_HOME` dla każdego agenta oraz dziedziczone `HOME` dla lokalnych uruchomień.                                                                                                                                       |
| `codeModeOnly`                                | `false`                                                | Włącza powierzchnię narzędzi Codex tylko dla trybu kodu. Dynamiczne narzędzia OpenClaw pozostają zarejestrowane w Codex, więc zagnieżdżone wywołania `tools.*` wracają przez most app-servera `item/tool/call`.                                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | nie ustawiono                                         | Zdalny katalog główny obszaru roboczego app-servera Codex. Gdy jest ustawiony, OpenClaw wywnioskuje lokalny katalog główny obszaru roboczego z rozwiązanego obszaru roboczego OpenClaw, zachowa bieżący sufiks cwd pod tym zdalnym katalogiem głównym i wyśle do Codex tylko końcowy cwd app-servera. Jeśli cwd znajduje się poza rozwiązanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw odmówi w trybie fail-closed zamiast wysyłać ścieżkę lokalną dla gateway do zdalnego app-servera. |
| `requestTimeoutMs`                            | `60000`                                                | Limit czasu dla wywołań płaszczyzny sterowania app-servera.                                                                                                                                                                                                                                                                                                                                   |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Okno ciszy po zaakceptowaniu tury przez Codex albo po żądaniu app-servera w zakresie tury, gdy OpenClaw czeka na `turn/completed`.                                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Strażnik bezczynności ukończenia i postępu używany po przekazaniu narzędzia, ukończeniu narzędzia natywnego, postępie surowego asystenta po narzędziu, ukończeniu surowego rozumowania albo postępie rozumowania, gdy OpenClaw czeka na `turn/completed`. Używaj tego dla zaufanych lub ciężkich obciążeń, w których synteza po narzędziu może zasadnie pozostawać cicha dłużej niż końcowy budżet publikacji asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex zabraniają YOLO | Ustawienie wstępne dla wykonywania YOLO albo wykonywania sprawdzanego przez guardian. Lokalne wymagania stdio, które pomijają `danger-full-access`, zatwierdzenie `never` albo recenzenta `user`, ustawiają niejawną wartość domyślną na guardian.                                                                                                                                              |
| `approvalPolicy`                              | `"never"` albo dozwolona polityka zatwierdzania guardian | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku/turze. Domyślne ustawienia guardian preferują `"on-request"`, gdy jest dozwolone.                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` albo dozwolony sandbox guardian | Natywny tryb sandbox Codex wysyłany przy rozpoczęciu/wznowieniu wątku. Domyślne ustawienia guardian preferują `"workspace-write"`, gdy jest dozwolone, w przeciwnym razie `"read-only"`. Gdy aktywny jest sandbox OpenClaw, tury `danger-full-access` używają w Codex `workspace-write` z dostępem do sieci wyprowadzonym z ustawienia egress sandbox OpenClaw.                              |
| `approvalsReviewer`                           | `"user"` albo dozwolony recenzent guardian             | Użyj `"auto_review"`, aby pozwolić Codex sprawdzać natywne monity zatwierdzeń, gdy jest to dozwolone, w przeciwnym razie `guardian_subagent` albo `user`. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                                                                                       |
| `serviceTier`                                 | nie ustawiono                                         | Opcjonalna warstwa usługi app-servera Codex. `"priority"` włącza routing trybu szybkiego, `"flex"` żąda przetwarzania flex, `null` czyści nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                                    |
| `networkProxy`                                | wyłączone                                             | Włącza sieć profilu uprawnień Codex dla poleceń app-servera. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją przez `default_permissions` zamiast wysyłać `sandbox`.                                                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                                | Podglądowa opcja włączenia, która rejestruje środowisko Codex oparte na sandbox OpenClaw w app-serverze Codex 0.132.0 lub nowszym, aby natywne wykonywanie Codex mogło działać wewnątrz aktywnego sandbox OpenClaw.                                                                                                                                                                            |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt sandbox Codex.
Po włączeniu OpenClaw ustawia także `features.network_proxy.enabled` i
`default_permissions` w konfiguracji wątku Codex, aby wygenerowany profil
uprawnień mógł uruchomić zarządzaną sieć Codex. Domyślnie OpenClaw generuje
odporną na kolizje nazwę profilu `openclaw-network-<fingerprint>` na podstawie
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

Jeśli normalny runtime app-servera byłby `danger-full-access`, włączenie
`networkProxy` używa dostępu do systemu plików w stylu workspace dla
wygenerowanego profilu uprawnień. Zarządzane przez Codex egzekwowanie sieci to
sieć sandboxowana, więc profil z pełnym dostępem nie chroniłby ruchu
wychodzącego.
Wpisy domen używają `allow` albo `deny`; wpisy gniazd Unix używają wartości
Codex `allow` albo `none`.

Wywołania narzędzi dynamicznych należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie używają
90-sekundowego watchdoga OpenClaw. Dodatni argument `timeoutMs` dla pojedynczego
wywołania wydłuża lub skraca budżet tego konkretnego narzędzia. Narzędzie
`image_generate` używa `agents.defaults.imageGenerationModel.timeoutMs`, gdy
wywołanie narzędzia nie podaje własnego limitu czasu, albo w przeciwnym razie
120-sekundowej wartości domyślnej dla generowania obrazów. Narzędzie `image` do
rozumienia mediów używa `tools.media.image.timeoutSeconds` albo swojej
60-sekundowej wartości domyślnej dla mediów. W przypadku rozumienia obrazów ten
limit czasu dotyczy samego żądania i nie jest skracany przez wcześniejsze prace
przygotowawcze. Budżety narzędzi dynamicznych są ograniczone do 600000 ms. Po
przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia tam, gdzie jest to
obsługiwane, i zwraca do Codex nieudaną odpowiedź narzędzia dynamicznego, aby
tura mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.
Ten watchdog jest zewnętrznym budżetem dynamicznego `item/tool/call`; limity
czasu żądań specyficzne dla dostawcy działają wewnątrz tego wywołania i
zachowują własną semantykę limitu czasu.

Po zaakceptowaniu tury przez Codex oraz po odpowiedzi OpenClaw na żądanie
app-servera ograniczone do tury harness oczekuje, że Codex wykona postęp w
bieżącej turze i ostatecznie zakończy natywną turę za pomocą `turn/completed`.
Jeśli app-server milczy przez `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
w trybie best-effort przerywa turę Codex, zapisuje diagnostyczne przekroczenie
limitu czasu i zwalnia tor sesji OpenClaw, aby kolejne wiadomości czatu nie
czekały za przestarzałą natywną turą. Większość nieterminalnych powiadomień dla
tej samej tury rozbraja ten krótki watchdog, ponieważ Codex wykazał, że tura
nadal działa. Przekazania narzędzi używają dłuższego budżetu bezczynności po
narzędziu: po zwróceniu przez OpenClaw odpowiedzi `item/tool/call`, po
zakończeniu natywnych elementów narzędziowych takich jak `commandExecution`, po
zakończeniach surowego `custom_tool_call_output` oraz po postępie surowej
odpowiedzi asystenta po narzędziu, zakończeniach rozumowania lub postępie
rozumowania. Strażnik używa `appServer.postToolRawAssistantCompletionIdleTimeoutMs`,
gdy jest skonfigurowany, a w przeciwnym razie domyślnie używa pięciu minut. Ten
sam budżet po narzędziu wydłuża również watchdog postępu dla cichego okna
syntezy, zanim Codex wyemituje kolejne zdarzenie bieżącej tury. Globalne
powiadomienia app-servera, takie jak aktualizacje limitów szybkości, nie
resetują postępu bezczynności tury. Zakończenia rozumowania, zakończenia
komentarzowego `agentMessage` i surowy postęp rozumowania lub asystenta przed
narzędziem mogą zostać uzupełnione automatyczną końcową odpowiedzią, więc
używają strażnika odpowiedzi po postępie zamiast natychmiast zwalniać tor sesji.
Tylko końcowe/niekomentarzowe zakończone elementy `agentMessage` oraz surowe
zakończenia asystenta przed narzędziem uzbrajają zwolnienie po wyjściu
asystenta: jeśli Codex potem zamilknie bez `turn/completed`, OpenClaw w trybie
best-effort przerywa natywną turę i zwalnia tor sesji. Bezpieczne do odtworzenia
awarie app-servera stdio, w tym przekroczenia limitu bezczynności zakończenia
tury bez dowodów asystenta, narzędzia, aktywnego elementu lub efektu ubocznego,
są ponawiane raz w świeżej próbie app-servera. Niebezpieczne przekroczenia
limitu czasu nadal wycofują zablokowanego klienta app-servera i zwalniają tor
sesji OpenClaw. Czyszczą również przestarzałe powiązanie natywnego wątku zamiast
odtwarzać je automatycznie. Przekroczenia limitu obserwacji zakończenia
pokazują tekst limitu czasu specyficzny dla Codex: przypadki bezpieczne do
odtworzenia informują, że odpowiedź może być niekompletna, natomiast przypadki
niebezpieczne mówią użytkownikowi, aby zweryfikował bieżący stan przed ponowną
próbą. Publiczna diagnostyka limitów czasu obejmuje pola strukturalne, takie jak
ostatnia metoda powiadomienia app-servera, identyfikator/typ/rola elementu
surowej odpowiedzi asystenta, liczby aktywnych żądań/elementów oraz uzbrojony
stan obserwacji. Gdy ostatnie powiadomienie jest elementem surowej odpowiedzi
asystenta, obejmuje także ograniczony podgląd tekstu asystenta. Nie obejmuje
surowej treści promptu ani narzędzia.

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
Konfiguracja jest preferowana w powtarzalnych wdrożeniach, ponieważ utrzymuje
zachowanie pluginu w tym samym recenzowanym pliku co resztę konfiguracji
harnessu Codex.

## Natywne pluginy Codex

Obsługa natywnych pluginów Codex używa własnych możliwości aplikacji i pluginów
app-servera Codex w tym samym wątku Codex co tura harnessu OpenClaw. OpenClaw
nie tłumaczy pluginów Codex na syntetyczne narzędzia dynamiczne OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa tylko na sesje, które wybierają natywny harness Codex. Nie
ma wpływu na uruchomienia wbudowanego harnessu, zwykłe uruchomienia dostawcy
OpenAI, powiązania konwersacji ACP ani inne harnessy.

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
przeliczana przy każdej turze. Po zmianie `codexPlugins` użyj `/new`, `/reset`
albo zrestartuj gateway, aby przyszłe sesje harnessu Codex startowały ze
zaktualizowanym zestawem aplikacji.

Informacje o kwalifikowalności migracji, inwentarzu aplikacji, polityce działań
destrukcyjnych, elicitation i diagnostyce natywnych pluginów znajdziesz w
[Natywne pluginy Codex](/pl/plugins/codex-native-plugins).

Dostęp do aplikacji i pluginów po stronie OpenAI jest kontrolowany przez
zalogowane konto Codex oraz, w przypadku obszarów roboczych Business i
Enterprise/Edu, przez kontrolki aplikacji obszaru roboczego. Zobacz
[Używanie Codex z planem ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan),
aby uzyskać omówienie konta i kontroli obszaru roboczego w OpenAI.

## Computer Use

Computer Use opisano w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji do sterowania pulpitem ani sam nie
wykonuje działań na pulpicie. Przygotowuje app-server Codex, weryfikuje, że
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex posiadać
natywne wywołania narzędzi MCP podczas tur w trybie Codex.

## Granice runtime

Harness Codex zmienia tylko niskopoziomowy osadzony wykonawca agenta.

- Narzędzia dynamiczne OpenClaw są obsługiwane. Codex prosi OpenClaw o wykonanie
  tych narzędzi, więc OpenClaw pozostaje w ścieżce wykonania.
- Natywne narzędzia powłoki, patchy, MCP i aplikacji Codex należą do Codex.
  OpenClaw może obserwować lub blokować wybrane natywne zdarzenia przez
  obsługiwany relay, ale nie przepisuje argumentów natywnych narzędzi.
- Codex posiada natywną Compaction. OpenClaw utrzymuje lustrzaną kopię transkryptu
  dla historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania
  modelu lub harnessu, ale nie zastępuje compaction Codex podsumowaniem OpenClaw
  ani silnika kontekstu.
- Generowanie mediów, rozumienie mediów, TTS, zatwierdzenia i wyjście narzędzi
  wiadomości nadal przechodzą przez odpowiednie ustawienia dostawcy/modelu
  OpenClaw.
- `tool_result_persist` dotyczy wyników narzędzi transkryptu należących do
  OpenClaw, a nie natywnych rekordów wyników narzędzi Codex.

Informacje o warstwach hooków, obsługiwanych powierzchniach V1, natywnej obsłudze
uprawnień, sterowaniu kolejką, mechanice przesyłania opinii Codex i szczegółach
compaction znajdziesz w
[Runtime harnessu Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** jest to oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*`, włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa wbudowanego harnessu zamiast Codex:** upewnij się, że ref modelu
to `openai/gpt-*` u oficjalnego dostawcy OpenAI oraz że plugin Codex jest
zainstalowany i włączony. Jeśli podczas testowania potrzebujesz ścisłego dowodu,
ustaw `agentRuntime.id: "codex"` dla dostawcy lub modelu. Wymuszony runtime Codex
kończy się błędem zamiast wracać do OpenClaw.

**Runtime OpenAI Codex wraca do ścieżki klucza API:** zbierz zredagowany wycinek
gatewaya pokazujący model, runtime, wybranego dostawcę i awarię. Poproś
dotkniętych problemem współpracowników o uruchomienie tego polecenia tylko do
odczytu na ich hoście OpenClaw:

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

Przydatne wycinki zwykle obejmują `openai/gpt-5.5` lub `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` albo `harnessRuntime`,
`candidateProvider: "openai"` oraz wynik `401`, `Incorrect API key` albo
`No API key`. Poprawione uruchomienie powinno pokazać ścieżkę OAuth OpenAI
zamiast zwykłej awarii klucza API OpenAI.

**Pozostaje konfiguracja refów starszych modeli Codex:** uruchom
`openclaw doctor --fix`. Doctor przepisuje starsze refy modeli na `openai/*`,
usuwa przestarzałe przypięcia runtime dla sesji i całego agenta oraz zachowuje
istniejące nadpisania profili uwierzytelniania.

**App-server jest odrzucany:** użyj app-servera Codex `0.125.0` lub nowszego.
Wersje prerelease tej samej wersji albo wersje z sufiksem kompilacji, takie jak
`0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ OpenClaw testuje
stabilne minimum protokołu `0.125.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy dołączony plugin `codex`
jest włączony, czy `plugins.allow` obejmuje go, gdy skonfigurowano listę
dozwolonych, oraz czy wszelkie niestandardowe `appServer.command`, `url`,
`authToken` lub nagłówki są prawidłowe.

**Wykrywanie modeli jest powolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie. Zobacz
[Dokumentacja referencyjna harnessu Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket natychmiast zawodzi:** sprawdź `appServer.url`, `authToken`,
nagłówki oraz to, czy zdalny app-server mówi tą samą wersją protokołu app-servera
Codex.

**Natywna powłoka lub narzędzia patch są blokowane komunikatem `Native hook relay unavailable`:**
wątek Codex nadal próbuje użyć natywnego identyfikatora hook relay, którego
OpenClaw już nie ma zarejestrowanego. To problem natywnego transportu hooków
Codex, a nie awaria backendu ACP, dostawcy, GitHub ani polecenia powłoki.
Rozpocznij świeżą sesję w dotkniętym czacie za pomocą `/new` lub `/reset`, a
następnie ponów nieszkodliwe polecenie. Jeśli zadziała raz, ale kolejne natywne
wywołanie narzędzia znowu się nie powiedzie, traktuj `/new` wyłącznie jako
tymczasowe obejście: skopiuj prompt do świeżej sesji po ponownym uruchomieniu
app-servera Codex lub OpenClaw Gateway, aby stare wątki zostały porzucone, a
natywne rejestracje hooków odtworzone.

**Model inny niż Codex używa wbudowanego harnessu:** jest to oczekiwane, chyba
że polityka runtime dostawcy lub modelu kieruje go do innego harnessu. Zwykłe
refy dostawców innych niż OpenAI pozostają na swojej normalnej ścieżce dostawcy
w trybie `auto`.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` w nowej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj opisanej wyżej procedury odzyskiwania natywnego przekaźnika hooków. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use).

## Powiązane

- [Dokumentacja referencyjna środowiska Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe środowiska Codex](/pl/plugins/codex-harness-runtime)
- [Natywne Pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pomoc OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Pluginy środowiska agentów](/pl/plugins/sdk-agent-harness)
- [Hooki Pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Status](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
