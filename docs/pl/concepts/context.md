---
read_when:
    - Chcesz zrozumieć, co oznacza „kontekst” w OpenClaw
    - Debugujesz, dlaczego model coś „wie” (albo o tym zapomniał)
    - Chcesz zmniejszyć narzut kontekstu (/context, /status, /compact)
summary: 'Kontekst: co widzi model, jak jest tworzony i jak go sprawdzać'
title: Kontekst
x-i18n:
    generated_at: "2026-06-27T17:25:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

„Kontekst” to **wszystko, co OpenClaw wysyła do modelu dla danego uruchomienia**. Jest ograniczony przez **okno kontekstu** modelu (limit tokenów).

Model mentalny dla początkujących:

- **Prompt systemowy** (zbudowany przez OpenClaw): reguły, narzędzia, lista Skills, czas/środowisko uruchomieniowe oraz wstrzyknięte pliki obszaru roboczego.
- **Historia rozmowy**: Twoje wiadomości + wiadomości asystenta w tej sesji.
- **Wywołania/wyniki narzędzi + załączniki**: wynik poleceń, odczyty plików, obrazy/audio itd.

Kontekst to _nie to samo_ co „pamięć”: pamięć może być przechowywana na dysku i wczytywana później; kontekst to to, co znajduje się w bieżącym oknie modelu.

## Szybki start (sprawdzanie kontekstu)

- `/status` → szybki widok „jak pełne jest moje okno?” + ustawienia sesji.
- `/context list` → co jest wstrzyknięte + przybliżone rozmiary (na plik + sumy).
- `/context detail` → głębszy podział: rozmiary na plik, schematy narzędzi, wpisy Skills, rozmiar promptu systemowego oraz liczby wiadomości transkryptu możliwych do kompaktowania.
- `/context map` → obraz mapy drzewa w stylu WinDirStat przedstawiający śledzone źródła bieżącego kontekstu sesji.
- `/usage tokens` → dodaje stopkę użycia dla każdej odpowiedzi do zwykłych odpowiedzi.
- `/compact` → streszcza starszą historię do kompaktowego wpisu, aby zwolnić miejsce w oknie.

Zobacz także: [Polecenia ukośnikowe](/pl/tools/slash-commands), [Użycie tokenów i koszty](/pl/reference/token-use), [Compaction](/pl/concepts/compaction).

## Przykładowy wynik

Wartości różnią się zależnie od modelu, providera, zasad narzędzi i zawartości obszaru roboczego.

### `/context list`

```
🧠 Context breakdown
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
🧠 Context breakdown (detailed)
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

### `/context map`

Wysyła obraz wygenerowany z najnowszego buforowanego raportu uruchomienia. Zanim zwykła wiadomość wygeneruje raport uruchomienia w sesji, `/context map` zwraca komunikat o niedostępności zamiast renderować szacunek. Powierzchnia prostokąta jest proporcjonalna do śledzonych znaków promptu:

- wstrzyknięte pliki obszaru roboczego
- bazowy tekst promptu systemowego
- wpisy promptów Skills
- schematy JSON narzędzi

`/context list`, `/context detail` i `/context json` nadal mogą sprawdzać szacunek na żądanie, gdy żaden raport uruchomienia nie jest zbuforowany.

## Co wlicza się do okna kontekstu

Liczy się wszystko, co otrzymuje model, w tym:

- Prompt systemowy (wszystkie sekcje).
- Historia rozmowy.
- Wywołania narzędzi + wyniki narzędzi.
- Załączniki/transkrypty (obrazy/audio/pliki).
- Podsumowania Compaction i artefakty przycinania.
- „Opakowania” providera lub ukryte nagłówki (niewidoczne, ale nadal liczone).

## Jak OpenClaw buduje prompt systemowy

Prompt systemowy jest **własnością OpenClaw** i jest przebudowywany przy każdym uruchomieniu. Zawiera:

- Listę narzędzi + krótkie opisy.
- Listę Skills (tylko metadane; patrz niżej).
- Lokalizację obszaru roboczego.
- Czas (UTC + przeliczony czas użytkownika, jeśli skonfigurowano).
- Metadane środowiska uruchomieniowego (host/OS/model/myślenie).
- Wstrzyknięte pliki bootstrap obszaru roboczego pod **Project Context**.

Pełny podział: [Prompt systemowy](/pl/concepts/system-prompt).

## Wstrzyknięte pliki obszaru roboczego (Project Context)

Domyślnie OpenClaw wstrzykuje stały zestaw plików obszaru roboczego (jeśli istnieją):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko przy pierwszym uruchomieniu)

Duże pliki są obcinane osobno dla każdego pliku przy użyciu `agents.defaults.bootstrapMaxChars` (domyślnie `20000` znaków). OpenClaw egzekwuje też łączny limit wstrzyknięcia bootstrap dla wszystkich plików przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie `60000` znaków). `/context` pokazuje rozmiary **surowe vs wstrzyknięte** oraz czy doszło do obcięcia.

Gdy dochodzi do obcięcia, środowisko uruchomieniowe może wstrzyknąć blok ostrzeżenia w prompcie pod Project Context. Skonfiguruj to za pomocą `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; domyślnie `always`).

## Skills: wstrzyknięte vs ładowane na żądanie

Prompt systemowy zawiera kompaktową **listę Skills** (nazwa + opis + lokalizacja). Ta lista ma rzeczywisty narzut.

Instrukcje Skills _nie_ są domyślnie uwzględniane. Model powinien `read` plik `SKILL.md` danej Skills **tylko wtedy, gdy jest potrzebny**.

## Narzędzia: są dwa koszty

Narzędzia wpływają na kontekst na dwa sposoby:

1. **Tekst listy narzędzi** w prompcie systemowym (to, co widzisz jako „Tooling”).
2. **Schematy narzędzi** (JSON). Są wysyłane do modelu, aby mógł wywoływać narzędzia. Wliczają się do kontekstu, mimo że nie widzisz ich jako zwykłego tekstu.

`/context detail` rozbija największe schematy narzędzi, aby pokazać, co dominuje.

## Polecenia, dyrektywy i „skróty inline”

Polecenia ukośnikowe są obsługiwane przez Gateway. Istnieje kilka różnych zachowań:

- **Polecenia samodzielne**: wiadomość zawierająca tylko `/...` uruchamia się jako polecenie.
- **Dyrektywy**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` są usuwane, zanim model zobaczy wiadomość.
  - Wiadomości zawierające tylko dyrektywę utrwalają ustawienia sesji.
  - Dyrektywy inline w zwykłej wiadomości działają jako wskazówki dla tej jednej wiadomości.
- **Skróty inline** (tylko nadawcy z listy dozwolonych): niektóre tokeny `/...` wewnątrz zwykłej wiadomości mogą uruchomić się natychmiast (przykład: „hej /status”) i są usuwane, zanim model zobaczy pozostały tekst.

Szczegóły: [Polecenia ukośnikowe](/pl/tools/slash-commands).

## Sesje, Compaction i przycinanie (co jest utrwalane)

To, co utrzymuje się między wiadomościami, zależy od mechanizmu:

- **Zwykła historia** utrzymuje się w transkrypcie sesji, dopóki nie zostanie skompaktowana/przycięta zgodnie z zasadami.
- **Compaction** utrwala podsumowanie w transkrypcie i zachowuje ostatnie wiadomości bez zmian.
- **Przycinanie** usuwa stare wyniki narzędzi z promptu _w pamięci_, aby zwolnić miejsce w oknie kontekstu, ale nie przepisuje transkryptu sesji - pełna historia nadal jest dostępna do sprawdzenia na dysku.

Dokumentacja: [Sesja](/pl/concepts/session), [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning).

Domyślnie OpenClaw używa wbudowanego silnika kontekstu `legacy` do składania i
Compaction. Jeśli zainstalujesz plugin, który udostępnia `kind: "context-engine"` i
wybierzesz go za pomocą `plugins.slots.contextEngine`, OpenClaw deleguje składanie
kontekstu, `/compact` oraz powiązane haki cyklu życia kontekstu subagentów do tego
silnika. `ownsCompaction: false` nie powoduje automatycznego powrotu do silnika
legacy; aktywny silnik nadal musi poprawnie implementować `compact()`. Zobacz
[Silnik kontekstu](/pl/concepts/context-engine), aby poznać pełny
interfejs rozszerzalny przez pluginy, haki cyklu życia i konfigurację.

## Co faktycznie raportuje `/context`

`/context` preferuje najnowszy raport promptu systemowego **zbudowany podczas uruchomienia**, gdy jest dostępny:

- `System prompt (run)` = przechwycony z ostatniego osadzonego uruchomienia (zdolnego do używania narzędzi) i utrwalony w magazynie sesji.
- `System prompt (estimate)` = obliczany w locie, gdy nie istnieje raport uruchomienia (lub podczas działania przez backend CLI, który nie generuje raportu).

W obu przypadkach raportuje rozmiary i największe źródła; **nie** zrzuca pełnego promptu systemowego ani schematów narzędzi. W trybie szczegółowym porównuje też transkrypt sesji z tym samym predykatem wiadomości prawdziwej rozmowy, którego używa Compaction, dzięki czemu łatwiej odróżnić wysokie użycie promptu/cache od historii rozmowy możliwej do kompaktowania.

## Powiązane

<CardGroup cols={2}>
  <Card title="Silnik kontekstu" href="/pl/concepts/context-engine" icon="puzzle-piece">
    Niestandardowe wstrzykiwanie kontekstu przez pluginy.
  </Card>
  <Card title="Compaction" href="/pl/concepts/compaction" icon="compress">
    Streszczanie długich rozmów, aby utrzymać je w oknie modelu.
  </Card>
  <Card title="Prompt systemowy" href="/pl/concepts/system-prompt" icon="message-lines">
    Jak budowany jest prompt systemowy i co wstrzykuje w każdej turze.
  </Card>
  <Card title="Pętla agenta" href="/pl/concepts/agent-loop" icon="arrows-rotate">
    Pełny cykl wykonania agenta od wiadomości przychodzącej do końcowej odpowiedzi.
  </Card>
</CardGroup>
