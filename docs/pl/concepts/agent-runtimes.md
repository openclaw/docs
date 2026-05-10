---
read_when:
    - Wybierasz między PI, Codex, ACP a innym natywnym środowiskiem uruchomieniowym agenta
    - Mylą Cię etykiety dostawcy/modelu/środowiska uruchomieniowego w statusie lub konfiguracji
    - Dokumentujesz parytet obsługi dla natywnej uprzęży
summary: Jak OpenClaw rozdziela dostawców modeli, modele, kanały i środowiska wykonawcze agentów
title: Środowiska uruchomieniowe agentów
x-i18n:
    generated_at: "2026-05-10T19:31:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**Agent runtime** to komponent, który jest właścicielem jednej przygotowanej pętli modelu: odbiera prompt, steruje wyjściem modelu, obsługuje natywne wywołania narzędzi i zwraca ukończoną turę do OpenClaw.

Runtimy łatwo pomylić z dostawcami, ponieważ oba pojęcia pojawiają się w pobliżu konfiguracji modelu. To różne warstwy:

| Warstwa       | Przykłady                             | Co to oznacza                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Dostawca      | `openai`, `anthropic`, `openai-codex` | Jak OpenClaw uwierzytelnia, wykrywa modele i nazywa odwołania do modeli. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Model wybrany dla tury agenta.                                      |
| Agent runtime | `pi`, `codex`, `claude-cli`           | Niskopoziomowa pętla lub backend, który wykonuje przygotowaną turę. |
| Kanał         | Telegram, Discord, Slack, WhatsApp    | Miejsce, w którym wiadomości wchodzą do OpenClaw i z niego wychodzą. |

W kodzie zobaczysz też słowo **harness**. Harness to implementacja, która zapewnia agent runtime. Na przykład dołączony harness Codex implementuje runtime `codex`. Konfiguracja publiczna używa `agentRuntime.id` we wpisach dostawcy lub modelu; klucze runtime całego agenta są przestarzałe i ignorowane. `openclaw doctor --fix` usuwa stare przypięcia runtime całego agenta i przepisuje przestarzałe odwołania runtime do modeli na kanoniczne odwołania dostawca/model oraz, tam gdzie trzeba, politykę runtime w zakresie modelu.

Istnieją dwie rodziny runtime:

- **Osadzone harnessy** działają wewnątrz przygotowanej pętli agenta OpenClaw. Dziś jest to wbudowany runtime `pi` oraz zarejestrowane harnessy Plugin, takie jak `codex`.
- **Backendy CLI** uruchamiają lokalny proces CLI, zachowując kanoniczne odwołanie do modelu. Na przykład `anthropic/claude-opus-4-7` z przypisanym do modelu `agentRuntime.id: "claude-cli"` oznacza „wybierz model Anthropic, wykonaj przez Claude CLI”. `claude-cli` nie jest identyfikatorem osadzonego harnessa i nie może być przekazywany do wyboru AgentHarness.

## Powierzchnie Codex

Najwięcej nieporozumień wynika z kilku różnych powierzchni używających nazwy Codex:

| Powierzchnia                                   | Nazwa/konfiguracja OpenClaw           | Co robi                                                                                                       |
| ---------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Natywny runtime serwera aplikacji Codex        | odwołania do modeli `openai/*`        | Uruchamia osadzone tury agentów OpenAI przez serwer aplikacji Codex. To typowa konfiguracja subskrypcji ChatGPT/Codex. |
| Profile uwierzytelniania OAuth Codex           | dostawca uwierzytelniania `openai-codex` | Przechowuje uwierzytelnianie subskrypcji ChatGPT/Codex używane przez harness serwera aplikacji Codex.          |
| Adapter ACP Codex                              | `runtime: "acp"`, `agentId: "codex"` | Uruchamia Codex przez zewnętrzną płaszczyznę sterowania ACP/acpx. Używaj tylko wtedy, gdy wyraźnie poproszono o ACP/acpx. |
| Natywny zestaw poleceń sterowania czatem Codex | `/codex ...`                         | Wiąże, wznawia, steruje, zatrzymuje i sprawdza wątki serwera aplikacji Codex z poziomu czatu.                 |
| Trasa OpenAI Platform API dla powierzchni nieagentowych | `openai/*` plus uwierzytelnianie kluczem API | Używana dla bezpośrednich API OpenAI, takich jak obrazy, embeddings, mowa i realtime.                         |

Te powierzchnie są celowo niezależne. Włączenie Plugin `codex` udostępnia natywne funkcje serwera aplikacji; `openclaw doctor --fix` odpowiada za naprawę przestarzałej trasy `openai-codex/*` i czyszczenie nieaktualnych przypięć sesji. Wybranie `openai/*` jako modelu agenta oznacza teraz „uruchom to przez Codex”, chyba że używana jest nieagentowa powierzchnia OpenAI API.

Typowa konfiguracja subskrypcji ChatGPT/Codex używa OAuth Codex do uwierzytelniania, ale zachowuje odwołanie do modelu jako `openai/*` i wybiera runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Oznacza to, że OpenClaw wybiera odwołanie do modelu OpenAI, a następnie prosi runtime serwera aplikacji Codex o uruchomienie osadzonej tury agenta. Nie oznacza to „użyj rozliczeń API” ani nie oznacza, że kanał, katalog dostawcy modelu lub magazyn sesji OpenClaw staje się Codex.

Gdy dołączony Plugin `codex` jest włączony, sterowanie Codex w języku naturalnym powinno używać natywnej powierzchni poleceń `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) zamiast ACP. Używaj ACP dla Codex tylko wtedy, gdy użytkownik wyraźnie prosi o ACP/acpx lub testuje ścieżkę adaptera ACP. Claude Code, Gemini CLI, OpenCode, Cursor i podobne zewnętrzne harnessy nadal używają ACP.

To drzewo decyzji dla agenta:

1. Jeśli użytkownik prosi o **wiązanie/sterowanie/wątek/wznowienie/sterowanie/zatrzymanie Codex**, użyj natywnej powierzchni poleceń `/codex`, gdy dołączony Plugin `codex` jest włączony.
2. Jeśli użytkownik prosi o **Codex jako osadzony runtime** albo chce zwykłego doświadczenia agenta Codex opartego na subskrypcji, użyj `openai/<model>`.
3. Jeśli użytkownik wyraźnie wybiera **PI dla modelu OpenAI**, zachowaj odwołanie do modelu jako `openai/<model>` i ustaw politykę runtime dostawcy/modelu na `agentRuntime.id: "pi"`. Wybrany profil uwierzytelniania `openai-codex` jest wewnętrznie kierowany przez przestarzały transport uwierzytelniania Codex w PI.
4. Jeśli przestarzała konfiguracja nadal zawiera **odwołania do modeli `openai-codex/*`**, napraw ją do `openai/<model>` za pomocą `openclaw doctor --fix`; doctor zachowuje trasę uwierzytelniania Codex, dodając przypisane do dostawcy/modelu `agentRuntime.id: "codex"` tam, gdzie sugerowało to stare odwołanie do modelu.
5. Jeśli użytkownik wyraźnie mówi **ACP**, **acpx** lub **adapter ACP Codex**, użyj ACP z `runtime: "acp"` i `agentId: "codex"`.
6. Jeśli żądanie dotyczy **Claude Code, Gemini CLI, OpenCode, Cursor, Droid lub innego zewnętrznego harnessa**, użyj ACP/acpx, a nie natywnego runtime podagenta.

| Masz na myśli...                       | Użyj...                                      |
| -------------------------------------- | -------------------------------------------- |
| Sterowanie czatem/wątkiem serwera aplikacji Codex | `/codex ...` z dołączonego Plugin `codex` |
| Osadzony agent runtime serwera aplikacji Codex | odwołania do modeli agentów `openai/*`       |
| OpenAI Codex OAuth                     | profile uwierzytelniania `openai-codex`      |
| Claude Code lub inny zewnętrzny harness | ACP/acpx                                     |

Podział prefiksów rodziny OpenAI opisują [OpenAI](/pl/providers/openai) i [Dostawcy modeli](/pl/concepts/model-providers). Kontrakt wsparcia runtime Codex opisuje [Runtime harnessa Codex](/pl/plugins/codex-harness-runtime#v1-support-contract).

## Własność runtime

Różne runtimy są właścicielami różnych części pętli.

| Powierzchnia                 | Osadzony PI OpenClaw                    | Serwer aplikacji Codex                                                      |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Właściciel pętli modelu     | OpenClaw przez osadzony runner PI       | Serwer aplikacji Codex                                                      |
| Kanoniczny stan wątku       | Transkrypt OpenClaw                     | Wątek Codex oraz lustrzana kopia transkryptu OpenClaw                       |
| Dynamiczne narzędzia OpenClaw | Natywna pętla narzędzi OpenClaw         | Mostkowane przez adapter Codex                                               |
| Natywne narzędzia powłoki i plików | Ścieżka PI/OpenClaw                    | Narzędzia natywne Codex, mostkowane przez natywne hooki tam, gdzie są obsługiwane |
| Silnik kontekstu            | Natywne składanie kontekstu OpenClaw    | OpenClaw składa kontekst projektów do tury Codex                            |
| Compaction                  | OpenClaw lub wybrany silnik kontekstu   | Natywna compaction Codex, z powiadomieniami OpenClaw i utrzymaniem kopii lustrzanej |
| Dostarczanie kanału         | OpenClaw                                | OpenClaw                                                                    |

Ten podział własności jest główną regułą projektową:

- Jeśli OpenClaw jest właścicielem powierzchni, OpenClaw może zapewnić normalne zachowanie hooków Plugin.
- Jeśli natywny runtime jest właścicielem powierzchni, OpenClaw potrzebuje zdarzeń runtime lub natywnych hooków.
- Jeśli natywny runtime jest właścicielem kanonicznego stanu wątku, OpenClaw powinien tworzyć kopię lustrzaną i projektować kontekst, a nie przepisywać nieobsługiwane internale.

## Wybór runtime

OpenClaw wybiera osadzony runtime po rozstrzygnięciu dostawcy i modelu:

1. Wygrywa polityka runtime przypisana do modelu. Może znajdować się w skonfigurowanym wpisie modelu dostawcy albo w `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`.
2. Następna jest polityka runtime przypisana do dostawcy w `models.providers.<provider>.agentRuntime`.
3. W trybie `auto` zarejestrowane runtimy Plugin mogą zgłaszać obsługiwane pary dostawca/model.
4. Jeśli w trybie `auto` żaden runtime nie zgłosi tury, OpenClaw używa PI jako runtime kompatybilności. Użyj jawnego identyfikatora runtime, gdy uruchomienie musi być ścisłe.

Przypięcia runtime dla całej sesji i całego agenta są ignorowane. Obejmuje to `OPENCLAW_AGENT_RUNTIME`, stan sesji `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` oraz `agents.list[].agentRuntime`. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualną konfigurację runtime całego agenta i przekonwertować przestarzałe odwołania runtime do modeli tam, gdzie OpenClaw może zachować intencję.

Jawne runtimy Plugin dostawcy/modelu zawodzą w sposób zamknięty. Na przykład `agentRuntime.id: "codex"` przy dostawcy lub modelu oznacza Codex albo jasny błąd wyboru/runtime; nigdy nie jest po cichu kierowane z powrotem do PI.

Aliasy backendów CLI różnią się od identyfikatorów osadzonych harnessów. Preferowana forma Claude CLI to:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Przestarzałe odwołania, takie jak `claude-cli/claude-opus-4-7`, pozostają obsługiwane dla kompatybilności, ale nowa konfiguracja powinna zachowywać kanoniczną postać dostawca/model i umieszczać backend wykonawczy w polityce runtime dostawcy/modelu.

Tryb `auto` jest celowo konserwatywny dla większości dostawców. Modele agentów OpenAI są wyjątkiem: brak ustawionego runtime i `auto` rozstrzygają się do harnessa Codex. Jawna konfiguracja runtime PI pozostaje opcjonalną trasą kompatybilności dla tur agentów `openai/*`; po sparowaniu z wybranym profilem uwierzytelniania `openai-codex` OpenClaw kieruje PI wewnętrznie przez przestarzały transport uwierzytelniania Codex, zachowując publiczne odwołanie do modelu jako `openai/*`. Nieaktualne przypięcia sesji OpenAI PI są ignorowane przez wybór runtime i można je wyczyścić za pomocą `openclaw doctor --fix`.

Jeśli `openclaw doctor` ostrzega, że Plugin `codex` jest włączony, a w konfiguracji nadal pozostaje `openai-codex/*`, traktuj to jako przestarzały stan trasy. Uruchom `openclaw doctor --fix`, aby przepisać go na `openai/*` z runtime Codex.

## Kontrakt kompatybilności

Gdy runtime nie jest PI, powinien dokumentować, które powierzchnie OpenClaw obsługuje. Użyj tej struktury dla dokumentacji runtime:

| Pytanie                               | Dlaczego to ważne                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Kto odpowiada za pętlę modelu?               | Określa, gdzie odbywają się ponowne próby, kontynuacja narzędzi i decyzje o odpowiedzi końcowej.                   |
| Kto odpowiada za kanoniczną historię wątku?     | Określa, czy OpenClaw może edytować historię, czy tylko ją odzwierciedlać.                                   |
| Czy narzędzia dynamiczne OpenClaw działają?        | Wiadomości, sesje, Cron i narzędzia należące do OpenClaw na tym polegają.                                 |
| Czy hooki narzędzi dynamicznych działają?            | Plugins oczekują `before_tool_call`, `after_tool_call` oraz middleware wokół narzędzi należących do OpenClaw. |
| Czy hooki narzędzi natywnych działają?             | Powłoka, łatki i narzędzia należące do środowiska uruchomieniowego wymagają natywnej obsługi hooków na potrzeby zasad i obserwacji.        |
| Czy działa cykl życia silnika kontekstu? | Plugin pamięci i kontekstu zależą od cyklu życia składania, pobierania, działań po turze oraz Compaction.      |
| Jakie dane Compaction są ujawniane?       | Niektóre Plugins potrzebują tylko powiadomień, podczas gdy inne potrzebują metadanych zachowanych i odrzuconych elementów.                    |
| Co jest celowo nieobsługiwane?     | Użytkownicy nie powinni zakładać równoważności PI tam, gdzie natywne środowisko uruchomieniowe posiada więcej stanu.                  |

Kontrakt obsługi środowiska uruchomieniowego Codex jest udokumentowany w
[Środowisko uruchomieniowe harness Codex](/pl/plugins/codex-harness-runtime#v1-support-contract).

## Etykiety stanu

Dane wyjściowe stanu mogą pokazywać zarówno etykiety `Execution`, jak i `Runtime`. Traktuj je jako
diagnostykę, a nie nazwy dostawców.

- Referencja modelu, taka jak `openai/gpt-5.5`, wskazuje wybranego dostawcę/model.
- Identyfikator środowiska uruchomieniowego, taki jak `codex`, wskazuje, która pętla wykonuje turę.
- Etykieta kanału, taka jak Telegram lub Discord, wskazuje, gdzie odbywa się rozmowa.

Jeśli uruchomienie nadal pokazuje nieoczekiwane środowisko uruchomieniowe, najpierw sprawdź zasady
środowiska uruchomieniowego wybranego dostawcy/modelu. Starsze przypięcia środowiska uruchomieniowego sesji nie decydują już o routingu.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Środowisko uruchomieniowe harness Codex](/pl/plugins/codex-harness-runtime)
- [OpenAI](/pl/providers/openai)
- [Plugins harness agentów](/pl/plugins/sdk-agent-harness)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Modele](/pl/concepts/models)
- [Status](/pl/cli/status)
