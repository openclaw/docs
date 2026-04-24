---
read_when:
    - Zmiana runtime agenta, bootstrapu obszaru roboczego lub zachowania sesji
summary: Runtime agenta, kontrakt obszaru roboczego i bootstrap sesji
title: Runtime agenta
x-i18n:
    generated_at: "2026-04-24T09:04:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw uruchamia **jeden osadzony runtime agenta** — jeden proces agenta na
Gateway, z własnym obszarem roboczym, plikami bootstrap i magazynem sesji. Ta strona
opisuje ten kontrakt runtime: co musi zawierać obszar roboczy, które pliki są
wstrzykiwane i jak sesje wykonują bootstrap względem niego.

## Obszar roboczy (wymagany)

OpenClaw używa jednego katalogu obszaru roboczego agenta (`agents.defaults.workspace`) jako **jedynego** katalogu roboczego (`cwd`) agenta dla narzędzi i kontekstu.

Zalecane: użyj `openclaw setup`, aby utworzyć `~/.openclaw/openclaw.json`, jeśli go brakuje, i zainicjalizować pliki obszaru roboczego.

Pełny układ obszaru roboczego + przewodnik tworzenia kopii zapasowej: [Agent workspace](/pl/concepts/agent-workspace)

Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą to nadpisać
obszarami roboczymi per sesja w `agents.defaults.sandbox.workspaceRoot` (zobacz
[Gateway configuration](/pl/gateway/configuration)).

## Pliki bootstrap (wstrzykiwane)

Wewnątrz `agents.defaults.workspace` OpenClaw oczekuje tych edytowalnych przez użytkownika plików:

- `AGENTS.md` — instrukcje operacyjne + „pamięć”
- `SOUL.md` — persona, granice, ton
- `TOOLS.md` — notatki o narzędziach utrzymywane przez użytkownika (np. `imsg`, `sag`, konwencje)
- `BOOTSTRAP.md` — jednorazowy rytuał pierwszego uruchomienia (usuwany po ukończeniu)
- `IDENTITY.md` — nazwa/styl/emoji agenta
- `USER.md` — profil użytkownika + preferowana forma zwracania się

W pierwszej turze nowej sesji OpenClaw wstrzykuje zawartość tych plików bezpośrednio do kontekstu agenta.

Puste pliki są pomijane. Duże pliki są przycinane i ucinane ze znacznikiem, aby prompty pozostały lekkie (przeczytaj plik, aby uzyskać pełną treść).

Jeśli pliku brakuje, OpenClaw wstrzykuje pojedynczy wiersz znacznika „missing file” (a `openclaw setup` utworzy bezpieczny domyślny szablon).

`BOOTSTRAP.md` jest tworzony tylko dla **całkowicie nowego obszaru roboczego** (gdy nie ma innych plików bootstrap). Jeśli usuniesz go po ukończeniu rytuału, nie powinien zostać utworzony ponownie przy późniejszych restartach.

Aby całkowicie wyłączyć tworzenie plików bootstrap (dla wcześniej przygotowanych obszarów roboczych), ustaw:

```json5
{ agent: { skipBootstrap: true } }
```

## Wbudowane narzędzia

Podstawowe narzędzia (read/exec/edit/write i powiązane narzędzia systemowe) są zawsze dostępne,
z zastrzeżeniem polityki narzędzi. `apply_patch` jest opcjonalne i kontrolowane przez
`tools.exec.applyPatch`. `TOOLS.md` **nie** kontroluje, które narzędzia istnieją; to
wskazówki dotyczące tego, jak _Ty_ chcesz, aby były używane.

## Skills

OpenClaw ładuje Skills z tych lokalizacji (najwyższy priorytet jako pierwszy):

- Obszar roboczy: `<workspace>/skills`
- Skills agenta projektu: `<workspace>/.agents/skills`
- Osobiste Skills agenta: `~/.agents/skills`
- Zarządzane/lokalne: `~/.openclaw/skills`
- Dołączone (dostarczane z instalacją)
- Dodatkowe foldery skill: `skills.load.extraDirs`

Skills mogą być ograniczane przez config/env (zobacz `skills` w [Gateway configuration](/pl/gateway/configuration)).

## Granice runtime

Osadzony runtime agenta jest zbudowany na rdzeniu agenta Pi (modele, narzędzia i
potok promptów). Zarządzanie sesjami, wykrywanie, okablowanie narzędzi i
dostarczanie kanałowe to warstwy należące do OpenClaw zbudowane ponad tym rdzeniem.

## Sesje

Transkrypcje sesji są przechowywane jako JSONL w:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Identyfikator sesji jest stabilny i wybierany przez OpenClaw.
Starsze foldery sesji z innych narzędzi nie są odczytywane.

## Sterowanie podczas streamingu

Gdy tryb kolejki to `steer`, wiadomości przychodzące są wstrzykiwane do bieżącego uruchomienia.
Sterowanie z kolejki jest dostarczane **po zakończeniu wykonywania wywołań narzędzi przez bieżącą turę asystenta**,
przed następnym wywołaniem LLM. Sterowanie nie pomija już
pozostałych wywołań narzędzi z bieżącej wiadomości asystenta; zamiast tego wstrzykuje wiadomość z kolejki przy następnej granicy modelu.

Gdy tryb kolejki to `followup` lub `collect`, wiadomości przychodzące są wstrzymywane do
zakończenia bieżącej tury, po czym rozpoczyna się nowa tura agenta z wiadomościami z kolejki. Zobacz
[Queue](/pl/concepts/queue), aby poznać zachowanie trybu + debounce/limitów.

Streaming bloków wysyła ukończone bloki asystenta natychmiast po ich zakończeniu; jest
**domyślnie wyłączony** (`agents.defaults.blockStreamingDefault: "off"`).
Dostrój granicę przez `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; domyślnie `text_end`).
Kontroluj miękkie dzielenie bloków przez `agents.defaults.blockStreamingChunk` (domyślnie
800–1200 znaków; preferuje podziały akapitów, potem nowe linie; zdania na końcu).
Scalaj streamowane fragmenty przez `agents.defaults.blockStreamingCoalesce`, aby ograniczyć
spam pojedynczych linii (łączenie oparte na bezczynności przed wysłaniem). Kanały inne niż Telegram wymagają
jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
Szczegółowe podsumowania narzędzi są emitowane przy starcie narzędzia (bez debounce); Control UI
streamuje dane wyjściowe narzędzi przez zdarzenia agenta, gdy są dostępne.
Więcej szczegółów: [Streaming + chunking](/pl/concepts/streaming).

## Referencje modeli

Referencje modeli w konfiguracji (na przykład `agents.defaults.model` i `agents.defaults.models`) są parsowane przez podział przy **pierwszym** `/`.

- Używaj `provider/model` podczas konfigurowania modeli.
- Jeśli sam identyfikator modelu zawiera `/` (styl OpenRouter), dołącz prefiks providera (przykład: `openrouter/moonshotai/kimi-k2`).
- Jeśli pominiesz providera, OpenClaw najpierw próbuje aliasu, potem unikalnego
  dopasowania skonfigurowanego providera dla dokładnie tego identyfikatora modelu, a dopiero potem wraca
  do skonfigurowanego providera domyślnego. Jeśli ten provider nie udostępnia już
  skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego
  provider/model zamiast pokazywać nieaktualne domyślne ustawienie usuniętego providera.

## Konfiguracja (minimalna)

Minimalnie ustaw:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (zdecydowanie zalecane)

---

_Dalej: [Group Chats](/pl/channels/group-messages)_ 🦞

## Powiązane

- [Agent workspace](/pl/concepts/agent-workspace)
- [Multi-agent routing](/pl/concepts/multi-agent)
- [Session management](/pl/concepts/session)
