---
read_when:
    - Debugowanie powodów, dla których agent odpowiedział, zakończył się niepowodzeniem lub wywołał narzędzia w określony sposób
    - Eksportowanie pakietu wsparcia dla sesji OpenClaw
    - Badanie kontekstu promptu, wywołań narzędzi, błędów środowiska uruchomieniowego lub metadanych użycia
    - Wyłączanie lub przenoszenie przechwytywania trajektorii
summary: Eksportowanie zredagowanych pakietów trajektorii do debugowania sesji agenta OpenClaw
title: Pakiety trajektorii
x-i18n:
    generated_at: "2026-05-04T09:37:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

Przechwytywanie trajektorii to rejestrator lotu OpenClaw dla każdej sesji. Rejestruje
ustrukturyzowaną oś czasu dla każdego uruchomienia agenta, a następnie `/export-trajectory` pakuje
bieżącą sesję w zredagowany pakiet wsparcia.

Używaj go, gdy musisz odpowiedzieć na pytania takie jak:

- Jaki prompt, prompt systemowy i narzędzia wysłano do modelu?
- Które wiadomości transkryptu i wywołania narzędzi doprowadziły do tej odpowiedzi?
- Czy uruchomienie przekroczyło limit czasu, zostało przerwane, wykonało Compaction albo napotkało błąd dostawcy?
- Który model, pluginy, Skills i ustawienia środowiska uruchomieniowego były aktywne?
- Jakie metadane użycia i pamięci podręcznej promptów zwrócił dostawca?

Jeśli zgłaszasz szeroki raport wsparcia dotyczący problemu z działającym Gateway, zacznij od
[`/diagnostics`](/pl/gateway/diagnostics#chat-command). Diagnostyka zbiera
oczyszczony pakiet Gateway i, w przypadku sesji OpenAI Codex harness, może także wysłać
feedback Codex na serwery OpenAI po zatwierdzeniu. Użyj `/export-trajectory`, gdy
potrzebujesz konkretnie szczegółowej osi czasu promptów, narzędzi i transkryptu
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

Ścieżka niestandardowa jest rozwiązywana wewnątrz `.openclaw/trajectory-exports/`. Ścieżki bezwzględne
i ścieżki z `~` są odrzucane.

Pakiety trajektorii mogą zawierać prompty, wiadomości modelu, schematy narzędzi, wyniki narzędzi,
zdarzenia środowiska uruchomieniowego i ścieżki lokalne. Dlatego polecenie ukośnikowe czatu za każdym razem przechodzi
przez zatwierdzenie wykonania. Zatwierdź eksport raz, gdy zamierzasz
utworzyć pakiet; nie używaj allow-all. W czatach grupowych OpenClaw wysyła
prompt zatwierdzenia i wynik eksportu prywatnie do właściciela, zamiast publikować
szczegóły trajektorii z powrotem we współdzielonym pokoju.

Do lokalnej inspekcji lub przepływów wsparcia możesz też uruchomić zatwierdzoną ścieżkę polecenia
bezpośrednio:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Dostęp

Eksport trajektorii jest poleceniem właściciela. Nadawca musi przejść normalne kontrole
autoryzacji poleceń oraz kontrole właściciela dla kanału.

## Co jest rejestrowane

Przechwytywanie trajektorii jest domyślnie włączone dla uruchomień agentów OpenClaw.

Zdarzenia środowiska uruchomieniowego obejmują:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, w tym model źródłowy, następny model, powód/szczegóły niepowodzenia, pozycję w łańcuchu oraz informację, czy fallback przeszedł dalej, zakończył się sukcesem, czy wyczerpał łańcuch
- `model.completed`
- `trace.artifacts`
- `session.ended`

Zdarzenia transkryptu są także odtwarzane z aktywnej gałęzi sesji:

- wiadomości użytkownika
- wiadomości asystenta
- wywołania narzędzi
- wyniki narzędzi
- Compaction
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
| `manifest.json`       | Schemat pakietu, pliki źródłowe, liczby zdarzeń i wygenerowana lista plików                             |
| `events.jsonl`        | Uporządkowana oś czasu środowiska uruchomieniowego i transkryptu                                                        |
| `session-branch.json` | Zredagowana aktywna gałąź transkryptu i nagłówek sesji                                           |
| `metadata.json`       | Wersja OpenClaw, OS/środowisko uruchomieniowe, model, migawka konfiguracji, pluginy, Skills i metadane promptów     |
| `artifacts.json`      | Status końcowy, błędy, użycie, pamięć podręczna promptów, liczba Compaction, tekst asystenta i metadane narzędzi |
| `prompts.json`        | Przesłane prompty i wybrane szczegóły budowania promptów                                         |
| `system-prompt.txt`   | Najnowszy skompilowany prompt systemowy, jeśli został przechwycony                                                   |
| `tools.json`          | Definicje narzędzi wysłane do modelu, jeśli zostały przechwycone                                              |

`manifest.json` zawiera listę plików obecnych w danym pakiecie. Niektóre pliki są pomijane,
gdy sesja nie przechwyciła odpowiadających im danych środowiska uruchomieniowego.

## Lokalizacja przechwytywania

Domyślnie zdarzenia trajektorii środowiska uruchomieniowego są zapisywane obok pliku sesji:

```text
<session>.trajectory.jsonl
```

OpenClaw zapisuje również pomocniczy plik wskaźnika obok sesji:

```text
<session>.trajectory-path.json
```

Ustaw `OPENCLAW_TRAJECTORY_DIR`, aby przechowywać pomocnicze pliki trajektorii środowiska uruchomieniowego w
dedykowanym katalogu:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Gdy ta zmienna jest ustawiona, OpenClaw zapisuje w tym katalogu jeden plik JSONL na identyfikator sesji.

Utrzymanie sesji usuwa pomocnicze pliki trajektorii, gdy należący do nich wpis sesji
zostanie przycięty, ograniczony lub usunięty przez budżet dyskowy sesji. Pliki środowiska uruchomieniowego poza
katalogiem sesji są usuwane tylko wtedy, gdy cel wskaźnika nadal dowodzi, że
należy do tej sesji.

## Wyłączanie przechwytywania

Ustaw `OPENCLAW_TRAJECTORY=0` przed uruchomieniem OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Wyłącza to przechwytywanie trajektorii środowiska uruchomieniowego. `/export-trajectory` nadal może eksportować
gałąź transkryptu, ale pliki dostępne tylko ze środowiska uruchomieniowego, takie jak skompilowany kontekst,
artefakty dostawcy i metadane promptów, mogą być brakujące.

## Prywatność i limity

Pakiety trajektorii są przeznaczone do wsparcia i debugowania, nie do publicznego publikowania.
OpenClaw redaguje wartości wrażliwe przed zapisaniem plików eksportu:

- dane uwierzytelniające i znane pola ładunku przypominające sekrety
- dane obrazów
- ścieżki stanu lokalnego
- ścieżki obszaru roboczego, zastąpione przez `$WORKSPACE_DIR`
- ścieżki katalogu domowego, jeśli zostaną wykryte

Eksporter ogranicza także rozmiar danych wejściowych:

- pomocnicze pliki środowiska uruchomieniowego: przechwytywanie na żywo zatrzymuje się przy 10 MiB i zapisuje zdarzenie obcięcia, gdy pozostaje miejsce; eksport akceptuje istniejące pomocnicze pliki środowiska uruchomieniowego do 50 MiB
- pliki sesji: 50 MiB
- zdarzenia środowiska uruchomieniowego: 200 000
- łączna liczba wyeksportowanych zdarzeń: 250 000
- pojedyncze wiersze zdarzeń środowiska uruchomieniowego są obcinane powyżej 256 KiB

Przejrzyj pakiety przed udostępnieniem ich poza zespołem. Redakcja działa na zasadzie najlepszych starań
i nie może znać każdego sekretu specyficznego dla aplikacji.

## Rozwiązywanie problemów

Jeśli eksport nie zawiera zdarzeń środowiska uruchomieniowego:

- potwierdź, że OpenClaw został uruchomiony bez `OPENCLAW_TRAJECTORY=0`
- sprawdź, czy `OPENCLAW_TRAJECTORY_DIR` wskazuje zapisywalny katalog
- uruchom kolejną wiadomość w sesji, a następnie wyeksportuj ponownie
- sprawdź `manifest.json` pod kątem `runtimeEventCount`

Jeśli polecenie odrzuca ścieżkę wyjściową:

- użyj nazwy względnej, takiej jak `bug-1234`
- nie przekazuj `/tmp/...` ani `~/...`
- trzymaj eksport wewnątrz `.openclaw/trajectory-exports/`

Jeśli eksport kończy się błędem rozmiaru, sesja lub plik pomocniczy przekroczyły
limity bezpieczeństwa eksportu. Rozpocznij nową sesję albo wyeksportuj mniejszą reprodukcję.

## Powiązane

- [Różnice](/pl/tools/diffs)
- [Zarządzanie sesją](/pl/concepts/session)
- [Narzędzie exec](/pl/tools/exec)
