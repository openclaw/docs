---
read_when:
    - Chcesz zrozumieć, co oznacza „kontekst” w OpenClaw
    - Debugujesz, dlaczego model coś „wie” (albo o czymś zapomniał)
    - Chcesz zmniejszyć narzut kontekstu (`/context`, `/status`, `/compact`)
summary: 'Kontekst: co widzi model, jak jest budowany i jak go sprawdzić'
title: Kontekst
x-i18n:
    generated_at: "2026-04-07T09:44:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Kontekst

„Kontekst” to **wszystko, co OpenClaw wysyła do modelu dla danego uruchomienia**. Jest ograniczony przez **okno kontekstu** modelu (limit tokenów).

Prosty model mentalny dla początkujących:

- **System prompt** (budowany przez OpenClaw): reguły, narzędzia, lista Skills, czas/runtime i wstrzyknięte pliki obszaru roboczego.
- **Historia rozmowy**: Twoje wiadomości + wiadomości asystenta dla tej sesji.
- **Wywołania/wyniki narzędzi + załączniki**: dane wyjściowe poleceń, odczyty plików, obrazy/audio itp.

Kontekst _to nie to samo_ co „pamięć”: pamięć może być przechowywana na dysku i później ponownie wczytana; kontekst to to, co znajduje się w bieżącym oknie modelu.

## Szybki start (sprawdzanie kontekstu)

- `/status` → szybki widok „jak bardzo zapełnione jest moje okno?” + ustawienia sesji.
- `/context list` → co jest wstrzyknięte + przybliżone rozmiary (na plik + sumy).
- `/context detail` → bardziej szczegółowy podział: rozmiary per plik, per schemat narzędzia, per wpis Skills i rozmiar system promptu.
- `/usage tokens` → dodaje stopkę z użyciem do zwykłych odpowiedzi.
- `/compact` → podsumowuje starszą historię do zwartego wpisu, aby zwolnić miejsce w oknie.

Zobacz też: [Polecenia slash](/pl/tools/slash-commands), [Użycie tokenów i koszty](/pl/reference/token-use), [Kompaktowanie](/pl/concepts/compaction).

## Przykładowe dane wyjściowe

Wartości różnią się w zależności od modelu, dostawcy, zasad dotyczących narzędzi i tego, co znajduje się w Twoim obszarze roboczym.

### `/context list`

```
🧠 Podział kontekstu
Obszar roboczy: <workspaceDir>
Maks. bootstrap/plik: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (uruchomienie): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Wstrzyknięte pliki obszaru roboczego:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Lista Skills (tekst system promptu): 2,184 chars (~546 tok) (12 skills)
Narzędzia: read, edit, write, exec, process, browser, message, sessions_send, …
Lista narzędzi (tekst system promptu): 1,032 chars (~258 tok)
Schematy narzędzi (JSON): 31,988 chars (~7,997 tok) (wlicza się do kontekstu; nie jest pokazywane jako tekst)
Narzędzia: (takie same jak powyżej)

Tokeny sesji (z cache): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Podział kontekstu (szczegółowy)
…
Największe Skills (rozmiar wpisu w prompcie):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Największe narzędzia (rozmiar schematu):
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
- Podsumowania kompaktowania i artefakty przycinania.
- „Wrappery” dostawcy lub ukryte nagłówki (niewidoczne, ale nadal wliczane).

## Jak OpenClaw buduje system prompt

System prompt jest **własnością OpenClaw** i jest przebudowywany przy każdym uruchomieniu. Zawiera:

- Listę narzędzi + krótkie opisy.
- Listę Skills (tylko metadane; zobacz niżej).
- Lokalizację obszaru roboczego.
- Czas (UTC + przeliczony czas użytkownika, jeśli skonfigurowano).
- Metadane runtime (host/OS/model/thinking).
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

Duże pliki są przycinane per plik za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie `20000` znaków). OpenClaw wymusza też łączny limit wstrzyknięcia bootstrap dla wszystkich plików przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie `150000` znaków). `/context` pokazuje rozmiary **raw vs injected** oraz informację, czy nastąpiło przycięcie.

Gdy dochodzi do przycięcia, runtime może wstrzyknąć blok ostrzeżenia wewnątrz promptu w sekcji Project Context. Skonfigurujesz to przez `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; domyślnie `once`).

## Skills: wstrzykiwane vs wczytywane na żądanie

System prompt zawiera zwięzłą **listę Skills** (nazwa + opis + lokalizacja). Ta lista ma realny narzut.

Instrukcje Skills _nie_ są domyślnie dołączane. Model ma użyć `read` do odczytu `SKILL.md` danego Skill **tylko wtedy, gdy jest to potrzebne**.

## Narzędzia: są dwa koszty

Narzędzia wpływają na kontekst na dwa sposoby:

1. **Tekst listy narzędzi** w system promcie (to, co widzisz jako „Tooling”).
2. **Schematy narzędzi** (JSON). Są wysyłane do modelu, aby mógł wywoływać narzędzia. Wliczają się do kontekstu, mimo że nie widzisz ich jako zwykłego tekstu.

`/context detail` pokazuje podział największych schematów narzędzi, dzięki czemu możesz zobaczyć, co dominuje.

## Polecenia, dyrektywy i „skróty inline”

Polecenia slash są obsługiwane przez Gateway. Występuje kilka różnych zachowań:

- **Polecenia samodzielne**: wiadomość zawierająca tylko `/...` jest wykonywana jako polecenie.
- **Dyrektywy**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` są usuwane, zanim model zobaczy wiadomość.
  - Wiadomości zawierające tylko dyrektywę zapisują ustawienia sesji.
  - Dyrektywy inline w zwykłej wiadomości działają jako wskazówki dla pojedynczej wiadomości.
- **Skróty inline** (tylko nadawcy z allowlist): niektóre tokeny `/...` wewnątrz zwykłej wiadomości mogą zostać wykonane od razu (przykład: „hej /status”) i są usuwane, zanim model zobaczy pozostały tekst.

Szczegóły: [Polecenia slash](/pl/tools/slash-commands).

## Sesje, kompaktowanie i przycinanie (co się utrzymuje)

To, co utrzymuje się między wiadomościami, zależy od mechanizmu:

- **Zwykła historia** utrzymuje się w transkrypcie sesji, dopóki nie zostanie skompaktowana/przycięta zgodnie z zasadami.
- **Kompaktowanie** zapisuje podsumowanie do transkryptu i zachowuje ostatnie wiadomości bez zmian.
- **Przycinanie** usuwa stare wyniki narzędzi z promptu _w pamięci_ dla danego uruchomienia, ale nie przepisuje transkryptu.

Dokumentacja: [Sesja](/pl/concepts/session), [Kompaktowanie](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning).

Domyślnie OpenClaw używa wbudowanego silnika kontekstu `legacy` do składania
i kompaktowania. Jeśli zainstalujesz plugin, który udostępnia `kind: "context-engine"` i
wybierzesz go przez `plugins.slots.contextEngine`, OpenClaw deleguje składanie kontekstu,
`/compact` oraz powiązane hooki cyklu życia kontekstu subagenta do tego
silnika. `ownsCompaction: false` nie powoduje automatycznego fallbacku do silnika
legacy; aktywny silnik nadal musi poprawnie implementować `compact()`. Zobacz
[Context Engine](/pl/concepts/context-engine), aby poznać pełny
interfejs rozszerzalny, hooki cyklu życia i konfigurację.

## Co faktycznie raportuje `/context`

`/context` preferuje najnowszy raport system promptu **zbudowanego dla uruchomienia**, gdy jest dostępny:

- `System prompt (run)` = przechwycony z ostatniego uruchomienia osadzonego (z obsługą narzędzi) i zapisany w magazynie sesji.
- `System prompt (estimate)` = obliczony na bieżąco, gdy nie istnieje raport z uruchomienia (lub podczas działania przez backend CLI, który nie generuje raportu).

W obu przypadkach raportuje rozmiary i największe składowe; **nie** wypisuje pełnego system promptu ani schematów narzędzi.

## Powiązane

- [Context Engine](/pl/concepts/context-engine) — niestandardowe wstrzykiwanie kontekstu przez pluginy
- [Kompaktowanie](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [System Prompt](/pl/concepts/system-prompt) — jak budowany jest system prompt
- [Pętla agenta](/pl/concepts/agent-loop) — pełny cykl wykonywania agenta
