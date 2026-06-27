---
read_when:
    - Zmiana środowiska wykonawczego agenta, inicjalizacji workspace’u lub zachowania sesji
summary: Środowisko uruchomieniowe agenta, kontrakt obszaru roboczego i inicjalizacja sesji
title: Środowisko uruchomieniowe agenta
x-i18n:
    generated_at: "2026-06-27T17:25:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw uruchamia **jeden osadzony runtime agenta** - jeden proces agenta na
Gateway, z własną przestrzenią roboczą, plikami rozruchowymi i magazynem sesji. Ta strona
opisuje ten kontrakt runtime: co musi zawierać przestrzeń robocza, które pliki są
wstrzykiwane i jak sesje uruchamiają się względem niej.

## Przestrzeń robocza (wymagana)

OpenClaw używa jednego katalogu przestrzeni roboczej agenta (`agents.defaults.workspace`) jako **jedynego** katalogu roboczego (`cwd`) agenta dla narzędzi i kontekstu.

Zalecane: użyj `openclaw setup`, aby utworzyć `~/.openclaw/openclaw.json`, jeśli go brakuje, i zainicjować pliki przestrzeni roboczej.

Pełny układ przestrzeni roboczej + przewodnik po kopiach zapasowych: [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)

Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą nadpisać to ustawienie
przestrzeniami roboczymi dla poszczególnych sesji pod `agents.defaults.sandbox.workspaceRoot` (zobacz
[Konfiguracja Gateway](/pl/gateway/configuration)).

## Pliki rozruchowe (wstrzykiwane)

Wewnątrz `agents.defaults.workspace` OpenClaw oczekuje tych plików edytowalnych przez użytkownika:

- `AGENTS.md` - instrukcje operacyjne + „pamięć”
- `SOUL.md` - persona, granice, ton
- `TOOLS.md` - utrzymywane przez użytkownika notatki o narzędziach (np. `imsg`, `sag`, konwencje)
- `BOOTSTRAP.md` - jednorazowy rytuał pierwszego uruchomienia (usuwany po ukończeniu)
- `IDENTITY.md` - nazwa/klimat/emoji agenta
- `USER.md` - profil użytkownika + preferowana forma zwracania się

W pierwszej turze nowej sesji OpenClaw wstrzykuje zawartość tych plików do Project Context promptu systemowego.

Puste pliki są pomijane. Duże pliki są przycinane i skracane ze znacznikiem, aby prompty pozostały zwięzłe (przeczytaj plik, aby zobaczyć pełną treść).

Jeśli brakuje pliku, OpenClaw wstrzykuje pojedynczą linię znacznika „brakującego pliku” (a `openclaw setup` utworzy bezpieczny domyślny szablon).

`BOOTSTRAP.md` jest tworzony tylko dla **zupełnie nowej przestrzeni roboczej** (bez żadnych innych plików rozruchowych). Dopóki oczekuje, OpenClaw utrzymuje go w Project Context i dodaje wskazówki rozruchowe promptu systemowego dla początkowego rytuału zamiast kopiować go do wiadomości użytkownika. Jeśli usuniesz go po ukończeniu rytuału, nie powinien zostać odtworzony przy późniejszych restartach.

Po zaobserwowaniu przestrzeni roboczej OpenClaw utrzymuje również znacznik atestacji katalogu stanu dla ścieżki przestrzeni roboczej. Jeśli niedawno atestowana przestrzeń robocza zniknie lub zostanie wyczyszczona, uruchamianie odmówi cichego ponownego zasiania `BOOTSTRAP.md`; przywróć przestrzeń roboczą albo użyj pełnego resetu onboardingu, aby przestrzeń robocza i znacznik zostały wyczyszczone razem.

Aby całkowicie wyłączyć tworzenie plików rozruchowych (dla wstępnie zasianych przestrzeni roboczych), ustaw:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Wbudowane narzędzia

Narzędzia rdzeniowe (read/exec/edit/write i powiązane narzędzia systemowe) są zawsze dostępne,
z zastrzeżeniem polityki narzędzi. `apply_patch` jest opcjonalne i bramkowane przez
`tools.exec.applyPatch`. `TOOLS.md` **nie** kontroluje, które narzędzia istnieją; to
wskazówki dotyczące tego, jak _ty_ chcesz, aby były używane.

## Skills

OpenClaw ładuje Skills z tych lokalizacji (najwyższy priorytet jako pierwszy):

- Przestrzeń robocza: `<workspace>/skills`
- Skills agenta projektu: `<workspace>/.agents/skills`
- Osobiste Skills agenta: `~/.agents/skills`
- Zarządzane/lokalne: `~/.openclaw/skills`
- Dołączone (dostarczane z instalacją)
- Dodatkowe foldery Skills: `skills.load.extraDirs`

Katalogi główne Skills mogą zawierać zgrupowane foldery, takie jak
`<workspace>/skills/personal/foo/SKILL.md`; Skill nadal jest udostępniana przez swoją
płaską nazwę z frontmatter, na przykład `foo`.

Skills mogą być bramkowane przez config/env (zobacz `skills` w [Konfiguracji Gateway](/pl/gateway/configuration)).

## Granice runtime

Osadzony runtime agenta należy do OpenClaw: wykrywanie modeli, okablowanie narzędzi,
składanie promptów, zarządzanie sesjami i dostarczanie kanałami współdzielą jedną zintegrowaną
powierzchnię runtime.

## Sesje

Transkrypty sesji są przechowywane jako JSONL w:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Identyfikator sesji jest stabilny i wybierany przez OpenClaw.
Starsze foldery sesji z innych narzędzi nie są odczytywane.

## Sterowanie podczas strumieniowania

Prompty przychodzące w trakcie uruchomienia są domyślnie sterowane do bieżącego uruchomienia.
Sterowanie jest dostarczane **po zakończeniu wykonywania wywołań narzędzi przez bieżącą turę asystenta**,
przed następnym wywołaniem LLM, i nie pomija już pozostałych wywołań narzędzi
z bieżącej wiadomości asystenta.

`/queue steer` to domyślne zachowanie aktywnego uruchomienia. `/queue followup` i
`/queue collect` sprawiają, że wiadomości czekają na późniejszą turę zamiast sterowania.
`/queue interrupt` przerywa aktywne uruchomienie. Zobacz [Kolejka](/pl/concepts/queue)
i [Kolejka sterowania](/pl/concepts/queue-steering), aby poznać zachowanie kolejki i granic.

Strumieniowanie bloków wysyła ukończone bloki asystenta, gdy tylko się zakończą; jest
**domyślnie wyłączone** (`agents.defaults.blockStreamingDefault: "off"`).
Dostosuj granicę przez `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; domyślnie text_end).
Kontroluj miękkie dzielenie bloków na fragmenty za pomocą `agents.defaults.blockStreamingChunk` (domyślnie
800-1200 znaków; preferuje podziały akapitów, potem nowe linie; zdania na końcu).
Scalaj strumieniowane fragmenty za pomocą `agents.defaults.blockStreamingCoalesce`, aby ograniczyć
spam pojedynczymi liniami (łączenie oparte na bezczynności przed wysłaniem). Kanały inne niż Telegram wymagają
jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
Szczegółowe podsumowania narzędzi są emitowane przy starcie narzędzia (bez debounce); Control UI
strumieniuje wyjście narzędzi przez zdarzenia agenta, gdy są dostępne.
Więcej szczegółów: [Strumieniowanie + dzielenie na fragmenty](/pl/concepts/streaming).

## Referencje modeli

Referencje modeli w konfiguracji (na przykład `agents.defaults.model` i `agents.defaults.models`) są parsowane przez podział po **pierwszym** `/`.

- Używaj `provider/model` podczas konfigurowania modeli.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), uwzględnij prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego
  dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca
  do skonfigurowanego domyślnego dostawcy. Jeśli ten dostawca nie udostępnia już
  skonfigurowanego domyślnego modelu, OpenClaw wraca do pierwszej skonfigurowanej
  pary dostawca/model zamiast ujawniać nieaktualne ustawienie domyślne usuniętego dostawcy.

## Konfiguracja (minimalna)

Co najmniej ustaw:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (zdecydowanie zalecane)

---

_Dalej: [Czaty grupowe](/pl/channels/group-messages)_ 🦞

## Powiązane

- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Zarządzanie sesjami](/pl/concepts/session)
