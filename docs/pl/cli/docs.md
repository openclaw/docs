---
read_when:
    - Chcesz przeszukiwać aktualną dokumentację OpenClaw z poziomu terminala
    - Musisz wiedzieć, które hostowane API wyszukiwania wywołuje CLI dokumentacji
summary: Dokumentacja CLI dla `openclaw docs` (przeszukaj aktywny indeks dokumentacji)
title: Dokumentacja
x-i18n:
    generated_at: "2026-06-27T17:20:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Przeszukuj aktualny indeks dokumentacji OpenClaw z terminala. Polecenie wywołuje hostowane w Cloudflare API wyszukiwania dokumentacji OpenClaw i wyświetla wyniki w terminalu.

## Użycie

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumenty:

| Argument     | Opis                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| `[query...]` | Dowolne zapytanie wyszukiwania. Zapytania wielowyrazowe są łączone spacjami i wysyłane jako jedno. |

## Przykłady

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Bez zapytania `openclaw docs` wypisuje URL punktu wejścia dokumentacji oraz przykładowe polecenie wyszukiwania zamiast uruchamiać wyszukiwanie.

## Jak to działa

`openclaw docs` wywołuje `https://docs.openclaw.ai/api/search` i wyświetla wyniki JSON. Wywołanie wyszukiwania używa stałego limitu czasu 30 sekund.

## Dane wyjściowe

W terminalu z formatowaniem (TTY) wyniki są wyświetlane jako nagłówek, po którym następuje lista punktowana. Każdy punkt pokazuje tytuł strony, połączony URL dokumentacji oraz krótki fragment w następnym wierszu. Puste wyniki wypisują „Brak wyników.”.

W danych wyjściowych bez formatowania (potok, `--no-color`, skrypty) te same dane są wyświetlane jako Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Kody wyjścia

| Kod | Znaczenie                                                         |
| --- | ----------------------------------------------------------------- |
| `0` | Wyszukiwanie powiodło się (w tym odpowiedzi bez wyników).         |
| `1` | Wywołanie hostowanego API wyszukiwania dokumentacji nie powiodło się; stderr jest wypisywany w treści. |

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Aktualna dokumentacja](https://docs.openclaw.ai)
