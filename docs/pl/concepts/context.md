---
read_when:
    - Chcesz zrozumieć, co oznacza „kontekst” w OpenClaw
    - Debugujesz, dlaczego model coś „wie” (albo o tym zapomniał)
    - Chcesz ograniczyć narzut kontekstu (/context, /status, /compact)
summary: 'Kontekst: co widzi model, jak jest tworzony i jak go sprawdzić'
title: Kontekst
x-i18n:
    generated_at: "2026-05-10T19:31:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

„Kontekst” to **wszystko, co OpenClaw wysyła do modelu na potrzeby uruchomienia**. Jest on ograniczony przez **okno kontekstu** modelu (limit tokenów).

Model mentalny dla początkujących:

- **Prompt systemowy** (zbudowany przez OpenClaw): reguły, narzędzia, lista Skills, czas/środowisko uruchomieniowe oraz wstrzyknięte pliki obszaru roboczego.
- **Historia rozmowy**: Twoje wiadomości + wiadomości asystenta w tej sesji.
- **Wywołania/wyniki narzędzi + załączniki**: dane wyjściowe poleceń, odczyty plików, obrazy/audio itd.

Kontekst to _nie to samo_ co „pamięć”: pamięć może być przechowywana na dysku i ponownie załadowana później; kontekst to to, co znajduje się w bieżącym oknie modelu.

## Szybki start (inspekcja kontekstu)

- `/status` → szybki widok „jak zapełnione jest moje okno?” + ustawienia sesji.
- `/context list` → co jest wstrzyknięte + przybliżone rozmiary (dla każdego pliku + sumy).
- `/context detail` → głębszy podział: rozmiary dla każdego pliku, schematów narzędzi, wpisów Skills oraz rozmiar promptu systemowego.
- `/context map` → obraz mapy drzewa w stylu WinDirStat dla śledzonych składników kontekstu bieżącej sesji.
- `/usage tokens` → dodaje do zwykłych odpowiedzi stopkę użycia dla każdej odpowiedzi.
- `/compact` → podsumowuje starszą historię w kompaktowy wpis, aby zwolnić miejsce w oknie.

Zobacz także: [Polecenia slash](/pl/tools/slash-commands), [Użycie tokenów i koszty](/pl/reference/token-use), [Compaction](/pl/concepts/compaction).

## Przykładowe dane wyjściowe

Wartości różnią się zależnie od modelu, dostawcy, polityki narzędzi i zawartości obszaru roboczego.

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

Wysyła obraz wygenerowany z najnowszego buforowanego raportu uruchomienia. Zanim zwykła wiadomość utworzy raport uruchomienia w sesji, `/context map` zwraca komunikat o niedostępności zamiast renderować oszacowanie. Pole prostokąta jest proporcjonalne do śledzonych znaków promptu:

- wstrzyknięte pliki obszaru roboczego
- podstawowy tekst promptu systemowego
- wpisy promptu Skills
- schematy JSON narzędzi

`/context list`, `/context detail` i `/context json` nadal mogą sprawdzić oszacowanie na żądanie, gdy nie ma buforowanego raportu uruchomienia.

## Co wlicza się do okna kontekstu

Liczy się wszystko, co otrzymuje model, w tym:

- Prompt systemowy (wszystkie sekcje).
- Historia rozmowy.
- Wywołania narzędzi + wyniki narzędzi.
- Załączniki/transkrypty (obrazy/audio/pliki).
- Podsumowania Compaction i artefakty przycinania.
- „Wrappery” dostawcy lub ukryte nagłówki (niewidoczne, ale nadal liczone).

## Jak OpenClaw buduje prompt systemowy

Prompt systemowy jest **własnością OpenClaw** i jest przebudowywany przy każdym uruchomieniu. Obejmuje:

- Listę narzędzi + krótkie opisy.
- Listę Skills (tylko metadane; zobacz niżej).
- Lokalizację obszaru roboczego.
- Czas (UTC + przeliczony czas użytkownika, jeśli skonfigurowano).
- Metadane środowiska uruchomieniowego (host/OS/model/thinking).
- Wstrzyknięte pliki startowe obszaru roboczego w sekcji **Project Context**.

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

Duże pliki są obcinane osobno dla każdego pliku z użyciem `agents.defaults.bootstrapMaxChars` (domyślnie `12000` znaków). OpenClaw wymusza też łączny limit wstrzykiwania bootstrap dla wszystkich plików przy użyciu `agents.defaults.bootstrapTotalMaxChars` (domyślnie `60000` znaków). `/context` pokazuje rozmiary **surowe vs wstrzyknięte** oraz informację, czy nastąpiło obcięcie.

Gdy nastąpi obcięcie, środowisko uruchomieniowe może wstrzyknąć blok ostrzeżenia wewnątrz promptu pod Project Context. Skonfiguruj to za pomocą `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; domyślnie `once`).

## Skills: wstrzyknięte vs ładowane na żądanie

Prompt systemowy zawiera kompaktową **listę Skills** (nazwa + opis + lokalizacja). Ta lista ma rzeczywisty narzut.

Instrukcje Skills _nie_ są domyślnie uwzględniane. Oczekuje się, że model wykona `read` pliku `SKILL.md` danej Skills **tylko wtedy, gdy jest potrzebny**.

## Narzędzia: są dwa koszty

Narzędzia wpływają na kontekst na dwa sposoby:

1. **Tekst listy narzędzi** w prompcie systemowym (to, co widzisz jako „Tooling”).
2. **Schematy narzędzi** (JSON). Są wysyłane do modelu, aby mógł wywoływać narzędzia. Wliczają się do kontekstu, mimo że nie widzisz ich jako zwykłego tekstu.

`/context detail` rozbija największe schematy narzędzi, aby było widać, co dominuje.

## Polecenia, dyrektywy i „skróty inline”

Polecenia slash są obsługiwane przez Gateway. Istnieje kilka różnych zachowań:

- **Samodzielne polecenia**: wiadomość, która zawiera tylko `/...`, uruchamia się jako polecenie.
- **Dyrektywy**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` są usuwane, zanim model zobaczy wiadomość.
  - Wiadomości zawierające tylko dyrektywy utrwalają ustawienia sesji.
  - Dyrektywy inline w zwykłej wiadomości działają jako wskazówki dla pojedynczej wiadomości.
- **Skróty inline** (tylko nadawcy z listy dozwolonych): określone tokeny `/...` wewnątrz zwykłej wiadomości mogą zostać uruchomione natychmiast (przykład: „hej /status”) i są usuwane, zanim model zobaczy pozostały tekst.

Szczegóły: [Polecenia slash](/pl/tools/slash-commands).

## Sesje, Compaction i przycinanie (co jest utrwalane)

To, co utrzymuje się między wiadomościami, zależy od mechanizmu:

- **Zwykła historia** utrzymuje się w transkrypcie sesji, dopóki nie zostanie objęta Compaction/przycięta przez politykę.
- **Compaction** zapisuje podsumowanie w transkrypcie i pozostawia ostatnie wiadomości bez zmian.
- **Przycinanie** usuwa stare wyniki narzędzi z promptu _w pamięci_, aby zwolnić miejsce w oknie kontekstu, ale nie przepisuje transkryptu sesji - pełna historia nadal jest dostępna do inspekcji na dysku.

Dokumentacja: [Sesja](/pl/concepts/session), [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning).

Domyślnie OpenClaw używa wbudowanego silnika kontekstu `legacy` do składania i
Compaction. Jeśli zainstalujesz Plugin, który udostępnia `kind: "context-engine"` i
wybierzesz go za pomocą `plugins.slots.contextEngine`, OpenClaw przekaże składanie
kontekstu, `/compact` oraz powiązane haki cyklu życia kontekstu subagentów do tego
silnika. `ownsCompaction: false` nie powoduje automatycznego powrotu do silnika
legacy; aktywny silnik nadal musi poprawnie implementować `compact()`. Zobacz
[Silnik kontekstu](/pl/concepts/context-engine), aby poznać pełny
interfejs rozszerzalny przez Plugin, haki cyklu życia i konfigurację.

## Co `/context` faktycznie raportuje

`/context` preferuje najnowszy raport promptu systemowego **zbudowany podczas uruchomienia**, jeśli jest dostępny:

- `System prompt (run)` = przechwycony z ostatniego osadzonego uruchomienia (obsługującego narzędzia) i utrwalony w magazynie sesji.
- `System prompt (estimate)` = obliczany w locie, gdy nie istnieje raport uruchomienia (lub podczas pracy przez backend CLI, który nie generuje raportu).

W obu przypadkach raportuje rozmiary i główne źródła narzutu; **nie** zrzuca pełnego promptu systemowego ani schematów narzędzi.

## Powiązane

<CardGroup cols={2}>
  <Card title="Silnik kontekstu" href="/pl/concepts/context-engine" icon="puzzle-piece">
    Niestandardowe wstrzykiwanie kontekstu przez plugins.
  </Card>
  <Card title="Compaction" href="/pl/concepts/compaction" icon="compress">
    Podsumowywanie długich rozmów, aby utrzymać je wewnątrz okna modelu.
  </Card>
  <Card title="Prompt systemowy" href="/pl/concepts/system-prompt" icon="message-lines">
    Jak budowany jest prompt systemowy i co wstrzykuje w każdej turze.
  </Card>
  <Card title="Pętla agenta" href="/pl/concepts/agent-loop" icon="arrows-rotate">
    Pełny cykl wykonywania agenta od wiadomości przychodzącej do końcowej odpowiedzi.
  </Card>
</CardGroup>
