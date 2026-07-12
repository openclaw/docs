---
read_when:
    - Wybierasz między OpenClaw, Codex, ACP lub innym natywnym środowiskiem wykonawczym agenta
    - Mylą Cię etykiety dostawcy/modelu/środowiska uruchomieniowego w statusie lub konfiguracji
    - Dokumentujesz równoważność obsługi dla natywnego środowiska testowego
summary: Jak OpenClaw oddziela dostawców modeli, modele, kanały i środowiska uruchomieniowe agentów
title: Środowiska uruchomieniowe agentów
x-i18n:
    generated_at: "2026-07-12T14:57:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**Środowisko wykonawcze agenta** jest właścicielem jednej przygotowanej pętli modelu: odbiera prompt,
steruje danymi wyjściowymi modelu, obsługuje natywne wywołania narzędzi i zwraca ukończoną turę
do OpenClaw.

Środowiska wykonawcze łatwo pomylić z dostawcami, ponieważ oba pojawiają się w pobliżu konfiguracji
modelu. Są to różne warstwy:

| Warstwa                      | Przykłady                                    | Znaczenie                                                                                  |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Dostawca                     | `anthropic`, `github-copilot`, `openai`      | Sposób, w jaki OpenClaw uwierzytelnia, wykrywa modele i nazywa odwołania do modeli.         |
| Model                        | `claude-opus-4-6`, `gpt-5.6-sol`             | Model wybrany dla tury agenta.                                                             |
| Środowisko wykonawcze agenta | `claude-cli`, `codex`, `copilot`, `openclaw` | Niskopoziomowa pętla lub backend, który wykonuje przygotowaną turę.                         |
| Kanał                        | Discord, Slack, Telegram, WhatsApp           | Miejsce, przez które wiadomości trafiają do OpenClaw i z niego wychodzą.                    |

**Harness** to implementacja udostępniająca środowisko wykonawcze agenta (termin
używany w kodzie). Na przykład dołączony harness Codex implementuje środowisko wykonawcze `codex`.
Konfiguracja publiczna używa `agentRuntime.id` we wpisach dostawcy lub modelu; klucze środowiska
wykonawczego dotyczące całego agenta są przestarzałe i ignorowane. `openclaw doctor --fix` usuwa stare
przypięcia środowiska wykonawczego dla całego agenta i przepisuje przestarzałe odwołania modeli środowiska wykonawczego na kanoniczne
odwołania dostawca/model oraz, w razie potrzeby, zasady środowiska wykonawczego o zakresie modelu.

Dwie rodziny środowisk wykonawczych:

- **Osadzone harnessy** działają wewnątrz przygotowanej pętli agenta OpenClaw: wbudowane
  środowisko wykonawcze `openclaw` oraz zarejestrowane harnessy Pluginów, takie jak
  `codex` i `copilot`.
- **Backendy CLI** uruchamiają lokalny proces CLI, zachowując kanoniczne odwołanie do modelu.
  Na przykład `anthropic/claude-opus-4-8` z ustawieniem
  `agentRuntime.id: "claude-cli"` o zakresie modelu oznacza „wybierz model Anthropic i wykonaj
  go przez Claude CLI”. `claude-cli` nie jest identyfikatorem osadzonego harnessu i nie wolno
  przekazywać go do wyboru AgentHarness.

Harness `copilot` jest oddzielnym, opcjonalnym zewnętrznym harnesssem Pluginu dla
GitHub Copilot CLI; zobacz [środowisko wykonawcze agenta GitHub Copilot](/pl/plugins/copilot), aby poznać
przeznaczony dla użytkownika wybór między PI, Codex a środowiskiem wykonawczym agenta GitHub Copilot.

## Powierzchnie Codex

Kilka powierzchni współdzieli nazwę Codex:

| Powierzchnia                                     | Nazwa/konfiguracja OpenClaw            | Działanie                                                                                                                  |
| ------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Natywne środowisko wykonawcze serwera aplikacji Codex | odwołania modeli `openai/*`         | Uruchamia osadzone tury agenta OpenAI przez serwer aplikacji Codex. Jest to typowa konfiguracja subskrypcji ChatGPT/Codex.  |
| Profile uwierzytelniania Codex OAuth             | profile OAuth `openai`                  | Przechowuje dane uwierzytelniające subskrypcji ChatGPT/Codex używane przez harness serwera aplikacji Codex.                |
| Adapter Codex ACP                                | `runtime: "acp"`, `agentId: "codex"`    | Uruchamia Codex przez zewnętrzną płaszczyznę sterowania ACP/acpx. Używaj tylko wtedy, gdy wyraźnie zażądano ACP/acpx.       |
| Natywny zestaw poleceń sterowania czatem Codex   | `/codex ...`                            | Wiąże, wznawia, steruje, zatrzymuje i sprawdza wątki serwera aplikacji Codex z poziomu czatu.                               |
| Trasa API OpenAI Platform dla powierzchni nieagentowych | `openai/*` oraz uwierzytelnianie kluczem API | Bezpośrednie interfejsy API OpenAI, takie jak obrazy, osadzenia, mowa i komunikacja w czasie rzeczywistym.           |

Te powierzchnie są celowo niezależne. Włączenie Pluginu `codex`
udostępnia natywne funkcje serwera aplikacji; `openclaw doctor --fix` odpowiada za
naprawę przestarzałych tras Codex i czyszczenie nieaktualnych przypięć sesji. Wybranie `openai/*`
dla modelu agenta oznacza teraz „uruchom to przez Codex”, chyba że używana jest nieagentowa
powierzchnia API OpenAI.

Typowa konfiguracja subskrypcji ChatGPT/Codex używa Codex OAuth do uwierzytelniania, ale
zachowuje odwołanie do modelu jako `openai/*` i wybiera środowisko wykonawcze `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Oznacza to, że OpenClaw wybiera odwołanie do modelu OpenAI, a następnie prosi środowisko wykonawcze
serwera aplikacji Codex o uruchomienie osadzonej tury agenta. Nie oznacza to „użyj rozliczeń API”
ani nie oznacza, że kanał, katalog dostawców modeli lub magazyn sesji
OpenClaw staje się częścią Codex.

Gdy dołączony Plugin `codex` jest włączony, używaj natywnej powierzchni poleceń `/codex`
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) do sterowania Codex językiem naturalnym zamiast ACP. Używaj ACP dla
Codex tylko wtedy, gdy użytkownik wyraźnie prosi o ACP/acpx lub testuje ścieżkę adaptera ACP.
Claude Code, Gemini CLI, OpenCode, Cursor i podobne zewnętrzne
harnessy nadal używają ACP.

Drzewo decyzyjne:

1. **Wiązanie/sterowanie/wątek/wznawianie/kierowanie/zatrzymywanie Codex** -> natywna powierzchnia poleceń `/codex`, gdy dołączony Plugin `codex` jest włączony.
2. **Codex jako osadzone środowisko wykonawcze** lub zwykłe środowisko agenta Codex oparte na subskrypcji -> `openai/<model>`.
3. **OpenClaw wybrany jawnie dla modelu OpenAI** -> zachowaj odwołanie do modelu jako `openai/<model>` i ustaw zasady środowiska wykonawczego dostawcy/modelu na `agentRuntime.id: "openclaw"`. Wybrany profil OAuth `openai` jest wewnętrznie kierowany przez transport uwierzytelniania Codex należący do OpenClaw.
4. **Przestarzałe odwołania modeli Codex w konfiguracji** -> napraw je za pomocą `openclaw doctor --fix` do postaci `openai/<model>`; doctor zachowuje trasę uwierzytelniania Codex, dodając `agentRuntime.id: "codex"` o zakresie dostawcy/modelu tam, gdzie wskazywało na to stare odwołanie do modelu. Przestarzałe odwołania modeli **`codex-cli/*`** są naprawiane do tej samej trasy serwera aplikacji Codex `openai/<model>`; OpenClaw nie zachowuje już dołączonego backendu Codex CLI.
5. **Wyraźnie zażądano ACP, acpx lub adaptera Codex ACP** -> `runtime: "acp"` i `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid lub inny zewnętrzny harness** -> ACP/acpx, a nie natywne środowisko wykonawcze podagentów.

| Masz na myśli...                                  | Użyj...                                             |
| ------------------------------------------------- | --------------------------------------------------- |
| Sterowanie czatem/wątkami serwera aplikacji Codex | `/codex ...` z dołączonego Pluginu `codex`          |
| Osadzone środowisko wykonawcze agenta serwera aplikacji Codex | odwołania modeli agenta `openai/*`         |
| OpenAI Codex OAuth                                | profile OAuth `openai`                              |
| Claude Code lub inny zewnętrzny harness           | ACP/acpx                                            |

Podział prefiksów rodziny OpenAI opisano w [OpenAI](/pl/providers/openai) oraz
[Dostawcach modeli](/pl/concepts/model-providers). Kontrakt obsługi środowiska wykonawczego Codex
opisano w [Środowisku wykonawczym harnessu Codex](/pl/plugins/codex-harness-runtime#v1-support-contract).

## Własność środowiska wykonawczego

Różne środowiska wykonawcze odpowiadają za różne części pętli:

| Powierzchnia                 | Osadzone OpenClaw                                  | Serwer aplikacji Codex                                                         |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| Właściciel pętli modelu      | OpenClaw, za pośrednictwem osadzonego runnera OpenClaw | Serwer aplikacji Codex                                                      |
| Kanoniczny stan wątku        | Transkrypcja OpenClaw                              | Wątek Codex wraz z kopią lustrzaną transkrypcji OpenClaw                        |
| Dynamiczne narzędzia OpenClaw | Natywna pętla narzędzi OpenClaw                   | Mostkowane przez adapter Codex                                                   |
| Natywne narzędzia powłoki i plików | Ścieżka OpenClaw                            | Natywne narzędzia Codex, mostkowane przez natywne hooki tam, gdzie są obsługiwane |
| Silnik kontekstu             | Natywne składanie kontekstu OpenClaw               | OpenClaw rzutuje złożony kontekst na turę Codex                                  |
| Compaction                   | OpenClaw lub wybrany silnik kontekstu              | Natywna kompaktacja Codex z powiadomieniami OpenClaw i utrzymaniem kopii lustrzanej |
| Dostarczanie do kanału       | OpenClaw                                           | OpenClaw                                                                        |

Zasada projektowa: jeśli OpenClaw jest właścicielem powierzchni, może zapewniać standardowe
działanie hooków Pluginów. Jeśli właścicielem powierzchni jest natywne środowisko wykonawcze, OpenClaw potrzebuje
zdarzeń środowiska wykonawczego lub natywnych hooków. Jeśli natywne środowisko wykonawcze jest właścicielem kanonicznego stanu wątku,
OpenClaw tworzy kopię lustrzaną i rzutuje kontekst, zamiast przepisywać nieobsługiwane
elementy wewnętrzne.

## Wybór środowiska wykonawczego

OpenClaw rozpoznaje osadzone środowisko wykonawcze po rozpoznaniu dostawcy i modelu, w
następującej kolejności:

1. **Zasady środowiska wykonawczego o zakresie modelu** mają pierwszeństwo. Znajdują się w skonfigurowanym wpisie
   modelu dostawcy albo w `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime`. Symbol wieloznaczny dostawcy,
   taki jak `agents.defaults.models["vllm/*"].agentRuntime`, jest stosowany
   po dokładnych zasadach modelu, dzięki czemu dynamicznie wykrywane modele dostawcy mogą
   współdzielić jedno środowisko wykonawcze bez zastępowania dokładnych wyjątków poszczególnych modeli.
2. **Zasady środowiska wykonawczego o zakresie dostawcy**: `models.providers.<provider>.agentRuntime`.
3. **Tryb `auto`**: zarejestrowane środowiska wykonawcze Pluginów mogą zgłaszać obsługę par dostawca/model.
4. Jeśli w trybie `auto` żadne środowisko nie zgłosi obsługi tury, OpenClaw używa
   `openclaw` jako zgodnościowego środowiska wykonawczego. Użyj jawnego identyfikatora środowiska wykonawczego, gdy
   wykonanie musi być ścisłe.

Przypięcia środowiska wykonawczego dla całej sesji i całego agenta są ignorowane: `OPENCLAW_AGENT_RUNTIME`,
stan sesji `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`
oraz `agents.list[].agentRuntime`. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualną
konfigurację środowiska wykonawczego dla całego agenta i przekonwertować przestarzałe odwołania modeli środowiska wykonawczego tam, gdzie
można zachować zamiar.

Jawne środowiska wykonawcze Pluginów dostawcy/modelu kończą działanie przy błędzie: `agentRuntime.id: "codex"`
dla dostawcy lub modelu oznacza Codex albo jednoznaczny błąd wyboru/środowiska wykonawczego — nigdy nie jest
po cichu kierowane z powrotem do OpenClaw. Tylko `auto` może skierować niedopasowaną
turę do OpenClaw.

Aliasy backendów CLI różnią się od identyfikatorów osadzonych harnessów. Preferowana postać Claude CLI:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Przestarzałe odwołania, takie jak `claude-cli/claude-opus-4-7`, pozostają obsługiwane ze względu na
zgodność, ale nowa konfiguracja powinna zachowywać kanoniczną postać dostawca/model i
umieszczać backend wykonawczy w zasadach środowiska wykonawczego dostawcy/modelu.

Przestarzałe odwołania `codex-cli/*` są inne: doctor migruje je do `openai/*`, aby
działały przez harness serwera aplikacji Codex, zamiast zachowywać backend Codex
CLI.

Tryb `auto` jest celowo zachowawczy dla większości dostawców. Modele agentów OpenAI
są wyjątkiem: zarówno nieustawione środowisko wykonawcze, jak i `auto` prowadzą do harnessu Codex.
Jawna konfiguracja środowiska wykonawczego OpenClaw pozostaje opcjonalną trasą zgodności
dla tur agenta `openai/*`; w połączeniu z wybranym profilem OAuth
`openai` OpenClaw wewnętrznie kieruje tę ścieżkę przez transport uwierzytelniania
Codex, zachowując publiczne odwołanie do modelu jako `openai/*`. Nieaktualne przypięcia sesji środowiska wykonawczego
OpenAI są ignorowane podczas wyboru środowiska wykonawczego i można je usunąć za pomocą
`openclaw doctor --fix`.

Jeśli `openclaw doctor` ostrzega, że Plugin `codex` jest włączony, a w konfiguracji
pozostają przestarzałe odwołania modeli Codex, potraktuj je jako przestarzały stan trasy i uruchom
`openclaw doctor --fix`, aby przepisać je na `openai/*` ze środowiskiem wykonawczym Codex.

## Środowisko wykonawcze agenta GitHub Copilot

Zewnętrzny plugin `@openclaw/copilot` rejestruje opcjonalne środowisko wykonawcze `copilot`
oparte na CLI GitHub Copilot (`@github/copilot-sdk`). Przejmuje ono
kanonicznego dostawcę subskrypcji `github-copilot` i **nigdy** nie jest wybierane przez
`auto`. Włącz je osobno dla modelu lub dostawcy za pomocą `agentRuntime.id`:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Mechanizm testowy deklaruje swojego dostawcę, środowisko wykonawcze, klucz sesji CLI oraz prefiks
profilu uwierzytelniania w `extensions/copilot/doctor-contract-api.ts`, który polecenie `openclaw doctor`
wczytuje automatycznie. Informacje o konfiguracji, uwierzytelnianiu, replikowaniu transkrypcji, Compaction,
deklaratywnym kontrakcie narzędzia doctor oraz szerszym wyborze między SDK Pi, Codex i Copilot
zawiera strona [Środowisko wykonawcze agenta GitHub Copilot](/pl/plugins/copilot).

## Kontrakt zgodności

Gdy środowisko wykonawcze nie należy do OpenClaw, jego dokumentacja powinna określać, które obszary OpenClaw
obsługuje:

| Pytanie                                             | Dlaczego jest to ważne                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Kto zarządza pętlą modelu?                          | Określa, gdzie podejmowane są decyzje o ponowieniach, kontynuacji narzędzi i ostatecznej odpowiedzi.                     |
| Kto zarządza kanoniczną historią wątku?             | Określa, czy OpenClaw może edytować historię, czy tylko ją replikować.                                                   |
| Czy dynamiczne narzędzia OpenClaw działają?         | Zależą od tego wiadomości, sesje, cron oraz narzędzia należące do OpenClaw.                                              |
| Czy działają haki narzędzi dynamicznych?            | Pluginy oczekują `before_tool_call`, `after_tool_call` oraz warstwy pośredniczącej wokół narzędzi należących do OpenClaw. |
| Czy działają haki narzędzi natywnych?               | Powłoka, poprawki i narzędzia należące do środowiska wykonawczego wymagają obsługi natywnych haków do egzekwowania zasad i obserwacji. |
| Czy działa cykl życia mechanizmu kontekstu?         | Pluginy pamięci i kontekstu zależą od etapów składania, przyswajania, przetwarzania po turze i cyklu życia Compaction.   |
| Jakie dane Compaction są udostępniane?              | Niektóre pluginy potrzebują tylko powiadomień, a inne metadanych o zachowanych i odrzuconych elementach.                 |
| Co celowo nie jest obsługiwane?                     | Użytkownicy nie powinni zakładać równoważności z OpenClaw, gdy natywne środowisko wykonawcze zarządza większą częścią stanu. |

Kontrakt obsługi środowiska wykonawczego Codex opisano na stronie
[Środowisko wykonawcze mechanizmu testowego Codex](/pl/plugins/codex-harness-runtime#v1-support-contract).

## Etykiety stanu

Dane wyjściowe stanu mogą zawierać zarówno etykietę `Execution`, jak i `Runtime`. Należy je odczytywać jako
informacje diagnostyczne, a nie nazwy dostawców:

- Odwołanie do modelu, takie jak `openai/gpt-5.6-sol`, oznacza wybranego dostawcę i model.
- Identyfikator środowiska wykonawczego, taki jak `codex`, oznacza pętlę wykonującą turę.
- Etykieta kanału, taka jak Telegram lub Discord, wskazuje miejsce prowadzenia rozmowy.

Jeśli uruchomienie wskazuje nieoczekiwane środowisko wykonawcze, najpierw sprawdź zasady środowiska wykonawczego
dla wybranego dostawcy i modelu. Starsze przypisania środowiska wykonawczego zapisane w sesji nie decydują już o trasowaniu.

## Powiązane materiały

- [Mechanizm testowy Codex](/pl/plugins/codex-harness)
- [Środowisko wykonawcze mechanizmu testowego Codex](/pl/plugins/codex-harness-runtime)
- [Środowisko wykonawcze agenta GitHub Copilot](/pl/plugins/copilot)
- [OpenAI](/pl/providers/openai)
- [Pluginy mechanizmu testowego agenta](/pl/plugins/sdk-agent-harness)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Modele](/pl/concepts/models)
- [Stan](/pl/cli/status)
