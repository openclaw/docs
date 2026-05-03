---
read_when:
    - Chcesz używać dołączonego środowiska serwera aplikacji Codex
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia tylko z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury wbudowanego agenta OpenClaw przez dołączony mechanizm testowy app-server Codex
title: Środowisko Codex
x-i18n:
    generated_at: "2026-05-03T21:35:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agentów przez
Codex app-server zamiast wbudowanego harnessu PI.

Użyj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
wykrywaniem modeli, natywnym wznawianiem wątków, natywną kompakcją i wykonywaniem
przez app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem
modelu, narzędziami, zatwierdzeniami, dostarczaniem mediów oraz widocznym
lustrzanym zapisem transkrypcji.

Gdy tura czatu źródłowego działa przez harness Codex, widoczne odpowiedzi domyślnie
używają narzędzia OpenClaw `message`, jeśli wdrożenie nie skonfigurowało jawnie
`messages.visibleReplies`. Agent nadal może zakończyć swoją turę Codex prywatnie;
publikuje w kanale tylko wtedy, gdy wywoła `message(action="send")`. Ustaw
`messages.visibleReplies: "automatic"`, aby zachować końcowe odpowiedzi czatu
bezpośredniego na starszej ścieżce automatycznego dostarczania.

Tury heartbeat Codex również domyślnie otrzymują narzędzie `heartbeat_respond`,
aby agent mógł zapisać, czy wybudzenie powinno pozostać ciche czy powiadomić,
bez kodowania tego przepływu sterowania w tekście końcowym.

Wskazówki inicjatywy specyficzne dla Heartbeat są wysyłane jako instrukcja
deweloperska trybu współpracy Codex w samej turze heartbeat. Zwykłe tury czatu
przywracają tryb Codex Default zamiast przenosić filozofię heartbeat w swoim
normalnym prompcie uruchomieniowym.

Jeśli próbujesz się zorientować, zacznij od
[środowisk uruchomieniowych agentów](/pl/concepts/agent-runtimes). W skrócie:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko uruchomieniowe,
a Telegram, Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Większość użytkowników, którzy chcą „Codex w OpenClaw”, chce tej ścieżki:
zalogować się za pomocą subskrypcji ChatGPT/Codex, a następnie uruchamiać
osadzone tury agentów przez natywne środowisko uruchomieniowe Codex app-server.
Referencja modelu nadal pozostaje kanoniczna jako `openai/gpt-*`; uwierzytelnianie
subskrypcji pochodzi z konta/profilu Codex, a nie z prefiksu modelu
`openai-codex/*`.

Najpierw zaloguj się przez Codex OAuth, jeśli jeszcze tego nie zrobiono:

```bash
openclaw models auth login --provider openai-codex
```

Następnie włącz dołączony Plugin `codex` i wymuś środowisko uruchomieniowe Codex:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Jeśli twoja konfiguracja używa `plugins.allow`, dodaj tam również `codex`:

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

Nie używaj `openai-codex/gpt-*`, gdy masz na myśli natywne środowisko
uruchomieniowe Codex. Ten prefiks jest jawną ścieżką „Codex OAuth przez PI”.
Zmiany konfiguracji dotyczą nowych lub zresetowanych sesji; istniejące sesje
zachowują zapisane środowisko uruchomieniowe.

## Co zmienia ten Plugin

Dołączony Plugin `codex` wnosi kilka osobnych możliwości:

| Możliwość                         | Jak jej używać                                       | Co robi                                                                        |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywne osadzone środowisko       | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agentów OpenClaw przez Codex app-server.              |
| Natywne polecenia kontroli czatu  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże i kontroluje wątki Codex app-server z konwersacji w komunikatorze.      |
| Dostawca/katalog Codex app-server | elementy wewnętrzne `codex`, udostępniane przez harness | Pozwala środowisku wykrywać i walidować modele app-server.                    |
| Ścieżka rozumienia mediów Codex   | ścieżki zgodności modeli obrazów `codex/*`          | Uruchamia ograniczone tury Codex app-server dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik hooków         | hooki Pluginu wokół natywnych zdarzeń Codex         | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie Pluginu udostępnia te możliwości. **Nie** powoduje to:

- używania Codex dla każdego modelu OpenAI
- konwersji referencji modeli `openai-codex/*` na natywne środowisko
- ustawienia ACP/acpx jako domyślnej ścieżki Codex
- przełączania na gorąco istniejących sesji, które już zapisały środowisko PI
- zastąpienia dostarczania kanałami OpenClaw, plików sesji, przechowywania profili uwierzytelniania ani routingu wiadomości

Ten sam Plugin jest też właścicielem natywnej powierzchni poleceń kontroli czatu
`/codex`. Jeśli Plugin jest włączony, a użytkownik prosi o powiązanie,
wznowienie, sterowanie, zatrzymanie lub sprawdzenie wątków Codex z czatu,
agenci powinni preferować `/codex ...` zamiast ACP. ACP pozostaje jawną opcją
awaryjną, gdy użytkownik prosi o ACP/acpx lub testuje adapter ACP Codex.

Natywne tury Codex zachowują hooki Pluginu OpenClaw jako publiczną warstwę
zgodności. Są to hooki OpenClaw działające w procesie, a nie hooki poleceń
Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkrypcji
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą też rejestrować neutralne względem środowiska uruchomieniowego
middleware wyników narzędzi, aby przepisywać dynamiczne wyniki narzędzi OpenClaw
po wykonaniu narzędzia przez OpenClaw i przed zwróceniem wyniku do Codex. Jest
to osobne od publicznego hooka Pluginu `tool_result_persist`, który przekształca
zapisy wyników narzędzi transkrypcji należące do OpenClaw.

Semantykę samych hooków Pluginu opisują [hooki Pluginu](/pl/plugins/hooks) oraz
[zachowanie strażnika Pluginu](/pl/tools/plugin).

Harness jest domyślnie wyłączony. Nowe konfiguracje powinny zachowywać
referencje modeli OpenAI w kanonicznej formie `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`, gdy chcą
natywnego wykonywania przez app-server. Starsze referencje modeli `codex/*`
nadal automatycznie wybierają harness dla zgodności, ale starsze prefiksy
dostawców wspierane przez środowisko uruchomieniowe nie są pokazywane jako
normalne wybory modelu/dostawcy.

Jeśli Plugin `codex` jest włączony, ale model główny nadal ma postać
`openai-codex/*`, `openclaw doctor` ostrzega zamiast zmieniać ścieżkę. To
zamierzone: `openai-codex/*` pozostaje ścieżką PI Codex OAuth/subskrypcji,
a natywne wykonywanie app-server pozostaje jawnym wyborem środowiska
uruchomieniowego.

## Mapa ścieżek

Użyj tej tabeli przed zmianą konfiguracji:

| Oczekiwane zachowanie                               | Referencja modelu         | Konfiguracja środowiska              | Ścieżka uwierzytelniania/profilu | Oczekiwana etykieta statusu     |
| --------------------------------------------------- | ------------------------- | ------------------------------------ | -------------------------------- | ------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem Codex | `openai/gpt-*`            | `agentRuntime.id: "codex"`           | Codex OAuth lub konto Codex      | `Runtime: OpenAI Codex`         |
| OpenAI API przez normalny runner OpenClaw           | `openai/gpt-*`            | pominięte lub `runtime: "pi"`        | klucz OpenAI API                 | `Runtime: OpenClaw Pi Default`  |
| Subskrypcja ChatGPT/Codex przez PI                  | `openai-codex/gpt-*`      | pominięte lub `runtime: "pi"`        | dostawca OpenAI Codex OAuth      | `Runtime: OpenClaw Pi Default`  |
| Mieszani dostawcy z konserwatywnym trybem auto      | referencje specyficzne dla dostawcy | `agentRuntime.id: "auto"`            | według wybranego dostawcy        | Zależy od wybranego środowiska  |
| Jawna sesja adaptera Codex ACP                      | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"`  | uwierzytelnianie backendu ACP    | status zadania/sesji ACP        |

Ważny podział dotyczy dostawcy oraz środowiska uruchomieniowego:

- `openai-codex/*` odpowiada na pytanie „której ścieżki dostawcy/uwierzytelniania ma użyć PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla ma wykonać tę osadzoną turę?”
- `/codex ...` odpowiada na pytanie „którą natywną konwersację Codex ma powiązać lub kontrolować ten czat?”
- ACP odpowiada na pytanie „który zewnętrzny proces harnessu ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Ścieżki z rodziny OpenAI zależą od prefiksu. Dla typowej konfiguracji subskrypcja
plus natywne środowisko Codex użyj `openai/*` z `agentRuntime.id: "codex"`.
Używaj `openai-codex/*` tylko wtedy, gdy celowo chcesz Codex OAuth przez PI:

| Referencja modelu                             | Ścieżka środowiska                         | Użyj, gdy                                                                 |
| --------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | dostawca OpenAI przez instalację OpenClaw/PI | Chcesz bieżącego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth przez OpenClaw/PI        | Chcesz uwierzytelniania subskrypcji ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | harness Codex app-server                   | Chcesz uwierzytelniania subskrypcji ChatGPT/Codex z natywnym wykonywaniem Codex. |

GPT-5.5 może pojawiać się zarówno na bezpośrednich ścieżkach klucza OpenAI API,
jak i ścieżkach subskrypcji Codex, gdy twoje konto je udostępnia. Użyj
`openai/gpt-5.5` z harnessem Codex app-server dla natywnego środowiska Codex,
`openai-codex/gpt-5.5` dla PI OAuth albo `openai/gpt-5.5` bez nadpisania
środowiska Codex dla bezpośredniego ruchu z kluczem API.

Starsze referencje `codex/gpt-*` pozostają akceptowane jako aliasy zgodności.
Migracja zgodności w doctor przepisuje starsze główne referencje środowiska
uruchomieniowego na kanoniczne referencje modeli i zapisuje politykę środowiska
oddzielnie, natomiast starsze referencje używane tylko jako fallback pozostają
bez zmian, ponieważ środowisko uruchomieniowe konfiguruje się dla całego
kontenera agenta. Nowe konfiguracje PI Codex OAuth powinny używać
`openai-codex/gpt-*`; nowe konfiguracje natywnego harnessu app-server powinny
używać `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy
OpenAI Codex OAuth. Użyj `codex/gpt-*`, gdy rozumienie obrazów ma działać przez
ograniczoną turę Codex app-server. Model Codex app-server musi deklarować obsługę
wejścia obrazu; modele Codex tylko tekstowe kończą się błędem, zanim tura mediów
się zacznie.

Użyj `/status`, aby potwierdzić efektywny harness dla bieżącej sesji. Jeśli wybór
jest zaskakujący, włącz logowanie debugowania dla podsystemu `agents/harness`
i sprawdź ustrukturyzowany rekord gatewaya `agent harness selected`. Zawiera on
identyfikator wybranego harnessu, powód wyboru, politykę środowiska/fallbacku
oraz, w trybie `auto`, wynik obsługi każdego kandydata Pluginu.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy wszystkie poniższe warunki są prawdziwe:

- dołączony Plugin `codex` jest włączony lub dozwolony
- główny model agenta to `openai-codex/*`
- efektywne środowisko uruchomieniowe tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „włączony
Plugin Codex” oznacza „natywne środowisko Codex app-server”. OpenClaw nie wykonuje
takiego założenia. Ostrzeżenie oznacza:

- **Nie jest wymagana żadna zmiana**, jeśli zamierzeniem było ChatGPT/Codex OAuth przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamierzeniem było natywne wykonywanie
  app-server.
- Istniejące sesje nadal wymagają `/new` lub `/reset` po zmianie środowiska,
  ponieważ przypięcia środowiska uruchomieniowego sesji są trwałe.

Wybór harnessu nie jest kontrolą sesji na żywo. Gdy osadzona tura jest
uruchamiana, OpenClaw zapisuje identyfikator wybranego harnessu w tej sesji
i dalej używa go dla późniejszych tur w tym samym identyfikatorze sesji. Zmień
konfigurację `agentRuntime` albo `OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby
przyszłe sesje używały innego harnessu; użyj `/new` lub `/reset`, aby rozpocząć
świeżą sesję przed przełączeniem istniejącej konwersacji między PI a Codex.
Pozwala to uniknąć odtwarzania jednej transkrypcji przez dwa niezgodne natywne
systemy sesji.

Starsze sesje utworzone przed przypięciem harness są traktowane jako przypięte do PI, gdy mają już historię transkrypcji. Użyj `/new` lub `/reset`, aby włączyć tę rozmowę do Codex po zmianie konfiguracji.

`/status` pokazuje efektywne środowisko wykonawcze modelu. Domyślny harness PI jest wyświetlany jako
`Runtime: OpenClaw Pi Default`, a harness serwera aplikacji Codex jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- Serwer aplikacji Codex `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym binarium serwera aplikacji Codex, więc lokalne polecenia `codex` w `PATH` nie wpływają na normalne uruchamianie harness.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji lub dla mostka uwierzytelniania Codex w OpenClaw. Lokalne uruchomienia serwera aplikacji używają zarządzanego przez OpenClaw katalogu domowego Codex dla każdego agenta oraz izolowanego podrzędnego `HOME`, więc domyślnie nie odczytują Twojego osobistego konta `~/.codex`, Skills, Plugin, konfiguracji, stanu wątków ani natywnego `$HOME/.agents/skills`.

Plugin blokuje starsze lub niewersjonowane handshaki serwera aplikacji. Dzięki temu OpenClaw pozostaje na powierzchni protokołu, względem której został przetestowany.

W testach dymnych live i Docker uwierzytelnianie zwykle pochodzi z konta CLI Codex albo profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia serwera aplikacji stdio mogą też awaryjnie użyć `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy nie ma konta.

## Pliki inicjalizacji obszaru roboczego

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentacji projektu. OpenClaw nie zapisuje syntetycznych plików dokumentacji projektu Codex ani nie zależy od awaryjnych nazw plików Codex dla plików persony, ponieważ mechanizmy awaryjne Codex mają zastosowanie tylko wtedy, gdy brakuje `AGENTS.md`.

Dla parzystości obszaru roboczego OpenClaw harness Codex rozwiązuje pozostałe pliki inicjalizacji (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` oraz `MEMORY.md`, jeśli istnieją) i przekazuje je przez instrukcje konfiguracji Codex w `thread/start` i `thread/resume`. Dzięki temu `SOUL.md` i powiązany kontekst persony/profilu obszaru roboczego pozostają widoczne bez duplikowania `AGENTS.md`.

## Dodaj Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent ma swobodnie przełączać się między modelami dostawców Codex i innymi niż Codex. Wymuszone środowisko wykonawcze dotyczy każdej osadzonej tury dla tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy to środowisko wykonawcze jest wymuszone, OpenClaw nadal spróbuje użyć harness Codex i zakończy się błędem, zamiast po cichu przekierować tę turę przez PI.

Zamiast tego użyj jednej z tych struktur:

- Umieść Codex w dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta z `agentRuntime.id: "auto"` i awaryjną zgodnością PI dla normalnego mieszanego użycia dostawców.
- Używaj starszych odwołań `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować `openai/*` oraz jawną politykę środowiska wykonawczego Codex.

Na przykład ta konfiguracja pozostawia domyślnego agenta przy normalnym automatycznym wyborze i dodaje osobnego agenta Codex:

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
      agentRuntime: {
        id: "auto",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Przy tej strukturze:

- Domyślny agent `main` używa normalnej ścieżki dostawcy i awaryjnej zgodności PI.
- Agent `codex` używa harness serwera aplikacji Codex.
- Jeśli Codex jest niedostępny lub nieobsługiwany dla agenta `codex`, tura kończy się niepowodzeniem zamiast po cichu użyć PI.

## Trasowanie poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, a nie wyłącznie według słowa „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Powiąż ten czat z Codex”                              | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                    | `/codex threads`                                 |
| „Zgłoś raport wsparcia dla błędnego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij feedback Codex tylko dla tego dołączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj mojej subskrypcji ChatGPT/Codex ze środowiskiem wykonawczym Codex” | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Użyj mojej subskrypcji ChatGPT/Codex przez PI”        | odwołania modeli `openai-codex/*`                |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` i nie natywne subagenty    |

OpenClaw reklamuje agentom wskazówki dotyczące tworzenia sesji ACP tylko wtedy, gdy ACP jest włączone, możliwe do wysłania i obsługiwane przez załadowany backend środowiska wykonawczego. Jeśli ACP nie jest dostępne, prompt systemowy i Skills Plugin nie powinny uczyć agenta trasowania ACP.

## Wdrożenia tylko z Codex

Wymuś harness Codex, gdy musisz udowodnić, że każda osadzona tura agenta używa Codex. Jawne środowiska wykonawcze Plugin kończą się błędem i nigdy nie są po cichu ponawiane przez PI:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Nadpisanie środowiskowe:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Przy wymuszonym Codex OpenClaw kończy wcześniej z błędem, jeśli Plugin Codex jest wyłączony, serwer aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić.

## Codex per agent

Możesz ustawić jednego agenta jako tylko Codex, podczas gdy domyślny agent zachowuje normalny automatyczny wybór:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Używaj normalnych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy świeżą sesję OpenClaw, a harness Codex tworzy lub wznawia swój boczny wątek serwera aplikacji zgodnie z potrzebą. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku i pozwala następnej turze ponownie rozwiązać harness z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacji o dostępne modele. Jeśli wykrywanie nie powiedzie się lub przekroczy limit czasu, używa dołączonego katalogu awaryjnego dla:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Możesz dostroić wykrywanie w `plugins.entries.codex.config.discovery`:

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

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i trzymało się katalogu awaryjnego:

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

## Połączenie i polityka serwera aplikacji

Domyślnie Plugin uruchamia lokalnie zarządzane przez OpenClaw binarium Codex z:

```bash
codex app-server --listen stdio://
```

Zarządzane binarium jest dostarczane z pakietem Plugin `codex`. Dzięki temu wersja serwera aplikacji jest powiązana z dołączonym Plugin, a nie z dowolnym osobnym CLI Codex zainstalowanym lokalnie. Ustaw `appServer.command` tylko wtedy, gdy celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje harness Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana lokalna postawa operatora używana dla autonomicznych Heartbeat: Codex może używać narzędzi powłoki i sieci bez zatrzymywania się na natywnych promptach zatwierdzania, na które nikt nie jest obecny, by odpowiedzieć.

Aby włączyć zatwierdzenia przeglądane przez strażnika Codex, ustaw `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Tryb Guardian używa natywnej ścieżki automatycznego przeglądu zatwierdzeń Codex. Gdy Codex prosi o opuszczenie piaskownicy, zapis poza obszarem roboczym lub dodanie uprawnień takich jak dostęp do sieci, Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza albo odrzuca konkretne żądanie. Użyj Guardian, gdy chcesz więcej zabezpieczeń niż w trybie YOLO, ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą mieszać preset z jawnymi wyborami. Starsza wartość recenzenta `guardian_subagent` jest nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać `auto_review`.

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
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Uruchomienia serwera aplikacji stdio domyślnie dziedziczą środowisko procesu OpenClaw, ale OpenClaw posiada mostek konta serwera aplikacji Codex i ustawia zarówno `CODEX_HOME`, jak i `HOME` na katalogi per-agent w stanie OpenClaw tego agenta. Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` i `$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień serwera aplikacji. Dzięki temu natywne Skills, Plugin, konfiguracja, konta i stan wątków Codex pozostają w zakresie agenta OpenClaw, zamiast przeciekać z osobistego katalogu domowego CLI Codex operatora.

Plugin OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny rejestr Plugin i loader Skills OpenClaw. Osobiste zasoby CLI Codex nie przepływają. Jeśli masz przydatne Skills lub Plugin CLI Codex, które powinny stać się częścią agenta OpenClaw, zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego obszaru roboczego agenta OpenClaw. Natywne Plugin, hooki i pliki konfiguracji Codex są raportowane lub archiwizowane do ręcznego przeglądu zamiast aktywowane automatycznie, ponieważ mogą wykonywać polecenia, ujawniać serwery MCP lub przenosić poświadczenia.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie OpenAI jest nadal wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich modeli OpenAI, bez przypadkowego rozliczania natywnych tur serwera aplikacji Codex przez API. Jawne profile klucza API Codex i lokalne awaryjne użycie klucza ze środowiska stdio korzystają z logowania serwera aplikacji zamiast odziedziczonego środowiska procesu potomnego. Połączenia serwera aplikacji WebSocket nie otrzymują awaryjnych kluczy API ze środowiska Gateway; użyj jawnego profilu uwierzytelniania albo własnego konta zdalnego serwera aplikacji.

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

Dynamiczne narzędzia Codex domyślnie używają profilu `native-first`. W tym trybie
OpenClaw nie udostępnia dynamicznych narzędzi, które powielają natywne operacje
Codex na obszarze roboczym: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` i
`update_plan`. Narzędzia integracyjne OpenClaw, takie jak komunikacja, sesje, media,
cron, przeglądarka, węzły, gateway, `heartbeat_respond` i `web_search`, pozostają
dostępne.

Obsługiwane pola najwyższego poziomu Pluginu Codex:

| Pole                       | Domyślnie        | Znaczenie                                                                                      |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Użyj `"openclaw-compat"`, aby udostępnić serwerowi aplikacji Codex pełny zestaw dynamicznych narzędzi OpenClaw. |
| `codexDynamicToolsExclude` | `[]`             | Dodatkowe nazwy dynamicznych narzędzi OpenClaw pomijane w turach serwera aplikacji Codex.       |

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                         |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko przy jawnym nadpisaniu.                                                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                     |
| `url`               | nieustawione                             | Adres URL WebSocket serwera aplikacji.                                                                                                                                                                                              |
| `authToken`         | nieustawione                             | Token bearer dla transportu WebSocket.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchamianego procesu serwera aplikacji stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent OpenClaw przy lokalnych uruchomieniach. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                                                   |
| `mode`              | `"yolo"`                                 | Ustawienie wstępne dla wykonywania YOLO albo wykonywania sprawdzanego przez strażnika.                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy starcie, wznawianiu i turze wątku.                                                                                                                                               |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb piaskownicy Codex wysyłany przy starcie lub wznawianiu wątku.                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby Codex sprawdzał natywne monity zatwierdzania. `guardian_subagent` pozostaje starszym aliasem.                                                                                                             |
| `serviceTier`       | nieustawione                             | Opcjonalny poziom usługi serwera aplikacji Codex: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                      |

Wywołania dynamicznych narzędzi należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw
przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex
nieudaną odpowiedź dynamicznego narzędzia, aby tura mogła być kontynuowana
zamiast pozostawiać sesję w stanie `processing`.

Po odpowiedzi OpenClaw na żądanie serwera aplikacji Codex ograniczone do tury
harness oczekuje również, że Codex zakończy natywną turę zdarzeniem
`turn/completed`. Jeśli serwer aplikacji pozostanie bezczynny przez 60 sekund po
tej odpowiedzi, OpenClaw w trybie best-effort przerywa turę Codex, zapisuje
diagnostyczny limit czasu i zwalnia pas sesji OpenClaw, aby kolejne wiadomości
czatu nie były kolejkowane za nieaktualną natywną turą.

Nadpisania środowiska pozostają dostępne do testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` jest nieustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych. Konfiguracja jest
preferowana w powtarzalnych wdrożeniach, ponieważ utrzymuje zachowanie Pluginu w
tym samym sprawdzanym pliku co resztę konfiguracji harnessu Codex.

## Użycie komputera

Użycie komputera opisano w osobnym przewodniku konfiguracji:
[Codex: użycie komputera](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza własnej aplikacji do sterowania pulpitem ani
samodzielnie nie wykonuje akcji na pulpicie. Przygotowuje serwer aplikacji Codex,
sprawdza, czy serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex
obsługiwać natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace Codex,
zarejestruj `cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Codex: użycie komputera](/pl/plugins/codex-computer-use), aby poznać różnicę
między użyciem komputera należącym do Codex a bezpośrednią rejestracją MCP.

Minimalna konfiguracja:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Konfigurację można sprawdzić lub zainstalować z poziomu poleceń:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Użycie komputera jest specyficzne dla macOS i może wymagać lokalnych uprawnień
systemu operacyjnego, zanim serwer MCP Codex będzie mógł sterować aplikacjami. Jeśli
`computerUse.enabled` ma wartość true, a serwer MCP jest niedostępny, tury w
trybie Codex kończą się niepowodzeniem przed rozpoczęciem wątku zamiast
po cichu działać bez natywnych narzędzi użycia komputera. Zobacz
[Codex: użycie komputera](/pl/plugins/codex-computer-use), aby poznać wybory marketplace,
limity zdalnego katalogu, powody statusu i rozwiązywanie problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować standardowy
dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` albo `/reset` po zmianie
konfiguracji runtime lub użycia komputera, aby istniejące sesje nie zachowywały
starego powiązania wątku PI lub Codex.

## Typowe przepisy

Lokalny Codex z domyślnym transportem stdio:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Walidacja harnessu tylko dla Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
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

Zatwierdzenia Codex sprawdzane przez strażnika:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Zdalny serwer aplikacji z jawnymi nagłówkami:

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
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Przełączanie modelu pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw jest
dołączona do istniejącego wątku Codex, następna tura ponownie wysyła do
serwera aplikacji aktualnie wybrany model OpenAI, dostawcę, politykę zatwierdzania,
piaskownicę i poziom usługi. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje
powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane polecenie slash. Jest ono
ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje bieżącą łączność z serwerem aplikacji, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla modele bieżącego serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem diagnostycznej opinii Codex dla dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany Plugin Computer Use i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany Plugin Computer Use i ponownie ładuje serwery MCP.
- `/codex account` pokazuje status konta i limitów szybkości.
- `/codex mcp` wyświetla status serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

### Typowy przepływ debugowania

Gdy agent oparty na Codex zrobi coś zaskakującego w Telegram, Discord, Slack,
lub innym kanale, zacznij od rozmowy, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką notatkę
   opisującą to, co zaobserwowano.
2. Zatwierdź żądanie diagnostyki jeden raz. Zatwierdzenie tworzy lokalny pakiet zip
   diagnostyki Gateway i, ponieważ sesja używa harnessu Codex, również
   wysyła odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu lub wątku pomocy.
   Zawiera ona lokalną ścieżkę pakietu, podsumowanie prywatności, identyfikatory sesji OpenClaw,
   identyfikatory wątków Codex oraz wiersz `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować uruchomienie, uruchom wypisane polecenie `Inspect locally`
   w terminalu. Wygląda ono jak `codex resume <thread-id>` i otwiera
   natywny wątek Codex, aby można było sprawdzić rozmowę, kontynuować ją lokalnie
   albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub plan.

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać opinię Codex
dla aktualnie dołączonego wątku bez pełnego pakietu diagnostyki OpenClaw
Gateway. W przypadku większości zgłoszeń pomocy lepszym punktem wyjścia jest `/diagnostics [note]`,
ponieważ łączy lokalny stan Gateway i identyfikatory wątków Codex w jednej odpowiedzi.
Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać pełny model prywatności
i zachowanie w czatach grupowych.

Rdzeń OpenClaw udostępnia też dostępne tylko dla właściciela `/diagnostics [note]` jako ogólne
polecenie diagnostyki Gateway. Jego monit zatwierdzenia pokazuje wstęp dotyczący danych wrażliwych,
linkuje do [Eksportu diagnostyki](/pl/gateway/diagnostics) i za każdym razem żąda
`openclaw gateway diagnostics export --json` przez jawne zatwierdzenie wykonania.
Nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu
OpenClaw wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu i podsumowaniem
manifestu. Gdy aktywna sesja OpenClaw używa harnessu Codex, to samo zatwierdzenie
upoważnia również do wysłania odpowiednich pakietów opinii Codex na serwery
OpenAI. Monit zatwierdzenia informuje, że opinia Codex zostanie wysłana, ale
przed zatwierdzeniem nie wyświetla identyfikatorów sesji ani wątków Codex.

Jeśli `/diagnostics` zostanie wywołane przez właściciela na czacie grupowym, OpenClaw utrzymuje
współdzielony kanał w czystości: grupa otrzymuje tylko krótką informację, podczas gdy
wstęp diagnostyczny, monity zatwierdzenia oraz identyfikatory sesji/wątków Codex są wysyłane do
właściciela prywatną ścieżką zatwierdzania. Jeśli nie ma prywatnej ścieżki do właściciela,
OpenClaw odrzuca żądanie z grupy i prosi właściciela, aby uruchomił je z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` serwera aplikacji Codex i prosi
serwer aplikacji o dołączenie logów dla każdego wymienionego wątku oraz utworzonych podwątków Codex,
gdy są dostępne. Przesłanie przechodzi normalną ścieżką opinii Codex na serwery OpenAI;
jeśli opinie Codex są wyłączone w tym serwerze aplikacji, polecenie zwraca
błąd serwera aplikacji. Ukończona odpowiedź diagnostyczna wymienia kanały,
identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia
`codex resume <thread-id>` dla wysłanych wątków. Jeśli odrzucisz lub zignorujesz zatwierdzenie,
OpenClaw nie wypisze tych identyfikatorów Codex. To przesłanie nie zastępuje lokalnego
eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam plik powiązania sidecar, którego harness używa dla
normalnych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje
aktualnie wybrany model OpenClaw do serwera aplikacji i pozostawia włączoną rozszerzoną historię.

### Inspekcja wątku Codex z CLI

Najszybszym sposobem zrozumienia nieudanego uruchomienia Codex często jest bezpośrednie otwarcie
natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w rozmowie na kanale i chcesz sprawdzić
problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego dokonał
konkretnego wyboru narzędzia lub rozumowania. Najłatwiejszą ścieżką jest zwykle najpierw uruchomienie
`/diagnostics [note]`: po zatwierdzeniu ukończony raport wymieni każdy wątek Codex
i wypisze polecenie `Inspect locally`, na przykład
`codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio do terminala.

Identyfikator wątku możesz też uzyskać z `/codex binding` dla bieżącego czatu lub
`/codex threads [filter]` dla ostatnich wątków serwera aplikacji Codex, a następnie uruchomić to samo
polecenie `codex resume` w powłoce.

Powierzchnia poleceń wymaga serwera aplikacji Codex `0.125.0` lub nowszego. Poszczególne
metody sterujące są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy serwer aplikacji nie udostępnia tej metody JSON-RPC.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel              | Cel                                                                 |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                | Zgodność produktu/Plugin w harnessach PI i Codex.                   |
| Middleware rozszerzeń serwera aplikacji Codex | Dołączone Plugin OpenClaw | Zachowanie adaptera dla każdej tury wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                   | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania
zachowaniem Plugin OpenClaw. Dla obsługiwanego mostu natywnych narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex per wątek dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`. Inne hooki Codex, takie jak `SessionStart` i
`UserPromptSubmit`, pozostają kontrolkami na poziomie Codex; nie są udostępniane jako
hooki Plugin OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw, OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia należące do niego zachowanie Plugin i middleware w
adapterze harnessu. W przypadku narzędzi natywnych Codex, Codex jest właścicielem kanonicznego rekordu narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępni tę operację przez serwer aplikacji lub wywołania zwrotne natywnych hooków.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień serwera aplikacji Codex
oraz stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex.
Zdarzenia `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` OpenClaw są obserwacjami na poziomie adaptera, a nie przechwyceniami bajt po bajcie
wewnętrznego żądania Codex ani ładunków Compaction.

Powiadomienia serwera aplikacji natywnych hooków Codex `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania.
Nie wywołują hooków Plugin OpenClaw.

## Kontrakt wsparcia V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex jest właścicielem większej części
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji
wokół tej granicy.

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Wsparcie                                | Dlaczego                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                             | Serwer aplikacji Codex jest właścicielem tury OpenAI, natywnego wznowienia wątku i natywnej kontynuacji narzędzi.                                                                                     |
| Trasowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                        |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                         |
| Plugin promptów i kontekstu                   | Obsługiwane                             | OpenClaw buduje nakładki promptów i projektuje kontekst do tury Codex przed rozpoczęciem lub wznowieniem wątku.                                                                                       |
| Cykl życia silnika kontekstu                  | Obsługiwane                             | Składanie, pobieranie lub konserwacja po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                  |
| Hooki dynamicznych narzędzi                   | Obsługiwane                             | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół dynamicznych narzędzi należących do OpenClaw.                                                                       |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z uczciwymi ładunkami trybu Codex.                                                                    |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez przekaźnik natywnych hooków | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                    |
| Blokowanie lub obserwacja natywnej powłoki, patchy i MCP | Obsługiwane przez przekaźnik natywnych hooków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP na serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez przekaźnik natywnych hooków | Codex `PermissionRequest` może być trasowane przez politykę OpenClaw tam, gdzie środowisko uruchomieniowe je udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex przechodzi swoją normalną ścieżką guardian lub zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                             | OpenClaw rejestruje żądanie wysłane do serwera aplikacji oraz otrzymane powiadomienia serwera aplikacji.                                                                                              |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                        | Granica V1                                                                                                                                       | Przyszła ścieżka                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Mutowanie argumentów narzędzi natywnych             | Natywne hooki Codex przed narzędziem mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych Codex.                            | Wymaga obsługi hooka/schematu Codex do zastępowania danych wejściowych narzędzia.                      |
| Edytowalna historia transkrypcji natywnej Codex     | Codex posiada kanoniczną historię wątków natywnych. OpenClaw posiada kopię lustrzaną i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodaj jawne API serwera aplikacji Codex, jeśli potrzebna jest operacja na wątku natywnym.              |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hook przekształca zapisy transkrypcji należące do OpenClaw, a nie rekordy narzędzi natywnych Codex.                                         | Można odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex.          |
| Bogate metadane natywnego Compaction                | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/odrzuconych elementów, delty tokenów ani payloadu podsumowania. | Wymaga bogatszych zdarzeń Compaction Codex.                                                            |
| Interwencja Compaction                              | Obecne hooki Compaction OpenClaw w trybie Codex działają na poziomie powiadomień.                                                                 | Dodaj hooki Codex przed/po Compaction, jeśli Pluginy muszą wetować lub przepisywać natywne Compaction. |
| Przechwytywanie żądań API modelu bajt po bajcie     | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex buduje finalne żądanie OpenAI API wewnętrznie.            | Wymaga zdarzenia śledzenia żądań modelu Codex albo API debugowania.                                    |

## Narzędzia, media i Compaction

Harness Codex zmienia tylko niskopoziomowy wykonawca osadzonego agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
harness. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi komunikacyjnych nadal przechodzą przez normalną ścieżkę dostarczania
OpenClaw.

Natywne przekazywanie hooków jest celowo ogólne, ale kontrakt obsługi v1 jest
ograniczony do ścieżek narzędzi natywnych Codex i uprawnień, które OpenClaw testuje. W
środowisku uruchomieniowym Codex obejmuje to payloady shell, patch i MCP
`PreToolUse`, `PostToolUse` oraz `PermissionRequest`. Nie zakładaj, że każde przyszłe
zdarzenie hooka Codex jest powierzchnią Plugin OpenClaw, dopóki kontrakt środowiska uruchomieniowego
go nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy tylko
wtedy, gdy zdecyduje o tym polityka. Wynik bez decyzji nie jest zezwoleniem. Codex traktuje go jako brak
decyzji hooka i przechodzi do własnej ścieżki ochrony lub zatwierdzenia przez użytkownika.

Żądania zatwierdzenia narzędzi Codex MCP są kierowane przez przepływ zatwierdzania Plugin
OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do
czatu źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada na to natywne
żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne żądania pozyskiwania MCP
nadal kończą się zamknięciem z odmową.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera aplikacji Codex. Przy
domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje zakolejkowane wiadomości czatu
dla skonfigurowanego okna ciszy i wysyła je jako jedno żądanie `turn/steer` w
kolejności przybycia. Starszy tryb `queue` wysyła osobne żądania `turn/steer`. Tury
przeglądu Codex i ręcznego Compaction mogą odrzucać sterowanie w tej samej turze, w takim przypadku
OpenClaw używa kolejki uzupełniającej, gdy wybrany tryb pozwala na fallback. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa harness Codex, natywne Compaction wątku jest
delegowane do serwera aplikacji Codex. OpenClaw utrzymuje kopię lustrzaną transkrypcji dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub harness. Kopia
obejmuje prompt użytkownika, finalny tekst asystenta oraz lekkie rekordy rozumowania
lub planu Codex, gdy serwer aplikacji je emituje. Obecnie OpenClaw zapisuje tylko
sygnały rozpoczęcia i zakończenia natywnego Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy wpisów, które Codex
zachował po Compaction.

Ponieważ Codex posiada kanoniczny wątek natywny, `tool_result_persist` obecnie nie
przepisuje rekordów wyników narzędzi natywnych Codex. Ma zastosowanie tylko wtedy, gdy
OpenClaw zapisuje wynik narzędzia transkrypcji sesji należącej do OpenClaw.

Generowanie mediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS i
rozumienie mediów nadal używają odpowiednich ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako normalny dostawca `/model`:** to oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (albo starszą referencję `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
backendu zgodności, gdy żaden harness Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania.
Wymuszone środowisko uruchomieniowe Codex kończy się błędem zamiast wracać do PI. Po wybraniu serwera aplikacji Codex
jego błędy są ujawniane bezpośrednio.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby handshake serwera aplikacji
zgłaszał wersję `0.125.0` lub nowszą. Przedwydania tej samej wersji albo wersje z sufiksem kompilacji,
takie jak `0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ stabilny próg
protokołu `0.125.0` jest tym, co testuje OpenClaw.

**Odkrywanie modeli jest wolne:** zmniejsz `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz odkrywanie.

**Transport WebSocket natychmiast kończy się błędem:** sprawdź `appServer.url`, `authToken`
oraz to, czy zdalny serwer aplikacji mówi tą samą wersją protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** to oczekiwane, chyba że wymusisz
`agentRuntime.id: "codex"` dla tego agenta albo wybierzesz starszą referencję
`codex/*`. Zwykłe `openai/gpt-*` i inne referencje dostawców pozostają na swojej normalnej
ścieżce dostawcy w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`, każda osadzona
tura dla tego agenta musi być obsługiwanym przez Codex modelem OpenAI.

**Computer Use jest zainstalowane, ale narzędzia nie działają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` albo `/reset`; jeśli problem się utrzymuje, uruchom ponownie
Gateway, aby wyczyścić nieaktualne rejestracje natywnych hooków. Jeśli `computer-use.list_apps`
przekracza limit czasu, uruchom ponownie Codex Computer Use albo Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy harness agenta](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Hooki Plugin](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
