---
read_when:
    - Zmiana środowiska wykonawczego agenta, inicjalizacji obszaru roboczego lub zachowania sesji
summary: Środowisko wykonawcze agenta, kontrakt obszaru roboczego i inicjalizacja sesji
title: Środowisko uruchomieniowe agenta
x-i18n:
    generated_at: "2026-05-04T02:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw uruchamia **pojedyncze wbudowane środowisko uruchomieniowe agenta** — jeden proces agenta na
Gateway, z własnym obszarem roboczym, plikami startowymi i magazynem sesji. Ta strona
opisuje ten kontrakt środowiska uruchomieniowego: co musi zawierać obszar roboczy, które pliki są
wstrzykiwane i jak sesje uruchamiają się na jego podstawie.

## Obszar roboczy (wymagany)

OpenClaw używa jednego katalogu obszaru roboczego agenta (`agents.defaults.workspace`) jako **jedynego** katalogu roboczego (`cwd`) agenta dla narzędzi i kontekstu.

Zalecane: użyj `openclaw setup`, aby utworzyć `~/.openclaw/openclaw.json`, jeśli go brakuje, i zainicjować pliki obszaru roboczego.

Pełny układ obszaru roboczego + przewodnik po kopiach zapasowych: [Obszar roboczy agenta](/pl/concepts/agent-workspace)

Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą to zastąpić
obszarami roboczymi dla poszczególnych sesji w `agents.defaults.sandbox.workspaceRoot` (zobacz
[Konfiguracja Gateway](/pl/gateway/configuration)).

## Pliki startowe (wstrzykiwane)

Wewnątrz `agents.defaults.workspace` OpenClaw oczekuje tych edytowalnych przez użytkownika plików:

- `AGENTS.md` — instrukcje działania + „pamięć”
- `SOUL.md` — persona, granice, ton
- `TOOLS.md` — utrzymywane przez użytkownika notatki o narzędziach (np. `imsg`, `sag`, konwencje)
- `BOOTSTRAP.md` — jednorazowy rytuał pierwszego uruchomienia (usuwany po ukończeniu)
- `IDENTITY.md` — nazwa agenta/charakter/emoji
- `USER.md` — profil użytkownika + preferowana forma zwracania się

W pierwszej turze nowej sesji OpenClaw wstrzykuje zawartość tych plików do Kontekstu projektu w prompcie systemowym.

Puste pliki są pomijane. Duże pliki są skracane i przycinane ze znacznikiem, aby prompty pozostały zwięzłe (przeczytaj plik, aby zobaczyć pełną treść).

Jeśli brakuje pliku, OpenClaw wstrzykuje pojedynczą linię znacznika „brakujący plik” (a `openclaw setup` utworzy bezpieczny domyślny szablon).

`BOOTSTRAP.md` jest tworzony tylko dla **zupełnie nowego obszaru roboczego** (gdy nie ma innych plików startowych). Dopóki oczekuje, OpenClaw utrzymuje go w Kontekście projektu i dodaje do promptu systemowego wskazówki startowe dla początkowego rytuału, zamiast kopiować go do wiadomości użytkownika. Jeśli usuniesz go po ukończeniu rytuału, nie powinien zostać odtworzony przy późniejszych restartach.

Aby całkowicie wyłączyć tworzenie pliku startowego (dla wstępnie przygotowanych obszarów roboczych), ustaw:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Wbudowane narzędzia

Narzędzia rdzeniowe (odczyt/wykonanie/edycja/zapis i powiązane narzędzia systemowe) są zawsze dostępne,
z zastrzeżeniem zasad dotyczących narzędzi. `apply_patch` jest opcjonalne i kontrolowane przez
`tools.exec.applyPatch`. `TOOLS.md` **nie** kontroluje, które narzędzia istnieją; to
wskazówki dotyczące tego, jak _Ty_ chcesz, aby były używane.

## Skills

OpenClaw ładuje Skills z tych lokalizacji (najwyższy priorytet jako pierwszy):

- Obszar roboczy: `<workspace>/skills`
- Skills agenta projektu: `<workspace>/.agents/skills`
- Osobiste Skills agenta: `~/.agents/skills`
- Zarządzane/lokalne: `~/.openclaw/skills`
- Dołączone w pakiecie (dostarczane z instalacją)
- Dodatkowe foldery Skills: `skills.load.extraDirs`

Skills mogą być ograniczane przez konfigurację/środowisko (zobacz `skills` w [Konfiguracji Gateway](/pl/gateway/configuration)).

## Granice środowiska uruchomieniowego

Wbudowane środowisko uruchomieniowe agenta jest zbudowane na rdzeniu agenta Pi (modele, narzędzia i
potok promptów). Zarządzanie sesjami, wykrywanie, podłączanie narzędzi i dostarczanie
do kanałów to warstwy należące do OpenClaw, działające nad tym rdzeniem.

## Sesje

Transkrypcje sesji są przechowywane jako JSONL w:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Identyfikator sesji jest stabilny i wybierany przez OpenClaw.
Starsze foldery sesji z innych narzędzi nie są odczytywane.

## Sterowanie podczas strumieniowania

Gdy tryb kolejki to `steer`, wiadomości przychodzące są wstrzykiwane do bieżącego uruchomienia.
Zakolejkowane sterowanie jest dostarczane **po zakończeniu wykonywania wywołań narzędzi
w bieżącej turze asystenta**, przed następnym wywołaniem LLM. Pi pobiera razem wszystkie oczekujące
wiadomości sterujące dla `steer`; starsze `queue` pobiera jedną wiadomość na
granicę modelu. Sterowanie nie pomija już pozostałych wywołań narzędzi z bieżącej
wiadomości asystenta.

Gdy tryb kolejki to `followup` lub `collect`, wiadomości przychodzące są wstrzymywane do
końca bieżącej tury, a następnie rozpoczyna się nowa tura agenta z zakolejkowanymi ładunkami. Zobacz
[Kolejka](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering), aby poznać tryby
i zachowanie granic.

Strumieniowanie bloków wysyła ukończone bloki asystenta natychmiast po ich zakończeniu; jest
**domyślnie wyłączone** (`agents.defaults.blockStreamingDefault: "off"`).
Dostosuj granicę przez `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; domyślnie text_end).
Steruj miękkim dzieleniem bloków za pomocą `agents.defaults.blockStreamingChunk` (domyślnie
800–1200 znaków; preferuje przerwy między akapitami, potem nowe linie; zdania na końcu).
Scalaj strumieniowane fragmenty za pomocą `agents.defaults.blockStreamingCoalesce`, aby ograniczyć
spam pojedynczymi liniami (łączenie oparte na bezczynności przed wysłaniem). Kanały inne niż Telegram wymagają
jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
Szczegółowe podsumowania narzędzi są emitowane przy starcie narzędzia (bez debounce); Control UI
strumieniuje dane wyjściowe narzędzi przez zdarzenia agenta, gdy są dostępne.
Więcej szczegółów: [Strumieniowanie + dzielenie na fragmenty](/pl/concepts/streaming).

## Odwołania do modeli

Odwołania do modeli w konfiguracji (na przykład `agents.defaults.model` i `agents.defaults.models`) są parsowane przez podział po **pierwszym** `/`.

- Użyj `provider/model` podczas konfigurowania modeli.
- Jeśli sam identyfikator modelu zawiera `/` (w stylu OpenRouter), dodaj prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego
  dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca
  do skonfigurowanego domyślnego dostawcy. Jeśli ten dostawca nie udostępnia już
  skonfigurowanego domyślnego modelu, OpenClaw wraca do pierwszej skonfigurowanej
  pary dostawca/model, zamiast ujawniać nieaktualny domyślny model usuniętego dostawcy.

## Konfiguracja (minimalna)

Co najmniej ustaw:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (zdecydowanie zalecane)

---

_Następnie: [Czaty grupowe](/pl/channels/group-messages)_ 🦞

## Powiązane

- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Trasowanie wieloagentowe](/pl/concepts/multi-agent)
- [Zarządzanie sesjami](/pl/concepts/session)
