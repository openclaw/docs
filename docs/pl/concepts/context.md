---
read_when:
    - Chcesz zrozumieć, co oznacza „kontekst” w OpenClaw
    - Debugujesz, dlaczego model „wie” coś (albo o tym zapomniał)
    - Chcesz zmniejszyć narzut kontekstu (`/context`, `/status`, `/compact`)
summary: 'Kontekst: co widzi model, jak jest zbudowany i jak go sprawdzić'
title: Kontekst
x-i18n:
    generated_at: "2026-04-18T09:34:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 477ccb1d9654968d0e904b6846b32b8c14db6b6c0d3d2ec2b7409639175629f9
    source_path: concepts/context.md
    workflow: 15
---

# Kontekst

„Kontekst” to **wszystko, co OpenClaw wysyła do modelu podczas uruchomienia**. Jest on ograniczony przez **okno kontekstu** modelu (limit tokenów).

Model mentalny dla początkujących:

- **System prompt** (budowany przez OpenClaw): reguły, narzędzia, lista Skills, czas/środowisko uruchomieniowe oraz wstrzyknięte pliki obszaru roboczego.
- **Historia rozmowy**: Twoje wiadomości + wiadomości asystenta z tej sesji.
- **Wywołania/wyniki narzędzi + załączniki**: wyjście poleceń, odczyty plików, obrazy/audio itd.

Kontekst _nie jest tym samym_ co „pamięć”: pamięć może być przechowywana na dysku i później ponownie wczytana; kontekst to to, co znajduje się w bieżącym oknie modelu.

## Szybki start (sprawdzanie kontekstu)

- `/status` → szybki widok „jak bardzo zapełnione jest moje okno?” + ustawienia sesji.
- `/context list` → co jest wstrzyknięte + przybliżone rozmiary (na plik + sumy).
- `/context detail` → głębszy podział: rozmiary dla poszczególnych plików, schematów narzędzi, wpisów Skills oraz rozmiar system promptu.
- `/usage tokens` → dodaje stopkę z użyciem tokenów do zwykłych odpowiedzi.
- `/compact` → podsumowuje starszą historię do zwartego wpisu, aby zwolnić miejsce w oknie.

Zobacz też: [Polecenia slash](/pl/tools/slash-commands), [Użycie tokenów i koszty](/pl/reference/token-use), [Compaction](/pl/concepts/compaction).

## Przykładowe wyjście

Wartości różnią się w zależności od modelu, dostawcy, zasad dotyczących narzędzi i zawartości obszaru roboczego.

### `/context list`

```
🧠 Podział kontekstu
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Podział kontekstu (szczegółowy)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## Co wlicza się do okna kontekstu

Wlicza się wszystko, co otrzymuje model, w tym:

- System prompt (wszystkie sekcje).
- Historia rozmowy.
- Wywołania narzędzi + wyniki narzędzi.
- Załączniki/transkrypcje (obrazy/audio/pliki).
- Podsumowania Compaction i artefakty przycinania.
- „Wrappery” dostawcy lub ukryte nagłówki (niewidoczne, ale nadal liczone).

## Jak OpenClaw buduje system prompt

System prompt jest **własnością OpenClaw** i jest budowany od nowa przy każdym uruchomieniu. Zawiera:

- Listę narzędzi + krótkie opisy.
- Listę Skills (tylko metadane; patrz poniżej).
- Lokalizację obszaru roboczego.
- Czas (UTC + przeliczony czas użytkownika, jeśli skonfigurowano).
- Metadane środowiska uruchomieniowego (host/OS/model/thinking).
- Wstrzyknięte pliki bootstrap obszaru roboczego w sekcji **Project Context**.

Pełny podział: [System Prompt](/pl/concepts/system-prompt).

## Wstrzyknięte pliki obszaru roboczego (Project Context)

Domyślnie OpenClaw wstrzykuje stały zestaw plików obszaru roboczego (jeśli są obecne):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko przy pierwszym uruchomieniu)

Duże pliki są obcinane dla każdego pliku osobno zgodnie z `agents.defaults.bootstrapMaxChars` (domyślnie `12000` znaków). OpenClaw wymusza też łączny limit wstrzykiwania bootstrapu dla wszystkich plików przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie `60000` znaków). `/context` pokazuje rozmiary **raw vs injected** oraz informację, czy nastąpiło obcięcie.

Gdy dochodzi do obcięcia, środowisko uruchomieniowe może wstrzyknąć blok ostrzeżenia bezpośrednio do promptu w sekcji Project Context. Skonfigurujesz to przez `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; domyślnie `once`).

## Skills: wstrzykiwane vs ładowane na żądanie

System prompt zawiera zwartą **listę Skills** (nazwa + opis + lokalizacja). Ta lista ma realny narzut.

Instrukcje Skills _nie_ są domyślnie dołączane. Oczekuje się, że model odczyta `SKILL.md` danej Skills przez `read` **tylko wtedy, gdy będzie to potrzebne**.

## Narzędzia: są dwa rodzaje kosztów

Narzędzia wpływają na kontekst na dwa sposoby:

1. **Tekst listy narzędzi** w system promptcie (to, co widzisz jako „Tooling”).
2. **Schematy narzędzi** (JSON). Są wysyłane do modelu, aby mógł wywoływać narzędzia. Wliczają się do kontekstu, mimo że nie widzisz ich jako zwykłego tekstu.

`/context detail` pokazuje podział największych schematów narzędzi, dzięki czemu możesz zobaczyć, co dominuje.

## Polecenia, dyrektywy i „skróty inline”

Polecenia slash są obsługiwane przez Gateway. Występuje kilka różnych zachowań:

- **Polecenia samodzielne**: wiadomość, która zawiera tylko `/...`, jest uruchamiana jako polecenie.
- **Dyrektywy**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` są usuwane, zanim model zobaczy wiadomość.
  - Wiadomości zawierające tylko dyrektywy zapisują ustawienia sesji.
  - Dyrektywy inline w zwykłej wiadomości działają jako wskazówki dla pojedynczej wiadomości.
- **Skróty inline** (tylko nadawcy z allowlist): niektóre tokeny `/...` wewnątrz zwykłej wiadomości mogą uruchomić się natychmiast (przykład: „hej /status”) i są usuwane, zanim model zobaczy pozostały tekst.

Szczegóły: [Polecenia slash](/pl/tools/slash-commands).

## Sesje, Compaction i przycinanie (co jest zachowywane)

To, co pozostaje między wiadomościami, zależy od mechanizmu:

- **Zwykła historia** pozostaje w transkrypcji sesji, dopóki nie zostanie poddana Compaction/przycięciu zgodnie z polityką.
- **Compaction** zapisuje podsumowanie do transkrypcji i pozostawia nienaruszone ostatnie wiadomości.
- **Przycinanie** usuwa stare wyniki narzędzi z promptu _w pamięci_ dla danego uruchomienia, ale nie przepisuje transkrypcji.

Dokumentacja: [Sesja](/pl/concepts/session), [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning).

Domyślnie OpenClaw używa wbudowanego silnika kontekstu `legacy` do składania kontekstu i
Compaction. Jeśli zainstalujesz Plugin, który udostępnia `kind: "context-engine"` i
wybierzesz go przez `plugins.slots.contextEngine`, OpenClaw przekaże składanie
kontekstu, `/compact` oraz powiązane hooki cyklu życia kontekstu subagentów temu
silnikowi. `ownsCompaction: false` nie powoduje automatycznego powrotu do silnika
legacy; aktywny silnik nadal musi poprawnie implementować `compact()`. Zobacz
[Context Engine](/pl/concepts/context-engine), aby poznać pełny
interfejs z obsługą Plugin, hooki cyklu życia i konfigurację.

## Co faktycznie raportuje `/context`

`/context` preferuje najnowszy raport system promptu **zbudowanego podczas uruchomienia**, jeśli jest dostępny:

- `System prompt (run)` = przechwycony z ostatniego osadzonego uruchomienia (z obsługą narzędzi) i zapisany w magazynie sesji.
- `System prompt (estimate)` = obliczony na bieżąco, gdy nie istnieje raport z uruchomienia (albo przy uruchamianiu przez backend CLI, który nie generuje raportu).

W obu przypadkach raportuje rozmiary i głównych uczestników; **nie** wypisuje pełnego system promptu ani schematów narzędzi.

## Powiązane

- [Context Engine](/pl/concepts/context-engine) — niestandardowe wstrzykiwanie kontekstu przez Pluginy
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [System Prompt](/pl/concepts/system-prompt) — jak budowany jest system prompt
- [Agent Loop](/pl/concepts/agent-loop) — pełny cykl wykonywania agenta
