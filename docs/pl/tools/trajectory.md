---
read_when:
    - Debugowanie, dlaczego agent odpowiedział, nie powiódł się lub wywołał narzędzia w określony sposób
    - Eksportowanie pakietu pomocy technicznej dla sesji OpenClaw
    - Badanie kontekstu promptu, wywołań narzędzi, błędów środowiska uruchomieniowego lub metadanych użycia
    - Wyłączanie lub przenoszenie przechwytywania trajektorii
summary: Eksportuj zanonimizowane pakiety trajektorii do debugowania sesji agenta OpenClaw
title: Pakiety trajektorii
x-i18n:
    generated_at: "2026-06-27T18:32:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

Przechwytywanie trajektorii to rejestrator przebiegu sesji w OpenClaw. Zapisuje
ustrukturyzowaną oś czasu dla każdego uruchomienia agenta, a następnie `/export-trajectory` pakuje
bieżącą sesję w zredagowany pakiet wsparcia.

Użyj go, gdy musisz odpowiedzieć na pytania takie jak:

- Jaki prompt, prompt systemowy i narzędzia wysłano do modelu?
- Które wiadomości transkryptu i wywołania narzędzi doprowadziły do tej odpowiedzi?
- Czy uruchomienie przekroczyło limit czasu, zostało przerwane, skompaktowane albo napotkało błąd dostawcy?
- Który model, Plugin, Skills i ustawienia środowiska uruchomieniowego były aktywne?
- Jakie metadane użycia i pamięci podręcznej promptów zwrócił dostawca?

Jeśli zgłaszasz szeroki raport wsparcia dotyczący problemu z aktywnym Gateway, zacznij od
[`/diagnostics`](/pl/gateway/diagnostics#chat-command). Diagnostyka zbiera
oczyszczony pakiet Gateway, a dla sesji uprzęży OpenAI Codex może także wysłać
opinię Codex do serwerów OpenAI po zatwierdzeniu. Użyj `/export-trajectory`, gdy
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
i ścieżki `~` są odrzucane.

Pakiety trajektorii mogą zawierać prompty, wiadomości modelu, schematy narzędzi, wyniki
narzędzi, zdarzenia środowiska uruchomieniowego i ścieżki lokalne. Dlatego polecenie ukośnikowe czatu uruchamia się
przez zatwierdzenie exec za każdym razem. Zatwierdź eksport raz, gdy zamierzasz
utworzyć pakiet; nie używaj allow-all. W czatach grupowych OpenClaw wysyła
prompt zatwierdzenia i wynik eksportu prywatnie do właściciela zamiast publikować
szczegóły trajektorii z powrotem we współdzielonym pokoju.

Do lokalnej inspekcji lub przepływów wsparcia możesz także uruchomić zatwierdzoną ścieżkę
polecenia bezpośrednio:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Dostęp

Eksport trajektorii jest poleceniem właściciela. Nadawca musi przejść standardowe kontrole
autoryzacji poleceń i kontrole właściciela dla kanału.

## Co jest rejestrowane

Przechwytywanie trajektorii jest domyślnie włączone dla uruchomień agentów OpenClaw.

Zdarzenia środowiska uruchomieniowego obejmują:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, w tym model źródłowy, następny model, przyczynę/szczegół niepowodzenia, pozycję w łańcuchu oraz informację, czy fallback przeszedł dalej, zakończył się powodzeniem, czy wyczerpał łańcuch
- `model.completed`
- `trace.artifacts`
- `session.ended`

Zdarzenia transkryptu są także rekonstruowane z aktywnej gałęzi sesji:

- wiadomości użytkownika
- wiadomości asystenta
- wywołania narzędzi
- wyniki narzędzi
- kompaktacje
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
| `manifest.json`       | Schemat pakietu, pliki źródłowe, liczby zdarzeń i lista wygenerowanych plików                  |
| `events.jsonl`        | Uporządkowana oś czasu środowiska uruchomieniowego i transkryptu                               |
| `session-branch.json` | Zredagowana aktywna gałąź transkryptu i nagłówek sesji                                         |
| `metadata.json`       | Wersja OpenClaw, system operacyjny/środowisko uruchomieniowe, model, migawka konfiguracji, Plugin, Skills i metadane promptów |
| `artifacts.json`      | Końcowy status, błędy, użycie, pamięć podręczna promptów, liczba kompaktacji, tekst asystenta i metadane narzędzi |
| `prompts.json`        | Przesłane prompty i wybrane szczegóły budowania promptów                                      |
| `system-prompt.txt`   | Najnowszy skompilowany prompt systemowy, jeśli został przechwycony                             |
| `tools.json`          | Definicje narzędzi wysłane do modelu, jeśli zostały przechwycone                               |

`manifest.json` wymienia pliki obecne w danym pakiecie. Niektóre pliki są pomijane,
gdy sesja nie przechwyciła odpowiadających im danych środowiska uruchomieniowego.

## Lokalizacja przechwytywania

Domyślnie zdarzenia trajektorii środowiska uruchomieniowego są zapisywane obok pliku sesji:

```text
<session>.trajectory.jsonl
```

OpenClaw zapisuje także plik wskaźnika best-effort obok sesji:

```text
<session>.trajectory-path.json
```

Ustaw `OPENCLAW_TRAJECTORY_DIR`, aby przechowywać pliki pomocnicze trajektorii środowiska uruchomieniowego w
dedykowanym katalogu:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Gdy ta zmienna jest ustawiona, OpenClaw zapisuje jeden plik JSONL na identyfikator sesji w tym
katalogu.

Konserwacja sesji usuwa pliki pomocnicze trajektorii, gdy ich wpis sesji właściciela
zostanie przycięty, ograniczony limitem lub usunięty przez budżet dyskowy sesji. Pliki środowiska uruchomieniowego poza
katalogiem sesji są usuwane tylko wtedy, gdy cel wskaźnika nadal dowodzi, że
należy do tej sesji.

## Wyłączanie przechwytywania

Ustaw `OPENCLAW_TRAJECTORY=0` przed uruchomieniem OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Wyłącza to przechwytywanie trajektorii środowiska uruchomieniowego. `/export-trajectory` nadal może wyeksportować
gałąź transkryptu, ale pliki dostępne tylko w środowisku uruchomieniowym, takie jak skompilowany kontekst,
artefakty dostawcy i metadane promptów, mogą być niedostępne.

## Dostosowanie limitu czasu opróżniania

OpenClaw opróżnia pliki pomocnicze trajektorii środowiska uruchomieniowego podczas czyszczenia agenta. Domyślny
limit czasu czyszczenia wynosi 10 000 ms. Na wolnych dyskach lub w dużych magazynach ustaw
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` przed uruchomieniem OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Kontroluje to moment, w którym OpenClaw zapisuje limit czasu `openclaw-trajectory-flush` i kontynuuje.
Nie zmienia to limitów rozmiaru trajektorii. Aby dostosować wszystkie kroki czyszczenia agenta,
które nie przekazują jawnego limitu czasu, ustaw `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Prywatność i limity

Pakiety trajektorii są przeznaczone do wsparcia i debugowania, a nie do publicznego publikowania.
OpenClaw redaguje wrażliwe wartości przed zapisaniem plików eksportu:

- poświadczenia i znane pola ładunku przypominające sekrety
- dane obrazów
- ścieżki lokalnego stanu
- ścieżki obszaru roboczego, zastąpione przez `$WORKSPACE_DIR`
- ścieżki katalogu domowego, gdy zostaną wykryte

Eksporter ogranicza także rozmiar danych wejściowych:

- pliki pomocnicze środowiska uruchomieniowego: przechwytywanie na żywo zatrzymuje się przy 10 MiB i zapisuje zdarzenie obcięcia, gdy pozostaje miejsce; eksport akceptuje istniejące pliki pomocnicze środowiska uruchomieniowego do 50 MiB
- pliki sesji: 50 MiB
- zdarzenia środowiska uruchomieniowego: 200 000
- łącznie wyeksportowane zdarzenia: 250 000
- pojedyncze wiersze zdarzeń środowiska uruchomieniowego są obcinane powyżej 256 KiB

Przejrzyj pakiety przed udostępnieniem ich poza swoim zespołem. Redakcja działa na zasadzie best-effort
i nie może znać każdego sekretu specyficznego dla aplikacji.

## Rozwiązywanie problemów

Jeśli eksport nie ma zdarzeń środowiska uruchomieniowego:

- potwierdź, że OpenClaw został uruchomiony bez `OPENCLAW_TRAJECTORY=0`
- sprawdź, czy `OPENCLAW_TRAJECTORY_DIR` wskazuje zapisywalny katalog
- uruchom kolejną wiadomość w sesji, a następnie wyeksportuj ponownie
- sprawdź `manifest.json` pod kątem `runtimeEventCount`

Jeśli polecenie odrzuca ścieżkę wyjściową:

- użyj względnej nazwy, takiej jak `bug-1234`
- nie przekazuj `/tmp/...` ani `~/...`
- trzymaj eksport wewnątrz `.openclaw/trajectory-exports/`

Jeśli eksport kończy się błędem rozmiaru, sesja lub plik pomocniczy przekroczyły
limity bezpieczeństwa eksportu. Rozpocznij nową sesję albo wyeksportuj mniejszą reprodukcję.

## Powiązane

- [Różnice](/pl/tools/diffs)
- [Zarządzanie sesją](/pl/concepts/session)
- [Narzędzie exec](/pl/tools/exec)
