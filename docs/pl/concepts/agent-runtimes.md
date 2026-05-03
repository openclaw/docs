---
read_when:
    - Wybierasz między PI, Codex, ACP lub innym natywnym środowiskiem uruchomieniowym agenta
    - Mylą Cię etykiety dostawcy/modelu/środowiska uruchomieniowego w statusie lub konfiguracji
    - Dokumentujesz parytet obsługi dla natywnego środowiska testowego
summary: Jak OpenClaw oddziela dostawców modeli, modele, kanały i środowiska uruchomieniowe agentów
title: Środowiska uruchomieniowe agentów
x-i18n:
    generated_at: "2026-05-03T09:44:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**Środowisko uruchomieniowe agenta** to komponent, który posiada jedną przygotowaną pętlę modelu: odbiera prompt, steruje wyjściem modelu, obsługuje natywne wywołania narzędzi i zwraca ukończoną turę do OpenClaw.

Środowiska uruchomieniowe łatwo pomylić z dostawcami, ponieważ oba pojawiają się blisko konfiguracji modelu. To różne warstwy:

| Warstwa | Przykłady | Co to oznacza |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Dostawca | `openai`, `anthropic`, `openai-codex` | Jak OpenClaw uwierzytelnia, wykrywa modele i nazywa odwołania do modeli. |
| Model | `gpt-5.5`, `claude-opus-4-6` | Model wybrany dla tury agenta. |
| Środowisko uruchomieniowe agenta | `pi`, `codex`, `claude-cli` | Niskopoziomowa pętla lub backend, który wykonuje przygotowaną turę. |
| Kanał | Telegram, Discord, Slack, WhatsApp | Miejsce, w którym wiadomości wchodzą do OpenClaw i z niego wychodzą. |

W kodzie zobaczysz też słowo **harness**. Harness to implementacja, która udostępnia środowisko uruchomieniowe agenta. Na przykład dołączony harness Codex implementuje środowisko uruchomieniowe `codex`. Publiczna konfiguracja używa `agentRuntime.id`; `openclaw doctor --fix` przepisuje starsze klucze polityki środowiska uruchomieniowego do tej postaci.

Istnieją dwie rodziny środowisk uruchomieniowych:

- **Osadzone harnessy** działają wewnątrz przygotowanej pętli agenta OpenClaw. Obecnie jest to wbudowane środowisko uruchomieniowe `pi` oraz zarejestrowane harnessy pluginów, takie jak `codex`.
- **Backendy CLI** uruchamiają lokalny proces CLI, zachowując kanoniczne odwołanie do modelu. Na przykład `anthropic/claude-opus-4-7` z `agentRuntime.id: "claude-cli"` oznacza „wybierz model Anthropic, wykonaj przez Claude CLI”. `claude-cli` nie jest identyfikatorem osadzonego harnessu i nie wolno go przekazywać do wyboru AgentHarness.

## Powierzchnie Codex

Większość niejasności wynika z tego, że kilka różnych powierzchni współdzieli nazwę Codex:

| Powierzchnia | Nazwa/konfiguracja OpenClaw | Co robi |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Natywne środowisko uruchomieniowe serwera aplikacji Codex | `openai/*` plus `agentRuntime.id: "codex"` | Uruchamia osadzoną turę agenta przez serwer aplikacji Codex. To zwykła konfiguracja subskrypcji ChatGPT/Codex. |
| Trasa dostawcy OAuth Codex | Odwołania do modeli `openai-codex/*` | Używa OAuth subskrypcji ChatGPT/Codex przez normalny runner OpenClaw PI. |
| Adapter ACP Codex | `runtime: "acp"`, `agentId: "codex"` | Uruchamia Codex przez zewnętrzną płaszczyznę sterowania ACP/acpx. Używaj tylko wtedy, gdy wyraźnie poproszono o ACP/acpx. |
| Natywny zestaw poleceń sterowania czatem Codex | `/codex ...` | Wiąże, wznawia, steruje, zatrzymuje i sprawdza wątki serwera aplikacji Codex z czatu. |
| Trasa OpenAI Platform API dla modeli w stylu GPT/Codex | Odwołania do modeli `openai/*` | Używa uwierzytelniania kluczem API OpenAI, chyba że nadpisanie środowiska uruchomieniowego, takie jak `agentRuntime.id: "codex"`, uruchamia turę. |

Te powierzchnie są celowo niezależne. Włączenie pluginu `codex` udostępnia natywne funkcje serwera aplikacji; nie przepisuje `openai-codex/*` na `openai/*`, nie zmienia istniejących sesji i nie czyni ACP domyślnym Codex. Wybranie `openai-codex/*` oznacza „użyj trasy dostawcy OAuth Codex”, chyba że osobno wymusisz środowisko uruchomieniowe.

Typowa konfiguracja subskrypcji ChatGPT/Codex używa OAuth Codex do uwierzytelniania, ale zachowuje odwołanie do modelu jako `openai/*` i wybiera środowisko uruchomieniowe `codex`:

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

Oznacza to, że OpenClaw wybiera odwołanie do modelu OpenAI, a następnie prosi środowisko uruchomieniowe serwera aplikacji Codex o uruchomienie osadzonej tury agenta. Nie oznacza to „użyj rozliczeń API” i nie oznacza, że kanał, katalog dostawcy modeli albo magazyn sesji OpenClaw staje się Codex.

Gdy dołączony plugin `codex` jest włączony, sterowanie Codex w języku naturalnym powinno używać natywnej powierzchni poleceń `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) zamiast ACP. Używaj ACP dla Codex tylko wtedy, gdy użytkownik wyraźnie prosi o ACP/acpx albo testuje ścieżkę adaptera ACP. Claude Code, Gemini CLI, OpenCode, Cursor i podobne zewnętrzne harnessy nadal używają ACP.

To jest drzewo decyzyjne dla agentów:

1. Jeśli użytkownik prosi o **wiązanie/sterowanie/wątek/wznowienie/sterowanie kierunkiem/zatrzymanie Codex**, użyj natywnej powierzchni poleceń `/codex`, gdy dołączony plugin `codex` jest włączony.
2. Jeśli użytkownik prosi o **Codex jako osadzone środowisko uruchomieniowe** albo chce normalnego doświadczenia agenta Codex opartego na subskrypcji, użyj `openai/<model>` z `agentRuntime.id: "codex"`.
3. Jeśli użytkownik prosi o **uwierzytelnianie OAuth/subskrypcji Codex na normalnym runnerze OpenClaw**, użyj `openai-codex/<model>` i pozostaw środowisko uruchomieniowe jako PI.
4. Jeśli użytkownik wyraźnie mówi **ACP**, **acpx** albo **adapter ACP Codex**, użyj ACP z `runtime: "acp"` i `agentId: "codex"`.
5. Jeśli żądanie dotyczy **Claude Code, Gemini CLI, OpenCode, Cursor, Droid albo innego zewnętrznego harnessu**, użyj ACP/acpx, a nie natywnego środowiska uruchomieniowego subagenta.

| Masz na myśli... | Użyj... |
| --------------------------------------- | -------------------------------------------- |
| Sterowanie czatem/wątkami serwera aplikacji Codex | `/codex ...` z dołączonego pluginu `codex` |
| Osadzone środowisko uruchomieniowe agenta serwera aplikacji Codex | `agentRuntime.id: "codex"` |
| OAuth OpenAI Codex na runnerze PI | Odwołania do modeli `openai-codex/*` |
| Claude Code lub inny zewnętrzny harness | ACP/acpx |

Podział prefiksów rodziny OpenAI opisują [OpenAI](/pl/providers/openai) i [Dostawcy modeli](/pl/concepts/model-providers). Kontrakt wsparcia środowiska uruchomieniowego Codex opisuje [Harness Codex](/pl/plugins/codex-harness#v1-support-contract).

## Własność środowiska uruchomieniowego

Różne środowiska uruchomieniowe posiadają różne części pętli.

| Powierzchnia | Osadzony PI OpenClaw | Serwer aplikacji Codex |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Właściciel pętli modelu | OpenClaw przez osadzonego runnera PI | Serwer aplikacji Codex |
| Kanoniczny stan wątku | Transkrypt OpenClaw | Wątek Codex oraz lustrzana kopia transkryptu OpenClaw |
| Dynamiczne narzędzia OpenClaw | Natywna pętla narzędzi OpenClaw | Mostkowane przez adapter Codex |
| Natywne narzędzia powłoki i plików | Ścieżka PI/OpenClaw | Natywne narzędzia Codex, mostkowane przez natywne hooki tam, gdzie są obsługiwane |
| Silnik kontekstu | Natywne składanie kontekstu OpenClaw | OpenClaw składa kontekst projektów do tury Codex |
| Compaction | OpenClaw lub wybrany silnik kontekstu | Natywna kompakcja Codex, z powiadomieniami OpenClaw i utrzymaniem kopii lustrzanej |
| Dostarczanie kanału | OpenClaw | OpenClaw |

Ten podział własności jest główną zasadą projektową:

- Jeśli OpenClaw posiada powierzchnię, OpenClaw może zapewnić normalne zachowanie hooków pluginów.
- Jeśli natywne środowisko uruchomieniowe posiada powierzchnię, OpenClaw potrzebuje zdarzeń środowiska uruchomieniowego lub natywnych hooków.
- Jeśli natywne środowisko uruchomieniowe posiada kanoniczny stan wątku, OpenClaw powinien tworzyć kopię lustrzaną i projektować kontekst, a nie przepisywać nieobsługiwane elementy wewnętrzne.

## Wybór środowiska uruchomieniowego

OpenClaw wybiera osadzone środowisko uruchomieniowe po rozwiązaniu dostawcy i modelu:

1. Wygrywa środowisko uruchomieniowe zapisane w sesji. Zmiany konfiguracji nie przełączają na gorąco istniejącego transkryptu na inny natywny system wątków.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza to środowisko uruchomieniowe dla nowych lub zresetowanych sesji.
3. `agents.defaults.agentRuntime.id` albo `agents.list[].agentRuntime.id` może ustawić `auto`, `pi`, zarejestrowany identyfikator osadzonego harnessu, taki jak `codex`, albo obsługiwany alias backendu CLI, taki jak `claude-cli`.
4. W trybie `auto` zarejestrowane środowiska uruchomieniowe pluginów mogą zgłaszać obsługiwane pary dostawca/model.
5. Jeśli żadne środowisko uruchomieniowe nie zgłosi tury w trybie `auto`, OpenClaw używa PI jako środowiska uruchomieniowego zgodności. Użyj jawnego identyfikatora środowiska uruchomieniowego, gdy uruchomienie musi być rygorystyczne.

Jawne środowiska uruchomieniowe pluginów zamykają się z błędem. Na przykład `agentRuntime.id: "codex"` oznacza Codex albo jasny błąd wyboru/środowiska uruchomieniowego; nigdy nie jest po cichu kierowane z powrotem do PI.

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

Starsze odwołania, takie jak `claude-cli/claude-opus-4-7`, pozostają obsługiwane ze względu na zgodność, ale nowa konfiguracja powinna zachowywać dostawcę/model w postaci kanonicznej i umieszczać backend wykonawczy w `agentRuntime.id`.

Tryb `auto` jest celowo konserwatywny. Środowiska uruchomieniowe pluginów mogą zgłaszać pary dostawca/model, które rozumieją, ale plugin Codex nie zgłasza dostawcy `openai-codex` w trybie `auto`. Zachowuje to `openai-codex/*` jako jawną trasę OAuth Codex PI i unika cichego przenoszenia konfiguracji uwierzytelniania subskrypcji na natywny harness serwera aplikacji.

Jeśli `openclaw doctor` ostrzega, że plugin `codex` jest włączony, podczas gdy `openai-codex/*` nadal kieruje przez PI, traktuj to jako diagnozę, a nie migrację. Zachowaj konfigurację bez zmian, gdy PI Codex OAuth jest tym, czego chcesz. Przełącz na `openai/<model>` plus `agentRuntime.id: "codex"` tylko wtedy, gdy chcesz natywnego wykonania przez serwer aplikacji Codex.

## Kontrakt zgodności

Gdy środowisko uruchomieniowe nie jest PI, powinno dokumentować, które powierzchnie OpenClaw obsługuje. Użyj tej postaci w dokumentacji środowisk uruchomieniowych:

| Pytanie | Dlaczego to ważne |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Kto posiada pętlę modelu? | Określa, gdzie zapadają decyzje o ponowieniach, kontynuacji narzędzi i odpowiedzi końcowej. |
| Kto posiada kanoniczną historię wątku? | Określa, czy OpenClaw może edytować historię, czy tylko tworzyć jej kopię lustrzaną. |
| Czy dynamiczne narzędzia OpenClaw działają? | Wiadomości, sesje, cron i narzędzia należące do OpenClaw polegają na tym. |
| Czy hooki dynamicznych narzędzi działają? | Pluginy oczekują `before_tool_call`, `after_tool_call` i middleware wokół narzędzi należących do OpenClaw. |
| Czy hooki natywnych narzędzi działają? | Powłoka, poprawki i narzędzia należące do środowiska uruchomieniowego potrzebują natywnej obsługi hooków na potrzeby polityki i obserwacji. |
| Czy cykl życia silnika kontekstu działa? | Pluginy pamięci i kontekstu zależą od cyklu życia składania, ingestii, działań po turze i kompakcji. |
| Jakie dane kompakcji są ujawniane? | Niektóre pluginy potrzebują tylko powiadomień, podczas gdy inne potrzebują metadanych zachowanych/odrzuconych. |
| Co jest celowo nieobsługiwane? | Użytkownicy nie powinni zakładać równoważności z PI tam, gdzie natywne środowisko uruchomieniowe posiada więcej stanu. |

Kontrakt wsparcia środowiska uruchomieniowego Codex jest udokumentowany w [Harness Codex](/pl/plugins/codex-harness#v1-support-contract).

## Etykiety statusu

Dane wyjściowe statusu mogą pokazywać zarówno etykiety `Execution`, jak i `Runtime`. Traktuj je jako
diagnostykę, a nie nazwy dostawców.

- Odwołanie do modelu, takie jak `openai/gpt-5.5`, informuje o wybranym dostawcy/modelu.
- Identyfikator Runtime, taki jak `codex`, wskazuje, która pętla wykonuje turę.
- Etykieta kanału, taka jak Telegram lub Discord, wskazuje, gdzie odbywa się rozmowa.

Jeśli sesja nadal pokazuje PI po zmianie konfiguracji Runtime, rozpocznij nową sesję
za pomocą `/new` albo wyczyść bieżącą za pomocą `/reset`. Istniejące sesje zachowują swój
zapisany Runtime, aby transkrypcja nie była odtwarzana przez dwa niezgodne natywne
systemy sesji.

## Powiązane

- [Uprząż Codex](/pl/plugins/codex-harness)
- [OpenAI](/pl/providers/openai)
- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Modele](/pl/concepts/models)
- [Status](/pl/cli/status)
