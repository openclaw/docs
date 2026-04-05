---
read_when:
    - Chcesz zrozumieć, co oznacza „kontekst” w OpenClaw
    - Debugujesz, dlaczego model coś „wie” (albo o tym zapomniał)
    - Chcesz zmniejszyć narzut kontekstu (`/context`, `/status`, `/compact`)
summary: 'Kontekst: co widzi model, jak jest budowany i jak go sprawdzić'
title: Kontekst
x-i18n:
    generated_at: "2026-04-05T13:50:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Kontekst

„Kontekst” to **wszystko, co OpenClaw wysyła do modelu dla danego uruchomienia**. Jest on ograniczony przez **okno kontekstu** modelu (limit tokenów).

Model mentalny dla początkujących:

- **System prompt** (budowany przez OpenClaw): reguły, narzędzia, lista Skills, czas/środowisko uruchomieniowe i wstrzyknięte pliki obszaru roboczego.
- **Historia rozmowy**: Twoje wiadomości i wiadomości asystenta dla tej sesji.
- **Wywołania/wyniki narzędzi + załączniki**: wyjście poleceń, odczyty plików, obrazy/audio itp.

Kontekst _to nie to samo_ co „pamięć”: pamięć może być zapisana na dysku i wczytana później; kontekst to to, co znajduje się w bieżącym oknie modelu.

## Szybki start (sprawdzanie kontekstu)

- `/status` → szybki widok „jak bardzo zapełnione jest moje okno?” + ustawienia sesji.
- `/context list` → co jest wstrzyknięte + przybliżone rozmiary (na plik + sumy).
- `/context detail` → bardziej szczegółowy podział: na plik, rozmiary schematów poszczególnych narzędzi, rozmiary wpisów poszczególnych Skills i rozmiar system prompt.
- `/usage tokens` → dodaje stopkę użycia dla każdej odpowiedzi do zwykłych odpowiedzi.
- `/compact` → podsumowuje starszą historię do zwartego wpisu, aby zwolnić miejsce w oknie.

Zobacz też: [Polecenia slash](/tools/slash-commands), [Użycie tokenów i koszty](/reference/token-use), [Kompakcja](/concepts/compaction).

## Przykładowe dane wyjściowe

Wartości różnią się w zależności od modelu, dostawcy, zasad narzędzi i tego, co znajduje się w Twoim obszarze roboczym.

### `/context list`

```
🧠 Podział kontekstu
Obszar roboczy: <workspaceDir>
Maks. bootstrap/plik: 20,000 znaków
Sandbox: mode=non-main sandboxed=false
System prompt (uruchomienie): 38,412 znaków (~9,603 tok) (Kontekst projektu 23,901 znaków (~5,976 tok))

Wstrzyknięte pliki obszaru roboczego:
- AGENTS.md: OK | surowe 1,742 znaki (~436 tok) | wstrzyknięte 1,742 znaki (~436 tok)
- SOUL.md: OK | surowe 912 znaków (~228 tok) | wstrzyknięte 912 znaków (~228 tok)
- TOOLS.md: PRZYCIĘTE | surowe 54,210 znaków (~13,553 tok) | wstrzyknięte 20,962 znaków (~5,241 tok)
- IDENTITY.md: OK | surowe 211 znaków (~53 tok) | wstrzyknięte 211 znaków (~53 tok)
- USER.md: OK | surowe 388 znaków (~97 tok) | wstrzyknięte 388 znaków (~97 tok)
- HEARTBEAT.md: BRAK | surowe 0 | wstrzyknięte 0
- BOOTSTRAP.md: OK | surowe 0 znaków (~0 tok) | wstrzyknięte 0 znaków (~0 tok)

Lista Skills (tekst system prompt): 2,184 znaki (~546 tok) (12 Skills)
Narzędzia: read, edit, write, exec, process, browser, message, sessions_send, …
Lista narzędzi (tekst system prompt): 1,032 znaki (~258 tok)
Schematy narzędzi (JSON): 31,988 znaków (~7,997 tok) (liczą się do kontekstu; nie są pokazane jako tekst)
Narzędzia: (takie same jak powyżej)

Tokeny sesji (z cache): 14,250 łącznie / ctx=32,000
```

### `/context detail`

```
🧠 Podział kontekstu (szczegółowy)
…
Największe Skills (rozmiar wpisu prompt):
- frontend-design: 412 znaków (~103 tok)
- oracle: 401 znaków (~101 tok)
… (+10 kolejnych Skills)

Największe narzędzia (rozmiar schematu):
- browser: 9,812 znaków (~2,453 tok)
- exec: 6,240 znaków (~1,560 tok)
… (+N kolejnych narzędzi)
```

## Co liczy się do okna kontekstu

Liczy się wszystko, co otrzymuje model, w tym:

- System prompt (wszystkie sekcje).
- Historia rozmowy.
- Wywołania narzędzi + wyniki narzędzi.
- Załączniki/transkrypcje (obrazy/audio/pliki).
- Podsumowania kompakcji i artefakty przycinania.
- „Wrappery” dostawcy lub ukryte nagłówki (niewidoczne, ale nadal liczone).

## Jak OpenClaw buduje system prompt

System prompt jest **własnością OpenClaw** i jest przebudowywany przy każdym uruchomieniu. Obejmuje:

- Listę narzędzi + krótkie opisy.
- Listę Skills (tylko metadane; patrz niżej).
- Lokalizację obszaru roboczego.
- Czas (UTC + przeliczony czas użytkownika, jeśli skonfigurowano).
- Metadane środowiska uruchomieniowego (host/OS/model/myślenie).
- Wstrzyknięte pliki bootstrap obszaru roboczego w sekcji **Kontekst projektu**.

Pełny podział: [System Prompt](/concepts/system-prompt).

## Wstrzyknięte pliki obszaru roboczego (Kontekst projektu)

Domyślnie OpenClaw wstrzykuje stały zestaw plików obszaru roboczego (jeśli istnieją):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko przy pierwszym uruchomieniu)

Duże pliki są przycinane osobno dla każdego pliku przy użyciu `agents.defaults.bootstrapMaxChars` (domyślnie `20000` znaków). OpenClaw wymusza też łączny limit wstrzykiwania bootstrap dla wszystkich plików za pomocą `agents.defaults.bootstrapTotalMaxChars` (domyślnie `150000` znaków). `/context` pokazuje rozmiary **surowe vs wstrzyknięte** oraz to, czy nastąpiło przycięcie.

Gdy następuje przycięcie, środowisko uruchomieniowe może wstrzyknąć do prompt blok ostrzeżenia w sekcji Kontekst projektu. Skonfigurujesz to za pomocą `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; domyślnie `once`).

## Skills: wstrzykiwane vs ładowane na żądanie

System prompt zawiera zwięzłą **listę Skills** (nazwa + opis + lokalizacja). Ta lista ma realny narzut.

Instrukcje Skills _nie_ są domyślnie dołączane. Oczekuje się, że model odczyta `SKILL.md` danego skilla za pomocą `read` **tylko wtedy, gdy jest to potrzebne**.

## Narzędzia: są dwa koszty

Narzędzia wpływają na kontekst na dwa sposoby:

1. **Tekst listy narzędzi** w system prompt (to, co widzisz jako „Tooling”).
2. **Schematy narzędzi** (JSON). Są wysyłane do modelu, aby mógł wywoływać narzędzia. Liczą się do kontekstu, mimo że nie widzisz ich jako zwykłego tekstu.

`/context detail` pokazuje podział największych schematów narzędzi, aby było widać, co dominuje.

## Polecenia, dyrektywy i „skróty inline”

Polecenia slash są obsługiwane przez Gateway. Istnieje kilka różnych zachowań:

- **Samodzielne polecenia**: wiadomość zawierająca wyłącznie `/...` jest uruchamiana jako polecenie.
- **Dyrektywy**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` są usuwane, zanim model zobaczy wiadomość.
  - Wiadomości zawierające tylko dyrektywy utrwalają ustawienia sesji.
  - Dyrektywy inline w zwykłej wiadomości działają jako wskazówki tylko dla tej wiadomości.
- **Skróty inline** (tylko dla nadawców z listy dozwolonych): niektóre tokeny `/...` wewnątrz zwykłej wiadomości mogą zostać uruchomione od razu (przykład: „hey /status”) i są usuwane, zanim model zobaczy pozostały tekst.

Szczegóły: [Polecenia slash](/tools/slash-commands).

## Sesje, kompakcja i przycinanie (co jest utrwalane)

To, co jest utrwalane między wiadomościami, zależy od mechanizmu:

- **Zwykła historia** jest utrwalana w transkrypcji sesji, dopóki nie zostanie skompaktowana/przycięta zgodnie z zasadami.
- **Kompakcja** utrwala podsumowanie w transkrypcji i zachowuje nienaruszone ostatnie wiadomości.
- **Przycinanie** usuwa stare wyniki narzędzi z prompt _w pamięci_ dla danego uruchomienia, ale nie przepisuje transkrypcji.

Dokumentacja: [Sesja](/concepts/session), [Kompakcja](/concepts/compaction), [Przycinanie sesji](/concepts/session-pruning).

Domyślnie OpenClaw używa wbudowanego silnika kontekstu `legacy` do składania i
kompakcji. Jeśli zainstalujesz plugin, który udostępnia `kind: "context-engine"` i
wybierzesz go za pomocą `plugins.slots.contextEngine`, OpenClaw deleguje
składanie kontekstu, `/compact` i powiązane hooki cyklu życia kontekstu subagenta
do tego silnika. `ownsCompaction: false` nie powoduje automatycznego powrotu do silnika
legacy; aktywny silnik nadal musi poprawnie implementować `compact()`. Zobacz
[Context Engine](/concepts/context-engine), aby poznać pełny
interfejs rozszerzalny przez pluginy, hooki cyklu życia i konfigurację.

## Co faktycznie raportuje `/context`

`/context` preferuje najnowszy raport system prompt **zbudowany przy uruchomieniu**, jeśli jest dostępny:

- `System prompt (run)` = przechwycone z ostatniego osadzonego uruchomienia (z obsługą narzędzi) i zapisane w magazynie sesji.
- `System prompt (estimate)` = obliczane na bieżąco, gdy nie istnieje raport z uruchomienia (lub podczas działania przez backend CLI, który nie generuje raportu).

W obu przypadkach raportuje rozmiary i największe składowe; **nie** wypisuje pełnego system prompt ani schematów narzędzi.

## Powiązane

- [Context Engine](/concepts/context-engine) — niestandardowe wstrzykiwanie kontekstu przez pluginy
- [Kompakcja](/concepts/compaction) — podsumowywanie długich rozmów
- [System Prompt](/concepts/system-prompt) — jak budowany jest system prompt
- [Pętla agenta](/concepts/agent-loop) — pełny cykl wykonywania agenta
