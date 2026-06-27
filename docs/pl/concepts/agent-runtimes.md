---
read_when:
    - Wybierasz między OpenClaw, Codex, ACP lub innym natywnym środowiskiem uruchomieniowym agenta
    - Mylisz etykiety dostawcy/modelu/środowiska uruchomieniowego w statusie lub konfiguracji
    - Dokumentujesz parytet obsługi dla natywnego harnessa
summary: Jak OpenClaw oddziela dostawców modeli, modele, kanały i środowiska uruchomieniowe agentów
title: Środowiska uruchomieniowe agentów
x-i18n:
    generated_at: "2026-06-27T17:25:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Środowisko uruchomieniowe **agenta** to komponent, który posiada jedną przygotowaną pętlę modelu: odbiera prompt, steruje wyjściem modelu, obsługuje natywne wywołania narzędzi i zwraca ukończoną turę do OpenClaw.

Środowiska uruchomieniowe łatwo pomylić z dostawcami, ponieważ oba pojawiają się w pobliżu konfiguracji modelu. To różne warstwy:

| Warstwa                 | Przykłady                                    | Co to znaczy                                                               |
| ----------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| Dostawca                | `openai`, `anthropic`, `github-copilot`     | Jak OpenClaw uwierzytelnia, wykrywa modele i nazywa referencje modeli.     |
| Model                   | `gpt-5.5`, `claude-opus-4-6`                | Model wybrany dla tury agenta.                                             |
| Środowisko agenta       | `openclaw`, `codex`, `copilot`, `claude-cli` | Niskopoziomowa pętla lub backend, który wykonuje przygotowaną turę.        |
| Kanał                   | Telegram, Discord, Slack, WhatsApp          | Gdzie wiadomości wchodzą do OpenClaw i z niego wychodzą.                   |

W kodzie zobaczysz też słowo **harness**. Harness to implementacja, która udostępnia środowisko uruchomieniowe agenta. Na przykład dołączony harness Codex implementuje środowisko `codex`. Konfiguracja publiczna używa `agentRuntime.id` we wpisach dostawcy lub modelu; klucze środowiska dla całego agenta są starsze i ignorowane. `openclaw doctor --fix` usuwa stare przypięcia środowiska dla całego agenta i przepisuje starsze referencje modeli środowiska na kanoniczne referencje dostawca/model oraz, tam gdzie trzeba, politykę środowiska o zakresie modelu.

Istnieją dwie rodziny środowisk uruchomieniowych:

- **Osadzone harnessy** działają wewnątrz przygotowanej pętli agenta OpenClaw. Obecnie jest to wbudowane środowisko `openclaw` oraz zarejestrowane harnessy Plugin, takie jak `codex` i `copilot`.
- **Backendy CLI** uruchamiają lokalny proces CLI, zachowując kanoniczną referencję modelu. Na przykład `anthropic/claude-opus-4-8` z zakreśloną do modelu wartością `agentRuntime.id: "claude-cli"` znaczy „wybierz model Anthropic, wykonaj przez Claude CLI”. `claude-cli` nie jest identyfikatorem osadzonego harnessa i nie wolno przekazywać go do wyboru AgentHarness.

Harness `copilot` to osobny, opcjonalny zewnętrzny harness Plugin dla GitHub Copilot CLI; zobacz [Środowisko uruchomieniowe agenta GitHub Copilot](/pl/plugins/copilot), aby poznać decyzję widoczną dla użytkownika między PI, Codex i środowiskiem uruchomieniowym agenta GitHub Copilot.

## Powierzchnie Codex

Większość nieporozumień wynika z tego, że kilka różnych powierzchni współdzieli nazwę Codex:

| Powierzchnia                                    | Nazwa/konfiguracja OpenClaw          | Co robi                                                                                                         |
| ----------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Natywne środowisko Codex app-server             | referencje modeli `openai/*`         | Uruchamia osadzone tury agenta OpenAI przez Codex app-server. To zwykła konfiguracja subskrypcji ChatGPT/Codex. |
| Profile uwierzytelniania Codex OAuth            | profile OAuth `openai`               | Przechowuje uwierzytelnianie subskrypcji ChatGPT/Codex używane przez harness Codex app-server.                  |
| Adapter Codex ACP                               | `runtime: "acp"`, `agentId: "codex"` | Uruchamia Codex przez zewnętrzną płaszczyznę sterowania ACP/acpx. Używaj tylko wtedy, gdy wyraźnie poproszono o ACP/acpx. |
| Natywny zestaw poleceń sterowania czatem Codex   | `/codex ...`                         | Wiąże, wznawia, steruje, zatrzymuje i sprawdza wątki Codex app-server z czatu.                                  |
| Trasa OpenAI Platform API dla powierzchni nieagentowych | `openai/*` plus uwierzytelnianie kluczem API | Używana do bezpośrednich API OpenAI, takich jak obrazy, osadzenia, mowa i realtime.                             |

Te powierzchnie są celowo niezależne. Włączenie Plugin `codex` udostępnia natywne funkcje app-server; `openclaw doctor --fix` odpowiada za naprawę starszych tras Codex i czyszczenie nieaktualnych przypięć sesji. Wybranie `openai/*` jako modelu agenta oznacza teraz „uruchom to przez Codex”, chyba że używana jest nieagentowa powierzchnia API OpenAI.

Typowa konfiguracja subskrypcji ChatGPT/Codex używa Codex OAuth do uwierzytelniania, ale zachowuje referencję modelu jako `openai/*` i wybiera środowisko `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Oznacza to, że OpenClaw wybiera referencję modelu OpenAI, a następnie prosi środowisko Codex app-server o uruchomienie osadzonej tury agenta. Nie oznacza to „użyj rozliczania API” ani nie oznacza, że kanał, katalog dostawców modeli lub magazyn sesji OpenClaw staje się Codex.

Gdy dołączony Plugin `codex` jest włączony, sterowanie Codex w języku naturalnym powinno używać natywnej powierzchni poleceń `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) zamiast ACP. Używaj ACP dla Codex tylko wtedy, gdy użytkownik wyraźnie prosi o ACP/acpx lub testuje ścieżkę adaptera ACP. Claude Code, Gemini CLI, OpenCode, Cursor i podobne zewnętrzne harnessy nadal używają ACP.

To jest drzewo decyzji dla agenta:

1. Jeśli użytkownik prosi o **wiązanie/sterowanie/wątek/wznowienie/sterowanie/zatrzymanie Codex**, użyj natywnej powierzchni poleceń `/codex`, gdy dołączony Plugin `codex` jest włączony.
2. Jeśli użytkownik prosi o **Codex jako osadzone środowisko uruchomieniowe** albo chce normalnego doświadczenia agenta Codex wspieranego subskrypcją, użyj `openai/<model>`.
3. Jeśli użytkownik wyraźnie wybiera **OpenClaw dla modelu OpenAI**, zachowaj referencję modelu jako `openai/<model>` i ustaw politykę środowiska dostawcy/modelu na `agentRuntime.id: "openclaw"`. Wybrany profil OAuth `openai` jest wewnętrznie routowany przez transport uwierzytelniania Codex OpenClaw.
4. Jeśli starsza konfiguracja nadal zawiera **starsze referencje modeli Codex**, napraw ją do `openai/<model>` za pomocą `openclaw doctor --fix`; doctor zachowuje trasę uwierzytelniania Codex przez dodanie `agentRuntime.id: "codex"` o zakresie dostawcy/modelu tam, gdzie sugerowała to stara referencja modelu.
   Starsze **referencje modeli `codex-cli/*`** są naprawiane do tej samej trasy Codex app-server `openai/<model>`; OpenClaw nie utrzymuje już dołączonego backendu Codex CLI.
5. Jeśli użytkownik wyraźnie mówi **ACP**, **acpx** lub **adapter Codex ACP**, użyj ACP z `runtime: "acp"` i `agentId: "codex"`.
6. Jeśli prośba dotyczy **Claude Code, Gemini CLI, OpenCode, Cursor, Droid lub innego zewnętrznego harnessa**, użyj ACP/acpx, a nie natywnego środowiska podagenta.

| Masz na myśli...                              | Użyj...                                     |
| --------------------------------------------- | ------------------------------------------- |
| Sterowanie czatem/wątkiem Codex app-server    | `/codex ...` z dołączonego Plugin `codex`   |
| Osadzone środowisko agenta Codex app-server   | referencje modeli agenta `openai/*`         |
| OpenAI Codex OAuth                            | profile OAuth `openai`                      |
| Claude Code lub inny zewnętrzny harness       | ACP/acpx                                    |

Podział prefiksów rodziny OpenAI opisują [OpenAI](/pl/providers/openai) i [Dostawcy modeli](/pl/concepts/model-providers). Kontrakt wsparcia środowiska Codex opisuje [Środowisko harnessa Codex](/pl/plugins/codex-harness-runtime#v1-support-contract).

## Własność środowiska uruchomieniowego

Różne środowiska uruchomieniowe posiadają różne części pętli.

| Powierzchnia                 | Osadzone OpenClaw                              | Codex app-server                                                            |
| ---------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| Właściciel pętli modelu      | OpenClaw przez osadzony runner OpenClaw        | Codex app-server                                                            |
| Kanoniczny stan wątku        | Transkrypt OpenClaw                            | Wątek Codex oraz lustrzana kopia transkryptu OpenClaw                       |
| Dynamiczne narzędzia OpenClaw | Natywna pętla narzędzi OpenClaw                | Mostkowane przez adapter Codex                                              |
| Natywna powłoka i narzędzia plików | Ścieżka OpenClaw                         | Narzędzia natywne Codex, mostkowane przez natywne hooki tam, gdzie obsługiwane |
| Silnik kontekstu             | Natywne składanie kontekstu OpenClaw           | OpenClaw składa kontekst projektu do tury Codex                             |
| Compaction                   | OpenClaw lub wybrany silnik kontekstu          | Natywne zagęszczanie Codex, z powiadomieniami OpenClaw i utrzymaniem lustrzanej kopii |
| Dostarczanie kanału          | OpenClaw                                       | OpenClaw                                                                    |

Ten podział własności jest główną zasadą projektową:

- Jeśli OpenClaw posiada powierzchnię, OpenClaw może zapewnić normalne zachowanie hooków Plugin.
- Jeśli natywne środowisko posiada powierzchnię, OpenClaw potrzebuje zdarzeń środowiska lub natywnych hooków.
- Jeśli natywne środowisko posiada kanoniczny stan wątku, OpenClaw powinien tworzyć lustrzaną kopię i projektować kontekst, a nie przepisywać nieobsługiwane elementy wewnętrzne.

## Wybór środowiska uruchomieniowego

OpenClaw wybiera osadzone środowisko uruchomieniowe po rozstrzygnięciu dostawcy i modelu:

1. Wygrywa polityka środowiska o zakresie modelu. Może znajdować się w skonfigurowanym wpisie modelu dostawcy albo w `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`. Wieloznaczny wpis dostawcy, taki jak `agents.defaults.models["vllm/*"].agentRuntime`, ma zastosowanie po dokładnej polityce modelu, więc dynamicznie wykryte modele dostawcy mogą współdzielić jedno środowisko bez nadpisywania dokładnych wyjątków dla poszczególnych modeli.
2. Następna jest polityka środowiska o zakresie dostawcy w `models.providers.<provider>.agentRuntime`.
3. W trybie `auto` zarejestrowane środowiska Plugin mogą zgłaszać obsługiwane pary dostawca/model.
4. Jeśli żadne środowisko nie zgłosi tury w trybie `auto`, OpenClaw używa `openclaw` jako środowiska zgodności. Użyj jawnego identyfikatora środowiska, gdy uruchomienie musi być ścisłe.

Przypięcia środowiska dla całej sesji i całego agenta są ignorowane. Dotyczy to `OPENCLAW_AGENT_RUNTIME`, stanu sesji `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` oraz `agents.list[].agentRuntime`. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualną konfigurację środowiska dla całego agenta i przekonwertować starsze referencje modeli środowiska tam, gdzie OpenClaw może zachować intencję.

Jawne środowiska Plugin dostawcy/modelu zamykają się przy błędzie. Na przykład `agentRuntime.id: "codex"` na dostawcy lub modelu oznacza Codex albo jasny błąd wyboru/środowiska; nigdy nie jest po cichu routowane z powrotem do OpenClaw.

Aliasy backendów CLI różnią się od identyfikatorów osadzonych harnessów. Preferowana forma Claude CLI to:

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

Starsze referencje, takie jak `claude-cli/claude-opus-4-7`, pozostają obsługiwane ze względu na zgodność, ale nowa konfiguracja powinna zachowywać kanoniczny zapis dostawca/model i umieszczać backend wykonawczy w polityce środowiska dostawcy/modelu.

Starsze referencje `codex-cli/*` są inne: doctor migruje je do `openai/*`, aby działały przez harness Codex app-server zamiast zachowywać backend Codex CLI.

Tryb `auto` jest celowo konserwatywny dla większości dostawców. Modele agentowe OpenAI są wyjątkiem: brak ustawionego środowiska i `auto` rozstrzygają się na harness Codex. Jawna konfiguracja środowiska OpenClaw pozostaje opcjonalną trasą zgodności dla tur agenta `openai/*`; gdy jest sparowana z wybranym profilem OAuth `openai`, OpenClaw routuje tę ścieżkę wewnętrznie przez transport uwierzytelniania Codex, zachowując publiczną referencję modelu jako `openai/*`. Nieaktualne przypięcia sesji środowiska OpenAI są ignorowane przez wybór środowiska i można je wyczyścić za pomocą `openclaw doctor --fix`.

Jeśli `openclaw doctor` ostrzega, że Plugin `codex` jest włączony, podczas gdy
w konfiguracji pozostają starsze odwołania do modeli Codex, potraktuj to jako starszy stan trasy. Uruchom
`openclaw doctor --fix`, aby przepisać go na `openai/*` ze środowiskiem uruchomieniowym Codex.

## Środowisko uruchomieniowe agenta GitHub Copilot

Zewnętrzny Plugin `@openclaw/copilot` rejestruje opcjonalne środowisko uruchomieniowe `copilot`,
oparte na GitHub Copilot CLI (`@github/copilot-sdk`). Deklaruje
kanonicznego dostawcę subskrypcji `github-copilot` i **nigdy** nie jest wybierany przez
`auto`. Włącz je dla modelu lub dostawcy za pomocą `agentRuntime.id`:

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

Harness deklaruje swojego dostawcę, środowisko uruchomieniowe, klucz sesji CLI i prefiks profilu uwierzytelniania
w `extensions/copilot/doctor-contract-api.ts`, który
`openclaw doctor` ładuje automatycznie. Informacje o konfiguracji, uwierzytelnianiu, lustrzanym zapisie transkrypcji,
Compaction, deklaratywnym kontrakcie doctor oraz szerszej decyzji PI vs Codex vs
Copilot SDK znajdziesz w [środowisku uruchomieniowym agenta GitHub Copilot](/pl/plugins/copilot).

## Kontrakt zgodności

Gdy środowisko uruchomieniowe nie jest OpenClaw, powinno dokumentować, które powierzchnie OpenClaw obsługuje.
Użyj tej struktury w dokumentacji środowiska uruchomieniowego:

| Pytanie                               | Dlaczego to ma znaczenie                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Kto jest właścicielem pętli modelu?               | Określa, gdzie odbywają się ponowienia, kontynuacja narzędzi i decyzje o odpowiedzi końcowej.                   |
| Kto jest właścicielem kanonicznej historii wątku?     | Określa, czy OpenClaw może edytować historię, czy tylko ją odzwierciedlać.                                   |
| Czy dynamiczne narzędzia OpenClaw działają?        | Wiadomości, sesje, Cron i narzędzia należące do OpenClaw polegają na tym.                                 |
| Czy hooki narzędzi dynamicznych działają?            | Pluginy oczekują `before_tool_call`, `after_tool_call` i middleware wokół narzędzi należących do OpenClaw. |
| Czy hooki narzędzi natywnych działają?             | Shell, patch i narzędzia należące do środowiska uruchomieniowego potrzebują natywnej obsługi hooków na potrzeby zasad i obserwacji.        |
| Czy działa cykl życia silnika kontekstu? | Pluginy pamięci i kontekstu zależą od cyklu życia assemble, ingest, after-turn i Compaction.      |
| Jakie dane Compaction są udostępniane?       | Niektóre Pluginy potrzebują tylko powiadomień, podczas gdy inne potrzebują metadanych zachowanych/odrzuconych.                    |
| Co jest celowo nieobsługiwane?     | Użytkownicy nie powinni zakładać równoważności z OpenClaw tam, gdzie natywne środowisko uruchomieniowe posiada więcej stanu.            |

Kontrakt obsługi środowiska uruchomieniowego Codex jest udokumentowany w
[środowisku uruchomieniowym harnessu Codex](/pl/plugins/codex-harness-runtime#v1-support-contract).

## Etykiety statusu

Dane statusu mogą pokazywać zarówno etykiety `Execution`, jak i `Runtime`. Traktuj je jako
diagnostykę, a nie nazwy dostawców.

- Odwołanie do modelu, takie jak `openai/gpt-5.5`, wskazuje wybranego dostawcę/model.
- Identyfikator środowiska uruchomieniowego, taki jak `codex`, wskazuje, która pętla wykonuje turę.
- Etykieta kanału, taka jak Telegram lub Discord, wskazuje, gdzie odbywa się rozmowa.

Jeśli uruchomienie nadal pokazuje nieoczekiwane środowisko uruchomieniowe, najpierw sprawdź politykę środowiska uruchomieniowego
wybranego dostawcy/modelu. Starsze przypięcia środowiska uruchomieniowego sesji nie decydują już o routingu.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Środowisko uruchomieniowe agenta GitHub Copilot](/pl/plugins/copilot)
- [OpenAI](/pl/providers/openai)
- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Modele](/pl/concepts/models)
- [Status](/pl/cli/status)
