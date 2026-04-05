---
read_when:
    - Zmieniasz środowisko uruchomieniowe agenta, bootstrap workspace lub zachowanie sesji
summary: Środowisko uruchomieniowe agenta, kontrakt workspace i bootstrap sesji
title: Środowisko uruchomieniowe agenta
x-i18n:
    generated_at: "2026-04-05T13:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# Środowisko uruchomieniowe agenta

OpenClaw uruchamia pojedyncze osadzone środowisko uruchomieniowe agenta.

## Workspace (wymagane)

OpenClaw używa pojedynczego katalogu workspace agenta (`agents.defaults.workspace`) jako **jedynego** katalogu roboczego (`cwd`) agenta dla narzędzi i kontekstu.

Zalecane: użyj `openclaw setup`, aby utworzyć `~/.openclaw/openclaw.json`, jeśli go brakuje, i zainicjalizować pliki workspace.

Pełny układ workspace + przewodnik kopii zapasowej: [Workspace agenta](/concepts/agent-workspace)

Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą nadpisywać to
workspace per sesja w `agents.defaults.sandbox.workspaceRoot` (zobacz
[Konfiguracja Gateway](/gateway/configuration)).

## Pliki bootstrapu (wstrzykiwane)

Wewnątrz `agents.defaults.workspace` OpenClaw oczekuje następujących plików edytowalnych przez użytkownika:

- `AGENTS.md` — instrukcje operacyjne + „pamięć”
- `SOUL.md` — persona, granice, ton
- `TOOLS.md` — notatki o narzędziach utrzymywane przez użytkownika (np. `imsg`, `sag`, konwencje)
- `BOOTSTRAP.md` — jednorazowy rytuał pierwszego uruchomienia (usuwany po ukończeniu)
- `IDENTITY.md` — nazwa/styl/emoji agenta
- `USER.md` — profil użytkownika + preferowana forma zwracania się

W pierwszej turze nowej sesji OpenClaw wstrzykuje zawartość tych plików bezpośrednio do kontekstu agenta.

Puste pliki są pomijane. Duże pliki są przycinane i ucinane z markerem, aby prompty pozostały lekkie (przeczytaj plik, aby zobaczyć pełną zawartość).

Jeśli pliku brakuje, OpenClaw wstrzykuje pojedynczą linię markera „brak pliku” (a `openclaw setup` utworzy bezpieczny domyślny szablon).

`BOOTSTRAP.md` jest tworzony tylko dla **zupełnie nowego workspace** (gdy nie ma innych plików bootstrapu). Jeśli usuniesz go po ukończeniu rytuału, nie powinien być tworzony ponownie przy późniejszych restartach.

Aby całkowicie wyłączyć tworzenie plików bootstrapu (dla wstępnie przygotowanych workspace), ustaw:

```json5
{ agent: { skipBootstrap: true } }
```

## Wbudowane narzędzia

Narzędzia podstawowe (read/exec/edit/write i powiązane narzędzia systemowe) są zawsze dostępne,
zgodnie z polityką narzędzi. `apply_patch` jest opcjonalne i kontrolowane przez
`tools.exec.applyPatch`. `TOOLS.md` **nie** kontroluje, które narzędzia istnieją; to
wskazówki dotyczące tego, jak _Ty_ chcesz, aby były używane.

## Skills

OpenClaw ładuje Skills z tych lokalizacji (najwyższy priorytet na początku):

- Workspace: `<workspace>/skills`
- Skills agenta projektu: `<workspace>/.agents/skills`
- Osobiste Skills agenta: `~/.agents/skills`
- Zarządzane/lokalne: `~/.openclaw/skills`
- Dołączone do instalacji
- Dodatkowe foldery Skills: `skills.load.extraDirs`

Skills mogą być kontrolowane przez config/env (zobacz `skills` w [Konfiguracja Gateway](/gateway/configuration)).

## Granice środowiska uruchomieniowego

Osadzone środowisko uruchomieniowe agenta jest zbudowane na rdzeniu agenta Pi (modele, narzędzia i
pipeline promptów). Zarządzanie sesjami, wykrywanie, podłączanie narzędzi i dostarczanie
kanałami to warstwy należące do OpenClaw nad tym rdzeniem.

## Sesje

Transkrypcje sesji są przechowywane jako JSONL w lokalizacji:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Identyfikator sesji jest stabilny i wybierany przez OpenClaw.
Starsze foldery sesji z innych narzędzi nie są odczytywane.

## Sterowanie podczas streamingu

Gdy tryb kolejki to `steer`, wiadomości przychodzące są wstrzykiwane do bieżącego uruchomienia.
Sterowanie zakolejkowane jest dostarczane **po zakończeniu wykonywania bieżących wywołań narzędzi przez aktualną turę asystenta** i przed następnym wywołaniem LLM. Sterowanie nie pomija już
pozostałych wywołań narzędzi z bieżącej wiadomości asystenta; zamiast tego wstrzykuje zakolejkowaną
wiadomość przy następnej granicy modelu.

Gdy tryb kolejki to `followup` lub `collect`, wiadomości przychodzące są wstrzymywane do
końca bieżącej tury, a następnie rozpoczyna się nowa tura agenta z zakolejkowanymi ładunkami. Zobacz
[Kolejka](/concepts/queue), aby poznać zachowanie trybu oraz debounce/cap.

Wysyłanie blokowe wysyła ukończone bloki asystenta natychmiast po ich zakończeniu; jest
**domyślnie wyłączone** (`agents.defaults.blockStreamingDefault: "off"`).
Dostosuj granicę przez `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; domyślnie `text_end`).
Kontroluj miękkie porcjowanie bloków przez `agents.defaults.blockStreamingChunk` (domyślnie
800–1200 znaków; preferuje podziały akapitów, potem nowe linie, na końcu zdania).
Łącz streamowane fragmenty przez `agents.defaults.blockStreamingCoalesce`, aby ograniczyć
spam pojedynczymi liniami (scalanie zależne od bezczynności przed wysłaniem). Kanały inne niż
Telegram wymagają jawnego ustawienia `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
Szczegółowe podsumowania narzędzi są emitowane przy starcie narzędzia (bez debounce); Control UI
streamuje dane wyjściowe narzędzi przez zdarzenia agenta, gdy są dostępne.
Więcej szczegółów: [Streaming + chunking](/concepts/streaming).

## Referencje modeli

Referencje modeli w konfiguracji (na przykład `agents.defaults.model` i `agents.defaults.models`) są analizowane przez podział przy **pierwszym** `/`.

- Użyj `provider/model` podczas konfigurowania modeli.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), dołącz prefiks dostawcy (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, następnie unikalnego
  dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego dostawcy. Jeśli ten dostawca nie udostępnia już
  skonfigurowanego modelu domyślnego, OpenClaw przechodzi na pierwszy skonfigurowany
  dostawca/model zamiast zgłaszać nieaktualną wartość domyślną usuniętego dostawcy.

## Konfiguracja (minimalna)

Minimalnie ustaw:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (zdecydowanie zalecane)

---

_Dalej: [Czaty grupowe](/pl/channels/group-messages)_ 🦞
