---
read_when:
    - Zmiana środowiska uruchomieniowego agenta, inicjowania obszaru roboczego lub zachowania sesji
summary: Środowisko wykonawcze agenta, kontrakt przestrzeni roboczej i inicjalizacja sesji
title: Środowisko uruchomieniowe agenta
x-i18n:
    generated_at: "2026-05-06T09:06:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw uruchamia **pojedyncze wbudowane środowisko wykonawcze agenta** - jeden proces agenta na
Gateway, z własnym obszarem roboczym, plikami startowymi i magazynem sesji. Ta strona
opisuje kontrakt tego środowiska wykonawczego: co musi zawierać obszar roboczy, które pliki są
wstrzykiwane i jak sesje uruchamiają się względem niego.

## Obszar roboczy (wymagany)

OpenClaw używa jednego katalogu obszaru roboczego agenta (`agents.defaults.workspace`) jako **jedynego** katalogu roboczego agenta (`cwd`) dla narzędzi i kontekstu.

Zalecane: użyj `openclaw setup`, aby utworzyć `~/.openclaw/openclaw.json`, jeśli go brakuje, i zainicjalizować pliki obszaru roboczego.

Pełny układ obszaru roboczego + przewodnik po kopiach zapasowych: [Obszar roboczy agenta](/pl/concepts/agent-workspace)

Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą nadpisać to ustawienie
obszarami roboczymi przypisanymi do sesji pod `agents.defaults.sandbox.workspaceRoot` (zobacz
[Konfiguracja Gateway](/pl/gateway/configuration)).

## Pliki startowe (wstrzykiwane)

Wewnątrz `agents.defaults.workspace` OpenClaw oczekuje tych plików edytowalnych przez użytkownika:

- `AGENTS.md` - instrukcje operacyjne + „pamięć”
- `SOUL.md` - persona, granice, ton
- `TOOLS.md` - utrzymywane przez użytkownika notatki o narzędziach (np. `imsg`, `sag`, konwencje)
- `BOOTSTRAP.md` - jednorazowy rytuał pierwszego uruchomienia (usuwany po ukończeniu)
- `IDENTITY.md` - nazwa agenta/charakter/emoji
- `USER.md` - profil użytkownika + preferowana forma zwracania się

W pierwszej turze nowej sesji OpenClaw wstrzykuje zawartość tych plików do Project Context promptu systemowego.

Puste pliki są pomijane. Duże pliki są przycinane i skracane ze znacznikiem, aby prompty pozostały zwięzłe (przeczytaj plik, aby zobaczyć pełną zawartość).

Jeśli brakuje pliku, OpenClaw wstrzykuje pojedynczą linię znacznika „brakujący plik” (a `openclaw setup` utworzy bezpieczny domyślny szablon).

`BOOTSTRAP.md` jest tworzony tylko dla **zupełnie nowego obszaru roboczego** (bez innych obecnych plików startowych). Dopóki oczekuje na wykonanie, OpenClaw utrzymuje go w Project Context i dodaje do promptu systemowego wskazówki startowe dla początkowego rytuału, zamiast kopiować go do wiadomości użytkownika. Jeśli usuniesz go po ukończeniu rytuału, nie powinien zostać odtworzony przy późniejszych ponownych uruchomieniach.

Aby całkowicie wyłączyć tworzenie plików startowych (dla wstępnie przygotowanych obszarów roboczych), ustaw:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Wbudowane narzędzia

Narzędzia podstawowe (read/exec/edit/write i powiązane narzędzia systemowe) są zawsze dostępne,
zgodnie z polityką narzędzi. `apply_patch` jest opcjonalne i kontrolowane przez
`tools.exec.applyPatch`. `TOOLS.md` **nie** steruje tym, które narzędzia istnieją; to
wskazówki dotyczące tego, jak _Ty_ chcesz, aby były używane.

## Skills

OpenClaw ładuje Skills z tych lokalizacji (najwyższy priorytet jako pierwszy):

- Obszar roboczy: `<workspace>/skills`
- Skills agenta projektu: `<workspace>/.agents/skills`
- Osobiste Skills agenta: `~/.agents/skills`
- Zarządzane/lokalne: `~/.openclaw/skills`
- Wbudowane (dostarczane z instalacją)
- Dodatkowe foldery Skills: `skills.load.extraDirs`

Skills mogą być ograniczane przez konfigurację/env (zobacz `skills` w [Konfiguracja Gateway](/pl/gateway/configuration)).

## Granice środowiska wykonawczego

Wbudowane środowisko wykonawcze agenta jest zbudowane na rdzeniu agenta Pi (modele, narzędzia i
potok promptów). Zarządzanie sesjami, wykrywanie, podłączanie narzędzi i dostarczanie przez kanały
to warstwy należące do OpenClaw nad tym rdzeniem.

## Sesje

Transkrypty sesji są przechowywane jako JSONL pod:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Identyfikator sesji jest stabilny i wybierany przez OpenClaw.
Starsze foldery sesji z innych narzędzi nie są odczytywane.

## Sterowanie podczas streamingu

Gdy tryb kolejki to `steer`, wiadomości przychodzące są wstrzykiwane do bieżącego uruchomienia.
Sterowanie z kolejki jest dostarczane **po zakończeniu wykonywania wywołań narzędzi przez bieżącą turę asystenta**,
przed następnym wywołaniem LLM. Pi opróżnia wszystkie oczekujące
wiadomości sterujące razem dla `steer`; starszy tryb `queue` opróżnia jedną wiadomość na
granicę modelu. Sterowanie nie pomija już pozostałych wywołań narzędzi z bieżącej
wiadomości asystenta.

Gdy tryb kolejki to `followup` lub `collect`, wiadomości przychodzące są wstrzymywane do końca
bieżącej tury, a następnie rozpoczyna się nowa tura agenta z zakolejkowanymi ładunkami. Zobacz
[Kolejka](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering), aby poznać zachowanie trybów
i granic.

Streaming blokowy wysyła ukończone bloki asystenta natychmiast po ich zakończeniu; jest
**domyślnie wyłączony** (`agents.defaults.blockStreamingDefault: "off"`).
Dostosuj granicę przez `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; domyślnie text_end).
Steruj miękkim dzieleniem bloków za pomocą `agents.defaults.blockStreamingChunk` (domyślnie
800-1200 znaków; preferuje podziały akapitów, potem nowe linie; zdania na końcu).
Łącz strumieniowane fragmenty za pomocą `agents.defaults.blockStreamingCoalesce`, aby ograniczyć
spam pojedynczymi liniami (łączenie oparte na bezczynności przed wysłaniem). Kanały inne niż Telegram wymagają
jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
Szczegółowe podsumowania narzędzi są emitowane przy starcie narzędzia (bez debounce); Control UI
strumieniuje wyjście narzędzi przez zdarzenia agenta, gdy są dostępne.
Więcej szczegółów: [Streaming + dzielenie na fragmenty](/pl/concepts/streaming).

## Odwołania do modeli

Odwołania do modeli w konfiguracji (na przykład `agents.defaults.model` i `agents.defaults.models`) są parsowane przez podział na **pierwszym** `/`.

- Użyj `provider/model` podczas konfigurowania modeli.
- Jeśli sam identyfikator modelu zawiera `/` (w stylu OpenRouter), uwzględnij prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego
  dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca
  do skonfigurowanego domyślnego dostawcy. Jeśli ten dostawca nie udostępnia już
  skonfigurowanego domyślnego modelu, OpenClaw wraca do pierwszej skonfigurowanej pary
  dostawca/model zamiast zgłaszać nieaktualnego domyślnego usuniętego dostawcę.

## Konfiguracja (minimalna)

Jako minimum ustaw:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (zdecydowanie zalecane)

---

_Dalej: [Czaty grupowe](/pl/channels/group-messages)_ 🦞

## Powiązane

- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Zarządzanie sesją](/pl/concepts/session)
