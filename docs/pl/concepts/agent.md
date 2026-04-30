---
read_when:
    - Zmiana środowiska uruchomieniowego agenta, inicjalizacji obszaru roboczego lub zachowania sesji
summary: Środowisko uruchomieniowe agenta, kontrakt przestrzeni roboczej i inicjalizacja sesji
title: Środowisko uruchomieniowe agenta
x-i18n:
    generated_at: "2026-04-30T09:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw uruchamia **pojedyncze wbudowane środowisko uruchomieniowe agenta** — jeden proces agenta na
Gateway, z własnym obszarem roboczym, plikami startowymi i magazynem sesji. Ta strona
opisuje ten kontrakt środowiska uruchomieniowego: co musi zawierać obszar roboczy, które pliki są
wstrzykiwane i jak sesje są względem niego inicjowane.

## Obszar roboczy (wymagany)

OpenClaw używa pojedynczego katalogu obszaru roboczego agenta (`agents.defaults.workspace`) jako **jedynego** katalogu roboczego agenta (`cwd`) dla narzędzi i kontekstu.

Zalecane: użyj `openclaw setup`, aby utworzyć `~/.openclaw/openclaw.json`, jeśli go brakuje, i zainicjować pliki obszaru roboczego.

Pełny układ obszaru roboczego + przewodnik tworzenia kopii zapasowych: [Obszar roboczy agenta](/pl/concepts/agent-workspace)

Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą nadpisać to ustawienie za pomocą
obszarów roboczych dla poszczególnych sesji w `agents.defaults.sandbox.workspaceRoot` (zobacz
[Konfiguracja Gateway](/pl/gateway/configuration)).

## Pliki startowe (wstrzykiwane)

Wewnątrz `agents.defaults.workspace` OpenClaw oczekuje tych plików edytowalnych przez użytkownika:

- `AGENTS.md` — instrukcje operacyjne + „pamięć”
- `SOUL.md` — persona, granice, ton
- `TOOLS.md` — utrzymywane przez użytkownika notatki o narzędziach (np. `imsg`, `sag`, konwencje)
- `BOOTSTRAP.md` — jednorazowy rytuał pierwszego uruchomienia (usuwany po ukończeniu)
- `IDENTITY.md` — nazwa agenta/charakter/emoji
- `USER.md` — profil użytkownika + preferowana forma zwracania się

W pierwszej turze nowej sesji OpenClaw wstrzykuje zawartość tych plików bezpośrednio do kontekstu agenta.

Puste pliki są pomijane. Duże pliki są przycinane i skracane ze znacznikiem, aby prompty pozostały zwięzłe (przeczytaj plik, aby zobaczyć pełną zawartość).

Jeśli brakuje pliku, OpenClaw wstrzykuje pojedynczy wiersz znacznika „brakujący plik” (a `openclaw setup` utworzy bezpieczny domyślny szablon).

`BOOTSTRAP.md` jest tworzony tylko dla **zupełnie nowego obszaru roboczego** (gdy nie ma żadnych innych plików startowych). Jeśli usuniesz go po ukończeniu rytuału, nie powinien zostać odtworzony przy późniejszych restartach.

Aby całkowicie wyłączyć tworzenie plików startowych (dla wstępnie przygotowanych obszarów roboczych), ustaw:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Wbudowane narzędzia

Narzędzia rdzeniowe (odczyt/wykonanie/edycja/zapis i powiązane narzędzia systemowe) są zawsze dostępne,
zgodnie z polityką narzędzi. `apply_patch` jest opcjonalne i kontrolowane przez
`tools.exec.applyPatch`. `TOOLS.md` **nie** kontroluje, które narzędzia istnieją; to
wskazówki dotyczące tego, jak _Ty_ chcesz, aby były używane.

## Skills

OpenClaw ładuje Skills z tych lokalizacji (od najwyższego priorytetu):

- Obszar roboczy: `<workspace>/skills`
- Skills agenta projektu: `<workspace>/.agents/skills`
- Osobiste Skills agenta: `~/.agents/skills`
- Zarządzane/lokalne: `~/.openclaw/skills`
- Dołączone (dostarczane z instalacją)
- Dodatkowe foldery Skills: `skills.load.extraDirs`

Skills mogą być kontrolowane przez konfigurację/środowisko (zobacz `skills` w [Konfiguracja Gateway](/pl/gateway/configuration)).

## Granice środowiska uruchomieniowego

Wbudowane środowisko uruchomieniowe agenta jest zbudowane na rdzeniu agenta Pi (modele, narzędzia i
potok promptów). Zarządzanie sesjami, wykrywanie, podłączanie narzędzi i dostarczanie do kanałów
to warstwy należące do OpenClaw, nałożone na ten rdzeń.

## Sesje

Transkrypty sesji są przechowywane jako JSONL pod adresem:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Identyfikator sesji jest stabilny i wybierany przez OpenClaw.
Starsze foldery sesji z innych narzędzi nie są odczytywane.

## Sterowanie podczas strumieniowania

Gdy tryb kolejki to `steer`, wiadomości przychodzące są wstrzykiwane do bieżącego uruchomienia.
Sterowanie z kolejki jest dostarczane **po zakończeniu przez bieżącą turę asystenta
wykonywania wywołań narzędzi**, przed następnym wywołaniem LLM. Pi opróżnia wszystkie oczekujące
wiadomości sterujące razem dla `steer`; starszy tryb `queue` opróżnia jedną wiadomość na
granicę modelu. Sterowanie nie pomija już pozostałych wywołań narzędzi z bieżącej
wiadomości asystenta.

Gdy tryb kolejki to `followup` lub `collect`, wiadomości przychodzące są wstrzymywane do
zakończenia bieżącej tury, a następnie rozpoczyna się nowa tura agenta z payloadami z kolejki. Zobacz
[Kolejka](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering), aby poznać tryby
i zachowanie na granicach.

Strumieniowanie bloków wysyła ukończone bloki asystenta, gdy tylko się zakończą; jest
**domyślnie wyłączone** (`agents.defaults.blockStreamingDefault: "off"`).
Dostosuj granicę przez `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; domyślnie text_end).
Kontroluj miękkie dzielenie bloków na fragmenty za pomocą `agents.defaults.blockStreamingChunk` (domyślnie
800–1200 znaków; preferuje podziały akapitów, potem nowe wiersze; zdania na końcu).
Łącz strumieniowane fragmenty za pomocą `agents.defaults.blockStreamingCoalesce`, aby ograniczyć
spam pojedynczymi wierszami (łączenie oparte na bezczynności przed wysłaniem). Kanały inne niż Telegram wymagają
jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
Szczegółowe podsumowania narzędzi są emitowane przy starcie narzędzia (bez debounce); Control UI
strumieniuje dane wyjściowe narzędzi przez zdarzenia agenta, gdy są dostępne.
Więcej szczegółów: [Strumieniowanie + dzielenie na fragmenty](/pl/concepts/streaming).

## Referencje modeli

Referencje modeli w konfiguracji (na przykład `agents.defaults.model` i `agents.defaults.models`) są parsowane przez podział na **pierwszym** `/`.

- Użyj `provider/model` podczas konfigurowania modeli.
- Jeśli sam identyfikator modelu zawiera `/` (w stylu OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikatowego
  dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca
  do skonfigurowanego domyślnego dostawcy. Jeśli ten dostawca nie udostępnia już
  skonfigurowanego domyślnego modelu, OpenClaw wraca do pierwszej skonfigurowanej
  pary dostawca/model zamiast zgłaszać nieaktualnego domyślnego dostawcę, który został usunięty.

## Konfiguracja (minimalna)

Jako minimum ustaw:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (zdecydowanie zalecane)

---

_Dalej: [Czaty grupowe](/pl/channels/group-messages)_ 🦞

## Powiązane

- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Zarządzanie sesjami](/pl/concepts/session)
