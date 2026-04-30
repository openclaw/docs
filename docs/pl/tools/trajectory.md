---
read_when:
    - Debugowanie tego, dlaczego agent udzielił odpowiedzi, zakończył się błędem lub wywołał narzędzia w określony sposób
    - Eksportowanie pakietu wsparcia dla sesji OpenClaw
    - Badanie kontekstu promptu, wywołań narzędzi, błędów środowiska wykonawczego lub metadanych użycia
    - Wyłączanie lub przenoszenie przechwytywania trajektorii
summary: Eksportuj pakiety trajektorii z usuniętymi danymi wrażliwymi do debugowania sesji agenta OpenClaw
title: Pakiety trajektorii
x-i18n:
    generated_at: "2026-04-30T10:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

Przechwytywanie trajektorii to rejestrator przebiegu dla każdej sesji OpenClaw. Rejestruje
ustrukturyzowaną oś czasu dla każdego uruchomienia agenta, a następnie `/export-trajectory` pakuje
bieżącą sesję w zredagowany pakiet pomocy technicznej.

Użyj go, gdy musisz odpowiedzieć na pytania takie jak:

- Jaki prompt, prompt systemowy i narzędzia wysłano do modelu?
- Które wiadomości transkrypcji i wywołania narzędzi doprowadziły do tej odpowiedzi?
- Czy uruchomienie przekroczyło limit czasu, zostało przerwane, wykonano Compaction, czy wystąpił błąd dostawcy?
- Który model, pluginy, Skills i ustawienia środowiska uruchomieniowego były aktywne?
- Jakie metadane użycia i pamięci podręcznej promptów zwrócił dostawca?

Jeśli zgłaszasz szeroki raport pomocy technicznej dotyczący problemu z aktywnym Gateway, zacznij od
[`/diagnostics`](/pl/gateway/diagnostics#chat-command). Diagnostyka zbiera
oczyszczony pakiet Gateway i, w przypadku sesji środowiska OpenAI Codex, może również wysłać
opinię Codex do serwerów OpenAI po zatwierdzeniu. Użyj `/export-trajectory`, gdy
potrzebujesz konkretnie szczegółowej osi czasu promptów, narzędzi i transkrypcji
dla danej sesji.

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

Pakiety trajektorii mogą zawierać prompty, wiadomości modelu, schematy narzędzi, wyniki narzędzi,
zdarzenia środowiska uruchomieniowego i ścieżki lokalne. Polecenie ukośnikowe czatu dlatego przechodzi
przez zatwierdzenie exec za każdym razem. Zatwierdź eksport raz, gdy zamierzasz
utworzyć pakiet; nie używaj allow-all. W czatach grupowych OpenClaw wysyła
prompt zatwierdzenia i wynik eksportu prywatnie do właściciela zamiast publikować
szczegóły trajektorii z powrotem we wspólnym pokoju.

Do lokalnej inspekcji lub przepływów pomocy technicznej możesz również uruchomić zatwierdzoną ścieżkę polecenia
bezpośrednio:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Dostęp

Eksport trajektorii jest poleceniem właściciela. Nadawca musi przejść standardowe kontrole
autoryzacji polecenia oraz kontrole właściciela dla kanału.

## Co jest rejestrowane

Przechwytywanie trajektorii jest domyślnie włączone dla uruchomień agentów OpenClaw.

Zdarzenia środowiska uruchomieniowego obejmują:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, w tym model źródłowy, następny model, powód/szczegóły awarii, pozycję w łańcuchu oraz informację, czy fallback przeszedł dalej, zakończył się powodzeniem, czy wyczerpał łańcuch
- `model.completed`
- `trace.artifacts`
- `session.ended`

Zdarzenia transkrypcji są również rekonstruowane z aktywnej gałęzi sesji:

- wiadomości użytkownika
- wiadomości asystenta
- wywołania narzędzi
- wyniki narzędzi
- compakcje
- zmiany modelu
- etykiety i niestandardowe wpisy sesji

Zdarzenia są zapisywane jako JSON Lines z tym znacznikiem schematu:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Pliki pakietu

Wyeksportowany pakiet może zawierać:

| Plik                  | Zawartość                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schemat pakietu, pliki źródłowe, liczby zdarzeń i wygenerowana lista plików                    |
| `events.jsonl`        | Uporządkowana oś czasu środowiska uruchomieniowego i transkrypcji                              |
| `session-branch.json` | Zredagowana aktywna gałąź transkrypcji i nagłówek sesji                                        |
| `metadata.json`       | Wersja OpenClaw, system operacyjny/środowisko uruchomieniowe, model, migawka konfiguracji, pluginy, Skills i metadane promptów |
| `artifacts.json`      | Końcowy status, błędy, użycie, pamięć podręczna promptów, liczba compakcji, tekst asystenta i metadane narzędzi |
| `prompts.json`        | Przesłane prompty i wybrane szczegóły budowania promptów                                       |
| `system-prompt.txt`   | Najnowszy skompilowany prompt systemowy, jeśli został przechwycony                             |
| `tools.json`          | Definicje narzędzi wysłane do modelu, jeśli zostały przechwycone                               |

`manifest.json` zawiera listę plików obecnych w danym pakiecie. Niektóre pliki są pomijane,
gdy sesja nie przechwyciła odpowiadających im danych środowiska uruchomieniowego.

## Lokalizacja przechwytywania

Domyślnie zdarzenia trajektorii środowiska uruchomieniowego są zapisywane obok pliku sesji:

```text
<session>.trajectory.jsonl
```

OpenClaw zapisuje również plik wskaźnika w trybie best-effort obok sesji:

```text
<session>.trajectory-path.json
```

Ustaw `OPENCLAW_TRAJECTORY_DIR`, aby przechowywać pliki poboczne trajektorii środowiska uruchomieniowego w
dedykowanym katalogu:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Gdy ta zmienna jest ustawiona, OpenClaw zapisuje jeden plik JSONL na identyfikator sesji w tym
katalogu.

Konserwacja sesji usuwa pliki poboczne trajektorii, gdy należący do nich wpis sesji
zostanie przycięty, ograniczony limitem lub usunięty przez budżet dyskowy sesji. Pliki środowiska uruchomieniowego poza
katalogiem sesji są usuwane tylko wtedy, gdy cel wskaźnika nadal dowodzi, że
należy do tej sesji.

## Wyłączanie przechwytywania

Ustaw `OPENCLAW_TRAJECTORY=0` przed uruchomieniem OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Wyłącza to przechwytywanie trajektorii środowiska uruchomieniowego. `/export-trajectory` nadal może eksportować
gałąź transkrypcji, ale pliki dostępne tylko z runtime, takie jak skompilowany kontekst,
artefakty dostawcy i metadane promptów, mogą być brakujące.

## Prywatność i limity

Pakiety trajektorii są przeznaczone do pomocy technicznej i debugowania, a nie do publicznego publikowania.
OpenClaw redaguje wrażliwe wartości przed zapisaniem plików eksportu:

- poświadczenia i znane pola ładunku przypominające sekrety
- dane obrazów
- ścieżki stanu lokalnego
- ścieżki obszaru roboczego, zastąpione przez `$WORKSPACE_DIR`
- ścieżki katalogu domowego, gdy zostaną wykryte

Eksporter ogranicza również rozmiar wejścia:

- pliki poboczne środowiska uruchomieniowego: 50 MiB
- pliki sesji: 50 MiB
- zdarzenia środowiska uruchomieniowego: 200,000
- łączna liczba wyeksportowanych zdarzeń: 250,000
- pojedyncze wiersze zdarzeń środowiska uruchomieniowego są obcinane powyżej 256 KiB

Przejrzyj pakiety przed udostępnieniem ich poza swoim zespołem. Redakcja działa w trybie best-effort
i nie może znać każdego sekretu specyficznego dla aplikacji.

## Rozwiązywanie problemów

Jeśli eksport nie zawiera zdarzeń środowiska uruchomieniowego:

- potwierdź, że OpenClaw został uruchomiony bez `OPENCLAW_TRAJECTORY=0`
- sprawdź, czy `OPENCLAW_TRAJECTORY_DIR` wskazuje na katalog z możliwością zapisu
- uruchom kolejną wiadomość w sesji, a następnie wyeksportuj ponownie
- sprawdź `manifest.json` pod kątem `runtimeEventCount`

Jeśli polecenie odrzuca ścieżkę wyjściową:

- użyj względnej nazwy, takiej jak `bug-1234`
- nie przekazuj `/tmp/...` ani `~/...`
- zachowaj eksport wewnątrz `.openclaw/trajectory-exports/`

Jeśli eksport kończy się błędem rozmiaru, sesja lub plik poboczny przekroczyły
limity bezpieczeństwa eksportu. Rozpocznij nową sesję albo wyeksportuj mniejszą reprodukcję.

## Powiązane

- [Różnice](/pl/tools/diffs)
- [Zarządzanie sesjami](/pl/concepts/session)
- [Narzędzie exec](/pl/tools/exec)
