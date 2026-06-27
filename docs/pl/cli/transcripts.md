---
read_when:
    - Chcesz czytać zapisane podsumowania transkrypcji z terminala
    - Potrzebujesz ścieżki do podsumowania transkryptów w Markdown
    - Debugujesz układ przechowywania transkryptów rdzenia
summary: Dokumentacja referencyjna CLI dla `openclaw transcripts` (wyświetlanie listy, pokazywanie i lokalizowanie przechowywanych transkrypcji)
title: CLI transkrypcji
x-i18n:
    generated_at: "2026-06-27T17:24:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Przeglądaj transkrypcje zapisywane przez podstawowe narzędzie `transcripts` OpenClaw. Ten CLI jest
tylko do odczytu; przechwytywanie, importowanie i podsumowywanie należą do narzędzia agenta oraz
skonfigurowanych źródeł automatycznego uruchamiania.

Użyj CLI, gdy chcesz znaleźć wczorajsze notatki, otworzyć plik Markdown w
edytorze, przekazać transkrypcję do innego narzędzia albo zdebugować, gdzie sesja trafiła na
dysk. Nie uruchamia ani nie zatrzymuje przechwytywania.

Artefakty znajdują się w katalogu stanu OpenClaw:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Domyślny katalog stanu to `~/.openclaw`; ustaw `OPENCLAW_STATE_DIR`, aby użyć
innego. Katalog daty pochodzi z czasu rozpoczęcia sesji, a katalog sesji jest
bezpiecznym segmentem systemu plików wyprowadzonym z identyfikatora sesji.

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

- `list`: wyświetla zapisane sesje, selektor z datą, czas rozpoczęcia, tytuł i ścieżkę `summary.md`.
- `show <session>`: wypisuje zapisany plik `summary.md`.
- `path <session>`: wypisuje ścieżkę `summary.md`.
- `path <session> --dir`: wypisuje katalog sesji.
- `path <session> --metadata`: wypisuje `metadata.json`.
- `path <session> --transcript`: wypisuje `transcript.jsonl`.
- `--json`: wypisuje dane wyjściowe czytelne maszynowo.

Gdy ludzki identyfikator sesji powtarza się w różnych dniach, użyj selektora z datą
z `list`, na przykład `openclaw transcripts show 2026-05-22/standup`.
Domyślne identyfikatory sesji zawierają znacznik czasu i losowy sufiks; konfiguruj stałe
identyfikatory sesji tylko wtedy, gdy są unikalne w danym dniu.

## Dane wyjściowe

`list` wypisuje jedną sesję na wiersz:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Dane wyjściowe są rozdzielone tabulatorami. Kolumny to selektor, czas rozpoczęcia, tytuł i
ścieżka podsumowania. Selektor jest najbezpieczniejszą wartością do ponownego przekazania do `show` lub `path`.

`list --json` wypisuje obiekty z polami:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` zwraca zapisane metadane sesji, selektor, katalog sesji,
ścieżkę podsumowania i tekst podsumowania Markdown. `path --json` zwraca wybraną ścieżkę
oraz informację, czy ten plik istnieje.

## Wiele spotkań dziennie

Transkrypcje grupują sesje według daty, a następnie według identyfikatora sesji. Dziesięć spotkań jednego
dnia staje się dziesięcioma równorzędnymi folderami:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

W większości automatyzacji używaj domyślnie generowanych identyfikatorów. Użyj stałego identyfikatora, takiego jak `standup`,
tylko wtedy, gdy ten sam identyfikator nie zostanie użyty dwa razy tego samego dnia.

## Brakujące podsumowania

Sesje na żywo zapisują `summary.md` po zatrzymaniu sesji. Zaimportowane transkrypcje
zapisują `summary.md` natychmiast po imporcie. Sesja może nadal pojawić się w
`list` bez podsumowania, gdy przechwytywanie jest aktywne, provider zawiódł podczas zatrzymywania
albo metadane zostały zapisane przed nadejściem jakichkolwiek wypowiedzi.

Użyj `path <session> --transcript`, aby sprawdzić transkrypcję tylko dopisywaną, oraz użyj
akcji `summarize` narzędzia `transcripts`, aby ponownie wygenerować podsumowanie Markdown.

## Konfiguracja

Przechwytywanie transkrypcji jest opcjonalne, ponieważ źródła na żywo mogą dołączać do spotkań i nagrywać
dźwięk. Włącz narzędzie za pomocą najwyższego poziomu `transcripts.enabled`:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

Skonfiguruj źródła automatycznego uruchamiania za pomocą `transcripts.autoStart` w `openclaw.json`.
Każdy wpis jest włączony przez samą obecność; pomiń wpis, aby wyłączyć to źródło.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
