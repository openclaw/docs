---
read_when:
    - Wybierasz między PI, Codex, ACP a innym natywnym środowiskiem uruchomieniowym agenta
    - Mylą Cię etykiety dostawcy/modelu/środowiska uruchomieniowego w statusie lub konfiguracji
    - Dokumentujesz parytet wsparcia dla natywnego środowiska testowego
summary: Jak OpenClaw oddziela dostawców modeli, modele, kanały i środowiska uruchomieniowe agentów
title: Środowiska uruchomieniowe agentów
x-i18n:
    generated_at: "2026-05-07T13:15:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**środowisko uruchomieniowe agenta** to komponent, który jest właścicielem jednej przygotowanej pętli modelu: odbiera prompt, steruje wyjściem modelu, obsługuje natywne wywołania narzędzi i zwraca zakończoną turę do OpenClaw.

Środowiska uruchomieniowe łatwo pomylić z dostawcami, ponieważ oba pojawiają się w pobliżu konfiguracji modelu. To różne warstwy:

| Warstwa | Przykłady | Co to oznacza |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Dostawca | `openai`, `anthropic`, `openai-codex` | Jak OpenClaw uwierzytelnia, wykrywa modele i nazywa odwołania do modeli. |
| Model | `gpt-5.5`, `claude-opus-4-6` | Model wybrany dla tury agenta. |
| Środowisko uruchomieniowe agenta | `pi`, `codex`, `claude-cli` | Niskopoziomowa pętla lub backend, który wykonuje przygotowaną turę. |
| Kanał | Telegram, Discord, Slack, WhatsApp | Miejsce, w którym wiadomości wchodzą do OpenClaw i z niego wychodzą. |

W kodzie zobaczysz też słowo **harness**. Harness to implementacja, która zapewnia środowisko uruchomieniowe agenta. Na przykład dołączony harness Codex implementuje środowisko uruchomieniowe `codex`. Konfiguracja publiczna używa `agentRuntime.id`; `openclaw doctor --fix` przepisuje starsze klucze runtime-policy do tej postaci.

Istnieją dwie rodziny środowisk uruchomieniowych:

- **Osadzone harnessy** działają wewnątrz przygotowanej pętli agenta OpenClaw. Obecnie jest to wbudowane środowisko uruchomieniowe `pi` oraz zarejestrowane harnessy Plugin, takie jak `codex`.
- **Backendy CLI** uruchamiają lokalny proces CLI, zachowując kanoniczne odwołanie do modelu. Na przykład `anthropic/claude-opus-4-7` z `agentRuntime.id: "claude-cli"` oznacza „wybierz model Anthropic, wykonaj przez Claude CLI”. `claude-cli` nie jest identyfikatorem osadzonego harnessa i nie wolno przekazywać go do wyboru AgentHarness.

## Powierzchnie Codex

Większość nieporozumień bierze się z kilku różnych powierzchni współdzielących nazwę Codex:

| Powierzchnia | Nazwa/konfiguracja OpenClaw | Co robi |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Natywne środowisko uruchomieniowe serwera aplikacji Codex | Odwołania do modeli `openai/*` | Uruchamia osadzone tury agenta OpenAI przez serwer aplikacji Codex. To typowa konfiguracja subskrypcji ChatGPT/Codex. |
| Profile uwierzytelniania OAuth Codex | Dostawca uwierzytelniania `openai-codex` | Przechowuje uwierzytelnianie subskrypcji ChatGPT/Codex, z którego korzysta harness serwera aplikacji Codex. |
| Adapter ACP Codex | `runtime: "acp"`, `agentId: "codex"` | Uruchamia Codex przez zewnętrzną płaszczyznę sterowania ACP/acpx. Używaj tylko wtedy, gdy wyraźnie poproszono o ACP/acpx. |
| Natywny zestaw poleceń sterowania czatem Codex | `/codex ...` | Łączy, wznawia, steruje, zatrzymuje i sprawdza wątki serwera aplikacji Codex z czatu. |
| Trasa OpenAI Platform API dla powierzchni niebędących agentami | `openai/*` plus uwierzytelnianie kluczem API | Używana do bezpośrednich API OpenAI, takich jak obrazy, osadzanie, mowa i czas rzeczywisty. |

Te powierzchnie są celowo niezależne. Włączenie Plugin `codex` udostępnia natywne funkcje serwera aplikacji; `openclaw doctor --fix` odpowiada za naprawę starszych tras `openai-codex/*` i czyszczenie nieaktualnych przypięć sesji. Wybranie `openai/*` jako modelu agenta oznacza teraz „uruchom to przez Codex”, chyba że używana jest powierzchnia OpenAI API niebędąca agentem.

Typowa konfiguracja subskrypcji ChatGPT/Codex używa OAuth Codex do uwierzytelniania, ale zachowuje odwołanie do modelu jako `openai/*` i wybiera środowisko uruchomieniowe `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Oznacza to, że OpenClaw wybiera odwołanie do modelu OpenAI, a następnie prosi środowisko uruchomieniowe serwera aplikacji Codex o uruchomienie osadzonej tury agenta. Nie oznacza to „użyj rozliczeń API” i nie oznacza, że kanał, katalog dostawców modeli albo magazyn sesji OpenClaw staje się Codex.

Gdy dołączony Plugin `codex` jest włączony, sterowanie Codex językiem naturalnym powinno używać natywnej powierzchni poleceń `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) zamiast ACP. Używaj ACP dla Codex tylko wtedy, gdy użytkownik wyraźnie prosi o ACP/acpx albo testuje ścieżkę adaptera ACP. Claude Code, Gemini CLI, OpenCode, Cursor i podobne zewnętrzne harnessy nadal używają ACP.

To drzewo decyzyjne skierowane do agenta:

1. Jeśli użytkownik prosi o **wiązanie/sterowanie/wątek/wznawianie/sterowanie/zatrzymanie Codex**, użyj natywnej powierzchni poleceń `/codex`, gdy dołączony Plugin `codex` jest włączony.
2. Jeśli użytkownik prosi o **Codex jako osadzone środowisko uruchomieniowe** albo chce normalnego, opartego na subskrypcji doświadczenia agenta Codex, użyj `openai/<model>`.
3. Jeśli użytkownik wyraźnie wybiera **PI dla modelu OpenAI**, zachowaj odwołanie do modelu jako `openai/<model>` i ustaw `agentRuntime.id: "pi"`. Wybrany profil uwierzytelniania `openai-codex` jest wewnętrznie trasowany przez starszy transport uwierzytelniania Codex w PI.
4. Jeśli starsza konfiguracja nadal zawiera **odwołania do modeli `openai-codex/*`**, napraw ją do `openai/<model>` za pomocą `openclaw doctor --fix`.
5. Jeśli użytkownik wyraźnie mówi **ACP**, **acpx** albo **adapter ACP Codex**, użyj ACP z `runtime: "acp"` i `agentId: "codex"`.
6. Jeśli żądanie dotyczy **Claude Code, Gemini CLI, OpenCode, Cursor, Droid albo innego zewnętrznego harnessa**, użyj ACP/acpx, a nie natywnego środowiska uruchomieniowego subagenta.

| Masz na myśli... | Użyj... |
| --------------------------------------- | -------------------------------------------- |
| Sterowanie czatem/wątkami serwera aplikacji Codex | `/codex ...` z dołączonego Plugin `codex` |
| Osadzone środowisko uruchomieniowe agenta serwera aplikacji Codex | Odwołania do modeli agenta `openai/*` |
| OAuth OpenAI Codex | Profile uwierzytelniania `openai-codex` |
| Claude Code lub inny zewnętrzny harness | ACP/acpx |

Informacje o podziale prefiksów rodziny OpenAI znajdziesz w [OpenAI](/pl/providers/openai) i [Dostawcach modeli](/pl/concepts/model-providers). Kontrakt obsługi środowiska uruchomieniowego Codex opisuje [Harness Codex](/pl/plugins/codex-harness#v1-support-contract).

## Własność środowiska uruchomieniowego

Różne środowiska uruchomieniowe są właścicielami różnych części pętli.

| Powierzchnia | Osadzone PI OpenClaw | Serwer aplikacji Codex |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Właściciel pętli modelu | OpenClaw przez osadzony runner PI | Serwer aplikacji Codex |
| Kanoniczny stan wątku | Transkrypt OpenClaw | Wątek Codex oraz lustrzana kopia transkryptu OpenClaw |
| Narzędzia dynamiczne OpenClaw | Natywna pętla narzędzi OpenClaw | Mostkowane przez adapter Codex |
| Natywne narzędzia powłoki i plików | Ścieżka PI/OpenClaw | Natywne narzędzia Codex, mostkowane przez natywne hooki tam, gdzie są obsługiwane |
| Silnik kontekstu | Natywne składanie kontekstu OpenClaw | OpenClaw składa kontekst projektów do tury Codex |
| Compaction | OpenClaw lub wybrany silnik kontekstu | Natywna Compaction Codex, z powiadomieniami OpenClaw i utrzymaniem lustrzanej kopii |
| Dostarczanie kanałem | OpenClaw | OpenClaw |

Ten podział własności jest główną regułą projektową:

- Jeśli OpenClaw jest właścicielem powierzchni, OpenClaw może zapewniać normalne zachowanie hooków Plugin.
- Jeśli natywne środowisko uruchomieniowe jest właścicielem powierzchni, OpenClaw potrzebuje zdarzeń środowiska uruchomieniowego lub natywnych hooków.
- Jeśli natywne środowisko uruchomieniowe jest właścicielem kanonicznego stanu wątku, OpenClaw powinien tworzyć kopię lustrzaną i rzutować kontekst, a nie przepisywać nieobsługiwane elementy wewnętrzne.

## Wybór środowiska uruchomieniowego

OpenClaw wybiera osadzone środowisko uruchomieniowe po rozwiązaniu dostawcy i modelu:

1. Zapisane środowisko uruchomieniowe sesji ma pierwszeństwo. Zmiany konfiguracji nie przełączają na gorąco istniejącego transkryptu na inny natywny system wątków.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza to środowisko uruchomieniowe dla nowych lub zresetowanych sesji.
3. `agents.defaults.agentRuntime.id` lub `agents.list[].agentRuntime.id` może ustawić `auto`, `pi`, zarejestrowany identyfikator osadzonego harnessa, taki jak `codex`, albo obsługiwany alias backendu CLI, taki jak `claude-cli`.
4. W trybie `auto` zarejestrowane środowiska uruchomieniowe Plugin mogą przejmować obsługiwane pary dostawca/model.
5. Jeśli żadne środowisko uruchomieniowe nie przejmie tury w trybie `auto`, OpenClaw używa PI jako zgodnościowego środowiska uruchomieniowego. Użyj jawnego identyfikatora środowiska uruchomieniowego, gdy przebieg musi być ścisły.

Jawne środowiska uruchomieniowe Plugin zamykają się w razie niepowodzenia. Na przykład `agentRuntime.id: "codex"` oznacza Codex albo jasny błąd wyboru/środowiska uruchomieniowego; nigdy nie jest po cichu trasowane z powrotem do PI.

Aliasy backendów CLI różnią się od identyfikatorów osadzonych harnessów. Preferowana postać Claude CLI to:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Starsze odwołania, takie jak `claude-cli/claude-opus-4-7`, pozostają obsługiwane ze względu na zgodność, ale nowa konfiguracja powinna zachowywać kanoniczną postać dostawca/model i umieszczać backend wykonawczy w `agentRuntime.id`.

Tryb `auto` jest celowo konserwatywny dla większości dostawców. Modele agentów OpenAI są wyjątkiem: brak ustawionego środowiska uruchomieniowego i `auto` rozwiązują się do harnessa Codex. Jawna konfiguracja środowiska uruchomieniowego PI pozostaje opcjonalną ścieżką zgodności dla tur agentów `openai/*`; w połączeniu z wybranym profilem uwierzytelniania `openai-codex` OpenClaw trasuje PI wewnętrznie przez starszy transport uwierzytelniania Codex, zachowując publiczne odwołanie do modelu jako `openai/*`. Nieaktualne przypięcia sesji OpenAI PI bez jawnej konfiguracji są naprawiane z powrotem do Codex.

Jeśli `openclaw doctor` ostrzega, że Plugin `codex` jest włączony, podczas gdy `openai-codex/*` pozostaje w konfiguracji, traktuj to jako starszy stan trasy. Uruchom `openclaw doctor --fix`, aby przepisać go na `openai/*` ze środowiskiem uruchomieniowym Codex.

## Kontrakt zgodności

Gdy środowisko uruchomieniowe nie jest PI, powinno dokumentować, które powierzchnie OpenClaw obsługuje. Użyj tej struktury w dokumentacji środowiska uruchomieniowego:

| Pytanie | Dlaczego to ważne |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Kto jest właścicielem pętli modelu? | Określa, gdzie odbywają się ponowienia, kontynuacja narzędzi i decyzje o odpowiedzi końcowej. |
| Kto jest właścicielem kanonicznej historii wątku? | Określa, czy OpenClaw może edytować historię, czy tylko ją odzwierciedlać. |
| Czy narzędzia dynamiczne OpenClaw działają? | Wiadomości, sesje, Cron i narzędzia należące do OpenClaw na tym polegają. |
| Czy hooki narzędzi dynamicznych działają? | Pluginy oczekują `before_tool_call`, `after_tool_call` i middleware wokół narzędzi należących do OpenClaw. |
| Czy natywne hooki narzędzi działają? | Powłoka, patche i narzędzia należące do środowiska uruchomieniowego potrzebują natywnej obsługi hooków do zasad i obserwacji. |
| Czy cykl życia silnika kontekstu działa? | Pluginy pamięci i kontekstu zależą od cyklu życia składania, pobierania, działań po turze i Compaction. |
| Jakie dane Compaction są ujawniane? | Niektóre Pluginy potrzebują tylko powiadomień, podczas gdy inne potrzebują metadanych zachowanych/odrzuconych elementów. |
| Co jest celowo nieobsługiwane? | Użytkownicy nie powinni zakładać równoważności z PI tam, gdzie natywne środowisko uruchomieniowe jest właścicielem większej części stanu. |

Kontrakt wsparcia środowiska wykonawczego Codex jest udokumentowany w
[harnessie Codex](/pl/plugins/codex-harness#v1-support-contract).

## Etykiety statusu

Dane statusu mogą pokazywać zarówno etykiety `Execution`, jak i `Runtime`. Traktuj je jako
diagnostykę, a nie nazwy dostawców.

- Odwołanie do modelu, takie jak `openai/gpt-5.5`, wskazuje wybranego dostawcę/model.
- Identyfikator środowiska wykonawczego, taki jak `codex`, wskazuje, która pętla wykonuje turę.
- Etykieta kanału, taka jak Telegram lub Discord, wskazuje, gdzie odbywa się rozmowa.

Jeśli sesja nadal pokazuje PI po zmianie konfiguracji środowiska wykonawczego, rozpocznij nową sesję
za pomocą `/new` albo wyczyść bieżącą za pomocą `/reset`. Istniejące sesje zachowują swoje
zarejestrowane środowisko wykonawcze, aby transkrypcja nie została odtworzona przez dwa niezgodne natywne
systemy sesji.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [OpenAI](/pl/providers/openai)
- [Pluginy harnessa agentów](/pl/plugins/sdk-agent-harness)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Modele](/pl/concepts/models)
- [Status](/pl/cli/status)
