---
read_when:
    - Chcesz zrozumieć, co oznacza „kontekst” w OpenClaw
    - Debugujesz, dlaczego model coś „wie” (lub o tym zapomniał)
    - Chcesz zmniejszyć narzut kontekstu (/context, /status, /compact)
summary: 'Kontekst: co widzi model, jak jest tworzony i jak go sprawdzać'
title: Kontekst
x-i18n:
    generated_at: "2026-07-12T15:03:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

„Kontekst” to **wszystko, co OpenClaw wysyła do modelu podczas wykonania**. Jego rozmiar jest ograniczony przez **okno kontekstowe** modelu (limit tokenów).

Prosty model pojęciowy dla początkujących:

- **Prompt systemowy** (tworzony przez OpenClaw): reguły, narzędzia, lista Skills, czas/środowisko uruchomieniowe oraz wstrzyknięte pliki przestrzeni roboczej.
- **Historia konwersacji**: Twoje wiadomości i wiadomości asystenta w tej sesji.
- **Wywołania/wyniki narzędzi i załączniki**: dane wyjściowe poleceń, odczytane pliki, obrazy/dźwięk itp.

Kontekst _nie jest tym samym_ co „pamięć”: pamięć można zapisać na dysku i wczytać później, natomiast kontekst jest zawartością bieżącego okna modelu.

## Szybki start (inspekcja kontekstu)

- `/status` → szybki podgląd „jak pełne jest moje okno?” oraz ustawień sesji.
- `/context list` → co zostało wstrzyknięte i przybliżone rozmiary (dla poszczególnych plików i łącznie).
- `/context detail` → bardziej szczegółowy podział: rozmiary poszczególnych plików, schematów narzędzi i wpisów Skills, rozmiar promptu systemowego oraz liczba wiadomości transkrypcji możliwych do skompaktowania.
- `/context map` → obraz mapy prostokątów w stylu WinDirStat przedstawiający śledzone składniki kontekstu bieżącej sesji.
- `/usage tokens` → dodaje do zwykłych odpowiedzi stopkę z użyciem tokenów dla każdej odpowiedzi.
- `/compact` → podsumowuje starszą historię w kompaktowym wpisie, aby zwolnić miejsce w oknie.

Zobacz także: [Polecenia z ukośnikiem](/pl/tools/slash-commands), [Użycie tokenów i koszty](/pl/reference/token-use), [Compaction](/pl/concepts/compaction).

## Przykładowe dane wyjściowe

Wartości różnią się zależnie od modelu, dostawcy, zasad użycia narzędzi i zawartości przestrzeni roboczej.

### `/context list`

```text
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

```text
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

Wysyła obraz wygenerowany na podstawie najnowszego raportu wykonania z pamięci podręcznej oraz transkrypcji sesji. Zanim zwykła wiadomość wygeneruje raport wykonania w sesji, `/context map` zamiast renderować oszacowanie zwraca komunikat o niedostępności. Pole prostokąta jest proporcjonalne do liczby śledzonych znaków promptu:

- transkrypcja konwersacji (wiadomości użytkownika, odpowiedzi asystenta, wyniki narzędzi, podsumowania Compaction), a także kontekst środowiska uruchomieniowego dla poszczególnych tur oraz dodatki promptu z hooków, które trafiają wyłącznie do modelu
- wstrzyknięte pliki przestrzeni roboczej
- bazowy tekst promptu systemowego
- wpisy promptów Skills
- schematy JSON narzędzi

Grupa konwersacji rośnie wraz z sesją, dlatego mapa zmienia się z każdą turą; po Compaction zostaje zredukowana do kafelka podsumowań.

`/context list`, `/context detail` i `/context json` nadal mogą sprawdzić oszacowanie obliczane na żądanie, gdy w pamięci podręcznej nie ma raportu wykonania.

## Co wlicza się do okna kontekstowego

Wlicza się wszystko, co otrzymuje model, w tym:

- Prompt systemowy (wszystkie sekcje).
- Historia konwersacji.
- Wywołania i wyniki narzędzi.
- Załączniki/transkrypcje (obrazy/dźwięk/pliki).
- Podsumowania Compaction i artefakty przycinania.
- „Otoczki” dostawcy lub ukryte nagłówki (niewidoczne, ale nadal wliczane).

## Jak OpenClaw tworzy prompt systemowy

Prompt systemowy jest **własnością OpenClaw** i jest tworzony od nowa przy każdym wykonaniu. Obejmuje:

- Listę narzędzi i krótkie opisy.
- Listę Skills (tylko metadane; patrz niżej).
- Lokalizację przestrzeni roboczej.
- Czas (UTC oraz przeliczony czas użytkownika, jeśli został skonfigurowany).
- Metadane środowiska uruchomieniowego (host/system operacyjny/model/tryb rozumowania).
- Pliki inicjalizacyjne przestrzeni roboczej wstrzyknięte w sekcji **Kontekst projektu**.

Pełny podział: [Prompt systemowy](/pl/concepts/system-prompt).

## Wstrzyknięte pliki przestrzeni roboczej (Kontekst projektu)

Domyślnie OpenClaw wstrzykuje stały zestaw plików przestrzeni roboczej (jeśli istnieją):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko przy pierwszym uruchomieniu)

Duże pliki są osobno obcinane zgodnie z `agents.defaults.bootstrapMaxChars` (domyślnie `20000` znaków). OpenClaw wymusza również łączny limit wstrzykiwania plików inicjalizacyjnych określony przez `agents.defaults.bootstrapTotalMaxChars` (domyślnie `60000` znaków). `/context` pokazuje rozmiary **pierwotne i wstrzyknięte** oraz informację, czy nastąpiło obcięcie.

Gdy nastąpi obcięcie, środowisko uruchomieniowe może wstrzyknąć blok ostrzeżenia bezpośrednio do promptu w sekcji Kontekst projektu. Skonfiguruj to za pomocą `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; domyślnie `always`).

## Skills: wstrzykiwane a ładowane na żądanie

Prompt systemowy zawiera kompaktową **listę Skills** (nazwa, opis i lokalizacja). Ta lista powoduje rzeczywiste obciążenie.

Instrukcje Skills _nie_ są domyślnie uwzględniane. Model powinien użyć `read`, aby odczytać plik `SKILL.md` danej Skills **tylko wtedy, gdy jest potrzebny**.

## Narzędzia: dwa rodzaje kosztów

Narzędzia wpływają na kontekst na dwa sposoby:

1. **Tekst listy narzędzi** w prompcie systemowym (widoczny jako „Narzędzia”).
2. **Schematy narzędzi** (JSON). Są one wysyłane do modelu, aby mógł wywoływać narzędzia. Wliczają się do kontekstu, mimo że nie są widoczne jako zwykły tekst.

`/context detail` przedstawia największe schematy narzędzi, dzięki czemu można zobaczyć, które z nich dominują.

## Polecenia, dyrektywy i „skróty wbudowane”

Polecenia z ukośnikiem są obsługiwane przez Gateway. Występuje kilka różnych zachowań:

- **Samodzielne polecenia**: wiadomość zawierająca wyłącznie `/...` jest wykonywana jako polecenie.
- **Dyrektywy**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` są usuwane, zanim model zobaczy wiadomość.
  - Wiadomości zawierające wyłącznie dyrektywy zapisują ustawienia sesji.
  - Dyrektywy wbudowane w zwykłą wiadomość działają jako wskazówki dotyczące pojedynczej wiadomości.
- **Skróty wbudowane** (tylko nadawcy z listy dozwolonych): niektóre tokeny `/...` wewnątrz zwykłej wiadomości mogą zostać wykonane natychmiast (przykład: „hej /status”), po czym są usuwane, zanim model zobaczy pozostały tekst.

Szczegóły: [Polecenia z ukośnikiem](/pl/tools/slash-commands).

## Sesje, Compaction i przycinanie (co jest zachowywane)

To, co jest zachowywane między wiadomościami, zależy od mechanizmu:

- **Zwykła historia** jest zachowywana w transkrypcji sesji, dopóki nie zostanie skompaktowana lub przycięta zgodnie z zasadami.
- **Compaction** zapisuje podsumowanie w transkrypcji i zachowuje ostatnie wiadomości bez zmian.
- **Przycinanie** usuwa stare wyniki narzędzi z promptu przechowywanego _w pamięci_, aby zwolnić miejsce w oknie kontekstowym, ale nie modyfikuje transkrypcji sesji — pełną historię nadal można sprawdzić na dysku.

Dokumentacja: [Sesja](/pl/concepts/session), [Compaction](/pl/concepts/compaction), [Przycinanie sesji](/pl/concepts/session-pruning).

Domyślnie OpenClaw używa wbudowanego silnika kontekstu `legacy` do składania i
Compaction. Jeśli zainstalujesz plugin udostępniający `kind: "context-engine"` i
wybierzesz go za pomocą `plugins.slots.contextEngine`, OpenClaw deleguje do tego
silnika składanie kontekstu, `/compact` oraz powiązane hooki cyklu życia kontekstu
podagentów. `ownsCompaction: false` nie powoduje automatycznego powrotu do silnika
`legacy`; aktywny silnik nadal musi prawidłowo implementować `compact()`. Zobacz
[Silnik kontekstu](/pl/concepts/context-engine), aby poznać pełny
wymienny interfejs, hooki cyklu życia i konfigurację.

## Co faktycznie raportuje `/context`

Gdy jest dostępny, `/context` preferuje najnowszy raport promptu systemowego **utworzony podczas wykonania**:

- `System prompt (run)` = przechwycony podczas ostatniego osadzonego wykonania (obsługującego narzędzia) i zapisany w magazynie sesji.
- `System prompt (estimate)` = obliczany na bieżąco, gdy raport wykonania nie istnieje (lub podczas działania przez backend CLI, który nie generuje raportu).

W obu przypadkach raportowane są rozmiary i najwięksi współtwórcy; polecenie **nie** wyświetla pełnego promptu systemowego ani schematów narzędzi. W trybie szczegółowym porównuje również transkrypcję sesji przy użyciu tego samego predykatu rzeczywistych wiadomości konwersacji, którego używa Compaction, dzięki czemu łatwiej odróżnić wysokie użycie promptu/pamięci podręcznej od historii konwersacji możliwej do skompaktowania.

## Powiązane

<CardGroup cols={2}>
  <Card title="Silnik kontekstu" href="/pl/concepts/context-engine" icon="puzzle-piece">
    Niestandardowe wstrzykiwanie kontekstu za pośrednictwem pluginów.
  </Card>
  <Card title="Compaction" href="/pl/concepts/compaction" icon="compress">
    Podsumowywanie długich konwersacji, aby mieściły się w oknie modelu.
  </Card>
  <Card title="Prompt systemowy" href="/pl/concepts/system-prompt" icon="message-lines">
    Jak tworzony jest prompt systemowy i co wstrzykuje w każdej turze.
  </Card>
  <Card title="Pętla agenta" href="/pl/concepts/agent-loop" icon="arrows-rotate">
    Pełny cykl wykonania agenta, od wiadomości przychodzącej do końcowej odpowiedzi.
  </Card>
</CardGroup>
