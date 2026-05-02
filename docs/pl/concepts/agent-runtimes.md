---
read_when:
    - Wybierasz między PI, Codex, ACP albo innym natywnym środowiskiem uruchomieniowym agenta
    - Mylą Cię etykiety dostawcy/modelu/środowiska wykonawczego w statusie lub konfiguracji
    - Dokumentujesz parytet obsługi dla natywnego środowiska testowego
summary: Jak OpenClaw rozdziela dostawców modeli, modele, kanały i środowiska uruchomieniowe agentów
title: Środowiska uruchomieniowe agentów
x-i18n:
    generated_at: "2026-05-02T09:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**Środowisko uruchomieniowe agenta** to komponent, który posiada jedną przygotowaną pętlę modelu: odbiera prompt, steruje wyjściem modelu, obsługuje natywne wywołania narzędzi i zwraca ukończoną turę do OpenClaw.

Środowiska uruchomieniowe łatwo pomylić z dostawcami, ponieważ oba pojawiają się w pobliżu konfiguracji modelu. To różne warstwy:

| Warstwa                 | Przykłady                              | Co oznacza                                                                |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| Dostawca                | `openai`, `anthropic`, `openai-codex` | Jak OpenClaw uwierzytelnia, wykrywa modele i nazywa referencje modeli.    |
| Model                   | `gpt-5.5`, `claude-opus-4-6`          | Model wybrany dla tury agenta.                                            |
| Środowisko agenta       | `pi`, `codex`, `claude-cli`           | Niskopoziomowa pętla lub backend, który wykonuje przygotowaną turę.       |
| Kanał                   | Telegram, Discord, Slack, WhatsApp    | Miejsce, w którym wiadomości wchodzą do OpenClaw i z niego wychodzą.      |

W kodzie zobaczysz też słowo **harness**. Harness to implementacja, która udostępnia środowisko uruchomieniowe agenta. Na przykład dołączony harness Codex implementuje środowisko `codex`. Konfiguracja publiczna używa `agentRuntime.id`; `openclaw doctor --fix` przepisuje starsze klucze zasad środowiska uruchomieniowego do tej postaci.

Istnieją dwie rodziny środowisk uruchomieniowych:

- **Osadzone harnessy** działają wewnątrz przygotowanej pętli agenta OpenClaw. Obecnie jest to wbudowane środowisko `pi` oraz zarejestrowane harnessy Plugin, takie jak `codex`.
- **Backendy CLI** uruchamiają lokalny proces CLI, zachowując kanoniczną referencję modelu. Na przykład `anthropic/claude-opus-4-7` z `agentRuntime.id: "claude-cli"` oznacza „wybierz model Anthropic, wykonaj przez Claude CLI”. `claude-cli` nie jest identyfikatorem osadzonego harnessa i nie może być przekazywane do wyboru AgentHarness.

## Powierzchnie Codex

Najwięcej nieporozumień wynika z kilku różnych powierzchni współdzielących nazwę Codex:

| Powierzchnia                                                | Nazwa/konfiguracja OpenClaw                 | Co robi                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Natywne środowisko app-server Codex                         | `openai/*` plus `agentRuntime.id: "codex"`  | Uruchamia osadzoną turę agenta przez app-server Codex. To typowa konfiguracja subskrypcji ChatGPT/Codex.            |
| Trasa dostawcy OAuth Codex                                  | Referencje modeli `openai-codex/*`          | Używa OAuth subskrypcji ChatGPT/Codex przez normalny runner PI OpenClaw.                                            |
| Adapter ACP Codex                                           | `runtime: "acp"`, `agentId: "codex"`        | Uruchamia Codex przez zewnętrzną płaszczyznę sterowania ACP/acpx. Używaj tylko wtedy, gdy jawnie poproszono o ACP/acpx. |
| Natywny zestaw poleceń sterowania czatem Codex              | `/codex ...`                                | Wiąże, wznawia, steruje, zatrzymuje i sprawdza wątki app-server Codex z czatu.                                      |
| Trasa API OpenAI Platform dla modeli w stylu GPT/Codex      | Referencje modeli `openai/*`                | Używa uwierzytelniania kluczem API OpenAI, chyba że nadpisanie środowiska, takie jak `agentRuntime.id: "codex"`, uruchamia turę. |

Te powierzchnie są celowo niezależne. Włączenie Plugin `codex` udostępnia natywne funkcje app-server; nie przepisuje `openai-codex/*` na `openai/*`, nie zmienia istniejących sesji i nie czyni ACP domyślnym sposobem działania Codex. Wybranie `openai-codex/*` oznacza „użyj trasy dostawcy OAuth Codex”, chyba że osobno wymusisz środowisko uruchomieniowe.

Typowa konfiguracja subskrypcji ChatGPT/Codex używa OAuth Codex do uwierzytelniania, ale zachowuje referencję modelu jako `openai/*` i wybiera środowisko `codex`:

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

Oznacza to, że OpenClaw wybiera referencję modelu OpenAI, a następnie prosi środowisko app-server Codex o uruchomienie osadzonej tury agenta. Nie oznacza to „użyj rozliczeń API” i nie oznacza, że kanał, katalog dostawcy modeli lub magazyn sesji OpenClaw staje się Codex.

Gdy dołączony Plugin `codex` jest włączony, sterowanie Codex w języku naturalnym powinno używać natywnej powierzchni poleceń `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) zamiast ACP. Używaj ACP dla Codex tylko wtedy, gdy użytkownik wyraźnie prosi o ACP/acpx lub testuje ścieżkę adaptera ACP. Claude Code, Gemini CLI, OpenCode, Cursor i podobne zewnętrzne harnessy nadal używają ACP.

To jest drzewo decyzyjne dla agenta:

1. Jeśli użytkownik prosi o **wiązanie/sterowanie/wątek/wznowienie/sterowanie/zatrzymanie Codex**, użyj natywnej powierzchni poleceń `/codex`, gdy dołączony Plugin `codex` jest włączony.
2. Jeśli użytkownik prosi o **Codex jako osadzone środowisko uruchomieniowe** lub chce normalnego doświadczenia agenta Codex wspieranego subskrypcją, użyj `openai/<model>` z `agentRuntime.id: "codex"`.
3. Jeśli użytkownik prosi o **OAuth/subskrypcyjne uwierzytelnianie Codex na normalnym runnerze OpenClaw**, użyj `openai-codex/<model>` i pozostaw środowisko jako PI.
4. Jeśli użytkownik wyraźnie mówi **ACP**, **acpx** lub **adapter ACP Codex**, użyj ACP z `runtime: "acp"` i `agentId: "codex"`.
5. Jeśli prośba dotyczy **Claude Code, Gemini CLI, OpenCode, Cursor, Droid lub innego zewnętrznego harnessa**, użyj ACP/acpx, a nie natywnego środowiska subagenta.

| Masz na myśli...                           | Użyj...                                     |
| ------------------------------------------ | ------------------------------------------ |
| Sterowanie czatem/wątkiem app-server Codex | `/codex ...` z dołączonego Plugin `codex`  |
| Osadzone środowisko agenta app-server Codex | `agentRuntime.id: "codex"`                 |
| OAuth OpenAI Codex na runnerze PI          | Referencje modeli `openai-codex/*`         |
| Claude Code lub inny zewnętrzny harness    | ACP/acpx                                   |

Informacje o podziale prefiksów rodziny OpenAI znajdziesz w [OpenAI](/pl/providers/openai) i [Dostawcach modeli](/pl/concepts/model-providers). Informacje o kontrakcie obsługi środowiska Codex znajdziesz w [harnessie Codex](/pl/plugins/codex-harness#v1-support-contract).

## Własność środowiska uruchomieniowego

Różne środowiska uruchomieniowe posiadają różne części pętli.

| Powierzchnia                         | Osadzony PI OpenClaw                    | App-server Codex                                                             |
| ------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------- |
| Właściciel pętli modelu              | OpenClaw przez osadzony runner PI       | App-server Codex                                                             |
| Kanoniczny stan wątku                | Transkrypt OpenClaw                     | Wątek Codex oraz lustrzana kopia transkryptu OpenClaw                        |
| Dynamiczne narzędzia OpenClaw        | Natywna pętla narzędzi OpenClaw         | Mostkowane przez adapter Codex                                               |
| Natywne narzędzia powłoki i plików   | Ścieżka PI/OpenClaw                     | Narzędzia natywne Codex, mostkowane przez natywne hooki tam, gdzie są obsługiwane |
| Silnik kontekstu                     | Natywne składanie kontekstu OpenClaw    | OpenClaw projektuje złożony kontekst do tury Codex                           |
| Compaction                           | OpenClaw lub wybrany silnik kontekstu   | Natywne Compaction Codex, z powiadomieniami OpenClaw i utrzymaniem kopii lustrzanej |
| Dostarczanie kanałem                 | OpenClaw                                | OpenClaw                                                                     |

Ten podział własności jest główną regułą projektową:

- Jeśli OpenClaw posiada powierzchnię, OpenClaw może zapewnić normalne zachowanie hooków Plugin.
- Jeśli natywne środowisko uruchomieniowe posiada powierzchnię, OpenClaw potrzebuje zdarzeń środowiska lub natywnych hooków.
- Jeśli natywne środowisko uruchomieniowe posiada kanoniczny stan wątku, OpenClaw powinien tworzyć kopię lustrzaną i projektować kontekst, a nie przepisywać nieobsługiwane elementy wewnętrzne.

## Wybór środowiska uruchomieniowego

OpenClaw wybiera osadzone środowisko uruchomieniowe po rozstrzygnięciu dostawcy i modelu:

1. Zapisane środowisko sesji ma pierwszeństwo. Zmiany konfiguracji nie przełączają na gorąco istniejącego transkryptu na inny natywny system wątków.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza to środowisko dla nowych lub zresetowanych sesji.
3. `agents.defaults.agentRuntime.id` lub `agents.list[].agentRuntime.id` może ustawić `auto`, `pi`, zarejestrowany identyfikator osadzonego harnessa, taki jak `codex`, albo obsługiwany alias backendu CLI, taki jak `claude-cli`.
4. W trybie `auto` zarejestrowane środowiska Plugin mogą zgłaszać obsługiwane pary dostawca/model.
5. Jeśli żadne środowisko nie zgłosi tury w trybie `auto`, a ustawiono `fallback: "pi"` (domyślnie), OpenClaw używa PI jako zgodnościowego fallbacku. Ustaw `fallback: "none"`, aby zamiast tego niepasujący wybór w trybie `auto` kończył się błędem.

Jawne środowiska Plugin domyślnie zamykają się błędem. Na przykład `agentRuntime.id: "codex"` oznacza Codex albo jasny błąd wyboru, chyba że ustawisz `fallback: "pi"` w tym samym zakresie nadpisania. Nadpisanie środowiska uruchomieniowego nie dziedziczy szerszego ustawienia fallbacku, więc `agentRuntime.id: "codex"` na poziomie agenta nie jest po cichu kierowane z powrotem do PI tylko dlatego, że wartości domyślne używały `fallback: "pi"`.

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

Starsze referencje, takie jak `claude-cli/claude-opus-4-7`, pozostają obsługiwane ze względu na zgodność, ale nowa konfiguracja powinna zachowywać kanoniczną parę dostawca/model i umieszczać backend wykonawczy w `agentRuntime.id`.

Tryb `auto` jest celowo konserwatywny. Środowiska Plugin mogą zgłaszać pary dostawca/model, które rozumieją, ale Plugin Codex nie zgłasza dostawcy `openai-codex` w trybie `auto`. Dzięki temu `openai-codex/*` pozostaje jawną trasą OAuth PI Codex i unika cichego przenoszenia konfiguracji uwierzytelniania subskrypcyjnego na natywny harness app-server.

Jeśli `openclaw doctor` ostrzega, że Plugin `codex` jest włączony, podczas gdy `openai-codex/*` nadal przechodzi przez PI, traktuj to jako diagnozę, a nie migrację. Pozostaw konfigurację bez zmian, gdy PI Codex OAuth jest tym, czego chcesz. Przełącz na `openai/<model>` plus `agentRuntime.id: "codex"` tylko wtedy, gdy chcesz natywnego wykonywania app-server Codex.

## Kontrakt zgodności

Gdy środowiskiem uruchomieniowym nie jest PI, powinno ono dokumentować, które powierzchnie OpenClaw obsługuje. Użyj tego kształtu dla dokumentacji środowiska uruchomieniowego:

| Pytanie                                | Dlaczego to ważne                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Kto odpowiada za pętlę modelu?         | Określa, gdzie odbywają się ponowienia, kontynuacja narzędzi i decyzje o końcowej odpowiedzi.     |
| Kto odpowiada za kanoniczną historię wątku? | Określa, czy OpenClaw może edytować historię, czy tylko ją odzwierciedlać.                    |
| Czy narzędzia dynamiczne OpenClaw działają? | Od tego zależą wiadomości, sesje, cron oraz narzędzia zarządzane przez OpenClaw.              |
| Czy hooki narzędzi dynamicznych działają? | Pluginy oczekują `before_tool_call`, `after_tool_call` oraz middleware wokół narzędzi zarządzanych przez OpenClaw. |
| Czy hooki narzędzi natywnych działają? | Shell, patch i narzędzia zarządzane przez runtime wymagają natywnego wsparcia hooków na potrzeby zasad i obserwacji. |
| Czy działa cykl życia silnika kontekstu? | Pluginy pamięci i kontekstu zależą od cyklu życia assemble, ingest, after-turn oraz compaction. |
| Jakie dane compaction są udostępniane? | Niektóre pluginy potrzebują tylko powiadomień, a inne metadanych zachowanych i odrzuconych elementów. |
| Co jest celowo nieobsługiwane?         | Użytkownicy nie powinni zakładać równoważności z PI tam, gdzie natywny runtime posiada więcej stanu. |

Kontrakt wsparcia runtime Codex jest udokumentowany w
[Codex harness](/pl/plugins/codex-harness#v1-support-contract).

## Etykiety statusu

Dane statusu mogą pokazywać zarówno etykiety `Execution`, jak i `Runtime`. Traktuj je jako
diagnostykę, a nie jako nazwy dostawców.

- Odwołanie do modelu, takie jak `openai/gpt-5.5`, wskazuje wybranego dostawcę/model.
- Identyfikator runtime, taki jak `codex`, wskazuje, która pętla wykonuje turę.
- Etykieta kanału, taka jak Telegram lub Discord, wskazuje, gdzie odbywa się rozmowa.

Jeśli sesja nadal pokazuje PI po zmianie konfiguracji runtime, rozpocznij nową sesję
za pomocą `/new` albo wyczyść bieżącą przez `/reset`. Istniejące sesje zachowują
zapisany runtime, aby transkrypt nie został odtworzony przez dwa niezgodne natywne
systemy sesji.

## Powiązane

- [Codex harness](/pl/plugins/codex-harness)
- [OpenAI](/pl/providers/openai)
- [Pluginy uprzęży agentów](/pl/plugins/sdk-agent-harness)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Modele](/pl/concepts/models)
- [Status](/pl/cli/status)
