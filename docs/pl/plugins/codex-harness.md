---
read_when:
    - Chcesz używać dołączonego harnessu serwera aplikacji Codex
    - Potrzebujesz przykładów konfiguracji harnessu Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na OpenClaw
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pomocą dołączonego harnessu Codex app-server
title: Harness Codex
x-i18n:
    generated_at: "2026-07-04T11:06:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agentów OpenAI
przez Codex app-server zamiast wbudowanego harnessu OpenClaw.

Użyj harnessu Codex, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
natywnym wznawianiem wątków, natywną kontynuacją narzędzi, natywną compaction oraz
wykonywaniem app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem
modelu, dynamicznymi narzędziami OpenClaw, zatwierdzeniami, dostarczaniem multimediów i widocznym
lustrem transkrypcji.

Standardowa konfiguracja używa kanonicznych referencji modeli OpenAI, takich jak `openai/gpt-5.5`.
Nie konfiguruj starszych referencji Codex GPT. Umieść kolejność uwierzytelniania agenta OpenAI
w `auth.order.openai`; starsze identyfikatory profili uwierzytelniania Codex oraz
starsze wpisy kolejności uwierzytelniania Codex to stan legacy naprawiany przez
`openclaw doctor --fix`.

Gdy żaden sandbox OpenClaw nie jest aktywny, OpenClaw uruchamia wątki Codex app-server
z włączonym natywnym trybem kodu Codex, pozostawiając domyślnie wyłączony tryb tylko-kod.
Dzięki temu natywny obszar roboczy i możliwości kodu Codex pozostają dostępne, podczas gdy
dynamiczne narzędzia OpenClaw nadal przechodzą przez most app-server `item/tool/call`.
Aktywny sandboxing OpenClaw i restrykcyjne polityki narzędzi całkowicie wyłączają natywny tryb kodu,
chyba że włączysz eksperymentalną ścieżkę sandbox exec-server.

Ta natywna funkcja Codex jest oddzielna od
[trybu kodu OpenClaw](/pl/reference/code-mode), który jest opcjonalnym środowiskiem uruchomieniowym QuickJS-WASI
dla ogólnych uruchomień OpenClaw z innym kształtem wejścia `exec`.

Szerszy podział modelu, providera i środowiska uruchomieniowego zacznij od
[Środowisk uruchomieniowych agentów](/pl/concepts/agent-runtimes). W skrócie:
`openai/gpt-5.5` jest referencją modelu, `codex` jest środowiskiem uruchomieniowym, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Wymagania

- OpenClaw z dostępnym dołączonym Pluginem `codex`.
- Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij `codex`.
- Codex app-server `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarium Codex app-server, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na standardowe uruchamianie harnessu.
- Uwierzytelnianie Codex dostępne przez `openclaw models auth login --provider openai`,
  konto app-server w katalogu domowym Codex agenta albo jawny profil uwierzytelniania Codex z kluczem API.

Pierwszeństwo uwierzytelniania, izolację środowiska, niestandardowe polecenia app-server, wykrywanie modeli
i wszystkie pola konfiguracji opisuje
[referencja harnessu Codex](/pl/plugins/codex-harness-reference).

## Szybki start

Większość użytkowników, którzy chcą Codex w OpenClaw, potrzebuje tej ścieżki: zaloguj się przy użyciu
subskrypcji ChatGPT/Codex, włącz dołączony Plugin `codex` i użyj
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

Po zmianie konfiguracji Plugina uruchom ponownie Gateway. Jeśli istniejący czat ma już
sesję, użyj `/new` lub `/reset` przed testowaniem zmian środowiska uruchomieniowego, aby następna
tura rozwiązała harness z bieżącej konfiguracji.

## Współdzielenie wątków z Codex Desktop i CLI

Domyślne `appServer.homeScope: "agent"` izoluje każdego agenta OpenClaw
od natywnego stanu Codex operatora. Aby właściciel mógł poprosić OpenClaw o sprawdzenie
i zarządzanie tymi samymi natywnymi wątkami, które pokazują Codex Desktop i Codex CLI,
włącz katalog domowy użytkownika Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Tryb katalogu domowego użytkownika jest dostępny tylko z lokalnym transportem stdio. Używa
`$CODEX_HOME`, gdy jest ustawione, a w przeciwnym razie `~/.codex`, w tym natywnego
uwierzytelniania Codex, konfiguracji, Pluginów i magazynu wątków z tego katalogu. OpenClaw nie wstrzykuje
profilu uwierzytelniania OpenClaw do tego app-server.

Tury właściciela zyskują narzędzie `codex_threads`. Może ono wyświetlać, wyszukiwać, odczytywać, forkować,
zmieniać nazwy, archiwizować i przywracać natywne wątki. Poproś agenta o fork wątku, gdy
chcesz kontynuować go w OpenClaw; fork jest dołączany do bieżącej
sesji OpenClaw i pozostaje widoczny dla innych natywnych klientów Codex. Archiwizacja
wymaga jawnego potwierdzenia, że wątek jest zamknięty gdzie indziej.

Nie wznawiaj ani nie zapisuj tego samego wątku jednocześnie z OpenClaw i innego
klienta Codex. Codex koordynuje aktywnych zapisujących w jednym procesie app-server, nie
między niezależnymi procesami Desktop, CLI i OpenClaw. Forkowanie tworzy
oddzielną kontynuację i jest bezpieczną ścieżką współistnienia.

## Konfiguracja

Konfiguracja szybkiego startu to minimalna działająca konfiguracja harnessu Codex. Ustaw opcje
harnessu Codex w konfiguracji OpenClaw, a CLI używaj tylko do uwierzytelniania Codex:

| Potrzeba                               | Ustaw                                                                            | Gdzie                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Włączenie harnessu                     | `plugins.entries.codex.enabled: true`                                            | konfiguracja OpenClaw              |
| Zachowanie instalacji Plugina z allowlisty | Uwzględnij `codex` w `plugins.allow`                                             | konfiguracja OpenClaw              |
| Kierowanie tur agentów OpenAI przez Codex | `agents.defaults.model` lub `agents.list[].model` jako `openai/gpt-*`            | konfiguracja agenta OpenClaw       |
| Logowanie przez ChatGPT/Codex OAuth    | `openclaw models auth login --provider openai`                                   | profil uwierzytelniania CLI        |
| Dodanie zapasowego klucza API dla uruchomień Codex | profil klucza API `openai:*` wymieniony po uwierzytelnianiu subskrypcją w `auth.order.openai` | profil uwierzytelniania CLI + konfiguracja OpenClaw |
| Zawodzenie w trybie zamkniętym, gdy Codex jest niedostępny | `agentRuntime.id: "codex"` providera lub modelu                                  | konfiguracja modelu/providera OpenClaw |
| Użycie bezpośredniego ruchu API OpenAI | `agentRuntime.id: "openclaw"` providera lub modelu ze standardowym uwierzytelnianiem OpenAI | konfiguracja modelu/providera OpenClaw |
| Dostrajanie zachowania app-server      | `plugins.entries.codex.config.appServer.*`                                       | konfiguracja Plugina Codex         |
| Włączanie natywnych aplikacji Pluginów Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | konfiguracja Plugina Codex         |
| Włączanie Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | konfiguracja Plugina Codex         |

Używaj referencji modeli `openai/gpt-*` dla tur agentów OpenAI obsługiwanych przez Codex. Preferuj
`auth.order.openai`, aby ustawić kolejność najpierw-subskrypcja/zapasowy-klucz-API. Istniejące
starsze identyfikatory profili uwierzytelniania Codex i starsza kolejność uwierzytelniania Codex są
stanem legacy wyłącznie dla doctor; nie zapisuj nowych starszych referencji Codex GPT.

Nie ustawiaj `compaction.model` ani `compaction.provider` na agentach obsługiwanych przez Codex.
Codex wykonuje compaction przez natywny stan wątku app-server, więc OpenClaw ignoruje
te lokalne nadpisania summarizera w czasie działania, a `openclaw doctor --fix` usuwa
je, gdy agent używa Codex.

Lossless pozostaje obsługiwany jako silnik kontekstu do składania, pozyskiwania i
utrzymania wokół tur Codex. Skonfiguruj go przez
`plugins.slots.contextEngine: "lossless-claw"` i
`plugins.entries.lossless-claw.config.summaryModel`, nie przez
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migruje stary
kształt `compaction.provider: "lossless-claw"` do slotu silnika kontekstu Lossless,
gdy Codex jest aktywnym środowiskiem uruchomieniowym, ale natywny Codex nadal zarządza compaction.

Natywny harness Codex app-server obsługuje silniki kontekstu, które wymagają
składania przed promptem. Ogólne backendy CLI, w tym `codex-cli`, nie zapewniają
tej możliwości hosta.

Dla agentów obsługiwanych przez Codex `/compact` uruchamia natywną compaction Codex app-server na
powiązanym wątku. OpenClaw nie czeka na zakończenie, nie narzuca timeoutu OpenClaw,
nie restartuje współdzielonego app-server ani nie przełącza awaryjnie na silnik kontekstu lub
publiczny summarizer OpenAI. Jeśli natywne powiązanie wątku Codex jest brakujące albo
nieaktualne, polecenie zawodzi w trybie zamkniętym, aby operator widział prawdziwą granicę środowiska uruchomieniowego
zamiast cichego przełączenia backendów compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

W tym kształcie oba profile nadal przechodzą przez Codex dla tur agentów `openai/gpt-*`.
Klucz API jest tylko zapasowym uwierzytelnianiem, a nie żądaniem przełączenia na OpenClaw lub
zwykłe OpenAI Responses.

Reszta tej strony omawia typowe warianty, między którymi użytkownicy muszą wybrać:
kształt wdrożenia, routing z zawodzeniem w trybie zamkniętym, politykę zatwierdzania przez opiekuna, natywne Pluginy Codex
i Computer Use. Pełne listy opcji, wartości domyślne, enumy, wykrywanie,
izolację środowiska, timeouty i pola transportu app-server opisuje
[referencja harnessu Codex](/pl/plugins/codex-harness-reference).

## Weryfikacja środowiska uruchomieniowego Codex

Użyj `/status` na czacie, na którym oczekujesz Codex. Tura agenta OpenAI
obsługiwana przez Codex pokazuje:

```text
Runtime: OpenAI Codex
```

Następnie sprawdź stan Codex app-server:

```text
/codex status
/codex models
```

`/codex status` raportuje łączność app-server, konto, limity szybkości, serwery MCP
i Skills. `/codex models` wyświetla live katalog Codex app-server dla
harnessu i konta. Jeśli `/status` jest zaskakujące, zobacz
[Rozwiązywanie problemów](#troubleshooting).

## Routing i wybór modelu

Oddziel referencje providerów od polityki środowiska uruchomieniowego:

- Używaj `openai/gpt-*` dla tur agentów OpenAI przez Codex.
- Nie używaj starszych referencji Codex GPT w konfiguracji. Uruchom `openclaw doctor --fix`, aby
  naprawić starsze referencje i nieaktualne przypięcia tras sesji.
- `agentRuntime.id: "codex"` jest opcjonalne w standardowym trybie automatycznym OpenAI, ale przydatne,
  gdy wdrożenie powinno zawieść w trybie zamkniętym, jeśli Codex jest niedostępny.
- `agentRuntime.id: "openclaw"` przełącza providera lub model na osadzone
  środowisko uruchomieniowe OpenClaw, gdy jest to zamierzone.
- `/codex ...` steruje natywnymi konwersacjami Codex app-server z czatu.
- ACP/acpx to oddzielna ścieżka zewnętrznego harnessu. Używaj jej tylko wtedy, gdy użytkownik prosi
  o ACP/acpx albo zewnętrzny adapter harnessu.

Typowy routing poleceń:

| Intencja użytkownika                                           | Użyj                                                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Dołącz bieżący czat                                            | `/codex bind [--cwd <path>]`                                                                          |
| Wznów istniejący wątek Codex                                   | `/codex resume <thread-id>`                                                                           |
| Wyświetl lub filtruj wątki Codex                               | `/codex threads [filter]`                                                                             |
| Wyświetl natywne pluginy Codex                                 | `/codex plugins list`                                                                                 |
| Włącz lub wyłącz skonfigurowany natywny plugin Codex           | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Dołącz istniejącą sesję Codex CLI na sparowanym węźle          | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| Wyślij tylko opinię Codex                                      | `/codex diagnostics [note]`                                                                           |
| Uruchom zadanie ACP/acpx                                       | Polecenia sesji ACP/acpx, nie `/codex`                                                               |

| Przypadek użycia                                      | Konfiguracja                                                           | Weryfikacja                             | Uwagi                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | -------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym runtime Codex    | `openai/gpt-*` plus enabled `codex` plugin                             | `/status` shows `Runtime: OpenAI Codex` | Zalecana ścieżka                       |
| Zamknij z błędem, jeśli Codex jest niedostępny        | Provider or model `agentRuntime.id: "codex"`                           | Turn fails instead of embedded fallback | Użyj dla wdrożeń wyłącznie Codex       |
| Kieruj ruch z kluczem API OpenAI przez OpenClaw       | Provider or model `agentRuntime.id: "openclaw"` and normal OpenAI auth | `/status` shows OpenClaw runtime        | Użyj tylko, gdy OpenClaw jest celowy   |
| Starsza konfiguracja                                  | legacy Codex GPT refs                                                  | `openclaw doctor --fix` rewrites it     | Nie zapisuj nowej konfiguracji w ten sposób |
| Adapter ACP/acpx Codex                                | ACP `sessions_spawn({ runtime: "acp" })`                               | Status zadania/sesji ACP                | Oddzielne od natywnego harness Codex   |

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj `openai/gpt-*`
dla zwykłej ścieżki OpenAI oraz `codex/gpt-*` tylko wtedy, gdy rozumienie obrazów
powinno działać przez ograniczoną turę serwera aplikacji Codex. Nie używaj
starszych odwołań Codex GPT; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.

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

### Wdrożenie Codex zamykane błędem

Dla tur agentów OpenAI `openai/gpt-*` już rozwiązuje się do Codex, gdy
dołączony plugin jest dostępny. Dodaj jawną politykę runtime, gdy chcesz mieć
zapisaną regułę zamykania błędem:

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

Przy wymuszonym Codex OpenClaw kończy wcześnie błędem, jeśli plugin Codex jest
wyłączony, serwer aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić.

## Polityka serwera aplikacji

Domyślnie plugin uruchamia lokalnie zarządzany przez OpenClaw plik binarny Codex
z transportem stdio. Ustaw `appServer.command` tylko wtedy, gdy celowo chcesz
uruchomić inny plik wykonywalny. Używaj transportu WebSocket tylko wtedy, gdy
serwer aplikacji już działa gdzie indziej:

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
lokalnego operatora: `approvalPolicy: "never"`, `approvalsReviewer: "user"` i
`sandbox: "danger-full-access"`. Jeśli lokalne wymagania Codex nie zezwalają na
tę niejawną postawę YOLO, OpenClaw wybiera zamiast tego dozwolone uprawnienia
guardian. Gdy dla sesji aktywny jest sandbox OpenClaw, OpenClaw wyłącza natywny
Code Mode Codex, serwery MCP użytkownika oraz wykonywanie pluginów wspieranych
przez aplikacje dla tej tury, zamiast polegać na sandboxingu po stronie hosta
Codex. Dostęp do powłoki jest wystawiany przez dynamiczne narzędzia oparte na
sandbox OpenClaw, takie jak `sandbox_exec` i `sandbox_process`, gdy dostępne są
zwykłe narzędzia exec/process.

Użyj znormalizowanego trybu exec OpenClaw, gdy chcesz natywnego auto-review Codex
przed wyjściem poza sandbox lub dodatkowymi uprawnieniami:

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
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` i
`sandbox: "workspace-write"`, gdy lokalne wymagania dopuszczają te wartości.
W `tools.exec.mode: "auto"` OpenClaw nie zachowuje starszych niebezpiecznych
nadpisań Codex `approvalPolicy: "never"` ani `sandbox: "danger-full-access"`;
użyj `tools.exec.mode: "full"` dla celowej postawy Codex bez zatwierdzeń. Starszy
preset `plugins.entries.codex.config.appServer.mode: "guardian"` nadal działa,
ale `tools.exec.mode: "auto"` jest znormalizowaną powierzchnią OpenClaw.

Porównanie na poziomie trybów z zatwierdzeniami host exec i uprawnieniami ACPX
znajdziesz w [Tryby uprawnień](/pl/tools/permission-modes).

Wszystkie pola serwera aplikacji, kolejność uwierzytelniania, izolację
środowiska, wykrywanie i zachowanie limitów czasu opisuje
[Dokumentacja referencyjna harness Codex](/pl/plugins/codex-harness-reference).

## Polecenia i diagnostyka

Dołączony plugin rejestruje `/codex` jako polecenie slash w każdym kanale, który
obsługuje polecenia tekstowe OpenClaw.

Natywne wykonywanie i sterowanie wymagają właściciela lub klienta Gateway
`operator.admin`. Obejmuje to wiązanie lub wznawianie wątków, wysyłanie albo
zatrzymywanie tur, zmianę modelu, trybu szybkiego lub stanu uprawnień, Compaction
albo review oraz odłączanie wiązania. Inni autoryzowani nadawcy zachowują tylko
polecenia odczytu statusu, pomocy, konta, modelu, wątku, serwera MCP, skill,
oraz inspekcji wiązań.

Typowe formy:

- `/codex status` sprawdza łączność z serwerem aplikacji, modele, konto, limity
  stawek, serwery MCP i Skills.
- `/codex models` wyświetla modele działającego serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki serwera aplikacji Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego
  wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o kompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywne review Codex dla dołączonego wątku.
- `/codex diagnostics [note]` prosi o potwierdzenie przed wysłaniem opinii Codex
  dla dołączonego wątku.
- `/codex account` pokazuje konto i status limitów stawek.
- `/codex mcp` wyświetla status serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

W przypadku większości zgłoszeń do wsparcia zacznij od `/diagnostics [note]` w
rozmowie, w której wystąpił błąd. Tworzy to jeden raport diagnostyczny Gateway i,
dla sesji harness Codex, prosi o zgodę na wysłanie odpowiedniego pakietu opinii
Codex. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać model
prywatności i zachowanie w czatach grupowych.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostyki
Gateway.

### Lokalna inspekcja wątków Codex

Najszybszym sposobem zbadania nieudanego uruchomienia Codex jest często
bezpośrednie otwarcie natywnego wątku Codex:

```bash
codex resume <thread-id>
```

Pobierz identyfikator wątku z ukończonej odpowiedzi `/diagnostics`, `/codex binding`
lub `/codex threads [filter]`.

Mechanikę przesyłania i granice diagnostyki na poziomie runtime opisuje
[Runtime harness Codex](/pl/plugins/codex-harness-runtime#codex-feedback-upload).

W domyślnym katalogu home na agenta uwierzytelnianie jest wybierane w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej pod
   `auth.order.openai`. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
   identyfikatory profili uwierzytelniania Codex i starszą kolejność
   uwierzytelniania Codex.
2. Istniejące konto serwera aplikacji w katalogu home Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`,
   następnie `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a
   uwierzytelnianie OpenAI jest nadal wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT,
usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z procesu potomnego uruchamianego Codex.
Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub
bezpośrednich modeli OpenAI, bez przypadkowego rozliczania natywnych tur serwera
aplikacji Codex przez API. Jawne profile klucza API Codex i lokalny fallback
klucza ze środowiska stdio używają logowania serwera aplikacji zamiast
odziedziczonego środowiska procesu potomnego. Połączenia WebSocket z serwerem
aplikacji nie otrzymują fallbacku klucza API środowiska Gateway; użyj jawnego
profilu uwierzytelniania albo własnego konta zdalnego serwera aplikacji.
Gdy skonfigurowane są natywne pluginy Codex, OpenClaw instaluje lub odświeża te
pluginy przez połączony serwer aplikacji przed wystawieniem aplikacji należących
do pluginów wątkowi Codex. `app/list` pozostaje źródłem prawdy dla identyfikatorów
aplikacji, dostępności i metadanych, ale OpenClaw odpowiada za decyzję włączenia
na poziomie wątku: jeśli polityka pozwala na wymienioną dostępną aplikację,
OpenClaw wysyła `thread/start.config.apps[appId].enabled = true`, nawet gdy
`app/list` obecnie zgłasza tę aplikację jako wyłączoną. Ta ścieżka nie wymyśla
instalacji aplikacji dla nieznanych identyfikatorów; OpenClaw aktywuje tylko
pluginy marketplace za pomocą `plugin/install`, a następnie odświeża inwentarz.

Jeśli profil subskrypcji osiągnie limit użycia Codex, OpenClaw zapisuje czas
resetu, gdy Codex go zgłosi, i próbuje następnego uporządkowanego profilu
uwierzytelniania dla tego samego uruchomienia Codex. Po upływie czasu resetu
profil subskrypcji znów kwalifikuje się do użycia bez zmiany wybranego modelu
`openai/gpt-*` ani runtime Codex.

W przypadku lokalnych uruchomień serwera aplikacji stdio OpenClaw ustawia `CODEX_HOME` na katalog przypisany do agenta, aby konfiguracja Codex, pliki uwierzytelniania/konta, pamięć podręczna/dane Pluginu oraz natywny stan wątku domyślnie nie odczytywały ani nie zapisywały osobistego `~/.codex` operatora. OpenClaw zachowuje normalny proces `HOME`; podprocesy uruchamiane przez Codex nadal mogą znajdować konfigurację i tokeny z katalogu domowego użytkownika, a Codex może wykrywać współdzielone wpisy `$HOME/.agents/skills` i `$HOME/.agents/plugins/marketplace.json`. Z `appServer.homeScope: "user"` OpenClaw zamiast tego używa natywnego katalogu domowego Codex użytkownika i jego istniejącego konta bez wstrzykiwania profilu uwierzytelniania OpenClaw.

Jeśli wdrożenie wymaga dodatkowej izolacji środowiska, dodaj te zmienne do `appServer.clearEnv`:

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

`appServer.clearEnv` wpływa tylko na podrzędny proces serwera aplikacji Codex, który został uruchomiony. OpenClaw usuwa `CODEX_HOME` i `HOME` z tej listy podczas normalizacji lokalnego uruchomienia: `CODEX_HOME` pozostaje skierowane na wybrany zakres agenta lub użytkownika, a `HOME` pozostaje odziedziczone, aby podprocesy mogły używać normalnego stanu katalogu domowego użytkownika.

Narzędzia dynamiczne Codex domyślnie używają ładowania `searchable`. OpenClaw nie udostępnia narzędzi dynamicznych, które duplikują natywne operacje Codex w obszarze roboczym: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` i `update_plan`. Większość pozostałych narzędzi integracyjnych OpenClaw, takich jak wiadomości, media, Cron, przeglądarka, węzły, Gateway i `heartbeat_respond`, jest dostępna przez wyszukiwanie narzędzi Codex w przestrzeni nazw `openclaw`, dzięki czemu początkowy kontekst modelu jest mniejszy. Wyszukiwanie w sieci domyślnie używa hostowanego narzędzia `web_search` Codex, gdy wyszukiwanie jest włączone i nie wybrano zarządzanego dostawcy. Natywne hostowane wyszukiwanie i zarządzane przez OpenClaw narzędzie dynamiczne `web_search` wzajemnie się wykluczają, aby zarządzane wyszukiwanie nie mogło ominąć natywnych ograniczeń domen. OpenClaw używa zarządzanego narzędzia, gdy hostowane wyszukiwanie jest niedostępne, jawnie wyłączone lub zastąpione przez wybranego zarządzanego dostawcę. OpenClaw utrzymuje samodzielne rozszerzenie `web.run` Codex jako wyłączone, ponieważ produkcyjny ruch serwera aplikacji odrzuca jego definiowaną przez użytkownika przestrzeń nazw `web`. `tools.web.search.enabled: false` wyłącza obie ścieżki, podobnie jak przebiegi tylko LLM z wyłączonymi narzędziami. Codex traktuje `"cached"` jako preferencję i rozwiązuje ją do aktywnego dostępu zewnętrznego dla nieograniczonych tur serwera aplikacji. Automatyczny zarządzany fallback kończy się zamknięciem dostępu, gdy ustawiono natywne `allowedDomains`, aby nie można było obejść listy dozwolonych domen. Trwałe zmiany efektywnej polityki wyszukiwania rotują powiązany wątek Codex przed następną turą. Tymczasowe ograniczenia na turę używają tymczasowego ograniczonego wątku i zachowują istniejące powiązanie do późniejszego wznowienia. Odpowiedzi źródłowe `sessions_yield` i wyłącznie z narzędzia wiadomości pozostają bezpośrednie, ponieważ są to kontrakty sterowania turą. `sessions_spawn` pozostaje wyszukiwalne, aby natywne `spawn_agent` Codex pozostało podstawową powierzchnią podagentów Codex, podczas gdy jawna delegacja OpenClaw lub ACP jest nadal dostępna przez przestrzeń nazw narzędzi dynamicznych `openclaw`. Instrukcje współpracy Heartbeat mówią Codex, aby przed zakończeniem tury Heartbeat wyszukał `heartbeat_respond`, gdy narzędzie nie jest jeszcze załadowane.

Ustaw `codexDynamicToolsLoading: "direct"` tylko podczas łączenia z niestandardowym serwerem aplikacji Codex, który nie może wyszukiwać odroczonych narzędzi dynamicznych, albo podczas debugowania pełnego ładunku narzędzi.

Obsługiwane pola Pluginu Codex najwyższego poziomu:

| Pole                       | Domyślnie      | Znaczenie                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Użyj `"direct"`, aby umieścić narzędzia dynamiczne OpenClaw bezpośrednio w początkowym kontekście narzędzi Codex. |
| `codexDynamicToolsExclude` | `[]`           | Dodatkowe nazwy narzędzi dynamicznych OpenClaw do pominięcia w turach serwera aplikacji Codex. |
| `codexPlugins`             | wyłączone      | Natywna obsługa Pluginów/aplikacji Codex dla migrowanych, kuratorowanych Pluginów zainstalowanych ze źródła. |

Obsługiwane pola `appServer`:

| Pole                                          | Domyślne                                                | Znaczenie                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                               | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                                                                                                                                                                     |
| `homeScope`                                   | `"agent"`                                               | `"agent"` izoluje stan Codex dla każdego agenta OpenClaw. `"user"` współdzieli natywne `$CODEX_HOME` lub `~/.codex`, używa natywnego uwierzytelniania i włącza zarządzanie wątkami tylko przez właściciela. Zakres użytkownika wymaga stdio.                                                                                                                                                   |
| `command`                                     | zarządzany plik binarny Codex                           | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustawiaj tylko w celu jawnego nadpisania.                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`                | Argumenty dla transportu stdio.                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | nieustawione                                            | Adres URL WebSocket app-server.                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | nieustawione                                            | Token Bearer dla transportu WebSocket. Akceptuje dosłowny ciąg znaków lub SecretInput, taki jak `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                    | Dodatkowe nagłówki WebSocket. Wartości nagłówków akceptują dosłowne ciągi znaków lub wartości SecretInput, na przykład `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                    | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu stdio app-server po zbudowaniu przez OpenClaw dziedziczonego środowiska. OpenClaw zachowuje wybrane `CODEX_HOME` i dziedziczone `HOME` dla lokalnych uruchomień.                                                                                                                                                    |
| `codeModeOnly`                                | `false`                                                 | Włącza powierzchnię narzędzi Codex tylko w trybie kodu. Dynamiczne narzędzia OpenClaw pozostają zarejestrowane w Codex, dzięki czemu zagnieżdżone wywołania `tools.*` wracają przez most app-server `item/tool/call`.                                                                                                                                                                            |
| `remoteWorkspaceRoot`                         | nieustawione                                            | Zdalny katalog główny obszaru roboczego app-server Codex. Gdy jest ustawiony, OpenClaw wyprowadza lokalny katalog główny obszaru roboczego z rozwiązanego obszaru roboczego OpenClaw, zachowuje bieżący sufiks cwd pod tym zdalnym katalogiem głównym i wysyła do Codex tylko końcowe cwd app-server. Jeśli cwd znajduje się poza rozwiązanym katalogiem głównym obszaru roboczego OpenClaw, OpenClaw kończy działanie w trybie fail-closed zamiast wysyłać ścieżkę lokalną dla Gateway do zdalnego app-server. |
| `requestTimeoutMs`                            | `60000`                                                 | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                 | Okno ciszy po zaakceptowaniu tury przez Codex lub po żądaniu app-server o zakresie tury, gdy OpenClaw czeka na `turn/completed`.                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                                | Ochrona bezczynności ukończenia i postępu używana po przekazaniu narzędziu, ukończeniu natywnego narzędzia, surowym postępie asystenta po narzędziu, ukończeniu surowego rozumowania lub postępie rozumowania, gdy OpenClaw czeka na `turn/completed`. Używaj tego dla zaufanych lub ciężkich obciążeń, w których synteza po narzędziu może zasadnie pozostawać cicha dłużej niż końcowy budżet wydania asystenta. |
| `mode`                                        | `"yolo"`, chyba że lokalne wymagania Codex wykluczają YOLO | Ustawienie wstępne dla wykonania YOLO lub wykonania recenzowanego przez strażnika. Lokalne wymagania stdio, które pomijają zatwierdzenie `danger-full-access`, `never` albo recenzenta `user`, ustawiają strażnika jako domyślną wartość niejawną.                                                                                                                                               |
| `approvalPolicy`                              | `"never"` lub dozwolona polityka zatwierdzania strażnika | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku/turze. Domyślne ustawienia strażnika preferują `"on-request"`, gdy jest dozwolone.                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` lub dozwolony sandbox strażnika  | Natywny tryb sandbox Codex wysyłany przy rozpoczęciu/wznowieniu wątku. Domyślne ustawienia strażnika preferują `"workspace-write"`, gdy jest dozwolone, w przeciwnym razie `"read-only"`. Gdy sandbox OpenClaw jest aktywny, tury `danger-full-access` używają Codex `workspace-write` z dostępem do sieci wyprowadzonym z ustawienia wyjścia sandbox OpenClaw.                                  |
| `approvalsReviewer`                           | `"user"` lub dozwolony recenzent strażnika              | Użyj `"auto_review"`, aby pozwolić Codex recenzować natywne monity zatwierdzeń, gdy jest to dozwolone; w przeciwnym razie `guardian_subagent` albo `user`. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                                                                                       |
| `serviceTier`                                 | nieustawione                                            | Opcjonalna warstwa usługi app-server Codex. `"priority"` włącza routing w trybie szybkim, `"flex"` żąda przetwarzania elastycznego, `null` czyści nadpisanie, a starsze `"fast"` jest akceptowane jako `"priority"`.                                                                                                                                                                             |
| `networkProxy`                                | wyłączone                                               | Włącza sieć profilu uprawnień Codex dla poleceń app-server. OpenClaw definiuje wybraną konfigurację `permissions.<profile>.network` i wybiera ją za pomocą `default_permissions` zamiast wysyłania `sandbox`.                                                                                                                                                                                   |
| `experimental.sandboxExecServer`              | `false`                                                 | Podglądowa opcja zgody, która rejestruje środowisko Codex wspierane sandboxem OpenClaw w Codex app-server 0.132.0 lub nowszym, aby natywne wykonywanie Codex mogło działać w aktywnym sandboxie OpenClaw.                                                                                                                                                                                       |

`appServer.networkProxy` jest jawne, ponieważ zmienia kontrakt sandbox Codex.
Po włączeniu OpenClaw ustawia też `features.network_proxy.enabled` oraz
`default_permissions` w konfiguracji wątku Codex, aby wygenerowany profil uprawnień
mógł uruchomić zarządzaną sieć Codex. Domyślnie OpenClaw generuje odporną
na kolizje nazwę profilu `openclaw-network-<fingerprint>` na podstawie treści
profilu; używaj `profileName` tylko wtedy, gdy wymagana jest stabilna lokalna nazwa.

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

Jeśli normalne środowisko wykonawcze serwera aplikacji miałoby wartość `danger-full-access`, włączenie
`networkProxy` używa dostępu do systemu plików w stylu przestrzeni roboczej dla wygenerowanego
profilu uprawnień. Zarządzane przez Codex wymuszanie sieci jest siecią sandboxowaną,
więc profil pełnego dostępu nie chroniłby ruchu wychodzącego.
Wpisy domen używają `allow` lub `deny`; wpisy gniazd Unix używają wartości
`allow` lub `none` Codex.

Dynamiczne wywołania narzędzi należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: żądania Codex `item/tool/call` domyślnie używają 90-sekundowego
watchdoga OpenClaw. Dodatni argument `timeoutMs` dla pojedynczego wywołania wydłuża
lub skraca budżet tego konkretnego narzędzia. Narzędzie `image_generate` używa
`agents.defaults.imageGenerationModel.timeoutMs`, gdy wywołanie narzędzia nie
podaje własnego limitu czasu, albo w przeciwnym razie 120-sekundowej wartości domyślnej
dla generowania obrazów. Narzędzie `image` do rozumienia mediów używa
`tools.media.image.timeoutSeconds` lub swojej 60-sekundowej wartości domyślnej dla mediów. W przypadku
rozumienia obrazów ten limit czasu dotyczy samego żądania i nie jest
pomniejszany przez wcześniejsze prace przygotowawcze. Budżety narzędzi dynamicznych są
ograniczone do 600000 ms. Po przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia
tam, gdzie jest to obsługiwane, i zwraca do Codex nieudaną odpowiedź narzędzia dynamicznego, aby tura
mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.
Ten watchdog jest zewnętrznym budżetem dynamicznego `item/tool/call`; specyficzne dla dostawcy
limity czasu żądań działają wewnątrz tego wywołania i zachowują własną semantykę limitu czasu.

Po zaakceptowaniu tury przez Codex oraz po tym, jak OpenClaw odpowie na żądanie
serwera aplikacji ograniczone zakresem tury, harness oczekuje, że Codex będzie robić postęp w bieżącej turze i
ostatecznie zakończy natywną turę za pomocą `turn/completed`. Jeśli serwer aplikacji
milczy przez `appServer.turnCompletionIdleTimeoutMs`, OpenClaw w trybie best-effort
przerywa turę Codex, zapisuje diagnostyczne przekroczenie limitu czasu i zwalnia tor
sesji OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za przestarzałą
natywną turą. Większość nieterminalnych powiadomień dla tej samej tury rozbraja ten krótki
watchdog, ponieważ Codex udowodnił, że tura nadal żyje. Przekazania narzędzi używają
dłuższego budżetu bezczynności po narzędziu: po zwróceniu przez OpenClaw odpowiedzi
`item/tool/call`, po zakończeniu natywnych elementów narzędzi, takich jak `commandExecution`, po surowych
zakończeniach `custom_tool_call_output` oraz po surowym postępie asystenta po narzędziu,
zakończeniach rozumowania lub postępie rozumowania. Strażnik używa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, gdy jest skonfigurowane, a w przeciwnym razie
domyślnie pięciu minut. Ten sam budżet po narzędziu rozszerza też
watchdog postępu dla cichego okna syntezy, zanim Codex wyemituje następne
zdarzenie bieżącej tury. Globalne powiadomienia serwera aplikacji, takie jak aktualizacje limitów szybkości,
nie resetują postępu bezczynności tury. Zakończenia rozumowania, zakończenia
`agentMessage` w komentarzu oraz surowy postęp rozumowania lub asystenta przed narzędziem mogą
zostać uzupełnione automatyczną odpowiedzią końcową, więc używają strażnika odpowiedzi po postępie
zamiast natychmiast zwalniać tor sesji. Tylko
końcowe/niekomentarzowe ukończone elementy `agentMessage` oraz surowe
zakończenia asystenta przed narzędziem uzbrajają zwolnienie po wyjściu asystenta: jeśli Codex potem milczy
bez `turn/completed`, OpenClaw w trybie best-effort przerywa natywną turę i
zwalnia tor sesji. Jeśli inny obserwator tury wygra ten wyścig zwolnienia,
OpenClaw nadal akceptuje ukończony końcowy element asystenta, gdy nie pozostaje aktywne żadne natywne
żądanie, element ani ukończenie narzędzia dynamicznego, a
zwolnienie po wyjściu asystenta nadal należy do ostatnio ukończonego elementu, bez
późniejszego ukończenia elementu. Może to zachować końcową odpowiedź po ukończonej pracy narzędzia
bez odtwarzania tury. Częściowe delty asystenta, przestarzałe wcześniejsze
odpowiedzi i puste późniejsze zakończenia nie kwalifikują się. Bezpieczne do odtworzenia awarie
stdio serwera aplikacji,
w tym przekroczenia limitu bezczynności ukończenia tury bez dowodów asystenta, narzędzia, aktywnego elementu
lub skutków ubocznych, są ponawiane raz przy świeżej próbie serwera aplikacji. Niebezpieczne
przekroczenia limitu czasu nadal wycofują zablokowanego klienta serwera aplikacji i zwalniają tor
sesji OpenClaw. Czyszczą też przestarzałe powiązanie natywnego wątku zamiast być
automatycznie odtwarzane. Przekroczenia limitu obserwacji ukończenia pokazują tekst limitu czasu specyficzny dla Codex:
przypadki bezpieczne do odtworzenia mówią, że odpowiedź może być niekompletna, natomiast przypadki niebezpieczne
każą użytkownikowi zweryfikować bieżący stan przed ponowną próbą. Publiczna diagnostyka limitu czasu
obejmuje pola strukturalne, takie jak ostatnia metoda powiadomienia serwera aplikacji,
identyfikator/typ/rola surowego elementu odpowiedzi asystenta, liczba aktywnych żądań/elementów oraz uzbrojony
stan obserwacji. Gdy ostatnie powiadomienie jest surowym elementem odpowiedzi asystenta,
obejmuje też ograniczony podgląd tekstu asystenta. Nie obejmuje surowego promptu ani
treści narzędzia.

Nadpisania środowiskowe pozostają dostępne do testowania lokalnego:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` pomija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego testowania lokalnego. Konfiguracja jest
preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie pluginu w tym
samym przeglądanym pliku co reszta konfiguracji harnessu Codex.

## Natywne pluginy Codex

Obsługa natywnych pluginów Codex używa własnych możliwości aplikacji i pluginów
serwera aplikacji Codex w tym samym wątku Codex co tura harnessu OpenClaw. OpenClaw
nie tłumaczy pluginów Codex na syntetyczne dynamiczne narzędzia OpenClaw
`codex_plugin_*`.

`codexPlugins` wpływa tylko na sesje, które wybierają natywny harness Codex. Nie
ma wpływu na uruchomienia wbudowanego harnessu, normalne uruchomienia dostawcy OpenAI, powiązania konwersacji ACP
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

Konfiguracja aplikacji wątku jest obliczana, gdy OpenClaw ustanawia sesję harnessu Codex
lub zastępuje przestarzałe powiązanie wątku Codex. Nie jest przeliczana przy każdej turze.
Po zmianie `codexPlugins` użyj `/new`, `/reset` albo uruchom ponownie gateway, aby
przyszłe sesje harnessu Codex zaczynały z zaktualizowanym zestawem aplikacji.

Informacje o kwalifikowalności migracji, inwentarzu aplikacji, polityce działań destrukcyjnych,
elicytacjach i diagnostyce natywnych pluginów znajdziesz w
[Natywne pluginy Codex](/pl/plugins/codex-native-plugins).

Dostęp do aplikacji i pluginów po stronie OpenAI jest kontrolowany przez zalogowane konto Codex
oraz, w przypadku obszarów roboczych Business i Enterprise/Edu, przez kontrole aplikacji obszaru roboczego. Zobacz
[Używanie Codex z planem ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan),
aby zapoznać się z omówieniem kont i kontroli obszaru roboczego OpenAI.

## Użycie komputera

Użycie komputera jest opisane we własnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji sterowania pulpitem ani samodzielnie nie wykonuje
działań na pulpicie. Przygotowuje serwer aplikacji Codex, weryfikuje, że
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex przejąć natywne
wywołania narzędzi MCP podczas tur w trybie Codex.

## Granice środowiska wykonawczego

Harness Codex zmienia tylko niskopoziomowy osadzony egzekutor agenta.

- Dynamiczne narzędzia OpenClaw są obsługiwane. Codex prosi OpenClaw o wykonanie tych
  narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.
- Natywne narzędzia powłoki, patchy, MCP i aplikacji Codex należą do Codex.
  OpenClaw może obserwować lub blokować wybrane natywne zdarzenia przez obsługiwany
  przekaźnik, ale nie przepisuje argumentów narzędzi natywnych.
- Codex jest właścicielem natywnej Compaction. OpenClaw utrzymuje lustrzaną kopię transkryptu dla historii
  kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub harnessu, ale
  nie zastępuje Compaction Codex podsumowaniem OpenClaw ani silnika kontekstu.
- Generowanie mediów, rozumienie mediów, TTS, zatwierdzenia i wyjście narzędzi komunikacyjnych
  nadal przechodzą przez pasujące ustawienia dostawcy/modelu OpenClaw.
- `tool_result_persist` dotyczy wyników narzędzi w transkrypcie należących do OpenClaw, a nie
  natywnych rekordów wyników narzędzi Codex.

Informacje o warstwach hooków, obsługiwanych powierzchniach V1, natywnej obsłudze uprawnień, sterowaniu
kolejką, mechanice przesyłania opinii Codex i szczegółach Compaction znajdziesz w
[Środowisko wykonawcze harnessu Codex](/pl/plugins/codex-harness-runtime).

## Rozwiązywanie problemów

**Codex nie pojawia się jako normalny dostawca `/model`:** jest to oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*`, włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa wbudowanego harnessu zamiast Codex:** upewnij się, że referencja modelu to
`openai/gpt-*` u oficjalnego dostawcy OpenAI oraz że plugin Codex jest
zainstalowany i włączony. Jeśli podczas testowania potrzebujesz ścisłego dowodu, ustaw dostawcę lub
model `agentRuntime.id: "codex"`. Wymuszone środowisko wykonawcze Codex kończy się błędem zamiast
wracać do OpenClaw.

**Środowisko wykonawcze OpenAI Codex wraca do ścieżki klucza API:** zbierz zredagowany
wycinek gateway, który pokazuje model, środowisko wykonawcze, wybranego dostawcę i błąd.
Poproś dotkniętych tym współpracowników o uruchomienie tego polecenia tylko do odczytu na ich hoście OpenClaw:

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
`Runtime: OpenAI Codex`, `agentRuntime.id` lub `harnessRuntime`,
`candidateProvider: "openai"` oraz wynik `401`, `Incorrect API key` albo
`No API key`. Poprawione uruchomienie powinno pokazać ścieżkę OAuth OpenAI
zamiast zwykłej awarii klucza API OpenAI.

**Konfiguracja starszych referencji modeli Codex pozostaje:** uruchom `openclaw doctor --fix`.
Doctor przepisuje starsze referencje modeli na `openai/*`, usuwa przestarzałe przypięcia środowiska wykonawczego sesji i
całego agenta oraz zachowuje istniejące nadpisania profilu uwierzytelniania.

**Serwer aplikacji jest odrzucany:** użyj serwera aplikacji Codex `0.125.0` lub nowszego.
Wersje przedpremierowe tej samej wersji albo wersje z sufiksem kompilacji, takie jak
`0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ OpenClaw testuje
stabilny minimalny protokół `0.125.0`.

**`/codex status` nie może się połączyć:** sprawdź, czy dołączony plugin `codex` jest
włączony, czy `plugins.allow` obejmuje go, gdy skonfigurowano listę dozwolonych, oraz
czy niestandardowe `appServer.command`, `url`, `authToken` lub nagłówki są prawidłowe.

**Wykrywanie modeli jest wolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie. Zobacz
[Referencja harnessu Codex](/pl/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket natychmiast zawodzi:** sprawdź `appServer.url`, `authToken`,
nagłówki oraz czy zdalny serwer aplikacji mówi tą samą wersją protokołu serwera aplikacji
Codex.

**Natywne narzędzia powłoki lub poprawek są blokowane komunikatem `Native hook relay unavailable`:**
wątek Codex nadal próbuje użyć identyfikatora natywnego przekaźnika hooków, którego OpenClaw
nie ma już zarejestrowanego. To problem natywnego transportu hooków Codex, a nie awaria backendu
ACP, dostawcy, GitHub ani polecenia powłoki. Rozpocznij świeżą sesję w
dotkniętym czacie za pomocą `/new` lub `/reset`, a następnie ponów nieszkodliwe polecenie. Jeśli
zadziała raz, ale następne wywołanie natywnego narzędzia ponownie się nie powiedzie, traktuj `/new` tylko jako tymczasowe
obejście: skopiuj prompt do świeżej sesji po ponownym uruchomieniu serwera aplikacji Codex
lub OpenClaw Gateway, aby stare wątki zostały odrzucone, a rejestracje natywnych hooków
odtworzone.

**Model inny niż Codex używa wbudowanego mechanizmu uruchamiania:** jest to oczekiwane, chyba że
zasady środowiska uruchomieniowego dostawcy lub modelu kierują go do innego mechanizmu uruchamiania. Zwykłe referencje dostawców innych niż OpenAI
pozostają na swojej normalnej ścieżce dostawcy w trybie `auto`.

**Computer Use jest zainstalowane, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj powyższej procedury odzyskiwania natywnego przekaźnika hooków. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use#troubleshooting).

## Powiązane

- [Dokumentacja mechanizmu uruchamiania Codex](/pl/plugins/codex-harness-reference)
- [Środowisko uruchomieniowe mechanizmu uruchamiania Codex](/pl/plugins/codex-harness-runtime)
- [Natywne pluginy Codex](/pl/plugins/codex-native-plugins)
- [Codex Computer Use](/pl/plugins/codex-computer-use)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Pomoc OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Pluginy mechanizmu uruchamiania agentów](/pl/plugins/sdk-agent-harness)
- [Hooki Pluginów](/pl/plugins/hooks)
- [Eksport diagnostyki](/pl/gateway/diagnostics)
- [Stan](/pl/cli/status)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
