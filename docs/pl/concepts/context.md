---
read_when:
    - Chcesz zrozumieć, co oznacza „kontekst” w OpenClaw
    - Debugujesz, dlaczego model „wie” coś (albo o czymś zapomniał)
    - Chcesz zmniejszyć narzut kontekstu (`/context`, `/status`, `/compact`)
summary: 'Kontekst: co widzi model, jak jest budowany i jak go sprawdzić'
title: Kontekst
x-i18n:
    generated_at: "2026-04-24T09:05:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

„Kontekst” to **wszystko, co OpenClaw wysyła do modelu na potrzeby jednego uruchomienia**. Jest ograniczony przez **okno kontekstowe** modelu (limit tokenów).

Model mentalny dla początkujących:

- **Prompt systemowy** (budowany przez OpenClaw): reguły, narzędzia, lista Skills, czas/runtime i wstrzyknięte pliki obszaru roboczego.
- **Historia konwersacji**: Twoje wiadomości + wiadomości asystenta dla tej sesji.
- **Wywołania/wyniki narzędzi + załączniki**: dane wyjściowe poleceń, odczyty plików, obrazy/audio itd.

Kontekst _to nie to samo_ co „pamięć”: pamięć może być przechowywana na dysku i później ponownie wczytana; kontekst to to, co znajduje się w bieżącym oknie modelu.

## Szybki start (sprawdzanie kontekstu)

- `/status` → szybki widok „jak bardzo zapełnione jest moje okno?” + ustawienia sesji.
- `/context list` → co jest wstrzykiwane + przybliżone rozmiary (na plik + sumy).
- `/context detail` → głębszy podział: rozmiary na plik, rozmiary schematów narzędzi, rozmiary wpisów Skills i rozmiar promptu systemowego.
- `/usage tokens` → dołącza stopkę użycia dla każdej odpowiedzi do zwykłych odpowiedzi.
- `/compact` → podsumowuje starszą historię do zwartego wpisu, aby zwolnić miejsce w oknie.

Zobacz też: [Polecenia slash](/pl/tools/slash-commands), [Użycie tokenów i koszty](/pl/reference/token-use), [Compaction](/pl/concepts/compaction).

## Przykładowe dane wyjściowe

Wartości różnią się zależnie od modelu, providera, zasad narzędzi i tego, co znajduje się w Twoim obszarze roboczym.

### `/context list`

```
🧠 Podział kontekstu
Obszar roboczy: <workspaceDir>
Maksimum bootstrap/plik: 12,000 znaków
Sandbox: mode=non-main sandboxed=false
Prompt systemowy (uruchomienie): 38,412 znaków (~9,603 tok) (Project Context 23,901 znaków (~5,976 tok))

Wstrzyknięte pliki obszaru roboczego:
- AGENTS.md: OK | raw 1,742 znaków (~436 tok) | injected 1,742 znaków (~436 tok)
- SOUL.md: OK | raw 912 znaków (~228 tok) | injected 912 znaków (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 znaków (~13,553 tok) | injected 20,962 znaków (~5,241 tok)
- IDENTITY.md: OK | raw 211 znaków (~53 tok) | injected 211 znaków (~53 tok)
- USER.md: OK | raw 388 znaków (~97 tok) | injected 388 znaków (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 znaków (~0 tok) | injected 0 znaków (~0 tok)

Lista Skills (tekst promptu systemowego): 2,184 znaki (~546 tok) (12 Skills)
Narzędzia: read, edit, write, exec, process, browser, message, sessions_send, …
Lista narzędzi (tekst promptu systemowego): 1,032 znaki (~258 tok)
Schematy narzędzi (JSON): 31,988 znaków (~7,997 tok) (wlicza się do kontekstu; nie jest pokazywane jako tekst)
Narzędzia: (jak wyżej)

Tokeny sesji (z cache): 14,250 łącznie / ctx=32,000
```

### `/context detail`

```
🧠 Podział kontekstu (szczegółowy)
…
Największe Skills (rozmiar wpisu promptu):
- frontend-design: 412 znaków (~103 tok)
- oracle: 401 znaków (~101 tok)
… (+10 kolejnych Skills)

Największe narzędzia (rozmiar schematu):
- browser: 9,812 znaków (~2,453 tok)
- exec: 6,240 znaków (~1,560 tok)
… (+N kolejnych narzędzi)
```

## Co liczy się do okna kontekstowego

Liczy się wszystko, co otrzymuje model, w tym:

- Prompt systemowy (wszystkie sekcje).
- Historia konwersacji.
- Wywołania narzędzi + wyniki narzędzi.
- Załączniki/transkrypcje (obrazy/audio/pliki).
- Podsumowania Compaction i artefakty przycinania.
- „Wrappery” providera lub ukryte nagłówki (niewidoczne, ale nadal liczone).

## Jak OpenClaw buduje prompt systemowy

Prompt systemowy jest **własnością OpenClaw** i jest przebudowywany przy każdym uruchomieniu. Zawiera:

- Listę narzędzi + krótkie opisy.
- Listę Skills (tylko metadane; zobacz niżej).
- Lokalizację obszaru roboczego.
- Czas (UTC + przeliczony czas użytkownika, jeśli skonfigurowany).
- Metadane runtime (host/OS/model/thinking).
- Wstrzyknięte pliki bootstrap obszaru roboczego w sekcji **Project Context**.

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

Duże pliki są przycinane per plik za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie `12000` znaków). OpenClaw wymusza również łączny limit wstrzyknięcia bootstrap dla wszystkich plików przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie `60000` znaków). `/context` pokazuje rozmiary **raw vs injected** oraz informację, czy nastąpiło przycięcie.

Gdy nastąpi przycięcie, runtime może wstrzyknąć do promptu blok ostrzeżenia w sekcji Project Context. Skonfiguruj to przez `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; domyślnie `once`).

## Skills: wstrzykiwane vs ładowane na żądanie

Prompt systemowy zawiera zwartą **listę Skills** (nazwa + opis + lokalizacja). Ta lista ma realny narzut.

Instrukcje Skills _nie_ są domyślnie dołączane. Oczekuje się, że model odczyta `SKILL.md` danej Skill przez `read` **tylko wtedy, gdy jest to potrzebne**.

## Narzędzia: są dwa koszty

Narzędzia wpływają na kontekst na dwa sposoby:

1. **Tekst listy narzędzi** w prompcie systemowym (to, co widzisz jako „Tooling”).
2. **Schematy narzędzi** (JSON). Są wysyłane do modelu, aby mógł wywoływać narzędzia. Wliczają się do kontekstu, mimo że nie widzisz ich jako zwykłego tekstu.

`/context detail` rozbija największe schematy narzędzi, aby pokazać, co dominuje.

## Polecenia, dyrektywy i „skróty inline”

Polecenia slash są obsługiwane przez Gateway. Występuje kilka różnych zachowań:

- **Polecenia samodzielne**: wiadomość zawierająca tylko `/...` jest uruchamiana jako polecenie.
- **Dyrektywy**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` są usuwane, zanim model zobaczy wiadomość.
  - Wiadomości zawierające tylko dyrektywy zapisują ustawienia sesji.
  - Dyrektywy inline w zwykłej wiadomości działają jako wskazówki dla pojedynczej wiadomości.
- **Skróty inline** (tylko nadawcy z allowlist): niektóre tokeny `/...` wewnątrz zwykłej wiadomości mogą zostać uruchomione natychmiast (przykład: „hey /status”) i są usuwane, zanim model zobaczy pozostały tekst.

Szczegóły: [Polecenia slash](/pl/tools/slash-commands).

## Sesje, Compaction i przycinanie (co się utrzymuje)

To, co utrzymuje się między wiadomościami, zależy od mechanizmu:

- **Zwykła historia** utrzymuje się w transkrypcie sesji, dopóki nie zostanie skompaktowana/przycięta przez zasady.
- **Compaction** zapisuje podsumowanie do transkryptu i zachowuje nienaruszone ostatnie wiadomości.
- **Przycinanie** usuwa stare wyniki narzędzi z promptu _w pamięci_, aby zwolnić miejsce w oknie kontekstowym, ale nie przepisuje transkryptu sesji — pełną historię nadal można sprawdzić na dysku.

Dokumentacja: [Sesja](/pl/concepts/session), [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning).

Domyślnie OpenClaw używa wbudowanego silnika kontekstu `legacy` do składania i
Compaction. Jeśli zainstalujesz Plugin dostarczający `kind: "context-engine"` i
wybierzesz go przez `plugins.slots.contextEngine`, OpenClaw przekazuje składanie
kontekstu, `/compact` i powiązane hooki cyklu życia kontekstu subagentów temu
silnikowi. `ownsCompaction: false` nie powoduje automatycznego fallbacku do silnika
legacy; aktywny silnik nadal musi poprawnie implementować `compact()`. Zobacz
[Context Engine](/pl/concepts/context-engine), aby poznać pełny
interfejs rozszerzalny, hooki cyklu życia i konfigurację.

## Co faktycznie raportuje `/context`

`/context` preferuje najnowszy raport promptu systemowego **zbudowany podczas uruchomienia**, gdy jest dostępny:

- `System prompt (run)` = przechwycony z ostatniego osadzonego uruchomienia (z obsługą narzędzi) i zapisany w magazynie sesji.
- `System prompt (estimate)` = obliczany na bieżąco, gdy nie istnieje raport z uruchomienia (lub podczas działania przez backend CLI, który nie generuje raportu).

W obu przypadkach raportuje rozmiary i największe wkłady; **nie** zrzuca pełnego promptu systemowego ani schematów narzędzi.

## Powiązane

- [Context Engine](/pl/concepts/context-engine) — niestandardowe wstrzykiwanie kontekstu przez Pluginy
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [Prompt systemowy](/pl/concepts/system-prompt) — jak budowany jest prompt systemowy
- [Pętla agenta](/pl/concepts/agent-loop) — pełny cykl wykonania agenta
