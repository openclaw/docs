---
read_when:
    - Debugowanie, dlaczego agent odpowiedział, nie powiódł się lub wywołał narzędzia w określony sposób
    - Eksportowanie pakietu wsparcia dla sesji OpenClaw
    - Badanie kontekstu promptu, wywołań narzędzi, błędów runtime lub metadanych użycia
    - Wyłączanie lub przenoszenie przechwytywania trajektorii
summary: Eksportuj zredagowane pakiety trajektorii do debugowania sesji agenta OpenClaw
title: Pakiety trajektorii
x-i18n:
    generated_at: "2026-04-24T09:38:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
    source_path: tools/trajectory.md
    workflow: 15
---

Przechwytywanie trajektorii to rejestrator przebiegu sesji OpenClaw. Rejestruje
ustrukturyzowaną oś czasu dla każdego uruchomienia agenta, a następnie `/export-trajectory` pakuje
bieżącą sesję do zredagowanego pakietu wsparcia.

Użyj tego, gdy musisz odpowiedzieć na pytania takie jak:

- Jaki prompt, system prompt i narzędzia zostały wysłane do modelu?
- Które wiadomości transkrypcji i wywołania narzędzi doprowadziły do tej odpowiedzi?
- Czy uruchomienie przekroczyło limit czasu, zostało przerwane, wykonano Compaction albo wystąpił błąd dostawcy?
- Który model, Pluginy, Skills i ustawienia runtime były aktywne?
- Jakie metadane użycia i prompt-cache zwrócił dostawca?

## Szybki start

Wyślij to w aktywnej sesji:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw zapisuje pakiet w obszarze roboczym:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Możesz wybrać względną nazwę katalogu wyjściowego:

```text
/export-trajectory bug-1234
```

Niestandardowa ścieżka jest rozwiązywana wewnątrz `.openclaw/trajectory-exports/`. Ścieżki bezwzględne
i ścieżki `~` są odrzucane.

## Dostęp

Eksport trajektorii to polecenie właściciela. Nadawca musi przejść zwykłe kontrole
autoryzacji poleceń i kontrole właściciela dla kanału.

## Co jest rejestrowane

Przechwytywanie trajektorii jest domyślnie włączone dla uruchomień agentów OpenClaw.

Zdarzenia runtime obejmują:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Zdarzenia transkrypcji są również rekonstruowane z aktywnej gałęzi sesji:

- wiadomości użytkownika
- wiadomości asystenta
- wywołania narzędzi
- wyniki narzędzi
- Compaction
- zmiany modelu
- etykiety i niestandardowe wpisy sesji

Zdarzenia są zapisywane jako JSON Lines z następującym markerem schematu:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Pliki pakietu

Wyeksportowany pakiet może zawierać:

| Plik                  | Zawartość                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schemat pakietu, pliki źródłowe, liczby zdarzeń i lista wygenerowanych plików                  |
| `events.jsonl`        | Uporządkowana oś czasu runtime i transkrypcji                                                   |
| `session-branch.json` | Zredagowana aktywna gałąź transkrypcji i nagłówek sesji                                         |
| `metadata.json`       | Wersja OpenClaw, OS/runtime, model, migawka konfiguracji, Pluginy, Skills i metadane promptu   |
| `artifacts.json`      | Końcowy stan, błędy, użycie, prompt-cache, liczba Compaction, tekst asystenta i metadane narzędzi |
| `prompts.json`        | Wysłane prompty i wybrane szczegóły budowania promptu                                           |
| `system-prompt.txt`   | Ostatni skompilowany system prompt, jeśli został przechwycony                                   |
| `tools.json`          | Definicje narzędzi wysłane do modelu, jeśli zostały przechwycone                                |

`manifest.json` zawiera listę plików obecnych w danym pakiecie. Niektóre pliki są pomijane,
gdy sesja nie przechwyciła odpowiadających im danych runtime.

## Lokalizacja przechwytywania

Domyślnie zdarzenia trajektorii runtime są zapisywane obok pliku sesji:

```text
<session>.trajectory.jsonl
```

OpenClaw zapisuje także plik wskaźnika best-effort obok sesji:

```text
<session>.trajectory-path.json
```

Ustaw `OPENCLAW_TRAJECTORY_DIR`, aby przechowywać sidecary trajektorii runtime w
dedykowanym katalogu:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Gdy ta zmienna jest ustawiona, OpenClaw zapisuje jeden plik JSONL na identyfikator sesji w tym
katalogu.

## Wyłączanie przechwytywania

Ustaw `OPENCLAW_TRAJECTORY=0` przed uruchomieniem OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

To wyłącza przechwytywanie trajektorii runtime. `/export-trajectory` nadal może eksportować
gałąź transkrypcji, ale pliki tylko-runtime, takie jak skompilowany kontekst,
artefakty dostawcy i metadane promptu, mogą nie być dostępne.

## Prywatność i limity

Pakiety trajektorii są przeznaczone do wsparcia i debugowania, a nie do publicznego publikowania.
OpenClaw redaguje wrażliwe wartości przed zapisaniem plików eksportu:

- poświadczenia i znane pola payloadów przypominających sekrety
- dane obrazów
- ścieżki lokalnego stanu
- ścieżki obszaru roboczego, zastępowane przez `$WORKSPACE_DIR`
- ścieżki katalogu domowego, jeśli zostaną wykryte

Eksporter ogranicza też rozmiar wejścia:

- pliki sidecar runtime: 50 MiB
- pliki sesji: 50 MiB
- zdarzenia runtime: 200 000
- łączna liczba eksportowanych zdarzeń: 250 000
- pojedyncze linie zdarzeń runtime są obcinane powyżej 256 KiB

Przejrzyj pakiety przed udostępnieniem ich poza swoim zespołem. Redakcja działa w trybie best-effort
i nie jest w stanie rozpoznać każdego sekretu specyficznego dla danej aplikacji.

## Rozwiązywanie problemów

Jeśli eksport nie zawiera zdarzeń runtime:

- potwierdź, że OpenClaw uruchomiono bez `OPENCLAW_TRAJECTORY=0`
- sprawdź, czy `OPENCLAW_TRAJECTORY_DIR` wskazuje zapisywalny katalog
- uruchom kolejną wiadomość w sesji, a następnie wyeksportuj ponownie
- sprawdź `manifest.json` pod kątem `runtimeEventCount`

Jeśli polecenie odrzuca ścieżkę wyjściową:

- użyj względnej nazwy, takiej jak `bug-1234`
- nie podawaj `/tmp/...` ani `~/...`
- zachowaj eksport wewnątrz `.openclaw/trajectory-exports/`

Jeśli eksport kończy się błędem rozmiaru, sesja lub sidecar przekroczyły
limity bezpieczeństwa eksportu. Rozpocznij nową sesję lub wyeksportuj mniejszy przypadek odtworzeniowy.

## Powiązane

- [Diffs](/pl/tools/diffs)
- [Zarządzanie sesją](/pl/concepts/session)
- [Narzędzie Exec](/pl/tools/exec)
