---
read_when:
    - Chcesz odczytać zapisane podsumowania transkrypcji w terminalu
    - Potrzebujesz ścieżki do podsumowania transkrypcji w formacie Markdown
    - Debugujesz układ przechowywania głównych transkrypcji
summary: Dokumentacja CLI dla `openclaw transcripts` (wyświetlanie listy i szczegółów oraz lokalizowanie zapisanych transkrypcji)
title: CLI transkrypcji
x-i18n:
    generated_at: "2026-07-12T15:01:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspektor tylko do odczytu transkrypcji zapisanych przez narzędzie agenta `transcripts`.
Przechwytywanie, importowanie i podsumowywanie odbywają się za pomocą tego narzędzia, a nie tego CLI.

Artefakty znajdują się w katalogu stanu:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Domyślnym katalogiem stanu jest `~/.openclaw`; można go zmienić za pomocą `OPENCLAW_STATE_DIR`.
Katalog daty jest określany na podstawie czasu rozpoczęcia sesji, a katalog sesji ma postać
bezpiecznego dla systemu plików identyfikatora tekstowego utworzonego na podstawie identyfikatora sesji.

## Polecenia

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Polecenie                     | Opis                                                      |
| ----------------------------- | --------------------------------------------------------- |
| `list`                        | Wyświetla listę zapisanych sesji.                          |
| `show <session>`              | Wyświetla zawartość zapisanego pliku `summary.md`.         |
| `path <session>`              | Wyświetla ścieżkę do pliku `summary.md`.                   |
| `path <session> --dir`        | Wyświetla katalog sesji.                                   |
| `path <session> --metadata`   | Wyświetla ścieżkę do pliku `metadata.json`.                |
| `path <session> --transcript` | Wyświetla ścieżkę do pliku `transcript.jsonl`.             |
| `--json`                      | Wyświetla dane w formacie czytelnym maszynowo (dla każdego podpolecenia). |

`<session>` przyjmuje sam identyfikator sesji albo selektor zawierający datę
(`YYYY-MM-DD/<session>`). Użyj postaci z datą, gdy ten sam identyfikator sesji
występuje w więcej niż jednym dniu, na przykład `openclaw transcripts show
2026-05-22/standup`. Domyślne identyfikatory sesji zawierają znacznik czasu i losowy
sufiks; przypisuj sesji stały identyfikator tylko wtedy, gdy jest on unikatowy w danym dniu.

## Dane wyjściowe

`list` wyświetla dla każdej sesji jeden wiersz z polami rozdzielonymi tabulatorami: selektor, czas rozpoczęcia, tytuł,
ścieżka do podsumowania.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Cotygodniowe spotkanie robocze  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Selektor jest najbezpieczniejszą wartością do ponownego przekazania do `show` lub `path`.

`list --json` zwraca obiekty z polami `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` zwraca zapisane metadane sesji, selektor, katalog sesji,
ścieżkę do podsumowania oraz tekst podsumowania w formacie Markdown.

`path --json` zwraca wybraną ścieżkę oraz informację, czy dany plik istnieje.

## Wiele sesji dziennie

Sesje są grupowane najpierw według daty, a następnie identyfikatora sesji. Dziesięć spotkań jednego dnia utworzy
dziesięć równorzędnych katalogów:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Do automatyzacji używaj domyślnie generowanych identyfikatorów. Stałego identyfikatora, takiego jak `standup`, używaj tylko
wtedy, gdy nie powtórzy się on tego samego dnia.

## Brakujące podsumowania

Sesje na żywo zapisują plik `summary.md` po zatrzymaniu sesji; importowane transkrypcje
zapisują go natychmiast po imporcie. Sesja może pojawić się na liście `list` bez
podsumowania, gdy przechwytywanie jest nadal aktywne, jeśli dostawca zawiódł podczas zatrzymywania albo jeśli
metadane zostały zapisane przed nadejściem jakichkolwiek wypowiedzi.

Użyj `path <session> --transcript`, aby sprawdzić surową transkrypcję, do której dane są wyłącznie dopisywane,
albo uruchom akcję `summarize` narzędzia `transcripts`, aby ponownie wygenerować podsumowanie
w formacie Markdown.

## Konfiguracja

Przechwytywanie jest opcjonalne i wymaga włączenia (źródła na żywo mogą dołączać i nagrywać dźwięk spotkania). Włącz je
za pomocą:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (domyślnie `false`): włącza narzędzie.
- `maxUtterances` (domyślnie `2000`, ograniczone do zakresu 1–10000): rozmiar bufora wypowiedzi dla każdej
  sesji.

Skonfiguruj źródła uruchamiane automatycznie za pomocą `transcripts.autoStart`. Każdy wpis jest
włączany przez samą obecność; pomiń wpis, aby wyłączyć dane źródło. `discord-voice`
jest wbudowanym źródłem obsługującym automatyczne uruchamianie i wymaga pól `guildId` oraz
`channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
