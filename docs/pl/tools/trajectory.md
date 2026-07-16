---
read_when:
    - Debugowanie przyczyn, dla których agent odpowiedział, zakończył się niepowodzeniem lub wywołał narzędzia w określony sposób
    - Eksportowanie pakietu pomocy technicznej dla sesji OpenClaw
    - Badanie kontekstu promptu, wywołań narzędzi, błędów środowiska wykonawczego lub metadanych użycia
    - Wyłączanie rejestrowania trajektorii
summary: Eksportuj zanonimizowane pakiety trajektorii do debugowania sesji agenta OpenClaw
title: Pakiety trajektorii
x-i18n:
    generated_at: "2026-07-16T19:12:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

Rejestrowanie trajektorii to rejestrator przebiegu dla poszczególnych sesji w OpenClaw. Rejestruje
ustrukturyzowaną oś czasu każdego uruchomienia agenta, a następnie `/export-trajectory` pakuje
bieżącą sesję w zredagowany pakiet pomocy technicznej obejmujący:

- Prompt, prompt systemowy i narzędzia wysłane do modelu
- Wiadomości transkrypcji i wywołania narzędzi, które doprowadziły do odpowiedzi
- Informację, czy uruchomienie przekroczyło limit czasu, zostało przerwane, poddane Compaction lub napotkało błąd dostawcy
- Aktywne ustawienia modelu, pluginów, Skills i środowiska uruchomieniowego
- Metadane użycia i pamięci podręcznej promptów zwrócone przez dostawcę

Aby uzyskać ogólny raport pomocy technicznej Gateway, zacznij od
[`/diagnostics`](/pl/gateway/diagnostics#chat-command); zbiera on
oczyszczony pakiet Gateway, a w przypadku sesji środowiska OpenAI Codex może po
zatwierdzeniu wysłać opinię dotyczącą Codex do OpenAI. Użyj `/export-trajectory`, gdy potrzebna jest
szczegółowa oś czasu promptów, narzędzi i transkrypcji dla danej sesji.

## Szybki start

Wyślij w aktywnej sesji (alias `/trajectory`):

```text
/export-trajectory
```

OpenClaw zapisuje pakiet w obszarze roboczym:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Podaj względną nazwę katalogu wyjściowego, aby ją zastąpić:

```text
/export-trajectory bug-1234
```

Nazwa jest rozwiązywana wewnątrz `.openclaw/trajectory-exports/`. Ścieżki bezwzględne i
ścieżki `~` są odrzucane.

Pakiety trajektorii mogą zawierać prompty, wiadomości modelu, schematy narzędzi, wyniki
narzędzi, zdarzenia środowiska uruchomieniowego i ścieżki lokalne, dlatego polecenie czatu zawsze wymaga
zatwierdzenia wykonania. Zatwierdź eksport jednorazowo, gdy zamierzasz utworzyć
pakiet; nie używaj opcji zezwalania na wszystko. W czatach grupowych OpenClaw wysyła
prośbę o zatwierdzenie i wynik eksportu prywatnie do właściciela, zamiast publikować szczegóły
trajektorii we wspólnym pokoju.

Na potrzeby lokalnej inspekcji lub procesów pomocy technicznej uruchom bezpośrednio bazowe polecenie
CLI:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Inne flagi: `--output <path>` (nazwa katalogu wewnątrz
`.openclaw/trajectory-exports`), `--store <path>` (nadpisanie magazynu sesji),
`--agent <id>` (identyfikator agenta do rozwiązywania magazynu), `--json` (ustrukturyzowane dane wyjściowe).

## Dostęp

Eksport trajektorii jest poleceniem właściciela. Nadawca musi przejść standardowe kontrole
autoryzacji poleceń oraz kontrolę właściciela dla kanału.

## Co jest rejestrowane

Rejestrowanie trajektorii jest domyślnie włączone dla uruchomień agentów OpenClaw.

Zdarzenia środowiska uruchomieniowego obejmują:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, w tym model źródłowy, następny model, przyczynę/szczegóły niepowodzenia, pozycję w łańcuchu oraz informację, czy łańcuch przeszedł dalej, zakończył się powodzeniem lub został wyczerpany
- `model.completed`
- `trace.artifacts`
- `session.ended`

Zdarzenia transkrypcji są odtwarzane z aktywnej gałęzi sesji: wiadomości
użytkownika, wiadomości asystenta, wywołania narzędzi, wyniki narzędzi, operacje Compaction, zmiany
modelu, etykiety i niestandardowe wpisy sesji.

Zdarzenia są zapisywane jako JSON Lines z następującym znacznikiem schematu:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Pliki pakietu

| Plik                  | Zawartość                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schemat pakietu, pliki źródłowe, liczba zdarzeń i lista wygenerowanych plików                             |
| `events.jsonl`        | Uporządkowana oś czasu środowiska uruchomieniowego i transkrypcji                                                        |
| `session-branch.json` | Zredagowana aktywna gałąź transkrypcji i nagłówek sesji                                           |
| `metadata.json`       | Wersja OpenClaw, system operacyjny/środowisko uruchomieniowe, model, migawka konfiguracji, pluginy, Skills i metadane promptu     |
| `artifacts.json`      | Stan końcowy, błędy, użycie, pamięć podręczna promptów, liczba operacji Compaction, tekst asystenta i metadane narzędzi |
| `prompts.json`        | Przesłane prompty i wybrane szczegóły tworzenia promptów                                         |
| `system-prompt.txt`   | Najnowszy skompilowany prompt systemowy, jeśli został zarejestrowany                                                   |
| `tools.json`          | Definicje narzędzi wysłane do modelu, jeśli zostały zarejestrowane                                              |

`manifest.json` zawiera listę plików obecnych w danym pakiecie; niektóre pliki są
pomijane, jeśli sesja nie zarejestrowała odpowiadających im danych środowiska uruchomieniowego.

## Magazyn rejestrowania

Zdarzenia trajektorii środowiska uruchomieniowego są przechowywane wraz z sesją w bazie danych SQLite
danego agenta. Eksport trajektorii materializuje zredagowany pakiet pomocy technicznej JSONL;
rejestrowane na żywo dane środowiska uruchomieniowego nie są pomocniczym plikiem JSONL umieszczonym obok sesji.

Starsze pliki `.trajectory.jsonl` i `.trajectory-path.json` mogą nadal występować
z wcześniejszych wersji lub jawnych eksportów do starszego formatu plikowego. Mechanizmy utrzymania sesji traktują
te pliki jako cele czyszczenia; aktywne rejestrowanie zapisuje wiersze bazy danych.

## Wyłączanie rejestrowania

```bash
export OPENCLAW_TRAJECTORY=0
```

Wyłącza to rejestrowanie trajektorii środowiska uruchomieniowego przed uruchomieniem OpenClaw.
`/export-trajectory` nadal może wyeksportować gałąź transkrypcji, ale dane dostępne wyłącznie
w środowisku uruchomieniowym, takie jak skompilowany kontekst, artefakty dostawcy i metadane promptów, mogą być
niedostępne.

## Dostosowywanie limitu czasu opróżniania

OpenClaw opróżnia wiersze trajektorii środowiska uruchomieniowego podczas czyszczenia agenta. Domyślny
limit czasu czyszczenia wynosi 10,000 ms. W przypadku wolnych dysków lub dużych magazynów ustaw
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` przed uruchomieniem OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Określa to moment, w którym OpenClaw rejestruje przekroczenie limitu czasu `openclaw-trajectory-flush` i
kontynuuje działanie; nie zmienia to limitów rozmiaru trajektorii. Aby dostosować wszystkie kroki
czyszczenia agenta, które nie przekazują jawnego limitu czasu, ustaw
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Prywatność i limity

Pakiety trajektorii służą do pomocy technicznej i debugowania, a nie do publicznego udostępniania. OpenClaw
redaguje wartości wrażliwe przed zapisaniem plików eksportu:

- dane uwierzytelniające i znane pola ładunku przypominające sekrety
- dane obrazów
- ścieżki lokalnego stanu
- ścieżki obszaru roboczego, zastępowane przez `$WORKSPACE_DIR`
- ścieżki katalogu domowego, jeśli zostaną wykryte

Eksporter ogranicza również rozmiar danych wejściowych:

- rejestrowanie środowiska uruchomieniowego: rejestrowane na żywo dane stanowią przesuwne okno ograniczone do 10 MiB, w którym najstarsze zdarzenia są usuwane, aby zrobić miejsce na nowe; eksport akceptuje istniejące starsze pomocnicze pliki środowiska uruchomieniowego o rozmiarze do 50 MiB
- pliki sesji: 50 MiB
- zdarzenia środowiska uruchomieniowego na eksport: 200,000
- łączna liczba wyeksportowanych zdarzeń: 250,000
- poszczególne wiersze zdarzeń środowiska uruchomieniowego są obcinane powyżej 256 KiB

Przejrzyj pakiety przed udostępnieniem ich poza zespołem. Redagowanie odbywa się z zachowaniem
należytej staranności i nie jest w stanie rozpoznać każdego sekretu specyficznego dla aplikacji.

## Rozwiązywanie problemów

Jeśli eksport nie zawiera zdarzeń środowiska uruchomieniowego:

- potwierdź, że OpenClaw został uruchomiony bez `OPENCLAW_TRAJECTORY=0`
- uruchom kolejną wiadomość w sesji, a następnie ponownie wykonaj eksport
- sprawdź `manifest.json` pod kątem `runtimeEventCount`

Jeśli polecenie odrzuca ścieżkę wyjściową:

- użyj nazwy względnej, takiej jak `bug-1234`
- nie przekazuj `/tmp/...` ani `~/...`
- zachowaj eksport wewnątrz `.openclaw/trajectory-exports/`

Jeśli eksport kończy się błędem rozmiaru, sesja lub plik pomocniczy przekroczyły
powyższe limity bezpieczeństwa eksportu. Rozpocznij nową sesję lub wyeksportuj mniejszy
przypadek reprodukujący problem.

## Powiązane

- [Różnice](/pl/tools/diffs)
- [Zarządzanie sesjami](/pl/concepts/session)
- [Narzędzie wykonawcze](/pl/tools/exec)
